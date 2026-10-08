# 🧭 Guide pas-à-pas — Setup business TOEIC Arena

> **Pour qui ?** Jérémy, micro-entrepreneur, qui n'a jamais configuré Stripe ni géré d'abonnement payant.
> **Objectif ?** Être prêt à encaisser légalement le 10 juin 2026 (lancement Stripe).
> **Durée totale estimée ?** 4-6h d'action cumulée, étalables sur 2-3 semaines.
> **Ordre ?** Respecter l'ordre des étapes. Chaque étape débloque la suivante.

---

## 📋 Checklist synthèse — à garder sous les yeux

- [ ] **Étape 1** — Vérifier son statut micro-entreprise (15 min)
- [ ] **Étape 2** — Compte bancaire dédié (30 min + délai ouverture 2-5 jours)
- [ ] **Étape 3** — (Optionnel mais recommandé) Assurance RC Pro (1h)
- [ ] **Étape 4** — Choisir et adhérer à un médiateur de la consommation (1h30 + délai 1-2 semaines)
- [ ] **Étape 5** — Créer et vérifier le compte Stripe (1h)
- [ ] **Étape 6** — Configurer Stripe (produits, prix, Tax, portal, webhook) (1h)
- [ ] **Étape 7** — Récupérer toutes les clés/IDs et me les remettre (15 min)
- [ ] **Étape 8** — Valider les CGV avec un juriste (optionnel mais fortement recommandé) (1-2 semaines délai)

---

# ÉTAPE 1 — Vérifier son statut micro-entreprise

⏱️ **15 minutes**

## Pourquoi ?
Stripe te demandera ton SIRET et ton code APE/NAF lors de la création du compte. Il vérifie via les bases publiques que l'entité existe.

## Actions

### 1.1 Trouver son SIRET
- Va sur **https://annuaire-entreprises.data.gouv.fr/**
- Tape ton nom complet ou "Jérémy Leixa"
- Note ton **SIRET** (14 chiffres) et ton **code APE/NAF**
  - `85.59A` = Formation continue d'adultes (organismes de formation déclarés DREETS)
  - `85.59B` = Autres enseignements (formateur indépendant, cours particuliers — **cas typique pour un solo**)

### 1.2 Vérifier que ton activité couvre un service SaaS
⚠️ Point important : ton code APE est `85.59B Autres enseignements` (formateur indépendant). Ce code couvre **toutes les activités liées à l'enseignement** y compris outils pédagogiques associés. TOEIC Arena est un outil pédagogique, donc pas besoin de changer.

**Mais :** si un jour tu veux développer TOEIC Arena comme un pur produit SaaS sans prestation formation, tu devrais ajouter `62.01Z Programmation informatique`. Pas nécessaire aujourd'hui.

### 1.3 Vérifier que tu es bien en franchise en base de TVA
- Regarde ton dernier chiffre d'affaires annuel
- Seuils 2026 (à vérifier chaque année sur service-public.fr) :
  - **Prestations de services (ton cas) : 37 500 €/an**
  - Au-delà, TVA applicable → tu devras facturer 20% + déclarer

Tant que tu es en dessous : mention légale **« TVA non applicable, art. 293 B du CGI »** (déjà dans tes CGV).

### 1.4 Point fiscal
- En micro-entreprise, les revenus Stripe sont du **CA à déclarer** mensuellement ou trimestriellement sur **autoentrepreneur.urssaf.fr**
- Taux de cotisation ~22% pour activités BNC (services intellectuels, ton cas)
- Option versement libératoire de l'impôt sur le revenu : 2,2% supplémentaires si tu l'as activé (à vérifier sur ton espace URSSAF)

## ✅ Livrable étape 1
- SIRET noté : `________________`
- APE/NAF noté : `________________`
- Régime TVA confirmé : `franchise en base ✓` ou `TVA applicable (à partir de ______)`

---

# ÉTAPE 2 — Compte bancaire dédié

⏱️ **30 min côté démarches + 2-5 jours ouvrables pour ouverture**

## Pourquoi ?
- **Obligation légale** : en micro-entreprise, dès que le CA annuel dépasse 10 000 € pendant 2 années consécutives, tu dois avoir un compte **dédié** à l'activité (pas forcément un compte "pro" avec des frais pro)
- **Obligation Stripe** : Stripe te demande un RIB IBAN français pour verser tes revenus. Il refuse souvent les comptes perso partagés avec d'autres usages (signalé comme "risky" par leur KYC)
- **Pratique** : à l'USURSSAF, au comptable, en cas de contrôle, séparer les flux est indispensable

## Options

