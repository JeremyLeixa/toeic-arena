-- ════════════════════════════════════════════════════════════════════════
-- Phase C : le 15/10/2026 à 4 h (Paris), TOUTES les promos en mode strict (remplace la tâche iabd2627 + mpqse2527)
-- ════════════════════════════════════════════════════════════════════════
-- Choix de Jérémy (2026-09-24) : les promos dormantes basculent le même jour que les deux actives. Ligne '*' plutôt
-- qu'une liste : idrac2026, cesi2026, esgi2527, iabd2627, mpqse2527, famille2026, cesi-rqse-27 et toute promo
-- future (dont les inscriptions naissent déjà avec un mot de passe). Les visiteurs restent tolérés : _owner_ok les
-- exempte avant de lire identity_strict_classes.
-- Annuler avant : SELECT cron.unschedule('phase-c-bascule-2026-10-15');
-- Revenir après : DELETE FROM identity_strict_classes WHERE class_code = '*';
--   (ou n'en garder que certaines : DELETE '*' puis INSERT des codes voulus)
SELECT cron.unschedule('phase-c-bascule-2026-10-15')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'phase-c-bascule-2026-10-15');
SELECT cron.schedule('phase-c-bascule-2026-10-15', '0 2 15 10 *', $job$
  INSERT INTO public.identity_strict_classes (class_code) VALUES ('*')
    ON CONFLICT (class_code) DO NOTHING;
  SELECT cron.unschedule('phase-c-bascule-2026-10-15');
$job$);
