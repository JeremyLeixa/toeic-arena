// XP de base d'une partie de Mimic Hunt (2026-09-19). PUR : requis par tests/check_mimic_items.cjs.
//
// 15 de participation + 5 par bonne réponse, −3 par MORSURE (l'élève a choisi un Mimic), +25 sans faute.
// La morsure coûte, pas la simple erreur : mordre, c'est avoir associé des mots sans lire le sens, le
// réflexe exact que le module combat. Le coût reste DANS la partie : la base ne descend jamais sous les
// 15 de participation, et rien n'est repris sur l'XP déjà acquise (un compteur qui baisse fait lâcher le
// module, et toucherait la ligue). Les portes de lib/xp.js (précision, anti-farming) s'appliquent ensuite.
// `bitePenalty` = ce qui a vraiment été retiré (plancher compris) : l'écran de fin l'affiche tel quel.
export var MIMIC_XP = { base: 15, perOk: 5, perBite: 3, perfect: 25 };

export function mimicXp(sc, tot, bites) {
  var raw = MIMIC_XP.base + MIMIC_XP.perOk * sc;
  var kept = Math.max(MIMIC_XP.base, raw - MIMIC_XP.perBite * (bites || 0));
  return { xp: kept + (tot > 0 && sc === tot ? MIMIC_XP.perfect : 0), bitePenalty: raw - kept };
}