### Option A — Néobanques "pro" micro-entrepreneur (recommandé)

| Banque | Tarif | Points forts |
|--------|-------|--------------|
| **Qonto** Basic Solo | 9€/mois | Ultra-populaire freelances, bon support FR |
| **Shine** Basic | 8€/mois | Rachetée par SG, fluide, très micro-entrepreneur |
| **Hello Bank Pro** (BNP) | 10,90€/mois | Sécurité traditionnelle, agence |
| **Boursorama Pro** (indisponible en MIC actuellement) | — | Pas pour micro-entreprise |

Toutes offrent : IBAN FR, app mobile, virements SEPA illimités, carte, intégration comptable Pennylane/Dougs.

### Option B — Compte perso secondaire

Tu peux ouvrir un **2ᵉ compte perso** à ta banque habituelle, et le dédier à TOEIC Arena. C'est suffisant légalement tant que tu ne mélanges pas les flux.

⚠️ **Limite** : certaines banques (Crédit Agricole, LCL) verrouillent 2 comptes perso au même nom "pour un usage pro". Vérifie.

### Mon conseil
**Qonto ou Shine**. Tu paies ~100€/an mais tu gagnes :
- Zéro friction Stripe
- Facturation intégrée (pratique pour les reçus clients B2B si tu en as un jour)
- Export comptable direct
- App correcte

## Actions

### 2.1 Ouvrir le compte
- Qonto → qonto.com/fr → "Créer un compte" → Micro-entreprise
- Shine → shine.fr → "Ouvrir un compte" → Micro-entreprise

