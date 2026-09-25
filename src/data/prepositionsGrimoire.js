// ═══════════════════════════════════════════════════════════
// ANCHOR HALL — GRIMOIRE (prépositions qui vont avec le mot, 10 chapitres FR)
//
// Épreuve Anchor Hall du Grammar Gauntlet (module prepdrill, banque PREP_COLLOCATIONS de data/miniGames.js).
// Remplace l'ancien Study Mode de PrepDrill (2026-09-25). Même patron que les autres grimoires
// (data/modalsGrimoire.js, data/CLAUDE.md) : une idée par chapitre, bilingue dans les exemples.
// Chaque chapitre part du calque français qui fait tomber les élèves.
//
// Types de blocs : paragraph | rule | heading | example | trap | table | list
// ═══════════════════════════════════════════════════════════

export var GRIMOIRE_PREPOSITIONS = {
  id: "prepositions",
  title: "Anchor Hall — Manuscrit des Ancres",
  subtitle: "La préposition qui s'accroche à chaque mot",
  readingTime: "10 min",
  icon: "⚓",
  chapters: [
    {
      id: "ch1_bloc",
      title: "I. Une ancre ne se traduit pas",
      intro: "Le réflexe francophone : traduire la préposition. « Intéressé PAR » devient « interested by ». C'est faux, et le TOEIC le sait.",
      blocks: [
        {type:"paragraph",text:"Après beaucoup d'adjectifs, de verbes et d'expressions, la préposition anglaise est FIXE. Elle ne suit pas le sens, elle suit l'usage. On ne la devine pas : on apprend le mot ET son ancre, comme un seul bloc."},
        {type:"rule",label:"La règle d'Anchor Hall",formula:"Mot + préposition = un bloc. On mémorise « interested in », jamais « interested » seul."},
        {type:"example",en:"We are interested in your proposal.",fr:"Nous sommes intéressés PAR votre proposition.",note:"Français « par », anglais « in »."},
        {type:"example",en:"The launch date depends on the budget.",fr:"La date de lancement dépend DU budget.",note:"Français « de », anglais « on »."},
        {type:"example",en:"She is responsible for the Paris office.",fr:"Elle est responsable DU bureau de Paris.",note:"Français « de », anglais « for »."},
        {type:"trap",text:"Au TOEIC (Part 5), la phrase est souvent parfaite… sauf la préposition. Trois options sur quatre « sonnent » bien à l'oreille d'un francophone. Seul le bloc appris te sauve."}
      ]
    },
    {
      id: "ch2_to",
      title: "II. TO — l'ancre la plus fréquente",
      intro: "Près d'un tiers des blocs de la banque s'accrochent à « to ». Son idée : la direction, le rapport à quelque chose.",
      blocks: [
        {type:"table",headers:["Bloc","Sens"],rows:[
          ["respond to","répondre à"],
          ["refer to","se référer à"],
          ["contribute to","contribuer à"],
          ["subscribe to","s'abonner à"],
          ["relevant to","pertinent pour"],
          ["equivalent to","équivalent à"],
          ["subject to","soumis à"],
          ["due to","dû à, à cause de"]
        ]},
        {type:"example",en:"Please respond to the client's inquiry by noon.",fr:"Merci de répondre à la demande du client avant midi."},
        {type:"example",en:"All orders are subject to availability.",fr:"Toutes les commandes sont soumises à disponibilité.",note:"« subject to » : formule typique des conditions générales."},
        {type:"trap",text:"« Relevant to », pas « relevant for » : « pertinent pour » pousse vers « for ». Même piège avec « equivalent to » (« équivalent à » aide, pour une fois)."}
      ]
    },
    {
      id: "ch3_to_ing",
      title: "III. TO + -ING — le piège des pièges",
      intro: "Dans certains blocs, « to » n'est pas le « to » de l'infinitif : c'est une préposition. Et après une préposition, le verbe prend -ING.",
      blocks: [
        {type:"rule",label:"TO préposition",formula:"committed to / accustomed to / opposed to / in addition to / prior to / with regard to + NOM ou VERBE-ING."},
        {type:"example",en:"The company is committed to reducing its carbon footprint.",fr:"L'entreprise s'engage à réduire son empreinte carbone.",note:"committed to REDUCING, jamais « committed to reduce »."},
        {type:"example",en:"He is accustomed to working late.",fr:"Il a l'habitude de travailler tard."},
        {type:"example",en:"Prior to joining the firm, she worked in Tokyo.",fr:"Avant de rejoindre le cabinet, elle travaillait à Tokyo."},
        {type:"paragraph",text:"Le test : remplace le verbe par un nom. Si « committed to the project » marche, alors « to » est une préposition, et le verbe prendra -ING. C'est le même mécanisme que « look forward to hearing from you »."},
        {type:"trap",text:"Le TOEIC propose presque toujours les deux options : « to reduce » et « to reducing ». L'infinitif a l'air naturel. C'est lui, le piège."}
      ]
    },
    {
      id: "ch4_of",
      title: "IV. OF — ce qu'on contient, ce qu'on sait, ce qu'on peut",
      intro: "« Of » dit le contenu, la conscience, la capacité, le sentiment envers quelque chose.",
      blocks: [
        {type:"table",headers:["Bloc","Sens"],rows:[
          ["consist of","se composer de"],
          ["capable of","capable de"],
          ["aware of","conscient de"],
          ["proud of","fier de"],
          ["afraid of","avoir peur de"],
          ["in charge of","responsable de"]
        ]},
        {type:"example",en:"The committee consists of five senior managers.",fr:"Le comité se compose de cinq cadres supérieurs."},
        {type:"example",en:"Mr. Park is in charge of the Tokyo office.",fr:"M. Park est responsable du bureau de Tokyo.",note:"« in charge OF » mais « responsible FOR » : deux traductions de « responsable de », deux ancres différentes."},
        {type:"trap",text:"« Consist of » (se composer de) n'a rien à voir avec « consister à ». Et on n'écrit jamais « is consisted of » : pas de passif."}
      ]
    },
    {
      id: "ch5_of_expressions",
      title: "V. OF — les expressions figées",
      intro: "Cinq expressions reviennent sans cesse dans les e-mails et les annonces. Elles se terminent toutes par « of ».",
      blocks: [
        {type:"list",items:["on behalf of : au nom de","in favor of : en faveur de","in spite of : malgré","by means of : au moyen de","at the expense of : aux dépens de"]},
        {type:"example",en:"I am writing on behalf of the HR department.",fr:"Je vous écris au nom du service RH."},
        {type:"example",en:"The committee voted in favor of the new policy.",fr:"Le comité a voté en faveur de la nouvelle politique."},
        {type:"trap",text:"« In spite of » prend « of », mais son synonyme « despite » n'en prend PAS. « Despite of » est une faute classique, et une option piège classique."}
      ]
    },
    {
      id: "ch6_for",
      title: "VI. FOR — la responsabilité et le but",
      intro: "« For » regarde vers ce qu'on doit, ce à quoi on a droit, ce qu'on vise.",
      blocks: [
        {type:"table",headers:["Bloc","Sens"],rows:[
          ["responsible for","responsable de"],
          ["eligible for","éligible à"],
          ["suitable for","adapté à"],
          ["apply for","postuler à"],
          ["apologize for","s'excuser de"],
          ["arrange for","prendre des dispositions pour"],
          ["account for","représenter, expliquer"]
        ]},
        {type:"example",en:"All full-time employees are eligible for the bonus.",fr:"Tous les salariés à temps plein ont droit à la prime."},
        {type:"example",en:"Online sales account for 40% of total revenue.",fr:"Les ventes en ligne représentent 40 % du chiffre d'affaires.",note:"Très fréquent dans les rapports chiffrés de Part 7."},
        {type:"trap",text:"« Apply FOR a job » (postuler à un poste), mais « apply TO a company » (s'adresser à une entreprise). Et « responsible OF » n'existe pas."}
      ]
    },
    {
      id: "ch7_with",
      title: "VII. WITH — la conformité et l'accord",
      intro: "« With » exprime l'accord, la compatibilité, le fait de faire face à quelque chose.",
      blocks: [
        {type:"table",headers:["Bloc","Sens"],rows:[
          ["comply with","se conformer à"],
          ["in accordance with","conformément à"],
          ["consistent with","cohérent avec"],
          ["compatible with","compatible avec"],
          ["familiar with","familier de"],
          ["satisfied with","satisfait de"],
          ["cope with","faire face à"]
        ]},
        {type:"example",en:"All employees must comply with safety regulations.",fr:"Tous les salariés doivent respecter les règles de sécurité."},
        {type:"example",en:"The IT team is coping with a major server outage.",fr:"L'équipe informatique fait face à une grosse panne de serveur."},
        {type:"trap",text:"« Satisfied WITH », pas « satisfied of » (calque de « satisfait de »). Même famille : « familiar with », pas « familiar of »."}
      ]
    },
    {
      id: "ch8_on",
      title: "VIII. ON — s'appuyer sur quelque chose",
      intro: "« On » garde l'image du support : on repose sur, on insiste sur, on se concentre sur.",
      blocks: [
        {type:"list",items:["depend on / dependent on : dépendre de","rely on : compter sur","insist on : insister sur","concentrate on : se concentrer sur"]},
        {type:"example",en:"The launch date is dependent on regulatory approval.",fr:"La date de lancement dépend de l'accord des autorités."},
        {type:"example",en:"The manager insisted on reviewing every contract.",fr:"Le responsable a tenu à relire chaque contrat.",note:"« on » est une préposition : insist on REVIEWING."},
        {type:"trap",text:"« Depend OF » est LA faute francophone (« dépendre de »). Elle ne passe jamais. En revanche, « independent OF » existe bien : c'est le contraire qui change d'ancre."}
      ]
    },
    {
      id: "ch9_in",
      title: "IX. IN — prendre part, s'investir",
      intro: "« In » dit qu'on est dedans : on participe, on s'intéresse, on se spécialise.",
      blocks: [
        {type:"list",items:["interested in : intéressé par","participate in : participer à","specialize in : se spécialiser dans","invested in : investi dans","succeed in : réussir à","result in : aboutir à, entraîner"]},
        {type:"example",en:"Ten suppliers will participate in the trade fair.",fr:"Dix fournisseurs participeront au salon."},
        {type:"example",en:"She succeeded in closing the deal.",fr:"Elle a réussi à conclure l'affaire.",note:"« succeed in » + -ING, jamais « succeed to »."},
        {type:"trap",text:"« Result IN » = entraîner (la cause d'abord). « Result FROM » = provenir de (la conséquence d'abord). Même verbe, sens inverse : le TOEIC adore."}
      ]
    },
    {
      id: "ch10_from_about",
      title: "X. FROM et ABOUT — l'origine et l'inquiétude",
      intro: "Les deux dernières ancres de la banque, moins fréquentes, mais au cœur de pièges bien connus.",
      blocks: [
        {type:"rule",label:"FROM",formula:"L'origine ou la sortie : benefit from (tirer profit de), graduate from (être diplômé de), recover from (se remettre de)."},
        {type:"example",en:"Small businesses will benefit from the new tax rules.",fr:"Les petites entreprises bénéficieront des nouvelles règles fiscales."},
        {type:"rule",label:"ABOUT",formula:"L'inquiétude : concerned about = inquiet au sujet de."},
        {type:"example",en:"Investors are concerned about rising costs.",fr:"Les investisseurs s'inquiètent de la hausse des coûts."},
        {type:"trap",text:"« Concerned ABOUT » = inquiet. « Concerned WITH » = qui porte sur, qui traite de. Et « benefit of » n'existe qu'en nom (« the benefits of the plan »), jamais après le verbe."}
      ]
    }
  ]
};
