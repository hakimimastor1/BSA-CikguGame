-- Admin tools for the booth:
--   * Reset papan skor: the projector boards start again from now. Nothing is deleted; results and
--     sign-ups stay in Admin. (The boards still start fresh every day at midnight as before.)
--   * Kosongkan data ujian: before the event starts only, move every play and sign-up of the event
--     into the inactive 'test-archive' event, so the event starts clean after team testing.

alter table cs.events add column if not exists board_reset_at timestamptz;

-- Plays finished at or before this moment are left off the boards.
create or replace function cs.board_since(p_event uuid) returns timestamptz
language sql stable security definer set search_path = ''
as $$ select coalesce((select e.board_reset_at from cs.events e where e.id = p_event), '-infinity'::timestamptz) $$;

create or replace function cs.board(p_event uuid, p_day date)
returns table (nickname text, total_xp int, personality text, finished_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select distinct on (lower(p.nickname)) p.nickname, p.total_xp, p.personality, p.finished_at
  from cs.plays p
  where p.event_id = p_event and p.day = p_day and p.finished_at is not null
    and p.finished_at > cs.board_since(p_event)
    and not p.hidden and not p.suspicious
  order by lower(p.nickname), p.total_xp desc, p.finished_at asc
$$;

create or replace function cs.board_game(p_event uuid, p_day date, p_game text)
returns table (nickname text, total_xp int, personality text, finished_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select distinct on (lower(p.nickname)) p.nickname, p.total_xp, p.personality, p.finished_at
  from cs.plays p
  where p.event_id = p_event and p.day = p_day and p.game = p_game and p.finished_at is not null
    and p.finished_at > cs.board_since(p_event)
    and not p.hidden and not p.suspicious
  order by lower(p.nickname), p.total_xp desc, p.finished_at asc
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
        where p.event_id = e.id and p.day = d and p.finished_at > since and not p.hidden and not p.suspicious
        order by p.finished_at desc limit 8
      ) l
    ), '[]'),
    'players', (select count(*) from cs.plays p where p.event_id = e.id and p.day = d and p.finished_at > since),
    'playersByGame', (
      select jsonb_object_agg(g.game, (select count(*) from cs.plays p where p.event_id = e.id and p.day = d
                                       and p.finished_at > since and p.game = g.game))
      from unnest(array['cikgu', 'pelajar']) g(game)
    ),
    'mix', coalesce((
      select jsonb_object_agg(personality, c) from (
        select p.personality, count(*) c from cs.plays p
        where p.event_id = e.id and p.day = d and p.finished_at > since group by p.personality
      ) m
    ), '{}')
  );
end;
$$;

-- The admin board mirrors the projector: plays since the last reset.
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
      where p.event_id = e.id and p.day = d and p.finished_at is not null and p.finished_at > cs.board_since(e.id)
      order by lower(p.nickname), p.game, p.total_xp desc
    ) t
  ), '[]');
end;
$$;

-- Event facts for the admin page: dates, last reset, and whether test data can still be cleared.
create or replace function public.staff_event(p_event text) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare e cs.events;
begin
  perform cs.require_staff();
  e := cs.event_by_slug(p_event);
  return jsonb_build_object(
    'name', e.name, 'startsOn', e.starts_on, 'endsOn', e.ends_on, 'today', cs.today(),
    'boardResetAt', e.board_reset_at,
    'beforeStart', cs.today() < e.starts_on,
    'plays', (select count(*) from cs.plays p where p.event_id = e.id),
    'signups', (select count(*) from cs.signups s where s.event_id = e.id));
end;
$$;

create or replace function public.staff_reset_board(p_event text) returns timestamptz
language plpgsql volatile security definer set search_path = ''
as $$
declare
  e cs.events;
  t timestamptz := now();
begin
  if cs.require_staff() <> 'admin' then
    raise exception 'admin only' using errcode = '42501';
  end if;
  e := cs.event_by_slug(p_event);
  update cs.events set board_reset_at = t where id = e.id;
  return t;
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
  n_dupes int;
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

  -- A number already in the archive would clash with the one-number-per-event rule: drop the newer copy.
  delete from cs.signups s
  where s.event_id = e.id and exists (select 1 from cs.signups x where x.event_id = arch and x.whatsapp = s.whatsapp);
  get diagnostics n_dupes = row_count;
  update cs.signups set event_id = arch where event_id = e.id;
  get diagnostics n_moved = row_count;
  update cs.plays set event_id = arch where event_id = e.id;
  get diagnostics n_plays = row_count;
  update cs.events set board_reset_at = null where id = e.id;

  return jsonb_build_object('plays', n_plays, 'signups', n_moved + n_dupes);
end;
$$;

revoke all on function cs.board_since(uuid) from public, anon, authenticated;
revoke all on function public.staff_event(text) from public, anon;
revoke all on function public.staff_reset_board(text) from public, anon;
revoke all on function public.staff_clear_test_data(text) from public, anon;
grant execute on function public.staff_event(text) to authenticated;
grant execute on function public.staff_reset_board(text) to authenticated;
grant execute on function public.staff_clear_test_data(text) to authenticated;
