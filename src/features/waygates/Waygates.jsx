// The Waygates (2026-09-24) — le hub des modules thématiques : les portails d'Aldric vers le monde réel.
// Chaque monde habille les vraies Parts du TOEIC dans une situation (choix de Jérémy : « faire bosser sans
// en donner l'air »). Mondes : Nine to Five (`office`), Jet Lag (`travel`), Front Desk (`service`), Opening Night (`opening`), un seul écran WorldDay.jsx. Un monde de plus =
// une entrée dans WORLDS, sa route, son écran ; les portails scellés annoncent la suite.
//
// Passage du portail (variante V3 « Plongée », prototypes/waygate-portal/) : au tap, le hub plonge vers le point
// touché pendant qu'un cœur de lumière grossit jusqu'à remplir l'écran (0,8 s, son playPortal), puis on navigue ;
// l'écran du monde joue l'arrivée (portal.js relie les deux). Mouvement réduit : navigation directe, fondu seul.
import { useEffect, useRef, useState } from "react";
import { gradeOf } from "../../lib/officeGrades.js";
import { worldMeta, worldRep } from "../../lib/worlds.js";
import { GIcon } from "../../components/icons.jsx";
import { playPortal } from "../../sounds.js";
import { PORTAL_DIVE_MS, markPortal, reducedMotion } from "./portal.js";
import "./Waygates.css";

// Les mondes. `id` = la route ET l'id de lib/worlds.js ; la ligne d'état (grade, journées) vient de gameScores[repKey].
var WORLDS = [
  { id: "office", icon: "briefcase", desc: "A working day at Meridian Harbor Group. Emails, calls, meetings: the clock is running.", days: "on the job" },
  { id: "travel", icon: "commercial-airplane", desc: "A business trip. Check the forecast, catch the announcements, make it on time.", days: "on the road" },
  { id: "service", icon: "shopping-bag", desc: "Saturday at the customer care counter. Serve, listen, keep your cool.", days: "at the counter" },
  { id: "opening", icon: "theater-curtains", desc: "A day at an event agency. Clear your list before the doors open at 16:00.", days: "backstage" },
];
function worldLine(u, w) {
  var o = (u && u.gameScores && u.gameScores[worldMeta(w.id).repKey]) || {};
  return gradeOf(worldRep(u, w.id)).name + (o.days ? " · " + o.days + (o.days > 1 ? " days " : " day ") + w.days : " · first day");
}

export function Waygates(p) {
  var [dive, setDive] = useState(null);               // {x, y, k} pendant la plongée
  var timer = useRef(0);
  useEffect(function () { return function () { clearTimeout(timer.current); }; }, []);

  function enter(w, e) {
    if (dive) return;                                 // un seul passage à la fois (double tap)
    markPortal();
    try { playPortal(); } catch (err) { console.warn("[waygates] portal sound:", err && err.message); }
    if (reducedMotion()) { p.nav(w.id); return; }
    // Le cœur part du point touché et doit couvrir tout l'écran : échelle = plus grande distance à un coin.
    var x = e && e.clientX != null ? e.clientX : window.innerWidth / 2, y = e && e.clientY != null ? e.clientY : window.innerHeight / 2;
    var far = Math.max(Math.hypot(x, y), Math.hypot(window.innerWidth - x, y), Math.hypot(x, window.innerHeight - y), Math.hypot(window.innerWidth - x, window.innerHeight - y));
    setDive({ x: x, y: y, k: Math.ceil(far / 20) + 2 });
    timer.current = setTimeout(function () { p.nav(w.id); }, PORTAL_DIVE_MS);
  }

  var pos = dive ? { "--wx": dive.x + "px", "--wy": dive.y + "px", "--wk": dive.k } : null;
  return (<>
    <div className={"enter wg" + (dive ? " dive" : "")} style={pos}>
      <button className="back-btn wg-back" onClick={p.back}>{"← Back"}</button>
      <div className="wg-hero">
        <GIcon name="magic-portal" size={78} color="var(--cyan)" />
        <h1 className="out">The Waygates</h1>
        <p>Aldric{"'"}s portals open onto the real world. Step through, and put your English to work.</p>
      </div>
      {WORLDS.map(function (w) {
        return (
          <button key={w.id} className="crd wg-gate" onClick={function (e) { enter(w, e); }}>
            <GIcon name={w.icon} size={44} color="var(--cyan)" />
            <div className="wg-gate-b">
              <div className="wg-gate-n out">{worldMeta(w.id).name}</div>
              <div className="wg-gate-d">{w.desc}</div>
              <div className="wg-gate-m">{worldLine(p.u, w)}</div>
            </div>
          </button>);
      })}
      <div className="crd wg-gate sealed">
        <GIcon name="padlock" size={36} color="var(--t3)" />
        <div className="wg-gate-b">
          <div className="wg-gate-n out">A sealed gate</div>
          <div className="wg-gate-d">More worlds are being forged.</div>
        </div>
      </div>
    </div>
    {dive && <div className="wg-fx" style={pos}><i className="ring" /><i className="ring" /><i className="ring" /><i className="core" /></div>}
  </>);
}
