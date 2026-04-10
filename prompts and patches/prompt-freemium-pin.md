# TOEIC Arena — Mode Visiteur / Freemium + PIN Auth

## CONTEXTE GÉNÉRAL
TOEIC Arena est une PWA React (Vite) avec un monolithe `src/App.jsx` (~6600 lignes).
Backend : Supabase (table `students`, table `groups`).
L'app fonctionne aujourd'hui par code de classe. On veut :
1. Ouvrir un accès "Découverte" (visiteur) avec modules limités
2. Ajouter un PIN à 4 chiffres optionnel pour protéger les comptes

**RÈGLE CRITIQUE : Les groupes de type "school" ne doivent subir AUCUN changement fonctionnel. Aucun module ne doit être verrouillé pour eux. Le PIN est optionnel pour les comptes existants.**

---

## ARCHITECTURE EXISTANTE (à connaître avant de coder)

### Onboarding
- L'utilisateur entre son nom → on cherche si un compte existe (smart lookup via Supabase)
- Étape "classcode" : input pour le code classe + bouton "Join as Visitor" qui set `classCode = "visitor"`
- Placement Test → résultats → "Enter the Arena" appelle `p.go(name, classCode, score, level)`
- La fonction `fresh(name, classCode)` crée l'objet utilisateur initial

### Données utilisateur
- State principal : `u` (objet avec `classCode`, `xp`, `stats`, `moduleScores`, etc.)
- Sauvegarde via `supabase.from('students').upsert(...)` avec `onConflict: 'name,class_code'`
- `u.classCode` contient le code du groupe (ex: "idrac2026" ou "visitor")

### Navigation modules
- Page "Train" (Training Grounds) : tableau `sections` avec items `{id, n, d, i, bg, lock}`
- Le champ `lock` existe déjà pour les Mock Tests (verrouillage par progression)
- Le rendu des cartes utilise `m.lock` pour l'opacité (.4), le curseur, et l'icône 🔒
- Sous-pages : `ListenHub` (Parts 1-4), `ReadingHub` (Parts 5-7), `Cards` (Flashcards + domaines VOCAB), page Games (mini-jeux)

### Groupes
- Table Supabase `groups` avec colonnes : `code`, `name`, `type` ("school", "pro", "visitor"), etc.
- Le groupe "visitor" existe probablement déjà (code = "visitor", type = "visitor")

---

## PHASE 1 : Constantes et résolution du groupType

### 1A — Constante FREE_MODULES
Ajouter en haut de App.jsx, dans la zone des constantes globales (chercher `TEACHER_CODE` ou `weekId` comme repères) :

```js
var FREE_MODULES = ["daily","drill","csess","sbuild","lisP2","stratquiz","strats","gramref","wfall"];
var FREE_FLASHCARD_DOMAINS = ["business","travel","office"];
```

Modules gratuits :
- `daily` = Daily Challenge
- `drill` = Part 5 Drill
- `csess` = Flashcard Review (limité à 3 domaines sur 18)
- `sbuild` = Sentence Builder
- `lisP2` = Listening Part 2 Q&A
- `stratquiz` = Strategy Quiz
- `strats` = Strategy Cards
- `gramref` = Grammar Reference
- `wfall` = Word Fall (mini-jeu fun, bon pour la rétention)

### 1B — Fonction utilitaire
Ajouter près des autres fonctions helpers :

```js
function isModuleLocked(moduleId, gType) {
  if (gType !== "visitor") return false;
  return FREE_MODULES.indexOf(moduleId) === -1;
}
```

### 1C — State groupType au niveau App
Dans le composant principal (celui qui gère le state `u`), ajouter un state :

```js
var [groupType, setGroupType] = useState("school");
```

Default = "school" pour que le comportement par défaut soit "tout déverrouillé" (sécurité).

### 1D — Résolution du groupType au chargement
Il y a deux moments où l'utilisateur est chargé :
1. **Au login/restore** (quand on récupère les données depuis Supabase ou localStorage)
2. **À la création** (quand `fresh()` est appelé après le placement test)

Dans les DEUX cas, après avoir obtenu le `classCode` de l'utilisateur, résoudre le type :

```js
// Si classCode === "visitor", on sait déjà
if (loadedClassCode === "visitor") {
  setGroupType("visitor");
} else {
  // Lookup dans la table groups
  supabase.from('groups').select('type').eq('code', loadedClassCode).maybeSingle()
    .then(function(res) {
      setGroupType((res.data && res.data.type) || "school");
    });
}
```

