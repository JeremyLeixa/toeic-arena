// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { Bar } from "../../components/Bar.jsx";
import { GIcon } from "../../components/icons.jsx";
import { SessionResult } from "../../components/SessionResult.jsx";
import { CLUE_HUNTER } from "../../data/clueHunter.js";
import { shuffle, shuffleOpts } from "../../lib/util.js";
import { moduleRef } from "../../lib/reviewRefs.js";
import { playCorrect, playWrong } from "../../sounds.js";
import { useState, useRef } from "react";

// ─── CLUE HUNTER ───
export function ClueHunter(p){
  var TOTAL=10;
  var[phase,sP]=useState("intro");
  var[ci,sC]=useState(0);
  // Options permutées par item (bonne réponse en B ou C 62 fois sur 80 dans la banque). Les indices
  // (chips) suivent l'ordre de la phrase et ne bougent pas.
  var[items]=useState(function(){return shuffle(CLUE_HUNTER.slice()).slice(0,TOTAL).map(function(it){var s=shuffleOpts(it.opts,it.ans);return Object.assign({},it,{opts:s.opts,ans:s.c});});});
  var[selected,setSel]=useState([]);
  var[pick,sPk]=useState(-1);
  var[scores,setSc]=useState([]);
  var mistakesRef=useRef([]);var sidRef=useRef(0);
 
  function toggleChip(idx){
    if(phase!=="q")return;
    setSel(function(prev){return prev.includes(idx)?prev.filter(function(i){return i!==idx;}):prev.concat([idx]);});
  }
 
  function confirmClues(){if(selected.length===0)return;sP("clue_fb");}
  function goAnswer(){sP("ans");}
 
  function pickAnswer(i){
    if(phase!=="ans")return;
    var item=items[ci];
    var clueOK=selected.length>0&&selected.every(function(s){return item.chips[s].c;})&&selected.some(function(s){return item.chips[s].c;});
    var ansOK=i===item.ans;
    var pts=clueOK&&ansOK?10:clueOK&&!ansOK?4:!clueOK&&ansOK?3:0;
    // Mauvaise réponse : la phrase à trou. Bonne réponse sur un mauvais indice : la phrase complète et les indices.
    if(!ansOK)mistakesRef.current.push({tag:"Clue Hunter · "+item.cat,prompt:item.sentence,yours:item.opts[i],correct:item.opts[item.ans],why:item.exp,ref:moduleRef("clue",item.id,null,item.cat)});
    else if(!clueOK)mistakesRef.current.push({tag:"Clue Hunter · "+item.cat+" · clue",prompt:item.sentence.replace("___",item.opts[item.ans]),noBlank:true,yours:selected.map(function(k){return item.chips[k].w;}).join(" + "),correct:item.chips.filter(function(ch){return ch.c;}).map(function(ch){return ch.w;}).join(" + "),why:item.clue});
    setSc(function(prev){return prev.concat([{clue:clueOK,ans:ansOK,pts:pts}]);});try{if(ansOK)playCorrect();else playWrong();}catch(e){}
    sPk(i);sP("ans_fb");
  }
 
  // Fin de partie : XP versée ici, plus derrière « Collect XP » (quitter l'écran de fin la perdait).
  function next(){
    if(ci<items.length-1){sC(ci+1);setSel([]);sPk(-1);sP("q");}
    else{
      var ptsTotal=scores.reduce(function(a,x){return a+x.pts;},0);
      var correct=scores.filter(function(x){return x.clue||x.ans;}).length;
      sidRef.current=p.done(correct,TOTAL,20+Math.round(ptsTotal*2.5),mistakesRef.current);
      sP("done");
    }
  }
 
  // ── shared sentence renderer ──
  function SentenceCard({item,answerWord,isCorrect}){
    var parts=item.sentence.split("___");
    return(
      <div className="crd" style={{padding:"28px 24px",marginBottom:24,background:"rgba(var(--cx),.04)",borderColor:"rgba(var(--cx),.12)"}}>
        <p style={{fontSize:20,lineHeight:1.8,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif"}}>
          {parts.map(function(part,i){return(<span key={i}>{part}
            {i<parts.length-1&&(answerWord
              ?<span style={{color:isCorrect?"var(--green)":"var(--red)",fontWeight:700,borderBottom:"3px solid "+(isCorrect?"var(--green)":"var(--red)"),padding:"0 4px"}}>{answerWord}</span>
              :<span style={{display:"inline-block",minWidth:88,borderBottom:"3px solid var(--cyan)",margin:"0 6px",verticalAlign:"bottom",opacity:.6}}>{"        "}</span>)}
          </span>);})}
        </p>
      </div>
    );
  }
 
  function Header(){
    return(<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div/>
        <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1} / {TOTAL}</span>
      </div>
      <Bar value={phase==="ans_fb"?ci+1:ci} max={TOTAL} h={4} color="linear-gradient(90deg,var(--cx-hex),#8b5e83)"/>
      <div style={{marginTop:20,marginBottom:12}}>
        <span className="out" style={{fontSize:11,fontWeight:700,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1}}>{"🧭"} {phase==="clue_fb"||phase==="ans_fb"?items[ci].cat:"Find the clue..."}</span>
      </div>
    </>);
  }
 
  // ── INTRO ──
  if(phase==="intro")return(
    <div className="enter" style={{padding:"32px 24px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="spyglass" size={76} color="var(--cyan)"/></div>
        <h1 className="out" style={{fontWeight:900,fontSize:32,marginBottom:10}}>Clue Hunter</h1>
        <p style={{color:"var(--t2)",fontSize:15,lineHeight:1.7}}>Spot the grammatical clue in the sentence.<br/>Then fill in the blank.</p>
      </div>
      <div className="crd" style={{marginBottom:24,padding:22}}>
        <p className="out" style={{fontSize:11,fontWeight:700,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1,marginBottom:16}}>How it works</p>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {[
            {n:"1",t:"Read the sentence",d:"A key word (or words) will tell you which form is correct."},
            {n:"2",t:"Tap your clue(s)",d:"Select what's guiding your answer — before you see the options."},
            {n:"3",t:"Fill the blank",d:"Right clue + right answer = max XP."},
          ].map(function(s){return(
            <div key={s.n} style={{display:"flex",gap:14,alignItems:"flex-start"}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span className="out" style={{fontSize:13,fontWeight:800,color:/*fond local*/"#fff"}}>{s.n}</span>
              </div>
              <div><div className="out" style={{fontWeight:700,fontSize:14,color:"var(--t1)"}}>{s.t}</div>
                <div style={{fontSize:13,color:"var(--t2)",marginTop:3,lineHeight:1.5}}>{s.d}</div></div>
            </div>);})}
        </div>
      </div>
      <div className="crd" style={{marginBottom:28,background:"rgba(255,215,0,.06)",borderColor:"rgba(255,215,0,.15)",padding:"14px 18px"}}>
        <p className="out" style={{fontSize:11,fontWeight:700,color:"var(--gold)",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Scoring</p>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.5}}>Right clue + right answer <span style={{color:"var(--gold)",fontWeight:700}}>10 pts</span> &nbsp;·&nbsp; Right clue only <span style={{color:"var(--cyan)",fontWeight:700}}>4 pts</span> &nbsp;·&nbsp; Right answer only <span style={{color:"var(--orange)",fontWeight:700}}>3 pts</span></p>
      </div>
      <button className="btn1" onClick={function(){sP("q");}}>Start — {TOTAL} Questions</button>
      <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button>
    </div>);
 
  // ── DONE ──
  if(phase==="done"){
    var total=scores.reduce(function(a,x){return a+x.pts;},0);
    var perfect=scores.filter(function(x){return x.clue&&x.ans;}).length;
    var clueOnly=scores.filter(function(x){return x.clue&&!x.ans;}).length;
    var ansOnly=scores.filter(function(x){return !x.clue&&x.ans;}).length;
    // Sceau en points (10 / 4 / 3) : « correct » compte indice OU réponse, un 10 of 10 « flawless » mentait
    // dès qu'un indice ou une réponse manquait. Les portes d'XP gardent correct/TOTAL.
    return(<SessionResult session={p.session} sid={sidRef.current} name="Clue Hunter" mode="points" points={total} pointsLabel={"of "+(TOTAL*10)+" pts"} mistakes={mistakesRef.current}
      onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}>
      <div className="crd" style={{padding:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
          <div><div className="out" style={{fontSize:26,fontWeight:900,color:"var(--green)"}}>{perfect}</div><div style={{fontSize:11,color:"var(--t2)",marginTop:2}}>Clue + answer</div></div>
          <div><div className="out" style={{fontSize:26,fontWeight:900,color:"var(--cyan)"}}>{clueOnly}</div><div style={{fontSize:11,color:"var(--t2)",marginTop:2}}>Clue only</div></div>
          <div><div className="out" style={{fontSize:26,fontWeight:900,color:"var(--orange)"}}>{ansOnly}</div><div style={{fontSize:11,color:"var(--t2)",marginTop:2}}>Answer only</div></div>
        </div>
      </div>
    </SessionResult>);
  }
 
  var item=items[ci];
  var lastScore=scores[scores.length-1];
 
  // ── Q : CLUE HUNT ──
  if(phase==="q")return(
    <div style={{padding:"20px 20px 100px",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header/>
      <SentenceCard item={item}/>
      <p className="out" style={{fontSize:13,fontWeight:600,color:"var(--t2)",marginBottom:18,textAlign:"center"}}>
        Which word(s) tell you the correct form?
      </p>
      <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:32,justifyContent:"center"}}>
        {item.chips.map(function(chip,idx){
          var isSel=selected.includes(idx);
          return(
            <button key={idx} onClick={function(){toggleChip(idx);}}
              style={{padding:"11px 20px",borderRadius:28,border:"2px solid "+(isSel?"var(--cyan)":"var(--bdr)"),background:isSel?"rgba(var(--cx),.12)":"var(--bg2)",color:isSel?"var(--cyan)":"var(--t1)",fontSize:15,fontFamily:"'DM Sans',sans-serif",fontWeight:isSel?700:500,cursor:"pointer",transition:"all .15s",transform:isSel?"scale(1.05)":"scale(1)"}}>
              {chip.w}
            </button>);
        })}
      </div>
      <div style={{marginTop:"auto"}}>
        <button className="btn1" onClick={confirmClues}
          style={{opacity:selected.length>0?1:.3,pointerEvents:selected.length>0?"auto":"none",fontSize:16}}>
          Confirm my clue{selected.length>1?"s":""} →
        </button>
        <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button>
      </div>
    </div>);
 
  // ── CLUE FEEDBACK ──
  if(phase==="clue_fb")return(
    <div className="enter" style={{padding:"20px 20px 100px",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header/>
      <SentenceCard item={item}/>
      <p className="out" style={{fontSize:11,fontWeight:700,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:14,textAlign:"center"}}>Your clues</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:28,justifyContent:"center"}}>
        {item.chips.map(function(chip,idx){
          var isSel=selected.includes(idx);
          var isReal=chip.c;
          var col=!isSel?"var(--t3)":isReal?"var(--green)":"var(--red)";
          var bg=!isSel?"transparent":isReal?"rgba(0,230,118,.12)":"rgba(255,71,87,.12)";
          var bd=!isSel?"var(--bdr)":isReal?"var(--green)":"var(--red)";
          return(
            <div key={idx} style={{padding:"11px 20px",borderRadius:28,border:"2px solid "+bd,background:bg,color:col,fontSize:15,fontWeight:isSel?700:400,display:"flex",alignItems:"center",gap:6}}>
              {chip.w}{isSel&&<span style={{fontSize:14}}>{isReal?"✓":"✗"}</span>}
            </div>);
        })}
      </div>
      <div className="crd" style={{padding:20,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",marginBottom:28}}>
        <p className="out" style={{fontSize:11,fontWeight:700,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>{"💡"} Clue analysis</p>
        <p style={{fontSize:14,color:"var(--t2)",lineHeight:1.65}}>{item.clue}</p>
      </div>
      <div style={{marginTop:"auto"}}>
        <button className="btn1" onClick={goAnswer} style={{fontSize:16}}>Now answer →</button>
        <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button>
      </div>
    </div>);
 
  // ── ANSWER ──
  if(phase==="ans")return(
    <div className="enter" style={{padding:"20px 20px 100px",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header/>
      <SentenceCard item={item}/>
      <p className="out" style={{fontSize:13,fontWeight:600,color:"var(--t2)",marginBottom:18,textAlign:"center"}}>Choose the correct form:</p>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {item.opts.map(function(opt,i){
          return(
            <button key={i} onClick={function(){pickAnswer(i);}}
              style={{padding:"16px 20px",borderRadius:14,border:"1px solid var(--bdr)",background:"var(--bg2)",color:"var(--t1)",fontSize:16,fontFamily:"'DM Sans',sans-serif",fontWeight:500,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,transition:"all .15s"}}>
              <span className="out" style={{width:30,height:30,borderRadius:"50%",border:"2px solid var(--t3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0,color:"var(--t3)"}}>
                {String.fromCharCode(65+i)}
              </span>
              {opt}
            </button>);
        })}
      </div>
      <button className="btn2" onClick={p.back} style={{marginTop:16,width:"100%"}}>Back</button>
    </div>);
 
  // ── ANSWER FEEDBACK ──
  if(phase==="ans_fb"){
    var isCorrect=pick===item.ans;
    return(
      <div className={"enter"+(isCorrect?"":" sk")} style={{padding:"20px 20px 100px",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <Header/>
        <SentenceCard item={item} answerWord={item.opts[item.ans]} isCorrect={isCorrect}/>
        {lastScore&&<div style={{textAlign:"center",marginBottom:20}}>
          <div className="out" style={{fontSize:24,fontWeight:900,color:lastScore.pts>=10?"var(--gold)":lastScore.pts>=4?"var(--cyan)":lastScore.pts>0?"var(--orange)":"var(--t3)"}}>
            {lastScore.pts>0?"+"+lastScore.pts+" pts":"No points"}{lastScore.pts>=10&&" 🔥"}
          </div>
          <div style={{fontSize:12,color:"var(--t3)",marginTop:4}}>
            {lastScore.clue&&lastScore.ans?"Perfect — clue + answer ✓":lastScore.clue?"Right clue, wrong answer":lastScore.ans?"Right answer, but what was the clue?":"Keep practising!"}
          </div>
        </div>}
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
          {item.opts.map(function(opt,i){
            var isCor=i===item.ans;var isPk=i===pick;
            var bg=isCor?"rgba(0,230,118,.12)":isPk&&!isCor?"rgba(255,71,87,.12)":"var(--bg2)";
            var bd=isCor?"var(--green)":isPk&&!isCor?"var(--red)":"var(--bdr)";
            return(
              <div key={i} style={{padding:"14px 20px",borderRadius:14,border:"1px solid "+bd,background:bg,display:"flex",alignItems:"center",gap:14}}>
                <span className="out" style={{width:30,height:30,borderRadius:"50%",border:"2px solid "+(isCor?"var(--green)":isPk?"var(--red)":"var(--bdr)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0,background:isCor?"var(--green)":isPk&&!isCor?"var(--red)":"transparent",color:(isCor||isPk)?"#fff":"var(--t3)"}}>
                  {isCor?"✓":isPk?"✗":String.fromCharCode(65+i)}
                </span>
                <span style={{fontSize:15,color:"var(--t1)"}}>{opt}</span>
              </div>);
          })}
        </div>
        <div className="crd" style={{padding:18,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",marginBottom:24}}>
          <p style={{fontSize:14,color:"var(--t2)",lineHeight:1.65}}>{item.exp}</p>
        </div>
        <div style={{marginTop:"auto"}}>
          <button className="btn1" onClick={next} style={{fontSize:16}}>
            {ci<items.length-1?"Next Question →":"See Results"}
          </button>
          <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button>
        </div>
      </div>);
  }
 
  return null;
}
