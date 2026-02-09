#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p .git/hooks
cp githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "[install-githooks] installed .git/hooks/pre-commit"
