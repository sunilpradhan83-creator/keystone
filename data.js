// ═══════════════════════════════════════════════════
// KEYSTONE — Question Bank Data
// ═══════════════════════════════════════════════════
//
// HOW TO ADD QUESTIONS:
// Add objects to the questions array below.
// Follow the schema exactly.
// Every links_to value must match an existing
// question id in this file.
//
// SCHEMA REFERENCE:
// id:           "section.subsection.sequence"
//               e.g. "4.2.01"
// section:      number (1-12)
// subsection:   string e.g. "4.2"
// level:        "basic" | "intermediate" | "advanced"
// question:     string
// quick_answer: string (bullet format, → prefix)
//               Max 5 lines. Interview-ready.
//               Each → line = one key concept.
// detailed_answer: string (\n for breaks)
// key_points:   array of strings (5-6 items)
// hint:         string (directional, not the answer)
// common_trap:  string (one concrete mistake)
// follow_up_questions: array of objects:
//   { text, type: "linked"|"inline",
//     links_to: "x.x.xx" (linked only),
//     mini_answer: string (inline only) }
// related:      array of question id strings
// has_diagram:  boolean
// diagram:      string (ASCII art, pre-formatted)
// has_code:     boolean
// code_language: "java"|"python"|"yaml"|"sql"|"bash"
// code_snippet: string
// tags:         array of strings
// ═══════════════════════════════════════════════════

