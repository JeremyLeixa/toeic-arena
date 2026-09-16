import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Trace des pertes de session (2026-09-16, règle n°7 : des logs avant de conclure).
// Quand le rafraîchissement du jeton échoue sur une erreur non récupérable (« Invalid Refresh
// Token: Already Used », révocation…), auth-js supprime la session EN SILENCE : ni console, ni
// événement SIGNED_OUT, seulement ses messages de debug. `debug` accepte une fonction (API
// publique) : on n'en garde que ces deux moments. Hypothèse à confirmer : des rafraîchissements
// parallèles (verrou d'auth « volé », deux onglets) invalideraient le jeton, puis la sauvegarde
// suivante recrée une session anonyme (piège « session perdue », CLAUDE.md).
// ⚠️ Ne jamais logger `name` tel quel : il contient le début du refresh token.
function authTrace(prefix, name, tag, detail) {
  try {
    const n = String(name || '')
    if (n.indexOf('#_callRefreshToken') === 0 && tag === 'error') {
      console.warn('[AUTH] refresh token failed:', (detail && (detail.message || detail.code)) || String(detail),
        detail && detail.status ? '(HTTP ' + detail.status + ')' : '')
    } else if (n === '#_removeSession()') {
      console.warn('[AUTH] session removed from storage (sign-out, or refresh refused)')
    }
  } catch (e) { console.warn('[AUTH] trace caught:', e && e.message) }
}

export const supabase = createClient(supabaseUrl, supabaseKey, { auth: { debug: authTrace } })