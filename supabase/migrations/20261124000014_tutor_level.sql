-- Future tutors: `level` holds the level they'd teach (e.g. "Tingkatan 1–3", sent by the form).
-- Editing a tutor in Admin used to clear it; now it stays.

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
    -- Tutors keep the level they'd teach; a learner turned tutor has none yet.
    level = case when tutor and s.role = 'cikgu' then s.level when tutor then null else cs.clean(p ->> 'level', 40) end,
    level_next = case when tutor then null else cs.clean(p ->> 'levelNext', 40) end,
    stream = case when not tutor and p ->> 'stream' in ('sains', 'sastera', 'agama', 'teknik', 'belum') then p ->> 'stream' end,
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
