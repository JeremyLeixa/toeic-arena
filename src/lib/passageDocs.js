// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.

// ─── PART 7 READING COMPREHENSION ───
// ── Multi-document passage viewer (Double/Triple Passages) ──
// Splits a P7 `text` field on "--- DOCUMENT N: Label ---" markers into tabs so
// mobile users switch between the linked documents instead of scrolling past all
// of them stacked. Single passages (no markers) render as plain pre-line text,
// so every existing single/letter/memo/email passage is untouched.
// IMPORTANT: give the component a `key` tied to the passage id at each call site
// so the active tab resets to Doc 1 when the passage changes.
export function parsePassageDocs(text){
  if(!text||text.indexOf("--- DOCUMENT")<0)return null;
  var re=/---\s*DOCUMENT\s*\d+\s*:?\s*([^\n]*?)\s*---/g;
  var docs=[],m,lastIdx=0,lastLabel=null;
  while((m=re.exec(text))){
    if(lastLabel!==null)docs.push({label:lastLabel,body:text.slice(lastIdx,m.index).replace(/^\s+|\s+$/g,"")});
    lastLabel=(m[1]||"").replace(/-+$/,"").replace(/^\s+|\s+$/g,"");
    lastIdx=re.lastIndex;
  }
  if(lastLabel!==null)docs.push({label:lastLabel,body:text.slice(lastIdx).replace(/^\s+|\s+$/g,"")});
  return docs.length>=2?docs:null;
}
