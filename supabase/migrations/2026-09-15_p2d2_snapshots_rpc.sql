-- ════════════════════════════════════════════════════════════════════════
-- Verrou des tables satellites — lot 3 : weekly_snapshots, fichier 1/2
-- (2026-09-15, voir .claude/plans/effervescent-gliding-neumann.md)
-- ════════════════════════════════════════════════════════════════════════
-- ETAT AVANT. La table est lisible et ecrivable par n'importe qui avec la cle
-- publique : nom, cohorte, XP hebdomadaire et module_scores_snapshot de chaque
-- eleve, semaine par semaine. C'est la donnee pedagogique nominative la plus
-- detaillee qui reste exposee apres le verrou de `students`.
--
-- SES 3 POLICIES NE PROTEGEAIENT RIEN et ont ete supprimees par le lot 1
-- (2026-09-15_p2d0_schema_hygiene.sql). Rappel du piege, parce qu'il vaut pour
-- toute la Phase C : `allow_authenticated` etait ALL / authenticated /
-- USING true / CHECK true, et les policies PERMISSIVE sont **ORees**. Un simple
-- ENABLE ROW LEVEL SECURITY aurait bloque anon tout en laissant grand ouvert
-- tout compte connecte — et un JWT `authenticated`, ca s'obtient en creant un
-- compte eleve. La protection vient des PRIVILEGES (fichier 2), pas des policies.
--
-- ⚠️ CE FICHIER EST INERTE : il n'ajoute que des fonctions, ne revoque rien.
-- A appliquer AVANT de deployer le client. Le fichier 2 ne vient qu'APRES
-- verification en production.
--
-- REPARTITION DES 6 APPELS CLIENT :
--   · 2 sont "mes lignes a moi"      -> student_guard          (1 et 2 ci-dessous)
--   · 2 sont "la cohorte", classement -> RPC bornees, sans garde (3 et 4)
--   · 1 est le dashboard formateur    -> teacher_role_of        (5)
--   · 1 est la purge RGPD             -> deja couvert par delete_my_account
--
-- POURQUOI DES RPC BORNEES ET PAS UNE VUE pour les deux lectures de cohorte :
-- une vue publique resterait videable d'un seul GET pour n'importe quelle
-- cohorte. Les RPC exposent la meme donnee qu'aujourd'hui (le classement est
-- public par nature dans l'app) mais avec des colonnes figees, une limite dure
-- et la ligne Teacher exclue cote serveur.
-- ════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════════
-- 0) Garde-fou : la contrainte unique attendue par le ON CONFLICT existe-t-elle
-- ════════════════════════════════════════════════════════════════════════
-- save_weekly_snapshot fait ON CONFLICT (student_name, class_code, week_id),
-- exactement comme l'upsert du client aujourd'hui. Mais l'inference du ON
-- CONFLICT est verifiee A L'EXECUTION, pas a la creation de la fonction : si
-- l'index unique ne portait pas precisement ces trois colonnes, on ne s'en
-- apercevrait qu'au premier changement de semaine reel d'un eleve, en
-- production, une semaine plus tard. On verifie tout de suite.
DO $$
DECLARE v_found boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
      FROM pg_index i
      JOIN pg_class c ON c.oid = i.indrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relname = 'weekly_snapshots'
       AND i.indisunique
       AND (SELECT array_agg(att.attname::text ORDER BY att.attname)
              FROM unnest(i.indkey) AS k(attnum)
              JOIN pg_attribute att
                ON att.attrelid = i.indrelid AND att.attnum = k.attnum)
           = ARRAY['class_code','student_name','week_id']
  ) INTO v_found;
  IF NOT v_found THEN
    RAISE EXCEPTION
      'Aucun index unique sur weekly_snapshots(student_name, class_code, week_id) : le ON CONFLICT de save_weekly_snapshot echouerait en production. Migration interrompue.';
  END IF;
END
$$;


