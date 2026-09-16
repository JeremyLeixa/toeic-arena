/* Thèmes saisonniers (festivals) : le moteur de dates de src/lib/festivals.js.
 *
 * POURQUOI CE TEST EXISTE. Une fête décide de la classe posée sur la racine `.app` : elle
 * remplace le skin équipé de TOUS les élèves pendant sa fenêtre. Une borne décalée d'un jour,
 * un Pâques faux ou deux fenêtres qui se chevauchent ne cassent ni le build ni l'exécution :
 * le thème arrive un jour trop tôt, ne part jamais, ou la mauvaise fête gagne. Et un opt-out
 * que le forçage contourne rend le « Turn off » inopérant. Ce test fige :
 *   · la forme de FESTIVALS (ids uniques, dates valides, icône qui existe vraiment) ;
 *   · le CSS : un paquet .fest-<id> ET un retint .light.fest-<id> par fête, aucune classe
 *     .fest-* orpheline, chaque animation utilisée a son @keyframes ;
 *   · la barre d'état : themeColor = --bg du paquet CSS, défaut = --bg de :root / .light, et
 *     applyThemeColor écrit sur TOUTES les meta theme-color ;
 *   · Pâques (Meeus) sur des années connues ;
 *   · la disjonction des fenêtres, jour par jour, sur 21 ans ;
 *   · les bornes incluses, en heure LOCALE, et le chevauchement déc → jan ;
 *   · l'occurrence (en cours ou prochaine), les jours restants, le format de date ;
 *   · l'ordre de priorité : opt-out > forçage (URL > localStorage) > dates.
 *
 * Prouvé mordant le 2026-09-16 : `+114` → `+113` dans easterDate → rouge ; `occ.end>=day` →
 * `occ.end>day` → rouge (bornes de fin) ; une 5ᵉ fête 10-30 → 11-05 → rouge (chevauchement) ;
 * appliedFestivalId qui ignore festivalsEnabled → rouge (opt-out). CSS : ligne
 * `.light.fest-spring{…}` retirée → rouge ; `skCandle` → `skCandel` → rouge ; `.fest-yuel` → rouge.
 * Barre d'état : themeColor halloween décalé d'un chiffre → rouge ; applyThemeColor qui n'écrit
 * que la première meta → rouge.
 *
 * Usage : node tests/check_festivals.cjs
 */
'use strict';
const path = require('path');

const ROOT = path.join(__dirname, '..');
const F = require(path.join(ROOT, 'src', 'lib', 'festivals.js'));
const { GAME_ICON_PATHS } = require(path.join(ROOT, 'src', 'data', 'avatarIcons.js'));
const { CSS } = require(path.join(ROOT, 'src', 'styles', 'appCss.js'));

let fails = 0, checks = 0;
const fail = (m) => { fails++; console.log('  FAIL ' + m); };
const check = (cond, m) => { checks++; if (!cond) fail(m); };
const D = (y, m, d, h, mi) => new Date(y, m - 1, d, h || 0, mi || 0);
const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const active = (y, m, d, h, mi) => { const f = F.activeFestival(D(y, m, d, h, mi)); return f ? f.id : null; };

// ── Forme ──
const MMDD = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
check(new Set(F.FESTIVALS.map((f) => f.id)).size === F.FESTIVALS.length, 'deux fêtes partagent un id');
for (const f of F.FESTIVALS) {
  check(/^[a-z_]+$/.test(f.id), f.id + ' : id hors [a-z_] (il devient une classe CSS fest-<id>)');
  check(f.name && f.greeting && f.icon, f.id + ' : name, greeting ou icon manquant');
  check(!!GAME_ICON_PATHS[f.icon], f.id + ' : icône « ' + f.icon + ' » absente de GAME_ICON_PATHS (le bandeau rendrait un vide)');
  if (f.easter) {
    check(Array.isArray(f.easter) && f.easter.length === 2 && f.easter[0] <= f.easter[1], f.id + ' : easter doit être [début, fin] avec début ≤ fin');
    check(!f.from && !f.to, f.id + ' : easter ET from/to');
  } else {
    check(MMDD.test(f.from || '') && MMDD.test(f.to || ''), f.id + ' : from/to doivent être en MM-DD (' + f.from + ' → ' + f.to + ')');
  }
}

