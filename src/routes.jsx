// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, Phase 4a). Les 41 routes `sp` déplacées telles quelles.
import { SpeedMatch } from "./features/games/SpeedMatch.jsx";
import { WordFall } from "./features/games/WordFall.jsx";
import { WordTavern } from "./features/games/WordTavern.jsx";
import { CardSess } from "./features/home/Cards.jsx";
import { Daily } from "./features/home/Daily.jsx";
import { Shop } from "./features/shop/Shop.jsx";
import { UpgradeScreen } from "./features/shop/UpgradeScreen.jsx";
import { ConnSort, Drill, FalseFriends, GerInf, GrammarRef, LinkingBridge, PhrasalDojo, PrepDrill, TrapsQuiz, WordFam } from "./features/train/grammar.jsx";
import { AboutToeic, StratCards, StratQuizPage } from "./features/train/strategy.jsx";
import { checkMission, recordModule } from "./lib/progress.js";
import { playBGM, stopBGM } from "./sounds.js";
import { lazyNamed } from "./components/lazyNamed.js";

// ── Écrans chargés à la demande (Phase 5, code-splitting) ── mêmes noms locaux qu'avant :
// les lignes de route ci-dessous ne bougent pas. routes.jsx est exempt du recensement de
// symboles ; tests/check_import_graph.cjs vérifie chemin, nom exporté et absence d'import
// statique résiduel. Fallback : LoadingMark inline via pg(). `playBGM` part pendant que le
// chunk se charge (idempotent par piste) : la musique précède l'écran d'un instant, c'est tout.
var BossTest=lazyNamed(function(){return import("./features/exams/BossTest.jsx");},"BossTest");
var EndlessArena=lazyNamed(function(){return import("./features/exams/EndlessArena.jsx");},"EndlessArena");
var MockTest=lazyNamed(function(){return import("./features/exams/MockTest.jsx");},"MockTest");
// Listening (data/listening.js, 271 Ko) et Reading (part6 + part7, partagés avec Endless) :
// six `import()` du même module = un seul chunk, résolu une fois.
var ListenHub=lazyNamed(function(){return import("./features/listening/Listening.jsx");},"ListenHub");
var ListenP1=lazyNamed(function(){return import("./features/listening/Listening.jsx");},"ListenP1");
var ListenP2=lazyNamed(function(){return import("./features/listening/Listening.jsx");},"ListenP2");
var ListenP3=lazyNamed(function(){return import("./features/listening/Listening.jsx");},"ListenP3");
var ListenP4=lazyNamed(function(){return import("./features/listening/Listening.jsx");},"ListenP4");
var ReadingHub=lazyNamed(function(){return import("./features/listening/Listening.jsx");},"ReadingHub");
var Part6Drill=lazyNamed(function(){return import("./features/train/reading.jsx");},"Part6Drill");
var Part7Read=lazyNamed(function(){return import("./features/train/reading.jsx");},"Part7Read");
var TimeSim=lazyNamed(function(){return import("./features/train/reading.jsx");},"TimeSim");
// Jeux et hubs lourds, chacun seul importateur de son fichier de données (audioBlitz,
// clueHunter, sentences, grammarGauntlet + grimoires, modals + grimoire). SpeedMatch,
// WordFall et WordTavern restent statiques : leurs données (vocab, grammar) sont de toute
// façon dans le principal via Cards et lib/progress.
var AudioBlitz=lazyNamed(function(){return import("./features/games/AudioBlitz.jsx");},"AudioBlitz");
var ClueHunter=lazyNamed(function(){return import("./features/games/ClueHunter.jsx");},"ClueHunter");
var DuelArena=lazyNamed(function(){return import("./features/games/DuelArena.jsx");},"DuelArena");
var SentenceBuilder=lazyNamed(function(){return import("./features/games/SentenceBuilder.jsx");},"SentenceBuilder");
var GauntletHub=lazyNamed(function(){return import("./features/gauntlet/Gauntlet.jsx");},"GauntletHub");
var ModalCouncilHub=lazyNamed(function(){return import("./features/modals/ModalCouncil.jsx");},"ModalCouncilHub");

