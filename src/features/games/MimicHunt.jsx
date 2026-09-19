// ─── MIMIC HUNT ─── (2026-09-17, proto prototypes/mimic-hunt/)
//
// Entraîne la compétence la plus rentable du TOEIC : la bonne réponse REFORMULE, le distracteur
// RECOPIE les mots du texte (le « Mimic », le coffre-monstre). Variante 3 « révélation » depuis le
// 2026-09-18 (choix de Jérémy, après la variante 2 « double marque » à deux marques + Check) : un tap
// répond, et les Mimics se démasquent d'office au retour.
//
// Retour sobre (variante C « au tap », choix de Jérémy du 2026-09-19, proto prototypes/mimic-hunt/calm.html) :
// l'ancien écran disait tout trois fois — dans la source, dans CHAQUE option, puis dans la carte — avec
// fonds colorés, ondulations, bordures pointillées et une icône par Mimic. Désormais rien n'est souligné
// au retour (juste, faux, « Mimic ») ; un tap sur une option souligne ses liens, dans la source et dans
// cette option seulement (vert plein = même sens, pointillé rouge = mots recopiés, tirets gris = mot
// gardé) ; la carte garde l'explication et le piège, les reformulations sont repliées.
//
// Mode écoute (variante A « aperçu », choix de Jérémy du 2026-09-19, proto prototypes/mimic-hunt/listen.html) :
// la source d'un item `spoken` s'ENTEND au lieu de se lire — en Parts 3 et 4, le distracteur classique reprend
// un mot de l'enregistrement. Question et réponses lisibles avant l'écoute (consigne des Parts 3 et 4), mais
// verrouillées jusqu'à la fin de l'enregistrement : répondre au premier mot reconnu, c'est mordre. Une
// réécoute. Au retour, la transcription apparaît avec le même retour qu'en lecture. Module `mimic_listen`
// (compté en Listening) ; deux portes sur l'intro.
import { Bar } from "../../components/Bar.jsx";
import { GIcon } from "../../components/icons.jsx";
import { SessionResult } from "../../components/SessionResult.jsx";
import { ListenDisc } from "../../components/SessionHud.jsx";
import { MIMIC_ITEMS, MIMIC_TIERS } from "../../data/mimicHunt.js";
import { shuffle } from "../../lib/util.js";
import { moduleRef } from "../../lib/reviewRefs.js";
import { mimicXp, MIMIC_XP } from "../../lib/mimicXp.js";
import { mimicClipUrl } from "../../lib/listeningVoices.js";
import { playAudioFile, resumeAudioSession, stopCurrentListenAudio, stopListenAudio } from "../../lib/audio.js";
import { playBGM, stopBGM, playChestLand, playCorrect, playWrong } from "../../sounds.js";
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
.mh-key{margin-top:10px;padding-top:10px;border-top:1px solid var(--bdr);font-size:12px;line-height:1.5;color:var(--t2)}
.mh-key .g{color:var(--green);font-weight:700}
.mh-key .r{color:var(--red);font-weight:700}
.mh-q{font-size:15px;font-weight:700;color:var(--t1);margin:2px 2px 10px}
.mh-q-small{font-size:13px;font-weight:600;color:var(--t2);margin-top:-4px}
.mh-verdict{font-size:18px;font-weight:900;margin:2px 2px 6px}
.mh-verdict.ok{color:var(--green)}
.mh-verdict.bit{color:var(--red)}
.mh-verdict.no{color:var(--orange)}
.mh-mk{color:inherit;background-color:transparent;text-decoration-line:underline;text-decoration-thickness:2px;text-underline-offset:4px;text-decoration-skip-ink:none}
.mh-mk-bridge{text-decoration-style:solid;text-decoration-color:var(--green)}
.mh-mk-copy{text-decoration-style:dotted;text-decoration-color:var(--red)}
.mh-mk-echo{text-decoration-style:dashed;text-decoration-color:var(--t3)}
.mh-opts{display:flex;flex-direction:column;gap:9px}
.mh-opt{position:relative;display:flex;align-items:center;gap:12px;width:100%;min-height:56px;text-align:left;padding:11px 12px;border-radius:14px;border:1.5px solid var(--bdr);background-color:var(--bg2);color:var(--t1);font:500 15px/1.4 'DM Sans',sans-serif;cursor:pointer;transition:border-color .15s,background-color .15s,opacity .2s,transform .12s;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.mh-opt:active{transform:scale(.985)}
.mh-let{width:28px;height:28px;border-radius:50%;border:2px solid var(--t3);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--t2)}
.mh-opt-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}
.mh-tags{display:flex;flex-wrap:wrap;gap:6px}
.mh-tag{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:800;letter-spacing:.7px;text-transform:uppercase}
.mh-tag.bad{color:var(--red)}
.mh-opt.is-correct{border-color:var(--green);background-color:color-mix(in srgb,var(--green) 10%,var(--bg2))}
.mh-opt.is-correct .mh-let{background:var(--green);border-color:var(--green);color:var(--bg2)}
.mh-opt.is-wrong{border-color:var(--red);background-color:color-mix(in srgb,var(--red) 9%,var(--bg2))}
.mh-opt.is-wrong .mh-let{background:var(--red);border-color:var(--red);color:var(--bg2)}
.mh-opt.is-focus{box-shadow:0 0 0 1.5px var(--cyan)}
.mh-face{display:flex;flex-shrink:0;color:var(--red);animation:mhPop .5s cubic-bezier(.3,1.7,.5,1) both}
.mh-face.chomp{animation:mhPop .45s cubic-bezier(.3,1.7,.5,1) both,mhChomp .42s .45s ease-in-out 2}
.mh-hint{margin:10px 2px 0;font-size:12px;color:var(--t2);text-align:center}
.mh-why{margin-top:14px;padding:16px!important}
.mh-why h4{margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--cyan)}
.mh-pairs{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}
.mh-pair{font-size:14px;color:var(--t1)}
.mh-pair .was{color:var(--t2)}
.mh-arrow{color:var(--green);font-weight:800;margin:0 6px}
.mh-toggle{display:block;background:none;border:none;padding:0;margin:0 0 10px;color:var(--cyan);font:700 13px 'DM Sans',sans-serif;cursor:pointer;min-height:32px}
.mh-note{font-size:12px;color:var(--t2)}
.mh-exp{margin:0;font-size:14px;line-height:1.6;color:var(--t2)}
.mh-trap{display:flex;gap:10px;align-items:flex-start;margin-top:12px;padding-top:12px;border-top:1px solid var(--bdr);font-size:13.5px;line-height:1.55;color:var(--t2)}
.mh-doors{display:flex;flex-direction:column;gap:10px}
.mh-door{display:flex;gap:12px;align-items:center;width:100%;padding:14px!important;margin:0;text-align:left;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--t1);border:1px solid var(--bdr)}
.mh-door-i{width:44px;height:44px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--cyan);background:linear-gradient(135deg,rgba(var(--cx),.22),transparent);color:var(--cyan)}
.mh-door-t{display:block;font-size:16px;font-weight:800;color:var(--t1)}
.mh-door-d{display:block;font-size:13px;line-height:1.45;color:var(--t2);margin-top:2px}
.mh-door-s{display:inline-block;margin-top:5px;font-size:10.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--cyan)}
.mh-src-ls{padding:14px 16px 16px!important}
.mh-src-ls .ss-play{width:104px;height:104px}
.mh-src-ls .ss-playlbl{font-size:13px}
.mh-opt.is-locked{opacity:.5;cursor:default}
.mh-opt.is-locked:active{transform:none}
.mh-again{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:6px 12px;min-height:32px;border-radius:999px;border:1px solid var(--bdr);background:none;color:var(--cyan);font:700 12px 'DM Sans',sans-serif;cursor:pointer}
.mh-again[disabled]{opacity:.6;cursor:default}
.mh-cta{margin-top:18px}
.mh-cta .btn1{width:100%}
.mh-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:16px!important;text-align:center}
.mh-stat{font-size:26px;font-weight:900}
.mh-stat-l{font-size:11px;color:var(--t2);margin-top:2px}
@keyframes mhPop{0%{transform:scale(.2) rotate(-25deg);opacity:0}100%{transform:none;opacity:1}}
@keyframes mhChomp{0%,100%{transform:scale(1)}45%{transform:scale(1.3) rotate(-10deg)}}
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
// Banque d'un mode : l'écoute ne tire que les sources parlées (`spoken`).
function bankOf(bank,mode){return mode==="listen"?bank.filter(function(it){return it.spoken;}):bank;}
function roundSize(bank){return [1,2,3].reduce(function(n,t){return n+Math.min(PER_TIER,bank.filter(function(it){return it.tier===t;}).length);},0);}
// « Play again » remonte le module (clé de pg()) : il repart dans le mode de la partie finie, sans repasser par
// les portes. Lu à l'initialisation, effacé après le montage (le remontage simulé de StrictMode garde l'état).
var replayMode=null;
var REPLAYS=1; // réécoutes permises avant de répondre : le TOEIC n'en donne aucune, l'entraînement une

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
  var bank=p.bank||MIMIC_ITEMS;
  var[mode,sMode]=useState(replayMode);      // null (portes) | "read" | "listen"
  var[items,sItems]=useState(function(){return replayMode?buildRound(bankOf(bank,replayMode)):null;});
  var TOTAL=items?items.length:0;
  var[phase,sP]=useState(replayMode?"tier":"intro"); // intro | tier | q | fb | done
  var[idx,sI]=useState(0);
  var[pick,sPk]=useState(-1);                // réponse choisie
  var[focus,sF]=useState(-1);                // option dont on montre les liens (au tap, aucune au retour)
  var[pairsOpen,sPO]=useState(false);        // reformulations dépliées dans la carte
  var[results,sR]=useState([]);
  var[playing,sPl]=useState(false);          // écoute : enregistrement en cours
  var[plays,sPls]=useState(0);               // écoutes de cette question (1 + REPLAYS au plus avant de répondre)
  var[heard,sH]=useState(false);             // écoute : entendu jusqu'au bout, les réponses se déverrouillent
  var mistakesRef=useRef([]);var sidRef=useRef(0);var genRef=useRef(0);
  var listenMode=mode==="listen";
  var item=items?items[idx]:null,tier=item?MIMIC_TIERS[item.tier]:null;

  useEffect(function(){replayMode=null;},[]);
  useEffect(function(){
    var app=document.querySelector(".app");
    if(app)app.scrollTop=0;
  },[idx,phase]);
  // Musique pilotée ici (module SELF_MANAGED dans App) : la route n'y touche plus. playBGM ne relance pas
  // une piste déjà en cours ; à la fin, le done de la route l'arrête, et rien ne la relance sous le parchemin.
  // En mode écoute, silence : une voix sous la musique ne s'entend pas.
  useEffect(function(){if(phase==="done")return;if(listenMode)stopBGM();else playBGM("bgm_mimic");},[phase,listenMode]);
  // Règle « audio abort flag » (CLAUDE.md) : sans elle, un clip lancé continue après la sortie du module.
  useEffect(function(){resumeAudioSession();return stopListenAudio;},[]);

  function openingOf(i){return i===0||items[i].tier!==items[i-1].tier?"tier":"q";}
  function start(m){sMode(m);sItems(buildRound(bankOf(bank,m)));sI(0);sP("tier");}

  // Écoute : `genRef` écarte la fin d'un clip coupé (réponse, question suivante). Un clip absent résout aussi
  // (playAudioFile) : check_mimic_items et check:assets exigent donc chaque /audio/mimic/<id>.mp3.
  function listen(){
    if(playing||!item)return;
    if(phase==="q"&&plays>=1+REPLAYS)return;
    var gen=++genRef.current;
    sPl(true);
    if(phase==="q")sPls(plays+1);
    playAudioFile(mimicClipUrl(item.id)).then(function(){if(genRef.current!==gen)return;sPl(false);sH(true);});
  }
  function hush(){genRef.current++;stopCurrentListenAudio();sPl(false);}

  // Un tap répond (variante 3 « révélation », choix de Jérémy du 2026-09-18) : les Mimics se
  // démasquent d'office au retour, l'élève n'a pas à les chercher. À l'écoute, pas avant la fin du clip.
  function answer(i){
    if(listenMode&&!heard)return;
    hush();
    var ok=i===item.c,bitten=!ok&&isMimic(item,i);
    sound(ok?playCorrect:playWrong);
    if(bitten)sound(function(){playChestLand(1);});
    if(!ok)mistakesRef.current.push({tag:"Mimic Hunt · "+(listenMode?"Listen · ":"")+"Tier "+tier.roman+(bitten?" · Mimic":""),prompt:item.src,noBlank:true,
      yours:item.opts[i],correct:item.opts[item.c],why:item.exp,ref:moduleRef("mimic",item.id)});
    sR(function(r){return r.concat([{ok:ok,bitten:bitten}]);});
    sPk(i);sF(-1);sPO(false);sP("fb");
  }

  // Fin de partie : XP versée ici, jamais derrière un bouton (quitter l'écran de fin la perdait).
  // 15 + 5 par bonne réponse, −3 par morsure, +25 sans faute (lib/mimicXp.js) : 115 pour 15 items.
  // Morsures et retenue voyagent avec la session : le parchemin dit « 9 correct · 5 bites −15 ».
  // `modId` : l'écoute compte à part (mimic_listen, section Listening), miniSession le lit dans extra.
  function next(){
    hush();
    if(idx+1<TOTAL){sPk(-1);sF(-1);sPO(false);sPls(0);sH(false);sI(idx+1);sP(openingOf(idx+1));return;}
    var sc=results.filter(function(r){return r.ok;}).length;
    var bites=results.filter(function(r){return r.bitten;}).length,x=mimicXp(sc,TOTAL,bites);
    sidRef.current=p.done(sc,TOTAL,x.xp,mistakesRef.current,{bites:bites,bitePenalty:x.bitePenalty,modId:listenMode?"mimic_listen":"mimic"});
    sP("done");
  }

  function tapOption(i){
    if(phase==="q"){answer(i);return;}
    if(phase==="fb")sF(focus===i?-1:i);
  }

  // ── DONE ──
  if(phase==="done"){
    var nOk=results.filter(function(r){return r.ok;}).length;
    var nBit=results.filter(function(r){return r.bitten;}).length;
    return(<><style>{MH_CSS}</style>
      <SessionResult session={p.session} sid={sidRef.current} name={listenMode?"Mimic Hunt · Listen":"Mimic Hunt"} mistakes={mistakesRef.current}
        onContinue={function(){p.closeSession();p.back();}} onReplay={function(){replayMode=mode;p.replaySession();}}>
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
        <p>An answer that <b>copies words from the text</b> but says something the text doesn{"'"}t. It{"'"}s the TOEIC{"'"}s favourite trap: each bite costs you {MIMIC_XP.perBite} XP.</p>
      </div>
      {/* Deux portes (proto listen.html) : lire ou écouter. Chaque porte a ses statistiques et son poids
          dans l'estimation (mimic en Reading, mimic_listen en Listening). */}
      <div className="mh-doors">
        <button className="crd mh-door" onClick={function(){start("read");}}>
          <span className="mh-door-i"><GIcon name="scroll-unfurled" size={24} color="currentColor"/></span>
          <span><span className="mh-door-t out">Read</span>
            <span className="mh-door-d">Emails, notices, messages. Pick the answer that says the same thing with other words.</span>
            <span className="mh-door-s">{"Reading · Part 7 · "+roundSize(bankOf(bank,"read"))+" questions"}</span></span>
        </button>
        <button className="crd mh-door" onClick={function(){start("listen");}}>
          <span className="mh-door-i"><GIcon name="ringing-bell" size={24} color="currentColor"/></span>
          <span><span className="mh-door-t out">Listen</span>
            <span className="mh-door-d">Voicemails, announcements, a line from a conversation. The Mimic repeats a word you heard.</span>
            <span className="mh-door-s">{"Listening · Parts 3 & 4 · "+roundSize(bankOf(bank,"listen"))+" questions"}</span></span>
        </button>
      </div>
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
  var key=null;
  if(focusKind==="bridge")key=<div className="mh-key"><span className="g">{"Answer "+letterOf(focus)}</span>{" says the same thing with other words."}</div>;
  if(focusKind==="copy")key=<div className="mh-key"><span className="r">{"Answer "+letterOf(focus)}</span>{listenMode?" repeats words you heard but changes the meaning.":" copies these words but changes the meaning."}</div>;
  if(focusKind==="none")key=<div className="mh-key">{"Answer "+letterOf(focus)+(listenMode?": nothing in the recording says this.":": nothing in the text says this.")}</div>;
  var who=item.speaker?item.ctx+" · "+item.speaker:item.ctx;
  var left=1+REPLAYS-plays,locked=listenMode&&!reveal&&!heard;
  var discHint=!heard?"Tap to listen":left<=0?"No more replays":"Tap to hear it once more";

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

      {listenMode&&!reveal
        ?<div className="crd mh-src mh-src-ls">
          <div className="mh-src-ctx">{who}</div>
          <ListenDisc playing={playing} onPlay={listen} disabled={heard&&left<=0} hint={discHint}/>
        </div>
        :<div className="crd mh-src">
          <div className="mh-src-ctx">{listenMode?who+" · what you heard":item.ctx}</div>
          <p className="mh-src-text">
            {item.speaker&&<span className="mh-spk">{item.speaker+":"}</span>}
            <Marked text={item.src} marks={focusMarks}/>
          </p>
          {listenMode&&<button className="mh-again" onClick={listen} disabled={playing}>{playing?"Playing…":"▶ Hear it again"}</button>}
          {key}
        </div>}

      {verdict?<div className={"mh-verdict out "+verdict.cls}>{verdict.t}</div>:<div className="mh-q">{item.q}</div>}
      {reveal&&<div className="mh-q mh-q-small">{item.q}</div>}

      <div className="mh-opts">
        {item.opts.map(function(o,i){
          var mim=isMimic(item,i),cls="mh-opt"+(locked?" is-locked":""),letter=letterOf(i);
          if(reveal){
            if(i===item.c){cls+=" is-correct";letter="✓";}
            else if(i===pick){cls+=" is-wrong";letter="✗";}
            if(i===focus)cls+=" is-focus";
          }
          // Au retour, seule l'option regardée porte ses marques.
          var marks=reveal&&i===focus?linksOf(item,i).map(function(l){return{frag:l.opt,kind:l.kind};}):[];
          return(
            <button key={item.id+i} className={cls} onClick={function(){tapOption(i);}} aria-pressed={reveal?i===focus:undefined} aria-disabled={locked||undefined}>
              <span className="mh-let out">{letter}</span>
              <span className="mh-opt-body">
                <span><Marked text={o} marks={marks}/></span>
                {reveal&&mim&&<span className="mh-tags"><span className="mh-tag bad">{i===pick?"Mimic · it bit you":"Mimic"}</span></span>}
              </span>
              {reveal&&mim&&i===pick&&<span className="mh-face chomp"><MimicIcon size={22}/></span>}
            </button>);
        })}
      </div>
      {locked&&<p className="mh-hint">{playing?"The answers unlock when the recording ends.":"Read the question, then listen."}</p>}
      {reveal&&<p className="mh-hint">{listenMode?"Tap an answer to see what it takes from the recording.":"Tap an answer to see what it takes from the text."}</p>}

      {reveal&&(<div className="crd mh-why enter">
        <h4 className="out">The paraphrase</h4>
        {pairsOpen
          ?<div className="mh-pairs">
            {item.bridge.map(function(b,k){return(
              <div key={k} className="mh-pair"><span className="was">{b[0]}</span><span className="mh-arrow">{"→"}</span><b>{b[1]}</b></div>);})}
            {(item.echo||[]).map(function(w){return(
              <div key={"e"+w} className="mh-pair"><span className="was">{w}</span><span className="mh-arrow">=</span><b>{w}</b><span className="mh-note">{" (no everyday synonym)"}</span></div>);})}
          </div>
          :<button className="mh-toggle" onClick={function(){sPO(true);}}>{"Show the rewordings"}</button>}
        <p className="mh-exp">{item.exp}</p>
        <div className="mh-trap"><MimicIcon size={18} color="var(--red)"/><span>{item.trap}</span></div>
      </div>)}

      {reveal&&<div className="mh-cta">
        <button className="btn1 out" onClick={next}>{idx+1<TOTAL?"Next →":"See results"}</button>
      </div>}
    </div></>);
}
