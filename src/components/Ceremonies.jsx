// Cérémonies plein écran (2026-09-17, proto prototypes/victory/ceremonies.jsx).
//   LeaguePromotion « Ascension » (choix de Jérémy) : l'écusson de l'ancienne ligue se fend et tombe,
//     le nouveau descend dans une colonne de lumière à sa couleur. Rendue par l'écran de fin de
//     session, et par-dessus les écrans d'examen (qui gardent leurs propres résultats).
//   TurnCeremony « faiblesse devenue force » (lot 5 du Mentor) : une catégorie retournée, une fois.
//   LevelUpOverlay : montée de niveau plein écran, SEULEMENT pour les examens (les autres sessions
//     la montrent dans le parchemin de SessionResult).
// Fond sombre fixe, lisible dans les deux modes : hex bruts + /*fond local*/, jamais de jeton de
// thème. Chaque cérémonie a son propre <canvas> de particules (autonome, détruit au démontage).
import { useEffect, useRef, useState } from "react";
import { GIcon } from "./icons.jsx";
import { TreasureChestSvg } from "./avatar.jsx";
import { createChestFx, burstAt } from "./particles.js";
import { getLevel } from "../data/helpers.js";
import { LEAGUES } from "../data/leagues.js";
import { playLevelUp, playJingleLeague, playChestLand, playJingleAchieve } from "../sounds.js";
import { haptic } from "../lib/device.js";
import { CHEST_TIER_NAMES } from "../lib/sessionText.js";
import { ceremonyText } from "../lib/mentorVoice.js";

function stop(e) { e.stopPropagation(); }
function sound(fn) { try { fn(); } catch (e) { console.warn("[ceremony] sound:", e && e.message); } }
function leagueById(id) {
  for (var i = 0; i < LEAGUES.length; i++) if (LEAGUES[i].id === id) return LEAGUES[i];
  return LEAGUES[0];
}
function nextLeague(weekly) {
  for (var i = 0; i < LEAGUES.length; i++) if (LEAGUES[i].min > weekly) return LEAGUES[i];
  return null;
}
// Instance de particules liée au canvas de la cérémonie.
function useFx(canvasRef) {
  var fx = useRef(null);
  useEffect(function () {
    var f = null;
    try { f = createChestFx(canvasRef.current); } catch (e) { console.warn("[ceremony] fx init:", e && e.message); }
    fx.current = f;
    return function () { if (f) f.destroy(); fx.current = null; };
  }, [canvasRef]);
  return fx;
}

export function LevelUpOverlay(p) {
  var medal = useRef(null), canvas = useRef(null);
  var fx = useFx(canvas);
  useEffect(function () {
    sound(playLevelUp);
    haptic("levelUp");
    var t = setTimeout(function () {
      burstAt(fx.current, medal.current, ["#ffd65a", "#fff2b0", "#e8a33a"], true);
      if (fx.current) fx.current.rain({ count: 36, color: [/*fond local*/"#ffd65a", /*fond local*/"#ffe9a8"] });
    }, 620);
    return function () { clearTimeout(t); };
  }, [fx]);
  var nx = getLevel(p.toXp || 0);
  return (
    <div className="cer-ov cer-level" onClick={function (e) { stop(e); p.onClose(); }}>
      <div className="cer-rays" />
      <div className="cer-lu-medal" ref={medal}>
        <span className="cer-lu-old out">{p.level - 1}</span>
        <span className="cer-lu-new out">{p.level}</span>
      </div>
      <div className="cer-kicker out">Level up</div>
      <div className="cer-lu-title out">{"Level " + p.level}</div>
      <div className="cer-sub">{(nx.next - nx.cur) + " XP to level " + (p.level + 1)}</div>
      <div className="cer-tap">Tap to continue</div>
      <canvas ref={canvas} className="cer-fx" />
    </div>
  );
}

// Examens : file posée par App() (addXp avec ceremony), niveau d'abord puis ligue, par-dessus
// l'écran de résultats de l'examen. Le délai laisse d'abord apparaître le score et passer le jingle.
// items : [{kind:"level", level, toXp} | {kind:"league", fromId, toId, weekly, chestTier}].
export function ExamCeremonies(p) {
  var [idx, setIdx] = useState(-1);
  useEffect(function () {
    var t = setTimeout(function () { setIdx(0); }, 1400);
    return function () { clearTimeout(t); };
  }, []);
  var items = p.items || [];
  if (idx < 0 || idx >= items.length) return null;
  var it = items[idx];
  function next() { if (idx + 1 >= items.length) p.onDone(); else setIdx(idx + 1); }
  if (it.kind === "level") return <LevelUpOverlay key={idx} level={it.level} toXp={it.toXp} onClose={next} />;
  return <LeaguePromotion key={idx} fromId={it.fromId} toId={it.toId} weekly={it.weekly} chestTier={it.chestTier} onClose={next} />;
}

