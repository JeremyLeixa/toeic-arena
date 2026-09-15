// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.

// ─── SMALL COMPONENTS ───
export function Bar(p){var pct=p.max>0?Math.min(100,p.value/p.max*100):0;return(<div style={{width:"100%",height:p.h||8,background:"var(--bg3)",borderRadius:99,overflow:"hidden"}}><div className="bar-fill" style={{width:pct+"%",height:"100%",background:p.color||"linear-gradient(90deg,var(--cx-hex),var(--cx-dark))",borderRadius:99,transition:"width .8s cubic-bezier(.4,0,.2,1)"}}/></div>);}
