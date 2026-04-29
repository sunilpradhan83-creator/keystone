// questions/section_2.js
// Section 2: Data & Storage
// Subsections: 2.1 Database Selection & Trade-offs
//              2.2 Relational Databases
//              2.3 NoSQL Databases
//              2.4 Caching Strategies
//              2.5 Data Modeling
//              2.6 Data Replication & Consistency
//              2.7 CQRS & Event Sourcing
//              2.8 Data Partitioning & Sharding
// Target: ~36 questions
// Added: 2026-04-29

const SECTION_2_QUESTIONS = [

  // ============================================================
  // 2.1  DATABASE SELECTION & TRADE-OFFS  (5 questions)
  // ============================================================

  {
    id: "2.1.01",
    section: 2,
    subsection: "2.1",
    level: "intermediate",
    question: "How do you apply CAP theorem when selecting a database for a new system?",
    quick_answer: "→ Network partitions are inevitable, so you choose between C and A under partition\n→ CP systems (Mongo, HBase, etcd): reject writes during partition to keep data consistent\n→ AP systems (Cassandra, DynamoDB, Riak): accept writes everywhere, reconcile later\n→ Map your domain: payments/inventory → CP; carts/feeds/sessions → AP\n→ In practice you tune per-operation (quorum reads/writes), not just per-database",
    detailed_answer: "CAP says under a network partition you must sacrifice either consistency or availability — you cannot have both. The theorem doesn't apply when there's no partition; in normal operation most databases give you both.\n\nThe real question is: what does your domain do when nodes can't talk to each other?\n\nCP databases (consistent + partition-tolerant) refuse writes that can't be safely replicated. MongoDB with majority writes, HBase, etcd, Zookeeper. Use these when stale or divergent data is unacceptable — money movement, inventory deduction, leader election.\n\nAP databases (available + partition-tolerant) accept writes on whatever nodes are reachable and reconcile conflicts later via vector clocks, last-write-wins, or CRDTs. Cassandra, DynamoDB, Riak. Use these when uptime beats strict consistency — shopping carts, social feeds, user sessions, IoT ingestion.\n\nModern systems are tunable per-operation. Cassandra lets you set consistency level per query (ONE / QUORUM / ALL). DynamoDB has eventual vs strongly consistent reads. So 'pick CP or AP' is really 'pick a default and tune the exceptions'.\n\nA hidden cost of CP under partition: requests fail. Your callers need timeouts, retries, and circuit breakers. A hidden cost of AP: your application code must handle conflicts — design data structures that converge (sets, counters) rather than ones that fight (mutable scalars).",
    key_points: [
      "Partitions are not optional — you don't choose P, the network does",
      "CP rejects writes under partition; AP accepts and reconciles later",
      "Match the trade-off to the domain: money/inventory → CP; cart/feed → AP",
      "Modern DBs tune consistency per-operation, not per-database",
      "AP requires conflict-resolution strategy in app code (CRDTs, LWW, vector clocks)",
      "PACELC extends CAP: even without partition, choose latency vs consistency"
    ],
    hint: "What happens to a write when two replicas can't reach each other? What's worse for your domain — rejecting it or accepting two divergent versions?",
    common_trap: "Treating CAP as a permanent label on a database. Most modern DBs are tunable; the real choice is per-operation consistency level, not 'pick the AP database forever'.",
    follow_up_questions: [
      { text: "What is PACELC and how does it extend CAP?", type: "inline", mini_answer: "PACELC: under Partition choose A or C (CAP); Else (no partition) choose Latency or Consistency. It captures that even in healthy operation, strong consistency costs latency — every read needs quorum coordination. DynamoDB is PA/EL (available + low latency), Spanner is PC/EC (consistent always)." },
      { text: "How does eventual consistency reconcile conflicts?", type: "linked", links_to: "4.5.02", mini_answer: "Three common strategies: Last-Write-Wins (timestamp-based, can lose data), vector clocks (track causality, app resolves), and CRDTs (data structures designed to converge — counters, sets, registers). LWW is simplest, CRDTs are safest." },
      { text: "When does CAP not apply?", type: "inline", mini_answer: "When there's no partition — the theorem only forces a trade-off during network failure. In normal operation, most distributed DBs give you both consistency and availability. CAP is about failure-mode behaviour, not steady-state." }
    ],
    related: ["2.1.02", "2.1.03", "4.5.01", "4.5.02"],
    has_diagram: true,
    diagram: `   CAP THEOREM — pick 2 (in practice, P is forced)

   ┌─────────────────────────────────────────┐
   │             NETWORK PARTITION           │
   │                                         │
   │     Node A   ╳───── X ─────╳   Node B  │
   │                                         │
   │  CP path:                AP path:       │
   │  ─ reject write          ─ accept write │
   │  ─ data stays consistent ─ stays online │
   │  ─ caller sees error     ─ reconcile    │
   │                            later        │
   └─────────────────────────────────────────┘

   CP examples: MongoDB (majority), HBase, etcd, Spanner
   AP examples: Cassandra, DynamoDB, Riak, CouchDB`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["cap-theorem", "database-selection", "consistency", "availability", "trade-offs"]
  },

  {
    id: "2.1.02",
    section: 2,
    subsection: "2.1",
    level: "basic",
    question: "When do you choose SQL over NoSQL, and vice versa?",
    quick_answer: "→ SQL: structured data, complex joins, ACID transactions, mature tooling\n→ NoSQL: massive scale, flexible schema, single-entity access, write-heavy workloads\n→ SQL still scales (Postgres handles 10TB+); the real question is access pattern, not size\n→ Default to SQL unless you have a specific reason — operational maturity wins\n→ Polyglot persistence is fine: Postgres for orders + Redis for sessions + ES for search",
    detailed_answer: "The SQL-vs-NoSQL debate is mostly a false binary now. Modern Postgres handles JSON, full-text search, geospatial, and time-series workloads that used to require specialist NoSQL stores. The real decision is about access patterns and operational fit, not data volume.\n\nChoose SQL when: data is relational (orders → line items → products), you need multi-row transactions, queries are unpredictable (analysts ad-hoc), strong consistency is required, or you value mature tooling (migrations, replication, backups, observability).\n\nChoose NoSQL when: access is dominated by single-entity lookups by key (DynamoDB, Cassandra), schema varies wildly across records (document stores), you need horizontal write scale beyond a single node, or the data shape doesn't fit rows-and-columns (graphs, time-series, vectors).\n\nThe scaling argument is overstated. Postgres on a beefy instance handles 50k+ writes/sec and tens of TB. You hit operational complexity (sharding, replication tuning) before you hit a hard scale wall. Don't reach for Cassandra because of imagined future scale — pay the complexity cost when you actually need it.\n\nMost serious systems are polyglot: Postgres for transactional core, Redis for cache/sessions, Elasticsearch for search, S3 for blobs, Kafka for events. The architect's job is to pick one default and add specialists deliberately, not to chase one-database-fits-all.",
    key_points: [
      "Access pattern matters more than data volume for the choice",
      "Modern Postgres covers many NoSQL use cases (JSON, full-text, geo)",
      "NoSQL wins for single-entity-by-key at massive horizontal scale",
      "SQL operational tooling is decades ahead — don't underestimate this",
      "Polyglot persistence is normal; pick a default + add specialists",
      "Don't optimise for imagined future scale at the cost of present complexity"
    ],
    hint: "If you removed the database label and just looked at how queries hit the data — how many entities per query, how much joining, how unpredictable the queries are — what shape emerges?",
    common_trap: "Picking NoSQL because 'it scales better' without measuring whether SQL would have hit a wall. NoSQL trades query flexibility and operational maturity for raw write throughput; if you don't need that throughput, you've paid the cost without the benefit.",
    follow_up_questions: [
      { text: "What does 'polyglot persistence' mean in practice?", type: "inline", mini_answer: "Using multiple data stores in one system, each chosen for the access pattern it serves best. Example: Postgres (orders), Redis (sessions/cache), Elasticsearch (search), S3 (images), Kafka (events). Each store is optimal for its workload, but you pay complexity cost in operations, consistency, and team skill." },
      { text: "How do you pick between document, key-value, wide-column, and graph databases?", type: "linked", links_to: "2.1.04", mini_answer: "Document (MongoDB): nested JSON-like records, flexible schema, query within documents. Key-value (Redis, DynamoDB): O(1) lookup by key, no inter-record queries. Wide-column (Cassandra, HBase): time-series and write-heavy, pre-modeled queries. Graph (Neo4j): relationships are first-class, traversal queries." },
      { text: "Can Postgres replace MongoDB for document workloads?", type: "inline", mini_answer: "For most use cases, yes. Postgres JSONB has indexable nested fields, full-text search, and rivals MongoDB performance. You lose: built-in horizontal sharding (Postgres needs Citus or partitioning) and the document-first developer experience. You gain: ACID transactions across documents and SQL for analytics." }
    ],
    related: ["2.1.01", "2.1.03", "2.1.04", "2.3.01"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["sql", "nosql", "database-selection", "polyglot-persistence", "trade-offs"]
  },

  {
    id: "2.1.03",
    section: 2,
    subsection: "2.1",
    level: "intermediate",
    question: "What is the difference between ACID and BASE, and when does each apply?",
    quick_answer: "→ ACID: Atomicity, Consistency, Isolation, Durability — strict transaction guarantees\n→ BASE: Basically Available, Soft state, Eventual consistency — relaxed for scale\n→ ACID for systems where invariants must hold (money, inventory, identity)\n→ BASE for systems where availability beats correctness (feeds, recommendations, analytics)\n→ Many modern DBs blur the line — Spanner is ACID at global scale, DynamoDB has transactions",
    detailed_answer: "ACID and BASE describe two opposite philosophies for handling concurrent operations and failure.\n\nACID guarantees that every transaction either fully succeeds or has no effect (atomicity), leaves the database in a valid state respecting all constraints (consistency), runs as if alone (isolation), and persists once committed (durability). It's how Postgres, Oracle, SQL Server, and Spanner work. The cost is coordination — locks, two-phase commit, write-ahead logs, quorum consensus — which limits horizontal scale.\n\nBASE flips it: 'Basically Available' (the system stays online even if some nodes fail), 'Soft state' (data may change without input as replicas converge), 'Eventual consistency' (given no new writes, all replicas converge to the same value). It's how Cassandra, DynamoDB (default), Riak, and S3 work. The cost is application complexity — the developer must reason about stale reads, conflicting writes, and out-of-order events.\n\nThe trade-off comes from CAP: ACID systems sacrifice availability under partition; BASE systems sacrifice consistency to stay available.\n\nRule of thumb: anything where a wrong answer is worse than no answer needs ACID. Anything where 'a slightly stale answer right now' beats 'no answer for 30 seconds' can use BASE. Money: ACID. Search index: BASE. Inventory deduction: ACID. View counts: BASE.\n\nThe lines blur: Spanner gives ACID at global scale via TrueTime. DynamoDB now supports ACID transactions. CockroachDB is ACID-distributed. Modern systems are pick-your-guarantees, not pick-your-database.",
    key_points: [
      "ACID = strict consistency, locked-step coordination, scales vertically",
      "BASE = eventual consistency, partition-tolerant, scales horizontally",
      "ACID protects invariants (money, stock); BASE prioritises uptime (feeds, search)",
      "BASE pushes complexity into the application — conflict resolution, idempotency",
      "Spanner, CockroachDB, DynamoDB transactions blur the historical divide",
      "PACELC: even without partition, ACID systems trade latency for consistency"
    ],
    hint: "Think about a bank transfer vs a Twitter like. What does the user lose if either one is briefly wrong? That tells you which philosophy you need.",
    common_trap: "Assuming all NoSQL is BASE and all SQL is ACID. DynamoDB has ACID transactions; some SQL configurations (read replicas with lag) are eventually consistent. The guarantees are configurable, not fixed by category.",
    follow_up_questions: [
      { text: "What are SQL isolation levels and when do they matter?", type: "inline", mini_answer: "Read Uncommitted (dirty reads allowed), Read Committed (Postgres default — no dirty reads, but non-repeatable reads), Repeatable Read (snapshot isolation), Serializable (full ACID, transactions appear sequential). Higher levels prevent more anomalies but add lock contention. Most apps run Read Committed and use explicit locking for the few cases that need stronger guarantees." },
      { text: "How does eventual consistency manifest to a user?", type: "linked", links_to: "4.5.02", mini_answer: "User posts a comment, refreshes, doesn't see it. User updates profile, sees old name in some UI tabs. User's friend likes a photo, like count is 5 in one feed and 6 in another. Convergence happens within milliseconds-to-seconds typically, but during that window, different observers see different states." },
      { text: "Can you get ACID without giving up scale?", type: "inline", mini_answer: "Yes, partially. Spanner uses synchronised atomic clocks (TrueTime) for global ACID. CockroachDB uses Raft consensus per range. The cost is latency — every write coordinates with a quorum, so you trade response time for consistency. You don't get ACID-at-Cassandra-throughput, but you can get ACID with horizontal scale." }
    ],
    related: ["2.1.01", "2.1.02", "4.5.01", "4.5.02"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["acid", "base", "transactions", "consistency", "trade-offs"]
  },

  {
    id: "2.1.04",
    section: 2,
    subsection: "2.1",
    level: "intermediate",
    question: "How do you choose between document, key-value, wide-column, and graph NoSQL stores?",
    quick_answer: "→ Document (Mongo): nested JSON, flexible schema, query within docs — content/catalogues\n→ Key-value (Redis, DynamoDB): O(1) lookup by key — sessions, cache, leaderboards\n→ Wide-column (Cassandra, HBase): time-series, pre-modeled queries — telemetry, audit logs\n→ Graph (Neo4j): relationships are first-class — fraud, recommendations, networks\n→ Pick by access pattern, not data shape — what query dominates 80%+ of reads?",
    detailed_answer: "Each NoSQL family is optimised for a specific access pattern. Picking wrong creates expensive workarounds.\n\nDocument stores (MongoDB, Couchbase) hold nested JSON-like records and let you query inside them — find all users where address.city = 'London' or update a single field deep in a nested array. Strong fit for content management, product catalogues, user profiles where each record has variable structure. Weak fit for cross-document joins or strong relational integrity.\n\nKey-value stores (Redis, DynamoDB, Memcached) give O(1) lookup by primary key. No inter-record queries, no joins. Strong fit for caching, session storage, leaderboards, real-time counters, idempotency keys. Weak fit for any workload that needs to query by attribute other than key.\n\nWide-column stores (Cassandra, HBase, Bigtable) organise data by partition key + clustering key, optimised for write-heavy workloads with predictable query patterns. Strong fit for time-series (IoT, metrics, audit logs), event ingestion at scale, write-once-read-by-time-range. Weak fit for unpredictable queries — you must model the data around the queries you'll run, not the entities.\n\nGraph databases (Neo4j, Neptune, ArangoDB) make relationships first-class — traversals like 'friends of friends who bought X' are O(degree) instead of O(joins²). Strong fit for social networks, fraud detection, recommendation engines, dependency graphs, knowledge graphs. Weak fit for bulk row scans or aggregate analytics.\n\nThe selection question isn't 'which is fastest' — it's 'what query do I run 1000x more than any other?' That query's optimal shape determines the family.",
    key_points: [
      "Document: nested records, flexible schema, query within documents",
      "Key-value: O(1) by key, no secondary queries, blazing fast",
      "Wide-column: write-heavy time-series, pre-modeled queries",
      "Graph: relationship-first, traversal queries are cheap",
      "Pick by dominant access pattern, not by 'what kind of data is it'",
      "Wrong family forces expensive workarounds — secondary indexes, denormalisation, app-side joins"
    ],
    hint: "If you wrote down the top 3 queries this database has to answer 100 million times a day, what shape do they have? Single key lookup? Nested filter? Relationship traversal? That answers the question.",
    common_trap: "Choosing MongoDB as a default 'flexible' database, then bolting on workarounds (secondary indexes, $lookup joins, multi-document transactions) to handle relational queries that should have been in Postgres from the start.",
    follow_up_questions: [
      { text: "When would you use Cassandra over DynamoDB?", type: "inline", mini_answer: "Cassandra: self-hosted, predictable cost at extreme scale, multi-DC active-active for free, tunable consistency per query. DynamoDB: zero-ops managed, single-digit-ms reads, on-demand scaling, integrated with AWS. Pick Cassandra when you have ops capacity and need control; pick DynamoDB when you want managed simplicity and accept AWS lock-in." },
      { text: "Can you do graph queries on a relational database?", type: "inline", mini_answer: "Yes for shallow traversals (1-2 hops via JOINs), but performance degrades exponentially with depth. Postgres recursive CTEs handle moderate graphs. For 'friends of friends of friends' or fraud rings spanning 5+ hops, a graph DB is orders of magnitude faster — it stores relationships as direct pointers, not as rows requiring index lookups per hop." },
      { text: "Why does Cassandra force you to model around queries?", type: "inline", mini_answer: "Cassandra distributes data by partition key, and queries must hit a single partition for predictable performance. If you store users by user_id and then need 'all users in country X', you can't — there's no global secondary index that scales. So you create a second table partitioned by country. Modeling = denormalising one table per query pattern." }
    ],
    related: ["2.1.02", "2.3.01", "2.3.02", "2.5.01"],
    has_diagram: true,
    diagram: `   NoSQL FAMILIES — pick by access pattern

   ┌──────────────┬─────────────────┬────────────────────┐
   │   Family     │  Access pattern │  Examples          │
   ├──────────────┼─────────────────┼────────────────────┤
   │  Document    │ Query inside    │ MongoDB, Couchbase │
   │              │ nested docs     │                    │
   ├──────────────┼─────────────────┼────────────────────┤
   │  Key-Value   │ O(1) by key,    │ Redis, DynamoDB,   │
   │              │ no inter-record │ Memcached          │
   ├──────────────┼─────────────────┼────────────────────┤
   │  Wide-Column │ Write-heavy,    │ Cassandra, HBase,  │
   │              │ time-series,    │ Bigtable           │
   │              │ pre-modeled     │                    │
   ├──────────────┼─────────────────┼────────────────────┤
   │  Graph       │ Relationship    │ Neo4j, Neptune,    │
   │              │ traversal       │ ArangoDB           │
   └──────────────┴─────────────────┴────────────────────┘`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["nosql", "document-db", "key-value", "wide-column", "graph-db", "database-selection"]
  },

  {
    id: "2.1.05",
    section: 2,
    subsection: "2.1",
    level: "advanced",
    question: "How does workload type (OLTP vs OLAP) drive your database choice, and how do you handle systems that need both?",
    quick_answer: "→ OLTP: many small reads/writes, low latency, row-oriented (Postgres, MySQL, DynamoDB)\n→ OLAP: few large scans, high throughput, column-oriented (Snowflake, BigQuery, Redshift)\n→ Mixing them in one DB ruins both — analytics queries kill OLTP latency\n→ Standard pattern: OLTP store + CDC stream + OLAP warehouse, ~minutes lag\n→ HTAP systems (TiDB, Spanner, SingleStore) try both but trade off latency or cost",
    detailed_answer: "OLTP (Online Transaction Processing) is the workload of running an application — single-row reads, small updates, strict latency budgets (single-digit ms), high concurrency. Think 'place an order', 'fetch user profile', 'increment counter'. Row-oriented storage is optimal because each operation touches a few full rows.\n\nOLAP (Online Analytical Processing) is the workload of analysing the application — scan millions of rows, aggregate, join across dimensions, latency tolerated up to seconds or minutes. Think 'revenue by region last quarter', 'top 100 products by margin', 'cohort retention curves'. Column-oriented storage wins because queries touch a few columns across all rows; reading only those columns is 10-100× faster.\n\nMixing them in one database breaks both. An analytical query scanning 100M rows takes a row-oriented DB minutes and locks shared resources, killing transactional latency. A transactional row layout makes column scans read entire rows just to discard most fields.\n\nThe standard architecture splits them: OLTP database (Postgres, DynamoDB) handles application traffic, change data capture (Debezium, AWS DMS, Kafka Connect) streams changes into an OLAP warehouse (Snowflake, BigQuery, Redshift, ClickHouse). Lag is typically seconds to minutes — fine for analytics, never used for operational decisions.\n\nHTAP (Hybrid Transactional/Analytical Processing) systems try to serve both. TiDB and Spanner replicate row data into a column store internally. SingleStore stores rowstore + columnstore tables side-by-side. They work, but you trade off — analytical performance lags pure OLAP, transactional latency lags pure OLTP, and cost is higher than either alone. Adopt HTAP when latency on fresh data matters more than cost, or when operational simplicity beats peak performance.",
    key_points: [
      "OLTP: row-oriented, low-latency, high-concurrency single-row operations",
      "OLAP: column-oriented, high-throughput, large-scan aggregations",
      "Running OLAP on OLTP DB kills transactional latency — never share a single store",
      "Standard pattern: OLTP + CDC + OLAP warehouse with minutes-of-lag tolerance",
      "HTAP systems combine both at cost of peak performance in either direction",
      "Real-time analytics on fresh OLTP data needs HTAP or streaming aggregation, not warehouse"
    ],
    hint: "What's the latency budget for the dashboard query vs the API request? If they're 100× apart, what does that tell you about whether one database can serve both?",
    common_trap: "Building reporting features on the production OLTP database 'temporarily' — the first heavy analyst query at peak hours pages the on-call engineer when the entire app slows down. Once entrenched, this is painful to extract.",
    follow_up_questions: [
      { text: "What is CDC and why is it the standard OLTP→OLAP bridge?", type: "linked", links_to: "4.4.05", mini_answer: "Change Data Capture: streams row-level changes (insert/update/delete) from the OLTP DB's transaction log to downstream consumers. Tools: Debezium, AWS DMS, Maxwell. It's non-invasive (reads WAL, no app changes), captures every change exactly once, and decouples analytics from operational queries. Latency typically seconds to minutes." },
      { text: "When is HTAP worth the cost?", type: "inline", mini_answer: "When fresh-data analytics matter (fraud detection on current orders, real-time pricing on live demand, dashboards needing sub-minute freshness) AND you can't tolerate the operational complexity of streaming pipelines. HTAP systems like TiDB or SingleStore charge ~2-3× more than equivalent OLTP, but you skip the warehouse + ETL stack. Worth it if the alternative is a fragile data pipeline." },
      { text: "How is real-time stream analytics different from OLAP?", type: "linked", links_to: "4.3.03", mini_answer: "Stream analytics (Flink, Kafka Streams, Materialize) processes events as they arrive — sub-second latency, incremental aggregation, windowed computations. OLAP warehouses batch-process historical data — minutes-to-hours latency, full SQL, arbitrary joins. Streaming is for 'now', OLAP is for 'last quarter'. Modern stacks use both: stream for live dashboards, warehouse for deep analysis." }
    ],
    related: ["2.1.02", "2.1.04", "2.7.01", "8.1.01"],
    has_diagram: true,
    diagram: `   OLTP / OLAP — separate stores, CDC bridges them

   ┌────────────────────┐         ┌─────────────────────┐
   │    APPLICATION     │         │     ANALYTICS /     │
   │   (single row,     │         │     DASHBOARDS      │
   │    <10ms latency)  │         │  (full scan, ~sec)  │
   └─────────┬──────────┘         └──────────▲──────────┘
             │                               │
             ▼                               │
   ┌────────────────────┐    CDC    ┌────────┴───────────┐
   │    OLTP STORE      │   stream  │    OLAP WAREHOUSE  │
   │  Postgres /        │──────────▶│  Snowflake /       │
   │  DynamoDB          │  (sec-min  │  BigQuery /        │
   │  (row-oriented)    │   lag)    │  ClickHouse        │
   │                    │           │  (column-oriented) │
   └────────────────────┘           └────────────────────┘

   HTAP alt: TiDB / Spanner / SingleStore — both in one`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["oltp", "olap", "htap", "cdc", "database-selection", "warehouse"]
  },


  // ============================================================
  // 2.2  RELATIONAL DATABASES  (4 questions)
  // ============================================================

  {
    id: "2.2.01",
    section: 2,
    subsection: "2.2",
    level: "intermediate",
    question: "How do you design an indexing strategy for a relational database, and what are the common pitfalls?",
    quick_answer: "→ Index columns used in WHERE, JOIN ON, and ORDER BY — not every column\n→ Composite indexes: column order matters — most selective or most filtered first\n→ Covering index: include all query columns to avoid heap fetch entirely\n→ Pitfalls: over-indexing slows writes; under-indexing causes full table scans\n→ Validate with EXPLAIN ANALYZE — never guess, always measure",
    detailed_answer: "An index is a sorted data structure (usually a B-tree) that lets the database locate rows without scanning the entire table. The trade-off is read speed vs write overhead — every insert, update, or delete must maintain all indexes on that table.\n\nB-tree indexes are the default and handle equality, range, and ORDER BY. Hash indexes are equality-only but slightly faster for exact lookups. GIN indexes are for full-text search and array containment. BRIN indexes are for naturally ordered data (timestamps) on very large tables with tiny storage overhead.\n\nComposite index column order is critical. A composite index on (country, city) can serve queries filtering on country alone, but not city alone. The rule: put the most commonly filtered column first, or the most selective column first if both are always present.\n\nCovering indexes include all columns needed by a query in the index itself, so the database never touches the heap (the actual table rows). If your query is SELECT email FROM users WHERE tenant_id = 5, an index on (tenant_id) still requires a heap fetch for email. An index on (tenant_id) INCLUDE (email) serves the query entirely from the index.\n\nOver-indexing is the most common production mistake. Tables with 15 indexes have 15× the write amplification per row mutation. The INSERT that was 0.5ms becomes 5ms because each of 15 indexes must be updated and potentially rebalanced.\n\nAlways validate with EXPLAIN ANALYZE — the planner chooses indexes based on statistics, and those statistics can be stale. A common trap is adding an index on a low-cardinality column (status with values 'active'/'inactive') — if 80% of rows are 'active', a full table scan is faster than an index, and the planner will ignore the index anyway.",
    key_points: [
      "Index WHERE, JOIN ON, ORDER BY columns — not everything indiscriminately",
      "Composite index column order determines which prefix queries are served",
      "Covering indexes eliminate heap fetches — critical for read-hot, high-volume queries",
      "Over-indexing kills write throughput — every index is maintained on every mutation",
      "Low-cardinality columns rarely benefit from indexes — planner prefers full scan",
      "EXPLAIN ANALYZE is the only reliable way to confirm an index is actually used"
    ],
    hint: "Take a specific slow query you're imagining — walk through what the database does with no index, then with an index on one column, then a composite. What changes at each step?",
    common_trap: "Adding an index and assuming the query is fixed without running EXPLAIN ANALYZE. The planner ignores indexes it deems slower than a seq scan — stale statistics, low cardinality, or small table size can all cause this. Always verify the plan changed.",
    follow_up_questions: [
      { text: "What is a partial index and when is it worth it?", type: "inline", mini_answer: "An index on a subset of rows: CREATE INDEX ON orders (user_id) WHERE status = 'pending'. If 95% of queries filter on pending orders, this index is tiny and fast vs a full index on all orders. Use when queries consistently filter on a predictable subset — reduces index size, speeds maintenance, improves cache efficiency." },
      { text: "How does index bloat happen and how do you fix it?", type: "inline", mini_answer: "Postgres B-trees accumulate dead tuples from updates and deletes. Over time the index pages have many empty slots, so index scans read more pages than needed. Fix: VACUUM ANALYZE (reclaims space); REINDEX CONCURRENTLY (rebuilds without downtime). Monitor with pg_stat_user_indexes — bloat is visible as index_size >> actual data size." },
      { text: "When should you consider a non-B-tree index type?", type: "inline", mini_answer: "GIN: full-text search (tsvector columns), array containment, JSONB keys. GiST: geometric shapes, IP ranges, nearest-neighbour queries. BRIN: very large append-only tables ordered by a natural sequence (timestamp, serial ID) — tiny storage cost, coarse block-range granularity. Hash: pure equality lookups where you never need range or sort — marginally faster but WAL-not-logged historically." }
    ],
    related: ["2.2.02", "2.2.03", "2.5.01"],
    has_diagram: false,
    diagram: "",
    has_code: true,
    code_language: "sql",
    code_snippet: `-- Composite index: serves (tenant_id), (tenant_id, status), NOT (status) alone
CREATE INDEX idx_users_tenant_status
  ON users (tenant_id, status);

-- Covering index: no heap fetch needed for this query
CREATE INDEX idx_users_tenant_covering
  ON users (tenant_id) INCLUDE (email, name);

-- Partial index: only index active users
CREATE INDEX idx_users_active
  ON users (email)
  WHERE status = 'active';

-- Always verify the plan changed
EXPLAIN ANALYZE
  SELECT email FROM users
  WHERE tenant_id = 42 AND status = 'active';`,
    tags: ["indexing", "b-tree", "composite-index", "covering-index", "postgres", "query-optimization"]
  },

  {
    id: "2.2.02",
    section: 2,
    subsection: "2.2",
    level: "intermediate",
    question: "How do you read and act on a database query execution plan?",
    quick_answer: "→ EXPLAIN ANALYZE shows actual execution time, row estimates vs actuals, and plan nodes\n→ Seq Scan on large tables = missing index or low-cardinality filter\n→ High rows estimate mismatch = stale statistics → run ANALYZE\n→ Nested loop on large datasets = wrong join strategy → may need hash join hint\n→ Focus on widest nodes first — total cost flows up the plan tree",
    detailed_answer: "An execution plan is the database's chosen strategy for running your query — which indexes to use, how to join tables, in what order. EXPLAIN shows the estimated plan; EXPLAIN ANALYZE executes it and shows actual timings and row counts.\n\nEvery node in the plan has an estimated cost (in abstract planner units) and, with ANALYZE, actual time in ms and actual row counts. The root node's cost is the total query cost. Work down the tree to find the most expensive subtree.\n\nKey nodes to recognise:\n- Seq Scan: reads every row in the table. Fine for small tables or when fetching >20% of rows. On millions of rows with a small filter — look for a missing index.\n- Index Scan: uses a B-tree to locate rows, then fetches them from the heap. Good for selective filters.\n- Index Only Scan: served entirely from a covering index — fastest read path.\n- Hash Join: builds a hash table from the smaller input, probes with the larger. Good for large equi-joins.\n- Nested Loop: for each outer row, scans inner. Efficient when inner is small or index-backed. Slow when both sides are large.\n- Merge Join: both inputs sorted, merged. Good when both sides are already sorted (e.g., both have matching indexes).\n\nStale statistics are the most common silent killer. The planner uses pg_statistics to estimate row counts. After bulk loads or high-churn periods, estimates drift wildly. A node showing 'Rows Estimated: 1 / Rows Actual: 50000' is the planner flying blind. Run ANALYZE (or ensure autovacuum is healthy).\n\nActioning a bad plan: if it's a missing index, add one. If it's the wrong join strategy, rewrite the query or add a statistics hint. If it's a parameter sniffing issue (plan cached with a skewed parameter), use query parameterisation carefully or force a re-plan.",
    key_points: [
      "EXPLAIN ANALYZE gives actual vs estimated rows and actual timing — use it",
      "Start at the most expensive leaf node and work upward",
      "Seq Scan is not always bad — it's the right choice for large-fraction fetches",
      "Estimate vs actual mismatch means stale statistics — run ANALYZE",
      "Nested loop on large unsupported joins is the most common join performance bug",
      "Index Only Scan is the best outcome — confirm with EXPLAIN after adding covering index"
    ],
    hint: "Pick a slow query and ask: what's the estimated vs actual row count at each node? Where does the biggest mismatch live? That node is where the planner is making a bad decision.",
    common_trap: "Treating query cost numbers as milliseconds — they're abstract planner units and only meaningful for comparison within the same plan. The actual timing from EXPLAIN ANALYZE is what matters for real performance.",
    follow_up_questions: [
      { text: "What causes a planner to choose a sequential scan even when an index exists?", type: "inline", mini_answer: "Three common causes: (1) Low cardinality — fetching 40%+ of rows is faster with seq scan; (2) Stale statistics — planner thinks there are far fewer rows than reality; (3) Small table — seq scan fits in one page read, index overhead not worth it. Check with EXPLAIN ANALYZE and compare estimated vs actual rows." },
      { text: "How does connection pooling interact with query plan caching?", type: "inline", mini_answer: "Prepared statements cache execution plans per connection. With pooling (PgBouncer), a plan prepared on one connection may be re-used by a different session with different parameter distributions — 'parameter sniffing'. Symptom: query runs fast in isolation, slow under load. Fix: use transaction-mode pooling carefully, or avoid prepared statements for highly variable queries." },
      { text: "When would you hint or force a join strategy?", type: "inline", mini_answer: "Postgres doesn't have SQL hints, but you can: SET enable_nestloop = off; SET enable_seqscan = off; — session-scoped. Use when you know the planner's estimate is wrong and a different strategy is clearly better. Always test: forcing the wrong strategy is worse than letting the planner decide. The real fix is fresh statistics and correct indexes." }
    ],
    related: ["2.2.01", "2.2.03"],
    has_diagram: false,
    diagram: "",
    has_code: true,
    code_language: "sql",
    code_snippet: `-- Full diagnostic: run actual query, show buffers
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
  SELECT o.id, u.email, o.total
  FROM orders o
  JOIN users u ON u.id = o.user_id
  WHERE o.status = 'pending'
    AND o.created_at > NOW() - INTERVAL '7 days';

-- Key things to look for in output:
-- "Rows Removed by Filter" → seq scan missing index
-- "actual rows=50000  rows=1" → stale stats, run ANALYZE
-- "Nested Loop" on large tables → add index or rewrite join
-- "Buffers: hit=X  read=Y" → Y > 0 means disk I/O`,
    tags: ["execution-plan", "explain-analyze", "query-optimization", "postgres", "seq-scan", "join-strategy"]
  },

  {
    id: "2.2.03",
    section: 2,
    subsection: "2.2",
    level: "intermediate",
    question: "When do you normalise and when do you denormalise a relational schema?",
    quick_answer: "→ Normalise to remove redundancy, enforce integrity, simplify writes\n→ Denormalise to reduce joins, speed reads, avoid N+1 at scale\n→ Start normalised (3NF) — denormalise only when you have measured the bottleneck\n→ Common techniques: pre-joined read models, computed columns, summary tables\n→ Denormalisation trades write complexity for read speed — always explicit, never accidental",
    detailed_answer: "Normalisation is the process of structuring a schema to reduce data redundancy and enforce consistency through foreign keys and constraints. Third Normal Form (3NF) is the practical target: each non-key attribute depends on the whole key and nothing but the key.\n\nBenefits of normalisation: no data anomalies (update a customer's city in one place, not 10,000 order rows), smaller storage, simpler writes, cleaner constraint enforcement. Cost: reads require joins, and joins become expensive at scale.\n\nDenormalisation deliberately reintroduces redundancy to speed reads. Common patterns:\n- Pre-joined tables: store user_email on the orders table so fetching an order page doesn't require joining users\n- Computed columns: store order_item_count on orders so listing views don't COUNT(*) from line_items\n- Summary tables: maintain a daily_revenue table updated via triggers or jobs, so analytics queries scan thousands of rows rather than billions\n- Materialised views: Postgres-native pre-computed joins refreshed on schedule\n\nThe decision framework: start with a normalised schema. As the system grows, profile queries. When a join is responsible for >20% of read latency at scale, consider denormalisation at that specific join. Never denormalise speculatively.\n\nThe write complexity cost is real. When a user's email changes, you now update both the users table and every orders row. Either you accept eventual consistency (background job reconciles), or you use a trigger, or you build an update path in the application. Each choice adds failure modes.\n\nMaterialised views (Postgres, MySQL 8+) give you the best of both worlds for read-heavy analytics: the source stays normalised, the view is pre-computed. Refresh on demand or on a schedule. The downside: reads are always against potentially stale data.",
    key_points: [
      "Start normalised (3NF) — eliminates anomalies and simplifies writes",
      "Denormalise only when a measured join is a proven bottleneck at scale",
      "Common denorm patterns: pre-joined columns, computed aggregates, summary tables, materialised views",
      "Every denormalised field creates a write obligation — must stay in sync",
      "Materialised views offer normalised source + fast reads with acceptable staleness",
      "Accidental denormalisation (copied columns without a sync plan) causes silent data drift"
    ],
    hint: "Take a specific read query that's slow. Count the joins. Which join is the bottleneck? What would it take to eliminate just that one join — and what would you break in the write path?",
    common_trap: "Denormalising proactively 'for performance' before measuring. You pay the write complexity cost upfront and often find the joins were never the bottleneck — it was missing indexes or stale statistics all along.",
    follow_up_questions: [
      { text: "What is a materialised view and when do you use it?", type: "inline", mini_answer: "A pre-computed, stored result of a query — refreshed on demand (REFRESH MATERIALIZED VIEW) or via triggers. Use for: expensive JOIN+aggregate queries hit frequently, analytics on normalised OLTP data, read replicas where you want pre-computed summaries. Trade-off: refresh lag (reads may be stale) and storage cost. Postgres supports CONCURRENTLY refresh to avoid locking." },
      { text: "How does denormalisation relate to CQRS?", type: "linked", links_to: "2.7.01", mini_answer: "CQRS takes denormalisation to its logical extreme: maintain a fully separate read model (the Query side) shaped exactly for reads, updated asynchronously from the write model. Instead of adding a few pre-joined columns, you build a dedicated projection store — often denormalised, often in a different database. CQRS formalises the 'write and read schemas can differ' insight." },
      { text: "What is the N+1 query problem?", type: "inline", mini_answer: "Fetching N records then issuing one query per record to fetch related data: load 100 orders (1 query), then for each order load the user (100 queries) = 101 queries total. Fix options: JOIN at the DB level, batch loading (WHERE user_id IN (...)), or denormalise user fields onto the order row. ORMs silently generate N+1 unless you use eager loading." }
    ],
    related: ["2.2.01", "2.2.02", "2.5.01", "2.7.01"],
    has_diagram: false,
    diagram: "",
    has_code: true,
    code_language: "sql",
    code_snippet: `-- Normalised: join required every read
SELECT o.id, u.email, u.name, o.total
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.id = 123;

-- Denormalised: user_email stored on orders
SELECT id, user_email, total
FROM orders
WHERE id = 123;   -- no join needed

-- Materialised view: best of both worlds
CREATE MATERIALIZED VIEW order_summary AS
  SELECT o.id, u.email, u.name, o.total,
         COUNT(li.id) AS item_count
  FROM orders o
  JOIN users u ON u.id = o.user_id
  JOIN line_items li ON li.order_id = o.id
  GROUP BY o.id, u.email, u.name, o.total;

REFRESH MATERIALIZED VIEW CONCURRENTLY order_summary;`,
    tags: ["normalisation", "denormalisation", "schema-design", "materialised-views", "n-plus-one", "postgres"]
  },

  {
    id: "2.2.04",
    section: 2,
    subsection: "2.2",
    level: "advanced",
    question: "What advanced Postgres features should an architect know, and when do they replace specialist databases?",
    quick_answer: "→ JSONB: document store inside Postgres — replaces Mongo for most use cases\n→ Full-text search (tsvector/tsquery): replaces Elasticsearch for moderate search needs\n→ Table partitioning: range/list/hash — replaces manual sharding for time-series\n→ Logical replication: CDC and read replicas with column-level filtering\n→ pg_vector: vector similarity search — replaces Pinecone for <10M vectors",
    detailed_answer: "Postgres has grown into a multi-model database. Many systems that reach for a specialist store first could have stayed on Postgres longer. The architect's job is knowing where Postgres is genuinely good enough and where the specialist tool earns its operational cost.\n\nJSONB (binary JSON): stores and indexes nested JSON documents. Supports GIN indexes on any JSON key, partial updates with operators (jsonb_set), and full SQL over mixed structured/unstructured data. Replaces MongoDB for most non-sharded workloads — you keep ACID, joins, and mature tooling. Limitation: no built-in horizontal sharding (use Citus or Postgres partitioning for that).\n\nFull-text search: tsvector stores preprocessed lexemes; tsquery runs ranked search. GIN indexes make searches fast. Handles stemming, stop words, and ranking via ts_rank. Replaces Elasticsearch for apps needing 'search this corpus' without the complexity of running a separate cluster. Limitation: no ML-based semantic search, no faceted search UI, less tunable ranking than ES.\n\nDeclarative table partitioning (Postgres 10+): range partitioning on a timestamp column creates sub-tables per month/year. Queries filtering on the partition key skip irrelevant partitions entirely (partition pruning). DROP TABLE on old partitions deletes data instantly. Replaces manual time-series sharding for most time-series OLTP workloads.\n\nLogical replication: stream row-level changes (WAL) to downstream consumers — other Postgres instances, Debezium, Kafka. Supports column-level filtering and row filtering. Enables CDC pipelines without an agent on the source server.\n\npg_vector: adds a VECTOR column type with IVFFlat and HNSW indexes for approximate nearest-neighbour search. Handles tens of millions of vectors well. Replaces Pinecone/Weaviate for RAG pipelines where you already have Postgres and vector count is modest.\n\nThe pattern: start with Postgres. Reach for a specialist tool only when Postgres's version of the feature hits a measurable wall (scale, latency, query expressiveness).",
    key_points: [
      "JSONB + GIN indexes = document store inside Postgres, with full ACID and SQL",
      "tsvector/tsquery = capable full-text search for moderate scale, no extra cluster",
      "Declarative partitioning = time-series data lifecycle management, partition pruning",
      "Logical replication = CDC and multi-target replication without agents",
      "pg_vector = vector similarity search, replaces specialist vector DB up to ~50M vectors",
      "Rule: start with Postgres, specialise when you hit a measured wall"
    ],
    hint: "For a system that needs document storage AND full-text search AND vector similarity — what's your instinct: three separate databases or one? What would tip you toward splitting them out?",
    common_trap: "Reaching for Elasticsearch 'for search' or MongoDB 'for documents' without first checking if Postgres JSONB + tsvector would serve the load. You save an entire cluster, a different query language, and a consistency headache.",
    follow_up_questions: [
      { text: "When does Elasticsearch beat Postgres full-text search?", type: "inline", mini_answer: "ES wins when: relevance tuning matters deeply (BM25 + custom boosting, ML ranking), faceted search with aggregation facets is core UX, corpus is hundreds of millions of documents, multi-language stemming is needed, or you need near-real-time indexing of high-volume writes. For a standard site search over 10M records, Postgres is operationally simpler and usually sufficient." },
      { text: "What is Citus and when would you add it?", type: "inline", mini_answer: "Citus is a Postgres extension (also offered as Azure Cosmos DB for PostgreSQL) that shards tables across multiple nodes. It transparently routes queries based on a distribution column. Use it when a single Postgres instance has hit its storage or write throughput ceiling. Cost: operational complexity, distributed join limitations, single-node Postgres is worth exhausting first." },
      { text: "How does pg_vector compare to dedicated vector databases?", type: "inline", mini_answer: "pg_vector: ACID transactions, SQL joins between vectors and metadata, no extra infra, good up to ~50M vectors at moderate QPS. Pinecone/Weaviate/Qdrant: purpose-built for ANN, higher QPS at hundreds of millions of vectors, better filtering, managed service. Choose pg_vector when you're already on Postgres and vector scale is modest; choose specialist DB at large scale or high-velocity search." }
    ],
    related: ["2.2.01", "2.3.01", "2.1.02", "9.6.01"],
    has_diagram: false,
    diagram: "",
    has_code: true,
    code_language: "sql",
    code_snippet: `-- JSONB: store and index nested documents
CREATE INDEX idx_products_attrs
  ON products USING GIN (attributes);

SELECT * FROM products
WHERE attributes @> '{"colour": "red", "size": "M"}';

-- Full-text search
ALTER TABLE articles ADD COLUMN search_vec tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || body)
  ) STORED;

CREATE INDEX idx_articles_fts ON articles USING GIN (search_vec);

SELECT title, ts_rank(search_vec, query) AS rank
FROM articles, to_tsquery('english', 'distributed & systems') query
WHERE search_vec @@ query
ORDER BY rank DESC LIMIT 10;

-- Range partitioning by month
CREATE TABLE events (
  id BIGSERIAL, user_id INT, created_at TIMESTAMPTZ
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2026_01 PARTITION OF events
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');`,
    tags: ["postgres", "jsonb", "full-text-search", "partitioning", "pg-vector", "logical-replication"]
  },


  // ============================================================
  // 2.3  NoSQL DATABASES  (5 questions)
  // ============================================================

  {
    id: "2.3.01",
    section: 2,
    subsection: "2.3",
    level: "intermediate",
    question: "How do you model data in MongoDB, and what are the embed vs reference trade-offs?",
    quick_answer: "→ Embed when data is accessed together, owned by the parent, and bounded in size\n→ Reference when data is shared across documents, unbounded, or updated independently\n→ Denormalise for reads: embed child data the parent always needs\n→ Avoid arrays that grow unboundedly — they bloat documents and break index performance\n→ Model around access patterns first, not entity relationships",
    detailed_answer: "MongoDB's document model lets you store related data together in a single document, avoiding joins. The core design decision is whether related entities should be embedded (nested subdocuments or arrays) or referenced (stored separately with an id pointer).\n\nEmbed when: the child entity has no meaning outside the parent (order line items exist only within an order), data is always read together, the child set is small and bounded, and the child is never shared between parents. Embedding gives you atomic reads and writes of the whole aggregate in one operation.\n\nReference when: the child is shared across multiple parents (a product referenced by many orders), the child set is unbounded (a user's comments could be millions), the child is updated frequently and independently, or you need to query the child entities directly without going through the parent.\n\nThe unbounded array problem is the most common design mistake. If you embed all of a user's events inside the user document, the document grows without limit. MongoDB's 16MB document size cap becomes a production incident. Use a separate events collection, reference by user_id.\n\nThe aggregation pipeline is MongoDB's equivalent of SQL GROUP BY + JOIN. It chains stages — $match (filter), $lookup (join), $group (aggregate), $project (reshape), $sort, $limit. It runs server-side and is efficient for analytical queries within MongoDB's model, but complex multi-stage pipelines are harder to reason about and optimise than SQL.\n\nPractical default: model like an API response. If your endpoint always returns order + line items + shipping address together, embed all three. If it sometimes returns just order metadata, consider the payload size and whether embedding makes documents large for no benefit.",
    key_points: [
      "Embed: child owned by parent, small/bounded set, always read together",
      "Reference: shared entities, unbounded arrays, independently updated",
      "Unbounded embedded arrays → 16MB doc limit and index degradation",
      "Model around the API response shape, not the entity-relationship diagram",
      "Aggregation pipeline = MongoDB's server-side SQL; powerful but verbose",
      "No ACID across documents by default — multi-doc transactions available but costly"
    ],
    hint: "Pick a specific API endpoint this MongoDB collection will serve. What data does it return in one call? That's the embed candidate. What data does it update separately? That's the reference candidate.",
    common_trap: "Modelling MongoDB like a relational database — separate collections for every entity with id references everywhere, then $lookup to join them all. You lose the document model benefit and gain the worst of both worlds: NoSQL operational complexity with relational query patterns.",
    follow_up_questions: [
      { text: "How do MongoDB multi-document transactions compare to SQL ACID?", type: "inline", mini_answer: "Since MongoDB 4.0, multi-document ACID transactions are supported (4.2 for sharded clusters). They work like SQL transactions — start, read/write multiple documents, commit or rollback. Cost: significant performance overhead vs single-document operations. Design principle: if you need frequent multi-document transactions, MongoDB may be the wrong choice — SQL gives you ACID for free on every query." },
      { text: "When does MongoDB's aggregation pipeline beat SQL?", type: "inline", mini_answer: "MongoDB wins when: data is already in nested document form (reshaping JSON is natural), schema varies across documents requiring conditional processing, or you're processing large volumes of schemaless event data. SQL wins for: complex joins across many tables, ad-hoc queries, window functions, and when schema is stable. For analytics on normalised data, SQL is almost always cleaner." },
      { text: "How do you handle schema evolution in MongoDB?", type: "inline", mini_answer: "Three strategies: (1) No-op — old docs missing a field get null/default in app code. (2) Lazy migration — update documents the next time they're written. (3) Bulk migration — background job rewrites all documents. MongoDB's schemaless nature makes zero-downtime migration easier than SQL ALTER TABLE, but it means your application code must handle multiple document shapes simultaneously." }
    ],
    related: ["2.1.02", "2.1.04", "2.5.01", "2.5.02"],
    has_diagram: false,
    diagram: "",
    has_code: true,
    code_language: "javascript",
    code_snippet: `// EMBED: line items owned by order, bounded, always read together
{
  _id: "order_123",
  user_id: "user_456",
  status: "pending",
  line_items: [                        // bounded array — safe to embed
    { product_id: "p1", qty: 2, price: 9.99 },
    { product_id: "p2", qty: 1, price: 24.99 }
  ]
}

// REFERENCE: comments are unbounded — separate collection
// orders collection
{ _id: "order_123", user_id: "user_456" }

// comments collection
{ _id: "c1", order_id: "order_123", text: "...", created_at: ISODate() }
{ _id: "c2", order_id: "order_123", text: "...", created_at: ISODate() }

// Aggregation pipeline: orders by user with total spend
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$user_id", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  { $sort: { total: -1 } },
  { $limit: 10 }
]);`,
    tags: ["mongodb", "document-modeling", "embed-vs-reference", "aggregation-pipeline", "nosql"]
  },

  {
    id: "2.3.02",
    section: 2,
    subsection: "2.3",
    level: "advanced",
    question: "How do you model data in Cassandra, and what makes partition key design critical?",
    quick_answer: "→ Partition key determines which node holds the data — must be in every query\n→ Clustering key determines sort order within a partition — enables range scans\n→ One table per query pattern — denormalise aggressively, no joins allowed\n→ Hot partition = one key receiving all writes → distributes data unevenly → avoid\n→ Tombstones from deletes accumulate — design TTL and compaction strategy upfront",
    detailed_answer: "Cassandra's data model is fundamentally different from relational: you design tables around the queries you'll run, not the entities in your domain.\n\nEvery table has a primary key consisting of a partition key (one or more columns) and optional clustering columns. The partition key is hashed to determine which node stores the row. All rows with the same partition key live on the same node and are stored contiguously on disk — this enables fast range reads within a partition.\n\nQuery rules: every query must include the full partition key as an equality filter. You cannot filter on a non-partition-key column without an index (and secondary indexes in Cassandra are a performance trap for most use cases). This means you must create a separate table for every distinct query pattern.\n\nExample: if you need to query messages by conversation_id AND by user_id, you need two tables — one partitioned by conversation_id, one by user_id. Yes, this means storing the same data twice. This is intentional.\n\nClustering columns define the sort order of rows within a partition. If your partition key is conversation_id and clustering key is (created_at DESC), you can efficiently fetch the 20 most recent messages with LIMIT — the data is already sorted on disk.\n\nHot partitions are the critical failure mode. If your partition key is date (e.g., all today's events), every write goes to one node — you've built a bottleneck. Fix: add high-cardinality to partition key (user_id + date, or bucket = user_id % 10).\n\nTombstones: Cassandra doesn't delete data immediately — it writes a tombstone marker. On reads, tombstones are scanned and filtered. Many deletes → many tombstones → read amplification → latency spikes. Design around append-only or use TTL on time-series data instead of explicit deletes.",
    key_points: [
      "Partition key = routing key; every query must supply it as equality filter",
      "Clustering key = sort order within partition; enables efficient range reads",
      "One table per query pattern — joins don't exist, denormalise everything",
      "Hot partitions are the most common Cassandra production failure",
      "Tombstones from deletes cause read amplification — prefer TTL over DELETE",
      "Consistency levels (ONE/QUORUM/ALL) are tunable per operation, not per table"
    ],
    hint: "Before designing the table, write down the exact CQL query you'll run. Now: what's the partition key (must be equality filter)? What's the sort order you need (clustering key)? Build the table to serve that query.",
    common_trap: "Creating a single Cassandra table like a relational table, then discovering you need to filter by a non-partition-key column. Adding a secondary index feels like a fix but performs a scatter-gather across all nodes — worse than a full table scan at scale.",
    follow_up_questions: [
      { text: "What is a wide row in Cassandra and when is it useful?", type: "inline", mini_answer: "A wide row is a partition with many clustering rows — e.g., partition key = user_id, clustering key = event_timestamp, storing all events per user in one partition. Reading the last N events is a single-node range scan, very fast. Risk: partition becomes too large (recommended limit ~100MB or 100k rows). Solution: add a time bucket to the partition key (user_id + year_month) to cap partition size." },
      { text: "How do Cassandra's consistency levels affect CAP behaviour?", type: "linked", links_to: "2.1.01", mini_answer: "Cassandra is AP by default (writes/reads succeed with ONE consistency). Set QUORUM (majority of replicas must agree) for stronger consistency at latency cost. Set ALL for strict consistency at availability cost. The rule: if write_consistency + read_consistency > replication_factor, you get strong consistency. QUORUM+QUORUM with RF=3 gives consistency; ONE+ONE gives availability." },
      { text: "How do you handle time-series data at scale in Cassandra?", type: "inline", mini_answer: "Pattern: partition key = (sensor_id, bucket) where bucket = YYYYMM or YYYYMMDD, clustering key = timestamp DESC. This caps partition size, enables efficient range reads (recent N readings), and distributes writes across nodes by sensor. TTL on the row auto-expires old data without tombstone buildup. Compaction strategy: TimeWindowCompactionStrategy groups SSTables by time bucket for efficient expiry." }
    ],
    related: ["2.1.04", "2.8.01", "2.8.02", "2.6.01"],
    has_diagram: true,
    diagram: `   CASSANDRA — partition key routes, clustering key sorts

   Primary key = (partition_key, clustering_col1, clustering_col2)
                       │                    │
                       ▼                    ▼
              hash → node          sort on disk within partition

   Table: messages_by_conversation
   ┌────────────────────┬─────────────────┬──────────┐
   │  conversation_id   │  created_at ▼   │  text    │
   │  (partition key)   │  (clustering)   │          │
   ├────────────────────┼─────────────────┼──────────┤
   │  conv_abc          │  2026-04-29...  │  "hi"    │
   │  conv_abc          │  2026-04-28...  │  "hey"   │
   │  conv_xyz          │  2026-04-27...  │  "hello" │
   └────────────────────┴─────────────────┴──────────┘
   Query MUST include: WHERE conversation_id = 'conv_abc'`,
    has_code: true,
    code_language: "sql",
    code_snippet: `-- One table per query pattern
CREATE TABLE messages_by_conversation (
  conversation_id UUID,
  created_at      TIMESTAMP,
  message_id      UUID,
  sender_id       UUID,
  text            TEXT,
  PRIMARY KEY (conversation_id, created_at, message_id)
) WITH CLUSTERING ORDER BY (created_at DESC);

-- Fast: hits one partition, reads sorted rows
SELECT * FROM messages_by_conversation
WHERE conversation_id = ? LIMIT 20;

-- For "by user" queries — second table, same data
CREATE TABLE messages_by_user (
  user_id         UUID,
  created_at      TIMESTAMP,
  message_id      UUID,
  conversation_id UUID,
  PRIMARY KEY (user_id, created_at, message_id)
) WITH CLUSTERING ORDER BY (created_at DESC);`,
    tags: ["cassandra", "partition-key", "data-modeling", "wide-column", "nosql", "hot-partition"]
  },

  {
    id: "2.3.03",
    section: 2,
    subsection: "2.3",
    level: "intermediate",
    question: "What Redis data structures should an architect know, and how do they map to real use cases?",
    quick_answer: "→ String: counters, idempotency keys, simple cache values\n→ Hash: object fields — store user session or config as key-value pairs\n→ Sorted Set: leaderboards, rate limiting, time-ordered events (score = timestamp)\n→ List: queues, recent activity feeds (LPUSH/RPOP = FIFO queue)\n→ Stream: durable message log with consumer groups — lightweight Kafka alternative",
    detailed_answer: "Redis is not just a cache. It's an in-memory data structure server with a rich type system. Picking the right data structure often eliminates application-level logic.\n\nString: atomic increment (INCR), SET with TTL (SETEX), compare-and-swap (SET key value NX — only if not exists). Use for: counters, idempotency keys, distributed locks (SET lock NX PX 5000), simple caching.\n\nHash: a map of field → value stored under one key. More memory-efficient than JSON strings for structured objects. Use for: user sessions (HSET session:123 user_id 456 expires 1800), configuration objects, rate limit state per-endpoint.\n\nList: ordered linked list, O(1) push/pop from either end. Use for: FIFO queue (LPUSH jobs, BRPOP consumer), recent activity (LPUSH + LTRIM to cap at N), chat history.\n\nSorted Set: each member has a floating-point score. ZADD, ZRANGE, ZREVRANGE, ZRANGEBYSCORE all run O(log N). Use for: leaderboards (score = points), rate limiting (score = timestamp, prune old members), priority queues, time-ordered event windows.\n\nStream: append-only log with consumer groups, message IDs, and acknowledgement. Persistent across restarts (AOF/RDB). Use for: task queues needing exactly-once processing, audit logs, lightweight event bus without Kafka complexity.\n\nPersistence: Redis by default is in-memory only — a restart loses all data. RDB snapshots to disk periodically (acceptable data loss). AOF (append-only file) logs every write — slower but recoverable to last second. In cache-only use cases, persistence is often disabled entirely.\n\nSentinel vs Cluster: Sentinel gives automatic failover for a single primary. Cluster shards data across nodes for horizontal scale — but multi-key operations (transactions, MGET) only work when all keys hash to the same slot.",
    key_points: [
      "String: counters, TTL cache, distributed locks (SET NX PX)",
      "Sorted Set: leaderboards, rate limiting, time-window sliding windows",
      "Stream: durable consumer-group-based message log — lightweight Kafka",
      "List: FIFO/LIFO queues, capped recent activity feeds",
      "Persistence is optional — disable for pure cache, enable AOF for durability",
      "Cluster shards keys — multi-key ops require hash tags {user:123}:* to co-locate"
    ],
    hint: "Name a feature in your system — leaderboard, rate limiter, session store, job queue. Walk through exactly which Redis commands you'd use and what the key structure looks like.",
    common_trap: "Using Redis Strings to store serialised JSON for everything, missing the richer types. Storing a user session as JSON means reading/writing the whole blob to change one field. A Hash lets you HSET a single field in O(1).",
    follow_up_questions: [
      { text: "How do you implement a sliding window rate limiter in Redis?", type: "inline", mini_answer: "Use a Sorted Set: key = ratelimit:{user_id}:{endpoint}, score = timestamp (ms), member = request UUID. On each request: ZADD to add new request, ZREMRANGEBYSCORE to remove members older than window, ZCARD to count current requests. Wrap in MULTI/EXEC for atomicity, or use a Lua script. O(log N) per request, auto-expires old entries." },
      { text: "When would you use Redis Streams over a simple List queue?", type: "inline", mini_answer: "List queues: simple FIFO, no acknowledgement, message gone once popped. Streams: message stays in log after delivery, consumer groups allow multiple workers to consume partitions independently, XACK marks processed, XPENDING shows unacknowledged messages for retry. Use Streams when you need at-least-once delivery guarantees or fan-out to multiple consumer groups." },
      { text: "What are the Redis persistence trade-offs for a caching use case?", type: "inline", mini_answer: "For pure cache: no persistence needed — on restart, cache is cold and warms from source DB. For session store: AOF or RDB snapshot to avoid logging users out on restart. Trade-off: AOF every-write adds ~10-20% write overhead; RDB snapshots can cause latency spikes during fork. Many prod setups: RDB every 60s + AOF for session/queue data, no persistence for cache." }
    ],
    related: ["2.4.01", "2.4.02", "4.2.04"],
    has_diagram: false,
    diagram: "",
    has_code: true,
    code_language: "bash",
    code_snippet: `# Distributed lock (SET NX PX = set if not exists, expire in ms)
SET lock:order:123 "worker-1" NX PX 5000

# Rate limiter — sliding window with Sorted Set
MULTI
  ZADD ratelimit:user:456 1714300000000 "req-uuid-1"
  ZREMRANGEBYSCORE ratelimit:user:456 0 1714299940000   # remove >60s old
  ZCARD ratelimit:user:456                               # count in window
EXEC

# Leaderboard
ZADD game:scores 15420 "player:alice"
ZADD game:scores 18900 "player:bob"
ZREVRANGE game:scores 0 9 WITHSCORES    # top 10 with scores

# Session as Hash (update one field without reading whole object)
HSET session:abc123 user_id 789 role "admin" expires 1714303600
HGET session:abc123 user_id`,
    tags: ["redis", "data-structures", "sorted-set", "streams", "rate-limiting", "distributed-lock"]
  },

  {
    id: "2.3.04",
    section: 2,
    subsection: "2.3",
    level: "advanced",
    question: "What is DynamoDB single-table design and when should you use it?",
    quick_answer: "→ Single table stores all entity types together, differentiated by PK/SK prefixes\n→ Enables fetching multiple entity types in one query (no joins, no multiple round trips)\n→ GSIs create alternative access patterns without a second table\n→ Use when: access patterns are known upfront and stable, at massive scale\n→ Avoid when: access patterns are exploratory or ad-hoc — ops cost not worth it",
    detailed_answer: "DynamoDB's single-table design packs all entity types into one table using a generic partition key (PK) and sort key (SK) whose values encode the entity type and identifier.\n\nIn a multi-table design you'd have: users, orders, line_items tables. In single-table: one table where PK=USER#123 + SK=PROFILE gives the user record, PK=USER#123 + SK=ORDER#456 gives that user's order, and PK=ORDER#456 + SK=LINE#1 gives a line item. A single query with PK=USER#123 and SK begins_with 'ORDER#' returns all orders for that user in one round trip.\n\nThe benefit is access-pattern efficiency: you can fetch a user and all their orders (and metadata) in a single Query call. At DynamoDB's scale and pricing model (pay per read unit), reducing round trips is directly a cost and latency win.\n\nGlobal Secondary Indexes (GSIs) flip the key structure for alternative access patterns. If you need orders by status, a GSI with PK=STATUS and SK=CREATED_AT gives you that query without scanning the whole table.\n\nThe cost of single-table design: the schema is opaque without documentation, ad-hoc queries are nearly impossible, and onboarding engineers is harder. Adding a new access pattern requires a new GSI (max 20 per table) or schema change.\n\nWhen to use: you know your access patterns upfront (API-driven product, stable query set), you're at Amazon scale (hundreds of thousands of requests/sec), and you have engineers who understand the pattern. When not to use: early-stage product where requirements change constantly, analytical workloads, or teams who'll maintain it without DynamoDB expertise. Most applications don't need single-table design — standard DynamoDB with one table per entity is simpler and fine.",
    key_points: [
      "Single-table: all entities in one table, PK/SK prefixes encode type and id",
      "One Query call fetches multiple entity types — no joins, no N+1",
      "GSIs enable alternative access patterns without full-table scans",
      "Cost: opaque schema, no ad-hoc queries, 20 GSI max per table",
      "Only justified at high scale with stable, known access patterns",
      "Multi-table design is simpler for most products — don't optimise prematurely"
    ],
    hint: "List the 5 most common queries your API makes. Now ask: how many DynamoDB round trips does each one take with multi-table? With single-table? If the answer is '1 vs 3' for a critical hot path — single-table has a case.",
    common_trap: "Adopting single-table design because a DynamoDB expert blog recommended it, then discovering your product roadmap requires query patterns you didn't anticipate. GSIs run out, schema gymnastics begin, and you'd have been better off with Postgres from day one.",
    follow_up_questions: [
      { text: "What is a GSI overload pattern?", type: "inline", mini_answer: "Re-using a GSI for multiple query patterns by varying the GSI key value by entity type. Example: GSI1PK = 'STATUS#pending' for orders but 'REGION#eu' for locations — the same index serves both. It maximises GSI usage (stays under the 20-GSI limit) but makes the schema even harder to reason about. Only worth it on extremely high-scale, stable schemas." },
      { text: "How does DynamoDB pricing compare to Postgres at scale?", type: "inline", mini_answer: "DynamoDB: pay per RCU/WCU (read/write capacity unit) or on-demand, plus storage. At high but steady load, provisioned capacity is cheap. At unpredictable burst, on-demand is expensive. Postgres on RDS: fixed instance cost regardless of query volume — predictable but pays for idle. DynamoDB wins at truly massive or highly variable scale; RDS Postgres wins at moderate, predictable workloads." },
      { text: "How does DynamoDB handle transactions?", type: "inline", mini_answer: "TransactWriteItems: atomic write across up to 25 items in multiple tables. TransactGetItems: consistent read across up to 25 items. Both use 2× the read/write capacity of standard operations and are limited to one region. Use for: inventory deduction (check stock + decrement atomically), financial transfers, any multi-item invariant. Avoid for high-frequency ops — capacity cost doubles." }
    ],
    related: ["2.1.04", "2.3.02", "2.8.01"],
    has_diagram: true,
    diagram: `   DynamoDB SINGLE-TABLE — all entities, one table

   PK              SK                   Attributes
   ─────────────── ──────────────────── ──────────────────
   USER#123        PROFILE              name, email
   USER#123        ORDER#456            status, total
   USER#123        ORDER#789            status, total
   ORDER#456       LINE#1               product_id, qty
   ORDER#456       LINE#2               product_id, qty
   PRODUCT#abc     DETAILS              name, price, stock

   Query: PK=USER#123, SK begins_with "ORDER#"
   → returns all orders for user in one call, no joins`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["dynamodb", "single-table-design", "gsi", "nosql", "access-patterns"]
  },

  {
    id: "2.3.05",
    section: 2,
    subsection: "2.3",
    level: "intermediate",
    question: "When should you introduce Elasticsearch, and what are its operational costs?",
    quick_answer: "→ ES wins for: full-text search with relevance ranking, faceted search, log analytics\n→ Not a primary database — sync it from a source of truth via CDC or dual-write\n→ Near-real-time: index updates visible in ~1 second (not milliseconds)\n→ Operational cost is high: JVM tuning, shard management, heap sizing, index lifecycle\n→ For <10M docs with keyword search needs, try Postgres tsvector first",
    detailed_answer: "Elasticsearch is a distributed search and analytics engine built on Apache Lucene. It stores JSON documents in an inverted index — words map to the documents containing them, enabling fast full-text search across millions of records.\n\nES wins when: relevance-ranked full-text search is core UX (BM25 scoring, custom boosting), you need faceted navigation (aggregate counts by category, price range, rating simultaneously), you're doing log/event analytics (Kibana dashboards, time-series aggregations), or your corpus is hundreds of millions of documents where Postgres tsvector would strain.\n\nES is not a primary data store. It doesn't support ACID transactions, doesn't handle arbitrary relational queries well, and its eventual consistency model (segment merges, refresh intervals) means indexed documents aren't immediately visible. Keep a source-of-truth (Postgres, DynamoDB) and sync to ES via CDC or background jobs. If you write directly to ES only, you have no recoverable copy when your index needs rebuilding.\n\nOperational complexity is the hidden cost. ES requires JVM heap tuning (typically 50% of RAM, max 31GB to avoid compressed oops degradation), shard sizing (a common rule: shards ≤ 50GB), replica management for HA, index lifecycle management (ILM) for rollover and deletion of old indices, and cluster state monitoring. Small teams underestimate this until the first production incident.\n\nSharding: an index is split into primary shards distributed across nodes. More shards = more parallelism but more overhead. A common mistake is creating too many shards for small indices — each shard is a Lucene instance with fixed overhead. General rule: 1-2 shards per node for indices under 10GB.\n\nModern alternatives to consider: OpenSearch (AWS fork), Typesense (simpler, developer-friendly), Meilisearch (low-ops), or Postgres full-text search for modest scale.",
    key_points: [
      "Inverted index enables fast full-text search and relevance ranking — Lucene's strength",
      "Not a primary store — sync from source of truth, don't write exclusively to ES",
      "Near-real-time, not real-time — refresh interval default 1s, tunable but with tradeoffs",
      "Faceted search + aggregations are ES's strongest differentiator over Postgres FTS",
      "JVM tuning and shard management are the main operational burdens",
      "Typesense/Meilisearch are simpler alternatives for developer experience at lower scale"
    ],
    hint: "Would a user tolerate a 1-second lag between publishing content and seeing it in search results? That's the ES refresh interval trade-off. What's the worst-case if it's 5 seconds during heavy indexing?",
    common_trap: "Using Elasticsearch as the primary write target, skipping a source of truth. When you need to rebuild the index (mapping change, corruption, cluster migration), you have nothing to replay from. Always write to the authoritative store first.",
    follow_up_questions: [
      { text: "What is the ES split-brain problem and how do you prevent it?", type: "inline", mini_answer: "Split-brain: a network partition causes two ES sub-clusters to both elect a master. Both accept writes, leading to diverged state that's hard to reconcile. Prevention: set discovery.zen.minimum_master_nodes = (N/2)+1 (quorum). With 3 master-eligible nodes, set to 2. In modern ES (7+), this is automatic via the cluster coordination layer. Always use an odd number of master-eligible nodes." },
      { text: "How do you keep Elasticsearch in sync with Postgres?", type: "linked", links_to: "4.4.05", mini_answer: "Three patterns: (1) Dual-write: app writes Postgres + ES synchronously — simple but risks divergence on ES failure. (2) CDC via Debezium: capture Postgres WAL changes, stream to Kafka, ES consumer indexes them — ~1s lag, resilient. (3) Polling job: periodic SELECT of recently modified rows, re-index in ES — simplest but high lag and DB load. CDC is the production standard for keeping ES in sync." },
      { text: "When does Elasticsearch beat a vector database for semantic search?", type: "inline", mini_answer: "ES 8+ has native dense_vector fields with HNSW approximate nearest-neighbour search, plus BM25 text matching. Hybrid search (text + vector in one query, combined scoring) is where ES beats pure vector DBs — you get keyword precision AND semantic recall. Pure vector DBs (Pinecone, Qdrant) beat ES on very high QPS purely vector workloads. ES wins when semantic + keyword hybrid search is needed." }
    ],
    related: ["2.2.04", "2.1.02", "4.4.05"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["elasticsearch", "full-text-search", "inverted-index", "search", "nosql", "observability"]
  },


  // ============================================================
  // 2.4  CACHING STRATEGIES  (5 questions)
  // ============================================================

  {
    id: "2.4.01",
    section: 2,
    subsection: "2.4",
    level: "intermediate",
    question: "What are the core caching patterns (cache-aside, read-through, write-through, write-behind), and when do you use each?",
    quick_answer: "→ Cache-aside: app checks cache, on miss loads from DB and populates cache — most common\n→ Read-through: cache loads from DB on miss automatically — simpler app code\n→ Write-through: every write goes to cache AND DB synchronously — no stale data, slower writes\n→ Write-behind: write to cache first, DB async — fast writes, risk of data loss\n→ Default: cache-aside for reads, write-through for write-critical data",
    detailed_answer: "Caching patterns define how data flows between the cache layer and the primary data store. Choosing the wrong pattern causes stale reads, data loss, or unnecessary complexity.\n\nCache-aside (lazy loading): the application checks the cache first. On a hit, return the cached value. On a miss, load from DB, write into cache, return. The application owns the cache population logic. Pros: only caches what's actually used, cache failure degrades gracefully (falls through to DB). Cons: cache miss on first read, risk of stale data after a DB write.\n\nRead-through: the cache sits in front of the DB and loads data automatically on miss. The app always talks to the cache. Pros: simpler application code — no explicit cache-population logic. Cons: the first read after a cache miss still hits the DB; cache vendor must know how to load your data (tighter coupling).\n\nWrite-through: every write goes to the cache and the DB synchronously before returning to the caller. Cache is always consistent with the DB. Pros: no stale reads, data always in both stores. Cons: write latency doubles (two round trips); you cache data that may never be read (wasted memory).\n\nWrite-behind (write-back): write to cache only, return success immediately. A background process flushes cache changes to the DB asynchronously. Pros: very fast writes. Cons: data loss if cache fails before flush; complex failure modes. Use only when writes are extremely hot and some loss is acceptable (analytics counters, view counts).\n\nMost production systems use cache-aside for reads. For write patterns: write-through for consistency-critical data (user profile changes, inventory), write-behind only for high-volume counters or telemetry where losing a few increments is acceptable.",
    key_points: [
      "Cache-aside: app drives population — flexible, most widely used",
      "Read-through: cache drives population — simpler app code, vendor coupling",
      "Write-through: always consistent — double write latency, memory waste risk",
      "Write-behind: fast writes, risk of data loss on cache failure",
      "Cache-aside + write-through is the safest combination for most production systems",
      "On cache failure: cache-aside degrades gracefully; write-behind risks data loss"
    ],
    hint: "What happens to your system if the cache crashes at 2am? Which pattern handles that gracefully vs which one loses data or corrupts reads?",
    common_trap: "Using write-behind 'for performance' without considering the flush failure path. If Redis restarts before flushing to Postgres, every pending write is lost. Most systems don't actually need write-behind — write-through with async index updates is usually sufficient.",
    follow_up_questions: [
      { text: "How do you handle cache warming after a cold start or deployment?", type: "inline", mini_answer: "Three strategies: (1) Lazy warm — accept cold cache, let it warm organically from real traffic. Simple but causes latency spike at startup. (2) Pre-warm — background job loads hot keys before routing traffic (e.g., top 1000 products by sales). (3) Read-through on first request — acceptable if the DB can absorb the cold-start load. For critical paths, pre-warm from a snapshot of last cache state." },
      { text: "What is cache stampede and how do you prevent it?", type: "linked", links_to: "2.4.05", mini_answer: "When a popular key expires simultaneously for thousands of requests — all miss at once and hammer the DB. Prevention: probabilistic early expiration (refresh key before it expires for most-read keys), mutex/lock on first miss (only one request loads from DB, others wait), or jitter on TTLs to spread expiry." },
      { text: "When is it better to have no cache at all?", type: "inline", mini_answer: "When data changes extremely frequently (cache would always miss), when consistency is non-negotiable (financial balances — stale reads cause real harm), when the dataset is small enough to fit entirely in DB memory (query cache is negligible), or when cache complexity would exceed the latency benefit. Always measure the actual cache hit rate before declaring caching necessary." }
    ],
    related: ["2.4.02", "2.4.03", "2.3.03", "4.2.04"],
    has_diagram: true,
    diagram: `   CACHING PATTERNS — flow comparison

   CACHE-ASIDE (most common)
   App → Cache hit? ──Yes──→ return data
              │ No
              ▼
           DB read → populate cache → return data

   WRITE-THROUGH
   App write → Cache write → DB write → return OK
               (synchronous — consistent, slower)

   WRITE-BEHIND
   App write → Cache write → return OK
                   │ async (background)
                   ▼
                DB write (risk: cache crash before flush)`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["caching", "cache-aside", "write-through", "write-behind", "read-through", "redis"]
  },

  {
    id: "2.4.02",
    section: 2,
    subsection: "2.4",
    level: "intermediate",
    question: "What are the cache invalidation strategies and why is invalidation considered one of the hardest problems in computing?",
    quick_answer: "→ TTL-based: expire after a fixed time — simple, eventual consistency, some staleness\n→ Event-driven: invalidate on write — consistent, requires write coordination\n→ Version/tag-based: cache key includes version — invalidate a group by bumping version\n→ Write-through: never stale, double write cost\n→ The hard problem: distributed writes + multiple cache nodes = no atomic invalidation",
    detailed_answer: "Cache invalidation is hard because you need to maintain consistency between two stores (cache and DB) across distributed systems, often without transactions bridging them.\n\nTTL (time-to-live): every cache entry expires after a fixed duration. Simplest strategy — no coordination needed. The trade-off is staleness: up to TTL seconds, a caller may read outdated data. Acceptable for product catalogues (5 minutes stale is fine), not acceptable for inventory counts (stale reads cause overselling).\n\nEvent-driven invalidation: when the source data changes, explicitly delete or update the cache key. The app or a DB trigger fires an invalidation event. More consistent than TTL but introduces a coordination problem — the write and the invalidation must be atomic or you have a race condition: (1) cache miss → load from DB → (2) DB update + cache delete → (3) old value written to cache. The classic fix is cache-aside: delete on write, reload on next miss.\n\nWrite-through: write to cache and DB together, so the cache is always current. No separate invalidation needed. Cost: every write is slower (two round trips), and you cache data that might never be read.\n\nVersion/tag-based invalidation: embed a version number or tag in the cache key (product_catalogue:v42). When the catalogue changes, bump the version — all old keys become orphans that expire by TTL. Atomic invalidation of thousands of related keys with a single counter increment. Used heavily by CDNs (cache tags / surrogate keys).\n\nWhy it's hard in distributed systems: you have N cache nodes, M writer processes, no global lock. A DB update on writer A needs to invalidate the key on all cache nodes before writer B re-populates. Race conditions are non-deterministic and only surface under load. The only truly safe option is short TTLs + accepting eventual consistency, or write-through.",
    key_points: [
      "TTL: simple, always some staleness — right for read-heavy, tolerance-for-stale data",
      "Event-driven invalidation: consistent but has write/invalidate race conditions",
      "Write-through: never stale, but doubles write latency",
      "Tag/version invalidation: invalidate groups atomically by bumping a version counter",
      "Distributed race: write + invalidate across nodes cannot be made atomic without a transaction spanning both stores",
      "Short TTL + tolerate staleness is often simpler than complex invalidation logic"
    ],
    hint: "Describe the exact sequence of events when two writers concurrently update the same cached key. What state does the cache end up in? How does your invalidation strategy handle that?",
    common_trap: "Relying on event-driven invalidation without accounting for the race between cache miss re-population and the invalidation event. Under concurrent load, a stale value gets written back to cache after the invalidation fires — TTL provides the backstop.",
    follow_up_questions: [
      { text: "What is cache-tag invalidation and how do CDNs use it?", type: "inline", mini_answer: "CDN surrogate keys / cache tags: tag each cached response with logical identifiers (product:123, category:shoes). When product 123 is updated, send a single purge request with tag 'product:123' — the CDN invalidates all responses carrying that tag across all edge nodes simultaneously. Cloudflare Cache Tags and Fastly Surrogate-Keys implement this. Scales to invalidating thousands of URLs with one API call." },
      { text: "How do you handle cache invalidation across microservices?", type: "inline", mini_answer: "Each service owns its own cache. When service A updates data that service B caches, emit a domain event (Kafka, SNS). Service B subscribes and invalidates its own cache on receipt. This decouples services — no direct cache invalidation calls. The trade-off: event lag means B's cache is stale until the event arrives (usually milliseconds to seconds). Use short TTLs as a safety net." },
      { text: "What is stale-while-revalidate and when is it useful?", type: "inline", mini_answer: "A cache directive: serve the stale cached value immediately while fetching a fresh value in the background. The caller gets a fast response (never a cache miss latency spike), and the cache self-heals on the next background refresh. Used in HTTP caches (Cache-Control: stale-while-revalidate=60), CDNs, and app-level caches. Perfect for content that changes infrequently and where one stale response per TTL window is acceptable." }
    ],
    related: ["2.4.01", "2.4.03", "2.4.05"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["cache-invalidation", "ttl", "event-driven", "cache-tags", "consistency", "distributed-cache"]
  },

  {
    id: "2.4.03",
    section: 2,
    subsection: "2.4",
    level: "advanced",
    question: "How do you design a distributed cache layer (Redis Cluster, consistent hashing, replication)?",
    quick_answer: "→ Redis Cluster shards keyspace into 16384 hash slots across nodes\n→ Consistent hashing minimises key remapping when nodes join/leave\n→ Replication: each primary shard has N replicas for HA — failover is automatic via Sentinel\n→ Multi-key ops (MGET, transactions) only work if keys share a hash slot — use hash tags {user:123}\n→ Sentinel = HA for single primary; Cluster = horizontal scale + HA",
    detailed_answer: "A single Redis node has limits — memory cap (typically 64-128GB practical) and single-core command processing. Distributed caching spreads both load and data across multiple nodes.\n\nRedis Cluster divides the keyspace into 16,384 hash slots. Each node owns a range of slots. When a client writes key 'user:123', Redis CRC16-hashes it mod 16384 to find the slot, then routes to the owning node. The client library handles routing transparently after an initial topology fetch.\n\nConsistent hashing is the algorithm Redis Cluster uses conceptually (and what many custom cache layers use directly). Keys are mapped to a ring; nodes claim arcs of the ring. When a node is added or removed, only keys on adjacent arcs are remapped — far fewer than a naive mod-N approach. This minimises the cache miss storm when scaling the cluster.\n\nMulti-key constraints: operations like MGET, MULTI/EXEC, Lua scripts, and pub/sub only work within a single shard (keys must hash to the same slot). Hash tags force co-location: {user:123}:profile and {user:123}:sessions both hash on the substring user:123, landing on the same slot. Design your key schema with hash tags for any keys you need to operate on together.\n\nReplication: each primary slot-owner has one or more replica nodes. Replicas are hot standbys — they receive async replication of writes. On primary failure, Redis Cluster promotes a replica automatically. Replication is async, so a small window of writes can be lost during failover (acknowledged to client but not yet replicated).\n\nSentinel vs Cluster: Sentinel provides automatic failover for a single primary-replica setup — no sharding. Use Sentinel when your dataset fits one node but you need HA. Use Cluster when data exceeds a single node's memory or write throughput.\n\nClient-side caching: Redis 6+ supports client-side caching via the Tracking or Broadcasting protocol — the server notifies clients when a key they've cached changes, eliminating a network round trip for cache hits. Useful for ultra-low-latency read paths.",
    key_points: [
      "Cluster: 16384 hash slots distributed across nodes — transparent client routing",
      "Consistent hashing minimises key remapping on node addition/removal",
      "Hash tags {key} co-locate related keys on the same slot for multi-key ops",
      "Replication is async — small data loss window on failover is possible",
      "Sentinel = HA for single shard; Cluster = sharded HA at scale",
      "Client-side caching (Redis 6+) eliminates round trips for hot read paths"
    ],
    hint: "If you need to run a MULTI/EXEC transaction across user profile and user session keys in Redis Cluster — what has to be true about the keys, and how would you enforce that in your naming convention?",
    common_trap: "Designing cache keys without hash tags and then discovering that MGET or atomic transactions fail because the keys hash to different slots. This is a schema design mistake that requires a key migration to fix.",
    follow_up_questions: [
      { text: "What happens to a Redis Cluster during a partition — is it CP or AP?", type: "linked", links_to: "2.1.01", mini_answer: "Redis Cluster is AP by default: if a primary loses quorum, it stops accepting writes (CP behaviour), but during the election window there's a brief period where the primary continues accepting writes that the new primary won't have. The async replication gap means Redis Cluster sacrifices a small window of consistency for availability. You can force CP by requiring WAIT command acknowledgement from replicas before returning." },
      { text: "How do you handle hot keys in Redis Cluster?", type: "inline", mini_answer: "A hot key (e.g., a viral product page) concentrates all traffic on one slot/node, saturating it while others are idle. Solutions: (1) Local in-process cache for the hottest keys (Java HashMap, Guava) — avoids network entirely. (2) Key sharding: cache product:123:shard:{0-9} and randomly pick a shard on read — 10× the load distribution. (3) Read replicas: route reads to replicas to spread read load. (4) Probabilistic early expiry to prevent stampede." },
      { text: "When would you use Memcached over Redis?", type: "inline", mini_answer: "Memcached: simpler, multi-threaded (uses all CPU cores efficiently), pure key-value cache, no persistence, no replication built in. Redis: single-threaded per shard (uses I/O multiplexing), rich data structures, Streams, pub/sub, persistence, cluster, Lua scripting. Choose Memcached when: pure string caching, maximum CPU utilisation needed, team prefers simplicity. Choose Redis when: you need any non-string data structure, pub/sub, durability, or cluster HA." }
    ],
    related: ["2.4.01", "2.4.02", "2.3.03", "2.8.03"],
    has_diagram: true,
    diagram: `   REDIS CLUSTER — 16384 slots across nodes

   ┌──────────────────────────────────────────────┐
   │              HASH SLOT RING                  │
   │                                              │
   │  Node A (slots 0–5460)                       │
   │  Node B (slots 5461–10922)                   │
   │  Node C (slots 10923–16383)                  │
   │                                              │
   │  key "user:123" → CRC16 mod 16384 → slot 7638│
   │  → routed to Node B                         │
   └──────────────────────────────────────────────┘

   Hash tags: {user:123}:profile  ──┐  both hash
              {user:123}:session  ──┘  to same slot
   → MGET / MULTI works across both keys`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["redis-cluster", "consistent-hashing", "distributed-cache", "sentinel", "hash-slots", "replication"]
  },

  {
    id: "2.4.04",
    section: 2,
    subsection: "2.4",
    level: "intermediate",
    question: "How does CDN caching work, and what are the key decisions for an architect?",
    quick_answer: "→ CDNs cache at edge nodes close to users — reduces origin load and latency\n→ Cache-Control headers govern TTL, stale-while-revalidate, and bypass rules\n→ Vary header shards the cache by request dimension (Accept-Language, Accept-Encoding)\n→ Cache key design: default is URL — parameterise carefully to avoid under/over-caching\n→ Purge strategy: tag-based invalidation for content, deploy-time purge for app releases",
    detailed_answer: "A CDN (Content Delivery Network) caches responses at edge nodes distributed globally. When a user in Tokyo requests your API, the edge node in Tokyo serves the cached response — no round trip to your US-East origin. Latency drops from 200ms to 5ms.\n\nCache-Control headers are the primary control mechanism: max-age=3600 caches for one hour. s-maxage overrides max-age for shared caches (CDNs) specifically. no-store prevents caching entirely. no-cache means 'revalidate before serving'. stale-while-revalidate=60 lets the CDN serve a stale response for 60 extra seconds while fetching fresh.\n\nCache key design: by default, the cache key is the full URL (path + query string). A product page at /products/123 with 50 query parameters (utm_source, filters, pagination) creates a unique cache entry per URL variant — most entries never hit again. Strip non-cache-relevant query params from the cache key at the CDN (Cloudflare Cache Rules, Fastly VCL). Normalise the key to only what actually affects the response.\n\nVary header: tells the CDN to create separate cache entries based on a request header dimension. Vary: Accept-Language creates one entry per language. Vary: Accept-Encoding creates one per encoding. Beware: Vary: Cookie or Vary: Authorization effectively disables caching (unique headers per user). Never put user-identifying headers in Vary.\n\nAuthenticated content: most CDNs cache public content only by default. For authenticated but cacheable content (personalised dashboards with shared segments), use a split architecture: cache the shared data structure, personalise at the edge with Cloudflare Workers / Lambda@Edge, or use fragment caching (ESI — Edge Side Includes).\n\nInvalidation: CDNs have lag — purge APIs exist but are eventually consistent across global POPs. Tag-based purge (Cloudflare Cache Tags, Fastly Surrogate-Keys) lets you invalidate all responses tagged with product:123 in one API call. At deploy time, purge by deploy ID prefix or use versioned asset URLs (/static/app.v42.js) for immutable browser caching.",
    key_points: [
      "CDN serves from edge — reduces origin load and cuts latency for global users",
      "Cache-Control: max-age / s-maxage / stale-while-revalidate are the core knobs",
      "Cache key = URL by default — strip non-content-affecting query params",
      "Vary header shards cache by dimension — never use Vary: Cookie/Authorization",
      "Tag-based invalidation purges groups of URLs atomically across all edge nodes",
      "Authenticated content: cache shared segments + personalise at edge, don't skip CDN"
    ],
    hint: "If your product detail page URL includes utm_source and page as query params, how many unique cache entries does one product page generate across your marketing campaigns? What does that do to your cache hit rate?",
    common_trap: "Setting Vary: Accept-Encoding without stripping it correctly, combined with a CDN that doesn't normalise Accept-Encoding values ('gzip, deflate, br' vs 'br, gzip'). The CDN creates a separate entry per unique header string — effectively disabling caching for that resource.",
    follow_up_questions: [
      { text: "What is edge computing and how does it extend CDN caching?", type: "inline", mini_answer: "Edge computing (Cloudflare Workers, Lambda@Edge, Vercel Edge Functions) runs code at CDN edge nodes — not just caching, but executing logic. Use cases: A/B testing at edge (no origin round trip), personalisation of cached responses, authentication validation before forwarding, geo-routing, request transformation. Latency < 10ms vs 50-200ms for origin round trips. The trade-off: edge runtimes are limited (no full Node.js, memory caps, cold starts)." },
      { text: "How do you cache API responses differently from static assets?", type: "inline", mini_answer: "Static assets (JS/CSS/images): long TTL (1 year), immutable, versioned URL. The asset never changes — the URL changes on deploy. API responses: short TTL (seconds to minutes), purge on data change, careful cache key design to avoid serving wrong user's data. APIs with user-specific data: don't cache at CDN level — cache at application layer (Redis) with user-scoped keys instead." },
      { text: "How do you measure CDN cache effectiveness?", type: "inline", mini_answer: "Key metric: cache hit ratio = (edge hits) / (edge hits + origin fetches). Target > 80% for static content, > 50% for dynamic API responses. Monitor via CDN dashboard metrics. Low hit rate causes: high query string cardinality (fix: normalise cache key), Vary header fragmentation, short TTLs (extend where staleness is acceptable), POST requests (uncacheable by default). Also monitor TTFB (time to first byte) — edge hit should be sub-50ms." }
    ],
    related: ["2.4.01", "2.4.02", "3.4.01"],
    has_diagram: false,
    diagram: "",
    has_code: true,
    code_language: "bash",
    code_snippet: `# Cache-Control header examples
Cache-Control: public, max-age=3600, stale-while-revalidate=60
# Public: CDN may cache
# max-age: fresh for 1 hour
# stale-while-revalidate: serve stale for 60s while refreshing

Cache-Control: public, s-maxage=86400, max-age=0
# s-maxage=1 day for CDN, browser always revalidates

Cache-Control: no-store
# Never cache (auth tokens, sensitive data)

# Surrogate keys / cache tags (Fastly / Cloudflare)
Surrogate-Key: product-123 category-shoes homepage
Cache-Tag: product-123 category-shoes homepage

# Purge all responses tagged with product-123
curl -X POST "https://api.cloudflare.com/zones/{id}/purge_cache" \
  -d '{"tags":["product-123"]}'`,
    tags: ["cdn", "cache-control", "edge-computing", "cache-key", "cache-invalidation", "performance"]
  },

  {
    id: "2.4.05",
    section: 2,
    subsection: "2.4",
    level: "advanced",
    question: "What is the cache stampede (thundering herd) problem and how do you prevent it?",
    quick_answer: "→ Cache stampede: popular key expires → N concurrent requests all miss → all hit DB simultaneously\n→ Prevention: mutex/lock on first miss (only one request loads, others wait)\n→ Probabilistic early expiry (PER): refresh before expiry for hot keys based on probability\n→ Background refresh: proactively refresh before TTL expires\n→ Jitter on TTLs: spread expiry times to avoid synchronised misses",
    detailed_answer: "Cache stampede (thundering herd) happens when a highly popular cache entry expires, and many concurrent requests all discover the miss at the same time. Each request independently queries the database to rebuild the cache — multiplying DB load by the number of concurrent waiters. At scale, this can crash the database.\n\nScenario: product page for a viral item has 5,000 requests/second. Cache TTL expires. All 5,000 in-flight requests miss, fire 5,000 DB queries simultaneously. DB connection pool exhausts. Cascading failure.\n\nPrevention strategies:\n\n1. Mutex / distributed lock on cache miss: when a request misses the cache, it acquires a distributed lock (Redis SET NX) before querying the DB. All other requests that miss wait for the lock holder to repopulate the cache. Cost: latency spike for waiters. Avoid in very high-concurrency paths — lock contention becomes the bottleneck.\n\n2. Probabilistic early expiration (PER): before the cache key expires, start computing the probability of refreshing it on each read. As the key ages toward its TTL, the probability increases. Early reads compute the refresh with low probability; reads near expiry almost always trigger a refresh. One request refreshes the key while others continue serving the about-to-expire value. No lock needed.\n\n3. Background refresh / proactive warming: a background job monitors key TTLs and refreshes hot keys before they expire. The foreground read path never misses — it always reads the cached value, even if slightly stale. Complexity: need to track which keys are hot, run a refresh loop, handle refresh failures.\n\n4. TTL jitter: instead of a fixed 3600-second TTL, use TTL = 3600 + random(0, 300). This spreads expiry times across a 5-minute window, breaking the synchronised miss pattern. Simple, low code cost. Works well combined with other strategies.\n\n5. Stale-while-revalidate: serve the stale value for a short window while one background thread re-fetches. No thundering — callers never see a miss.",
    key_points: [
      "Stampede: simultaneous cache misses on a hot key overwhelm the database",
      "Mutex: one request loads, others wait — safe but adds latency under high concurrency",
      "Probabilistic early expiry: refresh before TTL using increasing probability — no lock, no miss",
      "Background refresh: never miss, always warm — requires hot-key tracking infrastructure",
      "TTL jitter: simplest mitigation — randomise expiry to de-synchronise misses",
      "Stale-while-revalidate: serve stale instantly, refresh in background — latency + consistency win"
    ],
    hint: "Your homepage loads 10,000 times per second and its cache key expires every 5 minutes. What happens at 00:00:00.000 when the key expires? Walk me through the exact DB load spike.",
    common_trap: "Using a single fixed TTL for all cache entries. Items that receive 10,000 RPS expire simultaneously — stampede. Items with 1 RPS expire and go unnoticed. Vary TTL by access frequency: hotter keys deserve jitter, background refresh, or PER.",
    follow_up_questions: [
      { text: "How do you implement probabilistic early expiration in code?", type: "inline", mini_answer: "PER formula (from Redis documentation): refresh if (current_time - (TTL * beta * log(random()))) > expiry_time. Beta controls aggressiveness (typically 1.0). A random() value near 0 makes log() very negative, making the condition true early. A value near 1 makes log() near 0, condition only true near expiry. This creates a natural probability distribution — refresh probability increases as expiry approaches, with no synchronisation needed." },
      { text: "What is the dog-pile effect and how does it differ from thundering herd?", type: "inline", mini_answer: "Dog-pile and thundering herd are the same phenomenon — multiple terms for the same problem. Dog-pile emphasises the pile-up at the database; thundering herd emphasises the herd of requests arriving simultaneously. Some engineers distinguish: dog-pile = many readers of one key; thundering herd = many keys expiring together (e.g., after a full cache flush or deploy restart). Both are solved by the same strategies." },
      { text: "How do you detect that a cache stampede is happening in production?", type: "inline", mini_answer: "Signals: sudden spike in DB connection count or query rate at a regular interval (matching the TTL period); cache hit rate drops sharply for one minute then recovers; P99 latency spikes correlate with cache miss rate spikes. Set alerts on: db_queries_per_second sudden 10× spike, cache_hit_rate < threshold for > 30 seconds, db_connection_pool_exhaustion events. Trace with distributed tracing — all requests from the same spike period showing DB fetch." }
    ],
    related: ["2.4.01", "2.4.02", "2.4.03", "4.2.01"],
    has_diagram: false,
    diagram: "",
    has_code: true,
    code_language: "python",
    code_snippet: `import redis, time, math, random

r = redis.Redis()

def get_with_per(key: str, beta: float = 1.0):
    """Probabilistic Early Recomputation — no stampede, no lock."""
    value, expiry = r.get(key), r.expiretime(key)
    if value is None:
        return recompute_and_cache(key)   # genuine miss

    ttl = expiry - time.time()
    # PER: probability of early refresh increases as TTL shrinks
    if time.time() - (ttl * beta * math.log(random.random())) > expiry:
        # This request probabilistically refreshes early
        return recompute_and_cache(key)

    return value

def get_with_mutex(key: str, lock_ttl: int = 5):
    """Mutex — only one request loads, others wait."""
    value = r.get(key)
    if value:
        return value

    lock_key = f"lock:{key}"
    if r.set(lock_key, "1", nx=True, ex=lock_ttl):
        value = load_from_db(key)
        r.setex(key, 300 + random.randint(0, 60), value)  # TTL + jitter
        r.delete(lock_key)
        return value

    # Another request holds the lock — wait briefly and retry
    time.sleep(0.05)
    return r.get(key) or load_from_db(key)`,
    tags: ["cache-stampede", "thundering-herd", "probabilistic-early-expiry", "mutex", "ttl-jitter", "redis"]
  },


  // ============================================================
  // 2.5  DATA MODELING  (4 questions)
  // ============================================================

  {
    id: "2.5.01",
    section: 2,
    subsection: "2.5",
    level: "intermediate",
    question: "How do you approach data modeling for a new system — conceptual, logical, and physical layers?",
    quick_answer: "→ Conceptual: entities and relationships in business language — no tech decisions yet\n→ Logical: attributes, keys, normalisation, cardinality — DB-agnostic\n→ Physical: actual tables, indexes, types, partitions — implementation-specific\n→ Start at conceptual with domain experts, lock in physical just before build\n→ Most bugs come from skipping conceptual — modeling the technical solution instead of the domain",
    detailed_answer: "Data modeling has three levels, each serving a different audience and purpose.\n\nConceptual model: captures business entities (Customer, Order, Product) and their relationships (Customer places many Orders, Order contains many Products). Drawn as entity-relationship diagrams or boxes-and-lines. No column names, no data types, no database. Used to align with domain experts and validate understanding. Mistakes here propagate through all layers — fix them cheaply at this stage.\n\nLogical model: adds attributes, data types in abstract form (string, integer, date), primary keys, foreign keys, and cardinality. Normalisation happens here — identify and eliminate redundancy, define normal forms. Still database-agnostic. Used to review with architects and senior engineers before committing to a technology.\n\nPhysical model: translates the logical model into a specific database — actual column types (VARCHAR(255) vs TEXT), index definitions, partition schemes, constraints, naming conventions. Considers the target engine's quirks (Postgres JSONB for flexible fields, Cassandra partition key choices, DynamoDB access patterns).\n\nWhy all three matter: most teams jump straight to physical (open a migration file and start writing CREATE TABLE). This produces schemas that reflect how the developer imagined the technical solution, not how the domain actually works. The conceptual layer forces you to have the conversation with the business before encoding assumptions in a schema that's expensive to change.\n\nPractical approach: sketch the conceptual model in the first system design session. Evolve to logical as requirements sharpen. Only produce the physical model when the team agrees on the data shape. Schema migrations are costly — a 10-minute whiteboard conversation prevents a multi-hour migration on a live database.",
    key_points: [
      "Conceptual: business entities and relationships — no tech, used with domain experts",
      "Logical: attributes, types, keys, cardinality — DB-agnostic, for engineers",
      "Physical: actual DDL, indexes, partitions — engine-specific",
      "Skipping conceptual causes schemas that reflect code assumptions, not domain reality",
      "Normalise at logical layer — denormalise deliberately at physical if needed",
      "Schema changes on live databases are costly — front-load design conversations"
    ],
    hint: "Pick a domain you know — e-commerce, banking, HR. Draw the conceptual model in 5 entities. Now: which relationships are unclear? Those are the questions to ask before writing a single column.",
    common_trap: "Starting with the ORM model and calling it data modeling. ORMs produce schemas driven by object graphs and framework conventions, not by the domain. The result is normalisation coincidence, not normalisation intent — it works until it doesn't.",
    follow_up_questions: [
      { text: "What is 3NF and when is it 'good enough' for production?", type: "inline", mini_answer: "Third Normal Form: every non-key attribute depends on the whole primary key (2NF), and nothing but the key (3NF — no transitive dependencies). Practical meaning: no derived columns, no redundant copies, one place to update each fact. 3NF is good enough for most OLTP schemas. BCNF/4NF/5NF handle edge cases with multi-valued dependencies — important for certification but rare in practice." },
      { text: "How does domain-driven design influence data modeling?", type: "linked", links_to: "1.7.01", mini_answer: "DDD maps closely to data modeling: Aggregates become the transaction boundary (one aggregate = one atomic DB operation). Entities map to tables. Value Objects are embeddable types (no own identity). Bounded Contexts define schema boundaries — each context owns its data and should not share tables with other contexts. The conceptual model IS the domain model." },
      { text: "When should you use a schema-on-read vs schema-on-write approach?", type: "inline", mini_answer: "Schema-on-write (relational): define structure upfront, enforce at write time — strong guarantees, rigid evolution. Schema-on-read (document stores, data lakes): store raw data, apply interpretation at query time — flexible, but bugs in schema assumptions surface late. Use schema-on-write for operational systems where correctness matters; schema-on-read for exploratory analytics or heterogeneous data ingestion." }
    ],
    related: ["2.1.02", "2.2.03", "2.5.02", "2.5.03"],
    has_diagram: true,
    diagram: `   THREE LAYERS OF DATA MODELING

   Conceptual          Logical              Physical
   ─────────────────   ──────────────────   ────────────────────
   Customer            customer             customers table
      │                  - id (PK, int)       id BIGSERIAL PK
      │ places           - email (string)     email VARCHAR(255)
      │                  - created_at (date)  created_at TIMESTAMPTZ
   Order               order                orders table
      │                  - id (PK)            id BIGSERIAL PK
      │ contains         - customer_id (FK)   customer_id BIGINT FK
      │                  - total (decimal)    total NUMERIC(10,2)
   Product             product              INDEX on customer_id

   DB-agnostic ────────────────────────────► DB-specific`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["data-modeling", "entity-relationship", "normalisation", "conceptual-model", "schema-design"]
  },

  {
    id: "2.5.02",
    section: 2,
    subsection: "2.5",
    level: "advanced",
    question: "What are the data modeling patterns for multi-tenancy, and how do you choose between them?",
    quick_answer: "→ Shared schema + tenant_id column: simplest, lowest cost, RLS for isolation\n→ Separate schema per tenant: strong isolation, shared infra, schema migration complexity\n→ Separate database per tenant: strongest isolation, highest cost, used in regulated industries\n→ Choose by: isolation requirement, tenant count, regulatory compliance, and operational capacity\n→ Shared schema scales to thousands of tenants; separate DB doesn't beyond dozens",
    detailed_answer: "Multi-tenancy means one system serves multiple customers (tenants) with their data isolated. The data model choice determines your isolation guarantees, operational overhead, and scalability ceiling.\n\nShared schema (tenant_id column): all tenants share the same tables. Every table has a tenant_id column. Row-level security (RLS) or application-layer filtering enforces isolation. Pros: simplest to build, cheapest to operate, scales to tens of thousands of tenants, schema migrations run once. Cons: misconfigured query = data leakage across tenants, noisy neighbour on large tenants, harder to give a tenant a data dump or delete all their data.\n\nSeparate schema per tenant: one database instance, but each tenant gets their own schema (in Postgres terms: a namespace). Tables exist under tenant1.orders, tenant2.orders. Pros: schema isolation, easier per-tenant backup/restore/export, can customise schema per tenant. Cons: schema migrations must run against N schemas, connection pool must manage schema routing, Postgres has ~10k schema limit before performance degrades.\n\nSeparate database per tenant: each tenant gets their own database (or cluster). Maximum isolation — a bug in one tenant's data cannot affect another. Required in some regulated industries (healthcare, finance) where data co-residency is prohibited. Pros: complete isolation, independent scaling, per-tenant maintenance windows. Cons: expensive at scale, connection pool explosion, migration orchestration across N databases is operationally complex.\n\nHybrid: most mature SaaS systems end up hybrid — standard tenants share a schema, large enterprise tenants get their own database. This is commercially driven (enterprise pays for isolation) as much as technical.\n\nRow-level security (Postgres RLS): define policies that automatically filter by tenant_id based on the current session variable. Eliminates application-layer bugs where a developer forgets the WHERE tenant_id = ? clause. Every query is transparently scoped. Minor performance overhead (policy evaluation per row) — acceptable at most scales.",
    key_points: [
      "Shared schema: simplest, cheapest, scales to 10k+ tenants — needs RLS or strict app filtering",
      "Separate schema: isolation without separate infra — migration complexity grows with tenant count",
      "Separate DB: maximum isolation, mandatory for some compliance — expensive to operate at scale",
      "RLS (Row-Level Security): Postgres-native enforcement of tenant_id filtering — eliminates developer forget-a-WHERE bugs",
      "Hybrid (shared + dedicated for enterprise) is the production reality at mature SaaS companies",
      "Noisy neighbour and data dump complexity are the operational weak points of shared schema"
    ],
    hint: "Your SaaS serves 5,000 SMB customers and 10 enterprise customers. Enterprise says their data must be completely isolated for compliance. What model do you choose — and is it the same for both tiers?",
    common_trap: "Starting with separate-database-per-tenant assuming 'it's safer', then discovering that running 500 database instances with coordinated migrations and connection pools is operationally unsustainable. Most companies need shared schema to start, then earn the complexity of per-tenant isolation.",
    follow_up_questions: [
      { text: "How does Postgres Row-Level Security work in practice?", type: "inline", mini_answer: "Define a policy: CREATE POLICY tenant_isolation ON orders USING (tenant_id = current_setting('app.tenant_id')::int). Enable it: ALTER TABLE orders ENABLE ROW LEVEL SECURITY. Set the session variable at connection time: SET LOCAL app.tenant_id = 42. Every query on orders is now automatically filtered — even if the developer forgets WHERE tenant_id = 42. Bypass with BYPASSRLS role for admin operations." },
      { text: "How do you handle schema migrations across hundreds of tenant schemas?", type: "inline", mini_answer: "Tools like Flyway and Liquibase can iterate schemas, but the iteration must be scripted. Pattern: (1) enumerate all tenant schemas from a registry table; (2) run migration script in a loop with error handling and rollback per schema; (3) track per-schema migration state in a central migrations table; (4) run in parallel batches to keep total runtime bounded. A failed tenant schema migration must not block the others." },
      { text: "What is tenant data isolation vs tenant data residency?", type: "inline", mini_answer: "Isolation: tenant A cannot read tenant B's data — logical separation, achievable with shared schema + RLS. Residency: tenant A's data must physically reside in region X (GDPR, data sovereignty) — requires separate storage per region, not just separate tables. Residency is a harder constraint that often forces separate databases or separate deployments per geography, regardless of isolation approach." }
    ],
    related: ["2.2.01", "2.5.01", "7.1.01", "7.4.01"],
    has_diagram: true,
    diagram: `   MULTI-TENANCY MODELS — isolation vs cost

   SHARED SCHEMA                SEPARATE SCHEMA          SEPARATE DB
   ─────────────────────────    ──────────────────────   ──────────────
   orders table:                tenant_1.orders          tenant_1_db
   │ id │ tenant_id │ ...│      tenant_2.orders          tenant_2_db
   │ 1  │     1     │   │      tenant_3.orders          tenant_3_db
   │ 2  │     2     │   │
   │ 3  │     1     │   │      Shared Postgres instance  Separate instances

   RLS filters by tenant_id     Schema namespace          Full DB isolation
   Scales to 10k+ tenants       ~100s of tenants          ~Dozens of tenants
   Lowest cost                  Medium cost               Highest cost`,
    has_code: true,
    code_language: "sql",
    code_snippet: `-- Postgres Row-Level Security — automatic tenant isolation
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = current_setting('app.tenant_id')::bigint);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Set at connection/transaction start (application or middleware)
SET LOCAL app.tenant_id = 42;

-- This query now automatically filters to tenant 42 — no WHERE needed
SELECT * FROM orders WHERE status = 'pending';

-- Admin bypass (superuser or BYPASSRLS role only)
SET LOCAL role = 'admin_role';  -- BYPASSRLS role bypasses policy`,
    tags: ["multi-tenancy", "row-level-security", "schema-design", "saas", "data-isolation", "postgres"]
  },

  {
    id: "2.5.03",
    section: 2,
    subsection: "2.5",
    level: "intermediate",
    question: "How do you model temporal and historical data — audit trails, point-in-time queries, and slowly changing dimensions?",
    quick_answer: "→ Audit log: append-only events table — what changed, who changed it, when\n→ Point-in-time: valid_from / valid_to columns — query state as of any timestamp\n→ Bitemporal: two time axes — valid time (real-world) + transaction time (when DB recorded it)\n→ SCD Type 2: keep all historical rows with effective dates — standard in data warehouses\n→ Postgres temporal: use TSTZRANGE for overlap-free period constraints",
    detailed_answer: "Many systems need to answer 'what was the state of X at time T?' or 'who changed X and when?'. This requires deliberate temporal data modeling.\n\nAudit log pattern: the simplest form. Append an event to an audit table on every mutation — who, what, when, before/after values. Good for compliance and debugging. Limitation: reconstructing the full state at a past point in time requires replaying all events up to that timestamp — expensive for complex entities.\n\nValid time (point-in-time) modeling: add valid_from and valid_to columns to any table where history matters. Current rows have valid_to = NULL (or a far-future sentinel). On update: close the current row (set valid_to = now()) and insert a new row with valid_from = now(). Query as of T: WHERE valid_from <= T AND (valid_to IS NULL OR valid_to > T). This pattern directly answers 'what was the contract value on 2025-01-15?'.\n\nBitemporal modeling: two independent time axes. Valid time = the real-world time the fact was true (the contract ran from Jan to June). Transaction time = when the database recorded this fact (we corrected the data in February, discovering the contract actually started in December). Valid time is business reality; transaction time is system reality. Bitemporal tables can answer 'as of what we knew on March 1, what did we think the state was on January 1?' — essential for regulated financial systems and audit investigations.\n\nSlowly Changing Dimensions (SCD) — data warehouse concept. Type 1: overwrite the value (no history). Type 2: keep all versions with effective dates (full history). Type 3: keep current and previous value (one version of history). SCD Type 2 is the default for warehouse dimensions where history matters.\n\nPostgres range types: TSTZRANGE stores a time period as a first-class type with operators. EXCLUDE USING gist (entity_id WITH =, period WITH &&) adds a constraint preventing overlapping periods for the same entity — the database enforces that no two rows' valid periods overlap.",
    key_points: [
      "Audit log: append-only events — easy to write, expensive to reconstruct state",
      "Valid time (valid_from/valid_to): point-in-time query pattern — what was true at T",
      "Bitemporal: two axes — valid time (real world) + transaction time (when recorded) — for corrections and audit investigations",
      "SCD Type 2: standard warehouse pattern for keeping full dimension history with effective dates",
      "Postgres TSTZRANGE + EXCLUDE constraint: database-enforced non-overlapping periods",
      "Choose the simplest model that answers your actual query — bitemporal is complex, most systems only need valid time"
    ],
    hint: "Your system needs to answer: 'What was the customer's subscription tier on the day they made this purchase?' Which temporal pattern do you need, and what does the query look like?",
    common_trap: "Using a single updated_at column as a proxy for temporal history. It only records the last change — all previous values are lost. You discover the limitation when the first compliance or audit query asks for past state.",
    follow_up_questions: [
      { text: "How do you handle temporal data in an event-sourced system?", type: "linked", links_to: "2.7.02", mini_answer: "Event sourcing is temporal modeling by default — the event log IS the audit trail, and state at any point T is reconstructed by replaying events up to T. No special valid_from/valid_to columns needed; the event stream provides both valid time (event timestamp) and transaction time (when event was persisted). The trade-off: reconstructing state at T requires replaying potentially millions of events — use snapshots to amortise this." },
      { text: "What is the difference between soft delete and temporal modeling?", type: "inline", mini_answer: "Soft delete: add deleted_at column, never physically delete rows — the simplest audit trail. Limitation: queries must always include WHERE deleted_at IS NULL or you get 'deleted' records in results (easy to forget). Temporal modeling (valid_from/valid_to): more expressive — supports both deletion history and value history. Soft delete is a specialised temporal model for existence only; use full temporal when you need to track attribute changes over time." },
      { text: "How do you query bitemporal data efficiently?", type: "inline", mini_answer: "The query WHERE valid_from <= T1 AND valid_to > T1 AND recorded_at <= T2 requires indexes on both time dimensions. Postgres GIST index on TSTZRANGE columns handles range queries well. For OLAP bitemporal queries, materialise common time snapshots as pre-computed views. Bitemporal joins (joining two bitemporal tables at overlapping periods) are expensive — use WITH clauses to filter each side first before joining." }
    ],
    related: ["2.2.03", "2.5.01", "2.7.01", "2.7.02"],
    has_diagram: true,
    diagram: `   TEMPORAL MODELING — three patterns

   AUDIT LOG (append-only)
   id │ entity_id │ action  │ changed_by │ changed_at   │ old_val │ new_val
   1  │ order:42  │ UPDATE  │ user:7     │ 2026-01-15   │ pending │ shipped

   VALID TIME (point-in-time)
   id │ tier    │ valid_from          │ valid_to
   1  │ basic   │ 2025-01-01 00:00:00 │ 2025-06-01 00:00:00
   2  │ pro     │ 2025-06-01 00:00:00 │ NULL   ← current

   Query "what tier on 2025-03-01?":
   WHERE valid_from <= '2025-03-01' AND (valid_to IS NULL OR valid_to > '2025-03-01')

   BITEMPORAL
   id │ tier  │ valid_from │ valid_to  │ recorded_from │ recorded_to
      Two independent time axes — real-world truth + DB recording time`,
    has_code: true,
    code_language: "sql",
    code_snippet: `-- Valid time modeling with Postgres range type
CREATE TABLE subscriptions (
  id          BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  tier        TEXT NOT NULL,
  period      TSTZRANGE NOT NULL,
  -- No two rows for same customer can have overlapping periods
  EXCLUDE USING gist (customer_id WITH =, period WITH &&)
);

-- Current subscription
INSERT INTO subscriptions (customer_id, tier, period)
VALUES (42, 'pro', '[2025-06-01, )');  -- open-ended (current)

-- Query: what tier did customer 42 have on 2025-03-01?
SELECT tier FROM subscriptions
WHERE customer_id = 42
  AND period @> '2025-03-01 00:00:00+00'::timestamptz;

-- On tier change: close old, open new
UPDATE subscriptions
SET period = tstzrange(lower(period), NOW())
WHERE customer_id = 42 AND upper(period) IS NULL;

INSERT INTO subscriptions (customer_id, tier, period)
VALUES (42, 'enterprise', tstzrange(NOW(), NULL));`,
    tags: ["temporal-data", "audit-trail", "bitemporal", "scd-type-2", "valid-time", "postgres", "data-modeling"]
  },

  {
    id: "2.5.04",
    section: 2,
    subsection: "2.5",
    level: "advanced",
    question: "How do you evolve a database schema safely in production — zero-downtime migrations?",
    quick_answer: "→ Never DROP or RENAME in the same deploy as the code change — decouple schema from code\n→ Expand-contract pattern: add new column/table first, migrate data, then remove old\n→ Postgres: avoid ACCESS EXCLUSIVE locks — prefer ADD COLUMN with default (PG11+), CREATE INDEX CONCURRENTLY\n→ Large table migrations: background job, not ALTER TABLE — ALTER locks the whole table\n→ Always have a rollback plan before running on production",
    detailed_answer: "Schema migrations on live production databases are one of the riskiest operations in backend engineering. The wrong migration can lock a table for minutes, causing a full application outage.\n\nExpand-contract pattern (also called parallel change): the safest migration strategy.\n1. Expand: add the new column/table (non-breaking). Deploy application code that writes to both old and new.\n2. Migrate: backfill existing data into the new structure via a background job.\n3. Contract: once all rows are migrated and the application reads from the new structure only, remove the old column/table in a separate deploy.\n\nThis decouples schema changes from code changes — no deploy that simultaneously renames a column AND changes the application code that reads it.\n\nPostgres-specific lock behaviours:\n- ADD COLUMN with DEFAULT: before PG11, rewrote the entire table (ACCESS EXCLUSIVE lock). From PG11+, stored as a table-level default without rewrite — safe on large tables.\n- CREATE INDEX: locks the table for writes during the build. Use CREATE INDEX CONCURRENTLY — longer build time but no write lock.\n- ALTER COLUMN TYPE: almost always rewrites the table — avoid on large tables without a shadow-column migration.\n- DROP COLUMN: only marks as dropped (no rewrite), but acquires ACCESS EXCLUSIVE momentarily.\n- Adding NOT NULL constraint: Postgres 12+ CHECK (col IS NOT NULL) NOT VALID avoids full scan; validate in background with VALIDATE CONSTRAINT.\n\nLarge table backfills: never UPDATE all rows in one statement — it holds a lock and generates massive WAL. Use a batch loop: UPDATE ... WHERE id BETWEEN x AND x+1000 LIMIT 1000 with a sleep between batches. Or use tools like pgslotmigrations, gh-ost (MySQL), or pt-online-schema-change.\n\nBlue-green deployments add a safety layer: migrate the schema on the 'blue' database (still serving traffic), then switch traffic to 'green' which reads the new schema. Rollback = flip traffic back to blue.",
    key_points: [
      "Expand-contract: never rename/drop in same deploy as code change — decouple schema from code",
      "ADD COLUMN with DEFAULT is safe in PG11+ — no table rewrite",
      "CREATE INDEX CONCURRENTLY: no write lock — always prefer for production",
      "ALTER COLUMN TYPE rewrites the table — use shadow column + backfill instead",
      "Batch backfills with sleep — never one massive UPDATE on millions of rows",
      "Rollback plan must exist before any production migration runs"
    ],
    hint: "You need to rename the column users.username to users.handle. Walk me through the full sequence of deploys — what runs first, what runs second, what runs third — so no deploy causes a schema-code mismatch.",
    common_trap: "Running ALTER TABLE ... RENAME COLUMN in the same deployment as the application code change that reads the new name. The moment the migration runs, the old code (still handling in-flight requests) breaks because the column no longer exists.",
    follow_up_questions: [
      { text: "What is a NOT VALID constraint and when do you use it?", type: "inline", mini_answer: "CREATE CONSTRAINT ... NOT VALID adds the constraint without scanning existing rows — fast, no long lock. Existing rows that violate the constraint are not checked. Later: ALTER TABLE ... VALIDATE CONSTRAINT performs the scan in a separate transaction (takes ShareUpdateExclusiveLock, non-blocking for reads/writes). Use to add a NOT NULL or CHECK constraint on a large table without a long exclusive lock." },
      { text: "How do you handle a migration that takes hours on a 500GB table?", type: "inline", mini_answer: "Never run ALTER TABLE — it will lock. Instead: (1) Create a shadow table with the new schema. (2) Backfill rows in batches (1000 at a time, 50ms sleep between). (3) Set up a trigger to dual-write new rows to both tables. (4) Once backfill is complete, cut over reads to the new table. (5) Remove trigger, drop old table in a later deploy. Tools: pt-online-schema-change (MySQL), pgslotmigrations (Postgres)." },
      { text: "How do distributed systems complicate database migrations?", type: "inline", mini_answer: "Multiple app instances run simultaneously — during a rolling deploy, old code and new code are both live at the same time against the same schema. A renamed column breaks old instances immediately. This forces expand-contract strictly: the schema must be compatible with BOTH old and new code versions simultaneously during the deploy window. Add-only changes (new column, new table) are always safe; remove/rename operations are never safe during a rolling deploy." }
    ],
    related: ["2.2.01", "2.2.03", "2.5.01", "2.5.02"],
    has_diagram: false,
    diagram: "",
    has_code: true,
    code_language: "sql",
    code_snippet: `-- EXPAND-CONTRACT: renaming users.username → users.handle
-- Deploy 1: EXPAND — add new column (safe, no lock on PG11+)
ALTER TABLE users ADD COLUMN handle TEXT;
-- App now writes to BOTH username and handle

-- Deploy 2: BACKFILL — batch update existing rows
DO $$
DECLARE batch_size INT := 1000; last_id BIGINT := 0;
BEGIN
  LOOP
    UPDATE users SET handle = username
    WHERE id > last_id AND handle IS NULL
    RETURNING id INTO last_id;
    EXIT WHEN NOT FOUND;
    PERFORM pg_sleep(0.05);  -- 50ms between batches
  END LOOP;
END $$;

-- Deploy 3: CONTRACT — app reads handle only, drop username
ALTER TABLE users DROP COLUMN username;

-- Safe index creation (no write lock)
CREATE INDEX CONCURRENTLY idx_users_handle ON users (handle);

-- Safe NOT NULL addition (no full scan)
ALTER TABLE users ADD CONSTRAINT users_handle_not_null
  CHECK (handle IS NOT NULL) NOT VALID;
ALTER TABLE users VALIDATE CONSTRAINT users_handle_not_null;`,
    tags: ["schema-migration", "zero-downtime", "expand-contract", "postgres", "alter-table", "production"]
  },


  // ============================================================
  // 2.6  DATA REPLICATION & CONSISTENCY  (5 questions)
  // ============================================================

  {
    id: "2.6.01",
    section: 2,
    subsection: "2.6",
    level: "intermediate",
    question: "How does database replication work, and what are the trade-offs between synchronous and asynchronous replication?",
    quick_answer: "→ Replication copies writes from primary to replicas — for HA, read scale, and geo distribution\n→ Synchronous: primary waits for replica acknowledgement — zero data loss, higher write latency\n→ Asynchronous: primary returns immediately, replica catches up — low latency, small data loss window\n→ Semi-synchronous: wait for at least one replica — practical balance for most production systems\n→ Replication lag is the key operational metric — monitor it, alert on it, design around it",
    detailed_answer: "Database replication maintains copies of data on multiple nodes. The primary node accepts writes; replicas receive and apply those writes. The core trade-off is between durability guarantees and write latency.\n\nSynchronous replication: the primary waits for at least one replica to confirm it has written the data before acknowledging the write to the caller. Zero data loss on primary failure — the replica has everything. Cost: write latency includes a full network round trip to the replica on every write. If the replica is slow or the network is congested, writes back up. Used for: financial systems, anything where data loss is unacceptable.\n\nAsynchronous replication: the primary acknowledges the write immediately, then ships the changes to replicas in the background. Low write latency — no waiting for replicas. Cost: a window of data loss exists. If the primary crashes before the replica receives the last N writes, those writes are gone. The replica that gets promoted will be behind. Used for: most OLTP systems where a few seconds of potential data loss is acceptable against faster writes.\n\nSemi-synchronous: wait for acknowledgement from at least one replica, but not all. A balance — zero data loss if the one replica is not the one that fails. MySQL's semi-synchronous replication and Postgres synchronous_standby_names with ANY 1 implement this.\n\nReplication lag: async replicas are always behind by some delta. Under heavy write load, lag can grow to seconds or minutes. Applications reading from replicas may see stale data. Common symptoms: user updates their profile, refreshes the page served by a replica, sees the old value. Mitigate with: read-your-writes routing (send reads for recently written data to primary), replica lag monitoring with alerting.\n\nPhysical vs logical replication: physical (streaming replication in Postgres) ships WAL bytes — exact byte-for-byte copy, replica must be same Postgres version. Logical replication ships row-level changes as decoded SQL operations — enables version differences, partial replication (table filters), and CDC pipelines.",
    key_points: [
      "Synchronous: zero data loss, higher write latency — use for financial/critical data",
      "Asynchronous: low write latency, small data loss window — use for most OLTP workloads",
      "Semi-synchronous: wait for one replica — practical balance, used by MySQL and Postgres",
      "Replication lag: async replicas can be seconds behind — monitor and alert, don't serve stale reads blindly",
      "Read-your-writes: route reads to primary for data the user just wrote — prevents stale-read UX issues",
      "Logical replication enables CDC pipelines and cross-version replication; physical is simpler and faster"
    ],
    hint: "Your e-commerce platform loses the primary DB node at 11:58pm. What's the exact data loss exposure with async replication? What changes with synchronous? What does the on-call engineer do in each case?",
    common_trap: "Assuming replicas are always consistent with the primary. A replica 10 seconds behind is 10 seconds of potential stale reads. Any application logic that reads back data it just wrote (profile update, inventory check after reservation) must route to the primary or tolerate the lag explicitly.",
    follow_up_questions: [
      { text: "What is a replication slot and why is it dangerous if left unused?", type: "inline", mini_answer: "A replication slot in Postgres ensures the WAL is retained until the consumer (replica or CDC subscriber) has consumed it. This guarantees no data loss even if the consumer falls behind. Danger: if a consumer disconnects and never reconnects, the slot prevents WAL cleanup indefinitely. Postgres disk fills with accumulated WAL — a common production incident. Monitor pg_replication_slots and drop unused slots. Set max_slot_wal_keep_size as a safety cap." },
      { text: "How does Postgres streaming replication differ from logical replication?", type: "inline", mini_answer: "Streaming (physical): ships WAL bytes — exact binary copy. Replica must be same major version, same OS/arch ideally. Fastest, lowest overhead. Used for standby HA and read replicas. Logical: decodes WAL into row-level change events (INSERT/UPDATE/DELETE). Enables: replication to different Postgres versions, partial table replication, CDC consumers (Debezium), cross-cluster fan-out. Higher overhead but far more flexible." },
      { text: "How do you handle a replica that's significantly behind during a failover?", type: "inline", mini_answer: "If the promoted replica is behind by 30 seconds, those 30 seconds of writes are lost. Options: (1) Accept the loss — restore from backup or WAL archive for the gap. (2) Use synchronous replication to a hot standby that's always current. (3) Set up PITR (point-in-time recovery) from WAL archive to replay the lost window after promotion. Automated failover tools (Patroni, pg_auto_failover) handle promotion but cannot recover writes that never reached the replica." }
    ],
    related: ["2.6.02", "2.6.03", "4.1.05", "4.1.12", "2.1.01"],
    has_diagram: true,
    diagram: `   SYNCHRONOUS vs ASYNCHRONOUS REPLICATION

   SYNCHRONOUS
   App → Primary ──write──► Primary WAL
                  ◄──ack───  Primary
                    wait...
          Primary ──replicate──► Replica
                  ◄──ack────────
          Primary ──ack──► App     ← returns AFTER replica confirms
   Latency: high  |  Data loss on failure: zero

   ASYNCHRONOUS
   App → Primary ──write──► Primary WAL
         Primary ──ack──► App      ← returns IMMEDIATELY
                    (async in background)
          Primary ──replicate──► Replica  ← may lag seconds/minutes
   Latency: low  |  Data loss on failure: lag window`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["replication", "synchronous", "asynchronous", "replication-lag", "postgres", "high-availability"]
  },

  {
    id: "2.6.02",
    section: 2,
    subsection: "2.6",
    level: "advanced",
    question: "How do consensus algorithms (Raft, Paxos) ensure consistency in distributed databases?",
    quick_answer: "→ Consensus: a cluster of nodes agrees on a single value — despite failures and network partitions\n→ Raft: leader-based, easier to understand — used in etcd, CockroachDB, TiKV\n→ Paxos: original algorithm, harder to implement correctly — used in Google Spanner, Chubby\n→ Quorum writes: majority (N/2 + 1) must acknowledge before a write is committed\n→ Trade-off: consensus adds latency (quorum round trip) but guarantees no split-brain",
    detailed_answer: "Consensus algorithms allow a cluster of distributed nodes to agree on a sequence of values (log entries) even when some nodes fail or messages are delayed. This is the foundation of consistent distributed databases.\n\nRaft (2013): designed for understandability. At any time, one node is the leader; all writes go through the leader. The leader replicates entries to followers. An entry is committed when a majority (quorum) of nodes acknowledge it. If the leader fails, followers elect a new leader — the node with the most up-to-date log wins the election. Key insight: only one leader at a time prevents conflicting writes. Used in: etcd (Kubernetes backing store), CockroachDB (one Raft group per range), TiKV, Consul.\n\nPaxos (1989): the original consensus algorithm. More flexible but notoriously hard to implement correctly — even Lamport's original paper had gaps in the multi-Paxos extension. Multi-Paxos is what production systems actually use. Used in: Google Chubby (distributed lock), Spanner (TrueTime + Paxos), Apache Zookeeper (ZAB — a Paxos variant).\n\nQuorum: for a cluster of N nodes, a write requires N/2 + 1 acknowledgements to commit. For 3 nodes, 2 must agree. For 5 nodes, 3 must agree. This guarantees that any two quorums overlap — you can never have two different leaders commit conflicting values simultaneously, because they'd both need >50% of nodes, which is impossible.\n\nLeader election: when a leader fails, followers start an election. A candidate requests votes; nodes grant votes to the first candidate whose log is at least as up-to-date as theirs. The candidate with a majority becomes leader. In Raft, this completes in one or two round trips — typically milliseconds, not seconds.\n\nPerformance implications: every committed write requires a quorum round trip. For a 3-node cluster across two data centres, the quorum write always includes a cross-DC network hop. Spanner solves this by placing all replicas in one region for local quorum with async geo-replication. CockroachDB lets you configure lease preferences to keep the leader near the primary traffic region.",
    key_points: [
      "Consensus: majority agreement before committing — prevents split-brain by design",
      "Raft: single leader, log replication, simpler to understand — production-grade in etcd, CockroachDB",
      "Paxos: more flexible, harder to implement — Google Spanner, Chubby, Zookeeper (ZAB)",
      "Quorum = N/2 + 1 — any two quorums overlap, preventing divergent commits",
      "Leader election completes in milliseconds on partition — Raft typically 1-2 round trips",
      "Quorum write adds network latency — place replicas to minimise quorum round trip"
    ],
    hint: "In a 3-node Raft cluster, the leader and one follower are in us-east, one follower is in eu-west. What is the latency cost of every committed write, and how would you redesign the placement to reduce it?",
    common_trap: "Confusing consensus (agreement on a write) with replication (copying a write). A system can replicate data without consensus (async replication) — but without consensus it can elect two leaders and accept conflicting writes. Consensus is the mechanism that makes 'single leader' safe under failure.",
    follow_up_questions: [
      { text: "What is the difference between Raft and ZooKeeper's ZAB?", type: "inline", mini_answer: "ZAB (ZooKeeper Atomic Broadcast) is a Paxos variant designed for ZooKeeper's primary-backup model. Like Raft, it has a single leader (called the leader in ZK). Key difference: ZAB separates crash recovery (elect a leader, sync all followers to leader's state) from broadcasting (normal operation). Raft handles both with a unified log protocol. Functionally equivalent for most use cases; Raft is easier to reason about and implement." },
      { text: "How does Google Spanner achieve global consistency?", type: "inline", mini_answer: "Spanner uses TrueTime — GPS and atomic clocks in every data centre give a globally synchronised time with a bounded uncertainty interval (typically <7ms). Spanner assigns each transaction a timestamp from TrueTime and waits out the uncertainty interval before committing — guaranteeing that no future transaction gets an earlier timestamp. This enables external consistency (serialisable across global nodes) without a global lock. Paxos groups handle per-shard consensus." },
      { text: "When would you choose a consensus-based DB over a primary-replica setup?", type: "inline", mini_answer: "Consensus DB (CockroachDB, Spanner, TiDB): automatic leader election, no manual failover, multi-region writes, true ACID at scale. Choose when: zero-RPO failover is required, multi-region active-active writes are needed, or manual failover complexity is unacceptable. Primary-replica (Postgres + Patroni): simpler, cheaper, well-understood. Choose when: single-region is acceptable, team has Postgres expertise, or cost is a constraint. Most systems don't need consensus until they do." }
    ],
    related: ["2.6.01", "2.6.03", "2.1.01", "4.5.01"],
    has_diagram: true,
    diagram: `   RAFT CONSENSUS — leader-based log replication

   Normal operation (3 nodes):
   Client ──write──► Leader
                     Leader ──append──► Follower A  ──ack──►
                             ──append──► Follower B  ──ack──►
                     Leader counts acks: 2/3 = quorum ✓
                     Leader ──commit──► Client

   Leader failure:
   Follower A & B: no heartbeat → start election
   Follower A: request vote (log up to date?)
   Follower B: grant vote
   Follower A elected Leader — resumes writes
   (Follower B: gets missing entries on next heartbeat)`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["consensus", "raft", "paxos", "distributed-databases", "quorum", "leader-election"]
  },

  {
    id: "2.6.03",
    section: 2,
    subsection: "2.6",
    level: "advanced",
    question: "How do distributed systems resolve write conflicts, and when do you use LWW, vector clocks, or CRDTs?",
    quick_answer: "→ Conflicts arise in AP systems when two nodes accept writes to the same key during a partition\n→ LWW (Last-Write-Wins): keep the write with the latest timestamp — simple, loses data silently\n→ Vector clocks: track causality — detect which writes are concurrent vs causally related\n→ CRDTs: data structures designed to merge automatically — no conflicts by design\n→ Application-level merge: expose conflict to user or business logic — safest but most complex",
    detailed_answer: "In AP distributed systems (Cassandra, DynamoDB, Riak), partitions allow writes to multiple nodes simultaneously. When the partition heals, conflicting versions must be reconciled. The reconciliation strategy determines what data survives.\n\nLast-Write-Wins (LWW): each write carries a timestamp. On conflict, the write with the higher timestamp wins. Simple to implement, simple to reason about. Fatal flaw: clocks in distributed systems are not perfectly synchronised. Two concurrent writes from different nodes may have 'timestamps' that don't reflect real ordering. The write with the higher timestamp may not be the 'correct' one — it may have been written milliseconds earlier by a node with a fast clock. Silent data loss. Used by: Cassandra (default), DynamoDB (default). Acceptable when: losing a write is fine (view counts, last-known GPS position), or clock skew is managed (NTP-synchronised, bounded by milliseconds).\n\nVector clocks: each value carries a vector of (node, sequence number) pairs tracking the causality chain. If version A's vector clock is ≥ B in all dimensions, A causally supersedes B and B is discarded. If neither dominates (concurrent writes), a conflict is detected and exposed to the caller or business logic for resolution. Riak uses vector clocks. No silent data loss — conflicts are always detected. Cost: vector clocks grow in size as more nodes participate, requiring periodic pruning.\n\nCRDTs (Conflict-free Replicated Data Types): data structures where the merge function is commutative, associative, and idempotent — any order of merging always produces the same result. No conflicts by design. Examples: G-Counter (grow-only counter, merge = max per node), OR-Set (observed-remove set, merge = union of observed additions minus observed removals), LWW-Register (last-write-wins register, but at the CRDT level). Used in: Redis CRDT module, Riak CRDTs, collaborative editing (Yjs, Automerge). Limitation: not all data structures have CRDT variants — complex business objects often cannot be expressed as CRDTs.\n\nApplication-level merge: detect the conflict (via vector clock or version mismatch) and surface it to business logic or the user. Shopping cart merge (Dynamo's original use case): add the union of both carts and let the user remove duplicates. Correct but complex to implement and test.",
    key_points: [
      "LWW: simple, fast, loses data silently on clock skew — acceptable for counters and telemetry, not for business data",
      "Vector clocks: detect causality and concurrent writes — expose conflicts for resolution, no silent loss",
      "CRDTs: merge by design — counters, sets, registers that always converge without application logic",
      "Application merge: safest for business data — most complex, requires domain-specific logic",
      "AP systems must choose a strategy upfront — the database doesn't resolve it for you",
      "Clock skew makes pure timestamp ordering unreliable — always combine with vector clocks for correctness"
    ],
    hint: "Two users simultaneously update their shared shopping cart from different regions. Walk me through what happens with LWW vs vector clocks vs a CRDT set. Which items survive in each case?",
    common_trap: "Using LWW on Cassandra for mutable business objects (user profiles, order status) without considering clock skew. A profile update from a client with a 100ms-fast clock will silently overwrite a later update from a correctly-synchronised client. Use monotonic versioning or conditional updates (lightweight transactions in Cassandra) instead.",
    follow_up_questions: [
      { text: "How do Cassandra lightweight transactions prevent conflicts without full consensus?", type: "inline", mini_answer: "Cassandra LWT uses Paxos internally for a compare-and-set operation: INSERT ... IF NOT EXISTS or UPDATE ... IF version = X. This prevents lost updates on a single partition at the cost of 4 round trips (Paxos prepare + accept + commit + read). ~4× slower than normal writes. Use for: idempotency key checks, inventory deductions, unique constraint emulation. Not suitable for high-frequency writes on a single partition." },
      { text: "What is operational transformation and how does it differ from CRDTs?", type: "inline", mini_answer: "Operational Transformation (OT): used in collaborative editing (Google Docs). Each operation is transformed relative to concurrent operations — 'insert at position 5' becomes 'insert at position 6' if a concurrent insert at position 3 already happened. Requires a central server to order operations. CRDTs: fully decentralised, operations commute without transformation. OT is older and harder to implement correctly; CRDTs are preferred for new collaborative systems (Yjs, Automerge use CRDTs)." },
      { text: "When are CRDTs the wrong choice?", type: "inline", mini_answer: "CRDTs enforce specific merge semantics — you can't choose how conflicts resolve, the data type defines it. For a bank balance, a G-Counter (grow-only) can't model withdrawals correctly. For a document with structured content, there's no CRDT that preserves all formatting semantics. CRDTs work well for simple data types (counters, sets, last-value registers); they struggle with complex domain invariants that require business logic to adjudicate conflicts." }
    ],
    related: ["2.6.01", "2.1.01", "4.5.01", "4.5.02"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["conflict-resolution", "lww", "vector-clocks", "crdts", "eventual-consistency", "distributed-systems"]
  },

  {
    id: "2.6.04",
    section: 2,
    subsection: "2.6",
    level: "advanced",
    question: "How do you design a multi-region database architecture — active-passive vs active-active?",
    quick_answer: "→ Active-passive: one primary region, replicas elsewhere — simple, eventual reads, writes always to primary\n→ Active-active: writes accepted in multiple regions — low-latency writes globally, conflict complexity\n→ Most systems start active-passive — simpler, no conflict resolution needed\n→ Active-active only justified when write latency from remote region is unacceptable\n→ Global tables (DynamoDB), CockroachDB, Spanner — managed active-active options",
    detailed_answer: "Multi-region architectures improve latency for globally distributed users and provide disaster recovery against a full region failure.\n\nActive-passive (primary-secondary): one region is primary and accepts all writes. Other regions have read replicas that receive asynchronous replication from primary. Users near non-primary regions can read locally (with replication lag tolerance) but must route writes to primary. Simple: no conflict resolution needed, one source of truth. Cost: write latency for users far from primary is high (e.g., EU users writing to US-East primary add ~100ms per write). Failover: promote a replica to primary — typically manual or semi-automated (Patroni, Route 53 health checks).\n\nActive-active: all regions accept writes. Each region replicates to all others. Users get low write latency globally. Complex: concurrent writes to the same record from different regions create conflicts. You need a conflict resolution strategy (LWW, vector clocks, CRDTs — see 2.6.03) and careful data modeling to minimise conflicts. CockroachDB and Spanner solve this with consensus across regions (every write is globally consistent but pays the consensus latency). DynamoDB Global Tables uses LWW with async replication.\n\nPartitioned active-active: a hybrid. Shard data by region — EU users' data lives in EU, US users' data lives in US. Within a region, data is active-active. Cross-region data is rare. This avoids most conflicts (each user's data is 'owned' by one region) while giving local write latency. Works well for user-partitioned systems (each user belongs to one region). Fails for globally shared objects (a product inventory that global users purchase from simultaneously).\n\nRPO and RTO: active-passive with async replication has RPO = replication lag (seconds) and RTO = failover time (minutes). Active-active with consensus has RPO = 0 and RTO near-zero but pays latency on every write. Active-passive with synchronous replication to one replica has RPO = 0 but higher write latency.\n\nPractical advice: start active-passive. Measure actual write latency from each region. If a specific region's write latency is unacceptable and that region represents significant business volume, invest in active-active for that region pair. Don't build active-active speculatively.",
    key_points: [
      "Active-passive: one primary, async replicas — simple, no conflicts, higher write latency for remote users",
      "Active-active: writes everywhere — low global write latency, conflict resolution required",
      "Partitioned active-active: data owned by region — avoids conflicts for user-partitioned data",
      "CockroachDB/Spanner: consensus-based active-active — strong consistency, pays latency on every write",
      "DynamoDB Global Tables: LWW active-active — fast but silently loses conflicting writes",
      "Start active-passive; add active-active only when measured write latency is unacceptable"
    ],
    hint: "Your payments platform processes $5M/day. EU customers complain about 200ms write latency because all writes go to US-East. Walk me through the architecture options — what are the risks of moving to active-active for payments?",
    common_trap: "Adopting active-active for disaster recovery. Most active-active complexity is incurred for write latency, not DR. For DR alone, active-passive with automated failover is simpler, equally effective, and avoids conflict resolution entirely. Separate the DR goal from the latency goal.",
    follow_up_questions: [
      { text: "How does DynamoDB Global Tables handle conflicts between regions?", type: "inline", mini_answer: "DynamoDB Global Tables uses LWW with 'last writer wins' based on item-level timestamps. Concurrent writes from different regions race — the one with the highest timestamp survives. There's no application-level conflict notification. This is acceptable for data that's unlikely to be written from two regions simultaneously (user-partitioned data) but dangerous for globally shared mutable objects like inventory counts." },
      { text: "What is a geo-partitioned database and when is it used?", type: "inline", mini_answer: "Geo-partitioning pins rows to specific regions based on a partition column (e.g., user's home region). CockroachDB and Spanner support this natively. EU rows stay in EU nodes; US rows stay in US nodes. Writes from the user's home region are local and fast. Cross-region access (EU user accessing US data) is slow. Used for: GDPR data residency requirements, latency optimisation for user-partitioned data, regulatory compliance." },
      { text: "How do you test multi-region failover before it happens in production?", type: "inline", mini_answer: "Chaos engineering: inject a simulated region failure (block traffic to primary region, stop the primary DB, kill all instances in one AZ). Measure: time to detect failure, time to promote replica, time to route traffic to new primary, any data loss. Automate with: AWS Fault Injection Simulator, Chaos Monkey, manual Route 53 health check overrides. Run quarterly — failover procedures rot quickly without practice." }
    ],
    related: ["2.6.01", "2.6.02", "2.6.03", "3.2.01", "3.7.01"],
    has_diagram: true,
    diagram: `   ACTIVE-PASSIVE vs ACTIVE-ACTIVE

   ACTIVE-PASSIVE
   ┌─────────────┐  async repl  ┌─────────────┐
   │  US-EAST    │─────────────►│  EU-WEST    │
   │  PRIMARY ✎  │              │  REPLICA 👁  │
   └─────────────┘              └─────────────┘
   All writes → US-EAST         Reads local (lagged)

   ACTIVE-ACTIVE
   ┌─────────────┐  bidirect.   ┌─────────────┐
   │  US-EAST ✎  │◄────────────►│  EU-WEST ✎  │
   │  Accepts    │   repl +     │  Accepts    │
   │  writes     │  conflict    │  writes     │
   └─────────────┘  resolution  └─────────────┘
   Low latency globally — conflict strategy required`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["multi-region", "active-active", "active-passive", "geo-distribution", "replication", "disaster-recovery"]
  },

  {
    id: "2.6.05",
    section: 2,
    subsection: "2.6",
    level: "intermediate",
    question: "What are the consistency guarantees (read-your-writes, monotonic reads, causal consistency) and how do you implement them?",
    quick_answer: "→ Read-your-writes: after you write, your next read sees the write — route your reads to primary\n→ Monotonic reads: once you read a value, you never read an older value — sticky session routing\n→ Causal consistency: if A caused B, everyone sees A before B — vector clocks or session tokens\n→ These are weaker than linearisability but stronger than eventual consistency\n→ Most apps need read-your-writes — it's the most visible consistency bug for users",
    detailed_answer: "Distributed systems offer a spectrum of consistency models between 'strong consistency' (every read sees the latest write) and 'eventual consistency' (reads will eventually converge). Several intermediate guarantees are practically useful.\n\nRead-your-writes (read-your-own-writes): after a client writes a value, subsequent reads by that same client see the written value. Sounds obvious — in a single-server world it's trivially true. In a system with primary + async replicas, if the read is served by a replica that hasn't received the write yet, the client sees the old value. Implementation: route reads for data that was recently written to the primary (or the specific replica that already has the write). Many apps implement this with a 'write token' — after a write, the client receives a version token and sends it with subsequent reads; any read node with that version can serve the request.\n\nMonotonic reads: once a client reads a value at version V, all subsequent reads return V or a newer version. Without this, a client could read from replica A (ahead) then replica B (behind) and observe values going backwards in time. Implementation: sticky session routing — pin a client session to a specific replica. Side effect: if that replica fails, the session must be pinned to a new one that's at least as current.\n\nMonotonic writes: writes from a client are executed in the order they were issued. If client sends W1 then W2, no replica applies W2 before W1. Usually guaranteed by TCP ordering to a single primary.\n\nCausal consistency: if write A causally precedes write B (because the writer of B observed A), then any client that reads B also sees A. Stronger than eventual, weaker than linearisability. Implemented via causal tokens (version vectors). Used in: MongoDB causal sessions (send session cluster time on each operation), Cosmos DB session consistency.\n\nLinearisability (strong consistency): the strongest model. Every read sees the most recent committed write, globally. Requires consensus on reads (quorum reads or leader reads). Cost: high latency. Provided by: Spanner, CockroachDB, etcd, Postgres primary reads.",
    key_points: [
      "Read-your-writes: the most visible consistency bug for users — always ensure this for mutation flows",
      "Monotonic reads: prevents time-going-backwards UX — sticky routing or version checks",
      "Causal consistency: sees causes before effects — session tokens, vector clocks",
      "Linearisability: strongest, most expensive — every read hits the current primary",
      "Route recently-written data reads to primary, all other reads to replicas — practical balance",
      "Cosmos DB consistency levels (Strong > Bounded Staleness > Session > Consistent Prefix > Eventual) are a good reference taxonomy"
    ],
    hint: "A user posts a comment, then immediately refreshes the page. The comment isn't there. Which consistency guarantee was violated? What is the simplest fix in your architecture?",
    common_trap: "Assuming eventual consistency is fine for all reads because 'it converges quickly'. For user-initiated writes, the user always reads immediately after writing — the convergence window is exactly the window during which they see nothing. Read-your-writes is non-negotiable for any mutation the user perceives as immediate.",
    follow_up_questions: [
      { text: "How does MongoDB implement causal consistency?", type: "inline", mini_answer: "MongoDB 3.6+ causal sessions: each operation returns an operationTime (cluster time). The client passes this as afterClusterTime on subsequent reads. Any node serving the read must have applied operations at least up to that time — if it hasn't, it waits or routes to the primary. This ensures the client always reads in causal order across a replica set, even when reading from secondaries." },
      { text: "What is the difference between linearisability and serializability?", type: "inline", mini_answer: "Linearisability: real-time ordering of individual operations — each operation appears to take effect instantaneously at some point between its start and end. A property of single operations. Serializability: transactions execute as if in some serial order — no interleaving. A property of transaction groups. Strict serializability = both: transactions are serializable AND each appears to take effect instantaneously. Spanner provides strict serializability. Postgres provides serializability (with SERIALIZABLE isolation) but not linearisability on replicas." },
      { text: "How do you implement read-your-writes at the application layer without always hitting the primary?", type: "inline", mini_answer: "Write token approach: after each write, record the replication position (Postgres LSN, MySQL GTID, Cassandra timestamp). Return this token to the client as a header or cookie. On subsequent reads, the client sends the token. The load balancer or app routes the request to any replica that has caught up to at least that position. The first eligible replica serves the request — spreads load while preserving consistency for that session." }
    ],
    related: ["2.6.01", "2.6.03", "2.1.01", "4.5.02"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["consistency-models", "read-your-writes", "monotonic-reads", "causal-consistency", "linearisability", "distributed-systems"]
  },


  // ============================================================
  // 2.7  CQRS & EVENT SOURCING  (4 questions)
  // ============================================================

  {
    id: "2.7.01",
    section: 2,
    subsection: "2.7",
    level: "intermediate",
    question: "What is CQRS and when does separating the read and write model give you a real advantage?",
    quick_answer: "→ CQRS: Command Query Responsibility Segregation — separate models for writes (commands) vs reads (queries)\n→ Write model: normalised, consistent, enforces invariants — optimised for correctness\n→ Read model: denormalised, shaped for the UI — optimised for query performance\n→ Justified when: read and write loads differ significantly, or read shape differs heavily from write shape\n→ Avoid for simple CRUD — the complexity is real, the benefit must be earned",
    detailed_answer: "CQRS separates the data model used for writes (commands) from the model used for reads (queries). In a standard architecture, the same table serves both — you INSERT an order and SELECT it back. CQRS says these two concerns have different shapes and different optimisation needs, so model them separately.\n\nThe write model (command side) is normalised and consistent. It enforces business invariants — 'an order cannot be placed if stock is zero', 'a user cannot have two active subscriptions'. It's transactional, protected by locks or optimistic concurrency, and shaped around the aggregate (an entity that enforces its own rules). Writes are small and targeted.\n\nThe read model (query side) is denormalised and shaped for consumption. An order list page needs order ID, customer name, status, item count, and total — a join across three normalised tables. With CQRS, you maintain a pre-computed read model: a separate table or document store that already has this shape. Reads are fast because they hit a single, pre-joined structure.\n\nThe read model is updated asynchronously after a write completes — either via events published by the write side, CDC, or a projection process. This introduces eventual consistency between write and read sides.\n\nWhen CQRS earns its complexity: heavily asymmetric read/write volumes (e.g., 1000 reads per write, where each read requires five expensive joins), read models that differ significantly from the write model (complex reporting structures, denormalised views per UI screen), or systems where the write side must enforce strict invariants while the read side needs flexible query shapes. Event sourcing (2.7.02) is a natural pair — events are the mechanism that keeps the read model updated.\n\nWhen to avoid CQRS: simple CRUD applications where reads and writes use the same shape. The overhead of maintaining two models, keeping them in sync, and handling eventual consistency between them is real. A materialised view in Postgres achieves most of the read-model benefit without the full CQRS architecture.",
    key_points: [
      "Write model: normalised, transactional, enforces invariants — optimised for correctness",
      "Read model: denormalised, pre-joined, shaped for the query — optimised for read speed",
      "Async projection keeps read model updated — introduces eventual consistency between sides",
      "Justified when read/write asymmetry is significant or read shapes diverge heavily from write shape",
      "CQRS adds two models, synchronisation complexity, and eventual consistency — earn it before adding it",
      "Materialised views in Postgres achieve CQRS-lite without the full pattern overhead"
    ],
    hint: "Pick a specific API endpoint that's slow. Describe the joins required. Now describe what a purpose-built read model for that endpoint would look like. That delta is the case for CQRS.",
    common_trap: "Applying CQRS to every entity because it's 'scalable'. Simple lookup endpoints (GET /users/{id}) return the write model shape — there's no separate read model needed. CQRS is for the complex read queries where you'd otherwise build a slow JOIN chain, not for every endpoint.",
    follow_up_questions: [
      { text: "How do you keep the CQRS read model consistent with the write model?", type: "inline", mini_answer: "Three patterns: (1) Synchronous projection: update read model in the same transaction as the write — simple but couples both sides. (2) Domain events: write side publishes an event after commit; a projection handler subscribes and updates the read model — async, eventual. (3) CDC: capture write-side DB changes via WAL and replay into the read model store — decoupled, reliable. Async is the standard choice; accept that read model may lag by milliseconds to seconds." },
      { text: "Can you use CQRS without event sourcing?", type: "inline", mini_answer: "Yes — CQRS and event sourcing are independent patterns that complement each other but neither requires the other. CQRS without ES: write to a normalised DB, propagate changes via CDC or domain events to a denormalised read store. ES without CQRS: store events as source of truth but serve reads from the same event store (less common, often impractical at scale). The combination is powerful but both patterns add complexity independently." },
      { text: "How does CQRS relate to the read-replica pattern?", type: "linked", links_to: "2.6.01", mini_answer: "Read replicas are an infrastructure-level read/write split — same schema, async copy. CQRS is a model-level split — different schemas optimised for each side. Read replicas reduce load on the primary but still serve the normalised schema (joins required). CQRS read models are pre-joined for specific query patterns — much faster for complex reads. CQRS often uses a read replica or a separate store (Redis, Elasticsearch) as the read model backing store." }
    ],
    related: ["2.2.03", "2.7.02", "2.7.03", "4.1.08"],
    has_diagram: true,
    diagram: `   CQRS — separate write and read models

   COMMAND SIDE (write)          QUERY SIDE (read)
   ─────────────────────         ──────────────────────────
   PlaceOrderCommand             OrderSummaryReadModel
      │                             │
      ▼                             │ (pre-joined, denormalised)
   Order aggregate               ┌──┴─────────────────────┐
   (enforces invariants)         │ order_id │ cust_name   │
      │                          │ status   │ item_count  │
      ▼                          │ total    │ created_at  │
   orders table (normalised)     └────────────────────────┘
      │                                    ▲
      │ domain event / CDC                 │
      └────────────────────────────────────┘
                           async projection`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["cqrs", "command-query-separation", "read-model", "write-model", "projections", "architecture"]
  },

  {
    id: "2.7.02",
    section: 2,
    subsection: "2.7",
    level: "advanced",
    question: "What is event sourcing and what does it mean to make the event log the source of truth?",
    quick_answer: "→ Event sourcing: store every state change as an immutable event — never update rows, only append\n→ Current state = replay of all events — the log IS the database\n→ Built-in audit trail, time-travel queries, event replay for bug fixes and projections\n→ Complexity: event schema evolution, eventual consistency, snapshot management\n→ Best fit: domains where history matters (finance, compliance, collaborative editing)",
    detailed_answer: "In conventional systems, you store current state: the orders table has one row per order with the latest values. When an order ships, you UPDATE the status column. The previous state is overwritten — gone.\n\nEvent sourcing inverts this: you store every state change as an immutable event. OrderPlaced, PaymentReceived, OrderShipped, OrderRefunded. Current state is derived by replaying all events for an entity from beginning to present. You never UPDATE a row — you always APPEND a new event.\n\nThe event store is an append-only log. Each event has: aggregate_id (e.g., order_123), event_type, event_data (JSON payload), and a sequence number or timestamp. Events are immutable — they happened and cannot be changed.\n\nAdvantages: complete audit trail for free (compliance, fraud investigation). Time-travel: reconstruct the state of any entity at any past point T by replaying events up to T. Event replay: if a bug corrupted derived state, fix the bug and replay events to rebuild correct state. Decoupled read models: any number of projections can subscribe to the event stream and maintain their own optimised read models (CQRS natural fit).\n\nChallenges: querying current state requires replaying events — expensive for entities with thousands of events. Solved with snapshots: periodically record the current computed state; on load, start from the nearest snapshot then replay only subsequent events. Event schema evolution: events are immutable, but business requirements change. Versioning strategies: upcasting (transform old event format to new at read time), event versioning fields, or new event types that supersede old ones.\n\nEventual consistency: the write side commits an event, but read model projections update asynchronously. The read model may lag by milliseconds. Design the UI to handle this — optimistic updates, polling, or websocket notifications.\n\nFit: event sourcing shines where history is a first-class concern — financial transactions (audit requirements), order management (customer support needs history), collaborative editing, and gaming (replay, undo). It's overengineering for a user profile or configuration service where history doesn't matter.",
    key_points: [
      "Events are immutable facts that happened — never update, always append",
      "Current state = replay of events — aggregate load reconstructs state from log",
      "Built-in: audit trail, time-travel, event replay for projection rebuilds",
      "Snapshots amortise replay cost — load snapshot + replay only delta events",
      "Event schema evolution is the hardest operational challenge — plan versioning upfront",
      "Natural pair with CQRS: event stream feeds read model projections"
    ],
    hint: "An order has 200 events over its lifetime. You load it 10,000 times per second. Without snapshots, what is the DB load? With a snapshot every 50 events, what changes?",
    common_trap: "Using event sourcing everywhere because 'it's elegant'. For a config table or user preferences, you're adding snapshot management, event versioning, and projection complexity for no benefit — current state is all that matters. Reserve it for domains where history is genuinely valuable.",
    follow_up_questions: [
      { text: "How do you handle event schema evolution in event sourcing?", type: "inline", mini_answer: "Three strategies: (1) Upcasting: when loading old events, transform them to the current schema at read time — code in the aggregate loader. Old events stay unchanged in the store. (2) Event versioning: add a version field, write handlers for each version. (3) New event types: deprecate old types, introduce new ones for new behaviour. Never modify stored events — they're the ground truth. Upcasting is the most common production approach." },
      { text: "What is a saga and how does it relate to event sourcing?", type: "linked", links_to: "4.5.03", mini_answer: "A saga coordinates a multi-step business process across services, each step triggered by an event. In an event-sourced system, sagas subscribe to domain events and emit compensating commands if a step fails. Example: OrderPlaced → ReserveInventory → ChargePayment → ConfirmOrder. If ChargePayment fails, the saga emits ReleaseInventory. Sagas are naturally expressed as event-driven state machines — the saga's own state can be event-sourced." },
      { text: "How do you implement snapshotting in an event-sourced system?", type: "inline", mini_answer: "Periodically (every N events or on a schedule), serialise the current aggregate state and store it with the sequence number it represents. On load: fetch the latest snapshot, then fetch only events with sequence > snapshot.sequence, replay those. Snapshot storage: same event store (as a special event type), or a separate snapshot table. Snapshot frequency: balance between replay cost (fewer snapshots = more replay) and snapshot storage cost." }
    ],
    related: ["2.7.01", "2.7.03", "2.7.04", "4.3.01", "2.5.03"],
    has_diagram: true,
    diagram: `   EVENT SOURCING — append-only event log

   Traditional (mutable state):
   orders: │ id │ status   │ total │
           │ 1  │ shipped  │ 99.99 │  ← previous states gone

   Event Sourced (immutable events):
   events: │ agg_id  │ seq │ type              │ data          │
           │ order:1 │  1  │ OrderPlaced       │ {total:99.99} │
           │ order:1 │  2  │ PaymentReceived   │ {method:card} │
           │ order:1 │  3  │ OrderShipped      │ {tracking:..} │

   Load order:1 → replay seq 1,2,3 → current state
   Load order:1 at T=after seq 2 → replay 1,2 → state before ship`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["event-sourcing", "append-only", "event-log", "audit-trail", "snapshots", "cqrs"]
  },

  {
    id: "2.7.03",
    section: 2,
    subsection: "2.7",
    level: "advanced",
    question: "How do you build and maintain read model projections in a CQRS/ES system?",
    quick_answer: "→ Projection: subscribes to the event stream, builds and maintains a read-optimised data store\n→ Each projection is a purpose-built view — one per query pattern or UI screen\n→ Projections are disposable and rebuildable — replay all events to rebuild from scratch\n→ Projection rebuilds: blue-green approach — build new projection, then swap, no downtime\n→ Idempotency: projections must handle duplicate events safely",
    detailed_answer: "A projection is a process that listens to the event stream and maintains a denormalised, query-optimised read store. It is the 'Q' side of CQRS given life by event sourcing.\n\nEach projection has a single responsibility: maintain one read model optimised for a specific query. An 'ActiveOrdersProjection' subscribes to OrderPlaced, OrderShipped, OrderCancelled and maintains a table of currently active orders. A 'CustomerOrderHistoryProjection' maintains a per-customer list of all orders with summary data. Each projection has its own store — Postgres table, Redis hash, Elasticsearch index — whatever is optimal for its query pattern.\n\nProjections are rebuilt by replaying events. This is the key insight: if a projection is wrong, corrupt, or you need to add a new query, you can destroy the projection store and rebuild it from scratch by replaying every event in the event log. Rebuilds are safe because events are immutable — the rebuild always produces the same result. This is fundamentally different from a mutable database where deleting a table loses data permanently.\n\nBlue-green projection rebuild: to rebuild without downtime, create a new projection store ('green') alongside the existing one ('blue'). Replay all events into green while blue continues serving traffic. Once green has caught up to the event stream's tail, switch traffic to green and decommission blue. Zero-downtime schema migration.\n\nProjection position tracking: each projection must track which event it last processed (position/offset in the event log). On restart, it resumes from its last processed position. Store the position atomically with the projection state update — if the projection updates Postgres, store the position in the same transaction.\n\nIdempotency: the event delivery system may deliver the same event twice (at-least-once delivery). Projections must handle this safely — either check 'have I already processed event X?' before applying, or make the projection logic naturally idempotent (SET value = X is idempotent; INCREMENT value is not).",
    key_points: [
      "One projection per query pattern — each maintains its own denormalised read store",
      "Projections are disposable — rebuild by replaying events, no data loss",
      "Blue-green rebuild: new projection catches up alongside old, then swap — zero downtime",
      "Track projection position atomically with state update — safe resume on restart",
      "At-least-once delivery: projections must be idempotent or check for duplicate events",
      "Projection lag: async projections trail the write side — design UI for eventual consistency"
    ],
    hint: "You discover a bug that caused your OrderRevenueSummary projection to undercount revenue for the past 3 months. How do you fix it without downtime and without losing any current data?",
    common_trap: "Updating projection state and position in separate transactions. If the app crashes between them, on restart it re-processes the last event and applies it twice. Always write state + position atomically in one transaction, or use idempotent projection logic.",
    follow_up_questions: [
      { text: "How do you handle projections that need data from multiple aggregates?", type: "inline", mini_answer: "Subscribe to events from all relevant aggregate types. Example: 'OrderWithCustomerDetails' projection subscribes to both OrderPlaced (order data) and CustomerUpdated (customer name/email). When a CustomerUpdated event arrives, the projection re-queries all orders for that customer and updates their denormalised customer details. This creates a fan-out update — acceptable if the customer's order count is bounded; problematic if a single customer has millions of orders." },
      { text: "What event store databases exist and what are the trade-offs?", type: "inline", mini_answer: "EventStoreDB: purpose-built, optimised for append and stream reads, built-in subscription/catch-up, good developer experience. Kafka: high-throughput, good for shared event streams, but not optimised for per-aggregate stream reads. Postgres (append-only table): simple, existing infra, SQL querying — works well at moderate scale. DynamoDB: append-only via GSI tricks, scalable but complex. For most teams: start with Postgres or EventStoreDB, move to Kafka if throughput demands it." },
      { text: "How do you test that a projection is correct?", type: "inline", mini_answer: "Three layers: (1) Unit test the projection handler: given this list of events, assert the resulting read model state. Pure function, no infrastructure needed. (2) Integration test: publish events to the actual event store, let the projection run, assert the read model store. (3) Rebuild test: populate event store with known events, rebuild projection from scratch, assert correctness matches expected. The rebuild test catches ordering and idempotency bugs that unit tests miss." }
    ],
    related: ["2.7.01", "2.7.02", "4.3.01", "4.3.02"],
    has_diagram: false,
    diagram: "",
    has_code: true,
    code_language: "python",
    code_snippet: `# Projection handler — idempotent, tracks position atomically
class ActiveOrdersProjection:
    def handle(self, event: Event, db: Session):
        # Idempotency: skip if already processed
        if db.query(ProcessedEvent).filter_by(event_id=event.id).first():
            return

        if event.type == "OrderPlaced":
            db.add(ActiveOrder(
                order_id=event.aggregate_id,
                customer_id=event.data["customer_id"],
                total=event.data["total"],
                status="placed"
            ))
        elif event.type == "OrderShipped":
            db.query(ActiveOrder)\
              .filter_by(order_id=event.aggregate_id)\
              .update({"status": "shipped"})
        elif event.type == "OrderCancelled":
            db.query(ActiveOrder)\
              .filter_by(order_id=event.aggregate_id)\
              .delete()

        # Atomically mark event as processed
        db.add(ProcessedEvent(event_id=event.id, position=event.position))
        db.commit()  # state + position in one transaction`,
    tags: ["projections", "cqrs", "event-sourcing", "read-model", "idempotency", "blue-green"]
  },

  {
    id: "2.7.04",
    section: 2,
    subsection: "2.7",
    level: "intermediate",
    question: "When should you use CQRS and event sourcing together, and when is it overengineering?",
    quick_answer: "→ Use when: audit/history is a first-class requirement, read and write loads differ significantly\n→ Use when: multiple downstream systems consume write-side events independently\n→ Avoid when: simple CRUD, small team, requirements are exploratory, schema changes are frequent\n→ Cost: two models, eventual consistency, snapshot management, event versioning\n→ Start with a simple architecture — add CQRS/ES when you hit specific, measured problems",
    detailed_answer: "CQRS and event sourcing are powerful but carry real complexity costs. The decision to use them should be driven by concrete problems, not architectural fashion.\n\nStrong signals to use CQRS + ES: domain has complex audit requirements (financial transactions, healthcare records, compliance-heavy systems where 'what happened and when?' is a core business question). The read load is dramatically higher than write load and read shapes differ significantly from write shapes. Multiple downstream systems need to react to changes independently — events are the natural integration mechanism. The domain has complex business logic where replaying events to rebuild state catches bugs and simplifies testing. Collaborative editing or multi-user conflict-prone workflows.\n\nStrong signals to avoid: simple CRUD applications (user settings, CMS content, configuration). Small team with limited experience — the learning curve is real and the operational burden is high. Rapidly changing requirements — event schemas are hard to evolve and changing them retroactively is painful. Queries are simple — if your read model looks identical to your write model, you don't need CQRS. The system is small — adding two models, eventual consistency, and projection infrastructure to a service with 5 endpoints is net negative.\n\nThe incremental path: most systems benefit from starting simple and extracting patterns when specific pain emerges. A normalised DB with materialised views covers 80% of CQRS read-model benefit. A DB audit table (append change events) covers 80% of event sourcing audit benefit. Introduce full CQRS when you have measured the read vs write model mismatch. Introduce event sourcing when history replay and temporal queries become genuinely needed.\n\nTeam alignment: CQRS/ES requires the whole team to understand the pattern. A single engineer who understands it cannot sustainably maintain it alone. Budget for training, documentation, and the inevitable 'why is the read model stale?' questions from non-architects.",
    key_points: [
      "Use CQRS/ES for: audit requirements, high read/write asymmetry, event-driven integrations",
      "Avoid for: simple CRUD, small teams, rapidly changing schemas, exploratory domains",
      "Materialised views + audit table cover 80% of the benefit at 20% of the complexity",
      "Event schema evolution is the most painful long-term cost — factor it into the decision",
      "Start simple, add patterns when you hit the specific pain they solve",
      "Team alignment is non-negotiable — the whole team must understand the model to maintain it"
    ],
    hint: "Your team of 4 is building an e-commerce MVP with 6 months to launch. Your CTO mentions CQRS and event sourcing 'for scalability'. What's your honest assessment?",
    common_trap: "Conflating 'we have a lot of data' with 'we need event sourcing'. Event sourcing is about the shape of operations and auditability requirements, not data volume. You can have billions of rows with no need for event sourcing, and a system with thousands of events that absolutely requires it.",
    follow_up_questions: [
      { text: "How do you migrate a traditional CRUD system to CQRS incrementally?", type: "inline", mini_answer: "Strangler Fig approach: identify the module with the highest read/write asymmetry or most complex queries. Extract its read model as a CQRS projection fed by CDC from the existing table. Add CQRS to this module only — the rest stays CRUD. Once the pattern is proven and the team understands it, expand to the next module. Never do a big-bang CQRS migration — the surface area of change is too large." },
      { text: "What is the outbox pattern and how does it relate to CQRS?", type: "linked", links_to: "4.3.05", mini_answer: "The outbox pattern ensures events are reliably published after a write-side commit: write the domain event to an 'outbox' table in the same transaction as the aggregate state change. A separate process polls the outbox and publishes events to the event bus, then marks them as sent. This prevents the dual-write problem (DB commit succeeds but event publish fails). Essential in CQRS/ES systems where projection correctness depends on every event being delivered." },
      { text: "How does event sourcing affect integration testing strategy?", type: "inline", mini_answer: "ES makes integration testing more deterministic: tests can build precise event sequences and assert exact projected state. No need to simulate complex DB states — just emit the events that would produce them. Downside: tests become coupled to event schema — a renamed field in an event breaks tests across the board. Keep events stable and test at the command level (given these commands, assert these events) rather than at the raw event level where possible." }
    ],
    related: ["2.7.01", "2.7.02", "2.7.03", "4.3.05", "4.1.08"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["cqrs", "event-sourcing", "architecture-decisions", "trade-offs", "overengineering", "when-to-use"]
  },


  // ============================================================
  // 2.8  DATA PARTITIONING & SHARDING  (4 questions)
  // ============================================================

  {
    id: "2.8.01",
    section: 2,
    subsection: "2.8",
    level: "intermediate",
    question: "What is the difference between partitioning and sharding, and when do you need each?",
    quick_answer: "→ Partitioning: split a table into sub-tables within one DB instance — query routing is automatic\n→ Sharding: split data across multiple DB instances — each shard is an independent database\n→ Partition for: query pruning, data lifecycle management, large table performance\n→ Shard for: data exceeds a single node's storage or write throughput ceiling\n→ Try partitioning first — sharding is an order of magnitude more complex",
    detailed_answer: "Partitioning and sharding are both techniques for splitting large datasets, but they operate at different levels and solve different problems.\n\nPartitioning splits a single logical table into multiple physical sub-tables (partitions) within the same database instance. The database engine handles routing transparently — a query with a partition key filter only scans the relevant partition (partition pruning). Postgres declarative partitioning, MySQL partitioning, and Oracle table partitioning all work this way. Benefits: queries skip irrelevant partitions (massive scan reduction), old partitions can be dropped instantly (DROP TABLE is O(1) vs DELETE which scans millions of rows), index maintenance is per-partition not global. Use for: time-series data (partition by month, drop old months), large tables where most queries filter on a known column, data lifecycle management.\n\nSharding distributes data across multiple database instances, each called a shard. Shard 1 holds users 1-1M, Shard 2 holds users 1M-2M, etc. Each shard is an independent database — its own connection pool, its own disk, its own replication setup. The application (or a middleware layer) determines which shard to route each query to. Benefits: horizontal write scale (each shard absorbs a fraction of total writes), storage beyond a single node's capacity, independent failure domains. Cost: cross-shard queries require scatter-gather (fan out to all shards, merge results), referential integrity across shards is impossible, resharding is extremely expensive.\n\nDecision order: (1) Can an index fix the query? (2) Can partitioning fix the scan or lifecycle problem? (3) Has a single node genuinely hit its storage or write ceiling? Only if yes to (3) should you shard. A single well-tuned Postgres instance can handle several TB and 50k+ writes/sec. Most systems never need sharding — they reach for it at a fraction of the load where it becomes necessary.",
    key_points: [
      "Partitioning: sub-tables within one instance — transparent routing, partition pruning, O(1) drops",
      "Sharding: data split across multiple instances — horizontal write scale, storage beyond one node",
      "Partition for: time-series lifecycle, query pruning on large tables",
      "Shard for: storage or write throughput beyond a single node's ceiling",
      "Cross-shard queries require scatter-gather — expensive and complex",
      "Always try partitioning before sharding — sharding is an order of magnitude more complex"
    ],
    hint: "Your orders table has 2 billion rows and most queries filter by created_at in the last 30 days. Before sharding, what simpler approach should you try first — and what does it give you?",
    common_trap: "Sharding prematurely because the table is 'too big'. Table size alone doesn't justify sharding — query performance and write throughput do. A 2TB table with good indexes and range partitioning often performs better than a sharded system with the coordination overhead of scatter-gather queries.",
    follow_up_questions: [
      { text: "What is consistent hashing and why is it used for sharding?", type: "linked", links_to: "2.4.03", mini_answer: "Consistent hashing maps keys to a ring; shards own arcs of the ring. When a shard is added or removed, only keys on adjacent arcs are remapped — O(K/N) keys move instead of O(K). Mod-N hashing requires remapping ~all keys on any topology change (catastrophic for a live system). Consistent hashing makes shard additions/removals practical without a full data migration. Used in: Redis Cluster, Cassandra, DynamoDB, Couchbase." },
      { text: "How does Postgres table partitioning differ from manual application-level partitioning?", type: "inline", mini_answer: "Postgres declarative partitioning: define a partition key, create child tables per range/list/hash, DB routes automatically, constraint exclusion prunes scans, indexes can be local or global. Application-level: app picks the table (orders_2026_01, orders_2026_02) based on routing logic — full control but no automatic pruning, no unified view, migrations run per table. Postgres native partitioning is always preferable — same SQL interface, automatic routing, partition pruning built-in." },
      { text: "What is a hot partition and how do you prevent it?", type: "linked", links_to: "2.3.02", mini_answer: "A hot partition receives disproportionate traffic — all writes or reads concentrate on one shard/partition while others are idle. Causes: poor partition key choice (all today's events in date partition), viral data (celebrity user in user_id shard), sequential keys in hash partitioning. Prevention: high-cardinality partition keys, add random bucket suffix (user_id % 10 as sub-key), time-bucket + entity key combos. Monitor: per-partition throughput and latency metrics, not just averages." }
    ],
    related: ["2.1.04", "2.8.02", "2.8.03", "2.3.02"],
    has_diagram: true,
    diagram: `   PARTITIONING vs SHARDING

   PARTITIONING (one instance, multiple sub-tables)
   ┌─────────────────────────────────────┐
   │           Postgres Instance         │
   │  orders_2025_q1 │ orders_2025_q2   │
   │  orders_2025_q3 │ orders_2025_q4   │
   │  Query: WHERE created_at > 2025-10  │
   │  → only scans q4 (partition pruning)│
   └─────────────────────────────────────┘

   SHARDING (multiple instances)
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  Shard 1     │  │  Shard 2     │  │  Shard 3     │
   │  users 0-33% │  │  users 33-66%│  │  users 66-99%│
   │  own replica │  │  own replica │  │  own replica │
   └──────────────┘  └──────────────┘  └──────────────┘
   Cross-shard query → scatter to all 3, merge results`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["partitioning", "sharding", "horizontal-scaling", "partition-pruning", "database-scaling"]
  },

  {
    id: "2.8.02",
    section: 2,
    subsection: "2.8",
    level: "intermediate",
    question: "What are the sharding strategies — range, hash, and directory — and when do you use each?",
    quick_answer: "→ Range sharding: contiguous key ranges per shard — simple, enables range queries, hot shard risk\n→ Hash sharding: hash(key) % N — uniform distribution, no range queries, resharding is disruptive\n→ Directory (lookup) sharding: explicit mapping table — maximum flexibility, lookup table is a bottleneck\n→ Geo sharding: data partitioned by region — for data residency and latency\n→ Default: hash for write distribution; range for time-series; directory for complex routing",
    detailed_answer: "The sharding strategy determines how data is distributed and what queries are efficient.\n\nRange sharding: each shard owns a contiguous range of the shard key. Shard 1: user_id 1–1,000,000. Shard 2: user_id 1,000,001–2,000,000. Benefits: range queries (fetch all users between ID 5000 and 6000) hit one shard. Easy to reason about — you can predict which shard holds any key. Drawbacks: uneven distribution if keys are not uniformly distributed (new users always land on the latest shard — a write hotspot). Cassandra uses range sharding with consistent hashing to virtualise ranges.\n\nHash sharding: apply a hash function to the shard key, mod by the number of shards. shard = hash(user_id) % 4. Benefits: mathematically uniform distribution — each shard receives roughly equal writes and data volume. Drawbacks: range queries require scatter-gather (keys with adjacent values land on random shards). Resharding (changing N) requires remapping and migrating roughly all data — catastrophic without consistent hashing. DynamoDB uses consistent hashing internally.\n\nDirectory (lookup) sharding: a central mapping table records which shard holds each key (or key range). The application consults the directory before routing. Benefits: maximum flexibility — move specific tenants or users to specific shards independently, handles hot accounts (move a large customer to a dedicated shard). Drawbacks: the directory table is a bottleneck and single point of failure; must be cached aggressively. Used by large-scale SaaS systems for tenant-level routing.\n\nGeo sharding: partition by geography — EU users in EU shards, US users in US shards. Driven by data residency requirements (GDPR) or latency. Drawbacks: users who travel or have relationships across regions create cross-shard queries.\n\nHybrid approach: many production systems combine strategies — consistent hash for primary distribution, then range partitioning within each shard for time-series data.",
    key_points: [
      "Range: predictable routing, range queries in one shard — hot shard risk on monotonic keys",
      "Hash: uniform distribution — range queries require scatter-gather, resharding is disruptive",
      "Directory: flexible per-key routing — directory is a bottleneck, must be cached",
      "Geo: data residency and latency — cross-region requests create cross-shard queries",
      "Consistent hashing mitigates hash resharding cost — only adjacent keys remapped",
      "Shard key choice is permanent — wrong choice requires full data migration to fix"
    ],
    hint: "You're sharding a multi-tenant SaaS by tenant_id. Tenant A generates 60% of your writes. Hash sharding puts them on a random shard — does that help? What strategy would you use instead?",
    common_trap: "Choosing a shard key that seems uniform today but becomes skewed as the product grows. User IDs created sequentially land all new users on the same range shard. Timestamps as shard keys put all current writes on one shard. Always model the write distribution pattern over time, not just at launch.",
    follow_up_questions: [
      { text: "What is a compound shard key and when do you use it?", type: "inline", mini_answer: "A compound shard key combines two fields — e.g., (tenant_id, entity_id) or (region, user_id). Useful when: a single-field key creates hot shards (all tenant A traffic on one shard), or when you want to co-locate related data (all of tenant A's records on the same shard for efficient tenant-scoped queries). Cassandra's composite partition key is the canonical example: (tenant_id, bucket) to cap partition size while keeping tenant data co-located." },
      { text: "How does resharding work in practice and why is it so painful?", type: "linked", links_to: "2.8.03", mini_answer: "Resharding = changing the number of shards or shard boundaries. For hash sharding: nearly every key maps to a new shard. Process: (1) Spin up new shards. (2) Migrate data in batches with dual-write (write to old and new shard during migration). (3) Cut over reads. (4) Remove old shards. Duration: days to weeks for large datasets. Risk: data inconsistency if dual-write fails, performance degradation during migration. This is why getting the shard key right upfront is critical." },
      { text: "What is a logical shard vs a physical shard?", type: "inline", mini_answer: "Logical shards (virtual shards): create many more shards than physical nodes — e.g., 1024 logical shards across 4 physical nodes (256 per node). When adding a physical node, migrate logical shards without redefining the sharding logic. MongoDB uses this (chunks), Cassandra uses virtual nodes (vnodes). Benefit: resharding is moving logical shards between physical nodes, not rehashing all data. Much less disruptive than physical resharding." }
    ],
    related: ["2.8.01", "2.8.03", "2.3.02", "2.4.03"],
    has_diagram: true,
    diagram: `   SHARDING STRATEGIES

   RANGE                    HASH                    DIRECTORY
   ─────────────────────    ──────────────────────  ──────────────────
   Shard 1: id 0–999        hash(id) % 3 = shard    lookup table:
   Shard 2: id 1000–1999    id=123 → shard 0        id=123 → shard 2
   Shard 3: id 2000–2999    id=456 → shard 1        id=456 → shard 0
                            id=789 → shard 2        id=789 → shard 1

   ✓ Range queries          ✓ Uniform distribution  ✓ Move any key
   ✗ Hot on new keys        ✗ No range queries      ✗ Lookup bottleneck`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["sharding-strategies", "range-sharding", "hash-sharding", "directory-sharding", "consistent-hashing"]
  },

  {
    id: "2.8.03",
    section: 2,
    subsection: "2.8",
    level: "advanced",
    question: "What are the operational challenges of a sharded system — cross-shard queries, resharding, and hotspots?",
    quick_answer: "→ Cross-shard queries: scatter to all shards, merge in app or middleware — O(N shards) cost\n→ Hotspots: one shard saturated while others idle — fix with better shard key or virtual shards\n→ Resharding: changing shard count requires migrating data — weeks of dual-write, high risk\n→ Transactions: no cross-shard ACID without 2PC — design to avoid or accept eventual consistency\n→ Joins: cross-shard joins must be done in application layer — expensive and complex",
    detailed_answer: "Sharding solves scale problems but introduces operational complexity that compounds over time. Understanding the failure modes before sharding is essential.\n\nCross-shard queries (scatter-gather): a query without a shard key filter must execute on all shards. SELECT COUNT(*) FROM orders WHERE status = 'pending' fans out to every shard, each executes, results are merged in the app or middleware layer. Cost is O(N shards). Mitigation: denormalise counts into a central aggregation store (Redis or a summary table), design queries to always include the shard key, or accept the scatter-gather cost for infrequent admin queries.\n\nCross-shard joins: JOIN between two tables sharded on different keys requires loading all relevant rows from both shards into application memory and joining there — an in-memory hash join. This is expensive and limits query flexibility. Common solution: denormalise the joined data onto the primary entity (co-locate what you always join), or use a separate analytical store (data warehouse) for queries requiring joins across shards.\n\nCross-shard transactions: ACID transactions spanning multiple shards require two-phase commit (2PC). 2PC is slow (two network round trips for every write), and the coordinator becomes a single point of failure. Most sharded systems avoid cross-shard transactions by designing aggregates to fit within a single shard, or accepting eventual consistency for cross-shard operations.\n\nHotspots: a shard receiving disproportionate traffic saturates while others sit idle. Causes: bad shard key (viral user, sequential ID range), uneven data growth. Solutions: virtual/logical shards (split the hot logical shard and move it), re-key the hot entity (move the large tenant to a dedicated shard via directory routing), or add read replicas to the hot shard.\n\nResharding: adding shards to scale requires migrating data. For hash sharding, almost all keys need remapping. Process: create new shards, dual-write during migration, migrate data in batches, verify consistency, cut over, clean up old shards. Duration scales with data volume — weeks for large systems. Risk of data loss or inconsistency is highest during the cutover window.",
    key_points: [
      "Scatter-gather: cross-shard queries hit all shards — O(N) cost, avoid for hot paths",
      "Cross-shard joins must be done in application memory — expensive, avoid by co-location",
      "Cross-shard transactions need 2PC — slow, avoid by designing within single-shard boundaries",
      "Hotspots: split hot logical shard, use directory routing for oversized tenants",
      "Resharding is weeks of dual-write risk — virtual shards make this less disruptive",
      "Operational complexity multiplies with shard count — fewer shards is always preferable"
    ],
    hint: "You have 8 shards. Product management wants a dashboard showing total active users across all shards, updated every minute. Walk through the cost if you query all shards live vs pre-aggregate.",
    common_trap: "Assuming that adding more shards linearly improves performance. Cross-shard query cost grows linearly with shard count. A system with 64 shards running scatter-gather queries is slower than 8 shards — you've traded write throughput for read performance. Design the query patterns before choosing shard count.",
    follow_up_questions: [
      { text: "What is Vitess and how does it simplify MySQL sharding?", type: "inline", mini_answer: "Vitess is a database clustering system for MySQL (used by YouTube, Slack). It provides: a query router (VTGate) that transparently routes queries to the right shard, connection pooling across shards, online schema changes (gh-ost integrated), and resharding tools. Applications connect to Vitess via a standard MySQL protocol — no shard-aware code needed. It abstracts the scatter-gather and shard topology management. Trade-off: significant operational overhead to run the Vitess control plane." },
      { text: "How does Citus extend Postgres for horizontal sharding?", type: "inline", mini_answer: "Citus (now part of Postgres as an extension, also Azure Cosmos DB for PostgreSQL) shards tables across worker nodes using a distribution column. The coordinator node rewrites queries and fans them out to workers. Co-located tables (sharded on the same key) can be joined efficiently without scatter-gather. Reference tables are replicated to all workers. Supports standard SQL — no app-level shard routing. Best for multi-tenant SaaS with tenant_id as distribution column. Limitation: cross-tenant joins still scatter-gather." },
      { text: "How do you handle database migrations on a sharded system?", type: "inline", mini_answer: "Run migrations on each shard independently — never in one transaction across shards (no global DDL lock). Tools: orchestrate with a migration runner that iterates shards, tracks per-shard migration state in a central registry, and handles failures per shard without blocking others. Use backward-compatible migrations (expand-contract, see 2.5.04) — old and new application code must work on both old and new schema simultaneously during rolling deploys across shards." }
    ],
    related: ["2.8.01", "2.8.02", "2.6.01", "2.6.04"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["sharding", "cross-shard-queries", "resharding", "hotspot", "scatter-gather", "distributed-database"]
  },

  {
    id: "2.8.04",
    section: 2,
    subsection: "2.8",
    level: "advanced",
    question: "How do you choose a shard key, and what makes a shard key choice effectively permanent?",
    quick_answer: "→ Good shard key: high cardinality, uniform distribution, present in all hot queries\n→ Avoid: monotonic keys (timestamps, auto-increment IDs) — all writes go to one shard\n→ Avoid: low cardinality (status, boolean) — too few values for even distribution\n→ Once data is live, changing the shard key requires a full data migration — treat it as permanent\n→ Co-locate data you always access together — shard key defines access locality",
    detailed_answer: "The shard key is the single most consequential database design decision in a sharded system. Get it wrong and you face either a full data migration or permanent performance degradation.\n\nProperties of a good shard key:\n- High cardinality: enough distinct values to distribute data across all shards evenly. Low cardinality (10 possible values across 20 shards) forces multiple shards to sit empty.\n- Uniform write distribution: writes spread evenly across shards over time. Monotonic keys (auto-increment IDs, timestamps) concentrate new writes on the 'max' shard constantly.\n- Present in all hot queries: the shard key must appear in every frequent query's WHERE clause. If queries don't include the shard key, every query becomes scatter-gather.\n- Data locality: data that's frequently accessed together should share the same shard key value — user_id is good if you always query by user; order_id is bad if you need both orders and their line items (unless both are sharded on the same key).\n\nWhy shard key choice is effectively permanent: changing the shard key requires reading every row, hashing it to the new shard, migrating it, and ensuring zero data loss. For a 10TB system, this is weeks of background migration with dual-write complexity. During the migration, both old and new routing logic must coexist. Any bug in the migration risks data loss. In practice, most teams treat shard key selection as a one-way door.\n\nCommon patterns: user_id for user-centric data (co-locates all of a user's records on one shard), tenant_id for multi-tenant SaaS (all tenant data on one shard — efficient tenant queries, but large tenants create hot shards), composite key (tenant_id, entity_id) to balance distribution while maintaining co-location.\n\nFor time-series data: use entity_id as the primary shard key (not timestamp) — avoid the write hotspot on the current-time shard. Use range partitioning within each shard for time-based pruning.",
    key_points: [
      "High cardinality + uniform distribution + present in all hot queries = good shard key",
      "Monotonic keys (timestamp, auto-increment) create write hotspots — never use as shard key alone",
      "Low cardinality keys can't distribute across many shards — avoid status, boolean, enum",
      "Data locality: shard key defines what's co-located — plan for what you JOIN and access together",
      "Changing shard key = full data migration — treat the choice as irreversible",
      "Composite keys: (tenant_id, entity_id) balances distribution with co-location"
    ],
    hint: "You're sharding an e-commerce platform. Three candidates: user_id, order_id, created_at. Walk through the distribution, query routing, and locality implications of each. Which do you choose and why?",
    common_trap: "Choosing user_id without accounting for 'whale' users — a single tenant with 100× average data volume creates a permanent hot shard. In B2B SaaS, tenant-level imbalance is the rule, not the exception. Always model the distribution at the tail, not the average.",
    follow_up_questions: [
      { text: "What is a celebrity or whale problem in sharding and how do you solve it?", type: "inline", mini_answer: "A whale: one shard key value (one user, one tenant) generates disproportionate load — say 10% of a shard's total traffic. Solutions: (1) Directory sharding — move the whale to a dedicated shard with extra resources. (2) Sub-shard the whale — split their data with a compound key (tenant_id + sub_bucket). (3) Cache their hottest data aggressively — keep the most-read records in Redis to absorb reads without hitting the shard. (4) Read replicas on the hot shard — scale reads horizontally." },
      { text: "How do global tables in DynamoDB handle the shard key problem?", type: "inline", mini_answer: "DynamoDB manages sharding internally — you don't choose a shard count or shard boundaries. Your partition key IS the conceptual shard key. DynamoDB automatically distributes partition key values across internal partitions and splits hot partitions. The constraint remains: each partition key gets ~1000 WCU and ~3000 RCU. Hot keys exhaust one partition's capacity regardless of overall table provisioning. Adaptive capacity helps short-term bursts but doesn't fix structural hot keys." },
      { text: "What is a functional partition and how is it different from horizontal sharding?", type: "inline", mini_answer: "Functional partitioning splits data by domain/service rather than by row range or hash. User data goes to the user DB, order data to the order DB, inventory to the inventory DB. It's vertical splitting by concern, not horizontal splitting by key. Benefits: each DB is smaller, independently deployable, and optimised for its workload. This is the microservices database pattern (database-per-service). It doesn't help when a single domain's table is itself too large — horizontal sharding handles that." }
    ],
    related: ["2.8.01", "2.8.02", "2.8.03", "2.3.02"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["shard-key", "sharding", "hot-shard", "data-distribution", "cardinality", "co-location"]
  },

];
