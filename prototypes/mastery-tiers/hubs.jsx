// Proto échelons de maîtrise (2026-09-19) — listes de hubs (copiées de src/ : GamesHub, Train →
// Grammar & Vocab), profil fictif, variantes de tuile et d'étagère. A = les VRAIS HubTile / HubShelf
// de src/ (coffre unique, « Won » pour toujours). B, C, D = la même tuile (classes .hub-* réelles)
// avec les échelons de tiers.js.
import { GIcon } from "../../src/components/icons.jsx";
import { TreasureChestSvg } from "../../src/components/avatar.jsx";
import { GAME_ICON_PATHS } from "../../src/data/avatarIcons.js";
import { HubTile, HubShelf } from "../../src/components/HubTile.jsx";
import { hubItemStatus, hubSummary, agoLabel } from "../../src/lib/hubStatus.js";
import { today } from "../../src/lib/util.js";
import { tierStatus, hubTierStatus, roman, TIERS, RENOWN_STEP } from "./tiers.js";

// ── Contenu des hubs (copié de src/, mêmes libellés et icônes) ──
export var HUBS = {
  games: {
    kind: "games", title: "Arena Games", sub: "Train your reflexes, earn XP", gap: 12, size: "lg",
    items: [
      { id: "tavern", n: "Word Tavern", d: "Prove your vocabulary!", i: "beer-stein", tag: "NEW" },
      { id: "matchE", n: "Speed Match", d: "Match words with definitions!", i: "chained-arrow-heads", game: "matchEasy" },
      { id: "wfall", n: "Word Fall", d: "Catch the falling sentences!", i: "meteor-impact", game: "wordFall" },
      { id: "sbuild", n: "Sentence Builder", d: "Tap blocks in the right order!", i: "brick-pile" },
      { id: "ablitz", n: "Audio Blitz", d: "Listen once, answer fast!", i: "lyre" },
      { id: "clue", n: "Clue Hunter", d: "Find the clue, fill the blank!", i: "spyglass" },
      { id: "mimic", n: "Mimic Hunt", d: "Same meaning — or just the same words?", i: "mimic-chest", tag: "NEW" },
      { id: "duel", n: "Vocabulary Arena", d: "Real-time 1v1 — challenge a classmate!", i: "swords-emblem", tag: "NEW", game: "duel" },
    ],
  },
  gv: {
    kind: "train", back: "Training Grounds", title: "Grammar & Vocab", sub: "Build your foundations", gap: 8, size: "md",
    items: [
      { id: "csess", n: "Flashcard Review", d: "SRS spaced repetition", i: "card-joker" },
      { id: "gauntlet", n: "Grammar Gauntlet", d: "4 trials · Irregulars, Tenses, Passive, Relatives", i: "gauntlet",
        subs: ["gauntlet_irregular", "gauntlet_tense", "gauntlet_passive", "gauntlet_relative"], unit: "trials" },
      { id: "modals", n: "Modal Council", d: "2 trials · Pair situations, classify verdicts", i: "throne-king",
        subs: ["modals_match", "modals_sort"], unit: "trials" },
      { id: "wordfam", n: "Word Families", d: "Classify: Noun, Verb, Adj, Adv", i: "family-tree" },
      { id: "falsefr", n: "False Friends", d: "FR/EN traps: actually ≠ actuellement", i: "duality-mask" },
      { id: "connsort", n: "Connectors Sorting", d: "Clause, Noun, or New sentence?", i: "knot" },
      { id: "bforge", n: "Linking Bridge", d: "Pick the connector that fits the logic & grammar", i: "stone-bridge", tag: "NEW" },
      { id: "prepdrill", n: "Preposition Collocations", d: "Study + Drill mode", i: "linked-rings" },
      { id: "gerinf", n: "Gerund vs Infinitive", d: "4 patterns · Study + Context Quiz", i: "scales" },
      { id: "pvdojo", n: "Phrasal Verb Dojo", d: "55 verbs · Study, Match & Speed", i: "shuriken" },
    ],
  },
};

