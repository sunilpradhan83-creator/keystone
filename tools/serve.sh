#!/bin/bash
# Keystone — Local dev server
# Usage: bash tools/serve.sh

echo ""
echo "🔑 KEYSTONE — Local Server"
echo "────────────────────────────────"
echo "Opening at http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""

npx serve "$(dirname "$0")/.." -l 3000
