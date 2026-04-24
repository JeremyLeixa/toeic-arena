// =============================================================
// cgv.js — Conditions Générales de Vente de TOEIC Arena
// Version 1.0 (maj 2026-04-24) — À faire relire par un juriste avant
// publication commerciale.
//
// Source canonique : CGV_draft.md à la racine du repo. Ce fichier est
// l'export consommé par <CGVPage/> dans App.jsx pour rendre les CGV
// dans l'app au moment du checkout.
//
// Règle : toute modif des CGV doit se faire à DEUX endroits :
//   1. CGV_draft.md (source légale archivable)
//   2. src/data/cgv.js (rendu in-app)
// Si divergence, la version la plus récente des deux s'applique —
// mais on cible la parité à chaque release.
// =============================================================

export var CGV_VERSION = "1.0";
export var CGV_EFFECTIVE_DATE = "2026-04-24";

export var CGV_ARTICLES = [
  {
    id: "intro",
    title: "Préambule",
    body: "Les présentes Conditions Générales de Vente (ci-après « CGV ») ont pour objet de définir les conditions dans lesquelles Jérémy LEIXA commercialise l'accès aux fonctionnalités premium du service TOEIC Arena au profit de personnes physiques majeures, agissant en qualité de consommateurs au sens du Code de la consommation.\n\nEn souscrivant un abonnement, le Client accepte sans réserve les présentes CGV."
  },
  {
    id: "art2",
    title: "Article 2 — Mentions légales / Identification de l'Éditeur",
    body: "• Nom commercial : TOEIC Arena\n• Éditeur : Jérémy LEIXA\n• Statut juridique : Entrepreneur Individuel — régime de la micro-entreprise\n• SIRET : 830 200 556 00025\n• Code APE : 85.59B (Formation continue d'adultes)\n• Adresse : 33 route de la Daleure, 38590 Saint-Étienne-de-Saint-Geoirs\n• Email : leixa.formation@gmail.com\n• Directeur de la publication : Jérémy LEIXA\n• Régime TVA : TVA non applicable, art. 293 B du CGI (franchise en base)\n\nHébergement :\n• Application web et API : Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA\n• Base de données et authentification : Supabase Inc., 970 Toa Payoh North #07-04, Singapour 318992"
  },
  {
    id: "art3",
    title: "Article 3 — Description du Service",
    body: "TOEIC Arena est une application web progressive (PWA) de préparation au test TOEIC®, proposant des exercices interactifs, des tests blancs, des flashcards, des mini-jeux pédagogiques et un système de progression gamifié.\n\nLe Service est proposé selon deux formules :\n• Freemium (gratuite) : accès limité à un ensemble restreint de modules et contenus.\n• Premium (payante) : accès à l'intégralité des modules, tests blancs, Boss Test, Endless Arena, et fonctionnalités avancées.\n\nLe TOEIC® est une marque déposée d'ETS (Educational Testing Service). TOEIC Arena est un service indépendant et n'est en aucune manière affilié à, approuvé par, ou partenaire d'ETS."
  },
  {
    id: "art4",
    title: "Article 4 — Acceptation des CGV",
    body: "La souscription à un abonnement Premium implique l'acceptation pleine, entière et sans réserve des présentes CGV par le Client. Le Client reconnaît avoir pris connaissance des CGV préalablement à sa commande et déclare les accepter en cochant la case prévue à cet effet lors du processus de paiement.\n\nLe Client déclare être âgé de 15 ans révolus. Si le Client est mineur, il garantit avoir obtenu l'autorisation préalable de son représentant légal."
  },
  {
    id: "art5",
    title: "Article 5 — Accès au Service et inscription",
    body: "5.1 Création de compte\nL'accès au Service nécessite la création d'un compte utilisateur via l'adresse email du Client (authentification par lien magique).\n\n5.2 Exactitude des informations\nLe Client s'engage à fournir des informations exactes, à jour et complètes lors de la création de son compte et à les maintenir à jour.\n\n5.3 Confidentialité\nLe Client est responsable de la préservation de la confidentialité de son adresse email et de l'accès à sa boîte email. Toute action effectuée via son compte sera réputée avoir été effectuée par lui.\n\n5.4 Compatibilité technique\nLe Service est accessible via un navigateur web moderne (versions stables récentes de Chrome, Firefox, Safari, Edge) et une connexion Internet stable. Certaines fonctionnalités (notifications push, retour haptique) peuvent varier selon l'appareil et le système d'exploitation."
  },
  {
    id: "art6",
    title: "Article 6 — Offres commerciales et prix",
    body: "6.1 Formules proposées\n• Premium Mensuel : 9,99 € TTC / mois — abonnement reconductible tacitement chaque mois, résiliable à tout moment, sans engagement.\n• TOEIC Pass 3 mois : 22,99 € TTC — paiement unique, sans reconduction automatique, durée 3 mois.\n\nLe TOEIC Pass 3 mois est un produit à paiement unique : aucun prélèvement ultérieur n'intervient. À l'expiration, l'accès Premium est automatiquement désactivé et le Client retrouve les fonctionnalités Freemium.\n\n6.2 Devise et TVA\nLes prix sont indiqués en euros. En tant qu'entreprise bénéficiant de la franchise en base de TVA (article 293 B du CGI), la TVA n'est pas applicable. Les prix affichés sont des prix nets à payer.\n\n6.3 Modification des prix\nL'Éditeur se réserve le droit de modifier ses prix. Les modifications ne s'appliqueront qu'aux nouvelles souscriptions ou renouvellements, après information préalable du Client au moins 30 jours avant la date d'application, par email. Le Client peut résilier avant application du nouveau tarif."
  },
  {
    id: "art7",
    title: "Article 7 — Modalités de paiement",
    body: "7.1 Prestataire\nLe paiement est traité par Stripe Payments Europe, Limited (société de droit irlandais), prestataire de services de paiement agréé.\n\n7.2 Moyens acceptés\nCartes bancaires Visa, Mastercard, American Express, ainsi que tout moyen de paiement accepté par Stripe (Apple Pay, Google Pay, SEPA, selon disponibilité).\n\n7.3 Données bancaires\nLes données bancaires du Client sont collectées et stockées directement par Stripe, dans le respect du standard PCI-DSS. L'Éditeur n'a jamais accès aux numéros de carte bancaire complets du Client.\n\n7.4 Débit et reconduction\n• Premium Mensuel : premier débit immédiat, débits suivants à chaque date anniversaire mensuelle, jusqu'à résiliation.\n• TOEIC Pass 3 mois : unique débit lors de la souscription. Aucun prélèvement ultérieur. Accès automatiquement désactivé à l'issue des 3 mois.\n\n7.5 Défaut de paiement\nEn cas d'échec du prélèvement mensuel, Stripe tentera plusieurs nouvelles présentations sur 7 jours. Passé ce délai sans régularisation, l'abonnement est suspendu puis résilié. Le Client conserve l'accès Freemium.\n\n7.6 Factures\nUne facture électronique est envoyée par email à chaque paiement réussi et demeure accessible depuis l'espace client Stripe (portail client)."
  },
  {
    id: "art8",
    title: "Article 8 — Durée, reconduction et expiration",
    body: "8.1 Premium Mensuel — abonnement reconductible\nDurée initiale : 1 mois à compter de la souscription. Conformément à l'article L.215-1 du Code de la consommation, l'abonnement est reconductible tacitement pour des périodes successives d'un mois. Chaque renouvellement donne lieu à l'émission d'un reçu par Stripe, envoyé par email (vaut information du renouvellement). Le Client peut résilier à tout moment sans attendre d'échéance.\n\n8.2 TOEIC Pass 3 mois — paiement unique, expiration automatique\nDurée ferme de 3 mois. Aucune reconduction automatique. À l'échéance, l'accès Premium est automatiquement désactivé. Un email de courtoisie est envoyé au Client 7 jours avant l'expiration, l'invitant à prolonger son accès s'il le souhaite. Le Client peut souscrire un nouveau Pass ou un abonnement Mensuel à tout moment avant l'échéance ; la nouvelle formule prend effet à l'expiration du Pass en cours."
  },
  {
    id: "art9",
    title: "Article 9 — Droit de rétractation",
    body: "9.1 Principe\nConformément à l'article L.221-18 du Code de la consommation, le Client dispose en principe d'un délai de 14 jours à compter de la conclusion du contrat pour exercer son droit de rétractation.\n\n9.2 Renonciation expresse (contenu numérique à exécution immédiate)\nToutefois, conformément à l'article L.221-28 13° du Code de la consommation, le droit de rétractation NE PEUT être exercé pour les contrats de fourniture d'un contenu numérique non fourni sur un support matériel dont l'exécution a commencé après accord préalable exprès du consommateur et renoncement exprès à son droit de rétractation.\n\nEn validant sa souscription, le Client accepte expressément :\n1. que le Service lui soit fourni immédiatement dès le paiement confirmé,\n2. de renoncer en conséquence à son droit de rétractation.\n\nCette double acceptation est matérialisée par une case à cocher distincte sur la page de paiement, sans laquelle la souscription ne peut être validée.\n\n9.3 Absence de renonciation\nSi le Client n'a pas expressément renoncé à son droit de rétractation, il peut l'exercer dans un délai de 14 jours à compter de la souscription, en adressant une demande non ambiguë par email à leixa.formation@gmail.com. Le remboursement interviendra dans un délai de 14 jours à compter de la réception de la demande, par le même moyen de paiement."
  },
  {
    id: "art10",
    title: "Article 10 — Résiliation et fin de l'accès Premium",
    body: "10.1 Premium Mensuel — résiliation par le Client\nLe Client peut résilier son abonnement à tout moment, sans motif ni pénalité, via :\n• le portail client Stripe (accessible depuis son profil dans l'application, bouton « Gérer »),\n• ou par email à leixa.formation@gmail.com.\n\nLa résiliation prend effet à l'issue de la période de facturation en cours. Le Client conserve l'accès Premium jusqu'à cette date, sans remboursement au prorata.\n\n10.2 TOEIC Pass 3 mois\nPas de mécanisme de résiliation (pas de reconduction). L'accès prend fin automatiquement à l'échéance des 3 mois. Aucun remboursement n'est dû pour la période non utilisée, sauf dysfonctionnement majeur du Service (article 14).\n\n10.3 Résiliation par l'Éditeur\nL'Éditeur peut résilier de plein droit, sans préavis ni indemnité, en cas de :\n• manquement grave (fraude, usage détourné, atteinte à la propriété intellectuelle, partage non autorisé du compte, abus, harcèlement),\n• défaut de paiement non régularisé (Mensuel uniquement),\n• cessation définitive du Service.\n\n10.4 Effets de la fin d'accès\nLe Client perd l'accès aux fonctionnalités Premium. Son compte et ses données personnelles sont conservés selon les durées précisées dans la Politique de Confidentialité. Le Client peut à tout moment demander l'export ou la suppression de ses données."
  },
  {
    id: "art11",
    title: "Article 11 — Obligations du Client",
    body: "Le Client s'engage à :\n• utiliser le Service conformément à sa destination pédagogique,\n• ne pas partager ses identifiants avec un tiers,\n• ne pas tenter de contourner les mesures techniques de protection, notamment les limitations d'accès de la formule Freemium,\n• ne pas reproduire, extraire, revendre ou rediffuser le contenu pédagogique du Service,\n• ne pas utiliser le Service à des fins illégales, offensantes ou en violation de la réglementation en vigueur.\n\nTout manquement pourra entraîner la suspension ou la résiliation immédiate de l'abonnement, sans remboursement."
  },
  {
    id: "art12",
    title: "Article 12 — Propriété intellectuelle",
    body: "L'ensemble des éléments du Service (textes, images, sons, code, bases de données de questions, design, logo, mises en page) est la propriété exclusive de l'Éditeur ou de ses partenaires, et est protégé par le droit d'auteur, le droit des bases de données et, le cas échéant, le droit des marques.\n\nLa souscription à la formule Premium confère au Client un droit d'usage strictement personnel, non exclusif, non transférable et non cessible, du Service et de ses contenus, pour la durée de son abonnement et dans le cadre d'une préparation personnelle au test TOEIC.\n\nToute reproduction, représentation, diffusion, ou exploitation commerciale, totale ou partielle, du Service ou de son contenu, sans l'autorisation écrite préalable de l'Éditeur, est strictement interdite et susceptible de constituer une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle."
  },
  {
    id: "art13",
    title: "Article 13 — Protection des données personnelles",
    body: "Le traitement des données personnelles du Client est régi par la Politique de Confidentialité, accessible depuis l'application, conforme au RGPD (UE 2016/679) et à la loi Informatique et Libertés du 6 janvier 1978 modifiée.\n\nLa souscription à un abonnement Premium implique le traitement de données supplémentaires (identifiant client Stripe, statut et historique d'abonnement, factures). Ces données sont conservées pour la durée de la relation contractuelle et, au-delà, selon les obligations légales applicables (notamment 10 ans pour les pièces comptables, article L.123-22 du Code de commerce).\n\nLe Client peut exercer ses droits (accès, rectification, effacement, portabilité, opposition, limitation) par email à leixa.formation@gmail.com."
  },
  {
    id: "art14",
    title: "Article 14 — Responsabilité",
    body: "14.1 Obligation de moyens\nL'Éditeur est tenu à une obligation de moyens. Il ne garantit pas l'absence d'erreurs, de bugs, d'interruptions, ni l'adéquation parfaite du Service à un objectif spécifique du Client, notamment l'obtention d'un score TOEIC particulier.\n\n14.2 Nature pédagogique du Service\nLe Service est un outil d'entraînement. Le score TOEIC estimé affiché dans l'application est indicatif et basé sur des modèles statistiques propres à l'Éditeur. Il ne saurait se substituer au test TOEIC officiel administré par ETS.\n\n14.3 Interruptions\nLe Service peut faire l'objet d'interruptions pour maintenance, évolution technique, mise à jour ou en raison de force majeure (article 15). L'Éditeur informera le Client dans la mesure du possible avant toute interruption planifiée.\n\n14.4 Limitation\nLa responsabilité de l'Éditeur ne pourra en aucun cas être engagée pour les dommages indirects subis par le Client (perte de chance, préjudice moral, perte de données, manque à gagner). En tout état de cause, la responsabilité cumulée de l'Éditeur au titre du présent contrat est limitée au montant total des sommes effectivement versées par le Client au cours des 12 mois précédant le fait générateur du dommage.\n\n14.5 Exclusions\nLes limitations ci-dessus ne s'appliquent pas en cas de faute lourde, dol ou faute intentionnelle de l'Éditeur, ni à la réparation des dommages corporels."
  },
  {
    id: "art15",
    title: "Article 15 — Force majeure",
    body: "La responsabilité de l'Éditeur ne pourra être engagée en cas de non-exécution ou de retard dans l'exécution de ses obligations résultant d'un cas de force majeure au sens de l'article 1218 du Code civil, incluant notamment, sans s'y limiter : catastrophes naturelles, pandémies, grèves, guerres, actes terroristes, défaillances de réseaux de télécommunication ou d'infrastructures techniques tierces (hébergeur, prestataire de paiement)."
  },
  {
    id: "art16",
    title: "Article 16 — Service client et réclamations",
    body: "Pour toute question, demande d'information ou réclamation, le Client peut contacter le service client :\n\n• Email : leixa.formation@gmail.com\n• Délai de réponse indicatif : 5 jours ouvrés\n\nEn cas de réclamation écrite, l'Éditeur s'engage à accuser réception dans les meilleurs délais et à apporter une réponse motivée dans un délai maximal de 30 jours."
  },
  {
    id: "art17",
    title: "Article 17 — Médiation de la consommation",
    body: "Si vous n'êtes pas parvenu à résoudre votre litige après nous avoir adressé une réclamation écrite (courrier ou courriel), datée, rappelant les circonstances qui ont donné lieu au différend et ce que vous réclamez, vous pourrez saisir le médiateur de la consommation, désigné ci-dessous, si vous avez reçu une réponse écrite négative de notre part ou pas de réponse deux mois après l'envoi de votre réclamation.\n\nConformément aux articles L.616-1 et R.616-1 du code de la consommation, notre société a mis en place un dispositif de médiation de la consommation. L'entité de médiation retenue est : SAS MÉDIATION CONSOMMATION DÉVELOPPEMENT.\n\nEn cas de litige, tout consommateur pourra déposer sa réclamation sur le site :\nhttps://www.medconsodev.eu\n\nou par voie postale en écrivant à :\nMÉDIATION CONSOMMATION DÉVELOPPEMENT\nC/O Centre d'Affaires Stéphanois SAS - Immeuble l'Horizon - Esplanade de France - 3 rue J. Constant Milleret - 42000 SAINT-ETIENNE\n\nNuméro d'adhérent : MED60239. Convention signée le 20 avril 2026 pour une durée de 3 ans. Gratuité de la procédure pour le consommateur. Pour plus de détails, voir la page « Médiation de la consommation » accessible depuis le profil.\n\nPlateforme européenne de règlement des litiges (RLL) :\nhttps://ec.europa.eu/consumers/odr/"
  },
  {
    id: "art18",
    title: "Article 18 — Modification des CGV",
    body: "L'Éditeur se réserve le droit de modifier les CGV à tout moment pour tenir compte d'évolutions légales, réglementaires, jurisprudentielles, techniques ou commerciales.\n\nLes nouvelles CGV sont notifiées par email au Client au moins 30 jours avant leur entrée en vigueur. Si le Client n'accepte pas les nouvelles CGV, il peut résilier son abonnement sans frais avant leur date d'application. À défaut de résiliation, les nouvelles CGV s'appliquent à compter de leur date d'entrée en vigueur.\n\nLes modifications purement favorables au Client (baisse de prix, ajout de fonctionnalités sans surcoût) sont applicables immédiatement sans préavis."
  },
  {
    id: "art19",
    title: "Article 19 — Intégralité, nullité, non-renonciation",
    body: "Les présentes CGV expriment l'intégralité des obligations des parties. Si une clause s'avérait nulle ou inapplicable, les autres clauses demeureraient en vigueur. Le fait pour l'Éditeur de ne pas se prévaloir à un moment donné d'une disposition des CGV ne peut être interprété comme valant renonciation à s'en prévaloir ultérieurement."
  },
  {
    id: "art20",
    title: "Article 20 — Droit applicable et juridiction compétente",
    body: "Les présentes CGV sont régies par le droit français.\n\nEn cas de litige, les parties s'efforceront de trouver une solution amiable avant toute action judiciaire. À défaut, et après recours à la médiation prévue à l'article 17, les tribunaux français seront seuls compétents.\n\nPour les litiges avec un Client consommateur, sont compétents, au choix du Client : la juridiction du lieu où il demeurait au moment de la conclusion du contrat ou de la survenance du fait dommageable, ou la juridiction du défendeur (article R.631-3 du Code de la consommation)."
  }
];
