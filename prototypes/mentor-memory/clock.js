// Horloge figée du banc (2026-09-18) : les élèves simulés de personas.js vivent au lundi 21 septembre
// 2026, 8 h 30 (model.js NOW). Les vrais écrans lisent `new Date()` : on la fige AVANT tout autre import
// (un module ESM est évalué dans l'ordre de ses imports), sinon le plan « du jour » serait celui du
// vrai calendrier et la mission posée ne serait jamais « d'aujourd'hui ».
var RealDate = Date;
var FIXED = new RealDate(2026, 8, 21, 8, 30).getTime();
function FixedDate() {
  var a = Array.prototype.slice.call(arguments);
  if (!(this instanceof FixedDate)) return new RealDate(FIXED).toString();
  return a.length ? new (Function.prototype.bind.apply(RealDate, [null].concat(a)))() : new RealDate(FIXED);
}
FixedDate.prototype = RealDate.prototype;
FixedDate.now = function () { return FIXED; };
FixedDate.parse = RealDate.parse;
FixedDate.UTC = RealDate.UTC;
window.Date = FixedDate;
