// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.

// ─── LISTENING GRAPHIC (Part 3/4 "Look at the graphic") ───
// Renders a small table or list as the visual prompt for graphic questions.
// Shape: {type:"table", title?, headers:[...], rows:[[...],...]}  or  {type:"list", title?, items:[...]}
// The graphic is shown (not spoken); the question stem says "Look at the graphic.".
export function ListeningGraphic(p){
  var g=p.g;
  if(!g)return null;
  var wrap={background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,padding:"12px 14px",margin:"0 0 16px",animation:"fadeIn .3s"};
  var title=(<div className="out" style={{fontSize:10,textTransform:"uppercase",letterSpacing:1,fontWeight:700,color:"var(--cyan)",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
    <span style={{fontSize:12}}>📊</span>{g.title||"Refer to the information below"}</div>);
  if(g.type==="list"){
    return(<div style={wrap}>{title}
      <ul style={{margin:0,paddingLeft:18,display:"flex",flexDirection:"column",gap:6}}>
        {(g.items||[]).map(function(it,i){return(<li key={i} style={{fontSize:13,lineHeight:1.5,color:"var(--t1)"}}>{it}</li>);})}
      </ul></div>);
  }
  if(g.type==="bar"){
    // Lightweight skin-aware horizontal bar chart. data:[{label,value,display?}].
    var _vals=(g.data||[]).map(function(d){return d.value;});
    var _max=Math.max.apply(null,_vals.concat([1]));
    return(<div style={wrap}>{title}
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {(g.data||[]).map(function(d,i){
          var pct=Math.max(2,Math.round((d.value/_max)*100));
          return(<div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:"28%",minWidth:58,fontSize:11,color:"var(--t2)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{d.label}</div>
            <div style={{flex:1,height:16,background:"rgba(var(--bg3-rgb),.6)",borderRadius:4,overflow:"hidden"}}>
              <div style={{width:pct+"%",height:"100%",background:"var(--cyan)",borderRadius:4,transition:"width .4s"}}/>
            </div>
            <div style={{width:54,textAlign:"right",fontSize:11,fontWeight:700,color:"var(--t1)"}}>{d.display!=null?d.display:d.value}</div>
          </div>);
        })}
      </div></div>);
  }
  // type:"table" (default)
  return(<div style={wrap}>{title}
    <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
      <table style={{borderCollapse:"collapse",width:"100%",fontSize:12,minWidth:"max-content"}}>
        {g.headers&&<thead><tr>
          {g.headers.map(function(h,i){return(<th key={i} style={{textAlign:"left",padding:"7px 10px",background:"var(--bg3)",color:"var(--t2)",fontWeight:700,borderBottom:"1px solid var(--bdr)",whiteSpace:"nowrap"}}>{h}</th>);})}
        </tr></thead>}
        <tbody>
          {(g.rows||[]).map(function(row,ri){return(<tr key={ri} style={{background:ri%2?"rgba(var(--bg3-rgb),.35)":"transparent"}}>
            {row.map(function(cell,ci){return(<td key={ci} style={{padding:"7px 10px",color:"var(--t1)",borderBottom:"1px solid var(--bdr)",whiteSpace:"nowrap"}}>{cell}</td>);})}
          </tr>);})}
        </tbody>
      </table>
    </div></div>);
}
