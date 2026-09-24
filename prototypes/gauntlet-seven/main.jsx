// Proto « Gauntlet à 7 épreuves » (2026-09-25). À gauche : le hub, les 4 épreuves actuelles telles quelles et les
// 3 nouvelles, dont on choisit le nom, l'icône, la couleur et la musique (menus au-dessus de chaque carte). À droite :
// une question « False friend » dans la Taverne, avant et après la réponse. Rien ici n'est câblé.
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { GAME_ICON_PATHS, GAME_ICON_VIEWBOX } from "../../src/data/avatarIcons.js";
import { AnswerCard } from "../../src/components/SessionHud.jsx";
import { FALSE_FRIENDS } from "../../src/data/miniGames.js";

var q = new URLSearchParams(location.search);
var MODE = q.get("mode") || "dark", SKIN = q.get("skin") || "";

// Icônes absentes de l'appli : chargées depuis Iconify pour le proto (au câblage : ajoutées à GAME_ICON_PATHS).
var extra = {};
function useIcon(name) {
  var [, force] = useState(0);
  useEffect(function () {
    if (GAME_ICON_PATHS[name] || extra[name]) return;
    fetch("https://api.iconify.design/game-icons.json?icons=" + name).then(function (r) { return r.json(); })
      .then(function (j) { if (j.icons && j.icons[name]) { extra[name] = j.icons[name].body; force(function (k) { return k + 1; }); } })
      .catch(function (e) { console.warn("[proto] icon:", e && e.message); });
  }, [name]);
  return GAME_ICON_PATHS[name] || extra[name] || "";
}
function Icon(p) {
  var body = useIcon(p.name);
  return <svg viewBox={GAME_ICON_VIEWBOX} width={p.size || 32} height={p.size || 32} style={{ color: "currentColor", display: "inline-block" }} dangerouslySetInnerHTML={{ __html: body }} />;
}

var CURRENT = [
  { id: "irregular", name: "Irregular Crypt", icon: "tombstone", desc: "Exhume the sleeping irregular verbs. 15 items per raid, type V2 and V3 by hand.", accent: "linear-gradient(90deg,#6b7280,#9ca3af)", grim: false },
  { id: "tense", name: "Chronomancer", icon: "clockwork", desc: "Master the storm of verb tenses. Markers, contexts, francophone traps.", accent: "linear-gradient(90deg,#7c3aed,#c026d3)", grim: true },
  { id: "passive", name: "Passive Forge", icon: "anvil-impact", desc: "Transform active into passive. 13 tenses covered, double-object traps.", accent: "linear-gradient(90deg,#dc2626,#f59e0b)", grim: true },
  { id: "relative", name: "Relative Weaver", icon: "spider-web", desc: "Weave relative clauses. Defining, non-defining, reduced relatives.", accent: "linear-gradient(90deg,#0891b2,#7c3aed)", grim: true },
];
// Les 3 nouvelles : plusieurs habits proposés par épreuve (nom, icône, accroche, couleur) et une musique existante.
var NEW = [
  { id: "connectors", what: "Connectors (connsort) · tri en 3 règles : clause, noun, new sentence", options: [
    { name: "Knotbinder", icon: "knot", desc: "Tie every idea with the right knot. Clause, noun, or a brand-new sentence?", accent: "linear-gradient(90deg,#8b5e83,#c4587a)" },
    { name: "The Crossroads", icon: "crossroad", desc: "Each connector points one way: a clause, a noun, or a new sentence. Choose the road.", accent: "linear-gradient(90deg,#b45309,#f59e0b)" },
    { name: "Bridgewright", icon: "stone-bridge", desc: "Build the bridge between two ideas, with the connector that holds its weight.", accent: "linear-gradient(90deg,#0f766e,#22c55e)" },
  ] },
  { id: "prepositions", what: "Prepositions (prepdrill) · la préposition qui va avec le mot (interested in, depend on…)", options: [
    { name: "Anchor Hall", icon: "anchor", desc: "Every word drops its own anchor. Interested in, depend on, responsible for: find it.", accent: "linear-gradient(90deg,#1d4ed8,#06b6d4)" },
    { name: "The Chainlocks", icon: "anchor-chain", desc: "Word and preposition, chained for good. Break the francophone links.", accent: "linear-gradient(90deg,#475569,#94a3b8)" },
    { name: "Ring of Bonds", icon: "linked-rings", desc: "Some pairs are forged together. Find the ring that fits each word.", accent: "linear-gradient(90deg,#06b6d4,#22c55e)" },
  ] },
  { id: "gerund", what: "Gerund/Infinitive (gerinf) · -ing ou to + verbe, en contexte", options: [
    { name: "Twin Paths", icon: "split-arrows", desc: "Two roads after every verb: -ing or to. Only one leads on.", accent: "linear-gradient(90deg,#e11d48,#f59e0b)" },
    { name: "The Fork", icon: "forked-road", desc: "Enjoy doing, decide to do. At every fork, pick the form the verb demands.", accent: "linear-gradient(90deg,#be123c,#7c3aed)" },
    { name: "Scales of Form", icon: "scales", desc: "Weigh each verb: does it tip toward -ing, or toward to?", accent: "linear-gradient(90deg,#a16207,#e11d48)" },
  ] },
];
var BGM = ["bgm_bridge", "bgm_clue", "bgm_verdict", "bgm_oracle", "bgm_build", "bgm_mimic"];
var BGM_DEFAULT = { connectors: "bgm_bridge", prepositions: "bgm_clue", gerund: "bgm_verdict" };

