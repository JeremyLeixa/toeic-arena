# Cérémonies en fin de session : un budget d'interruptions

Proto du 2026-09-24, hors build, rien dans `src/`. Suite de l'audit « alléger sans surcharger ».

**Ouvrir** : `prototypes/ceremony-budget/index.html` directement dans le navigateur (aucun serveur).
Sélecteur de situation en haut ; pour chaque variante, les écrans du retour 1 (fin de manche + ce qui suit)
puis ceux des entrées suivantes sur Home, avec les compteurs.

## Constat (relevé dans le code le 2026-09-24)

- Écran de fin (`SessionResult`) : seuls la **promotion de ligue** (Ascension) et le **retournement**
  (`TurnCeremony`) sont en plein écran, avec un tap « Onward » chacun. Niveau, trophées, Darics, coffres : en ligne.
- Après Continue : les moments d'Aldric mis en file pendant la session (`rising_rank`, `oath_of_fire`,
  `dawn_rank`…) s'enchaînent en plein écran (`pg()` les retient pendant l'écran de fin, l'onglet non), puis la
  **lettre du lundi** sur Home.
- Pire cas réaliste : **6 plein écran, 7 taps** ; cas lourd courant : 3 plein écran.
- Bug relevé : retournement + trophée dans la même manche = `playJingleAchieve` deux fois au même instant.

## Variantes

| | Règle | Pire cas |
|---|---|---|
| A · Actuel | tout s'enchaîne | 6 plein écran, 7 taps |
| B · Une par retour | au plus 1 plein écran par retour ; priorité retournement > promotion > Aldric > lettre ; la promotion non retenue devient une carte du parchemin ; Aldric et la lettre passent aux entrées suivantes, un par entrée | 1 plein écran, 2 taps |
| C · Parchemin seul | aucune cérémonie plein écran en fin de session (cartes animées dans le parchemin) ; Aldric et la lettre seulement à une entrée « à froid » sur Home, un par entrée | 0 plein écran, 1 tap |

Rien n'est perdu dans B et C : un moment reporté passe plus tard, jamais supprimé.

## Câblage prévu (après choix)

Une règle pure dans `lib/` (qui décide, pour un retour, quoi montrer en plein écran et quoi reporter), testée ;
`SessionResult` (carte de promotion en ligne), le filtre du narrateur dans `App()` (budget par retour au lieu
de `!lastSession`), la lettre du lundi, et la correction du jingle en double dans tous les cas.
