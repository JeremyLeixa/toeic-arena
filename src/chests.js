// =============================================================
// chests.js — Système de Coffres aux Trésors
// TOEIC Arena — logique métier complète
//
// Import dans App.jsx :
// import {
//   checkAndGrantChest, openChest,
//   getPendingChests, getInventory,
//   equipItem, CHEST_TYPES, RARITIES
// } from './chests.js';
// =============================================================

import { supabase } from './supabase.js';

// =============================================================
// CONSTANTES
// =============================================================

export const RARITIES = [
  { id: 'common',   label: 'Commun',     color: '#909090', tier: 0 },
  { id: 'uncommon', label: 'Peu Commun', color: '#3ecc78', tier: 1 },
  { id: 'rare',     label: 'Rare',       color: '#3a8ee0', tier: 2 },
  { id: 'epic',     label: 'Épique',     color: '#c060f0', tier: 3 },
  { id: 'legend',   label: 'Légendaire', color: '#ffc020', tier: 4 },
];

export const CHEST_TYPES = {
  novice:     { label: 'Novice',     icon: '📦', drop: [60, 25, 12,  3,  0] },
  guerrier:   { label: 'Guerrier',   icon: '⚔️', drop: [35, 35, 20,  8,  2] },
  champion:   { label: 'Champion',   icon: '🏆', drop: [15, 30, 35, 15,  5] },
  legendaire: { label: 'Légendaire', icon: '💎', drop: [ 0, 10, 25, 40, 25] },
};

// XP accordé par rareté (consommé immédiatement, hors applyXpGates)
export const RARITY_XP = {
  common:   50,
  uncommon: 75,
  rare:     125,
  epic:     150,
  legend:   200,
};

// Pool de récompenses par tier
// Skins uniquement disponibles à partir de Rare
const REWARD_POOL = {
  0: {
    avatars: ['paysan','ecuyer','apprenti','archer','forgeron',
              'aubergiste','herboriste','barde','sentinelle','marchand'],
    skins: [],
  },
  1: {
    avatars: ['chevalier','roublard','sorcier','rodeuse','clerc',
              'alchimiste','mercenaire','erudit'],
    skins: [],
  },
  2: {
    avatars: ['paladin','archimage','assassin','druide','mage_guerre','seigneur','valkyrie'],
    skins: ['argent','emeraude','saphir'],
  },
  3: {
    avatars: ['ch_dragon','necro','archere','st_tempete','inquisiteur'],
    skins: ['rubis','amethyste','corail','jade'],
  },
  4: {
    avatars: ['pourfendeur','champion'],
    skins: ['obsidienne','aurore'],
  },
};

// Rareté de chaque avatar (pour l'affichage de l'écusson)
export const AVATAR_RARITY = {
  paysan:'common', ecuyer:'common', apprenti:'common', archer:'common',
  forgeron:'common', aubergiste:'common', herboriste:'common',
  barde:'common', sentinelle:'common', marchand:'common',
  chevalier:'uncommon', roublard:'uncommon', sorcier:'uncommon',
  rodeuse:'uncommon', clerc:'uncommon', alchimiste:'uncommon',
  mercenaire:'uncommon', erudit:'uncommon',
  paladin:'rare', archimage:'rare', assassin:'rare', druide:'rare',
  mage_guerre:'rare', seigneur:'rare', valkyrie:'rare',
  ch_dragon:'epic', necro:'epic', archere:'epic', st_tempete:'epic', inquisiteur:'epic',
  pourfendeur:'legend', champion:'legend',
};

// Rareté de chaque skin
export const SKIN_RARITY = {
  argent:'rare', emeraude:'rare', saphir:'rare',
  rubis:'epic', amethyste:'epic', corail:'epic', jade:'epic',
  obsidienne:'legend', aurore:'legend',
};

// Achievements qui déclenchent un coffre Légendaire à l'unlock
export const LEGENDARY_ACHIEVEMENTS = [
  'level_20',       // Niveau 20
  'sessions_100',   // 100 sessions
  'q_1000',         // 1000 questions
  'mastered_75',    // 75 cartes maîtrisées
  'toeic_master',   // 400+ sur un Mock Test
];

