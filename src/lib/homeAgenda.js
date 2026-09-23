// Ce que la journée demande, dans l'ordre, pour la Home « une porte » (proto prototypes/home-focus/,
// variante B choisie par Jérémy le 2026-09-23). Pur : tests/check_home_agenda.cjs.
//
// Ordre = celui de l'ancien pulse unique de Home : coffre > Mock > mission du jour > autres quêtes du
// plan figé. Le premier non fait devient LE bouton de Home, les suivants « Also today ». Le Daily
// Challenge n'y entre PAS : il reste un bloc à part (décision du 2026-09-23).
// Sans fonction dans les entrées (testable en Node) : Home y branche la navigation par `kind` / `mod`.
import { questView } from "./mentorVoice.js";
import { todayMission, questDone, thawQuest } from "./planner.js";
import { needsMockNudge } from "./progress.js";
import { today } from "./util.js";

// Coffre et Mock : avant toute quête du plan.
function isHead(x) { return x.id === "chest" || x.id === "mock"; }

export function homeAgenda(u, now, pendingChests) {
  now = now || new Date();
  var items = [], m = todayMission(u, now);
  if (pendingChests > 0) items.push({ id: "chest", kind: "chest", icon: "chest", eyebrow: "Waiting for you", reward: "",
    title: pendingChests > 1 ? "Open your " + pendingChests + " chests" : "Open your chest", sub: "Rewards are already inside", done: false });
  if (needsMockNudge(u)) items.push({ id: "mock", kind: "nav", mod: "mock1", icon: "scroll-unfurled", eyebrow: "First step", reward: "",
    title: "Take your first Mock Test", sub: "Measures your real level · unlocks your TOEIC score", done: false });
  if (m && m.quests.length) {
    var pick = m.pick || 0;
    m.quests.forEach(function (raw, i) {
      var q = thawQuest(raw, u, now), v = questView(q, u, i === pick), mission = i === pick;
      var it = { id: mission ? "mission" : "q" + i, kind: "nav", mod: q.mod, icon: v.icon,
        eyebrow: mission ? "Daily mission" : "Today's path", reward: mission ? "+15 XP" : "",
        title: v.title, sub: v.tag, done: mission ? !!m.done : questDone(u, m, i, now) };
      // La mission passe devant les autres quêtes, quelle que soit sa place dans le plan (re-tirage).
      if (mission) items.splice(items.filter(isHead).length, 0, it);
      else items.push(it);
    });
  }
  return items;
}

// Ce que Home montre : le bouton, deux lignes « Also today », et combien d'autres restent sur le chemin.
export function homeFocus(u, now, pendingChests) {
  var items = homeAgenda(u, now, pendingChests), todo = items.filter(function (x) { return !x.done; });
  var m = todayMission(u, now || new Date());
  return {
    hero: todo[0] || null, also: todo.slice(1, 3), more: Math.max(0, todo.length - 3),
    hasPath: !!(m && m.quests.length),
    pathDone: !!(m && m.quests.length) && items.every(function (x) { return isHead(x) || x.done; }),
  };
}

// Bonus en cours, en une ligne de texte (remplace les pastilles colorées de l'ancienne Home).
export function bonusLine(u, now) {
  now = now || new Date();
  var out = [], dow = now.getDay();
  if (dow === 0 || dow === 6) out.push("×2 weekend");
  if (u.streak >= 7) out.push("×1.5 streak"); else if (u.streak >= 3) out.push("×1.2 streak");
  if (u.lastActive !== today(now)) out.push("+10 login");
  return out.join(" · ");
}
