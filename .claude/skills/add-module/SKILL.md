---
name: add-module
description: Use this skill whenever Jérémy adds, scaffolds, or extends a training module in TOEIC Arena — new mini-game, drill, sub-module, or module hub. Trigger on phrases like "ajoute un module", "nouveau module", "crée un mini-jeu", "scaffold un sous-module", or any time a new `sp==="X"` route is being introduced. The pattern has a long checklist spread over several files since the 2026-09-15 split (feature file, routes.jsx, App() XP pipeline, hub tile, lib/toeic.js weight, SELF_MANAGED listing) and forgetting any item produces silent regressions Jérémy has hit multiple times. Always run through this skill before wiring a new module.
---

# Add Module — TOEIC Arena

Wiring a new training module is mechanical but unforgiving: a single missing item (XpToast outside `pg()`, BGM not stopped on back, missing SELF_MANAGED entry, weight absent from TOEIC estimator) produces silent bugs that are painful to diagnose. This skill is the canonical checklist.

**Where things live since the split (2026-09-15)** — the module's component goes in its own file `src/features/<module>/<Name>.jsx`; the route line in `src/routes.jsx`; the XP pipeline (`applyXpGates`, `addXp`, `grantWeeklyChest`, `miniDone`…) stays in `App()` (`src/App.jsx`) and reaches routes through the context `c`; `recordModule` is in `src/lib/progress.js`; the TOEIC weight in `src/lib/toeic.js`; `FREE_MODULES` in `src/lib/access.js`; hub tiles in `src/features/home/Train.jsx`, `src/features/games/GamesHub.jsx` or `src/features/listening/Listening.jsx`. Layering rule: a feature imports `lib/`, `components/`, `data/` and its own folder only (`tests/check_import_graph.cjs` refuses the rest).

## When to use

- New training module / mini-game / drill / sub-module
- New `sp==="X"` route
- New module hub with sub-modules (Gauntlet pattern, Modal Council pattern)
- Replacing a Study Mode with a real module

## Before writing any code

1. **Decide the module ID** — short kebab/camel string used as `sp` value, `recordModule` key, BGM filename suffix, achievement keys. Examples : `tavern`, `gauntlet`, `modals`, `wfall`. Stay consistent across all touchpoints.
2. **Decide if module is SELF_MANAGED for BGM** — if it has its own BGM track and manages start/stop internally (sub-module hubs, multi-phase modules), add to the `SELF_MANAGED` array (in `App()`, central BGM `useEffect` — grep `SELF_MANAGED` in `src/App.jsx`). Otherwise the route line in `src/routes.jsx` controls BGM.
3. **Decide the XP tier** — see CLAUDE.md "Gauntlet XP tier" section. Tier B (15Q modules) = `15 + 5×correct + 35 perfect`. Match peer modules (Tavern 110, SBuilder 95, Gauntlet 125 max).
4. **Decide TOEIC estimator weight** — does this contribute to Listening or Reading section? What weight (e.g. Gauntlet = 0.15 of reading)? Update `MODULE_TOEIC_MAP` and `estimateTOEICScore` in `src/lib/toeic.js` accordingly.

## Checklist — every module

Touchpoints to wire (in rough order):

### Component file
- [ ] Create `src/features/<module>/<Name>.jsx` exporting the component (PascalCase). A `.jsx` file exports components only: helpers → `src/lib/`, a private render helper stays unexported. Imports from `../../lib/…`, `../../components/…`, `../../data/…` only.

### Routing (`src/routes.jsx`)
- [ ] Import the component at the top of `routes.jsx` and add the `sp==="<id>"` line inside `renderRoute`. Pattern (end-of-session screen, since 2026-09-17) :
  ```js
  if(sp==="<id>"){if(!lastSession)playBGM("bgm_<name>");return pg(<Component u={u} nav={nav} done={function(sc,tot,xp){stopBGM();return miniSession(sc,tot,xp);}} session={lastSession} closeSession={closeSession} replaySession={replaySession} back={function(){stopBGM();sSP(null);sT("<tab>");}}/>);}
  ```
  No `gate` prop any more: the module never computes gated XP itself. `playBGM` guarded by `!lastSession` so the music doesn't restart under the result screen.