**IMPORTANT** : S'assurer que `groupType` est passé en prop à TOUS les composants qui en ont besoin : `Train`, `ListenHub`, `ReadingHub`, `Cards` (flashcards), la page Games, et le composant qui gère les Mock Tests.

---

## PHASE 2 : Verrouillage dans Training Grounds (Train)

### 2A — Passer groupType à Train
Train reçoit déjà des props (`p`). Ajouter `groupType` aux props passées :
Chercher l'appel `<Train .../>` et ajouter `groupType={groupType}`.

### 2B — Appliquer le verrouillage après construction du tableau sections
Dans la fonction `Train(p)`, APRÈS la définition complète du tableau `sections` (qui inclut Exercises, Grammar & Vocabulary, Mock Exam, Tips & Strategies) et AVANT le `return(...)`, ajouter :

```js
// Verrouillage visiteur
if (p.groupType === "visitor") {
  sections.forEach(function(sec) {
    sec.items.forEach(function(m) {
      if (isModuleLocked(m.id, p.groupType)) {
        m.visitorLocked = true;
      }
    });
  });
}
```

### 2C — Modifier le rendu des cartes module
Chercher le `.map()` qui rend chaque item de module dans Train. Le code actuel ressemble à :
```
<div key={m.id} className="crd" onClick={function(){if(!m.lock)p.nav(m.id);}}
  style={{...opacity:m.lock?.4:1...}}>
```

Remplacer par :

```jsx
<div key={m.id} className="crd"
  onClick={function(){
    if (m.visitorLocked) { p.onPremium(m.n); return; }
    if (!m.lock) p.nav(m.id);
  }}
  style={{
    display:"flex", alignItems:"center", gap:14,
    cursor: (m.lock || m.visitorLocked) ? "default" : "pointer",
    opacity: m.lock ? .4 : m.visitorLocked ? .55 : 1,
    padding:"14px 16px",
    animation:"fadeIn .3s ease-out",
    animationDelay:(ai*.04)+"s",
    animationFillMode:"both"
  }}>
  <div style={{width:42, height:42, borderRadius:12,
    background: m.visitorLocked ? "var(--bg3)" : m.bg,
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:20, flexShrink:0}}>
    {m.i}
  </div>
  <div style={{flex:1, minWidth:0}}>
    <div className="out" style={{fontWeight:700, fontSize:14, marginBottom:1}}>{m.n}</div>
    <div style={{fontSize:11, color: m.visitorLocked ? "var(--gold)" : "var(--t3)"}}>
      {m.visitorLocked ? "Arena Premium" : m.d}
    </div>
  </div>
  {m.visitorLocked
    ? <span style={{fontSize:14, color:"var(--gold)"}}>🔒</span>
    : m.lock
      ? <span style={{fontSize:16}}>🔒</span>
      : <span style={{fontSize:16, color:"var(--cyan)"}}>→</span>}
</div>
```

### 2D — Prop onPremium et modal Premium
Dans le composant parent qui appelle `<Train>`, ajouter un state et passer le callback :

```js
var [premiumPrompt, setPremiumPrompt] = useState(null);
```

Passer `onPremium={function(name){setPremiumPrompt(name);}}` à Train, ListenHub, ReadingHub, Cards, et la page Games.

Rendre le modal (dans le JSX du composant principal, à la fin, juste avant la fermeture du dernier `</div>`) :

```jsx
{premiumPrompt && (
  <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:9999,
    display:"flex", alignItems:"center", justifyContent:"center", padding:24}}
    onClick={function(){ setPremiumPrompt(null); }}>
    <div style={{background:"var(--bg1)", borderRadius:20, padding:28, maxWidth:340,
      textAlign:"center", animation:"fadeIn .3s", border:"1px solid var(--bdr)"}}
      onClick={function(e){ e.stopPropagation(); }}>
      <div style={{fontSize:48, marginBottom:12}}>🏰</div>
      <h3 className="out" style={{fontWeight:800, fontSize:20, marginBottom:8, color:"var(--gold)"}}>
        Arena Premium
      </h3>
      <p style={{color:"var(--t2)", fontSize:13, lineHeight:1.6, marginBottom:16}}>
        <strong style={{color:"var(--t1)"}}>{premiumPrompt}</strong> is available with Arena Premium or through your school.
      </p>
      <p style={{color:"var(--t3)", fontSize:12, lineHeight:1.5, marginBottom:20}}>
        If your teacher gave you a class code, go to Settings → Change Group to unlock all modules.
      </p>
      <button className="btn1" onClick={function(){ setPremiumPrompt(null); }}
        style={{width:"100%", fontSize:14}}>Got it</button>
    </div>
  </div>
)}
```

