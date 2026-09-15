// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { confirmPasswordReset } from "../../auth.js";
import { useState } from "react";
import { PasswordInput } from "../../components/PasswordInput.jsx";

// ═══════════════════════════════════════════
// RESET PASSWORD VIEW (Phase 1 — refonte 2026-04-24)
// Affiché quand l'URL contient ?reset=<token> (lien depuis mail Resend).
// Bypass complet du flow normal de l'app (onboarding/login/etc.).
// ═══════════════════════════════════════════
export function ResetPasswordView(p){
  var[pwd,setPwd]=useState("");
  var[confirm,setConfirm]=useState("");
  var[busy,setBusy]=useState(false);
  var[err,setErr]=useState("");
  var[done,setDone]=useState(false);

  function submit(){
    setErr("");
    if(pwd.length<8){setErr("Mot de passe trop court (8 caractères minimum)");return;}
    if(pwd!==confirm){setErr("Les deux mots de passe ne correspondent pas");return;}
    setBusy(true);
    confirmPasswordReset(p.token,pwd).then(function(){
      setBusy(false);
      setDone(true);
    }).catch(function(e){
      setBusy(false);
      setErr((e&&e.message)||"Erreur");
    });
  }

  if(done){
    return(<div className="enter onboard-shell" style={{padding:"40px 20px",maxWidth:420,margin:"0 auto",textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:16}}>{"✅"}</div>
      <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:12,color:"var(--gold)"}}>{"Mot de passe enregistré"}</h1>
      <p style={{color:"var(--t2)",fontSize:14,lineHeight:1.6,marginBottom:24}}>{"Tu peux maintenant te connecter avec ton nouveau mot de passe."}</p>
      <button className="btn1" onClick={function(){window.location.href="/";}}
        style={{width:"100%",fontSize:14,padding:"13px 20px",background:"linear-gradient(135deg,#f0c850,#d4943a)",color:"#1a1610",fontWeight:700}}>
        {"Continuer"}
      </button>
    </div>);
  }

  return(<div className="enter onboard-shell" style={{padding:"40px 20px",maxWidth:420,margin:"0 auto"}}>
    <div style={{textAlign:"center",marginBottom:28}}>
      <div style={{fontSize:56,marginBottom:12}}>{"🏰"}</div>
      <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:8,color:"var(--gold)"}}>{"Nouveau mot de passe"}</h1>
      <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.5}}>{"Choisis un mot de passe d'au moins 8 caractères."}</p>
    </div>
    <PasswordInput value={pwd} onChange={function(e){setPwd(e.target.value);}}
      placeholder="Nouveau mot de passe" autoComplete="new-password"
      style={{width:"100%",padding:"14px 16px",fontSize:14,marginBottom:12,background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",boxSizing:"border-box"}}/>
    <PasswordInput value={confirm} onChange={function(e){setConfirm(e.target.value);}}
      placeholder="Confirme le mot de passe" autoComplete="new-password"
      style={{width:"100%",padding:"14px 16px",fontSize:14,marginBottom:16,background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",boxSizing:"border-box"}}/>
    {err&&<div style={{color:"var(--red)",fontSize:13,marginBottom:12,textAlign:"center"}}>{err}</div>}
    <button className="btn1" onClick={submit} disabled={busy}
      style={{width:"100%",fontSize:14,padding:"13px 20px",background:"linear-gradient(135deg,#f0c850,#d4943a)",color:"#1a1610",fontWeight:700,opacity:busy?.6:1}}>
      {busy?"Enregistrement...":"Enregistrer"}
    </button>
    <button className="btn2" onClick={function(){window.location.href="/";}}
      style={{width:"100%",fontSize:12,padding:"10px 16px",marginTop:10,borderColor:"var(--bdr)",color:"var(--t3)"}}>
      {"Annuler"}
    </button>
  </div>);
}
