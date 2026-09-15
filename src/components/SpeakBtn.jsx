// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { resumeAudioSession, speak } from "../lib/audio.js";
import { useState } from "react";

// ─── AUDIO BUTTON COMPONENT ───
export function SpeakBtn(p){
  var[playing,sP]=useState(false);
  function go(){
    // User-initiated play: reset the abort flag left behind by any prior
    // Listen/Boss/AudioBlitz unmount. Without this, speak() silently returns
    // if abort was still set when the user reaches Flashcards/Tavern/SpeakBtn.
    resumeAudioSession();
    sP(true);
    speak(p.text,p.rate||0.9,p.audio||null);
    setTimeout(function(){sP(false);},Math.max(1000,p.text.length*80));
  }
  return(<button onClick={function(e){e.stopPropagation();go();}}
    style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:p.size||36,height:p.size||36,borderRadius:"50%",
      background:playing?"rgba(var(--cx),.2)":"var(--bg3)",border:"1px solid "+(playing?"var(--cyan)":"var(--bdr)"),
      cursor:"pointer",transition:"all .2s",flexShrink:0}}>
    <span style={{fontSize:p.size?p.size*0.5:18,lineHeight:1}}>{playing?"🔊":"🔈"}</span>
  </button>);
}
