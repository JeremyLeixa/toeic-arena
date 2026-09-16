// ═══════════════════════════════════════════════════════════════
// chest-art.js — un coffre SVG par niveau (socle S1) + cercle runique
// Même géométrie que TreasureChestSvg (viewBox 180×150) pour rester
// compatible avec le toast ; seules la palette et les ornements changent.
// Calques animés : .c-lid (couvercle), .c-lid-int (intérieur du couvercle
// ouvert), .c-mouth (lumière du coffre ouvert), .c-seam (fuites de lumière),
// .c-lock (serrure). La couleur des fuites suit la variable CSS --tell.
// ═══════════════════════════════════════════════════════════════
(function () {
  var PAL = [
    { // Novice — bois clair usé, cordage, fer
      lid: ["#a8743f", "#7a4f26", "#553518"], body: ["#80552c", "#4a2e14"], line: "#2e1a0a",
      band: ["#c9a66b", "#9a7a44", "#6b5028"], lock: ["#b8b8b8", "#7a7a7a", "#404040"], stud: "#8a8a8a",
      int: ["#1a0e04", "#3a2410"],
    },
    { // Warrior — bois sombre, acier bleui
      lid: ["#6b3f1a", "#4a2a10", "#2e1a08"], body: ["#553015", "#2a1606"], line: "#1a0d04",
      band: ["#9ab8d2", "#56769a", "#2b3f55"], lock: ["#dce8f4", "#8aa2ba", "#3a4a5c"], stud: "#c0d4e6",
      int: ["#0e0804", "#2a1a0c"],
    },
    { // Champion — acajou, bronze et runes gravées
      lid: ["#8a4226", "#5e2a18", "#3a160a"], body: ["#662e1a", "#2e1208"], line: "#1e0a04",
      band: ["#eab45a", "#b07830", "#5e3c12"], lock: ["#ffe596", "#e0a830", "#8a5a10"], stud: "#f0c060",
      int: ["#140804", "#34180c"],
    },
    { // Legendary — obsidienne, or, gemme et runes vivantes
      lid: ["#453a58", "#261d36", "#120c1a"], body: ["#2e2640", "#0e0a14"], line: "#07040c",
      band: ["#ffe690", "#e3ad35", "#7a5010"], lock: ["#fff0b0", "#f0bc40", "#8a5a10"], stud: "#ffd870",
      int: ["#07040c", "#221a30"],
    },
  ];

  function grad(id, cols, vertical) {
    var stops = cols.map(function (c, i) {
      return '<stop offset="' + Math.round(i / (cols.length - 1) * 100) + '%" stop-color="' + c + '"/>';
    }).join("");
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (vertical ? 0 : 1) + '" y2="' + (vertical ? 1 : 0) + '">' + stops + "</linearGradient>";
  }

  function chestSvg(tier, uid) {
    var P = PAL[tier], u = uid || "c" + tier;
    var fl = "url(#" + u + "l)", fb = "url(#" + u + "b)", fm = "url(#" + u + "m)", fk = "url(#" + u + "k)";
    var s = [];
    s.push('<svg class="chest-svg" viewBox="-10 -30 200 200" overflow="visible" aria-hidden="true"><defs>');
    s.push(grad(u + "l", P.lid, true), grad(u + "b", P.body, true), grad(u + "m", P.band, true), grad(u + "k", P.lock, true), grad(u + "i", P.int, true));
    s.push('<radialGradient id="' + u + 'mouth" cx="50%" cy="80%" r="70%"><stop offset="0%" stop-color="#fff"/><stop offset="35%" style="stop-color:var(--tell)"/><stop offset="100%" style="stop-color:var(--tell)" stop-opacity="0.15"/></radialGradient>');
    s.push('<linearGradient id="' + u + 'ray" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" style="stop-color:var(--tell)" stop-opacity="0.95"/><stop offset="100%" style="stop-color:var(--tell)" stop-opacity="0"/></linearGradient>');
    s.push('<filter id="' + u + 'blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.6"/></filter>');
    if (tier === 3) s.push('<linearGradient id="' + u + 'gem" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff6c8"/><stop offset="45%" stop-color="#ffc020"/><stop offset="100%" stop-color="#9a5a00"/></linearGradient>');
    s.push("</defs>");

    // Ombre au sol
    s.push('<ellipse class="c-shadow" cx="90" cy="148" rx="82" ry="9" fill="#000" opacity="0.55"/>');

    // Intérieur du couvercle, visible une fois ouvert (pivot sur l'arrière, y=55)
    s.push('<g class="c-lid-int"><path d="M 16 55 Q 16 18 90 18 Q 164 18 164 55 Z" fill="url(#' + u + 'i)" stroke="' + P.line + '" stroke-width="1.5"/>');
    s.push('<path d="M 16 55 Q 16 18 90 18 Q 164 18 164 55" fill="none" stroke="' + fm + '" stroke-width="4"/>');
    s.push('<path d="M 24 55 Q 26 30 90 28 Q 154 30 156 55 Z" style="fill:var(--tell)" opacity="0.35"/></g>');

    // Bouche lumineuse du coffre ouvert
    s.push('<path class="c-mouth" d="M 10 66 L 20 52 L 160 52 L 170 66 Z" fill="url(#' + u + 'mouth)"/>');

    // Corps
    s.push('<g class="c-body">');
    s.push('<rect x="10" y="65" width="160" height="80" rx="3" fill="' + fb + '" stroke="' + P.line + '" stroke-width="1.5"/>');
    [50, 90, 130].forEach(function (x) { s.push('<line x1="' + x + '" y1="68" x2="' + x + '" y2="142" stroke="' + P.line + '" stroke-width="1" opacity="0.7"/>'); });
    [[63, 6], [100, 4], [138, 5]].forEach(function (b) {
      s.push('<rect x="8" y="' + b[0] + '" width="164" height="' + b[1] + '" fill="' + fm + '" stroke="' + P.line + '" stroke-width="0.5"/>');
      if (tier === 0) s.push('<line x1="8" y1="' + (b[0] + b[1] / 2) + '" x2="172" y2="' + (b[0] + b[1] / 2) + '" stroke="#5a3e1c" stroke-width="1.4" stroke-dasharray="3 2.5"/>');
    });
    [[14, 66], [166, 66], [14, 141], [166, 141]].forEach(function (p) { s.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.9" fill="' + P.stud + '"/>'); });
    s.push('<rect x="12" y="138" width="18" height="8" rx="1" fill="' + fm + '"/><rect x="150" y="138" width="18" height="8" rx="1" fill="' + fm + '"/>');
    if (tier === 1) { // plaques d'angle et rivets d'acier
      s.push('<path d="M 10 69 L 30 69 L 10 89 Z M 170 69 L 150 69 L 170 89 Z" fill="' + fm + '" stroke="' + P.line + '" stroke-width="0.6"/>');
      for (var rx = 22; rx < 170; rx += 16) s.push('<circle cx="' + rx + '" cy="102" r="1.1" fill="' + P.stud + '"/>');
    }
    if (tier === 2) { // médaillons latéraux gravés
      [30, 150].forEach(function (cx) {
        s.push('<circle cx="' + cx + '" cy="120" r="8" fill="none" stroke="' + fm + '" stroke-width="2"/><path d="M ' + (cx - 4) + ' 120 L ' + cx + ' 114 L ' + (cx + 4) + ' 120 L ' + cx + ' 126 Z" fill="' + P.stud + '" opacity="0.8"/>');
      });
    }
    if (tier === 3) { // runes vivantes sur les planches + filigranes d'angle
      ["M 28 112 l 6 -8 l 6 8 M 34 104 v 14", "M 68 110 h 10 M 73 104 v 14 l 5 -4", "M 104 104 l 8 14 M 112 104 l -8 14", "M 142 104 v 14 l 8 -7 l -8 -7"].forEach(function (d) {
        s.push('<path class="c-rune" d="' + d + '" fill="none" stroke="#ffd060" stroke-width="1.6" stroke-linecap="round"/>');
      });
      s.push('<path d="M 10 69 q 16 2 18 16 q -8 -6 -18 -4 Z M 170 69 q -16 2 -18 16 q 8 -6 18 -4 Z" fill="' + fm + '"/>');
    }
    // Serrure
    s.push('<g class="c-lock"><rect x="77" y="77" width="26" height="24" rx="2" fill="' + fk + '" stroke="' + P.line + '" stroke-width="1"/>');
    if (tier === 3) {
      s.push('<path class="c-gem" d="M 90 80 L 99 89 L 90 99 L 81 89 Z" fill="url(#' + u + 'gem)" stroke="#6a3c00" stroke-width="0.8"/><path d="M 90 80 L 94 89 L 90 99 M 81 89 H 99" stroke="#fff6c8" stroke-width="0.5" opacity="0.7" fill="none"/>');
    } else {
      s.push('<circle cx="90" cy="86" r="3" fill="#120a04"/><path d="M 88.5 86 L 91.5 86 L 91 94 L 89 94 Z" fill="#120a04"/>');
    }
    s.push('<rect x="79" y="78" width="22" height="3" rx="1" fill="rgba(255,250,220,0.45)"/></g>');
    s.push("</g>");

    // Couvercle
    s.push('<g class="c-lid">');
    s.push('<path d="M 10 65 Q 10 15 90 15 Q 170 15 170 65 Z" fill="' + fl + '" stroke="' + P.line + '" stroke-width="1.5"/>');
    s.push('<path d="M 50 65 Q 55 25 65 20 M 130 65 Q 125 25 115 20" fill="none" stroke="' + P.line + '" stroke-width="1" opacity="0.6"/>');
    s.push('<path d="M 10 65 Q 10 15 90 15 Q 170 15 170 65" fill="none" stroke="' + fm + '" stroke-width="5"/>');
    s.push('<rect x="86" y="16" width="8" height="49" fill="' + fm + '"/>');
    if (tier >= 2) {
      s.push('<path class="' + (tier === 3 ? "c-rune" : "") + '" d="M 38 44 l 5 -7 l 5 7 M 60 32 v 10 l 5 -5 M 115 32 v 10 l -5 -5 M 132 44 l 5 -7 l 5 7" fill="none" stroke="' + (tier === 3 ? "#ffd060" : "#e8b060") + '" stroke-width="1.5" stroke-linecap="round" opacity="' + (tier === 3 ? 1 : 0.55) + '"/>');
    }
    if (tier === 3) s.push('<path d="M 90 4 L 97 15 L 90 13 L 83 15 Z" fill="' + fm + '" stroke="' + P.line + '" stroke-width="0.6"/>');
    s.push('<circle cx="90" cy="19" r="2.2" fill="' + P.stud + '" stroke="' + P.line + '" stroke-width="0.5"/>');
    s.push('<rect x="84" y="58" width="12" height="12" rx="1" fill="' + fk + '" stroke="' + P.line + '" stroke-width="1"/>');
    s.push("</g>");

    // Fuites de lumière (opacité pilotée par l'animation)
    s.push('<g class="c-seam" style="mix-blend-mode:screen">');
    [[20, -26], [55, -10], [90, 0], [125, 10], [160, 26]].forEach(function (r) {
      s.push('<path class="c-ray" d="M ' + (r[0] - 3) + ' 65 L ' + (r[0] + r[1] - 9) + ' -20 L ' + (r[0] + r[1] + 9) + ' -20 L ' + (r[0] + 3) + ' 65 Z" fill="url(#' + u + 'ray)"/>');
    });
    s.push('<path d="M 12 65 L 168 65" style="stroke:var(--tell)" stroke-width="5" filter="url(#' + u + 'blur)"/>');
    s.push('<path d="M 14 65 L 166 65" stroke="#fff" stroke-width="1.3" opacity="0.9"/>');
    s.push('<circle cx="90" cy="89" r="7" style="fill:var(--tell)" filter="url(#' + u + 'blur)"/>');
    s.push("</g>");

    s.push("</svg>");
    return s.join("");
  }

  // Cercle runique sous le coffre légendaire : tracé en 3 tiers, un par tap
  function runeCircle() {
    var glyphs = [];
    for (var i = 0; i < 12; i++) {
      var a = (i / 12) * Math.PI * 2, x = 160 + Math.cos(a) * 146, y = 46 + Math.sin(a) * 38;
      glyphs.push('<path class="rc-glyph" data-i="' + i + '" d="M ' + (x - 3) + " " + (y + 3) + " l 3 -6 l 3 6 m -3 -6 v 7" + '" />');
    }
    return '<svg class="rune-circle" viewBox="0 0 320 92" aria-hidden="true">' +
      '<ellipse class="rc-outer" cx="160" cy="46" rx="156" ry="42" pathLength="300"/>' +
      '<ellipse class="rc-inner" cx="160" cy="46" rx="128" ry="32" pathLength="300"/>' +
      glyphs.join("") + "</svg>";
  }

  function icon(name, size, color, extra) {
    return '<svg class="gi" viewBox="0 0 512 512" width="' + size + '" height="' + size + '" style="color:' + (color || "currentColor") + ";" + (extra || "") + '" aria-hidden="true">' + (window.CHEST_ICONS[name] || "") + "</svg>";
  }

  window.ART = { chestSvg: chestSvg, runeCircle: runeCircle, icon: icon };
})();
