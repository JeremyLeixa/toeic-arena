// patch-profile-redesign.cjs
// Refonte complète du composant Profile :
//   • Écran principal allégé (hero + 3 tuiles nav + settings)
//   • Sous-vue Stats (TOEIC card + grille 8 métriques)
//   • Sous-vue Trophées (grille 2 col + barre de progression)
//   • Sous-vue Avatar (upload photo + galerie emojis)
// Usage : node patch-profile-redesign.cjs

const fs = require("fs");
const path = require("path");

const FILE   = path.join(__dirname, "App.jsx");
const BACKUP = FILE + ".bak-profile-redesign";

if (!fs.existsSync(FILE)) {
  console.error("❌ App.jsx introuvable dans le dossier courant.");
  process.exit(1);
}

let src = fs.readFileSync(FILE, "utf8");
const original = src;

// ── Bornes de remplacement ──────────────────────────────────────────────────
const START_MARKER = "function Profile(p){var u=p.u,lv=getLevel";
const END_MARKER   = "// ═══════════════════════════════════════════\n\n// ═══════════════════════════════════════════\n// MAIN APP";

const startIdx = src.indexOf(START_MARKER);
const endIdx   = src.indexOf(END_MARKER);

if (startIdx === -1) { console.error("❌ Marqueur de début (Profile) introuvable."); process.exit(1); }
if (endIdx   === -1) { console.error("❌ Marqueur de fin (MAIN APP) introuvable.");  process.exit(1); }

