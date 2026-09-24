# Demande de notifications

Proto du 2026-09-24, hors build Vercel, rien dans `src/`.

**Constat (mesure du 24/09, lecture seule) :** 39 personnes abonnées aux notifications depuis toujours, 3 depuis le
1er septembre. Le 30/06, la demande de l'onboarding a été remplacée par l'écran « Installe l'appli » ; le commentaire
prévoyait de redemander « au lancement ou depuis le Profil », seul le bouton du Profil existe. Résultat : la relance
des inactifs (tous les 3 jours) vise 9 élèves d'iabd2627 et en atteint 2 ; idem pour la série et la lettre du lundi.

## Ouvrir

Serveur `festival-proto` de `.claude/launch.json` (Vite à la racine du dépôt, port 5606), puis :

- comparateur : `http://localhost:5606/prototypes/push-optin/index.html`
- un téléphone seul : `frame.html?v=B&st=ask&p=lea&mode=light`

## Variantes

| | Où | Budget d'interruptions | Pour | Contre |
|---|---|---|---|---|
| A | Carte sous la porte de Home | non | discrète, reste jusqu'à réponse | facile à ignorer |
| B | Feuille d'Aldric à l'entrée sur Home | oui (l'emplacement du jour) | explicite, liste ce qui sera envoyé | un plein écran de plus |
| C | Ligne dans l'écran de fin | non (contextuelle) | au pic de motivation | noyée dans le parchemin |

## Situations (`st`)

`ask` (Android, ou iPhone avec l'appli installée), `ios` (iPhone sans l'appli : la demande est impossible, on renvoie
vers l'écran d'installation), `granted` (rien, ou la confirmation en C), `denied` (rien : un refus du navigateur est
définitif, ne jamais redemander).

## Règles communes (quelle que soit la variante)

- Jamais à l'inscription : après la **première session terminée**.
- « Not now » : reproposé dans 5 jours, 3 fois au plus, puis plus jamais automatiquement (le Profil garde le bouton).
- Refus dans le navigateur : plus jamais redemandé.
- Les textes ne promettent que les trois notifications qui existent (série à 20 h, lettre du lundi, retour après une
  semaine d'absence).

## Décision

À prendre par Jérémy.
