"""Vectorise le wordmark Verse Arena depuis Cinzel (public/fonts), sans <text>.

Usage : py -3 tools/wordmark.py   (Nib Sword -> nib-sword/) ; VA_MARK=tiered pour le Tiered V (-> final/)
Cinzel est une police variable (wght 400-900) : on l'instancie à 700, puis on
convertit chaque glyphe en chemin SVG. L'approche (avance + interlettrage manuel)
remplace le kerning GPOS, qu'on règle à l'œil paire par paire dans KERN.
"""
import io
import os
import sys

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", "..", ".."))
FONT = os.path.join(ROOT, "public", "fonts", "cinzel-latin.woff2")
LOGO = os.path.normpath(os.path.join(HERE, ".."))

WGHT = 700
# Corrections optiques (unités de police, UPM 1000) ajoutées après la lettre de gauche.
KERN = {"VE": -10, "RS": -6, "SE": 0, "AR": -14, "RE": -4, "EN": 0, "NA": -12}

# Symbole Tiered V (canvas 256) : flancs à 60°, 3 gradins (contremarche 28, giron 18), piste 32.
SYMBOL = ("M19.46 34 L76 34 L76 62 L94 62 L94 90 L112 90 L112 118 L144 118 L144 90 "
          "L162 90 L162 62 L180 62 L180 34 L236.54 34 L128 222 Z")
# Version petite taille (≤ 24 px) : 2 gradins (contremarche 42), piste 56.
SYMBOL_SMALL = ("M19.46 34 L80 34 L80 76 L100 76 L100 118 L156 118 L156 76 L176 76 "
                "L176 34 L236.54 34 L128 222 Z")

# Symbole Nib Sword (retenu le 2026-10-22) : plume métallique, épée en réserve (quillons tombants, lame effilée),
# un seul contour qui entre par la fente du bec. Encre x 60-196, y 20-236.
# Garde : arêtes à 15° exacts, bouts à 105° ; seule la lame effilée (≈ 2,5°) sort de la grille, volontairement.
NIB = ("M88 20 L168 20 L168 40 C186 52 196 76 196 110 C196 158 164 196 130 236 L130 210 L134 198 L138 105.74 "
       "L158.97 111.36 L162 100.04 L132 92 L132 74.25 A11 11 0 1 0 124 74.25 L124 92 L94 100.04 L97.03 111.36 L118 105.74 L122 198 "
       "L126 210 L126 236 C92 196 60 158 60 110 C60 76 70 52 88 40 Z")
# Coupe ≤ 24 px : épée épaissie, fente 8.
NIB_SMALL = ("M88 20 L168 20 L168 40 C186 52 196 76 196 110 C196 158 164 196 132 236 L132 206 L140 190 L144 110.28 "
             "L168.97 116.97 L174 98.18 L136 88 L136 71.86 A16 16 0 1 0 120 71.86 L120 88 L82 98.18 L87.03 116.97 L112 110.28 L116 190 "
             "L124 206 L124 236 C92 196 60 158 60 110 C60 76 70 52 88 40 Z")

# Marque active : chemin, coupe petite taille, encre gauche, encre droite, bas de l'encre, dossier de sortie.
MARKS = {
    "tiered": (SYMBOL, SYMBOL_SMALL, 19.46, 236.54, 222, "final"),
    "nib": (NIB, NIB_SMALL, 60, 196, 236, "nib-sword"),
}
MARK = os.environ.get("VA_MARK", "nib")
SYM, SYM_SMALL, INK_L, INK_R, INK_B, OUTDIR = MARKS[MARK]
OUT = os.path.join(LOGO, OUTDIR)


def load_font():
    f = TTFont(FONT)
    f.flavor = None
    buf = io.BytesIO()
    f.save(buf)
    buf.seek(0)
    f = TTFont(buf)
    if "fvar" in f:
        f = instancer.instantiateVariableFont(f, {"wght": WGHT}, overlap=instancer.OverlapMode.REMOVE)
    return f


FONT_OBJ = load_font()
GS = FONT_OBJ.getGlyphSet()
CMAP = FONT_OBJ.getBestCmap()
UPM = FONT_OBJ["head"].unitsPerEm
CAP = FONT_OBJ["OS/2"].sCapHeight or 700


def set_line(text, cap_px, x0, baseline, tracking=0):
    """Chemins SVG d'une ligne en capitales. cap_px = hauteur de capitale voulue.
    tracking en unités de police. Rend (d, largeur réelle de l'encre)."""
    s = cap_px / CAP
    pen = SVGPathPen(GS)
    bpen = BoundsPen(GS)
    x = 0.0
    for i, ch in enumerate(text):
        if ch == " ":
            x += 260 + tracking
            continue
        g = CMAP[ord(ch)]
        t = (s, 0, 0, -s, x0 + x * s, baseline)
        GS[g].draw(TransformPen(pen, t))
        GS[g].draw(TransformPen(bpen, t))
        x += GS[g].width + tracking
        if i + 1 < len(text):
            x += KERN.get(ch + text[i + 1], 0)
    b = bpen.bounds
    return pen.getCommands(), b


def svg(viewbox, body, title):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s">\n  <title>%s</title>\n%s\n</svg>\n'
            % (viewbox, title, body))


def shift_left(d_bounds, target_x):
    return target_x - d_bounds[0]


