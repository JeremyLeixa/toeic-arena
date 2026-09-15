-- ════════════════════════════════════════════════════════════════════════
-- P2-D5 — `group_public` : la fiche publique d'une promo par son code, en RPC
-- (2026-09-16), fichier 1/2 : purement additif
-- ════════════════════════════════════════════════════════════════════════
--
-- POURQUOI. `groups` est la dernière table que le client lit EN DIRECT (5 sites :
-- fenêtre d'accès start/end au chargement du profil, saisons de la League, « Join a
-- Group », picker d'homonymes, « ce code existe déjà » du dashboard). Cette lecture
-- reposait sur DEUX mécanismes qui ne tiennent qu'ensemble : le grant SELECT colonne
-- par colonne de B4 (tout sauf teacher_code / teacher_email) ET une policy SELECT
-- `USING true`. Retirer l'un des deux ne « nettoie » rien, ça coupe la lecture : c'est
-- ce que la migration d'hygiène a fait le 2026-09-15 (« Code not found » pour toutes
-- les promos pendant des heures, cf. 2026-09-15_p2d3_restore_groups_read.sql).
--
-- Une exception qu'il faut ré-expliquer à chaque migration est une exception qui
-- finira par re-casser. On la supprime : le client passe par une RPC bornée, et le
-- fichier 2 ferme `groups` comme toutes les autres tables (REVOKE des 7 privilèges +
-- DROP de la policy). « Un supabase.from() dans src/ est un bug » devient vrai pour
-- `groups` aussi, sans exception à retenir.
--
-- CE QUE LA RPC EXPOSE — et rien d'autre (patron « lecture publique bornée », même
-- famille que students_public / class_median_xp) :
--   · UNE ligne, par code EXACT (comme le .eq('code', …) qu'elle remplace : pas de
--     normalisation, pas de recherche partielle, pas de listing) ;
--   · des colonnes FIGÉES : code, name, type, start_date, end_date, seasons,
--     grade_bonus_enabled — l'union stricte de ce que les 5 sites consommaient.
--     Ni teacher_code (le secret du dashboard, cœur du finding H3), ni teacher_email
--     (PII des formateurs), ni weekly_report_optin (préférence formateur, aucun chemin
--     élève ne la lit). Une colonne ajoutée à `groups` plus tard N'EST PAS exposée par
--     défaut — c'est l'inverse du grant colonne de B4, et c'est voulu : la liste
--     ci-dessous EST la surface d'exposition.
--   · NULL si le code n'existe pas : le client garde ses replis d'avant (« Code not
--     found », accès « school / ok », saisons SEASONS pour idrac2026).
--
-- L'existence d'un code de promo reste devinable — c'était déjà le cas, « Join a
-- Group » est un oracle par nature. Un code n'est pas un secret, c'est une clé de
-- routage ; ce qui protège le compte, c'est le mot de passe personnel (P2 Phase A).
--
-- Aucune garde (pas de student_guard) : lecture publique, sans écriture. Le balayage
-- (scripts/check-security.mjs) la sonde comme les autres lectures sans garde
-- (liste READ_ONLY) : un code factice doit répondre 200 null.
--
-- ORDRE DE DÉPLOIEMENT (règle post-crise : code AVANT verrou) :
--   1. ce fichier (SQL Editor, projet huklmklwvwwhhrrcyytq) — additif, sans effet
--      sur le client en prod ;
--   2. déployer le client qui appelle group_public (plus aucun from('groups')) ;
--   3. `npm run check:security` + un login + un « Join a Group » sur la prod ;
--   4. 2026-09-16_p2d5_lock_groups_full.sql — brûle le filet.
-- Tant que 4 n'est pas passé, reverter le commit client suffit.

CREATE OR REPLACE FUNCTION public.group_public(p_code text)
RETURNS jsonb
  LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $function$
  SELECT jsonb_build_object(
           'code',                g.code,
           'name',                g.name,
           'type',                g.type,
           'start_date',          g.start_date,
           'end_date',            g.end_date,
           'seasons',             g.seasons,
           'grade_bonus_enabled', g.grade_bonus_enabled)
    FROM groups g
   WHERE g.code = p_code
   LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.group_public(text) FROM public;
GRANT EXECUTE ON FUNCTION public.group_public(text) TO anon, authenticated;

-- ── Vérification post-migration ────────────────────────────────────────
-- 1) Un code existant renvoie sa fiche, sans colonne sensible :
--    SELECT public.group_public('idrac2026');
--    → {"code":"idrac2026","name":…,"type":"school","start_date":…,"end_date":null,
--       "seasons":[…],"grade_bonus_enabled":…}      (7 clés, jamais teacher_code)
-- 2) Un code inconnu renvoie NULL :
--    SELECT public.group_public('zz-inexistant');   → NULL
-- 3) Depuis le client (clé anon), la RPC répond :
--    POST /rest/v1/rpc/group_public  {"p_code":"idrac2026"}  → 200 + la fiche
--    (c'est ce que `npm run check:security` sonde, avec un code factice → 200 null)
