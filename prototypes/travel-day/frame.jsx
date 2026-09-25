// Proto « monde voyage » — une journée, pilotée par l'URL.
//   w=1 Bulletin | w=2 Prévu = paré (voir game.jsx)
//   speed=<minutes de jeu par seconde réelle> (défaut 1 : la journée dure 8 min)
//   start=intro | desk (saute le brief) | end (bilan d'une journée simulée)
// Le moteur est celui de Nine to Five en variante V3 (horloge + réputation), passé en v="3".
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CSS from "./office.css?raw";
import { OfficeDay } from "./game.jsx";

var q = new URLSearchParams(location.search);
var W = q.get("w") === "2" ? "2" : "1";
var SPEED = parseFloat(q.get("speed")) > 0 ? parseFloat(q.get("speed")) : 1;
var START = q.get("start") || "intro";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <style>{CSS}</style>
    <OfficeDay v="3" weather={W} speed={SPEED} start={START} />
  </StrictMode>
);
