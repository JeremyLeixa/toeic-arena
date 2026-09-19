// Portes XP — le calcul, sans les effets (Phase 5 du découpage, 2026-09-16).
//
// Ce module est PUR : il ne joue aucun son, n'affiche aucun toast, n'appelle ni Supabase ni
// le vibreur. Il reçoit l'état (`u`), la date (`now`) et les événements actifs en ARGUMENTS,
// et rend des valeurs que App.jsx transforme en effets (grantMarks, jingles, haptique,
// coffres). C'est ce qui le rend requérable tel quel par tests/check_xp_gates.cjs : le
// premier filet sur la seule mécanique critique qui n'en avait pas.
//
// ⚠️ N'importer ici que des modules purs. lib/league.js importe Supabase (import.meta.env
// undefined en Node) : c'est pourquoi la table des ligues est injectée (`ctx.leagueOf`) et
// non importée. Un import impur ajouté ici casse le test au `require` — c'est voulu.
//
// Les règles produit (CLAUDE.md, « XP System ») :
//   · seuil d'accuracy : <30 % → 10 % (plancher 5 XP), 30-49 % → 50 %, ≥50 % → 100 % ;
//   · anti-farming par module et par jour (u.dailyModSessions[modId_date]) :
//       générique 100/50/15/0 %, mock1-3 100/40/0 %, flashcards 100/60/30/0 % ;
//       sauté si un Bypass Token est armé pour CE module (retour anticipé : ni Focus ni
//       boosts ensuite, comme avant) ou si un événement actif booste le module ;
//   · Today's Focus +25 % si le module vise la partie de la quête « enjeu » du plan figé du jour
//     (ctx.focusPart, injecté par App() depuis lib/planner.js stakePart) ;
//   · boosts Daric : Module Booster ×1.5 sur le module armé, Mock Multiplier ×1.5 sur
//     mock1/2/3/boss ; plancher 0.
import { today } from "./util.js";
import { partOfModule } from "./toeic.js";
import { getLevel } from "../data/helpers.js";

// Paliers d'XP cumulée qui déclenchent un coffre (trigger "xp_<n>k").
export var XP_MILESTONES=[[1000,"novice"],[3000,"novice"],[5000,"novice"],[10000,"guerrier"],[20000,"guerrier"],[30000,"champion"],[50000,"champion"]];

// ── PILIER 1 : seuil d'accuracy ── tot<=0 → pas de porte.
export function accuracyGate(baseXp,sc,tot){
  var gatedXp=baseXp;
  if(tot>0){
    var acc=sc/tot;
    if(acc<0.30)gatedXp=Math.max(5,Math.round(baseXp*0.10));
    else if(acc<0.50)gatedXp=Math.round(baseXp*0.50);
    // ≥50% : formule normale, pas de pénalité
  }
  return gatedXp;
}

// ── PILIER 2 : courbe anti-farming ── multiplicateur selon le nombre de sessions du jour.
// Flashcards : 100% / 60% / 30% / 0%  ·  Mock Tests : 100% / 40% / 0%  ·  Autres : 100% / 50% / 15% / 0%
// (`boss` est dans « Autres », pas dans la famille mock — c'est le comportement historique.)
export function farmMult(modId,sessionCount){
  if(modId==="csess")return sessionCount===0?1:sessionCount===1?0.60:sessionCount===2?0.30:0;
  if(modId==="mock1"||modId==="mock2"||modId==="mock3")return sessionCount===0?1:sessionCount===1?0.40:0;
  return sessionCount===0?1:sessionCount===1?0.5:sessionCount===2?0.15:0;
}

// Un événement actif booste-t-il ce module ? Spotlight sur CE module, ou Flash Hour /
// Underdog (globaux : on relève le cap pour tous, le multiplicateur reste sélectif).
export function isBoostedByEvents(modId,events){
  if(!events||!events.length)return false;
  return events.some(function(ev){
    if(ev.type==="spotlight"&&ev.config&&ev.config.module===modId)return true;
    if(ev.type==="flash_hour")return true;
    if(ev.type==="underdog")return true;
    return false;
  });
}

