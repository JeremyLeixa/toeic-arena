// Proto « à l'oreille » de Mimic Hunt (lot audio, 2026-09-19). En Parts 3 et 4, le distracteur classique
// REPREND un mot entendu : le Mimic est d'abord un piège d'écoute. Ici la source n'est plus lue, elle
// s'entend ; le retour (variante C « au tap », en jeu) révèle ensuite la transcription avec ses liens.
// Trois façons de poser la question, côte à côte, sur les 6 clips d'échantillon, plus l'écran d'entrée.
// Le CSS du module est lu dans src (MH_CSS), le disque d'écoute est le vrai (components/SessionHud.jsx).
//   ?mode=light
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { MIMIC_ITEMS, MIMIC_TIERS } from "../../src/data/mimicHunt.js";
import { GIcon } from "../../src/components/icons.jsx";
import { ListenDisc } from "../../src/components/SessionHud.jsx";
import MOD from "../../src/features/games/MimicHunt.jsx?raw";

var MH_CSS = (MOD.match(/var MH_CSS=`([\s\S]*?)`;/) || [])[1] || "";
var q = new URLSearchParams(location.search);
var SAMPLE = ["mh23", "mh57", "mh16", "mh56", "mh49", "mh46"];
// Voix tirées par scripts/gen-mimic-audio.mjs (genre du locuteur, puis numéro de l'item). Affichées ici
// seulement, pour juger les accents ; le module n'en dit rien.
var VOICE_OF = { mh23: "Voice A (non-US, male)", mh57: "Sarah, US female", mh16: "Voice A (non-US, male)", mh56: "Canadian female", mh49: "Adam, US male", mh46: "Voice A (non-US, male)" };
var ITEMS = SAMPLE.map(function (id) { return MIMIC_ITEMS.find(function (x) { return x.id === id; }); });

var LS_CSS = `
.cm{padding:18px 16px 60px}
.cm h1{font-size:20px;margin:0 0 4px;color:var(--t1)}
.cm-lead{font-size:13px;line-height:1.55;color:var(--t2);margin:0 0 8px;max-width:980px}
.cm-lead b{color:var(--t1)}
.cm-ctl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0 16px;font-size:12px;color:var(--t2)}
.cm-ctl button{font:600 12px 'DM Sans',sans-serif;padding:6px 10px;border-radius:8px;border:1px solid var(--bdr);background:var(--bg2);color:var(--t1);cursor:pointer}
.cm-row{display:flex;gap:18px;overflow-x:auto;padding-bottom:10px;align-items:flex-start}
.cm-col{flex:0 0 375px}
.cm-label{font-size:13px;font-weight:800;color:var(--t1);margin-bottom:2px}
.cm-label em{font-style:normal;color:var(--green);margin-left:6px}
.cm-desc{font-size:12px;line-height:1.45;color:var(--t2);min-height:70px;margin-bottom:8px}
.cm-phone{width:375px;height:780px;overflow-y:auto;border-radius:22px;border:1px solid var(--bdr);background-color:var(--bg);box-sizing:border-box}
.cm-phone .mh{min-height:auto;padding:12px 14px 24px}
.ls-src{padding:14px 16px 16px!important;margin-bottom:12px}
.ls-src .ss-play{width:104px;height:104px}
.ls-src .ss-playlbl{font-size:13px}
.ls-voice{font-size:11px;color:var(--t3);margin-top:2px}
.mh-opt.is-locked{opacity:.5;cursor:default}
.mh-opt.is-locked:active{transform:none}
.ls-lock{margin:10px 2px 0;font-size:12px;color:var(--t2);text-align:center}
.ls-again{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:6px 12px;border-radius:999px;border:1px solid var(--bdr);background:none;color:var(--cyan);font:700 12px 'DM Sans',sans-serif;cursor:pointer}
.ls-again[disabled]{opacity:.6;cursor:default}
.ls-doors{display:flex;flex-direction:column;gap:10px;margin:4px 0 16px}
.ls-door{display:flex;gap:12px;align-items:center;padding:14px 14px!important;text-align:left;cursor:pointer}
.ls-door-i{width:44px;height:44px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--cyan);background:linear-gradient(135deg,rgba(var(--cx),.22),transparent);color:var(--cyan)}
.ls-door b{display:block;font-size:15px;color:var(--t1)}
.ls-door span{display:block;font-size:12.5px;line-height:1.45;color:var(--t2);margin-top:2px}
.ls-door small{display:inline-block;margin-top:4px;font-size:10.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--cyan)}
`;

