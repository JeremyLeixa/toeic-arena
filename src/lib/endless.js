// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { BOSS_P1, BOSS_P2, BOSS_P3, BOSS_P4, BOSS_P5, BOSS_P6, BOSS_P7 } from "../data/bossTestFull.js";
import { QUESTIONS } from "../data/grammar.js";
import { LISTENING_P1, LISTENING_P2, LISTENING_P3, LISTENING_P4 } from "../data/listening.js";
import { PART6_TEXTS } from "../data/part6.js";
import { PART7_PASSAGES } from "../data/part7.js";

export function generateEndlessTest(){
  // Merge training + boss pools
  var allP1=LISTENING_P1.concat(BOSS_P1);
  var allP2=LISTENING_P2.concat(BOSS_P2);
  var allP3=LISTENING_P3.concat(BOSS_P3);
  var allP4=LISTENING_P4.concat(BOSS_P4);
  var allP5=QUESTIONS.concat(BOSS_P5);
  var allP6=PART6_TEXTS.concat(BOSS_P6);
  var allP7=PART7_PASSAGES.concat(BOSS_P7);

  // Fisher-Yates shuffle helper
  function fy(arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}

  // Shuffle options for a 4-option question, return {options, correct}
  // `aud` doit remonter jusqu'a playP1/playP2 : l'ordre des reponses P1/P2 est
  // fige par le nom des MP3 (_0.._3). Sans lui, l'audio et le scoring divergent.
  function shufOpts4(opts,correct){
    var idx=[0,1,2,3];idx=fy(idx);
    return{options:idx.map(function(k){return opts[k];}),correct:idx.indexOf(correct),aud:idx};
  }
  function shufOpts3(opts,correct){
    var idx=[0,1,2];idx=fy(idx);
    return{options:idx.map(function(k){return opts[k];}),correct:idx.indexOf(correct),aud:idx};
  }

  // Pick & shuffle items, then shuffle their options
  var ep1=fy(allP1).slice(0,6).map(function(q){var s=shufOpts4(q.opts,q.c);return Object.assign({},q,{opts:s.options,c:s.correct,aud:s.aud});});
  var ep2=fy(allP2).slice(0,25).map(function(q){var s=shufOpts3(q.opts,q.c);return Object.assign({},q,{opts:s.options,c:s.correct,aud:s.aud});});
  var ep3=fy(allP3).slice(0,13).map(function(conv){return Object.assign({},conv,{qs:conv.qs.map(function(q){var s=shufOpts4(q.opts,q.c);return Object.assign({},q,{opts:s.options,c:s.correct});})});});
  var ep4=fy(allP4).slice(0,10).map(function(talk){return Object.assign({},talk,{qs:talk.qs.map(function(q){var s=shufOpts4(q.opts,q.c);return Object.assign({},q,{opts:s.options,c:s.correct});})});});
  var ep5=fy(allP5).slice(0,30).map(function(q){var s=shufOpts4(q.o,q.c);return Object.assign({},q,{o:s.options,c:s.correct});});
  var ep6=fy(allP6).slice(0,4).map(function(t){return Object.assign({},t,{parts:t.parts.map(function(pt){if(!pt.blank)return pt;var s=shufOpts4(pt.options,pt.correct);return Object.assign({},pt,{options:s.options,correct:s.correct});})});});
  // P7: pick enough passages for ~54 questions
  var p7Shuffled=fy(allP7);var ep7=[];var p7qCount=0;
  for(var i=0;i<p7Shuffled.length&&p7qCount<54;i++){
    var ps=p7Shuffled[i];if(!ps||!ps.questions||!ps.questions.length)continue;
    ep7.push(Object.assign({},ps,{questions:ps.questions.map(function(q){var s=shufOpts4(q.options,q.correct);return Object.assign({},q,{options:s.options,correct:s.correct});})}));
    p7qCount+=ps.questions.length;
  }
  return{p1:ep1,p2:ep2,p3:ep3,p4:ep4,p5:ep5,p6:ep6,p7:ep7};
}
// La grille de reponses epouse la FORME du test tire (nombre de passages P7,
// questions par passage...). generateEndlessTest() ne tire pas deux fois la meme
// forme : le nombre de passages P7 varie (14 ou 15, collectes jusqu a ~54 Q) et
// leurs longueurs aussi. Une grille construite pour un test ne vaut donc RIEN
// pour un autre : d ou freshAnsFor(t), qui prend le test en argument au lieu de
// capturer celui du rendu courant.
export function freshAnsFor(t){return{
  p1:t.p1.map(function(){return -1;}),p2:t.p2.map(function(){return -1;}),
  p3:t.p3.map(function(c){return c.qs.map(function(){return -1;});}),
  p4:t.p4.map(function(tk){return tk.qs.map(function(){return -1;});}),
  p5:t.p5.map(function(){return -1;}),
  p6:t.p6.map(function(tx){var n=0;tx.parts.forEach(function(pt){if(pt.blank)n++;});return Array(n).fill(-1);}),
  p7:t.p7.map(function(ps){return ps.questions.map(function(){return -1;});})
};}
// Garde-fou de reprise : refuse de rebrancher une grille de reponses sur un test
// dont elle n a pas la forme. Sans ce controle, ans.p7[qi] vaut undefined des que
// le test restaure a un passage de plus, et la Part 7 jette un TypeError en plein
// examen (deux heures de travail perdues). Ne jamais court-circuiter ce test :
// mieux vaut perdre la reprise que corrompre une epreuve notee.
export function endlessAnsFitsTest(a,t){
  if(!a||!t||!t.p1||!t.p7)return false;
  var flat=["p1","p2","p5"];
  for(var i=0;i<flat.length;i++){
    if(!a[flat[i]]||a[flat[i]].length!==t[flat[i]].length)return false;
  }
  if(!a.p3||a.p3.length!==t.p3.length)return false;
  for(var j=0;j<t.p3.length;j++){if(!a.p3[j]||a.p3[j].length!==t.p3[j].qs.length)return false;}
  if(!a.p4||a.p4.length!==t.p4.length)return false;
  for(var k=0;k<t.p4.length;k++){if(!a.p4[k]||a.p4[k].length!==t.p4[k].qs.length)return false;}
  if(!a.p6||a.p6.length!==t.p6.length)return false;
  for(var m=0;m<t.p6.length;m++){
    var nb=0;t.p6[m].parts.forEach(function(pt){if(pt.blank)nb++;});
    if(!a.p6[m]||a.p6[m].length!==nb)return false;
  }
  if(!a.p7||a.p7.length!==t.p7.length)return false;
  for(var q=0;q<t.p7.length;q++){if(!a.p7[q]||a.p7[q].length!==t.p7[q].questions.length)return false;}
  return true;
}
