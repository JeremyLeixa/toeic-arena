// ─── MIMIC HUNT ─── (2026-09-17, proto prototypes/mimic-hunt/)
//
// Entraîne la compétence la plus rentable du TOEIC : la bonne réponse REFORMULE, le distracteur
// RECOPIE les mots du texte (le « Mimic », le coffre-monstre). Variante 3 « révélation » depuis le
// 2026-09-18 (choix de Jérémy, après la variante 2 « double marque » à deux marques + Check) : un tap
// répond, et les Mimics se démasquent d'office au retour.
//
// Au retour : un tap sur une option allume ses liens avec la source (vert = même sens, autres
// mots ; rouge ondulé = mots recopiés ; gris = mot gardé faute de synonyme courant).
import { Bar } from "../../components/Bar.jsx";
import { GIcon } from "../../components/icons.jsx";
import { SessionResult } from "../../components/SessionResult.jsx";
import { MIMIC_ITEMS, MIMIC_TIERS } from "../../data/mimicHunt.js";
import { shuffle } from "../../lib/util.js";
import { moduleRef } from "../../lib/reviewRefs.js";
import { playChestLand, playCorrect, playWrong } from "../../sounds.js";
import { useEffect, useRef, useState } from "react";

// Tout en jetons : suit le skin, la fête et le mode clair. Patron des CSS locaux
// (DTL_CSS de ModalCouncil, SBD_CSS de SentenceBuilder) : le global vit dans styles/appCss.js.
var MH_CSS=`
.mh-intro{position:relative;min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:56px 22px 110px}
.mh-intro-back{position:absolute;top:10px;left:16px;margin-bottom:0}
.mh-hero{display:flex;flex-direction:column;align-items:center;text-align:center;margin-bottom:22px;color:var(--cyan)}
.mh-hero h1{font-size:32px;font-weight:900;margin:12px 0 6px;color:var(--t1)}
.mh-hero p{margin:0;font-size:15px;color:var(--t2)}
.mh-def{padding:16px 18px!important;margin-bottom:12px}
.mh-def-t{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:800;color:var(--t1);margin-bottom:6px}
.mh-def p{margin:0;font-size:14px;line-height:1.6;color:var(--t2)}
.mh-def b{color:var(--t1)}
.mh-steps{padding:16px 18px!important;margin-bottom:22px;display:flex;flex-direction:column;gap:14px}
.mh-step{display:flex;gap:12px;align-items:flex-start}
.mh-step-n{width:28px;height:28px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;background:var(--cyan);color:var(--on-cx)}
.mh-step-t{font-size:14px;font-weight:700;color:var(--t1)}
.mh-step-d{font-size:13px;line-height:1.5;color:var(--t2);margin-top:2px}
.mh-tier{min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:32px 24px 110px;text-align:center}
.mh-roman{font-size:68px;font-weight:900;line-height:1;color:var(--cyan)}
.mh-tier-name{font-size:26px;font-weight:900;color:var(--t1);margin:8px 0 4px}
.mh-tier-lead{font-size:16px;color:var(--t2);margin:0 0 22px}
.mh-ex{display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px!important;margin-bottom:18px;font-size:17px;color:var(--t1)}
.mh-tip{font-size:14px;line-height:1.6;color:var(--t2);margin:0 0 26px}
.mh{padding:8px 16px 110px;min-height:100vh;display:flex;flex-direction:column}
.mh-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}
.mh-tally{display:flex;align-items:center;gap:12px;font-size:13px;font-weight:700;color:var(--t2)}
.mh-tally>span{display:inline-flex;align-items:center;gap:4px}
.mh-ok{color:var(--green)}
.mh-chip{margin:12px 0 8px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--cyan)}
.mh-src{padding:16px 16px 14px!important;margin-bottom:12px}
.mh-src-ctx{font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--t2);margin-bottom:6px}
.mh-src-text{margin:0;font-size:17px;line-height:1.7;color:var(--t1)}
.mh-spk{font-weight:700;color:var(--cyan);margin-right:6px}
.mh-legend{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin-top:10px;padding-top:10px;border-top:1px solid var(--bdr);font-size:12px;font-weight:600;color:var(--t2)}
.mh-leg{display:inline-flex;align-items:center;gap:6px}
.mh-dot{display:inline-block;width:12px;height:12px;border-radius:3px;flex-shrink:0}
.mh-q{font-size:15px;font-weight:700;color:var(--t1);margin:2px 2px 10px}
.mh-q-small{font-size:13px;font-weight:600;color:var(--t2);margin-top:-4px}
.mh-verdict{font-size:18px;font-weight:900;margin:2px 2px 6px}
.mh-verdict.ok{color:var(--green)}
.mh-verdict.bit{color:var(--red)}
.mh-verdict.no{color:var(--orange)}
.mh-mk{color:inherit;background-color:transparent;border-radius:4px;padding:0 2px;margin:0 -1px;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.mh-mk-bridge{background-color:color-mix(in srgb,var(--green) 22%,transparent);box-shadow:inset 0 -2px 0 var(--green)}
.mh-mk-echo{background-color:color-mix(in srgb,var(--t3) 20%,transparent);box-shadow:inset 0 -2px 0 var(--t3)}
.mh-mk-copy{background-color:color-mix(in srgb,var(--red) 16%,transparent);text-decoration:underline wavy var(--red);text-decoration-thickness:1.5px;text-underline-offset:4px;text-decoration-skip-ink:none}
.mh-dot.mh-mk-copy{box-shadow:inset 0 -2px 0 var(--red)}
.mh-opts{display:flex;flex-direction:column;gap:9px}
.mh-opt{position:relative;display:flex;align-items:center;gap:12px;width:100%;min-height:56px;text-align:left;padding:11px 12px;border-radius:14px;border:1.5px solid var(--bdr);background-color:var(--bg2);color:var(--t1);font:500 15px/1.4 'DM Sans',sans-serif;cursor:pointer;transition:border-color .15s,background-color .15s,opacity .2s,transform .12s;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.mh-opt:active{transform:scale(.985)}
.mh-let{width:28px;height:28px;border-radius:50%;border:2px solid var(--t3);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--t2)}
.mh-opt-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}
.mh-tags{display:flex;flex-wrap:wrap;gap:6px}
.mh-tag{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:800;letter-spacing:.7px;text-transform:uppercase}
.mh-tag.good{color:var(--green)}
.mh-tag.bad{color:var(--red)}
.mh-opt.is-correct{border-color:var(--green);background-color:color-mix(in srgb,var(--green) 10%,var(--bg2))}
.mh-opt.is-correct .mh-let{background:var(--green);border-color:var(--green);color:var(--bg2)}
.mh-opt.is-wrong{border-color:var(--red);background-color:color-mix(in srgb,var(--red) 9%,var(--bg2))}
.mh-opt.is-wrong .mh-let{background:var(--red);border-color:var(--red);color:var(--bg2)}
.mh-opt.is-mimic{border-style:dashed}
.mh-opt.is-mimic:not(.is-wrong){border-color:color-mix(in srgb,var(--red) 60%,transparent)}
.mh-opt.is-dim{opacity:.6}
.mh-opt.is-focus{box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--cyan);opacity:1}
.mh-face{display:flex;flex-shrink:0;color:var(--red);animation:mhPop .5s cubic-bezier(.3,1.7,.5,1) both}
.mh-face.chomp{animation:mhPop .45s cubic-bezier(.3,1.7,.5,1) both,mhChomp .42s .45s ease-in-out 2}
.mh-bite{animation:mhBite .5s .1s ease both}
.mh-hint{margin:10px 2px 0;font-size:12px;color:var(--t2);text-align:center}
.mh-why{margin-top:14px;padding:16px!important}
.mh-why h4{margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--cyan)}
.mh-pairs{display:flex;flex-direction:column;gap:8px;margin-bottom:12px}
.mh-pair{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:14px;color:var(--t1)}
.mh-arrow{color:var(--t2);font-weight:700}
.mh-note{font-size:12px;color:var(--t2)}
.mh-exp{margin:0;font-size:14px;line-height:1.6;color:var(--t2)}
.mh-trap{display:flex;gap:10px;align-items:flex-start;margin-top:12px;padding-top:12px;border-top:1px solid var(--bdr);font-size:13.5px;line-height:1.55;color:var(--t2)}
.mh-cta{margin-top:18px}
.mh-cta .btn1{width:100%}
.mh-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:16px!important;text-align:center}
.mh-stat{font-size:26px;font-weight:900}
.mh-stat-l{font-size:11px;color:var(--t2);margin-top:2px}
@keyframes mhPop{0%{transform:scale(.2) rotate(-25deg);opacity:0}100%{transform:none;opacity:1}}
@keyframes mhChomp{0%,100%{transform:scale(1)}45%{transform:scale(1.3) rotate(-10deg)}}
@keyframes mhBite{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(2px)}}
`;

