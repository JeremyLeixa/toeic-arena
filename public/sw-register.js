// Enregistrement du service worker. Sorti de index.html le 2026-09-30 : un <script> inline
// obligeait la CSP à garder script-src 'unsafe-inline', ce qui laissait passer toute XSS
// injectée dans la page (et avec elle le jeton de session, rangé en localStorage par
// supabase-js). Ne pas le remettre inline : tests/check_csp.cjs le refuse.
if ('serviceWorker' in navigator) {
  // Nuclear option: unregister old SW, re-register fresh
  navigator.serviceWorker.getRegistrations().then(function(regs) {
    regs.forEach(function(reg) {
      // Force update check
      reg.update();
      // If SW is stuck on old cache, unregister and reload
      if (reg.active && reg.active.scriptURL.indexOf('sw.js') !== -1) {
        reg.active.postMessage({type: 'VERSION_CHECK'});
      }
    });
  });
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js', {updateViaCache: 'none'}).then(function(reg) {
      reg.update();
    });
  });
  // Auto-reload when a new SW takes control
  var _swRefreshing=false;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if(!_swRefreshing){_swRefreshing=true;window.location.reload();}
  });
}
