// Génère les catalogues de l'économie côté serveur depuis src/data/chestCatalog.js (2026-09-24).
// Une seule source : les données du jeu. Le SQL produit n'est JAMAIS édité à la main ; après tout changement
// de SHOP_CATALOG, TOKEN_TYPES ou des cosmétiques, relancer ce script et passer le fichier en prod.
// tests/check_economy_parity.cjs rougit si le fichier généré ne correspond plus aux données.
//
// Usage : node scripts/gen-economy-sql.mjs  → supabase/migrations/2026-09-24_economy_catalog_data.sql
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SHOP_CATALOG, TOKEN_TYPES, AVATARS, SKINS, FRAMES, TITLES, CHEAT_SHEETS, DROP_TABLES, RARITIES,
  LEGENDARY_ACHIEVEMENTS, EPIC_ACHIEVEMENTS, NOVICE_ACHIEVEMENTS } from "../src/data/chestCatalog.js";
import { XP_MILESTONES } from "../src/lib/xp.js";
import { MODULE_TOEIC_MAP } from "../src/lib/toeic.js";
import { MISSION_MODULES } from "../src/data/placement.js";
import { MASTERY_BLACKLIST, tierTrigger } from "../src/lib/hubStatus.js";
import { LEAGUES } from "../src/data/leagues.js";

// Lot 2b : déclencheurs de coffres LÉGITIMES à valeur fixe (le serveur impose type et délai ; les déclencheurs
// datés — connexion du jour, TOEIC de la semaine, podium — et la série de missions sont vérifiés par motif
// dans grant_pending_chest). Toute nouvelle source de coffre s'ajoute ICI, sinon le serveur la refuse.
export const MASTERY_MAX_TIER = 30;
export const WEEKLY_TRIGGERS = [["duel_win", "guerrier"], ["duel_win3", "champion"], ["wfall_combo30", "champion"],
  ["wfall_combo20", "guerrier"], ["wfall_combo10", "novice"], ["smatch_easy_good", "novice"], ["sbuild_90", "novice"],
  ["clue_perfect", "guerrier"], ["ablitz_90", "guerrier"], ["ablitz_70", "novice"],
  ...["irregular", "tense", "passive", "relative"].map((s) => ["gauntlet_" + s + "_perfect", "guerrier"]),
  ...["match", "sort"].map((s) => ["modals_" + s + "_perfect", "guerrier"])];
