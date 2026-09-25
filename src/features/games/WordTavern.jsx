// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { GIcon } from "../../components/icons.jsx";
import { NextStepReco } from "../../components/NextStepReco.jsx";
import { SessionResult } from "../../components/SessionResult.jsx";
import { SessionTop, ComboBanner, AnswerCard, NextBar } from "../../components/SessionHud.jsx";
import { useSessionTrack } from "../../components/useSessionTrack.js";
import { VOCAB } from "../../data/vocab.js";
import { FALSE_FRIENDS } from "../../data/miniGames.js";
import { shuffle, shuffleOpts, today } from "../../lib/util.js";
import { moduleRef } from "../../lib/reviewRefs.js";
import { playCorrect, playWrong } from "../../sounds.js";
import { useMemo, useState, useRef } from "react";

// Faux amis (2026-09-25) : l'ancien module False Friends vit ici, 3 questions sur 15. Options permutées au montage
// (la banque met la bonne réponse en B ou C huit fois sur dix). Les réponses comptent AUSSI dans le module falsefr
// (extra.parts → miniSession) pour que son poids dans l'estimateur reste nourri ; ses erreurs gardent la ref falsefr.
var FF_PER_ROUND=3;
function permuteFF(ff){var s=shuffleOpts(ff.opts,ff.correct);return Object.assign({},ff,{opts:s.opts,correct:s.c});}

