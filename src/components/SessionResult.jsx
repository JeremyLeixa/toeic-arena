// Écran de fin de session « Verdict d'Aldric » (2026-09-17, choix de Jérémy sur le proto
// prototypes/victory/, V3). Un seul écran pour les modules d'entraînement et les jeux : parchemin
// (verdict écrit, sceau de cire, XP à l'encre ligne à ligne, niveau à la feuille d'or, ligue,
// trophées, Darics), puis coffres gagnés, erreurs à revoir et extras du module, barre Play again /
// Continue. La promotion de ligue ouvre la cérémonie « Ascension » (Ceremonies.jsx).
//
// Les chiffres viennent de la session construite par App() (settleSession) : ce sont ceux
// réellement versés, étape par étape (lib/xp.js gateSteps + settleXp.steps). Plus aucun p.gate()
// au rendu : c'était la source de l'XP affichée ≠ XP versée.
//
// Props : session (lastSession d'App), sid (id rendu par p.done : l'écran ne montre QUE cette
// session, sinon un parchemin « scellage »), name (nom du module), mode "score" | "points" | "time"
// (+ points, pointsLabel), mistakes [{tag, prompt, yours, correct, why, noBlank?}], onContinue,
// onReplay (bouton caché si absent), children (extras du module, sous le parchemin), memory (la carte
// « Aldric remembers », AVANT les leçons — Mentor qui se souvient, lot 5). session.turn (posé par
// sealSession) ouvre la cérémonie « faiblesse devenue force » (Ceremonies.jsx TurnCeremony).
//
// ⚠️ Plein écran fixe (z 150, au-dessus de la tab bar) : ne JAMAIS le rendre dans un `.enter`
// (translateY → la barre du bas serait positionnée par rapport au bloc animé).
// Parchemin et cérémonies : palette fixe (hex bruts, /*fond local*/). Cartes et barre : jetons.
import { useEffect, useMemo, useRef, useState } from "react";
import { GIcon } from "./icons.jsx";
import { TreasureChestSvg } from "./avatar.jsx";
import { LeaguePromotion, TurnCeremony } from "./Ceremonies.jsx";
import { createChestFx, burstAt } from "./particles.js";
import { getLevel } from "../data/helpers.js";
import { LEAGUES } from "../data/leagues.js";
import { sessionFullscreen } from "../lib/interruptions.js";
import { foldTrophies, groupMarks } from "../lib/honors.js";
import { verdictText, epilogueText, stepLabel, stepDetail, stepHint, CHEST_TIER_NAMES } from "../lib/sessionText.js";
import { playLootTick, playXP, playLevelUp, playChestLand, playJingleAchieve } from "../sounds.js";
import { haptic } from "../lib/device.js";

function sound(fn) { try { fn(); } catch (e) { console.warn("[session] sound:", e && e.message); } }
function stop(e) { e.stopPropagation(); }
function prefersReducedMotion() {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  catch (e) { console.warn("[session] matchMedia:", e && e.message); return false; }
}

// Étapes minutées : durs[i] = attente avant l'étape i+1 ; `hold` fige (cérémonie ouverte),
// `skip` saute à la fin. `durs` doit être stable (useMemo), sinon le minuteur repart à chaque rendu.
function useStages(durs, skip, hold) {
  var [stage, setStage] = useState(0);
  var len = durs.length;
  useEffect(function () {
    if (skip) { if (stage !== len) setStage(len); return; }
    if (hold || stage >= len) return;
    var id = setTimeout(function () { setStage(function (s) { return s + 1; }); }, durs[stage]);
    return function () { clearTimeout(id); };
  }, [stage, skip, hold, len, durs]);
  return stage;
}