// ── CSS : chaque fête a ses paquets, et rien d'autre ne s'appelle .fest-* ──
// App.jsx pose `fest-<id>` pour tout id de FESTIVALS : sans paquet, l'élève perd son skin ET
// n'a aucun thème (retour au canonique, en silence). Sans retint .light, les tokens sombres
// de la fête restent en mode clair.
const cssLines = CSS.split(/\r?\n/);
const ids = new Set(F.FESTIVALS.map((f) => f.id));
for (const f of F.FESTIVALS) {
  check(cssLines.some((l) => l.startsWith('.fest-' + f.id + '{')), f.id + ' : paquet .fest-' + f.id + '{…} absent de styles/appCss.js');
  check(cssLines.some((l) => l.startsWith('.light.fest-' + f.id + '{')), f.id + ' : retint .light.fest-' + f.id + '{…} absent de styles/appCss.js');
}
for (const m of new Set(CSS.match(/\.fest-[a-z_]+/g) || [])) {
  check(ids.has(m.slice(6)), 'classe ' + m + ' dans appCss.js sans fête correspondante dans FESTIVALS (jamais posée)');
}
// Un nom d'animation fautif ne casse rien : l'animation est juste morte.
const keyframes = new Set((CSS.match(/@keyframes\s+[\w-]+/g) || []).map((k) => k.split(/\s+/)[1]));
for (const line of cssLines.filter((l) => /^(\.light)?\.fest-/.test(l))) {
  for (const decl of line.match(/animation:[^;}]+/g) || []) {
    for (const part of decl.slice('animation:'.length).replace(/!important/g, '').split(',')) {
      const name = part.trim().split(/\s+/)[0];
      check(keyframes.has(name), 'animation « ' + name + ' » utilisée par ' + line.slice(0, line.indexOf('{')) + ' sans @keyframes');
    }
  }
}

