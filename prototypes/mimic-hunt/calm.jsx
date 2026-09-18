// Proto « retour plus calme » de Mimic Hunt (2026-09-19). Jérémy : « les couleurs / soulignages
// chargent un peu l'interface ». L'écran de retour actuel (A) dit tout trois fois — dans la source, dans
// CHAQUE option (les deux Mimics compris), puis dans la carte « The paraphrase » — avec des fonds, des
// ondulations, des bordures pointillées et une grande icône par Mimic. Trois variantes côte à côte, sur le
// même item et le même cas. Le CSS du module est lu dans src (MH_CSS) pour que A soit l'écran réel.
//   ?id=mh18  ?case=bit|ok|miss  ?mode=light
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { MIMIC_ITEMS, MIMIC_TIERS } from "../../src/data/mimicHunt.js";
import { GIcon } from "../../src/components/icons.jsx";
import MOD from "../../src/features/games/MimicHunt.jsx?raw";

var MH_CSS = (MOD.match(/var MH_CSS=`([\s\S]*?)`;/) || [])[1] || "";
var q = new URLSearchParams(location.search);

var CM_CSS = `
.cm{padding:18px 16px 60px}
.cm h1{font-size:20px;margin:0 0 4px;color:var(--t1)}
.cm-lead{font-size:13px;line-height:1.55;color:var(--t2);margin:0 0 12px;max-width:900px}
.cm-ctl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:16px;font-size:12px;color:var(--t2)}
.cm-ctl select,.cm-ctl button{font:600 12px 'DM Sans',sans-serif;padding:6px 10px;border-radius:8px;border:1px solid var(--bdr);background:var(--bg2);color:var(--t1);cursor:pointer}
.cm-ctl button.on{border-color:var(--cyan);color:var(--cyan)}
.cm-row{display:flex;gap:18px;overflow-x:auto;padding-bottom:10px;align-items:flex-start}
.cm-col{flex:0 0 375px}
.cm-label{font-size:13px;font-weight:800;color:var(--t1);margin-bottom:2px}
.cm-desc{font-size:12px;line-height:1.45;color:var(--t2);min-height:52px;margin-bottom:8px}
.cm-phone{width:375px;height:760px;overflow-y:auto;border-radius:22px;border:1px solid var(--bdr);background-color:var(--bg);box-sizing:border-box}
.cm-phone .mh{min-height:auto;padding-bottom:24px}
/* Marques en soulignement seul (B, C, D) : plus de fonds colorés ni d'ondulation. */
.calm .mh-mk{background-color:transparent!important;box-shadow:none!important;padding:0;margin:0;border-radius:0;text-decoration-thickness:2px;text-underline-offset:4px;text-decoration-skip-ink:none}
.calm .mh-mk-bridge{text-decoration-line:underline;text-decoration-style:solid;text-decoration-color:var(--green)}
.calm .mh-mk-copy{text-decoration-line:underline;text-decoration-style:dotted;text-decoration-color:var(--red)}
.calm .mh-mk-echo{text-decoration-line:underline;text-decoration-style:dashed;text-decoration-color:var(--t3)}
.calm .mh-opt.is-focus{box-shadow:0 0 0 1.5px var(--cyan);opacity:1}
.cm-key{margin-top:10px;padding-top:10px;border-top:1px solid var(--bdr);font-size:12px;color:var(--t2)}
.cm-key .g{color:var(--green);font-weight:700}.cm-key .r{color:var(--red);font-weight:700}
.cm-tag{font-size:10.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--red)}
.cm-pairs{display:flex;flex-direction:column;gap:4px;margin-bottom:10px;font-size:14px;color:var(--t1)}
.cm-pair .a{color:var(--t2)}.cm-pair .arr{color:var(--green);font-weight:800;margin:0 6px}
.cm-quote{margin:0 0 10px;font-size:14px;line-height:1.65;color:var(--t1);padding-left:10px;border-left:2px solid var(--bdr)}
.cm-toggle{background:none;border:none;padding:0;margin:0 0 8px;color:var(--cyan);font:700 12px 'DM Sans',sans-serif;cursor:pointer}
`;

