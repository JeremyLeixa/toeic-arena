// The Waygates (2026-09-24) — le hub des modules thématiques : les portails d'Aldric vers le monde réel.
// Chaque monde habille les vraies Parts du TOEIC dans une situation (choix de Jérémy : « faire bosser sans
// en donner l'air »). Premier monde : Nine to Five (route `office`, NineToFive.jsx). Un monde de plus =
// une entrée dans WORLDS, sa route, son écran ; les portails scellés annoncent la suite.
import { gradeOf, officeRep } from "../../lib/officeGrades.js";
import { GIcon } from "../../components/icons.jsx";

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
`;

// Les mondes. `id` = la route ; `meta(u)` = la ligne d'état (grade, journées).
var WORLDS = [
  { id: "office", name: "Nine to Five", icon: "briefcase", desc: "A working day at Meridian Harbor Group. Emails, calls, meetings: the clock is running.",
    meta: function (u) { var o = (u && u.gameScores && u.gameScores.officeDay) || {}; var g = gradeOf(officeRep(u)); return g.name + (o.days ? " · " + o.days + (o.days > 1 ? " days" : " day") + " on the job" : " · first day"); } },
];

export function Waygates(p) {
  return (<><style>{WG_CSS}</style>
    <div className="enter wg">
      <button className="back-btn wg-back" onClick={p.back}>{"← Back"}</button>
      <div className="wg-hero">
        <GIcon name="magic-portal" size={78} color="var(--cyan)" />
        <h1 className="out">The Waygates</h1>
        <p>Aldric{"'"}s portals open onto the real world. Step through, and put your English to work.</p>
      </div>
      {WORLDS.map(function (w) {
        return (
          <button key={w.id} className="crd wg-gate" onClick={function () { p.nav(w.id); }}>
            <GIcon name={w.icon} size={44} color="var(--cyan)" />
            <div className="wg-gate-b">
              <div className="wg-gate-n out">{w.name}</div>
              <div className="wg-gate-d">{w.desc}</div>
              <div className="wg-gate-m">{w.meta(p.u)}</div>
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
    </div></>);
}
