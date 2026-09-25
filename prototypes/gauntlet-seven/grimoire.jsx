// Relecture du grimoire d'Anchor Hall dans le vrai lecteur. « Back » rouvre le grimoire (rien d'autre à montrer).
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { GrimoireReader } from "../../src/components/GrimoireReader.jsx";
import { GRIMOIRE_PREPOSITIONS } from "../../src/data/prepositionsGrimoire.js";

var q = new URLSearchParams(location.search);
var lc = "app onboard-shell" + (q.get("mode") === "light" ? " light" : "") + (q.get("skin") ? " skin-" + q.get("skin") : "");

function App() {
  var [k, setK] = useState(0);
  return (
    <div className={lc} style={{ minHeight: "100vh" }}>
      <style>{CSS}</style>
      <GrimoireReader key={k} grimoire={GRIMOIRE_PREPOSITIONS} back={function () { setK(k + 1); }} />
    </div>
  );
}
createRoot(document.getElementById("root")).render(<StrictMode><App /></StrictMode>);