// Compteur 0 → to (ease-out), tick() à chaque nouvelle valeur.
function useCount(active, to, dur, tick) {
  var [v, setV] = useState(0);
  var tickRef = useRef(tick);
  useEffect(function () { tickRef.current = tick; });
  useEffect(function () {
    if (!active) return;
    if (dur <= 0) { setV(to); return; }
    var t0 = performance.now(), raf = 0, last = -1;
    function step(t) {
      var k = Math.min(1, (t - t0) / dur), nv = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (nv !== last) { last = nv; setV(nv); if (k < 1 && tickRef.current) tickRef.current(); }
      if (k < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return function () { cancelAnimationFrame(raf); };
  }, [active, to, dur]);
  return active ? v : 0;
}

// Remplissage d'XP avec passage de niveau : la barre monte jusqu'au bout, marque une pause pleine
// (onLevel au début de la pause), se vide, puis finit sa course. dur 0 = état final immédiat.
function useXpFill(active, fromXp, toXp, dur, onLevel) {
  var [xp, setXp] = useState(fromXp);
  var cb = useRef(onLevel);
  useEffect(function () { cb.current = onLevel; });
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
      var lv = getLevel(fromXp), xc = fromXp - lv.cur + lv.next;
      segs = [{ a: fromXp, b: xc - 0.01, d: dur * 0.55 }, { hold: 520 }, { a: xc, b: toXp, d: Math.max(250, dur * 0.45) }];
    } else segs = [{ a: fromXp, b: toXp, d: dur }];
    var i = 0, t0 = performance.now(), raf = 0;
    function step(t) {
      var sg = segs[i], k = Math.min(1, (t - t0) / (sg.hold || sg.d));
      if (sg.hold) { if (!fired.current) { fired.current = true; cb.current(L1, false); } }
      else { var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; setXp(sg.a + (sg.b - sg.a) * e); }
      if (k >= 1) { i++; t0 = t; if (i >= segs.length) return; }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return function () { cancelAnimationFrame(raf); };
  }, [active, dur, fromXp, toXp]);
  return xp;
}

function LevelLeaf(p) {
  var lv = getLevel(Math.floor(p.xp)), pct = Math.min(100, (lv.cur / lv.next) * 100), up = p.flash > 0;
  return (
    <div className={"sr-lvl" + (up ? " is-up" : "")}>
      <div className="sr-medal" ref={p.medalRef}>
        <span key={p.level} className={"sr-medal-n out" + (up ? " flip" : "")}>{p.level}</span>
        {up && <span key={"f" + p.flash} className="sr-medal-flash" />}
      </div>
      <div className="sr-lvl-body">
        <div className="sr-lvl-row">
          <span className="out sr-lvl-name">{up ? "Level up!" : "Level " + p.level}</span>
          <span className="sr-lvl-xp">{Math.floor(lv.cur) + " / " + lv.next + " XP"}</span>
        </div>
        <div className="sr-bar"><div className="sr-bar-fill" style={{ width: pct + "%" }} /></div>
      </div>
    </div>
  );
}

function Stem(p) {
  if (p.m.noBlank) return <span>{"“" + p.m.prompt + "”"}</span>;
  var parts = String(p.m.prompt || "").split(/_{3,}/);
  if (parts.length < 2) return <span>{p.m.prompt}</span>;
  // Question à deux trous (« is … being renovated », « is...being renovated ») : chaque morceau de la
  // réponse dans son trou. Sinon la réponse entière dans le premier, les autres restent vides.
  var fills = String(p.m.correct || "").split(/\s*(?:…|\.\.\.)\s*/);
  if (fills.length !== parts.length - 1) fills = [p.m.correct];
  return (
    <span>
      {parts.map(function (part, i) {
        return <span key={i}>{part}{i < parts.length - 1 && (i < fills.length ? <mark className="sr-blank">{fills[i]}</mark> : "_____")}</span>;
      })}
    </span>
  );
}
function Mistakes(p) {
  var [open, setOpen] = useState(false);
  var n = p.items.length;
  if (!n) return <div className="sr-clean"><GIcon name="check-mark" size={18} color="var(--green)" />No mistakes to review</div>;
  return (
    <div>
      <button className="sr-mis-head" onClick={function (e) { stop(e); setOpen(!open); }}>
        <span className="out">Lessons to keep</span>
        <span className="sr-mis-count">{n}</span>
        <span className={"sr-mis-chev" + (open ? " open" : "")}>{"›"}</span>
      </button>
      {open && p.items.map(function (m, i) {
        return (
          <div key={i} className="sr-mis-item">
            {m.tag && <div className="sr-mis-tag">{m.tag}</div>}
            <div className="sr-mis-q qstem"><Stem m={m} /></div>
            <div className="sr-mis-ans">
              {m.yours != null && m.yours !== "" && <span className="sr-no">{m.yours}</span>}
              <span className="sr-yes">{m.correct}</span>
            </div>
            {m.why && <div className="sr-mis-why">{m.why}</div>}
          </div>
        );
      })}
    </div>
  );
}

