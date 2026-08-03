/**
 * Recovery email verification.
 *
 * An address is only stored once its owner has proven they can read mail there,
 * so this runs in two steps:
 *
 *   { action: "request", email } -> mails a 6-digit code, stores its hash
 *   { action: "confirm", code }  -> checks the code, writes auth_recovery
 *
 * Both require the caller's own JWT; the address is always attached to the
 * authenticated user, never to a user id supplied by the client.
 *
 * Writes happen with the service role because `auth_recovery` deliberately has
 * no client insert/update policy — otherwise a user could store an address with
 * verified_at set and skip the mail entirely.
 *
 * A 6-digit code typed back into the app is used rather than a click-through
 * link because the client is an Electron desktop app, where a browser redirect
 * has nowhere to land.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

import { sendCodeEmail } from "../_shared/email.ts";
import { CORS, generateCode, json } from "../_shared/http.ts";

const CODE_TTL_MINUTES = 15;
const MAX_ATTEMPTS = 5;
// Minimum gap between two "send me a code" requests for one user, so the
// endpoint can't be used to flood an address with mail.
const RESEND_COOLDOWN_SECONDS = 60;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function hashCode(code: string, userId: string): Promise<string> {
  const data = new TextEncoder().encode(`${code}:${userId}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time compare, so a wrong code leaks nothing through timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json({ error: "Not signed in." }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) return json({ error: "Not signed in." }, 401);

  let body: { action?: string; email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request." }, 400);
  }

  if (body.action === "request") {
    const email = (body.email ?? "").trim();
    if (!EMAIL.test(email) || email.length > 254) {
      return json({ error: "That doesn't look like an email address." }, 400);
    }

    const { data: existing } = await admin
      .from("auth_recovery_pending")
      .select("created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const age = Date.now() - new Date(existing.created_at).getTime();
      if (age < RESEND_COOLDOWN_SECONDS * 1000) {
        const wait = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - age) / 1000);
        return json(
          { error: `Please wait ${wait}s before requesting another code.` },
          429
        );
      }
    }

    const code = generateCode();
    const codeHash = await hashCode(code, user.id);

    // Store before sending: a mail that goes out with no matching row would be
    // unusable, which is worse than a row whose mail failed (the user just
    // retries after the cooldown).
    const { error: upsertError } = await admin
      .from("auth_recovery_pending")
      .upsert(
        {
          user_id: user.id,
          email,
          code_hash: codeHash,
          expires_at: new Date(
            Date.now() + CODE_TTL_MINUTES * 60 * 1000
          ).toISOString(),
          attempts: 0,
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    if (upsertError) {
      console.error("pending upsert:", upsertError.message);
      return json({ error: "Could not start verification." }, 500);
    }

    try {
      await sendCodeEmail({
        to: email,
        subject: `${code} is your MTG Arena Tool confirmation code`,
        title: "Confirm your recovery email",
        blurb: `Enter this code in MTG Arena Tool to save this address as your recovery email. It expires in ${CODE_TTL_MINUTES} minutes.`,
        code,
      });
    } catch (e) {
      console.error("send:", e);
      await admin.from("auth_recovery_pending").delete().eq("user_id", user.id);
      // The provider's reason is surfaced rather than swallowed: during setup
      // it's the difference between "unverified domain" and a dead end. Worth
      // reducing to a generic message once this is in users' hands.
      const detail = e instanceof Error ? e.message : "";
      return json({ error: `Could not send the email. ${detail}`.trim() }, 502);
    }

    return json({ ok: true, expiresInMinutes: CODE_TTL_MINUTES });
  }

  if (body.action === "confirm") {
    const code = (body.code ?? "").trim();
    if (!/^\d{6}$/.test(code)) return json({ error: "Wrong code." }, 400);

    const { data: pending } = await admin
      .from("auth_recovery_pending")
      .select("email, code_hash, expires_at, attempts")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!pending) {
      return json({ error: "No pending confirmation. Start again." }, 400);
    }
    if (new Date(pending.expires_at).getTime() < Date.now()) {
      await admin.from("auth_recovery_pending").delete().eq("user_id", user.id);
      return json({ error: "That code expired. Start again." }, 400);
    }
    if (pending.attempts >= MAX_ATTEMPTS) {
      await admin.from("auth_recovery_pending").delete().eq("user_id", user.id);
      return json({ error: "Too many attempts. Start again." }, 429);
    }

    const candidate = await hashCode(code, user.id);
    if (!timingSafeEqual(candidate, pending.code_hash)) {
      await admin
        .from("auth_recovery_pending")
        .update({ attempts: pending.attempts + 1 })
        .eq("user_id", user.id);
      return json({ error: "Wrong code." }, 400);
    }

    const now = new Date().toISOString();
    const { error: saveError } = await admin.from("auth_recovery").upsert(
      {
        user_id: user.id,
        email: pending.email,
        verified_at: now,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );
    if (saveError) {
      console.error("auth_recovery upsert:", saveError.message);
      return json({ error: "Could not save the address." }, 500);
    }

    await admin.from("auth_recovery_pending").delete().eq("user_id", user.id);
    return json({ ok: true, email: pending.email });
  }

  return json({ error: "Bad request." }, 400);
});
