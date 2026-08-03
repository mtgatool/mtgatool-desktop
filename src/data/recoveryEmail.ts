/**
 * The (optional) real email address used to recover a lost password.
 *
 * Accounts log in with a synthetic address derived from the username (see
 * ./cloudAuth), which nothing can deliver to — so without one of these there is
 * no way back into an account whose password is gone. Stored in its own
 * owner-only table rather than on `profiles`, which feeds public lookups.
 *
 * Cloud-only: there is nothing to attach an address to in offline/local mode.
 */
import supabase from "./supabase";

export interface RecoveryEmail {
  email: string;
  verified: boolean;
}

// Deliberately loose. The real check is whether a code sent to the address
// arrives; anything stricter mostly just rejects valid unusual addresses.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateRecoveryEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return "Please enter an email address.";
  if (value.length > 254) return "That address is too long.";
  if (!EMAIL.test(value)) return "That doesn't look like an email address.";
  return null;
}

async function getActiveUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** The stored address, or null when there is none (or we're offline/local). */
export async function getRecoveryEmail(): Promise<RecoveryEmail | null> {
  try {
    const userId = await getActiveUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from("auth_recovery")
      .select("email, verified_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      console.error("[recoveryEmail] get:", error.message);
      return null;
    }
    if (!data?.email) return null;
    return { email: data.email, verified: !!data.verified_at };
  } catch (e) {
    console.error("[recoveryEmail] get threw:", e);
    return null;
  }
}

/**
 * Both steps go through the `recovery-email` edge function rather than writing
 * the table directly: an address is only worth anything if its owner has been
 * shown to read mail there, so the row is written server-side after a mailed
 * code comes back. `auth_recovery` has no client insert/update policy at all —
 * a direct write would let anyone store an address they don't control.
 */
async function callRecoveryFunction<T>(
  body: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("recovery-email", {
    body,
  });

  if (error) {
    // A non-2xx reply is a FunctionsHttpError carrying the Response, and the
    // useful message is in its JSON body — error.message is just "non-2xx
    // status". Anything else (network failure, CORS) carries the underlying
    // error in `context` instead, which is why this has to type-check it
    // rather than assume a Response.
    const ctx = (error as { context?: unknown }).context;
    let message = "";
    if (ctx instanceof Response) {
      try {
        const parsed = await ctx.json();
        if (parsed && typeof parsed.error === "string") message = parsed.error;
      } catch {
        // Body wasn't JSON (a gateway error page, say) — use the generic text.
      }
    }
    throw new Error(
      message || "Could not reach the server. Check your connection."
    );
  }

  return data as T;
}

/**
 * Step 1: mail a confirmation code to `email`. Nothing is stored against the
 * account until the code comes back through confirmRecoveryEmail().
 */
export async function requestRecoveryEmail(email: string): Promise<void> {
  const invalid = validateRecoveryEmail(email);
  if (invalid) throw new Error(invalid);

  const userId = await getActiveUserId();
  if (!userId) {
    throw new Error("You need to be signed in to your account for this.");
  }

  await callRecoveryFunction({ action: "request", email: email.trim() });
}

/** Step 2: hand back the code from the email; on success the address is saved. */
export async function confirmRecoveryEmail(code: string): Promise<string> {
  const value = code.trim();
  if (!/^\d{6}$/.test(value)) {
    throw new Error("Enter the 6-digit code from the email.");
  }

  const result = await callRecoveryFunction<{ email: string }>({
    action: "confirm",
    code: value,
  });

  return result.email;
}

export async function clearRecoveryEmail(): Promise<void> {
  const userId = await getActiveUserId();
  if (!userId) return;
  const { error } = await supabase
    .from("auth_recovery")
    .delete()
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
