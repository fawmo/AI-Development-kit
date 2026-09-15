#!/usr/bin/env bash
# AI Development Kit - Git Sync & AI Categorizer wrapper for Bash/WSL/macOS/Linux

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
node "$REPO_ROOT/scripts/sync.js" "$@"
