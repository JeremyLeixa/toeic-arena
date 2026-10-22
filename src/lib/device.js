// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.

// ─── HAPTIC FEEDBACK ───
export var HAPTICS={chest:[100,50,100],chestOpen:[50,30,50,30,150],levelUp:[100,50,200],achieve:[80,40,80,40,80],league:[200,100,300],pb:[100,50,100,50,200],streak:[80,60,120],complete:[150],pageturn:[10],chestLand:[35],chestTap:[22],chestTell:[20,30,40],chestOpenLegend:[90,40,90,40,220],cardLegend:[40,30,120],lootCollect:[20,20,20]};
export function haptic(k){try{if(navigator.vibrate&&HAPTICS[k])navigator.vibrate(HAPTICS[k]);}catch(e){}}
// ─── PLATFORM DETECTION ─── (used for install prompts, haptic, etc.)
export function isStandalonePWA(){
  try{
    if(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)return true;
    if(window.navigator&&window.navigator.standalone===true)return true;
  }catch(e){}
  return false;
}
// ─── INSTALLATION EN UN TAP (Android/desktop Chromium) ───
// 2026-10-22 : l'écran « Installe Verse Arena » est sorti de l'onboarding (il passait avant toute valeur).
// Chrome n'émet beforeinstallprompt qu'une fois, au chargement : on le capte ici, au premier import (device.js
// est chargé par la Home, donc tôt), et la Home propose « Install » après la première manche. L'iPhone n'a pas
// cet événement : son installation passe par la feuille de notifications (lib/pushOffer.js, mode "ios").
var installPrompt=null,installSubs=[];
function emitInstall(){installSubs.forEach(function(f){try{f(installPrompt);}catch(e){console.warn("[install] sub caught:",e&&e.message);}});}
if(typeof window!=="undefined"&&window.addEventListener){
  window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();installPrompt=e;emitInstall();});
  window.addEventListener("appinstalled",function(){installPrompt=null;emitInstall();});
}
export function getInstallPrompt(){return installPrompt;}
export function onInstallPrompt(f){installSubs.push(f);return function(){installSubs=installSubs.filter(function(g){return g!==f;});};}
// Ouvre la boîte native ; rend true si l'élève accepte. L'événement ne sert qu'une fois.
export async function runInstallPrompt(){
  var ev=installPrompt;if(!ev)return false;
  installPrompt=null;emitInstall();
  try{await ev.prompt();var ch=await ev.userChoice;return !!ch&&ch.outcome==="accepted";}
  catch(e){console.warn("[install] prompt caught:",e&&e.message);return false;}
}
export function isIOSDevice(){
  try{
    var ua=navigator.userAgent||"";
    if(/iPad|iPhone|iPod/.test(ua))return true;
    // iPadOS 13+ masquerades as Mac — detect via touch points
    if(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)return true;
  }catch(e){}
  return false;
}
