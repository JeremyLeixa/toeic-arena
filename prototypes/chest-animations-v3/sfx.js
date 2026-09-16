// ═══════════════════════════════════════════════════════════════
// sfx.js — sons d'ouverture de coffre, 100 % Web Audio (zéro fichier)
// Écrit pour être porté tel quel dans src/sounds.js : mêmes principes
// (oscillateurs + bruit filtré), tonalité Ré majeur comme playJingleEnter.
// Différence assumée : une vraie réverb (ConvolverNode, IR générée) et un
// compresseur maître, pour que les couches légendaires ne saturent pas.
// ═══════════════════════════════════════════════════════════════
(function () {
  var ac = null, bus = null, verb = null, noiseBuf = null, enabled = true, lastTick = 0;

  var N = {
    D3: 146.83, A3: 220, D4: 293.66, Fs4: 369.99, A4: 440, Cs5: 554.37, D5: 587.33, E5: 659.26,
    Fs5: 739.99, A5: 880, Cs6: 1108.73, D6: 1174.66, E6: 1318.51, Fs6: 1479.98, A6: 1760, D7: 2349.32,
  };

  function init() {
    if (ac) { if (ac.state === "suspended") ac.resume(); return; }
    ac = new (window.AudioContext || window.webkitAudioContext)();
    var comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
    var master = ac.createGain(); master.gain.value = 0.8;
    comp.connect(master); master.connect(ac.destination);
    bus = comp;
    // Réverb de salle : IR stéréo de 2,4 s, bruit à décroissance cubique
    var len = Math.floor(ac.sampleRate * 2.4), ir = ac.createBuffer(2, len, ac.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = ir.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    verb = ac.createConvolver(); verb.buffer = ir;
    var vg = ac.createGain(); vg.gain.value = 0.5; verb.connect(vg); vg.connect(bus);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    var nd = noiseBuf.getChannelData(0);
    for (var k = 0; k < nd.length; k++) nd[k] = Math.random() * 2 - 1;
  }
  function ready() { return enabled && ac && ac.state !== "closed"; }
  function now() { return ac.currentTime + 0.005; }

  function out(node, wet) {
    node.connect(bus);
    if (wet) { var s = ac.createGain(); s.gain.value = wet; node.connect(s); s.connect(verb); }
  }
  function env(g, t, a, d, v) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  // o = {type,f,f2,glide,t,a,d,v,lp,q,detune,wet}
  function tone(o) {
    var t = o.t, a = o.a || 0.005, osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glide || o.d));
    if (o.detune) osc.detune.value = o.detune;
    env(g, t, a, o.d, o.v);
    if (o.lp) {
      var f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = o.lp; f.Q.value = o.q || 0.7;
      osc.connect(f); f.connect(g);
    } else osc.connect(g);
    out(g, o.wet);
    osc.start(t); osc.stop(t + a + o.d + 0.05);
  }
  // o = {t,d,a,v,ft,f,f2,q,wet}
  function noise(o) {
    var t = o.t, a = o.a || 0.003, src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf;
    f.type = o.ft || "bandpass"; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + a + o.d);
    env(g, t, a, o.d, o.v);
    src.connect(f); f.connect(g); out(g, o.wet);
    src.start(t, Math.random() * 1.2); src.stop(t + a + o.d + 0.05);
  }
  function pluck(f, t, v, wet) {
    tone({ type: "triangle", f: f, t: t, d: 0.55, v: v, wet: wet });
    tone({ type: "sine", f: f * 2, t: t, d: 0.25, v: v * 0.3, wet: wet });
  }
  function arp(notes, t, gap, v, wet) { notes.forEach(function (f, i) { pluck(f, t + i * gap, v, wet); }); }
  function pad(freqs, t, dur, v, lp, wet) {
    freqs.forEach(function (f) {
      [-8, 0, 8].forEach(function (dt) {
        tone({ type: "sawtooth", f: f, t: t, a: dur * 0.35, d: dur * 0.65, v: v / (freqs.length * 2), lp: lp, detune: dt, wet: wet });
      });
    });
  }
  function bell(f, t, v) {
    [[1, 1], [2.76, 0.45], [5.4, 0.25], [8.93, 0.12]].forEach(function (p, i) {
      tone({ type: "sine", f: f * p[0], t: t, d: 2.2 / (i + 1), v: v * p[1], wet: 0.6 });
    });
  }
  function brass(f, t, d, v) {
    tone({ type: "sawtooth", f: f, t: t, a: 0.04, d: d, v: v, lp: 1900, q: 1.4, wet: 0.35 });
    tone({ type: "sawtooth", f: f, t: t, a: 0.04, d: d, v: v * 0.6, lp: 1900, q: 1.4, detune: 7, wet: 0.35 });
    tone({ type: "triangle", f: f / 2, t: t, a: 0.04, d: d, v: v * 0.5 });
  }
  function boom(t, v) {
    tone({ type: "sine", f: 110, f2: 32, glide: 0.35, t: t, d: 0.7, v: v, wet: 0.15 });
  }

  var API = {
    unlock: init,
    setEnabled: function (on) { enabled = on; },
    isEnabled: function () { return enabled; },

    // Le coffre touche le sol
    thud: function (tier) {
      if (!ready()) return; var t = now();
      boom(t, 0.9);
      noise({ t: t, d: 0.2, v: 0.5, ft: "lowpass", f: 520, q: 0.5 });
      noise({ t: t, d: 0.07, v: 0.35, f: 900, q: 2 });
      if (tier >= 2) tone({ type: "triangle", f: 196, t: t + 0.01, d: 1.1, v: 0.07, wet: 0.6 }); // cerclage métallique
      if (tier >= 3) { boom(t + 0.02, 0.5); bell(N.D4, t + 0.03, 0.05); }
    },

    // Un tap sur le coffre : bois + ferraille + note qui monte (D5 → F5 → A5)
    knock: function (step) {
      if (!ready()) return; var t = now();
      noise({ t: t, d: 0.06, v: 0.45, f: 700 + step * 180, q: 3 });
      tone({ type: "triangle", f: 170 + step * 25, f2: 90, glide: 0.08, t: t, d: 0.12, v: 0.35 });
      [0.03, 0.06, 0.1].forEach(function (dt, i) { noise({ t: t + dt, d: 0.025, v: 0.1, f: 3800 + i * 500, q: 6 }); });
      var f = N.D5 * Math.pow(2, ([0, 3, 7][step] || 0) / 12);
      tone({ type: "sine", f: f, t: t + 0.02, a: 0.01, d: 0.6, v: 0.14, wet: 0.5 });
      tone({ type: "triangle", f: f * 2, t: t + 0.02, d: 0.3, v: 0.04, wet: 0.5 });
    },

    // La lumière change de rareté entre deux taps
    sting: function (r) {
      if (!ready() || r < 1) return; var t = now() + 0.04;
      var sets = [null, [N.A5, N.D6], [N.Fs5, N.A5, N.D6], [N.D6, N.Fs6, N.A6], [N.D6, N.Fs6, N.A6, N.D7]];
      arp(sets[r], t, 0.055, 0.09 + r * 0.015, 0.55);
      if (r >= 3) noise({ t: t, a: 0.05, d: 0.5, v: 0.05, ft: "highpass", f: 6000, wet: 0.5 });
      if (r === 4) bell(N.D6, t + 0.2, 0.06);
    },

    // Le coffre résiste (réseau lent) : grondement en boucle + craquements
    strain: function () {
      if (!ready()) return { stop: function () {} };
      var t = now(), src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      var lfo = ac.createOscillator(), lg = ac.createGain();
      src.buffer = noiseBuf; src.loop = true;
      f.type = "lowpass"; f.frequency.value = 170;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.3);
      lfo.frequency.value = 9; lg.gain.value = 0.12; lfo.connect(lg); lg.connect(g.gain);
      src.connect(f); f.connect(g); g.connect(bus);
      src.start(t); lfo.start(t);
      var iv = setInterval(function () {
        if (ready()) noise({ t: now(), d: 0.05, v: 0.12, f: 500 + Math.random() * 400, q: 4 });
      }, 340);
      return {
        stop: function () {
          clearInterval(iv); var s = now();
          g.gain.cancelScheduledValues(s); g.gain.setTargetAtTime(0.0001, s, 0.06);
          src.stop(s + 0.4); lfo.stop(s + 0.4);
        },
      };
    },

    riser: function (dur) {
      if (!ready()) return; var t = now();
      noise({ t: t, a: dur * 0.9, d: dur * 0.15, v: 0.22, f: 300, f2: 5000, q: 1.5, wet: 0.3 });
      tone({ type: "sawtooth", f: 110, f2: 440, glide: dur, t: t, a: dur * 0.9, d: dur * 0.15, v: 0.07, lp: 1400 });
    },

    unlock_lock: function () {
      if (!ready()) return; var t = now();
      noise({ t: t, d: 0.012, v: 0.5, ft: "highpass", f: 3000 });
      noise({ t: t + 0.05, d: 0.015, v: 0.4, ft: "highpass", f: 2500 });
      tone({ type: "sine", f: 2200, t: t + 0.05, d: 0.25, v: 0.07, wet: 0.4 });
      tone({ type: "sine", f: 3300, t: t + 0.05, d: 0.18, v: 0.03, wet: 0.4 });
    },

    // Couvercle ouvert : boom + souffle + grincement + accord selon la meilleure rareté
    open: function (r) {
      if (!ready()) return; var t = now();
      boom(t, 1);
      noise({ t: t, a: 0.08, d: 0.6, v: 0.35, f: 300, f2: 3000, q: 1, wet: 0.4 });
      tone({ type: "sawtooth", f: 70, f2: 115, glide: 0.35, t: t, d: 0.35, v: 0.05, lp: 900, q: 8 });
      var notes = r < 2 ? [N.D5, N.Fs5, N.A5, N.D6] : r < 3 ? [N.D5, N.Fs5, N.A5, N.D6, N.Fs6] : [N.D5, N.Fs5, N.A5, N.Cs6, N.D6, N.Fs6, N.A6];
      arp(notes, t + 0.08, 0.06, 0.11, 0.5);
      if (r >= 2) pad([N.D4, N.A4, N.D5], t + 0.05, 1.8, 0.2, 2200, 0.6);
      if (r >= 3) { pad([N.D3, N.A3, N.D4, N.Fs4, N.A4], t + 0.05, 2.6, 0.3, 1800, 0.6); bell(N.D6, t + 0.1, 0.07); }
      if (r >= 4) { boom(t + 0.45, 0.6); bell(N.D7, t + 0.5, 0.05); arp([N.D6, N.E6, N.Fs6, N.A6, N.D7], t + 0.6, 0.05, 0.07, 0.6); }
    },

    cardFly: function (i) {
      if (!ready()) return; var t = now();
      noise({ t: t, a: 0.02, d: 0.2, v: 0.12, f: 1200 + i * 120, f2: 2800, q: 1.2, wet: 0.2 });
    },
    lift: function () {
      if (!ready()) return; var t = now();
      noise({ t: t, a: 0.05, d: 0.22, v: 0.09, f: 500, f2: 1600, q: 1, wet: 0.2 });
    },
    flip: function () {
      if (!ready()) return; var t = now();
      noise({ t: t, d: 0.03, v: 0.2, ft: "highpass", f: 2500 });
      noise({ t: t + 0.09, d: 0.03, v: 0.15, ft: "highpass", f: 2200 });
      tone({ type: "sine", f: 900, f2: 1400, t: t, d: 0.08, v: 0.04 });
    },
    // Battement de cœur avant de retourner une carte légendaire
    heartbeat: function () {
      if (!ready()) return; var t = now();
      tone({ type: "sine", f: 75, f2: 42, glide: 0.18, t: t, d: 0.22, v: 0.6 });
      tone({ type: "sine", f: 70, f2: 40, glide: 0.18, t: t + 0.24, d: 0.2, v: 0.4 });
    },

    // Carte retournée. r = null (monnaies, tokens, cheat sheet) ou 0..4
    reveal: function (r) {
      if (!ready()) return; var t = now();
      if (r === null || r === undefined) {
        tone({ type: "sine", f: 2400, t: t, d: 0.3, v: 0.06, wet: 0.3 });
        tone({ type: "sine", f: 3150, t: t + 0.03, d: 0.25, v: 0.04, wet: 0.3 });
        arp([N.A5, N.D6], t + 0.05, 0.07, 0.09, 0.4);
        return;
      }
      if (r === 0) { arp([N.D5, N.A5], t, 0.08, 0.1, 0.4); return; }
      if (r === 1) { arp([N.D5, N.Fs5, N.A5], t, 0.07, 0.1, 0.45); return; }
      if (r === 2) { arp([N.D5, N.Fs5, N.A5, N.D6], t, 0.06, 0.11, 0.5); pad([N.D4, N.A4], t, 1.4, 0.15, 2000, 0.5); return; }
      if (r === 3) {
        arp([N.D5, N.Fs5, N.A5, N.Cs6, N.D6], t, 0.055, 0.11, 0.55);
        pad([N.D4, N.Fs4, N.A4, N.Cs5], t, 2, 0.24, 2000, 0.6);
        noise({ t: t, a: 0.1, d: 0.8, v: 0.04, ft: "highpass", f: 6500, wet: 0.6 });
        return;
      }
      // Légendaire : fanfare de cuivres + chœur + cloche + étincelles
      boom(t, 0.8);
      brass(N.D4, t, 0.25, 0.12); brass(N.A4, t + 0.13, 0.25, 0.12); brass(N.D5, t + 0.26, 1.1, 0.14);
      pad([N.D3, N.A3, N.D4, N.Fs4, N.A4, N.D5], t + 0.2, 3, 0.34, 1700, 0.7);
      bell(N.D6, t + 0.3, 0.07);
      arp([N.D6, N.E6, N.Fs6, N.A6, N.D7], t + 0.55, 0.05, 0.07, 0.6);
      noise({ t: t + 0.2, a: 0.2, d: 1.2, v: 0.05, ft: "highpass", f: 7000, wet: 0.7 });
    },

    // Compteur qui défile (Darics / XP) — limité à un tick toutes les 45 ms
    tick: function () {
      if (!ready()) return; var t = now();
      if (t - lastTick < 0.045) return; lastTick = t;
      tone({ type: "sine", f: 1900 + Math.random() * 200, t: t, d: 0.03, v: 0.04 });
    },

    collect: function () {
      if (!ready()) return; var t = now();
      arp([N.D6, N.Fs6, N.A6, N.D7], t, 0.045, 0.08, 0.5);
      noise({ t: t, a: 0.05, d: 0.5, v: 0.05, ft: "highpass", f: 6000, wet: 0.5 });
      pad([N.D5, N.Fs5, N.A5], t + 0.05, 1, 0.1, 2400, 0.5);
    },
  };

  window.SFX = API;
})();
