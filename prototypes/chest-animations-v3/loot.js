// ═══════════════════════════════════════════════════════════════
// loot.js — contenu simulé + regroupement des révélations (socle S3/S4)
// Reprend DROP_TABLES de src/data/chests.js (montants, pools, ordre des slots).
// groupRewards() est pure : c'est elle qui partira dans src/lib/ au câblage.
// ═══════════════════════════════════════════════════════════════
(function () {
  var RARITIES = [
    { id: "common", label: "Common", color: "#909090", light: "#e4e4e4" },
    { id: "uncommon", label: "Uncommon", color: "#3ecc78", light: "#7dffb0" },
    { id: "rare", label: "Rare", color: "#3a8ee0", light: "#78bcff" },
    { id: "epic", label: "Epic", color: "#c060f0", light: "#e094ff" },
    { id: "legend", label: "Legendary", color: "#ffc020", light: "#ffd65a" },
  ];
  // Lumière neutre quand le coffre ne contient aucun objet à rareté (Novice)
  var NEUTRAL = { id: "none", label: "", color: "#d8b070", light: "#ffdca8" };

  var CHESTS = {
    novice: { label: "Novice", tier: 0 },
    guerrier: { label: "Warrior", tier: 1 },
    champion: { label: "Champion", tier: 2 },
    legendaire: { label: "Legendary", tier: 3 },
  };

  var TOKENS = {
    diminishing_bypass: { name: "Bypass Token", icon: "padlock-open" },
    streak_shield: { name: "Streak Shield", icon: "templar-shield" },
    daily_reroll: { name: "Daily Reroll", icon: "rolling-dices" },
    mock_reset: { name: "Mock Reset", icon: "scroll-quill" },
    boss_reset: { name: "Boss Reset", icon: "dragon-head" },
    endless_resurrect: { name: "Endless Resurrect", icon: "infinity" },
    insight_token: { name: "Insight Token", icon: "crystal-ball" },
  };

  // Échantillon du catalogue réel (AVATARS / SKINS / FRAMES / TITLES)
  var COSMETICS = {
    avatar: [
      { id: "ecuyer", name: "Squire", r: 0, icon: "sword-brandish" },
      { id: "paysan", name: "Peasant", r: 0, icon: "chess-pawn" },
      { id: "seigneur", name: "Lord", r: 1, icon: "throne-king" },
      { id: "paladin", name: "Paladin", r: 2, icon: "templar-shield" },
      { id: "archimage", name: "Archmage", r: 2, icon: "crystal-wand" },
      { id: "assassin", name: "Assassin", r: 2, icon: "daggers" },
      { id: "ch_dragon", name: "Dragon Hunter", r: 3, icon: "dragon-head" },
      { id: "necro", name: "Necromancer", r: 3, icon: "skull-staff" },
      { id: "st_tempete", name: "Storm Lord", r: 3, icon: "lightning-storm" },
      { id: "pourfendeur", name: "Slayer", r: 4, icon: "broadsword" },
      { id: "champion", name: "Champion", r: 4, icon: "laurel-crown" },
    ],
    skin: [
      { id: "argent", name: "Silver", r: 2, hex: "#b4b4c8", dark: "#888898" },
      { id: "saphir", name: "Sapphire", r: 2, hex: "#3a94dc", dark: "#1a6aaa" },
      { id: "rubis", name: "Ruby", r: 3, hex: "#dc3a50", dark: "#c01830" },
      { id: "amethyste", name: "Amethyst", r: 3, hex: "#a05adc", dark: "#7030aa" },
      { id: "obsidienne", name: "Obsidian", r: 4, hex: "#b090f0", dark: "#8060c0" },
      { id: "aurore", name: "Aurora Borealis", r: 4, hex: "#40d0c0", dark: "#3a9870" },
    ],
    frame: [
      { id: "gold_neon", name: "Gold Neon", r: 2, color: "#ffc020" },
      { id: "ice_crystal", name: "Ice Crystal", r: 2, color: "#58a8e8" },
      { id: "fire_forged", name: "Fire Forged", r: 3, color: "#ff6020" },
      { id: "amethyst_veil", name: "Amethyst Veil", r: 3, color: "#a05adc" },
      { id: "dragonbone", name: "Dragonbone", r: 4, gradient: ["#ffd060", "#ff8020"] },
      { id: "cosmic", name: "Cosmic", r: 4, gradient: ["#ff40c0", "#40c0ff", "#ffc040"] },
    ],
    title: [
      { id: "apprentice", name: "The Apprentice", r: 2 },
      { id: "scribe", name: "The Scribe", r: 2 },
      { id: "wordsmith", name: "The Wordsmith", r: 3 },
      { id: "tense_sage", name: "Tense Sage", r: 3 },
      { id: "dragon_slayer", name: "Dragon Slayer", r: 4 },
      { id: "legend", name: "Legend", r: 4 },
    ],
  };
  var CHEAT_SHEETS = ["Part 5 — Conjunction Traps", "Part 7 — Skim & Scan", "Listening — Liaisons & Réductions"];

  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // Comme _pickFromPool : tirage uniforme dans le catalogue filtré par minRarity.
  // `forced` (sélecteur du proto) fixe la rareté quand le catalogue du type la possède.
  function cosmetic(types, minR, forced) {
    var pool = [];
    types.forEach(function (t) {
      COSMETICS[t].forEach(function (c) { if (c.r >= minR) pool.push({ t: t, c: c }); });
    });
    if (forced !== null && forced !== undefined) {
      var f = pool.filter(function (x) { return x.c.r === forced; });
      if (f.length) pool = f;
    }
    var x = pick(pool);
    return { type: x.t, id: x.c.id, rarity: x.c.r, data: x.c };
  }
  function tokens(pool, n) {
    var out = [];
    for (var i = 0; i < n; i++) { var id = pick(pool); out.push({ type: "token", id: id, data: TOKENS[id] }); }
    return out;
  }

  // Ordre des slots identique à DROP_TABLES (c'est l'ordre « brut » que groupRewards corrige)
  function simulateChest(chestType, forcedRarity) {
    var R = [];
    if (chestType === "novice") {
      R.push({ type: "daric", amount: 30 }, { type: "xp", xp: rnd(50, 150) });
      R = R.concat(tokens(["diminishing_bypass", "streak_shield", "daily_reroll"], 1));
    } else if (chestType === "guerrier") {
      R.push({ type: "daric", amount: 90 }, { type: "xp", xp: rnd(200, 400) });
      // Frames et titres n'existent qu'à partir de Rare dans le vrai catalogue
      R.push(cosmetic(["frame", "title"], 2, forcedRarity));
      R = R.concat(tokens(["diminishing_bypass", "streak_shield", "daily_reroll"], 2));
    } else if (chestType === "champion") {
      R.push({ type: "daric", amount: 250 }, { type: "xp", xp: rnd(500, 800) });
      R.push(cosmetic(["avatar", "skin", "frame", "title"], 2, forcedRarity));
      R = R.concat(tokens(["diminishing_bypass", "daily_reroll", "mock_reset", "endless_resurrect"], 3));
    } else {
      R.push({ type: "daric", amount: 700 }, { type: "xp", xp: rnd(1000, 1500) });
      R.push(cosmetic(["avatar", "skin"], 4, null));
      R.push(cosmetic(["frame", "title"], 3, null));
      R = R.concat(tokens(["diminishing_bypass", "daily_reroll", "mock_reset", "boss_reset", "endless_resurrect"], 3));
      R.push({ type: "cheat_sheet", name: pick(CHEAT_SHEETS) });
      if (Math.random() < 0.3) R = R.concat(tokens(["insight_token"], 1));
    }
    return R;
  }

  // S3 — petits lots groupés, gros lots seuls, le plus rare en dernier.
  // S4 — un groupe n'a de rareté que s'il contient un cosmétique.
  function groupRewards(rewards) {
    var currencies = [], toks = [], sheets = [], cosm = [];
    rewards.forEach(function (r) {
      if (r.type === "daric" || r.type === "xp") currencies.push(r);
      else if (r.type === "token") toks.push(r);
      else if (r.type === "cheat_sheet") sheets.push(r);
      else cosm.push(r);
    });
    var groups = [];
    if (currencies.length) groups.push({ kind: "currencies", items: currencies, rarity: null });
    if (toks.length) groups.push({ kind: "tokens", items: toks, rarity: null });
    sheets.forEach(function (s) { groups.push({ kind: "cheat_sheet", items: [s], rarity: null }); });
    var typeRank = { title: 0, frame: 1, skin: 2, avatar: 3 };
    cosm.sort(function (a, b) { return a.rarity - b.rarity || typeRank[a.type] - typeRank[b.type]; });
    cosm.forEach(function (c) { groups.push({ kind: "cosmetic", items: [c], rarity: c.rarity }); });
    return groups;
  }

  // Meilleure rareté du coffre (-1 = aucune) → couleur finale du « tell »
  function bestRarity(rewards) {
    return rewards.reduce(function (m, r) { return r.rarity !== undefined ? Math.max(m, r.rarity) : m; }, -1);
  }

  // Montée de la lumière sur les 3 taps. Parfois un palier tenu puis un saut (le moment qui fait crier).
  function tellSteps(best) {
    if (best < 0) return [-1, -1, -1];
    if (best >= 3 && Math.random() < 0.4) { var base = Math.max(0, best - 3); return [base, base, best]; }
    return [Math.max(0, best - 2), Math.max(0, best - 1), best];
  }

  window.LOOT = {
    RARITIES: RARITIES, NEUTRAL: NEUTRAL, CHESTS: CHESTS, TOKENS: TOKENS,
    simulateChest: simulateChest, groupRewards: groupRewards, bestRarity: bestRarity, tellSteps: tellSteps,
    rarityOf: function (i) { return i >= 0 ? RARITIES[i] : NEUTRAL; },
  };
})();
