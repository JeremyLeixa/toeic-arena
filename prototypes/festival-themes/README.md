# Festival themes — proto (2026-09-16)

Thèmes saisonniers qui prennent le pas sur le skin équipé pendant une fenêtre de dates,
sans le supprimer. Proto-first : ce dossier valide les visuels avant de toucher `appCss.js`.

## Ouvrir

Le mock importe la feuille de prod (`src/styles/appCss.js`) et les icônes en ESM, il faut
donc Vite, pas un `file://` ni un `http.server` :

```
npm run dev
http://localhost:5173/prototypes/festival-themes/
```

Ou via `.claude/launch.json` → config `festival-proto` (port 5606). Paramètres d'URL :
`?light=1`, `?skin=frostbite`, `?scale=0.7|0.85|1|auto`.

⚠️ **Ne pas ouvrir la racine de l'app sur le même port avant le proto** : `index.html`
enregistre `sw.js` sur `/`, et le service worker sert ensuite le shell de l'app à la place
du proto (vécu le 2026-09-16). Si c'est arrivé : DevTools → Application → Unregister, ou
depuis la console `navigator.serviceWorker.getRegistrations().then(r=>r.forEach(x=>x.unregister()))`.

## Fichiers

- `festivals.css` — **le livrable** : 4 paquets `.fest-<id>` écrits dans la grammaire des
  skins (tokens → `.crd` + `::before/::after` → `.btn1` → `.bar-fill` → `.btn2` →
  `.tab-bar` → `.out` → retint `.light.fest-<id>`). Aucun keyframe neuf, tout vient des
  skins (`skSnowFall skMoteRise skCandle skFlicker skSheen skTwinkle skDrift aurora`).
  À coller dans `appCss.js` après les paquets `.skin-*`.
- `index.html` — 5 téléphones : référence (skin équipé au choix) + les 4 fêtes. Le Home
  est un décalque statique de `Home.jsx`. Le bloc desktop `@media(min-width:768px)` de la
  feuille de prod est retiré au chargement (sinon la tab-bar devient une sidebar).

## Les 4 fêtes

| id | nom | fenêtre | DA |
|---|---|---|---|
| `halloween` | Hallow's Eve | 24 oct → 2 nov | citrouille `#ff7a1a` sur violet `#0a0612`, feux follets, brume, chandelle |
| `yule` | Yuletide | 14 déc → 4 jan (chevauche l'an) | sapin `#06110b`, or `#f5d76e`, rouge sur btn1, neige, guirlande, barre sucre d'orge |
| `spring` | Spring Bloom | Pâques −5 → +1 (Meeus) | sakura `#ff9ec4`, menthe, pétales ; gagne le plus en clair |
| `solstice` | Summer Send-off | 19 → 28 juin | ciel crépuscule indigo→corail, lagon `#38d6e0`, lucioles |

Mode clair : contrairement aux skins (qui forcent leur fond sombre), chaque fête a un
fond pâle propre + accent assombri, particules conservées.

Icônes de bandeau déjà dans `GAME_ICON_PATHS` : `spider-web`, `ringing-bell`,
`herbs-bundle`, `sunrise`.

## Décisions prises (proposition validée le 2026-09-16)

- **Remplacement de classe, pas superposition** : `fest-<id>` à la place de `skin-<id>`
  sur la racine `.app`. `u.equippedSkin` / `skin_id` jamais touchés. Un overlay par-dessus
  le skin se battrait avec les `::before/::after !important` de 13 skins sur 16.
- Avatar, frame, titre : intacts (par élément, pas globaux).
- Nom **festival**, pas *season* : `season` est déjà la Ligue (S1-S4, `seasons` jsonb).
- Opt-out en **localStorage** (patron du mute `toeic-sound`), pas de colonne Supabase.
- Forçage hors fenêtre : `?fest=halloween` ou clé localStorage.
- L'onboarding (`.onboard-shell`) reste hors thème : les nouveaux découvrent l'identité
  canonique d'abord.
