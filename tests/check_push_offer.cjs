/* Demande de notifications dans l'appli (lib/pushOffer.js, variante B du proto push-optin, 2026-09-24).
 *
 * POURQUOI CE TEST EXISTE. Une demande mal réglée ne casse rien au build, mais :
 *  · redemander après un refus du navigateur épuise l'élève (et ce refus est définitif, rien à gagner) ;
 *  · demander à l'inscription, avant toute session, fait refuser par réflexe ;
 *  · oublier le cas iPhone hors appli installée affiche un bouton qui ne peut rien faire ;
 *  · une feuille jamais limitée devient un plein écran de plus à chaque entrée sur Home.
 * Et le câblage : la feuille passe APRÈS la lettre du lundi dans le budget d'interruptions (lu dans App.jsx).
 *
 * Usage : node tests/check_push_offer.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const P = require(path.join(ROOT, 'src', 'lib', 'pushOffer.js'));

let fails = 0, checks = 0;
const ok = (label, cond) => { checks++; if (!cond) { fails++; console.log('  FAIL ' + label); } };

const NOW = Date.UTC(2026, 9, 1, 12);
const U = { name: 'Léa', classCode: 'iabd2627', stats: { sessions: 3 } };
const ANDROID = { supported: true, permission: 'default', ios: false, standalone: false };

ok('Android, jamais demandé → ask', P.pushOfferMode(U, ANDROID, {}, NOW) === 'ask');
ok('avant la première session → rien', P.pushOfferMode(Object.assign({}, U, { stats: { sessions: 0 } }), ANDROID, {}, NOW) === null);
ok('visiteur → rien', P.pushOfferMode(Object.assign({}, U, { classCode: 'visitor' }), ANDROID, {}, NOW) === null);
ok('refus du navigateur → plus jamais', P.pushOfferMode(U, Object.assign({}, ANDROID, { permission: 'denied' }), {}, NOW) === null);
ok('déjà autorisé → rien (abonné, ou désabonné exprès)', P.pushOfferMode(U, Object.assign({}, ANDROID, { permission: 'granted' }), {}, NOW) === null);
ok('sans Push API → rien', P.pushOfferMode(U, Object.assign({}, ANDROID, { supported: false, permission: null }), {}, NOW) === null);
ok('iPhone hors appli installée → ios (même sans Push API dans Safari)',
  P.pushOfferMode(U, { supported: false, permission: null, ios: true, standalone: false }, {}, NOW) === 'ios');
ok('iPhone avec l\'appli installée → ask', P.pushOfferMode(U, { supported: true, permission: 'default', ios: true, standalone: true }, {}, NOW) === 'ask');

// Reports : 5 jours, 3 fois au plus.
const r1 = P.laterRecord({}, NOW);
ok('« Not now » → n=1, reproposé dans 5 jours', r1.n === 1 && r1.next === NOW + 5 * 864e5);
ok('pendant le report → rien', P.pushOfferMode(U, ANDROID, r1, NOW + 4 * 864e5) === null);
ok('après le report → ask', P.pushOfferMode(U, ANDROID, r1, NOW + 5 * 864e5) === 'ask');
const r3 = P.laterRecord(P.laterRecord(r1, NOW), NOW);
ok('3 reports → plus jamais automatiquement', r3.n === 3 && P.pushOfferMode(U, ANDROID, r3, NOW + 60 * 864e5) === null);

// iPhone : les « Got it » hors appli ont leur propre compteur. Sinon trois « Got it » dans Safari priveraient à
// jamais de la vraie demande, possible seulement une fois l'appli installée.
const IOS_SAFARI = { supported: false, permission: null, ios: true, standalone: false };
const IOS_APP = { supported: true, permission: 'default', ios: true, standalone: true };
let ri = {};
for (let i = 0; i < 3; i++) ri = P.laterRecord(ri, NOW, 'ios');
ok('3 « Got it » sur iPhone → plus de rappel d\'installation', P.pushOfferMode(U, IOS_SAFARI, ri, NOW + 60 * 864e5) === null);
ok('… mais appli installée ensuite → la vraie demande arrive', P.pushOfferMode(U, IOS_APP, ri, NOW) === 'ask');

// Stockage : un stockage qui lève ne casse rien.
const bad = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
const oldWarn = console.warn; console.warn = () => {};
ok('stockage bloqué → record vide, pas d\'exception', JSON.stringify(P.readOfferRecord(bad)) === '{}');
P.writeOfferRecord(bad, r1);
console.warn = oldWarn;

// Câblage dans App.jsx : dernier du budget, après la lettre du lundi, jamais par-dessus une session.
const app = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
ok('App calcule le mode par pushOfferMode', /pushOfferMode\(/.test(app));
ok('la feuille attend que la lettre du lundi ne soit pas due', /pushBase=[^;]*!letterBase/.test(app));
ok('la feuille ne passe pas par-dessus une session, un coffre, Aldric, une session perdue', /pushBase=[^;]*!lastSession[^;]*!chestModal[^;]*!currentNarratorMoment[^;]*!authLost/.test(app));
ok('la feuille prend l\'emplacement de l\'entrée (budget)', /showPush=[^;]*usedEntry!==homeEntry/.test(app) && /markEntryUsed\(homeEntry\)/.test(app));

console.log((checks - fails) + '/' + checks + ' vérifications de la demande de notifications au vert');
process.exit(fails ? 1 : 0);