function sound(fn){try{fn();}catch(e){console.warn("[mimic] sound:",e&&e.message);}}
function isMimic(item,i){return !!(item.mimics&&item.mimics[i]);}
function letterOf(i){return String.fromCharCode(65+i);}

// Liens d'une option avec la source : pont + mot gardé (bonne réponse), mots recopiés (Mimic).
function linksOf(item,i){
  if(i===item.c)return item.bridge.map(function(b){return{src:b[0],opt:b[1],kind:"bridge"};})
    .concat((item.echo||[]).map(function(w){return{src:w,opt:w,kind:"echo"};}));
  return ((item.mimics&&item.mimics[i])||[]).map(function(f){
    return typeof f==="string"?{src:f,opt:f,kind:"copy"}:{src:f[0],opt:f[1],kind:"copy"};
  });
}
function isWordChar(ch){return /[A-Za-z0-9]/.test(ch||"");}
// Occurrences d'un fragment, sans casse, en mots entiers (« sign » ne s'allume pas dans « design »).
function ranges(text,frag){
  var t=text.toLowerCase(),f=frag.toLowerCase(),out=[],i=t.indexOf(f);
  while(i!==-1){
    if(!isWordChar(text[i-1])&&!isWordChar(text[i+f.length]))out.push([i,i+f.length]);
    i=t.indexOf(f,i+1);
  }
  return out;
}
// Options permutées à chaque partie (l'élève ne rejoue pas « la réponse C »), items mélangés
// DANS leur palier : la progression I → II → III est la pédagogie, elle ne bouge pas. Au plus
// PER_TIER items par palier (15 par partie) : la banque grandit sans que les parties s'allongent.
function prep(it){
  var order=shuffle([0,1,2,3]),mimics={};
  order.forEach(function(from,pos){if(it.mimics&&it.mimics[from])mimics[pos]=it.mimics[from];});
  return Object.assign({},it,{opts:order.map(function(from){return it.opts[from];}),c:order.indexOf(it.c),mimics:mimics});
}
var PER_TIER=5;
function buildRound(bank){
  var out=[];
  [1,2,3].forEach(function(t){
    shuffle(bank.filter(function(it){return it.tier===t;})).slice(0,PER_TIER).forEach(function(it){out.push(prep(it));});
  });
  return out;
}

