/* La CSP garde script-src et style-src sans 'unsafe-inline' (2026-09-30).
 *
 * Pourquoi : supabase-js range la session (access + refresh token) dans le localStorage.
 * Une XSS qui s'exécute dans la page la lit et repart avec le compte. La défense retenue
 * n'est pas de déplacer le jeton (un cookie HttpOnly demanderait un serveur relais pour
 * chaque RPC) mais d'empêcher le script injecté de tourner : script-src 'self' seul.
 * 'unsafe-inline' était là pour UN script inline de index.html (enregistrement du service
 * worker), sorti dans public/sw-register.js.
 *
 * Ce qui casserait en silence :
 *  · un <script> inline remis dans index.html → bloqué par la CSP en prod seulement (le dev
 *    Vite n'envoie pas les en-têtes de vercel.json) : SW jamais enregistré, aucune erreur ;
 *    la tentation serait alors de remettre 'unsafe-inline'.
 *  · 'unsafe-inline', 'unsafe-eval', data:, * ou un hôte tiers dans script-src.
 *  · un dangerouslySetInnerHTML nourri d'autre chose que les chemins SVG statiques
 *    (GAME_ICON_PATHS) : c'est la voie par laquelle un nom d'élève deviendrait du HTML.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const fail = [];

// 1. L'en-tête CSP de vercel.json
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
let csp = null;
for (const block of vercel.headers || []) {
  for (const h of block.headers || []) if (h.key.toLowerCase() === 'content-security-policy') csp = h.value;
}
if (!csp) fail.push('vercel.json : aucun en-tête Content-Security-Policy');
else {
  const dirs = {};
  for (const part of csp.split(';')) {
    const toks = part.trim().split(/\s+/).filter(Boolean);
    if (toks.length) dirs[toks[0]] = toks.slice(1);
  }
  // style-src au même régime depuis le 2026-09-30 : tout le CSS est en fichiers .css.
  for (const d of ['script-src', 'style-src']) {
    const list = dirs[d] || dirs['default-src'];
    if (!list) { fail.push('CSP : ni ' + d + ' ni default-src'); continue; }
    for (const t of list) {
      if (t !== "'self'" && !/^'(sha256|sha384|sha512)-[A-Za-z0-9+/=]+'$/.test(t))
        fail.push('CSP ' + d + ' : source refusée ' + t + " (seuls 'self' et des hashes sont admis)");
    }
  }
  for (const [d, want] of [['object-src', "'none'"], ['base-uri', "'self'"], ['frame-ancestors', "'none'"]]) {
    if (!dirs[d] || dirs[d].join(' ') !== want) fail.push('CSP ' + d + ' doit valoir ' + want);
  }
}

// 2. Aucun script inline ni gestionnaire on* dans index.html
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scriptTags = html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || [];
for (const tag of scriptTags) {
  const open = tag.match(/<script\b[^>]*>/i)[0];
  const body = tag.slice(open.length, -'</script>'.length);
  if (!/\bsrc\s*=/.test(open) || body.trim()) fail.push('index.html : script inline ' + open);
}
if (/<style\b/i.test(html)) fail.push('index.html : <style> inline (bloqué par style-src, le mettre dans src/styles/app.css)');
if (/\sstyle\s*=/i.test(html)) fail.push('index.html : attribut style="…" (bloqué par style-src)');
const onAttr = html.match(/<[^>]+\son[a-z]+\s*=/gi);
if (onAttr) fail.push('index.html : gestionnaire inline ' + onAttr[0]);
if (html.indexOf('/sw-register.js') === -1) fail.push('index.html : /sw-register.js n\'est plus chargé (service worker jamais enregistré)');
if (!fs.existsSync(path.join(root, 'public', 'sw-register.js'))) fail.push('public/sw-register.js manquant');
if (!fs.existsSync(path.join(root, 'public', 'grimoire-export.css'))) fail.push('public/grimoire-export.css manquant (export des grimoires sans styles)');

// 3. dangerouslySetInnerHTML : seulement les chemins SVG statiques
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(jsx?|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}
for (const file of walk(path.join(root, 'src'), [])) {
  const src = fs.readFileSync(file, 'utf8');
  // 4. Aucun gestionnaire on* dans du HTML écrit en chaîne (export du grimoire : sa fenêtre
  //    about:blank hérite de la CSP, un onclick="…" y est bloqué en silence). Le JSX écrit
  //    onClick={…}, jamais on<minuscules>= suivi d'un guillemet.
  const handler = src.match(/\son[a-z]+=(\\"|\\'|')/);
  if (handler) fail.push(path.relative(root, file).replace(/\\/g, '/') + ' : gestionnaire inline dans une chaîne HTML (' + handler[0].trim() + '…), à câbler par addEventListener');
  // 5. Aucun <style> (JSX ou chaîne HTML) ni style="…" dans une chaîne HTML : bloqués par
  //    style-src 'self', en prod seulement. Les style={{…}} de React passent par le CSSOM : permis.
  const relf = path.relative(root, file).replace(/\\/g, '/');
  if (/<style\b/.test(src)) fail.push(relf + ' : <style> (bloqué par la CSP style-src) : vrai fichier .css importé, ou public/ pour une page écrite en chaîne');
  const sattr = src.match(/\sstyle=(\\"|\\'|')/);
  if (sattr) fail.push(relf + ' : attribut style="…" dans une chaîne HTML (bloqué par la CSP style-src) : classe + feuille .css');
  const re = /dangerouslySetInnerHTML=\{\{__html:\s*([^}]+?)\s*\}\}/g;
  let m;
  while ((m = re.exec(src))) {
    const expr = m[1];
    const rel = path.relative(root, file).replace(/\\/g, '/');
    if (/^GAME_ICON_PATHS\[[^\]]+\](\|\|"")?$/.test(expr)) continue;
    const id = expr.match(/^([A-Za-z_$][\w$]*)$/);
    if (id && new RegExp('\\b' + id[1] + '\\s*=\\s*GAME_ICON_PATHS\\[[^\\]]+\\](\\|\\|"")?\\s*;').test(src)) continue;
    fail.push(rel + ' : dangerouslySetInnerHTML nourri de « ' + expr + ' » (seuls les chemins GAME_ICON_PATHS sont admis)');
  }
}

if (fail.length) {
  console.error('check_csp : ' + fail.length + ' problème(s)');
  for (const f of fail) console.error('  · ' + f);
  process.exit(1);
}
console.log('check_csp : script-src et style-src sans inline, ni <style> ni script inline, innerHTML limité aux icônes');
