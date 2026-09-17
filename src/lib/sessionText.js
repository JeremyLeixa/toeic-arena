// Textes de l'écran de fin de session « Verdict d'Aldric » (2026-09-17, proto prototypes/victory/).
// PUR : aucun JSX, aucun import impur (les tests peuvent le requérir). Anglais (appli principale).
// Les étapes viennent de lib/xp.js : gateSteps(...).steps puis settleXp(...).steps, plus l'étape
// « mission » ajoutée par App.jsx quand checkMission crédite ses +15 XP.
import { LEAGUES } from "../data/leagues.js";

// Bande de résultat (score sur total). Sans total (jeux notés en points ou au temps) : "fair".
export function resultBand(sc, tot) {
  if (!tot) return "fair";
  var a = sc / tot;
  return a >= 1 ? "perfect" : a >= 0.8 ? "great" : a >= 0.5 ? "fair" : "hard";
}

// Verdict d'Aldric, une phrase selon la bande. mode "points"/"time" : pas de score sur total.
export function verdictText(o) {
  var name = o.name || "warrior";
  if (o.mode === "points" || o.mode === "time") return "A spirited run, " + name + ". The Arena keeps count of every point.";
  var b = resultBand(o.sc, o.tot);
  if (b === "perfect") return "A flawless round, " + name + ". Not a single blow wasted.";
  if (b === "great") return o.sc + " of " + o.tot + " strikes landed true. Your blade grows sharper.";
  if (b === "fair") return "A fair fight, " + name + ". The Arena has marked where you faltered.";
  return "A hard battle, " + name + ". Even veterans fall before they rise.";
}

function leagueName(id) {
  for (var i = 0; i < LEAGUES.length; i++) if (LEAGUES[i].id === id) return LEAGUES[i].name;
  return id;
}

// Épilogue écrit sous le parchemin : courbe du jour, niveau, ligue. Chaîne vide si rien à dire.
export function epilogueText(session) {
  if (!session) return "";
  var t = [];
  var steps = session.steps || [];
  if (steps.some(function (st) { return st.id === "farm"; })) t.push("This trial was already fought today: the Arena pays fresh steel best.");
  if (session.levelUp) t.push("You now stand at level " + session.levelUp.to + ".");
  if (session.leagueUp) t.push("The stands take notice: you rise to the " + leagueName(session.leagueUp.to) + " League.");
  return t.join(" ");
}

function ordinal(n) {
  var s = n % 100;
  if (s >= 11 && s <= 13) return n + "th";
  return n + (n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th");
}

// Libellé d'une étape (colonne de gauche de la ligne à l'encre).
export function stepLabel(st) {
  switch (st.id) {
    case "base": return "Base";
    case "accuracy": return st.mult === 0.1 ? "Accuracy under 30%" : "Accuracy under 50%";
    case "farm": return ordinal(st.run || 2) + " run today";
    case "bypass": return "Bypass Token";
    case "focus": return "Today's Focus";
    case "module_boost": return "Module Booster";
    case "mock_mult": return "Mock Multiplier";
    case "spotlight": return "Spotlight event";
    case "floor": return "Floor";
    case "weekend": return "Weekend";
    case "streak": return "Streak " + st.days + " days";
    case "flash_hour": return "Flash Hour";
    case "underdog": return "Underdog";
    case "daily_doubler": return "Daily Doubler";
    case "first_today": return "First session today";
    case "mission": return "Daily mission";
    default: return st.id;
  }
}

// Petit détail à côté du libellé : "8 correct", "×0.5", "+25%", "+10".
export function stepDetail(st, o) {
  o = o || {};
  if (st.id === "base") return o.mode === "points" || o.mode === "time" ? "" : (o.sc != null ? o.sc + " correct" : "");
  if (st.id === "bypass") return "no daily limit";
  if (st.id === "floor") return "min 0";
  if (st.add) return "+" + st.add;
  if (st.id === "focus") return "+25%";
  if (st.mult) return "×" + st.mult;
  return "";
}

// Conseil sous le total quand une réduction s'est appliquée (la plus récente l'emporte).
export function stepHint(steps) {
  var hint = null;
  (steps || []).forEach(function (st) {
    if (st.id === "accuracy") hint = "Score 50% or more for full XP.";
    if (st.id === "farm") hint = "Full XP again tomorrow, or on another module today.";
  });
  return hint;
}

export var CHEST_TIER_NAMES = ["Novice", "Warrior", "Champion", "Legendary"];
