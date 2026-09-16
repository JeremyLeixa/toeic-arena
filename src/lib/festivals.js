// Thèmes saisonniers (« festivals ») — moteur de dates. Pur, sans import, requérable en Node.
//
// POURQUOI (2026-09-16). Pendant une fenêtre de dates, App.jsx pose `fest-<id>` À LA PLACE de
// `skin-<id>` sur la racine `.app` (ligne `lc`). Le skin équipé (`u.equippedSkin` / `skin_id`)
// n'est jamais touché et revient à la fin de la fenêtre. Nom « festival » et pas « season » :
// `season` est déjà la Ligue (S1-S4, `seasons` jsonb). Proto, palettes et décisions :
// prototypes/festival-themes/README.md. Test : tests/check_festivals.cjs.
//
// Dates LOCALES partout, bornes incluses : la fête commence à minuit chez l'élève, pas à minuit
// UTC (`today()` de lib/util.js est en UTC, ne pas s'en servir ici).
//
// L'opt-out gagne TOUJOURS, forçage compris : `?fest=<id>` ne fait que lever la fenêtre de
// dates. Sinon un « Turn off » cliqué pendant un test forcé ne ferait rien de visible.

// themeColor = `--bg` des paquets `.fest-<id>` / `.light.fest-<id>` d'appCss.js (barre d'état du
// navigateur, meta theme-color). Recopié ici faute de lire le CSS calculé ; le test vérifie l'égalité.
export var FESTIVALS=[
  {id:"halloween",name:"Hallow's Eve",greeting:"Happy Halloween,",icon:"spider-web",from:"10-24",to:"11-02",themeColor:{dark:"#0a0612",light:"#f4eefa"}},
  // Chevauche l'an : `to < from` → la fin tombe l'année suivante.
  {id:"yule",name:"Yuletide",greeting:"Merry Yuletide,",icon:"ringing-bell",from:"12-14",to:"01-04",themeColor:{dark:"#06110b",light:"#f2f7f2"}},
  // Fête mobile : Pâques −5 → +1 (jours), jamais à cheval sur l'an.
  {id:"spring",name:"Spring Bloom",greeting:"Happy Spring,",icon:"herbs-bundle",easter:[-5,1],themeColor:{dark:"#0d1112",light:"#fbf6f8"}},
  {id:"solstice",name:"Summer Send-off",greeting:"Summer's calling,",icon:"sunrise",from:"06-19",to:"06-28",themeColor:{dark:"#0c0a1e",light:"#fdf7f0"}}
];
// Hors fête : `--bg` de `:root` et de `.light`.
export var DEFAULT_THEME_COLOR={dark:"#0f0c08",light:"#f5f0e8"};

var OPT_OUT_KEY="toeic-festivals";  // "off" = désactivé par l'élève (patron du mute `toeic-sound`)
var FORCE_KEY="toeic-fest-force";    // id ou "none" : forçage de test sans barre d'URL (PWA installée)
var MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var DAY_MS=864e5;

function dayStart(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate());}
function addDays(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);}
function monthDay(year,s){var p=s.split("-");return new Date(year,parseInt(p[0],10)-1,parseInt(p[1],10));}

// Dimanche de Pâques, calendrier grégorien (algorithme de Meeus/Jones/Butcher).
export function easterDate(year){
  var a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4;
  var f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30;
  var i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
  var n=h+l-7*m+114;
  return new Date(year,Math.floor(n/31)-1,(n%31)+1);
}

export function festivalById(id){
  for(var i=0;i<FESTIVALS.length;i++)if(FESTIVALS[i].id===id)return FESTIVALS[i];
  return null;
}
function resolveFestival(fest){return typeof fest==="string"?festivalById(fest):fest;}

// Occurrence qui COMMENCE l'année `year`.
function occurrenceStartingIn(fest,year){
  if(fest.easter){var e=easterDate(year);return {start:addDays(e,fest.easter[0]),end:addDays(e,fest.easter[1])};}
  return {start:monthDay(year,fest.from),end:monthDay(fest.to<fest.from?year+1:year,fest.to)};
}

