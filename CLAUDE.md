# KEYSTONE — Claude Working Context

## What this project is
A production-quality architect-level interview question bank. Static site (HTML/CSS/JS, no build step). Deployed on Vercel, source on GitHub.

- **Production URL:** https://keystone-lake.vercel.app
- **GitHub:** https://github.com/sunilpradhan83-creator/keystone

---

## Folder structure

```
keystone/
├── index.html, app.js, style.css, data.js   ← app (served to browser)
├── questions/                                ← question data (one file per section)
│   ├── section_4.js
│   ├── section_7.js
│   ├── section_11.js
│   └── section_12.js
├── tools/                                    ← dev tooling (never served)
│   ├── validate_questions.js
│   ├── deploy.sh
│   └── add_section.sh
├── package.json                              ← jsdom dev dependency (committed)
└── CLAUDE.md                                 ← this file
```

- `node_modules/`, `package-lock.json` → gitignored (reproducible via `npm install`)
- `.claude/` → gitignored

---

## Deploy workflow

**Every change — no exceptions:**
1. Make the code change
2. Validate: `node tools/validate_questions.js` — must be 0 errors
3. Test locally at `http://localhost:3000` — test the golden path + all affected edge cases
4. Get user sign-off at localhost
5. Deploy: `bash tools/deploy.sh "commit message"`
6. Get user sign-off at https://keystone-lake.vercel.app

**For question additions only (user-approved shortcut for active sessions):**
User adds questions to the section file in VS Code → tells Claude "section X.Y added" → Claude runs validate + deploy in one shot, no interruptions.

---

## Question schema

Each question object in `questions/section_N.js`:

```js
{
  id: "4.1.01",               // section.subsection.sequence
  section: 4,
  subsection: "4.1",
  level: "intermediate",      // beginner | intermediate | advanced
  question: "...",
  quick_answer: "→ bullet\n→ bullet",
  detailed_answer: "Full prose explanation...",
  key_points: ["point 1", "point 2"],
  hint: "Analogy or scenario that makes it click",
  common_trap: "What candidates get wrong",
  follow_up_questions: [
    { text: "...", type: "linked", links_to: "4.1.02" },
    { text: "...", type: "inline", mini_answer: "..." }
  ],
  related: ["4.1.02", "4.2.01"],
  has_diagram: true,
  diagram: `ascii art`,       // only if has_diagram: true
  has_code: false,
  tags: ["tag1", "tag2"]
}
```

All question objects must be comma-separated inside the exported array. Missing comma at subsection boundaries is the most common parse error.

---

## Content progress

### Section 4 — Distributed Systems & Architecture Patterns

| Subsection | Topic | Questions | Status |
|---|---|---|---|
| 4.1 | Microservice Patterns | 12 | ✅ committed + deployed |
| 4.2 | Resilience Patterns | 12 | ✅ committed + deployed |
| 4.3 | Messaging Patterns | 10 | ✅ committed + deployed |
| 4.4 | API Design / Integration Patterns | 9 | ✅ committed + deployed |
| 4.5 | Data Consistency Patterns | 5 | ⏳ written, not yet committed |
| 4.6 | Concurrency Patterns | 4 | ⏳ written, not yet committed |

### Other sections (stub questions only — to be filled)
- Section 7, 11, 12 — 1 question each

---

## Key decisions made

- **jsdom over Playwright** — Playwright requires system libs unavailable in WSL without sudo. jsdom works fine for DOM logic testing.
- **`package.json` committed, `package-lock.json` gitignored** — package.json is the spec (source of truth); lock file is reproducible anytime.
- **CLAUDE.md committed** — project working context belongs in version control so every Claude session starts with full context automatically.
- **Memory files not committed** — user-level preferences live in `~/.claude/projects/.../memory/`, not in the repo.
