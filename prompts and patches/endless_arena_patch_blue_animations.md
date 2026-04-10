# Endless Arena — Patch additionnel : bleu azur + animations

**Contexte** : l'implémentation initiale en violet est en place et fonctionne. Deux évolutions sont demandées :

1. **Changement de couleur signature** de l'Endless Arena : violet → bleu `#1B70CF`
2. **Ajout d'animations ambient** sur les deux heros (Final Arena = braises rougeoyantes, Endless Arena = ciel étoilé scintillant)

Ce patch est **additif** : il ne remet pas en cause l'architecture, le data model, la logique métier, ni le refactor Train déjà effectué. Il remplace uniquement du styling et ajoute des éléments visuels.

---

## 1. Sweep couleur : violet → bleu azur

### 1.1 Palette Endless Arena mise à jour

**Ancienne palette (à retirer)** :
- `#c8a8d4` (lavande titres/valeurs)
- `#a878a0` (violet moyen sous-titres)
- `#b08aa8` (lavande clair status)
- `#8b5e83` / `#5a3a5a` (gradients badge et backgrounds)
- `rgba(139,94,131, *)` (borders, washes, track progress bar)

**Nouvelle palette bleu azur** :

| Usage | Ancien hex violet | Nouveau hex bleu |
|-------|-------------------|------------------|
| Titre Endless Arena (text-gradient stop 1) | `#c8a8d4` | `#7fb8e8` |
| Titre Endless Arena (text-gradient stop 2) | `#a878a0` | `#4a9fe0` |
| Titre Endless Arena (text-gradient stop 3 or conservé) | `#d4943a` | `#d4943a` (inchangé) |
| Valeurs highlighted historique / scores run actuelle | `#c8a8d4` | `#7fb8e8` |
| Sous-titres italic ("so close", "first run awaits") | `#a878a0` | `#4a9fe0` |
| Label "WEAKEST THIS RUN" | `#a878a0` | `#4a9fe0` |
| Status text "ready to enter" hero Mock Exams | `#b08aa8` | `#4a9fe0` |
| Tagline "the arena never sleeps" | `#8a7e6a` | `#7a9ac0` (bleu-gris désaturé) |
| Couleur signature base | `#8b5e83` | `#1B70CF` |
| Couleur signature sombre (badge gradient bottom) | `#5a3a5a` | `#0a3a6e` |
| Background outer card Endless | `linear-gradient(135deg, #150f18, #1f1525)` | `linear-gradient(135deg, #081828, #0d2a45)` |
| Background inner card Endless | `linear-gradient(135deg, #1f1528, #2a1a32, #15101c)` | `linear-gradient(135deg, #0a1e35, #102844, #081828)` |
| Badge gradient | `linear-gradient(135deg, #8b5e83, #5a3a5a)` | `linear-gradient(135deg, #1B70CF, #0a3a6e)` |
| Shadow badge | `none` ou inchangé | `0 0 20px rgba(27,112,207,0.35)` |
| Border outer | `rgba(139,94,131,0.4)` | `rgba(27,112,207,0.5)` |
| Row wash dans hero Mock Exams | `rgba(139,94,131,0.08)` | `rgba(27,112,207,0.08)` |
| Border row dans hero Mock Exams | `rgba(139,94,131,0.15)` | `rgba(27,112,207,0.2)` |
| Progress bar track (état locked) | `rgba(139,94,131,0.18)` | `rgba(27,112,207,0.18)` |
| Progress bar fill (état locked) | `linear-gradient(90deg, #8b5e83, #c8a8d4)` | `linear-gradient(90deg, #0a3a6e, #1B70CF)` |
| Historique run actuelle - track background | `rgba(139,94,131,0.15)` | `rgba(27,112,207,0.15)` |
| Historique run actuelle - fill gradient | `linear-gradient(90deg, #8b5e83, #c8a8d4)` | `linear-gradient(90deg, #0a3a6e, #4a9fe0)` |
| Weakness card background | `linear-gradient(135deg, #1a1420, #221828)` | `linear-gradient(135deg, #0a1828, #0f2038)` |
| Weakness card border | `rgba(139,94,131,0.35)` | `rgba(27,112,207,0.35)` |
| Weakness card badge background | `rgba(139,94,131,0.2)` | `rgba(27,112,207,0.2)` |
| Score hero card border | `rgba(139,94,131,0.25)` | `rgba(27,112,207,0.25)` |
| Score hero card background (résultats) | `linear-gradient(135deg, #1a1610, #221a26)` | `linear-gradient(135deg, #1a1610, #0f1a2a)` |
| PB banner background | `linear-gradient(135deg, #3a2810 0%, #2a1a2a 50%, #3a2810 100%)` | `linear-gradient(135deg, #3a2810 0%, #0a1e35 50%, #3a2810 100%)` |

