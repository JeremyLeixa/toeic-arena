-- ════════════════════════════════════════════════════════════════════════
-- P2 Phase B (B3) — le client ne lit plus les lignes des autres élèves
-- (2026-09-14, voir .claude/plans/dynamic-swinging-hippo.md)
-- ════════════════════════════════════════════════════════════════════════
-- POURQUOI. 16 SELECT sur `students` partent du client ; plusieurs rapatrient
-- les lignes DES AUTRES, parfois en select('*') :
--   · onboard()/recover() tiraient TOUTE la cohorte, TOUTES colonnes (email,
--     access_level, gdpr_consent, password_set_at…) juste pour comparer des noms
--     sans accents en JavaScript — ça partait dès qu'un visiteur saisissait un
--     class code ;
--   · recoverByEmail() lisait `students` SANS filtre de cohorte, avec un `ilike`
--     non échappé sur l'email ;
--   · la médiane de classe rapatriait N lignes toutes les 5 minutes pour en tirer
--     UN entier ;
--   · League et GamesHub lisaient directement la table pour un classement.
--
-- C'est surtout LE PRÉREQUIS DE LA PHASE C : une policy `auth.uid() = user_id`
-- couperait net toutes ces requêtes. Tant qu'elles existent, la RLS est
-- inactivable. Ce fichier ne verrouille donc RIEN (aucun REVOKE sur `students`,
-- c'est la Phase C qui le fera) : il fournit les chemins de remplacement.
--
-- ⚠️ Le Security Advisor de Supabase va signaler `students_public` en
-- « security definer view ». C'est VOULU : une vue en security_invoker = false
-- (le défaut) s'exécute avec les droits de son propriétaire, donc elle continuera
-- de lire `students` quand la RLS de la Phase C l'interdira au client. C'est
-- précisément ce qui permet de garder un classement qui fonctionne. La contrepartie
-- est que LA LISTE DE COLONNES CI-DESSOUS EST LA SURFACE D'EXPOSITION : tout ce
-- qu'on y ajoute devient lisible par n'importe qui. Ne rien y mettre sans raison.
-- ════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════════
-- 1) norm_name — miroir SQL de normalizeName() (src/App.jsx:683)
-- ════════════════════════════════════════════════════════════════════════
-- JS : s.normalize("NFD") puis suppression des marques combinantes U+0300..U+036F,
--      puis toLowerCase() puis trim().
-- On reproduit EXACTEMENT le même algorithme avec normalize(…, NFD) (Postgres 13+)
-- plutôt qu'avec l'extension unaccent : pas de dépendance à installer, et surtout
-- pas de piège de search_path dans les fonctions SECURITY DEFINER (unaccent vit
-- dans le schéma `extensions` et ne se résoudrait pas avec search_path = public).
--
-- Le client continue de re-filtrer avec normalizeName() sur le résultat : si les
-- deux implémentations divergeaient un jour sur un caractère exotique, SQL ne peut
-- que ramener TROP de lignes, jamais trop peu — donc pas de faux positif possible,
-- et pas de compte devenu irrécupérable.
--
-- Servira aussi à l'index unique (norm_name(name), class_code) de la Phase C.
CREATE OR REPLACE FUNCTION public.norm_name(p text)
RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $function$
  SELECT btrim(lower(regexp_replace(normalize(COALESCE(p,''), NFD), '[' || chr(768) || '-' || chr(879) || ']', '', 'g')));
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 2) students_public — la vue de classement
-- ════════════════════════════════════════════════════════════════════════
-- Union stricte de ce que League (App.jsx ~14443/14454) et GamesHub (~9442)
-- consomment RÉELLEMENT aujourd'hui. Rien de plus.
--
-- Ne contient PAS, et ne doit jamais contenir : id, user_id, email, access_level,
-- access_expires_at, password_set_at, gdpr_consent, joined_at, arena_marks,
-- boosts, cgv_*, target_*, card_states, ni aucune colonne Stripe.
--
-- module_scores et battle_scan SONT là, à contrecœur : l'onglet « Progrès » de
-- League calcule l'estimation TOEIC de chaque camarade côté client à partir de ces
-- deux colonnes. Les retirer aujourd'hui dégraderait la fonctionnalité. La vraie
-- sortie est une colonne `toeic_estimate` précalculée au save, après quoi ces deux
-- colonnes quittent la vue — c'est une dette nommée, pas un oubli.
--
-- Le filtre Teacher passe ici (il était côté client pour League) : la ligne du
-- formateur ne quitte plus le serveur pour les classements.
CREATE OR REPLACE VIEW public.students_public AS
  SELECT
    name, class_code, avatar, frame_id, title_id,
    weekly_xp, week_id, weekly_history,
    module_scores, game_scores, battle_scan
  FROM public.students
  WHERE name <> 'Teacher';