var VARIANTS = [
  { key: "A", name: "A · Aperçu", rec: true, preview: true, lock: true, replays: 1,
    desc: "Comme en Parts 3 et 4 : question et réponses lisibles AVANT l'écoute, verrouillées jusqu'à la fin de l'enregistrement. Une réécoute. On ne peut pas répondre au premier mot reconnu, c'est-à-dire mordre." },
  { key: "B", name: "B · À l'aveugle", preview: false, lock: true, replays: 1,
    desc: "Comme l'Audio Blitz : on écoute d'abord, la question et les réponses n'apparaissent qu'après. Une réécoute. Plus dur : il faut retenir le sens sans savoir ce qui sera demandé." },
  { key: "C", name: "C · Libre", preview: true, lock: false, replays: Infinity,
    desc: "Réponses tapables à tout moment, même pendant l'écoute, réécoutes illimitées. Le plus confortable, mais on peut répondre au premier mot reconnu : le réflexe que le module combat." },
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

// Un seul clip à la fois sur toute la page (trois téléphones côte à côte).
var current = { a: null, stop: null };
function playClip(id, onEnd) {
  if (current.a) { current.a.pause(); if (current.stop) current.stop(); }
  var a = new Audio("./audio/" + id + ".mp3");
  current = { a: a, stop: onEnd };
  a.onended = function () { if (current.a === a) current = { a: null, stop: null }; onEnd(); };
  a.play().catch(function (e) { console.warn("[listen proto] play:", e && e.message); onEnd(); });
}

function Run(p) {
  var V = p.v;
  var [idx, setIdx] = useState(0);
  var [phase, setPhase] = useState("q");
  var [playing, setPlaying] = useState(false);
  var [plays, setPlays] = useState(0);
  var [heard, setHeard] = useState(false);
  var [pick, setPick] = useState(-1);
  var [focus, setFocus] = useState(-1);
  var [pairsOpen, setPairsOpen] = useState(false);
  var [score, setScore] = useState({ ok: 0, bit: 0 });
  var alive = useRef(true);
  useEffect(function () { alive.current = true; return function () { alive.current = false; }; }, []);
  var item = ITEMS[idx], tier = MIMIC_TIERS[item.tier];

  function listen() {
    if (playing) return;
    if (phase === "q" && plays >= 1 + V.replays) return;
    setPlaying(true);
    if (phase === "q") setPlays(plays + 1);
    playClip(item.id, function () { if (!alive.current) return; setPlaying(false); setHeard(true); });
  }
  function answer(i) {
    if (phase !== "q" || (V.lock && !heard)) return;
    if (current.a) { current.a.pause(); current = { a: null, stop: null }; }
    setPlaying(false);
    var ok = i === item.c, bit = !ok && isMimic(item, i);
    setScore({ ok: score.ok + (ok ? 1 : 0), bit: score.bit + (bit ? 1 : 0) });
    setPick(i); setFocus(-1); setPairsOpen(false); setPhase("fb");
  }
  function next() {
    setIdx((idx + 1) % ITEMS.length); setPhase("q"); setPlaying(false); setPlays(0); setHeard(false); setPick(-1); setFocus(-1); setPairsOpen(false);
  }

  var who = item.speaker ? item.ctx + " · " + item.speaker : item.ctx;
  var left = V.replays === Infinity ? Infinity : 1 + V.replays - plays;
  var discHint = !heard ? (V.preview ? "Tap to listen" : "Listen first — the question comes after")
    : left <= 0 ? "No more replays" : V.replays === Infinity ? "Tap to hear it again" : "Tap to hear it once more";

  if (phase === "q") {
    var showQ = V.preview || heard;
    var locked = V.lock && !heard;
    return (
      <div className="mh">
        <div className="mh-chip out" style={{ marginTop: 0 }}>{"Tier " + tier.roman + " · " + tier.name}</div>
        <div className="crd ls-src">
          <div className="mh-src-ctx">{who}</div>
          <ListenDisc playing={playing} onPlay={listen} disabled={heard && left <= 0} hint={discHint} />
          <div className="ls-voice" style={{ textAlign: "center" }}>{"proto · voix : " + VOICE_OF[item.id]}</div>
        </div>
        {showQ && <div className="mh-q">{item.q}</div>}
        {showQ && <div className="mh-opts">
          {item.opts.map(function (o, i) {
            return (
              <button key={i} className={"mh-opt" + (locked ? " is-locked" : "")} onClick={function () { answer(i); }} aria-disabled={locked}>
                <span className="mh-let out">{letterOf(i)}</span>
                <span className="mh-opt-body"><span>{o}</span></span>
              </button>
            );
          })}
        </div>}
        {showQ && locked && <p className="ls-lock">{playing ? "The answers unlock when the recording ends." : "Read the question, then listen."}</p>}
      </div>
    );
  }

  var ok = pick === item.c, bitten = !ok && isMimic(item, pick);
  var focusKind = focus < 0 ? null : focus === item.c ? "bridge" : isMimic(item, focus) ? "copy" : "none";
  var srcMarks = focus >= 0 ? linksOf(item, focus).map(function (l) { return { frag: l.src, kind: l.kind }; }) : [];
  var verdict = ok ? { cls: "ok", t: "Correct!" } : bitten ? { cls: "bit", t: "The Mimic bit you!" } : { cls: "no", t: "Not quite." };
  var key = null;
  if (focusKind === "bridge") key = <div className="mh-key"><span className="g">{"Answer " + letterOf(focus)}</span>{" says the same thing with other words."}</div>;
  if (focusKind === "copy") key = <div className="mh-key"><span className="r">{"Answer " + letterOf(focus)}</span>{" repeats words you heard but changes the meaning."}</div>;
  if (focusKind === "none") key = <div className="mh-key">{"Answer " + letterOf(focus) + ": nothing in the recording says this."}</div>;
  return (
    <div className="mh">
      <div className="mh-chip out" style={{ marginTop: 0 }}>{"Tier " + tier.roman + " · " + tier.name}</div>
      <div className="crd mh-src">
        <div className="mh-src-ctx">{who + " · what you heard"}</div>
        <p className="mh-src-text">{item.speaker && <span className="mh-spk">{item.speaker + ":"}</span>}<Marked text={item.src} marks={srcMarks} /></p>
        <button className="ls-again" onClick={listen} disabled={playing}>{playing ? "Playing…" : "▶ Hear it again"}</button>
        {key}
      </div>
      <div className={"mh-verdict out " + verdict.cls}>{verdict.t}</div>
      <div className="mh-q mh-q-small">{item.q}</div>
      <div className="mh-opts">
        {item.opts.map(function (o, i) {
          var mim = isMimic(item, i), cls = "mh-opt", letter = letterOf(i);
          if (i === item.c) { cls += " is-correct"; letter = "✓"; }
          else if (i === pick) { cls += " is-wrong"; letter = "✗"; }
          if (i === focus) cls += " is-focus";
          var marks = i === focus ? linksOf(item, i).map(function (l) { return { frag: l.opt, kind: l.kind }; }) : [];
          return (
            <button key={i} className={cls} onClick={function () { setFocus(focus === i ? -1 : i); }}>
              <span className="mh-let out">{letter}</span>
              <span className="mh-opt-body"><span><Marked text={o} marks={marks} /></span>
                {mim && <span className="mh-tags"><span className="mh-tag bad">{i === pick ? "Mimic · it bit you" : "Mimic"}</span></span>}</span>
              {mim && i === pick && <span className="mh-face chomp"><MimicIcon size={22} /></span>}
            </button>
          );
        })}
      </div>
      <p className="mh-hint">Tap an answer to see what it takes from the recording.</p>
      <div className="crd mh-why">
        <h4 className="out">The paraphrase</h4>
        {pairsOpen
          ? <div className="mh-pairs">{item.bridge.map(function (b, k) { return <div key={k} className="mh-pair"><span className="was">{b[0]}</span><span className="mh-arrow">{"→"}</span><b>{b[1]}</b></div>; })}</div>
          : <button className="mh-toggle" onClick={function () { setPairsOpen(true); }}>{"Show the rewordings"}</button>}
        <p className="mh-exp">{item.exp}</p>
        <div className="mh-trap"><MimicIcon size={18} color="var(--red)" /><span>{item.trap}</span></div>
      </div>
      <div className="mh-cta"><button className="btn1 out" onClick={next}>{"Next →"}</button></div>
      <p className="ls-lock">{"Sur cet échantillon : " + score.ok + " juste(s), " + score.bit + " morsure(s)"}</p>
    </div>
  );
}

// Entrée proposée : deux portes sur l'écran d'intro, deux modules pour les stats (mimic / mimic_listen).
function Doors() {
  return (
    <div className="mh" style={{ padding: "26px 18px 24px" }}>
      <div className="mh-hero" style={{ marginBottom: 16 }}>
        <MimicIcon size={64} color="var(--cyan)" />
        <h1 className="out" style={{ fontSize: 28 }}>Mimic Hunt</h1>
        <p>Same meaning, different words.</p>
      </div>
      <div className="crd mh-def">
        <div className="mh-def-t out"><MimicIcon size={22} color="var(--red)" />{"What's a Mimic?"}</div>
        <p>An answer that <b>copies words from the text</b> but says something the text doesn{"'"}t. It{"'"}s the TOEIC{"'"}s favourite trap: each bite costs you 3 XP.</p>
      </div>
      <div className="ls-doors">
        <button className="crd ls-door">
          <span className="ls-door-i"><GIcon name="scroll-unfurled" size={24} color="currentColor" /></span>
          <span><b>Read</b><span>Emails, notices, messages. Spot the answer that says it with other words.</span><small>Reading · Part 7</small></span>
        </button>
        <button className="crd ls-door">
          <span className="ls-door-i"><GIcon name="ringing-bell" size={24} color="currentColor" /></span>
          <span><b>Listen</b><span>Voicemails, announcements, a line from a conversation. The Mimic repeats a word you heard.</span><small>Listening · Parts 3 & 4</small></span>
        </button>
      </div>
      <p className="ls-lock">Chaque porte a ses statistiques, son coffre de maîtrise et son poids dans l{"'"}estimation (Reading ou Listening).</p>
    </div>
  );
}

function Bench() {
  var [mode, setMode] = useState(q.get("mode") || "dark");
  return (
    <div className={"app onboard-shell" + (mode === "light" ? " light" : "")} style={{ minHeight: "100vh", overflow: "auto", maxWidth: "none", width: "100%", margin: 0 }}>
      <style>{CSS}</style>
      <style>{MH_CSS}</style>
      <style>{LS_CSS}</style>
      <div className="cm">
        <h1 className="out">Mimic Hunt · à l{"'"}oreille</h1>
        <p className="cm-lead">La source n{"'"}est plus lue : elle <b>s{"'"}entend</b>. En Parts 3 et 4, le distracteur classique reprend un mot de l{"'"}enregistrement ; c{"'"}est le Mimic, version écoute. Après la réponse, la transcription apparaît et le retour est celui du jeu (rien de souligné avant un tap). Trois façons de poser la question, sur 6 vrais clips (4 voix : US homme et femme, canadienne, un accent non américain ; libellé sous le disque). « Next » passe au clip suivant. Écoutez avec le son.</p>
        <p className="cm-lead"><b>Recommandation : A.</b> C{"'"}est la consigne des Parts 3 et 4 (lire les questions avant l{"'"}écoute), et le verrou empêche de répondre au premier mot reconnu, c{"'"}est-à-dire exactement de mordre.</p>
        <div className="cm-ctl">
          <button onClick={function () { setMode(mode === "light" ? "dark" : "light"); }}>{mode === "light" ? "Mode sombre" : "Mode clair"}</button>
        </div>
        <div className="cm-row">
          {VARIANTS.map(function (V) {
            return (
              <div key={V.key} className="cm-col">
                <div className="cm-label out">{V.name}{V.rec && <em>recommandée</em>}</div>
                <div className="cm-desc">{V.desc}</div>
                <div className="cm-phone"><Run v={V} /></div>
              </div>
            );
          })}
          <div className="cm-col">
            <div className="cm-label out">Entrée · deux portes</div>
            <div className="cm-desc">L{"'"}intro du module propose Lire ou Écouter. Deux modules pour les stats : la version écoute compte en Listening, pas en Reading.</div>
            <div className="cm-phone"><Doors /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<StrictMode><Bench /></StrictMode>);
