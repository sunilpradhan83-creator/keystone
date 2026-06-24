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
- **Locked taxonomy — 10 sections, language & runtime only** (Spring is its own bank,
  v1.3.0). Listed in frequency / build order for a very-senior / architect audience.
  Target ≈ **120 questions** total (~12 done in Concurrency; ~108 to write), ~2–3 per
  subsection. Per-section targets in (parens).

  1. **Concurrency** ✅ (12 — done) — Threads & Lifecycle · Synchronization & Locks ·
     Executors & Thread Pools · Concurrent Collections & Atomics · Memory Model & Visibility
  2. **JVM & Memory** ← next build target (~15) — Class loading & linking · Memory areas
     (heap/stack/metaspace) · Garbage collection (G1/ZGC) · GC tuning & monitoring ·
     Memory leaks & OOM diagnosis · JIT compilation & performance
  3. **Collections** (~12) — List/Set/Map implementations · HashMap internals
     (hashing, resize, treeify) · Iteration & fail-fast (ConcurrentModification) ·
     Ordering & sorting (Comparable/Comparator) · Choosing the right collection / performance
  4. **Core Language & OOP** (~15) — OOP principles (encapsulation/inheritance/polymorphism/
     abstraction) · Classes, interfaces & abstract classes · Object contracts
     (equals/hashCode/Comparable/Comparator) · Generics (bounds, wildcards, erasure,
     variance) · Enums · Access modifiers & immutability
  5. **Modern Java / Language Evolution** (~9) — Version timeline & LTS milestones ·
     New-feature deep-dives (records, sealed, pattern matching, var, text blocks, switch
     expressions) · Deprecated & Legacy FAQ
  6. **Streams & Functional** (~12) — Lambdas & functional interfaces · Stream API
     (intermediate/terminal ops) · Collectors & grouping · Optional · Laziness, parallel
     streams & pitfalls
  7. **Exceptions & Error Handling** (~9) — Exception hierarchy (checked vs unchecked) ·
     try/catch/finally & try-with-resources · Custom exceptions & best practices ·
     Error-handling design / resilience
  8. **Annotations & Reflection** (~8) — Built-in & meta-annotations · Custom annotations
     & retention · Reflection API · Dynamic proxies (bridge to AOP/Spring)
  9. **Standard Library / Utilities** (~10) — I/O & NIO (files, Path/Files, channels/
     buffers) · Networking (sockets, HttpClient) · Serialization (& alternatives) ·
     Date/Time (java.time) · Regex & text processing
  10. **Data Structures & Algorithms** (~18) — Complexity & trade-off analysis (Big-O,
      choosing the right structure) · Arrays & strings · Linked lists, stacks & queues ·
      Trees & graphs · Sorting & searching · Dynamic programming & greedy · Hashing & sets.
      Principal/architect lens (reasoning & trade-offs, not leetcode-grind); could spin out
      to its own bank later.
- **Standing rules:** (a) trap/obsolete questions stay in their home section, **tagged**
  (`tricky`, `deprecated`) — never moved or duplicated; (b) such questions are phrased the
  "old way" they're asked, and the answer must **name the trap / flag obsolescence** (via
  `common_trap` + detailed answer), not just explain functionality; (c) hands-on coding asks
  carry the `coding` tag — topic-coupled ones (singleton, LRU) stay in their home section,
  standalone problems live in the DSA section; `level` marks screening-basic vs design-hard.
- Slim render-what-exists schema (question + quick_answer required; detailed/code/
  key_points/common_trap optional). Next section to build: **JVM & Memory**.

**2. Deepen 360 architect answers**
- Raise depth/quality of the original 12 architect sections (carried from v1.1.0 scope).

## Next-but-one — v1.3.0

**Spring bank** (own bank, sibling to `architect` and `java` via the `DB` seam —
`questions/tech/spring/`, registered as `BANKS.spring` in app.js). Kept separate from
core Java: Java = language & runtime knowledge; Spring = framework on top, and
interviews treat them as separate rounds. Spring Core and Spring Boot are distinct
sections (DI/IoC/AOP/bean lifecycle vs. auto-config/starters/actuator/embedded server).
- Planned sections: Spring Core · Spring Boot · Web (MVC/WebFlux) · Data
  (JPA/transactions) · Security · Testing. Core + Boot land first.

## Later (Backlog)

_Versions assigned when each ships. Reserve 2.0.0 for a true redesign/breaking change._

- Python / React tech banks (after Java is fleshed out)
- Search — find questions by text, tag, id
- Tag-filter view — surface cross-cutting tags (`tricky`, `deprecated`, `coding`) as an
  on-demand filter over existing questions. Tags render today but aren't filterable (app.js).
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