### 1.2 Bloc CSS à ajouter au template literal `CSS`

Pour que la couleur soit gérable de façon centralisée si tu veux la tweaker plus tard, je te suggère d'ajouter ces custom properties dans `:root` (en complément de celles qui existent déjà) :

```css
:root {
  /* ... variables existantes ... */
  --endless: #1B70CF;
  --endless-dark: #0a3a6e;
  --endless-light: #7fb8e8;
  --endless-mid: #4a9fe0;
  --endless-muted: #7a9ac0;
}
```

Puis utiliser ces variables dans le code au lieu des hex en dur. Ça rendra un futur tweak (ex: passer à `#2080e0` si besoin) trivial.

### 1.3 Compatibilité skin Saphir

Le skin Saphir existant porte `#3a94dc`. L'Endless bleue à `#1B70CF` sera donc **ton-sur-ton** pour les étudiants qui ont ce skin équipé. C'est un trade-off assumé : la majorité des étudiants n'ont pas Saphir équipé, et ceux qui l'ont perdront juste un peu de distinction visuelle Endless (pas de bug, pas de collision fonctionnelle).

**Si dans un futur cela pose problème**, une option serait de forcer l'Endless à utiliser `--endless` défini en `!important` dans `.skin-saphir .endless-hero {}` pour overrider la couleur skin. Mais pas prioritaire pour cette itération.

---

## 2. Animations CSS

### 2.1 Keyframes à ajouter au template literal `CSS`

```css
/* ─── ENDLESS ARENA · starry night animations ─── */
@keyframes endless-star-twinkle {
  0%, 100% { opacity: 0.15; transform: scale(0.8); }
  50%      { opacity: 0.95; transform: scale(1.1); }
}
@keyframes endless-halo-breathe {
  0%, 100% { opacity: 0.25; }
  50%      { opacity: 0.55; }
}

/* ─── FINAL ARENA · ember animations ─── */
@keyframes final-ember-rise {
  0%   { transform: translateY(0) scale(0.6); opacity: 0; }
  15%  { opacity: 0.85; }
  100% { transform: translateY(-55px) scale(0.2); opacity: 0; }
}
@keyframes final-ember-glow {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 0.75; }
}

/* Particles base classes */
.fx-ember {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #ff8c42;
  animation: final-ember-rise 4s ease-out infinite;
  pointer-events: none;
  will-change: transform, opacity;
}
.fx-ember.sm { width: 2px; height: 2px; background: #ffaa66; }
.fx-ember.lg { width: 4px; height: 4px; background: #ff6020; }

.fx-star {
  position: absolute;
  border-radius: 50%;
  animation: endless-star-twinkle 3s ease-in-out infinite;
  pointer-events: none;
  will-change: transform, opacity;
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .fx-ember, .fx-star,
  .fx-halo-red, .fx-halo-red-2,
  .fx-halo-blue, .fx-halo-blue-2 {
    animation: none;
  }
  .fx-ember { opacity: 0; }
}
```

### 2.2 Règles de performance

- **Seules `transform` et `opacity`** sont animées (GPU-accelerated)
- `will-change: transform, opacity` sur les particules pour hint au compositeur
- `pointer-events: none` pour ne pas bloquer les clics sur la carte
- `@media (prefers-reduced-motion: reduce)` désactive tout pour les utilisateurs sensibles au mouvement (accessibilité — obligatoire en 2026 pour être respectueux)

### 2.3 Markup : particules Final Arena (braises)

