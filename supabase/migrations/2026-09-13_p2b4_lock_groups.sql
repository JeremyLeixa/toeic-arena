-- ════════════════════════════════════════════════════════════════════════
-- P2 Phase B (B4) — auth enseignant server-side, fichier 2/2 : verrouillage
-- de `groups` (2026-09-13, finding H3 + M3)
-- ════════════════════════════════════════════════════════════════════════
-- ⚠️ À N'APPLIQUER QU'APRÈS :
--   1. le déploiement du code client qui passe par les RPC (règle post-crise :
--      code AVANT SQL) ;
--   2. l'application de 2026-09-13_p2b4_teacher_rpc.sql ;
--   3. l'INSERT de ton code admin dans teacher_codes ;
--   4. un test du dashboard confirmant qu'il fonctionne via les RPC.
--
-- CE QUE ÇA FERME.
-- (a) LECTURE — `groups.teacher_code` n'est plus lisible par anon/authenticated :
--     fini `select('teacher_code')` qui rendait tous les codes formateur. C'est
--     le cœur de H3. Postgres exige le privilège SELECT sur une colonne pour la
--     FILTRER aussi : `.eq('teacher_code', x)` devient impossible de fait.
-- (b) ÉCRITURE — sans ça, H3 resterait grand ouvert par l'autre bout (M3) :
--     `UPDATE groups SET teacher_code='moi'` puis login avec sa propre valeur.
--     Idem INSERT (se créer une cohorte) et l'upsert `onConflict:'code'` qui
--     permettait d'écraser la cohorte d'un autre formateur.
--
-- CE QUE ÇA NE FERME PAS. `students` reste lisible par anon (RLS OFF) : un
-- attaquant n'a plus le moyen de se faire passer pour un formateur, mais peut
-- toujours lire la table en direct via curl. C'est la Phase C (ENABLE RLS).
--
-- CE QUI CONTINUE DE MARCHER.
--  · Élève anonyme : checkGroupCode (`select('name,type')`), group map
--    (`select('code,name,type')`), League (`select('seasons,type,...')`),
--    fenêtre d'accès (`select('start_date,end_date,name,type')`), check
--    « ce code existe déjà » (`select('code')`) → toutes ces colonnes restent
--    accordées.
--  · Edge Functions (weekly-teacher-report, inactive-reminder) : elles utilisent
--    la clé service_role, qui ignore ces privilèges.
--  · Dashboard : tout passe désormais par les RPC SECURITY DEFINER du fichier 1.
--
-- CE QUI CASSE VOLONTAIREMENT. Tout `select('*')` sur `groups` depuis le client
-- (`*` se déploie sur toutes les colonnes, teacher_code compris → permission
-- denied). Le seul call site concerné, loadGroups(), a été réécrit sur la RPC.
-- ════════════════════════════════════════════════════════════════════════

-- On révoque tout, puis on ré-accorde SELECT colonne par colonne, sur toutes les
-- colonnes SAUF teacher_code et teacher_email. Le DO block lit information_schema
-- plutôt qu'une liste en dur : pas de maintenance à faire si une colonne est
-- ajoutée plus tard (elle sera simplement lisible, ce qui est le défaut voulu
-- pour `groups`).
--
-- teacher_email : ce n'est pas un secret d'authentification, mais c'est la PII
-- des formateurs (adresse pro nominative) et AUCUN chemin élève ne la lit. Le
-- dashboard la reçoit via teacher_groups (la RPC ne retire que teacher_code) et
-- le cron du rapport hebdo passe par service_role. Rien à y gagner à la laisser
-- ouverte à l'anon.
DO $do$
DECLARE v_cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
    INTO v_cols
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name   = 'groups'
     AND column_name NOT IN ('teacher_code', 'teacher_email');

  IF v_cols IS NULL THEN
    RAISE EXCEPTION 'table public.groups introuvable — migration interrompue';
  END IF;

  EXECUTE 'REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES '
       || 'ON public.groups FROM anon, authenticated';
  EXECUTE format('GRANT SELECT (%s) ON public.groups TO anon, authenticated', v_cols);

  RAISE NOTICE 'groups: SELECT accorde sur -> %', v_cols;
END
$do$;

-- ── Vérification post-migration ────────────────────────────────────────
-- 1) Aucune ligne ne doit ressortir (schema public, colonnes sensibles) :
--    SELECT grantee, privilege_type, column_name
--      FROM information_schema.column_privileges
--     WHERE table_name = 'groups'
--       AND column_name IN ('teacher_code','teacher_email')
--       AND grantee IN ('anon','authenticated');
--
-- 2) Sonde anon (console navigateur, non connecté au dashboard) :
--    await supabase.from('groups').select('teacher_code')   -> erreur permission
--    await supabase.from('groups').select('teacher_email')  -> erreur permission
--    await supabase.from('groups').select('code,name,type') -> 200 + données
--    await supabase.from('groups').select('*')              -> erreur (attendu)
--    await supabase.from('groups').update({type:'school'}).eq('code','idrac2026')
--                                                           -> erreur permission
--
-- 3) Une fois tout vert : retirer VITE_ADMIN_TEACHER_CODE des variables Vercel
--    (le rôle admin vit maintenant dans teacher_codes).
