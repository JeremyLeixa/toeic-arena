// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { CGV_VERSION, CGV_EFFECTIVE_DATE, CGV_ARTICLES } from "../data/cgv.js";

// ─── PRIVACY POLICY ───
export function PrivacyPolicy(p){
  var sections=[
    {t:"1. Responsable du traitement",c:"J\u00e9r\u00e9my LEIXA, formateur en anglais (Entrepreneur Individuel \u2014 SIRET 830 200 556 00025).\nContact\u00a0: leixa.formation@gmail.com"},
    {t:"2. Donn\u00e9es collect\u00e9es",c:"Pr\u00e9nom ou pseudonyme, code classe, scores et progression par module, temps d'entra\u00eenement cumul\u00e9, \u00e9tats de r\u00e9vision des flashcards, r\u00e9sultats aux tests blancs, avatar choisi, pr\u00e9f\u00e9rence de th\u00e8me.\n\nSi vous souscrivez un abonnement payant\u00a0: email (obligatoire pour le lien magique et la facturation), identifiant client Stripe, historique d'abonnement (formule, dates de d\u00e9but/fin, statut), historique de factures.\n\nAucune donn\u00e9e de carte bancaire n'est collect\u00e9e ni stock\u00e9e par Verse Arena\u00a0: elle est g\u00e9r\u00e9e exclusivement par Stripe, au standard PCI-DSS. Aucune donn\u00e9e de localisation."},
    {t:"3. Base l\u00e9gale",c:"Int\u00e9r\u00eat l\u00e9gitime p\u00e9dagogique (article 6.1.f du RGPD) pour le suivi de la progression des apprenants dans le cadre d'une formation. Consentement explicite recueilli lors de la cr\u00e9ation du profil.\n\nPour les donn\u00e9es de paiement\u00a0: ex\u00e9cution du contrat (article 6.1.b du RGPD) et obligations comptables l\u00e9gales (article 6.1.c)."},
    {t:"4. Finalit\u00e9s",c:"\u2022 Suivi p\u00e9dagogique individuel et collectif\n\u2022 Classements et gamification\n\u2022 Personnalisation des exercices et recommandations\n\u2022 Rapport hebdomadaire au responsable p\u00e9dagogique\n\u2022 Gestion des paiements et abonnements (souscription Premium)\n\u2022 \u00c9mission et conservation des factures (obligation comptable)\n\u2022 R\u00e8glement amiable des litiges (m\u00e9diation de la consommation)"},
    {t:"5. Destinataires",c:"Votre formateur (acc\u00e8s au tableau de bord enseignant), le responsable p\u00e9dagogique (rapports agr\u00e9g\u00e9s). Aucune donn\u00e9e n'est vendue ou transmise \u00e0 des tiers \u00e0 des fins commerciales.\n\nPour les abonnements payants\u00a0: Stripe (en tant que sous-traitant, cf. section 6) et, le cas \u00e9ch\u00e9ant, le m\u00e9diateur de la consommation (uniquement en cas de litige soumis par vous)."},
    {t:"6. Sous-traitants",c:"\u2022 Supabase Inc. (h\u00e9bergement base de donn\u00e9es, authentification \u2014 serveurs UE/US).\n\u2022 Vercel Inc. (h\u00e9bergement de l'application).\n\u2022 Google Fonts (polices de caract\u00e8res \u2014 votre navigateur contacte les serveurs Google pour t\u00e9l\u00e9charger les polices).\n\u2022 Stripe Payments Europe, Ltd (traitement des paiements, \u00e9mission des factures, gestion des abonnements \u2014 soci\u00e9t\u00e9 de droit irlandais, conformit\u00e9 PCI-DSS). Les donn\u00e9es de carte bancaire sont collect\u00e9es et stock\u00e9es directement par Stripe, jamais par Verse Arena."},
    {t:"7. Dur\u00e9e de conservation",c:"Donn\u00e9es p\u00e9dagogiques\u00a0: conserv\u00e9es pendant la dur\u00e9e de la formation, puis supprim\u00e9es \u00e0 la fin de l'ann\u00e9e scolaire ou sur demande. Les snapshots hebdomadaires sont conserv\u00e9s 12 mois maximum.\n\nDonn\u00e9es de facturation et pi\u00e8ces comptables\u00a0: conserv\u00e9es dix (10) ans \u00e0 compter de la cl\u00f4ture de l'exercice, conform\u00e9ment \u00e0 l'article L.123-22 du Code de commerce.\n\nDonn\u00e9es d'abonnement actif\u00a0: conserv\u00e9es pendant toute la dur\u00e9e de la relation contractuelle."},
    {t:"8. Vos droits (RGPD Art. 15-20)",c:"Acc\u00e8s\u00a0: consultez votre profil \u00e0 tout moment.\nPortabilit\u00e9\u00a0: exportez vos donn\u00e9es en JSON depuis votre profil.\nRectification\u00a0: modifiez votre avatar et pr\u00e9f\u00e9rences dans le profil.\nEffacement\u00a0: supprimez votre compte et toutes vos donn\u00e9es depuis le profil (hors pi\u00e8ces comptables conserv\u00e9es 10 ans par obligation l\u00e9gale).\nPour toute demande\u00a0: leixa.formation@gmail.com"},
    {t:"9. Stockage local",c:"L'application stocke une copie de votre profil dans le localStorage de votre navigateur pour un acc\u00e8s hors-ligne. Ces donn\u00e9es sont supprim\u00e9es lorsque vous supprimez votre compte."},
    {t:"10. Cookies",c:"Verse Arena n'utilise aucun cookie publicitaire ni traqueur. Seul le stockage local du navigateur (localStorage) est utilis\u00e9 pour la persistance de session. Stripe peut poser ses propres cookies techniques sur la page de paiement (strictement n\u00e9cessaires au fonctionnement du checkout, exemption CNIL)."},
    {t:"11. Notifications push",c:"Optionnelles. Vous pouvez les activer ou d\u00e9sactiver \u00e0 tout moment dans votre profil. L'abonnement push est stock\u00e9 c\u00f4t\u00e9 serveur et supprim\u00e9 lors de la d\u00e9sactivation ou de la suppression du compte."},
    {t:"12. Mise \u00e0 jour",c:"Cette politique peut \u00eatre mise \u00e0 jour. La date de derni\u00e8re modification est indiqu\u00e9e ci-dessous. Derni\u00e8re mise \u00e0 jour\u00a0: 24 avril 2026 \u2014 ajout de Stripe comme sous-traitant pour la gestion des paiements."},
  ];
  return(<div style={{maxWidth:480,margin:"0 auto",padding:"24px 16px",maxHeight:"85vh",overflow:"auto"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
      <h2 className="out" style={{fontWeight:800,fontSize:20,margin:0}}>{"Politique de confidentialit\u00e9"}</h2>
      {p.onClose&&<button onClick={p.onClose} style={{background:"none",border:"none",color:"var(--t3)",fontSize:22,cursor:"pointer",padding:4,lineHeight:1}}>{"\u00d7"}</button>}
    </div>
    {sections.map(function(s,i){return(<div key={i} style={{marginBottom:18}}>
      <h3 className="out" style={{fontWeight:700,fontSize:14,color:"var(--cyan)",marginBottom:6}}>{s.t}</h3>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.7,margin:0,whiteSpace:"pre-line"}}>{s.c}</p>
    </div>);})}
    {p.onClose&&<button className="btn2" onClick={p.onClose} style={{width:"100%",fontSize:14,marginTop:8,marginBottom:24}}>{"\u2190 Retour"}</button>}
  </div>);
}
// ─── MÉDIATION DE LA CONSOMMATION ───
// Obligation légale (art. L616-1 Code de la consommation) : communiquer au
// consommateur les coordonnées du médiateur + procédure de saisine. Convention
// signée avec MÉDIATION CONSOMMATION DÉVELOPPEMENT (Saint-Étienne), numéro
// d'adhérent MED60239, référencée CECMC, durée 3 ans à compter de la signature
// (20/04/2026).
//
// Le bloc d'information principal (mandatoryText + mandatoryPostalBlock)
// est imposé verbatim par MCD — ne pas reformuler, ne pas fragmenter.
// Les sections complémentaires (plateforme RLL, infos légales) restent
// paramétrables côté app.
export function MediationInfo(p){
  var mandatoryText="Si vous n'\u00eates pas parvenu \u00e0 r\u00e9soudre votre litige apr\u00e8s nous avoir adress\u00e9 une r\u00e9clamation \u00e9crite (courrier ou courriel), dat\u00e9e, rappelant les circonstances qui ont donn\u00e9 lieu au diff\u00e9rend et ce que vous r\u00e9clamez, vous pourrez saisir le m\u00e9diateur de la consommation, d\u00e9sign\u00e9 ci-dessous, si vous avez re\u00e7u une r\u00e9ponse \u00e9crite n\u00e9gative de notre part ou pas de r\u00e9ponse deux mois apr\u00e8s l'envoi de votre r\u00e9clamation.\n\nConform\u00e9ment aux articles L.616-1 et R.616-1 du code de la consommation, notre soci\u00e9t\u00e9 a mis en place un dispositif de m\u00e9diation de la consommation. L'entit\u00e9 de m\u00e9diation retenue est\u00a0: SAS M\u00c9DIATION CONSOMMATION D\u00c9VELOPPEMENT. En cas de litige, tout consommateur pourra d\u00e9poser sa r\u00e9clamation sur le site\u00a0:";
  var mandatoryPostalBlock="ou par voie postale en \u00e9crivant \u00e0\u00a0:\n\nM\u00c9DIATION CONSOMMATION D\u00c9VELOPPEMENT\nC/O Centre d'Affaires St\u00e9phanois SAS - Immeuble l'Horizon - Esplanade de France - 3 rue J. Constant Milleret - 42000 SAINT-ETIENNE";
  var extraSections=[
    {t:"Informations compl\u00e9mentaires",
      c:"\u2022 Num\u00e9ro d'adh\u00e9rent\u00a0: MED60239\n\u2022 Convention sign\u00e9e le 20 avril 2026 pour une dur\u00e9e de trois ans, enregistr\u00e9e aupr\u00e8s de la CECMC (Commission d'\u00c9valuation et de Contr\u00f4le de la M\u00e9diation de la Consommation).\n\u2022 Gratuit\u00e9\u00a0: la proc\u00e9dure est enti\u00e8rement gratuite pour vous, les frais sont pris en charge par Verse Arena.\n\u2022 D\u00e9lai\u00a0: le m\u00e9diateur rend son avis dans un d\u00e9lai maximum de 90 jours \u00e0 compter de sa saisine, prorogeable en cas de litige complexe.\n\u2022 Confidentialit\u00e9\u00a0: les \u00e9changes en m\u00e9diation sont soumis \u00e0 une obligation de confidentialit\u00e9 absolue (art. 21-3 loi n\u00b0 95-125 du 8 f\u00e9vrier 1995).\n\u2022 D\u00e9lai de saisine\u00a0: votre demande doit intervenir dans un d\u00e9lai d'un an \u00e0 compter de votre r\u00e9clamation initiale aupr\u00e8s de notre service client (leixa.formation@gmail.com)."},
    {t:"Plateforme europ\u00e9enne (RLL)",
      c:"Si vous r\u00e9sidez dans un autre \u00c9tat membre de l'Union europ\u00e9enne, vous pouvez \u00e9galement recourir \u00e0 la plateforme europ\u00e9enne de R\u00e8glement en Ligne des Litiges mise en place par la Commission europ\u00e9enne\u00a0:\nhttps://ec.europa.eu/consumers/odr/\n\nCette plateforme permet de rechercher un organisme de r\u00e8glement extrajudiciaire comp\u00e9tent et de d\u00e9poser une demande en ligne."},
    {t:"Information l\u00e9gale",
      c:"Professionnel\u00a0: J\u00e9r\u00e9my LEIXA \u2014 SIRET 830 200 556 00025 \u2014 Code APE 85.59B (Formation continue d'adultes).\n\nConform\u00e9ment aux articles L.616-1 et R.616-1 du Code de la consommation."}
  ];
  return(<div style={{maxWidth:480,margin:"0 auto",padding:"24px 16px",maxHeight:"85vh",overflow:"auto"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
      <h2 className="out" style={{fontWeight:800,fontSize:20,margin:0}}>{"M\u00e9diation de la consommation"}</h2>
      {p.onClose&&<button onClick={p.onClose} style={{background:"none",border:"none",color:"var(--t3)",fontSize:22,cursor:"pointer",padding:4,lineHeight:1}}>{"\u00d7"}</button>}
    </div>
    {/* Bloc imposé verbatim par l'entité de médiation — ne pas reformuler. */}
    <div style={{marginBottom:22}}>
      <p style={{fontSize:13,color:"var(--t1)",lineHeight:1.7,margin:"0 0 14px",whiteSpace:"pre-line"}}>{mandatoryText}</p>
      <p style={{fontSize:14,fontWeight:700,margin:"0 0 14px",textAlign:"center"}}>
        <a href="https://www.medconsodev.eu" target="_blank" rel="noopener noreferrer" style={{color:"var(--cyan)",wordBreak:"break-all"}}>https://www.medconsodev.eu</a>
      </p>
      <p style={{fontSize:13,color:"var(--t1)",lineHeight:1.7,margin:0,whiteSpace:"pre-line"}}>{mandatoryPostalBlock}</p>
    </div>
    <div style={{height:1,background:"var(--bdr)",margin:"22px 0"}}/>
    {extraSections.map(function(s,i){return(<div key={i} style={{marginBottom:18}}>
      <h3 className="out" style={{fontWeight:700,fontSize:14,color:"var(--cyan)",marginBottom:6}}>{s.t}</h3>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.7,margin:0,whiteSpace:"pre-line"}}>{s.c}</p>
    </div>);})}
    {p.onClose&&<button className="btn2" onClick={p.onClose} style={{width:"100%",fontSize:14,marginTop:8,marginBottom:24}}>{"\u2190 Retour"}</button>}
  </div>);
}
// ─── CGV — Conditions Générales de Vente ───
// Rendue in-app au moment du checkout (art. L.221-5 Code de la conso :
// obligation d'information pré-contractuelle). Contenu dans src/data/cgv.js,
// source canonique archivée dans CGV_draft.md à la racine du repo.
export function CGVPage(p){
  return(<div style={{maxWidth:480,margin:"0 auto",padding:"24px 16px",maxHeight:"85vh",overflow:"auto"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
      <h2 className="out" style={{fontWeight:800,fontSize:20,margin:0}}>{"Conditions G\u00e9n\u00e9rales de Vente"}</h2>
      {p.onClose&&<button onClick={p.onClose} style={{background:"none",border:"none",color:"var(--t3)",fontSize:22,cursor:"pointer",padding:4,lineHeight:1}}>{"\u00d7"}</button>}
    </div>
    <div style={{fontSize:11,color:"var(--t3)",marginBottom:20,fontStyle:"italic"}}>
      {"Version "+CGV_VERSION+" \u00b7 entr\u00e9e en vigueur le "+CGV_EFFECTIVE_DATE}
    </div>
    {CGV_ARTICLES.map(function(a,i){return(<div key={a.id} style={{marginBottom:18}}>
      <h3 className="out" style={{fontWeight:700,fontSize:14,color:"var(--cyan)",marginBottom:6}}>{a.title}</h3>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.7,margin:0,whiteSpace:"pre-line"}}>{a.body}</p>
    </div>);})}
    {p.onClose&&<button className="btn2" onClick={p.onClose} style={{width:"100%",fontSize:14,marginTop:8,marginBottom:24}}>{"\u2190 Retour"}</button>}
  </div>);
}
