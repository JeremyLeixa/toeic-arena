// ═══════════════════════════════════════════════════════════════
// Cartes de l'ouverture de coffre v3 (2026-09-16) : dos + face d'un groupe de récompenses
// (lib/chestReveal.js groupRewards), et tuile du récap. Rareté affichée = celle de l'objet ;
// monnaies et tokens n'ont pas de badge. Aucun emoji quand une game-icon existe.
// Fond sombre fixe : hex en dur voulus (voir chestTheme.js).
// ═══════════════════════════════════════════════════════════════
import { AvatarMedal } from "../../components/avatar.jsx";
import { GIcon } from "../../components/icons.jsx";
import { SKINS, TITLES, CHEAT_SHEETS, TOKEN_TYPES, AVATARS, FRAMES } from "../../data/chests.js";
import { GAME_ICON_PATHS } from "../../data/avatarIcons.js";
import { TOKEN_GI } from "../../lib/iconMaps.js";
import { rarityInfo, groupBorder, groupGlow, fmtNum } from "./chestTheme.js";

var COSM_CAPTION = { avatar: "New avatar", skin: "New skin", frame: "New avatar frame", title: "New title", cheat_sheet: "Cheat Sheet · Profile → Collection" };

function Coin(p) {
  return <div className="chx-coin" style={{ width: p.size, height: p.size }}><GIcon name="daric" size={Math.round(p.size * 0.58)} color="#3a2a08" /></div>;
}
function Gem(p) {
  return <div className="chx-gem"><GIcon name="cut-diamond" size={p.size} color={/*fond local*/"#8fdcff"} /></div>;
}
function TokenIcon(p) {
  var gi = TOKEN_GI[p.id];
  if (gi && GAME_ICON_PATHS[gi]) return <GIcon name={gi} size={p.size} color={/*fond local*/"#f3dca0"} />;
  return <span>{(TOKEN_TYPES[p.id] && TOKEN_TYPES[p.id].icon) || "?"}</span>;
}
function Swatch(p) {
  return (<div className="chx-swatch" style={{ width: p.size, height: p.size, background: "linear-gradient(135deg," + p.skin.hex + "," + p.skin.dark + ")", boxShadow: "0 0 " + Math.round(p.size / 4) + "px " + p.skin.hex + "88" }}><i /><i /><i /></div>);
}

function itemName(it) {
  if (it.type === "avatar") return AVATARS[it.id] ? AVATARS[it.id].name : "Avatar";
  if (it.type === "skin") return SKINS[it.id] ? SKINS[it.id].name : "Skin";
  if (it.type === "frame") return FRAMES[it.id] ? FRAMES[it.id].name : "Frame";
  if (it.type === "title") return TITLES[it.id] ? TITLES[it.id].name : "Title";
  if (it.type === "cheat_sheet") return CHEAT_SHEETS[it.id] ? CHEAT_SHEETS[it.id].name : "Cheat Sheet";
  if (it.type === "token") return TOKEN_TYPES[it.id] ? TOKEN_TYPES[it.id].name : "Token";
  return "Reward";
}

function ItemVisual(p) {
  var it = p.item, big = p.big, r = rarityInfo(p.tier);
  if (it.type === "avatar") return <AvatarMedal avatarId={it.id} size={big ? 104 : 42} />;
  if (it.type === "frame") return <AvatarMedal avatarId="champion" size={big ? 96 : 40} frameId={it.id} />;
  if (it.type === "skin" && SKINS[it.id]) return <Swatch skin={SKINS[it.id]} size={big ? 96 : 38} />;
  if (it.type === "title" && TITLES[it.id]) {
    // Plaque sombre fixe (#1a1208 posé sur la même ligne : exemption de check_tones pour TITLES.color)
    return <div className="chx-plate" style={{ background: "linear-gradient(180deg,#1a1208,#0a0604)", color: TITLES[it.id].color || (r && r.color) || /*fond local*/"#d9b868", borderColor: TITLES[it.id].color || "#8a6a3a", fontSize: big ? 17 : 9, padding: big ? "14px 12px" : "6px 5px" }}>{TITLES[it.id].name}</div>;
  }
  if (it.type === "cheat_sheet") return <GIcon name="scroll-unfurled" size={big ? 92 : 40} color={/*fond local*/"#ecd6a2"} />;
  return <GIcon name="crown" size={big ? 80 : 36} color={/*fond local*/"#d9b868"} />;
}

// Somme par monnaie : l'XP de repli (collection complète, tokens au plafond) s'ajoute à l'XP
function currencyTotals(items) {
  var t = { darics: 0, xp: 0, fallback: false };
  items.forEach(function (it) {
    if (it.type === "daric") t.darics += it.amount || 0;
    else if (it.type === "xp") { t.xp += it.xp || 0; if (it.fallback) t.fallback = true; }
  });
  return t;
}

