// ═══════════════════════════════════════════════════════════════
// Moteur de l'ouverture de coffre v3 (2026-09-16) — porté de prototypes/chest-animations-v3
// (open.js + reveal.js). Impératif et hors React : ChestOpenModal rend le squelette et
// relaie les événements ; ici on anime ses nœuds (refs) en Web Animations API.
//
// Déroulé : chute → 3 taps (la lumière annonce la meilleure rareté) → ouverture → cartes
// face cachée → inspection / Reveal all → récap → Collect. Skip mène au récap à tout moment.
//
// ⚠️ GARDES
// · `gen` : chaque start() l'incrémente, destroy() aussi. Toute attente (sleep, fin
//   d'animation) d'une génération périmée lève STOP. Indispensable en dev : StrictMode
//   monte, démonte et remonte le modal, et la séquence du premier montage ne doit pas
//   continuer sur les nœuds du second.
// · Le résultat réseau peut arriver avant, pendant ou après les taps (S2) : les taps
//   d'avant sont en lumière neutre, et si les 3 sont faits, le coffre « résiste » jusqu'à lui.
// · `easing: linear(…)` lève une TypeError dans animate() sur Safari < 17.2 : détecté, repli
//   cubic-bezier, et animate() est de toute façon enveloppé (une animation ratée ne casse
//   jamais la séquence).
// ═══════════════════════════════════════════════════════════════
import { groupRewards, bestRarity, tellSteps, rarityTier } from "../../lib/chestReveal.js";
import { haptic } from "../../lib/device.js";
import {
  playChestLand, playChestKnock, playChestSting, playChestStrain, playChestRiser, playChestUnlock, playChestOpen,
  playCardFly, playCardLift, playCardFlip, playCardHeartbeat, playCardReveal, playLootTick, playLootCollect,
} from "../../sounds.js";
import { createChestFx } from "../../components/particles.js";
import { tellColor, groupGlow, fmtNum } from "./chestTheme.js";

var STOP = { chestStop: true };
var LINEAR_OK = (function () {
  try { return typeof CSS !== "undefined" && CSS.supports && CSS.supports("animation-timing-function", "linear(0, 1)"); }
  catch (e) { console.warn("[CHEST] CSS.supports:", e && e.message); return false; }
})();
var SPRING = LINEAR_OK
  ? "linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1.004 83.8%, 1)"
  : "cubic-bezier(.34,1.56,.64,1)";
var GOLD_RAIN = ["#ffd65a", "#fff2c0", "#ffb020"];

function tf(q) { return "translate(" + q.x + "px," + q.y + "px) rotate(" + q.r + "deg) scale(" + q.s + ")"; }

