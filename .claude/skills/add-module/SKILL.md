---
name: add-module
description: Use this skill whenever Jérémy adds, scaffolds, or extends a training module in TOEIC Arena's App.jsx — new mini-game, drill, sub-module, or module hub. Trigger on phrases like "ajoute un module", "nouveau module", "crée un mini-jeu", "scaffold un sous-module", or any time a new `sp==="X"` route is being introduced. The pattern has a long checklist (BGM wiring, XpToast in pg(), recordModule, applyXpGates, achievements, weight in TOEIC estimator, SELF_MANAGED listing) and forgetting any item produces silent regressions Jérémy has hit multiple times. Always run through this skill before editing App.jsx for a new module.
---

# Add Module — TOEIC Arena

Wiring a new training module into `src/App.jsx` is mechanical but unforgiving: a single missing item (XpToast outside `pg()`, BGM not stopped on back, missing SELF_MANAGED entry, weight absent from TOEIC estimator) produces silent bugs that are painful to diagnose. This skill is the canonical checklist.

## When to use

- New training module / mini-game / drill / sub-module
- New `sp==="X"` route
- New module hub with sub-modules (Gauntlet pattern, Modal Council pattern)
- Replacing a Study Mode with a real module

## Before writing any code

1. **Decide the module ID** — short kebab/camel string used as `sp` value, `recordModule` key, BGM filename suffix, achievement keys. Examples : `tavern`, `gauntlet`, `modals`, `wfall`. Stay consistent across all touchpoints.
2. **Decide if module is SELF_MANAGED for BGM** — if it has its own BGM track and manages start/stop internally (sub-module hubs, multi-phase modules), add to `SELF_MANAGED` array (~line 15156). Otherwise the centralized router controls BGM.
3. **Decide the XP tier** — see CLAUDE.md "Gauntlet XP tier" section. Tier B (15Q modules) = `15 + 5×correct + 35 perfect`. Match peer modules (Tavern 110, SBuilder 95, Gauntlet 125 max).
4. **Decide TOEIC estimator weight** — does this contribute to Listening or Reading section? What weight (e.g. Gauntlet = 0.15 of reading)? Update `estimateTOEICScore(u)` accordingly.

## Checklist — every module

Touchpoints in `App.jsx` to wire (in rough order):

### Routing
- [ ] Add `sp==="<id>"` branch in router. Pattern :
  ```js
  if(sp==="<id>"){playBGM("bgm_<name>");return pg(<Component done={function(sc,tot,xp){stopBGM();handleDone(sc,tot,xp);}} back={function(){stopBGM();sSP(null);sT("<tab>");}}/>);}
  ```
- [ ] If SELF_MANAGED : add to `SELF_MANAGED` array AND don't call `playBGM` in router (component handles it)

### XP pipeline (in `handleDone` or inline)
- [ ] `applyXpGates(baseXp, sc, tot, "<modId>")` — applies accuracy gate (<30% → 10%, 30-49% → 50%, ≥50% → 100%) + diminishing returns
- [ ] `addXp(gatedXp)` — applies XP, triggers level up, plays SFX
- [ ] `recordModule(u, "<modId>", sc, tot, catStats)` — updates `u.moduleScores[modId]` + cumulative stats
- [ ] `grantWeeklyChest(trigger, "novice"|"guerrier"|"champion")` if perfect / milestone

### Toast rendering (CRITICAL — past bug)
- [ ] `<XpToast/>` and `<AchToast/>` MUST render inside the component's `pg()` wrapper, not only in main return. Otherwise XP earned without nav back to home leaves toast undisplayed until 4s timer expires.

### Audio (if listening module)
- [ ] On mount : `useEffect(function(){resumeAudioSession();return stopListenAudio;},[]);`
- [ ] Use `playAudioFile(url)` (checks `_audioAborted`)
- [ ] On unmount or back : `stopListenAudio()` clears the abort flag

### Achievements
- [ ] Add entries in `src/data/achievements.js` (use existing patterns — perfect/streak/total/mastery)
- [ ] Trigger via existing `checkAchievements(u)` flow — usually automatic if `recordModule` is called

### Chest triggers (V2)
- [ ] Module mastery chest fires automatically if total ≥ 50 && correct/total ≥ 0.8 — UNLESS modId is in blacklist (`mock1/2/3, boss, daily, csess`). If your module shouldn't grant mastery chest, add to blacklist.
- [ ] **CRITICAL** : if you add a useEffect watcher tied to a chest trigger, use per-key `useRef` guard. Don't depend on `u.X` (cloned via JSON each `sv()` → infinite re-fires, see `feedback_useeffect_dep_by_ref.md`).

### TOEIC estimator
- [ ] Update `estimateTOEICScore(u)` with the new weight. Recompute Listening or Reading section sum so weights still total 1.0.

### Tile / entry point UI
- [ ] Add tile in Train / Games / Listen-Reading hub. Use unified design (V10 tint) :
  ```js
  background: "linear-gradient(135deg, rgba(var(--cx),.22), transparent)",
  border: "1.5px solid var(--cyan)",
  // icon
  <GIcon name="<icon>" size={42} color="var(--cyan)"/>
  ```
  Add icon path to `GAME_ICON_PATHS` in `src/data/avatarIcons.js` if missing (`https://api.iconify.design/game-icons/NAME.svg`).
- [ ] If freemium-locked : add modId to `FREE_MODULES` list (or leave out). Visitor-locked tiles use `var(--bdr)` border + `var(--t3)` icon.

### BUILD_ID
- [ ] Bump `BUILD_ID` constant near line 369 — date of significant change. Otherwise console logs lie about deployment.

### Back button
- [ ] Use `.back-btn` CSS class with label `← Back`. Never re-inline `style={{background:"none",border:"none"...}}`.

### Data file
- [ ] Create `src/data/<modId>.js` if content needed. Imported by App.jsx at build time (no runtime fetch).
- [ ] Verify content pool size matches CLAUDE.md table — flag deficits to Jérémy.

## After wiring

1. `npm run build` — must pass clean
2. Test locally on `npm run dev`
3. Check console for `[BUILD] <BUILD_ID>` log on load
4. Verify XpToast appears in-context (test : earn XP without navigating back)
5. Verify BGM stops on back, restarts on home if SELF_MANAGED
6. **Don't `git add public/`** files implicitly — explicitly add new MP3s, the `bgm_tavern.mp3` regression cost 30min

## Anti-patterns to refuse

- **Do not split App.jsx.** It's monolithic by design (CLAUDE.md rule). Do not extract the new module into a separate file unless Jérémy explicitly asks.
- **Do not introduce new abstractions** "for future modules". 3 similar modules is better than a premature shared base. Wait until pattern is proven.
- **Do not add daily XP cap or hard time gates.** Anti-farming = diminishing returns per module per day, period.
- **Flashcards-style modules give 0 XP.** Reward goes through a quiz layer (Tavern pattern), not the SRS itself.

## Reference modules (good patterns)

- **Word Tavern** (`sp==="tavern"`) — 15Q quiz, BGM `bgm_tavern`, Tier B XP, dedicated route, no sub-modules
- **Grammar Gauntlet** (`sp==="gauntlet"`) — hub with 4 sub-modules via internal `subMode` state, each with own BGM, single `onModuleDone` callback to App
- **Modal Council** (`sp==="modals"`) — newer hub pattern, tap-to-pair UX, 2 sub-modules sharing one grimoire

When in doubt about an architectural choice, copy the closest existing module's structure.
