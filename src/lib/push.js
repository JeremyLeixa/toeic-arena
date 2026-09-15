// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { supabase } from "../supabase.js";

// ─── PUSH NOTIFICATIONS ───
export var VAPID_PUBLIC_KEY="BGiKomKxy1j081qd5ZaZnp7EUAYXIGRPWu8ePQySLGhQ0T45-m3oKTqgj-teqm2l5RoR0jnamCWHZ6pMYjrPVy4";
export function urlBase64ToUint8Array(base64String){
  var padding="=".repeat((4-base64String.length%4)%4);
  var base64=(base64String+padding).replace(/-/g,"+").replace(/_/g,"/");
  var rawData=window.atob(base64);var outputArray=new Uint8Array(rawData.length);
  for(var i=0;i<rawData.length;++i)outputArray[i]=rawData.charCodeAt(i);
  return outputArray;
}
export async function subscribePush(userName,userClassCode){
  try{
    if(!("serviceWorker" in navigator)||!("PushManager" in window))return null;
    // Explicit permission request (some browsers don't auto-prompt on subscribe)
    if("Notification" in window&&Notification.permission!=="granted"){
      var perm=await Notification.requestPermission();
      if(perm!=="granted"){console.log("Push permission denied:",perm);return null;}
    }
    var reg=await navigator.serviceWorker.ready;
    var existing=await reg.pushManager.getSubscription();
    var sub=existing||await reg.pushManager.subscribe({
      userVisibleOnly:true,
      applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    var subJson=sub.toJSON();
    // Securite (lot 2 du verrou satellites) : plus d'acces direct a
    // push_subscriptions depuis le navigateur. La table etait lisible ET
    // supprimable avec la cle publique — de quoi couper les notifications
    // d'une promo entiere. La RPC fait le delete+insert en une transaction
    // (l'ancien couple ne l'etait pas : entre les deux appels REST, l'eleve
    // pouvait se retrouver sans aucune ligne) et exige l'endpoint : aucune
    // forme "supprime tous mes abonnements" n'est exposee.
    var res=await supabase.rpc("upsert_push_subscription",{
      p_name:userName,
      p_class_code:userClassCode,
      p_endpoint:subJson.endpoint,
      p_subscription:subJson
    });
    if(res.error){console.error("Push DB insert failed:",res.error.message);return null;}
    if(res.data&&res.data.ok===false){console.error("Push DB insert refused:",res.data.error);return null;}
    return sub;
  }catch(e){console.log("Push subscription failed:",e);return null;}
}
export async function unsubscribePush(userName,userClassCode){
  try{
    if(!("serviceWorker" in navigator))return;
    var reg=await navigator.serviceWorker.ready;
    var sub=await reg.pushManager.getSubscription();
    if(sub){
      var ep=sub.endpoint;
      await sub.unsubscribe();
      var del=await supabase.rpc("delete_push_subscription",{
        p_name:userName,p_class_code:userClassCode,p_endpoint:ep
      });
      if(del.error)console.warn("[push] unsubscribe RPC error:",del.error.message);
      else if(del.data&&del.data.ok===false)console.warn("[push] unsubscribe refused:",del.data.error);
    }
  }catch(e){console.log("Push unsubscribe failed:",e);}
}
export async function isPushSubscribed(){
  try{
    if(!("serviceWorker" in navigator)||!("PushManager" in window))return false;
    var reg=await navigator.serviceWorker.ready;
    var sub=await reg.pushManager.getSubscription();
    return!!sub;
  }catch(e){return false;}
}
