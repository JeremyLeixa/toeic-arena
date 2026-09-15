-- ════════════════════════════════════════════════════════════════════════
-- Verrou des tables satellites — lot 2 : push_subscriptions, fichier 1/2
-- (2026-09-15, voir .claude/plans/effervescent-gliding-neumann.md)
-- ════════════════════════════════════════════════════════════════════════
-- POURQUOI CETTE TABLE D'ABORD. C'est la plus dangereuse des six : les endpoints
-- push de tous les eleves y sont lisibles ET supprimables avec la cle publique.
-- Un `DELETE /rest/v1/push_subscriptions?class_code=eq.idrac2026` coupe les
-- notifications de toute une promo, sans trace et sans que personne s'en
-- apercoive avant la prochaine relance de streak.
--
-- ⚠️ CE FICHIER EST INERTE : il ne revoque rien, il n'ajoute que deux fonctions.
-- A appliquer AVANT de deployer le client. Le fichier 2 (le verrou) ne vient
-- qu'APRES verification en production. Tant qu'il n'est pas passe, reverter le
-- commit client suffit a tout remettre d'aplomb — c'est le seul filet.
--
-- DECISION DE CONCEPTION : les deux fonctions EXIGENT l'endpoint, et aucune
-- forme "supprime tous mes abonnements" n'est exposee. C'est ce qui protege
-- reellement les comptes encore legacy : `student_guard` les laisse passer par
-- tolerance (159 comptes sur 160 n'ont pas de user_id), mais apres le fichier 2
-- l'endpoint n'est plus lisible, donc plus devinable. La garde de propriete et
-- le secret de l'endpoint se completent ; aucune des deux ne suffit seule.
-- ════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════════
-- 1) Enregistrement d'un abonnement
-- ════════════════════════════════════════════════════════════════════════
-- Remplace le couple delete-puis-insert de subscribePush() (App.jsx ~1314),
-- qui n'etait pas atomique : entre les deux appels REST, l'eleve pouvait se
-- retrouver sans aucune ligne.
--
-- Retour : {ok:true} ou {ok:false, error:'no_row'|'not_owner'|'bad_endpoint'|'endpoint_mismatch'}.
CREATE OR REPLACE FUNCTION public.upsert_push_subscription(
  p_name text, p_class_code text, p_endpoint text, p_subscription jsonb)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_g text; v_excess uuid[];
BEGIN
  IF p_endpoint IS NULL OR length(p_endpoint) < 12 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'bad_endpoint');
  END IF;
  -- Le payload doit decrire l'endpoint annonce : sinon on stockerait un objet
  -- d'abonnement qui ne correspond pas a la cle de deduplication, et push-send
  -- enverrait vers une adresse qu'on ne sait plus nettoyer sur un 410 Gone.
  IF COALESCE(p_subscription->>'endpoint', '') <> p_endpoint THEN
    RETURN jsonb_build_object('ok', false, 'error', 'endpoint_mismatch');
  END IF;

  v_g := student_guard(p_name, p_class_code);
  IF v_g <> 'ok' THEN
    RETURN jsonb_build_object('ok', false, 'error', v_g);
  END IF;

  DELETE FROM push_subscriptions
   WHERE student_name = p_name AND class_code = p_class_code AND endpoint = p_endpoint;

  INSERT INTO push_subscriptions (student_name, class_code, subscription, endpoint)
  VALUES (p_name, p_class_code, p_subscription, p_endpoint);

  -- Plafond souple a 10 appareils. On ELAGUE les plus anciens plutot que de
  -- refuser : un eleve legitime qui change de telephone ne doit jamais se voir
  -- refuser ses notifications, alors qu'un compte legacy usurpe ne doit pas
  -- pouvoir gonfler la table indefiniment. Les lignes reellement mortes sont
  -- deja nettoyees par api/push-send.js sur 410 Gone.
  SELECT array_agg(id) INTO v_excess FROM (
    SELECT id FROM push_subscriptions
     WHERE student_name = p_name AND class_code = p_class_code
     ORDER BY created_at DESC NULLS LAST
    OFFSET 10
  ) old_rows;
  IF v_excess IS NOT NULL THEN
    DELETE FROM push_subscriptions WHERE id = ANY(v_excess);
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.upsert_push_subscription(text, text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.upsert_push_subscription(text, text, text, jsonb) TO anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════
-- 2) Desabonnement
-- ════════════════════════════════════════════════════════════════════════
-- Remplace le delete de unsubscribePush() (App.jsx ~1333). Meme signature de
-- ciblage que l'insert : (nom, cohorte, endpoint). Pas de suppression en lot.
CREATE OR REPLACE FUNCTION public.delete_push_subscription(
  p_name text, p_class_code text, p_endpoint text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_g text; v_n integer;
BEGIN
  IF p_endpoint IS NULL OR length(p_endpoint) < 12 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'bad_endpoint');
  END IF;

  v_g := student_guard(p_name, p_class_code);
  IF v_g <> 'ok' THEN
    RETURN jsonb_build_object('ok', false, 'error', v_g);
  END IF;

  DELETE FROM push_subscriptions
   WHERE student_name = p_name AND class_code = p_class_code AND endpoint = p_endpoint;
  GET DIAGNOSTICS v_n = ROW_COUNT;

  RETURN jsonb_build_object('ok', true, 'deleted', v_n);
END;
$function$;

REVOKE ALL ON FUNCTION public.delete_push_subscription(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.delete_push_subscription(text, text, text) TO anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════
-- Verification post-migration
-- ════════════════════════════════════════════════════════════════════════
-- 1) Les deux fonctions existent, en DEFINER, avec search_path fige :
--
--    SELECT proname, prosecdef, proconfig
--      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--     WHERE n.nspname='public'
--       AND proname IN ('upsert_push_subscription','delete_push_subscription');
--
-- 2) Rien n'est encore verrouille a ce stade : push_subscriptions doit toujours
--    porter ses privileges. C'est normal, c'est le filet. Le fichier 2
--    (2026-09-15_p2d1_lock_push.sql) ne se joue qu'apres la verification en
--    production du client deploye.
