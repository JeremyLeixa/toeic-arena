-- ════════════════════════════════════════════════════════════════════════
-- RGPD : l'effacement purge aussi les messages de feedback (2026-09-24)
-- ════════════════════════════════════════════════════════════════════════
-- Relevé du 2026-09-24 : delete_my_account (élève) et teacher_delete_student (formateur) purgeaient
-- 9 tables mais pas feedback_reports, qui porte user_name + class_code et le texte libre de l'élève.
-- Côté élève, weekly_snapshots n'était purgée que par user_id : les instantanés d'avant la liaison
-- au compte (user_id NULL) survivaient. Logique reproduite À L'IDENTIQUE des définitions précédentes
-- (2026-09-13_p2b6_delete_my_account.sql, 2026-09-13_p2b4_teacher_rpc.sql), purges en plus.
-- Nom EXACT voulu : l'index unique de students porte sur (name, class_code) sans casse, deux lignes
-- « Hugo » et « hugo » sont deux comptes distincts.

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

  DELETE FROM weekly_snapshots   WHERE user_id = v_uid
                                    OR (student_name = p_name AND class_code = p_class_code);
  DELETE FROM push_subscriptions WHERE student_name = p_name AND class_code = p_class_code;
  DELETE FROM player_rewards     WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM player_tokens      WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM pending_chests     WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM chest_log          WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM shop_purchases     WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM marks_log          WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM feedback_reports   WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM students           WHERE name = p_name AND class_code = p_class_code;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.teacher_delete_student(
  p_code text, p_name text, p_class_code text
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_role text; v_owner text; v_found boolean;
BEGIN
  v_role := teacher_role_of(p_code);
  IF v_role IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;

  SELECT true INTO v_found FROM students WHERE name = p_name AND class_code = p_class_code;
  IF NOT COALESCE(v_found, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_student');
  END IF;

  -- Portée : la cohorte de l'élève doit appartenir au formateur (admin = toutes).
  IF v_role <> 'admin' THEN
    SELECT teacher_code INTO v_owner FROM groups WHERE code = p_class_code;
    IF v_owner IS DISTINCT FROM p_code THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
    END IF;
  END IF;

  DELETE FROM weekly_snapshots   WHERE student_name = p_name AND class_code = p_class_code;
  DELETE FROM push_subscriptions WHERE student_name = p_name AND class_code = p_class_code;
  DELETE FROM player_rewards     WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM player_tokens      WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM pending_chests     WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM chest_log          WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM shop_purchases     WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM marks_log          WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM feedback_reports   WHERE user_name = p_name AND class_code = p_class_code;
  DELETE FROM students           WHERE name = p_name AND class_code = p_class_code;

  INSERT INTO teacher_audit_log(actor, role, action, target, details)
    VALUES(left(md5(p_code),8), v_role, 'delete_student', p_class_code,
           jsonb_build_object('name', p_name));

  RETURN jsonb_build_object('ok', true);
END;
$function$;
