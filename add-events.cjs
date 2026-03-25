/**
 * TOEIC Arena — Events System + Push via existing /api/push-send
 * 
 * Usage: node add-events.cjs
 * Requires: events-ui-fragment.txt in same directory
 * 
 * PREREQUISITES:
 * 1. Run events table SQL in Supabase (printed after script)
 * 2. Set PUSH_SECRET env var in Vercel (same value as in App.jsx)
 */

const fs = require('fs');
const path = require('path');
const FILE = path.join(process.cwd(), 'src', 'App.jsx');

if (!fs.existsSync(FILE)) { console.error('src/App.jsx not found.'); process.exit(1); }

const FRAG_PATH = path.join(__dirname, 'events-ui-fragment.txt');
if (!fs.existsSync(FRAG_PATH)) { console.error('events-ui-fragment.txt not found next to script.'); process.exit(1); }

const backup = FILE + '.bak-events';
fs.copyFileSync(FILE, backup);
console.log('Backup: ' + backup);

let code = fs.readFileSync(FILE, 'utf-8');
let changes = 0;

function replace(search, replacement, label) {
  const idx = code.indexOf(search);
  if (idx === -1) { console.log('  ⚠️  NOT FOUND: ' + label); return false; }
  code = code.substring(0, idx) + replacement + code.substring(idx + search.length);
  changes++;
  console.log('  ✅ ' + label);
  return true;
}

// ═══════════════════════════════════════════
// PATCH 1: PUSH_SECRET constant (near TEACHER_CODE)
// ═══════════════════════════════════════════
console.log('\n📦 Patch 1: Push secret constant');

replace(
  'var TEACHER_CODE="arena-teacher-2026";',
  'var TEACHER_CODE="arena-teacher-2026";\nvar PUSH_SECRET="toeic-push-2026-xyz";',
  'Add PUSH_SECRET constant'
);

// ═══════════════════════════════════════════
// PATCH 2: App state — add activeEvents + median
// ═══════════════════════════════════════════
console.log('\n📦 Patch 2: App state');

replace(
  'var[showTip,setShowTip]=useState(false);',
  'var[showTip,setShowTip]=useState(false);\n  var[activeEvents,setActiveEvents]=useState([]);\n  var[classMedianXp,setClassMedianXp]=useState(0);',
  'Add activeEvents + classMedianXp state'
);

// ═══════════════════════════════════════════
// PATCH 3: Load events + median after auth
// ═══════════════════════════════════════════
console.log('\n📦 Patch 3: Load events useEffect');

replace(
  '  // ── Auto-start Home BGM on first user interaction ──',
  `  // ── Load active events from Supabase ──
  useEffect(function(){
    if(!u)return;
    var now=new Date().toISOString();
    supabase.from('events').select('*').eq('active',true).lte('start_at',now).gte('end_at',now)
      .then(function(res){
        var evts=(res.data||[]).filter(function(e){
          return e.class_code==='all'||e.class_code===(u.classCode||'idrac2026');
        });
        setActiveEvents(evts);
      });
    supabase.from('students').select('xp').eq('class_code',u.classCode||'idrac2026')
      .then(function(res){
        if(!res.data||res.data.length<3){setClassMedianXp(0);return;}
        var xps=res.data.map(function(s){return s.xp||0;}).sort(function(a,b){return a-b;});
        var mid=Math.floor(xps.length/2);
        setClassMedianXp(xps.length%2?xps[mid]:Math.round((xps[mid-1]+xps[mid])/2));
      });
  },[u&&u.name]);

  // ── Auto-start Home BGM on first user interaction ──`,
  'Events + median loading useEffect'
);

// ═══════════════════════════════════════════
// PATCH 4: Event multiplier in addXp
// ═══════════════════════════════════════════
console.log('\n📦 Patch 4: Event multiplier in addXp');

