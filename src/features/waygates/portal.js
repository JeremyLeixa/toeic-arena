// Passage d'un Waygate (2026-09-24, variante V3 « Plongée » choisie par Jérémy, prototypes/waygate-portal/).
// Le hub joue la plongée (0,8 s) puis navigue ; l'écran du monde, monté ensuite, joue l'arrivée : un voile de la
// couleur du cœur du portail qui se dissipe pendant que l'accueil se pose. Ce drapeau relie les deux écrans, qui
// sont deux chunks chargés à la demande : un module partagé plutôt que le stockage du navigateur.
export var PORTAL_DIVE_MS = 800;
var _arrivingAt = 0;
// Le hub : on vient de traverser.
export function markPortal() { _arrivingAt = Date.now(); }
// Le monde, au montage : true seulement juste après un passage (un rechargement ou un « Play again » minutes
// plus tard n'arrivent pas par le portail). 4 s couvrent un chunk lent à charger. Lecture SANS effet de bord :
// StrictMode appelle deux fois l'initialiseur d'un useState, une lecture qui consomme rendrait false au second.
export function arrivedByPortal() { return !!_arrivingAt && Date.now() - _arrivingAt < 4000; }
// Mouvement réduit : pas de plongée, un simple fondu (la navigation n'attend pas).
export function reducedMotion() {
  try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  catch (e) { console.warn("[waygates] reduced motion:", e && e.message); return false; }
}
