// ─── CHEST SYSTEM — Data & Logic ───
import { supabase } from "../supabase.js";

// ═══ RARITY TIERS ═══
export var RARITIES = [
  {id:"common",    label:"Common",      color:"#909090", tier:0},
  {id:"uncommon",  label:"Uncommon",    color:"#3ecc78", tier:1},
  {id:"rare",      label:"Rare",        color:"#3a8ee0", tier:2},
  {id:"epic",      label:"Epic",        color:"#c060f0", tier:3},
  {id:"legend",    label:"Legendary",   color:"#ffc020", tier:4},
];

// ═══ CHEST TYPES ═══
export var CHEST_TYPES = {
  novice:     {label:"Novice",     icon:"\uD83D\uDCE6", drop:[60,25,12,3,0]},
  guerrier:   {label:"Warrior",    icon:"\u2694\uFE0F", drop:[35,35,20,8,2]},
  champion:   {label:"Champion",   icon:"\uD83C\uDFC6", drop:[15,30,35,15,5]},
  legendaire: {label:"Legendary",  icon:"\uD83D\uDC8E", drop:[0,10,25,40,25]},
};

// ═══ AVATARS ═══
export var AVATARS = {
  // Common (10)
  paysan:{name:"Peasant",rarity:"common",icon:"chess-pawn"},
  ecuyer:{name:"Squire",rarity:"common",icon:"sword-brandish"},
  apprenti:{name:"Apprentice",rarity:"common",icon:"spell-book"},
  archer:{name:"Archer",rarity:"common",icon:"pocket-bow"},
  forgeron:{name:"Blacksmith",rarity:"common",icon:"anvil"},
  aubergiste:{name:"Innkeeper",rarity:"common",icon:"beer-stein"},
  herboriste:{name:"Herbalist",rarity:"common",icon:"herbs-bundle"},
  barde:{name:"Bard",rarity:"common",icon:"lyre"},
  sentinelle:{name:"Sentinel",rarity:"common",icon:"guards"},
  marchand:{name:"Merchant",rarity:"common",icon:"trade"},
  // Uncommon (8)
  chevalier:{name:"Knight",rarity:"uncommon",icon:"mounted-knight"},
  roublard:{name:"Rogue",rarity:"uncommon",icon:"hooded-assassin"},
  sorcier:{name:"Warlock",rarity:"uncommon",icon:"wizard-staff"},
  rodeuse:{name:"Ranger",rarity:"uncommon",icon:"crossbow"},
  clerc:{name:"Cleric",rarity:"uncommon",icon:"winged-scepter"},
  alchimiste:{name:"Alchemist",rarity:"uncommon",icon:"round-bottom-flask"},
  mercenaire:{name:"Mercenary",rarity:"uncommon",icon:"battle-axe"},
  erudit:{name:"Scholar",rarity:"uncommon",icon:"bookmarklet"},
  // Rare (7)
  paladin:{name:"Paladin",rarity:"rare",icon:"templar-shield"},
  archimage:{name:"Archmage",rarity:"rare",icon:"crystal-wand"},
  assassin:{name:"Assassin",rarity:"rare",icon:"daggers"},
  druide:{name:"Druid",rarity:"rare",icon:"oak-leaf"},
  mage_guerre:{name:"War Mage",rarity:"rare",icon:"flaming-trident"},
  seigneur:{name:"Lord",rarity:"rare",icon:"throne-king"},
  valkyrie:{name:"Valkyrie",rarity:"rare",icon:"winged-sword"},
  // Epic (5)
  ch_dragon:{name:"Dragon Hunter",rarity:"epic",icon:"dragon-head"},
  necro:{name:"Necromancer",rarity:"epic",icon:"skull-staff"},
  archere:{name:"Sacred Archer",rarity:"epic",icon:"archer"},
  st_tempete:{name:"Storm Lord",rarity:"epic",icon:"lightning-storm"},
  inquisiteur:{name:"Inquisitor",rarity:"epic",icon:"crossed-swords"},
  // Legendary (2)
  pourfendeur:{name:"Slayer",rarity:"legend",icon:"broadsword"},
  champion:{name:"Champion",rarity:"legend",icon:"laurel-crown"},
  // Exclusive — pixel art commissioned avatars (V3, 2026-05-12)
  // type:"pixel" → renderAv routes to circle crop + image-rendering:pixelated.
  // src is a path under public/av/<creator>/<id>.png. AvatarMedal delegates to
  // renderAv on type==="pixel" so chest modals, inventory tiles, etc. all
  // render coherently. creator is shown as a credit line in Collection.
  warrior_queen_anais:{name:"Warrior Queen",rarity:"legend",type:"pixel",src:"/av/anais/warrior_queen.png",creator:"Anaïs"},
};

// ═══ SKINS ═══
export var SKINS = {
  argent:    {name:"Silver",          rarity:"rare",      cx:"180,180,200", hex:"#b4b4c8", dark:"#888898"},
  emeraude:  {name:"Emerald",         rarity:"rare",      cx:"46,180,100",  hex:"#2eb464", dark:"#1a8a46"},
  saphir:    {name:"Sapphire",        rarity:"rare",      cx:"58,148,220",  hex:"#3a94dc", dark:"#1a6aaa"},
  rubis:     {name:"Ruby",            rarity:"epic",      cx:"220,58,80",   hex:"#dc3a50", dark:"#c01830"},
  amethyste: {name:"Amethyst",        rarity:"epic",      cx:"160,90,220",  hex:"#a05adc", dark:"#7030aa"},
  corail:    {name:"Coral",           rarity:"epic",      cx:"220,100,50",  hex:"#dc6432", dark:"#c03018"},
  jade:      {name:"Jade",            rarity:"epic",      cx:"20,180,170",  hex:"#14b4aa", dark:"#0a8880"},
  obsidienne:{name:"Obsidian",        rarity:"legend",    cx:"176,144,240", hex:"#b090f0", dark:"#8060c0"},
  aurore:    {name:"Aurora Borealis", rarity:"legend",    cx:"64,208,192",  hex:"#40d0c0", dark:"#3a9870"},
  // ─── Shop-exclusive GLOBAL skins (Arena Shop P2, 2026-06-01) — exclusive:true → never drop
  // in chests. The whole-app theming lives in App.jsx CSS (.skin-<id> packages). hex/dark here
  // are the signature colours used for the shop swatch + chest reward card preview. ───
  frostbite:   {name:"Frostbite",   rarity:"rare",   cx:"90,180,232",  hex:"#5ab4e8", dark:"#2a6a9a", exclusive:true},
  abyssal:     {name:"Abyssal",     rarity:"rare",   cx:"30,180,160",  hex:"#1eb4a0", dark:"#0a5a50", exclusive:true},
  emberheart:  {name:"Emberheart",  rarity:"epic",   cx:"230,110,40",  hex:"#ff6020", dark:"#c01810", exclusive:true},
  cosmic_void: {name:"Cosmic Void", rarity:"epic",   cx:"150,110,240", hex:"#9a6ef0", dark:"#5030a0", exclusive:true},
  molten_gold: {name:"Molten Gold", rarity:"legend", cx:"232,176,32",  hex:"#e8b020", dark:"#8a5a10", exclusive:true},
  heraldic:    {name:"Heraldic",    rarity:"legend", cx:"74,108,210",  hex:"#5a7ce0", dark:"#c8a032", exclusive:true},
  // Signature flagship — Aldric the chronicler's identity : B&W + gold leaf, candlelit study.
  aldric_chamber:{name:"Aldric's Chamber", rarity:"legend", cx:"212,170,80", hex:"#d4af37", dark:"#3a3630", exclusive:true},
};

