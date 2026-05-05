// =============================================================
// narrator.js — Système narratif "Aldric"
// TOEIC Arena — 8 moments-clés narratifs
//
// Chaque moment est déclenché par un trigger spécifique dans App.jsx,
// puis joué via <NarratorOverlay> (popup parchemin plein écran).
// Les MP3 sont dans public/audio/narrator/, les JPG dans public/images/narrator/.
//
// Policy langue : AUDIO en anglais (voix Old Wizard, immersion TOEIC),
// SOUS-TITRES en français pour alléger la charge cognitive des étudiants
// francophones — même logique que les grimoires (théorie = FR, entraînement
// = EN). Les sous-titres doublent la voix d'Aldric sans la traduire mot-à-mot :
// l'objectif est le sens et l'émotion, pas la transcription littérale.
//
// Timings calés sur les durées réelles des MP3 (ffprobe, 2026-04-24) :
// les change-points `to` correspondent aux pauses effectives de la voix
// Old Wizard dans chaque fichier. `durationSec` = durée exacte du MP3.
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
    // Étendu 2026-05-03 : le Verdict absorbe la fonction du TutorialTour (supprimé).
    // Aldric présente lui-même les 3 piliers de l'app après son speech d'entrée :
    // Daily Quest ("cinq lames rapides") → Salle d'Entraînement → Ligue.
    // Timings calés sur silencedetect (-30dB, d=0.35) du MP3 régénéré 2026-05-03.
    durationSec: 58.12,
    subtitles: [
      { from: 0.00,  to: 4.02,  text: "Ainsi. Tu es venu jusqu'à l'Arène." },
      { from: 4.02,  to: 5.99,  text: "Bien peu franchissent ses portes." },
      { from: 5.99,  to: 13.63, text: "J'ai vu mille écuyers lever leur lame pour la première fois — les uns avec ferveur, les autres avec crainte." },
      { from: 13.63, to: 17.32, text: "Je vois les deux en toi. C'est bien." },
      { from: 17.32, to: 22.19, text: "La route commence ici. Marche-la avec honneur." },
      { from: 22.19, to: 28.03, text: "Chaque aube, l'Arène te lancera une épreuve — cinq lames rapides." },
      { from: 28.03, to: 33.03, text: "Honore-la chaque jour ; les braises de ta discipline en dépendent." },
      { from: 33.03, to: 35.71, text: "Au-delà s'ouvre la Salle d'Entraînement." },
      { from: 35.71, to: 43.21, text: "Chaque lame, chaque parchemin à maîtriser — avant les Batailles d'Épreuve, puis l'Arène Finale." },
      { from: 43.21, to: 47.87, text: "Et sache ceci — tu ne gravis pas seul." },
      { from: 47.87, to: 53.89, text: "Chaque semaine, la Ligue désignera ceux qui se sont élevés… et ceux qui ont dormi." },
      { from: 53.89, to: 58.12, text: "À présent, va, écuyer. Ta première aube t'attend." }
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
    durationSec: 15.15,
    subtitles: [
      { from: 0.0,  to: 2.0,   text: "Ton premier trophée." },
      { from: 2.0,  to: 7.0,   text: "Modeste, peut-être. Mais chaque coffre que tu ouvriras commence par celui-ci." },
      { from: 7.0,  to: 10.0,  text: "Souviens-toi de son poids." },
      { from: 10.0, to: 15.15, text: "Tous les trésors des champions débutent par un simple écrin." }
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
    durationSec: 16.85,
    subtitles: [
      { from: 0.0,  to: 2.0,   text: "Tu as gravi." },
      { from: 2.0,  to: 7.0,   text: "Le premier pas hors du Bronze est le plus rude — tu as dû prouver ta place plus haut." },
      { from: 7.0,  to: 8.0,   text: "Tu l'as fait." },
      { from: 8.0,  to: 14.0,  text: "Mais retiens ceci, guerrier — chaque rang au-dessus t'observera de plus près." },
      { from: 14.0, to: 16.85, text: "Mérite ta place à nouveau, chaque semaine." }
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
    durationSec: 17.01,
    subtitles: [
      { from: 0.0,  to: 2.0,   text: "Sept jours." },
      { from: 2.0,  to: 6.0,   text: "Chaque matin, tu as choisi l'Arène plutôt que le confort." },
      { from: 6.0,  to: 8.0,   text: "Bien peu tiennent trois jours." },
      { from: 8.0,  to: 13.0,  text: "Le talent allume l'étincelle, guerrier — mais la discipline est le feu qui brûle." },
      { from: 13.0, to: 17.01, text: "Tu l'as attisé. À présent, garde-le vivant." }
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
    durationSec: 21.55,
    subtitles: [
      { from: 0.0,  to: 2.0,   text: "Tu as affronté la bête." },
      { from: 2.0,  to: 8.0,   text: "Ni dans la légende, ni à l'entraînement — face à face." },
      { from: 8.0,  to: 13.0,  text: "Quel que soit le score, sache ceci : tu sais désormais ce que l'on ressent." },
      { from: 13.0, to: 18.0,  text: "Cela vaut plus que le chiffre sur ton parchemin." },
      { from: 18.0, to: 21.55, text: "Reviens quand tu seras prêt. La bête t'attendra." }
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
    durationSec: 20.19,
    subtitles: [
      { from: 0.0,  to: 2.0,   text: "Dix niveaux." },
      { from: 2.0,  to: 5.0,   text: "Le chiffre paraît modeste, je sais." },
      { from: 5.0,  to: 9.0,   text: "Mais regarde l'écuyer qui dégaina pour la première fois dans mon Arène." },
      { from: 9.0,  to: 12.0,  text: "Il n'est plus." },
      { from: 12.0, to: 15.0,  text: "Devant moi se tient quelqu'un qui s'exerce." },
      { from: 15.0, to: 18.0,  text: "Que l'Arène reconnaît." },
      { from: 18.0, to: 20.19, text: "Porte cela en silence." }
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
    durationSec: 20.43,
    subtitles: [
      { from: 0.0,  to: 3.0,   text: "Ce coffre n'est pas comme les autres." },
      { from: 3.0,  to: 10.0,  text: "Il fut scellé bien avant ta naissance, en attente de mains dignes d'en soulever le couvercle." },
      { from: 10.0, to: 13.0,  text: "Bien des coffres traverseront ta vie, guerrier." },
      { from: 13.0, to: 18.0,  text: "Quelques-uns — quelques-uns seulement — resteront en ta mémoire." },
      { from: 18.0, to: 20.43, text: "Celui-ci en fait partie." }
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
    durationSec: 24.11,
    subtitles: [
      { from: 0.0,  to: 1.0,   text: "Ainsi." },
      { from: 1.0,  to: 5.0,   text: "Tu es entré dans l'Arène finale, et tu en es ressorti." },
      { from: 5.0,  to: 8.0,   text: "Peu y parviennent." },
      { from: 8.0,  to: 11.0,  text: "Je ne louerai pas ton score —" },
      { from: 11.0, to: 13.0,  text: "tu le connais déjà." },
      { from: 13.0, to: 18.0,  text: "Celui qui a pénétré cette arène n'est plus celui qui se tient devant moi." },
      { from: 18.0, to: 24.11, text: "Repose-toi, champion. Les portes demeurent ouvertes. Elles le seront toujours." }
    ]
  },
  mentor_intro: {
    id: "mentor_intro",
    order: 99,           // hors canon : "Side Chronicle", n'apparaît pas dans NARRATOR_ORDER
    chapter: "Aside",
    chapterTitle: "The Mentor's Compass",
    title: "The Compass",
    subtitle: "Aldric speaks",
    // Personalization Phase 1 (2026-05-05 PM) — audio + image livrés.
    // Voix Old Wizard (EN) ; sous-titres FR alignés sur les pauses réelles
    // mesurées via silencedetect (-30dB, d=0.35) sur le MP3 régénéré.
    audio: "/audio/narrator/09_mentor_intro.mp3",
    image: "/images/narrator/09_mentor_intro.jpg",
    durationSec: 21.47,
    subtitles: [
      { from: 0.00,  to: 1.79,  text: "Écuyer." },
      { from: 1.79,  to: 4.93,  text: "Nul ne triomphe sans un guide." },
      { from: 4.93,  to: 6.99,  text: "Je serai le tien." },
      { from: 6.99,  to: 12.24, text: "Là où d'autres frappent à l'aveugle, tu sauras où porter ta lame." },
      { from: 12.24, to: 17.73, text: "Cet endroit révèle ton point faible — et te désigne le chemin." },
      { from: 17.73, to: 18.96, text: "Va." },
      { from: 18.96, to: 21.47, text: "Que ta route soit plus courte que ne fut la mienne." }
    ]
  }
};

// Ordre canonique (utile pour la section Chronicles dans le profil)
// mentor_intro est volontairement EXCLU : c'est un Side Chronicle, pas
// un chapitre de l'arc principal Awakening → Dragon.
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
