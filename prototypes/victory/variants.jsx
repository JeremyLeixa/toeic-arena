// Proto « moments de victoire » — les 3 écrans de fin.
//   V1 Grand livre  : dans le style de l'appli (jetons, cartes), tout s'empile en cascade.
//   V2 Arène        : scène sombre plein écran façon coffre v3, écusson, gros compteur, panneau bas.
//   V3 Verdict      : parchemin d'Aldric, verdict écrit, sceau de cire, lignes à l'encre.
// Même chef d'orchestre (useDirector) : étapes minutées, compteur, remplissage de niveau,
// cérémonies en surimpression, tap n'importe où = tout afficher.
import { useEffect, useRef, useState } from "react";
import { GIcon } from "../../src/components/icons.jsx";
import { NextStepReco } from "../../src/components/NextStepReco.jsx";
import { getLevel } from "../../src/data/helpers.js";
import { tone } from "../../src/lib/tone.js";
import { band, BANDS, useStages, useCount, useXpFill, burstAt, ScoreRing, LevelBar, Ledger, Mistakes, ChestRewards } from "./parts.jsx";
import { LevelUpOverlay, LeaguePromotion } from "./ceremonies.jsx";

var noop = function () {};
function cxHex() {
  try { return getComputedStyle(document.querySelector(".app")).getPropertyValue("--cx-hex").trim() || "#d4943a"; }
  catch (e) { console.warn("[victory] cx:", e && e.message); return "#d4943a"; }
}
function range(n, v) { var a = []; for (var i = 0; i < n; i++) a.push(v); return a; }

function useDirector(p, S) {
  var r = p.r;
  var [skip, setSkip] = useState(!!p.reduced);
  var [overlay, setOverlay] = useState(null);
  var stage = useStages(S.durs, skip, !!overlay);
  var total = useCount(stage >= S.total, r.total, skip ? 0 : S.countDur, p.snd.tick);
  var [level, setLevel] = useState(getLevel(r.fromXp).level);
  var [flash, setFlash] = useState(0);
  var xp = useXpFill(stage >= S.level, r.fromXp, r.toXp, skip ? 0 : 1500, function (L, instant) {
    setLevel(L);
    if (instant) return;
    if (p.levelMode === "overlay") { setOverlay({ kind: "level", level: L }); return; }
    setFlash(function (f) { return f + 1; });
    p.snd.levelUp();
    burstAt(p.fx, S.medalRef.current, S.burst ? S.burst() : [cxHex(), "#fff2b0", "#ffd65a"]);
  });
  var leagueFired = useRef(false);
  useEffect(function () {
    if (skip || !r.leagueUp || stage < S.league || leagueFired.current) return;
    leagueFired.current = true;
    if (p.leagueMode === "card") p.snd.league();
    else setOverlay({ kind: "league" });
  }, [stage, skip]);
  var totalDone = useRef(false);
  useEffect(function () {
    if (totalDone.current || stage < S.total || total !== r.total || r.total <= 0) return;
    totalDone.current = true;
    if (!skip) (S.onTotal || p.snd.xp)();
  }, [total, stage]);
  function skipAll() { if (!skip) { setSkip(true); setOverlay(null); } }
  var el = null;
  if (overlay && overlay.kind === "level") el = <LevelUpOverlay level={overlay.level} toXp={r.toXp} fx={p.fx} snd={p.snd} onClose={function () { setOverlay(null); }} />;
  if (overlay && overlay.kind === "league") el = <LeaguePromotion mode={p.leagueMode} from={r.leagueUp.from} to={r.leagueUp.to} weekly={r.weekly.to} next={r.nextLeague}
    chest={r.chests.find(function (c) { return c.tier === 1; })} fx={p.fx} snd={p.snd} onClose={function () { setOverlay(null); }} />;
  var done = stage >= S.durs.length;
  return { stage: stage, skip: skip, skipAll: skipAll, total: total, xp: xp, level: level, flash: flash, overlayEl: el, done: done };
}

function hintOf(r) { var h = r.lines.filter(function (l) { return l.hint; }); return h.length ? h[h.length - 1].hint : null; }
function SkipHint(p) { return p.show ? <div className="vx-skiphint">Tap to skip</div> : null; }

