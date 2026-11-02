# Genere prototypes/blog-v3/ a partir des pages du blog en production (DOCU/HOSTINGER/blog/*.html).
# Contenu inchange (sauf le chiffre de la phrase CTA de l'article 800, aligne sur la landing) ; seul l'habillage change.
# Usage (depuis la racine du repo) : py prototypes/blog-v3/build.py
import io, re, glob, os, shutil

SRC = 'DOCU/HOSTINGER/blog/'
OUT = 'prototypes/blog-v3/'
P = OUT + '_parts/'
R = lambda p: io.open(p, encoding='utf-8').read()

def W(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s)

SPRITE = R(P + 'sprite.html')
EMOJI = [('\U0001F4C5', 'calendar'), ('⏱️', 'clock'), ('⏱', 'clock'), ('✍️', 'feather'), ('✍', 'feather'),
         ('\U0001F4A1', 'bulb'), ('⚠️', 'alert'), ('⚠', 'alert'), ('\U0001F3F0', 'castle'), ('⚔️', 'swords'),
         ('⚔', 'swords'), ('\U0001F3A7', 'headphones'), ('\U0001F5BC️', 'image'), ('\U0001F5BC', 'image')]
def ico(name, cls='ico ico-inl'):
    return '<svg class="%s" aria-hidden="true"><use href="#i-%s"/></svg>' % (cls, name)
def no_emoji(s):
    for e, n in EMOJI:
        s = s.replace(e + ' ', ico(n)).replace(e, ico(n))
    return s

TAG_ICON = {'Pédagogie': 'trophy', 'Reading': 'book', 'Listening': 'headphones', 'Grammaire': 'feather', 'Guide complet': 'target'}

# ---- metadonnees des articles, lues dans le blog index ----
idx = R(SRC + 'index.html')
CARD = re.compile(r'<a href="([^"]+)" class="article-card">\s*<div class="tag" style="([^"]*)">([^<]+)</div>\s*<h2>(.+?)</h2>\s*<p>(.+?)</p>\s*<div class="meta">\s*<span>\U0001F4C5 ([^<]+)</span>\s*<span>⏱️ ([^<]+)</span>', re.S)
cards = [dict(href=m[0], style=m[1], tag=m[2], title=m[3], desc=m[4], date=m[5], read=m[6]) for m in CARD.findall(idx)]
assert len(cards) == 5, len(cards)

def card_html(c, with_desc=True, featured=False):
    desc = '<p>%s</p>' % c['desc'] if with_desc else ''
    return ('<a href="%s" class="article-card%s">\n  <div class="ac-ico">%s</div>\n  <div class="ac-body">\n'
            '    <div class="tag" style="%s">%s</div>\n    <h2>%s</h2>\n    %s\n'
            '    <div class="meta">\n      <span>%s%s</span>\n      <span>%s%s</span>\n      <span class="read-more" style="margin-left:auto">Lire %s</span>\n    </div>\n  </div>\n</a>'
            % (c['href'], ' featured' if featured else '', ico(TAG_ICON.get(c['tag'], 'book'), 'ico'), c['style'], c['tag'], c['title'], desc,
               ico('calendar', 'ico'), c['date'], ico('clock', 'ico'), c['read'], ico('arrow', 'ico')))

NAV_LINKS = ('<div class="nav-links">\n    <a href="https://verse-arena.fr" class="nav-link-text">Accueil</a>\n'
             '    <a href="https://verse-arena.fr/#features" class="nav-link-text">Fonctionnalités</a>\n'
             '    <a href="https://verse-arena.fr/#pricing" class="nav-link-text">Tarifs</a>\n'
             '    <a href="https://verse-arena.fr/blog/" class="nav-link-text nav-on">Blog</a>\n'
             '    <a href="https://app.verse-arena.fr" target="_blank" class="cta-sm">Commencer</a>\n  </div>')
