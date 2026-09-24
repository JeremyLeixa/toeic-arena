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
const APP = read('src/App.jsx'), ROUTES = read('src/routes.jsx'), SCREEN = read('src/features/waygates/NineToFive.jsx');
const HUB = read('src/features/waygates/Waygates.jsx'), GAMES = read('src/features/games/GamesHub.jsx');

// officeDone : XP et anti-farming sous "office", réponses versées dans les Parts SANS trackModSession sur elles
// (sinon une journée taxe les tuiles Listening/Reading et coche les quêtes du plan), réputation dans gameScores.
const od = (APP.match(/function officeDone\([\s\S]*?sv\(c\);return s\.sid;\}/) || [''])[0];
ok(!!od, 'App.jsx : officeDone existe (settle → … → sv → return s.sid)');
ok(/settleSession\("office",sc,tot,xp,\{spotlight:true,extra:extra\}\)/.test(od), 'officeDone : XP réglée sous "office", Spotlight compris');
ok((od.match(/trackModSession\(/g) || []).length === 1 && /trackModSession\(c,"office"\)/.test(od), 'officeDone : trackModSession UNIQUEMENT sur "office", jamais sur lisP3/lisP4/p7');
ok(/\["lisP3","lisP4","p7"\]\.forEach[\s\S]*recordModule\(c,m,pr\.c,pr\.t,null,\{via:"office"\}\)/.test(od), 'officeDone : les réponses entrent dans lisP3, lisP4 et p7 (estimateur, Mentor)');
ok(/Math\.min\(REP_MAX_GAIN/.test(od) && /gameScores\.officeDay=/.test(od), 'officeDone : réputation bornée, rangée dans gameScores.officeDay');
ok(/recordMisses\(c\.review,mistakes/.test(od), 'officeDone : les erreurs entrent au bestiaire');
ok(/officeDone, pg/.test(APP) && /officeDone, pg/.test(ROUTES), 'officeDone passé au contexte de renderRoute (appel ET déstructuration)');
ok(/if\(sp==="office"\)return pg\(<NineToFive [^\n]*done=\{function\(sc,tot,xp,mistakes,extra\)\{return officeDone\(sc,tot,xp,mistakes,extra\);\}\}/.test(ROUTES), 'route office → officeDone, sid rendu');
ok(/if\(sp==="waygates"\)return pg\(<Waygates /.test(ROUTES), 'route waygates');
ok(/lazyNamed\(function\(\)\{return import\("\.\/features\/waygates\/NineToFive\.jsx"\);\},"NineToFive"\)/.test(ROUTES), 'Nine to Five chargé à la demande (les banques restent hors du bundle principal)');
ok(!/from "[./]*\/lib\/officeDay\.js"/.test(APP) && !/from "[./]*\/lib\/officeDay\.js"/.test(GAMES), 'App.jsx et GamesHub lisent officeGrades.js, jamais officeDay.js (qui importe les banques)');
ok(!/^import /m.test(read('src/lib/officeGrades.js')), 'lib/officeGrades.js sans import (pur, sans données)');
const selfManaged = (APP.match(/var SELF_MANAGED=\[([^\]]*)\]/) || ['', ''])[1];
ok(selfManaged.indexOf('"office"') < 0, 'office hors SELF_MANAGED : l\'effet central coupe la musique (écoute des Parts 3 et 4)');

// L'écran : options permutées, refs relisibles par la chasse, audio interruptible, envoi à la fin, jetons de thème.
ok(/shufP7\(/.test(SCREEN) && /shufListeningItem\)/.test(SCREEN), 'écran : options permutées (shufP7, shufListeningItem)');
ok(/ref: \{ k: t\.mod \+ ":" \+ t\.itemId \+ ":" \+ q\.qi, part: PART\[t\.mod\] \}/.test(SCREEN), 'écran : refs lisP3:/lisP4:/p7: <id>:<question d\'origine>');
ok(/resumeAudioSession\(\); return stopListenAudio;/.test(SCREEN), 'écran : drapeau d\'abandon audio (resumeAudioSession / stopListenAudio)');
ok(/sidRef\.current = p\.done\(sc, answered, dayXp\(/.test(SCREEN) && /modId: "office", parts: parts/.test(SCREEN), 'écran : p.done à la fin de journée, modId office et parts');
ok(/onSheet=\{function \(on\) \{ pausedRef\.current = on; \}\}/.test(SCREEN) && /if \(pausedRef\.current\) return;/.test(SCREEN), 'écran : la feuille « Leave » gèle l\'horloge');
[['NineToFive', SCREEN, 'NF_CSS'], ['Waygates', HUB, 'WG_CSS']].forEach(function (x) {
  const css = (x[1].match(new RegExp('var ' + x[2] + ' = `([\\s\\S]*?)`;')) || ['', ''])[1];
  ok(css.length > 100, x[0] + ' : CSS privé trouvé');
  ok(!/#[0-9a-fA-F]{3,8}\b/.test(css), x[0] + ' : aucune couleur en dur dans le CSS (skins, fêtes, mode clair : jetons du thème seulement)');
});
const lookup = require(path.join(ROOT, 'src', 'lib', 'reviewLookup.js'));
[['p7', PART7_PASSAGES[0]], ['lisP3', LISTENING_P3[0]], ['lisP4', LISTENING_P4[0]]].forEach(function (x) {
  const q = lookup.lookupRef(x[0] + ':' + x[1].id + ':0');
  ok(!!(q && q.prompt && q.options && q.options.length === 4), 'la chasse relit une erreur de Nine to Five (' + x[0] + ')');
});

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

console.log((fails ? 'ÉCHEC' : 'OK') + ' — Nine to Five : ' + checks + ' contrôles' + (fails ? ', ' + fails + ' en échec' : ''));
process.exit(fails ? 1 : 0);
