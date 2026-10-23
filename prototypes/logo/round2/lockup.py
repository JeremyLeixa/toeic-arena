"""Lockups horizontaux du 2e tour : symbole (SVG 256) + VERSE / ARENA vectorisés (Cinzel 700, via tools/wordmark.py).

Usage : py -3 lockup.py   (depuis round2/)
Marges d'encre gauche/droite relevées par svg_audit.py : le texte part de l'encre du symbole + GAP.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "tools"))
from wordmark import set_line, CAP  # noqa: E402

GAP = 52
CONCEPTS = {"d-v2": (45.7, 44.9), "e-v5": (39.3, 41.6), "f-v2": (60.0, 60.0)}


def inner(name):
    s = open(os.path.join(HERE, name + ".svg"), encoding="utf-8").read()
    s = re.sub(r"<\?xml.*?\?>", "", s)
    body = s[s.index(">", s.index("<svg")) + 1: s.rindex("</svg>")]
    return re.sub(r"<title>.*?</title>", "", body, flags=re.S)


for name, (ml, mr) in CONCEPTS.items():
    cap1, lead, cap2 = 92, 28, 38
    top = 128 - (cap1 + lead + cap2) / 2
    tx = 256 - mr + GAP
    d1, b1 = set_line("VERSE", cap1, 0, top + cap1, tracking=40)
    w1 = b1[2] - b1[0]
    _, b2 = set_line("ARENA", cap2, 0, 0, tracking=330)
    extra = (w1 - (b2[2] - b2[0])) / 4 / (cap2 / CAP)
    d2, b2 = set_line("ARENA", cap2, 0, top + cap1 + lead + cap2, tracking=330 + extra)
    x0 = ml - 20
    w = tx + w1 + 20 - x0
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%.1f 0 %.1f 256">\n  <title>Verse Arena</title>\n'
           '  <g>%s</g>\n  <g transform="translate(%.2f 0)"><path d="%s"/></g>\n'
           '  <g transform="translate(%.2f 0)"><path d="%s"/></g>\n</svg>\n'
           % (x0, w, inner(name), tx - b1[0], d1, tx - b2[0], d2))
    out = os.path.join(HERE, name.split("-")[0] + "-lockup.svg")
    open(out, "w", encoding="utf-8").write(svg)
    print("wrote", out)
