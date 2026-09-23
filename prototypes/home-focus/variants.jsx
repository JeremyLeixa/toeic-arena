// Proto « Home à un seul bouton » (2026-09-23). Trois variantes de Home, même contrat de props que le
// vrai src/features/home/Home.jsx (variante A = le vrai composant, rendu dans frame.jsx). Vrais helpers,
// vraie CSS, aucun appel réseau. Hors build.
import { renderAv, TreasureChestSvg } from "../../src/components/avatar.jsx";
import { Bar } from "../../src/components/Bar.jsx";
import { GIcon, LeagueIcon } from "../../src/components/icons.jsx";
import { GAME_ICON_PATHS } from "../../src/data/avatarIcons.js";
import { TITLES } from "../../src/data/chests.js";
import { getLevel } from "../../src/data/helpers.js";
import { STRATEGIES } from "../../src/data/miniGames.js";
import { festivalById, festivalDaysLeft } from "../../src/lib/festivals.js";
import { getEffectiveLeague } from "../../src/lib/league.js";
import { homeStrip, questView } from "../../src/lib/mentorVoice.js";
import { todayMission, questDone, thawQuest } from "../../src/lib/planner.js";
import { needsMockNudge } from "../../src/lib/progress.js";
import { tone } from "../../src/lib/tone.js";
import { today } from "../../src/lib/util.js";
import { useState } from "react";

// ── Ce que la journée demande, dans l'ordre (même priorité que le pulse de la Home actuelle :
// coffre > mock > mission > daily > reste du chemin). Chaque entrée : {id, icon, eyebrow, title, sub, go, done}.
export function dayAgenda(p) {
  var u = p.u, now = new Date(), items = [];
  var dd = u.daily && u.daily.date === today() && u.daily.done;
  var m = todayMission(u, now);
  if (p.pendingChests > 0) items.push({ id: "chest", icon: "chest", eyebrow: "Waiting for you",
    title: p.pendingChests > 1 ? "Open your " + p.pendingChests + " chests" : "Open your chest",
    sub: "Rewards are already inside", go: p.onOpenChest, done: false });
  if (needsMockNudge(u)) items.push({ id: "mock", icon: "scroll-unfurled", eyebrow: "First step",
    title: "Take your first Mock Test", sub: "Measures your real level · unlocks your TOEIC score", go: function () { p.nav("mock1"); }, done: false });
  if (m && m.quests.length) {
    var q = thawQuest(m.quests[m.pick || 0], u, now), v = questView(q, u, true);
    items.push({ id: "mission", icon: v.icon, eyebrow: "Daily mission", reward: "+15 XP", title: v.title, sub: v.tag,
      go: function () { p.nav(q.mod); }, done: !!m.done });
  }
  items.push({ id: "daily", icon: dd ? "trophy-cup" : "lightning-bow", eyebrow: "Warm-up", reward: "+100 XP",
    title: "Daily Challenge", sub: dd ? "Done · +" + (u.daily.xpE || 0) + " XP" : "5 grammar questions · 30 s each",
    go: function () { p.nav("daily"); }, done: !!dd });
  if (m) m.quests.forEach(function (raw, i) {
    if (i === (m.pick || 0)) return;
    var q = thawQuest(raw, u, now), v = questView(q, u, false);
    items.push({ id: "q" + i, icon: v.icon, eyebrow: "Today's path", title: v.title, sub: v.tag,
      go: function () { p.nav(q.mod); }, done: questDone(u, m, i, now) });
  });
  return items;
}

// Bonus en cours, une ligne de texte (au lieu des pastilles colorées).
function bonusLine(u) {
  var out = [], dow = new Date().getDay();
  if (dow === 0 || dow === 6) out.push("×2 weekend");
  if (u.streak >= 7) out.push("×1.5 streak"); else if (u.streak >= 3) out.push("×1.2 streak");
  if (u.lastActive !== today()) out.push("+10 login");
  return out.join(" · ");
}
function eventLine(ev) {
  var cfg = ev.config || {}, m = cfg.multiplier || 2;
  var h = Math.max(0, Math.round((new Date(ev.end_at) - new Date()) / 36e5));
  return { title: ev.title, sub: ev.type === "spotlight" ? "×" + m + " on " + cfg.module : ev.type === "flash_hour" ? "×" + m + " XP on everything" : "×" + m + " below the median",
    left: h >= 24 ? Math.floor(h / 24) + "d left" : h + "h left" };
}
function tipOfDay() {
  var all = [];
  STRATEGIES.forEach(function (s) { s.tips.forEach(function (t) { all.push({ tip: t, part: s.part, icon: s.icon }); }); });
  var n = 0, d = today(); for (var i = 0; i < d.length; i++) n += d.charCodeAt(i);
  return all[n % all.length];
}

