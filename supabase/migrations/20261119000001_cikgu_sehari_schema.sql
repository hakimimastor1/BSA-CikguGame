-- Cikgu Sehari: schema, security and server functions.
--
-- Design:
-- * All tables live in the private schema `cs`, which the Supabase API does not expose.
-- * Visitors (anon) can only call the game functions below: start_play, finish_play,
--   submit_signup and leaderboard. They never read personal data.
-- * Staff (authenticated users whose email is in cs.staff) call the staff_* functions.
-- * Scores are worked out here from the player's answers, never trusted from the phone.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists cs;
revoke all on schema cs from public, anon, authenticated;

-- ---------------------------------------------------------------- tables

create table cs.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  starts_on date not null,
  ends_on date not null,
  offer_code text not null,
  offer_valid_until date,
  whatsapp text not null check (whatsapp ~ '^601[0-9]{8,9}$'),
  ref_prefix text not null default 'PK' check (ref_prefix ~ '^[A-Z]{1,4}$'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table cs.questions (
  id text primary key,
  band text not null check (band in ('std1_3', 'std4_6', 'f1_3', 'f4_5')),
  subject text not null check (subject in ('bm', 'bi', 'math', 'sci', 'phy', 'chem', 'bio')),
  q jsonb not null,
  a jsonb not null,
  fix jsonb not null,
  correct boolean not null,
  active boolean not null default true
);
create index questions_band_subject on cs.questions (band, subject) where active;

create table cs.story_choices (
  id text primary key,
  scene text not null,
  trait text check (trait in ('kreatif', 'penyayang', 'strategik', 'inspirasi')),
  xp int not null check (xp between 0 and 50)
);

create table cs.plays (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references cs.events (id),
  day date not null,
  nickname text not null,
  role text not null check (role in ('pelajar', 'ibubapa', 'cikgu')),
  band text not null check (band in ('std1_3', 'std4_6', 'f1_3', 'f4_5')),
  lang text not null check (lang in ('ms', 'en')),
  teach_subjects text[] not null default '{}',
  question_ids text[] not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  story_choices text[],
  marks jsonb,
  story_xp int,
  semak_xp int,
  total_xp int,
  personality text,
  subjects jsonb,
  suspicious boolean not null default false,
  hidden boolean not null default false
);
create index plays_board on cs.plays (event_id, day, total_xp desc) where finished_at is not null;

create table cs.signups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references cs.events (id),
  play_id uuid references cs.plays (id),
  ref text not null unique,
  role text not null check (role in ('pelajar', 'ibubapa', 'cikgu')),
  name text not null,
  whatsapp text not null check (whatsapp ~ '^601[0-9]{8,9}$'),
  parent_name text,
  under18 boolean,
  child_name text,
  level text,
  school text,
  area text,
  trial_subjects text[] not null default '{}',
  tutor_status text check (tutor_status in ('upsi', 'grad')),
  semester text,
  cgpa text,
  qualification text,
  course text,
  teach_subjects text[] not null default '{}',
  availability text[] not null default '{}',
  consent boolean not null check (consent),
  marketing boolean not null default false,
  lang text,
  nickname text,
  personality text,
  total_xp int,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'trial_booked', 'enrolled', 'interviewed', 'hired', 'not_interested', 'not_suitable')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, whatsapp)
);
create index signups_event_created on cs.signups (event_id, created_at desc);

create table cs.staff (
  email text primary key check (email = lower(email)),
  role text not null check (role in ('admin', 'booth')),
  name text
);

-- Defence in depth: the schema is private, and RLS with no policies blocks direct access too.
alter table cs.events enable row level security;
alter table cs.questions enable row level security;
alter table cs.story_choices enable row level security;
alter table cs.plays enable row level security;
alter table cs.signups enable row level security;
alter table cs.staff enable row level security;

-- ---------------------------------------------------------------- helpers

create or replace function cs.today() returns date
language sql stable set search_path = ''
as $$ select (now() at time zone 'Asia/Kuala_Lumpur')::date $$;

create or replace function cs.clean(t text, max_len int default 120) returns text
language sql immutable set search_path = ''
as $$ select nullif(left(btrim(regexp_replace(coalesce(t, ''), '\s+', ' ', 'g')), max_len), '') $$;

