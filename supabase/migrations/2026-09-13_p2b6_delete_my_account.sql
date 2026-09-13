-- ════════════════════════════════════════════════════════════════════════
-- P2 Phase B (B6) — effacement de compte RGPD par RPC server-side
-- (2026-09-13, voir SECURITY_PENTEST_2026-09-11.md + plan jaunty-munching-frost)
-- ════════════════════════════════════════════════════════════════════════
-- BUG CORRIGÉ. deleteAccount()/reset() supprimaient la ligne students par
-- `.eq('id', auth_uid)` — or students.id est un PK aléatoire auto-généré, JAMAIS
-- égal à l'auth uid → 0 ligne supprimée, le compte SURVIVAIT à la "suppression"
-- (échec RGPD droit à l'effacement).
--
-- FAIT VÉRIFIÉ 2026-09-13 : le rôle `authenticated` n'a PAS le privilège DELETE sur
-- students (un DELETE client renvoie 0 ligne). Donc (a) impossible de réparer le
-- self-delete uniquement côté client, et (b) un élève ne peut pas non plus supprimer
-- la ligne d'un AUTRE (pas de vecteur cross-user). Seule voie = cette RPC DEFINER.
--
-- OWNERSHIP STRICTE (pas de grâce) : contrairement à grant/spend (où la grâce évite
-- de casser l'accrual des legacy), le delete est IRRÉVERSIBLE — on n'autorise donc
-- QUE le propriétaire d'un compte migré (auth.uid() = user_id). Un compte legacy non
-- migré (user_id NULL) doit d'abord être sécurisé (mot de passe → user_id bindé)
-- avant de pouvoir être effacé ; sinon n'importe qui pourrait effacer un legacy.
--
-- NB : on ne supprime PAS l'entrée auth.users (l'email synthétique dérivé du prénom
-- y subsiste — résidu mineur). À traiter via l'API auth admin dans un second temps si
-- besoin (droit à l'effacement complet).
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.delete_my_account(p_name text, p_class_code text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_owner uuid; v_uid uuid; v_found boolean;
BEGIN
  v_uid := auth.uid();
  SELECT user_id, true INTO v_owner, v_found
    FROM students WHERE name = p_name AND class_code = p_class_code;
  IF NOT COALESCE(v_found, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_student');
  END IF;
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_secured');
  END IF;
  IF v_owner IS DISTINCT FROM v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  DELETE FROM weekly_snapshots   WHERE user_id = v_uid;
  DELETE FROM push_subscriptions WHERE student_name = p_name AND class_code = p_class_code;
  DELETE FROM player_rewards     WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM player_tokens      WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM pending_chests     WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM chest_log          WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM shop_purchases     WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM marks_log          WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM students           WHERE name = p_name AND class_code = p_class_code;

  RETURN jsonb_build_object('ok', true);
END;
$function$;
