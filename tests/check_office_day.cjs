/* Nine to Five (hub The Waygates, 2026-09-24) : la journée de bureau (src/lib/officeDay.js).
 *
 * POURQUOI CE TEST EXISTE. La journée est COMPOSÉE au hasard à chaque partie, depuis les banques
 * P3, P4 et P7. Un tirage raté ne casse rien au build : un direct qui sonne encore à 17:00 (manqué
 * d'office), un document dû avant son arrivée (en retard avant d'être ouvert), un passage triple
 * servi à un Intern, deux fois le même item dans la journée, un sujet de conversation qui trahit la
 * réponse à la Q1. On tire donc des centaines de journées par grade et on vérifie chacune. Le reste
 * protège les règles du produit : horloge plus clémente en bas (choix de Jérémy), réputation qui ne
 * baisse jamais et bornée, XP au palier des modules à 15 Q.
 */
'use strict';
const path = require('path');
const fs0 = require('fs');
const ROOT = path.join(__dirname, '..');
const L = require(path.join(ROOT, 'src', 'lib', 'officeDay.js'));
const { LISTENING_P3, LISTENING_P4 } = require(path.join(ROOT, 'src', 'data', 'listening.js'));
const { PART7_PASSAGES } = require(path.join(ROOT, 'src', 'data', 'part7.js'));

let fails = 0, checks = 0;
function ok(cond, label) { checks++; if (!cond) { fails++; if (fails <= 25) console.log('  FAIL ' + label); } }

// Générateur reproductible (mulberry32) : un échec se rejoue.
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const BANK = { p7: PART7_PASSAGES, lisP3: LISTENING_P3, lisP4: LISTENING_P4 };
const P3_SUBJECTS = new Set(['A conversation at the coffee machine', 'A call on speaker', 'A quick meeting']);

// ── 1. Grades : ordonnés, et l'horloge ne fait que se durcir en montant ─────────────────────────
const G = L.GRADES;
for (let i = 1; i < G.length; i++) {
  ok(G[i].rep > G[i - 1].rep, 'grades : seuils croissants (' + G[i].id + ')');
  ok(G[i].speed >= G[i - 1].speed, 'grades : horloge jamais plus clémente en montant (' + G[i].id + ')');
  ok(G[i].ringFor <= G[i - 1].ringFor, 'grades : sonnerie jamais plus longue en montant (' + G[i].id + ')');
  ok(G[i].tasks >= G[i - 1].tasks, 'grades : jamais moins de tâches en montant (' + G[i].id + ')');
  ok(G[i].multi >= G[i - 1].multi, 'grades : un format débloqué ne se reverrouille pas (' + G[i].id + ')');
}
ok(G[0].rep === 0, 'grades : on commence Intern à 0');
ok(G[0].speed <= 0.6 && G[0].ringFor >= 45, 'grades : horloge clémente pour l\'Intern (≤ 0,6 min de jeu/s, sonnerie ≥ 45 min)');
ok(L.gradeOf(0).id === 'intern' && L.gradeOf(99).id === 'intern' && L.gradeOf(100).id === 'junior' && L.gradeOf(99999).id === 'director', 'gradeOf : seuils');
ok(L.gradeOf(undefined).id === 'intern', 'gradeOf : profil sans réputation = Intern');
ok(L.nextGrade(0).id === 'junior' && L.nextGrade(2200) === null, 'nextGrade : suivant, et rien après Director');

// ── 2. Journées tirées : 400 par grade ────────────────────────────────────────────────────────
let multiSeen = {}, liveP4 = 0, recP4 = 0;
G.forEach(function (g, gi) {
  for (let s = 0; s < 400; s++) {
    const d = L.composeDay(g.rep, rng(1000 * gi + s + 1));
    const tag = g.id + '#' + s;
    ok(d.grade.id === g.id, tag + ' : grade');
    ok(d.tasks.length === g.tasks, tag + ' : ' + g.tasks + ' tâches (' + d.tasks.length + ')');
    ok(typeof d.brief === 'string' && d.brief.length > 20 && d.brief.indexOf('undefined') < 0, tag + ' : brief');
    const ids = new Set();
    let firstDocs = 0, lvlMax = 0;
    d.tasks.forEach(function (t, i) {
      ok(t.id === 't' + (i + 1), tag + ' : ids t1..tn dans l\'ordre');
      ok(!ids.has(t.mod + ':' + t.itemId), tag + ' : item en double ' + t.itemId);
      ids.add(t.mod + ':' + t.itemId);
      const it = (BANK[t.mod] || []).find(function (x) { return x.id === t.itemId; });
      ok(!!it, tag + ' : item introuvable ' + t.mod + ':' + t.itemId);
      ok(t.from && t.subject && t.ask && t.ask.text && t.kind, tag + ' : habillage complet ' + t.itemId);
      ok([t.from, t.subject, t.ask.text].join(' ').indexOf('undefined') < 0, tag + ' : pas de « undefined » affiché');
      ok(t.at >= 0 && t.at < L.DAY_LEN, tag + ' : arrivée dans la journée ' + t.itemId);
      if (i > 0) ok(t.at >= d.tasks[i - 1].at, tag + ' : tâches triées par arrivée');
      if (t.live) {
        ok(t.ringFor === g.ringFor && t.due == null, tag + ' : direct = sonnerie du grade, sans échéance');
        ok(t.at + t.ringFor <= L.DAY_LEN, tag + ' : un direct finit de sonner avant 17:00 (' + L.fmtClock(t.at) + ' + ' + t.ringFor + ')');
      } else {
        ok(t.ringFor == null, tag + ' : pas de sonnerie hors direct');
        ok(t.due == null || (t.due > t.at + 60 && t.due <= L.DAY_LEN), tag + ' : échéance après l\'arrivée et avant 17:00');
      }
      if (t.mod === 'p7') {
        ok(!t.live, tag + ' : un document n\'est jamais un direct');
        const lvl = L.p7Level(it.type);
        lvlMax = Math.max(lvlMax, lvl);
        ok(lvl <= Math.max(1, g.multi), tag + ' : format P7 débloqué au grade (' + it.type + ')');
        if (t.at === 0) firstDocs++;
      }
      if (t.mod === 'lisP3') {
        ok(t.live, tag + ' : une conversation est un direct');
        ok(P3_SUBJECTS.has(t.subject), tag + ' : sujet de P3 générique (ne trahit pas la Q1) : ' + t.subject);
      }
      if (t.mod === 'lisP4') { if (t.live) liveP4++; else recP4++; ok(t.kind === (t.live ? 'live' : 'voicemail'), tag + ' : P4 direct ou messagerie'); }
    });
    ok(firstDocs === 2, tag + ' : deux documents sur le bureau à 9:00');
    if (g.multi >= 2) { ok(lvlMax === g.multi, tag + ' : le format débloqué au grade apparaît chaque jour'); multiSeen[g.multi] = true; }
  }
});
ok(multiSeen[2] && multiSeen[3], 'doubles et triples servis aux grades qui les débloquent');
ok(liveP4 > 0 && recP4 > 0, 'Part 4 : des directs ET des messages (' + liveP4 + ' / ' + recP4 + ')');

