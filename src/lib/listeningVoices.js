// Voix des clips Listening P1/P2 — UNE règle, partagée par l'app et par le script de
// génération (scripts/regen-listening-letterless.mjs). Pure, requérable en Node.
//
// POURQUOI (2026-09-16). Les clips d'options P1/P2 étaient synthétisés AVEC leur lettre
// (« B. It's on Thursday… »). Depuis la permutation des options (2026-09-15), l'élève
// entendait « B. » en première position : lettre et position ne collaient plus, et dans
// l'Endless (P1/P2 en aveugle) cliquer la lettre entendue était compté faux. Les clips
// sont désormais SANS lettre, et la lettre est un clip à part (/audio/letters/<voix>_<L>.mp3),
// joué dans la MÊME voix juste avant l'option, à la position AFFICHÉE. La permutation
// redevient libre : ce qu'on entend est toujours A, B, C(, D) dans l'ordre.
//
// La voix d'un item se déduit de son numéro : c'est ce qui permet à l'app de choisir le bon
// clip de lettre sans stocker la voix dans les données, et au script de regénérer un item
// à l'identique. Ne pas changer ces règles sans regénérer les clips concernés.
export var LISTENING_VOICES=[
  {key:"sarah",  id:"EXAVITQu4vr4xnSDxMaL",label:"Sarah, US female"},
  {key:"adam",   id:"pNInz6obpgDQGcFmaJgB",label:"Adam, US male"},
  {key:"ca_f",   id:"XJVfsOvSwUXluggMM5Jj",label:"Canadian female"},
  {key:"uk_m",   id:"fATgBRI8wg5KkDFg8vBd",label:"British male"},
  {key:"voice_a",id:"4yye0QE5YPsKbMOCGGlj",label:"Voice A (non-US, male)"},
  {key:"voice_b",id:"rfkTsdZrVWEVhDycUYn9",label:"Voice B (non-US, female)"}
];
export var LETTERS=["A","B","C","D"];

export function itemNumber(id){var m=/(\d+)$/.exec(id||"");return m?parseInt(m[1],10):0;}
export function isBossItem(id){return /^bp/.test(id||"");}

// P1 : un seul locuteur lit les 4 énoncés.
export function p1Voice(id){return LISTENING_VOICES[itemNumber(id)%LISTENING_VOICES.length];}
// P2 : la question et les réponses sont dites par DEUX locuteurs différents (TOEIC), à
// trois pas d'écart dans le cycle pour changer d'accent et, autant que possible, de sexe.
export function p2QuestionVoice(id){return LISTENING_VOICES[itemNumber(id)%LISTENING_VOICES.length];}
export function p2ResponseVoice(id){return LISTENING_VOICES[(itemNumber(id)+3)%LISTENING_VOICES.length];}

// Voix qui annonce les lettres d'un item : celle de ses options. Les items du Boss (ids
// bp1_/bp2_) gardent leurs clips d'origine, sans lettre, dits par plusieurs voix : Sarah,
// la voix des questions du Boss, annonce leurs lettres.
export function letterVoiceKey(part,id){
  if(isBossItem(id))return "sarah";
  return part==="p1"?p1Voice(id).key:p2ResponseVoice(id).key;
}
// URL du clip « A. » / « B. » … à jouer avant l'option AFFICHÉE en position `pos`.
export function letterClipUrl(part,id,pos){
  return "/audio/letters/"+letterVoiceKey(part,id)+"_"+LETTERS[pos]+".mp3";
}

// Mimic Hunt, mode écoute (2026-09-19) : la source d'un item `spoken` lue par une seule voix, du genre du
// locuteur — `voice` ("m"/"f", messagerie qui se présente), sinon `speaker` (Man / Woman), sinon l'une des
// six. L'index vient du numéro de l'item : scripts/gen-mimic-audio.mjs régénère un clip à l'identique.
var MIMIC_MALE=["adam","uk_m","voice_a"],MIMIC_FEMALE=["sarah","ca_f","voice_b"];
export function mimicVoice(it){
  var g=it.voice||(it.speaker==="Man"?"m":it.speaker==="Woman"?"f":null);
  var pool=g==="m"?MIMIC_MALE:g==="f"?MIMIC_FEMALE:LISTENING_VOICES.map(function(v){return v.key;});
  var key=pool[itemNumber(it.id)%pool.length];
  for(var i=0;i<LISTENING_VOICES.length;i++)if(LISTENING_VOICES[i].key===key)return LISTENING_VOICES[i];
  return LISTENING_VOICES[0];
}
export function mimicClipUrl(id){return "/audio/mimic/"+id+".mp3";}
