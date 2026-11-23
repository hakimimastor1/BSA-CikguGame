-- Families may register more than once with the same number (one parent, several children), so the
-- one-number-per-event rule goes. Submitting the same game twice (a double tap or a retry) still gives
-- back the first reference. Admins can now correct everything a visitor typed, the role included.

alter table cs.signups drop constraint if exists signups_event_id_whatsapp_key;
create index if not exists signups_event_whatsapp on cs.signups (event_id, whatsapp);

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
begin
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

  loop
    new_ref := e.ref_prefix || '-';
    for i in 1..4 loop
      new_ref := new_ref || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from cs.signups where ref = new_ref);
  end loop;

  insert into cs.signups (
    event_id, play_id, ref, role, name, whatsapp, parent_name, under18, child_name, level, level_next, school, area,
    trial_subjects, tutor_status, semester, cgpa, qualification, course, teach_subjects, availability,
    consent, marketing, lang, nickname, personality, total_xp)
  values (
    e.id, pl.id, new_ref, v_role, nm, phone,
    cs.clean(p ->> 'parentName', 100),
    case when v_role = 'pelajar' then coalesce((p ->> 'under18')::boolean, false) end,
    cs.clean(p ->> 'childName', 100),
    cs.clean(p ->> 'level', 40),
    case when v_role = 'cikgu' then null else cs.clean(p ->> 'levelNext', 40) end,
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
    pl.nickname, pl.personality, pl.total_xp);

  return jsonb_build_object('ref', new_ref, 'existing', false);
end;
$$;

create or replace function public.staff_edit_signup(p_id uuid, p jsonb) returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  s cs.signups;
  nm text := cs.clean(p ->> 'name', 100);
  phone text := cs.normalise_phone(p ->> 'whatsapp');
  trial text[] := cs.text_array(p -> 'trialSubjects', 3);
  teach text[] := cs.text_array(p -> 'teachSubjects', 14);
  v_role text;
  tutor boolean;
  v_status text;
begin
  if cs.require_staff() <> 'admin' then
    raise exception 'admin only' using errcode = '42501';
  end if;
  select * into s from cs.signups where id = p_id for update;
  if not found then
    raise exception 'unknown signup' using errcode = '22023';
  end if;
  -- The role can be corrected too (a parent who tapped "Pelajar sekolah", say).
  v_role := coalesce(nullif(p ->> 'role', ''), s.role);
  if v_role not in ('pelajar', 'ibubapa', 'cikgu') then
    raise exception 'bad role' using errcode = '22023';
  end if;
  tutor := v_role = 'cikgu';

  if nm is null then
    raise exception 'name required' using errcode = '22023';
  end if;
  if phone is null then
    raise exception 'bad phone' using errcode = '22023';
  end if;
  if tutor and cardinality(teach) = 0 then
    raise exception 'missing subjects' using errcode = '22023';
  end if;
  if not tutor and cardinality(trial) <> 3 then
    raise exception 'pick 3 subjects' using errcode = '22023';
  end if;

  -- Learner and tutor follow-ups have different steps: start again at 'new' if the step doesn't apply.
  v_status := case
    when tutor and s.status in ('trial_booked', 'enrolled', 'not_interested') then 'new'
    when not tutor and s.status in ('interviewed', 'hired', 'not_suitable') then 'new'
    else s.status end;

  update cs.signups set
    role = v_role,
    status = v_status,
    name = nm,
    whatsapp = phone,
    parent_name = case when v_role = 'pelajar' then cs.clean(p ->> 'parentName', 100) end,
    under18 = case when v_role = 'pelajar' then coalesce((p ->> 'under18')::boolean, false) end,
    child_name = case when v_role = 'ibubapa' then cs.clean(p ->> 'childName', 100) end,
    level = case when tutor then null else cs.clean(p ->> 'level', 40) end,
    level_next = case when tutor then null else cs.clean(p ->> 'levelNext', 40) end,
    school = case when tutor then null else cs.clean(p ->> 'school', 120) end,
    area = cs.clean(p ->> 'area', 80),
    trial_subjects = case when tutor then '{}' else trial end,
    tutor_status = case when tutor then (case when p ->> 'tutorStatus' in ('upsi', 'grad') then p ->> 'tutorStatus' else 'upsi' end) end,
    semester = case when tutor then cs.clean(p ->> 'semester', 2) end,
    cgpa = case when tutor then cs.clean(p ->> 'cgpa', 4) end,
    qualification = case when tutor then cs.clean(p ->> 'qualification', 100) end,
    course = case when tutor then cs.clean(p ->> 'course', 100) end,
    teach_subjects = case when tutor then teach else '{}' end,
    availability = case when tutor then cs.text_array(p -> 'availability', 3, 20) else '{}' end,
    marketing = coalesce((p ->> 'marketing')::boolean, s.marketing),
    edited_at = now(),
    edited_by = lower(coalesce(auth.jwt() ->> 'email', '')),
    updated_at = now()
  where id = p_id
  returning * into s;

  return to_jsonb(s) - 'event_id' - 'play_id';
end;
$$;

create or replace function public.staff_clear_test_data(p_event text) returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  e cs.events;
  arch uuid;
  n_plays int;
  n_moved int;
begin
  if cs.require_staff() <> 'admin' then
    raise exception 'admin only' using errcode = '42501';
  end if;
  e := cs.event_by_slug(p_event);
  -- Once the event has started, every play and sign-up is real: never clear them.
  if cs.today() >= e.starts_on then
    raise exception 'event already started' using errcode = '22023';
  end if;

  select id into arch from cs.events where slug = 'test-archive';
  if arch is null then
    insert into cs.events (slug, name, starts_on, ends_on, offer_code, whatsapp, ref_prefix, active)
    values ('test-archive', 'Test data (archive)', '2000-01-01', '2000-01-01', '-', e.whatsapp, 'TX', false)
    returning id into arch;
  end if;

  update cs.signups set event_id = arch where event_id = e.id;
  get diagnostics n_moved = row_count;
  update cs.plays set event_id = arch where event_id = e.id;
  get diagnostics n_plays = row_count;
  update cs.events set board_reset_at = null where id = e.id;

  return jsonb_build_object('plays', n_plays, 'signups', n_moved);
end;
$$;