**À avoir sous la main :**
- Pièce d'identité (CNI ou passeport)
- Justificatif de domicile < 3 mois
- SIRET (étape 1)
- Selfie (vérification d'identité)

**Délai** : 1-5 jours ouvrables avant que le compte soit pleinement fonctionnel.

### 2.2 Recevoir le RIB/IBAN
- Une fois le compte validé, télécharger le **RIB PDF** depuis l'app
- Le mettre de côté : tu le fourniras à Stripe à l'étape 5

## ✅ Livrable étape 2
- Compte ouvert chez : `________________`
- IBAN FR : `FR__ ____ ____ ____ ____ ____ ____`
- RIB PDF téléchargé ✓

---

# ÉTAPE 3 — Assurance RC Pro (optionnel mais recommandé)

⏱️ **1h + délai de signature**

## Pourquoi ?
- Pas obligatoire légalement pour ton activité, mais **fortement recommandé** en cas de litige client :
  - Client prétend que tes conseils l'ont fait échouer à son TOEIC (fantaisiste mais juridiquement possible)
  - Bug critique qui aurait fait perdre du temps de préparation
  - Litige sur le remboursement

- Une RC Pro couvre les dommages que tu pourrais causer à un client dans le cadre de ton activité.

## Budget
- **100-250€/an** pour une micro-entreprise à faible CA
- Assureurs spécialisés : Hiscox, Axa Pro, AssurOne Pro, Macif Pro

## Comment choisir
- Demande un devis sur **lesfurets.com** ou **assurup.com** (comparateur)
- Vérifie que la couverture inclut : **prestations de services numériques / e-learning**
- Plafond minimal conseillé : 500 000 € / sinistre

## Actions
- Demander 3 devis, choisir le moins cher qui couvre le besoin
- Signer en ligne, recevoir l'attestation par mail

## ✅ Livrable étape 3
- Assureur : `________________`
- Contrat n° : `________________`
- Date début : `________________`

---

# ÉTAPE 4 — Médiateur de la consommation

⏱️ **1h démarche + 1-2 semaines délai d'adhésion**

## Pourquoi ?
**Obligation légale** (Art. L. 616-1 et R. 616-1 Code de la consommation) dès que tu vends à des consommateurs. Tu dois :
1. Adhérer à un dispositif de médiation agréé par la CECMC (Commission d'Évaluation et de Contrôle de la Médiation de la Consommation)
2. Mentionner le médiateur dans tes CGV (Article 17)
3. Indiquer ses coordonnées sur ton service client / emails de support

**Si tu ne le fais pas** : amende jusqu'à 15 000 € + tes CGV seront jugées non conformes en cas de litige.

## Les 3 principaux médiateurs agréés (tous sur le site **economie.gouv.fr/mediation-conso/mediateurs-references**)

### CNPM Médiation Consommation
- **Site** : https://medconsodev.eu/
- **Tarif** : **gratuit pour les TPE** (<10 salariés, <2M€ CA) — cotisation 0€/an
- **Point fort** : ciblé PME/TPE, process simple
- **Défaut** : moins connu du grand public que Médicys
- **Mon conseil pour toi : CELUI-CI** — zéro coût, parfait pour micro-entreprise

### Médicys
- **Site** : https://www.medicys.fr/
- **Tarif** : ~50-150€/an selon CA
- **Point fort** : réputation établie, médiateur numérique
- **Défaut** : payant

### SAS Médiation Solution (ex AME)
- **Site** : https://sasmediationsolution-conso.fr/
- **Tarif** : ~150-200€/an forfait + frais par dossier
- **Défaut** : plus cher

## Actions (pour CNPM — ma reco)

### 4.1 Adhésion CNPM
- Va sur **https://medconsodev.eu/** et cherche la page « Adhésion » ou « Professionnels »
- Remplis le formulaire d'adhésion :
  - Raison sociale, SIRET, adresse
  - Activité : « Services numériques e-learning »
  - Nombre de salariés : 0
  - CA annuel : estimation (ton prévisionnel, ex 5 000 €)
- Signer la convention (PDF envoyé, à retourner signé)

### 4.2 Réception des informations à mettre dans les CGV

Une fois ton adhésion validée (généralement 3-10 jours ouvrables), tu recevras par mail :
- Un **numéro d'adhésion**
- Les **coordonnées postales exactes** du médiateur
- L'**URL de saisine** des consommateurs
- (Parfois) un **logo CNPM** à afficher sur ton site

Conserve précieusement ces 3-4 infos. Tu me les donnes pour que j'update l'Article 17 des CGV.

## ✅ Livrable étape 4
- Médiateur choisi : `________________`
- Numéro d'adhésion : `________________`
- Adresse postale : `________________`
- URL saisine : `________________`
- Date d'adhésion : `________________`

---

# ÉTAPE 5 — Créer le compte Stripe

⏱️ **1h setup + 1-3 jours délai de vérification**

## Prérequis
- SIRET (étape 1) ✓
- IBAN + RIB (étape 2) ✓
- Pièce d'identité en PDF ou photo
- Justificatif de domicile < 3 mois

## Actions

### 5.1 Créer le compte
- Va sur **https://stripe.com/fr**
- Clique "Commencer maintenant" en haut à droite
- Email + mot de passe solide (active 2FA ensuite)
- Pays : **France** — c'est important, ne pas choisir autre chose

### 5.2 Activation du compte (KYC)
Stripe te demande une série d'informations :

**Structure**
- Type d'entité : **Entreprise individuelle / Micro-entreprise**
- SIRET : `1234567890 ...` (celui de l'étape 1)
- Nom commercial : **TOEIC Arena**
- Secteur : **Éducation / e-learning** (dans la liste déroulante)
- Site web : l'URL Vercel actuelle ou ton domaine custom

**Adresse**
- Adresse du siège = adresse URSSAF de ta micro-entreprise

**Identité du représentant (toi)**
- Nom, prénom, date de naissance, nationalité
- Adresse personnelle (peut être = siège pour MIC)
- N° de pièce d'identité + upload CNI ou passeport recto/verso
- Selfie avec la pièce d'identité (Stripe utilise Jumio pour vérifier)

**Compte bancaire**
- IBAN de l'étape 2
- Titulaire du compte : doit matcher ton nom exact
- Devise : **EUR**

**Fréquence des versements**
- Par défaut : **quotidien J+7** (Stripe verse 7 jours après chaque paiement). Laisse ce réglage : il évite les chargebacks surprise de vider ta trésorerie.

### 5.3 Attendre la vérification
- **Délai** : quelques minutes à 3 jours ouvrables
- Tu recevras un mail "Votre compte Stripe est actif" quand c'est bon

⚠️ Tant que ton compte n'est pas "Live" activé, tu travailles en **mode test** (important pour la Phase 3 côté code, je peux tout coder et tester même pendant ce délai).

## ✅ Livrable étape 5
- Compte Stripe créé ✓
- Identité vérifiée ✓
- Compte "Live" actif ✓
- 2FA activée (Settings → Security) ✓

---

# ÉTAPE 6 — Configurer Stripe en détail

⏱️ **1h**

À faire une fois le compte "Live" activé. Tu peux aussi faire toute cette étape **en mode test** dès le compte créé — c'est même recommandé.

## 6.1 Produits et Prix

Stripe dashboard → **Catalogue de produits** → « + Ajouter un produit »

**Produit :**
- Nom : `TOEIC Arena Premium`
- Description : `Accès illimité à tous les modules d'entraînement TOEIC`
- Image (optionnel) : ton logo TOEIC Arena (PNG carré, 512x512)

**Prix #1 — Premium Mensuel**
- Clique « Ajouter un autre prix »
- Type : **Récurrent**
- Montant : `9,99` EUR
- Période : **Tous les mois**
- Save → tu obtiens un `price_id` du type `price_1Abc2Def...`
- **Note-le** (Prix mensuel)

**Prix #2 — TOEIC Pass 3 mois**
- Clique « Ajouter un autre prix » (sur le même produit !)
- Type : **Paiement unique** (one-time, pas recurring)
- Montant : `22,99` EUR
- Save → tu obtiens un second `price_id`
- **Note-le** (Pass 3 mois)

## 6.2 Stripe Tax (IMPORTANT même en franchise)

Même si tu es en franchise TVA, active Stripe Tax. Zero coût, couvre le jour où tu passes le seuil.

Stripe dashboard → **Paramètres** → **Taxes** → **Activer Stripe Tax**

Dans **Paramètres fiscaux** :
- **France** : statut fiscal = **Exonération / Franchise en base**
- Mention sur les factures : **« TVA non applicable, art. 293 B du CGI »** (champ custom à ajouter)

Ça se configure dans : **Paramètres → Branding → Pied de page des factures** → ajouter cette mention.

## 6.3 Customer Portal

Stripe dashboard → **Paramètres** → **Billing** → **Customer portal** → **Activer**

Cocher :
- ✅ **Cancel subscriptions** (obligation « bouton résiliation » L.215-1-1 CC)
- ✅ **Update payment method**
- ✅ **Download invoices**
- Ne pas cocher : Pause subscription (pas pertinent pour ton modèle)

Dans **Politique d'annulation** :
- Choisir : **À la fin de la période de facturation en cours** (pas d'effet immédiat)

Dans **Branding** :
- Upload logo TOEIC Arena
- Couleur principale : `#d4943a` (ton cyan/bronze)

## 6.4 Emails transactionnels

Stripe dashboard → **Paramètres** → **Emails**

Activer :
- ✅ **Receipts** (reçu à chaque paiement réussi)
- ✅ **Renewal reminder emails** (rappel avant reconduction Monthly)
- ✅ **Payment failed emails** (échec Monthly)
- ✅ **Subscription canceled confirmation**

Dans **Branding** :
- Logo, couleurs, signature email

## 6.5 Webhook (placeholder)

Stripe dashboard → **Developers** → **Webhooks** → **+ Add endpoint**

**URL de l'endpoint** :
- En test mode : `https://toeic-arena-git-main.vercel.app/api/stripe-webhook` (adapte selon ton URL Vercel)
- En live mode : idem domaine de prod

**Events à écouter** (coche chacun) :
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `charge.refunded`

Save → Stripe te donne un **Signing secret** du type `whsec_...`
**Note-le** (Webhook Secret).

## 6.6 Clés API

Stripe dashboard → **Developers** → **API keys**

**Mode test :**
- Publishable key test : `pk_test_...`
- Secret key test : `sk_test_...` (clique pour révéler)

**Mode live :**
- Publishable key live : `pk_live_...`
- Secret key live : `sk_live_...`

⚠️ **Sécurité absolue** :
- La secret key ne doit **JAMAIS** être committée dans git
- La publishable key peut être exposée côté frontend
- Stocke les 4 clés dans un gestionnaire de mots de passe (Bitwarden, 1Password)

## ✅ Livrable étape 6
- [ ] Price ID Monthly : `price_________________`
- [ ] Price ID Pass 3m : `price_________________`
- [ ] Publishable key test : `pk_test________________`
- [ ] Secret key test : `sk_test________________`
- [ ] Publishable key live : `pk_live________________`
- [ ] Secret key live : `sk_live________________`
- [ ] Webhook signing secret : `whsec________________`
- [ ] Stripe Tax activée ✓
- [ ] Customer Portal configuré ✓
- [ ] Emails transactionnels activés ✓

---

# ÉTAPE 7 — Me remettre les livrables pour la Phase 3 code

⏱️ **15 min**

Une fois les étapes 1 à 6 faites, copie-moi ce bloc rempli :

```
=== Livrables business TOEIC Arena ===

SIRET: _______________
APE/NAF: _______________
Statut TVA: franchise en base / TVA applicable

IBAN: FR__ ____ ____ ____ ____ ____ ____

Médiateur:
  - Nom: _______________
  - N° adhésion: _______________
  - Adresse postale: _______________
  - URL saisine: _______________

Stripe:
  - Price Monthly ID: price_________________
  - Price Pass 3m ID: price_________________
  - Publishable key test: pk_test________________
  - Secret key test: sk_test________________
  - Publishable key live: pk_live________________
  - Secret key live: sk_live________________
  - Webhook signing secret: whsec________________

Assurance RC Pro (optionnel):
  - Assureur: _______________
  - Contrat: _______________
```

Avec ça, je peux :
1. Updater l'Article 2 + Article 17 des CGV avec tes infos exactes
2. Configurer les variables d'environnement Vercel
3. Coder la Phase 3 (Stripe Checkout + webhook) avec tes `price_id`

---

# ÉTAPE 8 — Validation CGV par un juriste (optionnel, recommandé)

⏱️ **1-2 semaines délai + ~200-400€**

## Pourquoi ?
J'ai rédigé un draft de CGV de 20 articles qui couvre les obligations légales françaises 2026. **Mais je ne suis pas juriste.** Avant publication, faire relire par un avocat spécialisé permet de :
- Valider les clauses de limitation de responsabilité (souvent attaquables)
- Vérifier la conformité avec les évolutions récentes (Directive Omnibus 2022, DSA, loi "bouton résiliation" 2023)
- Sécuriser la clause de rétractation + renonciation expresse

## Options

### Option A — Avocat spécialisé droit du numérique
- Budget : **300-500€** pour une relecture complète avec recommandations
- Spécialisé : droit de la consommation + droit du numérique
- Trouvable via **avocat.fr** ou **ordre-avocats-paris.fr** > filtre spécialisation

### Option B — Services en ligne
- **Captain Contrat** (captaincontrat.com) : ~150-250€
- **LegalPlace** : ~100-200€
- Moins personnalisé mais rapide

### Option C — Rester sur le draft "au mieux" (risqué)
- Gratuit mais risque juridique en cas de litige
- Faisable en phase beta/pilote (< 50 clients) mais déconseillé au-delà

## Mon conseil
**Option A avec un avocat** si tu dépasses 200 clients payants — à ce stade la relecture est un investissement rentabilisé.
Pour les premières semaines de test, **Option B suffit**.

## ✅ Livrable étape 8
- CGV relues par : `________________`
- Date : `________________`
- Modifications demandées : `________________`

---

# 📅 Calendrier recommandé

En tenant compte des délais d'attente (ouverture banque, vérification Stripe, adhésion médiateur), voici le planning conseillé :

| Semaine | Actions | Livrables |
|---------|---------|-----------|
| **S1 — cette semaine** | Étape 1 (SIRET) + Étape 2 (compte bancaire) + Étape 4 (adhésion médiateur soumise) | SIRET vérifié, compte ouvert (en cours), médiateur demande envoyée |
| **S2** | Étape 3 (assurance RC Pro) + Étape 5 (compte Stripe créé) | Compte Stripe actif, assurance signée |
| **S3** | Étape 6 (configuration Stripe complète) | Produits/prix créés, clés récupérées |
| **S4** | Étape 7 (remettre livrables) + Étape 8 démarrée (juriste) | Je démarre intégration Phase 3 |
| **S5-S6** | Attente relecture juriste | CGV finalisées |
| **S7-S8** | Tests Phase 3 + CGV publiées | Stripe live |

**Cible :** **Stripe live fin mai 2026, prêt pour le cutoff IDRAC du 28 juin.**

---

# 🆘 Ce qu'il faut ABSOLUMENT éviter

- ❌ **Committer des clés Stripe en dur dans le code** — toujours via variables d'environnement Vercel
- ❌ **Mélanger compte perso et compte pro** pour les flux Stripe (rejet possible par Stripe)
- ❌ **Publier les CGV sans désigner un médiateur** (amende 15 000 €)
- ❌ **Oublier la case "renonciation expresse au droit de rétractation"** au checkout (sinon remboursement 14j obligatoire)
- ❌ **Déclarer tardivement le CA à l'URSSAF** — le CA Stripe = revenu perçu, à déclarer chaque mois ou trimestre selon ton régime
- ❌ **Activer Apple IAP / Google Play Billing** si tu fais un jour un wrapper store — tu perdrais 15-30% de marge (cf. audit PWA vs Stores)

---

# 🧭 Si tu doutes

À n'importe quelle étape, pose-moi la question. Je peux :
- T'aider à remplir un formulaire d'adhésion médiateur
- Valider la config Stripe avant activation live
- Rédiger un email type pour une question au support Stripe
- Vérifier tes clés API pour éviter les erreurs de scope

**Règle d'or : ne pas activer le mode LIVE Stripe avant que tout soit testé en mode TEST.** On codera et testera tout en test mode, puis on bascule en live seulement quand 100% vérifié.

---

_Document rédigé pour TOEIC Arena · mise à jour 2026-04-20_
