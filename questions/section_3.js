// ─────────────────────────────────────────────────
// SECTION 3 — Non-Functional Requirements (~23q)
// ─────────────────────────────────────────────────
const SECTION_3_QUESTIONS = [

  // ── 3.1 Scalability ──────────────────────────────

  {
    id: "3.1.01",
    section: 3,
    subsection: "3.1",
    level: "intermediate",
    question: "What is the difference between horizontal and vertical scaling, and when would you choose each?",
    quick_answer: "→ Vertical: bigger machine (more CPU/RAM) — simple but has a hard ceiling and single point of failure\n→ Horizontal: more machines — commodity hardware, fault-tolerant, but needs distributed coordination\n→ Choose vertical first when the app is stateful or can't distribute easily\n→ Choose horizontal when you need elastic, cost-linear scale\n→ Most production systems combine both: vertically size each node, horizontally scale the fleet",
    detailed_answer: "Vertical scaling (scale-up) adds resources to an existing machine: more cores, RAM, faster disks. It requires no application changes and keeps things operationally simple, but every machine has a physical ceiling, costs disproportionately more at the top end, and creates a single point of failure.\n\nHorizontal scaling (scale-out) adds more machines to a pool. It maps to cloud economics (commodity VMs, auto-scaling groups), enables fault tolerance through redundancy, and is theoretically unbounded. The price is complexity: you need load balancing, distributed state management, and coordination overhead.\n\nThe right choice depends on the workload. Stateless services (API layers, compute workers) scale horizontally with near-zero friction. Stateful services (databases, sessions) require explicit sharding, replication, or offloading state to a separate tier before they can scale horizontally. Start vertical when the team is small or the service isn't yet load-tested — premature horizontal scaling adds accidental complexity. Migrate to horizontal when you hit the cost inflection point or need >N+1 redundancy.",
    key_points: [
      "Vertical: fast to adopt, no code change, but hard ceiling and SPOF",
      "Horizontal: elastic and fault-tolerant, but needs stateless design or distributed state",
      "Stateful services must externalise state before going horizontal",
      "Auto-scaling groups make horizontal scaling reactive to actual load",
      "Vertical sizing still matters per node — over-small nodes waste coordination overhead",
      "Cloud cost model usually rewards horizontal at sustained scale"
    ],
    hint: "What happens to your database when you try to scale it horizontally? How is that different from scaling an API server?",
    common_trap: "Treating horizontal scaling as universally superior — stateful components need significant re-architecture before they can scale out, and attempting it naively causes data inconsistency.",
    follow_up_questions: [
      { text: "How does auto-scaling work in practice on AWS or GCP?", type: "inline", mini_answer: "Auto-scaling groups monitor metrics (CPU, request count, custom) and add/remove instances. Scale-out triggers when a metric breaches a high threshold; scale-in after a cooldown period. Predictive scaling (Compute Optimizer / GCP Predictive) adjusts ahead of load spikes." },
      { text: "What is the scalability concern specific to databases?", type: "linked", links_to: "2.8.01" }
    ],
    related: ["3.2.01", "2.8.01", "4.1.01"],
    has_diagram: false,
    has_code: false,
    tags: ["scalability", "horizontal-scaling", "vertical-scaling", "nfr"]
  },

  {
    id: "3.1.02",
    section: 3,
    subsection: "3.1",
    level: "intermediate",
    question: "What is the difference between scalability and elasticity?",
    quick_answer: "→ Scalability: ability to handle increased load by adding capacity\n→ Elasticity: ability to dynamically provision and de-provision resources in response to load — scale out AND scale in automatically\n→ A system can be scalable without being elastic (manual scale-up)\n→ Cloud-native systems aim for elastic scalability\n→ Elasticity adds cost efficiency; scalability alone may over-provision",
    detailed_answer: "Scalability is a design property: a system is scalable if it can handle a larger load by adding resources (whether manually or automatically). It is a measure of potential. Elasticity is an operational property: an elastic system automatically adjusts its resource footprint to match current demand, scaling out when load rises and releasing resources when it drops. A system can be scalable without being elastic — adding servers manually every time load increases is scalable but not elastic.\n\nElasticity is critical in cloud environments where you pay per-second for compute. An elastic system reduces idle spend during troughs and avoids capacity gaps during spikes. Auto-scaling groups, serverless functions, and Kubernetes Horizontal Pod Autoscaler are the typical mechanisms. Elasticity requires the application to be stateless (or to externalise state), tolerate rapid instance turnover, and support graceful shutdown (SIGTERM handling, connection draining).\n\nArchitects should design for both: the architecture must be capable of scaling (design-time concern), and the platform must be configured to elastically right-size the fleet (operational concern).",
    key_points: [
      "Scalability = can handle more load; elasticity = automatically adjusts to match load",
      "Elastic implies both scale-out and scale-in without manual intervention",
      "Elasticity requires stateless services or externalised state",
      "Serverless (Lambda, Cloud Run) is maximally elastic — down to zero",
      "Elasticity saves cost; pure scalability may over-provision at baseline",
      "Graceful shutdown (draining) is required for safe scale-in"
    ],
    hint: "If a system needs a human to add servers when traffic spikes, is it elastic? Is it scalable?",
    common_trap: "Conflating the two terms — an architecture can be designed to scale but still require manual intervention to do so, which is not elastic.",
    follow_up_questions: [
      { text: "How does Kubernetes HPA (Horizontal Pod Autoscaler) implement elasticity?", type: "inline", mini_answer: "HPA watches metrics (CPU, memory, custom via Metrics API) and adjusts replica count. It queries the metrics server every 15s by default. KEDA extends this to event-driven sources like queue depth or Kafka consumer lag." },
      { text: "What is the cost implication of serverless elasticity at high volume?", type: "inline", mini_answer: "Serverless scales to zero (great for low traffic) but can cost more per-invocation at sustained high volume than reserved compute. The break-even point depends on invocation frequency, duration, and memory. Typically switch to dedicated compute above ~1M req/day sustained." }
    ],
    related: ["3.1.01", "5.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["scalability", "elasticity", "auto-scaling", "nfr", "cloud"]
  },

  {
    id: "3.1.03",
    section: 3,
    subsection: "3.1",
    level: "advanced",
    question: "How do you approach capacity planning for a system expected to grow 10× over the next year?",
    quick_answer: "→ Establish baseline: current peak RPS, p99 latency, resource utilisation at that load\n→ Load-test to find the saturation point of each tier\n→ Model growth: traffic curve, data volume curve, write/read ratio shifts\n→ Identify bottlenecks first — scaling everything is wasteful\n→ Define scale-out triggers (CPU %, queue depth, latency SLO breach)\n→ Revisit architecture: stateless tiers, shard-ready data layer, async offload",
    detailed_answer: "Capacity planning starts with measurement, not guessing. Baseline current peak load (requests per second, concurrent users, data ingestion rate) and map each metric to resource utilisation — CPU, memory, I/O, network. Load-test the system to identify where each tier saturates. This reveals the actual bottleneck, which is almost never uniformly distributed.\n\nFor 10× growth, model the traffic curve. Is growth linear, step-function (product launches), or seasonal? Identify which tiers are stateless (API servers — just add nodes) vs. stateful (databases — require sharding strategy, read replicas, or migration to a scalable store). Data volume growth is often faster than traffic growth; ensure the storage tier is shard-ready or migrated before it becomes the constraint.\n\nDefine auto-scaling triggers tied to leading indicators (queue depth, concurrent connections) rather than lagging ones (CPU >90%). Pre-provision headroom for sudden spikes — reactive scaling has a lag of 2–5 minutes. Use gradual ramp tests in staging to validate that the auto-scaling policy actually works before it is needed in production.\n\nArchitectural changes often matter more than raw capacity. Introducing a read replica, a cache layer, or async queue can multiply effective capacity 5–10× for specific workloads without adding hardware proportionally.",
    key_points: [
      "Start with measured baseline and load-test saturation points per tier",
      "Model growth as a curve, not a single multiplier",
      "Stateless tiers scale easily; stateful tiers need architectural prep (sharding, replicas)",
      "Data volume often grows faster than traffic — plan the storage tier separately",
      "Auto-scaling triggers should be leading indicators, not lagging",
      "Architectural changes (caching, async, replicas) multiply capacity cheaply"
    ],
    hint: "What is the bottleneck of your current system, and does it scale the same way as the rest of the system?",
    common_trap: "Scaling everything proportionally without identifying the bottleneck — the database is usually the constraint and needs different capacity strategy than stateless API servers.",
    follow_up_questions: [
      { text: "How does load testing differ from production-scale capacity planning?", type: "inline", mini_answer: "Load testing validates behaviour under synthetic load up to a defined ceiling; capacity planning uses load test data to project when real traffic will hit that ceiling and plan ahead. Load tests confirm the model; capacity planning applies it." },
      { text: "When would you choose to scale reads via caching vs. read replicas?", type: "linked", links_to: "2.4.01" }
    ],
    related: ["3.1.01", "3.1.02", "2.4.01", "2.8.01"],
    has_diagram: false,
    has_code: false,
    tags: ["capacity-planning", "scalability", "load-testing", "nfr"]
  },

  {
    id: "3.1.04",
    section: 3,
    subsection: "3.1",
    level: "advanced",
    question: "What is the 'Little's Law' and how does it apply to system capacity planning?",
    quick_answer: "→ Little's Law: L = λ × W (concurrent requests = arrival rate × average service time)\n→ Tells you how many in-flight requests a system holds at any throughput\n→ If service time grows, concurrency grows — even if arrival rate stays the same\n→ Use it to size thread pools, connection pools, and queue depths\n→ Key insight: reducing latency directly reduces required concurrency (capacity)",
    detailed_answer: "Little's Law states that in a stable system, the average number of items in the system (L) equals the average arrival rate (λ) multiplied by the average time each item spends in the system (W): L = λ × W.\n\nFor a web service, L is the number of concurrent in-flight requests, λ is RPS, and W is average response time. At 1,000 RPS with a 100ms average latency, the system holds 100 concurrent requests (1000 × 0.1 = 100). If latency degrades to 500ms, you need 500 concurrent threads — even though arrival rate hasn't changed.\n\nThis has direct implications: thread pools, database connection pools, and queue workers must be sized based on both expected throughput AND expected latency. Systems that silently degrade latency under load will suddenly exhaust concurrency resources, causing queue buildup or rejections. This is one of the hidden mechanisms behind cascading failures — a slowdown in one service backs up connection pools in calling services.\n\nReducing service time (W) directly reduces required concurrency (L), which means improving latency often has greater impact on capacity than simply adding more threads. Architects should model capacity using Little's Law during design, and monitor actual L in production (concurrent in-flight requests) as a leading indicator of saturation.",
    key_points: [
      "L = λ × W: concurrent load = throughput × latency",
      "Latency degradation increases concurrency demand even without more traffic",
      "Size thread pools and connection pools from Little's Law, not guesswork",
      "Rising in-flight request count is an early warning of impending saturation",
      "Reducing latency (W) is often more capacity-efficient than adding concurrency",
      "Law assumes stable system — in overload, queue grows unboundedly"
    ],
    hint: "If your service gets slower under load, what happens to the number of simultaneous connections being held — even if no new traffic arrives?",
    common_trap: "Sizing thread pools only based on peak RPS without accounting for latency — a system handling 5,000 RPS at 20ms needs far fewer threads than one handling 1,000 RPS at 2,000ms.",
    follow_up_questions: [
      { text: "How does Little's Law relate to queue depth in async systems?", type: "inline", mini_answer: "For a queue consumer, L is queue depth, λ is publish rate, and W is processing time per message. If processing slows, queue depth grows. Size consumer concurrency and queue depth limits using the same formula." },
      { text: "What is the connection pool sizing implication when downstream latency triples?", type: "inline", mini_answer: "If downstream latency triples (W × 3) at the same RPS, you need 3× as many connections (L = λ × W). If pool size is fixed, surplus requests queue or fail. This is why latency spikes cascade into connection pool exhaustion upstream." }
    ],
    related: ["3.1.03", "3.4.01", "4.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["little's-law", "capacity-planning", "scalability", "concurrency", "nfr"]
  },

  // ── 3.2 Availability & Reliability ───────────────

  {
    id: "3.2.01",
    section: 3,
    subsection: "3.2",
    level: "intermediate",
    question: "What is the difference between availability and reliability, and how are they measured?",
    quick_answer: "→ Availability: fraction of time the system is operational and accessible\n→ Reliability: probability the system performs its function correctly over a period\n→ Availability measured as uptime % (99.9% = 8.7h downtime/year)\n→ Reliability measured as MTBF (mean time between failures)\n→ A system can be available but unreliable (up but returning wrong answers)",
    detailed_answer: "Availability is a time-based measure: what fraction of total time is the system accessible and responding? It is typically expressed as a percentage ('nines') and translates directly to allowed downtime budget per year. 99.9% (three nines) = 8.76 hours/year; 99.99% (four nines) = 52.6 minutes/year. Availability is usually measured at the service boundary — does the health check pass?\n\nReliability is a correctness and consistency measure: when the system is available, does it behave correctly? A service that is up 100% of the time but silently returns wrong data is 100% available but unreliable. Reliability is measured by error rate, success rate, or formally by MTBF (Mean Time Between Failures) for hardware systems.\n\nThe distinction matters for SLO design. You need separate indicators for each: availability SLI (uptime, health check success rate) and reliability SLIs (error rate, data correctness checks, idempotency violation rate). A payment system might have 99.99% availability but poor reliability if it occasionally double-charges — the availability metric would miss this entirely.\n\nIn practice, architects use MTTF (Mean Time To Failure), MTTR (Mean Time To Recovery), and MTBF = MTTF + MTTR to characterise system resilience. Reducing MTTR through automation (auto-restart, circuit breakers, failover) often has more ROI than chasing the last nines of availability.",
    key_points: [
      "Availability = uptime fraction; reliability = correct behaviour when up",
      "99.9% = 8.76h downtime/year; 99.99% = 52.6 min/year",
      "MTBF = MTTF + MTTR; reducing MTTR is usually cheaper than preventing all failures",
      "A system can be available but unreliable (up but wrong answers)",
      "Define separate SLIs for availability and reliability",
      "Error budget = 1 - SLO target; spend it consciously"
    ],
    hint: "A service that returns HTTP 200 with incorrect data — is it available? Is it reliable?",
    common_trap: "Using uptime percentage as the only SLO — it misses silent correctness failures. A service can be 100% 'up' while giving wrong answers to every request.",
    follow_up_questions: [
      { text: "What is an error budget and how does it inform deployment decisions?", type: "inline", mini_answer: "Error budget = 1 - SLO target (e.g. 0.1% for 99.9% SLO). Teams spend this budget through planned downtime, risky deploys, and incidents. When the budget is exhausted, deployments freeze until it replenishes. This creates a concrete mechanism linking reliability to release velocity." },
      { text: "How do you design for four-nines availability in a microservices system?", type: "linked", links_to: "3.3.01" }
    ],
    related: ["3.3.01", "3.7.01", "4.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["availability", "reliability", "SLO", "SLI", "MTBF", "nfr"]
  },

  {
    id: "3.2.02",
    section: 3,
    subsection: "3.2",
    level: "intermediate",
    question: "What is the difference between an SLI, SLO, and SLA — and how do they relate?",
    quick_answer: "→ SLI (Service Level Indicator): the metric you measure (e.g. request success rate)\n→ SLO (Service Level Objective): your internal target for that metric (e.g. 99.9% success rate)\n→ SLA (Service Level Agreement): contractual commitment to customers, with consequences if breached\n→ SLO is tighter than SLA — burn the error budget internally before breaching the SLA\n→ Bad SLIs make good SLOs impossible — measure what users actually experience",
    detailed_answer: "The SLI/SLO/SLA hierarchy defines how reliability is specified and enforced. An SLI is a quantitative measure of service behaviour from the user's perspective: request success rate, p99 latency, data freshness, or error rate. The SLI must be something observable and meaningful — a metric that degrades when users notice a problem.\n\nAn SLO is the internal reliability target set against an SLI: 'success rate must be ≥ 99.9% over a rolling 28-day window.' The SLO defines the error budget (1 - target) that the team spends through deployments, experiments, and incidents. The SLO is an engineering commitment, not a contract.\n\nAn SLA is the external, contractual commitment made to customers, with financial penalties or credits for breach. The SLA is always looser than the SLO — if the SLO is 99.9%, the SLA might be 99.5%. This gives the team a buffer: they can breach their internal target and investigate before the customer-facing guarantee is at risk.\n\nGood SLI design is harder than it looks. Infrastructure metrics (CPU, pod restarts) are bad SLIs — they can be fine while users suffer. User-journey success rates, end-to-end latency, and error rates are good SLIs. Avoid SLOs you can't measure with your current instrumentation — unmeasured SLOs are fiction.",
    key_points: [
      "SLI = measured metric, SLO = internal target, SLA = external contract",
      "SLA is always looser than SLO to give an internal buffer",
      "Error budget = 1 - SLO; teams spend it consciously on risk",
      "Good SLIs measure user experience, not just infrastructure health",
      "SLOs create alignment between reliability and feature velocity",
      "Unmeasured SLIs make the SLO unenforceable"
    ],
    hint: "Who is the consumer of each — SLI, SLO, SLA? How does that difference shape what each one needs to be?",
    common_trap: "Setting SLOs on infrastructure metrics (CPU, memory) rather than user-visible behaviour — infrastructure can be healthy while users experience failures.",
    follow_up_questions: [
      { text: "How do you choose the right SLI for a complex distributed system with many failure modes?", type: "inline", mini_answer: "Use the 'request success' pattern: define a canary request that exercises the critical path end-to-end. If it succeeds, users are likely happy. For batch/async systems, use freshness (time since last successful output) as the SLI." },
      { text: "What happens when your SLO and SLA have different windows?", type: "inline", mini_answer: "Mismatched windows create blind spots. If SLO is rolling 28-day but SLA is calendar month, an incident at month boundary could breach SLA without ever alerting your internal SLO. Align windows, or model the SLA window explicitly." }
    ],
    related: ["3.2.01", "3.6.01", "6.5.01"],
    has_diagram: false,
    has_code: false,
    tags: ["SLI", "SLO", "SLA", "reliability", "error-budget", "nfr"]
  },

  {
    id: "3.2.03",
    section: 3,
    subsection: "3.2",
    level: "advanced",
    question: "How do you design a system to achieve 99.99% availability when individual services are only 99.9% available?",
    quick_answer: "→ Redundancy: N+1 or N+2 instances — single failure doesn't take down the service\n→ Independent failure domains: AZs, regions — correlated failures don't cascade\n→ Eliminate SPOFs: load balancers, config stores, DNS all need HA treatment\n→ Fast detection + automated recovery: health checks → auto-replacement in <60s\n→ Graceful degradation: shed non-critical paths rather than full outage\n→ Compound availability = product of dependent services — keep the chain short",
    detailed_answer: "If a single service is 99.9% available, two independent instances in parallel achieve 1 - (0.001 × 0.001) = 99.9999%. But that maths only holds if failures are independent. Correlated failures — same AZ, same upstream dependency, same config push — destroy the independence assumption.\n\nDesigning for four nines requires five parallel strategies: (1) Redundancy with independent failure domains — deploy across at least two AZs, with instances spread by the scheduler. (2) Eliminate single points of failure — every load balancer, DNS resolver, and config store must itself be highly available. (3) Fast detection and automated recovery — health checks every 5–10s, auto-replace unhealthy instances within 60s. If MTTR is 60s and failures happen twice a month, that's 2 minutes of downtime/month (~99.995%). (4) Graceful degradation — when a non-critical dependency is down, return partial results rather than failing the whole request. (5) Chaos engineering — deliberately inject failures to find hidden SPOFs before they appear in production.\n\nThe compound availability of N dependent services is the product of their individual availabilities. Three 99.9% services in series yields 99.7% — below three nines. This is why architects minimise synchronous dependencies on the critical path and use async patterns for non-critical calls.",
    key_points: [
      "Parallel redundancy: P(both fail) = P(A fails) × P(B fails) — requires independent failures",
      "Correlated failures (same AZ, same config) destroy the independence assumption",
      "Eliminate all SPOFs: every HA component must itself be HA",
      "Fast MTTR often beats preventing failures: 2 failures/month × 60s MTTR = 99.995%",
      "Series dependencies compound: three 99.9% services = 99.7% end-to-end",
      "Chaos engineering surfaces hidden SPOFs in pre-production"
    ],
    hint: "If you have two redundant instances but they both read from the same config store — how many SPOFs do you actually have?",
    common_trap: "Achieving redundancy at the application tier but forgetting about shared dependencies (shared DB, shared config, shared VPC NAT gateway) that act as hidden SPOFs.",
    follow_up_questions: [
      { text: "How does multi-region active-active differ from multi-AZ in terms of availability guarantees?", type: "linked", links_to: "2.6.05" },
      { text: "What is chaos engineering and how does it prove availability claims?", type: "inline", mini_answer: "Chaos engineering deliberately injects failures (kill instances, inject latency, drop packets) in production or staging to verify that the system degrades gracefully. Netflix's Chaos Monkey pioneered this. The goal is to find SPOFs and incorrect failure-handling code before they surface in real incidents." }
    ],
    related: ["3.3.01", "3.2.01", "2.6.05"],
    has_diagram: false,
    has_code: false,
    tags: ["availability", "redundancy", "SPOF", "fault-tolerance", "nfr", "ha"]
  },

  // ── 3.3 Fault Tolerance & Resilience ─────────────

  {
    id: "3.3.01",
    section: 3,
    subsection: "3.3",
    level: "intermediate",
    question: "What is the difference between fault tolerance and resilience, and what patterns implement each?",
    quick_answer: "→ Fault tolerance: system continues operating correctly despite component failures\n→ Resilience: system detects failures, recovers, and returns to normal operation\n→ Fault tolerance patterns: redundancy, replication, error-correcting codes\n→ Resilience patterns: circuit breaker, retry with backoff, bulkhead, DLQ, timeout\n→ Both are needed: tolerance prevents outage, resilience limits blast radius and recovery time",
    detailed_answer: "Fault tolerance and resilience are related but distinct. Fault tolerance means the system continues to operate correctly even when some components fail — failure is hidden from users. It is achieved through redundancy (multiple instances), replication (multiple copies of data), and error correction. A RAID array is fault-tolerant: a disk fails, and reads continue without interruption.\n\nResilience means the system detects failures, contains their blast radius, and recovers to normal operation. A resilient system may briefly degrade — it accepts that failures happen — but it does not spiral into cascading failure and recovers quickly. Resilience patterns include circuit breakers (stop calling a failing dependency before it exhausts your connection pool), bulkheads (isolate failure in one pool so it doesn't drain shared resources), retries with exponential backoff and jitter (retry transient failures without hammering a struggling service), timeouts (don't hold threads waiting indefinitely), and dead letter queues (park failed messages for inspection without blocking the pipeline).\n\nMost production systems need both. Fault tolerance handles instantaneous component failures invisibly. Resilience handles sustained or partial failures gracefully. A circuit breaker (resilience) protects when a database is slow but not down; database replicas (fault tolerance) protect when the primary crashes entirely. Architects should explicitly enumerate failure modes and assign each a fault-tolerance or resilience strategy.",
    key_points: [
      "Fault tolerance: correct operation despite failure — user sees nothing",
      "Resilience: detect, contain, and recover from failure — brief degradation acceptable",
      "Redundancy + replication = fault tolerance; circuit breaker + bulkhead + DLQ = resilience",
      "Circuit breaker prevents cascade when a dependency is slow or failing",
      "Bulkhead isolates failure: one bad consumer doesn't drain the shared thread pool",
      "Retries must use backoff + jitter to avoid thundering-herd on a recovering service"
    ],
    hint: "A circuit breaker doesn't prevent the failure — what does it prevent, and why does that matter?",
    common_trap: "Using retries without backoff or circuit breakers — aggressive retries amplify load on an already-struggling service, accelerating the cascade rather than containing it.",
    follow_up_questions: [
      { text: "How does a circuit breaker work in detail?", type: "linked", links_to: "4.2.01" },
      { text: "What is the bulkhead pattern and when would you apply it?", type: "linked", links_to: "4.2.03" },
      { text: "How do dead letter queues prevent poison-pill messages from blocking a pipeline?", type: "linked", links_to: "4.3.02" }
    ],
    related: ["4.2.01", "4.2.03", "4.3.02", "3.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["fault-tolerance", "resilience", "circuit-breaker", "bulkhead", "retry", "nfr"]
  },

  {
    id: "3.3.02",
    section: 3,
    subsection: "3.3",
    level: "intermediate",
    question: "How do you design retry logic that doesn't make a struggling service worse?",
    quick_answer: "→ Exponential backoff: double the wait time on each retry (e.g. 100ms, 200ms, 400ms…)\n→ Jitter: add random delay to desynchronise retrying clients\n→ Retry budget: limit total retries (e.g. 3 attempts) and cap max wait\n→ Idempotency: only retry if the operation is safe to repeat\n→ Circuit breaker: stop retrying once failure rate crosses a threshold",
    detailed_answer: "Naive retries create a thundering-herd problem: when a service degrades, all clients retry simultaneously at fixed intervals, generating a retry storm that prevents the service from recovering. The correct design uses three mechanisms together.\n\nExponential backoff increases the wait between attempts geometrically: attempt 1 after 100ms, attempt 2 after 200ms, attempt 3 after 400ms, capped at a maximum (e.g. 30s). This reduces retry load as the failure persists, giving the downstream time to recover.\n\nJitter adds randomness to the wait: instead of exactly 200ms, each client waits 200ms ± 50ms. This desynchronises retrying clients so they don't all hit the service at the same instant. AWS recommends 'full jitter' (random between 0 and backoff_value) for maximum decorrelation.\n\nRetry budgets cap the total number of attempts and the total time spent retrying. Retries past a budget should fail fast, not queue indefinitely. At the infrastructure level, circuit breakers complement retries: once error rate crosses a threshold, the circuit opens and retries stop entirely, letting the downstream recover without continuous bombardment.\n\nIdempotency is a prerequisite for safe retries. If an operation creates a side effect (write to DB, send an email), retrying it must not create duplicates. Use idempotency keys on write APIs to enable safe retry by the caller.",
    key_points: [
      "Exponential backoff: wait doubles each retry, capped at a maximum",
      "Jitter: random delay prevents synchronised retry storms",
      "Retry budget: 3 attempts max — fail fast rather than queue forever",
      "Idempotency required: only retry safe-to-repeat operations",
      "Circuit breaker: open when failure rate is high — stop all retries",
      "Retries at multiple layers multiply load — coordinate retry policies across tiers"
    ],
    hint: "If 1,000 clients all retry at exactly 500ms after a failure — what does that look like to the recovering service?",
    common_trap: "Stacking retries at multiple layers (client → gateway → service → DB) without coordination — a single user request can trigger dozens of retry attempts hitting the downstream simultaneously.",
    follow_up_questions: [
      { text: "How does AWS SDK implement retry and backoff by default?", type: "inline", mini_answer: "AWS SDKs use exponential backoff with jitter by default (configurable). The standard retry mode retries up to 3 times on throttling and transient errors; adaptive mode adjusts retry rate based on observed success rate. DynamoDB and S3 SDKs implement this automatically." },
      { text: "What is idempotency and how do you implement it on a write endpoint?", type: "linked", links_to: "4.4.07" }
    ],
    related: ["4.2.01", "3.3.01", "4.4.07"],
    has_diagram: false,
    has_code: false,
    tags: ["retry", "backoff", "jitter", "idempotency", "resilience", "nfr"]
  },

  {
    id: "3.3.03",
    section: 3,
    subsection: "3.3",
    level: "advanced",
    question: "What is graceful degradation and how do you design it into a system?",
    quick_answer: "→ Graceful degradation: system continues serving reduced functionality when a dependency fails\n→ Identify critical vs. non-critical paths — failures on non-critical paths return defaults\n→ Use feature flags or capability checks to disable degraded features\n→ Cache last-known-good data and serve stale rather than error\n→ Shed load gracefully: return 503 with Retry-After rather than hanging\n→ Test degraded mode explicitly — it's a separate failure scenario",
    detailed_answer: "Graceful degradation means the system remains usable when non-critical dependencies fail, rather than failing completely. The first design step is classification: enumerate every external dependency (database, cache, third-party API, feature flag service) and label it as critical (failure = service down) or non-critical (failure = reduced experience). Only critical dependency failures should cause a service-level outage.\n\nFor non-critical dependencies, implement fallbacks: return cached data (even if stale), return sensible defaults, or omit the feature from the response. An e-commerce recommendation engine is non-critical — if it fails, return an empty recommendations list rather than failing the product page. A circuit breaker can automate the switch: when the dependency trips, the circuit opens and all calls immediately return the fallback without hitting the failing service.\n\nFor critical paths under extreme load, implement load shedding: actively reject excess requests with HTTP 429 or 503 rather than queuing them until memory exhausts. Return a Retry-After header so clients back off and retry at a predictable time. This is preferable to holding connections open indefinitely.\n\nGraceful degradation must be explicitly tested. Inject failures into non-critical dependencies in staging and verify the system returns the expected fallback. Many teams discover their fallback code has bugs only in real incidents. Chaos engineering tools (Chaos Monkey, Gremlin) automate this.",
    key_points: [
      "Classify dependencies: critical (outage if down) vs. non-critical (degraded if down)",
      "Fallback strategies: stale cache, sensible defaults, feature omission",
      "Circuit breaker automates the switch to fallback without code change",
      "Load shedding: reject excess requests early rather than queue until crash",
      "Return Retry-After on 503 to give clients a backoff signal",
      "Test degraded mode explicitly — fallback code often has its own bugs"
    ],
    hint: "What does your home page look like if the recommendation service is down? Is that acceptable, or would it take down the whole page?",
    common_trap: "Implementing fallbacks in code but never testing them — fallback paths are rarely exercised in normal operation and often contain bugs discovered only during incidents.",
    follow_up_questions: [
      { text: "How does a feature flag system help implement graceful degradation?", type: "inline", mini_answer: "Feature flags let you disable specific product features at runtime without deployment. When a dependency is degrading, flip the flag to disable the feature that depends on it. LaunchDarkly, Split.io, and Unleash support this. The flag service itself must be resilient — usually cached locally." },
      { text: "What is the difference between graceful degradation and circuit breaker?", type: "inline", mini_answer: "A circuit breaker is a mechanism that stops calls to a failing dependency. Graceful degradation is the design pattern of what to return instead. They work together: circuit breaker detects the failure and opens; graceful degradation defines the fallback response." }
    ],
    related: ["3.3.01", "4.2.01", "4.2.02"],
    has_diagram: false,
    has_code: false,
    tags: ["graceful-degradation", "fault-tolerance", "fallback", "load-shedding", "resilience", "nfr"]
  },

  {
    id: "3.3.04",
    section: 3,
    subsection: "3.3",
    level: "advanced",
    question: "How does a system recover from a cascading failure, and how do you prevent one from starting?",
    quick_answer: "→ Prevention: circuit breakers, bulkheads, timeouts, retry budgets, load shedding\n→ Detection: latency SLOs, error rate alerts, queue depth monitors\n→ Recovery: shed load first, restore dependencies in order (most critical first), gradually restore traffic\n→ Post-mortem: identify the trigger vs. the propagation path — fix both\n→ Blameless post-mortem: understand systemic causes, not individual mistakes",
    detailed_answer: "A cascading failure starts when one component's degradation overloads its callers, which degrade and overload their callers, until the entire system is down. The trigger is often a small event: a slow database query, a config change, a traffic spike — but the propagation reveals design weaknesses.\n\nPrevention requires defence in depth. Circuit breakers stop calls to failing dependencies before they exhaust the caller's thread pool. Bulkheads isolate thread pools and connection pools per dependency so a single slow downstream can't monopolise shared resources. Timeouts ensure no request waits indefinitely. Retry budgets and backoff prevent retry storms. Load shedding sheds non-critical traffic at the edge before it reaches downstream services.\n\nWhen a cascade has already started, recovery follows a specific sequence. First, stop the bleeding: shed excess load using rate limiting or by dropping non-critical traffic. Second, restore dependencies from the bottom up — if the database is the root cause, fix it before restarting services that depend on it. Third, restore traffic gradually (traffic ramp) rather than restoring all at once, which can re-trigger the cascade. Fourth, validate each tier before proceeding.\n\nPost-incident analysis must distinguish the trigger (what started it) from the propagation mechanism (what made it cascade). Both need fixes: the trigger to prevent recurrence, the propagation mechanism to limit blast radius next time. Blameless post-mortems focus on systemic weaknesses, not individual mistakes, and produce actionable improvements.",
    key_points: [
      "Cascades propagate when a component's failure overloads its callers",
      "Prevention: circuit breakers + bulkheads + timeouts + retry budgets + load shedding",
      "Recovery: shed load first, restore bottom-up, ramp traffic gradually",
      "Fix the trigger (cause) AND the propagation mechanism (design weakness)",
      "Post-mortems must be blameless — systemic fixes outlast individual blame",
      "Chaos engineering surfaces propagation weaknesses before real incidents"
    ],
    hint: "If you recover the database but restore all traffic at once — what might happen next?",
    common_trap: "Restoring traffic immediately after fixing the root cause — a recovering service can be re-overwhelmed instantly, re-triggering the cascade.",
    follow_up_questions: [
      { text: "What is a 'thundering herd' and how does it trigger cascades?", type: "inline", mini_answer: "Thundering herd: many clients simultaneously make requests after a delay (e.g. cache expiry, reconnect after outage). The spike can overwhelm a service that was healthy in steady state. Mitigate with jitter on reconnect timers, staggered cache expiry, and probabilistic early cache refresh." },
      { text: "How do bulkheads prevent cascades?", type: "linked", links_to: "4.2.03" }
    ],
    related: ["3.3.01", "3.3.02", "4.2.01", "4.2.03"],
    has_diagram: false,
    has_code: false,
    tags: ["cascading-failure", "resilience", "incident-response", "post-mortem", "nfr"]
  },

  // ── 3.4 Performance & Latency ─────────────────────

  {
    id: "3.4.01",
    section: 3,
    subsection: "3.4",
    level: "intermediate",
    question: "Why do architects care about p99 latency rather than average latency?",
    quick_answer: "→ Average hides outliers — a few very slow requests drag down the user experience\n→ p99 = worst-case latency experienced by 1 in 100 users\n→ At scale, 1% of users is a large number (e.g. 1,000 users/hour)\n→ Tail latency is often where bugs and resource contention hide\n→ SLOs on p99 (and p999) catch problems that average-based alerts miss",
    detailed_answer: "Average latency is a deeply misleading metric in distributed systems. A service with average latency of 50ms might have p99 of 2,000ms — meaning 1% of requests wait 40× longer than the average. Users experiencing that tail are likely to abandon, retry, or report the service as broken.\n\nAt scale, 1% is not a rounding error. At 100,000 requests per hour, p99 latency affects 1,000 users every hour. For services with chained dependencies — API → service A → service B → DB — each hop's p99 compounds: if each of three hops has 99% chance of being fast, only 97% of end-to-end requests are fast (0.99^3). The end-to-end tail is always worse than any individual hop.\n\nTail latency often hides specific failure modes: GC pauses, lock contention, cold-start paths, network retransmissions, or slow database queries triggered by unusual data. Profiling p99 latency directly targets these pathological cases.\n\nFor SLO design, choose percentiles that reflect the worst user experience that matters: p99 for interactive APIs, p999 for financial transactions. Avoid mean/average in SLOs — they can be satisfied even when 10% of users are severely impacted. Tools like Prometheus histograms and Datadog distributions expose arbitrary percentiles efficiently without storing every data point.",
    key_points: [
      "Average latency masks tail: p99 reveals worst-case user experience",
      "1% of users is large at scale — tail latency affects real users",
      "Chained services: end-to-end tail = compound of each hop's tail",
      "Tail latency reveals GC, lock contention, cold paths — average does not",
      "SLOs should be on p99 or p999, not mean",
      "Prometheus histograms and Datadog distributions compute percentiles efficiently"
    ],
    hint: "If your average latency looks fine but 1 in 100 API calls takes 5 seconds, will your average-based alert ever fire?",
    common_trap: "Alerting on average latency — alerts can stay green while thousands of users per hour experience 5-second response times.",
    follow_up_questions: [
      { text: "What causes tail latency in distributed systems specifically?", type: "inline", mini_answer: "Common causes: GC pauses (Java/Go stop-the-world), lock contention (shared mutexes), head-of-line blocking (HTTP/1.1 keep-alive), cold paths (code run rarely = not JIT-compiled), network retransmissions (TCP), and background maintenance (compaction in LSM-tree stores like Cassandra)." },
      { text: "How do you reduce tail latency without rewriting the entire service?", type: "inline", mini_answer: "Hedged requests: send the same request to two replicas and take the first response — cuts tail by 10–100×. Speculative execution: if the primary doesn't respond within threshold, send to a second. Background keep-alive pings to avoid cold connections. Reduce GC pressure. Tune thread pool sizes using Little's Law." }
    ],
    related: ["3.4.02", "3.1.04", "3.6.01"],
    has_diagram: false,
    has_code: false,
    tags: ["latency", "p99", "tail-latency", "SLO", "performance", "nfr"]
  },

  {
    id: "3.4.02",
    section: 3,
    subsection: "3.4",
    level: "intermediate",
    question: "What is the difference between latency and throughput, and how do you optimise each?",
    quick_answer: "→ Latency: time to complete a single operation (ms)\n→ Throughput: operations completed per unit time (RPS, TPS)\n→ Optimising latency: remove serial waits, reduce data size, add caching, run work in parallel\n→ Optimising throughput: batch operations, async processing, increase concurrency, partition\n→ There is a fundamental tension — high throughput often increases latency under saturation",
    detailed_answer: "Latency is the time elapsed from request to response for a single operation. Throughput is the rate of operations the system completes per second across all concurrent callers. They are related but distinct, and optimising one can harm the other.\n\nLatency is reduced by eliminating serial waiting: parallel fan-out instead of sequential calls, caching to avoid round trips, reducing payload sizes, and placing computation closer to the user (CDN, edge). Latency is also affected by queueing time — at high utilisation, requests wait in queues before being processed, adding latency even if processing itself is fast.\n\nThroughput is increased by batching (amortise per-request overhead across many items), async processing (decouple fast producers from slower consumers), increasing concurrency (more threads, more replicas), and partitioning (spread work across independent shards or workers that don't contend).\n\nThe fundamental tension: as throughput approaches the saturation point, queues build and latency rises rapidly (this is the hockey-stick curve from queueing theory). Systems are often latency-optimised at low utilisation and become throughput-constrained under load. Architects must decide which metric is primary for each use case: interactive APIs prioritise latency; batch pipelines prioritise throughput.",
    key_points: [
      "Latency = time per single request; throughput = requests per second across all callers",
      "Optimising latency: parallelise, cache, reduce payload, move computation closer",
      "Optimising throughput: batch, async, parallelise, partition",
      "Under high utilisation, queuing adds latency even if processing is fast",
      "Near saturation, latency rises sharply (hockey-stick curve)",
      "Choose the primary metric for each use case — they cannot both be maximised simultaneously"
    ],
    hint: "A batch job that processes 1 million records efficiently — is it optimised for latency or throughput? What would it look like if you optimised for the other?",
    common_trap: "Optimising throughput metrics (records/second) for a user-facing API, then being surprised that p99 latency is high even though the system handles high load.",
    follow_up_questions: [
      { text: "What is the Universal Scalability Law and how does it refine Amdahl's Law?", type: "inline", mini_answer: "Amdahl's Law models speedup from parallelism, ignoring coordination cost. USL (Gunther) adds coherency penalty — the cost of keeping parallel workers in sync. It predicts that throughput peaks and then declines as you add workers, due to the quadratic contention term. Use USL to predict the optimal concurrency level." },
      { text: "When would you choose async processing over synchronous request handling to improve throughput?", type: "linked", links_to: "4.3.01" }
    ],
    related: ["3.4.01", "3.1.04", "4.3.01"],
    has_diagram: false,
    has_code: false,
    tags: ["latency", "throughput", "performance", "queueing-theory", "nfr"]
  },

  {
    id: "3.4.03",
    section: 3,
    subsection: "3.4",
    level: "advanced",
    question: "How do you identify and fix a performance bottleneck in a distributed system?",
    quick_answer: "→ Profile end-to-end: distributed tracing (Jaeger/Tempo) to find where latency accumulates\n→ Isolate the bottleneck: compare latency at each hop — the biggest contributor is the target\n→ Classify: CPU-bound, I/O-bound, lock contention, or serialisation overhead\n→ Fix per class: CPU → parallelise or optimise algorithm; I/O → cache, batch, or async; lock → partition or CAS\n→ Validate fix with load test — not just synthetic benchmark",
    detailed_answer: "Performance bottleneck investigation in a distributed system requires layered tooling. Start with distributed tracing: each trace records end-to-end latency broken down by service and span. Identify the span with the largest contribution to p99 latency — that is the bottleneck's location. Flamegraphs show CPU usage within a single service; distributed traces show which service in the chain is the constraint.\n\nOnce the bottleneck is localised, classify it. CPU-bound bottlenecks show high CPU utilisation and are fixed by algorithmic optimisation, JIT tuning, or horizontal scaling (more cores). I/O-bound bottlenecks show threads waiting on disk or network — fixed by caching, batching requests, or using async I/O. Lock contention shows threads in BLOCKED state — fixed by partitioning the shared resource, reducing lock scope, or using compare-and-swap. Serialisation overhead (JSON marshalling at high RPS) is fixed by choosing a binary format or reducing payload size.\n\nCommon traps: 'fixing' a symptom rather than the bottleneck (adding more API servers when the database is the constraint), benchmarking the optimised component in isolation without validating end-to-end improvement, and assuming the bottleneck doesn't move — after you fix one bottleneck, the next-slowest component becomes the new bottleneck (Amdahl's Law).\n\nAlways validate with a load test against realistic traffic patterns. Benchmarks on a single machine or with synthetic data routinely fail to reproduce production behaviour.",
    key_points: [
      "Distributed tracing reveals which span dominates latency — start there",
      "Classify before fixing: CPU, I/O, lock, or serialisation — different remedies",
      "CPU-bound: parallelise or optimise; I/O-bound: cache/async/batch; lock: partition/CAS",
      "After fixing one bottleneck, the next slowest becomes the new one (Amdahl's shift)",
      "Validate with load test against realistic patterns — not synthetic microbenchmarks",
      "Profile in production or production-like staging — lab benchmarks lie"
    ],
    hint: "You double the API server count and latency doesn't improve. What does that tell you about where the bottleneck is?",
    common_trap: "Adding more application servers when the database is the bottleneck — more servers increase DB connection pool pressure without reducing latency, and may make things worse.",
    follow_up_questions: [
      { text: "What is a flamegraph and what does it reveal?", type: "inline", mini_answer: "A flamegraph shows CPU time spent in each function call stack, aggregated across many samples. Wide bars = high CPU cost. It reveals hot code paths — functions consuming most CPU — without requiring manual instrumentation. Generated from perf (Linux), async-profiler (Java), or py-spy (Python)." },
      { text: "How do you attribute latency cost in a microservices call chain?", type: "inline", mini_answer: "Use distributed tracing (OpenTelemetry → Jaeger/Tempo). Each service propagates trace context via HTTP headers. The trace UI shows a waterfall of spans with start time and duration. Gaps between spans reveal serialisation, network, or scheduling overhead not attributed to any service." }
    ],
    related: ["3.4.01", "3.4.02", "3.6.01"],
    has_diagram: false,
    has_code: false,
    tags: ["performance", "bottleneck", "distributed-tracing", "profiling", "nfr"]
  },

  // ── 3.5 Security Requirements ─────────────────────

  {
    id: "3.5.01",
    section: 3,
    subsection: "3.5",
    level: "intermediate",
    question: "What is the difference between Section 3.5 security requirements and Section 7 security architecture?",
    quick_answer: "→ 3.5 = security acceptance criteria: what the system must guarantee (NFRs)\n→ Section 7 = security design: how those guarantees are implemented\n→ 3.5 defines: data classification, access control requirements, audit trail requirements, encryption at rest/transit mandates\n→ Section 7 defines: OAuth flow, JWT strategy, zero trust implementation, secrets vaulting\n→ Requirements first, then architecture — 3.5 drives 7",
    detailed_answer: "Section 3.5 is about eliciting and formalising security as a non-functional requirement — the 'what must be true' before the system can be declared secure. This includes: classifying data sensitivity (PII, PCI, HIPAA), defining access control requirements (who can read/write what), specifying audit trail requirements (what must be logged, for how long, tamper-evident?), mandating encryption standards (TLS 1.2+, AES-256 at rest), defining regulatory compliance requirements (GDPR, SOC2, ISO 27001), and setting vulnerability management expectations (pen test frequency, CVE response SLA).\n\nSection 7 then answers 'how' — the concrete security architecture decisions: which OAuth2 flow to use, how to implement JWT validation, how zero trust is applied to service-to-service calls, how secrets are vaulted with HashiCorp Vault, how network segmentation is configured.\n\nThe distinction matters because stakeholders participate differently. Business, legal, and compliance teams define Section 3.5 requirements. Security engineers and architects define Section 7 implementation. Confusing the two leads to either over-engineering (architecting security without defined requirements) or under-engineering (deploying systems without explicit security requirements). Requirements also drive architecture review: you check the architecture against the NFRs to verify they are met.",
    key_points: [
      "3.5 = security NFRs: what guarantees the system must provide",
      "Section 7 = security architecture: how those guarantees are implemented",
      "NFRs defined by: business, legal, compliance stakeholders",
      "Architecture defined by: security engineers, architects",
      "Data classification drives security requirements — start there",
      "Architecture review checks design satisfies NFRs"
    ],
    hint: "'We need OAuth2 with PKCE' — is that an NFR or an architecture decision? Who would you involve to answer that?",
    common_trap: "Writing security architecture (OAuth2 flow, JWT strategy) before eliciting security requirements — the architecture may be technically sound but fail to meet regulatory or business requirements.",
    follow_up_questions: [
      { text: "How do you translate GDPR compliance into concrete security NFRs?", type: "inline", mini_answer: "GDPR → NFRs: (1) Data minimisation: only collect fields you process; (2) Right to erasure: ability to purge PII within 30 days; (3) Data portability: export user data in machine-readable format; (4) Breach notification: detect and report breaches within 72h; (5) Consent tracking: log consent with timestamp and version." },
      { text: "What is data classification and why does it drive other security requirements?", type: "inline", mini_answer: "Data classification assigns a sensitivity tier (public, internal, confidential, restricted/PII) to each data type. The tier drives: encryption standard (confidential → AES-256), access control model (restricted → need-to-know RBAC), audit logging level (PII → every access logged), and retention policy (regulated → minimum 7 years)." }
    ],
    related: ["7.1.01", "7.8.01", "3.5.02"],
    has_diagram: false,
    has_code: false,
    tags: ["security-requirements", "NFR", "data-classification", "compliance", "GDPR"]
  },

  {
    id: "3.5.02",
    section: 3,
    subsection: "3.5",
    level: "intermediate",
    question: "How do you define and enforce authentication and authorisation requirements at the NFR level?",
    quick_answer: "→ Authentication NFR: who must prove identity, and how strongly (password, MFA, certificate)\n→ Authorisation NFR: what each role can do — RBAC matrix or policy definition\n→ Specify: session duration, token lifetime, MFA triggers, service-to-service auth method\n→ Enforce: automated threat modelling, API contract linting, security unit tests\n→ Review: architecture review checks implementation satisfies the stated NFRs",
    detailed_answer: "Authentication and authorisation requirements must be explicit NFRs, not assumptions left to developers. Authentication NFRs specify: who must authenticate (all users, or also service accounts?), what credential strength is required (password + MFA for internal users, certificate for services), how sessions are managed (duration, re-authentication triggers for sensitive operations), and what the account lockout policy is.\n\nAuthorisation NFRs specify: the access control model (RBAC, ABAC, ReBAC), the role hierarchy and what each role permits, data-level controls (row-level security for multi-tenant data, field masking for sensitive attributes), and audit requirements (who accessed what, when, from where — tamper-evident log).\n\nThese NFRs feed directly into the Section 7 architecture decisions: the auth NFR 'service-to-service calls must use short-lived certificates' drives the choice of mTLS or SPIFFE/SPIRE. The NFR 'all PII access must be audit-logged with user identity' drives the logging architecture.\n\nEnforcement mechanisms include: threat modelling against the NFRs (every threat has a mitigating control), API contract linting (OpenAPI specs include security scheme definitions), automated security tests (verify endpoints return 403 for unauthorised roles), and architecture review checkpoints where the design is verified against stated requirements.",
    key_points: [
      "Authentication NFR: who, how strongly, session duration, MFA triggers",
      "Authorisation NFR: RBAC/ABAC model, role matrix, data-level controls",
      "NFRs drive Section 7 architecture choices — requirements first",
      "Audit trail is an NFR: what is logged, how long, tamper-evident",
      "Verify NFR satisfaction: threat modelling, API linting, security unit tests",
      "Multi-tenant systems need row-level security or separate data stores as an NFR"
    ],
    hint: "If a developer asks 'do I need to log this data access?' — what document or artefact in your design process should give them the answer?",
    common_trap: "Leaving authentication and authorisation decisions to individual developers — different teams implement inconsistent controls, creating security gaps at the boundaries.",
    follow_up_questions: [
      { text: "How does role-based access control (RBAC) differ from attribute-based (ABAC)?", type: "linked", links_to: "7.1.02" },
      { text: "What is a threat model and how does it verify NFR coverage?", type: "linked", links_to: "7.7.01" }
    ],
    related: ["7.1.01", "7.1.02", "7.7.01", "3.5.01"],
    has_diagram: false,
    has_code: false,
    tags: ["authentication", "authorisation", "RBAC", "security-requirements", "NFR"]
  },

  {
    id: "3.5.03",
    section: 3,
    subsection: "3.5",
    level: "advanced",
    question: "How do you define encryption requirements — at rest, in transit, and in use — as concrete NFRs?",
    quick_answer: "→ In transit: TLS 1.2+ minimum, TLS 1.3 preferred; mTLS for service-to-service\n→ At rest: AES-256 for sensitive/regulated data; key management via KMS (AWS/GCP/Vault)\n→ In use (confidential computing): TEE/SGX for processing PII without exposing it to the host\n→ Specify: key rotation cadence, HSM requirement for regulated data, cipher suite restrictions\n→ Regulatory mapping: PCI DSS, HIPAA, FIPS 140-2 — each has explicit cipher requirements",
    detailed_answer: "Encryption requirements split into three categories. In-transit encryption (data moving between components) must specify: minimum TLS version (TLS 1.2+ with TLS 1.3 preferred; TLS 1.0/1.1 prohibited), cipher suite restrictions (disable RC4, DES, MD5; require forward secrecy), and whether mutual TLS (mTLS) is required for internal service-to-service traffic.\n\nAt-rest encryption (data stored on disk) must specify: the algorithm and key length (AES-256-GCM for regulated data), key management approach (cloud KMS, HashiCorp Vault, or on-premises HSM for regulated workloads), key rotation cadence (annual minimum for most standards, quarterly for PCI), and which data tiers require encryption (all, or sensitive fields only — the latter is field-level encryption).\n\nIn-use encryption (confidential computing) is an emerging requirement for processing regulated PII without exposing it to the compute host — implemented via Intel SGX enclaves or ARM TrustZone. It is required in some regulated industries (healthcare, finance) where cloud providers cannot be fully trusted with raw data.\n\nRegulatory frameworks map directly to requirements: FIPS 140-2 specifies approved algorithms and key management modules; PCI DSS 4.0 mandates TLS 1.2+ and prohibits older versions; HIPAA requires encryption of PHI both at rest and in transit. These regulatory mappings translate compliance obligations into concrete NFRs for the architecture.",
    key_points: [
      "In transit: TLS 1.2+ minimum, TLS 1.3 preferred, mTLS for internal service mesh",
      "At rest: AES-256-GCM, key management via KMS or Vault, annual key rotation minimum",
      "In use: TEE/SGX for confidential computing with untrusted hosts",
      "FIPS 140-2 specifies approved algorithms for regulated environments",
      "PCI DSS 4.0: TLS 1.2+ mandatory, TLS 1.0/1.1 prohibited",
      "Key rotation cadence and HSM requirements are separate NFRs, not implementation details"
    ],
    hint: "If you encrypt data at rest with AES-256 but the encryption key is stored in the same database — what is the effective encryption strength?",
    common_trap: "Specifying encryption algorithm but not key management — the security of AES-256 is entirely dependent on the security of the key; a key stored alongside the encrypted data provides no real protection.",
    follow_up_questions: [
      { text: "What is field-level encryption and when would you use it instead of full-database encryption?", type: "inline", mini_answer: "Field-level encryption encrypts individual columns (e.g. SSN, credit card) rather than the whole disk/database. Use it when: only specific fields are regulated (encrypt those, leave the rest queryable), when different fields need different key holders, or when you need to share a record while hiding sensitive fields. AWS DynamoDB, MongoDB, and application-level libraries (Google Tink) support it." },
      { text: "How do cloud KMS services handle key rotation without re-encrypting all data?", type: "inline", mini_answer: "Cloud KMS (AWS KMS, GCP Cloud KMS) uses envelope encryption: a data encryption key (DEK) encrypts the data; the key encryption key (KEK) in KMS encrypts the DEK. On rotation, only the KEK changes — the DEK is re-encrypted with the new KEK. Data is not re-encrypted, only the key wrapper changes." }
    ],
    related: ["7.8.01", "7.8.02", "7.5.01", "3.5.01"],
    has_diagram: false,
    has_code: false,
    tags: ["encryption", "TLS", "at-rest", "in-transit", "KMS", "FIPS", "security-requirements", "NFR"]
  },

  // ── 3.6 Observability Requirements ───────────────

  {
    id: "3.6.01",
    section: 3,
    subsection: "3.6",
    level: "intermediate",
    question: "What are the three pillars of observability and what does each tell you?",
    quick_answer: "→ Metrics: aggregated numeric measurements over time — shows trends and triggers alerts\n→ Logs: timestamped event records — shows what happened and why\n→ Traces: end-to-end request journey across services — shows where latency accumulates\n→ Metrics alert you, logs explain the alert, traces localise the problem\n→ Together they answer: is something wrong? what happened? where is it?",
    detailed_answer: "The three pillars of observability provide complementary visibility into a system's behaviour.\n\nMetrics are numerical measurements aggregated over time: request rate, error rate, latency percentiles, CPU utilisation, queue depth. They are low-cardinality, high-volume, and cheap to store. Metrics are the primary alerting signal — a p99 latency SLO breach triggers a PagerDuty alert. They show trends (error rate rising over the past 10 minutes) but not the cause.\n\nLogs are structured or unstructured event records with timestamps: a payment rejected, an exception stack trace, a user action. They are high-cardinality, variable-volume, and expensive to store at scale. Logs explain what happened — the specific error message, request parameters, and stack trace that reveal the cause of an anomaly. Modern systems use structured logs (JSON) to enable filtering and aggregation.\n\nTraces record the path of a single request across multiple services: a trace is composed of spans, each representing work in one service. Distributed tracing (OpenTelemetry, Jaeger, Tempo) reveals where latency accumulates in a service graph. Traces are sampled (not every request is traced) to manage cost.\n\nObservability NFRs must specify what is required from each pillar: which metrics must be exposed (RED: rate, error rate, duration — or USE: utilisation, saturation, errors), log retention periods (30 days hot, 1 year cold for regulated systems), sampling rates for traces, and the tooling to be used (Prometheus + Grafana, Datadog, OpenTelemetry collector).",
    key_points: [
      "Metrics: aggregated numbers over time — trends, SLO monitoring, alerting",
      "Logs: event records — explain what happened and why",
      "Traces: end-to-end request path — localise latency and error in the call graph",
      "RED (Rate/Error/Duration) and USE (Utilisation/Saturation/Errors) are standard metric frameworks",
      "OpenTelemetry is the vendor-neutral standard for all three signals",
      "Observability is an NFR — specify it as retention, sampling, and tooling requirements"
    ],
    hint: "Your alert fires — p99 latency is up. What does the metric tell you, and what do you need next to find the cause?",
    common_trap: "Treating logs as the only observability tool — logs can be high-volume and expensive to search, and they don't give the aggregated trend view that metrics provide, nor the end-to-end latency breakdown that traces give.",
    follow_up_questions: [
      { text: "What is OpenTelemetry and why has it become the default choice?", type: "inline", mini_answer: "OpenTelemetry is a CNCF project providing a vendor-neutral API and SDK for metrics, logs, and traces. Instrument once, export to any backend (Jaeger, Prometheus, Datadog, Honeycomb). It prevents vendor lock-in and unifies instrumentation across polyglot services. It is now the dominant choice for new systems." },
      { text: "How do you define observability requirements for a regulated system?", type: "inline", mini_answer: "Regulated systems need: audit log retention (7 years for finance, HIPAA minimum 6 years), tamper-evident logs (immutable storage, WORM), alerting on security events (failed auth, privilege escalation), and availability of logs to auditors. These are compliance-driven NFRs, not optional." }
    ],
    related: ["3.6.02", "3.4.01", "3.2.02"],
    has_diagram: false,
    has_code: false,
    tags: ["observability", "metrics", "logs", "traces", "OpenTelemetry", "nfr"]
  },

  {
    id: "3.6.02",
    section: 3,
    subsection: "3.6",
    level: "intermediate",
    question: "What is the difference between monitoring and observability?",
    quick_answer: "→ Monitoring: watching known failure modes — predefined dashboards and alerts\n→ Observability: ability to understand any system state by querying it — even unknown failure modes\n→ Monitoring: you know what questions to ask in advance\n→ Observability: you can ask new questions when something unexpected happens\n→ Both are needed: monitoring for fast alerting, observability for investigation",
    detailed_answer: "Monitoring is the practice of tracking predefined metrics against thresholds: 'alert when CPU > 80%' or 'alert when error rate > 1%'. It is reactive to known failure modes and relies on dashboards you configured when you built the system. Monitoring answers: 'is the system behaving as expected?' — but only for the dimensions you anticipated.\n\nObservability is a property of the system that enables you to understand its internal state from external outputs (metrics, logs, traces). An observable system lets you ask arbitrary new questions about its behaviour without deploying new instrumentation — because it emits rich, structured data by default. When an unexpected failure occurs, observability lets you investigate by slicing and dicing available data, rather than being limited to pre-built dashboards.\n\nThe classic framing (from Charity Majors): 'Monitoring tells you when something is wrong. Observability tells you why.' In practice, monitoring provides the fast alert (low latency to detection); observability provides the tools to investigate (low latency to diagnosis).\n\nAs systems grow in complexity — microservices, polyglot stacks, dynamic infrastructure — predefined monitoring becomes insufficient because the failure space grows faster than dashboards can be written. High-cardinality observability (trace-per-request, structured logs with arbitrary tags) becomes the dominant tool for diagnosing production issues. OpenTelemetry + a queryable backend (Honeycomb, Datadog, Grafana Tempo) is the modern approach.",
    key_points: [
      "Monitoring: predefined questions asked continuously — alerts on known failure modes",
      "Observability: arbitrary question-asking from rich system outputs — unknown failures",
      "Monitoring = fast alert; observability = fast diagnosis",
      "Observable systems emit structured, high-cardinality data by default",
      "Monitoring requires knowing failure modes in advance; observability does not",
      "Both are needed — monitoring is cheap to alert; observability is powerful to diagnose"
    ],
    hint: "You get an alert at 3 AM for an error you've never seen before. Which tool helps you understand what's happening — monitoring or observability?",
    common_trap: "Treating observability as just 'more dashboards' — true observability requires high-cardinality structured data that can be queried dynamically, not just more pre-built charts.",
    follow_up_questions: [
      { text: "What is high cardinality and why does it matter for observability?", type: "inline", mini_answer: "High cardinality means a dimension has many unique values (user_id, request_id, pod_name). High-cardinality data lets you slice by any user or request to investigate a specific failure. Prometheus struggles with high-cardinality labels (tag explosion); purpose-built observability tools like Honeycomb handle it natively." },
      { text: "How do you implement SLO monitoring using the three pillars?", type: "inline", mini_answer: "Define SLIs as metrics (Prometheus counters for success/total requests). Calculate error rate and compare against SLO target. Alert when error budget burn rate exceeds threshold (e.g. 5% burned in 1h). Use traces to investigate SLO breaches, and logs for per-request forensics." }
    ],
    related: ["3.6.01", "3.2.02", "6.8.01"],
    has_diagram: false,
    has_code: false,
    tags: ["observability", "monitoring", "SLO", "high-cardinality", "nfr"]
  },

  {
    id: "3.6.03",
    section: 3,
    subsection: "3.6",
    level: "advanced",
    question: "How do you define and implement an alerting strategy that minimises alert fatigue?",
    quick_answer: "→ Alert on symptoms, not causes — user-facing impact, not internal metrics\n→ Use multi-window, multi-burn-rate alerts for SLO monitoring\n→ Every alert must be actionable: link to runbook, have a clear response\n→ Route by severity: P1 → on-call, P2 → next business day, P3 → Slack\n→ Audit alerts quarterly: remove any that fire without action consistently",
    detailed_answer: "Alert fatigue occurs when on-call engineers receive so many alerts that they start ignoring them — including the critical ones. It is caused by symptom-less alerts (CPU > 80% doesn't tell you a user is affected), low-specificity alerts (fires too often, resolved itself), and alerts with no clear action (engineer can't do anything about it at 3 AM).\n\nThe solution starts with alerting on symptoms, not causes. 'Error rate on checkout endpoint > 1%' is a symptom — a user is experiencing failures. 'Database CPU > 70%' is a cause — it might not be affecting users yet. Symptom-based alerts fire only when users are affected.\n\nFor SLO-based systems, use multi-window, multi-burn-rate alerts (from the Google SRE Workbook). A burn rate of 14.4× over 1 hour means the error budget will be exhausted in 5 days — this warrants a page. A burn rate of 1× over 6 hours just means you're on track to use your entire budget this month — this warrants a ticket. Different burn rates map to different severities and routing.\n\nEvery alert must be actionable: it should have a runbook link, a clear description of what is happening, and a defined first response. Alerts that don't have clear actions should be converted to informational dashboards or removed. Implement an alert audit process: quarterly, review every alert that fired. If the response was 'acknowledged and ignored,' remove the alert.",
    key_points: [
      "Alert on symptoms (user impact), not causes (internal metrics)",
      "Multi-burn-rate SLO alerts: different rates = different severities and routing",
      "Every alert: actionable, runbook-linked, with defined first response",
      "Route by severity: page for P1, ticket for P2, log for P3",
      "Quarterly audit: remove alerts consistently acknowledged without action",
      "Fewer, high-quality alerts beats many low-quality alerts — on-call trust is the goal"
    ],
    hint: "If your on-call engineer acknowledges the same alert every Tuesday morning without doing anything — what should you do with that alert?",
    common_trap: "Alerting on every metric threshold 'just in case' — this creates hundreds of low-signal alerts, engineers learn to ignore them, and real P1 incidents get missed.",
    follow_up_questions: [
      { text: "What is a burn rate alert and how does it give earlier warning than threshold alerts?", type: "inline", mini_answer: "Burn rate = ratio of current error rate to SLO error rate target. A 14.4× burn rate means the error budget is consumed 14.4× faster than sustainable — you will exhaust it in 5 days. Burn rate alerts fire earlier than threshold alerts because they detect fast budget consumption before the SLO is breached." },
      { text: "How do you write a good runbook?", type: "inline", mini_answer: "A good runbook: (1) describes the symptom and its user impact; (2) lists the first diagnostic commands with expected output; (3) provides a decision tree for common causes; (4) documents the escalation path; (5) is tested by the on-call team. Bad runbooks say 'check logs' without specifying which logs or what to look for." }
    ],
    related: ["3.6.01", "3.6.02", "3.2.02"],
    has_diagram: false,
    has_code: false,
    tags: ["alerting", "alert-fatigue", "SLO", "burn-rate", "on-call", "observability", "nfr"]
  },

  // ── 3.7 Disaster Recovery ─────────────────────────

  {
    id: "3.7.01",
    section: 3,
    subsection: "3.7",
    level: "intermediate",
    question: "What is the difference between RPO and RTO, and how do they drive your disaster recovery architecture?",
    quick_answer: "→ RPO (Recovery Point Objective): maximum data loss tolerated — 'how old can recovered data be?'\n→ RTO (Recovery Time Objective): maximum downtime tolerated — 'how long to restore service?'\n→ Tighter RPO → more frequent backups or synchronous replication\n→ Tighter RTO → standby environments, automated failover, pre-warmed replicas\n→ Cost scales steeply as RPO/RTO approach zero — justify the business cost",
    detailed_answer: "RPO and RTO are the two axes of disaster recovery requirements. RPO (Recovery Point Objective) defines how much data loss is acceptable: 'we can tolerate losing up to 1 hour of data.' RTO (Recovery Time Objective) defines how long the system can be down: 'we must restore service within 4 hours.' Both are business requirements, derived from the financial cost of data loss or downtime — not technical defaults.\n\nRPO drives the backup and replication strategy. A 24-hour RPO allows daily backups to S3. A 1-hour RPO requires either continuous backup (WAL shipping) or near-synchronous replication to a standby. An RPO of near-zero requires synchronous multi-region replication, which introduces write latency and is expensive.\n\nRTO drives the recovery infrastructure. A 24-hour RTO allows restoring from backup — slow but cheap. A 1-hour RTO requires a warm standby (pre-provisioned environment that can take traffic after data catch-up). A 15-minute RTO requires a hot standby (fully replicated, receives live traffic replication, failover is DNS or load balancer flip). An RTO of minutes requires active-active multi-region.\n\nDR architecture patterns map directly: backup and restore (cheapest, highest RPO/RTO), pilot light (critical systems warm, rest cold), warm standby (scaled-down production running), and active-active (zero RPO/RTO, highest cost). The choice must be justified by the cost of downtime vs. the cost of the DR infrastructure.",
    key_points: [
      "RPO = data loss tolerance; RTO = downtime tolerance",
      "Both are business requirements — derive from cost of downtime, not technical convention",
      "Tighter RPO: more frequent backup, synchronous replication",
      "Tighter RTO: hot/warm standby, automated failover, pre-warmed compute",
      "DR patterns by cost: backup/restore < pilot light < warm standby < active-active",
      "Test DR regularly — untested DR plans fail in real disasters"
    ],
    hint: "A business says 'we can't lose any transactions.' What RPO is that, and what architecture does it force you towards?",
    common_trap: "Setting RPO/RTO targets based on technical convention rather than business cost analysis — 'we should have 1-hour RPO' without knowing if the business would accept 24-hour to save significant infrastructure cost.",
    follow_up_questions: [
      { text: "What is the difference between a hot standby and a warm standby?", type: "inline", mini_answer: "Hot standby: fully provisioned, running, receiving live replication — failover is a DNS/LB flip in seconds. Warm standby: running at reduced capacity, receiving replication — requires scaling up and validation before traffic, taking minutes to hours. Hot costs more (full duplicate infra running 24/7)." },
      { text: "How do you test a disaster recovery plan without causing an actual disaster?", type: "inline", mini_answer: "Use a separate DR drill environment. Restore from backup to an isolated VPC/project and verify the application starts and data integrity checks pass. For active-passive DR, periodically do a planned failover during a low-traffic window. Document the actual RTO achieved — it is almost always longer than the design target." }
    ],
    related: ["3.7.02", "3.2.01", "2.6.04"],
    has_diagram: false,
    has_code: false,
    tags: ["disaster-recovery", "RPO", "RTO", "backup", "failover", "nfr"]
  },

  {
    id: "3.7.02",
    section: 3,
    subsection: "3.7",
    level: "intermediate",
    question: "What are the four DR strategies (backup/restore, pilot light, warm standby, active-active) and when do you choose each?",
    quick_answer: "→ Backup/restore: cheapest, RPO hours-days, RTO hours-days — dev/test or non-critical\n→ Pilot light: core infra warm, data replicated, RPO minutes, RTO 1-4h — moderate criticality\n→ Warm standby: scaled-down prod running, RPO seconds-minutes, RTO minutes — business-critical\n→ Active-active: full prod in 2+ regions, RPO ~0, RTO ~0 — mission-critical revenue systems\n→ Cost increases steeply at each tier — justify with cost of downtime",
    detailed_answer: "The four DR strategies represent different points on the cost-vs-recovery curve.\n\nBackup and restore: data is backed up to durable storage (S3 Glacier) on a schedule. Recovery requires provisioning infrastructure, restoring backups, and validating. RPO equals the backup frequency (24h daily backup = up to 24h data loss). RTO is hours or days. Cost is very low — pay only for backup storage. Appropriate for development systems, non-customer-facing tools, or systems where hours of downtime are acceptable.\n\nPilot light: a minimal version of the critical infrastructure runs continuously in the DR region (database replicating, core services configured but stopped). On disaster, scale up and redirect traffic. RPO is minutes (replication lag). RTO is 1–4 hours (start and warm the application tier). Cost is low — only the database and network run continuously.\n\nWarm standby: a scaled-down but fully functional replica of production runs continuously, receiving live replication. On disaster, scale up and flip traffic. RPO is seconds to minutes. RTO is minutes to 30 minutes. Cost is moderate — running a smaller version of production continuously.\n\nActive-active: multiple full-scale production environments in multiple regions, each serving live traffic. Failover is a load balancer or DNS weight change. RPO is near-zero; RTO is seconds. Cost is the highest — you run full production twice (or more). Required for mission-critical, revenue-generating systems where any downtime causes immediate financial loss.",
    key_points: [
      "Backup/restore: lowest cost, highest RPO/RTO — non-critical systems",
      "Pilot light: minimal infra warm, scale on disaster — moderate cost, hours RTO",
      "Warm standby: scaled-down prod running — minutes RTO, moderate cost",
      "Active-active: full prod multi-region — near-zero RPO/RTO, highest cost",
      "Choose based on cost of downtime vs. cost of DR infrastructure",
      "Each tier reduces RTO by having progressively more pre-provisioned infrastructure"
    ],
    hint: "A payment processing system loses £100,000 per minute of downtime. Which DR tier can you justify? Which can you not afford NOT to choose?",
    common_trap: "Choosing active-active for all systems without cost analysis — the infrastructure cost of active-active for non-critical internal tools is waste that could fund actual reliability improvements on critical systems.",
    follow_up_questions: [
      { text: "How does active-active multi-region handle write conflicts between regions?", type: "linked", links_to: "2.6.05" },
      { text: "What is the role of DNS failover in DR?", type: "inline", mini_answer: "Route 53 (AWS) or Cloud DNS health checks detect primary region failure and reroute DNS to the DR region. TTL must be set low (60s) before an incident for fast propagation — low TTL is expensive in API calls, so some systems use DNS record pre-warming. Anycast routing (used by Cloudflare) eliminates DNS failover latency entirely." }
    ],
    related: ["3.7.01", "2.6.05", "5.6.01"],
    has_diagram: false,
    has_code: false,
    tags: ["disaster-recovery", "active-active", "warm-standby", "pilot-light", "RPO", "RTO", "nfr"]
  },

  {
    id: "3.7.03",
    section: 3,
    subsection: "3.7",
    level: "advanced",
    question: "How do you ensure your disaster recovery plan actually works when needed?",
    quick_answer: "→ Test regularly — DR untested is DR that will fail when needed\n→ Annual planned failover drill: actually redirect traffic, measure real RTO\n→ Automated recovery validation: runbooks as code, not PDFs\n→ Chaos engineering: inject failures in production to validate detection and recovery\n→ Post-drill retrospective: document actual RPO/RTO vs. targets — close the gap",
    detailed_answer: "A DR plan that is never tested is not a DR plan — it is a hope. The most common failure mode in disaster recovery is discovering the plan is broken during an actual disaster. The root causes are: backups are corrupted or incomplete, recovery scripts rely on dependencies that no longer exist, the team that wrote the runbook has left, or the RTO target was set based on theory rather than actual measurement.\n\nThe gold standard is an annual planned failover drill: actually switch production traffic to the DR region, let it run for a period, then switch back. This is the only way to measure the actual RTO (time to redirect traffic and validate correctness) and RPO (data loss from replication lag at failover time). Most teams discover their actual RTO is 3–5× their target.\n\nAutomate recovery procedures rather than relying on runbooks as PDFs. Runbook automation (Ansible playbooks, AWS Systems Manager documents, Terraform apply) is executable, version-controlled, and doesn't depend on human memory under stress. Use runbook-as-code for every recovery step that can be automated.\n\nChaos engineering complements DR drills. Tools like AWS Fault Injection Simulator, Gremlin, or LitmusChaos inject failures continuously in production or staging, validating that detection, alerting, and automated recovery work before a real disaster. The goal is to make small, controlled failures routine so large, uncontrolled ones are handled correctly.\n\nAfter each drill or real incident, document the actual RPO and RTO achieved, compare to targets, and close the gap with concrete improvements.",
    key_points: [
      "Untested DR is not DR — test with real traffic, not just theory",
      "Annual planned failover: measure actual RTO/RPO, not design targets",
      "Runbooks as code: executable, version-controlled, stress-proof",
      "Chaos engineering validates detection and recovery continuously",
      "Most teams discover actual RTO is 3–5× their target in the first drill",
      "Post-drill retrospective: compare actual vs. target, commit to specific improvements"
    ],
    hint: "Your DR plan says 'RTO = 2 hours.' When was the last time you tested that claim with real traffic?",
    common_trap: "Treating DR as a compliance checkbox — writing a DR plan for an audit but never testing it. When a real disaster strikes, the plan is discovered to be incorrect or out of date.",
    follow_up_questions: [
      { text: "What is a game day and how does it differ from a chaos experiment?", type: "inline", mini_answer: "A game day is a structured, planned event where a team deliberately breaks things in production or staging to practice their incident response. Chaos experiments are usually smaller, automated, and run continuously. Game days are larger, team-wide exercises that test coordination and communication, not just technical resilience." },
      { text: "How do you validate data integrity after a DR failover?", type: "inline", mini_answer: "Run a suite of data integrity checks immediately after failover: row counts on critical tables, hash checksums on recent records, application-level smoke tests (create order → verify it appears). Flag any discrepancy as a data integrity incident. This must be scripted and automated — running it manually under incident pressure guarantees errors." }
    ],
    related: ["3.7.01", "3.7.02", "3.3.04"],
    has_diagram: false,
    has_code: false,
    tags: ["disaster-recovery", "chaos-engineering", "DR-testing", "game-day", "runbook", "nfr"]
  }

];
