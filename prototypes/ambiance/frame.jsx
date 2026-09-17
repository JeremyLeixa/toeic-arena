// Proto ambiance (2026-09-17) — monte les VRAIS écrans Home / Train / Drill avec un profil
// fictif local (aucun appel Supabase : ces écrans n'en font pas) et applique une variante
// d'ambiance. Paramètres d'URL :
//   v=A|B|C|D|E  screen=home|train|drill  mode=dark|light  skin=<id>  fest=<id>
//   chest=emoji|svg|glow  tier=0..3  n=0..9  rm=1 (mouvement réduit simulé)
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { CSS } from "../../src/styles/appCss.js";
import { fresh } from "../../src/lib/profileSchema.js";
import { Home } from "../../src/features/home/Home.jsx";
import { Train } from "../../src/features/home/Train.jsx";
import { Drill } from "../../src/features/train/grammar.jsx";
import { Tabs } from "../../src/components/Tabs.jsx";
import { TreasureChestSvg } from "../../src/components/avatar.jsx";
import { CHEST_TOAST_COLOR } from "../../src/features/chests/chestTheme.js";
import AMB from "./ambiance.css?raw";

var q = new URLSearchParams(location.search);
var V = q.get("v") || "A";
var SCREEN = q.get("screen") || "home";
var MODE = q.get("mode") || "dark";
var SKIN = q.get("skin") || "";
var FEST = q.get("fest") || "";
var CHEST = q.get("chest") || "emoji";
var TIER = Math.max(0, Math.min(3, +(q.get("tier") || 3)));
var N = +(q.has("n") ? q.get("n") : 1);
var RM = q.get("rm") === "1";
var TIER_KEYS = ["novice", "guerrier", "champion", "legendaire"];
var noop = function () {};

// Même règle que la media query de l'appli, sans la media query.
var RM_CSS = "*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}";

function fixture() {
  var u = fresh("Camille", "idrac2026");
  var y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  function ms(c, t, s) { return { correct: c, total: t, sessions: s, lastDate: y, history: [], catStats: {} }; }
  Object.assign(u, {
    xp: 5420, weeklyXp: 640, streak: 5, lastActive: y,
    avatar: "chevalier", equippedTitle: "squire", equippedFrame: "gold_neon",
    theme: MODE, equippedSkin: SKIN || null, tutorialPending: false, gdprConsent: true, joinedAt: "2026-09-01",
    stats: { totalQ: 820, correct: 590, sessions: 64, cardsRev: 300, perfects: 6, drills: 20 },
    moduleScores: { drill: ms(118, 160, 16), lisP2: ms(70, 100, 10), wordfam: ms(40, 60, 4), tavern: ms(50, 75, 5) },
    mockResults: { mock1: { score: 30, total: 49, toeicEstimate: 340, date: y } },
  });
  return u;
}

// Remplace le 📦 du bouton « Treasure Chest Available » de Home par le vrai coffre SVG.
// Proto uniquement : on vise le bouton par son texte et on rend le SVG dans son 1er span.
function ChestSwap() {
  var [slot, setSlot] = useState(null);
  useEffect(function () {
    var id = setInterval(function () {
      var btn = [].slice.call(document.querySelectorAll("button")).find(function (b) { return /Treasure Chest/.test(b.textContent); });
      if (!btn) return;
      clearInterval(id);
      // Le span de Home garde son emoji (masqué en CSS, font-size:0) : on rend dans un
      // conteneur à nous, sinon React refuse un portal dans un élément qui a du texte.
      var host = document.createElement("span");
      host.className = "amb-chesthost";
      btn.firstElementChild.appendChild(host);
      btn.classList.add("amb-chestbtn");
      if (CHEST === "glow") btn.classList.add("glow");
      btn.style.setProperty("--amb-tier", CHEST_TOAST_COLOR[TIER_KEYS[TIER]]);
      setSlot(host);
    }, 40);
    return function () { clearInterval(id); };
  }, []);
  if (!slot) return null;
  return createPortal(<>
    <TreasureChestSvg size={CHEST === "glow" ? 60 : 46} tier={TIER} idSuffix="home" />
    {CHEST === "glow" && N > 1 && <b className="amb-count">{"×" + N}</b>}
  </>, slot);
}

function Screen() {
  var u = fixture();
  if (SCREEN === "train") return <>
    <Train u={u} nav={noop} tabGo={noop} initialView={1} groupType="school" onPremium={noop} setUser={noop} />
    <Tabs cur="train" go={noop} />
  </>;
  if (SCREEN === "drill") return <div className="pg-wrap">
    <Drill u={u} nav={noop} done={noop} gate={function (x) { return x; }} back={noop} />
    <Tabs cur="home" go={noop} />
  </div>;
  return <>
    <Home u={u} nav={noop} tabGo={noop} festId={FEST || null} onFestivalsOff={noop} events={[]} medianXp={0}
      pendingChests={N} onOpenChest={noop} onMount={noop} onLeave={noop} />
    <Tabs cur="home" go={noop} />
    {CHEST !== "emoji" && N > 0 && <ChestSwap />}
  </>;
}

function Frame() {
  // Même composition de classes que App.jsx (ligne lc) + la variante d'ambiance.
  var lc = "app" + (MODE === "light" ? " light" : "") + (FEST ? " fest-" + FEST : (SKIN ? " skin-" + SKIN : "")) + (V !== "A" ? " amb amb-" + V : "");
  return <div className={lc}>
    <style>{CSS}</style>
    <style>{AMB}</style>
    {RM && <style>{RM_CSS}</style>}
    {V === "E" && <div className="amb-fresco" />}
    {V === "D" && <div className="amb-embers">{Array.from({ length: 12 }, function (_, i) { return <i key={i} />; })}</div>}
    <Screen />
  </div>;
}

createRoot(document.getElementById("root")).render(<StrictMode><Frame /></StrictMode>);
