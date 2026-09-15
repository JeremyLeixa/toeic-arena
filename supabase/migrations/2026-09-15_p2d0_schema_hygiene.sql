-- ════════════════════════════════════════════════════════════════════════
-- Verrou des tables satellites — lot 1 : hygiene du schema public
-- (2026-09-15, voir .claude/plans/effervescent-gliding-neumann.md)
-- ════════════════════════════════════════════════════════════════════════
-- CE FICHIER EST AUTONOME. Il ne touche AUCUN chemin utilise par le client :
-- toutes les policies supprimees sont inertes (leurs tables n'ont plus de
-- privileges, ou la RLS y est desactivee), les 3 fonctions supprimees n'ont
-- aucun appelant, et les 5 tables revoquees ne sont lues par personne
-- (grep from('<table>') sur src/ = 0 pour les cinq).
-- Il n'y a donc pas de cycle "RPC -> code -> verif -> REVOKE" ici : rien a
-- deployer avant, rien a verifier apres hormis le balayage de controle.
--
-- CE QU'IL FERME, par section :
--
-- F2 — les policies legacy "USING true". Elles ne protegent rien et ne genent
--      rien AUJOURD'HUI, parce que privileges et policies sont ANDes et que les
--      privileges sont deja revoques. Mais les policies PERMISSIVE sont ORees
--      entre elles : le jour de la vraie Phase C, poser `auth.uid() = user_id`
--      a cote de `Users can read own and classmates data — SELECT USING true`
--      ne protegerait absolument rien. C'est un piege arme pour plus tard, on
--      le desamorce pendant qu'il est encore gratuit.
--
-- F5 — 3 fonctions mortes, SECURITY INVOKER, sans search_path, EXECUTE ouvert
--      a anon. get_pity_count n'a aucun appelant dans le depot ;
--      is_chest_trigger_available / is_unique_trigger_available n'etaient
--      appelees que par src/chests.js, supprime au commit 5fd29ae.
--
-- F4 — 5 tables sans aucun acces client qui portaient encore
--      DELETE/INSERT/SELECT/UPDATE/TRUNCATE pour anon ET authenticated. Elles
--      sont contenues aujourd'hui par la RLS, mais un DISABLE RLS accidentel ou
--      une policy permissive de plus les rouvre en grand — dont la sauvegarde
--      d'avril, qui est une copie de `students`, e-mails compris.
--
-- F3 — TRUNCATE. Le correctif B5 (commit 50871d9) ajoutait TRUNCATE a la liste
--      de revocation d'`events` ; le balayage du 2026-09-14 montre qu'il n'a
--      jamais ete re-execute en base. Or **TRUNCATE ignore la RLS** : c'est le
--      seul privilege destructeur qu'aucune policy ne rattrape. On le retire
--      partout, en gardant le SELECT dont le client eleve a besoin.
-- ════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════════
-- 0) Garde-fou : ne rien supprimer si une table FORCE la RLS
-- ════════════════════════════════════════════════════════════════════════
-- Le proprietaire d'une table (postgres) est exempt de RLS — c'est ce qui
-- permet aux RPC SECURITY DEFINER de lire `students`, `groups` et `events`
-- malgre leurs policies. Cette exemption saute si quelqu'un a pose
-- ALTER TABLE ... FORCE ROW LEVEL SECURITY : dans ce cas, supprimer les
-- policies casserait les RPC. On verifie avant de toucher quoi que ce soit.
DO $$
DECLARE v_forced text;
BEGIN
  SELECT string_agg(c.relname, ', ') INTO v_forced
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relforcerowsecurity
     AND c.relname IN ('students', 'groups', 'events', 'weekly_snapshots');
  IF v_forced IS NOT NULL THEN
    RAISE EXCEPTION
      'FORCE ROW LEVEL SECURITY actif sur : %. Supprimer les policies casserait les RPC SECURITY DEFINER. Migration interrompue.',
      v_forced;
  END IF;
END
$$;


-- ════════════════════════════════════════════════════════════════════════
-- 1) Policies legacy "USING true" (F2)
-- ════════════════════════════════════════════════════════════════════════
-- students — les 5 sont des USING true / CHECK true. La table n'a plus aucun
-- privilege pour anon/authenticated depuis le verrou Phase C-lite : elles sont
-- inertes. On les retire pour que la future policy de la Phase C soit seule.
DROP POLICY IF EXISTS "Allow recovery update by name"            ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students"  ON public.students;
DROP POLICY IF EXISTS "Users can delete their own data"          ON public.students;
DROP POLICY IF EXISTS "Users can insert their own data"          ON public.students;
DROP POLICY IF EXISTS "Users can read own and classmates data"   ON public.students;

-- groups — meme constat depuis B4 (privilege restant : TRIGGER seul, inerte).
-- "Allow update groups" USING true / CHECK true etait la policy qui, combinee
-- au privilege UPDATE, permettait `UPDATE groups SET teacher_code='moi'` (M3).
DROP POLICY IF EXISTS "Allow insert groups"               ON public.groups;
DROP POLICY IF EXISTS "Allow select groups"               ON public.groups;
DROP POLICY IF EXISTS "Allow update groups"               ON public.groups;
DROP POLICY IF EXISTS "Groups are readable by everyone"   ON public.groups;

