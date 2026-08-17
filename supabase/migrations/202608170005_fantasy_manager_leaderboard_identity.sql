-- Fantasy leaderboard ranks fantasy managers by existing account username, not athletes.
CREATE OR REPLACE VIEW public.fantasy_squad_leaderboard AS
SELECT
  s.id AS squad_id,
  s.user_id,
  COALESCE(u.raw_user_meta_data ->> 'username', split_part(u.email, '@', 1), 'Unknown Manager') AS username,
  s.gameweek_id,
  s.total_points,
  s.gameweek_points,
  s.squad_value,
  RANK() OVER (ORDER BY s.total_points DESC, s.gameweek_points DESC, s.updated_at ASC) AS rank
FROM public.fantasy_squads s
LEFT JOIN auth.users u ON u.id = s.user_id
ORDER BY s.total_points DESC, s.gameweek_points DESC, s.updated_at ASC;

COMMENT ON VIEW public.fantasy_squad_leaderboard IS 'Ranks fantasy managers using the existing auth user_metadata.username value; no Fantasy-specific manager name is stored.';