// ═════════════════════════ V1 · Grand livre ═════════════════════════
export function ResultLedger(p) {
  var s = p.s, r = p.r, B = BANDS[band(s.sc, s.tot)], n = r.lines.length;
  var medalRef = useRef(null);
  var S = { durs: [350, 650].concat(range(n - 1, 260)).concat([300, 1000, 1800, r.leagueUp ? 700 : 60]),
    total: n + 2, level: n + 3, league: n + 4, countDur: 900, medalRef: medalRef };
  var d = useDirector(p, S);
  var shown = Math.max(0, Math.min(n, d.stage - 1));
  var lu = r.leagueUp;
  return (
    <div className={"vx-page vx-v1" + (d.skip ? " vx-skip" : "")} onClick={d.skipAll}>
      <SkipHint show={!d.done} />
      <div className="vx-hero">
        <div className="vx-grade"><GIcon name={B.icon} size={60} color={B.color} /></div>
        <h1 className="out vx-title">{B.title}</h1>
        <p className="vx-sub">{s.mod.name + " · " + B.sub}</p>
      </div>
      <div className="crd vx-card vx-score">
        <ScoreRing sc={s.sc} tot={s.tot} size={96} on={d.stage >= 1} instant={d.skip} color={B.color} />
        <div className="vx-score-side">
          <div className="vx-stat"><span>Accuracy</span><b>{Math.round((s.sc / s.tot) * 100)}%</b></div>
          <div className="vx-stat"><span>Streak</span><b><GIcon name="flame" size={13} color="var(--orange)" style={{ verticalAlign: "-2px", marginRight: 3 }} />{r.streak} days</b></div>
          <div className="vx-stat"><span>This week</span><b>{r.weekly.to.toLocaleString("en-US")} XP</b></div>
        </div>
      </div>
      <div className="crd vx-card">
        <div className="vx-card-h">XP earned</div>
        <Ledger lines={r.lines} shown={shown} hint={hintOf(r)} />
        <div className={"vx-total vx-reveal" + (d.stage >= S.total ? " on" : "")}>
          <span className="out vx-total-l">Total</span>
          <span className="out vx-total-v">{"+" + d.total + " XP"}</span>
        </div>
      </div>
      <div className={"crd vx-card vx-reveal" + (d.stage >= S.level ? " on" : "")}>
        <LevelBar xp={d.xp} level={d.level} flash={p.levelMode === "overlay" ? 0 : d.flash} medalRef={medalRef} />
      </div>
      {lu && <div className={"crd vx-card vx-reveal vx-league" + (d.stage >= S.league ? " on" : "")}>
        <span className="vx-lg-icons">
          <GIcon name={lu.from.gi} size={24} color={tone(lu.from.color)} />{"→"}<GIcon name={lu.to.gi} size={30} color={tone(lu.to.color)} />
        </span>
        <div style={{ flex: 1 }}>
          <div className="out vx-league-t" style={{ color: tone(lu.to.color) }}>{"Promoted to " + lu.to.name}</div>
          <div className="vx-league-s">{r.weekly.to.toLocaleString("en-US") + " XP this week" + (r.nextLeague ? " · " + r.nextLeague.name + " at " + r.nextLeague.min.toLocaleString("en-US") : "")}</div>
        </div>
      </div>}
      {d.done && <ChestRewards chests={r.chests} id="v1" />}
      <div className={"crd vx-card vx-reveal" + (d.done ? " on" : "")}><Mistakes items={s.mistakes} /></div>
      {d.done && <div className="vx-reveal on"><NextStepReco u={s.user} fromMod={s.mod.id} nav={noop} /></div>}
      <div className="vx-cta" onClick={function (e) { e.stopPropagation(); }}>
        <button className="btn2 out">Play again</button>
        <button className="btn1 out">Continue</button>
      </div>
      {d.overlayEl}
    </div>
  );
}

