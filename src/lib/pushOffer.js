// Demande de notifications dans l'appli (2026-09-24, proto prototypes/push-optin/, variante B « feuille
// d'Aldric » choisie par Jérémy). Pur : tests/check_push_offer.cjs.
//
// Pourquoi : depuis le 30/06, l'onboarding ne demande plus les notifications (il fait installer l'appli) et seul
// le bouton du Profil restait. 3 abonnements depuis le 1er septembre : la relance des inactifs, le rappel de série
// et la lettre du lundi n'atteignaient presque personne.
//
// Règles :
//  · jamais avant la PREMIÈRE session terminée (u.stats.sessions ≥ 1), jamais pour un visiteur ;
//  · autorisation du navigateur « denied » → plus jamais (un refus y est définitif, insister l'épuise) ;
//    « granted » → rien (abonné, ou désabonné exprès depuis le Profil : on ne revient pas dessus) ;
//  · iPhone hors appli installée → mode "ios" : la demande y est impossible, la feuille montre l'installation ;
//  · navigateur sans Push API (hors ce cas iPhone) → rien ;
//  · « Not now » → reproposé dans 5 jours, 3 fois au plus, puis plus jamais automatiquement (le Profil reste).
// La mémoire des reports vit sur l'APPAREIL (localStorage) : l'autorisation aussi.
export var OFFER_EVERY_DAYS = 5;
export var OFFER_MAX = 3;
export var OFFER_KEY = "toeic-push-offer";

// env = {supported, permission: "default"|"granted"|"denied"|null, ios, standalone}
// rec = {n, next, iosN, iosNext} (instants en ms) ; rend null | "ask" | "ios".
// Deux compteurs : les « Got it » de l'iPhone hors appli ne doivent pas épuiser la VRAIE demande, qui devient
// possible une fois l'appli installée.
export function pushOfferMode(u, env, rec, now) {
  if (!u || !u.name) return null;
  if (!u.classCode || u.classCode === "visitor") return null;
  if (((u.stats && u.stats.sessions) || 0) < 1) return null;
  var e = env || {};
  var r = rec || {};
  var t = now || Date.now();
  if (e.ios && !e.standalone) {
    if ((r.iosN || 0) >= OFFER_MAX || (r.iosNext && t < r.iosNext)) return null;
    return "ios";
  }
  if ((r.n || 0) >= OFFER_MAX || (r.next && t < r.next)) return null;
  if (!e.supported) return null;
  if (e.permission !== "default") return null;
  return "ask";
}

export function laterRecord(rec, now, mode) {
  var r = Object.assign({}, rec || {});
  var t = (now || Date.now()) + OFFER_EVERY_DAYS * 864e5;
  if (mode === "ios") { r.iosN = (r.iosN || 0) + 1; r.iosNext = t; }
  else { r.n = (r.n || 0) + 1; r.next = t; }
  return r;
}

export function readOfferRecord(storage) {
  try { var raw = storage && storage.getItem(OFFER_KEY); return raw ? JSON.parse(raw) : {}; }
  catch (e) { console.warn("[pushOffer] read caught:", e && e.message); return {}; }
}
export function writeOfferRecord(storage, rec) {
  try { if (storage) storage.setItem(OFFER_KEY, JSON.stringify(rec)); }
  catch (e) { console.warn("[pushOffer] write caught:", e && e.message); }
}
