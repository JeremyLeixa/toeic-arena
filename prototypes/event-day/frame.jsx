// Proto « monde événements » — une journée, pilotée par l'URL.
//   e=1 Checklist + soirée | e=2 Prévu = paré (voir game.jsx)
//   speed=<minutes de jeu par seconde réelle> (défaut 1 : la journée dure 8 min)
//   start=intro | desk (saute le brief) | end (bilan d'une journée simulée)
// Le moteur est celui de Nine to Five en variante V3 (horloge + réputation), passé en v="3".
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CSS from "./office.css?raw";
import { OfficeDay } from "./game.jsx";

var q = new URLSearchParams(location.search);
var E = q.get("e") === "2" ? "2" : "1";
var SPEED = parseFloat(q.get("speed")) > 0 ? parseFloat(q.get("speed")) : 1;
var START = q.get("start") || "intro";
var AT = Math.max(0, parseInt(q.get("at"), 10) || 0);   // at=<minutes depuis 9:00> : démarrer la journée plus tard (test)

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <style>{CSS}</style>
    <OfficeDay v="3" evt={E} speed={SPEED} start={START} at={AT} />
  </StrictMode>
);
