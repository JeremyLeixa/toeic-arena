// La chasse aux erreurs (2026-09-17, proto prototypes/mentor-memory/, plan lot 3).
// Repose les questions déjà ratées, à intervalles croissants (lib/review.js) : ratée → demain,
// réussie → 3 jours, puis 7, et la troisième réussite espacée la fait tomber.
//
// Construite sur le HUD de session existant (components/SessionHud.jsx) : barre du haut avec le fil
// d'encre, mémoire de la question dans son slot `sub`, carte de réponse, bouton Next fixe, disque
// d'écoute. Aucun composant de session nouveau.
//
// ⚠️ Audio : `resumeAudioSession()` au montage et `stopListenAudio` au démontage, sinon une chaîne
// asynchrone continue de créer des Audio après la sortie (règle « audio abort flag » de CLAUDE.md).
import { useEffect, useMemo, useRef, useState } from "react";
import { GIcon } from "../../components/icons.jsx";
import { PassageDocs } from "../../components/PassageDocs.jsx";
import { NextStepReco } from "../../components/NextStepReco.jsx";
import { SessionResult } from "../../components/SessionResult.jsx";
import { SessionTop, AnswerCard, NextBar, ListenDisc, ComboBanner } from "../../components/SessionHud.jsx";
import { useSessionTrack } from "../../components/useSessionTrack.js";
import { huntQueue, reviewHit, reviewMiss, huntReward, newReview, TIERS, tierOf, WYRM_MISS } from "../../lib/review.js";
import { lookupRef } from "../../lib/reviewLookup.js";
import { questionBadge, questionFeedback, rememberLines, huntTotals, briefing } from "../../lib/mentorVoice.js";
import { AldricBrief, AldricRemembers } from "../../components/MentorMemory.jsx";
import { GrammarSheet } from "../../components/GrammarSheet.jsx";
import { GRAMMAR_SHEETS, CAT_SHEET } from "../../data/grammarSheets.js";
import { playAudioFile, playLetteredOption, resumeAudioSession, stopCurrentListenAudio, stopListenAudio } from "../../lib/audio.js";
import { playCorrect, playWrong } from "../../sounds.js";

function sound(fn) { try { fn(); } catch (e) { console.warn("[hunt] son :", e && e.message); } }

