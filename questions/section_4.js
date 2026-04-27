// questions/section_4.js
// Section 4: Design Patterns
// Subsections:
//   4.1 Microservice Patterns (12 questions)
//   4.2 Resilience Patterns   — Batch 2
//   4.3 Messaging Patterns    — Batch 3
//   4.4 Integration Patterns  — Batch 4
//   4.5 Data Consistency      — Batch 5
//   4.6 Concurrency Patterns  — Batch 5
// Target: ~48 questions total
// Last updated: 2026-04-27

const SECTION_4_QUESTIONS = [

  // ══════════════════════════════════════════
  // SUBSECTION 4.1 — MICROSERVICE PATTERNS
  // ══════════════════════════════════════════

  {
    id: "4.1.01",
    section: 4,
    subsection: "4.1",
    level: "intermediate",
    question: "What is the Saga pattern? What are the two types and when do you use each?",
    quick_answer: "→ Saga manages distributed transactions where ACID is impossible across services\n→ Each step = local transaction; failure triggers compensating transactions in reverse\n→ Choreography: services react to events, no controller — loose coupling, simple linear flows\n→ Orchestration: central orchestrator directs each step — complex flows, easier to debug\n→ Compensating transactions must be explicitly designed AND idempotent\n→ Rule: choreography for 2-3 services, orchestration for complex multi-step flows",
    detailed_answer: "In a distributed system each microservice owns its own database, making traditional ACID transactions impossible across service boundaries.\n\nThe Saga pattern breaks a distributed transaction into a sequence of local transactions. Each step publishes an event or message. If any step fails, compensating transactions execute in reverse to undo previous steps.\n\nCritical insight: compensating transactions are NOT automatic rollbacks. They are explicit business operations — 'refund payment' is the compensating transaction for 'charge payment'. They must be designed and must be idempotent.\n\nChoreography:\n→ Each service listens for events and knows what to do next\n→ No central controller\n→ Pros: loose coupling, simple for linear flows\n→ Cons: flow logic distributed, hard to visualise, circular event chain risk\n→ Best for: 2-3 service linear flows\n\nOrchestration:\n→ Central Saga Orchestrator commands each participant explicitly\n→ Handles failures centrally\n→ Pros: flow visible in one place, easy to monitor, handles complex branching\n→ Cons: orchestrator can be bottleneck, coupling to orchestrator\n→ Best for: complex multi-step business processes\n→ Tools: Temporal, AWS Step Functions, Camunda",
    key_points: [
      "Saga = local transactions + compensating transactions for rollback",
      "Compensating transactions explicitly designed — not automatic rollbacks",
      "Choreography: event-driven, no controller, loose coupling",
      "Orchestration: central controller, explicit flow, easier to debug",
      "All compensating transactions must be idempotent — retries happen",
      "Temporal or AWS Step Functions for production orchestration"
    ],
    hint: "Think about an e-commerce order: Reserve inventory → Charge payment → Ship. What happens if Charge payment fails? What needs to be undone and how?",
    common_trap: "Assuming compensating transactions are like database rollbacks. They are not — they are new forward-moving business operations (refund, cancel, release) with their own failure modes. Design them explicitly.",
    follow_up_questions: [
      {
        text: "What happens when a compensating transaction also fails?",
        type: "linked",
        links_to: "4.1.02"
      },
      {
        text: "How do you test Saga flows in a microservices environment?",
        type: "inline",
        mini_answer: "Use contract testing (Pact) for service interactions. Test each local transaction independently with unit tests. Integration test the full saga flow against testcontainer services. Inject failures at each step to verify compensating transactions execute correctly. Use Temporal's test framework for orchestrated sagas — it supports time-skipping and fault injection natively."
      }
    ],
    related: ["4.1.02", "4.1.03", "1.3.01"],
    has_diagram: true,
    diagram: `SAGA ORCHESTRATION — Order Flow

       ┌──────────────────────┐
       │   Saga Orchestrator  │
       └──┬───────────┬───────┘
          │           │
   ┌──────▼─────┐ ┌───▼──────────┐
   │ 1. Reserve │ │ 2. Charge    │
   │ Inventory  │ │    Payment   │
   └──────┬─────┘ └───┬──────────┘
          │           │
        ✅ OK       ✅ OK
          │           │
       ┌──▼───────────▼──┐
       │  3. Confirm     │
       │     Order       │
       └─────────────────┘
               ✅

── FAILURE SCENARIO ──────────────────

       ┌──────────────────────┐
       │   Saga Orchestrator  │
       └──┬───────────┬───────┘
          │           │
   ┌──────▼─────┐ ┌───▼──────────┐
   │ 1. Reserve │ │ 2. Charge    │
   │ Inventory  │ │    Payment   │
   └──────┬─────┘ └──────────────┘
          │             ❌ FAILED
        ✅ OK
          │
   ┌──────▼───────────────────┐
   │ COMPENSATE:              │
   │ Release Inventory        │ ← must be idempotent
   └──────────────────────────┘`,
    has_code: true,
    code_language: "java",
    code_snippet: `// Saga Orchestrator — simplified
@Service
public class OrderSagaOrchestrator {

    public SagaResult execute(CreateOrderCmd cmd) {
        SagaLog log = new SagaLog(cmd.getOrderId());
        try {
            // Step 1
            inventoryService.reserve(cmd.getItems());
            log.completed("INVENTORY_RESERVED");

            // Step 2
            paymentService.charge(cmd.getPayment());
            log.completed("PAYMENT_CHARGED");

            // Step 3
            orderService.confirm(cmd.getOrderId());
            return SagaResult.success();

        } catch (Exception e) {
            compensate(log);
            return SagaResult.failed(e.getMessage());
        }
    }

    private void compensate(SagaLog log) {
        // Compensate in REVERSE order
        // ⚠️ Each must be idempotent
        if (log.isCompleted("INVENTORY_RESERVED")) {
            inventoryService.release(
                log.getOrderId());
        }
    }
}`,
    tags: ["saga", "distributed-transactions",
           "orchestration", "choreography", "microservices"]
  },

  {
    id: "4.1.02",
    section: 4,
    subsection: "4.1",
    level: "advanced",
    question: "What happens when a compensating transaction in a Saga also fails? How do you handle it?",
    quick_answer: "→ This is the hardest Saga failure — inconsistent state with no automatic fix\n→ First: make every compensating tx idempotent — retry with exponential backoff\n→ Dead Letter Queue after max retries — with full saga context for investigation\n→ Persist full saga state — never lose track of what completed\n→ Pivot transaction: define irreversible steps upfront (items shipped, emails sent)\n→ Never silently swallow — always alert, DLQ, or human workflow",
    detailed_answer: "A failed compensating transaction is a critical failure — you have inconsistent state and no automatic fix.\n\nStrategy 1 — Retry with backoff (first step always):\nMake every compensating transaction idempotent first. Then retry with exponential backoff. Most transient failures resolve on retry. This handles 90% of cases.\n\nStrategy 2 — Dead Letter Queue:\nIf compensation fails after max retries, push to DLQ with full context: saga_id, step, payload, error, attempt count. Separate worker or human review handles DLQ items.\n\nStrategy 3 — Persistent Saga State:\nStore full saga state in DB: saga_id, current_step, completed_steps, status. If compensation fails, saga stays in COMPENSATING_FAILED state. Ops team triggers manual retry or marks resolved.\n\nStrategy 4 — Pivot Transaction:\nDesign your Saga with a clear point of no return. Steps before pivot are reversible. Steps after pivot are irreversible (item shipped, email sent). Design so compensation only applies to reversible steps.\n\nStrategy 5 — Human Workflow:\nFor rare critical failures (charge succeeded, inventory release permanently failing), trigger a human review ticket. Some financial inconsistencies are too risky to auto-resolve.\n\nKey principle: Never silently swallow a compensation failure. Always emit alert, create ticket, or push to DLQ.",
    key_points: [
      "Failed compensation = inconsistent state — never swallow silently",
      "First: make compensating tx idempotent — retry is then safe",
      "DLQ after max retries with full saga context for investigation",
      "Persist saga state — never lose track of completed steps",
      "Pivot transaction: define reversible vs irreversible steps upfront",
      "Human workflow for financially critical unrecoverable failures"
    ],
    hint: "Imagine: you charged the card successfully, but inventory release is permanently down. You cannot refund because payment service is also degraded. What is your fallback? Think in layers.",
    common_trap: "Assuming compensating transactions always succeed because they are simpler than forward operations. A refund API can be just as unavailable as a charge API. Always plan for failed compensations from day one.",
    follow_up_questions: [
      {
        text: "What is a Dead Letter Queue and how do you operationalise it?",
        type: "linked",
        links_to: "4.3.02"
      },
      {
        text: "How do you design an idempotent compensating transaction?",
        type: "inline",
        mini_answer: "Include an idempotency key (saga_id + step_name) in every compensation call. Before executing: check if already compensated via DB lookup. If yes: return success without re-executing. If no: execute and record. Use database upsert or conditional updates. This ensures calling the compensation 10 times has the same result as calling it once."
      }
    ],
    related: ["4.1.01", "4.3.02", "3.3.01"],
    has_diagram: false,
    has_code: false,
    tags: ["saga", "compensation", "distributed-transactions",
           "failure-handling", "DLQ", "idempotency"]
  },

  {
    id: "4.1.03",
    section: 4,
    subsection: "4.1",
    level: "advanced",
    question: "What is the Outbox Pattern? How does it guarantee reliable event publishing?",
    quick_answer: "→ Solves dual-write: writing to DB and publishing event must be atomic\n→ Write domain data + outbox row in ONE DB transaction — either both or neither\n→ Relay process reads outbox table, publishes to Kafka, marks sent\n→ CDC with Debezium: reads DB transaction log — no polling, near-real-time\n→ Guarantees: no lost events (committed = will publish), no phantom events (rollback = no row)\n→ Delivery: at-least-once — consumers must be idempotent",
    detailed_answer: "The dual-write problem: you want to update the DB AND publish an event. If you do them sequentially, one can fail after the other:\n→ DB write succeeds, event publish fails → event lost, system inconsistent\n→ Event published, DB write fails → phantom event for something that never happened\n\nThe Outbox Pattern solves this with atomicity:\n\n1. In a SINGLE DB transaction:\n   → Write to your domain table (e.g. orders)\n   → Write to outbox table: {event_type, payload, created_at, sent: false}\n   → Transaction commits atomically — either both write or neither\n\n2. Relay Process (separate concern):\n   → Polls outbox table for unsent events (or uses CDC)\n   → Publishes each event to Kafka\n   → Marks event as sent\n   → If relay crashes: unsent events retried on restart\n\nTwo relay approaches:\n→ Polling relay: simple loop querying outbox. Easy but adds DB load.\n→ CDC with Debezium: reads DB transaction log (WAL for Postgres), no polling, millisecond latency, zero DB overhead.\n\nGuarantees:\n→ No lost events: committed DB write = outbox row exists = relay will publish\n→ No phantom events: rolled back transaction = no outbox row = nothing published\n→ Delivery: at-least-once — consumers must handle duplicates idempotently",
    key_points: [
      "Outbox solves dual-write: atomic DB write + reliable event publishing",
      "Domain data + outbox row in ONE transaction — atomicity guaranteed",
      "Relay reads outbox and publishes to broker asynchronously",
      "CDC (Debezium): reads WAL directly — no polling, zero overhead",
      "No lost events + no phantom events — strongest delivery guarantee",
      "At-least-once delivery — design consumers to be idempotent"
    ],
    hint: "The key insight: both the domain data and the outbox row are in the SAME database. You can write both atomically with a regular DB transaction. No distributed transaction needed.",
    common_trap: "Using CDC/Debezium without planning for consumer idempotency. CDC guarantees at-least-once delivery — on relay restart, events may be republished. Consumers that are not idempotent will process duplicates silently.",
    follow_up_questions: [
      {
        text: "How does Debezium CDC work technically?",
        type: "inline",
        mini_answer: "Debezium acts as a Postgres/MySQL replica. Reads the DB transaction log (WAL for Postgres, binlog for MySQL) using replication protocol. Every INSERT/UPDATE/DELETE appears as a change event published to Kafka. Zero impact on DB write performance. Near-real-time — millisecond lag. Requires DB replication slot (Postgres) or binlog enabled (MySQL)."
      },
      {
        text: "How do you handle Outbox table growth over time?",
        type: "inline",
        mini_answer: "Run a cleanup job to delete sent outbox events older than 7 days. With CDC/Debezium, events are captured from WAL so you can truncate aggressively. Index on (sent, created_at) for efficient polling queries. Partition the outbox table by date for fast range deletes. Monitor table size — alert at 100K unsent rows."
      }
    ],
    related: ["4.1.01", "4.3.01", "1.3.02"],
    has_diagram: true,
    diagram: `OUTBOX PATTERN

Application Write (single transaction):
┌────────────────────────────────────────────┐
│  BEGIN TRANSACTION                          │
│  ┌──────────────┐   ┌────────────────────┐ │
│  │ orders table │   │   outbox table     │ │
│  │ INSERT order │   │  INSERT event      │ │
│  │ id=123       │   │  event_id=abc      │ │
│  │ status=NEW   │   │  type=ORDER_CRTD   │ │
│  └──────────────┘   │  payload={...}    │ │
│                     │  sent=false        │ │
│                     └────────────────────┘ │
│  COMMIT ← atomic: both or neither          │
└────────────────────────────────────────────┘

Relay Process:
┌──────────────┐  polls/CDC  ┌──────────┐
│ Outbox Relay │────────────►│  Kafka   │
│ (Debezium)   │◄─ mark sent─│          │
└──────────────┘             └────┬─────┘
                                  │
                      ┌───────────▼──────────┐
                      │  Consumer Service    │
                      │  (idempotent ✅)     │
                      └──────────────────────┘`,
    has_code: false,
    tags: ["outbox", "dual-write", "CDC", "debezium",
           "kafka", "reliability", "at-least-once"]
  },

  {
    id: "4.1.04",
    section: 4,
    subsection: "4.1",
    level: "intermediate",
    question: "What is the Strangler Fig pattern? How do you use it to migrate a monolith to microservices?",
    quick_answer: "→ Incrementally carve out services while monolith stays live — no big-bang rewrite\n→ Start with least-coupled domain: Notifications or Reporting (fewest inbound dependencies)\n→ Extract service logic first, keep DB shared initially\n→ Anti-Corruption Layer prevents old model polluting new domain\n→ Route traffic gradually: 1% → 10% → 100% via API Gateway or feature flags\n→ Golden rule: split the database LAST — always after service is stable at 100%",
    detailed_answer: "Named after the fig tree that grows around a host tree and eventually replaces it. The monolith stays live throughout — no downtime, no big-bang rewrite.\n\nStep 1 — Domain Mapping:\nRun Event Storming workshops. Identify bounded contexts. Each bounded context = candidate microservice (Orders, Users, Payments, Notifications).\n\nStep 2 — Identify seams:\nFind natural break points where coupling is lowest. Start with the most independent domain — usually Notifications or Reporting (few inbound dependencies, easy to extract).\n\nStep 3 — Extract logic, keep DB shared initially:\nBuild the new service but let it talk to the monolith's DB temporarily. Avoids data migration complexity on day one.\n\nStep 4 — Anti-Corruption Layer (ACL):\nBuild a translation layer between new service and monolith. Prevents the monolith's data model and terminology from bleeding into your clean new domain model.\n\nStep 5 — Route traffic gradually:\nAPI Gateway or feature flag shifts traffic 1% → 10% → 50% → 100%. Validate at each step. Rollback is just a config change.\n\nStep 6 — Split the database:\nOnce the service boundary is stable and fully handling traffic, extract its data into its own database. Hardest step — do it last.\n\nStep 7 — Decommission:\nRemove the corresponding code from the monolith.",
    key_points: [
      "Incremental carve-out — monolith stays live throughout entire migration",
      "Start with least-coupled domain to minimise risk",
      "Extract service logic before splitting the database",
      "Anti-Corruption Layer prevents old model polluting new domain",
      "Route traffic gradually — 1% → 10% → 100% via API Gateway",
      "Database split is hardest and always last"
    ],
    hint: "Think about what happens to transactions that span both the monolith and the new service during migration. How do you handle data consistency while the DB is still shared?",
    common_trap: "Splitting the database before service boundaries are stable. This causes data consistency nightmares that are very hard to reverse. Always validate the service handles 100% of traffic correctly before splitting the DB.",
    follow_up_questions: [
      {
        text: "How do you handle transactions spanning the monolith and new service?",
        type: "linked",
        links_to: "4.1.05"
      },
      {
        text: "What is an Anti-Corruption Layer and why is it important?",
        type: "inline",
        mini_answer: "ACL is a translation layer between two bounded contexts with different domain models. It translates the monolith's language and data structures into the new service's clean domain model. Without it, the monolith's legacy concepts (naming, data structures, business rules) leak into the new service, corrupting its design. The ACL is temporary — removed after the monolith slice is decommissioned."
      }
    ],
    related: ["4.1.05", "1.2.01", "4.1.07"],
    has_diagram: true,
    diagram: `STRANGLER FIG — Phase by Phase

Phase 1: Extract service, DB still shared
┌──────────────────┐   ┌──────────────────┐
│    MONOLITH      │   │  New Service     │
│  (Orders still   │   │  (Notifications) │
│   in monolith)   │   │                  │
└────────┬─────────┘   └────────┬─────────┘
         │    API Gateway routes │
         └──────────┬────────────┘
                    │
               ┌────▼────┐
               │ SHARED  │ ← temporary
               │   DB    │
               └─────────┘

Phase 2: Traffic shifted 100%, DB split
┌──────────────────┐   ┌──────────────────┐
│    MONOLITH      │   │  New Service ✅  │
│  (Notifs code    │   │  100% traffic    │
│   deprecated)    │   │                  │
└──────────────────┘   └────────┬─────────┘
                                │
                       ┌────────▼─────────┐
                       │   Own DB         │
                       └──────────────────┘

Phase 3: Monolith slice removed
         ACL removed
         Migration complete for this domain`,
    has_code: false,
    tags: ["strangler-fig", "migration", "microservices",
           "ACL", "bounded-context", "monolith"]
  },

  {
    id: "4.1.05",
    section: 4,
    subsection: "4.1",
    level: "advanced",
    question: "How do you handle transactions spanning the monolith and a new microservice during migration?",
    quick_answer: "→ Cannot use distributed ACID transactions across service boundaries\n→ Outbox Pattern: write domain data + outbox row atomically → relay to new service (best choice)\n→ Dual write: write to both simultaneously — simpler but risks inconsistency window on failure\n→ Accept eventual consistency for non-critical operations\n→ Design migration phases to minimise cross-boundary transactions\n→ Plan to eliminate cross-boundary transactions — they should be temporary",
    detailed_answer: "This is the hardest problem in monolith-to-microservice migration. You cannot use two-phase commit across service boundaries reliably.\n\nOption 1 — Outbox Pattern (recommended):\nWhen the monolith writes its data, it also writes an event to an outbox table in the same local transaction. A relay process reads the outbox and publishes to the new service. The new service processes idempotently.\n→ Pros: atomic, no distributed lock, no data loss\n→ Cons: eventual consistency — new service processes slightly behind monolith\n\nOption 2 — Dual Write with Reconciliation:\nMonolith writes to both old DB and new service. If new service write fails, a reconciliation job detects and fixes drift.\n→ Pros: simpler to implement initially\n→ Cons: inconsistency window, reconciliation is tricky to get right\n\nOption 3 — Accept Eventual Consistency:\nFor operations where brief inconsistency is acceptable, just accept it and design UI/UX to handle it gracefully.\n\nKey insight: Design your migration phases so cross-boundary transactions are minimised. If Order creation must trigger Notification, make Notification eventually consistent — it does not need to be in the same transaction.",
    key_points: [
      "Cannot use distributed ACID across service boundaries",
      "Outbox Pattern: atomic local write + reliable async delivery to new service",
      "Dual write: simpler but risks inconsistency window on failure",
      "Design migration phases to minimise cross-boundary transactions",
      "Eventual consistency acceptable for most non-financial operations",
      "Reconciliation job detects and fixes drift as safety net"
    ],
    hint: "The trick is keeping the cross-boundary operation within a single database transaction using the outbox table. The outbox row is in the SAME database as the monolith data — atomicity is free.",
    common_trap: "Using dual write without a robust reconciliation strategy. When the second write fails silently, you have inconsistent data that nobody notices until a production incident reveals the drift.",
    follow_up_questions: [
      {
        text: "What is the Outbox Pattern?",
        type: "linked",
        links_to: "4.1.03"
      }
    ],
    related: ["4.1.03", "4.1.04", "2.6.01"],
    has_diagram: false,
    has_code: false,
    tags: ["migration", "transactions", "outbox",
           "eventual-consistency", "distributed-systems"]
  },

  {
    id: "4.1.06",
    section: 4,
    subsection: "4.1",
    level: "intermediate",
    question: "What is the Sidecar pattern? What problems does it solve in microservices?",
    quick_answer: "→ Sidecar: deploy a helper container alongside every service container in the same pod\n→ Handles cross-cutting concerns: logging, metrics, tracing, mTLS, retries, auth\n→ Service code stays clean — zero infrastructure SDK imports\n→ Language-agnostic: Python and Java services get identical capabilities\n→ Service Mesh (Istio, Linkerd) = infrastructure layer built entirely on sidecar pattern\n→ Trade-off: latency per request (extra hop) + resource overhead per pod",
    detailed_answer: "The Sidecar pattern attaches a helper process to every service instance in its own container within the same pod (Kubernetes) or host. The sidecar shares the same network namespace and lifecycle as the main service.\n\nWhat the sidecar handles (so the service does not have to):\n→ Observability: log collection, metrics scraping, distributed tracing\n→ Security: mTLS certificate management, secret injection\n→ Traffic: load balancing, retries, circuit breaking, rate limiting\n→ Discovery: service registration, health checking\n\nWhy this is powerful:\n→ Every service automatically gets these capabilities\n→ Service code has zero infrastructure SDK imports\n→ Language-agnostic: Python service gets same capabilities as Java service\n→ Upgrade infrastructure without redeploying services\n→ Consistent behaviour across heterogeneous services\n\nService Mesh (Istio, Linkerd):\nInjects Envoy proxy as sidecar automatically. All service-to-service traffic flows through sidecars. Gives you: mTLS everywhere, traffic policies, observability — without any code changes.\n\nTrade-offs:\n→ Latency: every request makes an extra hop through the sidecar proxy\n→ Resource: each sidecar consumes CPU and memory\n→ Complexity: debugging network issues harder with proxy in the middle\n→ Cold start: sidecar must be ready before service receives traffic",
    key_points: [
      "Sidecar: helper container in same pod, handles cross-cutting concerns",
      "Service code stays clean — zero infrastructure SDK imports",
      "Language-agnostic — Python and Java get identical capabilities",
      "Service Mesh = infrastructure layer built on sidecar pattern",
      "Upgrade infrastructure behaviour without redeploying service code",
      "Trade-off: latency per request + resource overhead per pod"
    ],
    hint: "Think about logging across 200 services. Without sidecar: every service imports a logging SDK, configures it, maintains it. With sidecar: every service writes to stdout, sidecar ships logs automatically. Which scales better?",
    common_trap: "Adopting a Service Mesh (Istio) prematurely. Istio is powerful but operationally complex. A team with 5 microservices does not need a service mesh. Add it when you have 20+ services and cross-cutting concern overhead is genuinely painful.",
    follow_up_questions: [
      {
        text: "What is a Service Mesh and when should you adopt one?",
        type: "inline",
        mini_answer: "Service Mesh (Istio, Linkerd) automatically injects Envoy sidecar into every pod. Provides: mTLS between all services, traffic management (canary, A/B), circuit breaking, observability — all without code changes. Adopt when: 20+ microservices, security requires mTLS everywhere, fine-grained traffic control needed. Do NOT adopt for: fewer than 10 services, small team, early stage. Operational complexity is significant."
      }
    ],
    related: ["4.4.01", "6.3.01", "7.4.01"],
    has_diagram: false,
    has_code: false,
    tags: ["sidecar", "service-mesh", "istio", "envoy",
           "cross-cutting", "microservices", "kubernetes"]
  },

  {
    id: "4.1.07",
    section: 4,
    subsection: "4.1",
    level: "intermediate",
    question: "What is the Database per Service pattern? Why is it fundamental to microservices?",
    quick_answer: "→ Each microservice owns its own database — no sharing with other services\n→ Enables: independent deployability, polyglot persistence, no schema coupling\n→ Share data via APIs or events — never via direct DB access or shared tables\n→ Worst anti-pattern: microservices code + shared database = distributed monolith\n→ Cross-service queries: API composition, CQRS read model, or event-driven replication\n→ Trade-off: no cross-service joins, data duplication, eventual consistency",
    detailed_answer: "Database per service is the foundational data pattern of microservices. Without it, you have microservice boundaries in code but monolith coupling in data.\n\nWhy it is fundamental:\n→ Independent deployability: Team A changes Orders schema without coordinating with Team B\n→ Polyglot persistence: Orders uses PostgreSQL, Inventory uses DynamoDB, Search uses Elasticsearch\n→ Failure isolation: Inventory DB failure does not affect Orders DB\n→ Independent scaling: scale your DB independently based on service load\n\nThe shared database anti-pattern:\nMultiple services reading and writing the same DB creates the worst of both worlds — the deployment independence of microservices with the data coupling of a monolith. Schema changes require cross-team coordination. One team's bad query affects everyone.\n\nHow to share data without sharing a database:\n→ API calls: Service A calls Service B's API to get needed data\n→ Event-driven replication: Service A publishes events, Service B maintains its own read-optimised copy\n→ CQRS read model: dedicated query service that aggregates data from multiple services\n\nAcceptable exceptions:\n→ Modular monolith: shared DB is intentional and correct\n→ During Strangler Fig migration: temporary shared DB with explicit plan\n→ Reporting DB: read-only aggregated view is acceptable",
    key_points: [
      "Each service owns its DB completely — no sharing, no cross-service joins",
      "Enables polyglot persistence: right DB for each service's access pattern",
      "Share data via APIs or events — never direct DB access",
      "Shared DB anti-pattern: microservice code + monolith data coupling",
      "Cross-service data: API composition, CQRS read model, event replication",
      "Tradeoff: data duplication and eventual consistency are acceptable costs"
    ],
    hint: "If Team A needs to change the orders table schema, who else do they notify? With DB per service: nobody. With shared DB: every team that reads that table. Which scales better across 50 teams?",
    common_trap: "Calling an architecture 'microservices' while all services share one database. This is a distributed monolith — you get the complexity of microservices with the coupling of a monolith. The worst possible outcome.",
    follow_up_questions: [
      {
        text: "How do you handle cross-service queries without cross-DB joins?",
        type: "inline",
        mini_answer: "Three patterns: 1) API Composition — orchestrator calls multiple service APIs, joins in memory. Simple but adds latency. 2) CQRS Read Model — dedicated service subscribes to events from multiple services, maintains denormalised query-optimised view. Best for complex queries. 3) Event-driven replication — services publish events, consumers maintain local copy. Best for performance. Choose based on query complexity and consistency requirements."
      },
      {
        text: "When is a shared database acceptable in microservices?",
        type: "inline",
        mini_answer: "Three acceptable cases: 1) Modular monolith — deliberate architecture choice, not microservices. 2) Migration phase — temporary shared DB during Strangler Fig with explicit plan and timeline to split. 3) Read-only reporting DB — aggregated view for analytics that no service writes to. Never acceptable: two services writing to the same tables in production microservices."
      }
    ],
    related: ["4.1.04", "2.1.01", "1.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["database-per-service", "microservices",
           "polyglot-persistence", "shared-db", "anti-pattern"]
  },

  {
    id: "4.1.08",
    section: 4,
    subsection: "4.1",
    level: "advanced",
    question: "What is the CQRS pattern? When should you use it and what are the trade-offs?",
    quick_answer: "→ CQRS: separate the Write Model (commands) from the Read Model (queries)\n→ Write side: optimised for consistency and business rules — normalised DB\n→ Read side: optimised for query performance — denormalised, pre-aggregated views\n→ Events from write side update read models asynchronously\n→ Use when: read/write patterns differ significantly, complex queries hurt write performance\n→ Trade-off: eventual consistency on read side, added complexity, data duplication",
    detailed_answer: "CQRS (Command Query Responsibility Segregation) separates how you write data from how you read it.\n\nWrite Model (Command side):\n→ Handles: CreateOrder, UpdateInventory, ProcessPayment commands\n→ Optimised for: consistency, business rule enforcement, audit trail\n→ DB: normalised, transactional (PostgreSQL)\n→ Returns: success/failure, not data\n\nRead Model (Query side):\n→ Handles: GetOrderSummary, GetDashboard, SearchProducts queries\n→ Optimised for: query performance, specific UI needs\n→ DB: denormalised, pre-aggregated (read replicas, Elasticsearch, Redis)\n→ Returns: exactly what the UI needs\n→ Updated by: events from write side\n\nWhen to use CQRS:\n→ Read and write patterns differ significantly (100:1 read/write ratio)\n→ Complex queries are hurting write performance\n→ Different scaling requirements for reads vs writes\n→ Multiple different read representations needed from same data\n→ Often paired with Event Sourcing\n\nWhen NOT to use:\n→ Simple CRUD applications\n→ Small teams — operational overhead is high\n→ When eventual consistency on reads is unacceptable\n\nTrade-offs:\n→ Eventual consistency: read model slightly behind write model\n→ Complexity: two separate data models to maintain\n→ Data duplication: same data in multiple read stores\n→ Debugging: harder to trace data flow across models",
    key_points: [
      "CQRS: separate Write Model (commands) from Read Model (queries)",
      "Write side: consistency + business rules, normalised DB",
      "Read side: performance + UI needs, denormalised pre-aggregated",
      "Read models updated asynchronously via events from write side",
      "Use when read/write patterns differ significantly",
      "Trade-off: eventual consistency on reads + added complexity"
    ],
    hint: "Think about a dashboard aggregating data from 5 tables with complex joins. Running this on your transactional DB on every page load hurts write performance. CQRS lets you pre-compute and cache this view.",
    common_trap: "Applying CQRS to every microservice by default. CQRS adds significant complexity — two data models, event propagation, eventual consistency. Only justified when the read/write separation genuinely solves a performance or complexity problem you actually have.",
    follow_up_questions: [
      {
        text: "What is Event Sourcing and how does it relate to CQRS?",
        type: "linked",
        links_to: "4.1.09"
      },
      {
        text: "How do you handle read-after-write consistency in CQRS?",
        type: "inline",
        mini_answer: "Problem: user creates an order, immediately queries — read model has not updated yet. Solutions: 1) Return write result directly in command response — bypass read model for immediate feedback. 2) Version-based polling: client polls until read model version matches write version. 3) Optimistic UI: update UI immediately, reconcile when read model catches up. 4) Synchronous projection for critical reads: update read model in same transaction."
      }
    ],
    related: ["4.1.09", "4.5.01", "2.7.01"],
    has_diagram: true,
    diagram: `CQRS PATTERN

WRITE SIDE (Commands):         READ SIDE (Queries):
──────────────────────         ────────────────────
User Action                    Dashboard / UI
    │                                  ▲
    ▼                                  │
Command Handler               Query Handler
    │                                  │
    ▼                         ┌────────┘
Write Model                   │  Read Model
(normalised)     Events ──────┤  (denormalised,
    │            (async)      │   pre-aggregated)
    ▼                         │
Write DB                 Read DB
(PostgreSQL)            (Redis, Elasticsearch,
                         Read Replica)

→ Commands return success/failure only
→ Queries return exactly what UI needs
→ Read model eventually consistent
→ Scale read and write sides independently`,
    has_code: false,
    tags: ["CQRS", "command", "query", "read-model",
           "write-model", "event-sourcing", "patterns"]
  },

  {
    id: "4.1.09",
    section: 4,
    subsection: "4.1",
    level: "advanced",
    question: "What is Event Sourcing? How does it differ from traditional state storage?",
    quick_answer: "→ Event Sourcing: store every state change as an immutable event — never update in place\n→ Current state = replay of all events from the beginning\n→ Traditional DB: stores current state only — history lost on every update\n→ Benefits: full audit trail, time travel to any point, event replay for new projections\n→ Snapshot: periodic state capture to avoid replaying all events on every read\n→ Trade-off: complex querying, storage grows forever, steep learning curve",
    detailed_answer: "Traditional state storage: each UPDATE overwrites the previous value. The history of how you got to the current state is lost.\n\nEvent Sourcing: instead of storing current state, store every event that changed the state. Current state is derived by replaying all events.\n\nExample — Order lifecycle:\nTraditional DB:\n  orders table: {id:1, status:'SHIPPED', amount:99}\n  History of status changes: GONE\n\nEvent Sourced:\n  events table:\n  {OrderCreated, amount:99, ts:T1}\n  {PaymentProcessed, ts:T2}\n  {OrderShipped, ts:T3}\n  Current state = replay these 3 events\n\nBenefits:\n→ Complete audit trail: every change recorded with who and when\n→ Time travel: replay events to see state at any point in time\n→ Event replay: rebuild projections/read models by replaying event stream\n→ Debugging: exactly what happened and in what order\n→ Natural fit with CQRS: events update read models\n\nSnapshotting:\nReplaying 10,000 events for every read is too slow. Periodically snapshot current state. On read: load nearest snapshot + replay only events after it.\n\nTrade-offs:\n→ Querying: cannot simply SELECT * WHERE — must rebuild state\n→ Storage: events never deleted — storage grows forever\n→ Schema evolution: changing event structure is hard\n→ Learning curve: fundamentally different mental model\n→ Eventual consistency: projections slightly behind event stream",
    key_points: [
      "Store events not state — current state derived by replaying events",
      "Full audit trail: every change permanently recorded",
      "Time travel: replay to any point in time",
      "Snapshot: periodic state capture to avoid full replay on every read",
      "Natural fit with CQRS: events drive read model updates",
      "Trade-off: complex queries, growing storage, hard schema evolution"
    ],
    hint: "Think about a bank account. Traditional DB stores balance: 500. Event Sourcing stores: Deposit 1000, Withdraw 200, Withdraw 300. Balance = replay. Which gives you a complete financial audit trail?",
    common_trap: "Using Event Sourcing for every service by default. Justified for: financial systems requiring audit trails, collaborative editing, systems needing time travel. Overkill for: user profiles, product catalogs, most CRUD services.",
    follow_up_questions: [
      {
        text: "How do you handle event schema evolution in Event Sourcing?",
        type: "inline",
        mini_answer: "Events are immutable — you cannot change past events. Strategies: 1) Upcasting: transform old event format to new format at read time. 2) Versioned events: OrderCreatedV1, OrderCreatedV2 — handlers registered per version. 3) Weak schema: flexible serialisation (JSON) with additive-only changes. Never delete old event types — old events still exist in the store."
      }
    ],
    related: ["4.1.08", "4.5.01", "2.7.01"],
    has_diagram: false,
    has_code: false,
    tags: ["event-sourcing", "CQRS", "audit-trail",
           "immutable-events", "time-travel", "patterns"]
  },

  {
    id: "4.1.10",
    section: 4,
    subsection: "4.1",
    level: "intermediate",
    question: "What is the API Gateway pattern? What does it do and why is it needed?",
    quick_answer: "→ API Gateway: single entry point for all client requests to microservices\n→ Handles: routing, authentication, rate limiting, SSL termination, request transformation\n→ Clients talk to one URL — gateway routes to correct downstream service\n→ Centralises: auth validation, logging, metrics — no duplication across services\n→ Types: simple (Nginx, ALB), full-featured (Kong, AWS API Gateway, Apigee)\n→ Trade-off: single point of failure if not HA, can become a bottleneck",
    detailed_answer: "Without an API Gateway, clients need to know the address of every microservice. Adding a new service or changing a URL requires updating all clients.\n\nAPI Gateway responsibilities:\n\n1. Routing:\n   /api/orders/* → Order Service\n   /api/users/* → User Service\n   /api/products/* → Product Service\n\n2. Authentication and Authorisation:\n   Validate JWT/OAuth token at the gateway.\n   Services trust the gateway — no auth logic in each service.\n   Pass user identity downstream as a header.\n\n3. Rate Limiting:\n   Protect backend services from traffic spikes.\n   Per user, per IP, per API key limits.\n\n4. SSL Termination:\n   HTTPS at the gateway, HTTP internally.\n   Simplifies internal service configuration.\n\n5. Request/Response Transformation:\n   Aggregate responses from multiple services.\n   Handle versioning. Transform legacy response formats.\n\n6. Observability:\n   Centralised logging of all requests.\n   Metrics: latency, error rates, throughput.\n\nTypes:\n→ Simple reverse proxy (Nginx, ALB): routing only\n→ Full API Gateway (Kong, AWS API Gateway): all features above\n→ Service Mesh Ingress (Istio Gateway): for Kubernetes\n\nTrade-offs:\n→ Single point of failure: must be highly available\n→ Bottleneck risk: all traffic flows through it\n→ Operational overhead: another system to maintain",
    key_points: [
      "Single entry point: clients talk to one URL, gateway routes to services",
      "Centralises: auth, rate limiting, SSL termination, logging",
      "Services trust the gateway — no auth duplication in each service",
      "Eliminates N×M coupling between clients and services",
      "Must be highly available — it is a single point of failure by design",
      "Trade-off: potential bottleneck, operational overhead"
    ],
    hint: "Without an API Gateway, a mobile app calling 5 microservices needs 5 addresses, 5 auth checks, and updates when any URL changes. What does this look like at 50 microservices?",
    common_trap: "Putting business logic in the API Gateway. The gateway handles infrastructure concerns only — routing, auth, rate limiting. Business logic belongs in services. A gateway with business logic becomes a distributed monolith bottleneck.",
    follow_up_questions: [
      {
        text: "What is the Backend for Frontend (BFF) pattern?",
        type: "linked",
        links_to: "4.4.01"
      },
      {
        text: "How do you handle API Gateway as a single point of failure?",
        type: "inline",
        mini_answer: "Deploy multiple gateway instances behind a load balancer in active-active configuration. Health checks remove failed instances automatically. Keep the gateway stateless — auth state in JWT, not gateway memory. Circuit breakers in gateway protect downstream services. Multi-AZ deployment on AWS. Target: 99.99% availability for the gateway itself."
      }
    ],
    related: ["4.4.01", "7.3.01", "5.3.01"],
    has_diagram: false,
    has_code: false,
    tags: ["api-gateway", "routing", "authentication",
           "rate-limiting", "microservices", "single-entry-point"]
  },

  {
    id: "4.1.11",
    section: 4,
    subsection: "4.1",
    level: "intermediate",
    question: "What is the Service Discovery pattern? What are client-side vs server-side discovery?",
    quick_answer: "→ Service Discovery: how services find each other's network locations dynamically\n→ Problem: container IPs change on every restart — cannot hardcode addresses\n→ Client-side: client queries registry, picks instance, calls directly (Eureka + Ribbon)\n→ Server-side: client calls load balancer, LB queries registry, routes request (AWS ALB)\n→ Service Registry: Eureka, Consul, etcd, AWS Cloud Map\n→ Kubernetes default: DNS-based — no registry SDK needed in application code",
    detailed_answer: "In a dynamic container environment, service instances start and stop constantly. Their IP addresses change on every restart. You cannot hardcode service addresses.\n\nService Registry:\nA database of service instances. Services register on startup, deregister on shutdown. Registry stores: service name, IP, port, health status.\n\nClient-Side Discovery:\n→ Client queries the service registry directly\n→ Client implements load balancing logic (round-robin, random, least-connections)\n→ Client picks an instance and calls it directly\n→ Example: Netflix Eureka + Ribbon\n→ Pros: client controls load balancing strategy\n→ Cons: every client language needs registry SDK, LB logic duplicated in every client\n\nServer-Side Discovery:\n→ Client calls a load balancer or router\n→ Load balancer queries service registry\n→ Load balancer routes request to a healthy instance\n→ Client is unaware of registry or individual instances\n→ Example: AWS ALB + ECS Service Discovery, Kubernetes Services\n→ Pros: clients are simple, language-agnostic\n→ Cons: extra network hop, LB is another component to manage\n\nKubernetes approach:\nBuilt-in DNS-based discovery. Each Service gets a stable DNS name. Kube-proxy handles load balancing. No registry SDK needed.",
    key_points: [
      "Service Discovery: dynamic location resolution for containerised services",
      "Service Registry: database of healthy service instances",
      "Client-side: client queries registry and load-balances itself",
      "Server-side: load balancer handles discovery and routing (modern default)",
      "Kubernetes: built-in DNS-based discovery via Service resources",
      "Self-registration: services register/deregister on startup/shutdown"
    ],
    hint: "A container restarts and gets a new IP. How does Service B know the new IP of Service A? It needs something that always knows the current healthy instances — that is the service registry.",
    common_trap: "Building custom service discovery when the platform already provides it. In Kubernetes use Kubernetes Services. In ECS use Service Connect or Cloud Map. Building Eureka on top of Kubernetes is unnecessary complexity.",
    follow_up_questions: [
      {
        text: "How does Kubernetes DNS-based service discovery work?",
        type: "inline",
        mini_answer: "Every Kubernetes Service gets a DNS entry: service-name.namespace.svc.cluster.local. CoreDNS resolves this to the Service's ClusterIP. Kube-proxy maintains iptables rules that load-balance ClusterIP traffic across healthy pod IPs. Pods discover services by DNS name — no registry SDK needed. Headless services (clusterIP: None) return individual pod IPs directly for stateful services."
      }
    ],
    related: ["4.1.10", "6.3.01", "5.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["service-discovery", "eureka", "consul",
           "kubernetes", "microservices", "registry"]
  },

  {
    id: "4.1.12",
    section: 4,
    subsection: "4.1",
    level: "advanced",
    question: "What is the Two-Phase Commit (2PC) pattern? Why is it rarely used in microservices?",
    quick_answer: "→ 2PC: distributed protocol ensuring all participants commit or all rollback\n→ Phase 1 (Prepare): coordinator asks all participants to prepare and lock resources\n→ Phase 2 (Commit/Abort): all prepared → commit all; any failed → abort all\n→ Problems: blocking — locks held during both phases, coordinator is SPOF\n→ Network partition: participants cannot determine outcome if coordinator fails between phases\n→ Alternative: Saga pattern with compensating transactions (preferred for microservices)",
    detailed_answer: "Two-Phase Commit is a distributed consensus protocol ensuring all participants in a distributed transaction commit or all roll back.\n\nPhase 1 — Prepare:\n→ Coordinator sends PREPARE to all participants\n→ Each participant: execute transaction, acquire locks, write to undo log\n→ Each participant responds: YES (ready) or NO (cannot commit)\n\nPhase 2 — Commit or Abort:\n→ If ALL said YES: coordinator sends COMMIT to all\n→ If ANY said NO: coordinator sends ABORT to all\n→ Each participant: commits and releases locks, or rolls back\n\nWhy 2PC is problematic in microservices:\n\n1. Blocking protocol:\n   Locks held from Phase 1 through Phase 2.\n   If coordinator fails between phases, participants are stuck holding locks.\n   System blocked until coordinator recovers.\n\n2. Coordinator is SPOF:\n   Coordinator crashes after PREPARE but before COMMIT — participants in prepared state indefinitely.\n\n3. Network partitions:\n   Participant cannot hear COMMIT — does not know whether to commit or abort.\n\n4. Performance:\n   Two round trips + lock holding = high latency. Not suitable for high-throughput.\n\nWhy 2PC works within databases but not across microservices:\n→ Within one DB: network reliable, coordinator is the DB itself\n→ Across microservices: unreliable network, different failure domains\n→ Saga is the microservices alternative",
    key_points: [
      "2PC: prepare all → commit all, or abort all — distributed atomicity",
      "Blocking: locks held across both phases — serious performance impact",
      "Coordinator SPOF: crash between phases leaves participants stuck",
      "Network partitions break 2PC — participants cannot determine outcome",
      "Used within single DB systems — not across microservice boundaries",
      "Saga pattern is the microservices alternative to 2PC"
    ],
    hint: "Coordinator sends PREPARE to 3 services, all say YES, then coordinator crashes before sending COMMIT. All 3 services hold locks waiting. How long do they wait? What unlocks them?",
    common_trap: "Thinking 2PC can be made reliable in microservices with enough retries. The fundamental problem is the blocking nature and coordinator SPOF — retries do not fix these. Change the consistency model to eventual consistency via Saga.",
    follow_up_questions: [
      {
        text: "What is the difference between 2PC and Saga?",
        type: "inline",
        mini_answer: "2PC: synchronous, blocking, ACID atomicity, locks held throughout, coordinator SPOF. Saga: asynchronous, non-blocking, eventual consistency, no distributed locks, no SPOF, compensating transactions handle rollback. 2PC guarantees atomicity. Saga accepts temporary inconsistency. For most microservice business operations, temporary inconsistency is acceptable."
      }
    ],
    related: ["4.1.01", "4.5.01", "2.6.01"],
    has_diagram: false,
    has_code: false,
    tags: ["2PC", "two-phase-commit", "distributed-transactions",
           "ACID", "saga", "consistency"]
  }

  // ══════════════════════════════════════════
  // SUBSECTION 4.2 — RESILIENCE PATTERNS
  // Coming in Batch 2
  // ══════════════════════════════════════════

  // ══════════════════════════════════════════
  // SUBSECTION 4.3 — MESSAGING PATTERNS
  // Coming in Batch 3
  // ══════════════════════════════════════════

  // ══════════════════════════════════════════
  // SUBSECTION 4.4 — INTEGRATION PATTERNS
  // Coming in Batch 4
  // ══════════════════════════════════════════

  // ══════════════════════════════════════════
  // SUBSECTION 4.5 — DATA CONSISTENCY PATTERNS
  // Coming in Batch 5
  // ══════════════════════════════════════════

];