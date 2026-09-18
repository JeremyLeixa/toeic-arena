// La lettre du lundi d'Aldric (Mentor qui se souvient, lot 6, 2026-09-18 ; proto prototypes/mentor-memory/,
// moment 1, validé par Jérémy). Calculée côté client (lib/mentorVoice.js mondayLetter) : le push du lundi
// (supabase/functions/weekly-results) n'en est que l'accroche, dupliquer le modèle en Deno ferait une
// seconde source de vérité.
// Rendue par App() au premier passage sur Home de la semaine (lib/planner.js letterDue, marqueur
// `letterSeen` = le lundi), et relisible depuis la Chronique du Mentor. Parchemin de l'écran de fin
// (classes sr-*), palette fixe : lisible en clair et sur tout skin.
// onClose("later" | "plan") : App marque la lettre lue ; « See today's plan » ouvre la feuille du Mentor.
import { useEffect, useMemo, useState } from "react";
import { GIcon } from "../../components/icons.jsx";
import { mondayLetter } from "../../lib/mentorVoice.js";
import { useWeeklySnaps } from "./useWeeklySnaps.js";

function stop(e) { e.stopPropagation(); }

export function MondayLetter(p) {
  var snaps = useWeeklySnaps(p.u);
  // Les instantanés ne passent pas (hors ligne, RPC lente) : au bout de 2,5 s la lettre part sans eux.
  var [late, setLate] = useState(false);
  useEffect(function () { var t = setTimeout(function () { setLate(true); }, 2500); return function () { clearTimeout(t); }; }, []);
  var ready = snaps !== null || late;
  var L = useMemo(function () { return ready ? mondayLetter(p.u, new Date(), snaps || []) : null; }, [ready, snaps]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!L) return null;
  return (
    <div className="sr-root mm-letter-root" onClick={stop}>
      <div className="sr-page">
        <div className="sr-scroll">
          <div className="sr-roll" />
          <div className="sr-parch mm-letter">
            <div className="sr-sigil"><GIcon name="wizard-staff" size={30} color={/*fond local*/"#6b3410"} /></div>
            <div className="sr-chron out">{"Aldric's Monday letter"}</div>
            <div className="sr-date">{L.date}</div>
            {L.paragraphs.map(function (t, i) { return <p key={i} className="mm-lp" style={{ animationDelay: (0.5 + i * 0.35) + "s" }}>{t}</p>; })}
            <div className="mm-sign" style={{ animationDelay: (0.5 + L.paragraphs.length * 0.35) + "s" }}>{"Aldric"}</div>
          </div>
          <div className="sr-roll" />
        </div>
      </div>
      <div className="sr-cta">
        <button className="btn2 out" onClick={function () { p.onClose("later"); }}>{p.reread ? "Close" : "Later"}</button>
        <button className="btn1 out" onClick={function () { p.onClose("plan"); }}>{"See today's plan"}</button>
      </div>
    </div>
  );
}
