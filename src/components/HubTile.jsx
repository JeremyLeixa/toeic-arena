// Tuiles vivantes des hubs (2026-09-17, proto prototypes/living-hubs/, variante C « Coffre »,
// choix de Jérémy). Une tuile montre, en plus du nom : le dernier score (ou le record d'un jeu),
// une barre vers le coffre de maîtrise, le coffre Champion à droite (terne avec son %, qui brille
// une fois gagné) et une étiquette « ½ XP / Low XP / No XP » seulement quand la prochaine partie
// rapporte moins. L'état vient de lib/hubStatus.js (pur, testé) ; les styles de .hub-* dans
// styles/appCss.js, en jetons (suivent le skin, la fête et le mode clair).
// Depuis le 2026-09-19, le coffre ne se gagne plus une seule fois : échelons de maîtrise (variante B).
import { GIcon, ResultIcon } from "./icons.jsx";
import { TreasureChestSvg } from "./avatar.jsx";
import { GAME_ICON_PATHS } from "../data/avatarIcons.js";
import { agoLabel, roman, TIERS, RENOWN_STEP } from "../lib/hubStatus.js";

var CHIP = { half: "½ XP", low: "Low XP", none: "No XP" };

function pct(x) { return Math.round(x * 100) + "%"; }

function subLine(s, d) {
  if (s.plain) return d;
  if (s.game) return s.record ? "Record " + s.record : d;
  if (s.last) return "Last " + s.last.correct + "/" + s.last.total + " · " + agoLabel(s.last.date);
  return d;
}

// ── Échelons de maîtrise, variante B « coffre suivant » (2026-09-19, proto prototypes/mastery-tiers/) ──
// La tuile d'avant, mais le coffre de droite est toujours le PROCHAIN, avec son chiffre romain (III en
// Légendaire, obsidienne et or) ; « Mastery I » en or devant la ligne de stats une fois un échelon gagné.
// État : s.tier (lib/hubStatus.js tierStatus / hubTierStatus).
function AccPart(p) {
  var t = p.t;
  if (t.accLow) return <><span className="hub-warn">{pct(t.acc)}</span>{" (" + pct(t.next.acc) + " needed)"}</>;
  return <>{pct(t.acc)}</>;
}
// Volume vers l'échelon suivant : « 112/150 Q » ou, pour un hub, « 1/4 trials at II ».
function volText(t, unit) {
  if (t.hub) return t.at + "/" + t.n + " " + unit + (t.won ? " at " + roman(t.next.n) : " mastered");
  return (t.volOk ? t.total : t.total + "/" + t.next.q) + " Q";
}
// Au-delà de I, la précision affichée est celle des ~50 dernières questions (« recent »).
function statsLine(t, unit) {
  if (t.state === "new") return "Not started";
  if (t.state === "wait") return roman(t.next.n) + " opens in " + t.wait + " d";
  if (t.hub) return volText(t, unit);
  return <>{volText(t, unit) + " · "}<AccPart t={t} />{t.won && !t.accLow ? " recent" : ""}</>;
}
function Mastery(p) {
  var t = p.t;
  return <div className="hub-meta">{t.won ? <><span className="mt-gold">{"Mastery " + roman(t.won)}</span>{" · "}</> : null}{statsLine(t, p.unit)}</div>;
}
function NextChest(p) {
  var t = p.t, blocked = t.accLow && (t.volOk || t.hub);
  var label = t.state === "wait" ? "in " + t.wait + " d" : blocked && !t.hub ? pct(t.acc) + " acc" : pct(t.vol);
  var cls = "hub-chest" + (t.state === "new" ? " idle" : "") + (t.next.chest === 3 ? " legend" : "") + (t.state === "wait" ? " wait" : "");
  return <div className={cls}>
    <span className="mt-cw">
      <TreasureChestSvg size={34} tier={t.next.chest} idSuffix={"hub" + p.id} />
      <b className="mt-num">{roman(t.next.n)}</b>
    </span>
    <small className={blocked && !t.hub ? "hub-warn" : ""}>{label}</small>
  </div>;
}