const KEYSTONE_DATA = {

  // ─────────────────────────────────────────────────
  // SECTIONS
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
  // SUBSECTIONS
  // ─────────────────────────────────────────────────
  subsections: [
    // Section 1
    { id:"1.1", section:1,
      title:"Distributed Systems Fundamentals" },
    { id:"1.2", section:1,
      title:"Microservices Architecture" },
    { id:"1.3", section:1,
      title:"Event-Driven Architecture" },
    { id:"1.4", section:1,
      title:"API Design & Integration" },
    { id:"1.5", section:1,
      title:"Monolith to Microservices Migration" },
    { id:"1.6", section:1,
      title:"Real-Time Systems Design" },
    { id:"1.7", section:1,
      title:"Domain-Driven Design" },

    // Section 2
    { id:"2.1", section:2,
      title:"Database Selection & Trade-offs" },
    { id:"2.2", section:2,
      title:"Relational Databases" },
    { id:"2.3", section:2,
      title:"NoSQL Databases" },
    { id:"2.4", section:2,
      title:"Caching Strategies" },
    { id:"2.5", section:2,
      title:"Data Modeling" },
    { id:"2.6", section:2,
      title:"Data Replication & Consistency" },
    { id:"2.7", section:2,
      title:"CQRS & Event Sourcing" },
    { id:"2.8", section:2,
      title:"Data Partitioning & Sharding" },

    // Section 3
    { id:"3.1", section:3, title:"Scalability" },
    { id:"3.2", section:3,
      title:"Availability & Reliability" },
    { id:"3.3", section:3,
      title:"Fault Tolerance & Resilience" },
    { id:"3.4", section:3,
      title:"Performance & Latency" },
    { id:"3.5", section:3,
      title:"Security Requirements" },
    { id:"3.6", section:3,
      title:"Observability Requirements" },
    { id:"3.7", section:3,
      title:"Disaster Recovery" },

    // Section 4
    { id:"4.1", section:4,
      title:"Microservice Patterns" },
    { id:"4.2", section:4,
      title:"Resilience Patterns" },
    { id:"4.3", section:4,
      title:"Messaging Patterns" },
    { id:"4.4", section:4,
      title:"Integration Patterns" },
    { id:"4.5", section:4,
      title:"Data Consistency Patterns" },
    { id:"4.6", section:4,
      title:"Concurrency Patterns" },

    // Section 5
    { id:"5.1", section:5,
      title:"Cloud Provider Concepts" },
    { id:"5.2", section:5, title:"Compute" },
    { id:"5.3", section:5, title:"Networking" },
    { id:"5.4", section:5, title:"Storage" },
    { id:"5.5", section:5,
      title:"Managed Services" },
    { id:"5.6", section:5,
      title:"Multi-Cloud & Hybrid" },
    { id:"5.7", section:5,
      title:"Cost Optimisation" },
    { id:"5.8", section:5,
      title:"Infrastructure as Code" },

    // Section 6
    { id:"6.1", section:6,
      title:"CI/CD Pipeline Design" },
    { id:"6.2", section:6,
      title:"Containerisation" },
    { id:"6.3", section:6,
      title:"Container Orchestration" },
    { id:"6.4", section:6,
      title:"Deployment Strategies" },
    { id:"6.5", section:6,
      title:"Site Reliability Engineering" },
    { id:"6.6", section:6,
      title:"Platform Engineering" },
    { id:"6.7", section:6, title:"DevSecOps" },
    { id:"6.8", section:6,
      title:"Observability Implementation" },

    // Section 7
    { id:"7.1", section:7,
      title:"Authentication & Authorisation" },
    { id:"7.2", section:7,
      title:"Token Standards & Strategy" },
    { id:"7.3", section:7, title:"API Security" },
    { id:"7.4", section:7,
      title:"Zero Trust Architecture" },
    { id:"7.5", section:7,
      title:"Secrets Management" },
    { id:"7.6", section:7,
      title:"Network Security" },
    { id:"7.7", section:7,
      title:"Threat Modeling" },
    { id:"7.8", section:7,
      title:"Data Protection" },

    // Section 8
    { id:"8.1", section:8,
      title:"Data Pipeline Design" },
    { id:"8.2", section:8,
      title:"Stream Processing" },
    { id:"8.3", section:8,
      title:"Data Lake & Warehouse" },
    { id:"8.4", section:8,
      title:"ML Platform Design" },
    { id:"8.5", section:8,
      title:"Data Quality & Observability" },

    // Section 9
    { id:"9.0", section:9,
      title:"LLM Foundations" },
    { id:"9.1", section:9,
      title:"LLM Integration Patterns" },
    { id:"9.2", section:9,
      title:"RAG Architecture" },
    { id:"9.3", section:9,
      title:"Agentic Systems" },
    { id:"9.4", section:9,
      title:"AI Gateway & Model Routing" },
    { id:"9.5", section:9,
      title:"AI Security & Guardrails" },
    { id:"9.6", section:9,
      title:"Vector Databases" },

    // Section 10
    { id:"10.1", section:10,
      title:"Architecture Decision Records" },
    { id:"10.2", section:10,
      title:"Tech Debt Management" },
    { id:"10.3", section:10,
      title:"Build vs Buy Decisions" },
    { id:"10.4", section:10,
      title:"Stakeholder Communication" },
    { id:"10.5", section:10,
      title:"Team Structuring" },
    { id:"10.6", section:10,
      title:"Architecture Review Process" },
    { id:"10.7", section:10,
      title:"Engineering Principles" },

    // Section 11
    { id:"11.1", section:11,
      title:"Design from Scratch" },
    { id:"11.2", section:11,
      title:"Scale an Existing System" },
    { id:"11.3", section:11,
      title:"Migrate Legacy Systems" },
    { id:"11.4", section:11,
      title:"Diagnose Production Incidents" },

    // Section 12
    { id:"12.1", section:12,
      title:"Conflict & Disagreement" },
    { id:"12.2", section:12,
      title:"Influencing Without Authority" },
    { id:"12.3", section:12,
      title:"Handling Failure & Ambiguity" },
    { id:"12.4", section:12,
      title:"Stakeholder Management" },
    { id:"12.5", section:12,
      title:"Mentorship & Team Growth" },
    { id:"12.6", section:12,
      title:"Prioritisation Under Pressure" },
    { id:"12.7", section:12,
      title:"Ownership & Accountability" }
  ],

  // ─────────────────────────────────────────────────
  // QUESTIONS
  // These 5 stub questions demonstrate every
  // possible field in the schema.
  // Claude Code uses these as rendering examples.
  // Real questions will be added to this array.
  // ─────────────────────────────────────────────────
  questions: [

    // ── STUB 1: Has diagram + code + linked followup
    {
      id: "4.2.01",
      section: 4,
      subsection: "4.2",
      level: "intermediate",
      question: "Explain the Circuit Breaker pattern. What are its three states and how does it prevent cascading failures?",
      quick_answer: "→ 3 states: Closed (normal) → Open (fast-fail all calls) → Half-Open (probe recovery)\n→ Closed: tracks failure rate in sliding window, trips at threshold\n→ Open: rejects all calls instantly, returns fallback — no threads wasted\n→ Half-Open: allows limited probe calls, closes on success\n→ Resilience4j: @CircuitBreaker + mandatory fallback method\n→ Always combine: Retry + Bulkhead + TimeLimiter",
      detailed_answer: "When a downstream service is failing, continuing to call it wastes threads and causes your service to fail too — cascading failure. The Circuit Breaker pattern breaks this chain.\n\nThree states:\n\nCLOSED (normal): Calls pass through. Failure rate tracked in a sliding window. If failure rate exceeds threshold (e.g. 50% of last 10 calls) → transitions to OPEN.\n\nOPEN (tripped): All calls rejected immediately without attempting the downstream call. Returns fallback instantly. After waitDurationInOpenState (e.g. 10s) → transitions to HALF-OPEN.\n\nHALF-OPEN (probing): Limited calls allowed through. If they succeed → back to CLOSED. If they fail → back to OPEN.\n\nKey config parameters:\n→ slidingWindowSize: how many calls to track\n→ failureRateThreshold: % to trip\n→ waitDurationInOpenState: how long to stay open\n→ slowCallDurationThreshold: slow = failure\n→ permittedNumberOfCallsInHalfOpenState: probe count\n\nAlways combine with Retry (transient failures), TimeLimiter (timeouts), Bulkhead (thread isolation). Circuit Breaker alone is not full fault tolerance.",
      key_points: [
        "3 states: Closed → Open → Half-Open",
        "Open state fast-fails all calls — saves resources, prevents cascade",
        "Sliding window tracks failure rate — configurable size and threshold",
        "Half-Open probes recovery before fully closing",
        "Always define a fallback method — never return null",
        "Combine with Retry + TimeLimiter + Bulkhead for complete resilience"
      ],
      hint: "Think about what happens to threads when the payment service is slow but not failing. Without a circuit breaker, all 200 threads block waiting. What happens to other services?",
      common_trap: "Implementing Circuit Breaker alone and calling the system fault tolerant. You also need Retry with backoff, TimeLimiter for timeouts, and Bulkhead for thread isolation. Resilience4j is one layer, not the complete solution.",
      follow_up_questions: [
        {
          text: "How does Circuit Breaker differ from the Retry pattern?",
          type: "linked",
          links_to: "4.2.02"
        },
        {
          text: "What is the Bulkhead pattern?",
          type: "linked",
          links_to: "4.2.03"
        }
      ],
      related: ["4.2.02", "4.2.03", "3.3.01"],
      has_diagram: true,
      diagram: `CIRCUIT BREAKER STATE MACHINE

            failure rate > 50%
  ┌──────────────────────────────────────┐
  │                                      │
  ▼                                      │
┌──────┐   wait duration expires   ┌──────────┐
│      │──────────────────────────►│          │
│ OPEN │                           │HALF-OPEN │
│      │◄──────────────────────────│          │
└──────┘   probe calls fail        └────┬─────┘
  ▲                                     │
  │                                     │ probe calls succeed
  │                                ┌────▼──────┐
  └────── failure rate crosses ────│           │
           threshold               │  CLOSED   │
                                   │ (normal)  │
                                   └───────────┘

OPEN state:
→ Fast-fails ALL calls immediately
→ Returns fallback response
→ No threads wasted waiting
→ Downstream gets breathing room to recover`,
      has_code: true,
      code_language: "yaml",
      code_snippet: `# Resilience4j Configuration — application.yml
resilience4j:
  circuitbreaker:
    instances:
      paymentService:
        slidingWindowSize: 10          # track last 10 calls
        failureRateThreshold: 50       # trip at 50% failure
        waitDurationInOpenState: 10s   # stay open for 10s
        permittedNumberOfCallsInHalfOpenState: 3
        slowCallDurationThreshold: 2s  # slow = failure
        slowCallRateThreshold: 80      # 80% slow = trip
  retry:
    instances:
      paymentService:
        maxAttempts: 3
        waitDuration: 500ms
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
  timelimiter:
    instances:
      paymentService:
        timeoutDuration: 3s`,
      tags: ["circuit-breaker","resilience4j",
             "fault-tolerance","patterns","spring-boot"]
    },

    // ── STUB 2: Has inline followup, no diagram
    {
      id: "4.2.02",
      section: 4,
      subsection: "4.2",
      level: "intermediate",
      question: "How does Circuit Breaker differ from the Retry pattern? When do you use each?",
      quick_answer: "→ Retry: handles transient failures — service usually works, occasional blip\n→ Circuit Breaker: handles sustained failures — service consistently failing\n→ Retry without CB: multiplies load 3x on already-failing service (retry storm)\n→ Use both together: Retry for occasional, CB stops calls under sustained failure\n→ Order: TimeLimiter → CircuitBreaker → Retry",
      detailed_answer: "They solve different failure scenarios and must be used together.\n\nRetry Pattern:\n→ Scenario: transient failure — network blip, momentary unavailability\n→ Action: retry the same call with backoff\n→ Assumption: failure is temporary, will resolve on retry\n→ Risk: if service is truly down, retries create a retry storm\n\nCircuit Breaker:\n→ Scenario: sustained failure — service consistently failing or slow\n→ Action: stop calling the service entirely, return fallback\n→ Assumption: serious failure, service needs recovery time\n→ Benefit: fast failure, resource preservation, downstream protection\n\nUsed together:\nRetry handles occasional transient failure first.\nIf failure rate remains high across retries,\nCircuit Breaker trips and stops all calls.\n\nCorrect order with Resilience4j:\nTimeLimiter (timeout) → CircuitBreaker (state check) → Retry (attempts)\n\nMax retry attempts:\n→ Internal services: 3 attempts\n→ User-facing: 1-2 (don't keep user waiting)\n→ Always use exponential backoff + jitter",
      key_points: [
        "Retry: transient failures — service usually works",
        "Circuit Breaker: sustained failures — stop calling",
        "Retry without CB: retry storm under sustained failure",
        "Use both: Retry for occasional, CB for sustained",
        "Correct order: TimeLimiter → CircuitBreaker → Retry",
        "Exponential backoff + jitter prevents thundering herd"
      ],
      hint: "Imagine the payment service just deployed a bad release — 500 errors for every call. Retry makes it worse. Circuit Breaker should have tripped first. Which pattern handles which scenario?",
      common_trap: "Configuring retry without a circuit breaker. Under sustained failure, every incoming request triggers 3 retries — you have just multiplied your traffic 3x on an already-overwhelmed service.",
      follow_up_questions: [
        {
          text: "What is exponential backoff with jitter?",
          type: "linked",
          links_to: "4.2.04"
        },
        {
          text: "How do you monitor retry and circuit breaker health in production?",
          type: "inline",
          mini_answer: "Key metrics via Micrometer → Prometheus → Grafana: resilience4j.circuitbreaker.state (0=closed, 1=open, 2=half-open), resilience4j.circuitbreaker.failure.rate, resilience4j.retry.calls (tagged by outcome). Alert on: state transitions to OPEN, failure rate > 40%, retry exhausted count rising."
        }
      ],
      related: ["4.2.01", "4.2.03", "4.2.04"],
      has_diagram: false,
      has_code: false,
      tags: ["retry","circuit-breaker","resilience",
             "backoff","patterns"]
    },

    // ── STUB 3: Basic level, security section
    {
      id: "7.2.01",
      section: 7,
      subsection: "7.2",
      level: "intermediate",
      question: "How does JWT work? How do you implement secure JWT authentication in a Spring Boot application?",
      quick_answer: "→ Structure: Header.Payload.Signature (Base64URL encoded, dot-separated)\n→ Payload readable by anyone — never store sensitive data in it\n→ Use RS256 (asymmetric) over HS256 — microservices verify without holding signing key\n→ Access token: 15min expiry, store in JS memory (not localStorage — XSS risk)\n→ Refresh token: httpOnly Secure SameSite=Strict cookie only\n→ Always validate: signature + exp + iss + aud",
      detailed_answer: "JWT (JSON Web Token) is a compact self-contained token for transmitting claims.\n\nStructure — three Base64URL parts separated by dots:\n1. Header: {alg: 'RS256', typ: 'JWT'}\n2. Payload: {sub: 'user123', iat: 1234567890, exp: 1234568790, roles: ['ADMIN']}\n3. Signature: RSA-Sign(Base64(header)+'.'+Base64(payload), privateKey)\n\nKey properties:\n→ Self-contained: validated without DB lookup (stateless)\n→ Tamper-evident: signature catches any modification\n→ NOT encrypted: payload is Base64 encoded — readable by anyone\n\nAlgorithm choice:\n→ HS256 (symmetric): same secret signs and verifies\n   Risk: any service that can verify can also create tokens\n→ RS256 (asymmetric): private key signs, public key verifies\n   Microservices can verify without holding signing key\n   Always use RS256 in production\n\nSecurity rules:\n→ Short expiry: 15 minutes for access tokens\n→ Refresh token rotation: new refresh token on every use\n→ Access token in memory — not localStorage (XSS risk)\n→ Refresh token in httpOnly Secure SameSite=Strict cookie\n→ Never store PII, passwords, or sensitive data in payload",
      key_points: [
        "Structure: Header.Payload.Signature — Base64URL encoded",
        "Payload NOT encrypted — never put sensitive data in it",
        "RS256 (asymmetric) preferred over HS256 for microservices",
        "Access token: 15min, JS memory only (not localStorage)",
        "Refresh token: httpOnly Secure SameSite=Strict cookie",
        "Always validate: signature + exp + iss + aud claims"
      ],
      hint: "Go to jwt.io and paste any JWT. You can read the entire payload. Base64 is encoding, not encryption. What does this mean for what you can store in a JWT?",
      common_trap: "Storing JWTs in localStorage — vulnerable to XSS attacks. Any injected script can read localStorage and exfiltrate tokens silently. Store access token in a JS variable (memory) and refresh token in an httpOnly cookie.",
      follow_up_questions: [
        {
          text: "How do you invalidate a JWT before it expires?",
          type: "linked",
          links_to: "7.2.02"
        },
        {
          text: "What is the difference between OAuth2 and OIDC?",
          type: "linked",
          links_to: "7.1.01"
        }
      ],
      related: ["7.1.01", "7.2.02", "7.3.01"],
      has_diagram: false,
      has_code: true,
      code_language: "java",
      code_snippet: `// JWT Service — Spring Boot + RS256
@Service
public class JwtService {

    // ⚠️ Load from AWS Secrets Manager
    //    in production — never hardcode
    @Value("\${jwt.private-key}")
    private RSAPrivateKey privateKey;

    @Value("\${jwt.public-key}")
    private RSAPublicKey publicKey;

    public String generateAccessToken(UserDetails user) {
        return Jwts.builder()
            .setIssuer("keystone-api")        // iss claim
            .setSubject(user.getUsername())    // sub claim
            .setIssuedAt(new Date())
            .setExpiration(in(15, MINUTES))   // ← 15min only
            .claim("roles", getRoles(user))
            .signWith(privateKey, RS256)       // ← asymmetric
            .compact();
    }

    public Claims validateToken(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(publicKey)         // ← public key
            .requireIssuer("keystone-api")    // ← validate iss
            .build()
            .parseClaimsJws(token)            // throws if invalid
            .getBody();
        // exp validated automatically
    }
}`,
      tags: ["JWT","authentication","RS256",
             "security","spring-boot","tokens"]
    },

    // ── STUB 4: Advanced, system design scenario
    {
      id: "11.1.01",
      section: 11,
      subsection: "11.1",
      level: "advanced",
      question: "Design a URL shortener like bit.ly that handles 100 million URLs and 10 billion redirects per month.",
      quick_answer: "→ Read-heavy: 250:1 read/write ratio — optimise reads entirely\n→ Write: base62 7-char ID → DynamoDB (short_code PK, TTL for expiry)\n→ Read: Redis cache check → HIT: 302 redirect → MISS: DynamoDB → cache → redirect\n→ Power law: top 10% URLs = 90% traffic — they stay hot in Redis\n→ 302 (not 301): enables analytics — 301 caches permanently in browser\n→ Analytics always async via Kafka — never on redirect critical path",
      detailed_answer: "Capacity estimation:\n→ 100M new URLs/month = ~40 writes/sec\n→ 10B redirects/month = ~4,000 reads/sec avg, ~40K peak\n→ Read:write ratio = 250:1 — strongly read-heavy\n→ URL record ~500 bytes → 50GB/year\n\nAPI Design:\n→ POST /shorten: {long_url, alias?, expiry?} → {short_url}\n→ GET /{short_code} → 301/302 redirect\n→ GET /stats/{short_code} → analytics\n\nID Generation:\n→ 7-char base62 = 62^7 = 3.5 trillion combinations\n→ Snowflake-style distributed ID → base62 encode\n→ Never sequential — enumeration attack risk\n\nStorage:\n→ DynamoDB: short_code (PK) → {long_url, expiry, user_id}\n→ TTL attribute for auto-expiry\n→ Random short codes distribute naturally (no hot partitions)\n\nCaching:\n→ Redis: short_code → long_url, TTL 24h\n→ Power law: top 10% keys get 90% traffic → stay hot\n→ Target cache hit ratio: 95%+\n\nRedirect:\n→ 302: every redirect hits server → enables analytics\n→ 301: browser caches forever → disables analytics\n→ Decision driven by analytics requirement\n\nAnalytics (async):\n→ On redirect: publish to Kafka {short_code, ts, ua, geo}\n→ Consumer aggregates click counts\n→ Never synchronous — adds latency to critical path\n\nSections covered: 1.4, 2.1, 2.4, 3.1, 3.4, 8.1",
      key_points: [
        "Read-heavy: 250:1 — every decision optimises the read path",
        "Base62 7 chars: 3.5 trillion combinations, decades of headroom",
        "Redis cache critical: 95%+ hit ratio via power law distribution",
        "302 redirect for analytics; 301 permanently cached in browser",
        "Analytics always async via Kafka — never on redirect path",
        "DynamoDB TTL handles URL expiry automatically — free feature"
      ],
      hint: "Start with capacity estimation. 10B redirects/month sounds huge but is ~4K RPS average. With 95% Redis cache hit rate, your DynamoDB sees only ~200 RPS. Is that actually a scaling problem?",
      common_trap: "Choosing 301 without realising it permanently disables click analytics. Browsers cache 301 redirects forever — subsequent visits never reach your server. Always decide 301 vs 302 based on whether analytics are required.",
      follow_up_questions: [
        {
          text: "How do you handle custom aliases and prevent conflicts?",
          type: "linked",
          links_to: "11.1.02"
        },
        {
          text: "How would you add geographic routing to serve redirects from the nearest region?",
          type: "inline",
          mini_answer: "Use a CDN (CloudFront, Cloudflare) with edge workers. Cache the short_code → long_url mapping at edge locations globally. On cache hit: redirect from the edge — sub-10ms globally. On cache miss: fetch from origin, cache at edge for next request. Hot URLs cached worldwide. Only cold URLs hit origin. No code changes needed in your app."
        }
      ],
      related: ["2.4.01", "2.1.01", "3.1.01"],
      has_diagram: true,
      diagram: `URL SHORTENER — READ PATH (critical path)

Client
  │  GET /abc1234
  ▼
CDN (edge — hot URLs served here)
  │  miss
  ▼
Load Balancer
  │
  ▼
Redirect Service
  │
  ├─── Redis check ──────────────────────┐
  │    (short_code → long_url)           │
  │                                      │
  │    HIT ──────────────────────────────┼──► 302 redirect
  │                                      │
  │    MISS                              │
  │      │                              │
  │      ▼                              │
  │    DynamoDB lookup                   │
  │      │                              │
  │      ├── populate Redis (TTL 24h)    │
  │      └──────────────────────────────┘
  │
  └─── [async] Kafka event
              │
              ▼
          Analytics Consumer

HIT RATIO TARGET: 95%+
(power law: top 10% URLs = 90% traffic)`,
      has_code: false,
      tags: ["system-design","url-shortener","redis",
             "dynamodb","CDN","scale","base62"]
    },

    // ── STUB 5: Behavioural question — no diagram/code
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
      tags: ["behavioural","conflict","stakeholder",
             "influence","STAR","leadership"]
    }

  ]
  // ← more questions will be added here
  //   section by section in future sessions

};