replace(
  `      // Streak multiplier
      if(c.streak>=7){mult*=1.5;bonuses.push({label:"Streak x1.5 ("+c.streak+"d)",color:"#ff8c42"});}
      else if(c.streak>=3){mult*=1.2;bonuses.push({label:"Streak x1.2 ("+c.streak+"d)",color:"#ff8c42"});}

      amt=Math.round(baseAmt*mult);`,
  `      // Streak multiplier
      if(c.streak>=7){mult*=1.5;bonuses.push({label:"Streak x1.5 ("+c.streak+"d)",color:"#ff8c42"});}
      else if(c.streak>=3){mult*=1.2;bonuses.push({label:"Streak x1.2 ("+c.streak+"d)",color:"#ff8c42"});}

      // Event multipliers
      if(activeEvents&&activeEvents.length>0){
        activeEvents.forEach(function(ev){
          var cfg=ev.config||{};var m=cfg.multiplier||2;
          if(ev.type==="flash_hour"){mult*=m;bonuses.push({label:"\u26A1 Flash Hour x"+m,color:"#f0c850"});}
          if(ev.type==="underdog"&&c.xp<classMedianXp){mult*=m;bonuses.push({label:"\uD83D\uDCAA Underdog x"+m,color:"#4abe60"});}
        });
      }

      amt=Math.round(baseAmt*mult);`,
  'Event multiplier logic in addXp'
);

// ═══════════════════════════════════════════
// PATCH 5: Spotlight helper + miniDone
// ═══════════════════════════════════════════
console.log('\n📦 Patch 5: Spotlight boost');

replace(
  '  function nav(pg,arg){stopBGM();sSP(pg);sSPA(arg||null);}',
  `  function getSpotlightMult(modId){
    if(!activeEvents)return 1;
    var m=1;
    activeEvents.forEach(function(ev){
      if(ev.type==="spotlight"&&ev.config&&ev.config.module===modId)m=ev.config.multiplier||2;
    });
    return m;
  }
  function nav(pg,arg){stopBGM();sSP(pg);sSPA(arg||null);}`,
  'getSpotlightMult helper'
);

replace(
  'function miniDone(sc,tot,xp){var modId=sp||"unknown";var gxp=applyXpGates(xp,sc,tot,modId);var c=addXp(gxp);',
  'function miniDone(sc,tot,xp){var modId=sp||"unknown";var gxp=applyXpGates(xp,sc,tot,modId);gxp=Math.round(gxp*getSpotlightMult(modId));var c=addXp(gxp);',
  'Spotlight in miniDone'
);

// ═══════════════════════════════════════════
// PATCH 6: Pass events to Home
// ═══════════════════════════════════════════
console.log('\n📦 Patch 6: Pass events to Home');

replace(
  '{tab==="home"&&<Home u={u} nav={nav} onMount={function(){playBGM("bgm_home");}} onLeave={function(){stopBGM();}}/>}',
  '{tab==="home"&&<Home u={u} nav={nav} events={activeEvents} medianXp={classMedianXp} onMount={function(){playBGM("bgm_home");}} onLeave={function(){stopBGM();}}/>}',
  'Pass events to Home'
);

// ═══════════════════════════════════════════
// PATCH 7: Event banner + pills in Home
// ═══════════════════════════════════════════
console.log('\n📦 Patch 7: Event banner + pills');

