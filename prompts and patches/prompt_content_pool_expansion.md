# Prompt — Enrichissement du pool de contenu TOEIC Arena

## Contexte

TOEIC Arena est une app gamifiée de préparation au TOEIC. On prépare l'implémentation de **Random Practice Tests** : des tests TOEIC complets de 2 heures (200 questions, 7 parts), générés aléatoirement à partir du pool de contenu existant, débloqués après avoir battu le Boss Test (The Final Arena).

**Problème** : le pool actuel est insuffisant pour générer des tests variés. Voici l'état des lieux :

| Part | Items actuels | Besoin par test | Tests uniques possibles | Objectif ajout |
|------|--------------|-----------------|------------------------|----------------|
| P3 — Conversations | 30 convos (90 Qs) | 13 convos (39 Qs) | ~2 | **+20 conversations** |
| P4 — Talks | 30 talks (90 Qs) | 10 talks (30 Qs) | ~3 | **+15 talks** |
| P7 — Reading passages | 24 passages (87 Qs) | ~8 passages (~54 Qs) | ~3 | **+15 passages** |
| P6 — Incomplete texts | 20 textes (80 blanks) | 4 textes (16 blanks) | ~5 | **+10 textes** |

Avec ces ajouts, on aura ~5-6 tests uniques générables avant recyclage.

---

## Travail demandé

### Phase 1 — Génération de contenu textuel (JS)

Génère le contenu en respectant **exactement** les formats ci-dessous. Chaque batch doit être un bloc JS copier-collable dans le fichier correspondant.

#### P3 — Conversations (20 nouvelles, IDs p3_31 à p3_50)

Format exact :
```js
{id:"p3_31",lines:[
    {s:"W",t:"First speaker line."},
    {s:"M",t:"Second speaker line."},
    {s:"W",t:"Third speaker line."},
    {s:"M",t:"Fourth speaker line."}],
  qs:[
    {q:"Question 1?",opts:["A","B","C","D"],c:0},
    {q:"Question 2?",opts:["A","B","C","D"],c:1},
    {q:"Question 3?",opts:["A","B","C","D"],c:2}]},
```

Règles P3 :
- 4 lignes de dialogue entre M (man) et W (woman), alternance M/W ou W/M
- 3 questions par conversation, toujours 4 options
- Contextes TOEIC variés : bureau, restaurant, hôtel, aéroport, magasin, hôpital, banque, usine, événement, transport
- Difficulté B1-B2, vocabulaire business/professional
- `c` = index 0-based de la bonne réponse, varier la position (pas toujours 0)
- Pas de trailing comma après le dernier item

#### P4 — Talks (15 nouveaux, IDs p4_31 à p4_45)

Format exact :
```js
{id:"p4_31",type:"Voicemail",voice:"W",
  text:"Full monologue text here. Multiple sentences. Natural speech patterns.",
  qs:[
    {q:"Question 1?",opts:["A","B","C","D"],c:0},
    {q:"Question 2?",opts:["A","B","C","D"],c:1},
    {q:"Question 3?",opts:["A","B","C","D"],c:2}]},
```

Règles P4 :
- Types variés : Voicemail, Announcement, Meeting introduction, Tour guide, Training session, News report, Advertisement, Instructions, Recorded message
- `voice` : "W" ou "M" (alterner)
- Monologue de 4-6 phrases, naturel et fluide
- 3 questions par talk, 4 options chacune
- Varier la position de `c`

#### P7 — Passages (15 nouveaux, IDs p7p25 à p7p39)

Format exact :
```js
{id:"p7p25", type:"Email",
  text:"Full passage text here...",
  questions:[
    {q:"Question?",options:["A","B","C","D"],correct:0,x:"Explanation."},
    {q:"Question?",options:["A","B","C","D"],correct:1,x:"Explanation."},
    {q:"Question?",options:["A","B","C","D"],correct:2,x:"Explanation."}]},
```