// ═══ FRAMES (V2 — cosmétique non-stackable, second shield outline glow) ═══
// Each frame describes how to draw an outer shield outline around the AvatarMedal :
// { color | gradient } for the stroke, glow (drop-shadow blur in px), strokeWidth,
// and optionally an anim name (CSS keyframes "frame-<anim>" defined in App.jsx CSS).
export var FRAMES = {
  // Rare (3) — solid stroke + medium glow
  gold_neon:    {name:"Gold Neon",    rarity:"rare", color:"#ffc020", glow:12, strokeWidth:3},
  emerald_glow: {name:"Emerald Glow", rarity:"rare", color:"#2eb464", glow:12, strokeWidth:3},
  ice_crystal:  {name:"Ice Crystal",  rarity:"rare", color:"#58a8e8", glow:12, strokeWidth:3},
  // Epic (3) — thicker stroke + bigger glow
  fire_forged:  {name:"Fire Forged",   rarity:"epic", color:"#ff6020", glow:16, strokeWidth:4},
  ruby_aura:    {name:"Ruby Aura",     rarity:"epic", color:"#dc3a50", glow:16, strokeWidth:4},
  amethyst_veil:{name:"Amethyst Veil", rarity:"epic", color:"#a05adc", glow:16, strokeWidth:4},
  // Legendary (2) — gradient stroke + animated pulse
  cosmic:    {name:"Cosmic",     rarity:"legend", gradient:["#ff40c0","#40c0ff","#ffc040"], glow:20, strokeWidth:4, anim:"cosmic"},
  dragonbone:{name:"Dragonbone", rarity:"legend", gradient:["#ffd060","#ff8020"],            glow:20, strokeWidth:4, anim:"dragon"},
  // ─── Shop-exclusive frames (Arena Shop P2, 2026-06-01) — exclusive:true → never drop in chests.
  // css:true → AvatarMedal renders a circular CSS overlay (.aframe-<id> in App.jsx CSS) around
  // the shield medal instead of an SVG stroke. `color` = signature colour (shop swatch / fallback). ───
  arc_pulse:    {name:"Arc Pulse",    rarity:"rare",   css:true, color:"#40d0ff", exclusive:true},
  gilded_halo:  {name:"Gilded Halo",  rarity:"epic",   css:true, color:"#f0c850", exclusive:true},
  orbit:        {name:"Orbit",        rarity:"epic",   css:true, color:"#f0c850", exclusive:true},
  tempest:      {name:"Tempest",      rarity:"epic",   css:true, color:"#40a0ff", exclusive:true},
  inferno_ring: {name:"Inferno Ring", rarity:"legend", css:true, color:"#ff5000", exclusive:true},
  prismatic:    {name:"Prismatic",    rarity:"legend", css:true, color:"#d060e0", exclusive:true},
};

// ═══ TITLES (V2 — texte affiché sous le nom partout dans l'app) ═══
export var TITLES = {
  // Rare (4)
  apprentice:    {name:"The Apprentice",     rarity:"rare",  color:"#3a8ee0"},
  tavern_regular:{name:"Tavern Regular",     rarity:"rare",  color:"#3a8ee0"},
  squire:        {name:"The Squire",         rarity:"rare",  color:"#3a8ee0"},
  scribe:        {name:"The Scribe",         rarity:"rare",  color:"#3a8ee0"},
  // Epic (5)
  wordsmith:     {name:"The Wordsmith",      rarity:"epic",  color:"#c060f0"},
  tense_sage:    {name:"Tense Sage",         rarity:"epic",  color:"#c060f0"},
  drillmaster:   {name:"Drillmaster",        rarity:"epic",  color:"#c060f0"},
  word_forger:   {name:"Word Forger",        rarity:"epic",  color:"#c060f0"},
  arena_veteran: {name:"Arena Veteran",      rarity:"epic",  color:"#c060f0"},
  // Legendary (3)
  dragon_slayer: {name:"Dragon Slayer",      rarity:"legend",color:"#ffc020"},
  arena_conqueror:{name:"Arena Conqueror",   rarity:"legend",color:"#ffc020"},
  legend:        {name:"Legend",             rarity:"legend",color:"#ffc020"},
  // Exclusive (never drops via chests — granted via SQL only).
  aldric_chosen: {name:"Aldric's Chosen",    rarity:"legend",color:"#e8d4a8",exclusive:true},
  // ─── Shop-exclusive titles (Arena Shop P2, 2026-06-01) — exclusive:true → never drop in chests ───
  marchand_reliques: {name:"Relic Merchant",  rarity:"rare", color:"#3a8ee0", exclusive:true},
  arpenteur_comptoir:{name:"Coin Warden",     rarity:"rare", color:"#3a8ee0", exclusive:true},
  tisseur_darics:    {name:"Daric Weaver",    rarity:"epic", color:"#c060f0", exclusive:true},
  oeil_aldric:       {name:"Aldric's Eye",    rarity:"epic", color:"#c9a23a", exclusive:true},
  // Milestone title (Arena Shop P2.5) — granted at 10,000 cumulative Darics spent. Not sold.
  bourse_inepuisable:{name:"Bottomless Purse",rarity:"legend", color:"#e8c45a", exclusive:true},
};

// ═══ TOKENS (V2 — tactiques stackables, nouvelle table player_tokens) ═══
// premium = drop seulement sur coffre Légendaire (et conversions)
// meta = consommable spécial (Insight Token, généré rare sur Légendaire)
export var TOKEN_TYPES = {
  diminishing_bypass:{name:"Bypass Token",      icon:"🔓", cap:5, premium:false, desc:"Skip diminishing returns on next session"},
  streak_shield:     {name:"Streak Shield",     icon:"🛡️",  cap:3, premium:false, desc:"Auto-protects streak on missed day"},
  daily_reroll:      {name:"Daily Reroll",      icon:"🎲", cap:1, premium:false, desc:"Re-roll today's mission"},
  mock_reset:        {name:"Mock Reset",        icon:"📜", cap:2, premium:true,  desc:"Bypass 24h cooldown on Mock Test"},
  boss_reset:        {name:"Boss Reset",        icon:"🐲", cap:1, premium:true,  desc:"Bypass 24h cooldown on Boss Test"},
  endless_resurrect: {name:"Endless Resurrect", icon:"💎", cap:2, premium:true,  desc:"Continue Endless after 1 fatal mistake"},
  insight_token:     {name:"Insight Token",     icon:"🔮", cap:3, premium:true,  desc:"Generates a personalized weakness insight (consume to reveal)"},
  // ─── XP Boosts (Arena Shop P2.5, 2026-06-02) — boost:true. Shop-only (never in chest/conversion
  // pools). Buying = grant_token ; using = arm a boost flag in students.boosts (XP pipeline hooks). ───
  module_booster:    {name:"Module Booster",     icon:"🚀", cap:3, premium:false, boost:true, desc:"+50% XP on your next session of a chosen module"},
  mock_multiplier:   {name:"Mock Multiplier",    icon:"📈", cap:2, premium:false, boost:true, desc:"×1.5 XP on your next Mock Test"},
  daily_doubler:     {name:"Daily Doubler",      icon:"⏫", cap:2, premium:false, boost:true, desc:"×2 XP on all modules for 24h (max 2 bought/week)"},
};

