// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { letterClipUrl } from "./listeningVoices.js";

// ─── TTS ENGINE (pre-generated MP3 → browser TTS fallback) ───
export var _voices=null;
export function getEnVoice(){
  if(_voices)return _voices;
  var all=window.speechSynthesis?window.speechSynthesis.getVoices():[];
  // Safari on macOS/iOS returns lang codes like "en-US", "en_US", "en_us" inconsistently.
  // Normalize to lowercase and accept both separators.
  function isEn(v){
    if(!v||!v.lang)return false;
    var l=v.lang.toLowerCase().replace(/_/g,"-");
    return l.indexOf("en")===0&&(l.length===2||l.charAt(2)==="-");
  }
  // Prefer high-quality voices on Safari (Enhanced/Premium in voice name).
  // Then en-US > en-GB > en-AU > any en.
  var enVoices=all.filter(isEn);
  if(enVoices.length===0){
    // NEVER fall back to non-English. Returning null lets the browser pick based on u.lang,
    // which is safer than explicitly assigning a French voice on a FR-locale device.
    return null;
  }
  var pref=["en-us","en-gb","en-au"];
  for(var p=0;p<pref.length;p++){
    for(var i=0;i<enVoices.length;i++){
      var lg=enVoices[i].lang.toLowerCase().replace(/_/g,"-");
      if(lg===pref[p]){_voices=enVoices[i];return _voices;}
    }
  }
  // Any English voice
  _voices=enVoices[0];return _voices;
}
export var _audioCache={};
export var _mp3Failed={};
export async function speak(text,rate,audioPath){
  // Respect abort flag — if component unmounted, don't start new audio.
  if(_audioAborted)return;
  // If an explicit MP3 path is given, try it first
  if(audioPath&&!_mp3Failed[audioPath]){
    if(_audioCache[audioPath]){
      var a=_audioCache[audioPath].cloneNode();
      a.playbackRate=rate||0.9;
      // Track so stopListenAudio can kill it on unmount.
      if(_listenAudio){try{_listenAudio.pause();_listenAudio.src="";}catch(e){}}
      _listenAudio=a;
      a.play().catch(function(){});
      return;
    }
    try{
      var audio=new Audio(audioPath);
      await new Promise(function(resolve,reject){
        audio.oncanplaythrough=resolve;
        audio.onerror=reject;
        audio.load();
      });
      if(_audioAborted)return;
      audio.playbackRate=rate||0.9;
      _audioCache[audioPath]=audio;
      if(_listenAudio){try{_listenAudio.pause();_listenAudio.src="";}catch(e){}}
      _listenAudio=audio;
      audio.play().catch(function(){});
      return;
    }catch(e){_mp3Failed[audioPath]=true;}
  }
  // Fallback to browser TTS
  if(!window.speechSynthesis)return;
  if(_audioAborted)return;
  window.speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(text);
  u.rate=rate||0.9;u.pitch=1;u.volume=1;
  // Set lang BEFORE voice — Safari bug: voice assignment can override/lock language otherwise
  u.lang="en-US";
  var v=getEnVoice();if(v)u.voice=v;
  window.speechSynthesis.speak(u);
}
export function speakBrowserTTS(text,rate,cb){
  if(!window.speechSynthesis){cb();return;}
  window.speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(text);
  u.rate=rate||0.9;u.pitch=1;u.volume=1;
  // Set lang BEFORE voice — Safari bug: voice assignment can override/lock language otherwise
  u.lang="en-US";
  var v=getEnVoice();if(v)u.voice=v;
  u.onend=cb;u.onerror=cb;
  window.speechSynthesis.speak(u);
}
// Track the currently-playing listening audio so we can stop it on unmount/Quit.
// Otherwise audio keeps playing in background after the user exits a listening exercise.
//
// GUARD: _audioAborted flag is essential to kill in-flight async sequences.
// Before this fix, stopListenAudio stopped the CURRENT audio but the async
// playQuestion()/playP1()/etc sequences kept running their await chain and
// started the NEXT audio clip after the user had already navigated away
// (Part 2 bug reported 2026-04-22). Each audio-exercise component must call
// resumeAudioSession() on mount (via useEffect) to reset the flag, and
// stopListenAudio() on unmount to abort in-flight sequences.
export var _listenAudio=null;
export var _audioAborted=false;
export function playAudioFile(url){
  return new Promise(function(resolve){
    // Sequence was aborted (component unmounted) — bail out immediately,
    // don't create a new Audio object for the next clip in the chain.
    if(_audioAborted){resolve();return;}
    // Abort any previous audio still playing from this helper
    if(_listenAudio){try{_listenAudio.pause();_listenAudio.src="";}catch(e){}_listenAudio=null;}
    var audio=new Audio(url);
    _listenAudio=audio;
    function cleanup(){if(_listenAudio===audio)_listenAudio=null;resolve();}
    audio.onended=cleanup;
    audio.onerror=function(){console.warn("Audio not found: "+url);cleanup();};
    audio.play().catch(cleanup);
  });
}
// Joue « A. » / « B. » … (clip de lettre, MÊME voix que l'option — lib/listeningVoices.js)
// puis l'option AFFICHÉE en position `pos`. Depuis le 2026-09-16 les clips d'options P1/P2
// n'ont plus de lettre dedans : c'est ce qui rend la permutation des options (aud) libre —
// quel que soit l'ordre des clips, l'élève entend A, B, C(, D) dans l'ordre affiché.
// `part` = "p1" | "p2", `id` = l'id de l'item (bp… pour le Boss → voix Sarah).
export async function playLetteredOption(part,id,pos,url){
  await playAudioFile(letterClipUrl(part,id,pos));
  if(_audioAborted)return;
  await new Promise(function(r){setTimeout(r,150);});
  await playAudioFile(url);
}
export function stopListenAudio(){
  _audioAborted=true;
  if(_listenAudio){try{_listenAudio.pause();_listenAudio.src="";}catch(e){}_listenAudio=null;}
  // Also cancel any active browser TTS (speechSynthesis) — speak() fallback
  // uses window.speechSynthesis which has its own queue, distinct from _listenAudio.
  try{if(window.speechSynthesis)window.speechSynthesis.cancel();}catch(e){console.warn("[audio] tts cancel:",e&&e.message);}
}
export function resumeAudioSession(){_audioAborted=false;}
// Preload voices (some browsers need this)
if(window.speechSynthesis){window.speechSynthesis.onvoiceschanged=function(){_voices=null;getEnVoice();};}

// Accesseurs ajoutés au découpage (2026-09-15). Une `var` exportée est une liaison en
// lecture seule pour ses importateurs : AudioBlitz assignait _listenAudio et Onboard lisait
// _audioAborted directement dans le monolithe. Corps identiques aux lignes inline remplacées.
export function stopCurrentListenAudio(){if(_listenAudio){try{_listenAudio.pause();_listenAudio.src="";}catch(e){}}}
export function setListenAudio(audio){_listenAudio=audio;}
export function isAudioAborted(){return _audioAborted;}