// Déclencheurs hebdomadaires (cooldown 7 jours)
const WEEKLY_TRIGGERS = new Set([
  'wfall_combo10','wfall_combo20','wfall_combo30',
  'smatch_easy_80','smatch_hard_80',
  'duel_win','duel_win3',
  'ablitz_70','ablitz_90',
  'clue_perfect','sbuild_90',
]);

// Nombre de coffres sans Rare+ avant garantie pity
const PITY_THRESHOLD = 10;


// =============================================================
// ALGORITHME DE TIRAGE
// =============================================================

/**
 * Tire une rareté selon les taux du coffre + système pity.
 * @param {string} chestType - 'novice' | 'guerrier' | 'champion' | 'legendaire'
 * @param {number} pityCount - nombre de coffres ouverts consécutivement sans Rare+
 * @returns {number} tier de rareté (0=Common … 4=Legend)
 */
export function rollRarity(chestType, pityCount = 0) {
  let rates = [...CHEST_TYPES[chestType].drop];

  // Pity : si ≥ PITY_THRESHOLD coffres sans Rare+ → forcer Rare minimum
  if (pityCount >= PITY_THRESHOLD) {
    // Redistribuer les % de Common et Uncommon sur Rare
    const overflow = rates[0] + rates[1];
    rates[0] = 0;
    rates[1] = 0;
    rates[2] = rates[2] + overflow;
  }

  const roll = Math.random() * 100;
  let cumul = 0;
  for (let i = 0; i < rates.length; i++) {
    cumul += rates[i];
    if (roll < cumul) return i;
  }
  return 0;
}

/**
 * Choisit une récompense dans la pool selon la rareté tirée.
 * Gère les doublons : si tout est possédé → gemme XP.
 * @param {number} rarityTier
 * @param {string[]} ownedAvatars - IDs des avatars déjà possédés
 * @param {string[]} ownedSkins   - IDs des skins déjà possédés
 * @returns {{ type: 'avatar'|'skin'|'xp', id: string|null, xp: number|null }}
 */
export function pickReward(rarityTier, ownedAvatars = [], ownedSkins = []) {
  const pool = REWARD_POOL[rarityTier];
  const xpAmount = RARITY_XP[RARITIES[rarityTier].id];

  const availableAvatars = pool.avatars
    .filter(a => !ownedAvatars.includes(a))
    .map(a => ({ type: 'avatar', id: a, xp: null }));

  const availableSkins = pool.skins
    .filter(s => !ownedSkins.includes(s))
    .map(s => ({ type: 'skin', id: s, xp: null }));

  // Si tout est déjà possédé → gemme XP automatique
  if (availableAvatars.length === 0 && availableSkins.length === 0) {
    return { type: 'xp', id: null, xp: xpAmount };
  }

  // Construire la pool finale
  // XP a 1 chance sur (total_cosmetics + 1) d'être sélectionné
  // → les cosmétiques sont favorisés tant qu'il en reste
  const cosmetics = [...availableAvatars, ...availableSkins];
  const fullPool = [
    { type: 'xp', id: null, xp: xpAmount },
    ...cosmetics,
    ...cosmetics, // doublé pour réduire la fréquence XP
  ];

  return fullPool[Math.floor(Math.random() * fullPool.length)];
}


// =============================================================
// VÉRIFICATION DES DÉCLENCHEURS
// =============================================================

/**
 * Vérifie si un déclencheur est disponible (cooldown + unicité).
 * Appelle les fonctions SQL créées dans la migration.
 * @param {string} userName
 * @param {string} classCode
 * @param {string} trigger
 * @returns {Promise<boolean>}
 */
async function isTriggerAvailable(userName, classCode, trigger) {
  const isWeekly = WEEKLY_TRIGGERS.has(trigger);
  const fnName = isWeekly ? 'is_chest_trigger_available' : 'is_unique_trigger_available';

  const { data, error } = await supabase.rpc(fnName, {
    p_user_name:  userName,
    p_class_code: classCode,
    p_trigger:    trigger,
  });

  if (error) {
    console.error('[chests] isTriggerAvailable error:', error.message);
    return false;
  }
  return data === true;
}


// =============================================================
// FUNCTION PRINCIPALE : checkAndGrantChest
// =============================================================

