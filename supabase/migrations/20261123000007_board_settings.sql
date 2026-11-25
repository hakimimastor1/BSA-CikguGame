-- Scoreboard settings an admin can change in Admin → Papan skor:
--   board_mode 'manual' (default): the boards keep every play since the admin last pressed Reset,
--              across days, until someone resets them.
--   board_mode 'daily': the boards also start fresh every day at midnight (Malaysia time).
--   board_size: names per board on the projector (3, 5 or 10).

alter table cs.events add column if not exists board_mode text not null default 'manual'
  check (board_mode in ('manual', 'daily'));
alter table cs.events add column if not exists board_size int not null default 5
  check (board_size in (3, 5, 10));

-- In manual mode the day is ignored: everything since the last reset counts.
create or replace function cs.board(p_event uuid, p_day date)
returns table (nickname text, total_xp int, personality text, finished_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select distinct on (lower(p.nickname)) p.nickname, p.total_xp, p.personality, p.finished_at
  from cs.plays p join cs.events e on e.id = p.event_id
  where p.event_id = p_event and (e.board_mode = 'manual' or p.day = p_day) and p.finished_at is not null
    and p.finished_at > coalesce(e.board_reset_at, '-infinity'::timestamptz)
    and not p.hidden and not p.suspicious
  order by lower(p.nickname), p.total_xp desc, p.finished_at asc
$$;

create or replace function cs.board_game(p_event uuid, p_day date, p_game text)
returns table (nickname text, total_xp int, personality text, finished_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select distinct on (lower(p.nickname)) p.nickname, p.total_xp, p.personality, p.finished_at
  from cs.plays p join cs.events e on e.id = p.event_id
  where p.event_id = p_event and (e.board_mode = 'manual' or p.day = p_day) and p.game = p_game
    and p.finished_at is not null
    and p.finished_at > coalesce(e.board_reset_at, '-infinity'::timestamptz)
    and not p.hidden and not p.suspicious
  order by lower(p.nickname), p.total_xp desc, p.finished_at asc
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
    'players', players,
    'boardMode', (select ev.board_mode from cs.events ev where ev.id = p.event_id)
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
  since timestamptz := cs.board_since(e.id);
  -- Manual mode: the boards keep every play since the last reset, whatever the day.
  daily boolean := e.board_mode = 'daily';
begin
  return jsonb_build_object(
    'event', jsonb_build_object('name', e.name, 'offerCode', e.offer_code, 'offerValidUntil', e.offer_valid_until),
    'day', d,
    'mode', e.board_mode,
    'size', e.board_size,
    'resetAt', e.board_reset_at,
    'top', coalesce((
      select jsonb_agg(jsonb_build_object('nickname', b.nickname, 'xp', b.total_xp, 'personality', b.personality)
                       order by b.total_xp desc, b.finished_at asc)
      from (select * from cs.board(e.id, d) order by total_xp desc, finished_at asc limit n) b
    ), '[]'),
    'boards', (
      select jsonb_object_agg(g.game, coalesce((
        select jsonb_agg(jsonb_build_object('nickname', b.nickname, 'xp', b.total_xp, 'personality', b.personality)
                         order by b.total_xp desc, b.finished_at asc)
        from (select * from cs.board_game(e.id, d, g.game) order by total_xp desc, finished_at asc limit e.board_size) b
      ), '[]'))
      from unnest(array['cikgu', 'pelajar']) g(game)
    ),
    'latest', coalesce((
      select jsonb_agg(jsonb_build_object('nickname', l.nickname, 'xp', l.total_xp, 'personality', l.personality,
                                          'game', l.game) order by l.finished_at desc)
      from (
        select p.nickname, p.total_xp, p.personality, p.game, p.finished_at from cs.plays p
        where p.event_id = e.id and (not daily or p.day = d) and p.finished_at > since and not p.hidden and not p.suspicious
        order by p.finished_at desc limit 8
      ) l
    ), '[]'),
    'players', (select count(*) from cs.plays p where p.event_id = e.id and (not daily or p.day = d) and p.finished_at > since),
    'playersByGame', (
      select jsonb_object_agg(g.game, (select count(*) from cs.plays p where p.event_id = e.id and (not daily or p.day = d)
                                       and p.finished_at > since and p.game = g.game))
      from unnest(array['cikgu', 'pelajar']) g(game)
    ),
    'mix', coalesce((
      select jsonb_object_agg(personality, c) from (
        select p.personality, count(*) c from cs.plays p
        where p.event_id = e.id and (not daily or p.day = d) and p.finished_at > since group by p.personality
      ) m
    ), '{}')
  );
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
      where p.event_id = e.id and (e.board_mode = 'manual' or p.day = d) and p.finished_at is not null
        and p.finished_at > coalesce(e.board_reset_at, '-infinity'::timestamptz)
      order by lower(p.nickname), p.game, p.total_xp desc
    ) t
  ), '[]');
end;
$$;

create or replace function public.staff_event(p_event text) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare e cs.events;
begin
  perform cs.require_staff();
  e := cs.event_by_slug(p_event);
  return jsonb_build_object(
    'name', e.name, 'startsOn', e.starts_on, 'endsOn', e.ends_on, 'today', cs.today(),
    'boardResetAt', e.board_reset_at, 'boardMode', e.board_mode, 'boardSize', e.board_size,
    'beforeStart', cs.today() < e.starts_on,
    'plays', (select count(*) from cs.plays p where p.event_id = e.id),
    'signups', (select count(*) from cs.signups s where s.event_id = e.id));
end;
$$;

create or replace function public.staff_set_board_settings(p_event text, p_mode text, p_size int) returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare e cs.events;
begin
  if cs.require_staff() <> 'admin' then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if p_mode not in ('manual', 'daily') or p_size not in (3, 5, 10) then
    raise exception 'bad settings' using errcode = '22023';
  end if;
  e := cs.event_by_slug(p_event);
  update cs.events set board_mode = p_mode, board_size = p_size where id = e.id;
  return jsonb_build_object('boardMode', p_mode, 'boardSize', p_size);
end;
$$;

revoke all on function public.staff_set_board_settings(text, text, int) from public, anon;
grant execute on function public.staff_set_board_settings(text, text, int) to authenticated;