// ═════════════════════════ V2 · Arène ═════════════════════════
export function ResultArena(p) {
  var s = p.s, r = p.r, B = BANDS[band(s.sc, s.tot)], n = r.lines.length;
  var medalRef = useRef(null);
  var S = { durs: [250, 650, 500].concat(range(n - 1, 320)).concat([700, 1800, r.leagueUp ? 700 : 60]),
    total: 3, level: n + 3, league: n + 4, countDur: n * 320 + 300, medalRef: medalRef,
    burst: function () { return ["#ffd65a", "#fff2b0", B.hex]; }, onTotal: p.snd.collect };
  var d = useDirector(p, S);
  var shown = Math.max(0, Math.min(n, d.stage - 2));
  useEffect(function () { if (d.skip) return; if (d.stage === 1) p.snd.thud(); if (d.stage === 2) p.snd.knock(); }, [d.stage]);
  var lv = getLevel(Math.floor(d.xp)), R = 78, C = 2 * Math.PI * R, pct = lv.cur / lv.next;
  var up = p.levelMode !== "overlay" && d.flash > 0;
  var lu = r.leagueUp;
  return (
    <div className={"vx-arena" + (d.skip ? " vx-skip" : "")} style={{ "--vx-hex": B.hex, "--vx-glow": B.hex + "55" }} onClick={d.skipAll}>
      <SkipHint show={!d.done} />
      <div className={"vx-arena-glow" + (d.stage >= 1 ? " on" : "")} />
      <div className="vx-arena-in">
        <div className={"vx-crest-wrap" + (up ? " up" : "")} ref={medalRef}>
          <svg className="vx-crest-ring" viewBox="0 0 170 170" width="170" height="170">
            <circle cx="85" cy="85" r={R} stroke="rgba(232,200,144,.12)" />
            <circle cx="85" cy="85" r={R} stroke="#f0c850" strokeLinecap="round" transform="rotate(-90 85 85)"
              style={{ strokeDasharray: C, strokeDashoffset: C * (1 - (d.stage >= 1 ? pct : 0)), opacity: d.stage >= S.level ? 1 : 0.35, transition: "opacity .4s" }} />
          </svg>
          <div className={"vx-crest" + (d.stage >= 1 || d.skip ? " drop" : "")}><GIcon name={B.icon} size={64} color={B.hex} /></div>
          <div key={"lv" + d.level} className={"vx-crest-lv out" + (up ? " up" : "")}>{up ? "LEVEL UP · " + d.level : "LV " + d.level}</div>
        </div>
        <div className={"vx-arena-score out" + (d.stage >= 2 ? " on" : "")}>{s.sc}<small>{"/" + s.tot}</small></div>
        <div className="vx-arena-title out">{B.title}</div>
        <div className="vx-bigxp out">{"+" + d.total}<small>XP</small></div>
        <div className="vx-chips">
          {r.lines.map(function (l, i) {
            return <span key={i} className={"vx-chip vx-" + l.kind + (i < shown ? " on" : "")}>{l.label}<b>{l.kind === "base" ? l.value : l.detail}</b></span>;
          })}
        </div>
        <div className="vx-arena-lvl">{"Level " + d.level + " · " + Math.floor(lv.cur) + " / " + lv.next + " XP"}</div>
        <div className={"vx-sheet" + (d.done ? " up" : "")}>
          {hintOf(r) && <div className="vx-hint on"><GIcon name="candle-flame" size={13} color="currentColor" />{hintOf(r)}</div>}
          {lu && <div className="vx-panel vx-league">
            <span className="vx-lg-icons"><GIcon name={lu.from.gi} size={22} color={lu.from.color} />{"→"}<GIcon name={lu.to.gi} size={28} color={lu.to.color} /></span>
            <div style={{ flex: 1 }}><div className="out vx-league-t" style={{ color: lu.to.color }}>{"Promoted to " + lu.to.name}</div>
              <div className="vx-league-s">{r.weekly.to.toLocaleString("en-US") + " XP this week"}</div></div>
          </div>}
          <ChestRewards chests={d.done ? r.chests : []} id="v2" />
          <div className="vx-panel"><Mistakes items={s.mistakes} /></div>
          <div className="vx-sheet-cta" onClick={function (e) { e.stopPropagation(); }}>
            <button className="btn2 out">Play again</button>
            <button className="btn1 out">Continue</button>
          </div>
        </div>
      </div>
      {d.overlayEl}
    </div>
  );
}

