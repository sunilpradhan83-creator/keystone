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
  }
  
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