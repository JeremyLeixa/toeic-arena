// ═══════════════════════════════════════════════════════════
// src/sounds.js — TOEIC Arena Sound Identity v2.0
// Medieval Fantasy sonic palette — Web Audio API (zero files)
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

// ─── UTILITY: simulated reverb via parallel delays ───
function addReverb(c, source, wetGain, delays) {
  var dry = c.createGain();
  dry.gain.value = 1;
  source.connect(dry);
  dry.connect(c.destination);
  
  (delays || [0.03, 0.07, 0.12, 0.18]).forEach(function(d) {
    var delay = c.createDelay();
    delay.delayTime.value = d;
    var g = c.createGain();
    g.gain.value = wetGain || 0.15;
    source.connect(delay);
    delay.connect(g);
    g.connect(c.destination);
  });
}

// ─── UTILITY: brass-like tone (sawtooth + low-pass filter) ───
function brass(c, freq, start, dur, vol) {
  // Layer 1: fundamental (sawtooth filtered)
  var o1 = c.createOscillator();
  var f1 = c.createBiquadFilter();
  var g1 = c.createGain();
  o1.type = "sawtooth";
  o1.frequency.setValueAtTime(freq, start);
  f1.type = "lowpass";
  f1.frequency.setValueAtTime(800, start);
  f1.frequency.linearRampToValueAtTime(2000, start + 0.08); // attack brightness
  f1.frequency.linearRampToValueAtTime(1200, start + dur * 0.6);
  f1.Q.value = 2;
  g1.gain.setValueAtTime(0, start);
  g1.gain.linearRampToValueAtTime(vol || 0.18, start + 0.05);
  g1.gain.setValueAtTime(vol || 0.18, start + dur * 0.7);
  g1.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o1.connect(f1);
  f1.connect(g1);
  
  // Layer 2: octave undertone for body
  var o2 = c.createOscillator();
  var g2 = c.createGain();
  o2.type = "triangle";
  o2.frequency.setValueAtTime(freq * 0.5, start);
  g2.gain.setValueAtTime(0, start);
  g2.gain.linearRampToValueAtTime((vol || 0.18) * 0.4, start + 0.05);
  g2.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o2.connect(g2);
  
  // Layer 3: slight detuned oscillator for richness
  var o3 = c.createOscillator();
  var f3 = c.createBiquadFilter();
  var g3 = c.createGain();
  o3.type = "sawtooth";
  o3.frequency.setValueAtTime(freq * 1.003, start); // 3 cents sharp
  f3.type = "lowpass";
  f3.frequency.setValueAtTime(1000, start);
  f3.Q.value = 1;
  g3.gain.setValueAtTime(0, start);
  g3.gain.linearRampToValueAtTime((vol || 0.18) * 0.3, start + 0.06);
  g3.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o3.connect(f3);
  f3.connect(g3);
  
  // Mix to a single output node
  var mix = c.createGain();
  mix.gain.value = 1;
  g1.connect(mix);
  g2.connect(mix);
  g3.connect(mix);
  
  o1.start(start); o1.stop(start + dur + 0.1);
  o2.start(start); o2.stop(start + dur + 0.1);
  o3.start(start); o3.stop(start + dur + 0.1);
  
  return mix;
}

// ─── UTILITY: string-like pad tone ───
function stringPad(c, freq, start, dur, vol) {
  var o1 = c.createOscillator();
  var o2 = c.createOscillator();
  var f = c.createBiquadFilter();
  var g = c.createGain();
  o1.type = "sawtooth";
  o1.frequency.setValueAtTime(freq, start);
  o2.type = "sawtooth";
  o2.frequency.setValueAtTime(freq * 1.005, start); // detune for chorus
  f.type = "lowpass";
  f.frequency.setValueAtTime(1500, start);
  f.Q.value = 0.5;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol || 0.1, start + dur * 0.3);
  g.gain.setValueAtTime(vol || 0.1, start + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o1.connect(f); o2.connect(f);
  f.connect(g);
  o1.start(start); o1.stop(start + dur + 0.1);
  o2.start(start); o2.stop(start + dur + 0.1);
  return g;
}