// opt = { refs:{stage,area,label,tell,runes,shock,chest,idle,pips,halo,rays,beam,flash,dim,canvas,recap},
//         cardEls (ref d'un tableau), tier (0-3), reduced,
//         ui(patch), showCards(groups), showRecap(model), setError(bool), open(), close() }
export function createChestOpening(opt) {
  var R = opt.refs, tier = opt.tier;
  var gen = 0, alive = false, anims = new Set(), timers = new Set(), fx = null, strain = null, holdTimer = null;
  var st = null;

  function el(name) { return R[name] && R[name].current; }
  function isLive(g) { return alive && g === gen; }
  function later(fn, ms) {
    var id = setTimeout(function () { timers.delete(id); fn(); }, ms);
    timers.add(id);
  }
  function sleep(ms) {
    var g = gen;
    return new Promise(function (res, rej) { later(function () { isLive(g) ? res() : rej(STOP); }, ms); });
  }
  function anim(node, frames, o) {
    if (!node || !node.animate) return null;
    try {
      var a = node.animate(frames, Object.assign({ fill: "forwards" }, o));
      anims.add(a);
      a.finished.then(function () { anims.delete(a); }, function () { anims.delete(a); });
      return a;
    } catch (e) { console.warn("[CHEST] animate:", e && e.message); return null; }
  }
  function done(a) {
    var g = gen;
    if (!a) return isLive(g) ? Promise.resolve() : Promise.reject(STOP);
    return a.finished.then(function () { if (!isLive(g)) throw STOP; }, function () { throw STOP; });
  }
  function swallow(e) { if (e !== STOP) console.warn("[CHEST] sequence:", e && e.message); }
  function geom() {
    var s = el("stage"), W = s ? s.clientWidth : 375, H = s ? s.clientHeight : 700, cy = Math.round(H * 0.5);
    return { W: W, H: H, cy: cy, seamY: cy - 21, mouthY: cy - 28, groundY: cy + 75 };
  }
  function setTell(level) { var s = el("stage"); if (s) s.style.setProperty("--chx-tell", tellColor(level)); }
  function flash(peak, dur) { anim(el("flash"), [{ opacity: 0 }, { opacity: peak, offset: 0.12 }, { opacity: 0 }], { duration: dur, fill: "none" }); }
  function shake(px, dur) {
    anim(el("stage"), [
      { transform: "translate(0,0)" }, { transform: "translate(" + -px + "px," + px * 0.4 + "px)" },
      { transform: "translate(" + px * 0.8 + "px," + -px * 0.5 + "px)" }, { transform: "translate(" + -px * 0.5 + "px," + px * 0.3 + "px)" },
      { transform: "translate(" + px * 0.3 + "px,0)" }, { transform: "translate(0,0)" },
    ], { duration: dur, fill: "none", easing: "ease-out" });
  }
  function fxDo(fn) { if (fx) { try { fn(fx); } catch (e) { console.warn("[CHEST] fx:", e && e.message); } } }
  function stopStrain() { if (strain) { strain.stop(); strain = null; } }

  // ── Résultat réseau (S2) ──
  // Contrat de doOpenChest (f4acc3f) : ok:true = coffre consommé et crédité ; ok:false =
  // RIEN n'a été crédité, le coffre reste en file (sauf error "already_opened"). Sur échec,
  // la séquence s'arrête là : aucune carte ne doit montrer un butin que l'élève n'a pas.
  function setResult(result) {
    if (!st || st.result || !result) return;
    if (result.ok !== true) {
      st.failed = true;
      gen++; // coupe la chute, les taps ou la résistance en cours
      stopStrain();
      opt.ui({ skip: false, chestHint: null, cardsHint: null, cta: null });
      // not_owner (742b82c) : la session n'est pas celle du compte, App affiche déjà le bandeau
      // « Log in again » ; réessayer ne servirait à rien, le message dit de se reconnecter.
      opt.setError(result.error === "already_opened" ? "already_opened" : result.error === "not_owner" ? "session_lost" : "failed");
      return;
    }
    var rewards = result.rewards || [];
    st.result = result;
    st.groups = groupRewards(rewards);
    st.best = bestRarity(rewards);
    st.steps = tellSteps(st.best);
    opt.setError(null);
    if (st.resolve) { st.resolve(); st.resolve = null; }
  }

  function start() {
    gen++; alive = true;
    var g = gen;
    st = { result: null, groups: null, best: -1, steps: null, taps: 0, level: -1, ready: false, opening: false, phase: "chest", inspecting: null, busy: false, cards: null, slots: null, big: null, flipped: null };
    st.resultP = new Promise(function (res) { st.resolve = res; });
    try { fx = el("canvas") ? createChestFx(el("canvas")) : null; } catch (e) { console.warn("[CHEST] fx init:", e && e.message); fx = null; }
    var gm = geom(), s = el("stage");
    if (s) s.style.setProperty("--chx-cy", gm.cy + "px");
    if (el("beam")) el("beam").style.height = gm.mouthY + "px";
    setTell(-1);
    // Au-delà de 15 s sans réponse : message provisoire, retiré si le résultat arrive ensuite
    later(function () { if (isLive(g) && st && !st.result && !st.failed) opt.setError("slow"); }, 15000);
    if (opt.reduced) {
      if (el("chest")) el("chest").style.opacity = "1";
      if (el("label")) el("label").style.opacity = "1";
      opt.ui({ chestHint: { text: "Tap to open" }, skip: false });
      st.ready = true;
      return;
    }
    opt.ui({ skip: true });
    drop(gm).catch(swallow);
  }

  async function drop(gm) {
    anim(el("halo"), [{ opacity: 0 }, { opacity: 0.3 }], { duration: 700 });
    anim(el("label"), [{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "none" }], { duration: 500, delay: 200 });
    var fall = anim(el("chest"), [
      { opacity: 1, transform: "translateY(" + -(gm.cy + 260) + "px) rotate(-7deg)" },
      { opacity: 1, transform: "translateY(0) rotate(0)" },
    ], { duration: 540, delay: 150, easing: "cubic-bezier(.55,0,.9,.4)" });
    await done(fall);
    if (el("chest")) el("chest").style.opacity = "1";
    playChestLand(tier);
    haptic("chestLand");
    fxDo(function (f) {
      f.emit({ x: gm.W / 2, y: gm.groundY, count: 22, kind: "dust", color: ["#7a5a3a", "#5a4028", "#9a7a58"], angle: 0, spread: 85, speed: [0.6, 2.8], gravity: -0.005, drag: 0.96, life: [40, 70], size: [5, 11], jitter: 70, jitterY: 4 });
      if (tier >= 2) f.emit({ x: gm.W / 2, y: gm.groundY, count: 14, color: ["#ffd070", "#fff0c0"], angle: 0, spread: 80, speed: [2, 6], gravity: 0.15, life: [20, 40], size: [1, 2], jitter: 60 });
    });
    anim(el("shock"), [{ opacity: 0.6, transform: "scale(.3)", borderColor: "#c9a45a" }, { opacity: 0, transform: "scale(1.8)", borderColor: "#c9a45a" }], { duration: 650, easing: "cubic-bezier(.2,.8,.3,1)", fill: "none" });
    shake(tier >= 3 ? 8 : 4, 300);
    // Tapable dès l'impact, pas après le rebond : un élève pressé tape pendant la chute
    st.ready = true;
    opt.ui({ chestHint: { text: "Tap to open", sub: "Hold to open at once", pulse: true } });
    anim(el("pips"), [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    anim(el("runes"), [{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
    await done(anim(el("chest"), [{ transform: "scale(1.18,.8) translateY(14px)" }, { transform: "none" }], { duration: 640, easing: SPRING }));
    if (el("idle") && !st.opening) el("idle").classList.add("breathe");
  }

  function showTellLabel(level) {
    var t = el("tell");
    if (!t) return;
    t.textContent = ["Common", "Uncommon", "Rare", "Epic", "Legendary"][level];
    anim(t, [
      { opacity: 0, transform: "scale(.7)" }, { opacity: 1, transform: "scale(1.1)", offset: 0.25 },
      { opacity: 1, transform: "scale(1)", offset: 0.7 }, { opacity: 0, transform: "scale(1)" },
    ], { duration: 1150, fill: "none" });
  }
  function raiseTell(level, gm) {
    if (level <= st.level) return false;
    st.level = level; setTell(level);
    if (level >= 1) {
      playChestSting(level); showTellLabel(level); haptic("chestTell");
      fxDo(function (f) { f.emit({ x: gm.W / 2, y: gm.seamY, count: 16 + level * 8, color: [tellColor(level), "#fff"], angle: 0, spread: 40, speed: [4, 10], gravity: 0.1, life: [30, 55], size: [1.2, 2.6], jitter: 40 }); });
    }
    return true;
  }
  function setLevelClass(n) {
    var c = el("chest");
    if (!c) return;
    c.classList.remove("chx-lvl1", "chx-lvl2", "chx-lvl3");
    c.classList.add("chx-lvl" + n);
  }

  function tap() {
    if (!st || !st.ready || st.opening || st.phase !== "chest") return;
    if (opt.reduced) { reducedOpen().catch(swallow); return; }
    var i = st.taps, gm = geom();
    st.taps++;
    if (st.steps) raiseTell(st.steps[i], gm);
    setLevelClass(st.taps);
    var pips = el("pips");
    if (pips && pips.children[i]) pips.children[i].classList.add("on");
    var runes = el("runes");
    if (runes) {
      runes.classList.add("on" + st.taps);
      Array.prototype.forEach.call(runes.querySelectorAll("path"), function (p, k) { if (k < st.taps * 4) p.classList.add("lit"); });
    }
    playChestKnock(i);
    haptic("chestTap");
    anim(el("chest"), [
      { transform: "none" }, { transform: "scale(1.07,.9) rotate(-4deg)", offset: 0.22 },
      { transform: "scale(.96,1.06) rotate(3.5deg)", offset: 0.5 }, { transform: "scale(1.01,.99) rotate(-1deg)", offset: 0.75 },
      { transform: "none" },
    ], { duration: 380, easing: "ease-out" });
    fxDo(function (f) { f.emit({ x: gm.W / 2, y: gm.seamY, count: 12 + i * 10, color: [tellColor(st.level), "#fff"], angle: 0, spread: 75, speed: [2, 6 + i * 2], gravity: 0.14, life: [22, 45], size: [1, 2.2], jitter: 70 }); });
    anim(el("halo"), [{ opacity: 0.35 + st.taps * 0.15 }], { duration: 300 });
    if (st.taps >= 3) openChest().catch(swallow);
  }
  function holdOpen() {
    if (!st || !st.ready || st.opening || opt.reduced || st.phase !== "chest") return;
    st.taps = 3; setLevelClass(3);
    var pips = el("pips");
    if (pips) Array.prototype.forEach.call(pips.children, function (x) { x.classList.add("on"); });
    playChestKnock(2);
    openChest().catch(swallow);
  }

  async function openChest() {
    st.opening = true;
    var gm = geom(), g = gen;
    opt.ui({ chestHint: null });
    anim(el("pips"), [{ opacity: 0 }], { duration: 250, delay: 150 });

    if (!st.result) {
      // S2 — le coffre résiste tant que le résultat n'est pas là
      opt.ui({ chestHint: { text: "The lock resists…", pulse: true } });
      strain = playChestStrain();
      var shakeA = anim(el("idle"), [
        { transform: "translateX(0)" }, { transform: "translateX(-3px) rotate(-1.5deg)" },
        { transform: "translateX(3px) rotate(1.5deg)" }, { transform: "translateX(0)" },
      ], { duration: 160, iterations: Infinity, fill: "none" });
      // S'arrête seul si le modal est fermé ou Skip pressé pendant l'attente (resultP ne se
      // résoudrait alors peut-être jamais, et le finally ci-dessous ne passerait pas)
      var iv = setInterval(function () {
        if (!isLive(g)) { clearInterval(iv); return; }
        fxDo(function (f) { f.attract({ x: gm.W / 2, y: gm.seamY, r: 150, count: 8, color: ["#ffdca8", "#fff"] }); });
      }, 260);
      try { await st.resultP; } finally { clearInterval(iv); if (shakeA) shakeA.cancel(); stopStrain(); }
      if (!isLive(g)) throw STOP;
      opt.ui({ chestHint: null });
    }

    if (raiseTell(st.steps[2], gm)) await sleep(450);
    var best = st.level, col = tellColor(best), idle = el("idle");
    if (idle) idle.classList.remove("breathe");
    setLevelClass(3);
    function q(sel) { return idle && idle.querySelector(sel); }

    // 1. Charge
    playChestRiser(0.6);
    var charge = anim(el("chest"), [{ transform: "none" }, { transform: "scale(1.12,.86) translateY(10px)" }], { duration: 600, easing: "cubic-bezier(.5,0,1,1)" });
    anim(idle, [{ transform: "translate(0,0)" }, { transform: "translate(-2px,1px)" }, { transform: "translate(2px,-1px)" }, { transform: "translate(0,0)" }], { duration: 70, iterations: 9, fill: "none" });
    fxDo(function (f) { f.attract({ x: gm.W / 2, y: gm.seamY, r: 170, count: 46, color: [col, "#fff"] }); });
    anim(el("halo"), [{ opacity: 0.9 }], { duration: 600 });
    await done(charge);

    // 2. Serrure
    playChestUnlock();
    anim(q(".chx-lock"), [
      { transform: "none", opacity: 1 }, { transform: "translateY(-6px) rotate(-14deg)", opacity: 1, offset: 0.25 },
      { transform: "translate(10px,60px) rotate(70deg)", opacity: 0 },
    ], { duration: 520, easing: "cubic-bezier(.3,0,.8,.6)" });
    await sleep(90);

    // 3. Le couvercle bascule sur ses charnières (il n'explose plus)
    playChestOpen(best);
    haptic(best >= 4 ? "chestOpenLegend" : "chestOpen");
    flash(best >= 4 ? 0.9 : best >= 3 ? 0.7 : 0.5, best >= 4 ? 620 : 420);
    shake(best >= 4 ? 10 : 6, best >= 4 ? 520 : 320);
    anim(el("chest"), [{ transform: "scale(1.12,.86) translateY(10px)" }, { transform: "none" }], { duration: 720, easing: SPRING });
    anim(q(".chx-lid"), [{ transform: "none" }, { transform: "translateY(-12px) scaleY(0)" }], { duration: 190, easing: "cubic-bezier(.5,0,1,1)" });
    anim(q(".chx-lid-int"), [{ transform: "scaleY(0)" }, { transform: "scaleY(1.18)", offset: 0.6 }, { transform: "scaleY(1)" }], { duration: 420, delay: 170, easing: "ease-out", fill: "both" });
    anim(q(".chx-mouth"), [{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: 140 });
    anim(q(".chx-seam"), [{ opacity: 1 }, { opacity: 0 }], { duration: 200, delay: 160 });
    anim(el("beam"), [{ transform: "scaleY(0)", opacity: 1 }, { transform: "scaleY(1)", opacity: 1 }], { duration: 460, delay: 120, easing: "cubic-bezier(.2,.8,.3,1)" });
    anim(el("rays"), [{ opacity: 0, transform: "scale(.6)" }, { opacity: best >= 3 ? 1 : best >= 1 ? 0.75 : 0.5, transform: "scale(1)" }], { duration: 700, delay: 100, easing: "ease-out" });
    anim(el("shock"), [{ opacity: 0.9, transform: "scale(.3)" }, { opacity: 0, transform: "scale(2.4)" }], { duration: 800, delay: 120, easing: "cubic-bezier(.2,.8,.3,1)", fill: "none" });
    anim(el("runes"), [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.6)" }], { duration: 700, delay: 100, easing: "ease-out" });
    anim(el("label"), [{ opacity: 0 }], { duration: 300 });
    await sleep(130);
    fxDo(function (f) {
      f.emit({ x: gm.W / 2, y: gm.mouthY, count: best >= 4 ? 120 : best >= 3 ? 80 : 55, color: [col, "#fff", "#ffe9b0"], angle: 0, spread: 60, speed: [4, 12], gravity: 0.16, drag: 0.975, life: [35, 75], size: [1.2, 2.8], jitter: 60 });
      f.emit({ x: gm.W / 2, y: gm.groundY, count: 16, kind: "dust", color: ["#7a5a3a", "#5a4028"], angle: 0, spread: 88, speed: [0.8, 3], gravity: -0.004, life: [40, 70], size: [6, 12], jitter: 80 });
      if (best >= 4) f.rain({ count: 90, color: GOLD_RAIN });
    });
    if (best >= 4) later(function () { if (isLive(g)) fxDo(function (f) { f.rain({ count: 60, color: GOLD_RAIN }); }); }, 900);
    await sleep(best >= 4 ? 1100 : best >= 3 ? 850 : 650);

    // 4. Les récompenses sortent en cartes
    await burstCards();
  }

  async function reducedOpen() {
    st.opening = true;
    var g = gen;
    await st.resultP;
    if (!isLive(g)) return;
    playChestOpen(st.best);
    showRecap(true);
  }

  // ── Cartes (direction C) ──
  function layout(n, gm) {
    // marge de 36px : les cartes des bords sont inclinées, leurs coins débordent
    var s = Math.min(n <= 3 ? 0.6 : 0.46, (gm.W - 36) / (n * 200 * 0.86 + 200 * 0.14));
    var step = 200 * s * 0.86, y0 = Math.round(gm.H * 0.4), out = [];
    for (var i = 0; i < n; i++) {
      var off = i - (n - 1) / 2;
      out.push({ x: Math.round(off * step), y: Math.round(y0 + off * off * 7), r: off * 6, s: s });
    }
    return out;
  }
  function fanHint() {
    var maxY = Math.max.apply(null, st.slots.map(function (x) { return x.y; }));
    opt.ui({ cardsHint: { text: "Tap a card to reveal", top: Math.round(maxY + 140 * st.slots[0].s + 26) }, cta: "revealAll" });
  }

  async function burstCards() {
    var gm = geom(), g = gen, n = st.groups.length;
    st.slots = layout(n, gm);
    st.big = { x: 0, y: Math.round(gm.H * 0.45), r: 0, s: Math.min(1.25, (gm.H * 0.56) / 280, (gm.W - 48) / 200) };
    st.flipped = st.groups.map(function () { return false; });
    st.cardsP = new Promise(function (res) { st.cardsResolve = res; });
    opt.showCards(st.groups);
    await st.cardsP;
    if (!isLive(g)) throw STOP;
    st.cards = (opt.cardEls.current || []).slice(0, n);

    anim(el("area"), [{ transform: "none", opacity: 1 }, { transform: "translateY(" + Math.round(gm.H * 0.22) + "px) scale(.5)", opacity: 0.3 }], { duration: 750, delay: 250, easing: "cubic-bezier(.4,0,.2,1)" });
    anim(el("beam"), [{ opacity: 0, transform: "scaleY(1)" }], { duration: 600, delay: 300 });
    anim(el("halo"), [{ opacity: 0.25 }], { duration: 800 });
    anim(el("rays"), [{ opacity: 0.45, transform: "translateY(" + -Math.round(gm.H * 0.1) + "px)" }], { duration: 900, easing: "ease-out" });
    st.cards.forEach(function (card, i) {
      var slot = st.slots[i];
      // Point de départ déterministe (pas de hasard au rendu) : alternance gauche/droite
      var start = { x: (i % 2 ? 12 : -12), y: gm.mouthY, r: (i % 2 ? 18 : -18), s: 0.12 };
      var mid = { x: Math.round(slot.x * 0.55), y: Math.round(Math.min(slot.y, gm.mouthY) - gm.H * 0.16), r: slot.r * 3 + (i % 2 ? 15 : -15), s: slot.s * 1.15 };
      anim(card, [{ opacity: 0, transform: tf(start) }, { opacity: 1, transform: tf(mid), offset: 0.5 }, { opacity: 1, transform: tf(slot) }], { duration: 680, delay: i * 120, easing: "cubic-bezier(.25,.8,.35,1)" });
      later(function () { if (isLive(g)) playCardFly(i); }, i * 120);
      later(function () {
        if (isLive(g)) fxDo(function (f) { f.emit({ x: gm.W / 2 + slot.x, y: slot.y, count: 10, color: [groupGlow(st.groups[i]), "#fff"], spread: 180, speed: [1, 3], life: [18, 30], size: [1, 2] }); });
      }, i * 120 + 620);
    });
    await sleep(n * 120 + 700);
    st.phase = "cards";
    fanHint();
  }
  function cardsMounted() { if (st && st.cardsResolve) { st.cardsResolve(); st.cardsResolve = null; } }

  function activateCard(i) {
    if (!st || st.phase !== "cards" || st.busy) return;
    if (st.inspecting !== null) { closeCard().catch(swallow); return; }
    inspect(i).catch(swallow);
  }

  async function inspect(i) {
    var gm = geom(), card = st.cards[i], grp = st.groups[i], r = grp.rarity;
    if (!card) return;
    st.busy = true; st.inspecting = i;
    opt.ui({ cardsHint: null, cta: null });
    card.classList.add("inspect");
    var dim = el("dim");
    if (dim) dim.classList.add("on");
    anim(dim, [{ opacity: 1 }], { duration: 300 });
    playCardLift();
    await done(anim(card, [{ transform: tf(st.slots[i]) }, { transform: tf(st.big) }], { duration: 420, easing: "cubic-bezier(.2,.9,.3,1.12)" }));
    if (!st.flipped[i]) {
      card.classList.remove("pulse");
      if (r >= 3) {
        // Anticipation : battement de cœur, la carte tremble et aspire la lumière
        playCardHeartbeat(); haptic("cardLegend");
        fxDo(function (f) { f.attract({ x: gm.W / 2, y: st.big.y, r: 190, count: r >= 4 ? 50 : 30, color: [groupGlow(grp), "#fff"] }); });
        if (r >= 4) {
          setTell(4);
          anim(el("rays"), [{ opacity: 0.95, transform: "translateY(" + -Math.round(gm.H * 0.05) + "px) scale(1.1)" }], { duration: 700 });
        }
        await done(anim(card.querySelector(".chx-tilt"), [
          { transform: "rotate(0)" }, { transform: "rotate(-2.5deg) scale(1.02)" }, { transform: "rotate(2.5deg) scale(1.03)" }, { transform: "rotate(0) scale(1)" },
        ], { duration: 140, iterations: r >= 4 ? 6 : 4, fill: "none" }));
      }
      await flip(i, true);
      st.flipped[i] = true;
    }
    if (r >= 3) card.dataset.holo = "1";
    st.busy = false;
    opt.ui({ cardsHint: { text: "Tap to continue", top: Math.min(gm.H - 40, Math.round(st.big.y + 140 * st.big.s + 22)) } });
  }

  async function flip(i, big) {
    var gm = geom(), card = st.cards[i], grp = st.groups[i], r = grp.rarity, g = gen;
    var inner = card && card.querySelector(".chx-inner"), col = groupGlow(grp);
    var cx = gm.W / 2 + (big ? 0 : st.slots[i].x), cy = big ? st.big.y : st.slots[i].y;
    playCardFlip();
    var fa = anim(inner, [{ transform: "rotateY(0)" }, { transform: "rotateY(180deg)" }], { duration: big ? 560 : 380, easing: "cubic-bezier(.45,.05,.25,1)" });
    await sleep(big ? 250 : 170);
    if (big) {
      playCardReveal(r);
      if (r >= 3) haptic("cardLegend");
      fxDo(function (f) { f.emit({ x: cx, y: cy, count: r === null ? 26 : [18, 26, 40, 70, 120][r], color: [col, "#fff"], spread: 180, speed: [2, 9], gravity: 0.08, life: [28, 60], size: [1, 2.6] }); });
      if (r >= 4) { flash(0.75, 520); shake(8, 420); fxDo(function (f) { f.rain({ count: 80, color: GOLD_RAIN }); }); }
      else if (r === 3) flash(0.35, 380);
    } else {
      fxDo(function (f) { f.emit({ x: cx, y: cy, count: 12, color: [col, "#fff"], spread: 180, speed: [1, 4], life: [18, 32], size: [1, 2] }); });
    }
    await done(fa);
    if (!isLive(g)) throw STOP;
    if (grp.kind === "currencies") { if (big) countUp(card); else settleCounts(card); }
  }

  // Les montants défilent avec un tic par palier
  function countUp(card) {
    var g = gen;
    Array.prototype.forEach.call(card.querySelectorAll(".chx-cnt"), function (span) {
      var to = Number(span.dataset.to), t0 = performance.now(), dur = 900;
      (function step(now) {
        if (!isLive(g)) return;
        var k = Math.min(1, (now - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 3))), txt = "+" + fmtNum(v);
        if (span.textContent !== txt) { span.textContent = txt; if (k < 1) playLootTick(); }
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }
  function settleCounts(card) {
    Array.prototype.forEach.call(card.querySelectorAll(".chx-cnt"), function (s) { s.textContent = "+" + fmtNum(Number(s.dataset.to)); });
  }
  function resetTilt(card) {
    var t = card.querySelector(".chx-tilt");
    if (t) { t.style.removeProperty("--chx-rx"); t.style.removeProperty("--chx-ry"); }
    card.classList.remove("chx-tracking");
  }

  async function closeCard() {
    var i = st.inspecting;
    if (i === null || st.busy) return;
    st.busy = true;
    var card = st.cards[i], gm = geom();
    settleCounts(card);
    delete card.dataset.holo;
    resetTilt(card);
    opt.ui({ cardsHint: null });
    anim(el("dim"), [{ opacity: 0 }], { duration: 300 });
    if (el("dim")) el("dim").classList.remove("on");
    if (st.groups[i].rarity >= 4) anim(el("rays"), [{ opacity: 0.45, transform: "translateY(" + -Math.round(gm.H * 0.1) + "px)" }], { duration: 600 });
    await done(anim(card, [{ transform: tf(st.big) }, { transform: tf(st.slots[i]) }], { duration: 360, easing: "cubic-bezier(.4,0,.2,1)" }));
    card.classList.remove("inspect");
    st.inspecting = null; st.busy = false;
    if (st.flipped.every(Boolean)) { await sleep(350); showRecap(false); }
    else fanHint();
  }

  // S5 — tout se retourne en place, un seul son de révélation
  async function revealAll() {
    if (!st || st.phase !== "cards" || st.busy || st.inspecting !== null) return;
    st.busy = true;
    opt.ui({ cta: null, cardsHint: null });
    var maxR = -1;
    for (var i = 0; i < st.cards.length; i++) {
      if (st.flipped[i]) continue;
      var r = st.groups[i].rarity;
      if (r !== null && r > maxR) maxR = r;
      st.cards[i].classList.remove("pulse");
      flip(i, false).catch(swallow);
      st.flipped[i] = true;
      await sleep(160);
    }
    playCardReveal(maxR < 0 ? null : maxR);
    await sleep(750);
    st.busy = false;
    showRecap(false);
  }

  // S5 — récap : le meilleur objet en vedette, puis les autres objets rares, puis le reste
  function showRecap(instant) {
    if (!st || st.phase === "recap") return;
    var gm = geom(), d = function (ms) { return instant ? 1 : ms; };
    st.phase = "recap"; st.recapInstant = instant;
    opt.ui({ skip: false, cta: null, cardsHint: null, chestHint: null });
    if (el("dim")) el("dim").classList.remove("on");
    (st.cards || []).forEach(function (card, i) {
      anim(card, [{ opacity: 0, transform: tf({ x: Math.round(st.slots[i].x * 0.6), y: Math.round(gm.H * 0.3), r: 0, s: 0.1 }) }], { duration: d(380), delay: instant ? 0 : i * 40, easing: "cubic-bezier(.5,0,.8,.4)" });
    });
    anim(el("area"), [{ opacity: 0 }], { duration: d(400) });
    anim(el("beam"), [{ opacity: 0 }], { duration: d(200) });
    anim(el("rays"), [{ opacity: instant ? 0 : 0.3, transform: "translateY(" + -Math.round(gm.H * 0.25) + "px)" }], { duration: d(600) });
    var items = [];
    (st.groups || []).forEach(function (grp) { grp.items.forEach(function (it) { items.push(it); }); });
    var rare = items.filter(function (it) { return rarityTier(it.rarity) >= 0; })
      .sort(function (a, b) { return rarityTier(b.rarity) - rarityTier(a.rarity); });
    var rest = rare.slice(1).concat(items.filter(function (it) { return rarityTier(it.rarity) < 0; }));
    opt.showRecap({ featured: rare[0] || null, rest: rest, total: items.length });
  }
  function recapMounted() {
    var root = el("recap");
    if (!root || !st) return;
    var instant = st.recapInstant, g = gen, d = function (ms) { return instant ? 1 : ms; };
    anim(root.querySelector("h2"), [{ opacity: 0, transform: "translateY(-10px)" }, { opacity: 1, transform: "none" }], { duration: d(400), fill: "both" });
    anim(root.querySelector(".sub"), [{ opacity: 0 }, { opacity: 1 }], { duration: d(400), delay: instant ? 0 : 120, fill: "both" });
    var tiles = root.querySelectorAll(".chx-tile");
    Array.prototype.forEach.call(tiles, function (t, i) {
      anim(t, [{ opacity: 0, transform: "translateY(18px) scale(.85)" }, { opacity: 1, transform: "none" }], { duration: d(560), delay: instant ? 0 : 220 + i * 70, easing: instant ? "linear" : SPRING, fill: "both" });
      if (!instant) later(function () { if (isLive(g)) playLootTick(); }, 220 + i * 70);
    });
    later(function () { if (isLive(g)) opt.ui({ cta: "collect" }); }, instant ? 0 : 220 + tiles.length * 70 + 200);
  }

  async function collect() {
    var root = el("recap"), gm = geom();
    if (!root || st.collecting) return;
    st.collecting = true;
    playLootCollect(); haptic("lootCollect");
    opt.ui({ cta: null });
    var tiles = root.querySelectorAll(".chx-tile");
    Array.prototype.forEach.call(tiles, function (t, i) {
      anim(t, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-70px) scale(.6)" }], { duration: 380, delay: i * 45, easing: "cubic-bezier(.5,0,.8,.4)" });
    });
    anim(root.querySelector("h2"), [{ opacity: 0 }], { duration: 300 });
    anim(root.querySelector(".sub"), [{ opacity: 0 }], { duration: 300 });
    fxDo(function (f) { f.emit({ x: gm.W / 2, y: gm.H * 0.45, count: 50, color: ["#ffd65a", "#fff"], angle: 0, spread: 50, speed: [3, 10], gravity: 0.05, life: [30, 60], size: [1, 2.4], jitter: 120, jitterY: 80 }); });
    anim(el("rays"), [{ opacity: 0 }], { duration: 500 });
    anim(el("halo"), [{ opacity: 0 }], { duration: 500 });
    await sleep(tiles.length * 45 + 600);
    opt.close();
  }

  // S5 — Skip : droit au récap, dès que le résultat est là
  function skip() {
    if (!st || st.phase === "recap") return;
    gen++; // coupe toute séquence en cours
    stopStrain();
    anims.forEach(function (a) { try { a.cancel(); } catch (e) { console.warn("[CHEST] cancel:", e && e.message); } });
    anims.clear();
    fxDo(function (f) { f.clear(); });
    if (el("dim")) el("dim").classList.remove("on");
    st.phase = "skipping"; st.inspecting = null; st.busy = true;
    opt.ui({ skip: false, cta: null, cardsHint: null, chestHint: null });
    var g = gen;
    st.resultP.then(function () {
      if (!isLive(g)) return;
      st.level = st.best; setTell(st.best);
      playCardReveal(st.best < 0 ? null : st.best);
      st.phase = "cards"; // showRecap refuse une phase déjà « recap »
      showRecap(false);
    });
  }

  // Reflet holographique qui suit le doigt (Epic / Legendary inspectées)
  function cardPointerMove(i, e) {
    if (!st || st.inspecting !== i) return;
    var card = st.cards && st.cards[i];
    if (!card || card.dataset.holo !== "1") return;
    var rect = card.getBoundingClientRect();
    var px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    var py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    var t = card.querySelector(".chx-tilt"), front = card.querySelector(".chx-front");
    if (t) { t.style.setProperty("--chx-ry", ((px - 0.5) * 22).toFixed(1) + "deg"); t.style.setProperty("--chx-rx", ((0.5 - py) * 18).toFixed(1) + "deg"); }
    if (front) {
      front.style.setProperty("--chx-mx", (px * 100).toFixed(0) + "%");
      front.style.setProperty("--chx-my", (py * 100).toFixed(0) + "%");
      front.style.setProperty("--chx-hx", (px * 100).toFixed(0) + "%");
    }
    card.classList.add("chx-tracking");
  }
  function cardPointerLeave(i) { var card = st && st.cards && st.cards[i]; if (card) resetTilt(card); }

  function pointerDown() {
    clearTimeout(holdTimer);
    holdTimer = setTimeout(function () { holdTimer = null; holdOpen(); }, 480);
  }
  function pointerUp() { if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; tap(); } }
  function pointerCancel() { clearTimeout(holdTimer); holdTimer = null; }
  function escape() { if (st && st.inspecting !== null) closeCard().catch(swallow); }
  function dimClick() { if (st && st.inspecting !== null) closeCard().catch(swallow); }

  function destroy() {
    alive = false; gen++;
    clearTimeout(holdTimer); holdTimer = null;
    timers.forEach(function (id) { clearTimeout(id); }); timers.clear();
    stopStrain();
    anims.forEach(function (a) { try { a.cancel(); } catch (e) { console.warn("[CHEST] cancel:", e && e.message); } });
    anims.clear();
    if (fx) { fx.destroy(); fx = null; }
  }

  return {
    start: start, setResult: setResult, destroy: destroy,
    tap: tap, pointerDown: pointerDown, pointerUp: pointerUp, pointerCancel: pointerCancel,
    cardsMounted: cardsMounted, activateCard: activateCard, cardPointerMove: cardPointerMove, cardPointerLeave: cardPointerLeave,
    dimClick: dimClick, escape: escape, revealAll: function () { revealAll().catch(swallow); },
    recapMounted: recapMounted, collect: function () { collect().catch(swallow); }, skip: skip,
  };
}
