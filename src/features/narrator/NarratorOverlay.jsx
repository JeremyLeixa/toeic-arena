// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { GIcon } from "../../components/icons.jsx";
import { useRef, useState, useEffect } from "react";

// ─── NARRATOR OVERLAY — Aldric's 8 narrative moments ───
// Full-screen parchment popup with voice-over + subtitles + illustration.
// Triggered via app-level narratorQueue. Dismissable at any time via Continue/Skip.
//
// Playback flow:
//   1. On mount, a black layer fades out over ~800ms (cinematic "fade from black").
//   2. 1s after mount, we attempt audio.play() automatically. On mobile Safari
//      without a recent user gesture (parcours triggers), the browser may block
//      playback — the catch() logs a warning and the user can click Play
//      manually. On desktop/Android/iOS-with-gesture the autoplay succeeds.
//   3. Muted mode simulates subtitle timing via setInterval so visuals still play.
export function NarratorOverlay(props) {
  var moment = props.moment;
  var onClose = props.onClose;
  // textOnly moments (no audio/image generated yet) reuse the muted timer path :
  // synthetic currentTime advance drives the subtitle reveal without any <audio>.
  var muted = props.muted || (moment && moment.textOnly) || false;

  var audioRef = useRef(null);
  var autoplayTimerRef = useRef(null);
  var closeTimerRef = useRef(null);
  var [playing, setPlaying] = useState(false);
  var [currentTime, setCurrentTime] = useState(0);
  var [duration, setDuration] = useState(moment ? moment.durationSec : 0);
  var [closing, setClosing] = useState(false);

  // Reset internal timer state whenever the moment changes (replay from Chronicles).
  // Also schedules the 1s autoplay attempt.
  useEffect(function(){
    setPlaying(false);
    setCurrentTime(0);
    setDuration(moment ? moment.durationSec : 0);
    setClosing(false);
    if(autoplayTimerRef.current){clearTimeout(autoplayTimerRef.current);autoplayTimerRef.current=null;}
    if(closeTimerRef.current){clearTimeout(closeTimerRef.current);closeTimerRef.current=null;}
    if(!moment || muted) return;
    // 2s delay lets the parchment fade-in AND the BGM fade-out complete
    // before the voice kicks in. The narrator-bgm useEffect in main App
    // calls stopBGM() (~600ms fade) the moment this overlay mounts, so by
    // T+2s we have full silence under the voice. (was 1s pre-2026-05-05
    // when BGM ducking wasn't wired — bumped for cleaner audio mix.)
    autoplayTimerRef.current = setTimeout(function(){
      var audio = audioRef.current;
      if(!audio) return;
      audio.play().then(function(){setPlaying(true);})
        .catch(function(err){console.warn("[narrator] autoplay blocked:", err&&err.message);});
    }, 2000);
    return function(){
      if(autoplayTimerRef.current){clearTimeout(autoplayTimerRef.current);autoplayTimerRef.current=null;}
    };
  },[moment && moment.id, muted]);

  // Find the active subtitle based on currentTime
  var activeSub = null;
  if (moment && moment.subtitles) {
    for (var i = 0; i < moment.subtitles.length; i++) {
      var s = moment.subtitles[i];
      if (currentTime >= s.from && currentTime < s.to) { activeSub = s; break; }
    }
    if (!activeSub && currentTime >= moment.subtitles[moment.subtitles.length - 1].from) {
      activeSub = moment.subtitles[moment.subtitles.length - 1];
    }
    if (!activeSub) activeSub = moment.subtitles[0];
  }

  // Audio event handlers
  useEffect(function() {
    var audio = audioRef.current;
    if (!audio) return;
    function onTime() { setCurrentTime(audio.currentTime); }
    function onLoaded() { if (audio.duration && !isNaN(audio.duration)) setDuration(audio.duration); }
    function onEnd() { setPlaying(false); }
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    return function() {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
    };
  }, [moment && moment.id]);

  // Muted auto-mode: simulate subtitle advance so visuals still play in silent mode
  useEffect(function() {
    if (!muted || !moment) return;
    var startTime = Date.now();
    var iv = setInterval(function() {
      var elapsed = (Date.now() - startTime) / 1000;
      setCurrentTime(elapsed);
      if (elapsed >= moment.durationSec) clearInterval(iv);
    }, 100);
    return function() { clearInterval(iv); };
  }, [muted, moment && moment.id]);

  function togglePlay() {
    var audio = audioRef.current;
    if (!audio || muted) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else {
      audio.play().then(function() { setPlaying(true); })
        .catch(function(err) { console.warn("[narrator] play failed:", err && err.message); });
    }
  }

  function handleClose() {
    if (closing) return; // already in progress — ignore double-click
    var audio = audioRef.current;
    if (audio) { try{audio.pause(); audio.currentTime = 0;}catch(e){console.warn("[narrator] close pause caught:", e&&e.message);} }
    // Stop the pending autoplay if the user closes before it fires
    if(autoplayTimerRef.current){clearTimeout(autoplayTimerRef.current);autoplayTimerRef.current=null;}
    setClosing(true);
    // Keep animation in sync with the narratorFadeToBlack keyframe duration
    closeTimerRef.current = setTimeout(function(){ onClose(); }, 500);
  }

  if (!moment) return null;

  var progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  var mmss = function(t) {
    var m = Math.floor(t / 60);
    var s = Math.floor(t % 60);
    return m + ":" + (s < 10 ? "0" + s : s);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(10,8,5,0.92)",
      zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px 12px",
      animation: "fadeIn 0.4s ease-out"
    }} onClick={function(e) { if (e.target === e.currentTarget) handleClose(); }}>

      {/* Parchment popup */}
      <div style={{
        width: "100%", maxWidth: 380,
        background: "radial-gradient(ellipse at 30% 20%, #e8d4a8 0%, #d4bc85 40%, #b89965 80%, #8a7040 100%)",
        borderRadius: 6,
        padding: "20px 22px 24px",
        position: "relative",
        boxShadow: "0 0 0 1px #6a5230, 0 10px 40px rgba(0,0,0,0.6), inset 0 0 60px rgba(139,94,40,0.2), inset 0 0 120px rgba(90,58,20,0.25)",
        maxHeight: "92vh",
        overflowY: "auto"
      }}>

        <button onClick={handleClose} style={{
          position: "absolute", top: 10, right: 10,
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(90,58,20,0.2)", color: "#5a3a1a",
          border: "1px solid rgba(90,58,20,0.35)",
          fontSize: 14, cursor: "pointer", zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>{"\u00d7"}</button>

        <div className="out" style={{
          textAlign: "center", fontSize: 9, letterSpacing: 3.5,
          color: "#6a4520", textTransform: "uppercase",
          margin: "4px 0 4px", fontWeight: 700
        }}>{moment.chapter + " \u00b7 " + moment.chapterTitle}</div>

        <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14}}>
          <div style={{ flex: 1, maxWidth: 80, height: 1, background: "linear-gradient(90deg,transparent,#8a6530 50%,transparent)" }}/>
          <span style={{ color: /*fond local*/"#8a6530", fontSize: 10 }}>{"\u2756"}</span>
          <div style={{ flex: 1, maxWidth: 80, height: 1, background: "linear-gradient(90deg,transparent,#8a6530 50%,transparent)" }}/>
        </div>

        {/* Illustration — rectangular frame fade via dual linear-gradient mask
            composited with intersect. Each gradient fades one axis, intersected
            they form a vignette that hugs the 4 rectangular edges instead of
            the old oval ellipse.
            For textOnly moments (no Leonardo image generated yet) we fall back
            to a centred wizard-staff SVG sigil — preserves the parchment frame. */}
        {moment.image
          ?<div style={{
              position: "relative", margin: "0 auto 10px",
              width: "100%", maxWidth: 280, aspectRatio: "1/1",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
              maskImage: "linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
              WebkitMaskComposite: "source-in",
              maskComposite: "intersect",
              overflow: "hidden"
            }}>
              <img src={moment.image} alt={moment.title} style={{
                width: "100%", height: "100%", objectFit: "cover",
                mixBlendMode: "multiply",
                filter: "contrast(1.1) brightness(1.02)",
                display: "block"
              }}/>
            </div>
          :<div style={{margin:"0 auto 10px",width:"100%",maxWidth:280,aspectRatio:"1/1",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <GIcon name="wizard-staff" size={120} color="#5a3a1a"/>
            </div>}

        <h2 className="out" style={{
          fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 22,
          textAlign: "center", color: "#4a2e14",
          letterSpacing: 3, margin: "6px 0 2px"
        }}>{moment.title.toUpperCase()}</h2>
        <div style={{
          // #5e3c1a (2026-09-19) : l'ancien #8a6530 tombait à 2,8:1 sur le parchemin (#d4bc85 à cette hauteur
          // du dégradé), 5,3:1 désormais. L'ornement ❖ et les filets gardent #8a6530 : décoratifs.
          textAlign: "center", fontSize: 11, color: /*fond local*/"#5e3c1a",
          fontStyle: "italic", letterSpacing: 1.5, marginBottom: 14
        }}>{"\u2014 " + moment.subtitle + " \u2014"}</div>

        {/* "His words" box — fixed height sized for 3 lines of subtitle at
            fontSize 14 × lineHeight 1.65 (~69px) + header + padding. Keeps
            the parchment layout stable across subtitles of varying length.
            Text is vertically centered via flex so 1-line and 3-line subtitles
            both sit cleanly in the middle. */}
        <div style={{
          padding: "12px 18px", margin: "0 4px 14px",
          height: 118,
          display: "flex", flexDirection: "column",
          borderTop: "1px solid rgba(90,58,20,0.25)",
          borderBottom: "1px solid rgba(90,58,20,0.25)"
        }}>
          <div className="out" style={{
            fontSize: 8, letterSpacing: 2.5, color: /*fond local*/"#5e3c1a",
            textTransform: "uppercase", marginBottom: 6, textAlign: "center", fontWeight: 700,
            flexShrink: 0
          }}>{"\u25c6 His words \u25c6"}</div>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Georgia,serif", fontSize: 14, color: "#3a2410",
            lineHeight: 1.65, fontStyle: "italic", textAlign: "center",
            overflow: "hidden"
          }} key={activeSub ? activeSub.from : "init"}>
            <span>{activeSub ? activeSub.text : ""}</span>
          </div>
        </div>

        {!muted && <div style={{display: "flex", alignItems: "center", gap: 10, margin: "0 4px 12px"}}>
          <button onClick={togglePlay} style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, #d4943a, #8a5e28)",
            border: "1px solid #5a3a1a",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            padding: 0
          }}>
            {playing ? (
              <div style={{ display: "flex", gap: 2 }}>
                <div style={{ width: 3, height: 10, background: "#fff" }}/>
                <div style={{ width: 3, height: 10, background: "#fff" }}/>
              </div>
            ) : (
              <div style={{
                width: 0, height: 0,
                borderStyle: "solid", borderWidth: "5px 0 5px 8px",
                borderColor: "transparent transparent transparent #fff",
                marginLeft: 2
              }}/>
            )}
          </button>
          <div style={{ flex: 1, height: 3, background: "rgba(90,58,20,0.3)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: progressPct + "%",
              background: "linear-gradient(90deg,#8a5e28,#d4943a)", borderRadius: 2
            }}/>
          </div>
          <span className="out" style={{
            fontSize: 10, color: "#6a4520",
            letterSpacing: 1, minWidth: 42, textAlign: "right", fontWeight: 600
          }}>{mmss(currentTime) + " / " + mmss(duration)}</span>
        </div>}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, margin: "0 4px" }}>
          <button onClick={handleClose} style={{
            flex: 1, padding: "9px 12px",
            background: "rgba(232,212,168,0.4)",
            border: "1px solid rgba(90,58,20,0.35)",
            borderRadius: 6, color: "#5a3a1a",
            fontFamily: "'Cinzel',serif", fontSize: 10,
            letterSpacing: 2, textTransform: "uppercase",
            cursor: "pointer", fontWeight: 600
          }}>Skip</button>
          <button onClick={handleClose} style={{
            flex: 1, padding: "9px 12px",
            background: "linear-gradient(135deg,#d4943a,#a87028)",
            border: "1px solid #5a3a1a",
            borderRadius: 6, color: "#1a0f04",
            fontFamily: "'Cinzel',serif", fontSize: 10,
            letterSpacing: 2, textTransform: "uppercase",
            cursor: "pointer", fontWeight: 700,
            boxShadow: "inset 0 1px 0 rgba(255,220,150,0.4), 0 2px 0 rgba(90,58,20,0.3)"
          }}>{"Continue \u2192"}</button>
        </div>

        {!muted && <audio ref={audioRef} src={moment.audio} preload="auto"/>}

      </div>

      {/* Fade layer — fades FROM black on mount (key={moment.id} replays the
          animation on every chapter change), and fades TO black when the
          user dismisses (closing=true). pointerEvents remain none so the
          black layer never swallows clicks during its ~500-800ms animation. */}
      {closing ? (
        <div style={{
          position: "absolute", inset: 0,
          background: "#000",
          animation: "narratorFadeToBlack 0.5s ease-in forwards",
          pointerEvents: "none",
          zIndex: 10000
        }}/>
      ) : (
        <div key={"fade-"+(moment.id||"")} style={{
          position: "absolute", inset: 0,
          background: "#000",
          animation: "narratorFadeFromBlack 0.8s ease-out forwards",
          pointerEvents: "none",
          zIndex: 10000
        }}/>
      )}

    </div>
  );
}
