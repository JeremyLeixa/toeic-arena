// Blog Verse Arena v3 : barre de lecture + barre de navigation qui se densifie au scroll
(function () {
  var nav = document.querySelector('.nav');
  var bar = document.getElementById('v3-progress');
  var art = document.querySelector('.article .content');
  function tick() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle('solid', y > 20);
    if (bar && art) {
      var top = art.offsetTop, h = art.offsetHeight - window.innerHeight * 0.4;
      var p = h > 0 ? Math.min(1, Math.max(0, (y - top + window.innerHeight * 0.3) / h)) : 0;
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
  }
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick);
  tick();
})();