replace(
  `<div className="crd glo" style={{marginBottom:16}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>`,
  `{/* Active Events Banner */}
{p.events&&p.events.length>0&&p.events.map(function(ev,ei){
  var cfg=ev.config||{};var m=cfg.multiplier||2;
  var end=new Date(ev.end_at);var now=new Date();var hoursLeft=Math.max(0,Math.round((end-now)/36e5));
  var timeLabel=hoursLeft>=24?Math.floor(hoursLeft/24)+"d "+hoursLeft%24+"h left":hoursLeft+"h left";
  var icon=ev.type==="spotlight"?"\uD83C\uDFAF":ev.type==="flash_hour"?"\u26A1":"\uD83D\uDCAA";
  var bg=ev.type==="spotlight"?"rgba(212,148,58,.1)":ev.type==="flash_hour"?"rgba(240,200,80,.12)":"rgba(74,190,96,.1)";
  var bd=ev.type==="spotlight"?"rgba(212,148,58,.25)":ev.type==="flash_hour"?"rgba(240,200,80,.3)":"rgba(74,190,96,.25)";
  var col=ev.type==="spotlight"?"var(--cyan)":ev.type==="flash_hour"?"var(--gold)":"var(--green)";
  var isUnderdog=ev.type==="underdog";
  var qualifies=!isUnderdog||p.u.xp<(p.medianXp||0);
  return(<div key={ei} className="crd" style={{marginBottom:12,padding:14,background:bg,border:"1px solid "+bd,animation:"pulse 3s infinite"}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:24}}>{icon}</span>
      <div style={{flex:1}}>
        <div className="out" style={{fontWeight:700,fontSize:14,color:col}}>{ev.title}</div>
        <div style={{fontSize:11,color:"var(--t2)",marginTop:2}}>{ev.description||(ev.type==="spotlight"?"x"+m+" XP on "+cfg.module:ev.type==="flash_hour"?"x"+m+" XP on everything":"x"+m+" XP if below class median")}</div>
        {isUnderdog&&!qualifies&&<div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>You are above the median</div>}
      </div>
      <div style={{textAlign:"right"}}><div className="out" style={{fontSize:12,fontWeight:700,color:col}}>{timeLabel}</div></div>
    </div>
  </div>);
})}

<div className="crd glo" style={{marginBottom:16}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>`,
  'Event banner in Home'
);

replace(
  'if(pills.length===0)return null;',
  `if(p.events)p.events.forEach(function(ev){
    var cfg=ev.config||{};var m=cfg.multiplier||2;
    if(ev.type==="spotlight")pills.push({label:"x"+m+" "+((cfg.module||"").charAt(0).toUpperCase()+(cfg.module||"").slice(1)),col:"#d4943a",icon:"\uD83C\uDFAF"});
    if(ev.type==="flash_hour")pills.push({label:"x"+m+" Flash",col:"#f0c850",icon:"\u26A1"});
    if(ev.type==="underdog"&&p.u.xp<(p.medianXp||0))pills.push({label:"x"+m+" Underdog",col:"#4abe60",icon:"\uD83D\uDCAA"});
  });
  if(pills.length===0)return null;`,
  'Event pills'
);

// ═══════════════════════════════════════════
// PATCH 8: Dashboard events state + sendEventPush using /api/push-send
// ═══════════════════════════════════════════
console.log('\n📦 Patch 8: Dashboard events state + push via /api/push-send');

replace(
  'var[dashPhase,setDashPhase]=useState("picker"); // "picker" | "dashboard"',
  `var[dashPhase,setDashPhase]=useState("picker"); // "picker" | "dashboard"
  var[dashEvents,setDashEvents]=useState([]);var[evForm,setEvForm]=useState({type:"spotlight",title:"",desc:"",module:"drill",multiplier:2,hours:24,classTarget:"all"});var[evSaving,setEvSaving]=useState(false);var[evPushResult,setEvPushResult]=useState(null);

  function loadEvents(){
    supabase.from('events').select('*').order('start_at',{ascending:false}).limit(20)
      .then(function(res){if(res.data)setDashEvents(res.data);});
  }
  async function sendEventPush(title,body,targetClass){
    try{
      // 1. Fetch subscriptions from Supabase
      var query=supabase.from('push_subscriptions').select('subscription,student_name,class_code');
      if(targetClass&&targetClass!=='all')query=query.eq('class_code',targetClass);
      var subRes=await query;
      var subs=(subRes.data||[]).map(function(s){return s.subscription;}).filter(Boolean);
      if(subs.length===0){setEvPushResult({error:"No push subscribers found",total:0});setTimeout(function(){setEvPushResult(null);},5000);return;}
      // 2. Call existing /api/push-send
      var res=await fetch('/api/push-send',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-push-secret':PUSH_SECRET},
        body:JSON.stringify({subscriptions:subs,title:title,body:body,tag:'toeic-event'})
      });
      var data=await res.json();
      // 3. Clean stale subscriptions from Supabase
      var staleCount=0;
      if(data.errors){
        for(var i=0;i<data.errors.length;i++){
          if(data.errors[i].expired){
            var staleEndpoint=data.errors[i].endpoint;
            var staleSub=subRes.data.find(function(s){return s.subscription&&s.subscription.endpoint===staleEndpoint;});
            if(staleSub){
              await supabase.from('push_subscriptions').delete().eq('student_name',staleSub.student_name).eq('class_code',staleSub.class_code);
              staleCount++;
            }
          }
        }
      }
      setEvPushResult({sent:data.sent||0,total:subs.length,staleCount:staleCount});
      setTimeout(function(){setEvPushResult(null);},5000);
    }catch(e){console.log('Push failed:',e);setEvPushResult({error:"Push send failed"});setTimeout(function(){setEvPushResult(null);},5000);}
  }`,
  'Dashboard events state + sendEventPush via /api/push-send'
);

