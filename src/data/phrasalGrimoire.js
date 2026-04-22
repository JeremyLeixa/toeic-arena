// ═══════════════════════════════════════════════════════════
// PHRASAL VERB DOJO — GRIMOIRE
// Replaces the legacy Study Mode of the PhrasalDojo module.
// Same format as Gauntlet / Gerund grimoires — consumed by <GrimoireReader/>.
// ═══════════════════════════════════════════════════════════

export var GRIMOIRE_PHRASAL = {
  id: "phrasal_verbs",
  title: "Phrasal Verb Dojo — Manuscrit des Particules",
  subtitle: "Décoder les verbes à particule en contexte business",
  readingTime: "10 min",
  icon: "⚔️",
  chapters: [
    {
      id: "ch1_what",
      title: "I. Qu'est-ce qu'un phrasal verb ?",
      intro: "Un verbe + une particule (ou deux) qui change le SENS du verbe de base. Le TOEIC adore : ils couvrent Parts 2, 3, 4, 6, 7.",
      blocks: [
        {type:"rule",label:"Formule",formula:"[Verbe] + [Particule(s)] = nouveau sens, souvent non-littéral"},
        {type:"example",en:"The plane takes off at 6 p.m.",fr:"L'avion décolle à 18h.",note:"'take off' ≠ prendre + loin. Sens idiomatique : décoller."},
        {type:"example",en:"They laid off 200 employees.",fr:"Ils ont licencié 200 employés.",note:"'lay off' ≠ poser + loin. Sens idiomatique : licencier."},

        {type:"heading",text:"Pourquoi c'est crucial TOEIC"},
        {type:"list",items:[
          "Fréquence massive en Part 2 (conversations bureau)",
          "Part 3 / 4 (meetings, annonces) — vocabulaire idiomatique",
          "Part 5 — choix de la bonne particule en QCM",
          "Part 6 / 7 — compréhension écrite d'emails business"
        ]},
        {type:"paragraph",text:"Apprendre isolément les 100 phrasal verbs les plus fréquents améliore directement ton score de 30-50 points."}
      ]
    },
    {
      id: "ch2_particles",
      title: "II. Le décodeur des particules",
      intro: "Chaque particule a un sens directionnel ou aspectuel dominant. Comprendre ces patterns aide à DEVINER un phrasal verb inconnu en contexte.",
      blocks: [
        {type:"table",headers:["Particule","Sens dominant","Exemples"],rows:[
          ["up","complétion, augmentation","finish up, speed up, back up, set up"],
          ["down","diminution, échec","slow down, break down, turn down, cut down"],
          ["off","retrait, départ","take off, lay off, write off, call off"],
          ["out","émergence, distribution","carry out, hand out, figure out, find out"],
          ["in","entrée, participation","hand in, fill in, check in, take in"],
          ["on","continuation, activation","carry on, hang on, put on, log on"],
          ["over","revue, transfert","go over, look over, take over, hand over"],
          ["away","éloignement, élimination","throw away, give away, put away"],
          ["back","retour, remboursement","pay back, call back, get back, step back"]
        ]},
        {type:"heading",text:"Application pratique"},
        {type:"example",en:"The company wrote off the debt.",fr:"L'entreprise a passé la dette aux pertes.",note:"'off' = retrait, élimination → 'write off' = radier."},
        {type:"example",en:"Please fill in this form.",fr:"Veuillez remplir ce formulaire.",note:"'in' = entrée de données → 'fill in' = compléter."},
        {type:"trap",text:"Le sens n'est pas toujours littéral, mais la direction donne une piste. En contexte, tu peux deviner 70% des phrasal verbs inconnus en te basant sur la particule."}
      ]
    },
    {
      id: "ch3_separable",
      title: "III. Séparables vs Inséparables",
      intro: "Distinction grammaticale critique. Elle détermine où tu peux placer l'objet (surtout un pronom).",
      blocks: [
        {type:"rule",label:"Séparable",formula:"[Verbe] [OBJET] [Particule]  ou  [Verbe] [Particule] [OBJET]"},
        {type:"rule",label:"Inséparable",formula:"[Verbe] [Particule] [OBJET]  — toujours ensemble"},
        {type:"heading",text:"Exemples séparables (les deux positions OK)"},
        {type:"example",en:"Pick up the phone.  /  Pick the phone up.",fr:"Décroche le téléphone.",note:"Les deux sont corrects avec un nom."},
        {type:"example",en:"Turn down the offer.  /  Turn the offer down.",fr:"Refuse l'offre."},

        {type:"trap",text:"Avec un PRONOM (it, them, him...), le séparable DOIT être séparé : 'Pick it up' ✓  /  'Pick up it' ✗. Cette règle tombe souvent en Part 5."},

        {type:"heading",text:"Exemples inséparables (jamais séparés)"},
        {type:"example",en:"Look into the matter.",fr:"Examiner l'affaire.",note:"'Look the matter into' ✗ impossible."},
        {type:"example",en:"Run into an old colleague.",fr:"Croiser un ancien collègue.",note:"'Run an old colleague into' ✗."},

        {type:"heading",text:"Séparables courants TOEIC"},
        {type:"list",items:["pick up","turn down","hand in","fill out","set up","bring up","call off","take on","put off","carry out"]},

        {type:"heading",text:"Inséparables courants TOEIC"},
        {type:"list",items:["look into","look after","come across","run into","get over","stand for","deal with","go through","count on","rely on"]}
      ]
    },
    {
      id: "ch4_three_part",
      title: "IV. Les phrasal verbs à 3 mots",
      intro: "Certains phrasal verbs ont DEUX particules. Ils sont presque toujours inséparables et finissent par une préposition.",
      blocks: [
        {type:"rule",label:"Structure",formula:"[Verbe] [Particule] [Préposition]  →  inséparable"},
        {type:"table",headers:["Phrasal verb","Sens","Exemple"],rows:[
          ["look forward to","attendre avec impatience","I look forward to hearing from you."],
          ["put up with","supporter","I can't put up with this noise."],
          ["come up with","trouver, proposer","She came up with a great idea."],
          ["run out of","tomber à court de","We ran out of paper."],
          ["keep up with","suivre le rythme de","It's hard to keep up with the changes."],
          ["get along with","s'entendre avec","He gets along with everyone."],
          ["catch up on","rattraper (retard)","I need to catch up on emails."],
          ["look down on","mépriser","Don't look down on entry-level staff."]
        ]},
        {type:"trap",text:"Le piège TOEIC n°1 : 'look forward to', 'be used to', 'object to' — le TO final est une PRÉPOSITION, pas un infinitif. Donc V-ING obligatoire derrière. 'I look forward to HEARING' ✓  /  'I look forward to hear' ✗."}
      ]
    },
    {
      id: "ch5_top_business",
      title: "V. Top 20 TOEIC business",
      intro: "Les phrasal verbs les plus fréquents dans le monde business TOEIC. Apprends-les par cœur en priorité.",
      blocks: [
        {type:"table",headers:["Phrasal verb","Meaning","Formal equivalent"],rows:[
          ["carry out","réaliser, effectuer","execute, conduct"],
          ["bring up","aborder (un sujet)","raise, mention"],
          ["look into","enquêter sur","investigate, examine"],
          ["put off","reporter","postpone"],
          ["follow up","donner suite","pursue"],
          ["set up","mettre en place","establish, arrange"],
          ["turn down","refuser","reject, decline"],
          ["hand out","distribuer","distribute"],
          ["hand in","rendre, remettre","submit"],
          ["fill in / out","remplir","complete"],
          ["deal with","gérer, traiter","address, handle"],
          ["work out","résoudre, fonctionner","resolve"],
          ["come up with","proposer, trouver","propose, devise"],
          ["break down","tomber en panne","malfunction"],
          ["take over","reprendre, remplacer","assume control of"],
          ["look forward to","attendre avec impatience","anticipate"],
          ["get in touch","contacter","contact"],
          ["figure out","comprendre","determine"],
          ["cut back","réduire","reduce"],
          ["lay off","licencier","dismiss, terminate"]
        ]}
      ]
    },
    {
      id: "ch6_register",
      title: "VI. Registre formel vs informel",
      intro: "En anglais parlé ou en email informel, les phrasal verbs dominent. En rapport officiel ou communication corporate formelle, privilégier les équivalents single-word.",
      blocks: [
        {type:"heading",text:"Phrasal (oral/email)  →  Single-word (écrit formel)"},
        {type:"example",en:"We'll carry out the audit next week.",fr:"On va réaliser l'audit la semaine prochaine.",note:"Email normal. Formel : 'We will conduct the audit'."},
        {type:"example",en:"Please hand in your report by Friday.",fr:"Rends ton rapport avant vendredi.",note:"Formel : 'Please submit your report by Friday.'"},
        {type:"example",en:"The meeting was put off.",fr:"La réunion a été reportée.",note:"Formel : 'The meeting was postponed.'"},

        {type:"paragraph",text:"Le TOEIC teste les DEUX registres. Comprendre que 'put off' = 'postpone' aide à résoudre les questions de paraphrase en Part 7."}
      ]
    },
    {
      id: "ch7_traps",
      title: "VII. Pièges francophones",
      intro: "Les erreurs systématiques des francophones sur les phrasal verbs — à éviter absolument.",
      blocks: [
        {type:"heading",text:"1. Particule oubliée"},
        {type:"example",en:"I'll call you back tomorrow.",fr:"Je te rappelle demain.",note:"FAUX : 'I'll call you tomorrow' signifie 'je t'appelle', pas 'je te rappelle'."},

        {type:"heading",text:"2. Préposition en trop (calque du français)"},
        {type:"list",items:[
          "discuss ABOUT ✗  →  discuss the project ✓",
          "depend OF ✗  →  depend ON ✓",
          "enter IN ✗  →  enter the room ✓",
          "explain to me ABOUT ✗  →  explain the issue to me ✓"
        ]},

        {type:"heading",text:"3. Particule fausse"},
        {type:"example",en:"I'll make up the report.",fr:"Je vais inventer le rapport (= le fabriquer).",note:"Sens idiomatique négatif. Pour 'rédiger', utiliser 'draft' ou 'write up'."},
        {type:"example",en:"Let's make it up to you.",fr:"On va se racheter (compenser).",note:"'make up' a plusieurs sens — attention au contexte."},

        {type:"heading",text:"4. Phrasal verb inventé"},
        {type:"paragraph",text:"Ne compose PAS tes propres phrasal verbs par analogie au français. 'Discuss about' n'existe pas, 'assist to' n'existe pas (on dit 'attend'). Si tu n'es pas sûr, utilise le verbe simple."},

        {type:"trap",text:"En doute, préfère le verbe simple (discuss, postpone, reject) au phrasal verb. Zéro risque en production écrite. Mais entraîne-toi à les reconnaître en compréhension — le TOEIC les utilise massivement."}
      ]
    }
  ]
};