// ── 2b. Jet Lag (monde voyage, 2026-09-25) : 400 journées par grade ─────────────────────────────
// Le vivier est celui qu'a relu Jérémy : rien d'autre n'y entre. Bulletin à 9:00 (la règle « prévu = paré » en dépend),
// une seule perturbation, jamais avant 10:00, habillage générique (« Where does the conversation take place? »).
const TP = L.TRAVEL_POOL;
ok(TP && TP.p3 && TP.p7 && TP.forecast && TP.disruption, 'Jet Lag : vivier déclaré (TRAVEL_POOL)');
[['p3', TP.p3, LISTENING_P3], ['p7', TP.p7, PART7_PASSAGES], ['disruption', TP.disruption, LISTENING_P4], ['forecast', Object.keys(TP.forecast), LISTENING_P4]].forEach(function (x) {
  x[1].forEach(function (id) { ok(x[2].some(function (it) { return it.id === id; }), 'Jet Lag : ' + x[0] + ' ' + id + ' existe dans la banque'); });
});
Object.keys(TP.forecast).forEach(function (id) { ok(LISTENING_P4.find(function (it) { return it.id === id; }).type === 'Weather report', 'Jet Lag : ' + id + ' est bien un bulletin météo'); });
const TRAVEL_IDS = new Set([].concat(TP.p3, TP.p7, TP.disruption, Object.keys(TP.forecast)));
const TRAVEL_SUBJECTS = new Set(['A conversation nearby', 'A phone call', "Today's weather", 'An announcement for passengers']);
G.forEach(function (g, gi) {
  for (let s = 0; s < 400; s++) {
    const d = L.composeDay(g.rep, rng(90000 + 1000 * gi + s), 'travel');
    const tag = 'travel ' + g.id + '#' + s;
    ok(d.tasks.length === g.tasks, tag + ' : ' + g.tasks + ' tâches (' + d.tasks.length + ')');
    ok(typeof d.brief === 'string' && d.brief.indexOf('undefined') < 0 && /weather/.test(d.brief), tag + ' : brief qui annonce le bulletin');
    const fc = d.tasks.filter(function (t) { return t.prep; }), hit = d.tasks.filter(function (t) { return t.prepHit; });
    ok(fc.length === 1 && fc[0].at === 0 && fc[0].live && fc[0].prepLabel && fc[0].kind === 'forecast', tag + ' : un bulletin, en direct à 9:00, avec son étiquette');
    ok(hit.length === 1 && hit[0].live && hit[0].at >= 60, tag + ' : une seule perturbation, jamais avant 10:00');
    ok(hit.length === 1 && d.tasks.some(function (t) { return t.mod === 'lisP3' && t.at < hit[0].at; }), tag + ' : au moins une conversation avant la perturbation (le temps d\'écouter le bulletin)');
    const ids = new Set();
    d.tasks.forEach(function (t, i) {
      ok(t.id === 't' + (i + 1), tag + ' : ids t1..tn dans l\'ordre');
      ok(TRAVEL_IDS.has(t.itemId), tag + ' : ' + t.itemId + ' hors du vivier validé');
      ok(!ids.has(t.itemId), tag + ' : item en double ' + t.itemId); ids.add(t.itemId);
      if (i > 0) ok(t.at >= d.tasks[i - 1].at, tag + ' : tâches triées par arrivée');
      if (t.live) ok(t.at + t.ringFor <= L.DAY_LEN && t.ringFor === g.ringFor, tag + ' : direct à la sonnerie du grade, fini avant 17:00');
      else ok(t.due == null || (t.due > t.at + 60 && t.due <= L.DAY_LEN), tag + ' : échéance après l\'arrivée et avant 17:00');
      if (t.mod === 'p7') { const it = PART7_PASSAGES.find(function (x) { return x.id === t.itemId; }); ok(L.p7Level(it.type) <= Math.max(1, g.multi), tag + ' : format P7 débloqué au grade'); }
      else ok(TRAVEL_SUBJECTS.has(t.subject), tag + ' : sujet générique (ne trahit pas le lieu) : ' + t.subject);
      ok([t.from, t.subject, t.ask && t.ask.text].join(' ').indexOf('undefined') < 0 && t.ask.who === 'maya', tag + ' : habillage complet, interlocutrice Maya');
    });
  }
});
// ── 2c. Front Desk (monde service client, 2026-09-25) : 400 journées par grade ─────────────────────
// Vivier relu par Jérémy, rangé par rôle. Point du matin à 9:00 (règle « prévu = paré », variante S2), un seul client
// mécontent, jamais le premier. Habillage générique : ni le motif de l'appel, ni le lieu.
const SP = L.SERVICE_POOL;
ok(SP && SP.huddle && SP.angry && SP.p3customer && SP.p3team && SP.p4store && SP.p4other && SP.p7, 'Front Desk : vivier déclaré par rôle (SERVICE_POOL)');
const SERVICE_ALL = [].concat(SP.huddle, SP.angry, SP.p3customer, SP.p3team, SP.p4store, SP.p4other, SP.p7);
ok(new Set(SERVICE_ALL).size === SERVICE_ALL.length, 'Front Desk : aucun item dans deux rôles');
ok(SERVICE_ALL.length === 11 + 12 + 11, 'Front Desk : le vivier validé tel quel (11 P3, 12 P4, 11 P7)');
[['huddle', SP.huddle, LISTENING_P4], ['angry', SP.angry, LISTENING_P3], ['p3customer', SP.p3customer, LISTENING_P3], ['p3team', SP.p3team, LISTENING_P3],
  ['p4store', SP.p4store, LISTENING_P4], ['p4other', SP.p4other, LISTENING_P4], ['p7', SP.p7, PART7_PASSAGES]].forEach(function (x) {
  x[1].forEach(function (id) { ok(x[2].some(function (it) { return it.id === id; }), 'Front Desk : ' + x[0] + ' ' + id + ' existe dans la banque'); });
});
SP.huddle.forEach(function (id) { ok(/difficult/i.test(LISTENING_P4.find(function (it) { return it.id === id; }).text), 'Front Desk : le point du matin ' + id + ' porte sur les clients difficiles'); });
// Le toast annonce un client mécontent : sa Q1 ne doit pas en dépendre (p3_04 : « Why is the man calling? » → « To complain… »).
SP.angry.forEach(function (id) {
  const it = LISTENING_P3.find(function (x) { return x.id === id; });
  ok(!it.qs.some(function (q) { return /complain|upset|angry|unhappy/i.test(q.opts[q.c]); }), 'Front Desk : ' + id + ' ne se répond pas par « client mécontent »');
});
const SERVICE_SUBJECTS = new Set(['The morning huddle', 'A customer at the counter', 'A customer on the line', 'A conversation in the back office', 'A quick team meeting', 'An announcement to shoppers']);
G.forEach(function (g, gi) {
  for (let s = 0; s < 400; s++) {
    const d = L.composeDay(g.rep, rng(70000 + 1000 * gi + s), 'service');
    const tag = 'service ' + g.id + '#' + s;
    ok(d.tasks.length === g.tasks, tag + ' : ' + g.tasks + ' tâches (' + d.tasks.length + ')');
    ok(typeof d.brief === 'string' && d.brief.indexOf('undefined') < 0 && /huddle/.test(d.brief), tag + ' : brief qui annonce le point du matin');
    const pr = d.tasks.filter(function (t) { return t.prep; }), hit = d.tasks.filter(function (t) { return t.prepHit; });
    ok(pr.length === 1 && pr[0].at === 0 && pr[0].live && pr[0].kind === 'huddle' && SP.huddle.indexOf(pr[0].itemId) >= 0, tag + ' : un point du matin, en direct à 9:00');
    ok(hit.length === 1 && hit[0].live && hit[0].mod === 'lisP3' && SP.angry.indexOf(hit[0].itemId) >= 0 && hit[0].at >= 60, tag + ' : un seul client mécontent, jamais avant 10:00');
    ok(hit.length === 1 && d.tasks.some(function (t) { return !t.prep && t.at < hit[0].at && t.at > 0; }), tag + ' : une autre tâche arrive avant le client mécontent');
    const ids = new Set();
    d.tasks.forEach(function (t, i) {
      ok(t.id === 't' + (i + 1), tag + ' : ids t1..tn dans l\'ordre');
      ok(SERVICE_ALL.indexOf(t.itemId) >= 0, tag + ' : ' + t.itemId + ' hors du vivier validé');
      ok(!ids.has(t.itemId), tag + ' : item en double ' + t.itemId); ids.add(t.itemId);
      if (i > 0) ok(t.at >= d.tasks[i - 1].at, tag + ' : tâches triées par arrivée');
      if (t.live) ok(t.at + t.ringFor <= L.DAY_LEN && t.ringFor === g.ringFor, tag + ' : direct à la sonnerie du grade, fini avant 17:00');
      else ok(t.due == null || (t.due > t.at + 60 && t.due <= L.DAY_LEN), tag + ' : échéance après l\'arrivée et avant 17:00');
      if (t.mod === 'p7') { const it = PART7_PASSAGES.find(function (x) { return x.id === t.itemId; }); ok(L.p7Level(it.type) <= Math.max(1, g.multi), tag + ' : format P7 débloqué au grade'); ok(!/^Dear\b/.test(t.subject), tag + ' : pas de « Dear … » en objet'); }
      else if (t.mod === 'lisP3' || SP.p4store.indexOf(t.itemId) >= 0 || t.prep) ok(SERVICE_SUBJECTS.has(t.subject), tag + ' : sujet générique : ' + t.subject);
      if (SP.p3customer.indexOf(t.itemId) >= 0) ok(t.kind === 'counter' || t.kind === 'call', tag + ' : client au comptoir ou au téléphone');
      if (SP.p3team.indexOf(t.itemId) >= 0) ok(t.kind === 'chat' || t.kind === 'meeting', tag + ' : collègues entre eux');
      ok([t.from, t.subject, t.ask && t.ask.text].join(' ').indexOf('undefined') < 0 && t.ask.who === 'priya', tag + ' : habillage complet, interlocutrice Priya');
    });
  }
});
ok(L.PEOPLE.priya && L.PEOPLE.priya.name === 'Priya Shah', 'Front Desk : Priya Shah déclarée (PEOPLE)');

