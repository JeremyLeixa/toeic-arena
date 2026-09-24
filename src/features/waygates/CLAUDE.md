# The Waygates : les modules thématiques (Nine to Five)

> Chargé quand on travaille dans `src/features/waygates/`. Proto : `prototypes/office-day/` (README : le constat
> chiffré et les variantes comparées). Test : `tests/check_office_day.cjs`.

**Pourquoi** (2026-09-24, exports CSV `tests/data/`) : les formats longs du TOEIC étaient fuis. Sur toute la campagne
IDRAC, P3 = 14 sessions, P4 = 14, P7 = 38, contre 1 491 pour les flashcards. Or P3 + P4 font près de la moitié du
Listening et la P7 la plus grosse part du Reading. Un module thématique **habille les vraies Parts dans une situation**
(« faire bosser sans en donner l'air », Jérémy) : les questions restent celles du TOEIC, texte, options et explications
**tels quels**. Tout le jeu est autour, jamais à leur place.

## Le hub (`Waygates.jsx`, route `waygates`)
- Les portails d'Aldric vers le monde réel : ça fait le pont entre la fantasy de l'appli et un monde moderne assumé
  (choix de Jérémy). Tuile en tête du hub Games (`plain` : ni coffre ni tarif propres).
- **Ajouter un monde** = une entrée dans `WORLDS`, sa route dans `routes.jsx` (lazy), son écran ici. Les identifiants
  ne s'affichent jamais : un nom se change sans rien casser.

## Nine to Five (`NineToFive.jsx`, route et module `office`)
Une journée chez Meridian Harbor Group (entreprise fictive), de 9:00 à 17:00. Variante **V3** du proto (horloge +
réputation), **horloge clémente aux grades bas**.
- **Composition** : `lib/officeDay.js composeDay(rep)`, tirée à chaque partie depuis les banques. Grades, clémence,
  nombre de tâches et formats débloqués (Part 7 double à Associate, triple à Team Lead) : `lib/officeGrades.js`.
  L'habillage des P3 est **générique** (machine à café, appel, réunion) : un sujet tiré du contenu trahirait la Q1.
- **P3/P4** : questions et options lisibles avant et pendant l'écoute, réponses verrouillées jusqu'à la fin (consigne
  réelle du TOEIC : l'anticipation s'entraîne sans être nommée). Une réécoute, qui coûte 15 min de jeu.
- **HUD commun** : `SessionTop` pendant toute la journée (horloge en `aside`, grade en `sub`), et `onSheet` **gèle
  l'horloge** (ref lue dans le tick). Bandeau d'appel seulement **pendant une autre tâche**.
- **Couleurs : jetons du thème uniquement** (question de Jérémy : les skins s'appliquent). `NF_CSS` / `WG_CSS` sans
  aucun hex, la garde le refuse. Le « bureau moderne » passe par la forme (boîte de réception, appel, horloge).

### Les invariants qui cassent sans bruit
- **Les réponses comptent dans lisP3 / lisP4 / p7** (`officeDone`, `App.jsx`, choix de Jérémy : poids plein dans
  l'estimateur et le Mentor), **mais JAMAIS de `trackModSession` sur ces clés**. Sinon une journée taxe les tuiles
  Listening/Reading (`farmMult`) et coche les quêtes du plan (`questDone` lit `dailyModSessions`). XP, anti-farming et
  historique restent sous `office`.
- **`office` hors des tables de poids** de l'estimateur (`MODULE_TOEIC_MAP.office` : ni part ni section) : il compterait
  deux fois.
- **`office` en `MASTERY_BLACKLIST`** : ses réponses font déjà avancer les coffres de maîtrise des Parts.
- **Réputation dans `gameScores.officeDay`** `{rep, days, bestStars}` (jsonb déjà synchronisé, pas de colonne). Elle
  **ne baisse jamais** (une tâche manquée ne rapporte rien) et un gain est borné à `REP_MAX_GAIN`.
- **`App.jsx` et la tuile Games lisent `officeGrades.js`, jamais `officeDay.js`** : ce dernier importe les banques
  P3/P4/P7, qui doivent rester dans le chunk chargé à la demande.
- **Refs d'erreurs = celles des modules d'origine** (`lisP3:<id>:<qi>`, `lisP4:…`, `p7:…`) : la chasse les rejoue
  sans code neuf. `qi` = l'index d'origine de la question (seules les options sont permutées).
- **Pas de BGM** : `office` et `waygates` hors `SELF_MANAGED`, l'effet central coupe la musique (écoute).

## Banc sans compte
`prototypes/sessions/real.html?sc=office` (et `sc=waygates`) ; `rep=300` pose la réputation (grade, formats) ;
`mode=light`, `skin=<id>`. Le banc journalise ce que la fin de journée envoie à `p.done` (`[bench] done`).
