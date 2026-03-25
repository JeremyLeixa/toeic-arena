/**
 * TOEIC Arena — Medfan Icon Audit + Listening Back Fix
 * 
 * Usage: node fix-icons-medfan.cjs
 * Run from project root (where src/App.jsx lives).
 * 
 * What this does:
 *  1. Replaces anachronistic icons with medfan-appropriate alternatives
 *  2. Fixes Listening Parts 1-4 Back → ListenHub instead of Train menu
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(process.cwd(), 'src', 'App.jsx');

if (!fs.existsSync(FILE)) {
  console.error('❌ src/App.jsx not found. Run this from your project root.');
  process.exit(1);
}

const backup = FILE + '.bak-icons';
fs.copyFileSync(FILE, backup);
console.log(`✅ Backup created: ${backup}`);

let code = fs.readFileSync(FILE, 'utf-8');
let changes = 0;

function replace(search, replacement, label) {
  const idx = code.indexOf(search);
  if (idx === -1) {
    console.log(`  ⚠️  NOT FOUND: ${label}`);
    return false;
  }
  code = code.substring(0, idx) + replacement + code.substring(idx + search.length);
  changes++;
  console.log(`  ✅ ${label}`);
  return true;
}

function replaceAll(search, replacement, label) {
  let count = 0;
  while (code.indexOf(search) !== -1) {
    code = code.replace(search, replacement);
    count++;
  }
  if (count > 0) {
    changes += count;
    console.log(`  ✅ ${label} (×${count})`);
  } else {
    console.log(`  ⚠️  NOT FOUND: ${label}`);
  }
}

// ═══════════════════════════════════════════
// ICON CHANGES
// ═══════════════════════════════════════════

// ── Part 1: 📷 → 🖼️ (tableau) ──
console.log('\n📦 Part 1 — Photographs: 📷 → 🖼️');
replaceAll('📷', '🖼️', 'Part 1 icon');

// ── Part 2: 💬 → ❓ (question) ──
console.log('\n📦 Part 2 — Question-Response: 💬 → ❓');
replaceAll('💬', '❓', 'Part 2 icon');

// ── Part 3: 🗣️ → 👥 (dialogue) ──
console.log('\n📦 Part 3 — Conversations: 🗣️ → 👥');
replaceAll('🗣️', '👥', 'Part 3 icon');

// ── Part 4: 🎙️ → 📜 (parchemin/discours) ──
console.log('\n📦 Part 4 — Talks: 🎙️ → 📜');
replaceAll('🎙️', '📜', 'Part 4 icon');

// ── Listening Practice (Train menu): 🎧 → 👂 ──
// Careful: only replace Listening-context 🎧, NOT Audio Blitz 🎧
console.log('\n📦 Listening Practice: 🎧 → 👂 (selective)');

// Train menu entry
replace(
  `{id:"lis",n:"Listening Practice",d:"Parts 1-4 with audio",i:"🎧"`,
  `{id:"lis",n:"Listening Practice",d:"Parts 1-4 with audio",i:"👂"`,
  'Train menu: Listening icon'
);

// Filter tab in mock/strategy
replace(
  `{id:"Listening",l:"🎧 Listening"}`,
  `{id:"Listening",l:"👂 Listening"}`,
  'Filter tab: Listening'
);

// ListenHub intro big icon
replace(
  `<div style={{fontSize:56,marginBottom:16}}>🎧</div>`,
  `<div style={{fontSize:56,marginBottom:16}}>👂</div>`,
  'ListenHub intro icon'
);

// ── Audio Blitz: 🎧 → 🎵 ──
console.log('\n📦 Audio Blitz: 🎧 → 🎵');

// Games Hub card icon
replace(
  `flexShrink:0}}>🎧</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Audio Blitz`,
  `flexShrink:0}}>🎵</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Audio Blitz`,
  'Games Hub: Audio Blitz icon'
);

// Audio Blitz intro big icon
replace(
  `{"🎧"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Audio Blitz`,
  `{"🎵"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Audio Blitz`,
  'AudioBlitz intro icon'
);

// ── Mock Tests: 📝 → 📜 (only mock entries, not Grammar Drill or Profile) ──
console.log('\n📦 Mock Tests: 📝 → 📜 (selective)');

replace(
  `items.push({id:"mock1",n:"Mock Test 1",d:u1.ok?"Reading Half-Test · 49 Q · 37 min":u1.reasons[0],i:"📝"`,
  `items.push({id:"mock1",n:"Mock Test 1",d:u1.ok?"Reading Half-Test · 49 Q · 37 min":u1.reasons[0],i:"📜"`,
  'Mock Test 1 icon'
);

replace(
  `items.push({id:"mock2",n:"Mock Test 2",d:u2.ok?"Reading Half-Test · 49 Q · 37 min":u2.reasons[0],i:"📝"`,
  `items.push({id:"mock2",n:"Mock Test 2",d:u2.ok?"Reading Half-Test · 49 Q · 37 min":u2.reasons[0],i:"📜"`,
  'Mock Test 2 icon'
);

replace(
  `items.push({id:"mock3",n:"Mock Test 3",d:u3.ok?"Reading Half-Test · 48 Q · 37 min":u3.reasons[0],i:"📝"`,
  `items.push({id:"mock3",n:"Mock Test 3",d:u3.ok?"Reading Half-Test · 48 Q · 37 min":u3.reasons[0],i:"📜"`,
  'Mock Test 3 icon'
);

// Mock intro screen big icon
replace(
  `<div style={{fontSize:56,marginBottom:16}}>📝</div>
      <h1 className="out"`,
  `<div style={{fontSize:56,marginBottom:16}}>📜</div>
      <h1 className="out"`,
  'Mock intro screen icon'
);

// ReadingHub Part 5 card icon
replace(
  `flexShrink:0}}>📝</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14}}>Part 5`,
  `flexShrink:0}}>📜</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14}}>Part 5`,
  'ReadingHub: Part 5 icon'
);

// ── Part 6: 📄 → 📜 ──
console.log('\n📦 Part 6: 📄 → 📜');
replaceAll('📄', '📜', 'Part 6 icons');

// ── Strategy Cards: 📋 → 🗺️ ──
console.log('\n📦 Strategy Cards: 📋 → 🗺️');
replace(
  `{id:"strats",n:"Strategy Cards",d:"54 expert tips, all Parts",i:"📋"`,
  `{id:"strats",n:"Strategy Cards",d:"54 expert tips, all Parts",i:"🗺️"`,
  'Strategy Cards menu icon'
);

// ── Clue Hunter: 🔍 → 🧭 ──
console.log('\n📦 Clue Hunter: 🔍 → 🧭');

// Games Hub card
replace(
  `>{"🔍"}</div>
        <div style={{flex:1}}>
          <div className="out" style={{fontWeight:700,fontSize:15}}>Clue Hunter`,
  `>{"🧭"}</div>
        <div style={{flex:1}}>
          <div className="out" style={{fontWeight:700,fontSize:15}}>Clue Hunter`,
  'Games Hub: Clue Hunter icon'
);

// Header category label
replace(
  `{"🔍"} {items[ci].cat}`,
  `{"🧭"} {items[ci].cat}`,
  'ClueHunter header cat icon'
);

// Intro big icon
replace(
  `<div style={{fontSize:72,marginBottom:16}}>{"🔍"}</div>
        <h1 className="out" style={{fontWeight:900,fontSize:32,marginBottom:10}}>Clue Hunter`,
  `<div style={{fontSize:72,marginBottom:16}}>{"🧭"}</div>
        <h1 className="out" style={{fontWeight:900,fontSize:32,marginBottom:10}}>Clue Hunter`,
  'ClueHunter intro icon'
);

// Done screen: low score emoji
replace(
  `var emoji=pct>=80?"🏆":pct>=60?"⚔️":pct>=40?"🔍":"📚"`,
  `var emoji=pct>=80?"🏆":pct>=60?"⚔️":pct>=40?"🧭":"📚"`,
  'ClueHunter done score emoji'
);


// ═══════════════════════════════════════════
// LISTENING PARTS BACK NAVIGATION
// ═══════════════════════════════════════════
console.log('\n📦 Listening Parts: Back → ListenHub');

replace(
  `if(sp==="lisP1")return(<div className={lc}><style>{CSS}</style><ListenP1 u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);`,
  `if(sp==="lisP1")return(<div className={lc}><style>{CSS}</style><ListenP1 u={u} done={miniDone} back={function(){sSP("lis");}}/></div>);`,
  'ListenP1 back → ListenHub'
);

replace(
  `if(sp==="lisP2")return(<div className={lc}><style>{CSS}</style><ListenP2 u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);`,
  `if(sp==="lisP2")return(<div className={lc}><style>{CSS}</style><ListenP2 u={u} done={miniDone} back={function(){sSP("lis");}}/></div>);`,
  'ListenP2 back → ListenHub'
);

replace(
  `if(sp==="lisP3")return(<div className={lc}><style>{CSS}</style><ListenP3 u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);`,
  `if(sp==="lisP3")return(<div className={lc}><style>{CSS}</style><ListenP3 u={u} done={miniDone} back={function(){sSP("lis");}}/></div>);`,
  'ListenP3 back → ListenHub'
);

replace(
  `if(sp==="lisP4")return(<div className={lc}><style>{CSS}</style><ListenP4 u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);`,
  `if(sp==="lisP4")return(<div className={lc}><style>{CSS}</style><ListenP4 u={u} done={miniDone} back={function(){sSP("lis");}}/></div>);`,
  'ListenP4 back → ListenHub'
);


// ═══════════════════════════════════════════
// Done
// ═══════════════════════════════════════════
fs.writeFileSync(FILE, code, 'utf-8');

console.log(`\n${'═'.repeat(50)}`);
console.log(`✅ Done! ${changes} patches applied.`);
console.log(`📁 Backup at: ${backup}`);
console.log(`\n💡 Next steps:`);
console.log(`   1. npm run dev`);
console.log(`   2. Check: Train menu icons, ListenHub, each Part intro,`);
console.log(`      Games Hub (Clue Hunter, Audio Blitz), Mock Tests`);
console.log(`   3. Check: Part 1-4 Back buttons → should go to ListenHub`);
console.log(`   4. git commit -m "feat: medfan icons + listening back nav"`);
console.log(`${'═'.repeat(50)}`);