---

## PHASE 3 : Verrouillage des sous-pages

### 3A — Listening Hub
Dans `ListenHub`, passer `groupType` et `onPremium` en props.
Les 4 items (lisP1, lisP2, lisP3, lisP4) sont rendus comme des `.crd` divs.
Pour chaque item, vérifier `isModuleLocked(moduleId, p.groupType)`.
- `lisP2` → libre
- `lisP1`, `lisP3`, `lisP4` → verrouillé pour les visiteurs

Appliquer le même traitement visuel que dans Train (opacité .55, background "var(--bg3)", cadenas doré, description "Arena Premium", onClick → onPremium).

### 3B — Reading Hub
Dans `ReadingHub`, passer `groupType` et `onPremium`.
Le Reading Hub contient des liens vers Part 5 (drill), Part 6 (p6), Part 7 (p7).
- `drill` → libre
- `p6`, `p7` → verrouillé pour visiteurs

Même traitement visuel.

### 3C — Flashcards (Cards)
Dans la fonction `Cards`, passer `groupType` et `onPremium`.

Pour le comptage des cartes "due" en haut, si visiteur, ne compter que les cartes des domaines gratuits :
```js
var visibleDomains = p.groupType === "visitor"
  ? VOCAB.filter(function(d){ return FREE_FLASHCARD_DOMAINS.indexOf(d.id) !== -1; })
  : VOCAB;
```

Dans le `.map()` sur les domaines VOCAB, pour les domaines non gratuits en mode visiteur :
- Opacité .55, background neutralisé
- Au clic → `p.onPremium(dom.name + " Flashcards")`
- Cadenas doré au lieu de la barre de progression
- Sous-titre "Arena Premium" au lieu de "X/Y mastered"

Les domaines gratuits fonctionnent normalement.

### 3D — Mini Games
La page Games affiche les mini-jeux dans des `.crd` divs.
Passer `groupType` et `onPremium`.
- `sbuild` → libre
- `wfall` → libre
- `ablitz` → verrouillé pour visiteurs
- `clue` → verrouillé pour visiteurs
- `duel` → verrouillé pour visiteurs

Même traitement visuel (opacité, cadenas, "Arena Premium", onClick → onPremium).

### 3E — Mock Tests
Les Mock Tests sont dans le tableau `sections` de `Train`, dans la section "Mock Exam".
Le verrouillage visiteur (Phase 2B) s'applique déjà via `isModuleLocked("mock1", ...)` etc.
MAIS les IDs des mocks sont "mock1", "mock2", "mock3" qui ne sont PAS dans FREE_MODULES, donc ils seront verrouillés automatiquement. ✓

Pour le Boss Test : s'il apparaît dans un menu (chercher "boss" ou "Final Arena"), appliquer le même verrouillage.

---

## PHASE 4 : Modification de l'onboarding

### 4A — Retirer le placeholder "idrac2026"
Chercher TOUTES les occurrences littérales de :
- `placeholder="e.g. idrac2026"` → remplacer par `placeholder="Code from your teacher"`
- `placeholder="idrac2026"` → remplacer par `placeholder="Class code"`

Il y en a au moins 2 : une dans l'écran "classcode" et une dans l'écran "recover".

### 4B — Améliorer le texte d'accueil visiteur
Dans l'écran "classcode", le texte dit actuellement "Enter the class code given by your teacher, or join as a visitor."

Remplacer par :
```
"Enter the class code given by your teacher to unlock all modules, or discover TOEIC Arena for free."
```

Le bouton "🌍 Join as Visitor" → renommer en "🌍 Discover for Free"

Le texte de confirmation visiteur dit "If your teacher gave you a class code, use it above — otherwise your progress won't appear in your group!"

Remplacer par :
```
"Free access includes 8 training modules. All modules are unlocked with a class code from your school."
```

Le bouton "Continue as Visitor" → renommer en "Start Free Discovery"

---

## PHASE 5 : PIN à 4 chiffres (authentification légère)

