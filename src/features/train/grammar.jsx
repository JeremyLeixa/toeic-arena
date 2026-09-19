// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { Bar } from "../../components/Bar.jsx";
import { GrimoireReader } from "../../components/GrimoireReader.jsx";
import { GIcon } from "../../components/icons.jsx";
import { NextStepReco } from "../../components/NextStepReco.jsx";
import { SessionResult } from "../../components/SessionResult.jsx";
import { SessionTop, ComboBanner, AnswerCard, NextBar } from "../../components/SessionHud.jsx";
import { useSessionTrack } from "../../components/useSessionTrack.js";
import { SpeakBtn } from "../../components/SpeakBtn.jsx";
import { GRIMOIRE_CONNECTORS } from "../../data/connectorsGrimoire.js";
import { GRIMOIRE_GERUND } from "../../data/gerundGrimoire.js";
import { WORD_FAMILIES } from "../../data/grammar.js";
import { LINKING_BRIDGE } from "../../data/linkingBridge.js";
import { CONNECTORS, CONNECTOR_RULES, PREP_COLLOCATIONS, GERUND_INF, TOEIC_TRAPS, FALSE_FRIENDS } from "../../data/miniGames.js";
import { GRIMOIRE_PHRASAL } from "../../data/phrasalGrimoire.js";
import { PHRASAL_VERBS } from "../../data/phrasalVerbs.js";
import { drillComposition } from "../../lib/planner.js";
import { shufP5 } from "../../lib/optionShuffle.js";
import { briefing, questionBadge, questionFeedback, drillRemember } from "../../lib/mentorVoice.js";
import { AldricBrief, AldricRemembers } from "../../components/MentorMemory.jsx";
import { GrammarSheet } from "../../components/GrammarSheet.jsx";
import { shuffle, shuffleOpts, today } from "../../lib/util.js";
import { moduleRef } from "../../lib/reviewRefs.js";
import { playCorrect, playWrong } from "../../sounds.js";
import { useMemo, useState, useRef, useEffect } from "react";
import { GRAMMAR_SHEETS, CAT_SHEET } from "../../data/grammarSheets.js";

// ─── DRILL SESSION ───
// Mentor qui se souvient, lot 5 (2026-09-18) : la manche est COMPOSÉE par le plan (lib/planner.js
// drillComposition) au lieu du tirage pondéré aveugle 60/40 de l'ancien pickAdaptive : 4 questions sur la
// catégorie visée (quête Part 5 du plan figé, sinon la plus faible, récente ou cumulée), 2 sur une
// catégorie « méritée » (allégée), jusqu'à 2 erreurs dues glissées, le reste mêlé — et jamais une
// créature du bestiaire tirée au hasard (elle revient par sa dette, sinon l'espacement est cassé).
// Aldric l'annonce (briefing), chaque question due porte sa mémoire (SessionTop sub) et sa conséquence
// (AnswerCard, avec la fiche de grammaire au 3e échec), et l'écran de fin dit ce qui a changé.
export function Drill(p){
// Options permutées au montage (banque de grammaire : bonne réponse en B 61 % du temps, en D 4 %).
var comp=useMemo(function(){var c=drillComposition(p.u,new Date());c.items=c.items.map(function(it){return Object.assign({},it,{q:shufP5(it.q)});});return c;},[]);
var qs=comp.items; // [{role:"focus"|"eased"|"due"|"mixed", q, item?}]
var brief=useMemo(function(){return briefing(comp,p.u,new Date());},[]);
var seed=(p.u.name||"")+today();
var[ci,sC]=useState(0);var[sel,sS]=useState(-1);var[sc,sSc]=useState(0);var[ph,sP]=useState(brief.lines.length?"brief":"q");var[sk,sSk]=useState(false);
var[sheet,setSheet]=useState(false);
// Per-cat counter populated through the round, persisted via p.done → drillDone → recordModule. Les
// échéances n'y entrent pas : une question déjà vue, explication lue, prouve qu'on l'a retenue, pas
// qu'on maîtrise la catégorie (même règle que la chasse, lib/learnerModel.js catSeries).
var catStatsRef=useRef({});
// Écran de fin commun (2026-09-17) : erreurs gardées pour « Lessons to keep », sid de la session
// rendu par p.done (drillDone) pour n'afficher que CETTE session.
var mistakesRef=useRef([]);var sidRef=useRef(0);
// Bestiaire : réponses de la manche (carte « Aldric remembers ») et échéances battues (drillDone).
var resultsRef=useRef([]);var hitsRef=useRef([]);
// HUD de session (2026-09-17, variante E) : réponses de la manche pour le fil d'encre et le combo.
var track=useSessionTrack();
function doAns(i){
  sS(i);
  var it=qs[ci],q=it.q;var cat=q.cat||"Other";
  var correct=i===q.c;
  if(it.role!=="due"){var prev=catStatsRef.current[cat]||{correct:0,total:0};catStatsRef.current[cat]={correct:prev.correct+(correct?1:0),total:prev.total+1};}
  // ref : la question entre au bestiaire (lib/review.js). Préfixe "drill:" pour toute la banque de
  // grammaire, quel que soit le module : ratée ici ou dans le Daily, c'est la même créature.
  if(!correct)mistakesRef.current.push({tag:q.cat,prompt:q.s,yours:q.o[i],correct:q.o[q.c],why:q.x,ref:{k:"drill:"+q.id,cat:q.cat,part:"p5"}});
  else if(it.role==="due")hitsRef.current.push("drill:"+q.id);
  resultsRef.current.push({role:it.role,ok:correct,q:q,item:it.item});
  track.record(correct);
  if(correct){sSc(sc+1);try{playCorrect();}catch(e){console.warn("[drill] son :",e&&e.message);}}
  else{try{playWrong();}catch(e){console.warn("[drill] son :",e&&e.message);}sSk(true);setTimeout(function(){sSk(false);},500);}
  sP("fb");
}
// Fin de manche : la session est calculée et sauvegardée ICI (p.done), l'écran l'affiche ensuite.
// Plus de p.gate() au rendu : il relisait les compteurs du jour déjà incrémentés (XP affichée ≠ versée).
function nxt(){setSheet(false);if(ci<qs.length-1){sC(ci+1);sS(-1);sP("q");}else{sidRef.current=p.done(sc,qs.length,20+sc*7,catStatsRef.current,mistakesRef.current,hitsRef.current);sP("done");}}

if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Grammar Drill" mistakes={mistakesRef.current}
  memory={<AldricRemembers lines={drillRemember(comp,resultsRef.current)}/>}
  onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}>
  <NextStepReco u={p.u} fromMod="drill" nav={function(m,a){p.closeSession();p.nav(m,a);}}/>
</SessionResult>);

// Avant la manche : Aldric dit comment il l'a composée (rien à dire → on commence directement).
if(ph==="brief")return(<>
<SessionTop n={qs.length} cur={0} results={[]} streak={0} onQuit={p.back}/>
<div style={{padding:"4px 16px 0"}}><AldricBrief brief={brief} title="Aldric's drill"/></div>
<NextBar onNext={function(){sP("q");}} label="Begin"/>
</>);

