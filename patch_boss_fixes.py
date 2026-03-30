#!/usr/bin/env python3
"""
Boss Test — Encoding Fix + TOEIC-Faithful P1/P2
1. P1: Show A B C D immediately, answer during audio (no text shown)
2. P2: Show A B C immediately, answer during audio (no text shown)  
3. Fix all double-escaped unicode → real characters

Usage: python patch_boss_fixes.py
"""

import os

APP = os.path.join("src", "App.jsx")

with open(APP, "r", encoding="utf-8") as f:
    app = f.read()

fixes = 0

# ═══════════════════════════════════════
# FIX 1: Replace P1 block (between markers)
# ═══════════════════════════════════════
print("1/3 — P1: TOEIC-faithful (blind A/B/C/D during audio)...")

P1_START = '    // \u2500\u2500 P1: Photos \u2500\u2500\n'
P1_END_MARKER = '    // \u2500\u2500 P2: Q&R \u2500\u2500'

p1s = app.find(P1_START)
p1e = app.find(P1_END_MARKER)

if p1s >= 0 and p1e >= 0:
    NEW_P1 = '    // \u2500\u2500 P1: Photos (TOEIC-faithful: blind A/B/C/D, answer during audio) \u2500\u2500\n    if(sec==="p1"){\n      var it=LP1[qi];var selP1=ans.p1[qi];\n      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>\n        {header}\n        <div style={{marginBottom:12,borderRadius:14,overflow:"hidden",border:"1px solid var(--bdr)"}}>\n          <img src={it.img} alt="TOEIC photo" style={{width:"100%",display:"block",maxHeight:240,objectFit:"cover"}}/>\n        </div>\n        {aState==="ready"&&<div style={{textAlign:"center",marginBottom:16}}>\n          <button onClick={playP1} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#f59e0b,#ef4444)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>{"\u25b6\ufe0f"}</span></button>\n          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Tap to play \u2014 listen and choose</p></div>}\n        {(aState==="playing"||aState==="done")&&<div>\n          {aState==="playing"&&<div style={{textAlign:"center",marginBottom:12}}>\n            <p className="out" style={{color:"var(--orange)",fontSize:13,animation:"pulse 1.5s infinite"}}>{"\ud83d\udd0a"} Playing statement {String.fromCharCode(65+(curOpt>=0?curOpt:0))}...</p></div>}\n          {aState==="done"&&selP1<0&&<div style={{textAlign:"center",marginBottom:12}}>\n            <p className="out" style={{color:"var(--green)",fontSize:13}}>Audio complete \u2014 choose your answer</p></div>}\n          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>\n            {["A","B","C","D"].map(function(letter,i){var sel=selP1===i;var playing2=aState==="playing"&&curOpt===i;return(<button key={i} onClick={function(){if(selP1<0)pick(i);}} style={{padding:"18px 10px",background:sel?"rgba(212,148,58,.2)":playing2?"rgba(245,158,11,.1)":"var(--bg2)",border:"2px solid "+(sel?"var(--cyan)":playing2?"var(--orange)":"var(--bdr)"),borderRadius:14,cursor:selP1<0?"pointer":"default",textAlign:"center",fontFamily:"\'Cinzel\',\'Outfit\',serif",transition:"all .15s"}}>\n              <div className="out" style={{fontSize:24,fontWeight:900,color:sel?"var(--cyan)":playing2?"var(--orange)":"var(--t2)"}}>{letter}</div>\n            </button>);})}\n          </div>\n        </div>}\n      </div>);\n    }\n\n'
    app = app[:p1s] + NEW_P1 + app[p1e:]
    fixes += 1
    print("  \u2705 P1 replaced")
else:
    print(f"  \u274c P1 markers not found (start={p1s}, end={p1e})")

# ═══════════════════════════════════════
# FIX 2: Replace P2 block (between markers)
# ═══════════════════════════════════════
print("2/3 — P2: TOEIC-faithful (blind A/B/C during audio)...")

P2_START = '    // \u2500\u2500 P2: Q&R \u2500\u2500\n'
P2_END_MARKER = '    // \u2500\u2500 P3: Conversations \u2500\u2500'

p2s = app.find(P2_START)
p2e = app.find(P2_END_MARKER)

