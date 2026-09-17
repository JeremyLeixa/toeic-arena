// Proto « moments de victoire » — briques communes aux 3 écrans de fin.
import { useEffect, useRef, useState } from "react";
import { GIcon } from "../../src/components/icons.jsx";
import { TreasureChestSvg } from "../../src/components/avatar.jsx";
import { getLevel } from "../../src/data/helpers.js";

// ── Bandes de résultat ── couleurs de jeton pour l'écran intégré (V1), hex fixes pour les scènes
// à fond fixe (V2 sombre, V3 parchemin).
export function band(sc, tot) { var a = sc / tot; return a === 1 ? "perfect" : a >= 0.8 ? "great" : a >= 0.5 ? "fair" : "hard"; }
export var BANDS = {
  perfect: { icon: "trophy-cup", color: "var(--gold)", hex: "#f0c850", title: "Flawless!", sub: "Not a single mistake." },
  great: { icon: "trophy-cup", color: "var(--gold)", hex: "#f0c850", title: "Great round", sub: "Sharp work. A few details to polish." },
  fair: { icon: "crossed-swords", color: "var(--cyan)", hex: "#d4943a", title: "Well fought", sub: "Good base. Your mistakes show the way." },
  hard: { icon: "templar-shield", color: "var(--t2)", hex: "#9aa6b8", title: "Tough round", sub: "Every mistake below is a lesson to keep." },
};

// ── Étapes minutées ── durs[i] = attente avant l'étape i+1. `hold` fige la progression (cérémonie
// ouverte), `skip` saute à la fin.
export function useStages(durs, skip, hold) {
  var [stage, setStage] = useState(0);
  var len = durs.length;
  useEffect(function () {
    if (skip) { if (stage !== len) setStage(len); return; }
    if (hold || stage >= len) return;
    var id = setTimeout(function () { setStage(function (s) { return s + 1; }); }, durs[stage]);
    return function () { clearTimeout(id); };
  }, [stage, skip, hold, len]);
  return stage;
}

