// The Waygates (2026-09-24) — le hub des modules thématiques : les portails d'Aldric vers le monde réel.
// Chaque monde habille les vraies Parts du TOEIC dans une situation (choix de Jérémy : « faire bosser sans
// en donner l'air »). Mondes : Nine to Five (`office`), Jet Lag (`travel`), Front Desk (`service`), un seul écran WorldDay.jsx. Un monde de plus =
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

var WG_CSS = `
.wg{position:relative;padding:56px 18px 40px;min-height:100vh}
.wg-back{position:absolute;top:10px;left:16px;margin-bottom:0}
.wg-hero{display:flex;flex-direction:column;align-items:center;text-align:center;margin:6px 0 20px;color:var(--cyan)}
.wg-hero h1{font-size:30px;font-weight:900;margin:10px 0 6px;color:var(--t1)}
.wg-hero p{margin:0;font-size:14px;line-height:1.55;color:var(--t2);max-width:320px}
.wg-gate{display:flex;gap:14px;align-items:center;width:100%;text-align:left;padding:16px!important;margin-bottom:10px;cursor:pointer;font-family:inherit;color:var(--t1);border:1.5px solid var(--cyan)!important;background-image:linear-gradient(135deg,rgba(var(--cx),.18),transparent)}
.wg-gate-b{flex:1;min-width:0}
.wg-gate-n{font-size:17px;font-weight:800;color:var(--t1)}
.wg-gate-d{font-size:13px;color:var(--t2);margin-top:2px;line-height:1.45}
.wg-gate-m{font-size:12px;font-weight:700;color:var(--cyan);margin-top:6px}
.wg-gate.sealed{cursor:default;border-color:var(--bdr)!important;background-image:none;opacity:.7}
.wg-gate.sealed .wg-gate-n{color:var(--t2)}
.wg.dive{animation:wg-dive .8s cubic-bezier(.7,0,.25,1) forwards;transform-origin:var(--wx) var(--wy);pointer-events:none}
@keyframes wg-dive{to{transform:scale(2.6);filter:blur(5px);opacity:0}}
.wg-fx{position:fixed;inset:0;z-index:300;pointer-events:none}
.wg-fx i{position:absolute;left:var(--wx);top:var(--wy);width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%}
.wg-fx .core{background:radial-gradient(circle,rgba(255,250,240,.98) 0,rgba(var(--cx),.95) 40%,var(--bg) 72%);animation:wg-core .8s cubic-bezier(.7,0,.25,1) forwards}
.wg-fx .ring{border:2px solid rgba(var(--cx),.9);box-shadow:0 0 18px rgba(var(--cx),.8),inset 0 0 18px rgba(var(--cx),.6);animation:wg-ring .8s cubic-bezier(.3,0,.2,1) forwards}
.wg-fx .ring:nth-child(2){animation-delay:.1s}
.wg-fx .ring:nth-child(3){animation-delay:.2s}
@keyframes wg-core{from{transform:scale(1)}to{transform:scale(var(--wk))}}
@keyframes wg-ring{from{transform:scale(1);opacity:1}to{transform:scale(14);opacity:0}}
@media (prefers-reduced-motion:reduce){.wg.dive,.wg-fx{animation:none!important;display:none}}
`;

// Les mondes. `id` = la route ET l'id de lib/worlds.js ; la ligne d'état (grade, journées) vient de gameScores[repKey].
var WORLDS = [
  { id: "office", icon: "briefcase", desc: "A working day at Meridian Harbor Group. Emails, calls, meetings: the clock is running.", days: "on the job" },
  { id: "travel", icon: "commercial-airplane", desc: "A business trip. Check the forecast, catch the announcements, make it on time.", days: "on the road" },
  { id: "service", icon: "shopping-bag", desc: "Saturday at the customer care counter. Serve, listen, keep your cool.", days: "at the counter" },
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
  return (<><style>{WG_CSS}</style>
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
