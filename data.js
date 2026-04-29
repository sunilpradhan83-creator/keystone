// ═══════════════════════════════════════════════════
// KEYSTONE — Data Assembler
// ═══════════════════════════════════════════════════
//
// This file assembles KEYSTONE_DATA from
// individual section files in questions/
//
// TO ADD A NEW SECTION:
//   1. Create questions/section_X.js
//   2. Add <script> tag in index.html
//      BEFORE the data.js script tag
//   3. Add spread line below in questions[]
//
// SCHEMA REFERENCE (one question object):
// {
//   id:               "4.2.01"
//   section:          4
//   subsection:       "4.2"
//   level:            "basic"|"intermediate"|"advanced"
//   question:         string
//   quick_answer:     string (→ bullet format, max 5 lines)
//   detailed_answer:  string (\n for breaks)
//   key_points:       string[] (5-6 items)
//   hint:             string
//   common_trap:      string
//   follow_up_questions: [
//     { text, type:"linked", links_to:"x.x.xx" }
//     { text, type:"inline", mini_answer:string }
//   ]
//   related:          string[] (question ids)
//   has_diagram:      boolean
//   diagram:          string (ASCII, pre-formatted)
//   has_code:         boolean
//   code_language:    "java"|"python"|"yaml"|"sql"|"bash"
//   code_snippet:     string
//   tags:             string[]
// }
// ═══════════════════════════════════════════════════

