-- ════════════════════════════════════════════════════════════════════════
-- Réétiquetage des instantanés hebdomadaires d'avant le 2026-09-24 (données, une seule fois)
-- ════════════════════════════════════════════════════════════════════════
-- Bug corrigé par a35de59 (tests/check_weekly_snapshot.cjs) : chaque instantané partait APRÈS la remise à zéro,
-- donc avec xp_this_week = 0, daily_completions = 0 et l'étiquette de la semaine SUIVANTE. Le reste de la ligne
-- (xp_cumulative, stats, module_scores, mocks, trophées) est juste : c'est l'état de fin de la semaine finie.
--
-- Vraie semaine = la dernière entrée de students.weekly_history strictement antérieure à l'étiquette : elle est
-- poussée dans la même transition, de façon synchrone, avec l'XP de la semaine ({week, xp}). On lui reprend
-- week_id, week_start (même calcul que pushWeeklySnapshot) et xp_this_week. daily_completions reste 0 (perdu).
--
-- Deux instantanés qui tombent sur la même vraie semaine avec le même xp_cumulative = la même fin de semaine
-- envoyée par deux appareils (le second resté sur l'ancienne semaine) : on garde le plus ancien, on supprime la
-- copie. Tout le reste (pas d'historique, doublon qui diverge, étiquette cible déjà prise) est laissé tel quel.
-- Sauvegarde complète avant : weekly_snapshots_backup_2026_09_24 (verrouillée, aucun accès client).

CREATE TABLE IF NOT EXISTS public.weekly_snapshots_backup_2026_09_24 AS SELECT * FROM public.weekly_snapshots;
ALTER TABLE public.weekly_snapshots_backup_2026_09_24 ENABLE ROW LEVEL SECURITY;
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.weekly_snapshots_backup_2026_09_24 FROM anon, authenticated, public;

CREATE TEMP TABLE _relabel ON COMMIT DROP AS
WITH snaps AS (
  SELECT w.id, w.student_name, w.class_code, w.week_id, w.created_at, w.xp_cumulative,
         split_part(w.week_id, '-W', 1)::int * 100 + split_part(w.week_id, '-W', 2)::int AS wk
    FROM weekly_snapshots w
   WHERE w.created_at < '2026-09-24 18:00+00' AND w.xp_this_week = 0 AND w.week_id ~ '^\d{4}-W\d+$'
), hist AS (
  SELECT s.name, s.class_code, h->>'week' AS week, (h->>'xp')::int AS xp,
         split_part(h->>'week', '-W', 1)::int * 100 + split_part(h->>'week', '-W', 2)::int AS wk
    FROM students s, jsonb_array_elements(COALESCE(s.weekly_history, '[]'::jsonb)) h
   WHERE h->>'week' ~ '^\d{4}-W\d+$'
)
SELECT sn.*, t.week AS true_week, t.xp AS true_xp
  FROM snaps sn
  JOIN LATERAL (SELECT h.week, h.xp FROM hist h
                 WHERE h.name = sn.student_name AND h.class_code = sn.class_code AND h.wk < sn.wk
                 ORDER BY h.wk DESC LIMIT 1) t ON true;

-- Rang dans chaque groupe (élève, vraie semaine) ; action décidée ligne par ligne.
ALTER TABLE _relabel ADD COLUMN rk int, ADD COLUMN action text;
UPDATE _relabel r SET rk = x.rk
  FROM (SELECT id, row_number() OVER (PARTITION BY student_name, class_code, true_week ORDER BY created_at) rk
          FROM _relabel) x
 WHERE x.id = r.id;
UPDATE _relabel r SET action = CASE
    WHEN r.rk = 1 THEN 'relabel'
    WHEN r.xp_cumulative = (SELECT f.xp_cumulative FROM _relabel f WHERE f.student_name = r.student_name
                             AND f.class_code = r.class_code AND f.true_week = r.true_week AND f.rk = 1) THEN 'delete_dup'
    ELSE 'skip_divergent' END;
-- Étiquette cible déjà portée par une ligne qu'on ne déplace pas : on ne touche pas. Jusqu'au point fixe : une
-- ligne ainsi bloquée garde son étiquette et peut bloquer à son tour celle qui la visait.
DO $$
DECLARE n integer;
BEGIN
  LOOP
    UPDATE _relabel r SET action = 'skip_target_taken'
     WHERE r.action = 'relabel' AND EXISTS (
       SELECT 1 FROM weekly_snapshots w
        WHERE w.student_name = r.student_name AND w.class_code = r.class_code AND w.week_id = r.true_week
          AND w.id NOT IN (SELECT id FROM _relabel WHERE action IN ('relabel', 'delete_dup')));
    GET DIAGNOSTICS n = ROW_COUNT;
    EXIT WHEN n = 0;
  END LOOP;
END $$;

DELETE FROM weekly_snapshots w USING _relabel r WHERE r.id = w.id AND r.action = 'delete_dup';

-- Deux temps : une permutation d'étiquettes en une seule instruction heurterait l'index unique en cours de route.
UPDATE weekly_snapshots w SET week_id = 'relabel:' || r.true_week
  FROM _relabel r WHERE r.id = w.id AND r.action = 'relabel';
UPDATE weekly_snapshots w SET
    week_id = r.true_week,
    xp_this_week = r.true_xp
  FROM _relabel r WHERE r.id = w.id AND r.action = 'relabel';

-- week_start de TOUTES les lignes, depuis week_id : le lundi local de la semaine (inverse exact de weekId, comme
-- weekStartOf dans src/lib/util.js = premier lundi à partir du 1er janvier + (n − 1) × 7 jours). Le client écrivait
-- le dimanche 8 jours avant (lundi précédent, puis toISOString en UTC) ; le rapport formateur cherche désormais
-- les lundis locaux (localYmd).
UPDATE weekly_snapshots SET week_start = z.d + ((8 - extract(isodow FROM z.d)::int) % 7)
  FROM (SELECT id, make_date(split_part(week_id, '-W', 1)::int, 1, 1) + (split_part(week_id, '-W', 2)::int - 1) * 7 AS d
          FROM weekly_snapshots WHERE week_id ~ '^\d{4}-W\d+$') z
 WHERE z.id = weekly_snapshots.id;

SELECT action, count(*) AS n, sum(true_xp) FILTER (WHERE action = 'relabel') AS xp FROM _relabel GROUP BY action ORDER BY action;
