// questions/section_11.js
// Section 11: Real-World Scenarios
// Subsections: 11.1 Design from Scratch
//              11.2 Scale an Existing System
//              11.3 Migrate Legacy Systems
//              11.4 Diagnose Production Incidents
// Target: ~31 questions
// Added: 2026-04-27

const SECTION_11_QUESTIONS = [

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
    tags: ["system-design","url-shortener","redis","dynamodb","CDN","scale","base62"]
  }

];