-- events — on supprime "Events manage" (ALL / public / auth.role()='authenticated',
-- c'est-a-dire tout compte eleve connecte) et on GARDE "Events visible"
-- (SELECT USING true) : la RLS est active sur events et le client eleve lit les
-- evenements en cours (App.jsx:17392). Les ecritures passent par les RPC
-- teacher_create_event / teacher_stop_event depuis B5.
DROP POLICY IF EXISTS "Events manage" ON public.events;

-- weekly_snapshots — RLS desactivee, donc ces 3 policies ne s'appliquent pas
-- aujourd'hui. Les supprimer maintenant evite le piege du lot 3 : un simple
-- ENABLE aurait laisse `allow_authenticated` (ALL / USING true / CHECK true)
-- ouvrir la table en grand a tout compte connecte, en ORant avec la policy
-- de propriete. La table sera verrouillee par privileges au lot 3.
DROP POLICY IF EXISTS allow_authenticated      ON public.weekly_snapshots;
DROP POLICY IF EXISTS read_class_snapshots     ON public.weekly_snapshots;
DROP POLICY IF EXISTS students_own_snapshots   ON public.weekly_snapshots;


-- ════════════════════════════════════════════════════════════════════════
-- 2) Fonctions mortes (F5)
-- ════════════════════════════════════════════════════════════════════════
-- SECURITY INVOKER, sans SET search_path, EXECUTE accorde a anon. Zero appelant
-- dans le depot apres 5fd29ae. Elles lisent les tables de coffres en tant
-- qu'appelant : le lot 4 les casserait de toute facon.
DROP FUNCTION IF EXISTS public.get_pity_count(p_user_name text, p_class_code text);
DROP FUNCTION IF EXISTS public.is_chest_trigger_available(p_user_name text, p_class_code text, p_trigger text);
DROP FUNCTION IF EXISTS public.is_unique_trigger_available(p_user_name text, p_class_code text, p_trigger text);


-- ════════════════════════════════════════════════════════════════════════
-- 3) Tables sans aucun acces client (F4)
-- ════════════════════════════════════════════════════════════════════════
-- Liste de privileges COMPLETE : la lecon B5 est qu'un REVOKE partiel laisse
-- TRUNCATE derriere lui, et que TRUNCATE ignore la RLS.
-- Ces 5 tables sont ecrites exclusivement par les endpoints api/*.js et les
-- Edge Functions, tous en service_role, qui ignore ces privileges.
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.passes                        FROM anon, authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.password_reset_tokens         FROM anon, authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.subscriptions                 FROM anon, authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.stripe_events                 FROM anon, authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.students_xp_backup_2026_04_27 FROM anon, authenticated;

-- NOTE RGPD, hors perimetre de cette migration : students_xp_backup_2026_04_27
-- est une copie de `students` datant du 2026-04-27, e-mails compris, qui n'a
-- plus d'usage connu. A supprimer (DROP TABLE) une fois que Jeremy a confirme
-- qu'aucune reprise de donnees n'en depend.


-- ════════════════════════════════════════════════════════════════════════
-- 4) events — rattrapage du REVOKE partiel de B5 (F3)
-- ════════════════════════════════════════════════════════════════════════
-- Etat constate au balayage : anon et authenticated portaient encore
-- REFERENCES, SELECT, TRIGGER, TRUNCATE. On remet tout a plat puis on rend le
-- seul privilege necessaire. REVOKE d'abord, GRANT ensuite — jamais un GRANT
-- seul (lecon students_public).
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.events FROM anon, authenticated;
GRANT SELECT ON public.events TO anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════
-- Verification post-migration
-- ════════════════════════════════════════════════════════════════════════
-- 1) Privileges restants pour anon/authenticated. Doit lister UNIQUEMENT :
--    events (SELECT), students_public (SELECT), et les 6 satellites encore a
--    traiter (chest_log, pending_chests, player_rewards, player_tokens,
--    push_subscriptions, weekly_snapshots). Rien d'autre.
--
--    SELECT table_name, grantee, string_agg(privilege_type, ',' ORDER BY privilege_type)
--      FROM information_schema.role_table_grants
--     WHERE table_schema = 'public' AND grantee IN ('anon','authenticated','PUBLIC')
--     GROUP BY 1,2 ORDER BY 1,2;
--
-- 2) Policies restantes. Doit renvoyer exactement 1 ligne : events / Events visible.
--
--    SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname='public';
--
-- 3) Les 3 fonctions doivent avoir disparu :
--
--    SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--     WHERE n.nspname='public'
--       AND proname IN ('get_pity_count','is_chest_trigger_available','is_unique_trigger_available');
--
-- 4) Parcours reel, cote client (rien ne doit bouger) :
--    · un evenement actif s'affiche toujours sur Home ;
--    · le dashboard formateur ouvre, cree et arrete un evenement ;
--    · un eleve gagne de l'XP et recharge sa page.