function Header(p) {
  var u = p.u, fest = p.festId ? festivalById(p.festId) : null;
  return (<div className="hf-head">
    <div>
      <p className="hf-hello">{fest ? fest.greeting : "Welcome back"}</p>
      <h1 className="out hf-name">{u.name} {renderAv(u.avatar, 26, u.equippedFrame)}</h1>
      {u.equippedTitle && TITLES[u.equippedTitle] && <div className="out hf-title" style={{ color: tone(TITLES[u.equippedTitle].color) }}>{TITLES[u.equippedTitle].name}</div>}
    </div>
    <div className="hf-streak">
      {u.streak > 0 ? <GIcon name="flame" size={24} color="var(--orange)" /> : <span>{"❄️"}</span>}
      <b className="out" style={{ color: u.streak > 0 ? "var(--orange)" : "var(--t3)" }}>{u.streak}</b>
    </div>
  </div>);
}
// Niveau + ligue sur une seule ligne fine (au lieu de la carte).
function LevelLine(p) {
  var u = p.u, lv = getLevel(u.xp), lg = getEffectiveLeague(u.weeklyXp, u.moduleScores);
  return (<button className="hf-level" onClick={function () { p.tabGo("league"); }}>
    <span className="hf-lvl out">{lv.level}</span>
    <span className="hf-level-mid">
      <span className="hf-level-row"><b className="out">{"Level " + lv.level}</b><span>{lv.cur + " / " + lv.next + " XP"}</span></span>
      <Bar value={lv.cur} max={lv.next} h={4} />
    </span>
    <span className="hf-league"><LeagueIcon lg={lg} size={14} /><span className="out" style={{ color: tone(lg.color) }}>{lg.name}</span></span>
  </button>);
}
function Hero(p) {
  var it = p.item, u = p.u;
  if (!it) return (<div className="crd hf-hero calm">
    <div className="hf-eyebrow out">{"Today"}</div>
    <div className="hf-hero-title out">{"All done for today"}</div>
    <div className="hf-hero-sub">{"Mission, challenge and path complete. Anything more is a bonus."}</div>
    <button className="btn2 hf-hero-btn" onClick={function () { p.tabGo("train"); }}>{"Free training"}</button>
  </div>);
  var isChest = it.id === "chest", bonus = bonusLine(u);
  return (<div className={"crd hf-hero" + (isChest ? " chest t" + (p.pendingChestTier || 0) : "")}>
    <div className="hf-hero-top">
      <span className="hf-hero-icon">{isChest ? <TreasureChestSvg size={54} tier={p.pendingChestTier || 0} idSuffix="hf" /> : <GIcon name={GAME_ICON_PATHS[it.icon] ? it.icon : "lightning-bow"} size={30} color="var(--cyan)" />}</span>
      <div style={{ minWidth: 0 }}>
        <div className="hf-eyebrow out">{it.eyebrow + (it.reward && it.sub.indexOf(it.reward) < 0 ? " · " + it.reward : "")}</div>
        <div className="hf-hero-title out">{it.title}</div>
        <div className="hf-hero-sub">{it.sub}</div>
      </div>
    </div>
    <button className="btn1 hf-hero-btn" onClick={it.go}>{isChest ? "Open" : "Start"}</button>
    {bonus && !isChest && <div className="hf-bonus">{"Active now: " + bonus}</div>}
  </div>);
}

