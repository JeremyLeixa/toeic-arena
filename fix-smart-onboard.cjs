/**
 * TOEIC Arena — Smart Onboarding: Name Recognition Flow
 * 
 * Usage: node fix-smart-onboard.cjs
 * 
 * What this does:
 *  1. Adds name lookup on "Next" — queries Supabase for existing accounts
 *  2. New "recognize" step: shows found groups, student picks theirs
 *  3. "I'm new" button falls through to normal class code entry
 *  4. Visitor button gets a confirmation step
 *  5. Removes now-redundant "I already have an account" link
 *  6. Fixes mission priority bug (never-tried modules = 100)
 *  7. Changes teacher dashboard password
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(process.cwd(), 'src', 'App.jsx');

if (!fs.existsSync(FILE)) {
  console.error('❌ src/App.jsx not found. Run this from your project root.');
  process.exit(1);
}

const backup = FILE + '.bak-onboard';
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

// ═══════════════════════════════════════════
// FIX 1: Mission priority (never-tried = 100)
// ═══════════════════════════════════════════
console.log('\n📦 Fix 1: Mission priority');

replace(
  `candidates.push({mod:m,priority:0,reason:"You haven't tried this yet!"});`,
  `candidates.push({mod:m,priority:100,reason:"You haven't tried this yet!"});`,
  'Never-tried modules priority 0 → 100'
);

// ═══════════════════════════════════════════
// FIX 2: Teacher password
// ═══════════════════════════════════════════
console.log('\n📦 Fix 2: Teacher dashboard password');

replace(
  `var TEACHER_CODE="idrac2026";`,
  `var TEACHER_CODE="arena-teacher-2026";`,
  'Teacher code changed'
);

// ═══════════════════════════════════════════
// FIX 3: Add lookup states + function
// ═══════════════════════════════════════════
console.log('\n📦 Fix 3: Smart onboarding states + lookup');

replace(
  `var[recName,setRecName]=useState("");var[recCode,setRecCode]=useState("");var[recMsg,setRecMsg]=useState(null);var[recLoading,setRecLoading]=useState(false);`,
  `var[recName,setRecName]=useState("");var[recCode,setRecCode]=useState("");var[recMsg,setRecMsg]=useState(null);var[recLoading,setRecLoading]=useState(false);
  var[foundAccounts,setFoundAccounts]=useState([]);var[lookingUp,setLookingUp]=useState(false);var[visitorConfirm,setVisitorConfirm]=useState(false);

  async function lookupName(n){
    setLookingUp(true);
    try{
      var res=await supabase.from('students').select('name,class_code,xp').eq('name',n.trim());
      if(res.data&&res.data.length>0){
        var groupRes=await supabase.from('groups').select('code,name,type');
        var groupMap={};
        if(groupRes.data)groupRes.data.forEach(function(g){groupMap[g.code]={name:g.name,type:g.type};});
        var accounts=res.data.map(function(s){
          var g=groupMap[s.class_code];
          return{class_code:s.class_code,xp:s.xp||0,
            groupName:g?g.name:(s.class_code==="visitor"?"Visitor / Free Access":s.class_code),
            groupType:g?g.type:"visitor",
            typeIcon:g?(g.type==="school"?"🏫":g.type==="pro"?"💼":"🌍"):"🌍"};
        });
        setFoundAccounts(accounts);
        sSt("recognize");
      } else {
        setFoundAccounts([]);
        sSt("classcode");
      }
    }catch(e){sSt("classcode");}
    setLookingUp(false);
  }`,
  'Add lookup states + function'
);

// ═══════════════════════════════════════════
// FIX 4: Change "Next" button to trigger lookup
// ═══════════════════════════════════════════
console.log('\n📦 Fix 4: Name step → lookup on Next');

replace(
  `<button className="btn1" onClick={function(){if(name.trim())sSt("classcode");}}
          style={{opacity:name.trim()?1:.4,pointerEvents:name.trim()?"auto":"none",fontSize:18,padding:"16px 32px"}}>Next</button>
        <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:20}}>
          <button onClick={function(){sSt("recover");}} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>I already have an account</button>
          <button onClick={function(){sSt("teacher");}} style={{background:"none",border:"none",color:"var(--t3)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Teacher access</button>
        </div>`,
  `<button className="btn1" onClick={function(){if(name.trim()&&!lookingUp)lookupName(name);}} disabled={lookingUp}
          style={{opacity:name.trim()&&!lookingUp?1:.4,pointerEvents:name.trim()&&!lookingUp?"auto":"none",fontSize:18,padding:"16px 32px"}}>{lookingUp?"Checking...":"Next"}</button>
        <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:20}}>
          <button onClick={function(){sSt("teacher");}} style={{background:"none",border:"none",color:"var(--t3)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Teacher access</button>
        </div>`,
  'Name step: Next → lookup + remove "I already have an account"'
);

// ═══════════════════════════════════════════
// FIX 5: Insert "recognize" step before classcode step
// ═══════════════════════════════════════════
console.log('\n📦 Fix 5: Add recognize step');

replace(
  `  // ─ Class code selection ─
  if(step==="classcode")return(`,
  `  // ─ Account recognition ─
  if(step==="recognize")return(
    <div className="app" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s",width:"100%",maxWidth:380}}>
        <div style={{fontSize:48,marginBottom:12}}>👋</div>
        <h2 className="out" style={{fontWeight:800,fontSize:24,marginBottom:6}}>Welcome back, {name.trim()}!</h2>
        <p style={{color:"var(--t2)",fontSize:13,marginBottom:24,lineHeight:1.5}}>We found your account. Select your group to continue:</p>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
          {foundAccounts.map(function(acc){
            return(<button key={acc.class_code} onClick={async function(){
              var ok=await p.recover(name.trim(),acc.class_code);
              if(!ok){sSt("classcode");}
            }} className="crd" style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",cursor:"pointer",
              border:"1px solid var(--bdr)",background:"var(--bg2)",borderRadius:16,textAlign:"left",
              transition:"all .2s",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:44,height:44,borderRadius:12,
                background:acc.groupType==="school"?"rgba(212,148,58,.1)":acc.groupType==="pro"?"rgba(200,122,53,.1)":"rgba(139,94,131,.1)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{acc.typeIcon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div className="out" style={{fontWeight:700,fontSize:15,color:"var(--t1)",marginBottom:2}}>{acc.groupName}</div>
                <div style={{fontSize:11,color:"var(--t3)"}}>{acc.class_code} · {acc.xp} XP</div>
              </div>
              <div style={{color:"var(--cyan)",fontSize:16}}>→</div>
            </button>);
          })}
        </div>
        <div style={{position:"relative",margin:"16px 0",display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,height:1,background:"var(--bdr)"}}/>
          <span style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1}} className="out">not you?</span>
          <div style={{flex:1,height:1,background:"var(--bdr)"}}/>
        </div>
        <button className="btn2" onClick={function(){setFoundAccounts([]);sSt("classcode");}}
          style={{width:"100%",fontSize:14,padding:"12px 24px"}}>I'm new — create an account</button>
        <button onClick={function(){sSt("name");}} style={{marginTop:16,background:"none",border:"none",color:"var(--t3)",fontSize:13,cursor:"pointer"}}>← Back</button>
      </div>
    </div>);

  // ─ Class code selection ─
  if(step==="classcode")return(`,
  'Add recognize step'
);

// ═══════════════════════════════════════════
// FIX 6: Visitor button → confirmation
// ═══════════════════════════════════════════
console.log('\n📦 Fix 6: Visitor button with confirmation');

replace(
  `<button className="btn2" onClick={function(){setClassCode("visitor");setClassValid(true);setClassGroupName("Visiteur / Free Access");}}
          style={{width:"100%",fontSize:14,padding:"12px 24px",borderColor:"rgba(139,94,131,.3)",color:"var(--purple)"}}>🌍 Join as Visitor</button>`,
  `{!visitorConfirm?<button className="btn2" onClick={function(){setVisitorConfirm(true);}}
          style={{width:"100%",fontSize:14,padding:"12px 24px",borderColor:"rgba(139,94,131,.3)",color:"var(--purple)"}}>🌍 Join as Visitor</button>
        :<div style={{animation:"fadeIn .3s",padding:16,background:"rgba(139,94,131,.08)",border:"1px solid rgba(139,94,131,.2)",borderRadius:14}}>
          <p style={{fontSize:13,color:"var(--t1)",lineHeight:1.6,marginBottom:12}}>⚠️ If your teacher gave you a class code, use it above — otherwise your progress won't appear in your group!</p>
          <div style={{display:"flex",gap:8}}>
            <button className="btn2" onClick={function(){setVisitorConfirm(false);}} style={{flex:1,fontSize:12,padding:"10px 8px"}}>Cancel</button>
            <button className="btn2" onClick={function(){setClassCode("visitor");setClassValid(true);setClassGroupName("Visitor / Free Access");setVisitorConfirm(false);}}
              style={{flex:1,fontSize:12,padding:"10px 8px",borderColor:"rgba(139,94,131,.3)",color:"var(--purple)"}}>Continue as Visitor</button>
          </div>
        </div>}`,
  'Visitor button with confirmation'
);

// ═══════════════════════════════════════════
// Done
// ═══════════════════════════════════════════
fs.writeFileSync(FILE, code, 'utf-8');

console.log(`\n${'═'.repeat(50)}`);
console.log(`✅ Done! ${changes} patches applied.`);
console.log(`📁 Backup at: ${backup}`);
console.log(`\n💡 What changed:`);
console.log(`   • Name → Next now queries Supabase for existing accounts`);
console.log(`   • New "recognize" screen shows matching groups`);
console.log(`   • "I already have an account" link removed (now automatic)`);
console.log(`   • Visitor button shows confirmation warning`);
console.log(`   • Mission priority: never-tried modules = 100 (was 0)`);
console.log(`   • Teacher password: "arena-teacher-2026" (was "idrac2026")`);
console.log(`\n⚠️  IMPORTANT: Note your new teacher code: arena-teacher-2026`);
console.log(`${'═'.repeat(50)}`);
