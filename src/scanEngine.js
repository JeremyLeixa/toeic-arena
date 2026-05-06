// ═══════════════════════════════════════════════════════════════════════
// scanEngine.js — Battle Scan V2 CAT-light controller + scoring
// ─────────────────────────────────────────────────────────────────────
// Stateful per-section controllers that drive adaptive question selection:
//   start at medium → correct → next harder, wrong → next easier.
// Each controller exposes the same shape:
//   .next()   → {item, lvl, sectionId, ...sectionMeta} | null when done
//   .record(correct) → push the user's answer into internal state
//   .score()  → final {acc, weighted, raw, total, ...sectionStats}
//
// Total volume: grammar 8 (2/macro), vocab 6, reading 6 (3 P6 + 3 P7),
// listening 6. Total ~26 Q. CAT precision instead of Q quantity.
// ═══════════════════════════════════════════════════════════════════════

import { BATTLE_SCAN_V2, SCAN_GRAMMAR_MACROS, SCAN_DIFFICULTY_WEIGHTS, SCAN_TOEIC_BASELINE } from "./data/placement.js";
import { LISTENING_P1, LISTENING_P2, LISTENING_P3, LISTENING_P4 } from "./data/listening.js";

// ─── helpers ───
function pickRandom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function shuffle(arr){
  var a = arr.slice();
  for(var i=a.length-1; i>0; i--){
    var j = Math.floor(Math.random()*(i+1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// ═══════════════════════════════════════════════════════════════════════
// Public factory — returns a controller for the given section.
// ═══════════════════════════════════════════════════════════════════════
export function createCatController(sectionId){
  var section = BATTLE_SCAN_V2[sectionId];
  if(!section){ console.warn("[scanEngine] unknown section:", sectionId); return null; }
  if(sectionId === "grammar")   return _grammarCat(section);
  if(sectionId === "vocab")     return _simpleCat(section, "vocab");
  if(sectionId === "reading")   return _readingCat(section);
  if(sectionId === "listening") return _listeningCat(section);
  return null;
}

// ─── Grammar — 4 macros × 2 Q each, branched on first answer ───
// Q1 of each macro = medium. Correct → Q2 hard. Wrong → Q2 easy.
function _grammarCat(section){
  var queue = [];
  var current = null;
  var answered = [];

  // Seed: 1 medium per macro, in shuffled order so the user doesn't always
  // see verbs first.
  shuffle(SCAN_GRAMMAR_MACROS.slice()).forEach(function(m){
    queue.push({macroId:m.id, lvl:"medium", phase:1});
  });

  function pickItem(macroId, lvl){
    var pool = section.pool[macroId][lvl];
    var seenIds = answered.filter(function(a){return a.macroId===macroId;}).map(function(a){return a.itemId;});
    var avail = pool.filter(function(i){return seenIds.indexOf(i.id) < 0;});
    return pickRandom(avail.length ? avail : pool);
  }

  return {
    sectionId: "grammar",
    next: function(){
      if(queue.length === 0) return null;
      var step = queue.shift();
      var item = pickItem(step.macroId, step.lvl);
      current = {step:step, item:item};
      return {item:item, lvl:step.lvl, macroId:step.macroId, sectionId:"grammar"};
    },
    record: function(correct){
      if(!current) return;
      var w = SCAN_DIFFICULTY_WEIGHTS[current.step.lvl];
      answered.push({
        macroId: current.step.macroId,
        lvl: current.step.lvl,
        correct: !!correct,
        weight: w,
        itemId: current.item.id
      });
      // Branch into phase 2 for this macro
      if(current.step.phase === 1){
        var nextLvl = correct ? "hard" : "easy";
        // append at the END so all macros get phase 1 before phase 2 starts
        // (this gives the user a fresh macro feel each Q)
        queue.push({macroId:current.step.macroId, lvl:nextLvl, phase:2});
      }
      current = null;
    },
    score: function(){
      var sumWC=0, sumWT=0;
      answered.forEach(function(a){ sumWT += a.weight; if(a.correct) sumWC += a.weight; });
      var byMacro = {};
      SCAN_GRAMMAR_MACROS.forEach(function(m){
        var ms = answered.filter(function(a){return a.macroId === m.id;});
        var c=0, t=0;
        ms.forEach(function(a){ t += a.weight; if(a.correct) c += a.weight; });
        byMacro[m.id] = t > 0 ? c/t : 0;
      });
      return {
        acc: sumWT > 0 ? sumWC/sumWT : 0,
        weighted: sumWC,
        raw: answered.filter(function(a){return a.correct;}).length,
        total: answered.length,
        byMacro: byMacro,
        details: answered
      };
    }
  };
}

// ─── Vocab — 6 Q simple CAT: 2 medium primer → branch 4 ───
// 2/2 → 4 hard. 1/2 → 2 medium + 2 hard. 0/2 → 3 easy + 1 medium.
function _simpleCat(section, sectionId){
  var pool = section.pool;
  var queue = [{lvl:"medium"}, {lvl:"medium"}];
  var current = null;
  var answered = [];
  var branched = false;

  function pickItem(lvl){
    var seenIds = answered.map(function(a){return a.itemId;});
    var avail = pool[lvl].filter(function(i){return seenIds.indexOf(i.id) < 0;});
    return pickRandom(avail.length ? avail : pool[lvl]);
  }

  function maybeBranch(){
    if(branched || answered.length < 2) return;
    branched = true;
    var corr = answered.filter(function(a){return a.correct;}).length;
    if(corr === 2){
      queue.push({lvl:"hard"},{lvl:"hard"},{lvl:"hard"},{lvl:"medium"});
    } else if(corr === 1){
      queue.push({lvl:"medium"},{lvl:"hard"},{lvl:"medium"},{lvl:"easy"});
    } else {
      queue.push({lvl:"easy"},{lvl:"medium"},{lvl:"easy"},{lvl:"easy"});
    }
  }

  return {
    sectionId: sectionId,
    next: function(){
      maybeBranch();
      if(queue.length === 0) return null;
      var step = queue.shift();
      var item = pickItem(step.lvl);
      current = {step:step, item:item};
      return {item:item, lvl:step.lvl, sectionId:sectionId};
    },
    record: function(correct){
      if(!current) return;
      var w = SCAN_DIFFICULTY_WEIGHTS[current.step.lvl];
      answered.push({lvl:current.step.lvl, correct:!!correct, weight:w, itemId:current.item.id});
      current = null;
    },
    score: function(){
      var sumWC=0, sumWT=0;
      answered.forEach(function(a){ sumWT += a.weight; if(a.correct) sumWC += a.weight; });
      return {
        acc: sumWT > 0 ? sumWC/sumWT : 0,
        weighted: sumWC,
        raw: answered.filter(function(a){return a.correct;}).length,
        total: answered.length,
        details: answered
      };
    }
  };
}

// ─── Reading — P6 cloze fixed at medium → P7 difficulty branched ───
// P6 medium has 3 blanks. P7 difficulty: 3/3 → hard, 2/3 → medium, 0-1/3 → easy.
function _readingCat(section){
  var phase = "p6";
  var p6Pick = {passage: section.pool.p6.medium, lvl: "medium"};
  var p7Pick = null;
  var p6Answers = [];
  var p7Answers = [];
  var p6Idx = 0;
  var p7Idx = 0;
  var current = null;

  var p6Blanks = p6Pick.passage.parts.filter(function(p){return p.blank;});

  function selectP7Lvl(){
    var corr = p6Answers.filter(function(a){return a.correct;}).length;
    if(corr >= 3) return "hard";
    if(corr === 2) return "medium";
    return "easy";
  }

  return {
    sectionId: "reading",
    next: function(){
      if(phase === "p6"){
        if(p6Idx < p6Blanks.length){
          var blank = p6Blanks[p6Idx];
          var isFirst = p6Idx === 0;
          current = {phase:"p6", item:blank, lvl:p6Pick.lvl};
          p6Idx++;
          return {
            item: blank,
            lvl: p6Pick.lvl,
            sectionId: "reading",
            format: "p6",
            passage: p6Pick.passage,
            blankIndex: p6Idx - 1,
            totalBlanks: p6Blanks.length,
            isFirstQ: isFirst
          };
        }
        // Branch into P7
        var lvl = selectP7Lvl();
        p7Pick = {passage: section.pool.p7[lvl], lvl: lvl};
        phase = "p7";
      }
      if(phase === "p7"){
        var qs = p7Pick.passage.questions;
        if(p7Idx < qs.length){
          var q = qs[p7Idx];
          var first = p7Idx === 0;
          current = {phase:"p7", item:q, lvl:p7Pick.lvl};
          p7Idx++;
          return {
            item: q,
            lvl: p7Pick.lvl,
            sectionId: "reading",
            format: "p7",
            passage: p7Pick.passage,
            qIndex: p7Idx - 1,
            totalQs: qs.length,
            isFirstQ: first
          };
        }
      }
      return null;
    },
    record: function(correct){
      if(!current) return;
      var w = SCAN_DIFFICULTY_WEIGHTS[current.lvl];
      var rec = {itemId:current.item.id, correct:!!correct, weight:w, lvl:current.lvl};
      if(current.phase === "p6") p6Answers.push(rec);
      else p7Answers.push(rec);
      current = null;
    },
    score: function(){
      var all = p6Answers.concat(p7Answers);
      var sumWC=0, sumWT=0;
      all.forEach(function(a){ sumWT += a.weight; if(a.correct) sumWC += a.weight; });
      function partAcc(arr){
        var c=0, t=0;
        arr.forEach(function(a){ t += a.weight; if(a.correct) c += a.weight; });
        return t > 0 ? c/t : 0;
      }
      return {
        acc: sumWT > 0 ? sumWC/sumWT : 0,
        weighted: sumWC,
        raw: all.filter(function(a){return a.correct;}).length,
        total: all.length,
        byPart: {p6: partAcc(p6Answers), p7: partAcc(p7Answers)},
        details: all
      };
    }
  };
}

// ─── Listening — 6 Q sampled from real listening.js pools ───
// 2 medium primer → 4 branched. References resolve via refId + qIdx for P3/P4.
function _listeningCat(section){
  var queue = [];
  var current = null;
  var answered = [];
  var branched = false;
  var usedIds = {};  // dedup across all picks

  function resolveItem(entry){
    var src = null;
    if(entry.part === "p1") src = LISTENING_P1.find(function(x){return x.id === entry.refId;});
    else if(entry.part === "p2") src = LISTENING_P2.find(function(x){return x.id === entry.refId;});
    else if(entry.part === "p3") src = LISTENING_P3.find(function(x){return x.id === entry.refId;});
    else if(entry.part === "p4") src = LISTENING_P4.find(function(x){return x.id === entry.refId;});
    if(!src){ console.warn("[scanEngine] listening refId not found:", entry.refId); return null; }
    return {entry:entry, src:src, qIdx: entry.qIdx || 0};
  }

  function fresh(lvl, n){
    var avail = section.pool[lvl].filter(function(e){return !usedIds[e.id];});
    var picked = shuffle(avail).slice(0, n);
    picked.forEach(function(e){ usedIds[e.id] = true; });
    return picked.map(function(e){return {lvl:lvl, entry:e};});
  }

  // Seed: 2 medium
  fresh("medium", 2).forEach(function(s){queue.push(s);});

  function maybeBranch(){
    if(branched || answered.length < 2) return;
    branched = true;
    var corr = answered.filter(function(a){return a.correct;}).length;
    var picks;
    if(corr === 2){
      picks = fresh("hard", 4);
    } else if(corr === 1){
      picks = fresh("medium", 1).concat(fresh("hard", 2)).concat(fresh("easy", 1));
    } else {
      picks = fresh("easy", 2).concat(fresh("medium", 1)).concat(fresh("easy", 1));
    }
    picks.forEach(function(s){queue.push(s);});
  }

  return {
    sectionId: "listening",
    next: function(){
      maybeBranch();
      while(queue.length > 0){
        var step = queue.shift();
        var resolved = resolveItem(step.entry);
        if(!resolved) continue;  // skip broken refs gracefully
        current = {step:step, resolved:resolved};
        return {
          sectionId: "listening",
          lvl: step.lvl,
          part: step.entry.part,
          item: resolved.src,
          qIdx: resolved.qIdx,
          refId: step.entry.refId,
          scanItemId: step.entry.id
        };
      }
      return null;
    },
    record: function(correct){
      if(!current) return;
      var w = SCAN_DIFFICULTY_WEIGHTS[current.step.lvl];
      answered.push({
        scanItemId: current.step.entry.id,
        part: current.step.entry.part,
        lvl: current.step.lvl,
        correct: !!correct,
        weight: w
      });
      current = null;
    },
    score: function(){
      var sumWC=0, sumWT=0;
      answered.forEach(function(a){ sumWT += a.weight; if(a.correct) sumWC += a.weight; });
      var byPart = {};
      ["p1","p2","p3","p4"].forEach(function(p){
        var ms = answered.filter(function(a){return a.part === p;});
        var c=0, t=0;
        ms.forEach(function(a){ t += a.weight; if(a.correct) c += a.weight; });
        if(t > 0) byPart[p] = c/t;
      });
      return {
        acc: sumWT > 0 ? sumWC/sumWT : 0,
        weighted: sumWC,
        raw: answered.filter(function(a){return a.correct;}).length,
        total: answered.length,
        byPart: byPart,
        details: answered
      };
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Final aggregator — combine the 4 section scores into a TOEIC baseline.
// ═══════════════════════════════════════════════════════════════════════
export function computeScanResult(scores){
  var w = SCAN_TOEIC_BASELINE.weights;
  var weighted =
    (scores.grammar.acc   * w.grammar)   +
    (scores.vocab.acc     * w.vocab)     +
    (scores.reading.acc   * w.reading)   +
    (scores.listening.acc * w.listening);

  var range = SCAN_TOEIC_BASELINE.max - SCAN_TOEIC_BASELINE.min;
  var toeic = Math.round((SCAN_TOEIC_BASELINE.min + weighted * range) / 5) * 5;

  // Tier label aligned with the existing battleScanToToeic boundaries in App.jsx
  var tier;
  if(toeic >= 800) tier = "Elite";
  else if(toeic >= 700) tier = "Advanced";
  else if(toeic >= 600) tier = "Intermediate+";
  else if(toeic >= 500) tier = "Intermediate";
  else if(toeic >= 400) tier = "Lower-intermediate";
  else tier = "Beginner";

  return {
    toeic: toeic,
    tier: tier,
    sections: {
      grammar:   Math.round(scores.grammar.acc   * 100),
      vocab:     Math.round(scores.vocab.acc     * 100),
      reading:   Math.round(scores.reading.acc   * 100),
      listening: Math.round(scores.listening.acc * 100)
    },
    grammarMacros:   scores.grammar.byMacro   || {},
    readingByPart:   scores.reading.byPart    || {},
    listeningByPart: scores.listening.byPart  || {}
  };
}
