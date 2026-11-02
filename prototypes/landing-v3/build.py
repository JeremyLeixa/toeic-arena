# Assemble prototypes/landing-v3/index.html a partir de la landing en production + les blocs de _parts/
# Usage (depuis la racine du repo) : py prototypes/landing-v3/build.py
import io
R = lambda p: io.open(p, encoding='utf-8').read()
s = R('DOCU/HOSTINGER/index.html'); P = 'prototypes/landing-v3/_parts/'

def between(s, a, b, new):
    i, j = s.index(a), s.index(b)
    return s[:i] + new + s[j:]

# sections remplacees
s = between(s, '<!-- Hero -->', '<!-- Stats -->', R(P + 'hero.html'))
s = between(s, '<!-- Stats -->', '<!-- Features -->', R(P + 'stats.html'))
s = between(s, '<!-- Features -->', '<!-- Comparatif -->', R(P + 'features.html'))
s = between(s, '<!-- Boss Test -->', '<!-- Pricing -->', R(P + 'boss.html'))
s = between(s, '<!-- Pricing -->', '<!-- FAQ -->', R(P + 'pricing.html'))
s = between(s, '<!-- Final CTA -->', '<!-- Footer -->', R(P + 'final.html'))
# sections ajoutees
s = s.replace('<!-- Features -->', R(P + 'how.html') + '<!-- Features -->', 1)
s = s.replace('<!-- Scripts -->', R(P + 'extras.html') + '<!-- Scripts -->', 1)
# CSS + JS
s = s.replace('</style>', R(P + 'v3.css') + R(P + 'v3b.css') + '</style>', 1)
s = s.replace('</body>', '<script>' + R(P + 'v3.js') + '</script>\n</body>', 1)
# logo : plus present dans la nav, le comparatif (desktop + mobile)
s = s.replace('<img src="/logo-mark.svg" alt="" width="26" height="26" style="display:block">',
              '<img src="/logo-mark.svg" alt="" width="32" height="32" style="display:block;filter:drop-shadow(0 0 10px rgba(212,148,58,.5))">', 1)
s = s.replace('<h4>⚔️ Verse Arena</h4>', '<h4><img src="/logo-mark.svg" alt="" width="20" height="20">Verse Arena</h4>')
s = s.replace('<div>Verse Arena</div>\n      </div>', '<div><img src="/logo-mark.svg" alt="" width="18" height="18">Verse Arena</div>\n      </div>')
# emojis -> icones SVG (epees croisees dans les boutons)
SWORD = '<svg class="ico ico-btn" aria-hidden="true"><use href="#i-swords"/></svg>'
s = s.replace('⚔️ ', SWORD).replace('⚔️', SWORD)
s = s.replace('<body>', '<body>\n' + R(P + 'sprite.html'), 1)
io.open('prototypes/landing-v3/index.html', 'w', encoding='utf-8', newline='\n').write(s)
print('ok', len(s))
