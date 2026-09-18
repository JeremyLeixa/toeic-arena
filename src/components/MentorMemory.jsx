// La mémoire d'Aldric dans une session (Mentor qui se souvient, lot 5, 2026-09-18 ; proto
// prototypes/mentor-memory/, moments « Avant » et « Après »). Partagé par le Drill et la chasse.
//   AldricBrief     — le parchemin court qui dit comment la manche a été composée, et pourquoi
//                     (lib/mentorVoice.js briefing). Palette fixe, comme le parchemin de fin.
//   AldricRemembers — ce qui a changé (bestiaire, cible du jour), rendu par SessionResult AVANT les
//                     leçons (prop `memory`). Jetons de l'appli : suit skins et mode clair.
import { GIcon } from "./icons.jsx";

export function AldricBrief(p) {
  var b = p.brief;
  return (
    <div className="mm-brief">
      <div className="mm-brief-head"><GIcon name="wizard-staff" size={20} color={/*fond local*/"#6b3410"} /><b className="out">{p.title}</b></div>
      {b.lines.map(function (t, i) { return <p key={i}>{t}</p>; })}
      {b.chips.length > 0 && <div className="mm-chips">
        {b.chips.map(function (c, i) { return <span key={i} className="mm-chip"><GIcon name={c.icon} size={12} color={/*fond local*/"#6b3410"} />{c.text}</span>; })}
      </div>}
    </div>
  );
}

export function AldricRemembers(p) {
  if (!p.lines || !p.lines.length) return null;
  return (
    <div className="crd mm-remember">
      <div className="mm-rem-head"><GIcon name="wizard-staff" size={16} color="var(--purple)" /><b className="out">Aldric remembers</b>{p.aside && <small>{p.aside}</small>}</div>
      {p.lines.map(function (l, i) {
        return (
          <div key={i} className="mm-rem-line">
            <GIcon name={l.icon} size={20} color={l.tone === "win" ? "var(--green)" : "var(--t2)"} />
            <div><b>{l.text}</b>{l.sub && <small>{l.sub}</small>}</div>
          </div>
        );
      })}
    </div>
  );
}
