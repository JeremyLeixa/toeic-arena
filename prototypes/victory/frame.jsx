// Proto « moments de victoire » — un écran de fin, piloté par l'URL.
//   v=1|2|3  sc=<scénario>  mode=dark|light  skin=<id>  lvl=inline|overlay  lg=ascension|banner|card
//   rm=1 (mouvement réduit)  sound=1 (bouton de départ : Web Audio exige un geste)  solo=1 (bouton Replay)
import { StrictMode, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { createChestFx } from "../../src/components/particles.js";
import { setSoundEnabled, playLootTick, playXP, playLevelUp, playJingleLeague, playChestLand, playChestKnock, playLootCollect } from "../../src/sounds.js";
import VX from "./victory.css?raw";
import { SCENARIOS, explainXp, NOW } from "./scenarios.js";
import { ResultLedger, ResultArena, ResultVerdict } from "./variants.jsx";

var q = new URLSearchParams(location.search);
var V = q.get("v") || "1";
var SC = q.get("sc") || "promotion";
var MODE = q.get("mode") || "dark";
var SKIN = q.get("skin") || "";
var LVL = q.get("lvl") || "inline";
var LG = q.get("lg") || "ascension";
var SOUND = q.get("sound") === "1";
var SOLO = q.get("solo") === "1";
var RM = q.get("rm") === "1" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var RM_CSS = "*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}";
var noop = function () {};

var SND = SOUND
  ? { tick: playLootTick, xp: playXP, levelUp: playLevelUp, league: playJingleLeague, collect: playLootCollect,
      thud: function () { playChestLand(1); }, knock: function () { playChestKnock(2); } }
  : { tick: noop, xp: noop, levelUp: noop, league: noop, collect: noop, thud: noop, knock: noop };

var VARIANT = { "1": ResultLedger, "2": ResultArena, "3": ResultVerdict };

function Frame() {
  var canvasRef = useRef(null);
  var [fx, setFx] = useState(null);
  var [started, setStarted] = useState(!SOUND);
  var [run, setRun] = useState(0);
  useEffect(function () {
    var f = createChestFx(canvasRef.current);
    setFx(f);
    return function () { f.destroy(); };
  }, []);
  var s = useMemo(function () {
    var base = SCENARIOS.find(function (x) { return x.id === SC; }) || SCENARIOS[0];
    return Object.assign({}, base, { now: NOW });
  }, []);
  var r = useMemo(function () { return explainXp(s); }, [s]);
  var Result = VARIANT[V] || ResultLedger;
  var lc = "app" + (MODE === "light" ? " light" : "") + (SKIN ? " skin-" + SKIN : "");
  return (
    <div className={lc}>
      <style>{CSS}</style>
      <style>{VX}</style>
      {RM && <style>{RM_CSS}</style>}
      {started && fx && <Result key={run} s={s} r={r} fx={fx} snd={SND} reduced={RM} levelMode={LVL} leagueMode={LG} />}
      <canvas ref={canvasRef} className="vx-fx" />
      {!started && <div className="vx-gate">
        <button className="btn1 out" onClick={function () { setSoundEnabled(true); setStarted(true); }}>{"▶ Play with sound"}</button>
        <span>Web Audio needs a first tap</span>
      </div>}
      {SOLO && started && <button className="vx-replay" onClick={function () { if (fx) fx.clear(); window.scrollTo(0, 0); setRun(function (n) { return n + 1; }); }}>{"↻ Replay"}</button>}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<StrictMode><Frame /></StrictMode>);
