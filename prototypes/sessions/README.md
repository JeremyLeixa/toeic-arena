# Sessions — pendant l'exercice

Proto de l'audit visuel du 2026-09-17 (lot 4). Hors build Vercel, rien dans `src/`.

**Constat de départ :**
- la tab bar reste affichée pendant une manche (Boss de 120 min compris) : un tap par erreur quitte la session ;
- la progression est une barre continue qui ne dit pas ce qui s'est passé ;
- `playCombo` et `playStreak` existent dans `sounds.js` mais ne sont jamais joués ;
- après une réponse, seules les couleurs des options changent ; l'explication est en petit gris et Next est plus bas ;
- le bouton play de la Part 2 est un dégradé orange-rouge en dur avec l'emoji ▶️, hors palette du skin.

## Ouvrir

Serveur `festival-proto` de `.claude/launch.json` (Vite à la racine du dépôt, port 5606), puis **par l'URL directe** :

- comparateur : `http://localhost:5606/prototypes/sessions/index.html`
- un écran seul avec le son : lien « Ouvrir seul (son) ↗ » (état « Jouer » : la manche se joue, un tap débloque l'audio)

Barre : écran (Drill ou écoute Part 2), état (jouable, question, bonne réponse, combo ×3, mauvaise réponse avec
l'explication la plus longue du pool ; avant / pendant / après l'écoute), mode, 16 skins, mouvement réduit, taille.

## Variantes

| | Nom | Tab bar | Progression | Combo | Retour de réponse | Play Part 2 |
|---|---|---|---|---|---|---|
| A | Actuel | visible | barre continue | aucun | couleurs + petit texte gris | dégradé orange-rouge, emoji |
| B | Focus | masquée, ✕ + confirmation | une case par question (verte / rouge) | flamme ×N à la place du compteur | panneau fixe en bas : verdict, bonne réponse, explication en grand, Next sous le pouce | disque aux couleurs du skin, égaliseur |
| C | Arène | masquée | pastilles | bannière « Combo ×N » au centre + « N in a row » | carte sous les options (bandeau Correct / Wrong, « Why »), Next fixé en bas | anneau runique qui tourne |
| D | Aldric | masquée | fil d'encre | sceau de cire ×N | note d'Aldric sur parchemin (comme l'écran de fin) | sceau de cire, ondes |
| E | Arène + fil d'encre | masquée | fil d'encre (de D) | bannière « Combo ×N » + « N in a row » (de C) | carte « Why » sous les options, Next fixé (de C) | anneau runique (de C) |

Combo : paliers 3, 5, 7 et 10 bonnes réponses d'affilée ; `playCombo` à 3 et 5, `playStreak` à partir de 7.

## Fichiers

- `frame.jsx` : moteur de manche (vraies questions du Drill, vrais sons), les 4 variantes du Drill et de la Part 2
- `sessions.css` : styles des variantes (B et C en jetons ; D en hex du parchemin de l'écran de fin)
- `frame.html` : un écran ; `index.html` : comparateur

## Au câblage

- `.ss-top` est en `sticky` dans le proto : dans l'appli, `.app` a `overflow-y:auto`, qui rend `sticky` inerte
  (mémoire « position:sticky cassé par .app ») → `fixed` + marge haute du contenu.
- Masquer la tab bar : `pg()` décide selon la route et la phase (intro et écran de fin gardent la navigation ?
  à trancher). Sur bureau (≥ 768 px) la tab bar est une barre latérale : la garder ou non.
- Le composant partagé (haut de session, segments, combo, panneau de retour) sert ensuite au Drill, aux
  mini-modules, au Listening, à Part 6/7, aux jeux et aux examens, module par module.
