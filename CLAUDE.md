# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# KEYSTONE — Claude Working Context

Architect-level interview question bank. Static site (HTML/CSS/JS, no build step). 360 questions across 12 sections — MVP complete.

- **Production:** https://keystone-lake.vercel.app
- **GitHub:** https://github.com/sunilpradhan83-creator/keystone
- **Local dev:** `npm start` → http://localhost:3000
- **Testing:** jsdom only — Playwright unavailable in WSL without sudo

---

## Deploy workflow

1. `node tools/validate_questions.js` — must be 0 errors
2. Test at http://localhost:3000 — get user sign-off
3. `bash tools/deploy.sh "commit message"`
4. Confirm live at https://keystone-lake.vercel.app — get user sign-off
5. **Deploy only when a full section is complete.** Never mid-section.
6. Write question batches directly to section file — never render in chat.

---

## Question schema

```js
{
  id: "4.1.01",               // section.subsection.sequence — zero-pad sequence to 2 digits
  section: 4,
  subsection: "4.1",
  level: "intermediate",      // basic | intermediate | advanced
  question: "...",
  quick_answer: "→ bullet\n→ bullet",   // → format, max 5 lines, standalone 30-sec answer
  detailed_answer: "Prose...\n\nParagraph 2...",
  key_points: ["point 1", "point 2"],   // 5–6 items
  hint: "Directional question — never give the answer",
  common_trap: "One concrete mistake most people make",
  follow_up_questions: [
    { text: "...", type: "linked", links_to: "4.1.02", mini_answer: "..." },
    { text: "...", type: "inline", mini_answer: "..." }
  ],
  related: ["4.1.02", "4.2.01"],
  has_diagram: false,         // if true, diagram field required
  has_code: false,            // if true, code_language + code_snippet required
  code_language: "java",      // java|python|yaml|sql|bash|markdown|protobuf
  code_snippet: `// code`,
  tags: ["tag1", "tag2"]
}
```

**Generation rules:**
- Every `links_to` ID must already exist — no orphaned links
- Every follow-up (linked AND inline) must include `mini_answer` — a real short answer, never "Open the card"
- `quick_answer` → bullets only, max 5 lines, readable standalone in 30 seconds
- `hint` must be a question, never the answer
- Missing comma at subsection boundaries is the most common parse error

---

## Section boundary rules

- **3.5 vs 7**: 3.5 = security requirements/acceptance criteria. 7 = security design/implementation
- **5 vs 6**: 5 = infrastructure topology & cloud service selection. 6 = operating/shipping software on top
- **8 vs 9**: 8 = classical data engineering & ML (pre-LLM). 9 = LLM era
- **10 vs 12**: 10 = frameworks/processes an architect follows. 12 = personal stories/behaviours
- **Section 11**: Must draw from minimum 3 sections. Tag each question with sections covered
- **DevSecOps**: Security in pipelines → 6.7, not Section 7

---

## Existing question ID ranges (for cross-linking)

```
S1  (42q): 1.1.01-06 | 1.2.01-06 | 1.3.01-06 | 1.4.01-06 | 1.5.01-06 | 1.6.01-06 | 1.7.01-06
S2  (36q): 2.1.01-05 | 2.2.01-04 | 2.3.01-05 | 2.4.01-05 | 2.5.01-04 | 2.6.01-05 | 2.7.01-04 | 2.8.01-04
S3  (23q): 3.1.01-04 | 3.2.01-03 | 3.3.01-04 | 3.4.01-03 | 3.5.01-03 | 3.6.01-03 | 3.7.01-03
S4  (52q): 4.1.01-12 | 4.2.01-12 | 4.3.01-10 | 4.4.01-09 | 4.5.01-05 | 4.6.01-04
S5  (27q): 5.1.01-04 | 5.2.01-04 | 5.3.01-04 | 5.4.01-03 | 5.5.01-03 | 5.6.01-02 | 5.7.01-03 | 5.8.01-04
S6  (20q): 6.1.01-04 | 6.2.01-03 | 6.3.01-04 | 6.4.01-02 | 6.5.01-02 | 6.6.01-02 | 6.7.01    | 6.8.01-02
S7  (36q): 7.1.01-08 | 7.2.01-06 | 7.3.01-06 | 7.4.01-04 | 7.5.01-04 | 7.6.01-04 | 7.7.01-04
S8  (24q): 8.1.01-05 | 8.2.01-05 | 8.3.01-05 | 8.4.01-05 | 8.5.01-04
S9  (26q): 9.0.01-04 | 9.1.01-05 | 9.2.01-04 | 9.3.01-04 | 9.4.01-03 | 9.5.01-03 | 9.6.01-03
S10 (21q): 10.1.01-03 | 10.2.01-03 | 10.3.01-03 | 10.4.01-03 | 10.5.01-03 | 10.6.01-03 | 10.7.01-03
S11 (31q): 11.1.01-08 | 11.2.01-08 | 11.3.01-08 | 11.4.01-07
S12 (22q): 12.1.01-03 | 12.2.01-03 | 12.3.01-03 | 12.4.01-03 | 12.5.01-03 | 12.6.01-03 | 12.7.01-04
```
