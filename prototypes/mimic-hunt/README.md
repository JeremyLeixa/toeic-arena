# Mimic Hunt — jeu de reformulation (proto)

Proto du 2026-09-17. Hors build Vercel, rien dans `src/`.

**Le constat :** la compétence la plus rentable du TOEIC (la bonne réponse reformule, le distracteur recopie les mots du texte) est **dite** aux élèves (Traps Quiz, Strategy Cards) mais jamais **entraînée**. Les Parts 3, 4 et 7 font 123 questions sur 200 ; la Part 7 n'a aucun jeu.

**Le jeu :** une source courte, 4 options. La bonne réponse dit la même chose avec d'autres mots ; le **Mimic** (le coffre-monstre des RPG) recopie des mots de la source pour dire autre chose. Au retour, les liens entre la source et chaque option s'allument.

## Ouvrir

Serveur Vite à la racine du dépôt (`festival-proto`, port 5606), puis par l'URL directe :

- comparateur des 3 variantes : `/prototypes/mimic-hunt/index.html`
- une partie seule : `/prototypes/mimic-hunt/frame.html?v=1` (`v=1|2|3`, `mode=light`, `skin=<id>`, `start=intro|0-11|end`, `rm=1`)

## Ce qui est comparé : la mécanique de démasquage

| | Variante | Déroulé | Pour | Contre |
|---|---|---|---|---|
| V1 | **Chasse bonus** | Bonne réponse → « tap the Mimic » parmi les 3 autres (passable). Mauvaise réponse → tout se révèle, le Mimic mord si on l'a pris. | L'analyse du piège est active mais facultative : ne ralentit pas les élèves faibles. | Un élève qui se trompe ne chasse jamais. |
| V2 | **Double marque** | Outils Answer / Mimic : on marque les deux, puis Check. | Le plus formateur : justifier son choix contre un distracteur. | Le plus lent ; demande que chaque item ait au moins un Mimic. |
| V3 | **Révélation seule** | Un tap, retour immédiat, Mimics démasqués d'office. | Le plus rapide, proche du rythme d'examen. | L'analyse est montrée, pas demandée : risque de ne pas la lire. |

Commun aux trois : annonce du palier avant ses items, source surlignée au retour (**tap sur une option = ses liens avec le texte** : vert = même sens, autres mots ; rouge ondulé = mots recopiés ; gris = mot gardé faute de synonyme), encart « The paraphrase » (pont + explication + ce que les Mimics ont recopié), vrai écran de fin (`SessionResult`) avec compteurs réponses / Mimics démasqués / morsures.

## Les 12 items (`items.js`)

