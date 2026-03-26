/**
 * patch-sync-fixes.cjs
 * ─────────────────────────────────────────────────────────────────
 * FIX 1 — syncToCloud : _syncDirty=false uniquement si l'upsert
 *          Supabase a réussi (supabase-js ne throw jamais).
 *
 * FIX 2 — onUnload : sendBeacon (sans auth headers → bloqué RLS)
 *          → fetch({ keepalive:true }) avec apikey + Authorization.
 *
 * Usage : node patch-sync-fixes.cjs
 * (depuis la racine du projet, là où se trouve .env)
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Config ───────────────────────────────────────────────────────
const APP_PATH  = path.resolve(__dirname, 'src/App.jsx');
const ENV_PATH  = path.resolve(__dirname, '.env');
// ─────────────────────────────────────────────────────────────────

// ── 1. Lire les clés depuis .env ─────────────────────────────────
function readEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    console.error(`❌  Fichier .env introuvable : ${envPath}`);
    process.exit(1);
  }
  const env = {};
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*(VITE_\w+)\s*=\s*(.+?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
  return env;
}

const env      = readEnv(ENV_PATH);
const ANON_KEY = env['VITE_SUPABASE_ANON_KEY'];
const SUPA_URL = env['VITE_SUPABASE_URL'];

if (!ANON_KEY || !SUPA_URL) {
  console.error('❌  VITE_SUPABASE_ANON_KEY ou VITE_SUPABASE_URL manquant dans .env');
  process.exit(1);
}
console.log(`✅  Clé anon lue depuis .env (${ANON_KEY.slice(0, 12)}…)`);

const REST_URL = SUPA_URL.replace(/\/$/, '') + '/rest/v1/students?on_conflict=name,class_code';

// ── 2. Lire App.jsx ──────────────────────────────────────────────
if (!fs.existsSync(APP_PATH)) {
  console.error(`❌  App.jsx introuvable : ${APP_PATH}`);
  process.exit(1);
}
const buf      = fs.readFileSync(APP_PATH);
const original = buf.toString('utf8');
let   patched  = original;

// ── 3. Backup ────────────────────────────────────────────────────
const backupPath = APP_PATH + '.bak-sync-fixes';
fs.writeFileSync(backupPath, buf);
console.log(`📦  Backup créé : ${path.basename(backupPath)}`);

// ── Helper ───────────────────────────────────────────────────────
function apply(label, oldStr, newStr) {
  if (!patched.includes(oldStr)) {
    console.error(`\n❌  [${label}] Pattern introuvable.`);
    console.error('    Déjà patché, ou le fichier a divergé.');
    process.exit(1);
  }
  const count = patched.split(oldStr).length - 1;
  if (count > 1) {
    console.error(`❌  [${label}] Ambigu (${count} occurrences) — annulé.`);
    process.exit(1);
  }
  patched = patched.replace(oldStr, newStr);
  console.log(`✅  [${label}]`);
}

// ─────────────────────────────────────────────────────────────────
// FIX 1 — syncToCloud
// Étape A : capturer le résultat de l'upsert dans _result
// (pattern court, sans emoji, unique dans le fichier)
// ─────────────────────────────────────────────────────────────────
apply(
  'FIX 1a — var _result = await upsert',
  `    if(!userId)return;
    await supabase.from("students").upsert({`,
  `    if(!userId)return;
    var _result=await supabase.from("students").upsert({`
);

// Étape B : remplacer le _syncDirty=false inconditionnel par une
// vérification de _result.error (fin de fonction, zéro emoji)
apply(
  'FIX 1b — _syncDirty conditionnel',
  `    },{onConflict:"name,class_code"});
    _syncDirty=false;
  }catch(e){}
}`,
  `    },{onConflict:"name,class_code"});
    if(!_result.error){_syncDirty=false;}
    else{console.warn("[SYNC] Upsert failed — will retry:",_result.error.message);}
  }catch(e){console.warn("[SYNC] Exception:",e);}
}`
);

// ─────────────────────────────────────────────────────────────────
// FIX 2 — onUnload sendBeacon → fetch keepalive
// Découpé en petits patterns sans emoji
// ─────────────────────────────────────────────────────────────────
apply(
  'FIX 2a — guard _syncDirty',
  `        if(raw&&_cachedUserId){`,
  `        if(raw&&_cachedUserId&&_syncDirty){`
);

apply(
  'FIX 2b — payload tableau (REST API l\'exige)',
  `          var payload=JSON.stringify({
            id:_cachedUserId,name:d.name,class_code:d.classCode||"idrac2026",`,
  `          var payload=JSON.stringify([{
            id:_cachedUserId,name:d.name,class_code:d.classCode||"idrac2026",`
);

apply(
  'FIX 2c — fermeture tableau + sendBeacon → fetch keepalive',
  `            daily_mod_sessions:d.dailyModSessions||{},
          });
          // sendBeacon doesn't block page close — fire and forget
          navigator.sendBeacon&&navigator.sendBeacon(
            "https://huklmklwvwwhhrrcyytq.supabase.co/rest/v1/students?on_conflict=name,class_code",
            new Blob([payload],{type:"application/json"})
          );`,
  `            daily_mod_sessions:d.dailyModSessions||{},
          }]);
          // fetch keepalive : survit à la fermeture ET envoie les auth headers
          // (sendBeacon ne peut pas envoyer Authorization → bloqué par Supabase RLS)
          try{fetch("${REST_URL}",{
            method:"POST",keepalive:true,
            headers:{
              "Content-Type":"application/json",
              "Prefer":"resolution=merge-duplicates",
              "apikey":"${ANON_KEY}",
              "Authorization":"Bearer ${ANON_KEY}"
            },
            body:payload
          });}catch(e){}`
);

// ── 4. Écrire ────────────────────────────────────────────────────
fs.writeFileSync(APP_PATH, patched, 'utf8');

console.log('');
console.log('🎉  Tous les patches appliqués sur src/App.jsx');
console.log('    → npm run dev  →  check console  →  git push');
console.log(`    Rollback : copy "${path.basename(backupPath)}" src\\App.jsx`);
