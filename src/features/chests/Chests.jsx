// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md).
// Ouverture v3 (2026-09-16) : ChestOpenModal réécrit d'après prototypes/chest-animations-v3.
// Tout l'enchaînement vit dans chestSequence.js (impératif, Web Animations API) ; ce fichier
// rend le squelette, relaie les événements et affiche cartes, récap et erreurs.
import { useState, useEffect, useRef } from "react";
import { TreasureChestSvg } from "../../components/avatar.jsx";
import { CHEST_TYPES } from "../../data/chests.js";
import { getTriggerLabel } from "../../lib/chestLabels.js";
import { rarityTier } from "../../lib/chestReveal.js";
import { duckBGM } from "../../sounds.js";
import { createChestOpening } from "./chestSequence.js";
import { ChestCard, ChestLootTile } from "./ChestCards.jsx";
import { CHEST_TOAST_COLOR, CHEST_TIER } from "./chestTheme.js";

// ═══════════════════════════════════════════════════════════════
// CHEST EARNED TOAST — appears at the moment a chest is granted
// ═══════════════════════════════════════════════════════════════
export function ChestEarnedToast(p){
  var ct=CHEST_TYPES[p.chestType]||CHEST_TYPES.novice;
  var isLegend=p.chestType==="legendaire";
  var rarityColor=CHEST_TOAST_COLOR[p.chestType]||CHEST_TOAST_COLOR.novice;
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
      <div style={{background:"linear-gradient(180deg,#1f1610,#120a04)",border:"1.5px solid "+rarityColor,borderRadius:16,padding:"10px 14px",boxShadow:"0 -6px 30px rgba(0,0,0,.6), 0 0 40px "+rarityColor+"55",display:"flex",gap:12,alignItems:"center",position:"relative",overflow:"hidden"}}>
        {/* Legendary shimmer sweep */}
        {isLegend&&<div style={{position:"absolute",inset:0,background:"linear-gradient(110deg,transparent 30%,rgba(255,220,120,.18) 50%,transparent 70%)",backgroundSize:"300%",animation:"legendShimmer 3s ease-in-out infinite",pointerEvents:"none",borderRadius:16}}/>}

        {/* Coffre du bon niveau (ouverture v3), avec halo */}
        <div style={{position:"relative",flexShrink:0,width:60,height:60,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{position:"absolute",inset:-4,borderRadius:"50%",background:"radial-gradient(circle,"+rarityColor+"55,transparent 70%)",filter:"blur(4px)"}}/>
          <div style={{animation:"chestWiggle 1.4s ease-in-out infinite"}}>
            <TreasureChestSvg size={60} tier={CHEST_TIER[p.chestType]||0} idSuffix={"toast_"+p.toastId}/>
          </div>
        </div>

        {/* Text */}
        <div style={{flex:1,minWidth:0,position:"relative",zIndex:2}}>
          <div className="out" style={{fontSize:10,fontWeight:700,color:rarityColor,letterSpacing:1.5,textTransform:"uppercase"}}>Treasure earned</div>
          <div style={{fontSize:14,fontWeight:700,color:/*fond local*/"#ede4d4",marginTop:2}}>{ct.label} Chest</div>
          <div style={{fontSize:11,color:/*fond local*/"#8a7e6a",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.reason}</div>
        </div>

        {/* Close X */}
        <button onClick={doDismiss} aria-label="Dismiss" style={{background:"none",border:"none",color:/*fond local*/"#756b54",fontSize:18,cursor:"pointer",padding:0,lineHeight:1,flexShrink:0,marginTop:-22,alignSelf:"flex-start",position:"relative",zIndex:2}}>{String.fromCharCode(215)}</button>
      </div>

      {/* Actions */}
      <div style={{display:"flex",gap:6,marginTop:6}}>
        <button onClick={doOpenNow} style={{flex:"1 1 auto",padding:"8px 12px",background:"linear-gradient(135deg,"+rarityColor+","+rarityColor+"bb)",border:"none",borderRadius:10,color:"#0f0c08",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Cinzel','Outfit',serif",letterSpacing:.5}}>Open now {"⚔️"}</button>
        {/* Fond sombre fixe comme la carte : var(--bdr)/var(--t2) suivaient le mode clair */}
        <button onClick={doDismiss} style={{padding:"8px 14px",background:"rgba(20,12,6,.85)",border:"1px solid rgba(180,140,80,.3)",borderRadius:10,color:/*fond local*/"#c9b48c",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Later</button>
      </div>
    </div>
  </>);
}

// Cercle runique sous le coffre légendaire : tracé en 3 tiers, un par tap (chestSequence.js)
function RuneCircle(){
  var glyphs=[];
  for(var i=0;i<12;i++){
    var a=(i/12)*Math.PI*2, x=160+Math.cos(a)*146, y=46+Math.sin(a)*38;
    glyphs.push(<path key={i} d={"M "+(x-3).toFixed(1)+" "+(y+3).toFixed(1)+" l 3 -6 l 3 6 m -3 -6 v 7"}/>);
  }
  return(<svg viewBox="0 0 320 92" aria-hidden="true">
    <ellipse className="outer" cx="160" cy="46" rx="156" ry="42" pathLength="300"/>
    <ellipse className="inner" cx="160" cy="46" rx="128" ry="32" pathLength="300"/>
    {glyphs}
  </svg>);
}

var ERROR_TEXT={
  failed:["The chest is still waiting for you","It could not be opened right now. Nothing was lost: try again in a moment."],
  already_opened:["This chest was already opened","It has been removed from your queue."],
  session_lost:["The chest is still waiting for you","Your session has expired. Log in again to open it: nothing was lost."],
  slow:["The chest is taking longer than usual","Check your connection. If it doesn't open, it stays in your queue."],
};

// ═══════════════════════════════════════════════════════════════
// CHEST OPEN MODAL v3 — Crochetage (3 taps, la lumière annonce la meilleure rareté)
// + Butin étalé (cartes face cachée, récap). Contrat inchangé avec App.jsx :
// chest (ligne pending_chests), result (doOpenChest : ok:true + butin, ou ok:false), onOpen, onClose.
// ⚠️ onOpen est appelé AU MONTAGE (la V2 attendait 2 s) : l'anticipation attend le résultat,
// jamais l'inverse. UNE seule fois (openedRef), même quand StrictMode remonte le modal en
// dev : un second doOpenChest retaperait la RPC.
// ═══════════════════════════════════════════════════════════════
export function ChestOpenModal(p){
  var chestType=p.chest&&p.chest.chest_type;
  var tier=CHEST_TIER[chestType]||0;
  var ct=CHEST_TYPES[chestType]||CHEST_TYPES.novice;
  var reason=getTriggerLabel(p.chest&&p.chest.trigger_source);

  var stageRef=useRef(null), areaRef=useRef(null), labelRef=useRef(null), tellRef=useRef(null), runesRef=useRef(null);
  var shockRef=useRef(null), chestRef=useRef(null), idleRef=useRef(null), pipsRef=useRef(null), haloRef=useRef(null);
  var raysRef=useRef(null), beamRef=useRef(null), flashRef=useRef(null), dimRef=useRef(null), canvasRef=useRef(null), recapRef=useRef(null);
  var cardElsRef=useRef([]);
  var engineRef=useRef(null);
  var openedRef=useRef(false);
  var propsRef=useRef(p);

  var [ui,setUi]=useState({chestHint:null,cardsHint:null,cta:null,skip:false});
  var [groups,setGroups]=useState(null);
  var [recap,setRecap]=useState(null);
  var [error,setError]=useState(null); // null | "slow" | "failed" | "already_opened" | "session_lost"

  // Dernières props, lues par les callbacks du moteur (jamais pendant le rendu)
  useEffect(function(){propsRef.current=p;});

  useEffect(function(){
    var reduced=false;
    try{reduced=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);}
    catch(e){console.warn("[CHEST] matchMedia:",e&&e.message);}
    var eng=createChestOpening({
      refs:{stage:stageRef,area:areaRef,label:labelRef,tell:tellRef,runes:runesRef,shock:shockRef,chest:chestRef,idle:idleRef,pips:pipsRef,halo:haloRef,rays:raysRef,beam:beamRef,flash:flashRef,dim:dimRef,canvas:canvasRef,recap:recapRef},
      cardEls:cardElsRef,
      tier:tier,
      reduced:reduced,
      ui:function(patch){setUi(function(u){return Object.assign({},u,patch);});},
      showCards:function(g){setGroups(g);},
      showRecap:function(model){setRecap(model);},
      setError:setError,
      close:function(){var cur=propsRef.current;if(cur&&cur.onClose)cur.onClose();},
    });
    engineRef.current=eng;
    duckBGM(true);
    eng.start();
    if(!openedRef.current){
      openedRef.current=true;
      try{
        var r=propsRef.current.onOpen();
        if(r&&typeof r.then==="function")r.then(null,function(e){console.warn("[CHEST] onOpen rejected:",e&&e.message);setError("failed");});
      }catch(e){console.warn("[CHEST] onOpen threw:",e&&e.message);setError("failed");}
    }else if(propsRef.current.result){
      eng.setResult(propsRef.current.result); // remontage (StrictMode) après l'arrivée du résultat
    }
    return function(){
      eng.destroy();
      if(engineRef.current===eng)engineRef.current=null;
      duckBGM(false);
    };
  },[tier]);

  // Le résultat réseau arrive (souvent pendant la chute du coffre)
  useEffect(function(){
    if(p.result&&engineRef.current)engineRef.current.setResult(p.result);
  },[p.result]);
  // Cartes et récap montés : le moteur peut les animer
  useEffect(function(){if(groups&&engineRef.current)engineRef.current.cardsMounted();},[groups]);
  useEffect(function(){if(recap&&engineRef.current)engineRef.current.recapMounted();},[recap]);

  function call(name){return function(a,b){var e=engineRef.current;if(e&&e[name])e[name](a,b);};}
  function close(){var cur=propsRef.current;if(cur&&cur.onClose)cur.onClose();}
  var errText=error&&ERROR_TEXT[error];

  return(<div className="chx-modal" role="dialog" aria-modal="true" aria-label={ct.label+" Chest"} onKeyDown={function(e){if(e.key==="Escape")call("escape")();}}>
    <div className="chx-stage" ref={stageRef}>
      <div className="chx-halo" ref={haloRef}/>
      <div className="chx-rays" ref={raysRef}><i/></div>
      <div className="chx-beam" ref={beamRef}/>
      <div className="chx-area" ref={areaRef}>
        <div className="chx-label" ref={labelRef}>{ct.label} Chest<small>{reason}</small></div>
        <div className="chx-tell" ref={tellRef}/>
        {tier===3&&<div className="chx-runes" ref={runesRef}><RuneCircle/></div>}
        <div className="chx-shock" ref={shockRef}/>
        <div className="chx-chest" ref={chestRef} role="button" tabIndex={0} aria-label="Open the chest"
          onPointerDown={call("pointerDown")} onPointerUp={call("pointerUp")} onPointerLeave={call("pointerCancel")} onPointerCancel={call("pointerCancel")}
          onKeyDown={function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();call("tap")();}}}>
          <div className="chx-idle" ref={idleRef}><TreasureChestSvg size={230} tier={tier} idSuffix="modal"/></div>
        </div>
        <div className="chx-pips" ref={pipsRef}><i/><i/><i/></div>
        {ui.chestHint&&<div className={"chx-hint chest"+(ui.chestHint.pulse?" pulse":"")} style={{opacity:1}}>{ui.chestHint.text}{ui.chestHint.sub&&<small>{ui.chestHint.sub}</small>}</div>}
      </div>
      <div className="chx-vignette"/>

      {groups&&groups.map(function(g,i){
        return(<ChestCard key={i} group={g} index={i}
          setRef={function(node){cardElsRef.current[i]=node;}}
          onActivate={function(){call("activateCard")(i);}}
          onPointerMove={function(e){call("cardPointerMove")(i,e);}}
          onPointerLeave={function(){call("cardPointerLeave")(i);}}/>);
      })}
      {ui.cardsHint&&<div className="chx-hint pulse" style={{top:ui.cardsHint.top,opacity:1}}>{ui.cardsHint.text}</div>}
      <div className="chx-dim" ref={dimRef} onClick={call("dimClick")}/>
      <canvas className="chx-fx" ref={canvasRef}/>

      {recap&&<div className="chx-recap" ref={recapRef}>
        <h2>LOOT</h2>
        <div className="sub">{ct.label+" Chest · "+recap.total+" reward"+(recap.total>1?"s":"")}</div>
        <div className="chx-grid">
          {recap.featured&&<ChestLootTile item={recap.featured} tier={rarityTier(recap.featured.rarity)} featured/>}
          {recap.rest.map(function(it,i){return <ChestLootTile key={i} item={it} tier={rarityTier(it.rarity)}/>;})}
        </div>
      </div>}

      {ui.cta&&!errText&&<div className="chx-cta">
        {ui.cta==="revealAll"&&<button type="button" className="chx-b2" onClick={call("revealAll")}>Reveal all</button>}
        {ui.cta==="collect"&&<button type="button" className="chx-b1" onClick={call("collect")}>Collect all</button>}
      </div>}
      {ui.skip&&!errText&&<button type="button" className="chx-skip" onClick={call("skip")}>{"Skip ›"}</button>}

      {/* Échec d'ouverture (rien n'a été crédité) ou attente anormalement longue */}
      {errText&&<div className="chx-error" role="alert">
        <div className="chx-name">{errText[0]}</div>
        <p>{errText[1]}</p>
        <button type="button" className="chx-b1" style={{flex:"none",width:220}} onClick={close}>Close</button>
      </div>}
      <div className="chx-flash" ref={flashRef}/>
    </div>
  </div>);
}