export function MistakeHunt(p) {
  // La file est figée au montage : les échéances ne doivent pas bouger sous les pieds de l'élève.
  var queue = useMemo(function () {
    return huntQueue(p.u, new Date()).map(function (it) { return { it: it, q: lookupRef(it.k) }; })
      .filter(function (x) { return x.q; });
  }, []);
  var brief = useMemo(function () { return briefing({ kind: "hunt", items: queue.map(function (x) { return x.it; }) }, p.u, new Date()); }, []);
  var [ci, sC] = useState(0), [sel, sSel] = useState(-1), [ph, sP] = useState("intro"), [sheet, setSheet] = useState(false);
  var [playing, setPlaying] = useState(false), [played, setPlayed] = useState(false);
  var track = useSessionTrack();
  // Copie de travail du bestiaire : App() la reçoit à la fin, via p.done.
  var rvRef = useRef(JSON.parse(JSON.stringify(p.u.review && p.u.review.items ? p.u.review : newReview())));
  var outRef = useRef({ slain: [], hits: [], escaped: [] });
  var mistakesRef = useRef([]), sidRef = useRef(0), scRef = useRef(0);

  useEffect(function () { resumeAudioSession(); return stopListenAudio; }, []);

  var cur = queue[ci], q = cur && cur.q;
  var needsAudio = !!(q && q.audio);
  // Part 6 : le texte est long et la boîte courte, le trou visé tombait sous le pli. On fait défiler
  // la boîte (pas la page) jusqu'à lui à chaque nouvelle question.
  var docRef = useRef(null);
  useEffect(function () {
    var box = docRef.current;
    if (!box || ph !== "q") return;
    // Le texte d'un document est souvent UN seul nœud (pre-wrap) : on mesure le trou lui-même (Range).
    var w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT), n, at;
    while ((n = w.nextNode())) {
      at = n.nodeValue.indexOf("_____");
      if (at >= 0) {
        var r = document.createRange();
        r.setStart(n, at); r.setEnd(n, at + 5);
        box.scrollTop += r.getBoundingClientRect().top - box.getBoundingClientRect().top - 60;
        return;
      }
    }
  }, [ci, ph]);
  // Règles du vrai test : P1/P2 se répondent PENDANT l'audio (options en aveugle, visibles dès le
  // début de la lecture) ; P3/P4 montrent la question et ses options AVANT l'audio (lecture préalable),
  // mais ne se répondent qu'après l'avoir entendu.
  var canAnswer = !needsAudio || (q.blind ? playing || played : played);
  var showOptions = !needsAudio || !q.blind || playing || played;

  // Génération de lecture : répondre pendant l'audio (P1/P2, permis comme au vrai test) coupe le
  // clip en cours ET la suite de la chaîne, sinon les options continueraient sous le feedback puis
  // sous la question suivante. stopCurrentListenAudio ne lève pas le drapeau d'abandon global.
  var genRef = useRef(0);
  function hush() { genRef.current++; stopCurrentListenAudio(); setPlaying(false); }
  async function playIt() {
    if (playing || !q) return;
    var gen = ++genRef.current;
    function live() { return genRef.current === gen; }
    function pause(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    setPlaying(true);
    try {
      var a = q.audio;
      if (a.kind === "p1") {
        for (var i = 0; i < q.options.length && live(); i++) {
          await playLetteredOption("p1", a.id, i, "/audio/p1/" + a.id + "_" + a.aud[i] + ".mp3");
          await pause(300);
        }
      } else if (a.kind === "p2") {
        await playAudioFile("/audio/p2/" + a.id + "_q.mp3");
        await pause(400);
        for (var j = 0; j < q.options.length && live(); j++) {
          await playLetteredOption("p2", a.id, j, "/audio/p2/" + a.id + "_" + a.aud[j] + ".mp3");
          await pause(j < q.options.length - 1 ? 300 : 200);
        }
      } else {
        await playAudioFile("/audio/" + a.kind + "/" + a.id + ".mp3");
      }
    } catch (e) { console.warn("[hunt] audio :", e && e.message); }
    if (live()) { setPlaying(false); setPlayed(true); }
  }

  function answer(i) {
    if (ph !== "q" || !canAnswer) return;
    hush();
    sSel(i);
    var good = i === q.c;
    track.record(good);
    if (good) {
      scRef.current++;
      var r = reviewHit(rvRef.current, cur.it.k, new Date());
      (r === "slain" ? outRef.current.slain : outRef.current.hits).push({ k: cur.it.k, label: q.cat || q.label });
      sound(playCorrect);
    } else {
      reviewMiss(rvRef.current, { k: cur.it.k, cat: cur.it.cat, part: cur.it.part }, new Date());
      var after = rvRef.current.items.find(function (x) { return x.k === cur.it.k; });
      outRef.current.escaped.push({ k: cur.it.k, label: q.cat || q.label, rest: !!after && after.fails >= WYRM_MISS });
      mistakesRef.current.push({ tag: q.label, prompt: q.prompt, yours: q.options[i], correct: q.options[q.c], why: q.why, noBlank: q.kind !== "text" });
      sound(playWrong);
    }
    sP("fb");
  }
  function next() {
    hush(); setSheet(false);
    if (ci < queue.length - 1) { sC(ci + 1); sSel(-1); setPlayed(false); sP("q"); return; }
    // La session est calculée et sauvegardée ICI (jamais derrière un bouton : l'élève qui quitte
    // l'écran de fin garderait sinon ses créatures vaincues sans rien en tirer).
    var slain = outRef.current.slain.length;
    sidRef.current = p.done(scRef.current, queue.length, huntReward(slain).xp, {
      review: rvRef.current, slain: slain, darics: huntReward(slain).darics,
    });
    sP("done");
  }

  if (ph === "done") {
    var totals = huntTotals(outRef.current.slain.length);
    var lines = rememberLines({ slain: outRef.current.slain, hits: outRef.current.hits, escaped: outRef.current.escaped });
    return (
      <SessionResult session={p.session} sid={sidRef.current} name="Mistake Hunt" mistakes={mistakesRef.current}
        memory={<AldricRemembers lines={lines} aside={totals.label} />}
        onContinue={function () { p.closeSession(); p.back(); }}>
        <NextStepReco u={p.u} fromMod="hunt" nav={function (m, a) { p.closeSession(); p.nav(m, a); }} />
      </SessionResult>
    );
  }

  if (!queue.length) {
    return (
      <div className="enter" style={{ padding: "20px 16px", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}><GIcon name="check-mark" size={56} color="var(--green)" /></div>
        <h1 className="out" style={{ fontWeight: 900, fontSize: 24, marginBottom: 8 }}>Nothing due</h1>
        <p style={{ color: "var(--t2)", fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>Your bestiary is quiet today. Train, and the creatures will come.</p>
        <button className="btn1" onClick={p.back}>Back</button>
      </div>
    );
  }

  // Avant la chasse : Aldric dit ce qui l'attend (lot 5 du Mentor) — combien, de quel côté du test,
  // combien déjà battues une fois, et la question qui l'a battu le plus souvent.
  if (ph === "intro") {
    return (
      <>
        <SessionTop n={queue.length} cur={0} results={[]} streak={0} onQuit={p.back} />
        <div style={{ padding: "4px 16px 0" }}>
          <AldricBrief brief={brief} title="Mistake Hunt" />
          <p style={{ color: "var(--t2)", fontSize: 12.5, lineHeight: 1.6, textAlign: "center", margin: "0 8px" }}>Beat one three times, a few days apart, and it's gone for good.</p>
        </div>
        <NextBar onNext={function () { sP("q"); }} label="Start the hunt" />
      </>
    );
  }

  var badge = questionBadge(cur.it), fb = ph === "fb";
  // La fiche de grammaire au 3e échec (lot 5), seulement quand elle existe pour la catégorie.
  var sheetId = q.cat ? CAT_SHEET[q.cat] || null : null;
  var feed = fb ? questionFeedback({ role: "due", item: cur.it, cat: q.cat, ok: sel === q.c, hasSheet: !!sheetId }) : null;
  return (
    <>
      <SessionTop n={queue.length} cur={ci} results={track.results} streak={track.streak} onQuit={p.back}
        sub={badge ? <><GIcon name={TIERS[tierOf(cur.it)].icon} size={12} color="currentColor" style={{ verticalAlign: "-2px", marginRight: 5 }} />{badge.text}</> : null}
        quitCopy={{ title: "Leave the hunt?", body: "The creatures you haven't faced stay due.", stay: "Keep hunting", leave: "Leave" }} />
      <ComboBanner combo={track.combo} />
      <div style={{ padding: "4px 16px 0" }}>
        <span className="out" style={{ fontSize: 11, fontWeight: 600, color: "var(--cyan)", textTransform: "uppercase", letterSpacing: 1, display: "block" }}>{q.label}</span>
        {q.passage && <div ref={docRef} className="crd read-scroll" style={{ maxHeight: 260, overflowY: "auto", margin: "10px 0", padding: 14 }}>
          <PassageDocs key={q.passage.id} text={q.passage.text} fontSize={12.5} lineHeight={1.7} />
        </div>}
        {q.img && <img src={q.img} alt="Part 1 photograph" style={{ width: "100%", borderRadius: 12, margin: "10px 0", display: "block" }} />}
        {needsAudio && !fb && <ListenDisc playing={playing} onPlay={playIt} hint={played ? "Tap to hear it again" : "Tap to listen"} />}
        <h2 className="qstem" style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.5, margin: "10px 0 20px" }}>{q.prompt}</h2>
        {showOptions || fb
          ? <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {q.options.map(function (opt, i) {
              var iS = sel === i, iC = i === q.c, bg = "var(--bg2)", bd = "var(--bdr)";
              if (fb && iC) { bg = "rgba(0,230,118,.12)"; bd = "var(--green)"; }
              else if (fb && iS && !iC) { bg = "rgba(255,71,87,.12)"; bd = "var(--red)"; }
              return (
                <button key={i} onClick={function () { answer(i); }} disabled={fb || !canAnswer}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: bg, border: "1px solid " + bd, borderRadius: 12, cursor: fb || !canAnswer ? "default" : "pointer", opacity: fb || canAnswer ? 1 : 0.6, fontSize: 15, color: "var(--t1)", textAlign: "left", fontFamily: "'DM Sans',sans-serif" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid " + (fb && iC ? "var(--green)" : fb && iS ? "var(--red)" : "var(--t3)"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, background: fb && iC ? "var(--green)" : fb && iS && !iC ? "var(--red)" : "transparent", color: fb && (iC || iS) ? "#fff" : "var(--t3)" }}>
                    {fb && iC ? "✓" : fb && iS ? "✗" : String.fromCharCode(65 + i)}
                  </div>
                  {/* P1 et P2 se jouent « en aveugle » comme dans le vrai test : on entend, on choisit une lettre. */}
                  <span>{q.blind && !fb ? "Response " + String.fromCharCode(65 + i) : opt}</span>
                </button>
              );
            })}
          </div>
          : <p style={{ color: "var(--t3)", fontSize: 13, textAlign: "center" }}>Listen first.</p>}
        {fb && <AnswerCard ok={sel === q.c} answer={String.fromCharCode(65 + q.c) + ". " + q.options[q.c]} label={feed ? "Aldric" : "Why"}>
          {feed && <p className={"mm-aldric " + feed.tone}><GIcon name={feed.icon} size={16} color="currentColor" style={{ verticalAlign: "-3px", marginRight: 6 }} />{feed.text}</p>}
          {feed && feed.sheet && <button className="mm-sheet-btn out" onClick={function () { setSheet(!sheet); }} aria-expanded={sheet}>{sheet ? "Hide the sheet" : "Open the " + q.cat + " sheet"}</button>}
          {feed && feed.sheet && sheet && <div style={{ margin: "10px 0" }}><GrammarSheet g={GRAMMAR_SHEETS.find(function (s) { return s.id === sheetId; })} /></div>}
          {q.why && <p className="ss-why">{q.why}</p>}
        </AnswerCard>}
      </div>
      {fb && <NextBar onNext={next} last={ci === queue.length - 1} />}
    </>
  );
}
