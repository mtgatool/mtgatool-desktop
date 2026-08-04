#!/usr/bin/env bash
# Clone the production `public` schema into a local Supabase stack, so the app
# can be run against real data without touching prod.
#
#   ./scripts/clone-prod-local.sh
#
# Brings the stack up, copies prod's public schema into it, applies the Explore
# migrations that prod doesn't have yet, and prints the command to run the UI
# against it.
#
# Why it starts the stack itself: `supabase start` applies supabase/migrations/*
# on first init, and the oldest of those selects from `public.matches` -- a table
# no migration creates (the base schema was built outside migrations, so the
# directory is not a complete schema). Starting normally therefore aborts with
# `relation "public.matches" does not exist`. So migrations are switched off for
# the boot, the prod dump supplies the real schema, and only the new migrations
# are applied on top. config.toml is restored on exit either way.
#
# Reads the DB password from $SUPABASE_DB_PASSWORD, or prompts. Never written to
# disk. Only the `public` schema is copied -- `auth` (emails, password hashes,
# sessions) is deliberately left behind, so sign up a throwaway account locally.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
CONFIG="$ROOT/supabase/config.toml"
PROJECT_REF=$(cat "$ROOT/supabase/.temp/project-ref")
POOLER_HOST=aws-1-us-west-2.pooler.supabase.com
DUMP=$(mktemp -t mtgatool-prod-public)

cleanup() {
  rm -f "$DUMP"
  [ -f "$CONFIG.bak" ] && mv "$CONFIG.bak" "$CONFIG"
}
trap cleanup EXIT

if [ -z "${SUPABASE_DB_PASSWORD:-}" ]; then
  read -r -s -p "Supabase DB password for $PROJECT_REF: " SUPABASE_DB_PASSWORD
  echo
fi

PGURL="postgresql://postgres.${PROJECT_REF}:${SUPABASE_DB_PASSWORD}@${POOLER_HOST}:5432/postgres"

# Fail before touching anything local if the password is wrong.
# prod is Postgres 17; a v14 pg_dump refuses to talk to it, so run the client
# out of a matching image rather than whatever is on PATH.
# `supabase_migrations` comes along so scripts/recover-migrations.sh can rebuild
# the migration files from the history prod recorded -- see that script.
echo "==> dumping public schema from $PROJECT_REF"
docker run --rm postgres:17 pg_dump "$PGURL" \
  --schema=public --schema=supabase_migrations \
  --no-owner --no-privileges --no-publications --no-subscriptions \
  > "$DUMP"
echo "    $(du -h "$DUMP" | cut -f1)"

if ! docker ps --format '{{.Names}}' | grep -q '^supabase_db_'; then
  echo "==> starting local stack (migrations skipped -- see header)"
  cp "$CONFIG" "$CONFIG.bak"
  # macOS/BSD sed needs the empty -i argument.
  sed -i '' '/^\[db.migrations\]/,/^\[/ s/^enabled = true/enabled = false/' "$CONFIG"
  npx supabase start >/dev/null
  mv "$CONFIG.bak" "$CONFIG"
fi

DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep '^supabase_db_' | head -1)
PSQL=(docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -q)

echo "==> restoring into $DB_CONTAINER"
"${PSQL[@]}" -c 'drop schema if exists public cascade; create schema public;
                 drop schema if exists supabase_migrations cascade;' >/dev/null
"${PSQL[@]}" -v ON_ERROR_STOP=0 < "$DUMP" >/dev/null 2>&1
"${PSQL[@]}" -c 'grant usage on schema public to anon, authenticated, service_role;
                 grant all on all tables in schema public to anon, authenticated, service_role;' >/dev/null

# Prod predates these; apply them so local matches what we intend to ship.
for f in "$ROOT"/supabase/migrations/20260804*.sql; do
  echo "==> $(basename "$f")"
  "${PSQL[@]}" -v ON_ERROR_STOP=1 < "$f"
done

echo
"${PSQL[@]}" -c "select 'matches' as t, count(*) from public.matches
                 union all select 'explore_decks', count(*) from public.explore_decks
                 union all select 'meta cards', count(*) from public.explore_meta_cards;"

ANON=$(npx supabase status -o json 2>/dev/null | sed -n 's/.*"ANON_KEY": *"\([^"]*\)".*/\1/p')
echo "Run the UI against it with:"
echo "  REACT_APP_SUPABASE_URL=http://127.0.0.1:54321 \\"
echo "  REACT_APP_SUPABASE_KEY=$ANON \\"
echo "  npm run start:web"
