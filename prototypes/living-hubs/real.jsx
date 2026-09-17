// Banc des hubs câblés (2026-09-17) : les VRAIS écrans de src/ (Train → sous-vues, GamesHub,
// ListenHub, ReadingHub) avec le profil fictif de hubs.jsx. Aucun appel réseau : classCode
// « visitor » (GamesHub ne lit pas le classement de la promo) + groupType « school » (accès complet).
// Paramètres : screen=gv|ex|tips|games|listening|reading  profile=mix|new  mode=dark|light  skin=<id>
//   ev=flash (Flash Hour actif : tout à plein tarif)  rm=1
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { fresh } from "../../src/lib/profileSchema.js";
import { Tabs } from "../../src/components/Tabs.jsx";
import { Train } from "../../src/features/home/Train.jsx";
import { GamesHub } from "../../src/features/games/GamesHub.jsx";
import { ListenHub, ReadingHub } from "../../src/features/listening/Listening.jsx";
import { fixture } from "./hubs.jsx";

var q = new URLSearchParams(location.search);
var SCREEN = q.get("screen") || "gv";
var MODE = q.get("mode") || "dark";
var SKIN = q.get("skin") || "";
var PROFILE = q.get("profile") || "mix";
var EVENTS = q.get("ev") === "flash" ? [{ type: "flash_hour" }] : [];
var RM = q.get("rm") === "1";
var noop = function () {};
var RM_CSS = "*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}";

function Screen() {
  var u = fixture(fresh("Camille", "visitor"), PROFILE);
  var common = { u: u, nav: noop, groupType: "school", onPremium: noop, events: EVENTS };
  if (SCREEN === "games") return <><GamesHub {...common} /><Tabs cur="games" go={noop} /></>;
  if (SCREEN === "listening") return <div className="pg-wrap"><ListenHub {...common} back={noop} /><Tabs cur="train" go={noop} /></div>;
  if (SCREEN === "reading") return <div className="pg-wrap"><ReadingHub {...common} back={noop} /><Tabs cur="train" go={noop} /></div>;
  var view = SCREEN === "ex" ? 0 : SCREEN === "tips" ? 2 : 1;
  return <><Train {...common} tabGo={noop} initialView={view} setUser={noop} /><Tabs cur="train" go={noop} /></>;
}

function Frame() {
  var lc = "app" + (MODE === "light" ? " light" : "") + (SKIN ? " skin-" + SKIN : "");
  return <div className={lc}>
    <style>{CSS}</style>
    {RM && <style>{RM_CSS}</style>}
    <Screen />
  </div>;
}

var el = document.getElementById("root");
(el.__lhRoot || (el.__lhRoot = createRoot(el))).render(<StrictMode><Frame /></StrictMode>);