var VARIANTS = [
  { key: "A", name: "A · Actuel", desc: "L'écran en jeu : chaque option est soulignée, source et carte « The paraphrase » répètent les liens, chaque Mimic a sa bordure pointillée et sa grande icône.",
    optMarks: "all", src: true, tap: true, start: "auto", legend: "full", loud: true, pairs: "marked", calm: false },
  { key: "B", name: "B · Discrets", desc: "Soulignés fins, sans fond. Seule l'option regardée est soulignée (la bonne réponse d'abord). Les Mimics : un mot en rouge, l'icône seulement sur celui qui a mordu.",
    optMarks: "focus", src: true, tap: true, start: "auto", legend: "one", loud: false, pairs: "plain", calm: true },
  { key: "C", name: "C · Au tap", desc: "Rien n'est souligné au retour : juste, faux, Mimic. Un tap sur une option montre ses liens avec le texte. La carte ne garde que l'explication.",
    optMarks: "focus", src: true, tap: true, start: "none", legend: "one", loud: false, pairs: "hidden", calm: true },
  { key: "D", name: "D · Une carte", desc: "Options sans aucune marque. Toute la leçon dans une seule carte : la phrase avec son pont souligné, les reformulations, puis le piège. Pas de tap.",
    optMarks: "none", src: false, tap: false, start: "none", legend: "none", loud: false, pairs: "card", calm: true },
];

function isMimic(item, i) { return !!(item.mimics && item.mimics[i]); }
function letterOf(i) { return String.fromCharCode(65 + i); }
function linksOf(item, i) {
  if (i === item.c) return item.bridge.map(function (b) { return { src: b[0], opt: b[1], kind: "bridge" }; })
    .concat((item.echo || []).map(function (w) { return { src: w, opt: w, kind: "echo" }; }));
  return ((item.mimics && item.mimics[i]) || []).map(function (f) { return typeof f === "string" ? { src: f, opt: f, kind: "copy" } : { src: f[0], opt: f[1], kind: "copy" }; });
}
function isWordChar(ch) { return /[A-Za-z0-9]/.test(ch || ""); }
function ranges(text, frag) {
  var t = text.toLowerCase(), f = frag.toLowerCase(), out = [], i = t.indexOf(f);
  while (i !== -1) { if (!isWordChar(text[i - 1]) && !isWordChar(text[i + f.length])) out.push([i, i + f.length]); i = t.indexOf(f, i + 1); }
  return out;
}
function Marked(p) {
  var text = p.text, cand = [], kept = [];
  (p.marks || []).forEach(function (m) { ranges(text, m.frag).forEach(function (r) { cand.push({ a: r[0], b: r[1], kind: m.kind }); }); });
  cand.sort(function (x, y) { return (y.b - y.a) - (x.b - x.a); });
  cand.forEach(function (c) { if (!kept.some(function (o) { return c.a < o.b && o.a < c.b; })) kept.push(c); });
  kept.sort(function (x, y) { return x.a - y.a; });
  var out = [], at = 0;
  kept.forEach(function (c, k) {
    if (c.a > at) out.push(text.slice(at, c.a));
    out.push(<mark key={k} className={"mh-mk mh-mk-" + c.kind}>{text.slice(c.a, c.b)}</mark>);
    at = c.b;
  });
  if (at < text.length) out.push(text.slice(at));
  return <>{out}</>;
}
function MimicIcon(p) { return <GIcon name="mimic-chest" size={p.size || 24} color={p.color} block />; }