// ── Profil fictif : un état d'échelon différent par tuile ──
function ago(n) { return today(new Date(Date.now() - n * 864e5)); }
// n sessions de c/t, la plus récente il y a `last` jours, une par jour avant.
function sess(n, c, t, last) {
  var h = [];
  for (var i = 0; i < n; i++) h.push({ date: ago(last + (n - 1 - i)), correct: c, total: t });
  return h;
}
function ms(total, correct, hist, mt) {
  var o = { total: total, correct: correct, sessions: hist.length, lastDate: hist.length ? hist[hist.length - 1].date : null, catStats: {}, history: hist };
  if (mt) o.mt = mt;
  return o;
}
export function fixture(u, kind) {
  if (kind === "new") return u;
  u.moduleScores = {
    // Games
    tavern: ms(112, 97, sess(4, 13, 15, 1), { n: 1, date: ago(12) }),   // I gagné → II en route (112/150)
    sbuild: ms(380, 338, sess(4, 14, 15, 1), { n: 3, date: ago(20) }),  // III (Légendaire) gagné → IV, la récurrence
    ablitz: ms(158, 131, sess(5, 10, 12, 2), { n: 1, date: ago(30) }),  // I gagné, volume de II atteint, 83 % récents < 85
    clue: ms(305, 280, sess(5, 9, 10, 0), { n: 2, date: ago(2) }),      // II gagné il y a 2 j, III atteint : attend 5 j
    mimic: ms(30, 24, sess(2, 12, 15, 0)),                              // en route vers I (règle d'aujourd'hui)
    // Grammar & Vocab
    gauntlet_irregular: ms(170, 150, sess(4, 13, 15, 1), { n: 2, date: ago(9) }),
    gauntlet_tense: ms(95, 80, sess(4, 13, 15, 0), { n: 1, date: ago(15) }),
    gauntlet_passive: ms(60, 50, sess(4, 12, 15, 3), { n: 1, date: ago(6) }),
    gauntlet_relative: ms(75, 62, sess(4, 12, 15, 2), { n: 1, date: ago(4) }),
    modals_match: ms(30, 26, sess(2, 13, 15, 1)),
    modals_sort: ms(15, 13, sess(1, 13, 15, 1)),
    wordfam: ms(34, 29, sess(2, 12, 15, 1)),
    falsefr: ms(58, 41, sess(5, 7, 10, 3)),                              // bloqué par la précision dès I (71 % cumulés)
    connsort: ms(140, 124, sess(4, 14, 15, 0), { n: 1, date: ago(25) }), // à 10 Q de II
    prepdrill: ms(20, 12, sess(2, 6, 10, 0)),
    gerinf: ms(160, 140, sess(5, 9, 10, 0), { n: 1, date: ago(3) }),     // I il y a 3 j, II atteint : attend 4 j
    pvdojo: ms(15, 14, sess(1, 14, 15, 0)),
  };
  u.gameScores = { matchEasy: { time: 23.4, moves: 13 }, wordFall: { score: 85, maxCombo: 26, questions: 36 }, duel: { wins: 2, played: 3, wagerWon: 100 } };
  var t = today(), runs = { tavern: 1, ablitz: 1, clue: 1, mimic: 1, game_wordFall: 2, connsort: 1, prepdrill: 1, gerinf: 2, pvdojo: 3, gauntlet_tense: 1 };
  u.dailyModSessions = {};
  Object.keys(runs).forEach(function (k) { u.dailyModSessions[k + "_" + t] = runs[k]; });
  return u;
}

// ── Pièces communes ──
var CHIP = { half: "½ XP", low: "Low XP", none: "No XP" };
function pct(x) { return Math.round(x * 100) + "%"; }
function subLine(s, d) {
  if (s.plain) return d;
  if (s.game) return s.record ? "Record " + s.record : d;
  if (s.last) return "Last " + s.last.correct + "/" + s.last.total + " · " + agoLabel(s.last.date);
  return d;
}
function tierOf(u, it) {
  var sc = u.moduleScores || {};
  return it.subs ? hubTierStatus(sc, it.subs) : tierStatus(sc[it.id]);
}
function Arrow() { return <span style={{ fontSize: 16, color: "var(--cyan)" }}>{"→"}</span>; }

