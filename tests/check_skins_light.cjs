/* Skins à cartes sombres en mode clair : le mécanisme « cartes-nuit » de styles/appCss.js.
 *
 * POURQUOI CE TEST EXISTE. 9 skins forcent un fond sombre sur .crd (!important). En clair, la
 * page suit .light et la palette sombre du skin ne doit vivre QUE dans ses cartes. Rien ne casse
 * au build quand ce contrat se perd, et le rendu dépend de l'ordre des règles dans le fichier :
 *   · règle de tokens écrite « .skin-X{…} » et déclarée avant .light → texte sombre sur carte
 *     sombre, illisible (Aurora et Obsidian, jusqu'au 2026-09-16) ;
 *   · la même, déclarée après .light → appli entière sombre avec l'accent, --t3, vert/rouge/or et
 *     --bg*-rgb du clair (les 7 skins du Shop, depuis leur sortie) ;
 *   · un token que .light pose mais ni le skin ni la règle par défaut des cartes → la valeur du
 *     clair fuit dans la carte sombre ;
 *   · .btn2 en couleur claire en dur sur la page crème ;
 *   · fond de carte translucide sans couleur opaque dessous → la page crème délave la carte.
 * Un nouveau skin du Shop qui oublie une seule de ces règles repart en prod illisible pour les
 * élèves en mode clair.
 *
 * Prouvé mordant le 2026-09-16 : « .skin-heraldic{ » rétabli → rouge ; aurore retiré du :where
 * → rouge ; --t3 retiré de la règle par défaut → rouge ; frostbite retiré de la liste .btn2 →
 * rouge ; molten_gold retiré de la règle background-color → rouge.
 *
 * Usage : node tests/check_skins_light.cjs
 */
'use strict';
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { CSS } = require(path.join(ROOT, 'src', 'styles', 'appCss.js'));

let fails = 0, checks = 0;
const fail = (m) => { fails++; console.log('  FAIL ' + m); };
const check = (cond, m) => { checks++; if (!cond) fail(m); };

const lines = CSS.split(/\r?\n/);
const selectorOf = (l) => l.slice(0, l.indexOf('{'));
const bodyOf = (l) => l.slice(l.indexOf('{') + 1, l.lastIndexOf('}'));
const tokensOf = (body) => new Set((body.match(/(^|;)\s*--[\w-]+\s*:/g) || []).map((t) => t.replace(/[;:\s]/g, '')));
// Découpe au niveau 0 des parenthèses (les virgules des gradients ne comptent pas).
const splitTop = (s, sep) => { const out = []; let depth = 0, cur = ''; for (const ch of s) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === sep && depth === 0) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
const declsOf = (body) => { const m = new Map(); for (const d of splitTop(body, ';')) { const i = d.indexOf(':'); if (i > 0) m.set(d.slice(0, i).trim(), d.slice(i + 1).trim()); } return m; };
const colorsIn = (v) => v.match(/rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}\b|\btransparent\b/g) || [];
const opaque = (c) => {
  if (c === 'transparent') return false;
  if (c[0] === '#') return c.length === 4 || c.length === 7;
  const p = c.slice(c.indexOf('(') + 1, -1).split(/[\s,/]+/).filter(Boolean);
  return p.length < 4 || parseFloat(p[3]) >= 1;
};

// ── Quels skins sont concernés ──
const skinIds = [...new Set((CSS.match(/\.skin-[a-z_]+/g) || []).map((s) => s.slice(6)))];
const crdRule = (id) => lines.find((l) => l.startsWith('.skin-' + id + ' .crd{'));
const forcesCardBg = (id) => { const l = crdRule(id); return !!l && /(^|;)\s*background(-color|-image)?\s*:[^;]*!important/.test(bodyOf(l)); };
const tokenRuleLegacy = (id) => lines.find((l) => l.startsWith('.skin-' + id + '{'));
const tokenRuleNight = (id) => lines.find((l) => l.startsWith('.skin-' + id + ':not(.light),.light.skin-' + id + ' .crd{'));
const setsBg2 = (id) => { const l = tokenRuleLegacy(id) || tokenRuleNight(id); return !!l && tokensOf(bodyOf(l)).has('--bg2'); };
const night = skinIds.filter((id) => forcesCardBg(id) || setsBg2(id));
check(night.length > 0, 'aucun skin à cartes sombres trouvé : le test ne lit plus appCss.js correctement');