function Feedback(p) {
  var V = p.v, item = p.item, pick = p.pick, tier = MIMIC_TIERS[item.tier];
  var ok = pick === item.c, bitten = !ok && isMimic(item, pick);
  var first = V.start === "auto" ? (bitten ? pick : item.c) : -1;
  var [focus, setFocus] = useState(first);
  var [showPairs, setShowPairs] = useState(false);
  var focusKind = focus < 0 ? null : focus === item.c ? "bridge" : isMimic(item, focus) ? "copy" : "none";
  var srcMarks = V.src && focus >= 0 ? linksOf(item, focus).map(function (l) { return { frag: l.src, kind: l.kind }; }) : [];
  var verdict = ok ? { cls: "ok", t: "Correct!" } : bitten ? { cls: "bit", t: "The Mimic bit you!" } : { cls: "no", t: "Not quite." };

  var legend = null;
  if (V.legend === "full" && focusKind) {
    legend = focusKind === "bridge"
      ? <div className="mh-legend"><span className="mh-leg"><i className="mh-dot mh-mk-bridge" />{"Answer " + letterOf(focus) + ": same meaning, new words"}</span>{item.echo && <span className="mh-leg"><i className="mh-dot mh-mk-echo" />{"same word, allowed"}</span>}</div>
      : focusKind === "copy" ? <div className="mh-legend"><span className="mh-leg"><i className="mh-dot mh-mk-copy" />{"Answer " + letterOf(focus) + ": copied words, different meaning"}</span></div>
      : <div className="mh-legend"><span className="mh-leg">{"Answer " + letterOf(focus) + ": nothing in the text says this"}</span></div>;
  }
  if (V.legend === "one" && focusKind) {
    legend = <div className="cm-key">{focusKind === "bridge" ? <><span className="g">{"Answer " + letterOf(focus)}</span>{" says the same thing with other words."}</>
      : focusKind === "copy" ? <><span className="r">{"Answer " + letterOf(focus)}</span>{" copies these words but changes the meaning."}</>
      : <>{"Answer " + letterOf(focus) + ": nothing in the text says this."}</>}</div>;
  }

  var pairs = item.bridge.map(function (b, k) {
    return V.pairs === "marked"
      ? <div key={k} className="mh-pair"><mark className="mh-mk mh-mk-bridge">{b[0]}</mark><span className="mh-arrow">{"→"}</span><mark className="mh-mk mh-mk-bridge">{b[1]}</mark></div>
      : <div key={k} className="cm-pair"><span className="a">{b[0]}</span><span className="arr">{"→"}</span><b>{b[1]}</b></div>;
  }).concat((item.echo || []).map(function (w) {
    return V.pairs === "marked"
      ? <div key={"e" + w} className="mh-pair"><mark className="mh-mk mh-mk-echo">{w}</mark><span className="mh-arrow">=</span><mark className="mh-mk mh-mk-echo">{w}</mark><span className="mh-note">no everyday synonym</span></div>
      : <div key={"e" + w} className="cm-pair"><span className="a">{w}</span><span className="arr">=</span><b>{w}</b><span className="mh-note">{" (no everyday synonym)"}</span></div>;
  }));

  return (
    <div className={"mh" + (V.calm ? " calm" : "")} style={{ padding: "12px 14px 24px" }}>
      <div className="mh-chip out" style={{ marginTop: 0 }}>{"Tier " + tier.roman + " · " + tier.name}</div>
      <div className={"crd mh-src" + (bitten && V.loud ? " sk" : "")}>
        <div className="mh-src-ctx">{item.ctx}</div>
        <p className="mh-src-text">{item.speaker && <span className="mh-spk">{item.speaker + ":"}</span>}<Marked text={item.src} marks={srcMarks} /></p>
        {legend}
      </div>
      <div className={"mh-verdict out " + verdict.cls}>{verdict.t}</div>
      <div className="mh-q mh-q-small">{item.q}</div>
      <div className="mh-opts">
        {item.opts.map(function (o, i) {
          var mim = isMimic(item, i), cls = "mh-opt", tags = [], letter = letterOf(i);
          if (i === item.c) { cls += " is-correct"; letter = "✓"; if (V.loud) tags.push(<span key="c" className="mh-tag good">Same meaning</span>); }
          else if (i === pick) { cls += " is-wrong"; letter = "✗"; }
          if (mim) {
            if (V.loud) { cls += " is-mimic"; tags.push(<span key="m" className="mh-tag bad"><MimicIcon size={13} />{"Mimic" + (i === pick ? " · it bit you" : "")}</span>); }
            else tags.push(<span key="m" className="cm-tag">{i === pick ? "Mimic · it bit you" : "Mimic"}</span>);
          }
          if (V.loud && !mim && i !== item.c && i !== pick) cls += " is-dim";
          if (V.tap && i === focus) cls += " is-focus";
          if (mim && i === pick && V.loud) cls += " mh-bite";
          var marks = V.optMarks === "all" || (V.optMarks === "focus" && i === focus) ? linksOf(item, i).map(function (l) { return { frag: l.opt, kind: l.kind }; }) : [];
          var face = mim && (V.loud || i === pick);
          return (
            <button key={i} className={cls} onClick={function () { if (V.tap) setFocus(focus === i && V.start === "none" ? -1 : i); }} style={V.tap ? null : { cursor: "default" }}>
              <span className="mh-let out">{letter}</span>
              <span className="mh-opt-body"><span><Marked text={o} marks={marks} /></span>{tags.length > 0 && <span className="mh-tags">{tags}</span>}</span>
              {face && <span className={"mh-face" + (i === pick ? " chomp" : "")}><MimicIcon size={V.loud ? 30 : 22} /></span>}
            </button>
          );
        })}
      </div>
      {V.tap && <p className="mh-hint">{V.start === "none" ? "Tap an answer to see what it takes from the text." : "Tap an answer to see how it links to the text."}</p>}
      <div className="crd mh-why">
        <h4 className="out">The paraphrase</h4>
        {V.pairs === "card" && <p className="cm-quote calm"><Marked text={item.src} marks={item.bridge.map(function (b) { return { frag: b[0], kind: "bridge" }; })} /></p>}
        {V.pairs === "hidden"
          ? (showPairs ? <div className="cm-pairs">{pairs}</div> : <button className="cm-toggle" onClick={function () { setShowPairs(true); }}>{"Show the rewordings"}</button>)
          : <div className={V.pairs === "marked" ? "mh-pairs" : "cm-pairs"}>{pairs}</div>}
        <p className="mh-exp">{item.exp}</p>
        <div className="mh-trap"><MimicIcon size={V.loud ? 22 : 18} color="var(--red)" /><span>{item.trap}</span></div>
      </div>
      <div className="mh-cta"><button className="btn1 out">{"Next →"}</button></div>
    </div>
  );
}

