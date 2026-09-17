// Proto hubs vivants (2026-09-17) — un hub (liste de tuiles) dans une variante, avec le CSS de
// l'appli et un profil fictif local. Aucun appel réseau. Paramètres d'URL :
//   v=A|B|C|D  screen=gv|games|reading  mode=dark|light  skin=<id>  profile=mix|new  rm=1
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { fresh } from "../../src/lib/profileSchema.js";
import { Tabs } from "../../src/components/Tabs.jsx";
import { GIcon } from "../../src/components/icons.jsx";
import { HUBS, TILES, Summary, fixture } from "./hubs.jsx";
import LIVING from "./living.css?raw";

var q = new URLSearchParams(location.search);
var V = q.get("v") || "A";
var SCREEN = HUBS[q.get("screen")] ? q.get("screen") : "gv";
var MODE = q.get("mode") || "dark";
var SKIN = q.get("skin") || "";
var PROFILE = q.get("profile") || "mix";
var RM = q.get("rm") === "1";
var noop = function () {};
var RM_CSS = "*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}";

function Hub() {
  var u = fixture(fresh("Camille", "idrac2026"), PROFILE);
  var hub = HUBS[SCREEN];
  var Tile = TILES[V];
  var list = <div className="rg-games" style={{ display: "flex", flexDirection: "column", gap: hub.gap }}>
    {hub.items.map(function (it, i) {
      return <div key={it.id} style={{ animation: "fadeIn .3s ease-out", animationDelay: (i * .04) + "s", animationFillMode: "both" }}>
        <Tile it={it} u={u} kind={hub.kind} />
      </div>;
    })}
  </div>;
  if (hub.kind === "reading") return <div className="enter" style={{ padding: "20px 16px", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
    <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}><GIcon name="bookmarklet" size={60} color="var(--cyan)" /></div>
    <h1 className="out" style={{ fontWeight: 900, fontSize: 26, marginBottom: 8 }}>{hub.title}</h1>
    <p style={{ color: "var(--t2)", fontSize: 13, marginBottom: V === "A" ? 32 : 20, lineHeight: 1.6 }}>{hub.sub}</p>
    <div style={{ textAlign: "left" }}><Summary v={V} u={u} hub={hub} />{list}</div>
    <button className="btn2" style={{ marginTop: 24, width: "100%" }}>Back</button>
  </div>;
  if (hub.kind === "games") return <div className="enter" style={{ padding: "20px 16px 100px" }}>
    <h1 className="out" style={{ fontWeight: 800, fontSize: 24, marginBottom: 4 }}>{hub.title}</h1>
    <p style={{ color: "var(--t2)", fontSize: 13, marginBottom: 20 }}>{hub.sub}</p>
    <Summary v={V} u={u} hub={hub} />
    {list}
  </div>;
  return <div className="enter" style={{ padding: "20px 16px 100px" }}>
    <button style={{ background: "none", border: "none", color: "var(--t2)", cursor: "pointer", fontSize: 14, marginBottom: 16, padding: 0 }}>{"← " + hub.back}</button>
    <h2 className="out" style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{hub.title}</h2>
    <p style={{ color: "var(--t3)", fontSize: 12, marginBottom: 16 }}>{hub.sub}</p>
    <Summary v={V} u={u} hub={hub} />
    {list}
  </div>;
}

function Frame() {
  var lc = "app" + (MODE === "light" ? " light" : "") + (SKIN ? " skin-" + SKIN : "");
  return <div className={lc}>
    <style>{CSS}</style>
    <style>{LIVING}</style>
    {RM && <style>{RM_CSS}</style>}
    <Hub />
    <Tabs cur={SCREEN === "games" ? "games" : "train"} go={noop} />
  </div>;
}

// Rechargement à chaud : réutiliser la racine au lieu d'en recréer une.
var el = document.getElementById("root");
(el.__lhRoot || (el.__lhRoot = createRoot(el))).render(<StrictMode><Frame /></StrictMode>);
