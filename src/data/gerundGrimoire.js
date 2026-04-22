// ═══════════════════════════════════════════════════════════
// GERUND vs INFINITIVE — GRIMOIRE
// Replaces the legacy Study Mode of the GerInf module.
// Same format as Gauntlet grimoires — consumed by <GrimoireReader/>.
//
// Block types: paragraph, heading, rule, example, trap, table, list
// ═══════════════════════════════════════════════════════════

export var GRIMOIRE_GERUND = {
  id: "gerund_infinitive",
  title: "Gerund vs Infinitive — Manuscrit des Verbes",
  subtitle: "Quand choisir -ING, quand choisir TO",
  readingTime: "7 min",
  icon: "⚖️",
  chapters: [
    {
      id: "ch1_concept",
      title: "I. Pourquoi certains verbes sont difficiles",
      intro: "Chaque verbe anglais a sa préférence. Certains acceptent uniquement le gérondif (-ING), d'autres uniquement l'infinitif (TO + base), et quelques uns changent de SENS selon la forme choisie.",
      blocks: [
        {type:"rule",label:"La question à se poser",formula:"Quel VERBE vient AVANT le trou ? C'est lui qui décide."},
        {type:"paragraph",text:"Il n'y a pas de logique universelle. C'est surtout de la mémorisation par famille. Mais une fois les 4 patterns identifiés, 90% des questions TOEIC Part 5 deviennent automatiques."},
        {type:"heading",text:"Les 4 patterns à connaître"},
        {type:"list",items:[
          "Pattern 1 : verbes TOUJOURS suivis de -ING (enjoy, avoid, finish, suggest...)",
          "Pattern 2 : verbes TOUJOURS suivis de TO + base (want, decide, plan, hope...)",
          "Pattern 3 : verbes qui acceptent LES DEUX, avec un sens différent (remember, forget, stop, try...)",
          "Pattern 4 : après une PRÉPOSITION, toujours -ING (piège TOEIC n°1)"
        ]}
      ]
    },
    {
      id: "ch2_always_ing",
      title: "II. Pattern 1 — Toujours -ING",
      intro: "Une vingtaine de verbes exigent le gérondif. La plupart expriment une idée de progression, d'évitement, ou de pensée.",
      blocks: [
        {type:"rule",label:"Structure",formula:"[Verbe] + [V-ING]"},
        {type:"heading",text:"Les verbes les plus fréquents"},
        {type:"table",headers:["Verbe","Sens","Exemple"],rows:[
          ["enjoy","aimer faire","I enjoy working with clients."],
          ["avoid","éviter","Avoid making assumptions."],
          ["finish","finir","Have you finished writing the report?"],
          ["suggest","suggérer","She suggested postponing the meeting."],
          ["recommend","recommander","I recommend checking the terms first."],
          ["consider","envisager","We are considering hiring a consultant."],
          ["mind","se soucier de","Do you mind closing the door?"],
          ["postpone","reporter","They postponed launching the product."],
          ["risk","risquer","We risk losing the client."],
          ["practice","s'entraîner à","She practices speaking English daily."]
        ]},
        {type:"trap",text:"JAMAIS 'I enjoy to work' ni 'avoid to make'. Le réflexe français 'verbe + to + base' est ici une faute systématique."},
        {type:"example",en:"The company wants to avoid losing more staff.",fr:"L'entreprise veut éviter de perdre plus de personnel.",note:"avoid + -ING obligatoire."}
      ]
    },
    {
      id: "ch3_always_to",
      title: "III. Pattern 2 — Toujours TO + base",
      intro: "Une trentaine de verbes exigent l'infinitif. Beaucoup expriment une intention, une décision, une volonté tournée vers le futur.",
      blocks: [
        {type:"rule",label:"Structure",formula:"[Verbe] + [TO + base verbale]"},
        {type:"heading",text:"Les verbes les plus fréquents"},
        {type:"table",headers:["Verbe","Sens","Exemple"],rows:[
          ["want","vouloir","I want to improve my score."],
          ["decide","décider","They decided to hire her."],
          ["plan","prévoir","We plan to launch in June."],
          ["hope","espérer","She hopes to get the promotion."],
          ["agree","accepter de","He agreed to sign the contract."],
          ["offer","proposer de","They offered to help us."],
          ["promise","promettre","I promise to finish by Friday."],
          ["refuse","refuser de","She refused to comment."],
          ["manage","parvenir à","He managed to close the deal."],
          ["afford","avoir les moyens de","We can't afford to lose this client."]
        ]},
        {type:"trap",text:"JAMAIS 'I want working' ni 'decide hiring'. Le verbe complété doit être à l'infinitif complet avec TO."},
        {type:"example",en:"Management decided to postpone the launch.",fr:"La direction a décidé de reporter le lancement.",note:"decide + to + base. Ne pas confondre avec 'postpone' qui prend -ING dans la phrase suivante."}
      ]
    },
    {
      id: "ch4_both_concept",
      title: "IV. Pattern 3 — Les deux formes, sens différent",
      intro: "Six verbes classiques piègent les francophones : ils acceptent -ING et TO, mais CHANGENT DE SENS selon la forme. C'est la nuance haut niveau du TOEIC.",
      blocks: [
        {type:"rule",label:"La règle mnémonique",formula:"-ING = action accomplie ou en cours   |   TO = action future ou intention"},
        {type:"paragraph",text:"Le gérondif regarde vers le PASSÉ ou décrit un processus déjà entamé. L'infinitif regarde vers le FUTUR ou l'intention."},
        {type:"heading",text:"Les 6 verbes classiques"},
        {type:"list",items:[
          "remember / forget",
          "stop",
          "try",
          "regret",
          "mean",
          "go on"
        ]}
      ]
    },
    {
      id: "ch5_both_examples",
      title: "V. Les 6 verbes en détail",
      intro: "La différence de sens illustrée par des exemples. Mémorise les couples — le TOEIC adore les tester.",
      blocks: [
        {type:"heading",text:"remember / forget"},
        {type:"example",en:"I remembered to send the email.",fr:"Je me suis souvenu d'envoyer l'email (et je l'ai fait).",note:"TO = tâche future que je n'ai pas oubliée."},
        {type:"example",en:"I remember sending the email.",fr:"Je me souviens d'avoir envoyé l'email (souvenir passé).",note:"-ING = mémoire d'une action accomplie."},

        {type:"heading",text:"stop"},
        {type:"example",en:"He stopped smoking.",fr:"Il a arrêté de fumer (définitivement).",note:"-ING = arrêter l'activité."},
        {type:"example",en:"He stopped to smoke.",fr:"Il s'est arrêté POUR fumer.",note:"TO = interrompre autre chose DANS LE BUT DE fumer."},

        {type:"heading",text:"try"},
        {type:"example",en:"Try adding more salt.",fr:"Essaie d'ajouter du sel (expérimenter).",note:"-ING = tenter une solution."},
        {type:"example",en:"Try to lift this box.",fr:"Essaie de soulever ce carton (effort).",note:"TO = faire un effort."},

        {type:"heading",text:"regret"},
        {type:"example",en:"I regret telling him.",fr:"Je regrette de lui avoir dit.",note:"-ING = regretter une action passée."},
        {type:"example",en:"I regret to inform you...",fr:"J'ai le regret de vous informer... (formel).",note:"TO = annonce future désagréable (registre formel)."},

        {type:"heading",text:"mean"},
        {type:"example",en:"This means working late.",fr:"Cela implique de travailler tard.",note:"-ING = conséquence, implication."},
        {type:"example",en:"I didn't mean to offend you.",fr:"Je n'avais pas l'intention de vous offenser.",note:"TO = intention."}
      ]
    },
    {
      id: "ch6_prepositions",
      title: "VI. Pattern 4 — Après préposition",
      intro: "LA règle d'or du TOEIC. Après N'IMPORTE QUELLE préposition, le verbe est au gérondif. Sans exception.",
      blocks: [
        {type:"rule",label:"Règle absolue",formula:"[Préposition] + [V-ING]"},
        {type:"paragraph",text:"Prépositions concernées : in, on, at, of, for, with, by, about, after, before, without, instead of..."},
        {type:"heading",text:"Exemples TOEIC"},
        {type:"example",en:"She is interested in working abroad.",fr:"Elle est intéressée par travailler à l'étranger.",note:"interested IN + V-ing."},
        {type:"example",en:"Thank you for coming.",fr:"Merci de venir.",note:"for + V-ing."},
        {type:"example",en:"We succeeded in closing the deal.",fr:"On a réussi à conclure l'accord.",note:"succeed IN + V-ing."},
        {type:"example",en:"Before signing, read carefully.",fr:"Avant de signer, lis attentivement.",note:"before + V-ing."},
        {type:"trap",text:"ATTENTION au 'TO' piège : dans 'look forward to', 'be used to', 'object to', le TO est une PRÉPOSITION, pas un infinitif. Donc -ING obligatoire. 'I look forward to HEARING from you' (jamais 'to hear')."}
      ]
    },
    {
      id: "ch7_decision_tree",
      title: "VII. Arbre de décision rapide",
      intro: "En condition TOEIC, tu as 15-20 secondes par question. Applique cet arbre mental.",
      blocks: [
        {type:"heading",text:"Étape 1 : Y a-t-il une préposition juste avant le trou ?"},
        {type:"list",items:[
          "OUI → V-ING obligatoire. Pas besoin de lire la suite.",
          "NON → passer à l'étape 2."
        ]},
        {type:"heading",text:"Étape 2 : Quel est le verbe principal juste avant ?"},
        {type:"list",items:[
          "enjoy, avoid, finish, suggest, recommend, consider, mind, postpone, risk → V-ING",
          "want, decide, plan, hope, agree, offer, promise, refuse, manage, afford → TO + base",
          "remember, forget, stop, try, regret, mean, go on → réfléchir au SENS (chapitre V)"
        ]},
        {type:"heading",text:"Étape 3 : Doute ?"},
        {type:"paragraph",text:"Si le verbe exprime une INTENTION, un PROJET, un FUTUR : pencher vers TO. Si le verbe décrit un PROCESSUS, une ACTION EN COURS, ou un ÉVÉNEMENT PASSÉ : pencher vers -ING."},
        {type:"trap",text:"Le réflexe francophone est de traduire 'de + infinitif' par 'to + base'. C'est une erreur dans 40% des cas. Apprends les patterns, ne traduis pas mot à mot."}
      ]
    }
  ]
};
