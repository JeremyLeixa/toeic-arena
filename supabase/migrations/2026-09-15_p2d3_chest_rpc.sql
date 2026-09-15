-- ════════════════════════════════════════════════════════════════════════
-- Verrou des tables satellites — lot 4 : les 4 tables de coffres, fichier 1/2
-- (2026-09-15, voir .claude/plans/effervescent-gliding-neumann.md)
-- ════════════════════════════════════════════════════════════════════════
-- Concerne player_rewards, pending_chests, chest_log et player_tokens, toutes
-- lisibles et ecrivables avec la cle publique aujourd'hui.
--
-- ⚠️ CE FICHIER EST INERTE : il n'ajoute que des fonctions, ne revoque rien.
-- A appliquer AVANT de deployer le client. Le fichier 2 ne vient qu'APRES
-- verification en production.
--
-- PERIMETRE, DIT FRANCHEMENT. Ces RPC ferment le **cross-user** (ouvrir le
-- coffre d'un autre, vider son inventaire, lire ce qu'il possede) et la lecture
-- de masse. Elles ne ferment PAS le **self-grant** : le tirage des recompenses
-- reste calcule cote client (pickRewards), donc un eleve determine peut encore
-- s'accorder ce qu'il veut en appelant open_pending_chest avec le contenu de
-- son choix. C'est exactement la position tenue en B1 sur le self-mint de
-- Darics, et c'est un choix : porter DROP_TABLES en PL/pgSQL est un autre
-- chantier, avec un vrai risque de casser un drop legitime.
--
-- player_tokens n'a AUCUNE ecriture a migrer : grant_token / consume_token /
-- spend_marks existent deja et sont passees SECURITY DEFINER + garde en B1.
-- Seule sa lecture bascule.
-- ════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════════
-- 1) Lectures — trois fonctions, une par table
-- ════════════════════════════════════════════════════════════════════════
-- Correspondance 1:1 avec getPendingChests / getOwnedRewards / getOwnedTokens
-- (src/data/chests.js). Volontairement sans regroupement : ces trois appels se
-- font a des moments differents (ouverture de coffre, ecran Collection, badge
-- de jeton), les fusionner aurait complique la verification pour rien.

CREATE OR REPLACE FUNCTION public.my_pending_chests(p_name text, p_class_code text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $function$
DECLARE v_g text; v_rows jsonb;
BEGIN
  v_g := student_guard(p_name, p_class_code);
  IF v_g <> 'ok' THEN RETURN jsonb_build_object('ok', false, 'error', v_g); END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.earned_at ASC), '[]'::jsonb)
    INTO v_rows
    FROM (
      SELECT id, user_name, class_code, chest_type, trigger_source, earned_at
        FROM pending_chests
       WHERE lower(user_name) = lower(p_name) AND class_code = p_class_code
       ORDER BY earned_at ASC
       LIMIT 200
    ) t;

  RETURN jsonb_build_object('ok', true, 'chests', v_rows);
END;
$function$;

