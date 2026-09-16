// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.

// ─── CSS ───
export var CSS=`
@font-face{font-family:'Cinzel';font-style:normal;font-weight:600 900;font-display:swap;src:url('/fonts/cinzel-latin-ext.woff2') format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Cinzel';font-style:normal;font-weight:600 900;font-display:swap;src:url('/fonts/cinzel-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'DM Sans';font-style:normal;font-weight:400 700;font-display:swap;src:url('/fonts/dmsans-latin-ext.woff2') format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'DM Sans';font-style:normal;font-weight:400 700;font-display:swap;src:url('/fonts/dmsans-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Outfit';font-style:normal;font-weight:400 900;font-display:swap;src:url('/fonts/outfit-latin-ext.woff2') format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Outfit';font-style:normal;font-weight:400 900;font-display:swap;src:url('/fonts/outfit-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
/* A11y: keyboard focus ring. Many inputs set inline outline:none with no replacement,
   so this needs !important to win over inline styles. :focus-visible = keyboard only,
   so taps/clicks stay ring-free. (audit 2026-06-25) */
:focus-visible{outline:2px solid var(--cyan)!important;outline-offset:2px}
.btn1:focus-visible,.btn2:focus-visible{outline-offset:3px}
/* A11y: honor reduced-motion. ~50 keyframes (shimmer/glow/pulse/chest/skin loops) ran
   unconditionally; collapse them to instant + run-once. Entrance reveals still appear,
   just without motion. (audit 2026-06-25) */
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}
}
:root{--bg:#0f0c08;--bg2:#1a1610;--bg3:#28221a;--bg-rgb:15,12,8;--bg2-rgb:26,22,16;--bg3-rgb:40,34,26;--bdr:rgba(180,140,80,0.08);--cyan:#d4943a;--orange:#c87a35;--gold:#f0c850;--green:#4abe60;--red:#e05252;--purple:#8b5e83;--t1:#ede4d4;--t2:#8a7e6a;--t3:#756b54;--cx:212,148,58;--cx-hex:#d4943a;--cx-dark:#a06e20;--endless:#1B70CF;--endless-dark:#0a3a6e;--endless-light:#7fb8e8;--endless-mid:#4a9fe0;--endless-muted:#7a9ac0;--on-cx:#0f0c08}
.skin-argent{--cx:180,180,200;--cx-hex:#b4b4c8;--cx-dark:#888898;--cyan:#b4b4c8;--orange:#888898}
.skin-emeraude{--cx:46,180,100;--cx-hex:#2eb464;--cx-dark:#1a8a46;--cyan:#2eb464;--orange:#1a8a46}
.skin-saphir{--cx:58,148,220;--cx-hex:#3a94dc;--cx-dark:#1a6aaa;--cyan:#3a94dc;--orange:#1a6aaa}
.skin-rubis{--cx:220,58,80;--cx-hex:#dc3a50;--cx-dark:#c01830;--cyan:#dc3a50;--orange:#c01830}
.skin-amethyste{--cx:160,90,220;--cx-hex:#a05adc;--cx-dark:#7030aa;--cyan:#a05adc;--orange:#7030aa}
.skin-corail{--cx:220,100,50;--cx-hex:#dc6432;--cx-dark:#c03018;--cyan:#dc6432;--orange:#c03018}
.skin-jade{--cx:20,180,170;--cx-hex:#14b4aa;--cx-dark:#0a8880;--cyan:#14b4aa;--orange:#0a8880}
.skin-obsidienne:not(.light),.light.skin-obsidienne .crd{--cx:180,160,220;--cx-hex:#b4a0dc;--cx-dark:#8870b0;--cyan:#b4a0dc;--orange:#8870b0;--bg:#080810;--bg2:#12101c;--bg3:#1c1a28;--t1:#e8e4f4;--t2:#807898;--bdr:rgba(160,128,224,.08)}
.skin-aurore:not(.light),.light.skin-aurore .crd{--cx:64,208,192;--cx-hex:#40d0c0;--cx-dark:#3a9870;--cyan:#40d0c0;--orange:#3a9870;--bg:#08090e;--bg2:#10121c;--bg3:#18202c;--t1:#d8f0e8;--t2:#5898a0;--bdr:rgba(64,208,192,.08)}
.light{--bg:#f5f0e8;--bg2:#fffcf5;--bg3:#e8e0d2;--bg-rgb:245,240,232;--bg2-rgb:255,252,245;--bg3-rgb:232,224,210;--bdr:rgba(120,90,50,0.1);--cyan:#6f5410;--orange:#a05a10;--gold:#7c5d0e;--green:#15803d;--red:#b82020;--purple:#6b3d62;--t1:#1a1510;--t2:#5a5040;--t3:#6e6048;--cx:111,84,16;--cx-hex:#6f5410;--cx-dark:#55400c;--on-cx:#fffcf5}
/* --on-cx : texte posé sur un aplat d'accent (--cx-hex → --cx-dark : .btn1, .gauntlet-btn-enter,
   médaille de niveau de Home, pastille ✎ du Profil). Sombre sur l'accent vif du mode sombre, clair
   sur l'accent assombri du clair : avec #0f0c08 partout, le bouton principal tombait à 2,5:1 en
   clair (1,6:1 sur Amethyst). Les cartes-nuit le remettent sombre (accent vif dans la carte) ; les
   skins nuit et les fêtes gardent leur couleur de .btn1 en !important. */
/* Variantes claires des couleurs de ligue, de titre et de rareté codées en dur (lib/tone.js :
   tone(hex) → var(--tone-<hex>,<hex>)). Même teinte, ≥ 4,6:1 sur --bg, --bg2, --bg3 ; les jaunes
   ramenés vers 43° (un jaune assombri vire à l'olive). Hors clair la variable n'existe pas et le
   hex s'applique ; les cartes-nuit la remettent à initial. Une couleur de ligue, de titre ou de
   rareté ajoutée sans sa variante ici : tests/check_tones.cjs rougit. */
.light{--tone-cd7f32:#8b5622;--tone-c0c0c0:#626262;--tone-ffd700:#7d5d0e;--tone-00d4ff:#0e6c7f;--tone-ff6bff:#ad13ad;--tone-ff4757:#c21625;--tone-ffae00:#815c0e;--tone-3a8ee0:#1b64ab;--tone-c060f0:#9818d8;--tone-ffc020:#7c5d0e;--tone-e8d4a8:#795d20;--tone-c9a23a:#785f21;--tone-e8c45a:#7b5d11;--tone-909090:#626262;--tone-3ecc78:#1e703f}
.light.skin-argent{--cx:80,80,110;--cx-hex:#505070;--cx-dark:#383848;--cyan:#505070;--orange:#383848}
.light.skin-emeraude{--cx:18,110,52;--cx-hex:#126e34;--cx-dark:#0c5228;--cyan:#126e34;--orange:#0c5228}
.light.skin-saphir{--cx:20,80,150;--cx-hex:#145096;--cx-dark:#0e3a78;--cyan:#145096;--orange:#0e3a78}
.light.skin-rubis{--cx:160,20,40;--cx-hex:#a01428;--cx-dark:#780e1e;--cyan:#a01428;--orange:#780e1e}
.light.skin-amethyste{--cx:100,40,160;--cx-hex:#6428a0;--cx-dark:#4a1878;--cyan:#6428a0;--orange:#4a1878}
.light.skin-corail{--cx:160,55,20;--cx-hex:#a03714;--cx-dark:#7a2408;--cyan:#a03714;--orange:#7a2408}
.light.skin-jade{--cx:10,110,105;--cx-hex:#0a6e69;--cx-dark:#085250;--cyan:#0a6e69;--orange:#085250}
.light.skin-obsidienne{--cx:80,60,140;--cx-hex:#503c8c;--cx-dark:#382868;--cyan:#503c8c;--orange:#382868}
.light.skin-aurore{--cx:20,120,90;--cx-hex:#147858;--cx-dark:#0c5a40;--cyan:#147858;--orange:#0c5a40}
/* ── SHIMMER OVERLAY via ::after (immune to inline style overrides) ── */
/* ── EPIC SKINS — ::after shimmer overlay ── */
.skin-rubis .btn1,.skin-amethyste .btn1,.skin-corail .btn1,.skin-jade .btn1{position:relative!important;overflow:hidden!important;box-shadow:0 4px 20px rgba(var(--cx),.4),0 0 0 1px rgba(var(--cx),.2)!important}
.skin-rubis .btn1::after,.skin-amethyste .btn1::after,.skin-corail .btn1::after,.skin-jade .btn1::after{content:''!important;position:absolute!important;inset:0!important;background-image:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.2) 50%,transparent 65%)!important;background-size:300%!important;animation:skinShimmer 2.5s ease-in-out infinite!important;pointer-events:none!important;border-radius:inherit!important}
.skin-rubis .bar-fill,.skin-amethyste .bar-fill,.skin-corail .bar-fill,.skin-jade .bar-fill{position:relative!important;overflow:hidden!important}
.skin-rubis .bar-fill::after,.skin-amethyste .bar-fill::after,.skin-corail .bar-fill::after,.skin-jade .bar-fill::after{content:''!important;position:absolute!important;inset:0!important;background-image:linear-gradient(90deg,transparent 35%,rgba(255,255,255,.25) 50%,transparent 65%)!important;background-size:300%!important;animation:skinShimmer 2s ease-in-out infinite!important;pointer-events:none!important;border-radius:inherit!important}
.skin-rubis .crd,.skin-amethyste .crd,.skin-corail .crd,.skin-jade .crd{border-color:rgba(var(--cx),.18)!important;box-shadow:0 0 12px rgba(var(--cx),.08),inset 0 1px 0 rgba(var(--cx),.08)!important}
.skin-rubis .glo,.skin-amethyste .glo,.skin-corail .glo,.skin-jade .glo{box-shadow:0 0 30px rgba(var(--cx),.12)!important}
.skin-rubis .btn2,.skin-amethyste .btn2,.skin-corail .btn2,.skin-jade .btn2{border-color:rgba(var(--cx),.3)!important;color:var(--cyan)!important}
/* ── OBSIDIENNE — violet+or pulsation + shimmer overlay ── */
/* NOTE: box-shadow sans !important pour permettre à obsidianPulse de l'animer */
.skin-obsidienne .btn1{position:relative!important;overflow:hidden!important;background-image:linear-gradient(135deg,#9a78e0,#6c4ab8,#c090f0,#6c4ab8,#9a78e0)!important;background-color:transparent!important;background-size:300%!important;animation:obsidianPulse 3s ease-in-out infinite!important;transition:none!important;filter:brightness(1.1)!important;color:#080810!important;box-shadow:0 4px 28px rgba(160,130,255,.45),0 0 50px rgba(160,130,255,.18),0 0 0 1px rgba(160,130,255,.25)}
.skin-obsidienne .btn1::after{content:''!important;position:absolute!important;inset:0!important;background-image:linear-gradient(105deg,transparent 30%,rgba(200,180,255,.25) 45%,rgba(180,150,255,.16) 55%,transparent 70%)!important;background-size:300%!important;animation:skinShimmer 3s ease-in-out infinite!important;pointer-events:none!important;border-radius:inherit!important}
.skin-obsidienne .bar-fill{position:relative!important;overflow:hidden!important;background-image:linear-gradient(90deg,#9a78e0,#6c4ab8,#c090f0,#9a78e0)!important;background-color:transparent!important;background-size:200%!important;animation:obsidianPulse 4s ease-in-out infinite!important;transition:none!important;box-shadow:0 0 12px rgba(var(--cx),.5)}
.skin-obsidienne .bar-fill::after{content:''!important;position:absolute!important;inset:0!important;background-image:linear-gradient(90deg,transparent 30%,rgba(200,180,255,.3) 45%,rgba(180,150,255,.18) 55%,transparent 70%)!important;background-size:300%!important;animation:skinShimmer 2.5s ease-in-out infinite!important;pointer-events:none!important;border-radius:inherit!important}
.skin-obsidienne .crd{position:relative!important;overflow:hidden!important;border-color:rgba(160,128,224,.2)!important;background-color:#14101c!important;background-image:repeating-linear-gradient(95deg,rgba(180,160,220,.05) 0 1px,transparent 1px 3px),linear-gradient(135deg,#16121f,#0e0b16)!important;transition:none!important;box-shadow:inset 0 0 30px rgba(0,0,0,.5)!important}
.skin-obsidienne .crd>*{position:relative!important;z-index:2!important}
.skin-obsidienne .crd::before{content:''!important;position:absolute!important;inset:-20%!important;z-index:0!important;pointer-events:none!important;background:radial-gradient(circle at 30% 32%,rgba(150,90,230,.42),transparent 55%),radial-gradient(circle at 72% 70%,rgba(200,90,200,.28),transparent 55%)!important;animation:skMesh 12s ease-in-out infinite!important}
.skin-obsidienne .crd::after{content:''!important;position:absolute!important;inset:0!important;z-index:1!important;pointer-events:none!important;border-radius:inherit!important;background:radial-gradient(1.5px 1.5px at 10% 40%,#cbb8ff,transparent),radial-gradient(1.2px 1.2px at 40% 60%,#e0d0ff,transparent),radial-gradient(1.5px 1.5px at 70% 35%,#cbb8ff,transparent),radial-gradient(1.2px 1.2px at 90% 70%,#fff,transparent)!important;opacity:.7!important;animation:skDrift 9s ease-in-out infinite!important}
.skin-obsidienne .glo{animation:obsidianPulse 3s ease-in-out infinite!important}
.skin-obsidienne .btn2{border-color:rgba(160,128,224,.3)!important;color:#b090f0!important;box-shadow:0 0 12px rgba(160,130,255,.12)}
.skin-argent .tab-bar,.skin-emeraude .tab-bar,.skin-saphir .tab-bar{box-shadow:0 -30px 50px rgba(var(--cx),.07)!important}
.skin-rubis .tab-bar,.skin-amethyste .tab-bar,.skin-corail .tab-bar,.skin-jade .tab-bar{box-shadow:0 -40px 60px rgba(var(--cx),.10)!important}
.skin-obsidienne .tab-bar,.skin-aurore .tab-bar{box-shadow:0 -50px 80px rgba(var(--cx),.14)}
.skin-obsidienne .tab-bar{animation:obsidianPulse 5s ease-in-out infinite!important}
.skin-obsidienne .out{text-shadow:0 0 16px rgba(160,130,255,.12)}
/* ── AURORE BORÉALE — 4-color aurora gradient animation + shimmer ── */
/* NOTE: background-image (pas background shorthand) pour ne pas verrouiller background-position en !important */
.skin-aurore .btn1{position:relative!important;overflow:hidden!important;background-image:linear-gradient(135deg,#40d0c0,#6060e8,#c040a0,#40d0c0)!important;background-color:transparent!important;background-size:300%!important;animation:aurora 2.5s ease infinite!important;transition:none!important;color:#08090e!important;box-shadow:0 4px 32px rgba(64,208,192,.5),0 0 60px rgba(96,96,232,.2),0 0 0 1px rgba(64,208,192,.3)!important}
.skin-aurore .btn1::after{content:''!important;position:absolute!important;inset:0!important;background-image:linear-gradient(105deg,transparent 30%,rgba(180,255,240,.22) 45%,rgba(160,140,255,.15) 55%,transparent 70%)!important;background-size:300%!important;animation:skinShimmer 2.5s ease-in-out infinite!important;pointer-events:none!important;border-radius:inherit!important}
.skin-aurore .bar-fill{position:relative!important;overflow:hidden!important;background-image:linear-gradient(90deg,#40d0c0,#6060e8,#c040a0,#40c8a0,#40d0c0)!important;background-color:transparent!important;background-size:300%!important;animation:aurora 3s ease infinite!important;transition:none!important}
.skin-aurore .bar-fill::after{content:''!important;position:absolute!important;inset:0!important;background-image:linear-gradient(90deg,transparent 30%,rgba(180,255,240,.28) 45%,rgba(160,140,255,.18) 55%,transparent 70%)!important;background-size:300%!important;animation:skinShimmer 2s ease-in-out infinite!important;pointer-events:none!important;border-radius:inherit!important}
.skin-aurore .crd{position:relative!important;overflow:hidden!important;border-color:rgba(64,208,192,.2)!important;background:#0a0c14!important;transition:none!important;box-shadow:0 0 16px rgba(64,208,192,.1),inset 0 1px 0 rgba(64,208,192,.1)!important}
.skin-aurore .crd>*{position:relative!important;z-index:2!important}
.skin-aurore .crd::before{content:''!important;position:absolute!important;inset:-30%!important;z-index:0!important;pointer-events:none!important;background:radial-gradient(circle at 25% 30%,rgba(64,208,192,.5),transparent 42%),radial-gradient(circle at 75% 65%,rgba(96,96,232,.5),transparent 42%),radial-gradient(circle at 60% 20%,rgba(192,64,160,.4),transparent 42%)!important;animation:skMesh 9s ease-in-out infinite!important}
.skin-aurore .crd::after{content:''!important;position:absolute!important;inset:0!important;z-index:1!important;pointer-events:none!important;border-radius:inherit!important;background:radial-gradient(1.6px 1.6px at 18% 30%,#fff,transparent),radial-gradient(1.4px 1.4px at 65% 55%,#dffff5,transparent),radial-gradient(1.2px 1.2px at 42% 78%,#fff,transparent),radial-gradient(1.4px 1.4px at 85% 22%,#dffff5,transparent)!important;animation:skTwinkle 2.8s ease-in-out infinite!important}
.skin-aurore .glo{box-shadow:0 0 40px rgba(64,208,192,.2)!important;background-image:linear-gradient(135deg,rgba(64,208,192,.08),rgba(96,96,232,.06),rgba(192,64,160,.05))!important;background-size:300%!important;animation:aurora 4s ease infinite!important}
.skin-aurore .btn2{border-color:rgba(64,208,192,.3)!important;color:#40d0c0!important;box-shadow:0 0 16px rgba(64,208,192,.12)!important}
.skin-aurore .tab-bar{animation:aurora 4s ease infinite!important}
.skin-aurore .out{text-shadow:0 0 20px rgba(64,208,192,.12)}
.light.skin-rubis .btn1,.light.skin-amethyste .btn1,.light.skin-corail .btn1,.light.skin-jade .btn1{box-shadow:0 4px 16px rgba(var(--cx),.3)!important}
.light.skin-obsidienne .btn1{box-shadow:0 4px 20px rgba(80,60,140,.35),0 0 30px rgba(80,60,140,.12)!important}
.light.skin-aurore .btn1{box-shadow:0 4px 20px rgba(20,120,90,.4)!important}
/* ═══ SHOP-EXCLUSIVE GLOBAL SKINS (Arena Shop P2, 2026-06-01) — ported verbatim from
   prototypes/shop-cosmetics/skins-global.html. Same model as aurore/obsidienne:
   override CSS vars + animate .crd/.btn1/.bar-fill/.tab-bar via background-image keyframes.
   Keyframes skSheen/skTwinkle/skFlicker + reused aurora are defined below near the others. ═══ */
.skin-frostbite:not(.light),.light.skin-frostbite .crd{--cx:90,180,232;--cyan:#5ab4e8;--orange:#4a90c0;--bg:#070b12;--bg2:#0e1622;--bg3:#16202e;--t1:#dcefff;--t2:#6a92b4;--bdr:rgba(120,190,240,.12)}
.skin-frostbite .crd{position:relative!important;overflow:hidden!important;border-color:rgba(120,190,240,.24)!important;background-image:linear-gradient(160deg,#0e2030,#081420)!important;transition:none!important;box-shadow:inset 0 0 36px rgba(120,200,255,.12)!important}
.skin-frostbite .crd::before{content:''!important;position:absolute!important;inset:0!important;border-radius:inherit!important;z-index:1!important;pointer-events:none!important;background:radial-gradient(1.4px 1.4px at 30% 0%,#fff,transparent),radial-gradient(1px 1px at 64% 0%,#dffaff,transparent),radial-gradient(1.2px 1.2px at 48% 0%,#fff,transparent),radial-gradient(1px 1px at 82% 0%,#dffaff,transparent)!important;animation:skSnowFall 5.5s linear infinite!important}
.skin-frostbite .crd::after{content:''!important;position:absolute!important;inset:0!important;z-index:1!important;pointer-events:none!important;border-radius:inherit!important;background:linear-gradient(100deg,transparent 40%,rgba(200,240,255,.3) 50%,transparent 60%)!important;background-size:250% 100%!important;animation:skSheen 5s linear infinite!important}
.skin-frostbite .btn1{background-image:linear-gradient(135deg,#7ec8f0,#5ab4e8,#bfeaff,#5ab4e8)!important;background-color:transparent!important;background-size:250%!important;color:#070b12!important;animation:skSheen 3s linear infinite!important;transition:none!important;box-shadow:0 4px 24px rgba(90,180,232,.45)}
.skin-frostbite .bar-fill{background-image:linear-gradient(90deg,#5ab4e8,#bfeaff,#5ab4e8)!important;background-color:transparent!important;background-size:200%!important;animation:skSheen 3s linear infinite!important;transition:none!important}
.skin-frostbite .btn2{border-color:rgba(90,180,232,.3)!important;color:#5ab4e8!important}
.skin-frostbite .tab-bar{box-shadow:0 -40px 70px rgba(90,180,232,.14)}
.skin-emberheart:not(.light),.light.skin-emberheart .crd{--cx:230,110,40;--cyan:#e87a28;--orange:#d04818;--bg:#0e0705;--bg2:#1c0f08;--bg3:#2a160c;--t1:#ffe4d0;--t2:#b08068;--bdr:rgba(230,120,50,.14)}
.skin-emberheart .crd{position:relative!important;overflow:hidden!important;border-color:rgba(230,120,50,.26)!important;background:radial-gradient(ellipse 120% 80% at 50% 125%,rgba(255,180,50,.3),rgba(255,110,20,.1) 45%,transparent 65%),#160805!important;animation:skEdgeGlowAmber 2.8s ease-in-out infinite!important;transition:none!important}
.skin-emberheart .crd::before,.skin-emberheart .crd::after{content:''!important;position:absolute!important;inset:0!important;border-radius:inherit!important;pointer-events:none!important;z-index:1!important}
.skin-emberheart .crd::before{background:radial-gradient(1.6px 1.6px at 20% 100%,#ffd060,transparent),radial-gradient(1.2px 1.2px at 55% 100%,#ff8030,transparent),radial-gradient(1.6px 1.6px at 82% 100%,#ffb040,transparent)!important;animation:skEmberRise 3.2s linear infinite!important}
.skin-emberheart .crd::after{background:radial-gradient(1.2px 1.2px at 35% 100%,#ffd060,transparent),radial-gradient(1.6px 1.6px at 68% 100%,#ff6020,transparent),radial-gradient(1.2px 1.2px at 12% 100%,#ffa040,transparent)!important;animation:skEmberRise 4.1s linear infinite!important;animation-delay:-1.8s!important}
.skin-emberheart .btn1{background-image:linear-gradient(135deg,#ffb030,#ff6020,#c01810,#ff6020)!important;background-color:transparent!important;background-size:250%!important;color:#0e0705!important;animation:aurora 3s ease infinite,skFlicker 1.4s ease-in-out infinite!important;transition:none!important;box-shadow:0 4px 26px rgba(255,90,20,.5)}
.skin-emberheart .bar-fill{background-image:linear-gradient(90deg,#ffb030,#ff6020,#ffb030)!important;background-color:transparent!important;background-size:200%!important;animation:aurora 3s ease infinite!important;transition:none!important}
.skin-emberheart .btn2{border-color:rgba(230,120,50,.3)!important;color:#e87a28!important}
.skin-emberheart .tab-bar{box-shadow:0 -40px 70px rgba(255,90,20,.16)}
.skin-cosmic_void:not(.light),.light.skin-cosmic_void .crd{--cx:150,110,240;--cyan:#9a6ef0;--orange:#7048c0;--bg:#06040f;--bg2:#0e0a1e;--bg3:#16102c;--t1:#e8e0fb;--t2:#8878b0;--bdr:rgba(150,110,240,.14)}
.skin-cosmic_void .crd{position:relative!important;overflow:hidden!important;border-color:rgba(150,110,240,.22)!important;background:radial-gradient(circle at 65% 35%,#1a0f2e,#06040f)!important;box-shadow:inset 0 0 40px rgba(0,0,0,.6)!important}
.skin-cosmic_void .crd>*{position:relative!important;z-index:2!important}
.skin-cosmic_void .crd::before{content:''!important;position:absolute!important;inset:-20%!important;z-index:0!important;pointer-events:none!important;background:radial-gradient(circle at 35% 40%,rgba(150,80,255,.38),transparent 55%),radial-gradient(circle at 72% 66%,rgba(255,80,160,.30),transparent 55%)!important;animation:skMesh 14s ease-in-out infinite!important}
.skin-cosmic_void .crd::after{content:''!important;position:absolute!important;inset:0!important;z-index:1!important;pointer-events:none!important;border-radius:inherit!important;background:radial-gradient(1.5px 1.5px at 18% 30%,#fff,transparent),radial-gradient(1.5px 1.5px at 65% 55%,#fdf,transparent),radial-gradient(1px 1px at 42% 78%,#cfe,transparent),radial-gradient(1px 1px at 85% 22%,#fff,transparent)!important;animation:skTwinkle 2.6s ease-in-out infinite!important}
.skin-cosmic_void .btn1{background-image:linear-gradient(135deg,#a060f0,#6040c0,#d060e0,#a060f0)!important;background-color:transparent!important;background-size:300%!important;color:#06040f!important;animation:aurora 3.5s ease infinite!important;transition:none!important;box-shadow:0 4px 28px rgba(150,90,255,.5)}
.skin-cosmic_void .bar-fill{background-image:linear-gradient(90deg,#a060f0,#d060e0,#a060f0)!important;background-color:transparent!important;background-size:200%!important;animation:aurora 3s ease infinite!important;transition:none!important}
.skin-cosmic_void .btn2{border-color:rgba(150,110,240,.3)!important;color:#9a6ef0!important}
.skin-cosmic_void .tab-bar{box-shadow:0 -40px 70px rgba(150,90,255,.16)}
.skin-abyssal:not(.light),.light.skin-abyssal .crd{--cx:42,154,140;--cyan:#2a9a8c;--orange:#177064;--bg:#051512;--bg2:#0a221e;--bg3:#103029;--t1:#d2eae4;--t2:#5e8e86;--bdr:rgba(60,180,160,.12)}
.skin-abyssal .crd{position:relative!important;overflow:hidden!important;border-color:rgba(60,180,160,.3);background:linear-gradient(#0a2a24,rgba(6,24,20,.5))!important;animation:skBPulseTeal 2.6s ease-in-out infinite!important;transition:none!important}
.skin-abyssal .crd::after{content:''!important;position:absolute!important;inset:0!important;border-radius:inherit!important;z-index:1!important;pointer-events:none!important;background:radial-gradient(4px 4px at 22% 100%,transparent 40%,rgba(120,230,210,.5) 42%,transparent 52%),radial-gradient(6px 6px at 55% 100%,transparent 40%,rgba(120,230,210,.42) 42%,transparent 52%),radial-gradient(3px 3px at 82% 100%,transparent 40%,rgba(120,230,210,.5) 42%,transparent 52%)!important;animation:skMoteRise 6s linear infinite!important}
.skin-abyssal .btn1{background-image:linear-gradient(135deg,#2a9a8c,#157064,#5ec8b8,#157064)!important;background-color:transparent!important;background-size:250%!important;color:#051512!important;animation:aurora 5s ease infinite!important;transition:none!important;box-shadow:0 4px 22px rgba(42,154,140,.38)}
.skin-abyssal .bar-fill{background-image:linear-gradient(90deg,#2a9a8c,#5ec8b8,#2a9a8c)!important;background-color:transparent!important;background-size:200%!important;animation:aurora 5s ease infinite!important;transition:none!important}
.skin-abyssal .btn2{border-color:rgba(42,154,140,.3)!important;color:#2a9a8c!important}
.skin-abyssal .tab-bar{box-shadow:0 -40px 70px rgba(42,154,140,.12)}
.skin-molten_gold:not(.light),.light.skin-molten_gold .crd{--cx:238,158,36;--cyan:#f0a020;--orange:#d07010;--bg:#0e0903;--bg2:#1e1206;--bg3:#2e1d09;--t1:#fff0cc;--t2:#b89858;--bdr:rgba(244,178,50,.18)}
.skin-molten_gold .crd{position:relative!important;overflow:hidden!important;border-color:rgba(244,178,50,.30)!important;background-image:linear-gradient(135deg,rgba(120,80,12,.5),rgba(240,190,60,.3),rgba(80,50,8,.5))!important;background-size:250% 250%!important;animation:aurora 6s ease-in-out infinite!important;transition:none!important;box-shadow:inset 0 0 30px rgba(0,0,0,.4)!important}
.skin-molten_gold .crd::before{content:''!important;position:absolute!important;inset:0!important;border-radius:inherit!important;padding:2px!important;background:linear-gradient(90deg,#f0c860,#fff4c0,#f0c860)!important;background-size:200% 100%!important;animation:skSheen 4s linear infinite!important;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)!important;-webkit-mask-composite:xor!important;mask-composite:exclude!important;z-index:1!important;pointer-events:none!important}
.skin-molten_gold .crd::after{content:''!important;position:absolute!important;inset:0!important;z-index:1!important;pointer-events:none!important;border-radius:inherit!important;background:radial-gradient(1.7px 1.7px at 25% 100%,#fff0a0,transparent),radial-gradient(1.4px 1.4px at 65% 100%,#ffd860,transparent),radial-gradient(1.7px 1.7px at 85% 100%,#ffe890,transparent)!important;animation:skMoteRise 5.5s linear infinite!important}
.skin-molten_gold .btn1{background-image:linear-gradient(115deg,#7a4a08,#f0a020,#fff2b0,#f0a020,#a86010)!important;background-color:transparent!important;background-size:280%!important;color:#1a0e02!important;animation:aurora 3s ease infinite,skFlicker 1.8s ease-in-out infinite!important;transition:none!important;box-shadow:0 4px 28px rgba(244,150,30,.55)}
.skin-molten_gold .bar-fill{background-image:linear-gradient(90deg,#f0a020,#fff2b0,#f0a020)!important;background-color:transparent!important;background-size:200%!important;animation:skSheen 2.4s linear infinite!important;transition:none!important}
.skin-molten_gold .btn2{border-color:rgba(240,160,32,.34)!important;color:#f0a020!important}
.skin-molten_gold .tab-bar{box-shadow:0 -40px 70px rgba(244,150,30,.18)}
.skin-heraldic:not(.light),.light.skin-heraldic .crd{--cx:74,108,210;--cyan:#5a7ce0;--orange:#c8a032;--bg:#05070f;--bg2:#0c1020;--bg3:#141a30;--t1:#dce4fb;--t2:#7888b0;--bdr:rgba(90,124,224,.14)}
.skin-heraldic .crd{position:relative!important;border-color:rgba(90,124,224,.22)!important;background-image:linear-gradient(135deg,rgba(74,108,210,.12),rgba(200,160,50,.07),rgba(40,60,140,.10))!important;background-size:250% 100%!important;animation:skSheen 5s linear infinite!important;transition:none!important}
.skin-heraldic .crd::after{content:''!important;position:absolute!important;inset:0!important;z-index:1!important;pointer-events:none!important;border-radius:inherit!important;background:linear-gradient(105deg,transparent 40%,rgba(220,190,90,.18) 50%,transparent 60%)!important;background-size:250% 100%!important;animation:skSheen 4s linear infinite!important}
.skin-heraldic .btn1{background-image:linear-gradient(135deg,#5a7ce0,#3a52a8,#c8a032,#3a52a8)!important;background-color:transparent!important;background-size:250%!important;color:#05070f!important;animation:aurora 3.5s ease infinite!important;transition:none!important;box-shadow:0 4px 26px rgba(90,124,224,.45)}
.skin-heraldic .bar-fill{background-image:linear-gradient(90deg,#5a7ce0,#c8a032,#5a7ce0)!important;background-color:transparent!important;background-size:200%!important;animation:aurora 3.5s ease infinite!important;transition:none!important}
.skin-heraldic .btn2{border-color:rgba(90,124,224,.3)!important;color:#5a7ce0!important}
.skin-heraldic .tab-bar{box-shadow:0 -40px 70px rgba(90,124,224,.14)}
.skin-aldric_chamber:not(.light),.light.skin-aldric_chamber .crd{--cx:206,176,108;--cyan:#cdb06a;--orange:#9a8246;--bg:#0b0a08;--bg2:#15140f;--bg3:#1e1c15;--t1:#ece4d2;--t2:#8c8472;--bdr:rgba(206,176,108,.16)}
.skin-aldric_chamber .crd{position:relative!important;overflow:hidden!important;border-color:rgba(206,176,108,.22)!important;background-color:#191510!important;background-image:radial-gradient(circle at 82% 14%,rgba(232,196,120,.16),transparent 55%),radial-gradient(rgba(150,115,55,.16) 1px,transparent 1px),radial-gradient(rgba(110,85,40,.11) 1px,transparent 1px)!important;background-size:100% 100%,7px 7px,11px 11px!important;background-position:0 0,0 0,3px 4px!important;animation:skCandle 5.5s ease-in-out infinite!important;transition:none!important;box-shadow:inset 0 0 0 1px rgba(240,210,140,.26),inset 0 0 0 6px rgba(0,0,0,.4),inset 0 0 0 7px rgba(240,210,140,.15)!important}
.skin-aldric_chamber .crd::before{content:''!important;position:absolute!important;inset:0!important;border-radius:inherit!important;z-index:1!important;pointer-events:none!important;background:linear-gradient(105deg,transparent 40%,rgba(244,228,160,.26) 50%,transparent 60%)!important;background-size:250% 100%!important;animation:skSheen 6.5s linear infinite!important}
.skin-aldric_chamber .btn1{background-image:linear-gradient(135deg,#2e2820,#b89a52,#e8d49a,#b89a52,#4a4030)!important;background-color:transparent!important;background-size:240%!important;color:#14110a!important;animation:aurora 5s ease infinite!important;transition:none!important;box-shadow:0 4px 24px rgba(180,154,82,.32),inset 0 1px 0 rgba(244,228,170,.25)}
.skin-aldric_chamber .bar-fill{background-image:linear-gradient(90deg,#b89a52,#e8d49a,#b89a52)!important;background-color:transparent!important;background-size:200%!important;animation:skSheen 6s linear infinite!important;transition:none!important}
.skin-aldric_chamber .btn2{border-color:rgba(206,176,108,.3)!important;color:#cdb06a!important}
.skin-aldric_chamber .tab-bar{box-shadow:0 -40px 70px rgba(180,154,82,.12)}
.skin-aldric_chamber .out{text-shadow:0 0 16px rgba(206,176,108,.16)}
/* Light-mode accent retints (mirror .light.skin-aurore pattern). Hors carte seulement : la page
   suit .light, les cartes gardent la palette sombre du skin (bloc « cartes-nuit » ci-dessous). */
.light.skin-frostbite{--cx:30,110,170;--cyan:#1e6ea8;--orange:#185888}
.light.skin-emberheart{--cx:180,70,20;--cyan:#b84810;--orange:#963810}
.light.skin-cosmic_void{--cx:100,60,180;--cyan:#5a30a8;--orange:#48289a}
.light.skin-abyssal{--cx:14,120,105;--cyan:#0e8070;--orange:#0a6256}
.light.skin-molten_gold{--cx:150,100,8;--cyan:#946008;--orange:#7e5008}
.light.skin-heraldic{--cx:40,68,150;--cyan:#2e4a98;--orange:#8a6c18}
.light.skin-aldric_chamber{--cx:140,112,40;--cyan:#8a7028;--orange:#766020}
/* ═══ MODE CLAIR DES SKINS À CARTES SOMBRES — « cartes-nuit » (bug 2026-09-16) ═══
   Ces skins forcent un fond sombre sur .crd (!important). En clair, la page suit .light et la
   palette sombre du skin ne vit que DANS ses cartes : sa règle de tokens s'écrit
   « .skin-X:not(.light),.light.skin-X .crd{…} ». Aucune couleur nouvelle, les particules dessinées
   pour la nuit restent sur fond de nuit. Ne pas revenir à « .skin-X{…} » seul : déclaré avant .light
   (aurore, obsidienne), le texte redevient sombre sur carte sombre (contraste 1,05:1) ; déclaré
   après, l'appli entière reste sombre avec l'accent, --t3 et vert/rouge/or du clair.
   1. Tokens qu'aucun skin ne pose : valeurs de :root dans la carte. :where() ramène la règle à
      0,2,0, sous « .light.skin-X .crd » (0,3,0) : le skin qui en pose un (--cx-hex d'aurore) gagne
      quel que soit l'ordre. color : .app a calculé la couleur du texte avec le --t1 clair, la
      carte doit la recalculer avec le sien. --tone-* : initial = valeur invalide garantie, donc
      var(--tone-x,<hex>) retombe sur le hex vif d'origine dans la carte sombre.
   2. .btn2 : ces skins posent une couleur claire en dur (#40d0c0…), illisible sur la page crème ;
      var(--cyan) prend le retint .light.skin-X hors carte, l'accent vif dans la carte.
   3. Fond de carte translucide sans couleur opaque (abyssal : shorthand ; molten_gold, heraldic :
      background-image seul, et 78 .crd ont un fond inline translucide) : en sombre la page sombre
      passe dessous, en clair la page crème délavait la carte. On remet ce qui est dessous en sombre. */
.light:where(.skin-obsidienne,.skin-aurore,.skin-frostbite,.skin-emberheart,.skin-cosmic_void,.skin-abyssal,.skin-molten_gold,.skin-heraldic,.skin-aldric_chamber) .crd{--bg-rgb:15,12,8;--bg2-rgb:26,22,16;--bg3-rgb:40,34,26;--t3:#756b54;--gold:#f0c850;--green:#4abe60;--red:#e05252;--purple:#8b5e83;--cx-hex:#d4943a;--cx-dark:#a06e20;--tone-cd7f32:initial;--tone-c0c0c0:initial;--tone-ffd700:initial;--tone-00d4ff:initial;--tone-ff6bff:initial;--tone-ff4757:initial;--tone-ffae00:initial;--tone-3a8ee0:initial;--tone-c060f0:initial;--tone-ffc020:initial;--tone-e8d4a8:initial;--tone-c9a23a:initial;--tone-e8c45a:initial;--tone-909090:initial;--tone-3ecc78:initial;--on-cx:#0f0c08;color:var(--t1)}
.light.skin-obsidienne .btn2,.light.skin-aurore .btn2,.light.skin-frostbite .btn2,.light.skin-emberheart .btn2,.light.skin-cosmic_void .btn2,.light.skin-abyssal .btn2,.light.skin-molten_gold .btn2,.light.skin-heraldic .btn2,.light.skin-aldric_chamber .btn2{color:var(--cyan)!important}
.light.skin-abyssal .crd{background-color:var(--bg)!important}
.light.skin-molten_gold .crd,.light.skin-heraldic .crd{background-color:var(--bg2)!important}
/* ═══ FESTIVAL THEMES — proto 2026-09-16 (prototypes/festival-themes/).
   Bloc destiné à src/styles/appCss.js, à coller APRÈS les paquets .skin-* (les
   festivals n'y coexistent jamais avec un skin : App.jsx pose fest-<id> À LA PLACE
   de skin-<id>, le skin équipé reste en base et revient à la fin de la fenêtre).
   Même anatomie qu'un skin global : tokens → .crd + ::before/::after → .btn1 →
   .bar-fill → .btn2 → .tab-bar → .out → retint .light. AUCUN keyframe neuf, tout
   vient des skins : skSnowFall skMoteRise skCandle skFlicker skSheen skTwinkle
   skDrift aurora. Le prefers-reduced-motion global les neutralise déjà. ═══ */

/* ── Hallow's Eve · 24 oct → 2 nov ─────────────────────────────────────────
   Citrouille sur violet profond. Feux follets (motes vert pâle + orange qui
   montent), brume violette qui dérive, chandelle (skCandle). */
.fest-halloween{--cx:255,122,26;--cx-hex:#ff7a1a;--cx-dark:#b8480c;--cyan:#ff7a1a;--orange:#d85a10;--bg:#0a0612;--bg2:#140b1f;--bg3:#1f1230;--bg-rgb:10,6,18;--bg2-rgb:20,11,31;--bg3-rgb:31,18,48;--t1:#f3e6ff;--t2:#9c86b8;--bdr:rgba(255,122,26,.14)}
.fest-halloween .crd{position:relative!important;overflow:hidden!important;border-color:rgba(255,122,26,.22)!important;background:radial-gradient(ellipse 90% 60% at 50% 120%,rgba(255,122,26,.16),transparent 60%),linear-gradient(160deg,#190e2a,#0e0718)!important;transition:none!important;box-shadow:inset 0 0 32px rgba(130,70,220,.16),0 0 18px rgba(255,122,26,.06)!important;animation:skCandle 6s ease-in-out infinite!important}
.fest-halloween .crd>*{position:relative!important;z-index:2!important}
.fest-halloween .crd::before,.fest-halloween .crd::after{content:''!important;position:absolute!important;inset:0!important;border-radius:inherit!important;pointer-events:none!important;z-index:1!important}
.fest-halloween .crd::before{background:radial-gradient(1.8px 1.8px at 18% 100%,#b6ff7a,transparent),radial-gradient(1.4px 1.4px at 46% 100%,#ffb060,transparent),radial-gradient(1.8px 1.8px at 74% 100%,#b6ff7a,transparent),radial-gradient(1.3px 1.3px at 90% 100%,#ff8a3a,transparent)!important;animation:skMoteRise 5.2s linear infinite!important}
.fest-halloween .crd::after{background:linear-gradient(90deg,transparent 10%,rgba(160,110,240,.10) 45%,rgba(160,110,240,.05) 60%,transparent 90%)!important;animation:skDrift 7s ease-in-out infinite!important}
.fest-halloween .btn1{background-image:linear-gradient(135deg,#ffb347,#ff7a1a,#c2410c,#ff7a1a)!important;background-color:transparent!important;background-size:250%!important;color:#140b1f!important;animation:aurora 3s ease infinite,skFlicker 1.6s ease-in-out infinite!important;transition:none!important;box-shadow:0 4px 26px rgba(255,122,26,.45),0 0 40px rgba(130,70,220,.18)!important}
.fest-halloween .bar-fill{background-image:linear-gradient(90deg,#ff7a1a,#ffc46b,#ff7a1a)!important;background-color:transparent!important;background-size:200%!important;animation:skSheen 3s linear infinite!important;transition:none!important}
.fest-halloween .btn2{border-color:rgba(255,122,26,.3)!important;color:#ff7a1a!important}
.fest-halloween .tab-bar{box-shadow:0 -40px 70px rgba(130,70,220,.18)}
.fest-halloween .out{text-shadow:0 0 16px rgba(160,110,240,.18)}
.light.fest-halloween{--cx:190,80,10;--cx-hex:#be500a;--cx-dark:#8a3808;--cyan:#be500a;--orange:#9a3c08;--bg:#f4eefa;--bg2:#fffcfd;--bg3:#e9e0f2;--bg-rgb:244,238,250;--bg2-rgb:255,252,253;--bg3-rgb:233,224,242;--t1:#22122e;--t2:#6a5680;--bdr:rgba(190,80,10,.14)}
.light.fest-halloween .crd{background:radial-gradient(ellipse 90% 60% at 50% 120%,rgba(255,150,60,.18),transparent 60%),linear-gradient(160deg,#ffffff,#f6eefa)!important;box-shadow:inset 0 0 26px rgba(160,110,240,.10)!important}
.light.fest-halloween .crd::before{background:radial-gradient(1.8px 1.8px at 18% 100%,#4caf1a,transparent),radial-gradient(1.4px 1.4px at 46% 100%,#e0701a,transparent),radial-gradient(1.8px 1.8px at 74% 100%,#4caf1a,transparent),radial-gradient(1.3px 1.3px at 90% 100%,#e0701a,transparent)!important}
.light.fest-halloween .btn1{color:#fff8f0!important;box-shadow:0 4px 20px rgba(190,80,10,.35)!important}
.light.fest-halloween .out{text-shadow:none}

/* ── Yuletide · 14 déc → 4 jan ─────────────────────────────────────────────
   Sapin + rouge + or. Neige lente (flocons plus gros que Frostbite), guirlande
   qui clignote sur le bord haut, barre sucre d'orge. Chaud, pas bleu : Frostbite
   est un skin payant, on s'en écarte. */
.fest-yule{--cx:245,215,110;--cx-hex:#f5d76e;--cx-dark:#b8862a;--cyan:#f5d76e;--orange:#d9a13a;--bg:#06110b;--bg2:#0c1d13;--bg3:#132a1c;--bg-rgb:6,17,11;--bg2-rgb:12,29,19;--bg3-rgb:19,42,28;--t1:#f2efe4;--t2:#8fae98;--bdr:rgba(245,215,110,.14)}
.fest-yule .crd{position:relative!important;overflow:hidden!important;border-color:rgba(245,215,110,.22)!important;background:linear-gradient(165deg,#12301e,#0a1a11)!important;transition:none!important;box-shadow:inset 0 0 30px rgba(60,160,90,.14),inset 0 1px 0 rgba(245,215,110,.14)!important}
.fest-yule .crd>*{position:relative!important;z-index:2!important}
.fest-yule .crd::before,.fest-yule .crd::after{content:''!important;position:absolute!important;inset:0!important;border-radius:inherit!important;pointer-events:none!important;z-index:1!important}
.fest-yule .crd::before{background:radial-gradient(1.8px 1.8px at 22% 0%,#fff,transparent),radial-gradient(1.3px 1.3px at 41% 0%,#fff8e8,transparent),radial-gradient(1.6px 1.6px at 58% 0%,#fff,transparent),radial-gradient(1.2px 1.2px at 77% 0%,#fff8e8,transparent),radial-gradient(1.8px 1.8px at 92% 0%,#fff,transparent)!important;animation:skSnowFall 7s linear infinite!important}
.fest-yule .crd::after{background:radial-gradient(2.4px 2.4px at 8% 0%,#ff4d4d,transparent),radial-gradient(2.4px 2.4px at 20% 0%,#ffd84d,transparent),radial-gradient(2.4px 2.4px at 32% 0%,#4dff88,transparent),radial-gradient(2.4px 2.4px at 44% 0%,#4dc3ff,transparent),radial-gradient(2.4px 2.4px at 56% 0%,#ff4d4d,transparent),radial-gradient(2.4px 2.4px at 68% 0%,#ffd84d,transparent),radial-gradient(2.4px 2.4px at 80% 0%,#4dff88,transparent),radial-gradient(2.4px 2.4px at 92% 0%,#4dc3ff,transparent)!important;animation:skTwinkle 1.8s ease-in-out infinite!important}
.fest-yule .btn1{background-image:linear-gradient(135deg,#d42b2b,#f5d76e,#d42b2b,#f5d76e)!important;background-color:transparent!important;background-size:250%!important;color:#1a0808!important;animation:aurora 3s ease infinite!important;transition:none!important;box-shadow:0 4px 26px rgba(212,43,43,.4),0 0 30px rgba(245,215,110,.18)!important}
.fest-yule .bar-fill{background-image:repeating-linear-gradient(135deg,#e03c3c 0 6px,#fff4e0 6px 12px)!important;background-color:transparent!important;background-size:200% 100%!important;animation:skSheen 6s linear infinite!important;transition:none!important}
.fest-yule .btn2{border-color:rgba(245,215,110,.3)!important;color:#f5d76e!important}
.fest-yule .tab-bar{box-shadow:0 -40px 70px rgba(60,160,90,.18)}
.fest-yule .out{text-shadow:0 0 14px rgba(245,215,110,.14)}
.light.fest-yule{--cx:184,134,42;--cx-hex:#b8862a;--cx-dark:#8a6018;--cyan:#b8862a;--orange:#9a6a1c;--bg:#f2f7f2;--bg2:#ffffff;--bg3:#e1ece2;--bg-rgb:242,247,242;--bg2-rgb:255,255,255;--bg3-rgb:225,236,226;--t1:#12241a;--t2:#4f6b58;--bdr:rgba(184,134,42,.16)}
.light.fest-yule .crd{background:linear-gradient(165deg,#ffffff,#edf5ee)!important;box-shadow:inset 0 0 24px rgba(60,160,90,.08)!important}
.light.fest-yule .crd::before{background:radial-gradient(1.8px 1.8px at 22% 0%,#9fc8ff,transparent),radial-gradient(1.3px 1.3px at 41% 0%,#b8d8ff,transparent),radial-gradient(1.6px 1.6px at 58% 0%,#9fc8ff,transparent),radial-gradient(1.2px 1.2px at 77% 0%,#b8d8ff,transparent),radial-gradient(1.8px 1.8px at 92% 0%,#9fc8ff,transparent)!important}
.light.fest-yule .btn1{color:#fff8f0!important;background-image:linear-gradient(135deg,#b81e1e,#d9a13a,#b81e1e,#d9a13a)!important}
.light.fest-yule .out{text-shadow:none}

/* ── Spring Bloom · Pâques −5 → +1 (fête mobile, algorithme de Meeus) ──────
   Sakura + menthe. Pétales roses qui tombent, voile menthe. C'est celui qui
   gagne le plus en mode clair. */
.fest-spring{--cx:255,158,196;--cx-hex:#ff9ec4;--cx-dark:#c25a84;--cyan:#ff9ec4;--orange:#e07aa0;--bg:#0d1112;--bg2:#141b19;--bg3:#1c2622;--bg-rgb:13,17,18;--bg2-rgb:20,27,25;--bg3-rgb:28,38,34;--t1:#f4eef1;--t2:#93a59a;--bdr:rgba(255,158,196,.14)}
.fest-spring .crd{position:relative!important;overflow:hidden!important;border-color:rgba(255,158,196,.22)!important;background:radial-gradient(ellipse 70% 50% at 85% -10%,rgba(168,240,208,.16),transparent 60%),linear-gradient(160deg,#182622,#0f1614)!important;transition:none!important;box-shadow:inset 0 0 30px rgba(168,240,208,.08),inset 0 1px 0 rgba(255,158,196,.12)!important}
.fest-spring .crd>*{position:relative!important;z-index:2!important}
.fest-spring .crd::before,.fest-spring .crd::after{content:''!important;position:absolute!important;inset:0!important;border-radius:inherit!important;pointer-events:none!important;z-index:1!important}
.fest-spring .crd::before{background:radial-gradient(2.2px 2.2px at 14% 0%,#ffb3d1,transparent),radial-gradient(1.6px 1.6px at 37% 0%,#fff0f6,transparent),radial-gradient(2.2px 2.2px at 61% 0%,#ff9ec4,transparent),radial-gradient(1.6px 1.6px at 84% 0%,#fff0f6,transparent)!important;animation:skSnowFall 8s linear infinite!important}
.fest-spring .crd::after{background:linear-gradient(105deg,transparent 40%,rgba(168,240,208,.16) 50%,transparent 60%)!important;background-size:250% 100%!important;animation:skSheen 7s linear infinite!important}
.fest-spring .btn1{background-image:linear-gradient(135deg,#ffb3d1,#ff9ec4,#a8f0d0,#ff9ec4)!important;background-color:transparent!important;background-size:250%!important;color:#1a0f14!important;animation:aurora 4s ease infinite!important;transition:none!important;box-shadow:0 4px 24px rgba(255,158,196,.4)!important}
.fest-spring .bar-fill{background-image:linear-gradient(90deg,#ff9ec4,#a8f0d0,#ff9ec4)!important;background-color:transparent!important;background-size:200%!important;animation:skSheen 4s linear infinite!important;transition:none!important}
.fest-spring .btn2{border-color:rgba(255,158,196,.3)!important;color:#ff9ec4!important}
.fest-spring .tab-bar{box-shadow:0 -40px 70px rgba(255,158,196,.14)}
.light.fest-spring{--cx:214,70,130;--cx-hex:#d64682;--cx-dark:#a02e60;--cyan:#d64682;--orange:#b0386a;--bg:#fbf6f8;--bg2:#ffffff;--bg3:#f0e4ec;--bg-rgb:251,246,248;--bg2-rgb:255,255,255;--bg3-rgb:240,228,236;--t1:#2a1a22;--t2:#7a6270;--bdr:rgba(214,70,130,.14)}
.light.fest-spring .crd{background:radial-gradient(ellipse 70% 50% at 85% -10%,rgba(120,220,170,.22),transparent 60%),linear-gradient(160deg,#ffffff,#fbeef4)!important;box-shadow:inset 0 0 24px rgba(214,70,130,.05)!important}
.light.fest-spring .crd::before{background:radial-gradient(2.2px 2.2px at 14% 0%,#f06aa0,transparent),radial-gradient(1.6px 1.6px at 37% 0%,#ffb3d1,transparent),radial-gradient(2.2px 2.2px at 61% 0%,#e0508a,transparent),radial-gradient(1.6px 1.6px at 84% 0%,#ffb3d1,transparent)!important}
.light.fest-spring .btn1{color:#fff8fb!important;background-image:linear-gradient(135deg,#e26a9e,#d64682,#4fc79a,#d64682)!important}

/* ── Summer Send-off · 19 → 28 juin ────────────────────────────────────────
   Ciel de crépuscule (indigo → corail) avec un soleil bas, lagon en accent,
   lucioles. Volontairement pas doré-métal : Molten Gold est un skin payant. */
.fest-solstice{--cx:56,214,224;--cx-hex:#38d6e0;--cx-dark:#1a9aa4;--cyan:#38d6e0;--orange:#ff8a5c;--bg:#0c0a1e;--bg2:#161234;--bg3:#211a45;--bg-rgb:12,10,30;--bg2-rgb:22,18,52;--bg3-rgb:33,26,69;--t1:#f6f0ff;--t2:#9a90c4;--bdr:rgba(56,214,224,.14)}
.fest-solstice .crd{position:relative!important;overflow:hidden!important;border-color:rgba(56,214,224,.22)!important;background:radial-gradient(ellipse 80% 50% at 50% 118%,rgba(255,170,80,.42),transparent 62%),linear-gradient(180deg,#1a1440 0%,#2e1a50 55%,#5e2a48 100%)!important;transition:none!important;box-shadow:inset 0 0 30px rgba(255,140,90,.10),inset 0 1px 0 rgba(56,214,224,.14)!important}
.fest-solstice .crd>*{position:relative!important;z-index:2!important}
.fest-solstice .crd::before,.fest-solstice .crd::after{content:''!important;position:absolute!important;inset:0!important;border-radius:inherit!important;pointer-events:none!important;z-index:1!important}
.fest-solstice .crd::before{background:radial-gradient(1.7px 1.7px at 16% 100%,#ffe08a,transparent),radial-gradient(1.3px 1.3px at 44% 100%,#ffd060,transparent),radial-gradient(1.7px 1.7px at 70% 100%,#fff0b0,transparent),radial-gradient(1.3px 1.3px at 88% 100%,#ffd060,transparent)!important;animation:skMoteRise 6s linear infinite!important}
.fest-solstice .crd::after{background:linear-gradient(100deg,transparent 40%,rgba(255,200,120,.14) 50%,transparent 60%)!important;background-size:250% 100%!important;animation:skSheen 7s linear infinite!important}
.fest-solstice .btn1{background-image:linear-gradient(135deg,#38d6e0,#ffd166,#ff8a5c,#38d6e0)!important;background-color:transparent!important;background-size:280%!important;color:#0c0a1e!important;animation:aurora 3.5s ease infinite!important;transition:none!important;box-shadow:0 4px 26px rgba(255,138,92,.4),0 0 30px rgba(56,214,224,.2)!important}
.fest-solstice .bar-fill{background-image:linear-gradient(90deg,#38d6e0,#ffd166,#ff8a5c,#38d6e0)!important;background-color:transparent!important;background-size:300%!important;animation:aurora 3s ease infinite!important;transition:none!important}
.fest-solstice .btn2{border-color:rgba(56,214,224,.3)!important;color:#38d6e0!important}
.fest-solstice .tab-bar{box-shadow:0 -40px 70px rgba(255,138,92,.16)}
.light.fest-solstice{--cx:18,140,150;--cx-hex:#128c96;--cx-dark:#0c6670;--cyan:#128c96;--orange:#c8562a;--bg:#fdf7f0;--bg2:#ffffff;--bg3:#f5e8da;--bg-rgb:253,247,240;--bg2-rgb:255,255,255;--bg3-rgb:245,232,218;--t1:#241a30;--t2:#6f6280;--bdr:rgba(18,140,150,.14)}
.light.fest-solstice .crd{background:radial-gradient(ellipse 80% 50% at 50% 118%,rgba(255,170,80,.30),transparent 62%),linear-gradient(180deg,#ffffff 0%,#fff3e8 60%,#ffe4d4 100%)!important;box-shadow:inset 0 0 24px rgba(255,140,90,.08)!important}
.light.fest-solstice .crd::before{background:radial-gradient(1.7px 1.7px at 16% 100%,#e0a020,transparent),radial-gradient(1.3px 1.3px at 44% 100%,#d09020,transparent),radial-gradient(1.7px 1.7px at 70% 100%,#e0a020,transparent),radial-gradient(1.3px 1.3px at 88% 100%,#d09020,transparent)!important}
.light.fest-solstice .btn1{color:#fff8f0!important;background-image:linear-gradient(135deg,#128c96,#d9a13a,#c8562a,#128c96)!important}
body{background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--t1)}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes narratorFadeFromBlack{from{opacity:1}to{opacity:0}}
@keyframes narratorFadeToBlack{from{opacity:0}to{opacity:1}}
@keyframes grim-fade-out{from{opacity:1}to{opacity:0}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.3)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes flame{0%,100%{transform:scale(1) rotate(-2deg)}25%{transform:scale(1.1) rotate(2deg)}50%{transform:scale(1.05) rotate(-1deg)}75%{transform:scale(1.12) rotate(1deg)}}
@keyframes achPop{0%{transform:translateY(30px) scale(.7);opacity:0}10%{transform:translateY(-5px) scale(1.05);opacity:1}15%{transform:translateY(0) scale(1);opacity:1}85%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-20px) scale(.95);opacity:0}}
@keyframes xpPop{0%{transform:translateY(0) scale(.5);opacity:0}15%{transform:translateY(-10px) scale(1.1);opacity:1}75%{transform:translateY(-10px) scale(1);opacity:1}100%{transform:translateY(-30px) scale(.95);opacity:0}}
@keyframes legendGlow{0%,100%{filter:drop-shadow(0 0 5px #ffc020bb) drop-shadow(0 0 12px #ffc02055)}50%{filter:drop-shadow(0 0 10px #ffc020dd) drop-shadow(0 0 24px #ffc02088)}}
@keyframes epicGlow{0%,100%{filter:drop-shadow(0 0 3px #c060f099)}50%{filter:drop-shadow(0 0 8px #c060f0cc)}}
@keyframes rareGlow{0%,100%{filter:drop-shadow(0 0 2px #3a8ee066)}50%{filter:drop-shadow(0 0 6px #3a8ee0aa)}}
@keyframes skinShimmer{0%{background-position:-100% 50%}100%{background-position:200% 50%}}
@keyframes aurora{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes obsidianPulse{0%,100%{box-shadow:0 0 12px rgba(160,130,255,.20),inset 0 0 24px rgba(80,50,180,.08)}50%{box-shadow:0 0 32px rgba(160,130,255,.45),inset 0 0 40px rgba(80,50,180,.18)}}
@keyframes legendCardPulse{0%,100%{box-shadow:0 0 16px rgba(var(--cx),.1),inset 0 1px 0 rgba(var(--cx),.1)}50%{box-shadow:0 0 28px rgba(var(--cx),.2),inset 0 1px 0 rgba(var(--cx),.18)}}
@keyframes chestShake{0%,100%{transform:rotate(0)}10%{transform:rotate(-8deg)}20%{transform:rotate(8deg)}30%{transform:rotate(-6deg)}40%{transform:rotate(6deg)}50%{transform:rotate(-3deg)}60%{transform:rotate(3deg)}70%{transform:rotate(-1deg)}80%{transform:rotate(1deg)}}
@keyframes chestFlash{0%{opacity:0;transform:scale(.5)}50%{opacity:1;transform:scale(1.3)}100%{opacity:0;transform:scale(2)}}
@keyframes endless-star-twinkle{0%,100%{opacity:0.15;transform:scale(0.8)}50%{opacity:0.95;transform:scale(1.1)}}
@keyframes endless-halo-breathe{0%,100%{opacity:0.25}50%{opacity:0.55}}
@keyframes final-ember-rise{0%{transform:translateY(0) scale(0.6);opacity:0}15%{opacity:0.85}100%{transform:translateY(-55px) scale(0.2);opacity:0}}
@keyframes final-ember-glow{0%,100%{opacity:0.4}50%{opacity:0.75}}
.fx-ember{position:absolute;width:3px;height:3px;border-radius:50%;background:#ff8c42;animation:final-ember-rise 4s ease-out infinite;pointer-events:none;will-change:transform,opacity}
.fx-ember.sm{width:2px;height:2px;background:#ffaa66}
.fx-ember.lg{width:4px;height:4px;background:#ff6020}
.fx-star{position:absolute;border-radius:50%;animation:endless-star-twinkle 3s ease-in-out infinite;pointer-events:none;will-change:transform,opacity}
@media(prefers-reduced-motion:reduce){.fx-ember,.fx-star{animation:none}.fx-ember{opacity:0}}
@keyframes chestReveal{0%{opacity:0;transform:translateY(30px) scale(.6)}60%{opacity:1;transform:translateY(-8px) scale(1.05)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes chestParticle{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-80px) scale(0)}}
@keyframes flip{0%{transform:rotateY(90deg);opacity:0}100%{transform:rotateY(0);opacity:1}}
@keyframes countUp{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
@keyframes tipSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes tipFade{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(20px)}}
/* ── Chest V2 (Boss Loot) animations ── */
@keyframes chestV2Zoom{0%{opacity:0;transform:scale(.3)}60%{transform:scale(1.15)}100%{opacity:1;transform:scale(1)}}
@keyframes chestV2Trembor{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(-5px,-3px) rotate(-4deg)}75%{transform:translate(5px,-3px) rotate(4deg)}}
@keyframes chestV2LidFly{0%{transform:translateY(0) rotate(0deg);opacity:1}40%{transform:translateY(-80px) rotate(-30deg);opacity:1}100%{transform:translateY(-200px) rotate(-80deg);opacity:0}}
@keyframes chestV2BodyCollapse{0%{transform:scale(1,1) translateY(0);opacity:1;filter:brightness(1)}40%{transform:scale(1.1,.85) translateY(8px);filter:brightness(2)}100%{transform:scale(.4,.2) translateY(30px);opacity:0;filter:brightness(4)}}
@keyframes chestV2ScreenFlash{0%,100%{opacity:0}50%{opacity:.85}}
@keyframes chestV2BurstExpand{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(80)}}
@keyframes chestV2DustExpand{0%{opacity:0;transform:translate(-50%,-50%) scale(0)}30%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(3.5)}}
@keyframes chestV2ShardFly{0%{opacity:1;transform:translate(-50%,-50%) rotate(var(--angle,0deg)) translateY(0) rotate(0deg)}100%{opacity:0;transform:translate(-50%,-50%) rotate(var(--angle,0deg)) translateY(var(--dist,200px)) rotate(720deg)}}
@keyframes chestV2BeamGrow{0%{height:0;opacity:.4}100%{height:100vh;opacity:1}}
@keyframes chestV2BeamShrink{to{opacity:0}}
@keyframes chestV2RewardFall{0%{opacity:0;transform:translateY(-220px) scale(.6) rotate(-8deg)}30%{opacity:1}100%{transform:translateY(0) scale(1) rotate(0deg);opacity:1}}
@keyframes chestV2RewardSettle{0%{transform:translateY(0) scale(1)}40%{transform:translateY(-10px) scale(1.05)}100%{transform:translateY(0) scale(1)}}
@keyframes frame-cosmic{0%,100%{filter:drop-shadow(0 0 14px #ff40c0) drop-shadow(0 0 22px #40c0ff)}50%{filter:drop-shadow(0 0 20px #ffc040) drop-shadow(0 0 28px #ff40c0)}}
@keyframes frame-dragon{0%,100%{filter:drop-shadow(0 0 14px #ff4020) drop-shadow(0 0 22px #ffd060)}50%{filter:drop-shadow(0 0 22px #ff4020) drop-shadow(0 0 30px #ffd060)}}
/* ═══ SHOP-EXCLUSIVE FRAMES (Arena Shop P2, 2026-06-01) — CSS-overlay ring effects, ported
   verbatim from prototypes/shop-cosmetics/index.html. AvatarMedal renders a circular
   .aframe overlay (position:absolute;inset:0;border-radius:50%) AROUND the shield medal for
   frames flagged css:true. Keyframes namespaced afr* to avoid clashing with the app's
   pulse (scale) / flame keyframes. ═══ */
@keyframes skSheen{0%{background-position:200% 0}100%{background-position:-100% 0}}
@keyframes skTwinkle{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes skFlicker{0%,100%{filter:brightness(1)}45%{filter:brightness(1.14)}70%{filter:brightness(.92)}}
@keyframes skEmberRise{0%{transform:translateY(4px);opacity:0}15%{opacity:.95}80%{opacity:.6}100%{transform:translateY(-44px);opacity:0}}
@keyframes skMoteRise{0%{transform:translateY(3px);opacity:0}22%{opacity:.85}80%{opacity:.45}100%{transform:translateY(-42px);opacity:0}}
@keyframes skCandle{0%,100%{filter:brightness(1)}15%{filter:brightness(1.07)}30%{filter:brightness(.95)}45%{filter:brightness(1.1)}60%{filter:brightness(.93)}80%{filter:brightness(1.04)}}
@keyframes skSnowFall{0%{transform:translateY(-8px);opacity:0}20%{opacity:.9}80%{opacity:.55}100%{transform:translateY(46px);opacity:0}}
@keyframes skMesh{0%,100%{transform:translate(0,0)}33%{transform:translate(6%,-5%)}66%{transform:translate(-5%,4%)}}
@keyframes skDrift{0%,100%{transform:translateX(-6px)}50%{transform:translateX(6px)}}
@keyframes skBPulseTeal{0%,100%{border-color:rgba(60,180,160,.3)}50%{border-color:rgba(100,230,200,.85)}}
@keyframes skEdgeGlowAmber{0%,100%{box-shadow:inset 0 0 16px rgba(255,140,40,.18),0 0 10px rgba(255,120,30,.18)}50%{box-shadow:inset 0 0 26px rgba(255,150,50,.4),0 0 28px rgba(255,120,30,.45)}}
@keyframes afrSpin{to{transform:rotate(360deg)}}
@keyframes afrPulse{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes afrFlicker{0%,100%{filter:brightness(1)}45%{filter:brightness(1.25)}70%{filter:brightness(.85)}}
.aframe-arc_pulse{border:3px solid #40d0ff;box-shadow:0 0 14px rgba(64,208,255,.7),inset 0 0 8px rgba(64,208,255,.5);animation:afrPulse 1.8s ease-in-out infinite}
.aframe-arc_pulse::after{content:'';position:absolute;inset:5px;border-radius:50%;border:1px solid rgba(64,208,255,.5)}
.aframe-orbit{border:1px dashed rgba(180,140,80,.4)}
.aframe-orbit::before,.aframe-orbit::after{content:'';position:absolute;inset:0;border-radius:50%;animation:afrSpin 3s linear infinite}
.aframe-orbit::before{background:radial-gradient(circle 4px at 50% 3px,var(--gold) 3px,transparent 4px);filter:drop-shadow(0 0 6px var(--gold))}
.aframe-orbit::after{background:radial-gradient(circle 4px at 50% 3px,#40d0ff 3px,transparent 4px);filter:drop-shadow(0 0 6px #40d0ff);animation-delay:-1.5s}
.aframe-inferno_ring{background:conic-gradient(from 90deg,rgba(255,48,0,.95),#ffb020,rgba(255,80,0,.18),#ffd040,rgba(255,60,0,.92),rgba(255,120,20,.15),rgba(255,48,0,.95));animation:afrSpin 4.5s linear infinite;-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 17px),rgba(0,0,0,.35) calc(100% - 13px),#000 calc(100% - 8px),#000 calc(100% - 4px),transparent 100%);mask:radial-gradient(farthest-side,transparent calc(100% - 17px),rgba(0,0,0,.35) calc(100% - 13px),#000 calc(100% - 8px),#000 calc(100% - 4px),transparent 100%);filter:drop-shadow(0 0 10px rgba(255,90,0,.7)) blur(.4px)}
.aframe-inferno_ring::after{content:'';position:absolute;inset:-2px;border-radius:50%;background:radial-gradient(circle,transparent 60%,rgba(255,90,0,.16) 78%,transparent 92%);animation:afrPulse 1.6s ease-in-out infinite}
.aframe-tempest{background:conic-gradient(from 0deg,transparent,#40a0ff,transparent,#a0e0ff,transparent,#40a0ff,transparent);animation:afrSpin 2.6s linear infinite;-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 16px),rgba(0,0,0,.3) calc(100% - 12px),#000 calc(100% - 7px),#000 calc(100% - 4px),transparent 100%);mask:radial-gradient(farthest-side,transparent calc(100% - 16px),rgba(0,0,0,.3) calc(100% - 12px),#000 calc(100% - 7px),#000 calc(100% - 4px),transparent 100%);filter:drop-shadow(0 0 10px rgba(64,160,255,.7)) blur(.3px)}
.aframe-tempest::after{content:'';position:absolute;inset:-2px;border-radius:50%;background:radial-gradient(circle,transparent 60%,rgba(64,160,255,.16) 78%,transparent 92%);animation:afrPulse 1.8s ease-in-out infinite}
.aframe-gilded_halo{border:2px solid #f0c850;box-shadow:0 0 4px #f0c850,0 0 18px rgba(240,200,80,.7),0 0 34px rgba(240,200,80,.4);animation:afrPulse 2.6s ease-in-out infinite}
.aframe-prismatic{background:conic-gradient(from 0deg,#ff4040,#ffd000,#40ff60,#40d0ff,#a040ff,#ff4040);animation:afrSpin 5s linear infinite;-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 16px),rgba(0,0,0,.3) calc(100% - 12px),#000 calc(100% - 7px),#000 calc(100% - 4px),transparent 100%);mask:radial-gradient(farthest-side,transparent calc(100% - 16px),rgba(0,0,0,.3) calc(100% - 12px),#000 calc(100% - 7px),#000 calc(100% - 4px),transparent 100%);filter:saturate(1.25) drop-shadow(0 0 8px rgba(255,255,255,.4)) blur(.3px)}
.aframe-prismatic::after{content:'';position:absolute;inset:-2px;border-radius:50%;background:radial-gradient(circle,transparent 62%,rgba(200,160,255,.14) 80%,transparent 94%);animation:afrPulse 2.2s ease-in-out infinite}
@keyframes chestV2ImpactRing{0%{opacity:1;transform:translate(-50%,-50%) scaleY(.4) scaleX(.3)}100%{opacity:0;transform:translate(-50%,-50%) scaleY(.4) scaleX(2.5)}}
@keyframes chestV2SpeedLine{0%{opacity:0;transform:translateY(-100px)}30%{opacity:1}100%{opacity:0;transform:translateY(200px)}}
@keyframes chestV2IconFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
/* ── Chest Earned Toast ── */
@keyframes toastSlideUp{from{opacity:0;transform:translate(-50%,40px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes toastFadeOut{from{opacity:1;transform:translate(-50%,0)}to{opacity:0;transform:translate(-50%,-10px)}}
@keyframes chestWiggle{0%,100%{transform:rotate(0deg)}15%{transform:rotate(-6deg)}30%{transform:rotate(6deg)}45%{transform:rotate(-4deg)}60%{transform:rotate(4deg)}75%{transform:rotate(-2deg)}90%{transform:rotate(2deg)}}
@keyframes legendGoldFlash{0%,100%{opacity:0}35%{opacity:.6}}
@keyframes legendShimmer{0%{background-position:-150% 50%}50%{background-position:250% 50%}100%{background-position:-150% 50%}}
.app{max-width:430px;margin:0 auto;min-height:100vh;background:var(--bg);color:var(--t1);position:relative;overflow-x:hidden}
@supports(height:100dvh){.app{min-height:100dvh}}
.pg-wrap{padding-bottom:calc(64px + env(safe-area-inset-bottom, 0px))}
.rev-nav{position:fixed;left:0;right:0;bottom:calc(64px + env(safe-area-inset-bottom, 0px));display:flex;gap:10px;padding:14px 16px 10px;z-index:6;background:linear-gradient(to top,var(--bg) 62%,rgba(var(--bg-rgb),0))}
.rev-nav>*{flex:1;margin:0}
/* Slot Prev conserve sur la 1re question : sans lui Next passe de pleine
   largeur a demi-largeur et se decale lateralement. */
.rev-nav-ghost{visibility:hidden;pointer-events:none}
/* Reserve la hauteur de la barre fixe pour ne pas masquer la fin du contenu. */
.rev-nav-spacer{height:96px;flex:none}
.enter{animation:fadeIn .3s ease-out}
.crd{background:var(--bg2);border:1px solid var(--bdr);border-radius:16px;padding:20px;box-shadow:inset 0 1px 0 rgba(180,140,80,.04)}
/* Scrollable reading boxes (Mock/Boss/Endless P6-P7 passages). 7 skins force
   .crd{overflow:hidden!important} for their shimmer ::after clipping, which
   killed the inline overflowY:auto and clipped long passages with no scroll
   for any student on those skins. Same specificity as .skin-x .crd, declared
   later → wins the tie. Keep AFTER the skin block. (bug 2026-06-25) */
.crd.read-scroll{overflow-y:auto!important;-webkit-overflow-scrolling:touch}
.glo{box-shadow:0 0 30px rgba(var(--cx),.06)}
.btn1{background:linear-gradient(135deg,var(--cx-hex),var(--cx-dark));color:var(--on-cx);border:none;border-radius:12px;padding:14px 28px;font-family:'Cinzel','Outfit',serif;font-weight:700;font-size:16px;cursor:pointer;width:100%;transition:all .2s}
.btn1:active{transform:scale(.97)}
.btn2{background:var(--bg2);border:1px solid var(--bdr);color:var(--t1);border-radius:12px;padding:12px 24px;font-family:'Cinzel','Outfit',serif;font-weight:600;font-size:14px;cursor:pointer}
.fl{animation:flame 1.5s ease-in-out infinite;display:inline-block}
.sk{animation:shake .4s ease-in-out}
.out{font-family:'Cinzel','Outfit',serif;letter-spacing:0.5px}
/* Question stems read in sans-serif (not Cinzel) — comprehension > flourish on the
   core learning task, and mirrors the real TOEIC's clean typography. (audit 2026-06-25) */
.qstem{font-family:'Outfit','DM Sans',sans-serif;letter-spacing:0}
@media(min-width:768px){
.app:not(.onboard-shell){max-width:none;margin:0 0 0 200px;padding:0 32px}
.app.onboard-shell{max-width:480px;margin:0 auto;padding:0 16px}
.tab-bar{position:fixed!important;left:0!important;top:0!important;bottom:0!important;right:auto!important;transform:none!important;width:200px!important;max-width:200px!important;height:100vh!important;flex-direction:column!important;justify-content:flex-start!important;padding:24px 12px!important;background:var(--bg2)!important;border-right:1px solid var(--bdr)!important;gap:4px!important}
.light .tab-bar{background:var(--bg2)!important}
.tab-bar button{flex-direction:row!important;gap:10px!important;padding:12px 14px!important;border-radius:10px!important;justify-content:flex-start!important;width:100%!important;flex:0 0 auto!important}
/* Mentor map wrapper — capped on mobile (portrait 2:3 image) by the inline
   width:100% which fills phone width. On desktop, the landscape 3:2 image
   takes the full column width but is also capped via max-width to prevent
   stretching too wide on ultra-wide monitors. */
.rev-nav{left:200px;bottom:12px;padding:14px 32px 10px}
.rev-nav-spacer{height:84px}
.mentor-map-wrap{margin:0 auto 14px!important}
@media(min-width:768px){.mentor-map-wrap{max-width:1100px!important}}
.sidebar-brand{display:flex!important;align-items:center;gap:10px;padding:8px 14px 20px;margin-bottom:8px;border-bottom:1px solid var(--bdr)}
.tab-bar button span:first-child{font-size:18px!important}
.tab-bar button span:nth-child(2){font-size:13px!important;font-weight:600!important}
.tab-bar button div{display:none!important}
.enter{padding-bottom:32px!important}
/* Desktop: cap content width so cards/reading passages don't stretch edge-to-edge on
   large monitors (line length was >100ch). Centered in the area right of the 200px
   sidebar. Tune the 1000px if a data-dense screen needs more. (audit 2026-06-25) */
.app:not(.onboard-shell) .enter{max-width:1000px;margin-left:auto;margin-right:auto}
.crd{padding:24px}
.crd:hover{border-color:rgba(180,140,80,.18);box-shadow:0 2px 12px rgba(var(--cx),.06)}
.btn1{width:auto;padding:14px 36px}
.btn2{padding:12px 28px}
.rg2{grid-template-columns:1fr 1fr 1fr!important}
/* .rg3 — supprimé 2026-05-04 (trio de stats Home retiré) */
.rg-games{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}
.p1-photo,.p1-photo-sm{max-height:500px!important}
.read-text{font-size:15px!important;line-height:2!important}
.read-opts button{font-size:15px!important;padding:14px 16px!important}
.q-heading{font-size:19px!important}
}

/* ═══ GRAMMAR GAUNTLET — HUB ═══ */
.gauntlet-hub{padding:20px 16px 100px;max-width:640px;margin:0 auto}
.gauntlet-header{text-align:center;margin-bottom:24px}
.gauntlet-title{font-family:'Cinzel','Outfit',serif;font-size:26px;font-weight:800;color:var(--t1);margin-bottom:6px;letter-spacing:1px}
.gauntlet-sub{color:var(--t3);font-size:13px;font-style:italic}
.gauntlet-card{position:relative;background:linear-gradient(135deg,var(--bg2),var(--bg3));border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:18px 16px;margin-bottom:14px;overflow:hidden}
.gauntlet-card-accent{position:absolute;top:0;left:0;right:0;height:4px}
.gauntlet-card-head{display:flex;align-items:center;gap:14px;margin-bottom:8px}
.gauntlet-card-icon{font-size:36px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,.35));flex-shrink:0}
.gauntlet-card-name{font-family:'Cinzel','Outfit',serif;font-size:17px;font-weight:800;color:var(--t1);letter-spacing:.3px}
.gauntlet-card-desc{font-size:13px;color:var(--t3);margin-bottom:10px;line-height:1.5}
.gauntlet-card-stats{display:flex;gap:10px;font-size:11px;color:var(--t3);margin-bottom:12px;opacity:.85}
.gauntlet-card-actions{display:flex;gap:8px}
.gauntlet-btn-enter{flex:1;background:linear-gradient(135deg,var(--cx-hex),var(--cx-dark));color:var(--on-cx);border:none;border-radius:12px;padding:12px;font-family:'Cinzel','Outfit',serif;font-weight:700;font-size:14px;cursor:pointer;letter-spacing:.3px}
.gauntlet-btn-grim{background:rgba(var(--cx),.1);color:var(--cyan);border:1px solid rgba(var(--cx),.3);border-radius:12px;padding:12px 14px;font-family:'Cinzel','Outfit',serif;font-weight:600;font-size:13px;cursor:pointer;white-space:nowrap}
.gauntlet-btn-grim:active{background:rgba(var(--cx),.22)}
.icrypt-input:focus{border-color:#c026d3!important;box-shadow:0 0 0 3px rgba(192,38,211,.2)}
.icrypt-input::placeholder{color:var(--t3);opacity:.5}
/* ═══ BACK BUTTON — standardized top-left navigation across all training modules ═══ */
.back-btn{background:none;border:none;color:var(--t2);cursor:pointer;font-size:14px;padding:8px 2px;min-height:40px;display:inline-flex;align-items:center;gap:4px;font-weight:600;font-family:inherit;margin-bottom:12px;transition:color .15s;letter-spacing:.2px}
.back-btn:hover{color:var(--t1)}
.back-btn:active{opacity:.7}
.chrono-marker{display:inline-block;padding:1px 8px;background:linear-gradient(135deg,rgba(124,58,237,.25),rgba(192,38,211,.25));border:1px solid rgba(192,38,211,.5);border-radius:6px;color:#e9d5ff;font-weight:700;margin:0 2px;letter-spacing:.2px}
.chrono-blank{display:inline-block;min-width:60px;border-bottom:2px solid #c026d3;margin:0 3px;vertical-align:middle;color:transparent;user-select:none}
.chrono-opt{display:block;width:100%;text-align:left;padding:13px 16px;margin-bottom:9px;background:var(--bg2);border:1.5px solid var(--bg3);border-radius:12px;color:var(--t1);font-size:15px;font-weight:600;cursor:pointer;transition:all .15s ease;font-family:inherit}
.chrono-opt:hover:not(:disabled){border-color:#7c3aed;background:rgba(124,58,237,.08)}
.chrono-opt:disabled{cursor:default}
.chrono-opt.correct{border-color:#22c55e;background:rgba(34,197,94,.12);color:#86efac}
.chrono-opt.wrong{border-color:#ef4444;background:rgba(239,68,68,.1);color:#fca5a5}
.chrono-opt.faded{opacity:.45}

/* ═══ GRIMOIRE READER ═══ */
.grim-overlay{position:fixed;inset:0;background:#0a0604;z-index:9000;display:flex;flex-direction:column;animation:grim-fade-in .3s ease}
.grim-overlay.grim-closing{animation:grim-fade-out .3s ease forwards;pointer-events:none}
@keyframes grim-fade-in{from{opacity:0}to{opacity:1}}
.grim-topbar{display:flex;align-items:center;gap:8px;padding:calc(10px + env(safe-area-inset-top, 0px)) 12px 10px;background:rgba(0,0,0,.7);border-bottom:1px solid rgba(245,223,170,.15);flex-shrink:0}
.grim-title{color:#f5dfaa;font-family:'Cinzel','Outfit',serif;font-size:14px;font-weight:600;letter-spacing:.4px;flex:1;text-align:center;padding:0 4px;line-height:1.25}
.grim-btn-close,.grim-btn-toc{background:rgba(245,223,170,.08);color:#f5dfaa;border:1px solid rgba(245,223,170,.2);border-radius:10px;padding:8px 12px;font-size:12px;cursor:pointer;font-weight:700;flex-shrink:0}
.grim-book{flex:1;perspective:2500px;display:flex;justify-content:center;align-items:stretch;padding:12px;overflow:hidden;position:relative}
.grim-page-wrap{position:relative;width:100%;max-width:560px;height:100%;transform-style:preserve-3d}
.grim-page{position:absolute;inset:0;background:radial-gradient(ellipse at center,#f4e8cc 0%,#e8d5a8 92%,#d9c288 100%);border-radius:6px;box-shadow:0 12px 40px rgba(0,0,0,.65),inset 0 0 50px rgba(139,90,40,.1);padding:6px;overflow-y:auto;filter:sepia(6%);-webkit-overflow-scrolling:touch}
.grim-flip-anim{transform-origin:left center;transition:transform 700ms cubic-bezier(.42,0,.2,1);backface-visibility:hidden;box-shadow:0 12px 40px rgba(0,0,0,.65),inset 0 0 50px rgba(139,90,40,.1)}
.grim-flip-next{animation:grim-flip-next 700ms cubic-bezier(.42,0,.2,1) forwards}
.grim-flip-prev{animation:grim-flip-prev 700ms cubic-bezier(.42,0,.2,1) forwards;transform-origin:right center}
@keyframes grim-flip-next{from{transform:rotateY(0);box-shadow:0 12px 40px rgba(0,0,0,.65)}to{transform:rotateY(-170deg);box-shadow:-20px 12px 40px rgba(0,0,0,.75)}}
@keyframes grim-flip-prev{from{transform:rotateY(0)}to{transform:rotateY(170deg)}}
/* Typography inside page */
.grim-page-content{font-family:'DM Sans',sans-serif;color:#3d2817;font-size:15px;line-height:1.65;display:flex;flex-direction:column;min-height:100%;box-sizing:border-box;border:1px solid rgba(139,90,40,.22);border-radius:3px;padding:20px 16px 34px}
.grim-chapter-title{font-family:'Cinzel','Outfit',serif;font-size:21px;font-weight:700;text-align:center;margin-bottom:6px;color:#6b3410;letter-spacing:1.2px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid rgba(107,52,16,.28)}
.grim-chapter-intro{font-style:italic;text-align:center;color:#6b4820;margin-bottom:18px;font-size:13.5px;line-height:1.55}
.grim-heading{font-family:'Cinzel','Outfit',serif;font-size:16px;font-weight:700;color:#6b3410;margin:18px 0 8px;letter-spacing:.3px;border-left:3px solid #8b5a28;padding-left:10px}
.grim-paragraph{margin-bottom:11px}
.grim-rule{background:rgba(139,90,40,.08);border-left:3px solid #8b5a28;border-radius:4px;padding:9px 13px;margin:11px 0}
.grim-rule-label{font-family:'Cinzel','Outfit',serif;font-weight:800;color:#6b3410;font-size:11px;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px}
.grim-rule-formula{font-family:'Courier New',monospace;font-size:13.5px;color:#3d2817;font-style:italic}
.grim-example{background:rgba(255,255,255,.38);border-radius:6px;padding:9px 12px;margin:9px 0;border-left:2px solid rgba(139,90,40,.4)}
.grim-example-en{font-weight:600;color:#2a1a08;font-size:14.5px}
.grim-example-fr{color:#6b4820;font-size:12.5px;margin-top:3px;font-style:italic}
.grim-example-note{color:#8b5a28;font-size:11.5px;margin-top:5px;padding-top:5px;border-top:1px dashed rgba(139,90,40,.25);line-height:1.5}
.grim-trap{background:rgba(200,50,50,.1);border:1px solid rgba(200,50,50,.32);border-radius:6px;padding:10px 13px;margin:12px 0;color:#6b1a1a;font-size:13px;line-height:1.5}
.grim-trap::before{content:"⚠  ";font-weight:800;color:#b02020;margin-right:2px}
.grim-table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12.5px}
.grim-table th{background:rgba(139,90,40,.18);color:#3d2817;font-weight:800;padding:7px 8px;border:1px solid rgba(139,90,40,.3);text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.3px}
.grim-table td{padding:6px 8px;border:1px solid rgba(139,90,40,.22);color:#3d2817;background:rgba(255,255,255,.22)}
.grim-list{margin:6px 0 12px 18px;padding:0}
.grim-list li{margin-bottom:5px;line-height:1.55}
.grim-page-num{margin-top:auto;padding-top:24px;text-align:center;font-family:'Cinzel','Outfit',serif;color:#6b4820;font-size:11px;opacity:.65;letter-spacing:2px;pointer-events:none}
.grim-nav{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px calc(10px + env(safe-area-inset-bottom, 0px));background:rgba(0,0,0,.7);border-top:1px solid rgba(245,223,170,.15);flex-shrink:0}
.grim-nav-btn{background:linear-gradient(135deg,#8b5a28,#6b3410);color:#f5dfaa;border:1px solid rgba(245,223,170,.3);border-radius:12px;padding:11px 14px;font-weight:700;font-size:13px;cursor:pointer;min-width:80px;touch-action:manipulation}
.grim-nav-btn:disabled{opacity:.3;cursor:not-allowed}
.grim-nav-info{color:#f5dfaa;font-family:'DM Sans',sans-serif;font-size:12px;flex:1;text-align:center;letter-spacing:.4px}
.grim-toc{position:absolute;inset:0;background:rgba(10,6,4,.97);z-index:20;padding:calc(20px + env(safe-area-inset-top, 0px)) 18px 20px;overflow-y:auto;animation:grim-fade-in .2s ease}
.grim-toc-title{color:#f5dfaa;font-family:'Cinzel','Outfit',serif;font-size:18px;font-weight:700;text-align:center;margin-bottom:16px;letter-spacing:1px}
.grim-toc-item{display:block;width:100%;background:rgba(245,223,170,.06);color:#f5dfaa;border:1px solid rgba(245,223,170,.15);border-radius:10px;padding:12px 14px;margin-bottom:7px;text-align:left;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.35}
.grim-toc-item.active{background:rgba(245,223,170,.18);border-color:rgba(245,223,170,.45)}
@media(max-width:480px){
  .grim-page{padding:6px;border-radius:4px}
  .grim-chapter-title{font-size:18px;letter-spacing:1px}
  .grim-heading{font-size:15px}
  .grim-page-content{font-size:14px;line-height:1.6;padding:16px 12px 30px}
  .grim-paragraph{margin-bottom:10px}
  .grim-example-en{font-size:13.5px}
  .grim-table{font-size:11.5px}
  .grim-table th,.grim-table td{padding:5px 6px}
  .gauntlet-card{padding:14px 13px}
  .gauntlet-card-icon{font-size:32px}
  .gauntlet-card-name{font-size:15.5px}
  .grim-nav-btn{padding:10px 12px;font-size:12.5px;min-width:72px}
  .grim-btn-close,.grim-btn-toc{padding:7px 10px;font-size:11.5px}
  .grim-title{font-size:13px}
}
`;