- [ ] Every `App()`-scope name the line uses (`u`, `pg`, `miniSession`, `lastSession`, `closeSession`, `sSP`, `sT`, `nav`…) must be in the destructuring at the top of `renderRoute` AND in the call literal `renderRoute({...})` in `App()`. `npx eslint src/routes.jsx src/App.jsx` must show no `no-undef`: that is the guarantee, a missing name is a runtime `ReferenceError` on that screen only.
- [ ] If SELF_MANAGED : add to `SELF_MANAGED` array in `App()` AND don't call `playBGM` in the route line (component handles it)
- [ ] **Heavy screen** (own data file, exam, hub with grimoires) → load it on demand instead of a static import: `var Name=lazyNamed(function(){return import("./features/<module>/<Name>.jsx");},"Name");` next to the other lazies in `routes.jsx` (import `lazyNamed` from `./components/lazyNamed.js`). Same local name, so the route line is unchanged; `pg()` already provides the fallback. Never keep a static import alongside — `npm test` (`check_import_graph`) refuses it, as well as a wrong path or export name.

### XP pipeline (in `App()`, `src/App.jsx` — reached from the route via the context)
- [ ] Standard module: route calls **`miniSession(sc, tot, baseXp)`** (spotlight applied) and RETURNS its value (the session id). It runs `settleSession` (gateSteps + settleXp, detail kept for the screen) → stats → `trackModSession` → `recordModule` → `checkMission` → `sealSession` → `sv`. Pass the **base** XP: gates are applied once, in App (passing already-gated XP applied them twice, bug fixed 2026-09-17).
- [ ] Custom handler (own stats, chests…): same order — `var s=settleSession(modId,sc,tot,baseXp,{spotlight:true}); var c=s.c; …; sealSession(c,s.sid); sv(c); return s.sid;`. Never `applyXpGates`+`addXp` for a module that shows `SessionResult` (no step detail, toast over the screen).
- [ ] `grantWeeklyChest(trigger, "novice"|"guerrier"|"champion")` if perfect / milestone — while the screen is open, the confirmed chest appears IN it (not as a toast).

### End-of-session screen (CRITICAL — `components/SessionResult.jsx`, CLAUDE.md « écran de fin »)
- [ ] Keep `var sidRef=useRef(0), mistakesRef=useRef([]);`. On a wrong answer: `mistakesRef.current.push({tag, prompt, yours, correct, why})` (`prompt` with `_____` for the blank; `noBlank:true` for a definition/transcript). If the Mistake Hunt can replay the item, add `ref:moduleRef("<mod>", item.id)` (`lib/reviewRefs.js` : declare the module's category there, a grammar-bank category when one fits; item reference, never an option index — see CLAUDE.md « Mentor qui se souvient »), pass `mistakesRef.current` as the last argument of `p.done` (and through the route wrapper to `miniSession`), teach `lib/reviewLookup.js` to resolve the new prefix as a shuffled MCQ, and add the bank to `tests/check_review_lookup.cjs`.
- [ ] At the end of the round, in the same handler: `sidRef.current=p.done(sc,tot,baseXp); sP("done");` — persist at submit, never behind a button.
- [ ] `if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="<Module name>" mistakes={mistakesRef.current} onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}>{extras}</SessionResult>);` — module-specific info (NextStepReco, records…) goes in `children`. Never wrap it in `.enter`. No `p.gate()` in render.
- [ ] Score-less games: `mode="points"` (or `"time"`) + `points` / `pointsLabel`. No mistakes list to show (Speed Match): omit `mistakes`, the card is hidden.
- [ ] **End reached from a timer** (last life, auto-submit, `setTimeout` → phase `done`): don't call `p.done` in the timer callback (stale closure). Send in `useEffect(function(){if(phase!=="done"||sentRef.current)return;sentRef.current=true;sidRef.current=p.done(…);},[phase]);` placed BEFORE any early `return` (rules-of-hooks — `lintgate` only counts it, run `npx eslint <file>`). A record ("New record!") is read from `p.u` BEFORE `p.done`: `sv()` writes it at once.
- [ ] **Internal hub** (Gauntlet, Modal Council pattern): the hub's `subDone` RETURNS `p.onModuleDone(...)` and does NOT close the sub-module; the sub-module renders `SessionResult` with `onContinue` (hub: `closeSession` + back to hub) and `onReplay` (hub: `closeSession` + `playBGM` + bump a `subRun` counter used as the sub-module's `key`). Hubs with a mode state instead (GerInf, PhrasalDojo): Continue → `closeSession` + hub mode, Replay → `closeSession` + reset (mistakes included).

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

