-- Two things for following up leads:
--   * Sign-ups that couldn't be saved at the booth (weak signal, "Teruskan ke WhatsApp") are kept
--     on the phone and sent once the signal is back. They keep the reference the WhatsApp message
--     showed, a client id stops duplicates, and Admin marks them as arriving late (delayed).
--   * Stats: a lead funnel by follow-up status, and days or roles with sign-ups but no plays.

alter table cs.signups add column if not exists client_id uuid;
create unique index if not exists signups_client_id on cs.signups (client_id) where client_id is not null;
alter table cs.signups add column if not exists delayed boolean not null default false;

create or replace function public.submit_signup(p_event text, p_play uuid, p jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  e cs.events := cs.event_by_slug(p_event);
  pl cs.plays;
  v_role text;
  phone text := cs.normalise_phone(p ->> 'whatsapp');
  nm text := cs.clean(p ->> 'name', 100);
  trial text[] := cs.text_array(p -> 'trialSubjects', 3);
  teach text[] := cs.text_array(p -> 'teachSubjects', 14);
  existing text;
  new_ref text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
  -- One id per filled-in form, so a retry or the phone's outbox never makes a second sign-up.
  cid uuid := case when p ->> 'clientId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                   then (p ->> 'clientId')::uuid end;
  want_ref text := upper(coalesce(p ->> 'ref', ''));
begin
  if cid is not null then
    select ref into existing from cs.signups where client_id = cid;
    if existing is not null then
      return jsonb_build_object('ref', existing, 'existing', true);
    end if;
  end if;
  if p_play is not null then
    select * into pl from cs.plays where id = p_play and event_id = e.id;
    if found then
      select ref into existing from cs.signups where play_id = p_play;
      if existing is not null then
        return jsonb_build_object('ref', existing, 'existing', true);
      end if;
    end if;
  end if;
  v_role := coalesce(pl.role, p ->> 'role');
  if v_role not in ('pelajar', 'ibubapa', 'cikgu') then
    raise exception 'bad role' using errcode = '22023';
  end if;
  if nm is null or phone is null or coalesce((p ->> 'consent')::boolean, false) is not true then
    raise exception 'missing fields' using errcode = '22023';
  end if;
  if v_role = 'cikgu' and cardinality(teach) = 0 then
    raise exception 'missing subjects' using errcode = '22023';
  end if;
  if v_role <> 'cikgu' and cardinality(trial) <> 3 then
    raise exception 'pick 3 subjects' using errcode = '22023';
  end if;

  -- The phone makes the reference up front, so the WhatsApp message and Admin show the same one
  -- even when the form is saved later. A taken or odd reference gets a fresh one.
  if want_ref ~ ('^' || e.ref_prefix || '-[A-HJ-NP-Z2-9]{4}$') and not exists (select 1 from cs.signups where ref = want_ref) then
    new_ref := want_ref;
  else
    loop
      new_ref := e.ref_prefix || '-';
      for i in 1..4 loop
        new_ref := new_ref || substr(chars, 1 + floor(random() * length(chars))::int, 1);
      end loop;
      exit when not exists (select 1 from cs.signups where ref = new_ref);
    end loop;
  end if;

  insert into cs.signups (
    event_id, play_id, ref, role, name, whatsapp, parent_name, under18, child_name, level, level_next, stream, school, area,
    trial_subjects, tutor_status, semester, cgpa, qualification, course, teach_subjects, availability,
    consent, marketing, lang, nickname, personality, total_xp, client_id, delayed)
  values (
    e.id, pl.id, new_ref, v_role, nm, phone,
    cs.clean(p ->> 'parentName', 100),
    case when v_role = 'pelajar' then coalesce((p ->> 'under18')::boolean, false) end,
    cs.clean(p ->> 'childName', 100),
    cs.clean(p ->> 'level', 40),
    case when v_role = 'cikgu' then null else cs.clean(p ->> 'levelNext', 40) end,
    case when v_role <> 'cikgu' and p ->> 'stream' in ('sains', 'sastera', 'agama', 'teknik', 'belum') then p ->> 'stream' end,
    cs.clean(p ->> 'school', 120),
    cs.clean(p ->> 'area', 80),
    case when v_role = 'cikgu' then '{}' else trial end,
    case when v_role = 'cikgu' and p ->> 'tutorStatus' in ('upsi', 'grad') then p ->> 'tutorStatus' end,
    cs.clean(p ->> 'semester', 2),
    cs.clean(p ->> 'cgpa', 4),
    cs.clean(p ->> 'qualification', 100),
    cs.clean(p ->> 'course', 100),
    case when v_role = 'cikgu' then teach else '{}' end,
    cs.text_array(p -> 'availability', 3, 20),
    true,
    coalesce((p ->> 'marketing')::boolean, false),
    case when p ->> 'lang' in ('ms', 'en') then p ->> 'lang' end,
    pl.nickname, pl.personality, pl.total_xp, cid, coalesce((p ->> 'delayed')::boolean, false));

  return jsonb_build_object('ref', new_ref, 'existing', false);
exception when unique_violation then
  -- The same form arrived twice at the same moment: answer with the one that was saved.
  select ref into existing from cs.signups where client_id = cid;
  if existing is null then
    raise;
  end if;
  return jsonb_build_object('ref', existing, 'existing', true);
end;
$$;

create or replace function public.staff_stats(p_event text) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare e cs.events;
begin
  perform cs.require_staff();
  e := cs.event_by_slug(p_event);
  return jsonb_build_object(
    'days', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day,
        'plays', (select count(*) from cs.plays p where p.event_id = e.id and p.day = d.day and p.finished_at is not null),
        'signups', (select count(*) from cs.signups s where s.event_id = e.id
                    and (s.created_at at time zone 'Asia/Kuala_Lumpur')::date = d.day)) order by d.day)
      from (select p.day from cs.plays p where p.event_id = e.id and p.finished_at is not null
            union
            select (s.created_at at time zone 'Asia/Kuala_Lumpur')::date from cs.signups s where s.event_id = e.id) d
    ), '[]'),
    'byRole', (
      select jsonb_object_agg(r.role, jsonb_build_object(
        'plays', (select count(*) from cs.plays p where p.event_id = e.id and p.role = r.role and p.finished_at is not null),
        'signups', (select count(*) from cs.signups s where s.event_id = e.id and s.role = r.role)))
      from unnest(array['pelajar', 'ibubapa', 'cikgu']) r(role)
    ),
    'byGame', coalesce((
      select jsonb_object_agg(g.game, g.plays)
      from (select p.game, count(*) filter (where p.finished_at is not null) plays
            from cs.plays p where p.event_id = e.id group by p.game) g
    ), '{}'),
    -- Leads by follow-up status: students and parents, and future tutors.
    'funnel', jsonb_build_object(
      'learner', coalesce((select jsonb_object_agg(x.status, x.n) from (
        select s.status, count(*) n from cs.signups s where s.event_id = e.id and s.role <> 'cikgu' group by s.status) x), '{}'),
      'tutor', coalesce((select jsonb_object_agg(x.status, x.n) from (
        select s.status, count(*) n from cs.signups s where s.event_id = e.id and s.role = 'cikgu' group by s.status) x), '{}')
    ),
    'delayed', (select count(*) from cs.signups s where s.event_id = e.id and s.delayed)
  );
end;
$$;
