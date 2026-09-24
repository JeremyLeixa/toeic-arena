// La feuille d'Aldric qui propose les notifications (2026-09-24, proto prototypes/push-optin/, variante B).
// Qui la voit et quand : lib/pushOffer.js ; où elle passe dans le budget d'interruptions : App.jsx (après la
// lettre du lundi). mode "ask" : demande réelle (la vraie boîte du navigateur suit « Turn on reminders ») ;
// mode "ios" : iPhone hors appli installée, la demande y est impossible → les 3 étapes d'installation.
// Les textes ne promettent que les trois notifications qui existent (Edge Functions).
import { useState } from "react";
import { GIcon } from "./icons.jsx";

var WHAT = [
  { ic: "flame", t: "8 pm, only if your streak is about to break" },
  { ic: "scroll-unfurled", t: "Monday morning, when Aldric's letter is ready" },
  { ic: "castle", t: "If you've been away for a week" },
];
var IOS_STEPS = [
  { ic: "compass", t: "Open app.verse-arena.fr in Safari" },
  { ic: "pointing", t: "Tap the Share button at the bottom of the screen" },
  { ic: "tower-flag", t: "Choose “Add to Home Screen”, then open Verse Arena from there" },
];

export function PushOfferSheet(p) {
  var ios = p.mode === "ios";
  var [busy, setBusy] = useState(false);
  var [done, setDone] = useState(false);
  function turnOn() {
    if (busy) return;
    setBusy(true);
    Promise.resolve(p.onTurnOn()).then(function (ok) {
      setBusy(false);
      if (ok) { setDone(true); setTimeout(p.onClose, 1600); } else p.onClose();
    }).catch(function (e) { console.warn("[pushOffer] turn on caught:", e && e.message); setBusy(false); p.onClose(); });
  }
  var rows = ios ? IOS_STEPS : WHAT;
  return (
    <div className="pof-back" role="dialog" aria-modal="true" aria-label="Reminders">
      <div className="pof-sheet">
        <div className="pof-grip" />
        <div className="pof-eyebrow">Aldric</div>
        {done
          ? <div className="pof-done"><GIcon name="ringing-bell" size={22} color="var(--cyan)" /><span>{"Reminders on. You can change this anytime in Profile."}</span></div>
          : <>
            <div className="pof-t">{"A word before you go, " + p.name + "."}</div>
            <div className="pof-s">{ios
              ? "I can remind you, but iPhone only lets installed apps do it. Add Verse Arena to your home screen:"
              : "I can send you a short reminder, only when it matters:"}</div>
            <div className="pof-what">{rows.map(function (w) { return (
              <div key={w.t} className="pof-row"><GIcon name={w.ic} size={16} color="var(--cyan)" /><span>{w.t}</span></div>); })}</div>
            {ios
              ? <button className="btn1 pof-go" onClick={p.onLater}>{"Got it"}</button>
              : <button className="btn1 pof-go" onClick={turnOn} disabled={busy} style={{ opacity: busy ? .6 : 1 }}>{busy ? "…" : "Turn on reminders"}</button>}
            {!ios && <button className="pof-later" onClick={p.onLater}>{"Not now"}</button>}
            <div className="pof-foot">{ios ? "I'll ask again once the app is installed." : "You can change this anytime in Profile."}</div>
          </>}
      </div>
    </div>
  );
}
