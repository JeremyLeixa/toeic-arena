// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.

// today(d) : date ISO (UTC) du jour, ou de `d` si fourni — l'argument sert aux fonctions
// pures (lib/xp.js) et aux tests, qui injectent l'instant plutôt que lire l'horloge.
export function today(d){return (d||new Date()).toISOString().split("T")[0];}
export function weekId(){var d=new Date();var day=d.getDay();var diff=d.getDate()-day+(day===0?-6:1);var mon=new Date(d);mon.setDate(diff);mon.setHours(0,0,0,0);var jan1=new Date(mon.getFullYear(),0,1);var wk=Math.floor((mon-jan1)/(7*864e5))+1;return mon.getFullYear()+"-W"+wk;}
export function shuffle(a){var b=a.slice();for(var i=b.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=b[i];b[i]=b[j];b[j]=t;}return b;}
export function srand(s){var x=Math.sin(s)*10000;return x-Math.floor(x);}
// ─── Name normalization (accent-insensitive + lowercase) ───
export function normalizeName(s){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();}
