#!/bin/bash
# Keystone — Deploy Script
# Usage: bash tools/deploy.sh "commit message"

set -e
MESSAGE=${1:-"Update Keystone"}

echo ""
echo "🔑 KEYSTONE — Deploying"
echo "────────────────────────────────"
echo "Commit: $MESSAGE"
echo ""

# Validate first
echo "Step 1: Validating questions..."
node "$(dirname "$0")/validate_questions.js"
if [ $? -ne 0 ]; then
  echo "❌ Validation failed. Fix errors first."
  exit 1
fi

# Stage and commit
echo "Step 2: Committing..."
git add .
git commit -m "$MESSAGE"

# Push
echo "Step 3: Pushing to GitHub..."
git push

echo ""
echo "✅ Deployed successfully"
echo "🌐 Vercel deploying — live in ~30 seconds"
echo ""
