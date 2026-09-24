-- ════════════════════════════════════════════════════════════════════════
-- Phase C : bascule d'iabd2627 et mpqse2527 en mode strict le 15/10/2026 à 4 h (Paris)
-- ════════════════════════════════════════════════════════════════════════
-- Date fixée par Jérémy le 2026-09-24 (annonce orale en cours). Tâche pg_cron à usage unique : 02:00 UTC le 15/10
-- (Paris = UTC+2 jusqu'au 25/10), puis elle se retire elle-même. Idempotente (ON CONFLICT).
-- Annuler avant : SELECT cron.unschedule('phase-c-bascule-2026-10-15');
-- Revenir après : DELETE FROM identity_strict_classes WHERE class_code IN ('iabd2627', 'mpqse2527');
SELECT cron.schedule('phase-c-bascule-2026-10-15', '0 2 15 10 *', $job$
  INSERT INTO public.identity_strict_classes (class_code) VALUES ('iabd2627'), ('mpqse2527')
    ON CONFLICT (class_code) DO NOTHING;
  SELECT cron.unschedule('phase-c-bascule-2026-10-15');
$job$);