-- ════════════════════════════════════════════════════════════════════════
-- 1) Ecriture de SON snapshot de fin de semaine
-- ════════════════════════════════════════════════════════════════════════
-- Remplace l'upsert de pushWeeklySnapshot() (App.jsx ~346).
--
-- LISTE BLANCHE DE COLONNES, comme save_student : le client envoie un payload
-- jsonb, le serveur ne lit que les cles qu'il connait. `user_id` n'en fait PAS
-- partie — il est pris dans le JWT, jamais dans le payload, sinon n'importe qui
-- pourrait s'attribuer les snapshots d'un autre (et donc les faire supprimer
-- par sa propre purge RGPD, qui efface par user_id).
--
-- On conserve le comportement actuel : pas de session auth -> pas d'ecriture.
-- La difference est qu'on le DIT maintenant ('not_authenticated') au lieu de
-- sortir en silence.
CREATE OR REPLACE FUNCTION public.save_weekly_snapshot(
  p_name text, p_class_code text, p_payload jsonb)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_g text; v_uid uuid; v_week_id text; v_week_start date;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  v_week_id := NULLIF(p_payload->>'week_id', '');
  IF v_week_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_week_id');
  END IF;

  BEGIN
    v_week_start := (p_payload->>'week_start')::date;
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('ok', false, 'error', 'bad_week_start');
  END;
  IF v_week_start IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'bad_week_start');
  END IF;

  v_g := student_guard(p_name, p_class_code);
  IF v_g <> 'ok' THEN
    RETURN jsonb_build_object('ok', false, 'error', v_g);
  END IF;

  INSERT INTO weekly_snapshots (
    user_id, student_name, class_code, week_id, week_start,
    xp_this_week, xp_cumulative, daily_completions, streak_at_end,
    stats_snapshot, module_scores_snapshot, mock_results_snapshot,
    achievements_count)
  VALUES (
    v_uid, p_name, p_class_code, v_week_id, v_week_start,
    COALESCE((p_payload->>'xp_this_week')::int, 0),
    COALESCE((p_payload->>'xp_cumulative')::int, 0),
    COALESCE((p_payload->>'daily_completions')::int, 0),
    COALESCE((p_payload->>'streak_at_end')::int, 0),
    COALESCE(p_payload->'stats_snapshot', '{}'::jsonb),
    COALESCE(p_payload->'module_scores_snapshot', '{}'::jsonb),
    COALESCE(p_payload->'mock_results_snapshot', '{}'::jsonb),
    COALESCE((p_payload->>'achievements_count')::int, 0))
  ON CONFLICT (student_name, class_code, week_id) DO UPDATE SET
    user_id                = EXCLUDED.user_id,
    week_start             = EXCLUDED.week_start,
    xp_this_week           = EXCLUDED.xp_this_week,
    xp_cumulative          = EXCLUDED.xp_cumulative,
    daily_completions      = EXCLUDED.daily_completions,
    streak_at_end          = EXCLUDED.streak_at_end,
    stats_snapshot         = EXCLUDED.stats_snapshot,
    module_scores_snapshot = EXCLUDED.module_scores_snapshot,
    mock_results_snapshot  = EXCLUDED.mock_results_snapshot,
    achievements_count     = EXCLUDED.achievements_count;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.save_weekly_snapshot(text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.save_weekly_snapshot(text, text, jsonb) TO anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════
-- 2) Lecture de SES propres snapshots
-- ════════════════════════════════════════════════════════════════════════
-- Couvre DEUX appels qui posaient la meme question avec des bornes differentes :
--   · MentorGoalCard (App.jsx ~5029) : ses 6 derniers, du plus recent au plus ancien ;
--   · checkWeeklyToeicChest (~17194) : le dernier HORS semaine en cours, pour
--     avoir une base de comparaison TOEIC.
-- D'ou p_limit et p_exclude_week_id. Colonnes figees : les deux appelants ne
-- lisent que week_id, week_start et module_scores_snapshot.
CREATE OR REPLACE FUNCTION public.my_weekly_snapshots(
  p_name text, p_class_code text, p_limit integer DEFAULT 6,
  p_exclude_week_id text DEFAULT NULL)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $function$
DECLARE v_g text; v_rows jsonb;
BEGIN
  v_g := student_guard(p_name, p_class_code);
  IF v_g <> 'ok' THEN
    RETURN jsonb_build_object('ok', false, 'error', v_g);
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.week_start DESC), '[]'::jsonb)
    INTO v_rows
    FROM (
      SELECT week_id, week_start, module_scores_snapshot
        FROM weekly_snapshots
       WHERE lower(student_name) = lower(p_name)
         AND class_code = p_class_code
         AND (p_exclude_week_id IS NULL OR week_id <> p_exclude_week_id)
       ORDER BY week_start DESC
       LIMIT LEAST(GREATEST(COALESCE(p_limit, 6), 1), 60)
    ) t;

  RETURN jsonb_build_object('ok', true, 'snapshots', v_rows);
END;
$function$;

REVOKE ALL ON FUNCTION public.my_weekly_snapshots(text, text, integer, text) FROM public;
GRANT EXECUTE ON FUNCTION public.my_weekly_snapshots(text, text, integer, text) TO anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════
-- 3) Progression de la cohorte (League -> onglet Progres)
-- ════════════════════════════════════════════════════════════════════════
-- Remplace App.jsx ~14484, qui tirait 3 colonnes sur toute la cohorte avec
-- limit 500. Pas de garde de propriete : c'est un classement, la donnee est
-- deja publique dans l'app (meme statut que students_public et
-- class_median_xp). Ce qui change, c'est qu'on ne peut plus faire un select=*
-- : colonnes figees, plafond dur, Teacher exclu en SQL.
CREATE OR REPLACE FUNCTION public.class_weekly_progress(p_class_code text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $function$
DECLARE v_rows jsonb;
BEGIN
  IF COALESCE(p_class_code, '') = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_class_code');
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.week_start ASC), '[]'::jsonb)
    INTO v_rows
    FROM (
      SELECT student_name, week_start, module_scores_snapshot
        FROM weekly_snapshots
       WHERE class_code = p_class_code
         AND student_name <> 'Teacher'
       ORDER BY week_start ASC
       LIMIT 500
    ) t;

  RETURN jsonb_build_object('ok', true, 'snapshots', v_rows);