// ═══ CHEAT SHEETS (V2 — méta codex, garantie sur Légendaire) ═══
// V1 stub : 3 fiches drafts, à étoffer plus tard. Render = parchemin lisible Profile→Collection.
// blocks = même format que les grimoires (paragraph/heading/rule/example/trap/table/list)
export var CHEAT_SHEETS = {
  part5_conjunctions:{
    name:"Part 5 — Conjunction Traps",
    rarity:"epic",
    icon:"📜",
    blocks:[
      {type:"paragraph",text:"Les Part 5 distinguent 3 familles que les distracteurs confondent volontairement."},
      {type:"heading",text:"3 familles"},
      {type:"rule",label:"Coordinating",formula:"and / but / or / so — relient 2 propositions de même nature"},
      {type:"rule",label:"Subordinating",formula:"because / although / while / since — introduit une subordonnée"},
      {type:"rule",label:"Conjunctive adverb",formula:"however / therefore / moreover — modifie une proposition mais n'est PAS une conjonction (besoin de ; ou .)"},
      {type:"trap",text:"“However it was raining, we went out” → FAUX. Il faut “Although it was raining, we went out”. “However” demande une ponctuation forte."},
    ],
  },
  part3_negation:{
    name:"Part 3 — Negation Patterns",
    rarity:"epic",
    icon:"🎯",
    blocks:[
      {type:"paragraph",text:"40% des erreurs Part 3 viennent de négations mal entendues. Les locuteurs natifs les contractent souvent."},
      {type:"list",items:[
        "“hasn't” / “haven't” → son court [@znt] / [hav@nt]",
        "“won't” / “wouldn't” → [woUnt] / [wUd@nt]",
        "“doesn't” / “didn't” → [d@z@nt] / [did@nt]",
      ]},
      {type:"trap",text:"Si tu n'es pas sûr d'avoir entendu une négation, écoute la 2e fois en focus sur la consonne finale du verbe auxiliaire."},
    ],
  },
  reading_skim_scan:{
    name:"Part 7 — Skim & Scan",
    rarity:"rare",
    icon:"🔍",
    blocks:[
      {type:"paragraph",text:"Tu as ~75 min pour 54 questions Reading. Sur Part 7 ne JAMAIS lire mot à mot."},
      {type:"heading",text:"Méthode 2-passes"},
      {type:"rule",label:"Pass 1 — Skim",formula:"Lis intro + 1ère phrase de chaque paragraphe + conclusion. 30s max par passage."},
      {type:"rule",label:"Pass 2 — Scan",formula:"Lis la question, identifie le mot-clé, scanne le passage pour le trouver, lis 2 lignes autour."},
      {type:"example",en:"Q: According to the email, when will the meeting take place?",fr:"→ mot-clé = “meeting”, scanne pour la date près de ce mot."},
    ],
  },

  // V2.1 — 5 cheat sheets inédites (angles non couverts par STRATEGIES)
  part5_word_pairs:{
    name:"Part 5 — Pièges de paires de mots",
    rarity:"rare",
    icon:"⚖️",
    blocks:[
      {type:"paragraph",text:"Le TOEIC adore les mots qui se ressemblent à 1-2 lettres près. Les distracteurs s'appuient dessus en permanence en Part 5."},
      {type:"heading",text:"Les 5 paires les plus testées"},
      {type:"rule",label:"affect / effect",formula:"affect = verbe (influer sur). effect = nom (l'effet, le résultat)"},
      {type:"example",en:"The strike will affect production. The effect on revenue was clear.",fr:"affect = verbe d'action ; effect = nom abstrait."},
      {type:"rule",label:"principal / principle",formula:"principal = adjectif (principal, le plus important) OU nom (le directeur). principle = nom uniquement (un principe, une règle)."},
      {type:"rule",label:"lay / lie",formula:"lay = poser quelque chose (verbe transitif). lie = être allongé (intransitif). lay-laid-laid vs lie-lay-lain."},
      {type:"trap",text:"Past tense de lie (être allongé) = lay. Donc \"He lay on the couch yesterday\" = il était allongé. NE PAS confondre avec \"He laid the book down\" = il a posé."},
      {type:"rule",label:"who / whom",formula:"who = sujet (who called?). whom = objet (to whom did you speak?). Test : remplace par he/him. He → who. Him → whom."},
      {type:"rule",label:"its / it's",formula:"its = possessif (de lui/elle, sans apostrophe). it's = it is OU it has."},
      {type:"heading",text:"Bonus à connaître"},
      {type:"list",items:[
        "complement (compléter) / compliment (féliciter)",
        "stationary (immobile) / stationery (papeterie)",
        "then (alors, ensuite) / than (que, comparaison)",
        "accept (accepter) / except (sauf)",
        "loose (lâche, large) / lose (perdre)",
      ]},
    ],
  },

  listening_reductions:{
    name:"Listening — Liaisons & Réductions",
    rarity:"rare",
    icon:"🔉",
    blocks:[
      {type:"paragraph",text:"Les locuteurs natifs avalent les sons. Ce que tu entends en TOEIC n'est presque jamais articulé mot par mot. Apprendre les contractions invisibles, c'est doubler ta compréhension."},
      {type:"heading",text:"Les 6 patterns à reconnaître"},
      {type:"rule",label:"want to → wanna",formula:"\"I wanna leave\" = I want to leave. JAMAIS écrit en TOEIC, mais entendu Part 1-4."},
      {type:"rule",label:"going to → gonna",formula:"\"What're you gonna do?\" = What are you going to do."},
      {type:"rule",label:"got to → gotta",formula:"\"I gotta go\" = I have got to go = I need to go."},
      {type:"rule",label:"did you → didja",formula:"\"Didja see it?\" = Did you see it. Le \"d\" se mouille en \"j\"."},
      {type:"rule",label:"would have → would've",formula:"Sonne comme \"would of\" → c'est un piège. Ne JAMAIS écrire \"would of\". C'est toujours \"have\"."},
      {type:"rule",label:"liaisons consonne+voyelle",formula:"\"an apple\" → \"a-napple\". \"in an hour\" → \"i-nan-our\". Le \"r\" final lié au mot suivant en accent américain."},
      {type:"trap",text:"En Part 2, les distracteurs reproduisent souvent un mot que tu pensais avoir entendu (ex: \"could of\" alors que c'était \"could've\" = could have). Si une option semble grammaticalement étrange, c'est probablement un piège phonétique."},
      {type:"heading",text:"Méthode d'entraînement"},
      {type:"paragraph",text:"Écoute 1 podcast natif (TED, BBC) 10 min/jour SANS sous-titres. Note les mots que tu n'identifies pas, ré-écoute en lisant la transcription. Au bout de 2 semaines, ton oreille débloque ces patterns."},
    ],
  },

  part5_modals:{
    name:"Part 5 — Modaux : nuances testées",
    rarity:"epic",
    icon:"🎲",
    blocks:[
      {type:"paragraph",text:"Les modaux (must, should, may, can, will…) sont parmi les plus piégeux du TOEIC : 4 options qui semblent toutes \"sonner juste\". La nuance fait la différence."},
      {type:"heading",text:"Les 5 nuances clés"},
      {type:"rule",label:"must vs have to",formula:"must = obligation interne (je décide). have to = obligation externe (le règlement le dit). Au passé, \"must\" disparaît : \"had to\" uniquement."},
      {type:"example",en:"I must finish this report (= I want to). I have to finish this report (= my boss said so).",fr:"Subtil mais testé."},
      {type:"rule",label:"should vs ought to",formula:"Quasi-synonymes. \"ought to\" plus formel et plus rare en TOEIC. Si tu hésites entre les deux, va sur \"should\" — la fréquence parle pour lui."},
      {type:"rule",label:"may vs might",formula:"may = probabilité 50%. might = probabilité 30%. En TOEIC moderne, presque interchangeables. Ancien usage : may = permission (\"May I leave?\"), might jamais."},
      {type:"rule",label:"can vs be able to",formula:"can = présent + futur immédiat. be able to = passé spécifique d'une réussite ponctuelle. \"I could swim as a child\" (capacité générale) vs \"I was able to swim across the lake yesterday\" (réussite ponctuelle)."},
      {type:"rule",label:"would vs used to",formula:"used to = état OU action répétée passée. would = action répétée passée UNIQUEMENT (jamais état). \"I used to live in Paris\" ✓. \"I would live in Paris\" ✗ (état, pas action)."},
      {type:"trap",text:"Après \"must have / should have / could have\", on a un PARTICIPE PASSÉ, pas un infinitif. \"He must have left\" ✓. \"He must have leave\" ✗. C'est un piège classique testé en Part 5."},
      {type:"heading",text:"Modal perfect = déduction au passé"},
      {type:"list",items:[
        "must have + V3 = certitude au passé (\"He must have forgotten\" = il a forcément oublié)",
        "should have + V3 = regret/reproche (\"You should have called\" = tu aurais dû appeler)",
        "could have + V3 = possibilité non réalisée (\"We could have won\" = on aurait pu gagner)",
        "may/might have + V3 = supposition au passé (\"She may have left\" = elle est peut-être partie)",
      ]},
    ],
  },

  business_false_cognates:{
    name:"Faux-amis du business",
    rarity:"epic",
    icon:"🪤",
    blocks:[
      {type:"paragraph",text:"Spécifique aux francophones : le TOEIC pose des pièges sur des mots qui RESSEMBLENT à du français mais ont un sens DIFFÉRENT. Ariba ou Kamel ne tomberont pas dans ces pièges, mais 60% des étudiants oui."},
      {type:"heading",text:"Le top 10 en contexte business"},
      {type:"table",headers:["Mot anglais","Sens piégeux (FR)","Vrai sens (EN)"],rows:[
        ["actually","actuellement","en fait, en réalité"],
        ["eventually","éventuellement","finalement, à la fin"],
        ["library","librairie","bibliothèque"],
        ["formation","formation","création, formation (géologique)"],
        ["sympathetic","sympathique","compatissant"],
        ["large","large (de taille)","grand (de taille)"],
        ["assist","assister à","aider, prêter assistance"],
        ["pretend","prétendre","faire semblant"],
        ["delay","délai","retard"],
        ["agenda","agenda (carnet)","ordre du jour (réunion)"],
      ]},
      {type:"heading",text:"Pièges fréquents en Part 5/7"},
      {type:"trap",text:"\"The meeting was eventually postponed\" = la réunion a FINALEMENT été reportée (PAS \"éventuellement\"). Si tu coches \"finally\" comme synonyme, tu marques."},
      {type:"trap",text:"\"Please find the agenda attached\" = trouvez ci-joint l'ORDRE DU JOUR (PAS un agenda papier)."},
      {type:"trap",text:"\"He pretends to know everything\" = il FAIT SEMBLANT de tout savoir (PAS \"il prétend savoir\")."},
      {type:"heading",text:"Les bons réflexes"},
      {type:"list",items:[
        "Quand un mot ressemble trop au français, vérifie 2x dans le contexte",
        "Le contexte business privilégie souvent le sens \"métier\" (delay = retard, pas délai)",
        "En cas de doute Part 7, élimine la traduction littérale française — c'est presque toujours un piège",
      ]},
    ],
  },

  part7_inference:{
    name:"Part 7 — Lecture entre les lignes",
    rarity:"legend",
    icon:"🔮",
    blocks:[
      {type:"paragraph",text:"Les questions \"What does the writer imply?\", \"What can be inferred?\", \"What is suggested?\" sont parmi les plus discriminantes du TOEIC. La bonne réponse n'est JAMAIS écrite explicitement dans le texte. C'est le niveau B2+ qui se joue ici."},
      {type:"heading",text:"Les 4 signaux d'inférence"},
      {type:"rule",label:"Modal de probabilité dans l'option",formula:"Les bonnes réponses contiennent souvent : likely, may, might, suggests, indicates, probably. Une option avec \"definitely\" ou \"clearly\" est souvent FAUSSE — l'inférence n'est jamais certaine."},
      {type:"rule",label:"Reformulation, pas citation",formula:"Si l'option reprend les mots EXACTS du texte, c'est probablement un distracteur. La bonne réponse PARAPHRASE."},
      {type:"rule",label:"Cause cachée, conséquence visible",formula:"Le texte montre B (un fait). La question demande pourquoi. Cherche A (cause non dite) qui rendrait B logique."},
      {type:"rule",label:"Tone & register",formula:"Un email \"Just checking in...\" implique inquiétude polie. Un email \"As per our previous correspondence...\" implique frustration formelle. Le ton dit plus que les mots."},
      {type:"heading",text:"Méthode 3-pas pour les inférences"},
      {type:"list",items:[
        "1. Identifie ce qui EST dit littéralement dans le passage relevant",
        "2. Demande-toi : qu'est-ce que cela suppose comme contexte/intention ?",
        "3. Compare avec les options : laquelle est cohérente AVEC le texte SANS le copier ?",
      ]},
      {type:"example",en:"Email: \"I appreciate your patience as we work through this issue. Updates will follow soon.\"",fr:"Q: What does the writer imply? → \"There has been a delay\" (l'auteur n'a JAMAIS écrit \"delay\", mais \"patience\" + \"work through\" + \"updates soon\" l'impliquent toutes ensemble)."},
      {type:"trap",text:"Méfie-toi des options \"trop spécifiques\" en inférence. Si une option ajoute des détails qui n'apparaissent NULLE PART (chiffres, noms, dates précises), c'est faux. L'inférence reste générale."},
      {type:"heading",text:"Mots-clés à entourer mentalement"},
      {type:"paragraph",text:"unfortunately, however, although, despite, while, on the other hand, surprisingly, apparently — ils signalent un sous-texte que la question d'inférence va exploiter."},
    ],
  },
};

