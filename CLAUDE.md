# KEYSTONE — Claude Working Context

## What this project is
Architect-level interview question bank. Static site (HTML/CSS/JS, no build step).
Owner: Sunny — preparing for Technical Architect / EM interviews.
**Goal: 362 fully connected questions across 12 sections.**

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

data.js assembles all sections:
```javascript
questions: [
  ...(typeof SECTION_4_QUESTIONS !== 'undefined' ? SECTION_4_QUESTIONS : []),
  ...(typeof SECTION_7_QUESTIONS !== 'undefined' ? SECTION_7_QUESTIONS : []),
]
```
index.html loads section files BEFORE data.js.

---

## Deploy workflow

**Every change — no exceptions:**
1. Validate: `node tools/validate_questions.js` — must be 0 errors
2. Test locally at `http://localhost:3000` — golden path + all affected edge cases
3. Get user sign-off at localhost
4. Deploy: `bash tools/deploy.sh "commit message"`
5. Get user sign-off at https://keystone-lake.vercel.app
6. Report: previous total → questions added → new total

**For question additions:**
Claude writes batch to section file → validate → user reviews in IDE → next subsection.
**Deploy only when full section is complete.** Never deploy mid-section.

---

## Question schema (all fields required)

```js
{
  id: "4.1.01",               // section.subsection.sequence
  section: 4,
  subsection: "4.1",
  level: "intermediate",      // basic | intermediate | advanced
  question: "...",
  quick_answer: "→ bullet\n→ bullet",   // → format, max 5 lines, interview-ready
  detailed_answer: "Full prose...\n\nParagraph 2...",
  key_points: ["point 1", "point 2"],   // 5-6 items
  hint: "Directional question — never give the answer",
  common_trap: "One concrete mistake most people make",
  follow_up_questions: [
    { text: "...", type: "linked", links_to: "4.1.02" },  // target MUST exist
    { text: "...", type: "inline", mini_answer: "..." }
  ],
  related: ["4.1.02", "4.2.01"],
  has_diagram: true,
  diagram: `ascii art`,
  has_code: true,
  code_language: "java",   // java|python|yaml|sql|bash|markdown|protobuf
  code_snippet: `// code`,
  tags: ["tag1", "tag2"]
}
```

**Critical generation rules:**
- NO ORPHANED LINKS — every `links_to` ID must already exist in the bank
- QUICK ANSWER — always → bullets, max 5 lines, standalone 30-second answer
- FOLLOW-UP linked: target exists → navigates to it. inline: no target → expands mini answer
- CROSS-SECTION LINKS — allowed and encouraged
- NEVER duplicate IDs — validator catches this
- HINT must be directional questions — never give the answer
- Missing comma at subsection boundaries is the most common parse error

---

## Show/hide rules

| Quick mode shows | Detailed mode shows |
|---|---|
| Question, Answer toggle | Question, Answer toggle |
| Quick answer | Detailed answer |
| Common trap | Key points |
| Self rating | Diagram, Code, Follow-ups, Related, Tags, Self rating |

Default mode: always QUICK on reveal. Toggle is session-only.

---

## Section boundary rules

- **3.5 vs 7**: Section 3.5 = security requirements/acceptance criteria. Section 7 = security design/implementation
- **5 vs 6**: Section 5 = infrastructure topology & cloud service selection. Section 6 = operating/shipping software on top
- **8 vs 9**: Section 8 = classical data engineering & ML (pre-LLM). Section 9 = LLM era
- **10 vs 12**: Section 10 = frameworks/processes an architect follows. Section 12 = personal stories/behaviours
- **Section 11**: Must draw from minimum 3 sections. Tag each question with sections covered
- **DevSecOps**: Security in pipelines → 6.7, not Section 7

---

## Content progress & deployment priority

| # | Section | Topic | Questions | Status |
|---|---|---|---|---|
| 4 | Design Patterns | | 52 | ✅ deployed |
| 7 | Security Architecture | | 36 | ✅ deployed |
| 1 | System Design & Architecture | | 0 | ⬜ next |
| 11 | Real-World Scenarios | | 1 stub | ⬜ |
| 12 | Behavioural & Soft Skills | | 1 stub | ⬜ |
| 2 | Data & Storage | | 0 | ⬜ |
| 5 | Cloud & Infrastructure | | 0 | ⬜ |
| 6 | DevOps & Platform Engineering | | 0 | ⬜ |
| 3 | Non-Functional Requirements | | 0 | ⬜ |
| 8 | Data Engineering & ML | | 0 | ⬜ |
| 9 | AI & GenAI Architecture | | 0 | ⬜ |
| 10 | Governance & Eng Leadership | | 0 | ⬜ |

**Total so far: 90 / 362 questions**

### Section detail — subsections & question targets

**Section 1 — System Design & Architecture (~42q)**
1.1 Distributed Systems Fundamentals | 1.2 Microservices Architecture | 1.3 Event-Driven Architecture
1.4 API Design & Integration | 1.5 Monolith to Microservices Migration | 1.6 Real-Time Systems Design | 1.7 Domain-Driven Design

**Section 2 — Data & Storage (~36q)**
2.1 DB Selection & Trade-offs | 2.2 Relational DBs | 2.3 NoSQL | 2.4 Caching | 2.5 Data Modeling
2.6 Replication & Consistency | 2.7 CQRS & Event Sourcing | 2.8 Partitioning & Sharding

**Section 3 — Non-Functional Requirements (~23q)**
3.1 Scalability | 3.2 Availability & Reliability | 3.3 Fault Tolerance | 3.4 Performance & Latency
3.5 Security Requirements | 3.6 Observability | 3.7 Disaster Recovery

**Section 4 — Design Patterns (~48q) ✅ DEPLOYED**
4.1 Microservice Patterns (12q) IDs: 4.1.01-4.1.12
4.2 Resilience Patterns (12q) IDs: 4.2.01-4.2.12
4.3 Messaging Patterns (10q) IDs: 4.3.01-4.3.10
4.4 Integration Patterns (9q) IDs: 4.4.01-4.4.09
4.5 Data Consistency (5q) IDs: 4.5.01-4.5.05
4.6 Concurrency Patterns (4q) IDs: 4.6.01-4.6.04

**Section 5 — Cloud & Infrastructure (~29q)**
5.1 Cloud Provider Concepts | 5.2 Compute | 5.3 Networking | 5.4 Storage
5.5 Managed Services | 5.6 Multi-Cloud & Hybrid | 5.7 Cost Optimisation | 5.8 IaC

**Section 6 — DevOps & Platform Engineering (~24q)**
6.1 CI/CD | 6.2 Containerisation | 6.3 Container Orchestration | 6.4 Deployment Strategies
6.5 SRE | 6.6 Platform Engineering | 6.7 DevSecOps | 6.8 Observability Implementation

**Section 7 — Security Architecture (~36q) ✅ DEPLOYED**
7.1 Authentication & Authorisation (8q) IDs: 7.1.01-7.1.08
7.2 Token Standards & Strategy (6q) IDs: 7.2.01-7.2.06
7.3 API Security (6q) IDs: 7.3.01-7.3.06
7.4 Zero Trust Architecture (4q) IDs: 7.4.01-7.4.04
7.5 Secrets Management (4q) IDs: 7.5.01-7.5.04
7.6 Network Security (4q) IDs: 7.6.01-7.6.04
7.7 Threat Modeling (4q) IDs: 7.7.01-7.7.04

**Section 8 — Data Engineering & ML (~24q)**
8.1 Data Pipeline Design | 8.2 Stream Processing | 8.3 Data Lake & Warehouse
8.4 ML Platform Design | 8.5 Data Quality & Observability

**Section 9 — AI & GenAI Architecture (~26q)**
9.0 LLM Foundations | 9.1 LLM Integration Patterns | 9.2 RAG Architecture
9.3 Agentic Systems | 9.4 AI Gateway & Model Routing | 9.5 AI Security & Guardrails | 9.6 Vector DBs

**Section 10 — Governance & Eng Leadership (~21q)**
10.1 ADRs | 10.2 Tech Debt | 10.3 Build vs Buy | 10.4 Stakeholder Communication
10.5 Team Structuring | 10.6 Architecture Review | 10.7 Engineering Principles

**Section 11 — Real-World Scenarios (~31q)**
11.1 Design from Scratch | 11.2 Scale Existing System | 11.3 Migrate Legacy | 11.4 Diagnose Incidents
Rule: each question must draw from minimum 3 sections

**Section 12 — Behavioural & Soft Skills (~22q)**
12.1 Conflict & Disagreement | 12.2 Influencing Without Authority | 12.3 Failure & Ambiguity
12.4 Stakeholder Management | 12.5 Mentorship | 12.6 Prioritisation | 12.7 Ownership

---

## Existing cross-section links (deployed → not-yet-deployed)

These render as inline until target section is deployed, then auto-upgrade to linked navigation.

| From | To | Topic |
|---|---|---|
| 4.1.04, 4.1.07 | 1.2.01 | Strangler Fig / DB per Service → Microservices |
| 4.3.01 | 1.3.01 | Messaging → EDA |
| 4.3.05 | 1.3.02 | Outbox vs Kafka Tx → Exactly-once |
| 4.1.05, 4.1.12 | 2.6.01 | Migration Tx / 2PC → Data Replication |
| 4.5.01 | 2.1.01 | CAP → DB Selection |
| 4.2.01, 4.2.03, 4.3.02 | 3.3.01 | Circuit Breaker / Bulkhead / DLQ → Fault Tolerance |
| 4.1.11, 4.3.04 | 5.2.01 | Service Discovery / Competing Consumers → Compute |
| 4.1.06 | 6.3.01 | Sidecar → Container Orchestration |
| 4.4.04 | 6.4.01 | Strangler Fig Integration → Deployment |
| 4.4.07 | 7.3.01 | Retry + Idempotency → API Security |
| 4.4.01 | 7.1.01 | BFF → Auth |
| 4.3.03, 4.3.06, 4.3.10 | 8.2.01 | Kafka / Message Ordering / Back-pressure → Stream Processing |

---

## Key decisions made

- **jsdom over Playwright** — Playwright requires system libs unavailable in WSL without sudo
- **`package.json` committed, `package-lock.json` gitignored** — lock file is reproducible anytime
- **CLAUDE.md committed** — project working context belongs in version control
- **Memory files not committed** — user-level preferences live in `~/.claude/projects/.../memory/`
- **Batches written directly to section file** — never rendered in chat (token efficiency)
- **Subsection by subsection generation** — safer cross-links, easier review, catches quality issues early
