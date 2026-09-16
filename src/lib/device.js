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
export function isIOSDevice(){
  try{
    var ua=navigator.userAgent||"";
    if(/iPad|iPhone|iPod/.test(ua))return true;
    // iPadOS 13+ masquerades as Mac — detect via touch points
    if(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)return true;
  }catch(e){}
  return false;
}
