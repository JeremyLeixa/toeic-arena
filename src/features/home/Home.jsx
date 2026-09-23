// Home « une porte » (2026-09-23, proto prototypes/home-focus/, variante B choisie par Jérémy) : un seul
// grand bouton = la prochaine chose à faire (lib/homeAgenda.js : coffre > Mock > mission du jour > quêtes
// du plan), « Also today » (deux lignes) et le lien vers le chemin, le Daily Challenge en bloc à part.
// Niveau et ligue en une ligne fine ; bonus, évènements et fête en lignes de texte ; astuce repliée.
// Décision du 17/09 (« le plan ne va pas sur Home ») assouplie par Jérémy le 23/09. Quick Start supprimé
// (doublon de l'onglet Train). Mêmes props qu'avant : aucun état ajouté dans App().
import { useState } from "react";
import { renderAv, TreasureChestSvg } from "../../components/avatar.jsx";
import { Bar } from "../../components/Bar.jsx";
import { GIcon, LeagueIcon } from "../../components/icons.jsx";
import { GAME_ICON_PATHS } from "../../data/avatarIcons.js";
import { TITLES } from "../../data/chests.js";
import { getLevel } from "../../data/helpers.js";
import { STRATEGIES } from "../../data/miniGames.js";
import { festivalById, festivalDaysLeft } from "../../lib/festivals.js";
import { homeFocus, bonusLine } from "../../lib/homeAgenda.js";
import { getEffectiveLeague } from "../../lib/league.js";
import { tone } from "../../lib/tone.js";
import { today } from "../../lib/util.js";

function tipOfDay() {
  var all = [];
  STRATEGIES.forEach(function (s) { s.tips.forEach(function (t) { all.push({ tip: t, part: s.part, icon: s.icon }); }); });
  var n = 0, d = today(); for (var i = 0; i < d.length; i++) n += d.charCodeAt(i);
  return { tip: all[n % all.length], count: all.length };
}
function iconOf(name) { return GAME_ICON_PATHS[name] ? name : "lightning-bow"; }