var audio = null;
function preview(track) {
  try { if (audio) audio.pause(); audio = new Audio("/audio/bgm/" + track + ".mp3"); audio.volume = 0.5; audio.play(); }
  catch (e) { console.warn("[proto] bgm:", e && e.message); }
}
function stop() { if (audio) audio.pause(); }

function Card(p) {
  var c = p.c;
  return (
    <div className="gauntlet-card">
      <div className="gauntlet-card-accent" style={{ background: c.accent }} />
      <div className="gauntlet-card-head">
        <div className="gauntlet-card-icon" style={{ color: "var(--cyan)" }}><Icon name={c.icon} size={32} /></div>
        <div style={{ flex: 1, minWidth: 0 }}><div className="gauntlet-card-name">{c.name}{p.isNew && <span className="gs-new">NEW</span>}</div></div>
      </div>
      <div className="gauntlet-card-desc">{c.desc}</div>
      <div className="gauntlet-card-stats"><span>{p.isNew ? "0 sessions" : "3 sessions"}</span><span>·</span><span>Accuracy: {p.isNew ? "—" : "74%"}</span></div>
      <div className="gauntlet-card-actions">
        <button className="gauntlet-btn-enter"><Icon name="dungeon-gate" size={16} /> Entrer</button>
        {(c.grim || p.isNew) && <button className="gauntlet-btn-grim"><Icon name="bookmarklet" size={16} /> Grimoire</button>}
      </div>
    </div>
  );
}

function Hub() {
  var [pick, setPick] = useState({ connectors: 0, prepositions: 0, gerund: 0 });
  var [bgm, setBgm] = useState(BGM_DEFAULT);
  return (
    <div className="gauntlet-hub" style={{ paddingBottom: 30 }}>
      <div className="gauntlet-header">
        <div style={{ marginBottom: 6, display: "flex", justifyContent: "center", color: "var(--cyan)" }}><Icon name="gauntlet" size={52} /></div>
        <h2 className="gauntlet-title">GRAMMAR GAUNTLET</h2>
        <div className="gauntlet-sub">Seven trials. One crown.</div>
      </div>
      {CURRENT.map(function (c) { return <Card key={c.id} c={c} />; })}
      {NEW.map(function (n) {
        var c = n.options[pick[n.id]];
        return (
          <div key={n.id} className="gs-slot">
            <div className="gs-pick">
              <div className="gs-what">{n.what}</div>
              <div className="gs-row">
                {n.options.map(function (o, i) {
                  return <button key={i} className={"gs-opt" + (pick[n.id] === i ? " on" : "")} onClick={function () { var x = Object.assign({}, pick); x[n.id] = i; setPick(x); }}>{o.name}</button>;
                })}
              </div>
              <div className="gs-row">
                <span className="gs-l">Musique</span>
                <select value={bgm[n.id]} onChange={function (e) { var x = Object.assign({}, bgm); x[n.id] = e.target.value; setBgm(x); }}>
                  {BGM.map(function (b) { return <option key={b}>{b}</option>; })}
                </select>
                <button className="gs-opt" onClick={function () { preview(bgm[n.id]); }}>▶</button>
                <button className="gs-opt" onClick={stop}>■</button>
              </div>
            </div>
            <Card c={c} isNew />
          </div>
        );
      })}
    </div>
  );
}

