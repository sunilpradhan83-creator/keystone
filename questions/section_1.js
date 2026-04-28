// questions/section_1.js
// Section 1: System Design & Architecture
// Subsections: 1.1 Distributed Systems Fundamentals
//              1.2 Microservices Architecture
//              1.3 Event-Driven Architecture
//              1.4 API Design & Integration
//              1.5 Monolith to Microservices Migration
//              1.6 Real-Time Systems Design
//              1.7 Domain-Driven Design
// Target: ~42 questions
// Added: 2026-04-28

const SECTION_1_QUESTIONS = [

  // ============================================================
  // SUBSECTION 1.1 — DISTRIBUTED SYSTEMS FUNDAMENTALS
  // IDs: 1.1.01 → 1.1.06
  // ============================================================

  // ---------- 1.1.01 ----------
  {
    id: "1.1.01",
    section: 1,
    subsection: "1.1",
    level: "intermediate",

    question: "Explain the CAP theorem. What does it mean in practice when designing a distributed system?",

    quick_answer: "→ CAP: a distributed system can guarantee only 2 of 3: Consistency, Availability, Partition tolerance\n→ Partition tolerance is non-negotiable over a network — you always sacrifice C or A\n→ CP systems: reject requests during a partition to preserve consistency (e.g. HBase, Zookeeper)\n→ AP systems: serve stale data during a partition (e.g. Cassandra, DynamoDB)\n→ Real choice is: 'what degrades gracefully under a network split?'",

    detailed_answer: "CAP theorem (Brewer, 2000) states that a distributed data store cannot simultaneously guarantee Consistency, Availability, and Partition Tolerance.\n\nConsistency means every read receives the most recent write (linearizability). Availability means every request receives a non-error response — though it may be stale. Partition Tolerance means the system continues operating when network messages are dropped between nodes.\n\nThe key insight is that network partitions in a distributed system are inevitable. You cannot opt out of P. So the real design decision is: during a partition, do you preserve C or A?\n\nCP systems prioritise consistency. During a partition, they refuse requests or return errors rather than serve stale data. Zookeeper, HBase, and Consul in strong mode behave this way. This is correct for financial transactions, distributed locks, or leader election where stale state causes corruption.\n\nAP systems prioritise availability. During a partition, nodes continue serving requests using their local state, accepting that reads may be stale. Cassandra, DynamoDB, and CouchDB lean AP. This is correct for product catalogues, user sessions, and recommendation feeds where a few seconds of stale data is acceptable.\n\nPractical nuance: CAP is binary — it describes behaviour at the worst moment (a partition). PACELC extends CAP to describe the normal-case trade-off between latency and consistency. Most systems let you tune per-operation: Cassandra's quorum reads are more consistent but slower; eventual reads are faster but potentially stale.\n\nInterview signal: avoid saying 'we pick CP' or 'we pick AP' without tying it to specific data and failure modes. The right answer is 'for this data, the cost of serving stale state is X; for that data, it is Y — so we configure accordingly.'",

    key_points: [
      "Network partitions are unavoidable — P is not optional, the real trade-off is C vs A",
      "CP: consistency preserved, availability sacrificed during partition (Zookeeper, HBase)",
      "AP: availability preserved, consistency relaxed during partition (Cassandra, DynamoDB)",
      "PACELC extends CAP: even without partitions, latency vs consistency is the normal-case trade-off",
      "Tune per-operation — most modern stores let you choose consistency level per request",
      "Tie C vs A decision to the cost of stale data for each specific data type"
    ],

    hint: "If someone says 'we always need consistency AND availability' — what does that imply about their network assumptions?",

    common_trap: "Treating CAP as a one-time system-wide choice. Real systems tune consistency per operation — a shopping cart read can be AP while a payment write is CP.",

    follow_up_questions: [
      { text: "How does PACELC extend CAP, and when does it change your design decision?", type: "inline", mini_answer: "PACELC adds the normal-case dimension: even without a partition, you trade Latency for Consistency. Systems like DynamoDB let you pick eventual (low latency) or strong (higher latency) reads per call." },
      { text: "How does DB selection map to CAP choices?", type: "inline", mini_answer: "CP stores (HBase, Zookeeper) suit financial data and distributed locks. AP stores (Cassandra, DynamoDB) suit user sessions and catalogues. Most modern DBs let you tune per-operation — pick the default that matches your dominant access pattern, not the worst case." }
    ],

    related: ["4.5.01", "2.1.01"],
    has_diagram: false,
    has_code: false,
    tags: ["CAP", "distributed-systems", "consistency", "availability", "partition-tolerance"]
  },

  // ---------- 1.1.02 ----------
  {
    id: "1.1.02",
    section: 1,
    subsection: "1.1",
    level: "intermediate",

    question: "What are the main consistency models in distributed systems, and when would you choose strong vs eventual consistency?",

    quick_answer: "→ Strong (linearisable): every read sees the latest write — safe, slow\n→ Sequential: all nodes see writes in same order, not necessarily real-time\n→ Eventual: all replicas converge given no new writes — fast, may read stale\n→ Causal: causally related ops appear in order; unrelated may diverge\n→ Choose strong for money, locks, auth; eventual for feeds, catalogues, counters",

    detailed_answer: "Consistency models form a spectrum from strongest to weakest guarantees.\n\nLinearisability (strong consistency) means operations appear instantaneous at a single point in time. If a write completes, any subsequent read anywhere sees that value. This requires coordination — typically quorum reads/writes or a single leader. It is the gold standard for correctness but costs latency and availability.\n\nSequential consistency relaxes the real-time requirement: all nodes agree on the order of operations, but that order may lag real-time. Less common in databases; more relevant in CPU memory models.\n\nCausal consistency tracks cause-and-effect. If Alice posts a message and Bob replies, anyone who sees Bob's reply must also see Alice's post. Unrelated operations may be seen in different orders. MongoDB's causal sessions and some CRDT-based systems provide this.\n\nEventual consistency guarantees that, given no new writes, all replicas will converge to the same value. No timing guarantees. This is what Cassandra, DynamoDB, and Riak provide by default. It is the weakest model that makes useful promises.\n\nRead-your-writes, monotonic reads, and monotonic writes are session-level guarantees that add useful constraints on top of eventual consistency without requiring global coordination.\n\nChoosing: use strong consistency where incorrect state causes real harm — financial balances, distributed locks, inventory oversell, auth token revocation. Use eventual consistency where brief staleness is tolerable — social feeds, product search, recommendation lists, analytics dashboards. The cost of coordination for strong consistency grows with geography: global linearisability requires round trips across regions, adding 100–200ms per write.",

    key_points: [
      "Linearisable: safest, requires coordination, adds latency — use for money and locks",
      "Eventual: fastest, may read stale — use for feeds, catalogues, analytics",
      "Causal consistency is a practical middle ground: preserves cause-effect, avoids full coordination",
      "Session guarantees (read-your-writes) are often enough for user-facing apps without global strong consistency",
      "Geographic distribution makes strong consistency expensive — every region adds round-trip latency",
      "Most datastores let you tune consistency level per operation, not just at system level"
    ],

    hint: "Walk me through what breaks if your cart service uses eventual consistency — what's the worst-case user experience?",

    common_trap: "Assuming eventual consistency means 'eventually it will be wrong.' It means 'eventually all replicas converge' — the question is how long and what happens in the window.",

    follow_up_questions: [
      { text: "What session-level guarantees can you layer on top of eventual consistency?", type: "inline", mini_answer: "Read-your-writes (you always see your own writes), monotonic reads (you never see older data than you already read), and write-follows-reads (writes are ordered after any reads they depend on). These are achievable with sticky sessions or client-side vector clocks." },
      { text: "How do scalability decisions connect to consistency trade-offs?", type: "inline", mini_answer: "Horizontal scaling of stateless services is straightforward. Scaling stateful services requires deciding what consistency to sacrifice: read replicas (eventual reads), partitioning (loses cross-partition transactions), or caching (stale reads). Each scale-out step is also a consistency trade-off decision." }
    ],

    related: ["1.1.01", "4.5.01", "2.6.01"],
    has_diagram: false,
    has_code: false,
    tags: ["consistency-models", "eventual-consistency", "linearisability", "distributed-systems"]
  },

  // ---------- 1.1.03 ----------
  {
    id: "1.1.03",
    section: 1,
    subsection: "1.1",
    level: "advanced",

    question: "How does the Raft consensus algorithm work, and what problems does it solve compared to Paxos?",

    quick_answer: "→ Raft solves distributed consensus: all nodes agree on a sequence of log entries\n→ Leader election: nodes time out, start election, majority vote wins term\n→ Log replication: leader appends, replicates to majority, then commits\n→ Safety: only nodes with up-to-date logs can win — no stale leader\n→ Raft vs Paxos: same guarantees, Raft is understandable by design (single leader, clear phases)",

    detailed_answer: "Distributed consensus is the problem of getting a cluster of nodes to agree on a sequence of values even when some nodes fail or messages are lost. Raft and Paxos both solve this. Paxos was the academic gold standard but notoriously hard to implement correctly — its paper describes single-value consensus (single-decree Paxos) and multi-value consensus (Multi-Paxos) separately with large implementation gaps between them.\n\nRaft was designed specifically for understandability. It decomposes consensus into three relatively independent sub-problems: leader election, log replication, and safety.\n\nLeader election: each node has an election timeout (randomised, typically 150–300ms). If a follower sees no heartbeat from the leader within that window, it increments its term and sends RequestVote RPCs. A candidate that receives a majority of votes becomes the leader for that term. Randomised timeouts mean one node usually times out first, avoiding split votes.\n\nLog replication: the leader accepts client writes, appends them to its log, and sends AppendEntries RPCs to all followers. Once a majority have acknowledged, the entry is committed and the leader replies to the client. Committed entries are guaranteed to survive any future leader change.\n\nSafety: a candidate can only win if its log is at least as up-to-date as the majority it contacted (compared by term and log index). This prevents a stale node from winning an election and overwriting committed entries.\n\nRaft is used in etcd (Kubernetes' config store), CockroachDB, TiKV, and Consul. Raft's single-leader design means writes always go through one node — which is both its strength (predictable) and its bottleneck (leader becomes hot path under write-heavy load). Multi-Raft (sharding the keyspace across independent Raft groups) solves write scaling in systems like TiKV.",

    key_points: [
      "Raft guarantees: only committed entries survive failures — committed = majority acknowledged",
      "Leader election uses randomised timeouts to avoid split votes across nodes",
      "Log replication requires majority acknowledgement before a client write is confirmed",
      "Safety rule: a candidate must have an up-to-date log to win — prevents stale leaders",
      "Single leader is a write bottleneck; Multi-Raft shards the keyspace across groups",
      "Used in etcd (k8s), CockroachDB, TiKV, Consul — knowing real users matters in interviews"
    ],

    hint: "What happens in Raft if the leader crashes right after it commits a log entry but before it tells the followers it's committed?",

    common_trap: "Saying Raft is 'better' than Paxos. They have equivalent safety guarantees. Raft is easier to implement and reason about — that is the actual distinction.",

    follow_up_questions: [
      { text: "What is a split-brain scenario and how does Raft prevent it?", type: "inline", mini_answer: "Split-brain: two nodes both believe they are the leader. Raft prevents it via term numbers — a new leader's term is always higher; when the old leader sees a higher term in any message, it immediately steps down." },
      { text: "How does distributed consensus relate to availability design?", type: "inline", mini_answer: "Raft/Paxos require a majority quorum to make progress — with 3 nodes you tolerate 1 failure, with 5 you tolerate 2. Adding nodes improves fault tolerance but not write throughput (all writes still go through the leader). For high availability, size your cluster for N+1 failures, not just N." }
    ],

    related: ["1.1.01", "3.2.01"],
    has_diagram: true,
    diagram: `Raft Leader Election

  Term 1                  Term 2
  ┌──────┐  crash         ┌──────┐
  │Leader│──────────────> │ NEW  │
  └──────┘                │Leader│
                          └──────┘
  Followers timeout            ↑
  Increment term               │ majority vote
  Send RequestVote ────────────┘

  Log Replication:
  Client → Leader → AppendEntries → Majority ACK → Commit → Reply`,
    has_code: false,
    tags: ["raft", "paxos", "consensus", "distributed-systems", "etcd"]
  },

  // ---------- 1.1.04 ----------
  {
    id: "1.1.04",
    section: 1,
    subsection: "1.1",
    level: "advanced",

    question: "Compare two-phase commit (2PC) and the Saga pattern for distributed transactions. When do you use each?",

    quick_answer: "→ 2PC: coordinator locks all participants, then commits or aborts atomically\n→ 2PC problem: blocking — coordinator crash leaves participants locked indefinitely\n→ Saga: chain of local transactions, each with a compensating transaction on failure\n→ Saga: no locks, higher availability, but no isolation — intermediate state is visible\n→ Use 2PC for tightly-coupled, short-lived transactions. Use Saga for long-running, microservice-spanning workflows",

    detailed_answer: "Two-Phase Commit is a classic distributed transaction protocol. In Phase 1 (prepare), a coordinator asks all participants to prepare — lock resources, write to redo log, confirm readiness. In Phase 2 (commit), if all said yes, the coordinator sends commit; if any said no, it sends abort. This gives all-or-nothing semantics across multiple databases.\n\nThe critical flaw: 2PC is a blocking protocol. If the coordinator crashes after Phase 1 but before Phase 2, participants are stuck holding locks, waiting for a decision that never comes. The only recovery is manual intervention or a new coordinator that can reconstruct state. This makes 2PC fragile across service boundaries and across long time windows.\n\nSaga (Hector Garcia-Molina, 1987) breaks a distributed transaction into a sequence of local transactions. Each step publishes an event or calls the next service. If a step fails, compensating transactions run in reverse order to undo completed steps. There is no global lock — each local transaction commits immediately.\n\nThe trade-off: Sagas have no isolation. Between step 2 and step 5, intermediate state is visible — another request can read a partially completed order. This requires designing around anomalies: 'lost updates' (another saga modifying the same record between your steps), 'dirty reads' (reading intermediate state). Countermeasures include semantic locks (mark records as 'pending'), pivot transactions (the point of no return), and ordering compensations carefully.\n\nSagas come in two flavours: choreography (each service reacts to events — decoupled but hard to trace) and orchestration (a central saga orchestrator drives the sequence — easier to observe, single point of failure).\n\nRule of thumb: 2PC is appropriate for intra-database or single-system transactions where you control all participants and failures are short-lived. Sagas are appropriate for inter-service workflows where you cannot hold distributed locks across service boundaries.",

    key_points: [
      "2PC gives ACID atomicity across services but is blocking — coordinator crash = indefinite lock",
      "Saga uses local transactions + compensations — no global lock, so higher availability",
      "Sagas have no isolation: intermediate state is visible between steps (dirty reads, lost updates)",
      "Countermeasures: semantic locks, pivot transactions, careful compensation ordering",
      "Choreography (events) vs Orchestration (central coordinator) — each has distinct observability trade-offs",
      "2PC for short-lived, tightly-coupled. Saga for long-running, cross-service, microservice architectures"
    ],

    hint: "If a Saga's compensating transaction also fails — what happens, and how would you design around that?",

    common_trap: "Treating Sagas as a drop-in ACID replacement. Sagas trade isolation for availability — you must explicitly handle intermediate state visibility in your domain logic.",

    follow_up_questions: [
      { text: "What is the Outbox pattern and why is it critical for reliable Saga choreography?", type: "linked", links_to: "4.3.05" },
      { text: "How do you handle compensating transactions that are themselves unreliable?", type: "inline", mini_answer: "Make compensations idempotent and retry indefinitely with backoff. If a compensation cannot succeed (e.g. item already shipped), escalate to a human workflow or issue a refund as the 'compensating' action — pure technical rollback may not always be possible." }
    ],

    related: ["4.5.01", "4.3.05", "2.7.01"],
    has_diagram: true,
    diagram: `2PC vs Saga

  2PC:
  Coordinator ──prepare──> [DB1, DB2, DB3]
              <──yes──────  (all lock resources)
  Coordinator ──commit──>  [DB1, DB2, DB3]
  ⚠ Coordinator crash here = all DBs stuck locked

  Saga (Orchestration):
  Orchestrator → Step1 (Order) → commit ✓
               → Step2 (Reserve Stock) → commit ✓
               → Step3 (Charge Payment) → FAIL ✗
               → Compensate Step2 (Release Stock)
               → Compensate Step1 (Cancel Order)`,
    has_code: false,
    tags: ["2PC", "saga", "distributed-transactions", "microservices", "consistency"]
  },

  // ---------- 1.1.05 ----------
  {
    id: "1.1.05",
    section: 1,
    subsection: "1.1",
    level: "intermediate",

    question: "What is idempotency in distributed systems, and how do you design idempotent APIs and operations?",

    quick_answer: "→ Idempotent: calling N times produces the same result as calling once\n→ Needed because networks retry — duplicate delivery is inevitable\n→ HTTP: GET, PUT, DELETE are idempotent by spec; POST is not\n→ Idempotency keys: client sends unique request ID; server deduplicates\n→ Store idempotency key + result in DB; replay cached result on retry",

    detailed_answer: "In distributed systems, message delivery is at-least-once — retries happen on timeout, network blip, or client restart. If your operation is not idempotent, retries cause double-charges, duplicate orders, or data corruption.\n\nIdempotency means the effect of applying an operation multiple times is identical to applying it once. Reads are naturally idempotent. State-changing operations must be designed to be.\n\nThe standard pattern for API idempotency: the client generates a unique idempotency key (UUID) and sends it as a header (Idempotency-Key: uuid). The server, before executing, checks its idempotency store (Redis or a DB table). If the key exists, it returns the stored response immediately without re-executing. If not, it executes, stores the (key, response, expiry), and returns the result.\n\nCritical details: the check and insert must be atomic — use a DB unique constraint or Redis SET NX. The stored result must include the status code and response body, not just 'completed'. Expiry should match your retry window (e.g. 24 hours). If the original request is still in-flight (concurrent retry), return 409 Conflict or block until complete.\n\nFor messaging/events, idempotency means your consumer can process the same message twice without side effects. Design this by tracking processed message IDs in a deduplication table. Database operations should use upsert (INSERT ... ON CONFLICT DO NOTHING) rather than INSERT, and check-then-act patterns should be replaced with conditional updates (UPDATE ... WHERE version = expected).\n\nNatural idempotency is always better than bolt-on idempotency: design operations around state transitions rather than imperative actions. 'Set order status to CONFIRMED where status = PENDING' is naturally idempotent. 'Increment counter by 1' is not — use a deduplication key.",

    key_points: [
      "Retries are inevitable — at-least-once delivery is the network reality, not a choice",
      "Idempotency key pattern: client generates UUID, server deduplicates atomically against a store",
      "Atomic check-and-insert required — race condition between two concurrent retries is a real risk",
      "Consumer deduplication: track processed message IDs in a table, use upsert not insert",
      "Natural idempotency (state-based updates) beats bolt-on deduplication",
      "Key expiry must cover the realistic retry window — typically 24 hours to 7 days"
    ],

    hint: "Two retries of the same payment request arrive simultaneously — how does your idempotency store handle that race condition?",

    common_trap: "Using a 'check then act' pattern without an atomic lock — two threads can both check, both see the key is absent, and both execute the operation.",

    follow_up_questions: [
      { text: "How does idempotency relate to retry and at-least-once delivery in messaging?", type: "linked", links_to: "4.4.07" },
      { text: "How would you implement idempotency in a REST endpoint in Java Spring Boot?", type: "inline", mini_answer: "Use a DB table with (idempotency_key, status, response, created_at) and a unique constraint on the key. In a filter/interceptor, load the key; if found and complete, return stored response; if found and in-progress, wait or return 409; if absent, INSERT with status=IN_PROGRESS, run handler, update to COMPLETE." }
    ],

    related: ["4.4.07", "4.3.05"],
    has_diagram: false,
    has_code: true,
    code_language: "java",
    code_snippet: `// Idempotency filter — Spring Boot pseudocode
@Component
public class IdempotencyFilter extends OncePerRequestFilter {
    @Autowired IdempotencyStore store;

    protected void doFilterInternal(request, response, chain) {
        String key = request.getHeader("Idempotency-Key");
        if (key == null) { chain.doFilter(request, response); return; }

        Optional<StoredResponse> cached = store.get(key);
        if (cached.isPresent()) {
            // Replay stored response — do NOT re-execute
            writeCachedResponse(response, cached.get());
            return;
        }

        // Atomic insert — unique constraint prevents race condition
        store.insertInProgress(key); // throws on duplicate key

        try {
            chain.doFilter(request, wrappingResponse);
            store.markComplete(key, wrappingResponse.capturedBody());
        } catch (Exception e) {
            store.delete(key); // allow retry
            throw e;
        }
    }
}`,
    tags: ["idempotency", "distributed-systems", "api-design", "retries", "at-least-once"]
  },

  // ---------- 1.1.06 ----------
  {
    id: "1.1.06",
    section: 1,
    subsection: "1.1",
    level: "intermediate",

    question: "What is a distributed clock problem, and how do vector clocks and logical timestamps help?",

    quick_answer: "→ Problem: no shared global clock in distributed systems — wall clocks drift and skew\n→ Lamport timestamp: scalar counter incremented on send/receive — establishes happens-before\n→ Vector clock: one counter per node — can detect concurrent vs causally ordered events\n→ Use case: CRDTs, conflict resolution in eventually-consistent stores\n→ Hybrid Logical Clocks (HLC): combines wall time + logical counter — used in CockroachDB",

    detailed_answer: "In a single machine, a monotonic clock gives you total ordering of events. In a distributed system, every node has its own clock that drifts independently. NTP synchronisation gets you within a few milliseconds, but even millisecond skew can cause ordering bugs in databases, logs, and cache invalidation.\n\nLamport timestamps (Leslie Lamport, 1978) are the simplest solution. Each node maintains a logical counter. Rules: increment the counter on each local event; when sending a message, attach the current counter; when receiving, set your counter to max(local, received) + 1. This establishes a partial order: if event A causally precedes B, then timestamp(A) < timestamp(B). The reverse is not guaranteed — identical or out-of-order timestamps do not mean events are concurrent.\n\nVector clocks extend this to detect true concurrency. Each node maintains a vector of counters, one per node in the system. On send, increment your own slot and attach the full vector. On receive, take element-wise max and increment your slot. Now you can compare two vectors: if every slot in V1 ≤ V2 and at least one is strictly less, then V1 happened-before V2. If neither dominates, the events are concurrent (no causal relationship).\n\nWhy this matters: DynamoDB uses vector clocks (versioned objects) for conflict detection. Riak uses them for CRDT-based conflict resolution. When two writes are concurrent, the system can surface both to the application layer and let it merge rather than silently losing one.\n\nHybrid Logical Clocks (HLC) combine wall-clock time with a logical component. HLC timestamps look like real timestamps (usable for range queries and TTL) but maintain the happens-before guarantee of logical clocks. CockroachDB uses HLC to provide serialisable transactions across geo-distributed nodes without Google Spanner's atomic clocks.\n\nIn interviews, the key is knowing when ordering matters and which tool fits: Lamport for simple causal ordering, vector clocks for detecting concurrency, HLC when you need physical time proximity.",

    key_points: [
      "Wall clocks drift — never use System.currentTimeMillis() as a distributed ordering mechanism",
      "Lamport: scalar counter, establishes happens-before, but cannot detect true concurrency",
      "Vector clocks: per-node counters, can distinguish causal order from concurrent writes",
      "Concurrent events (no causal relationship) need application-level merge or last-write-wins policy",
      "HLC: wall time + logical counter — real timestamps with causal guarantees (CockroachDB)",
      "CRDTs rely on vector clocks or similar for safe merge of concurrent updates"
    ],

    hint: "If two writes arrive with the same Lamport timestamp, what can you conclude about their causal relationship?",

    common_trap: "Using Lamport timestamps to prove events are concurrent. Lamport only proves happens-before — equal timestamps do not mean concurrent, and you cannot infer concurrency without vector clocks.",

    follow_up_questions: [
      { text: "How does CockroachDB use Hybrid Logical Clocks to achieve serialisable isolation across regions?", type: "inline", mini_answer: "CockroachDB assigns HLC timestamps to transactions. When a transaction reads, it waits until all nodes' clocks advance past the read timestamp (bounded uncertainty window). This ensures no later-timestamped write is invisible, giving serialisability without atomic hardware clocks." },
      { text: "How do vector clocks connect to event-driven architecture conflict resolution?", type: "inline", mini_answer: "In event-driven systems, concurrent events published by different nodes may arrive out of order. Vector clocks (or similar causal metadata) attached to events let consumers detect whether two events are causally related or truly concurrent. Truly concurrent events need merge logic (e.g. CRDTs) rather than last-write-wins." }
    ],

    related: ["1.1.01", "1.3.01", "2.6.01"],
    has_diagram: true,
    diagram: `Vector Clock Example

  Node A    Node B    Node C
  [1,0,0]
  send ──────────────────────────────────>
             [1,1,0]   receive
             [1,2,0]   local event
             send ──────────────────────>
                        [1,2,1]  receive
  [2,2,1]   receive from C (via A notified)

  Compare V1=[2,0,0] vs V2=[0,2,0]:
  Neither dominates → CONCURRENT events`,
    has_code: false,
    tags: ["vector-clocks", "lamport", "distributed-clocks", "HLC", "causal-consistency"]
  },


  // ============================================================
  // SUBSECTION 1.2 — MICROSERVICES ARCHITECTURE
  // IDs: 1.2.01 → 1.2.06
  // ============================================================

  // ---------- 1.2.01 ----------
  {
    id: "1.2.01",
    section: 1,
    subsection: "1.2",
    level: "basic",

    question: "What are microservices and what core problems do they solve that a monolith cannot?",

    quick_answer: "→ Microservices: independently deployable services each owning a bounded piece of business capability\n→ Solve: independent scaling (scale payments without scaling auth)\n→ Solve: independent deployability (deploy checkout without redeploying the whole app)\n→ Solve: team autonomy (each team owns their service end-to-end)\n→ Cost: distributed systems complexity — network, consistency, observability all harder",

    detailed_answer: "A monolith packages all capabilities into one deployable unit. That works well at small scale — simple to develop, test, and deploy. The cracks appear when the organisation and codebase grow: a single slow team blocks a release, a single memory-hungry feature forces you to scale the entire app, and a single bad deploy takes down everything.\n\nMicroservices address these by decomposing along business capability boundaries. Each service owns its domain, its data, and its deployment lifecycle. The benefits are real: you can scale the payment service to handle Black Friday traffic without scaling the user profile service. You can let the recommendations team deploy ten times a day without touching the checkout pipeline. Failures are isolated — a crashing notifications service does not bring down order processing.\n\nThe costs are equally real. You have traded in-process function calls for network calls that can fail, time out, or return stale data. You have traded a single database transaction for distributed consistency problems. You have traded a single log file for distributed tracing across dozens of services. Testing a full flow now requires running multiple services together or investing in contract testing.\n\nThe key architectural question is not 'microservices vs monolith' but 'what is the right size of service for our team topology and deployment needs?' A common mistake is decomposing too finely before the domain is understood — resulting in a distributed monolith where every change requires coordinating multiple service deploys. Conway's Law applies: your service boundaries will mirror your org structure whether you plan it or not.",

    key_points: [
      "Independent deployability is the primary technical benefit — each service ships on its own schedule",
      "Independent scalability — scale only the bottleneck, not the whole system",
      "Team autonomy — each team owns their service boundary, data, and release",
      "Distributed systems costs: network failures, distributed consistency, cross-service observability",
      "Premature decomposition creates a distributed monolith — worse than the original",
      "Conway's Law: org structure and service boundaries converge whether designed or not"
    ],

    hint: "If each microservice deployment still requires coordinating with three other teams, what does that tell you about the service boundaries?",

    common_trap: "Treating microservices as a technical pattern rather than an organisational one. The architecture only pays off when teams genuinely own their service end-to-end — otherwise you get distributed complexity with no autonomy benefit.",

    follow_up_questions: [
      { text: "How do you decide where to draw service boundaries?", type: "linked", links_to: "1.2.02", mini_answer: "Use Domain-Driven Design bounded contexts — each service should map to a cohesive business capability with its own ubiquitous language. A good heuristic: if two services always deploy together or always query each other's data, they are probably one service." },
      { text: "How does the Strangler Fig pattern help migrate a monolith to microservices?", type: "linked", links_to: "4.1.04", mini_answer: "Strangler Fig incrementally replaces monolith functionality by routing specific requests to new microservices via a facade. The monolith shrinks over time as each capability is extracted. No big-bang rewrite needed — you migrate feature by feature while the monolith still runs." }
    ],

    related: ["4.1.04", "4.1.07", "1.2.02"],
    has_diagram: false,
    has_code: false,
    tags: ["microservices", "monolith", "system-design", "architecture", "conways-law"]
  },

  // ---------- 1.2.02 ----------
  {
    id: "1.2.02",
    section: 1,
    subsection: "1.2",
    level: "intermediate",

    question: "How do you identify the right service boundaries when decomposing into microservices?",

    quick_answer: "→ Primary tool: Domain-Driven Design bounded contexts — group by cohesive business capability\n→ Each service = its own ubiquitous language, own data, own team\n→ Warning signs of wrong boundaries: chatty inter-service calls, shared databases, always deploying together\n→ Start coarse — split only when you have a concrete reason (scale, team, tech)\n→ Business capability > technical layer (avoid horizontal slicing by tier)",

    detailed_answer: "Service boundary decisions are the highest-leverage choices in microservices architecture. Get them wrong and you pay the cost of distributed systems without the benefits of autonomy.\n\nDomain-Driven Design (DDD) bounded contexts are the most reliable tool. A bounded context is a region of the domain where a specific model applies consistently. Within it, terms have precise meanings; outside it, the same word might mean something different. Mapping bounded contexts to services gives you natural cohesion: the Order service owns everything about orders and uses order vocabulary; the Inventory service has its own model for stock — the two don't share a database or impose their models on each other.\n\nPractical heuristics: a service should be changeable without coordinating changes in other services. If changing the Orders service always requires a simultaneous change to the Inventory service, the boundary is wrong. If two services always call each other synchronously for every user request, they are probably one service with an unnecessary network hop.\n\nCommon anti-patterns: decomposing by technical layer (frontend service, business logic service, data service) creates horizontal slices that couple tightly because a single business feature spans all three. Decomposing by CRUD entity (one service per database table) creates chatty, fine-grained services that cannot execute business operations without orchestrating many round trips.\n\nStart coarse. A single 'Order Management' service that handles order creation, fulfilment, and cancellation is better than three separate micro-services if one team owns all of it. Split only when you have a concrete reason: independent scale requirement, different deployment cadence, separate team ownership, or genuinely different technology needs.",

    key_points: [
      "Bounded context = natural service boundary — one model, one team, one deployment",
      "Chatty inter-service calls and always-deploy-together are signals of wrong boundaries",
      "Decompose by business capability, not by technical layer or CRUD entity",
      "Start coarser than you think — split when a concrete reason emerges",
      "Shared database between two services is the most common boundary violation",
      "A service must be independently deployable — that is the litmus test"
    ],

    hint: "Two of your services share a database table — why is this a boundary violation and what's the consequence if you leave it?",

    common_trap: "Decomposing too early before the domain is understood. The right boundaries only become obvious after you've built the feature once — prematurely extracted services get refactored more expensively than a monolith would.",

    follow_up_questions: [
      { text: "What is a bounded context in DDD and how does it map to a microservice?", type: "inline", mini_answer: "A bounded context defines the boundary within which a domain model is consistent and unambiguous. It maps 1:1 to a microservice when the bounded context has its own team, data, and deployment cadence. The context map describes how adjacent bounded contexts integrate — shared kernel, customer-supplier, or anti-corruption layer." },
      { text: "What is the Database per Service pattern and why is it critical?", type: "linked", links_to: "1.2.05", mini_answer: "Each service owns its private database — no other service queries it directly. This enforces loose coupling: services can change their schema independently, choose the right database technology, and scale storage separately. The cost is that joins across services must be done in application code or via eventual consistency." }
    ],

    related: ["1.2.01", "1.2.05", "1.7.01", "4.1.04"],
    has_diagram: false,
    has_code: false,
    tags: ["microservices", "bounded-context", "DDD", "service-boundaries", "decomposition"]
  },

  // ---------- 1.2.03 ----------
  {
    id: "1.2.03",
    section: 1,
    subsection: "1.2",
    level: "intermediate",

    question: "When do you choose synchronous (REST/gRPC) vs asynchronous (messaging) communication between microservices?",

    quick_answer: "→ Synchronous: caller needs an immediate response to continue — queries, real-time reads\n→ Async: caller can continue without waiting — notifications, background processing, event fan-out\n→ Sync couples availability: if downstream is down, upstream fails too\n→ Async decouples availability: producer continues even if consumer is slow or down\n→ Rule: sync for reads/queries, async for state changes and cross-service side effects",

    detailed_answer: "The communication style choice shapes coupling, resilience, and observability across your system.\n\nSynchronous communication (REST, gRPC) means the caller blocks waiting for a response. Use it when the caller genuinely cannot proceed without the result — a checkout service that must confirm payment before confirming an order, or an API gateway looking up user permissions before allowing a request. The cost is temporal coupling: if the downstream service is slow or down, the upstream service is also degraded. This is why synchronous chains should be short — each hop multiplies the failure probability.\n\ngRPC is often preferred over REST for internal service-to-service calls because it uses HTTP/2 (multiplexed, binary, lower overhead), has strong typed contracts via Protocol Buffers, and supports streaming. REST is better for external-facing APIs where clients are diverse and tooling familiarity matters.\n\nAsynchronous messaging (Kafka, RabbitMQ, SQS) means the producer publishes an event or command and moves on. Use it for state change propagation — order placed, payment processed, shipment dispatched. Each downstream service reacts independently. This gives you temporal decoupling (consumer can be down and catch up later), load levelling (consumer processes at its own pace), and natural audit trail (event log).\n\nThe most common mistake is using synchronous calls for cross-service side effects. If placing an order synchronously calls inventory, shipping, and notification services, you have four points of failure in one user request, and the latency compounds. Better: place the order, emit an OrderPlaced event, and let each downstream service react asynchronously.\n\nHybrid is normal: a service exposes a synchronous query API for reads and emits events for writes. The read path is synchronous (caller needs data now); the write path is asynchronous (downstream effects can happen eventually).",

    key_points: [
      "Sync: use when caller must have the response to continue — keep chains short",
      "Async: use for side effects, fan-out, background work — decouples availability",
      "Synchronous chains compound failure probability — N hops = N points of failure",
      "gRPC preferred for internal service calls; REST for external/public APIs",
      "Hybrid pattern: sync reads, async writes — most production systems use both",
      "Async enables natural back-pressure and load levelling via queue depth"
    ],

    hint: "Your checkout service calls inventory, payment, shipping, and notifications synchronously. What happens to checkout availability when the notifications service has an outage?",

    common_trap: "Making all cross-service communication async to 'decouple everything.' Some calls genuinely require a response — forcing async where sync is semantically correct adds accidental complexity (correlation IDs, callbacks, polling).",

    follow_up_questions: [
      { text: "How does event-driven architecture build on async messaging between services?", type: "inline", mini_answer: "EDA takes async messaging further — services emit domain events (OrderPlaced, PaymentFailed) without knowing who consumes them. Consumers subscribe independently. This removes point-to-point coupling: the producer doesn't know or care about downstream reactions. The event log becomes the system of record." },
      { text: "How does the Circuit Breaker pattern protect synchronous service calls?", type: "linked", links_to: "4.2.01", mini_answer: "Circuit Breaker monitors failure rate on a downstream call. After a threshold, it opens and rejects calls fast (fail fast) without hitting the downstream. After a timeout it half-opens to test recovery. This prevents a slow downstream from cascading into a full upstream failure." }
    ],

    related: ["1.2.01", "1.3.01", "4.2.01", "4.3.01"],
    has_diagram: true,
    diagram: `Sync vs Async Communication

  Synchronous (REST/gRPC):
  Client → Checkout → Payment (waits) → response
                    → Inventory (waits) → response
  ⚠ If Payment is slow → Checkout is slow → Client is slow

  Asynchronous (Events):
  Client → Checkout ──OrderPlaced event──> Kafka topic
           (returns 202 immediately)
                             ↓            ↓           ↓
                         Payment      Inventory   Notification
                         (async)      (async)     (async)`,
    has_code: false,
    tags: ["microservices", "REST", "gRPC", "messaging", "sync-vs-async", "communication"]
  },

  // ---------- 1.2.04 ----------
  {
    id: "1.2.04",
    section: 1,
    subsection: "1.2",
    level: "intermediate",

    question: "How does service discovery work in a microservices architecture, and what are the two main patterns?",

    quick_answer: "→ Problem: service instances have dynamic IPs — clients can't hardcode addresses\n→ Client-side discovery: client queries registry, picks instance, calls directly (Eureka + Ribbon)\n→ Server-side discovery: client calls load balancer/router, which queries registry (AWS ALB, Kubernetes)\n→ Service registry: source of truth for live instances (Consul, Eureka, Kubernetes DNS)\n→ Kubernetes makes server-side discovery the default via kube-proxy and DNS",

    detailed_answer: "In a microservices environment, service instances are ephemeral — they start, scale, crash, and restart on dynamic IP addresses. Service discovery solves the problem of finding where a service is currently running.\n\nThe foundation is a service registry — a database of live service instances. When a service starts, it registers itself (or the platform registers it). When it stops, it deregisters. The registry exposes an API to query: 'where are the healthy instances of the payment service?'\n\nClient-side discovery: the calling service queries the registry directly, gets a list of healthy instances, and applies its own load balancing logic (round-robin, least connections, zone-aware). Netflix Eureka with Ribbon is the classic example. The advantage: the client has full control over routing logic and can apply custom strategies (prefer same availability zone, weighted routing). The disadvantage: every client must implement discovery logic — it is a cross-cutting concern that leaks into every service.\n\nServer-side discovery: the client makes a request to a load balancer or service mesh proxy, which handles the registry lookup and routing. The client knows nothing about instance addresses. AWS Elastic Load Balancer, Kubernetes Services (kube-proxy + CoreDNS), and Istio's Envoy sidecar all implement this pattern. The advantage: clients are simple — they call a stable DNS name. The disadvantage: the load balancer/proxy is an additional network hop and a potential bottleneck.\n\nKubernetes effectively mandates server-side discovery. Each Service object gets a stable DNS name (my-service.namespace.svc.cluster.local) and kube-proxy handles routing to healthy pods. You rarely implement client-side discovery in a Kubernetes environment.\n\nHealth checks are critical to both patterns: only healthy instances should receive traffic. Kubernetes liveness and readiness probes, Consul health checks, and Eureka heartbeats all serve this role. A service registered but failing its health check should be removed from the pool immediately.",

    key_points: [
      "Service registry is the source of truth — instances self-register or are registered by the platform",
      "Client-side: caller queries registry and load-balances — full control, but discovery logic in every service",
      "Server-side: caller hits stable address, load balancer routes — simple clients, extra hop",
      "Kubernetes uses server-side by default — kube-proxy + CoreDNS, stable DNS per Service",
      "Health checks must gate registration — unhealthy instances must be removed from the pool immediately",
      "Service mesh (Istio, Linkerd) moves discovery, retries, and mTLS into the sidecar proxy transparently"
    ],

    hint: "If a service registers itself but crashes before deregistering, how does the registry know to stop sending traffic to it?",

    common_trap: "Treating DNS TTL as sufficient for service discovery. DNS caches stale entries — a crashed instance can still receive traffic for TTL seconds. Health-check-based removal from the registry is the correct signal, not DNS expiry.",

    follow_up_questions: [
      { text: "How does Kubernetes DNS-based service discovery work under the hood?", type: "inline", mini_answer: "Each Kubernetes Service gets a DNS entry in CoreDNS (e.g. payments.default.svc.cluster.local). kube-proxy watches the Endpoints object for that Service — when a pod becomes ready, its IP is added; when it fails, it's removed. DNS resolves to the ClusterIP, and kube-proxy (via iptables/IPVS) routes to a healthy pod." },
      { text: "How does a service mesh change the service discovery model?", type: "inline", mini_answer: "A service mesh injects a sidecar proxy (Envoy in Istio) alongside each service. The proxy intercepts all network traffic and handles discovery, load balancing, retries, circuit breaking, and mTLS — transparently, without any code changes in the service. The control plane (Istiod) distributes routing configuration to all sidecars." }
    ],

    related: ["1.2.01", "1.2.03", "4.1.11"],
    has_diagram: false,
    has_code: false,
    tags: ["service-discovery", "microservices", "kubernetes", "consul", "load-balancing"]
  },

  // ---------- 1.2.05 ----------
  {
    id: "1.2.05",
    section: 1,
    subsection: "1.2",
    level: "intermediate",

    question: "What is the Database per Service pattern and how do you handle queries that need data from multiple services?",

    quick_answer: "→ Each service owns its private DB — no other service queries it directly\n→ Enforces loose coupling: schema changes don't cascade across services\n→ Problem: no cross-service joins — you lose SQL JOIN across service boundaries\n→ Solutions: API composition (aggregate at app layer), CQRS read model, or event-driven materialised views\n→ Accept eventual consistency for cross-service reads — don't try to reconstruct ACID across services",

    detailed_answer: "Database per Service is not optional in a true microservices architecture — it is the pattern that makes services genuinely independent. If two services share a database, they are coupled at the schema level: one team's migration can break another team's service, you cannot choose different database technologies for different needs, and you cannot scale storage independently.\n\nThe challenge is that business operations often need data from multiple services. A customer order summary might need order data (Orders service), product names (Catalogue service), customer details (Customer service), and delivery status (Shipping service). In a monolith, one SQL JOIN fetches all of it. In microservices, you cannot JOIN across service databases.\n\nAPI Composition (synchronous): an aggregator service (or API gateway) calls each service's API, collects the results, and composes the response. Simple to implement, but you inherit the availability and latency of every downstream call. Works well for low-volume, latency-tolerant queries.\n\nCQRS with a dedicated read model (async): services emit events when their data changes. A separate read service (or the same service's read side) subscribes to these events and maintains a denormalised, pre-joined view optimised for the query. The read model is eventually consistent but fast and available independently of the source services. This is the scalable pattern for high-volume reads that span multiple service domains.\n\nEvent-driven materialised views: similar to CQRS read models. Each service publishes domain events; a materialised view service consumes them and maintains a projection. Netflix, Uber, and LinkedIn all use this pattern at scale for search indices and recommendation feeds that need data from many upstream services.\n\nThe key mindset shift: stop trying to maintain ACID consistency across service boundaries. Accept that a cross-service query will be eventually consistent. Design the UI and UX to tolerate that — show cached summaries, use skeleton screens, and flag stale data where precision matters.",

    key_points: [
      "Private database per service is mandatory — shared DB is a boundary violation, not a shortcut",
      "Cross-service SQL JOINs are impossible by design — this is intentional coupling prevention",
      "API Composition: call each service's API, aggregate in memory — simple but chains availability",
      "CQRS read model: event-driven pre-joined view — eventually consistent but independently scalable",
      "Choose database technology per service need: Cassandra for time-series, Postgres for relational, Redis for cache",
      "Accept eventual consistency for cross-service data — don't try to rebuild ACID across the network"
    ],

    hint: "A product page needs data from Orders, Catalogue, and Inventory services. Walk me through two approaches and the trade-offs of each.",

    common_trap: "Building a 'shared reporting database' that multiple services write to directly. This recreates the shared-database coupling problem under a different name and blocks independent schema evolution.",

    follow_up_questions: [
      { text: "How does CQRS help manage cross-service reads at scale?", type: "linked", links_to: "4.1.08", mini_answer: "CQRS separates the write model (commands, owned by each service) from the read model (query-optimised projections). Services emit events on writes; the read side materialises those events into denormalised views. High-volume reads hit the read model directly — no runtime coordination with the source services needed." },
      { text: "How do you handle a query that must be strongly consistent across two services?", type: "inline", mini_answer: "The honest answer: you usually can't without making the services chatty or reintroducing coupling. The correct approach is to question whether the consistency requirement is real — most cross-service reads tolerate seconds of staleness. If truly required, consider merging the two services into one so they share a database under one ownership." }
    ],

    related: ["1.2.02", "4.1.08", "4.1.09", "2.7.01"],
    has_diagram: false,
    has_code: false,
    tags: ["database-per-service", "microservices", "CQRS", "API-composition", "data-consistency"]
  },

  // ---------- 1.2.06 ----------
  {
    id: "1.2.06",
    section: 1,
    subsection: "1.2",
    level: "advanced",

    question: "What are the most dangerous microservices anti-patterns and how do you detect them early?",

    quick_answer: "→ Distributed monolith: services deployed independently but coupled in behaviour — worst of both worlds\n→ Shared database: multiple services writing the same tables — kills independent evolution\n→ Synchronous call chains: A→B→C→D — availability compounds, one slow service stalls all\n→ Chatty services: fine-grained services making tens of calls per user request\n→ Detect early: if a change needs coordinating with >1 team, boundaries are wrong",

    detailed_answer: "Microservices anti-patterns are dangerous because they preserve the complexity of distributed systems while eliminating the benefits of autonomy. They are also hard to detect early — the system feels like microservices architecturally but behaves like a tightly coupled monolith operationally.\n\nDistributed monolith: services have separate codebases and deployments but are behaviourally coupled — you cannot deploy service A without deploying service B at the same time, or a change to service A's API always requires changes in services B, C, and D. Detection: if a team's sprint regularly requires coordinating changes with other teams' services, you have a distributed monolith. The root cause is almost always wrong service boundaries.\n\nShared database: two or more services read and write the same database schema. Teams are free to change the schema, breaking each other's services silently. Detection: look for database credentials shared between services or ORMs pointing at the same connection string. Fix: introduce an API contract, migrate one service to its own schema, and use events or API calls for the other.\n\nDeep synchronous call chains: a user request triggers A → B → C → D → E synchronously. The total latency is the sum of all hops. The availability is the product: if each service is 99.9% available, a 5-deep chain is ~99.5% available. Detection: trace a user request through your system — count synchronous hops. Mitigation: break chains with async events, cache aggressively, or reconsider boundaries.\n\nNano-services: services decomposed so finely they have no meaningful autonomy — a service that wraps a single database table or a single function. The overhead of deployment, monitoring, and network calls outweighs the benefit. Detection: a service that cannot execute any meaningful business operation without calling another service.\n\nOrchestration sprawl: a central orchestrator service that calls every other service in sequence to complete a business flow. The orchestrator becomes a god object that couples all services through it. Detection: one service that appears in the call graph of every business operation. Use choreography (event-driven reactions) instead.",

    key_points: [
      "Distributed monolith: independent deploys but coordinated changes — worst of both worlds",
      "Shared database: multiple owners of same schema — kills independent evolution silently",
      "Synchronous chains: each hop multiplies latency and divides availability",
      "Nano-services: so fine-grained they can't operate independently — network overhead with no autonomy",
      "Orchestration sprawl: one god-service coordinating all others — a monolith in disguise",
      "Early detection: if a change requires more than one team's deploy, the boundary is wrong"
    ],

    hint: "Your team deploys every Friday but always needs to coordinate with two other teams for the same release window. Which anti-pattern does this describe and what's the root cause?",

    common_trap: "Treating microservices as a technical architecture pattern rather than an organisational boundary tool. Anti-patterns emerge when technical decomposition doesn't match team ownership — services split across teams, or one team owning multiple loosely related services.",

    follow_up_questions: [
      { text: "How do you detect and fix a distributed monolith without a full rewrite?", type: "inline", mini_answer: "Map your deployment dependency graph — which services always deploy together? That cluster is your distributed monolith. Fix boundary-first: agree new bounded contexts with affected teams, introduce an anti-corruption layer at the seam, migrate one service at a time. Never try to fix boundaries and implementation simultaneously." },
      { text: "How does the Strangler Fig pattern help escape a distributed monolith incrementally?", type: "linked", links_to: "4.1.04", mini_answer: "Strangler Fig routes requests to a new service via a facade while the old tightly-coupled implementation still handles unextracted paths. Each extracted capability reduces coupling incrementally. The key is the facade — it lets you migrate one flow at a time without changing clients." }
    ],

    related: ["1.2.01", "1.2.02", "1.2.03", "4.1.04"],
    has_diagram: false,
    has_code: false,
    tags: ["microservices", "anti-patterns", "distributed-monolith", "architecture", "design-smells"]
  },

  // ── 1.3 Event-Driven Architecture ────────────────────────────────────────

  {
    id: "1.3.01",
    section: 1,
    subsection: "1.3",
    level: "intermediate",
    question: "What is Event-Driven Architecture and how does it differ from request-driven integration?",
    quick_answer: "→ EDA: producers emit events; consumers react asynchronously — no direct coupling\n→ Request-driven: caller blocks waiting for a synchronous response\n→ Events are facts ('OrderPlaced'), not commands ('PlaceOrder')\n→ Broker (Kafka, SNS) decouples producers from consumers entirely\n→ Trade-off: higher resilience & scalability, harder to trace end-to-end flow",
    detailed_answer: "In request-driven integration, service A calls service B and waits for a response. This creates temporal coupling — both services must be up simultaneously — and spatial coupling, since A must know B's address.\n\nIn Event-Driven Architecture (EDA), a producer emits an immutable fact (an event) to a broker without knowing who will consume it. Consumers subscribe and react asynchronously. Neither side is aware of the other.\n\nKey characteristics:\n- Events are immutable facts about something that happened, named in past tense\n- The broker (Kafka, RabbitMQ, SNS/SQS, EventBridge) absorbs the event and handles delivery\n- Producers and consumers can scale, deploy, and fail independently\n- Multiple consumers can react to the same event without the producer changing\n\nThis delivers strong decoupling, natural audit trails (the event log), and resilience — a slow consumer doesn't block the producer. The cost is that you lose the simple mental model of a call stack: distributed tracing and correlation IDs become essential, and eventual consistency must be embraced by the business.",
    key_points: [
      "Events are immutable facts (past tense), not commands or requests",
      "Broker completely decouples producers from consumers — neither knows the other",
      "Temporal decoupling: producer and consumer need not be up at the same time",
      "Multiple consumers can independently react to the same event",
      "Trade-off: resilience and scale vs. harder observability and eventual consistency",
      "Correlation IDs and distributed tracing are mandatory, not optional, in EDA"
    ],
    hint: "What happens to service A if service B is down — in request-driven vs event-driven? Walk through the coupling implications.",
    common_trap: "Naming events as commands ('CreateOrder') rather than facts ('OrderCreated') — this reintroduces hidden coupling and breaks the open/closed principle for consumers.",
    follow_up_questions: [
      { text: "How do Kafka topics and consumer groups implement the pub/sub model?", type: "linked", links_to: "4.3.01", mini_answer: "Kafka topics are partitioned logs. Consumer groups share partitions so each message is processed by one member. Multiple groups each get every message, enabling fan-out without producer changes." },
      { text: "When would you still choose request/response over EDA?", type: "inline", mini_answer: "When you need a synchronous result (user-facing APIs, queries), when the operation is naturally atomic, or when operational simplicity outweighs the resilience benefit — EDA adds broker infrastructure and eventual consistency complexity." },
      { text: "How does choreography compare to orchestration in event-driven systems?", type: "linked", links_to: "1.3.04", mini_answer: "Choreography: each service reacts to events and emits its own — no central coordinator. Orchestration: a central saga/process manager drives the workflow. Choreography is more decoupled; orchestration is easier to reason about." }
    ],
    related: ["4.3.01", "4.3.02", "1.3.02", "1.3.04"],
    has_diagram: true,
    diagram: `Producer → [Broker/Topic] → Consumer A
                          ↘ Consumer B
                          ↘ Consumer C

vs.

Service A ──sync call──→ Service B (blocks until response)`,
    has_code: false,
    tags: ["eda", "event-driven", "messaging", "decoupling", "async", "architecture"]
  },

  {
    id: "1.3.02",
    section: 1,
    subsection: "1.3",
    level: "advanced",
    question: "What are the three message delivery semantics and how do you achieve exactly-once processing in practice?",
    quick_answer: "→ At-most-once: fire and forget — may lose messages\n→ At-least-once: retry on failure — may duplicate; most common default\n→ Exactly-once: hardest — requires idempotent consumers + transactional producers\n→ Kafka: transactional API + idempotent producer gives exactly-once within Kafka\n→ Cross-system: Outbox pattern is the reliable path — no distributed transaction needed",
    detailed_answer: "Three delivery guarantees define the reliability contract between a broker and its consumers:\n\n**At-most-once:** The producer sends once. If the broker or consumer fails, the message is lost. Acceptable for metrics or non-critical notifications but not for business events.\n\n**At-least-once:** The producer retries until acknowledged. The consumer may receive duplicates. This is the default for Kafka, SQS, and most brokers. It's safe if — and only if — consumers are idempotent (processing the same message twice produces the same outcome).\n\n**Exactly-once:** The holy grail. True end-to-end exactly-once requires both the broker and the consumer side-effect to be transactional together.\n\nKafka's approach: enable `enable.idempotence=true` on the producer (sequence numbers deduplicate retries) and use the transactional API (`beginTransaction` / `commitTransaction`) so writes to one topic and reads from another are atomic. This gives exactly-once *within Kafka streams* (read-process-write).\n\nFor cross-system exactly-once (Kafka → database): the Outbox pattern is the standard answer. Write the event to an outbox table in the *same database transaction* as the business change. A separate relay process (Debezium CDC or a poller) publishes it to Kafka. Combined with idempotent consumers (deduplicate by event ID), you achieve effectively-once semantics without a distributed transaction.",
    key_points: [
      "At-least-once + idempotent consumer is the pragmatic path to safe exactly-once behaviour",
      "Kafka's transactional producer/consumer API gives exactly-once within Kafka streams only",
      "Cross-system exactly-once requires the Outbox pattern — write event and business data atomically",
      "Idempotency key: store processed event IDs and reject duplicates on the consumer side",
      "Exactly-once is a spectrum — broker-level, stream-processing level, and end-to-end are different",
      "Saga pattern with compensating transactions handles failures when exactly-once is impossible"
    ],
    hint: "What does a consumer need to do if it receives the same event twice — and how do you ensure the business outcome is the same both times?",
    common_trap: "Assuming Kafka's exactly-once setting covers the full pipeline — it only guarantees exactly-once within Kafka Streams read-process-write loops, not between Kafka and an external database or API.",
    follow_up_questions: [
      { text: "How does the Outbox pattern guarantee at-least-once delivery without a distributed transaction?", type: "linked", links_to: "4.3.05", mini_answer: "Write the event to an outbox table in the same DB transaction as the business mutation. A relay (CDC or poller) reads unpublished rows and publishes to Kafka. On consumer side, deduplicate by event ID. No 2PC needed." },
      { text: "What makes a consumer truly idempotent?", type: "inline", mini_answer: "It must produce the same side-effect regardless of how many times it processes the same message. Techniques: upsert instead of insert, check-then-act with a processed-event-id table, or use natural idempotency (setting a value vs. incrementing it)." },
      { text: "How does a Saga handle partial failure when exactly-once isn't achievable?", type: "linked", links_to: "4.5.02", mini_answer: "Saga breaks a distributed transaction into local transactions with compensating steps. If step N fails, compensations for steps N-1 down to 1 are executed to undo changes. Works with at-least-once delivery if compensations are idempotent." }
    ],
    related: ["4.3.05", "4.3.01", "4.5.02", "1.3.01"],
    has_diagram: false,
    has_code: true,
    code_language: "java",
    code_snippet: `// Kafka exactly-once producer (within Kafka Streams)
Properties props = new Properties();
props.put("enable.idempotence", "true");
props.put("transactional.id", "order-service-tx-1");

KafkaProducer<String, String> producer = new KafkaProducer<>(props);
producer.initTransactions();

try {
    producer.beginTransaction();
    producer.send(new ProducerRecord<>("orders", key, payload));
    producer.send(new ProducerRecord<>("audit-log", key, auditPayload));
    producer.commitTransaction();
} catch (KafkaException e) {
    producer.abortTransaction();
}`,
    tags: ["exactly-once", "at-least-once", "idempotency", "kafka", "outbox", "delivery-semantics"]
  },

  {
    id: "1.3.03",
    section: 1,
    subsection: "1.3",
    level: "intermediate",
    question: "How does Event Sourcing differ from a standard event-driven architecture, and when should you use it?",
    quick_answer: "→ EDA: events notify other services of state changes — source of truth is the DB\n→ Event Sourcing: events ARE the source of truth — state is derived by replaying them\n→ Event Sourcing gives full audit log, temporal queries, and easy event replay\n→ Cost: query complexity (need read models/CQRS), storage growth, schema evolution\n→ Use when: audit is a hard requirement, or you need point-in-time state reconstruction",
    detailed_answer: "Event-Driven Architecture and Event Sourcing are complementary but distinct concepts that are often conflated.\n\n**Standard EDA:** services store their state in a database (the source of truth) and emit events as notifications when state changes. The event is a side-effect — you could delete the event log and the system would still function (state is in the DB).\n\n**Event Sourcing:** the event log *is* the primary store. The current state of an aggregate is reconstructed by replaying all events from the beginning (or from a snapshot). There is no separate 'current state' table — you derive it on demand.\n\nEvent Sourcing benefits:\n- Complete, immutable audit trail by design\n- Temporal queries: what was the order state at 14:32 on Tuesday?\n- Replay events to rebuild projections or fix bugs\n- Natural fit for CQRS — event log feeds read-model projections\n\nEvent Sourcing costs:\n- Queries are not trivial — you must build and maintain read-model projections (CQRS)\n- Schema evolution is hard: old events in the log must still be replayable with new code\n- Storage grows unbounded; snapshots are needed for performance\n- Higher cognitive overhead for teams not familiar with the pattern\n\nUse Event Sourcing when audit is a hard regulatory requirement, when you need point-in-time state, or when the business domain is inherently event-centric (trading, booking, workflow engines). For most CRUD-heavy services, standard EDA with a relational DB is the better trade-off.",
    key_points: [
      "EDA: DB is source of truth, events are notifications. Event Sourcing: events ARE the source of truth",
      "Event Sourcing enables full audit trails and point-in-time state reconstruction",
      "CQRS is almost always required alongside Event Sourcing to make reads practical",
      "Snapshots are needed to avoid replaying thousands of events on every read",
      "Schema evolution is the hardest operational challenge — old events must stay replayable",
      "Don't apply Event Sourcing by default — it adds significant complexity for limited gain in CRUD services"
    ],
    hint: "If you deleted the event log in a standard EDA system, what breaks? If you deleted it in an Event Sourcing system, what breaks? That contrast reveals the core difference.",
    common_trap: "Using Event Sourcing because 'we need an audit log' — a simpler audit table in the same DB gives you the log without the operational complexity of full Event Sourcing.",
    follow_up_questions: [
      { text: "How does CQRS work alongside Event Sourcing?", type: "linked", links_to: "4.5.04", mini_answer: "CQRS separates the write model (append events to log) from read models (projections built by consuming those events). Read models are denormalised for query efficiency. When the event log is replayed, projections are rebuilt." },
      { text: "How do you handle schema evolution when old events must still be replayable?", type: "inline", mini_answer: "Use upcasters: functions that transform old event formats to the current schema at read time. Version your events explicitly. Never mutate historical events — append corrective events instead (a 'compensating event' pattern)." },
      { text: "When does Event Sourcing become a liability?", type: "inline", mini_answer: "When the team isn't familiar with the pattern, when the domain is simple CRUD with no audit requirement, or when projections become stale and hard to rebuild. The complexity cost often outweighs the benefit." }
    ],
    related: ["4.5.04", "4.5.01", "1.3.01", "4.3.01"],
    has_diagram: true,
    diagram: `Standard EDA:
  Service → writes state to DB → emits event to broker
  DB is source of truth

Event Sourcing:
  Service → appends event to event log
  Read model ← rebuilt by replaying events
  Event log IS the source of truth`,
    has_code: false,
    tags: ["event-sourcing", "cqrs", "audit", "eda", "architecture", "ddd"]
  },

  {
    id: "1.3.04",
    section: 1,
    subsection: "1.3",
    level: "intermediate",
    question: "Compare choreography and orchestration for coordinating multi-step workflows in an event-driven system.",
    quick_answer: "→ Choreography: each service reacts to events and emits its own — no central coordinator\n→ Orchestration: a saga/process manager explicitly tells each service what to do\n→ Choreography: maximum decoupling, but workflow logic is implicit and scattered\n→ Orchestration: centralised visibility and control, but the orchestrator becomes a dependency\n→ Choice: choreography for simple flows; orchestration for complex multi-step or long-running sagas",
    detailed_answer: "When multiple services must coordinate to complete a business process (e.g., place order → reserve inventory → charge payment → dispatch), you have two approaches.\n\n**Choreography:** Each service listens for events it cares about, does its work, and emits new events. There is no coordinator — the workflow emerges from the interactions. OrderService emits `OrderCreated` → InventoryService listens, reserves stock, emits `StockReserved` → PaymentService listens, charges, emits `PaymentCharged` → and so on.\n\nPros: services are fully decoupled, no single point of failure, easy to add new participants.\nCons: the workflow is implicit — it lives in event flows, not code. Debugging requires tracing across multiple services. When something goes wrong, understanding the full saga state requires correlating events across the log.\n\n**Orchestration:** A central process manager (saga orchestrator) explicitly calls or commands each service in sequence. It tracks state and handles failures by issuing compensating commands.\n\nPros: workflow logic is in one place, easy to visualise state, simpler to implement compensations.\nCons: the orchestrator is a central dependency, can become a bottleneck or single point of failure, and couples services to the orchestrator.\n\n**Decision rule:** use choreography for simple, well-understood flows with few participants. Use orchestration (sagas) for long-running processes, complex failure handling, or when workflow visibility is a first-class requirement.",
    key_points: [
      "Choreography: workflow emerges from event reactions — no central coordinator needed",
      "Orchestration: a saga/process manager explicitly drives each step and tracks overall state",
      "Choreography maximises decoupling but makes the overall workflow implicit and hard to trace",
      "Orchestration centralises workflow logic — easier to reason about but adds a dependency",
      "Compensating transactions are easier to implement in orchestration (orchestrator tracks what to undo)",
      "Many real systems use both: choreography for simple notifications, orchestration for complex sagas"
    ],
    hint: "Draw out an order fulfilment flow both ways — where does the 'what happens next' logic live in each approach?",
    common_trap: "Assuming choreography is always better because it's more decoupled — for complex multi-step flows with many failure modes, the invisible workflow becomes a debugging and operational nightmare.",
    follow_up_questions: [
      { text: "How does the Saga pattern implement compensating transactions in an orchestrated flow?", type: "linked", links_to: "4.5.02", mini_answer: "The orchestrator tracks each completed step. On failure, it issues compensating commands in reverse order — e.g. CancelReservation, RefundPayment. Compensations must themselves be idempotent. The saga is complete only when all steps or all compensations have run." },
      { text: "How do you correlate events across services in a choreography-based flow?", type: "inline", mini_answer: "Assign a correlation ID (e.g. orderId) at the start of the flow and propagate it in every event. Log aggregation tools (ELK, Datadog) can then filter by correlation ID to reconstruct the full journey across services." },
      { text: "What is the role of a process manager vs a simple saga orchestrator?", type: "inline", mini_answer: "A saga orchestrator manages a single flow instance. A process manager is more general: it reacts to events (not just completion/failure), can spawn sub-processes, and manages long-running state machines that span multiple independent sagas." }
    ],
    related: ["4.5.02", "1.3.01", "4.3.01", "1.2.04"],
    has_diagram: true,
    diagram: `Choreography:
  OrderSvc──►OrderCreated──►InventorySvc──►StockReserved──►PaymentSvc
  (each service reacts, no coordinator)

Orchestration:
  Orchestrator──►reserve(Inventory)
              ◄──StockReserved
              ──►charge(Payment)
              ◄──PaymentCharged
  (one actor drives the sequence)`,
    has_code: false,
    tags: ["choreography", "orchestration", "saga", "eda", "workflow", "distributed-systems"]
  },

  {
    id: "1.3.05",
    section: 1,
    subsection: "1.3",
    level: "advanced",
    question: "How do you design event schemas for long-term evolution without breaking consumers?",
    quick_answer: "→ Version your events explicitly — include a version field in every event envelope\n→ Follow additive-only changes: new optional fields are safe; never remove or rename\n→ Use a schema registry (Confluent, AWS Glue) to enforce compatibility rules\n→ Upcasters transform old versions to current schema at consumer read time\n→ Compatibility modes: backward (new code reads old data), forward (old code reads new data)",
    detailed_answer: "Event schemas are long-lived contracts. Unlike API schemas where you can force clients to upgrade, events in the log may never be reprocessed with old code — which means schema evolution requires careful discipline.\n\n**Core principle: additive-only changes are safe.** Adding a new optional field with a default is backward-compatible. Removing, renaming, or changing the type of a field breaks consumers that depend on that field.\n\n**Schema Registry:** Tools like Confluent Schema Registry (Avro/JSON Schema/Protobuf) enforce compatibility rules at publish time. A producer cannot publish a schema that would break registered consumers — the registry rejects incompatible changes.\n\n**Compatibility modes:**\n- *Backward compatible:* new consumer code can read old events (most common requirement)\n- *Forward compatible:* old consumer code can read new events\n- *Full compatible:* both directions — most restrictive but safest for long-lived events\n\n**Versioning strategies:**\n1. Include a `version` field in the envelope. Consumers switch on version.\n2. Use separate topics per major version (`orders.v1`, `orders.v2`) and run dual-write during migration\n3. Upcasters: functions applied at read time to transform event_v1 → event_v2 before processing\n\n**Protobuf or Avro** are preferred over JSON for event schemas — field tags/IDs survive renames, and the schema is machine-readable for tooling.\n\nFor Event Sourcing systems this is even more critical: old events in the log must be replayable with current code years later — design schemas as if they're forever.",
    key_points: [
      "Additive-only changes (new optional fields) are the only safe evolution path",
      "Schema registry enforces compatibility rules at publish time — catches breaks before production",
      "Backward compatibility means new code reads old events; forward means old code reads new",
      "Version the event envelope explicitly; use upcasters to transform old formats at read time",
      "Protobuf/Avro are safer than JSON — field IDs survive renames, schema is machine-readable",
      "For event-sourced systems, treat every schema as a permanent contract — old events never disappear"
    ],
    hint: "What happens to a consumer if you remove a field it depends on from an event — and how does a schema registry prevent that from reaching production?",
    common_trap: "Treating event schema changes like REST API changes — REST clients can be forced to upgrade; event log consumers may need to replay years of historical data with any version of the schema.",
    follow_up_questions: [
      { text: "How does Protobuf handle backward-compatible schema changes vs JSON?", type: "inline", mini_answer: "Protobuf uses numeric field tags, not names. Renaming a field in code doesn't change the wire format (same tag number). JSON uses string names — rename breaks all consumers. Protobuf also has explicit optional/required semantics and generates typed code." },
      { text: "What is a dead-letter queue strategy for schema mismatches at runtime?", type: "linked", links_to: "4.3.02", mini_answer: "Consumers that fail to deserialise an event (schema mismatch) route it to a DLQ. Ops can inspect, fix the consumer schema, and replay from DLQ. This avoids blocking the main partition while giving visibility into schema drift." },
      { text: "How do you migrate producers and consumers across a breaking event schema change safely?", type: "inline", mini_answer: "Dual-write: producer writes to both v1 and v2 topics. Migrate consumers to v2 one by one. Once all consumers are on v2, stop writing to v1. This gives zero-downtime migration without coordinated deploys." }
    ],
    related: ["4.3.01", "4.3.02", "1.3.03", "1.3.01"],
    has_diagram: false,
    has_code: true,
    code_language: "protobuf",
    code_snippet: `// Safe evolution: add optional field with default
message OrderPlaced {
  string order_id    = 1;  // never change tag numbers
  string customer_id = 2;
  double total_amount = 3;
  // v2 addition — safe, optional, has default
  optional string promo_code = 4;
}`,
    tags: ["schema-evolution", "schema-registry", "avro", "protobuf", "event-versioning", "backward-compatibility"]
  },

  {
    id: "1.3.06",
    section: 1,
    subsection: "1.3",
    level: "advanced",
    question: "How do you guarantee message ordering in a distributed event-driven system, and what are the trade-offs?",
    quick_answer: "→ Kafka: ordering guaranteed within a partition — use the same partition key for related events\n→ Global ordering across all partitions is not possible without sacrificing throughput\n→ Partition key = natural ordering unit (orderId, userId, accountId)\n→ Hot partitions: high-cardinality keys prevent skew\n→ Consumer group: one consumer per partition ensures in-order processing within that partition",
    detailed_answer: "Ordering in distributed messaging is one of the most misunderstood guarantees. The key insight: **you can have total ordering or scalability — rarely both.**\n\n**Kafka's ordering model:** Kafka guarantees order within a single partition. Messages with the same partition key always land in the same partition, so events for a given entity (e.g., all events for `orderId=123`) arrive in the order they were produced.\n\nA consumer in a consumer group is assigned one or more whole partitions. Within its partitions, it processes messages in order. Two consumers in the same group never process the same partition simultaneously.\n\n**Choosing the partition key:** the natural ordering unit is the entity whose events must be ordered. Use `orderId` for order events, `accountId` for account events. This ensures all state changes for one entity are sequenced on one partition, read by one consumer at a time.\n\n**Hot partition problem:** if your key has low cardinality (e.g., region with 3 values), most traffic funnels to 3 partitions. Use high-cardinality keys or a compound key (`region:customerId`) to distribute load.\n\n**Cross-partition ordering:** Kafka cannot guarantee ordering across partitions. If you need a global sequence (rare in practice), you need a single partition (no parallelism) or an external sequencer (e.g., a sequence table in the DB, or a Zookeeper-based monotonic counter).\n\n**Consumer lag:** ordering only helps if the consumer processes one message at a time per partition. Parallel processing within a consumer (e.g., a thread pool) re-introduces out-of-order processing — you need to re-sequence by offset if you do this.",
    key_points: [
      "Kafka guarantees ordering within a partition — use the entity ID as the partition key",
      "One consumer per partition per group ensures in-order processing without competition",
      "Global ordering across all partitions requires a single partition — eliminates horizontal scale",
      "Hot partitions arise from low-cardinality keys — choose keys with high cardinality",
      "Parallel processing within a consumer (thread pools) breaks per-partition ordering guarantees",
      "Design for 'ordering where it matters' not global ordering — identify the natural ordering unit"
    ],
    hint: "What is the smallest unit of data that must be processed in order? That tells you what the partition key should be.",
    common_trap: "Assuming Kafka guarantees global ordering across all topics or all partitions — it only guarantees within a single partition. Architects who skip this end up with race conditions on shared state.",
    follow_up_questions: [
      { text: "How does message ordering interact with consumer group scaling?", type: "inline", mini_answer: "Adding consumers to a group up to the partition count adds parallelism without breaking ordering — each partition is still processed by one consumer. Beyond the partition count, extra consumers sit idle. Rebalancing temporarily pauses processing." },
      { text: "How do you handle out-of-order event arrival in a consumer that can't control partition assignment?", type: "inline", mini_answer: "Use an event timestamp or sequence number in the payload. Buffer events in a small in-memory or Redis window, sort by sequence, and process in order. Set a maximum wait time and process whatever is available after the timeout." },
      { text: "How does Kafka compare to SQS FIFO queues for ordering guarantees?", type: "linked", links_to: "4.3.01", mini_answer: "SQS FIFO guarantees ordering within a message group ID (similar to Kafka partition key) with a max 300 msg/s per group. Kafka partitions have no throughput cap. SQS FIFO is simpler operationally; Kafka scales higher and retains messages for replay." }
    ],
    related: ["4.3.01", "4.3.10", "1.3.01", "1.3.02"],
    has_diagram: true,
    diagram: `Partition key = orderId

orderId=A → Partition 0 → Consumer 1  (A events in order)
orderId=B → Partition 1 → Consumer 2  (B events in order)
orderId=C → Partition 0 → Consumer 1  (C events in order, interleaved with A)

⚠ No ordering guarantee between Partition 0 and Partition 1`,
    has_code: false,
    tags: ["ordering", "kafka", "partitioning", "consumer-groups", "messaging", "distributed-systems"]
  },

  // ── 1.4 API Design & Integration ─────────────────────────────────────────

  {
    id: "1.4.01",
    section: 1,
    subsection: "1.4",
    level: "basic",
    question: "What are the six REST constraints and why does statelessness matter most in practice?",
    quick_answer: "→ Six constraints: client-server, stateless, cacheable, uniform interface, layered system, code-on-demand\n→ Stateless: each request carries all context — server holds no session state\n→ Enables horizontal scaling — any instance can serve any request\n→ Simplifies failure recovery — no session to lose on crash\n→ Uniform interface (resources + verbs + representations) is what makes REST recognisable",
    detailed_answer: "REST (Representational State Transfer) is an architectural style defined by six constraints, not a protocol or standard.\n\n**The six constraints:**\n1. **Client-Server** — UI and data storage concerns are separated; they evolve independently\n2. **Stateless** — each request must contain all information needed to process it; the server stores no session state between requests\n3. **Cacheable** — responses must declare themselves cacheable or non-cacheable; enables CDN and client-side caching\n4. **Uniform Interface** — resources are identified by URIs, manipulated through representations, messages are self-descriptive, and HATEOAS links drive state transitions\n5. **Layered System** — client cannot tell whether it's connected directly to the server or an intermediary (gateway, load balancer, cache)\n6. **Code-on-Demand** (optional) — servers can send executable code (JavaScript) to clients\n\n**Why statelessness matters most:** it is the constraint with the biggest architectural impact. Because no session lives on the server, every instance is interchangeable — requests can route to any node, making horizontal scaling trivial. Failure recovery is clean: when a server crashes, the client retries to any surviving instance. The trade-off is that clients must send credentials or tokens on every request, and payloads can be larger.\n\nMost APIs called 'RESTful' implement client-server, stateless, and uniform interface. Full HATEOAS (links in responses driving navigation) is rare in practice.",
    key_points: [
      "Six constraints: client-server, stateless, cacheable, uniform interface, layered system, code-on-demand",
      "Statelessness enables horizontal scaling — any instance handles any request without affinity",
      "Uniform interface = resources (nouns), HTTP verbs (actions), representations (JSON/XML), HATEOAS",
      "Layered system allows gateways, caches, and load balancers transparently between client and server",
      "Most production APIs are not fully RESTful — HATEOAS is rarely implemented",
      "Statelessness pushes session state to the client (tokens) or a shared store (Redis) — a deliberate trade-off"
    ],
    hint: "If a server crash loses all in-memory session data, which REST constraint determines whether clients can recover without re-logging in?",
    common_trap: "Calling any JSON-over-HTTP API 'RESTful' — true REST requires statelessness and uniform interface at minimum; many APIs are really just 'HTTP APIs' with none of the architectural constraints applied.",
    follow_up_questions: [
      { text: "How does HATEOAS work and why is it rarely implemented?", type: "inline", mini_answer: "HATEOAS embeds links in responses so clients discover actions dynamically (like a browser following hrefs). Rarely implemented because it adds payload size and client complexity, and most API consumers are code that already knows the contract — not a generic browser." },
      { text: "How does an API gateway enforce statelessness across a microservices fleet?", type: "linked", links_to: "1.4.04", mini_answer: "The gateway routes requests to any backend instance and handles cross-cutting concerns (auth, rate limiting) without session affinity. Each backend service is stateless; the gateway itself is stateless too — state lives in the token or a shared cache." },
      { text: "When would you break the stateless constraint intentionally?", type: "inline", mini_answer: "Long-running streaming connections (WebSocket, SSE) maintain server-side state by design. Also, some high-frequency trading or real-time gaming scenarios pin clients to instances for latency reasons — they accept the scaling trade-off explicitly." }
    ],
    related: ["1.4.02", "1.4.04", "7.3.01", "4.4.01"],
    has_diagram: false,
    has_code: false,
    tags: ["rest", "stateless", "http", "api-design", "constraints", "architecture"]
  },

  {
    id: "1.4.02",
    section: 1,
    subsection: "1.4",
    level: "intermediate",
    question: "Compare REST, GraphQL, and gRPC — how do you choose between them for a given use case?",
    quick_answer: "→ REST: resource-oriented, HTTP/JSON, universal client support — default for public APIs\n→ GraphQL: client-driven queries, single endpoint, eliminates over/under-fetching — ideal for complex UIs\n→ gRPC: binary (Protobuf), HTTP/2, strongly typed, high-throughput — ideal for internal service-to-service\n→ Decision axes: client control needed? → GraphQL. Internal high-perf? → gRPC. Public/simple? → REST",
    detailed_answer: "Each protocol solves a different problem.\n\n**REST** is the default. Resources are nouns, HTTP verbs are actions, JSON is the representation. Universally supported, human-readable, easy to cache, firewall-friendly. Weaknesses: over-fetching (getting more fields than needed) and under-fetching (needing multiple round-trips to assemble a view).\n\n**GraphQL** gives clients control over the shape of the response. A single endpoint accepts a query specifying exactly which fields are needed. Eliminates over/under-fetching, great for mobile clients where bandwidth matters. Weaknesses: complex query execution can cause N+1 database problems, caching is harder (POST bodies vs GET URLs), schema management adds overhead. Best fit: product APIs consumed by complex, rapidly evolving UIs.\n\n**gRPC** uses Protobuf (binary serialisation) over HTTP/2. Strongly typed contracts defined in `.proto` files generate client and server code in any language. Multiplexed streams over a single connection, significantly lower latency and bandwidth than JSON/HTTP. Weaknesses: browser support is limited (requires gRPC-web proxy), binary format is not human-readable, harder to debug. Best fit: internal microservice-to-microservice communication where performance matters.\n\n**Decision framework:**\n- Public API or third-party consumption → REST\n- Complex UI, mobile client, many fields → GraphQL\n- Internal services, high throughput, polyglot → gRPC\n- Streaming or bidirectional communication → gRPC (streaming RPC) or WebSocket",
    key_points: [
      "REST: resource-oriented, HTTP verbs, JSON — universal support, easy caching, but over/under-fetching",
      "GraphQL: client-defined queries — eliminates over/under-fetch, but harder caching and N+1 risk",
      "gRPC: Protobuf + HTTP/2 — high performance and strong typing, but poor browser support",
      "REST is the right default for public APIs; gRPC for internal service mesh; GraphQL for product UIs",
      "GraphQL N+1 is solved by DataLoader (batching); gRPC browser gaps by grpc-web or transcoding",
      "You can use all three in the same system — public REST gateway → internal gRPC services"
    ],
    hint: "A mobile app needs to fetch a user profile — name, avatar, last 3 orders, unread notifications — in one request. Which protocol handles this most cleanly and why?",
    common_trap: "Choosing GraphQL for a simple internal API because it sounds modern — the schema overhead and N+1 complexity aren't worth it unless you have real over/under-fetching problems or multiple heterogeneous clients.",
    follow_up_questions: [
      { text: "How do you solve the N+1 query problem in GraphQL?", type: "inline", mini_answer: "Use DataLoader: it batches all resolver calls for a field within a single request tick, converts N individual DB queries into one batch query, then distributes results. Facebook open-sourced it; most GraphQL frameworks have an equivalent." },
      { text: "How does gRPC streaming work and when would you use it?", type: "inline", mini_answer: "gRPC supports four modes: unary (one request, one response), server streaming, client streaming, and bidirectional streaming — all over a single HTTP/2 connection. Use for real-time feeds, large file transfer, or chat where keeping a long-lived connection is preferable to polling." },
      { text: "How does a BFF pattern help when you have REST externally but gRPC internally?", type: "linked", links_to: "4.4.01", mini_answer: "The BFF (Backend for Frontend) is a thin REST/GraphQL facade tailored to one client type. It translates client requests into gRPC calls to internal services, aggregates results, and returns a client-optimised response — hiding internal protocol complexity from external consumers." }
    ],
    related: ["1.4.01", "1.4.03", "1.4.04", "4.4.01"],
    has_diagram: true,
    diagram: `REST:    Client ──GET /users/1/orders──► Server  (fixed shape response)

GraphQL: Client ──POST /graphql──► Server
         query { user(id:1) { name orders { id total } } }  (client picks fields)

gRPC:    Client ──UserService.GetOrders(req)──► Server  (Protobuf binary, HTTP/2)`,
    has_code: false,
    tags: ["rest", "graphql", "grpc", "api-design", "protocol-selection", "microservices"]
  },

  {
    id: "1.4.03",
    section: 1,
    subsection: "1.4",
    level: "intermediate",
    question: "What are the main API versioning strategies and how do you choose between them?",
    quick_answer: "→ URI versioning (/v1/users): visible, cacheable, easy to route — most common\n→ Header versioning (Accept: application/vnd.api+json;version=1): clean URLs, harder to test in browser\n→ Query param (?version=1): simple but pollutes query space\n→ No versioning (evolution): additive-only changes, never break — requires strict discipline\n→ Rule: URI versioning for public APIs; evolution strategy for internal services",
    detailed_answer: "API versioning is how you evolve a public contract without breaking existing consumers.\n\n**URI versioning** (`/v1/users`, `/v2/users`): the version is in the path. Pros: obvious, cacheable by URL, easy to route at the gateway level, simple to test in a browser or curl. Cons: 'dirty' URLs, clients must update all their base URLs on major version bumps. This is the most widely used approach (Stripe, Twilio, GitHub all use it).\n\n**Header versioning** (`Accept: application/vnd.api+json;version=2` or custom `API-Version: 2` header): the URL stays clean. Pros: semantically cleaner — the resource identity (URL) doesn't change, just the representation. Cons: harder to test without tooling, not cacheable at CDN level by default (need `Vary` header), and less obvious to API consumers.\n\n**Query parameter** (`/users?version=2`): simple to add. Pros: no URL structure change, easy to test. Cons: version pollutes query space, caching is awkward, semantically wrong (version is not a filter).\n\n**Evolutionary (no explicit versioning):** add only optional fields, never remove or rename. Consumers must tolerate unknown fields. Works well for internal APIs where you control all consumers. Requires strict discipline — one accidental breaking change can cascade.\n\n**In practice:** use URI versioning for public/external APIs where consumers are out of your control. Use evolutionary for internal service-to-service APIs where you can coordinate deployments. Never mix strategies in the same API family.",
    key_points: [
      "URI versioning is the most pragmatic for public APIs — visible, cacheable, easy to route",
      "Header versioning keeps URLs clean but sacrifices CDN cacheability without careful Vary headers",
      "Evolutionary approach (additive-only) works for internal APIs with coordinated deployments",
      "A major version bump signals breaking changes; minor versions should always be additive",
      "Maintain at most two major versions simultaneously — deprecate old versions with sunset headers",
      "Sunset header (RFC 8594) is the standard way to communicate deprecation timelines to clients"
    ],
    hint: "A third-party mobile app is calling your API and you can't force them to upgrade. Which versioning strategy gives you the most control over routing and deprecation?",
    common_trap: "Incrementing the major version for every change — this trains consumers to ignore version bumps. Reserve major versions for genuinely breaking changes; use additive evolution within a version.",
    follow_up_questions: [
      { text: "How do you deprecate an old API version without breaking existing clients?", type: "inline", mini_answer: "Set a Sunset header (RFC 8594) in responses advertising the shutdown date. Log which clients are still hitting the old version. Notify them via email/docs. Run both versions in parallel until traffic drops to zero, then retire. Never hard-delete — redirect old endpoints with 301 or a clear error message." },
      { text: "How does an API gateway help manage multiple live API versions?", type: "linked", links_to: "1.4.04", mini_answer: "The gateway routes /v1/* to old backend, /v2/* to new backend. This lets you run versions as separate deployments, apply different rate limits or auth policies per version, and gradually drain traffic from the old version without touching client code." },
      { text: "How does schema evolution in event APIs differ from REST API versioning?", type: "linked", links_to: "1.3.05", mini_answer: "REST clients can be forced to upgrade on the next request. Event consumers may replay historical events years later — old schemas must remain decodable forever. Event schema evolution requires schema registries, upcasters, and version fields in the event envelope from day one." }
    ],
    related: ["1.4.01", "1.4.02", "1.4.04", "1.3.05"],
    has_diagram: false,
    has_code: true,
    code_language: "bash",
    code_snippet: `# URI versioning — most common
GET /v1/users/123
GET /v2/users/123

# Header versioning
GET /users/123
Accept: application/vnd.myapi+json;version=2

# Sunset header — deprecation signal (RFC 8594)
HTTP/1.1 200 OK
Sunset: Sat, 31 Dec 2026 23:59:59 GMT
Deprecation: true`,
    tags: ["api-versioning", "rest", "backward-compatibility", "api-design", "deprecation"]
  },

  {
    id: "1.4.04",
    section: 1,
    subsection: "1.4",
    level: "intermediate",
    question: "What does an API gateway do, when do you need one, and what are the risks of centralising too much logic in it?",
    quick_answer: "→ API gateway: single entry point handling routing, auth, rate limiting, SSL termination, logging\n→ Need one when: multiple clients, multiple backend services, cross-cutting concerns repeat everywhere\n→ Risks: single point of failure, becomes a bottleneck, logic creep turns it into a monolith\n→ Rule: keep the gateway thin — routing and cross-cutting only; business logic stays in services\n→ Patterns: single gateway, BFF per client type, or service mesh for east-west traffic",
    detailed_answer: "An API gateway is a reverse proxy that sits between external clients and your backend services. It handles concerns that would otherwise need to be duplicated in every service.\n\n**What it does:**\n- Request routing — maps URL paths to backend services\n- Authentication & authorisation — validates tokens before requests reach services\n- Rate limiting & throttling — protects backends from abuse\n- SSL/TLS termination — decrypts HTTPS at the edge; backends use HTTP internally\n- Request/response transformation — header manipulation, protocol translation (REST → gRPC)\n- Logging, tracing, metrics — centralised observability without touching service code\n- Caching — cache responses for idempotent endpoints\n\n**When you need one:** as soon as you have more than one backend service and more than one client type. Without a gateway, each client must know each service's address, and each service must implement auth, rate limiting, and logging independently.\n\n**Risks of over-centralisation:** the gateway becomes a single point of failure (mitigate with redundancy), a performance bottleneck (every request passes through it), and a maintenance burden if teams push business logic into it. Gateways that do content-based routing or data transformation become the new monolith.\n\n**Patterns:** a single gateway for simple systems; BFF (Backend for Frontend) gateways tailored per client type (mobile BFF, web BFF) for complex product APIs; a service mesh (Istio, Linkerd) for east-west (service-to-service) traffic where a gateway doesn't apply.",
    key_points: [
      "API gateway centralises cross-cutting concerns: auth, rate limiting, routing, SSL, logging",
      "Every request passes through it — must be highly available and horizontally scalable",
      "Keep it thin: routing and cross-cutting only; business logic belongs in services",
      "BFF pattern: separate gateway per client type, each optimised for that client's needs",
      "Service mesh handles east-west traffic; API gateway handles north-south (external) traffic",
      "Gateway failure = total outage — design for redundancy and circuit breaking at the gateway level"
    ],
    hint: "If every backend service had to implement authentication, rate limiting, and logging independently, what problems would you face at scale — and how does a gateway solve them?",
    common_trap: "Putting business logic (pricing rules, eligibility checks, data aggregation) in the gateway — this creates a hidden monolith that no single team owns and is impossible to test independently.",
    follow_up_questions: [
      { text: "How does a BFF differ from a standard API gateway?", type: "linked", links_to: "4.4.01", mini_answer: "A standard gateway is generic — all clients share it. A BFF is a purpose-built gateway for one client type (mobile, web, partner). Each BFF is owned by the team building that client, aggregates only the data that client needs, and can evolve independently without impacting other clients." },
      { text: "What is a service mesh and how does it complement an API gateway?", type: "inline", mini_answer: "A service mesh (Istio, Linkerd) handles east-west traffic between internal services — mutual TLS, retries, circuit breaking, tracing — without code changes via sidecar proxies. The API gateway handles north-south (external → internal). They're complementary, not alternatives." },
      { text: "How do you prevent the API gateway becoming a single point of failure?", type: "inline", mini_answer: "Run multiple gateway instances behind a load balancer. Keep the gateway stateless so any instance handles any request. Use health checks and auto-scaling. Circuit break downstream services at the gateway level so one failing service doesn't cascade. Test gateway failover regularly." }
    ],
    related: ["4.4.01", "1.4.01", "1.4.02", "7.3.01"],
    has_diagram: true,
    diagram: `           ┌─────────────────────────────┐
           │        API Gateway          │
           │  auth · rate-limit · route  │
           └──────┬──────────┬───────────┘
                  │          │
           ┌──────▼──┐  ┌────▼─────┐
           │ Order   │  │  User    │
           │ Service │  │  Service │
           └─────────┘  └──────────┘`,
    has_code: false,
    tags: ["api-gateway", "bff", "service-mesh", "architecture", "cross-cutting-concerns", "microservices"]
  },

  {
    id: "1.4.05",
    section: 1,
    subsection: "1.4",
    level: "intermediate",
    question: "What is idempotency in API design, which HTTP methods must be idempotent, and how do you implement idempotency keys?",
    quick_answer: "→ Idempotent: calling the same operation N times produces the same result as calling it once\n→ Must be idempotent: GET, PUT, DELETE, HEAD, OPTIONS — by HTTP spec\n→ Not idempotent by default: POST (creates new resource each call)\n→ Idempotency key: client sends unique key; server deduplicates by storing key + result\n→ Critical for payment APIs — retry-safe without double-charging",
    detailed_answer: "Idempotency means that repeating an operation produces the same outcome as performing it once. It is essential for safe retries in distributed systems — networks fail, timeouts occur, and clients must be able to retry without causing duplicate side-effects.\n\n**HTTP method idempotency by spec:**\n- `GET`, `HEAD`, `OPTIONS` — safe (no side effects) and idempotent\n- `PUT` — idempotent: `PUT /users/123` with the same body always produces the same state\n- `DELETE` — idempotent: deleting an already-deleted resource returns 404, but the system state is the same\n- `POST` — **not** idempotent by default: `POST /orders` creates a new order each time\n- `PATCH` — depends on the operation: `PATCH {amount: 100}` (set) is idempotent; `PATCH {amount: +10}` (increment) is not\n\n**Idempotency keys for POST:** the client generates a unique key (UUID) per logical operation and sends it as a header (`Idempotency-Key: <uuid>`). The server stores the key and the result in a durable store (DB or Redis). On receipt, it checks: if the key exists, return the cached result without re-executing. If not, execute and store. Stripe, PayPal, and most payment APIs use this pattern.\n\n**Implementation considerations:** the key must be stored atomically with the response. Use a database row with a unique constraint on the key — concurrent duplicate requests will race; only one wins (the other reads the stored result). Expire keys after a reasonable window (24h–7d).",
    key_points: [
      "Idempotent: N identical calls produce the same state as one call — essential for safe retries",
      "GET, PUT, DELETE, HEAD, OPTIONS are idempotent by HTTP spec; POST and some PATCHes are not",
      "Idempotency keys let POST operations be made retry-safe — client generates UUID per logical op",
      "Server stores key + result atomically; duplicate requests return cached result without re-executing",
      "Use a unique constraint on the key column to handle concurrent duplicate requests correctly",
      "Always expire idempotency keys — stale keys accumulate and consume storage indefinitely"
    ],
    hint: "A payment API request times out — the client doesn't know if the charge succeeded. How do you design the API so the client can safely retry without double-charging the customer?",
    common_trap: "Assuming PUT is always safe to retry because it's idempotent — it is, but only if the full resource representation is sent. A partial PUT that recalculates values on the server side may not be idempotent in practice.",
    follow_up_questions: [
      { text: "How does idempotency key storage interact with distributed transactions?", type: "linked", links_to: "4.4.07", mini_answer: "Store the idempotency key in the same database transaction as the business mutation. If the transaction rolls back, the key is also rolled back — so a retry correctly re-executes rather than returning a stale 'success' response from a failed transaction." },
      { text: "How do you handle idempotency when the operation spans multiple services?", type: "inline", mini_answer: "Propagate the idempotency key downstream. Each service checks its own idempotency table for the key. If the orchestrating service retries, each downstream service independently deduplicates. Use the Saga pattern so partial completions can be detected and compensated." },
      { text: "What is the difference between idempotency and safety in HTTP?", type: "inline", mini_answer: "Safe methods (GET, HEAD) have no side effects — they don't modify state. Idempotent methods may have side effects but repeating them produces the same state. All safe methods are idempotent; not all idempotent methods are safe (DELETE has a side effect but is idempotent)." }
    ],
    related: ["4.4.07", "1.4.01", "1.4.03", "4.2.04"],
    has_diagram: false,
    has_code: true,
    code_language: "bash",
    code_snippet: `# Client generates unique key per logical operation
POST /payments
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
{ "amount": 9900, "currency": "GBP", "card": "tok_abc" }

# Server: first call → execute + store result
# Server: retry with same key → return stored result, no re-charge`,
    tags: ["idempotency", "api-design", "http", "retries", "payments", "distributed-systems"]
  },

  {
    id: "1.4.06",
    section: 1,
    subsection: "1.4",
    level: "advanced",
    question: "What is contract-first API design, how does it differ from code-first, and what tooling enables it?",
    quick_answer: "→ Contract-first: define the API spec (OpenAPI/Protobuf) before writing any code\n→ Code-first: write the implementation, generate docs/spec from annotations\n→ Contract-first enables: parallel development, mock servers, early consumer feedback\n→ OpenAPI → REST; Protobuf → gRPC; AsyncAPI → event-driven\n→ Rule: contract-first for APIs with external consumers; code-first for internal rapid iteration",
    detailed_answer: "**Code-first** is the natural path: you write the implementation, annotate it, and a tool (Swagger annotations, Spring REST Docs) generates the API spec or documentation. Fast to start, but the spec is a side-effect of the code — consumers can't work until the server is built, and design decisions get locked in early because refactoring real code is painful.\n\n**Contract-first** inverts this: you design and agree on the API spec (OpenAPI YAML, Protobuf `.proto` file) before writing a single line of implementation code. The spec is the source of truth; code is generated from it or validated against it.\n\n**Advantages of contract-first:**\n- Frontend and backend teams develop in parallel using generated mock servers\n- Consumers review and comment on the contract before any code is written — cheapest time to change the design\n- Generated client SDKs (from OpenAPI or Protobuf) are always in sync with the server\n- Contract tests validate that the live server honours the spec\n- Schema registries and versioning are first-class concerns from day one\n\n**Tooling:**\n- REST: OpenAPI 3.x spec → `openapi-generator` produces server stubs and client SDKs; Prism generates mock servers from the spec\n- gRPC: Protobuf `.proto` → `protoc` generates typed stubs in any language; Buf enforces linting and breaking-change detection\n- Events: AsyncAPI spec describes event-driven APIs the same way OpenAPI describes REST\n\n**When to use code-first:** internal services under rapid iteration where consumers are the same team and design is in flux. When the API is exploratory and the contract will change frequently, the overhead of maintaining a spec first slows you down.",
    key_points: [
      "Contract-first: spec is source of truth — code is generated from or validated against it",
      "Enables parallel development: frontend mocks the spec while backend implements it",
      "Consumer review of the contract happens before implementation — changes are cheap at this stage",
      "OpenAPI → REST stubs and SDKs; Protobuf → gRPC stubs; AsyncAPI → event-driven contracts",
      "Buf tool enforces Protobuf linting and detects breaking changes in CI — equivalent of schema registry for gRPC",
      "Contract tests (Pact, Dredd) verify the live server honours the spec — catches drift between spec and implementation"
    ],
    hint: "Your mobile team and backend team need to build a new feature simultaneously to hit the same deadline. How does contract-first unblock parallel development?",
    common_trap: "Treating the OpenAPI spec as documentation generated from code (code-first with Swagger) and calling it 'contract-first' — the spec must precede the code and be independently reviewed to get the design benefits.",
    follow_up_questions: [
      { text: "How do consumer-driven contract tests (Pact) differ from provider API tests?", type: "inline", mini_answer: "Provider tests check the server returns valid responses. Pact tests are written by the consumer — they describe exactly what the consumer uses from the API. The provider runs the consumer's Pact file against its real implementation. If the provider breaks a consumer's expectation, the Pact test fails — even if the provider's own tests pass." },
      { text: "How does Buf enforce backward compatibility in Protobuf contracts?", type: "inline", mini_answer: "Buf's breaking-change detector compares the current .proto files against a baseline (stored in a registry or git tag) and fails CI if any breaking change is detected — removed fields, changed field numbers, renamed enums. It's the Protobuf equivalent of a schema registry compatibility check." },
      { text: "How does contract-first API design interact with API versioning strategy?", type: "linked", links_to: "1.4.03", mini_answer: "With contract-first, the spec for each version is an explicit artefact (openapi-v1.yaml, openapi-v2.yaml). Breaking changes require a new spec file and a version bump — the contract review process naturally enforces version discipline. Code-first makes version boundaries implicit and easy to accidentally cross." }
    ],
    related: ["1.4.02", "1.4.03", "1.3.05", "1.4.01"],
    has_diagram: false,
    has_code: true,
    code_language: "yaml",
    code_snippet: `# OpenAPI 3 — contract defined before implementation
openapi: 3.0.3
info:
  title: Orders API
  version: 1.0.0
paths:
  /orders:
    post:
      summary: Place a new order
      parameters:
        - in: header
          name: Idempotency-Key
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/OrderRequest' }
      responses:
        '201': { description: Order created }
        '409': { description: Duplicate idempotency key }`,
    tags: ["contract-first", "openapi", "protobuf", "api-design", "developer-experience", "tooling"]
  },

  // ── 1.5 Monolith to Microservices Migration ───────────────────────────────

  {
    id: "1.5.01",
    section: 1,
    subsection: "1.5",
    level: "intermediate",
    question: "When is migrating from a monolith to microservices genuinely justified, and when is it the wrong move?",
    quick_answer: "→ Justified: independent scaling needs, team autonomy blocked by deploy coupling, polyglot requirements\n→ Wrong move: small team, premature scaling, simple domain, organisational chaos\n→ Conway's Law: your architecture will mirror your org structure — fix the org first\n→ Start with a modular monolith, not microservices — extract only when the pain is real\n→ Rule: microservices solve people and scaling problems, not technical complexity",
    detailed_answer: "Microservices are an organisational and operational solution, not a technical one. The decision to migrate should be driven by concrete pain, not architectural fashion.\n\n**Migrate when:**\n- Teams are blocked by each other — a deploy in one area requires coordinating across all teams\n- Specific parts of the system need to scale independently (e.g. a search service vs a billing service)\n- Different parts of the system have different reliability, language, or release cadence requirements\n- The team has grown large enough that a monolith creates coordination overhead (roughly: >2 pizza teams working on the same codebase)\n\n**Do not migrate when:**\n- You have a small team — microservices add operational complexity that overwhelms a team of 3-5\n- The domain is not well understood — extracting the wrong boundaries creates a distributed monolith\n- You're hoping microservices will fix a poorly structured codebase — they won't; they distribute the mess\n- You lack the operational maturity for containerisation, service discovery, distributed tracing, and on-call\n\n**Conway's Law:** organisations design systems that mirror their communication structures. If your org is a single team with no autonomy boundaries, your microservices will be tightly coupled. Fix the team structure before the architecture.\n\n**Better starting point:** a well-structured modular monolith with clear internal boundaries. This gives you deployment simplicity while preserving the option to extract services later with confidence — because the boundaries are already clean.",
    key_points: [
      "Microservices solve team autonomy and independent scaling problems — not raw technical complexity",
      "Conway's Law: architecture mirrors org structure — misaligned teams produce coupled services",
      "A modular monolith is a better starting point than premature service extraction",
      "Prerequisites: operational maturity (containers, tracing, service discovery, on-call) must exist first",
      "Extract services when there is specific, demonstrated pain — not speculatively",
      "Wrong boundaries extracted too early become a distributed monolith — harder to fix than a monolith"
    ],
    hint: "A startup of 4 engineers wants to go microservices from day one. What questions would you ask to challenge that decision?",
    common_trap: "Assuming microservices = modern = better. The hidden costs — network latency, distributed tracing, service discovery, operational overhead — only pay off when the organisational scaling benefits are real.",
    follow_up_questions: [
      { text: "What is a modular monolith and how does it prepare you for future extraction?", type: "inline", mini_answer: "A modular monolith enforces internal package/module boundaries (no direct cross-module DB calls, events or APIs between modules) while deploying as one unit. When a module grows large enough to need independent scaling or team ownership, the clean boundary makes extraction low-risk." },
      { text: "How do you identify which parts of the monolith to extract first?", type: "linked", links_to: "1.5.03", mini_answer: "Extract high-value, low-dependency modules first. Look for: areas with different scaling needs, different release cadences, clear domain boundaries (DDD bounded contexts), or where team ownership is already distinct. Avoid extracting anything with deep shared-DB coupling until the data boundary is solved." },
      { text: "What does a distributed monolith look like and why is it worse than the original?", type: "linked", links_to: "1.5.06", mini_answer: "A distributed monolith splits the codebase into separate deployable services but keeps tight coupling — synchronous chains, shared databases, coordinated deploys. You get all the operational complexity of microservices with none of the independence benefits. It's the worst possible outcome." }
    ],
    related: ["1.5.02", "1.5.03", "1.5.06", "1.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["monolith", "microservices", "migration", "conways-law", "modular-monolith", "architecture"]
  },

  {
    id: "1.5.02",
    section: 1,
    subsection: "1.5",
    level: "intermediate",
    question: "How does the Strangler Fig pattern work for migrating a monolith, and what are its critical success factors?",
    quick_answer: "→ Strangler Fig: incrementally route traffic from monolith to new services via a facade\n→ No big-bang rewrite — old and new coexist; monolith shrinks as services grow\n→ Facade (proxy/gateway) intercepts all requests and routes by feature\n→ Critical: facade must be thin, migration must be vertical slices, rollback must be instant\n→ Risk: facade becomes a bottleneck or new monolith if logic leaks into it",
    detailed_answer: "The Strangler Fig pattern (named after the fig tree that grows around and eventually replaces its host) is the primary strategy for migrating a monolith without a risky big-bang rewrite.\n\n**How it works:**\n1. Place a facade (API gateway, reverse proxy, or thin routing layer) in front of the monolith — all traffic goes through it\n2. Identify a vertical slice of functionality to extract (e.g. user authentication)\n3. Build the new service independently\n4. Update the facade to route requests for that slice to the new service\n5. Validate in production — both paths are live\n6. Decommission that code from the monolith\n7. Repeat for the next slice\n\n**The monolith shrinks incrementally.** At no point is the entire system non-functional. You can pause the migration, roll back individual slices, and iterate.\n\n**Critical success factors:**\n- **Thin facade:** the proxy routes traffic only — no business logic. Logic in the facade is the seed of a new monolith\n- **Vertical slices:** extract whole features end-to-end (API + DB + business logic) — not horizontal layers (don't extract 'all controllers' as one step)\n- **Feature flags or header-based routing:** enable instant rollback to the monolith path if the new service misbehaves\n- **Data boundary:** agree on who owns the data for the extracted slice — shared DB is a temporary crutch, not a destination\n- **Observability:** both the monolith path and new service path must be instrumented to compare behaviour",
    key_points: [
      "Facade sits in front of the monolith and incrementally routes slices to new services",
      "No big-bang rewrite — old and new run simultaneously; monolith shrinks over time",
      "Extract vertical slices (full feature) not horizontal layers (all of one type of component)",
      "Keep the facade thin — routing only; business logic in the facade creates a new monolith",
      "Feature flags at the facade enable instant rollback without redeployment",
      "Data ownership must be resolved for each extracted slice — shared DB is temporary"
    ],
    hint: "Why is extracting 'all the controllers' as one step the wrong approach — and what makes a vertical slice the right unit?",
    common_trap: "Routing by URL prefix without resolving data ownership — the new service ends up reading from the monolith's database, creating a hidden coupling that prevents the monolith from ever being retired.",
    follow_up_questions: [
      { text: "How does the Strangler Fig relate to the integration patterns in Section 4.4?", type: "linked", links_to: "4.4.04", mini_answer: "4.4.04 covers Strangler Fig as an integration pattern — specifically how the facade intercepts and proxies traffic. The key addition is anti-corruption layer (ACL) between the new service and monolith domain models, preventing the monolith's messy model from contaminating the clean new service." },
      { text: "How do you handle database migration alongside the Strangler Fig?", type: "linked", links_to: "1.5.04", mini_answer: "Initially the new service can read/write the monolith's DB (shared schema, temporary). Gradually introduce a separate DB for the service, using dual-write or CDC to sync. Cut over reads, then writes, then remove the shared table from the monolith's schema. Never leave the shared DB permanently." },
      { text: "What is the anti-corruption layer and when do you need it?", type: "inline", mini_answer: "An ACL translates between the monolith's domain model and the new service's clean domain model. Without it, the new service adopts the monolith's legacy concepts and naming — the technical debt propagates. The ACL is a translation boundary, not business logic." }
    ],
    related: ["4.1.04", "4.4.04", "1.5.01", "1.5.04", "1.5.06"],
    has_diagram: true,
    diagram: `Before:  Client ──────────────────► Monolith

During:  Client ──► Facade/Proxy ──► Monolith (most traffic)
                         │
                         └──────────► New Service (extracted slice)

After:   Client ──► Facade/Proxy ──► New Services (monolith retired)`,
    has_code: false,
    tags: ["strangler-fig", "migration", "monolith", "microservices", "facade", "incremental"]
  },

  {
    id: "1.5.03",
    section: 1,
    subsection: "1.5",
    level: "advanced",
    question: "How do you identify the right service boundaries when decomposing a monolith?",
    quick_answer: "→ Use DDD bounded contexts — find where the same word means different things to different teams\n→ Look for: low coupling between modules, high cohesion within, distinct ownership, different change rates\n→ Event storming: map domain events to find natural aggregate and context boundaries\n→ Start with the seam that causes the most pain — highest value, lowest coupling\n→ Wrong boundary = distributed monolith; take time to find the right one",
    detailed_answer: "Finding the wrong service boundary is the root cause of most failed microservice migrations. The key insight: **services should be aligned to business capabilities and team ownership, not technical layers.**\n\n**Domain-Driven Design (DDD) bounded contexts** are the primary tool. A bounded context is a region of the domain where a specific domain model applies consistently. The tell-tale sign of a boundary: the same word means different things in different parts of the business. 'Customer' to the marketing team includes prospect data; to the billing team it means an account with payment history. These are two bounded contexts.\n\n**Signals of a good boundary:**\n- Low coupling: the module communicates with others only through well-defined interfaces, not shared DB tables\n- High cohesion: the features inside the module change together for the same business reasons\n- Clear ownership: one team is responsible and has distinct subject matter expertise\n- Different non-functional requirements: the module needs different scaling, latency, or availability characteristics\n- Different change rates: it changes frequently for business reasons while the rest is stable\n\n**Event Storming:** a collaborative workshop technique where domain events are mapped on a timeline. Clusters of events around specific aggregates reveal natural bounded context boundaries.\n\n**Seam analysis:** look at the monolith's code for natural seams — packages with minimal cross-references, or areas where calls are already mediated by interfaces. These are extraction candidates with the lowest coupling debt.\n\n**Practical rule:** extract the service that causes the most deployment or scaling pain and has the cleanest existing boundary. Leave the most entangled parts until last.",
    key_points: [
      "Bounded contexts: regions where a consistent domain model applies — boundary where word meanings diverge",
      "Services align to business capabilities and team ownership, not technical layers (no 'all controllers' service)",
      "Low coupling + high cohesion + clear ownership = good service candidate",
      "Event Storming reveals aggregate and context boundaries collaboratively with domain experts",
      "Extract the highest-pain, lowest-coupling seam first — avoid the most entangled parts",
      "Wrong boundaries are expensive to fix — invest time in boundary analysis before starting extraction"
    ],
    hint: "The word 'order' appears in five different modules of your monolith. How do you use that observation to find bounded context boundaries?",
    common_trap: "Drawing service boundaries around technical layers (a 'data service', a 'validation service') rather than business capabilities — this maximises inter-service coupling and minimises the independence benefit.",
    follow_up_questions: [
      { text: "How does Event Storming work in practice?", type: "inline", mini_answer: "Gather engineers, product managers, and domain experts. Use sticky notes on a wall: orange = domain events (past tense), blue = commands that trigger them, yellow = actors who issue commands. Map the flow left to right. Clusters of tightly related events around specific aggregates indicate bounded context candidates." },
      { text: "What is the difference between a bounded context and a microservice?", type: "inline", mini_answer: "A bounded context is a conceptual domain boundary — it can span multiple services or exist as a module within a monolith. A microservice is a deployment unit. One bounded context may contain multiple microservices (e.g. an 'Orders' context with separate checkout and fulfilment services). Map contexts first, then decide deployment granularity." },
      { text: "How does team structure relate to service boundaries under Conway's Law?", type: "linked", links_to: "1.5.01", mini_answer: "Conway's Law says the system mirrors the communication structure of the org. If a single team owns multiple bounded contexts, they'll build tightly coupled services. Align one team to one bounded context — then the service boundary naturally matches the team boundary, and coupling between services reflects real coordination cost." }
    ],
    related: ["1.5.01", "1.5.02", "1.5.04", "1.2.02"],
    has_diagram: false,
    has_code: false,
    tags: ["bounded-context", "ddd", "event-storming", "service-boundaries", "decomposition", "microservices"]
  },

  {
    id: "1.5.04",
    section: 1,
    subsection: "1.5",
    level: "advanced",
    question: "How do you decompose a shared monolith database when migrating to microservices?",
    quick_answer: "→ Shared DB is the hardest part — services sharing tables can never be truly independent\n→ Strangler Fig for data: new service reads from monolith DB first (temporary), then gets its own DB\n→ Migrate in phases: separate schema → separate DB → remove shared tables from monolith\n→ Use CDC (Debezium) or dual-write to sync during transition\n→ Never leave the shared DB permanently — it is a migration crutch, not an endpoint",
    detailed_answer: "The database is almost always the hardest part of a monolith migration. Services that share a database share schema, coupling, and deployment risk — they cannot be truly independent regardless of how the application layer is structured.\n\n**The DB per Service pattern** (see 4.1.07) is the target: each service owns its data exclusively; no other service reads or writes its tables directly.\n\n**Migration phases:**\n\n**Phase 1 — Schema separation:** create a separate schema within the same DB for the new service's tables. Move data. The new service uses its schema; the monolith still has its own. Coupling is reduced but the shared DB is still a single point of failure.\n\n**Phase 2 — Physical separation:** provision a separate DB instance for the new service. This eliminates the shared deployment risk and allows independent scaling, backup, and technology choice (the new service can use PostgreSQL while the monolith runs MySQL).\n\n**Phase 3 — Remove monolith's dependency:** the monolith must stop accessing the tables now owned by the new service. It calls the service's API instead. This is the hardest step — it requires changing all the monolith's data access code for that domain.\n\n**Data synchronisation during migration:** while both the monolith and new service are live:\n- **Dual-write:** application writes to both DBs; divergence risk on failure\n- **CDC (Change Data Capture):** Debezium reads the monolith's binlog and replicates changes to the new service's DB asynchronously — more reliable, eventually consistent\n\n**Referential integrity:** cross-service foreign keys become eventual consistency guarantees managed by the services themselves, not the DB. This is a significant shift in how data integrity is enforced.",
    key_points: [
      "Shared DB = shared coupling; services can never be independent while sharing tables",
      "DB per Service is the target; migration is three phases: shared schema → separate DB → remove cross-access",
      "CDC (Debezium) is the most reliable sync mechanism during dual-DB transition",
      "Dual-write risks divergence on partial failure — prefer CDC for long-running transitions",
      "Referential integrity across service boundaries moves from DB constraints to application-level consistency",
      "Never leave the shared DB as a permanent state — it is a migration crutch only"
    ],
    hint: "Service A and Service B both read from the same 'orders' table. What has to happen — in what order — before you can give each service its own database?",
    common_trap: "Extracting the application code into separate services while leaving the shared DB untouched and calling the migration complete — services still share deployment risk and schema changes still require cross-team coordination.",
    follow_up_questions: [
      { text: "How does the DB per Service pattern relate to data consistency trade-offs?", type: "linked", links_to: "4.1.07", mini_answer: "DB per Service eliminates shared-schema coupling but sacrifices cross-service ACID transactions. Joins across services become API calls or event-driven projections. Consistency is eventual, enforced by Sagas or compensating events rather than DB transactions." },
      { text: "How does Debezium CDC work for syncing data during migration?", type: "inline", mini_answer: "Debezium connects to the monolith DB's binary log (MySQL binlog, Postgres WAL). Every INSERT/UPDATE/DELETE is captured as a change event and published to Kafka. The new service consumes these events and applies them to its own DB. It's asynchronous and reliable — the binlog guarantees no changes are missed." },
      { text: "How do you handle cross-service queries that previously used SQL joins?", type: "inline", mini_answer: "Three options: (1) API composition — call each service and join in memory; (2) CQRS read model — maintain a denormalised projection combining data from both services, updated by events; (3) Data warehouse — for analytics queries, sync to a central store. SQL joins across service DBs are not an option." }
    ],
    related: ["4.1.07", "1.5.02", "1.5.05", "4.5.01"],
    has_diagram: true,
    diagram: `Phase 1: Monolith DB ── schema: orders ──► New Service
                      └── schema: users (shared, temporary)

Phase 2: Monolith DB ── users          New Service DB ── orders
         (CDC syncing during transition ─────────────────►)

Phase 3: Monolith calls Orders API ──► New Service DB ── orders
         (no direct DB cross-access)`,
    has_code: false,
    tags: ["database-decomposition", "db-per-service", "cdc", "debezium", "migration", "microservices"]
  },

  {
    id: "1.5.05",
    section: 1,
    subsection: "1.5",
    level: "advanced",
    question: "How do you handle data consistency and the dual-write problem during a live monolith migration?",
    quick_answer: "→ Dual-write: writing to monolith DB and new service DB risks divergence on partial failure\n→ Safest pattern: write to monolith DB only → CDC replicates to new service (single source of truth)\n→ Dual-read: read from new service but fall back to monolith — verify parity before cutover\n→ Feature flag controls which write path is active — enables instant rollback\n→ Dark launch: new service receives traffic but results are discarded until parity confirmed",
    detailed_answer: "During migration, there is a period where both the monolith and the new service are live and must share or transition data. This introduces the dual-write problem: if you write to both DBs, a partial failure leaves them inconsistent.\n\n**The dual-write problem:** if the monolith write succeeds but the new service write fails, the two DBs diverge. If you compensate by rolling back the monolith write, you now have a distributed transaction — exactly what you're trying to avoid.\n\n**Recommended approach — CDC as the synchronisation backbone:**\n1. New service reads data from the monolith DB (temporary, read-only access)\n2. Writes go to the monolith only (single source of truth)\n3. Debezium CDC replicates changes from the monolith's binlog to the new service's DB asynchronously\n4. New service gradually builds its own copy of the relevant data\n5. Verify parity — compare counts, checksums, sample records between both DBs\n6. Switch reads to the new service DB\n7. Switch writes to the new service (new service becomes source of truth)\n8. Stop CDC replication\n9. Remove the old tables from the monolith\n\n**Dark launch / shadow mode:** route a copy of all writes to the new service but don't use the results. Compare outputs. Once parity is confirmed over time, cut over.\n\n**Feature flags:** wrap the write path switch in a flag. If the new service write path shows errors or divergence, flip the flag to revert to the monolith path without a deployment.\n\n**Key metric:** replication lag. CDC is asynchronous — reads from the new service DB may lag behind the monolith by milliseconds to seconds. Callers must accept eventual consistency during the transition period.",
    key_points: [
      "Dual-write to two DBs risks divergence on partial failure — avoid as a permanent strategy",
      "CDC from monolith binlog is the safest sync mechanism — single write source, async replication",
      "Dark launch: shadow-write to new service without using results; verify parity before cutover",
      "Feature flags on the write path enable instant rollback without redeployment",
      "Replication lag is inherent in CDC — callers must accept eventual consistency during transition",
      "Verify parity (row counts, checksums, spot checks) before switching reads or writes"
    ],
    hint: "You write to the monolith DB and the new service DB in the same request handler. The monolith write succeeds, the new service write fails. What are your options — and why are all of them painful?",
    common_trap: "Treating the migration as 'done' once the new service is deployed — the data cutover (stopping CDC, removing old tables, making the new service the write source of truth) is the riskiest step and is often deferred indefinitely.",
    follow_up_questions: [
      { text: "How do Sagas help manage consistency after DB decomposition is complete?", type: "linked", links_to: "4.5.02", mini_answer: "Once services have separate DBs, cross-service operations that previously used a single transaction now need Sagas. Each service executes its local transaction; on failure, compensating transactions undo completed steps. Sagas replace ACID with eventual consistency and explicit failure handling." },
      { text: "What is the strangler fig approach specifically for the DB cutover?", type: "linked", links_to: "1.5.02", mini_answer: "Apply the same incremental principle: first strangler-fig the reads (route reads to new service, monolith still writes), then strangler-fig the writes (route writes to new service). Each step is independently verifiable and rollback-able. Never do both in the same cutover." },
      { text: "How do you test that the new service's DB has parity with the monolith's DB?", type: "inline", mini_answer: "Row count comparison per table/entity type. Hash or checksum comparison on sorted key ranges. Sample record comparison — pick 100 random IDs and compare field by field. Run these checks continuously during the CDC phase and set a threshold (e.g. 0 divergence for 72h) before cutting over." }
    ],
    related: ["1.5.04", "1.5.02", "4.5.02", "4.3.05"],
    has_diagram: false,
    has_code: false,
    tags: ["dual-write", "cdc", "data-migration", "consistency", "dark-launch", "feature-flags"]
  },

  {
    id: "1.5.06",
    section: 1,
    subsection: "1.5",
    level: "intermediate",
    question: "What is a distributed monolith, how do you recognise one, and how do you escape it?",
    quick_answer: "→ Distributed monolith: separate deployable services with tight coupling — worst of both worlds\n→ Signs: synchronous call chains spanning many services, shared DB, coordinated deploys, cascading failures\n→ You get microservice complexity with zero microservice independence\n→ Root cause: wrong boundaries, shared state, lack of async communication\n→ Escape: find the right bounded context boundaries, introduce async events, enforce DB-per-service",
    detailed_answer: "A distributed monolith is the most dangerous outcome of a failed microservices migration. The codebase is split into separately deployable units, but the services are so tightly coupled that they must be deployed, scaled, and operated as one — combining the operational complexity of microservices with the tight coupling of a monolith.\n\n**How to recognise a distributed monolith:**\n- **Synchronous call chains:** Service A calls B, B calls C, C calls D. A latency spike in D cascades to A. One service down = cascade failure\n- **Shared database:** multiple services read/write the same tables — schema changes require coordinating all teams\n- **Coordinated deploys:** you cannot deploy Service A without also deploying B and C — they share an implicit contract not captured in an API\n- **Chatty communication:** services exchange dozens of synchronous calls per user request\n- **No independent scaling:** all services must scale together because they share state\n- **Blast radius = everything:** one failing service takes down the entire system\n\n**Root causes:** wrong service boundaries (split by technical layer rather than business capability), shared mutable state, synchronous integration where async events would be appropriate, and anti-corruption layers that were never built (domain models bleed across boundaries).\n\n**How to escape:**\n1. Identify the coupling: draw a dependency graph — where are the synchronous chains?\n2. Introduce async communication (events) where real-time response is not required\n3. Enforce DB-per-service — remove cross-service DB access\n4. Redraw boundaries using DDD bounded contexts\n5. Accept that this may require a partial 're-monolith' — merging over-split services before re-extracting with the right boundaries",
    key_points: [
      "Distributed monolith: microservice deployment complexity + monolith coupling = worst possible outcome",
      "Signs: synchronous call chains, shared DB, coordinated deploys, cascading failures across all services",
      "Root cause: wrong boundaries (technical layers) and shared mutable state between services",
      "Escape path: async events for non-real-time flows, DB-per-service, redraw boundaries by business capability",
      "Sometimes the right fix is merging over-split services back before re-extracting with correct boundaries",
      "A functioning modular monolith beats a distributed monolith every time"
    ],
    hint: "Your monitoring shows that whenever Service A has high latency, Services B, C, and D also spike. What does this tell you about your microservices architecture — and what's the likely cause?",
    common_trap: "Thinking that deploying services in separate containers or on separate servers means you have microservices — true independence requires loose coupling (async communication, own DB, no shared deploy dependency), not just separate processes.",
    follow_up_questions: [
      { text: "How does the circuit breaker pattern prevent a distributed monolith from cascading failures?", type: "linked", links_to: "4.2.01", mini_answer: "Circuit breaker wraps synchronous calls: after N failures, it opens and fast-fails without calling the downstream service. This stops the cascade — upstream services degrade gracefully instead of queuing threads waiting on a dead downstream. It treats the symptom (cascading failure) but not the cause (tight coupling)." },
      { text: "When is re-monolithing (merging services back) the right call?", type: "inline", mini_answer: "When two services always deploy together, share state heavily, and are owned by the same team — the service boundary adds overhead with no independence benefit. Merge them into one service (or module), establish clean internal boundaries, and re-extract later when the boundary is clear and the team has grown." },
      { text: "How do you use async events to break synchronous call chains?", type: "linked", links_to: "1.3.01", mini_answer: "Identify calls where the upstream service doesn't need an immediate response. Replace the synchronous call with an event publish — the upstream service emits an event and continues. The downstream service reacts asynchronously. This breaks the timing dependency and makes each service independently operable." }
    ],
    related: ["1.5.01", "1.5.02", "1.5.03", "1.2.06", "4.2.01"],
    has_diagram: true,
    diagram: `Distributed Monolith (anti-pattern):
  Client ──► A ──sync──► B ──sync──► C ──sync──► D
  (D fails → C fails → B fails → A fails → Client fails)
  All share DB. Coordinated deploys. One team effectively.

Target:
  Client ──► A ──event──► [Broker]
                              ├──► B (async, independent)
                              └──► C (async, independent)`,
    has_code: false,
    tags: ["distributed-monolith", "anti-pattern", "microservices", "coupling", "migration", "architecture"]
  },

  // ── 1.6 Real-Time Systems Design ─────────────────────────────────────────

  {
    id: "1.6.01",
    section: 1,
    subsection: "1.6",
    level: "basic",
    question: "What does 'real-time' actually mean in system design, and how do hard, soft, and near-real-time differ?",
    quick_answer: "→ Hard real-time: missing a deadline is a system failure (aircraft controls, pacemakers)\n→ Soft real-time: missing a deadline degrades quality but system continues (video streaming, gaming)\n→ Near-real-time: low latency but no strict deadline — seconds acceptable (notifications, dashboards)\n→ Most web systems are near-real-time — 'real-time' in product specs usually means <1s perceived latency\n→ Define the latency budget before designing — the number drives every architecture decision",
    detailed_answer: "The word 'real-time' is used loosely in software engineering and means very different things depending on context. Getting clarity on which category you're in is the first step before any design discussion.\n\n**Hard real-time:** the system must respond within a deterministic time bound — missing the deadline constitutes a system failure, not just degraded performance. Examples: aircraft flight control systems, anti-lock braking systems, pacemakers. These require specialised real-time operating systems (RTOS), deterministic scheduling, and are rarely what web architects deal with.\n\n**Soft real-time:** deadlines exist and missing them degrades the user experience, but the system continues to operate. A dropped video frame or a 200ms game input lag is poor quality, not a crash. Most consumer-facing real-time features fall here: live video, multiplayer gaming, live scores.\n\n**Near-real-time (conversational real-time):** no strict deadline, but latency must feel immediate to a human — typically sub-second to a few seconds. Chat messages, live notifications, collaborative document editing, live dashboards. This is the category most architects work in.\n\n**Why it matters:** hard real-time demands deterministic compute (no GC pauses, no OS preemption), often disqualifies cloud-native architectures. Soft real-time is about sustained throughput and graceful degradation. Near-real-time is about perceived latency — choosing the right transport protocol and minimising round-trips.\n\n**Practical rule:** always ask 'what is the acceptable latency?' before designing. P99 <100ms, P99 <1s, and P99 <5s require fundamentally different architectures.",
    key_points: [
      "Hard real-time: missing deadline = system failure — requires RTOS, deterministic scheduling",
      "Soft real-time: missing deadline = quality degradation — video drops, game lag, but system continues",
      "Near-real-time: sub-second perceived latency — chat, notifications, dashboards — most web use cases",
      "Define the latency budget (P50/P99 targets) before choosing any architecture — the number drives design",
      "JVM/GC pauses, cloud network jitter, and OS scheduling make hard real-time on commodity hardware impractical",
      "Consumer-facing 'real-time' features are almost always near-real-time — design accordingly"
    ],
    hint: "A product manager asks you to 'make the dashboard real-time'. What is the first question you ask before opening a design document?",
    common_trap: "Designing for hard real-time constraints (deterministic scheduling, lock-free data structures) when the actual requirement is near-real-time — adding massive complexity for a constraint that doesn't exist.",
    follow_up_questions: [
      { text: "What latency thresholds matter to human perception?", type: "inline", mini_answer: "<100ms feels instantaneous. 100-300ms feels fast. 300ms-1s feels sluggish. >1s breaks the mental flow. >10s requires a progress indicator. These thresholds should anchor your P99 latency targets for user-facing operations." },
      { text: "How do you choose the right transport protocol for a near-real-time feature?", type: "linked", links_to: "1.6.02", mini_answer: "WebSockets for bidirectional low-latency communication (chat, gaming). SSE for server-to-client push only (notifications, live feeds). Long-polling as a fallback where WebSockets are blocked by infrastructure. HTTP/2 push is largely superseded by SSE in practice." },
      { text: "How does stream processing differ from batch processing for real-time analytics?", type: "linked", links_to: "1.6.06", mini_answer: "Batch processes data in large chunks on a schedule — high throughput, high latency (minutes to hours). Stream processing handles events as they arrive — low latency (milliseconds to seconds), lower throughput per job. Real-time dashboards need stream processing; overnight reports use batch." }
    ],
    related: ["1.6.02", "1.6.03", "1.6.06", "1.3.01"],
    has_diagram: false,
    has_code: false,
    tags: ["real-time", "latency", "hard-real-time", "soft-real-time", "near-real-time", "system-design"]
  },

  {
    id: "1.6.02",
    section: 1,
    subsection: "1.6",
    level: "intermediate",
    question: "Compare WebSockets, Server-Sent Events, and long-polling — when does each fit?",
    quick_answer: "→ WebSocket: full-duplex, persistent TCP connection — chat, gaming, collaborative editing\n→ SSE: server-to-client push only, built on HTTP — live feeds, notifications, progress updates\n→ Long-polling: client holds request open until server has data — fallback, works everywhere\n→ SSE is simpler than WebSocket when you only need server push\n→ Long-polling is the compatibility baseline — use when WebSocket/SSE are blocked by proxies",
    detailed_answer: "Three protocols solve the problem of pushing data from server to client without the client constantly polling.\n\n**WebSocket:** upgrades an HTTP connection to a persistent, full-duplex TCP channel. Both client and server can send messages at any time. Ideal when the client also sends frequent messages (chat, multiplayer gaming, collaborative editing, trading terminals). Lower overhead than HTTP once connected — no per-message headers. Weakness: stateful connection — load balancers must use sticky sessions or a shared pub/sub layer (Redis, broker) to route messages to the right connection. Proxies and firewalls sometimes block or reset WebSocket connections.\n\n**Server-Sent Events (SSE):** a standard HTTP response that streams newline-delimited events to the client indefinitely. Unidirectional (server → client only). Simpler than WebSocket — uses plain HTTP, works through most proxies and CDNs, automatic reconnection built into the browser EventSource API. Native support in all modern browsers. Ideal for: live dashboards, notification feeds, log streaming, progress bars. Limitation: browser cap of 6 concurrent SSE connections per domain (HTTP/1.1); HTTP/2 removes this limit.\n\n**Long-polling:** client sends a request; the server holds it open until it has data to return, then responds and the client immediately re-requests. Emulates push over plain HTTP. Works everywhere — no special protocol support needed. Higher overhead than WebSocket or SSE (TCP teardown + handshake per message). Use as a compatibility fallback or in constrained environments (corporate proxies that block persistent connections).\n\n**Decision rule:** need bidirectional low-latency? WebSocket. Server push only? SSE. Must work in hostile network environments? Long-polling fallback. Libraries like Socket.IO abstract the choice and negotiate the best available transport automatically.",
    key_points: [
      "WebSocket: full-duplex persistent connection — best for bidirectional high-frequency messaging",
      "SSE: unidirectional server push over HTTP — simpler, proxy-friendly, auto-reconnect built in",
      "Long-polling: works everywhere but higher overhead — use as fallback only",
      "WebSocket requires sticky sessions or shared pub/sub for multi-server deployments",
      "SSE hits browser connection limits under HTTP/1.1 — HTTP/2 resolves this with multiplexing",
      "Socket.IO negotiates the best transport automatically — good for mixed client environments"
    ],
    hint: "You're building a live order-tracking page where the server pushes status updates but the client never sends data back. Which protocol is the simplest correct choice and why?",
    common_trap: "Defaulting to WebSocket for all real-time features because it sounds more capable — SSE is simpler, has automatic reconnection, works through more proxies, and is the right tool whenever the communication is server-to-client only.",
    follow_up_questions: [
      { text: "How do you scale WebSocket connections across multiple servers?", type: "linked", links_to: "1.6.03", mini_answer: "Each server maintains its own pool of open WebSocket connections. When server A needs to send a message to a client connected to server B, it publishes to a shared pub/sub layer (Redis Pub/Sub, Kafka). Server B receives the message and pushes to the connected client. The broker is the fan-out backbone." },
      { text: "How does WebSocket authentication work — you can't send auth headers on upgrade?", type: "linked", links_to: "7.3.01", mini_answer: "Send a short-lived token as a query param on the WebSocket URL (?token=...) or in the first message after connection. The server validates the token immediately. Tokens must be short-lived (minutes) since they appear in server logs. Never use long-lived API keys in WebSocket URLs." },
      { text: "What is HTTP/2 server push and why didn't it replace SSE?", type: "inline", mini_answer: "HTTP/2 push lets servers proactively send resources before the client requests them — designed for assets (CSS, JS), not event streams. It's been removed from Chrome and was never adopted for real-time data. SSE remains the standard for event streaming; it maps naturally to HTTP/2 multiplexing." }
    ],
    related: ["1.6.01", "1.6.03", "1.6.04", "7.3.01"],
    has_diagram: true,
    diagram: `WebSocket:  Client ◄──────────────────────► Server  (full-duplex)

SSE:        Client ◄────────────────────── Server  (server push only)
            GET /events  →  text/event-stream response (never closes)

Long-poll:  Client ──GET /poll──► Server (holds until data ready)
            Client ◄──response── Server (client immediately re-requests)`,
    has_code: false,
    tags: ["websocket", "sse", "long-polling", "real-time", "transport", "http"]
  },

  {
    id: "1.6.03",
    section: 1,
    subsection: "1.6",
    level: "advanced",
    question: "How do you design a fan-out system that pushes real-time events to millions of connected clients?",
    quick_answer: "→ Fan-out: one event must be delivered to many clients — the core scaling challenge\n→ Architecture: event source → broker (Kafka/Redis) → connection servers → clients\n→ Connection servers are stateful (hold WebSocket/SSE connections) — scale horizontally\n→ Fan-out modes: fan-out on write (push to each recipient immediately) vs fan-out on read (client pulls inbox)\n→ At millions of connections: shard by user ID, use regional PoPs, accept eventual delivery",
    detailed_answer: "Fan-out is the hardest scaling problem in real-time systems: a single event (a celebrity tweet, a live sports goal, a system notification) must be pushed to millions of subscribers near-simultaneously.\n\n**Core architecture:**\n1. **Event producers** emit events to a message broker (Kafka topic, Redis Pub/Sub channel)\n2. **Connection servers** (stateful WebSocket/SSE servers) subscribe to the broker and maintain pools of client connections\n3. When a relevant event arrives, the connection server pushes to connected clients\n\n**Fan-out on write (push model):** when an event is published, immediately write a copy to each recipient's inbox and push to their active connection. Low read latency. Expensive for high-fan-out events — a celebrity with 50 million followers posting triggers 50 million write operations. Twitter famously struggled with this for high-follower accounts.\n\n**Fan-out on read (pull model):** store the event once; clients fetch their feed on demand or when notified. More storage-efficient for high-fan-out. Higher read latency. Hybrid: push to active users (online now), pull for inactive users (fetch on next login).\n\n**Scaling connection servers:** each server holds N persistent connections in memory — it's inherently stateful. Scale by sharding users across servers (user ID % server count). Use a routing layer (or consistent hashing) to map user ID → connection server. When sending to a user, look up their shard, route there.\n\n**Redis Pub/Sub for multi-server fan-out:** when one connection server needs to notify a client on another server, it publishes to a Redis channel. All connection servers subscribe to relevant channels and forward to their connected clients. Works well at moderate scale; at extreme scale, replace with Kafka partitioned by user ID.\n\n**Regional presence:** for global scale, use regional Points of Presence (PoPs). Connect clients to the nearest PoP. Events replicate across regions. Accept a few hundred milliseconds of cross-region latency.",
    key_points: [
      "Connection servers are stateful — they hold WebSocket/SSE connections and must be sharded by user",
      "Broker (Redis Pub/Sub or Kafka) is the fan-out backbone across connection servers",
      "Fan-out on write: low latency, expensive for high-follower accounts (N writes per event)",
      "Fan-out on read: storage-efficient, higher latency — hybrid is the practical solution",
      "Consistent hashing maps user ID to connection server — routing layer forwards messages cross-server",
      "At global scale: regional PoPs reduce latency; eventual delivery (not guaranteed ordering) is the norm"
    ],
    hint: "A celebrity with 50 million followers posts a message. Walk through what happens in your fan-out system in the first 5 seconds — and where does it break under load?",
    common_trap: "Using a single Redis Pub/Sub channel for all events — it becomes a bottleneck at scale. Partition channels by topic, user shard, or region so no single channel is a hotspot.",
    follow_up_questions: [
      { text: "How does Kafka partitioning help with fan-out scalability?", type: "linked", links_to: "1.3.06", mini_answer: "Partition the events topic by recipient user ID (or user shard). Each connection server consumes its partition(s) — only the events for its users arrive on its consumer. This avoids the broadcast problem of Redis Pub/Sub where every server sees every event and must filter." },
      { text: "How do you handle clients that are offline during a fan-out event?", type: "inline", mini_answer: "Don't rely on the push path for durability. Persist the event to an inbox store (Cassandra, DynamoDB keyed by user ID). When the client reconnects, it fetches missed events since its last acknowledged sequence number. The push path is best-effort; the inbox is the reliable fallback." },
      { text: "How do presence indicators (online/offline status) work at scale?", type: "linked", links_to: "1.6.04", mini_answer: "Each connection server tracks which users are connected. On connect/disconnect, it publishes a presence event to the broker. Other servers subscribe and update their local presence cache. At scale, use a dedicated presence service with TTL-based heartbeats — if no heartbeat for 30s, mark the user offline." }
    ],
    related: ["1.6.02", "1.6.04", "1.3.01", "4.3.01"],
    has_diagram: true,
    diagram: `Event ──► Kafka/Redis ──► Conn Server A ──► Clients (users 1-10k)
                    │
                    ├──────► Conn Server B ──► Clients (users 10k-20k)
                    │
                    └──────► Conn Server C ──► Clients (users 20k-30k)

Fan-out on write: broker writes to each recipient's inbox
Fan-out on read:  broker notifies; client fetches from inbox`,
    has_code: false,
    tags: ["fan-out", "real-time", "websocket", "scaling", "pub-sub", "notifications"]
  },

  {
    id: "1.6.04",
    section: 1,
    subsection: "1.6",
    level: "intermediate",
    question: "How do you design a presence system that shows which users are currently online?",
    quick_answer: "→ Presence: binary (online/offline) or rich (typing, away, last-seen)\n→ Heartbeat: client sends ping every N seconds; server marks offline if no ping for N*3 seconds\n→ Presence state stored in Redis with TTL — key expires = user offline\n→ Fan-out presence changes only to interested parties (friends, room members) not all users\n→ At scale: eventual consistency is acceptable — stale presence by a few seconds is fine",
    detailed_answer: "Presence is a fundamental feature in chat, collaboration tools, and social platforms — and a surprisingly tricky distributed systems problem.\n\n**Core mechanism — heartbeat with TTL:**\nThe client sends a heartbeat (ping) to the server every N seconds (typically 15-30s). The server writes `user:{id}:online = true` to Redis with a TTL of 2-3x the heartbeat interval. If the client disconnects cleanly or crashes, the key expires and the user becomes offline automatically. No explicit disconnect handling needed for crashes.\n\n**Why not rely on WebSocket disconnect events?** TCP connections can die silently (NAT timeout, dead networks) without sending a FIN packet. The server holds a 'zombie' connection that never receives data. Heartbeats detect these: if no ping arrives, the user is treated as offline regardless of connection state.\n\n**Fan-out presence changes:** when User A's status changes, who cares? Only User A's friends, shared room members, or document collaborators. Fan out presence events only to relevant subscribers — not to all users globally. Store presence subscriptions in Redis sets per user.\n\n**Rich presence:** beyond binary online/offline: 'typing...', 'away', 'last seen 5 min ago', 'in a call'. Typing indicators are ephemeral — publish to a channel, expire after 3s of inactivity. 'Last seen' timestamps are stored durably per user.\n\n**Consistency trade-off:** presence is inherently eventually consistent. A user who just went offline may appear online to some observers for up to 2-3x the heartbeat interval. This is acceptable — users understand presence as approximate. Strong consistency would require synchronous consensus on every status change, which is overkill.",
    key_points: [
      "Heartbeat + TTL in Redis is the standard mechanism — key expiry handles crash detection automatically",
      "Never rely solely on WebSocket disconnect events — silent TCP failures (zombie connections) are common",
      "Fan-out presence changes only to subscribers (friends, room members) — not globally",
      "Rich presence (typing, away, last-seen) extends the binary model with ephemeral and durable signals",
      "Typing indicators: publish to ephemeral channel, expire after 3s of silence",
      "Eventual consistency (stale by 2-3x heartbeat interval) is acceptable for presence — no need for strong consistency"
    ],
    hint: "A user closes their laptop lid without shutting the app. How does your presence system detect they've gone offline — and how long does it take?",
    common_trap: "Relying on WebSocket close events for offline detection and assuming every disconnect is clean — mobile clients, sleeping devices, and NAT timeouts produce silent disconnections that never fire a close event.",
    follow_up_questions: [
      { text: "How do you handle presence across multiple devices for the same user?", type: "inline", mini_answer: "Track presence per session (device), not per user. Store user:{id}:sessions as a Redis set of session IDs. A user is online if any session is active. On session expiry, remove from set — if set is empty, user is offline. The fan-out presence event fires only when the last session disconnects." },
      { text: "How do you scale presence to millions of users efficiently?", type: "inline", mini_answer: "Shard Redis by user ID — no single Redis instance holds all presence keys. Avoid global subscriptions — instead, subscribe to presence channels only for users in the current viewer's context (friend list, room). Use Bloom filters to quickly determine if a user has any online sessions before a full lookup." },
      { text: "How does typing indicator design differ from online/offline presence?", type: "inline", mini_answer: "Typing is ephemeral — publish a 'typing' event when the user types, repeat every 2s while typing, stop when they stop. Receiver shows 'typing...' for 3s after the last event — if no refresh arrives, hide it. No persistent storage needed; it's a pure pub/sub stream with implicit TTL via client-side timer." }
    ],
    related: ["1.6.02", "1.6.03", "1.6.01", "4.3.01"],
    has_diagram: false,
    has_code: true,
    code_language: "bash",
    code_snippet: `# Redis heartbeat presence pattern
# Client sends ping every 20s
SET user:42:online 1 EX 60   # TTL = 3x heartbeat interval

# On presence change — fan-out to subscribers
PUBLISH presence:room:101 '{"userId":42,"status":"online"}'

# Check if user is online
EXISTS user:42:online  # 0 = offline (TTL expired), 1 = online`,
    tags: ["presence", "real-time", "heartbeat", "redis", "websocket", "chat"]
  },

  {
    id: "1.6.05",
    section: 1,
    subsection: "1.6",
    level: "advanced",
    question: "How do CRDTs and Operational Transforms enable real-time collaborative editing, and how do they differ?",
    quick_answer: "→ Problem: two users edit the same document simultaneously — whose change wins?\n→ Operational Transform (OT): transform concurrent operations relative to each other — requires central server\n→ CRDT: conflict-free replicated data type — merges automatically, works peer-to-peer\n→ OT: used by Google Docs — server serialises operations and transforms each client's view\n→ CRDT: used by Figma, Notion — no central coordinator needed, eventual consistency guaranteed",
    detailed_answer: "Real-time collaborative editing requires that changes from multiple simultaneous users converge to the same document state, regardless of network delays and ordering.\n\n**The core problem:** User A inserts 'X' at position 5. Simultaneously, User B deletes the character at position 3. When both operations arrive at each client, their positions are now wrong relative to each other's change. Naive 'last write wins' produces garbage.\n\n**Operational Transformation (OT):** invented in 1989, used by Google Docs and Wave. Operations (insert, delete) are transformed against each other when they arrive out of order. A central server serialises all operations into a total order and transforms each client's pending operations against operations it hasn't seen yet before applying them. Guarantees: convergence (all clients eventually see the same document) and intention preservation (your edits are applied as you intended).\n\nOT limitation: the transformation functions grow complex as operation types increase. Requires a central server to provide the total ordering of operations — hard to make peer-to-peer.\n\n**Conflict-free Replicated Data Types (CRDTs):** a mathematical data structure whose merge operation is commutative, associative, and idempotent — any order of merging any subset of updates produces the same result. No central server needed. Types include: G-Counter (grow-only counter), LWW-Register (last-write-wins register), RGA (replicated growable array for text). Used by: Figma (multiplayer design), Automerge, Yjs (powering Notion, many others).\n\nCRDT trade-off: some user intentions cannot be perfectly preserved (concurrent deletes of the same character both disappear; intention ambiguity). Storage overhead — CRDTs carry metadata (vector clocks, unique IDs per character) that grows with the document's edit history.\n\n**Practical choice:** OT for text-heavy document editing where intention preservation matters and a central server is acceptable. CRDTs for offline-first, peer-to-peer, or multi-master scenarios where central coordination is not available.",
    key_points: [
      "OT transforms concurrent operations relative to each other — requires a central server for total ordering",
      "CRDT merges are commutative + associative + idempotent — convergence guaranteed without coordination",
      "Google Docs uses OT; Figma, Notion (via Yjs/Automerge) use CRDTs",
      "OT excels at intention preservation for text; CRDTs enable offline-first and peer-to-peer scenarios",
      "CRDT overhead: per-character unique IDs and vector clocks increase document metadata significantly",
      "Yjs and Automerge are production-ready CRDT libraries — avoid implementing from scratch"
    ],
    hint: "Two users simultaneously delete the same sentence in a collaborative document. How does each approach — OT and CRDT — handle this, and what does the user see?",
    common_trap: "Assuming 'last write wins' (LWW) is sufficient for collaborative editing — LWW discards one user's changes entirely. The whole point of OT/CRDT is that both users' intentions are preserved in the merged result.",
    follow_up_questions: [
      { text: "How does Yjs implement a CRDT for collaborative text editing?", type: "inline", mini_answer: "Yjs uses the YATA algorithm (Yet Another Transformation Approach) — each character insertion gets a globally unique ID (client ID + clock). Concurrent insertions at the same position are sorted by ID deterministically. Deletions mark characters as 'tombstoned' rather than removing them, preserving the ID sequence for future merges." },
      { text: "How do you handle a user going offline for hours and syncing a large diff?", type: "inline", mini_answer: "Store the full CRDT state (or a snapshot + log of operations since snapshot) on the server. When the offline client reconnects, send all operations it missed. CRDT merge applies them in any order — convergence is guaranteed. For OT, the server must replay and transform all missed operations sequentially, which is more expensive at large diffs." },
      { text: "When would you use CRDTs outside of collaborative editing?", type: "inline", mini_answer: "Shopping carts (add items from multiple devices — union CRDT). Distributed counters (like counts, view counts — G-Counter CRDT). Feature flags or config distributed to edge nodes. Any multi-master scenario where you want eventual consistency without conflict resolution logic — the CRDT structure encodes the merge semantics." }
    ],
    related: ["1.6.01", "1.6.03", "4.5.01", "1.3.03"],
    has_diagram: false,
    has_code: false,
    tags: ["crdt", "operational-transform", "collaborative-editing", "real-time", "consistency", "distributed-systems"]
  },

  {
    id: "1.6.06",
    section: 1,
    subsection: "1.6",
    level: "advanced",
    question: "How do you design a real-time analytics pipeline that can serve live dashboards with sub-second latency?",
    quick_answer: "→ Lambda architecture: batch layer (accurate, slow) + speed layer (approximate, fast) + serving layer\n→ Kappa architecture: single stream processing path — simpler, Kafka + Flink/Spark Streaming\n→ Speed layer: pre-aggregate in stream processor → store in low-latency store (Redis, Druid)\n→ Dashboard queries hit the pre-aggregated store, not raw events — sub-second reads\n→ Trade-off: pre-aggregation decisions are made upfront — ad-hoc queries need a different path",
    detailed_answer: "Real-time analytics requires a pipeline that processes events as they arrive and makes results queryable with low latency — fundamentally different from batch analytics that processes data in bulk on a schedule.\n\n**Lambda Architecture:** two parallel processing paths:\n- **Batch layer:** processes all historical data periodically (hourly/daily), produces accurate results, stored in a data warehouse\n- **Speed layer:** processes the stream of recent events in real-time (Kafka + Flink/Spark Streaming), produces approximate or incremental results with low latency\n- **Serving layer:** merges batch (accurate) and speed (recent) results to answer queries\n\nPros: accurate historical data + low-latency recent data. Cons: two codebases to maintain (batch logic and stream logic must agree), complexity.\n\n**Kappa Architecture:** replace both layers with a single stream processing path. Reprocess historical data by replaying the Kafka log from the beginning when batch accuracy is needed. Simpler — one codebase, one processing model. Requires Kafka (or similar) to retain the full event history.\n\n**Pre-aggregation pattern (the practical key):** stream processors (Flink, Kafka Streams) compute aggregates (counts, sums, P99s) per window (1min, 5min) and write results to a low-latency store. Dashboard queries hit Redis (exact aggregates) or Druid (OLAP slice-and-dice) — not the raw event store. Sub-second query latency comes from querying pre-computed results, not computing on the fly.\n\n**Druid and ClickHouse:** columnar databases optimised for real-time analytics — ingest streams via Kafka, store pre-rolled up aggregates, serve sub-second OLAP queries. The practical choice for dashboards that need flexibility (not just pre-defined metrics).\n\n**Trade-off:** pre-aggregation fixes the dimensions upfront. Ad-hoc queries on dimensions not pre-computed require scanning raw data — move those to an offline path.",
    key_points: [
      "Lambda: batch (accurate) + speed (fast) layers merged at serving time — correct but complex to maintain",
      "Kappa: single stream path, replay Kafka for reprocessing — simpler, requires long event retention",
      "Pre-aggregation: stream processor computes windowed aggregates → stored in Redis/Druid → dashboard queries pre-computed results",
      "Sub-second latency comes from reading pre-computed results, not computing at query time",
      "Druid and ClickHouse are the standard choices for real-time OLAP with Kafka ingestion",
      "Ad-hoc queries on un-pre-aggregated dimensions need a different (offline) path — design for this upfront"
    ],
    hint: "Your dashboard shows 'orders per minute for the last hour' and must update every 5 seconds. Walk through the full data path from order event to dashboard number.",
    common_trap: "Querying raw event storage (Kafka, S3, Elasticsearch) directly for live dashboards — raw event stores are not optimised for aggregation queries and will not deliver sub-second latency at scale.",
    follow_up_questions: [
      { text: "How does Apache Flink handle windowed aggregations in a stream?", type: "inline", mini_answer: "Flink defines windows (tumbling: fixed non-overlapping intervals; sliding: overlapping; session: gap-based). For each window, it accumulates events into state, fires the aggregation function at the window boundary, and emits the result downstream. Watermarks handle late-arriving events — events within the watermark tolerance are included; later ones are discarded or sent to a side output." },
      { text: "How do you handle late-arriving events in a real-time pipeline?", type: "inline", mini_answer: "Use watermarks — a threshold that defines how late an event can arrive and still be included in a window. The stream processor advances the watermark based on observed event timestamps, not wall clock time. Events arriving after the watermark are late: handle with a configurable allowed lateness window or route to a side output for separate processing." },
      { text: "How does this relate to event-driven architecture at the infrastructure level?", type: "linked", links_to: "1.3.01", mini_answer: "Real-time analytics pipelines are EDA at the infrastructure level — events flow through Kafka, stream processors are consumers that react and emit derived events, dashboards are downstream consumers of aggregated streams. The same decoupling principles apply: producers don't know who consumes their events." }
    ],
    related: ["1.6.01", "1.3.01", "4.3.01", "1.3.06"],
    has_diagram: true,
    diagram: `Events ──► Kafka ──► Flink (windowed aggregation)
                              │
                              ▼
                         Redis/Druid (pre-aggregated results)
                              │
                              ▼
                         Dashboard API ──► Live Dashboard
                         (sub-second reads from pre-computed store)`,
    has_code: false,
    tags: ["real-time-analytics", "stream-processing", "lambda-architecture", "kappa-architecture", "flink", "kafka"]
  },

  // ── 1.7 Domain-Driven Design ──────────────────────────────────────────────

  {
    id: "1.7.01",
    section: 1,
    subsection: "1.7",
    level: "basic",
    question: "What is Domain-Driven Design and what problem does ubiquitous language solve?",
    quick_answer: "→ DDD: align software model to business domain — use same terms in code as the business uses\n→ Ubiquitous language: shared vocabulary between developers and domain experts — no translation layer\n→ Without it: business says 'policy', code says 'contract', DB says 'agreement' — constant mistranslation\n→ Model evolves with understanding — DDD is iterative, not a one-time design exercise\n→ Strategic DDD (bounded contexts) + Tactical DDD (aggregates, entities, value objects)",
    detailed_answer: "Domain-Driven Design (DDD) is an approach to software development introduced by Eric Evans in 2003. Its central premise: for complex business domains, the design of the software should be driven by a deep model of the domain, and that model should be expressed directly in code.\n\n**The core problem DDD solves:** in most projects, there are two separate models — the mental model the business uses (expressed in meetings, requirements, and user stories) and the technical model in the code (expressed in class names, database tables, and API endpoints). Every interaction between business and engineering requires a translation. This translation introduces misunderstanding, bugs, and a growing disconnect between what the software does and what the business needs.\n\n**Ubiquitous language:** a single, shared vocabulary used by domain experts and developers alike — in conversations, documentation, user stories, code, database schemas, and API names. If the business calls it a 'policy renewal', the code has a `PolicyRenewal` class, the database has a `policy_renewals` table, and the API has a `/policy-renewals` endpoint. No translation needed.\n\n**Building ubiquitous language is not a one-time exercise.** The model deepens as developers and domain experts collaborate. Key insights — like discovering that 'customer' means something different in billing vs marketing — reshape the model. DDD embraces this evolution; the model reflects current understanding, not the initial guess.\n\n**Two levels:** strategic DDD deals with the large-scale structure of the system (bounded contexts, context maps, team relationships). Tactical DDD deals with the internal design of a single bounded context (aggregates, entities, value objects, domain events, repositories). Tactical patterns only pay off within a rich domain — applying them to a CRUD service adds complexity without benefit.",
    key_points: [
      "DDD aligns the software model with the business domain — the code speaks the business language",
      "Ubiquitous language eliminates the translation layer between business and engineering",
      "The model deepens iteratively — DDD is a continuous collaboration, not a design phase",
      "Strategic DDD: bounded contexts, context maps — the large-scale structure",
      "Tactical DDD: aggregates, entities, value objects — internal design of one context",
      "Tactical patterns only add value in complex domains — don't apply them to simple CRUD services"
    ],
    hint: "Your team uses the word 'account' in five different ways across the codebase. How does ubiquitous language help — and what does it reveal about your domain structure?",
    common_trap: "Treating DDD as purely a technical pattern catalogue (apply aggregates and value objects everywhere) without doing the strategic work of defining bounded contexts and establishing ubiquitous language with domain experts first.",
    follow_up_questions: [
      { text: "How do bounded contexts enforce ubiquitous language boundaries?", type: "linked", links_to: "1.7.02", mini_answer: "A bounded context is a region where one ubiquitous language applies consistently. The word 'customer' in the billing context means something specific; in the marketing context it means something else. Bounded contexts make this explicit — each context has its own model and its own language, preventing ambiguous shared concepts." },
      { text: "How do you practically build a ubiquitous language with a domain expert?", type: "inline", mini_answer: "Event Storming workshops: gather engineers and domain experts, map domain events on a timeline using sticky notes. The vocabulary that emerges — event names, command names, aggregate names — becomes the ubiquitous language. Disagreements about naming reveal model ambiguities worth resolving before writing code." },
      { text: "When is DDD overkill for a project?", type: "linked", links_to: "1.7.06", mini_answer: "DDD pays off when the domain is complex, the business rules are the primary source of value, and the team will work in this domain for years. For CRUD services, simple data pipelines, or short-lived projects, the overhead of bounded contexts and aggregate design exceeds the benefit." }
    ],
    related: ["1.7.02", "1.7.03", "1.5.03", "1.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["ddd", "ubiquitous-language", "domain-driven-design", "bounded-context", "strategic-ddd"]
  },

  {
    id: "1.7.02",
    section: 1,
    subsection: "1.7",
    level: "intermediate",
    question: "What are bounded contexts and context maps, and how do they guide system architecture?",
    quick_answer: "→ Bounded context: a region where one domain model and ubiquitous language applies consistently\n→ Context map: diagram showing how bounded contexts relate and integrate\n→ Integration patterns: shared kernel, customer/supplier, conformist, anti-corruption layer, open host\n→ Bounded contexts map to microservice candidates — not 1:1, but aligned\n→ Context map reveals team coupling — fix the map, you fix the architecture",
    detailed_answer: "A bounded context is the central strategic pattern in DDD. It defines the explicit boundary within which a particular domain model is valid and consistent. Outside that boundary, the same word may mean something different.\n\n**Why boundaries matter:** in a large system, a single unified model becomes unwieldy — too many concepts, too many stakeholders with conflicting definitions. Bounded contexts let teams own a slice of the domain with a model optimised for their specific needs, without the model pollution of trying to unify everything.\n\n**Context Map:** a map of all bounded contexts and their integration relationships. Context maps expose:\n- Which contexts share data and how\n- Which team is upstream (supplier) and which is downstream (customer)\n- What integration pattern is used at each boundary\n\n**Integration patterns between contexts:**\n- **Shared Kernel:** two contexts share a subset of the model — high coupling, used when two teams collaborate closely and share a small, stable core\n- **Customer/Supplier:** upstream team (supplier) produces; downstream team (customer) consumes — supplier accommodates customer's needs in its roadmap\n- **Conformist:** downstream adopts the upstream model wholesale — simplest integration but downstream loses model autonomy\n- **Anti-Corruption Layer (ACL):** downstream translates the upstream model into its own language — protects the downstream model from upstream changes\n- **Open Host Service:** upstream publishes a stable, documented protocol (API or event schema) for multiple consumers\n- **Separate Ways:** contexts don't integrate — each solves the problem independently\n\n**Bounded contexts as microservice boundaries:** a bounded context is a strong candidate for one (or more) microservices. The boundary that makes sense in the domain model is the same boundary that minimises inter-service coupling.",
    key_points: [
      "Bounded context: explicit boundary where one consistent domain model and language applies",
      "Context map: diagram of all contexts + their integration relationships + team ownership",
      "ACL protects the downstream model from being polluted by upstream legacy concepts",
      "Customer/Supplier makes the upstream team accountable to the downstream team's roadmap",
      "Bounded context boundaries align with microservice boundaries — not 1:1, but strongly correlated",
      "Context maps reveal hidden coupling — a tangled map indicates a tangled architecture"
    ],
    hint: "Your context map shows that 5 downstream services all use the Conformist pattern against one upstream legacy system. What does this tell you about the risk in your architecture?",
    common_trap: "Drawing bounded context boundaries to match the existing codebase structure or database schema rather than the business domain — you end up encoding the current mess into an official diagram.",
    follow_up_questions: [
      { text: "How does an Anti-Corruption Layer work in practice?", type: "linked", links_to: "1.7.05", mini_answer: "The ACL is a translation layer — it calls the upstream system and maps its data and concepts into the downstream context's model. The downstream domain model never 'sees' the upstream model directly. If the upstream changes, only the ACL needs updating — the domain model is insulated." },
      { text: "How do context maps help with service boundary decisions during a migration?", type: "linked", links_to: "1.5.03", mini_answer: "Context maps make coupling visible. If your map shows a Conformist relationship where a downstream service adopts the upstream's messy legacy model, that's a migration candidate — introduce an ACL first, then extract the downstream context as a service with its own clean model." },
      { text: "What is the difference between a bounded context and a microservice?", type: "inline", mini_answer: "A bounded context is a conceptual domain boundary; a microservice is a deployment boundary. One bounded context can be implemented as multiple microservices (e.g. Orders context: checkout service + fulfilment service). Or a small context may share a deployment with another for operational simplicity. Map contexts first, decide deployment granularity after." }
    ],
    related: ["1.7.01", "1.7.03", "1.7.05", "1.5.03"],
    has_diagram: true,
    diagram: `┌──────────────┐    ACL     ┌──────────────┐
│   Billing    │◄──────────│  Marketing   │
│   Context    │           │   Context    │
│ (customer =  │           │ (customer =  │
│  account)    │           │  prospect)   │
└──────────────┘           └──────────────┘
        │ Open Host Service
        ▼
┌──────────────┐
│  Payments    │
│   Context    │
└──────────────┘`,
    has_code: false,
    tags: ["bounded-context", "context-map", "ddd", "anti-corruption-layer", "strategic-ddd", "microservices"]
  },

  {
    id: "1.7.03",
    section: 1,
    subsection: "1.7",
    level: "advanced",
    question: "What is an Aggregate in DDD, how do you design its boundaries, and what rules must it enforce?",
    quick_answer: "→ Aggregate: cluster of domain objects treated as a unit for data changes — one root, consistent boundary\n→ Aggregate root: the only entry point — all changes go through it, it enforces invariants\n→ Rule: only reference other aggregates by ID, never by direct object reference\n→ Keep aggregates small — one or two entities — large aggregates cause contention and lock issues\n→ Each aggregate should be storable and retrievable as one unit (one repository per aggregate)",
    detailed_answer: "The Aggregate is the most important — and most misunderstood — tactical pattern in DDD.\n\n**What it is:** an Aggregate is a cluster of domain objects (entities and value objects) that form a consistency boundary. Within the aggregate, all invariants (business rules) are always satisfied. From outside the aggregate, only the Aggregate Root is accessible.\n\n**Aggregate Root:** the single entity that controls access to everything inside the aggregate. External code can only hold a reference to the root, never to internal entities directly. All state changes go through root methods — this ensures the root can enforce invariants before committing.\n\n**Example:** an `Order` aggregate might contain `Order` (root), `OrderLines` (entities inside), and `ShippingAddress` (value object). You never reference `OrderLine` directly from outside — you ask the `Order` to `addLine()` or `removeItem()`, and the `Order` validates the result (e.g. total price within credit limit) before accepting the change.\n\n**Boundary design rules:**\n1. Invariants that must be consistent together → same aggregate\n2. Aggregates reference each other by ID only — never by object reference. This enforces loose coupling and allows aggregates to live in different transactions.\n3. Keep aggregates small. A large aggregate (Order + Customer + Payment + Shipping all in one) causes contention — every concurrent modification locks the whole thing.\n4. One repository per aggregate root — it is the unit of persistence.\n\n**Transaction scope:** one database transaction should modify only one aggregate. Cross-aggregate consistency is achieved through domain events and eventual consistency, not distributed transactions.\n\n**Design smell:** if your aggregate is very large, or if you frequently need to load many aggregates together to answer a single query, your boundaries are probably wrong.",
    key_points: [
      "Aggregate root is the sole entry point — all external access and state changes go through it",
      "Invariants that must always be consistent together belong in the same aggregate",
      "Reference other aggregates by ID only — never by direct object reference",
      "Keep aggregates small — large aggregates cause transaction contention and performance issues",
      "One transaction = one aggregate; cross-aggregate consistency uses domain events + eventual consistency",
      "One repository per aggregate root — the aggregate is the unit of persistence and retrieval"
    ],
    hint: "You're designing an e-commerce system. Should `Order`, `Customer`, and `Product` be one aggregate or three? Walk through the invariants to justify the boundary.",
    common_trap: "Making the aggregate too large by including everything that is logically related — a Customer aggregate containing all their orders, addresses, payment methods, and preferences. This creates a single-threaded bottleneck for every customer operation.",
    follow_up_questions: [
      { text: "How do you handle consistency between two aggregates that must stay in sync?", type: "inline", mini_answer: "Use domain events. When Aggregate A changes, it raises a domain event. A handler picks up the event (synchronously in the same transaction, or asynchronously via outbox) and updates Aggregate B. Eventual consistency between aggregates is the DDD default — strong consistency requires a single aggregate boundary." },
      { text: "What is a value object and how does it differ from an entity?", type: "inline", mini_answer: "An entity has identity — two Order objects with the same fields but different IDs are different orders. A value object has no identity — two Money objects representing £10.00 are identical and interchangeable. Value objects are immutable. Examples: Money, Address, DateRange, Colour. Prefer value objects over entities where possible — they're simpler and side-effect-free." },
      { text: "How do domain events connect aggregate state changes to the rest of the system?", type: "linked", links_to: "1.7.04", mini_answer: "When an aggregate changes state, it records a domain event (e.g. OrderPlaced, PaymentFailed). These events are published after the transaction commits — either synchronously to local handlers or via the Outbox pattern to a broker. Other aggregates or services react to these events, achieving cross-boundary consistency without coupling." }
    ],
    related: ["1.7.01", "1.7.04", "1.7.02", "4.5.02"],
    has_diagram: true,
    diagram: `Order (Aggregate Root)
├── OrderLine (Entity — internal only)
│   ├── productId: ProductId  ← ID reference, not object
│   └── quantity: Quantity    ← Value Object
├── shippingAddress: Address  ← Value Object
└── status: OrderStatus       ← Value Object

External code:
  order.addItem(productId, qty)  ✅  (through root)
  order.lines[0].setQty(5)       ❌  (direct internal access)`,
    has_code: false,
    tags: ["aggregate", "ddd", "aggregate-root", "value-object", "entity", "tactical-ddd"]
  },

  {
    id: "1.7.04",
    section: 1,
    subsection: "1.7",
    level: "intermediate",
    question: "What are domain events in DDD and how do they differ from integration events?",
    quick_answer: "→ Domain event: something significant that happened within a bounded context — past tense, immutable fact\n→ Integration event: published across bounded context boundaries — decoupled, serialisable, versioned\n→ Domain events are internal; integration events are the public contract\n→ Flow: aggregate raises domain event → handler may publish integration event to broker\n→ Domain events enable decoupled side-effects within a context without direct method calls",
    detailed_answer: "Domain events and integration events serve different purposes and operate at different scopes — conflating them is a common source of design errors.\n\n**Domain Event:** a record of something significant that happened within a single bounded context. Named in past tense (`OrderPlaced`, `PaymentFailed`, `InventoryReserved`). It is an internal artefact — part of the domain model, carrying domain concepts. Not necessarily serialised or published outside the context. An aggregate raises domain events as part of its state transition; local handlers within the same context can react synchronously in the same transaction (update a read model, trigger a saga step).\n\n**Integration Event:** a message published across bounded context or service boundaries via a broker (Kafka, SNS). It is a public contract — versioned, serialised, and designed for external consumption. It carries only the data that external consumers need, stripped of internal domain concepts. An integration event is typically raised by a handler that reacts to a domain event and translates it into the public form.\n\n**Flow:**\n1. `Order.place()` validates and transitions state → raises `OrderPlaced` domain event\n2. Domain event handler fires in-process → may update a local read model, trigger a process manager\n3. Outbox handler picks up the domain event → translates to `order.placed.v1` integration event → publishes to Kafka\n4. External services (Inventory, Notifications) consume the integration event and react\n\n**Why the distinction matters:** if you publish raw domain events as integration events, you expose internal model details as a public contract. Any internal refactoring — renaming a field, splitting an entity — becomes a breaking change for external consumers. The translation layer (domain event → integration event) is your anti-corruption boundary.",
    key_points: [
      "Domain event: internal fact within a bounded context — carries full domain model detail",
      "Integration event: public cross-context contract — versioned, serialised, stripped of internal concepts",
      "Aggregates raise domain events; handlers translate them to integration events for external publication",
      "Domain events can be handled synchronously in the same transaction (for local side-effects)",
      "Integration events use the Outbox pattern for reliable cross-context delivery",
      "Exposing raw domain events as integration events couples your public contract to internal model details"
    ],
    hint: "Your `OrderPlaced` domain event contains a rich `Customer` object from your internal model. Why is publishing this directly to Kafka a design mistake?",
    common_trap: "Using the same event object for both internal domain event handling and external publication — a field rename or model refactor then silently breaks all external consumers of that event.",
    follow_up_questions: [
      { text: "How does the Outbox pattern ensure domain events reach external consumers reliably?", type: "linked", links_to: "4.3.05", mini_answer: "Write the integration event to an outbox table in the same DB transaction as the aggregate state change. A relay process (CDC or poller) reads unpublished outbox rows and publishes to the broker. This guarantees at-least-once delivery without a distributed transaction between the DB and the broker." },
      { text: "How do domain events relate to Event Sourcing?", type: "linked", links_to: "1.3.03", mini_answer: "In Event Sourcing, domain events ARE the persistence mechanism — the aggregate state is rebuilt by replaying them. In standard DDD without Event Sourcing, domain events are side-effects of state changes that are persisted normally in a relational DB. Event Sourcing is a specialisation; domain events exist in both approaches." },
      { text: "How do you handle domain event ordering when multiple events are raised in one transaction?", type: "inline", mini_answer: "Collect all domain events raised during a transaction in an in-memory list on the aggregate (or a unit of work). After the DB commit, dispatch them in order. If using Kafka, use the same partition key (aggregate ID) to preserve ordering. If an event is lost between commit and dispatch, the Outbox pattern handles recovery." }
    ],
    related: ["1.7.03", "1.3.01", "4.3.05", "1.3.03"],
    has_diagram: false,
    has_code: true,
    code_language: "java",
    code_snippet: `// Domain event — internal, rich model
class OrderPlaced {              // raised by aggregate
    Order order;                 // full internal model
    Instant occurredAt;
}

// Integration event — public contract, serialisable
class OrderPlacedEvent {         // published to Kafka
    String orderId;              // stripped to IDs and primitives
    String customerId;
    BigDecimal totalAmount;
    String currency;
    String version = "1";        // explicit versioning
}`,
    tags: ["domain-events", "integration-events", "ddd", "event-driven", "outbox", "bounded-context"]
  },

  {
    id: "1.7.05",
    section: 1,
    subsection: "1.7",
    level: "advanced",
    question: "What is an Anti-Corruption Layer and when must you build one?",
    quick_answer: "→ ACL: translation layer between two bounded contexts with incompatible models\n→ Prevents upstream model's concepts from polluting the downstream domain model\n→ Build one when: integrating with legacy systems, third-party APIs, or upstream contexts with poor models\n→ ACL translates data AND concepts — not just field mapping, but model interpretation\n→ Without ACL: upstream changes cascade into your domain model; with ACL: only the ACL changes",
    detailed_answer: "The Anti-Corruption Layer (ACL) is a protective boundary between two bounded contexts whose models are incompatible — typically when a downstream system must integrate with an upstream system it cannot control or change.\n\n**Why it's needed:** without an ACL, the downstream context must adopt the upstream's concepts directly (the Conformist pattern). This means upstream naming conventions, data structures, and model assumptions bleed into the downstream domain. Any change to the upstream model propagates through the downstream codebase. For legacy systems or third-party APIs, this is particularly harmful — the upstream model often reflects decades of technical debt.\n\n**What an ACL does:**\n- **Data translation:** maps upstream field names and types to downstream model fields\n- **Concept translation:** interprets upstream concepts in terms of downstream ubiquitous language. If the upstream calls it a 'Contract' and your context calls it a 'Policy', the ACL performs that semantic translation\n- **Model isolation:** the downstream domain never imports upstream types — only the ACL touches upstream data structures\n\n**When you must build one:**\n- Integrating with a legacy monolith whose model is inconsistent or poorly named\n- Consuming a third-party API you cannot change\n- Receiving events from an upstream bounded context with a different ubiquitous language\n- Strangler Fig migration: the new service sits behind an ACL to insulate it from the monolith's model\n\n**Implementation:** the ACL is typically a set of translators/mappers and an adapter that wraps the upstream client. It lives in the downstream context's infrastructure layer, not in the domain layer — the domain never knows it exists.\n\n**Cost:** ACLs add a layer of indirection and must be maintained as the upstream evolves. But this cost is almost always lower than the cost of a corrupted domain model.",
    key_points: [
      "ACL protects the downstream domain model from upstream model pollution",
      "Translates both data (field mapping) and concepts (semantic interpretation between languages)",
      "The downstream domain layer never imports or references upstream types directly",
      "Essential when integrating with: legacy systems, third-party APIs, or upstream contexts with poor models",
      "ACL lives in the infrastructure layer — the domain model is unaware of it",
      "Strangler Fig migrations always need an ACL to prevent monolith concepts contaminating new services"
    ],
    hint: "Your new Orders service must read data from a 15-year-old mainframe that calls everything a 'Transaction' with a 3-character code for type. How does an ACL protect your clean domain model?",
    common_trap: "Building the ACL as a simple field-by-field mapper without translating concepts — renaming `TXNTP` to `transactionType` is not an ACL. A real ACL interprets `TXNTP=ORD` as an `OrderPlaced` domain concept with the right invariants.",
    follow_up_questions: [
      { text: "How does an ACL relate to context map integration patterns?", type: "linked", links_to: "1.7.02", mini_answer: "The ACL is the implementation mechanism for the downstream side of a Customer/Supplier or Conformist relationship when the downstream wants to protect its model. The context map declares the relationship type; the ACL is how the downstream technically achieves isolation from the upstream's model." },
      { text: "How do you test an ACL without coupling tests to both models?", type: "inline", mini_answer: "Test the ACL in isolation: given an upstream response fixture (raw JSON or object from upstream), assert the correct downstream domain object is produced. Use contract tests to verify the ACL correctly understands the upstream's current format. Keep domain tests independent — they use domain objects, never upstream types." },
      { text: "Can an ACL introduce performance problems?", type: "inline", mini_answer: "Yes — if the ACL makes synchronous calls to translate data that could be cached, or if it performs N upstream calls to enrich N downstream records (N+1 pattern). Mitigate with: caching reference data (codes, lookup tables) in the ACL, batching upstream calls, or pre-building translated read models via event-driven replication rather than on-the-fly translation." }
    ],
    related: ["1.7.02", "1.7.01", "1.5.02", "1.5.03"],
    has_diagram: true,
    diagram: `Upstream (Legacy)          ACL                  Downstream (Clean)
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│  Contract    │───►│  Translator  │───►│  Policy          │
│  TXNTP=ORD  │    │  maps types  │    │  (domain model)  │
│  CUSTREF=.. │    │  renames IDs │    │  CustomerId      │
└──────────────┘    └──────────────┘    └──────────────────┘
                    (only layer that
                     knows upstream)`,
    has_code: false,
    tags: ["anti-corruption-layer", "acl", "ddd", "bounded-context", "integration", "legacy"]
  },

  {
    id: "1.7.06",
    section: 1,
    subsection: "1.7",
    level: "intermediate",
    question: "When is DDD worth the investment, and when is it the wrong tool?",
    quick_answer: "→ Worth it: complex business rules, domain experts available, long-lived system, large team\n→ Wrong tool: simple CRUD, small team, short project lifespan, no domain expert access\n→ DDD cost: significant upfront modelling time, higher initial complexity\n→ DDD payoff: accrues over years — model scales with the business, team onboarding is faster\n→ Start with strategic DDD (bounded contexts); add tactical patterns only where complexity warrants",
    detailed_answer: "DDD is a powerful but expensive tool. Applying it indiscriminately adds ceremony without benefit. Knowing when to use it — and how much of it to apply — is itself an architectural skill.\n\n**When DDD pays off:**\n- **Complex domain:** the business rules are the primary source of value and competitive differentiation. Insurance, banking, healthcare, logistics — domains with intricate rules that change as the business evolves\n- **Domain experts available:** DDD requires genuine collaboration with people who deeply understand the business. Without access to domain experts, you build a model that reflects developer assumptions, not business reality\n- **Long-lived system:** the payoff accrues over years. A system that will be replaced in 18 months won't live long enough to benefit from the model's flexibility\n- **Large, growing team:** ubiquitous language and bounded contexts are coordination tools. A team of 3 doesn't need them; a team of 50 across 10 services does\n\n**When DDD is the wrong tool:**\n- **Simple CRUD:** a form that reads and writes records to a database has no complex domain rules. Applying aggregate design here adds layers with no benefit\n- **Data pipeline or ETL:** DDD is about behaviour and business rules, not data transformation\n- **Short-lived or exploratory projects:** the upfront modelling cost won't be recouped\n- **No domain expert access:** without the business side, you can't build a ubiquitous language\n\n**Graduated adoption:** start with strategic DDD only — identify bounded contexts and establish ubiquitous language. Add tactical patterns (aggregates, value objects) only in the core domain — the part of the system where complexity is highest and correctness matters most. Use simpler patterns (transaction scripts, active record) in supporting or generic subdomains.",
    key_points: [
      "DDD investment pays off over years — short-lived projects rarely recover the modelling cost",
      "Domain expert access is a prerequisite — DDD without business collaboration is just over-engineering",
      "Strategic DDD (bounded contexts, language) adds value in most large systems",
      "Tactical DDD (aggregates, value objects) is only warranted in the core domain — the unique, complex heart",
      "Supporting subdomains (billing, auth) may use simpler patterns; generic subdomains should use off-the-shelf",
      "Start lean: model the bounded contexts first; introduce tactical patterns as complexity proves it's needed"
    ],
    hint: "You're building an internal tool that lets employees request office equipment. Would you apply DDD? What about a platform for a large insurance company's policy underwriting? Justify both answers.",
    common_trap: "Applying full tactical DDD (aggregates, domain events, repositories) to every service in a system — including simple CRUD supporting services — because the core domain uses DDD. Supporting subdomains don't need the same treatment.",
    follow_up_questions: [
      { text: "What is the difference between a core domain, supporting domain, and generic domain?", type: "inline", mini_answer: "Core domain: your unique competitive advantage — where DDD investment is highest. Supporting subdomain: necessary but not unique (e.g. internal reporting) — simpler patterns, or build quickly. Generic subdomain: solved problems (auth, email, payments) — buy or use open source, never build. Apply DDD effort proportional to strategic value." },
      { text: "How do you introduce DDD to a team that has never used it?", type: "inline", mini_answer: "Start with ubiquitous language — lowest cost, immediate benefit. Run one Event Storming workshop on the core domain. Identify bounded contexts. Resist the urge to introduce aggregate design until the team understands the strategic picture. Gradual introduction over 3-6 months beats a big-bang DDD rewrite." },
      { text: "How does DDD relate to microservice design decisions?", type: "linked", links_to: "1.5.03", mini_answer: "Bounded contexts are the primary input to microservice boundary decisions. A bounded context with a coherent ubiquitous language and a team that owns it is a strong microservice candidate. DDD provides the business justification for where to draw service lines — not just technical convenience." }
    ],
    related: ["1.7.01", "1.7.02", "1.5.01", "1.5.03"],
    has_diagram: false,
    has_code: false,
    tags: ["ddd", "when-to-use", "core-domain", "supporting-domain", "architecture", "design"]
  },

];
