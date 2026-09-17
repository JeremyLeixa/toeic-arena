// Proto « mémoire du Mentor » — le Mentor devient le lieu de la mémoire (choix de Jérémy, 2026-09-17) :
// Home ne change que d'une ligne, et la carte porte cinq repères au lieu de quatre.
//   Peak = objectif · Path = le plan du jour (la Daily Mission en est la 1re quête) ·
//   Lair = le bestiaire (remplace « The Crossroads » : le Focus est devenu la quête « enjeu » du plan) ·
//   Camp = où j'en suis · Aldric = la Chronique (la rediffusion passe au pied de la Chronique).
// Copie de MentorMap (src/features/mentor/Mentor.jsx) : mêmes images, mêmes coordonnées, badges nouveaux.
import { useEffect, useState } from "react";
import { GAME_ICON_PATHS } from "../../src/data/avatarIcons.js";

export function MentorMapV2(p) {
  var badges = p.badges;
  var [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" && window.matchMedia && window.matchMedia("(min-width:768px)").matches);
  useEffect(function () {
    if (typeof window === "undefined" || !window.matchMedia) return;
    var mq = window.matchMedia("(min-width:768px)");
    function onChange(e) { setIsDesktop(e.matches); }
    if (mq.addEventListener) mq.addEventListener("change", onChange); else mq.addListener(onChange);
    return function () { if (mq.removeEventListener) mq.removeEventListener("change", onChange); else mq.removeListener(onChange); };
  }, []);
  var coords = isDesktop
    ? { goal: { x: 30, y: 30, side: "left" }, path: { x: 43, y: 55, side: "right" }, lair: { x: 84, y: 60, side: "right" }, camp: { x: 67, y: 75, side: "right" }, aldric: { x: 48, y: 85, w: 48, h: 120, side: "left" } }
    : { goal: { x: 48, y: 22, side: "left" }, path: { x: 50, y: 50, side: "right" }, lair: { x: 14, y: 60, side: "left" }, camp: { x: 83, y: 68, side: "right" }, aldric: { x: 52, y: 88, w: 64, h: 120, side: "left" } };
  var list = ["goal", "path", "lair", "camp"].map(function (id) { return Object.assign({ id: id }, coords[id], badges[id]); });
  var imgSrc = isDesktop ? "/images/mentor/map_desktop.jpg" : "/images/mentor/map.jpg";
  var aspectRatio = isDesktop ? "1338/860" : "2/3";
  var a = coords.aldric;
  var aldricBadgePos = a.side === "left" ? { left: "calc(100% + 8px)" } : { right: "calc(100% + 8px)" };
  return (
    <div className="mentor-map-wrap" style={{ position: "relative", width: "100%", aspectRatio: aspectRatio, marginBottom: 14 }}>
      <img src={imgSrc} alt="The Mentor's Map" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "contrast(1.05)" }} onError={function (e) { e.target.style.display = "none"; }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, var(--bg) 0%, transparent 8%, transparent 92%, var(--bg) 100%), linear-gradient(to bottom, var(--bg) 0%, transparent 8%, transparent 92%, var(--bg) 100%)", pointerEvents: "none" }} />
      <button onClick={p.onAldricTap} aria-label="Open your chronicle"
        style={{ position: "absolute", left: a.x + "%", top: a.y + "%", transform: "translate(-50%,-50%)", width: a.w, height: a.h, background: "transparent", border: "none", cursor: "pointer", padding: 0, borderRadius: 8 }}>
        <span style={Object.assign({ position: "absolute", top: "50%", transform: "translateY(-50%)",
          background: "linear-gradient(135deg,rgba(245,235,205,.92),rgba(228,212,170,.88))", color: /*fond local*/"#3d2814",
          border: "1px solid rgba(90,58,20,.35)", borderRadius: 6, padding: "4px 8px", whiteSpace: "nowrap",
          fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: .5, fontWeight: 700, textTransform: "uppercase",
          boxShadow: "0 2px 8px rgba(0,0,0,.4)" }, aldricBadgePos)}>{"Your chronicle"}</span>
      </button>
      {list.map(function (h) {
        var sigilColor = h.tone === "active" ? /*fond local*/"#f0c850" : h.tone === "done" ? /*fond local*/"#4abe60" : /*fond local*/"#8a7e6a";
        var sigilBg = h.tone === "active" ? "rgba(240,200,80,.18)" : h.tone === "done" ? "rgba(74,190,96,.18)" : "rgba(138,126,106,.15)";
        var badgeStyle = { position: "absolute", top: "50%", transform: "translateY(-50%)",
          background: "linear-gradient(135deg,rgba(245,235,205,.95),rgba(228,212,170,.92))", color: /*fond local*/"#3d2814",
          border: "1px solid rgba(90,58,20,.4)", borderRadius: 6, padding: "4px 8px", minWidth: 80, maxWidth: 150,
          whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, lineHeight: 1.3,
          boxShadow: "0 2px 8px rgba(0,0,0,.4)", textAlign: "left" };
        if (h.side === "left") badgeStyle.left = "calc(100% + 10px)"; else badgeStyle.right = "calc(100% + 10px)";
        return (
          <button key={h.id} onClick={function () { p.onHotspotTap && p.onHotspotTap(h.id); }}
            style={{ position: "absolute", left: h.x + "%", top: h.y + "%", transform: "translate(-50%,-50%)", width: 36, height: 36,
              borderRadius: "50%", border: "2px solid " + sigilColor, background: sigilBg, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", padding: 0, boxShadow: "0 0 14px " + sigilColor + "66",
              animation: h.tone === "active" ? "pulse 2.4s infinite" : "none" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: sigilColor, boxShadow: "0 0 4px " + sigilColor }} />
            <span style={badgeStyle}>
              <span style={{ display: "block", fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: .5, color: /*fond local*/"#5a3a1a", fontWeight: 700, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis" }}>{h.label}</span>
              <span style={{ display: "block", fontWeight: 700, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{h.value}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Barre d'onglets avec une pastille : ce qui appelle l'élève vers le Mentor maintenant que le plan y vit.
// Copie de components/Tabs.jsx + prop `badge` (id d'onglet). À trancher au câblage.
export function TabsBadge(p) {
  var tabs = [{ id: "home", l: "Home", i: "castle" }, { id: "mentor", l: "Mentor", i: "wizard-staff" }, { id: "train", l: "Train", i: "bullseye" },
    { id: "games", l: "Games", i: "coliseum" }, { id: "league", l: "League", i: "laurel-crown" }, { id: "profile", l: "Profile", i: "visored-helm" }];
  return (
    <div className="tab-bar" style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "linear-gradient(180deg,rgba(var(--bg3-rgb),0) 0%,rgba(var(--bg3-rgb),.8) 15%,var(--bg3) 100%)", borderTop: "1px solid rgba(var(--cx),.15)", padding: "8px 4px calc(12px + env(safe-area-inset-bottom, 0px))", zIndex: 100, display: "flex", justifyContent: "space-between" }}>
      {tabs.map(function (t) {
        var a = p.cur === t.id, bdg = p.badge === t.id;
        return (
          <button key={t.id} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "6px 4px", borderRadius: 12, color: a ? "var(--cyan)" : "var(--t1)", transform: a ? "scale(1.06)" : "scale(1)", opacity: a ? 1 : .55, transition: "all .2s", flex: 1, minWidth: 0 }}>
            <svg viewBox="0 0 512 512" width="24" height="24" style={{ display: "block", filter: a ? "drop-shadow(0 0 6px rgba(var(--cx),.55))" : "none", flexShrink: 0 }}><g fill="currentColor" dangerouslySetInnerHTML={{ __html: GAME_ICON_PATHS[t.i] || "" }} /></svg>
            <span style={{ fontSize: 10, fontWeight: a ? 700 : 500, letterSpacing: .3, whiteSpace: "nowrap" }} className="out">{t.l}</span>
            {a && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--cyan)", marginTop: 2 }} />}
            {bdg && !a && <span className="mm-tabdot" />}
          </button>
        );
      })}
    </div>
  );
}