// Tuile : mêmes classes et mesures que components/HubTile.jsx.
function Shell(p) {
  var it = p.it, s = p.s, lg = p.lg, box = lg ? 48 : 42;
  var chip = !s.plain && CHIP[s.xp];
  return <div className="crd hub-tile" style={{ display: "flex", alignItems: "center", gap: 14, padding: lg ? "16px" : "14px 16px", cursor: "pointer" }}>
    <div style={{ width: box, height: box, borderRadius: lg ? 14 : 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,rgba(var(--cx),.22),transparent)", border: "1.5px solid var(--cyan)" }}>
      {GAME_ICON_PATHS[it.i] ? <GIcon name={it.i} size={lg ? 28 : 22} color="var(--cyan)" /> : it.i}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="hub-namerow">
        <div className="out" style={{ fontWeight: 700, fontSize: lg ? 15 : 14 }}>{it.n}</div>
        {chip && <span className={"hub-chip " + s.xp}>{chip}</span>}
      </div>
      <div className="hub-sub">{subLine(s, it.d)}</div>
      {p.children}
      {it.tag && <div style={{ fontSize: 10, color: "var(--gold)", marginTop: 2 }}>{it.tag}</div>}
    </div>
    {p.right}
  </div>;
}

// Coffre de l'échelon SUIVANT : Champion en bronze, Légendaire (III) en obsidienne et or.
function NextChest(p) {
  var t = p.t, blocked = t.accLow && (t.volOk || t.hub);
  var label = t.state === "wait" ? "in " + t.wait + " d" : blocked && !t.hub ? pct(t.acc) + " acc" : pct(t.vol);
  var cls = "hub-chest mt-chest" + (t.state === "new" ? " idle" : "") + (t.next.chest === 3 ? " legend" : "") + (t.state === "wait" ? " wait" : "");
  return <div className={cls}>
    <span className="mt-cw">
      <TreasureChestSvg size={34} tier={t.next.chest} idSuffix={"mt" + p.v + p.id} />
      {p.num && <b className="mt-num">{roman(t.next.n)}</b>}
    </span>
    <small className={blocked && !t.hub ? "hub-warn" : ""}>{label}</small>
  </div>;
}

function AccPart(p) {
  var t = p.t;
  if (t.accLow) return <><span className="hub-warn">{pct(t.acc)}</span>{" (" + pct(t.next.acc) + " needed)"}</>;
  return <>{pct(t.acc)}</>;
}
// Volume vers l'échelon suivant : « 112/150 Q » ou, pour un hub, « 1/4 trials at II ».
function volText(t, unit) {
  if (t.hub) return t.at + "/" + t.n + " " + unit + (t.won ? " at " + roman(t.next.n) : " mastered");
  return (t.volOk ? t.total : t.total + "/" + t.next.q) + " Q";
}
// « recent » : au-delà de I, la précision affichée est celle des ~50 dernières questions.
// short : le rang gagné est déjà affiché devant (B, D), inutile de redire « Mastery ».
function statsLine(t, unit, short) {
  if (t.state === "new") return "Not started";
  if (t.state === "wait") return (short ? "" : "Mastery ") + roman(t.next.n) + " opens in " + t.wait + " d";
  if (t.hub) return volText(t, unit);
  return <>{volText(t, unit) + " · "}<AccPart t={t} />{t.won && !t.accLow ? " recent" : ""}</>;
}
function Bar(p) {
  var t = p.t;
  return <div className={"hub-bar" + (t.accLow ? " low" : "") + (t.state === "wait" ? " won" : "")}><i style={{ width: (t.vol * 100) + "%" }} /></div>;
}

// ── A · Actuel : les vrais composants de src/ ──
function TileA(p) {
  return <HubTile item={p.it} size={p.lg ? "lg" : "md"} unit={p.it.unit} status={hubItemStatus(p.u, p.it, {})}>
    {p.it.tag && <div style={{ fontSize: 10, color: "var(--gold)", marginTop: 2 }}>{p.it.tag}</div>}
  </HubTile>;
}

// ── B · Coffre suivant : la tuile d'aujourd'hui, le coffre de droite devient le prochain (chiffre romain) ──
function TileB(p) {
  var it = p.it, s = hubItemStatus(p.u, it, {});
  if (s.plain || s.game) return <Shell it={it} s={s} lg={p.lg} right={<Arrow />} />;
  var t = tierOf(p.u, it);
  return <Shell it={it} s={s} lg={p.lg} right={<NextChest t={t} id={it.id} v="B" num />}>
    <Bar t={t} />
    <div className="hub-meta">{t.won ? <><span className="mt-gold">{"Mastery " + roman(t.won)}</span>{" · "}</> : null}{statsLine(t, it.unit, t.won > 0)}</div>
  </Shell>;
}

// ── C · Échelle : la barre devient une échelle I · II · III (longueurs = questions à jouer) ──
function Ladder(p) {
  var t = p.t, segs;
  if (t.won < TIERS.length) {
    segs = TIERS.map(function (d, i) {
      var n = i + 1, from = i ? TIERS[i - 1].q : 0;
      return { lab: roman(n), g: d.q - from, won: t.won >= n, cur: t.won + 1 === n, legend: d.chest === 3 };
    });
  } else {
    segs = [{ lab: "I–" + roman(t.won), g: 1, won: true }, { lab: roman(t.won + 1), g: 2, cur: true }];
  }
  return <div className="mt-ladder">
    <div className="mt-segs">{segs.map(function (s, i) {
      return <span key={i} className={"mt-seg" + (s.won ? " won" : "") + (s.cur && t.accLow ? " low" : "") + (s.cur && t.state === "wait" ? " full" : "")} style={{ flexGrow: s.g }}>
        {s.cur && <i style={{ width: (t.vol * 100) + "%" }} />}
      </span>;
    })}</div>
    <div className="mt-segs mt-labs">{segs.map(function (s, i) {
      return <span key={i} className={(s.won ? "won" : s.cur ? "cur" : "") + (s.legend && !s.won ? " legend" : "")} style={{ flexGrow: s.g }}>{s.lab}</span>;
    })}</div>
  </div>;
}
function TileC(p) {
  var it = p.it, s = hubItemStatus(p.u, it, {});
  if (s.plain || s.game) return <Shell it={it} s={s} lg={p.lg} right={<Arrow />} />;
  var t = tierOf(p.u, it);
  return <Shell it={it} s={s} lg={p.lg} right={<NextChest t={t} id={it.id} v="C" />}>
    <Ladder t={t} />
    <div className="hub-meta" style={{ marginTop: 1 }}>{statsLine(t, it.unit)}</div>
  </Shell>;
}

// ── D · Médailles : un sceau par échelon gagné, la barre et le coffre visent le suivant ──
function Medals(p) {
  var w = p.won, out = [];
  for (var n = 1; n <= Math.min(w, TIERS.length); n++) out.push(<span key={n} className={"mt-medal" + (TIERS[n - 1].chest === 3 ? " legend" : "")}>{roman(n)}</span>);
  if (w > TIERS.length) out.push(<span key="r" className="mt-medal renown">{"+" + (w - TIERS.length)}</span>);
  return <span className="mt-medals">{out}</span>;
}
function TileD(p) {
  var it = p.it, s = hubItemStatus(p.u, it, {});
  if (s.plain || s.game) return <Shell it={it} s={s} lg={p.lg} right={<Arrow />} />;
  var t = tierOf(p.u, it);
  return <Shell it={it} s={s} lg={p.lg} right={<NextChest t={t} id={it.id} v="D" num />}>
    <Bar t={t} />
    <div className="hub-meta mt-dmeta">{t.won ? <Medals won={t.won} /> : null}<span>{statsLine(t, it.unit, t.won > 0)}</span></div>
  </Shell>;
}

export var TILES = { A: TileA, B: TileB, C: TileC, D: TileD };

// ── Étagère ──
// A : la vraie (« 3 of 5 », figée une fois tout gagné). B-D : un coffre par tuile au palier de son
// dernier échelon gagné, le total des coffres gagnés (sans « of N » : la série ne finit pas) et le
// prochain coffre le plus proche.
export function Shelf(p) {
  var u = p.u, items = p.hub.items;
  if (p.v === "A") return <HubShelf id={p.hub.kind} summary={hubSummary(u, items, {})} />;
  var rows = items.filter(function (it) { return !it.game && !hubItemStatus(u, it, {}).plain; })
    .map(function (it) { return { it: it, t: tierOf(u, it) }; });
  var won = rows.reduce(function (a, r) { return a + (r.t.hub ? r.t.chests : r.t.won); }, 0);
  var fresh = hubSummary(u, items, {}).fresh;
  var near = null, wait = null;
  rows.forEach(function (r) {
    var t = r.t;
    if (t.hub || t.state === "new") return;
    if (t.state === "wait") { if (!wait || t.wait < wait.t.wait) wait = r; return; }
    if (t.accLow || t.volOk) return;
    var left = t.next.q - t.total;
    if (!near || left < near.left) near = { it: r.it, t: t, left: left };
  });
  return <div className="crd hub-shelf">
    <div className="hub-shelf-row">{rows.map(function (r, i) {
      var w = r.t.won;
      return <span key={i} className={"mt-shelf-c" + (w ? " won" : "")}>
        <TreasureChestSvg size={26} tier={w >= 3 ? 3 : 2} idSuffix={"mts" + p.v + i} />
        {w > 0 && <b className="mt-num sm">{roman(w)}</b>}
      </span>;
    })}</div>
    <div className="hub-shelf-txt"><b className="out">{won}</b>{won === 1 ? " mastery chest won" : " mastery chests won"}<em>{fresh + " at full XP today"}</em></div>
    {near ? <div className="hub-hint">{"Next: "}<span className="mt-gold">{near.it.n + " " + roman(near.t.next.n)}</span>{" · " + near.left + " Q to go"}</div>
      : wait ? <div className="hub-hint">{"Next: "}<span className="mt-gold">{wait.it.n + " " + roman(wait.t.next.n)}</span>{" opens in " + wait.t.wait + " d"}</div>
      : null}
    {won === 0 && <div className="hub-hint">{"Mastery chests at " + TIERS.map(function (d) { return d.q; }).join(", ") + " questions, then one every " + RENOWN_STEP + "."}</div>}
  </div>;
}
