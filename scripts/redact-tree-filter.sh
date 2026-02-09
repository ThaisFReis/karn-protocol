#!/usr/bin/env bash
set -euo pipefail

# Used by git history rewrite to remove contract IDs / wallet addresses / seeds from committed text.
# Notes:
# - We intentionally skip Soroban `test_snapshots/` directories (they contain deterministic synthetic addresses).
# - We redact to "all-A" StrKey-like placeholders so they are non-sensitive and can be allowlisted by scanners.

C_REDACTED="CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
G_REDACTED="GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
S_REDACTED="SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"

export C_REDACTED G_REDACTED S_REDACTED

# Remove local tooling config if it ever got committed.
rm -f .claude/settings.local.json 2>/dev/null || true

git ls-files -z | while IFS= read -r -d '' f; do
  case "$f" in
    */test_snapshots/*) continue ;;
  esac

  # Only mutate text files.
  if LC_ALL=C grep -Iq . "$f"; then
    perl -i -pe '
      BEGIN {
        $C=$ENV{C_REDACTED};
        $G=$ENV{G_REDACTED};
        $S=$ENV{S_REDACTED};
      }
      s/\bC[A-Z0-9]{55}\b/$C/g;
      s/\bG[A-Z0-9]{55}\b/$G/g;
      s/\bS[A-Z0-9]{55}\b/$S/g;
      # Fix an earlier bad redaction that appended quotes.
      s/\b([CGS]A{55})"+/$1/g;
    ' "$f" || true
  fi
done
