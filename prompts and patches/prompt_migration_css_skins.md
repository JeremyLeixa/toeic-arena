# Prompt Claude Code — Tâche 2
## Migration CSS skins cosmétiques

---

## Contexte

Les skins cosmétiques ne fonctionnent pas car :
1. Les variables CSS `--cx`, `--cx-hex`, `--cx-dark` n'existent pas encore
2. Les classes `.skin-{id}` ne sont pas définies dans App.jsx
3. Les 88 couleurs hardcodées `rgba(212,148,58,X)` et `#d4943a` ne réagissent
   pas aux changements de variables CSS

Cette tâche effectue la migration complète en deux parties :
- Un script Node.js qui modifie App.jsx
- Des ajouts manuels dans le bloc CSS de App.jsx

---

## Partie A — Script Node.js de migration

Créer le fichier `migrate-skins.cjs` à la racine du projet :

```js
// migrate-skins.cjs
// Exécuter : node migrate-skins.cjs
// Modifie App.jsx pour rendre les couleurs d'accent dynamiques via CSS variables

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// ── 1. Remplacer rgba(212,148,58,X) par rgba(var(--cx),X) ──
// Couvre toutes les variantes d'opacité : .03 .04 .06 .08 .1 .12 .15 .18 .2 .25 .3
content = content.replace(/rgba\(212,148,58,([^)]+)\)/g, 'rgba(var(--cx),$1)');

// Variante avec espaces (au cas où)
content = content.replace(/rgba\(212, 148, 58, ([^)]+)\)/g, 'rgba(var(--cx),$1)');

// Variante 0.18 et 0.3 avec zéro explicite
content = content.replace(/rgba\(212,148,58,0\.([0-9]+)\)/g, 'rgba(var(--cx),0.$1)');

// ── 2. Remplacer #d4943a dans les gradients par var(--cx-hex) ──
// Uniquement dans les contextes gradient et background (pas dans :root ni .skin-xxx)
// On protège la ligne :root en ne remplaçant que hors de cette ligne
const lines = content.split('\n');
const updatedLines = lines.map(function(line) {
  // Ne pas toucher aux lignes qui définissent les variables CSS elles-mêmes
  if (line.includes(':root{') || line.includes('.light{') || line.includes('.skin-')) {
    return line;
  }
  // Remplacer #d4943a dans les gradients
  line = line.replace(/linear-gradient\(([^)]*?)#d4943a([^)]*?)\)/g, function(match, before, after) {
    return 'linear-gradient(' + before + 'var(--cx-hex)' + after + ')';
  });
  // Remplacer #a06e20 (dark du gold par défaut) dans les gradients
  line = line.replace(/linear-gradient\(([^)]*?)#a06e20([^)]*?)\)/g, function(match, before, after) {
    return 'linear-gradient(' + before + 'var(--cx-dark)' + after + ')';
  });
  return line;
});
content = updatedLines.join('\n');

// ── 3. Remplacer #d4943a standalone (hors gradient, hors :root) ──
// Pour les occurrences directes comme color:"#d4943a" ou stroke="#d4943a"
const lines2 = content.split('\n');
const updatedLines2 = lines2.map(function(line) {
  if (line.includes(':root{') || line.includes('.light{') || line.includes('.skin-')) {
    return line;
  }
  // Remplacer les occurrences directes de #d4943a (hors déjà remplacées dans gradient)
  line = line.replace(/"#d4943a"/g, '"var(--cx-hex)"');
  line = line.replace(/'#d4943a'/g, "'var(--cx-hex)'");
  return line;
});
content = updatedLines2.join('\n');

// Sauvegarder
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Migration CSS skins terminée.');
console.log('   Vérifier App.jsx avec : grep -c "rgba(212,148,58" App.jsx');
console.log('   Résultat attendu : 0');
```

**Exécuter le script :**
```bash
node migrate-skins.cjs
```

Vérifier que le résultat est 0 occurrence restante :
```bash
grep -c "rgba(212,148,58" App.jsx
```

---

## Partie B — Ajouts manuels dans le bloc CSS de App.jsx

Localiser le bloc `var CSS = \`...\`` dans App.jsx.

### B1 — Modifier la ligne `:root{...}` (ligne ~479)

Ajouter les 3 nouvelles variables à la fin de `:root` :

**Avant :**
```
:root{--bg:#0f0c08;--bg2:#1a1610;--bg3:#28221a;--bdr:rgba(180,140,80,0.08);--cyan:#d4943a;--orange:#c87a35;--gold:#f0c850;--green:#4abe60;--red:#e05252;--purple:#8b5e83;--t1:#ede4d4;--t2:#8a7e6a;--t3:#5a5040}
```

**Après :**
```
:root{--bg:#0f0c08;--bg2:#1a1610;--bg3:#28221a;--bdr:rgba(180,140,80,0.08);--cyan:#d4943a;--orange:#c87a35;--gold:#f0c850;--green:#4abe60;--red:#e05252;--purple:#8b5e83;--t1:#ede4d4;--t2:#8a7e6a;--t3:#5a5040;--cx:212,148,58;--cx-hex:#d4943a;--cx-dark:#a06e20}
```

### B2 — Modifier la ligne `.light{...}` (ligne ~480)

**Avant :**
```
.light{--bg:#f5f0e8;--bg2:#fffcf5;--bg3:#e8e0d2;--bdr:rgba(120,90,50,0.1);--cyan:#8b6914;--orange:#a05a10;--gold:#a67c00;--green:#15803d;--red:#b82020;--purple:#6b3d62;--t1:#1a1510;--t2:#5a5040;--t3:#8a7e6a}
```

**Après :**
```
.light{--bg:#f5f0e8;--bg2:#fffcf5;--bg3:#e8e0d2;--bdr:rgba(120,90,50,0.1);--cyan:#8b6914;--orange:#a05a10;--gold:#a67c00;--green:#15803d;--red:#b82020;--purple:#6b3d62;--t1:#1a1510;--t2:#5a5040;--t3:#8a7e6a;--cx:139,105,20;--cx-hex:#8b6914;--cx-dark:#6a4e10}
```

### B3 — Ajouter les classes de skins après la ligne `.light{...}`

Ajouter ce bloc entier juste après la ligne `.light{...}` :

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

### B4 — Mettre à jour .btn1 et .glo dans le CSS

Localiser et remplacer ces deux lignes dans le CSS :

```css
/* .glo — avant */
.glo{box-shadow:0 0 30px rgba(212,148,58,.06)}
/* .glo — après */
.glo{box-shadow:0 0 30px rgba(var(--cx),.06)}

/* .btn1 — avant */
.btn1{background:linear-gradient(135deg,#d4943a,#a06e20);...}
/* .btn1 — après */
.btn1{background:linear-gradient(135deg,var(--cx-hex),var(--cx-dark));...}
```

---

## Vérification

Après avoir exécuté le script et fait les ajouts manuels :

```bash
# Doit retourner 0
grep -c "rgba(212,148,58" App.jsx

# Doit retourner les lignes de définition des variables (et non des usages)
grep -n "\-\-cx:" App.jsx | head -5

# Build propre
npm run build
```

---

## Ne pas modifier

- Les valeurs `#8b5e83` (purple), `#4abe60` (green), `#e05252` (red) — ce sont
  des couleurs fixes indépendantes du skin
- Les couleurs de background `--bg`, `--bg2`, `--bg3` — non modifiées par les skins Rares
- Les assets audio, les données de jeu, la logique Supabase
