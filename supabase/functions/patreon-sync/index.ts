/**
 * Pull the Patreon patron list into `patron_pledges`, then resolve links.
 *
 * Runs entirely server-side: the creator token lives in this function's secrets
 * and never reaches the desktop app. Invoked hourly by pg_cron via pg_net (see
 * the patreon_sync_cron migration), and callable by hand with the service-role
 * key when testing.
 *
 * Patreon API v2, not the v1 `pledges` endpoint the website uses, and not only
 * because v2 is the current API. v1 lists *current* pledges: a patron who
 * cancels disappears from the response entirely, so their row would sit at
 * "active" forever and they would stay entitled. v2 returns every member with an
 * explicit `patron_status`, which is what makes a lapse visible at all.
 *
 * The address is the whole point of this sync: mtgatool logins are synthetic
 * ("user-<name>@mtgatool.com", see cloudAuth.ts), so a patron is matched to an
 * account through their verified recovery email and nothing else. It is read
 * from the MEMBER rather than the included user — with this token the user
 * resource comes back with no address at all, while the member carries one.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

import { CORS, json } from "../_shared/http.ts";

const PATREON_V2 = "https://www.patreon.com/api/oauth2/v2";

/**
 * Pledge amount in cents -> tier, matching the names the website already uses
 * for its patron ring colours (MTG formats).
 *
 *   1 Casual  2 Standard ($5)  3 Modern ($10)  4 Legacy ($20)
 */
function tierForCents(cents: number): number {
  if (cents >= 2000) return 4;
  if (cents >= 1000) return 3;
  if (cents >= 500) return 2;
  if (cents > 0) return 1;
  return 0;
}

async function patreonGet(url: string, token: string): Promise<any> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`patreon ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.json();
}

async function getCampaignId(token: string): Promise<string> {
  const body = await patreonGet(`${PATREON_V2}/campaigns`, token);
  const id = body?.data?.[0]?.id;
  if (!id) throw new Error("no campaign on this token");
  return String(id);
}

interface PledgeRow {
  patreon_user_id: string;
  email_normalized: string | null;
  full_name: string | null;
  thumb_url: string | null;
  tier: number;
  cents: number;
  status: string;
  last_charge_status: string | null;
  valid_until: string | null;
  synced_at: string;
}

/**
 * Every member of the campaign, following `links.next` to the end.
 *
 * Former and declined patrons are kept rather than filtered out: their row is
 * exactly what lets the resolver close an entitlement. Dropping them would leave
 * a cancelled patron entitled forever, which is the failure mode v1 has.
 */
async function getMembers(campaignId: string, token: string): Promise<PledgeRow[]> {
  const query = [
    "include=user",
    "fields%5Bmember%5D=currently_entitled_amount_cents,patron_status,last_charge_status,next_charge_date,email,full_name",
    "fields%5Buser%5D=full_name,image_url",
    "page%5Bcount%5D=200",
  ].join("&");

  let url = `${PATREON_V2}/campaigns/${campaignId}/members?${query}`;
  const out: PledgeRow[] = [];

  // Bounded so a malformed cursor cannot spin forever.
  for (let page = 0; page < 100 && url; page += 1) {
    // eslint-disable-next-line no-await-in-loop
    const body = await patreonGet(url, token);

    const users = new Map<string, any>();
    (body.included || []).forEach((i: any) => {
      if (i?.type === "user") users.set(String(i.id), i.attributes || {});
    });

    (body.data || []).forEach((d: any) => {
      const a = d.attributes || {};
      // Key on the user id, not the member id: the same person keeps their user
      // id across pledges, and it is what a manual admin link would reference.
      const uid = d?.relationships?.user?.data?.id;
      if (!uid) return;
      const u = users.get(String(uid)) || {};
      const cents = a.currently_entitled_amount_cents ?? 0;
      const status = a.patron_status ?? "none";
      // Member first: the user resource carries no address with this token.
      const email = String(a.email ?? u.email ?? "").trim().toLowerCase();

      out.push({
        patreon_user_id: String(uid),
        email_normalized: email || null,
        full_name: a.full_name ?? u.full_name ?? null,
        thumb_url: u.image_url ?? null,
        tier: tierForCents(cents),
        cents,
        status,
        last_charge_status: a.last_charge_status ?? null,
        // Only meaningful once they have stopped paying; for an active patron
        // the resolver ignores it and leaves expires_at null.
        valid_until: a.next_charge_date ?? null,
        synced_at: new Date().toISOString(),
      });
    });

    url = body?.links?.next || "";
  }

  return out;
}

/**
 * Service role only. Gateway JWT verification also admits the anon key — which
 * ships inside the app — and this endpoint drives calls against the Patreon
 * API, so "any valid JWT" is not good enough.
 *
 * Two accepted shapes, because the key the caller holds and the key in this
 * function's env are not guaranteed to be the same format on a project using
 * the new API keys: byte-equality with the injected env key, or a JWT whose
 * role is service_role. Reading the role without re-verifying is safe here —
 * the gateway (verify_jwt) has already validated the signature of any JWT
 * that reaches this code, so a forged payload never arrives.
 */
function bearerIsServiceRole(auth: string): boolean {
  if (!auth.startsWith("Bearer ")) return false;
  const tok = auth.slice(7).trim();
  const envKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (envKey && tok === envKey) return true;
  const parts = tok.split(".");
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      return payload?.role === "service_role";
    } catch {
      // fall through
    }
  }
  return false;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  if (!bearerIsServiceRole(req.headers.get("Authorization") ?? "")) {
    return json({ error: "service role required" }, 401);
  }

  const token = Deno.env.get("PATREON_ACCESS_TOKEN");
  if (!token) return json({ error: "PATREON_ACCESS_TOKEN is not set" }, 500);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const campaignId = await getCampaignId(token);
    const rows = await getMembers(campaignId, token);

    if (rows.length) {
      const { error } = await admin
        .from("patron_pledges")
        .upsert(rows, { onConflict: "patreon_user_id" });
      if (error) return json({ error: `upsert failed: ${error.message}` }, 500);
    }

    const { data: linked, error: resolveError } = await admin.rpc(
      "resolve_patron_entitlements"
    );
    if (resolveError) {
      return json({ error: `resolve failed: ${resolveError.message}` }, 500);
    }

    return json({
      ok: true,
      campaignId,
      members: rows.length,
      active: rows.filter((r) => r.status === "active_patron").length,
      // If this is 0 while active is not, the token cannot see addresses and
      // nothing will ever link — worth failing loudly in a log rather than
      // quietly syncing rows that can never match.
      withEmail: rows.filter((r) => r.email_normalized).length,
      activeWithEmail: rows.filter(
        (r) => r.status === "active_patron" && r.email_normalized
      ).length,
      newlyLinked: linked ?? 0,
    });
  } catch (e) {
    return json({ error: String(e).slice(0, 500) }, 500);
  }
});
