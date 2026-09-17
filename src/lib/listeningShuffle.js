// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { BOSS_P2 } from "../data/bossTestFull.js";
import { shuffle, srand } from "./util.js";

// ─── Listening : randomisation de la position des bonnes reponses ───
// Les pools listening ont ete rediges avec un biais positionnel massif :
// B = 43% en P2, 41% en P3, 55% en P4, et BOSS_P2 n'a qu'un seul C sur 25.
// Un eleve pouvait scorer sans ecouter (signale par un etudiant iabd2627,
// 2026-09-15 : "toutes les bonnes reponses sont B"). On permute au runtime
// plutot que de reecrire ~800 items et de renommer ~1150 MP3.
//
// DEUX COUPLAGES A NE JAMAIS CASSER EN TOUCHANT A CA :
//
//  1. AUDIO (P1/P2 seulement). L'ordre des reponses est fige par le nom des
//     fichiers : {id}_0/_1/_2(/_3).mp3. La permutation DOIT etre transportee
//     jusqu'au lecteur via `aud` : aud[position affichee] = index audio
//     d'origine. Un playXX() qui reboucle sur 0,1,2 en dur fait entendre la
//     reponse A pendant que l'app score la reponse C — c'est exactement le
//     bug qui existait dans l'Endless Arena avant le 2026-09-15.
//     P3/P4 ne sont pas concernes : l'audio est la conversation, pas les options.
//     Et la LETTRE n'est plus dans le clip (2026-09-16) : jusque-la les clips
//     d'options disaient « B. … » eux-memes, donc permuter les jouait avec la
//     mauvaise lettre. Elle est un clip a part, joue par playLetteredOption
//     (lib/audio.js) a la position AFFICHEE, dans la voix de l'item
//     (lib/listeningVoices.js). Ne jamais regenerer un clip d'option avec sa lettre.
//
//  2. EXPLICATIONS (P1/P2 seulement). Elles citent les lettres ("Only B names
//     someone"). Sans reecriture, l'explication designe la mauvaise option.
//     P3/P4 n'en citent aucune (verifie sur 546 items) : rien a faire.
export function shufListeningOpts(opts,correct){
  var idx=[];for(var i=0;i<opts.length;i++)idx.push(i);
  idx=shuffle(idx);
  return{opts:idx.map(function(k){return opts[k];}),c:idx.indexOf(correct),aud:idx};
}
// "A" est la seule lettre ambigue : c'est aussi l'article anglais ("A laptop is
// open"). Elle est un LABEL quand elle est suivie d'une ponctuation, d'une
// parenthese, d'une conjonction, d'un modal, ou d'un verbe a la 3e personne
// (termine par -s ou n't) ; un article est suivi d'un nom/adjectif, qui ne l'est
// jamais. B/C/D ne sont jamais ambigues. Regle verifiee exhaustivement sur les
// 288 explications P1+P2 : elle laisse exactement les 21 articles de P1 et
// remappe tout le reste. Si un jour un item ecrit "A business card is..." (nom
// en -s apres l'article) il faudra reformuler l'explication, pas la regle.
export var A_IS_OPT_LABEL=/^(?:$|[.,;:)/]|\s*[([]|\s+(?:is|are|was|were|will|would|cannot|can't|and|or)\b|\s+[a-z]+(?:s|n't)\b)/;
// Detection UNIQUE des lettres d'option d'une explication (remappage et citation la partagent).
// fn(index d'option) rend le remplacement, ou null pour laisser la lettre telle quelle.
function mapOptLetters(x,fn){
  if(!x)return x;
  return x.replace(/(^|[^A-Za-z'])([A-D])(?![A-Za-z'])/g,function(m,pre,L,off,str){
    if(L==="A"&&!A_IS_OPT_LABEL.test(str.slice(off+m.length)))return m;
    var r=fn(L.charCodeAt(0)-65);
    return r==null?m:pre+r;
  });
}
export function remapOptLetters(x,aud){
  var inv={};
  for(var i=0;i<aud.length;i++)inv[aud[i]]=i;
  return mapOptLetters(x,function(k){return inv[k]==null?null:String.fromCharCode(65+inv[k]);});
}
// Lecons de l'ecran de fin (SessionResult) : la carte ne montre ni les lettres ni toutes les
// options, donc « C confirms... B gives... » n'y designe rien. Chaque lettre devient le texte de
// l'option, cite (point final retire). TOUJOURS sur l'item d'ORIGINE (x et opts non permutes) :
// un x deja remappe ne se relit pas (« B and C trap » peut devenir « ... and A trap », et ce A
// suivi d'un nom passe pour un article). D'ou xq, calcule une fois a la permutation.
export function quoteOptLetters(x,opts){
  return mapOptLetters(x,function(k){
    return k<opts.length?"\u201C"+String(opts[k]).replace(/\.$/,"")+"\u201D":null;
  });
}
// Permute un item listening complet (options + bonne reponse + explication).
// `withAudio` a true seulement pour P1/P2, ou `aud` doit survivre jusqu'au lecteur.
export function shufListeningItem(it){
  var s=shufListeningOpts(it.opts,it.c);
  return Object.assign({},it,{opts:s.opts,c:s.c,aud:s.aud,x:remapOptLetters(it.x,s.aud),xq:quoteOptLetters(it.x,it.opts)});
}
// Variante DETERMINISTE, pour le Boss Test uniquement.
// Le Boss persiste sa session en stockant les reponses PAR INDEX. Une permutation
// tiree au hasard a chaque montage ferait donc correspondre les reponses deja
// donnees a d'autres options au moment de la reprise. Derivee de l'id de l'item,
// la permutation est identique a chaque montage : la reprise reste juste, et le
// "toujours B" saute quand meme (BOSS_P2 etait a 14 bonnes reponses sur 25 en B,
// et une seule en C — soit 56% en tapant B sans ecouter, sur une epreuve notee).
// Contrairement au training, on NE peut PAS randomiser par session ici : ce serait
// reintroduire le bug de reprise. Le prix a payer est qu'un eleve qui refait le
// Boss plusieurs fois retrouve la meme disposition — c'est le comportement normal
// d'un test fixe, et c'est deja le cas de l'ordre des questions.
export function seedFromId(id){
  var h=0;
  for(var i=0;i<id.length;i++){h=(h*31+id.charCodeAt(i))%100000;}
  return h+1;
}
// 0.2 n'est pas arbitraire : c'est le pas qui, sur les 25 items de BOSS_P2, donne
// la repartition la plus equilibree (A8/B9/C8, jamais plus de 2 fois la meme
// lettre d'affilee). Le changer redistribue tout le Boss -> bumper BOSS_LAYOUT_V.
export var BOSS_SHUF_STEP=0.2;
export function detShufListeningItem(it){
  var idx=[];for(var i=0;i<it.opts.length;i++)idx.push(i);
  var sd=seedFromId(it.id);
  for(var j=idx.length-1;j>0;j--){
    var k=Math.floor(srand(sd+j*BOSS_SHUF_STEP)*(j+1));
    var t=idx[j];idx[j]=idx[k];idx[k]=t;
  }
  return Object.assign({},it,{opts:idx.map(function(q){return it.opts[q];}),
    c:idx.indexOf(it.c),aud:idx,x:remapOptLetters(it.x,idx),xq:quoteOptLetters(it.x,it.opts)});
}
// Calcule une fois au chargement du module : pure fonction de donnees statiques.
// BOSS_P2 reste brut pour l'Endless, qui applique sa propre permutation par run.
export var BOSS_P2_SHUF=BOSS_P2.map(detShufListeningItem);