// ── 2d. Opening Night (monde événements, 2026-09-25) : 400 journées par grade ─────────────────────
// Vivier relu par Jérémy, rangé par ligne de checklist. Une tâche cochable par ligne (3 lignes aux grades à 4 tâches,
// 4 au-delà), l'ouverture des portes à 16:00 en DERNIER, tout le reste rendable avant. Habillage générique : ni la ligne
// (« Venue » soufflerait p3_75), ni la nature de l'événement (p3_58, p4_20, p4_71).
const OP = L.OPENING_POOL;
ok(OP && L.OPENING_LINES && L.OPENING_LINES.join() === 'venue,catering,setup,program' && L.FINALE_AT === 420, 'Opening Night : vivier par ligne, 4 lignes, portes à 16:00');
const OPENING_ALL = [].concat.apply([], Object.keys(OP).map(function (k) { return OP[k]; }));
ok(new Set(OPENING_ALL).size === OPENING_ALL.length, 'Opening Night : aucun item dans deux rôles');
ok(OPENING_ALL.filter(function (id) { return /^p3_/.test(id); }).length === 15 && OPENING_ALL.filter(function (id) { return /^p4_/.test(id); }).length === 11 && OPENING_ALL.filter(function (id) { return /^p7p/.test(id); }).length === 9, 'Opening Night : le vivier validé tel quel (15 P3, 11 P4, 9 P7)');
OPENING_ALL.forEach(function (id) {
  const bank = /^p3_/.test(id) ? LISTENING_P3 : /^p4_/.test(id) ? LISTENING_P4 : PART7_PASSAGES;
  ok(bank.some(function (it) { return it.id === id; }), 'Opening Night : ' + id + ' existe dans la banque');
});
ok(OP.finale.concat(OP.extra).every(function (id) { return /^p4_/.test(id); }), 'Opening Night : ouverture et atelier sont des Parts 4 (en direct)');
// Aucun vivier d'un autre monde ne prête ses items : un item joué dans deux mondes compterait double à l'usage.
[].concat(L.TRAVEL_POOL.p3, L.TRAVEL_POOL.p7, L.TRAVEL_POOL.disruption, Object.keys(L.TRAVEL_POOL.forecast), SERVICE_ALL).forEach(function (id) {
  ok(OPENING_ALL.indexOf(id) < 0, 'Opening Night : ' + id + ' appartient déjà à un autre monde');
});
const OPENING_SUBJECTS = new Set(['A call about an event', 'A chat about an event', 'A quick planning meeting', 'A workshop starting', 'The event is starting']);
const LINE_WORDS = /venue|cater|setup|set-up|program|gala|award|festival|picnic|retirement|summit|trade show|expo/i;
G.forEach(function (g, gi) {
  for (let s = 0; s < 400; s++) {
    const d = L.composeDay(g.rep, rng(50000 + 1000 * gi + s), 'opening');
    const tag = 'opening ' + g.id + '#' + s;
    ok(d.tasks.length === g.tasks, tag + ' : ' + g.tasks + ' tâches (' + d.tasks.length + ')');
    const checks = d.tasks.filter(function (t) { return t.check; }), fin = d.tasks.filter(function (t) { return t.finale; });
    ok(checks.length === (g.tasks >= 5 ? 4 : 3) && new Set(checks.map(function (t) { return t.check; })).size === checks.length, tag + ' : une tâche par ligne, 3 ou 4 lignes selon le grade');
    checks.forEach(function (t) { ok(OP[t.check].indexOf(t.itemId) >= 0, tag + ' : ' + t.itemId + ' tiré de la ligne ' + t.check); });
    ok(fin.length === 1 && fin[0] === d.tasks[d.tasks.length - 1] && fin[0].at === L.FINALE_AT && fin[0].live && OP.finale.indexOf(fin[0].itemId) >= 0, tag + ' : l\'ouverture des portes, en direct à 16:00, en dernier');
    ok(typeof d.brief === 'string' && d.brief.indexOf('undefined') < 0 && /16:00/.test(d.brief) && !LINE_WORDS.test(d.brief), tag + ' : brief qui annonce 16:00 sans nommer de ligne');
    const ids = new Set();
    d.tasks.forEach(function (t, i) {
      ok(t.id === 't' + (i + 1), tag + ' : ids t1..tn dans l\'ordre');
      ok(OPENING_ALL.indexOf(t.itemId) >= 0, tag + ' : ' + t.itemId + ' hors du vivier validé');
      ok(!ids.has(t.itemId), tag + ' : item en double ' + t.itemId); ids.add(t.itemId);
      if (i > 0) ok(t.at >= d.tasks[i - 1].at, tag + ' : tâches triées par arrivée');
      if (t.live) ok(t.at + t.ringFor <= L.DAY_LEN && t.ringFor === g.ringFor, tag + ' : direct à la sonnerie du grade, fini avant 17:00');
      if (!t.finale) {
        ok(t.live ? t.at + t.ringFor <= L.FINALE_AT : t.due != null && t.due <= L.FINALE_AT && t.due > t.at + 60, tag + ' : ' + t.itemId + ' rendable avant l\'ouverture des portes');
      }
      if (t.mod === 'p7') { const it = PART7_PASSAGES.find(function (x) { return x.id === t.itemId; }); ok(L.p7Level(it.type) <= Math.max(1, g.multi), tag + ' : format P7 débloqué au grade'); }
      else ok(OPENING_SUBJECTS.has(t.subject) && !LINE_WORDS.test([t.from, t.subject, t.ask.text].join(' ')), tag + ' : habillage générique (ni la ligne, ni l\'événement) : ' + t.subject);
      ok([t.from, t.subject, t.ask && t.ask.text].join(' ').indexOf('undefined') < 0 && t.ask.who === 'theo', tag + ' : habillage complet, interlocuteur Theo');
    });
  }
});
ok(L.PEOPLE.theo && L.PEOPLE.theo.name === 'Theo Marchetti', 'Opening Night : Theo Marchetti déclaré (PEOPLE)');