// ─── UTILITY: harp/chime pluck ───
function harpNote(c, freq, start, dur, vol) {
  var o = c.createOscillator();
  var g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(vol || 0.2, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + (dur || 0.4));
  
  // Add a harmonic for shimmer
  var o2 = c.createOscillator();
  var g2 = c.createGain();
  o2.type = "sine";
  o2.frequency.setValueAtTime(freq * 2, start);
  g2.gain.setValueAtTime((vol || 0.2) * 0.3, start);
  g2.gain.exponentialRampToValueAtTime(0.001, start + (dur || 0.4) * 0.6);
  
  var mix = c.createGain();
  mix.gain.value = 1;
  o.connect(g); g.connect(mix);
  o2.connect(g2); g2.connect(mix);
  o.start(start); o.stop(start + (dur || 0.4) + 0.1);
  o2.start(start); o2.stop(start + (dur || 0.4) + 0.1);
  return mix;
}

// ─── UTILITY: drum hit (noise burst + sine thump) ───
function drumHit(c, start, vol, pitch) {
  // Noise burst
  var bufSize = c.sampleRate * 0.08;
  var buf = c.createBuffer(1, bufSize, c.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  var noise = c.createBufferSource();
  noise.buffer = buf;
  var nf = c.createBiquadFilter();
  nf.type = "lowpass";
  nf.frequency.value = pitch || 200;
  var ng = c.createGain();
  ng.gain.setValueAtTime(vol || 0.15, start);
  ng.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
  noise.connect(nf); nf.connect(ng);
  noise.start(start); noise.stop(start + 0.15);
  
  // Sine thump
  var o = c.createOscillator();
  var g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(pitch || 80, start);
  o.frequency.exponentialRampToValueAtTime(40, start + 0.1);
  g.gain.setValueAtTime((vol || 0.15) * 1.2, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
  o.connect(g);
  o.start(start); o.stop(start + 0.2);
  
  var mix = c.createGain();
  mix.gain.value = 1;
  ng.connect(mix); g.connect(mix);
  return mix;
}


// ═══════════════════════════════════════════════════════════
// ★ SONIC LOGO — The Arena Call (3 horn notes, ~2s)
// ═══════════════════════════════════════════════════════════

export function playArenaCall() {
  if (isMuted()) return;
  try {
    var c = ctx();
    var t = c.currentTime;
    
    // Three ascending horn notes: D4 → F4 → A4 (D minor triad, heroic)
    var notes = [293.66, 349.23, 440.00];
    var starts = [0, 0.55, 1.1];
    var durs = [0.5, 0.5, 0.9]; // last note sustains longer
    var vols = [0.16, 0.19, 0.22]; // crescendo

    notes.forEach(function(freq, i) {
      var horn = brass(c, freq, t + starts[i], durs[i], vols[i]);
      addReverb(c, horn, 0.12, [0.04, 0.09, 0.16, 0.25]);
    });
    
    // Subtle string swell under the last note
    var pad = stringPad(c, 293.66, t + 1.1, 1.0, 0.06); // D4
    pad.connect(c.destination);
    var pad2 = stringPad(c, 220.00, t + 1.1, 1.0, 0.05); // A3
    pad2.connect(c.destination);
  } catch (e) {}
}


// ═══════════════════════════════════════════════════════════
// SFX — Micro-interactions
// ═══════════════════════════════════════════════════════════

// ── playCorrect — warm chime with harmonic shimmer ──
export function playCorrect() {
  if (isMuted()) return;
  try {
    var c = ctx();
    var t = c.currentTime;

    // Note 1: E5
    var h1 = harpNote(c, 659, t, 0.25, 0.2);
    h1.connect(c.destination);
    
    // Note 2: B5 (brighter, more resolved)
    var h2 = harpNote(c, 988, t + 0.1, 0.35, 0.22);
    addReverb(c, h2, 0.1, [0.03, 0.06]);
  } catch (e) {}
}

// ── playWrong — low muted thud + minor dissonance ──
export function playWrong() {
  if (isMuted()) return;
  try {
    var c = ctx();
    var t = c.currentTime;

    // Dull thud
    var d = drumHit(c, t, 0.1, 120);
    d.connect(c.destination);
    
    // Minor 2nd dissonance: Bb3 + B3
    var o1 = c.createOscillator();
    var g1 = c.createGain();
    o1.type = "triangle";
    o1.frequency.setValueAtTime(233, t);
    g1.gain.setValueAtTime(0.08, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o1.connect(g1); g1.connect(c.destination);
    o1.start(t); o1.stop(t + 0.35);
    
    var o2 = c.createOscillator();
    var g2 = c.createGain();
    o2.type = "triangle";
    o2.frequency.setValueAtTime(247, t);
    g2.gain.setValueAtTime(0.07, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o2.connect(g2); g2.connect(c.destination);
    o2.start(t); o2.stop(t + 0.3);
  } catch (e) {}
}

// ── playXP — treasure sparkle (harp arpeggio ascending) ──
export function playXP() {
  if (isMuted()) return;
  try {
    var c = ctx();
    var t = c.currentTime;

    // Quick harp arpeggio: C6 → E6 → G6 → C7
    var notes = [1047, 1319, 1568, 2093];
    notes.forEach(function(freq, i) {
      var h = harpNote(c, freq, t + i * 0.055, 0.2, 0.13);
      addReverb(c, h, 0.08, [0.02, 0.05]);
    });
  } catch (e) {}
}

// ── playLevelUp — triumphant brass fanfare ──
export function playLevelUp() {
  if (isMuted()) return;
  try {
    var c = ctx();
    var t = c.currentTime;

    // 4-note brass fanfare: C5 → E5 → G5 → C6
    var notes = [523, 659, 784, 1047];
    var durs = [0.18, 0.18, 0.18, 0.6];
    var offset = 0;
    
    notes.forEach(function(freq, i) {
      var horn = brass(c, freq, t + offset, durs[i], i < 3 ? 0.12 : 0.16);
      addReverb(c, horn, 0.1, [0.03, 0.08, 0.14]);
      offset += durs[i] * 0.75;
    });
    
    // String swell under last note
    var pad = stringPad(c, 523, t + offset - 0.15, 0.7, 0.06);
    pad.connect(c.destination);
  } catch (e) {}
}

// ── playCombo — quick ascending power chime ──
export function playCombo() {
  if (isMuted()) return;
  try {
    var c = ctx();
    var t = c.currentTime;

    // Fast 3-note power arpeggio with increasing brightness
    var notes = [784, 988, 1319]; // G5 → B5 → E6
    notes.forEach(function(freq, i) {
      var h = harpNote(c, freq, t + i * 0.04, 0.15, 0.12 + i * 0.03);
      h.connect(c.destination);
    });
  } catch (e) {}
}

// ── playStreak — flame whoosh + power tone ──
export function playStreak() {
  if (isMuted()) return;
  try {
    var c = ctx();
    var t = c.currentTime;

    // Noise whoosh (rising filter)
    var bufSize = c.sampleRate * 0.3;
    var buf = c.createBuffer(1, bufSize, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    var noise = c.createBufferSource();
    noise.buffer = buf;
    var f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(3000, t + 0.2);
    f.Q.value = 3;
    var g = c.createGain();
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    noise.connect(f); f.connect(g); g.connect(c.destination);
    noise.start(t); noise.stop(t + 0.35);

    // Bright tone at the peak
    var h = harpNote(c, 1568, t + 0.12, 0.3, 0.15); // G6
    addReverb(c, h, 0.1, [0.03, 0.07]);
  } catch (e) {}
}

// ── playTimer — urgent warning pulse ──
export function playTimer() {
  if (isMuted()) return;
  try {
    var c = ctx();
    var t = c.currentTime;

    // Two quick low brass stabs
    [0, 0.2].forEach(function(offset) {
      var o = c.createOscillator();
      var f = c.createBiquadFilter();
      var g = c.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(220, t + offset); // A3
      f.type = "lowpass";
      f.frequency.value = 600;
      g.gain.setValueAtTime(0.12, t + offset);
      g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.12);
      o.connect(f); f.connect(g); g.connect(c.destination);
      o.start(t + offset); o.stop(t + offset + 0.15);
    });
  } catch (e) {}
}

// ── playClick — soft lute pluck ──
export function playClick() {
  if (isMuted()) return;
  try {
    var c = ctx();
    var t = c.currentTime;

    var o = c.createOscillator();
    var g = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(880, t); // A5
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + 0.1);
    
    // Tiny body resonance
    var o2 = c.createOscillator();
    var g2 = c.createGain();
    o2.type = "sine";
    o2.frequency.setValueAtTime(440, t);
    g2.gain.setValueAtTime(0.04, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    o2.connect(g2); g2.connect(c.destination);
    o2.start(t); o2.stop(t + 0.08);
  } catch (e) {}
}


// ═══════════════════════════════════════════════════════════
// JINGLES — 3-5 second melodic moments
// ═══════════════════════════════════════════════════════════

// ── playJingleAchieve — knight's reward (horn + harp + strings) ~4s ──
export function playJingleAchieve() {
  if (isMuted()) return;
  try {
    var c = ctx();
    var t = c.currentTime;

    // Horn melody: G4 → B4 → D5 → G5 (ascending G major)
    var notes = [392, 494, 587, 784];
    var starts = [0, 0.25, 0.5, 0.8];
    var durs = [0.25, 0.25, 0.3, 0.9];

    notes.forEach(function(freq, i) {
      var horn = brass(c, freq, t + starts[i], durs[i], 0.13);
      addReverb(c, horn, 0.1, [0.04, 0.1, 0.18]);
    });

    // Harp sparkle at the end
    var sparkle = [1568, 1976, 2349]; // G6, B6, D7
    sparkle.forEach(function(freq, i) {
      var h = harpNote(c, freq, t + 1.5 + i * 0.08, 0.5, 0.08);
      h.connect(c.destination);
    });

    // String pad under the climax
    var pad = stringPad(c, 392, t + 0.8, 1.5, 0.07); // G4
    pad.connect(c.destination);
    var pad2 = stringPad(c, 294, t + 0.8, 1.5, 0.05); // D4
    pad2.connect(c.destination);
  } catch (e) {}
}

// ── playJingleLeague — tournament promotion (~5s) ──
export function playJingleLeague() {
  if (isMuted()) return;
  try {
    var c = ctx();
    var t = c.currentTime;

    // Timpani hit to open
    var d = drumHit(c, t, 0.18, 80);
    d.connect(c.destination);

    // Rising brass: D4 → F#4 → A4 → D5 (D major, heroic)
    var notes = [294, 370, 440, 587];
    var starts = [0.15, 0.55, 0.95, 1.35];
    var durs = [0.4, 0.4, 0.4, 1.2];

    notes.forEach(function(freq, i) {
      var horn = brass(c, freq, t + starts[i], durs[i], 0.1 + i * 0.025);
      addReverb(c, horn, 0.12, [0.05, 0.12, 0.22]);
    });

    // Full string chord at climax: D4 + F#4 + A4
    [294, 370, 440].forEach(function(freq) {
      var pad = stringPad(c, freq, t + 1.35, 1.5, 0.06);
      pad.connect(c.destination);
    });

    // Second timpani at resolution
    var d2 = drumHit(c, t + 1.35, 0.12, 80);
    d2.connect(c.destination);
  } catch (e) {}
}

// ── playJingleMock — quest complete, good score (~4s) ──
export function playJingleMock() {
  if (isMuted()) return;
  try {
    var c = ctx();
    var t = c.currentTime;

    // Warm melody: flute-like (triangle wave)
    var notes = [587, 659, 784, 1047]; // D5 → E5 → G5 → C6
    var starts = [0, 0.3, 0.6, 1.0];
    var durs = [0.3, 0.3, 0.4, 1.0];

    notes.forEach(function(freq, i) {
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(freq, t + starts[i]);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.14, t + starts[i] + 0.04);
      g.gain.setValueAtTime(0.14, t + starts[i] + durs[i] * 0.6);
      g.gain.exponentialRampToValueAtTime(0.001, t + starts[i] + durs[i]);
      o.connect(g);
      addReverb(c, g, 0.12, [0.04, 0.1, 0.18]);
      o.start(t + starts[i]);
      o.stop(t + starts[i] + durs[i] + 0.2);
    });

    // Gentle harp close
    var h = harpNote(c, 1047, t + 1.8, 0.6, 0.1);
    addReverb(c, h, 0.1, [0.05, 0.12]);
  } catch (e) {}
}

// ── playJingleMockOk — "journey continues", average score (~3s) ──
export function playJingleMockOk() {
  if (isMuted()) return;
  try {
    var c = ctx();
    var t = c.currentTime;

    // Soft flute: A4 → C5 → E5 (A minor → settling)
    var notes = [440, 523, 659];
    var starts = [0, 0.35, 0.7];
    var durs = [0.35, 0.35, 0.8];

    notes.forEach(function(freq, i) {
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(freq, t + starts[i]);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.11, t + starts[i] + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + starts[i] + durs[i]);
      o.connect(g); g.connect(c.destination);
      o.start(t + starts[i]);
      o.stop(t + starts[i] + durs[i] + 0.1);
    });

    // Warm pad resolution on C
    var pad = stringPad(c, 262, t + 0.7, 1.0, 0.05);
    pad.connect(c.destination);
  } catch (e) {}
}

// ── playJingleEnter — arena gate opens (~2.5s) ──
export function playJingleEnter() {
  if (isMuted()) return;
  try {
    var c = ctx();
    var t = c.currentTime;

    // Deep taiko hit
    var d = drumHit(c, t, 0.2, 60);
    d.connect(c.destination);

    // Single horn call rising: D4 → A4
    var o = c.createOscillator();
    var f = c.createBiquadFilter();
    var g = c.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(294, t + 0.2); // D4
    o.frequency.linearRampToValueAtTime(440, t + 0.7); // glide to A4
    f.type = "lowpass";
    f.frequency.setValueAtTime(600, t + 0.2);
    f.frequency.linearRampToValueAtTime(1800, t + 0.5);
    f.frequency.linearRampToValueAtTime(1000, t + 1.0);
    f.Q.value = 2;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.25);
    g.gain.setValueAtTime(0.18, t + 0.7);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
    o.connect(f); f.connect(g);
    addReverb(c, g, 0.15, [0.06, 0.14, 0.25, 0.35]);
    o.start(t + 0.2); o.stop(t + 1.4);

    // String bloom at peak
    [294, 440, 587].forEach(function(freq) {
      var pad = stringPad(c, freq, t + 0.6, 1.2, 0.05);
      pad.connect(c.destination);
    });

    // Second taiko at the gate
    var d2 = drumHit(c, t + 0.6, 0.14, 70);
    d2.connect(c.destination);
  } catch (e) {}
}

// ── playJingleDaily — treasure chest open (~2.5s) ──
export function playJingleDaily() {
  if (isMuted()) return;
  try {
    var c = ctx();
    var t = c.currentTime;

    // Quick ascending harp arpeggio: C5 → E5 → G5 → C6 → E6
    var notes = [523, 659, 784, 1047, 1319];
    notes.forEach(function(freq, i) {
      var h = harpNote(c, freq, t + i * 0.09, 0.4, 0.12 + i * 0.015);
      addReverb(c, h, 0.08, [0.03, 0.07]);
    });

    // Sparkle at the top
    var h2 = harpNote(c, 2093, t + 0.5, 0.6, 0.08); // C7
    addReverb(c, h2, 0.12, [0.04, 0.1, 0.18]);

    // Gentle string swell
    var pad = stringPad(c, 523, t + 0.3, 1.0, 0.05);
    pad.connect(c.destination);
  } catch (e) {}
}


// ═══════════════════════════════════════════════════════════
// BGM ENGINE — for Mureka-generated loops (MP3)
// ═══════════════════════════════════════════════════════════

var bgmAudio = null;

export function playBGM(track) {
  if (isMuted()) return;
  if (bgmAudio && bgmAudio._track === track && !bgmAudio.paused) return;
  stopBGM(function() {
    bgmAudio = new Audio("/audio/bgm/" + track + ".mp3");
    bgmAudio._track = track;
    bgmAudio.loop = true;
    bgmAudio.volume = 0;
    bgmAudio.play().catch(function(){});
    var fadeIn = setInterval(function() {
      if (!bgmAudio) { clearInterval(fadeIn); return; }
      if (bgmAudio.volume < 0.25) {
        bgmAudio.volume = Math.min(0.25, bgmAudio.volume + 0.02);
      } else { clearInterval(fadeIn); }
    }, 50);
  });
}

export function stopBGM(cb) {
  if (!bgmAudio || bgmAudio.paused) { if (cb) cb(); return; }
  var ref = bgmAudio;
  var fadeOut = setInterval(function() {
    if (ref.volume > 0.02) {
      ref.volume = Math.max(0, ref.volume - 0.020);
    } else {
      clearInterval(fadeOut);
      ref.pause();
      if (bgmAudio === ref) bgmAudio = null;
      if (cb) cb();
    }
  }, 50);
}

// Duck BGM while a jingle plays, then restore
export function playJingleWithDuck(name) {
  if (isMuted()) return;
  var prevVol = bgmAudio ? bgmAudio.volume : 0;
  if (bgmAudio) bgmAudio.volume = prevVol * 0.3;
  var j = new Audio("/audio/sfx/" + name + ".mp3");
  j.volume = 0.5;
  j.play().catch(function(){});
  j.onended = function() {
    if (bgmAudio) bgmAudio.volume = prevVol;
  };
}
