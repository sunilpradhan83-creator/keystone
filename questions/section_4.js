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
  },

  // ══════════════════════════════════════════
  // SUBSECTION 4.2 — RESILIENCE PATTERNS
  // ══════════════════════════════════════════

  {
    id: "4.2.01",
    section: 4,
    subsection: "4.2",
    level: "intermediate",
    question: "Explain the Circuit Breaker pattern. What are its three states and how does it prevent cascading failures?",
    quick_answer: "→ 3 states: Closed (normal, tracks failures) → Open (fast-fail all calls) → Half-Open (probe recovery)\n→ Closed: sliding window tracks failure rate — trips when threshold crossed (e.g. 50%)\n→ Open: rejects all calls instantly, returns fallback — no threads wasted\n→ Half-Open: allows limited probe calls — success closes it, failure reopens it\n→ Resilience4j: @CircuitBreaker + mandatory fallback method\n→ Always combine: Retry + Bulkhead + TimeLimiter for complete resilience",
    detailed_answer: "When a downstream service is failing, continuing to call it wastes threads and causes your service to fail too — cascading failure. The Circuit Breaker pattern breaks this chain.\n\nThree states:\n\nCLOSED (normal): Calls pass through. Failure rate tracked in sliding window. If failure rate exceeds threshold (e.g. 50% of last 10 calls) → transitions to OPEN.\n\nOPEN (tripped): All calls rejected immediately without attempting the downstream. Returns fallback instantly. After waitDurationInOpenState (e.g. 10s) → transitions to HALF-OPEN.\n\nHALF-OPEN (probing): Limited calls allowed through. If they succeed → back to CLOSED. If they fail → back to OPEN.\n\nKey configuration:\n→ slidingWindowSize: how many calls to track\n→ failureRateThreshold: % to trip\n→ waitDurationInOpenState: how long to stay open\n→ slowCallDurationThreshold: slow calls also count as failures\n→ permittedNumberOfCallsInHalfOpenState: probe count\n\nAlways combine with Retry (transient failures), TimeLimiter (timeouts), Bulkhead (thread isolation). Circuit Breaker alone is not full fault tolerance.",
    key_points: [
      "3 states: Closed (normal) → Open (failing) → Half-Open (probing)",
      "Open state fast-fails all calls — saves resources, prevents cascade",
      "Sliding window tracks failure rate — configurable size and threshold",
      "Half-Open probes recovery with limited calls before fully closing",
      "Always define a fallback method — never return null",
      "Combine with Retry + TimeLimiter + Bulkhead for complete resilience"
    ],
    hint: "What happens to threads when the payment service is slow but not failing? Without a circuit breaker all 200 threads block waiting. What happens to other unrelated services?",
    common_trap: "Implementing Circuit Breaker alone and calling the system fault tolerant. You also need Retry with backoff, TimeLimiter for timeouts, and Bulkhead for thread isolation. Resilience4j is one layer — not the complete solution.",
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

OPEN state behaviour:
→ Fast-fails ALL calls immediately
→ Returns fallback response
→ No threads wasted waiting
→ Downstream gets breathing room`,
    has_code: true,
    code_language: "yaml",
    code_snippet: `# Resilience4j Configuration
resilience4j:
  circuitbreaker:
    instances:
      paymentService:
        slidingWindowSize: 10
        failureRateThreshold: 50       # trip at 50%
        waitDurationInOpenState: 10s
        permittedNumberOfCallsInHalfOpenState: 3
        slowCallDurationThreshold: 2s  # slow = failure
        slowCallRateThreshold: 80
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
    tags: ["circuit-breaker", "resilience4j",
           "fault-tolerance", "patterns", "spring-boot"]
  },

  {
    id: "4.2.02",
    section: 4,
    subsection: "4.2",
    level: "intermediate",
    question: "How does Circuit Breaker differ from the Retry pattern? When do you use each?",
    quick_answer: "→ Retry: handles transient failures — service usually works, occasional blip\n→ Circuit Breaker: handles sustained failures — service consistently failing\n→ Retry without CB: multiplies load 3x on already-failing service (retry storm)\n→ Use both together: Retry for occasional failures, CB stops all calls under sustained failure\n→ Correct order: TimeLimiter → CircuitBreaker → Retry\n→ Max retry attempts: 3 for internal, 1-2 for user-facing operations",
    detailed_answer: "They solve different failure scenarios and must be used together.\n\nRetry Pattern:\n→ Scenario: transient failure — network blip, momentary unavailability\n→ Action: retry the same call with backoff\n→ Assumption: failure is temporary, will resolve on retry\n→ Risk: if service is truly down, retries create a retry storm — 3x load on failing service\n\nCircuit Breaker:\n→ Scenario: sustained failure — service consistently failing or slow\n→ Action: stop calling the service entirely, return fallback\n→ Assumption: serious failure, service needs recovery time\n→ Benefit: fast failure, resource preservation, downstream protection\n\nUsed together:\nRetry handles occasional transient failure first. If failure rate remains high across retries, Circuit Breaker trips and stops all calls.\n\nCorrect order with Resilience4j:\nTimeLimiter (timeout) → CircuitBreaker (state check) → Retry (attempts)\n\nThis means: timeout first, then check if circuit is open, then retry if closed.",
    key_points: [
      "Retry: transient failures — service usually works, occasional blip",
      "Circuit Breaker: sustained failures — stop calling entirely",
      "Retry without CB: retry storm under sustained failure (3x load)",
      "Use both: Retry for occasional, CB for sustained",
      "Correct order: TimeLimiter → CircuitBreaker → Retry",
      "Max retries: 3 for internal services, 1-2 for user-facing"
    ],
    hint: "Payment service just deployed a bad release — 500 errors on every call. Retry makes it 3x worse. Circuit Breaker should have tripped first. Which pattern handles which scenario?",
    common_trap: "Configuring retry without a circuit breaker. Under sustained failure every incoming request triggers 3 retries — you have multiplied your traffic 3x on an already-overwhelmed service.",
    follow_up_questions: [
      {
        text: "What is exponential backoff with jitter and why is jitter important?",
        type: "linked",
        links_to: "4.2.05"
      },
      {
        text: "How do you monitor retry and circuit breaker health in production?",
        type: "inline",
        mini_answer: "Key metrics via Micrometer → Prometheus → Grafana: resilience4j.circuitbreaker.state (0=closed, 1=open, 2=half-open), resilience4j.circuitbreaker.failure.rate, resilience4j.retry.calls tagged by outcome. Alert on: state transitions to OPEN, failure rate > 40%, retry exhausted count rising."
      }
    ],
    related: ["4.2.01", "4.2.03", "4.2.05"],
    has_diagram: false,
    has_code: false,
    tags: ["retry", "circuit-breaker", "resilience",
           "backoff", "patterns"]
  },

  {
    id: "4.2.03",
    section: 4,
    subsection: "4.2",
    level: "advanced",
    question: "What is the Bulkhead pattern and how does it complement Circuit Breaker?",
    quick_answer: "→ Bulkhead: isolates thread pools per downstream dependency\n→ One slow service cannot exhaust all threads and starve unrelated services\n→ Thread Pool Isolation: separate executor per service — stronger, more memory\n→ Semaphore Isolation: limit concurrent calls — lighter, same thread\n→ Size pool using Little's Law: N = λ × W (concurrency = rate × response time)\n→ Circuit Breaker stops FAILED services; Bulkhead contains SLOW services — both needed",
    detailed_answer: "Named after bulkheads in a ship's hull — if one compartment floods, others stay dry.\n\nWithout Bulkhead:\nYour service has 200 shared threads. Payment service becomes slow (not failing, just 10-second responses). All 200 threads block waiting for payment. Now user service calls also queue — completely unrelated service starves.\n\nWith Bulkhead:\nPayment service gets its own thread pool of 20 threads. Even if all 20 are blocked, the remaining 180 threads handle user service, inventory service, etc.\n\nTwo types:\n\n1. Thread Pool Isolation:\n   → Dedicated thread pool per downstream service\n   → True isolation — payment slowness cannot affect other services\n   → Higher memory overhead\n\n2. Semaphore Isolation:\n   → Limits concurrent calls via counting semaphore\n   → Same thread — no separate pool\n   → Lower overhead, less isolation\n\nSizing with Little's Law: N = λ × W\n→ N = thread pool size (concurrency)\n→ λ = requests per second to this downstream\n→ W = average response time in seconds\nExample: 100 RPS × 0.3s = 30 threads. Add 20% headroom → 36.\n\nCircuit Breaker vs Bulkhead:\n→ Circuit Breaker: service is FAILING — stop calling it\n→ Bulkhead: service is SLOW — don't let it starve others\nThey solve different problems — use both.",
    key_points: [
      "Bulkhead = isolated thread pools per downstream service",
      "Prevents slow service from starving threads for unrelated services",
      "Thread pool isolation: stronger, dedicated pool, more memory",
      "Semaphore isolation: lighter, same thread, less overhead",
      "Size pool using Little's Law: N = λ × W",
      "Circuit Breaker handles FAILED services; Bulkhead handles SLOW ones"
    ],
    hint: "A service is slow but not failing — it won't trip the circuit breaker. All 200 threads block waiting. What prevents the whole app from becoming unresponsive because of one slow downstream?",
    common_trap: "Only implementing Circuit Breaker and ignoring Bulkhead. A service that is slow but not failing will not trip the circuit breaker but will still starve your thread pool over time.",
    follow_up_questions: [
      {
        text: "How do you size a bulkhead thread pool correctly?",
        type: "linked",
        links_to: "4.2.04"
      }
    ],
    related: ["4.2.01", "4.2.04", "3.3.01"],
    has_diagram: false,
    has_code: true,
    code_language: "yaml",
    code_snippet: `# Bulkhead Configuration — Resilience4j
resilience4j:
  bulkhead:
    instances:
      paymentService:
        maxConcurrentCalls: 20    # isolated pool
        maxWaitDuration: 100ms    # queue timeout
      inventoryService:
        maxConcurrentCalls: 30    # separate limit
        maxWaitDuration: 50ms
# paymentService slowness at 20 threads
# cannot affect inventoryService's 30 threads`,
    tags: ["bulkhead", "resilience", "thread-pool",
           "fault-tolerance", "resilience4j"]
  },

  {
    id: "4.2.04",
    section: 4,
    subsection: "4.2",
    level: "advanced",
    question: "How do you size a bulkhead thread pool correctly using Little's Law?",
    quick_answer: "→ Little's Law: N = λ × W (N=concurrency, λ=RPS, W=response time seconds)\n→ Example: 100 RPS to payment × 0.3s avg response = 30 threads minimum\n→ Add 20% headroom for spikes: ceil(30 × 1.2) = 36\n→ Size for p95 latency not p99 — p99 sizing is too expensive\n→ Set maxWaitDuration short — shed load rather than queue\n→ Monitor rejection rate (should be near zero under normal load)",
    detailed_answer: "Little's Law provides the theoretical basis for thread pool sizing:\nN = λ × W\n→ N = number of concurrent requests in flight (thread pool size needed)\n→ λ = arrival rate (requests per second to this downstream)\n→ W = average service time (seconds per request)\n\nStep by step:\n1. Measure actual RPS to downstream service\n2. Measure actual response time distribution (p50, p95, p99)\n3. N = λ × W_p95 (use p95 not average — average undersizes)\n4. Add 20-30% headroom for traffic spikes\n5. Round up to nearest integer\n\nExample:\n→ Payment service receives 100 RPS\n→ p95 response time: 400ms = 0.4s\n→ N = 100 × 0.4 = 40 threads\n→ With headroom: ceil(40 × 1.2) = 48 threads\n\nWhy p95 not p99:\n→ p99 can be 10x the average\n→ Sizing for p99 requires very large pools\n→ Circuit Breaker handles p99 tail by fast-failing\n→ Bulkhead sized for normal operating conditions\n\nMonitor after setting:\n→ rejection_rate: should be near zero under normal load\n→ concurrent_calls: headroom visible at peak\n→ Tune up if rejections appear, tune down if headroom never used",
    key_points: [
      "Little's Law: N = λ × W (concurrency = rate × response time)",
      "Use p95 latency not p99 — p99 sizing is too expensive",
      "Add 20-30% headroom for traffic spikes",
      "Set maxWaitDuration short — shed load rather than queue",
      "Monitor rejection rate — should be near zero under normal load",
      "Too large = no isolation; too small = too many rejections"
    ],
    hint: "If your service gets 500 RPS and 10% goes to payment service, that is 50 RPS to payment. If payment takes 200ms average, you need 50 × 0.2 = 10 threads minimum. Add headroom.",
    common_trap: "Setting bulkhead size based on intuition. Under-sizing causes excessive rejections. Over-sizing defeats the isolation purpose. Always derive from measured latency and throughput data.",
    follow_up_questions: [
      {
        text: "How do you monitor bulkhead health in production?",
        type: "inline",
        mini_answer: "Key metrics: bulkhead.concurrent_calls (current concurrency), bulkhead.available_concurrent_calls (headroom remaining), bulkhead.rejected_calls (rate). Alert on: rejected_calls rate > 1% of traffic (pool undersized), concurrent_calls consistently at max (consistently undersized). Expose via Micrometer → Prometheus → Grafana. Dashboard one row per downstream service."
      }
    ],
    related: ["4.2.03", "4.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["bulkhead", "littles-law", "thread-pool",
           "sizing", "performance", "resilience4j"]
  },

  {
    id: "4.2.05",
    section: 4,
    subsection: "4.2",
    level: "intermediate",
    question: "What is exponential backoff with jitter? Why is jitter critical?",
    quick_answer: "→ Exponential backoff: double wait time between retries (100ms → 200ms → 400ms → 800ms)\n→ Reduces load on recovering service between retry attempts\n→ Without jitter: all 1000 clients retry at exactly the same moment — thundering herd\n→ With jitter: random variation spreads retries across time — recovering service survives\n→ Equal jitter (AWS recommended): sleep = half_exp + random(0, half_exp)\n→ Cap maximum wait: 30s — don't let backoff grow indefinitely",
    detailed_answer: "Exponential backoff without jitter creates a synchronized retry storm.\n\nScenario without jitter:\n→ Payment service goes down at T=0\n→ 1000 client instances all retry at T=1s simultaneously\n→ Service struggling to recover gets hit with 1000 requests at once\n→ Fails again under the load spike\n→ All 1000 retry at T=2s — synchronized again\n→ Pattern repeats — service can never recover\n\nJitter breaks the synchronisation:\n→ Each client adds random variation to wait time\n→ Retries spread out over a time window\n→ Recovering service sees manageable load\n→ Recovers successfully\n\nJitter strategies:\n\n1. Full Jitter: sleep = random(0, exponential_base)\n   → Most spread, lowest average load\n   → Can delay some retries significantly\n\n2. Equal Jitter (AWS recommended):\n   sleep = exp/2 + random(0, exp/2)\n   → Balanced: minimum guarantee + randomisation\n\n3. Decorrelated Jitter:\n   sleep = min(cap, random(base, prev_sleep × 3))\n   → Each sleep roughly increasing but random\n\nPractical values:\n→ Base: 100ms\n→ Maximum cap: 30 seconds\n→ Max attempts: 3-5",
    key_points: [
      "Exponential backoff: doubles wait time between retries",
      "Without jitter: all clients retry simultaneously = thundering herd",
      "Jitter: random variation spreads retries over time window",
      "Equal jitter: AWS recommended — balanced spread",
      "Cap maximum wait at 30s to prevent very long waits",
      "Jitter is not optional — it is required for correctness at scale"
    ],
    hint: "Imagine 1000 clients all retrying at exactly the same second. The recovering service sees a massive spike, fails again, resets the timer. All 1000 retry at the same second again. How does this end?",
    common_trap: "Adding jitter only to the base delay but not scaling it with the attempt number. If all clients use random(0, 100ms) for every retry, the jitter becomes insignificant compared to the exponential base at later attempts.",
    follow_up_questions: [
      {
        text: "What is the thundering herd problem and where else does it appear?",
        type: "linked",
        links_to: "4.2.06"
      }
    ],
    related: ["4.2.02", "4.2.01"],
    has_diagram: false,
    has_code: true,
    code_language: "java",
    code_snippet: `// Equal Jitter Backoff
public static long calculateDelay(int attempt) {
    long BASE_MS = 100;
    long MAX_MS  = 30_000;  // 30s cap

    // Exponential base
    long exp = Math.min(MAX_MS,
        BASE_MS * (long) Math.pow(2, attempt));

    // Equal jitter: half fixed + half random
    long half = exp / 2;
    return half + (long)(Math.random() * half);
    // attempt 0:  50-100ms
    // attempt 1: 100-200ms
    // attempt 2: 200-400ms
}`,
    tags: ["retry", "backoff", "jitter",
           "thundering-herd", "resilience"]
  },

  {
    id: "4.2.06",
    section: 4,
    subsection: "4.2",
    level: "intermediate",
    question: "What is the thundering herd problem? Where does it appear and how do you prevent it?",
    quick_answer: "→ Thundering herd: many clients simultaneously hit the same resource after a trigger event\n→ Retry storm: all clients retry at the same moment (fix: jitter)\n→ Cache stampede: popular cache key expires, all requests miss simultaneously (fix: mutex or probabilistic refresh)\n→ Cold start: many requests arrive before service is ready (fix: gradual traffic ramp)\n→ Common root cause: synchronised timers — fix is always randomisation or staggering",
    detailed_answer: "The thundering herd problem occurs when many clients simultaneously attempt to access a shared resource after a triggering event, overwhelming the resource.\n\nAppearances:\n\n1. Retry storms:\n   All clients experience failure simultaneously, all retry at the same time.\n   Fix: exponential backoff with jitter.\n\n2. Cache stampede:\n   Popular cache key expires. All concurrent requests miss the cache simultaneously. All hit the database at once.\n   Fix: mutex/lock on first miss (others wait), or probabilistic early expiration (refresh before TTL expires), or stale-while-revalidate.\n\n3. Cold start / deployment:\n   New service instance starts. Many requests arrive before it is warm.\n   Fix: gradual traffic ramp via load balancer health check delays, or pre-warming.\n\n4. Scheduled job synchronisation:\n   Multiple instances all run a scheduled job at the exact same second.\n   Fix: random startup delay, distributed lock (only one instance runs).\n\n5. Connection pool exhaustion:\n   All service instances try to reconnect to DB simultaneously after DB restart.\n   Fix: staggered reconnection with jitter.\n\nCommon root cause: synchronised timers or events affecting many clients simultaneously.\nUniversal fix: randomisation, staggering, or limiting who responds to the event.",
    key_points: [
      "Thundering herd: many clients simultaneously hit shared resource after trigger",
      "Retry storm: synchronised retries — fix with jitter",
      "Cache stampede: simultaneous cache misses — fix with mutex or probabilistic refresh",
      "Cold start: traffic before service ready — fix with gradual ramp",
      "Root cause always: synchronised timers or events",
      "Universal fix: randomisation, staggering, or single-responder patterns"
    ],
    hint: "What do retry storms, cache stampedes, and connection pool reconnects all have in common? They all involve many clients doing the same thing at exactly the same time. What breaks that synchronisation?",
    common_trap: "Solving thundering herd in one place but leaving it in others. Fixing retry jitter but not cache stampede means your DB still gets overwhelmed on popular key expiry. Look for all synchronisation points.",
    follow_up_questions: [
      {
        text: "How do you prevent cache stampede specifically?",
        type: "inline",
        mini_answer: "Three approaches: 1) Mutex on cache miss — first request acquires a distributed lock, populates cache, others wait then read from cache. Simple but adds latency for waiters. 2) Probabilistic early expiration — each request has increasing probability of refreshing before TTL expires. Zero infrastructure needed. 3) Stale-while-revalidate — serve stale data while async refresh happens. Zero latency, eventual consistency. Choose based on how critical freshness is."
      }
    ],
    related: ["4.2.05", "2.4.01"],
    has_diagram: false,
    has_code: false,
    tags: ["thundering-herd", "cache-stampede", "retry-storm",
           "resilience", "performance"]
  },

  {
    id: "4.2.07",
    section: 4,
    subsection: "4.2",
    level: "intermediate",
    question: "What is the Timeout pattern? Why is every outbound call missing a timeout a bug?",
    quick_answer: "→ Timeout: every outbound call must have an explicit maximum wait time\n→ No timeout = thread held indefinitely waiting for response that may never come\n→ Default timeouts are often infinite or dangerously high (minutes not milliseconds)\n→ Three timeout types: connection timeout, read timeout, circuit breaker timeout (TimeLimiter)\n→ Rule: set timeouts at P99 of normal response time × 2-3x safety margin\n→ Without timeout: one slow downstream holds threads until entire service is unresponsive",
    detailed_answer: "A missing timeout is one of the most common causes of production outages. It is a silent bug that only manifests under failure conditions.\n\nWithout timeout:\n→ Service A calls Service B\n→ Service B is slow (network issue, DB lock, GC pause)\n→ Thread in Service A blocks indefinitely\n→ More requests arrive, more threads block\n→ Thread pool exhausted\n→ Service A stops responding to all callers\n→ Cascading failure propagates upstream\n\nThree types of timeouts:\n\n1. Connection Timeout:\n   Maximum time to establish a TCP connection.\n   Should be short: 1-3 seconds.\n   If you cannot connect in 3s, something is seriously wrong.\n\n2. Read/Response Timeout:\n   Maximum time to receive the full response after connecting.\n   Set at p99 of normal response × 2-3x buffer.\n   Example: p99 = 500ms → set timeout at 1-1.5s.\n\n3. TimeLimiter (Resilience4j):\n   Wraps the entire operation including connection + response.\n   Cancels the future if exceeded.\n   Works with Circuit Breaker and Retry.\n\nSetting the right value:\n→ Too short: false timeouts on legitimate slow requests\n→ Too long: threads blocked too long, slow cascade\n→ Sweet spot: p99 × 2-3x\n→ Measure first, set second — never guess\n\nDefault timeouts in common libraries:\n→ Java HttpClient: infinite by default\n→ RestTemplate: infinite by default\n→ OkHttp: 10 seconds (better but still high)\n→ Always override defaults explicitly",
    key_points: [
      "No timeout = thread held indefinitely = potential cascading failure",
      "Default timeouts are often infinite — always override explicitly",
      "Connection timeout: 1-3s; Read timeout: p99 × 2-3x safety margin",
      "TimeLimiter in Resilience4j wraps entire operation",
      "Measure p99 first — never guess the right timeout value",
      "One missing timeout can bring down an entire service under failure"
    ],
    hint: "A thread calling Service B with no timeout blocks forever if B never responds. Your service has 200 threads. How many simultaneous slow calls does it take to make your service completely unresponsive?",
    common_trap: "Setting a single timeout value for all downstream calls. A fast internal cache lookup and a slow third-party payment API need very different timeouts. Tune per downstream service based on its actual p99.",
    follow_up_questions: [
      {
        text: "How do you set timeouts in a Spring Boot RestTemplate or WebClient?",
        type: "inline",
        mini_answer: "RestTemplate: configure via RequestFactory — HttpComponentsClientHttpRequestFactory with setConnectionRequestTimeout, setConnectTimeout, setReadTimeout. WebClient (reactive): use .timeout(Duration) operator or configure via TcpClient with responseTimeout and connectTimeout. Always configure per client instance, not globally. Use Resilience4j TimeLimiter on top for circuit breaker integration."
      }
    ],
    related: ["4.2.01", "4.2.02", "3.3.01"],
    has_diagram: false,
    has_code: true,
    code_language: "java",
    code_snippet: `// Explicit timeouts — never use defaults
@Bean
public RestTemplate restTemplate() {
    HttpComponentsClientHttpRequestFactory factory =
        new HttpComponentsClientHttpRequestFactory();

    factory.setConnectionRequestTimeout(1000); // 1s
    factory.setConnectTimeout(2000);           // 2s
    factory.setReadTimeout(5000);              // 5s ← p99 × 3x

    return new RestTemplate(factory);
}

// WebClient equivalent
@Bean
public WebClient webClient() {
    HttpClient httpClient = HttpClient.create()
        .option(ChannelOption.CONNECT_TIMEOUT_MILLIS,
            2000)
        .responseTimeout(Duration.ofSeconds(5));

    return WebClient.builder()
        .clientConnector(
            new ReactorClientHttpConnector(httpClient))
        .build();
}`,
    tags: ["timeout", "resilience", "fault-tolerance",
           "resttemplate", "webclient", "spring-boot"]
  },

  {
    id: "4.2.08",
    section: 4,
    subsection: "4.2",
    level: "intermediate",
    question: "What is the Fallback pattern? How do you design good fallbacks?",
    quick_answer: "→ Fallback: return a degraded but useful response when a service call fails\n→ Better than an error: partial data is more useful than nothing in most cases\n→ Fallback types: cached response, default value, empty result, simplified computation\n→ Good fallback: user barely notices the degradation\n→ Bad fallback: returns null or throws different exception — harder to debug\n→ Pair with Circuit Breaker — fallback is what Open state returns",
    detailed_answer: "A fallback is what your service returns when a downstream call fails, times out, or the circuit breaker is open.\n\nFallback options by quality:\n\n1. Cached response (best):\n   Return the last known good response from Redis or local cache.\n   User sees slightly stale data — often acceptable.\n   Example: user preferences, product catalogue, exchange rates.\n\n2. Default value:\n   Return a sensible default when no cache exists.\n   Example: recommendation service down → return popular items list.\n   Example: personalisation service down → return generic content.\n\n3. Partial response:\n   Return what you have, omit the failed part.\n   Example: order summary without real-time shipping status.\n   Mark the missing part in the response so client knows.\n\n4. Empty/zero result:\n   Return empty list or zero count.\n   Acceptable when absence is a valid state.\n   Example: notification count service down → show 0 notifications.\n\n5. Error response (last resort):\n   Return a clear, structured error.\n   Only when no meaningful fallback exists.\n   Never return null — causes NullPointerException downstream.\n\nFallback design principles:\n→ Never return null from a fallback method\n→ Fallback should not call other services (cascading failure risk)\n→ Log the original failure — fallbacks hide errors silently\n→ Monitor fallback invocation rate — rising rate = upstream problem",
    key_points: [
      "Fallback: degraded but useful response when downstream fails",
      "Cached response is the best fallback — stale data beats no data",
      "Default value: sensible alternative when no cache exists",
      "Never return null from a fallback — causes downstream NPE",
      "Fallback should not call other services — cascade risk",
      "Monitor fallback rate — rising rate signals upstream problem"
    ],
    hint: "The recommendation service is down. You could return an error and break the page, or return a list of popular items and let the user continue shopping. Which is better for the user?",
    common_trap: "Returning null from a fallback method. The caller receives null, does not check it, and gets a NullPointerException. Now you have replaced one failure mode with another that is harder to debug. Always return a valid empty or default object.",
    follow_up_questions: [
      {
        text: "How do you implement a cache-based fallback with Resilience4j?",
        type: "inline",
        mini_answer: "Pattern: on successful call, write result to Redis with TTL. In fallback method: read from Redis. If Redis also unavailable: return hardcoded default. Key design: cache key must be deterministic from input parameters. TTL: set based on how stale the data can be. Log both the original failure and whether fallback served from cache or default."
      }
    ],
    related: ["4.2.01", "4.2.07", "3.3.01"],
    has_diagram: false,
    has_code: true,
    code_language: "java",
    code_snippet: `// Fallback with Circuit Breaker
@Service
public class RecommendationService {

    @Autowired private RedisTemplate<String,
        List<Product>> cache;

    @CircuitBreaker(
        name = "recommendationService",
        fallbackMethod = "fallback")
    public List<Product> getRecommendations(
            String userId) {
        return recommendationClient.get(userId);
    }

    // Fallback — never throws, never returns null
    public List<Product> fallback(
            String userId, Exception e) {
        log.warn("Recommendation fallback for {}: {}",
            userId, e.getMessage());

        // Try cache first
        List<Product> cached = cache.opsForValue()
            .get("reco:" + userId);
        if (cached != null) return cached;

        // Return popular items as default
        return popularItemsService.getTopItems();
        // ⚠️ popularItems must be resilient itself
        // or use a hardcoded list
    }
}`,
    tags: ["fallback", "circuit-breaker", "resilience",
           "graceful-degradation", "cache"]
  },

  {
    id: "4.2.09",
    section: 4,
    subsection: "4.2",
    level: "advanced",
    question: "What is graceful degradation? How do you design a system that degrades gracefully under failure?",
    quick_answer: "→ Graceful degradation: system continues serving users with reduced functionality when components fail\n→ Identify critical vs non-critical features — never degrade the core path\n→ Feature flags: disable non-critical features when their dependencies are down\n→ Degrade non-critical features silently — user should barely notice\n→ Core path must be protected: checkout must work even if recommendations are down\n→ Design degraded states explicitly — not as afterthoughts",
    detailed_answer: "Graceful degradation means the system remains usable when components fail, just with reduced capability. The alternative — full outage when any component fails — is unacceptable.\n\nStep 1 — Feature tiering:\nClassify every feature as:\n→ P0 Critical: system is unusable without it. Never degrade. (checkout, login, payment)\n→ P1 Important: degrades experience but users can work around. (search filters, history)\n→ P2 Nice to have: users barely notice when missing. (recommendations, personalisation)\n\nStep 2 — Identify dependencies per feature tier:\n→ P0 features must have zero external dependencies, or those dependencies must be redundant.\n→ P2 features can depend on unreliable services — design them to fail gracefully.\n\nStep 3 — Design degraded states explicitly:\nFor every P1/P2 feature, define exactly what the degraded state looks like.\nDon't leave this to runtime improvisation.\nExample: recommendations down → show popular items. Personalisation down → show generic content.\n\nStep 4 — Feature flags:\nWrapping non-critical features in feature flags allows instant disable when their upstream is failing without a deployment.\n\nStep 5 — Communication:\nWhen degrading, tell users clearly but calmly:\n'Recommendations are temporarily unavailable.'\nNever show a generic error for a non-critical feature.\n\nStep 6 — Observability:\nMonitor degradation rates per feature. Rising degradation = upstream problem that needs attention.",
    key_points: [
      "Classify features: P0 critical, P1 important, P2 nice-to-have",
      "P0 core path must work regardless — protect it absolutely",
      "Design degraded states explicitly — not at runtime improvisation",
      "Feature flags: disable non-critical features instantly without deploy",
      "Tell users calmly about degradation — never show generic errors",
      "Monitor degradation rates — rising rate signals upstream problem"
    ],
    hint: "An e-commerce checkout page has: product details, recommendations, reviews, personalised discount, cart, payment. Which of these must work for the user to complete a purchase? Protect only those absolutely.",
    common_trap: "Designing degradation as an afterthought — only thinking about it after the first production outage. Degradation states must be defined at design time, not discovered at incident time.",
    follow_up_questions: [
      {
        text: "How do feature flags enable graceful degradation at runtime?",
        type: "inline",
        mini_answer: "Feature flags (LaunchDarkly, Unleash, or homegrown) wrap non-critical features. When upstream service degrades: ops flips the flag off — feature instantly disabled without deployment. Flags can be conditional: disable only for X% of users, or only in specific regions. Paired with circuit breakers: circuit opens automatically, flag provides manual override. Always have a kill switch for every non-critical external dependency."
      }
    ],
    related: ["4.2.08", "4.2.01", "3.3.01"],
    has_diagram: false,
    has_code: false,
    tags: ["graceful-degradation", "feature-flags",
           "resilience", "fault-tolerance", "UX"]
  },

  {
    id: "4.2.10",
    section: 4,
    subsection: "4.2",
    level: "advanced",
    question: "What is the Idempotency pattern? Why is it fundamental to resilient distributed systems?",
    quick_answer: "→ Idempotent operation: calling it multiple times has same effect as calling it once\n→ Required because: retries, at-least-once delivery, duplicate messages are unavoidable\n→ Implementation: idempotency key (client-generated UUID) stored server-side\n→ Server checks key before processing: already seen → return same result, skip processing\n→ Critical for: payment APIs, order creation, any state-mutating operation\n→ GET/HEAD are naturally idempotent; POST/PATCH operations need explicit design",
    detailed_answer: "In a distributed system, failures are unavoidable. Networks fail mid-request. Services crash after processing but before responding. Message brokers redeliver messages. Without idempotency, these normal events cause duplicate operations — double charges, duplicate orders, double inventory decrements.\n\nIdempotency key pattern:\n1. Client generates a unique key (UUID) per logical operation\n2. Client sends key as request header: Idempotency-Key: uuid\n3. Server checks DB/cache: has this key been seen?\n4. If seen: return the stored result (do not re-process)\n5. If not seen: process the request, store (key → result) atomically\n6. Key expiry: typically 24 hours\n\nWhere idempotency is critical:\n→ Payment processing: double charge is catastrophic\n→ Order creation: duplicate order confuses customer\n→ Inventory decrement: going negative causes fulfilment failure\n→ Email sending: duplicate confirmation emails annoy users\n→ Event consumers: Kafka at-least-once = duplicate messages\n\nNatural vs designed idempotency:\n→ Natural: PUT (set absolute value), DELETE (already deleted = still deleted)\n→ Designed: POST (create) needs explicit idempotency key\n→ Non-idempotent by nature: increment operations (balance += 100)\n   Fix: use absolute value instead (balance = newValue)\n\nDatabase implementation:\nStore idempotency key in same transaction as the operation result. Either both commit or both rollback — no half-states.",
    key_points: [
      "Idempotent: calling N times = calling once — same outcome",
      "Required because retries and at-least-once delivery are unavoidable",
      "Idempotency key: client-generated UUID, stored server-side per operation",
      "Check key before processing: already seen → return stored result",
      "Store key + result atomically in same DB transaction",
      "Critical for payments, orders, any state-mutating operation"
    ],
    hint: "Network fails after your payment service charges the card but before it returns 200 to the caller. Caller retries. Without idempotency: card charged twice. With idempotency key: second call returns the first result without re-charging.",
    common_trap: "Storing the idempotency key separately from the operation result. If the operation succeeds but the key storage fails (or vice versa), you have a half-state that allows re-processing. Always store key + result in the same atomic transaction.",
    follow_up_questions: [
      {
        text: "How do you implement idempotency for a payment API in Spring Boot?",
        type: "inline",
        mini_answer: "1. Accept Idempotency-Key header. 2. Before processing: SELECT from idempotency_keys WHERE key = ?. 3. If found: return stored response immediately. 4. If not found: process payment. 5. In SAME transaction: INSERT into idempotency_keys (key, response, created_at) AND record payment. 6. Return response. If step 5 fails: transaction rollback, both key and payment rolled back. Client retries safely."
      }
    ],
    related: ["4.2.02", "4.3.01", "1.3.02"],
    has_diagram: false,
    has_code: false,
    tags: ["idempotency", "resilience", "payments",
           "distributed-systems", "at-least-once"]
  },

  {
    id: "4.2.11",
    section: 4,
    subsection: "4.2",
    level: "advanced",
    question: "What is the Rate Limiter pattern? How do you implement it and what algorithms exist?",
    quick_answer: "→ Rate limiter: controls how many requests a client can make in a time window\n→ Protects: downstream services, databases, third-party APIs with quotas\n→ Algorithms: Token Bucket (smooth bursts), Leaky Bucket (constant rate), Fixed Window (simple), Sliding Window (accurate)\n→ Token Bucket: most common — allows short bursts up to bucket capacity\n→ Implementation: Redis + Lua script for distributed rate limiting\n→ Response: 429 Too Many Requests + Retry-After header",
    detailed_answer: "Rate limiting protects services from being overwhelmed by too many requests, whether from a misbehaving client, a traffic spike, or an attack.\n\nAlgorithms:\n\n1. Token Bucket (most common):\n   → Bucket holds N tokens. Tokens refill at constant rate.\n   → Each request consumes 1 token. If bucket empty → reject.\n   → Allows short bursts up to bucket size.\n   → Best for: API rate limiting where short bursts are acceptable.\n\n2. Leaky Bucket:\n   → Requests enter a queue (the bucket). Processed at constant rate.\n   → If queue full → reject.\n   → Smooths traffic to constant rate — no bursts.\n   → Best for: protecting services with fixed processing capacity.\n\n3. Fixed Window Counter:\n   → Count requests in fixed time window (e.g. 100 requests per minute).\n   → Reset counter at window boundary.\n   → Problem: 100 requests in last second of window + 100 in first second of next = 200 in 2 seconds.\n   → Simplest but least accurate.\n\n4. Sliding Window:\n   → Tracks requests in a rolling time window.\n   → More accurate than fixed window — no boundary spike problem.\n   → Higher memory usage.\n   → Best for: when accuracy matters more than simplicity.\n\nDistributed rate limiting:\nSingle-instance counter does not work across multiple service instances. Use Redis as shared counter with atomic Lua scripts for correctness.",
    key_points: [
      "Rate limiter: controls requests per time window per client/IP/API key",
      "Token Bucket: allows bursts up to capacity — most common choice",
      "Leaky Bucket: constant output rate — no bursts, smoothest",
      "Fixed Window: simple but boundary spike problem",
      "Sliding Window: most accurate, higher memory cost",
      "Distributed: Redis + atomic Lua script for multi-instance correctness"
    ],
    hint: "Your payment API has a third-party quota of 1000 calls/minute. You have 10 service instances each processing requests. Each instance needs to know about the others' calls — where does the shared counter live?",
    common_trap: "Implementing per-instance rate limiting instead of distributed rate limiting. With 10 instances each allowing 100 RPS, total actual rate is 1000 RPS — 10x the intended limit. Rate limiting must be distributed across all instances.",
    follow_up_questions: [
      {
        text: "How do you implement distributed rate limiting with Redis?",
        type: "inline",
        mini_answer: "Use Redis INCR + EXPIRE in a Lua script for atomicity. Pattern: INCR counter_key → if result is 1 then EXPIRE counter_key window_seconds → if result > limit then reject (429). Lua script ensures INCR and EXPIRE are atomic — no race condition. For sliding window: use Redis Sorted Set with ZADD + ZCOUNT + ZREMRANGEBYSCORE. Use Bucket4j or Resilience4j RateLimiter for Spring Boot integration."
      }
    ],
    related: ["4.2.07", "7.3.01", "4.1.10"],
    has_diagram: false,
    has_code: false,
    tags: ["rate-limiter", "token-bucket", "redis",
           "resilience", "API", "throttling"]
  },

  {
    id: "4.2.12",
    section: 4,
    subsection: "4.2",
    level: "advanced",
    question: "How do you design a complete resilience strategy for a microservice? What layers do you need?",
    quick_answer: "→ Layer 1: Timeouts — every outbound call has explicit timeout (foundation)\n→ Layer 2: Retry + jitter — handles transient failures\n→ Layer 3: Circuit Breaker — handles sustained failures, prevents cascade\n→ Layer 4: Bulkhead — isolates thread pools, prevents slow service starving others\n→ Layer 5: Fallback — returns degraded response when all else fails\n→ Layer 6: Idempotency — makes retries safe for state-mutating operations\n→ All layers needed — any missing layer is a gap in your resilience",
    detailed_answer: "A complete resilience strategy requires all layers working together. Each layer handles a different failure scenario.\n\nLayer 1 — Timeouts (foundation):\nEvery outbound call must have an explicit timeout. No timeout = thread held indefinitely. This is the foundation without which no other pattern works correctly.\n\nLayer 2 — Retry with exponential backoff + jitter:\nHandles transient failures — network blips, momentary unavailability. Without jitter causes thundering herd. Max 3 attempts for most cases.\n\nLayer 3 — Circuit Breaker:\nHandles sustained failures. Stops calling a consistently failing service. Gives it recovery time. Fast-fails with fallback. Prevents cascading failures.\n\nLayer 4 — Bulkhead:\nIsolates thread pools per downstream. One slow service cannot starve others. Sized using Little's Law.\n\nLayer 5 — Fallback:\nWhat to return when everything else fails. Cached response, default value, or graceful error. Never null.\n\nLayer 6 — Idempotency:\nMakes the system safe to retry. Without idempotency, retries cause duplicate operations. Payment charges twice, orders duplicate.\n\nLayer 7 — Observability:\nNot a resilience pattern itself but required to know when resilience is working and when it is failing silently. Monitor: circuit breaker state, retry rate, fallback rate, timeout rate, bulkhead rejection rate.\n\nWith Resilience4j, the decorator order matters:\nTimeLimiter → CircuitBreaker → Retry → Bulkhead\nApplied from outermost to innermost.",
    key_points: [
      "Timeout: foundation — every outbound call, no exceptions",
      "Retry + jitter: transient failures — with exponential backoff",
      "Circuit Breaker: sustained failures — prevents cascading failure",
      "Bulkhead: thread isolation — prevents slow service starving others",
      "Fallback: graceful degradation — never return null",
      "Idempotency: makes retries safe — prevents duplicates"
    ],
    hint: "Remove any one layer and describe what fails: No timeout → threads held forever. No retry → transient failures become user errors. No CB → cascade. No bulkhead → one slow service kills all. No fallback → errors instead of degraded experience. No idempotency → retries cause duplicates.",
    common_trap: "Implementing only Circuit Breaker and calling the service resilient. Each layer handles a failure mode the others cannot. A service with Circuit Breaker but no timeout can still have threads held indefinitely during the closed state.",
    follow_up_questions: [
      {
        text: "How do you configure all Resilience4j layers together in Spring Boot?",
        type: "inline",
        mini_answer: "Apply as decorators in correct order — outermost applied last in code, executes first at runtime: @TimeLimiter → @CircuitBreaker → @Retry → @Bulkhead. Configure each instance in application.yml under resilience4j.timelimiter, circuitbreaker, retry, bulkhead sections. Each downstream service gets its own named instance with tuned values based on its SLA. Register Micrometer metrics bean to expose all metrics automatically."
      }
    ],
    related: ["4.2.01", "4.2.02", "4.2.03",
              "4.2.07", "4.2.08", "4.2.10"],
    has_diagram: true,
    diagram: `COMPLETE RESILIENCE STRATEGY

Incoming Request
      │
      ▼
┌─────────────────────────────────────┐
│  Layer 7: Observability             │ ← monitors all layers
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│  Layer 1: Timeout                   │ ← every call has a limit
│  (TimeLimiter — outermost)          │
└────────────────────┬────────────────┘
                     │ within timeout
                     ▼
┌─────────────────────────────────────┐
│  Layer 3: Circuit Breaker           │ ← is service healthy?
│  OPEN → fast-fail to fallback       │
│  CLOSED → proceed                   │
└────────────────────┬────────────────┘
                     │ circuit closed
                     ▼
┌─────────────────────────────────────┐
│  Layer 2: Retry                     │ ← transient failure?
│  Max 3 attempts + jitter            │
└────────────────────┬────────────────┘
                     │ on failure
                     ▼
┌─────────────────────────────────────┐
│  Layer 4: Bulkhead                  │ ← thread pool isolation
│  Reject if pool exhausted           │
└────────────────────┬────────────────┘
                     │
                     ▼
               Downstream Service

On any failure path:
      ▼
┌─────────────────────────────────────┐
│  Layer 5: Fallback                  │ ← degraded response
│  Cache → Default → Structured Error │
└─────────────────────────────────────┘

Layer 6: Idempotency
  Applied at receiver side
  Makes retries safe`,
    has_code: false,
    tags: ["resilience", "circuit-breaker", "bulkhead",
           "retry", "timeout", "fallback", "strategy"]
  },
  
  // ══════════════════════════════════════════
  // SUBSECTION 4.3 — MESSAGING PATTERNS
  // ══════════════════════════════════════════

  {
    id: "4.3.01",
    section: 4,
    subsection: "4.3",
    level: "intermediate",
    question: "What are the core messaging patterns? Explain Point-to-Point, Pub/Sub, and when to use each.",
    quick_answer: "→ Point-to-Point (Queue): one producer, one consumer — each message processed exactly once\n→ Pub/Sub (Topic): one producer, multiple subscriber groups — each gets a copy\n→ Kafka combines both: within consumer group = P2P, across groups = Pub/Sub\n→ P2P for: task distribution, work queues, load distribution across workers\n→ Pub/Sub for: event broadcasting, audit logs, multiple services reacting to same event\n→ Key difference: P2P message consumed and removed; Pub/Sub message retained for all subscribers",
    detailed_answer: "Messaging patterns define how messages flow between producers and consumers.\n\nPoint-to-Point (Queue):\n→ One message consumed by exactly one consumer\n→ Competing consumers: multiple consumers share a queue, distributing load\n→ Message removed after consumption\n→ Use for: task queues, email jobs, image processing, any work item\n→ Tools: SQS standard queue, RabbitMQ queues\n\nPub/Sub (Topic):\n→ One message received by ALL subscriber groups\n→ Each subscriber group maintains its own position/offset\n→ Message retained after consumption (consumers can re-read)\n→ Use for: event broadcasting, audit logs, multiple services reacting to payment event\n→ Tools: Kafka topics, SNS, Google Pub/Sub\n\nKafka unifies both models:\n→ Within one consumer group: partitions distributed across consumers = P2P (each message processed once per group)\n→ Across multiple consumer groups: each group gets all messages = Pub/Sub\n→ This is why Kafka is the dominant choice: one system, both patterns\n\nRequest-Reply (async RPC):\n→ Producer sends request with correlation_id and reply_to queue\n→ Consumer processes and sends to reply_to queue\n→ Producer correlates response by correlation_id\n→ Use when: you need a response but want decoupling from synchronous HTTP",
    key_points: [
      "P2P: one consumer per message — competing consumers for scale",
      "Pub/Sub: all subscriber groups receive every message",
      "Kafka: within group = P2P, across groups = Pub/Sub",
      "P2P message consumed and removed; Pub/Sub message retained",
      "Competing consumers in P2P: natural horizontal scaling of workers",
      "Request-Reply: async RPC — response via reply_to queue with correlation_id"
    ],
    hint: "Order service publishes OrderCreated. Inventory, Invoice, and Notification all need to react. Which pattern? Now think about image thumbnailing — only one worker should process each image. Which pattern?",
    common_trap: "Using P2P when you need Pub/Sub. If you use a single queue for an event that multiple services need, only one service ever processes it. The others never see the message. Use topics for fan-out, queues for task distribution.",
    follow_up_questions: [
      {
        text: "What is a Dead Letter Queue and how do you operationalise it?",
        type: "linked",
        links_to: "4.3.02"
      },
      {
        text: "How does Kafka consumer group rebalancing work?",
        type: "linked",
        links_to: "4.3.03"
      }
    ],
    related: ["4.3.02", "4.3.03", "1.3.01"],
    has_diagram: true,
    diagram: `POINT-TO-POINT vs PUB/SUB

POINT-TO-POINT (Queue):
Producer ──► [Queue] ──► Consumer A  ← gets message
                    └──► Consumer B  ← waiting
                    └──► Consumer C  ← waiting
Only ONE consumer processes each message
Natural load distribution

PUB/SUB (Topic):
Producer ──► [Topic] ──► Group 1: Inventory  ← gets copy
                    ├──► Group 2: Invoice     ← gets copy
                    └──► Group 3: Notify      ← gets copy
ALL groups receive every message

KAFKA (combines both):
                        ┌── Consumer A ┐
Producer ──► Topic ──── ┤              ├ Group 1 (P2P within group)
                        └── Consumer B ┘
                        ┌── Consumer C ─ Group 2 (Pub/Sub across groups)`,
    has_code: false,
    tags: ["messaging", "pub-sub", "point-to-point",
           "kafka", "queues", "patterns"]
  },

  {
    id: "4.3.02",
    section: 4,
    subsection: "4.3",
    level: "intermediate",
    question: "What is a Dead Letter Queue? How do you operationalise it in production?",
    quick_answer: "→ DLQ: where messages go after failing max retries — prevents poison pills blocking the queue\n→ Poison pill: message that always fails — blocks all subsequent messages without DLQ\n→ Alert on DLQ depth > 0 immediately — never tolerate silent DLQ growth\n→ Include full context: original message, error, stack trace, attempt count, timestamp\n→ Build replay tooling before you need it — not during an incident\n→ Always find root cause before replaying — fix bug first, replay second",
    detailed_answer: "A poison pill message is a message that consistently fails processing. Without a DLQ, it retries forever, blocking subsequent messages.\n\nDLQ configuration:\n→ Max receive count: 3-5 retries before moving to DLQ\n→ Retention: 7-14 days (enough time for on-call to investigate)\n→ Separate DLQ per topic/queue — not a shared DLQ for everything\n→ Include metadata: original topic, partition, offset, error, stack trace, attempt count, timestamp\n\nOperationalising:\n\n1. Alerting:\nAlert on DLQ depth > 0 immediately. A message in DLQ means a failure needing investigation. Never wait for daily reports.\n\n2. Dashboard:\nDLQ depth per topic. Trend chart. Last moved time.\n\n3. Investigation tooling:\nEasy way to inspect DLQ message content. Consumer group offset tools.\n\n4. Replay tooling:\nAfter fixing the bug, mechanism to replay DLQ messages back to the original topic. Must be idempotent. Replay in small batches — validate each before continuing.\n\n5. Manual discard:\nSometimes messages are genuinely invalid (test data in production). Must be able to discard with audit log.\n\nCommon DLQ scenarios:\n→ Malformed message (schema mismatch)\n→ Unhandled edge case in consumer code\n→ Downstream dependency unavailable during processing\n→ Message referencing deleted entity\n\nAnti-pattern: emptying the DLQ without understanding why messages ended up there.",
    key_points: [
      "DLQ prevents poison pills blocking the entire queue forever",
      "Alert on DLQ depth > 0 — never tolerate silent DLQ growth",
      "Include full context: error, stack trace, attempt count, original message",
      "Build replay tooling before you need it — not during an incident",
      "Separate DLQ per queue/topic — not a shared catch-all",
      "Fix root cause before replaying — otherwise DLQ fills again"
    ],
    hint: "A consumer has a null pointer bug for messages with a specific field. Without DLQ it retries forever, blocking all subsequent messages. 3 hours later you have 50,000 blocked messages. When did you want to know about the first failure?",
    common_trap: "Treating DLQ as a dump and never reviewing it. Teams that do not monitor DLQ depth accumulate thousands of unprocessed messages over weeks, creating massive data inconsistency that is painful to reconcile.",
    follow_up_questions: [
      {
        text: "How do you build an idempotent DLQ replay mechanism?",
        type: "inline",
        mini_answer: "Replay reads from DLQ, re-publishes each message to original topic with same message ID. Consumer must be idempotent (check processed_events by event_id before processing). Replay in batches of 10-100 — validate correctness before continuing. Keep audit log of replayed message IDs and timestamps. Never replay all at once — a bad message will re-fill the DLQ."
      }
    ],
    related: ["4.3.01", "4.1.02", "3.3.01"],
    has_diagram: false,
    has_code: false,
    tags: ["DLQ", "dead-letter-queue", "messaging",
           "reliability", "operations", "kafka"]
  },

  {
    id: "4.3.03",
    section: 4,
    subsection: "4.3",
    level: "advanced",
    question: "How does Kafka consumer group rebalancing work? What is the impact and how do you minimise it?",
    quick_answer: "→ Rebalance: triggered when consumer joins/leaves group or topic partition count changes\n→ During rebalance: ALL consumers in group pause processing — stop-the-world\n→ Eager rebalancing (default): all consumers release partitions, reassigned from scratch\n→ Cooperative rebalancing: only affected partitions moved — most consumers continue\n→ Minimise impact: use cooperative rebalancing, increase session.timeout.ms, graceful shutdown\n→ Rebalance storms: cascading rebalances — avoid by tuning heartbeat and session timeouts",
    detailed_answer: "Kafka partitions are distributed across consumers in a consumer group. When group membership changes, partitions must be redistributed — this is a rebalance.\n\nTriggers:\n→ New consumer joins group (scale out)\n→ Consumer leaves group (crash or scale in)\n→ Consumer misses heartbeat (session timeout)\n→ Topic partition count increases\n→ Application calls unsubscribe()\n\nEager Rebalancing (default prior to Kafka 2.4):\n→ ALL consumers revoke ALL partitions simultaneously\n→ Group coordinator reassigns from scratch\n→ ALL consumers pause processing during reassignment\n→ Duration: seconds to tens of seconds depending on group size\n→ Impact: message processing lag spike during every deploy\n\nCooperative/Incremental Rebalancing (Kafka 2.4+):\n→ Only partitions that need to move are revoked\n→ Consumers keep their other partitions and continue processing\n→ Multiple smaller rebalance rounds but minimal disruption\n→ Enable with: partition.assignment.strategy = CooperativeStickyAssignor\n\nMinimising rebalance impact:\n→ Use CooperativeStickyAssignor (Kafka 2.4+)\n→ Tune session.timeout.ms (default 45s) — higher = fewer false timeouts\n→ Tune heartbeat.interval.ms = session.timeout.ms / 3\n→ Graceful shutdown: call consumer.close() before terminating\n→ Avoid long processing in poll loop — commit offsets regularly\n→ max.poll.interval.ms: increase if processing is legitimately slow",
    key_points: [
      "Rebalance: partition redistribution when group membership changes",
      "Eager rebalancing: all consumers pause — stop-the-world during deploy",
      "Cooperative rebalancing: only affected partitions move — minimal disruption",
      "Enable: partition.assignment.strategy = CooperativeStickyAssignor",
      "Rebalance storm: cascading rebalances — tune timeouts to prevent",
      "Graceful shutdown: always call consumer.close() before terminating"
    ],
    hint: "Every time you deploy a new version of your service (rolling deploy), Kafka sees consumers joining and leaving. With 10 instances and eager rebalancing, you get 20 rebalance events during every deploy. What does that do to message processing lag?",
    common_trap: "Not configuring cooperative rebalancing and accepting eager rebalancing as normal. Every rolling deployment causes a full processing pause. On high-throughput topics this creates significant lag that takes minutes to clear.",
    follow_up_questions: [
      {
        text: "How does Kafka partition assignment strategy affect ordering guarantees?",
        type: "inline",
        mini_answer: "Kafka guarantees ordering within a partition only. One consumer per partition within a group. If you need ordered processing for a specific entity (e.g. all events for order_id=123 processed in order), partition by that key — all messages with same key go to same partition, processed by same consumer. More consumers than partitions = idle consumers. More partitions than consumers = one consumer handles multiple partitions."
      }
    ],
    related: ["4.3.01", "8.2.01"],
    has_diagram: false,
    has_code: true,
    code_language: "yaml",
    code_snippet: `# Kafka Consumer — Tuning for minimal rebalance impact
spring:
  kafka:
    consumer:
      group-id: order-service
      # Cooperative rebalancing — minimal disruption
      partition-assignment-strategy:
        - org.apache.kafka.clients.consumer
          .CooperativeStickyAssignor

      # Heartbeat: 1/3 of session timeout
      heartbeat-interval: 3000      # 3s
      session-timeout: 45000        # 45s

      # Increase if processing is legitimately slow
      max-poll-interval-ms: 300000  # 5 min

      # Commit offsets manually for reliability
      enable-auto-commit: false
      auto-offset-reset: earliest`,
    tags: ["kafka", "consumer-group", "rebalancing",
           "cooperative", "messaging", "performance"]
  },

  {
    id: "4.3.04",
    section: 4,
    subsection: "4.3",
    level: "intermediate",
    question: "What is the Competing Consumers pattern? How does it scale message processing?",
    quick_answer: "→ Competing consumers: multiple instances of the same consumer read from one queue\n→ Natural horizontal scaling: add more consumers to process faster\n→ Each message processed by exactly one consumer — no duplicates\n→ Kafka: scale by adding consumers up to partition count (consumers > partitions = idle consumers)\n→ SQS: unlimited competing consumers — visibility timeout prevents duplicate processing\n→ Key consideration: consumers must be stateless and idempotent",
    detailed_answer: "The Competing Consumers pattern places multiple consumer instances behind a single queue. Each message is processed by exactly one consumer — whichever picks it up first.\n\nHow it scales:\n→ Queue depth growing → add more consumers → throughput increases linearly\n→ Queue depth shrinking → remove consumers → save resources\n→ Pairs naturally with auto-scaling: scale consumers based on queue depth metric\n\nKafka specifics:\n→ Partition = unit of parallelism\n→ Maximum parallelism = number of partitions\n→ Adding consumers beyond partition count = idle consumers (wasted resources)\n→ Plan partition count at topic creation — cannot reduce later easily\n→ Rule of thumb: partition count = max expected consumer count × 2 (headroom)\n\nSQS specifics:\n→ No partition concept — unlimited competing consumers\n→ Visibility timeout: message hidden from other consumers while being processed\n→ If consumer crashes before deleting message: visibility timeout expires → message reappears\n→ This is why consumers must be idempotent — message may be processed more than once\n\nStateless consumers:\n→ Each consumer must be stateless — no in-memory state that affects processing\n→ All state in the message or in shared storage (DB, cache)\n→ Any consumer must be able to process any message\n→ This enables safe auto-scaling without sticky routing",
    key_points: [
      "Competing consumers: multiple instances, one queue, each message once",
      "Horizontal scaling: add consumers to increase throughput",
      "Kafka: consumers ≤ partitions — extra consumers are idle",
      "SQS: visibility timeout prevents duplicate processing",
      "Consumers must be stateless — any consumer processes any message",
      "Consumers must be idempotent — message redelivery is possible"
    ],
    hint: "Your image processing queue has 10,000 messages and one consumer processing 100/minute. You need to catch up in 1 hour instead of 100 hours. What is the simplest solution?",
    common_trap: "Adding more Kafka consumers than partitions expecting more throughput. Extra consumers sit idle — Kafka cannot assign a partition to more than one consumer in the same group. Increase partition count first.",
    follow_up_questions: [
      {
        text: "How do you auto-scale consumers based on queue depth?",
        type: "inline",
        mini_answer: "AWS: CloudWatch metric on SQS queue depth → Auto Scaling Group policy → scale EC2 or ECS tasks. Kubernetes: KEDA (Kubernetes Event-Driven Autoscaling) — scales pods based on Kafka consumer group lag or SQS queue depth. Target: keep queue depth below X messages. Scale up fast (less hysteresis), scale down slowly (avoid thrashing). Always respect Kafka partition limit when scaling Kafka consumers."
      }
    ],
    related: ["4.3.01", "3.1.01", "5.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["competing-consumers", "kafka", "SQS",
           "scaling", "messaging", "partitions"]
  },

  {
    id: "4.3.05",
    section: 4,
    subsection: "4.3",
    level: "advanced",
    question: "What is the Transactional Outbox pattern vs using Kafka transactions directly? When do you use each?",
    quick_answer: "→ Outbox: write event to DB table in same transaction as domain data — relay publishes to Kafka\n→ Kafka transactions: producer wraps multiple topic writes in a transaction — atomic across topics\n→ Outbox: for DB → Kafka boundary (most common microservice use case)\n→ Kafka transactions: for Kafka → Kafka boundary (stream processing, Kafka Streams)\n→ Outbox works with any DB; Kafka transactions only within Kafka ecosystem\n→ Both guarantee atomicity — different boundaries",
    detailed_answer: "These two patterns solve atomicity problems at different system boundaries.\n\nOutbox Pattern:\n→ Boundary: relational/document DB ↔ Kafka\n→ Problem: write to DB and publish to Kafka atomically\n→ Solution: write outbox row in same DB transaction, relay publishes asynchronously\n→ Works with: any database that supports transactions\n→ Delivery: at-least-once (relay may republish on restart)\n→ Best for: microservices with their own DB that publish domain events\n\nKafka Transactions:\n→ Boundary: Kafka ↔ Kafka\n→ Problem: read from topic A, transform, write to topic B — atomically\n→ Solution: Kafka producer API with transactional.id — wraps produces and offset commits\n→ Requires: enable.idempotence=true, isolation.level=read_committed on consumers\n→ Delivery: exactly-once within Kafka ecosystem\n→ Best for: Kafka Streams, stream processing pipelines\n\nWhen to use which:\n→ Service has a database → use Outbox\n→ Stateless stream processor (Kafka in, Kafka out) → use Kafka transactions\n→ Both needed? Unlikely in same service — different use cases\n\nCommon mistake:\nTrying to use Kafka transactions to solve the DB + Kafka atomicity problem. Kafka transactions cannot span a database write — they only work within Kafka.",
    key_points: [
      "Outbox: DB + Kafka atomicity — domain data + event in same DB transaction",
      "Kafka transactions: Kafka + Kafka atomicity — stream processing",
      "Outbox: at-least-once delivery, works with any DB",
      "Kafka transactions: exactly-once within Kafka ecosystem only",
      "Service with DB → Outbox; Stateless stream processor → Kafka transactions",
      "Kafka transactions cannot span a DB write — different boundary"
    ],
    hint: "You have an Order service with PostgreSQL. On order creation you want to publish OrderCreated to Kafka atomically. Outbox or Kafka transactions? Now think about a stream processor that reads payments and writes fraud scores. Which one?",
    common_trap: "Trying to use Kafka producer transactions to guarantee atomicity with a database write. Kafka transactions only provide atomicity within Kafka. The DB write is outside Kafka's transaction boundary — use Outbox for the DB + Kafka case.",
    follow_up_questions: [
      {
        text: "What is the Outbox Pattern?",
        type: "linked",
        links_to: "4.1.03"
      }
    ],
    related: ["4.1.03", "4.3.01", "1.3.02"],
    has_diagram: false,
    has_code: false,
    tags: ["outbox", "kafka-transactions", "exactly-once",
           "atomicity", "messaging", "stream-processing"]
  },

  {
    id: "4.3.06",
    section: 4,
    subsection: "4.3",
    level: "intermediate",
    question: "What is message ordering in Kafka? How do you guarantee ordered processing?",
    quick_answer: "→ Kafka guarantees ordering within a partition only — not across partitions\n→ Same key → same partition → same consumer → ordered processing for that key\n→ Partition by business entity key: order_id, user_id, customer_id\n→ More partitions = more parallelism but ordering only per partition\n→ Global ordering across all partitions: use single partition (kills parallelism)\n→ If you need order_id=123 events processed in sequence: partition key = order_id",
    detailed_answer: "Kafka's ordering guarantee is simple and important: messages within a single partition are delivered in the order they were produced. That is the only ordering guarantee Kafka provides.\n\nHow partition assignment works:\n→ Kafka hashes the message key to determine partition: partition = hash(key) % numPartitions\n→ Same key always goes to same partition\n→ Same partition always consumed by same consumer (within a group)\n→ Therefore: same key → same partition → same consumer → ordered processing\n\nDesigning for ordering:\n→ What entity needs ordered processing? Order events, user events, payment events?\n→ Use that entity's ID as the partition key\n→ All events for order_id=123 go to same partition, processed in order\n→ Events for different orders processed in parallel across partitions\n\nOrdering vs parallelism trade-off:\n→ More partitions = more parallel consumers = higher throughput\n→ But ordering only guaranteed within a partition\n→ If you need strict global ordering: one partition (zero parallelism)\n→ Most systems need per-entity ordering, not global — design accordingly\n\nOrdering with failures:\n→ Consumer crashes mid-processing\n→ Rebalance assigns partition to another consumer\n→ Consumer starts from last committed offset\n→ Uncommitted messages replayed in order\n→ Idempotency handles the replay correctly",
    key_points: [
      "Kafka ordering guaranteed within a partition only — not globally",
      "Same key → same partition → same consumer → ordered for that key",
      "Partition by business entity: order_id, user_id, customer_id",
      "Global ordering: requires single partition — kills all parallelism",
      "Per-entity ordering: most real use cases — design for this not global",
      "Ordering preserved through failures via offset replay"
    ],
    hint: "You have payment events for 1 million customers. You need each customer's payments processed in order but not globally. You want parallelism. Partition key = customer_id. How many partitions do you need?",
    common_trap: "Assuming Kafka guarantees ordering across the entire topic. It does not. Two messages produced to different partitions may be consumed in any order. Only messages within the same partition are ordered.",
    follow_up_questions: [
      {
        text: "What happens to ordering when you increase partition count on a live topic?",
        type: "inline",
        mini_answer: "Increasing partition count changes the hash mapping: hash(key) % oldCount vs hash(key) % newCount. A key that previously mapped to partition 3 may now map to partition 7. Messages already in old partitions are processed in old order. New messages go to new partition assignments. Brief ordering disruption for keys that moved partitions. For strict ordering requirements: never change partition count. Plan ahead — Kafka recommends setting partition count high initially."
      }
    ],
    related: ["4.3.01", "4.3.03", "8.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["kafka", "ordering", "partitions",
           "messaging", "consistency"]
  },

  {
    id: "4.3.07",
    section: 4,
    subsection: "4.3",
    level: "intermediate",
    question: "What is event schema evolution in messaging systems? How do you handle breaking changes?",
    quick_answer: "→ Schema evolution: changing event structure without breaking existing producers/consumers\n→ Schema Registry (Confluent): enforces compatibility rules before publishing\n→ Safe: add optional fields with defaults, add new RPC methods\n→ Unsafe: remove fields, change field types, rename fields\n→ Breaking change strategy: create new topic version (events.v2) — migrate consumers gradually\n→ Consumers: always ignore unknown fields — forward compatibility",
    detailed_answer: "In event-driven systems, producers and consumers deploy independently. Schema changes must not break consumers that have not yet been updated.\n\nSchema Registry:\nCentralised store for schema versions. Producers register schemas before publishing. Consumers fetch schemas by ID embedded in the message. Confluent Schema Registry supports Avro, Protobuf, and JSON Schema.\n\nCompatibility modes:\n→ BACKWARD: new schema reads old data (add optional fields)\n→ FORWARD: old schema reads new data (consumers ignore unknown fields)\n→ FULL: both — safest, most restrictive\n\nSafe changes (non-breaking):\n→ Add new optional field with a default value\n→ Add new enum value (consumers must handle UNKNOWN)\n→ Add new message type to the topic\n\nUnsafe changes (breaking):\n→ Remove a field that consumers depend on\n→ Change field type (int → string)\n→ Rename a field (breaking — treat as remove + add)\n→ Change field semantics without changing name\n\nHandling breaking changes:\n→ Create a new topic version: payments.events.v2\n→ Dual-publish: producer writes to both v1 and v2 during transition\n→ Migrate consumers to v2 one by one\n→ Stop publishing to v1 once all consumers migrated\n→ Deprecate v1 topic after retention period\n\nConsumer best practice:\n→ Always ignore unknown fields — essential for forward compatibility\n→ Never fail on unrecognised enum values — use a default UNKNOWN case",
    key_points: [
      "Schema Registry: enforces compatibility before publishing — prevents breaking changes",
      "FULL compatibility: both producers and consumers can upgrade independently",
      "Safe: add optional fields with defaults",
      "Unsafe: remove fields, change types, rename fields",
      "Breaking change: create new topic version (events.v2) + gradual migration",
      "Consumers: always ignore unknown fields — mandatory for forward compatibility"
    ],
    hint: "You need to rename a field in your OrderCreated event. You have 5 consumer services. They deploy independently. How do you rename without taking all consumers down simultaneously?",
    common_trap: "Renaming a field by adding the new name and removing the old name in the same release. Old consumers expecting the old field name receive null. Always add new field first, migrate consumers, then remove old field — three separate releases.",
    follow_up_questions: [
      {
        text: "What is Avro and why is it preferred over JSON for Kafka messages?",
        type: "inline",
        mini_answer: "Avro is a compact binary serialisation format with schema stored separately (in Schema Registry). 3-10x smaller than JSON — no field names in payload, just values. Strong typing with schema evolution rules built in. Schema validation at publish time catches breaking changes before they reach consumers. JSON has no built-in schema enforcement — any consumer can receive malformed data silently."
      }
    ],
    related: ["4.3.01", "1.3.03", "8.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["schema-evolution", "schema-registry", "avro",
           "kafka", "messaging", "backward-compatibility"]
  },

  {
    id: "4.3.08",
    section: 4,
    subsection: "4.3",
    level: "advanced",
    question: "What is the Inbox Pattern? How does it complement the Outbox Pattern?",
    quick_answer: "→ Inbox: consumer writes received event to inbox table before processing — prevents duplicate processing\n→ Outbox (producer side): guarantees event is published exactly once\n→ Inbox (consumer side): guarantees event is processed exactly once\n→ Together: end-to-end exactly-once semantics across DB + Kafka boundary\n→ Check inbox before processing: already seen → skip. New → process + record atomically\n→ Inbox + Outbox = the complete solution for reliable event-driven systems",
    detailed_answer: "The Outbox Pattern guarantees reliable publishing. But at-least-once delivery means the consumer may receive the same event more than once.\n\nThe Inbox Pattern solves the consumer side:\n\nWithout Inbox:\n→ Consumer receives OrderCreated event\n→ Updates inventory in DB\n→ Crashes before committing Kafka offset\n→ On restart: same event redelivered\n→ Inventory decremented twice — incorrect\n\nWith Inbox:\n→ Consumer receives event\n→ Checks inbox table: is event_id already there?\n→ If yes: skip (already processed)\n→ If no: process + INSERT into inbox table — in SAME DB transaction\n→ If crash: both rollback → event redelivered → processed correctly\n\nImplementation:\n1. Inbox table: (event_id PK, processed_at, source_topic)\n2. On receive: SELECT COUNT(*) FROM inbox WHERE event_id = ?\n3. If found: skip, commit Kafka offset, move on\n4. If not found: BEGIN TRANSACTION → process → INSERT inbox row → COMMIT\n5. After commit: commit Kafka offset\n\nWhy same transaction matters:\n→ Processing succeeds, inbox write fails → event reprocessed → duplicate\n→ Processing fails, inbox write commits → event lost → never processed\n→ Both in same transaction: either both commit or both rollback — safe to retry\n\nInbox cleanup:\nDelete inbox rows older than max Kafka retention period. No need to keep them longer — event cannot be redelivered after retention expires.",
    key_points: [
      "Inbox: consumer records received event before processing — prevents duplicates",
      "Check inbox BEFORE processing: seen → skip; new → process + record atomically",
      "Process + inbox insert in SAME DB transaction — atomicity guaranteed",
      "Outbox (producer) + Inbox (consumer) = end-to-end exactly-once",
      "Commit Kafka offset AFTER successful DB transaction — correct ordering",
      "Inbox cleanup: delete rows older than Kafka topic retention period"
    ],
    hint: "Your consumer processes a payment event and updates the account balance. It crashes after the DB commit but before committing the Kafka offset. The event is redelivered. Without the Inbox pattern, what happens to the balance?",
    common_trap: "Checking the inbox table and processing in separate transactions. If the service crashes between the inbox check (not found) and the inbox insert, another instance also sees 'not found' and processes the same event. Atomic check-and-insert prevents this.",
    follow_up_questions: [
      {
        text: "What is the Outbox Pattern?",
        type: "linked",
        links_to: "4.1.03"
      },
      {
        text: "How does Inbox differ from simple idempotency key checking?",
        type: "inline",
        mini_answer: "Idempotency key: stores key + result, returns same result on retry. Inbox: stores event_id to skip processing entirely — no result stored. Inbox is lighter (no result to store) but only prevents re-processing, does not return previous result. Use idempotency keys for API endpoints (must return same response). Use inbox for event consumers (just skip duplicate processing)."
      }
    ],
    related: ["4.1.03", "4.3.01", "4.2.10"],
    has_diagram: false,
    has_code: true,
    code_language: "java",
    code_snippet: `// Inbox Pattern — Consumer
@Service
@Transactional
public class PaymentEventConsumer {

    @Autowired private InboxRepository inbox;
    @Autowired private AccountRepository accounts;

    @KafkaListener(topics = "payment.events")
    public void handle(PaymentEvent event,
            Acknowledgment ack) {
        String eventId = event.getEventId();

        // Check inbox — already processed?
        if (inbox.existsById(eventId)) {
            log.info("Duplicate {}, skipping", eventId);
            ack.acknowledge(); // commit offset
            return;
        }

        // Process + record in SAME transaction
        accounts.debit(event.getAccountId(),
            event.getAmount());

        inbox.save(new InboxEntry(eventId,
            Instant.now()));

        // Commit DB transaction (implicit @Transactional)
        // THEN commit Kafka offset
        ack.acknowledge();
    }
}`,
    tags: ["inbox", "outbox", "exactly-once",
           "idempotency", "kafka", "messaging"]
  },

  {
    id: "4.3.09",
    section: 4,
    subsection: "4.3",
    level: "intermediate",
    question: "What is the Fan-Out pattern in messaging? How do you implement it reliably?",
    quick_answer: "→ Fan-out: one event triggers multiple independent downstream consumers simultaneously\n→ Use Pub/Sub (Kafka topic or SNS): all subscriber groups receive every message\n→ Each subscriber processes independently — one slow consumer does not affect others\n→ Fan-out vs orchestration: fan-out for fire-and-forget, orchestration when you need all to succeed\n→ AWS pattern: SNS → multiple SQS queues (one per consumer) — decoupled, reliable\n→ Kafka pattern: one topic, multiple consumer groups — natural fan-out",
    detailed_answer: "Fan-out means one event reaching multiple consumers. The classic example: payment processed → inventory update + invoice generation + notification + analytics.\n\nWhy fan-out over direct calls:\n→ Publisher does not know or care how many consumers exist\n→ Add new consumer without changing publisher\n→ One slow consumer does not slow others\n→ Consumer failure does not affect other consumers or publisher\n\nKafka fan-out:\n→ Single topic: payment.processed\n→ Multiple consumer groups: inventory-service, invoice-service, notification-service\n→ Each group gets every message independently\n→ Each group has its own offset — processes at its own pace\n→ Natural fan-out built into Kafka's consumer group model\n\nAWS SNS + SQS fan-out:\n→ SNS topic receives the event\n→ Each consumer has its own SQS queue subscribed to the SNS topic\n→ SNS delivers a copy to each queue\n→ Each consumer reads from its own queue\n→ Benefit: SQS provides buffering, retry, DLQ per consumer independently\n\nFan-out vs Saga orchestration:\n→ Fan-out: fire-and-forget, consumers are truly independent\n→ Saga: need ALL steps to succeed for consistency — use orchestration\n→ Fan-out when: each consumer result does not affect others\n→ Saga when: partial completion leaves system in invalid state",
    key_points: [
      "Fan-out: one event → multiple independent consumers via Pub/Sub",
      "Kafka: one topic, multiple consumer groups = natural fan-out",
      "AWS: SNS → multiple SQS queues — buffered fan-out per consumer",
      "Each consumer independent: own pace, own DLQ, own retry",
      "Fan-out vs Saga: fan-out for independent reactions, Saga for coordinated transactions",
      "Add new consumer without changing the publisher — true decoupling"
    ],
    hint: "Payment processed event needs to trigger 4 services. With REST calls: if one fails, you roll back the payment. With fan-out: each service processes independently, at its own pace. Which is more resilient?",
    common_trap: "Using fan-out when you actually need a Saga. If inventory reservation failing means you should not send the invoice, fan-out is wrong — you need orchestrated coordination. Fan-out is for truly independent reactions only.",
    follow_up_questions: [
      {
        text: "What is the difference between fan-out and broadcast?",
        type: "inline",
        mini_answer: "Fan-out: one event to multiple interested consumers — each consumer is a different service with a different role. Broadcast: same event to multiple instances of the SAME service — e.g. invalidating a cache entry across all instances. Fan-out is cross-service. Broadcast is cross-instance of one service. Kafka fan-out uses different consumer groups. Kafka broadcast would send to each instance in its own group."
      }
    ],
    related: ["4.3.01", "4.1.01", "1.3.01"],
    has_diagram: false,
    has_code: false,
    tags: ["fan-out", "pub-sub", "kafka", "SNS", "SQS",
           "messaging", "event-driven"]
  },

  {
    id: "4.3.10",
    section: 4,
    subsection: "4.3",
    level: "advanced",
    question: "What is back-pressure in messaging systems? How do you handle it?",
    quick_answer: "→ Back-pressure: consumer cannot process messages as fast as producer produces them\n→ Queue depth grows → memory/storage exhaustion → system failure\n→ Detection: monitor consumer lag (Kafka) or queue depth (SQS)\n→ Solutions: scale consumers, throttle producers, shed load (drop low-priority messages)\n→ Reactive streams: propagate back-pressure signal upstream — producer slows down\n→ Never ignore growing queue depth — it always ends in failure",
    detailed_answer: "Back-pressure occurs when the rate of message production exceeds the rate of consumption. Left unhandled, queues grow indefinitely until storage is exhausted.\n\nDetection:\n→ Kafka: consumer group lag = max offset - committed offset per partition\n→ SQS: ApproximateNumberOfMessagesVisible metric\n→ Alert thresholds: lag > 10,000 messages or lag growing consistently\n\nHandling strategies:\n\n1. Scale consumers (horizontal):\n   Add more consumer instances.\n   Works up to partition count in Kafka.\n   Most common first response.\n\n2. Increase consumer throughput (vertical):\n   Batch processing: process N messages per poll instead of 1.\n   Parallelise within consumer using thread pools.\n   Optimise processing logic.\n\n3. Throttle producers:\n   Signal producers to slow down via rate limiting.\n   Propagate back-pressure upstream.\n   Works only if you control the producer.\n\n4. Shed load (controlled):\n   Drop or deprioritise low-priority messages.\n   Process high-priority messages first.\n   Requires message priority classification.\n\n5. Time-based expiry:\n   Messages with TTL: expired messages automatically removed.\n   Only for use cases where stale messages are irrelevant.\n\nReactive systems (Project Reactor, RxJava):\n→ Built-in back-pressure propagation\n→ Consumer requests N items at a time\n→ Producer sends at most N\n→ System never produces faster than consumer can handle\n→ Elegant but requires reactive programming model throughout",
    key_points: [
      "Back-pressure: production rate exceeds consumption rate — queue grows",
      "Detection: Kafka consumer lag, SQS queue depth — alert on growth",
      "Scale consumers first: most common immediate response",
      "Batch processing: process N messages per poll — increases throughput",
      "Shed load: drop low-priority messages under sustained pressure",
      "Never ignore growing queue depth — unhandled back-pressure = eventual outage"
    ],
    hint: "Your order processing service usually processes 1000 messages/minute. A flash sale generates 50,000 messages/minute for 10 minutes. What is your strategy? You have 5 minutes before the queue depth becomes critical.",
    common_trap: "Assuming queues can absorb unlimited back-pressure indefinitely. Kafka has storage limits. SQS has message retention limits (4 days default). RabbitMQ can run out of memory. A queue that grows without bound will eventually cause an outage.",
    follow_up_questions: [
      {
        text: "How do you set up consumer lag alerting for Kafka in production?",
        type: "inline",
        mini_answer: "Use Kafka built-in metrics: kafka.consumer.consumer-fetch-manager-metrics.records-lag-max per consumer group. Expose via JMX → Prometheus (kafka_exporter or JMX exporter) → Grafana. Alert on: lag > threshold AND lag growing for > 5 minutes (sustained, not spike). Burpee lab: consumer lag dashboard per group per topic per partition. PagerDuty alert when lag exceeds 30-minute catchup time at current throughput."
      }
    ],
    related: ["4.3.04", "3.1.01", "8.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["back-pressure", "kafka", "consumer-lag",
           "messaging", "scalability", "reactive"]
  },

  // ══════════════════════════════════════════
  // SUBSECTION 4.4 — INTEGRATION PATTERNS
  // ══════════════════════════════════════════

  {
    id: "4.4.01",
    section: 4,
    subsection: "4.4",
    level: "intermediate",
    question: "What is the Backend for Frontend (BFF) pattern? When should you use it?",
    quick_answer: "→ BFF: dedicated API backend per client type (mobile BFF, web BFF, partner BFF)\n→ Each BFF tailored to its client's exact data needs — eliminates over/under-fetching\n→ Mobile BFF: fewer fields, smaller payloads, optimised for bandwidth\n→ Web BFF: richer data, more aggregation, desktop-optimised\n→ BFF owns: data aggregation, transformation, auth delegation, caching per client\n→ Use when: mobile and web have significantly different data requirements",
    detailed_answer: "The BFF pattern creates a dedicated backend service for each type of frontend client. Rather than one generic API serving all clients, each client gets an API shaped exactly for its needs.\n\nWhy it matters:\nA generic API must satisfy the most demanding client — which means simpler clients over-fetch (receive unnecessary data) or under-fetch (need multiple calls). Mobile clients are bandwidth-constrained. Desktop clients can handle richer payloads. Partner integrations need different auth and rate limits.\n\nBFF responsibilities:\n→ Data aggregation: call multiple downstream microservices, combine results\n→ Data transformation: reshape data to match client's exact model\n→ Protocol translation: REST for web, GraphQL for flexible mobile queries\n→ Authentication delegation: validate client token, call services with service identity\n→ Caching: cache per client use case, not generic caching\n→ Rate limiting: different limits per client type\n\nBFF vs API Gateway:\n→ API Gateway: routing, auth, rate limiting — infrastructure concerns, no business logic\n→ BFF: data aggregation, transformation — client-specific business logic\n→ They work together: API Gateway in front of multiple BFFs\n\nWhen to use BFF:\n→ Mobile and web have significantly different data shapes\n→ Different auth requirements per client type\n→ Partner integrations need isolated rate limits and contracts\n→ Teams are organised around client types (mobile team owns mobile BFF)\n\nWhen NOT to use:\n→ Single client type — unnecessary complexity\n→ Small team — operational overhead of multiple backends",
    key_points: [
      "BFF: dedicated backend per client type — mobile, web, partner",
      "Each BFF shaped for its client's exact data needs",
      "BFF aggregates multiple microservices — one call from client instead of many",
      "BFF vs API Gateway: BFF has business logic, Gateway has infrastructure concerns",
      "Teams own their BFF: mobile team → mobile BFF",
      "Use when clients have significantly different data requirements"
    ],
    hint: "Mobile app needs user profile with 3 fields. Web app needs user profile with 20 fields plus recent orders plus recommendations. One generic API must return all 20 fields + orders + recommendations to both. Mobile wastes bandwidth. What is the solution?",
    common_trap: "Building one BFF for all clients. A BFF shared by mobile, web, and partners becomes a new monolith with conflicting requirements. One BFF per client type — or the pattern loses its value.",
    follow_up_questions: [
      {
        text: "How does BFF relate to GraphQL?",
        type: "inline",
        mini_answer: "GraphQL is sometimes used instead of BFF — clients specify exactly what data they need, eliminating over-fetching without separate backends. But GraphQL BFF is also valid: a GraphQL server acts as the BFF, aggregating microservices behind a typed schema. GraphQL solves the data shape problem. BFF also solves: auth delegation, client-specific caching, rate limiting, protocol differences. They complement each other."
      },
      {
        text: "How do you handle authentication in a BFF architecture?",
        type: "inline",
        mini_answer: "Client authenticates with Identity Provider → gets JWT. Client sends JWT to BFF. BFF validates JWT (signature + expiry + claims). BFF calls downstream microservices using its own service identity (machine-to-machine token). Downstream services trust BFF — they do not validate the original client token. BFF is the trust boundary. This prevents microservices from needing to understand every client's auth model."
      }
    ],
    related: ["4.1.10", "7.1.01", "1.4.01"],
    has_diagram: true,
    diagram: `BACKEND FOR FRONTEND PATTERN

Mobile App          Web App          Partner API
    │                   │                │
    │                   │                │
    ▼                   ▼                ▼
┌─────────┐      ┌──────────┐     ┌──────────┐
│ Mobile  │      │  Web     │     │ Partner  │
│  BFF    │      │  BFF     │     │  BFF     │
│         │      │          │     │          │
│ small   │      │ rich     │     │ filtered │
│ payload │      │ payload  │     │ payload  │
└────┬────┘      └────┬─────┘     └────┬─────┘
     │                │                │
     └────────────────┼────────────────┘
                      │
           ┌──────────┼──────────┐
           ▼          ▼          ▼
      ┌─────────┐ ┌───────┐ ┌───────┐
      │  User   │ │ Order │ │ Prod  │
      │ Service │ │  Svc  │ │  Svc  │
      └─────────┘ └───────┘ └───────┘`,
    has_code: false,
    tags: ["BFF", "backend-for-frontend", "API",
           "microservices", "mobile", "aggregation"]
  },

  {
    id: "4.4.02",
    section: 4,
    subsection: "4.4",
    level: "intermediate",
    question: "What is the Anti-Corruption Layer (ACL) pattern? When is it essential?",
    quick_answer: "→ ACL: translation layer between two bounded contexts with different domain models\n→ Prevents external model's concepts from polluting your clean domain model\n→ Translates: terminology, data structures, business rules between systems\n→ Essential when: integrating legacy systems, third-party APIs, or different bounded contexts\n→ ACL is owned by the downstream (consumer) — not the upstream\n→ Without ACL: legacy model concepts leak into your clean domain — technical debt accumulates",
    detailed_answer: "The Anti-Corruption Layer is a defensive translation boundary. Without it, integrating with a legacy system or third-party API causes that system's concepts, terminology, and data structures to leak into your clean domain model.\n\nWhy it matters:\nLegacy systems often have poor domain models — inconsistent naming, mixed concerns, historical quirks. If you map directly from their model to your model, you inherit their problems.\n\nACL responsibilities:\n→ Translate terminology: their 'customer_no' → your 'userId'\n→ Transform data structures: their nested XML → your flat domain object\n→ Enforce invariants: validate their data meets your domain rules\n→ Isolate volatility: when their API changes, only ACL changes — your domain stays clean\n→ Handle protocol differences: SOAP → REST, XML → JSON\n\nACL placement:\n→ Owned by the consumer (you), not the provider\n→ Lives at the boundary of your bounded context\n→ Part of your codebase — the provider does not know it exists\n\nWhen essential:\n→ Integrating legacy monolith during Strangler Fig migration\n→ Third-party payment gateway (Stripe, PayPal) — their model ≠ your model\n→ Different bounded contexts with different ubiquitous languages\n→ Any integration where the external model is messy or volatile\n\nWhen you can skip it:\n→ Two contexts share the same domain model (rare)\n→ External system is simple and stable (unlikely)\n→ Conformist relationship: you intentionally adopt their model (shared kernel)",
    key_points: [
      "ACL: translates between external model and your clean domain model",
      "Owned by consumer — provider does not know it exists",
      "Prevents external system's concepts polluting your domain",
      "When external API changes: only ACL changes, domain stays clean",
      "Essential for: legacy integration, third-party APIs, Strangler Fig migration",
      "Without ACL: technical debt accumulates as external concepts leak in"
    ],
    hint: "You integrate with a legacy system that calls customers 'account_holders' with a 'master_id'. Your domain uses 'Customer' with 'customerId'. Without ACL, 'account_holder' and 'master_id' leak into your code. In 2 years, nobody knows which is correct.",
    common_trap: "Letting the ACL grow into a fat service with business logic. ACL should translate only — no business decisions. Business logic belongs in the domain. ACL that accumulates business logic becomes a bottleneck and a maintenance problem.",
    follow_up_questions: [
      {
        text: "How does ACL relate to the Strangler Fig pattern?",
        type: "linked",
        links_to: "4.1.04"
      },
      {
        text: "What is the difference between ACL and an Adapter pattern?",
        type: "inline",
        mini_answer: "Adapter (GoF): converts an interface into another interface the client expects — structural, code-level. ACL (DDD): translates between entire domain models — conceptual, cross-context. An Adapter handles one method signature mismatch. An ACL handles the entire vocabulary, data structure, and semantic differences between two bounded contexts. ACL often uses Adapters internally as part of its implementation."
      }
    ],
    related: ["4.1.04", "4.4.03", "1.7.01"],
    has_diagram: false,
    has_code: false,
    tags: ["ACL", "anti-corruption-layer", "DDD",
           "integration", "bounded-context", "legacy"]
  },

  {
    id: "4.4.03",
    section: 4,
    subsection: "4.4",
    level: "intermediate",
    question: "What is the Adapter pattern? How does it differ from Facade and how are both used in integration?",
    quick_answer: "→ Adapter: converts one interface to another — makes incompatible interfaces work together\n→ Facade: simplifies a complex subsystem behind a simple unified interface\n→ Adapter: structural fix — 'this interface needs to look like that interface'\n→ Facade: simplification — 'these 5 complex calls become 1 simple call'\n→ Integration use: Adapter wraps third-party client to match your interface; Facade hides complexity of multiple service calls\n→ Both reduce coupling to external systems",
    detailed_answer: "Both patterns deal with interface complexity but solve different problems.\n\nAdapter Pattern:\nConverts the interface of a class into another interface that clients expect. Classic example: you have a payment processor with interface A (Stripe SDK), your code expects interface B (your PaymentGateway interface). An Adapter wraps Stripe and makes it look like PaymentGateway.\n\nUse cases:\n→ Wrapping third-party libraries behind your own interface\n→ Making legacy code work with new code\n→ Allowing unit testing by injecting mock adapters\n→ Switching providers: swap StripeAdapter for PaypalAdapter without changing business logic\n\nFacade Pattern:\nProvides a simplified interface to a complex subsystem. Example: checkout process requires calling inventory service, payment service, shipping service, notification service. A CheckoutFacade exposes one placeOrder() method that orchestrates all four calls internally.\n\nUse cases:\n→ Simplifying complex multi-step operations for callers\n→ Hiding internal subsystem complexity\n→ Providing a stable API over a volatile implementation\n→ Reducing the learning curve for new developers using a subsystem\n\nKey difference:\n→ Adapter: makes two incompatible interfaces compatible — interface translation\n→ Facade: simplifies complexity — hides multiple calls behind one\n→ Adapter does not simplify, just translates\n→ Facade does not translate interfaces, just reduces complexity\n\nUsed together:\nA checkout facade may internally use payment adapters, shipping adapters, and notification adapters — each wrapping a different external service.",
    key_points: [
      "Adapter: interface translation — makes incompatible interfaces compatible",
      "Facade: simplification — hides multiple calls behind one simple interface",
      "Adapter: structural fix for interface mismatch",
      "Facade: complexity reduction for callers",
      "Adapter enables provider switching without changing business logic",
      "They complement each other: Facade uses multiple Adapters internally"
    ],
    hint: "You switch payment providers from Stripe to PayPal. With an Adapter wrapping each provider: you swap StripeAdapter for PayPalAdapter — business logic unchanged. Without Adapter: you change every place in your code that calls Stripe directly.",
    common_trap: "Using Facade when you need Adapter. If the problem is interface incompatibility, a Facade does not help — it simplifies but does not translate. If the problem is complexity, an Adapter does not help — it translates but does not simplify.",
    follow_up_questions: [
      {
        text: "How does the Adapter pattern enable unit testing of external integrations?",
        type: "inline",
        mini_answer: "Define your own PaymentGateway interface. StripeAdapter implements PaymentGateway by calling Stripe SDK. In production: inject StripeAdapter. In tests: inject MockPaymentGateway (also implements PaymentGateway). Business logic never knows about Stripe — it only knows PaymentGateway. Tests run without network calls. Provider can be swapped without touching business logic. This is the Dependency Inversion Principle in action."
      }
    ],
    related: ["4.4.02", "4.4.01"],
    has_diagram: false,
    has_code: true,
    code_language: "java",
    code_snippet: `// Adapter Pattern — Payment Provider
// Your interface
public interface PaymentGateway {
    PaymentResult charge(Money amount, String token);
    void refund(String transactionId);
}

// Adapter wraps Stripe SDK
@Component
public class StripeAdapter implements PaymentGateway {

    @Autowired private StripeClient stripe; // third-party

    @Override
    public PaymentResult charge(Money amount,
            String token) {
        // Translate YOUR model → Stripe model
        ChargeCreateParams params = ChargeCreateParams
            .builder()
            .setAmount(amount.getCents())   // their format
            .setCurrency(amount.getCurrency().toLowerCase())
            .setSource(token)
            .build();
        Charge charge = stripe.charges().create(params);

        // Translate Stripe response → YOUR model
        return PaymentResult.of(charge.getId(),
            charge.getStatus().equals("succeeded"));
    }
}
// Swap to PayPal: just inject PayPalAdapter
// Business logic unchanged`,
    tags: ["adapter", "facade", "integration",
           "patterns", "GoF", "interface"]
  },

  {
    id: "4.4.04",
    section: 4,
    subsection: "4.4",
    level: "advanced",
    question: "What is the Strangler Fig pattern at the integration level? How do you use it to replace a third-party system?",
    quick_answer: "→ Same principle as service migration: route traffic gradually from old system to new\n→ Integration ACL + feature flags: direct specific requests to new system, others to old\n→ Phase 1: run both systems in parallel, compare outputs (shadow mode)\n→ Phase 2: route non-critical traffic to new system (1% → 10% → 100%)\n→ Phase 3: decommission old system once new is fully validated\n→ Key: never do a big-bang switch — always have rollback path",
    detailed_answer: "Replacing a third-party system (payment gateway, CRM, ERP) carries the same risks as migrating a monolith. The Strangler Fig approach applies identically.\n\nPhase 1 — Shadow Mode:\n→ All requests go to old system (live traffic)\n→ Same requests also sent to new system (shadow — response discarded)\n→ Compare outputs: does new system produce same results?\n→ Build confidence without any user impact\n→ Duration: days to weeks depending on traffic volume\n\nPhase 2 — Gradual Migration:\n→ Feature flag controls % routed to new system\n→ Start with low-risk, non-financial operations\n→ Monitor: error rates, latency, business metrics\n→ Increase % as confidence grows\n→ Rollback = flip feature flag back to 0%\n\nPhase 3 — Decommission:\n→ 100% traffic on new system\n→ Old system in read-only mode (safety net)\n→ Final validation: data consistency check\n→ Decommission old system\n\nACL role:\n→ ACL sits between your code and both systems\n→ ACL decides which system handles each request based on feature flag\n→ Your business logic never knows which system is active\n→ Makes rollback trivial — one config change\n\nRisks to manage:\n→ Data consistency: both systems must be kept in sync during transition\n→ Stateful operations: a payment started in old system must complete in old system\n→ Audit trail: ensure new system captures same compliance data",
    key_points: [
      "Shadow mode: route to both systems, compare outputs — zero user impact",
      "Gradual migration: feature flag controls traffic split — easy rollback",
      "ACL handles routing decision — business logic stays unchanged",
      "Start with non-critical, non-financial operations first",
      "Rollback = flip feature flag — always maintain this path",
      "Data consistency check before decommissioning old system"
    ],
    hint: "You are replacing your payment gateway from PayPal to Stripe. You cannot test in production with real money at scale. Shadow mode lets you send the same payment requests to both systems and compare responses before any real traffic switches.",
    common_trap: "Doing a big-bang switch on a deadline. Migrating a critical third-party system (payment gateway, ERP) all at once with no rollback path. One issue and you are down until you can switch back — which now requires an emergency deployment.",
    follow_up_questions: [
      {
        text: "What is the Strangler Fig pattern for service migration?",
        type: "linked",
        links_to: "4.1.04"
      }
    ],
    related: ["4.1.04", "4.4.02", "6.4.01"],
    has_diagram: false,
    has_code: false,
    tags: ["strangler-fig", "integration", "migration",
           "shadow-mode", "feature-flags", "third-party"]
  },

  {
    id: "4.4.05",
    section: 4,
    subsection: "4.4",
    level: "intermediate",
    question: "What is the Gateway Aggregation pattern? How does it reduce client chattiness?",
    quick_answer: "→ Gateway Aggregation: API Gateway or BFF combines multiple downstream calls into one client request\n→ Problem: client makes 5 calls to 5 services — 5× network roundtrips, 5× latency\n→ Solution: gateway makes 5 calls internally (fast internal network) returns 1 response\n→ Reduces: client latency, mobile battery usage, number of connections\n→ Gateway calls services in parallel where possible — total latency = slowest service\n→ Different from BFF: aggregation is a specific technique; BFF is the broader pattern",
    detailed_answer: "Client chattiness is when a client must make multiple sequential or parallel calls to assemble a complete view. On mobile, each additional network call costs battery, bandwidth, and latency.\n\nWithout aggregation:\n→ Client calls User Service: 80ms\n→ Client calls Order Service: 120ms\n→ Client calls Recommendation Service: 90ms\n→ Total: 290ms (sequential) or 120ms (parallel) + 3× mobile network overhead\n\nWith gateway aggregation:\n→ Client calls Gateway: 1 request\n→ Gateway calls all 3 in parallel (fast internal LAN): 120ms\n→ Gateway combines responses: 10ms\n→ Client receives 1 response: 130ms total\n→ Client saved: 2 network roundtrips, connection overhead, battery\n\nImplementation:\n→ Gateway receives request with aggregation context\n→ Identifies which downstream services needed\n→ Calls them in parallel (CompletableFuture, WebFlux, goroutines)\n→ Waits for all (or timeout + partial response)\n→ Transforms and merges responses\n→ Returns unified response\n\nPartial response handling:\n→ If one service fails: return partial response with error field for that section\n→ Never fail the whole response because one optional section failed\n→ Mark missing sections clearly in response schema\n\nAggregation vs orchestration:\n→ Aggregation: read-only combining of data for display\n→ Orchestration (Saga): coordinated writes with consistency requirements\n→ Use aggregation for GET (queries); Saga for POST/PUT (commands)",
    key_points: [
      "Aggregation: one client request → gateway makes N downstream calls → one response",
      "Call downstream services in parallel — total latency = slowest service",
      "Reduces: client latency, battery, bandwidth, connection overhead",
      "Partial response: return what you have when one service fails",
      "Aggregation for read (queries); Saga for write (coordinated commands)",
      "Gateway owns aggregation logic — clients stay simple"
    ],
    hint: "A mobile dashboard needs data from 5 services. Sequential calls: 500ms total. Parallel calls from mobile: 120ms + 4× network overhead. Gateway aggregation (parallel, internal network): 120ms + 1× network overhead. Which is better on 4G?",
    common_trap: "Calling downstream services sequentially in the gateway instead of in parallel. Sequential aggregation: total latency = sum of all services. Parallel aggregation: total latency = slowest service. For a dashboard with 5 services, the difference can be 5×.",
    follow_up_questions: [
      {
        text: "How do you handle timeouts in a gateway aggregation call?",
        type: "inline",
        mini_answer: "Set a global timeout for the aggregated response (e.g. 3s). Per-service timeouts within that (e.g. 1s each). On individual service timeout: include partial response with null/error for that section — do not fail the whole response. Client receives everything that succeeded within timeout. Mark timed-out sections with a timeout indicator. Log the timeout for monitoring."
      }
    ],
    related: ["4.4.01", "4.1.10", "1.4.01"],
    has_diagram: false,
    has_code: false,
    tags: ["gateway-aggregation", "BFF", "API-gateway",
           "performance", "mobile", "patterns"]
  },

  {
    id: "4.4.06",
    section: 4,
    subsection: "4.4",
    level: "advanced",
    question: "What is the Strangler Fig + feature flag strategy for zero-downtime legacy replacement?",
    quick_answer: "→ Feature flags control which code path handles each request — old system or new\n→ Dark launch: deploy new code, feature flag off — zero traffic, validate in prod env\n→ Canary: flag on for 1% — real traffic, monitor for errors\n→ Progressive rollout: 1% → 5% → 25% → 100% with validation gates between\n→ Instant rollback: flip flag to 0% — no deployment needed\n→ Decouple deployment (code goes to prod) from release (users see it)",
    detailed_answer: "Feature flags (also called feature toggles) combined with Strangler Fig give you the safest possible migration strategy for legacy replacement.\n\nKey principle:\nDeployment ≠ Release\n→ Deployment: new code is in production but inactive (flag off)\n→ Release: new code is serving real traffic (flag on)\nThis decoupling eliminates the risk of each deployment.\n\nPhases:\n\nDark Launch:\n→ Deploy new code to production\n→ Feature flag: 0% (no real traffic)\n→ Test with synthetic requests or internal users\n→ Validates: new code runs correctly in production environment\n→ No user impact if it fails\n\nCanary Release:\n→ Flag: 1-5% of real traffic to new code path\n→ Monitor: error rate, latency, business metrics\n→ Compare: new vs old system metrics side by side\n→ If metrics good: proceed. If bad: flag back to 0%\n\nProgressive Rollout:\n→ 1% → 5% → 25% → 50% → 100%\n→ Validation gate at each step\n→ Automated canary analysis: if error rate increases → auto-rollback\n→ Duration per step: depends on traffic volume and risk tolerance\n\nRollback:\n→ Flip flag to 0% — takes seconds\n→ No deployment required\n→ No database rollback needed (if data is backward compatible)\n→ Fastest possible rollback path\n\nFlag targeting:\n→ By user ID: internal users get new system first\n→ By geography: roll out to one region first\n→ By customer segment: beta users, then paying users, then all",
    key_points: [
      "Decouple deployment from release — code in prod ≠ users see it",
      "Dark launch: new code deployed but flag off — validate in prod environment",
      "Canary: 1% real traffic — real validation with real users",
      "Progressive rollout: gates between each step with validation",
      "Instant rollback: flip flag to 0% — no deployment, no DB rollback",
      "Flag targeting: internal users → beta → all users"
    ],
    hint: "You deployed the new payment system. 30 minutes into 50% rollout, error rate spikes to 5%. With feature flags: flip to 0% in seconds, investigate. Without feature flags: emergency rollback deployment — 20 minutes minimum. Which would you rather have at 2am?",
    common_trap: "Keeping feature flags in code forever. Flags that are never cleaned up become dead code that confuses developers. Set a removal date for every flag at creation. Once rollout is complete and stable, remove the flag and the old code path.",
    follow_up_questions: [
      {
        text: "What tooling exists for feature flag management?",
        type: "inline",
        mini_answer: "Managed services: LaunchDarkly (most feature-rich, expensive), Unleash (open source, self-hosted), Flagsmith, Split.io. AWS: CloudWatch Evidently for A/B testing + flags. Simple homegrown: flags stored in Redis or a config table — checked on each request. For simple on/off: environment variables work. For complex targeting (% rollout, user segments): use a dedicated service. Always: flag state must update without deployment."
      }
    ],
    related: ["4.4.04", "6.4.01", "4.1.04"],
    has_diagram: false,
    has_code: false,
    tags: ["feature-flags", "strangler-fig", "deployment",
           "canary", "zero-downtime", "migration"]
  },

  {
    id: "4.4.07",
    section: 4,
    subsection: "4.4",
    level: "intermediate",
    question: "What is the Retry Pattern with idempotency keys for third-party API integration?",
    quick_answer: "→ Third-party APIs (Stripe, Twilio, SendGrid) fail transiently — must retry safely\n→ Without idempotency key: retry charges card twice, sends email twice\n→ With idempotency key: provider deduplicates — same key = same result returned\n→ Generate key per logical operation (UUID), send as header on every attempt\n→ Key format: operation-type + business-id (e.g. charge-order-123)\n→ Provider caches result for 24h — identical request within 24h returns cached result",
    detailed_answer: "Third-party API integrations require careful retry design. These APIs are external, have rate limits, and charge money or send messages — retrying blindly causes real-world consequences.\n\nThe problem:\n→ You call Stripe to charge a card\n→ Stripe charges the card successfully\n→ Network fails before Stripe's 200 response reaches you\n→ Your code sees a timeout, retries\n→ Stripe charges the card again\n→ Customer is double-charged\n\nIdempotency key solution:\n→ You generate a UUID for this charge attempt: charge-order-123\n→ You send: POST /charges with header Idempotency-Key: charge-order-123\n→ Stripe charges card, stores result against key\n→ Network fails, you retry with same key\n→ Stripe sees key already exists, returns cached result\n→ No second charge\n\nKey design:\n→ Unique per logical operation (not per HTTP request)\n→ Human-readable helps debugging: charge-{orderId}-{timestamp}\n→ Stable across retries: must be the same UUID on all retry attempts\n→ Scoped to operation type: charge key ≠ refund key for same order\n\nExpiry:\n→ Stripe caches idempotency results for 24 hours\n→ After 24h: same key treated as new request\n→ Store your keys with same TTL for consistency\n\nNot all providers support idempotency keys:\n→ Check provider docs\n→ If not supported: implement deduplication in your own code\n→ Check before creating: does a successful result already exist in your DB?",
    key_points: [
      "Idempotency key: provider deduplicates retries — same key = same result",
      "Generate per logical operation (UUID), not per HTTP request",
      "Send on every attempt — provider returns cached result if already seen",
      "Key must be stable across all retries for same operation",
      "24h typical TTL — store your keys with matching expiry",
      "If provider lacks key support: pre-check in your DB before calling"
    ],
    hint: "Twilio sends an SMS for each POST /messages call. You retry on timeout. Without idempotency: customer gets 3 identical SMS messages from your retry logic. With idempotency key: Twilio detects duplicate and returns the original send result.",
    common_trap: "Generating a new idempotency key on each retry attempt. This defeats the entire purpose — each retry looks like a new operation to the provider. Generate the key once before the first attempt and reuse it for all retries.",
    follow_up_questions: [
      {
        text: "How do you implement idempotency when the third-party provider does not support keys?",
        type: "inline",
        mini_answer: "Pre-check pattern: before calling the provider, check your own DB for an existing successful result for this operation (order_id + operation_type). If found: return cached result, skip provider call. If not found: call provider, store result in DB, return result. This is your own idempotency layer in front of a non-idempotent provider. Requires the provider response to be deterministic enough to cache."
      }
    ],
    related: ["4.2.10", "4.2.02", "7.3.01"],
    has_diagram: false,
    has_code: false,
    tags: ["idempotency", "retry", "third-party",
           "stripe", "integration", "API"]
  },

  {
    id: "4.4.08",
    section: 4,
    subsection: "4.4",
    level: "advanced",
    question: "What is the Claim Check pattern? When do you use it for large message payloads?",
    quick_answer: "→ Claim Check: store large payload in external storage, send only a reference (claim check) in the message\n→ Problem: Kafka messages >1MB cause performance degradation; SQS limit is 256KB\n→ Solution: upload payload to S3/blob store → publish message with S3 URL → consumer downloads\n→ Reduces: broker storage, network traffic, consumer memory pressure\n→ Use when: messages regularly exceed broker limits or contain binary data\n→ Trade-off: extra network hop to fetch payload, S3 storage cost, lifecycle management",
    detailed_answer: "Message brokers are optimised for many small messages, not large payloads. Kafka starts degrading with messages above 1MB. SQS hard limit is 256KB. The Claim Check pattern externalises large payloads.\n\nHow it works:\n1. Producer has large payload (e.g. 10MB PDF, large JSON)\n2. Producer uploads payload to S3 (or Azure Blob, GCS)\n3. Producer publishes small message to Kafka/SQS with S3 URL (the 'claim check')\n4. Consumer reads small message from broker\n5. Consumer downloads full payload from S3 using the URL\n6. Consumer processes payload\n7. Consumer deletes or archives payload from S3 after processing\n\nPayload storage options:\n→ S3 (AWS): most common, cost-effective, lifecycle policies\n→ Azure Blob Storage / GCS: same pattern\n→ Redis: for temporary payloads with TTL\n→ Database: only if payload needs to be queryable\n\nMessage schema with claim check:\n→ event_id: UUID\n→ event_type: OrderDocumentGenerated\n→ payload_url: s3://bucket/path/to/payload.json\n→ payload_size: 10485760 (bytes)\n→ payload_checksum: sha256 hash (consumer validates integrity)\n→ expires_at: timestamp (when S3 object will be deleted)\n\nLifecycle management:\n→ S3 lifecycle policy: auto-delete after retention period\n→ Or consumer deletes after processing\n→ Checksum validates payload was not corrupted in S3\n\nWhen to use:\n→ Payload regularly > 256KB\n→ Binary data (PDFs, images, videos)\n→ Payloads that multiple consumers may want to access",
    key_points: [
      "Claim Check: upload payload to S3, send only reference in message",
      "Kafka degrades above 1MB; SQS hard limit is 256KB",
      "Consumer downloads full payload from S3 using the reference",
      "Include checksum in message — consumer validates payload integrity",
      "S3 lifecycle policy handles cleanup — avoid orphaned payloads",
      "Use when: regularly exceed broker limits or binary data involved"
    ],
    hint: "Your order service generates PDF invoices (avg 5MB) and wants to publish them to Kafka for the invoice service to process. Kafka message limit is 1MB. What is the solution?",
    common_trap: "Storing claim check payloads in S3 indefinitely without a lifecycle policy. Over time you accumulate gigabytes of orphaned payloads that were never cleaned up — S3 costs grow silently. Always define retention at creation time.",
    follow_up_questions: [
      {
        text: "How do you handle a claim check payload that has been deleted before the consumer processes it?",
        type: "inline",
        mini_answer: "Consumer attempts to download from S3 → gets 404 (NoSuchKey). Options: 1) Dead-letter the message — payload is gone, cannot process. 2) Check if payload can be regenerated — re-trigger producer. 3) Alert and investigate — was retention too short? Prevention: set payload expiry > message broker retention period. If Kafka retains messages 7 days, S3 payload must live at least 7 days. Add buffer: S3 TTL = broker retention × 2."
      }
    ],
    related: ["4.3.01", "4.3.02"],
    has_diagram: false,
    has_code: false,
    tags: ["claim-check", "messaging", "S3",
           "large-payload", "kafka", "SQS", "patterns"]
  },

  {
    id: "4.4.09",
    section: 4,
    subsection: "4.4",
    level: "intermediate",
    question: "What is the Choreography vs Orchestration trade-off in integration patterns?",
    quick_answer: "→ Choreography: services react to events independently — no central controller\n→ Orchestration: central coordinator (Saga orchestrator, process manager) directs each step\n→ Choreography: loose coupling, hard to visualise full flow, emergent behaviour\n→ Orchestration: tight coupling to coordinator, explicit flow, easy to monitor and debug\n→ Hybrid: choreography for simple fan-out, orchestration for multi-step transactions\n→ Rule: if you cannot draw the full flow from one place, you need orchestration",
    detailed_answer: "This is one of the most important architectural decisions in event-driven systems.\n\nChoreography:\n→ Each service knows what events to listen to and what events to publish\n→ No central controller — services choreograph themselves\n→ Example: OrderCreated → InventoryService reserves stock → StockReserved → InvoiceService creates invoice → InvoiceCreated → NotificationService sends email\n→ Pros: loose coupling, each service independently deployable, simple for individual services\n→ Cons: system behaviour is emergent — cannot understand full flow without reading all services, hard to debug, circular dependency risk, hard to add steps\n\nOrchestration:\n→ Central orchestrator explicitly commands each participant in sequence\n→ Orchestrator knows the full flow and handles failures\n→ Example: OrderSaga tells InventoryService to reserve, waits, tells InvoiceService to create, waits, tells NotificationService to send\n→ Pros: full flow visible in one place, easy to monitor, handles complex branching and rollback\n→ Cons: orchestrator is a new point of coupling, can become a bottleneck\n\nHybrid approach (most real systems):\n→ Orchestration for: multi-step transactions requiring consistency (Saga pattern)\n→ Choreography for: pure event fan-out where services are truly independent\n→ Example: OrderPlaced (orchestrated Saga for payment+inventory) → OrderConfirmed event (choreography for notification, analytics, loyalty)\n\nDecision signals:\n→ Use orchestration when: failure of any step requires rollback of previous steps\n→ Use choreography when: each consumer is truly independent, failure of one does not affect others\n→ If you cannot explain the full business process from one file/class: add orchestration",
    key_points: [
      "Choreography: emergent behaviour, loose coupling, hard to debug at scale",
      "Orchestration: explicit flow, visible in one place, easy to monitor",
      "Choreography for: independent fan-out reactions",
      "Orchestration for: coordinated multi-step transactions (Saga)",
      "Hybrid: orchestrate the transaction, choreograph the downstream reactions",
      "If you cannot draw the full flow from one place: add orchestration"
    ],
    hint: "After 2 years of choreography, a new developer joins. They need to understand the order fulfilment flow. They read OrderService, InventoryService, InvoiceService, ShippingService, NotificationService. Each service triggers the next via events. How long does it take to understand the full flow?",
    common_trap: "Starting with choreography because it is simpler to implement and discovering 2 years later that nobody can understand the full system behaviour. Choreography scales in terms of coupling but does not scale in terms of comprehensibility. Add orchestration for complex business processes from the start.",
    follow_up_questions: [
      {
        text: "What is the Saga pattern?",
        type: "linked",
        links_to: "4.1.01"
      },
      {
        text: "What tools exist for saga orchestration in production?",
        type: "inline",
        mini_answer: "Temporal: most popular, durable execution framework — workflow as code, handles retries/timeouts/signals natively, excellent visibility. AWS Step Functions: managed, visual workflow editor, good for AWS-native architectures. Conductor (Netflix): open source, good for microservices. Camunda: BPMN-based, good for business process modelling. For simple cases: a dedicated saga service with a state machine in your DB works without external tooling."
      }
    ],
    related: ["4.1.01", "4.3.01", "1.3.01"],
    has_diagram: false,
    has_code: false,
    tags: ["choreography", "orchestration", "saga",
           "event-driven", "integration", "trade-offs"]
  }
  
  // ══════════════════════════════════════════
  // SUBSECTION 4.5 — DATA CONSISTENCY PATTERNS
  // Coming in Batch 5
  // ══════════════════════════════════════════

];