-- Real players were kept off the projector. The rule "answer times add up to more than 50 seconds"
-- flagged plays of 2–3 minutes as suspicious: on real phones the measured answer times can pass the
-- 45-second timer. Keep the rules that catch impossible plays (under 20 seconds, or answer times
-- longer than the whole play) and drop the 50-second cap.
-- Then put back on the boards the PESKON plays that only that rule had flagged.

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

  -- Too fast to be a person reading the screens, or answer times longer than the play itself: keep the
  -- play but leave it off the leaderboard. (A cap on the total answer time is gone: on real phones it
  -- can pass the 45-second timer, and it hid genuine players.)
  if elapsed < 20 or total_ms / 1000.0 > elapsed + 5 then
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

update cs.plays p set suspicious = false
where p.event_id = (select id from cs.events where slug = 'peskon26')
  and p.suspicious and p.finished_at is not null
  and extract(epoch from p.finished_at - p.started_at) >= 20
  and (select coalesce(sum(least(greatest(coalesce((m ->> 'ms')::int, 0), 0), 60000)), 0)
       from jsonb_array_elements(case when jsonb_typeof(p.marks) = 'array' then p.marks else '[]' end) m) / 1000.0
      <= extract(epoch from p.finished_at - p.started_at) + 5;