// Texte avec surlignages. Chevauchement : le fragment le plus long garde la place.
function Marked(p){
  var text=p.text,cand=[],kept=[];
  (p.marks||[]).forEach(function(m){
    ranges(text,m.frag).forEach(function(r){cand.push({a:r[0],b:r[1],kind:m.kind});});
  });
  cand.sort(function(x,y){return (y.b-y.a)-(x.b-x.a);});
  cand.forEach(function(c){if(!kept.some(function(o){return c.a<o.b&&o.a<c.b;}))kept.push(c);});
  kept.sort(function(x,y){return x.a-y.a;});
  var out=[],at=0;
  kept.forEach(function(c,k){
    if(c.a>at)out.push(text.slice(at,c.a));
    out.push(<mark key={k} className={"mh-mk mh-mk-"+c.kind}>{text.slice(c.a,c.b)}</mark>);
    at=c.b;
  });
  if(at<text.length)out.push(text.slice(at));
  return <>{out}</>;
}

function MimicIcon(p){
  return <GIcon name="mimic-chest" size={p.size||24} color={p.color} block/>;
}

// `bank` : les items à jouer (MIMIC_ITEMS ; le banc de relecture passe un lot en projet).
export function MimicHunt(p){
  var[items]=useState(function(){return buildRound(p.bank||MIMIC_ITEMS);});
  var TOTAL=items.length;
  var[phase,sP]=useState("intro");           // intro | tier | q | fb | done
  var[idx,sI]=useState(0);
  var[pick,sPk]=useState(-1);                // réponse choisie
  var[focus,sF]=useState(-1);                // option dont on montre les liens au retour
  var[results,sR]=useState([]);
  var mistakesRef=useRef([]);var sidRef=useRef(0);
  var item=items[idx],tier=MIMIC_TIERS[item.tier];

  useEffect(function(){
    var app=document.querySelector(".app");
    if(app)app.scrollTop=0;
  },[idx,phase]);

  function openingOf(i){return i===0||items[i].tier!==items[i-1].tier?"tier":"q";}

  // Un tap répond (variante 3 « révélation », choix de Jérémy du 2026-09-18) : les Mimics se
  // démasquent d'office au retour, l'élève n'a pas à les chercher.
  function answer(i){
    var ok=i===item.c,bitten=!ok&&isMimic(item,i);
    sound(ok?playCorrect:playWrong);
    if(bitten)sound(function(){playChestLand(1);});
    if(!ok)mistakesRef.current.push({tag:"Mimic Hunt · Tier "+tier.roman+(bitten?" · Mimic":""),prompt:item.src,noBlank:true,
      yours:item.opts[i],correct:item.opts[item.c],why:item.exp,ref:moduleRef("mimic",item.id)});
    sR(function(r){return r.concat([{ok:ok,bitten:bitten}]);});
    sPk(i);sF(bitten?i:item.c);sP("fb");
  }

  // Fin de partie : XP versée ici, jamais derrière un bouton (quitter l'écran de fin la perdait).
  // 15 + 5 par bonne réponse, +25 sans faute : 115 pour 15 items, le palier des modules à 15 questions.
  function next(){
    if(idx+1<TOTAL){sPk(-1);sF(-1);sI(idx+1);sP(openingOf(idx+1));return;}
    var sc=results.filter(function(r){return r.ok;}).length;
    sidRef.current=p.done(sc,TOTAL,15+5*sc+(sc===TOTAL?25:0),mistakesRef.current);
    sP("done");
  }

  function tapOption(i){
    if(phase==="q"){answer(i);return;}
    if(phase==="fb")sF(i);
  }

  // ── DONE ──
  if(phase==="done"){
    var nOk=results.filter(function(r){return r.ok;}).length;
    var nBit=results.filter(function(r){return r.bitten;}).length;
    return(<><style>{MH_CSS}</style>
      <SessionResult session={p.session} sid={sidRef.current} name="Mimic Hunt" mistakes={mistakesRef.current}
        onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}>
        <div className="crd mh-stats">
          <div><div className="out mh-stat" style={{color:"var(--green)"}}>{nOk}</div><div className="mh-stat-l">Right answers</div></div>
          <div><div className="out mh-stat" style={{color:"var(--red)"}}>{nBit}</div><div className="mh-stat-l">Mimic bites</div></div>
        </div>
      </SessionResult></>);
  }

  // ── INTRO ──
  if(phase==="intro")return(<><style>{MH_CSS}</style>
    <div className="enter mh-intro">
      <button className="back-btn mh-intro-back" onClick={p.back}>{"← Back"}</button>
      <div className="mh-hero">
        <MimicIcon size={84} color="var(--cyan)"/>
        <h1 className="out">Mimic Hunt</h1>
        <p>Same meaning, different words.</p>
      </div>
      <div className="crd mh-def">
        <div className="mh-def-t out"><MimicIcon size={22} color="var(--red)"/>{"What's a Mimic?"}</div>
        <p>An answer that <b>copies words from the text</b> but says something the text doesn{"'"}t. It{"'"}s the TOEIC{"'"}s favourite trap.</p>
      </div>
      <div className="crd mh-steps">
        {[{t:"Read the text",d:"An email, a notice, a line from a conversation."},
          {t:"Pick the answer that means the same",d:"Same idea, not the same words."},
          {t:"See what the Mimics copied",d:"Every trap is unmasked after your answer."}].map(function(s,k){return(
          <div key={k} className="mh-step">
            <span className="mh-step-n out">{k+1}</span>
            <div><div className="mh-step-t out">{s.t}</div><div className="mh-step-d">{s.d}</div></div>
          </div>);})}
      </div>
      <button className="btn1 out" onClick={function(){sP(openingOf(0));}}>{"Start — "+TOTAL+" questions"}</button>
    </div></>);

  // ── PALIER ──
  if(phase==="tier")return(<><style>{MH_CSS}</style>
    <div className="enter mh-tier">
      <div className="mh-roman out">{tier.roman}</div>
      <div className="mh-tier-name out">{tier.name}</div>
      <p className="mh-tier-lead">{tier.lead}</p>
      <div className="crd mh-ex">
        <mark className="mh-mk mh-mk-bridge">{tier.ex[0]}</mark>
        <span className="mh-arrow">{"↓"}</span>
        <mark className="mh-mk mh-mk-bridge">{tier.ex[1]}</mark>
      </div>
      <p className="mh-tip">{tier.tip}</p>
      <button className="btn1 out" onClick={function(){sP("q");}}>{"Enter Tier "+tier.roman}</button>
    </div></>);

  var reveal=phase==="fb";
  var last=reveal?results[results.length-1]:null;
  var okCount=results.filter(function(r){return r.ok;}).length;
  var focusKind=!reveal||focus<0?null:focus===item.c?"bridge":isMimic(item,focus)?"copy":"none";
  var focusMarks=reveal&&focus>=0?linksOf(item,focus).map(function(l){return{frag:l.src,kind:l.kind};}):[];
  var verdict=last?(last.ok?{cls:"ok",t:"Correct!"}:last.bitten?{cls:"bit",t:"The Mimic bit you!"}:{cls:"no",t:"Not quite."}):null;
  var legend=null;
  if(focusKind==="bridge")legend=(<div className="mh-legend">
    <span className="mh-leg"><i className="mh-dot mh-mk-bridge"/>{"Answer "+letterOf(focus)+": same meaning, new words"}</span>
    {item.echo&&<span className="mh-leg"><i className="mh-dot mh-mk-echo"/>{"same word, allowed"}</span>}
  </div>);
  if(focusKind==="copy")legend=<div className="mh-legend"><span className="mh-leg"><i className="mh-dot mh-mk-copy"/>{"Answer "+letterOf(focus)+": copied words, different meaning"}</span></div>;
  if(focusKind==="none")legend=<div className="mh-legend"><span className="mh-leg">{"Answer "+letterOf(focus)+": nothing in the text says this"}</span></div>;

  return(<>
    <style>{MH_CSS}</style>
    <div className="mh">
      <div className="mh-top">
        <button className="back-btn" onClick={p.back}>{"← Back"}</button>
        <div className="mh-tally">
          <span title="Correct answers"><b className="mh-ok">{"✓"}</b>{okCount}</span>
          <span>{(idx+1)+" / "+TOTAL}</span>
        </div>
      </div>
      <Bar value={reveal?idx+1:idx} max={TOTAL} h={4}/>
      <div className="mh-chip out">{"Tier "+tier.roman+" · "+tier.name}</div>

      <div className={"crd mh-src"+(reveal&&last&&last.bitten?" sk":"")}>
        <div className="mh-src-ctx">{item.ctx}</div>
        <p className="mh-src-text">
          {item.speaker&&<span className="mh-spk">{item.speaker+":"}</span>}
          <Marked text={item.src} marks={focusMarks}/>
        </p>
        {legend}
      </div>

      {verdict?<div className={"mh-verdict out "+verdict.cls}>{verdict.t}</div>:<div className="mh-q">{item.q}</div>}
      {reveal&&<div className="mh-q mh-q-small">{item.q}</div>}

      <div className="mh-opts">
        {item.opts.map(function(o,i){
          var mim=isMimic(item,i),cls="mh-opt",tags=[],letter=letterOf(i);
          if(reveal){
            if(i===item.c){cls+=" is-correct";letter="✓";tags.push(<span key="c" className="mh-tag good">Same meaning</span>);}
            else if(i===pick){cls+=" is-wrong";letter="✗";}
            if(mim){cls+=" is-mimic";
              tags.push(<span key="m" className="mh-tag bad"><MimicIcon size={13}/>{"Mimic"+(i===pick?" · it bit you":"")}</span>);}
            if(!mim&&i!==item.c&&i!==pick)cls+=" is-dim";
            if(i===focus)cls+=" is-focus";
            if(mim&&i===pick)cls+=" mh-bite";
          }
          return(
            <button key={item.id+i} className={cls} onClick={function(){tapOption(i);}} aria-pressed={reveal?i===focus:undefined}>
              <span className="mh-let out">{letter}</span>
              <span className="mh-opt-body">
                <span>{reveal?<Marked text={o} marks={linksOf(item,i).map(function(l){return{frag:l.opt,kind:l.kind};})}/>:o}</span>
                {tags.length>0&&<span className="mh-tags">{tags}</span>}
              </span>
              {reveal&&mim&&<span className={"mh-face"+(i===pick?" chomp":"")}><MimicIcon size={30}/></span>}
            </button>);
        })}
      </div>
      {reveal&&<p className="mh-hint">Tap an answer to see how it links to the text.</p>}

      {reveal&&(<div className="crd mh-why enter">
        <h4 className="out">The paraphrase</h4>
        <div className="mh-pairs">
          {item.bridge.map(function(b,k){return(
            <div key={k} className="mh-pair"><mark className="mh-mk mh-mk-bridge">{b[0]}</mark><span className="mh-arrow">{"→"}</span><mark className="mh-mk mh-mk-bridge">{b[1]}</mark></div>);})}
          {(item.echo||[]).map(function(w){return(
            <div key={"e"+w} className="mh-pair"><mark className="mh-mk mh-mk-echo">{w}</mark><span className="mh-arrow">=</span><mark className="mh-mk mh-mk-echo">{w}</mark><span className="mh-note">no everyday synonym</span></div>);})}
        </div>
        <p className="mh-exp">{item.exp}</p>
        <div className="mh-trap"><MimicIcon size={22} color="var(--red)"/><span>{item.trap}</span></div>
      </div>)}

      {reveal&&<div className="mh-cta">
        <button className="btn1 out" onClick={next}>{idx+1<TOTAL?"Next →":"See results"}</button>
      </div>}
    </div></>);
}