// ═══ SHOP CATALOG (Arena Shop P2, 2026-06-01) ═══
// Hardcoded (not Supabase) — 1 source of truth: visual lives in the cosmetic maps
// above, price lives here. Tuning a price = redeploy (cheap on Vercel).
//   item_id  : stable shop id (used in shop_purchases + marks_log source_detail)
//   cat      : skin | frame | title | cheat_sheet | token  (= player_rewards.reward_type, or token)
//   ref      : id within SKINS/FRAMES/TITLES/CHEAT_SHEETS, or token_type in TOKEN_TYPES
//   price    : in Darics
//   rarity   : passed to spend_marks → stored on the player_rewards row (cosmetics)
//   one_shot : true for cosmetics/cheat sheets (anti-rebuy via player_rewards), false for tokens (cap-aware)
// XP Boosts + Anaïs avatars + "Bourse Inépuisable" milestone title = deferred (P2.5).
export var SHOP_CATALOG = [
  // Skins exclusifs (global app themes)
  {item_id:"sk_frostbite", cat:"skin",  ref:"frostbite",   price:1400, rarity:"rare",   one_shot:true},
  {item_id:"sk_abyssal",   cat:"skin",  ref:"abyssal",     price:1400, rarity:"rare",   one_shot:true},
  {item_id:"sk_emberheart",cat:"skin",  ref:"emberheart",  price:2800, rarity:"epic",   one_shot:true},
  {item_id:"sk_cosmic",    cat:"skin",  ref:"cosmic_void", price:2800, rarity:"epic",   one_shot:true},
  {item_id:"sk_molten",    cat:"skin",  ref:"molten_gold", price:5800, rarity:"legend", one_shot:true},
  {item_id:"sk_heraldic",  cat:"skin",  ref:"heraldic",    price:5800, rarity:"legend", one_shot:true},
  {item_id:"sk_aldric",    cat:"skin",  ref:"aldric_chamber",price:5800,rarity:"legend", one_shot:true},
  // Frames exclusifs (animated avatar rings)
  {item_id:"fr_arc",     cat:"frame", ref:"arc_pulse",    price:400,  rarity:"rare",   one_shot:true},
  {item_id:"fr_halo",    cat:"frame", ref:"gilded_halo",  price:750,  rarity:"epic",   one_shot:true},
  {item_id:"fr_orbit",   cat:"frame", ref:"orbit",        price:750,  rarity:"epic",   one_shot:true},
  {item_id:"fr_tempest", cat:"frame", ref:"tempest",      price:750,  rarity:"epic",   one_shot:true},
  {item_id:"fr_inferno", cat:"frame", ref:"inferno_ring", price:1400, rarity:"legend", one_shot:true},
  {item_id:"fr_prism",   cat:"frame", ref:"prismatic",    price:1400, rarity:"legend", one_shot:true},
  // Titres
  {item_id:"ti_marchand", cat:"title", ref:"marchand_reliques", price:200, rarity:"rare", one_shot:true},
  {item_id:"ti_arpenteur",cat:"title", ref:"arpenteur_comptoir",price:250, rarity:"rare", one_shot:true},
  {item_id:"ti_tisseur",  cat:"title", ref:"tisseur_darics",    price:350, rarity:"epic", one_shot:true},
  {item_id:"ti_oeil",     cat:"title", ref:"oeil_aldric",       price:500, rarity:"epic", one_shot:true},
  // Tokens (répétables — cap géré server-side via TOKEN_TYPES[ref].cap)
  {item_id:"tok_reroll",  cat:"token", ref:"daily_reroll",       price:60,  one_shot:false},
  {item_id:"tok_bypass",  cat:"token", ref:"diminishing_bypass", price:90,  one_shot:false},
  {item_id:"tok_shield",  cat:"token", ref:"streak_shield",      price:120, one_shot:false},
  {item_id:"tok_mock",    cat:"token", ref:"mock_reset",         price:150, one_shot:false},
  {item_id:"tok_endless", cat:"token", ref:"endless_resurrect",  price:150, one_shot:false},
  {item_id:"tok_boss",    cat:"token", ref:"boss_reset",         price:220, one_shot:false},
  {item_id:"tok_insight", cat:"token", ref:"insight_token",      price:300, one_shot:false},
  // XP Boosts — cat:"token" (granted via grant_token), group:"boost" (own Shop section)
  {item_id:"boost_module", cat:"token", group:"boost", ref:"module_booster",  price:120, one_shot:false},
  {item_id:"boost_mock",   cat:"token", group:"boost", ref:"mock_multiplier", price:220, one_shot:false},
  {item_id:"boost_daily",  cat:"token", group:"boost", ref:"daily_doubler",   price:400, one_shot:false},
].concat(
  // Cheat sheets — generated from CHEAT_SHEETS so the catalog never drifts from content.
  // Price by rarity. These are NOT exclusive (also droppable on Légendaire chests).
  Object.keys(CHEAT_SHEETS).map(function(csId){
    var cs=CHEAT_SHEETS[csId];
    var price=({rare:450,epic:700,legend:900})[cs.rarity]||450;
    return {item_id:"cs_"+csId, cat:"cheat_sheet", ref:csId, price:price, rarity:cs.rarity, one_shot:true};
  })
);

