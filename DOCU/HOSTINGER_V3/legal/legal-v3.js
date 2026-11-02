// Pages legales v3 : barre de lecture, nav qui se densifie, retour en haut
(function () {
  var nav = document.querySelector('.legal-nav');
  var bar = document.getElementById('v3-progress');
  var top = document.getElementById('v3-top');
  function tick() {
    var y = window.scrollY || document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (nav) nav.classList.toggle('solid', y > 20);
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0).toFixed(4) + ')';
    if (top) top.classList.toggle('show', y > 700);
  }
  if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick);
  tick();
})();