function ChestList(p) {
  return (
    <div className="sr-chests">
      {p.chests.map(function (c, i) {
        return (
          <div key={i} className={"home-chest t" + c.tier + " sr-chest"} style={{ animationDelay: i * 140 + "ms" }}>
            <span className="home-chest-art"><TreasureChestSvg size={56} tier={c.tier} idSuffix={"sr" + p.sid + "_" + i} /></span>
            <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
              <div className="out sr-chest-t">{CHEST_TIER_NAMES[c.tier] + " chest"}</div>
              <div className="sr-chest-s">{c.label}</div>
            </div>
            <span className="sr-chest-wait">Waiting on Home</span>
          </div>
        );
      })}
    </div>
  );
}

// Parchemin d'attente : la session attendue n'est pas (encore) là. Continue au bout de 2 s pour
// ne jamais bloquer un élève si le handler a échoué.
function Sealing(p) {
  var [late, setLate] = useState(false);
  useEffect(function () { var t = setTimeout(function () { setLate(true); }, 2000); return function () { clearTimeout(t); }; }, []);
  return (
    <div className="sr-root">
      <div className="sr-page">
        <div className="sr-scroll">
          <div className="sr-roll" />
          <div className="sr-parch sr-sealing">
            <div className="sr-sigil"><GIcon name="wizard-staff" size={30} color={/*fond local*/"#6b3410"} /></div>
            <p className="sr-ink on">Aldric is sealing your chronicle…</p>
          </div>
          <div className="sr-roll" />
        </div>
      </div>
      {late && <div className="sr-cta"><button className="btn1 out" onClick={p.onContinue}>Continue</button></div>}
    </div>
  );
}