// ═══ DROP TABLES SEGMENTÉES (V2 — 1 coffre = N items) ═══
// Format slot : {kind, ...params}
//   kind="xp"        : {min, max} → roll XP dans la fourchette
//   kind="cosmetic"  : {oneOf:["frame","title"|"avatar"|"skin"], minRarity?} → pick UN slot cosmetic random non-owned
//   kind="token"     : {pool, count} → tire `count` tokens du pool, respecte cap (skip si plein)
//   kind="cheat_sheet":{chance} → 0..1, pick un sheet non-owned
//   kind="duo"       : {types:[...]} → ouvre N slots cosmetic en série (utilisé Légendaire : skin + frame/title)
export var DROP_TABLES = {
  // Arena Shop P1 (2026-05-29) — Daric slot is the first reveal of every chest.
  // GUARANTEED, never a fallback : every chest opening accrues Darics, which is
  // what unlocks Shop access from day 1 instead of waiting on duplicate farming.
  // Amounts ladder 30/90/250/700 — see project_shop_design.md for the calibration.
  novice:[
    {kind:"daric",amount:30},
    {kind:"xp",min:50,max:150},
    {kind:"token",pool:["diminishing_bypass","streak_shield","daily_reroll"],count:1},
  ],
  guerrier:[
    {kind:"daric",amount:90},
    {kind:"xp",min:200,max:400},
    {kind:"cosmetic",oneOf:["frame","title"]},
    {kind:"token",pool:["diminishing_bypass","streak_shield","daily_reroll"],count:2},
  ],
  champion:[
    {kind:"daric",amount:250},
    {kind:"xp",min:500,max:800},
    // V2 spec : Champion drop la 4 cosmetic types (avatar/skin/frame/title) min rare.
    {kind:"cosmetic",oneOf:["avatar","skin","frame","title"],minRarity:"rare"},
    // V2 spec : streak_shield reservé Novice/Guerrier, retiré du pool Champion.
    {kind:"token",pool:["diminishing_bypass","daily_reroll","mock_reset","endless_resurrect"],count:3},
  ],
  legendaire:[
    {kind:"daric",amount:700},
    {kind:"xp",min:1000,max:1500},
    // V2 spec : Légendaire drop avatar OR skin legend rarity (avatar inclus, conforme matrice)
    {kind:"cosmetic",oneOf:["avatar","skin"],minRarity:"legend"},
    {kind:"cosmetic",oneOf:["frame","title"],minRarity:"epic"},
    // V2 spec : Légendaire inclut Bypass + Daily Reroll en plus des premium tokens.
    {kind:"token",pool:["diminishing_bypass","daily_reroll","mock_reset","boss_reset","endless_resurrect"],count:3},
    {kind:"cheat_sheet",chance:1.0},
    // V2 spec : Insight Token sort du parking. Drop rare (~30%) sur Légendaire seulement.
    {kind:"token",pool:["insight_token"],count:1,chance:0.3},
  ],
};

// Helpers internes pour pickRewards
function _rarityTier(rid){var i=0;for(;i<RARITIES.length;i++){if(RARITIES[i].id===rid)return i;}return 0;}
function _filterByMinRarity(map,minRarity){
  // V2 — items flagged `exclusive:true` are NEVER part of any drop pool ; they
  // are granted via SQL only (Teacher reward, special events, etc).
  var keys=Object.keys(map).filter(function(k){return!map[k].exclusive;});
  if(!minRarity)return keys;
  var minTier=_rarityTier(minRarity);
  return keys.filter(function(k){return _rarityTier(map[k].rarity)>=minTier;});
}
function _pickFromPool(map,owned,minRarity){
  var keys=_filterByMinRarity(map,minRarity).filter(function(k){return owned.indexOf(k)===-1;});
  if(keys.length===0)return null;
  return keys[Math.floor(Math.random()*keys.length)];
}