/**
 * Vérifie si un déclencheur accorde un coffre et l'enregistre
 * dans pending_chests si c'est le cas.
 *
 * À appeler dans App.jsx après chaque action pertinente.
 * Ne déclenche JAMAIS l'ouverture — ça c'est à l'initiative du joueur.
 *
 * @param {string} trigger    - ex: 'xp_10k', 'wfall_combo20', 'boss_test'
 * @param {string} chestType  - 'novice' | 'guerrier' | 'champion' | 'legendaire'
 * @param {object} u          - profil utilisateur
 * @returns {Promise<boolean>} true si un coffre a été accordé
 */
export async function checkAndGrantChest(trigger, chestType, u) {
  const userName  = u.name;
  const classCode = u.classCode || 'idrac2026';

  try {
    const available = await isTriggerAvailable(userName, classCode, trigger);
    if (!available) return false;

    const { error } = await supabase.from('pending_chests').insert({
      user_name:      userName,
      class_code:     classCode,
      chest_type:     chestType,
      trigger_source: trigger,
    });

    if (error) {
      console.error('[chests] checkAndGrantChest insert error:', error.message);
      return false;
    }

    console.log(`[chests] Coffre accordé : ${chestType} (${trigger})`);
    return true;

  } catch (e) {
    console.error('[chests] checkAndGrantChest exception:', e);
    return false;
  }
}


// =============================================================
// FUNCTION PRINCIPALE : openChest
// =============================================================

/**
 * Ouvre un coffre en attente.
 * Effectue le tirage, enregistre la récompense, supprime le pending.
 *
 * IMPORTANT : si reward.type === 'xp', App.jsx doit appeler addXp(reward.xp)
 * après avoir reçu le résultat. Ce fichier ne gère PAS addXp directement.
 *
 * @param {string} pendingChestId - UUID du pending_chest à ouvrir
 * @param {object} u              - profil utilisateur
 * @returns {Promise<{
 *   success: boolean,
 *   chest: object,
 *   rarity: object,
 *   reward: object,
 *   newPityCount: number,
 *   error?: string
 * }>}
 */
export async function openChest(pendingChestId, u) {
  const userName  = u.name;
  const classCode = u.classCode || 'idrac2026';

  try {
    // 1. Récupérer le pending_chest
    const { data: pending, error: pendingErr } = await supabase
      .from('pending_chests')
      .select('*')
      .eq('id', pendingChestId)
      .eq('user_name', userName)
      .eq('class_code', classCode)
      .maybeSingle();

    if (pendingErr || !pending) {
      return { success: false, error: 'Coffre introuvable ou déjà ouvert.' };
    }

    // 2. Récupérer l'inventaire actuel
    const { ownedAvatars, ownedSkins } = await _getOwnedItems(userName, classCode);

    // 3. Tirage de la rareté (avec pity)
    const pityCount = u.pityCount || 0;
    const rarityTier = rollRarity(pending.chest_type, pityCount);
    const rarity = RARITIES[rarityTier];

    // 4. Choix de la récompense
    const reward = pickReward(rarityTier, ownedAvatars, ownedSkins);

    // 5. Calcul du nouveau pity_count
    const newPityCount = rarityTier >= 2 ? 0 : pityCount + 1;

    // 6. Enregistrer dans player_rewards (sauf XP — pas de stock pour XP)
    if (reward.type !== 'xp') {
      const { error: rewardErr } = await supabase.from('player_rewards').insert({
        user_name:   userName,
        class_code:  classCode,
        reward_type: reward.type,
        reward_id:   reward.id,
        rarity:      rarity.id,
        xp_amount:   null,
        is_equipped: false,
      });
      if (rewardErr) {
        console.error('[chests] insert player_rewards error:', rewardErr.message);
      }
    }

    // 7. Enregistrer dans chest_log
    const { error: logErr } = await supabase.from('chest_log').insert({
      user_name:       userName,
      class_code:      classCode,
      chest_type:      pending.chest_type,
      trigger_source:  pending.trigger_source,
      rarity_obtained: rarity.id,
      reward_type:     reward.type,
      reward_id:       reward.id,
      xp_amount:       reward.type === 'xp' ? reward.xp : null,
    });
    if (logErr) {
      console.error('[chests] insert chest_log error:', logErr.message);
    }

    // 8. Supprimer le pending_chest
    await supabase
      .from('pending_chests')
      .delete()
      .eq('id', pendingChestId);

    // 9. Retourner le résultat complet
    return {
      success:      true,
      chest:        pending,
      rarity,
      reward,
      newPityCount,
    };

  } catch (e) {
    console.error('[chests] openChest exception:', e);
    return { success: false, error: e.message };
  }
}


