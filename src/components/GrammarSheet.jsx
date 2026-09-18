// Le corps d'une fiche de grammaire (règle, patterns, pièges TOEIC), sans chrome. Déplacé de
// features/train/grammar.jsx le 2026-09-18 (lot 5 du Mentor) : la chasse aux erreurs (features/hunt/)
// l'ouvre au 3e échec d'une même question, et une feature n'importe pas le dossier d'une autre.
// Rendu par GrammarRef, EN PLACE dans la revue des erreurs de l'Exam Simulation (retour d'un étudiant,
// 2026-09-15 : le lien vers le cours démontait la liste), et dans la carte de réponse du Drill et de la
// chasse. Couleurs de fiche toujours par tone() (tests/check_tones.cjs lit ce fichier).
import { tone } from "../lib/tone.js";

export function GrammarSheet(p){
  var g=p.g;
  return(<div>
    {/* Rule summary */}
    <div style={{padding:"10px 14px",background:"rgba(var(--cx),.06)",border:"1px solid rgba(var(--cx),.12)",borderRadius:10,marginBottom:12}}>
      <p style={{fontSize:13,color:"var(--t1)",lineHeight:1.6,fontWeight:500}}>{g.rule}</p>
    </div>

    {/* Patterns */}
    {g.patterns.map(function(pt,j){
      return(<div key={j} style={{marginBottom:10,paddingLeft:12,borderLeft:"3px solid "+g.color+"40"}}>
        <div className="out" style={{fontSize:13,fontWeight:700,color:tone(g.color),marginBottom:2}}>{pt.p}</div>
        <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.5,marginBottom:4}}>{pt.d}</div>
        <div style={{fontSize:12,color:"var(--t3)",fontStyle:"italic",lineHeight:1.5}}>"{pt.ex}"</div>
      </div>);
    })}

    {/* TOEIC Traps */}
    <div style={{marginTop:8,padding:"10px 14px",background:"rgba(255,71,87,.06)",border:"1px solid rgba(255,71,87,.12)",borderRadius:10}}>
      <p style={{fontSize:11,fontWeight:700,color:"var(--red)",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>TOEIC Traps</p>
      <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.6}}>{g.traps}</p>
    </div>
  </div>);
}
