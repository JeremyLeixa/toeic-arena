// Proto « moments de victoire » — cérémonies plein écran (fond sombre fixe, comme le coffre v3 :
// hex bruts, jamais de jeton de thème, lisibles quel que soit le mode).
import { useEffect, useRef } from "react";
import { GIcon } from "../../src/components/icons.jsx";
import { TreasureChestSvg } from "../../src/components/avatar.jsx";
import { getLevel } from "../../src/data/helpers.js";
import { burstAt } from "./parts.jsx";

function stop(e) { e.stopPropagation(); }

// ── Montée de niveau ── ~2,5 s, fermeture au tap.
export function LevelUpOverlay(p) {
  var medal = useRef(null);
  useEffect(function () {
    p.snd.levelUp();
    var t = setTimeout(function () {
      burstAt(p.fx, medal.current, ["#ffd65a", "#fff2b0", "#e8a33a"], true);
      if (p.fx) p.fx.rain({ count: 36, color: ["#ffd65a", "#ffe9a8"] });
    }, 620);
    return function () { clearTimeout(t); };
  }, []);
  var nx = getLevel(p.toXp);
  return (
    <div className="vx-ov vx-ov-level" onClick={function (e) { stop(e); p.onClose(); }}>
      <div className="vx-rays" />
      <div className="vx-lu-medal" ref={medal}>
        <span className="vx-lu-old out">{p.level - 1}</span>
        <span className="vx-lu-new out">{p.level}</span>
      </div>
      <div className="vx-lu-kicker out">Level up</div>
      <div className="vx-lu-title out">Level {p.level}</div>
      <div className="vx-lu-next">{nx.next - nx.cur} XP to level {p.level + 1}</div>
      <div className="vx-tap">Tap to continue</div>
    </div>
  );
}

// ── Promotion de ligue ── deux mises en scène.
//   ascension : l'écusson de l'ancienne ligue se fend et tombe, colonne de lumière, le nouveau
//               descend et frappe (onde + éclat à sa couleur).
//   banner    : une bannière héraldique à la couleur de la ligue se déroule, l'écusson s'y imprime,
//               pluie de paillettes.
export function LeaguePromotion(p) {
  var crest = useRef(null);
  var to = p.to, from = p.from, mode = p.mode;
  useEffect(function () {
    p.snd.league();
    var t1 = setTimeout(function () {
      burstAt(p.fx, crest.current, [to.color, "#ffffff", "#ffe9a8"], true);
      p.snd.thud();
    }, mode === "banner" ? 1170 : 1460);
    var t2 = setTimeout(function () { if (p.fx) p.fx.rain({ count: 50, color: [to.color, "#ffe9a8"] }); }, mode === "banner" ? 1250 : 1560);
    return function () { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  var nextTxt = p.next ? "Next: " + p.next.name + " at " + p.next.min.toLocaleString("en-US") + " weekly XP" : "Top league reached";
  return (
    <div className={"vx-ov vx-ov-league is-" + mode} style={{ "--lg": to.color, "--lg-from": from.color }} onClick={stop}>
      {mode === "ascension" && <>
        <div className="vx-lg-column" />
        <div className="vx-lg-stage">
          <div className="vx-lg-old">
            <span className="vx-lg-half l"><GIcon name={from.gi} size={72} color={from.color} /></span>
            <span className="vx-lg-half r"><GIcon name={from.gi} size={72} color={from.color} /></span>
          </div>
          <div className="vx-lg-new" ref={crest}>
            <span className="vx-lg-wave" />
            <span className="vx-lg-disc"><GIcon name={to.gi} size={84} color={to.color} /></span>
          </div>
        </div>
      </>}
      {mode === "banner" && <div className="vx-bn-wrap">
        <div className="vx-bn">
          <svg viewBox="0 0 180 240" width="180" height="240" aria-hidden="true">
            <defs>
              <linearGradient id="vxbn" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={to.color} stopOpacity="0.95" />
                <stop offset="100%" stopColor="#1a0f06" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            <rect x="4" y="0" width="172" height="12" rx="4" fill="#8a6a3a" />
            <path d="M14 10 H166 V196 L90 234 L14 196 Z" fill="url(#vxbn)" stroke="#e8c890" strokeWidth="3" />
            <path d="M26 22 H154 V188 L90 220 L26 188 Z" fill="none" stroke="#e8c890" strokeOpacity="0.45" strokeWidth="1.2" />
          </svg>
          <span className="vx-bn-crest" ref={crest}><GIcon name={to.gi} size={78} color="#fff4d6" /></span>
        </div>
      </div>}
      <div className="vx-lg-text">
        <div className="vx-lg-kicker out">Promoted</div>
        <div className="vx-lg-name out">{to.name} League</div>
        <div className="vx-lg-sub">{from.name + " → " + to.name + " · " + p.weekly.toLocaleString("en-US") + " XP this week"}</div>
        <div className="vx-lg-next">{nextTxt}</div>
      </div>
      {p.chest && <div className="vx-lg-chest">
        <TreasureChestSvg size={54} tier={p.chest.tier} idSuffix="vxlg" />
        <div><b className="out">Warrior chest earned</b><small>League promotion</small></div>
      </div>}
      <button className="vx-lg-cta out" onClick={function (e) { stop(e); p.onClose(); }}>Onward</button>
    </div>
  );
}
