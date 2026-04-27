# Keystone — Question Files

One JavaScript file per section.
Each file contains questions for that section.

## File naming
section_1.js  → Section 1: System Design
section_2.js  → Section 2: Data & Storage
section_3.js  → Section 3: NFRs
section_4.js  → Section 4: Design Patterns
section_5.js  → Section 5: Cloud & Infrastructure
section_6.js  → Section 6: DevOps
section_7.js  → Section 7: Security Architecture
section_8.js  → Section 8: Data Engineering & ML
section_9.js  → Section 9: AI & GenAI
section_10.js → Section 10: Governance
section_11.js → Section 11: Real-World Scenarios
section_12.js → Section 12: Behavioural

## Variable naming
Each file exposes a global variable:
  SECTION_1_QUESTIONS  (array)
  SECTION_2_QUESTIONS  (array)
  ... etc.

## How to add a new section
1. Create questions/section_X.js
2. Add script tag in index.html
   (before data.js script tag)
3. Add spread operator in data.js
   questions array

## Schema reference
See data.js for full field documentation.
