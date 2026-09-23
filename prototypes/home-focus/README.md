# Home à un seul bouton

Proto du 2026-09-23, hors build Vercel, rien dans `src/`. Recommandation n°3 de l'audit du jour :
alléger l'expérience sans rien retirer au fond.

**Constat :** un jour chargé, la Home empile jusqu'à 10 blocs au-dessus de la barre d'onglets (pastilles
de bonus, bandeau de fête, coffre, rappel du Mock, évènement, carte niveau/ligue, ligne du chemin, Daily
Challenge, Quick Start, astuce), dont cinq qui pulsent ou brillent. Le pulse unique (`pulseSlot`) limite
l'animation, pas la charge. Et deux blocs doublent autre chose : Quick Start (= onglet Train) et, en
partie, le Daily Challenge face à la mission du chemin.

## Ouvrir

Serveur `festival-proto` de `.claude/launch.json` (Vite à la racine du dépôt, port 5606), puis :

- comparateur : `http://localhost:5606/prototypes/home-focus/index.html`
- un téléphone seul : lien « Ouvrir seul » (`frame.html?v=B&sc=busy&p=lea&mode=light`)

Barre : situation, élève (Léa, Karim, Inès du proto `mentor-memory`, simulés, horloge figée au lundi
21/09/2026), mode clair/sombre, les 16 skins, mouvement réduit. Un tap sur un bouton affiche
`nav("…")` au lieu de naviguer.

## Situations

| | Ce qui s'empile |
|---|---|
| Chargée | 2 coffres (Champion), Flash Hour 2 h, Halloween forcé, bonus login + série, mission et Daily à faire |
| Typique | mission et Daily à faire, rien d'autre |
| Tout fait | mission, quêtes du chemin et Daily faits |
| Nouvel élève | pas encore de Mock (rappel), série de 2 |

## Variantes

| | Nom | Idée | Décision du 17/09 (« le plan ne va pas sur Home ») |
|---|---|---|---|
| A | Actuel | Le vrai `Home.jsx`. | — |
| B | Une porte | Un seul grand bouton = la prochaine chose à faire (coffre > Mock > mission > Daily > chemin). Niveau en une ligne fine, « Also today » (2 lignes), évènement et fête en lignes de texte, astuce repliée. Quick Start supprimé. Journée finie → « All done for today ». | **Enfreinte en partie** : la mission du jour devient le bouton principal. |
| C | Élaguée | La Home actuelle moins ce qui double : Quick Start supprimé, pastilles → une ligne dans la carte niveau, un seul bandeau visible (+N), astuce en une ligne. Daily Challenge = seul bloc « à jouer ». | **Respectée** : ligne du chemin inchangée. |
| D | Ordre du jour | Une carte-liste « Today » cochée au fil de la journée ; la première ligne non faite porte le bouton. Niveau sous la carte. Rien d'autre. | **Enfreinte** : le chemin entier est sur Home. |

Ordre de priorité de B et D (`dayAgenda` dans `variants.jsx`) = celui du pulse de la Home actuelle, pour
qu'aucune variante ne change ce que l'appli juge urgent.

## À trancher par Jérémy

1. Laquelle (ou quel mélange : C est un premier pas sans risque, B la cible) ?
2. B et D reviennent sur la décision du 17/09 : la tenir, ou l'assouplir maintenant que le plan est figé
   et que la mission est une seule quête ?
3. Le Daily Challenge reste-t-il un bloc à part, ou une ligne de l'ordre du jour comme les autres ?
4. Quick Start : supprimé partout (doublon de Train) ?

## Câblage prévu (après choix)

`src/features/home/Home.jsx` seul, mêmes props : aucune donnée nouvelle, aucun état dans `App()`.
`dayAgenda` passe dans `lib/` (pur, testé : ordre de priorité, rien d'affiché deux fois, journée finie).