// Multiplicateur Spotlight d'un module (1 si aucun spotlight ne le vise).
export function spotlightMult(modId,events){
  if(!events)return 1;
  var m=1;
  events.forEach(function(ev){
    if(ev.type==="spotlight"&&ev.config&&ev.config.module===modId)m=ev.config.multiplier||2;
  });
  return m;
}

// Les trois piliers + boosts, dans l'ordre historique, AVEC le détail de chaque étape
// (écran de fin de session, 2026-09-17). ctx = {u, now, events, spotlight, focusPart}.
// Retour : {xp, focusHit, steps}. focusHit=true ⇔ le bonus Focus s'est appliqué : App.jsx doit
// alors créditer les 30 Darics (grantMarks, dédupliqué côté serveur par "focus_<date>").
// steps = [{id, kind:"base"|"malus"|"bonus", mult?, run?, value}] ; la valeur de la DERNIÈRE
// étape vaut toujours `xp` (tests/check_xp_gates.cjs, section 6). Les libellés affichés sont
// construits par l'écran (lib/sessionText.js), pas ici.
// ctx.spotlight=true applique aussi le multiplicateur Spotlight (miniDone et les hubs le
// faisaient à la main après applyXpGates ; drill, daily et les jeux ne l'appliquent pas).
export function gateSteps(baseXp,sc,tot,modId,ctx){
  ctx=ctx||{};var u=ctx.u;var now=ctx.now||new Date();var events=ctx.events;
  var steps=[{id:"base",kind:"base",value:baseXp}];
  // Chasse aux erreurs : pas de porte de précision. La base ne paie QUE les créatures vaincues
  // (5 + 5 par créature, lib/review.js) : appliquer en plus la porte punirait deux fois l'élève qui
  // affronte ses questions les plus dures — exactement celui qu'on veut voir revenir.
  var gatedXp=modId==="hunt"?baseXp:accuracyGate(baseXp,sc,tot);
  if(gatedXp!==baseXp)steps.push({id:"accuracy",kind:"malus",mult:sc/tot<0.30?0.1:0.5,value:gatedXp});
  var focusHit=false;
  function out(){
    if(gatedXp<0){gatedXp=0;steps.push({id:"floor",kind:"malus",value:0});}
    if(ctx.spotlight&&modId){
      var sm=spotlightMult(modId,events);
      if(sm!==1){gatedXp=Math.round(gatedXp*sm);steps.push({id:"spotlight",kind:"bonus",mult:sm,value:gatedXp});}
    }
    return{xp:gatedXp,focusHit:focusHit,steps:steps};
  }
  if(modId){
    // Bypass Token armé pour CE module : on saute la courbe ET tout ce qui suit (retour
    // anticipé historique). Le flag (dans boosts, persisté) est consommé par recordModule après la manche.
    if(u&&u.boosts&&u.boosts.bypassArmedModule===modId){
      steps.push({id:"bypass",kind:"bonus",value:gatedXp});
      return out();
    }
    if(!isBoostedByEvents(modId,events)){
      var dms=(u&&u.dailyModSessions)||{};
      var key=modId+"_"+today(now);
      var run=dms[key]||0;var fm=farmMult(modId,run);
      gatedXp=Math.round(gatedXp*fm);
      if(fm!==1)steps.push({id:"farm",kind:"malus",mult:fm,run:run+1,value:gatedXp});
    }
  }
  // ── PILIER 3 : Today's Focus +25 % ── l'anti-farming ci-dessus plafonne déjà le gain.
  // Depuis le lot 4 du Mentor (2026-09-18), la partie visée est celle de la quête « enjeu » du plan
  // FIGÉ du jour (lib/planner.js stakePart), injectée par App() : c'est celle que le Mentor étiquette
  // « +25% XP ». Recalculée ici (ancien computeTodayFocus, précision la plus basse), elle pouvait
  // différer de ce que l'élève avait sous les yeux, et changer en cours de journée.
  if(modId&&ctx.focusPart&&partOfModule(modId)===ctx.focusPart){
    gatedXp=Math.round(gatedXp*1.25);
    focusHit=true;
    steps.push({id:"focus",kind:"bonus",mult:1.25,value:gatedXp});
  }
  // ── Boosts Daric (Arena Shop P2.5) ── ne touchent que l'XP, jamais la précision.
  if(modId&&u&&u.boosts){
    var bst=u.boosts;
    if(bst.moduleBoostArmed===modId){gatedXp=Math.round(gatedXp*1.5);steps.push({id:"module_boost",kind:"bonus",mult:1.5,value:gatedXp});}
    if(bst.mockMultArmed&&(modId==="mock1"||modId==="mock2"||modId==="mock3"||modId==="boss")){gatedXp=Math.round(gatedXp*1.5);steps.push({id:"mock_mult",kind:"bonus",mult:1.5,value:gatedXp});}
  }
  return out();
}

