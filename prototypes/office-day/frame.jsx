// Proto « journée au bureau » — une journée, pilotée par l'URL.
//   v=1 Rush | v=2 Carrière | v=3 Rush + carrière
//   speed=<minutes de jeu par seconde réelle> (défaut 1 : la journée dure 8 min)
//   start=intro | desk (saute le brief) | end (bilan d'une journée simulée)
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CSS from "./office.css?raw";
import { OfficeDay } from "./game.jsx";

var q = new URLSearchParams(location.search);
var V = ["1", "2", "3"].indexOf(q.get("v")) >= 0 ? q.get("v") : "1";
var SPEED = parseFloat(q.get("speed")) > 0 ? parseFloat(q.get("speed")) : 1;
var START = q.get("start") || "intro";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <style>{CSS}</style>
    <OfficeDay v={V} speed={SPEED} start={START} />
  </StrictMode>
);