À ajouter **à l'intérieur** du bloc `inner` de la hero Final Arena (celui avec le gradient `linear-gradient(135deg, #2a0a0a, #3d1a00, #1a0800)`), **juste après la balise ouvrante** du bloc et **avant le contenu existant** (dragon watermark, titre, pills, etc.) :

```jsx
{/* Ember glow halos */}
<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 30% 90%, rgba(255,100,20,0.35), transparent 55%)",animation:"final-ember-glow 3.5s ease-in-out infinite",pointerEvents:"none"}}/>
<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 70% 85%, rgba(220,38,38,0.25), transparent 50%)",animation:"final-ember-glow 4.5s ease-in-out infinite 0.8s",pointerEvents:"none"}}/>

{/* Rising embers — 9 particles staggered */}
<div className="fx-ember sm" style={{left:"18%",bottom:10,animationDelay:"0s"}}/>
<div className="fx-ember"    style={{left:"28%",bottom:8, animationDelay:"0.7s"}}/>
<div className="fx-ember lg" style={{left:"40%",bottom:12,animationDelay:"1.4s"}}/>
<div className="fx-ember sm" style={{left:"52%",bottom:6, animationDelay:"2.1s"}}/>
<div className="fx-ember"    style={{left:"63%",bottom:10,animationDelay:"0.3s"}}/>
<div className="fx-ember sm" style={{left:"74%",bottom:8, animationDelay:"1.0s"}}/>
<div className="fx-ember"    style={{left:"85%",bottom:12,animationDelay:"1.7s"}}/>
<div className="fx-ember lg" style={{left:"22%",bottom:14,animationDelay:"2.8s"}}/>
<div className="fx-ember sm" style={{left:"58%",bottom:6, animationDelay:"3.2s"}}/>
```

**Contrainte obligatoire** : le conteneur parent doit avoir `overflow: hidden` (déjà le cas sur la hero Final Arena existante) et `position: relative` (déjà le cas aussi) pour contenir les particules.

### 2.4 Markup : particules Endless Arena (étoiles)

À ajouter **à l'intérieur** du bloc `inner` de la hero Endless Arena, juste après la balise ouvrante :

```jsx
{/* Cosmic halos */}
<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 75% 20%, rgba(27,112,207,0.35), transparent 55%)",animation:"endless-halo-breathe 5s ease-in-out infinite",pointerEvents:"none"}}/>
<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 15% 85%, rgba(74,159,224,0.18), transparent 45%)",animation:"endless-halo-breathe 6s ease-in-out infinite 1.5s",pointerEvents:"none"}}/>

{/* Twinkling stars — 15 dots with varied colors, sizes and delays */}
<div className="fx-star" style={{top:"14%",left:"8%", width:2,  height:2,  background:"#a8d4ff",animationDelay:"0s"}}/>
<div className="fx-star" style={{top:"22%",left:"18%",width:1.5,height:1.5,background:"#d4943a",animationDelay:"0.5s"}}/>
<div className="fx-star" style={{top:"10%",left:"32%",width:2.5,height:2.5,background:"#ffffff",animationDelay:"1.2s"}}/>
<div className="fx-star" style={{top:"28%",left:"45%",width:1.5,height:1.5,background:"#a8d4ff",animationDelay:"1.8s"}}/>
<div className="fx-star" style={{top:"18%",left:"58%",width:2,  height:2,  background:"#a8d4ff",animationDelay:"0.3s"}}/>
<div className="fx-star" style={{top:"8%", left:"72%",width:2,  height:2,  background:"#d4943a",animationDelay:"2.2s"}}/>
<div className="fx-star" style={{top:"24%",left:"85%",width:1.5,height:1.5,background:"#ffffff",animationDelay:"0.9s"}}/>
<div className="fx-star" style={{top:"35%",left:"28%",width:1.5,height:1.5,background:"#a8d4ff",animationDelay:"2.5s"}}/>
<div className="fx-star" style={{top:"40%",left:"62%",width:2,  height:2,  background:"#d4943a",animationDelay:"1.5s"}}/>
<div className="fx-star" style={{top:"48%",left:"15%",width:1.5,height:1.5,background:"#a8d4ff",animationDelay:"0.7s"}}/>
<div className="fx-star" style={{top:"55%",left:"78%",width:2,  height:2,  background:"#ffffff",animationDelay:"2.8s"}}/>
<div className="fx-star" style={{top:"65%",left:"38%",width:1.5,height:1.5,background:"#a8d4ff",animationDelay:"1.1s"}}/>
<div className="fx-star" style={{top:"72%",left:"88%",width:2,  height:2,  background:"#d4943a",animationDelay:"0.4s"}}/>
<div className="fx-star" style={{top:"80%",left:"22%",width:1.5,height:1.5,background:"#a8d4ff",animationDelay:"2.0s"}}/>
<div className="fx-star" style={{top:"85%",left:"55%",width:2,  height:2,  background:"#ffffff",animationDelay:"1.3s"}}/>
```