const W = require(path.join(ROOT, 'src', 'lib', 'worlds.js'));
ok(W.WORLD_META.travel.modId === 'travel' && W.WORLD_META.travel.repKey === 'travelDay' && !!W.WORLD_META.travel.prep, 'worlds.js : Jet Lag = module travel, réputation gameScores.travelDay, règle « prévu = paré »');
ok(W.WORLD_META.service.modId === 'service' && W.WORLD_META.service.repKey === 'serviceDay' && W.WORLD_META.service.person === 'priya' && !!W.WORLD_META.service.prep, 'worlds.js : Front Desk = module service, réputation gameScores.serviceDay, Priya, règle « prévu = paré »');
ok(W.WORLD_META.office.modId === 'office' && W.WORLD_META.office.repKey === 'officeDay' && W.WORLD_META.office.prep === null && W.WORLD_META.office.checklist === null, 'worlds.js : Nine to Five inchangé (office, officeDay, sans règle)');
const OW = W.WORLD_META.opening;
ok(OW.modId === 'opening' && OW.repKey === 'openingDay' && OW.person === 'theo' && OW.prep === null && OW.checklist, 'worlds.js : Opening Night = module opening, réputation gameScores.openingDay, Theo, checklist sans « prévu = paré »');
ok(L.OPENING_LINES.every(function (k) { return typeof OW.checklist.labels[k] === 'string'; }) && ['hud', 'arrive', 'ok', 'ko', 'opened', 'none'].every(function (k) { return typeof OW.checklist[k] === 'string' && OW.checklist[k]; }), 'worlds.js : la checklist déclare un libellé par ligne et tous ses textes');
ok(W.CHECK_BONUS === 5, 'checklist : +5 rep par ligne cochée à l\'ouverture des portes (choix de Jérémy, E1)');
Object.keys(W.WORLD_META).forEach(function (id) {
  const m = W.WORLD_META[id];
  ok(m.prep !== undefined && m.checklist !== undefined, 'worlds.js : ' + id + ' déclare prep et checklist (null si le monde n\'en a pas)');
  ok(m.id === id && m.name && m.company && m.desk && m.wait && m.announce && m.empty && m.quit && m.quit.title && m.rules && m.rules.length === 3 && L.PEOPLE[m.person], 'worlds.js : ' + id + ' déclare tout ce que lit l\'écran');
  if (m.prep) ['hud', 'arrive', 'doneOk', 'doneKo', 'ready', 'caught', 'reviewReady', 'reviewCaught', 'reviewCaughtTail'].forEach(function (k) { ok(typeof m.prep[k] === 'string' && m.prep[k].length > 0, 'worlds.js : ' + id + '.prep.' + k); });
});
ok(!/storm|rain/i.test(JSON.stringify(W.WORLD_META.travel.prep)), 'Jet Lag : la règle parle d\'anticipation, jamais d\'orage');
ok(W.worldRep({ gameScores: { travelDay: { rep: 42 } } }, 'travel') === 42 && W.worldRep({}, 'travel') === 0, 'worldRep : lit la réputation du monde, 0 sans profil');
ok(W.worldRep({ gameScores: { travelDay: { rep: 42 } } }, 'service') === 0, 'worldRep : chaque monde a sa réputation');
ok(W.PREP_BONUS === 15 && W.PREP_DELAY === 45, 'règle « prévu = paré » : +15 rep ou +45 min (choix de Jérémy, W2 / S2)');
ok(!/^import /m.test(fs0.readFileSync(path.join(ROOT, 'src', 'lib', 'worlds.js'), 'utf8')), 'lib/worlds.js sans import (pur, sans données)');

