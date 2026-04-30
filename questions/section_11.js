// questions/section_11.js
// Section 11: Real-World Scenarios
// Subsections: 11.1 Design from Scratch        (8q) IDs: 11.1.01-11.1.08
//              11.2 Scale an Existing System
//              11.3 Migrate Legacy Systems
//              11.4 Diagnose Production Incidents
// Target: ~31 questions

const SECTION_11_QUESTIONS = [

  // ─────────────────────────────────────────────
  // 11.1 Design from Scratch (8 questions)
  // ─────────────────────────────────────────────

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
        type: "inline",
        mini_answer: "Store aliases in the same table with a unique constraint on short_code. On insert, check if the requested alias exists — if so, return a conflict error. Use a reserved words list (api, admin, login, health) blocked at the application layer. Rate-limit alias creation per user to prevent enumeration attacks."
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
    tags: ["system-design","url-shortener","redis","dynamodb","CDN","scale","base62"]
  },

  {
    id: "11.1.02",
    section: 11,
    subsection: "11.1",
    level: "advanced",
    question: "Design a real-time ride-sharing platform like Uber that matches riders and drivers, handles dynamic pricing, and scales to 10 million rides per day across 50 cities.",
    quick_answer: "→ Location ingestion: drivers push GPS every 4s → Kafka → Redis GEOSEARCH index (TTL 30s)\n→ Matching: rider request → geo query nearby drivers → rank by ETA → offer to closest\n→ Trip state machine: REQUESTED→MATCHED→PICKUP→IN_PROGRESS→COMPLETE via Kafka events\n→ Surge: demand/supply ratio per H3 hex cell → real-time multiplier, refreshed every 30s\n→ Analytics and notifications always async — never on the match critical path",
    detailed_answer: "Capacity estimation:\n→ 10M rides/day = ~115 rides/sec average, ~1,000/sec peak\n→ 500K active drivers at peak → 500K × (1 GPS/4s) = 125K location writes/sec\n→ 50 cities — partition by city (no cross-city joins needed)\n\nLocation tracking:\nDrivers send GPS every 4 seconds. Kafka absorbs the write burst. Consumer writes to Redis GEOSEARCH (sorted set with geohash, TTL 30s). Drivers who lose signal auto-expire. City-scoped Redis keys prevent cross-city pollution.\n\nMatching:\nRider request hits matching service. Redis GEOSEARCH query for drivers within 1km radius. Filter by availability, vehicle type. Rank remaining by ETA (road graph, not Euclidean distance). Offer to top candidate — 10s timeout. On timeout, expand radius to 2km, repeat. After 3 cascades without acceptance: DRIVER_NOT_FOUND.\n\nTrip state machine:\nPersisted in Postgres. Each state transition fires a Kafka event consumed by: notification service (push to rider/driver), billing service (track start/end), analytics. No direct service-to-service calls — all coordination via events.\n\nSurge pricing:\nMap divided into H3 hexagonal cells. Every 30s: count open requests vs available drivers per cell. Multiplier = max(1.0, demand/supply × k) with ceiling. Shown to rider before booking — committed price, not estimated.\n\nSections covered: 1.3, 1.6, 2.4, 3.4, 4.3",
    key_points: [
      "Redis GEOSEARCH for driver proximity — sub-5ms spatial queries at 500K drivers",
      "TTL 30s on driver positions — offline drivers auto-expire without explicit cleanup",
      "H3 hexagonal cells for surge: uniform area distribution, no boundary distortion",
      "125K location writes/sec — Kafka essential for buffering the GPS burst",
      "Trip state machine via Kafka events — loose coupling, replayable, auditable",
      "Cascade radius expansion for matching — balances wait time vs trip distance"
    ],
    hint: "How do you model the spatial query? What data structure gives you 'find all drivers within 2km' in under 10ms at 500K concurrent drivers? And how do you handle drivers who go offline without explicit logout?",
    common_trap: "Storing driver GPS positions in a relational database. At 125K writes/sec with geospatial queries on every match request, a Postgres instance will collapse. Redis GEOSEARCH handles O(N+log M) geo queries with built-in TTL at this scale — it's the right tool for ephemeral spatial data.",
    follow_up_questions: [
      {
        text: "How would you design the driver earnings ledger to guarantee accuracy without slowing down trip completion?",
        type: "inline",
        mini_answer: "Compute earnings asynchronously. Trip COMPLETE event → Kafka → earnings worker: apply fare formula, bonuses, platform commission → append to earnings ledger (append-only, never UPDATE). Driver balance is a materialised view: SUM over ledger entries. Idempotent processing — replay is safe. Reconcile periodically against payment provider records."
      },
      {
        text: "How would you design the WebSocket infrastructure for real-time driver and rider updates?",
        type: "linked",
        links_to: "1.6.01",
        mini_answer: "Use a dedicated connection gateway service for WebSocket management. Route driver and rider connections to the same gateway shard using city+trip_id as partition key — both sides of a trip land on the same node. Trip state changes publish to Kafka; gateway subscribes and pushes to connected clients. Horizontal scale: add gateway nodes, re-hash connections. Separate gateway from business logic — stateless business services, stateful gateway only."
      }
    ],
    related: ["1.6.01", "2.4.01", "4.3.01", "3.4.01"],
    has_diagram: true,
    diagram: `RIDE-SHARING — MATCH CRITICAL PATH

Driver App                    Rider App
  │ GPS every 4s               │ Request ride
  ▼                            ▼
Kafka (location-events)    API Gateway
  │                            │
  ▼                            ▼
Location Consumer          Matching Service
  │                            │
  └─► Redis GEOSEARCH ◄────────┘
       (city:drivers geo set)   │ 1. geo query nearby
       TTL 30s per driver       │ 2. rank by ETA
                                │ 3. offer to closest
                                ▼
                           Postgres (trip record)
                                │ state = MATCHED
                                ▼
                           Kafka (trip-events)
                          /        \
              Notification       Analytics
              Service            (Flink → ClickHouse)`,
    has_code: false,
    tags: ["system-design","geospatial","redis","kafka","real-time","surge-pricing","ride-sharing","state-machine"]
  },

  {
    id: "11.1.03",
    section: 11,
    subsection: "11.1",
    level: "advanced",
    question: "Design a team messaging platform like Slack that supports 1 million concurrent users, real-time message delivery, persistent history, and full-text search across 5 years of messages.",
    quick_answer: "→ Real-time: persistent WebSocket per user via connection gateway; messages fan-out to channel members\n→ Storage split: recent messages in Cassandra (channel+time PK); full-text search in Elasticsearch\n→ Presence: heartbeat every 10s → Redis TTL 30s; TTL expiry = offline, no explicit event needed\n→ Fan-out: small channels (<500) push to each member; large channels clients pull on reconnect\n→ Search indexed async via Kafka — write path never blocked by Elasticsearch indexing",
    detailed_answer: "Capacity estimation:\n→ 1M concurrent users, avg 5 active channels = 5M live subscriptions\n→ 50M messages/day = ~580 writes/sec\n→ Reads dominate: scroll history, fetch unread counts, search\n\nWebSocket gateway:\nEach user holds one persistent WebSocket to a gateway node. Gateway routes by user_id via consistent hash. On horizontal scale, new connections re-hash. Message delivery: channel event → fan-out service → look up gateway node per online member → push to WebSocket.\n\nFan-out strategy:\n- Small channels (<500 members): push to every online member's WebSocket immediately.\n- Large channels (>500): don't fan out — too expensive per message. Store message; online members receive a lightweight nudge; clients pull the full message on receipt.\n- DMs: always push (only 2 members).\n\nMessage storage (Cassandra):\nPartition key: (channel_id, time_bucket) — bucket = year+month. Clustering key: message_id DESC. Enables efficient time-range scans without full-table reads. Cassandra chosen for: high write throughput, time-series access pattern, multi-region replication.\n\nSearch (Elasticsearch):\nMessages published to Kafka on write. Async Elasticsearch indexer consumes and indexes body + metadata. Search path: query → Elasticsearch → return message IDs → fetch full messages from Cassandra. Write path never blocked by indexing latency.\n\nPresence:\nClients heartbeat every 10s. Redis key user:{id}:online with TTL 30s. No explicit offline event required — TTL expiry means offline. On status change: publish to Kafka → presence fanout service → notify relevant subscribers.\n\nSections covered: 1.3, 1.6, 2.3, 3.1, 4.3",
    key_points: [
      "Cassandra for messages: write throughput + time-series partition key fits the access pattern perfectly",
      "Fan-out split at 500 members: push for small; nudge+pull for large — avoids O(members) write cost",
      "Search async via Kafka: write latency unaffected by Elasticsearch indexing",
      "Presence via Redis TTL: self-healing — no explicit offline event, no cleanup job needed",
      "WebSocket gateway decoupled from message storage: each scales independently",
      "Time bucket in Cassandra partition key prevents hot partitions on busy channels"
    ],
    hint: "How do you decide between push and pull for message delivery? What's the inflection point where pushing to every member becomes too expensive? And what does 1M concurrent WebSocket connections imply for gateway infrastructure sizing?",
    common_trap: "Pushing every message to every member of every channel. For a 10,000-member announcement channel, one message = 10,000 WebSocket writes. At 580 messages/sec baseline, a single viral message generates millions of writes. Fan-out must be bifurcated by channel size.",
    follow_up_questions: [
      {
        text: "How do you ensure a message is not lost if the recipient is offline when it arrives?",
        type: "inline",
        mini_answer: "Store all messages in Cassandra regardless of recipient online status. On WebSocket reconnect: client sends last_seen_message_id per channel. Server queries Cassandra for all messages after that ID. Client replays missed messages in order. For mobile: on fan-out failure, publish to a missed-delivery queue → push notification worker sends FCM/APNs nudge to prompt the user to open the app."
      },
      {
        text: "How does your NoSQL database choice affect the message storage and retrieval design?",
        type: "linked",
        links_to: "2.3.01",
        mini_answer: "Cassandra's partition key (channel_id + time_bucket) maps directly to the dominant access pattern: 'give me all messages in channel X from T1 to T2'. Wide rows within the partition avoid cross-node scans. Write throughput scales by adding nodes. Trade-off: no ad-hoc queries — every access pattern requires a pre-planned table. That constraint is acceptable here because the access patterns are stable and known at design time."
      }
    ],
    related: ["1.6.01", "2.3.01", "4.3.01", "3.1.01"],
    has_diagram: false,
    has_code: false,
    tags: ["system-design","messaging","websocket","cassandra","elasticsearch","fan-out","presence","slack"]
  },

  {
    id: "11.1.04",
    section: 11,
    subsection: "11.1",
    level: "advanced",
    question: "Design a video streaming platform like YouTube that stores 500 hours of video uploaded per minute, serves 500K concurrent viewers, and adapts quality to each viewer's bandwidth.",
    quick_answer: "→ Upload: chunked multipart → S3 raw bucket → SQS event triggers transcoding workers (FFmpeg per resolution)\n→ Transcode: 360p/720p/1080p/4K variants + HLS manifests written to S3 delivery bucket\n→ Delivery: CloudFront CDN serves video segments — 95%+ of view requests never reach origin\n→ ABR: HLS player selects resolution segment based on measured download throughput\n→ Metadata in Postgres + Redis cache; view counts via Redis counter flushed async to Postgres",
    detailed_answer: "Upload pipeline:\nClient uploads raw video in multipart chunks (5MB each) directly to S3 via presigned URLs — no proxy, no server bandwidth cost. On complete upload, S3 event → SQS → transcoding workers. Workers run FFmpeg: generate 360p/720p/1080p/4K segments, produce HLS (.m3u8) and DASH manifests, extract thumbnails every 10s. All output written to delivery S3 bucket. Transcoding is horizontally scalable — spin up EC2 Spot workers on demand, tear down when queue drains.\n\nAdaptive Bitrate (ABR):\nHLS playlist (.m3u8) lists a URL for each resolution variant. Client player measures download throughput of recent segments. If throughput drops below threshold for current resolution: switch down. If throughput exceeds headroom: switch up. Switches are seamless — segments are independent. No server state required after manifest delivery.\n\nDelivery at scale:\nCDN (CloudFront, 200+ edge locations). Video segments are immutable — cache forever (TTL 30 days). Popular videos serve millions of views from edge with zero origin load. Manifests have TTL 60s (allows playlist updates without stale content). Cache hit rate target: 95%+. At 500K concurrent viewers × 2Mbps = 1Tbps egress — CDN is the only viable delivery mechanism.\n\nStorage:\n- Raw uploads: S3 Standard (delete after transcode completes — cost saving)\n- Transcoded segments: S3 Standard → S3-IA after 30 days → Glacier after 1 year\n- Metadata: Postgres (video, channel, tags, view_count)\n- View counts: Redis INCR → async flush to Postgres every 5 min (avoid write amplification)\n- Search: Elasticsearch (title, description, tags)\n\nSections covered: 3.1, 3.4, 2.4, 5.4, 8.1",
    key_points: [
      "Presigned S3 upload URLs: client uploads direct to S3 — no application server bandwidth cost",
      "Transcoding workers on Spot instances: elastic, cost-effective for CPU-intensive burst workload",
      "ABR: client-driven resolution selection — no server state, seamless quality switches",
      "CDN mandatory: 1Tbps peak egress is impossible without edge caching",
      "Redis counters for view counts: avoid write amplification (millions of reads/writes to Postgres)",
      "Immutable segments enable 30-day CDN TTLs — segments never need invalidation mid-stream"
    ],
    hint: "500 hours of video per minute means continuous transcoding load with bursty peaks. How do you architect the transcoding workers to handle burst upload events without over-provisioning? What's the mechanism that decouples upload completion from transcoding start?",
    common_trap: "Streaming video through your own application servers. At 500K concurrent viewers at 2Mbps each, that's 1Tbps of egress — no fleet of servers handles that without a CDN. All video delivery must route through CDN edge nodes. Origin only handles cache misses (cold videos) and upload ingest.",
    follow_up_questions: [
      {
        text: "How would you architect the recommendation pipeline for 'up next' video suggestions?",
        type: "linked",
        links_to: "8.1.01",
        mini_answer: "Stream view events (video_id, user_id, watch_pct, ts) to Kafka. Nightly Spark job builds user-video interaction matrix and trains collaborative filtering model (ALS). Precompute recommendations per user → write to Redis (user:{id}:recs, TTL 24h). Real-time trending: Flink 1h window aggregates view counts → separate trending endpoint. Serve: blend offline recs (80%) with real-time trending (20%). Cold-start users: fall back to global trending."
      },
      {
        text: "How do you manage storage costs as the video library grows to petabytes?",
        type: "linked",
        links_to: "5.4.01",
        mini_answer: "Tiered strategy: S3 Standard for hot content (watched in last 30 days); S3-IA for 30–365 days; Glacier for >1 year. Use S3 Intelligent-Tiering to automate movement. Drop 4K variant for videos with <1,000 views — re-transcode on demand if a video goes viral. Delete raw uploads immediately after transcode. Store only 720p for unmonetised user-generated content."
      }
    ],
    related: ["5.4.01", "2.4.01", "3.1.01", "8.1.01"],
    has_diagram: true,
    diagram: `VIDEO STREAMING — UPLOAD AND DELIVERY

UPLOAD PATH                         DELIVERY PATH

Client                              Client (viewer)
  │ multipart chunks                  │ HLS player
  │ (presigned URL)                   ▼
  ▼                              CloudFront CDN ──(hit)──► video segments
S3 Raw Bucket                         │ (miss)             sub-50ms
  │ S3 event → SQS                    ▼
  ▼                              S3 Delivery Bucket
Transcoding Workers                (immutable segments,
  │ FFmpeg per resolution             HLS manifests)
  │ → 360p / 720p / 1080p / 4K
  │ → HLS .m3u8 manifest        ABR: client measures bandwidth
  └──────────────────────────►  → picks resolution per segment
                                → no server involvement`,
    has_code: false,
    tags: ["system-design","video-streaming","CDN","HLS","adaptive-bitrate","transcoding","S3","youtube"]
  },

  {
    id: "11.1.05",
    section: 11,
    subsection: "11.1",
    level: "advanced",
    question: "Design a global e-commerce platform that handles 1 million concurrent users, real-time inventory management, and 50,000 orders per minute at peak on sale day.",
    quick_answer: "→ Decompose by domain: catalog, cart, inventory, orders, payments — each owns its database\n→ Inventory: optimistic locking (version column) in Postgres prevents oversell without row locks\n→ Cart: Redis with 30-day TTL — intentionally ephemeral, no durability required\n→ Orders: saga pattern — reserve inventory → charge payment → confirm; compensating on failure\n→ Catalog reads: CDN-cached, eventually consistent via CDC; only writes touch the primary",
    detailed_answer: "Domain decomposition:\nSplit by bounded context. Each service owns its database — no shared schema, no cross-service joins.\n- Catalog Service: product listings, pricing → Postgres primary + read replicas + Elasticsearch for search\n- Cart Service: shopping cart → Redis (TTL 30 days, session-scoped, ephemeral by design)\n- Inventory Service: stock levels, reservations → Postgres (ACID, strong consistency required)\n- Order Service: order lifecycle → Postgres\n- Payment Service: charges and refunds → delegates to external provider (Stripe/Adyen)\n\nInventory management (the hard part):\nNaive approach: SELECT stock WHERE product_id = X; if stock > 0: UPDATE stock = stock - 1. Race condition: two concurrent reads both see stock=1, both pass the check, both write → oversell.\n\nSolution — optimistic locking: Each inventory row has a version column.\nUPDATE SET stock = stock-1, version = version+1 WHERE product_id = X AND version = {expected} AND stock > 0\nIf rowCount = 0: conflict detected → retry. Under extreme contention (flash sale): use a reservation table instead — INSERT INTO reservations (product_id, cart_id, expires_at). Unclaimed reservations expire automatically. Permanent stock decrement only on order confirm.\n\nOrder saga:\nPhase 1: Reserve inventory (Inventory Service)\nPhase 2: Charge payment (Payment Service)\nPhase 3: Confirm order, decrement permanent stock\nOn payment failure → compensating transaction releases inventory reservation.\nOrchestrated saga: Order Service drives the sequence, persists saga state.\n\nCatalog at scale:\nCatalog is 99:1 read/write. Write to Postgres primary. Debezium CDC propagates changes to Elasticsearch (search) and to CDN invalidation queue. Product pages cached at CDN edge — cache miss rate <1% for popular catalog.\n\nSections covered: 1.2, 2.2, 4.1, 4.5, 7.1",
    key_points: [
      "Optimistic locking with version column: prevents oversell without holding row locks that block reads",
      "Reservation table pattern: decouples browse-time holds from final purchase commits",
      "Saga for cross-service transactions: no distributed locks, compensating on payment failure",
      "Cart in Redis: intentionally ephemeral — lost cart data is recoverable; durability cost not justified",
      "CDC (Debezium) for catalog sync: Postgres is source of truth, Elasticsearch updated async",
      "Domain decomposition: each service owns its DB — eliminates distributed query complexity"
    ],
    hint: "How do you prevent two users from buying the last item simultaneously? What's the difference between a SELECT-then-UPDATE approach and optimistic locking under high contention — and why does it matter at 50K orders/min when every millisecond of lock time multiplies?",
    common_trap: "Using SELECT then UPDATE for inventory checks. This creates a race condition — both reads complete before either write commits, causing oversell. Use atomic UPDATE with WHERE version = N (optimistic locking) or an INSERT-based reservation table. Never hold a row lock between read and write.",
    follow_up_questions: [
      {
        text: "How would you keep checkout fast during a flash sale where 50,000 users hit the checkout button simultaneously?",
        type: "inline",
        mini_answer: "Queue the excess. Accept all checkout requests immediately, return 'Order queued, position N'. Process from a FIFO queue at sustainable rate (e.g., 5K/sec). First N customers whose reservation succeeds proceed to payment. Others get 'out of stock' notification. Prevents thundering herd on inventory DB. Users tolerate a queue if shown real-time position. Pre-warm Redis and DB connection pools before sale starts."
      },
      {
        text: "How do you design authentication and session management for 1M concurrent users?",
        type: "linked",
        links_to: "7.1.01",
        mini_answer: "Stateless JWTs for session — no server-side session store lookup on every request. Short-lived access tokens (15 min) + long-lived refresh tokens (30 days in HttpOnly cookie). CDN validates JWT claims at edge for cached content without hitting origin. For privileged operations (checkout, payment): always validate at origin. Maintain a revocation blocklist for compromised tokens — only checked on sensitive operations to keep the common path fast."
      }
    ],
    related: ["1.2.01", "4.5.01", "4.1.01", "2.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["system-design","e-commerce","inventory","saga","optimistic-locking","microservices","flash-sale","CDC"]
  },

  {
    id: "11.1.06",
    section: 11,
    subsection: "11.1",
    level: "advanced",
    question: "Design a payment processing system that handles 10,000 transactions per second, guarantees exactly-once execution, and meets PCI-DSS compliance requirements.",
    quick_answer: "→ Idempotency key on every API call — dedup table (idempotency_key PK) prevents double-charge\n→ State machine: PENDING→AUTHORISED→CAPTURED→SETTLED (or FAILED/REFUNDED) — append-only events\n→ Saga with compensation: reserve → charge → settle; on failure reverse each step\n→ PCI scope reduction: tokenise card data via vault — your system never sees raw PANs\n→ Commit Kafka offset only after provider ACK — replay-safe, no message loss",
    detailed_answer: "Idempotency (the most critical property):\nEvery payment API call includes a client-generated idempotency_key. On first request: INSERT (idempotency_key, status=PROCESSING, result=null) — unique constraint enforces at-most-once processing. Duplicate key exception = request already in-flight or completed → return cached result. This guarantees: network retry after timeout → same result. Double-click on submit → single charge. Implement at the gateway before any business logic.\n\nPayment state machine:\nPENDING → AUTHORISED (card approved by issuer) → CAPTURED (funds reserved) → SETTLED (money moved).\nFailed states: DECLINED, FAILED, REFUNDED.\nEvery transition is an INSERT into payment_events (append-only). Never UPDATE payment records. Current state = latest event for payment_id. This gives: full audit trail, event replay, idempotent processing.\n\nCard data and PCI compliance:\nNever store raw Primary Account Numbers (PANs). Use a PCI-compliant vault (Stripe, Adyen, or in-house HSM) to tokenise cards at point of entry. Your system stores token_id — useless without vault decryption. Scope reduction: only the vault is in PCI scope, not your entire infrastructure. Dramatically reduces audit surface area and cost.\n\nExactly-once execution:\nPayment processor may time out — response arrives after network retry. Detect by: always passing your idempotency_key to the processor. On retry with same key: processor returns original result. On timeout: query the payment status endpoint (GET /payments/{id}) — never re-submit a new charge. Mark SETTLED only after confirmed via processor webhook, not inline response.\n\nAt 10K TPS:\nStateless payment API — horizontal scale. Postgres for payment_events (primary ACID store). Read replicas for reporting and reconciliation. Partition by payment_id for even distribution. Async settlement: AUTHORISED → CAPTURED is synchronous; CAPTURED → SETTLED is async batch (end-of-business).\n\nSections covered: 4.2, 4.4, 4.5, 7.1, 7.2, 3.5",
    key_points: [
      "Idempotency key: first line of defence against double charges — enforced by DB unique constraint",
      "PCI scope reduction via tokenisation: vault handles card data; your system holds opaque tokens only",
      "Append-only events: state = latest event; full audit trail; never UPDATE a payment record",
      "State machine with compensation: each step reversible — AUTHORISED can be voided before CAPTURE",
      "Pass idempotency_key to processor: retries on timeout are safe end-to-end",
      "Status endpoint over re-submit: on timeout, query the GET endpoint — never re-charge"
    ],
    hint: "What happens when the HTTP call to the payment processor times out and you don't know whether the charge succeeded? How do you retry safely? What's the exact sequence of events that guarantees the customer is charged exactly once regardless of network failures?",
    common_trap: "Trusting the HTTP response alone to determine whether a payment succeeded. Network timeouts mean you receive no response even when the charge was processed. On timeout, always query the processor's status endpoint (passing the same idempotency_key) — never submit a new charge. Distinguish 'request failed' from 'payment failed'.",
    follow_up_questions: [
      {
        text: "How would you design the refund flow to be idempotent and consistent with the original charge?",
        type: "inline",
        mini_answer: "Generate a refund_idempotency_key derived from payment_id + refund_reason. Verify payment is SETTLED before issuing (can only refund settled payments). Send refund request to processor with idempotency key. On success: INSERT REFUND_INITIATED and REFUNDED events into payment_events. Track remaining_refundable_amount to prevent over-refund. On retry with same key: processor returns original result — no double refund."
      },
      {
        text: "How do token standards affect service-to-service authentication within the payment system?",
        type: "linked",
        links_to: "7.2.01",
        mini_answer: "Use short-lived JWTs (5-minute expiry) for internal service-to-service calls. Include claims: caller_service_id, allowed_operations, payment_context_id. Validate signature and expiry on every incoming call. For external-facing APIs: OAuth2 client credentials flow — clients exchange client_id/secret for a short-lived access token. Never use long-lived static API keys for payment operations — they cannot be revoked quickly enough on compromise."
      }
    ],
    related: ["4.5.01", "4.2.01", "7.1.01", "3.5.01"],
    has_diagram: true,
    diagram: `PAYMENT FLOW — EXACTLY ONCE GUARANTEE

Client
  │ POST /payments  {idempotency_key: "abc123", amount: 50.00}
  ▼
Payment API
  │
  ├─── Check idempotency table ────────────────────────────────┐
  │    INSERT (key="abc123", status=PROCESSING)                │
  │    ↑ unique constraint                                     │
  │    Duplicate key? → return cached result (no new charge)   │
  │                                                            │
  ▼                                                            │
Payment Processor (Stripe/Adyen)                               │
  │ send with same idempotency_key                             │
  │                                                            │
  ├─ TIMEOUT? → GET /payment-status (never re-submit) ────────┤
  │                                                            │
  ▼                                                            │
payment_events (append-only)                                   │
  INSERT {payment_id, event=AUTHORISED, ts, amount}            │
  INSERT {payment_id, event=CAPTURED, ts}                      │
  INSERT {payment_id, event=SETTLED, ts}                       │
  │                                                            │
  └── Update idempotency table: status=COMPLETE, result ───────┘`,
    has_code: false,
    tags: ["system-design","payments","idempotency","PCI-DSS","saga","state-machine","exactly-once","fintech"]
  },

  {
    id: "11.1.07",
    section: 11,
    subsection: "11.1",
    level: "intermediate",
    question: "Design a search autocomplete system that serves 100,000 queries per second with sub-50ms p99 latency and returns personalised suggestions alongside global trending completions.",
    quick_answer: "→ Offline: aggregate query logs → top-K queries per prefix stored in Redis sorted sets (ZSET)\n→ Online: ZREVRANGEBYSCORE on prefix key → top 5 completions in <5ms\n→ Personalise: blend global top-K (80%) with user's recent queries (20%) at query time\n→ Trending hot path: Flink 15-min window detects spikes → injects into Redis within 1h\n→ CDN caches top 10K prefix responses (covers ~70% of traffic) — Redis never sees those",
    detailed_answer: "Offline pipeline:\nAggregate last 7 days of query logs (Hadoop/Spark job). For each query string: count frequency, apply recency decay (recent queries scored higher), filter spam and adult content (blocklist + ML classifier). For each prefix of each query: ZADD prefix:{prefix} score query_string in Redis. Only store top-K=5 per prefix (prune low-score entries). Rebuild every 6 hours.\n\nOnline query path:\nGET /autocomplete?q=dist\nRedis: ZREVRANGEBYSCORE prefix:dist +inf -inf LIMIT 0 5 → [\"distributed systems\", \"distroless containers\", ...]\nResponse time: Redis sub-5ms. Total p99 <15ms including network.\n\nPersonalisation:\nFetch user's last 20 queries from Redis key user:{id}:recent (sorted by recency, TTL 7 days).\nBlend: for each candidate in global top-5, boost score by 0.2 × recency_score if found in user history.\nSorted merge of global and user-boosted candidates → return top 5.\nAdds ~2ms. Total p99 still <20ms.\n\nHandling trending queries:\nFlink job: 15-minute sliding window, counts query_string frequency. If frequency exceeds 10× trailing average: inject directly into Redis ZSET — no waiting for 6h batch rebuild. Handles viral queries within 1 hour.\n\nCDN layer:\nTop 10K most-queried prefixes account for ~70% of all queries. CDN caches autocomplete responses for these prefixes (TTL 60s). Cache invalidated when Redis scores change significantly. 70% of traffic never touches Redis.\n\nCapacity:\n100K RPS × 30% CDN miss rate = 30K Redis ops/sec. Redis handles 100K+ ops/sec on a single node. Redis Cluster if needed.\n\nSections covered: 2.4, 3.4, 1.4, 8.1",
    key_points: [
      "Redis ZSET per prefix: O(log N + K) retrieval — sub-5ms at any scale, no trie in application memory",
      "Offline batch + real-time hot path: 6h freshness for most queries; <1h for trending",
      "CDN for top prefixes: 70% traffic reduction before Redis is ever hit",
      "Personalisation at query time: blend signals without per-user trie precomputation",
      "Recency decay in scores: prevents decade-old queries outranking current topics",
      "Prune rare prefixes (count < 1000): bounds Redis memory growth as corpus scales"
    ],
    hint: "How do you store top-K suggestions per prefix efficiently at millions of unique prefixes? You can't hold a trie in application memory across stateless servers. What Redis data structure gives you sorted top-K retrieval per prefix key in a single command?",
    common_trap: "Building a shared trie in application memory. A trie for a large query corpus is gigabytes in size, must be rebuilt frequently, can't be shared across stateless API instances, and requires synchronisation. Redis sorted sets per prefix are the distributed-friendly alternative — each prefix is an independent key, no coordination needed.",
    follow_up_questions: [
      {
        text: "How would you filter out harmful or inappropriate autocomplete suggestions in real time?",
        type: "inline",
        mini_answer: "Two layers. Offline: during batch rebuild, run all queries through a blocklist (exact and fuzzy match) and an ML safety classifier. Flag and exclude before writing to Redis. Online: maintain a Redis SET of blocked terms. Filter every autocomplete response against it before returning — sub-millisecond bloom filter check. For user-reported terms: add to blocklist immediately via admin API; include in next batch rebuild. Legal takedowns: API to add term with reason code and audit log entry."
      },
      {
        text: "How does API design affect autocomplete latency at 100K RPS?",
        type: "linked",
        links_to: "1.4.01",
        mini_answer: "Client-side debounce (fire only after 200ms keystroke pause) reduces server RPS by ~5×. Use GET with query param — CDN-cacheable. Response payload minimal: return a JSON array of strings, not objects. Enable gzip: 5 strings compress to ~50 bytes. HTTP/2: multiplexes concurrent in-flight requests on one connection, critical when user types fast. Return top 5 only — UI shows 5 max, additional results wasted. Avoid auth headers on autocomplete — makes responses publicly cacheable."
      }
    ],
    related: ["2.4.01", "3.4.01", "1.4.01"],
    has_diagram: false,
    has_code: false,
    tags: ["system-design","autocomplete","redis","sorted-set","search","personalisation","CDN","low-latency"]
  },

  {
    id: "11.1.08",
    section: 11,
    subsection: "11.1",
    level: "advanced",
    question: "Design a multi-channel notification system that delivers 50 million notifications per day across push, email, and SMS with guaranteed delivery, priority tiers, and per-user preference management.",
    quick_answer: "→ Event-driven: source services publish to Kafka; notification service is a stateless consumer\n→ Priority tiers: CRITICAL (OTP, fraud) bypass all rate limits; TRANSACTIONAL normal; MARKETING throttled\n→ Channel routing: evaluate user preferences (Cassandra) + channel availability at fan-out time\n→ Delivery guarantee: commit Kafka offset only after provider ACK; retry with exponential backoff\n→ Idempotency key per notification — prevents double-send on retry at every provider",
    detailed_answer: "Architecture overview:\nNotification system is a pure consumer — it routes events, never originates them. Source services (auth, orders, marketing) publish events to Kafka. Notification service consumes, applies routing logic, and dispatches to channel providers (FCM, APNs, SendGrid, Twilio).\n\nPriority tiers (separate Kafka topics and worker pools):\n- CRITICAL: OTP, fraud alerts, account lockout. Never rate-limited. Direct dispatch, SLA <5s.\n- TRANSACTIONAL: Order confirmations, shipping updates. Normal throttle (100/sec per user). SLA <60s.\n- MARKETING: Promotions, newsletters. Heavy throttle (10/min per user), batch overnight, can skip if user opted out.\n\nChannel routing engine:\nOn each event:\n1. Look up user preferences in Cassandra (category × channel × opted_in status).\n2. Check channel availability: push token valid? email verified? phone confirmed?\n3. Apply fallback chain: push → email → SMS (user-configurable order).\n4. Enforce quiet hours: no MARKETING during 22:00–08:00 local time.\n5. Dispatch to appropriate channel worker.\n\nDelivery guarantee:\nKafka consumer: process event → dispatch to provider → await ACK. Commit Kafka offset only after ACK is received. Provider timeout → retry with exponential backoff (1s, 2s, 4s, max 3 retries). After max retries: publish to dead-letter topic for manual inspection and SLA alerting. Idempotency key = notification_id; providers deduplicate on their side.\n\nCapacity:\n50M/day = ~580/sec average. Peak 3×: ~1,750/sec. Kafka partitioned by user_id % N for ordering per user. Each channel has independent worker pool (push, email, SMS) — scale independently by channel backlog.\n\nUser preferences schema:\nCassandra row: (user_id, category, channel) → (opted_in: bool, updated_at). CRITICAL category cannot be opted out — enforced at routing layer before preference lookup.\n\nSections covered: 1.3, 4.2, 4.3, 3.2",
    key_points: [
      "Stateless consumer design: notification service only routes — trivially horizontally scalable",
      "Separate Kafka topics per priority tier: CRITICAL never delayed by MARKETING backlog",
      "Commit offset after ACK: re-process on failure without message loss, at-least-once delivery",
      "Idempotency key prevents double-send: provider-side dedup makes retries safe",
      "Fallback chain evaluated at dispatch time: handles stale push tokens, unverified channels",
      "Dead-letter topic for failures: manual review, SLA tracking, alerting separate from main flow"
    ],
    hint: "What happens to notification delivery when a user's push token is invalid — for example after they reinstalled the app? How does your routing engine detect this at runtime and fall back to another channel? And what does 'guaranteed delivery' actually mean for CRITICAL notifications when all channels fail?",
    common_trap: "Rate-limiting all notifications uniformly. An OTP for a login attempt gets throttled the same as a marketing email — the user is locked out during a high-send period. Always model priority explicitly with separate worker pools and rate-limit buckets. CRITICAL notifications must bypass all throttling unconditionally.",
    follow_up_questions: [
      {
        text: "How do you handle the user preference model when a user unsubscribes from marketing but must still receive transactional notifications?",
        type: "inline",
        mini_answer: "Model preferences at category × channel granularity. Schema: (user_id, category, channel) → opted_in. Marketing opt-out sets (user, MARKETING, all) = false. TRANSACTIONAL and CRITICAL categories remain active. CRITICAL notifications are mandatory and cannot be opted out — enforced at routing layer before preferences are even consulted. This prevents a blanket 'unsubscribe all' from blocking fraud alerts."
      },
      {
        text: "How does Kafka's messaging pattern enable fan-out to multiple notification channels?",
        type: "linked",
        links_to: "4.3.01",
        mini_answer: "Single Kafka topic per priority tier. Each channel type (push, email, SMS) is an independent consumer group — they each consume all messages but track their own offset. Adding a new channel = new consumer group, zero impact on existing ones. If the email worker falls behind, the push worker is unaffected. Dead-letter topic per tier captures failed deliveries per channel independently. Consumer group architecture is the fan-out mechanism — no application-level broadcast needed."
      }
    ],
    related: ["4.3.01", "4.2.01", "1.3.01", "3.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["system-design","notifications","kafka","push","email","sms","priority-queue","fan-out","idempotency"]
  },

  // ── 11.2 Scale an Existing System ─────────────────────────────────────

  {
    id: "11.2.01",
    section: 11,
    subsection: "11.2",
    level: "advanced",
    question: "Your monolith serves 10k requests/day normally. Black Friday is in 3 weeks and marketing predicts 200k requests/day — a 20× spike. The system currently runs on a single EC2 instance with a PostgreSQL database. Walk me through how you scale it.",
    quick_answer: "→ Measure first: profile current bottlenecks under load test before guessing\n→ Add read replicas for DB reads; add connection pooling (PgBouncer)\n→ Extract stateless app tier — horizontally scale behind a load balancer\n→ Introduce caching (Redis) to absorb read-heavy product/catalogue traffic\n→ Use feature flags to shed non-critical work under extreme load",
    detailed_answer: "Start with measurement, not assumption. Run a load test to baseline where the bottleneck is — CPU, DB connections, lock contention, or I/O — before touching anything.\n\nDatabase layer first. Add a PgBouncer connection pooler immediately — 200× traffic means 200× connection attempts, and Postgres's connection overhead kills you before CPU does. Add read replicas for all catalogue/product reads. Separate read-path queries in the application to target the replica. This alone handles 60–70% of a typical e-commerce read load.\n\nFor the application tier, containerise the monolith (if not already) and deploy multiple instances behind an ALB. Ensure the monolith is stateless — no in-process session state, no local file writes. Use Redis or a database-backed session store. With stateless horizontal scaling you can autoscale on CPU.\n\nIntroduce Redis caching for product pages, pricing, and category listings. These are read-heavy, rarely-changing, and safe to serve from cache for 60–300s. This removes 50–80% of read queries from the DB.\n\nFor checkout and payment paths, these are write-heavy and cannot be cached. Here, pre-scale aggressively — Black Friday is predictable, so schedule scale-up before the event window, not reactive autoscale which lags by 3–5 minutes under sudden spikes.\n\nUse feature flags to disable non-essential features under extreme load (recommendations, reviews, wishlists). This is load shedding — deliberately degrading UX to protect core checkout revenue.\n\nFinally, test the scaled configuration under synthetic load. A system that works at 10× may fail at 20× due to DB lock contention or connection pool exhaustion that only appears at scale.\n\nSections covered: 3.1 (scalability), 4.1 (microservice/monolith), 5.2 (EC2 compute scaling), 6.4 (deployment strategies), 2.4 (caching)",
    key_points: [
      "Load test before any change — measure the actual bottleneck, never guess",
      "PgBouncer first: connection count is the first PostgreSQL killer at scale",
      "Stateless app tier is prerequisite for horizontal scaling — purge local state",
      "Read replicas + Redis cache typically resolve 60–80% of read-path pressure",
      "Pre-scale for predictable events; autoscale lags 3–5 min and misses spike onset",
      "Feature flags enable load shedding to protect core revenue paths"
    ],
    hint: "What happens to database connections when you suddenly have 200 instances trying to connect?",
    common_trap: "Adding more app servers without fixing the database layer first — the DB becomes the bottleneck and more instances just amplify the connection storm.",
    follow_up_questions: [
      {
        text: "How would PgBouncer connection pooling work here?",
        type: "inline",
        mini_answer: "PgBouncer sits between app instances and Postgres. It maintains a small pool (e.g. 100 real DB connections) shared across many app connections. App instances connect to PgBouncer, not directly to Postgres. In transaction-pooling mode, a DB connection is borrowed for the duration of a transaction then returned. 200 app instances can share 100 DB connections — Postgres sees steady load while the app tier scales freely."
      },
      {
        text: "What's your caching strategy for product pages?",
        type: "linked",
        links_to: "2.4.01",
        mini_answer: "Cache-aside pattern. App checks Redis first — cache hit returns immediately, cache miss hits DB and populates Redis with TTL of 60–300s. Product pages, pricing, and category listings are ideal candidates — high read volume, low update frequency, acceptable staleness. Use short TTLs on pricing during sale events to limit oversell risk."
      }
    ],
    related: ["3.1.01", "2.4.01", "5.2.01", "4.1.01", "2.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["scaling","black-friday","postgres","caching","stateless","load-shedding","connection-pooling","e-commerce"]
  },

  {
    id: "11.2.02",
    section: 11,
    subsection: "11.2",
    level: "advanced",
    question: "Your PostgreSQL database CPU is at 80% and climbing during business hours. Query volume hasn't increased. Slow query log shows 3 queries taking 2–8 seconds each, previously under 100ms. How do you diagnose and resolve this?",
    quick_answer: "→ Run EXPLAIN ANALYZE on the slow queries to identify missing indexes or sequential scans\n→ Check pg_stat_user_tables for table bloat (dead tuples, vacuum lag)\n→ Check for lock contention in pg_locks / pg_stat_activity\n→ Short-term: add targeted indexes; Long-term: autovacuum tuning, query rewrite, or read replica offload\n→ Add DB query observability (pg_stat_statements) to catch regressions early",
    detailed_answer: "When performance degrades without a volume increase, the problem is almost always data growth changing query execution plans, lock contention, or table bloat from insufficient vacuuming.\n\nStep 1 — Diagnose. Run EXPLAIN (ANALYZE, BUFFERS) on the three slow queries. Look for: sequential scans on large tables (index missing or not being used), high cost estimates diverging from actuals (stale table statistics), and shared memory hit ratios below 95% (buffer cache misses).\n\nStep 2 — Check table health. Run a query against pg_stat_user_tables to check n_dead_tup (dead tuple count) and last_autovacuum. If autovacuum hasn't run recently on a heavily-written table, dead tuples cause bloat that degrades scan performance and inflates table statistics.\n\nStep 3 — Check lock contention. Query pg_locks joined to pg_stat_activity. A long-running OLAP query or migration holding a lock will block all subsequent queries on that table, causing cascading slowness that looks like CPU pressure.\n\nStep 4 — Check statistics freshness. Run ANALYZE on the affected tables. If the planner is using a stale row estimate, it may choose a sequential scan over an index because it underestimates table size.\n\nFixes depend on diagnosis:\n- Missing index → CREATE INDEX CONCURRENTLY (non-blocking)\n- Bloated table → manual VACUUM ANALYZE; tune autovacuum on this table (increase workers, lower cost delay)\n- Lock contention → break long transactions, schedule OLAP queries to replica\n- Query rewrite → use CTEs or pagination to reduce working set\n\nLonger term, add pg_stat_statements to your observability stack. It tracks all query execution statistics and is invaluable for catching regressions before they become incidents.\n\nSections covered: 2.2 (relational databases), 2.4 (read replica offload), 2.8 (sharding consideration), 3.4 (performance & latency), 3.6 (observability)",
    key_points: [
      "Performance regression without volume increase → data growth, bloat, or lock contention",
      "EXPLAIN (ANALYZE, BUFFERS) reveals whether the planner chose the right plan",
      "Dead tuple bloat is invisible until it silently degrades query performance",
      "Lock contention cascades — one blocked query blocks all subsequent queries on the table",
      "CREATE INDEX CONCURRENTLY avoids table locks in production",
      "pg_stat_statements is the single best observability addition for Postgres"
    ],
    hint: "If query volume is constant but speed has dropped, what in the database could have changed that the query doesn't control?",
    common_trap: "Adding an index without running EXPLAIN first — indexes are not always used, and a missing ANALYZE means the planner may still choose the wrong plan even after the index is created.",
    follow_up_questions: [
      {
        text: "When would you shard instead of index?",
        type: "linked",
        links_to: "2.8.01",
        mini_answer: "When the table exceeds what a single node can serve even with optimal indexes — typically 500GB+ and index scans start hitting I/O limits. Or when write throughput exceeds a single master's capacity. Sharding before this point adds operational complexity with no benefit. Index and read-replica first; shard only when vertical scaling and read-scaling are exhausted."
      },
      {
        text: "How would you offload reporting queries without a read replica?",
        type: "inline",
        mini_answer: "Materialise aggregations on a schedule — pre-compute expensive reports into a summary table via a cron job or Postgres scheduled function. Reporting queries hit the pre-aggregated table instead of the live transactional data. Trade-off: data is stale by the refresh interval. For near-real-time, consider streaming aggregations into a separate analytics DB (ClickHouse, Redshift) via Debezium CDC."
      }
    ],
    related: ["2.2.01", "2.8.01", "3.4.01", "3.6.01", "2.4.02"],
    has_diagram: false,
    has_code: true,
    code_language: "sql",
    code_snippet: `-- Identify top slow queries (requires pg_stat_statements extension)
SELECT query,
       calls,
       round(total_exec_time::numeric, 2) AS total_ms,
       round(mean_exec_time::numeric, 2)  AS mean_ms,
       round(stddev_exec_time::numeric, 2) AS stddev_ms,
       rows
FROM   pg_stat_statements
ORDER  BY mean_exec_time DESC
LIMIT  20;

-- Check table bloat
SELECT relname,
       n_dead_tup,
       n_live_tup,
       last_autovacuum,
       last_analyze
FROM   pg_stat_user_tables
ORDER  BY n_dead_tup DESC
LIMIT  10;

-- Find blocking locks
SELECT blocked.pid,
       blocked_activity.query  AS blocked_query,
       blocking.pid            AS blocking_pid,
       blocking_activity.query AS blocking_query
FROM   pg_locks blocked
JOIN   pg_stat_activity blocked_activity  ON blocked_activity.pid  = blocked.pid
JOIN   pg_locks blocking                  ON blocking.relation = blocked.relation
                                         AND blocking.granted  = true
                                         AND blocked.granted   = false
JOIN   pg_stat_activity blocking_activity ON blocking_activity.pid = blocking.pid;`,
    tags: ["postgres","performance","slow-queries","explain-analyze","indexes","vacuum","bloat","observability"]
  },

  {
    id: "11.2.03",
    section: 11,
    subsection: "11.2",
    level: "advanced",
    question: "Your API p99 latency has climbed from 50ms to 2s over the past 2 weeks with no code deployments. Traffic is steady. What do you investigate and how do you fix it?",
    quick_answer: "→ Correlate the timeline: what changed 2 weeks ago (data volume, infra, dependencies)?\n→ Check distributed trace data — isolate which service/DB call is slow\n→ Inspect GC pause times, thread pool saturation, and connection pool wait time\n→ Check downstream dependency health — third-party APIs, DB, cache\n→ Look for slow data accumulation: growing tables, cache eviction, or log rotation pressure",
    detailed_answer: "A latency regression with no code change and steady traffic is a data or infrastructure drift problem, not a code bug.\n\nStart with timeline correlation. Check all changes in the 2-week window: infra patches, certificate renewals, database growth milestones, dependency version bumps pushed by a managed service, or changes to an upstream API's SLA. Infrastructure drift often causes latency without any application change.\n\nUse distributed traces (OpenTelemetry, Jaeger, or Datadog APM) to isolate which span is slow. Is the latency in the application tier, the DB call, an external API call, or connection acquisition time? This is your single most valuable diagnostic step — a 2s p99 could be a 1.95s DB call hiding inside a 50ms app span.\n\nCommon culprits when latency drifts without code change:\n- Database query plans degraded due to data growth or stale statistics → ANALYZE / index review\n- Connection pool exhaustion causing queue wait time → increase pool size or reduce transaction scope\n- GC pressure in JVM services — check GC logs for long stop-the-world pauses. Java heap sizing or GC tuning may be needed\n- Cache eviction rate climbing — if Redis hit rate has dropped, more requests are falling through to DB\n- Thread pool saturation — check queue depth on executor thread pools; blocked threads from a slow downstream propagate into all other requests\n- Certificate/TLS renewal causing TLS handshake overhead on keep-alive connection recycling\n\nFix depends on root cause. For DB: add targeted index or run VACUUM ANALYZE. For connection pool: tune pool size or split read/write pools. For GC: tune heap or switch GC algorithm. For cache: investigate eviction policy, bump TTL, or add cache warming.\n\nFinally, add a latency SLO alert that fires at p99 > 200ms so the next regression is caught in hours, not weeks.\n\nSections covered: 3.4 (performance & latency), 3.6 (observability), 6.8 (observability implementation), 4.2 (resilience — circuit breaker context)",
    key_points: [
      "No code change + steady traffic means data drift, infra drift, or a dependency degradation",
      "Distributed traces are essential — isolate the slow span before guessing a fix",
      "GC pause, connection pool wait, and thread saturation are invisible without instrumentation",
      "Cache hit rate decline silently shifts load to the DB over time",
      "SLO alerting on p99 turns a 2-week blind spot into a 2-hour detection window",
      "Upstream managed services can change their behaviour without notifying you"
    ],
    hint: "If nothing in your code changed, what external or environmental factors could have drifted over 2 weeks?",
    common_trap: "Immediately scaling up instances — if the bottleneck is a slow DB query or connection pool exhaustion, more instances amplify the problem rather than fixing it.",
    follow_up_questions: [
      {
        text: "How would you use distributed tracing to isolate the slow span?",
        type: "linked",
        links_to: "3.6.01",
        mini_answer: "Filter traces where total duration > 1s. Inspect the waterfall view — the slow span is the one with the longest bar. Note which service owns it and what operation it represents (DB query, HTTP call, lock wait). Check p50 vs p99 for that span — a high p99 with low p50 suggests intermittent contention (GC, lock) rather than a consistently slow query. Correlate with resource metrics (CPU, memory, DB connections) at the same timestamps."
      },
      {
        text: "When should you add a circuit breaker to a slow downstream?",
        type: "linked",
        links_to: "4.2.02",
        mini_answer: "When the downstream's latency is above your SLO and you cannot fix it quickly. A circuit breaker stops waiting for a slow dependency once the error/timeout threshold is hit — it opens the circuit and returns a fast fallback instead. This prevents thread pool exhaustion cascading from the slow downstream into your entire service. Set the timeout well below your p99 SLO — if your SLO is 500ms, set the circuit timeout at 300ms."
      }
    ],
    related: ["3.4.01", "3.6.01", "6.8.01", "4.2.02", "2.4.02"],
    has_diagram: false,
    has_code: false,
    tags: ["latency","p99","observability","distributed-tracing","gc","connection-pool","performance-regression","diagnosis"]
  },

  {
    id: "11.2.04",
    section: 11,
    subsection: "11.2",
    level: "advanced",
    question: "Your Kafka consumer group is falling behind — lag is accumulating at 50,000 messages/minute and growing. The topic has 12 partitions and your consumers are in a Kubernetes deployment. How do you diagnose and recover?",
    quick_answer: "→ Check consumer throughput: is the consumer slow, or has producer volume spiked?\n→ Profile the consumer — is the bottleneck processing logic, DB writes, or downstream API calls?\n→ Scale consumer replicas up to partition count (12 max for this topic)\n→ If processing is the bottleneck, parallelise within the consumer or offload to a worker pool\n→ Monitor lag metric with alerting to catch accumulation before it becomes critical",
    detailed_answer: "Kafka consumer lag means messages are being produced faster than they are consumed. The diagnostic question is: is this a throughput problem (volume increase) or a performance problem (consumer slowdown)?\n\nFirst, check the producer rate over the last 24 hours. If it has spiked significantly, the consumer may simply need to scale to match. If producer rate is stable, the consumer has slowed down.\n\nFor a slowed consumer, profile the processing path. Typical bottlenecks:\n- Downstream DB write saturation — each message triggers a DB write, and DB throughput is the ceiling\n- Synchronous HTTP call to another service — network latency multiplied by message volume\n- CPU-bound transformation — complex JSON processing or encryption in the hot path\n- GC pauses in a JVM consumer pausing processing for 100–500ms at a time\n\nScaling consumers: Kafka's partition count is the parallelism ceiling. With 12 partitions, you can run at most 12 consumer instances in the same consumer group. Each instance exclusively owns one or more partitions. Scale replicas to 12 in Kubernetes. If 12 consumers aren't enough, consider repartitioning the topic (cannot be done zero-downtime on existing topic — requires a migration to a new topic with more partitions).\n\nIf processing latency per message is the bottleneck (not throughput), parallelise within each consumer: read batches from Kafka and process in a local thread pool, committing offsets only after the batch completes. This multiplies per-consumer throughput without changing partition count.\n\nFor recovery: if lag is many millions of messages, prioritise catching up before worrying about optimisation. Scale first, then optimise. Consider a dedicated catch-up consumer that processes historical messages at higher batch size while the live consumer handles the tip of the topic.\n\nMonitor lag with Kafka's consumer group offset metrics or Burrow. Alert when lag exceeds a threshold (e.g., > 5 minutes of production rate at current throughput). Lag growing slowly is always an early warning of an incident in progress.\n\nSections covered: 8.2 (stream processing), 4.3 (messaging patterns), 3.1 (scalability), 6.3 (Kubernetes orchestration)",
    key_points: [
      "Partition count is the hard ceiling on consumer parallelism — know it before scaling",
      "Distinguish producer volume spike from consumer slowdown — different fixes",
      "DB write saturation and synchronous HTTP calls are the most common consumer bottlenecks",
      "Batch processing with a local thread pool multiplies throughput within a single consumer",
      "Lag monitoring with alerting is the only way to catch accumulation early",
      "Repartitioning requires a topic migration — plan partition count generously upfront"
    ],
    hint: "Kafka partition count is a hard ceiling on parallelism. How many consumers can you actually run?",
    common_trap: "Scaling consumer replicas beyond the partition count — extra consumers sit idle because Kafka cannot assign them any partition. You need to repartition the topic to achieve more parallelism.",
    follow_up_questions: [
      {
        text: "How does Kafka's consumer group coordination work during a scale-out?",
        type: "linked",
        links_to: "4.3.01",
        mini_answer: "When a new consumer joins the group, Kafka triggers a rebalance. The group coordinator (a broker) revokes all partition assignments and redistributes them across the updated member list. During rebalance, consumption pauses — typically 10–30 seconds. With the cooperative rebalance protocol (Kafka 2.4+), only partitions being reassigned are revoked, minimising the pause. Size your partitions generously — you can scale consumers up to partition count without repartitioning."
      },
      {
        text: "When would you use a dead-letter topic for failed messages?",
        type: "inline",
        mini_answer: "When a subset of messages consistently fail processing (bad data, downstream outage) and blocking on retries would cause lag accumulation. After N retries, route the message to a DLT (dead-letter topic). This keeps the main consumer moving forward. Ops team monitors the DLT, investigates failures, and replays after the root cause is fixed. Without a DLT, one bad message can block a partition indefinitely."
      }
    ],
    related: ["8.2.01", "4.3.01", "3.1.01", "6.3.01", "8.2.02"],
    has_diagram: false,
    has_code: false,
    tags: ["kafka","consumer-lag","stream-processing","kubernetes","partitions","scaling","dead-letter-topic","throughput"]
  },

  {
    id: "11.2.05",
    section: 11,
    subsection: "11.2",
    level: "advanced",
    question: "Your application runs in a single AWS region (us-east-1). The business now requires 99.99% availability and the ability to survive a full regional outage. Design the multi-region architecture.",
    quick_answer: "→ Choose an active-active or active-passive topology based on write consistency needs\n→ Global load balancing via Route 53 latency-based routing or Global Accelerator\n→ Database replication: Aurora Global Database (active-passive) or multi-master DynamoDB\n→ Async replication introduces RPO (potential data loss window) — design for it explicitly\n→ Test failover regularly; untested failover is not failover",
    detailed_answer: "Multi-region is not simply 'deploy the same stack in two regions.' Every layer has distinct replication and consistency trade-offs.\n\nTopology decision: Active-active vs active-passive.\n- Active-passive: all writes go to the primary region; the secondary is a warm standby. Simpler consistency model, but recovery requires DNS failover (seconds to minutes of downtime). Achieves 99.95–99.99% depending on failover speed.\n- Active-active: writes accepted in both regions. Much harder — requires conflict resolution, distributed transactions, or restricting writes to user-owned data partitions. Best for read-heavy systems with localised write domains (e.g., user data belongs to the region they signed up in).\n\nGlobal routing: Route 53 with latency-based routing or health-check failover. AWS Global Accelerator provides anycast IPs with faster failover (30s vs 60–120s for DNS TTL propagation). For active-active, use weighted routing; for active-passive, use health-check-driven failover.\n\nDatabase replication:\n- Aurora Global Database: asynchronous replication with <1s RPO. Secondary region is read-only. Failover promotes secondary to primary in ~1 minute. RTO and RPO are well within 99.99% budget if failover is automated.\n- DynamoDB global tables: multi-master with eventually consistent cross-region replication. Simpler for active-active but conflict resolution is last-writer-wins — design data models to avoid conflicts.\n- Self-managed Postgres: logical replication or Patroni multi-region is complex and operationally risky. Avoid unless Aurora is not viable.\n\nStateless application tier: ensure session state is externalised to a replicated store (ElastiCache Global Datastore or DynamoDB global table). Any app instance in any region must be able to serve any user.\n\nRPO and RTO planning: Async replication means there is always a window of potential data loss (typically <1s for Aurora). For financial data, this is unacceptable — use synchronous replication (higher latency) or design the write path to confirm to both regions before acknowledging.\n\nChaos engineering: fire a GameDay where you cut traffic to the primary region. If you've never tested failover, you don't have 99.99% — you have 99.99% in theory.\n\nSections covered: 3.2 (availability & reliability), 2.6 (data replication & consistency), 5.1 (cloud provider concepts), 5.6 (multi-cloud & hybrid)",
    key_points: [
      "Active-active vs active-passive: write consistency requirements drive this choice",
      "Aurora Global Database achieves <1s RPO with ~1 minute RTO — practical for most 99.99% requirements",
      "Async replication always has an RPO window — explicitly design for it in write-critical paths",
      "Route 53 health-check failover and Global Accelerator are the routing options at different speed/cost",
      "Stateless app tier is prerequisite — sessions must be in replicated shared storage",
      "Untested failover is not failover — GameDay is a delivery requirement"
    ],
    hint: "What's the fundamental tension between multi-region consistency and availability? Can you name the specific trade-off from CAP theorem?",
    common_trap: "Treating RPO of <1s as 'zero data loss' — async replication means any data written in the replication window at failover time is lost. Financial systems must account for this explicitly.",
    follow_up_questions: [
      {
        text: "How does Aurora Global Database handle replication?",
        type: "linked",
        links_to: "2.6.01",
        mini_answer: "Aurora uses storage-level replication, not logical replication. The primary region's storage writes are propagated to secondary region storage with <1s typical lag. The secondary DB cluster reads from replicated storage — it does not receive SQL statements. Failover promotes the secondary cluster to primary; DNS is updated automatically. The previous primary becomes a secondary. Replication is asynchronous, so RPO is typically <1s but non-zero."
      },
      {
        text: "How would you approach data sovereignty requirements in multi-region?",
        type: "inline",
        mini_answer: "Partition user data by region at the application level — EU users' data stored only in eu-west-1, US users in us-east-1. Route traffic based on user region tag. Disable cross-region replication for tables containing PII. Use DynamoDB global tables with selected tables excluded from replication, or separate Aurora clusters per region with no cross-region DB replication. Sovereignty requirements override the availability design — document the trade-off explicitly in the ADR."
      }
    ],
    related: ["3.2.01", "2.6.01", "5.1.01", "5.6.01", "3.7.01"],
    has_diagram: true,
    diagram: `Active-Passive Multi-Region

  Users
    │
    ▼
Route 53 (health-check failover)
    │
    ├── us-east-1 (PRIMARY) ◄──────────────────┐
    │     ALB → App Tier (ECS/EKS)             │
    │     │                                    │ Aurora storage
    │     └─► Aurora (PRIMARY)  ───────────────┘ replication <1s
    │                                           │
    └── eu-west-1 (STANDBY)                     │
          ALB → App Tier (ECS/EKS, cold)        │
          │                                     │
          └─► Aurora (READ REPLICA) ◄───────────┘
                (promoted to primary on failover)

Failover trigger: Route 53 health check fails on us-east-1
RTO: ~1 min (Aurora promotion + DNS TTL)
RPO: <1s (Aurora async replication lag)`,
    has_code: false,
    tags: ["multi-region","availability","aurora","route-53","active-passive","rpo","rto","failover","99.99"]
  },

  {
    id: "11.2.06",
    section: 11,
    subsection: "11.2",
    level: "advanced",
    question: "After a Redis cache restart over the weekend, your application experienced a 10-minute outage — the database was overwhelmed immediately after the cache came back empty. This is the thundering herd problem. How do you prevent it?",
    quick_answer: "→ Add a probabilistic cache refresh to avoid simultaneous expiry (jitter on TTL)\n→ Use mutex/lock-based single-flight: only one request populates the cache, others wait\n→ Cache warming on startup: pre-populate hot keys before accepting traffic\n→ Add a circuit breaker on the DB call to prevent cascade under cache miss storm\n→ Never use a fixed TTL for all keys — jitter distributes expirations over time",
    detailed_answer: "The thundering herd (or cache stampede) occurs when many concurrent requests find the same cache key absent and simultaneously hit the backend. After a full Redis restart, every key is absent — so 100% of traffic hits the DB at once.\n\nPrevention strategies:\n\n1. TTL jitter. If all keys have TTL = 3600s, they expire simultaneously. Add random jitter: TTL = 3600 + random(0, 300). This distributes expirations across 5 minutes, preventing simultaneous expiry even without a restart.\n\n2. Mutex / single-flight. When a cache miss is detected, acquire a distributed lock (Redis SET NX with TTL). Only the lock holder computes the value and writes to cache. Other requests for the same key wait (spinning with brief sleep) and read from cache when the lock is released. One DB hit per missing key instead of N.\n\n3. Probabilistic early refresh (PER). Before the TTL expires, compute a probability based on how close to expiry the key is. Some fraction of requests will refresh early, so the key is never completely absent. Avoids the lock contention of mutex approach.\n\n4. Cache warming. Before routing live traffic after a restart, run a warming script that populates the top-N hot keys from the DB. Use a shadow traffic log or frequency counter (Redis sorted set) to know which keys are hot. Only route traffic once warming completes or hits a minimum fill threshold.\n\n5. Request coalescing / local in-process cache. For a JVM service, a short-lived in-process Guava cache (5–10s TTL) absorbs burst misses before they reach Redis. Multiple threads for the same key share one result without a Redis round-trip.\n\n6. Circuit breaker on DB. If Redis is cold and DB is already at capacity, a circuit breaker fast-fails subsequent requests rather than queuing them and creating a timeout avalanche. Return a 503 with a Retry-After header rather than adding more load.\n\nFor a production system, use at least three of these: TTL jitter + mutex + cache warming. That combination prevents both the gradual expiry storm and the total cold-restart scenario.\n\nSections covered: 2.4 (caching strategies), 4.2 (resilience patterns — circuit breaker), 3.3 (fault tolerance), 3.4 (performance & latency)",
    key_points: [
      "Thundering herd = many concurrent cache misses hitting the DB simultaneously",
      "TTL jitter distributes expirations — never use identical TTLs for a category of keys",
      "Mutex/single-flight reduces N simultaneous DB hits to 1 per missing key",
      "Cache warming before traffic routing prevents the cold-restart scenario entirely",
      "Circuit breaker on the DB prevents timeout avalanche when cache is cold",
      "In-process cache (Guava, Caffeine) absorbs burst misses at near-zero latency cost"
    ],
    hint: "What's the difference between the thundering herd from simultaneous TTL expiry versus from a total cache restart? Do the same solutions apply?",
    common_trap: "Thinking cache warming 'takes too long' and skipping it — a 2-minute warm-up that prevents a 10-minute outage is always the right trade-off. Untrained reflex is to restart and immediately take traffic.",
    follow_up_questions: [
      {
        text: "How does Redis handle high availability to prevent cold-restart scenarios?",
        type: "linked",
        links_to: "2.4.03",
        mini_answer: "Redis Sentinel: one primary + multiple replicas, Sentinel monitors and promotes a replica on primary failure. Data is not lost if replication is synchronous (WAIT command). ElastiCache with Multi-AZ: automatic failover to a replica in a different AZ — typical failover time 30–60 seconds. Redis Cluster: data sharded across multiple primary nodes; a single node restart only empties its shard, not the entire cache. The thundering herd is scoped to keys in that shard."
      },
      {
        text: "How would you implement single-flight in a distributed system?",
        type: "inline",
        mini_answer: "Use a Redis distributed lock: SET lock:key:{cacheKey} 1 NX PX 5000 (set if not exists, 5s TTL). The instance that acquires the lock fetches from DB and writes to cache. All other instances poll for the cache key every 50ms until it's populated or the lock TTL expires. In Go, the singleflight package provides this pattern in-process. For cross-instance coordination, the Redis lock is the standard approach. Always set a lock TTL — never block forever on a lock."
      }
    ],
    related: ["2.4.01", "4.2.01", "3.3.01", "3.4.01", "2.4.03"],
    has_diagram: false,
    has_code: true,
    code_language: "python",
    code_snippet: `import redis
import time
import random

r = redis.Redis()

def get_with_jitter_ttl(key: str, base_ttl: int = 3600) -> str:
    """Cache-aside with TTL jitter to prevent simultaneous expiry."""
    value = r.get(key)
    if value:
        return value.decode()

    # Cache miss — compute and store with jitter
    value = expensive_db_query(key)
    jittered_ttl = base_ttl + random.randint(0, base_ttl // 10)
    r.setex(key, jittered_ttl, value)
    return value


def get_with_mutex(key: str, ttl: int = 3600) -> str:
    """Single-flight via distributed lock — one DB call per missing key."""
    value = r.get(key)
    if value:
        return value.decode()

    lock_key = f"lock:{key}"
    acquired = r.set(lock_key, 1, nx=True, px=5000)  # 5s lock TTL

    if acquired:
        try:
            value = expensive_db_query(key)
            r.setex(key, ttl, value)
            return value
        finally:
            r.delete(lock_key)
    else:
        # Wait for lock holder to populate cache
        for _ in range(50):
            time.sleep(0.1)
            value = r.get(key)
            if value:
                return value.decode()
        raise TimeoutError("Cache not populated within timeout")`,
    tags: ["thundering-herd","cache-stampede","redis","cache-warming","mutex","ttl-jitter","circuit-breaker","resilience"]
  },

  {
    id: "11.2.07",
    section: 11,
    subsection: "11.2",
    level: "intermediate",
    question: "Your CI/CD pipeline takes 45 minutes to complete. Developers are bypassing it or doing risky batched deployments. How do you reduce pipeline time to under 10 minutes without reducing quality gates?",
    quick_answer: "→ Profile first: measure each stage's duration and identify the top 2–3 slowest steps\n→ Parallelise independent stages (lint, unit test, security scan run concurrently)\n→ Cache aggressively: build dependencies, Docker layers, test results\n→ Scope tests: only run tests affected by the changed modules (test impact analysis)\n→ Shift heavy gates left: make developers run fast checks locally before push",
    detailed_answer: "A 45-minute pipeline is a developer experience failure. The fix is not to remove stages but to restructure them for speed.\n\nStep 1: Profile the pipeline. Add timing metrics to each stage and find the top 3 slowest. Most pipelines have 1–2 outlier stages that account for 70% of the runtime.\n\nCommon findings and fixes:\n\n1. Build time (10–20 min). Docker build caching: structure your Dockerfile so dependency installation (npm install, mvn install) is a separate layer above your source COPY. This layer only rebuilds when package.json/pom.xml changes — not on every source change. Use a build cache (BuildKit with cache mounts) or a pre-built base image. For multi-module repos, only rebuild modules whose source changed (Nx, Turborepo, or custom change detection).\n\n2. Test suite (20–30 min). Parallelise test execution across shards (pytest-xdist, JUnit parallel fork, GitHub Actions matrix). Run unit tests first (1–2 min); if they pass, run integration tests (longer). Use test impact analysis to run only tests that touch changed files — tools like Nx, Bazel, or custom coverage mapping. Never run the full integration suite for a one-line config change.\n\n3. Sequential stage design. Lint, unit tests, and SAST scans are independent — run them in parallel as separate jobs. Many pipelines run these sequentially by default. Parallelising the first 3 stages alone often cuts 15 minutes.\n\n4. Dependency caching. Cache node_modules, .m2, pip packages across pipeline runs keyed on the lock file hash. Many pipelines re-download 200MB of dependencies on every run. Cache invalidation on lock file change only.\n\n5. Split the pipeline. A 5-minute fast pipeline (lint, unit tests, build) + a 30-minute slow pipeline (integration, E2E, load tests) running in parallel, with the slow pipeline non-blocking for merge but required before production deploy. Developers get fast feedback; quality gates are preserved.\n\nCultural fix: if developers are bypassing the pipeline, the pipeline has failed as a product. Short pipeline time is a developer product requirement, not an optimisation.\n\nSections covered: 6.1 (CI/CD pipeline design), 6.2 (containerisation), 6.3 (container orchestration), 5.2 (compute — runner sizing)",
    key_points: [
      "Profile first — find the 20% of stages causing 80% of the wait time",
      "Docker layer caching: separate dependency install from source copy in the Dockerfile",
      "Parallelise independent stages — lint, unit test, SAST are always independent",
      "Test impact analysis runs only tests touched by the change — safe and dramatically faster",
      "Dependency caching keyed on lock file hash eliminates redundant downloads",
      "Split into fast (blocking) and slow (non-blocking) pipeline streams"
    ],
    hint: "If you could only fix one bottleneck, what would have the highest probability of being the root cause in a typical 45-minute pipeline?",
    common_trap: "Removing integration or security scans to hit the time target — this trades a developer experience problem for a quality and security problem. The fix is parallelisation and caching, not removal.",
    follow_up_questions: [
      {
        text: "How do you safely implement test impact analysis?",
        type: "inline",
        mini_answer: "Map each test to the source files it covers (via code coverage instrumentation). On a PR, detect changed files via git diff. Run only tests whose coverage map includes a changed file. Always run the full suite on the main branch merge to catch any gaps in the coverage map. Tools: Nx (JS/TS), Bazel (polyglot), pytest-cov with custom selection (Python). Risk: tests that depend on external config or data not captured in source coverage — maintain a 'always run' list for these."
      },
      {
        text: "What are the key principles for a good CI/CD pipeline?",
        type: "linked",
        links_to: "6.1.01",
        mini_answer: "Fast feedback loop — developers should know if they broke something in under 5 minutes for basic quality gates. Deterministic — same input always produces same output. Stages are independent where possible — parallelise. Fail fast — run fastest checks first so failures are caught early. Immutable artifacts — build once, promote the same artifact through environments. Pipeline-as-code — versioned alongside the application."
      }
    ],
    related: ["6.1.01", "6.2.01", "6.3.01", "5.2.01", "6.1.02"],
    has_diagram: false,
    has_code: true,
    code_language: "yaml",
    code_snippet: `# GitHub Actions: parallelised fast pipeline
name: CI

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/cache@v4
        with:
          path: node_modules
          key: deps-\${{ hashFiles('package-lock.json') }}
      - run: npm ci
      - run: npm run lint

  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/cache@v4
        with:
          path: node_modules
          key: deps-\${{ hashFiles('package-lock.json') }}
      - run: npm ci
      - run: npm test -- --shard=\${{ matrix.shard }}/4
    strategy:
      matrix:
        shard: [1, 2, 3, 4]   # 4 parallel test shards

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: snyk/actions/node@master

  build:
    needs: [lint, unit-test]   # blocks on fast gates only
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with:
          cache-from: type=gha
          cache-to: type=gha,mode=max`,
    tags: ["ci-cd","pipeline","docker","caching","parallelisation","test-impact","developer-experience","github-actions"]
  },

  {
    id: "11.2.08",
    section: 11,
    subsection: "11.2",
    level: "advanced",
    question: "Your ML model training pipeline runs on a single GPU machine and takes 3 days per training run. The data science team needs to iterate faster — target is 6 hours per run. Walk me through the architectural changes.",
    quick_answer: "→ Profile the bottleneck: is it data loading I/O, GPU compute, or data preprocessing?\n→ Distribute training across multiple GPUs with data parallelism (PyTorch DDP or Horovod)\n→ Optimise data pipeline: use tf.data / DataLoader with prefetching and parallel workers\n→ Use mixed-precision training (FP16) to halve memory and roughly double throughput\n→ Right-size the infrastructure: spot/preemptible GPUs for training, with checkpoint-and-resume",
    detailed_answer: "A 3-day training run blocks experimentation. The goal is not just speed — it is enabling the iterate-experiment-validate cycle that produces better models.\n\nStep 1: Profile. Instrument the training loop to measure time per epoch broken down by: data loading, forward pass, backward pass, and optimizer step. A GPU utilisation metric below 80% during training means the GPU is waiting for data — a data pipeline problem, not a compute problem. High utilisation throughout means compute-bound.\n\nData pipeline optimisation (if I/O bound):\n- Use tf.data or PyTorch DataLoader with num_workers ≥ 4 and pin_memory=True\n- Add prefetch buffers so the next batch is loading while the current batch trains\n- Pre-tokenize or pre-process data into a binary format (TFRecord, Apache Arrow/Parquet) and store in fast object storage (S3 with EFS mount or FSx for Lustre on AWS). Raw CSV parsing per epoch is a common bottleneck\n- If data is too large for instance storage, use streaming data loading from S3 with prefetch\n\nDistributed training (if compute-bound):\n- Data parallelism: split the batch across N GPUs, each GPU computes gradients on its shard, gradients are reduced (averaged) using AllReduce. PyTorch DDP (DistributedDataParallel) is the standard. Scales near-linearly to 4–8 GPUs for most models.\n- For very large models: model parallelism or pipeline parallelism (split model layers across GPUs). More complex, use for models that don't fit in a single GPU's memory.\n- Framework: PyTorch DDP for most cases. Horovod if multi-framework or multi-node. SageMaker Distributed Training if on AWS.\n\nMixed precision training:\n- Use FP16 (half precision) for forward and backward passes; keep master weights in FP32. PyTorch AMP (Automatic Mixed Precision) handles this transparently. Halves GPU memory usage, typically 1.5–2× throughput improvement on modern GPUs (V100, A100).\n\nInfrastructure:\n- Spot/preemptible GPU instances cost 60–80% less than on-demand. For a 3-day run, spot interruptions are a risk — implement checkpoint-and-resume (save model weights every epoch). Resume from the last checkpoint on a new spot instance.\n- Auto-scaling for hyperparameter search: use a managed service (SageMaker, Vertex AI, Databricks) that orchestrates multiple training jobs in parallel for hyperparameter tuning.\n\nWith DDP on 8 GPUs + mixed precision + optimised data pipeline, 3 days → 4–6 hours is achievable for most training workloads.\n\nSections covered: 8.4 (ML platform design), 5.2 (compute — GPU instances), 8.1 (data pipeline design), 9.0 (LLM foundations — model training context)",
    key_points: [
      "Profile GPU utilisation first — below 80% means data pipeline bottleneck, not compute",
      "PyTorch DDP scales near-linearly to 8 GPUs for data-parallel training",
      "Mixed precision (FP16/AMP) is almost always a free 1.5–2× speedup on modern GPUs",
      "Data pipeline: num_workers, pin_memory, prefetch, and binary format are the four levers",
      "Spot instances + checkpoint-and-resume cuts training cost 60–80%",
      "Parallelise hyperparameter search across multiple training jobs, not sequentially"
    ],
    hint: "Before distributing computation, you need to know what the bottleneck is. How would you tell whether the GPU is the limiting factor or the data loading pipeline?",
    common_trap: "Jumping straight to multi-GPU training when the bottleneck is data loading — distributing compute to 8 GPUs that are all waiting for data results in 8× the cost with no speedup.",
    follow_up_questions: [
      {
        text: "How does ML platform design differ from general distributed systems design?",
        type: "linked",
        links_to: "8.4.01",
        mini_answer: "ML workloads are batch and iterative — you run the same computation many times with different data or parameters. Reproducibility is a core requirement: same data, code, and hyperparameters must produce the same model artifact. This drives experiment tracking (MLflow, W&B), data versioning (DVC), and artifact registries. General distributed systems optimise for low-latency request handling; ML platforms optimise for high-throughput batch compute, storage of large binary artifacts, and experiment lineage."
      },
      {
        text: "When would you use model parallelism instead of data parallelism?",
        type: "inline",
        mini_answer: "When the model itself doesn't fit in a single GPU's memory — typically large language models (7B+ parameters). Data parallelism requires each GPU to hold a full model copy; model parallelism splits the model across GPUs (tensor parallelism splits individual weight matrices, pipeline parallelism splits layers). Data parallelism is simpler and preferred when the model fits. For most non-LLM tasks (vision, tabular, classical NLP), data parallelism on 4–8 GPUs is sufficient."
      }
    ],
    related: ["8.4.01", "5.2.03", "8.1.01", "9.0.01", "8.2.01"],
    has_diagram: false,
    has_code: true,
    code_language: "python",
    code_snippet: `# PyTorch DDP training with mixed precision
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.cuda.amp import GradScaler, autocast

def train(rank: int, world_size: int, model, dataset):
    # Initialise process group (one process per GPU)
    dist.init_process_group("nccl", rank=rank, world_size=world_size)
    torch.cuda.set_device(rank)

    model = model.to(rank)
    model = DDP(model, device_ids=[rank])  # wrap for data parallelism

    # Sampler ensures each GPU sees a different shard
    sampler = torch.utils.data.DistributedSampler(
        dataset, num_replicas=world_size, rank=rank
    )
    loader = torch.utils.data.DataLoader(
        dataset, batch_size=256, sampler=sampler,
        num_workers=4, pin_memory=True  # data pipeline optimisation
    )

    optimiser = torch.optim.AdamW(model.parameters(), lr=1e-4)
    scaler = GradScaler()  # mixed precision loss scaler

    for epoch in range(100):
        sampler.set_epoch(epoch)   # shuffle differently per epoch
        for batch in loader:
            optimiser.zero_grad()
            with autocast():       # FP16 forward pass
                loss = model(batch)
            scaler.scale(loss).backward()
            scaler.step(optimiser)
            scaler.update()

        # Checkpoint on rank 0 only
        if rank == 0:
            torch.save(model.state_dict(), f"checkpoint_epoch_{epoch}.pt")

    dist.destroy_process_group()`,
    tags: ["ml","distributed-training","pytorch","ddp","mixed-precision","gpu","data-pipeline","spot-instances","checkpointing"]
  },

  // ── 11.3 Migrate Legacy Systems ────────────────────────────────────────

  {
    id: "11.3.01",
    section: 11,
    subsection: "11.3",
    level: "advanced",
    question: "You have a 10-year-old Java monolith serving 50,000 requests/day. The business wants to migrate to microservices without a big-bang rewrite. Walk me through your migration strategy.",
    quick_answer: "→ Use the strangler fig pattern — route traffic through a proxy, extract services incrementally\n→ Start with bounded contexts that are least coupled and most independently deployable\n→ Maintain the monolith as the fallback; never delete it until the replacement is proven in production\n→ Use an anti-corruption layer to translate between monolith data models and new service models\n→ Migrate the database last, not first — shared DB is acceptable during transition",
    detailed_answer: "A big-bang rewrite has a high failure rate — it freezes feature development, creates a parallel codebase that drifts, and the rewritten system often misses subtle behaviours of the original. The strangler fig pattern avoids this.\n\nThe strategy: place a routing proxy (API Gateway or Nginx) in front of the monolith. New services are deployed alongside the monolith. Traffic for a specific capability is gradually re-routed from the monolith to the new service. The monolith shrinks ('strangles') over time as capabilities are extracted.\n\nPhase 1 — Identify extraction candidates. Map the monolith's capabilities to domain bounded contexts (DDD). Find the seams: which capabilities have the most independent data, the most change frequency, or the clearest external interface? These are your first extraction targets. Avoid starting with the most complex, most coupled capability — start with a leaf node that has few upstream dependencies (e.g., notifications, reporting, user profile).\n\nPhase 2 — Extract behind the proxy. Deploy the new service. Configure the proxy to route, say, /api/notifications/* to the new service. The monolith still handles all other routes. The new service can temporarily read from the monolith's database (via an API, not direct DB access) while it establishes its own data store.\n\nPhase 3 — Anti-corruption layer. The new service should not use the monolith's data model directly. Introduce a translation layer so the new service works with its own domain model. This prevents the new service from inheriting the monolith's model complexity.\n\nPhase 4 — Database migration. Only migrate the data after the service is stable in production. Use the strangler fig on the data tier too: new service writes to both old and new DB (dual-write) → validate consistency → redirect reads to new DB → stop writing to old DB. This is the most fragile step — do it last.\n\nPhase 5 — Delete from the monolith. Only after the new service is proven in production for ≥30 days, delete the equivalent code from the monolith. Never just leave it — dead code in the monolith creates confusion.\n\nRisks and guardrails:\n- Distributed transactions: cross-service operations that were a single DB transaction in the monolith now require sagas or eventual consistency. Design this deliberately.\n- Test coverage on the monolith: add integration tests for any capability you plan to extract — you need a regression baseline.\n- Team alignment: one team owns each extracted service end-to-end. Avoid split ownership during migration.\n\nSections covered: 1.2 (microservices architecture), 1.5 (monolith to microservices migration), 4.4 (integration patterns — strangler fig, anti-corruption), 6.4 (deployment strategies — parallel run)",
    key_points: [
      "Strangler fig: proxy in front, extract incrementally, monolith stays live throughout",
      "Start with leaf-node capabilities — least coupled, most independent",
      "Anti-corruption layer prevents the new service inheriting the monolith's data model",
      "Migrate the database last — shared DB is a valid and safe transitional state",
      "Dual-write then validate then cut over is the data migration pattern",
      "Delete extracted code from the monolith after 30+ days of proven production running"
    ],
    hint: "What's the risk of migrating the database at the same time as the service logic?",
    common_trap: "Starting the migration with the most complex, highest-traffic capability — this maximises risk and learning cost. Start with a simple, low-coupling leaf capability to build the team's migration muscles first.",
    follow_up_questions: [
      {
        text: "How do you handle transactions that span multiple services after extraction?",
        type: "linked",
        links_to: "4.5.01",
        mini_answer: "Replace distributed transactions with the saga pattern. A saga is a sequence of local transactions, each publishing an event that triggers the next step. On failure, compensating transactions undo previous steps (e.g., cancel a reservation if payment fails). Choreography-based sagas use events directly; orchestration-based use a central coordinator. The key mindset shift: eventual consistency is acceptable for most business operations that weren't truly atomic anyway."
      },
      {
        text: "How would you sequence the migration across teams?",
        type: "inline",
        mini_answer: "Use Conway's Law deliberately: define service ownership before extraction. Each team takes end-to-end ownership of one domain — they own the service, the data, and the migration. Sequence by team readiness and coupling: teams with less cross-team dependency extract first. Establish a shared API contract review process for any service that other teams depend on. Never let two teams own the same extracted service — split ownership is the leading cause of migration stall."
      }
    ],
    related: ["1.5.01", "1.2.01", "4.4.01", "4.5.01", "2.7.01"],
    has_diagram: true,
    diagram: `Strangler Fig Migration — Phase 2

Before:
  Client → Monolith (handles everything)

During extraction:
  Client → API Gateway/Proxy
               │
               ├── /api/notifications/* → Notifications Service (NEW)
               │                              └── own DB
               └── /* → Monolith (everything else)
                             └── shared DB

After full extraction:
  Client → API Gateway
               │
               ├── /api/notifications/* → Notifications Service
               ├── /api/orders/*        → Orders Service
               ├── /api/users/*         → User Service
               └── /* → Monolith (residual, shrinking)`,
    has_code: false,
    tags: ["strangler-fig","monolith","microservices","migration","anti-corruption-layer","proxy","incremental","bounded-context"]
  },

  {
    id: "11.3.02",
    section: 11,
    subsection: "11.3",
    level: "advanced",
    question: "Your company runs Oracle Database with 2TB of data and 200 stored procedures. The business wants to migrate to PostgreSQL to eliminate the Oracle licence cost. You cannot afford more than 4 hours of downtime. Walk me through the migration.",
    quick_answer: "→ Schema conversion first: use AWS Schema Conversion Tool or ora2pg, expect 60–80% automatic, 20–40% manual\n→ Migrate stored procedures manually — Oracle PL/SQL and PostgreSQL PL/pgSQL differ significantly\n→ Set up continuous replication (AWS DMS or pglogical) to keep PostgreSQL in sync during the transition\n→ Run parallel for 2–4 weeks with application queries hitting both databases and comparing results\n→ Cutover window: switch write traffic, verify, keep Oracle warm for rollback for 48h",
    detailed_answer: "Oracle-to-PostgreSQL is one of the most common and most underestimated database migrations. The SQL surface area is different enough that automated tools handle the easy parts and humans handle the hard parts.\n\nPhase 1 — Assessment and schema conversion (weeks 1–4).\nRun ora2pg or AWS Schema Conversion Tool to generate a conversion report. It classifies objects: green (auto-convert), yellow (manual review), red (manual rewrite). Typical distribution: 60% green, 30% yellow, 10% red. The red objects are usually complex stored procedures, Oracle-specific features (hierarchical queries, packages, sequences with NOCACHE), and custom data types.\n\nConvert schema objects in order: tables → indexes → views → functions → stored procedures → triggers. Test each layer before moving to the next.\n\nPhase 2 — Data migration setup.\nUse AWS DMS (Database Migration Service) or a custom CDC pipeline to replicate Oracle data to PostgreSQL continuously. DMS uses Oracle LogMiner to stream changes. This keeps PostgreSQL in sync with Oracle during the parallel run period. Initial full load via DMS takes 12–48 hours for 2TB; subsequent changes stream in near-real-time.\n\nPhase 3 — Application layer changes.\nUpdate connection strings, query dialect, and any ORM configurations. PostgreSQL uses different syntax for: sequences (NEXTVAL), pagination (LIMIT/OFFSET vs ROWNUM), string functions, date arithmetic, and NULL handling in some edge cases. Run the full regression suite against both databases. Fix any query failures.\n\nPhase 4 — Parallel validation (2–4 weeks).\nRun the application in shadow mode: writes go to Oracle (primary), also replicated to PostgreSQL via DMS. For critical read paths, compare query results from both databases. A shadow-read library (Scientist pattern) can do this automatically and log mismatches. This phase catches subtle semantic differences that automated tools miss.\n\nPhase 5 — Cutover.\n4-hour window: (1) Put the application into read-only or maintenance mode. (2) Let DMS drain all in-flight replication to PostgreSQL. (3) Verify row counts and spot-check critical tables. (4) Update the application's connection string to PostgreSQL. (5) Disable read-only mode. (6) Monitor application health for 30 minutes. (7) If issues, failback: re-point to Oracle within 15 minutes.\n\nKeep Oracle warm (no writes from application, but reachable) for 48 hours post-cutover. This is your rollback window. After 48 hours of clean PostgreSQL operation, decommission Oracle.\n\nSections covered: 2.2 (relational databases), 2.6 (data replication & consistency — CDC), 6.4 (deployment strategies — parallel run, cutover), 3.7 (disaster recovery — rollback planning)",
    key_points: [
      "Automated tools handle 60–80% of schema conversion; stored procedures need manual work",
      "CDC replication (DMS or pglogical) keeps PostgreSQL in sync during parallel run — no big-bang",
      "Parallel validation with shadow reads catches semantic differences before cutover",
      "Cutover window is read-only/maintenance, not full downtime — minimises the 4h window",
      "Keep Oracle warm for 48h post-cutover as the rollback option",
      "Stored procedure rewrite is the long-tail risk — audit complexity before committing to timelines"
    ],
    hint: "What's the biggest hidden risk in a database migration that isn't captured by automated schema conversion?",
    common_trap: "Assuming automated conversion handles the stored procedures — PL/SQL packages and Oracle-specific constructs (CONNECT BY, BULK COLLECT, FORALL) require manual rewrite. Underestimating this is the leading cause of project overrun.",
    follow_up_questions: [
      {
        text: "How does CDC-based replication work to keep two databases in sync?",
        type: "linked",
        links_to: "2.6.03",
        mini_answer: "Change Data Capture reads the database's transaction log (Oracle redo log, Postgres WAL) rather than querying tables. Every INSERT, UPDATE, DELETE is captured as an event and applied to the target database in order. This is low-impact on the source (log reading, not query execution) and near-real-time. Debezium (open source) and AWS DMS are the most common tools. For Oracle specifically, LogMiner parses the redo log; DMS wraps this with managed infrastructure and handles schema changes."
      },
      {
        text: "How would you validate data correctness after migration?",
        type: "inline",
        mini_answer: "Three layers: row count validation per table, checksum validation on key columns (hash of all rows in a table), and business-logic validation (spot-check critical aggregates: total revenue, active user count, order counts by status). Automated validation scripts run nightly during the parallel period. Any mismatch triggers investigation before cutover is approved. Never declare migration complete on row counts alone — business-logic validation catches data type conversion errors that row counts miss."
      }
    ],
    related: ["2.2.01", "2.6.03", "6.4.01", "3.7.01", "2.5.01"],
    has_diagram: false,
    has_code: false,
    tags: ["database-migration","oracle","postgresql","cdc","aws-dms","schema-conversion","cutover","parallel-run","rollback"]
  },

  {
    id: "11.3.03",
    section: 11,
    subsection: "11.3",
    level: "intermediate",
    question: "Your company has 40 applications running on on-premises bare-metal servers. The CTO wants everything in AWS within 18 months. How do you decide which migration strategy to apply to each application, and what does the migration roadmap look like?",
    quick_answer: "→ Classify each app: Lift-and-shift (rehost) → Re-platform → Re-architect → Retire → Retain\n→ Apply the 6 R's framework per application based on business criticality and technical debt level\n→ Start with stateless, low-risk apps to build team capability and tooling\n→ Migrate databases last — they carry the most risk and need the longest parallel run period\n→ Run a pilot migration of 2–3 apps before committing the full roadmap",
    detailed_answer: "Not all 40 applications warrant the same migration effort. The 6 R's framework classifies each application and sets the strategy.\n\nThe 6 R's:\n- Rehost (lift-and-shift): move the app to EC2 with minimal changes. Fastest, cheapest short-term, but carries all existing technical debt. Right for: stable, low-change apps with near-term retirement plans, or apps needing quick migration to meet a data-centre exit deadline.\n- Replatform: minor optimisations without rearchitecting. Example: move from Tomcat-on-EC2 to ECS containers, or move MySQL to RDS. Get cloud-managed benefits (patching, backups) without rewriting code.\n- Repurchase: replace with a SaaS product. CRM → Salesforce, HR → Workday. Right for commodity business functions.\n- Re-architect: significant rework to exploit cloud-native features — breaking a monolith into microservices, switching to serverless, or redesigning for horizontal scaling. Highest cost and risk; right for strategic, high-traffic, high-change systems.\n- Retire: decommission — the app provides no business value. Discovery interviews often reveal 15–25% of apps in this category.\n- Retain: keep on-prem. Regulatory requirement, extreme latency sensitivity, or not worth the migration effort. Candidate for direct connection via Direct Connect.\n\nRoadmap structure:\n- Month 1–2: Discovery. Inventory all 40 apps. Classify by: business criticality, data sensitivity, external dependencies, technical debt level, and estimated migration complexity. Apply the 6 R's.\n- Month 3–4: Pilot. Select 2–3 low-risk, low-traffic apps. Run full migrations end-to-end. Use these to build team capability, validate tooling (AWS Migration Hub, CloudEndure), and discover surprises.\n- Month 5–12: Core migrations. Work in waves of 5–8 apps per wave. Stateless, rehost-friendly apps first. Each wave ends with a lessons-learned retrospective before the next begins.\n- Month 13–17: Complex migrations. Databases, monoliths requiring re-architecture, and apps with complex dependencies.\n- Month 18: Clean up on-premises infrastructure. Terminate data centre contracts.\n\nCritical success factors: Direct Connect (or VPN) between on-prem and AWS for the transition period — apps often have on-prem dependencies that cannot migrate simultaneously. Landing zone account structure established in month 1 (VPC, IAM, logging, security baseline). A cloud centre of excellence (CCoE) with 2–3 engineers dedicated to migration tooling and standards.\n\nSections covered: 5.1 (cloud provider concepts), 5.6 (multi-cloud & hybrid — during transition), 10.3 (build vs buy decisions — repurchase strategy), 1.5 (monolith to microservices — re-architect track)",
    key_points: [
      "6 R's: Rehost / Replatform / Repurchase / Re-architect / Retire / Retain — apply per application",
      "Retire 15–25% of apps during discovery — this alone reduces scope significantly",
      "Pilot 2–3 low-risk apps first — builds team skill and surfaces hidden dependencies",
      "Wave-based migration: stateless and simple first, databases and monoliths last",
      "Direct Connect established on day 1 — apps migrate one-by-one, not all at once",
      "Landing zone (accounts, VPC, IAM baseline) must be complete before wave 1"
    ],
    hint: "Why is it usually wrong to apply the same migration strategy to all 40 applications?",
    common_trap: "Treating all 40 applications as lift-and-shift to hit the deadline — you pay cloud prices for on-prem architectures, often 3–5× more expensive than right-sized cloud-native equivalents, with none of the cloud benefits.",
    follow_up_questions: [
      {
        text: "What is a cloud landing zone and why does it matter?",
        type: "linked",
        links_to: "5.1.02",
        mini_answer: "A landing zone is a pre-configured multi-account AWS environment with baseline guardrails: account structure (separate accounts for prod, staging, security, logging), networking (VPC, subnets, transit gateway), IAM policies, centralised logging (CloudTrail, Config), and security baselines (GuardDuty, Security Hub). It must exist before any application migration — without it, each team sets up their own account differently, creating governance and security debt that's expensive to fix later. AWS Control Tower automates landing zone setup."
      },
      {
        text: "How do you handle on-premises dependencies during migration?",
        type: "inline",
        mini_answer: "Map dependencies before migrating anything. Tools: AWS Application Discovery Service scans on-prem servers for network connections and identifies what talks to what. Direct Connect (or Site-to-Site VPN) provides low-latency connectivity between on-prem and AWS VPC during the transition. Apps that depend on on-prem systems (legacy mainframes, on-prem APIs) are migrated last — after their dependencies are resolved or a network path exists. Never migrate an app that has unresolved on-prem dependencies."
      }
    ],
    related: ["5.1.01", "5.6.01", "10.3.01", "1.5.01", "5.8.01"],
    has_diagram: false,
    has_code: false,
    tags: ["cloud-migration","6rs","lift-and-shift","replatform","re-architect","aws","landing-zone","roadmap","on-premises"]
  },

  {
    id: "11.3.04",
    section: 11,
    subsection: "11.3",
    level: "advanced",
    question: "You need to add a NOT NULL column to a PostgreSQL table with 200 million rows and 5,000 writes/second. The application cannot tolerate more than 30 seconds of downtime. How do you do it?",
    quick_answer: "→ Never add NOT NULL directly on a large table — the full table rewrite locks it for minutes\n→ Step 1: add as nullable column with a DEFAULT, no rewrite needed\n→ Step 2: backfill in small batches to avoid lock escalation\n→ Step 3: add a CHECK constraint (NOT VALID), then VALIDATE CONSTRAINT\n→ Step 4: mark NOT NULL only after validation — takes milliseconds, not minutes",
    detailed_answer: "Adding NOT NULL to a 200M-row table naively requires a full table scan and rewrite, which holds an ACCESS EXCLUSIVE lock for 10–30 minutes and causes a complete outage. The goal is to achieve the same logical constraint with only millisecond-level locks.\n\nPostgres 11+ shortcut: In Postgres 11+, adding a column with a NOT NULL DEFAULT does not rewrite the table — the default is stored in metadata and applied on read. This is the simplest path if you control the Postgres version. However, you still need to backfill existing rows.\n\nStep-by-step for any version:\n\nStep 1 — Add as nullable (immediate, no lock):\n```sql\nALTER TABLE orders ADD COLUMN status_code TEXT;\n```\nThis acquires a brief ACCESS EXCLUSIVE lock (milliseconds) and adds the column as nullable. No table rewrite. Safe at 5,000 writes/second.\n\nStep 2 — Backfill in batches:\nUpdate rows in batches of 10,000–50,000 using a cursor or ID range loop. Each batch takes a brief row-level lock, not a table lock. Run with a short pause between batches to avoid replication lag on replicas. Monitor lag during backfill. This step takes 30–120 minutes for 200M rows — schedule during off-peak, but the table remains fully available.\n\nStep 3 — Add a CHECK constraint with NOT VALID:\n```sql\nALTER TABLE orders ADD CONSTRAINT orders_status_code_not_null\n  CHECK (status_code IS NOT NULL) NOT VALID;\n```\nNOT VALID skips the validation scan — the constraint is enforced for future writes immediately, but existing rows are not checked yet. This prevents new NULL values while the backfill continues.\n\nStep 4 — Validate the constraint (ShareUpdateExclusiveLock, not exclusive):\n```sql\nALTER TABLE orders VALIDATE CONSTRAINT orders_status_code_not_null;\n```\nThis scans the table for violations but acquires a ShareUpdateExclusiveLock — it does not block reads or writes. It runs concurrently with production traffic.\n\nStep 5 — Promote to NOT NULL:\nOnce the constraint is validated, Postgres knows no rows violate it:\n```sql\nALTER TABLE orders ALTER COLUMN status_code SET NOT NULL;\n```\nWith the validated constraint, Postgres skips the table scan and this completes in milliseconds.\n\nApplication code changes run in parallel: update the app to always write status_code before the constraint is enforced. Deploy the app change before step 3.\n\nTotal downtime: near zero. The only brief lock is step 1 (milliseconds) and step 5 (milliseconds). The rest runs concurrently.\n\nSections covered: 2.2 (relational databases), 6.4 (deployment strategies — zero-downtime), 3.2 (availability & reliability — zero-downtime ops), 4.5 (data consistency patterns)",
    key_points: [
      "ALTER TABLE ADD COLUMN is fast; ALTER TABLE SET NOT NULL on a large table is not",
      "NOT VALID constraint blocks new NULLs immediately without scanning existing rows",
      "VALIDATE CONSTRAINT uses ShareUpdateExclusiveLock — concurrent with reads and writes",
      "Once constraint is validated, SET NOT NULL is a metadata-only operation (milliseconds)",
      "Backfill in batches of 10k–50k rows with pauses to avoid replication lag",
      "Always deploy app changes to write the new column before enforcing the constraint"
    ],
    hint: "What lock does a standard ALTER TABLE SET NOT NULL acquire, and why is that a problem on a large table?",
    common_trap: "Using ALTER TABLE orders ALTER COLUMN x SET NOT NULL directly on a large table — this acquires ACCESS EXCLUSIVE lock and rewrites the entire table, causing minutes of downtime.",
    follow_up_questions: [
      {
        text: "How do you handle a schema migration when you have read replicas?",
        type: "inline",
        mini_answer: "Schema changes replicate from primary to replicas via WAL. The concern is replication lag — if a schema change involves a table rewrite (avoid this), the replica falls behind the primary. For safe schema changes (add nullable column, add index CONCURRENTLY), replicas keep up easily. Monitor replication lag during any migration step. For long backfill operations, pause or slow the batch rate if replica lag exceeds an acceptable threshold (e.g., 30s). Never run schema changes during peak traffic on tables that have active replicas with tight RPO requirements."
      },
      {
        text: "When would you use a blue-green deployment instead of an in-place migration?",
        type: "linked",
        links_to: "6.4.01",
        mini_answer: "When the schema change is too risky to run in-place or requires application and DB changes to be atomic. Blue-green DB: provision a new DB from a snapshot, apply schema changes, replicate live changes via CDC, swap the application connection string on cutover. This gives full rollback capability — if the new schema causes issues, point back to the original DB. Cost: you maintain two DB instances during the transition. Worth it for high-risk migrations or regulatory environments requiring zero-risk rollback."
      }
    ],
    related: ["2.2.01", "6.4.01", "3.2.01", "4.5.01", "2.6.01"],
    has_diagram: false,
    has_code: true,
    code_language: "sql",
    code_snippet: `-- Zero-downtime NOT NULL column addition on 200M row table

-- Step 1: Add nullable (millisecond lock)
ALTER TABLE orders ADD COLUMN status_code TEXT;

-- Step 2: Backfill in batches (table stays live throughout)
DO $$
DECLARE
  batch_start BIGINT := 0;
  batch_end   BIGINT;
  batch_size  BIGINT := 50000;
BEGIN
  LOOP
    SELECT id INTO batch_end
    FROM orders WHERE id > batch_start
    ORDER BY id LIMIT 1 OFFSET batch_size;

    EXIT WHEN batch_end IS NULL;

    UPDATE orders
    SET status_code = 'ACTIVE'
    WHERE id > batch_start AND id <= batch_end
      AND status_code IS NULL;

    batch_start := batch_end;
    PERFORM pg_sleep(0.05);  -- 50ms pause between batches
  END LOOP;
END $$;

-- Step 3: Enforce for new rows without scanning (instant)
ALTER TABLE orders
  ADD CONSTRAINT orders_status_code_not_null
  CHECK (status_code IS NOT NULL) NOT VALID;

-- Step 4: Validate concurrently (ShareUpdateExclusiveLock — no blocking)
ALTER TABLE orders VALIDATE CONSTRAINT orders_status_code_not_null;

-- Step 5: Promote to NOT NULL (metadata only — milliseconds)
ALTER TABLE orders ALTER COLUMN status_code SET NOT NULL;
ALTER TABLE orders DROP CONSTRAINT orders_status_code_not_null;`,
    tags: ["postgresql","schema-migration","not-null","zero-downtime","backfill","access-exclusive-lock","constraint","large-table"]
  },

  {
    id: "11.3.05",
    section: 11,
    subsection: "11.3",
    level: "advanced",
    question: "Your payment processing system uses synchronous REST calls between 8 services. Latency compounds with each hop and a single slow service blocks the entire chain. You want to migrate to event-driven architecture. How do you do it without breaking the system?",
    quick_answer: "→ Map the synchronous call chain and identify which calls need an immediate response vs which are fire-and-forget\n→ Start with the tail calls — migrate the least critical, most isolated interactions first\n→ Introduce the event bus (Kafka) alongside existing REST endpoints — don't remove them yet\n→ Use dual-write during transition: write to Kafka and REST simultaneously, compare results\n→ Keep synchronous calls for operations that genuinely require an immediate response (balance check, fraud score)",
    detailed_answer: "Not every synchronous call should become asynchronous. The first step is classifying calls by whether the caller genuinely needs a synchronous response.\n\nCall classification:\n- Needs immediate response: fraud check (you need the score to proceed), balance check (you need the balance to authorise), authentication. These stay synchronous.\n- Does not need immediate response: sending a confirmation email, updating analytics, writing audit logs, triggering downstream notifications. These are natural event candidates.\n\nMigration approach — incremental extraction:\n\nPhase 1 — Identify and isolate fire-and-forget calls. In the current system, even notification calls are synchronous. Extract these first. Add a Kafka topic alongside the existing REST call: the caller publishes to Kafka, the notification service consumes. Keep the REST call temporarily active as a fallback. Monitor both paths. Once Kafka path is proven (2 weeks), disable the REST path.\n\nPhase 2 — Decouple write-heavy downstream services. The order confirmation flow writes to 4 downstream services synchronously. Convert to event-driven: payment service publishes an OrderConfirmed event; order fulfilment, inventory, and analytics services consume independently. Each can fail and retry independently without blocking the payment response. The payment service now responds to the user immediately after publishing the event, not after all 4 downstream operations complete.\n\nPhase 3 — Handle reliability. With async event delivery, you need: at-least-once delivery guarantees (Kafka's default), idempotent consumers (processing the same event twice must be safe), and dead-letter topics for messages that fail after N retries.\n\nPhase 4 — Saga for multi-step operations. A payment spanning multiple services (authorise → capture → fulfil → notify) becomes a saga. Each step publishes an event; the next service consumes and proceeds. Compensating events handle failures (e.g., FulfillmentFailed → RefundInitiated).\n\nWhat stays synchronous: fraud scoring, balance checks, anything where the user is waiting for a response that requires real-time data. Request-reply over Kafka (reply-to topic pattern) is possible but complex — prefer REST for these.\n\nSections covered: 1.3 (event-driven architecture), 4.3 (messaging patterns — Kafka, events), 4.4 (integration patterns — strangler fig applied to APIs), 1.4 (API design — when REST vs events)",
    key_points: [
      "Classify calls first: immediate-response-required vs fire-and-forget — only the latter migrate cleanly",
      "Dual-write during transition: Kafka + REST in parallel, compare results before cutting over",
      "Idempotent consumers are mandatory — at-least-once delivery means duplicates will arrive",
      "Dead-letter topics prevent a bad message blocking the entire consumer",
      "Saga pattern replaces distributed synchronous chains with compensating event sequences",
      "Some operations genuinely need synchronous response (fraud score, balance check) — keep them"
    ],
    hint: "Which calls in a payment chain genuinely require a synchronous response, and which are just synchronous by historical accident?",
    common_trap: "Migrating everything to async and discovering that the user-facing checkout flow now has no way to report fraud rejection — some operations have hard synchronous requirements that event-driven cannot satisfy without request-reply complexity.",
    follow_up_questions: [
      {
        text: "How does the saga pattern handle a payment failure mid-chain?",
        type: "linked",
        links_to: "4.5.02",
        mini_answer: "In a choreography saga: PaymentAuthorised event triggers FulfilmentService. If FulfilmentFailed is published, PaymentService consumes it and publishes RefundInitiated. Each service publishes compensating events on failure. In an orchestration saga: a central coordinator (SagaOrchestrator) tracks state and issues compensating commands directly. Choreography is simpler for small sagas; orchestration is better when the flow is complex or needs a visible state machine for debugging."
      },
      {
        text: "What's the right way to ensure idempotency in an event consumer?",
        type: "inline",
        mini_answer: "Include a unique idempotency key in every event (event ID or correlation ID). The consumer stores processed event IDs in a DB or Redis. On receipt, check if the event ID was already processed — if yes, skip. If no, process and store the ID atomically (within the same DB transaction as the business effect). For Kafka consumers, the combination of topic + partition + offset uniquely identifies an event and can serve as the idempotency key."
      }
    ],
    related: ["1.3.01", "4.3.01", "4.5.02", "4.4.01", "1.4.01"],
    has_diagram: false,
    has_code: false,
    tags: ["event-driven","migration","kafka","saga","synchronous-to-async","idempotency","rest","payment","dual-write"]
  },

  {
    id: "11.3.06",
    section: 11,
    subsection: "11.3",
    level: "advanced",
    question: "Your analytics team runs a nightly batch ETL that takes 6 hours, loads data 18 hours stale, and frequently fails mid-run. The business wants near-real-time data. Design the migration from batch to streaming.",
    quick_answer: "→ Identify which parts of the batch pipeline map cleanly to streaming (most do) vs which need re-architecture\n→ Use CDC (Debezium) to capture source DB changes as events — replaces the batch extract step\n→ Kafka as the event backbone; stream processing (Flink or Kafka Streams) replaces batch transforms\n→ Migrate incrementally: add streaming path alongside batch, compare output, retire batch last\n→ Handle late-arriving data with watermarks and windowing rather than the batch's implicit ordering",
    detailed_answer: "Batch-to-streaming is not just a technical change — it changes how the business defines 'current' data and how the pipeline handles errors. Start by understanding why the batch fails and what the business actually needs.\n\nAssessment:\n- Extract step: reads 12 hours of data from an OLTP database with a full table scan. This is the performance problem — it hits the production DB hard and runs for 2 hours.\n- Transform step: SQL joins and aggregations. 2 hours. Complex but deterministic.\n- Load step: bulk insert into the data warehouse. 2 hours. Slow due to index rebuilds.\n\nStreaming architecture:\n\n1. Replace Extract with CDC. Debezium captures every INSERT/UPDATE/DELETE from the source Postgres/MySQL and publishes to Kafka topics. Each change arrives in Kafka within <1 second of the DB write. Zero impact on source DB (reads the WAL, not the tables).\n\n2. Replace Transform with a stream processor. Flink (or Kafka Streams for simpler cases) consumes the Kafka topics, applies joins and aggregations using time windows. A 1-hour window aggregate is computed continuously, not in a 2-hour batch. Results are written to a sink (data warehouse, Elasticsearch, or real-time dashboard store).\n\n3. Replace Load with incremental writes. Stream processors write results incrementally as windows close. No bulk index rebuilds — the data warehouse (Redshift, BigQuery, ClickHouse) receives a continuous stream of small writes.\n\nHandling late data: streaming pipelines receive events out of order (network delays, producer lag). Use event-time watermarks in Flink: define a maximum allowed lateness (e.g., 5 minutes), and trigger window aggregations once the watermark passes the window end. Late events within the allowance are included; events beyond the allowance are routed to a late-events topic for separate handling.\n\nMigration strategy — parallel run:\n1. Deploy CDC and Kafka without changing the batch pipeline.\n2. Build the streaming pipeline targeting a shadow output table.\n3. Run both for 2 weeks. Compare output — streaming result vs batch result — using automated validation queries.\n4. Once outputs match within acceptable tolerance, switch analytics dashboards to the streaming output.\n5. Keep the batch pipeline running for 2 more weeks as a backup. Retire after confirmation.\n\nFailure modes change: batch has one big failure; streaming has small, continuous failures. Invest in dead-letter topics, alerting on consumer lag, and replayability (Kafka retains 7 days by default).\n\nSections covered: 8.1 (data pipeline design), 8.2 (stream processing — Flink, Kafka Streams), 4.3 (messaging patterns — Kafka), 3.4 (performance & latency — 18h to near-real-time)",
    key_points: [
      "CDC (Debezium) replaces the batch extract — eliminates the source DB load and the 18-hour delay",
      "Stream processing with time windows replaces batch SQL transforms incrementally",
      "Parallel run for 2 weeks with output comparison is mandatory before retiring batch",
      "Late-arriving data requires watermarks — streaming does not have batch's implicit ordering",
      "Failure model changes: batch = one big failure; streaming = small continuous failures requiring DLT",
      "Streaming pipelines are replayable — Kafka retention means you can reprocess from any offset"
    ],
    hint: "How does a streaming pipeline handle data that arrives out of order? How did the batch pipeline handle this, and why was that simpler?",
    common_trap: "Migrating to streaming and discovering the downstream BI tool cannot handle incremental updates — it was designed for full refresh from the batch load. The data consumer must be migrated alongside the pipeline.",
    follow_up_questions: [
      {
        text: "How does Flink's watermark mechanism handle late events?",
        type: "linked",
        links_to: "8.2.02",
        mini_answer: "Flink assigns event timestamps from the message payload (not ingestion time). A watermark is a timestamp that says 'I believe all events up to this time have arrived.' Flink emits a watermark periodically based on the maximum seen event timestamp minus an allowed lateness bound (e.g., 5 minutes). Windows are triggered when the watermark passes the window end time. Events arriving after the window is triggered but within the late tolerance are added to the already-emitted result via side outputs or re-emission. Events beyond the tolerance go to a late-data stream for separate handling."
      },
      {
        text: "When is batch still the right choice over streaming?",
        type: "inline",
        mini_answer: "When the computation requires a complete dataset that cannot be derived from a stream — global sorts, exact distinct counts across all history, complex joins across the full historical dataset. Also when 'real-time' isn't actually a business requirement: daily cost reports, monthly reconciliation. And when the total data volume is too large for streaming infrastructure cost to be justified. Batch is simpler to reason about and test. Use streaming only when latency genuinely matters to the business outcome."
      }
    ],
    related: ["8.1.01", "8.2.01", "8.2.02", "4.3.01", "3.4.01"],
    has_diagram: true,
    diagram: `Batch → Streaming Migration

BEFORE (batch, 6h cycle):
Source DB ──(full scan every 6h)──► ETL Job ──► Data Warehouse
                                     (6h)        (18h stale)

AFTER (streaming, <1min latency):
Source DB ──► Debezium CDC ──► Kafka Topics ──► Flink / Kafka Streams
  (WAL read)   (<1s latency)                     (windowed aggregation)
                                                       │
                                                       ▼
                                              ClickHouse / Redshift
                                              (<1 min fresh)

MIGRATION (parallel run — 2 weeks):
Source DB ──► CDC ──► Kafka ──► Flink ──► shadow_output_table ─┐
    │                                                            ├─ compare
    └──────(batch, still running)──────────────────────────────►┘`,
    has_code: false,
    tags: ["batch-to-streaming","cdc","debezium","kafka","flink","etl","data-pipeline","watermark","late-data","migration"]
  },

  {
    id: "11.3.07",
    section: 11,
    subsection: "11.3",
    level: "advanced",
    question: "Your 8 microservices all share a single PostgreSQL database — a shared-schema monolithic DB. You need to give each service its own database to enable independent deployments and scaling. How do you decompose it without downtime?",
    quick_answer: "→ Map which tables each service owns vs which are shared — this reveals the actual coupling\n→ Migrate one service at a time, starting with the most isolated (fewest cross-service joins)\n→ Replace cross-service DB joins with service-to-service API calls or event-driven sync\n→ Use the strangler fig: route the service to its new DB while keeping the old shared DB as fallback\n→ Accept eventual consistency for cross-service data — this is a fundamental trade-off, not a bug",
    detailed_answer: "A shared database is the most common anti-pattern in 'microservices' systems. Every service can query and modify every table, creating invisible coupling. The goal is to give each service exclusive ownership of its data — no other service touches its tables directly.\n\nStep 1 — Ownership mapping. Create a table-ownership matrix: for each table, which service is the authoritative writer? Tables written by multiple services are the high-risk shared state. Tables only read by other services are simpler — they can be replaced by an API call or a replicated copy.\n\nStep 2 — Eliminate cross-service writes first. If OrderService and InventoryService both write to the inventory table, pick one owner (InventoryService) and replace the OrderService writes with API calls to InventoryService. This changes runtime behaviour but not yet the DB layout. Each cross-service write elimination is a separate deployable change.\n\nStep 3 — Migrate the first service (most isolated). Pick the service with the least cross-service join dependencies. Provision a new PostgreSQL instance for it. Migrate its tables using pg_dump/pg_restore or DMS. Set up replication from old to new DB during transition. Update the service to point to its new DB. Keep the old tables in the shared DB — do not delete them until the service is stable (2–4 weeks). Then remove them from the shared DB.\n\nStep 4 — Handle cross-service queries. Cross-service JOINs in the shared DB must be eliminated. Options:\n- Replace with API calls: instead of joining orders and users in one SQL query, call UserService API to get user data for a given user ID.\n- Event-driven replication: InventoryService publishes ItemUpdated events; OrderService maintains a local denormalised copy of inventory data it needs. Accepts eventual consistency.\n- CQRS read model: for complex reporting queries that join multiple service domains, maintain a read-optimised materialised view (an aggregated query DB) populated by events from multiple services.\n\nStep 5 — Iterate. Repeat for each service. Migration takes 6–18 months for 8 services done safely. Resist the urge to migrate all services simultaneously.\n\nThe fundamental shift: cross-service consistency goes from ACID (single DB transaction) to eventual. This is not a technical compromise — it is the correct model for a distributed system. Design business operations to tolerate it.\n\nSections covered: 1.2 (microservices architecture), 2.5 (data modeling), 4.5 (data consistency patterns — eventual consistency), 2.7 (CQRS & event sourcing — read models)",
    key_points: [
      "Start with table ownership mapping — multiple writers on one table reveals dangerous coupling",
      "Eliminate cross-service writes before migrating the DB — changes behaviour, not schema",
      "Migrate one service at a time, most isolated first; never attempt all simultaneously",
      "Replace cross-service JOINs with API calls or event-driven denormalised copies",
      "Keep old tables in shared DB as fallback for 2–4 weeks after service migration",
      "Eventual consistency across service boundaries is the correct model — not a compromise"
    ],
    hint: "Before you move any data to a new database, what hidden cross-service dependencies exist that will break when you do?",
    common_trap: "Migrating the database schema first, then discovering the application code has hundreds of cross-service joins hardwired into SQL — the code changes are the hard part, not the DB migration.",
    follow_up_questions: [
      {
        text: "How do you handle reporting queries that used to join 5 tables across services?",
        type: "linked",
        links_to: "2.7.01",
        mini_answer: "Build a dedicated read model using CQRS. Each service publishes events to Kafka. A reporting service (or a Flink job) consumes events from all services and maintains a denormalised, query-optimised read store (e.g., Elasticsearch or a read-optimised PostgreSQL DB). The reporting queries hit the read store, not the individual service databases. The read model is eventually consistent — updated within seconds of the source events. This is the recommended pattern for cross-domain reporting in microservices."
      },
      {
        text: "How long should you keep the old shared database running alongside the new per-service databases?",
        type: "inline",
        mini_answer: "Until you have confirmed the new service's data is consistent and complete for at least one full business cycle (typically 2–4 weeks for most systems, or one billing period for financial systems). During this period, old tables remain in the shared DB but the service no longer writes to them — they are read-only backups. Monitor for any unexpected reads from other services against those tables. Drop them only after the observation period with zero anomalies. Never rush the decommission — the cost of keeping a table is zero; the cost of losing data is unbounded."
      }
    ],
    related: ["1.2.01", "2.5.01", "4.5.01", "2.7.01", "1.5.01"],
    has_diagram: false,
    has_code: false,
    tags: ["shared-database","microservices","database-decomposition","ownership","cqrs","eventual-consistency","migration","strangler-fig"]
  },

  {
    id: "11.3.08",
    section: 11,
    subsection: "11.3",
    level: "intermediate",
    question: "Your application runs on bare-metal servers with manual deployments via SSH and shell scripts. You want to containerise it and migrate to Kubernetes. What are the steps and what are the risks?",
    quick_answer: "→ Containerise the app first (Dockerfile + local Docker test) before touching orchestration\n→ Externalise all configuration as environment variables — containers must be stateless\n→ Migrate stateless services first; handle stateful components (DBs) separately\n→ Start with a non-production environment in Kubernetes, build operational muscle before prod\n→ Migrate incrementally using a load balancer to split traffic between bare-metal and Kubernetes",
    detailed_answer: "Containerisation and Kubernetes adoption is a platform change, not just a technical migration. The people and process changes are as important as the technical ones.\n\nPhase 1 — Containerise (before any Kubernetes work).\nWrite a Dockerfile for each service. Test it locally: `docker build`, `docker run`, verify the app starts and serves requests. Common issues at this stage: hardcoded file paths, config baked into the binary instead of read from environment, assumptions about local filesystem (log files, temp files, session files). Fix these first — the 12-factor app principles are your guide.\n\nKey containerisation rules:\n- Config via environment variables (DATABASE_URL, not hardcoded strings)\n- Logs to stdout/stderr, not files\n- Stateless process — no local file storage for state. If the app currently writes to local disk (uploads, temp files), migrate to S3/blob storage.\n- Health check endpoint: /health or /readiness that returns 200 when the app is ready to serve traffic\n\nPhase 2 — Build the Kubernetes baseline.\nStart in a non-production environment. Write Deployments, Services, and ConfigMaps. Learn the tooling: kubectl, Helm, and your chosen cluster management tool (EKS, GKE, or kubeadm). Run the containerised app in Kubernetes non-prod for 4–8 weeks to build team familiarity.\n\nPhase 3 — Stateless services first to Kubernetes production.\nMigrate the web/API tier. Use a load balancer (ALB or Nginx) to split traffic: 10% Kubernetes, 90% bare-metal. Gradually increase the Kubernetes percentage as confidence grows. This is a canary deployment across infrastructure layers. Bare-metal remains fully operational throughout.\n\nPhase 4 — Stateful services.\nDatabases should not run in Kubernetes unless the team has significant Kubernetes storage expertise. Migrate DBs to managed services (RDS, CloudSQL) instead. This is almost always the better trade-off. If there is a genuine reason to run DBs in Kubernetes (cost, regulatory), use StatefulSets with persistent volumes, and invest in a PostgreSQL operator (CloudNativePG or Zalando Postgres Operator).\n\nPhase 5 — Decommission bare-metal.\nOnly after 30+ days of stable Kubernetes production operation with no incidents attributable to the platform migration. Monitor resource costs — Kubernetes infrastructure is often more expensive than bare-metal unless the team actively right-sizes resources.\n\nRisks:\n- Resource requests/limits misconfigured — OOMKill or CPU throttling with no visibility\n- Networking: service discovery changes (DNS-based in Kubernetes vs hardcoded IPs on bare-metal)\n- Secret management: SSH keys and config files on bare-metal vs Kubernetes Secrets / Vault\n\nSections covered: 6.2 (containerisation), 6.3 (container orchestration — Kubernetes), 5.2 (compute), 6.4 (deployment strategies — canary across infra tiers)",
    key_points: [
      "Containerise and test locally before touching Kubernetes — fix all stateful assumptions first",
      "12-factor: config via env vars, logs to stdout, stateless process — three non-negotiables",
      "Build in non-prod Kubernetes for 4–8 weeks before attempting production migration",
      "Split traffic with a load balancer — canary migration between bare-metal and Kubernetes",
      "Run databases on managed services, not in Kubernetes, unless you have deep storage expertise",
      "Decommission bare-metal only after 30+ days of stable Kubernetes prod operation"
    ],
    hint: "What would happen to a containerised app that writes session data to local disk when Kubernetes restarts its pod?",
    common_trap: "Running databases in Kubernetes on the first migration attempt — Kubernetes storage and stateful workloads require deep expertise. Start with stateless services; use managed DB services for the data tier.",
    follow_up_questions: [
      {
        text: "How do resource requests and limits work in Kubernetes?",
        type: "linked",
        links_to: "6.3.02",
        mini_answer: "Requests are the guaranteed minimum CPU/memory the scheduler reserves for the pod — used for scheduling decisions. Limits are the maximum the container is allowed to use. Exceeding memory limit = OOMKill (immediate pod restart). Exceeding CPU limit = throttling (slower, not killed). Common mistake: setting requests too low (pods get scheduled but starved under load) or limits too low (OOMKills under traffic spikes). Set requests based on observed baseline; set limits at 2–3× the p99 observed usage. Use VPA (Vertical Pod Autoscaler) to refine over time."
      },
      {
        text: "How do you handle secret rotation for containerised apps?",
        type: "linked",
        links_to: "7.5.01",
        mini_answer: "Kubernetes Secrets stored as base64 are not encrypted at rest by default — enable etcd encryption. For production, use a secret manager (HashiCorp Vault, AWS Secrets Manager) with a Kubernetes sidecar (Vault Agent Injector or Secrets Store CSI Driver) to inject secrets as environment variables or mounted files. Rotation: update the secret in Vault; the CSI driver syncs to the pod's mounted file. For env var injection, a pod restart is required. Design apps to re-read credentials from disk periodically rather than caching them at startup."
      }
    ],
    related: ["6.2.01", "6.3.01", "6.4.01", "5.2.01", "7.5.01"],
    has_diagram: false,
    has_code: true,
    code_language: "yaml",
    code_snippet: `# Minimal Kubernetes Deployment for a containerised app
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-service
  template:
    metadata:
      labels:
        app: api-service
    spec:
      containers:
        - name: api-service
          image: myrepo/api-service:1.2.3   # pinned tag, never latest
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: api-secrets
                  key: database-url
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "1"
              memory: "512Mi"
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 15`,
    tags: ["kubernetes","containerisation","docker","bare-metal","migration","stateless","12-factor","canary","helm"]
  },

  // ── 11.4 Diagnose Production Incidents ─────────────────────────────────

  {
    id: "11.4.01",
    section: 11,
    subsection: "11.4",
    level: "advanced",
    question: "It is 2am. PagerDuty fires: your e-commerce site is returning 5xx errors for all users. Revenue impact is £50k/minute. Walk me through exactly what you do in the first 30 minutes.",
    quick_answer: "→ Acknowledge, assemble the incident team, open a war-room channel immediately\n→ Establish: when did it start, what changed (deployments, config, infra) in the last 2 hours?\n→ Check dashboards top-down: load balancer → app tier → database → external dependencies\n→ Contain first, diagnose second — roll back the most recent change if one exists\n→ Communicate status to stakeholders every 10 minutes throughout",
    detailed_answer: "Incident response is a process, not improvised heroics. At £50k/minute, speed of recovery beats completeness of diagnosis.\n\nMinutes 0–5 — Acknowledge and coordinate.\nAcknowledge the PagerDuty alert (stops escalation). Open an incident war-room channel (Slack #incident-YYYYMMDD-HH). Declare incident severity (P1 — revenue impacting). Page the on-call engineer and the incident commander (IC). The IC's job is coordination, not debugging — they track actions and own communication. Engineers debug.\n\nMinutes 5–10 — Establish the blast radius and timeline.\nIs this all users or a subset? All regions or one? All endpoints or specific ones? Check the load balancer access logs for error rate by endpoint. Check when error rate started rising — this gives the incident start time, which narrows the change search window.\n\nAsk immediately: what changed in the last 2 hours? Deployments, config pushes, feature flag changes, database migrations, infrastructure changes. This is your highest-probability root cause. If a deployment happened 15 minutes before the incident, roll it back now — don't wait for diagnosis confirmation.\n\nMinutes 10–20 — Top-down diagnostic pass.\nFollow the request path: Client → Load Balancer → App Tier → Database/Cache/Queues → External Dependencies.\n- Load balancer: is it passing traffic? Healthy target count? SSL cert expiry?\n- App tier: are pods/instances running? CPU/memory? Application logs showing exceptions?\n- Database: connection count, query latency, lock waits, disk usage?\n- Cache (Redis): is it reachable? Hit rate normal?\n- External APIs: is a third-party dependency (payment gateway, auth provider) down?\n\nCheck each hop and stop where you find the anomaly — that's the layer to focus on.\n\nMinutes 20–30 — Contain and restore.\nContainment options in priority order:\n1. Roll back the last deployment (fastest recovery if it's the cause)\n2. Enable maintenance mode or a static fallback page (stops revenue loss signal, buys time)\n3. Restart unhealthy pods/instances (helps if it's a memory leak or deadlock)\n4. Scale up the affected tier (if the problem is capacity)\n5. Disable a specific feature (if one endpoint is causing the cascade)\n\nCommunication: the IC sends an update every 10 minutes to the #incident channel and a summary to leadership. Communication stops the noisy 'what's the status?' questions and lets engineers focus.\n\nPost-incident: root cause analysis (RCA) within 48 hours. Blameless post-mortem. Three outputs: what happened, what mitigated it, what changes prevent recurrence.\n\nSections covered: 3.6 (observability requirements), 6.8 (observability implementation — dashboards, alerting), 3.2 (availability & reliability — incident response), 3.3 (fault tolerance — containment strategies)",
    key_points: [
      "Incident commander (coordinator) and engineer (debugger) are separate roles — never let the same person do both",
      "Establish incident start time first — narrows the change search to a known window",
      "Roll back before diagnosing if a recent change correlates with the incident start",
      "Top-down diagnostic: load balancer → app → DB → cache → external dependencies",
      "Communicate status every 10 minutes — silence creates noise that slows engineers down",
      "Containment first, root cause second — restore revenue, then understand why"
    ],
    hint: "When you have a P1 incident with multiple engineers in a room, what is the biggest risk to the speed of resolution?",
    common_trap: "Deep-diving on root cause diagnosis before attempting containment — spending 20 minutes understanding why it broke while it is still broken at £50k/minute. Contain first, explain later.",
    follow_up_questions: [
      {
        text: "How should you structure a post-incident review to prevent recurrence?",
        type: "inline",
        mini_answer: "Blameless post-mortem within 48 hours. Five sections: (1) Timeline — factual sequence of events and actions. (2) Root cause — the technical reason the failure occurred. (3) Contributing factors — conditions that made it possible or worse. (4) What went well — detection speed, containment, comms. (5) Action items — concrete changes with owners and due dates. Each action item is either: prevent the incident from occurring, improve detection speed, or reduce recovery time. No action items = the post-mortem failed."
      },
      {
        text: "What observability signals would have caught this incident before users noticed?",
        type: "linked",
        links_to: "3.6.01",
        mini_answer: "Error rate SLO alert: fire when 5xx rate exceeds 1% of requests for 2 consecutive minutes — catches the incident 10–15 minutes before it becomes total. Synthetic monitoring: proactive HTTP checks on critical user journeys (add to cart, checkout) from outside the infra, running every 60 seconds — detects availability independently of internal metrics. Deployment correlation alerts: automatically flag if error rate rises within 15 minutes of any deployment. Saturation alerts: DB connection pool exhaustion, thread pool queue depth, memory at 85%+ — these are leading indicators before requests start failing."
      }
    ],
    related: ["3.6.01", "6.8.01", "3.2.01", "3.3.01", "6.4.01"],
    has_diagram: false,
    has_code: false,
    tags: ["incident-response","outage","p1","5xx","war-room","rollback","observability","post-mortem","blameless","sre"]
  },

  {
    id: "11.4.02",
    section: 11,
    subsection: "11.4",
    level: "advanced",
    question: "A JVM microservice's heap usage climbs 2% per hour and never comes down. After 50 hours it OOMKills and restarts. The leak has been happening for 3 weeks — you now need to find and fix it. How do you approach this?",
    quick_answer: "→ Capture a heap dump before the pod OOMKills — use jmap or a JVM flag to auto-dump on OOM\n→ Analyse with Eclipse Memory Analyser (MAT) — look for the largest retained heap object and its GC root path\n→ Common suspects: growing caches without eviction, listener/callback registrations never removed, static collections\n→ Fix: add eviction bounds to caches, use WeakReferences for callbacks, audit all static state\n→ Add heap usage alerting at 80% to catch regressions before next OOMKill",
    detailed_answer: "A heap that climbs steadily and never drops despite GC is a classic reference leak — objects are reachable (directly or transitively from a GC root) when they should not be. GC only collects unreachable objects, so reachable-but-logically-dead objects accumulate indefinitely.\n\nStep 1 — Capture a heap dump before death.\nAdd the JVM flag at startup: -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/heapdump.hprof. For Kubernetes: mount a shared volume so the heap dump persists after the pod terminates. Alternatively, connect JConsole or jvisualvm to the running pod (kubectl port-forward) and trigger a heap dump manually when usage hits ~85%.\n\nStep 2 — Analyse with Eclipse MAT.\nOpen the .hprof file in Eclipse Memory Analyser (MAT). Run the Leak Suspects report — it identifies the object type consuming the most retained heap and traces its shortest GC root path. This tells you: what type of object is leaking (e.g., HashMap entry), and what is keeping it alive (e.g., a static field in CacheManager).\n\nCommon root causes:\n\n1. Unbounded caches. A Map or Guava Cache without an eviction policy or size limit grows until OOM. Every entry ever added is kept forever. Fix: add maximum size and/or TTL eviction. Caffeine's maximumSize(10_000).expireAfterWrite(1, HOURS) is the idiomatic fix.\n\n2. Event listener / callback registration without deregistration. An object registers as a listener (e.g., Spring ApplicationEventListener, Guava EventBus @Subscribe) but the listener is never deregistered when the object goes out of scope. The event publisher holds a reference, keeping the object alive. Fix: deregister in a destroy/@PreDestroy lifecycle method.\n\n3. ThreadLocal not removed. ThreadLocals in thread pools never get GC'd because the thread (and its ThreadLocal map) lives forever in the pool. Fix: always call threadLocal.remove() after use, ideally in a try/finally block.\n\n4. Static collections. A static List or Map accumulating request-scoped data (e.g., a metrics buffer) with no clear mechanism. Fix: bound the collection size or switch to a proper metrics framework.\n\nStep 3 — Verify the fix.\nDeploy the fix to a non-production environment. Run a load test that mimics production traffic for 6+ hours. Plot heap usage — it should plateau at a stable level and not trend upward. Monitor GC frequency — healthy heap shows regular GC with stable plateau.\n\nStep 4 — Add alerting.\nAlert when heap usage exceeds 80% for 10 consecutive minutes. This fires with 10+ hours warning before OOMKill at the current leak rate — plenty of time to respond before impact.\n\nSections covered: 3.4 (performance & latency — JVM tuning), 3.6 (observability — heap metrics, alerting), 6.8 (observability implementation — JVM metrics in Prometheus/Grafana), 4.2 (resilience — auto-restart on OOMKill is not a fix)",
    key_points: [
      "-XX:+HeapDumpOnOutOfMemoryError is mandatory on all production JVM services",
      "Eclipse MAT Leak Suspects report traces GC root path — identifies exactly what holds the reference",
      "Unbounded caches, underegistered listeners, and ThreadLocal without remove() are the top-3 causes",
      "Verify fix with 6h load test in non-prod before deploying — heap trend must plateau",
      "OOMKill + auto-restart is not a fix — it restarts every 50 hours while leaking continues",
      "Alert at 80% heap for 10 min — gives hours of warning at slow leak rates"
    ],
    hint: "GC collects unreachable objects. If the heap keeps growing despite GC running, what must be true about the objects accumulating?",
    common_trap: "Increasing the JVM heap size (-Xmx) as the 'fix' — this delays the OOMKill from 50 hours to 100 hours but does not address the leak. The heap will fill regardless of size.",
    follow_up_questions: [
      {
        text: "How do you capture a heap dump from a running Kubernetes pod without restarting it?",
        type: "inline",
        mini_answer: "kubectl exec -it <pod> -- jmap -dump:live,format=b,file=/tmp/heap.hprof <pid>. Find the JVM PID first with kubectl exec <pod> -- jps. Then copy the dump out: kubectl cp <pod>:/tmp/heap.hprof ./heap.hprof. The 'live' flag triggers a full GC before the dump — useful because it removes objects that are already eligible for GC, leaving only truly retained objects in the dump. Requires jmap to be available in the container image — add it if not present, or use async-profiler as an alternative."
      },
      {
        text: "How does the circuit breaker pattern relate to OOMKill and restarts?",
        type: "linked",
        links_to: "4.2.02",
        mini_answer: "When a service OOMKills and restarts, it is temporarily unavailable. Callers without a circuit breaker will queue requests against the restarting service, causing their own thread pool exhaustion (cascading failure). A circuit breaker on the caller opens when the downstream fails repeatedly — it returns a fast fallback instead of queuing. This protects the caller during the restart window. The OOMKill itself is not fixed by a circuit breaker — that requires fixing the leak — but the circuit breaker limits the blast radius of the restart events."
      }
    ],
    related: ["3.4.01", "3.6.01", "6.8.01", "4.2.02", "6.3.02"],
    has_diagram: false,
    has_code: true,
    code_language: "java",
    code_snippet: `// Common memory leak: unbounded cache
// BEFORE — leaks forever
private static final Map<String, UserProfile> cache = new HashMap<>();

public UserProfile getProfile(String userId) {
    return cache.computeIfAbsent(userId, this::loadFromDB);
    // Every userId ever seen stays in map — never evicted
}

// AFTER — bounded Caffeine cache with eviction
private static final Cache<String, UserProfile> cache = Caffeine.newBuilder()
    .maximumSize(10_000)
    .expireAfterWrite(Duration.ofHours(1))
    .recordStats()   // exposes hit/miss rate to Micrometer
    .build();

public UserProfile getProfile(String userId) {
    return cache.get(userId, this::loadFromDB);
}

// Common memory leak: listener never deregistered
// BEFORE
@Component
public class OrderProcessor implements ApplicationListener<OrderEvent> {
    // Spring never removes this — lives as long as the context
}

// AFTER — use @EventListener on a method (Spring manages lifecycle)
@Component
public class OrderProcessor {
    @EventListener
    public void handleOrder(OrderEvent event) { /* ... */ }
}`,
    tags: ["memory-leak","jvm","heap-dump","eclipse-mat","caffeine-cache","threadlocal","oomkill","kubernetes","observability"]
  },

  {
    id: "11.4.03",
    section: 11,
    subsection: "11.4",
    level: "advanced",
    question: "A deployment to your payment service at 14:00 caused a cascading failure that took down your order service, notification service, and the API gateway by 14:12. The payment service itself recovered after rollback at 14:25. Why did the cascade happen, and what architectural changes prevent it?",
    quick_answer: "→ Root cause: unhealthy downstream (payment) holding connections and blocking caller thread pools\n→ Mechanism: slow/failing HTTP calls from order service fill its thread pool → queue builds → timeouts propagate up\n→ Immediate fix: circuit breaker on payment service calls with fallback (graceful degradation)\n→ Structural fix: set aggressive connection and read timeouts on all HTTP clients\n→ Bulkhead: isolate payment calls to a dedicated thread pool — cap the blast radius",
    detailed_answer: "This is a classic cascading failure through thread pool exhaustion. Understanding the failure chain is prerequisite to preventing it.\n\nThe failure chain:\n1. 14:00 — Deployment makes payment service slow (responding in 30s instead of 200ms)\n2. 14:01 — Order service begins calling payment service. Calls take 30s. Thread pool has 50 threads. After 50 concurrent requests, thread pool is full.\n3. 14:03 — New requests to order service are queued waiting for a thread. Queue fills.\n4. 14:06 — Order service starts returning 503/timeouts to its callers because no threads are available for any operation — including completely unrelated endpoints.\n5. 14:08 — Notification service (which calls order service) also exhausts its thread pool\n6. 14:12 — API gateway is queueing connections to backends that are timing out — gateway runs out of connection capacity.\n\nThe payment service was the trigger, but the cascade happened because none of the callers had isolation around their downstream calls.\n\nFix 1 — Circuit breaker on payment service calls.\nA circuit breaker (Resilience4j in Java, Polly in .NET) monitors the error rate and response time of calls to payment service. When the threshold is exceeded (e.g., 50% failure rate in 10 seconds), the circuit opens — subsequent calls return a fallback immediately (reject the payment, allow retry, or queue to a persistent store) without hitting payment service. This stops thread pool exhaustion in the order service.\n\nFix 2 — Aggressive timeouts.\nSet HTTP client connection timeout (100ms) and read timeout (2s) on all service-to-service calls. A 30-second timeout means 50 threads can be held for 50 × 30s = 1500 thread-seconds before the pool is exhausted. A 2-second timeout means the pool is exhausted only if 25 concurrent slow calls arrive simultaneously — much rarer, and the circuit breaker fires first.\n\nFix 3 — Bulkhead isolation.\nGive payment service calls their own dedicated thread pool (bulkhead pattern). Example: 10 threads for payment calls, leaving the other 40 threads fully available for other operations. When payment is slow, only the 10 payment threads are affected. The order service continues handling unrelated requests with its remaining threads.\n\nFix 4 — Graceful degradation design.\nFor the specific case of payment failure, define the fallback: queue the payment for async retry, show the user a 'payment pending' state, and process offline. This is a product decision — some systems can accept eventual payment processing, others cannot. Having a pre-defined degraded mode is better than an undefined crash.\n\nFix 5 — Chaos engineering validation.\nVerify these fixes hold by running a GameDay: deliberately slow the payment service in staging and verify that order service, notification service, and API gateway continue serving other traffic normally.\n\nSections covered: 4.2 (resilience patterns — circuit breaker, bulkhead, timeout), 3.3 (fault tolerance & resilience), 6.4 (deployment strategies — what triggered the incident), 1.2 (microservices — blast radius isolation)",
    key_points: [
      "Cascading failures propagate through thread pool exhaustion, not just error propagation",
      "Slow downstream is worse than a dead downstream — dead triggers timeout fast, slow holds threads indefinitely",
      "Circuit breaker stops the cascade at source — must be on every service-to-service call",
      "Bulkhead limits blast radius: slow payment calls cannot starve threads for unrelated operations",
      "Aggressive timeouts (2s read, 100ms connect) are the simplest and most impactful first line",
      "Chaos GameDay validates resilience actually works before the next production incident"
    ],
    hint: "Why is a downstream service that's responding slowly more dangerous than one that's completely down?",
    common_trap: "Adding retry logic without a circuit breaker — retries to a slow service multiply the thread usage (each retry holds a thread) and accelerate the cascade rather than preventing it.",
    follow_up_questions: [
      {
        text: "How does Resilience4j circuit breaker work?",
        type: "linked",
        links_to: "4.2.02",
        mini_answer: "Resilience4j tracks calls in a sliding window (count-based or time-based). When failure rate or slow-call rate exceeds the threshold, the circuit opens. In OPEN state, calls return a fallback immediately (no network call). After a configured wait duration (e.g., 30s), the circuit moves to HALF_OPEN — it allows a probe call. If the probe succeeds, the circuit closes; if it fails, it reopens. This prevents thundering herd on recovery: the service gets one probe call rather than the full flood returning at once."
      },
      {
        text: "How do you design a graceful fallback for a failed payment service?",
        type: "inline",
        mini_answer: "Depends on the business requirement. Option A: synchronous payment only — if payment service is down, decline the order with a user-visible error (simplest, safest). Option B: async payment queue — write the payment intent to a persistent queue (DynamoDB or Kafka), acknowledge the user immediately with 'payment processing', process asynchronously when payment service recovers. Requires idempotency on the payment processor side. Option C: switch to a backup payment provider. The right fallback is a product decision, not a technical one — establish it before the incident."
      }
    ],
    related: ["4.2.01", "4.2.02", "3.3.01", "1.2.01", "6.4.01"],
    has_diagram: true,
    diagram: `Cascading Failure — Thread Pool Exhaustion

14:00  Payment service becomes slow (30s responses)

14:01  Order Service
       [■■■■■■■■■■|  thread pool filling  ]
         calls to payment service (30s each)

14:06  Order Service
       [■■■■■■■■■■■■■■■■■■■■] FULL — new requests queue/reject
         unrelated endpoints now also broken

14:12  API Gateway → Order Service (timing out)
       → Notification Service → Order Service (timing out)
       → Gateway itself runs out of connections

Prevention:
       Circuit Breaker: open after 50% failure → fast fallback
       Bulkhead:        10 threads for payment | 40 for everything else
       Timeout:         2s read timeout → thread freed in 2s not 30s`,
    has_code: false,
    tags: ["cascading-failure","circuit-breaker","bulkhead","thread-pool","resilience","timeout","microservices","deployment","chaos-engineering"]
  },

  {
    id: "11.4.04",
    section: 11,
    subsection: "11.4",
    level: "advanced",
    question: "A junior developer reports that some order records in production have incorrect totals — prices multiplied correctly but the discount field has been applied twice. It may have been happening for 3 days. How do you respond?",
    quick_answer: "→ Immediately scope the impact: how many records, which time range, what customers\n→ Preserve evidence: take a DB snapshot before any remediation\n→ Stop the bleeding: identify and disable the code path causing double-application\n→ Quantify financial impact and notify finance/legal before notifying customers\n→ Remediate: write idempotent correction scripts, verify on staging, apply to prod with audit trail",
    detailed_answer: "Data corruption incidents are high-severity events with legal, financial, and reputational implications beyond the technical fix. The response must be deliberate, not rushed.\n\nMinute 0–15 — Scope and preserve.\nDo not touch data yet. First, scope the impact: write a read-only query to count affected records and identify the time range. Confirm the hypothesis — is it all discount types or specific ones? All order states or only completed orders? Take a DB snapshot immediately — this is your forensic evidence and recovery baseline. Do this before any investigation changes data.\n\nMinute 15–60 — Stop the bleeding.\nIdentify the code path causing double-application. Review recent deployments — was there a deployment 3 days ago that coincides with the issue start? Check git log for changes to the discount calculation. Once identified, disable or hotfix the code path immediately. Verify new orders are correct after the hotfix.\n\nHour 1–4 — Notify stakeholders.\nBefore contacting any customers, brief finance and legal. Financial data errors have accounting implications. In regulated industries (financial services, healthcare), data corruption may have mandatory disclosure requirements. Get legal guidance before making any public statement.\n\nHour 4–24 — Prepare the remediation.\nWrite a correction script that:\n1. Identifies all affected rows by the specific criteria (discount_applied_twice = true, or via the time window and discount type)\n2. Computes the correct value\n3. Updates the row with an audit column (corrected_at, corrected_by = 'incident-2024-01-15', previous_value)\n\nTest the correction script on a staging environment restored from the production snapshot. Verify correct output on 100+ test records. Have a second engineer review the script independently.\n\nHour 24–48 — Apply to production.\nRun in a transaction. Verify row counts match expectation before committing. Commit. Verify a sample of corrected records manually. Refund or credit affected customers per legal/finance guidance.\n\nPost-incident:\n- Add a data validation test that catches this class of error (e.g., check order total = sum of line items × quantity minus discount)\n- Add monitoring for statistical anomalies in order value distributions — a sudden drop in average order value would have flagged this within hours\n\nSections covered: 2.2 (relational databases — transaction integrity), 3.7 (disaster recovery — snapshot, rollback), 2.6 (data replication — audit trail), 3.5 (security requirements — data integrity, audit logging)",
    key_points: [
      "Take a DB snapshot before any remediation — preserve forensic evidence first",
      "Stop the bleeding (disable the buggy code path) before starting data correction",
      "Brief finance and legal before contacting customers — regulatory implications",
      "Correction scripts must be idempotent, tested on staging, and reviewed by a second engineer",
      "Run correction in a transaction with explicit audit columns (corrected_at, previous_value)",
      "Add statistical anomaly monitoring on order values — would have caught this in hours, not days"
    ],
    hint: "Why is it important to take a snapshot before you start investigating, even though it seems like a waste of time?",
    common_trap: "Starting to fix data immediately without scoping or snapshotting — an investigation query that accidentally modifies data (missing WHERE clause) makes the situation worse and loses the forensic baseline.",
    follow_up_questions: [
      {
        text: "How would you design the orders table to make this class of error detectable earlier?",
        type: "linked",
        links_to: "2.2.03",
        mini_answer: "Add a computed column or CHECK constraint that validates the relationship: CHECK (total_amount = subtotal - discount_amount). In Postgres, this can be a generated column. Alternatively, add a DB trigger that validates totals on INSERT/UPDATE and rejects inconsistent rows. These are last-resort guards — the primary prevention is application-level unit tests that verify discount calculation. But a DB constraint catches bugs that bypass the application (direct SQL, scripts, ORM quirks)."
      },
      {
        text: "How does an audit log help with data corruption incidents?",
        type: "linked",
        links_to: "2.6.04",
        mini_answer: "An audit log records every change to a row: old value, new value, timestamp, and who/what made the change. For this incident, an audit log would show: (1) exactly when the double-discount started, (2) which application user or service made the change, (3) the previous correct values, enabling automated rollback without guesswork. Without an audit log, you rely on backups (coarser granularity) or code archaeology. Implement with a change_log table populated by triggers, or use Debezium CDC to capture all changes to Kafka."
      }
    ],
    related: ["2.2.01", "3.7.01", "2.6.04", "3.5.01", "8.5.01"],
    has_diagram: false,
    has_code: true,
    code_language: "sql",
    code_snippet: `-- Step 1: Scope — count affected records (READ ONLY)
SELECT COUNT(*),
       MIN(created_at) AS earliest_affected,
       MAX(created_at) AS latest_affected,
       SUM(discount_amount) AS total_over_discounted
FROM orders
WHERE created_at >= '2024-01-12'   -- 3 days ago
  AND discount_amount > (subtotal * 0.5);  -- sanity check: >50% discount is suspicious

-- Step 2: Verify hypothesis on a sample
SELECT id, subtotal, discount_amount, total_amount,
       subtotal - (discount_amount / 2) AS corrected_total
FROM orders
WHERE created_at >= '2024-01-12'
  AND discount_amount > (subtotal * 0.5)
LIMIT 20;

-- Step 3: Correction (run in transaction, test on staging first)
BEGIN;

UPDATE orders
SET
  total_amount     = subtotal - (discount_amount / 2),
  discount_amount  = discount_amount / 2,
  corrected_at     = NOW(),
  corrected_reason = 'incident-2024-01-15-double-discount'
WHERE created_at >= '2024-01-12'
  AND discount_amount > (subtotal * 0.5);

-- Verify count before committing
SELECT COUNT(*) FROM orders WHERE corrected_reason = 'incident-2024-01-15-double-discount';

-- COMMIT only after verification
COMMIT;`,
    tags: ["data-corruption","incident","audit-log","sql","correction-script","snapshot","postgres","financial-data","compliance"]
  },

  {
    id: "11.4.05",
    section: 11,
    subsection: "11.4",
    level: "intermediate",
    question: "At 03:00, alerts fire showing your primary Postgres instance has disk at 99%. The database is still running but writes are failing. What do you do?",
    quick_answer: "→ Immediate: identify what is consuming disk — transaction logs, dead tuples, temp files, or application data growth\n→ Quick wins: truncate/rotate pg_wal if safe, clear pg_temp files, run VACUUM to reclaim dead tuples\n→ Do NOT delete data you cannot recover — snapshot first\n→ Short term: expand the disk or mount additional volume\n→ Root cause: add disk usage alerting at 70% and 85% — you should never reach 99%",
    detailed_answer: "99% disk on a database is a P1 incident. At 100% disk, Postgres stops accepting writes and crashes. You have minutes to hours of headroom.\n\nStep 1 — Identify the disk consumer.\nSSH to the DB instance (or exec into the pod). Run: du -sh /var/lib/postgresql/data/*/\nCheck the three most common culprits:\n- pg_wal: transaction write-ahead log accumulates if a replication slot is stalled or a long-running transaction holds back WAL recycling\n- pg_base: the actual data files — growing due to data growth or table bloat\n- Temp files: complex queries that spill to disk (large sorts, hash joins without enough work_mem)\n- Application log files mounted on the same volume\n\nStep 2 — Quick wins by category.\n\nIf pg_wal is large: check for stalled replication slots with `SELECT * FROM pg_replication_slots WHERE active = false`. An inactive slot holds all WAL until it's consumed. Drop the stale slot if the replica is decommissioned: `SELECT pg_drop_replication_slot('slot_name')`. WAL files recycle immediately.\n\nIf it's table bloat (dead tuples): run `VACUUM FULL tablename` on the largest tables. VACUUM FULL reclaims space back to OS (regular VACUUM does not). Caution: VACUUM FULL locks the table — only use during off-peak or maintenance window.\n\nIf it's temp files: `SELECT * FROM pg_stat_activity WHERE wait_event_type = 'IO' AND wait_event = 'DataFileRead'` — find and terminate the query generating the temp files: `SELECT pg_terminate_backend(pid)`.\n\nIf it's application logs: rotate and compress with logrotate.\n\nStep 3 — Buy more space (if quick wins aren't enough).\nExpand the EBS volume online: AWS allows EBS expansion without downtime. `aws ec2 modify-volume --volume-id vol-xxxx --size 500`. Then grow the filesystem: `resize2fs /dev/xvdf` (or xfs_growfs for XFS). This is the safest option under time pressure.\n\nStep 4 — Verify writes are restored.\nRun a test INSERT after space is freed. Monitor disk usage for the next 30 minutes.\n\nStep 5 — Root cause and prevention.\nThis incident happened because there was no alerting until 99%. Add:\n- Alert at 70% disk usage — gives days of lead time\n- Alert at 85% disk usage — urgent but not yet critical\n- Monitor pg_replication_slots for inactive slots\n- Schedule VACUUM ANALYZE weekly on large tables\n- autovacuum review: tune cost_delay and scale factors for high-write tables\n\nSections covered: 3.6 (observability requirements — disk alerting), 6.8 (observability implementation), 2.2 (relational databases — vacuum, WAL, replication slots), 3.7 (disaster recovery — snapshot before action)",
    key_points: [
      "pg_wal growth from stale replication slots is the most common cause — check pg_replication_slots first",
      "VACUUM FULL reclaims space to OS; regular VACUUM does not — know the difference",
      "EBS volume expansion is online on AWS — safe to do under pressure without downtime",
      "Stale replication slot dropped immediately frees WAL accumulation",
      "Never reach 99% — alert at 70% and 85%, these are leading indicators not emergency signals",
      "Take a snapshot before making changes — 99% disk means some operations can fail"
    ],
    hint: "What Postgres-specific mechanism could cause disk to fill up independently of your actual data size?",
    common_trap: "Deleting database data files or pg_wal files directly using rm — this corrupts the database. Never delete files from the Postgres data directory manually.",
    follow_up_questions: [
      {
        text: "What is a Postgres replication slot and why can it cause WAL accumulation?",
        type: "inline",
        mini_answer: "A replication slot is Postgres's mechanism to track how far a standby or logical consumer has replicated. Postgres guarantees it will keep all WAL segments the slot needs — it won't recycle them. If the slot's consumer (a replica, Debezium, or DMS) disconnects and stops consuming, Postgres keeps accumulating WAL indefinitely. A 100MB/s write workload can fill a 100GB disk in under 20 minutes if a stale slot is present. Always set max_slot_wal_keep_size to a safe limit, and monitor pg_replication_slots.active for disconnected slots."
      },
      {
        text: "How would you set up automated disk space monitoring for databases?",
        type: "linked",
        links_to: "3.6.02",
        mini_answer: "Export disk metrics to Prometheus via node_exporter (node_filesystem_avail_bytes). Alert when filesystem availability drops below 30% (70% used), then 15% (85% used). For Postgres-specific metrics: pg_database_size() tracks database growth; track rate of change — a database growing 5GB/day normally but suddenly growing 50GB/day indicates a runaway process. For WAL specifically: monitor pg_wal directory size and pg_replication_slots active status. PagerDuty alert at 85% disk, info alert at 70%. CloudWatch or Datadog can be configured similarly for managed RDS instances."
      }
    ],
    related: ["3.6.01", "6.8.01", "2.2.01", "3.7.01", "3.6.02"],
    has_diagram: false,
    has_code: true,
    code_language: "sql",
    code_snippet: `-- Check replication slot status (stale slots = WAL accumulation)
SELECT slot_name,
       active,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained_wal,
       restart_lsn
FROM   pg_replication_slots
ORDER  BY retained_wal DESC;

-- Drop stale slot (only if replica is decommissioned)
-- SELECT pg_drop_replication_slot('stale_slot_name');

-- Find the largest tables + bloat estimate
SELECT relname                              AS table_name,
       pg_size_pretty(pg_total_relation_size(oid)) AS total_size,
       pg_size_pretty(pg_relation_size(oid))       AS table_size,
       n_dead_tup,
       n_live_tup
FROM   pg_stat_user_tables
ORDER  BY pg_total_relation_size(oid) DESC
LIMIT  20;

-- Check temp files from active queries
SELECT pid, query, state,
       pg_size_pretty(temp_bytes) AS temp_size
FROM   pg_stat_activity
WHERE  temp_bytes > 0
ORDER  BY temp_bytes DESC;

-- Database and WAL directory sizes
SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size;`,
    tags: ["postgres","disk-full","replication-slot","wal","vacuum","bloat","observability","incident","ebs","monitoring"]
  },

  {
    id: "11.4.06",
    section: 11,
    subsection: "11.4",
    level: "advanced",
    question: "Your security team alerts you at 10:00: they have detected an unusual access pattern — a service account is querying customer PII tables at 3–5am every night, extracting 50,000+ rows each session, starting 2 weeks ago. This is not a known job. How do you respond?",
    quick_answer: "→ Do NOT immediately revoke access — preserve evidence and understand the full scope first\n→ Isolate: capture current network connections from the service account and identify the originating host\n→ Escalate to security team and legal immediately — this is a potential data breach\n→ Contain: revoke access only after evidence is preserved and scope is understood\n→ Notify DPO/legal — GDPR requires breach notification within 72 hours if personal data is exfiltrated",
    detailed_answer: "An unexplained service account extracting PII at 3am for 2 weeks is an active security incident. The response has both technical and legal dimensions that run in parallel.\n\nImmediate actions (first 30 minutes) — Do not alert the attacker:\nDo not immediately revoke credentials or take any action that the attacker might detect. If this is an external attacker using a compromised credential, premature action destroys the ability to trace the full attack chain and may cause the attacker to exfiltrate faster or cover tracks.\n\nStep 1 — Preserve evidence silently.\nEnable enhanced DB query logging if not already active. Capture: full query text, rows returned, client IP/hostname, and timestamps for all sessions by this service account over the past 30 days. Export to an immutable store (S3, CloudWatch Logs). This is your forensic record.\n\nStep 2 — Identify the originating host.\nQuery DB connection logs to find the source IP of these sessions. Cross-reference with your infrastructure: is it a known server, a Kubernetes pod, or an unknown external IP? If it's an unknown external IP, this is almost certainly a breach. If it's a known internal server, the server itself may be compromised.\n\nStep 3 — Escalate to security and legal.\nThis is a potential data breach. Escalate immediately to the security team, CISO, legal, and Data Protection Officer. GDPR Article 33 requires notification to the supervisory authority within 72 hours of becoming aware of a breach. Start the clock from this moment.\n\nStep 4 — Contain (coordinated with security team).\nOnce evidence is preserved and scope is understood, execute containment simultaneously:\n- Revoke the compromised service account credentials\n- Rotate all credentials that share the same vault/secret store\n- Isolate the originating host (remove from network or block egress)\n- Block the source IP at the WAF/network layer\n\nStep 5 — Scope the breach.\nWhich tables were accessed? What customer data? Cross-reference with your data classification — was it PII, financial, health data? Count unique customer records affected. This determines notification obligations.\n\nStep 6 — Remediate and harden.\nRoot cause: how was the service account compromised? Leaked credentials, SSRF, insider threat? Fix the root cause. Then: implement network segmentation (DB should only be reachable from known app servers), add anomaly detection on query volume (alert when a service account queries > N rows outside business hours), and enforce least-privilege — this service account should not have had SELECT on all PII tables.\n\nSections covered: 7.1 (authentication & authorisation — service accounts, least privilege), 7.6 (network security — segmentation, isolation), 7.7 (threat modeling — insider/external attacker), 3.6 (observability — anomaly detection, audit logging)",
    key_points: [
      "Do not immediately revoke access — premature action destroys evidence and may accelerate exfiltration",
      "GDPR 72-hour breach notification clock starts when you become aware — start it now",
      "Preserve forensic evidence (full query logs, connection metadata) to immutable storage first",
      "Identify the originating host before containment — it tells you if this is external or insider",
      "Contain in a single coordinated action: revoke + rotate + isolate + block simultaneously",
      "Root cause fix: least privilege + network segmentation + anomaly alerting on data access volume"
    ],
    hint: "What's the risk of immediately revoking the compromised service account's access before understanding the full scope?",
    common_trap: "Treating this as a routine access management task and simply revoking credentials and moving on — failing to investigate scope, notify DPO, or understand the root cause leaves the organisation exposed to further compromise and GDPR enforcement action.",
    follow_up_questions: [
      {
        text: "How should service account credentials be secured to prevent this class of attack?",
        type: "linked",
        links_to: "7.5.02",
        mini_answer: "Short-lived dynamic credentials via HashiCorp Vault or AWS IAM Roles. Instead of a static service account password, the application requests a time-limited DB credential from Vault (valid for 1 hour). Even if the credential is captured, it expires quickly. Network-level: DB instances should only accept connections from specific security groups or IP ranges — an external IP should never be able to reach the DB directly. Least privilege: each service account has SELECT only on the specific tables it needs, not the entire schema."
      },
      {
        text: "How would you design anomaly detection to catch this pattern automatically?",
        type: "linked",
        links_to: "7.7.01",
        mini_answer: "Baseline normal query patterns per service account: typical rows fetched per session, typical hours of operation, typical tables accessed. Alert on deviations: rows fetched > 3× the 7-day p99 for that account, or any access outside the normal operating hours window, or access to a table the account has never accessed before. Implement via: Postgres pg_audit extension logging to CloudWatch, stream to a SIEM (Splunk, Elastic Security), apply ML-based or threshold-based anomaly rules. GuardDuty for RDS can detect anomalous query patterns automatically on RDS instances."
      }
    ],
    related: ["7.1.01", "7.5.02", "7.6.01", "7.7.01", "3.6.01"],
    has_diagram: false,
    has_code: false,
    tags: ["security-incident","data-breach","pii","service-account","gdpr","forensics","anomaly-detection","least-privilege","threat-modeling","containment"]
  },

  {
    id: "11.4.07",
    section: 11,
    subsection: "11.4",
    level: "advanced",
    question: "Your monitoring shows CPU is pegged at 100% on all 10 nodes of your Kubernetes cluster. New pod scheduling is failing. Existing pods are throttled. Deployments are stuck. No recent code change was pushed. What do you do?",
    quick_answer: "→ Identify which pods are consuming the CPU — kubectl top pods --all-namespaces, sorted by CPU\n→ Check if it's a sudden workload spike, a runaway process, or a misconfigured HPA causing a pod storm\n→ Cordon nodes and drain non-critical workloads to free capacity for diagnostics\n→ Kill or resource-limit the offending pods to restore cluster health\n→ Investigate root cause: crypto-miner injection, runaway job, misconfigured autoscaler, or external traffic spike",
    detailed_answer: "100% CPU across all nodes with no code change is unusual. The diagnostic question is: is this legitimate work (traffic spike) or illegitimate work (runaway process, crypto-miner, HPA storm)?\n\nStep 1 — Identify the CPU consumers.\nkubectl top pods --all-namespaces --sort-by=cpu | head -20\nThis shows the top CPU-consuming pods. If one or two pods are consuming 40+ cores and do not correspond to a known high-CPU workload, that is your suspect. Note the namespace, pod name, and the workload it belongs to (kubectl describe pod).\n\nStep 2 — Classify the root cause.\n\nScenario A — HPA / autoscaler storm: an HPA is scaling up pods rapidly (perhaps triggered by a metric spike), each new pod also consumes CPU, which triggers more scaling. Check: `kubectl get hpa --all-namespaces`. Look for any HPA with current replicas far above min. A misconfigured HPA targeting CPU % with a low threshold can cause exponential pod creation.\n\nScenario B — Runaway job or CronJob: a batch job or scheduled job started consuming unbounded resources. Check: `kubectl get jobs --all-namespaces` and `kubectl get cronjobs`. A job with no resource limits can consume all available CPU.\n\nScenario C — External traffic spike: legitimate traffic increase saturating the application tier. Check load balancer metrics and application request rates. If traffic has genuinely spiked, scale the cluster (add nodes) or enable emergency rate limiting.\n\nScenario D — Security: crypto-miner or malicious workload. If the high-CPU pods have unusual names, pull unknown images, or run in unexpected namespaces — this is a security incident. Capture the pod spec and image details before deleting. Escalate to security team. Check all container images for known malicious hashes.\n\nStep 3 — Containment.\n- HPA storm: `kubectl patch hpa my-hpa --patch '{\"spec\":{\"maxReplicas\":5}}'` to cap scaling. Or suspend the HPA temporarily.\n- Runaway job: `kubectl delete job runaway-job-name --force`. Set resource limits on all jobs going forward.\n- Malicious pod: cordon the node, capture evidence, delete the pod. Audit how the pod was scheduled.\n- Traffic spike: enable cluster autoscaler to add nodes, or enable rate limiting at the ingress layer.\n\nStep 4 — Restore scheduling.\nIf pod scheduling is failing due to insufficient capacity, cordon a non-production node and evict its pods to free resources for critical workloads:\n`kubectl cordon node-3 && kubectl drain node-3 --ignore-daemonsets --delete-emptydir-data`\n\nStep 5 — Prevention.\nSet CPU requests and limits on all workloads — pods without limits can consume unbounded resources. Configure HPA with appropriate scale-down stabilisation windows to prevent oscillation. Add cluster-level CPU usage alerting at 70% and 85% per node. Implement OPA/Gatekeeper policies to reject pods without resource limits.\n\nSections covered: 6.3 (container orchestration — HPA, resource limits, scheduling), 3.4 (performance & latency — CPU throttling), 3.6 (observability — cluster metrics), 7.7 (threat modeling — crypto-miner injection, security scenario D)",
    key_points: [
      "kubectl top pods --sort-by=cpu is the first command — identify the consumer before acting",
      "HPA misconfiguration causing a pod storm is a common non-obvious cause of cluster CPU saturation",
      "Pods without resource limits can consume all cluster CPU — limits are mandatory, not optional",
      "If unknown images are running high-CPU workloads — treat as a security incident immediately",
      "Cordon + drain is the safe way to recover capacity without killing production workloads",
      "Alert at 70% and 85% per-node CPU — never wait until 100% where scheduling fails"
    ],
    hint: "What Kubernetes object could automatically create more and more pods in response to high CPU, making the CPU problem progressively worse?",
    common_trap: "Adding more nodes immediately without identifying the root cause — if the cause is a runaway HPA, more nodes will just trigger more pod scheduling and more CPU consumption until all new nodes are also saturated.",
    follow_up_questions: [
      {
        text: "How do resource requests and limits interact with the HPA?",
        type: "linked",
        links_to: "6.3.02",
        mini_answer: "HPA scales based on metrics — typically CPU or memory utilisation relative to requests. If requests are set very low (e.g., 10m CPU), a pod using 200m CPU shows 2000% utilisation and HPA aggressively scales. This is the HPA storm root cause: low requests create an unrealistic baseline. Set requests to the actual expected p50 CPU usage. The HPA target utilisation (typically 70%) is then relative to real usage, not an artificially low baseline. Always configure scale-down stabilisation (stabilizationWindowSeconds: 300) to prevent oscillation."
      },
      {
        text: "How would you enforce resource limits across a Kubernetes cluster?",
        type: "inline",
        mini_answer: "Two mechanisms: LimitRange (namespace-scoped default limits applied automatically to pods that don't specify them) and OPA/Gatekeeper policies that DENY admission of pods without explicit resource requests and limits. LimitRange is a safety net; Gatekeeper is the enforcement layer. Together: every pod in the cluster has CPU/memory requests and limits, either set by the developer or defaulted by LimitRange. This prevents any single pod from consuming unbounded resources."
      }
    ],
    related: ["6.3.01", "6.3.02", "3.4.01", "3.6.01", "7.7.01"],
    has_diagram: false,
    has_code: true,
    code_language: "bash",
    code_snippet: `# Step 1: Find top CPU consumers
kubectl top pods --all-namespaces --sort-by=cpu | head -20

# Step 2: Check HPA state for all namespaces
kubectl get hpa --all-namespaces

# Check if HPA is scaling aggressively
kubectl describe hpa suspicious-hpa -n production

# Step 3a: Cap HPA if it's causing a pod storm
kubectl patch hpa suspicious-hpa -n production \
  --type merge \
  -p '{"spec":{"maxReplicas":5}}'

# Step 3b: Kill a runaway job
kubectl delete job runaway-batch-job -n production --force --grace-period=0

# Step 4: Cordon and drain a node to recover scheduling capacity
kubectl cordon node-3
kubectl drain node-3 --ignore-daemonsets --delete-emptydir-data

# Step 5: Check pods without resource limits (governance gap)
kubectl get pods --all-namespaces -o json | \
  jq '.items[] | select(.spec.containers[].resources.limits == null) | .metadata.name'`,
    tags: ["kubernetes","cpu","hpa","runaway-job","resource-limits","scheduling","cordon","drain","crypto-miner","incident"]
  }

];

