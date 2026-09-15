// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { haptic } from "../lib/device.js";
import { downloadGrimoire } from "../lib/grimoireExport.js";
import { useState, useRef } from "react";

function renderGrimoireBlock(b,i){
  if(b.type==="paragraph")return(<p key={i} className="grim-paragraph">{b.text}</p>);
  if(b.type==="heading")return(<h4 key={i} className="grim-heading">{b.text}</h4>);
  if(b.type==="rule")return(<div key={i} className="grim-rule">{b.label&&<div className="grim-rule-label">{b.label}</div>}<div className="grim-rule-formula">{b.formula}</div></div>);
  if(b.type==="example")return(<div key={i} className="grim-example"><div className="grim-example-en">{b.en}</div>{b.fr&&<div className="grim-example-fr">{b.fr}</div>}{b.note&&<div className="grim-example-note">{b.note}</div>}</div>);
  if(b.type==="trap")return(<div key={i} className="grim-trap">{b.text}</div>);
  if(b.type==="table")return(<table key={i} className="grim-table"><thead><tr>{b.headers.map(function(h,j){return(<th key={j}>{h}</th>);})}</tr></thead><tbody>{b.rows.map(function(r,j){return(<tr key={j}>{r.map(function(c,k){return(<td key={k}>{c}</td>);})}</tr>);})}</tbody></table>);
  if(b.type==="list")return(<ul key={i} className="grim-list">{b.items.map(function(it,j){return(<li key={j}>{it}</li>);})}</ul>);
  return null;
}
export function GrimoireReader(p){
  var grim=p.grimoire;
  var [chIdx,setChIdx]=useState(0);
  var [flipDir,setFlipDir]=useState(null); // null | "next" | "prev"
  var [showToc,setShowToc]=useState(false);
  var [closing,setClosing]=useState(false);
  var touchStart=useRef(0);
  // Fade-to-black on close: set closing → .grim-closing animates opacity
  // 1→0 over 300ms, then we actually dismount via p.back(). Mirrors the
  // grim-fade-in open animation for symmetry.
  function closeGrim(){
    if(closing)return;
    setClosing(true);
    setTimeout(function(){p.back();},300);
  }
  var ch=grim.chapters[chIdx];
  var total=grim.chapters.length;
  var romans=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
  function go(dir){
    if(flipDir)return;
    var nxt=dir==="next"?chIdx+1:chIdx-1;
    if(nxt<0||nxt>=total)return;
    try{haptic("pageturn");}catch(e){console.warn("[Grim] haptic:",e&&e.message);}
    setFlipDir(dir);
    setTimeout(function(){setChIdx(nxt);setFlipDir(null);},680);
  }
  function onTouchStart(e){touchStart.current=e.touches[0].clientX;}
  function onTouchEnd(e){
    var dx=e.changedTouches[0].clientX-touchStart.current;
    if(dx<-50)go("next");
    else if(dx>50)go("prev");
  }
  function pickTocItem(i){setChIdx(i);setShowToc(false);}
  return(<div className={"grim-overlay"+(closing?" grim-closing":"")}>
    <div className="grim-topbar">
      <button className="grim-btn-toc" onClick={function(){setShowToc(true);}}>{"\u2630"} Chapitres</button>
      <div className="grim-title">{grim.title}</div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <button className="grim-btn-toc" onClick={function(){downloadGrimoire(grim);}} title="T\u00e9l\u00e9charger / Imprimer">{"\u2913"}</button>
        <button className="grim-btn-close" onClick={closeGrim}>{"\u2715"}</button>
      </div>
    </div>
    <div className="grim-book" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="grim-page-wrap">
        <div className={"grim-page"+(flipDir==="next"?" grim-flip-anim grim-flip-next":flipDir==="prev"?" grim-flip-anim grim-flip-prev":"")}>
          <div className="grim-page-content">
            <div className="grim-chapter-title">{ch.title}</div>
            {ch.intro&&<div className="grim-chapter-intro">{ch.intro}</div>}
            {ch.blocks.map(function(b,i){return renderGrimoireBlock(b,i);})}
            <div className="grim-page-num">{"\u2014 "+(romans[chIdx]||(chIdx+1))+" \u2014"}</div>
          </div>
        </div>
      </div>
    </div>
    <div className="grim-nav">
      <button className="grim-nav-btn" disabled={chIdx===0||flipDir} onClick={function(){go("prev");}}>{"\u25C0 Prev"}</button>
      <div className="grim-nav-info">{"Chapitre "+(chIdx+1)+" / "+total}</div>
      <button className="grim-nav-btn" disabled={chIdx>=total-1||flipDir} onClick={function(){go("next");}}>{"Next \u25B6"}</button>
    </div>
    {showToc&&<div className="grim-toc">
      <div className="grim-toc-title">Table des Chapitres</div>
      {grim.chapters.map(function(c,i){return(
        <button key={i} className={"grim-toc-item"+(i===chIdx?" active":"")} onClick={function(){pickTocItem(i);}}>{c.title}</button>
      );})}
      <button className="grim-btn-close" style={{display:"block",margin:"18px auto 0",padding:"10px 20px"}} onClick={function(){setShowToc(false);}}>Fermer</button>
    </div>}
  </div>);
}