replace(
  'useEffect(function(){loadGroups();},[]);',
  'useEffect(function(){loadGroups();loadEvents();},[]);',
  'Load events on mount'
);

// ═══════════════════════════════════════════
// PATCH 9: Events tab in switcher
// ═══════════════════════════════════════════
console.log('\n📦 Patch 9: Events tab');

replace(
  '{[{id:"overview",label:"\uD83D\uDC65 Students"},{id:"analytics",label:"\uD83D\uDCCA Analytics"}].map(function(t){',
  '{[{id:"overview",label:"\uD83D\uDC65 Students"},{id:"analytics",label:"\uD83D\uDCCA Analytics"},{id:"events",label:"\uD83C\uDFAA Events"}].map(function(t){',
  'Events tab in switcher'
);

// ═══════════════════════════════════════════
// PATCH 10: Events UI from fragment file
// ═══════════════════════════════════════════
console.log('\n📦 Patch 10: Events UI');

var EVENTS_UI = fs.readFileSync(FRAG_PATH, 'utf-8');

replace(
  `      {/* CSV export in analytics too */}
      <button className="btn2" onClick={exportCSV} style={{width:"100%",fontSize:13,borderColor:"rgba(212,148,58,.3)",color:"var(--cyan)",marginBottom:16}}>\uD83D\uDCE5 Export class data (CSV)</button>
    </div>)}

  </div>);
}`,
  `      {/* CSV export in analytics too */}
      <button className="btn2" onClick={exportCSV} style={{width:"100%",fontSize:13,borderColor:"rgba(212,148,58,.3)",color:"var(--cyan)",marginBottom:16}}>\uD83D\uDCE5 Export class data (CSV)</button>
    </div>)}

` + EVENTS_UI + `

  </div>);
}`,
  'Events UI block from fragment'
);

// ═══════════════════════════════════════════
fs.writeFileSync(FILE, code, 'utf-8');

console.log('\n' + '═'.repeat(56));
console.log('✅ Done! ' + changes + ' patches applied.');
console.log('📁 Backup: ' + backup);
console.log('═'.repeat(56));
console.log('\n📋 SETUP CHECKLIST:');
console.log('─'.repeat(56));
console.log('\n1️⃣  SUPABASE SQL — Run in SQL Editor:\n');
console.log(`CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('spotlight','flash_hour','underdog')),
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  config JSONB DEFAULT '{}',
  class_code TEXT DEFAULT 'all',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_events_active ON events (active, start_at, end_at);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events visible" ON events FOR SELECT USING (true);
CREATE POLICY "Events manage" ON events FOR ALL USING (auth.role()='authenticated');
`);
console.log('2️⃣  VERCEL ENV VAR — Add PUSH_SECRET = "toeic-push-2026-xyz"');
console.log('   (must match the value in App.jsx)\n');
console.log('3️⃣  NO new API file needed — uses existing /api/push-send.js\n');
console.log('═'.repeat(56));