CREATE OR REPLACE FUNCTION public.my_rewards(p_name text, p_class_code text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $function$
DECLARE v_g text; v_rows jsonb;
BEGIN
  v_g := student_guard(p_name, p_class_code);
  IF v_g <> 'ok' THEN RETURN jsonb_build_object('ok', false, 'error', v_g); END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_rows
    FROM (
      SELECT id, user_name, class_code, reward_type, reward_id, rarity,
             xp_amount, is_equipped, obtained_at
        FROM player_rewards
       WHERE lower(user_name) = lower(p_name) AND class_code = p_class_code
       LIMIT 2000
    ) t;

  RETURN jsonb_build_object('ok', true, 'rewards', v_rows);
END;
$function$;

CREATE OR REPLACE FUNCTION public.my_tokens(p_name text, p_class_code text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $function$
DECLARE v_g text; v_rows jsonb;
BEGIN
  v_g := student_guard(p_name, p_class_code);
  IF v_g <> 'ok' THEN RETURN jsonb_build_object('ok', false, 'error', v_g); END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_rows
    FROM (
      SELECT token_type, quantity
        FROM player_tokens
       WHERE lower(user_name) = lower(p_name) AND class_code = p_class_code
    ) t;

  RETURN jsonb_build_object('ok', true, 'tokens', v_rows);
END;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 2) Attribution d'un coffre — verification ET insertion dans la MEME transaction
-- ════════════════════════════════════════════════════════════════════════
-- Remplace DEUX appels client qui allaient toujours par paire :
--   hasUniqueTrigger(...) puis grantChest(...)   -> p_cooldown_days = NULL
--   isWeeklyCooldown(...) puis grantChest(...)   -> p_cooldown_days = 7
--
-- CE N'EST PAS QU'UN DEPLACEMENT. Le couple client etait un TOCTOU : entre le
-- "est-ce deja attribue ?" et l'INSERT, rien n'empechait un second appel de
-- passer. C'est precisement ce qui s'est produit le 2026-04-27, quand le
-- watcher de maitrise de module re-declenchait sur chaque sv() : une dizaine de
-- grantChest en parallele couraient tous contre un chest_log pas encore ecrit,
-- d'ou des lignes pending_chests en double et +37k XP fantomes. Ici la lecture
-- et l'ecriture sont dans la meme transaction, la course n'existe plus.
--
-- Retour : {ok:true, granted:true} si le coffre est cree,
--          {ok:true, granted:false, reason:'already'|'cooldown'} sinon.
CREATE OR REPLACE FUNCTION public.grant_pending_chest(
  p_name text, p_class_code text, p_chest_type text, p_trigger text,
  p_cooldown_days integer DEFAULT NULL)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_g text; v_seen boolean;
BEGIN
  IF COALESCE(p_trigger, '') = '' OR COALESCE(p_chest_type, '') = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_params');
  END IF;
  IF p_chest_type NOT IN ('novice', 'guerrier', 'champion', 'legendaire') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'bad_chest_type');
  END IF;

  v_g := student_guard(p_name, p_class_code);
  IF v_g <> 'ok' THEN RETURN jsonb_build_object('ok', false, 'error', v_g); END IF;

  -- Un coffre du meme trigger deja en attente bloque dans les deux modes :
  -- il n'a pas encore ete ouvert, donc il n'est pas encore dans chest_log.
  SELECT EXISTS (
    SELECT 1 FROM pending_chests
     WHERE lower(user_name) = lower(p_name) AND class_code = p_class_code
       AND trigger_source = p_trigger
  ) INTO v_seen;
  IF v_seen THEN
    RETURN jsonb_build_object('ok', true, 'granted', false, 'reason', 'already');
  END IF;

  IF p_cooldown_days IS NULL THEN
    -- Mode unique : une fois dans une vie (xp_10k, mock_1, ach_*, mastery_*…).
    SELECT EXISTS (
      SELECT 1 FROM chest_log
       WHERE lower(user_name) = lower(p_name) AND class_code = p_class_code
         AND trigger_source = p_trigger
    ) INTO v_seen;
    IF v_seen THEN
      RETURN jsonb_build_object('ok', true, 'granted', false, 'reason', 'already');
    END IF;
  ELSE
    -- Mode cooldown : re-attribuable, mais pas avant N jours.
    SELECT EXISTS (
      SELECT 1 FROM chest_log
       WHERE lower(user_name) = lower(p_name) AND class_code = p_class_code
         AND trigger_source = p_trigger
         AND opened_at >= now() - make_interval(days => GREATEST(p_cooldown_days, 0))
    ) INTO v_seen;
    IF v_seen THEN
      RETURN jsonb_build_object('ok', true, 'granted', false, 'reason', 'cooldown');
    END IF;
  END IF;

  INSERT INTO pending_chests (user_name, class_code, chest_type, trigger_source)
  VALUES (p_name, p_class_code, p_chest_type, p_trigger);

  RETURN jsonb_build_object('ok', true, 'granted', true);
