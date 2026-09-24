# Supabase : Edge Functions et notifications push

> Chargé quand on travaille dans `supabase/`. Modèle d'accès (verrou, RPC, identité) : `CLAUDE.md` racine.

## Push Notification Infrastructure

3 Edge Functions deployed, all in English:

| Function | Schedule | Target |
|----------|----------|--------|
| `streak-reminder` | Daily 20h CET | Streak ≥ 2, inactive today |
| `weekly-results` | Monday 08h CET | Personalized weekly ranking + teaser of Aldric's Monday letter (computed client-side) |
| `inactive-reminder` | Every 3d 17h CET | Inactive 7-30d, active classes only |

Anti-spam on `inactive-reminder` via `students.inactivity_push_sent` (max 1 per 14d).
