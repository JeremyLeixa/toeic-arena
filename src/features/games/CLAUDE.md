# Jeux : Mimic Hunt, Word Tavern

> Chargé quand on travaille dans `src/features/games/`.

### Word Tavern 🍺
- Route `sp==="tavern"`. 15 questions per session, 3 types (def→word, word→def, fill-in-blank).
- Distractors picked from SAME vocabulary domain as the correct card.
- **Failed words auto-reset in SRS** (`cardStates[id] = {ease:2.5, interval:0, nextReview:today()}`) → they come back in next flashcard review.
- BGM: `bgm_tavern.mp3`.

### Mimic Hunt 🪤 (2026-09-17)
Route `sp==="mimic"` (Games). Entraîne **la reformulation** : la bonne réponse dit la même chose avec
d'autres mots, le **Mimic** recopie des mots de la source pour dire autre chose. Le Traps Quiz et une
Strategy Card énonçaient déjà la règle ; aucun module ne l'entraînait, alors qu'elle porte les Parts 3,
4 et 7 (123 questions sur 200) — et la Part 7 n'avait aucun jeu. Proto et comparateur des mécaniques :
`prototypes/mimic-hunt/` ; banc du vrai module sans compte : `prototypes/mimic-hunt/real.html`.
- **Une manche = un tap** (variante 3 « révélation », choix de Jérémy le 2026-09-18 ; la variante 2
  « double marque », réponse ET Mimic puis Check, livrée le 2026-09-17, était trop lente) : la réponse
  part au tap, les Mimics se démasquent d'office au retour.
- **Au retour, sobre** (variante C « au tap », choix de Jérémy le 2026-09-19, proto
  `prototypes/mimic-hunt/calm.html` ; l'écran d'avant disait tout trois fois, avec fonds, ondulations,
  bordures pointillées et une icône par Mimic) : **rien n'est souligné** — juste, faux, un mot « Mimic »,
  l'icône seulement sur celui qui a mordu. Un tap sur une option souligne ses liens dans la source ET
  dans cette option seulement (vert plein = même sens, pointillé rouge = mots recopiés, tirets gris = mot
  gardé), un second tap efface. « The paraphrase » garde l'explication et le piège ; les reformulations
  sont repliées (« Show the rewordings »). Soulignés seulement, jamais de fond coloré.
- **Paliers** annoncés avant leurs items (I Synonyms → II Reshaped → III Big picture) : la progression
  est la pédagogie, elle ne se mélange pas. Les items sont mélangés **dans** leur palier (5 tirés par
  palier au plus, `PER_TIER` : 15 par partie quand la banque le permet) et les 4 options permutées à
  chaque partie (sinon on rejoue « la réponse C ») — donc **aucun texte ne cite une lettre** : les pièges
  citent l'option (`check_option_shuffle` scanne `MIMIC_ITEMS` depuis que 11 pièges disaient « A recycles… »).
- **Rédaction des items** (`src/data/mimicHunt.js`, gardée par `tests/check_mimic_items.cjs`) : tout tient
  sur des **fragments** retrouvés en mots entiers, sans casse (`bridge`, `echo`, `mimics`) — un mot réécrit
  et le surlignage disparaît en silence. **84 items** (29 / 30 / 25 par palier : 12 pilotes + 48 relus par Jérémy
  le 2026-09-19 + le lot 4 « parlé », 24 items relus le même jour), bonne réponse 21 fois en A, B, C et D. 2 Mimics par item sauf cinq (un seul), des
  distracteurs neutres qui ressemblent à des reformulations, et **cinq items gardent un mot de la source
  dans la bonne réponse** (mh12, mh18, mh22, mh35, mh59, mh72) : la règle n'est pas « mot repris = faux » mais
  « mot repris qui dit autre chose ».
