// Relecture des items de Mimic Hunt (2026-09-18). Tout est visible d'un coup, ce que la partie ne
// montre qu'après la réponse : le pont (vert), ce que chaque Mimic recopie (rouge ondulé), le mot
// gardé (gris). Le critère de Jérémy pour un Mimic : faux à la lecture attentive, tentant à la
// lecture rapide. Les options sont dans l'ordre de rédaction (le jeu les permute).
//   ?mode=light   ?tier=1|2|3
// Lot en projet : le poser dans drafts/, l'importer ici dans une Section « en projet », et le contrôler
// avec node tests/check_mimic_items.cjs prototypes/mimic-hunt/drafts/<lot>.js avant relecture.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { MIMIC_ITEMS, MIMIC_TIERS } from "../../src/data/mimicHunt.js";

var q = new URLSearchParams(location.search);
var MODE = q.get("mode") || "dark", TIER = q.get("tier") || "";

var RV_CSS = `
.rv{max-width:760px;margin:0 auto;padding:24px 16px 80px}
.rv h1{font-size:24px;margin:0 0 4px;color:var(--t1)}
.rv h2{font-size:16px;margin:32px 0 10px;color:var(--cyan)}
.rv-lead{font-size:13px;line-height:1.6;color:var(--t2);margin:0 0 6px}
.rv-legend{display:flex;flex-wrap:wrap;gap:12px;font-size:12px;color:var(--t2);margin:10px 0 0}
.rv-item{padding:14px 16px!important;margin-bottom:12px}
.rv-head{display:flex;gap:8px;align-items:baseline;font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--t3);margin-bottom:8px}
.rv-head b{color:var(--cyan)}
.rv-src{font-size:15px;line-height:1.7;color:var(--t1);margin:0 0 8px}
.rv-spk{font-weight:700;color:var(--cyan);margin-right:6px}
.rv-q{font-size:14px;font-weight:700;color:var(--t1);margin:0 0 8px}
.rv-opts{list-style:none;margin:0 0 10px;padding:0;display:flex;flex-direction:column;gap:6px}
.rv-opt{display:flex;gap:10px;align-items:flex-start;padding:7px 10px;border-radius:10px;border:1px solid var(--bdr);font-size:14px;line-height:1.45;color:var(--t1)}
.rv-opt.ok{border-color:var(--green)}
.rv-opt.mim{border-style:dashed;border-color:color-mix(in srgb,var(--red) 60%,transparent)}
.rv-tag{flex-shrink:0;min-width:64px;font-size:10.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;padding-top:2px}
.rv-tag.ok{color:var(--green)}.rv-tag.mim{color:var(--red)}.rv-tag.neu{color:var(--t3)}
.rv-exp,.rv-trap{font-size:13px;line-height:1.55;color:var(--t2);margin:6px 0 0}
.rv-trap b,.rv-exp b{color:var(--t1)}
.mh-mk{color:inherit;border-radius:4px;padding:0 2px;margin:0 -1px;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.mh-mk-bridge{background-color:color-mix(in srgb,var(--green) 22%,transparent);box-shadow:inset 0 -2px 0 var(--green)}
.mh-mk-echo{background-color:color-mix(in srgb,var(--t3) 20%,transparent);box-shadow:inset 0 -2px 0 var(--t3)}
.mh-mk-copy{background-color:color-mix(in srgb,var(--red) 16%,transparent);text-decoration:underline wavy var(--red);text-decoration-thickness:1.5px;text-underline-offset:4px;text-decoration-skip-ink:none}
`;

