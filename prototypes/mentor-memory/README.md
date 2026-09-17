# Mémoire du Mentor : l'appli qui se souvient de chaque élève

Proto du 2026-09-17, hors build Vercel, rien dans `src/`.

**Objectif (Jérémy) :** que chaque élève sente que l'appli tient compte de son parcours, de ses erreurs,
de ses réussites et de ses faiblesses. Aujourd'hui, la personnalisation existe mais reste muette
(pondération silencieuse du Drill, +25 % du Focus sans explication), les erreurs sont jetées à la fin de
chaque session, et quatre recommandeurs se contredisent (Daily Mission, Today's Focus, NextStepReco,
Insight Token).

**Principe :** si l'élève ne le voit pas, ça n'existe pas. Aldric **dit** chaque adaptation au moment où
elle se produit, **preuve à l'appui**, et **ne parle que si c'est vrai et notable**.

## Ouvrir

Serveur `mentor-memory-proto` de `.claude/launch.json` (Vite à la racine du dépôt, port 5608), puis :

- storyboard : `http://localhost:5608/prototypes/mentor-memory/index.html`
- un moment seul en 375 px : lien « Ouvrir seul » (les écrans sont interactifs : « Why this order? »,
  « Begin », répondre, « Next »)

Limite connue : l'en-tête du parchemin de l'écran de fin affiche la vraie date du jour (`SessionResult`
lit `new Date()`), pas le lundi simulé.

