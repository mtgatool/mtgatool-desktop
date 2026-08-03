/**
 * Forgot-password: mail a recovery code to the account's confirmed address.
 *
 * Called by a signed-OUT user, so unlike recovery-email there is no user JWT —
 * only the publishable key. That makes two things load-bearing:
 *
 *   1. The response is ALWAYS the same generic success, whether or not the
 *      account exists and whether or not it has a confirmed address. Otherwise
 *      this endpoint tells an attacker which usernames are registered.
 *   2. The recovery address is never returned. The client sends the synthetic
 *      login address it derived from the username; the mapping to the real
 *      address happens in `recovery_target_for_login`, which only the service
 *      role can execute.
 *
 * The code itself is Supabase's own recovery OTP (`generateLink` mints it
 * without sending), so the client can finish with a plain
 * `verifyOtp({ type: "recovery" })` + `updateUser({ password })` — no custom
 * token to store or validate, and the reset is as strong as Supabase's own.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

import { sendCodeEmail } from "../_shared/email.ts";
import { CORS, json } from "../_shared/http.ts";

// Login addresses are synthetic and always on this domain (see cloudAuth.ts).
// Refusing anything else stops the endpoint being pointed at arbitrary mail.
const LOGIN_EMAIL = /^user-[a-z0-9_-]{3,}@mtgatool\.com$/;

const RESET_COOLDOWN_SECONDS = 60;
const CODE_TTL_MINUTES = 60; // Supabase's own OTP lifetime

// Identical for every outcome, on purpose — see the note above.
const GENERIC = {
  ok: true,
  message:
    "If that account has a confirmed recovery email, a code is on its way.",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { loginEmail?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request." }, 400);
  }

  const loginEmail = (body.loginEmail ?? "").trim().toLowerCase();
  if (!LOGIN_EMAIL.test(loginEmail)) {
    // Malformed input is the one case that can't leak anything, since it can't
    // correspond to any account.
    return json({ error: "Enter your username." }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: rows, error: lookupError } = await admin.rpc(
    "recovery_target_for_login",
    { p_login_email: loginEmail }
  );
  if (lookupError) {
    console.error("lookup:", lookupError.message);
    return json({ error: "Something went wrong. Try again later." }, 500);
  }

  const target = Array.isArray(rows) ? rows[0] : rows;

  // No account, or no confirmed address: say the same thing as success. There
  // is nothing the caller can do about it and nothing we should tell them.
  if (!target?.email || !target.verified_at) return json(GENERIC);

  // Silently skip rather than 429 — a "wait 45s" reply would confirm the
  // account exists.
  if (target.last_reset_at) {
    const age = Date.now() - new Date(target.last_reset_at).getTime();
    if (age < RESET_COOLDOWN_SECONDS * 1000) return json(GENERIC);
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: loginEmail,
  });
  if (linkError) {
    console.error("generateLink:", linkError.message);
    return json(GENERIC);
  }

  const otp = link?.properties?.email_otp;
  if (!otp) {
    // Guard rather than assume the field name; if this ever fires the log says
    // exactly what came back instead of failing silently.
    console.error(
      "generateLink returned no email_otp; properties:",
      JSON.stringify(link?.properties ?? {})
    );
    return json(GENERIC);
  }

  try {
    await sendCodeEmail({
      to: target.email,
      subject: `${otp} is your MTG Arena Tool password reset code`,
      title: "Reset your password",
      blurb: `Enter this code in MTG Arena Tool to choose a new password. It expires in ${CODE_TTL_MINUTES} minutes.`,
      code: otp,
    });
  } catch (e) {
    console.error("send:", e);
    return json(GENERIC);
  }

  await admin.rpc("mark_recovery_reset_sent", { p_user_id: target.user_id });

  return json(GENERIC);
});
