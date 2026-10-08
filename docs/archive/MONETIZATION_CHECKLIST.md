# TOEIC Arena — Checklist monétisation exhaustive

> **Objectif :** zéro oubli avant mise en ligne du paiement.
> **Owner légende :** 👤 = Jérémy (business/admin) · 🤖 = Claude (code) · 🤝 = ensemble

**Date cible mise en ligne Stripe test :** 2026-05-15
**Date cible mise en ligne Stripe live :** 2026-06-10
**Date cutoff IDRAC :** 2026-06-28

---

## 1. 🏢 Formalités administratives (pré-requis)

- [ ] 👤 Micro-entreprise **active et déclarée** à l'URSSAF (normalement déjà OK, à vérifier)
- [ ] 👤 Récupérer le **SIRET** (sur ton espace auto-entrepreneur URSSAF)
- [ ] 👤 Vérifier le **code APE/NAF** — si tu factures aujourd'hui des prestations de formation, tu es probablement en 85.59A. Pour un SaaS c'est plutôt 62.01Z. Deux codes peuvent coexister ; à voir avec un comptable si tu veux optimiser.
- [ ] 👤 **Compte bancaire pro dédié** (obligatoire en micro-entreprise dès que CA annuel > 10 000 € pendant 2 années consécutives ; recommandé d'emblée pour Stripe — Qonto / Shine / Boursorama Pro sont les options classiques)
- [ ] 👤 **Souscription assurance RC Pro** (non obligatoire pour micro-entreprise de formation/tech, mais fortement conseillé vu la responsabilité contractuelle B2C)
- [ ] 👤 **Vérifier seuils TVA** : franchise en base valide jusqu'à **37 500 €/an de CA services** (2026, à confirmer chaque année). Au-dessus, bascule TVA obligatoire → impact prix affichés.

---

## 2. 💳 Stripe

### 2.1 Configuration compte
- [ ] 👤 Créer compte Stripe sur `stripe.com` (choisir FR comme pays de résidence)
- [ ] 👤 Activer le compte (vérification identité : pièce ID + justificatif adresse + SIRET)
- [ ] 👤 Renseigner RIB du compte bancaire pro pour les virements Stripe → toi
- [ ] 👤 Régler la période de versement (recommandé : 7 jours après encaissement, évite les trous de trésorerie)
- [ ] 👤 Activer la **conformité SCA** (Strong Customer Authentication — 3D Secure) — activé par défaut sur Stripe Checkout

### 2.2 Produits & prix
- [ ] 👤 Créer produit `TOEIC Arena Premium`
  - Description courte : « Accès illimité à tous les modules d'entraînement TOEIC »
  - Image produit (logo TOEIC Arena)
- [ ] 👤 Créer prix **mensuel (recurring)** : **9,99 € EUR / month**
- [ ] 👤 Créer prix **TOEIC Pass 3 mois (one-time)** : **22,99 € EUR / one_time** (attention : pas `recurring` 3 mois, mais `one_time` — l'expiration est gérée côté app via `access_expires_at`)
- [ ] 👤 Récupérer les deux `price_id` (format `price_xxxxx`) et me les fournir pour l'intégration code
- [ ] 👤 **Important** : dans Stripe > Products > TOEIC Arena Premium, désactiver l'affichage de l'ancien prix 29,99€ si jamais il a été créé en version antérieure

### 2.3 TVA
- [ ] 👤 Activer **Stripe Tax** (recommandé même en franchise) — Stripe gère automatiquement la conformité si un jour tu bascules TVA
- [ ] 👤 Dans Stripe Tax, configurer la juridiction France avec statut **« Tax-exempt / Franchise »** pour afficher le prix sans TVA sur les factures
- [ ] 👤 Vérifier que les **factures générées par Stripe** mentionnent bien « TVA non applicable, art. 293 B du CGI » (à paramétrer dans Stripe → Branding → Tax IDs / invoice footer)

### 2.4 Customer Portal
- [ ] 👤 Stripe Dashboard → Settings → Billing → Customer portal → activer
- [ ] 👤 Autoriser : **cancel subscription** — s'applique au Premium Mensuel uniquement. Pour respecter le « bouton résiliation » légal (art. L. 215-1-1 CC). Le TOEIC Pass 3 mois étant un paiement unique, il n'apparaît pas comme résiliable dans le portal.
- [ ] 👤 Autoriser : update payment method
- [ ] 👤 Autoriser : download invoices (inclut les factures Pass + Monthly)
- [ ] 👤 Personnaliser le branding (logo, couleurs TOEIC Arena)
- [ ] 👤 Configurer le **cancellation policy Monthly** : « à la fin de la période en cours » (pas d'effet immédiat, évite les demandes de remboursement au prorata)

### 2.5 Webhooks
- [ ] 🤖 Créer endpoint Vercel `api/stripe-webhook.js`
- [ ] 👤 Dans Stripe → Developers → Webhooks → ajouter endpoint avec URL `https://toeic-arena.vercel.app/api/stripe-webhook` (à adapter)
- [ ] 👤 S'abonner aux events :
  - `checkout.session.completed` (couvre Monthly **et** Pass 3m à la création)
  - `customer.subscription.created` (Monthly uniquement)
  - `customer.subscription.updated` (Monthly uniquement)
  - `customer.subscription.deleted` (Monthly uniquement)
  - `invoice.payment_succeeded` (Monthly renewal)
  - `invoice.payment_failed` (Monthly renewal failed)
  - `charge.refunded` (au cas où tu rembourses manuellement un Pass)
- [ ] 👤 Récupérer le **webhook signing secret** (`whsec_xxxxx`)

### 2.6 Clés API
- [ ] 👤 Récupérer **Secret key test** (`sk_test_xxx`) → Vercel env `STRIPE_SECRET_KEY_TEST`
- [ ] 👤 Récupérer **Secret key live** (`sk_live_xxx`) → Vercel env `STRIPE_SECRET_KEY_LIVE`
- [ ] 👤 Récupérer **Publishable key test** (`pk_test_xxx`) → Vercel env `VITE_STRIPE_PUBLISHABLE_KEY_TEST`
- [ ] 👤 Récupérer **Publishable key live** (`pk_live_xxx`) → Vercel env `VITE_STRIPE_PUBLISHABLE_KEY_LIVE`
- [ ] 👤 **Webhook secret** → Vercel env `STRIPE_WEBHOOK_SECRET`

### 2.7 Emails transactionnels
- [ ] 👤 Stripe → Settings → Emails → activer **receipts automatiques** (confirmation de paiement)
- [ ] 👤 Activer **renewal reminders** pour l'annuel (obligation légale reconduction tacite)
- [ ] 👤 Activer **payment failed emails**
- [ ] 👤 Personnaliser **branding** (logo, couleurs, signature email) — Settings → Branding

---

## 3. 📜 Documents juridiques

### 3.1 CGV
- [x] 🤖 Draft rédigé dans `CGV_draft.md`
- [ ] 🤝 Remplir les `[À COMPLÉTER]` (SIRET, APE, adresse, médiateur)
- [ ] 👤 **Relecture par juriste/avocat** (fortement recommandé)
- [ ] 👤 Publier sur site : URL publique `/cgv` accessible sans authentification
- [ ] 🤖 Lien « CGV » visible depuis : page Upgrade, footer, page paiement, email de bienvenue

### 3.2 Politique de Confidentialité (existante à mettre à jour)
- [ ] 🤝 Audit de la politique actuelle (dans l'app, à retrouver)
- [ ] 🤝 Ajouter finalité : **gestion de l'abonnement et du paiement**
- [ ] 🤝 Ajouter sous-traitants : **Stripe Payments Europe** (prestataire paiement), **Stripe Inc. USA** (transfert données encadré par Clauses Contractuelles Types de la Commission UE)
- [ ] 🤝 Ajouter durée conservation factures : **10 ans** (article L. 123-22 Code de commerce)
- [ ] 🤝 Ajouter base légale : **exécution du contrat** (art. 6.1.b RGPD)
- [ ] 👤 Publier version mise à jour + date
- [ ] 🤖 Re-consent screen pour utilisateurs existants lors de la prochaine connexion

### 3.3 Mentions légales
- [ ] 👤 Vérifier que la page Mentions Légales existe et contient :
  - Identification éditeur (nom, statut, SIRET, adresse, email)
  - Directeur de publication
  - Hébergeur (Vercel + Supabase)
  - Contact

### 3.4 CGU (Conditions Générales d'Utilisation)
- [ ] 👤 Existent-elles déjà séparément ? Sinon, les CGV peuvent y renvoyer mais une CGU distincte est plus propre pour régir aussi les usages Freemium.
- [ ] 🤝 Si absentes, rédiger CGU courtes (usage freemium + premium, comportements interdits, suspension, responsabilité utilisateur)

---

## 4. 🤝 Médiation de la consommation

**Obligation légale** — articles L. 616-1 et R. 616-1 Code de la consommation.

### 4.1 Choix du médiateur
- [ ] 👤 Comparer les 3 principaux (tous agréés CECMC) :
  - **CNPM Médiation Consommation** : ~0€ à 199€/an selon structure, spécialisé TPE/PME (recommandé)
  - **Médicys** : ~0€ initiation + frais par dossier traité
  - **SAS Médiation Solution** : ~150€/an forfait + frais dossier
- [ ] 👤 Vérifier sur https://www.economie.gouv.fr/mediation-conso/mediateurs-references que le médiateur choisi est bien agréé
- [ ] 👤 Signer la convention d'adhésion avec le médiateur retenu
- [ ] 👤 Me fournir : nom du médiateur, adresse postale, URL de saisine → j'update l'article 17 des CGV

### 4.2 Intégration dans le parcours
- [ ] 🤖 Lien « Saisir le médiateur » depuis page Contact / Support de l'app
- [ ] 👤 Dans la signature email de support, ajouter : « En cas de litige non résolu après réclamation écrite préalable, vous pouvez saisir le médiateur [X] »

---

## 5. 🔒 RGPD / Données personnelles

- [ ] 👤 **Registre des traitements** mis à jour (obligation art. 30 RGPD) — ajouter traitement « Gestion abonnements et paiement »
- [ ] 👤 **DPIA** (analyse d'impact) non obligatoire pour paiement simple SaaS, à documenter brièvement
- [ ] 🤝 **Re-consent cookies** : si Stripe dépose des cookies analytics sur le domaine, vérifier que la bannière cookies actuelle les couvre
- [ ] 🤖 **Export des données utilisateur** : vérifier que l'export GDPR existant inclut les données d'abonnement (statut, historique facturation local, mais pas les données Stripe elles-mêmes — renvoi vers Stripe portal)
- [ ] 🤖 **Suppression de compte** : définir quoi faire avec les abonnements actifs lors d'une demande d'effacement → résilier l'abonnement Stripe + anonymiser le compte app + conserver facturation 10 ans (obligation comptable)

---

## 6. 🖥️ Intégration technique

### 6.1 Supabase — Phase 1 & 2
- [ ] 🤖 Activer Supabase Auth (magic link email)
- [ ] 🤖 Configurer templates emails FR/EN (magic link, welcome)
- [ ] 👤 Configurer **domaine custom pour emails Supabase** (sinon risque spam)
  - Acheter/utiliser sous-domaine `mail.toeic-arena.[tld]`
  - Configurer SPF, DKIM, DMARC (doc Supabase)
- [ ] 🤖 Migration SQL : ajouter `students.user_id`, `students.email`, `students.access_level`, `students.access_expires_at timestamptz` (pour le Pass 3 mois)
- [ ] 🤖 Créer tables :
  - `subscriptions` (stripe_customer_id, stripe_subscription_id pour Monthly)
  - `passes` (stripe_customer_id, stripe_payment_intent_id, expires_at pour Pass 3m)
  - `stripe_events` (dedup webhook)
- [ ] 🤖 RLS policies : user lit ses propres subs/passes uniquement
- [ ] 🤖 **Edge Function scheduled** `pass-expiry-reminder` — envoie un email 7 jours avant `access_expires_at` pour inviter à prolonger (obligation art. 8.2 CGV)
- [ ] 🤖 **Edge Function scheduled** `pass-expiry-downgrade` — passe `access_level` à `free` quand `access_expires_at < now()` (run horaire)

### 6.2 Vercel — Phase 3
- [ ] 🤖 Endpoints serverless : `api/stripe-checkout-create.js`, `api/stripe-webhook.js`, `api/stripe-portal-create.js`
- [ ] 👤 Configurer **variables d'environnement** Vercel (cf. section 2.6)
- [ ] 🤖 Vérifier runtime `nodejs` (pas edge) pour les endpoints Stripe — la lib Stripe Node nécessite Node.js

### 6.3 App.jsx — Phase 3 & 4
- [ ] 🤖 Hook `useAccessLevel()` centralisé — retourne `free | premium_monthly | premium_pass | grandfathered`. Prend en compte `access_expires_at` pour le Pass.
- [ ] 🤖 Écran Upgrade avec 2 cartes comparatives :
  - **Monthly** 9,99€/mois, flexible, cancel anytime
  - **TOEIC Pass 3 mois** 22,99€ one-shot, **badge "Best value — save 23%"**, expire auto
  - Le Pass doit être mis en avant (ancre visuelle prioritaire — c'est le produit d'intention)
- [ ] 🤖 Écran « Subscription » dans Profile :
  - Si Monthly actif : statut, next billing date, bouton "Manage via Stripe portal"
  - Si Pass actif : badge "TOEIC Pass — expire le JJ/MM", bouton "Prolonger" ouvrant checkout Pass
  - Si Pass expire dans <7j : mise en avant visuelle douce (pas alarmiste)
- [ ] 🤖 Paywall overlay sur modules premium avec CTA Upgrade
- [ ] 🤖 Banner in-app "Your pass expires in X days" (quand X ≤ 7) avec CTA Prolonger
- [ ] 🤖 Checkout Session mode conditionnel : `subscription` pour Monthly, `payment` pour Pass

---

## 7. 📧 Emails transactionnels

**Qui gère quoi :**
- Stripe envoie : reçu paiement, renewal reminder, payment failed, receipt
- Supabase envoie : magic link
- Nous devons envoyer : welcome premium, cancellation confirmation (optionnel), cutoff IDRAC (Phase 5)

- [ ] 🤖 Template email « Welcome Premium » (après checkout.session.completed) — optionnel, Stripe receipt suffit légalement
- [ ] 🤖 Template email « Cutoff IDRAC » (pour Phase 5, à préparer)
- [ ] 👤 Vérifier deliverability : domaine expéditeur dédié + warmup (envoyer progressivement, pas 66 emails d'un coup au cutoff)

---

## 8. 🎨 UX / Écrans à concevoir

- [ ] 🤝 **Écran Upgrade Premium** : comparaison Free vs Premium, toggle mensuel/annuel, CTA « Continue to payment », mention case à cocher rétractation
- [ ] 🤝 **Écran post-checkout success** : confirmation + 3 boutons « Explore premium features »
- [ ] 🤝 **Écran post-checkout cancel** : « Maybe next time » + lien retour
- [ ] 🤝 **Paywall overlay** : verrou sur modules premium pour utilisateurs Free, CTA Upgrade
- [ ] 🤝 **Écran Subscription dans Profile** : plan actif, next billing date, bouton Manage
- [ ] 🤝 **Écran « Your subscription ended »** : état downgraded après cancel ou payment failed
- [ ] 🤝 **Écran IDRAC cutoff** (Phase 5) : « Your institutional access ended, subscribe to continue » avec preservation progress message

---

## 9. 🧪 Tests & validation (Stripe test mode)

Scenarios à tester exhaustivement avant passage en live :

### 9.1 Parcours nominal
- [ ] Signup magic link → reçoit email → clic → entre dans l'app
- [ ] Free user teste un module premium → paywall → clic Upgrade
- [ ] Stripe Checkout test mode (carte `4242 4242 4242 4242`) → retour app → accès premium déverrouillé

### 9.2 Parcours TOEIC Pass 3 mois
- [ ] Souscription Pass → webhook `checkout.session.completed` reçu → DB : `passes` row créée + `students.access_level=premium_pass` + `access_expires_at=now+90d`
- [ ] Email reçu : Stripe receipt
- [ ] Dans Profile → Subscription : badge "TOEIC Pass — expire le JJ/MM"
- [ ] Re-souscription avant expiration : `access_expires_at` étendu de +90j, pas de double facturation
- [ ] Simulation d'expiration (avance artificielle de `access_expires_at`) : Edge Function downgrade exécute → `access_level=free`, modules premium re-lockés
- [ ] Email de rappel J-7 avant expiration : test de l'Edge Function `pass-expiry-reminder`

### 9.3 Échec de paiement
- [ ] Utiliser carte test `4000 0000 0000 0341` (échec paiement récurrent)
- [ ] Webhook `invoice.payment_failed` reçu
- [ ] Grace period 7 jours → Stripe retry automatique
- [ ] Si échec persiste → subscription deleted → `access_level=free`
- [ ] In-app : message clair, pas de perte de progression

### 9.4 Résiliation
- [ ] User clique « Manage subscription » → redirect Stripe portal
- [ ] Cancel → webhook `customer.subscription.updated` avec `cancel_at_period_end=true`
- [ ] Accès premium maintenu jusqu'à fin de période
- [ ] À date d'expiration → webhook `customer.subscription.deleted` → downgrade

### 9.5 Upgrade / Switch entre formules
- [ ] User Monthly → annule via portal → souscrit Pass 3m le jour suivant → les deux coexistent côté Stripe (subscription canceled + one-time payment) mais côté app `access_level` = le plus avantageux jusqu'à expiration
- [ ] User Pass actif → souscrit Monthly avant expiration du Pass → Monthly start date = `access_expires_at` du Pass (pas de chevauchement facturé)
- [ ] Webhook updated correctement → `access_level` reflète la nouvelle situation

### 9.6 Rétractation
- [ ] Si case non cochée : un user qui demande remboursement dans les 14j est remboursé manuellement via Stripe dashboard
- [ ] Si case cochée : remboursement refusé, message légal pré-rédigé à envoyer

### 9.7 Multi-device
- [ ] Souscription sur desktop → accès premium déverrouillé sur mobile (même compte)
- [ ] Magic link requested from desktop, clicked on mobile → session transférée ou re-auth OK

### 9.8 Edge cases
- [ ] User souscrit 2 fois (double-clic) → Stripe idempotency empêche doublon, vérifier
- [ ] Webhook arrive 2 fois → table `stripe_events` dedup
- [ ] Webhook arrive jamais (timeout) → job de réconciliation quotidien Supabase Edge Function
- [ ] User change d'email → Stripe customer email update via portal
- [ ] User supprime son compte → subscription cancel + données anonymisées

---

## 10. 📢 Communication utilisateurs

### 10.1 Pour les 66 étudiants IDRAC (cutoff juin)
- [ ] 🤝 **Annonce in-app** (banner) 4 semaines avant cutoff : « Votre accès IDRAC prend fin le 28 juin. Vos progrès sont conservés si vous souhaitez continuer. »
- [ ] 🤝 **Push notification** 2 semaines avant cutoff
- [ ] 🤝 **Push notification** jour J+1 : « Your access ended. Continue premium for €4.99/mo »
- [ ] 👤 Message Teams/email direct aux étudiants (pédagogique, pas commercial)

### 10.2 Pour les nouveaux arrivants (post-lancement Stripe)
- [ ] 🤝 Landing page publique (pas en app) présentant les formules — optionnel au démarrage
- [ ] 🤝 Écran onboarding : présenter Freemium d'emblée, Upgrade visible mais non bloquant

### 10.3 Tracking
- [ ] 🤖 Log conversions (freemium → premium) dans Supabase ou Stripe metadata
- [ ] 🤖 Log churn (cancel reasons si user les donne)

---

## 11. 📊 Monitoring & analytics post-launch

- [ ] 👤 Dashboard Stripe : activer les alertes (paiement échoué, nouveau client, MRR)
- [ ] 🤖 Dashboard Teacher : nouvelle section « Monetization » avec :
  - MRR (Monthly recurring) + Pass revenue (non-MRR mais tracké)
  - Mix Monthly / Pass (% de chaque formule sur nouveaux clients)
  - Taux de prolongation Pass (combien de users renouvellent à l'expiration)
  - Paid users count, conversions
- [ ] 👤 Vérifier hebdomadairement durant 1 mois :
  - Taux de réussite paiement (>95% attendu)
  - Taux de conversion paywall → checkout (benchmark : 2-5% pour SaaS freemium)
  - **Répartition Monthly vs Pass** (hypothèse : 60/40 en faveur du Pass)
  - Churn Monthly (<10%/mois en B2C SaaS)
  - Taux de renouvellement Pass à l'expiration (hypothèse : 15-25%)
  - Support tickets liés paiement

---

## 12. 🚨 Plan de rollback

Si problème critique post-launch :
- [ ] 🤖 **Feature flag `STRIPE_ENABLED`** dans l'app → permet de cacher l'upgrade instantanément sans redeploy
- [ ] 👤 Pouvoir **mettre en pause les nouveaux abonnements** depuis Stripe (archiver les prix temporairement)
- [ ] 👤 Avoir un email-type de communication incident prêt
- [ ] 🤖 Backup quotidien Supabase des tables `students`, `subscriptions`, `passes` (via pg_dump scheduled)

---

## 13. 📆 Timeline & checkpoints

| Jalon | Date cible | Statut |
|-------|-----------|--------|
| Formalités admin complètes (SIRET, compte pro, assurance) | 2026-04-30 | ☐ |
| Compte Stripe activé + produits créés | 2026-05-05 | ☐ |
| Médiateur conso signé | 2026-05-10 | ☐ |
| CGV relues par juriste + publiées | 2026-05-15 | ☐ |
| Politique confidentialité à jour | 2026-05-15 | ☐ |
| **Phase 1 livrée** (magic link en prod) | 2026-05-25 | ☐ |
| **Phase 2 livrée** (data model subs) | 2026-05-28 | ☐ |
| **Phase 3 livrée** (Stripe Checkout + webhook test mode) | 2026-06-05 | ☐ |
| Tests exhaustifs passés | 2026-06-08 | ☐ |
| **Phase 4 livrée** (gating) | 2026-06-10 | ☐ |
| **Bascule Stripe LIVE** | 2026-06-10 | ☐ |
| Communication cutoff IDRAC envoyée | 2026-06-14 | ☐ |
| **Phase 5 livrée** (cutoff IDRAC) | 2026-06-28 | ☐ |
| Monitoring post-launch S+1 | 2026-07-05 | ☐ |
| Monitoring post-launch S+4 (stabilisation) | 2026-07-26 | ☐ |

---

## Stripe IDs enregistrés

### Mode TEST (développement)

| Produit | Product ID | Price ID |
|---------|-----------|----------|
| Abonnement Mensuel (9,99€) | `prod_UMyJgqYoNnQAkM` | `price_1TOEMo1D3Hu5MKuqEhw58nx7` |
| TOEIC Pass 3 mois (22,99€) | `prod_UMyQt12EhBQgBW` | `price_1TOETE1D3Hu5MKuqne7WsPvt` |

### Mode LIVE (production — à remplir lors de la bascule finale)

| Produit | Product ID | Price ID |
|---------|-----------|----------|
| Abonnement Mensuel (9,99€) | `prod_________________` | `price_________________` |
| TOEIC Pass 3 mois (22,99€) | `prod_________________` | `price_________________` |

---

## Notes et décisions en attente

- Dénomination commerciale définitive (TOEIC Arena seulement, ou TOEIC Arena by Jérémy Leixa ?)
- Sous-domaine pour emails transactionnels (Supabase magic link + Stripe receipts)
- Médiateur retenu : adhésion CNPM en cours (soumise 2026-04-20)
- Compte bancaire pro : Qonto ouvert ✓
- Ajout tier Pro futur (19,99€ avec coaching IA) ? → TBD post-PMF validation