// La question « False friend » de la Taverne (un 4e type : 4 / 4 / 4 / 3 sur 15).
function Tavern() {
  var ff = FALSE_FRIENDS[0];
  var [sel, setSel] = useState(-1);
  var parts = ff.ex.split(new RegExp("(" + ff.en + ")", "i"));
  var right = ff.opts[ff.correct];
  return (
    <div style={{ padding: "4px 16px 20px" }}>
      <div className="out" style={{ fontSize: 11, color: "var(--cx-hex)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 12 }}>False friend · what does the word mean here?</div>
      <div className="crd" style={{ padding: 20, textAlign: "center", minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 16, lineHeight: 1.6 }}>{parts.map(function (s, i) { return i % 2 ? <b key={i} style={{ textDecoration: "underline", textDecorationColor: "var(--cyan)", textUnderlineOffset: 4 }}>{s}</b> : <span key={i}>{s}</span>; })}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ff.opts.map(function (o, i) {
          var show = sel !== -1, ok = i === ff.correct, bg = "var(--bg2)", bdr = "var(--bdr)", col = "var(--t1)";
          if (show && ok) { bg = "rgba(74,190,96,.15)"; bdr = "rgba(74,190,96,.5)"; col = "var(--green)"; }
          else if (show && sel === i) { bg = "rgba(224,82,82,.15)"; bdr = "rgba(224,82,82,.5)"; col = "var(--red)"; }
          return <button key={i} disabled={show} onClick={function () { setSel(i); }} style={{ padding: "14px 16px", background: bg, border: "1.5px solid " + bdr, borderRadius: 12, textAlign: "left", fontSize: 14, color: col, fontFamily: "'DM Sans',sans-serif" }}>{o}</button>;
        })}
      </div>
      {sel !== -1 && <AnswerCard ok={sel === ff.correct} answer={right} label="The trap" why={ff.trap + " In French: " + ff.realFr + "."} />}
      {sel !== -1 && <button className="btn2" style={{ marginTop: 12, width: "100%" }} onClick={function () { setSel(-1); }}>↺ Reset</button>}
    </div>
  );
}

var PROTO_CSS = `
.gs-wrap{display:flex;flex-wrap:wrap;gap:24px;justify-content:center;padding:16px}
.gs-col{width:390px;max-width:100%;border:1px solid var(--bdr);border-radius:20px;background:var(--bg);overflow:hidden}
.gs-col h3{margin:0;padding:12px 16px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--t3);border-bottom:1px solid var(--bdr)}
.gs-slot{border:1px dashed rgba(var(--cx),.35);border-radius:20px;padding:10px 8px 2px;margin:0 -8px 14px}
.gs-pick{padding:0 6px 10px}
.gs-what{font-size:11.5px;color:var(--t2);margin-bottom:6px}
.gs-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:6px}
.gs-l{font-size:11px;color:var(--t3)}
.gs-opt{font:inherit;font-size:12px;padding:5px 10px;border-radius:999px;border:1px solid var(--bdr);background:var(--bg2);color:var(--t2);cursor:pointer}
.gs-opt.on{border-color:var(--cyan);color:var(--cyan);font-weight:700}
.gs-row select{font:inherit;font-size:12px;background:var(--bg2);color:var(--t1);border:1px solid var(--bdr);border-radius:8px;padding:4px 6px}
.gs-new{font-size:10px;margin-left:8px;padding:2px 7px;border-radius:99px;background:rgba(var(--cx),.15);color:var(--cyan);font-family:'DM Sans',sans-serif;letter-spacing:.5px;vertical-align:middle}
`;

function App() {
  // onboard-shell : sans la marge de la barre latérale du bureau (.app:not(.onboard-shell)).
  var lc = "app onboard-shell" + (MODE === "light" ? " light" : "") + (SKIN ? " skin-" + SKIN : "");
  return (
    <div className={lc} style={{ minHeight: "100vh", marginLeft: 0 }}>
      <style>{CSS}</style><style>{PROTO_CSS}</style>
      <div className="gs-wrap">
        <div className="gs-col"><h3>Le hub · 7 épreuves</h3><Hub /></div>
        <div className="gs-col"><h3>Word Tavern · question False friend</h3><Tavern /></div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<StrictMode><App /></StrictMode>);
