// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.

// ─── GRIMOIRE RENDERER (block-based pedagogical manuscript) ───
// Consumes blocks from data/grammarGauntletGrimoire.js.
// Mobile-first: single page, swipe left/right, CSS 3D flip animation.
// ─── DOWNLOADABLE GRIMOIRE ───
// Open a new window with the full grimoire rendered as a self-contained HTML
// document. Screen view uses the Arena palette (gold/cream, serif titles).
// @media print switches to B&W professional layout (no backgrounds, page-break
// per chapter, A4-friendly margins) so the user can Ctrl/Cmd+P → Save as PDF
// without bleeding ink on chest decorations. Triggered from GrimoireReader topbar.
export function escHtml(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
export function renderGrimoireBlockHtml(b){
  if(b.type==="paragraph")return"<p class=\"g-p\">"+escHtml(b.text)+"</p>";
  if(b.type==="heading")return"<h3 class=\"g-h\">"+escHtml(b.text)+"</h3>";
  if(b.type==="rule"){var lbl=b.label?"<div class=\"g-rule-lbl\">"+escHtml(b.label)+"</div>":"";return"<div class=\"g-rule\">"+lbl+"<div class=\"g-rule-f\">"+escHtml(b.formula)+"</div></div>";}
  if(b.type==="example"){var en="<div class=\"g-ex-en\">"+escHtml(b.en)+"</div>";var fr=b.fr?"<div class=\"g-ex-fr\">"+escHtml(b.fr)+"</div>":"";var note=b.note?"<div class=\"g-ex-note\">"+escHtml(b.note)+"</div>":"";return"<div class=\"g-ex\">"+en+fr+note+"</div>";}
  if(b.type==="trap")return"<div class=\"g-trap\"><span class=\"g-trap-tag\">Piège</span> "+escHtml(b.text)+"</div>";
  if(b.type==="table"){var hd=b.headers.map(function(h){return"<th>"+escHtml(h)+"</th>";}).join("");var rw=b.rows.map(function(r){return"<tr>"+r.map(function(c){return"<td>"+escHtml(c)+"</td>";}).join("")+"</tr>";}).join("");return"<table class=\"g-table\"><thead><tr>"+hd+"</tr></thead><tbody>"+rw+"</tbody></table>";}
  if(b.type==="list")return"<ul class=\"g-list\">"+b.items.map(function(it){return"<li>"+escHtml(it)+"</li>";}).join("")+"</ul>";
  return"";
}
export function downloadGrimoire(grim){
  var romans=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
  var chapters=grim.chapters.map(function(ch,i){
    var blocks=ch.blocks.map(renderGrimoireBlockHtml).join("\n");
    var intro=ch.intro?"<p class=\"g-intro\">"+escHtml(ch.intro)+"</p>":"";
    var num=romans[i]||(i+1);
    return"<section class=\"g-chapter\"><div class=\"g-chap-num\">Chapitre "+num+"</div><h2 class=\"g-chap-title\">"+escHtml(ch.title)+"</h2>"+intro+blocks+"</section>";
  }).join("\n");
  var html="<!DOCTYPE html><html lang=\"fr\"><head><meta charset=\"utf-8\"><title>"+escHtml(grim.title)+"</title><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><link rel=\"stylesheet\" href=\"/grimoire-export.css\"></head><body><div class=\"g-toolbar\"><button class=\"g-print-btn\">"+"🖨️ Imprimer / Enregistrer en PDF</button><div class=\"g-hint\">Astuce : choisir « Enregistrer en PDF » comme destination</div></div><div class=\"g-header\"><h1 class=\"g-title\">"+escHtml(grim.title)+"</h1>"+(grim.subtitle?"<div class=\"g-subtitle\">"+escHtml(grim.subtitle)+"</div>":"")+"<div class=\"g-meta\">"+(grim.readingTime?"Lecture : "+escHtml(grim.readingTime)+" · ":"")+grim.chapters.length+" chapitres</div></div>"+chapters+"<div class=\"g-footer\">Verse Arena · Grimoire exporté pour étude personnelle</div></body></html>";
  var w=window.open("","_blank");
  if(!w){alert("La fenêtre d'export a été bloquée. Autorise les pop-ups pour ce site et réessaie.");return;}
  w.document.open();w.document.write(html);w.document.close();
  // Pas de onclick inline : la fenêtre about:blank hérite de la CSP de l'appli (script-src 'self', 2026-09-30),
  // un gestionnaire inline y serait bloqué en silence. Le clic est câblé depuis l'appli, ce qui est permis.
  var pb=w.document.querySelector(".g-print-btn");
  if(pb)pb.addEventListener("click",function(){w.print();});
}
