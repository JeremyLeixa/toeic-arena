// HUD de session (2026-09-17, proto prototypes/sessions/, variante E) : combo et fil d'encre de la
// barre du haut. Pur, testé par tests/check_session_hud.cjs ; rendu par components/SessionHud.jsx,
// suivi par components/useSessionTrack.js.
//
// results : une entrée par question répondue, dans l'ordre. 1 = juste, 0 = faux, null = répondu sans
// dire si c'est juste (examens : pas de retour pendant l'épreuve).

// Paliers de combo (bonnes réponses d'affilée). Son « combo » aux petits paliers, « streak » dès 7.
export var COMBO_AT = [3, 5, 7, 10, 15, 20];
var STREAK_FROM = 7;

export function streakOf(results) {
  var n = 0;
  for (var i = (results || []).length - 1; i >= 0 && results[i] === 1; i--) n++;
  return n;
}

// Palier atteint PAR LA DERNIÈRE réponse, sinon null (le combo ne se rejoue pas à chaque rendu).
export function comboAt(results) {
  var s = streakOf(results);
  if (!s || COMBO_AT.indexOf(s) === -1) return null;
  return { n: s, sound: s >= STREAK_FROM ? "streak" : "combo" };
}

// Une case par question : "ok" / "ko" / "done" (répondue, neutre) / "cur" (en cours, pas encore
// répondue) / "" (à venir). brk = début d'un groupe (conversation P3/P4, texte Part 6) hors le premier.
export function segMarks(n, results, cur, groups) {
  results = results || [];
  var starts = {};
  if (groups && groups.length) {
    var at = 0;
    groups.forEach(function (g, gi) { if (gi > 0) starts[at] = true; at += g; });
  }
  var out = [];
  for (var i = 0; i < n; i++) {
    var m = "";
    if (i < results.length) m = results[i] === 1 ? "ok" : results[i] === 0 ? "ko" : "done";
    else if (i === cur) m = "cur";
    out.push({ m: m, brk: !!starts[i] });
  }
  return out;
}

// Densité du fil : cases espacées jusqu'à 15 questions, serrées jusqu'à 30, barre continue au-delà
// (examens de 49 à 202 questions : des cases d'un pixel ne se lisent plus).
export function segDensity(n) {
  return n <= 15 ? "seg" : n <= 30 ? "tight" : "bar";
}
