// Grammar Gauntlet : épreuve du hub → module de moduleScores. PUR, sans données.
// Les 4 épreuves d'origine comptent sous "gauntlet_<épreuve>". Les 3 entrées le 2026-09-25 (Knotbinder, Anchor
// Hall, Twin Paths) gardent les ids qu'elles avaient comme modules seuls : connsort, prepdrill, gerinf. Ainsi
// l'historique des élèves, les poids de l'estimateur (lib/toeic.js), les échelons de maîtrise, les jetons armés et les
// refs du bestiaire continuent sans migration. NE JAMAIS les renommer en "gauntlet_…" : tout cela repartirait de zéro.
export var GAUNTLET_MOD = {
  irregular: "gauntlet_irregular", tense: "gauntlet_tense", passive: "gauntlet_passive", relative: "gauntlet_relative",
  connectors: "connsort", prepositions: "prepdrill", gerund: "gerinf",
};
// Ordre du hub (et de la tuile Train : ses `subs`).
export var GAUNTLET_SUBS = ["irregular", "tense", "passive", "relative", "connectors", "prepositions", "gerund"];
export function gauntletModId(sub) { return GAUNTLET_MOD[sub] || "gauntlet_" + sub; }
export var GAUNTLET_MODS = GAUNTLET_SUBS.map(gauntletModId);
