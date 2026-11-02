# Genere prototypes/legal-v3/ a partir des pages legales en production (DOCU/HOSTINGER/legal/*.html).
# Le texte juridique est conserve tel quel : seuls le <head> (feuille + script), la navigation, le pied de page et le CSS changent.
# Usage (depuis la racine du repo) : py prototypes/legal-v3/build.py
import io, re, glob, os, shutil

SRC = 'DOCU/HOSTINGER/legal/'
OUT = 'prototypes/legal-v3/'
P = OUT + '_parts/'
R = lambda p: io.open(p, encoding='utf-8').read()

def W(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s)

NAV = ('<nav class="legal-nav">\n  <a href="/" class="legal-nav-brand">\n    <img src="/logo-mark.svg" alt="" width="32" height="32" style="display:block">\n    <span>VERSE ARENA</span>\n  </a>\n'
       '  <div class="legal-links">\n    <a href="/" class="legal-text">Accueil</a>\n    <a href="/#features" class="legal-text">Fonctionnalités</a>\n'
       '    <a href="/#pricing" class="legal-text">Tarifs</a>\n    <a href="/blog/" class="legal-text">Blog</a>\n'
       '    <a href="https://app.verse-arena.fr" target="_blank" class="cta-sm">Commencer</a>\n  </div>\n</nav>')

def foot(name):
    def a(href, label):
        return '<a href="/legal/%s"%s>%s</a>' % (href, ' class="on"' if href == name else '', label)
    return ('<footer class="v3-foot">\n  <div class="brand"><img src="/logo-mark.svg" alt="" width="34" height="34"><span>VERSE ARENA</span></div>\n'
            '  <nav aria-label="Pied de page">\n    <a href="/">Accueil</a><a href="/#features">Fonctionnalités</a><a href="/#pricing">Tarifs</a><a href="/blog/">Blog</a>\n    '
            + a('cgv.html', 'CGV') + a('confidentialite.html', 'Confidentialité') + a('mediation.html', 'Médiation') + a('mentions.html', 'Mentions légales') +
            '\n  </nav>\n  <p>© 2026 Verse Arena · Jérémy LEIXA · SIRET 830 200 556 00025</p>\n</footer>')

TOP = ('<button type="button" id="v3-top" aria-label="Retour en haut"><svg class="ico" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg></button>')

for f in sorted(glob.glob(SRC + '*.html')):
    name = os.path.basename(f)
    s = R(f)
    s = s.replace('</head>', '<link rel="stylesheet" href="legal-v3.css">\n<script src="legal-v3.js" defer></script>\n</head>', 1)
    s = s.replace('<body>', '<body>\n<div id="v3-progress"></div>', 1)
    s, n1 = re.subn(r'<nav class="legal-nav">.*?</nav>', NAV, s, count=1, flags=re.S)
    s, n2 = re.subn(r'<footer class="legal-footer">.*?</footer>', foot(name) + '\n' + TOP, s, count=1, flags=re.S)
    assert n1 == 1 and n2 == 1, (name, n1, n2)
    W(OUT + 'legal/' + name, s)

shutil.copy(P + 'legal-v3.css', OUT + 'legal/legal-v3.css')
shutil.copy(P + 'legal-v3.js', OUT + 'legal/legal-v3.js')
for a in ('logo-mark.svg', 'favicon.svg', 'favicon.ico', 'apple-touch-icon.png'):
    shutil.copy('DOCU/HOSTINGER/' + a, OUT + a)
print('ok', len(os.listdir(OUT + 'legal')), 'fichiers dans legal/')
