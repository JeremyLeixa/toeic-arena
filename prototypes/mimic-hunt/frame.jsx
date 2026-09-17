// Proto « Mimic Hunt » — une partie, pilotée par l'URL.
//   v=1|2|3 (variante du démasquage)  mode=dark|light  skin=<id>  rm=1 (mouvement réduit)
//   start=intro | <index 0-11> (saute l'intro, ouvre sur l'item) | end (écran de fin, partie simulée)
// La fin de partie passe par le VRAI écran de fin (src/components/SessionResult.jsx), XP calculée
// comme settleSession dans App() : gateSteps puis settleXp de lib/xp.js.
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { gateSteps, settleXp } from "../../src/lib/xp.js";
import { getLeague } from "../../src/lib/league.js";
import { fresh } from "../../src/lib/profileSchema.js";
import { SessionResult } from "../../src/components/SessionResult.jsx";
import MH from "./mimic.css?raw";
import { MimicHunt } from "./game.jsx";
import { ITEMS, TIERS } from "./items.js";

var q = new URLSearchParams(location.search);
var V = q.get("v") || "1", MODE = q.get("mode") || "dark", SKIN = q.get("skin") || "";
var START = q.get("start") || "intro", RM = q.get("rm") === "1";
var START_IDX = /^\d+$/.test(START) ? Math.min(ITEMS.length - 1, parseInt(START, 10)) : 0;
var RM_CSS = "*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}";

// Jeudi 17 septembre 2026, 15 h : pas de bonus week-end, chiffres stables.
var NOW = new Date(2026, 8, 17, 15, 0, 0);
var TD = NOW.toISOString().split("T")[0];

function player() {
  var u = fresh("Camille", "idrac2026");
  Object.assign(u, { tutorialPending: false, gdprConsent: true, joinedAt: "2026-09-01", lastActive: TD, streak: 4, xp: 5200, weeklyXp: 420 });
  return u;
}

// XP du proto : 15 + 5 par bonne réponse + 3 par Mimic démasqué, +25 sans faute. À caler au câblage.
function buildSession(res, id) {
  var u = player(), r = res.results;
  var sc = r.filter(function (x) { return x.ok; }).length, tot = Math.max(1, r.length);
  var caught = r.filter(function (x) { return x.caught; }).length;
  var base = 15 + 5 * sc + 3 * caught + (sc === tot ? 25 : 0);
  var g = gateSteps(base, sc, tot, "mimic", { u: u, now: NOW, events: [], spotlight: true });
  var st = settleXp(u, g.xp, { now: NOW, events: [], classMedianXp: 0, leagueOf: getLeague });
  return {
    id: id, sp: "mimic", modId: "mimic", sc: sc, tot: tot, userName: u.name,
    steps: g.steps.concat(st.steps), total: st.amt, fromXp: u.xp, toXp: st.c.xp,
    levelUp: st.levelUp, leagueUp: st.leagueUp, weekly: { from: u.weeklyXp, to: st.c.weeklyXp }, streak: st.c.streak,
    chests: [], achievements: [], marks: [],
  };
}

// start=end : 9 bonnes réponses sur 12, 3 morsures, des Mimics démasqués selon la variante.
function simulatedRun() {
  var results = [], mistakes = [];
  ITEMS.forEach(function (it, i) {
    var ok = i % 4 !== 3, bait = Number(Object.keys(it.mimics)[0]);
    results.push({ id: it.id, ok: ok, bitten: !ok, caught: V === "3" || !ok ? null : i % 3 !== 2 });
    if (!ok) mistakes.push({ tag: "Mimic Hunt · Tier " + TIERS[it.tier].roman + " · Mimic", prompt: it.src, noBlank: true,
      yours: it.opts[bait], correct: it.opts[it.c], why: it.exp });
  });
  return { results: results, mistakes: mistakes };
}

function Stats(p) {
  var r = p.res.results;
  function n(f) { return r.filter(f).length; }
  return (
    <div className="crd mh-stats">
      <div><div className="out mh-stat" style={{ color: "var(--green)" }}>{n(function (x) { return x.ok; })}</div><div className="mh-stat-l">Right answers</div></div>
      <div><div className="out mh-stat" style={{ color: "var(--cyan)" }}>{V === "3" ? "—" : n(function (x) { return x.caught; })}</div><div className="mh-stat-l">Mimics caught</div></div>
      <div><div className="out mh-stat" style={{ color: "var(--red)" }}>{n(function (x) { return x.bitten; })}</div><div className="mh-stat-l">Mimic bites</div></div>
    </div>
  );
}

function Frame() {
  var [run, setRun] = useState(0);
  var [res, setRes] = useState(START === "end" ? simulatedRun : null);
  var session = useMemo(function () { return res ? buildSession(res, run + 1) : null; }, [res, run]);
  var lc = "app" + (MODE === "light" ? " light" : "") + (SKIN ? " skin-" + SKIN : "");
  function restart() { setRes(null); setRun(function (k) { return k + 1; }); }
  return (
    <div className={lc}>
      <style>{CSS}</style>
      <style>{MH}</style>
      {RM && <style>{RM_CSS}</style>}
      {!res && <MimicHunt key={run} variant={V} start={START_IDX} intro={START === "intro" || START === "end"} onBack={restart} onFinish={setRes} />}
      {res && session && (
        <SessionResult session={session} sid={session.id} name="Mimic Hunt" mistakes={res.mistakes} onContinue={restart} onReplay={restart}>
          <Stats res={res} />
        </SessionResult>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<StrictMode><Frame /></StrictMode>);