### 5A — Colonne Supabase
Exécuter ce SQL dans Supabase (le développeur le fera manuellement) :
```sql
ALTER TABLE students ADD COLUMN IF NOT EXISTS pin TEXT DEFAULT NULL;
```

Ajouter un commentaire dans le code rappelant que cette colonne est nécessaire.

### 5B — Proposition du PIN à la création de compte (visiteurs)
Dans le flow d'onboarding, APRÈS le placement test et ses résultats, AVANT "Enter the Arena" :
Ajouter une étape intermédiaire **uniquement pour les visiteurs** (`classCode === "visitor"`).

Nouvel écran "secure" entre "results" et "Enter the Arena" :

```jsx
// ─ PIN setup (visitors only) ─
if (step === "secure") return (
  <div className="app" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
    <div style={{animation:"fadeIn .5s"}}>
      <div style={{fontSize:48, marginBottom:16}}>🔐</div>
      <h2 className="out" style={{fontWeight:800, fontSize:22, marginBottom:8}}>Protect Your Progress</h2>
      <p style={{color:"var(--t2)", fontSize:13, marginBottom:24, lineHeight:1.6}}>
        Set a 4-digit PIN to secure your account. You'll need it to log back in.
      </p>
      <div style={{display:"flex", gap:8, justifyContent:"center", marginBottom:24}}>
        {[0,1,2,3].map(function(i){
          return <input key={i} type="tel" maxLength={1} inputMode="numeric"
            value={pin[i] || ""}
            onChange={function(e){
              var v = e.target.value.replace(/\D/g,"");
              var np = pin.split("");
              np[i] = v;
              setPin(np.join(""));
              if (v && i < 3) {
                var next = e.target.parentElement.children[i+1];
                if (next) next.focus();
              }
            }}
            style={{width:48, height:56, textAlign:"center", fontSize:24, fontWeight:800,
              background:"var(--bg2)", border:"1px solid var(--bdr)", borderRadius:12,
              color:"var(--t1)", fontFamily:"'DM Sans',sans-serif", outline:"none"}} />;
        })}
      </div>
      <button className="btn1" onClick={function(){
        if (pin.length === 4) { playArenaCall(); p.go(name.trim(), classCode||'visitor', sc, lvl, pin); }
      }} style={{opacity: pin.length===4?1:.4, pointerEvents: pin.length===4?"auto":"none",
        fontSize:18, padding:"16px 32px", marginBottom:12}}>
        Enter the Arena
      </button>
      <button onClick={function(){ playArenaCall(); p.go(name.trim(), classCode||'visitor', sc, lvl, null); }}
        style={{background:"none", border:"none", color:"var(--t3)", fontSize:13, cursor:"pointer"}}>
        Skip — I'll set it later
      </button>
    </div>
  </div>
);
```

State nécessaire dans l'onboarding :
```js
var [pin, setPin] = useState("");
```

Modifier le flow : quand l'utilisateur finit le placement test :
- Si `classCode === "visitor"` → aller à step "secure" (PIN)
- Si classCode est un groupe école → aller directement à "results" puis "Enter the Arena" (pas de PIN)

### 5C — Sauvegarder le PIN
Modifier la fonction `p.go()` (ou son équivalent) pour accepter un paramètre `pin` optionnel.
Dans l'upsert Supabase qui sauvegarde le nouveau compte, ajouter le champ `pin` :

```js
// Dans l'objet upsert, ajouter :
pin: pinValue || null,
```

### 5D — Demander le PIN à la reconnexion
Dans le smart onboarding, quand on retrouve des comptes existants et que l'utilisateur en sélectionne un pour le récupérer :

Avant de restaurer le compte, vérifier si le compte a un PIN :
```js
var accRes = await supabase.from('students').select('pin').eq('name', name).eq('class_code', classCode).maybeSingle();
if (accRes.data && accRes.data.pin) {
  // Afficher un écran de saisie du PIN
  setPendingRecover({name, classCode});
  setStep("enterpin");
  return;
}
// Pas de PIN → restaurer directement (comportement actuel)
```

