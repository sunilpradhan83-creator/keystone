#!/bin/bash
# Keystone — Quick Deploy Script
# Run this after adding new questions:
# bash deploy.sh "Add Section 4 questions"

MESSAGE=${1:-"Update questions"}

echo "🚀 Deploying Keystone..."
echo "📝 Commit: $MESSAGE"

git add .
git commit -m "$MESSAGE"
git push

echo "✅ Pushed to GitHub"
echo "⏳ Vercel auto-deploying..."
echo "🌐 Live in ~30 seconds"
echo ""
echo "Your app: $(vercel ls --scope \
  $(vercel whoami) 2>/dev/null | \
  grep keystone | awk '{print $2}' | \
  head -1)"