// ═══ pickRewards (V2 parallèle — utilisé par étape 3 quand ChestOpenModal sera refait) ═══
// owned = {avatars:[], skins:[], frames:[], titles:[], cheatSheets:[], tokens:{type:qty,...}}
// returns: array of {type, id?, xp?, rarity?, tokenType?} — UN item par slot du DROP_TABLE
// Si un slot ne peut pas drop (tout owned, cap atteint, etc.) → fallback XP gem proportionnel.
export function pickRewards(chestType, owned){
  var table=DROP_TABLES[chestType];
  if(!table){console.warn("[CHEST] pickRewards: unknown chestType",chestType);return[];}
  var rewards=[];
  var ownedAvatars=owned.avatars||[], ownedSkins=owned.skins||[];
  var ownedFrames=owned.frames||[], ownedTitles=owned.titles||[];
  var ownedSheets=owned.cheatSheets||[], tokens=owned.tokens||{};

  table.forEach(function(slot){
    if(slot.kind==="daric"){
      // Arena Shop P1 — flat amount per slot, no RNG. The grant itself happens
      // in doOpenChest via grantMarks() after openChestFromPending sums totalDarics.
      rewards.push({type:"daric",amount:slot.amount||0});
      return;
    }
    if(slot.kind==="xp"){
      var xp=slot.min+Math.floor(Math.random()*(slot.max-slot.min+1));
      rewards.push({type:"xp",id:null,xp:xp});
      return;
    }
    if(slot.kind==="cosmetic"){
      // pick random sub-type from oneOf, then random non-owned item from that map
      var subType=slot.oneOf[Math.floor(Math.random()*slot.oneOf.length)];
      var map=null, ownedList=null;
      if(subType==="avatar"){map=AVATARS;ownedList=ownedAvatars;}
      else if(subType==="skin"){map=SKINS;ownedList=ownedSkins;}
      else if(subType==="frame"){map=FRAMES;ownedList=ownedFrames;}
      else if(subType==="title"){map=TITLES;ownedList=ownedTitles;}
      if(!map){console.warn("[CHEST] unknown cosmetic subType",subType);return;}
      var picked=_pickFromPool(map,ownedList,slot.minRarity);
      if(picked){
        rewards.push({type:subType,id:picked,rarity:map[picked].rarity});
      }else{
        // V2 step 5 — all owned : drop a duplicate (convertible later in Profile→Conversions)
        // instead of XP fallback. Anti-frustration : the user advanced enough to complete the
        // collection gets a usable currency rather than dead XP.
        var allKeys=_filterByMinRarity(map,slot.minRarity);
        if(allKeys.length>0){
          var dupId=allKeys[Math.floor(Math.random()*allKeys.length)];
          rewards.push({type:subType,id:dupId,rarity:map[dupId].rarity,duplicate:true});
        }else{
          // pool empty (shouldn't happen with current constants) — fallback XP
          var fbXp=slot.minRarity==="legend"?500:slot.minRarity==="epic"?250:100;
          rewards.push({type:"xp",id:null,xp:fbXp,fallback:"empty_pool"});
        }
      }
      return;
    }
    if(slot.kind==="token"){
      // V2 — optional chance for rare tokens (Insight Token on Legendary). Roll once
      // up-front and skip the whole slot if it fails — no XP fallback for skipped chance.
      if(slot.chance!==undefined&&Math.random()>slot.chance)return;
      // tire `count` tokens du pool, respecte cap. Si tout cap atteint → fallback XP.
      var pool=slot.pool.filter(function(tt){
        var qty=tokens[tt]||0;
        var cap=TOKEN_TYPES[tt]&&TOKEN_TYPES[tt].cap||1;
        return qty<cap;
      });
      var picks=Math.min(slot.count,pool.length);
      // simulate qty growth as we pick to avoid same-token over-cap in same chest
      var simQty=Object.assign({},tokens);
      for(var k=0;k<picks;k++){
        var available=pool.filter(function(tt){
          var q=simQty[tt]||0;
          var cap=TOKEN_TYPES[tt]&&TOKEN_TYPES[tt].cap||1;
          return q<cap;
        });
        if(available.length===0)break;
        var t=available[Math.floor(Math.random()*available.length)];
        rewards.push({type:"token",id:t,tokenType:t});
        simQty[t]=(simQty[t]||0)+1;
      }
      // si on n'a pas pu tirer assez de tokens → completer en XP
      var missing=slot.count-Math.min(picks,slot.count);
      if(missing>0){
        rewards.push({type:"xp",id:null,xp:50*missing,fallback:"tokens_capped"});
      }
      return;
    }
    if(slot.kind==="cheat_sheet"){
      var chance=slot.chance||0;
      if(Math.random()>chance)return; // skip si raté
      var picked2=_pickFromPool(CHEAT_SHEETS,ownedSheets,null);
      if(picked2){
        rewards.push({type:"cheat_sheet",id:picked2,rarity:CHEAT_SHEETS[picked2].rarity});
      }else if(slot.chance>=1){
        // garantie + tout owned → fallback XP premium
        rewards.push({type:"xp",id:null,xp:300,fallback:"sheets_owned"});
      }
      return;
    }
    console.warn("[CHEST] unknown slot kind",slot.kind);
  });

  return rewards;
}

// ═══ REWARD POOLS (by rarity tier) ═══
var REWARD_POOL = [
  {xp:50,  avatars:["paysan","ecuyer","apprenti","archer","forgeron","aubergiste","herboriste","barde","sentinelle","marchand"], skins:[]},
  {xp:75,  avatars:["chevalier","roublard","sorcier","rodeuse","clerc","alchimiste","mercenaire","erudit"], skins:[]},
  {xp:125, avatars:["paladin","archimage","assassin","druide","mage_guerre","seigneur","valkyrie"], skins:["argent","emeraude","saphir"]},
  {xp:150, avatars:["ch_dragon","necro","archere","st_tempete","inquisiteur"], skins:["rubis","amethyste","corail","jade"]},
  {xp:200, avatars:["pourfendeur","champion"], skins:["obsidienne","aurore"]},
];

// ═══ TRIGGERS ═══
export var UNIQUE_TRIGGERS = {
  xp_1k:    {chest:"novice",    check:function(u){return u.xp>=1000;}},
  xp_3k:    {chest:"novice",    check:function(u){return u.xp>=3000;}},
  xp_5k:    {chest:"novice",    check:function(u){return u.xp>=5000;}},
  xp_10k:   {chest:"guerrier",  check:function(u){return u.xp>=10000;}},
  xp_20k:   {chest:"guerrier",  check:function(u){return u.xp>=20000;}},
  xp_30k:   {chest:"champion",  check:function(u){return u.xp>=30000;}},
  xp_50k:   {chest:"champion",  check:function(u){return u.xp>=50000;}},
  streak_7:  {chest:"novice",   check:function(u){return u.streak>=7;}},
  streak_30: {chest:"guerrier",  check:function(u){return u.streak>=30;}},
  streak_100:{chest:"champion",  check:function(u){return u.streak>=100;}},
  mock_1:   {chest:"champion",  check:function(u){return u.mockResults&&u.mockResults.mock1;}},
  mock_2:   {chest:"champion",  check:function(u){return u.mockResults&&u.mockResults.mock2;}},
  mock_3:   {chest:"champion",  check:function(u){return u.mockResults&&u.mockResults.mock3;}},
  boss_test:{chest:"legendaire", check:function(u){return u.mockResults&&u.mockResults.boss;}},
};
// league_up_{id} and ach_legendary_{id} are dynamic — handled separately

// Achievements that grant a Novice chest when unlocked (Discovery tier — first-time exploration)
export var NOVICE_ACHIEVEMENTS = ["crypt_first","chrono_first","forge_first","weaver_first","gauntlet_explorer"];

// Achievements that grant a Guerrier chest when unlocked
// (Epic tier — perfect runs + sustained mastery proof)
export var EPIC_ACHIEVEMENTS = ["crypt_perfect","chrono_perfect","forge_perfect","weaver_perfect","irregular_master","tense_sage","passive_alchemist","relative_weaver"];

// Achievements that grant a Légendaire chest when unlocked
export var LEGENDARY_ACHIEVEMENTS = ["boss_complete","boss_800","legend_league","toeic_master","gauntlet_champion","gauntlet_grinder","gauntlet_scholar"];

