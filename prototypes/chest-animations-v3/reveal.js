// ═══════════════════════════════════════════════════════════════
// reveal.js — direction C « Le Butin étalé » : cartes face cachée,
// inspection + retournement, Reveal all, récap, Collect, Skip.
// ═══════════════════════════════════════════════════════════════
(function () {
  var P = window.PROTO, L = window.LOOT, S = window.SFX, C = window.CARDS, FX = window.FX;
  function $(id) { return document.getElementById(id); }
  function tf(p) { return "translate(" + p.x + "px," + p.y + "px) rotate(" + p.r + "deg) scale(" + p.s + ")"; }
  function swallow(e) { if (e !== P.STOP) console.error("[chest-proto]", e); }

  function layout(n, g) {
    // marge de 36px : les cartes des bords sont inclinées, leurs coins débordent
    var s = Math.min(n <= 3 ? 0.6 : 0.46, (g.W - 36) / (n * 200 * 0.86 + 200 * 0.14));
    var step = 200 * s * 0.86, y0 = Math.round(g.H * 0.4);
    var out = [];
    for (var i = 0; i < n; i++) {
      var off = i - (n - 1) / 2;
      out.push({ x: Math.round(off * step), y: Math.round(y0 + off * off * 7), r: off * 6, s: s });
    }
    return out;
  }
  function bigPose(g) { return { x: 0, y: Math.round(g.H * 0.45), r: 0, s: Math.min(1.25, (g.H * 0.56) / 280, (g.W - 48) / 200) }; }

  function setHint(text, top) {
    var h = $("cardsHint");
    h.innerHTML = text; h.style.top = top + "px"; h.style.opacity = "1"; h.classList.add("pulse");
  }
  function hideHint() { var h = $("cardsHint"); h.classList.remove("pulse"); h.style.opacity = "0"; }
  function fanHint(st) {
    var maxY = Math.max.apply(null, st.slots.map(function (s) { return s.y; }));
    setHint("Tap a card to reveal", maxY + 140 * st.slots[0].s + 26);
  }
  function showCta(html) { var c = $("cta"); c.innerHTML = html; c.classList.add("on"); }
  function hideCta() { $("cta").classList.remove("on"); }

  // ── 1. Les cartes jaillissent du coffre ──
  P.burstCards = async function (st) {
    var g = P.geom(), n = st.groups.length, wrap = $("cards");
    wrap.innerHTML = st.groups.map(C.cardHtml).join("");
    st.cards = Array.prototype.slice.call(wrap.children);
    st.slots = layout(n, g);
    st.flipped = st.cards.map(function () { return false; });
    st.big = bigPose(g);
    var run = P.run;

    P.anim($("chestArea"), [{ transform: "none", opacity: 1 }, { transform: "translateY(" + Math.round(g.H * 0.22) + "px) scale(.5)", opacity: 0.3 }], { duration: 750, delay: 250, easing: "cubic-bezier(.4,0,.2,1)" });
    P.anim($("beam"), [{ opacity: 0, transform: "scaleY(1)" }], { duration: 600, delay: 300 });
    P.anim($("halo"), [{ opacity: 0.25 }], { duration: 800 });
    P.anim($("rays"), [{ opacity: 0.45, transform: "translateY(" + -Math.round(g.H * 0.1) + "px)" }], { duration: 900, easing: "ease-out" });

    st.cards.forEach(function (el, i) {
      var slot = st.slots[i];
      var start = { x: Math.round((Math.random() - 0.5) * 30), y: g.mouthY, r: Math.round((Math.random() - 0.5) * 40), s: 0.12 };
      var mid = { x: Math.round(slot.x * 0.55), y: Math.round(Math.min(slot.y, g.mouthY) - g.H * 0.16), r: slot.r * 3 + (i % 2 ? 15 : -15), s: slot.s * 1.15 };
      P.anim(el, [{ opacity: 0, transform: tf(start) }, { opacity: 1, transform: tf(mid), offset: 0.5 }, { opacity: 1, transform: tf(slot) }], { duration: 680, delay: i * 120, easing: "cubic-bezier(.25,.8,.35,1)" });
      setTimeout(function () { if (run === P.run) S.cardFly(i); }, i * 120);
      setTimeout(function () {
        if (run !== P.run) return;
        FX.emit({ x: g.W / 2 + slot.x, y: slot.y, count: 10, color: [C.groupGlow(st.groups[i]), "#fff"], spread: 180, speed: [1, 3], life: [18, 30], size: [1, 2] });
      }, i * 120 + 620);
      // Le tell passe au dos des cartes : épique et légendaire pulsent déjà
      if (st.groups[i].rarity >= 3) el.classList.add("pulse");
      el.addEventListener("click", function () { onCardTap(i); });
      el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onCardTap(i); } });
      attachTilt(el, i);
    });
    await P.sleep(n * 120 + 700);
    st.phase = "cards";
    fanHint(st);
    showCta('<button class="b2" id="revealAll">Reveal all</button>');
    $("revealAll").onclick = function () { revealAll().catch(swallow); };
  };

  function onCardTap(i) {
    var st = P.state;
    if (!st || st.phase !== "cards" || st.busy) return;
    if (st.inspecting !== null) { closeCard().catch(swallow); return; }
    inspect(i).catch(swallow);
  }

  // ── 2. Inspection : la carte monte au centre et se retourne ──
  async function inspect(i) {
    var st = P.state, g = P.geom(), el = st.cards[i], grp = st.groups[i], r = grp.rarity;
    st.busy = true; st.inspecting = i;
    hideHint(); hideCta();
    el.classList.add("inspect");
    $("dim").classList.add("on");
    P.anim($("dim"), [{ opacity: 1 }], { duration: 300 });
    S.lift();
    await P.done(P.anim(el, [{ transform: tf(st.slots[i]) }, { transform: tf(st.big) }], { duration: 420, easing: "cubic-bezier(.2,.9,.3,1.12)" }));
    if (!st.flipped[i]) {
      el.classList.remove("pulse");
      if (r >= 3) {
        // Anticipation : battement de cœur, la carte tremble et aspire la lumière
        S.heartbeat(); P.haptic([30, 200, 30]);
        FX.attract({ x: g.W / 2, y: st.big.y, r: 190, count: r >= 4 ? 50 : 30, color: [C.groupGlow(grp), "#fff"] });
        if (r >= 4) {
          P.setTell(4);
          P.anim($("rays"), [{ opacity: 0.95, transform: "translateY(" + -Math.round(g.H * 0.05) + "px) scale(1.1)" }], { duration: 700 });
        }
        await P.done(P.anim(el.querySelector(".card-tilt"), [
          { transform: "rotate(0)" }, { transform: "rotate(-2.5deg) scale(1.02)" }, { transform: "rotate(2.5deg) scale(1.03)" }, { transform: "rotate(0) scale(1)" },
        ], { duration: 140, iterations: r >= 4 ? 6 : 4, fill: "none" }));
      }
      await flip(i, true);
      st.flipped[i] = true;
    }
    if (r >= 3) el.classList.add("holo-on");
    st.busy = false;
    setHint("Tap to continue", Math.min(g.H - 40, st.big.y + 140 * st.big.s + 22));
  }

  async function flip(i, big) {
    var st = P.state, g = P.geom(), el = st.cards[i], grp = st.groups[i], r = grp.rarity;
    var inner = el.querySelector(".card-inner"), col = C.groupGlow(grp);
    var cx = g.W / 2 + (big ? 0 : st.slots[i].x), cy = big ? st.big.y : st.slots[i].y;
    S.flip();
    var fa = P.anim(inner, [{ transform: "rotateY(0)" }, { transform: "rotateY(180deg)" }], { duration: big ? 560 : 380, easing: "cubic-bezier(.45,.05,.25,1)" });
    await P.sleep(big ? 250 : 170);
    if (big) {
      S.reveal(r);
      P.haptic(r >= 3 ? [40, 30, 120] : [20]);
      FX.emit({ x: cx, y: cy, count: r === null ? 26 : [18, 26, 40, 70, 120][r], color: [col, "#fff"], spread: 180, speed: [2, 9], gravity: 0.08, life: [28, 60], size: [1, 2.6] });
      if (r >= 4) { P.flash(0.75, 520); P.shake(8, 420); FX.rain({ count: 80, color: ["#ffd65a", "#fff2c0", "#ffb020"] }); }
      else if (r === 3) P.flash(0.35, 380);
    } else {
      FX.emit({ x: cx, y: cy, count: 12, color: [col, "#fff"], spread: 180, speed: [1, 4], life: [18, 32], size: [1, 2] });
    }
    await P.done(fa);
    if (grp.kind === "currencies") big ? countUp(el) : settleCounts(el);
  }

  // Les montants défilent avec un tic par palier
  function countUp(el) {
    var run = P.run;
    el.querySelectorAll(".cnt").forEach(function (span) {
      var to = Number(span.dataset.to), t0 = performance.now(), dur = 900;
      (function step(now) {
        if (run !== P.run) return;
        var k = Math.min(1, (now - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 3)));
        var txt = "+" + C.fmt(v);
        if (span.textContent !== txt) { span.textContent = txt; if (k < 1) S.tick(); }
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }
  function settleCounts(el) { el.querySelectorAll(".cnt").forEach(function (s) { s.textContent = "+" + C.fmt(Number(s.dataset.to)); }); }

  async function closeCard() {
    var st = P.state, i = st.inspecting;
    if (i === null || st.busy) return;
    st.busy = true;
    var el = st.cards[i];
    settleCounts(el);
    el.classList.remove("holo-on", "tracking");
    resetTilt(el);
    hideHint();
    P.anim($("dim"), [{ opacity: 0 }], { duration: 300 });
    $("dim").classList.remove("on");
    if (st.groups[i].rarity >= 4) P.anim($("rays"), [{ opacity: 0.45, transform: "translateY(" + -Math.round(P.geom().H * 0.1) + "px)" }], { duration: 600 });
    await P.done(P.anim(el, [{ transform: tf(st.big) }, { transform: tf(st.slots[i]) }], { duration: 360, easing: "cubic-bezier(.4,0,.2,1)" }));
    el.classList.remove("inspect");
    st.inspecting = null; st.busy = false;
    if (st.flipped.every(Boolean)) { await P.sleep(350); P.showRecap(false); }
    else { fanHint(st); showCta('<button class="b2" id="revealAll">Reveal all</button>'); $("revealAll").onclick = function () { revealAll().catch(swallow); }; }
  }
  $("dim").addEventListener("click", function () { if (P.state && P.state.inspecting !== null) closeCard().catch(swallow); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && P.state && P.state.inspecting !== null) closeCard().catch(swallow); });

  // ── S5 — Reveal all : tout se retourne en place, un seul son de révélation ──
  async function revealAll() {
    var st = P.state;
    if (!st || st.phase !== "cards" || st.busy) return;
    st.busy = true; hideCta(); hideHint();
    var maxR = -1;
    st.cards.forEach(function (el, i) {
      if (st.flipped[i]) return;
      el.classList.remove("pulse");
      var r = st.groups[i].rarity; if (r !== null && r > maxR) maxR = r;
    });
    for (var i = 0; i < st.cards.length; i++) {
      if (st.flipped[i]) continue;
      flip(i, false).catch(swallow);
      st.flipped[i] = true;
      await P.sleep(160);
    }
    S.reveal(maxR < 0 ? null : maxR);
    await P.sleep(750);
    st.busy = false;
    P.showRecap(false);
  }

  // ── S5 — Récap : un objet = une tuile, le meilleur cosmétique en vedette ──
  P.showRecap = function (instant) {
    var st = P.state, g = P.geom(), run = P.run;
    st.phase = "recap";
    $("skip").classList.remove("on"); hideCta(); hideHint(); $("dim").classList.remove("on");
    var d = function (ms) { return instant ? 1 : ms; };
    (st.cards || []).forEach(function (el, i) {
      P.anim(el, [{ opacity: 0, transform: tf({ x: Math.round(st.slots[i].x * 0.6), y: Math.round(g.H * 0.3), r: 0, s: 0.1 }) }], { duration: d(380), delay: instant ? 0 : i * 40, easing: "cubic-bezier(.5,0,.8,.4)" });
    });
    P.anim($("chestArea"), [{ opacity: 0 }], { duration: d(400) });
    P.anim($("beam"), [{ opacity: 0 }], { duration: d(200) });
    P.anim($("rays"), [{ opacity: instant ? 0 : 0.3, transform: "translateY(" + -Math.round(g.H * 0.25) + "px)" }], { duration: d(600) });

    var items = [];
    st.groups.forEach(function (gr) { gr.items.forEach(function (it) { items.push(it); }); });
    // Vedette = meilleur cosmétique ; puis les autres cosmétiques, puis monnaies, tokens, cheat sheets
    var cosm = items.filter(function (it) { return it.rarity !== undefined; }).sort(function (a, b) { return b.rarity - a.rarity; });
    var feat = cosm[0] || null;
    var rest = cosm.slice(1).concat(items.filter(function (it) { return it.rarity === undefined; }));
    var rc = $("recap");
    rc.innerHTML = "<h2>LOOT</h2><div class=\"sub\">" + P.chestLabel() + " Chest · " + items.length + " rewards</div>" +
      '<div class="grid">' + (feat ? C.recapTile(feat, true) : "") + rest.map(function (it) { return C.recapTile(it, false); }).join("") + "</div>";
    rc.scrollTop = 0;
    rc.classList.add("on");
    P.anim(rc.querySelector("h2"), [{ opacity: 0, transform: "translateY(-10px)" }, { opacity: 1, transform: "none" }], { duration: d(400), fill: "both" });
    P.anim(rc.querySelector(".sub"), [{ opacity: 0 }, { opacity: 1 }], { duration: d(400), delay: instant ? 0 : 120, fill: "both" });
    var tiles = rc.querySelectorAll(".tile");
    tiles.forEach(function (t, i) {
      P.anim(t, [{ opacity: 0, transform: "translateY(18px) scale(.85)" }, { opacity: 1, transform: "none" }], { duration: d(560), delay: instant ? 0 : 220 + i * 70, easing: instant ? "linear" : P.SPRING, fill: "both" });
      if (!instant) setTimeout(function () { if (run === P.run) S.tick(); }, 220 + i * 70);
    });
    setTimeout(function () {
      if (run !== P.run) return;
      showCta('<button class="b1" id="collect">Collect all</button>');
      $("collect").onclick = function () { collect().catch(swallow); };
    }, instant ? 0 : 220 + tiles.length * 70 + 200);
  };

  async function collect() {
    var g = P.geom(), rc = $("recap"), tiles = rc.querySelectorAll(".tile");
    S.collect(); P.haptic([20, 20, 20]);
    hideCta();
    tiles.forEach(function (t, i) {
      P.anim(t, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-70px) scale(.6)" }], { duration: 380, delay: i * 45, easing: "cubic-bezier(.5,0,.8,.4)" });
    });
    P.anim(rc.querySelector("h2"), [{ opacity: 0 }], { duration: 300 });
    P.anim(rc.querySelector(".sub"), [{ opacity: 0 }], { duration: 300 });
    FX.emit({ x: g.W / 2, y: g.H * 0.45, count: 50, color: ["#ffd65a", "#fff"], angle: 0, spread: 50, speed: [3, 10], gravity: 0.05, life: [30, 60], size: [1, 2.4], jitter: 120, jitterY: 80 });
    P.anim($("rays"), [{ opacity: 0 }], { duration: 500 });
    P.anim($("halo"), [{ opacity: 0 }], { duration: 500 });
    await P.sleep(tiles.length * 45 + 700);
    P.showToast();
  }

  // ── S5 — Skip : droit au récap, à n'importe quel moment avant lui ──
  $("skip").addEventListener("click", function () {
    var st = P.state;
    if (!st || st.phase === "recap") return;
    S.unlock();
    P.run++; // coupe toute séquence en cours
    if (P.strainH) { P.strainH.stop(); P.strainH = null; }
    P.cancelScriptAnims();
    FX.clear();
    st.phase = "skipping";
    $("skip").classList.remove("on"); hideCta(); hideHint(); $("dim").classList.remove("on");
    $("chestHint").style.opacity = "0";
    st.resultP.then(function () {
      if (P.state !== st) return;
      st.level = st.best; P.setTell(st.best);
      S.reveal(st.best < 0 ? null : st.best);
      P.showRecap(false);
    });
  });

  // ── Reflet holographique qui suit le doigt (épique / légendaire) ──
  function resetTilt(el) {
    var t = el.querySelector(".card-tilt");
    t.style.removeProperty("--rx"); t.style.removeProperty("--ry");
  }
  function attachTilt(el, i) {
    el.addEventListener("pointermove", function (e) {
      var st = P.state;
      if (!st || st.inspecting !== i || !el.classList.contains("holo-on")) return;
      var rect = el.getBoundingClientRect();
      var px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      var py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      var t = el.querySelector(".card-tilt"), front = el.querySelector(".front");
      t.style.setProperty("--ry", ((px - 0.5) * 22).toFixed(1) + "deg");
      t.style.setProperty("--rx", ((0.5 - py) * 18).toFixed(1) + "deg");
      front.style.setProperty("--mx", (px * 100).toFixed(0) + "%");
      front.style.setProperty("--my", (py * 100).toFixed(0) + "%");
      front.style.setProperty("--hx", (px * 100).toFixed(0) + "%");
      el.classList.add("tracking");
    });
    el.addEventListener("pointerleave", function () { el.classList.remove("tracking"); resetTilt(el); });
  }

  P.init();
})();