// p.item {id, n, d, i} · p.status (hubItemStatus) · p.size "md" (Train, Listening, Reading) | "lg" (Games)
// p.locked : réservé Arena Premium (visiteur) · p.disabled : tuile verrouillée (Daily fait, etc.)
// p.unit : « trials » / « parts » pour un hub à épreuves · p.children : lignes en plus (record de la classe…)
export function HubTile(p) {
  var it = p.item, s = p.status || { plain: true }, lg = p.size === "lg";
  var vl = !!p.locked, off = !!p.disabled;
  var t = s.tier;
  var showChest = !vl && !off && !s.plain && !s.game && !!t;
  var chip = !vl && !off && !s.plain && CHIP[s.xp];
  var box = lg ? 48 : 42;
  var style = Object.assign({ display: "flex", alignItems: "center", gap: 14, padding: lg ? "16px" : "14px 16px",
    cursor: vl || off ? "default" : "pointer", opacity: off ? .4 : vl ? .55 : 1 }, p.style || {});
  return (
    <div className="crd hub-tile" onClick={p.onClick} style={style}>
      <div style={{ width: box, height: box, borderRadius: lg ? 14 : 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: lg ? 24 : 20,
        background: vl ? "transparent" : "linear-gradient(135deg,rgba(var(--cx),.22),transparent)", border: vl ? "1.5px solid var(--bdr)" : "1.5px solid var(--cyan)" }}>
        {GAME_ICON_PATHS[it.i] ? <GIcon name={it.i} size={lg ? 28 : 22} color={vl ? "var(--t3)" : "var(--cyan)"} /> : it.i}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="hub-namerow">
          <div className="out" style={{ fontWeight: 700, fontSize: lg ? 15 : 14 }}>{it.n}</div>
          {chip && <span className={"hub-chip " + s.xp}>{chip}</span>}
        </div>
        <div className="hub-sub" style={{ color: vl ? "var(--gold)" : undefined }}>{vl ? "Arena Premium" : off ? it.d : subLine(s, it.d)}</div>
        {showChest && <div className={"hub-bar" + (t.accLow ? " low" : "") + (t.state === "wait" ? " won" : "")}><i style={{ width: (t.vol * 100) + "%" }} /></div>}
        {showChest && <Mastery t={t} unit={p.unit || "trials"} />}
        {!vl && p.children}
      </div>
      {vl ? <ResultIcon e={"🔒"} size={14} color="var(--gold)" />
        : off ? <ResultIcon e={"🔒"} size={15} color="var(--t3)" />
        : showChest ? <NextChest t={t} id={it.id} />
        : <span style={{ fontSize: 16, color: "var(--cyan)" }}>{"→"}</span>}
    </div>
  );
}

// Étagère en tête de hub (hubSummary) : un coffre par tuile, au palier de son dernier échelon gagné, avec
// son chiffre ; le total des coffres gagnés (sans « of N » : la série ne finit pas) et le prochain coffre.
export function HubShelf(p) {
  var sm = p.summary;
  if (!sm || sm.chests.length < 3) return null;
  return (
    <div className="crd hub-shelf">
      <div className="hub-shelf-row">{sm.chests.map(function (w, i) {
        return <span key={i} className={"mt-shelf-c" + (w ? " won" : "")}>
          <TreasureChestSvg size={26} tier={w >= 3 ? 3 : 2} idSuffix={"shelf" + (p.id || "") + i} />
          {w > 0 && <b className="mt-num sm">{roman(w)}</b>}
        </span>;
      })}</div>
      <div className="hub-shelf-txt"><b className="out">{sm.won}</b>{sm.won === 1 ? " mastery chest won" : " mastery chests won"}<em>{sm.fresh + " at full XP today"}</em></div>
      {sm.near ? <div className="hub-hint">{"Next: "}<span className="mt-gold">{sm.near.n + " " + roman(sm.near.tier)}</span>{" · " + sm.near.left + " Q to go"}</div>
        : sm.wait ? <div className="hub-hint">{"Next: "}<span className="mt-gold">{sm.wait.n + " " + roman(sm.wait.tier)}</span>{" opens in " + sm.wait.wait + " d"}</div>
        : null}
      {sm.won === 0 && <div className="hub-hint">{"Mastery chests at " + TIERS.map(function (d) { return d.q; }).join(", ") + " questions, then one every " + RENOWN_STEP + "."}</div>}
    </div>
  );
}
