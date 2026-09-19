// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { getOwnedTokens, TOKEN_TYPES, consumeToken } from "../data/chests.js";
import { useState, useEffect } from "react";

// V2 — Generic in-context token CTA. Self-fetches the token quantity, exposes a
// confirm modal, calls consumeToken on confirm, and arms a custom flag on the user.
// Used by Boss Reset (under Train Boss card) and Endless Resurrect (under Endless card).
export function TokenContextCTA(p){
  // p : tokenType, armField, ctaLabel, modalTitle, modalDesc, accentColor, headline
  var [qty,setQty]=useState(null);
  var [asking,setAsking]=useState(false);
  var [busy,setBusy]=useState(false);
  var [toast,setToast]=useState(null);
  useEffect(function(){
    getOwnedTokens(p.u.name,p.u.classCode||"visitor").then(function(t){setQty((t&&t[p.tokenType])||0);});
  },[]);
  if(qty===null||qty===0)return null;
  var info=TOKEN_TYPES[p.tokenType]||{};
  var icon=info.icon||"🎟️";
  var cap=info.cap||1;
  var color=p.accentColor||"var(--gold)";
  function doUse(){
    if(busy)return;
    setBusy(true);
    consumeToken(p.u.name,p.u.classCode||"visitor",p.tokenType,1).then(function(res){
      setBusy(false);setAsking(false);
      if(!res.ok){setToast({err:true,msg:"Failed: "+(res.error||"unknown")});setTimeout(function(){setToast(null);},2400);return;}
      // Dans boosts (jsonb persisté) : au haut du profil, le drapeau n'allait dans aucune colonne et le jeton,
      // déjà brûlé côté serveur, était perdu au premier rechargement depuis Supabase (retour sur l'onglet).
      var c=JSON.parse(JSON.stringify(p.u));if(!c.boosts)c.boosts={};c.boosts[p.armField]=true;
      p.setUser(c);
      setQty(qty-1);
      setToast({err:false,msg:icon+" "+(p.armedMsg||"Token armed")});
      setTimeout(function(){setToast(null);},2400);
    });
  }
  return(<div style={{padding:"12px 14px",marginBottom:10,borderRadius:12,background:"rgba(255,192,32,.06)",border:"1px solid rgba(255,192,32,.25)",display:"flex",alignItems:"center",gap:10}}>
    <span style={{fontSize:24,flexShrink:0}}>{icon}</span>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:12,fontWeight:700,color:color}}>{p.headline} (×{qty})</div>
      <div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>{p.cardDesc}</div>
    </div>
    <button onClick={function(){setAsking(true);}} className="btn2" style={{fontSize:11,padding:"7px 12px",flexShrink:0,whiteSpace:"nowrap"}}>Use</button>
    {asking&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={function(e){if(e.target===e.currentTarget)setAsking(false);}}>
      <div className="crd" style={{maxWidth:340,padding:20,textAlign:"center",border:"1px solid var(--bdr)"}}>
        <div style={{fontSize:48,marginBottom:12}}>{icon}</div>
        <h2 className="out" style={{fontSize:18,fontWeight:800,marginBottom:8}}>{p.modalTitle}</h2>
        <p style={{fontSize:13,color:"var(--t2)",marginBottom:6,lineHeight:1.5}}>{p.modalDesc}</p>
        <p style={{fontSize:12,color:"var(--t3)",marginBottom:18}}><strong style={{color:color}}>{Math.max(0,qty-1)} / {cap}</strong> will remain after use.</p>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button onClick={function(){setAsking(false);}} className="btn2" style={{flex:1,fontSize:13,padding:"10px 16px"}}>Cancel</button>
          <button onClick={doUse} disabled={busy} className="btn1" style={{flex:1,fontSize:13,padding:"10px 16px"}}>{busy?"...":"Use"}</button>
        </div>
      </div>
    </div>}
    {toast&&<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",padding:"12px 18px",borderRadius:10,background:toast.err?"rgba(220,58,80,.15)":"rgba(46,180,100,.15)",border:"1px solid "+(toast.err?"var(--red)":"var(--green)"),color:toast.err?"var(--red)":"var(--green)",fontSize:13,fontWeight:700,zIndex:10000}}>{toast.msg}</div>}
  </div>);
}
// Wrappers that fix the per-token copy.
export function BossResetCTA(p){
  return(<TokenContextCTA u={p.u} setUser={p.setUser} tokenType="boss_reset" armField="bossResetArmed"
    headline="Boss Reset available" cardDesc="Bypass the 24h cooldown to re-enter the boss now."
    modalTitle="Use Boss Reset?" modalDesc="Bypass the 24h cooldown on the Boss Test."
    armedMsg="Boss Reset armed — arena is open"/>);
}
export function EndlessResetCTA(p){
  return(<TokenContextCTA u={p.u} setUser={p.setUser} tokenType="endless_resurrect" armField="endlessResetArmed"
    headline="Endless Resurrect available" cardDesc="Bypass the 24h cooldown to replay an Endless run."
    modalTitle="Use Endless Resurrect?" modalDesc="Bypass the 24h cooldown on the Endless Arena."
    armedMsg="Endless Resurrect armed — replay your run"/>);
}
export function MockResetCTA(p){
  return(<TokenContextCTA u={p.u} setUser={p.setUser} tokenType="mock_reset" armField="mockResetArmed"
    headline="Mock Reset available" cardDesc="Bypass the lock to replay a completed Mock Test now."
    modalTitle="Use Mock Reset?" modalDesc="Unlocks the next Mock Test you play (any of the 3)."
    armedMsg="Mock Reset armed — pick your Mock"/>);
}