// ── Les règles partagées du bloc « cartes-nuit » ──
const lightRule = lines.find((l) => l.startsWith('.light{'));
check(!!lightRule, 'règle .light{…} introuvable');
const lightTokens = lightRule ? tokensOf(bodyOf(lightRule)) : new Set();
const defaultsRule = lines.find((l) => l.startsWith('.light:where(') && selectorOf(l).endsWith(') .crd'));
check(!!defaultsRule, 'règle par défaut .light:where(…) .crd{…} introuvable (tokens que les skins ne posent pas, dans la carte)');
const defaultsIds = defaultsRule ? (selectorOf(defaultsRule).match(/\.skin-[a-z_]+/g) || []).map((s) => s.slice(6)) : [];
const defaultsBody = defaultsRule ? bodyOf(defaultsRule) : '';
const defaultsTokens = tokensOf(defaultsBody);
check(/(^|;)\s*color\s*:\s*var\(--t1\)/.test(defaultsBody), 'la règle par défaut des cartes doit poser color:var(--t1) (sinon le texte garde la couleur calculée par .app avec le --t1 clair)');
const selectorsMatching = (sel) => lines.filter((l) => l.includes('{') && splitTop(selectorOf(l), ',').map((s) => s.trim()).includes(sel));

for (const id of night) {
  const tag = 'skin ' + id + ' : ';
  // 1. La palette du skin : page en sombre, cartes seulement en clair.
  check(!tokenRuleLegacy(id), tag + 'règle « .skin-' + id + '{…} » : doit s\'écrire « .skin-' + id + ':not(.light),.light.skin-' + id + ' .crd{…} »');
  const rule = tokenRuleNight(id);
  check(!!rule, tag + 'règle de tokens « .skin-' + id + ':not(.light),.light.skin-' + id + ' .crd{…} » absente');
  // 2. Tout token du clair est reposé dans la carte, par le skin ou par la règle par défaut.
  check(defaultsIds.includes(id), tag + 'absent de .light:where(…) .crd (--t3, vert/rouge/or, --bg*-rgb du clair fuiraient dans la carte)');
  if (rule) {
    const own = tokensOf(bodyOf(rule));
    for (const t of lightTokens) check(own.has(t) || defaultsTokens.has(t), tag + 'le token ' + t + ' de .light n\'est reposé ni par le skin ni par la règle par défaut : la valeur claire fuit dans la carte sombre');
  }
  // 3. .btn2 en couleur claire en dur → illisible sur la page crème.
  const btn2 = lines.find((l) => l.startsWith('.skin-' + id + ' .btn2{'));
  if (btn2 && declsOf(bodyOf(btn2)).has('color')) {
    const fix = selectorsMatching('.light.skin-' + id + ' .btn2').some((l) => /color\s*:\s*var\(--cyan\)\s*!important/.test(bodyOf(l)));
    check(fix, tag + '.btn2 a une couleur en dur : il faut « .light.skin-' + id + ' .btn2{color:var(--cyan)!important} »');
  }
  // 4. Fond de carte translucide : en clair, la page crème passe dessous.
  const crd = crdRule(id);
  if (crd && forcesCardBg(id)) {
    const d = declsOf(bodyOf(crd));
    const strip = (v) => (v || '').replace(/!important/g, '').trim();
    let solid;
    if (d.has('background-color') && colorsIn(strip(d.get('background-color'))).every(opaque)) solid = true;
    else if (d.has('background')) {
      const layers = splitTop(strip(d.get('background')), ',');
      const last = layers[layers.length - 1].trim();
      const lastIsColor = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|transparent)$/.test(last);
      solid = lastIsColor ? opaque(last) : layers.some((ly) => /gradient\(/.test(ly) && colorsIn(ly).length > 0 && colorsIn(ly).every(opaque));
    } else {
      solid = splitTop(strip(d.get('background-image')), ',').some((ly) => /gradient\(/.test(ly) && colorsIn(ly).length > 0 && colorsIn(ly).every(opaque));
    }
    if (!solid) {
      const fix = selectorsMatching('.light.skin-' + id + ' .crd').some((l) => /background-color\s*:[^;]*!important/.test(bodyOf(l)));
      check(fix, tag + 'fond de carte translucide sans couleur opaque : il faut « .light.skin-' + id + ' .crd{background-color:…!important} »');
    }
  }
}

// ── Aucune liste périmée ──
for (const id of defaultsIds) check(night.includes(id), 'skin ' + id + ' listé dans .light:where(…) .crd sans fond de carte sombre ni palette sombre');
for (const id of skinIds) if (!night.includes(id)) check(!tokenRuleNight(id), 'skin ' + id + ' écrit en cartes-nuit sans fond de carte sombre ni palette sombre');

console.log('  ' + checks + ' vérifications sur ' + night.length + ' skins à cartes sombres (' + night.join(', ') + ')');
if (fails) { console.log('\n' + fails + ' problème(s). Rien ne casse au build : les cartes deviennent illisibles pour les élèves en mode clair.'); process.exit(1); }
console.log('  ok');
