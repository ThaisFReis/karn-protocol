#!/usr/bin/env bash
set -euo pipefail

# Blocks committing/publishing Stellar identifiers:
# - Contract IDs: C + 55 base32 chars
# - Public keys:  G + 55 base32 chars
# - Secret seeds: S + 55 base32 chars
#
# This is intentionally conservative. It scans only common text-like extensions
# and excludes known generated/vendor directories.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[scan-sensitive] scanning for Stellar identifiers (C*/G*/S*)..."

PATTERN='\\b[CGS][A-Z0-9]{55}\\b'

# Grep include set: tune here if needed.
INCLUDES=(
  '--include=*.md'
  '--include=*.txt'
  '--include=*.sh'
  '--include=*.yml'
  '--include=*.yaml'
  '--include=*.json'
  '--include=*.ts'
  '--include=*.tsx'
  '--include=*.js'
  '--include=*.mjs'
  '--include=*.cjs'
  '--include=*.toml'
  '--include=*.env'
  '--include=*.env.*'
  '--include=.env*'
  '--include=Dockerfile*'
)

EXCLUDE_DIRS=(
  '--exclude-dir=.git'
  '--exclude-dir=contracts/target'
  '--exclude-dir=sdk/dist'
  '--exclude-dir=sdk/node_modules'
  '--exclude-dir=node_modules'
  '--exclude-dir=build'
  '--exclude-dir=dist'
  '--exclude-dir=.next'
  '--exclude-dir=coverage'
  # Contains deterministic/synthetic addresses used by Soroban tests.
  '--exclude-dir=test_snapshots'
  '--exclude-dir=frontend'
  '--exclude-dir=templates'
)

# Notes:
# - Many Soroban snapshots contain synthetic "CAAAAA..."/"GAAAAA..." addresses. We ignore all-A forms.
# - If you want to block those too, remove the grep -v line below.

set +e
matches="$(grep -RInE "${INCLUDES[@]}" "${EXCLUDE_DIRS[@]}" "$PATTERN" . 2>/dev/null | grep -vE '\\b[CGS]A{55}\\b')"
status=$?
set -e

if [ $status -eq 0 ] && [ -n "$matches" ]; then
  echo "[scan-sensitive] FAILED: found potential sensitive identifiers:"
  echo "$matches"
  echo ""
  echo "[scan-sensitive] Please replace with placeholders (e.g. C.../G.../S...) or environment variables."
  exit 1
fi

echo "[scan-sensitive] OK: no sensitive identifiers found."