// ── Compteur ── 0 → to, ease-out ; tick() à chaque nouvelle valeur (le son se limite lui-même).
export function useCount(active, to, dur, tick) {
  var [v, setV] = useState(0);
  var tickRef = useRef(tick); tickRef.current = tick;
  useEffect(function () {
    if (!active) return;
    if (dur <= 0) { setV(to); return; }
    var t0 = performance.now(), raf = 0, last = -1;
    function step(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3), nv = Math.round(to * e);
      if (nv !== last) { last = nv; setV(nv); if (tickRef.current && k < 1) tickRef.current(); }
      if (k < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return function () { cancelAnimationFrame(raf); };
  }, [active, to, dur]);
  return active ? v : 0;
}

// ── Remplissage d'XP avec passage de niveau ── la barre monte jusqu'au bout, marque une pause
// pleine (onLevel est appelé au début de la pause), se vide, puis finit sa course.
export function useXpFill(active, fromXp, toXp, dur, onLevel) {
  var [xp, setXp] = useState(fromXp);
  var cb = useRef(onLevel); cb.current = onLevel;
  var fired = useRef(false);
  useEffect(function () {
    if (!active) return;
    var L0 = getLevel(fromXp).level, L1 = getLevel(toXp).level;
    if (dur <= 0) {
      setXp(toXp);
      if (L1 > L0 && !fired.current) { fired.current = true; cb.current(L1, true); }
      return;
    }
    var segs;
    if (L1 > L0) {
      var lv = getLevel(fromXp), xc = fromXp - lv.cur + lv.next; // début du niveau suivant
      segs = [{ a: fromXp, b: xc - 0.01, d: dur * 0.55 }, { hold: 520, at: xc }, { a: xc, b: toXp, d: Math.max(250, dur * 0.45) }];
    } else segs = [{ a: fromXp, b: toXp, d: dur }];
    var i = 0, t0 = performance.now(), raf = 0;
    function step(t) {
      var sg = segs[i], k = Math.min(1, (t - t0) / (sg.hold || sg.d));
      if (sg.hold) {
        if (!fired.current) { fired.current = true; cb.current(L1, false); }
      } else {
        var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        setXp(sg.a + (sg.b - sg.a) * e);
      }
      if (k >= 1) { i++; t0 = t; if (i >= segs.length) return; }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return function () { cancelAnimationFrame(raf); };
  }, [active, dur]);
  return xp;
}

// ── Particules ── éclat centré sur un élément (moteur du coffre v3).
export function burstAt(fx, el, colors, big) {
  if (!fx || !el) return;
  var r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  fx.emit({ x: x, y: y, count: big ? 60 : 34, color: colors, speed: [2, big ? 9 : 6.5], spread: 180, life: [26, 58], size: [1, 2.8], gravity: 0.05, drag: 0.95 });
  fx.emit({ x: x, y: y, count: big ? 26 : 14, color: colors, kind: "ember", speed: [0.6, 2.4], spread: 180, life: [50, 90], size: [1, 2.4], gravity: -0.01, drag: 0.98 });
}

// ── Anneau de score ──
export function ScoreRing(p) {
  var r = 42, C = 2 * Math.PI * r, pct = p.tot ? p.sc / p.tot : 0;
  return (
    <div className="vx-ring" style={{ width: p.size, height: p.size }}>
      <svg viewBox="0 0 100 100" width={p.size} height={p.size}>
        <circle cx="50" cy="50" r={r} className="vx-ring-bg" />
        <circle cx="50" cy="50" r={r} className="vx-ring-fg" transform="rotate(-90 50 50)"
          style={{ stroke: p.color, strokeDasharray: C, strokeDashoffset: p.on ? C * (1 - pct) : C, transition: p.instant ? "none" : "stroke-dashoffset 900ms cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <div className="vx-ring-c"><b className="out">{p.sc}<small>/{p.tot}</small></b><span>{Math.round(pct * 100)}%</span></div>
    </div>
  );
}

// ── Barre de niveau ── `level` = niveau affiché (bascule au début de la pause), `flash` relance l'éclat.
export function LevelBar(p) {
  var lv = getLevel(Math.floor(p.xp)), pct = Math.min(100, (lv.cur / lv.next) * 100);
  var up = p.flash > 0;
  return (
    <div className={"vx-lvl" + (up ? " is-up" : "")}>
      <div className="vx-medal" ref={p.medalRef}>
        <span key={p.level} className={"vx-medal-n out" + (up ? " flip" : "")}>{p.level}</span>
        {up && <span key={"f" + p.flash} className="vx-medal-flash" />}
      </div>
      <div className="vx-lvl-body">
        <div className="vx-lvl-row">
          <span className="out vx-lvl-name">{up ? "Level up!" : "Level " + p.level}</span>
          <span className="vx-lvl-xp">{Math.floor(lv.cur)} / {lv.next} XP</span>
        </div>
        <div className="vx-bar"><div className="bar-fill vx-bar-fill" style={{ width: pct + "%" }} /></div>
      </div>
    </div>
  );
}

// ── Détail de l'XP ──
export function Ledger(p) {
  return (
    <div className="vx-ledger">
      {p.lines.map(function (l, i) {
        return (
          <div key={i} className={"vx-line vx-" + l.kind + (i < p.shown ? " on" : "")}>
            <span className="vx-line-l">{l.label}<em>{l.detail}</em></span>
            <span className="vx-line-v">{l.value}</span>
          </div>
        );
      })}
      {p.hint && <div className={"vx-hint" + (p.shown >= p.lines.length ? " on" : "")}><GIcon name="candle-flame" size={13} color="currentColor" />{p.hint}</div>}
    </div>
  );
}

// ── Erreurs à revoir ── le blanc de l'énoncé montre la bonne réponse.
function Stem(p) {
  if (p.m.noBlank) return <span>{"“" + p.m.prompt + "”"}</span>;
  var parts = p.m.prompt.split(/_{3,}/);
  if (parts.length < 2) return <span>{p.m.prompt}</span>;
  return <span>{parts[0]}<mark className="vx-blank">{p.m.correct}</mark>{parts.slice(1).join("_____")}</span>;
}
export function Mistakes(p) {
  var [open, setOpen] = useState(!!p.open);
  var n = p.items.length;
  if (!n) return <div className="vx-clean"><GIcon name="check-mark" size={18} color="var(--green)" />No mistakes to review</div>;
  return (
    <div className="vx-mis">
      <button className="vx-mis-head" onClick={function (e) { e.stopPropagation(); setOpen(!open); }}>
        <span className="out">{p.title || "Review your mistakes"}</span>
        <span className="vx-mis-count">{n}</span>
        <span className={"vx-mis-chev" + (open ? " open" : "")}>{"›"}</span>
      </button>
      {open && p.items.map(function (m, i) {
        return (
          <div key={i} className="vx-mis-item">
            <div className="vx-mis-tag">{m.tag}</div>
            <div className="vx-mis-q qstem"><Stem m={m} /></div>
            <div className="vx-mis-ans"><span className="vx-no">{m.yours}</span><span className="vx-yes">{m.correct}</span></div>
            <div className="vx-mis-why">{m.why}</div>
          </div>
        );
      })}
    </div>
  );
}

var CHEST_NAME = ["Novice", "Warrior", "Champion", "Legendary"];
export function ChestRewards(p) {
  if (!p.chests.length) return null;
  return (
    <div className="vx-chests">
      {p.chests.map(function (c, i) {
        return (
          <div key={i} className={"home-chest t" + c.tier + " vx-chest"} style={{ animationDelay: i * 140 + "ms" }}>
            <span className="home-chest-art"><TreasureChestSvg size={56} tier={c.tier} idSuffix={"vx" + (p.id || "") + i} /></span>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div className="out vx-chest-t">{CHEST_NAME[c.tier] + " chest"}</div>
              <div className="vx-chest-s">{c.label}</div>
            </div>
            <span className="vx-chest-cta out">Open</span>
          </div>
        );
      })}
    </div>
  );
}
