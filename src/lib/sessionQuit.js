// Abandons de manche (2026-09-23, onglet Usage du dashboard formateur).
//
// SessionTop (components/SessionHud.jsx) n'est rendu que pendant les questions et ne connaît ni le
// module ni App() : il signale ici « l'élève a confirmé "Leave" après N réponses », et App() pose le
// puits qui range l'abandon (clé `quit:<route>_<date>` de dailyModSessions, voir trackModSession).
// Un accesseur plutôt qu'une prop : sinon les ~40 appels de SessionTop devraient tous la relayer.
// Sans puits posé (banc de test, prototypes), reportQuit ne fait rien.
var _sink = null;
export function setQuitSink(fn) { _sink = typeof fn === "function" ? fn : null; }
export function reportQuit(answered) {
  if (!_sink) return;
  try { _sink(answered | 0); } catch (e) { console.warn("[quit] caught:", e && e.message); }
}
// Routes qui reprennent dans la journée : les quitter n'est pas abandonner.
export var QUIT_EXEMPT = { boss: true, endless: true };
export var QUIT_PREFIX = "quit:";