// ═══ B · Une porte : un seul grand bouton, le reste en lignes ═══
export function HomeOneDoor(p) {
  var u = p.u, items = dayAgenda(p), todo = items.filter(function (x) { return !x.done; });
  var hero = todo[0] || null, rest = todo.slice(1, 3), more = todo.length - 1 - rest.length;
  var fest = p.festId ? festivalById(p.festId) : null;
  var [tipOpen, setTipOpen] = useState(false), tip = tipOfDay();
  return (<div className="enter hf-wrap">
    <Header {...p} />
    <LevelLine {...p} />
    <Hero item={hero} u={u} tabGo={p.tabGo} pendingChestTier={p.pendingChestTier} />
    {rest.length > 0 && <div className="hf-also">
      <div className="hf-also-h out">{"Also today"}</div>
      {rest.map(function (it) {
        return (<button key={it.id} className="hf-row" onClick={it.go}>
          <GIcon name={GAME_ICON_PATHS[it.icon] ? it.icon : "lightning-bow"} size={16} color="var(--t2)" />
          <span className="hf-row-t">{it.title}</span><span className="hf-row-s">{it.reward || ""}</span><span className="hf-go">{"›"}</span>
        </button>);
      })}
      {more > 0 && <button className="hf-row hf-more" onClick={p.openPath}>{"+" + more + " more on today's path ›"}</button>}
    </div>}
    {(p.events || []).map(function (ev, i) { var e = eventLine(ev); return (<div key={i} className="hf-tick"><GIcon name="lightning-storm" size={14} color="var(--gold)" /><b>{e.title}</b><span>{e.sub}</span><em>{e.left}</em></div>); })}
    {fest && <div className="hf-tick"><GIcon name={fest.icon} size={14} color="var(--cyan)" /><b>{fest.name}</b><span>{"seasonal theme"}</span><em>{festivalDaysLeft(fest, new Date()) + "d left"}</em></div>}
    <button className="hf-tip" onClick={function () { setTipOpen(!tipOpen); }}>
      <span className="out">{"Tip of the day · " + tip.part}</span><span>{tipOpen ? "−" : "+"}</span>
    </button>
    {tipOpen && <div className="hf-tip-body"><b>{tip.tip.t}</b><p>{tip.tip.d}</p></div>}
  </div>);
}