// {start,end} de l'occurrence qui contient `date`, sinon de la PROCHAINE (le forçage hors
// fenêtre affiche ainsi de vraies dates). Les occurrences d'une fête sont ordonnées et
// disjointes : la première qui ne soit pas déjà finie est la bonne.
export function festivalOccurrence(fest,date){
  fest=resolveFestival(fest);if(!fest)return null;
  var day=dayStart(date),y=day.getFullYear();
  for(var yy=y-1;yy<=y+1;yy++){
    var occ=occurrenceStartingIn(fest,yy);
    if(occ.end>=day)return occ;
  }
  return null;
}

export function inFestivalWindow(fest,date){
  var occ=festivalOccurrence(fest,date);
  return !!occ&&occ.start<=dayStart(date);
}

// La fête dont la fenêtre contient `date` (ni opt-out ni forçage), ou null.
export function activeFestival(date){
  for(var i=0;i<FESTIVALS.length;i++)if(inFestivalWindow(FESTIVALS[i],date))return FESTIVALS[i];
  return null;
}

export function festivalsEnabled(){
  try{return typeof localStorage==="undefined"||localStorage.getItem(OPT_OUT_KEY)!=="off";}
  catch(e){console.warn("[festivals] read opt-out caught:",e&&e.message);return true;}
}
export function setFestivalsEnabled(on){
  try{localStorage.setItem(OPT_OUT_KEY,on?"on":"off");}
  catch(e){console.warn("[festivals] write opt-out caught:",e&&e.message);}
}

// Forçage de test : `?fest=<id>` dans l'URL, sinon localStorage `toeic-fest-force`. "none" force
// l'absence de fête (voir l'app normale pendant une vraie fenêtre). Valeur inconnue : ignorée.
export function forcedFestivalId(){
  var v=null;
  try{
    if(typeof window!=="undefined"&&window.location)v=new URLSearchParams(window.location.search).get("fest");
    if(!v&&typeof localStorage!=="undefined")v=localStorage.getItem(FORCE_KEY);
  }catch(e){console.warn("[festivals] read force caught:",e&&e.message);}
  if(v==="none")return "none";
  return v&&festivalById(v)?v:null;
}

// La fête de la fenêtre courante (ou forcée), que l'élève l'ait désactivée ou non (Profil).
export function windowFestivalId(date){
  var forced=forcedFestivalId();
  if(forced==="none")return null;
  if(forced)return forced;
  var f=activeFestival(date);
  return f?f.id:null;
}

// La fête effectivement appliquée à `.app`.
export function appliedFestivalId(date){
  return festivalsEnabled()?windowFestivalId(date):null;
}

// Jours pleins entre `date` et la fin de l'occurrence (0 = dernier jour). Arrondi : un passage
// à l'heure d'hiver fait 25 h entre deux minuits.
export function festivalDaysLeft(fest,date){
  var occ=festivalOccurrence(fest,date);
  return occ?Math.max(0,Math.round((occ.end-dayStart(date))/DAY_MS)):0;
}

export function formatFestivalDate(d){return MONTHS[d.getMonth()]+" "+d.getDate();}

export function festivalThemeColor(festId,light){
  var f=festivalById(festId),c=f&&f.themeColor?f.themeColor:DEFAULT_THEME_COLOR;
  return light?c.light:c.dark;
}
// Met à jour TOUS les meta theme-color : index.html en déclare trois, le navigateur lit le premier
// qui correspond, et un seul oublié laisserait l'ancienne couleur selon l'ordre retenu.
export function applyThemeColor(festId,light){
  if(typeof document==="undefined")return;
  var color=festivalThemeColor(festId,light);
  var metas=document.querySelectorAll('meta[name="theme-color"]');
  for(var i=0;i<metas.length;i++)metas[i].setAttribute("content",color);
}
