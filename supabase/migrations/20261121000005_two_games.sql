-- Two games in one system:
--   cikgu   = Cikgu Sehari (bakal cikgu / UPSI students): story s1-s5, judge pupils' answers.
--   pelajar = Misi Pelajar Bijak (school students): story p1-p5, answer the quiz, one "Tanya Cikgu BSA" hint.
-- Families (ibubapa) pick either game. The projector shows a top-5 board per game.

alter table cs.plays add column if not exists game text not null default 'cikgu'
  check (game in ('cikgu', 'pelajar'));
alter table cs.story_choices add column if not exists game text not null default 'cikgu'
  check (game in ('cikgu', 'pelajar'));

alter table cs.story_choices drop constraint if exists story_choices_trait_check;
alter table cs.story_choices add constraint story_choices_trait_check
  check (trait in ('kreatif', 'penyayang', 'strategik', 'inspirasi', 'disiplin',
                   'visual', 'pendengar', 'aktif', 'pemikir', 'sosial'));

-- Game B story choices (same as supabase/seed/content.sql, generated from src/content/storyB.ts).
insert into cs.story_choices (id, scene, trait, xp, game) values
  ('p1a', 'p1', 'visual', 30, 'pelajar'),
  ('p1b', 'p1', 'pendengar', 30, 'pelajar'),
  ('p1d', 'p1', null, 10, 'pelajar'),
  ('p1c', 'p1', 'sosial', 30, 'pelajar'),
  ('p2a', 'p2', 'aktif', 30, 'pelajar'),
  ('p2d', 'p2', null, 10, 'pelajar'),
  ('p2b', 'p2', 'pemikir', 30, 'pelajar'),
  ('p2c', 'p2', 'sosial', 30, 'pelajar'),
  ('p3c', 'p3', 'visual', 30, 'pelajar'),
  ('p3a', 'p3', 'aktif', 30, 'pelajar'),
  ('p3b', 'p3', 'pendengar', 30, 'pelajar'),
  ('p3d', 'p3', null, 10, 'pelajar'),
  ('p4d', 'p4', null, 10, 'pelajar'),
  ('p4a', 'p4', 'pemikir', 30, 'pelajar'),
  ('p4b', 'p4', 'sosial', 30, 'pelajar'),
  ('p4c', 'p4', 'pendengar', 30, 'pelajar'),
  ('p5a', 'p5', 'pemikir', 30, 'pelajar'),
  ('p5b', 'p5', 'visual', 30, 'pelajar'),
  ('p5d', 'p5', null, 10, 'pelajar'),
  ('p5c', 'p5', 'aktif', 30, 'pelajar')
on conflict (id) do update set scene = excluded.scene, trait = excluded.trait, xp = excluded.xp, game = excluded.game;