const KEYSTONE_DATA = {

  // ─────────────────────────────────────────────────
  // SECTIONS — all 12 defined here
  // ─────────────────────────────────────────────────
  sections: [
    { id:1,  title:"System Design & Architecture",
      icon:"🏗️",  color:"#7C6FFF" },
    { id:2,  title:"Data & Storage",
      icon:"🗄️",  color:"#00D4A8" },
    { id:3,  title:"Non-Functional Requirements",
      icon:"⚙️",  color:"#FFB347" },
    { id:4,  title:"Design Patterns",
      icon:"🔷",  color:"#FF6B9D" },
    { id:5,  title:"Cloud & Infrastructure",
      icon:"☁️",  color:"#4FC3F7" },
    { id:6,  title:"DevOps & Platform Engineering",
      icon:"🚀",  color:"#81C784" },
    { id:7,  title:"Security Architecture",
      icon:"🔐",  color:"#FF6B6B" },
    { id:8,  title:"Data Engineering & ML",
      icon:"📊",  color:"#CE93D8" },
    { id:9,  title:"AI & GenAI Architecture",
      icon:"🤖",  color:"#F48FB1" },
    { id:10, title:"Governance & Eng Leadership",
      icon:"🏛️",  color:"#FFCC02" },
    { id:11, title:"Real-World Scenarios",
      icon:"🌍",  color:"#80DEEA" },
    { id:12, title:"Behavioural & Soft Skills",
      icon:"🧠",  color:"#BCAAA4" }
  ],

  // ─────────────────────────────────────────────────
  // SUBSECTIONS — all defined here
  // ─────────────────────────────────────────────────
  subsections: [
    // Section 1
    { id:"1.1", section:1, title:"Distributed Systems Fundamentals" },
    { id:"1.2", section:1, title:"Microservices Architecture" },
    { id:"1.3", section:1, title:"Event-Driven Architecture" },
    { id:"1.4", section:1, title:"API Design & Integration" },
    { id:"1.5", section:1, title:"Monolith to Microservices Migration" },
    { id:"1.6", section:1, title:"Real-Time Systems Design" },
    { id:"1.7", section:1, title:"Domain-Driven Design" },
    // Section 2
    { id:"2.1", section:2, title:"Database Selection & Trade-offs" },
    { id:"2.2", section:2, title:"Relational Databases" },
    { id:"2.3", section:2, title:"NoSQL Databases" },
    { id:"2.4", section:2, title:"Caching Strategies" },
    { id:"2.5", section:2, title:"Data Modeling" },
    { id:"2.6", section:2, title:"Data Replication & Consistency" },
    { id:"2.7", section:2, title:"CQRS & Event Sourcing" },
    { id:"2.8", section:2, title:"Data Partitioning & Sharding" },
    // Section 3
    { id:"3.1", section:3, title:"Scalability" },
    { id:"3.2", section:3, title:"Availability & Reliability" },
    { id:"3.3", section:3, title:"Fault Tolerance & Resilience" },
    { id:"3.4", section:3, title:"Performance & Latency" },
    { id:"3.5", section:3, title:"Security Requirements" },
    { id:"3.6", section:3, title:"Observability Requirements" },
    { id:"3.7", section:3, title:"Disaster Recovery" },
    // Section 4
    { id:"4.1", section:4, title:"Microservice Patterns" },
    { id:"4.2", section:4, title:"Resilience Patterns" },
    { id:"4.3", section:4, title:"Messaging Patterns" },
    { id:"4.4", section:4, title:"Integration Patterns" },
    { id:"4.5", section:4, title:"Data Consistency Patterns" },
    { id:"4.6", section:4, title:"Concurrency Patterns" },
    // Section 5
    { id:"5.1", section:5, title:"Cloud Provider Concepts" },
    { id:"5.2", section:5, title:"Compute" },
    { id:"5.3", section:5, title:"Networking" },
    { id:"5.4", section:5, title:"Storage" },
    { id:"5.5", section:5, title:"Managed Services" },
    { id:"5.6", section:5, title:"Multi-Cloud & Hybrid" },
    { id:"5.7", section:5, title:"Cost Optimisation" },
    { id:"5.8", section:5, title:"Infrastructure as Code" },
    // Section 6
    { id:"6.1", section:6, title:"CI/CD Pipeline Design" },
    { id:"6.2", section:6, title:"Containerisation" },
    { id:"6.3", section:6, title:"Container Orchestration" },
    { id:"6.4", section:6, title:"Deployment Strategies" },
    { id:"6.5", section:6, title:"Site Reliability Engineering" },
    { id:"6.6", section:6, title:"Platform Engineering" },
    { id:"6.7", section:6, title:"DevSecOps" },
    { id:"6.8", section:6, title:"Observability Implementation" },
    // Section 7
    { id:"7.1", section:7, title:"Authentication & Authorisation" },
    { id:"7.2", section:7, title:"Token Standards & Strategy" },
    { id:"7.3", section:7, title:"API Security" },
    { id:"7.4", section:7, title:"Zero Trust Architecture" },
    { id:"7.5", section:7, title:"Secrets Management" },
    { id:"7.6", section:7, title:"Network Security" },
    { id:"7.7", section:7, title:"Threat Modeling" },
    { id:"7.8", section:7, title:"Data Protection" },
    // Section 8
    { id:"8.1", section:8, title:"Data Pipeline Design" },
    { id:"8.2", section:8, title:"Stream Processing" },
    { id:"8.3", section:8, title:"Data Lake & Warehouse" },
    { id:"8.4", section:8, title:"ML Platform Design" },
    { id:"8.5", section:8, title:"Data Quality & Observability" },
    // Section 9
    { id:"9.0", section:9, title:"LLM Foundations" },
    { id:"9.1", section:9, title:"LLM Integration Patterns" },
    { id:"9.2", section:9, title:"RAG Architecture" },
    { id:"9.3", section:9, title:"Agentic Systems" },
    { id:"9.4", section:9, title:"AI Gateway & Model Routing" },
    { id:"9.5", section:9, title:"AI Security & Guardrails" },
    { id:"9.6", section:9, title:"Vector Databases" },
    // Section 10
    { id:"10.1", section:10, title:"Architecture Decision Records" },
    { id:"10.2", section:10, title:"Tech Debt Management" },
    { id:"10.3", section:10, title:"Build vs Buy Decisions" },
    { id:"10.4", section:10, title:"Stakeholder Communication" },
    { id:"10.5", section:10, title:"Team Structuring" },
    { id:"10.6", section:10, title:"Architecture Review Process" },
    { id:"10.7", section:10, title:"Engineering Principles" },
    // Section 11
    { id:"11.1", section:11, title:"Design from Scratch" },
    { id:"11.2", section:11, title:"Scale an Existing System" },
    { id:"11.3", section:11, title:"Migrate Legacy Systems" },
    { id:"11.4", section:11, title:"Diagnose Production Incidents" },
    // Section 12
    { id:"12.1", section:12, title:"Conflict & Disagreement" },
    { id:"12.2", section:12, title:"Influencing Without Authority" },
    { id:"12.3", section:12, title:"Handling Failure & Ambiguity" },
    { id:"12.4", section:12, title:"Stakeholder Management" },
    { id:"12.5", section:12, title:"Mentorship & Team Growth" },
    { id:"12.6", section:12, title:"Prioritisation Under Pressure" },
    { id:"12.7", section:12, title:"Ownership & Accountability" }
  ],

  // ─────────────────────────────────────────────────
  // QUESTIONS — assembled from section files
  // Each section file loaded via script tag
  // in index.html before this file
  //
  // ADD NEW SECTION:
  // 1. Create questions/section_X.js
  // 2. Add script tag in index.html
  // 3. Add spread line below
  // ─────────────────────────────────────────────────
  questions: [

    // Section 4: Design Patterns
    ...(typeof SECTION_4_QUESTIONS !== 'undefined'
        ? SECTION_4_QUESTIONS : []),

    // Section 7: Security Architecture
    ...(typeof SECTION_7_QUESTIONS !== 'undefined'
        ? SECTION_7_QUESTIONS : []),

    // Section 11: Real-World Scenarios
    ...(typeof SECTION_11_QUESTIONS !== 'undefined'
        ? SECTION_11_QUESTIONS : []),

    // Section 12: Behavioural & Soft Skills
    ...(typeof SECTION_12_QUESTIONS !== 'undefined'
        ? SECTION_12_QUESTIONS : []),

    // Section 1: System Design & Architecture
    ...(typeof SECTION_1_QUESTIONS !== 'undefined'
        ? SECTION_1_QUESTIONS : []),

    // Section 2: Data & Storage
    ...(typeof SECTION_2_QUESTIONS !== 'undefined'
        ? SECTION_2_QUESTIONS : []),

    // Section 3: Non-Functional Requirements
    ...(typeof SECTION_3_QUESTIONS !== 'undefined'
        ? SECTION_3_QUESTIONS : []),

    // ── ADD NEW SECTIONS BELOW ──────────────
    // Copy the pattern above for each new section
    // section_1.js  → SECTION_1_QUESTIONS  ✅
    // section_2.js  → SECTION_2_QUESTIONS
    // section_3.js  → SECTION_3_QUESTIONS
    // section_5.js  → SECTION_5_QUESTIONS
    // section_6.js  → SECTION_6_QUESTIONS
    // section_8.js  → SECTION_8_QUESTIONS
    // section_9.js  → SECTION_9_QUESTIONS
    // section_10.js → SECTION_10_QUESTIONS

  ]

};