// « Faiblesse devenue force » (Mentor qui se souvient, lot 5, 2026-09-18 ; proto prototypes/mentor-memory/,
// validée « top » par Jérémy). La toile d'araignée — l'ancienne faiblesse — se fend et tombe, la couronne
// de laurier monte. SYMBOLIQUE : aucune récompense (décision du 2026-09-17). `turn` : lib/planner.js
// celebrateTurn ({cat, then:{c,t}, now:{c,t}, spark:[{acc, up}]}), posé par sealSession, une fois par
// catégorie. Rendue par l'écran de fin, après une éventuelle promotion de ligue.
export function TurnCeremony(p) {
  var stage = useRef(null), canvas = useRef(null);
  var fx = useFx(canvas);
  var t = p.turn, txt = ceremonyText(t.cat, t, p.seed || "");
  useEffect(function () {
    sound(playJingleAchieve);
    haptic("achieve");
    var t1 = setTimeout(function () {
      burstAt(fx.current, stage.current, [/*fond local*/"#ffe9a8", /*fond local*/"#f0c850", /*fond local*/"#ffffff"], true);
      if (fx.current) fx.current.rain({ count: 40, color: [/*fond local*/"#ffd65a", /*fond local*/"#ffe9a8"] });
    }, 1300);
    return function () { clearTimeout(t1); };
  }, [fx]);
  return (
    <div className="cer-ov mm-cer" onClick={stop}>
      <div className="cer-rays" />
      <div className="mm-cer-stage" ref={stage}>
        <span className="mm-cer-disc" />
        <span className="mm-cer-wave" />
        <span className="mm-cer-old"><GIcon name="spider-web" size={70} color={/*fond local*/"#c0503a"} /></span>
        <span className="mm-cer-new"><GIcon name="laurel-crown" size={82} color={/*fond local*/"#f0c850"} /></span>
      </div>
      <div className="cer-kicker out">{txt.kicker}</div>
      <div className="mm-cer-title out">{txt.title}</div>
      <div className="mm-cer-sub">{txt.sub}</div>
      <div className="mm-cer-line">{txt.line}</div>
      {t.spark && t.spark.length > 0 && <div className="mm-cer-spark" aria-hidden="true">
        {t.spark.map(function (s, i) { return <i key={i} className={s.up ? "up" : ""} style={{ height: Math.max(4, Math.round(40 * s.acc)) + "px" }} />; })}
      </div>}
      <button className="cer-cta out" onClick={function (e) { stop(e); p.onClose(); }}>Onward</button>
      <canvas ref={canvas} className="cer-fx" />
    </div>
  );
}

export function LeaguePromotion(p) {
  var crest = useRef(null), canvas = useRef(null);
  var fx = useFx(canvas);
  var from = leagueById(p.fromId), to = leagueById(p.toId), next = nextLeague(p.weekly || 0);
  var toColor = to.color;
  useEffect(function () {
    sound(playJingleLeague);
    haptic("league");
    var t1 = setTimeout(function () {
      burstAt(fx.current, crest.current, [toColor, "#ffffff", "#ffe9a8"], true);
      sound(function () { playChestLand(1); });
    }, 1460);
    var t2 = setTimeout(function () { if (fx.current) fx.current.rain({ count: 50, color: [toColor, /*fond local*/"#ffe9a8"] }); }, 1560);
    return function () { clearTimeout(t1); clearTimeout(t2); };
  }, [fx, toColor]);
  var nextTxt = next ? "Next: " + next.name + " at " + next.min.toLocaleString("en-US") + " weekly XP" : "Top league reached";
  return (
    <div className="cer-ov cer-league" style={{ "--lg": to.color }} onClick={stop}>
      <div className="cer-column" />
      <div className="cer-stage">
        <div className="cer-old">
          <span className="cer-half l"><GIcon name={from.gi} size={72} color={from.color} /></span>
          <span className="cer-half r"><GIcon name={from.gi} size={72} color={from.color} /></span>
        </div>
        <div className="cer-new" ref={crest}>
          <span className="cer-wave" />
          <span className="cer-disc"><GIcon name={to.gi} size={84} color={to.color} /></span>
        </div>
      </div>
      <div className="cer-text">
        <div className="cer-kicker out">Promoted</div>
        <div className="cer-lg-name out">{to.name + " League"}</div>
        <div className="cer-lg-sub">{from.name + " → " + to.name + " · " + (p.weekly || 0).toLocaleString("en-US") + " XP this week"}</div>
        <div className="cer-lg-next">{nextTxt}</div>
      </div>
      {p.chestTier != null && <div className="cer-chest">
        <TreasureChestSvg size={54} tier={p.chestTier} idSuffix="cerlg" />
        <div><b className="out">{CHEST_TIER_NAMES[p.chestTier] + " chest earned"}</b><small>League promotion</small></div>
      </div>}
      <button className="cer-cta out" onClick={function (e) { stop(e); p.onClose(); }}>Onward</button>
      <canvas ref={canvas} className="cer-fx" />
    </div>
  );
}
