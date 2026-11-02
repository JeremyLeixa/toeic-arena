
// ── v3 ──────────────────────────────────────────────
// Écrans de l'appli : clone les <template> dans chaque .v3-ph
document.querySelectorAll('.v3-ph[data-screen]').forEach(function (el) {
  var t = document.getElementById('v3-tpl-' + el.getAttribute('data-screen'));
  if (t) el.appendChild(t.content.cloneNode(true));
});

// Révélation au scroll
var v3rev = document.querySelectorAll('.v3-reveal');
if ('IntersectionObserver' in window) {
  var v3o = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); v3o.unobserve(e.target); } });
  }, { threshold: 0.12 });
  v3rev.forEach(function (el) { v3o.observe(el); });
} else { v3rev.forEach(function (el) { el.classList.add('in'); }); }

// Vidéo d'intro en modale (ne charge le fichier qu'à l'ouverture)
var v3dlg = document.getElementById('v3-video'), v3vid = document.getElementById('v3-video-el');
document.getElementById('v3-play-btn').addEventListener('click', function () {
  if (typeof v3dlg.showModal === 'function') { v3dlg.showModal(); v3vid.preload = 'auto'; var p = v3vid.play(); if (p && p.catch) p.catch(function (e) { console.warn('[v3] play blocked:', e && e.message); }); }
  else { window.open('assets/intro.mp4', '_blank'); }
});
function v3closeVideo() { v3vid.pause(); if (v3dlg.open) v3dlg.close(); }
document.getElementById('v3-close').addEventListener('click', v3closeVideo);
v3dlg.addEventListener('click', function (e) { if (e.target === v3dlg) v3closeVideo(); });
v3dlg.addEventListener('close', function () { v3vid.pause(); });

// Barre CTA collante (mobile) : visible quand le hero est passé et tant que le CTA final n'est pas à l'écran
var v3sticky = document.getElementById('v3-sticky'), v3hero = document.querySelector('.v3-hero'), v3fin = document.querySelector('.v3-final');
var v3heroGone = false, v3finalIn = false;
function v3sync() { v3sticky.classList.toggle('show', v3heroGone && !v3finalIn); }
if ('IntersectionObserver' in window && v3hero && v3fin) {
  new IntersectionObserver(function (es) { v3heroGone = !es[0].isIntersecting; v3sync(); }, { threshold: 0.05 }).observe(v3hero);
  new IntersectionObserver(function (es) { v3finalIn = es[0].isIntersecting; v3sync(); }, { threshold: 0.1 }).observe(v3fin);
}