function pickFor(item, c) {
  if (c === "ok") return item.c;
  var mims = Object.keys(item.mimics || {}).map(Number);
  if (c === "bit" && mims.length) return mims[0];
  var neutral = [0, 1, 2, 3].filter(function (i) { return i !== item.c && mims.indexOf(i) < 0; });
  return neutral.length ? neutral[0] : (mims[0] != null ? mims[0] : (item.c + 1) % 4);
}

function Bench() {
  var [id, setId] = useState(q.get("id") || "mh18");
  var [c, setC] = useState(q.get("case") || "bit");
  var [mode, setMode] = useState(q.get("mode") || "dark");
  var item = MIMIC_ITEMS.find(function (x) { return x.id === id; }) || MIMIC_ITEMS[0];
  var pick = pickFor(item, c);
  return (
    <div className={"app onboard-shell" + (mode === "light" ? " light" : "")} style={{ minHeight: "100vh", overflow: "auto", maxWidth: "none", width: "100%", margin: 0 }}>
      <style>{CSS}</style>
      <style>{MH_CSS}</style>
      <style>{CM_CSS}</style>
      <div className="cm">
        <h1 className="out">Mimic Hunt · un retour plus calme</h1>
        <p className="cm-lead">Même item, même réponse, quatre écrans de retour. A est l'écran actuel ; B, C et D allègent de plus en plus. Les options et les liens restent tapables comme en jeu (sauf D).</p>
        <div className="cm-ctl">
          <select value={id} onChange={function (e) { setId(e.target.value); }}>
            {MIMIC_ITEMS.map(function (it) { return <option key={it.id} value={it.id}>{it.id + " · palier " + MIMIC_TIERS[it.tier].roman + " · " + it.ctx}</option>; })}
          </select>
          {[["bit", "A mordu au Mimic"], ["ok", "Bonne réponse"], ["miss", "Mauvaise réponse neutre"]].map(function (b) {
            return <button key={b[0]} className={c === b[0] ? "on" : ""} onClick={function () { setC(b[0]); }}>{b[1]}</button>;
          })}
          <button onClick={function () { setMode(mode === "light" ? "dark" : "light"); }}>{mode === "light" ? "Mode sombre" : "Mode clair"}</button>
        </div>
        <div className="cm-row">
          {VARIANTS.map(function (V) {
            return (
              <div key={V.key} className="cm-col">
                <div className="cm-label out">{V.name}</div>
                <div className="cm-desc">{V.desc}</div>
                <div className="cm-phone"><Feedback key={item.id + c + V.key} v={V} item={item} pick={pick} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<StrictMode><Bench /></StrictMode>);
