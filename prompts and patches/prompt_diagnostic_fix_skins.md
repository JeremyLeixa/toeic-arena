# Prompt Claude Code — Diagnostic & Fix skins cosmétiques
## Le skin est EQUIPPED en base mais aucun changement visuel

---

## Symptôme

L'utilisateur équipe le skin Jade depuis la page Profile.
La carte affiche "EQUIPPED" mais l'interface reste en or (#d4943a) standard.
La sidebar, les boutons, les barres XP ne changent pas de couleur.

---

## Diagnostic — 3 vérifications dans cet ordre

### Check 1 — Les variables CSS existent-elles ?

Dans App.jsx, chercher dans le bloc `var CSS = \`...\`` :

```bash
grep -n "\-\-cx:" App.jsx | head -5
grep -n "skin-jade\|skin-emeraude" App.jsx | head -5
```

**Si résultat vide** → la migration CSS (variables + classes .skin-xxx) n'a pas été appliquée.
Aller directement au **Fix A**.

**Si résultat non vide** → les variables existent, aller au Check 2.

---

### Check 2 — La classe skin est-elle appliquée sur .app ?

Chercher dans App.jsx comment la div `.app` est rendue :

```bash
grep -n "className.*app\|className={lc" App.jsx | head -10
```

**Si on voit** `className="app"` ou `className={lc}` sans aucune mention de `activeSkin` ou `skin-` :
→ Le state React n'est pas câblé. Aller au **Fix B**.

**Si on voit** `className={\`app \${activeSkin...}\`}` :
→ Le câblage existe. Aller au Check 3.

---

### Check 3 — Le state activeSkin est-il mis à jour au clic ?

Chercher la fonction qui gère l'équipement d'un skin :

```bash
grep -n "handleEquipSkin\|equipSkin\|setActiveSkin\|activeSkin" App.jsx | head -10
```

Vérifier que `setActiveSkin(skinId)` est bien appelé quand le bouton "Équiper" est cliqué.
Si ce n'est pas le cas → compléter le **Fix B**.

---

## Fix A — Ajouter les variables CSS et classes skins dans App.jsx

### A1 — Dans le bloc `var CSS`, modifier la ligne `:root{...}` pour ajouter à la fin :

Trouver :
```
--t3:#5a5040}
```
Remplacer par :
```
--t3:#5a5040;--cx:212,148,58;--cx-hex:#d4943a;--cx-dark:#a06e20}
```

### A2 — Modifier la ligne `.light{...}` pour ajouter à la fin :

Trouver :
```
--t3:#8a7e6a}
```
Remplacer par :
```
--t3:#8a7e6a;--cx:139,105,20;--cx-hex:#8b6914;--cx-dark:#6a4e10}
```

### A3 — Ajouter les classes skins juste après la ligne `.light{...}` :

```css
.skin-argent{--cx:180,180,200;--cx-hex:#b4b4c8;--cx-dark:#888898}
.skin-emeraude{--cx:46,180,100;--cx-hex:#2eb464;--cx-dark:#1a8a46}
.skin-saphir{--cx:58,148,220;--cx-hex:#3a94dc;--cx-dark:#1a6aaa}
.skin-rubis{--cx:220,58,80;--cx-hex:#dc3a50;--cx-dark:#c01830}
.skin-amethyste{--cx:160,90,220;--cx-hex:#a05adc;--cx-dark:#7030aa}
.skin-corail{--cx:220,100,50;--cx-hex:#dc6432;--cx-dark:#c03018}
.skin-jade{--cx:20,180,170;--cx-hex:#14b4aa;--cx-dark:#0a8880}
.skin-obsidienne{--cx:176,144,240;--cx-hex:#b090f0;--cx-dark:#8060c0}
.skin-aurore{--cx:64,208,192;--cx-hex:#40d0c0;--cx-dark:#3a9870}
.light.skin-argent{--cx:80,80,110;--cx-hex:#505070;--cx-dark:#383848}
.light.skin-emeraude{--cx:18,110,52;--cx-hex:#126e34;--cx-dark:#0c5228}
.light.skin-saphir{--cx:20,80,150;--cx-hex:#145096;--cx-dark:#0e3a78}
.light.skin-rubis{--cx:160,20,40;--cx-hex:#a01428;--cx-dark:#780e1e}
.light.skin-amethyste{--cx:100,40,160;--cx-hex:#6428a0;--cx-dark:#4a1878}
.light.skin-corail{--cx:160,55,20;--cx-hex:#a03714;--cx-dark:#7a2408}
.light.skin-jade{--cx:10,110,105;--cx-hex:#0a6e69;--cx-dark:#085250}
.light.skin-obsidienne{--cx:80,60,140;--cx-hex:#503c8c;--cx-dark:#382868}
.light.skin-aurore{--cx:20,120,90;--cx-hex:#147858;--cx-dark:#0c5a40}
```

