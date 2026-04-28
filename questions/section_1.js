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

];
