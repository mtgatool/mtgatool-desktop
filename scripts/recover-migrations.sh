#!/usr/bin/env bash
# Rebuild supabase/migrations/* from the migration history recorded in the
# database. Run after ./scripts/clone-prod-local.sh.
#
#   ./scripts/recover-migrations.sh            # write into supabase/migrations
#   ./scripts/recover-migrations.sh --dry-run  # list what it would write
#
# Most of this repo's migration files were authored on a machine we no longer
# have, and were never committed -- the directory holds 5 of the 20 migrations
# prod has actually applied, which is why `supabase start` dies on
# `relation "public.matches" does not exist`.
#
# Nothing was lost, though: Supabase stores each migration's SQL in
# `supabase_migrations.schema_migrations.statements`, so the files can be
# reproduced exactly rather than replaced by a squashed baseline. Filenames are
# rebuilt as `<version>_<name>.sql`, which is the convention the CLI expects and
# matches what prod recorded -- so after this runs, local history and remote
# history agree and `supabase db push` has nothing stale to re-apply.
#
# Existing files are left alone unless --force is passed; four of the five in the
# repo carry drifted timestamps for migrations prod recorded under a different
# version, and are reported as superseded so they can be deleted deliberately.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT="$ROOT/supabase/migrations"
DRY_RUN=false
FORCE=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --force)   FORCE=true ;;
    *) echo "unknown flag: $arg" >&2; exit 1 ;;
  esac
done

DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep '^supabase_db_' | head -1 || true)
if [ -z "$DB_CONTAINER" ]; then
  echo "local stack is not running -- run ./scripts/clone-prod-local.sh first" >&2
  exit 1
fi

psql_q() { docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -At -q "$@"; }

if ! psql_q -c "select to_regclass('supabase_migrations.schema_migrations')" | grep -q .; then
  echo "no migration history in the local clone -- re-run clone-prod-local.sh" >&2
  exit 1
fi

# read loop rather than mapfile: macOS ships bash 3.2, which has no mapfile.
VERSIONS=()
while IFS= read -r line; do
  [ -n "$line" ] && VERSIONS+=("$line")
done < <(psql_q -c \
  "select version from supabase_migrations.schema_migrations order by version")

echo "${#VERSIONS[@]} migrations in recorded history"

written=0
skipped=0
for v in "${VERSIONS[@]}"; do
  name=$(psql_q -c \
    "select coalesce(name,'migration') from supabase_migrations.schema_migrations where version='$v'")
  file="$OUT/${v}_${name}.sql"

  if [ -f "$file" ] && [ "$FORCE" = false ]; then
    skipped=$((skipped + 1))
    continue
  fi

  if [ "$DRY_RUN" = true ]; then
    echo "  would write $(basename "$file")"
    written=$((written + 1))
    continue
  fi

  # Statements are stored as an array; join them back into one file. Every
  # migration here holds a single element (the original file body), but joining
  # keeps this correct if a future one is split.
  # Command substitution strips psql's trailing newline, so the terminating
  # semicolon lands on the last line of SQL rather than on one of its own. The
  # recorded SQL may or may not already carry one.
  sql=$(psql_q -c "select array_to_string(statements, E';\n\n') \
                   from supabase_migrations.schema_migrations where version='$v'")
  case "$(printf '%s' "$sql" | tr -d '[:space:]' | tail -c 1)" in
    ';') printf '%s\n'  "$sql" > "$file" ;;
    *)   printf '%s;\n' "$sql" > "$file" ;;
  esac
  echo "  wrote $(basename "$file")"
  written=$((written + 1))
done

echo
echo "$written written, $skipped already present"

# Files whose contents prod recorded under a different version -- these are the
# drifted duplicates, and keeping both would apply the same DDL twice locally.
echo
echo "checking for superseded files:"
found_superseded=false
for f in "$OUT"/*.sql; do
  base=$(basename "$f" .sql)
  version=${base%%_*}
  suffix=${base#*_}
  if psql_q -c "select 1 from supabase_migrations.schema_migrations
                where name='$suffix' and version<>'$version'" | grep -q 1; then
    real=$(psql_q -c "select version from supabase_migrations.schema_migrations where name='$suffix'")
    echo "  $base.sql -> superseded by ${real}_${suffix}.sql (delete it)"
    found_superseded=true
  fi
done
[ "$found_superseded" = false ] && echo "  none"