export function masteryModules() {
  const ids = new Set(Object.keys(MODULE_TOEIC_MAP).concat(MISSION_MODULES.map((m) => m.id), ["endless"]));
  return [...ids].filter((id) => !MASTERY_BLACKLIST[id]).sort();
}
export function chestTriggerRows() {
  const rows = [];
  const add = (t, type, cd) => rows.push({ trigger: t, chest_type: type, cooldown_days: cd == null ? null : cd });
  XP_MILESTONES.forEach(([n, type]) => add("xp_" + (n >= 1000 ? n / 1000 + "k" : n), type));
  add("streak_7", "novice"); add("streak_30", "guerrier"); add("streak_100", "champion");
  LEAGUES.forEach((l) => add("league_up_" + l.id, "guerrier"));
  add("boss_test", "legendaire"); ["1", "2", "3"].forEach((n) => add("mock_" + n, "champion"));
  LEGENDARY_ACHIEVEMENTS.forEach((id) => add("ach_legendary_" + id, "legendaire"));
  EPIC_ACHIEVEMENTS.forEach((id) => add("ach_epic_" + id, "guerrier"));
  NOVICE_ACHIEVEMENTS.forEach((id) => add("ach_novice_" + id, "novice"));
  masteryModules().forEach((mod) => { for (let n = 1; n <= MASTERY_MAX_TIER; n++) add(tierTrigger(mod, n), n === 3 ? "legendaire" : "champion"); });
  WEEKLY_TRIGGERS.forEach(([t, type]) => add(t, type, 7));
  return rows;
}

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "supabase", "migrations", "2026-09-24_economy_catalog_data.sql");
const q = (s) => (s == null ? "NULL" : "'" + String(s).replace(/'/g, "''") + "'");

export function economyRows() {
  const shop = SHOP_CATALOG.map((it) => ({ item_id: it.item_id, category: it.cat, ref_id: it.ref, price: it.price,
    rarity: it.rarity || null, one_shot: !!it.one_shot }));
  const rewards = [];
  [["avatar", AVATARS], ["skin", SKINS], ["frame", FRAMES], ["title", TITLES], ["cheat_sheet", CHEAT_SHEETS]]
    .forEach(([type, table]) => Object.keys(table).forEach((id) => rewards.push({ type, id,
      rarity: table[id].rarity, exclusive: !!table[id].exclusive })));
  const tokens = Object.keys(TOKEN_TYPES).map((t) => ({ type: t, cap: TOKEN_TYPES[t].cap, premium: !!TOKEN_TYPES[t].premium,
    boost: !!TOKEN_TYPES[t].boost }));
  // Lot 2 (coffres) : tables de tirage telles quelles (jsonb), et l'ordre des raretés (seuil minRarity).
  const drops = Object.keys(DROP_TABLES).map((t) => ({ chest_type: t, slots: DROP_TABLES[t] }));
  const rarities = RARITIES.map((r, i) => ({ id: r.id, tier: i }));
  const triggers = chestTriggerRows();
  return { shop, rewards, tokens, drops, rarities, triggers };
}

export const ECONOMY_SQL_FILE = OUT;
export function render({ shop, rewards, tokens, drops, rarities, triggers }) {
  const L = [];
  L.push("-- ════════════════════════════════════════════════════════════════════════");
  L.push("-- FICHIER GÉNÉRÉ par scripts/gen-economy-sql.mjs depuis src/data/chestCatalog.js — NE PAS ÉDITER.");
  L.push("-- Catalogues de l'économie côté serveur (lot 1 du chantier « économie côté serveur », 2026-09-24).");
  L.push("-- Tables SANS accès client (verrou du 2026-09-15) : seules les RPC SECURITY DEFINER les lisent.");
  L.push("-- ════════════════════════════════════════════════════════════════════════");
  L.push("");
  L.push("CREATE TABLE IF NOT EXISTS public.shop_catalog (");
  L.push("  item_id text PRIMARY KEY, category text NOT NULL, ref_id text NOT NULL,");
  L.push("  price integer NOT NULL CHECK (price > 0), rarity text, one_shot boolean NOT NULL);");
  L.push("CREATE TABLE IF NOT EXISTS public.reward_catalog (");
  L.push("  reward_type text NOT NULL, reward_id text NOT NULL, rarity text NOT NULL, exclusive boolean NOT NULL,");
  L.push("  PRIMARY KEY (reward_type, reward_id));");
  L.push("CREATE TABLE IF NOT EXISTS public.token_catalog (");
  L.push("  token_type text PRIMARY KEY, cap integer NOT NULL CHECK (cap > 0), premium boolean NOT NULL, boost boolean NOT NULL);");
  L.push("CREATE TABLE IF NOT EXISTS public.chest_drop_tables (chest_type text PRIMARY KEY, slots jsonb NOT NULL);");
  L.push("CREATE TABLE IF NOT EXISTS public.rarity_catalog (id text PRIMARY KEY, tier integer NOT NULL);");
  L.push("CREATE TABLE IF NOT EXISTS public.chest_triggers (");
  L.push("  trigger text PRIMARY KEY, chest_type text NOT NULL, cooldown_days integer);");
  L.push("");
  ["shop_catalog", "reward_catalog", "token_catalog", "chest_drop_tables", "rarity_catalog", "chest_triggers"].forEach((t) => {
    L.push("ALTER TABLE public." + t + " ENABLE ROW LEVEL SECURITY;");
    L.push("REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public." + t + " FROM anon, authenticated, public;");
  });
  L.push("");
  L.push("BEGIN;");
  L.push("DELETE FROM public.shop_catalog; DELETE FROM public.reward_catalog; DELETE FROM public.token_catalog;");
  L.push("DELETE FROM public.chest_drop_tables; DELETE FROM public.rarity_catalog; DELETE FROM public.chest_triggers;");
  L.push("INSERT INTO public.chest_triggers (trigger, chest_type, cooldown_days) VALUES");
  L.push(triggers.map((r) => "  (" + [q(r.trigger), q(r.chest_type), r.cooldown_days == null ? "NULL" : r.cooldown_days].join(", ") + ")").join(",\n") + ";");
  L.push("INSERT INTO public.chest_drop_tables (chest_type, slots) VALUES");
  L.push(drops.map((d) => "  (" + q(d.chest_type) + ", " + q(JSON.stringify(d.slots)) + "::jsonb)").join(",\n") + ";");
  L.push("INSERT INTO public.rarity_catalog (id, tier) VALUES");
  L.push(rarities.map((r) => "  (" + q(r.id) + ", " + r.tier + ")").join(",\n") + ";");
  L.push("INSERT INTO public.shop_catalog (item_id, category, ref_id, price, rarity, one_shot) VALUES");
  L.push(shop.map((r) => "  (" + [q(r.item_id), q(r.category), q(r.ref_id), r.price, q(r.rarity), r.one_shot].join(", ") + ")").join(",\n") + ";");
  L.push("INSERT INTO public.reward_catalog (reward_type, reward_id, rarity, exclusive) VALUES");
  L.push(rewards.map((r) => "  (" + [q(r.type), q(r.id), q(r.rarity), r.exclusive].join(", ") + ")").join(",\n") + ";");
  L.push("INSERT INTO public.token_catalog (token_type, cap, premium, boost) VALUES");
  L.push(tokens.map((r) => "  (" + [q(r.type), r.cap, r.premium, r.boost].join(", ") + ")").join(",\n") + ";");
  L.push("COMMIT;");
  L.push("");
  L.push("-- token_cap() lit désormais token_catalog (plus de CASE recopié à la main).");
  L.push("CREATE OR REPLACE FUNCTION public.token_cap(p_type text) RETURNS integer");
  L.push("  LANGUAGE sql STABLE SET search_path = public");
  L.push("AS $function$ SELECT cap FROM token_catalog WHERE token_type = p_type $function$;");
  L.push("REVOKE ALL ON FUNCTION public.token_cap(text) FROM public, anon, authenticated;");
  return L.join("\n") + "\n";
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const rows = economyRows();
  fs.writeFileSync(OUT, render(rows));
  console.log("écrit " + path.relative(ROOT, OUT) + " : " + rows.shop.length + " articles, " + rows.rewards.length
    + " cosmétiques, " + rows.tokens.length + " jetons");
}