Barre : élève (Léa, Karim, Inès), mode clair/sombre, skin, état de la question (comme simulée, réussie,
ratée, pas encore répondue), écrans par ligne, **preuves** (sous chaque écran, en français : les chiffres
et la règle qui autorisent la phrase d'Aldric), mouvement réduit.

## Une journée : lundi 21 septembre 2026

| | Moment | Ce que l'élève voit |
|---|---|---|
| 1 | **Lettre du lundi** (08:30) | Push puis lettre : semaine écoulée, ce qui a bougé (≥ +10 points sur ≥ 10 Q par semaine, sinon rien), créatures vaincues, allure vers l'objectif, cap de la semaine. Élève neuve : « trop tôt pour parler de tendance ». |
| 2 | **Plan du jour** (Home) | Remplace Daily Mission + Today's Focus. Trois quêtes, chacune avec sa raison et son étiquette. « Why this order? » explique l'ordre. Ligne d'accueil qui se souvient (« Yesterday you slew 1 old mistake », « Day 4 in the Arena »). |
| 3 | **Avant la session** | Parchemin : comment Aldric a composé la session (« Relative Pronouns are your weak spot now: 6 of your last 13. I've put 4 in this drill. Conditionals get only 2 today: 13 of your last 15. You've earned it. »). |
| 4 | **Pendant** | La question porte sa mémoire (« Missed on 13 Sept · 3 times ») ; la réponse a une conséquence dite (« Revenge. It comes back in 3 days, weaker. », « Noted. This one comes back tomorrow. », « Conditionals: 14 of your last 16. It holds. »). |
| 5 | **Écran de fin** | Le vrai `SessionResult` (vraies portes XP) + carte « Aldric remembers » : créatures vaincues ou échappées, nouvelles erreurs, chemin parcouru sur une catégorie (seulement s'il est prouvé), compte rendu de la visée annoncée, record. |
| 6 | **Faiblesse devenue force** | Cérémonie plein écran quand une faiblesse mesurée devient une force mesurée. Seuils stricts ; sinon rien (la note du proto dit pourquoi). |
| 7 | **Bestiaire** | Chaque erreur est une créature. Compteurs, bouton de chasse, créatures par catégorie ou par partie, force (Trickster / Stalker / Wyrm), réussites espacées en pastilles. |
| 8 | **Chronique** (Mentor) | L'histoire du parcours dans la feuille du Mentor, sur la vraie carte : arrivée, faiblesses repérées, parties passées à 80 %, Mock, première estimation, créatures vaincues, retournements, page suivante. |

## Les trois élèves (simulés, pas écrits)

`personas.js` simule chaque élève **jour par jour** depuis son arrivée : sessions du journal, erreurs tirées
dans les **vraies banques** (`QUESTIONS`, P2, P3, P4, P7), chasses selon l'assiduité, réussite selon la
précision récente, générateur déterministe. Tout ce qui s'affiche est ensuite **calculé** par `model.js` et
`voice.js`.

| | Histoire | Ce qu'il montre |
|---|---|---|
| **Léa** | Vise 785 le 6 nov. Forte à l'écoute, la Part 7 lui coûte le plus de points, conditionnels fragiles, chasse la plupart des jours sans venir à bout de ses échéances (21 ce lundi). | Plan guidé par l'objectif (« about 32 points on the table »), chasse, lettre avec allure (« +30, you need 11 a week, on track »). Pas de cérémonie : aucune catégorie n'a deux fenêtres mesurables. |
| **Karim** | Pas d'objectif. Conditionnels de 20 % à 87 % en trois semaines ; les pronoms relatifs deviennent son point faible. Chasse chaque jour. | Lettre qui **annonce** le retournement sans le célébrer, Drill qui allège la catégorie « méritée » et vise la nouvelle faiblesse, **cérémonie** en fin de session, invitation à fixer un objectif. Il choisit la 2e quête du plan : le plan propose, l'élève dispose. |
| **Inès** | Arrivée vendredi (4e jour), deux sessions et deux chasses. | Démarrage à froid honnête : plan tiré du Battle Scan (« check your verbs, your scan says 40% »), « Too early to judge », bestiaire avec son mode d'emploi, lettre qui promet la vraie lettre pour lundi prochain. |

## Les règles (chacune est une décision à valider)

| Règle | Valeur | Où |
|---|---|---|
| Maîtrise récente | demi-vie **14 jours** + prior **6 Q à 60 %** (même idée que la retenue bayésienne de l'estimateur) | `mastery` |
| Parler d'une partie ou d'une catégorie | ≥ **8** questions effectives | `MIN_EVID` |
| Enjeu d'une partie | questions au vrai TOEIC × (cible − maîtrise) × **4,9 pts/Q** ; cible = (objectif / 2 − 5) / 490, **85 %** sans objectif | `stakes` |
| Ordre du plan | chasse si ≥ **4** échéances (sinon glissées dans la session), puis plus gros enjeu (catégorie la plus faible pour la Part 5), puis entretien d'une partie ≥ 75 % laissée **7 jours** | `planToday` |
| Démarrage à froid | < **5** sessions d'entraînement : vérifier le point le plus faible du scan, puis mesurer la partie jamais jouée la plus lourde | `planToday` |
| Bestiaire | ratée → **J+1** ; réussie → **J+3**, puis **J+7** ; 3e réussite espacée = vaincue ; chasse plafonnée à **10** | `BOX_DAYS` |
| Retournement (cérémonie) | **< 55 %** sur les 10 premières Q, **≥ 75 %** sur les 12 dernières, **≥ 10 jours** entre les deux fenêtres, une fois par catégorie | `TURN`, `turnaround` |
| Tendance dans la lettre | ≥ **+10 points** avec ≥ **10 Q** sur chacune des deux semaines | `weekFacts` |
| Chemin parcouru (écran de fin) | retournement mesurable avec ≥ **+20 points** | `remember` |

## Ce que la simulation a appris (corrigé dans le modèle)

1. **Une réussite en chasse ne prouve pas la maîtrise d'une catégorie.** L'élève a déjà vu la question et
   son explication. Les compter gonflait les retournements : les pronoms relatifs de Karim passaient pour
   « devenus une force » sur des questions revues. La maîtrise de catégorie ne lit que les questions neuves.
2. **L'assiduité ne doit pas renforcer les créatures.** Avec « force = nombre d'échecs », chasser tous les
   jours rendait les créatures plus fortes que ne pas chasser (15 Wyrms pour Karim). La force compte
   désormais 1 + les fois où la créature a fait retomber une réussite ; `fails` garde le total.
3. **Une question ratée 3 fois ne doit plus revenir chaque jour telle quelle** (une question ratée 11 fois
   dans la première simulation). Repos de 2 jours, et la chasse ouvre la fiche de grammaire avant
   (`GrammarSheet` existe déjà).
4. **Le bestiaire peut faire avalanche** : Léa, assidue à moitié, a 21 échéances un lundi. D'où le plafond
   de 10 par chasse et la phrase « the rest can wait a day ». À surveiller en vrai.
5. **La Part 7 domine le bestiaire** (une créature par question de passage, 17 chez Léa). Une chasse P7
   demande de relire le passage : regrouper par passage au câblage.

## Données proposées (au câblage)

- `moduleScores[id].history[i].cs` : les catStats **de la session** (aujourd'hui seulement cumulés). Sans
  migration (jsonb), borné par les 100 entrées existantes. Indispensable pour « 6 of your last 13 » et les
  retournements.
- `review` (nouvelle colonne jsonb, via le skill `add-supabase-field` + la liste blanche de
  `save_student`) : `{items:[{k, first, last, miss, fails, box, due}], slain, log}`. Des **références**
  (`drill:g326`, `lisP3:p3_05:1`), jamais le texte : environ 70 octets par créature, ~120 créatures au
  plus. Aucune écriture en plus : tout part dans la sauvegarde existante.
- `celebrated` (catégories déjà célébrées) et une courte liste de jalons datés pour la Chronique :
  `history` est bornée à 100 sessions.
- `mistakesRef` : ajouter la référence de la question (`k`) aux entrées déjà collectées par les modules.
- RGPD : le bestiaire est une donnée personnelle, à inclure dans l'export et à mentionner dans la politique
  de confidentialité.

## Fichiers

- `model.js` : séries, maîtrise récente, enjeux, retournements, bestiaire, plan du jour, composition des
  sessions, faits de la semaine, allure, Chronique. **Pur** (requérable en Node).
- `voice.js` : les phrases d'Aldric (anglais) et leurs preuves (français). **Pur**. Variantes stables par
  élève et par jour.
- `personas.js` : les trois élèves simulés.
- `moments.jsx` : les 8 écrans ; `memory.css` : leurs styles (jetons ; parchemins et cérémonie en palette
  fixe) ; `frame.html/jsx` : un moment piloté par l'URL ; `index.html` : le storyboard.

## Au câblage (après choix)

Dans l'ordre, un commit par changement logique :

1. `lib/learnerModel.js` + `lib/planner.js` + `lib/mentorVoice.js` (depuis `model.js` et `voice.js`), avec
   des tests Node prouvés mordants (les trois élèves deviennent des fixtures).
2. `cs` par session dans `recordModule` ; les modules passent déjà leurs catStats (Drill) ou les passeront.
3. Le plan remplace Daily Mission + Today's Focus sur Home ; `NextStepReco` et l'Insight Token lisent le
   même plan. Le boost +25 % du Focus suit la première quête « enjeu ».
4. Bestiaire : champ `review`, `k` dans `mistakesRef`, route de chasse (skill `add-module`), écran.
5. Briefing, mémoire dans la question, carte « Aldric remembers » (sous le parchemin, avant « Lessons to
   keep »), cérémonie.
6. Lettre du lundi : Edge Function `weekly-results` (push) + écran de lettre ; Chronique dans le Mentor.

## Questions ouvertes pour Jérémy

- Le plan **remplace** la Daily Mission (et ses +15 XP, et le coffre `mission_streak`), ou la Mission
  devient « la première quête » ?
- Quelle XP pour la chasse (le proto : 10 + 5 par réussite) sans en faire une ferme (rater exprès pour
  recréer des créatures) ?
- La cérémonie rapporte-t-elle quelque chose (Darics, coffre) ou reste-t-elle symbolique ?
- Le bestiaire vit-il dans le Mentor (nouveau repère sur la carte) ou dans Train ?
- Chronique : la feuille du Mentor (touche Aldric sur la carte), ou un écran à part ?