**Note sur les couleurs des étoiles** : 3 couleurs délibérément mixées — blanc pur (`#ffffff`), bleu clair (`#a8d4ff`), et doré (`#d4943a`). Les étoiles dorées sont un **rappel discret à la DA de base** de l'app, ça lie visuellement l'Endless au reste de Mock Exams malgré le basculement vers le bleu. Ne pas les retirer.

### 2.5 Règle d'activation contextuelle (RECOMMANDATION)

**Proposition à valider avec Jérémy** : pour éviter le conflit visuel des deux cartes animées en même temps, appliquer une règle d'activation conditionnelle :

- **Final Arena** anime ses braises **uniquement si non conquise** (`!u.mockResults.boss`). Les braises appellent à l'exploit, elles s'éteignent une fois le dragon vaincu.
- **Endless Arena** anime toujours ses étoiles si visible, quels que soient les états (`locked`, `ready`, `cooldown`). C'est la feature phare, elle mérite son scintillement permanent.

**Implémentation** : conditionner l'inclusion des particules `.fx-ember` et des halos red dans la hero Final Arena au flag `!bossCompleted` :

```jsx
{!bossCompleted && (
  <>
    {/* Ember halos */}
    <div style={{position:"absolute",inset:0,background:"radial-gradient(..."}}/>
    {/* ... */}
    {/* Rising embers */}
    <div className="fx-ember sm" style={{...}}/>
    {/* ... */}
  </>
)}
```

Jérémy valide ou invalide cette règle. Si invalidé, garder les animations Final Arena actives en permanence.

---

## 3. Checklist de validation visuelle post-patch

- [ ] Aucune trace résiduelle de violet dans l'Endless Arena (titre, badge, border, background, sous-titres, valeurs, weakness card, PB banner, historique run actuelle, progress bar locked)
- [ ] Le bleu `#1B70CF` est utilisé comme base pour les gradients et borders, avec `#0a3a6e` comme stop sombre et `#7fb8e8` / `#4a9fe0` comme accents clairs
- [ ] Les accents or `#d4943a` sont préservés dans le text-gradient du titre Endless Arena (stop final) pour maintenir le lien avec la DA de base
- [ ] Les étoiles de l'Endless scintillent à des vitesses et opacités variées, 15 particules au total
- [ ] Les braises de la Final Arena montent depuis le bas, 9 particules à tailles/délais variés
- [ ] Les halos de fond pulsent lentement (3.5s à 6s) et restent subtils (opacity max 0.75)
- [ ] Les animations sont contenues (overflow: hidden) et ne débordent pas de la carte
- [ ] `prefers-reduced-motion: reduce` coupe bien toutes les animations
- [ ] Aucune baisse de perfs visible, même sur mobile milieu de gamme
- [ ] Si règle contextuelle validée : Final Arena ne pétille plus une fois le Boss vaincu
- [ ] Aucun régression sur le flow de lancement Endless Arena, sauvegarde, XP, weakness recommendation

---

**Fin du patch.** Ce document se lit en complément du spec initial `endless_arena_spec.md`. Si contradiction entre les deux, ce patch est prioritaire pour les couleurs et les animations ; le spec initial reste autoritaire pour tout le reste (architecture, data, logique métier).