GRANT SELECT ON public.students_public TO anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════
-- 3) class_median_xp — un entier au lieu de N lignes
-- ════════════════════════════════════════════════════════════════════════
-- Remplace `select('xp').eq('class_code',…)` + tri + médiane en JS, rejoué toutes
-- les 5 minutes sur chaque appareil.
-- ⚠️ CHANGEMENT DE COMPORTEMENT ASSUMÉ : le calcul client incluait la ligne
-- Teacher (XP très élevé) et faussait donc la médiane vers le haut. Elle est
-- exclue ici. La valeur va légèrement bouger — c'est une correction, pas une
-- régression ; elle alimente le multiplicateur des événements « underdog ».
-- Conservé à l'identique : moins de 3 élèves → 0 (pas de médiane crédible).
CREATE OR REPLACE FUNCTION public.class_median_xp(p_class_code text)
RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $function$
DECLARE v_n integer; v_med numeric;
BEGIN
  SELECT count(*) INTO v_n
    FROM students WHERE class_code = p_class_code AND name <> 'Teacher';
  IF v_n < 3 THEN RETURN 0; END IF;

  SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY COALESCE(xp, 0))
    INTO v_med
    FROM students WHERE class_code = p_class_code AND name <> 'Teacher';

  RETURN round(COALESCE(v_med, 0))::integer;
END;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 4) find_students_by_name — résolution de nom, colonnes minimales
-- ════════════════════════════════════════════════════════════════════════
-- Remplace deux dumps de cohorte : le fallback de lookupName (App.jsx:3689) et le
-- test d'existence de onboard() (~17802). Ne renvoie QUE les lignes dont le nom
-- normalisé correspond, et seulement les colonnes dont le routage d'identité a
-- besoin (l'écran « choisis/entre ton mot de passe » et le picker d'homonymes).
--
-- `password_set_at` reste exposé — c'est inhérent à l'UX : l'app doit savoir si ce
-- compte a déjà un mot de passe pour choisir l'écran. La différence avec avant est
-- décisive : c'était le password_set_at de TOUTE la promo, c'est maintenant celui
-- du seul nom demandé.
--
-- Retour en jsonb (et pas RETURNS TABLE) pour ne dépendre d'aucun type de colonne :
-- last_active et joined_at sont stockés en text, xp en integer, password_set_at en
-- timestamptz — un RETURNS TABLE mal typé échouerait à l'exécution.
CREATE OR REPLACE FUNCTION public.find_students_by_name(p_name text, p_class_code text)
RETURNS jsonb
  LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $function$
  SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    FROM (
      SELECT name, class_code, xp, last_active, joined_at, password_set_at
        FROM students
       WHERE class_code = p_class_code
         AND norm_name(name) = norm_name(p_name)
       ORDER BY xp DESC NULLS LAST
    ) t;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 5) recover_student_row — LA ligne du match, pas la cohorte
-- ════════════════════════════════════════════════════════════════════════
-- ⚠️ TEMPORAIRE — À SUPPRIMER AVEC recover() LEGACY À LA DATE BUTOIR.
-- Cette fonction renvoie une ligne students COMPLÈTE à partir d'un simple
-- (prénom, class_code), sans aucun secret. C'est exactement le finding C4 du
-- pentest : l'identité sans preuve. Elle n'AJOUTE aucune capacité — le client
-- pouvait déjà obtenir la même chose, et même toute la cohorte avec — mais elle
-- ne doit pas survivre à l'activation de la RLS, sinon elle en devient le trou.
-- Quand recover() legacy disparaîtra (migration soft terminée) :
--   DROP FUNCTION public.recover_student_row(text, text);
--
-- recover() a besoin de la ligne entière : elle alimente supaToLocal() qui hydrate
-- tout le profil. D'où to_jsonb(s) et non une liste de colonnes.
CREATE OR REPLACE FUNCTION public.recover_student_row(p_name text, p_class_code text)
RETURNS jsonb
  LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $function$
  SELECT to_jsonb(s)
    FROM students s
   WHERE s.class_code = p_class_code
     AND norm_name(s.name) = norm_name(p_name)
   ORDER BY s.xp DESC NULLS LAST
   LIMIT 1;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 6) my_student_by_email — l'email vient du JWT, pas du client
