// ═══════════════════════════════════════════════════
// SECTION 10 — Governance & Engineering Leadership
// 21 questions across 7 subsections (10.1–10.7)
// ═══════════════════════════════════════════════════

const SECTION_10_QUESTIONS = [

  // ─────────────────────────────────────────────────
  // 10.1 Architecture Decision Records (3q)
  // ─────────────────────────────────────────────────

  {
    id: "10.1.01",
    section: 10,
    subsection: "10.1",
    level: "basic",
    question: "What is an Architecture Decision Record (ADR) and when should you write one?",
    quick_answer: "→ An ADR is a short document capturing a significant architectural decision: context, decision, and consequences\n→ Write one when: the decision is hard to reverse, affects multiple teams, or the reasoning is non-obvious\n→ ADRs are NOT meeting notes — they capture the WHY, not just the what\n→ Trigger: any decision that would take a new joiner days to reconstruct from code alone\n→ Store in the repo — decisions live with the code they govern",
    detailed_answer: "An Architecture Decision Record is a structured document that captures a significant architectural choice, the context that drove it, the options considered, and the consequences of the decision taken. The format is deliberately concise — typically one to two pages — to lower the barrier to writing them.\n\nWhen to write an ADR:\n- Any decision that is hard or expensive to reverse (database choice, messaging platform, authentication strategy)\n- Decisions that span multiple teams or services\n- Decisions where the reasoning would be non-obvious to a future reader of the code\n- Decisions where there was meaningful disagreement or trade-off analysis\n\nWhat ADRs are not:\n- They are not comprehensive design documents or RFCs — they capture the decision, not a full specification\n- They are not meeting minutes — meeting notes capture discussions; ADRs capture outcomes with reasoning\n- They are not approval gates — though some organisations use them that way\n\nThe canonical format (Michael Nygard's original):\n1. Title — short, imperative (\"Use PostgreSQL for transactional data\")\n2. Status — Proposed / Accepted / Deprecated / Superseded\n3. Context — the forces, constraints, and situation that demanded a decision\n4. Decision — what was decided, stated directly\n5. Consequences — what becomes easier, what becomes harder, what is now accepted\n\nStoring ADRs in the repository (typically docs/decisions/ or adr/) is critical: decisions travel with the code, are version-controlled, and appear in git blame. If stored in Confluence or a wiki, they drift and become orphaned.\n\nA team with good ADR hygiene can onboard a new architect in days rather than months — the reasoning behind every major choice is discoverable.",
    key_points: [
      "ADRs capture WHY, not just WHAT — the reasoning is the value, not the conclusion alone",
      "Write when: irreversible, multi-team, or non-obvious from code alone",
      "Canonical fields: Title, Status, Context, Decision, Consequences",
      "Store in the repo alongside the code — never in a wiki that drifts",
      "Keep them short — one to two pages maximum; lower barrier = more ADRs written",
      "ADRs have a lifecycle: Proposed → Accepted → Superseded; mark old ones explicitly"
    ],
    hint: "If you joined a team today and needed to understand why they chose Kafka over RabbitMQ, where would you look — and what would an ADR give you that the code doesn't?",
    common_trap: "Writing ADRs only for decisions you agree with. The most valuable ADRs capture decisions where there was real disagreement — they prevent teams from relitigating the same debate every six months.",
    follow_up_questions: [
      { text: "What's the difference between an ADR and an RFC?", type: "inline", mini_answer: "An RFC (Request for Comments) is pre-decision — it seeks feedback before a choice is made. An ADR is post-decision — it records the outcome and rationale. RFCs can generate ADRs." },
      { text: "How do you prevent ADRs from becoming stale?", type: "inline", mini_answer: "Mark status explicitly (Superseded, Deprecated). Link superseding ADR in the old one. Run periodic ADR audits during architecture reviews. Stale ADRs are better than none — just mark them." },
      { text: "How do ADR decisions relate to architecture reviews?", type: "linked", links_to: "10.6.01" }
    ],
    related: ["10.1.02", "10.1.03", "10.6.01"],
    has_diagram: false,
    has_code: false,
    tags: ["adr", "governance", "documentation", "decision-making"]
  },

  {
    id: "10.1.02",
    section: 10,
    subsection: "10.1",
    level: "intermediate",
    question: "How do you structure an ADR to maximise its usefulness — and what makes most ADRs useless?",
    quick_answer: "→ Useful ADR: specific context, named alternatives rejected with reasons, explicit consequences (good AND bad)\n→ Useless ADR: vague context, one option listed, no trade-offs stated, no 'why not' for rejected options\n→ The options-considered section is the most skipped and most valuable\n→ Name the people who made the decision — accountability matters\n→ State consequences honestly: 'this makes X harder' is as important as 'this enables Y'",
    detailed_answer: "Most ADRs fail not because they're written, but because they omit the critical reasoning that makes them valuable. A well-structured ADR reads like a defensible brief, not a done-deal announcement.\n\nWhat makes ADRs useless:\n\n1. Vague context: \"We needed a better solution\" tells a reader nothing about the forces that constrained the decision. Good context names specific constraints: latency requirements, team size, existing infrastructure, budget limits.\n\n2. Single option listed: If only one option appears, the ADR is post-rationalisation, not a decision record. Every real decision involves trade-offs. Name at least two alternatives and explain why each was rejected.\n\n3. Missing 'why not': \"We chose Kafka\" is half the ADR. \"We rejected RabbitMQ because X\" and \"We rejected Pulsar because Y\" is the other half — and more valuable for future readers.\n\n4. Consequences listed as only positive: Every architectural decision has a downside. If your ADR says only \"this will scale better and be easier to maintain,\" it's not honest. Good ADRs say: \"this means every new service must implement a consumer group — that's operational overhead we accept.\"\n\n5. No authorship or date: Without authors and date, the ADR cannot be contextualised. Knowing a decision was made in 2019 with a three-person team changes how a 2025 reader interprets it.\n\nExtended format for complex decisions:\n- Context: specific forces, non-negotiables, and constraints\n- Decision drivers: ranked criteria used to evaluate options\n- Options considered: name, pros, cons, reason rejected\n- Decision: the chosen option and rationale\n- Consequences: positive, negative, and neutral\n- Compliance: how adherence to this decision will be verified\n\nThe compliance section is often skipped but valuable — it answers \"how will we know if this decision is being followed?\" without requiring human enforcement.",
    key_points: [
      "Options-considered section is most commonly skipped and most valuable — always name what you rejected",
      "Context must be specific: name the constraints, not just 'we needed something better'",
      "Consequences must include negatives — one-sided ADRs breed distrust",
      "Include authors and date — contextualises the decision for future readers",
      "Decision drivers make the trade-off criteria explicit and reusable",
      "Compliance section answers 'how do we know this is being followed?' — prevents silent drift"
    ],
    hint: "If a new architect reads your ADR three years from now and says 'I can see exactly why they ruled out option B' — what would the ADR need to contain?",
    common_trap: "Writing the ADR after the decision is politically settled and omitting options that were seriously considered. The options section becomes a rubber-stamp list rather than a genuine trade-off record.",
    follow_up_questions: [
      { text: "What is an ADR and when should you write one?", type: "linked", links_to: "10.1.01" },
      { text: "How do you handle ADRs when the decision spans multiple teams with conflicting preferences?", type: "inline", mini_answer: "Escalate to a cross-team architecture review. Document dissenting views in the ADR explicitly. 'Team A preferred X, Team B preferred Y — we chose Y because Z' is a valid and valuable record." },
      { text: "How do ADRs connect to architecture review boards?", type: "linked", links_to: "10.6.02" }
    ],
    related: ["10.1.01", "10.1.03", "10.6.01", "10.6.02"],
    has_diagram: false,
    has_code: false,
    tags: ["adr", "governance", "documentation", "trade-offs"]
  },

  {
    id: "10.1.03",
    section: 10,
    subsection: "10.1",
    level: "advanced",
    question: "How do you manage the ADR lifecycle — superseding, deprecating, and keeping them discoverable at scale?",
    quick_answer: "→ Status transitions: Proposed → Accepted → Superseded (by ADR-NNN) or Deprecated\n→ When superseding: new ADR references old; old ADR updated to point forward\n→ Discoverability at scale: index file, consistent naming (NNNN-title.md), and tooling (adr-tools, log4brains)\n→ Never delete old ADRs — archaeological value is real; superseded decisions explain why current ones exist\n→ Audit cadence: review ADR index during architecture guild or quarterly planning",
    detailed_answer: "At small scale, a flat folder of ADR markdown files works well. At scale — multiple teams, hundreds of ADRs, years of history — lifecycle management becomes a serious concern.\n\nStatus model:\n- Proposed: under discussion, not yet binding\n- Accepted: ratified and in effect\n- Deprecated: no longer in effect but not replaced (context changed, the constraint it addressed no longer exists)\n- Superseded by ADR-0047: replaced by a newer decision; the old ADR is preserved but cross-linked\n\nSuperseding correctly:\n1. Write the new ADR first, assign it a number\n2. In the new ADR, link to the old: \"This supersedes ADR-0031\"\n3. Update the old ADR's status: \"Superseded by ADR-0047\" and add a link\n4. The old reasoning is preserved — future readers can trace the evolution\n\nNever delete: The archaeological value of old ADRs is underappreciated. \"Why did they build this auth layer so strangely?\" — ADR-0019 from 2018 says it was GDPR-driven. Deleting it loses that context permanently.\n\nDiscoverability at scale:\n- Consistent naming: 0001-use-postgresql.md, 0002-event-driven-architecture.md\n- Index file (README.md in the ADR directory) listing all ADRs with one-line summaries\n- Tooling: adr-tools (CLI for creating/linking ADRs), log4brains (generates a searchable site from markdown ADRs)\n- Tag taxonomy: tag ADRs by domain (security, data, infrastructure) to enable filtering\n\nMulti-repo organisations:\nWhen teams span many repos, cross-repo ADRs become complex. Options:\n- Central ADR repo for organisation-wide decisions; each service repo for service-local decisions\n- Monorepo: a single docs/decisions/ tree with subdirectories per domain\n- ADR registry in Backstage/internal developer portal — searchable, indexed, linked to services\n\nGovernance cadence:\nAssign an architecture guild or chapter to review the ADR index quarterly. Questions to ask: Are there decisions being made without ADRs? Are any ADRs contradicting each other? Are Proposed ADRs stalling without resolution?",
    key_points: [
      "Status lifecycle: Proposed → Accepted → Superseded/Deprecated — never delete, always cross-link",
      "When superseding: update both old (forward link) and new ADR (backward reference)",
      "Naming convention (NNNN-title.md) and an index file are the minimum for discoverability",
      "Tooling: adr-tools for creation, log4brains for searchable site, Backstage for portal integration",
      "Multi-repo: central repo for org-wide ADRs, service repo for service-local; avoid duplication",
      "Quarterly ADR audit: unresolved Proposed, contradictions, and decisions made without records"
    ],
    hint: "If you have 200 ADRs across 15 repos and a new engineer needs to understand why the organisation chose event sourcing, how do they find the right ADR without reading all 200?",
    common_trap: "Updating the old ADR's status but forgetting to add the forward link to the superseding one. A reader finds ADR-0031 with status 'Superseded' but no indication of where to go next — dead end.",
    follow_up_questions: [
      { text: "What is an ADR and when should you write one?", type: "linked", links_to: "10.1.01" },
      { text: "How do you prevent ADR sprawl in a monorepo with 50+ teams?", type: "inline", mini_answer: "Classify ADRs by scope: org-wide (all teams must follow), domain-wide (one business domain), service-local. Only org-wide ADRs require architecture guild approval. Service-local ADRs are team-autonomous. This prevents every team decision from becoming a governance bottleneck." },
      { text: "How does ADR discoverability relate to architecture reviews?", type: "linked", links_to: "10.6.01" }
    ],
    related: ["10.1.01", "10.1.02", "10.6.01"],
    has_diagram: false,
    has_code: false,
    tags: ["adr", "governance", "lifecycle", "discoverability", "tooling"]
  },

  // ─────────────────────────────────────────────────
  // 10.2 Technical Debt (3q)
  // ─────────────────────────────────────────────────

  {
    id: "10.2.01",
    section: 10,
    subsection: "10.2",
    level: "basic",
    question: "What is technical debt and how do you categorise it?",
    quick_answer: "→ Technical debt: the implied cost of rework caused by choosing a faster but less complete solution now\n→ Deliberate debt: conscious shortcuts taken with intent to repay (spike-and-stabilise)\n→ Accidental debt: discovered later — poor design, outdated dependencies, accumulated coupling\n→ Reckless debt: no plan to repay, often from deadline pressure without technical input\n→ Categorise by: impact area (reliability, velocity, security, operability) and repayment urgency",
    detailed_answer: "The term 'technical debt' was coined by Ward Cunningham in 1992 as a deliberate metaphor: like financial debt, a small amount taken consciously and repaid quickly is fine — but left to compound, it becomes crippling.\n\nCunningham's original quadrant (extended by Martin Fowler):\n\n|  | Deliberate | Inadvertent |\n|---|---|---|\n| Reckless | \"We don't have time for design\" | \"What's layering?\" |\n| Prudent | \"Ship now, refactor later\" | \"Now we know how we should have done it\" |\n\nPrudent-deliberate debt is the only debt you take on intentionally with a repayment plan. All other quadrants are problematic.\n\nPractical categorisation by impact:\n\n1. Reliability debt: brittle code, missing error handling, no retries — manifests as production incidents\n2. Velocity debt: spaghetti architecture, missing abstractions, no tests — manifests as slow delivery\n3. Security debt: unpatched dependencies, weak auth, missing validation — manifests as vulnerabilities\n4. Operability debt: no observability, manual deployments, no runbooks — manifests as long MTTR\n5. Dependency debt: outdated libraries, end-of-life runtimes, deprecated APIs — manifests as upgrade pain\n\nWhy categorisation matters:\nDifferent types of debt require different stakeholders and urgency. Security debt is often non-negotiable (compliance, risk). Velocity debt affects engineering productivity directly. Reliability debt maps to SLA obligations. Categorising makes the business case clearer.",
    key_points: [
      "Technical debt = implied cost of choosing faster over better; compounds like financial interest",
      "Fowler's quadrant: Reckless vs Prudent × Deliberate vs Inadvertent — only one quadrant is acceptable",
      "Categorise by impact: reliability, velocity, security, operability, dependency debt",
      "Deliberate debt requires an explicit repayment plan — without one, it's reckless",
      "Accidental debt must be measured before it can be managed — visibility is the first step",
      "Debt language that resonates with business: 'drag on delivery speed', 'incident risk', 'compliance exposure'"
    ],
    hint: "If someone says 'we have a lot of technical debt but we can't stop shipping features to pay it down' — how would you break that deadlock?",
    common_trap: "Treating all technical debt as equal urgency. A missed test here and an unpatched critical CVE are both 'tech debt' but require completely different response timescales.",
    follow_up_questions: [
      { text: "How do you make the business case for paying down technical debt?", type: "linked", links_to: "10.2.02" },
      { text: "What's the relationship between technical debt and observability?", type: "linked", links_to: "3.6.01" },
      { text: "Can technical debt be a valid trade-off during a spike or prototype?", type: "inline", mini_answer: "Yes — prudent-deliberate debt is legitimate when the intent to repay is explicit and tracked. The spike proves feasibility; the stabilisation sprint replaces the prototype. The debt item must be created immediately, not 'later'." }
    ],
    related: ["10.2.02", "10.2.03", "3.6.01"],
    has_diagram: false,
    has_code: false,
    tags: ["technical-debt", "governance", "refactoring", "architecture-health"]
  },

  {
    id: "10.2.02",
    section: 10,
    subsection: "10.2",
    level: "intermediate",
    question: "How do you make a credible business case for paying down technical debt?",
    quick_answer: "→ Translate debt into business language: delivery slowdown, incident rate, mean time to recover (MTTR)\n→ Quantify where possible: 'X% of sprint capacity lost to firefighting', 'Y incidents/month traced to this module'\n→ Frame as investment with return: 'paying this down reduces incident rate by Z, saving N hours/month'\n→ Use the 'broken window' argument for reliability debt: neglect compounds visibility and decay\n→ Never ask for a 'tech debt sprint' — embed repayment into feature work (Boy Scout Rule)",
    detailed_answer: "The failure mode for engineers pitching technical debt is using technical language with business stakeholders. 'Our event bus has no dead-letter queue handling' means nothing to a CPO. 'We lose 1.2% of orders silently and have no way to recover them' lands immediately.\n\nTranslation framework:\n\n1. Velocity impact: Measure cycle time before and after major debt-heavy modules. If your checkout module (high debt) takes 4 sprints to change and your payments module (clean) takes 1 sprint, the delta is measurable. \"This module costs us 3× the delivery time of comparable work.\"\n\n2. Incident correlation: If 70% of your production incidents trace to three modules, those modules are reliability debt that has a direct cost. Map incidents to root cause modules. Incident MTTR × engineer hours × frequency = annual cost.\n\n3. Compliance and security exposure: Frame unpatched dependencies or missing audit trails as risk, not preference. \"We are 14 versions behind on our auth library, which has three known CVEs. This is a compliance risk under our ISO 27001 commitment.\"\n\n4. Opportunity cost: Debt that takes 2 sprints to work around before every feature is a hidden tax on every roadmap item. \"We cannot ship feature X without first addressing module Y — it's a blocker, not optional.\"\n\nHow to present:\n- Use a debt register with severity and estimated repayment cost\n- Show trend: is debt growing or stable? Growing debt compounds indefinitely\n- Propose 20% capacity rule: a sustainable allocation of 20% of every sprint to debt reduction rather than a one-time 'debt sprint'\n- Tie to a specific business outcome: 'paying this down unblocks the mobile refactor on Q3 roadmap'\n\nThe 'debt sprint' trap: Never ask for a dedicated sprint to pay down all debt. It feels like lost productivity to business stakeholders, scope inevitably expands, and you'll never get it again. Embed debt repayment as part of every sprint that touches the affected area.",
    key_points: [
      "Translate to business language: velocity drag, incident rate, MTTR, compliance risk — never technical jargon",
      "Quantify: sprint capacity lost, incidents per month, hours of MTTR per incident, CVE exposure",
      "Debt register: visible, prioritised, estimated — invisible debt cannot be managed or funded",
      "20% sprint allocation beats a one-time debt sprint — sustainable and less politically fraught",
      "Opportunity cost framing: 'we cannot ship X without addressing Y' is harder to defer than 'we should improve Y'",
      "Boy Scout Rule for embed: leave code cleaner than you found it — normalises repayment as part of feature work"
    ],
    hint: "If your CPO asks why delivery has slowed 30% over the past year — how would you connect that to technical debt in a way they would fund?",
    common_trap: "Presenting a debt list without prioritisation or business impact. A 50-item list with no severity or cost estimate reads as engineering navel-gazing, not an investment proposal.",
    follow_up_questions: [
      { text: "What is technical debt and how do you categorise it?", type: "linked", links_to: "10.2.01" },
      { text: "How do you prioritise which technical debt to address first?", type: "linked", links_to: "10.2.03" },
      { text: "How do you track technical debt across multiple teams without it becoming a bureaucratic burden?", type: "inline", mini_answer: "Use a lightweight debt register in your backlog system (Jira/Linear) with three fields: impact area, estimated effort, business risk. Teams own their local debt; architecture guild owns cross-cutting debt. Monthly 10-minute review in leadership sync keeps it visible." }
    ],
    related: ["10.2.01", "10.2.03", "10.4.01"],
    has_diagram: false,
    has_code: false,
    tags: ["technical-debt", "stakeholder-management", "business-case", "governance"]
  },

  {
    id: "10.2.03",
    section: 10,
    subsection: "10.2",
    level: "advanced",
    question: "How do you prioritise which technical debt to address — and when is it better to rewrite than to refactor?",
    quick_answer: "→ Prioritise by: business impact of failure × frequency of code touch × cost to fix\n→ High-touch + high-debt modules deserve priority: every feature through them costs debt tax\n→ Refactor when: structure is salvageable, logic is understood, tests exist or can be added\n→ Rewrite when: the domain model is wrong, the original is undocumented and untestable, coupling is total\n→ Joel's Law: rewrites are high-risk — never rewrite a working system without a strangler fig strategy",
    detailed_answer: "Prioritising technical debt requires a framework that business stakeholders can audit and that engineers can execute without demoralisation.\n\nPrioritisation matrix:\n\n| Dimension | Weight | Signal |\n|---|---|---|\n| Frequency of change | High | Modules changed every sprint incur the debt tax constantly |\n| Business risk of failure | High | Auth, payments, checkout — failure here is existential |\n| Cost to fix | Medium | High-cost items need phasing; low-cost items can be Boy-Scout'd |\n| Compliance exposure | High for security | Non-negotiable when CVEs or audit findings are involved |\n| Developer experience | Medium | Modules that demoralise engineers cause attrition and hiring cost |\n\nCombine: Priority = (ChangeFrequency × BusinessRisk) / FixCost\n\nRefactor vs Rewrite:\n\nRefactor when:\n- The existing code is understood by at least one engineer\n- The domain model is roughly correct but the implementation is messy\n- You can add tests before touching the code (characterisation tests / golden master)\n- The scope is bounded — you're not refactoring 200 files at once\n\nRewrite when:\n- The domain model is fundamentally wrong and cannot be saved incrementally\n- The code is completely untestable and undocumented with no surviving author\n- The technology is end-of-life and cannot be upgraded incrementally\n- Coupling is so total that any change breaks unrelated parts\n\nRewrite risks (Joel's Law):\nJoel Spolsky's famous warning: 'Never rewrite from scratch.' The reason: the old code, however ugly, contains years of bug fixes and edge case handling that aren't documented anywhere. A rewrite starts from zero and rediscovers every production bug. Rewrites routinely overrun by 3-5x and sometimes never ship.\n\nMitigation — Strangler Fig:\nIf a rewrite is unavoidable, use the Strangler Fig pattern: build the replacement incrementally alongside the old system, routing traffic progressively. This gives you a live test harness, reduces risk, and allows rollback.\n\nWhen to stop refactoring:\nIf a module has been 'being refactored' for more than two quarters with no deployable improvement, it has become a zombie project. Set a deadline: ship an improvement or cancel the work and address it differently.",
    key_points: [
      "Priority = (ChangeFrequency × BusinessRisk) / FixCost — high-touch, high-risk, low-cost first",
      "Refactor: domain model is right, code is understandable, tests can be added, scope is bounded",
      "Rewrite: domain model is wrong, code is untestable/undocumented, tech is end-of-life, coupling is total",
      "Joel's Law: never rewrite from scratch — years of edge-case fixes live in the ugly code",
      "Strangler Fig for unavoidable rewrites: incremental replacement with live traffic routing and rollback",
      "Zombie refactor rule: two quarters with no deployable progress → kill or reframe the approach"
    ],
    hint: "If you have two debt items — one in a module nobody touches but is critical at year-end, and one in a module every sprint touches but is low criticality — which do you fix first and why?",
    common_trap: "Choosing to rewrite the most complex, highest-debt module first. Rewrites of complex systems almost always overrun. Start with a smaller adjacent system to build the pattern and team confidence.",
    follow_up_questions: [
      { text: "How do you make the business case for technical debt reduction?", type: "linked", links_to: "10.2.02" },
      { text: "What is the Strangler Fig pattern for incremental replacement?", type: "linked", links_to: "1.5.01" },
      { text: "How do you write characterisation tests before refactoring untested legacy code?", type: "inline", mini_answer: "Characterisation tests capture existing behaviour (including bugs) as a snapshot before touching the code. Run the system, record outputs for known inputs, write assertions on those outputs. The tests freeze current behaviour — any refactoring that breaks them must be investigated before proceeding." }
    ],
    related: ["10.2.01", "10.2.02", "1.5.01"],
    has_diagram: false,
    has_code: false,
    tags: ["technical-debt", "refactoring", "rewrite", "prioritisation", "strangler-fig"]
  },

  // ─────────────────────────────────────────────────
  // 10.3 Build vs Buy (3q)
  // ─────────────────────────────────────────────────

  {
    id: "10.3.01",
    section: 10,
    subsection: "10.3",
    level: "basic",
    question: "What is the build vs buy decision and what primary factors drive it?",
    quick_answer: "→ Build: you write and own the software. Buy: you license or consume it from a third party (SaaS, OSS)\n→ Buy when: the problem is not a competitive differentiator and a good solution already exists\n→ Build when: the capability is core to your competitive advantage and off-the-shelf doesn't fit\n→ Key factors: strategic fit, total cost of ownership (TCO), time-to-value, vendor risk, customisation need\n→ Default heuristic: buy commodity, build differentiator",
    detailed_answer: "The build vs buy decision is one of the most consequential an architect makes — it determines where engineering effort goes and what you take on as long-term ownership.\n\nThe core heuristic:\n- Commodity problems (email delivery, auth, payments, search) → buy. These are solved, well-tested, and maintained by vendors whose entire business depends on them working.\n- Differentiating capabilities (your unique recommendation algorithm, your proprietary risk scoring model, your domain-specific workflow engine) → build. These are your moat.\n\nPrimary factors:\n\n1. Strategic fit: Is this capability a competitive differentiator? If yes, buying means ceding control of your moat to a vendor.\n\n2. Total cost of ownership (TCO): Build cost = development + maintenance + infrastructure + oncall. Buy cost = licence + integration + migration risk + vendor price changes. TCO often favours buying for the first 2-3 years, but can flip after that as vendor lock-in compounds.\n\n3. Time-to-value: Building takes months to years. Buying can be days to weeks. For a startup proving a hypothesis, buying is almost always correct. For a mature platform with a proven hypothesis, build may be justified.\n\n4. Customisation requirement: If you need 80% of the vendor's features but your 20% customisation is non-negotiable and the vendor can't support it, you may need to build — or reconsider whether that 20% is truly required.\n\n5. Vendor risk: What happens if the vendor raises prices 5×? What if they are acquired? What if they are acquired by a competitor? Vendor concentration risk is underestimated.\n\n6. Data gravity: If the vendor holds your data, egress cost and regulatory compliance can make switching prohibitively expensive.\n\nCommon build vs buy errors:\n- Building commodity infrastructure (auth, email, search) instead of buying, wasting engineering on solved problems\n- Buying and then over-customising until you've effectively built on top of a vendor, inheriting both build and buy costs\n- Not modelling TCO beyond year one — vendor costs often increase post-lock-in",
    key_points: [
      "Default heuristic: buy commodity (auth, email, payments), build differentiator (your unique moat)",
      "TCO must span 3-5 years — vendor costs compound post-lock-in; build costs peak early then stabilise",
      "Time-to-value favours buy in early stages; a proven hypothesis justifies build investment",
      "Customisation trap: heavy customisation of a vendor product means you're paying for both build and buy",
      "Vendor risk: price changes, acquisition, concentration — always model the exit cost before committing",
      "Data gravity: if the vendor holds your data, switching cost grows non-linearly over time"
    ],
    hint: "If your competitor uses the same vendor you're evaluating, does that mean you should build instead — or does it mean the vendor is proven and safe to use?",
    common_trap: "Treating 'we need control' as a reason to build without modelling what that control actually costs. Control over a commodity is expensive and delivers no competitive value.",
    follow_up_questions: [
      { text: "How do you evaluate a specific vendor or open-source tool against building in-house?", type: "linked", links_to: "10.3.02" },
      { text: "What are the long-term risks of over-relying on vendor solutions?", type: "linked", links_to: "10.3.03" },
      { text: "Is open source always a 'build' decision?", type: "inline", mini_answer: "No — consuming OSS without modification is closer to 'buy': you get a maintained solution, but you own the integration and operations. Forking and modifying OSS is closer to 'build': you lose upstream upgrades and take on maintenance ownership." }
    ],
    related: ["10.3.02", "10.3.03"],
    has_diagram: false,
    has_code: false,
    tags: ["build-vs-buy", "governance", "vendor-management", "strategy"]
  },

  {
    id: "10.3.02",
    section: 10,
    subsection: "10.3",
    level: "intermediate",
    question: "How do you evaluate a third-party vendor or open-source tool against building in-house?",
    quick_answer: "→ Define requirements first: functional must-haves, non-negotiables (compliance, SLA, data residency)\n→ Score candidates on: feature fit, operational maturity, community/vendor health, integration cost, exit cost\n→ Build a TCO model over 3 years: licence + integration + migration + ongoing ops vs. build cost\n→ Run a spike (time-boxed PoC) to surface integration friction before committing\n→ Evaluate exit: how do you get your data back and how long does it take?",
    detailed_answer: "A rigorous vendor evaluation avoids two failure modes: analysis paralysis (evaluating forever) and premature commitment (choosing on demos alone).\n\nEvaluation framework:\n\nStep 1 — Define requirements before looking at vendors\nWrite down: functional must-haves, functional nice-to-haves, non-negotiables (data residency, SOC 2, GDPR compliance, SLA minimums), and your integration constraints (existing stack, language, protocol).\n\nEvaluating without this step means you evaluate what vendors are good at, not what you need.\n\nStep 2 — Scorecard (weighted)\n- Feature fit against must-haves (weight: high)\n- SLA and reliability track record (weight: high for production-critical)\n- Security certifications: SOC 2 Type II, ISO 27001, GDPR DPA availability (weight: high for regulated)\n- Community/vendor health: active maintainers, release cadence, GitHub stars trend, company funding runway\n- Integration cost: SDK quality, API design, documentation quality, existing connectors\n- Operational maturity: monitoring, alerting, support response time, incident history\n- Exit cost: data export format, migration tooling, time to switch\n- Price model: predictability, scaling behaviour (does cost grow linearly or exponentially with usage?)\n\nStep 3 — TCO model (3-year horizon)\nYour build estimate: design + development + test + infrastructure + year-1 maintenance + year-2/3 evolution.\nVendor estimate: one-time integration + licence (scaled to projected usage) + support tier + migration cost if you ever switch.\n\nBuilds often win TCO after year 3 for high-usage, differentiating capabilities. Vendors win for commodity features at any volume.\n\nStep 4 — Time-boxed spike\nBefore committing, run a 2-week PoC: integrate the vendor into your actual tech stack, simulate your peak load, test the edge cases in your requirements. The spike reveals integration friction that no demo will show.\n\nStep 5 — Evaluate the exit\n\"How do we leave if we need to?\" is the question most teams skip. Evaluate: export format, completeness of export, time to export at your projected data volume, migration tooling, and whether the contract imposes exit penalties or data retention limitations.",
    key_points: [
      "Define requirements before looking at vendors — evaluate against your needs, not their strengths",
      "Weighted scorecard: feature fit, SLA, security certs, vendor health, integration cost, exit cost",
      "TCO over 3 years: build cost vs licence + integration + migration + ops — model usage scaling",
      "Time-boxed spike (2 weeks): real integration in your stack reveals friction that demos hide",
      "Evaluate exit before committing: export format, migration time, contract exit clauses",
      "Vendor health check: funding runway, release cadence, community activity — a vendor going dark is a migration event"
    ],
    hint: "If the vendor demo looks perfect but you have three weeks to a decision — what is the single most important thing you should test in that time?",
    common_trap: "Evaluating against vendor-supplied benchmarks and demos instead of your own workload. Vendors optimise demos for their strengths. Your spike tests your requirements against their reality.",
    follow_up_questions: [
      { text: "What is the build vs buy decision framework?", type: "linked", links_to: "10.3.01" },
      { text: "What are the long-term risks of vendor over-reliance?", type: "linked", links_to: "10.3.03" },
      { text: "How do security certifications factor into vendor evaluation?", type: "linked", links_to: "3.5.01" }
    ],
    related: ["10.3.01", "10.3.03", "3.5.01"],
    has_diagram: false,
    has_code: false,
    tags: ["build-vs-buy", "vendor-evaluation", "TCO", "due-diligence"]
  },

  {
    id: "10.3.03",
    section: 10,
    subsection: "10.3",
    level: "advanced",
    question: "What are the long-term architectural risks of over-reliance on vendor solutions — and how do you mitigate them?",
    quick_answer: "→ Vendor lock-in: proprietary APIs, data formats, or protocols make switching prohibitively expensive\n→ Price leverage: once you're deeply integrated, vendors can reprice knowing exit cost is high\n→ Acquisition risk: vendor acquired by competitor — suddenly your infrastructure is hostile\n→ Roadmap misalignment: vendor priorities diverge from yours; you're stuck waiting or forking\n→ Mitigation: abstraction layers, open standards, exit readiness, multi-vendor hedging for critical paths",
    detailed_answer: "Vendor over-reliance is an architectural risk that grows invisibly until it becomes a crisis. The mitigation is not to avoid vendors — it's to architect for optionality.\n\nRisk taxonomy:\n\n1. API lock-in: Your code calls vendor-specific APIs directly. Every service is coupled to the vendor's interface. Switching means rewriting every integration point.\n\n2. Data format lock-in: Your data is stored in a vendor-proprietary format with no standard export. Bulk export is slow, incomplete, or requires vendor assistance.\n\n3. Ecosystem lock-in: The vendor's features are interconnected — to use feature A, you must use feature B, which requires feature C. Extracting any one part means extracting all.\n\n4. Price leverage: Once integration depth is high, the vendor knows your switching cost. Price increases of 2-5× are documented cases (especially post-acquisition or at contract renewal after 3+ years).\n\n5. Acquisition risk: Your payment processor is acquired by a company that competes with you. Your data warehouse vendor is acquired and support degrades. Your auth provider pivots and deprecates your tier.\n\n6. Roadmap divergence: The vendor prioritises enterprise customers with different needs. Features you need are never built.\n\nMitigation patterns:\n\nAbstraction layer / anti-corruption layer: Wrap vendor SDKs behind your own interface. Services call your interface; the vendor implementation is swappable. Cost: one indirection layer. Benefit: migration becomes a single implementation change, not a whole-codebase refactor.\n\nOpen standards preference: When evaluating vendors, prefer those using open standards (OpenID Connect over proprietary auth, S3-compatible object storage over proprietary, CloudEvents over proprietary event formats). Open standards mean multiple implementations and easier migration.\n\nExit readiness testing: Annually, simulate migrating away from your critical vendors. Does your data export work? Is your abstraction layer actually abstracted? Can you spin up an alternative in a sprint? The exercise reveals hidden coupling before a crisis does.\n\nMulti-vendor hedging for critical paths: For paths where vendor failure is catastrophic (payments, auth, CDN), dual-vendor with automatic failover. Cost: complexity. Benefit: no single vendor has leverage over uptime.\n\nContract terms: Negotiate: data export rights, portability clauses, price increase caps, SLA remedies, and termination rights. These cost nothing to add at signing and are worth significant leverage at renewal.",
    key_points: [
      "Lock-in types: API, data format, ecosystem — each compounds independently and together",
      "Price leverage grows with integration depth — model worst-case pricing at contract renewal",
      "Acquisition risk: any vendor can be acquired by a hostile party — maintain exit readiness",
      "Abstraction layer pattern: wrap vendor SDKs behind your interface — migration becomes a single swap",
      "Prefer open standards: easier to switch between multiple implementations (OIDC, S3, CloudEvents)",
      "Annual exit readiness test: simulate migration before you need to — exposes hidden coupling early"
    ],
    hint: "If your auth provider announced a 5× price increase effective in 90 days — what would determine whether you could migrate in time, and what would that decision have looked like 2 years ago?",
    common_trap: "Building abstraction layers around vendors but never testing whether the abstraction actually isolates the dependency. Teams discover at migration time that the 'abstraction' leaked vendor-specific concepts throughout.",
    follow_up_questions: [
      { text: "What is the build vs buy decision framework?", type: "linked", links_to: "10.3.01" },
      { text: "How does multi-cloud strategy hedge against cloud provider lock-in?", type: "linked", links_to: "5.6.01" },
      { text: "What contract terms should you negotiate to protect against vendor risk?", type: "inline", mini_answer: "Key clauses: data export rights (full, machine-readable, within 30 days of termination), price increase caps (e.g., CPI-indexed or max 10%/year), SLA with financial remedies, termination for convenience (not just cause), and most-favoured-nation pricing if you're a significant customer." }
    ],
    related: ["10.3.01", "10.3.02", "5.6.01"],
    has_diagram: false,
    has_code: false,
    tags: ["vendor-lock-in", "build-vs-buy", "risk-management", "architecture-governance"]
  },

  // ─────────────────────────────────────────────────
  // 10.4 Stakeholder Communication (3q)
  // ─────────────────────────────────────────────────

  {
    id: "10.4.01",
    section: 10,
    subsection: "10.4",
    level: "basic",
    question: "How do you communicate architecture decisions to non-technical stakeholders?",
    quick_answer: "→ Lead with business impact: 'this enables X' or 'this reduces risk of Y' — not 'we're using Kafka'\n→ Use analogies for technical concepts: event bus = postal service, cache = whiteboard vs. filing cabinet\n→ Structure: problem → options considered → decision → what it means for them\n→ Avoid acronyms and jargon — if you must use a term, define it in one sentence\n→ Send a written summary after verbal presentations — most stakeholders need to re-read before deciding",
    detailed_answer: "Non-technical stakeholders — CPOs, CFOs, legal, sales — make decisions based on risk, cost, and strategic fit. They cannot evaluate technical merit directly, so they need the translation.\n\nThe translation framework:\n\n1. Problem first, solution second\nDon't open with the solution. Open with the problem in business terms: \"Our current checkout process fails silently for 1.2% of orders, costing approximately £400K/month in lost revenue and refunds.\"\n\nOnce the problem lands, the solution becomes obvious motivation: \"We are proposing an event-driven queue that guarantees no order is lost and allows recovery of any failure within 15 minutes.\"\n\n2. Options and trade-offs in business terms\nStakeholders appreciate knowing you considered alternatives — it builds confidence. Frame options in cost, time, and risk: \"We evaluated three approaches. Option A costs £X and takes 8 weeks. Option B costs £Y and takes 4 weeks but introduces vendor dependency. We recommend Option A.\"\n\n3. Analogies\nTechnical concepts become accessible with the right analogy:\n- Microservices: \"separate specialist shops in a mall rather than one department store — each runs independently\"\n- Cache: \"keeping your most-used files on your desk instead of the filing cabinet downstairs\"\n- Event queue: \"the postal system — sender and receiver don't need to be available simultaneously\"\n\n4. What does it mean for them?\nEvery stakeholder has a different concern. CFO wants to know the cost. CPO wants to know the delivery timeline and feature impact. Legal wants to know the compliance and data handling implications. Address each stakeholder's concern explicitly.\n\n5. Written follow-up\nVerbal presentations are absorbed differently by different people. A concise one-page written summary after the presentation gives stakeholders time to re-read, share with their teams, and raise concerns without feeling put on the spot in a meeting.",
    key_points: [
      "Lead with business impact: revenue, risk, timeline — never lead with technology names",
      "Problem-first structure: state the business problem before presenting the solution",
      "Analogies bridge the gap — choose analogies from the stakeholder's domain, not yours",
      "Address each stakeholder's specific concern (CFO: cost; CPO: delivery; legal: compliance)",
      "Written follow-up after verbal presentations — most decisions are made during re-reading, not in the meeting",
      "Avoid jargon; if you must use a technical term, define it immediately in plain English"
    ],
    hint: "If you had to explain your decision to move from a monolith to microservices to a CFO in under 3 minutes — what would you say and what would you not say?",
    common_trap: "Assuming that simplifying technical language means dumbing things down. Non-technical stakeholders are often highly intelligent — they just lack domain vocabulary. Respect their intelligence while providing the translation they need.",
    follow_up_questions: [
      { text: "How do you manage disagreement between engineering and business stakeholders on technical direction?", type: "linked", links_to: "10.4.02" },
      { text: "How do you structure a written architecture decision summary for a CFO?", type: "inline", mini_answer: "One page maximum. Sections: Business problem (2-3 sentences), Decision (1 sentence), Cost and timeline, Risk if we don't do this, What changes for the business, What we need from you. No diagrams unless they're truly self-explanatory." },
      { text: "How do ADRs help with stakeholder communication over time?", type: "linked", links_to: "10.1.01" }
    ],
    related: ["10.4.02", "10.4.03", "10.1.01"],
    has_diagram: false,
    has_code: false,
    tags: ["stakeholder-communication", "governance", "influencing", "architecture-leadership"]
  },

  {
    id: "10.4.02",
    section: 10,
    subsection: "10.4",
    level: "intermediate",
    question: "How do you manage disagreement between engineering and business stakeholders on technical direction?",
    quick_answer: "→ Separate the problem (disagreement) from the positions (their solution vs. yours)\n→ Name the underlying concern: timeline? cost? risk? control? — often the real disagreement is there\n→ Bring data: measurable impact, incident rates, cost projections — opinions clash, data converges\n→ Find the smallest demonstrable step: PoC, pilot, or time-boxed experiment reduces the stakes of the decision\n→ Last resort: escalate with options — never as 'engineering vs. business' but as 'here are the trade-offs for leadership to choose'",
    detailed_answer: "Disagreement between engineering and business stakeholders on technical direction is a governance failure waiting to happen if mishandled — and a trust-building opportunity if handled well.\n\nDiagnose before you argue:\n\nMost engineering-business disagreements are not really about the technology. They're about:\n- Timeline: Business wants it fast; engineering says fast means fragile\n- Cost: Business sees a cheaper option; engineering sees a false economy\n- Control: Business wants to own the vendor relationship; engineering wants architectural control\n- Risk tolerance: Business accepts more risk than engineering is comfortable with\n\nAsk: \"What would need to be true for you to agree with our recommendation?\" This surfaces the underlying concern.\n\nBring evidence, not opinions:\n\nOpinions clash indefinitely. Data converges:\n- Show incident rates from comparable shortcuts taken previously\n- Show delivery velocity data — teams with high debt are slower\n- Show vendor TCO models — the 3-year cost is often different from the first-year cost\n- Reference industry cases — \"Company X made this choice and experienced Y\"\n\nReduce the stakes with a bounded experiment:\n\nIf the disagreement is about risk or uncertainty, propose a time-boxed experiment: \"Let's run a 4-week PoC. If it proves your concern unfounded, we proceed your way. If it confirms our concern, we revisit the approach.\"\n\nThis removes the adversarial dynamic — you're collaborating on gathering evidence rather than fighting over positions.\n\nThe escalation path (as a last resort):\n\nIf genuine disagreement persists, escalate properly: present the options with trade-offs to a senior decision-maker. Frame it as \"here are the options and what each one means for cost, timeline, and risk\" — not as \"engineering says X, business says Y.\" The framing determines whether it's a governance exercise or a political battle.\n\nWhat not to do:\n- Do not agree to something you know is architecturally wrong and then quietly do it your way\n- Do not refuse to engage and say \"that's impossible\" — that ends the conversation\n- Do not make the stakeholder feel they are incapable of understanding the technical argument",
    key_points: [
      "Diagnose first: most disagreements are about timeline, cost, control, or risk tolerance — not technology",
      "Ask 'what would need to be true for you to agree?' — surfaces the actual blocker",
      "Evidence beats opinions: incident data, velocity trends, TCO models, industry cases",
      "Bounded experiment: 4-week PoC to generate evidence instead of arguing positions",
      "Escalation: present options with trade-offs to senior leadership — never as engineering vs business",
      "Never agree to something architecturally wrong and implement it differently — this destroys trust"
    ],
    hint: "If a CPO insists on a 6-week deadline for a feature your team says needs 12 weeks — how do you respond without saying 'no' or saying 'yes' to something you can't deliver?",
    common_trap: "Winning the argument on technical merits while losing the relationship. Even if you're right, how you win matters — a stakeholder who feels steamrolled will find ways to bypass engineering in the future.",
    follow_up_questions: [
      { text: "How do you communicate architecture decisions to non-technical stakeholders?", type: "linked", links_to: "10.4.01" },
      { text: "How do you align multiple engineering teams on a shared architectural vision?", type: "linked", links_to: "10.4.03" },
      { text: "When should you escalate a technical disagreement and when should you just decide?", type: "inline", mini_answer: "Escalate when: the decision is irreversible, costs significant budget, or crosses team boundaries. Decide locally when: the stakes are bounded, you have clear mandate, and the decision is reversible. Never escalate to avoid responsibility for a decision you should own." }
    ],
    related: ["10.4.01", "10.4.03"],
    has_diagram: false,
    has_code: false,
    tags: ["stakeholder-communication", "conflict-resolution", "governance", "influencing"]
  },

  {
    id: "10.4.03",
    section: 10,
    subsection: "10.4",
    level: "advanced",
    question: "How do you align multiple engineering teams on a shared architectural vision when they have different priorities?",
    quick_answer: "→ Shared vision requires shared context: publish architecture principles, not just decisions\n→ Architecture guild or chapter: cross-team forum where architects meet regularly to align\n→ Golden paths: define the approved patterns for common problems — make the right thing the easy thing\n→ Federated decision-making: central alignment on principles, local autonomy on implementation\n→ Tech radar: visible, curated map of adopt/trial/hold/assess for technologies across the org",
    detailed_answer: "At scale, architectural alignment breaks down not through malice but through drift — teams optimising locally, making different choices for the same problems, and creating integration friction.\n\nArchitecture principles (not just decisions):\n\nDecisions are specific (\"use PostgreSQL\"). Principles are generative — they guide decisions that haven't been made yet:\n- \"Prefer managed services over self-operated infrastructure\"\n- \"Design for failure — assume any dependency can be unavailable\"\n- \"Own your data — never share a database between services\"\n\nPublishing principles gives teams a framework to make consistent decisions autonomously. Teams that understand why the principle exists apply it correctly to novel situations.\n\nArchitecture guild / chapter:\n\nA cross-team forum (one principal/staff engineer per team + principal architects) that meets regularly (biweekly or monthly) to:\n- Review new ADRs with cross-cutting impact\n- Discuss emerging technology choices\n- Surface patterns that should become golden paths\n- Audit for decisions that contradict principles\n\nThe guild is advisory by default, mandatory review for specific trigger categories (new data stores, new external dependencies, security-affecting changes).\n\nGolden paths:\n\nA golden path is a curated, opinionated path through a common problem: \"here is how to set up a new service, with templates, CI/CD, observability, and auth pre-wired.\" Teams can deviate, but the deviation requires an ADR.\n\nGolden paths work because they make the right architecture the easy architecture. Friction-free correct choices beat enforced standards.\n\nTech radar:\n\nA Thoughtworks-style tech radar is a visual, curated map of technologies across four rings:\n- Adopt: recommended for production use\n- Trial: evaluate for specific use cases; report back\n- Hold: do not start new projects with this technology\n- Assess: watch this space but don't use yet\n\nThe radar is updated quarterly by the guild, published org-wide, and used during vendor evaluation and new project setup.\n\nFederated model:\n\nCentral alignment on: principles, golden paths, and the tech radar. Local autonomy on: implementation details within those boundaries. Teams that want to deviate raise an ADR — the guild reviews, approves, or rejects with reasoning. This preserves team autonomy while maintaining coherence.",
    key_points: [
      "Architecture principles (generative) beat architecture decisions (specific) for alignment at scale",
      "Architecture guild: cross-team forum for ADR review, pattern alignment, and tech radar curation",
      "Golden paths: opinionated templates for common problems — make the right thing the easy thing",
      "Tech radar: adopt/trial/hold/assess taxonomy, updated quarterly, org-wide visibility",
      "Federated model: central principles + golden paths, local implementation autonomy with ADR for deviation",
      "Trigger categories: new data stores, new external dependencies, security changes → mandatory guild review"
    ],
    hint: "If three teams are independently building authentication for their services in three different ways — how do you bring alignment without taking away their autonomy?",
    common_trap: "Creating a centralised architecture team that must approve every decision. This creates a bottleneck, demoralises teams, and produces theoretical architecture that doesn't reflect reality. Enable, don't gatekeep.",
    follow_up_questions: [
      { text: "How do you manage disagreement between engineering and business stakeholders?", type: "linked", links_to: "10.4.02" },
      { text: "How do you run an effective architecture review board?", type: "linked", links_to: "10.6.02" },
      { text: "What is a Tech Radar and how is it maintained?", type: "inline", mini_answer: "A Tech Radar (Thoughtworks format) is a quarterly-published map of technologies in four rings: Adopt, Trial, Hold, Assess. The architecture guild curates it by reviewing team submissions, evaluating new technologies, and downgrading deprecated ones. Published publicly inside the org — usually as a web page with descriptions for each entry." }
    ],
    related: ["10.4.01", "10.4.02", "10.6.01", "10.6.02"],
    has_diagram: false,
    has_code: false,
    tags: ["stakeholder-alignment", "architecture-governance", "tech-radar", "golden-path", "federated-architecture"]
  },

  // ─────────────────────────────────────────────────
  // 10.5 Team Structuring (3q)
  // ─────────────────────────────────────────────────

  {
    id: "10.5.01",
    section: 10,
    subsection: "10.5",
    level: "basic",
    question: "What is Conway's Law and how does it affect system architecture?",
    quick_answer: "→ Conway's Law: organisations design systems that mirror their communication structures\n→ Practical effect: if three teams own a system, it will have three major components with interfaces mirroring team boundaries\n→ Inverse Conway Manoeuvre: deliberately design the team structure to produce the architecture you want\n→ If team structure is wrong, the architecture will resist change even when the code is right\n→ Team topology is an architectural decision — not just an HR or management decision",
    detailed_answer: "Conway's Law, stated by Melvin Conway in 1967: \"Any organisation that designs a system (in the broad sense) will inevitably produce a design whose structure is a copy of the organisation's communication structure.\"\n\nThis is not a guideline — it's an empirical observation about how sociotechnical systems evolve. It operates whether you intend it to or not.\n\nWhy it happens:\n\nTeams communicate across their boundaries via interfaces — APIs, contracts, meetings, tickets. These boundaries become the interfaces in the system. The path of least resistance for a team is to create a component that they own end-to-end. The result is that system boundaries align with team boundaries, not business domains.\n\nPractical examples:\n\n- Three backend teams and one frontend team → backend is split into three services with a monolithic frontend\n- A centralised database team → the database becomes a shared monolith even when the architecture specification says services should own their data\n- Separate iOS and Android teams → mobile feature implementations diverge even when the spec says they should be identical\n\nThe Inverse Conway Manoeuvre:\n\nIf Conway's Law is inevitable, use it deliberately. If you want a microservices architecture:\n1. Define the service boundaries by business domain\n2. Align team ownership to those domain boundaries\n3. Let Conway's Law produce the architecture you want\n\nThis is the core insight of Team Topologies (Skelton & Pais): team structure is not an output of organisational design — it's an input to architecture design.\n\nWarning:\n\nChanging architecture without changing team structure will fail. You can define any architecture on paper; if the team structure doesn't match, the gravitational pull of Conway's Law will drag the implementation back toward the team boundaries. This is why many microservices migrations produce distributed monoliths — the teams didn't change.\n\nArchitecture implication:\nWhen designing a new system or migrating an existing one, ask: what team structure will produce and maintain this architecture? If you can't answer that, your architecture is not implementable at the sociotechnical layer.",
    key_points: [
      "Conway's Law: system structure mirrors organisation communication structure — empirical, not a choice",
      "Inverse Conway Manoeuvre: define team structure to produce the desired architecture deliberately",
      "Shared database teams produce shared database monoliths regardless of architectural intent",
      "Microservices without matching team boundaries produce distributed monoliths",
      "Team topology is an architectural decision, not an organisational/HR decision",
      "Ask: 'what team structure will produce and sustain this architecture?' before finalising the design"
    ],
    hint: "If you're migrating from a monolith to domain-aligned microservices but your teams are still organised by technology layer (frontend, backend, database) — what will happen and why?",
    common_trap: "Treating team structure as fixed and designing around it. Conway's Law says the architecture will match the team structure — so if the team structure is wrong, no amount of technical design will produce the right architecture.",
    follow_up_questions: [
      { text: "How do you apply Team Topologies to structure teams for fast flow?", type: "linked", links_to: "10.5.02" },
      { text: "How do team boundaries relate to microservices design?", type: "linked", links_to: "1.2.01" },
      { text: "What is a distributed monolith and how do you avoid it?", type: "inline", mini_answer: "A distributed monolith is a system that is physically distributed (separate deployable units) but logically coupled (services cannot be deployed independently, they share databases, they call each other synchronously in chains). It combines the worst of both worlds: microservices operational complexity + monolith coupling. Avoid by ensuring services own their data, communicate asynchronously where possible, and can be deployed without coordinating with other service teams." }
    ],
    related: ["10.5.02", "10.5.03", "1.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["conways-law", "team-topology", "organisation-design", "architecture"]
  },

  {
    id: "10.5.02",
    section: 10,
    subsection: "10.5",
    level: "intermediate",
    question: "How do you apply Team Topologies to structure teams for fast flow?",
    quick_answer: "→ Team Topologies defines 4 team types: Stream-aligned, Platform, Enabling, Complicated Subsystem\n→ Stream-aligned: owns a product or service end-to-end; primary flow team — most teams should be this\n→ Platform: reduces cognitive load on stream-aligned teams by providing self-service infrastructure\n→ Enabling: temporary coaching team that upskills stream-aligned teams then disbands\n→ Complicated Subsystem: owns genuinely complex domains (ML, DSP, cryptography) that require specialists\n→ Fast flow requires reducing cognitive load on stream-aligned teams — platforms enable this",
    detailed_answer: "Team Topologies (Skelton & Pais, 2019) provides a vocabulary and model for structuring teams to maximise software delivery flow. The central insight is that team cognitive load is a constraint on delivery speed.\n\nThe four team types:\n\n1. Stream-aligned team: Aligned to a flow of work (a product, user journey, or business domain). Owns the software end-to-end — design, build, deploy, operate. Most teams in a healthy organisation should be stream-aligned. They are the primary unit of value delivery.\n\n2. Platform team: Builds and operates internal products that reduce the cognitive load of stream-aligned teams. A good platform team provides self-service capabilities — stream-aligned teams consume infrastructure, observability, and deployment tooling without needing platform engineers to intervene. Rule: if stream-aligned teams have to file tickets to use the platform, the platform is not working.\n\n3. Enabling team: A temporary team of specialists that coaches stream-aligned teams to adopt a new practice or technology. The enabling team's goal is to make itself redundant — it transfers knowledge and then dissolves. This is different from a centralised architecture team that becomes a permanent dependency.\n\n4. Complicated Subsystem team: Owns a genuine subsystem that requires specialist knowledge that stream-aligned teams cannot reasonably acquire — cryptography, real-time audio processing, ML inference infrastructure. This team provides the subsystem as a service or library; stream-aligned teams consume it.\n\nInteraction modes:\n- Collaboration: two teams work closely together for a limited period (typically during a migration or new capability development). Collaboration has a defined end date.\n- X-as-a-Service: one team consumes another's output with minimal interaction. This is the goal state — low coupling, high autonomy.\n- Facilitating: enabling teams temporarily guide stream-aligned teams through a change.\n\nCognitive load as the constraint:\nA stream-aligned team can only effectively own a bounded amount of software. When they own too much, cognitive overload produces bugs, slow delivery, and burnout. The platform team's job is to shrink the surface area stream-aligned teams must understand by providing good abstractions.\n\nCommon failure mode:\nPlatform teams that require tickets and approval to provision resources become bottlenecks — the opposite of their intent. The platform team test: can a new service be created, deployed, and monitored by a stream-aligned team without filing a ticket? If no, the platform is a dependency, not an enabler.",
    key_points: [
      "Four team types: Stream-aligned (primary), Platform (enabler), Enabling (temporary coach), Complicated Subsystem (specialist)",
      "Most teams should be stream-aligned: end-to-end ownership of a flow, product, or domain",
      "Platform teams reduce cognitive load via self-service — ticket-based platform = bottleneck, not platform",
      "Enabling teams are temporary and goal-oriented: transfer knowledge and dissolve, not a permanent dependency",
      "Cognitive load is the limiting factor: teams that own too much deliver less, with more bugs",
      "Interaction modes: Collaboration (temporary), X-as-a-Service (goal state), Facilitating (coaching)"
    ],
    hint: "If your infrastructure team handles all deployment requests via tickets, taking 3-5 days per ticket — which Team Topologies team type are they, and what type should they become?",
    common_trap: "Creating a platform team but resourcing it as a shared service with ticket-based workflows. Calling it a 'platform team' without the self-service capability produces a bottleneck with a new name.",
    follow_up_questions: [
      { text: "What is Conway's Law and how does it affect system architecture?", type: "linked", links_to: "10.5.01" },
      { text: "How do you restructure teams when the existing structure is creating architectural friction?", type: "linked", links_to: "10.5.03" },
      { text: "How does platform engineering in Team Topologies relate to internal developer platforms?", type: "linked", links_to: "6.6.01" }
    ],
    related: ["10.5.01", "10.5.03", "6.6.01"],
    has_diagram: false,
    has_code: false,
    tags: ["team-topology", "platform-engineering", "cognitive-load", "stream-aligned", "organisation-design"]
  },

  {
    id: "10.5.03",
    section: 10,
    subsection: "10.5",
    level: "advanced",
    question: "How do you restructure teams when the existing organisation is creating visible architectural friction?",
    quick_answer: "→ Map current team structure → identify friction points (slow handoffs, multiple teams on one change, shared databases)\n→ Define target team structure: domain-aligned, bounded ownership, minimal cross-team dependencies\n→ Use Inverse Conway Manoeuvre: team structure change before or alongside architectural change\n→ Migrate incrementally: don't reorganise 300 people in one go — move a subset, validate, repeat\n→ Guard against the J-curve: productivity dips during reorganisation before it improves",
    detailed_answer: "Restructuring teams to remove architectural friction is high-stakes change management that intersects engineering, people, and politics. Done badly, it creates months of disruption. Done well, it unlocks years of improved delivery.\n\nStep 1 — Map the friction:\n\nBefore proposing any restructuring, make the current friction visible:\n- Which changes require coordination across 3+ teams?\n- Which shared databases are owned by multiple teams?\n- Where are the bottleneck teams — the ones in every critical path?\n- What is the average deployment cycle time, and which teams are slowest?\n\nDraw a service dependency graph and overlay team boundaries. Misalignments — where a service's dependencies cross many team boundaries — are the friction points.\n\nStep 2 — Define the target:\n\nUsing Team Topologies as a framework, define the desired team structure:\n- Each stream-aligned team owns one domain end-to-end\n- No shared databases between domains (each team owns its data)\n- Platform capabilities extracted to a platform team with self-service APIs\n- Specialist subsystems (ML, auth, payments) owned by Complicated Subsystem teams\n\nStep 3 — Sequence the migration:\n\nNever restructure everything simultaneously. Pick the highest-friction area and move it first:\n1. Identify the domain with the clearest boundary and most friction\n2. Move the services and people for that domain into the new structure\n3. Validate: does delivery speed improve? Does the friction reduce?\n4. Apply lessons to the next domain\n\nStep 4 — The Inverse Conway Manoeuvre in practice:\n\nThe team structure change must precede or accompany the architectural change. If you move people first but don't change the architecture, they inherit the old friction. If you change the architecture first without moving people, Conway's Law will drag it back.\n\nThe J-curve:\n\nTeam restructuring always produces a productivity dip before improvement — people need time to learn new boundaries, build new relationships, and establish new workflows. Communicate this expectation explicitly to leadership: \"We expect a 6-8 week dip before we see improvement. Here is how we'll measure recovery.\"\n\nPolitics and people:\n\n- Managers lose span of control — this is threatening. Involve them in the design.\n- Engineers lose familiarity — they move to teams with new colleagues and new codebases. Plan for onboarding time.\n- Some engineers will resist; some will thrive. Identify your change agents — engineers who understand the vision and will pull others along.\n\nMeasure before and after:\n\nDefine metrics before restructuring: deployment frequency, change failure rate, mean time to recover, cross-team dependency count. Measure 90 days after. If the metrics don't improve, the restructure didn't solve the right problem.",
    key_points: [
      "Map friction first: dependency graphs + team overlay reveals misalignment before proposing change",
      "Inverse Conway Manoeuvre: team structure change must accompany or precede architectural change",
      "Migrate incrementally: start with the highest-friction, clearest-boundary domain",
      "J-curve is real: productivity dips 6-8 weeks before improving — set this expectation with leadership",
      "Measure before and after: deployment frequency, MTTR, cross-team dependency count",
      "Politics matters: managers lose span of control, engineers lose familiarity — involve both in the design"
    ],
    hint: "If moving teams to new domain ownership causes a 30% dip in delivery speed in weeks 4-6, what would you tell your CTO — and how would you know whether to continue or reverse?",
    common_trap: "Treating the reorganisation as complete once the org chart changes. The org chart change is the start, not the end — alignment requires changing codebases, database ownership, and operational practices to match the new structure.",
    follow_up_questions: [
      { text: "How do you apply Team Topologies to structure for fast flow?", type: "linked", links_to: "10.5.02" },
      { text: "How does Conway's Law explain why reorganisations sometimes fail?", type: "linked", links_to: "10.5.01" },
      { text: "What metrics indicate that a team restructure is working?", type: "inline", mini_answer: "DORA metrics: deployment frequency (increasing means more autonomy), lead time for changes (decreasing means less friction), change failure rate (stable or decreasing), MTTR (decreasing means clearer ownership). Also: cross-team PR review count (decreasing means less cross-team coupling), and team-reported cognitive load surveys." }
    ],
    related: ["10.5.01", "10.5.02", "1.5.01"],
    has_diagram: false,
    has_code: false,
    tags: ["team-restructuring", "conways-law", "organisation-design", "change-management", "inverse-conway"]
  },

  // ─────────────────────────────────────────────────
  // 10.6 Architecture Review (3q)
  // ─────────────────────────────────────────────────

  {
    id: "10.6.01",
    section: 10,
    subsection: "10.6",
    level: "basic",
    question: "What is an architecture review and when should one be triggered?",
    quick_answer: "→ An architecture review is a structured evaluation of a proposed design against quality attributes, principles, and risk\n→ Trigger: new system/service, significant change to existing system, new external dependency, security-affecting change\n→ Goal: surface risks, validate trade-offs, ensure alignment with principles — not gatekeeping\n→ Lightweight for small changes, formal for high-risk or cross-cutting changes\n→ Output: approved (with notes), approved with conditions, or returned for revision — never just 'rejected'",
    detailed_answer: "An architecture review is a structured process to evaluate whether a proposed architecture is fit for purpose: does it meet functional requirements, satisfy non-functional requirements, align with engineering principles, and introduce acceptable risk?\n\nWhat an architecture review is not:\nIt is not a bureaucratic gate that blocks delivery. Reviews that slow teams down without adding value are replaced by shadow decision-making — teams stop bringing decisions for review and make them unilaterally. The review process must add value by catching real problems, not by enforcing process.\n\nTrigger taxonomy:\n\n| Trigger | Review type |\n|---|---|\n| New service or system | Lightweight for small, significant for cross-cutting |\n| New external dependency (vendor, SaaS) | Lightweight to significant depending on data sensitivity |\n| New data store type | Mandatory — aligns with data ownership principles |\n| Security-affecting change | Mandatory — auth, identity, crypto, PII handling |\n| Architecture deviation from golden path | Mandatory ADR + review |\n| Cross-team dependency introduction | Mandatory |\n\nReview levels:\n\n- Self-review: engineer reviews their own design against a checklist before sharing. Catches basic issues early.\n- Peer review: one or two senior engineers review the design informally. Good for bounded, well-understood changes.\n- Guild review: architecture guild reviews the design, typically asynchronous with a synchronous session for complex cases.\n- Architecture Review Board (ARB): formal multi-stakeholder review for highest-risk decisions.\n\nOutput of a review:\n- Approved: proceed as proposed\n- Approved with conditions: proceed, but address specific concerns before or shortly after launch (with a deadline)\n- Return for revision: specific blocking issues must be addressed before re-review\n\nNever output just \"rejected\" — always specify what needs to change and why.\n\nValue of the review:\nThe review catches problems when they are cheap to fix — in design, not in production. A 1-hour review that surfaces a data ownership conflict saves weeks of re-architecture after launch.",
    key_points: [
      "Architecture review evaluates fitness for purpose: NFRs, risk, alignment with principles",
      "Triggers: new system/service, new data store, security-affecting change, cross-team dependency, golden-path deviation",
      "Tiered reviews: self, peer, guild, ARB — match the review weight to the decision weight",
      "Output must be actionable: approved, approved-with-conditions, or return-for-revision — never just 'rejected'",
      "Reviews that slow teams without adding value get bypassed — design reviews to catch real problems",
      "One-hour review in design phase saves weeks of re-architecture in production"
    ],
    hint: "If teams are consistently skipping the architecture review process — what does that tell you about the review, and how would you redesign it?",
    common_trap: "Requiring architecture review for every change, regardless of risk. Review fatigue causes teams to treat all reviews as formalities, killing the signal. Tiered reviews with clear triggers maintain the value.",
    follow_up_questions: [
      { text: "How do you run an effective Architecture Review Board (ARB)?", type: "linked", links_to: "10.6.02" },
      { text: "How do ADRs feed into architecture reviews?", type: "linked", links_to: "10.1.01" },
      { text: "What is the difference between an architecture review and a code review?", type: "inline", mini_answer: "Code review evaluates implementation correctness: is this code correct, readable, testable? Architecture review evaluates design fitness: does this structure meet NFRs, align with principles, introduce acceptable risk? Both are necessary; neither substitutes for the other. Architecture review happens before code is written; code review happens after." }
    ],
    related: ["10.6.02", "10.6.03", "10.1.01"],
    has_diagram: false,
    has_code: false,
    tags: ["architecture-review", "governance", "risk-management", "ARB"]
  },

  {
    id: "10.6.02",
    section: 10,
    subsection: "10.6",
    level: "intermediate",
    question: "How do you run an effective Architecture Review Board (ARB) without it becoming a bottleneck?",
    quick_answer: "→ ARB scope: high-risk, cross-cutting, or hard-to-reverse decisions only — not everything\n→ Asynchronous-first: submit design doc; reviewers comment async; synchronous session only for blockers\n→ Time-box the review: maximum 2 weeks from submission to outcome\n→ Clear criteria: reviewers must cite a principle or risk, not personal preference\n→ Publish outcomes: approved ADRs and review notes are visible org-wide, building shared context",
    detailed_answer: "An Architecture Review Board becomes a bottleneck when it tries to review everything, takes weeks, or outputs opinions rather than principled decisions. Effective ARBs are fast, targeted, and transparent.\n\nScope — what goes to the ARB:\n\nNot every decision warrants an ARB. Reserve it for:\n- Decisions that span multiple stream-aligned teams and require cross-functional buy-in\n- Decisions that are high-cost or hard to reverse (new foundational platform, new database paradigm)\n- Decisions where there is genuine disagreement that team-level resolution cannot resolve\n- Decisions that have material security, compliance, or cost implications\n\nEverything else goes to peer review or guild review.\n\nComposition:\n\nAn effective ARB has:\n- 3-5 reviewers maximum (larger groups have diminishing returns and longer scheduling)\n- Principal or staff engineers representing the affected domains\n- At least one security representative for security-affecting changes\n- A named chair who owns the process and ties votes\n- No managers or stakeholders who are not technical\n\nProcess:\n\n1. Submission: team submits a design document (1-3 pages: context, options, decision, consequences, risks) plus a draft ADR\n2. Async review (week 1): reviewers comment on the document. No meeting required if concerns are minor\n3. Synchronous session (week 2, if needed): 60 minutes maximum to resolve blockers identified in async review\n4. Outcome: chair publishes the decision within 48 hours of the synchronous session\n5. ADR created: outcome is captured as an ADR and published to the org-wide ADR index\n\nDecision criteria:\n\nReviewers must cite a specific principle, risk, or constraint — not personal preference. \"I would have done it differently\" is not a blocking objection. \"This violates the principle of services owning their data (ADR-0031)\" is.\n\nPreventing bottleneck:\n- Hard time limit: submission to outcome in ≤ 2 weeks, no exceptions. If reviewers miss the window, outcome defaults to approved\n- Async-first: schedule synchronous sessions only for unresolved blocking concerns\n- Delegate: establish guild review as a valid alternative for medium-risk decisions; ARB is the last resort, not the first\n- Retrospect quarterly: if a class of decisions consistently passes ARB without changes, stop requiring ARB for that class",
    key_points: [
      "ARB scope: cross-cutting, high-cost, hard-to-reverse decisions only — not a catch-all review body",
      "3-5 reviewers maximum; technical principals only; named chair owns process and ties",
      "Async-first: document review in week 1; synchronous session only for blockers in week 2",
      "Hard time limit: submission to outcome ≤ 2 weeks — missed reviewer window defaults to approved",
      "Reviewers must cite principles or risks, not preferences — explicit criteria reduce politics",
      "Outcomes published as ADRs org-wide — review creates shared context, not just individual decisions"
    ],
    hint: "If your ARB review takes 6 weeks on average and teams have started building before the outcome — what structural changes would you make to the process?",
    common_trap: "Making the ARB the first stop for all architectural questions. Teams escalate to ARB to avoid making decisions themselves. The fix is to make team-level and guild-level review empowered and trusted — ARB is for genuine escalation, not for defaulting responsibility.",
    follow_up_questions: [
      { text: "What is an architecture review and when should one be triggered?", type: "linked", links_to: "10.6.01" },
      { text: "How do you align multiple teams on a shared architectural vision?", type: "linked", links_to: "10.4.03" },
      { text: "How do you handle an ARB that keeps blocking the same team repeatedly?", type: "inline", mini_answer: "Diagnose: is the team repeatedly deviating from principles (coaching needed)? Or is the ARB applying principles inconsistently (calibration needed)? If the team is the outlier, pair an enabling team with them. If the ARB is inconsistent, publish decision criteria publicly and retrospect on past rulings to calibrate." }
    ],
    related: ["10.6.01", "10.6.03", "10.4.03"],
    has_diagram: false,
    has_code: false,
    tags: ["ARB", "architecture-review", "governance", "decision-making"]
  },

  {
    id: "10.6.03",
    section: 10,
    subsection: "10.6",
    level: "advanced",
    question: "How do you review an architecture for non-functional requirements at scale — when the system spans many teams and environments?",
    quick_answer: "→ NFR review at scale requires: agreed NFR targets per tier, automated fitness functions, and periodic manual review\n→ Fitness functions: automated tests that assert architectural properties (latency p99 < 200ms, no cross-domain DB queries)\n→ Tiered NFR targets: critical-path services have different SLOs than internal tooling\n→ Cross-cutting NFRs (security, observability) validated at platform layer, not per-service\n→ Architecture fitness is an ongoing property, not a one-time review gate",
    detailed_answer: "At scale, architecture review cannot be purely human-driven. A system spanning 50+ services and 10+ teams cannot be manually reviewed for every change. Fitness functions and tiered standards automate the signal; humans review the exceptions.\n\nNFR taxonomy and tiering:\n\nNot all services have the same NFR requirements. Define tiers:\n- Tier 0 (Critical): directly in the user payment or auth critical path. Availability ≥ 99.99%, p99 latency < 200ms, zero data loss\n- Tier 1 (Important): core product experience, not directly critical-path. Availability ≥ 99.9%, p99 latency < 500ms\n- Tier 2 (Supporting): internal tooling, back-office. Availability ≥ 99.5%, higher latency tolerance\n\nTier assignment is an architectural decision captured in an ADR. Teams must justify Tier 0 assignment — it carries the highest operational cost.\n\nFitness functions (evolutionary architecture concept):\n\nFitness functions are automated tests that verify architectural properties continuously:\n- Performance: load tests in CI that assert p99 latency meets the service's tier target\n- Data isolation: linting rules that flag cross-schema queries between domains\n- Security: dependency scans that fail builds for known CVEs above severity threshold\n- Observability: checks that every service has a structured log schema, a latency histogram, and a health endpoint\n- Cost: cloud cost budget alerts that page when a service exceeds its monthly budget\n\nFitness functions run in CI/CD on every merge, catching regressions automatically.\n\nCross-cutting NFRs at the platform layer:\n\nSome NFRs are too important to leave to individual teams:\n- Observability: the platform injects structured logging, distributed tracing, and metrics as infrastructure — opt-out requires explicit exception\n- Security: TLS termination, mTLS between services, secrets management — enforced at the infrastructure layer\n- Rate limiting and auth: enforced at the API gateway for externally-facing services — not reinvented per service\n\nHuman review triggers:\n\nAutomate the routine; escalate the anomalies:\n- Fitness function failures → team alert (automated)\n- Consistent tier-2 latency approaching tier-1 targets → flag for architecture review\n- New service self-declaring Tier 0 → mandatory guild review to validate the tier assignment\n- Observability gaps discovered in an incident → post-mortem required, gap addressed in follow-up sprint\n\nArchitecture health dashboard:\n\nA visible, organisation-wide dashboard showing:\n- Per-service tier and current SLO compliance\n- Fitness function pass/fail rates\n- Dependency graph with cross-domain violation counts\n- Tech debt age by module\n\nTransparency is the key tool: when architectural health is invisible, it deteriorates. When it's visible to engineering leadership, teams self-correct.",
    key_points: [
      "Tiered NFR targets: Tier 0 (critical path), Tier 1 (core), Tier 2 (supporting) — different SLOs, different review weight",
      "Fitness functions: automated CI assertions on latency, data isolation, security, observability, cost",
      "Cross-cutting NFRs (security, observability) enforced at platform layer — not reinvented per service",
      "Human review triggered by anomalies: tier self-assignment, fitness function patterns, post-incident gaps",
      "Architecture health dashboard: visible SLO compliance, fitness function trends, dependency violations",
      "Transparency is the key tool — invisible health deteriorates; visible health self-corrects"
    ],
    hint: "If 40% of your services are missing distributed tracing and you discover this during a production incident — how would you ensure this doesn't happen again without a manual audit every quarter?",
    common_trap: "Relying on architecture reviews alone to catch NFR gaps. By the time a review happens, the code is written, and retrofitting observability or security into a deployed service is significantly more expensive than including it upfront.",
    follow_up_questions: [
      { text: "What are NFRs and how do you specify them?", type: "linked", links_to: "3.1.01" },
      { text: "How do you implement observability at scale?", type: "linked", links_to: "6.8.01" },
      { text: "What is an architecture fitness function?", type: "inline", mini_answer: "A fitness function (from evolutionary architecture by Ford, Parsons, Kua) is any mechanism that provides an objective integrity assessment of an architectural characteristic. Examples: a CI test asserting no circular dependencies, a load test asserting latency targets, a compliance scanner asserting no unencrypted PII in logs. They're automated, repeatable, and run continuously." }
    ],
    related: ["10.6.01", "10.6.02", "3.1.01", "3.6.01", "6.8.01"],
    has_diagram: false,
    has_code: false,
    tags: ["architecture-review", "NFR", "fitness-functions", "scalability", "governance"]
  },

  // ─────────────────────────────────────────────────
  // 10.7 Engineering Principles (3q)
  // ─────────────────────────────────────────────────

  {
    id: "10.7.01",
    section: 10,
    subsection: "10.7",
    level: "basic",
    question: "What engineering principles guide good architectural decisions — and why do they matter?",
    quick_answer: "→ Principles are generative rules that produce consistent decisions without central coordination\n→ Core principles: Design for failure, Prefer simplicity, Own your data, Build for observability, Automate the toil\n→ Principles must be grounded in consequences: 'design for failure because distributed systems fail'\n→ Good principles are falsifiable: you can describe a decision that violates the principle\n→ Bad principles are platitudes: 'write good code' tells no one what to do differently",
    detailed_answer: "Engineering principles are the highest-level architectural guidelines in an organisation. Unlike rules (\"use PostgreSQL\") or patterns (\"use circuit breakers\"), principles are generative — they guide decisions that haven't been made yet.\n\nWhat makes a good principle:\n\n1. Actionable: it tells an engineer what to do differently in a real situation\n2. Falsifiable: you can describe what violating it looks like\n3. Grounded: it is derived from a specific consequence, not a preference\n4. Debatable: in edge cases, engineers should be able to argue which principle takes precedence\n\nCommon architectural principles (with grounding):\n\n- Design for failure: distributed systems fail; assume any dependency is unavailable and design for graceful degradation\n- Prefer simplicity over cleverness: complex systems have complex failures; the cost of understanding clever code compounds over time\n- Own your data: services that share databases create coupling that outlasts the code; service boundaries are defined by data ownership\n- Build for observability: you cannot debug what you cannot see; observability is a first-class requirement, not an afterthought\n- Automate the toil: manual repetitive processes create inconsistency and human error; automate anything done more than once\n- Prefer open standards: proprietary protocols create vendor lock-in; open standards enable optionality\n- Make security decisions early: retrofitting security is exponentially more expensive than designing for it\n\nWhy principles matter:\n\nIn an organisation with 20+ engineers, no central authority can review every decision. Principles provide the shared mental model that allows distributed decision-making to be coherent. A team in Singapore making a database decision should arrive at the same class of decision as a team in London, without consulting each other, because they share the same principles.\n\nBad principles (platitudes):\n- \"Write high-quality code\" — every team already thinks they do this; it gives no guidance\n- \"Be pragmatic\" — provides cover for any decision, good or bad\n- \"Move fast\" — without constraints, this produces reckless debt",
    key_points: [
      "Principles are generative: they guide future decisions that haven't been made yet",
      "Good principle: actionable, falsifiable, grounded in consequences, debatable in edge cases",
      "Core architectural principles: Design for failure, Prefer simplicity, Own your data, Build for observability",
      "Principles enable distributed decision-making coherence — teams converge without central coordination",
      "Bad principles are platitudes: they provide comfort without guidance, and cover for any decision",
      "Principles must be published, taught, and referenced in ADRs to be load-bearing"
    ],
    hint: "If two teams each have a reasonable argument for contradictory technical choices — how would a shared set of principles resolve or reframe the disagreement?",
    common_trap: "Generating a long list of principles (15+) that nobody can remember. Five to seven strong, memorable principles are more powerful than twenty vague ones. Principles that don't fit on a single page won't guide daily decisions.",
    follow_up_questions: [
      { text: "How do you apply YAGNI, SOLID, and DRY at the system level?", type: "linked", links_to: "10.7.02" },
      { text: "How do you balance principles against delivery pressure?", type: "linked", links_to: "10.7.03" },
      { text: "How do engineering principles relate to ADRs?", type: "linked", links_to: "10.1.01" }
    ],
    related: ["10.7.02", "10.7.03", "10.1.01", "10.4.03"],
    has_diagram: false,
    has_code: false,
    tags: ["engineering-principles", "architecture-governance", "decision-making", "culture"]
  },

  {
    id: "10.7.02",
    section: 10,
    subsection: "10.7",
    level: "intermediate",
    question: "How do YAGNI, DRY, and SOLID apply at the system architecture level — beyond individual code?",
    quick_answer: "→ YAGNI at system level: don't build event-driven or microservices architecture before the need is proven\n→ DRY at system level: avoid duplicate services for the same capability; but over-shared services create coupling\n→ SOLID at system level: services with single responsibility, open for extension via events, dependent on abstractions\n→ The tension: DRY encourages consolidation; YAGNI discourages premature abstraction; SOLID defines boundaries\n→ Tolerate data duplication for service autonomy — eventual consistency via events is the system-level DRY solution",
    detailed_answer: "YAGNI, DRY, and SOLID are code-level principles that have meaningful analogues at the system architecture level — but the application differs significantly from their code-level meaning.\n\nYAGNI at system level:\n\nYou Aren't Gonna Need It applied to architecture: don't build generic, extensible infrastructure for capabilities you haven't proven you need.\n\n- Don't build an event-driven architecture before you have the load that requires asynchronous processing\n- Don't build a microservices architecture before you have the team scale and product maturity that justifies the operational complexity\n- Don't build multi-region before you have the users that require geographic distribution\n\nEach of these premature generalisations adds operational complexity that slows delivery without delivering corresponding value. Start simpler; evolve when the need is proven.\n\nDRY at system level:\n\nDon't Repeat Yourself applied to architecture: avoid duplicating the same capability across multiple services. But the system-level version has a critical caveat — shared services create coupling.\n\nIf 20 services all call a single \"user service\" for user data, you've created a shared-state coupling that is harder to change than the duplicated code you were trying to avoid. The system-level DRY principle is more nuanced: avoid operational duplication (duplicate deployment pipelines, duplicate monitoring) but tolerate some data duplication to maintain service autonomy.\n\nEventual consistency (via events) allows services to maintain local copies of the data they need, avoiding the shared-service coupling problem while keeping the data eventually consistent.\n\nSOLID at system level:\n\n- Single Responsibility: each service owns one bounded domain. A service that manages users AND orders AND payments has too many responsibilities.\n- Open/Closed: services are open for extension via events (new consumers can subscribe without modifying the producer) but closed for modification (consumers don't reach into producers' databases).\n- Liskov Substitution: services behind a stable API can be replaced with alternative implementations without callers knowing — the contract-first API design principle.\n- Interface Segregation: don't expose a monolithic API; expose narrow, role-specific APIs (BFF pattern, purpose-built APIs for different consumers).\n- Dependency Inversion: services depend on abstractions (stable APIs, event contracts) not implementations (specific service instances or database schemas).\n\nThe tension:\n\nDRY pushes toward shared services; YAGNI pushes against over-building; SOLID defines clean boundaries. These principles create productive tension — the skill is applying the right one in the right context. In general: prefer YAGNI early, apply SOLID for boundary definition, and apply DRY carefully.",
    key_points: [
      "YAGNI at system level: don't build event-driven, microservices, or multi-region before the need is proven",
      "DRY at system level: avoid operational duplication but tolerate data duplication to maintain service autonomy",
      "Shared-service DRY creates coupling — eventual consistency via events is a better system-level alternative",
      "SOLID maps to services: Single Responsibility = one domain, Open/Closed = events for extension, ISP = BFF pattern",
      "Dependency Inversion at system level: depend on APIs and event contracts, not service internals or shared schemas",
      "The productive tension: YAGNI restrains over-engineering; SOLID defines good boundaries; DRY must be applied carefully"
    ],
    hint: "If 15 services all import a shared 'utils' library that contains domain logic, and you can't change one without testing all 15 — which principle is being violated and at what level?",
    common_trap: "Applying DRY to eliminate all service-level data duplication by creating a shared 'canonical data service'. This trades data duplication for coupling — any change to the shared service requires coordinating all consumers.",
    follow_up_questions: [
      { text: "What engineering principles guide good architectural decisions?", type: "linked", links_to: "10.7.01" },
      { text: "How do you balance engineering principles against delivery pressure?", type: "linked", links_to: "10.7.03" },
      { text: "How does the BFF pattern relate to Interface Segregation at system level?", type: "linked", links_to: "4.4.01" }
    ],
    related: ["10.7.01", "10.7.03", "4.4.01", "2.7.01"],
    has_diagram: false,
    has_code: false,
    tags: ["engineering-principles", "YAGNI", "DRY", "SOLID", "system-design"]
  },

  {
    id: "10.7.03",
    section: 10,
    subsection: "10.7",
    level: "advanced",
    question: "How do you maintain engineering principles under delivery pressure — and where is it acceptable to compromise?",
    quick_answer: "→ Principles are non-negotiable by default; exceptions require explicit decision and time-bound repayment\n→ Classify principles by severity: Safety (never compromise), Quality (negotiate scope), Velocity (contextual)\n→ Frame trade-offs transparently: 'we're skipping X, this creates risk Y, we'll address it by date Z'\n→ Track exceptions as deliberate debt — anonymous shortcuts compound silently\n→ If principles are compromised routinely, they are not principles — they are aspirations",
    detailed_answer: "Delivery pressure is the primary force that erodes engineering principles over time. The failure mode is death by a thousand compromises — each individual shortcut seems reasonable; the cumulative effect is an unmaintainable system.\n\nClassifying principles by compromise acceptability:\n\nSafety principles — never compromise:\n- No PII in logs or unencrypted storage\n- No credentials committed to source control\n- No services deployed without basic health checks and alerting\n\nThese have compliance, legal, or incident-causing consequences. A delivery deadline does not override them. If the timeline cannot accommodate a security principle, the timeline must move, not the principle.\n\nQuality principles — negotiate scope, not the principle:\n- Test coverage requirements: the principle is 'all code is testable and tested'; under pressure, you may accept a lower coverage threshold temporarily with a committed backlog item\n- Observability requirements: the principle is 'all services have structured logging and latency metrics'; under pressure, you may accept partial coverage with a committed follow-up sprint\n\nIn these cases, the shortcut is named, tracked, and has a committed repayment date. It is never anonymous.\n\nVelocity principles — contextual:\n- YAGNI: under a new product hypothesis, you may build more than strictly needed to avoid a future rewrite if the hypothesis is validated\n- Monolith-first: if the team is already distributed and microservices are proven, you don't need to start with a monolith\n\nThe naming discipline:\n\nThe most important practice for maintaining principles under pressure is naming the compromise explicitly. \"We are skipping the dead-letter queue in this sprint. This means we will silently lose messages if the consumer fails. We will add DLQ handling in sprint 12. [JIRA-4521].\"\n\nNaming creates:\n- Accountability: the team knows this is temporary\n- Visibility: it appears in the backlog, not hidden in the code\n- Incentive to close: named shortcuts get prioritised; anonymous ones compound forever\n\nIf compromises are routine:\n\nIf a principle is violated in every sprint, it is not a principle — it is an aspiration. This is valuable information. Either:\n1. The principle is too strict for the context: revise it to something achievable and meaningful\n2. The process is not enforcing it: add automated fitness functions\n3. The team doesn't understand the reason: revisit the principle with the team and ground it in consequences\n\nThe leader's role:\n\nAs an architect or EM, your responsibility during delivery pressure is to make the trade-off visible — not to absorb it quietly. \"Here is what we're skipping, here is the risk, here is the date we address it\" is a professional position. Silently letting standards slip while performing compliance is the failure mode.",
    key_points: [
      "Safety principles: never compromise — security, PII, credentials in source control are non-negotiable",
      "Quality principles: negotiate scope, not the principle — name the shortcut, set the deadline, track as debt",
      "Velocity principles: contextual — YAGNI and complexity-level can flex with team maturity and product stage",
      "Naming discipline: named compromises get closed; anonymous shortcuts compound — always make shortcuts explicit",
      "Routine compromise = aspiration, not principle: either tighten enforcement or revise the principle to achievable",
      "Leader's role: make trade-offs visible, not absorbed quietly — state the risk and the repayment commitment"
    ],
    hint: "If your team skips writing integration tests for the third sprint in a row due to deadline pressure — is this a resource problem, a principle problem, or a culture problem, and how do you know which?",
    common_trap: "Framing the discussion as 'engineering quality vs. business delivery' — this is a false dichotomy. The real question is: what is the deferred cost of this shortcut, and who is responsible for it? Quality and delivery are not opposites; they are a time-shifted trade-off.",
    follow_up_questions: [
      { text: "What engineering principles guide good architectural decisions?", type: "linked", links_to: "10.7.01" },
      { text: "How do you make the business case for technical debt repayment?", type: "linked", links_to: "10.2.02" },
      { text: "How do you apply YAGNI, DRY, and SOLID at system level?", type: "linked", links_to: "10.7.02" }
    ],
    related: ["10.7.01", "10.7.02", "10.2.01", "10.2.02"],
    has_diagram: false,
    has_code: false,
    tags: ["engineering-principles", "delivery-pressure", "governance", "technical-debt", "culture"]
  }

];
