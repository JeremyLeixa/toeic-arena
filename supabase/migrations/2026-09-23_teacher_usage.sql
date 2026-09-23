-- ════════════════════════════════════════════════════════════════════════
-- Onglet « Usage » du dashboard formateur (2026-09-23)
-- ════════════════════════════════════════════════════════════════════════
-- Purement ADDITIF : une RPC, aucun GRANT/REVOKE sur une table. Déployer ce fichier
-- AVANT le code client (sinon l'onglet affiche « RPC absente »).
--
-- Même patron d'autorisation que teacher_students / teacher_weekly_snapshots : code valide
-- par teacher_role_of, et propriétaire de la cohorte sauf rôle admin.
--
-- ANONYME : ni name, ni id, ni user_id. L'usage est un agrégat de classe, l'agrégation se
-- fait côté client (src/lib/usageStats.js, testé par tests/check_usage_stats.cjs).
-- Par élève :
--   dms       daily_mod_sessions réduit aux 35 derniers jours. Clés "<modId>_<YYYY-MM-DD>"
--             (parties terminées) et "quit:<route>_<YYYY-MM-DD>" (manches abandonnées,
--             capture du 2026-09-23). Les 10 derniers caractères de la clé sont la date.
--   done_days mission->'doneDays' : jours de mission du jour accomplie (capture du 2026-09-23).
--   weeks     review->'weeks' : {"<lundi>": {caught, slain}} du bestiaire (5 semaines).
CREATE OR REPLACE FUNCTION public.teacher_usage(p_code text, p_class_code text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $function$
DECLARE v_role text; v_rows jsonb; v_since text;
BEGIN
  v_role := teacher_role_of(p_code);
  IF v_role IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;
  IF v_role <> 'admin'
     AND p_class_code NOT IN (SELECT code FROM groups WHERE teacher_code = p_code) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  v_since := to_char(current_date - 35, 'YYYY-MM-DD');

  SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_rows
    FROM (
      SELECT
        (SELECT COALESCE(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
           FROM jsonb_each(COALESCE(s.daily_mod_sessions, '{}'::jsonb)) e
          WHERE right(e.key, 10) >= v_since
            AND right(e.key, 10) ~ '^\d{4}-\d{2}-\d{2}$') AS dms,
        COALESCE(s.mission -> 'doneDays', '[]'::jsonb) AS done_days,
        COALESCE(s.review -> 'weeks', '{}'::jsonb) AS weeks
        FROM students s
       WHERE s.class_code = p_class_code AND s.name <> 'Teacher'
       LIMIT 200
    ) t;

  RETURN jsonb_build_object('ok', true, 'students', v_rows);
END;
$function$;

REVOKE ALL ON FUNCTION public.teacher_usage(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.teacher_usage(text, text) TO anon, authenticated;

-- Vérification (remplacer par un vrai code formateur et une cohorte) :
--   SELECT teacher_usage('<code>', 'idrac2026') -> 'ok';                      -- true
--   SELECT jsonb_array_length(teacher_usage('<code>', 'idrac2026') -> 'students');
--   SELECT teacher_usage('xxxx', 'idrac2026');                                 -- invalid_code