/* La table sp → écran, sortie d'App() (REFACTOR_PLAN.md §5, Phase 4a).
 * Chaque ligne est identique à ce qu'elle était dans App(). Les noms de la portée
 * d'App() — état, setters, handlers de fin de module, pg — arrivent par `c`, déstructuré
 * ici pour ne pas réécrire les lignes ; eslint (no-undef) garantit qu'aucun nom ne
 * manque, ici comme dans le littéral d'appel côté App(). Retourne l'écran rendu, ou
 * undefined si `sp` n'est pas une sous-page (App() enchaîne alors sur les onglets). */
export function renderRoute(c){
  var {addXp, applyXpGates, bossDone, cardsDone, dailyDone, drillDone, endlessDone, gameDone, getSpotlightMult, grantWeeklyChest, groupType, miniDone, mockDone, nav, pg, rateCard, sSP, sSPA, sT, setPremiumPrompt, shopBuy, sp, spA, sv, trackModSession, u}=c;
  if(sp==="daily")return pg(<Daily u={u} done={dailyDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"daily");}} back={function(){sSP(null);}}/>);
  if(sp==="csess")return pg(<CardSess u={u} domId={spA} rate={rateCard} done={cardsDone} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="cdom")return pg(<CardSess u={u} domId={spA} rate={rateCard} done={cardsDone} back={function(){sSP(null);}}/>);
  if(sp==="drill")return pg(<Drill u={u} nav={nav} done={drillDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"drill");}} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="wordfam")return pg(<WordFam u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"wordfam");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="connsort")return pg(<ConnSort u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"connsort");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="bforge"){playBGM("bgm_bridge");return pg(<LinkingBridge u={u} done={function(sc,tot,xp){stopBGM();miniDone(sc,tot,xp);}} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"bforge");}} back={function(){stopBGM();sSP(null);sSPA(1);sT("train");}}/>);}
  if(sp==="prepdrill")return pg(<PrepDrill u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"prepdrill");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="gerinf")return pg(<GerInf u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"gerinf");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="traps")return pg(<TrapsQuiz u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"traps");}} back={function(){sSP(null);sSPA(3);sT("train");}}/>);
  if(sp==="falsefr")return pg(<FalseFriends u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"falsefr");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="pvdojo")return pg(<PhrasalDojo u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"pvdojo");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="gauntlet")return pg(<GauntletHub u={u} nav={nav} onModuleDone={function(subId,sc,tot,xp){var fullModId="gauntlet_"+subId;var gxp=applyXpGates(xp,sc,tot,fullModId);gxp=Math.round(gxp*getSpotlightMult(fullModId));var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;trackModSession(c,fullModId);recordModule(c,fullModId,sc,tot);checkMission(c,fullModId);if(sc===tot&&tot>0)grantWeeklyChest(fullModId+"_perfect","guerrier");sv(c);}} back={function(){stopBGM();sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="modals")return pg(<ModalCouncilHub u={u} nav={nav} onModuleDone={function(subId,sc,tot,xp){var fullModId="modals_"+subId;var gxp=applyXpGates(xp,sc,tot,fullModId);gxp=Math.round(gxp*getSpotlightMult(fullModId));var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;trackModSession(c,fullModId);recordModule(c,fullModId,sc,tot);checkMission(c,fullModId);if(sc===tot&&tot>0)grantWeeklyChest(fullModId+"_perfect","guerrier");sv(c);}} back={function(){stopBGM();sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="mock1")return pg(<MockTest mockId={1} u={u} done={mockDone} back={function(){sSP(null);sSPA("mocks");sT("train");}}/>);
  if(sp==="mock2")return pg(<MockTest mockId={2} u={u} done={mockDone} back={function(){sSP(null);sSPA("mocks");sT("train");}}/>);

  if(sp==="boss"){playBGM("bgm_final");return pg(<BossTest u={u} done={function(r,xp){stopBGM();bossDone(r,xp);}} back={function(){stopBGM();sSP(null);sSPA("mocks");sT("train");}}/>);}
  if(sp==="endless"){playBGM("bgm_endless");return pg(<EndlessArena u={u} nav={nav} done={function(r,xp,meta){stopBGM();endlessDone(r,xp,meta);}} back={function(){stopBGM();sSP(null);sSPA("mocks");sT("train");}}/>);}
  if(sp==="mock3")return pg(<MockTest mockId={3} u={u} done={mockDone} back={function(){sSP(null);sSPA("mocks");sT("train");}}/>);
  if(sp==="tavern"){playBGM("bgm_tavern");return pg(<WordTavern u={u} nav={nav} done={function(sc,tot,xp){stopBGM();miniDone(sc,tot,xp);}} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"tavern");}} resetCard={function(c){sv(c);}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="matchE"){playBGM("bgm_speed");return pg(<SpeedMatch mode="easy" u={u} done={function(mk,res,xp){stopBGM();gameDone(mk,res,xp);}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="wfall"){playBGM("bgm_wfall");return pg(<WordFall u={u} done={function(mk,res,xp){stopBGM();gameDone(mk,res,xp);}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="duel"){playBGM("bgm_duel");return pg(<DuelArena u={u} done={function(mk,res,xp){stopBGM();gameDone(mk,res,xp);}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="sbuild"){playBGM("bgm_build");return pg(<SentenceBuilder u={u} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"sbuild");}} done={function(sc,tot,xp){stopBGM();var gxp=applyXpGates(xp,sc,tot,"sbuild");var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;trackModSession(c,"sbuild");recordModule(c,"sbuild",sc,tot);if(tot>0&&sc/tot>=0.9)grantWeeklyChest("sbuild_90","novice");sv(c);sSP(null);sT("games");}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="clue"){playBGM("bgm_clue");return pg(<ClueHunter u={u} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"clue");}} done={function(sc,tot,xp){stopBGM();var gxp=applyXpGates(xp,sc,tot,"clue");var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;trackModSession(c,"clue");recordModule(c,"clue",sc,tot);checkMission(c,"clue");if(sc===tot&&tot>0)grantWeeklyChest("clue_perfect","guerrier");sv(c);sSP(null);sT("games");}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="ablitz")return pg(<AudioBlitz u={u} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"ablitz");}} done={function(sc,tot,xp){var gxp=applyXpGates(xp,sc,tot,"ablitz");var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;trackModSession(c,"ablitz");recordModule(c,"ablitz",sc,tot);if(tot>0){var abPct=sc/tot;if(abPct>=0.9)grantWeeklyChest("ablitz_90","guerrier");else if(abPct>=0.7)grantWeeklyChest("ablitz_70","novice");}sv(c);sSP(null);sT("games");}} back={function(){sSP(null);sT("games");}}/>);
  if(sp==="upgrade")return pg(<UpgradeScreen u={u} back={function(){sSP(null);sT("profile");}}/>);
  if(sp==="shop"){playBGM("bgm_shop");return pg(<Shop u={u} buy={shopBuy} setAvatar={function(c){sv(c);}} back={function(){stopBGM();sSP(null);sT("profile");}}/>);}
  if(sp==="abouttoeic")return pg(<AboutToeic back={function(){sSP(null);sSPA(3);sT("train");}}/>);
  if(sp==="strats")return pg(<StratCards back={function(){sSP(null);sSPA(3);sT("train");}}/>);
  if(sp==="gramref")return pg(<GrammarRef initial={spA} back={function(){sSP(null);sSPA(3);sT("train");}}/>);
  if(sp==="stratquiz")return pg(<StratQuizPage u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"stratquiz");}} back={function(){sSP(null);sSPA(3);sT("train");}}/>);
  if(sp==="timesim")return pg(<TimeSim u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"timesim");}} nav={nav} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="p6")return pg(<Part6Drill u={u} nav={nav} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"p6");}} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="p7")return pg(<Part7Read u={u} nav={nav} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"p7");}} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="lis")return pg(<ListenHub u={u} nav={nav} groupType={groupType} onPremium={function(n){setPremiumPrompt(n);}} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="lisP1")return pg(<ListenP1 u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"lisP1");}} back={function(){sSP("lis");}}/>);
  if(sp==="read")return pg(<ReadingHub u={u} nav={nav} groupType={groupType} onPremium={function(n){setPremiumPrompt(n);}} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="lisP2")return pg(<ListenP2 u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"lisP2");}} back={function(){sSP("lis");}}/>);
  if(sp==="lisP3")return pg(<ListenP3 u={u} nav={nav} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"lisP3");}} back={function(){sSP("lis");}}/>);
  if(sp==="lisP4")return pg(<ListenP4 u={u} nav={nav} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"lisP4");}} back={function(){sSP("lis");}}/>);
}
