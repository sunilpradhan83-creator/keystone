// questions/section_4.js
// Section 4: Design Patterns
// Subsections: 4.1 Microservice Patterns
//              4.2 Resilience Patterns
//              4.3 Messaging Patterns
//              4.4 Integration Patterns
//              4.5 Data Consistency Patterns
//              4.6 Concurrency Patterns
// Target: ~48 questions
// Added: 2026-04-27

const SECTION_4_QUESTIONS = [

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
    tags: ["circuit-breaker","resilience4j","fault-tolerance","patterns","spring-boot"]
  },

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
    tags: ["retry","circuit-breaker","resilience","backoff","patterns"]
  }

];
