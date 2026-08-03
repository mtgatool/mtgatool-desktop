/**
 * CORS + JSON helpers shared by the functions.
 *
 * supabase-js attaches x-client-info (and apikey) to every functions.invoke, so
 * a preflight that allows only authorization/content-type is rejected before
 * the request is ever made.
 */
export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** Six digits from the CSPRNG, rejection-sampled so every code is equally likely. */
export function generateCode(): string {
  const buf = new Uint32Array(1);
  let n: number;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= 4294000000); // largest clean multiple of 1000000
  return String(n % 1000000).padStart(6, "0");
}