### TOEIC estimator (`src/lib/toeic.js`)
- [ ] Add the module to `MODULE_TOEIC_MAP` and update `estimateTOEICScore` with the new weight. Recompute Listening or Reading section sum so weights still total 1.0. `tests/validate_toeic_shrinkage.cjs` requires the module natively.

### Tile / entry point UI
- [ ] Add tile in `features/home/Train.jsx` / `features/games/GamesHub.jsx` / `features/listening/Listening.jsx` (ListenHub, ReadingHub). Use unified design (V10 tint) :
  ```js
  background: "linear-gradient(135deg, rgba(var(--cx),.22), transparent)",
  border: "1.5px solid var(--cyan)",
  // icon
  <GIcon name="<icon>" size={42} color="var(--cyan)"/>
  ```
  Add icon path to `GAME_ICON_PATHS` in `src/data/avatarIcons.js` if missing (`https://api.iconify.design/game-icons/NAME.svg`).
- [ ] If freemium-locked : add modId to `FREE_MODULES` list in `src/lib/access.js` (or leave out). Visitor-locked tiles use `var(--bdr)` border + `var(--t3)` icon.
- [ ] **Hub lists render `HubTile` (live tiles, 2026-09-17)** : the item object needs no extra code for a plain scored module (its `id` = the `moduleScores` key gives last score, mastery chest progress and next-run XP). Hub with sub-trials → `subs:[...]` + `unit:"trials"`; score-less game → `game:"<gameScores key>"`; tool without score → `plain:true`. Never re-implement the 50 Q / 80 % rule: `lib/hubStatus.js`.

### BUILD_ID
- [ ] Bump `BUILD_ID` constant in `src/App.jsx` (line ~62, just above `App()`) — date of significant change. Otherwise console logs lie about deployment.

### Back button
- [ ] Use `.back-btn` CSS class with label `← Back`. Never re-inline `style={{background:"none",border:"none"...}}`.

### Data file
- [ ] Create `src/data/<modId>.js` if content needed. Imported by the feature file at build time (no runtime fetch).
- [ ] Verify content pool size matches CLAUDE.md table — flag deficits to Jérémy.

## After wiring

1. `npm run build` — must pass clean, and `npm test` (symbol census, import graph, TOEIC estimator)
2. Test locally on `npm run dev`
3. Check console for `[BUILD] <BUILD_ID>` log on load
4. Verify the end-of-session screen: XP shown = XP in the profile after reload, Continue returns to the right screen, Play again gives new questions
5. Verify BGM stops on back, restarts on home if SELF_MANAGED
6. **Don't `git add public/`** files implicitly — explicitly add new MP3s, the `bgm_tavern.mp3` regression cost 30min

## Anti-patterns to refuse

- **Do not put the new component in `App.jsx`.** Since the 2026-09-15 split, `App.jsx` holds `App()` only; a module lives in `src/features/<module>/`. Do not add a React context or move `App()` state into hooks to "simplify" wiring: the prop-driven pattern is deliberate (CLAUDE.md, Architecture).
- **Do not introduce new abstractions** "for future modules". 3 similar modules is better than a premature shared base. Wait until pattern is proven.
- **Do not add daily XP cap or hard time gates.** Anti-farming = diminishing returns per module per day, period.
- **Flashcards-style modules give 0 XP.** Reward goes through a quiz layer (Tavern pattern), not the SRS itself.

## Reference modules (good patterns)

- **Word Tavern** (`sp==="tavern"`) — 15Q quiz, BGM `bgm_tavern`, Tier B XP, dedicated route, no sub-modules
- **Grammar Gauntlet** (`sp==="gauntlet"`) — hub with 4 sub-modules via internal `subMode` state, each with own BGM, single `onModuleDone` callback to App
- **Modal Council** (`sp==="modals"`) — newer hub pattern, tap-to-pair UX, 2 sub-modules sharing one grimoire

When in doubt about an architectural choice, copy the closest existing module's structure.
