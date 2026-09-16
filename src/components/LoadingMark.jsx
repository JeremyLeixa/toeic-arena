// Chargement et filet des écrans chargés à la demande (Phase 5, code-splitting, 2026-09-16).
import { Component } from "react";
import { BrandMark } from "./icons.jsx";

// Le bloc de chargement de l'app — blason qui pulse, « Verse Arena », « loading… » — déplacé
// tel quel depuis l'écran `ld` d'App.jsx. Il sert aussi de fallback aux <Suspense> des écrans
// lazy : `inline` en donne la version sous-page (padding au lieu du plein écran, les Tabs
// restent visibles, aucun saut de layout).
export function LoadingMark(p){
  var box=p.inline
    ?{display:"flex",alignItems:"center",justifyContent:"center",padding:"22vh 0"}
    :{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"};
  return(<div style={box}><div style={{textAlign:"center"}}>
    <div style={{animation:"pulse 1.6s ease-in-out infinite"}}>
      <BrandMark size={94} style={{margin:"0 auto"}}/>
    </div>
    <p className="out" style={{color:"var(--t1)",marginTop:16,letterSpacing:"0.24em",textTransform:"uppercase",fontSize:15}}>Verse Arena</p>
    <p style={{color:"var(--t3)",marginTop:5,letterSpacing:"0.3em",textTransform:"uppercase",fontSize:9}}>loading…</p>
  </div></div>);
}

// Filet sous un écran lazy : si son chunk ne peut pas être chargé (hors ligne sur un écran
// jamais visité, ou déploiement entre-temps avec un reload déjà tenté — voir main.jsx), on
// montre un bouton Reload au lieu d'un écran blanc (React 19 démonte toute la racine sur une
// erreur non attrapée). Classe : seule forme possible d'un error boundary. À poser avec une
// `key` liée à la route, pour repartir propre quand l'élève change d'écran.
export class LoadBoundary extends Component{
  constructor(p){super(p);this.state={err:null};}
  static getDerivedStateFromError(err){return{err:err};}
  componentDidCatch(err){console.warn("[CHUNK] LoadBoundary:",err&&err.message);}
  render(){
    if(!this.state.err)return this.props.children;
    return(<div style={{textAlign:"center",padding:"18vh 16px"}}>
      <p className="out" style={{color:"var(--t1)",fontSize:15,marginBottom:8}}>This screen could not be loaded.</p>
      <p style={{color:"var(--t3)",fontSize:12,marginBottom:18}}>Check your connection, then reload.</p>
      <button className="btn1" onClick={function(){window.location.reload();}} style={{fontSize:14,padding:"12px 24px"}}>Reload</button>
    </div>);
  }
}