// ═════════════════════════ V3 · Verdict d'Aldric ═════════════════════════
function verdictOf(s) {
  var b = band(s.sc, s.tot), name = s.user.name;
  if (b === "perfect") return "A flawless round, " + name + ". Not a single blow wasted.";
  if (b === "great") return s.sc + " of " + s.tot + " strikes landed true. Your blade grows sharper.";
  if (b === "fair") return "A fair fight, " + name + ". The Arena has marked where you faltered.";
  return "A hard battle, " + name + ". Even veterans fall before they rise.";
}
function epilogueOf(r) {
  var t = [];
  if (r.lines.some(function (l) { return /run today/.test(l.label); })) t.push("This trial was already fought today: the Arena pays fresh steel best.");
  if (r.levelUp) t.push("You now stand at level " + r.levelUp.to + ".");
  if (r.leagueUp) t.push("The stands take notice: you rise to the " + r.leagueUp.to.name + " League.");
  return t.join(" ");
}
export function ResultVerdict(p) {
  var s = p.s, r = p.r, n = r.lines.length;
  var medalRef = useRef(null);
  var S = { durs: [300, 1300, 700].concat(range(n - 1, 380)).concat([420, 1000, 1800, r.leagueUp ? 700 : 60]),
    total: n + 3, level: n + 4, league: n + 5, countDur: 800, medalRef: medalRef,
    burst: function () { return ["#f0d070", "#fff2b0", "#c9a23a"]; } };
  var d = useDirector(p, S);
  var shown = Math.max(0, Math.min(n, d.stage - 2));
  useEffect(function () { if (!d.skip && d.stage === 2) p.snd.thud(); }, [d.stage]);
  var ep = epilogueOf(r);
  var date = s.now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div className={"vx-page vx-verdict" + (d.skip ? " vx-skip" : "")} onClick={d.skipAll}>
      <SkipHint show={!d.done} />
      <div className="vx-scroll">
        <div className="vx-roll" />
        <div className="vx-parch">
          <div className="vx-sigil"><GIcon name="wizard-staff" size={30} color="#6b3410" /></div>
          <div className="vx-chron out">{"The Chronicle of " + s.user.name}</div>
          <div className="vx-date">{s.mod.name + " · " + date}</div>
          <p className={"vx-ink" + (d.stage >= 1 ? " on" : "")}>{verdictOf(s)}</p>
          <div className={"vx-seal" + (d.stage >= 2 ? " on" : "")}><b>{s.sc}</b><small>{"of " + s.tot}</small></div>
          <div className="vx-ilines">
            {r.lines.map(function (l, i) {
              return <div key={i} className={"vx-iline vx-" + l.kind + (i < shown ? " on" : "")}><span>{l.label}<em>{l.detail}</em></span><span>{l.value}</span></div>;
            })}
          </div>
          <div className={"vx-itotal out" + (d.stage >= S.total ? " on" : "")}>{"+" + d.total + " XP"}</div>
          {hintOf(r) && <div className={"vx-inote" + (d.stage >= S.total ? " on" : "")}>{hintOf(r)}</div>}
          <div className={"vx-ilvl" + (d.stage >= S.level ? " on" : "")}>
            <LevelBar xp={d.xp} level={d.level} flash={p.levelMode === "overlay" ? 0 : d.flash} medalRef={medalRef} />
          </div>
          {ep && <p className={"vx-ink vx-epi" + (d.stage >= S.league ? " on" : "")}>{ep}</p>}
        </div>
        <div className="vx-roll" />
      </div>
      {d.done && <ChestRewards chests={r.chests} id="v3" />}
      <div className={"crd vx-card vx-reveal" + (d.done ? " on" : "")}><Mistakes items={s.mistakes} title="Lessons to keep" /></div>
      <div className="vx-cta" onClick={function (e) { e.stopPropagation(); }}>
        <button className="btn2 out">Play again</button>
        <button className="btn1 out">Continue</button>
      </div>
      {d.overlayEl}
    </div>
  );
}
