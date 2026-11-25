-- The projector ticker shows who has already claimed the free trial (or applied as a tutor).

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
                                          'game', l.game, 'role', l.role, 'claimed', l.claimed) order by l.finished_at desc)
      from (
        -- claimed: the player sent the sign-up form (trial claim, or tutor application), WhatsApp or not.
        select p.nickname, p.total_xp, p.personality, p.game, p.role, p.finished_at,
               exists (select 1 from cs.signups s where s.play_id = p.id) as claimed
        from cs.plays p
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
