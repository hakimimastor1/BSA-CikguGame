-- Admins can correct a sign-up's details (spelling, number, next year's class, school, subjects…).
-- Same checks as the sign-up form; the role, reference, game results and consent stay as they were.
-- Booth staff keep updating only status and notes (staff_update_signup).

alter table cs.signups add column if not exists edited_at timestamptz;
alter table cs.signups add column if not exists edited_by text;

create or replace function public.staff_edit_signup(p_id uuid, p jsonb) returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  s cs.signups;
  nm text := cs.clean(p ->> 'name', 100);
  phone text := cs.normalise_phone(p ->> 'whatsapp');
  trial text[] := cs.text_array(p -> 'trialSubjects', 3);
  teach text[] := cs.text_array(p -> 'teachSubjects', 14);
  clash text;
  tutor boolean;
begin
  if cs.require_staff() <> 'admin' then
    raise exception 'admin only' using errcode = '42501';
  end if;
  select * into s from cs.signups where id = p_id for update;
  if not found then
    raise exception 'unknown signup' using errcode = '22023';
  end if;
  tutor := s.role = 'cikgu';

  if nm is null then
    raise exception 'name required' using errcode = '22023';
  end if;
  if phone is null then
    raise exception 'bad phone' using errcode = '22023';
  end if;
  -- One number per event: say which sign-up already has it.
  select x.ref into clash from cs.signups x where x.event_id = s.event_id and x.whatsapp = phone and x.id <> s.id;
  if clash is not null then
    raise exception 'phone used by %', clash using errcode = '23505';
  end if;
  if tutor and cardinality(teach) = 0 then
    raise exception 'missing subjects' using errcode = '22023';
  end if;
  if not tutor and cardinality(trial) <> 3 then
    raise exception 'pick 3 subjects' using errcode = '22023';
  end if;

  update cs.signups set
    name = nm,
    whatsapp = phone,
    parent_name = case when s.role = 'pelajar' then cs.clean(p ->> 'parentName', 100) else s.parent_name end,
    under18 = case when s.role = 'pelajar' then coalesce((p ->> 'under18')::boolean, false) else s.under18 end,
    child_name = case when s.role = 'ibubapa' then cs.clean(p ->> 'childName', 100) else s.child_name end,
    level = case when tutor then s.level else cs.clean(p ->> 'level', 40) end,
    level_next = case when tutor then s.level_next else cs.clean(p ->> 'levelNext', 40) end,
    school = case when tutor then s.school else cs.clean(p ->> 'school', 120) end,
    area = cs.clean(p ->> 'area', 80),
    trial_subjects = case when tutor then s.trial_subjects else trial end,
    tutor_status = case when tutor and p ->> 'tutorStatus' in ('upsi', 'grad') then p ->> 'tutorStatus' else s.tutor_status end,
    semester = case when tutor then cs.clean(p ->> 'semester', 2) else s.semester end,
    cgpa = case when tutor then cs.clean(p ->> 'cgpa', 4) else s.cgpa end,
    qualification = case when tutor then cs.clean(p ->> 'qualification', 100) else s.qualification end,
    course = case when tutor then cs.clean(p ->> 'course', 100) else s.course end,
    teach_subjects = case when tutor then teach else s.teach_subjects end,
    availability = case when tutor then cs.text_array(p -> 'availability', 3, 20) else s.availability end,
    marketing = coalesce((p ->> 'marketing')::boolean, s.marketing),
    edited_at = now(),
    edited_by = lower(coalesce(auth.jwt() ->> 'email', '')),
    updated_at = now()
  where id = p_id
  returning * into s;

  return to_jsonb(s) - 'event_id' - 'play_id';
end;
$$;

revoke all on function public.staff_edit_signup(uuid, jsonb) from public, anon;
grant execute on function public.staff_edit_signup(uuid, jsonb) to authenticated;
