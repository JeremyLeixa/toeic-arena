// HUD de session (2026-09-17, proto prototypes/sessions/, variante E choisie par Jérémy) : barre du
// haut (retour avec confirmation, fil d'encre, compteur ou minuteur, « N in a row »), bannière de combo,
// carte de réponse (bandeau verdict + « Why ») et bouton Next fixé en bas ; disque d'écoute pour le
// Listening. Styles .ss-* dans styles/appCss.js.
//
// ⚠️ La barre et le pied sont en position:fixed : ne JAMAIS les rendre dans un .enter ou un .sk (ils
// animent transform, et un fixed suit alors le bloc au lieu de l'écran). Rendre le HUD à côté du
// contenu animé, dans un fragment. La présence de .ss-top masque aussi la tab bar sur mobile (CSS
// :has(), aucun état) : ne rendre SessionTop que pendant les questions.
import { useEffect, useRef, useState } from "react";
import { GIcon } from "./icons.jsx";
import { segDensity, segMarks } from "../lib/sessionHud.js";

var QUIT_COPY = { title: "Leave this round?", body: "Your answers in this round won't be saved.", stay: "Keep going", leave: "Leave" };

// p.n, p.cur (index de la question en cours), p.results (useSessionTrack), p.groups? (tailles de groupes),
// p.aside? (remplace le compteur : minuteur), p.count? (texte du compteur), p.sub? (ligne sous la barre),
// p.streak, p.onQuit, p.quitCopy? {title, body, stay, leave}, p.onSheet?(open) (mettre un minuteur en pause)
export function SessionTop(p) {
  var [sheet, setSheet] = useState(false);
  var ref = useRef(null);
  useEffect(function () {
    if (import.meta.env.DEV && ref.current && ref.current.parentElement && ref.current.parentElement.closest(".enter,.sk"))
      console.warn("[session] SessionTop est rendu dans un .enter ou .sk : la barre fixe suivra l'animation.");
  }, []);
  var results = p.results || [];
  var copy = Object.assign({}, QUIT_COPY, p.quitCopy || {});
  function ask() {
    // Rien de répondu : rien à perdre, pas de confirmation.
    if (!results.length) { p.onQuit(); return; }
    setSheet(true);
    if (p.onSheet) p.onSheet(true);
  }
  function stay() { setSheet(false); if (p.onSheet) p.onSheet(false); }
  function leave() { setSheet(false); if (p.onSheet) p.onSheet(false); p.onQuit(); }
  var dens = segDensity(p.n);
  var streak = p.streak || 0;
  return (
    <>
      <div className={"ss-top" + (p.sub ? " has-sub" : "")} ref={ref}>
        <div className="ss-row">
          <button className="ss-back" onClick={ask} aria-label="Leave this round">{"←"}</button>
          {dens === "bar"
            ? <div className="ss-seg bar"><i style={{ width: Math.min(100, results.length / Math.max(1, p.n) * 100) + "%" }} /></div>
            : <div className={"ss-seg " + dens}>{segMarks(p.n, results, p.cur, p.groups).map(function (s, i) {
                return <i key={i} className={s.m + (s.brk ? " brk" : "")} />;
              })}</div>}
          {p.aside != null ? <span className="ss-aside">{p.aside}</span> : <span className="out ss-count">{p.count || (Math.min(p.cur + 1, p.n) + "/" + p.n)}</span>}
        </div>
        {p.sub && <div className="ss-sub out">{p.sub}</div>}
        <div className="ss-flame out">{streak >= 3 && <><GIcon name="flame" size={13} color="currentColor" />{streak + " in a row"}</>}</div>
      </div>
      <div className={"ss-top-space" + (p.sub ? " has-sub" : "")} />
      {sheet && <div className="ss-quit" onClick={stay}>
        <div className="crd ss-quit-card" onClick={function (e) { e.stopPropagation(); }}>
          <div className="out" style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{copy.title}</div>
          <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5, marginBottom: 14 }}>{copy.body}</p>
          <button className="btn1" onClick={stay}>{copy.stay}</button>
          <button className="btn2" onClick={leave} style={{ marginTop: 8, width: "100%" }}>{copy.leave}</button>
        </div>
      </div>}
    </>
  );
}

// p.combo {n, id} (useSessionTrack) : bannière « Combo ×N » au centre, 1,4 s.
export function ComboBanner(p) {
  if (!p.combo) return null;
  return <div key={p.combo.id} className="ss-burst out" aria-live="polite"><GIcon name="flame" size={30} color="currentColor" /><span>{"Combo ×" + p.combo.n}</span></div>;
}

// p.ok, p.answer? (« B. was published »), p.timeout?, p.label? (« Why » par défaut), p.why?, p.children?
// (corps libre à la place de why). Sans why ni children : bandeau seul.
export function AnswerCard(p) {
  var ref = useRef(null);
  useEffect(function () {
    try { if (ref.current && ref.current.scrollIntoView) ref.current.scrollIntoView({ block: "nearest" }); }
    catch (e) { console.warn("[session] answer card scroll:", e && e.message); }
  }, []);
  var band = p.timeout ? "⏱ Time's up" + (p.answer ? " · " + p.answer : "")
    : p.ok ? "✓ Correct" : "✗ Wrong" + (p.answer ? " · " + p.answer : "");
  var body = p.children || (p.why ? <p className="ss-why">{p.why}</p> : null);
  return (
    <div ref={ref} className={"crd ss-card " + (p.ok && !p.timeout ? "ok" : "ko")}>
      <div className="ss-band out">{band}</div>
      {body && <><div className="ss-whylabel out">{p.label || "Why"}</div><div className="ss-body">{body}</div></>}
    </div>
  );
}

// p.onNext, p.last?, p.label? : bouton Next fixé en bas (sous le pouce), avec son espaceur.
export function NextBar(p) {
  function go() {
    try { window.scrollTo(0, 0); } catch (e) { console.warn("[session] scroll top:", e && e.message); }
    p.onNext();
  }
  return (
    <>
      <div className="ss-foot-space" />
      <div className="ss-foot"><div className="ss-foot-in"><button className="btn1" onClick={go} disabled={p.disabled}>{p.label || (p.last ? "See Results" : "Next")}</button></div></div>
    </>
  );
}

// p.playing, p.onPlay, p.disabled?, p.hint? (« Tap to listen »), p.playingLabel? : disque d'écoute aux
// couleurs du skin (anneau runique qui tourne pendant la lecture, barres d'onde).
export function ListenDisc(p) {
  return (
    <div className="ss-listen">
      <button className={"ss-play" + (p.playing ? " on" : "")} onClick={p.onPlay} disabled={p.playing || p.disabled} aria-label={p.playing ? "Playing" : "Play audio"}>
        <span className="ss-rune" />
        <span className="ss-core">{p.playing
          ? <GIcon name="ringing-bell" size={40} color="currentColor" />
          : <svg viewBox="0 0 24 24" width="38" height="38" style={{ display: "block", marginLeft: 5 }}><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" /></svg>}</span>
      </button>
      <div className="ss-wave-row">{p.playing && <span className="ss-wave">{[0, 1, 2, 3, 4].map(function (i) { return <i key={i} style={{ animationDelay: (i * 0.12) + "s" }} />; })}</span>}</div>
      <p className="out ss-playlbl">{p.playing ? (p.playingLabel || "Listening…") : (p.hint || "Tap to listen")}</p>
    </div>
  );
}