// ═══ C · Élaguée : la Home actuelle, moins ce qui double un onglet ═══
// Garde : coffre, Daily Challenge (seul bloc « à jouer »), ligne du chemin (décision du 17/09).
// Retire : Quick Start (= onglet Train), pastilles (→ une ligne dans la carte niveau), astuce (→ une ligne).
// Bandeaux (mock, évènements, fête) : un seul visible, les autres derrière « +N ».
export function HomePruned(p) {
  var u = p.u, lv = getLevel(u.xp), lg = getEffectiveLeague(u.weeklyXp, u.moduleScores);
  var dd = u.daily && u.daily.date === today() && u.daily.done, strip = homeStrip(u, new Date());
  var fest = p.festId ? festivalById(p.festId) : null, bonus = bonusLine(u), tip = tipOfDay();
  var banners = [];
  if (needsMockNudge(u)) banners.push({ k: "mock", icon: "scroll-unfurled", t: "Take your first Mock Test", s: "Unlocks your TOEIC score", go: function () { p.nav("mock1"); } });
  (p.events || []).forEach(function (ev, i) { var e = eventLine(ev); banners.push({ k: "ev" + i, icon: "lightning-storm", t: e.title, s: e.sub + " · " + e.left, gold: true }); });
  if (fest) banners.push({ k: "fest", icon: fest.icon, t: fest.name, s: "Seasonal theme · " + festivalDaysLeft(fest, new Date()) + "d left" });
  var [showAll, setShowAll] = useState(false), shown = showAll ? banners : banners.slice(0, 1);
  return (<div className="enter hf-wrap">
    <Header {...p} />
    {p.pendingChests > 0 && <button className={"home-chest t" + (p.pendingChestTier || 0)} onClick={p.onOpenChest} style={{ animation: "pulse 2s infinite" }}>
      <span className="home-chest-art"><TreasureChestSvg size={56} tier={p.pendingChestTier || 0} idSuffix="hfc" /></span>
      {p.pendingChests > 1 && <b className="home-chest-count">{"×" + p.pendingChests}</b>}
      <div style={{ flex: 1, textAlign: "left" }}><div className="out" style={{ fontWeight: 800, fontSize: 14, color: "var(--gold)" }}>{"Treasure chest" + (p.pendingChests > 1 ? "s" : "") + " waiting"}</div></div>
      <span style={{ fontSize: 20, color: "var(--gold)" }}>{"›"}</span>
    </button>}
    {shown.map(function (b) {
      return (<div key={b.k} className="hf-banner" onClick={b.go} style={{ cursor: b.go ? "pointer" : "default" }}>
        <GIcon name={GAME_ICON_PATHS[b.icon] ? b.icon : "info"} size={18} color={b.gold ? "var(--gold)" : "var(--cyan)"} />
        <div style={{ flex: 1, minWidth: 0 }}><b className="out">{b.t}</b><span>{b.s}</span></div>
        {b.go && <span className="hf-go">{"›"}</span>}
      </div>);
    })}
    {banners.length > 1 && !showAll && <button className="hf-more-link" onClick={function () { setShowAll(true); }}>{"+" + (banners.length - 1) + " more"}</button>}
    <div className="crd glo" onClick={function () { p.tabGo("league"); }} style={{ marginBottom: 14, cursor: "pointer", padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="hf-lvl out">{lv.level}</span>
          <div><div className="out" style={{ fontSize: 13, fontWeight: 700 }}>{"Level " + lv.level}</div><div style={{ fontSize: 11, color: "var(--t2)" }}>{lv.cur + " / " + lv.next + " XP" + (bonus ? " · " + bonus : "")}</div></div>
        </div>
        <span className="hf-league"><LeagueIcon lg={lg} size={14} /><span className="out" style={{ color: tone(lg.color) }}>{lg.name}</span></span>
      </div>
      <Bar value={lv.cur} max={lv.next} h={5} />
    </div>
    {strip && <button className={"mm-strip" + (strip.tone === "due" ? " due" : "")} onClick={p.openPath}>
      <GIcon name="wizard-staff" size={18} color={strip.tone === "due" ? "var(--gold)" : "var(--cyan)"} />
      <span className="mm-strip-t out">{strip.text}</span><span className="mm-strip-go">{"›"}</span>
    </button>}
    <div className={"crd hf-daily" + (dd ? " done" : "")} onClick={function () { if (!dd) p.nav("daily"); }}>
      <GIcon name={dd ? "trophy-cup" : "lightning-bow"} size={26} color={dd ? "var(--green)" : "var(--cyan)"} />
      <div style={{ flex: 1 }}>
        <div className="out" style={{ fontWeight: 800, fontSize: 16, color: dd ? "var(--green)" : "var(--t1)" }}>{"Daily Challenge"}</div>
        <div style={{ fontSize: 12, color: "var(--t2)" }}>{dd ? "Done · +" + (u.daily.xpE || 0) + " XP" : "5 grammar questions · +100 XP"}</div>
      </div>
      {!dd && <span className="btn1 hf-daily-btn">{"Play"}</span>}
    </div>
    <button className="hf-tip" onClick={function () { p.nav("strats"); }}><span className="out">{"Tip · " + tip.tip.t}</span><span>{"›"}</span></button>
  </div>);
}

// ═══ D · Ordre du jour : une seule carte-liste, la première ligne non faite est le bouton ═══
export function HomeAgenda(p) {
  var u = p.u, items = dayAgenda(p), first = items.findIndex(function (x) { return !x.done; });
  var shown = items.slice(0, 5), hidden = items.length - shown.length, allDone = first < 0;
  var ev = (p.events || [])[0], e = ev ? eventLine(ev) : null, bonus = bonusLine(u), fest = p.festId ? festivalById(p.festId) : null;
  return (<div className="enter hf-wrap">
    <Header {...p} />
    <div className="crd hf-agenda">
      <div className="hf-agenda-h">
        <span className="out">{allDone ? "Today · all done" : "Today"}</span>
        <span className="hf-agenda-n">{items.filter(function (x) { return x.done; }).length + " / " + items.length}</span>
      </div>
      {shown.map(function (it, i) {
        var lead = i === first;
        return (<button key={it.id} className={"hf-item" + (lead ? " lead" : "") + (it.done ? " done" : "")} onClick={it.done ? undefined : it.go}>
          <span className="hf-check">{it.done ? "✓" : lead ? "" : ""}</span>
          <span className="hf-item-mid">
            <span className="hf-item-t out">{it.title}</span>
            <span className="hf-item-s">{it.eyebrow + (it.done ? "" : (it.reward && it.sub.indexOf(it.reward) < 0 ? " · " + it.reward : "") + " · " + it.sub)}</span>
          </span>
          {lead && <span className="btn1 hf-item-btn">{it.id === "chest" ? "Open" : "Start"}</span>}
        </button>);
      })}
      {hidden > 0 && <button className="hf-row hf-more" onClick={p.openPath}>{"+" + hidden + " on today's path ›"}</button>}
      {(bonus || e || fest) && <div className="hf-agenda-f">{[e ? e.title + " " + e.left : "", fest ? fest.name : "", bonus].filter(Boolean).join(" · ")}</div>}
    </div>
    <LevelLine {...p} />
  </div>);
}
