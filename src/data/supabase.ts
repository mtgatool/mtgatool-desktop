import { createClient } from "@supabase/supabase-js";

import { Database } from "./database.types";

/**
 * Supabase client (project: mtgatool).
 *
 * The publishable key is safe to commit: it identifies the project but grants
 * nothing by itself — every request is checked against Row Level Security
 * with the logged-in user's JWT. Secrets (service_role, OAuth providers)
 * live only in the Supabase dashboard / CI, never in this repo.
 *
 * Both values can be overridden at build time to point a dev build at a local
 * stack (`npx supabase start`) instead of production — see
 * `scripts/clone-prod-local.sh`. Production builds set neither and get the
 * constants below.
 */
export const SUPABASE_URL =
  process.env.REACT_APP_SUPABASE_URL ||
  "https://decenyvqkbvydrrolwpk.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.REACT_APP_SUPABASE_KEY ||
  "sb_publishable_9CgHq0DZWlYYxjH7ZDLeOw_zk4EKYKu";

const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      // Sessions persist in localStorage so the desktop app can auto-login
      // (and keep working offline) without storing the password.
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export default supabase;
