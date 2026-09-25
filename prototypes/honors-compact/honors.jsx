// Proto « honneurs compacts » (2026-09-25). Deux variantes de la liste des honneurs du parchemin, côte à côte :
//   A · actuelle   : un trophée par ligne, une ligne de Darics par octroi.
//   B · compactée  : Darics regroupés par source (« +210 Darics · 7 achievements ») ; au-delà de 4 trophées, les 3
//                    premiers et une ligne « +N more trophies » qui déplie le reste.
// Scénarios : ?sc=wave (la capture de Jérémy : vague du Gauntlet + Front Desk) | mixed (2 trophées, Focus + trophées)
//             | one (un trophée, le cas courant : doit rester identique dans les deux variantes).
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { GIcon } from "../../src/components/icons.jsx";

var SC = {
  wave: {
    achievements: [
      { name: "First Knot", desc: "Complete your first Knotbinder trial" }, { name: "Anchor Dropped", desc: "Complete your first Anchor Hall trial" },
      { name: "Fork in the Road", desc: "Complete your first Twin Paths trial" }, { name: "Knot Master", desc: "Knotbinder: 80%+ accuracy (min 30 Q)" },
      { name: "Harbour Master", desc: "Anchor Hall: 80%+ accuracy (min 30 Q)" }, { name: "Path Master", desc: "Twin Paths: 80%+ accuracy (min 30 Q)" },
      { name: "Open for Business", desc: "Work your first day in Front Desk" }],
    marks: [30, 30, 30, 30, 30, 30, 30].map(function (a) { return { amount: a, label: "Achievement" }; }),
  },
  mixed: {
    achievements: [{ name: "Open for Business", desc: "Work your first day in Front Desk" }, { name: "Streak Master", desc: "Reach a 10-day streak" }],
    marks: [{ amount: 25, label: "Today's Focus" }, { amount: 30, label: "Achievement" }, { amount: 30, label: "Achievement" }],
  },
  one: { achievements: [{ name: "Word Collector", desc: "Review 50 flashcards" }], marks: [{ amount: 30, label: "Achievement" }] },
};
var sc = SC[new URLSearchParams(location.search).get("sc")] || SC.wave;
var COL = /*fond local*/"#8b5a28";

function Trophy(p) { return <div className="sr-honor"><GIcon name="laurel-crown" size={16} color={COL} /><span><b>{p.a.name}</b>{p.a.desc ? " · " + p.a.desc : ""}</span></div>; }
function Mark(p) { return <div className="sr-honor"><GIcon name="daric" size={16} color={COL} /><span><b>{"+" + p.amount + " Darics"}</b>{p.label ? " · " + p.label : ""}</span></div>; }

function Current() {
  return (<div className="sr-honors on">
    {sc.achievements.map(function (a, i) { return <Trophy key={i} a={a} />; })}
    {sc.marks.map(function (m, i) { return <Mark key={i} amount={m.amount} label={m.label} />; })}
  </div>);
}

// Regroupe les Darics par source : même libellé → une ligne, montant cumulé, « N achievements » au pluriel.
function groupMarks(marks) {
  var out = [];
  marks.forEach(function (m) {
    var g = out.find(function (x) { return x.label === m.label; });
    if (g) { g.amount += m.amount; g.n++; } else out.push({ label: m.label, amount: m.amount, n: 1 });
  });
  return out.map(function (g) { return { amount: g.amount, label: g.n > 1 && g.label === "Achievement" ? g.n + " achievements" : g.n > 1 ? g.label + " ×" + g.n : g.label }; });
}
var FOLD_AT = 4, SHOW = 3;
function Compact() {
  var [open, setOpen] = useState(false);
  var list = sc.achievements, fold = list.length > FOLD_AT && !open;
  return (<div className="sr-honors on">
    {(fold ? list.slice(0, SHOW) : list).map(function (a, i) { return <Trophy key={i} a={a} />; })}
    {fold && <button className="sr-honor" style={{ background: "none", border: 0, width: "100%", cursor: "pointer", font: "inherit", fontSize: 13, textAlign: "left", color: "inherit" }} onClick={function () { setOpen(true); }}>
      <GIcon name="laurel-crown" size={16} color={COL} /><span><b>{"+" + (list.length - SHOW) + " more trophies"}</b>{" · tap to see them"}</span></button>}
    {groupMarks(sc.marks).map(function (m, i) { return <Mark key={i} amount={m.amount} label={m.label} />; })}
  </div>);
}

function Parch(p) {
  return (<div style={{ width: 360 }}>
    <div style={{ color: "#e8d5a8", font: "700 14px system-ui", margin: "0 0 8px" }}>{p.title}</div>
    <div className="sr-parch" style={{ margin: 0 }}>
      <div className="sr-itotal out on">+105 XP</div>
      {p.children}
    </div>
  </div>);
}

createRoot(document.getElementById("root")).render(<StrictMode>
  <style>{CSS}</style>
  <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", padding: 20 }}>
    <Parch title="A · actuelle"><Current /></Parch>
    <Parch title="B · compactée (Darics par source, repli au-delà de 4 trophées)"><Compact /></Parch>
  </div>
  <p style={{ color: "#9a8a70", font: "13px system-ui", textAlign: "center" }}>Scénarios : <a style={{ color: "#e8d5a8" }} href="?sc=wave">vague du Gauntlet</a> · <a style={{ color: "#e8d5a8" }} href="?sc=mixed">mixte</a> · <a style={{ color: "#e8d5a8" }} href="?sc=one">un trophée</a></p>
</StrictMode>);