Nouvel écran "enterpin" :
```jsx
if (step === "enterpin") return (
  <div className="app" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
    <div style={{animation:"fadeIn .5s"}}>
      <div style={{fontSize:48, marginBottom:16}}>🔐</div>
      <h2 className="out" style={{fontWeight:800, fontSize:22, marginBottom:8}}>Enter Your PIN</h2>
      <p style={{color:"var(--t2)", fontSize:13, marginBottom:24}}>
        This account is protected. Enter your 4-digit PIN.
      </p>
      <div style={{display:"flex", gap:8, justifyContent:"center", marginBottom:8}}>
        {/* Même 4 inputs que dans l'écran "secure" */}
      </div>
      {pinError && <p style={{color:"var(--red)", fontSize:12, marginBottom:8}}>Wrong PIN. Try again.</p>}
      <button className="btn1" onClick={async function(){
        var res = await supabase.from('students').select('pin').eq('name', pendingRecover.name).eq('class_code', pendingRecover.classCode).maybeSingle();
        if (res.data && res.data.pin === pin) {
          // PIN correct → restaurer le compte
          await p.recover(pendingRecover.name, pendingRecover.classCode);
        } else {
          setPinError(true);
          setPin("");
        }
      }} style={{opacity:pin.length===4?1:.4, pointerEvents:pin.length===4?"auto":"none"}}>
        Unlock
      </button>
      <button onClick={function(){setStep("name"); setPin(""); setPinError(false);}}
        style={{marginTop:16, background:"none", border:"none", color:"var(--t3)", fontSize:13, cursor:"pointer"}}>
        Back
      </button>
    </div>
  </div>
);
```

States nécessaires :
```js
var [pendingRecover, setPendingRecover] = useState(null);
var [pinError, setPinError] = useState(false);
```

### 5E — Gestion du PIN dans les Settings
Dans la page profil/settings, ajouter une option "Change PIN" / "Set PIN" :
- Si l'utilisateur n'a pas de PIN → bouton "Set a PIN"
- Si l'utilisateur a un PIN → bouton "Change PIN"
Au clic, afficher un mini-formulaire avec 4 inputs (même style que l'onboarding).
Sauvegarder via : `supabase.from('students').update({pin: newPin}).eq('name', u.name).eq('class_code', u.classCode)`

---

## PHASE 6 : Supabase — Créer le groupe visitor (si pas déjà fait)

Vérifier que le groupe "visitor" existe dans la table `groups`. Si non, l'insérer :
```sql
INSERT INTO groups (code, name, type) VALUES ('visitor', 'Free Discovery', 'visitor')
ON CONFLICT (code) DO NOTHING;
```

---

## CHECKLIST DE VALIDATION

Après implémentation, vérifier :

- [ ] Un nouveau visiteur peut s'inscrire sans code classe
- [ ] Le placeholder "idrac2026" n'apparaît NULLE PART
- [ ] Le visiteur voit les 8 modules gratuits déverrouillés
- [ ] Le visiteur voit les modules premium avec cadenas doré et "Arena Premium"
- [ ] Le clic sur un module verrouillé affiche la modal Premium (pas d'erreur)
- [ ] Les Flashcards montrent 3 domaines libres + les autres verrouillés
- [ ] Le Listening Hub montre Part 2 libre + Parts 1/3/4 verrouillées
- [ ] Les Mock Tests sont verrouillés pour les visiteurs
- [ ] La gamification fonctionne normalement (XP, streaks, achievements) sur les modules gratuits
- [ ] Le PIN est proposé aux nouveaux visiteurs
- [ ] Le PIN est demandé à la reconnexion d'un compte protégé
- [ ] **CRITIQUE** : Un étudiant idrac2026 voit TOUS les modules déverrouillés, aucun cadenas, aucun changement
- [ ] **CRITIQUE** : Le dashboard teacher fonctionne normalement
- [ ] Aucune régression sur les hooks React (tous les hooks avant les returns conditionnels)

---

## NOTES TECHNIQUES IMPORTANTES

- **Hooks React** : tous les `useState`/`useEffect`/`useMemo` doivent être AVANT tout `return` conditionnel. C'est une source fréquente de bugs dans cette codebase.
- **Pas de str_replace fragile** : pour les changements multi-points, préférer un script .cjs Node qui lit le fichier, applique les transformations, et le réécrit.
- **Tester le default** : `groupType` doit être initialisé à `"school"` (pas `"visitor"`) pour que si la requête Supabase échoue, l'utilisateur ait l'accès complet plutôt que restreint.
- **CSS `.crd` class** : attention, cette classe force `background: var(--bg2)`. Pour les modules verrouillés avec un background personnalisé (type `var(--bg3)`), il peut être nécessaire d'ajouter un style inline qui override.
