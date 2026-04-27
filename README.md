# KEYSTONE — Architect Interview Question Bank

A self-contained, offline-first interview prep tool for senior engineers and architects. Dark-themed, zero dependencies, works by double-clicking `index.html`.

---

## 1. What is Keystone

KEYSTONE is a spaced-repetition question bank covering 12 topic areas of software architecture: distributed systems, data storage, design patterns, cloud, DevOps, security, ML, GenAI, governance, real-world scenarios, and behavioural interviews.

Features:
- **Study mode** — work through questions section by section with a built-in thinking timer, hint system, and scratchpad
- **Mock interview** — timed sessions with configurable sections, difficulty, and question count
- **Spaced repetition** — self-rating (Weak / OK / Strong) schedules each question for review in 1, 3, or 7 days
- **Progress tracking** — per-section confidence bars, streak counter, activity grid
- **Focus mode** — distraction-free single-question view

---

## 2. Run Locally

**Option A — Double-click (simplest)**
```
Open index.html in your browser.
```

**Option B — VS Code Live Server**
1. Install the "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

**Option C — Python**
```bash
cd /path/to/keystone
python3 -m http.server 3000
# then open http://localhost:3000
```

**Option D — Node (npx serve)**
```bash
npx serve .
```

---

## 3. Add Questions

Questions live in `questions/section_X.js` — one file per section.

### Add a new section
```bash
bash tools/add_section.sh 5 "Cloud & Infrastructure"
```
This creates `questions/section_5.js`, adds the script tag to `index.html`, and wires the spread into `data.js` automatically. Then paste questions into the generated file.

### Question schema
```js
{
  id: "4.2.05",          // "section.subsection.sequence" — zero-pad sequence to 2 digits
  section: 4,            // must match a sections[].id
  subsection: "4.2",     // must match a subsections[].id
  level: "intermediate", // "basic" | "intermediate" | "advanced"
  question: "...",
  quick_answer: "→ point one\n→ point two\n→ point three",
  detailed_answer: "Paragraph one.\n\nParagraph two.\n→ sub-point",
  key_points: ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  hint: "Directional hint — not the answer.",
  common_trap: "One concrete mistake interviewers see.",
  follow_up_questions: [
    { text: "...", type: "linked", links_to: "4.2.06" },
    { text: "...", type: "inline", mini_answer: "Brief answer." }
  ],
  related: ["4.2.01", "3.3.01"],
  has_diagram: false,
  has_code: true,
  code_language: "java",   // java | python | yaml | sql | bash
  code_snippet: `// your code here`,
  tags: ["tag1", "tag2"]
}
```

Rules:
- Every `links_to` value must match an existing question `id`
- If `has_diagram: false`, omit the `diagram` field
- If `has_code: false`, omit `code_language` and `code_snippet`

### Validate before deploying
```bash
node tools/validate_questions.js
```

---

## 4. Deploy

```bash
bash tools/deploy.sh "your commit message"
```

This runs validation first, then commits and pushes to GitHub. Vercel auto-deploys on push — live at **https://keystone-lake.vercel.app** in ~30 seconds.

---

## 5. Export / Import Progress

Progress is stored in `localStorage` under the key `keystone_progress`.

**Export:**
```js
copy(localStorage.getItem('keystone_progress'))
```

**Import:**
```js
localStorage.setItem('keystone_progress', '<paste your JSON here>');
location.reload();
```

**Reset:**
Use the Reset button on the Progress screen, or:
```js
localStorage.removeItem('keystone_progress');
location.reload();
```

---

## 6. File Structure

```
keystone/
├── index.html          — All 5 screens (Home, Section, Question, Mock, Progress)
├── style.css           — Dark-theme design system, all animations
├── app.js              — Application logic (navigation, timer, spaced rep, mock)
├── data.js             — Assembles all section files into KEYSTONE_DATA
├── questions/          — One JS file per section (the question bank)
│   ├── section_4.js
│   ├── section_7.js
│   └── ...
├── tools/              — Dev tooling (not shipped, not the app)
│   ├── add_section.sh      — Scaffold a new section file
│   ├── deploy.sh           — Validate + commit + push
│   ├── validate_questions.js
│   └── test_mode_logic.js
├── package.json        — Dev dependencies (jsdom for tests)
└── vercel.json         — Static deployment config
```

No build step. No framework. Open `index.html` and go.
