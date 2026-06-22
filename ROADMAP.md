# Keystone — Roadmap

Single source of truth for what's planned, in priority order. Final decisions only.
Shipped items move to **Done** with their version.

> **Live progress lives in this file.** Finishing a chunk = tick its box below + commit.
> New session? Read only this file for full context — no repo scan needed.

## v1.1.0 — Progress

- [x] 1. Menu + Settings + themes + liquid-glass nav   — live on dev
- [x] 2. Folder reorg (architect/ + tech/)             — on release/v2
- [ ] 3. Settings Data selector + Home swap            ← NEXT
- [ ] 4. Tech-card render + Java taxonomy + 1st Java section
- [ ] 5. Remaining Java sections
- [ ] 6. Deepen 360 answers

Dev:  keystone-dev.vercel.app  (release/v2, integration)
Prod: keystone-lake.vercel.app (main, frozen)

Deferred (not blocking v1.1.0): detailed-section reading-UI design · Python/React (post-Java-pilot).

## Branching & deploys

- **`main`** — production (v1.x). Frozen except hotfixes + release merges. Live at
  `keystone-lake.vercel.app`. Real users depend on it — keep it error-free.
- **`release/v2`** — long-lived integration branch for the v2 initiative. All feature
  branches merge here. v1.1.0 is the first release shipped from this line; many more to come.
- **Feature branches** (`feat/*`) → merge into `release/v2`, never into `main`.
- **Dev preview** — Vercel project `keystone-dev` tracks `release/v2` → `keystone-dev.vercel.app`.
  One persistent dev URL across all releases (not per-release).
- **Release** — when a version is ready, merge `release/v2` → `main`, tag, deploy production.

## Next — v1.1.0

Two banks in one app — keep the architect bank pure, add a tech-reference bank for
early-round (tech-lead / mid-level) screening. Pilot with Java.

**1. Structure — two banks**
- `questions/architect/` (today's 360, moved as-is) + `questions/tech/<stack>/` (java, python, …)
- Tech mirrors the architect *shape*: technology = section, topic = subsection; each stack has
  its own named sections that double as UI labels
- Slug ids for tech (`java.concurrency.01`) vs architect's numeric ids (`4.1.01`) — clean split,
  enforces separation, simplifies the validator
- Banks never interleave: no cross-links between architect and tech graphs

**2. Tech schema — slimmer, render-what-exists**
- Default card: question, quick_answer, key_points, common_trap, tags
- Optional on depth: detailed_answer, code, diagram, follow-up *questions only* (no mini-answers/links)
- Elastic disclosure: list → short answer → (relations if any) → (detail if earned);
  one-line questions stop at the short answer (no empty expand)

**3. Navigation**
- Menu: `Home · Settings`
- Settings: **Data** (Architect / Tech▸Java/Python…) + **Theme** (Dark / Light / Read) — both persisted locally
- Home: existing layout; content swaps to match the selected data

**4. Deepen existing 360 answers** (carried from original v1.1.0 scope)

**Open decisions (resolve before/at start):**
- Java's section taxonomy (the actual section list)
- Sequencing: folder reorg (its own branch) vs starting Java content first
- Detailed-section UI design — deferred as later design work
- Do Mock / spaced-repetition apply to the tech bank? (lean: Study/browse yes, SRS later)

## Later (Backlog)

_Versions assigned when each ships. Reserve 2.0.0 for a true redesign/breaking change._

- Search — find questions by text, tag, id
- PWA / offline — installable, works without network
- Export / share — export progress, share a single question
- Spaced-repetition tuning — make the 1/3/7-day intervals configurable
- Accessibility + tablet/mobile polish
- More tests

## Done

- v1.0.0 — MVP: 360 questions across 12 sections
