// Budget d'interruptions plein écran (2026-09-24, proto prototypes/ceremony-budget/, variante B « une par
// retour » choisie par Jérémy). Pur : tests/check_interruptions.cjs.
//
// Avant : fin de manche + retour pouvaient enchaîner Ascension, cérémonie du retournement, trois moments
// d'Aldric et la lettre du lundi (6 plein écran, 7 taps). Règle : AU PLUS UN plein écran « non demandé »
// par entrée sur Home, priorité retournement > promotion > moment d'Aldric > lettre. Rien n'est perdu : ce qui
// ne passe pas attend l'entrée suivante sur Home, un par entrée.
//
// Deux familles de moments d'Aldric :
//  · PALIERS (déclenchés par l'état : ligue, série, niveau, examens) → soumis au budget, sur Home seulement ;
//  · CONTEXTUELS (verdict du Battle Scan, premier coffre, Shop, onglet Mentor…) → présentent l'écran où
//    l'élève arrive : jamais reportés, jamais comptés.
export var MILESTONE_MOMENTS = ["rising_rank", "oath_of_fire", "dawn_rank", "first_combat", "dragon"];
export function isMilestone(id) { return MILESTONE_MOMENTS.indexOf(id) >= 0; }

// Le plein écran retenu dans l'écran de fin : le retournement (unique par catégorie) passe avant la
// promotion de ligue, qui devient alors une ligne du parchemin.
export function sessionFullscreen(s) {
  if (!s) return null;
  if (s.turn) return "turn";
  if (s.leagueUp) return "league";
  return null;
}
// Une session qui a montré (ou montrera) une cérémonie consomme l'entrée suivante sur Home.
export function spendsNextEntry(s) { return !!sessionFullscreen(s); }

// Le moment d'Aldric à afficher : le premier contextuel de la file, sinon le premier palier si le budget de
// l'entrée est libre. null = rien pour l'instant (les paliers attendent).
export function pickNarrator(queue, budgetFree) {
  var q = queue || [];
  for (var i = 0; i < q.length; i++) if (!isMilestone(q[i])) return q[i];
  if (!budgetFree) return null;
  for (var j = 0; j < q.length; j++) if (isMilestone(q[j])) return q[j];
  return null;
}
