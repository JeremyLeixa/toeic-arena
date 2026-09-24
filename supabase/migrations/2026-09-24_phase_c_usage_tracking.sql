-- ════════════════════════════════════════════════════════════════════════
-- Phase C : suivi de la sécurisation dans l'onglet Usage (2026-09-24)
-- ════════════════════════════════════════════════════════════════════════
-- teacher_usage gagne, par élève, un booléen `secured` (user_id posé = compte à mot de passe) — toujours
-- ANONYME : ni nom, ni id — et, pour la promo, `strict_since` (date de passage en mode strict, sinon null).
-- Additif : les anciens clients ignorent les nouveaux champs. Même garde qu'avant.
CREATE OR REPLACE FUNCTION public.teacher_usage(p_code text, p_class_code text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $function$
DECLARE v_role text; v_rows jsonb; v_since text; v_strict timestamptz;
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
  SELECT min(since) INTO v_strict FROM identity_strict_classes WHERE class_code IN (p_class_code, '*');

  SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_rows
    FROM (
      SELECT
        (SELECT COALESCE(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
           FROM jsonb_each(COALESCE(s.daily_mod_sessions, '{}'::jsonb)) e
          WHERE right(e.key, 10) >= v_since
            AND right(e.key, 10) ~ '^\d{4}-\d{2}-\d{2}$') AS dms,
        COALESCE(s.mission -> 'doneDays', '[]'::jsonb) AS done_days,
        COALESCE(s.review -> 'weeks', '{}'::jsonb) AS weeks,
        (s.user_id IS NOT NULL) AS secured
        FROM students s
       WHERE s.class_code = p_class_code AND s.name <> 'Teacher'
       LIMIT 200
    ) t;

  RETURN jsonb_build_object('ok', true, 'students', v_rows,
    'strict_since', CASE WHEN p_class_code = 'visitor' THEN NULL ELSE v_strict END);
END;
$function$;