END;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 3) Ouverture d'un coffre — les trois ecritures en une transaction
-- ════════════════════════════════════════════════════════════════════════
-- Remplace, dans openChestFromPending : l'INSERT des recompenses dans
-- player_rewards, l'INSERT du recapitulatif dans chest_log, et le DELETE de la
-- ligne pending.
--
-- Le client tenait cet enchainement a la main, avec un commentaire expliquant
-- que si l'INSERT de chest_log echouait il ne fallait SURTOUT pas supprimer le
-- pending, sous peine de rendre le trigger re-attribuable sans trace. Cette
-- precaution devient inutile : les trois ecritures reussissent ou echouent
-- ensemble.
--
-- IDEMPOTENCE : on exige que la ligne pending existe ET appartienne a
-- l'appelant. Un second appel avec le meme id ne trouve plus rien et ressort
-- 'already_opened' sans rien reinserer — pas de double recompense si le reseau
-- fait rejouer la requete.
--
-- Les jetons ne passent pas par ici : ils sont accordes par grant_token, deja
-- gardee depuis B1. Meme decoupage qu'aujourd'hui.
CREATE OR REPLACE FUNCTION public.open_pending_chest(
  p_pending_id uuid, p_name text, p_class_code text,
  p_rewards jsonb, p_total_xp integer, p_rarity text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_g text; v_chest pending_chests%ROWTYPE; v_r jsonb; v_type text; v_n integer := 0;
BEGIN
  v_g := student_guard(p_name, p_class_code);
  IF v_g <> 'ok' THEN RETURN jsonb_build_object('ok', false, 'error', v_g); END IF;

  SELECT * INTO v_chest FROM pending_chests
   WHERE id = p_pending_id
     AND lower(user_name) = lower(p_name)
     AND class_code = p_class_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_opened');
  END IF;

  -- Recompenses persistantes. Les types xp / daric / token sont traites
  -- ailleurs par l'appelant : on les ignore silencieusement ici.
  IF jsonb_typeof(p_rewards) = 'array' THEN
    FOR v_r IN SELECT * FROM jsonb_array_elements(p_rewards) LOOP
      v_type := v_r->>'type';
      IF v_type IN ('avatar', 'skin', 'frame', 'title', 'cheat_sheet')
         AND COALESCE(v_r->>'id', '') <> '' THEN
        INSERT INTO player_rewards (user_name, class_code, reward_type, reward_id, rarity)
        VALUES (p_name, p_class_code, v_type, v_r->>'id',
                COALESCE(v_r->>'rarity', p_rarity, 'common'));
        v_n := v_n + 1;
      END IF;
    END LOOP;
  END IF;

  INSERT INTO chest_log (user_name, class_code, chest_type, trigger_source,
                         rarity_obtained, reward_type, reward_id, xp_amount)
  VALUES (p_name, p_class_code, v_chest.chest_type, v_chest.trigger_source,
          COALESCE(p_rarity, 'common'), 'multi', 'v2', NULLIF(p_total_xp, 0));

  DELETE FROM pending_chests WHERE id = p_pending_id;

  RETURN jsonb_build_object('ok', true, 'persisted', v_n);
END;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 4) Conversion de doublons cosmetiques
-- ════════════════════════════════════════════════════════════════════════
-- Remplace le trio SELECT / DELETE / DELETE de convertCosmeticDups.
--
-- LE PLANCHER PASSE EN SQL. La regle est : il faut au moins 4 exemplaires, et
-- on n'en supprime que 3 — l'original de l'eleve est TOUJOURS preserve.
-- Jusqu'ici ce garde-fou n'existait que dans le JS, c'est-a-dire nulle part du
-- point de vue de la base. On supprime les 3 plus RECENTS et on garde le plus
-- ancien, pour que le choix soit deterministe (le client prenait 3 lignes dans
-- un ordre non specifie).
--
-- L'attribution du jeton reste cote appelant, via grant_token : inchange.
CREATE OR REPLACE FUNCTION public.convert_cosmetic_dups(
  p_name text, p_class_code text, p_reward_type text, p_reward_id text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_g text; v_total integer; v_ids uuid[];
BEGIN
  v_g := student_guard(p_name, p_class_code);
  IF v_g <> 'ok' THEN RETURN jsonb_build_object('ok', false, 'error', v_g); END IF;

  SELECT count(*) INTO v_total FROM player_rewards
   WHERE lower(user_name) = lower(p_name) AND class_code = p_class_code
     AND reward_type = p_reward_type AND reward_id = p_reward_id;

  IF v_total < 4 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_enough_duplicates', 'owned', v_total);
  END IF;

  SELECT array_agg(id) INTO v_ids FROM (
    SELECT id FROM player_rewards
     WHERE lower(user_name) = lower(p_name) AND class_code = p_class_code
       AND reward_type = p_reward_type AND reward_id = p_reward_id
     ORDER BY obtained_at DESC NULLS LAST
     LIMIT 3
  ) dups;

  DELETE FROM player_rewards WHERE id = ANY(v_ids);

  RETURN jsonb_build_object('ok', true, 'deleted', array_length(v_ids, 1), 'remaining', v_total - 3);
END;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 5) Attribution unique d'une recompense (titre jalon)
-- ════════════════════════════════════════════════════════════════════════
-- Remplace le couple SELECT-puis-INSERT de maybeGrantBourse (App.jsx), qui
-- accorde le titre "Bourse Inepuisable" au franchissement de 10 000 Darics
-- depenses. Meme TOCTOU que grant_pending_chest : deux appels rapproches
-- pouvaient inserer le titre deux fois. Ici c'est une seule transaction.
CREATE OR REPLACE FUNCTION public.grant_reward_once(
  p_name text, p_class_code text, p_reward_type text, p_reward_id text, p_rarity text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_g text; v_exists boolean;
BEGIN
  IF p_reward_type NOT IN ('avatar', 'skin', 'frame', 'title', 'cheat_sheet') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'bad_reward_type');
  END IF;
  IF COALESCE(p_reward_id, '') = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_reward_id');
  END IF;

  v_g := student_guard(p_name, p_class_code);
  IF v_g <> 'ok' THEN RETURN jsonb_build_object('ok', false, 'error', v_g); END IF;

  SELECT EXISTS (
    SELECT 1 FROM player_rewards
     WHERE lower(user_name) = lower(p_name) AND class_code = p_class_code
       AND reward_type = p_reward_type AND reward_id = p_reward_id
  ) INTO v_exists;
  IF v_exists THEN
    RETURN jsonb_build_object('ok', true, 'granted', false);
  END IF;

  INSERT INTO player_rewards (user_name, class_code, reward_type, reward_id, rarity)
  VALUES (p_name, p_class_code, p_reward_type, p_reward_id, COALESCE(p_rarity, 'common'));

  RETURN jsonb_build_object('ok', true, 'granted', true);