- **XP** : `15 + 5×bonne réponse`, +25 sans faute (115 pour 15 items, palier des 15 Q ; le `+2×Mimic
  démasqué` de la variante 2 a disparu avec elle), **−3 par morsure** (choix de Jérémy du 2026-09-19,
  `lib/mimicXp.js`) : la morsure coûte, pas l'erreur neutre (mordre = associer des mots sans lire le sens,
  le réflexe visé). Le coût reste dans la partie : base jamais sous les 15 de participation, rien de repris
  sur l'XP acquise (un compteur qui baisse fait lâcher le module). Morsures et retenue **réelle** (plancher
  compris) voyagent par l'`extra` de `miniSession` (5e argument → `settleSession` → session) jusqu'au
  parchemin : « 9 correct · 5 bites −15 » (`sessionText.stepDetail`) — une base réduite sans la mention
  passe pour une erreur de calcul. Gardé par `check_mimic_items` (formule, plancher, libellé, câblage). **Estimateur** : Reading support `.04`, `part:null` dans `MODULE_TOEIC_MAP` (la reformulation sert
  P3/P4/P7 : la ranger dans p7 fausserait le diagnostic du Mentor).
- **Coffre de maîtrise lié à la taille de la banque** : exclu (`MASTERY_BLACKLIST.mimic`) du 2026-09-18 au
  2026-09-19, quand chaque partie rejouait les 12 items (5 parties apprises par cœur donnaient le coffre
  Champion), rendu à 60 items. `check_mimic_items` exige l'exclusion sous 45 items et son absence au-delà.
- **Nouveaux items : toujours relus par Jérémy avant d'entrer au jeu.** Lot en projet dans
  `prototypes/mimic-hunt/drafts/`, contrôlé par `node tests/check_mimic_items.cjs <lot.js>…` (mêmes
  contrôles par item, identifiants distincts de la banque), relu sur `prototypes/mimic-hunt/review.html`
  (tout visible : pont, recopies, mot gardé ; `?tier=2`), puis versé dans `src/data/mimicHunt.js`.
- **Trophées** (2026-09-19, sans coffre, comme Word Tavern et Modal Council ; 30 Darics chacun) : Mimic
  Spotter (1re partie), **Unbitten** (une partie de 15 sans morsure : la compétence du module, erreurs neutres
  permises), Paraphrase Master (15/15), Mimic Slayer (80 % sur 60 Q). Unbitten lit `bites` dans l'entrée
  d'history, posé par `recordModule` (6e argument `more`) depuis l'`extra` de `miniSession` : les parties
  d'avant ne comptent pas. Mimic compte aussi dans « Game Master ».
- **BGM `bgm_mimic`** (piste Mureka du 2026-09-19, prompt archivé dans la mémoire des BGM). Module **SELF_MANAGED** :
  il joue la piste lui-même (effet sur la phase), la route n'y touche pas. Hors de la liste, l'effet central d'App()
  coupait la musique juste après que la route l'avait lancée (silence, puis retour au rendu suivant). Coupée en mode écoute.
- **Mode écoute** (variante A « aperçu », choix de Jérémy du 2026-09-19, proto `prototypes/mimic-hunt/listen.html`) : la
  source d'un item `spoken` s'ENTEND (en Parts 3 et 4, le distracteur classique reprend un mot de l'enregistrement).
  Deux portes sur l'intro (Read / Listen). Question et réponses lisibles avant l'écoute (consigne des Parts 3 et 4) mais
  **verrouillées jusqu'à la fin de l'enregistrement** (répondre au premier mot reconnu, c'est mordre), une réécoute
  (`REPLAYS`), puis la transcription et le retour habituel. **Module `mimic_listen`** (même route : `extra.modId`, lu par
  `miniSession`) : Listening `.04`, ses propres stats et courbe anti-farming, coffre de maîtrise exclu sous 45 sources
  parlées (`check_mimic_items`) et rendu depuis le lot 4 ; au-delà, le test exige aussi la tuile Games en
  `subs:["mimic","mimic_listen"]` (`unit:"modes"`, « 1/2 modes mastered »). Trophées et « Game Master » comptent
  les deux modes ; les erreurs gardent la `ref` `mimic:<id>` (la chasse les repose à l'écrit). « Play again » repart
  dans le même mode (`replayMode`). Clips `public/audio/mimic/<id>.mp3` (`node scripts/gen-mimic-audio.mjs --all`,
  voix `mimicVoice` de `lib/listeningVoices.js` : genre de `voice` / `speaker`) ; `check:assets` et `check_mimic_items`
  exigent chaque clip — un clip absent ne se voit pas, les réponses se déverrouilleraient sans rien faire entendre.
  **45 sources parlées** (15 par palier) depuis le lot 4 « parlé » (mh61-mh84, relu et versé le 2026-09-19).
