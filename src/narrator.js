// =============================================================
// narrator.js — Système narratif "Aldric"
// TOEIC Arena — 8 moments-clés narratifs
//
// Chaque moment est déclenché par un trigger spécifique dans App.jsx,
// puis joué via <NarratorOverlay> (popup parchemin plein écran).
// Les MP3 sont dans public/audio/narrator/, les JPG dans public/images/narrator/.
// =============================================================

export var NARRATOR_MOMENTS = {
  verdict: {
    id: "verdict",
    order: 1,
    chapter: "Chapter I",
    chapterTitle: "The Awakening",
    title: "The Verdict",
    subtitle: "Aldric speaks",
    audio: "/audio/narrator/01_verdict.mp3",
    image: "/images/narrator/01_verdict.jpg",
    durationSec: 18,
    // Sous-titres découpés phrase par phrase avec timing approximatif (secondes)
    // Ces timings sont calibrés sur la voix Old Wizard v3 avec les pauses du texte source
    subtitles: [
      { from: 0.0,  to: 3.5,  text: "So. You've come to the Arena." },
      { from: 3.5,  to: 5.5,  text: "Most never do." },
      { from: 5.5,  to: 11.0, text: "I've watched a thousand squires raise their blade for the first time — some with fire, some with fear." },
      { from: 11.0, to: 13.5, text: "I see both in you. Good." },
      { from: 13.5, to: 18.0, text: "The road begins here. Walk it well." }
    ]
  },
  first_chest: {
    id: "first_chest",
    order: 2,
    chapter: "Chapter II",
    chapterTitle: "The First Trophy",
    title: "The First Chest",
    subtitle: "Aldric speaks",
    audio: "/audio/narrator/02_first_chest.mp3",
    image: "/images/narrator/02_first_chest.jpg",
    durationSec: 12,
    subtitles: [
      { from: 0.0, to: 2.5,  text: "Your first trophy." },
      { from: 2.5, to: 7.0,  text: "Small, maybe. But every chest you'll ever open starts with this one." },
      { from: 7.0, to: 9.0,  text: "Remember its weight." },
      { from: 9.0, to: 12.0, text: "The coffers of champions all began as a single, unassuming box." }
    ]
  },
  rising_rank: {
    id: "rising_rank",
    order: 3,
    chapter: "Chapter III",
    chapterTitle: "The Ascent",
    title: "The Rising Rank",
    subtitle: "Aldric speaks",
    audio: "/audio/narrator/03_rising_rank.mp3",
    image: "/images/narrator/03_rising_rank.jpg",
    durationSec: 15,
    subtitles: [
      { from: 0.0,  to: 2.0,  text: "You've climbed." },
      { from: 2.0,  to: 7.0,  text: "The first step out of Bronze is the hardest — you had to prove you belonged somewhere higher." },
      { from: 7.0,  to: 8.5,  text: "You've done it." },
      { from: 8.5,  to: 12.5, text: "But mark this, warrior — every rank above will watch you more closely." },
      { from: 12.5, to: 15.0, text: "Earn your place again, every week." }
    ]
  },
  oath_of_fire: {
    id: "oath_of_fire",
    order: 4,
    chapter: "Chapter IV",
    chapterTitle: "The Oath",
    title: "The Oath of Fire",
    subtitle: "Aldric speaks",
    audio: "/audio/narrator/04_oath_of_fire.mp3",
    image: "/images/narrator/04_oath_of_fire.jpg",
    durationSec: 13,
    subtitles: [
      { from: 0.0,  to: 2.0,  text: "Seven days." },
      { from: 2.0,  to: 6.0,  text: "Every morning, you chose the Arena over comfort." },
      { from: 6.0,  to: 7.5,  text: "Most never last three." },
      { from: 7.5,  to: 11.0, text: "Talent lights the spark, warrior — but discipline is the fire that burns." },
      { from: 11.0, to: 13.0, text: "You've kindled it. Now, keep it alive." }
    ]
  },
  first_combat: {
    id: "first_combat",
    order: 5,
    chapter: "Chapter V",
    chapterTitle: "The Beast",
    title: "The First Combat",
    subtitle: "Aldric speaks",
    audio: "/audio/narrator/05_first_combat.mp3",
    image: "/images/narrator/05_first_combat.jpg",
    durationSec: 16,
    subtitles: [
      { from: 0.0,  to: 2.5,  text: "You faced the beast." },
      { from: 2.5,  to: 6.5,  text: "Not in legend, not in training — face to face." },
      { from: 6.5,  to: 10.5, text: "Whatever the score, know this: you now know what it feels like." },
      { from: 10.5, to: 13.0, text: "That is worth more than the number on your parchment." },
      { from: 13.0, to: 16.0, text: "Return when you're ready. The beast will be waiting." }
    ]
  },
  dawn_rank: {
    id: "dawn_rank",
    order: 6,
    chapter: "Chapter VI",
    chapterTitle: "The Dawn",
    title: "The Dawn Rank",
    subtitle: "Aldric speaks",
    audio: "/audio/narrator/06_dawn_rank.mp3",
    image: "/images/narrator/06_dawn_rank.jpg",
    durationSec: 15,
    subtitles: [
      { from: 0.0,  to: 2.0,  text: "Ten levels." },
      { from: 2.0,  to: 5.0,  text: "The number seems small, I know." },
      { from: 5.0,  to: 9.0,  text: "But look back at the squire who first drew a blade in my Arena." },
      { from: 9.0,  to: 11.0, text: "That person is gone." },
      { from: 11.0, to: 13.5, text: "What stands before me now is someone who practices. Someone the Arena recognizes." },
      { from: 13.5, to: 15.0, text: "Carry that quietly." }
    ]
  },
  legacy: {
    id: "legacy",
    order: 7,
    chapter: "Chapter VII",
    chapterTitle: "The Legacy",
    title: "The Legacy",
    subtitle: "Aldric speaks",
    audio: "/audio/narrator/07_legacy.mp3",
    image: "/images/narrator/07_legacy.jpg",
    durationSec: 15,
    subtitles: [
      { from: 0.0,  to: 3.5,  text: "This chest is not like the others." },
      { from: 3.5,  to: 8.5,  text: "It was sealed long before you were born, waiting for hands worthy enough to lift its lid." },
      { from: 8.5,  to: 11.5, text: "Many chests will pass through your life, warrior." },
      { from: 11.5, to: 13.5, text: "A few, only a few, you will remember." },
      { from: 13.5, to: 15.0, text: "This is one of them." }
    ]
  },
  dragon: {
    id: "dragon",
    order: 8,
    chapter: "Chapter VIII",
    chapterTitle: "The Dragon",
    title: "The Dragon",
    subtitle: "Aldric speaks",
    audio: "/audio/narrator/08_dragon.mp3",
    image: "/images/narrator/08_dragon.jpg",
    durationSec: 18,
    subtitles: [
      { from: 0.0,  to: 2.0,  text: "So." },
      { from: 2.0,  to: 6.0,  text: "You walked into the Final Arena, and you walked out." },
      { from: 6.0,  to: 7.5,  text: "Few do." },
      { from: 7.5,  to: 11.0, text: "I will not praise the score — you already know it." },
      { from: 11.0, to: 15.0, text: "The one who entered that arena is not the one standing before me now." },
      { from: 15.0, to: 18.0, text: "Rest, champion. The gates remain open. They always will." }
    ]
  }
};

// Ordre canonique (utile pour la section Chronicles dans le profil)
export var NARRATOR_ORDER = [
  "verdict", "first_chest", "rising_rank", "oath_of_fire",
  "first_combat", "dawn_rank", "legacy", "dragon"
];

// Helper : vérifier si un moment a déjà été entendu
export function hasHeardMoment(u, momentId) {
  if (!u || !u.narrator || !u.narrator.heard) return false;
  return u.narrator.heard.indexOf(momentId) !== -1;
}

// Helper : marquer un moment comme entendu (mutation retournée, caller doit save)
export function markMomentHeard(u, momentId) {
  if (!u.narrator) u.narrator = { heard: [], muted: false };
  if (!u.narrator.heard) u.narrator.heard = [];
  if (u.narrator.heard.indexOf(momentId) === -1) {
    u.narrator.heard.push(momentId);
  }
  return u;
}
