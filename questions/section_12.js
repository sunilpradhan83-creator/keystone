// questions/section_12.js
// Section 12: Behavioural & Soft Skills
// Subsections: 12.1 Conflict & Disagreement
//              12.2 Influencing Without Authority
//              12.3 Handling Failure & Ambiguity
//              12.4 Stakeholder Management
//              12.5 Mentorship & Team Growth
//              12.6 Prioritisation Under Pressure
//              12.7 Ownership & Accountability
// Target: ~22 questions
// Added: 2026-04-27

const SECTION_12_QUESTIONS = [

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
    tags: ["behavioural","conflict","stakeholder","influence","STAR","leadership"]
  }

];
