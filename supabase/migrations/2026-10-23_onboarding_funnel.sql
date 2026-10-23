-- ════════════════════════════════════════════════════════════════════════
-- Entonnoir de l'onboarding (2026-10-23) — compteurs ANONYMES + lecture dans l'onglet Usage
-- ════════════════════════════════════════════════════════════════════════
-- Purement ADDITIF : une table fermée au client, une RPC d'écriture bornée, teacher_usage enrichie
-- (anciens clients : champs en plus ignorés). Déployer ce fichier AVANT le code client : sans lui,
-- onb_step répond 404 et le client l'ignore (catch loggé), l'onglet n'affiche pas le bloc.
--
-- RGPD (choix de Jérémy, 2026-10-23) : aucun identifiant. Une ligne = (jour, promo, étape) → n. Rien ne
-- relie deux étapes ni une étape à un élève. Le client n'envoie une étape qu'une fois par onglet (drapeau
-- sessionStorage local). Les étapes d'avant le code de classe sont comptées sous la promo '_'.
--
-- ⚠️ La liste blanche v_steps est recopiée de ONB_STEP_IDS (src/lib/onbFunnel.js) ; tests/check_onb_funnel.cjs
-- vérifie l'égalité. Une étape absente ici est ignorée en silence.

CREATE TABLE IF NOT EXISTS public.onboarding_steps (
  day        date NOT NULL,
  class_code text NOT NULL,
  step       text NOT NULL,
  n          integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, class_code, step)
);
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;
-- Fermée au client comme les autres : les 7 privilèges, aucune policy. Lecture par teacher_usage seulement.
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.onboarding_steps FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public.onb_step(p_class_code text, p_step text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_steps text[] := ARRAY['land','name','scan_open','scan_start','sec1','sec2','sec3','scan_done','report_cta','account','returning'];
  v_cc text := lower(btrim(COALESCE(p_class_code, '')));
  v_day date := (now() AT TIME ZONE 'Europe/Paris')::date;
BEGIN
  IF p_step IS NULL OR NOT (p_step = ANY(v_steps)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unknown_step');
  END IF;
  IF v_cc NOT IN ('_', 'visitor') AND NOT EXISTS (SELECT 1 FROM groups WHERE code = v_cc) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unknown_class_code');
  END IF;
  -- Plafond par jour, promo et étape : borne le gonflement par des appels répétés (la RPC est publique).
  INSERT INTO onboarding_steps AS o (day, class_code, step, n) VALUES (v_day, v_cc, p_step, 1)
  ON CONFLICT (day, class_code, step) DO UPDATE SET n = LEAST(o.n + 1, 5000);
  RETURN jsonb_build_object('ok', true);
END;
$function$;
REVOKE ALL ON FUNCTION public.onb_step(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.onb_step(text, text) TO anon, authenticated;

-- teacher_usage : + joined_at par élève (une date, sans nom), + funnel (la promo, 35 j),
-- + funnel_all pour l'admin (toutes promos, '_' compris). Même garde qu'avant.
CREATE OR REPLACE FUNCTION public.teacher_usage(p_code text, p_class_code text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $function$
DECLARE v_role text; v_rows jsonb; v_since text; v_strict timestamptz; v_funnel jsonb; v_all jsonb;
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
        (s.user_id IS NOT NULL) AS secured,
        s.joined_at AS joined_at
        FROM students s
       WHERE s.class_code = p_class_code AND s.name <> 'Teacher'
       LIMIT 200
    ) t;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('day', o.day, 'step', o.step, 'n', o.n)), '[]'::jsonb) INTO v_funnel
    FROM onboarding_steps o
   WHERE o.class_code = p_class_code AND o.day >= current_date - 35;

  IF v_role = 'admin' THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('day', x.day, 'step', x.step, 'n', x.n)), '[]'::jsonb) INTO v_all
      FROM (SELECT day, step, sum(n)::int AS n FROM onboarding_steps
             WHERE day >= current_date - 35 GROUP BY day, step) x;
  END IF;

  RETURN jsonb_build_object('ok', true, 'students', v_rows,
    'strict_since', CASE WHEN p_class_code = 'visitor' THEN NULL ELSE v_strict END,
    'funnel', v_funnel, 'funnel_all', v_all);
END;
$function$;
REVOKE ALL ON FUNCTION public.teacher_usage(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.teacher_usage(text, text) TO anon, authenticated;

-- Vérification :
--   SELECT onb_step('test2627', 'scan_open');                          -- {"ok": true}
--   SELECT onb_step('test2627', 'bogus');                              -- unknown_step
--   SELECT onb_step('nimporte', 'land');                               -- unknown_class_code
--   SELECT * FROM onboarding_steps WHERE class_code = 'test2627';
--   SELECT teacher_usage('<code formateur>', 'test2627') -> 'funnel';