// Multiplicateur anti-farming qu'aurait la PROCHAINE partie de ce module (tuiles des hubs :
// « Full XP / ½ XP / Low XP / No XP »). Mêmes règles que gateSteps, dans le même ordre : Bypass
// Token armé pour ce module → 1 ; module boosté par un événement → 1 ; sinon farmMult sur le
// nombre de parties du jour. tests/check_xp_gates.cjs vérifie l'égalité avec l'étape « farm ».
export function nextRunMult(u,modId,ctx){
  ctx=ctx||{};
  if(u&&u.boosts&&u.boosts.bypassArmedModule===modId)return 1;
  if(isBoostedByEvents(modId,ctx.events))return 1;
  var dms=(u&&u.dailyModSessions)||{};
  return farmMult(modId,dms[modId+"_"+today(ctx.now||new Date())]||0);
}

// Le calcul seul : même implémentation que gateSteps, forme de retour historique {xp, focusHit}.
export function gateXp(baseXp,sc,tot,modId,ctx){
  var r=gateSteps(baseXp,sc,tot,modId,ctx);
  return{xp:r.xp,focusHit:r.focusHit};
}

// Créditer un montant : streak, multiplicateurs (week-end, streak, événements, Daily
// Doubler), +10 première activité du jour, planchers, puis ce que App.jsx doit FAIRE.
// ctx = {now, events, classMedianXp, leagueOf}. `u` n'est jamais muté : on rend un clone `c`.
// Retour : {c, amt, isFirstToday, toast:{total,base,bonuses}, leagueUp:{from,to}|null,
//           levelUp:{from,to}|null, chests:[{trigger,type,haptic?}]} — les coffres dans
// l'ordre historique : paliers XP, puis streak (haptic "streak"), puis passage de ligue.
export function settleXp(u,baseAmt,ctx){
  ctx=ctx||{};var now=ctx.now||new Date();var events=ctx.events;var classMedianXp=ctx.classMedianXp;var leagueOf=ctx.leagueOf;
  if(typeof leagueOf!=="function")throw new Error("settleXp: ctx.leagueOf manquant (injecter getLeague ; lib/league.js importe Supabase et ne peut pas etre importe ici)");
  var c=JSON.parse(JSON.stringify(u));var td=today(now);var bonuses=[];var isFirstToday=c.lastActive!==td;

  // Update streak
  if(isFirstToday){var yd=new Date(now.getTime());yd.setDate(yd.getDate()-1);c.streak=c.lastActive===yd.toISOString().split("T")[0]?c.streak+1:1;c.lastActive=td;}

  // Multiplicateurs — seulement sur l'XP positive, une perte n'est jamais multipliée
  // steps : même détail que gateSteps (écran de fin). settleXp n'arrondit qu'UNE fois, sur le
  // multiplicateur cumulé : la valeur de chaque étape est round(base × cumul jusque-là), et
  // la dernière vaut `amt` (tests/check_xp_gates.cjs, section 6).
  var mult=1;var amt=baseAmt;var steps=[];
  if(baseAmt>0){
    // Week-end (samedi=6, dimanche=0) — jour LOCAL, alors que today() est en UTC : historique, conservé
    var dow=now.getDay();
    if(dow===0||dow===6){mult*=2;bonuses.push({label:"Weekend x2",color:"#ff6bff"});steps.push({id:"weekend",kind:"bonus",mult:2});}

    if(c.streak>=7){mult*=1.5;bonuses.push({label:"Streak x1.5 ("+c.streak+"d)",color:"#ff8c42"});steps.push({id:"streak",kind:"bonus",mult:1.5,days:c.streak});}
    else if(c.streak>=3){mult*=1.2;bonuses.push({label:"Streak x1.2 ("+c.streak+"d)",color:"#ff8c42"});steps.push({id:"streak",kind:"bonus",mult:1.2,days:c.streak});}

    if(events&&events.length>0){
      events.forEach(function(ev){
        var cfg=ev.config||{};var m=cfg.multiplier||2;
        if(ev.type==="flash_hour"){mult*=m;bonuses.push({label:"⚡ Flash Hour x"+m,color:"#f0c850"});steps.push({id:"flash_hour",kind:"bonus",mult:m});}
        if(ev.type==="underdog"&&c.xp<classMedianXp){mult*=m;bonuses.push({label:"💪 Underdog x"+m,color:"#4abe60"});steps.push({id:"underdog",kind:"bonus",mult:m});}
      });
    }

    // Daily Doubler (×2 pendant 24 h, acheté en Darics)
    if(c.boosts&&c.boosts.dailyDoublerUntil&&now.getTime()<c.boosts.dailyDoublerUntil){
      mult*=2;bonuses.push({label:"⏫ Daily Doubler x2",color:"#f0c850"});steps.push({id:"daily_doubler",kind:"bonus",mult:2});
    }

    amt=Math.round(baseAmt*mult);
    var cum=1;
    steps.forEach(function(st){cum*=st.mult;st.value=Math.round(baseAmt*cum);});

    // Première activité du jour
    if(isFirstToday){amt+=10;bonuses.push({label:"+10 daily login",color:"#00e676"});steps.push({id:"first_today",kind:"bonus",add:10,value:amt});}
  }

  var prevLeague=leagueOf(c.weeklyXp);
  c.xp+=amt;c.weeklyXp+=amt;
  // Planchers : jamais sous 0
  if(c.xp<0)c.xp=0;
  if(c.weeklyXp<0)c.weeklyXp=0;
  var newLeague=leagueOf(c.weeklyXp);
  var leagueChanged=newLeague.id!==prevLeague.id&&c.weeklyXp>prevLeague.min;

  var levelUp=null;
  if(amt>0){var _pl=getLevel(c.xp-amt).level,_nl=getLevel(c.xp).level;if(_nl>_pl)levelUp={from:_pl,to:_nl};}

  var chests=[];
  if(amt>0){
    var prevXp=c.xp-amt;
    XP_MILESTONES.forEach(function(m){
      if(prevXp<m[0]&&c.xp>=m[0])chests.push({trigger:"xp_"+(m[0]>=1000?(m[0]/1000)+"k":m[0]),type:m[1]});
    });
  }
  if(isFirstToday){
    if(c.streak===7)chests.push({trigger:"streak_7",type:"novice",haptic:"streak"});
    if(c.streak===30)chests.push({trigger:"streak_30",type:"guerrier",haptic:"streak"});
    if(c.streak===100)chests.push({trigger:"streak_100",type:"champion",haptic:"streak"});
  }
  if(leagueChanged)chests.push({trigger:"league_up_"+newLeague.id,type:"guerrier"});

  return{c:c,amt:amt,isFirstToday:isFirstToday,toast:{total:amt,base:baseAmt,bonuses:bonuses},
    leagueUp:leagueChanged?{from:prevLeague.id,to:newLeague.id}:null,levelUp:levelUp,chests:chests,steps:steps};
}