### A4 — Remplacer les couleurs hardcodées dans le CSS statique

Dans le même bloc `var CSS`, faire ces remplacements ciblés :

```
.glo{box-shadow:0 0 30px rgba(212,148,58,.06)}
→
.glo{box-shadow:0 0 30px rgba(var(--cx),.06)}
```

```
.btn1{background:linear-gradient(135deg,#d4943a,#a06e20);
→
.btn1{background:linear-gradient(135deg,var(--cx-hex),var(--cx-dark));
```

### A5 — Script Node.js pour les rgba hardcodés dans les styles inline React

Créer et exécuter `migrate-skins.cjs` :

```js
const fs = require('fs');
let c = fs.readFileSync('App.jsx', 'utf8');

// Remplacer rgba(212,148,58,X) par rgba(var(--cx),X) partout
c = c.replace(/rgba\(212,148,58,([^)]+)\)/g, 'rgba(var(--cx),$1)');
c = c.replace(/rgba\(212, 148, 58, ([^)]+)\)/g, 'rgba(var(--cx),$1)');

// Remplacer #d4943a dans les gradients des styles inline (hors :root et .skin-)
const lines = c.split('\n');
const result = lines.map(line => {
  if (line.includes(':root{') || line.includes('.light{') || line.includes('.skin-')) return line;
  line = line.replace(/linear-gradient\(([^"]*?)#d4943a([^"]*?)\)/g,
    (m, b, a) => `linear-gradient(${b}var(--cx-hex)${a})`);
  line = line.replace(/linear-gradient\(([^"]*?)#a06e20([^"]*?)\)/g,
    (m, b, a) => `linear-gradient(${b}var(--cx-dark)${a})`);
  return line;
});
c = result.join('\n');

fs.writeFileSync('App.jsx', c, 'utf8');
console.log('Done. Vérification:');
console.log('rgba hardcodés restants:', (c.match(/rgba\(212,148,58/g) || []).length);
```

```bash
node migrate-skins.cjs
# Doit afficher : rgba hardcodés restants: 0
```

---

## Fix B — Câbler le state React pour appliquer la classe skin

### B1 — Ajouter le state dans le composant principal Arena

Ajouter avec les autres useState (u, tab, sp...) :

```js
var [activeSkin, setActiveSkin] = useState(null);
```

Ajouter un useEffect pour initialiser depuis u :

```js
useEffect(function() {
  if (u && u.skin_id) setActiveSkin(u.skin_id);
  else setActiveSkin(null);
}, [u && u.skin_id]);
```

### B2 — Appliquer sur la div .app

Trouver la ligne qui rend la div principale `.app` :

```js
// Chercher une ligne comme :
<div className="app enter"> ou <div className={lc}>
```

**Si `className` est une string statique :**
```js
// Avant
<div className="app enter">
// Après
<div className={`app enter${activeSkin ? ' skin-' + activeSkin : ''}`}>
```

**Si `lc` est une variable :**
```js
// Trouver où lc est défini, par exemple :
var lc = 'app enter';
// Modifier en :
var lc = 'app enter' + (activeSkin ? ' skin-' + activeSkin : '');
```

### B3 — Appeler setActiveSkin lors de l'équipement

Trouver la fonction qui est appelée quand on clique "Équiper" sur un skin dans Profile.
S'assurer qu'elle appelle `setActiveSkin(skinId)` :

```js
// Dans la fonction d'équipement de skin
async function handleEquipSkin(skinId) {
  // ... logique existante (equipItem, sv, etc.) ...
  setActiveSkin(skinId);  // ← ajouter cette ligne si elle n'y est pas
}

// Pour Remove current skin :
async function handleUnequipSkin() {
  // ... logique existante ...
  setActiveSkin(null);  // ← ajouter cette ligne si elle n'y est pas
}
```

---

## Vérification finale

Après les fixes, tester dans le navigateur :

1. Équiper le skin Jade → la sidebar et les boutons doivent virer au teal/vert
2. Ouvrir DevTools (F12) → Elements → trouver la div `.app`
   → elle doit avoir la classe `skin-jade`
3. Dans DevTools → computed styles de `.app`
   → `--cx` doit valoir `20,180,170`
4. Rafraîchir la page → le skin doit être rechargé depuis Supabase

---

## Ordre d'application recommandé

Si les deux Checks ont échoué → appliquer **Fix A puis Fix B**.
Si seulement Check 2 a échoué → appliquer uniquement **Fix B**.
Si Check 3 a échoué → compléter le Fix B étape B3 uniquement.