create or replace function cs.nickname_ok(n text) returns boolean
language plpgsql immutable set search_path = ''
as $$
declare
  flat text;
  squashed text;
  w text;
  blocked text[] := array[
    'babi', 'bodoh', 'sial', 'puki', 'pukimak', 'lancau', 'butoh', 'kote', 'pantat', 'jubur', 'haramjadah',
    'bangsat', 'celaka', 'keparat', 'pelacur', 'sundal', 'bapuk', 'pondan', 'anjing', 'bengap', 'bahlul',
    'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'bastard', 'asshole', 'slut', 'whore', 'nigga', 'nigger', 'porn', 'sex'];
begin
  if n is null or char_length(btrim(n)) < 3 or char_length(btrim(n)) > 20 then
    return false;
  end if;
  flat := translate(lower(n), '0@1!|345$', 'oaiiieass');
  flat := regexp_replace(flat, '[^a-z ]', '', 'g');
  squashed := replace(flat, ' ', '');
  foreach w in array blocked loop
    if position(w in squashed) > 0 then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function cs.normalise_phone(p text) returns text
language plpgsql immutable set search_path = ''
as $$
declare d text := regexp_replace(coalesce(p, ''), '\D', '', 'g');
begin
  if d like '0%' then d := '6' || d;
  elsif d like '1%' then d := '60' || d;
  end if;
  if d ~ '^601[0-9]{8,9}$' then return d; end if;
  return null;
end;
$$;

create or replace function cs.text_array(j jsonb, max_items int, max_len int default 40) returns text[]
language sql immutable set search_path = ''
as $$
  select coalesce(array_agg(v), '{}')
  from (
    select distinct cs.clean(x, max_len) as v
    from jsonb_array_elements_text(case when jsonb_typeof(j) = 'array' then j else '[]'::jsonb end) as x
    limit max_items
  ) s
  where v is not null
$$;

create or replace function cs.my_role() returns text
language sql stable security definer set search_path = ''
as $$
  select s.role from cs.staff s
  where s.email = lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function cs.require_staff() returns text
language plpgsql stable security definer set search_path = ''
as $$
declare r text := cs.my_role();
begin
  if r is null then
    raise exception 'not staff' using errcode = '42501';
  end if;
  return r;
end;
$$;

create or replace function cs.event_by_slug(p_slug text) returns cs.events
language plpgsql stable security definer set search_path = ''
as $$
declare e cs.events;
begin
  select * into e from cs.events where slug = p_slug and active;
  if not found then
    raise exception 'unknown event' using errcode = '22023';
  end if;
  return e;
end;
$$;

-- Best score per nickname for an event day, without hidden or suspicious plays.
create or replace function cs.board(p_event uuid, p_day date)
returns table (nickname text, total_xp int, personality text, finished_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select distinct on (lower(p.nickname)) p.nickname, p.total_xp, p.personality, p.finished_at
  from cs.plays p
  where p.event_id = p_event and p.day = p_day and p.finished_at is not null
    and not p.hidden and not p.suspicious
  order by lower(p.nickname), p.total_xp desc, p.finished_at asc
$$;

-- ---------------------------------------------------------------- game functions (anon)

create or replace function public.start_play(
  p_event text, p_nickname text, p_role text, p_band text, p_lang text, p_teach text[] default '{}'
) returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  e cs.events := cs.event_by_slug(p_event);
  nick text := cs.clean(p_nickname, 20);
  available text[];
  picked text[];
  subjects text[];
  qids text[] := '{}';
  s text;
  play_id uuid;
begin
  if p_role not in ('pelajar', 'ibubapa', 'cikgu') or p_band not in ('std1_3', 'std4_6', 'f1_3', 'f4_5')
     or p_lang not in ('ms', 'en') then
    raise exception 'bad input' using errcode = '22023';
  end if;
  if not cs.nickname_ok(nick) then
    raise exception 'bad nickname' using errcode = '22023';
  end if;

  available := case when p_band = 'f4_5' then array['bm', 'bi', 'math', 'phy', 'chem', 'bio']
                    else array['bm', 'bi', 'math', 'sci'] end;
  select coalesce(array_agg(x), '{}') into picked
  from (select distinct x from unnest(coalesce(p_teach, '{}')) x where x = any (available) limit 3) t;

  if p_band = 'f4_5' and cardinality(picked) = 0 then
    subjects := array['bi', 'math'] || array(select x from unnest(array['phy', 'chem', 'bio']) x order by random() limit 2);
  else
    subjects := picked || array(select x from unnest(available) x where not x = any (picked) order by random());
    subjects := subjects[1:4];
  end if;

  -- Two items per subject: one with a right pupil answer and one with a wrong one, where possible.
  foreach s in array subjects loop
    qids := qids || array(
      select id from (
        (select id, 0 as k from cs.questions where band = p_band and subject = s and active and correct order by random() limit 1)
        union all
        (select id, 0 from cs.questions where band = p_band and subject = s and active and not correct order by random() limit 1)
        union all
        (select id, 1 from cs.questions where band = p_band and subject = s and active order by random() limit 2)
      ) c group by id order by min(k), random() limit 2);
  end loop;
  qids := array(select x from unnest(qids) x order by random() limit 8);

  insert into cs.plays (event_id, day, nickname, role, band, lang, teach_subjects, question_ids)
  values (e.id, cs.today(), nick, p_role, p_band, p_lang, picked, qids)
  returning id into play_id;

  -- The answer keys go to the phone so feedback is instant. The score is still worked out
  -- on the server in finish_play, with timing checks, so it can't be inflated.
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

create or replace function public.finish_play(p_play uuid, p_choices text[], p_marks jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  p cs.plays;
  story int := 0;
  traits jsonb := '{"kreatif":0,"penyayang":0,"strategik":0,"inspirasi":0}';
  v_pers text;
  semak int := 0;
  streak int := 0;
  right_marks int := 0;
  total_ms int := 0;
  qid text;
  qrow cs.questions;
  m jsonb;
  ms int;
  ok boolean;
  subj jsonb := '{}';
  elapsed numeric;
  sus boolean := false;
  v_rank int;
  players int;
  c record;
begin
  select * into p from cs.plays where id = p_play for update;
  if not found then
    raise exception 'unknown play' using errcode = '22023';
  end if;
  if p.finished_at is not null then
    raise exception 'already finished' using errcode = '22023';
  end if;
  elapsed := extract(epoch from now() - p.started_at);
  if elapsed > 3600 then
    raise exception 'play expired' using errcode = '22023';
  end if;

  -- Story: exactly one valid choice per scene.
  if coalesce(cardinality(p_choices), 0) <> 5
     or (select count(distinct sc.scene) from cs.story_choices sc where sc.id = any (p_choices)) <> 5 then
    raise exception 'bad choices' using errcode = '22023';
  end if;
  for c in select sc.trait, sc.xp from cs.story_choices sc where sc.id = any (p_choices) loop
    story := story + c.xp;
    if c.trait is not null then
      traits := jsonb_set(traits, array[c.trait], to_jsonb((traits ->> c.trait)::int + 1));
    end if;
  end loop;
  select t into v_pers
  from unnest(array['kreatif', 'penyayang', 'strategik', 'inspirasi']) with ordinality u(t, n)
  order by (traits ->> t)::int desc, n
  limit 1;

  -- Semak Kerja, in the order the questions were shown.
  foreach qid in array p.question_ids loop
    select * into qrow from cs.questions where id = qid;
    select x into m from jsonb_array_elements(case when jsonb_typeof(p_marks) = 'array' then p_marks else '[]' end) x
    where x ->> 'id' = qid limit 1;
    ms := least(greatest(coalesce((m ->> 'ms')::int, 0), 0), 60000);
    ok := m is not null and jsonb_typeof(m -> 'verdict') = 'boolean' and (m ->> 'verdict')::boolean = qrow.correct;
    if m is not null then
      total_ms := total_ms + ms;
      if ms < 250 then sus := true; end if;
    end if;
    if ok then
      semak := semak + 20 + greatest(0, round(5 * (1 - ms / 5000.0)))::int + case when streak >= 2 then 5 else 0 end;
      streak := streak + 1;
      right_marks := right_marks + 1;
    else
      streak := 0;
    end if;
    subj := jsonb_set(subj, array[qrow.subject], jsonb_build_object(
      'subject', qrow.subject,
      'right', coalesce((subj -> qrow.subject ->> 'right')::int, 0) + case when ok then 1 else 0 end,
      'total', coalesce((subj -> qrow.subject ->> 'total')::int, 0) + 1));
  end loop;

  -- Too fast to be a person reading the screens: keep the play but leave it off the leaderboard.
  if elapsed < 20 or total_ms > 50000 or total_ms / 1000.0 > elapsed + 5 then
    sus := true;
  end if;

  update cs.plays set
    finished_at = now(),
    story_choices = p_choices,
    marks = p_marks,
    story_xp = story,
    semak_xp = semak,
    total_xp = story + semak,
    personality = v_pers,
    subjects = (select coalesce(jsonb_agg(v), '[]') from jsonb_each(subj) j(k, v)),
    suspicious = sus
  where id = p_play;

  select count(*) + 1 into v_rank from cs.board(p.event_id, p.day) b
  where b.total_xp > story + semak and lower(b.nickname) <> lower(p.nickname);
  select count(*) into players from cs.board(p.event_id, p.day);

  return jsonb_build_object(
    'storyXp', story,
    'semakXp', semak,
    'totalXp', story + semak,
    'personality', v_pers,
    'traitCounts', traits,
    'subjects', (select coalesce(jsonb_agg(v), '[]') from jsonb_each(subj) j(k, v)),
    'rightMarks', right_marks,
    'rank', case when sus then null else v_rank end,
    'players', players
  );
end;
$$;

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
    event_id, play_id, ref, role, name, whatsapp, parent_name, under18, child_name, level, school, area,
    trial_subjects, tutor_status, semester, cgpa, qualification, course, teach_subjects, availability,
    consent, marketing, lang, nickname, personality, total_xp)
  values (
    e.id, pl.id, new_ref, v_role, nm, phone,
    cs.clean(p ->> 'parentName', 100),
    case when v_role = 'pelajar' then coalesce((p ->> 'under18')::boolean, false) end,
    cs.clean(p ->> 'childName', 100),
    cs.clean(p ->> 'level', 40),
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

create or replace function public.leaderboard(p_event text, p_limit int default 10)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  e cs.events := cs.event_by_slug(p_event);
  d date := cs.today();
begin
  return jsonb_build_object(
    'event', jsonb_build_object('name', e.name, 'offerCode', e.offer_code, 'offerValidUntil', e.offer_valid_until),
    'day', d,
    'top', coalesce((
      select jsonb_agg(jsonb_build_object('nickname', b.nickname, 'xp', b.total_xp, 'personality', b.personality)
                       order by b.total_xp desc, b.finished_at asc)
      from (select * from cs.board(e.id, d) order by total_xp desc, finished_at asc limit least(greatest(p_limit, 1), 20)) b
    ), '[]'),
    'latest', coalesce((
      select jsonb_agg(jsonb_build_object('nickname', l.nickname, 'xp', l.total_xp, 'personality', l.personality) order by l.finished_at desc)
      from (
        select p.nickname, p.total_xp, p.personality, p.finished_at from cs.plays p
        where p.event_id = e.id and p.day = d and p.finished_at is not null and not p.hidden and not p.suspicious
        order by p.finished_at desc limit 8
      ) l
    ), '[]'),
    'players', (select count(*) from cs.plays p where p.event_id = e.id and p.day = d and p.finished_at is not null),
    'mix', coalesce((
      select jsonb_object_agg(personality, n) from (
        select p.personality, count(*) n from cs.plays p
        where p.event_id = e.id and p.day = d and p.finished_at is not null group by p.personality
      ) m
    ), '{}')
  );
end;
$$;

-- ---------------------------------------------------------------- staff functions (authenticated)

create or replace function public.staff_me() returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('email', s.email, 'role', s.role, 'name', s.name)
  from cs.staff s where s.email = lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function public.staff_signups(p_event text) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare e cs.events;
begin
  perform cs.require_staff();
  e := cs.event_by_slug(p_event);
  return coalesce((
    select jsonb_agg(to_jsonb(s) - 'event_id' - 'play_id' order by s.created_at desc)
    from cs.signups s where s.event_id = e.id
  ), '[]');
end;
$$;

create or replace function public.staff_update_signup(p_id uuid, p_status text, p_notes text) returns void
language plpgsql volatile security definer set search_path = ''
as $$
begin
  perform cs.require_staff();
  update cs.signups
  set status = coalesce(p_status, status),
      notes = case when p_notes is null then notes else cs.clean(p_notes, 1000) end,
      updated_at = now()
  where id = p_id;
end;
$$;

create or replace function public.staff_board(p_event text, p_day date default null) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  e cs.events;
  d date := coalesce(p_day, cs.today());
begin
  perform cs.require_staff();
  e := cs.event_by_slug(p_event);
  return coalesce((
    select jsonb_agg(x order by (x ->> 'xp')::int desc)
    from (
      select distinct on (lower(p.nickname)) jsonb_build_object(
        'nickname', p.nickname, 'xp', p.total_xp, 'personality', p.personality,
        'hidden', bool_or(p.hidden) over (partition by lower(p.nickname)),
        'suspicious', p.suspicious, 'role', p.role) x
      from cs.plays p
      where p.event_id = e.id and p.day = d and p.finished_at is not null
      order by lower(p.nickname), p.total_xp desc
    ) t
  ), '[]');
end;
$$;

create or replace function public.staff_set_hidden(p_event text, p_nickname text, p_hidden boolean) returns void
language plpgsql volatile security definer set search_path = ''
as $$
declare e cs.events;
begin
  perform cs.require_staff();
  e := cs.event_by_slug(p_event);
  update cs.plays set hidden = p_hidden where event_id = e.id and lower(nickname) = lower(p_nickname);
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
      select jsonb_agg(jsonb_build_object('day', d.day, 'plays', d.plays,
        'signups', (select count(*) from cs.signups s where s.event_id = e.id
                    and (s.created_at at time zone 'Asia/Kuala_Lumpur')::date = d.day)) order by d.day)
      from (select p.day, count(*) filter (where p.finished_at is not null) plays
            from cs.plays p where p.event_id = e.id group by p.day) d
    ), '[]'),
    'byRole', coalesce((
      select jsonb_object_agg(r.role, jsonb_build_object('plays', r.plays, 'signups',
        (select count(*) from cs.signups s where s.event_id = e.id and s.role = r.role)))
      from (select p.role, count(*) filter (where p.finished_at is not null) plays
            from cs.plays p where p.event_id = e.id group by p.role) r
    ), '{}')
  );
