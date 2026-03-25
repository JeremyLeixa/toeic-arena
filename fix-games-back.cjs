/**
 * TOEIC Arena — Fix Clue Hunter + Uniformize Back buttons in Games
 * 
 * Usage: node fix-games-back.cjs
 * Run from project root (where src/App.jsx lives).
 * 
 * What this does:
 *  1. Adds missing CLUE_HUNTER import (fixes black screen)
 *  2. Replaces top-left "Quit" with spacer in 4 game gameplay screens
 *  3. Adds btn2 "Back" at the bottom of each gameplay screen
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(process.cwd(), 'src', 'App.jsx');

if (!fs.existsSync(FILE)) {
  console.error('❌ src/App.jsx not found. Run this from your project root.');
  process.exit(1);
}

const backup = FILE + '.bak-games';
fs.copyFileSync(FILE, backup);
console.log(`✅ Backup created: ${backup}`);

let code = fs.readFileSync(FILE, 'utf-8');
let changes = 0;

function replace(search, replacement, label) {
  if (typeof search === 'string') {
    const idx = code.indexOf(search);
    if (idx === -1) {
      console.log(`  ⚠️  NOT FOUND: ${label}`);
      return false;
    }
    // Check uniqueness
    const second = code.indexOf(search, idx + 1);
    if (second !== -1 && label.indexOf('(all)') === -1) {
      console.log(`  ⚠️  MULTIPLE MATCHES (${label}) — using replaceAll`);
      code = code.split(search).join(replacement);
      changes++;
      return true;
    }
    code = code.substring(0, idx) + replacement + code.substring(idx + search.length);
    changes++;
    console.log(`  ✅ ${label}`);
    return true;
  }
  return false;
}

// ═══════════════════════════════════════════
// FIX 1: Missing CLUE_HUNTER import
// ═══════════════════════════════════════════
console.log('\n📦 Fix 1: Clue Hunter import');

replace(
  `import { AUDIO_BLITZ } from "./data/audioBlitz.js";`,
  `import { AUDIO_BLITZ } from "./data/audioBlitz.js";\nimport { CLUE_HUNTER } from "./data/clueHunter.js";`,
  'Add CLUE_HUNTER import'
);

// ═══════════════════════════════════════════
// FIX 2: SentenceBuilder — Quit → Back bottom
// ═══════════════════════════════════════════
console.log('\n📦 Fix 2: SentenceBuilder Back button');

// Remove top Quit
replace(
  `<button onClick={function(){clearInterval(timerRef.current);p.back();}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      {ph==="q"&&<span className="out" style={{fontSize:20,fontWeight:800,color:timerCol}}>{timer}s</span>}
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{TOTAL}</span>`,
  `<div/>
      {ph==="q"&&<span className="out" style={{fontSize:20,fontWeight:800,color:timerCol}}>{timer}s</span>}
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{TOTAL}</span>`,
  'SentenceBuilder: remove top Quit'
);

// Add Back button at bottom (after the last btn1 Next/Results, before closing </div>)
replace(
  `<button className="btn1" onClick={next} style={{marginTop:12}}>{ci<items.length-1?"Next":"See Results"}</button>
    </div>}
  </div>);
}

// ─── AUDIO BLITZ`,
  `<button className="btn1" onClick={next} style={{marginTop:12}}>{ci<items.length-1?"Next":"See Results"}</button>
    </div>}
    <button className="btn2" onClick={function(){clearInterval(timerRef.current);p.back();}} style={{marginTop:16,width:"100%"}}>Back</button>
  </div>);
}

// ─── AUDIO BLITZ`,
  'SentenceBuilder: add bottom Back'
);

// ═══════════════════════════════════════════
// FIX 3: AudioBlitz — Quit → Back bottom
// ═══════════════════════════════════════════
console.log('\n📦 Fix 3: AudioBlitz Back button');

// Remove top Quit
replace(
  `<button onClick={function(){clearInterval(timerRef.current);p.back();}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      {played>=2&&ph==="q"&&<span className="out" style={{fontSize:20,fontWeight:800,color:timerCol}}>{timer}s</span>}
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{TOTAL}</span>`,
  `<div/>
      {played>=2&&ph==="q"&&<span className="out" style={{fontSize:20,fontWeight:800,color:timerCol}}>{timer}s</span>}
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{TOTAL}</span>`,
  'AudioBlitz: remove top Quit'
);

// Add Back button at bottom
replace(
  `<button className="btn1" onClick={next} style={{marginTop:12}}>{ci<items.length-1?"Next":"See Results"}</button>
    </div>}
  </div>);
}

// ─── DUEL ARENA`,
  `<button className="btn1" onClick={next} style={{marginTop:12}}>{ci<items.length-1?"Next":"See Results"}</button>
    </div>}
    <button className="btn2" onClick={function(){clearInterval(timerRef.current);p.back();}} style={{marginTop:16,width:"100%"}}>Back</button>
  </div>);
}

// ─── DUEL ARENA`,
  'AudioBlitz: add bottom Back'
);

// ═══════════════════════════════════════════
// FIX 4: ClueHunter — Quit → Back bottom
// ═══════════════════════════════════════════
console.log('\n📦 Fix 4: ClueHunter Back button');

// Remove Quit from shared Header()
replace(
  `function Header(){
    return(<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
        <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1} / {TOTAL}</span>
      </div>`,
  `function Header(){
    return(<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div/>
        <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1} / {TOTAL}</span>
      </div>`,
  'ClueHunter Header: remove Quit'
);

// Phase "q" — add Back after Confirm button
replace(
  `<button className="btn1" onClick={confirmClues}
          style={{opacity:selected.length>0?1:.3,pointerEvents:selected.length>0?"auto":"none",fontSize:16}}>
          Confirm my clue{selected.length>1?"s":""} →
        </button>
      </div>
    </div>);`,
  `<button className="btn1" onClick={confirmClues}
          style={{opacity:selected.length>0?1:.3,pointerEvents:selected.length>0?"auto":"none",fontSize:16}}>
          Confirm my clue{selected.length>1?"s":""} →
        </button>
        <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button>
      </div>
    </div>);`,
  'ClueHunter phase q: add Back'
);

// Phase "clue_fb" — add Back after "Now answer" button
replace(
  `<button className="btn1" onClick={goAnswer} style={{fontSize:16}}>Now answer →</button>
      </div>
    </div>);`,
  `<button className="btn1" onClick={goAnswer} style={{fontSize:16}}>Now answer →</button>
        <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button>
      </div>
    </div>);`,
  'ClueHunter phase clue_fb: add Back'
);

// Phase "ans" — add Back after options list
replace(
  `              {opt}
            </button>);
        })}
      </div>
    </div>);`,
  `              {opt}
            </button>);
        })}
      </div>
      <button className="btn2" onClick={p.back} style={{marginTop:16,width:"100%"}}>Back</button>
    </div>);`,
  'ClueHunter phase ans: add Back'
);

// Phase "ans_fb" — add Back after Next button
replace(
  `<button className="btn1" onClick={next} style={{fontSize:16}}>
            {ci<items.length-1?"Next Question →":"See Results"}
          </button>
        </div>
      </div>);`,
  `<button className="btn1" onClick={next} style={{fontSize:16}}>
            {ci<items.length-1?"Next Question →":"See Results"}
          </button>
          <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button>
        </div>
      </div>);`,
  'ClueHunter phase ans_fb: add Back'
);

// ═══════════════════════════════════════════
// FIX 5: SpeedMatch — Quit → Back bottom
// ═══════════════════════════════════════════
console.log('\n📦 Fix 5: SpeedMatch Back button');

// Remove top Quit
replace(
  `<button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <div style={{display:"flex",gap:16,alignItems:"center"}}>
        <span className="out" style={{fontSize:16,fontWeight:800,color:"var(--cyan)",fontVariantNumeric:"tabular-nums"}}>{elapsed}s</span>
        <span style={{fontSize:12,color:"var(--t3)"}}>{moves} moves</span>`,
  `<div/>
      <div style={{display:"flex",gap:16,alignItems:"center"}}>
        <span className="out" style={{fontSize:16,fontWeight:800,color:"var(--cyan)",fontVariantNumeric:"tabular-nums"}}>{elapsed}s</span>
        <span style={{fontSize:12,color:"var(--t3)"}}>{moves} moves</span>`,
  'SpeedMatch: remove top Quit'
);

// Add Back button after tile grid
replace(
  `          }}>{tile.content}</span>):(<span style={{fontSize:22,opacity:.25}}>?</span>)}
        </div>);
      })}
    </div>
  </div>);
}

// ─── WORD FALL`,
  `          }}>{tile.content}</span>):(<span style={{fontSize:22,opacity:.25}}>?</span>)}
        </div>);
      })}
    </div>
    <button className="btn2" onClick={p.back} style={{marginTop:8,width:"100%",flexShrink:0}}>Back</button>
  </div>);
}

// ─── WORD FALL`,
  'SpeedMatch: add bottom Back'
);

// ═══════════════════════════════════════════
// Done
// ═══════════════════════════════════════════
fs.writeFileSync(FILE, code, 'utf-8');

console.log(`\n${'═'.repeat(50)}`);
console.log(`✅ Done! ${changes} patches applied.`);
console.log(`📁 Backup at: ${backup}`);
console.log(`\n💡 Next steps:`);
console.log(`   1. npm run dev — test each game`);
console.log(`   2. If happy: git add . && git commit -m "fix: clue hunter import + uniform Back buttons" && git push`);
console.log(`   3. If not: cp ${backup} src/App.jsx`);
console.log(`${'═'.repeat(50)}`);