// =============================================================
// LECTURE : getPendingChests
// =============================================================

/**
 * Récupère les coffres en attente d'un joueur, par ordre d'obtention.
 * @param {object} u - profil utilisateur
 * @returns {Promise<Array>}
 */
export async function getPendingChests(u) {
  const { data, error } = await supabase
    .from('pending_chests')
    .select('*')
    .eq('user_name', u.name)
    .eq('class_code', u.classCode || 'idrac2026')
    .order('earned_at', { ascending: true });

  if (error) {
    console.error('[chests] getPendingChests error:', error.message);
    return [];
  }
  return data || [];
}


// =============================================================
// LECTURE : getInventory
// =============================================================

/**
 * Récupère l'inventaire complet d'un joueur.
 * @param {object} u
 * @returns {Promise<{ avatars: Array, skins: Array, equippedAvatar: string|null, equippedSkin: string|null }>}
 */
export async function getInventory(u) {
  const { data, error } = await supabase
    .from('player_rewards')
    .select('*')
    .eq('user_name', u.name)
    .eq('class_code', u.classCode || 'idrac2026')
    .in('reward_type', ['avatar', 'skin'])
    .order('obtained_at', { ascending: true });

  if (error) {
    console.error('[chests] getInventory error:', error.message);
    return { avatars: [], skins: [], equippedAvatar: null, equippedSkin: null };
  }

  const items = data || [];
  const avatars = items.filter(i => i.reward_type === 'avatar');
  const skins   = items.filter(i => i.reward_type === 'skin');

  const equippedAvatar = avatars.find(a => a.is_equipped)?.reward_id || null;
  const equippedSkin   = skins.find(s => s.is_equipped)?.reward_id   || null;

  return { avatars, skins, equippedAvatar, equippedSkin };
}


// =============================================================
// ACTION : equipItem
// =============================================================

/**
 * Équipe un avatar ou un skin.
 * Déséquipe l'item précédent du même type automatiquement.
 * @param {object} u
 * @param {'avatar'|'skin'} type
 * @param {string} rewardId - ex: 'paladin' ou 'emeraude'
 * @returns {Promise<boolean>}
 */
export async function equipItem(u, type, rewardId) {
  const userName  = u.name;
  const classCode = u.classCode || 'idrac2026';

  try {
    // Déséquiper l'item actuellement équipé du même type
    await supabase
      .from('player_rewards')
      .update({ is_equipped: false })
      .eq('user_name', userName)
      .eq('class_code', classCode)
      .eq('reward_type', type)
      .eq('is_equipped', true);

    // Équiper le nouvel item
    const { error } = await supabase
      .from('player_rewards')
      .update({ is_equipped: true })
      .eq('user_name', userName)
      .eq('class_code', classCode)
      .eq('reward_type', type)
      .eq('reward_id', rewardId);

    if (error) {
      console.error('[chests] equipItem error:', error.message);
      return false;
    }

    return true;

  } catch (e) {
    console.error('[chests] equipItem exception:', e);
    return false;
  }
}


// =============================================================
// UTILITAIRE INTERNE : _getOwnedItems
// =============================================================

/**
 * Récupère les listes d'IDs des avatars et skins possédés.
 * Usage interne uniquement.
 */
async function _getOwnedItems(userName, classCode) {
  const { data, error } = await supabase
    .from('player_rewards')
    .select('reward_type, reward_id')
    .eq('user_name', userName)
    .eq('class_code', classCode)
    .in('reward_type', ['avatar', 'skin']);

  if (error || !data) return { ownedAvatars: [], ownedSkins: [] };

  return {
    ownedAvatars: data.filter(i => i.reward_type === 'avatar').map(i => i.reward_id),
    ownedSkins:   data.filter(i => i.reward_type === 'skin').map(i => i.reward_id),
  };
}


// =============================================================
// UTILITAIRE : getChestLabel
// Pratique pour l'affichage dans les toasts / notifications
// =============================================================

export function getChestLabel(chestType) {
  return CHEST_TYPES[chestType] || { label: 'Coffre', icon: '📦' };
}

export function getRarityData(rarityId) {
  return RARITIES.find(r => r.id === rarityId) || RARITIES[0];
}
