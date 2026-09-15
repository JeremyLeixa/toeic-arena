-- ════════════════════════════════════════════════════════════════════════
-- Verrou des tables satellites — lot 4 : les 4 tables de coffres, fichier 2/2
-- (2026-09-15)
-- ════════════════════════════════════════════════════════════════════════
-- ⚠️ A N'APPLIQUER QU'APRES, DANS CET ORDRE :
--   1. 2026-09-15_p2d3_chest_rpc.sql applique ;
--   2. le client qui passe par les RPC deploye en production ;
--   3. verifie EN PROD, sur un vrai compte :
--      · ouvrir un coffre en attente -> les recompenses apparaissent, et elles
--        sont TOUJOURS LA apres un rechargement de la page (c'est le test qui
--        compte : il prouve la persistance, pas seulement l'animation) ;
--      · Profil -> Collection : cosmetiques et jetons s'affichent ;
--      · un achat en boutique passe et debite les Darics ;
--      · une conversion de doublons rend bien un jeton ET laisse un exemplaire ;
--      · gagner de quoi declencher un coffre (montee de ligue, palier d'XP) ->
--        le toast apparait UNE fois, et une seule ligne pending_chests est creee.
--
-- Tant que ce fichier n'est pas passe, reverter le commit client suffit.
-- C'est le SEUL filet de ce lot.
--
-- CE QUE CA FERME : l'inventaire nominatif de chaque eleve (cosmetiques,
-- jetons, historique de coffres) n'est plus lisible avec la cle publique, et
-- surtout plus MODIFIABLE — n'importe qui pouvait jusqu'ici vider l'inventaire
-- d'un autre, supprimer ses coffres en attente, ou s'attribuer des recompenses
-- sur le compte de quelqu'un d'autre.
--
-- CE QUE CA NE FERME PAS : le self-grant. Le tirage reste calcule cote client
-- (pickRewards), donc un eleve determine peut encore s'accorder ce qu'il veut
-- sur SON propre compte via open_pending_chest. Meme position qu'en B1 pour le
-- self-mint de Darics. Le rendre autoritatif cote serveur = porter DROP_TABLES
-- en PL/pgSQL, chantier separe.
--
-- CE QUI CONTINUE DE MARCHER :
--  · les 7 RPC du fichier 1, plus grant_token / consume_token / spend_marks
--    (SECURITY DEFINER + garde depuis B1) ;
--  · delete_my_account (B6), qui purge les 4 tables cote serveur.
-- ════════════════════════════════════════════════════════════════════════

-- Liste complete et explicite sur les quatre tables (TRUNCATE inclus : il
-- ignore la RLS, lecon B5 re-confirmee par le balayage du 2026-09-14).
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.player_rewards  FROM anon, authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.pending_chests  FROM anon, authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.chest_log       FROM anon, authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.player_tokens   FROM anon, authenticated;

-- Ceinture : aucune de ces tables n'a de policy, donc RLS active = deny par
-- defaut. Sans effet sur les RPC SECURITY DEFINER (le proprietaire de la table
-- est exempt tant que FORCE n'est pas pose), mais elles ne repartiront plus
-- "ouvertes" si un GRANT revient par megarde.
ALTER TABLE public.player_rewards  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_chests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chest_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_tokens   ENABLE ROW LEVEL SECURITY;


-- ════════════════════════════════════════════════════════════════════════
-- Verification post-migration — C'EST LE DERNIER VERROU DU CHANTIER
-- ════════════════════════════════════════════════════════════════════════
-- 1) Les 4 tables a zero privilege :
--
--    SELECT table_name, grantee, privilege_type
--      FROM information_schema.role_table_grants
--     WHERE table_schema='public'
--       AND table_name IN ('player_rewards','pending_chests','chest_log','player_tokens')
--       AND grantee IN ('anon','authenticated','PUBLIC');
--    -- doit renvoyer 0 ligne
--
-- 2) BALAYAGE FINAL de tout le schema. Apres ce fichier, anon/authenticated ne
--    doivent plus apparaitre que sur DEUX objets : students_public (SELECT) et
--    events (SELECT).
--
--    SELECT table_name, grantee, string_agg(privilege_type, ',' ORDER BY privilege_type)
--      FROM information_schema.role_table_grants
--     WHERE table_schema='public' AND grantee IN ('anon','authenticated','PUBLIC')
--     GROUP BY 1,2 ORDER BY 1,2;
--
-- 3) Sonde anon, console du navigateur sur app.verse-arena.fr :
--    for (const t of ['player_rewards','pending_chests','chest_log','player_tokens'])
--      console.log(t, (await supabase.from(t).select('*').limit(1)).error?.code);
--    -- doit afficher 42501 partout
--
-- 4) Parcours reel inchange : ouvrir un coffre, recharger, les recompenses sont la.
