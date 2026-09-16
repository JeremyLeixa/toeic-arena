// ═══════════════════════════════════════════════════════════
// src/sounds.js — Verse Arena Sound Identity v2.0
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
// ★ SONIC LOGO — The Arena Call (pre-generated fanfare)
// ═══════════════════════════════════════════════════════════

export function playArenaCall() {
  if (isMuted()) return;
  try { playFile("levelup", 0.65); } catch (e) {}
}


// ═══════════════════════════════════════════════════════════
// SFX — Micro-interactions
// ═══════════════════════════════════════════════════════════

// ── playFile — pre-generated SFX from public/audio/sfx/ (ElevenLabs Sound Generation) ──
function playFile(name, vol) {
  var a = new Audio("/audio/sfx/" + name + ".mp3");
  a.volume = vol != null ? vol : 0.6;
  a.play().catch(function () {});
}

// ── playCorrect — bell chime (pre-generated) ──
export function playCorrect() {
  if (isMuted()) return;
  try { playFile("correct", 0.55); } catch (e) {}
}

// ── playWrong — metallic clang (pre-generated) ──
export function playWrong() {
  if (isMuted()) return;
  try { playFile("wrong", 0.5); } catch (e) {}
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

// ── playLevelUp — triumphant fanfare (pre-generated) ──
export function playLevelUp() {
  if (isMuted()) return;
  try { playFile("levelup", 0.6); } catch (e) {}
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
var _bgmFadeTimer = null;
// Generation token: every stopBGM() (and every playBGM request) bumps it.
// An in-flight playBGM whose token is stale MUST NOT adopt its audio, so a
// stopBGM() that fires during the play() async gap stays authoritative.
// Without this, navigating into an exercise while bgm_home is still fading in
// would let the home loop revive itself over the exercise audio.
var _bgmToken = 0;

export function playBGM(track) {
  if (isMuted()) return;
  if (bgmAudio && bgmAudio._track === track && !bgmAudio.paused) return;
  var myToken = ++_bgmToken; // this play request's identity
  _stopBGMInternal(function() {
    if (myToken !== _bgmToken) return; // a later stop/play superseded us
    var audio = new Audio("/audio/bgm/" + track + ".mp3");
    audio._track = track;
    audio.loop = true;
    audio.volume = 0;
    audio.play().then(function() {
      // A stopBGM() (or newer playBGM) during the play() async gap invalidates us
      if (myToken !== _bgmToken) { audio.pause(); audio.src = ""; return; }
      bgmAudio = audio;
      _bgmFadeTimer = setInterval(function() {
        if (!bgmAudio || bgmAudio !== audio || myToken !== _bgmToken) { clearInterval(_bgmFadeTimer); return; }
        if (bgmAudio.volume < 0.25) {
          bgmAudio.volume = Math.min(0.25, bgmAudio.volume + 0.02);
        } else { clearInterval(_bgmFadeTimer); _bgmFadeTimer = null; }
      }, 50);
    }).catch(function() {
      // Safari autoplay blocked — do NOT store a zombie reference
      audio.src = "";
    });
  });
}

export function stopBGM(cb) {
  _bgmToken++; // invalidate any in-flight playBGM so it can't revive after this stop
  _stopBGMInternal(cb);
}

// Internal stop — does NOT bump the token (playBGM bumps once for the whole
// request and must keep its own token valid through its internal stop+fade).
function _stopBGMInternal(cb) {
  // Kill any in-progress fade-in first
  if (_bgmFadeTimer) { clearInterval(_bgmFadeTimer); _bgmFadeTimer = null; }
  if (!bgmAudio) { if (cb) cb(); return; }
  var ref = bgmAudio;
  bgmAudio = null; // Immediately clear so no race with playBGM
  if (ref.paused) { ref.src = ""; if (cb) cb(); return; }
  // iOS/Safari ignore les écritures sur HTMLMediaElement.volume (reste bloqué à 1).
  // On DOIT donc piloter la fin du fondu par un compteur de pas, PAS en relisant
  // ref.volume : sinon la condition ne bascule jamais, pause() n'est jamais appelé
  // et le BGM tourne à l'infini jusqu'au refresh (bug toggle son iOS 2026-07-09).
  var startVol = ref.volume;
  var steps = 12; // ~600ms @ 50ms/pas
  var i = 0;
  var fadeOut = setInterval(function() {
    i++;
    // Rampe best-effort (no-op sur iOS) — la terminaison ne dépend QUE du compteur.
    ref.volume = Math.max(0, startVol * (1 - i / steps));
    if (i >= steps) {
      clearInterval(fadeOut);
      ref.pause();
      ref.src = ""; // Release iOS audio session
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

// ═══════════════════════════════════════════════════════════
// CHEST OPENING v3 — sons de l'ouverture de coffre (2026-09-16)
// Portés de prototypes/chest-animations-v3/sfx.js. Même principe que les jingles
// (oscillateurs + bruit filtré, Ré majeur comme playJingleEnter), mais sur un bus à
// part : compresseur + vraie réverb (ConvolverNode, IR générée). Sans compresseur,
// les couches du légendaire (cuivres + chœur + cloche + boum) saturent.
// Chaque export vérifie isMuted() au moment de l'appel : couper le son pendant une
// ouverture coupe la suite.
// ═══════════════════════════════════════════════════════════
var _chx = null; // {c, bus, verb, noise, lastTick}
var CHX_N = {
  D3: 146.83, A3: 220, D4: 293.66, Fs4: 369.99, A4: 440, Cs5: 554.37, D5: 587.33, E5: 659.26,
  Fs5: 739.99, A5: 880, Cs6: 1108.73, D6: 1174.66, E6: 1318.51, Fs6: 1479.98, A6: 1760, D7: 2349.32,
};

function chx() {
  if (isMuted()) return null;
  try {
    var c = ctx();
    if (_chx && _chx.c === c) return _chx;
    var comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
    var master = c.createGain(); master.gain.value = 0.8;
    comp.connect(master); master.connect(c.destination);
    var len = Math.floor(c.sampleRate * 2.4), ir = c.createBuffer(2, len, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = ir.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    var verb = c.createConvolver(); verb.buffer = ir;
    var vg = c.createGain(); vg.gain.value = 0.5; verb.connect(vg); vg.connect(comp);
    var noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = noise.getChannelData(0);
    for (var k = 0; k < nd.length; k++) nd[k] = Math.random() * 2 - 1;
    _chx = { c: c, bus: comp, verb: verb, noise: noise, lastTick: 0 };
    return _chx;
  } catch (e) { console.warn("[sounds] chest bus:", e && e.message); return null; }
}
function chxNow(x) { return x.c.currentTime + 0.005; }
function chxOut(x, node, wet) {
  node.connect(x.bus);
  if (wet) { var s = x.c.createGain(); s.gain.value = wet; node.connect(s); s.connect(x.verb); }
}
function chxEnv(g, t, a, d, v) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}
// o = {type,f,f2,glide,t,a,d,v,lp,q,detune,wet}
function chxTone(x, o) {
  var c = x.c, t = o.t, a = o.a || 0.005, osc = c.createOscillator(), g = c.createGain();
  osc.type = o.type || "sine";
  osc.frequency.setValueAtTime(o.f, t);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glide || o.d));
  if (o.detune) osc.detune.value = o.detune;
  chxEnv(g, t, a, o.d, o.v);
  if (o.lp) {
    var f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = o.lp; f.Q.value = o.q || 0.7;
    osc.connect(f); f.connect(g);
  } else osc.connect(g);
  chxOut(x, g, o.wet);
  osc.start(t); osc.stop(t + a + o.d + 0.05);
}
// o = {t,d,a,v,ft,f,f2,q,wet}
function chxNoise(x, o) {
  var c = x.c, t = o.t, a = o.a || 0.003, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  src.buffer = x.noise;
  f.type = o.ft || "bandpass"; f.Q.value = o.q || 1;
  f.frequency.setValueAtTime(o.f, t);
  if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + a + o.d);
  chxEnv(g, t, a, o.d, o.v);
  src.connect(f); f.connect(g); chxOut(x, g, o.wet);
  src.start(t, Math.random() * 1.2); src.stop(t + a + o.d + 0.05);
}
function chxPluck(x, f, t, v, wet) {
  chxTone(x, { type: "triangle", f: f, t: t, d: 0.55, v: v, wet: wet });
  chxTone(x, { type: "sine", f: f * 2, t: t, d: 0.25, v: v * 0.3, wet: wet });
}
function chxArp(x, notes, t, gap, v, wet) { notes.forEach(function (f, i) { chxPluck(x, f, t + i * gap, v, wet); }); }
function chxPad(x, freqs, t, dur, v, lp, wet) {
  freqs.forEach(function (f) {
    [-8, 0, 8].forEach(function (dt) {
      chxTone(x, { type: "sawtooth", f: f, t: t, a: dur * 0.35, d: dur * 0.65, v: v / (freqs.length * 2), lp: lp, detune: dt, wet: wet });
    });
  });
}
function chxBell(x, f, t, v) {
  [[1, 1], [2.76, 0.45], [5.4, 0.25], [8.93, 0.12]].forEach(function (p, i) {
    chxTone(x, { type: "sine", f: f * p[0], t: t, d: 2.2 / (i + 1), v: v * p[1], wet: 0.6 });
  });
}
function chxBrass(x, f, t, d, v) {
  chxTone(x, { type: "sawtooth", f: f, t: t, a: 0.04, d: d, v: v, lp: 1900, q: 1.4, wet: 0.35 });
  chxTone(x, { type: "sawtooth", f: f, t: t, a: 0.04, d: d, v: v * 0.6, lp: 1900, q: 1.4, detune: 7, wet: 0.35 });
  chxTone(x, { type: "triangle", f: f / 2, t: t, a: 0.04, d: d, v: v * 0.5 });
}
function chxBoom(x, t, v) {
  chxTone(x, { type: "sine", f: 110, f2: 32, glide: 0.35, t: t, d: 0.7, v: v, wet: 0.15 });
}
function chxPlay(fn) {
  var x = chx();
  if (!x) return;
  try { fn(x, chxNow(x)); } catch (e) { console.warn("[sounds] chest:", e && e.message); }
}

// Le coffre touche le sol (tier 0 Novice … 3 Légendaire)
export function playChestLand(tier) {
  chxPlay(function (x, t) {
    chxBoom(x, t, 0.9);
    chxNoise(x, { t: t, d: 0.2, v: 0.5, ft: "lowpass", f: 520, q: 0.5 });
    chxNoise(x, { t: t, d: 0.07, v: 0.35, f: 900, q: 2 });
    if (tier >= 2) chxTone(x, { type: "triangle", f: 196, t: t + 0.01, d: 1.1, v: 0.07, wet: 0.6 });
    if (tier >= 3) { chxBoom(x, t + 0.02, 0.5); chxBell(x, CHX_N.D4, t + 0.03, 0.05); }
  });
}
// Un tap : bois + ferraille + note qui monte (D5 → F5 → A5)
export function playChestKnock(step) {
  chxPlay(function (x, t) {
    chxNoise(x, { t: t, d: 0.06, v: 0.45, f: 700 + step * 180, q: 3 });
    chxTone(x, { type: "triangle", f: 170 + step * 25, f2: 90, glide: 0.08, t: t, d: 0.12, v: 0.35 });
    [0.03, 0.06, 0.1].forEach(function (dt, i) { chxNoise(x, { t: t + dt, d: 0.025, v: 0.1, f: 3800 + i * 500, q: 6 }); });
    var f = CHX_N.D5 * Math.pow(2, ([0, 3, 7][step] || 0) / 12);
    chxTone(x, { type: "sine", f: f, t: t + 0.02, a: 0.01, d: 0.6, v: 0.14, wet: 0.5 });
    chxTone(x, { type: "triangle", f: f * 2, t: t + 0.02, d: 0.3, v: 0.04, wet: 0.5 });
  });
}
// La lumière monte d'une rareté (1 uncommon … 4 legend)
export function playChestSting(r) {
  if (r < 1) return;
  chxPlay(function (x, t0) {
    var t = t0 + 0.04, N = CHX_N;
    var sets = [null, [N.A5, N.D6], [N.Fs5, N.A5, N.D6], [N.D6, N.Fs6, N.A6], [N.D6, N.Fs6, N.A6, N.D7]];
    chxArp(x, sets[r], t, 0.055, 0.09 + r * 0.015, 0.55);
    if (r >= 3) chxNoise(x, { t: t, a: 0.05, d: 0.5, v: 0.05, ft: "highpass", f: 6000, wet: 0.5 });
    if (r === 4) chxBell(x, N.D6, t + 0.2, 0.06);
  });
}
// Le coffre résiste (résultat réseau pas encore là) : grondement en boucle + craquements.
// Renvoie {stop} ; toujours appeler stop() (démontage compris).
export function playChestStrain() {
  var x = chx();
  if (!x) return { stop: function () {} };
  try {
    var c = x.c, t = chxNow(x), src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    var lfo = c.createOscillator(), lg = c.createGain();
    src.buffer = x.noise; src.loop = true;
    f.type = "lowpass"; f.frequency.value = 170;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.3);
    lfo.frequency.value = 9; lg.gain.value = 0.12; lfo.connect(lg); lg.connect(g.gain);
    src.connect(f); f.connect(g); g.connect(x.bus);
    src.start(t); lfo.start(t);
    var iv = setInterval(function () {
      if (!isMuted()) chxNoise(x, { t: chxNow(x), d: 0.05, v: 0.12, f: 500 + Math.random() * 400, q: 4 });
    }, 340);
    var stopped = false;
    return {
      stop: function () {
        if (stopped) return; stopped = true;
        clearInterval(iv);
        try {
          var s = chxNow(x);
          g.gain.cancelScheduledValues(s); g.gain.setTargetAtTime(0.0001, s, 0.06);
          src.stop(s + 0.4); lfo.stop(s + 0.4);
        } catch (e) { console.warn("[sounds] strain stop:", e && e.message); }
      },
    };
  } catch (e) { console.warn("[sounds] strain:", e && e.message); return { stop: function () {} }; }
}
export function playChestRiser(dur) {
  chxPlay(function (x, t) {
    chxNoise(x, { t: t, a: dur * 0.9, d: dur * 0.15, v: 0.22, f: 300, f2: 5000, q: 1.5, wet: 0.3 });
    chxTone(x, { type: "sawtooth", f: 110, f2: 440, glide: dur, t: t, a: dur * 0.9, d: dur * 0.15, v: 0.07, lp: 1400 });
  });
}
export function playChestUnlock() {
  chxPlay(function (x, t) {
    chxNoise(x, { t: t, d: 0.012, v: 0.5, ft: "highpass", f: 3000 });
    chxNoise(x, { t: t + 0.05, d: 0.015, v: 0.4, ft: "highpass", f: 2500 });
    chxTone(x, { type: "sine", f: 2200, t: t + 0.05, d: 0.25, v: 0.07, wet: 0.4 });
    chxTone(x, { type: "sine", f: 3300, t: t + 0.05, d: 0.18, v: 0.03, wet: 0.4 });
  });
}
// Couvercle ouvert : boum + souffle + grincement + accord selon la meilleure rareté (-1…4)
export function playChestOpen(r) {
  chxPlay(function (x, t) {
    var N = CHX_N;
    chxBoom(x, t, 1);
    chxNoise(x, { t: t, a: 0.08, d: 0.6, v: 0.35, f: 300, f2: 3000, q: 1, wet: 0.4 });
    chxTone(x, { type: "sawtooth", f: 70, f2: 115, glide: 0.35, t: t, d: 0.35, v: 0.05, lp: 900, q: 8 });
    var notes = r < 2 ? [N.D5, N.Fs5, N.A5, N.D6] : r < 3 ? [N.D5, N.Fs5, N.A5, N.D6, N.Fs6] : [N.D5, N.Fs5, N.A5, N.Cs6, N.D6, N.Fs6, N.A6];
    chxArp(x, notes, t + 0.08, 0.06, 0.11, 0.5);
    if (r >= 2) chxPad(x, [N.D4, N.A4, N.D5], t + 0.05, 1.8, 0.2, 2200, 0.6);
    if (r >= 3) { chxPad(x, [N.D3, N.A3, N.D4, N.Fs4, N.A4], t + 0.05, 2.6, 0.3, 1800, 0.6); chxBell(x, N.D6, t + 0.1, 0.07); }
    if (r >= 4) { chxBoom(x, t + 0.45, 0.6); chxBell(x, N.D7, t + 0.5, 0.05); chxArp(x, [N.D6, N.E6, N.Fs6, N.A6, N.D7], t + 0.6, 0.05, 0.07, 0.6); }
  });
}
export function playCardFly(i) {
  chxPlay(function (x, t) { chxNoise(x, { t: t, a: 0.02, d: 0.2, v: 0.12, f: 1200 + i * 120, f2: 2800, q: 1.2, wet: 0.2 }); });
}
export function playCardLift() {
  chxPlay(function (x, t) { chxNoise(x, { t: t, a: 0.05, d: 0.22, v: 0.09, f: 500, f2: 1600, q: 1, wet: 0.2 }); });
}
export function playCardFlip() {
  chxPlay(function (x, t) {
    chxNoise(x, { t: t, d: 0.03, v: 0.2, ft: "highpass", f: 2500 });
    chxNoise(x, { t: t + 0.09, d: 0.03, v: 0.15, ft: "highpass", f: 2200 });
    chxTone(x, { type: "sine", f: 900, f2: 1400, t: t, d: 0.08, v: 0.04 });
  });
}
// Battement de cœur avant de retourner une carte Epic ou Legendary
export function playCardHeartbeat() {
  chxPlay(function (x, t) {
    chxTone(x, { type: "sine", f: 75, f2: 42, glide: 0.18, t: t, d: 0.22, v: 0.6 });
    chxTone(x, { type: "sine", f: 70, f2: 40, glide: 0.18, t: t + 0.24, d: 0.2, v: 0.4 });
  });
}
// Carte retournée : r = null (monnaies, tokens) ou 0…4
export function playCardReveal(r) {
  chxPlay(function (x, t) {
    var N = CHX_N;
    if (r === null || r === undefined || r < 0) {
      chxTone(x, { type: "sine", f: 2400, t: t, d: 0.3, v: 0.06, wet: 0.3 });
      chxTone(x, { type: "sine", f: 3150, t: t + 0.03, d: 0.25, v: 0.04, wet: 0.3 });
      chxArp(x, [N.A5, N.D6], t + 0.05, 0.07, 0.09, 0.4);
      return;
    }
    if (r === 0) { chxArp(x, [N.D5, N.A5], t, 0.08, 0.1, 0.4); return; }
    if (r === 1) { chxArp(x, [N.D5, N.Fs5, N.A5], t, 0.07, 0.1, 0.45); return; }
    if (r === 2) { chxArp(x, [N.D5, N.Fs5, N.A5, N.D6], t, 0.06, 0.11, 0.5); chxPad(x, [N.D4, N.A4], t, 1.4, 0.15, 2000, 0.5); return; }
    if (r === 3) {
      chxArp(x, [N.D5, N.Fs5, N.A5, N.Cs6, N.D6], t, 0.055, 0.11, 0.55);
      chxPad(x, [N.D4, N.Fs4, N.A4, N.Cs5], t, 2, 0.24, 2000, 0.6);
      chxNoise(x, { t: t, a: 0.1, d: 0.8, v: 0.04, ft: "highpass", f: 6500, wet: 0.6 });
      return;
    }
    // Légendaire : fanfare de cuivres + chœur + cloche + étincelles
    chxBoom(x, t, 0.8);
    chxBrass(x, N.D4, t, 0.25, 0.12); chxBrass(x, N.A4, t + 0.13, 0.25, 0.12); chxBrass(x, N.D5, t + 0.26, 1.1, 0.14);
    chxPad(x, [N.D3, N.A3, N.D4, N.Fs4, N.A4, N.D5], t + 0.2, 3, 0.34, 1700, 0.7);
    chxBell(x, N.D6, t + 0.3, 0.07);
    chxArp(x, [N.D6, N.E6, N.Fs6, N.A6, N.D7], t + 0.55, 0.05, 0.07, 0.6);
    chxNoise(x, { t: t + 0.2, a: 0.2, d: 1.2, v: 0.05, ft: "highpass", f: 7000, wet: 0.7 });
  });
}
// Compteur qui défile : un tic toutes les 45 ms au plus
export function playLootTick() {
  chxPlay(function (x, t) {
    if (t - x.lastTick < 0.045) return;
    x.lastTick = t;
    chxTone(x, { type: "sine", f: 1900 + Math.random() * 200, t: t, d: 0.03, v: 0.04 });
  });
}
export function playLootCollect() {
  chxPlay(function (x, t) {
    var N = CHX_N;
    chxArp(x, [N.D6, N.Fs6, N.A6, N.D7], t, 0.045, 0.08, 0.5);
    chxNoise(x, { t: t, a: 0.05, d: 0.5, v: 0.05, ft: "highpass", f: 6000, wet: 0.5 });
    chxPad(x, [N.D5, N.Fs5, N.A5], t + 0.05, 1, 0.1, 2400, 0.5);
  });
}

// Baisse la musique de fond pendant l'ouverture d'un coffre, puis la remet.
// Best-effort : iOS ignore les écritures de volume (voir _stopBGMInternal). On ne RELIT
// jamais .volume pour décider quoi que ce soit ; 0.25 = le volume cible de playBGM.
export function duckBGM(on) {
  try { if (bgmAudio) bgmAudio.volume = on ? 0.06 : 0.25; }
  catch (e) { console.warn("[sounds] duckBGM:", e && e.message); }
}