// Même recherche que le module : sans casse, en mots entiers ; le fragment le plus long garde la place.
function isWordChar(ch) { return /[A-Za-z0-9]/.test(ch || ""); }
function ranges(text, frag) {
  var t = text.toLowerCase(), f = String(frag).toLowerCase(), out = [], i = t.indexOf(f);
  while (i !== -1) { if (!isWordChar(text[i - 1]) && !isWordChar(text[i + f.length])) out.push([i, i + f.length]); i = t.indexOf(f, i + 1); }
  return out;
}
function Marked(p) {
  var text = p.text, cand = [], kept = [];
  p.marks.forEach(function (m) { ranges(text, m.frag).forEach(function (r) { cand.push({ a: r[0], b: r[1], kind: m.kind }); }); });
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
function pair(f) { return typeof f === "string" ? [f, f] : f; }

function Item(p) {
  var it = p.it, T = MIMIC_TIERS[it.tier] || {};
  var srcMarks = it.bridge.map(function (b) { return { frag: b[0], kind: "bridge" }; })
    .concat((it.echo || []).map(function (w) { return { frag: w, kind: "echo" }; }));
  Object.keys(it.mimics || {}).forEach(function (k) { it.mimics[k].forEach(function (f) { srcMarks.push({ frag: pair(f)[0], kind: "copy" }); }); });
  var nMim = Object.keys(it.mimics || {}).length;
  return (
    <div className="crd rv-item">
      <div className="rv-head"><b>{it.id}</b><span>{"Tier " + T.roman + " · " + T.name}</span><span>{it.ctx}</span><span>{nMim + " Mimic" + (nMim > 1 ? "s" : "")}</span></div>
      <p className="rv-src">{it.speaker && <span className="rv-spk">{it.speaker + ":"}</span>}<Marked text={it.src} marks={srcMarks} /></p>
      <p className="rv-q">{it.q}</p>
      <ul className="rv-opts">
        {it.opts.map(function (o, i) {
          var ok = i === it.c, mim = !!(it.mimics && it.mimics[i]);
          var marks = ok ? it.bridge.map(function (b) { return { frag: b[1], kind: "bridge" }; }).concat((it.echo || []).map(function (w) { return { frag: w, kind: "echo" }; }))
            : mim ? it.mimics[i].map(function (f) { return { frag: pair(f)[1], kind: "copy" }; }) : [];
          return (
            <li key={i} className={"rv-opt" + (ok ? " ok" : mim ? " mim" : "")}>
              <span className={"rv-tag " + (ok ? "ok" : mim ? "mim" : "neu")}>{ok ? "✓ Answer" : mim ? "Mimic" : "Neutral"}</span>
              <span><Marked text={o} marks={marks} /></span>
            </li>
          );
        })}
      </ul>
      <p className="rv-exp"><b>Explanation. </b>{it.exp}</p>
      <p className="rv-trap"><b>Trap. </b>{it.trap}</p>
    </div>
  );
}

function Section(p) {
  return (
    <>
      <h2 className="out">{p.title}</h2>
      {p.lead && <p className="rv-lead">{p.lead}</p>}
      {p.items.map(function (it) { return <Item key={it.id} it={it} />; })}
    </>
  );
}

function Review() {
  var lc = "app" + (MODE === "light" ? " light" : "");
  return (
    <div className={lc} style={{ minHeight: "100vh", overflow: "auto" }}>
      <style>{CSS}</style>
      <style>{RV_CSS}</style>
      <div className="rv">
        <h1 className="out">Mimic Hunt · relecture</h1>
        <p className="rv-lead">Tout est affiché d'un coup. Pour chaque Mimic : faux à la lecture attentive ? tentant à la lecture rapide ? Et chaque option neutre doit ressembler à une reformulation.</p>
        <div className="rv-legend">
          <span><mark className="mh-mk mh-mk-bridge">pont</mark> même sens, autres mots</span>
          <span><mark className="mh-mk mh-mk-copy">recopié</mark> ce que le Mimic reprend</span>
          <span><mark className="mh-mk mh-mk-echo">gardé</mark> mot sans synonyme courant</span>
        </div>
        {[1, 2, 3].filter(function (t) { return !TIER || String(t) === TIER; }).map(function (t) {
          var items = MIMIC_ITEMS.filter(function (it) { return it.tier === t; }), T = MIMIC_TIERS[t];
          return <Section key={t} title={"Palier " + T.roman + " · " + T.name + " · " + items.length + " items en jeu"} lead={T.lead} items={items} />;
        })}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<StrictMode><Review /></StrictMode>);