// ── Nouveau composant Profile ───────────────────────────────────────────────
const NEW_PROFILE = `function Profile(p){
  var u=p.u;
  var[view,setView]=useState(null);
  var[pushOn,setPushOn]=useState(false);
  var[soundOn,setSoundOn]=useState(isSoundEnabled());
  var[tipOff,setTipOff]=useState(false);
  var fileRef=useRef(null);

  useEffect(function(){isPushSubscribed().then(function(v){setPushOn(v);});},[]);
  useEffect(function(){try{setTipOff(localStorage.getItem("toeic-tip-disabled")==="1");}catch(e){}},[]);

  var lv=getLevel(u.xp),lg=getLeague(u.weeklyXp);
  var acc=u.stats.totalQ>0?Math.round(u.stats.correct/u.stats.totalQ*100):0;
  var toeic=estimateTOEICScore(u.moduleScores||{});
  var uC=Object.assign({},u);
  var ea=ACHIEVEMENTS.filter(function(a){return a.check(uC);});
  var la=ACHIEVEMENTS.filter(function(a){return!a.check(uC);});
  var isPhoto=!!(u.avatar&&u.avatar.startsWith("data:"));
  var toeicCol=toeic.total>=750?"var(--green)":toeic.total>=500?"var(--orange)":toeic.total>200?"var(--red)":"var(--t3)";

  function renderAvatar(size,fs){
    if(isPhoto)return(<img src={u.avatar} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",display:"block"}}/>);
    return(<div style={{width:size,height:size,borderRadius:"50%",background:"linear-gradient(135deg,#d4943a,#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs||(size*0.5)}}>{u.avatar||"⚔️"}</div>);
  }

  function handlePhotoUpload(e){
    var file=e.target.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(ev){
      var img=new Image();
      img.onload=function(){
        var canvas=document.createElement("canvas");canvas.width=160;canvas.height=160;
        var ctx=canvas.getContext("2d");
        var s=Math.min(img.width,img.height);
        var sx=(img.width-s)/2,sy=(img.height-s)/2;
        ctx.drawImage(img,sx,sy,s,s,0,0,160,160);
        var b64=canvas.toDataURL("image/jpeg",0.75);
        var c=JSON.parse(JSON.stringify(u));c.avatar=b64;p.setAvatar(c);
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function Toggle(on,fn){
    return(<button onClick={fn} style={{width:52,height:28,borderRadius:14,border:"none",cursor:"pointer",
      position:"relative",background:on?"var(--cyan)":"var(--t3)",transition:"background .3s",flexShrink:0}}>
      <div style={{width:22,height:22,borderRadius:11,background:"#fff",position:"absolute",top:3,
        left:on?27:3,transition:"left .3s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
    </button>);
  }

  // ── SUB-VIEW : STATS ────────────────────────────────────────────────────
  if(view==="stats")return(
    <div className="enter" style={{padding:"20px 16px 100px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <button onClick={function(){setView(null);}} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>←</button>
        <h1 className="out" style={{fontWeight:800,fontSize:20,margin:0}}>My Stats</h1>
      </div>
      <div className="crd" style={{padding:"14px 18px",marginBottom:16,
        background:"linear-gradient(135deg,rgba(212,148,58,.06),rgba(139,94,131,.06))",
        borderColor:"rgba(212,148,58,.15)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Est. TOEIC Score</div>
            <div className="out" style={{fontWeight:900,fontSize:36,color:toeicCol,lineHeight:1}}>
              {toeic.total}<span style={{fontSize:14,color:"var(--t3)",fontWeight:400}}>/990</span>
            </div>
            {toeic.total<=200&&<div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>Complete more modules to refine</div>}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{display:"flex",gap:16,marginBottom:4}}>
              <div style={{textAlign:"center"}}><div className="out" style={{fontWeight:700,fontSize:18,color:"var(--cyan)"}}>{toeic.listening}</div><div style={{fontSize:9,color:"var(--t3)"}}>Listening</div></div>
              <div style={{textAlign:"center"}}><div className="out" style={{fontWeight:700,fontSize:18,color:"var(--purple)"}}>{toeic.reading}</div><div style={{fontSize:9,color:"var(--t3)"}}>Reading</div></div>
            </div>
            <div style={{fontSize:9,color:"var(--t3)"}}>Based on your training</div>
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[
          {l:"Total XP",v:u.xp,i:"⭐"},
          {l:"Weekly XP",v:u.weeklyXp,i:"⚡"},
          {l:"Accuracy",v:acc+"%",i:"🎯"},
          {l:"Sessions",v:u.stats.sessions,i:"📊"},
          {l:"Cards Reviewed",v:u.stats.cardsRev||0,i:"🃏"},
          {l:"Drills Done",v:u.stats.drills||0,i:"📝"},
          {l:"Perfect Dailies",v:u.stats.perfects||0,i:"✨"},
          {l:"Questions Total",v:u.stats.totalQ||0,i:"❓"}
        ].map(function(s){return(
          <div key={s.l} className="crd" style={{padding:14,textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:4}}>{s.i}</div>
            <div className="out" style={{fontSize:20,fontWeight:800}}>{s.v}</div>
            <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>{s.l}</div>
          </div>
        );})}
      </div>
    </div>
  );

  // ── SUB-VIEW : TROPHÉES ─────────────────────────────────────────────────
  if(view==="trophees")return(
    <div className="enter" style={{padding:"20px 16px 100px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <button onClick={function(){setView(null);}} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>←</button>
        <h1 className="out" style={{fontWeight:800,fontSize:20,margin:0,flex:1}}>Trophées</h1>
        <span style={{fontSize:12,background:"rgba(255,215,0,.1)",color:"var(--gold)",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(255,215,0,.2)"}}>{ea.length} / {ACHIEVEMENTS.length}</span>
      </div>
      <div className="crd" style={{padding:"12px 16px",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--t2)",marginBottom:8}}>
          <span>Progression</span>
          <span style={{fontWeight:700,color:"var(--gold)"}}>{Math.round(ea.length/ACHIEVEMENTS.length*100)}%</span>
        </div>
        <div style={{height:6,background:"var(--bg3)",borderRadius:3,overflow:"hidden"}}>
          <div style={{height:6,borderRadius:3,background:"linear-gradient(90deg,#d4943a,#8b5e83)",
            width:(ea.length/ACHIEVEMENTS.length*100)+"%",transition:"width .6s"}}/>
        </div>
      </div>
      {ea.length>0&&<>
        <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Débloqués ({ea.length})</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
          {ea.map(function(a){return(
            <div key={a.id} className="crd" style={{padding:14,background:"rgba(255,215,0,.05)",borderColor:"rgba(255,215,0,.15)"}}>
              <div style={{fontSize:22,marginBottom:6}}>{a.icon}</div>
              <div className="out" style={{fontWeight:700,fontSize:12,color:"var(--gold)",marginBottom:3}}>{a.name}</div>
              <div style={{fontSize:10,color:"var(--t2)",lineHeight:1.4}}>{a.desc}</div>
            </div>
          );})}
        </div>
      </>}
      {la.length>0&&<>
        <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>À débloquer ({la.length})</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {la.map(function(a){return(
            <div key={a.id} className="crd" style={{padding:14,opacity:.4}}>
              <div style={{fontSize:22,marginBottom:6,filter:"grayscale(1)"}}>🔒</div>
              <div className="out" style={{fontWeight:700,fontSize:12,marginBottom:3}}>{a.name}</div>
              <div style={{fontSize:10,color:"var(--t2)",lineHeight:1.4}}>{a.desc}</div>
            </div>
          );})}
        </div>
      </>}
    </div>
  );

  // ── SUB-VIEW : AVATAR ───────────────────────────────────────────────────
  if(view==="avatar")return(
    <div className="enter" style={{padding:"20px 16px 100px"}}>
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhotoUpload}/>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <button onClick={function(){setView(null);}} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>←</button>
        <h1 className="out" style={{fontWeight:800,fontSize:20,margin:0}}>Avatar</h1>
      </div>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{position:"relative",display:"inline-block",marginBottom:16}}>
          {renderAvatar(96,48)}
          <button onClick={function(){fileRef.current.click();}}
            style={{position:"absolute",bottom:0,right:0,width:30,height:30,borderRadius:"50%",
              background:"var(--cyan)",border:"2px solid var(--bg)",cursor:"pointer",fontSize:14,
              display:"flex",alignItems:"center",justifyContent:"center"}}>📷</button>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:8}}>
          <button onClick={function(){fileRef.current.click();}} className="btn1"
            style={{fontSize:12,padding:"8px 18px"}}>📷 Upload photo</button>
          {isPhoto&&<button onClick={function(){var c=JSON.parse(JSON.stringify(u));c.avatar="⚔️";p.setAvatar(c);}}
            className="btn2" style={{fontSize:12,padding:"8px 18px",color:"var(--red)",borderColor:"rgba(255,71,87,.2)"}}>✕ Remove</button>}
        </div>
        <div style={{fontSize:11,color:"var(--t3)"}}>Photo redimensionnée · stockée en local</div>
      </div>
      <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>ou choisis un emoji</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        {["⚔️","🧙","🦊","🐉","🎯","🏆","🦅","💎","🔥","🌟","🎭","🐺","🦁","🎪","👤","🧠","🎲","🦉","🐲","🗡️","🏴‍☠️","⚡","🦈","🌀","🎸"].map(function(av){
          var sel=!isPhoto&&av===(u.avatar||"⚔️");
          return(<button key={av} onClick={function(){var c=JSON.parse(JSON.stringify(u));c.avatar=av;p.setAvatar(c);}}
            style={{width:48,height:48,borderRadius:14,border:sel?"2px solid var(--cyan)":"2px solid var(--bdr)",
              background:sel?"rgba(212,148,58,.1)":"var(--bg2)",cursor:"pointer",fontSize:24,
              display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
            {av}</button>);
        })}
        {u.name==="Teacher"&&(function(){
          var sel=!isPhoto&&u.avatar==="🗝️";
          return(<button onClick={function(){var c=JSON.parse(JSON.stringify(u));c.avatar="🗝️";p.setAvatar(c);}}
            style={{width:48,height:48,borderRadius:14,
              border:sel?"2px solid var(--gold)":"2px solid rgba(255,215,0,.3)",
              background:sel?"rgba(255,215,0,.15)":"rgba(255,215,0,.05)",cursor:"pointer",fontSize:24,
              display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",
              boxShadow:sel?"0 0 12px rgba(255,215,0,.3)":"none"}}>
            {"🗝️"}</button>);
        })()}
      </div>
      {u.name==="Teacher"&&<div style={{fontSize:11,color:"var(--gold)",marginBottom:20,fontStyle:"italic"}}>🗝️ Game Master — exclusive avatar</div>}
    </div>
  );

  // ── VUE PRINCIPALE ──────────────────────────────────────────────────────
  return(
    <div className="enter" style={{padding:"20px 16px 100px"}}>

      {/* Hero */}
      <div style={{textAlign:"center",marginBottom:24}}>
        <button onClick={function(){setView("avatar");}}
          style={{background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:12,display:"inline-block",position:"relative"}}>
          {renderAvatar(88,44)}
          <div style={{position:"absolute",bottom:0,right:0,width:26,height:26,borderRadius:"50%",
            background:"var(--cyan)",border:"2px solid var(--bg)",display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:12}}>✎</div>
        </button>
        <h1 className="out" style={{fontWeight:800,fontSize:22,marginBottom:8}}>{u.name}</h1>
        <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:12,background:"rgba(212,148,58,.1)",color:"var(--orange)",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(212,148,58,.2)"}}>Lv. {lv.level}</span>
          <span style={{fontSize:12,padding:"3px 10px",borderRadius:20,border:"1px solid rgba(139,94,131,.2)",background:"rgba(139,94,131,.1)",color:lg.color}}>{lg.icon} {lg.name}</span>
          <span style={{fontSize:12,background:"rgba(255,100,0,.1)",color:"#ff6428",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(255,100,0,.2)"}}>🔥 {u.streak}</span>
        </div>
      </div>

      {/* 3 tuiles de navigation */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
        <button onClick={function(){setView("stats");}} className="crd"
          style={{padding:"14px 8px",textAlign:"center",cursor:"pointer",background:"none",border:"1px solid var(--bdr)",width:"100%"}}>
          <div style={{fontSize:22,marginBottom:4}}>📊</div>
          <div className="out" style={{fontWeight:800,fontSize:16}}>{u.xp}</div>
          <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Stats</div>
          <div style={{fontSize:10,color:"var(--t3)"}}>→</div>
        </button>
        <button onClick={function(){setView("trophees");}} className="crd"
          style={{padding:"14px 8px",textAlign:"center",cursor:"pointer",background:"rgba(255,215,0,.03)",border:"1px solid rgba(255,215,0,.15)",width:"100%"}}>
          <div style={{fontSize:22,marginBottom:4}}>🏆</div>
          <div className="out" style={{fontWeight:800,fontSize:16,color:"var(--gold)"}}>{ea.length}<span style={{fontSize:11,color:"var(--t3)",fontWeight:400}}>/{ACHIEVEMENTS.length}</span></div>
          <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Trophées</div>
          <div style={{fontSize:10,color:"var(--t3)"}}>→</div>
        </button>
        <button onClick={function(){setView("avatar");}} className="crd"
          style={{padding:"14px 8px",textAlign:"center",cursor:"pointer",background:"none",border:"1px solid var(--bdr)",width:"100%"}}>
          <div style={{height:28,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4}}>
            {renderAvatar(28,18)}
          </div>
          <div className="out" style={{fontWeight:800,fontSize:16}}>Style</div>
          <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Avatar</div>
          <div style={{fontSize:10,color:"var(--t3)"}}>→</div>
        </button>
      </div>

      {/* Teacher dashboard */}
      <button className="btn2" onClick={function(){var code=prompt("Teacher code:");if(code===TEACHER_CODE)p.goTeacher();}}
        style={{fontSize:13,width:"100%",marginBottom:20,padding:"14px 24px",borderColor:"rgba(212,148,58,.2)",color:"var(--cyan)"}}>
        👨‍🏫 Teacher Dashboard
      </button>

      {/* Settings */}
      <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Settings</div>
      <div className="crd" style={{padding:0,overflow:"hidden",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:"1px solid var(--bdr)"}}>
          <div>
            <div className="out" style={{fontWeight:700,fontSize:14}}>Appearance</div>
            <div style={{fontSize:12,color:"var(--t2)"}}>{u.theme==="light"?"Light mode":"Dark mode"}</div>
          </div>
          {Toggle(u.theme==="light",function(){var c=JSON.parse(JSON.stringify(u));c.theme=c.theme==="light"?"dark":"light";p.setAvatar(c);})}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:"1px solid var(--bdr)"}}>
          <div>
            <div className="out" style={{fontWeight:700,fontSize:14}}>Sound Effects</div>
            <div style={{fontSize:12,color:"var(--t2)"}}>{soundOn?"On":"Off"}</div>
          </div>
          {Toggle(soundOn,function(){var cur=isSoundEnabled();setSoundEnabled(!cur);setSoundOn(!cur);if(!cur)try{playCorrect();}catch(e){}if(cur)stopBGM();})}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:("PushManager" in window)?"1px solid var(--bdr)":"none"}}>
          <div>
            <div className="out" style={{fontWeight:700,fontSize:14}}>Daily Tips</div>
            <div style={{fontSize:12,color:"var(--t2)"}}>Show at startup</div>
          </div>
          {Toggle(!tipOff,function(){try{var cur=localStorage.getItem("toeic-tip-disabled")==="1";if(cur){localStorage.removeItem("toeic-tip-disabled");localStorage.removeItem("toeic-tip-date");setTipOff(false);}else{localStorage.setItem("toeic-tip-disabled","1");setTipOff(true);}}catch(e){}})}
        </div>
        {("PushManager" in window)&&
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px"}}>
            <div>
              <div className="out" style={{fontWeight:700,fontSize:14}}>Notifications</div>
              <div style={{fontSize:12,color:"var(--t2)"}}>{pushOn?"Streak reminders":"Disabled"}</div>
            </div>
            {Toggle(pushOn,function(){if(pushOn){unsubscribePush(u.name,u.classCode).then(function(){setPushOn(false);});}else{subscribePush(u.name,u.classCode).then(function(sub){if(sub)setPushOn(true);});}})}
          </div>
        }
      </div>

      {/* Reset */}
      <button className="btn2" onClick={function(){var code=prompt("Enter teacher code to reset:");if(code===TEACHER_CODE)p.reset();}}
        style={{fontSize:12,color:"var(--red)",borderColor:"rgba(255,71,87,.2)",width:"100%"}}>
        Reset all data
      </button>
    </div>
  );
}

`;

// ── Apply replacement ───────────────────────────────────────────────────────
src = src.slice(0, startIdx) + NEW_PROFILE + src.slice(endIdx);

if (src === original) {
  console.warn("⚠️  Aucun changement détecté — le patch a peut-être déjà été appliqué.");
  process.exit(0);
}

fs.writeFileSync(BACKUP, original, "utf8");
console.log("📦 Backup sauvegardé : App.jsx.bak-profile-redesign");

fs.writeFileSync(FILE, src, "utf8");
console.log("🎉 App.jsx patché avec succès !\n");
console.log("Ce qui change :");
console.log("  • Écran principal : hero + 3 tuiles (Stats / Trophées / Avatar) + settings compact");
console.log("  • Sous-vue Stats  : TOEIC card + 8 métriques en grille 2×4");
console.log("  • Sous-vue Trophées : grille 2 col, barre de progression, débloqués / à débloquer");
console.log("  • Sous-vue Avatar : upload photo (Canvas 160×160 JPEG) + galerie emojis");
console.log("  • Toggle Sound devient un vrai state React (plus de hack setAvatar)");
console.log("  • Avatar Teacher 🗝️ préservé");
