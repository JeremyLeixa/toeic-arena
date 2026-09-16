// ═══════════════════════════════════════════════════════════════
// open.js — direction A « Le Crochetage » : toast → chute → 3 taps → ouverture
// Séquencement par Web Animations API (animation.finished) au lieu de
// setTimeout en cascade. Chaque lancement incrémente PROTO.run : toute
// attente d'un lancement périmé lève STOP et la séquence s'arrête net.
// ═══════════════════════════════════════════════════════════════
(function () {
  var L = window.LOOT, A = window.ART, S = window.SFX;
  function $(id) { return document.getElementById(id); }
  var stage = $("stage"), chest = $("chest"), chestIdle = $("chestIdle");
  var STOP = { stop: true };
  // Ressort physique en CSS pur (easing linear())
  var SPRING = "linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1.004 83.8%, 1)";
  var REASONS = {
    novice: "Daily login reward", guerrier: "Weekly TOEIC progress +25",
    champion: "Module mastery: Grammar Drill", legendaire: "Achievement: Arena Conqueror",
  };
  var TOAST_COLORS = { novice: "#909090", guerrier: "#3a8ee0", champion: "#d4943a", legendaire: "#ffc020" };

  var P = window.PROTO = {
    tier: "legendaire", forced: null, slow: false, reduced: false, run: 0, state: null, strainH: null,
    SPRING: SPRING, STOP: STOP,
  };

  P.sleep = function (ms) {
    var run = P.run;
    return new Promise(function (res, rej) { setTimeout(function () { run === P.run ? res() : rej(STOP); }, ms); });
  };
  P.anim = function (el, frames, opts) { return el.animate(frames, Object.assign({ fill: "forwards" }, opts)); };
  P.done = function (a) {
    var run = P.run;
    return a.finished.then(function () { if (run !== P.run) throw STOP; }, function () { throw STOP; });
  };
  P.haptic = function (p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { console.warn("[chest-proto] vibrate:", e && e.message); } };
  P.setTell = function (level) { stage.style.setProperty("--tell", L.rarityOf(level).light); };
  P.geom = function () {
    var W = stage.clientWidth, H = stage.clientHeight, cy = Math.round(H * 0.5);
    return { W: W, H: H, cy: cy, seamY: cy - 21, mouthY: cy - 28, lockY: cy + 7, groundY: cy + 75 };
  };
  P.flash = function (peak, dur) {
    P.anim($("flash"), [{ opacity: 0 }, { opacity: peak, offset: 0.12 }, { opacity: 0 }], { duration: dur || 420, fill: "none" });
  };
  P.shake = function (px, dur) {
    P.anim(stage, [
      { transform: "translate(0,0)" }, { transform: "translate(" + -px + "px," + px * 0.4 + "px)" },
      { transform: "translate(" + px * 0.8 + "px," + -px * 0.5 + "px)" }, { transform: "translate(" + -px * 0.5 + "px," + px * 0.3 + "px)" },
      { transform: "translate(" + px * 0.3 + "px,0)" }, { transform: "translate(0,0)" },
    ], { duration: dur, fill: "none", easing: "ease-out" });
  };
  P.chestLabel = function () { return L.CHESTS[P.tier].label; };

  // Annule les animations lancées par script (garde les boucles CSS : rayons, runes…)
  P.cancelScriptAnims = function () {
    document.getAnimations().forEach(function (a) {
      if (typeof CSSAnimation !== "undefined" && a instanceof CSSAnimation) return;
      if (typeof CSSTransition !== "undefined" && a instanceof CSSTransition) return;
      a.cancel();
    });
  };
  function stopStrain() { if (P.strainH) { P.strainH.stop(); P.strainH = null; } }

  P.reset = function () {
    P.run++;
    stopStrain();
    P.cancelScriptAnims();
    window.FX.clear();
    P.state = null;
    chest.className = "chest"; chest.style.opacity = "";
    chestIdle.className = "chest-idle"; chestIdle.innerHTML = "";
    $("runeWrap").innerHTML = ""; $("cards").innerHTML = ""; $("recap").innerHTML = "";
    ["recap", "cta", "skip", "toast", "dim"].forEach(function (id) { $(id).classList.remove("on"); });
    ["chestHint", "cardsHint"].forEach(function (id) { $(id).innerHTML = ""; $(id).classList.remove("pulse"); $(id).style.opacity = ""; });
    Array.prototype.forEach.call($("pips").children, function (i) { i.classList.remove("on"); });
    $("idleBg").style.opacity = "0";
    P.setTell(-1);
  };

  // ── Point d'entrée : ChestEarnedToast ──
  P.showToast = function () {
    P.reset();
    $("idleBg").style.opacity = "1";
    var t = $("toast"), tier = L.CHESTS[P.tier].tier;
    t.style.setProperty("--tc", TOAST_COLORS[P.tier]);
    t.innerHTML = '<div class="toast-card"><div class="mini">' + A.chestSvg(tier, "toast") + '</div><div style="flex:1;min-width:0">' +
      '<div class="t1">Treasure earned</div><div class="t2">' + P.chestLabel() + ' Chest</div><div class="t3">' + REASONS[P.tier] + "</div></div></div>" +
      '<div class="acts"><button class="b1" id="openNow">Open now</button><button class="b2" id="later">Later</button></div>';
    t.classList.add("on");
    P.anim(t, [{ transform: "translateY(60px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 650, easing: SPRING });
    $("openNow").onclick = function () { S.unlock(); P.start(); };
    $("later").onclick = function () { P.anim(t, [{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 240, fill: "none" }); };
  };

  // ── Lancement du modal ──
  P.start = function () {
    P.reset();
    var run = P.run;
    var raw = L.simulateChest(P.tier, (P.tier === "guerrier" || P.tier === "champion") ? P.forced : null);
    var st = P.state = {
      raw: raw, groups: L.groupRewards(raw), best: L.bestRarity(raw), steps: null, result: false,
      taps: 0, level: -1, ready: false, opening: false, phase: "chest", inspecting: null, busy: false,
    };
    // S2 — la requête part DÈS l'ouverture du modal ; l'anticipation l'attend, jamais l'inverse.
    st.resultP = new Promise(function (res) {
      setTimeout(function () { st.result = true; st.steps = L.tellSteps(st.best); res(); }, P.slow ? 3400 : 380);
    });
    var g = P.geom(), tier = L.CHESTS[P.tier].tier;
    stage.style.setProperty("--cy", g.cy + "px");
    chestIdle.innerHTML = A.chestSvg(tier, "main");
    if (tier === 3) $("runeWrap").innerHTML = A.runeCircle();
    $("chestLabel").innerHTML = P.chestLabel() + " Chest<small>" + REASONS[P.tier] + "</small>";
    $("beam").style.height = g.mouthY + "px";

    var seq = P.reduced ? reducedIntro(st) : drop(st, g, tier);
    seq.catch(function (e) { if (e !== STOP) console.error("[chest-proto]", e); });
    if (!P.reduced) $("skip").classList.add("on");
    return run;
  };

  async function drop(st, g, tier) {
    P.anim($("halo"), [{ opacity: 0 }, { opacity: 0.3 }], { duration: 700 });
    P.anim($("chestLabel"), [{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "none" }], { duration: 500, delay: 200 });
    var fall = P.anim(chest, [
      { opacity: 1, transform: "translateY(" + -(g.cy + 260) + "px) rotate(-7deg)" },
      { opacity: 1, transform: "translateY(0) rotate(0)" },
    ], { duration: 540, delay: 150, easing: "cubic-bezier(.55,0,.9,.4)" });
    await P.done(fall);
    chest.style.opacity = "1";
    S.thud(tier);
    P.haptic(tier >= 3 ? [60, 30, 40] : [35]);
    window.FX.emit({ x: g.W / 2, y: g.groundY, count: 22, kind: "dust", color: ["#7a5a3a", "#5a4028", "#9a7a58"], angle: 0, spread: 85, speed: [0.6, 2.8], gravity: -0.005, drag: 0.96, life: [40, 70], size: [5, 11], jitter: 70, jitterY: 4 });
    if (tier >= 2) window.FX.emit({ x: g.W / 2, y: g.groundY, count: 14, color: ["#ffd070", "#fff0c0"], angle: 0, spread: 80, speed: [2, 6], gravity: 0.15, life: [20, 40], size: [1, 2], jitter: 60 });
    P.anim($("shock"), [{ opacity: 0.6, transform: "scale(.3)", borderColor: "#c9a45a" }, { opacity: 0, transform: "scale(1.8)", borderColor: "#c9a45a" }], { duration: 650, easing: "cubic-bezier(.2,.8,.3,1)", fill: "none" });
    P.shake(tier >= 3 ? 8 : 4, 300);
    await P.done(P.anim(chest, [{ transform: "scale(1.18,.8) translateY(14px)" }, { transform: "none" }], { duration: 640, easing: SPRING }));
    chestIdle.classList.add("breathe");
    var hint = $("chestHint");
    hint.innerHTML = "Tap to open<small>Hold to open at once</small>";
    hint.style.opacity = "1"; hint.classList.add("pulse");
    P.anim($("pips"), [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    if (tier === 3) P.anim($("runeWrap"), [{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
    st.ready = true;
  }

  // S9 — mouvement réduit : coffre fixe, un tap, fondu vers le récap
  async function reducedIntro(st) {
    chest.style.opacity = "1";
    $("chestLabel").style.opacity = "1";
    var hint = $("chestHint"); hint.innerHTML = "Tap to open"; hint.style.opacity = "1";
    st.ready = true;
  }

  function showTellLabel(level) {
    var el = $("tellLabel");
    el.textContent = L.RARITIES[level].label;
    P.anim(el, [
      { opacity: 0, transform: "scale(.7)" }, { opacity: 1, transform: "scale(1.1)", offset: 0.25 },
      { opacity: 1, transform: "scale(1)", offset: 0.7 }, { opacity: 0, transform: "scale(1)" },
    ], { duration: 1150, fill: "none" });
  }

  // Monte la lumière d'un palier si besoin ; renvoie true s'il y a eu montée
  function raiseTell(st, level, g) {
    if (level <= st.level) return false;
    st.level = level; P.setTell(level);
    if (level >= 1) {
      S.sting(level); showTellLabel(level);
      P.haptic([20, 30, 40]);
      window.FX.emit({ x: g.W / 2, y: g.seamY, count: 16 + level * 8, color: [L.rarityOf(level).light, "#fff"], angle: 0, spread: 40, speed: [4, 10], gravity: 0.1, life: [30, 55], size: [1.2, 2.6], jitter: 40 });
    }
    return true;
  }

  function tap() {
    var st = P.state;
    if (!st || !st.ready || st.opening || st.phase !== "chest") return;
    if (P.reduced) { reducedOpen(st); return; }
    var i = st.taps, g = P.geom();
    st.taps++;
    if (st.steps) raiseTell(st, st.steps[i], g); // avant le résultat : lumière neutre, pas de tell
    chest.classList.remove("lvl1", "lvl2", "lvl3"); chest.classList.add("lvl" + st.taps);
    $("pips").children[i].classList.add("on");
    var rc = $("runeWrap").querySelector(".rune-circle");
    if (rc) {
      rc.classList.add("on" + st.taps);
      rc.querySelectorAll(".rc-glyph").forEach(function (gl, k) { if (k < st.taps * 4) gl.classList.add("lit"); });
    }
    S.knock(i);
    P.haptic([18 + i * 14]);
    P.anim(chest, [
      { transform: "none" }, { transform: "scale(1.07,.9) rotate(-4deg)", offset: 0.22 },
      { transform: "scale(.96,1.06) rotate(3.5deg)", offset: 0.5 }, { transform: "scale(1.01,.99) rotate(-1deg)", offset: 0.75 },
      { transform: "none" },
    ], { duration: 380, easing: "ease-out" });
    window.FX.emit({ x: g.W / 2, y: g.seamY, count: 12 + i * 10, color: [L.rarityOf(st.level).light, "#fff"], angle: 0, spread: 75, speed: [2, 6 + i * 2], gravity: 0.14, life: [22, 45], size: [1, 2.2], jitter: 70 });
    P.anim($("halo"), [{ opacity: 0.35 + st.taps * 0.15 }], { duration: 300 });
    if (st.taps >= 3) openChest(st).catch(function (e) { if (e !== STOP) console.error("[chest-proto]", e); });
  }

  function holdOpen() {
    var st = P.state;
    if (!st || !st.ready || st.opening || P.reduced) return;
    st.taps = 3; chest.classList.add("lvl3");
    Array.prototype.forEach.call($("pips").children, function (i) { i.classList.add("on"); });
    S.knock(2);
    openChest(st).catch(function (e) { if (e !== STOP) console.error("[chest-proto]", e); });
  }

  async function openChest(st) {
    st.opening = true;
    var g = P.geom(), tier = L.CHESTS[P.tier].tier, hint = $("chestHint");
    hint.classList.remove("pulse"); P.anim(hint, [{ opacity: 0 }], { duration: 200 });
    P.anim($("pips"), [{ opacity: 0 }], { duration: 250, delay: 150 });

    if (!st.result) {
      // S2 — réseau lent : le coffre résiste au lieu d'exploser dans le vide
      hint.innerHTML = "The lock resists…";
      P.anim(hint, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
      P.strainH = S.strain();
      var shakeA = P.anim(chestIdle, [
        { transform: "translateX(0)" }, { transform: "translateX(-3px) rotate(-1.5deg)" },
        { transform: "translateX(3px) rotate(1.5deg)" }, { transform: "translateX(0)" },
      ], { duration: 160, iterations: Infinity, fill: "none" });
      var iv = setInterval(function () { window.FX.attract({ x: g.W / 2, y: g.seamY, r: 150, count: 8, color: ["#ffdca8", "#fff"] }); }, 260);
      var run = P.run;
      await st.resultP;
      clearInterval(iv); shakeA.cancel(); stopStrain();
      if (run !== P.run) throw STOP;
      P.anim(hint, [{ opacity: 0 }], { duration: 200 });
    }

    if (raiseTell(st, st.steps[2], g)) await P.sleep(450);
    var best = st.level, col = L.rarityOf(best).light;
    function q(s) { return chestIdle.querySelector(s); }
    chestIdle.classList.remove("breathe");
    chest.classList.add("lvl3");

    // 1. Charge
    S.riser(0.6);
    var charge = P.anim(chest, [{ transform: "none" }, { transform: "scale(1.12,.86) translateY(10px)" }], { duration: 600, easing: "cubic-bezier(.5,0,1,1)" });
    P.anim(chestIdle, [{ transform: "translate(0,0)" }, { transform: "translate(-2px,1px)" }, { transform: "translate(2px,-1px)" }, { transform: "translate(0,0)" }], { duration: 70, iterations: 9, fill: "none" });
    window.FX.attract({ x: g.W / 2, y: g.seamY, r: 170, count: 46, color: [col, "#fff"] });
    P.anim($("halo"), [{ opacity: 0.9 }], { duration: 600 });
    await P.done(charge);

    // 2. Serrure
    S.unlock_lock();
    P.anim(q(".c-lock"), [
      { transform: "none", opacity: 1 }, { transform: "translateY(-6px) rotate(-14deg)", opacity: 1, offset: 0.25 },
      { transform: "translate(10px,60px) rotate(70deg)", opacity: 0 },
    ], { duration: 520, easing: "cubic-bezier(.3,0,.8,.6)" });
    await P.sleep(90);

    // 3. Ouverture : le couvercle bascule sur ses charnières (il n'explose plus)
    S.open(best);
    P.haptic(best >= 4 ? [90, 40, 90, 40, 220] : [50, 30, 50, 30, 150]);
    P.flash(best >= 4 ? 0.9 : best >= 3 ? 0.7 : 0.5, best >= 4 ? 620 : 420);
    P.shake(best >= 4 ? 10 : 6, best >= 4 ? 520 : 320);
    P.anim(chest, [{ transform: "scale(1.12,.86) translateY(10px)" }, { transform: "none" }], { duration: 720, easing: SPRING });
    P.anim(q(".c-lid"), [{ transform: "none" }, { transform: "translateY(-12px) scaleY(0)" }], { duration: 190, easing: "cubic-bezier(.5,0,1,1)" });
    P.anim(q(".c-lid-int"), [{ transform: "scaleY(0)" }, { transform: "scaleY(1.18)", offset: 0.6 }, { transform: "scaleY(1)" }], { duration: 420, delay: 170, easing: "ease-out", fill: "both" });
    P.anim(q(".c-mouth"), [{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: 140 });
    P.anim(q(".c-seam"), [{ opacity: 1 }, { opacity: 0 }], { duration: 200, delay: 160 });
    P.anim($("beam"), [{ transform: "scaleY(0)", opacity: 1 }, { transform: "scaleY(1)", opacity: 1 }], { duration: 460, delay: 120, easing: "cubic-bezier(.2,.8,.3,1)" });
    P.anim($("rays"), [{ opacity: 0, transform: "scale(.6)" }, { opacity: best >= 3 ? 1 : best >= 1 ? 0.75 : 0.5, transform: "scale(1)" }], { duration: 700, delay: 100, easing: "ease-out" });
    P.anim($("shock"), [{ opacity: 0.9, transform: "scale(.3)" }, { opacity: 0, transform: "scale(2.4)" }], { duration: 800, delay: 120, easing: "cubic-bezier(.2,.8,.3,1)", fill: "none" });
    if (tier === 3) P.anim($("runeWrap"), [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.6)" }], { duration: 700, delay: 100, easing: "ease-out" });
    P.anim($("chestLabel"), [{ opacity: 0 }], { duration: 300 });
    await P.sleep(130);
    window.FX.emit({ x: g.W / 2, y: g.mouthY, count: best >= 4 ? 120 : best >= 3 ? 80 : 55, color: [col, "#fff", "#ffe9b0"], angle: 0, spread: 60, speed: [4, 12], gravity: 0.16, drag: 0.975, life: [35, 75], size: [1.2, 2.8], jitter: 60 });
    window.FX.emit({ x: g.W / 2, y: g.groundY, count: 16, kind: "dust", color: ["#7a5a3a", "#5a4028"], angle: 0, spread: 88, speed: [0.8, 3], gravity: -0.004, life: [40, 70], size: [6, 12], jitter: 80 });
    if (best >= 4) {
      window.FX.rain({ count: 90, color: ["#ffd65a", "#fff2c0", "#ffb020"] });
      var run2 = P.run;
      setTimeout(function () { if (run2 === P.run) window.FX.rain({ count: 60, color: ["#ffd65a", "#fff2c0"] }); }, 900);
    }
    await P.sleep(best >= 4 ? 1100 : best >= 3 ? 850 : 650);

    // 4. Les récompenses sortent en cartes (reveal.js)
    await P.burstCards(st);
  }

  async function reducedOpen(st) {
    st.opening = true;
    await st.resultP;
    if (P.state !== st) return;
    S.open(st.best);
    P.showRecap(true);
  }

  // ── Entrées : tap, maintien, clavier ──
  var holdTimer = null;
  chest.addEventListener("pointerdown", function () {
    clearTimeout(holdTimer);
    holdTimer = setTimeout(function () { holdTimer = null; holdOpen(); }, 480);
  });
  chest.addEventListener("pointerup", function () { if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; tap(); } });
  chest.addEventListener("pointerleave", function () { clearTimeout(holdTimer); holdTimer = null; });
  chest.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(); } });

  // ── Barre du prototype ──
  P.init = function () {
    window.FX.attach($("fx"));
    var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    function setReduced(on) {
      P.reduced = on; $("optReduced").checked = on;
      stage.classList.toggle("reduced", on); window.FX.setReduced(on);
    }
    setReduced(mq.matches);
    function syncForce() { $("forceR").disabled = !(P.tier === "guerrier" || P.tier === "champion"); }
    Array.prototype.forEach.call($("tierSeg").children, function (b) {
      b.onclick = function () {
        Array.prototype.forEach.call($("tierSeg").children, function (x) { x.classList.toggle("on", x === b); });
        P.tier = b.dataset.t; syncForce(); P.showToast();
      };
    });
    syncForce();
    $("forceR").onchange = function () { P.forced = this.value === "" ? null : Number(this.value); };
    $("optSound").onchange = function () { S.setEnabled(this.checked); };
    $("optSlow").onchange = function () { P.slow = this.checked; };
    $("optReduced").onchange = function () { setReduced(this.checked); P.showToast(); };
    $("btnReplay").onclick = function () { S.unlock(); P.start(); };
    window.addEventListener("resize", function () { window.FX.resize(); });
    P.showToast();
  };
})();