Règles P7 :
- Types variés : Email, Advertisement, Article, Notice, Letter, Memo, Instructions, Report, Review
- 3-4 questions par passage (varier)
- Inclure des `x` (explications) pour chaque question
- Champ `correct` (pas `c`) et `options` (pas `opts`) — format P7 spécifique
- Textes de 100-200 mots, réalistes, contexte professionnel
- Inclure 2-3 double passages (utiliser `--- DOCUMENT 2 ---` comme séparateur dans `text`)

#### P6 — Textes incomplets (10 nouveaux, IDs p6t21 à p6t30)

Format exact :
```js
{id:"p6t21", type:"Email", from:"Sender Name", to:"Recipient", subject:"Subject Line",
  parts:[
    {text:"Opening paragraph text "},
    {blank:true,options:["correct","wrong1","wrong2","wrong3"],correct:0,x:"Explanation."},
    {text:" continuation of text. More content "},
    {blank:true,options:["correct","wrong1","wrong2","wrong3"],correct:0,x:"Explanation."},
    {text:" more text "},
    {blank:true,options:["correct","wrong1","wrong2","wrong3"],correct:0,x:"Explanation."},
    {text:" final part.\n\n"},
    {blank:true,options:[
      "Correct closing sentence.",
      "Irrelevant sentence A.",
      "Irrelevant sentence B.",
      "Irrelevant sentence C."
    ],correct:0,x:"Sentence insertion: explanation."},
  ]},
```

Règles P6 :
- Types variés : Email, Memo, Notice, Letter, Instructions
- 4 blanks par texte (3 grammar/vocab + 1 sentence insertion)
- Categories testées : relative pronouns, verb forms, connectors, prepositions, adverb/adjective, collocations
- Varier la position de `correct` (pas toujours 0)
- La dernière question est toujours un "sentence insertion" (quelle phrase complète le texte)

---

### Phase 2 — Scripts de génération audio (ElevenLabs)

Après validation du contenu textuel, il faudra générer les fichiers audio pour P3 et P4 (P6 et P7 n'ont pas d'audio).

#### Audio P3 — Conversations

Chaque conversation P3 nécessite :
- **4 fichiers individuels** : `public/audio/p3/{id}_line{0-3}.mp3` (une ligne par fichier)
- **1 fichier stitché** : `public/audio/p3/{id}.mp3` (toutes les lignes concaténées)

Voix ElevenLabs :
- W (woman) = Sarah : voice_id `EXAVITQu4vr4xnSDxMaL`
- M (man) = Adam : voice_id `pNInz6obpgDQGcFmaJgB`

Settings : `stability: 0.55, similarity_boost: 0.75, speed: 0.85`
Model : `eleven_multilingual_v2`

Génère un script Python qui :
1. Lit les conversations P3 depuis un fichier JSON (ou directement en dict Python)
2. Pour chaque conversation, génère les 4 lignes individuelles via l'API ElevenLabs
3. Concatène les 4 fichiers en un seul `{id}.mp3` (avec pydub ou ffmpeg)
4. Sauvegarde dans `public/audio/p3/`
5. Gère les erreurs et le rate limiting (pause entre chaque appel)
6. Affiche la progression

#### Audio P4 — Talks

Chaque talk P4 nécessite **1 seul fichier** : `public/audio/p4/{id}.mp3`

Le script doit :
1. Lire le champ `text` de chaque talk
2. Utiliser la voix correspondant au champ `voice` (W=Sarah, M=Adam)
3. Générer l'audio via ElevenLabs
4. Sauvegarder dans `public/audio/p4/`

---

## Consignes générales

- **Qualité TOEIC** : le contenu doit être au niveau du vrai test (B1-B2, business English)
- **Pas de contenu offensant** ni culturellement sensible
- **Varier les contextes** : ne pas répéter les mêmes scénarios (bureau, transport, commerce, santé, éducation, industrie, événementiel, immobilier, finance, technologie)
- **Varier les types de questions** : main idea, detail, inference, vocabulary in context, purpose
- **Distracteurs crédibles** : les mauvaises réponses doivent être plausibles mais clairement fausses
- **Utiliser des caractères réels** pour les emoji, jamais `\uXXXX`
- **Pas de trailing comma** après le dernier élément d'un array
- **Générer par batches** : P3 d'abord (20 items), puis P4 (15), puis P7 (15), puis P6 (10)
