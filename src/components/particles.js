// ═══════════════════════════════════════════════════════════════
// Particules de l'ouverture de coffre v3 : un seul <canvas> pour tout. Déplacé de
// features/chests/chestFx.js le 2026-09-17 (components/) : l'écran de fin de session s'en sert aussi,
// et une feature ne peut pas importer le dossier d'une autre (tests/check_import_graph.cjs).
// Porté de prototypes/chest-animations-v3/particles.js, en fabrique : une instance par
// modal, détruite au démontage (sinon la boucle rAF survit à la fermeture).
// DPR plafonné à 2, quantités divisées par ~2 sur les appareils à ≤ 4 cœurs, boucle
// arrêtée dès qu'il n'y a plus rien à dessiner.
// ═══════════════════════════════════════════════════════════════

function rand(a, b) { return a + Math.random() * (b - a); }
function pickc(c) { return Array.isArray(c) ? c[Math.floor(Math.random() * c.length)] : c; }

export function createChestFx(canvas) {
  var g = canvas.getContext("2d");
  var W = 0, H = 0, parts = [], raf = 0, dead = false;
  var lite = (typeof navigator !== "undefined" && (navigator.hardwareConcurrency || 4) <= 4);

  function resize() {
    var r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function n(count) { return Math.max(1, Math.round(count * (lite ? 0.5 : 1))); }
  function start() { if (!raf && !dead) raf = requestAnimationFrame(loop); }

  // o = {x,y,count,color,angle(deg, 0 = haut),spread,speed:[a,b],gravity,drag,life:[a,b],size:[a,b],kind,jitter,jitterY}
  function emit(o) {
    var c = n(o.count || 10);
    for (var i = 0; i < c; i++) {
      var ang = ((o.angle || 0) + rand(-(o.spread || 180), o.spread || 180) - 90) * Math.PI / 180;
      var sp = rand(o.speed ? o.speed[0] : 1, o.speed ? o.speed[1] : 4);
      var life = rand(o.life ? o.life[0] : 40, o.life ? o.life[1] : 70);
      parts.push({
        x: o.x + rand(-(o.jitter || 0), o.jitter || 0), y: o.y + rand(-(o.jitterY || 0), o.jitterY || 0),
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, g: o.gravity || 0, drag: o.drag || 0.97,
        life: life, max: life, size: rand(o.size ? o.size[0] : 1, o.size ? o.size[1] : 3),
        color: pickc(o.color || "#fff"), kind: o.kind || "spark", tw: Math.random() * 6,
      });
    }
    start();
  }
  // Particules aspirées vers (x,y) depuis un anneau de rayon r
  function attract(o) {
    var c = n(o.count || 20);
    for (var i = 0; i < c; i++) {
      var a = Math.random() * Math.PI * 2, r = rand(o.r * 0.7, o.r * 1.2), life = rand(30, 50);
      parts.push({
        x: o.x + Math.cos(a) * r, y: o.y + Math.sin(a) * r * 0.75, vx: 0, vy: 0, tx: o.x, ty: o.y,
        life: life, max: life, size: rand(1, 2.6), color: pickc(o.color), kind: "attract", g: 0, drag: 0.9, tw: 0,
      });
    }
    start();
  }
  // Pluie de poussière d'or sur toute la largeur
  function rain(o) {
    var c = n(o.count || 40);
    for (var i = 0; i < c; i++) {
      var life = rand(90, 160);
      parts.push({
        x: rand(0, W), y: rand(-H * 0.4, -10), vx: rand(-0.3, 0.3), vy: rand(0.6, 1.8), g: 0.01, drag: 0.995,
        life: life, max: life, size: rand(1, 2.8), color: pickc(o.color), kind: "ember", tw: Math.random() * 6,
      });
    }
    start();
  }

  function loop() {
    raf = 0;
    if (dead) return;
    g.clearRect(0, 0, W, H);
    var alive = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.life--;
      if (p.life <= 0) continue;
      var k = p.life / p.max;
      if (p.kind === "attract") {
        p.vx += (p.tx - p.x) * 0.02; p.vy += (p.ty - p.y) * 0.02;
        p.vx *= p.drag; p.vy *= p.drag;
        if (Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y) < 6) continue;
      } else {
        p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag;
      }
      p.x += p.vx; p.y += p.vy;
      alive.push(p);
      if (p.kind === "dust") {
        g.globalCompositeOperation = "source-over";
        g.globalAlpha = 0.28 * k;
        g.fillStyle = p.color;
        g.beginPath(); g.arc(p.x, p.y, p.size * (1 + (1 - k) * 2.2), 0, 6.283); g.fill();
      } else if (p.kind === "ember" || p.kind === "attract") {
        g.globalCompositeOperation = "lighter";
        p.tw += 0.25;
        g.globalAlpha = Math.min(1, k * 1.6) * (0.55 + 0.45 * Math.sin(p.tw));
        g.fillStyle = p.color;
        g.beginPath(); g.arc(p.x, p.y, p.size, 0, 6.283); g.fill();
      } else {
        g.globalCompositeOperation = "lighter";
        g.globalAlpha = Math.min(1, k * 1.4);
        g.strokeStyle = p.color; g.lineWidth = p.size; g.lineCap = "round";
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2); g.stroke();
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
    parts = alive;
    if (parts.length) start();
  }

  resize();
  window.addEventListener("resize", resize);

  return {
    emit: emit, attract: attract, rain: rain,
    clear: function () { parts = []; g.clearRect(0, 0, W, H); },
    destroy: function () {
      dead = true; parts = [];
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener("resize", resize);
    },
  };
}

// Éclat centré sur un élément (écran de fin de session, cérémonies) : étincelles + braises.
// fx = instance de createChestFx ; sans fx ou sans élément, ne fait rien.
export function burstAt(fx, el, colors, big) {
  if (!fx || !el) return;
  var r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  fx.emit({ x: x, y: y, count: big ? 60 : 34, color: colors, speed: [2, big ? 9 : 6.5], spread: 180, life: [26, 58], size: [1, 2.8], gravity: 0.05, drag: 0.95 });
  fx.emit({ x: x, y: y, count: big ? 26 : 14, color: colors, kind: "ember", speed: [0.6, 2.4], spread: 180, life: [50, 90], size: [1, 2.4], gravity: -0.01, drag: 0.98 });
}
