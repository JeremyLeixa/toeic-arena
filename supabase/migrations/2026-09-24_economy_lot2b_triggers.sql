-- ════════════════════════════════════════════════════════════════════════
-- Économie côté serveur, lot 2b : seuls les coffres qui existent dans le jeu (2026-09-24)
-- ════════════════════════════════════════════════════════════════════════
-- Avant : grant_pending_chest acceptait n'importe quel déclencheur, avec le type et le délai choisis par le
-- client. Un élève pouvait s'accorder des coffres Légendaires à volonté (« x1 », « x2 »…).
-- Maintenant : type et délai sont IMPOSÉS par le serveur. Déclencheurs à valeur fixe : table chest_triggers
-- (générée depuis le code, scripts/gen-economy-sql.mjs). Déclencheurs datés, vérifiés par motif :
--   streak_login_<AAAA-MM-JJ>        novice,   date à ± 1 jour d'aujourd'hui
--   mission_streak_<n>               guerrier, n multiple de 7 entre 7 et 364
--   weekly_toeic_<an>-W<n>, podium_  guerrier, semaine parmi les 4 dernières (+ la suivante), au format de
--                                    lib/util.js weekId() (lundi compté depuis le 1er janvier, PAS l'ISO)
-- Tout autre déclencheur : refusé ('invalid_trigger'). Les coffres offerts à la main par le formateur passent
-- par le SQL Editor (INSERT direct), pas par cette fonction : non concernés.
-- Même signature qu'avant : p_chest_type et p_cooldown_days sont acceptés mais IGNORÉS (compatibilité des
-- onglets encore ouverts sur l'ancien client). Vérifié le 24/09 : les 187 déclencheurs déjà accordés en prod
-- passent, sauf d'anciens noms qu'aucun code n'émet plus et des coffres manuels.

CREATE OR REPLACE FUNCTION public.grant_pending_chest(
  p_name text, p_class_code text, p_chest_type text, p_trigger text,
  p_cooldown_days integer DEFAULT NULL)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_g text; v_seen boolean; v_type text; v_cd integer; v_d date; v_n integer; v_mon date; k integer;
        v_weeks text[] := ARRAY[]::text[];
BEGIN
  IF COALESCE(p_trigger, '') = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_params');
  END IF;

  SELECT chest_type, cooldown_days INTO v_type, v_cd FROM chest_triggers WHERE trigger = p_trigger;
  IF NOT FOUND THEN
    v_cd := NULL;
    IF p_trigger ~ '^streak_login_\d{4}-\d{2}-\d{2}$' THEN
      v_d := substring(p_trigger from 14)::date;
      IF v_d BETWEEN current_date - 1 AND current_date + 1 THEN v_type := 'novice'; END IF;
    ELSIF p_trigger ~ '^mission_streak_\d{1,4}$' THEN
      v_n := substring(p_trigger from 16)::int;
      IF v_n % 7 = 0 AND v_n BETWEEN 7 AND 364 THEN v_type := 'guerrier'; END IF;
    ELSIF p_trigger ~ '^(weekly_toeic|podium)_\d{4}-W\d{1,2}$' THEN
      FOR k IN -1..4 LOOP
        v_mon := (date_trunc('week', now()) - make_interval(weeks => k))::date;
        v_weeks := v_weeks || (extract(year from v_mon)::int || '-W'
                   || (floor((v_mon - make_date(extract(year from v_mon)::int, 1, 1)) / 7) + 1)::int);
      END LOOP;
      IF substring(p_trigger from '\d{4}-W\d{1,2}$') = ANY(v_weeks) THEN v_type := 'guerrier'; END IF;
    END IF;
    IF v_type IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_trigger');
    END IF;
  END IF;

  v_g := student_guard(p_name, p_class_code);
  IF v_g <> 'ok' THEN RETURN jsonb_build_object('ok', false, 'error', v_g); END IF;

  -- Un coffre du meme trigger deja en attente bloque dans les deux modes.
  SELECT EXISTS (
    SELECT 1 FROM pending_chests
     WHERE lower(user_name) = lower(p_name) AND class_code = p_class_code
       AND trigger_source = p_trigger
  ) INTO v_seen;
  IF v_seen THEN
    RETURN jsonb_build_object('ok', true, 'granted', false, 'reason', 'already');
  END IF;

  IF v_cd IS NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM chest_log
       WHERE lower(user_name) = lower(p_name) AND class_code = p_class_code
         AND trigger_source = p_trigger
    ) INTO v_seen;
    IF v_seen THEN
      RETURN jsonb_build_object('ok', true, 'granted', false, 'reason', 'already');
    END IF;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM chest_log
       WHERE lower(user_name) = lower(p_name) AND class_code = p_class_code
         AND trigger_source = p_trigger
         AND opened_at >= now() - make_interval(days => v_cd)
    ) INTO v_seen;
    IF v_seen THEN
      RETURN jsonb_build_object('ok', true, 'granted', false, 'reason', 'cooldown');
    END IF;
  END IF;

  INSERT INTO pending_chests (user_name, class_code, chest_type, trigger_source)
  VALUES (p_name, p_class_code, v_type, p_trigger);

  RETURN jsonb_build_object('ok', true, 'granted', true, 'chest_type', v_type);
END;
$function$;