export function Home(p) {
  var [tipOpen, setTipOpen] = useState(false);
  var u = p.u, now = new Date(), lv = getLevel(u.xp), lg = getEffectiveLeague(u.weeklyXp, u.moduleScores);
  var dd = u.daily && u.daily.date === today() && u.daily.done;
  var f = homeFocus(u, now, p.pendingChests || 0), hero = f.hero, bonus = bonusLine(u, now);
  var chestTier = Math.max(0, Math.min(3, p.pendingChestTier || 0));
  // Festival theme appliqué par App (p.festId, déjà filtré par l'opt-out). « Turn off » reste ici : c'est
  // une des deux surfaces d'opt-out (l'autre : Profile → Style).
  var fest = p.festId ? festivalById(p.festId) : null;
  var t = tipOfDay();
  function go(it) { if (it.kind === "chest") p.onOpenChest(); else p.nav(it.mod); }
  return (
<div className="enter hm-wrap">
  <div className="hm-head">
    <div>
      <p className="hm-hello">{fest ? fest.greeting : "Welcome back"}</p>
      <h1 className="out hm-name">{u.name} {renderAv(u.avatar, 26, u.equippedFrame)}</h1>
      {u.equippedTitle && TITLES[u.equippedTitle] && <div className="out hm-title" style={{ color: tone(TITLES[u.equippedTitle].color) }}>{TITLES[u.equippedTitle].name}</div>}
    </div>
    <div className="hm-streak">
      {u.streak > 0 ? <GIcon name="flame" size={26} color="var(--orange)" /> : <span>{"❄️"}</span>}
      <b className="out" style={{ color: u.streak > 0 ? "var(--orange)" : "var(--t3)" }}>{u.streak}</b>
    </div>
  </div>

  {/* Niveau + ligue en une ligne : le signal hebdo (« this week ») reste, c'est lui que la Ligue classe. */}
  <button className="hm-level" onClick={function () { p.tabGo("league"); }}>
    <span className="hm-lvl out">{lv.level}</span>
    <span className="hm-level-mid">
      <span className="hm-level-row"><b className="out">{"Level " + lv.level}</b><span>{lv.cur + " / " + lv.next + " XP" + (u.weeklyXp > 0 ? " · " + u.weeklyXp + " this week" : "")}</span></span>
      <Bar value={lv.cur} max={lv.next} h={4} />
    </span>
    <span className="hm-league"><LeagueIcon lg={lg} size={14} /><span className="out" style={{ color: tone(lg.color) }}>{lg.name}</span></span>
  </button>

  {/* La porte : un seul grand bouton. Coffre en tête garde son pulse (seule animation de Home). */}
  {hero
    ? <div className={"crd hm-hero" + (hero.kind === "chest" ? " chest" : "")} style={{ animation: hero.kind === "chest" ? "pulse 2.4s infinite" : "none" }}>
        <div className="hm-hero-top">
          <span className="hm-hero-icon">{hero.kind === "chest"
            ? <TreasureChestSvg size={54} tier={chestTier} idSuffix="home" />
            : <GIcon name={iconOf(hero.icon)} size={30} color="var(--cyan)" />}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="hm-eyebrow out">{hero.eyebrow + (hero.reward && hero.sub.indexOf(hero.reward) < 0 ? " · " + hero.reward : "")}</div>
            <div className="hm-hero-title out">{hero.title}</div>
            <div className="hm-hero-sub">{hero.sub}</div>
          </div>
        </div>
        <button className="btn1 hm-hero-btn" onClick={function () { go(hero); }}>{hero.kind === "chest" ? "Open" : "Start"}</button>
        {bonus && hero.kind !== "chest" && <div className="hm-bonus">{"Active now: " + bonus}</div>}
      </div>
    : <div className="crd hm-hero calm">
        <div className="hm-eyebrow out">{"Today"}</div>
        <div className="hm-hero-title out">{f.pathDone ? "Today's path complete" : "Nothing due today"}</div>
        <div className="hm-hero-sub">{dd ? "Anything more is a bonus." : "The Daily Challenge is still open below."}</div>
        {bonus && <div className="hm-bonus">{"Active now: " + bonus}</div>}
      </div>}

  {(f.also.length > 0 || f.hasPath) && <div className="hm-also">
    {f.also.length > 0 && <div className="hm-also-h out">{"Also today"}</div>}
    {f.also.map(function (it) {
      return (<button key={it.id} className="hm-row" onClick={function () { go(it); }}>
        <GIcon name={iconOf(it.icon)} size={16} color="var(--t2)" />
        <span className="hm-row-t">{it.title}</span>
        {it.reward && <span className="hm-row-s">{it.reward}</span>}
        <span className="hm-go">{"›"}</span>
      </button>);
    })}
    {f.hasPath && <button className="hm-row hm-more" onClick={function () { p.openPath(); }}>
      {(f.more > 0 ? "+" + f.more + " more on today's path" : "Today's path") + " ›"}
    </button>}
  </div>}

  {/* Daily Challenge : bloc à part (décision du 23/09), réflexe « jouer maintenant », +100 XP. */}
  <div className={"crd hm-daily" + (dd ? " done" : "")} onClick={function () { if (!dd) p.nav("daily"); }}>
    <GIcon name={dd ? "trophy-cup" : "lightning-bow"} size={24} color={dd ? "var(--green)" : "var(--cyan)"} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="out" style={{ fontWeight: 800, fontSize: 15, color: dd ? "var(--green)" : "var(--t1)" }}>{"Daily Challenge"}</div>
      <div style={{ fontSize: 12, color: dd ? "var(--green)" : "var(--t2)" }}>{dd ? "Challenge complete! +" + u.daily.xpE + " XP earned" : "5 grammar questions · 30s each · +100 XP"}</div>
    </div>
    {!dd && <span className="hm-go" style={{ color: "var(--cyan)" }}>{"›"}</span>}
  </div>

  {/* Évènements : une ligne chacun. Spotlight cliquable (module cible), Flash Hour et Underdog non. */}
  {(p.events || []).map(function (ev, ei) {
    var cfg = ev.config || {}, m = cfg.multiplier || 2;
    var h = Math.max(0, Math.round((new Date(ev.end_at) - now) / 36e5));
    var left = h >= 24 ? Math.floor(h / 24) + "d " + h % 24 + "h left" : h + "h left";
    var under = ev.type === "underdog", above = under && u.xp >= (p.medianXp || 0);
    var target = ev.type === "spotlight" && cfg.module ? cfg.module : null;
    var sub = ev.description || (ev.type === "spotlight" ? "×" + m + " XP on " + cfg.module : ev.type === "flash_hour" ? "×" + m + " XP on everything" : "×" + m + " XP if below class median");
    return (<div key={ei} className={"hm-tick" + (target ? " link" : "")} onClick={target ? function () { p.nav(target); } : undefined}>
      <GIcon name={ev.type === "spotlight" ? "bullseye" : "lightning-storm"} size={14} color="var(--gold)" />
      <b className="out">{ev.title}</b>
      <span>{above ? "You are above the median" : sub}</span>
      <em>{left}</em>
      {target && <span className="hm-go">{"›"}</span>}
    </div>);
  })}
  {fest && <div className="hm-tick">
    <GIcon name={fest.icon} size={14} color="var(--cyan)" />
    <b className="out">{fest.name}</b>
    <span>{festivalDaysLeft(fest, now) === 0 ? "last day" : festivalDaysLeft(fest, now) + "d left"}</span>
    <button className="hm-off" onClick={function () { p.onFestivalsOff(); }}>{"Turn off"}</button>
  </div>}

  <button className="hm-tip" onClick={function () { setTipOpen(!tipOpen); }} aria-expanded={tipOpen}>
    <GIcon name="candle-flame" size={14} color="var(--t3)" />
    <span className="out">{"Tip of the day · " + t.tip.part}</span>
    <span>{tipOpen ? "−" : "+"}</span>
  </button>
  {tipOpen && <div className="hm-tip-body">
    <b className="out">{t.tip.tip.t}</b>
    <p>{t.tip.tip.d}</p>
    <button className="hm-tip-all" onClick={function () { p.nav("strats"); }}>{"All " + t.count + " strategies →"}</button>
  </div>}
</div>);
}
