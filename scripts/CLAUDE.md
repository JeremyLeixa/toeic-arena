# Audio : nommage des fichiers, ElevenLabs, scripts de génération

> Chargé quand on travaille dans `scripts/`. Un MP3 manquant est muet à l'exécution : `npm run check:assets` après tout ajout.

### File naming
- **P1 training:** `public/audio/p1/{id}_{0-3}.mp3`
- **P2 training:** `public/audio/p2/{id}_q.mp3` + `{id}_{0-2}.mp3`
- **Lettres (depuis le 2026-09-16) :** `public/audio/letters/{voix}_{A|B|C|D}.mp3`, 6 voix × 4 lettres. **Les clips d'options P1/P2 ne contiennent plus la lettre** : `playLetteredOption(part,id,pos,url)` (`lib/audio.js`) joue « B. » dans la voix de l'item puis l'option **affichée** en position `pos`. C'est ce qui rend la permutation des options (`aud`, `lib/listeningShuffle.js`) libre : l'élève entend toujours A, B, C(, D) dans l'ordre. La voix d'un item se déduit de son numéro (`lib/listeningVoices.js`, règle partagée avec le script) ; **ne jamais regénérer un clip d'option avec sa lettre dedans**, et ne pas changer la règle de voix sans regénérer les clips concernés.
- **Explications P1/P2 et leurs lettres** : l'exercice affiche `x` remappé aux lettres affichées (`remapOptLetters`) ; les leçons de l'écran de fin, qui ne montrent pas les lettres, affichent `xq` (`quoteOptLetters` : chaque lettre devient le texte de l'option cité), calculé sur l'item **d'origine** au moment de la permutation. Un `x` déjà remappé ne se relit pas (« and A trap » passe pour un article). Test `validate_listening_shuffle` (I2, I3).
- **P3 training:** `public/audio/p3/{id}_line{0-3}.mp3` + `{id}.mp3` (stitched)
- **P4 training:** `public/audio/p4/{id}.mp3`
- **Boss test:** `public/audio/boss/p1_XX_Y.mp3`, etc.
- **Audio Blitz:** `public/audio/blitz/{id}.mp3`
- **Mimic Hunt (mode écoute):** `public/audio/mimic/{id}.mp3` — items `spoken`, une voix par item (`mimicVoice`)
- **BGM:** `public/audio/bgm/bgm_{name}.mp3`

### ElevenLabs
- Voices: Sarah (W) = `EXAVITQu4vr4xnSDxMaL`, Adam (M) = `pNInz6obpgDQGcFmaJgB`
- Model: `eleven_multilingual_v2` pour les phrases. **Pour un clip d'une syllabe (les lettres), `eleven_turbo_v2` (anglais seul, `stability: 0.75`)** : le multilingue devine la langue sur un caractère isolé et lit « A » à la française (/a/), constaté le 2026-09-16.
- Settings: `stability: 0.5, similarity_boost: 0.75, speed: 0.92` (lots P1/P2 2026-09-16 et précédents ; `0.55 / 0.85` sur les tout premiers lots).
- 6 voix en rotation pour P1/P2 (`lib/listeningVoices.js`) : Sarah US-F, Adam US-M, Canadienne F, Britannique M, Voice A (non-US, M), Voice B (non-US, F). P2 : question et réponses par **deux locuteurs différents** (TOEIC), à trois pas d'écart dans le cycle.
- Script de (re)génération P1/P2 : `scripts/regen-listening-letterless.mjs` (`--letters | --p1 | --p2 | --sample | --all`, reprenable : saute les fichiers existants ; **déplacer les anciens clips hors de `public/` avant un lot complet**, sinon tout est sauté).
- Audio files are pre-generated. ElevenLabs credits for generating new content only, never runtime.
