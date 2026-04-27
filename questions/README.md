# Keystone — Question Files

One JavaScript file per section. Each file exposes a global array variable consumed by `data.js`.

## File naming
```
section_1.js  → Section 1:  System Design
section_2.js  → Section 2:  Data & Storage
section_3.js  → Section 3:  NFRs
section_4.js  → Section 4:  Design Patterns
section_5.js  → Section 5:  Cloud & Infrastructure
section_6.js  → Section 6:  DevOps
section_7.js  → Section 7:  Security Architecture
section_8.js  → Section 8:  Data Engineering & ML
section_9.js  → Section 9:  AI & GenAI
section_10.js → Section 10: Governance
section_11.js → Section 11: Real-World Scenarios
section_12.js → Section 12: Behavioural
```

## Variable naming
Each file exposes a global variable:
```
SECTION_1_QUESTIONS  (array)
SECTION_2_QUESTIONS  (array)
... etc.
```

## How to add a new section
```bash
bash tools/add_section.sh 5 "Cloud & Infrastructure"
```
This handles everything automatically:
- Creates `questions/section_5.js`
- Adds the `<script>` tag in `index.html`
- Adds the spread operator in `data.js`

Then paste questions into the generated file.

## Validate
```bash
node tools/validate_questions.js
```

## Schema reference
See `README.md` at the project root for the full question schema.
