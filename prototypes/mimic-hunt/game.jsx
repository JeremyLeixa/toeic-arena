// Proto « Mimic Hunt » (2026-09-17) — le jeu. La variante du démasquage arrive par prop :
//   "1" Chasse bonus  : bonne réponse → on désigne le Mimic parmi les options restantes (passable)
//   "2" Double marque : on pose « réponse » ET « Mimic » avant de valider
//   "3" Révélation    : un tap, les Mimics se démasquent tout seuls
// Commun aux trois : palier annoncé avant ses items, source surlignée au retour (tap sur une
// option = ses liens avec le texte), pont source → reformulation, explication.
import { useEffect, useRef, useState } from "react";
import { Bar } from "../../src/components/Bar.jsx";
import { playCorrect, playWrong, playChestKnock, playChestLand } from "../../src/sounds.js";
import MIMIC_SVG from "./mimic-chest.svg?raw";
import { ITEMS, TIERS } from "./items.js";

// game-icons « mimic-chest » (Iconify) : au câblage, entrée de GAME_ICON_PATHS et <GIcon/>.
var MIMIC_INNER = MIMIC_SVG.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

export function MimicIcon(p) {
  return (
    <svg className={"mh-mimic" + (p.className ? " " + p.className : "")} viewBox="0 0 512 512" aria-hidden="true"
      style={{ width: p.size || 24, height: p.size || 24, color: p.color }} dangerouslySetInnerHTML={{ __html: MIMIC_INNER }} />
  );
}

function sound(fn) { try { fn(); } catch (e) { console.warn("[mimic] sound:", e && e.message); } }

function isMimic(item, i) { return !!(item.mimics && item.mimics[i]); }
function letterOf(i) { return String.fromCharCode(65 + i); }

// Liens d'une option avec la source : pont et mots gardés (bonne réponse), mots recopiés (Mimic).
function linksOf(item, i) {
  if (i === item.c) {
    return item.bridge.map(function (b) { return { src: b[0], opt: b[1], kind: "bridge" }; })
      .concat((item.echo || []).map(function (w) { return { src: w, opt: w, kind: "echo" }; }));
  }
  return ((item.mimics && item.mimics[i]) || []).map(function (f) {
    return typeof f === "string" ? { src: f, opt: f, kind: "copy" } : { src: f[0], opt: f[1], kind: "copy" };
  });
}

function isWordChar(ch) { return /[A-Za-z0-9]/.test(ch || ""); }
// Occurrences d'un fragment, sans casse, en mots entiers (« sign » ne s'allume pas dans « design »).
function ranges(text, frag) {
  var t = text.toLowerCase(), f = frag.toLowerCase(), out = [], i = t.indexOf(f);
  while (i !== -1) {
    if (!isWordChar(text[i - 1]) && !isWordChar(text[i + f.length])) out.push([i, i + f.length]);
    i = t.indexOf(f, i + 1);
  }
  return out;
}

// Relecture des items au chargement : un fragment introuvable = un surlignage muet en jeu.
(function checkItems() {
  var pos = [0, 0, 0, 0], issues = 0;
  function warn(id, msg) { issues++; console.warn("[mimic] " + id + " : " + msg); }
  ITEMS.forEach(function (it) {
    if (it.opts.length !== 4 || !(it.c >= 0 && it.c <= 3)) warn(it.id, "4 options et c dans 0-3 attendus");
    pos[it.c]++;
    if (isMimic(it, it.c)) warn(it.id, "la bonne réponse est déclarée Mimic");
    if (!Object.keys(it.mimics || {}).length) warn(it.id, "aucun Mimic (la variante 2 exige d'en marquer un)");
    [it.c].concat(Object.keys(it.mimics || {}).map(Number)).forEach(function (i) {
      linksOf(it, i).forEach(function (l) {
        if (!ranges(it.src, l.src).length) warn(it.id, JSON.stringify(l.src) + " absent de la source");
        if (!ranges(it.opts[i], l.opt).length) warn(it.id, JSON.stringify(l.opt) + " absent de l'option " + letterOf(i));
      });
    });
  });
  console.info("[mimic] " + ITEMS.length + " items relus, " + issues + " problème(s) ; bonne réponse en A/B/C/D : " + pos.join("/"));
})();

