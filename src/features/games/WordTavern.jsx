// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { Bar } from "../../components/Bar.jsx";
import { GIcon, ResultIcon } from "../../components/icons.jsx";
import { NextStepReco } from "../../components/NextStepReco.jsx";
import { VOCAB } from "../../data/vocab.js";
import { shuffle, today } from "../../lib/util.js";
import { playCorrect, playWrong } from "../../sounds.js";
import { useMemo, useState } from "react";

// ─── WORD TAVERN ───
export function WordTavern(p){
  var TOTAL=15;
  var qs=useMemo(function(){
    // Build flat list of all cards with their domain
    var all=[];
    VOCAB.forEach(function(dom){dom.cards.forEach(function(c){all.push({card:c,domId:dom.id,domCards:dom.cards});});});
    var pool=shuffle(all.slice()).slice(0,TOTAL);
    var questions=[];
    for(var i=0;i<pool.length;i++){
      var item=pool[i];var card=item.card;var domCards=item.domCards;
      // Pick 3 distractors from same domain (excluding correct card)
      var others=domCards.filter(function(c){return c.id!==card.id;});
      others=shuffle(others).slice(0,3);
      // If domain has < 4 cards, pad from other domains
      if(others.length<3){var extra=all.filter(function(a){return a.card.id!==card.id&&others.every(function(o){return o.id!==a.card.id;});});extra=shuffle(extra);while(others.length<3&&extra.length>0)others.push(extra.pop().card);}
      // Determine question type: 0-4=A (def→word), 5-9=B (word→def), 10-14=C (fill-blank)
      var qtype=i<5?"defToWord":i<10?"wordToDef":"fillBlank";
      var q=null;
      if(qtype==="defToWord"){
        var opts=shuffle([{text:card.w,correct:true}].concat(others.map(function(o){return{text:o.w,correct:false};})));
        q={type:"defToWord",prompt:card.d,opts:opts,card:card,example:card.e};
      } else if(qtype==="wordToDef"){
        var opts2=shuffle([{text:card.d,correct:true}].concat(others.map(function(o){return{text:o.d,correct:false};})));
        q={type:"wordToDef",prompt:card.w,opts:opts2,card:card,example:card.e};
      } else {
        // Fill-in-the-blank: replace word in example sentence
        var sentence=card.e;var regex=new RegExp("\\b"+card.w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b","i");
        if(regex.test(sentence)){
          var blanked=sentence.replace(regex,"_____");
          var opts3=shuffle([{text:card.w,correct:true}].concat(others.map(function(o){return{text:o.w,correct:false};})));
          q={type:"fillBlank",prompt:blanked,opts:opts3,card:card,example:card.e};
        } else {
          // Fallback to defToWord if word not found in example
          var opts4=shuffle([{text:card.w,correct:true}].concat(others.map(function(o){return{text:o.w,correct:false};})));
          q={type:"defToWord",prompt:card.d,opts:opts4,card:card,example:card.e};
        }
      }
      questions.push(q);
    }
    return shuffle(questions);
  },[]);

  var[ci,sC]=useState(0);
  var[sc,sSc]=useState(0);
  var[phase,sP]=useState("intro");
  var[sel,sSel]=useState(-1);
  var[missed,setMissed]=useState([]);

  function answer(idx){
    if(sel!==-1)return;
    sSel(idx);
    var correct=qs[ci].opts[idx].correct;
    if(correct){sSc(sc+1);try{playCorrect();}catch(e){}}
    else{
      try{playWrong();}catch(e){}
      // SRS reset: send missed word back to review
      var cardId=qs[ci].card.id;
      setMissed(function(prev){return prev.concat([cardId]);});
      if(p.u&&p.u.cardStates){
        var c=JSON.parse(JSON.stringify(p.u));
        c.cardStates[cardId]={ease:2.5,interval:0,nextReview:today(),correct:(c.cardStates[cardId]?c.cardStates[cardId].correct:0)||0,total:(c.cardStates[cardId]?c.cardStates[cardId].total:0)||0};
        p.resetCard(c);
      }
    }
  }

  function nextQ(){
    if(sel===-1)return;
    if(ci<qs.length-1){sC(ci+1);sSel(-1);}
    else{
      var finalSc=sc;
      // XP de BASE : miniDone applique les portes. Elle était déjà réduite ici, donc deux fois (2026-09-17).
      var baseXp=20+finalSc*6;
      sP("done");
      p.done(finalSc,TOTAL,baseXp);
    }
  }

  // ── INTRO ──
  if(phase==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="beer-stein" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Word Tavern</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>15 questions to test your vocabulary.<br/>Words you miss go back to flashcard review.</p>
    <p style={{color:"var(--t3)",fontSize:11,marginBottom:32}}>Definitions, meanings, and fill-in-the-blank</p>
    <button className="btn1" onClick={function(){sP("q");}}>Enter the Tavern</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  // ── DONE ──
  if(phase==="done"){
    var pct=TOTAL>0?sc/TOTAL:0;
    var emoji=pct>=0.8?"\uD83C\uDFC6":pct>=0.5?"\u2694\uFE0F":"\uD83D\uDEE1\uFE0F";
    var title=pct>=0.8?"Excellent!":pct>=0.5?"Well done!":"Keep studying!";
    var baseXp=20+sc*6;
    var gxp=p.gate?p.gate(baseXp,sc,TOTAL):baseXp;
    var missedCount=missed.length;
    return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{marginBottom:16,display:"flex",justifyContent:"center",animation:"countUp .6s"}}><ResultIcon e={emoji} size={56}/></div>
      <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>{title}</h1>
      <p style={{color:"var(--t2)",fontSize:16,marginBottom:4}}>{sc} / {TOTAL}</p>
      <p className="out" style={{color:"var(--gold)",fontWeight:700,fontSize:20,marginBottom:16}}>+{gxp} XP</p>
      {missedCount>0&&<p style={{fontSize:12,color:"var(--red)",marginBottom:16}}>{missedCount} word{missedCount>1?"s":""} sent back to flashcard review</p>}
      <button className="btn1" onClick={p.back} style={{marginTop:8}}>Back to Games</button>
      <NextStepReco u={p.u} fromMod="tavern" nav={p.nav}/>
    </div>);
  }

  // ── QUESTION ──
  var q=qs[ci];
  var qLabel=q.type==="defToWord"?"Which word matches this definition?":q.type==="wordToDef"?"What does this word mean?":"Fill in the blank:";
  return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{TOTAL}</span>
      <div style={{width:40}}/>
    </div>
    <Bar value={ci} max={TOTAL} h={4} color="linear-gradient(90deg,#c87a35,#8b5e83)"/>
    <div style={{marginTop:32,marginBottom:24}}>
      <div className="out" style={{fontSize:11,color:"var(--cx-hex)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:12}}>{qLabel}</div>
      <div className="crd" style={{padding:20,textAlign:"center",minHeight:80,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:q.type==="fillBlank"?15:q.type==="wordToDef"?24:15,fontWeight:q.type==="wordToDef"?800:400,lineHeight:1.5}}>{q.prompt}</div>
      </div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {q.opts.map(function(opt,oi){
        var isSelected=sel===oi;
        var isCorrect=opt.correct;
        var showResult=sel!==-1;
        var bg="var(--bg2)";var bdr="var(--bdr)";var col="var(--t1)";
        if(showResult&&isCorrect){bg="rgba(74,190,96,.15)";bdr="rgba(74,190,96,.5)";col="var(--green)";}
        else if(showResult&&isSelected&&!isCorrect){bg="rgba(224,82,82,.15)";bdr="rgba(224,82,82,.5)";col="var(--red)";}
        return(<button key={oi} onClick={function(){answer(oi);}} disabled={sel!==-1} style={{padding:"14px 16px",background:bg,border:"1.5px solid "+bdr,borderRadius:12,cursor:sel===-1?"pointer":"default",textAlign:"left",fontSize:14,color:col,lineHeight:1.4,fontFamily:"'DM Sans',sans-serif"}}>{opt.text}</button>);
      })}
    </div>
    {sel!==-1&&<div style={{marginTop:16,padding:"12px 16px",background:"var(--bg3)",borderRadius:10}}>
      <div style={{fontSize:12,color:"var(--t2)",fontStyle:"italic",lineHeight:1.5}}>{"\u201C"}{q.example}{"\u201D"}</div>
    </div>}
    {sel!==-1&&<button className="btn1" onClick={nextQ} style={{marginTop:16,width:"100%"}}>{ci<qs.length-1?"Next \u2192":"Finish"}</button>}
  </div>);
}
