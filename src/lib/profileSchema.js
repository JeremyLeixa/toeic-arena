// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { weekId, today } from "./util.js";

// ─── TUTORIAL TOUR — supprimé 2026-05-03 (absorbé par Verdict d'Aldric) ───
// Le tour 3 popups (Daily / Progress & League / Train) a été absorbé dans le
// Verdict d'Aldric (cf. NARRATOR_MOMENTS.verdict dans src/narrator.js, qui
// présente désormais "cinq lames rapides" → "Salle d'Entraînement" → "Ligue").
// Le booléen u.tutorialPending et la colonne Supabase students.tutorial_pending
// restent en place, lecture/écriture inertes dans supaToLocal/save/fresh, pour
// éviter une migration BDD destructive. Nettoyage différé si le concept ne ressort pas.


export function supaToLocal(data){
  return{
    name:data.name,classCode:data.class_code||"visitor",
    xp:data.xp,weeklyXp:data.weekly_xp,weekId:data.week_id,
    streak:data.streak,lastActive:data.last_active,
    cardStates:data.card_states||{},
    daily:data.daily_challenge||{date:null,done:false,score:0,xpE:0},
    stats:data.stats||{totalQ:0,correct:0,sessions:0,cardsRev:0,perfects:0,drills:0},
    moduleScores:data.module_scores||{},mockResults:data.mock_results||{},
    gameScores:data.game_scores||{pityCount:0},mission:data.mission||{date:null,actId:null,done:false,streak:0,lastDoneDate:null},
    unlockedAch:data.unlocked_ach||[],avatar:data.avatar||"⚔️",theme:data.theme||"dark",
    equippedSkin:data.skin_id||null,
    equippedFrame:data.frame_id||null,
    equippedTitle:data.title_id||null,
    totalTime:data.total_time||0,weeklyHistory: data.weekly_history || [],
    dailyModSessions: data.daily_mod_sessions || {},
    weeklyDailyCount: data.weekly_daily_count || 0,
    battleScan: data.battle_scan || null,
    tipsShown: data.tips_shown || [],
    dailySeen: data.daily_seen || [],
    gdprConsent: data.gdpr_consent || null,
    joinedAt: data.joined_at || null,
    tutorialPending: data.tutorial_pending===true,
    email: data.email || null,
    accessLevel: data.access_level || 'free',
    accessExpiresAt: data.access_expires_at || null,
    narrator: data.narrator || {heard:[], muted:false},
    cgvAcceptedAt: data.cgv_accepted_at || null,
    cgvVersion: data.cgv_version || null,
    retractationWaivedAt: data.retractation_waived_at || null,
    // Personalization Phase 1 (2026-05-05) — opt-in goal-setting (Profile editor)
    targetToeic: data.target_toeic || null,
    targetDate: data.target_date || null,
    // Arena Shop P1 (2026-05-29) — Daric currency. READ-ONLY mirror of the
    // server-authoritative students.arena_marks column. Mutated ONLY by the
    // grant_marks / spend_marks RPCs, never by save() (see guard in save()).
    arenaMarks: data.arena_marks || 0,
    // Arena Shop P2.5 — XP boost state (client-authoritative, travels in save()).
    boosts: data.boosts || {},
    // Mémoire du Mentor (2026-09-17) — bestiaire des erreurs : des références de questions, jamais
    // leur texte. La file est bornée par lib/review.js AVANT la sauvegarde : ne JAMAIS tronquer ici
    // (check_profile_roundtrip verrait un champ « ALTÉRÉ »).
    review: data.review || {},
    letterSeen: data.letter_seen || null,
  };
}
// Construit le payload de persistance. EXTRAIT de save() en Phase C-lite pour que le
// keepalive beforeunload envoie EXACTEMENT les memes colonnes : il maintenait sa propre
// liste, plus courte de 15 cles, et perdait donc silencieusement cadre/titre/boosts
// quand un onglet se fermait sans save prealable. Une seule liste, un seul endroit.
// Ce qui n'y est PAS, et ne doit pas y revenir : access_level / access_expires_at
// (entitlement, ecrit par le seul webhook Stripe) et arena_marks (monnaie, incrementee
// par grant_marks/spend_marks ; un full-row UPDATE ecraserait tout gain arrive entre
// temps). La RPC save_student les refuse aussi cote serveur depuis la Phase C-lite.
export function buildSavePayload(d){
  return {
    xp:d.xp,weekly_xp:d.weeklyXp,week_id:d.weekId,
    streak:d.streak,last_active:d.lastActive,
    card_states:d.cardStates,daily_challenge:d.daily,
    stats:d.stats,module_scores:d.moduleScores,
    mock_results:d.mockResults,game_scores:d.gameScores,
    mission:d.mission,avatar:d.avatar||"⚔️",theme:d.theme||"dark",
    skin_id:d.equippedSkin||null,
    frame_id:d.equippedFrame||null,
    title_id:d.equippedTitle||null,
    unlocked_ach:d.unlockedAch||[],total_time:d.totalTime||0,
    weekly_history:d.weeklyHistory||[],
    daily_mod_sessions:d.dailyModSessions||{},
    weekly_daily_count:d.weeklyDailyCount||0,
    battle_scan:d.battleScan||null,
    tips_shown:d.tipsShown||[],
    daily_seen:d.dailySeen||[],
    gdpr_consent:d.gdprConsent||null,
    joined_at:d.joinedAt||null,
    tutorial_pending:d.tutorialPending===true,
    email:d.email||null,
    // SECURITY (2026-09-11, finding C3) — access_level / access_expires_at
    // DELIBERATELY NOT written here. L'entitlement est server-authoritative : seul le
    // webhook Stripe (service_role) écrit ces colonnes. Les inclure dans ce full-row
    // UPDATE laissait un élève persister un premium forgé (accessLevel local → save()).
    // Le client les LIT (load/merge) mais ne les écrit jamais. Baseline 'free' posée à
    // l'INSERT uniquement (plus bas). Reverting = premium gratuit.
    // NB : fermeture COMPLÈTE = RLS auth.uid()=user_id sur students (chantier P2). Tant
    // que la RLS est off, un PATCH REST direct reste possible ; ceci ferme la voie applicative.
    narrator:d.narrator||{heard:[],muted:false},
    cgv_accepted_at:d.cgvAcceptedAt||null,
    cgv_version:d.cgvVersion||null,
    retractation_waived_at:d.retractationWaivedAt||null,
    // Personalization Phase 1 (2026-05-05) — opt-in goal-setting
    target_toeic:d.targetToeic||null,
    target_date:d.targetDate||null,
    // Arena Shop P2.5 (2026-06-02) — XP boost state (client-authoritative, persisted).
    boosts:d.boosts||{},
    // Mémoire du Mentor (2026-09-17) — bestiaire des erreurs + semaine de la dernière lettre lue.
    review:d.review||{},
    letter_seen:d.letterSeen||null,
    // Arena Shop P1 (2026-05-29) — DELIBERATELY NO arena_marks HERE.
    // The currency is server-authoritative: only grant_marks/spend_marks RPCs
    // mutate students.arena_marks via atomic increments. save() does a full-row
    // UPDATE — including arena_marks would CLOBBER any RPC increment that landed
    // between a client read and the next save() (classic lost-update). Reverting
    // this (adding arena_marks to the payload) silently erases earned Darics.
  };
}
export function fresh(name,classCode){return{name:name,classCode:classCode||'visitor',xp:0,streak:0,lastActive:null,weeklyXp:0,weekId:weekId(),weeklyHistory:[],cardStates:{},daily:{date:null,done:false,score:0,xpE:0},stats:{totalQ:0,correct:0,sessions:0,cardsRev:0,perfects:0,drills:0},moduleScores:{},mockResults:{},gameScores:{pityCount:0},mission:{date:null,actId:null,done:false,streak:0,lastDoneDate:null},unlockedAch:[],avatar:"⚔️",theme:"dark",equippedSkin:null,equippedFrame:null,equippedTitle:null,totalTime:0,dailyModSessions:{},weeklyDailyCount:0,battleScan:null,tipsShown:[],dailySeen:[],gdprConsent:null,joinedAt:today(),tutorialPending:true,email:null,accessLevel:'free',accessExpiresAt:null,narrator:{heard:[],muted:false},cgvAcceptedAt:null,cgvVersion:null,retractationWaivedAt:null,targetToeic:null,targetDate:null,arenaMarks:0,boosts:{},review:{},letterSeen:null};}