END;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 6) Droits d'execution
-- ════════════════════════════════════════════════════════════════════════
-- REVOKE puis GRANT, jamais un GRANT seul.
REVOKE ALL ON FUNCTION public.my_pending_chests(text, text) FROM public;
REVOKE ALL ON FUNCTION public.my_rewards(text, text) FROM public;
REVOKE ALL ON FUNCTION public.my_tokens(text, text) FROM public;
REVOKE ALL ON FUNCTION public.grant_pending_chest(text, text, text, text, integer) FROM public;
REVOKE ALL ON FUNCTION public.open_pending_chest(uuid, text, text, jsonb, integer, text) FROM public;
REVOKE ALL ON FUNCTION public.convert_cosmetic_dups(text, text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.grant_reward_once(text, text, text, text, text) FROM public;

GRANT EXECUTE ON FUNCTION public.my_pending_chests(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.my_rewards(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.my_tokens(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_pending_chest(text, text, text, text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.open_pending_chest(uuid, text, text, jsonb, integer, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.convert_cosmetic_dups(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_reward_once(text, text, text, text, text) TO anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════
-- Verification (avant de toucher au client)
-- ════════════════════════════════════════════════════════════════════════
-- Remplacer <eleve>/<cohorte> par des valeurs reelles.
--
-- 1) Les 7 fonctions existent en DEFINER avec search_path fige :
--    SELECT proname, prosecdef, proconfig FROM pg_proc p
--      JOIN pg_namespace n ON n.oid=p.pronamespace
--     WHERE n.nspname='public' AND proname IN ('my_pending_chests','my_rewards',
--       'my_tokens','grant_pending_chest','open_pending_chest',
--       'convert_cosmetic_dups','grant_reward_once');
--
-- 2) Lectures (en SQL auth.uid() est NULL : un compte legacy repond, un compte
--    deja migre repond not_owner — c'est le comportement attendu) :
--    SELECT public.my_rewards('<eleve>','<cohorte>') -> 'ok';
--    SELECT jsonb_array_length(public.my_tokens('<eleve>','<cohorte>')->'tokens');
--
-- 3) Refus propres, sans rien ecrire :
--    SELECT public.grant_pending_chest('ZZPersonne','<cohorte>','novice','zz_test');
--      -- doit renvoyer ok:false / no_row
--    SELECT public.grant_pending_chest('<eleve>','<cohorte>','pas_un_type','zz_test');
--      -- doit renvoyer ok:false / bad_chest_type
--
-- 4) Rien n'est encore verrouille : les 4 tables doivent toujours porter leurs
--    privileges. C'est le filet. Le fichier 2 ne se joue qu'apres verification
--    en production du client deploye.
