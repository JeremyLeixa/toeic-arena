// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { createCheckout } from "../../auth.js";
import { CGVPage, PrivacyPolicy, MediationInfo } from "../../components/legal.jsx";
import { CGV_VERSION } from "../../data/cgv.js";
import { PREMIUM_UPGRADE_ENABLED } from "../../lib/access.js";
import { save } from "../../lib/persistence.js";
import { useState } from "react";

// ─── UPGRADE SCREEN (Phase 3 Session 2) ───
// Full-page screen presenting Monthly vs Pass 3m and launching Stripe Checkout.
export function UpgradeScreen(p){
  var u=p.u;
  var[busy,setBusy]=useState(null); // null | "monthly" | "pass3m"
  var[err,setErr]=useState("");
  // Double consentement légal obligatoire avant paiement (art. L.221-5 + L.221-28 13° CC)
  var[acceptCGV,setAcceptCGV]=useState(false);
  var[waiveRetract,setWaiveRetract]=useState(false);
  var[showCGV,setShowCGV]=useState(false);
  var[showMediation,setShowMediation]=useState(false);
  var[showPrivacy,setShowPrivacy]=useState(false);
  var canPay=acceptCGV&&waiveRetract;

  async function go(plan){
    if(busy)return;
    if(!canPay){
      setErr("Merci de cocher les deux cases l\u00e9gales avant de payer.");
      return;
    }
    setBusy(plan);setErr("");
    try{
      if(!u.email){setErr("Ajoute d'abord un email \u00e0 ton compte (Profil \u2192 S\u00e9curiser).");setBusy(null);return;}
      // Persist consent trace BEFORE redirecting to Stripe. Legal utility :
      // en cas de litige ou demande CNIL, on peut prouver la date + version
      // des CGV acceptées et la date de la renonciation à la rétractation.
      // On conserve la 1ère date d'acceptation si déjà présente (ne pas
      // écraser un consentement antérieur à une version plus ancienne).
      //
      // Stratégie double :
      //   1. save() local+Supabase immédiat : trace côté localStorage et
      //      (tentative de) persistance dans la row students actuelle.
      //   2. Metadata passées à createCheckout → Stripe → webhook :
      //      le webhook écrit dans la MÊME row que access_level après
      //      confirmation du paiement. Garantit que la trace atterrit
      //      sur la bonne row même en cas de dédup/profil ambigu.
      var nowIso=new Date().toISOString();
      var c=JSON.parse(JSON.stringify(u));
      if(!c.cgvAcceptedAt)c.cgvAcceptedAt=nowIso;
      c.cgvVersion=CGV_VERSION;
      if(!c.retractationWaivedAt)c.retractationWaivedAt=nowIso;
      try{await save(c);}catch(saveErr){console.warn("[checkout] save consent failed:",saveErr&&saveErr.message);}
      // Remap vers l'API du backend en passant les valeurs du state local
      // (pas celles re-calculées, pour garder cohérent avec ce qu'on a
      // écrit en localStorage).
      await createCheckout(plan, {
        cgvVersion: c.cgvVersion,
        cgvAcceptedAt: c.cgvAcceptedAt,
        retractationWaivedAt: c.retractationWaivedAt,
        // Clé naturelle pour que le webhook update la BONNE row students.
        studentName: c.name,
        studentClassCode: c.classCode||"visitor",
      }); // redirects window.location to Stripe
    }catch(e){
      var msg=(e&&e.message)||"Erreur";
      if(msg==="email_required"){setErr("Ajoute d'abord un email \u00e0 ton compte (Profil \u2192 S\u00e9curiser).");}
      else setErr(msg);
      setBusy(null);
    }
  }

  // Si le flag global est OFF, on bloque l'écran entier — même si quelqu'un
  // atterrit ici via une URL directe ou un state routing cassé.
  if(!PREMIUM_UPGRADE_ENABLED){
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:440,margin:"0 auto"}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <div style={{textAlign:"center",marginTop:48}}>
        <div style={{fontSize:56,marginBottom:12,opacity:.6}}>{"\uD83D\uDEE0\uFE0F"}</div>
        <h1 className="out" style={{fontWeight:800,fontSize:22,marginBottom:12}}>{"Arena Premium"}</h1>
        <p style={{color:"var(--t2)",fontSize:14,lineHeight:1.6,marginBottom:8}}>{"Fonctionnalit\u00e9 \u00e0 venir."}</p>
      </div>
    </div>);
  }

  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>

    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{fontSize:56,marginBottom:8}}>{"\uD83C\uDFF0"}</div>
      <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>Arena Premium</h1>
      <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.5}}>Unlock the full arsenal {"\u00B7"} all modules, all tests, all rewards</p>
    </div>

    {/* TOEIC Pass 3 mois — Best value card (highlighted) */}
    <div className="crd" style={{marginBottom:14,padding:0,overflow:"hidden",border:"1.5px solid rgba(255,215,0,.4)",background:"linear-gradient(135deg,rgba(255,215,0,.06),rgba(var(--cx),.08))",position:"relative"}}>
      <div style={{position:"absolute",top:-1,right:12,background:"linear-gradient(135deg,#f0c850,#d4943a)",color:"#1a1610",fontWeight:800,fontSize:10,padding:"4px 10px",borderRadius:"0 0 8px 8px",letterSpacing:.5}} className="out">{"\uD83C\uDFC6 BEST VALUE"}</div>
      <div style={{padding:"22px 18px 18px"}}>
        <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:6}}>
          <span className="out" style={{fontWeight:800,fontSize:18,color:"var(--gold)"}}>TOEIC Pass</span>
          <span style={{fontSize:12,color:"var(--t2)"}}>{"\u00B7 3 mois"}</span>
        </div>
        <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:12}}>
          <span className="out" style={{fontWeight:900,fontSize:32,color:"var(--t1)"}}>22,99{"\u00A0\u20AC"}</span>
          <span style={{fontSize:12,color:"var(--t3)"}}>paiement unique</span>
        </div>
        <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.7,marginBottom:16}}>
          <div>{"\u2713 Tout l'acc\u00e8s Premium pendant 3 mois"}</div>
          <div>{"\u2713 Paiement unique, aucune reconduction"}</div>
          <div>{"\u2713 \u00C9conomise ~23% vs mensuel"}</div>
          <div>{"\u2713 Parfait avant un examen programm\u00e9"}</div>
        </div>
        <button className="btn1" disabled={busy==="pass3m"||!canPay} onClick={function(){go("pass3m");}}
          style={{width:"100%",fontSize:14,padding:"13px 20px",opacity:(busy==="pass3m"||!canPay)?0.45:1,cursor:canPay?"pointer":"not-allowed",background:"linear-gradient(135deg,#f0c850,#d4943a)",color:"#1a1610"}}>
          {busy==="pass3m"?"\u2026":"Choose Pass 3 mois \u2192"}
        </button>
      </div>
    </div>

    {/* Monthly — standard card */}
    <div className="crd" style={{marginBottom:14,padding:"18px",border:"1px solid var(--bdr)"}}>
      <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:6}}>
        <span className="out" style={{fontWeight:700,fontSize:16,color:"var(--t1)"}}>Premium Mensuel</span>
        <span style={{fontSize:12,color:"var(--t3)"}}>{"\u00B7 sans engagement"}</span>
      </div>
      <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:12}}>
        <span className="out" style={{fontWeight:800,fontSize:26,color:"var(--t1)"}}>9,99{"\u00A0\u20AC"}</span>
        <span style={{fontSize:12,color:"var(--t3)"}}>{"/mois"}</span>
      </div>
      <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.7,marginBottom:14}}>
        <div>{"\u2713 Tout l'acc\u00e8s Premium mois par mois"}</div>
        <div>{"\u2713 R\u00e9siliable \u00e0 tout moment"}</div>
        <div>{"\u2713 Flexible pour une pr\u00e9pa longue"}</div>
      </div>
      <button className="btn2" disabled={busy==="monthly"||!canPay} onClick={function(){go("monthly");}}
        style={{width:"100%",fontSize:14,padding:"12px 20px",opacity:(busy==="monthly"||!canPay)?0.45:1,cursor:canPay?"pointer":"not-allowed"}}>
        {busy==="monthly"?"\u2026":"Choose Monthly \u2192"}
      </button>
    </div>

    {err&&<div className="crd" style={{marginBottom:14,padding:"10px 14px",background:"rgba(255,71,87,.08)",border:"1px solid rgba(255,71,87,.25)",fontSize:12,color:"var(--red)"}}>{err}</div>}

    {/* Bloc légal d'information pré-contractuelle (art. L.221-5 CC).
        Les 3 pages accessibles SANS sortir du parcours de paiement (in-app). */}
    <div style={{marginTop:22,padding:"14px 16px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12}}>
      <div className="out" style={{fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>
        {"\u00C0 lire avant de payer"}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
        <button onClick={function(){setShowCGV(true);}} style={{background:"none",border:"none",padding:"6px 0",fontSize:13,color:"var(--cyan)",textAlign:"left",cursor:"pointer",textDecoration:"underline",fontFamily:"'DM Sans',sans-serif"}}>
          {"\uD83D\uDCDC Conditions G\u00e9n\u00e9rales de Vente"}
        </button>
        <button onClick={function(){setShowPrivacy(true);}} style={{background:"none",border:"none",padding:"6px 0",fontSize:13,color:"var(--cyan)",textAlign:"left",cursor:"pointer",textDecoration:"underline",fontFamily:"'DM Sans',sans-serif"}}>
          {"\uD83D\uDEE1\uFE0F Politique de confidentialit\u00e9"}
        </button>
        <button onClick={function(){setShowMediation(true);}} style={{background:"none",border:"none",padding:"6px 0",fontSize:13,color:"var(--cyan)",textAlign:"left",cursor:"pointer",textDecoration:"underline",fontFamily:"'DM Sans',sans-serif"}}>
          {"\u2696\uFE0F M\u00e9diation de la consommation"}
        </button>
      </div>

      {/* Checkbox 1 — acceptation CGV (obligation L.221-5) */}
      <label style={{display:"flex",gap:10,alignItems:"flex-start",cursor:"pointer",marginBottom:10,padding:"8px 0"}}>
        <input type="checkbox" checked={acceptCGV} onChange={function(e){setAcceptCGV(e.target.checked);setErr("");}}
          style={{marginTop:2,width:18,height:18,flexShrink:0,accentColor:"var(--cx-hex)"}}/>
        <span style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>
          {"J'ai lu et j'accepte les "}<button type="button" onClick={function(e){e.preventDefault();setShowCGV(true);}} style={{background:"none",border:"none",padding:0,color:"var(--cyan)",textDecoration:"underline",cursor:"pointer",fontFamily:"inherit",fontSize:"inherit"}}>Conditions G\u00e9n\u00e9rales de Vente</button>{" de Verse Arena."}
        </span>
      </label>

      {/* Checkbox 2 — renonciation expresse au droit de rétractation (obligation L.221-28 13°) */}
      <label style={{display:"flex",gap:10,alignItems:"flex-start",cursor:"pointer",padding:"8px 0"}}>
        <input type="checkbox" checked={waiveRetract} onChange={function(e){setWaiveRetract(e.target.checked);setErr("");}}
          style={{marginTop:2,width:18,height:18,flexShrink:0,accentColor:"var(--cx-hex)"}}/>
        <span style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>
          {"Je demande express\u00e9ment l'ex\u00e9cution imm\u00e9diate du Service d\u00e8s confirmation du paiement et je renonce, en cons\u00e9quence, \u00e0 mon droit de r\u00e9tractation de 14 jours (art. L.221-28 13\u00b0 du Code de la consommation)."}
        </span>
      </label>
    </div>

    {/* Fine print */}
    <div style={{fontSize:10,color:"var(--t3)",lineHeight:1.6,textAlign:"center",marginTop:16}}>
      {"Paiement s\u00e9curis\u00e9 par Stripe \u00B7 TVA non applicable, art. 293 B du CGI"}
    </div>

    {/* Overlays in-app — évite de perdre la session en sortant vers une URL externe */}
    {showCGV&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"var(--bg)",zIndex:9999,overflow:"auto"}}>
      <CGVPage onClose={function(){setShowCGV(false);}}/>
    </div>}
    {showPrivacy&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"var(--bg)",zIndex:9999,overflow:"auto"}}>
      <PrivacyPolicy onClose={function(){setShowPrivacy(false);}}/>
    </div>}
    {showMediation&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"var(--bg)",zIndex:9999,overflow:"auto"}}>
      <MediationInfo onClose={function(){setShowMediation(false);}}/>
    </div>}
  </div>);
}