// ═══ ROLL LOGIC ═══
export function rollRarity(chestType, pityCount){
  var rates=CHEST_TYPES[chestType].drop;
  // Pity: ≥10 chests without Rare+ → force Rare minimum
  if(pityCount>=10){
    var rareRates=[0,0,rates[2]||1,rates[3]||1,rates[4]||1];
    var total=rareRates.reduce(function(a,b){return a+b;},0);
    if(total===0)return 2; // fallback rare
    var roll=Math.random()*total;
    var cum=0;
    for(var i=0;i<rareRates.length;i++){cum+=rareRates[i];if(roll<cum)return i;}
    return 2;
  }
  var roll2=Math.random()*100;
  var cum2=0;
  for(var j=0;j<rates.length;j++){cum2+=rates[j];if(roll2<cum2)return j;}
  return 0;
}

export function pickReward(rarityTier, ownedAvatars, ownedSkins){
  var pool=REWARD_POOL[rarityTier];
  var available=[];
  pool.avatars.forEach(function(a){if(ownedAvatars.indexOf(a)===-1)available.push({type:"avatar",id:a});});
  pool.skins.forEach(function(s){if(ownedSkins.indexOf(s)===-1)available.push({type:"skin",id:s});});

  // All owned → XP gem
  if(available.length===0)return{type:"xp",id:null,xp:pool.xp};

  // 1/3 chance XP, 2/3 cosmetic (spec: XP less frequent)
  var withXp=[{type:"xp",id:null,xp:pool.xp}];
  available.forEach(function(a){withXp.push(a);withXp.push(a);}); // cosmetics appear twice
  var pick=withXp[Math.floor(Math.random()*withXp.length)];
  if(!pick.xp)pick.xp=0;
  return pick;
}

// ═══ SUPABASE HELPERS ═══

// Check if a unique trigger has already been granted (log OR pending)
export async function hasUniqueTrigger(userName, classCode, triggerSource){
  try{
    var res=await supabase.from("chest_log").select("id").ilike("user_name",userName).eq("class_code",classCode).eq("trigger_source",triggerSource).limit(1);
    if(res.data&&res.data.length>0)return true;
    // Also check pending (not yet opened) to prevent double-grant
    var pen=await supabase.from("pending_chests").select("id").ilike("user_name",userName).eq("class_code",classCode).eq("trigger_source",triggerSource).limit(1);
    return pen.data&&pen.data.length>0;
  }catch(e){console.error("[CHEST] hasUniqueTrigger error:",e);return true;} // fail-safe: assume granted
}

// Check if a weekly trigger is on cooldown (7 days) — checks log AND pending
export async function isWeeklyCooldown(userName, classCode, triggerSource){
  try{
    var cutoff=new Date();cutoff.setDate(cutoff.getDate()-7);
    var res=await supabase.from("chest_log").select("id").ilike("user_name",userName).eq("class_code",classCode).eq("trigger_source",triggerSource).gte("opened_at",cutoff.toISOString()).limit(1);
    if(res.data&&res.data.length>0)return true;
    // Also check pending to prevent double-grant within the same week
    var pen=await supabase.from("pending_chests").select("id").ilike("user_name",userName).eq("class_code",classCode).eq("trigger_source",triggerSource).limit(1);
    return pen.data&&pen.data.length>0;
  }catch(e){console.error("[CHEST] isWeeklyCooldown error:",e);return true;} // fail-safe: assume on cooldown
}

// Add a pending chest
export async function grantChest(userName, classCode, chestType, triggerSource){
  try{
    var res=await supabase.from("pending_chests").insert({user_name:userName,class_code:classCode,chest_type:chestType,trigger_source:triggerSource});
    if(res.error)console.error("[CHEST] grantChest error:",res.error.message);
  }catch(e){console.error("[CHEST] grantChest exception:",e);}
}

// Get pending chests for a user
export async function getPendingChests(userName, classCode){
  try{
    var res=await supabase.from("pending_chests").select("*").ilike("user_name",userName).eq("class_code",classCode).order("earned_at",{ascending:true});
    return res.data||[];
  }catch(e){console.error("[CHEST] getPendingChests error:",e);return[];}
}

// Get owned rewards (avatars + skins + frames + titles + cheat_sheets — all stored in player_rewards)
export async function getOwnedRewards(userName, classCode){
  try{
    var res=await supabase.from("player_rewards").select("*").ilike("user_name",userName).eq("class_code",classCode);
    return res.data||[];
  }catch(e){console.error("[CHEST] getOwnedRewards error:",e);return[];}
}

// V2 — get owned tokens, returns {token_type: quantity, ...}
export async function getOwnedTokens(userName, classCode){
  try{
    var res=await supabase.from("player_tokens").select("token_type,quantity").ilike("user_name",userName).eq("class_code",classCode);
    var map={};
    if(res.data)res.data.forEach(function(r){map[r.token_type]=r.quantity||0;});
    return map;
  }catch(e){console.warn("[CHEST] getOwnedTokens error (table may not exist yet):",e&&e.message);return{};}
}

// V2 — consume a token via the SQL helper. Returns {ok, error?}.
// Used by Streak Shield (passive), Daily Reroll, Mock/Boss Reset, Endless Resurrect, etc.
export async function consumeToken(userName, classCode, tokenType, amount){
  try{
    var res=await supabase.rpc("consume_token",{
      p_user_name:userName, p_class_code:classCode,
      p_token_type:tokenType, p_amount:amount||1,
    });
    if(res.error)return{ok:false,error:res.error.message};
    if(res.data===false)return{ok:false,error:"insufficient_quantity"};
    return{ok:true};
  }catch(e){return{ok:false,error:e&&e.message};}
}

// Arena Shop P2 (2026-06-01) — spend Darics on a catalog item via the atomic
// spend_marks RPC. Mirror of consumeToken. `item` = a SHOP_CATALOG entry.
// Returns {ok, balance?, error?}. The RPC handles balance check, ownership/cap
// check, decrement, grant (player_rewards or grant_token), and ledger — all in
// one transaction. Error codes: no_student / already_owned / at_cap / insufficient_marks.
export async function spendMarks(userName, classCode, item){
  try{
    var cap=item.cat==="token"?((TOKEN_TYPES[item.ref]&&TOKEN_TYPES[item.ref].cap)||1):0;
    var res=await supabase.rpc("spend_marks",{
      p_user_name:userName, p_class_code:classCode, p_item_id:item.item_id,
      p_category:item.cat, p_ref_id:item.ref, p_price:item.price,
      p_rarity:item.rarity||"rare", p_cap:cap, p_one_shot:!!item.one_shot,
    });
    if(res.error){console.warn("[SHOP] spend_marks RPC error:",res.error.message);return{ok:false,error:res.error.message};}
    return res.data||{ok:false,error:"empty_response"}; // {ok, balance?, error?}
  }catch(e){console.warn("[SHOP] spendMarks exception:",e&&e.message);return{ok:false,error:e&&e.message};}
}

// V2 — grant a token via the SQL helper (cap-aware UPSERT)
async function grantTokenRPC(userName, classCode, tokenType, amount, cap){
  try{
    var res=await supabase.rpc("grant_token",{
      p_user_name:userName, p_class_code:classCode,
      p_token_type:tokenType, p_amount:amount, p_cap:cap,
    });
    if(res.error)console.warn("[CHEST] grant_token RPC error:",res.error.message);
    return res.data;
  }catch(e){console.warn("[CHEST] grant_token exception:",e&&e.message);return null;}
}

// V2 step 5 — pool of token types eligible as conversion outputs
var NON_PREMIUM_TOKENS=["diminishing_bypass","streak_shield","daily_reroll"];
var PREMIUM_TOKENS=["mock_reset","boss_reset","endless_resurrect"];

