/**
 * Forgot-password flow.
 *
 * Step 1 asks the server to mail a code to the account's confirmed recovery
 * address (see supabase/functions/password-reset). Step 2 is pure Supabase: the
 * code is Supabase's own recovery OTP, so verifying it yields a real session,
 * and the password change is an ordinary updateUser on that session.
 *
 * The client only ever handles the synthetic login address, which it derives
 * from the username exactly as sign-in does — the real recovery address stays
 * server-side.
 */
import { normalizeDisplayName, usernameToEmail } from "./cloudAuth";
import supabase from "./supabase";

/**
 * Mail a reset code. Resolves regardless of whether the account exists or has a
 * recovery address on file — the server deliberately gives the same answer
 * either way, so the UI must not promise the mail was actually sent.
 */
export async function requestPasswordReset(username: string): Promise<void> {
  const name = normalizeDisplayName(username);
  if (!name) throw new Error("Enter your username.");

  const { error } = await supabase.functions.invoke("password-reset", {
    body: { loginEmail: usernameToEmail(name) },
  });

  if (error) {
    const ctx = (error as { context?: unknown }).context;
    let message = "";
    if (ctx instanceof Response) {
      try {
        const parsed = await ctx.json();
        if (parsed && typeof parsed.error === "string") message = parsed.error;
      } catch {
        // Non-JSON body — fall through to the generic text.
      }
    }
    throw new Error(
      message || "Could not reach the server. Check your connection."
    );
  }
}

/**
 * Exchange the mailed code for a session and set the new password. Signs back
 * out afterwards so the user logs in through the normal path — that's what
 * stores the username and auto-login settings.
 */
export async function resetPasswordWithCode(
  username: string,
  code: string,
  newPassword: string
): Promise<void> {
  const name = normalizeDisplayName(username);
  const token = code.trim();

  if (!/^\d{6}$/.test(token)) {
    throw new Error("Enter the 6-digit code from the email.");
  }
  if (newPassword.length < 8) {
    throw new Error("Passwords must contain at least 8 characters.");
  }

  const { error: otpError } = await supabase.auth.verifyOtp({
    email: usernameToEmail(name),
    token,
    type: "recovery",
  });
  if (otpError) {
    throw new Error(
      otpError.message.toLowerCase().includes("expired")
        ? "That code has expired. Request a new one."
        : "Wrong or expired code."
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) throw new Error(updateError.message);

  await supabase.auth.signOut();
}
