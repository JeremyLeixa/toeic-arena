// Références du bestiaire des modules HORS banque de grammaire (2026-09-18, Mentor qui se souvient).
// UNE table, lue par le module à la capture (`ref` de mistakesRef) et par lib/reviewLookup.js à la
// résolution : la catégorie qui range la créature dans le Lair est celle que la chasse affiche.
// Elle reprend les catégories de la banque de grammaire quand elles existent (Tenses, Connectors…) :
// une créature du Gauntlet rejoint alors celles du Drill, et la fiche de grammaire s'ouvre au 3e échec.
// Léger, sans banque de questions : les modules le tirent dans le bundle principal.
//
// Clés (jamais un indice d'option, jamais l'index d'un tableau — voir CLAUDE.md) :
//   gauntlet:<id>  clue:<id>  ablitz:<id>  mimic:<id>  bforge:<id>  traps:<id>  stratquiz:<id>
//   modals_sort:<id>  modals_match:<plateau>:<paire>  tavern:<carte>:<type de question>
//   connsort:<mot>  prepdrill:<base>  gerinf:<verbe>  falsefr:<mot>  pvdojo:<verbe>:match|picker
//   wordfam:<mot>:<nature>
var CAT = {
  ablitz: "Audio Blitz", tavern: "Vocabulary", mimic: "Paraphrase", modals_match: "Modals", modals_sort: "Modals",
  wordfam: "Word Families", connsort: "Connectors", bforge: "Connectors", prepdrill: "Prepositions",
  gerinf: "Gerunds vs Infinitives", traps: "TOEIC traps", stratquiz: "Test strategy", falsefr: "False friends",
  pvdojo: "Phrasal verbs",
};
var GAUNTLET_CAT = { irr: "Irregular verbs", td: "Tenses", pf: "Passive Voice", rw: "Relative Pronouns" };
// Modules de Part 5 (grammaire en contexte) ; les autres n'ont pas de partie : la reformulation sert
// P3/P4/P7, le vocabulaire et les pièges tout le test (même choix que MODULE_TOEIC_MAP pour Mimic Hunt).
var P5 = { gauntlet: 1, clue: 1, modals_match: 1, modals_sort: 1, wordfam: 1, connsort: 1, bforge: 1, prepdrill: 1, gerinf: 1 };
// Le Clue Hunter a ses propres libellés, fins (« Gerund after 'avoid' ») : ramenés aux catégories de
// la banque de grammaire. L'ordre compte (« Present Perfect / Passive » est un temps).
var CLUE_CATS = [
  [/^(Present Perfect|Simple Past|Future Perfect)/, "Tenses"], [/Gerund|Infinitive/, "Gerunds vs Infinitives"],
  [/^Connector/, "Connectors"], [/^Article/, "Articles"], [/^Word Family/, "Word Families"], [/^Preposition/, "Prepositions"],
  [/^Relative Pronoun/, "Relative Pronouns"], [/^Passive Voice/, "Passive Voice"], [/^Conditional/, "Conditionals"],
];
export function clueCat(label) {
  var hit = CLUE_CATS.find(function (x) { return x[0].test(String(label || "")); });
  return hit ? hit[1] : null;
}
// `label` : le libellé propre à l'item quand la catégorie en dépend (Clue Hunter).
export function moduleRef(mod, id, sub, label) {
  var cat = mod === "gauntlet" ? GAUNTLET_CAT[String(id).replace(/\d+$/, "")] : mod === "clue" ? clueCat(label) : CAT[mod];
  return { k: mod + ":" + id + (sub === undefined || sub === null ? "" : ":" + sub), cat: cat || null, part: P5[mod] ? "p5" : null };
}