| # | Palier | Document | Reformulation attendue |
|---|---|---|---|
| 1 | I · Synonyms | Memo | pushed back → postponed |
| 2 | I | Email | reimbursed / employees / meals → refund / staff / food |
| 3 | I | Announcement | shuttle service discontinued → transportation option no longer offered |
| 4 | I | Job posting | experience in a similar role → previous work in a comparable job |
| 5 | II · Reshaped | Email | short-staffed → does not have enough employees (négation) |
| 6 | II | IT notice | cannot be installed until approved → authorized before installation (nominalisation) |
| 7 | II | Email | she signed the contract → an agreement was reached (passif) |
| 8 | II | Conversation | cover your shift on Saturday → fill in for her coworker on the weekend (polysémie de *cover*) |
| 9 | III · Big picture | Conversation | grab a couple of lattes → buy some beverages (hyperonyme) |
| 10 | III | Voicemail | color looks different → report a possible problem (but de l'appel) |
| 11 | III | Notice | sign in + wear a badge → a new security procedure (catégorie) |
| 12 | III | Email | corrected invoice attached → provide an updated invoice (**mot gardé**) |

Choix de rédaction, vérifiés au chargement par `game.jsx` (console : « 12 items relus, 0 problème ») :

- **Bonne réponse 3 fois en A, B, C et D.**
- **2 Mimics par item, sauf les items 4 et 11 (un seul)** : sinon « 2 options qui recopient + 1 neutre » devient un patron qu'on joue sans lire.
- **L'item 12 garde *invoice* dans la bonne réponse**, à la fin, quand le réflexe « mot repris = faux » est installé : la règle n'est pas « jamais de mot repris » mais « un mot repris qui dit autre chose ». Sans ce contre-exemple, on fabrique une heuristique fausse (au vrai TOEIC, une bonne réponse reprend parfois un nom propre ou un terme technique).
- **Des distracteurs neutres qui ressemblent à des reformulations** (item 2 « Book hotels for all business trips », item 11 « new opening hours ») : le vrai TOEIC en a, et ils obligent à lire le sens plutôt qu'à compter les mots communs.
- Chaque Mimic est **faux sur une lecture attentive** (aucun n'est défendable) mais **tentant sur une lecture rapide** : c'est le point à relire en priorité, un Mimic trop grossier tue l'intérêt pédagogique.

## À décider

1. **La variante** (ou un mix : V3 aux paliers I-II, V1 ou V2 au palier III).
2. **Les items** : relecture des 12, puis volume cible (proposition : 60 à 90, 20 à 30 par palier, sessions de 15).
3. **L'XP** : le proto verse `15 + 5 × bonne réponse + 3 × Mimic démasqué`, +25 sans faute (niveau Word Tavern / Gauntlet). À caler.
4. **Lot 2 audio** : la même source lue par les voix de `lib/listeningVoices.js` → transfert direct vers les Parts 3 et 4 (et un poids Listening dans `lib/toeic.js`).

## Au câblage (après choix)

- Skill `add-module` : `src/features/games/MimicHunt.jsx`, route dans `routes.jsx`, tuile dans `GamesHub`, `recordModule("mimic")`, poids Reading faible dans `lib/toeic.js` + `MODULE_TOEIC_MAP`, `EXPORT_MODULES`.
- Données dans `src/data/mimicHunt.js` ; la relecture des fragments de `game.jsx` devient un test (`tests/check_mimic_items.cjs`, prouvé mordant).
- Icône `mimic-chest` (game-icons, déjà dans `mimic-chest.svg`) à ajouter à `GAME_ICON_PATHS`.
- Couleurs : tout est en jetons (`--green`, `--red`, `--cyan`, `color-mix`) ; aucun hex en dur hors `rgba(0,0,0,…)` des ombres, rien pour `check_tones`.
- BGM : placeholder à choisir (`bgm_clue` ?), piste Mureka dédiée ensuite.

## Lot audio « à l'oreille » (2026-09-19) — proto `listen.html`

La source n'est plus lue, elle **s'entend** : en Parts 3 et 4, le distracteur classique reprend un mot de
l'enregistrement, c'est le Mimic version écoute. Après la réponse, la transcription apparaît et le retour
est celui du jeu (variante C, rien de souligné avant un tap). Six vrais clips dans `audio/`
(`node scripts/gen-mimic-audio.mjs --sample`), quatre voix de `lib/listeningVoices.js` choisies par le
genre du locuteur.

- **A · Aperçu (recommandée)** : question et réponses lisibles avant l'écoute, verrouillées jusqu'à la fin
  de l'enregistrement, une réécoute. C'est la consigne des Parts 3 et 4, et le verrou empêche de répondre
  au premier mot reconnu, c'est-à-dire de mordre.
- **B · À l'aveugle** : on écoute d'abord, la question arrive après (patron Audio Blitz). Plus dur.
- **C · Libre** : réponses tapables pendant l'écoute, réécoutes illimitées. Récompense le réflexe visé.
- **Entrée** : deux portes sur l'intro (Lire / Écouter), deux modules pour les stats (`mimic`,
  `mimic_listen`) : la version écoute compte en Listening (poids faible, comme `.04` en Reading).

**Contenu** : seules les sources qui se disent (conversation, messagerie, annonce, météo, flash éco,
visite) passent à l'oreille : 21 dans la banque (6 / 5 / 10 par palier). Le **lot 4** (24 items, mh61-mh84), relu par Jérémy, est versé le 2026-09-19 : 45 sources parlées
(15 par palier), seuil du coffre de maîtrise ; il sert aussi en lecture (banque de 84). `voice: "m"|"f"`
quand une messagerie se présente.

**Câblé le 2026-09-19** (variante A, voir CLAUDE.md « Mimic Hunt ») : `spoken`, clips
`public/audio/mimic/<id>.mp3` (`scripts/gen-mimic-audio.mjs --all`), module `mimic_listen` (Listening .04), tuile Games
en `subs` (unit `modes`).