-- ════════════════════════════════════════════════════════════════════════
-- Podium hebdomadaire : jamais sur une semaine à 0 XP (2026-09-24)
-- ════════════════════════════════════════════════════════════════════════
-- Jusqu'au 24/09, tous les instantanés partaient avec xp_this_week = 0 (bug client, src/lib/league.js,
-- tests/check_weekly_snapshot.cjs) : le « top 3 » était trois lignes à 0 prises au hasard, et le coffre
-- Guerrier + les Darics du podium allaient à n'importe qui. Même corrigé, une promo de moins de trois actifs
-- ne doit pas couronner un élève qui n'a rien joué.
CREATE OR REPLACE FUNCTION public.class_week_podium(p_class_code text, p_week_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_rows jsonb;
BEGIN
  IF COALESCE(p_class_code, '') = '' OR COALESCE(p_week_id, '') = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_params');
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.xp_this_week DESC), '[]'::jsonb)
    INTO v_rows
    FROM (
      SELECT student_name, xp_this_week
        FROM weekly_snapshots
       WHERE class_code = p_class_code
         AND week_id = p_week_id
         AND student_name <> 'Teacher'
         AND xp_this_week > 0
       ORDER BY xp_this_week DESC
       LIMIT 3
    ) t;

  RETURN jsonb_build_object('ok', true, 'podium', v_rows);
END;
$function$;
