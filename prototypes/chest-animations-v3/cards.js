// ═══════════════════════════════════════════════════════════════
// cards.js — dos et faces des cartes (direction C) + tuiles du récap (S5)
// Rareté affichée = celle de l'objet (S4). Monnaies, tokens et cheat
// sheets n'ont pas de badge. Plus aucun emoji : tout passe par ART.icon (S8).
// ═══════════════════════════════════════════════════════════════
(function () {
  var L = window.LOOT, A = window.ART;
  var NEUTRAL_BORDER = "#8a6a3a", NEUTRAL_GLOW = "#e8c890";

  function fmt(n) { return Number(n).toLocaleString("en-US"); }
  function rar(i) { return i === null || i === undefined ? null : L.RARITIES[i]; }
  function groupGlow(g) { var r = rar(g.rarity); return r ? r.light : NEUTRAL_GLOW; }
  function groupBorder(g) { var r = rar(g.rarity); return r ? r.color : NEUTRAL_BORDER; }

  function coin(size) {
    return '<div class="coin" style="width:' + size + "px;height:" + size + 'px">' + A.icon("daric", Math.round(size * 0.58), "#3a2a08") + "</div>";
  }
  function gem(size) { return '<div class="gem">' + A.icon("cut-diamond", size, "#8fdcff") + "</div>"; }
  function medal(iconName, size, style) {
    return '<div class="medal" style="width:' + size + "px;height:" + size + "px;" + (style || "") + '">' + A.icon(iconName, Math.round(size * 0.56), "#f3e3c0") + "</div>";
  }
  function frameMedal(d, size) {
    var ring = d.gradient
      ? "background:conic-gradient(from 0deg," + d.gradient.concat([d.gradient[0]]).join(",") + ")"
      : "background:" + d.color + ";box-shadow:0 0 " + Math.round(size / 5) + "px " + d.color;
    return '<div class="ring" style="width:' + (size + 12) + "px;height:" + (size + 12) + "px;" + ring + '">' + medal("crossed-swords", size) + "</div>";
  }
  function skinSwatch(d, size) {
    return '<div class="swatch" style="width:' + size + "px;height:" + size + "px;background:linear-gradient(135deg," + d.hex + "," + d.dark + ");box-shadow:0 0 " + Math.round(size / 4) + "px " + d.hex + '88"><i></i><i></i><i></i></div>';
  }
  function titlePlate(d, color, fs) {
    return '<div class="plate" style="color:' + color + ";border-color:" + color + ";font-size:" + fs + 'px">' + d.name + "</div>";
  }

  var COSM_CAPTION = { avatar: "New avatar", skin: "New skin", frame: "New avatar frame", title: "New title" };

  function cosmeticVisual(item, big) {
    var d = item.data, r = rar(item.rarity);
    if (item.type === "avatar") return medal(d.icon, big ? 104 : 40, "border-color:" + r.color);
    if (item.type === "skin") return skinSwatch(d, big ? 96 : 38);
    if (item.type === "frame") return frameMedal(d, big ? 86 : 32);
    return titlePlate(d, r.color, big ? 17 : 10);
  }

  function back(g) {
    var legend = g.rarity === 4;
    return '<div class="face back' + (legend ? " legend" : "") + '">' +
      '<div class="back-inner">' + A.icon("swords-emblem", 70, "#c9a45a") + "</div></div>";
  }

  function tokenFan(items) {
    // doublons regroupés : « 2× Daily Reroll »
    var counts = {}, order = [];
    items.forEach(function (t) { if (!counts[t.id]) { counts[t.id] = 0; order.push(t); } counts[t.id]++; });
    var n = items.length;
    var fan = items.map(function (t, i) {
      var off = i - (n - 1) / 2;
      return '<div class="tok" style="transform:translateX(' + off * 40 + "px) rotate(" + off * 12 + "deg) translateY(" + Math.abs(off) * 6 + 'px)">' + A.icon(t.data.icon, 30, "#f3dca0") + "</div>";
    }).join("");
    var names = order.map(function (t) { return (counts[t.id] > 1 ? counts[t.id] + "× " : "") + t.data.name; }).join(" · ");
    return { fan: fan, names: names, n: n };
  }

  function front(g) {
    var r = rar(g.rarity), body = "";
    if (g.kind === "currencies") {
      body = '<div class="cur">' + g.items.map(function (it) {
        var isD = it.type === "daric", amt = isD ? it.amount : it.xp;
        return '<div class="cur-row">' + (isD ? coin(46) : gem(46)) +
          '<div class="cur-num"><span class="cnt" data-to="' + amt + '">+0</span><small>' + (isD ? "Darics" : "XP") + "</small></div></div>";
      }).join("") + '</div><div class="cf-cap">Arena currency &amp; bonus XP</div>';
    } else if (g.kind === "tokens") {
      var tf = tokenFan(g.items);
      body = '<div class="tok-fan">' + tf.fan + '</div><div class="cf-name">' + tf.n + " Token" + (tf.n > 1 ? "s" : "") + '</div><div class="cf-cap">' + tf.names + "</div>";
    } else if (g.kind === "cheat_sheet") {
      body = '<div class="cf-visual">' + A.icon("scroll-unfurled", 92, "#ecd6a2") + '</div><div class="cf-name small">' + g.items[0].name + '</div><div class="cf-cap">Cheat Sheet · Profile → Collection</div>';
    } else {
      var it = g.items[0];
      body = '<div class="cf-visual">' + cosmeticVisual(it, true) + '</div><div class="cf-name">' + it.data.name + '</div><div class="cf-cap">' + COSM_CAPTION[it.type] + "</div>";
    }
    return '<div class="face front' + (g.rarity >= 3 ? " foil r" + g.rarity : "") + '">' +
      (r ? '<div class="badge" style="color:' + r.color + ";border-color:" + r.color + '">' + r.label + "</div>" : '<div class="badge none"></div>') +
      '<div class="cf-body">' + body + "</div>" +
      (g.rarity >= 3 ? '<div class="holo"></div>' : "") + "</div>";
  }

  function cardHtml(g, i) {
    return '<div class="card" data-i="' + i + '" style="--rc:' + groupBorder(g) + ";--glow:" + groupGlow(g) + '" role="button" tabindex="0" aria-label="Reveal reward ' + (i + 1) + '">' +
      '<div class="card-tilt"><div class="card-inner">' + back(g) + front(g) + "</div></div></div>";
  }

  // Tuiles du récap : un objet = une tuile, le meilleur cosmétique en vedette
  function recapTile(item, featured) {
    var visual, name, sub = "", r = rar(item.rarity);
    if (item.type === "daric") { visual = coin(featured ? 64 : 36); name = "+" + fmt(item.amount); sub = "Darics"; }
    else if (item.type === "xp") { visual = gem(featured ? 64 : 36); name = "+" + fmt(item.xp); sub = "XP"; }
    else if (item.type === "token") { visual = medal(item.data.icon, 38, "background:radial-gradient(circle at 35% 30%,#4a3a22,#1c140a)"); name = item.data.name; sub = "Token"; }
    else if (item.type === "cheat_sheet") { visual = A.icon("scroll-unfurled", 40, "#ecd6a2"); name = item.name.replace(/ — .*/, ""); sub = "Cheat Sheet"; }
    else { visual = cosmeticVisual(item, featured); name = item.data.name; sub = COSM_CAPTION[item.type].replace("New ", ""); }
    var border = r ? r.color : "rgba(201,164,90,.35)";
    return '<div class="tile' + (featured ? " featured" + (item.rarity >= 3 ? " foil r" + item.rarity : "") : "") + '" style="--rc:' + border + '">' +
      (r ? '<div class="t-badge" style="color:' + r.color + '">' + r.label + "</div>" : "") +
      '<div class="t-vis">' + visual + '</div><div class="t-name">' + name + '</div><div class="t-sub">' + sub + "</div>" +
      (featured && item.rarity >= 3 ? '<div class="holo"></div>' : "") + "</div>";
  }

  window.CARDS = { cardHtml: cardHtml, recapTile: recapTile, groupGlow: groupGlow, fmt: fmt };
})();
