// questions/section_12.js
// Section 12: Behavioural & Soft Skills
// Subsections: 12.1 Conflict & Disagreement        (3q)
//              12.2 Influencing Without Authority   (3q)
//              12.3 Handling Failure & Ambiguity    (3q)
//              12.4 Stakeholder Management          (3q)
//              12.5 Mentorship & Team Growth        (3q)
//              12.6 Prioritisation Under Pressure   (3q)
//              12.7 Ownership & Accountability      (4q)
// Total: 22 questions

const SECTION_12_QUESTIONS = [

  // ─── 12.1 Conflict & Disagreement ───────────────────

  {
    id: "12.1.01",
    section: 12,
    subsection: "12.1",
    level: "intermediate",
    question: "Tell me about a time you disagreed with a senior stakeholder about a technical decision. How did you handle it?",
    quick_answer: "→ Understand their constraints FIRST before presenting your case\n→ Lead with data and trade-offs — not opinions or feelings\n→ Offer 3 options with trade-offs — never an ultimatum\n→ Propose time-boxed PoC: removes ego, reduces commitment risk\n→ Write ADR regardless of outcome — institutional memory\n→ Disagree and commit: once decided, execute fully and professionally",
    detailed_answer: "This question tests technical courage + emotional intelligence. Both matter equally.\n\nWhat interviewers look for:\n→ You pushed back (not a pushover)\n→ You did so with data, not opinion\n→ You respected hierarchy and relationship\n→ You were open to being wrong\n→ You committed fully once decided\n\nFramework:\n\n1. Understand their position first:\n'Help me understand the constraints driving this decision.'\nThey may have budget, political, or historical context you don't have.\n\n2. Prepare data, not feelings:\n'I think this is wrong' loses.\n'Based on load testing showing 3x latency increase, here are three risks' wins.\n\n3. Offer options, not ultimatums:\nInstead of 'your way is wrong' offer\n'here are three options with trade-offs and my recommendation.'\n\n4. Time-boxed PoC:\n'Can we try both approaches for two sprints and measure?'\nReduces risk. Removes ego from the debate.\n\n5. Document via ADR:\nWrite the ADR regardless of outcome.\nIf your concern proves correct later — you have a record.\nIf theirs proves correct — you learn.\n\n6. Disagree and commit:\nOnce decided, execute fully and professionally.\nPassive resistance is unprofessional and damages trust.",
    key_points: [
      "Understand their constraints before presenting your case",
      "Lead with data and trade-offs — not opinions",
      "Offer 3 options with trade-offs — never ultimatums",
      "Time-boxed PoC removes ego and reduces commitment risk",
      "ADR documents the decision — win or lose",
      "Disagree and commit — execute fully once decided"
    ],
    hint: "The interviewer is assessing two things simultaneously: can you push back on authority, AND can you do it professionally? Both matter equally. Which part of your story demonstrates each?",
    common_trap: "Making the story about proving you were right. Interviewers want to see emotional intelligence and collaboration — not evidence you were the smartest person in the room. The outcome matters less than how you handled the process.",
    follow_up_questions: [
      {
        text: "What if the decision you disagreed with caused a production incident?",
        type: "inline",
        mini_answer: "Immediate priority: fix the incident — never 'I told you so.' After stabilisation: blameless post-mortem, document root cause factually. Your prior objection = one data point, not ammunition. Focus on systemic fix. Handling it professionally earns more future influence than being right. This is how trust is built."
      },
      {
        text: "How do you disagree with a decision that has already been implemented?",
        type: "inline",
        mini_answer: "Gather evidence first (metrics, incidents, user feedback). Bring a specific proposal — not just a complaint. 'Here is what we have, here is the impact I am seeing, here is what I propose instead with estimated effort.' Frame as evolution, not admission of mistake. Make it easy for them to say yes."
      }
    ],
    related: ["12.2.01", "10.1.01"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "conflict", "stakeholder", "influence", "STAR", "leadership"]
  },

  {
    id: "12.1.02",
    section: 12,
    subsection: "12.1",
    level: "intermediate",
    question: "Describe a time you had a significant technical disagreement within your own team. What happened and how was it resolved?",
    quick_answer: "→ Separate the technical argument from the personal dynamic\n→ Define decision criteria upfront — makes disagreement objective\n→ Time-box the debate: spike, PoC, or RFC with a decision date\n→ Make the decision transparent — ADR captures the reasoning\n→ The goal is the best outcome for the product, not winning the debate",
    detailed_answer: "Peer disagreements are different from stakeholder disagreements — both people have equal standing, so process matters more.\n\nWhat interviewers look for:\n→ You kept it professional and constructive\n→ You separated person from position\n→ You had a process — not just escalation\n→ You can narrate it without resentment\n\nFramework:\n\n1. Separate the argument from the relationship:\n'We disagree on the approach — we don't disagree that we want the best outcome.'\nNaming this explicitly defuses defensiveness.\n\n2. Define decision criteria first:\n'Before we argue the solution, can we agree on how we'll evaluate options?'\nCriteria: latency, operational complexity, team familiarity, migration cost.\nOnce criteria are shared, the debate becomes objective.\n\n3. Time-boxed spike or PoC:\nOne day each to prototype both approaches and measure against criteria.\nEvidence trumps opinion every time.\n\n4. RFC or design doc:\nWrite it down. Forces both sides to articulate their position clearly.\nOften resolves itself in the writing — people discover they agree on more than they thought.\n\n5. Explicit decision with ADR:\nCapture why you chose option A and what you traded away.\nThis removes rehashing the same debate six months later.\n\n6. If still stuck: flip a coin or use a decider:\nSeriously. If two reasonable options are this close, the cost of continued debate exceeds the difference between them.",
    key_points: [
      "Separate the technical argument from the personal relationship",
      "Agree on decision criteria before debating solutions",
      "Time-boxed spike or PoC replaces opinion with evidence",
      "RFC or design doc forces clear articulation — often reveals hidden agreement",
      "ADR documents the decision and prevents rehashing",
      "The goal is the best product outcome, not winning"
    ],
    hint: "Interviewers want to see that you have a process for technical disagreements — not just a story about being right. What was the mechanism you used to resolve it? Criteria, PoC, ADR?",
    common_trap: "Narrating it as 'I was right and they eventually came around.' Even if true, this signals low self-awareness. Show that you were genuinely open to their position and that the process — not your persistence — resolved it.",
    follow_up_questions: [
      {
        text: "What if the disagreement is about engineering principles rather than a specific technical choice?",
        type: "inline",
        mini_answer: "Principles disagreements are harder — there is no PoC to run. Ground it in concrete consequences: 'If we apply this principle here, the consequence is X.' Elevate to a team-level RFC and make it a documented standard. Individual preferences become team standards through transparent process, not private argument."
      },
      {
        text: "How do you prevent the same technical debates from recurring every six months?",
        type: "linked",
        links_to: "10.1.01",
        mini_answer: "ADRs are the primary tool. A decision that is documented with context and trade-offs rarely gets re-litigated because the team can read why it was made. Without documentation, each new team member re-opens every closed debate."
      }
    ],
    related: ["12.1.01", "12.1.03", "10.1.01"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "conflict", "team", "STAR", "ADR", "technical-leadership"]
  },

  {
    id: "12.1.03",
    section: 12,
    subsection: "12.1",
    level: "advanced",
    question: "How do you handle widespread resistance when proposing a significant architectural change to an established codebase?",
    quick_answer: "→ Name the fear: disruption, learning curve, rework, blame — address it directly\n→ Build the case incrementally: spike → data → RFC → small win in production\n→ Find allies early: one respected engineer changes the room\n→ Make adoption low-friction: scaffolding, templates, pairing — not mandates\n→ Show reversibility: strangler fig and feature flags reduce perceived risk",
    detailed_answer: "Architectural resistance is rarely about the technology — it is usually about fear of disruption, distrust of the proposer, or scepticism that it will actually deliver.\n\nWhat interviewers look for:\n→ You understand why people resist — not just what they say\n→ You build evidence before asking for belief\n→ You create safe conditions to adopt\n→ You are persistent without being pushy\n\nFramework:\n\n1. Diagnose the resistance:\n'Is it fear of the unknown, concern about cost, or distrust of the claim?'\nDifferent resistances need different responses.\n\n2. Small spike in a low-risk area:\nDon't propose replacing the whole system. Pick one module, one service, one team.\nGenerate real data on performance, developer experience, and migration cost.\n\n3. RFC with explicit trade-offs:\nPublish it. Invite criticism. A well-critiqued RFC that survives becomes a trusted standard.\n\n4. Find an early ally:\nOne respected senior engineer who believes in it brings credibility the proposer cannot buy.\nEnlist them early — ideally they contribute to the RFC.\n\n5. Make adoption low-friction:\nScaffolding, code generators, cookiecutters, pairing sessions.\nResistance fades when adoption is easy and the first experience is positive.\n\n6. Use the strangler fig:\nNever propose big-bang migration. Incremental coexistence removes the 'all or nothing' framing that triggers the most fear.",
    key_points: [
      "Diagnose the actual resistance — fear, cost concern, or distrust — before responding",
      "Spike in a low-risk area generates real data before asking for belief",
      "RFC with explicit trade-offs invites criticism and builds credibility",
      "One respected early ally changes the room more than any slide deck",
      "Low-friction adoption: scaffolding, pairing, generators — not mandates",
      "Strangler fig removes the 'all or nothing' framing that triggers fear"
    ],
    hint: "What specifically were people afraid of? The answer to that question should drive your whole approach. Was it learning curve, migration risk, blast radius if it failed, or distrust of you personally?",
    common_trap: "Going straight to leadership to mandate adoption. This creates compliance without belief, seeds resentment, and the moment you leave the team reverts. Organic adoption driven by evidence and early wins is stickier and faster long-term.",
    follow_up_questions: [
      {
        text: "How do you know when to abandon a proposed architectural change versus when to keep pushing?",
        type: "inline",
        mini_answer: "Three signals to abandon: (1) Spike data does not support the original claim — be honest. (2) Adoption cost exceeds projected benefit on any realistic timeline. (3) The team context changes — a rewrite becomes irrelevant if the product is being sunset. Keep pushing when: evidence is strong, resistance is purely cultural, and a small win exists that can break the pattern."
      },
      {
        text: "What role does an Architecture Review Board play in evaluating significant changes?",
        type: "linked",
        links_to: "10.6.01",
        mini_answer: "An ARB provides a forum where significant changes get scrutinised by senior engineers across domains. It legitimises the RFC process and ensures changes are evaluated against cross-cutting concerns — security, operability, data, cost — rather than just the proposing team's lens."
      }
    ],
    related: ["12.1.01", "12.1.02", "10.6.01", "10.1.01"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "influence", "architecture", "change-management", "leadership", "technical-leadership"]
  },

  // ─── 12.2 Influencing Without Authority ─────────────

  {
    id: "12.2.01",
    section: 12,
    subsection: "12.2",
    level: "advanced",
    question: "Walk me through how you have influenced technical direction across teams without having formal authority over them.",
    quick_answer: "→ Earn credibility first: expertise + track record of delivery\n→ Make the RFC public: visibility converts private opinion into shared debate\n→ Build a coalition: find one champion per team who becomes a co-owner\n→ Create demand via reference implementation: show don't tell\n→ Remove friction: if adoption is effortless, authority is irrelevant",
    detailed_answer: "Influencing without authority is the defining skill of a principal or staff engineer. It requires a completely different toolkit from direct management.\n\nWhat interviewers look for:\n→ You understand the difference between compliance and genuine adoption\n→ You build influence through demonstrated value, not position\n→ You think in terms of ecosystems — not individual conversations\n\nFramework:\n\n1. Earn credibility first:\nNo RFC, no recommendation, no workshop can substitute for a track record of delivering working systems that solve real problems.\nYou earn the right to influence by being reliably right, reliably helpful, reliably available.\n\n2. Make it public:\nWrite the RFC, publish the design doc, run the architecture forum.\nPublic visibility turns your individual opinion into a team conversation.\nOthers can contribute, critique, and ultimately co-own the outcome.\n\n3. Build a coalition:\nOne champion per team multiplies your reach.\nEnlist them before you publish — they shape the RFC and carry it back to their team.\n\n4. Reference implementation:\nBuild the thing and make it work well.\nA working reference that other teams can copy is more persuasive than any presentation.\n'Here is the service we built with this approach, here is the p99 latency reduction.'\n\n5. Remove friction:\nCode generators, cookiecutters, golden-path templates, pairing offers.\nIf adopting your recommendation is low-effort, resistance disappears.\n\n6. Make the business case visible:\nIncident reduction, deploy frequency improvement, developer time saved.\nSenior stakeholders respond to outcomes, not architecture diagrams.",
    key_points: [
      "Credibility comes from delivery track record — not from the title",
      "Public RFCs and design docs turn individual opinion into shared conversation",
      "Coalition building: one champion per team multiplies reach without consuming your time",
      "Reference implementation is more persuasive than any slide deck",
      "Remove friction: golden-path tooling makes adoption easy enough to not need authority",
      "Business case visibility: outcomes (incident rate, velocity) reach stakeholders RFCs don't"
    ],
    hint: "Think about a specific technical direction you shifted across teams. What was the first concrete step you took to build credibility? What made the change stick — was it you, or something you created that outlived your involvement?",
    common_trap: "Presenting at an all-hands and expecting adoption to follow. One-to-many broadcast without follow-through creates awareness, not behaviour change. The work happens in the pairing sessions, the coalition conversations, and the friction-removal.",
    follow_up_questions: [
      {
        text: "How do you influence technical direction when you are new to the organisation and have no track record?",
        type: "inline",
        mini_answer: "Listen first. Earn one small win — fix a long-standing pain point or document something confusing. Then publish your first RFC as a question, not a proposal: 'I am trying to understand the trade-offs here — does this match your experience?' Curiosity opens doors that confidence closes."
      },
      {
        text: "What happens when your influence effort is actively undermined by another senior engineer?",
        type: "inline",
        mini_answer: "Treat it as information: what specific concern do they have? Have a direct 1:1 conversation — not escalation. Name the dynamic clearly: 'It feels like we keep arriving at the same impasse. Can we figure out why?' If genuine irreconcilable disagreement remains after good-faith effort, escalate the trade-off — not the person — to the appropriate engineering leader for a decision."
      }
    ],
    related: ["12.1.03", "12.2.02", "10.7.01"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "influence", "principal-engineer", "leadership", "soft-skills", "technical-leadership"]
  },

  {
    id: "12.2.02",
    section: 12,
    subsection: "12.2",
    level: "intermediate",
    question: "Tell me about a time you successfully drove a technical initiative from idea to adoption with no initial sponsorship.",
    quick_answer: "→ Start with a problem, not a solution — find others feeling the same pain\n→ Small win first: prove it in one place before asking others to follow\n→ Measure and broadcast the result — make the business case undeniable\n→ Find an executive champion once evidence exists — bottom-up meets top-down\n→ Transfer ownership: the initiative must outlive your direct involvement",
    detailed_answer: "This question tests your ability to create change from the bottom up — one of the most valuable and undervalued architectural skills.\n\nWhat interviewers look for:\n→ You identified a real problem worth solving\n→ You built evidence before asking for resources\n→ You understood that sponsorship follows proof, not vision\n→ You ensured the change was durable after your direct involvement\n\nFramework:\n\n1. Start with the problem:\n'I noticed we were spending N hours per incident because of X.'\nStarting with a shared problem builds allies naturally.\n\n2. Time-boxed personal investment:\nDo the initial work on your own time or within existing project allocation.\nA working prototype has more persuasive power than any proposal doc.\n\n3. Quantify the first win:\n'Deploying this approach on Service A reduced our incident MTTR from 4h to 45min.'\nNumbers make the case that narrative cannot.\n\n4. Broadcast through the right channel:\nEngineer-to-engineer first (tech talk, design doc).\nManager and VP level once you have the data.\nNever present the vision first — present the evidence.\n\n5. Find a sponsor:\nWith evidence in hand, approach a VP or director who owns the problem space.\n'I have a proposal to reduce our incident cost by X. I have one team proving it. I need 20% of two teams for eight weeks to roll it out.'\n\n6. Transfer ownership:\nDocumented standards, trained champions, baked into hiring criteria.\nThe initiative dies with your direct involvement unless it is institutionalised.",
    key_points: [
      "Start with a shared problem — allies form naturally around pain",
      "Small working prototype beats proposal document every time",
      "Quantify the first win before seeking broader sponsorship",
      "Broadcast evidence engineer-to-engineer first, then up the chain",
      "Sponsorship follows proof — do not present vision before evidence",
      "Institutionalise: standards, champions, tooling — so it outlives your involvement"
    ],
    hint: "What problem were you solving? And what was the first concrete piece of evidence you had that the approach worked? The story hangs on those two data points.",
    common_trap: "Presenting the vision without evidence and expecting sponsorship. Executives hear dozens of proposals per month. The ones that get resourced are the ones where someone has already done it in one place and measured it. Earn the right to scale by proving it small.",
    follow_up_questions: [
      {
        text: "How do you maintain momentum on a self-initiated initiative when it competes with your day job?",
        type: "inline",
        mini_answer: "Timebox ruthlessly: 10-15% of your capacity maximum until it has sponsorship. Connect it to your team's OKRs so it is not invisible work. Find one team member who believes in it and co-owns it — halves your load and doubles velocity. The moment you have data, use it to get formal allocation."
      },
      {
        text: "What if leadership dismisses your evidence-backed proposal anyway?",
        type: "inline",
        mini_answer: "Understand the actual objection: timing, cost, competing priority, or distrust in the methodology? Address the specific blocker. If the timing is wrong, ask for a specific revisit date. If it is a competing priority, understand what has to move first. Only abandon after three clear 'no' responses with specific reasoning — not vague deflection."
      }
    ],
    related: ["12.2.01", "12.2.03", "10.4.01"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "influence", "initiative", "leadership", "bottom-up", "technical-leadership"]
  },

  {
    id: "12.2.03",
    section: 12,
    subsection: "12.2",
    level: "intermediate",
    question: "How do you persuade a highly skilled but sceptical senior engineer to adopt a new practice or technology?",
    quick_answer: "→ Respect their scepticism — it often contains a legitimate concern\n→ Ask what would change their mind — you need their criteria, not their agreement\n→ Invite them into the experiment rather than presenting conclusions\n→ Never mandate before demonstrating value in a context they recognise\n→ If they are right: acknowledge it publicly. If wrong: let the data speak.",
    detailed_answer: "Senior engineers earned their scepticism through experience. Treating it as an obstacle rather than information is the most common and most costly mistake.\n\nWhat interviewers look for:\n→ You respect technical peers — not just those above you in hierarchy\n→ You understand that forced adoption of expert-resistant tools creates fragile culture\n→ You know the difference between a blocker and a critic\n\nFramework:\n\n1. Ask before telling:\n'You are sceptical — what specifically concerns you most?'\nPossible answers: 'operational complexity I have seen before', 'vendor lock-in', 'we tried something similar in 2019', 'the team is not ready.'\nEach concern has a different response.\n\n2. Ask for their decision criteria:\n'What would you need to see to change your view?'\nThis converts an open-ended disagreement into a testable hypothesis.\n\n3. Invite co-ownership of the experiment:\n'Would you help design the spike? Your specific concern should be the primary test criterion.'\nThe sceptic who designs the experiment is far more likely to accept the result.\n\n4. Let data speak:\nRun the PoC, measure exactly what they asked you to measure.\nIf the concern was valid — acknowledge it fully and publicly. This earns enormous trust.\nIf the data disproves the concern — present it without 'I told you so.'\n\n5. Never mandate:\nCompelling a senior engineer to use a tool they distrust produces the worst possible outcome: they use it poorly, blame it when it fails, and become more sceptical next time.",
    key_points: [
      "Ask what specifically concerns them — scepticism often contains legitimate insight",
      "Ask for their decision criteria: converts debate into a testable hypothesis",
      "Invite co-ownership of the experiment — the sceptic who designs the test accepts the result",
      "If their concern was valid: acknowledge it publicly — earns lasting trust",
      "If data disproves the concern: present without 'I told you so'",
      "Never mandate adoption on a senior engineer who distrusts the tool"
    ],
    hint: "What specifically was the concern — operational complexity, vendor lock-in, team readiness, or prior negative experience? The right approach depends entirely on which of these it was.",
    common_trap: "Dismissing the scepticism as 'resistance to change' and going around them to get executive mandate. This creates compliance without trust, and the senior engineer becomes a passive saboteur. Their scepticism is usually the most valuable input you have.",
    follow_up_questions: [
      {
        text: "What if the sceptical senior engineer is blocking a change that has already been decided by leadership?",
        type: "inline",
        mini_answer: "Separate the 'should we do this' debate from the 'how do we do this well' conversation. Acknowledge the decision is made. Redirect their expertise: 'The direction is confirmed — I want your help ensuring we do it in a way that avoids the pitfalls you have seen.' Moving them from opponent to consultant preserves their dignity and produces better outcomes."
      },
      {
        text: "How do you handle the case where the sceptic is proven right by the data?",
        type: "inline",
        mini_answer: "Acknowledge it clearly and publicly: 'The data supports your concern. You were right to flag it.' Don't qualify or minimise. Document the findings in an ADR and invite them to propose the alternative. People who are acknowledged when right become your most trusted technical advisors."
      }
    ],
    related: ["12.2.01", "12.1.03", "10.7.02"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "influence", "senior-engineer", "adoption", "technical-leadership", "soft-skills"]
  },

  // ─── 12.3 Handling Failure & Ambiguity ──────────────

  {
    id: "12.3.01",
    section: 12,
    subsection: "12.3",
    level: "intermediate",
    question: "Tell me about the most significant technical mistake or failure you were responsible for. What happened, and what did you learn?",
    quick_answer: "→ Own it clearly: no qualifications, no blame-sharing\n→ Describe the actual business impact — not just the technical failure\n→ What you did immediately: contain, communicate, fix\n→ Root cause: systemic, not personal — what in the process allowed this?\n→ What changed as a result — in the system, team, or your behaviour",
    detailed_answer: "This is one of the most revealing questions in any interview. The failure is not what interviewers are assessing — it is how you hold it.\n\nWhat interviewers look for:\n→ You take clear ownership without theatrical self-flagellation\n→ You understand both the technical root cause AND the systemic cause\n→ You responded effectively under pressure\n→ Something real changed because of it\n→ You can narrate it without residual defensiveness\n\nFramework:\n\n1. Choose a real failure:\nNot 'I worked too hard' or 'I pushed the team too much'.\nA real outage, a real data loss, a real missed architecture decision that cost six months of rework.\n\n2. Own it clearly:\n'I made a decision that caused X. I own that fully.'\nNo qualifications. No 'but the requirements were unclear'.\n\n3. Describe the actual impact:\nUser impact, revenue impact, team cost.\nThis demonstrates you understand that engineering failures have business consequences.\n\n4. Immediate response:\nHow you detected it, what you did first, how you communicated.\nThis shows operational maturity.\n\n5. Root cause — systemic:\n'I made this mistake because our process allowed X.'\nPersonal blame stops learning. Systemic cause enables fixing.\n\n6. What changed:\nNot just 'I learned to be more careful'.\nA specific test, a specific review process, a specific monitoring alert — something concrete that would have caught this.\n\n7. Where you are today:\n'I now treat X as a hard rule in every design review.'",
    key_points: [
      "Own it clearly — no qualifications, no blame-sharing",
      "Describe actual business impact, not just technical failure",
      "Immediate response demonstrates operational maturity under pressure",
      "Root cause should be systemic — what allowed this, not just who failed",
      "What changed must be concrete: specific test, process, or alert — not 'I was more careful'",
      "Residual defensiveness in the telling signals the lesson is not yet integrated"
    ],
    hint: "What would have caught this before it happened? That is the most important part of the answer. The interviewer is checking whether you moved from 'I failed' to 'the system failed' in your understanding.",
    common_trap: "Choosing a failure that is not really a failure ('I sometimes over-engineer things'). Interviewers see through this immediately. A real, significant failure honestly told is far more impressive than a safe non-failure dressed up as humility.",
    follow_up_questions: [
      {
        text: "How do you create a team culture where engineers report mistakes early rather than hiding them?",
        type: "inline",
        mini_answer: "Model it yourself first. Publicly acknowledge your own mistakes in team settings. Run blameless post-mortems — no names, only systems and processes. Never penalise early reporting. Penalise late reporting or concealment. The rule: 'Bad news does not improve with age — the earlier I know, the more I can help.' Consistency over months builds the culture."
      },
      {
        text: "What is a blameless post-mortem and when would you run one?",
        type: "inline",
        mini_answer: "A structured incident review focused entirely on systemic causes rather than personal blame. Run one after every significant production incident, near-miss, or quality escape. Output: timeline, contributing factors, action items with owners and dates. Never: a name in the cause section. The purpose is learning and prevention, not accountability."
      }
    ],
    related: ["12.3.02", "12.7.03", "10.7.01"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "failure", "ownership", "post-mortem", "STAR", "leadership"]
  },

  {
    id: "12.3.02",
    section: 12,
    subsection: "12.3",
    level: "advanced",
    question: "Describe a time you had to make a major architectural decision with significant uncertainty and incomplete information. How did you approach it?",
    quick_answer: "→ Identify load-bearing unknowns — not all uncertainty is equal\n→ De-risk the highest-impact unknown first: spike, prototype, or validate\n→ Prefer reversible decisions over optimal ones under uncertainty\n→ Time-box the decision: set a date to decide with what you have\n→ Document assumptions — they become your early-warning system",
    detailed_answer: "Architectural decisions rarely wait for perfect information. The skill is in reducing the most dangerous uncertainty while committing to a decision on time.\n\nWhat interviewers look for:\n→ You distinguish between ignorance and unknowable risk\n→ You have a structured approach, not 'I just made a call'\n→ You understand the two-way-door vs one-way-door distinction\n→ You manage assumptions explicitly\n\nFramework:\n\n1. Identify load-bearing unknowns:\n'What uncertainty, if the answer is different from what I assume, would invalidate this entire design?'\nNot all uncertainty matters equally. Focus on the ones that do.\n\n2. De-risk the highest-impact unknown:\nFor 'will this meet our latency requirements?' → build a load test.\nFor 'will this vendor actually support the integration?' → build a PoC before committing.\nFor 'what is the data volume at scale?' → instrument the current system and measure.\n\n3. Prefer reversibility:\nAmazon's two-way-door vs one-way-door framing.\nFor one-way-door decisions (data model, API contract, vendor lock-in) — invest more in reducing uncertainty.\nFor two-way-door decisions — decide quickly and learn from the result.\n\n4. Time-box the decision:\n'We decide on Monday with what we have.'\nIndecision in the face of uncertainty has a real cost — delayed starts, missed windows.\n\n5. Document your assumptions:\n'We are assuming traffic will be X. We are assuming the vendor will support Y.'\nAssumptions in an ADR are your early-warning system.\nWhen reality diverges from the assumption, you know exactly which architectural decision to revisit.",
    key_points: [
      "Identify load-bearing unknowns — only a few unknowns actually invalidate the design",
      "De-risk highest-impact unknown first: PoC, load test, or vendor validation",
      "Prefer reversible decisions: two-way-doors allow learning; one-way-doors require more certainty",
      "Time-box the decision: indecision under uncertainty has a real cost",
      "Document assumptions in the ADR — they become the early-warning system when reality diverges"
    ],
    hint: "What was the load-bearing unknown — the one that, if wrong, would invalidate the entire design? And what did you do to reduce that specific uncertainty before committing?",
    common_trap: "Treating all uncertainty as equal and trying to reduce it all before deciding. This leads to analysis paralysis. The skill is in identifying which uncertainty is load-bearing and accepting the rest.",
    follow_up_questions: [
      {
        text: "How do you revisit an architectural decision when a key assumption turns out to be wrong?",
        type: "linked",
        links_to: "10.1.02",
        mini_answer: "ADR supersession: write a new ADR that explicitly references the original, documents which assumption failed, and records the revised decision with updated context. This preserves institutional memory — the team can see both the original reasoning and why it was revised. Avoid silently changing course without documentation."
      },
      {
        text: "What is the Amazon two-way-door decision framework and when does it apply?",
        type: "inline",
        mini_answer: "Two-way-door: reversible decision — decide fast, learn from the outcome, adjust. One-way-door: hard to reverse — invest more time in analysis before committing. Examples of one-way-doors: public API contracts, database schema choices that require migration, vendor lock-in commitments. Apply by asking: 'If we choose wrong, can we recover in 90 days without significant user impact?' If yes — decide fast."
      }
    ],
    related: ["12.3.01", "12.3.03", "10.1.01", "10.1.02"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "decision-making", "ambiguity", "ADR", "architecture", "STAR"]
  },

  {
    id: "12.3.03",
    section: 12,
    subsection: "12.3",
    level: "intermediate",
    question: "How do you architect and lead engineering effectively when business requirements are constantly changing?",
    quick_answer: "→ Favour reversible design decisions — two-way doors everywhere possible\n→ Feature flags and trunk-based development: decouple deploy from release\n→ Frequent demos: reduce the gap between what was built and what is needed\n→ Explicit decision log: prevents rework caused by forgotten decisions\n→ Treat changed requirements as new information — not failure",
    detailed_answer: "Constant requirement changes are not a failure of the business — they are a property of competitive markets and product discovery. The architect's job is to create a system that accommodates change at low cost.\n\nWhat interviewers look for:\n→ You have structural responses, not just tolerance\n→ You distinguish between change tolerance at the architecture level and the team level\n→ You understand that speed of change is a design constraint\n\nFramework — Architecture level:\n\n1. Two-way-door decisions by default:\nChoose patterns that are easy to replace over patterns that are optimal but rigid.\nAdapter pattern, interface-first design, feature flags — all reduce coupling to the current requirement.\n\n2. Feature flags:\nDecouple deployment from release.\nCode can be deployed before requirements are finalised, and features toggled on incrementally.\n\n3. Event-driven over synchronous RPC where feasible:\nEvents support multiple consumers and changing business rules without contract renegotiation.\n\nFramework — Team level:\n\n4. Frequent demos:\nClose the feedback loop aggressively.\nRequirements change less often when stakeholders see working software and can redirect early.\n\n5. Explicit decision log:\nWhen a requirement changes, capture the prior decision and why it changed.\nPrevents the same design from being revisited three times because the context was forgotten.\n\n6. Protect the stable core:\nNot all code is equally volatile. Identify the stable domain core and isolate it from volatile integration and presentation layers.\nChange tolerance at the periphery, stability at the centre.",
    key_points: [
      "Favour reversible architectural decisions — two-way doors at every boundary",
      "Feature flags decouple deployment from release, absorbing requirement changes cheaply",
      "Frequent demos close the feedback loop before requirements drift far from implementation",
      "Explicit decision log prevents rework from forgotten context",
      "Protect stable domain core from volatile integration and presentation layers",
      "Requirements changing is new information — build systems that learn from it cheaply"
    ],
    hint: "What structural choices did you make that made the system easier to change? And what team practices reduced the cost of changing direction?",
    common_trap: "Treating constant change as solely a communication or process problem. Architecture choices determine the cost of change. A system built with tight coupling and no feature flags is expensive to change regardless of how well the team communicates.",
    follow_up_questions: [
      {
        text: "How do you maintain technical quality when the pace of change is high?",
        type: "inline",
        mini_answer: "Quality investment must be proportional to change frequency, not inversely. High-change areas need more tests (not fewer), better observability, and faster CI — because problems compound. The trap: cutting quality investment under pressure guarantees the next change takes longer. Frame quality as a change-speed enabler, not opposed to it."
      },
      {
        text: "What is the difference between a feature flag and a config toggle, and when does each apply?",
        type: "inline",
        mini_answer: "Feature flag: controls whether a feature is active for a user or segment — used for gradual rollout, A/B testing, killswitches. Lifecycle: created, rolled out, cleaned up. Config toggle: controls operational behaviour (timeouts, pool sizes, rate limits) — always active, changed by ops not product. Conflating them creates a management nightmare: feature flags must be tracked and removed; config toggles are permanent infrastructure."
      }
    ],
    related: ["12.3.02", "12.6.01", "10.1.01"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "ambiguity", "architecture", "agile", "feature-flags", "leadership"]
  },

  // ─── 12.4 Stakeholder Management ────────────────────

  {
    id: "12.4.01",
    section: 12,
    subsection: "12.4",
    level: "advanced",
    question: "How do you communicate a serious technical risk to a non-technical executive in a way that leads to action?",
    quick_answer: "→ Lead with business impact and timeline — not the technical cause\n→ Probability × impact: give them a risk statement they can act on\n→ Quantify cost of action vs cost of inaction over 12 months\n→ Present 2–3 options with your recommendation — never a problem alone\n→ Make the ask specific: resource, decision, or unblocking needed",
    detailed_answer: "Non-technical executives are not uninterested in technical risk — they are unable to process it when presented in technical terms. The job is translation, not simplification.\n\nWhat interviewers look for:\n→ You frame risks in business terms from the start — not as an afterthought\n→ You quantify rather than describe\n→ You come with options and a recommendation, not just a problem\n→ You make it easy to act\n\nFramework:\n\n1. Lead with business impact:\n'Our authentication service is running on infrastructure that will no longer receive security patches after March. If exploited, we are looking at potential GDPR penalty exposure of up to €20M and a mandatory breach notification to our 800,000 users.'\nNot: 'We have a vulnerability in our OAuth service running on an unsupported OS version.'\n\n2. Probability × impact:\n'This is a high-likelihood risk based on the current threat landscape, and a critical-severity impact.'\nGive them something to put on a risk register — not a narrative.\n\n3. Cost of action vs cost of inaction:\n'Addressing this requires a six-week engineering sprint costing approximately £80K.\nNot addressing it carries an estimated €20M liability exposure plus reputational damage.'\n\n4. Options with recommendation:\n'Option A: full remediation — six weeks, £80K. Option B: partial mitigation — two weeks, £20K, residual risk remains. My recommendation is Option A because the residual risk in B is unacceptable given our regulatory posture.'\n\n5. Specific ask:\n'I need your sign-off to pause Feature X for six weeks and reallocate the team to this.'\nNever leave without a specific ask. Vague discussions produce no action.",
    key_points: [
      "Lead with business impact and timeline — not the technical cause",
      "Risk statement: probability × impact — actionable for a risk register",
      "Cost of action vs cost of inaction over a concrete time horizon",
      "2–3 options with a specific recommendation — never a problem without a proposal",
      "Specific ask: sign-off, resource reallocation, or decision needed — makes action easy"
    ],
    hint: "What would this executive lose sleep over? Revenue, regulation, or reputation? Lead with whatever maps to that concern. Technical accuracy matters less than whether the right person feels the urgency.",
    common_trap: "Delivering a technically detailed briefing and expecting the executive to translate it into business risk themselves. They will not. Every piece of technical detail that requires translation is a point where the message is lost. Translate it before you walk in the room.",
    follow_up_questions: [
      {
        text: "How do you handle it when an executive deprioritises a risk you believe is critical?",
        type: "inline",
        mini_answer: "Document the risk, their decision, and the date in writing — an email summary is sufficient. Escalate once if the risk is severe enough; never repeatedly. Implement the best available mitigation within your authority, increase monitoring, and revisit with updated data if the risk profile changes. Your job is informed decision-making, not the decision itself."
      },
      {
        text: "How is communicating risk to an engineering manager different from communicating to a VP?",
        type: "linked",
        links_to: "10.4.01",
        mini_answer: "Engineering manager: focus on team impact, sprint disruption, technical details, and specific action items. VP: focus on business impact, risk register framing, cost trade-offs, and strategic options. VP communication requires more translation and fewer details — they need to make a resource or priority decision, not a technical one."
      }
    ],
    related: ["12.4.02", "12.4.03", "10.4.01", "10.4.02"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "stakeholder", "risk-communication", "executive", "leadership", "soft-skills"]
  },

  {
    id: "12.4.02",
    section: 12,
    subsection: "12.4",
    level: "intermediate",
    question: "Tell me about a time you had to decline a stakeholder's feature request. How did you frame the conversation?",
    quick_answer: "→ Never say no to the feature — say yes to the goal with a different approach\n→ Understand the goal behind the request before responding\n→ Explain the constraint honestly: technical, resource, or strategic\n→ Offer the closest achievable alternative with a concrete timeline\n→ Document the decision so it does not become an invisible blocker",
    detailed_answer: "Saying no to a stakeholder is a test of both technical judgment and communication. Done poorly, it damages trust. Done well, it builds it.\n\nWhat interviewers look for:\n→ You understood what they actually wanted before declining\n→ You were transparent about the real constraint\n→ You offered an alternative — not just a refusal\n→ The relationship remained intact after the conversation\n\nFramework:\n\n1. Understand the goal first:\n'Before I give you my assessment, can you help me understand what problem you are trying to solve with this?'\nThe stated feature is often not the only path to the underlying goal.\nA different implementation may achieve 80% of the value at 20% of the cost.\n\n2. Be transparent about the real constraint:\nNot 'this is technically complex' (vague).\n'This requires changes to our shared payment service which is currently in a freeze ahead of the Q3 compliance audit. We can pick this up in September.'\n\n3. Reframe as a trade-off, not a refusal:\n'We have capacity for X or Y this quarter, not both. Given your priorities, which matters more?'\nThis gives the stakeholder agency and positions you as collaborative.\n\n4. Offer an alternative:\nA phased version, a workaround using existing capabilities, a different feature that solves the same goal.\n'We cannot build custom reporting this sprint, but I can give you a data export that most teams use for the same purpose.'\n\n5. Document the decision:\nSummary email: what was requested, what the constraint is, what was agreed, and the expected timeline if any.\nPrevents 'but I thought you said...' conversations three months later.",
    key_points: [
      "Understand the goal behind the request before responding — the feature may not be the only path",
      "Transparent about the real constraint: timing, resource, strategic freeze — not just 'complex'",
      "Reframe as a trade-off: 'X or Y, which matters more?' gives stakeholder agency",
      "Always offer an alternative: phased, workaround, or adjacent feature",
      "Document the decision in writing to prevent misremembering"
    ],
    hint: "What was the actual goal behind the request? Did you ask before responding? The strongest answers show that understanding the real need opened up an alternative that worked for both sides.",
    common_trap: "Saying no based on technical complexity without understanding the business urgency. What seems like a low-priority request may be blocking a major contract. Always ask 'what is driving the timing on this?' before assessing feasibility.",
    follow_up_questions: [
      {
        text: "What if the stakeholder goes above your head after you decline?",
        type: "inline",
        mini_answer: "Expect it to happen occasionally. Prepare your manager in advance: 'I declined X from stakeholder Y for reason Z. I expect they may escalate.' Your manager should hear your version first. If it is escalated: present the constraint clearly, show the alternative you offered, and let the leader make an informed call. Never undercut your own decision under social pressure without new information."
      },
      {
        text: "How do you track declined requests so they do not become invisible gaps in the product?",
        type: "inline",
        mini_answer: "Maintain a 'parking lot' backlog — requests declined for timing, not value. Review it quarterly. When constraints lift, proactively bring declined items back. Stakeholders notice when you remember what they asked for three months ago without them chasing — it is a significant trust signal."
      }
    ],
    related: ["12.4.01", "12.4.03", "10.4.02"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "stakeholder", "prioritisation", "communication", "soft-skills"]
  },

  {
    id: "12.4.03",
    section: 12,
    subsection: "12.4",
    level: "advanced",
    question: "When multiple stakeholders have conflicting priorities, how do you decide what gets built and how do you keep everyone aligned?",
    quick_answer: "→ Map each request to a business outcome — makes conflicts objective\n→ Explicit capacity model: stakeholders see the real constraint\n→ Escalate the trade-off not the disagreement — bring options, not a dispute\n→ Shared prioritisation forum: the decision happens in the room, not bilaterally\n→ Communicate decisions in writing — every stakeholder hears the same thing",
    detailed_answer: "Conflicting stakeholder priorities are a resource allocation problem, not a politics problem. The architect's job is to make the trade-offs visible and the decision process fair.\n\nWhat interviewers look for:\n→ You have a structured process, not ad-hoc negotiation\n→ You protect the team from being caught in bilateral stakeholder deals\n→ You make trade-offs transparent rather than making unilateral calls\n→ You communicate decisions consistently\n\nFramework:\n\n1. Map all requests to business outcomes:\n'Stakeholder A wants feature X to reduce churn. Stakeholder B wants platform Y to reduce operational cost. Both are valid — they are competing for the same sprint capacity.'\nMapping to outcomes makes the conversation objective — it is no longer A vs B, it is churn reduction vs cost reduction.\n\n2. Explicit capacity model:\nMake team capacity visible: 'We have 3 sprint-teams available this quarter after maintaining our current commitments.'\nWhen stakeholders see the actual constraint, arbitrary escalation diminishes.\n\n3. Shared prioritisation forum:\nBring conflicting stakeholders into the same room with the same information.\nBilateral conversations allow each to push without seeing the other's case.\nShared forum forces the trade-off discussion to happen explicitly.\n\n4. Escalate the trade-off, not the conflict:\n'Stakeholder A's request gives us £500K ARR uplift. Stakeholder B's request reduces our incident spend by £300K/year. We can do one this quarter. Here is my recommendation.'\nGive leadership what they need to make a decision — not a dispute to adjudicate.\n\n5. Communicate the decision to all stakeholders simultaneously:\nSame message, same framing, same timeline.\nBilateral communication allows each stakeholder to believe they got more than they did.",
    key_points: [
      "Map requests to business outcomes — makes prioritisation objective rather than political",
      "Explicit capacity model: visible constraint reduces arbitrary escalation",
      "Shared prioritisation forum: bilateral conversations allow push without trade-off visibility",
      "Escalate the trade-off not the conflict — bring options and a recommendation",
      "Simultaneous communication to all stakeholders — same message, no information asymmetry"
    ],
    hint: "What was the actual mechanism you used? A prioritisation forum, a written capacity model, or direct escalation? The story needs a specific process — not just 'I talked to everyone.'",
    common_trap: "Solving this through bilateral negotiation — talking to each stakeholder separately and trying to satisfy everyone a little. This produces commitments you cannot keep and destroys credibility when you miss them. The trade-off needs to be made in the open.",
    follow_up_questions: [
      {
        text: "How do you prevent stakeholders from re-litigating prioritisation decisions every sprint?",
        type: "inline",
        mini_answer: "Documented decision with business rationale shared to all stakeholders immediately. Standing quarterly planning forum — conflicts are raised there, not ad hoc. Clear owner of the prioritisation decision so stakeholders know who to approach. 'Why was X not shipped this sprint?' has a boring, transparent answer if the decision was made openly — there is nothing to re-litigate."
      },
      {
        text: "What is the difference between stakeholder management and stakeholder manipulation?",
        type: "inline",
        mini_answer: "Management: transparent trade-offs, consistent communication, and decisions all stakeholders can see and understand even if they disagree. Manipulation: selectively framing information, making bilateral commitments that imply different relative priorities, or delaying bad news. The test: 'Would all stakeholders still trust the process if they could see every conversation I had?' If no — it is manipulation."
      }
    ],
    related: ["12.4.01", "12.4.02", "10.4.03", "12.6.03"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "stakeholder", "prioritisation", "communication", "leadership", "soft-skills"]
  },

  // ─── 12.5 Mentorship & Team Growth ──────────────────

  {
    id: "12.5.01",
    section: 12,
    subsection: "12.5",
    level: "intermediate",
    question: "Tell me about a time you helped a struggling engineer significantly improve their performance. What was your approach?",
    quick_answer: "→ Diagnose first: skill gap, motivation issue, or personal circumstance?\n→ Private 1:1 with specific observations — no generalisations\n→ Agree on one clear measurable goal over a short timeframe\n→ Create early-win opportunities: visible success rebuilds confidence\n→ Consistent check-ins — not just the initial conversation",
    detailed_answer: "Helping a struggling engineer is a leadership test. The quality of your diagnosis determines whether your intervention helps or makes things worse.\n\nWhat interviewers look for:\n→ You diagnosed before prescribing\n→ You had a private, honest, specific conversation\n→ You gave actionable, measurable feedback\n→ You created conditions for success, not just performance pressure\n→ You followed through\n\nFramework:\n\n1. Diagnose the root cause:\nFour possibilities: skill gap, knowledge gap, motivation/engagement issue, or external personal circumstance.\nEach has a completely different intervention.\nAsking one question reveals most of it: 'How are you finding things at the moment?'\n\n2. Private 1:1 with specific observations:\n'I have noticed that your last three pull requests have each had design issues flagged in review. I want to understand what is happening so I can help.'\nSpecific observations, not generalisations ('your quality has been off lately').\n\n3. Agree on one concrete goal:\nNot a list of things to improve — one specific, measurable thing.\n'For the next two sprints, I would like you to share a design doc for any feature over X complexity before you start coding.'\n\n4. Create early-win opportunities:\nGive them a task matched to their current capacity — where success is very likely.\nVisible success rebuilds confidence and motivation in a way that pressure alone never does.\n\n5. Regular check-ins:\nNot monthly. Weekly initially.\nThe check-in is not an inspection — it is a support signal.",
    key_points: [
      "Diagnose root cause first: skill gap, knowledge gap, motivation, or personal circumstance",
      "Private 1:1 with specific observations — not generalisations",
      "One concrete measurable goal for a short timeframe — not a list",
      "Early-win opportunity: success at manageable scale rebuilds confidence",
      "Regular check-ins (weekly initially) as support signal, not performance inspection"
    ],
    hint: "What specifically was the struggle? Technical skill, communication, engagement, or something personal? The right intervention depends entirely on the root cause.",
    common_trap: "Jumping straight to a performance improvement plan or increased oversight. This signals distrust and often accelerates disengagement. The first conversation should be diagnostic, not corrective. Most struggling engineers already know they are struggling — they need support, not more pressure.",
    follow_up_questions: [
      {
        text: "How do you handle the situation when someone is not improving despite your support?",
        type: "inline",
        mini_answer: "Separate your assessment from your effort: you gave genuine support, the outcome is not your personal failure. Document the specific interventions, the goals set, and the results. Have a direct conversation: 'I want to be honest with you — we agreed on X, and I have not seen the progress we both hoped for. I am concerned. Can we talk about what is getting in the way?' If no improvement after a genuine PIP: work with HR. Compassion and honesty are not opposites."
      },
      {
        text: "How do you balance supporting a struggling engineer with protecting the team's delivery momentum?",
        type: "inline",
        mini_answer: "Do both explicitly rather than pretending there is no tension. Be transparent with your team lead or manager about the capacity impact. Pair the struggling engineer on deliverables where a more experienced engineer can catch issues before they affect delivery. Do not hide the problem from the team's delivery plan — invisible debt is the most dangerous kind."
      }
    ],
    related: ["12.5.02", "12.5.03", "10.5.01"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "mentorship", "leadership", "team-growth", "coaching", "STAR"]
  },

  {
    id: "12.5.02",
    section: 12,
    subsection: "12.5",
    level: "advanced",
    question: "How have you raised the technical quality and engineering culture of a team that inherited significant technical debt?",
    quick_answer: "→ Measure first — know the actual state: coverage, deploy frequency, MTTR\n→ Fix the highest-leverage bottleneck, not everything at once\n→ Invest in developer experience: fast builds, reliable tests, clear runbooks\n→ Celebrate quality wins publicly — culture shifts through recognition\n→ Sustainable 20% rule: quality investment embedded in every sprint",
    detailed_answer: "Raising engineering culture in a debt-laden team is a multi-month effort requiring structural intervention, not just exhortation.\n\nWhat interviewers look for:\n→ You measured before prescribing\n→ You picked the highest-leverage intervention\n→ You changed structure and incentives, not just expectations\n→ You were patient: culture change takes months\n\nFramework:\n\n1. Measure the actual state:\nTest coverage percentage. Mean time between deployment failures. MTTR for incidents. Lead time for change.\nYou cannot improve what you have not measured. This also gives you the before/after story.\n\n2. Identify the highest-leverage bottleneck:\nWhat single change would have the biggest downstream effect on quality?\nOften: flaky tests (slow CI → developers bypass it), or no observability (incidents take too long to diagnose).\n\n3. Fix the developer experience:\nFast builds, reliable tests, clear runbooks, good local development setup.\nDebt often accumulates because working in the system is unpleasant — fix the unpleasantness first.\n\n4. Celebrate quality wins:\nPublicly acknowledge the engineer who fixed the oldest bug or wrote the best post-mortem.\nCulture shifts through what gets celebrated, not what gets mandated.\n\n5. Sustainable allocation:\n20% rule or equivalent: every sprint includes quality investment alongside delivery.\n'We ship features and we pay debt. Both are in the plan.'\n\n6. Pair and guild model:\nSenior engineers pair on quality-sensitive changes.\nGuild meetings: shared standards, shared learnings, cross-team consistency.",
    key_points: [
      "Measure first: test coverage, deploy frequency, MTTR, lead time — before prescribing",
      "Highest-leverage bottleneck: one change with the biggest downstream quality impact",
      "Developer experience: fast builds, reliable tests, good runbooks — fixes root of debt accumulation",
      "Celebrate quality wins publicly — culture shifts through recognition, not mandate",
      "Sustainable 20% rule: quality investment in every sprint, not periodic cleanup sprints",
      "Pair and guild model: shared standards through collaboration, not top-down enforcement"
    ],
    hint: "What was the single change that had the most downstream effect? And how did you make quality investment feel like part of the team's normal work, not extra work on top of delivery?",
    common_trap: "Running a big-bang 'tech debt sprint' to address everything at once. These sprints typically underdeliver, demoralise the team, and are never repeated. Sustainable improvement comes from embedding quality investment in every sprint.",
    follow_up_questions: [
      {
        text: "How do you measure the improvement in technical quality over time?",
        type: "linked",
        links_to: "10.2.01",
        mini_answer: "Track: test coverage trend, deployment frequency, change failure rate, MTTR. Also track team satisfaction with the codebase via quarterly survey. Plot these over time — quality improvements have a leading indicator (test coverage up) before the lagging indicator (incidents down). Showing the trend to leadership converts quality investment from a cost to a demonstrable ROI."
      },
      {
        text: "How do you keep the team motivated to pay down debt when product is always pushing for features?",
        type: "inline",
        mini_answer: "Frame debt payment in product terms: 'Addressing this will reduce our incident rate, which is currently blocking feature delivery by X hours per week.' Make the trade-off explicit in sprint planning: 'If we skip this, our deploy time stays at 45 minutes and we cannot do same-day hotfixes.' Debt becomes negotiable when its cost is visible. It becomes a team sport when quality is in everyone's career expectations — not just the architect's."
      }
    ],
    related: ["12.5.01", "10.2.01", "10.7.01"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "tech-debt", "engineering-culture", "leadership", "team-growth", "quality"]
  },

  {
    id: "12.5.03",
    section: 12,
    subsection: "12.5",
    level: "intermediate",
    question: "How do you onboard a new senior engineer to maximise their impact while protecting the team's delivery momentum?",
    quick_answer: "→ 30/60/90 plan: learn → contribute → lead — explicit phases with clear expectations\n→ Context-heavy first two weeks: architecture, decisions, and why — not just how\n→ First production deployment within week two: real ownership, safely scaffolded\n→ Pair on the first significant feature: you learn their style, they learn the codebase\n→ Capture their fresh perspective immediately — they lose it once they absorb team blind spots",
    detailed_answer: "Senior engineer onboarding is different from junior onboarding. The risk is not 'can they do the work' — it is 'will they be effective in this specific context.'\n\nWhat interviewers look for:\n→ You treat onboarding as a structured investment, not a sink-or-swim trial\n→ You are explicit about expectations and phases\n→ You capture the value of the fresh perspective while they still have it\n→ You protect team delivery while the new hire finds their feet\n\nFramework:\n\n1. 30-60-90 plan with explicit phases:\nDays 1–30: Learn. No pressure to deliver. Read the ADRs, shadow incidents, explore the codebase.\nDays 31–60: Contribute. Ship one meaningful feature end-to-end with pairing support.\nDays 61–90: Lead. Own a small domain, run a design review, begin mentoring others.\n\n2. Context first — not just how, but why:\nADRs, post-mortems, historical incidents.\n'We built it this way because of X constraint' is more valuable to a senior engineer than any code walkthrough.\n\n3. First production deployment in week two:\nReal ownership, safely scaffolded (pair deploy, canary, monitoring set up together).\nProduces confidence and signals trust.\n\n4. Pair on first significant feature:\nYou observe their technical decision-making style.\nThey learn system conventions at code level.\nThis also surfaces any context gaps before they become misaligned design decisions.\n\n5. Capture the fresh perspective:\n'What is confusing or missing in our documentation? What would you do differently based on what you have seen?'\nTheir fresh perspective is most valuable before they have absorbed the team's blind spots.",
    key_points: [
      "30/60/90 plan: learn → contribute → lead — explicit phases prevent under/over-expectation",
      "Context-heavy first two weeks: ADRs, post-mortems, incidents — the why not just the how",
      "First production deployment in week two: real ownership, safely scaffolded",
      "Pair on first significant feature: observe their style, surface context gaps early",
      "Capture fresh perspective immediately — they lose it once they absorb team blind spots"
    ],
    hint: "What was the most important context they needed that was not obvious from the code? How did you ensure they got it in the first two weeks rather than discovering it six months in?",
    common_trap: "Leaving a senior engineer to onboard themselves because 'they are senior — they will figure it out.' Senior engineers ramp up faster with structured context, not less. The cost of a misaligned senior engineer is much higher than a misaligned junior, because they make bigger decisions.",
    follow_up_questions: [
      {
        text: "How do you handle a new senior engineer who arrives with strong opinions and immediately wants to change everything?",
        type: "inline",
        mini_answer: "Listen genuinely — some of what they see is real. Channel the energy: 'Write up the three changes you think would have the most impact — I want to do a proper RFC with you.' This takes the pressure out of the room, gives their ideas due process, and demonstrates that the team values challenge. Mandate a 30-day observation period before proposing structural changes: 'Understand the why before proposing the what.'"
      },
      {
        text: "How do you measure whether onboarding was successful?",
        type: "inline",
        mini_answer: "At 90 days: Are they shipping independently? Are they named as owner of at least one domain? Do they know who to ask about which decisions? Qualitative 1:1 at 90 days: 'What did you know at day 90 that you wish you had known at day 30?' This surfaces gaps in the onboarding process for the next hire."
      }
    ],
    related: ["12.5.01", "12.5.02", "10.5.02"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "onboarding", "mentorship", "leadership", "senior-engineer", "team-growth"]
  },

  // ─── 12.6 Prioritisation Under Pressure ─────────────

  {
    id: "12.6.01",
    section: 12,
    subsection: "12.6",
    level: "intermediate",
    question: "Describe a time you had to cut scope to meet a hard deadline. How did you decide what to cut, and how did you handle the stakeholder conversation?",
    quick_answer: "→ Validate the deadline — is it truly fixed or negotiable?\n→ Separate must-have from nice-to-have: shippable skeleton vs enhancement\n→ Involve stakeholders in the trade-off: do not decide alone\n→ Never cut production safety: observability, error handling, rollback\n→ Document deferred scope with explicit intent to revisit",
    detailed_answer: "Cutting scope is a craft — done well it delivers a valuable product on time; done poorly it delivers a fragile skeleton that embarrasses the team.\n\nWhat interviewers look for:\n→ You made the cut deliberately, not by attrition\n→ You protected production safety even while cutting features\n→ You involved stakeholders in the decision\n→ You treated deferred scope as deferred — not forgotten\n\nFramework:\n\n1. Validate the deadline:\n'Is this date fixed because of a conference, a regulatory deadline, a contract — or is it a preference?'\nExternal deadlines are different from internal ones. Get the real constraint.\n\n2. Identify the shippable skeleton:\nWhat is the minimum that delivers real value and is safe in production?\nNot a prototype — a working slice with the happy path that users can actually rely on.\n\n3. Categorise the backlog:\nMust-have: without this the product has no value or is unsafe.\nShould-have: materially improves the product but can follow in a week.\nNice-to-have: enhancement that can wait a sprint.\n\n4. Involve stakeholders:\n'Here is what I can ship by the deadline and here is what will follow in the first two weeks after. I want your sign-off on this trade-off.'\nNever cut scope silently — stakeholders find out and lose trust in the process.\n\n5. Never cut production safety:\nObservability, error handling, graceful degradation, rollback procedure.\nA fast-shipped feature that causes an incident costs far more time than the scope cut saved.\n\n6. Document deferred scope:\nBacklog ticket with the original deadline context attached.\n'Deferred from [project] for [reason]. Revisit in [sprint].'",
    key_points: [
      "Validate whether the deadline is truly fixed — external vs internal constraint",
      "Shippable skeleton: happy path that is safe and valuable — not a prototype",
      "Involve stakeholders in the trade-off conversation before cutting silently",
      "Never cut production safety: observability, error handling, rollback procedure",
      "Deferred scope is documented with explicit revisit intent — not forgotten"
    ],
    hint: "What was the non-negotiable that made the deadline real? And what was the cut that hurt most — and how did you explain it to the person who wanted it most?",
    common_trap: "Cutting scope silently and hoping no one notices until after the deadline. They always notice. The scope conversation before the deadline is uncomfortable but recoverable. The discovery conversation after delivery is neither.",
    follow_up_questions: [
      {
        text: "How do you prevent deferred scope from becoming permanently forgotten scope?",
        type: "inline",
        mini_answer: "Tag deferred items explicitly in the backlog with the deadline context and the stakeholder who agreed to deferral. Review deferred items in sprint planning quarterly. When the constraint that caused the deferral changes, proactively bring them back. Stakeholders notice when you remember without being chased."
      },
      {
        text: "What is the difference between cutting features and cutting corners?",
        type: "inline",
        mini_answer: "Cutting features: reducing scope with stakeholder agreement — fewer things are done, all done well. Cutting corners: doing things poorly to ship faster — the same scope, but with hidden defects, missing error handling, or skipped tests. Corners create invisible debt that surfaces as incidents and rework — always more expensive than the time saved. The rule: if you are shipping it, ship it properly."
      }
    ],
    related: ["12.6.02", "12.6.03", "10.3.01"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "prioritisation", "scope", "deadline", "STAR", "delivery"]
  },

  {
    id: "12.6.02",
    section: 12,
    subsection: "12.6",
    level: "advanced",
    question: "How do you decide which technical debt to tackle when everything feels urgent and there is never enough capacity?",
    quick_answer: "→ Map debt to business impact: incidents, delivery slowdown, compliance risk\n→ Compound interest test: which items get worse with time if untouched?\n→ Smallest item with highest downstream leverage first\n→ Track debt like product work: visible backlog, sized, owned\n→ Sustainable 20% allocation — not a periodic cleanup sprint",
    detailed_answer: "Technical debt prioritisation is a resource allocation problem with incomplete information. The goal is not to eliminate all debt — it is to prevent debt from compounding into crises.\n\nWhat interviewers look for:\n→ You have a structured triage approach\n→ You connect debt to business outcomes\n→ You have a sustainable process, not a periodic cleanup sprint\n→ You can communicate the case for debt investment to non-engineers\n\nFramework:\n\n1. Map debt to impact:\nFour categories:\n→ Safety: causes or risks production incidents. Highest priority.\n→ Velocity: slows feature delivery or blocks deployment. High priority.\n→ Compliance: creates regulatory or security exposure. Cannot defer.\n→ Irritant: annoying but has no measurable downstream impact. Defer.\n\n2. Compound interest test:\nWhich items get worse with time if untouched?\nA flaky test suite that loses 5 minutes per developer per day compounds.\nA deprecated library with no known CVE does not.\n\n3. Smallest item with highest downstream leverage:\n'If we fix this one test framework issue, the CI run drops from 22 minutes to 8. That unblocks everything else.'\n\n4. Track like product work:\nBacklog item, size estimate, assigned owner, sprint capacity.\nInvisible debt gets no attention. Visible debt is manageable.\n\n5. Sustainable 20% allocation:\n'Every sprint, 20% of team capacity goes to quality investment.'\nThis is non-negotiable and communicated to stakeholders as part of team capacity.\n\n6. Communicate in business terms:\n'We are losing 4 hours per incident to slow diagnosis because we have no distributed tracing. That is £3K/incident at our incident rate. The investment to fix it is 3 sprint-weeks.'",
    key_points: [
      "Four-category triage: safety, velocity, compliance, irritant — prioritise in that order",
      "Compound interest test: which items get materially worse with time?",
      "Smallest item with highest downstream leverage: unblocks everything else",
      "Track debt like product work: visible backlog, sized, owned — invisible debt gets no attention",
      "Sustainable 20% allocation: non-negotiable, communicated as team capacity constraint",
      "Business case: incident cost × frequency vs investment cost — makes debt visible to non-engineers"
    ],
    hint: "What was the specific debt item you prioritised and what was your reasoning? The answer should map the debt to a measurable business impact — not just 'it was really messy code.'",
    common_trap: "Prioritising debt based on code elegance rather than business impact. Messy but stable code that never causes incidents can wait indefinitely. Clean but fragile code that causes weekly incidents should be addressed immediately — regardless of aesthetics.",
    follow_up_questions: [
      {
        text: "How do you get leadership to approve capacity for tech debt work when they only see feature throughput?",
        type: "linked",
        links_to: "10.2.02",
        mini_answer: "Connect debt cost to outcomes they measure: incident rate, mean deploy time, feature lead time. Present a specific investment: '6 sprint-weeks to reduce our CI time from 25 to 8 minutes, delivering back 30 minutes of developer time per day per engineer.' Show the payback period. Frame as infrastructure investment with a measurable return — not as housekeeping."
      },
      {
        text: "What is the difference between planned debt and unplanned debt?",
        type: "inline",
        mini_answer: "Planned debt: a deliberate trade-off — 'we are taking this shortcut to meet the deadline, and we will fix it in sprint X.' Managed with a backlog item and explicit revisit. Unplanned debt: accumulates without awareness — poor practices, no review, deferred maintenance. Unplanned debt compounds faster because it is invisible. Planned debt can be budgeted; unplanned debt surprises you."
      }
    ],
    related: ["12.6.01", "12.6.03", "10.2.01", "10.2.02"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "tech-debt", "prioritisation", "leadership", "delivery", "quality"]
  },

  {
    id: "12.6.03",
    section: 12,
    subsection: "12.6",
    level: "advanced",
    question: "Tell me about a time you had to make a hard call between two equally important competing priorities. What drove your decision?",
    quick_answer: "→ Clarify each priority's actual urgency and consequence of delay\n→ Identify which is reversible: delay X vs delay Y — which is harder to recover?\n→ Surface the trade-off explicitly — do not absorb it silently\n→ Make the decision with your manager or stakeholder, not alone\n→ Commit fully and revisit the delayed priority with a concrete date",
    detailed_answer: "True equal priorities are rare — usually the urgency or reversibility of one is different from the other. The skill is in surfacing that difference rather than living with ambiguity.\n\nWhat interviewers look for:\n→ You did not try to do both poorly\n→ You surfaced the trade-off rather than absorbing it silently\n→ You involved the right people in the decision\n→ You committed fully and followed through on the delayed priority\n\nFramework:\n\n1. Clarify actual urgency:\n'Priority A has a regulatory deadline on Friday. Priority B is important but has no external deadline.'\nIn most cases, this surfaces a clear answer without further analysis.\n\n2. Reversibility test:\nWhich delay is harder to recover from?\nMissing a regulatory window: may not recur for 12 months.\nDelaying a feature enhancement: delayed by one sprint.\n\n3. Downstream impact:\n'If I delay Priority A, who is affected and when do they feel it?'\n'If I delay Priority B, same question.'\nThis converts an abstract choice into a concrete consequence comparison.\n\n4. Do not absorb the trade-off alone:\n'I have two priorities that cannot both be done this sprint. Here is the trade-off. I need your input.'\nPriorities are set by the organisation, not by the architect.\nYour job is to make the constraint visible and escalate the decision upward.\n\n5. Commit fully:\nOnce the decision is made — execute the chosen priority without hedging.\nAllocate the team's full capacity. Do not hedge by doing a little of both.\n\n6. Revisit the delayed priority:\nImmediately set a concrete date for the deferred item.\n'We address Priority B in the next sprint — I am adding it to sprint planning now.'",
    key_points: [
      "Clarify actual urgency: most 'equal' priorities are not equal on deadline or reversibility",
      "Reversibility test: which delay is harder to recover from?",
      "Do not absorb the trade-off alone — escalate the constraint and involve the right people",
      "Commit fully to the chosen priority — no hedging with partial effort on both",
      "Immediately set a concrete date for the deferred priority"
    ],
    hint: "What made this genuinely hard — was it that both had the same external deadline, or the same internal sponsor? How did you resolve the deadlock?",
    common_trap: "Trying to partially address both priorities and delivering neither well. This is the most common outcome when the trade-off is not surfaced. The person who made neither priority feel delayed is the person who made both deliveries feel incomplete.",
    follow_up_questions: [
      {
        text: "What frameworks exist for prioritisation when urgency and impact are both high?",
        type: "inline",
        mini_answer: "RICE (Reach × Impact × Confidence / Effort): adds probability and effort to pure impact scoring. MoSCoW (Must/Should/Could/Won't): simple stakeholder-facing categorisation. ICE (Impact × Confidence × Ease): fast, low-ceremony. None of these replace judgment, but all force explicit trade-off articulation before a decision is made."
      },
      {
        text: "How do you handle it when the priority you deprioritised fails to get addressed in the next sprint either?",
        type: "inline",
        mini_answer: "Escalate immediately. Deferred twice is a systemic prioritisation failure, not a one-off. Surface it explicitly: 'This has been deferred twice now. What needs to change for it to get addressed?' If the answer is 'nothing' — document that it has been consciously deprioritised and remove it from active tracking. Zombie backlog items with false urgency create planning noise."
      }
    ],
    related: ["12.6.01", "12.6.02", "12.4.03", "10.4.03"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "prioritisation", "decision-making", "leadership", "STAR", "delivery"]
  },

  // ─── 12.7 Ownership & Accountability ────────────────

  {
    id: "12.7.01",
    section: 12,
    subsection: "12.7",
    level: "intermediate",
    question: "Tell me about a time you took ownership of a problem that was not strictly your responsibility. What drove you to step in?",
    quick_answer: "→ Ownership is driven by impact, not by organisational boundary\n→ Act first, coordinate handover second\n→ Bring the relevant people in — do not single-handedly solve cross-team problems\n→ Document what was done and why — avoids 'who asked you?' conversations\n→ Ensure the right owner picks it up — situational vs permanent ownership",
    detailed_answer: "This question tests whether you take a company-ownership mindset or a job-description mindset. The best architects do both — they step in without creating dependency or overstepping permanently.\n\nWhat interviewers look for:\n→ You acted because the impact demanded it — not for credit\n→ You brought the right people in rather than going solo\n→ You documented the situation and facilitated a proper handover\n→ You understand the difference between situational ownership and permanent scope-creep\n\nFramework:\n\n1. The trigger:\n'The problem was causing X impact, and it was unclear who owned it.'\nAmbiguous ownership in a production incident is common — someone has to go first.\n\n2. Act first:\nIn high-urgency situations, act and coordinate simultaneously.\nDo not wait for alignment when users are impacted.\n\n3. Bring others in:\nNotify the likely owners immediately: 'This appears to be in your domain — I am working on it, join me if you can.'\nThis signals collaboration, not territory.\n\n4. Document and communicate:\nWhat you found, what you did, what the current state is.\nThis enables handover and prevents 'who asked you to touch this?' conversations.\n\n5. Clean handover:\nOnce the immediate crisis is resolved — hand it back formally.\n'The immediate issue is resolved. Long-term fix needs to live with Team X because it requires changes to their data model. I have documented the root cause.'\n\n6. Avoid permanent expansion:\nStepping in for a crisis is not the same as owning it permanently.\nBe explicit about what you are doing and for how long.",
    key_points: [
      "Ownership triggered by impact, not job description — someone must go first in ambiguous ownership situations",
      "Act first in high-urgency situations, coordinate simultaneously",
      "Bring likely owners in immediately — signal collaboration, not territory",
      "Document: what was found, what was done, current state — enables clean handover",
      "Explicit about duration: situational ownership for the crisis, not permanent scope expansion"
    ],
    hint: "Why did you specifically step in rather than waiting for the 'real' owner? The answer reveals your motivation — was it impact, urgency, capability, or opportunity?",
    common_trap: "Solving it solo without involving the actual owners. This creates dependency, builds resentment, and prevents the owning team from understanding their own system. Even in a crisis, a quick 'I am working on this — join if you can' message is far better than silent solo heroics.",
    follow_up_questions: [
      {
        text: "How do you avoid becoming the person everyone escalates to because 'you always fix it'?",
        type: "inline",
        mini_answer: "Fix the problem and the gap that allowed it to be ambiguous. If ownership was unclear: propose a clear ownership model after the incident. If the owning team lacked capability: offer a knowledge transfer session. If they are under-resourced: surface the gap to engineering leadership. 'You always fix it' becomes 'you always fix the systemic cause' — different reputation, same energy."
      },
      {
        text: "What is the difference between taking ownership and overstepping?",
        type: "inline",
        mini_answer: "Ownership: you act in the organisation's interest, communicate clearly, involve the right people, and facilitate handover. Overstepping: you act without communicating, exclude the domain owner, make permanent changes outside your authority, or take credit for work that belongs to another team. The test: 'Would the owning team, having seen everything I did, agree it was helpful?' If yes — ownership. If they feel bypassed — overstepping."
      }
    ],
    related: ["12.7.02", "12.7.03", "12.7.04", "10.7.02"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "ownership", "accountability", "leadership", "STAR", "soft-skills"]
  },

  {
    id: "12.7.02",
    section: 12,
    subsection: "12.7",
    level: "advanced",
    question: "How do you maintain engineering quality and standards without becoming the bottleneck for every technical decision?",
    quick_answer: "→ Define standards explicitly and publicly — teams cannot follow rules they cannot see\n→ Build quality into the toolchain: linting, PR templates, CI gates\n→ Delegate authority to trusted engineers — empower, do not just approve\n→ Async review for most decisions, sync only for high-risk or novel ones\n→ Teach your reasoning, not your conclusions — build judgment in the team",
    detailed_answer: "The architect who reviews everything produces two problems: slow delivery and a team that has not learned to make good decisions independently.\n\nWhat interviewers look for:\n→ You understand that standards scale through systems and culture, not individuals\n→ You delegate authority, not just tasks\n→ You invest in building team judgment, not just applying your own\n→ You have explicit criteria for when you do and do not need to be involved\n\nFramework:\n\n1. Write the standards down:\nDecision frameworks, golden-path templates, ADR templates, runbook standards.\nIf it is not written, it is not a standard — it is a personal preference that only you know.\n\n2. Build quality into the toolchain:\nLinting rules, PR templates with design trade-off prompts, required CI gates, automated security scanning.\nQuality enforced by tooling does not require your review.\n\n3. Define your involvement criteria explicitly:\nI need to be involved in: public API contract changes, data model additions, new service creation, security-sensitive decisions.\nI do not need to be involved in: implementation choices within an agreed pattern, refactors, dependency updates.\n\n4. Delegate authority to trusted engineers:\n'You are the decision-maker for this domain. I am a consultant — ask me when you want input, not when you need permission.'\n\n5. Teach reasoning, not conclusions:\nIn reviews: 'Why did you choose this approach? What alternatives did you consider?'\nThe goal is not to approve this PR — it is to ensure the engineer can make this decision alone next time.\n\n6. Review your own involvement patterns:\nIf you are in every significant review — you are a bottleneck.\nAsk: 'Which of these could a senior engineer on my team have handled without me?'\nThat is the gap to close.",
    key_points: [
      "Standards must be written and public — implicit standards are personal preferences only you know",
      "Build quality into toolchain: linting, CI gates, PR templates — reduces need for human review",
      "Explicit involvement criteria: high-risk and novel decisions need you; routine implementation does not",
      "Delegate authority not just tasks: the engineer is the decision-maker, you are a consultant",
      "Teach reasoning not conclusions: the goal is the engineer making the decision alone next time",
      "Review your own involvement patterns: if you are in everything, you are the bottleneck"
    ],
    hint: "What is the specific mechanism you use to scale your standards beyond your own bandwidth? And how do you know when the standards are being followed without being in every review?",
    common_trap: "Creating quality standards that only you understand and only you enforce. This produces compliance when you are present and collapse when you are not. Standards that survive your absence are the only standards worth having.",
    follow_up_questions: [
      {
        text: "How do you handle engineers who bypass the standards you have established?",
        type: "inline",
        mini_answer: "First understand why: is the standard unclear, the tooling broken, the process too slow, or do they genuinely disagree? Address the root cause. If the standard is unclear — improve the documentation. If the tooling is broken — fix it first. If the process is too slow — streamline it. If they disagree — have the RFC conversation. Only after all of these: treat it as a conduct issue. Most standard bypass is friction avoidance, not rebellion."
      },
      {
        text: "How do you prevent standards from becoming stale as the technology and team evolve?",
        type: "linked",
        links_to: "10.6.02",
        mini_answer: "Standards have review cycles — just like code. Quarterly or semi-annual review in an architecture forum. Mark standards with a 'last reviewed' date. When someone challenges a standard with evidence — treat it as valuable signal. A standard that has not been reviewed in 18 months is probably stale."
      }
    ],
    related: ["12.7.01", "12.7.04", "10.7.01", "10.6.01"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "ownership", "standards", "leadership", "technical-leadership", "quality"]
  },

  {
    id: "12.7.03",
    section: 12,
    subsection: "12.7",
    level: "intermediate",
    question: "Describe a time you had to deliver bad news to leadership about a project. How did you prepare and deliver it?",
    quick_answer: "→ Do not delay: bad news does not improve with age\n→ Know the full facts before the conversation — not the partial picture\n→ Lead with impact and timeline — not with cause\n→ Come with options, not just the problem\n→ Make a specific ask: what do you need from them and by when?",
    detailed_answer: "Delivering bad news is a test of both courage and preparation. Done poorly it erodes trust. Done well it builds it — because leaders value engineers who surface problems early.\n\nWhat interviewers look for:\n→ You did not delay or soften the message until it was too late\n→ You came prepared with facts, not just a feeling\n→ You led with business impact\n→ You came with options and a clear ask\n→ The relationship was intact after the conversation\n\nFramework:\n\n1. Do not delay:\n'Bad news does not improve with age.'\nThe earlier leadership hears it, the more options they have.\nDelaying bad news until it is undeniable is the most common and most costly mistake.\n\n2. Know the full facts:\nDo not go in with a partial picture.\nGather: current state, scope of impact, likely root cause, options.\n\n3. Lead with business impact and timeline:\n'We will not hit the Q3 delivery date. The impact is a delayed contract renewal worth £1.2M.'\nNot: 'The team has hit some technical challenges with the integration.'\n\n4. Come with options:\n'Here are three paths: (A) reduce scope to hit the original date, (B) extend the deadline by three weeks to deliver full scope, (C) bring in two additional engineers from Platform team to accelerate.'\nLeadership needs to make a decision, not just receive information.\n\n5. Specific ask:\n'I need your decision between Options A and B by Wednesday so I can restructure the sprint.'\n\n6. Follow up in writing:\nEmail summary of what was discussed, what was decided, and what happens next.\nProtects everyone.",
    key_points: [
      "Do not delay — the earlier leadership hears it, the more options remain available",
      "Know the full facts before the conversation — partial picture creates anxiety without direction",
      "Lead with business impact and timeline — not technical cause",
      "Come with options, not just the problem — leadership needs to decide, not just receive",
      "Specific ask: what decision or resource do you need, and by when",
      "Follow up in writing: what was discussed, decided, and what happens next"
    ],
    hint: "What was the business impact — not the technical cause? And what options did you bring? The strongest answers show that you were thinking about the solution before you walked into the room.",
    common_trap: "Delivering bad news by email or Slack to avoid the difficult conversation. Significant bad news deserves a synchronous conversation where you can answer questions, read the room, and respond to concerns in real time. An email is efficient; a conversation is trusted.",
    follow_up_questions: [
      {
        text: "How do you handle it if the leader responds with anger, blame, or denial?",
        type: "inline",
        mini_answer: "Stay calm and factual: 'I understand this is difficult news. My job is to give you accurate information early so you have the most options available.' Do not become defensive or apologetic beyond what is warranted. If blame is directed at your team unfairly: 'I want to address that separately — right now the most important thing is the path forward.' Follow up with a written summary regardless of how the conversation went."
      },
      {
        text: "What is the difference between escalating a problem and dumping it on your manager?",
        type: "inline",
        mini_answer: "Escalating: bringing a problem with full context, the specific constraint that requires their authority, and at least one proposed option. Dumping: bringing a problem without context or ask and expecting them to solve it. The test: 'Am I asking for a decision that is genuinely above my authority, or am I avoiding a decision that is mine to make?' If the latter — make the decision yourself and inform them of it."
      }
    ],
    related: ["12.7.01", "12.3.01", "10.4.02", "12.4.01"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "communication", "accountability", "leadership", "STAR", "stakeholder"]
  },

  {
    id: "12.7.04",
    section: 12,
    subsection: "12.7",
    level: "advanced",
    question: "How do you establish and maintain engineering standards across teams you do not directly manage?",
    quick_answer: "→ Earn authority through expertise and track record — not title\n→ RFC process: standards proposed openly, refined collaboratively, documented publicly\n→ Golden-path tooling: working reference is more persuasive than any document\n→ Community of practice: cross-team engineers co-own the standards\n→ Measure adoption not compliance — divergence is signal, not just non-conformance",
    detailed_answer: "Standards without authority are enforced through legitimacy, not mandate. That requires a different toolkit.\n\nWhat interviewers look for:\n→ You understand that unilateral standards fail without legitimacy\n→ You have a structural approach: RFC, guild, golden path\n→ You measure adoption and understand divergence\n→ You distinguish between standards and personal preferences\n\nFramework:\n\n1. RFC process:\nPropose standards publicly. Invite critique. Refine through discussion.\nStandards that survive a genuine RFC process are accepted as legitimate.\nStandards that were decreed from the top get worked around.\n\n2. Golden-path tooling:\nBuild a working reference service using the standard.\nOther teams can copy it and get the standard for free.\n'Here is the service template — it already includes the observability, testing, and deployment patterns we expect. Fork it and modify for your domain.'\n\n3. Community of practice / guild:\nCross-team group of senior engineers who co-own the standards.\nThey carry standards back to their team and report back on friction.\nThis converts standards from 'things the architect wants' to 'things the guild agreed.'\n\n4. Measure adoption, not compliance:\n'Eight of twelve services now use the standard logging format. Four do not.'\nUnderstand why the four diverged — is the standard wrong for their use case, or is there a tooling gap?\nDivergence is information, not just non-compliance.\n\n5. Lightweight enforcement where appropriate:\nCI gates for critical standards (security scanning, minimum test coverage).\nSoft nudges for stylistic standards (PR template checklist).\nNever mandate what you have not demonstrated works.\n\n6. Evolve standards:\nQuarterly review. Standards that no one follows are candidates for retirement.",
    key_points: [
      "RFC process gives standards legitimacy — decreed standards get worked around",
      "Golden-path tooling: working reference implementation is more persuasive than any document",
      "Community of practice: cross-team co-ownership converts 'architect preference' to 'guild standard'",
      "Measure adoption not compliance — divergence is information about gaps in the standard or tooling",
      "Lightweight CI enforcement for critical standards; soft nudges for stylistic ones",
      "Quarterly evolution: standards that no one follows should be retired or revised"
    ],
    hint: "What was the mechanism that made the standard stick — the RFC, the golden-path template, or the guild? What happened when a team diverged from the standard?",
    common_trap: "Treating standard divergence as non-compliance rather than as signal. If four teams are not following your standard, the first question is 'why?' — not 'how do we enforce this?' Divergence usually means the standard doesn't work for their context, the tooling is broken, or the standard was not communicated well.",
    follow_up_questions: [
      {
        text: "How do you balance standardisation with the autonomy that senior engineers need?",
        type: "inline",
        mini_answer: "Standardise the interface, not the implementation. 'All services must expose a /health endpoint and emit structured logs to the agreed schema' — how they implement the service internals is their choice. Standardise what enables interoperability and observability; leave what enables creativity to the team. The test: 'Does this standard prevent a sensible engineer from doing something sensible?' If yes — it is over-standardised."
      },
      {
        text: "What role does an internal developer platform play in scaling standards?",
        type: "linked",
        links_to: "6.6.01",
        mini_answer: "An internal developer platform bakes standards into the default path — the path of least resistance is the correct path. Service templates, golden-path CI pipelines, pre-configured observability, standard secret injection. Engineers adopting the platform adopt the standards without effort. This converts standards from enforcement to defaults — a fundamentally more scalable model."
      }
    ],
    related: ["12.7.01", "12.7.02", "10.7.02", "10.6.01"],
    has_diagram: false,
    has_code: false,
    tags: ["behavioural", "standards", "influence", "leadership", "principal-engineer", "technical-leadership"]
  }

];