function CardFront(p) {
  var g = p.group, r = rarityInfo(g.rarity), body;
  if (g.kind === "currencies") {
    var t = currencyTotals(g.items);
    body = (<>
      <div className="chx-cur">
        {t.darics > 0 && <div className="chx-cur-row"><Coin size={46} /><div className="chx-cur-num"><span className="chx-cnt" data-to={t.darics}>+0</span><small>Darics</small></div></div>}
        {t.xp > 0 && <div className="chx-cur-row"><Gem size={46} /><div className="chx-cur-num"><span className="chx-cnt" data-to={t.xp}>+0</span><small>XP</small></div></div>}
      </div>
      <div className="chx-cap">{t.fallback ? "Collection complete: bonus XP instead" : "Arena currency & bonus XP"}</div>
    </>);
  } else if (g.kind === "tokens") {
    var n = g.items.length, counts = {}, order = [];
    g.items.forEach(function (it) { if (!counts[it.id]) { counts[it.id] = 0; order.push(it.id); } counts[it.id]++; });
    body = (<>
      <div className="chx-tok-fan">
        {g.items.map(function (it, i) {
          var off = i - (n - 1) / 2;
          return <div key={i} className="chx-tok" style={{ transform: "translateX(" + off * 40 + "px) rotate(" + off * 12 + "deg) translateY(" + Math.abs(off) * 6 + "px)" }}><TokenIcon id={it.id} size={30} /></div>;
        })}
      </div>
      <div className="chx-name">{n + " Token" + (n > 1 ? "s" : "")}</div>
      <div className="chx-cap">{order.map(function (id) { return (counts[id] > 1 ? counts[id] + "× " : "") + itemName({ type: "token", id: id }); }).join(" · ")}</div>
    </>);
  } else {
    var it = g.items[0];
    body = (<>
      <div className="chx-visual"><ItemVisual item={it} tier={g.rarity} big /></div>
      <div className={"chx-name" + (it.type === "cheat_sheet" ? " small" : "")}>{itemName(it)}</div>
      <div className="chx-cap">{it.duplicate ? "Duplicate · convert 3 in Profile" : COSM_CAPTION[it.type] || ""}</div>
    </>);
  }
  return (
    <div className={"chx-face chx-front" + (g.rarity === 4 ? " chx-foil4" : "")}>
      {r ? <div className="chx-badge" style={{ color: r.color, borderColor: r.color }}>{r.label}</div> : <div className="chx-badge none" />}
      <div className="chx-body">{body}</div>
      {g.rarity >= 3 && <div className="chx-holo" />}
    </div>
  );
}

export function ChestCard(p) {
  var g = p.group;
  return (
    <div ref={p.setRef} className={"chx-card" + (g.rarity >= 3 ? " pulse" : "")} style={{ "--chx-rc": groupBorder(g), "--chx-glow": groupGlow(g) }}
      role="button" tabIndex={0} aria-label={"Reveal reward " + (p.index + 1)}
      onClick={p.onActivate}
      onKeyDown={function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); p.onActivate(); } }}
      onPointerMove={p.onPointerMove} onPointerLeave={p.onPointerLeave}>
      <div className="chx-tilt">
        <div className="chx-inner">
          <div className={"chx-face chx-back" + (g.rarity === 4 ? " legend" : "")}><div className="chx-back-in"><GIcon name="swords-emblem" size={70} color={/*fond local*/"#c9a45a"} /></div></div>
          <CardFront group={g} />
        </div>
      </div>
    </div>
  );
}

// Tuile du récap : un objet = une tuile ; `featured` = le meilleur objet, en tête
export function ChestLootTile(p) {
  var it = p.item, tier = p.tier, r = rarityInfo(tier), featured = p.featured, visual, name, sub;
  if (it.type === "daric") { visual = <Coin size={featured ? 64 : 36} />; name = "+" + fmtNum(it.amount); sub = "Darics"; }
  else if (it.type === "xp") { visual = <Gem size={featured ? 64 : 36} />; name = "+" + fmtNum(it.xp); sub = it.fallback ? "Bonus XP" : "XP"; }
  else if (it.type === "token") { visual = <div className="chx-tok" style={{ position: "relative", width: 42, height: 42 }}><TokenIcon id={it.id} size={24} /></div>; name = itemName(it); sub = "Token"; }
  else {
    visual = <ItemVisual item={it} tier={tier} big={featured} />;
    name = it.type === "cheat_sheet" ? itemName(it).replace(/ — .*/, "") : itemName(it);
    sub = it.duplicate ? "Duplicate" : (COSM_CAPTION[it.type] || "").replace("New ", "").replace(" · Profile → Collection", "");
  }
  return (
    <div className={"chx-tile" + (featured ? " featured" : "") + (featured && tier === 4 ? " chx-foil4" : "")} style={{ "--chx-rc": r ? r.color : "rgba(201,164,90,.35)" }}>
      {r && <div className="chx-t-badge" style={{ color: r.color }}>{r.label}</div>}
      <div className="chx-t-vis">{visual}</div>
      <div className="chx-t-name">{name}</div>
      <div className="chx-t-sub">{sub}</div>
      {featured && tier >= 3 && <div className="chx-holo" />}
    </div>
  );
}
