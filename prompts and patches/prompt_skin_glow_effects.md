# Prompt Claude Code — Effets visuels skins Épiques & Légendaires
## Glow + animations sur barres, boutons et cards

---

## Contexte

Les skins s'appliquent correctement (couleur d'accent change).
Mais les skins Épiques et Légendaires doivent avoir des effets visuels
supplémentaires comme prévu dans le design :

- **Commun / Peu Commun / Rare** : couleur unie ou gradient statique — pas d'animation
- **Épique** (Rubis, Améthyste, Corail, Jade) : gradient animé + glow léger
- **Légendaire** (Obsidienne, Aurore Boréale) : gradient animé intense + glow fort + cards

Les éléments concernés : barres de progression, boutons `.btn1`, cards `.crd`.

---

## Modification 1 — Composant Bar (ajout className)

Le composant `Bar` (ligne ~503) utilise des styles inline sur la div de fill,
ce qui empêche les overrides CSS. Ajouter `className="bar-fill"` sur cette div.

**Avant :**
```js
function Bar(p){var pct=p.max>0?Math.min(100,p.value/p.max*100):0;return(<div style={{width:"100%",height:p.h||8,background:"var(--bg3)",borderRadius:99,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:p.color||"linear-gradient(90deg,var(--cx-hex),var(--cx-dark))",borderRadius:99,transition:"width .8s cubic-bezier(.4,0,.2,1)"}}/></div>);}
```

**Après :**
```js
function Bar(p){var pct=p.max>0?Math.min(100,p.value/p.max*100):0;return(<div style={{width:"100%",height:p.h||8,background:"var(--bg3)",borderRadius:99,overflow:"hidden"}}><div className="bar-fill" style={{width:pct+"%",height:"100%",background:p.color||"linear-gradient(90deg,var(--cx-hex),var(--cx-dark))",borderRadius:99,transition:"width .8s cubic-bezier(.4,0,.2,1)"}}/></div>);}
```

---

## Modification 2 — Keyframe dans le bloc CSS

Dans le bloc `var CSS = \`...\`` de App.jsx, ajouter ce keyframe
avec les autres `@keyframes` existants :

```css
@keyframes skinShimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
```

---

## Modification 3 — Règles CSS par tier de skin

Dans le même bloc CSS, ajouter ce bloc **après les classes `.skin-xxx`** existantes.

```css
/* ── SKINS ÉPIQUES : gradient animé + glow léger ── */
.skin-rubis .btn1,.skin-amethyste .btn1,.skin-corail .btn1,.skin-jade .btn1{background:linear-gradient(135deg,var(--cx-hex),var(--cx-dark),var(--cx-hex))!important;background-size:200%!important;animation:skinShimmer 3s ease infinite!important;box-shadow:0 4px 20px rgba(var(--cx),.35),0 0 0 1px rgba(var(--cx),.15)!important}
.skin-rubis .bar-fill,.skin-amethyste .bar-fill,.skin-corail .bar-fill,.skin-jade .bar-fill{background:linear-gradient(90deg,var(--cx-hex),var(--cx-dark),var(--cx-hex))!important;background-size:200%!important;animation:skinShimmer 2.5s ease infinite!important}
.skin-rubis .crd,.skin-amethyste .crd,.skin-corail .crd,.skin-jade .crd{border-color:rgba(var(--cx),.14)!important;box-shadow:inset 0 1px 0 rgba(var(--cx),.06)!important}

/* ── SKINS LÉGENDAIRES : animation intense + glow fort + cards ── */
.skin-obsidienne .btn1,.skin-aurore .btn1{background:linear-gradient(135deg,var(--cx-hex),var(--cx-dark),var(--cx-hex))!important;background-size:300%!important;animation:skinShimmer 2s ease infinite!important;box-shadow:0 4px 28px rgba(var(--cx),.5),0 0 48px rgba(var(--cx),.2),0 0 0 1px rgba(var(--cx),.2)!important}
.skin-obsidienne .bar-fill,.skin-aurore .bar-fill{background:linear-gradient(90deg,var(--cx-hex),var(--cx-dark),var(--cx-hex))!important;background-size:300%!important;animation:skinShimmer 1.8s ease infinite!important}
.skin-obsidienne .crd,.skin-aurore .crd{border-color:rgba(var(--cx),.2)!important;box-shadow:0 0 16px rgba(var(--cx),.1),inset 0 1px 0 rgba(var(--cx),.1)!important}
.skin-obsidienne .glo,.skin-aurore .glo{box-shadow:0 0 40px rgba(var(--cx),.2)!important}

/* ── Mode light : garder les effets mais plus subtils ── */
.light.skin-rubis .btn1,.light.skin-amethyste .btn1,.light.skin-corail .btn1,.light.skin-jade .btn1{box-shadow:0 4px 16px rgba(var(--cx),.25)!important}
.light.skin-obsidienne .btn1,.light.skin-aurore .btn1{box-shadow:0 4px 20px rgba(var(--cx),.35)!important}
```

---

## Résultat attendu

| Skin | Barres XP | Boutons btn1 | Cards |
|---|---|---|---|
| Argent / Émeraude / Saphir | Gradient statique | Gradient statique | Bordure standard |
| Rubis / Améthyste / Corail / Jade | Gradient animé ← → | Gradient animé + glow léger | Bordure teintée |
| Obsidienne / Aurore Boréale | Gradient animé rapide | Glow intense + shimmer | Box-shadow coloré |

---

## Vérification

Tester avec le skin Jade équipé :
- La barre XP sur Home doit avoir un gradient teal animé
- Le bouton "Review X cards" doit avoir un léger glow teal
- Le bouton "Enter the Arena" / Boss Test doit pulser légèrement

Tester avec Aurore Boréale :
- Même effets mais plus intenses
- Les cards doivent avoir un halo coloré subtil

---

## Ne pas modifier

- La logique des composants (pas de props supplémentaires sur Bar)
- Le comportement des boutons
- Les couleurs de fond `--bg`, `--bg2`, `--bg3`
- Les skins Rares et inférieurs (pas d'animation prévue)