-- Best score per nickname for one game on an event day, without hidden or suspicious plays.
create or replace function cs.board_game(p_event uuid, p_day date, p_game text)
returns table (nickname text, total_xp int, personality text, finished_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select distinct on (lower(p.nickname)) p.nickname, p.total_xp, p.personality, p.finished_at
  from cs.plays p
  where p.event_id = p_event and p.day = p_day and p.game = p_game and p.finished_at is not null
    and not p.hidden and not p.suspicious
  order by lower(p.nickname), p.total_xp desc, p.finished_at asc
$$;

-- start_play with the game. Pelajar always play Misi Pelajar Bijak, cikgu always play Cikgu Sehari,
-- ibubapa choose. The old start_play stays for phones still holding the previous version of the page.
create or replace function public.begin_play(
  p_event text, p_nickname text, p_role text, p_band text, p_lang text, p_teach text[] default '{}',
  p_game text default null
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
  play_id uuid;
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

  if p_band = 'f4_5' and cardinality(picked) = 0 then
    subjects := array['bi', 'math'] || array(select x from unnest(array['phy', 'chem', 'bio']) x order by random() limit 2);
  else
    subjects := picked || array(select x from unnest(available) x where not x = any (picked) order by random());
    subjects := subjects[1:4];
  end if;

  -- Two items per subject: one with a right answer shown and one with a wrong one, where possible.
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

  insert into cs.plays (event_id, day, nickname, role, band, lang, teach_subjects, question_ids, game)
  values (e.id, cs.today(), nick, p_role, p_band, p_lang, picked, qids, v_game)
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

create or replace function public.finish_play(p_play uuid, p_choices text[], p_marks jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  p cs.plays;
  story int := 0;
  traits jsonb := '{"kreatif":0,"penyayang":0,"strategik":0,"inspirasi":0,"disiplin":0,
                    "visual":0,"pendengar":0,"aktif":0,"pemikir":0,"sosial":0}';
  v_order text[];
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
  hinted boolean;
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

  -- Story: exactly one valid choice per scene, all from this play's game.
  if coalesce(cardinality(p_choices), 0) <> 5
     or (select count(distinct sc.scene) from cs.story_choices sc where sc.id = any (p_choices) and sc.game = p.game) <> 5
     or exists (select 1 from cs.story_choices sc where sc.id = any (p_choices) and sc.game <> p.game) then
    raise exception 'bad choices' using errcode = '22023';
  end if;
  for c in select sc.trait, sc.xp from cs.story_choices sc where sc.id = any (p_choices) and sc.game = p.game loop
    story := story + c.xp;
    if c.trait is not null then
      traits := jsonb_set(traits, array[c.trait], to_jsonb((traits ->> c.trait)::int + 1));
    end if;
  end loop;
  -- Ties go to the first personality in the game's order (same as src/content/personalities.ts).
  v_order := case when p.game = 'pelajar' then array['visual', 'pendengar', 'aktif', 'pemikir', 'sosial']
                  else array['kreatif', 'penyayang', 'strategik', 'inspirasi', 'disiplin'] end;
  select t into v_pers
  from unnest(v_order) with ordinality u(t, n)
  order by (traits ->> t)::int desc, n
  limit 1;

  -- Semak Kerja / quiz, in the order the questions were shown.
  foreach qid in array p.question_ids loop
    select * into qrow from cs.questions where id = qid;
    select x into m from jsonb_array_elements(case when jsonb_typeof(p_marks) = 'array' then p_marks else '[]' end) x
    where x ->> 'id' = qid limit 1;
    ms := least(greatest(coalesce((m ->> 'ms')::int, 0), 0), 60000);
    -- A tap faster than a person can read (under 250 ms) earns nothing.
    ok := m is not null and jsonb_typeof(m -> 'verdict') = 'boolean' and (m ->> 'verdict')::boolean = qrow.correct
          and ms >= 250;
    -- With the "Tanya Cikgu BSA" hint a right answer earns a flat 10 XP (no speed or streak bonus).
    hinted := m is not null and jsonb_typeof(m -> 'hint') = 'boolean' and (m ->> 'hint')::boolean;
    if m is not null then
      total_ms := total_ms + ms;
    end if;
    if ok then
      semak := semak + case when hinted then 10
                            else 20 + greatest(0, round(5 * (1 - ms / 5000.0)))::int + case when streak >= 2 then 5 else 0 end end;
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

  -- Rank on this game's board.
  select count(*) + 1 into v_rank from cs.board_game(p.event_id, p.day, p.game) b
  where b.total_xp > story + semak and lower(b.nickname) <> lower(p.nickname);
  select count(*) into players from cs.board_game(p.event_id, p.day, p.game);

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

create or replace function public.leaderboard(p_event text, p_limit int default 10)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  e cs.events := cs.event_by_slug(p_event);
  d date := cs.today();
  n int := least(greatest(p_limit, 1), 20);
begin
  return jsonb_build_object(
    'event', jsonb_build_object('name', e.name, 'offerCode', e.offer_code, 'offerValidUntil', e.offer_valid_until),
    'day', d,
    'top', coalesce((
      select jsonb_agg(jsonb_build_object('nickname', b.nickname, 'xp', b.total_xp, 'personality', b.personality)
                       order by b.total_xp desc, b.finished_at asc)
      from (select * from cs.board(e.id, d) order by total_xp desc, finished_at asc limit n) b
    ), '[]'),
    'boards', (
      select jsonb_object_agg(g.game, coalesce((
        select jsonb_agg(jsonb_build_object('nickname', b.nickname, 'xp', b.total_xp, 'personality', b.personality)
                         order by b.total_xp desc, b.finished_at asc)
        from (select * from cs.board_game(e.id, d, g.game) order by total_xp desc, finished_at asc limit n) b
      ), '[]'))
      from unnest(array['cikgu', 'pelajar']) g(game)
    ),
    'latest', coalesce((
      select jsonb_agg(jsonb_build_object('nickname', l.nickname, 'xp', l.total_xp, 'personality', l.personality,
                                          'game', l.game) order by l.finished_at desc)
      from (
        select p.nickname, p.total_xp, p.personality, p.game, p.finished_at from cs.plays p
        where p.event_id = e.id and p.day = d and p.finished_at is not null and not p.hidden and not p.suspicious
        order by p.finished_at desc limit 8
      ) l
    ), '[]'),
    'players', (select count(*) from cs.plays p where p.event_id = e.id and p.day = d and p.finished_at is not null),
    'playersByGame', (
      select jsonb_object_agg(g.game, (select count(*) from cs.plays p where p.event_id = e.id and p.day = d
                                       and p.finished_at is not null and p.game = g.game))
      from unnest(array['cikgu', 'pelajar']) g(game)
    ),
    'mix', coalesce((
      select jsonb_object_agg(personality, c) from (
        select p.personality, count(*) c from cs.plays p
        where p.event_id = e.id and p.day = d and p.finished_at is not null group by p.personality
      ) m
    ), '{}')
  );
end;
$$;

create or replace function public.staff_signups(p_event text) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare e cs.events;
begin
  perform cs.require_staff();
  e := cs.event_by_slug(p_event);
  return coalesce((
    select jsonb_agg((to_jsonb(s) - 'event_id' - 'play_id') || jsonb_build_object('subjects', p.subjects, 'game', p.game)
                     order by s.created_at desc)
    from cs.signups s
    left join cs.plays p on p.id = s.play_id
    where s.event_id = e.id
  ), '[]');
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
      select distinct on (lower(p.nickname), p.game) jsonb_build_object(
        'nickname', p.nickname, 'xp', p.total_xp, 'personality', p.personality,
        'hidden', bool_or(p.hidden) over (partition by lower(p.nickname)),
        'suspicious', p.suspicious, 'role', p.role, 'game', p.game) x
      from cs.plays p
      where p.event_id = e.id and p.day = d and p.finished_at is not null
      order by lower(p.nickname), p.game, p.total_xp desc
    ) t
  ), '[]');
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
    ), '{}'),
    'byGame', coalesce((
      select jsonb_object_agg(g.game, g.plays)
      from (select p.game, count(*) filter (where p.finished_at is not null) plays
            from cs.plays p where p.event_id = e.id group by p.game) g
    ), '{}')
  );
end;
$$;

revoke all on function cs.board_game(uuid, date, text) from public, anon, authenticated;
revoke all on function public.begin_play(text, text, text, text, text, text[], text) from public;
grant execute on function public.begin_play(text, text, text, text, text, text[], text) to anon, authenticated;
revoke all on function public.staff_stats(text) from public, anon;
grant execute on function public.staff_stats(text) to authenticated;
