// Relecture du lot Jet Lag (sans React : une liste). Lit le brouillon tel quel, rien n'est recopié.
import { P3_DRAFT, P4_DRAFT, P7_DRAFT } from "./jetlag_2026-09-25.js";

var ROLE = { p4_103: "bulletin météo · « Snow overnight »", p4_104: "bulletin météo · « Fog, then sun »", p4_105: "perturbation", p4_106: "perturbation" };
var SPK = { W: "Woman", M: "Man", W2: "Woman 2", M2: "Man 2" };
var notes = {};
try { notes = JSON.parse(localStorage.getItem("jetlag-review") || "{}"); } catch (e) { console.warn("[review] notes illisibles:", e && e.message); }
function save() { try { localStorage.setItem("jetlag-review", JSON.stringify(notes)); } catch (e) { console.warn("[review] save:", e && e.message); } }
function esc(s) { return String(s).replace(/[&<>]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch]; }); }

function qHtml(q, opts, c) {
  return '<div class="q">' + esc(q.q) + "</div>" +
    opts.map(function (o, i) { return '<div class="o' + (i === c ? " c" : "") + '">' + (i === c ? "✓ " : "· ") + esc(o) + "</div>"; }).join("") +
    (q.x ? '<div class="x">' + esc(q.x) + "</div>" : "");
}
function card(id, tags, body, qs) {
  var div = document.createElement("div");
  var n = notes[id] || {};
  div.className = "it" + (n.flag ? " flag" : "");
  div.innerHTML = '<div class="hd"><span class="id">' + id + "</span>" + tags.map(function (t) { return '<span class="tg">' + esc(t) + "</span>"; }).join("") + "</div>" +
    '<div class="tx">' + body + "</div>" + qs +
    '<div class="fb"><label><input type="checkbox"' + (n.flag ? " checked" : "") + "> à revoir</label>" +
    '<input type="text" placeholder="ta remarque" value="' + esc(n.note || "").replace(/"/g, "&quot;") + '"></div>';
  var cb = div.querySelector("input[type=checkbox]"), tx = div.querySelector("input[type=text]");
  cb.addEventListener("change", function () { notes[id] = Object.assign({}, notes[id], { flag: cb.checked }); div.className = "it" + (cb.checked ? " flag" : ""); save(); out(); });
  tx.addEventListener("input", function () { notes[id] = Object.assign({}, notes[id], { note: tx.value }); if (tx.value && !cb.checked) { cb.checked = true; notes[id].flag = true; div.className = "it flag"; } save(); out(); });
  return div;
}
function section(title) { var h = document.createElement("h2"); h.textContent = title; document.getElementById("list").appendChild(h); }
function render() {
  var list = document.getElementById("list");
  section("Part 3 · conversations (" + P3_DRAFT.length + ")");
  P3_DRAFT.forEach(function (c) {
    var speakers = new Set(c.lines.map(function (l) { return l.s; })).size;
    list.appendChild(card(c.id, [speakers + " locuteurs"],
      c.lines.map(function (l) { return "<b>" + SPK[l.s] + " :</b> " + esc(l.t); }).join("\n"),
      c.qs.map(function (q) { return qHtml(q, q.opts, q.c); }).join("")));
  });
  section("Part 4 · annonces et bulletins (" + P4_DRAFT.length + ")");
  P4_DRAFT.forEach(function (t) {
    list.appendChild(card(t.id, [t.type, "voix " + (t.voice === "M" ? "homme" : "femme"), ROLE[t.id] || ""], esc(t.text),
      t.qs.map(function (q) { return qHtml(q, q.opts, q.c); }).join("")));
  });
  section("Part 7 · documents (" + P7_DRAFT.length + ")");
  P7_DRAFT.forEach(function (p) {
    list.appendChild(card(p.id, [p.type, p.questions.length + " Q"], esc(p.text),
      p.questions.map(function (q) { return qHtml(q, q.options, q.correct); }).join("")));
  });
  out();
}
function out() {
  var ids = [].concat(P3_DRAFT, P4_DRAFT, P7_DRAFT).map(function (x) { return x.id; });
  var flagged = ids.filter(function (id) { return notes[id] && notes[id].flag; });
  document.getElementById("count").textContent = ids.length + " items · " + flagged.length + " à revoir";
  document.getElementById("out").value = flagged.length
    ? flagged.map(function (id) { return id + " : " + ((notes[id] && notes[id].note) || "(à revoir)"); }).join("\n")
    : "Tout validé (" + ids.length + " items).";
}
document.getElementById("copy").addEventListener("click", function () {
  var t = document.getElementById("out"); t.select();
  try { navigator.clipboard.writeText(t.value); } catch (e) { console.warn("[review] copy:", e && e.message); }
});
render();