end;
$$;

-- ---------------------------------------------------------------- grants

revoke all on all functions in schema cs from public, anon, authenticated;

revoke all on function public.start_play(text, text, text, text, text, text[]) from public;
revoke all on function public.finish_play(uuid, text[], jsonb) from public;
revoke all on function public.submit_signup(text, uuid, jsonb) from public;
revoke all on function public.leaderboard(text, int) from public;
grant execute on function public.start_play(text, text, text, text, text, text[]) to anon, authenticated;
grant execute on function public.finish_play(uuid, text[], jsonb) to anon, authenticated;
grant execute on function public.submit_signup(text, uuid, jsonb) to anon, authenticated;
grant execute on function public.leaderboard(text, int) to anon, authenticated;

revoke all on function public.staff_me() from public, anon;
revoke all on function public.staff_signups(text) from public, anon;
revoke all on function public.staff_update_signup(uuid, text, text) from public, anon;
revoke all on function public.staff_board(text, date) from public, anon;
revoke all on function public.staff_set_hidden(text, text, boolean) from public, anon;
revoke all on function public.staff_stats(text) from public, anon;
grant execute on function public.staff_me() to authenticated;
grant execute on function public.staff_signups(text) to authenticated;
grant execute on function public.staff_update_signup(uuid, text, text) to authenticated;
grant execute on function public.staff_board(text, date) to authenticated;
grant execute on function public.staff_set_hidden(text, text, boolean) to authenticated;
grant execute on function public.staff_stats(text) to authenticated;
