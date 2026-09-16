// ═══════════════════════════════════════════════════════════════
// Ouverture de coffre v3 — ordre et regroupement de la révélation (pur, testé par
// tests/check_chest_reveal.cjs). Ne touche ni au tirage (pickRewards) ni à la
// persistance (openChestFromPending) : il ne décide que de ce que l'élève voit, et quand.
//
// Pourquoi : la V2 montrait les récompenses dans l'ordre des slots de DROP_TABLES
// (Darics, XP, puis l'avatar légendaire en 3e sur 9 cartes, puis les tokens) : le sommet
// arrivait au premier tiers et chaque carte portait la rareté du COFFRE (« +700 Darics »
// étiqueté LEGENDARY). Ici : petits lots groupés, gros lots seuls, du moins rare au plus
// rare, et une rareté seulement sur les objets qui en ont une.
//
// ⚠️ Aucun import : data/chests.js importe Supabase, et un require() de ce module en Node
// (le test) casserait. L'ordre des raretés est donc recopié ; check_chest_reveal vérifie
// qu'il reste celui de RARITIES.
// ═══════════════════════════════════════════════════════════════

export var RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legend"];

// "rare" → 2 ; absent ou inconnu → -1 (pas de rareté affichée)
export function rarityTier(id) {
  return RARITY_ORDER.indexOf(id);
}

// Ordre d'affichage à rareté égale : cheat sheet d'abord, avatar en dernier
var TYPE_RANK = { cheat_sheet: 0, title: 1, frame: 2, skin: 3, avatar: 4 };

// rewards (sortie de pickRewards) → [{kind, items, rarity}], rarity = 0..4 ou null.
//   kind "currencies" : Darics + XP (y compris l'XP de repli `fallback`), une seule carte
//   kind "tokens"     : tous les tokens, une seule carte
//   kind "item"       : un objet à rareté (cosmétique ou cheat sheet), seul sur sa carte
export function groupRewards(rewards) {
  var currencies = [], tokens = [], items = [];
  (rewards || []).forEach(function (r) {
    if (!r) return;
    if (r.type === "daric" || r.type === "xp") currencies.push(r);
    else if (r.type === "token") tokens.push(r);
    else items.push(r);
  });
  var groups = [];
  if (currencies.length) groups.push({ kind: "currencies", items: currencies, rarity: null });
  if (tokens.length) groups.push({ kind: "tokens", items: tokens, rarity: null });
  items
    .map(function (r, i) { return { r: r, i: i, t: rarityTier(r.rarity) }; })
    .sort(function (a, b) {
      return a.t - b.t || (TYPE_RANK[a.r.type] || 0) - (TYPE_RANK[b.r.type] || 0) || a.i - b.i;
    })
    .forEach(function (x) { groups.push({ kind: "item", items: [x.r], rarity: x.t >= 0 ? x.t : null }); });
  return groups;
}

// Meilleure rareté du butin, -1 s'il n'y en a aucune (coffre Novice)
export function bestRarity(rewards) {
  return (rewards || []).reduce(function (m, r) {
    return r ? Math.max(m, rarityTier(r.rarity)) : m;
  }, -1);
}

// Couleur de la lumière aux 3 taps. Monte palier par palier, ou tient puis saute
// (le moment qui fait réagir) ; finit toujours sur la meilleure rareté.
export function tellSteps(best, rand) {
  var r = typeof rand === "function" ? rand : Math.random;
  if (best < 0) return [-1, -1, -1];
  if (best >= 3 && r() < 0.4) { var base = Math.max(0, best - 3); return [base, base, best]; }
  return [Math.max(0, best - 2), Math.max(0, best - 1), best];
}
