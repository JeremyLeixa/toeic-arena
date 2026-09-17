// Suivi d'une manche pour le HUD de session (2026-09-17, variante E) : une entrée par réponse, série
// en cours et combo. Hook en .js (react-refresh n'y contrôle pas les exports), à côté de lazyNamed.js.
// record() s'appelle depuis le gestionnaire de réponse (un événement : StrictMode ne le rejoue pas,
// donc un seul son). Les paliers et le choix du son viennent de lib/sessionHud.js (testé).
import { useEffect, useRef, useState } from "react";
import { comboAt, streakOf } from "../lib/sessionHud.js";
import { playCombo, playStreak } from "../sounds.js";

export function useSessionTrack() {
  var [results, setResults] = useState([]);
  var [combo, setCombo] = useState(null); // {n, id} pendant 1,4 s après un palier
  var ref = useRef([]);   // copie à jour : deux réponses dans le même tick ne se marchent pas dessus
  var seq = useRef(0);
  var timers = useRef([]);

  useEffect(function () {
    return function () { timers.current.forEach(clearTimeout); timers.current = []; };
  }, []);

  function later(fn, ms) { timers.current.push(setTimeout(fn, ms)); }

  // ok : true (juste), false (faux), null (répondu sans verdict : examens).
  function record(ok) {
    var next = ref.current.concat([ok === null || ok === undefined ? null : ok ? 1 : 0]);
    ref.current = next;
    setResults(next);
    var c = comboAt(next);
    if (!c) return;
    var id = ++seq.current;
    setCombo({ n: c.n, id: id });
    later(function () {
      try { (c.sound === "streak" ? playStreak : playCombo)(); } catch (e) { console.warn("[session] combo sound:", e && e.message); }
    }, 260);
    later(function () { setCombo(function (cur) { return cur && cur.id === id ? null : cur; }); }, 1400);
  }

  // Rejouer sans remonter le composant (GerInf, PhrasalDojo).
  function reset() { ref.current = []; setResults([]); setCombo(null); }

  return { results: results, record: record, reset: reset, streak: streakOf(results), combo: combo };
}
