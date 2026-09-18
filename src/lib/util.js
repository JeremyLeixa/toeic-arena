// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.

// today(d) : date ISO (UTC) du jour, ou de `d` si fourni — l'argument sert aux fonctions
// pures (lib/xp.js) et aux tests, qui injectent l'instant plutôt que lire l'horloge.
export function today(d){return (d||new Date()).toISOString().split("T")[0];}
export function weekId(){var d=new Date();var day=d.getDay();var diff=d.getDate()-day+(day===0?-6:1);var mon=new Date(d);mon.setDate(diff);mon.setHours(0,0,0,0);var jan1=new Date(mon.getFullYear(),0,1);var wk=Math.floor((mon-jan1)/(7*864e5))+1;return mon.getFullYear()+"-W"+wk;}
export function shuffle(a){var b=a.slice();for(var i=b.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=b[i];b[i]=b[j];b[j]=t;}return b;}
// shuffleOpts(opts, c) : les options d'un QCM dans un ordre neuf, et la nouvelle position de la bonne
// réponse. Les banques écrites à la main la mettent en B ou C huit fois sur dix (mesuré le 2026-09-18) :
// sans permutation, l'élève apprend la position, pas la règle. À appeler au montage du deck, une fois
// par item, et tout lire ensuite sur la copie (réponse, surlignage, mistakesRef, score).
export function shuffleOpts(opts,c){var order=shuffle(opts.map(function(o,i){return i;}));return{opts:order.map(function(k){return opts[k];}),c:order.indexOf(c)};}
export function srand(s){var x=Math.sin(s)*10000;return x-Math.floor(x);}
// seededShuffleOpts(opts, c, seed) : même chose, tirage FIGÉ par `seed` (entier). Pour une épreuve qui
// reprend une session en cours (Boss) : la disposition ne doit pas bouger d'une ouverture à l'autre.
// Pas de 0.67 : sur les Parts 3 à 7 du Boss, la répartition la plus équilibrée des pas de 0.05 à 0.99
// (aucune position à plus de 8 points de 25 %). Le changer redistribue le Boss → bumper BOSS_LAYOUT_V.
export function seededShuffleOpts(opts,c,seed){var order=opts.map(function(o,i){return i;});for(var j=order.length-1;j>0;j--){var k=Math.floor(srand(seed+j*0.67)*(j+1));var t=order[j];order[j]=order[k];order[k]=t;}return{opts:order.map(function(k){return opts[k];}),c:order.indexOf(c)};}
// ─── Name normalization (accent-insensitive + lowercase) ───
export function normalizeName(s){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();}
