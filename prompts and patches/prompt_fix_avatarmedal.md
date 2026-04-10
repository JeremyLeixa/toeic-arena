# Prompt Claude Code — Tâche 1
## Fix AvatarMedal : décalage icône/écusson + glow manquant

---

## Contexte

Sur la home de TOEIC Arena, l'avatar équipé apparaît avec un décalage :
l'icône Game Icons (noir) et l'écusson SVG (coloré) sont rendus côte à côte
au lieu d'être imbriqués dans un SVG composite unique.

De plus, les cartes d'avatars dans la galerie (page Profile) n'ont pas
de glow selon la rareté (Rare → bleu, Épique → violet, Légendaire → or).

---

## Diagnostic

Le problème de décalage vient du rendu du composant AvatarMedal (ou équivalent).
L'icône et l'écusson doivent former **un seul SVG** avec cette structure :

```html
<svg viewBox="0 0 100 100" width="{size}" height="{size}"
     style="overflow:visible; filter:drop-shadow(...)">
  <!-- Écusson (fond + bordure) -->
  <path d="M 50,7 L 90,20 L 90,56 C 90,76 72,88 50,96 C 28,88 10,76 10,56 L 10,20 Z"
        fill="{rarityBg}" stroke="{rarityColor}" stroke-width="1.5"/>
  <!-- Décoration intérieure de l'écusson -->
  <path d="M 50,13 L 84,24 L 84,54 C 84,72 67,83 50,90 C 33,83 16,72 16,54 L 16,24 Z"
        fill="none" stroke="{rarityColor}" stroke-width="0.7" opacity="0.35"/>
  <!-- Icône Game Icons — SVG imbriqué pour scaler 512x512 → zone 68x65 -->
  <svg x="16" y="18" width="68" height="65" viewBox="0 0 512 512">
    <path fill="{rarityIconColor}" d="{gameIconPath}"/>
  </svg>
</svg>
```

**Ne pas** rendre l'écusson et l'icône comme deux éléments HTML séparés
dans un flex container — tout doit être dans un seul `<svg>`.

---

## Couleurs par rareté

```js
const RARITY_STYLES = {
  common:   { bg: '#1a1a1a', stroke: '#808080', icon: '#d0d0d0', glow: null },
  uncommon: { bg: '#0b1e10', stroke: '#3ecc78', icon: '#80f0a0', glow: null },
  rare:     { bg: '#091628', stroke: '#3a8ee0', icon: '#80c0f8',
              glow: 'drop-shadow(0 0 4px #3a8ee066) drop-shadow(0 0 8px #3a8ee033)' },
  epic:     { bg: '#160824', stroke: '#c060f0', icon: '#e090ff',
              glow: 'drop-shadow(0 0 5px #c060f088) drop-shadow(0 0 10px #c060f044)' },
  legend:   { bg: '#0a0608', stroke: '#ffc020', icon: '#ffe080',
              glow: 'drop-shadow(0 0 6px #ffc020aa) drop-shadow(0 0 14px #ffc02055)' },
};
```

Le glow s'applique via `style="filter: drop-shadow(...)"` directement sur le `<svg>` racine.
Pour Légendaire, ajouter aussi `animation: legendGlow 2s ease-in-out infinite`.

---

## Keyframes à ajouter dans le CSS global (var CSS dans App.jsx)

Ajouter dans le bloc `var CSS = \`...\`` :

```css
@keyframes legendGlow {
  0%,100% { filter: drop-shadow(0 0 5px #ffc020bb) drop-shadow(0 0 12px #ffc02055); }
  50%      { filter: drop-shadow(0 0 10px #ffc020dd) drop-shadow(0 0 24px #ffc02088); }
}
@keyframes epicGlow {
  0%,100% { filter: drop-shadow(0 0 3px #c060f099); }
  50%      { filter: drop-shadow(0 0 8px #c060f0cc); }
}
@keyframes rareGlow {
  0%,100% { filter: drop-shadow(0 0 2px #3a8ee066); }
  50%      { filter: drop-shadow(0 0 6px #3a8ee0aa); }
}
```

---

## Ce qui doit être corrigé

1. **Trouver** le composant qui rend l'avatar équipé sur la Home
   (probablement dans le composant Home ou dans la navbar).

2. **Vérifier** sa structure actuelle — si l'écusson et l'icône sont deux
   éléments séparés, les fusionner en un SVG composite comme indiqué ci-dessus.

3. **Trouver** le composant de galerie d'avatars dans Profile.

4. **Ajouter** le `filter: drop-shadow` + animation sur le SVG selon la rareté
   pour les avatars Rare, Épique et Légendaire.

5. **Tester** aux tailles : 24px, 40px, 64px, 96px — le SVG doit scaler proprement
   à toutes les tailles sans débordement ni pixelisation.

---

## Ne pas modifier

- La logique d'équipement (equipItem dans chests.js)
- Les tables Supabase
- Les autres composants