-- ════════════════════════════════════════════════════════════════════════
-- Remplace `select('*').ilike('email', e)` : une lecture GLOBALE (aucun filtre de
-- cohorte) avec un `ilike` non échappé — un email contenant `%` aurait ramené
-- toute la table.
-- Ici, AUCUN paramètre : l'email est lu dans le JWT de la session. Le caller ne
-- peut donc viser que SON propre compte. C'est la seule fonction de ce fichier qui
-- soit réellement Phase-C-safe telle quelle.
-- Pré-condition côté client inchangée : signInWithPassword() a déjà réussi.
CREATE OR REPLACE FUNCTION public.my_student_by_email()
RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $function$
DECLARE v_email text; v_row jsonb;
BEGIN
  v_email := lower(btrim(COALESCE(auth.jwt() ->> 'email', '')));
  IF v_email = '' THEN RETURN NULL; END IF;

  SELECT to_jsonb(s) INTO v_row
    FROM students s
   WHERE lower(s.email) = v_email
   ORDER BY s.xp DESC NULLS LAST
   LIMIT 1;

  RETURN v_row;
END;
$function$;


-- ════════════════════════════════════════════════════════════════════════
-- 7) name_exists_in_other_class — garde-fou anti-phantom de save()
-- ════════════════════════════════════════════════════════════════════════
-- Remplace `select('class_code').ilike('name',…).neq('class_code',cc)`, qui était
-- un oracle inter-promos (« existe-t-il un Hugo ailleurs, et dans quelle promo ? »)
-- — la même classe de fuite que celle fermée sur lookupName le 2026-09-11.
-- Ne renvoie plus de lignes : un booléen et la liste des codes, qui ne sert qu'au
-- message de log expliquant le blocage.
--
-- NB : le filtre passe de `ilike` (insensible à la casse) à norm_name (insensible
-- à la casse ET aux accents) → le garde-fou devient légèrement PLUS strict
-- (« José » bloquerait là où « Jose » existe ailleurs). C'est le bon sens de
-- l'erreur : seul onboard() passe allowInsert, donc une inscription légitime
-- d'homonyme dans une nouvelle promo reste possible ; ce sont les save() de
-- synchronisation qui se font bloquer, et c'est précisément eux qui fabriquaient
-- les lignes fantômes.
CREATE OR REPLACE FUNCTION public.name_exists_in_other_class(p_name text, p_class_code text)
RETURNS jsonb
  LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $function$
  SELECT jsonb_build_object(
           'found', count(*) > 0,
           'codes', COALESCE(jsonb_agg(DISTINCT class_code), '[]'::jsonb)
         )
    FROM students
   WHERE norm_name(name) = norm_name(p_name)
     AND class_code IS DISTINCT FROM p_class_code;
$function$;


-- ── Vérification ───────────────────────────────────────────────────────
-- 1) Le miroir de normalizeName (doit renvoyer 'jose', 'hugo', 'jerome') :
--      SELECT public.norm_name('José'), public.norm_name(' HUGO '), public.norm_name('Jérôme');
-- 2) La vue ne doit JAMAIS montrer de colonne sensible ni la ligne Teacher :
--      SELECT * FROM public.students_public WHERE class_code = 'idrac2026' LIMIT 3;
--      SELECT count(*) FROM public.students_public WHERE name = 'Teacher';  -- 0
-- 3) Un entier, pas des lignes :
--      SELECT public.class_median_xp('idrac2026');
-- 4) Résolution de nom scopée :
--      SELECT public.find_students_by_name('Hugo', 'idrac2026');
--      SELECT public.name_exists_in_other_class('Hugo', 'idrac2027');