// ── 3. Réputation, XP, étoiles ────────────────────────────────────────────────────────────────
ok(L.repGain([{ correct: 3, done: true, onTime: true }, { correct: 2, done: true, onTime: false }]) === 3 * 4 + 6 + 2 * 4, 'repGain : 4 par bonne réponse, 6 par tâche à l\'heure seulement');
ok(L.repGain([{ correct: 0, done: false, onTime: false }]) === 0, 'repGain : une tâche manquée ne rapporte rien');
ok(L.repGain([{ correct: -50 }]) === 0, 'repGain : jamais négatif (la réputation ne baisse jamais)');
ok(L.repGain([{ correct: 999, done: true, onTime: true }]) === L.REP_MAX_GAIN, 'repGain : borné à REP_MAX_GAIN');
ok(L.dayXp(0, 0, true) === 0, 'dayXp : rien à 0 réponse');
ok(L.dayXp(10, 13, false) === 15 + 50, 'dayXp : 15 + 5 par bonne réponse');
ok(L.dayXp(13, 13, true) === 15 + 65 + 25, 'dayXp : +25 pour une journée sans faute ET sans rien laisser filer');
ok(L.dayXp(13, 13, false) === 15 + 65, 'dayXp : pas de bonus si une tâche a filé');
ok(L.dayStars(13, 15) === 3 && L.dayStars(11, 15) === 2 && L.dayStars(8, 15) === 1 && L.dayStars(3, 15) === 0, 'dayStars : paliers 85 / 70 / 50 %');

// ── 4. Câblage (lu dans le source) ──────────────────────────────────────────────────────────────
const fs = require('fs');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const APP = read('src/App.jsx'), ROUTES = read('src/routes.jsx'), SCREEN = read('src/features/waygates/WorldDay.jsx');
const HUB = read('src/features/waygates/Waygates.jsx'), GAMES = read('src/features/games/GamesHub.jsx');

