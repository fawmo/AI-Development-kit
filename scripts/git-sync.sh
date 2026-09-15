#!/usr/bin/env bash
# Automated Git stage, commit, and push utility for AI Development Kit

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Check git
if ! command -v git &>/dev/null; then
    echo -e "\033[0;31m[ERROR] Git is not installed or not found in PATH.\033[0m"
    exit 1
fi

# Detect branch & remote
BRANCH=$(git branch --show-current)
REMOTE=$(git remote | head -n 1)

echo -e "\033[0;36m\n==> AI Development Kit - Git Sync\033[0m"
echo -e "\033[0;90mBranch: ${BRANCH} | Remote: ${REMOTE:-None}\033[0m"

# Status check
STATUS=$(git status --porcelain)

if [ -z "$STATUS" ]; then
    UNPUSHED=""
    if [ -n "$REMOTE" ]; then
        UNPUSHED=$(git log "${REMOTE}/${BRANCH}..${BRANCH}" --oneline 2>/dev/null || true)
    fi
    if [ -z "$UNPUSHED" ]; then
        echo -e "\033[0;32m[SUCCESS] Working tree clean and up to date. Nothing to sync.\033[0m"
        exit 0
    fi
fi

# Show status
if [ -n "$STATUS" ]; then
    echo -e "\033[0;36m\n==> Detected changes:\033[0m"
    git status --short

    # Message resolution
    MSG="$1"
    if [ -z "$MSG" ]; then
        DEFAULT_MSG="chore(toolkit): sync updates ($(date '+%Y-%m-%d %H:%M'))"
        read -r -p "Enter commit message (Press Enter for default: '$DEFAULT_MSG'): " INPUT_MSG
        MSG="${INPUT_MSG:-$DEFAULT_MSG}"
    fi

    echo -e "\033[0;36m\n==> Staging files...\033[0m"
    git add .

    echo -e "\033[0;36m\n==> Committing: '$MSG'...\033[0m"
    git commit -m "$MSG"
fi

# Push
if [ -n "$REMOTE" ]; then
    echo -e "\033[0;36m\n==> Checking remote updates...\033[0m"
    git fetch "$REMOTE" "$BRANCH" --quiet 2>/dev/null || true
    
    echo -e "\033[0;36m\n==> Pushing to ${REMOTE}/${BRANCH}...\033[0m"
    git push "$REMOTE" "$BRANCH"
    echo -e "\033[0;32m[SUCCESS] Successfully pushed to ${REMOTE}/${BRANCH}!\033[0m"
fi

echo -e "\033[0;32m\nAll operations completed successfully.\033[0m\n"
