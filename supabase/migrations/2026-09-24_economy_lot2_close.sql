-- ════════════════════════════════════════════════════════════════════════
-- Économie côté serveur, fermeture du lot 2 (coffres et conversions), 2026-09-24
-- ════════════════════════════════════════════════════════════════════════
-- À passer APRÈS le déploiement du client des lots 2a/2b/2c (open_chest, convert_dups_to_token,
-- convert_tokens_premium) et sa vérification en prod. Brûle le filet : un client plus ancien ne peut plus
-- ouvrir de coffre (le coffre reste en attente, rien n'est perdu) ni convertir.

-- 1. Les anciennes RPC où le CLIENT fournissait le butin ou choisissait le jeton.
DROP FUNCTION IF EXISTS public.open_pending_chest(uuid, text, text, jsonb, integer, text);
DROP FUNCTION IF EXISTS public.convert_cosmetic_dups(text, text, text, text);

-- 2. grant_token : plus aucun appel client légitime. Seules les RPC SECURITY DEFINER (buy_item, open_chest,
--    conversions) l'appellent, avec les droits de leur propriétaire.
REVOKE ALL ON FUNCTION public.grant_token(text, text, text, integer, integer) FROM public, anon, authenticated;

-- 3. grant_marks : la source était libre. Or le plafond de 24 h exclut 'shop', 'admin' et 'admin_bonus' :
--    un appel console avec p_source='admin' le contournait. Et 'chest' laissait le client se créditer les
--    Darics des coffres, que open_chest crédite désormais lui-même. Sources acceptées = celles du jeu
--    (grantMarks dans src/App.jsx ; tests/check_economy_parity.cjs vérifie la liste). L'élève doit exister
--    (avant : ligne de journal écrite pour un nom inconnu, cf. les sondes 'zz-sweep').
CREATE OR REPLACE FUNCTION public.grant_marks(p_user_name text, p_class_code text, p_delta integer, p_source text,
  p_source_detail text, p_unique boolean DEFAULT false)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_owner uuid; v_found boolean; v_day integer;
BEGIN
  SELECT true, user_id INTO v_found, v_owner FROM students WHERE name=p_user_name AND class_code=p_class_code;
  IF v_found IS NULL THEN
    RAISE EXCEPTION 'no_student';
  END IF;
  -- Garde de propriété (grâce si legacy non migré : user_id NULL)
  IF v_owner IS NOT NULL AND v_owner IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not_owner';
  END IF;
  IF p_source IS NULL OR p_source NOT IN ('achievement', 'daily', 'focus', 'hunt', 'login', 'mastery', 'podium',
                                          'toeic_weekly') THEN
    RAISE EXCEPTION 'invalid_source';
  END IF;
  -- Borne par octroi (2026-09-24).
  IF p_delta IS NULL OR p_delta < 1 OR p_delta > 1000 THEN
    RAISE EXCEPTION 'invalid_delta';
  END IF;

  IF p_unique AND EXISTS(
    SELECT 1 FROM marks_log
    WHERE user_name=p_user_name AND class_code=p_class_code AND source_detail=p_source_detail
  ) THEN
    RETURN 0; -- déjà accordé, no-op silencieux côté client
  END IF;

  -- Plafond sur 24 h glissantes (2026-09-24), sur tout ce qui passe par ici. Les coffres (source 'chest',
  -- open_chest) et la boutique n'y entrent pas : ils sont écrits par leurs propres RPC.
  SELECT COALESCE(SUM(delta), 0) INTO v_day FROM marks_log
    WHERE user_name=p_user_name AND class_code=p_class_code AND delta > 0
      AND source NOT IN ('shop', 'chest', 'admin', 'admin_bonus')
      AND created_at > now() - interval '24 hours';
  IF v_day + p_delta > 3000 THEN
    RAISE EXCEPTION 'daily_limit';
  END IF;

  UPDATE students SET arena_marks = COALESCE(arena_marks,0) + p_delta
    WHERE name=p_user_name AND class_code=p_class_code;
  INSERT INTO marks_log(user_name,class_code,delta,source,source_detail)
    VALUES(p_user_name,p_class_code,p_delta,p_source,p_source_detail);
  RETURN p_delta;
END;
$function$;
