// Écrans chargés à la demande (Phase 5, code-splitting, 2026-09-16).
//
// Les écrans de features/ sont des exports NOMMÉS ; React.lazy attend un export default.
// lazyNamed fait le pont : `var BossTest=lazyNamed(function(){return import("./features/exams/BossTest.jsx");},"BossTest");`
// Règles (tests/check_import_graph.cjs les vérifie) : le chemin existe, le nom est bien
// exporté par la cible, et la cible n'est PLUS importée statiquement nulle part — sinon le
// chunk ne sort pas du bundle principal, en silence. Dans App.jsx, nommer l'alias `XLazy`
// (le recensement de symboles refuserait un `Profile` déclaré deux fois) ; dans routes.jsx,
// exempt du recensement, garder le nom local historique pour ne pas toucher aux routes.
import { lazy } from "react";

var LOADERS=[];

export function lazyNamed(load,name){
  LOADERS.push(load);
  return lazy(function(){
    return load().then(function(m){
      // Plus lisible qu'un « Element type is invalid » : attrapé par LoadBoundary.
      if(!m||!m[name])throw new Error("lazyNamed: export « "+name+" » introuvable dans le module chargé");
      return{default:m[name]};
    });
  });
}

// Préchauffage à l'idle : recharge en arrière-plan, l'un après l'autre, tous les chunks
// déclarés via lazyNamed — mêmes `import()`, donc mêmes chunks, rien en double. Objectif :
// garder la parité hors-ligne d'avant le découpage (le SW met en cache chaque chunk servi),
// pour les mêmes octets qu'aujourd'hui, mais APRÈS le premier affichage. Sauté si l'appareil
// demande l'économie de données. Appelé une fois par App.jsx quand le profil est chargé.
var _preloadStarted=false;
export function preloadLazyScreens(){
  if(_preloadStarted)return;_preloadStarted=true;
  try{
    if(typeof navigator!=="undefined"&&navigator.connection&&navigator.connection.saveData){console.warn("[CHUNK] saveData actif : pas de préchauffage");return;}
  }catch(e){console.warn("[CHUNK] navigator.connection:",e&&e.message);}
  var queue=LOADERS.slice();
  function schedule(fn){
    if(typeof requestIdleCallback==="function")requestIdleCallback(function(){fn();},{timeout:4000});
    else setTimeout(fn,300);
  }
  function next(){
    if(!queue.length)return;
    var load=queue.shift();
    load().catch(function(e){console.warn("[CHUNK] préchauffage :",e&&e.message);}).then(function(){schedule(next);});
  }
  setTimeout(function(){schedule(next);},3000);
}