// worldDone (tous les mondes) : XP et anti-farming sous le module du monde, réponses versées dans les Parts SANS
// trackModSession sur elles (sinon une journée taxe les tuiles Listening/Reading et coche les quêtes du plan),
// réputation dans gameScores[repKey] (lib/worlds.js).
const od = (APP.match(/function worldDone\([\s\S]*?sv\(c\);return s\.sid;\}/) || [''])[0];
ok(!!od, 'App.jsx : worldDone existe (settle → … → sv → return s.sid)');
ok(/var W=worldMeta\(world\),modId=W\.modId;/.test(od) && /settleSession\(modId,sc,tot,xp,\{spotlight:true,extra:extra\}\)/.test(od), 'worldDone : XP réglée sous le module du monde, Spotlight compris');
ok((od.match(/trackModSession\(/g) || []).length === 1 && /trackModSession\(c,modId\)/.test(od), 'worldDone : trackModSession UNIQUEMENT sur le module du monde, jamais sur lisP3/lisP4/p7');
ok(/\["lisP3","lisP4","p7"\]\.forEach[\s\S]*recordModule\(c,m,pr\.c,pr\.t,null,\{via:modId\}\)/.test(od), 'worldDone : les réponses entrent dans lisP3, lisP4 et p7 (estimateur, Mentor)');
ok(/Math\.min\(REP_MAX_GAIN/.test(od) && /c\.gameScores\[W\.repKey\]=/.test(od), 'worldDone : réputation bornée, rangée dans gameScores[repKey]');
ok(/ready:extra&&extra\.ready,lines:extra&&extra\.lines/.test(od), 'worldDone : lignes cochées rangées dans l\'historique (trophée Full House)');
ok(/prepared:extra&&extra\.prepared/.test(od), 'worldDone : « paré » rangé dans l\'historique (trophée Weather-wise)');
ok(/recordMisses\(c\.review,mistakes/.test(od), 'worldDone : les erreurs entrent au bestiaire');
ok(/trackModSession, u, worldDone\}\)/.test(APP) && /trackModSession, u, worldDone\}=c;/.test(ROUTES), 'worldDone passé au contexte de renderRoute (appel ET déstructuration)');
['office', 'travel', 'service', 'opening'].forEach(function (w) {
  ok(new RegExp('if\\(sp==="' + w + '"\\)return pg\\(<WorldDay key="' + w + '" world="' + w + '" [^\\n]*done=\\{function\\(sc,tot,xp,mistakes,extra\\)\\{return worldDone\\("' + w + '",sc,tot,xp,mistakes,extra\\);\\}\\}').test(ROUTES), 'route ' + w + ' → WorldDay monde ' + w + ', worldDone, sid rendu');
});
ok(/if\(sp==="waygates"\)return pg\(<Waygates /.test(ROUTES), 'route waygates');
ok(/lazyNamed\(function\(\)\{return import\("\.\/features\/waygates\/WorldDay\.jsx"\);\},"WorldDay"\)/.test(ROUTES), 'WorldDay chargé à la demande (les banques restent hors du bundle principal)');
ok(!/from "[./]*\/lib\/officeDay\.js"/.test(APP) && !/from "[./]*\/lib\/officeDay\.js"/.test(GAMES) && !/from "[./]*\/lib\/officeDay\.js"/.test(HUB), 'App.jsx, GamesHub et le hub lisent officeGrades.js / worlds.js, jamais officeDay.js (qui importe les banques)');
ok(!/^import /m.test(read('src/lib/officeGrades.js')), 'lib/officeGrades.js sans import (pur, sans données)');
const selfManaged = (APP.match(/var SELF_MANAGED=\[([^\]]*)\]/) || ['', ''])[1];
ok(selfManaged.indexOf('"office"') < 0 && selfManaged.indexOf('"travel"') < 0 && selfManaged.indexOf('"service"') < 0 && selfManaged.indexOf('"opening"') < 0, 'mondes hors SELF_MANAGED : l\'effet central coupe la musique (écoute des Parts 3 et 4)');
// La règle « prévu = paré » (Jet Lag W2, Front Desk S2) : la préparation comprise en entier décide ; la tâche qui en
// dépend déclenche UNE fois, et seulement dans les mondes qui déclarent la règle.
ok(/var hit = W\.prep \? arrivals\.find\(function \(t\) \{ return t\.prepHit; \}\) : null;/.test(SCREEN) && /if \(hit && !wxRef\.current\.hit\)/.test(SCREEN), 'écran : la tâche prepHit déclenche la règle une seule fois, dans les mondes à W.prep');
ok(/bonus: PREP_BONUS/.test(SCREEN) && /m \+ PREP_DELAY/.test(SCREEN), 'écran : paré = +PREP_BONUS rep, sinon +PREP_DELAY min');
ok(/if \(t\.prep && W\.prep\) \{[\s\S]{0,200}var prepared = ok === t\.qs\.length;/.test(SCREEN), 'écran : paré = préparation comprise EN ENTIER');
ok(/prepared: W\.prep \? wx\.hit === "ready" : undefined/.test(SCREEN), 'écran : « paré » envoyé à worldDone (trophées Weather-wise, Keep Calm)');
ok(!/weather|forecastLabel/i.test(SCREEN.replace(/forecast: "(raining|Weather forecast)"/g, '').replace(/t\.kind === "forecast"/g, '')), 'écran : plus aucun cas particulier météo (tout vient de lib/worlds.js)');
ok(/\{ id: "travel", icon: "commercial-airplane"/.test(HUB) && /\{ id: "service", icon: "shopping-bag"/.test(HUB) && /\{ id: "opening", icon: "theater-curtains"/.test(HUB), 'hub : cartes Jet Lag, Front Desk, Opening Night');
// Checklist (Opening Night) : ligne cochée = tâche SANS faute ; les portes comptent une fois, à l'arrivée de la finale ;
// la ligne n'est nommée qu'après sa tâche.
ok(/function isReady\(t, s\) \{ return s\.status === "done" && t\.qs\.every\(function \(q, k\) \{ return s\.answers\[k\] === q\.c; \}\); \}/.test(SCREEN), 'écran : ligne cochée = tâche rendue sans faute');
ok(/var fin = W\.checklist \? arrivals\.find\(function \(t\) \{ return t\.finale; \}\) : null;\s*if \(fin && wxRef\.current\.finale == null\)/.test(SCREEN) && /bonus: w\.bonus \+ n \* CHECK_BONUS/.test(SCREEN), 'écran : l\'ouverture des portes compte les lignes UNE fois, +CHECK_BONUS par ligne');
ok(/ready: W\.checklist \? wx\.finale : undefined/.test(SCREEN), 'écran : lignes cochées envoyées à worldDone');
ok((SCREEN.match(/checklist\.labels\[/g) || []).length === 2 && /if \(t\.check && W\.checklist\) \{/.test(SCREEN), 'écran : une ligne n\'est nommée qu\'après sa tâche (toast de fin de tâche, bilan)');
ok(/"theater-curtains":/.test(read('src/data/avatarIcons.js')) && /"party-popper":/.test(read('src/data/avatarIcons.js')), 'icônes d\'Opening Night présentes (rideau, cotillon)');
ok(/"shopping-bag":/.test(read('src/data/avatarIcons.js')) && /"conversation":/.test(read('src/data/avatarIcons.js')) && /"ringing-bell":/.test(read('src/data/avatarIcons.js')), 'icônes de Front Desk présentes (sac, point du matin, comptoir)');

// L'écran : options permutées, refs relisibles par la chasse, audio interruptible, envoi à la fin, jetons de thème.
ok(/shufP7\(/.test(SCREEN) && /shufListeningItem\)/.test(SCREEN), 'écran : options permutées (shufP7, shufListeningItem)');
ok(/ref: \{ k: t\.mod \+ ":" \+ t\.itemId \+ ":" \+ q\.qi, part: PART\[t\.mod\] \}/.test(SCREEN), 'écran : refs lisP3:/lisP4:/p7: <id>:<question d\'origine>');
ok(/resumeAudioSession\(\); return stopListenAudio;/.test(SCREEN), 'écran : drapeau d\'abandon audio (resumeAudioSession / stopListenAudio)');
ok(/sidRef\.current = p\.done\(sc, answered, dayXp\(/.test(SCREEN) && /modId: W\.modId, world: W\.id, parts: parts/.test(SCREEN), 'écran : p.done à la fin de journée, module du monde et parts');
ok(/onSheet=\{function \(on\) \{ pausedRef\.current = on; \}\}/.test(SCREEN) && /if \(pausedRef\.current\) return;/.test(SCREEN), 'écran : la feuille « Leave » gèle l\'horloge');
[['WorldDay', SCREEN, 'NF_CSS'], ['Waygates', HUB, 'WG_CSS']].forEach(function (x) {
  const css = (x[1].match(new RegExp('var ' + x[2] + ' = `([\\s\\S]*?)`;')) || ['', ''])[1];
  ok(css.length > 100, x[0] + ' : CSS privé trouvé');
  ok(!/#[0-9a-fA-F]{3,8}\b/.test(css), x[0] + ' : aucune couleur en dur dans le CSS (skins, fêtes, mode clair : jetons du thème seulement)');
});
const lookup = require(path.join(ROOT, 'src', 'lib', 'reviewLookup.js'));
[['p7', PART7_PASSAGES[0]], ['lisP3', LISTENING_P3[0]], ['lisP4', LISTENING_P4[0]]].forEach(function (x) {
  const q = lookup.lookupRef(x[0] + ':' + x[1].id + ':0');
  ok(!!(q && q.prompt && q.options && q.options.length === 4), 'la chasse relit une erreur de Nine to Five (' + x[0] + ')');
});

// Passage du portail (V3 « Plongée ») : le hub marque le passage AVANT de naviguer (sinon le monde arrive sans
// voile), et le monde lit le drapeau sans le consommer, dans un initialiseur de useState (StrictMode l'appelle deux
// fois : une lecture qui consomme rendrait false et l'accueil apparaîtrait sec après la plongée).
const PORTAL = read('src/features/waygates/portal.js');
ok(/markPortal\(\);[\s\S]*?p\.nav\(w\.id\)/.test(HUB) && /playPortal\(\)/.test(HUB), 'hub : markPortal et le son avant la navigation');
ok(/reducedMotion\(\)\) \{ p\.nav\(w\.id\); return; \}/.test(HUB), 'hub : mouvement réduit = navigation directe, sans plongée');
ok(/useState\(arrivedByPortal\)/.test(SCREEN) && !/_arrivingAt\s*=\s*0/.test((PORTAL.match(/function arrivedByPortal[\s\S]*?\n/) || [''])[0]), 'monde : drapeau lu sans effet de bord (StrictMode)');
ok(/export function playPortal\(\)/.test(read('src/sounds.js')), 'son du portail (sounds.js playPortal)');

// Tuile, liste noire, estimateur, trophées.
ok(/\{id:"waygates",n:"The Waygates",[^\n]*plain:true\}/.test(GAMES) && GAMES.indexOf('{id:"waygates"') < GAMES.indexOf('{id:"tavern"'), 'hub Games : tuile The Waygates en tête, sans coffre propre (plain)');
ok(require(path.join(ROOT, 'src', 'lib', 'hubStatus.js')).MASTERY_BLACKLIST.office === 1, 'office en liste noire de maîtrise (ses réponses font avancer lisP3/lisP4/p7 : pas de double coffre)');
const TOEIC = read('src/lib/toeic.js');
ok(/office:\{part:null,section:null,score:true\}/.test(TOEIC), 'MODULE_TOEIC_MAP.office : ni part ni section');
ok(!/"office"|id:"office"/.test((TOEIC.match(/var READING_MODS[\s\S]*?var lisParts=[^\n]*/) || [''])[0]), 'office hors des tables de poids (compté via les Parts, jamais deux fois)');
const ACH = require(path.join(ROOT, 'src', 'data', 'achievements.js')).ACHIEVEMENTS;
const ach = (id) => ACH.find(function (a) { return a.id === id; });
const u0 = { stats: {}, moduleScores: {}, gameScores: {} };
const u1 = { stats: {}, moduleScores: { office: { sessions: 1, history: [{ tasks: 5, onTime: 5, correct: 10, total: 15 }] } }, gameScores: { officeDay: { rep: 250, days: 10 } } };
const u2 = { stats: {}, moduleScores: { office: { sessions: 9, history: [{ tasks: 5, onTime: 4 }, { tasks: 4, onTime: 4 }] } }, gameScores: { officeDay: { rep: 249, days: 9 } } };
['office_first', 'office_clean', 'office_promoted', 'office_veteran'].forEach(function (id) {
  ok(!!ach(id), 'trophée ' + id + ' déclaré');
  if (ach(id)) { ok(ach(id).check(u1), 'trophée ' + id + ' obtenu quand il le faut'); ok(!ach(id).check(u0), 'trophée ' + id + ' refusé à un profil neuf'); }
});
ok(!ach('office_clean').check(u2), 'Clean Desk : il faut 5 tâches ou plus, TOUTES à l\'heure');
ok(!ach('office_promoted').check(u2) && !ach('office_veteran').check(u2), 'Promoted à 250 rep, Ten Days à 10 journées');

// Jet Lag : mêmes règles qu'office (liste noire, estimateur), et ses 4 trophées. Weather-wise lit `prepared` dans
// l'historique du module travel (posé par worldDone) : 3 journées où le bulletin compris a absorbé la perturbation.
ok(require(path.join(ROOT, 'src', 'lib', 'hubStatus.js')).MASTERY_BLACKLIST.travel === 1, 'travel en liste noire de maîtrise (pas de double coffre)');
ok(/travel:\{part:null,section:null,score:true\}/.test(TOEIC), 'MODULE_TOEIC_MAP.travel : ni part ni section');
ok(!/"travel"|id:"travel"/.test((TOEIC.match(/var READING_MODS[\s\S]*?var lisParts=[^\n]*/) || [''])[0]), 'travel hors des tables de poids');
const t1 = { stats: {}, moduleScores: { travel: { sessions: 10, history: [{ prepared: true }, { prepared: true }, { prepared: false }, { prepared: true }] } }, gameScores: { travelDay: { rep: 250, days: 10 } } };
const t2 = { stats: {}, moduleScores: { travel: { sessions: 9, history: [{ prepared: true }, { prepared: true }, { prepared: false }, {}] } }, gameScores: { travelDay: { rep: 249, days: 9 } } };
['travel_first', 'travel_veteran', 'travel_promoted', 'travel_weatherwise'].forEach(function (id) {
  ok(!!ach(id), 'trophée ' + id + ' déclaré');
  if (ach(id)) { ok(ach(id).check(t1), 'trophée ' + id + ' obtenu quand il le faut'); ok(!ach(id).check(u0), 'trophée ' + id + ' refusé à un profil neuf'); }
});
ok(!ach('travel_weatherwise').check(t2), 'Weather-wise : 3 journées « paré », pas 2');
ok(!ach('travel_promoted').check(t2) && !ach('travel_veteran').check(t2), 'Upgraded à 250 rep, Frequent Flyer à 10 journées');
ok(!ach('office_first').check(t1) && !ach('travel_first').check(u1), 'les trophées d\'un monde ne se gagnent pas dans l\'autre');

// Front Desk : mêmes règles, ses 4 trophées. Keep Calm lit `prepared` dans l'historique du module service.
ok(require(path.join(ROOT, 'src', 'lib', 'hubStatus.js')).MASTERY_BLACKLIST.service === 1, 'service en liste noire de maîtrise (pas de double coffre)');
ok(/service:\{part:null,section:null,score:true\}/.test(TOEIC), 'MODULE_TOEIC_MAP.service : ni part ni section');
ok(!/"service"|id:"service"/.test((TOEIC.match(/var READING_MODS[\s\S]*?var lisParts=[^\n]*/) || [''])[0]), 'service hors des tables de poids');
const s1 = { stats: {}, moduleScores: { service: { sessions: 10, history: [{ prepared: true }, { prepared: true }, { prepared: false }, { prepared: true }] } }, gameScores: { serviceDay: { rep: 250, days: 10 } } };
const s2 = { stats: {}, moduleScores: { service: { sessions: 9, history: [{ prepared: true }, { prepared: true }, { prepared: false }, {}] } }, gameScores: { serviceDay: { rep: 249, days: 9 } } };
['service_first', 'service_veteran', 'service_promoted', 'service_calm'].forEach(function (id) {
  ok(!!ach(id), 'trophée ' + id + ' déclaré');
  if (ach(id)) { ok(ach(id).check(s1), 'trophée ' + id + ' obtenu quand il le faut'); ok(!ach(id).check(u0), 'trophée ' + id + ' refusé à un profil neuf'); }
});
ok(!ach('service_calm').check(s2), 'Keep Calm : 3 journées « paré », pas 2');
ok(!ach('service_promoted').check(s2) && !ach('service_veteran').check(s2), 'Employee of the Month à 250 rep, Regular Staff à 10 journées');
ok(!ach('service_calm').check(t1) && !ach('travel_weatherwise').check(s1) && !ach('service_first').check(u1), 'Front Desk et les autres mondes ne se prêtent pas leurs trophées');
ok(['usageStats.js', 'chestLabels.js'].every(function (f) { return /service: "Front Desk"/.test(read('src/lib/' + f)); }) && /id:"service",label:"The Waygates · Front Desk"/.test(read('src/lib/feedbackModules.js'))
  && /service:"Front Desk"/.test(read('src/features/teacher/TeacherDash.jsx')) && /\{id:"service",name:"Front Desk"\}/.test(read('src/features/teacher/TeacherDash.jsx')), 'libellé « Front Desk » : Usage, coffres, feedback, formateur (liste et export)');

// Opening Night : mêmes règles, ses 4 trophées. Full House lit `ready` / `lines` dans l'historique du module opening.
ok(require(path.join(ROOT, 'src', 'lib', 'hubStatus.js')).MASTERY_BLACKLIST.opening === 1, 'opening en liste noire de maîtrise (pas de double coffre)');
ok(/opening:\{part:null,section:null,score:true\}/.test(TOEIC), 'MODULE_TOEIC_MAP.opening : ni part ni section');
ok(!/"opening"|id:"opening"/.test((TOEIC.match(/var READING_MODS[\s\S]*?var lisParts=[^\n]*/) || [''])[0]), 'opening hors des tables de poids');
const o1 = { stats: {}, moduleScores: { opening: { sessions: 10, history: [{ ready: 4, lines: 4 }, { ready: 3, lines: 3 }, { ready: 2, lines: 4 }, { ready: 4, lines: 4 }] } }, gameScores: { openingDay: { rep: 250, days: 10 } } };
const o2 = { stats: {}, moduleScores: { opening: { sessions: 9, history: [{ ready: 4, lines: 4 }, { ready: 3, lines: 4 }, { ready: 0, lines: 0 }, { ready: null, lines: 4 }, { ready: 3, lines: 3 }] } }, gameScores: { openingDay: { rep: 249, days: 9 } } };
['opening_first', 'opening_veteran', 'opening_promoted', 'opening_fullhouse'].forEach(function (id) {
  ok(!!ach(id), 'trophée ' + id + ' déclaré');
  if (ach(id)) { ok(ach(id).check(o1), 'trophée ' + id + ' obtenu quand il le faut'); ok(!ach(id).check(u0), 'trophée ' + id + ' refusé à un profil neuf'); }
});
ok(!ach('opening_fullhouse').check(o2), 'Full House : 3 journées tout prêt, pas 2 (et 0/0 ne compte pas)');
ok(!ach('opening_promoted').check(o2) && !ach('opening_veteran').check(o2), 'Rising Star à 250 rep, Seasoned Planner à 10 journées');
ok(!ach('opening_first').check(s1) && !ach('service_first').check(o1) && !ach('opening_fullhouse').check(t1), 'Opening Night et les autres mondes ne se prêtent pas leurs trophées');
ok(['usageStats.js', 'chestLabels.js'].every(function (f) { return /opening: "Opening Night"/.test(read('src/lib/' + f)); }) && /id:"opening",label:"The Waygates · Opening Night"/.test(read('src/lib/feedbackModules.js'))
  && /opening:"Opening Night"/.test(read('src/features/teacher/TeacherDash.jsx')) && /\{id:"opening",name:"Opening Night"\}/.test(read('src/features/teacher/TeacherDash.jsx')), 'libellé « Opening Night » : Usage, coffres, feedback, formateur (liste et export)');

console.log((fails ? 'ÉCHEC' : 'OK') + ' — Nine to Five : ' + checks + ' contrôles' + (fails ? ', ' + fails + ' en échec' : ''));
process.exit(fails ? 1 : 0);
