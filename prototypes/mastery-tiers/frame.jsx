// Proto échelons de maîtrise (2026-09-19) — un hub dans une variante, avec le CSS de l'appli et un
// profil fictif local. Aucun appel réseau. Paramètres d'URL :
//   v=A|B|C|D  screen=games|gv  mode=dark|light  skin=<id>  profile=mix|new  rm=1
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { fresh } from "../../src/lib/profileSchema.js";
import { Tabs } from "../../src/components/Tabs.jsx";
import { HUBS, TILES, Shelf, fixture } from "./hubs.jsx";
import TIERS_CSS from "./tiers.css?raw";

var q = new URLSearchParams(location.search);
var V = TILES[q.get("v")] ? q.get("v") : "B";
var SCREEN = HUBS[q.get("screen")] ? q.get("screen") : "games";
var MODE = q.get("mode") || "dark";
var SKIN = q.get("skin") || "";
var PROFILE = q.get("profile") || "mix";
var RM = q.get("rm") === "1";
var noop = function () {};
var RM_CSS = "*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}";

function Hub() {
  var u = fixture(fresh("Camille", "idrac2026"), PROFILE);
  var hub = HUBS[SCREEN], Tile = TILES[V];
  var list = <div className="rg-games" style={{ display: "flex", flexDirection: "column", gap: hub.gap }}>
    {hub.items.map(function (it, i) {
      return <div key={it.id} style={{ animation: "fadeIn .3s ease-out", animationDelay: (i * .04) + "s", animationFillMode: "both" }}>
        <Tile it={it} u={u} lg={hub.size === "lg"} />
      </div>;
    })}
  </div>;
  if (hub.kind === "games") return <div className="enter" style={{ padding: "20px 16px 100px" }}>
    <h1 className="out" style={{ fontWeight: 800, fontSize: 24, marginBottom: 4 }}>{hub.title}</h1>
    <p style={{ color: "var(--t2)", fontSize: 13, marginBottom: 20 }}>{hub.sub}</p>
    <Shelf v={V} u={u} hub={hub} />
    {list}
  </div>;
  return <div className="enter" style={{ padding: "20px 16px 100px" }}>
    <button style={{ background: "none", border: "none", color: "var(--t2)", cursor: "pointer", fontSize: 14, marginBottom: 16, padding: 0 }}>{"← " + hub.back}</button>
    <h2 className="out" style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{hub.title}</h2>
    <p style={{ color: "var(--t3)", fontSize: 12, marginBottom: 16 }}>{hub.sub}</p>
    <Shelf v={V} u={u} hub={hub} />
    {list}
  </div>;
}

function Frame() {
  var lc = "app" + (MODE === "light" ? " light" : "") + (SKIN ? " skin-" + SKIN : "");
  return <div className={lc}>
    <style>{CSS}</style>
    <style>{TIERS_CSS}</style>
    {RM && <style>{RM_CSS}</style>}
    <Hub />
    <Tabs cur={SCREEN === "games" ? "games" : "train"} go={noop} />
  </div>;
}

// Rechargement à chaud : réutiliser la racine au lieu d'en recréer une.
var el = document.getElementById("root");
(el.__mtRoot || (el.__mtRoot = createRoot(el))).render(<StrictMode><Frame /></StrictMode>);