FOOTER = ('<footer class="v3-foot">\n  <div class="brand"><img src="/logo-mark.svg" alt="" width="34" height="34"><span>VERSE ARENA</span></div>\n'
          '  <nav aria-label="Pied de page">\n    <a href="https://verse-arena.fr">Accueil</a><a href="https://verse-arena.fr/#features">Fonctionnalités</a>'
          '<a href="https://verse-arena.fr/#pricing">Tarifs</a><a href="https://verse-arena.fr/blog/">Blog</a><a href="https://app.verse-arena.fr" target="_blank">Commencer</a>\n'
          '    <a href="/legal/cgv.html">CGV</a><a href="/legal/confidentialite.html">Confidentialité</a><a href="/legal/mentions.html">Mentions légales</a>\n  </nav>\n'
          '  <p>Créé par Jérémy Leixa — Formateur en anglais</p>\n'
          '  <p style="margin-top:4px;font-size:10px!important;color:rgba(90,80,64,.6)">© 2026 Verse Arena · TOEIC® est une marque déposée d\'ETS Global</p>\n</footer>')

def common(s, article):
    s = s.replace('</head>', '<link rel="stylesheet" href="blog-v3.css">\n<script src="blog-v3.js" defer></script>\n</head>', 1)
    s = s.replace('<body>', '<body>\n' + SPRITE + ('<div id="v3-progress"></div>\n' if article else ''), 1)
    s = re.sub(r'<div class="nav-links">.*?</div>', NAV_LINKS, s, count=1, flags=re.S)
    s = re.sub(r'<footer>.*?</footer>', FOOTER, s, count=1, flags=re.S)
    return no_emoji(s)

# ---- index ----
s = idx
s = s.replace('<div style="text-align:center;margin-bottom:48px">', '<div class="v3-hero" style="text-align:center;margin-bottom:48px;padding-top:12px">', 1)
s = re.sub(r'(<!-- ARTICLE 5.*?-->\s*)(<a href=.*?</a>)', lambda m: m.group(1) + card_html(cards[0], featured=True), s, count=1, flags=re.S)
for i, c in enumerate(cards[1:], 2):
    s = re.sub(r'(<!-- ARTICLE %d\s*-->\s*)(<a href=.*?</a>)' % (6 - i), lambda m: m.group(1) + card_html(c), s, count=1, flags=re.S)
W(OUT + 'blog/index.html', common(s, False))

# ---- articles ----
for f in sorted(glob.glob(SRC + '*.html')):
    name = os.path.basename(f)
    if name == 'index.html':
        continue
    s = R(f)
    s = s.replace('<header class="article-header">', '<header class="article-header v3-hero">', 1)
    s = s.replace('<a href="index.html" class="back-link">← Retour au blog</a>', '<a href="index.html" class="back-link">' + ico('back', 'ico') + 'Retour au blog</a>', 1)
    s = s.replace("20+ modules d'entraînement gamifiés, 4 000+ questions", "25+ modules d'entraînement gamifiés, 2 500+ questions")
    k = [c['href'] for c in cards].index(name)
    rel = [cards[(k + 1) % 5], cards[(k + 2) % 5]]
    related = ('<section class="related">\n  <h2>À lire ensuite</h2>\n  <div class="related-grid">\n' +
               '\n'.join(card_html(c, with_desc=False) for c in rel) + '\n  </div>\n</section>\n\n')
    s = s.replace('<footer>', related + '<footer>', 1)
    W(OUT + 'blog/' + name, common(s, True))

# ---- assets ----
shutil.copy(P + 'blog-v3.css', OUT + 'blog/blog-v3.css')
shutil.copy(P + 'blog-v3.js', OUT + 'blog/blog-v3.js')
for a in ('logo-mark.svg', 'favicon.svg', 'favicon.ico', 'apple-touch-icon.png'):
    shutil.copy('DOCU/HOSTINGER/' + a, OUT + a)
shutil.copy('prototypes/landing-v3/assets/dragon.jpg', OUT + 'blog/dragon.jpg')
print('ok', len(os.listdir(OUT + 'blog')), 'fichiers dans blog/')
