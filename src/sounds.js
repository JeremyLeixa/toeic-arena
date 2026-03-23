// ═══════════════════════════════════════════════════════════
// src/sounds.js — TOEIC Arena Sound Identity
// 4 UI sounds synthesized via Web Audio API (zero external files)
// ═══════════════════════════════════════════════════════════

var audioCtx = null;

function isMuted() {
  try { return localStorage.getItem("toeic-sound") === "off"; } catch (e) { return false; }
}

export function setSoundEnabled(on) {
  try { localStorage.setItem("toeic-sound", on ? "on" : "off"); } catch (e) {}
}

export function isSoundEnabled() {
  try { return localStorage.getItem("toeic-sound") !== "off"; } catch (e) { return true; }
}

function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// ── playCorrect — bright rising 2-tone chime ──
export function playCorrect() {
  if(isMuted())return;
  try {
    var c = ctx();
    var t = c.currentTime;

    // Note 1: E5 (659 Hz)
    var o1 = c.createOscillator();
    var g1 = c.createGain();
    o1.type = "sine";
    o1.frequency.setValueAtTime(659, t);
    g1.gain.setValueAtTime(0.18, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o1.connect(g1);
    g1.connect(c.destination);
    o1.start(t);
    o1.stop(t + 0.15);

    // Note 2: G5 (784 Hz) — slight delay for that "ding-ding" feel
    var o2 = c.createOscillator();
    var g2 = c.createGain();
    o2.type = "sine";
    o2.frequency.setValueAtTime(784, t + 0.1);
    g2.gain.setValueAtTime(0, t);
    g2.gain.setValueAtTime(0.22, t + 0.1);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o2.connect(g2);
    g2.connect(c.destination);
    o2.start(t + 0.1);
    o2.stop(t + 0.35);
  } catch (e) { /* silent fail on unsupported browsers */ }
}

// ── playWrong — low descending buzz ──
export function playWrong() {
  if(isMuted())return;
  try {
    var c = ctx();
    var t = c.currentTime;

    var o = c.createOscillator();
    var g = c.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(280, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.25);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + 0.3);
  } catch (e) { /* silent */ }
}

// ── playXP — satisfying "coin collect" sparkle ──
export function playXP() {
  if(isMuted())return;
  try {
    var c = ctx();
    var t = c.currentTime;

    // Quick 3-note ascending arpeggio: C6 → E6 → G6
    var notes = [1047, 1319, 1568];
    notes.forEach(function (freq, i) {
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(freq, t + i * 0.06);
      g.gain.setValueAtTime(0, t);
      g.gain.setValueAtTime(0.14, t + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.12);
      o.connect(g);
      g.connect(c.destination);
      o.start(t + i * 0.06);
      o.stop(t + i * 0.06 + 0.12);
    });
  } catch (e) { /* silent */ }
}

// ── playLevelUp — triumphant fanfare (achievement / league / level) ──
export function playLevelUp() {
  if(isMuted())return;
  try {
    var c = ctx();
    var t = c.currentTime;

    // 4-note major fanfare: C5 → E5 → G5 → C6, with sustain
    var notes = [523, 659, 784, 1047];
    var durations = [0.12, 0.12, 0.12, 0.4];

    var offset = 0;
    notes.forEach(function (freq, i) {
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = i < 3 ? "triangle" : "sine";
      o.frequency.setValueAtTime(freq, t + offset);
      g.gain.setValueAtTime(0, t);
      g.gain.setValueAtTime(0.16, t + offset);
      g.gain.exponentialRampToValueAtTime(0.001, t + offset + durations[i]);
      o.connect(g);
      g.connect(c.destination);
      o.start(t + offset);
      o.stop(t + offset + durations[i] + 0.05);
      offset += durations[i] * 0.7; // slight overlap for richness
    });
  } catch (e) { /* silent */ }
}
