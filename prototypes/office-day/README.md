# Office Day — la journée au bureau (proto)

Proto du 2026-09-24. Hors build Vercel, rien dans `src/`. Premier des **modules thématiques**.

**Le constat** (exports CSV `tests/data/`, campagne IDRAC entière, 66 élèves) : les formats longs du TOEIC
sont fuis. Listening Part 3 : 14 sessions, Part 4 : 14, Part 7 : 38, contre 1 491 de flashcards et 511 de
Part 5 Drill. Or P3 + P4 font près de la moitié du Listening, et P7 la plus grosse part du Reading. Les
petits QCM (Connectors, Prepositions, Gerund/Infinitive…) sont essayés par ~60 élèves et gardés par moins
de 11 : le « quiz déguisé en jeu » ne retient pas.

**Le jeu :** une partie = une journée de travail chez Meridian Harbor Group (fictif). Les tâches tombent :
e-mails et notes (P7), conversation à la machine à café et appel sur haut-parleur (P3), message vocal (P4).
Le mot « Part » n'apparaît jamais.

**Principe non négociable :** les questions restent celles du TOEIC, texte, options et explications
tels quels. Tout le jeu est autour, jamais à leur place : le transfert vers l'examen est garanti et les
96 conversations, 102 talks et 75 passages servent sans réécriture.

Choix de Jérémy (2026-09-24) : bureau moderne assumé (rupture volontaire avec la fantasy de l'appli),
mécaniques A et B à comparer, journée d'environ 8 min pour 4-5 tâches.

## Ouvrir

Serveur Vite à la racine du dépôt (`festival-proto`, port 5606), puis :

- comparateur des 3 variantes : `/prototypes/office-day/index.html`
- une journée seule : `/prototypes/office-day/frame.html?v=1` (`v=1|2|3`, `speed=<min de jeu par s>`,
  `start=intro|desk|end`)

## Ce qui est comparé

| | Variante | Déroulé | Pour | Contre |
|---|---|---|---|---|
| V1 | **Rush** | Horloge 9:00 → 17:00 (1 min de jeu = 1 s). Courrier avec échéances, appels à heure fixe qui sonnent 20-30 min puis sont manqués, bandeau d'appel qui interrompt la lecture. Bilan en étoiles. | Entraîne la gestion du temps, 1re cause de P7 non finie. Vraie tension, vrais choix (lâcher le mail pour décrocher ?). | Peut stresser et décourager les élèves faibles. |
| V2 | **Carrière** | Pas d'horloge : chaque tâche traitée fait arriver la suivante. Réputation (4 par bonne réponse, 6 par tâche rendue), grades Intern → Director, déblocages. | Rythme de chacun, progression sur des semaines, raison de revenir. | Sans horloge, la journée ressemble vite à une suite de quiz. |
| V3 | **Rush + carrière** | L'horloge de V1 et la réputation de V2 : une tâche en retard perd son bonus. | Tension de la journée + raison de revenir. | La plus riche à équilibrer. |

Commun aux trois : brief du matin de la manager (il annonce ce qui va arriver : c'est de
l'anticipation, sans le dire), **questions P3/P4 lisibles avant et pendant l'écoute, réponses
verrouillées jusqu'à la fin** (consigne réelle du TOEIC), une réécoute (« Sorry, could you repeat
that? », 15 min de jeu avec horloge), transcription après réponse, retour par question avec
l'explication du contenu. La réputation ne baisse jamais (leçon de Mimic Hunt).

## La journée du proto (`day.js`)

| Tâche | Contenu | Habillage | Arrivée (horloge) |
|---|---|---|---|
| t1 | p7p1 (e-mail RH, 4 Q) | « Key dates before lunch » | 9:00, dû 12:00 |
| t2 | p7p4 (note, 3 Q) | « Check the RSVP details » | 9:00, dû 17:00 |
| t3 | p3_01 (3 Q) | machine à café, équipe événementiel | 10:00, 30 min |
| t4 | p4_01 (vocal, 3 Q) | Karen, Summit Consulting | 12:30, dû 15:00 |
| t5 | p3_04 (3 Q) | client sur haut-parleur au support | 14:00, 20 min |

## Ce qui reste ouvert (au câblage, après choix)

- Tirage des journées : composer une journée à partir des banques (types de documents, arrivées), plus
  de journée figée.
- XP et coffres par l'écran de fin commun (`SessionResult`), bilan de la journée en carte du module ;
  poids dans l'estimateur (P3, P4, P7 : part réelle, pas « support »), refs du bestiaire (`lisP3:`, …).
- Mode clair (jetons déjà isolés dans `office.css`), permutation des options, BGM (SELF_MANAGED).
- Grades supérieurs = contenus plus durs : multi-documents (P7 doubles et triples), conversations à
  3 voix. Il faudra en écrire.
- « L'affaire du jour » (mécanique C, indices répartis sur plusieurs documents) comme journée spéciale.