// ─── WORD TAVERN ───
export function WordTavern(p){
  var TOTAL=15;
  var qs=useMemo(function(){
    // Build flat list of all cards with their domain
    var all=[];
    VOCAB.forEach(function(dom){dom.cards.forEach(function(c){all.push({card:c,domId:dom.id,domCards:dom.cards});});});
    var pool=shuffle(all.slice()).slice(0,TOTAL-FF_PER_ROUND);
    var questions=[];
    for(var i=0;i<pool.length;i++){
      var item=pool[i];var card=item.card;var domCards=item.domCards;
      // Pick 3 distractors from same domain (excluding correct card)
      var others=domCards.filter(function(c){return c.id!==card.id;});
      others=shuffle(others).slice(0,3);
      // If domain has < 4 cards, pad from other domains
      if(others.length<3){var extra=all.filter(function(a){return a.card.id!==card.id&&others.every(function(o){return o.id!==a.card.id;});});extra=shuffle(extra);while(others.length<3&&extra.length>0)others.push(extra.pop().card);}
      // Type par position : 0-3 définition → mot, 4-7 mot → sens, 8-11 phrase à trou (+ 3 faux amis, plus bas)
      var qtype=i<4?"defToWord":i<8?"wordToDef":"fillBlank";
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
    shuffle(FALSE_FRIENDS).slice(0,FF_PER_ROUND).map(permuteFF).forEach(function(pf){
      questions.push({type:"falseFriend",prompt:pf.ex,ff:pf,example:pf.trap+" In French: "+pf.realFr+".",
        opts:pf.opts.map(function(t,oi){return{text:t,correct:oi===pf.correct};})});
    });
    return shuffle(questions);
  },[]);

  var[ci,sC]=useState(0);
  var[sc,sSc]=useState(0);
  var[phase,sP]=useState("intro");
  var[sel,sSel]=useState(-1);
  var[missed,setMissed]=useState([]);
  var mistakesRef=useRef([]);var sidRef=useRef(0);
  var okRef=useRef([]); // juste / faux par question (compte des faux amis pour falsefr)
  var track=useSessionTrack(); // HUD de session (lot 5, 2026-09-20)

  function answer(idx){
    if(sel!==-1)return;
    sSel(idx);
    var correct=qs[ci].opts[idx].correct;track.record(correct);okRef.current[ci]=correct;
    if(correct){sSc(sc+1);try{playCorrect();}catch(e){console.warn("[tavern] sfx:",e&&e.message);}}
    else{
      try{playWrong();}catch(e){console.warn("[tavern] sfx:",e&&e.message);}
      var wq=qs[ci];
      // Un faux ami n'a pas de carte : pas de retour en répétition espacée, ref du module falsefr (la chasse la relit).
      if(wq.type==="falseFriend"){
        mistakesRef.current.push({tag:"False friend · "+wq.ff.en,prompt:wq.ff.ex,noBlank:true,yours:wq.opts[idx].text,correct:wq.ff.opts[wq.ff.correct],why:wq.ff.trap+" (FR: "+wq.ff.realFr+")",ref:moduleRef("falsefr",wq.ff.en)});
        return;
      }
      mistakesRef.current.push(wq.type==="fillBlank"
        ?{tag:"Vocabulary · fill the blank",prompt:wq.prompt,yours:wq.opts[idx].text,correct:wq.card.w,why:wq.card.d,ref:moduleRef("tavern",wq.card.id,wq.type)}
        :{tag:wq.type==="defToWord"?"Vocabulary · definition → word":"Vocabulary · word → meaning",prompt:wq.prompt,noBlank:true,yours:wq.opts[idx].text,correct:wq.type==="defToWord"?wq.card.w:wq.card.d,why:"“"+wq.card.e+"”",ref:moduleRef("tavern",wq.card.id,wq.type)});
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
      // XP de BASE : la route (miniSession) applique les portes. Elle était déjà réduite ici, donc deux fois (2026-09-17).
      var baseXp=20+finalSc*6;
      // Les 3 faux amis comptent aussi dans falsefr (estimateur), sans consommer son anti-farming.
      var ffq=qs.filter(function(x){return x.type==="falseFriend";}),ffc=0;
      ffq.forEach(function(x){if(okRef.current[qs.indexOf(x)])ffc++;});
      sidRef.current=p.done(finalSc,TOTAL,baseXp,mistakesRef.current,{parts:{falsefr:{c:ffc,t:ffq.length}}});
      sP("done");
    }
  }

  // ── INTRO ──
  if(phase==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="beer-stein" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Word Tavern</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>15 questions to test your vocabulary.<br/>Words you miss go back to flashcard review.</p>
    <p style={{color:"var(--t3)",fontSize:11,marginBottom:32}}>Definitions, meanings, fill-in-the-blank, and a few false friends</p>
    <button className="btn1" onClick={function(){sP("q");}}>Enter the Tavern</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  // ── DONE ──
  if(phase==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Word Tavern" mistakes={mistakesRef.current}
    onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}>
    {missed.length>0&&<div className="crd" style={{padding:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><GIcon name="card-pick" size={18} color="var(--cyan)"/><span style={{fontSize:13,color:"var(--t2)"}}>{missed.length+" word"+(missed.length>1?"s":"")+" sent back to flashcard review"}</span></div>}
    <NextStepReco u={p.u} fromMod="tavern" nav={function(m,a){p.closeSession();p.nav(m,a);}}/>
  </SessionResult>);

  // ── QUESTION ──
  var q=qs[ci];
  var ffQ=q.type==="falseFriend";
  var qLabel=ffQ?"False friend · what does the word mean here?":q.type==="defToWord"?"Which word matches this definition?":q.type==="wordToDef"?"What does this word mean?":"Fill in the blank:";
  var rightOpt=q.opts.filter(function(o){return o.correct;})[0];
  // Faux ami : la phrase, le mot piégé souligné (comme dans l'ancien module).
  var ffParts=ffQ?q.prompt.split(new RegExp("("+q.ff.en.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","i")):null;
  return(<>
    <SessionTop n={TOTAL} cur={ci} results={track.results} streak={track.streak} onQuit={p.back}/>
    <ComboBanner combo={track.combo}/>
    <div style={{padding:"4px 16px 0"}}>
    <div style={{marginBottom:24}}>
      <div className="out" style={{fontSize:11,color:"var(--cx-hex)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:12}}>{qLabel}</div>
      <div className="crd" style={{padding:20,textAlign:"center",minHeight:80,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:ffQ?16:q.type==="fillBlank"?15:q.type==="wordToDef"?24:15,fontWeight:q.type==="wordToDef"?800:400,lineHeight:1.5}}>{ffQ
          ?ffParts.map(function(s,i){return i%2?<b key={i} style={{textDecoration:"underline",textDecorationColor:"var(--cyan)",textUnderlineOffset:4}}>{s}</b>:<span key={i}>{s}</span>;})
          :q.prompt}</div>
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
    {sel!==-1&&<AnswerCard ok={q.opts[sel].correct} answer={rightOpt.text} label={ffQ?"The trap":"Example"} why={ffQ?q.example:"\u201C"+q.example+"\u201D"}/>}
    </div>
    {sel!==-1&&<NextBar onNext={nextQ} last={ci===qs.length-1}/>}
  </>);
}
