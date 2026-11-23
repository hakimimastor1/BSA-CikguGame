-- Form 4–5 streams (aliran).
-- Pupils in Tingkatan 4–5 take different subjects by stream, so the game asks their stream and the
-- quiz follows it: Sains Tulen gets BI, Matematik and 2 sciences (as before); Sastera & Kemanusiaan,
-- Agama, Teknik & Vokasional and "Belum pasti" get BM, BI and Matematik.
-- The sign-up form asks the stream for next year's class (Tingkatan 4 or 5 in 2027), so BSA can
-- suggest the right trial subjects; admins can correct it like every other detail.
--   sains = Sains Tulen · sastera = Sastera & Kemanusiaan · agama = Agama
--   teknik = Teknik & Vokasional · belum = Belum pasti

alter table cs.plays add column if not exists stream text
  check (stream in ('sains', 'sastera', 'agama', 'teknik', 'belum'));
alter table cs.signups add column if not exists stream text
  check (stream in ('sains', 'sastera', 'agama', 'teknik', 'belum'));

-- Replace begin_play rather than add an overload, so PostgREST never has two to choose from.
drop function if exists public.begin_play(text, text, text, text, text, text[], text);

create function public.begin_play(
  p_event text, p_nickname text, p_role text, p_band text, p_lang text, p_teach text[] default '{}',
  p_game text default null, p_stream text default null
) returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  e cs.events := cs.event_by_slug(p_event);
  nick text := cs.clean(p_nickname, 20);
  v_game text := coalesce(p_game, case when p_role = 'pelajar' then 'pelajar' else 'cikgu' end);
  available text[];
  picked text[];
  subjects text[];
  qids text[] := '{}';
  s text;
  per int;
  play_id uuid;
  -- Form 4–5 learners say their stream; tutors pick subjects instead.
  v_stream text := case when p_band = 'f4_5' and p_role <> 'cikgu' and p_stream in ('sains', 'sastera', 'agama', 'teknik', 'belum') then p_stream end;
begin
  if p_role not in ('pelajar', 'ibubapa', 'cikgu') or p_band not in ('std1_3', 'std4_6', 'f1_3', 'f4_5')
     or p_lang not in ('ms', 'en') or v_game not in ('cikgu', 'pelajar')
     or (p_role = 'pelajar' and v_game <> 'pelajar') or (p_role = 'cikgu' and v_game <> 'cikgu') then
    raise exception 'bad input' using errcode = '22023';
  end if;
  if not cs.nickname_ok(nick) then
    raise exception 'bad nickname' using errcode = '22023';
  end if;

  available := case when p_band = 'f4_5' then array['bm', 'bi', 'math', 'phy', 'chem', 'bio']
                    else array['bm', 'bi', 'math', 'sci'] end;
  select coalesce(array_agg(x), '{}') into picked
  from (select distinct x from unnest(coalesce(p_teach, '{}')) x where x = any (available) limit 3) t;

  if p_band = 'f4_5' and cardinality(picked) = 0 and coalesce(v_stream, 'sains') <> 'sains' then
    -- Sastera, Agama, Teknik or not sure yet: the core SPM subjects every stream takes.
    subjects := array['bm', 'bi', 'math'];
  elsif p_band = 'f4_5' and cardinality(picked) = 0 then
    -- Sains Tulen (and older clients that don't send a stream): BI, Matematik and 2 of the 3 sciences.
    subjects := array['bi', 'math'] || array(select x from unnest(array['phy', 'chem', 'bio']) x order by random() limit 2);
  else
    subjects := picked || array(select x from unnest(available) x where not x = any (picked) order by random());
    subjects := subjects[1:4];
  end if;

  -- 8 items spread over the subjects (2 each for 4 subjects, 3 each for 3, trimmed to 8),
  -- with a right answer shown and a wrong one in every subject where possible.
  per := ceil(8.0 / cardinality(subjects))::int;
  foreach s in array subjects loop
    qids := qids || array(
      select id from (
        (select id, 0 as k from cs.questions where band = p_band and subject = s and active and correct order by random() limit 1)
        union all
        (select id, 0 from cs.questions where band = p_band and subject = s and active and not correct order by random() limit 1)
        union all
        (select id, 1 from cs.questions where band = p_band and subject = s and active order by random() limit per)
      ) c group by id order by min(k), random() limit per);
  end loop;
  qids := array(select x from unnest(qids) x order by random() limit 8);

  insert into cs.plays (event_id, day, nickname, role, band, lang, teach_subjects, question_ids, game, stream)
  values (e.id, cs.today(), nick, p_role, p_band, p_lang, picked, qids, v_game, v_stream)
  returning id into play_id;

  return jsonb_build_object(
    'play_id', play_id,
    'questions', (
      select jsonb_agg(jsonb_build_object('id', q.id, 'band', q.band, 'subject', q.subject, 'q', q.q, 'a', q.a,
                                          'correct', q.correct, 'fix', q.fix) order by o.n)
      from unnest(qids) with ordinality o(id, n) join cs.questions q on q.id = o.id
    )
  );
end;
$$;

revoke all on function public.begin_play(text, text, text, text, text, text[], text, text) from public;
grant execute on function public.begin_play(text, text, text, text, text, text[], text, text) to anon, authenticated;

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
    event_id, play_id, ref, role, name, whatsapp, parent_name, under18, child_name, level, level_next, stream, school, area,
    trial_subjects, tutor_status, semester, cgpa, qualification, course, teach_subjects, availability,
    consent, marketing, lang, nickname, personality, total_xp)
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