// Convert 3 duplicate cosmetics → 1 random non-premium token.
// Returns {ok, token?, error?}. Atomic enough for V1 : DELETE 3 rows then grant 1 token.
// Failure modes : <3 dups (ok:false), all token types capped (returns XP gem instead).
export async function convertCosmeticDups(userName, classCode, rewardType, rewardId, ownedTokens){
  try{
    // Fetch up to 4 rows so we can verify count >= 4 (3 duplicates + 1 original kept).
    // The plan's "3 duplicates" wording implies 3 EXTRAS beyond the original copy ;
    // converting at count=3 would erase the user's only instance of that cosmetic.
    var sel=await supabase.from("player_rewards").select("id")
      .ilike("user_name",userName).eq("class_code",classCode)
      .eq("reward_type",rewardType).eq("reward_id",rewardId)
      .limit(4);
    if(sel.error)return{ok:false,error:sel.error.message};
    if(!sel.data||sel.data.length<4)return{ok:false,error:"not_enough_duplicates"};

    // Pick a non-capped non-premium token to grant
    var owned=ownedTokens||{};
    var candidates=NON_PREMIUM_TOKENS.filter(function(tt){
      var qty=owned[tt]||0;
      var cap=(TOKEN_TYPES[tt]&&TOKEN_TYPES[tt].cap)||1;
      return qty<cap;
    });
    if(candidates.length===0){
      // All non-premium tokens capped → DELETE 3 dups + grant a 100 XP fallback (caller handles).
      // Same "keep the 4th" invariant as the happy path.
      var ids=sel.data.slice(0,3).map(function(r){return r.id;});
      var del0=await supabase.from("player_rewards").delete().in("id",ids);
      if(del0.error)return{ok:false,error:del0.error.message};
      return{ok:true,xpFallback:100};
    }
    var pick=candidates[Math.floor(Math.random()*candidates.length)];
    var cap=TOKEN_TYPES[pick].cap||1;

    // DELETE only 3 rows (the duplicates) — keep the 4th as the user's original copy.
    var ids2=sel.data.slice(0,3).map(function(r){return r.id;});
    var del=await supabase.from("player_rewards").delete().in("id",ids2);
    if(del.error)return{ok:false,error:del.error.message};

    // Grant the token (cap-aware via SQL helper)
    await grantTokenRPC(userName,classCode,pick,1,cap);
    return{ok:true,token:pick};
  }catch(e){return{ok:false,error:e&&e.message};}
}

// Convert 5 of a non-premium token → 1 random premium token.
// Returns {ok, token?, error?}. Uses consume_token RPC × 5 (atomic per call).
export async function convertTokensToPremium(userName, classCode, sourceType, ownedTokens){
  try{
    if(NON_PREMIUM_TOKENS.indexOf(sourceType)===-1)return{ok:false,error:"source_not_non_premium"};
    var owned=ownedTokens||{};
    if((owned[sourceType]||0)<5)return{ok:false,error:"not_enough_tokens"};

    // Pick a non-capped premium token target
    var candidates=PREMIUM_TOKENS.filter(function(tt){
      var qty=owned[tt]||0;
      var cap=(TOKEN_TYPES[tt]&&TOKEN_TYPES[tt].cap)||1;
      return qty<cap;
    });
    if(candidates.length===0)return{ok:false,error:"all_premium_capped"};
    var pick=candidates[Math.floor(Math.random()*candidates.length)];
    var cap=TOKEN_TYPES[pick].cap||1;

    // Consume 5 source tokens via the SQL helper
    var consumeRes=await supabase.rpc("consume_token",{
      p_user_name:userName, p_class_code:classCode,
      p_token_type:sourceType, p_amount:5,
    });
    if(consumeRes.error)return{ok:false,error:consumeRes.error.message};
    if(consumeRes.data===false)return{ok:false,error:"consume_returned_false"};

    // Grant the premium token
    await grantTokenRPC(userName,classCode,pick,1,cap);
    return{ok:true,token:pick};
  }catch(e){return{ok:false,error:e&&e.message};}
}

// V2 — Open a chest: roll multi-rewards, persist them, log, delete pending, return aggregate.
// `owned` = {avatars, skins, frames, titles, cheatSheets, tokens:{type:qty}}
export async function openChestFromPending(pendingChest, pityCount, owned){
  // Rarity is now derived from chest_type itself (drop tables segmented per chest tier).
  // pityCount kept for backward signature compat — no longer used to roll rarity, but
  // forwarded back to the caller to preserve the reset-on-rare invariant.
  var rewards=pickRewards(pendingChest.chest_type, owned||{});
  var ct=pendingChest.chest_type;
  // Map chest type to a representative rarity tier for UI color/label fallback
  var tierByChest={novice:0,guerrier:2,champion:3,legendaire:4};
  var tier=tierByChest[ct]!==undefined?tierByChest[ct]:0;
  var rarityId=RARITIES[tier].id;
  // Pity reset on Champion/Légendaire chests (any non-novice/guerrier roll)
  var newPity=(ct==="novice"||ct==="guerrier")?(pityCount+1):0;
  var totalXp=0;
  var totalDarics=0; // Arena Shop P1 — aggregated from {type:"daric"} reward slots
  var un=pendingChest.user_name, cc=pendingChest.class_code;

  try{
    // Persist each reward to the right table
    for(var i=0;i<rewards.length;i++){
      var r=rewards[i];
      if(r.type==="xp"){
        totalXp+=r.xp||0;
        continue;
      }
      if(r.type==="daric"){
        // Aggregated here, granted server-side by doOpenChest via grantMarks RPC
        // (atomic increment + marks_log entry). Source is "chest" + trigger_source.
        totalDarics+=r.amount||0;
        continue;
      }
      if(r.type==="token"){
        var tt=TOKEN_TYPES[r.id];
        if(tt){
          await grantTokenRPC(un,cc,r.id,1,tt.cap||1);
        }
        continue;
      }
      // avatar / skin / frame / title / cheat_sheet → player_rewards
      var rRarity=r.rarity||rarityId;
      var rw=await supabase.from("player_rewards").insert({
        user_name:un, class_code:cc,
        reward_type:r.type, reward_id:r.id, rarity:rRarity,
      });
      if(rw.error)console.warn("[CHEST] player_rewards insert error:",rw.error.message);
    }

    // Single chest_log row per chest (multi-reward summary). Per-item history lives in
    // player_rewards / player_tokens. Keeps log compact and avoids a schema migration.
    var lg=await supabase.from("chest_log").insert({
      user_name:un, class_code:cc,
      chest_type:ct, trigger_source:pendingChest.trigger_source,
      rarity_obtained:rarityId, reward_type:"multi", reward_id:"v2",
      xp_amount:totalXp||null,
    });
    if(lg.error){
      // CRITICAL : if the audit log INSERT fails, do NOT delete the pending row.
      // hasUniqueTrigger relies on chest_log to dedupe future grants — losing the
      // log entry while consuming the pending leaves the trigger source untraceable
      // and re-grantable. Better to let the user see a stuck pending until the
      // schema is fixed than silently corrupt the audit trail.
      console.warn("[CHEST] chest_log insert error (pending kept):",lg.error.message);
    }else{
      var dl=await supabase.from("pending_chests").delete().eq("id",pendingChest.id);
      if(dl.error)console.warn("[CHEST] pending delete error:",dl.error.message);
    }
  }catch(e){console.warn("[CHEST] openChest exception:",e&&e.message);}

  return{
    chestType:ct,
    triggerSource:pendingChest.trigger_source,
    rarityTier:tier,
    rarityId:rarityId,
    rarityColor:RARITIES[tier].color,
    rarityLabel:RARITIES[tier].label,
    rewards:rewards,
    totalXp:totalXp,
    totalDarics:totalDarics,
    newPityCount:newPity,
  };
}