if p2s >= 0 and p2e >= 0:
    NEW_P2 = '    // \u2500\u2500 P2: Q&R (TOEIC-faithful: blind A/B/C, answer during audio) \u2500\u2500\n    if(sec==="p2"){\n      var selP2=ans.p2[qi];\n      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>\n        {header}\n        {aState==="ready"&&<div style={{textAlign:"center",marginTop:40}}>\n          <button onClick={playP2} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#f59e0b,#ef4444)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>{"\u25b6\ufe0f"}</span></button>\n          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Tap to play \u2014 listen and choose</p></div>}\n        {(aState==="playing"||aState==="done")&&<div>\n          {aState==="playing"&&<div style={{textAlign:"center",marginBottom:16}}>\n            <p className="out" style={{color:"var(--orange)",fontSize:13,animation:"pulse 1.5s infinite"}}>{"\ud83d\udd0a"} {curOpt>=0?"Response "+String.fromCharCode(65+curOpt)+"...":"Question..."}</p></div>}\n          {aState==="done"&&selP2<0&&<div style={{textAlign:"center",marginBottom:16}}>\n            <p className="out" style={{color:"var(--green)",fontSize:13}}>Audio complete \u2014 choose your answer</p></div>}\n          <div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:280,margin:"20px auto 0"}}>\n            {["A","B","C"].map(function(letter,i){var sel=selP2===i;var playing2=aState==="playing"&&curOpt===i;return(<button key={i} onClick={function(){if(selP2<0)pick(i);}} style={{padding:"20px",background:sel?"rgba(212,148,58,.2)":playing2?"rgba(245,158,11,.1)":"var(--bg2)",border:"2px solid "+(sel?"var(--cyan)":playing2?"var(--orange)":"var(--bdr)"),borderRadius:14,cursor:selP2<0?"pointer":"default",textAlign:"center",fontFamily:"\'Cinzel\',\'Outfit\',serif",transition:"all .15s"}}>\n              <div className="out" style={{fontSize:28,fontWeight:900,color:sel?"var(--cyan)":playing2?"var(--orange)":"var(--t2)"}}>{letter}</div>\n            </button>);})}\n          </div>\n        </div>}\n      </div>);\n    }\n\n'
    app = app[:p2s] + NEW_P2 + app[p2e:]
    fixes += 1
    print("  \u2705 P2 replaced")
else:
    print(f"  \u274c P2 markers not found (start={p2s}, end={p2e})")

# ═══════════════════════════════════════
# FIX 3: Replace all double-escaped unicode with real characters
# ═══════════════════════════════════════
print("3/3 — Fixing double-escaped unicode...")

def fix_unicode(content):
    result = []
    i = 0
    count = 0
    while i < len(content):
        if (i+6 < len(content) and content[i] == '\\' and content[i+1] == '\\'
            and content[i+2] == 'u'
            and all(c in '0123456789abcdefABCDEF' for c in content[i+3:i+7])):
            code = int(content[i+3:i+7], 16)
            if 0xD800 <= code <= 0xDBFF:
                if (i+13 < len(content) and content[i+7] == '\\' and content[i+8] == '\\'
                    and content[i+9] == 'u'
                    and all(c in '0123456789abcdefABCDEF' for c in content[i+10:i+14])):
                    code2 = int(content[i+10:i+14], 16)
                    if 0xDC00 <= code2 <= 0xDFFF:
                        full = 0x10000 + (code - 0xD800) * 0x400 + (code2 - 0xDC00)
                        result.append(chr(full))
                        count += 1
                        i += 14
                        continue
                result.append(content[i])
                i += 1
                continue
            elif 0xDC00 <= code <= 0xDFFF:
                result.append(content[i])
                i += 1
                continue
            else:
                result.append(chr(code))
                count += 1
                i += 7
                continue
        result.append(content[i])
        i += 1
    return ''.join(result), count

app, ucount = fix_unicode(app)
if ucount > 0:
    print(f"  \u2705 Converted {ucount} unicode sequences to real characters")
    fixes += 1
else:
    print("  \u23ed No double-escaped unicode found")

# Also fix HTML entities from the original patch
html_fixes = {
    '&#x25b6;': '\u25b6',
    '&#x2694;': '\u2694',
    '&#x1F409;': '\U0001F409',
    '&#x1f409;': '\U0001F409',
}
hf = 0
for entity, char in html_fixes.items():
    c = app.count(entity)
    if c > 0:
        app = app.replace(entity, char)
        hf += c
if hf > 0:
    print(f"  \u2705 Replaced {hf} HTML entities")

# ═══════════════════════════════════════
# WRITE
# ═══════════════════════════════════════
with open(APP, "w", encoding="utf-8") as f:
    f.write(app)

print(f"\n{'='*40}")
print(f"\u2705 {fixes}/3 fixes applied")
if fixes >= 2:
    print("\U0001F409 P1: Blind A/B/C/D grid, answer during audio")
    print("\U0001F409 P2: Blind A/B/C stack, answer during audio")
    print("\U0001F409 All unicode/HTML entities \u2192 real characters")
print("="*40)