// Texte avec surlignages. Chevauchement : le fragment le plus long garde la place.
function Marked(p) {
  var text = p.text, cand = [], kept = [];
  (p.marks || []).forEach(function (m) {
    ranges(text, m.frag).forEach(function (r) { cand.push({ a: r[0], b: r[1], kind: m.kind }); });
  });
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

var STEPS = {
  "1": [
    { t: "Read the text", d: "An email, a notice, a line from a conversation." },
    { t: "Pick the answer that means the same", d: "Same idea, not the same words." },
    { t: "Right? Unmask the Mimic", d: "Bonus: tap the answer that copied the text to fool you." },
  ],
  "2": [
    { t: "Read the text", d: "An email, a notice, a line from a conversation." },
    { t: "Mark the answer AND the Mimic", d: "One tap for the answer, one for the trap that copied the text." },
    { t: "Check", d: "Both marks count." },
  ],
  "3": [
    { t: "Read the text", d: "An email, a notice, a line from a conversation." },
    { t: "Pick the answer that means the same", d: "Same idea, not the same words." },
    { t: "See what the Mimics copied", d: "Every trap is unmasked after your answer." },
  ],
};

export function MimicHunt(p) {
  var V = p.variant || "1";
  var first = p.start || 0;
  function openingOf(i) { return i === 0 || ITEMS[i].tier !== ITEMS[i - 1].tier ? "tier" : "q"; }
  var [idx, setIdx] = useState(first);
  var [phase, setPhase] = useState(p.intro ? "intro" : openingOf(first)); // intro | tier | q | hunt | fb
  var [pick, setPick] = useState(-1);     // réponse retenue
  var [hunted, setHunted] = useState(-1); // option désignée comme Mimic (V1 chasse, V2 marque)
  var [tool, setTool] = useState("ans");  // V2 : outil courant
  var [focus, setFocus] = useState(-1);   // option dont on montre les liens au retour
  var [results, setResults] = useState([]);
  var mistakes = useRef([]);
  var item = ITEMS[idx], tier = TIERS[item.tier];

  useEffect(function () {
    var app = document.querySelector(".app");
    if (app) app.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [idx, phase]);

  function resolve(ans, hunt, answerSoundPlayed) {
    var ok = ans === item.c, bitten = !ok && isMimic(item, ans);
    var caught = hunt < 0 ? null : isMimic(item, hunt);
    if (!answerSoundPlayed) sound(ok ? playCorrect : playWrong);
    if (bitten) sound(function () { playChestLand(1); });
    else if (caught) sound(function () { playChestKnock(2); });
    if (!ok) mistakes.current.push({ tag: "Mimic Hunt · Tier " + tier.roman + (bitten ? " · Mimic" : ""), prompt: item.src, noBlank: true,
      yours: item.opts[ans], correct: item.opts[item.c], why: item.exp });
    setResults(function (r) { return r.concat([{ id: item.id, ok: ok, bitten: bitten, caught: caught }]); });
    setPick(ans); setHunted(hunt); setFocus(bitten ? ans : item.c); setPhase("fb");
  }

  function tapOption(i) {
    if (phase === "q") {
      if (V === "3") { resolve(i, -1); return; }
      if (V === "1") {
        if (i !== item.c) { resolve(i, -1); return; }
        sound(playCorrect); setPick(i); setPhase("hunt"); return;
      }
      // V2 : l'outil courant pose sa marque ; une option ne porte qu'une marque ; on passe à
      // l'autre outil tant qu'il reste une marque à poser.
      var a = pick, m = hunted;
      if (tool === "ans") { a = a === i ? -1 : i; if (m === i) m = -1; } else { m = m === i ? -1 : i; if (a === i) a = -1; }
      setPick(a); setHunted(m);
      if (tool === "ans" && a >= 0 && m < 0) setTool("mim");
      if (tool === "mim" && m >= 0 && a < 0) setTool("ans");
      return;
    }
    if (phase === "hunt") { if (i !== item.c) resolve(item.c, i, true); return; }
    if (phase === "fb") setFocus(i);
  }

  function next() {
    setPick(-1); setHunted(-1); setTool("ans"); setFocus(-1);
    if (idx + 1 >= ITEMS.length) { p.onFinish({ results: results, mistakes: mistakes.current }); return; }
    setIdx(idx + 1); setPhase(openingOf(idx + 1));
  }

  // ── INTRO ──
  if (phase === "intro") return (
    <div className="enter mh-intro">
      <button className="back-btn mh-intro-back" onClick={p.onBack}>{"← Back"}</button>
      <div className="mh-hero">
        <MimicIcon size={84} color="var(--cyan)" />
        <h1 className="out">Mimic Hunt</h1>
        <p>Same meaning, different words.</p>
      </div>
      <div className="crd mh-def">
        <div className="mh-def-t out"><MimicIcon size={22} color="var(--red)" />{"What's a Mimic?"}</div>
        <p>An answer that <b>copies words from the text</b> but says something the text doesn't. It's the TOEIC's favourite trap.</p>
      </div>
      <div className="crd mh-steps">
        {STEPS[V].map(function (s, k) {
          return (
            <div key={k} className="mh-step">
              <span className="mh-step-n out">{k + 1}</span>
              <div><div className="mh-step-t out">{s.t}</div><div className="mh-step-d">{s.d}</div></div>
            </div>
          );
        })}
      </div>
      <button className="btn1 out" onClick={function () { setPhase(openingOf(idx)); }}>{"Start — " + (ITEMS.length - idx) + " questions"}</button>
    </div>
  );

  // ── PALIER ──
  if (phase === "tier") return (
    <div className="enter mh-tier">
      <div className="mh-roman out">{tier.roman}</div>
      <div className="mh-tier-name out">{tier.name}</div>
      <p className="mh-tier-lead">{tier.lead}</p>
      <div className="crd mh-ex">
        <mark className="mh-mk mh-mk-bridge">{tier.ex[0]}</mark>
        <span className="mh-arrow">{"↓"}</span>
        <mark className="mh-mk mh-mk-bridge">{tier.ex[1]}</mark>
      </div>
      <p className="mh-tip">{tier.tip}</p>
      <button className="btn1 out" onClick={function () { setPhase("q"); }}>{"Enter Tier " + tier.roman}</button>
    </div>
  );

  var reveal = phase === "fb";
  var last = reveal ? results[results.length - 1] : null;
  var okCount = results.filter(function (r) { return r.ok; }).length;
  var caughtCount = results.filter(function (r) { return r.caught; }).length;
  var focusKind = !reveal || focus < 0 ? null : focus === item.c ? "bridge" : isMimic(item, focus) ? "copy" : "none";
  var focusMarks = reveal && focus >= 0 ? linksOf(item, focus).map(function (l) { return { frag: l.src, kind: l.kind }; }) : [];

  var verdict = null;
  if (last) {
    verdict = last.ok
      ? { cls: "ok", t: last.caught === true ? "Correct, and Mimic caught!" : last.caught === false ? "Correct! But that one wasn't a Mimic." : "Correct!" }
      : last.bitten ? { cls: "bit", t: "The Mimic bit you!" } : { cls: "no", t: "Not quite." };
  }

  var legend = null;
  if (focusKind === "bridge") legend = (
    <div className="mh-legend">
      <span className="mh-leg"><i className="mh-dot mh-mk-bridge" />{"Answer " + letterOf(focus) + ": same meaning, new words"}</span>
      {item.echo && <span className="mh-leg"><i className="mh-dot mh-mk-echo" />{"same word, allowed"}</span>}
    </div>
  );
  if (focusKind === "copy") legend = <div className="mh-legend"><span className="mh-leg"><i className="mh-dot mh-mk-copy" />{"Answer " + letterOf(focus) + ": copied words, different meaning"}</span></div>;
  if (focusKind === "none") legend = <div className="mh-legend">{"Answer " + letterOf(focus) + ": nothing in the text says this"}</div>;

  return (
    <div className="mh">
      <div className="mh-top">
        <button className="back-btn" onClick={p.onBack}>{"← Back"}</button>
        <div className="mh-tally">
          <span title="Correct answers"><b className="mh-ok">{"✓"}</b>{okCount}</span>
          {V !== "3" && <span title="Mimics caught"><MimicIcon size={17} color="var(--cyan)" />{caughtCount}</span>}
          <span className="mh-count">{(idx + 1) + " / " + ITEMS.length}</span>
        </div>
      </div>
      <Bar value={reveal ? idx + 1 : idx} max={ITEMS.length} h={4} />
      <div className="mh-chip out">{"Tier " + tier.roman + " · " + tier.name}</div>

      <div key={item.id + (reveal ? "r" : "")} className={"crd mh-src" + (reveal && last && last.bitten ? " sk" : "")}>
        <div className="mh-src-ctx">{item.ctx}</div>
        <p className="mh-src-text">
          {item.speaker && <span className="mh-spk">{item.speaker + ":"}</span>}
          <Marked text={item.src} marks={focusMarks} />
        </p>
        {legend}
      </div>

      {verdict ? <div className={"mh-verdict out " + verdict.cls}>{verdict.t}</div> : <div className="mh-q">{item.q}</div>}
      {reveal && <div className="mh-q mh-q-small">{item.q}</div>}

      {phase === "hunt" && (
        <div className="mh-banner enter">
          <MimicIcon size={26} color="var(--cyan)" />
          <span>{"Correct! Bonus: tap the Mimic."}</span>
          <button className="mh-skip" onClick={function () { resolve(item.c, -1, true); }}>Skip</button>
        </div>
      )}
      {phase === "q" && V === "2" && (
        <div className="mh-tools" role="radiogroup" aria-label="Marking tool">
          <button role="radio" aria-checked={tool === "ans"} className={"mh-tool ans" + (tool === "ans" ? " on" : "")} onClick={function () { setTool("ans"); }}>
            <span className="mh-tool-ic">{"✓"}</span>{"Answer"}
          </button>
          <button role="radio" aria-checked={tool === "mim"} className={"mh-tool mim" + (tool === "mim" ? " on" : "")} onClick={function () { setTool("mim"); }}>
            <MimicIcon size={20} />{"Mimic"}
          </button>
        </div>
      )}

      <div className="mh-opts">
        {item.opts.map(function (o, i) {
          var mim = isMimic(item, i), cls = "mh-opt", tags = [], letter = letterOf(i);
          if (phase === "q" && V === "2") {
            if (pick === i) { cls += " mark-ans"; tags.push(<span key="a" className="mh-tag ans">{"✓ Your answer"}</span>); }
            if (hunted === i) { cls += " mark-mim"; tags.push(<span key="m" className="mh-tag bad"><MimicIcon size={13} />{"Your Mimic"}</span>); }
          }
          if (phase === "hunt") {
            if (i === item.c) { cls += " is-correct is-locked"; letter = "✓"; } else cls += " is-huntable";
          }
          if (reveal) {
            if (i === item.c) { cls += " is-correct"; letter = "✓"; tags.push(<span key="c" className="mh-tag good">Same meaning</span>); }
            else if (i === pick) { cls += " is-wrong"; letter = "✗"; }
            if (mim) {
              cls += " is-mimic";
              tags.push(<span key="m" className="mh-tag bad"><MimicIcon size={13} />{"Mimic" + (i === pick ? " · it bit you" : i === hunted ? " · caught" : "")}</span>);
            } else if (i === hunted) tags.push(<span key="n" className="mh-tag dim">Not a Mimic</span>);
            if (!mim && i !== item.c && i !== pick) cls += " is-dim";
            if (i === focus) cls += " is-focus";
            if (mim && i === pick) cls += " mh-bite";
          }
          return (
            <button key={item.id + i} className={cls} onClick={function () { tapOption(i); }} aria-pressed={reveal ? i === focus : undefined}>
              <span className="mh-let out">{letter}</span>
              <span className="mh-opt-body">
                <span className="mh-opt-text">
                  {reveal ? <Marked text={o} marks={linksOf(item, i).map(function (l) { return { frag: l.opt, kind: l.kind }; })} /> : o}
                </span>
                {tags.length > 0 && <span className="mh-tags">{tags}</span>}
              </span>
              {reveal && mim && <MimicIcon className={"mh-face" + (i === pick ? " chomp" : "")} size={30} />}
              {reveal && mim && i === hunted && <span className="mh-caught" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      {reveal && <p className="mh-hint">Tap an answer to see how it links to the text.</p>}

      {reveal && (
        <div className="crd mh-why enter">
          <h4 className="out">The paraphrase</h4>
          <div className="mh-pairs">
            {item.bridge.map(function (b, k) {
              return <div key={k} className="mh-pair"><mark className="mh-mk mh-mk-bridge">{b[0]}</mark><span className="mh-arrow">{"→"}</span><mark className="mh-mk mh-mk-bridge">{b[1]}</mark></div>;
            })}
            {(item.echo || []).map(function (w) {
              return <div key={"e" + w} className="mh-pair"><mark className="mh-mk mh-mk-echo">{w}</mark><span className="mh-arrow">=</span><mark className="mh-mk mh-mk-echo">{w}</mark><span className="mh-note">no everyday synonym</span></div>;
            })}
          </div>
          <p className="mh-exp">{item.exp}</p>
          <div className="mh-trap"><MimicIcon size={22} color="var(--red)" /><span>{item.trap}</span></div>
        </div>
      )}

      {(reveal || (phase === "q" && V === "2")) && (
        <div className="mh-bar">
          {reveal
            ? <button className="btn1 out" onClick={next}>{idx + 1 < ITEMS.length ? "Next →" : "See results"}</button>
            : <button className="btn1 out" disabled={pick < 0 || hunted < 0} onClick={function () { resolve(pick, hunted); }}>
                {pick < 0 ? "Mark your answer" : hunted < 0 ? "Now mark the Mimic" : "Check"}
              </button>}
        </div>
      )}
    </div>
  );
}
