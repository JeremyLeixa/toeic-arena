// Pur, sans import, requérable en Node. Couleurs de signal codées en dur dans les données (ligues : data/leagues.js, titres :
// data/chests.js TITLES). Claires, pensées pour le fond sombre : en mode clair elles se délavent
// (Gold #ffd700 à 1,07:1 sur --bg3, Aldric's Chosen #e8d4a8 à 1,11:1).
//
// tone(hex) rend « var(--tone-<hex>,<hex>) ». En sombre la variable n'existe pas : le hex
// d'origine s'applique tel quel, rien ne change. En clair, styles/appCss.js la définit plus foncée
// (règle « .light{--tone-…} »), et les cartes-nuit la remettent à initial (fond sombre → hex vif).
// Un hex sans variante reste inchangé. tests/check_tones.cjs exige une variante pour chaque couleur
// de ligue et de titre.
//
// ⚠️ Pas sur un fond sombre FIXE (carte de récompense des coffres, vignette de titre du Shop,
// fond #1a1208) : en clair, la variante foncée y deviendrait illisible. Garder le hex brut.
export function tone(hex){return /^#[0-9a-fA-F]{6}$/.test(hex||"")?"var(--tone-"+hex.slice(1).toLowerCase()+","+hex+")":hex;}