def horizontal(fill="#000"):
    # Bloc texte centré sur le centre visuel du symbole (y=128) : VERSE cap 92, interligne 28, ARENA cap 38.
    gap, cap1, lead, cap2 = 52, 92, 28, 38
    top = 128 - (cap1 + lead + cap2) / 2
    tx = INK_R + gap  # le texte part de l'encre du symbole + gap
    d1, b1 = set_line("VERSE", cap1, 0, top + cap1, tracking=40)
    d2, b2 = set_line("ARENA", cap2, 0, top + cap1 + lead + cap2, tracking=330)
    w1, w2 = b1[2] - b1[0], b2[2] - b2[0]
    # ARENA justifié sur la largeur de VERSE : on recalcule l'interlettrage.
    n = 4
    extra = (w1 - w2) / n / (cap2 / CAP)
    d2, b2 = set_line("ARENA", cap2, 0, top + cap1 + lead + cap2, tracking=330 + extra)
    body = ('  <g fill="%s">\n    <path d="%s"/>\n    <g transform="translate(%.2f 0)"><path d="%s"/></g>\n'
            '    <g transform="translate(%.2f 0)"><path d="%s"/></g>\n  </g>'
            % (fill, SYM, tx - b1[0], d1, tx - b2[0], d2))
    x0 = INK_L - 20
    width = tx + w1 + 20 - x0
    return svg("%.1f 0 %.0f 256" % (x0, width), body, "Verse Arena"), width


def stacked(fill="#000"):
    # Symbole en haut (256), puis VERSE et ARENA centrés dessous.
    cap1, cap2, lead = 50, 21, 18
    d1, b1 = set_line("VERSE", cap1, 0, 0, tracking=40)
    w1 = b1[2] - b1[0]
    d2, b2 = set_line("ARENA", cap2, 0, 0, tracking=330)
    extra = (w1 - (b2[2] - b2[0])) / 4 / (cap2 / CAP)
    d2, b2 = set_line("ARENA", cap2, 0, 0, tracking=330 + extra)
    W = max(256, w1 + 40)
    sx = (W - 256) / 2
    y1 = INK_B + 40 + cap1
    y2 = y1 + lead + cap2
    body = ('  <g fill="%s">\n    <path transform="translate(%.2f 0)" d="%s"/>\n'
            '    <g transform="translate(%.2f %.2f)"><path d="%s"/></g>\n'
            '    <g transform="translate(%.2f %.2f)"><path d="%s"/></g>\n  </g>'
            % (fill, sx, SYM, (W - w1) / 2 - b1[0], y1, d1, (W - (b2[2] - b2[0])) / 2 - b2[0], y2, d2))
    return svg("0 %d %.0f %.0f" % (14, W, y2 + 20 - 14), body, "Verse Arena"), W


def wordmark(fill="#000"):
    # Une ligne, sans symbole : « VERSE ARENA », cap 100.
    cap = 100
    d, b = set_line("VERSE ARENA", cap, 0, 0, tracking=60)
    w = b[2] - b[0]
    pad = 20
    body = ('  <g fill="%s"><g transform="translate(%.2f %.2f)"><path d="%s"/></g></g>'
            % (fill, pad - b[0], pad + cap, d))
    return svg("0 0 %.0f %.0f" % (w + 2 * pad, cap + 2 * pad), body, "Verse Arena"), w


def wordmark_v(fill="#000"):
    # Une ligne où le V de VERSE EST le symbole : hauteur = capitale, pointe 3 % sous la ligne de base
    # (dépassement optique d'une forme pointue), puis « ERSE ARENA » en Cinzel.
    cap, pad = 100, 20
    s = cap * 1.03 / 188
    gap = 6
    d, b = set_line("ERSE ARENA", cap, 0, 0, tracking=60)
    vx = pad - 19.46 * s
    vy = pad - 34 * s
    sym_w = (236.54 - 19.46) * s
    tx = pad + sym_w + gap
    w = tx + (b[2] - b[0]) + pad
    body = ('  <g fill="%s">\n    <path transform="translate(%.2f %.2f) scale(%.4f)" d="%s"/>\n'
            '    <g transform="translate(%.2f %.2f)"><path d="%s"/></g>\n  </g>'
            % (fill, vx, vy, s, SYMBOL, tx - b[0], pad + cap, d))
    return svg("0 0 %.0f %.0f" % (w, cap * 1.03 + 2 * pad), body, "Verse Arena"), w


def symbol(d=None, fill="#000", title="Verse Arena"):
    return svg("0 0 256 256", '  <path fill="%s" d="%s"/>' % (fill, d or SYM), title)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    fills = {"black": "#000000", "gold": "#D4943A", "night": "#0F0C08", "deepgold": "#6F5410",
             "white": "#FFFFFF", "parchment": "#EDE4D4"}
    variants = sys.argv[1:] or list(fills)
    for name in variants:
        f = fills[name]
        files = {
            "verse-arena-symbol-%s.svg" % name: symbol(fill=f),
            "verse-arena-symbol-small-%s.svg" % name: symbol(SYM_SMALL, f),
            "verse-arena-horizontal-%s.svg" % name: horizontal(f)[0],
            "verse-arena-stacked-%s.svg" % name: stacked(f)[0],
            "verse-arena-wordmark-%s.svg" % name: wordmark(f)[0],
        }
        if MARK == "tiered":  # le V intégré au nom n'a de sens que pour le Tiered V
            files["verse-arena-wordmark-v-%s.svg" % name] = wordmark_v(f)[0]
        for fn, content in files.items():
            with open(os.path.join(OUT, fn), "w", encoding="utf-8") as fh:
                fh.write(content)
    print("cap height", CAP, "upm", UPM, "->", OUT)
