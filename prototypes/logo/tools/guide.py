"""Guide d'usage d'une page (HTML autonome, SVG et police embarqués) -> final/verse-arena-guide.html.

Usage : py -3 tools/guide.py   puis render_png.py final/verse-arena-guide.html pour la capture.
"""
import base64
import os

HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.normpath(os.path.join(HERE, ".."))
# Marque active, comme tools/wordmark.py : VA_MARK=tiered -> final/, défaut nib -> nib-sword/.
MARK = os.environ.get("VA_MARK", "nib")
FINAL = os.path.join(LOGO, "final" if MARK == "tiered" else "nib-sword")
TXT = {
    "tiered": {
        "lead": "Le V de Verse est une arène vue en coupe : ses gradins montent comme des niveaux. Un seul aplat, une seule couleur à la fois.",
        "x": "X = hauteur de deux gradins du symbole (≈ ¼ de sa hauteur).",
        "small": "%(small)s",
    },
    "nib": {
        "lead": "Une plume métallique dont la fente et le trou d'aération dessinent une épée : la plume est plus forte que l'épée. Un seul aplat, une seule couleur à la fois.",
        "x": "X = largeur de la garde de l'épée (≈ ½ de la largeur du symbole).",
        "small": "≤ 24 px : coupe petite taille (épée épaissie)",
    },
}[MARK]
FONT = os.path.normpath(os.path.join(LOGO, "..", "..", "public", "fonts", "cinzel-latin.woff2"))


def svg_inline(name):
    with open(os.path.join(FINAL, name), encoding="utf-8") as fh:
        s = fh.read()
    return "data:image/svg+xml;base64," + base64.b64encode(s.encode("utf-8")).decode()


def img(name, h, cls=""):
    return '<img class="%s" src="%s" style="height:%dpx" alt="">' % (cls, svg_inline(name), h)


def stretched():
    # Contre-exemple « déformer » : le même symbole, sans conservation des proportions.
    with open(os.path.join(FINAL, "verse-arena-symbol-night.svg"), encoding="utf-8") as fh:
        s = fh.read().replace("<svg ", '<svg preserveAspectRatio="none" ', 1)
    return "data:image/svg+xml;base64," + base64.b64encode(s.encode("utf-8")).decode()


font64 =base64.b64encode(open(FONT, "rb").read()).decode()

COLOURS = [
    ("Or arène", "#D4943A", "212 148 58", "0 30 73 17", "≈ 7563 C *", "Marque sur fond nuit · accent"),
    ("Nuit", "#0F0C08", "15 12 8", "0 20 47 94", "≈ Black 4 C *", "Marque sur fond clair · fonds d'app"),
    ("Or profond", "#6F5410", "111 84 16", "0 24 86 56", "≈ 7559 C *", "Or lisible sur fond clair (6,3:1)"),
    ("Parchemin", "#EDE4D4", "237 228 212", "0 4 11 7", "≈ 9224 C *", "Marque claire sur photo sombre"),
]

rows = "".join(
    '<tr><td><span class="chip" style="background:%s"></span>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>'
    % (hx, n, hx, rgb, cmyk, pms, use) for n, hx, rgb, cmyk, pms, use in COLOURS)

