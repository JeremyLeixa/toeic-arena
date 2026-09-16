import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

import { supabase } from './supabase.js'

// Bridge window.storage → Supabase
// L'app existante appelle window.storage.get/set/delete
// On redirige vers Supabase transparently
window.supabaseClient = supabase;

// ── Chunk périmé après un déploiement (Phase 5, code-splitting) ──
// Un onglet resté ouvert sur l'ancien index.html demande, en entrant dans un écran lazy, un
// chunk dont le hash n'existe plus sur Vercel (404). Vite le signale par `vite:preloadError`
// et, si personne ne l'annule, lève l'erreur dans le Suspense → écran blanc. Ici : on recharge
// UNE fois (garde 60 s en sessionStorage, pour ne jamais boucler) ; si ça se reproduit dans la
// minute, on laisse Vite lever et le LoadBoundary (components/LoadingMark.jsx) affiche un
// bouton Reload. Un examen en cours n'est pas concerné : son chunk est déjà en mémoire, cet
// événement ne survient qu'en ENTRANT dans un écran pas encore chargé.
window.addEventListener("vite:preloadError", function(e){
  var K="va-chunk-reload", last=0;
  try{last=+sessionStorage.getItem(K)||0;}catch(err){console.warn("[CHUNK] sessionStorage:",err&&err.message);}
  var msg=e&&e.payload&&e.payload.message;
  if(Date.now()-last<60000){console.warn("[CHUNK] reload déjà tenté il y a moins d'une minute, abandon :",msg);return;}
  try{sessionStorage.setItem(K,String(Date.now()));}catch(err){console.warn("[CHUNK] sessionStorage:",err&&err.message);}
  e.preventDefault();
  console.warn("[CHUNK] chunk introuvable (déploiement entre-temps ?), rechargement :",msg);
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
