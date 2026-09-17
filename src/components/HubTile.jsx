// Tuiles vivantes des hubs (2026-09-17, proto prototypes/living-hubs/, variante C « Coffre »,
// choix de Jérémy). Une tuile montre, en plus du nom : le dernier score (ou le record d'un jeu),
// une barre vers le coffre de maîtrise, le coffre Champion à droite (terne avec son %, qui brille
// une fois gagné) et une étiquette « ½ XP / Low XP / No XP » seulement quand la prochaine partie
// rapporte moins. L'état vient de lib/hubStatus.js (pur, testé) ; les styles de .hub-* dans
// styles/appCss.js, en jetons (suivent le skin, la fête et le mode clair).
import { GIcon, ResultIcon } from "./icons.jsx";
import { TreasureChestSvg } from "./avatar.jsx";
import { GAME_ICON_PATHS } from "../data/avatarIcons.js";
import { MASTERY_Q, agoLabel } from "../lib/hubStatus.js";

var CHIP = { half: "½ XP", low: "Low XP", none: "No XP" };

function pct(x) { return Math.round(x * 100) + "%"; }

function subLine(s, d) {
  if (s.plain) return d;
  if (s.game) return s.record ? "Record " + s.record : d;
  if (s.last) return "Last " + s.last.correct + "/" + s.last.total + " · " + agoLabel(s.last.date);
  return d;
}
function Mastery(p) {
  var s = p.s;
  if (s.hub) return <div className={"hub-meta" + (s.allMastered ? " gold" : "")}>{s.allMastered ? "All " + p.unit + " mastered" : s.mastered + "/" + s.n + " " + p.unit + " mastered"}</div>;
  if (s.mastered) return <div className="hub-meta gold">Mastered</div>;
  if (!s.total) return <div className="hub-meta">Not started</div>;
  return <div className="hub-meta">{s.total + "/" + MASTERY_Q + " Q · "}<span className={s.accLow ? "hub-warn" : ""}>{pct(s.acc)}</span>{s.accLow ? " (80% needed)" : ""}</div>;
}

// p.item {id, n, d, i} · p.status (hubItemStatus) · p.size "md" (Train, Listening, Reading) | "lg" (Games)
// p.locked : réservé Arena Premium (visiteur) · p.disabled : tuile verrouillée (Daily fait, etc.)
// p.unit : « trials » / « parts » pour un hub à épreuves · p.children : lignes en plus (record de la classe…)
export function HubTile(p) {
  var it = p.item, s = p.status || { plain: true }, lg = p.size === "lg";
  var vl = !!p.locked, off = !!p.disabled;
  var won = s.hub ? s.allMastered : s.mastered;
  var showChest = !vl && !off && !s.plain && !s.game;
  var chip = !vl && !off && !s.plain && CHIP[s.xp];
  var box = lg ? 48 : 42;
  var style = Object.assign({ display: "flex", alignItems: "center", gap: 14, padding: lg ? "16px" : "14px 16px",
    cursor: vl || off ? "default" : "pointer", opacity: off ? .4 : vl ? .55 : 1 }, p.style || {});
  return (
    <div className="crd hub-tile" onClick={p.onClick} style={style}>
      <div style={{ width: box, height: box, borderRadius: lg ? 14 : 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: lg ? 24 : 20,
        background: vl ? "transparent" : "linear-gradient(135deg,rgba(var(--cx),.22),transparent)", border: vl ? "1.5px solid var(--bdr)" : "1.5px solid var(--cyan)" }}>
        {GAME_ICON_PATHS[it.i] ? <GIcon name={it.i} size={lg ? 26 : 22} color={vl ? "var(--t3)" : "var(--cyan)"} /> : it.i}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="hub-namerow">
          <div className="out" style={{ fontWeight: 700, fontSize: lg ? 15 : 14 }}>{it.n}</div>
          {chip && <span className={"hub-chip " + s.xp}>{chip}</span>}
        </div>
        <div className="hub-sub" style={{ color: vl ? "var(--gold)" : undefined }}>{vl ? "Arena Premium" : off ? it.d : subLine(s, it.d)}</div>
        {showChest && <div className={"hub-bar" + (won ? " won" : s.accLow ? " low" : "")}><i style={{ width: (s.vol * 100) + "%" }} /></div>}
        {showChest && <Mastery s={s} unit={p.unit || "trials"} />}
        {!vl && p.children}
      </div>
      {vl ? <ResultIcon e={"🔒"} size={14} color="var(--gold)" />
        : off ? <ResultIcon e={"🔒"} size={15} color="var(--t3)" />
        : showChest ? <div className={"hub-chest" + (won ? " won" : s.total || s.started ? "" : " idle")}>
            <TreasureChestSvg size={won ? 38 : 34} tier={2} idSuffix={"hub" + it.id} />
            <small className={!won && s.accLow && s.vol >= 1 ? "hub-warn" : ""}>{won ? "Won" : s.accLow && s.vol >= 1 ? pct(s.acc) + " acc" : Math.round(s.vol * 100) + "%"}</small>
          </div>
        : <span style={{ fontSize: 16, color: "var(--cyan)" }}>{"→"}</span>}
    </div>
  );
}

// Étagère de coffres en tête de hub (hubSummary) : un coffre par tuile qui en a un.
export function HubShelf(p) {
  var sm = p.summary;
  if (!sm || sm.chests.length < 3) return null;
  return (
    <div className="crd hub-shelf">
      <div className="hub-shelf-row">{sm.chests.map(function (w, i) {
        return <span key={i} className={w ? "won" : ""}><TreasureChestSvg size={26} tier={2} idSuffix={"shelf" + (p.id || "") + i} /></span>;
      })}</div>
      <div className="hub-shelf-txt"><b className="out">{sm.won + " of " + sm.chests.length}</b>{" mastery chests won"}<em>{sm.fresh + " at full XP today"}</em></div>
      {sm.won === 0 && <div className="hub-hint">{"50 questions at 80% or more win a module's Champion chest."}</div>}
    </div>
  );
}