function Verdict(p) {
  var s = p.session, mode = p.mode || "score", n = s.steps.length;
  var canvasRef = useRef(null), medalRef = useRef(null), fxRef = useRef(null);
  var [skip, setSkip] = useState(prefersReducedMotion);
  var [ceremony, setCeremony] = useState(null); // null | "league" | "turn"
  var hasLeague = !!s.leagueUp, hasTurn = !!s.turn;
  // Budget d'interruptions (lib/interruptions.js, 2026-09-24) : UN plein écran par fin de session. Avec un
  // retournement, la promotion de ligue devient une ligne du parchemin (inlineLeague) au lieu de l'Ascension.
  var full = sessionFullscreen(s), inlineLeague = hasLeague && full !== "league";
  var inlineLeagueName = inlineLeague ? (LEAGUES.find(function (l) { return l.id === s.leagueUp.to; }) || {}).name : null;
  var durs = useMemo(function () {
    var d = [300, 1300, 700];
    for (var i = 1; i < n; i++) d.push(380);
    return d.concat([420, 1000, 1800, hasLeague || hasTurn ? 700 : 60]);
  }, [n, hasLeague, hasTurn]);
  var ST_TOTAL = n + 3, ST_LEVEL = n + 4, ST_LEAGUE = n + 5;
  var stage = useStages(durs, skip, ceremony);
  var done = stage >= durs.length;
  var total = useCount(stage >= ST_TOTAL, s.total, skip ? 0 : 800, playLootTick);
  var [level, setLevel] = useState(getLevel(s.fromXp).level);
  var [flash, setFlash] = useState(0);
  var xp = useXpFill(stage >= ST_LEVEL, s.fromXp, s.toXp, skip ? 0 : 1500, function (L, instant) {
    setLevel(L);
    if (instant) return;
    setFlash(function (f) { return f + 1; });
    sound(playLevelUp);
    haptic("levelUp");
    burstAt(fxRef.current, medalRef.current, ["#f0d070", "#fff2b0", "#c9a23a"]);
  });

  useEffect(function () {
    var f = null;
    try { f = createChestFx(canvasRef.current); } catch (e) { console.warn("[session] fx init:", e && e.message); }
    fxRef.current = f;
    // Clavier iOS : un champ de saisie encore actif (Gauntlet) garderait le clavier ouvert.
    try { var a = document.activeElement; if (a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA")) a.blur(); }
    catch (e) { console.warn("[session] blur:", e && e.message); }
    return function () { if (f) f.destroy(); fxRef.current = null; };
  }, []);
  useEffect(function () {
    if (!skip && stage === 2) sound(function () { playChestLand(1); });
  }, [stage, skip]);
  var ceremonyFired = useRef(false);
  useEffect(function () {
    if (skip || full !== "league" || stage < ST_LEAGUE || ceremonyFired.current) return;
    ceremonyFired.current = true;
    setCeremony("league");
  }, [stage, skip, full, ST_LEAGUE]);
  // « Faiblesse devenue force » (lot 5 du Mentor) : après la promotion de ligue s'il y en a une, à la fin
  // du parchemin. Contrairement à la ligue, elle s'affiche MÊME si l'élève a passé l'animation (ou en
  // mouvement réduit) : c'est un moment unique par catégorie, il ne doit pas se perdre.
  var turnFired = useRef(false);
  useEffect(function () {
    if (!hasTurn || turnFired.current || ceremony || !done) return;
    if (full === "league" && !skip && !ceremonyFired.current) return;
    turnFired.current = true;
    setCeremony("turn");
  }, [done, skip, ceremony, hasTurn, full]);
  var totalDone = useRef(false);
  useEffect(function () {
    if (totalDone.current || stage < ST_TOTAL || total !== s.total || s.total <= 0) return;
    totalDone.current = true;
    if (!skip) sound(playXP);
  }, [total, stage, skip, s.total, ST_TOTAL]);

  // Trophées débloqués pendant la session : sv() ne joue plus leur jingle (pas de toast), l'écran le
  // joue quand ils apparaissent dans le parchemin.
  var honorsPlayed = useRef(false), honorCount = (s.achievements || []).length;
  useEffect(function () {
    if (!done || honorCount === 0 || honorsPlayed.current) return;
    honorsPlayed.current = true;
    // Avec un retournement, TurnCeremony joue déjà ce jingle au même instant : une seule fois.
    if (hasTurn) return;
    sound(playJingleAchieve);
    haptic("achieve");
  }, [done, honorCount, hasTurn]);
  // Honneurs compactés (lib/honors.js, 2026-09-25) : Darics regroupés par source, trophées repliés au-delà de 4.
  var [honorsOpen, setHonorsOpen] = useState(false);

  function skipAll() { if (!skip) { setSkip(true); setCeremony(false); } }

  var shown = Math.max(0, Math.min(n, stage - 2));
  var hint = stepHint(s.steps), epilogue = epilogueText(s);
  var date = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  var sealMain = mode === "score" ? s.sc : p.points, sealSub = mode === "score" ? "of " + s.tot : (p.pointsLabel || "points");
  var leagueChest = s.chests.find(function (c) { return /^league_up_/.test(c.trigger || ""); });
  var honors = (s.achievements || []).length + (s.marks || []).length + (inlineLeague ? 1 : 0);
  var trophies = foldTrophies(s.achievements, honorsOpen), markRows = groupMarks(s.marks);
  return (
    <div className={"sr-root" + (skip ? " sr-skip" : "")} onClick={skipAll}>
      {!done && <div className="sr-skiphint">Tap to skip</div>}
      <div className="sr-page">
        <div className="sr-scroll">
          <div className="sr-roll" />
          <div className="sr-parch">
            <div className="sr-sigil"><GIcon name="wizard-staff" size={30} color={/*fond local*/"#6b3410"} /></div>
            <div className="sr-chron out">{"The Chronicle of " + (s.userName || "the Arena")}</div>
            <div className="sr-date">{p.name + " · " + date}</div>
            <p className={"sr-ink" + (stage >= 1 ? " on" : "")}>{verdictText({ name: s.userName, sc: s.sc, tot: s.tot, mode: mode })}</p>
            <div className={"sr-seal" + (stage >= 2 ? " on" : "")}><b>{sealMain}</b><small>{sealSub}</small></div>
            <div className="sr-ilines">
              {s.steps.map(function (st, i) {
                return (
                  <div key={i} className={"sr-iline sr-" + st.kind + (i < shown ? " on" : "")}>
                    <span>{stepLabel(st)}<em>{stepDetail(st, { sc: s.sc, mode: mode, modId: s.modId, slain: s.slain, bites: s.bites, bitePenalty: s.bitePenalty })}</em></span>
                    <span>{st.value}</span>
                  </div>
                );
              })}
            </div>
            <div className={"sr-itotal out" + (stage >= ST_TOTAL ? " on" : "")}>{"+" + total + " XP"}</div>
            {hint && <div className={"sr-inote" + (stage >= ST_TOTAL ? " on" : "")}>{hint}</div>}
            <div className={"sr-ilvl" + (stage >= ST_LEVEL ? " on" : "")}>
              <LevelLeaf xp={xp} level={level} flash={flash} medalRef={medalRef} />
            </div>
            {epilogue && <p className={"sr-ink sr-epi" + (stage >= ST_LEAGUE ? " on" : "")}>{epilogue}</p>}
            {honors > 0 && <div className={"sr-honors" + (done ? " on" : "")}>
              {inlineLeague && <div className="sr-honor"><GIcon name="laurel-crown" size={16} color={/*fond local*/"#8b5a28"} /><span><b>{"Promoted · " + (inlineLeagueName || "new") + " League"}</b>{s.weekly && s.weekly.to ? " · " + s.weekly.to + " XP this week" : ""}</span></div>}
              {trophies.shown.map(function (a, i) {
                return <div key={"a" + i} className="sr-honor"><GIcon name="laurel-crown" size={16} color={/*fond local*/"#8b5a28"} /><span><b>{a.name}</b>{a.desc ? " · " + a.desc : ""}</span></div>;
              })}
              {trophies.hidden > 0 && <button className="sr-honor sr-honor-more" onClick={function (e) { stop(e); setHonorsOpen(true); }}>
                <GIcon name="laurel-crown" size={16} color={/*fond local*/"#8b5a28"} /><span><b>{"+" + trophies.hidden + " more trophies"}</b>{" · tap to see them"}</span></button>}
              {markRows.map(function (m, i) {
                return <div key={"m" + i} className="sr-honor"><GIcon name="daric" size={16} color={/*fond local*/"#8b5a28"} /><span><b>{"+" + m.amount + " Darics"}</b>{m.label ? " · " + m.label : ""}</span></div>;
              })}
            </div>}
          </div>
          <div className="sr-roll" />
        </div>
        {done && s.chests.length > 0 && <ChestList chests={s.chests} sid={s.id} />}
        {/* Jeu sans liste d'erreurs (Speed Match) : pas de carte. */}
        {/* Mémoire d'Aldric (lot 5 du Mentor) : ce qui a changé, AVANT les leçons à garder. */}
        {done && p.memory && <div className="sr-extras" onClick={stop}>{p.memory}</div>}
        {p.mistakes && <div className={"crd sr-card" + (done ? " on" : "")}><Mistakes items={p.mistakes} /></div>}
        {done && <div className="sr-extras" onClick={stop}>{p.children}</div>}
      </div>
      <div className="sr-cta" onClick={stop}>
        {p.onReplay && <button className="btn2 out" onClick={p.onReplay}>Play again</button>}
        <button className="btn1 out" onClick={p.onContinue}>Continue</button>
      </div>
      <canvas ref={canvasRef} className="sr-fx" />
      {ceremony === "turn" && <TurnCeremony turn={s.turn} seed={(s.userName || "") + s.id} onClose={function () { setCeremony(null); }} />}
      {ceremony === "league" && <LeaguePromotion fromId={s.leagueUp.from} toId={s.leagueUp.to} weekly={s.weekly ? s.weekly.to : 0}
        chestTier={leagueChest ? leagueChest.tier : null} onClose={function () { setCeremony(false); }} />}
    </div>
  );
}

export function SessionResult(p) {
  if (!p.session || p.session.id !== p.sid) return <Sealing onContinue={p.onContinue} />;
  return <Verdict key={p.session.id} {...p} />;
}
