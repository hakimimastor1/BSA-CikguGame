-- Learners' class for next year (the trial and classes are for 2027): stored beside this year's level.
alter table cs.signups add column if not exists level_next text;

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

  select ref into existing from cs.signups where event_id = e.id and whatsapp = phone;
  if existing is not null then
    return jsonb_build_object('ref', existing, 'existing', true);
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
    pl.nickname, pl.personality, pl.total_xp)
  on conflict (event_id, whatsapp) do nothing;

  select ref into existing from cs.signups where event_id = e.id and whatsapp = phone;
  return jsonb_build_object('ref', existing, 'existing', existing <> new_ref);
end;
$$;
