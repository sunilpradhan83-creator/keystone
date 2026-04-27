#!/bin/bash
# Keystone — Add Section Script
# Usage: bash add_section.sh 4 "Design Patterns"
# This script is called by Claude Code when adding a new section

set -e

SECTION_NUM=$1
SECTION_NAME=$2
FILE="questions/section_${SECTION_NUM}.js"
VAR="SECTION_${SECTION_NUM}_QUESTIONS"

if [ -z "$SECTION_NUM" ]; then
  echo "Usage: bash add_section.sh NUMBER NAME"
  echo "Example: bash add_section.sh 4 'Design Patterns'"
  exit 1
fi

# Check if file already exists
if [ -f "$FILE" ]; then
  echo "✅ $FILE already exists"
  echo "   Skipping file creation"
  echo "   Questions will be appended by Claude Code"
else
  echo "Creating $FILE..."
  cat > "$FILE" << EOF
// questions/section_${SECTION_NUM}.js
// Section ${SECTION_NUM}: ${SECTION_NAME}
// Added: $(date +%Y-%m-%d)

const ${VAR} = [

  // Questions added by Claude Code below

];
EOF
  echo "✅ Created $FILE"
fi

# Check if script tag already in index.html
if grep -q "section_${SECTION_NUM}.js" index.html; then
  echo "✅ Script tag already in index.html"
else
  echo "Adding script tag to index.html..."
  sed -i "s|<!-- ── ADD NEW SECTIONS ABOVE THIS LINE -->|<script src=\"questions/section_${SECTION_NUM}.js\"></script>\n  <!-- ── ADD NEW SECTIONS ABOVE THIS LINE -->|g" index.html
  echo "✅ Script tag added to index.html"
fi

# Check if spread already in data.js
if grep -q "SECTION_${SECTION_NUM}_QUESTIONS" data.js; then
  echo "✅ Spread already in data.js"
else
  echo "Adding spread to data.js..."
  sed -i "s|// ── ADD NEW SECTIONS BELOW ──────────────|// Section ${SECTION_NUM}: ${SECTION_NAME}\n    ...(typeof ${VAR} !== 'undefined' ? ${VAR} : []),\n\n    // ── ADD NEW SECTIONS BELOW ──────────────|g" data.js
  echo "✅ Spread added to data.js"
fi

echo ""
echo "✅ Section ${SECTION_NUM} infrastructure ready"
echo "   File: $FILE"
echo "   Now paste questions into $FILE"
echo ""
