/**
 * TOEIC Arena — Fix Part 6
 *  1. Auto-fix texts where _____ is embedded (splits at _____)
 *  2. Add option shuffling in Part6Drill component
 *
 * Usage: node fix-part6.cjs
 */

const fs = require('fs');
const path = require('path');
let changes = 0;

// ═══════════════════════════════════════════
// FIX 1: part6.js — auto-split at _____
// ═══════════════════════════════════════════
console.log('\n📦 Fix 1: part6.js — auto-fix blank positions\n');

const P6_FILE = path.join(process.cwd(), 'src', 'data', 'part6.js');
if (!fs.existsSync(P6_FILE)) { console.error('❌ src/data/part6.js not found.'); process.exit(1); }

fs.copyFileSync(P6_FILE, P6_FILE + '.bak-p6fix');

// Use dynamic approach: require the module, fix the data, rewrite
// Can't require ESM, so parse the raw text instead

let p6 = fs.readFileSync(P6_FILE, 'utf-8');

// Find all text parts that contain _____ and split them
// Pattern: {text:"...before_____after..."} followed by {blank:true,...}
// After fix: {text:"...before"}, {blank:true,...}, {text:"after..."}

// But we also need to handle the case where after the blank, there's {text:""}
// which is a leftover empty text that should be merged

const regex = /\{text:"([^"]*_____[^"]*)"\},\n(\s*)\{blank:true/g;
let match;
let fixCount = 0;

while ((match = regex.exec(p6)) !== null) {
  const fullMatch = match[0];
  const textContent = match[1];
  const indent = match[2];
  
  const splitIdx = textContent.indexOf('_____');
  const before = textContent.substring(0, splitIdx);
  const after = textContent.substring(splitIdx + 5);
  
  // Find if the next line after the blank is {text:""}
  const afterBlankPos = p6.indexOf('{blank:true', match.index + fullMatch.length - '{blank:true'.length);
  
  // Build replacement: split text, blank stays, add remaining text
  // Check if next text part is empty and should receive the 'after' content
  const replacement = `{text:"${before}"},\n${indent}{blank:true`;
  
  // Find the position right after the blank's closing }
  const blankStart = match.index + `{text:"${textContent}"},\n${indent}`.length;
  const blankEndSearch = p6.indexOf('},', blankStart);
  const afterBlank = p6.substring(blankEndSearch + 2).trimStart();
  
  // Check if next part is {text:""}
  if (afterBlank.startsWith('{text:""}')) {
    // Replace {text:""} with {text:" after content "}
    const emptyTextPos = p6.indexOf('{text:""}', blankEndSearch);
    const emptyReplacement = `{text:"${after}"}`;
    p6 = p6.substring(0, emptyTextPos) + emptyReplacement + p6.substring(emptyTextPos + '{text:""}'.length);
    console.log(`  ✅ Fixed empty text after blank (merged "${after.substring(0,40)}...")`);
  } else if (afterBlank.startsWith('{text:"')) {
    // Next text part exists — prepend 'after' to it
    const nextTextPos = p6.indexOf('{text:"', blankEndSearch);
    const oldStart = '{text:"';
    p6 = p6.substring(0, nextTextPos) + `{text:"${after}` + p6.substring(nextTextPos + oldStart.length);
    console.log(`  ✅ Prepended after-text to next part ("${after.substring(0,40)}...")`);
  }
  
  // Now replace the original text part (remove _____)
  p6 = p6.replace(`{text:"${textContent}"}`, `{text:"${before}"}`);
  
  fixCount++;
  changes++;
  console.log(`  ✅ Split text at _____ (before: "...${before.slice(-20)}")`);
  
  // Reset regex since we modified the string
  regex.lastIndex = 0;
}

if (fixCount === 0) {
  console.log('  ℹ️  No _____ found in text parts — already fixed or none present');
} else {
  console.log(`\n  Fixed ${fixCount} texts with misplaced blanks`);
}

fs.writeFileSync(P6_FILE, p6, 'utf-8');

// Validate: no more _____ in text parts
const check = p6.match(/\{text:"[^"]*_____[^"]*"\}/g);
if (check) {
  console.log('\n  ⚠️  Still found _____ in: ');
  check.forEach(function(m) { console.log('    ' + m.substring(0, 80)); });
} else {
  console.log('  ✅ Validation: no remaining _____ in text parts');
}

// ═══════════════════════════════════════════
// FIX 2: App.jsx — Shuffle options
// ═══════════════════════════════════════════
console.log('\n📦 Fix 2: App.jsx — Shuffle Part 6 options\n');

const APP_FILE = path.join(process.cwd(), 'src', 'App.jsx');
if (!fs.existsSync(APP_FILE)) { console.error('❌ src/App.jsx not found.'); process.exit(1); }

fs.copyFileSync(APP_FILE, APP_FILE + '.bak-p6fix');
let app = fs.readFileSync(APP_FILE, 'utf-8');

const search = `var curBlank=blanks[bi];

  function doAns(i){
    sPk(i);
    if(i===curBlank.correct)`;

const replacement = `// Shuffle options per blank — stable per session
  var shuffledBlanks=useMemo(function(){
    var all=[];
    texts.forEach(function(t){
      t.parts.forEach(function(p){
        if(!p.blank)return;
        var indices=[];for(var k=0;k<p.options.length;k++)indices.push(k);
        for(var i=indices.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=indices[i];indices[i]=indices[j];indices[j]=tmp;}
        all.push({options:indices.map(function(k){return p.options[k];}),correct:indices.indexOf(p.correct),x:p.x});
      });
    });
    return all;
  },[]);
  var blankGlobalIdx=useMemo(function(){var c=0;for(var i=0;i<ti;i++){texts[i].parts.forEach(function(pp){if(pp.blank)c++;});}return c;},[ti]);
  var curBlank=shuffledBlanks[blankGlobalIdx+bi];

  function doAns(i){
    sPk(i);
    if(i===curBlank.correct)`;

const idx = app.indexOf(search);
if (idx === -1) {
  console.log('  ⚠️  NOT FOUND: curBlank shuffle insertion point');
} else {
  app = app.substring(0, idx) + replacement + app.substring(idx + search.length);
  changes++;
  console.log('  ✅ Added shuffled blanks with stable indices');
}

fs.writeFileSync(APP_FILE, app, 'utf-8');

// ═══════════════════════════════════════════
console.log('\n' + '═'.repeat(50));
console.log('✅ Done! ' + changes + ' patches applied.');
console.log('═'.repeat(50));
