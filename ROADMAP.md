# Keystone — Roadmap

Single source of truth for what's planned, in priority order. Final decisions only.
Shipped items move to **Done** with their version.

> **Live progress lives in this file.** Finishing a chunk = tick its box below + commit.
> New session? Read only this file for full context — no repo scan needed.

## v1.2.0 — Progress

- [ ] 1. Remaining Java sections                      ← NEXT
- [ ] 2. Deepen 360 architect answers

Dev:  keystone-dev.vercel.app  (release/v2, integration)
Prod: keystone-lake.vercel.app (main, frozen on v1.0.0)

Deferred (not blocking v1.2.0): detailed-section reading-UI design · Python/React (post-Java).

## Branching & deploys

- **`main`** — production. Frozen on v1.0.0; nothing promoted here for now. Live at
  `keystone-lake.vercel.app`. Real users depend on it — keep it error-free.
- **`release/v2`** — long-lived integration branch for the v2 initiative. All feature
  branches merge here. v1.1.0 was the first version cut from this line; v1.2.0 builds on it.
- **Feature branches** (`feat/*`, `fix/*`) → merge into `release/v2`, never into `main`.
- **Dev preview** — Vercel project `keystone-dev` tracks `release/v2` → `keystone-dev.vercel.app`.
  One persistent dev URL across all releases (not per-release).
- **Promote to prod** — when ready, merge `release/v2` → `main`, tag, deploy production.
  (Holding off for now — versions are being cut on the dev line first.)

## Next — v1.2.0

Grow the tech bank beyond the Java Concurrency pilot, and raise the depth of the
original architect answers.

**1. Remaining Java sections**
- Add the rest of the Java taxonomy, section-by-section. Each section is its own
  `questions/tech/java/<topic>.js` exposing `JAVA_<TOPIC>`, registered in
  `java_data.js`, validated by `tools/validate_tech.js`.
- Locked taxonomy: Concurrency ✅ · Core Language & OOP · Collections & Generics ·
  JVM & Memory · Exceptions & I/O · Streams & Functional · Spring
- Slim render-what-exists schema (question + quick_answer required; detailed/code/
  key_points/common_trap optional). Suggested next section: **Collections & Generics**.

**2. Deepen 360 architect answers**
- Raise depth/quality of the original 12 architect sections (carried from v1.1.0 scope).

## Later (Backlog)

_Versions assigned when each ships. Reserve 2.0.0 for a true redesign/breaking change._

- Python / React tech banks (after Java is fleshed out)
- Search — find questions by text, tag, id
- PWA / offline — installable, works without network
- Export / share — export progress, share a single question
- Spaced-repetition tuning — make the 1/3/7-day intervals configurable
- Accessibility + tablet/mobile polish
- More tests

## Done

- **v1.1.0** — Two banks in one app (cut on `release/v2` / dev; not yet promoted to prod).
  - `architect/` + `tech/` split; Settings **Data** selector + active-bank seam (`DB`);
    presence-driven "render-what-exists" question card; Java **Concurrency** pilot
    (12 Qs across 5 subsections) + `validate_tech.js`.
  - Nav simplified — Study/Mock/Progress moved into the menu; **Quick Scan** mode
    (session-only, read-only pre-interview scan); per-bank progress **reset**;
    mock interview works for tech banks (slug-id fix).
- **v1.0.0** — MVP: 360 questions across 12 sections.
