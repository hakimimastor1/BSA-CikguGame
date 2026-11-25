-- Staff see each sign-up's Semak Kerja results (marks per subject), for the follow-up message to parents.
create or replace function public.staff_signups(p_event text) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare e cs.events;
begin
  perform cs.require_staff();
  e := cs.event_by_slug(p_event);
  return coalesce((
    select jsonb_agg((to_jsonb(s) - 'event_id' - 'play_id') || jsonb_build_object('subjects', p.subjects) order by s.created_at desc)
    from cs.signups s
    left join cs.plays p on p.id = s.play_id
    where s.event_id = e.id
  ), '[]');
end;
$$;