// La barre et le pied sont fixes : ils vivent HORS du bloc .sk (le shake anime transform, un fixed
// suivrait le bloc). SessionTop masque aussi la tab bar sur mobile tant qu'il est à l'écran.
var it=qs[ci],q=it.q;var isOk=sel===q.c;
var badge=it.role==="due"?questionBadge(it.item):null;
var sheetId=CAT_SHEET[q.cat]||null;
var feed=ph==="fb"?questionFeedback({role:it.role,item:it.item,cat:q.cat,ok:isOk,hasSheet:!!sheetId,series:comp.eased&&comp.eased.cat===q.cat?comp.eased.series:null,seed:seed,k:q.id}):null;
return(<>
<SessionTop n={qs.length} cur={ci} results={track.results} streak={track.streak} onQuit={p.back}
  sub={badge?<><GIcon name={badge.icon} size={12} color="currentColor" style={{verticalAlign:"-2px",marginRight:5}}/>{badge.text}</>:null}/>
<ComboBanner combo={track.combo}/>
<div className={sk?"sk":""} style={{padding:"4px 16px 0"}}>
<span className="out" style={{fontSize:11,fontWeight:600,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1,display:"block"}}>{q.cat}</span>
<h2 className="qstem" style={{fontWeight:700,fontSize:19,lineHeight:1.5,marginBottom:24,marginTop:8}}>{q.s}</h2>
<div style={{display:"flex",flexDirection:"column",gap:10}}>{q.o.map(function(opt,i){var iS=sel===i,iC=i===q.c,sr=ph==="fb",bg="var(--bg2)",bd="var(--bdr)";
if(sr&&iC){bg="rgba(0,230,118,.12)";bd="var(--green)";}else if(sr&&iS&&!iC){bg="rgba(255,71,87,.12)";bd="var(--red)";}
return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={ph==="fb"} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:15,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
<div style={{width:28,height:28,borderRadius:"50%",border:"2px solid "+(sr&&iC?"var(--green)":sr&&iS?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,background:sr&&iC?"var(--green)":sr&&iS&&!iC?"var(--red)":"transparent",color:sr&&(iC||iS)?"#fff":"var(--t3)"}}>
{sr&&iC?"✓":sr&&iS?"✗":String.fromCharCode(65+i)}</div><span>{opt}</span></button>);})}</div>
{ph==="fb"&&<AnswerCard ok={isOk} answer={String.fromCharCode(65+q.c)+". "+q.o[q.c]} label={feed?"Aldric":undefined}>
  {feed&&<p className={"mm-aldric "+feed.tone}><GIcon name={feed.icon} size={16} color="currentColor" style={{verticalAlign:"-3px",marginRight:6}}/>{feed.text}</p>}
  {feed&&feed.sheet&&<button className="mm-sheet-btn out" onClick={function(){setSheet(!sheet);}} aria-expanded={sheet}>{sheet?"Hide the sheet":"Open the "+q.cat+" sheet"}</button>}
  {feed&&feed.sheet&&sheet&&<div style={{margin:"10px 0"}}><GrammarSheet g={GRAMMAR_SHEETS.find(function(s){return s.id===sheetId;})}/></div>}
  {q.x&&<p className="ss-why">{q.x}</p>}
</AnswerCard>}</div>
{ph==="fb"&&<NextBar onNext={nxt} last={ci===qs.length-1}/>}</>);}
// ─── WORD FAMILIES CLASSIFIER ───
export function WordFam(p){
  var items=useMemo(function(){
    // Known English homographs that can serve as multiple POS
    // (beyond what the family structure captures)
    var HOMOGRAPHS={
      "permit":["Verb","Noun"],    // a permit / to permit
      "produce":["Verb","Noun"],   // fresh produce / to produce
      "record":["Verb","Noun"],    // a record / to record
      "project":["Verb","Noun"],   // a project / to project
      "conduct":["Verb","Noun"],   // conduct (behavior) / to conduct
      "estimate":["Verb","Noun"],  // an estimate / to estimate
      "increase":["Verb","Noun"],  // an increase / to increase
      "decrease":["Verb","Noun"],  // a decrease / to decrease
      "research":["Verb","Noun"],  // research (n) / to research
      "export":["Verb","Noun"],    // an export / to export
      "import":["Verb","Noun"],    // an import / to import
      "transfer":["Verb","Noun"],  // a transfer / to transfer
      "report":["Verb","Noun"],    // a report / to report
      "update":["Verb","Noun"],    // an update / to update
      "supply":["Verb","Noun"],    // a supply / to supply
      "demand":["Verb","Noun"],    // a demand / to demand
      "offer":["Verb","Noun"],     // an offer / to offer
      "plan":["Verb","Noun"],      // a plan / to plan
      "risk":["Verb","Noun"],      // a risk / to risk
      "process":["Verb","Noun"],   // a process / to process
      "review":["Verb","Noun"],    // a review / to review
      "result":["Verb","Noun"],    // a result / to result
      "profit":["Verb","Noun"],    // a profit / to profit
      "finance":["Verb","Noun"],   // finance (n) / to finance
      "work":["Verb","Noun"],      // work (n) / to work
      "display":["Verb","Noun"],   // a display / to display
    };

    var pool=[];
    var seen={};
    WORD_FAMILIES.forEach(function(f){
      var forms=[
        {word:f.v,pos:"Verb"},{word:f.n,pos:"Noun"},
        {word:f.adj,pos:"Adjective"},{word:f.adv,pos:"Adverb"}
      ];
      forms.forEach(function(fr){
        if(!fr.word)return;
        var key=fr.word.toLowerCase();
        if(seen[key])return;
        seen[key]=true;

        // Collect valid POS: from family structure + homograph map
        var valid=[fr.pos];
        forms.forEach(function(other){
          if(other.word&&other.word.toLowerCase()===key&&valid.indexOf(other.pos)===-1)valid.push(other.pos);
        });
        // Check homograph map
        var extra=HOMOGRAPHS[key];
        if(extra){extra.forEach(function(pos){if(valid.indexOf(pos)===-1)valid.push(pos);});}

        pool.push({word:fr.word,answer:fr.pos,validAnswers:valid,family:f});
      });
    });
    return shuffle(pool).slice(0,15);
  },[]);
  var cats=["Noun","Verb","Adjective","Adverb"];
  var catColors={Noun:"var(--cyan)",Verb:"var(--green)",Adjective:"var(--orange)",Adverb:"var(--purple)"};
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("q");var[pick,sPk]=useState(null);var[sk,sSk]=useState(false);

  var mistakesRef=useRef([]);var sidRef=useRef(0);
  var track=useSessionTrack(); // HUD de session (lot 2, 2026-09-19)
  function doAns(cat){
    sPk(cat);
    var itW=items[ci];
    track.record(itW.validAnswers.indexOf(cat)!==-1);
    if(itW.validAnswers.indexOf(cat)===-1){var fm=itW.family;mistakesRef.current.push({tag:"Word families",prompt:itW.word,noBlank:true,yours:cat,correct:itW.validAnswers.join(" / "),why:[fm.v&&"Verb: "+fm.v,fm.n&&"Noun: "+fm.n,fm.adj&&"Adjective: "+fm.adj,fm.adv&&"Adverb: "+fm.adv].filter(Boolean).join(" · "),ref:itW.validAnswers.length===1?moduleRef("wordfam",itW.word,itW.validAnswers[0]):null});}
    // Accept any valid POS for this word (handles homographs)
    if(items[ci].validAnswers.indexOf(cat)!==-1){sSc(sc+1);try{playCorrect();}catch(e){}}
    else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}
    sP("fb");
  }
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(null);sP("q");}else{sidRef.current=p.done(sc,items.length,15+sc*5,mistakesRef.current);sP("done");}}

  if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Word Families" mistakes={mistakesRef.current}
    onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}/>);

  var it=items[ci];var fam=it.family;var isMulti=it.validAnswers.length>1;
  // HUD de session (variante E) : barre et pied fixes rendus HORS du bloc .sk (le shake anime transform).
  return(<>
  <SessionTop n={items.length} cur={ci} results={track.results} streak={track.streak} onQuit={p.back}/>
  <ComboBanner combo={track.combo}/>
  <div className={sk?"sk":""} style={{padding:"4px 16px 0"}}>
    <div style={{textAlign:"center",marginTop:12,marginBottom:24}}>
      <div className="out" style={{fontSize:11,color:"var(--orange)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>CLASSIFY THIS WORD</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:8}}>
        <div className="out" style={{fontWeight:800,fontSize:36}}>{it.word}</div>
        <SpeakBtn text={it.word} size={36}/></div>
      <div style={{fontSize:13,color:"var(--t3)"}}>Is it a Noun, Verb, Adjective or Adverb?</div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      {cats.map(function(cat){
        var isValid=it.validAnswers.indexOf(cat)!==-1;var isPick=pick===cat;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isValid){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isValid){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={cat} onClick={function(){if(ph==="q")doAns(cat);}} disabled={show}
          style={{padding:"18px 12px",background:bg,border:"1px solid "+bd,borderRadius:14,cursor:ph==="q"?"pointer":"default",transition:"all .2s"}}>
          <div className="out" style={{fontWeight:700,fontSize:16,color:show&&isValid?"var(--green)":show&&isPick?"var(--red)":catColors[cat]}}>{cat}</div>
        </button>);})}
    </div>
    {ph==="fb"&&<AnswerCard ok={it.validAnswers.indexOf(pick)!==-1} answer={it.validAnswers.join(" / ")} label="Word family">
      {isMulti&&<p className="ss-why" style={{color:"var(--gold)",fontWeight:600,marginBottom:6}}>This word can be both: {it.validAnswers.join(" & ")}</p>}
      <p className="ss-why" style={{lineHeight:1.8}}>
        {fam.v&&<span>Verb: <strong style={{color:"var(--green)"}}>{fam.v}</strong> &nbsp;</span>}
        {fam.n&&<span>Noun: <strong style={{color:"var(--cyan)"}}>{fam.n}</strong> &nbsp;</span>}
        {fam.adj&&<span>Adj: <strong style={{color:"var(--orange)"}}>{fam.adj}</strong> &nbsp;</span>}
        {fam.adv&&<span>Adv: <strong style={{color:"var(--purple)"}}>{fam.adv}</strong></span>}
      </p>
    </AnswerCard>}
  </div>
  {ph==="fb"&&<NextBar onNext={nxt} last={ci===items.length-1}/>}
  </>);
}
// ─── CONNECTORS SORTING ───
export function ConnSort(p){
  var items=useMemo(function(){return shuffle(CONNECTORS).slice(0,12);},[]);
  var rules=CONNECTOR_RULES;
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(null);var[sk,sSk]=useState(false);
  var[openGrim,setOpenGrim]=useState(false);

  var mistakesRef=useRef([]);var sidRef=useRef(0);
  var track=useSessionTrack(); // HUD de session (lot 2, 2026-09-19)
  function doAns(rule){sPk(rule);track.record(rule===items[ci].rule);if(rule!==items[ci].rule){var lab=function(id){var r=rules.find(function(x){return x.id===id;});return r?r.label:id;};mistakesRef.current.push({tag:"Connectors",prompt:items[ci].word,noBlank:true,yours:lab(rule),correct:lab(items[ci].rule),why:items[ci].tip+(items[ci].ex?" — “"+items[ci].ex+"”":""),ref:moduleRef("connsort",items[ci].word)});}if(rule===items[ci].rule){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}sP("fb");}
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(null);sP("q");}else{sidRef.current=p.done(sc,items.length,15+sc*5,mistakesRef.current);sP("done");}}

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center",position:"relative"}}>
    <button className="back-btn" onClick={p.back} style={{position:"absolute",top:16,left:16,marginBottom:0}}>{"\u2190"} Back</button>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="knot" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Connectors Sorting</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6,maxWidth:360,marginLeft:"auto",marginRight:"auto"}}>For each connector, pick the structure that must follow it: clause, noun/-ing, or new sentence.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>12 items · 3 categories</p>
    <button className="btn1" onClick={function(){sP("q");}} style={{marginBottom:12}}>Start Sorting</button>
    <button className="btn2" onClick={function(){setOpenGrim(true);}} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><GIcon name="bookmarklet" size={18} color="currentColor"/>Grimoire</button>
    {openGrim&&<GrimoireReader grimoire={GRIMOIRE_CONNECTORS} back={function(){setOpenGrim(false);}}/>}
  </div>);

  if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Connectors Sorting" mistakes={mistakesRef.current}
    onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}/>);

  var it=items[ci];
  var ruleLab=function(id){var r=rules.find(function(x){return x.id===id;});return r?r.label:id;};
  return(<>
  <SessionTop n={items.length} cur={ci} results={track.results} streak={track.streak} onQuit={p.back}/>
  <ComboBanner combo={track.combo}/>
  <div className={sk?"sk":""} style={{padding:"4px 16px 0"}}>
    <div style={{textAlign:"center",marginTop:12,marginBottom:28}}>
      <div className="out" style={{fontSize:11,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>THIS CONNECTOR IS FOLLOWED BY...</div>
      <div className="out" style={{fontWeight:800,fontSize:30,marginBottom:4}}>{it.word}</div></div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {rules.map(function(r){
        var isCor=r.id===it.rule;var isPick=pick===r.id;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={r.id} onClick={function(){if(ph==="q")doAns(r.id);}} disabled={show}
          style={{display:"flex",alignItems:"center",gap:14,padding:"16px",background:bg,border:"1px solid "+bd,borderRadius:14,cursor:ph==="q"?"pointer":"default",textAlign:"left",transition:"all .2s"}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:r.col,flexShrink:0}}/>
          <div><div className="out" style={{fontWeight:700,fontSize:15,color:show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t1)"}}>{r.label}</div>
            <div style={{fontSize:11,color:"var(--t3)"}}>{r.desc}</div></div></button>);})}
    </div>
    {ph==="fb"&&<AnswerCard ok={pick===it.rule} answer={ruleLab(it.rule)}>
      <p className="ss-why">{it.tip}</p>
      {it.ex&&<p className="ss-why" style={{color:"var(--t2)",fontStyle:"italic",marginTop:8}}>{"“"+it.ex+"”"}</p>}
    </AnswerCard>}
  </div>
  {ph==="fb"&&<NextBar onNext={nxt} last={ci===items.length-1}/>}
  </>);
}
// ─── LINKING BRIDGE ───
// Contextual connector picker: blank-fill sentence, 4 options with FR translation
// shown in feedback. Tier B XP (15 + 5×correct + 35 perfect = 125 max).
// Same Grimoire as ConnSort (extended in 2026-05-11 with nuances + glossary).
export function LinkingBridge(p){
  // Per-item opts shuffle is mandatory — the data file authors all 40 items with
  // the correct answer at index 0 for readability. Without this, every correct
  // answer is in position A. Fix 2026-05-13 (Jérémy spotted it on first run).
  var items=useMemo(function(){return shuffle(LINKING_BRIDGE).slice(0,15).map(function(it){return Object.assign({},it,{opts:shuffle(it.opts.slice())});});},[]);
  var[ci,sC]=useState(0);
  var[sc,sSc]=useState(0);
  var[ph,sP]=useState("intro");
  var[pickIdx,sPk]=useState(-1);
  var[sk,sSk]=useState(false);
  var[openGrim,setOpenGrim]=useState(false);

  var mistakesRef=useRef([]);var sidRef=useRef(0);
  var track=useSessionTrack(); // HUD de session (lot 2, 2026-09-19)
  function doAns(idx){
    if(pickIdx!==-1)return;
    sPk(idx);
    var correctOpt=items[ci].opts[idx];
    track.record(!!correctOpt.correct);
    if(!correctOpt.correct){var goodOpt=items[ci].opts.find(function(o){return o.correct;});mistakesRef.current.push({tag:"Linking words",prompt:items[ci].prompt,yours:correctOpt.w,correct:goodOpt?goodOpt.w:"",why:items[ci].exp,ref:moduleRef("bforge",items[ci].id)});}
    if(correctOpt.correct){sSc(sc+1);try{playCorrect();}catch(e){}}
    else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}
    sP("fb");
  }
  function nxt(){
    if(ci<items.length-1){sC(ci+1);sPk(-1);sP("q");}
    else{
      // XP de BASE : miniDone applique les portes. Elle était déjà réduite ici, donc deux fois (2026-09-17).
      var xp=15+sc*5+(sc===items.length?35:0);
      sidRef.current=p.done(sc,items.length,xp,mistakesRef.current);
      sP("done");
    }
  }

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center",position:"relative"}}>
    <button className="back-btn" onClick={p.back} style={{position:"absolute",top:16,left:16,marginBottom:0}}>{"←"} Back</button>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="stone-bridge" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Linking Bridge</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6,maxWidth:360,marginLeft:"auto",marginRight:"auto"}}>Read each sentence and pick the connector that fits both the logic and the grammar.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>15 items · French translation shown in feedback</p>
    <button className="btn1" onClick={function(){sP("q");}} style={{marginBottom:12}}>Start Crossing</button>
    <button className="btn2" onClick={function(){setOpenGrim(true);}} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><GIcon name="bookmarklet" size={18} color="currentColor"/>Grimoire</button>
    {openGrim&&<GrimoireReader grimoire={GRIMOIRE_CONNECTORS} back={function(){setOpenGrim(false);}}/>}
  </div>);

  if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Linking Bridge" mistakes={mistakesRef.current}
    onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}/>);

  var it=items[ci];
  var showFb=ph==="fb";
  var correctIdx=it.opts.findIndex(function(o){return o.correct;});
  var picked=pickIdx!==-1?it.opts[pickIdx]:null;
  return(<>
  <SessionTop n={items.length} cur={ci} results={track.results} streak={track.streak} onQuit={p.back}/>
  <ComboBanner combo={track.combo}/>
  <div className={sk?"sk":""} style={{padding:"4px 16px 0"}}>
    <div style={{marginTop:12,marginBottom:24}}>
      <div className="out" style={{fontSize:11,color:"var(--cx-hex)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:12,textAlign:"center"}}>PICK THE CONNECTOR THAT FITS</div>
      <div className="crd" style={{padding:20,fontSize:16,lineHeight:1.6,textAlign:"center"}}>{it.prompt}</div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {it.opts.map(function(opt,oi){
        var isPicked=pickIdx===oi;
        var isCor=opt.correct;
        var bg="var(--bg2)";var bd="var(--bdr)";var col="var(--t1)";
        if(showFb&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";col="var(--green)";}
        else if(showFb&&isPicked&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";col="var(--red)";}
        return(<button key={oi} onClick={function(){doAns(oi);}} disabled={showFb}
          style={{padding:"14px 16px",background:bg,border:"1.5px solid "+bd,borderRadius:12,cursor:showFb?"default":"pointer",textAlign:"left",fontSize:14,color:col,lineHeight:1.4,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>{opt.w}</button>);
      })}
    </div>
    {showFb&&picked&&<AnswerCard ok={!!picked.correct} answer={correctIdx>=0?it.opts[correctIdx].w:undefined}>
      <p className="ss-why" style={{fontWeight:700,color:picked.correct?"var(--green)":"var(--red)",marginBottom:6}}>{picked.w}{" — "}{picked.fr}</p>
      {!picked.correct&&correctIdx>=0&&<p className="ss-why" style={{color:"var(--green)",marginBottom:8}}><strong>{it.opts[correctIdx].w}</strong>{" — "}{it.opts[correctIdx].fr}</p>}
      <p className="ss-why">{it.exp}</p>
    </AnswerCard>}
  </div>
  {showFb&&<NextBar onNext={nxt} last={ci===items.length-1}/>}
  </>);
}
// ─── PREPOSITION COLLOCATIONS ───
export function PrepDrill(p){
  var items=useMemo(function(){return shuffle(PREP_COLLOCATIONS).slice(0,12);},[]);
  var allPreps=useMemo(function(){var s={};PREP_COLLOCATIONS.forEach(function(c){s[c.prep]=true;});return Object.keys(s);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("menu");var[pick,sPk]=useState(null);var[sk,sSk]=useState(false);

  // Group collocations by preposition for Study Mode
  var groups=useMemo(function(){
    var g={};PREP_COLLOCATIONS.forEach(function(c){if(!g[c.prep])g[c.prep]=[];g[c.prep].push(c);});
    return Object.keys(g).sort().map(function(pr){return{prep:pr,items:g[pr]};});
  },[]);
  var prepLabels={for:"Responsibility, eligibility, purpose",in:"Involvement, interest, results",with:"Compliance, familiarity, association",on:"Dependence, reliance",of:"Composition, charge, capability",to:"Relation, addition, attribution"};

  var mistakesRef=useRef([]);var sidRef=useRef(0);
  var track=useSessionTrack(); // HUD de session (lot 2, 2026-09-19)
  function doAns(pr){sPk(pr);var it=items[ci];var ok=pr===it.prep||(it.alts&&it.alts.indexOf(pr)>=0);track.record(ok);if(!ok)mistakesRef.current.push({tag:"Prepositions",prompt:it.base+" _____",yours:pr,correct:it.prep+(it.alts&&it.alts.length?" / "+it.alts.join(" / "):""),why:it.ex,ref:moduleRef("prepdrill",it.base)});if(ok){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}sP("fb");}
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(null);sP("q");}else{sidRef.current=p.done(sc,items.length,15+sc*5,mistakesRef.current);sP("done");}}

  if(ph==="menu")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center",position:"relative"}}>
    <button className="back-btn" onClick={p.back} style={{position:"absolute",top:16,left:16,marginBottom:0}}>{"\u2190"} Back</button>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="linked-rings" size={54} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Preposition Collocations</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:32,lineHeight:1.5}}>Master the prepositions that go with common business words</p>
    <button className="btn1" onClick={function(){sP("q");}} style={{marginBottom:12}}>Start Drill (12 Qs)</button>
    <button className="btn2" onClick={function(){sP("study");}} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><GIcon name="bookmarklet" size={18} color="currentColor"/>Study Mode</button></div>);

  if(ph==="study")return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button className="back-btn" onClick={function(){sP("menu");}}>{"\u2190"} Back</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Study Mode</span>
      <div style={{width:40}}/></div>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:20,lineHeight:1.5}}>Collocations grouped by preposition. Tap a group to expand.</p>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {groups.map(function(g){
        return(<StudyGroup key={g.prep} prep={g.prep} items={g.items} hint={prepLabels[g.prep]||""}/>);
      })}
    </div>
    <button className="btn1" onClick={function(){sP("q");}} style={{marginTop:24}}>Ready! Start Drill</button></div>);

  if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Preposition Collocations" mistakes={mistakesRef.current}
    onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}/>);

  var it=items[ci];
  var prepOk=pick===it.prep||(it.alts&&it.alts.indexOf(pick)>=0);
  return(<>
  <SessionTop n={items.length} cur={ci} results={track.results} streak={track.streak} onQuit={p.back}/>
  <ComboBanner combo={track.combo}/>
  <div className={sk?"sk":""} style={{padding:"4px 16px 0"}}>
    <div style={{textAlign:"center",marginTop:12,marginBottom:28}}>
      <div className="out" style={{fontSize:11,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>COMPLETE THE COLLOCATION</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
        <div className="out" style={{fontWeight:800,fontSize:30}}>{it.base} <span style={{color:"var(--cyan)"}}>_____</span></div>
        <SpeakBtn text={it.base} size={32}/></div>
      <div style={{fontSize:12,color:"var(--t3)",marginTop:6}}>({it.type==="verb"?"verb":it.type==="adj"?"adjective":"expression"} + preposition)</div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat("+Math.min(allPreps.length,4)+", 1fr)",gap:8}}>
      {allPreps.map(function(pr){
        var isCor=pr===it.prep||(it.alts&&it.alts.indexOf(pr)>=0);var isPick=pick===pr;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";var col="var(--t1)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";col="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";col="var(--red)";}
        return(<button key={pr} onClick={function(){if(ph==="q")doAns(pr);}} disabled={show}
          style={{padding:"14px 8px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",transition:"all .2s"}}>
          <div className="out" style={{fontWeight:700,fontSize:16,color:col,textTransform:"uppercase"}}>{pr}</div></button>);})}
    </div>
    {ph==="fb"&&<AnswerCard ok={prepOk} answer={it.base+" "+it.prep} label="Example">
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
        <p className="ss-why"><strong>{it.base} {it.prep}</strong>{it.alts&&it.alts.length?<span style={{color:"var(--t2)",fontWeight:500}}>{" / "}<strong style={{color:"var(--t1)"}}>{it.base} {it.alts.join(" / ")}</strong>{" (both accepted)"}</span>:null}</p>
        <SpeakBtn text={it.base+" "+it.prep} size={26}/></div>
      <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
        <p className="ss-why" style={{color:"var(--t2)",fontStyle:"italic",flex:1}}>{"“"+it.ex+"”"}</p>
        <SpeakBtn text={it.ex} size={24} rate={0.85}/></div>
    </AnswerCard>}
  </div>
  {ph==="fb"&&<NextBar onNext={nxt} last={ci===items.length-1}/>}
  </>);
}
// Study Mode collapsible group sub-component
export function StudyGroup(p){
  var[open,sO]=useState(false);
  var prepColors={for:"#22c55e",in:"#f59e0b",with:"#8b5e83",on:"#ef4444",of:"#06b6d4",to:"#ec4899"};
  var col=prepColors[p.prep]||"var(--cyan)";
  return(<div className="crd" style={{padding:0,overflow:"hidden",borderColor:open?col+"44":"var(--bdr)",transition:"all .3s"}}>
    <button onClick={function(){sO(!open);}} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
      <div><div className="out" style={{fontWeight:800,fontSize:20,color:col,textTransform:"uppercase",letterSpacing:1}}>{p.prep}</div>
        <div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>{p.hint}</div></div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span className="out" style={{fontSize:12,color:"var(--t3)",fontWeight:600}}>{p.items.length}</span>
        <span style={{fontSize:14,color:"var(--t3)",transform:open?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>{"▼"}</span></div>
    </button>
    {open&&<div style={{padding:"0 18px 16px",animation:"fadeIn .2s"}}>
      {p.items.map(function(it,i){return(
        <div key={i} style={{display:"flex",alignItems:"baseline",gap:8,padding:"8px 0",borderTop:i>0?"1px solid var(--bdr)":"none"}}>
          <span className="out" style={{fontWeight:700,fontSize:14,color:"var(--t1)",minWidth:100}}>{it.base}</span>
          <span style={{fontSize:12,color:"var(--t3)",flex:1}}>{it.ex}</span>
        </div>);})}
    </div>}
  </div>);
}
// ─── GERUND VS INFINITIVE BATTLE ───
// Study Mode has been replaced by the Gerund Grimoire (see data/gerundGrimoire.js).
// Same pattern as the Gauntlet grimoires — same reader, same look.
export function GerInf(p){
  var[mode,setMode]=useState("hub"); // hub | quiz
  var mistakesRef=useRef([]);var sidRef=useRef(0);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("q");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);
  var[openGrim,setOpenGrim]=useState(false);

  // Quiz items — context sentences, shuffled, options permutées par item. Deck neuf à chaque entrée
  // dans le quiz : « Play again » (resetQuiz) rejouait le même ordre, donc les mêmes positions.
  function buildQuiz(){return shuffle(GERUND_INF).map(function(it){var s=shuffleOpts(it.opts,it.c);return Object.assign({},it,{opts:s.opts,c:s.c});});}
  var[quizItems,setQuizItems]=useState(buildQuiz);

  function resetQuiz(){setQuizItems(buildQuiz());sC(0);sSc(0);sPk(-1);sP("q");mistakesRef.current=[];}

  // ═══ HUB ═══
  if(mode==="hub")return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Gerund vs Infinitive</span>
      <div style={{width:40}}/>
    </div>
    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{marginBottom:8,display:"flex",justifyContent:"center"}}><GIcon name="scales" size={54} color="var(--cyan)"/></div>
      <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.6}}>{GERUND_INF.length} verbs · 4 patterns to master</p>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div className="crd" onClick={function(){setOpenGrim(true);}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"transparent",border:"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><GIcon name="bookmarklet" size={28} color="var(--cyan)"/></div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Grimoire</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Learn WHY before you guess</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span></div>
      <div className="crd" onClick={function(){resetQuiz();setMode("quiz");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"transparent",border:"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><GIcon name="quill-ink" size={28} color="var(--cyan)"/></div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Context Quiz</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>TOEIC-style sentences — no more guessing</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span></div>
    </div>
    {openGrim&&<GrimoireReader grimoire={GRIMOIRE_GERUND} back={function(){setOpenGrim(false);}}/>}
  </div>);

  // ═══ CONTEXT QUIZ ═══
  if(mode==="quiz"){
    var q=quizItems[ci];

    if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Gerund vs Infinitive" mistakes={mistakesRef.current}
      onContinue={function(){p.closeSession();setMode("hub");}} onReplay={function(){p.closeSession();resetQuiz();}}>
      <button className="btn2" onClick={function(){p.closeSession();setMode("hub");setOpenGrim(true);}} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><GIcon name="bookmarklet" size={18} color="currentColor"/>Open Grimoire</button>
    </SessionResult>);

    return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button className="back-btn" onClick={function(){setMode("hub");}}>{"\u2190"} Back</button>
        <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{quizItems.length}</span></div>
      <Bar value={ci} max={quizItems.length} h={4} color="linear-gradient(90deg,#e11d48,#f59e0b)"/>

      <div style={{marginTop:20,marginBottom:24}}>
        <span className="out" style={{fontSize:11,color:"var(--purple)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:12}}>Choose the correct form</span>
        <p className="out" style={{fontSize:17,fontWeight:700,lineHeight:1.6,color:"var(--t1)"}}>{q.ctx.split("_____")[0]}<span style={{color:"var(--cyan)",fontWeight:900}}>_____</span>{q.ctx.split("_____")[1]}</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {q.opts.map(function(opt,i){
          var show=ph==="fb";var isCor=i===q.c;var isPick=i===pick;
          var bg="var(--bg2)";var bd="var(--bdr)";var col="var(--t1)";
          if(show&&isCor){bg="rgba(0,230,118,.15)";bd="var(--green)";col="var(--green)";}
          else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.15)";bd="var(--red)";col="var(--red)";}
          return(<button key={i} onClick={function(){
            if(ph!=="q")return;sPk(i);
            if(i!==q.c)mistakesRef.current.push({tag:"Gerund vs infinitive · "+q.verb,prompt:q.ctx,yours:opt,correct:q.opts[q.c],why:q.tip+(q.ex?" — “"+q.ex+"”":""),ref:moduleRef("gerinf",q.verb)});
            if(i===q.c){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}
            sP("fb");
          }} disabled={show}
            style={{padding:"18px 14px",background:bg,border:"2px solid "+bd,borderRadius:14,cursor:ph==="q"?"pointer":"default",
              fontSize:16,fontWeight:700,color:col,fontFamily:"'DM Sans',sans-serif",transition:"all .15s",textAlign:"center"}}>
            {opt}
          </button>);
        })}
      </div>

      {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
        <div className="crd" style={{padding:14,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
            <span className="out" style={{fontWeight:700,fontSize:15,color:"var(--cyan)"}}>{q.verb}</span>
            <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,
              background:q.pattern==="ing"?"rgba(255,140,66,.1)":q.pattern==="to"?"rgba(var(--cx),.1)":q.pattern==="both"?"rgba(255,71,87,.1)":"rgba(27,112,207,.1)",
              color:q.pattern==="ing"?"var(--orange)":q.pattern==="to"?"var(--cyan)":q.pattern==="both"?"var(--red)":"var(--purple)"}}>{q.pattern==="ing"?"always -ING":q.pattern==="to"?"always TO":q.pattern==="both"?"depends on meaning":"preposition → -ING"}</span>
          </div>
          <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.6,marginBottom:4}}>{q.tip}</p>
          <p style={{fontSize:12,color:"var(--t3)",fontStyle:"italic"}}>"{q.ex}"</p>
        </div>
        <button className="btn1" onClick={function(){
          sPk(-1);
          if(ci<quizItems.length-1){sC(ci+1);sP("q");}
          else{sidRef.current=p.done(sc,quizItems.length,20+sc*4,mistakesRef.current);sP("done");}
        }} style={{marginTop:12}}>{ci<quizItems.length-1?"Next":"See Results"}</button>
      </div>}
    </div>);
  }

  return null;
}
// ─── TOEIC TRAPS QUIZ ───
export function TrapsQuiz(p){
  // Options permutées par item (bonne réponse en B 44 fois sur 60, jamais en D).
  var traps=useMemo(function(){return shuffle(TOEIC_TRAPS).slice(0,10).map(function(it){var s=shuffleOpts(it.options,it.correct);return Object.assign({},it,{options:s.opts,correct:s.c});});},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);

  var mistakesRef=useRef([]);var sidRef=useRef(0);
  var track=useSessionTrack(); // HUD de session (lot 2, 2026-09-19)
  function doAns(i){sPk(i);track.record(i===traps[ci].correct);if(i!==traps[ci].correct){var tr=traps[ci];mistakesRef.current.push({tag:"Trap #"+tr.id+" · "+tr.part,prompt:tr.scenario,noBlank:true,yours:tr.options[i],correct:tr.options[tr.correct],why:tr.tip,ref:moduleRef("traps",tr.id)});}if(i===traps[ci].correct){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}sP("fb");}
  function nxt(){if(ci<traps.length-1){sC(ci+1);sPk(-1);sP("q");}else{sidRef.current=p.done(sc,traps.length,25+sc*6,mistakesRef.current);sP("done");}}

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>🪤</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>TOEIC Traps Quiz</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>The 20 most common mistakes students make on the TOEIC.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Can you spot the traps before they catch you?</p>
    <button className="btn1" onClick={function(){sP("q");}}>Start Quiz</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="TOEIC Traps Quiz" mistakes={mistakesRef.current}
    onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}/>);

  var t=traps[ci];
  return(<>
  <SessionTop n={traps.length} cur={ci} results={track.results} streak={track.streak} onQuit={p.back}/>
  <ComboBanner combo={track.combo}/>
  <div className={sk?"sk":""} style={{padding:"4px 16px 0"}}>
    <div style={{marginTop:8,marginBottom:8}}>
      <span className="out" style={{fontSize:11,fontWeight:600,color:"var(--red)",textTransform:"uppercase",letterSpacing:1}}>Trap #{t.id} — {t.part}</span></div>
    <h2 className="out" style={{fontWeight:800,fontSize:20,marginBottom:12,color:"var(--orange)"}}>{t.name}</h2>
    <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:20}}>{t.trap}</p>

    <div className="crd" style={{padding:16,marginBottom:20,background:"rgba(255,140,66,.06)",borderColor:"rgba(255,140,66,.15)"}}>
      <p className="out" style={{fontSize:12,fontWeight:600,color:"var(--orange)",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Scenario</p>
      <p style={{fontSize:14,color:"var(--t1)",lineHeight:1.6,whiteSpace:"pre-line"}}>{t.scenario}</p></div>

    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {t.options.map(function(opt,i){
        var isCor=i===t.correct;var isPick=pick===i;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
          style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
          <div style={{width:24,height:24,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
            {show&&isCor?"✓":show&&isPick?"✗":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></button>);})}
    </div>

    {ph==="fb"&&<AnswerCard ok={pick===t.correct} answer={String.fromCharCode(65+t.correct)+". "+t.options[t.correct]} label="Pro Tip" why={t.tip}/>}
  </div>
  {ph==="fb"&&<NextBar onNext={nxt} last={ci===traps.length-1} label={ci<traps.length-1?"Next Trap":undefined}/>}
  </>);
}
// ─── GRAMMAR REFERENCE SHEETS ───
// GrammarSheet (le corps d'une fiche) vit dans components/GrammarSheet.jsx depuis le 2026-09-18 :
// la chasse aux erreurs l'ouvre aussi, au 3e échec d'une même question.
export function GrammarRef(p){
  var[open,sO]=useState(p.initial||null);
  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Grammar Reference</span>
      <div style={{width:40}}/>
    </div>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:20,lineHeight:1.5}}>Tap a topic to review the key rules, patterns, and TOEIC traps.</p>

    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {GRAMMAR_SHEETS.map(function(g,i){
        var isOpen=open===g.id;
        return(<div key={g.id} style={{animation:"fadeIn .3s ease-out",animationDelay:(i*.03)+"s",animationFillMode:"both"}}>
          <div className="crd" onClick={function(){sO(isOpen?null:g.id);}}
            style={{cursor:"pointer",padding:"14px 16px",borderColor:isOpen?g.color+"40":"var(--bdr)",background:isOpen?g.color+"08":"var(--bg2)",transition:"all .2s"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:38,height:38,borderRadius:10,background:g.color+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{g.icon}</div>
              <div style={{flex:1}}>
                <div className="out" style={{fontWeight:700,fontSize:14}}>{g.title}</div>
                <div style={{fontSize:11,color:"var(--t3)"}}>{g.patterns.length} patterns</div>
              </div>
              <span style={{fontSize:14,color:"var(--t3)",transition:"transform .2s",transform:isOpen?"rotate(90deg)":"rotate(0)"}}>{"›"}</span>
            </div>
          </div>

          {isOpen&&<div style={{padding:"12px 16px 16px",animation:"fadeIn .2s"}}><GrammarSheet g={g}/></div>}
        </div>);
      })}
    </div>
  </div>);
}
// ─── PHRASAL VERB DOJO (2 modes + Grimoire) ───
// Study Mode has been replaced by the Phrasal Grimoire (data/phrasalGrimoire.js).
export function PhrasalDojo(p){
  var[mode,setMode]=useState("hub");
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[pick,sPk]=useState(-1);var[ph,sP]=useState("q");
  var[timer,setTimer]=useState(0);var[streak,setStreak]=useState(0);var[bestStreak,setBest]=useState(0);
  var[openGrim,setOpenGrim]=useState(false);
  var timerRef=useRef(null);
  var mistakesRef=useRef([]);var sidRef=useRef(0);

  var matchQs=useMemo(function(){return shuffle(PHRASAL_VERBS.slice()).slice(0,15);},[]);
  var pickerQs=useMemo(function(){return shuffle(PHRASAL_VERBS.slice()).slice(0,15);},[]);

  var allParticles=useMemo(function(){
    var s={};PHRASAL_VERBS.forEach(function(pv){s[pv.p]=true;});return Object.keys(s);
  },[]);

  // Precompute all options for both quiz modes
  var matchAllOpts=useMemo(function(){
    return matchQs.map(function(mq){
      var pool=PHRASAL_VERBS.filter(function(pv){return pv.pv!==mq.pv;});
      var dists=shuffle(pool).slice(0,3).map(function(d){return d.m;});
      var opts=shuffle(dists.concat([mq.m]));
      return{opts:opts,c:opts.indexOf(mq.m)};
    });
  },[]);

  var pickerAllOpts=useMemo(function(){
    return pickerQs.map(function(pq){
      var pool=allParticles.filter(function(pt){return pt!==pq.p;});
      var dists=shuffle(pool).slice(0,3);
      var opts=shuffle(dists.concat([pq.p]));
      return{opts:opts,c:opts.indexOf(pq.p)};
    });
  },[]);

  // Particle Picker timer (runs in picker mode only)
  useEffect(function(){
    if(mode!=="picker"||ph!=="q")return;
    setTimer(8);
    timerRef.current=setInterval(function(){
      setTimer(function(t){
        if(t<=1){
          clearInterval(timerRef.current);
          setStreak(0);sPk(-1);sP("fb");
          return 0;
        }
        return t-1;
      });
    },1000);
    return function(){clearInterval(timerRef.current);};
  },[ci,mode,ph]);

  function resetQuiz(){sC(0);sSc(0);sPk(-1);sP("q");setTimer(0);setStreak(0);setBest(0);clearInterval(timerRef.current);mistakesRef.current=[];}

  // ═══ HUB ═══
  if(mode==="hub")return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Phrasal Verb Dojo</span>
      <div style={{width:40}}/>
    </div>
    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{marginBottom:8,display:"flex",justifyContent:"center"}}><GIcon name="shuriken" size={54} color="var(--cyan)"/></div>
      <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.6}}>{PHRASAL_VERBS.length} essential business phrasal verbs<br/>3 training modes</p>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div className="crd" onClick={function(){setOpenGrim(true);}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"transparent",border:"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><GIcon name="bookmarklet" size={28} color="var(--cyan)"/></div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Grimoire</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Particles, separables, top 20 business</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span></div>
      <div className="crd" onClick={function(){resetQuiz();setMode("match");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"transparent",border:"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><GIcon name="puzzle" size={28} color="var(--cyan)"/></div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Meaning Match</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Phrasal verb → pick the definition</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span></div>
      <div className="crd" onClick={function(){resetQuiz();setMode("picker");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"transparent",border:"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><GIcon name="lightning-bow" size={28} color="var(--cyan)"/></div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Particle Picker</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Speed round — 8s per question!</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span></div>
    </div>
    {openGrim&&<GrimoireReader grimoire={GRIMOIRE_PHRASAL} back={function(){setOpenGrim(false);}}/>}
  </div>);

  // ═══ MEANING MATCH ═══
  if(mode==="match"){
    var mq=matchQs[ci];var mOpts=matchAllOpts[ci];

    if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Phrasal Dojo · Meaning Match" mistakes={mistakesRef.current}
      onContinue={function(){p.closeSession();setMode("hub");}} onReplay={function(){p.closeSession();resetQuiz();}}/>);

    return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button className="back-btn" onClick={function(){setMode("hub");}}>{"\u2190"} Back</button>
        {streak>=2&&<span className="out" style={{fontSize:12,fontWeight:700,color:"var(--gold)",animation:"pulse .6s infinite"}}>{"🔥"} x{streak}</span>}
        <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{matchQs.length}</span></div>
      <Bar value={ci} max={matchQs.length} h={4} color="linear-gradient(90deg,#22c55e,#06b6d4)"/>
      <div style={{textAlign:"center",marginTop:24,marginBottom:24}}>
        <span className="out" style={{fontSize:11,color:"var(--purple)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8}}>What does this mean?</span>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <span className="out" style={{fontSize:28,fontWeight:900,color:"var(--cyan)"}}>{mq.pv}</span>
          <SpeakBtn text={mq.pv} size={32} audio={"/audio/phrasal/"+mq.pv.replace(/\s+/g,"_")+".mp3"}/>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {mOpts.opts.map(function(opt,i){
          var show=ph==="fb";var isCor=i===mOpts.c;var isPick=i===pick;
          var bg="var(--bg2)";var bd="var(--bdr)";
          if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
          else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
          return(<button key={i} onClick={function(){if(ph!=="q")return;sPk(i);if(i!==mOpts.c)mistakesRef.current.push({tag:"Phrasal verbs",prompt:mq.pv,noBlank:true,yours:opt,correct:mOpts.opts[mOpts.c],why:(mq.fr?mq.fr+" — ":"")+"“"+mq.ex+"”",ref:moduleRef("pvdojo",mq.pv,"match")});if(i===mOpts.c){sSc(sc+1);setStreak(streak+1);if(streak+1>bestStreak)setBest(streak+1);try{playCorrect();}catch(e){}}else{setStreak(0);try{playWrong();}catch(e){}}sP("fb");}} disabled={show}
            style={{padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",
              fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s",lineHeight:1.5}}>
            {opt}</button>);
        })}
      </div>
      {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
        <div className="crd" style={{padding:14,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
            <span className="out" style={{fontWeight:700,fontSize:14,color:"var(--cyan)"}}>{mq.pv}</span>
            <SpeakBtn text={mq.pv} size={22} audio={"/audio/phrasal/"+mq.pv.replace(/\s+/g,"_")+".mp3"}/>
            <span style={{fontSize:11,color:"var(--purple)",fontWeight:600,padding:"2px 8px",background:"rgba(27,112,207,.1)",borderRadius:99}}>{mq.fr}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <p style={{fontSize:12,color:"var(--t3)",fontStyle:"italic",lineHeight:1.5,flex:1}}>"{mq.ex}"</p>
            <SpeakBtn text={mq.ex} size={20} rate={0.85} audio={"/audio/phrasal/"+mq.pv.replace(/\s+/g,"_")+"_ex.mp3"}/>
          </div>
        </div>
        <button className="btn1" onClick={function(){sPk(-1);if(ci<matchQs.length-1){sC(ci+1);sP("q");}else{sidRef.current=p.done(sc,matchQs.length,20+sc*4,mistakesRef.current);sP("done");}}} style={{marginTop:12}}>{ci<matchQs.length-1?"Next":"See Results"}</button>
      </div>}
    </div>);
  }

  // ═══ PARTICLE PICKER ═══
  if(mode==="picker"){
    var pq=pickerQs[ci];var pOpts=pickerAllOpts[ci];

    if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Phrasal Dojo · Particle Picker" mistakes={mistakesRef.current}
      onContinue={function(){p.closeSession();setMode("hub");}} onReplay={function(){p.closeSession();resetQuiz();}}>
      {bestStreak>=3&&<div className="crd" style={{padding:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><GIcon name="flame" size={18} color="var(--orange)"/><span className="out" style={{fontWeight:700,color:"var(--gold)"}}>{"Best streak: "+bestStreak}</span></div>}
    </SessionResult>);

    var timerPct=timer/8*100;
    var timerCol=timer<=2?"var(--red)":timer<=4?"var(--orange)":"var(--cyan)";

    return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button className="back-btn" onClick={function(){clearInterval(timerRef.current);setMode("hub");}}>{"\u2190"} Back</button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {streak>=2&&<span className="out" style={{fontSize:12,fontWeight:700,color:"var(--gold)",animation:"pulse .6s infinite"}}>{"🔥"} x{streak}</span>}
          <span className="out" style={{fontSize:16,fontWeight:800,color:timerCol}}>{timer}s</span>
        </div>
        <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{pickerQs.length}</span></div>
      <div style={{height:4,background:"var(--bg3)",borderRadius:2,marginBottom:20,overflow:"hidden"}}>
        <div style={{height:"100%",width:timerPct+"%",background:timerCol,borderRadius:2,transition:"width 1s linear"}}/></div>
      <div style={{textAlign:"center",marginBottom:8}}>
        <span className="out" style={{fontSize:11,color:"var(--red)",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Pick the particle!</span>
      </div>
      <div style={{textAlign:"center",marginBottom:12}}>
        <span className="out" style={{fontSize:32,fontWeight:900,color:"var(--t1)"}}>{pq.v} </span>
        <span className="out" style={{fontSize:32,fontWeight:900,color:"var(--cyan)"}}>_____</span>
      </div>
      <div style={{textAlign:"center",marginBottom:24}}>
        <span style={{fontSize:13,color:"var(--t2)",fontStyle:"italic"}}>= {pq.m}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {pOpts.opts.map(function(opt,i){
          var show=ph==="fb";var isCor=i===pOpts.c;var isPick=i===pick;
          var bg="var(--bg2)";var bd="var(--bdr)";var col="var(--t1)";
          if(show&&isCor){bg="rgba(0,230,118,.15)";bd="var(--green)";col="var(--green)";}
          else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.15)";bd="var(--red)";col="var(--red)";}
          return(<button key={i} onClick={function(){if(ph!=="q")return;clearInterval(timerRef.current);sPk(i);if(i!==pOpts.c)mistakesRef.current.push({tag:"Phrasal verbs",prompt:pq.v+" _____ = "+pq.m,yours:opt,correct:pOpts.opts[pOpts.c],why:pq.pv+(pq.fr?" — "+pq.fr:"")+(pq.ex?" · “"+pq.ex+"”":""),ref:moduleRef("pvdojo",pq.pv,"picker")});if(i===pOpts.c){sSc(sc+1);setStreak(streak+1);if(streak+1>bestStreak)setBest(streak+1);try{playCorrect();}catch(e){}}else{setStreak(0);try{playWrong();}catch(e){}}sP("fb");}} disabled={show}
            style={{padding:"18px 12px",background:bg,border:"2px solid "+bd,borderRadius:14,cursor:ph==="q"?"pointer":"default",
              fontSize:20,fontWeight:800,color:col,fontFamily:"'DM Sans',sans-serif",transition:"all .15s",textAlign:"center"}}>
            {opt}</button>);
        })}
      </div>
      {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .2s"}}>
        {pick===-1&&<div style={{textAlign:"center",marginBottom:12}}>
          <span className="out" style={{fontSize:16,fontWeight:700,color:"var(--red)"}}>{"⏰"} Time's up!</span></div>}
        <div className="crd" style={{padding:14,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
            <span className="out" style={{fontWeight:700,fontSize:15,color:"var(--cyan)"}}>{pq.pv}</span>
            <SpeakBtn text={pq.pv} size={22} audio={"/audio/phrasal/"+pq.pv.replace(/\s+/g,"_")+".mp3"}/>
            <span style={{fontSize:11,color:"var(--purple)",fontWeight:600,padding:"2px 8px",background:"rgba(27,112,207,.1)",borderRadius:99}}>{pq.fr}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <p style={{fontSize:12,color:"var(--t3)",fontStyle:"italic",flex:1}}>"{pq.ex}"</p>
            <SpeakBtn text={pq.ex} size={20} rate={0.85} audio={"/audio/phrasal/"+pq.pv.replace(/\s+/g,"_")+"_ex.mp3"}/>
          </div>
        </div>
        <button className="btn1" onClick={function(){if(pick===-1)mistakesRef.current.push({tag:"Phrasal verbs",prompt:pq.v+" _____ = "+pq.m,yours:"(time's up)",correct:pOpts.opts[pOpts.c],why:pq.pv+(pq.fr?" — "+pq.fr:"")+(pq.ex?" · “"+pq.ex+"”":""),ref:moduleRef("pvdojo",pq.pv,"picker")});sPk(-1);if(ci<pickerQs.length-1){sC(ci+1);sP("q");}else{sidRef.current=p.done(sc,pickerQs.length,25+sc*5,mistakesRef.current);sP("done");}}} style={{marginTop:12}}>{ci<pickerQs.length-1?"Next":"See Results"}</button>
      </div>}
    </div>);
  }

  return null;
}
// ─── FALSE FRIENDS ───
export function FalseFriends(p){
  // Options permutées par item (bonne réponse en B ou C 47 fois sur 51).
  var items=useMemo(function(){return shuffle(FALSE_FRIENDS).slice(0,12).map(function(it){var s=shuffleOpts(it.opts,it.correct);return Object.assign({},it,{opts:s.opts,correct:s.c});});},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);

  var mistakesRef=useRef([]);var sidRef=useRef(0);
  var track=useSessionTrack(); // HUD de session (lot 2, 2026-09-19)
  function doAns(i){
    sPk(i);
    track.record(i===items[ci].correct);
    if(i!==items[ci].correct){var ff=items[ci];mistakesRef.current.push({tag:"False friend · "+ff.en,prompt:ff.ex,noBlank:true,yours:ff.opts[i],correct:ff.opts[ff.correct],why:ff.trap+(ff.realFr?" (FR: "+ff.realFr+")":""),ref:moduleRef("falsefr",ff.en)});}
    if(i===items[ci].correct){sSc(sc+1);try{playCorrect();}catch(e){}}
    else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}
    sP("fb");
  }
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(-1);sP("q");}else{sidRef.current=p.done(sc,items.length,20+sc*5,mistakesRef.current);sP("done");}}

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center",position:"relative"}}>
    <button className="back-btn" onClick={p.back} style={{position:"absolute",top:16,left:16,marginBottom:0}}>{"\u2190"} Back</button>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="duality-mask" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>False Friends</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>These English words LOOK like French words but mean something completely different!</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Can you avoid the francophone traps?</p>
    <button className="btn1" onClick={function(){sP("q");}}>Start</button></div>);

  if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="False Friends" mistakes={mistakesRef.current}
    onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}/>);

  var it=items[ci];

  return(<>
  <SessionTop n={items.length} cur={ci} results={track.results} streak={track.streak} onQuit={p.back}/>
  <ComboBanner combo={track.combo}/>
  <div className={sk?"sk":""} style={{padding:"4px 16px 0"}}>
    <div style={{marginTop:8,marginBottom:20}}>
      <div className="out" style={{fontSize:11,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>What does the underlined word mean here?</div>
      <div className="crd" style={{padding:16,background:"rgba(27,112,207,.05)",borderColor:"rgba(27,112,207,.12)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <SpeakBtn text={it.ex} size={28} rate={0.85}/>
          <p style={{fontSize:15,color:"var(--t1)",lineHeight:1.6}}>
            {it.ex.split(new RegExp("("+it.en+")","i")).map(function(part,i){
              if(part.toLowerCase()===it.en.toLowerCase()) return (<span key={i} style={{color:"var(--gold)",fontWeight:800,textDecoration:"underline",textDecorationColor:"var(--gold)",textUnderlineOffset:3}}>{part}</span>);
              return (<span key={i}>{part}</span>);
            })}
          </p>
        </div>
      </div>
    </div>

    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {it.opts.map(function(opt,i){
        var isCor=i===it.correct;var isPick=pick===i;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
          style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
          <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
            {show&&isCor?"✓":show&&isPick?"✗":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></button>);})}
    </div>

    {ph==="fb"&&<AnswerCard ok={pick===it.correct} answer={String.fromCharCode(65+it.correct)+". "+it.opts[it.correct]} label="False Friend Alert">
      <p className="ss-why" style={{marginBottom:8}}>{it.trap}</p>
      <p className="ss-why" style={{borderTop:"1px solid var(--bdr)",paddingTop:8,fontSize:13}}>
        <span style={{color:"var(--t2)"}}>FR translation: </span>
        <span className="out" style={{fontWeight:600,color:"var(--cyan)"}}>{it.realFr}</span></p>
    </AnswerCard>}
  </div>
  {ph==="fb"&&<NextBar onNext={nxt} last={ci===items.length-1}/>}
  </>);
}