END;
$function$;

REVOKE ALL ON FUNCTION public.class_weekly_progress(text) FROM public;
GRANT EXECUTE ON FUNCTION public.class_weekly_progress(text) TO anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════
-- 4) Podium de la semaine ecoulee (coffre + Darics)
-- ════════════════════════════════════════════════════════════════════════
-- Remplace App.jsx ~17221. Le client a besoin du rang exact (0/1/2) pour
-- graduer la recompense en Darics : on renvoie donc les 3 premiers dans
-- l'ordre, et rien d'autre.
CREATE OR REPLACE FUNCTION public.class_week_podium(p_class_code text, p_week_id text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
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
       ORDER BY xp_this_week DESC
       LIMIT 3
    ) t;

  RETURN jsonb_build_object('ok', true, 'podium', v_rows);
END;
$function$;

REVOKE ALL ON FUNCTION public.class_week_podium(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.class_week_podium(text, text) TO anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════
-- 5) Rapport hebdomadaire du dashboard formateur
-- ════════════════════════════════════════════════════════════════════════
-- Remplace le select('*') de WeeklyReport (App.jsx ~12110), qui tirait toute la
-- cohorte sur deux semaines. Meme patron d'autorisation que teacher_students /
-- teacher_feedback (B4/B5) : code valide par teacher_role_of, et proprietaire
-- de la cohorte sauf role admin.
-- On ne renvoie ni `id`, ni `user_id`, ni `created_at` : le rapport n'en a pas
-- besoin, et user_id est la clef d'effacement RGPD.
CREATE OR REPLACE FUNCTION public.teacher_weekly_snapshots(
  p_code text, p_class_code text, p_week_starts date[])
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $function$
DECLARE v_role text; v_rows jsonb;
BEGIN
  v_role := teacher_role_of(p_code);
  IF v_role IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;
  IF v_role <> 'admin'
     AND p_class_code NOT IN (SELECT code FROM groups WHERE teacher_code = p_code) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;
  IF p_week_starts IS NULL OR array_length(p_week_starts, 1) IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_weeks');
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_rows
    FROM (
      SELECT student_name, class_code, week_id, week_start,
             xp_this_week, xp_cumulative, daily_completions, streak_at_end,
             stats_snapshot, module_scores_snapshot, mock_results_snapshot,
             achievements_count
        FROM weekly_snapshots
       WHERE class_code = p_class_code
         AND week_start = ANY(p_week_starts)
       LIMIT 500
    ) t;

  RETURN jsonb_build_object('ok', true, 'snapshots', v_rows);
END;
$function$;

REVOKE ALL ON FUNCTION public.teacher_weekly_snapshots(text, text, date[]) FROM public;
GRANT EXECUTE ON FUNCTION public.teacher_weekly_snapshots(text, text, date[]) TO anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════
-- Verification (avant de toucher au client)
-- ════════════════════════════════════════════════════════════════════════
-- Remplacer <eleve>/<cohorte>/<code admin> par des valeurs reelles.
--
-- 1) Les 5 fonctions existent en DEFINER avec search_path fige :
--    SELECT proname, prosecdef, proconfig FROM pg_proc p
--      JOIN pg_namespace n ON n.oid=p.pronamespace
--     WHERE n.nspname='public' AND proname IN ('save_weekly_snapshot',
--       'my_weekly_snapshots','class_weekly_progress','class_week_podium',
--       'teacher_weekly_snapshots');
--
-- 2) Lecture de cohorte, doit renvoyer des lignes sans Teacher :
--    SELECT jsonb_array_length(public.class_weekly_progress('<cohorte>')->'snapshots');
--    SELECT public.class_week_podium('<cohorte>','<week_id>');
--
-- 3) Dashboard :
--    SELECT jsonb_array_length(
--      public.teacher_weekly_snapshots('<code admin>','<cohorte>',
--        ARRAY['2026-09-01','2026-09-08']::date[])->'snapshots');
--    SELECT public.teacher_weekly_snapshots('code-bidon','<cohorte>',
--        ARRAY['2026-09-01']::date[]);   -- doit renvoyer invalid_code
--
-- 4) Snapshots perso (en SQL, auth.uid() est NULL donc la garde s'applique en
--    mode legacy — un compte deja migre repondra not_owner, c'est normal) :
--    SELECT public.my_weekly_snapshots('<eleve>','<cohorte>',6,NULL);
--
-- 5) Rien n'est encore verrouille : weekly_snapshots doit toujours porter ses
--    privileges. C'est le filet. Le fichier 2 ne se joue qu'apres la
--    verification en production du client deploye.
