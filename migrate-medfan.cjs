/**
 * TOEIC Arena — Visual DA Migration: "Cyber Neon" → "Torch-Lit Arena"
 * 
 * Usage: node migrate-medfan.cjs
 * 
 * Run from your project root (where App.jsx lives in src/).
 * Creates a backup at src/App.jsx.bak before modifying.
 * 
 * What this does:
 *  1. Swaps CSS :root variables (dark + light mode)
 *  2. Adds Cinzel font import
 *  3. Updates .out class and .btn1/.btn2 to use Cinzel
 *  4. Replaces all hardcoded identity colors (#00d4ff, #a855f7, etc.)
 *  5. Warms up rgba() tints throughout
 *  6. Updates tab bar, glow, achievement toast, etc.
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(process.cwd(), 'src', 'App.jsx');

if (!fs.existsSync(FILE)) {
  console.error('❌ src/App.jsx not found. Run this from your project root.');
  process.exit(1);
}

// Backup
const backup = FILE + '.bak';
fs.copyFileSync(FILE, backup);
console.log(`✅ Backup created: ${backup}`);

let code = fs.readFileSync(FILE, 'utf-8');
const original = code;
let changes = 0;

function replace(search, replacement, label) {
  const before = code;
  if (typeof search === 'string') {
    // Count occurrences
    let count = 0;
    let idx = -1;
    while ((idx = code.indexOf(search, idx + 1)) !== -1) count++;
    if (count > 0) {
      code = code.split(search).join(replacement);
      changes += count;
      console.log(`  🔄 ${label || search} → ${count} replacement(s)`);
    }
  } else {
    // Regex
    const matches = code.match(search);
    const count = matches ? matches.length : 0;
    if (count > 0) {
      code = code.replace(search, replacement);
      changes += count;
      console.log(`  🔄 ${label || search.toString()} → ${count} replacement(s)`);
    }
  }
}

// ═══════════════════════════════════════════
// PHASE 1: CSS Variables
// ═══════════════════════════════════════════
console.log('\n📦 Phase 1: CSS Variables');

// Dark mode :root
replace(
  `:root{--bg:#080b16;--bg2:#131833;--bg3:#1a2045;--bdr:rgba(100,130,255,0.08);--cyan:#00d4ff;--orange:#ff8c42;--gold:#ffd700;--green:#00e676;--red:#ff4757;--purple:#a855f7;--t1:#eef2ff;--t2:#7b86a8;--t3:#4a5478}`,
  `:root{--bg:#0f0c08;--bg2:#1a1610;--bg3:#28221a;--bdr:rgba(180,140,80,0.08);--cyan:#d4943a;--orange:#c87a35;--gold:#f0c850;--green:#4abe60;--red:#e05252;--purple:#8b5e83;--t1:#ede4d4;--t2:#8a7e6a;--t3:#5a5040}`,
  ':root variables (dark mode)'
);

// Light mode
replace(
  `.light{--bg:#f5f5f7;--bg2:#ffffff;--bg3:#e8e8ed;--bdr:rgba(0,0,0,0.1);--cyan:#006faa;--orange:#c96a12;--gold:#a67c00;--green:#15803d;--red:#c42020;--purple:#6d28d9;--t1:#111827;--t2:#3f4456;--t3:#6b6f82}`,
  `.light{--bg:#f5f0e8;--bg2:#fffcf5;--bg3:#e8e0d2;--bdr:rgba(120,90,50,0.1);--cyan:#8b6914;--orange:#a05a10;--gold:#a67c00;--green:#15803d;--red:#b82020;--purple:#6b3d62;--t1:#1a1510;--t2:#5a5040;--t3:#8a7e6a}`,
  '.light variables'
);

// ═══════════════════════════════════════════
// PHASE 2: Fonts
// ═══════════════════════════════════════════
console.log('\n📦 Phase 2: Fonts (Cinzel)');

// Add Cinzel to Google Fonts import
replace(
  `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap')`,
  `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap')`,
  'Google Fonts import (+Cinzel)'
);

// .out class: Outfit → Cinzel (headings)
replace(
  `.out{font-family:'Outfit',sans-serif}`,
  `.out{font-family:'Cinzel','Outfit',serif;letter-spacing:0.5px}`,
  '.out heading font'
);

// .btn1 font: Outfit → Cinzel
replace(
  `.btn1{background:linear-gradient(135deg,#00d4ff,#0088cc);color:#fff;border:none;border-radius:12px;padding:14px 28px;font-family:'Outfit',sans-serif;font-weight:700;font-size:16px;cursor:pointer;width:100%;transition:all .2s}`,
  `.btn1{background:linear-gradient(135deg,#d4943a,#a06e20);color:#0f0c08;border:none;border-radius:12px;padding:14px 28px;font-family:'Cinzel','Outfit',serif;font-weight:700;font-size:16px;cursor:pointer;width:100%;transition:all .2s}`,
  '.btn1 (gradient + font)'
);

// .btn2 font: Outfit → Cinzel
replace(
  `.btn2{background:var(--bg2);border:1px solid var(--bdr);color:var(--t1);border-radius:12px;padding:12px 24px;font-family:'Outfit',sans-serif;font-weight:600;font-size:14px;cursor:pointer}`,
  `.btn2{background:var(--bg2);border:1px solid var(--bdr);color:var(--t1);border-radius:12px;padding:12px 24px;font-family:'Cinzel','Outfit',serif;font-weight:600;font-size:14px;cursor:pointer}`,
  '.btn2 font'
);

// ═══════════════════════════════════════════
// PHASE 3: Structural hardcoded colors (glow, tab bar, toast)
// ═══════════════════════════════════════════
console.log('\n📦 Phase 3: Structural elements');

// .glo box-shadow: cyan glow → warm amber glow
replace(
  `.glo{box-shadow:0 0 30px rgba(0,212,255,.06)}`,
  `.glo{box-shadow:0 0 30px rgba(212,148,58,.06)}`,
  '.glo warm glow'
);

// .crd — add subtle inner highlight for "gilded edge" feel
replace(
  `.crd{background:var(--bg2);border:1px solid var(--bdr);border-radius:16px;padding:20px}`,
  `.crd{background:var(--bg2);border:1px solid var(--bdr);border-radius:16px;padding:20px;box-shadow:inset 0 1px 0 rgba(180,140,80,.04)}`,
  '.crd gilded edge'
);

// Tab bar: hardcoded #080b16 and rgba(8,11,22)
replace(
  `linear-gradient(180deg,rgba(8,11,22,0) 0%,rgba(8,11,22,.95) 20%,#080b16 100%)`,
  `linear-gradient(180deg,rgba(15,12,8,0) 0%,rgba(15,12,8,.95) 20%,#0f0c08 100%)`,
  'Tab bar gradient'
);

// Achievement toast background
replace(
  `background:"linear-gradient(135deg,#1a1a2e,#16213e)"`,
  `background:"linear-gradient(135deg,#1a1610,#201a12)"`,
  'Achievement toast bg'
);

// ═══════════════════════════════════════════
// PHASE 4: Identity gradient patterns (most impactful)
// These are ordered from most specific to least specific
// to avoid double-replacement issues
// ═══════════════════════════════════════════
console.log('\n📦 Phase 4: Identity gradients');

// Cyan-to-purple gradient (used everywhere: bars, badges, avatars, title)
replace(
  `linear-gradient(135deg,#00d4ff,#a855f7)`,
  `linear-gradient(135deg,#d4943a,#8b5e83)`,
  'gradient cyan→purple (135deg)'
);

replace(
  `linear-gradient(90deg,#00d4ff,#a855f7)`,
  `linear-gradient(90deg,#d4943a,#8b5e83)`,
  'gradient cyan→purple (90deg)'
);

// Cyan-to-blue gradient (buttons, level badge)
replace(
  `linear-gradient(135deg,#00d4ff,#0088cc)`,
  `linear-gradient(135deg,#d4943a,#a06e20)`,
  'gradient cyan→blue'
);

// Bar component default gradient
replace(
  `linear-gradient(90deg,#00d4ff,#0088ff)`,
  `linear-gradient(90deg,#d4943a,#c87a35)`,
  'Bar default gradient'
);

// Cyan-to-green (Clue Hunter icon)
replace(
  `linear-gradient(135deg,#00d4ff,#10b981)`,
  `linear-gradient(135deg,#d4943a,#4abe60)`,
  'gradient cyan→green'
);

// ═══════════════════════════════════════════
// PHASE 5: Module card gradients (warm up the specific modules)
// ═══════════════════════════════════════════
console.log('\n📦 Phase 5: Module gradients');

// Purple-to-pink (Connectors, Mock 2)
replace(
  `linear-gradient(135deg,#a855f7,#ec4899)`,
  `linear-gradient(135deg,#8b5e83,#c4587a)`,
  'gradient purple→pink'
);

// Purple-to-indigo (Strategy Quiz)
replace(
  `linear-gradient(135deg,#a855f7,#6366f1)`,
  `linear-gradient(135deg,#8b5e83,#5a5c8a)`,
  'gradient purple→indigo'
);

// Red-to-purple (Duel Arena, WordFall icons)
replace(
  `linear-gradient(135deg,#ff4757,#a855f7)`,
  `linear-gradient(135deg,#c84040,#8b5e83)`,
  'gradient red→purple'
);

// Purple-to-pink 90deg (Part 6 progress bar)
replace(
  `linear-gradient(90deg,#a855f7,#ec4899)`,
  `linear-gradient(90deg,#8b5e83,#c4587a)`,
  'gradient purple→pink (90deg)'
);

// Pink-to-purple (Part 6 bar, Part 7 results icon)
replace(
  `linear-gradient(90deg,#ec4899,#a855f7)`,
  `linear-gradient(90deg,#c4587a,#8b5e83)`,
  'gradient pink→purple (90deg)'
);

replace(
  `linear-gradient(135deg,#ec4899,#a855f7)`,
  `linear-gradient(135deg,#c4587a,#8b5e83)`,
  'gradient pink→purple (135deg)'
);

// Sky-blue-to-purple (Part 5 bar)
replace(
  `linear-gradient(90deg,#0ea5e9,#a855f7)`,
  `linear-gradient(90deg,#b07830,#8b5e83)`,
  'gradient sky→purple'
);

// Blue-to-purple (Reading Practice, Grammar Ref)
replace(
  `linear-gradient(135deg,#3b82f6,#8b5cf6)`,
  `linear-gradient(135deg,#5a7a9a,#7a5a80)`,
  'gradient blue→purple (module cards)'
);

// ═══════════════════════════════════════════
// PHASE 6: Remaining hardcoded hex colors
// ═══════════════════════════════════════════
console.log('\n📦 Phase 6: Remaining hardcoded hex');

// Any remaining standalone #00d4ff (chart lines, dots, etc.)
replace(`"#00d4ff"`, `"#d4943a"`, 'standalone #00d4ff');
replace(`'#00d4ff'`, `'#d4943a'`, 'standalone #00d4ff (single quotes)');

// Standalone #a855f7
replace(`"#a855f7"`, `"#8b5e83"`, 'standalone #a855f7');
replace(`'#a855f7'`, `'#8b5e83'`, 'standalone #a855f7 (single quotes)');

// Chart colors array — warm up the first entries, keep variety
replace(
  `var CHART_COLORS=["#d4943a","#8b5e83","#ff8c42","#ffd700","#00e676","#ff4757","#ec4899","#3b82f6","#06b6d4","#f59e0b","#8b5cf6","#14b8a6"]`,
  `var CHART_COLORS=["#d4943a","#8b5e83","#c87a35","#f0c850","#4abe60","#e05252","#c4587a","#5a7a9a","#2a9a8a","#d4943a","#7a5a80","#3a9080"]`,
  'CHART_COLORS array'
);

// Prep drill color for "with" preposition
replace(`with:"#a855f7"`, `with:"#8b5e83"`, 'prep color: with');

// Grammar ref connectors color
replace(`color:"#a855f7"`, `color:"#8b5e83"`, 'grammar ref connectors color');

// ═══════════════════════════════════════════
// PHASE 7: All rgba() tints
// (These create the subtle colored backgrounds on cards and buttons)
// ═══════════════════════════════════════════
console.log('\n📦 Phase 7: rgba() tints');

// Cyan tints → amber tints
replace(/rgba\(0,212,255/g, 'rgba(212,148,58', 'rgba cyan → amber');

// Purple tints → mystic tints
replace(/rgba\(168,85,247/g, 'rgba(139,94,131', 'rgba purple → mystic');

// Sky-blue tints (Strategy tip card)
replace(/rgba\(14,165,233/g, 'rgba(180,140,80', 'rgba sky-blue → warm');

// Blue border tints (old --bdr style, if any remain outside :root)
replace(/rgba\(100,130,255/g, 'rgba(180,140,80', 'rgba blue-border → warm');

// ═══════════════════════════════════════════
// PHASE 8: Specific remaining targets
// ═══════════════════════════════════════════
console.log('\n📦 Phase 8: Final details');

// Strategy Cards module bg (sky-blue to teal)
replace(
  `linear-gradient(135deg,#0ea5e9,#06b6d4)`,
  `linear-gradient(135deg,#6a8a50,#4a7a5a)`,
  'Strategy Cards gradient'
);

// Collocations grammar ref color
replace(`color:"#0ea5e9"`, `color:"#6a8a50"`, 'collocations color');

// Green bar (progress) — slightly warmer green
replace(
  `linear-gradient(90deg,#00e676,#00bfa5)`,
  `linear-gradient(90deg,#4abe60,#3a9a70)`,
  'green progress bar'
);

// Orange bar (review progress)
replace(
  `linear-gradient(90deg,#ff8c42,#ffd700)`,
  `linear-gradient(90deg,#c87a35,#f0c850)`,
  'orange review bar'
);

// ═══════════════════════════════════════════
// Done
// ═══════════════════════════════════════════
fs.writeFileSync(FILE, code, 'utf-8');

console.log(`\n${'═'.repeat(50)}`);
console.log(`✅ Migration complete! ${changes} replacements applied.`);
console.log(`📁 Backup at: ${backup}`);
console.log(`\n💡 Next steps:`);
console.log(`   1. npm run dev — check the result`);
console.log(`   2. If happy: git add . && git commit -m "feat: medfan visual DA" && git push`);
console.log(`   3. If not: cp src/App.jsx.bak src/App.jsx`);
console.log(`${'═'.repeat(50)}`);
