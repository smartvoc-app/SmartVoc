/* Supabase client — created only when both env vars are present.
 * When unconfigured, `supabase` is null and the whole app runs purely
 * local-first (no auth UI, full offline use). This preserves the
 * offline / no-login parity from Phase 0–2. */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isConfigured = !!(url && anon);

/* Did the user arrive here by following a "reset password" email link?
 *
 * This has to be answered BEFORE createClient() runs, a few lines down.
 * Creating the client starts the library's init, which reads the recovery
 * token out of the URL fragment, wipes the fragment, and fires
 * PASSWORD_RECOVERY at whoever is already subscribed. React mounts long
 * after that, and a late subscriber is only ever handed INITIAL_SESSION —
 * the recovery event is never replayed. Relying on the event alone meant
 * the user landed in the app signed in, with no prompt for a new password.
 *
 * Only the implicit flow is covered, which is the one in use (the library's
 * default). A PKCE or token_hash link would need verifyOtp() instead, and
 * merely detecting it here would show the form without a usable session. */
export const cameFromRecoveryLink: boolean = (() => {
  try {
    return /(^|&)type=recovery(&|$)/.test(window.location.hash.replace(/^#/, ""));
  } catch {
    return false;
  }
})();

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(url!, anon!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

/* The synced documents — same keys as the local vt_v1_* store. */
export const DOC_KEYS = ["vocab", "lists", "stats", "meta", "settings"] as const;
export type DocKey = (typeof DOC_KEYS)[number];

/* Der Schluessel in der Wolke traegt die Modellversion.
 *
 * Aendert sich das Datenmodell, aendert sich der Schluessel: ein Geraet mit
 * der neuen Fassung liest die alten Dokumente gar nicht erst. Ohne das
 * holte der erste Abgleich den alten Bestand zurueck, und der Neuanfang auf
 * dem Geraet waere umsonst gewesen. */
export const DOC_VERSION = "v2";
export const dbKey = (k: DocKey) => `${k}_${DOC_VERSION}`;