// ── Barre d'état : themeColor recopie le --bg du CSS ──
// La meta theme-color ne lit pas le CSS : une palette retouchée sans recopier la couleur donnerait
// une barre d'état d'une autre teinte que l'app, sans rien casser.
const bgOf = (prefix) => { const l = cssLines.find((x) => x.startsWith(prefix)); const m = l && /--bg:(#[0-9a-fA-F]{3,8})/.exec(l); return m ? m[1].toLowerCase() : null; };
for (const f of F.FESTIVALS) {
  const dark = bgOf('.fest-' + f.id + '{'), light = bgOf('.light.fest-' + f.id + '{');
  check(f.themeColor && f.themeColor.dark === dark, f.id + ' : themeColor.dark ' + (f.themeColor && f.themeColor.dark) + ' ≠ --bg de .fest-' + f.id + ' (' + dark + ')');
  check(f.themeColor && f.themeColor.light === light, f.id + ' : themeColor.light ' + (f.themeColor && f.themeColor.light) + ' ≠ --bg de .light.fest-' + f.id + ' (' + light + ')');
}
check(F.DEFAULT_THEME_COLOR.dark === bgOf(':root{'), 'DEFAULT_THEME_COLOR.dark ≠ --bg de :root (' + bgOf(':root{') + ')');
check(F.DEFAULT_THEME_COLOR.light === bgOf('.light{'), 'DEFAULT_THEME_COLOR.light ≠ --bg de .light (' + bgOf('.light{') + ')');
{
  const metas = [0, 1, 2].map(() => ({ content: '#0f0c08', setAttribute(k, v) { if (k === 'content') this.content = v; } }));
  globalThis.document = { querySelectorAll: (sel) => (sel === 'meta[name="theme-color"]' ? metas : []) };
  F.applyThemeColor('yule', false);
  check(metas.every((m) => m.content === '#06110b'), 'applyThemeColor(yule, sombre) doit poser #06110b sur les 3 meta theme-color');
  F.applyThemeColor('spring', true);
  check(metas.every((m) => m.content === '#fbf6f8'), 'applyThemeColor(spring, clair) doit poser #fbf6f8 sur les 3 meta');
  F.applyThemeColor(null, true);
  check(metas.every((m) => m.content === F.DEFAULT_THEME_COLOR.light), 'applyThemeColor(null, clair) doit revenir à la couleur .light');
  F.applyThemeColor(null, false);
  check(metas.every((m) => m.content === '#0f0c08'), 'applyThemeColor(null, sombre) doit revenir à #0f0c08');
  delete globalThis.document;
}

// ── Pâques ──
for (const [y, want] of [[2025, '2025-04-20'], [2026, '2026-04-05'], [2027, '2027-03-28'], [2028, '2028-04-16'], [2038, '2038-04-25']]) {
  check(iso(F.easterDate(y)) === want, 'Pâques ' + y + ' : ' + iso(F.easterDate(y)) + ' au lieu de ' + want);
}

// ── Disjonction, jour par jour ──
let overlaps = 0;
for (let d = D(2025, 1, 1); d <= D(2045, 12, 31); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
  const hits = F.FESTIVALS.filter((f) => F.inFestivalWindow(f, d)).map((f) => f.id);
  if (hits.length > 1) { if (overlaps++ < 5) fail(iso(d) + ' : plusieurs fêtes actives (' + hits.join(', ') + ')'); }
}
checks++;

// ── Bornes incluses, heure locale ──
check(active(2026, 10, 23, 23, 59) === null, '23/10 23:59 : aucune fête attendue');
check(active(2026, 10, 24) === 'halloween', '24/10 00:00 : halloween attendu (borne de début incluse)');
check(active(2026, 11, 2, 23, 59) === 'halloween', '2/11 23:59 : halloween attendu (borne de fin incluse)');
check(active(2026, 11, 3) === null, '3/11 00:00 : aucune fête attendue');
check(active(2027, 6, 18, 23, 59) === null, '18/6 : aucune fête attendue');
check(active(2027, 6, 19) === 'solstice', '19/6 : solstice attendu');
check(active(2027, 6, 28, 23, 59) === 'solstice', '28/6 : solstice attendu');
check(active(2027, 6, 29) === null, '29/6 : aucune fête attendue');
// Pâques 2027 = 28/3 → fenêtre 23/3 → 29/3
check(active(2027, 3, 22, 23, 59) === null, '22/3/2027 : aucune fête attendue');
check(active(2027, 3, 23) === 'spring', '23/3/2027 : spring attendu (Pâques −5)');
check(active(2027, 3, 29, 23, 59) === 'spring', '29/3/2027 : spring attendu (Pâques +1)');
check(active(2027, 3, 30) === null, '30/3/2027 : aucune fête attendue');

// ── Chevauchement déc → jan ──
check(active(2026, 12, 13, 23, 59) === null, '13/12 : aucune fête attendue');
check(active(2026, 12, 14) === 'yule', '14/12 : yule attendu');
check(active(2026, 12, 31) === 'yule', '31/12 : yule attendu');
check(active(2027, 1, 2) === 'yule', '2/1 : yule attendu (fenêtre à cheval sur l\'an)');
check(active(2027, 1, 4, 23, 59) === 'yule', '4/1 23:59 : yule attendu');
check(active(2027, 1, 5) === null, '5/1 : aucune fête attendue');

// ── Occurrence, jours restants, format ──
const occYule = F.festivalOccurrence('yule', D(2027, 1, 2));
check(occYule && iso(occYule.start) === '2026-12-14' && iso(occYule.end) === '2027-01-04', 'occurrence yule du 2/1/2027 : ' + (occYule && iso(occYule.start) + ' → ' + iso(occYule.end)) + ' au lieu de 2026-12-14 → 2027-01-04');
const occNext = F.festivalOccurrence('halloween', D(2026, 9, 16));
check(occNext && iso(occNext.start) === '2026-10-24' && iso(occNext.end) === '2026-11-02', 'hors fenêtre, halloween doit donner la prochaine occurrence (2026-10-24 → 2026-11-02)');
const occAfter = F.festivalOccurrence('halloween', D(2026, 11, 10));
check(occAfter && iso(occAfter.start) === '2027-10-24', 'après la fenêtre, halloween doit donner l\'occurrence 2027');
check(F.festivalDaysLeft('halloween', D(2026, 10, 30, 18)) === 3, 'jours restants le 30/10 : ' + F.festivalDaysLeft('halloween', D(2026, 10, 30, 18)) + ' au lieu de 3');
check(F.festivalDaysLeft('halloween', D(2026, 11, 2, 22)) === 0, 'jours restants le dernier jour : 0 attendu');
check(F.festivalDaysLeft('yule', D(2026, 12, 20)) === 15, 'jours restants yule le 20/12 : ' + F.festivalDaysLeft('yule', D(2026, 12, 20)) + ' au lieu de 15');
check(F.formatFestivalDate(D(2026, 11, 2)) === 'Nov 2', 'formatFestivalDate(2/11) : « ' + F.formatFestivalDate(D(2026, 11, 2)) + ' » au lieu de « Nov 2 »');
check(F.festivalById('nope') === null, 'festivalById d\'un id inconnu doit renvoyer null');

// ── Priorité : opt-out > forçage (URL > localStorage) > dates ──
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
globalThis.window = { location: { search: '' } };
const inWindow = D(2026, 10, 25), offSeason = D(2026, 9, 16);
const setUrl = (s) => { globalThis.window.location.search = s; };

check(F.festivalsEnabled() === true, 'activé par défaut attendu');
check(F.appliedFestivalId(inWindow) === 'halloween', 'le 25/10, halloween doit être appliqué par défaut');
check(F.appliedFestivalId(offSeason) === null, 'hors fenêtre, aucune fête par défaut');
setUrl('?fest=yule');
check(F.appliedFestivalId(offSeason) === 'yule', '?fest=yule doit forcer yule hors fenêtre');
setUrl('?fest=none');
check(F.appliedFestivalId(inWindow) === null, '?fest=none doit retirer la fête pendant une vraie fenêtre');
setUrl('?fest=bogus');
check(F.appliedFestivalId(inWindow) === 'halloween', '?fest=<inconnu> doit être ignoré (retour aux dates)');
setUrl('');
store.set('toeic-fest-force', 'spring');
check(F.appliedFestivalId(offSeason) === 'spring', 'toeic-fest-force=spring doit forcer spring');
setUrl('?fest=solstice');
check(F.appliedFestivalId(offSeason) === 'solstice', 'l\'URL doit l\'emporter sur localStorage');
F.setFestivalsEnabled(false);
check(F.festivalsEnabled() === false, 'setFestivalsEnabled(false) doit persister');
check(F.appliedFestivalId(offSeason) === null, 'l\'opt-out doit l\'emporter sur le forçage URL');
check(F.windowFestivalId(offSeason) === 'solstice', 'windowFestivalId ignore l\'opt-out (le Profil affiche la fête désactivée)');
setUrl(''); store.delete('toeic-fest-force');
check(F.appliedFestivalId(inWindow) === null, 'l\'opt-out doit l\'emporter sur les dates');
check(F.windowFestivalId(inWindow) === 'halloween', 'windowFestivalId doit rester halloween le 25/10 malgré l\'opt-out');
F.setFestivalsEnabled(true);
check(F.appliedFestivalId(inWindow) === 'halloween', 'setFestivalsEnabled(true) doit rétablir la fête');
delete globalThis.localStorage; delete globalThis.window;

console.log('  ' + checks + ' vérifications sur ' + F.FESTIVALS.length + ' fêtes (' + F.FESTIVALS.map((f) => f.id).join(', ') + ')');
if (fails) { console.log('\n' + fails + ' problème(s). Une fenêtre fausse ne casse pas le build : elle change le thème de tous les élèves.'); process.exit(1); }
console.log('  ok');
