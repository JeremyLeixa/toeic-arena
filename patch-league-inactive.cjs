/**
 * patch-league-inactive.cjs
 * ─────────────────────────────────────────────────────────────────
 * Affiche TOUS les étudiants dans la vue League Week, quel que soit
 * leur week_id. Ceux dont week_id != semaine courante reçoivent :
 *   - un flag `inactive: true`
 *   - un badge "⏸ Inactive" grisé sous leur nom
 *   - un style légèrement atténué dans la row
 *   - classement séparé : actifs d'abord, inactifs ensuite
 *
 * Usage : node patch-league-inactive.cjs
 * (depuis la racine du projet toeic-arena)
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const APP_PATH = path.resolve(__dirname, 'src/App.jsx');

if (!fs.existsSync(APP_PATH)) {
  console.error('❌  src/App.jsx introuvable');
  process.exit(1);
}

const buf      = fs.readFileSync(APP_PATH);
const original = buf.toString('utf8');
let   patched  = original;

const backupPath = APP_PATH + '.bak-inactive';
fs.writeFileSync(backupPath, buf);
console.log(`📦  Backup : ${path.basename(backupPath)}`);

// ── Helper ───────────────────────────────────────────────────────
function apply(label, oldStr, newStr) {
  if (!patched.includes(oldStr)) {
    console.error(`\n❌  [${label}] Pattern introuvable.`);
    console.error('    Déjà patché ou fichier divergé.');
    process.exit(1);
  }
  const n = patched.split(oldStr).length - 1;
  if (n > 1) {
    console.error(`❌  [${label}] Ambigu (${n} occurrences).`);
    process.exit(1);
  }
  patched = patched.replace(oldStr, newStr);
  console.log(`✅  [${label}]`);
}

// ─────────────────────────────────────────────────────────────────
// PATCH 1 — weekAll : ajouter flag inactive + garder xp réel
// On remplace uniquement la fin de la ligne (sans l'emoji avatar)
// ─────────────────────────────────────────────────────────────────
// OLD : ...return{name:r.name,avatar:r.avatar||"⚔️",xp:xp,me:r.name===u.name};});
// On cible la partie après l'emoji pour éviter les problèmes d'encodage
apply(
  'PATCH 1 — weekAll inactive flag',
  `,xp:xp,me:r.name===u.name};});
if(u.name!=="Teacher"&&!weekAll.find(function(a){return a.me;}))weekAll.push({name:u.name,avatar:u.avatar||`,
  `,xp:(r.weekly_xp||0),inactive:r.week_id!==cw,me:r.name===u.name};});
if(u.name!=="Teacher"&&!weekAll.find(function(a){return a.me;}))weekAll.push({name:u.name,avatar:u.avatar||`
);

// ─────────────────────────────────────────────────────────────────
// PATCH 2 — Sort : actifs par XP desc, puis inactifs par XP desc
// ─────────────────────────────────────────────────────────────────
apply(
  'PATCH 2 — tri actifs/inactifs',
  `weekAll.sort(function(a,b){return b.xp-a.xp;});`,
  `weekAll.sort(function(a,b){
  if(a.inactive!==b.inactive)return a.inactive?1:-1; // actifs d'abord
  return b.xp-a.xp;
});`
);

// ─────────────────────────────────────────────────────────────────
// PATCH 3 — weekRank : calculé uniquement sur les actifs
// ─────────────────────────────────────────────────────────────────
apply(
  'PATCH 3 — weekRank sur actifs uniquement',
  `var weekFiltered=weekAll.filter(function(pl){return getLeague(pl.xp).id===lg.id;});
var weekRank=weekFiltered.findIndex(function(pl){return pl.me;})+1;`,
  `var weekActive=weekAll.filter(function(pl){return !pl.inactive;});
var weekFiltered=weekActive.filter(function(pl){return getLeague(pl.xp).id===lg.id;});
var weekRank=weekFiltered.findIndex(function(pl){return pl.me;})+1;`
);

// ─────────────────────────────────────────────────────────────────
// PATCH 4 — Rendu de la row : badge inactive + style atténué
// On remplace le bloc complet de la row dans le week tab
// ─────────────────────────────────────────────────────────────────
apply(
  'PATCH 4 — row rendu avec badge inactive',

  // OLD
  `return(<div key={pl.name} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:pl.me?"rgba(212,148,58,.08)":"var(--bg2)",border:pl.me?"1.5px solid rgba(212,148,58,.25)":"1px solid var(--bdr)",borderRadius:12}}>
            <div className="out" style={{width:28,textAlign:"center",fontWeight:800,fontSize:14,color:i<3?"var(--gold)":"var(--t3)"}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div>
            <div style={{fontSize:20,width:28,textAlign:"center"}}>{pl.avatar}</div>
            <div style={{flex:1}}>
              <div className="out" style={{fontWeight:pl.me?700:500,fontSize:14,color:pl.me?"var(--cyan)":"var(--t1)"}}>{pl.me?pl.name+" (You)":pl.name}</div>
              {isTeacher&&<div style={{fontSize:10,color:plLg.color,fontWeight:600}}>{plLg.icon} {plLg.name}</div>}
            </div>
            <div className="out" style={{fontWeight:700,fontSize:14,color:pl.me?"var(--cyan)":"var(--t2)"}}>{pl.xp} XP</div>
          </div>);`,

  // NEW
  `return(<div key={pl.name} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:pl.me?"rgba(212,148,58,.08)":pl.inactive?"var(--bg1)":"var(--bg2)",border:pl.me?"1.5px solid rgba(212,148,58,.25)":"1px solid var(--bdr)",borderRadius:12,opacity:pl.inactive?0.55:1}}>
            <div className="out" style={{width:28,textAlign:"center",fontWeight:800,fontSize:14,color:(!pl.inactive&&i<3)?"var(--gold)":"var(--t3)"}}>{pl.inactive?"—":i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div>
            <div style={{fontSize:20,width:28,textAlign:"center"}}>{pl.avatar}</div>
            <div style={{flex:1}}>
              <div className="out" style={{fontWeight:pl.me?700:500,fontSize:14,color:pl.me?"var(--cyan)":pl.inactive?"var(--t3)":"var(--t1)"}}>{pl.me?pl.name+" (You)":pl.name}</div>
              {pl.inactive&&<div style={{fontSize:10,color:"var(--t3)",fontWeight:500}}>{"⏸ Inactive this week"}</div>}
              {!pl.inactive&&isTeacher&&<div style={{fontSize:10,color:plLg.color,fontWeight:600}}>{plLg.icon} {plLg.name}</div>}
            </div>
            <div className="out" style={{fontWeight:700,fontSize:14,color:pl.me?"var(--cyan)":pl.inactive?"var(--t3)":"var(--t2)"}}>{pl.inactive?"—":pl.xp+" XP"}</div>
          </div>);`
);

// ─────────────────────────────────────────────────────────────────
// PATCH 5 — showAllLeagues filtre : prendre en compte les inactifs
// Le filtre "ma ligue" ne doit s'appliquer qu'aux actifs ;
// les inactifs passent toujours (on veut tout le monde visible)
// ─────────────────────────────────────────────────────────────────
apply(
  'PATCH 5 — showAllLeagues filtre ligue sur actifs seulement',
  `var displayed=isTeacher?active:(showAllLeagues?active:active.filter(function(pl){return getLeague(pl.xp).id===lg.id;}));
    var hidden=isTeacher?[]:(active.filter(function(pl){return getLeague(pl.xp).id!==lg.id;}));`,
  `var displayed=isTeacher?active:(showAllLeagues?active:active.filter(function(pl){return pl.inactive||getLeague(pl.xp).id===lg.id;}));
    var hidden=isTeacher?[]:(active.filter(function(pl){return !pl.inactive&&getLeague(pl.xp).id!==lg.id;}));`
);

// ─────────────────────────────────────────────────────────────────
// Écriture
// ─────────────────────────────────────────────────────────────────
fs.writeFileSync(APP_PATH, patched, 'utf8');

console.log('');
console.log('🎉  Patch appliqué — src/App.jsx mis à jour.');
console.log('    npm run dev  →  vérifie la vue League  →  git push');
console.log(`    Rollback : copy "${path.basename(backupPath)}" src\\App.jsx`);
