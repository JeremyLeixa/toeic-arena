-- ════════════════════════════════════════════════════════════════════════
-- P2 Phase B (B5) — contenus du dashboard côté serveur, fichier 1/2 : les RPC
-- (2026-09-14, suite de B4 — voir .claude/plans/glowing-crunching-spark.md)
-- ════════════════════════════════════════════════════════════════════════
-- CE QU'ON FERME. B4 a fermé l'usurpation d'identité enseignante. Restaient
-- trois surfaces, toutes repérées pendant l'audit B4 :
--
--  1. `feedback_reports` était lue par le dashboard SANS AUCUN FILTRE : chaque
--     formateur partenaire voyait les retours NOMINATIFS (user_name, class_code,
--     message libre) de toutes les promos de la plateforme — fuite de PII entre
--     établissements clients. La table est en plus lisible par l'anon (RLS OFF).
--  2. Les écritures `events` n'étaient gardées que par le check localStorage du
--     dashboard : un formateur partenaire pouvait créer un événement
--     `class_code='all'`, donc un événement + un push sur TOUTE la plateforme.
--     Aucune borne non plus sur le multiplicateur ni sur la durée.
--  3. (traité hors SQL) `weekly-teacher-report` n'authentifiait pas son appelant.
--
-- PORTÉE, identique à B4 : admin = tout ; formateur = les cohortes dont il est le
-- `teacher_code`. On réutilise `teacher_role_of(p_code)` et `teacher_audit_log`
-- créés par 2026-09-13_p2b4_teacher_rpc.sql — aucune table nouvelle ici.
--
-- ⚠️ `p_id` est en TEXT et comparé via `id::text = p_id`. Raison : ça marche que
-- la PK soit bigint ou uuid, sans dépendre d'une introspection du schéma. Les
-- deux tables sont minuscules (20 événements, 200 reports) donc la perte d'index
-- est sans conséquence. Ne PAS copier ce choix sur `students`.
-- ════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════════
-- 1) teacher_feedback — l'onglet Feedback, scopé
-- ════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.teacher_feedback(p_code text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_role text; v_rows jsonb;
BEGIN
  v_role := teacher_role_of(p_code);
  IF v_role IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(f) ORDER BY f.created_at DESC), '[]'::jsonb)
    INTO v_rows
    FROM (
      SELECT * FROM feedback_reports f2
       WHERE v_role = 'admin'
          OR f2.class_code IN (SELECT code FROM groups WHERE teacher_code = p_code)
       ORDER BY f2.created_at DESC
       LIMIT 200
    ) f;

  RETURN jsonb_build_object('ok', true, 'role', v_role, 'reports', v_rows);
END;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 2) teacher_resolve_feedback — « Marquer résolu »
-- ════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.teacher_resolve_feedback(
  p_code text, p_id text, p_note text
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_role text; v_cc text;
BEGIN
  v_role := teacher_role_of(p_code);
  IF v_role IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;

  SELECT class_code INTO v_cc FROM feedback_reports WHERE id::text = p_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'no_report'); END IF;

  IF v_role <> 'admin'
     AND v_cc NOT IN (SELECT code FROM groups WHERE teacher_code = p_code) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  UPDATE feedback_reports
     SET status = 'resolved', resolved_at = now(),
         resolution_note = NULLIF(btrim(COALESCE(p_note,'')), '')
   WHERE id::text = p_id;

  INSERT INTO teacher_audit_log(actor, role, action, target, details)
    VALUES(left(md5(p_code),8), v_role, 'resolve_feedback', v_cc,
           jsonb_build_object('id', p_id));

  RETURN jsonb_build_object('ok', true);
END;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 3) teacher_create_event
-- ════════════════════════════════════════════════════════════════════════
-- `class_code = 'all'` (plateforme entière) est réservé à l'admin — c'était le
-- trou : un formateur partenaire pouvait arroser tous les établissements.
-- start_at/end_at sont calculés ICI : on ne reprend plus les timestamps fournis
-- par le client. multiplier et durée sont bornés (rien n'empêchait un x999
-- pendant un an, y compris par accident).
CREATE OR REPLACE FUNCTION public.teacher_create_event(
  p_code text, p_type text, p_title text, p_desc text,
  p_class_code text, p_hours integer, p_config jsonb
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_role text; v_hours integer; v_mult integer; v_config jsonb; v_title text;
BEGIN
  v_role := teacher_role_of(p_code);
  IF v_role IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;

  IF p_type NOT IN ('spotlight','flash_hour','comeback') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'bad_type');
  END IF;

  v_title := btrim(COALESCE(p_title,''));
  IF length(v_title) = 0 THEN RETURN jsonb_build_object('ok', false, 'error', 'no_title'); END IF;
  IF length(v_title) > 120 THEN v_title := left(v_title, 120); END IF;

  IF p_class_code = 'all' THEN
    IF v_role <> 'admin' THEN RETURN jsonb_build_object('ok', false, 'error', 'not_owner'); END IF;
  ELSIF v_role <> 'admin'
        AND p_class_code NOT IN (SELECT code FROM groups WHERE teacher_code = p_code) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  v_hours := GREATEST(1, LEAST(168, COALESCE(p_hours, 24)));

  BEGIN v_mult := (p_config->>'multiplier')::integer;
  EXCEPTION WHEN others THEN v_mult := 2; END;
  v_mult := GREATEST(1, LEAST(5, COALESCE(v_mult, 2)));
  v_config := jsonb_set(COALESCE(p_config, '{}'::jsonb), '{multiplier}', to_jsonb(v_mult));

  INSERT INTO events(type, title, description, start_at, end_at, config, class_code, active)
  VALUES(p_type, v_title, NULLIF(btrim(COALESCE(p_desc,'')), ''),
         now(), now() + (v_hours || ' hours')::interval,
         v_config, p_class_code, true);

  INSERT INTO teacher_audit_log(actor, role, action, target, details)
    VALUES(left(md5(p_code),8), v_role, 'create_event', p_class_code,
           jsonb_build_object('type', p_type, 'title', v_title, 'hours', v_hours, 'multiplier', v_mult));

  RETURN jsonb_build_object('ok', true);
END;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 4) teacher_stop_event
-- ════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.teacher_stop_event(p_code text, p_id text)
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_role text; v_cc text;
BEGIN
  v_role := teacher_role_of(p_code);
  IF v_role IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;

  SELECT class_code INTO v_cc FROM events WHERE id::text = p_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'no_event'); END IF;

  IF v_role <> 'admin'
     AND (v_cc = 'all' OR v_cc NOT IN (SELECT code FROM groups WHERE teacher_code = p_code)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  UPDATE events SET active = false WHERE id::text = p_id;

  INSERT INTO teacher_audit_log(actor, role, action, target, details)
    VALUES(left(md5(p_code),8), v_role, 'stop_event', v_cc,
           jsonb_build_object('id', p_id));

  RETURN jsonb_build_object('ok', true);
END;
$function$;


-- ── Vérification (avant même de toucher à l'UI) ────────────────────────
-- Avec un code de cohorte partenaire : ne doit renvoyer QUE ses reports.
--   SELECT public.teacher_feedback('<code partenaire>');
-- Avec le code admin : tout.
--   SELECT public.teacher_feedback('<code admin>');
-- Un partenaire qui vise toute la plateforme doit être refusé :
--   SELECT public.teacher_create_event('<code partenaire>','spotlight','x',null,'all',24,'{}'::jsonb);
--   -> {"ok": false, "error": "not_owner"}