html = """<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Verse Arena — guide du logo</title>
<style>
@font-face{font-family:'Cinzel';font-weight:600 900;src:url(data:font/woff2;base64,%(font)s) format('woff2')}
*{box-sizing:border-box}
body{margin:0;background:#f5f0e8;color:#1a1510;font:14px/1.45 'Segoe UI',system-ui,sans-serif}
.page{width:1400px;padding:48px 56px;margin:0 auto}
h1{font-family:Cinzel,serif;font-weight:700;font-size:34px;letter-spacing:.04em;margin:0}
h2{font-family:Cinzel,serif;font-weight:700;font-size:15px;letter-spacing:.12em;text-transform:uppercase;margin:0 0 12px;color:#6f5410}
.lead{margin:6px 0 28px;color:#5a5040;font-size:16px}
.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:20px}
.card{background:#fffcf5;border:1px solid rgba(120,90,50,.15);border-radius:12px;padding:20px}
.dark{background:#0f0c08;color:#ede4d4;border-color:#0f0c08}
.dark h2{color:#d4943a}
.c4{grid-column:span 4}.c6{grid-column:span 6}.c8{grid-column:span 8}.c12{grid-column:span 12}.c3{grid-column:span 3}
.row{display:flex;align-items:center;gap:28px;flex-wrap:wrap}
.lbl{font-size:12px;color:#756b54;margin-top:6px}
.dark .lbl{color:#8a7e6a}
.clear{position:relative;display:inline-block;padding:40px;outline:1.5px dashed #d4943a;outline-offset:0}
.clear:after{content:'X';position:absolute;left:12px;top:12px;font:700 12px Cinzel,serif;color:#d4943a}
table{width:100%%;border-collapse:collapse;font-size:13px}
td,th{text-align:left;padding:7px 8px;border-bottom:1px solid rgba(120,90,50,.12)}
th{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#756b54}
.chip{display:inline-block;width:16px;height:16px;border-radius:4px;vertical-align:-3px;margin-right:8px;border:1px solid rgba(0,0,0,.15)}
ul{margin:0;padding-left:18px}li{margin:3px 0}
.dont{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
.dont div{background:#fffcf5;border:1px solid rgba(184,32,32,.25);border-radius:10px;padding:14px;text-align:center;font-size:12px;color:#b82020}
.dont img{display:block;margin:0 auto 8px}
.note{font-size:12px;color:#756b54;margin-top:8px}
</style></head><body><div class="page">
<h1>Verse Arena — guide du logo</h1>
<p class="lead">%(lead)s</p>
<div class="grid">

<div class="card c8"><h2>Les versions</h2><div class="row">
<div>%(horiz)s<div class="lbl">Horizontale · version principale</div></div>
<div>%(stack)s<div class="lbl">Empilée · carré, badge, kakemono</div></div>
<div>%(sym)s<div class="lbl">Symbole seul · icône, avatar</div></div>
</div>%(wmv_block)s</div>

<div class="card dark c4"><h2>En inversé</h2>
%(horiz_gold)s<div class="lbl">Or arène sur nuit · usage par défaut dans l'app</div>
<div style="margin-top:22px">%(sym_parch)s</div><div class="lbl">Parchemin sur photo ou fond sombre très chargé</div>
</div>

<div class="card c6"><h2>Zone de protection</h2>
<div class="clear">%(horiz2)s</div>
<p class="note">%(xnote)s Rien n'entre dans cette zone. Elle grandit avec le logo.</p></div>

<div class="card c6"><h2>Tailles minimales</h2>
<div class="row"><div>%(sym16)s<div class="lbl">%(small)s</div></div>
<div>%(sym48)s<div class="lbl">≥ 24 px : symbole complet</div></div></div>
<table style="margin-top:14px"><tr><th>Version</th><th>Écran</th><th>Impression</th></tr>
<tr><td>Horizontale</td><td>120 px de large</td><td>30 mm</td></tr>
<tr><td>Empilée</td><td>64 px de large</td><td>18 mm</td></tr>
<tr><td>Symbole</td><td>16 px (coupe petite taille)</td><td>5 mm</td></tr>
%(wmv_row)s</table></div>

<div class="card c8"><h2>Couleurs</h2><table><tr><th>Nom</th><th>HEX</th><th>RVB</th><th>CMJN</th><th>Pantone</th><th>Usage</th></tr>%(rows)s</table>
<p class="note">* Pantone et CMJN approchés, à valider sur nuancier imprimé avant toute impression. L'or arène sur fond clair n'est pas lisible (2,3:1) : sur clair, encre nuit ou or profond.</p></div>

<div class="card c4"><h2>Typographie</h2><ul>
<li><b>Cinzel 700</b> : le logo (vectorisé, ne jamais le retaper) et les titres. Licence SIL OFL, usage logo autorisé.</li>
<li><b>DM Sans</b> : texte courant de l'app et des documents.</li>
<li>Le nom s'écrit <b>Verse Arena</b> dans une phrase, en capitales seulement dans le logo.</li></ul></div>

<div class="c12"><h2 style="margin-top:4px">À ne pas faire</h2><div class="dont">
<div>%(d_stretch)s Déformer</div>
<div>%(d_rot)s Pivoter</div>
<div>%(d_grad)s Dégradé, ombre, contour</div>
<div>%(d_low)s Or arène sur fond clair</div>
<div>%(d_type)s Retaper le nom dans une autre police</div>
</div></div>

</div></div></body></html>
"""

d = {
    "font": font64,
    "horiz": img("verse-arena-horizontal-night.svg", 92),
    "horiz2": img("verse-arena-horizontal-night.svg", 80),
    "stack": img("verse-arena-stacked-night.svg", 120),
    "sym": img("verse-arena-symbol-night.svg", 96),
    "lead": TXT["lead"],
    "xnote": TXT["x"],
    "small": TXT["small"],
    "wmv_block": ('<div class="row" style="margin-top:18px"><div>%s<div class="lbl">Wordmark intégré · en-tête de '
                  "l'app, bas de page</div></div></div>" % img("verse-arena-wordmark-v-night.svg", 38)) if MARK == "tiered"
                 else ('<div class="row" style="margin-top:18px"><div>%s<div class="lbl">Nom seul · rare, quand le '
                       'symbole est déjà présent ailleurs</div></div></div>' % img("verse-arena-wordmark-night.svg", 34)),
    "wmv_row": "<tr><td>Wordmark intégré</td><td>110 px de large</td><td>28 mm</td></tr>" if MARK == "tiered" else "",
    "horiz_gold": img("verse-arena-horizontal-gold.svg", 84),
    "sym_parch": img("verse-arena-symbol-parchment.svg", 72),
    "sym16": img("verse-arena-symbol-small-night.svg", 24),
    "sym48": img("verse-arena-symbol-night.svg", 48),
    "rows": rows,
    "d_stretch": '<img src="%s" style="height:56px;width:110px">' % stretched(),
    "d_rot": '<img src="%s" style="height:56px;transform:rotate(14deg)">' % svg_inline("verse-arena-symbol-night.svg"),
    "d_grad": '<img src="%s" style="height:56px;filter:drop-shadow(3px 4px 2px rgba(0,0,0,.5))">' % svg_inline("verse-arena-symbol-gold.svg"),
    "d_low": '<img src="%s" style="height:56px">' % svg_inline("verse-arena-symbol-gold.svg"),
    "d_type": '<span style="display:block;height:56px;line-height:56px;font:italic 700 22px Georgia,serif;color:#0f0c08">Verse Arena</span>',
}

out = os.path.join(FINAL, "verse-arena-guide.html")
with open(out, "w", encoding="utf-8") as fh:
    fh.write(html % d)
print("wrote", out)
