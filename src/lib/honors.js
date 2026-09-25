// Les honneurs du parchemin de fin de session (SessionResult), compactés (2026-09-25, proto prototypes/honors-compact/,
// validé par Jérémy). Déclencheur : la vague rétroactive des trophées du Gauntlet, 7 trophées et 7 lignes identiques
// « +30 Darics · Achievement » sur un seul parchemin. PUR : tests/check_honors.cjs.

// Au-delà de FOLD_AT trophées, le parchemin en montre SHOW puis une ligne « +N more trophies » qui déplie le reste.
export var FOLD_AT = 4, FOLD_SHOW = 3;

// Darics regroupés par source : même libellé → une ligne, montants cumulés. Les trophées disent « N achievements »,
// les autres sources « Libellé ×N ». L'ordre d'arrivée des sources est gardé.
export function groupMarks(marks) {
  var out = [];
  (marks || []).forEach(function (m) {
    if (!m || !(m.amount > 0)) return;
    var label = m.label || "";
    var g = out.find(function (x) { return x.src === label; });
    if (g) { g.amount += m.amount; g.n++; } else out.push({ src: label, amount: m.amount, n: 1 });
  });
  return out.map(function (g) {
    var label = g.n === 1 ? g.src : g.src === "Achievement" ? g.n + " achievements" : g.src ? g.src + " ×" + g.n : "×" + g.n;
    return { amount: g.amount, label: label };
  });
}

// Trophées à afficher et nombre repliés. `open` : l'élève a déplié la liste.
export function foldTrophies(list, open) {
  list = list || [];
  if (open || list.length <= FOLD_AT) return { shown: list, hidden: 0 };
  return { shown: list.slice(0, FOLD_SHOW), hidden: list.length - FOLD_SHOW };
}
