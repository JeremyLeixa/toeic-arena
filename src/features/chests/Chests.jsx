// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { TreasureChestSvg, AvatarMedal } from "../../components/avatar.jsx";
import { GIcon } from "../../components/icons.jsx";
import { CHEST_TYPES, AVATARS, SKINS, FRAMES, TITLES, CHEAT_SHEETS, TOKEN_TYPES } from "../../data/chests.js";
import { haptic } from "../../lib/device.js";
import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// CHEST EARNED TOAST — appears at the moment a chest is granted
// ═══════════════════════════════════════════════════════════════
export function ChestEarnedToast(p){
  var ct=CHEST_TYPES[p.chestType]||CHEST_TYPES.novice;
  var isLegend=p.chestType==="legendaire";
  // Rarity color for border/glow — use ct label or default gold
  var rarityColor=isLegend?"#ffc020":p.chestType==="champion"?"#d4943a":p.chestType==="guerrier"?"#3a8ee0":"#909090";
  var [closing,setClosing]=useState(false);
  var [showFlash,setShowFlash]=useState(isLegend);
  var duration=isLegend?12000:p.chestType==="champion"?8000:5000;

  useEffect(function(){
    if(showFlash){
      var tf=setTimeout(function(){setShowFlash(false);},400);
      return function(){clearTimeout(tf);};
    }
  },[showFlash]);

  useEffect(function(){
    var t=setTimeout(function(){setClosing(true);setTimeout(p.onDismiss,300);},duration);
    return function(){clearTimeout(t);};
  },[]);

  function doDismiss(){setClosing(true);setTimeout(p.onDismiss,300);}
  function doOpenNow(){setClosing(true);setTimeout(p.onOpenNow,200);}

  return(<>
    {/* Legendary full-screen gold flash (only once, 400ms) */}
    {showFlash&&<div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at center, rgba(255,200,50,.6), rgba(255,192,32,.3) 40%, transparent 80%)",pointerEvents:"none",zIndex:199,animation:"legendGoldFlash .4s ease-out forwards"}}/>}

    <div style={{position:"fixed",bottom:86,left:"50%",transform:"translateX(-50%)",width:"calc(100% - 24px)",maxWidth:380,zIndex:200,animation:closing?"toastFadeOut .3s ease-out forwards":"toastSlideUp .4s cubic-bezier(.2,.8,.3,1.2)",pointerEvents:"auto"}}>
      <div style={{background:"linear-gradient(180deg,#1f1610,#120a04)",border:"1.5px solid "+rarityColor,borderRadius:16,padding:"12px 14px",boxShadow:"0 -6px 30px rgba(0,0,0,.6), 0 0 40px "+rarityColor+"55",display:"flex",gap:12,alignItems:"center",position:"relative",overflow:"hidden"}}>
        {/* Legendary shimmer sweep */}
        {isLegend&&<div style={{position:"absolute",inset:0,background:"linear-gradient(110deg,transparent 30%,rgba(255,220,120,.18) 50%,transparent 70%)",backgroundSize:"300%",animation:"legendShimmer 3s ease-in-out infinite",pointerEvents:"none",borderRadius:16}}/>}

        {/* Mini chest with halo */}
        <div style={{position:"relative",flexShrink:0,width:54,height:54,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{position:"absolute",inset:-4,borderRadius:"50%",background:"radial-gradient(circle,"+rarityColor+"55,transparent 70%)",filter:"blur(4px)"}}/>
          <div style={{animation:"chestWiggle 1.4s ease-in-out infinite"}}>
            <TreasureChestSvg size={54} idSuffix={"toast_"+p.toastId}/>
          </div>
        </div>

        {/* Text */}
        <div style={{flex:1,minWidth:0,position:"relative",zIndex:2}}>
          <div className="out" style={{fontSize:10,fontWeight:700,color:rarityColor,letterSpacing:1.5,textTransform:"uppercase"}}>Treasure earned</div>
          <div style={{fontSize:14,fontWeight:700,color:"var(--t1)",marginTop:2}}>{ct.label} Chest</div>
          <div style={{fontSize:11,color:"var(--t2)",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.reason}</div>
        </div>

        {/* Close X */}
        <button onClick={doDismiss} aria-label="Dismiss" style={{background:"none",border:"none",color:"var(--t3)",fontSize:18,cursor:"pointer",padding:0,lineHeight:1,flexShrink:0,marginTop:-22,alignSelf:"flex-start",position:"relative",zIndex:2}}>{String.fromCharCode(215)}</button>
      </div>

      {/* Actions */}
      <div style={{display:"flex",gap:6,marginTop:6}}>
        <button onClick={doOpenNow} style={{flex:"1 1 auto",padding:"8px 12px",background:"linear-gradient(135deg,"+rarityColor+","+rarityColor+"bb)",border:"none",borderRadius:10,color:"#0f0c08",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Cinzel','Outfit',serif",letterSpacing:.5}}>Open now {"\u2694\uFE0F"}</button>
        <button onClick={doDismiss} style={{padding:"8px 14px",background:"rgba(0,0,0,.3)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t2)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Later</button>
      </div>
    </div>
  </>);
}
// ═══════════════════════════════════════════════════════════════
// CHEST OPEN MODAL V2 — Boss Loot cinematic animation
// Phases: zoom (0.6s) → trembor (1s) → explode/beam (0.6s) → reveal
// ═══════════════════════════════════════════════════════════════
// Per-reward render helper used inside ChestOpenModal during sequential reveal.
// Picks the right visual + label for each reward.type (xp/avatar/skin/frame/title/cheat_sheet/token).
export function ChestRewardCard(p){
  var r=p.reward, color=p.rarityColor;
  // Resolve visual + label per type
  var visual=null, name="???", caption="", itemRarity=r.rarity||null;
  if(r.type==="xp"){
    visual=<span style={{fontSize:72}}>{"💎"}</span>;
    name="+"+(r.xp||0)+" XP";
    caption=r.fallback?"XP gem (collection complete)":"XP gem — bonus added!";
  }else if(r.type==="daric"){
    // Arena Shop P1 — Daric reward card. Same visual treatment as a token/gem,
    // gold palette to differentiate from XP cyan/orange. Grant is server-side.
    visual=<div style={{width:96,height:96,borderRadius:"50%",background:"radial-gradient(circle at 35% 30%,#fce8a8,#e8c45a 50%,#8a6818)",border:"3px solid #6b4f10",boxShadow:"0 0 28px rgba(232,196,90,.55), inset 0 -8px 16px rgba(0,0,0,.35)",display:"flex",alignItems:"center",justifyContent:"center"}}><GIcon name="daric" size={56} color="#3a2a08"/></div>;
    name="+"+(r.amount||0)+" Darics";
    caption="Arena currency — spend in the Shop";
  }else if(r.type==="avatar"&&AVATARS[r.id]){
    visual=<AvatarMedal avatarId={r.id} size={96}/>;
    name=AVATARS[r.id].name;caption="New avatar unlocked";
  }else if(r.type==="skin"&&SKINS[r.id]){
    var sk=SKINS[r.id];
    visual=<div style={{width:96,height:96,borderRadius:20,background:"linear-gradient(135deg,"+sk.hex+","+sk.dark+")",border:"2px solid "+color,boxShadow:"0 0 24px "+sk.hex+"88"}}/>;
    name=sk.name;caption="New skin unlocked";
  }else if(r.type==="frame"&&FRAMES[r.id]){
    var fr=FRAMES[r.id];
    visual=<AvatarMedal avatarId="champion" size={88} frameId={r.id}/>;
    name=fr.name;caption="New avatar frame unlocked";
  }else if(r.type==="title"&&TITLES[r.id]){
    var ti=TITLES[r.id];
    visual=<div style={{padding:"18px 20px",borderRadius:14,border:"2px solid "+ti.color,background:"linear-gradient(180deg,#1a1208,#0a0604)"}}><div style={{fontSize:22,fontWeight:900,color:ti.color,letterSpacing:2,textTransform:"uppercase"}}>{ti.name}</div></div>;
    name=ti.name;caption="New title unlocked";
  }else if(r.type==="cheat_sheet"&&CHEAT_SHEETS[r.id]){
    var cs=CHEAT_SHEETS[r.id];
    visual=<span style={{fontSize:72}}>{cs.icon||"📜"}</span>;
    name=cs.name;caption="Cheat Sheet — Profile → Collection";
  }else if(r.type==="token"&&TOKEN_TYPES[r.id]){
    var tk=TOKEN_TYPES[r.id];
    visual=<span style={{fontSize:72}}>{tk.icon}</span>;
    name=tk.name;caption=tk.desc;
  }
  return(<>
    <div style={{margin:"10px 0",filter:"drop-shadow(0 0 18px "+color+")",animation:"chestV2IconFloat 2s ease-in-out 1.5s infinite",display:"flex",justifyContent:"center"}}>{visual}</div>
    <div className="out" style={{fontSize:22,fontWeight:900,color:"#ede4d4",marginBottom:4,letterSpacing:1}}>{name}</div>
    <div style={{fontSize:11,color:"#8a7e6a",letterSpacing:1}}>{caption}</div>
  </>);
}
export function ChestOpenModal(p){
  var[phase,setPhase]=useState("build"); // build → explode → reveal
  var[revealIdx,setRevealIdx]=useState(0);
  var chest=p.chest;var result=p.result;
  var ct=CHEST_TYPES[chest.chest_type]||CHEST_TYPES.novice;
  // Rarity color derived from chest type (fallback until result arrives)
  var defaultColor=chest.chest_type==="legendaire"?"#ffc020":chest.chest_type==="champion"?"#d4943a":chest.chest_type==="guerrier"?"#3a8ee0":"#909090";
  var rarityColor=(result&&result.rarityColor)||defaultColor;
  var rarityLabel=(result&&result.rarityLabel)||ct.label;
  var rewardsList=(result&&result.rewards)||[];
  var totalRewards=rewardsList.length;
  var currentReward=phase==="reveal"?rewardsList[revealIdx]:null;
  var isLastReward=phase==="reveal"&&revealIdx>=totalRewards-1;

  useEffect(function(){
    if(phase==="build"){
      // Build-up (zoom + trembor): 2.0s → trigger open + explode
      var t=setTimeout(function(){p.onOpen();setPhase("explode");},2000);
      return function(){clearTimeout(t);};
    }
    if(phase==="explode"){
      var t2=setTimeout(function(){setPhase("reveal");},1400);
      return function(){clearTimeout(t2);};
    }
  },[phase]);

  function nextOrCollect(){
    if(isLastReward){p.onClose();return;}
    setRevealIdx(function(i){return i+1;});
    haptic("chestOpen");
  }

  // Build shard angles once
  var woodShards=[];for(var i=0;i<8;i++){var a=(i/8)*360+22;woodShards.push({angle:a,dist:120+Math.random()*60});}
  var metalShards=[];for(var j=0;j<5;j++){var a2=(j/5)*360+45;metalShards.push({angle:a2,dist:100+Math.random()*80});}
  var magicShards=[];for(var k=0;k<6;k++){var a3=-70+(k/5)*140;magicShards.push({angle:a3,dist:150+Math.random()*80});}
  var speedLines=[];for(var m=0;m<6;m++){speedLines.push({left:(20+m*12)+"%",delay:(Math.random()*0.3)+"s"});}

  return(<div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at center,#1a0a00 0%,#080402 100%)",zIndex:10000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,overflow:"hidden"}}>
    <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at center,transparent 20%,rgba(0,0,0,.6) 80%)",pointerEvents:"none",zIndex:1}}/>

    {/* Stage */}
    <div style={{position:"relative",width:360,maxWidth:"100%",height:480,display:"flex",alignItems:"center",justifyContent:"center",zIndex:5,overflow:"hidden"}}>

      {/* Phase 1-2: Chest (visible during build + explode phases) */}
      {(phase==="build"||phase==="explode")&&<div style={{position:"absolute",width:180,height:150,opacity:0,transform:"scale(.3)",animation:"chestV2Zoom .6s cubic-bezier(.2,.8,.4,1.3) 0s forwards, chestV2Trembor .5s ease-in-out 1s 2"+(phase==="explode"?", none":""),filter:"drop-shadow(0 12px 20px rgba(0,0,0,.8))",zIndex:3}}>
        <style>{"@keyframes v2LidFlyLocal { 0%{transform:translateY(0) rotate(0);opacity:1} 40%{transform:translateY(-80px) rotate(-30deg);opacity:1} 100%{transform:translateY(-200px) rotate(-80deg);opacity:0} } @keyframes v2BodyCollapseLocal { 0%{transform:scale(1,1) translateY(0);opacity:1;filter:brightness(1)} 40%{transform:scale(1.1,.85) translateY(8px);filter:brightness(2)} 100%{transform:scale(.4,.2) translateY(30px);opacity:0;filter:brightness(4)} } .cov2-exploding .chest-lid-group{transform-origin:50% 100%;animation:v2LidFlyLocal .6s ease-out forwards} .cov2-exploding .chest-body-group{transform-origin:50% 50%;animation:v2BodyCollapseLocal .5s ease-in .1s forwards}"}</style>
        <div className={phase==="explode"?"cov2-exploding":""}>
          <TreasureChestSvg size={180} idSuffix="modal"/>
        </div>
      </div>}

      {/* Explode phase FX */}
      {phase==="explode"&&<>
        {/* Dust cloud */}
        <div style={{position:"absolute",top:"50%",left:"50%",width:80,height:80,borderRadius:"50%",background:"radial-gradient(circle,rgba(120,90,60,.4),transparent 70%)",transform:"translate(-50%,-50%) scale(0)",opacity:0,animation:"chestV2DustExpand 1s ease-out .1s forwards",zIndex:2,filter:"blur(3px)"}}/>
        {/* Explosion burst */}
        <div style={{position:"absolute",width:10,height:10,borderRadius:"50%",background:"radial-gradient(circle,white 0%,"+rarityColor+" 30%,transparent 70%)",opacity:0,animation:"chestV2BurstExpand .6s ease-out 0s forwards",zIndex:4}}/>
        {/* Screen flash */}
        <div style={{position:"fixed",inset:0,background:"white",opacity:0,animation:"chestV2ScreenFlash .4s ease-out 0s",zIndex:10,pointerEvents:"none"}}/>
        {/* Wood shards */}
        {woodShards.map(function(s,i){return(<div key={"w"+i} style={{position:"absolute",width:10,height:16,background:"linear-gradient(180deg,#6b3f1a,#4a2a10)",top:"50%",left:"50%",borderRadius:2,opacity:0,boxShadow:"inset 0 -2px 3px rgba(0,0,0,.5)",animation:"chestV2ShardFly .9s ease-out .1s forwards","--angle":s.angle+"deg","--dist":s.dist+"px",zIndex:6}}/>);})}
        {/* Metal shards */}
        {metalShards.map(function(s,i){return(<div key={"m"+i} style={{position:"absolute",width:6,height:10,background:"linear-gradient(180deg,#8b6a30,#5a4418)",top:"50%",left:"50%",borderRadius:1,opacity:0,boxShadow:"0 0 4px rgba(212,148,58,.6)",animation:"chestV2ShardFly .9s ease-out .2s forwards","--angle":s.angle+"deg","--dist":s.dist+"px",zIndex:6}}/>);})}
        {/* Magic shards */}
        {magicShards.map(function(s,i){return(<div key={"mg"+i} style={{position:"absolute",width:5,height:12,background:rarityColor,top:"50%",left:"50%",borderRadius:2,opacity:0,filter:"drop-shadow(0 0 6px "+rarityColor+")",animation:"chestV2ShardFly 1s ease-out .2s forwards","--angle":s.angle+"deg","--dist":s.dist+"px",zIndex:6}}/>);})}
        {/* Vertical beam — fixed to viewport so it spans the full screen height */}
        <div style={{position:"fixed",top:"50%",left:"50%",width:80,height:0,background:"linear-gradient(to top,transparent 0%,"+rarityColor+" 30%,rgba(255,255,255,.9) 70%,transparent 100%)",transform:"translate(-50%,-50%)",opacity:0,animation:"chestV2BeamGrow .5s ease-out .2s forwards, chestV2BeamShrink .5s ease-in 1.2s forwards",zIndex:2,filter:"blur(1px)",pointerEvents:"none"}}/>
      </>}

      {/* Reveal phase — V2 sequential : 1 card per reward */}
      {phase==="reveal"&&result&&currentReward&&<>
        {/* Speed lines during fall */}
        {speedLines.map(function(sl,i){return(<div key={"sl"+revealIdx+"_"+i} style={{position:"absolute",width:2,height:80,background:"linear-gradient(to bottom,transparent,"+rarityColor+",transparent)",left:sl.left,top:"15%",opacity:0,animation:"chestV2SpeedLine .8s ease-out "+sl.delay}}/>);})}
        {/* Impact ring */}
        <div key={"ring"+revealIdx} style={{position:"absolute",top:"65%",left:"50%",width:200,height:40,borderRadius:"50%",border:"2px solid "+rarityColor,transform:"translate(-50%,-50%) scaleY(.4)",opacity:0,animation:"chestV2ImpactRing .8s ease-out .3s forwards",filter:"blur(1px)",zIndex:4}}/>
        {/* Reward card — keyed on revealIdx so React remounts and replays animation */}
        <div key={"card"+revealIdx} style={{position:"absolute",width:240,padding:"22px 18px",borderRadius:14,background:"linear-gradient(180deg,#2a1e14 0%,#1a1208 100%)",border:"2px solid "+rarityColor,boxShadow:"0 0 60px "+rarityColor+", 0 0 120px "+rarityColor+"66, inset 0 0 30px rgba(0,0,0,.6)",textAlign:"center",opacity:0,transform:"translateY(-220px) scale(.6) rotate(-8deg)",animation:"chestV2RewardFall .6s cubic-bezier(.3,.1,.4,1.4) 0s forwards, chestV2RewardSettle .35s ease-out .6s forwards",zIndex:5}}>
          <div className="out" style={{fontSize:11,fontWeight:900,color:rarityColor,letterSpacing:3,textTransform:"uppercase",marginBottom:10,padding:"4px 10px",display:"inline-block",border:"1px solid "+rarityColor,borderRadius:4}}>{rarityLabel}</div>
          <ChestRewardCard reward={currentReward} rarityColor={rarityColor}/>
          {totalRewards>1&&<div style={{marginTop:14,fontSize:10,color:"#8a7e6a",letterSpacing:2,textTransform:"uppercase"}}>{(revealIdx+1)+" / "+totalRewards}</div>}
        </div>
      </>}

      {/* Reveal but no result (loading) */}
      {phase==="reveal"&&!result&&<div style={{position:"absolute",textAlign:"center"}}>
        <div style={{fontSize:48,animation:"pulse 1s infinite"}}>{"\u231B"}</div>
        <p style={{color:"#8a7e6a",fontSize:13,marginTop:12}}>Rolling...</p>
      </div>}
    </div>

    {/* Collect button (only in reveal phase) */}
    {phase==="reveal"&&result&&currentReward&&<button className="btn1" onClick={nextOrCollect} style={{marginTop:20,width:240,maxWidth:"100%",fontSize:15,zIndex:20,background:"linear-gradient(135deg,"+rarityColor+","+rarityColor+"99)"}}>{isLastReward?"Collect":"Next"}</button>}
  </div>);
}
