// ═══════════════════════════════════════════════════
// SECTION 8 — Data Engineering & ML
// 24 questions across 5 subsections (8.1–8.5)
// ═══════════════════════════════════════════════════

const SECTION_8_QUESTIONS = [

  // ─────────────────────────────────────────────────
  // 8.1 Data Pipeline Design (5q)
  // ─────────────────────────────────────────────────

  {
    id: "8.1.01",
    section: 8,
    subsection: "8.1",
    level: "basic",
    question: "What is a data pipeline and what are the core design considerations for an architect?",
    quick_answer: "→ A data pipeline moves data from sources to destinations through transformation stages\n→ Core considerations: reliability (exactly-once vs at-least-once), latency (batch vs streaming), scalability, schema evolution, observability\n→ Choose batch for high throughput/tolerance for delay; streaming for real-time decisions\n→ Always design for idempotency — pipelines will fail and retry\n→ Data quality gates at ingestion prevent downstream corruption",
    detailed_answer: "A data pipeline is a series of data processing stages that extract data from sources, apply transformations, and load it into destinations. From an architect's perspective, the design decisions made early cascade through the entire data platform.\n\nThe first decision is latency requirement: does the business need seconds (streaming), minutes (micro-batch), or hours (batch)? Streaming is harder to operate — it requires managing state, handling out-of-order events, and building exactly-once semantics. Batch is simpler but delays insights.\n\nReliability is the next concern. Data pipelines should be idempotent — re-running them should produce the same output. This means deduplicating at ingestion, using deterministic IDs, and writing to append-only or upsert-capable stores.\n\nScalability: can the pipeline keep up with data volume growth? Partitioning by time or key, using distributed frameworks (Spark, Flink, Dataflow), and auto-scaling compute are the standard answers.\n\nSchema evolution is underestimated: upstream producers change schemas without warning. Schema registries (Confluent, AWS Glue), schema-on-read approaches, and backward-compatible schema policies protect the pipeline.\n\nFinally, observability: you need data lineage (where did this row come from?), data quality metrics (null rates, volume anomalies), and processing SLAs (alert if the daily batch hasn't completed by 06:00).",
    key_points: [
      "Batch for throughput, streaming for low latency — the choice affects the entire architecture",
      "Design for idempotency from day one — pipelines fail and must safely retry",
      "Schema evolution protection (schema registry, backward compatibility) prevents silent data corruption",
      "Data quality gates at ingestion: validate, reject or quarantine bad records early",
      "Observability: data lineage + volume anomaly detection + SLA alerting are non-negotiable",
      "Separate compute from storage — enables independent scaling (Spark on S3, Flink on Kafka)"
    ],
    hint: "What happens to your pipeline when the upstream schema changes without notice? And when the pipeline crashes halfway through — what does a safe restart look like?",
    common_trap: "Building a pipeline that works for today's volume but has no horizontal scaling story — daily data doubles in a year and a serial pipeline cannot be parallelised without a rewrite.",
    follow_up_questions: [
      { text: "How do you design an idempotent ingestion pipeline?", type: "inline", mini_answer: "Assign deterministic record IDs (hash of natural key), write to upsert-capable sink (Delta Lake merge, DynamoDB conditional write), track watermarks/offsets in a checkpoint store so restarts replay from the last commit rather than from the start." },
      { text: "What is the Lambda architecture and its trade-offs?", type: "linked", links_to: "8.1.02" },
      { text: "How do you manage schema evolution across pipeline stages?", type: "linked", links_to: "8.1.05" }
    ],
    related: ["8.1.02", "8.2.01", "8.3.01"],
    has_diagram: true,
    diagram: `SOURCE → [Extract] → [Transform] → [Load] → DESTINATION
                  ↓             ↓           ↓
             Schema check   Data quality  Lineage
             (reject bad)   metrics       tracking`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["data-pipeline", "etl", "batch", "streaming", "idempotency", "schema-evolution"]
  },

  {
    id: "8.1.02",
    section: 8,
    subsection: "8.1",
    level: "intermediate",
    question: "What is the Lambda architecture and what problems does the Kappa architecture solve?",
    quick_answer: "→ Lambda: two parallel paths — batch layer (accuracy) + speed layer (low latency) merged at query time\n→ Problem: maintaining two codebases for the same logic is expensive and error-prone\n→ Kappa: single streaming path, replay historical data through the stream when needed\n→ Kappa wins when streaming can handle reprocessing (Kafka retention, compacted topics)\n→ Lambda still valid when batch and streaming semantics fundamentally differ",
    detailed_answer: "The Lambda architecture was introduced by Nathan Marz to solve the CAP problem for data systems: you want both low-latency recent results and accurate historical results, but a single system could not deliver both.\n\nIn Lambda, the batch layer processes all historical data with high accuracy (Spark, Hadoop), the speed layer processes the last few hours with low latency (Storm, Flink), and the serving layer merges results from both. The problem is you implement the same business logic twice — once in batch, once in streaming — and they drift.\n\nThe Kappa architecture (Jay Kreps, 2014) eliminates the batch layer entirely. A single streaming system processes all data. To reprocess historical data (e.g., after a bug fix), you replay the full Kafka topic through the same streaming job. This is viable because:\n- Kafka retains data for days/weeks/forever\n- Streaming frameworks (Flink, Spark Structured Streaming) can process historical data at high throughput\n- One codebase = less drift\n\nThe limitation of Kappa is that some transformations are inherently batch (global sorts, full-table aggregations) — streaming approximations may not match batch accuracy. In those cases, Lambda remains appropriate.\n\nModern lakehouses blur this further: Delta Lake + Spark Structured Streaming can handle both batch and streaming in the same API, making the Lambda/Kappa distinction less sharp.",
    key_points: [
      "Lambda: batch layer (accuracy) + speed layer (latency) + serving layer (merge) — three layers to maintain",
      "Lambda's fatal flaw: duplicate business logic in batch and streaming codebases that drift apart",
      "Kappa: single streaming path, historical reprocessing via Kafka topic replay",
      "Kappa requires durable event log (Kafka) and streaming framework capable of high-throughput replay",
      "Lambda still valid when global-sort or full-table aggregations can't be streamed accurately",
      "Modern lakehouses (Delta Lake, Apache Iceberg) increasingly make this choice less binary"
    ],
    hint: "What does 'reprocessing historical data' look like in each architecture — what infrastructure does that require?",
    common_trap: "Choosing Lambda 'to be safe' without considering the maintenance cost of two pipelines. Teams routinely discover the batch and speed layers give different answers, and there's no canonical truth.",
    follow_up_questions: [
      { text: "How does Kafka enable historical reprocessing in Kappa?", type: "linked", links_to: "4.3.03" },
      { text: "What is a lakehouse and how does it relate to Lambda/Kappa?", type: "linked", links_to: "8.3.03" }
    ],
    related: ["8.1.01", "8.2.01", "8.3.03", "4.3.03"],
    has_diagram: true,
    diagram: `LAMBDA:
Source → Batch Layer (Spark) ──────────────┐
       → Speed Layer (Flink) → Serving Layer → Query

KAPPA:
Source → Kafka → Streaming Job → Serving Layer → Query
                ↑ replay for reprocessing`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["lambda-architecture", "kappa-architecture", "batch", "streaming", "data-pipeline"]
  },

  {
    id: "8.1.03",
    section: 8,
    subsection: "8.1",
    level: "intermediate",
    question: "How do you design a pipeline for ingesting data from unreliable or heterogeneous sources?",
    quick_answer: "→ Use a raw landing zone — ingest data as-is before any transformation\n→ Validate at the boundary: schema check, null rates, volume sanity\n→ Quarantine bad records — don't drop, preserve for investigation\n→ Dead letter queue (DLQ) pattern: failed records routed to separate store\n→ Decouple ingestion from transformation — source failures don't break downstream processing",
    detailed_answer: "In enterprise data engineering, sources are almost always unreliable — APIs return partial data, databases have nullable columns that shouldn't be, files arrive late or in wrong formats, schemas change without warning.\n\nThe foundational pattern is the raw landing zone: ingest data exactly as received (no transformation) into immutable storage (S3 prefix, ADLS container). This means you always have the original data to replay from if processing logic changes.\n\nAt the ingestion boundary, validate quickly: does the record have required fields? Is the volume within expected range (too few records = upstream issue, too many = possible duplicate run)? Schema drift detection — alert if new columns appear or types change.\n\nFor bad records, never silently drop. Route to a dead letter zone with enough context to diagnose: original record, error message, timestamp, pipeline version. A DLQ is a first-class citizen of the pipeline architecture.\n\nDecoupling ingestion from transformation means ingestion writes to the raw zone and exits; transformation jobs consume from the raw zone independently. A failing transformation doesn't block ingestion, and you can replay transformation over historical raw data.\n\nFor heterogeneous sources (REST APIs, databases, files, events), use a connector framework (Kafka Connect, Airbyte, Fivetran) rather than custom per-source code. Standardise on a common wire format (Avro, Parquet, JSON with schema registry) early.",
    key_points: [
      "Raw landing zone (immutable, as-is ingest) enables replay without re-extracting from source",
      "Schema registry enforces contracts at the boundary — reject or quarantine schema violations",
      "Dead letter queue: preserve bad records with diagnostic context, never silently drop",
      "Decouple ingestion from transformation — source failures must not cascade downstream",
      "Volume and freshness SLAs: alert if daily batch arrives late or has anomalous record count",
      "Connector frameworks (Kafka Connect, Airbyte) over custom per-source code — reduces maintenance"
    ],
    hint: "What happens to your pipeline when a source sends 10x the expected records? And when a source sends zero records — how do you tell the difference between 'no new data' and 'the source is broken'?",
    common_trap: "Transforming data during ingestion — if the transformation logic has a bug you've lost the original data and can't replay correctly. Always land raw first.",
    follow_up_questions: [
      { text: "How does the dead letter queue pattern work in messaging systems?", type: "linked", links_to: "4.3.02" },
      { text: "What is the data lake zone architecture (raw/curated/consumption)?", type: "linked", links_to: "8.3.01" }
    ],
    related: ["8.1.01", "8.3.01", "4.3.02"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["data-ingestion", "dead-letter-queue", "raw-zone", "schema-registry", "data-quality"]
  },

  {
    id: "8.1.04",
    section: 8,
    subsection: "8.1",
    level: "advanced",
    question: "How do you design a data pipeline orchestration layer — what does a robust orchestration platform look like?",
    quick_answer: "→ Orchestrator manages DAG of tasks: scheduling, dependency resolution, retries, alerting\n→ Requirements: exactly-once task execution, retry with backoff, SLA monitoring, backfill support\n→ Apache Airflow is dominant — DAGs in Python, rich integrations, UI for monitoring\n→ Prefer operator-per-step over mega-operators: granular retry and observability\n→ Separate compute (Spark, dbt) from orchestration (Airflow) — orchestrator only triggers, not runs",
    detailed_answer: "A data pipeline orchestration layer manages the scheduling, dependency resolution, retry logic, and monitoring of pipeline tasks. Without orchestration, you have cron jobs with no dependency awareness — a downstream job runs even if the upstream failed.\n\nA robust orchestration platform needs:\n\n1. DAG-based dependency modelling: tasks declare dependencies explicitly; the orchestrator resolves execution order and handles partial failures by retrying only failed tasks, not the whole pipeline.\n\n2. Exactly-once task execution: if the orchestrator crashes mid-run, restarting must not re-execute already-completed tasks. This requires external state storage (Postgres/MySQL for Airflow) to track task states durably.\n\n3. Retry with exponential backoff and dead letter semantics: transient failures (API rate limits, DB blips) should auto-retry; permanent failures (bad data, code bugs) should page the on-call and route to DLQ.\n\n4. Backfill support: the ability to re-run historical date partitions, e.g., reprocess all of last month's data after a bug fix. This requires pipelines parameterised by logical date, not wall-clock time.\n\n5. SLA monitoring: if the 06:00 daily report hasn't completed by 05:45, send an early warning.\n\nApache Airflow is the industry standard. Common pitfalls: putting data processing logic inside Airflow operators (should only trigger Spark/dbt), fat DAGs with too many dependencies (split into modular DAGs), and not testing DAGs in CI.\n\nModern alternatives: Prefect, Dagster (stronger data-awareness, type-checked inputs/outputs), and cloud-native options (AWS Step Functions, Google Cloud Composer).",
    key_points: [
      "DAG-based orchestration: tasks declare dependencies, orchestrator resolves order and partial retries",
      "Durable task state (external DB): orchestrator restarts must not re-execute completed tasks",
      "Parameterise by logical date not wall-clock time — enables backfill over arbitrary historical windows",
      "Separate compute from orchestration: Airflow triggers Spark/dbt, doesn't run data processing itself",
      "SLA alerting: early warning when daily pipelines risk missing their SLO",
      "Prefer granular operators: one task per logical step gives fine-grained retry and observability"
    ],
    hint: "What happens to your in-progress tasks when the orchestration server crashes and restarts? And how does an operator re-run last month's data without re-running today's?",
    common_trap: "Putting heavy data processing logic inside Airflow Python operators — the scheduler node becomes a bottleneck and you lose all the benefits of distributed compute.",
    follow_up_questions: [
      { text: "How does dbt fit into a modern data pipeline stack?", type: "inline", mini_answer: "dbt (data build tool) handles SQL-based transformation: defines models as SELECT statements, manages dependencies between models, runs tests (not-null, unique, referential integrity), and generates lineage docs. Airflow or Prefect orchestrates dbt runs; dbt is not an orchestrator itself." },
      { text: "How do you test data pipeline DAGs in CI?", type: "inline", mini_answer: "Lint DAGs for import errors, test that DAGs parse without exceptions, use pytest to verify task counts and dependencies, and run integration tests against a sandbox environment with a subset of real data." }
    ],
    related: ["8.1.01", "8.5.01", "6.1.01"],
    has_diagram: false,
    diagram: "",
    has_code: true,
    code_language: "python",
    code_snippet: `# Airflow DAG — parameterised by logical date, granular tasks
from airflow import DAG
from airflow.providers.amazon.aws.operators.emr import EmrAddStepsOperator
from airflow.providers.dbt.cloud.operators.dbt import DbtCloudRunJobOperator
from datetime import datetime, timedelta

with DAG(
    dag_id="daily_sales_pipeline",
    schedule_interval="0 2 * * *",       # 02:00 UTC daily
    start_date=datetime(2024, 1, 1),
    catchup=True,                         # enable backfill
    default_args={
        "retries": 3,
        "retry_delay": timedelta(minutes=5),
        "sla": timedelta(hours=4),        # alert if not done by 06:00
    }
) as dag:

    ingest = EmrAddStepsOperator(          # trigger Spark, not run it
        task_id="ingest_raw",
        job_flow_id="{{ var.value.emr_cluster_id }}",
        steps=[{
            "Name": "ingest-sales-{{ ds }}",  # ds = logical date
            "ActionOnFailure": "CONTINUE",
            "HadoopJarStep": {
                "Jar": "command-runner.jar",
                "Args": ["spark-submit", "s3://scripts/ingest.py",
                         "--date", "{{ ds }}"]
            }
        }]
    )

    transform = DbtCloudRunJobOperator(    # trigger dbt, not run it
        task_id="transform",
        job_id=12345,
        additional_run_config={"target": "prod"}
    )

    ingest >> transform`,
    tags: ["orchestration", "airflow", "dag", "backfill", "sla", "dbt"]
  },

  {
    id: "8.1.05",
    section: 8,
    subsection: "8.1",
    level: "intermediate",
    question: "How do you handle schema evolution in a data pipeline without breaking downstream consumers?",
    quick_answer: "→ Use a schema registry (Confluent, AWS Glue) — enforce compatibility at publish time\n→ Backward compatibility: new schema can read old data (add optional fields, never remove)\n→ Forward compatibility: old schema can read new data\n→ Full compatibility: both directions — hardest to maintain\n→ Schema-on-read (Parquet, Avro) tolerates evolution better than rigid relational schemas",
    detailed_answer: "Schema evolution is one of the most underestimated operational risks in data engineering. A producer adds a field, renames a column, or changes a type — and suddenly downstream jobs fail silently or crash.\n\nThe solution is a schema registry — a centralised service where every schema version is registered and compatibility rules are enforced before a producer can publish. Confluent Schema Registry and AWS Glue Data Catalog are the most common. When a producer tries to register a new schema version, the registry checks it against the compatibility policy.\n\nCompatibility modes:\n- Backward compatible: new schema can deserialise messages written with old schema. Consumers can upgrade first. Rule: only add optional fields.\n- Forward compatible: old schema can deserialise messages written with new schema. Producers can upgrade first. Rule: only add fields with defaults.\n- Full compatible: both. Required for rolling upgrades in either direction. Hardest to maintain.\n- Breaking change: rename a required field, change a type. These require a coordinated migration or a new topic/stream/table.\n\nFor file-based pipelines (Parquet, ORC): column pruning and projection pushdown mean adding columns doesn't break readers. Renaming or removing columns is still breaking — use column aliasing or a migration script.\n\nFor SQL-based warehouses: additive migrations (add column NOT NULL DEFAULT) are safe. Dropping columns requires a deprecation period. dbt handles this with schema tests and version-controlled migrations.\n\nStrategy for breaking changes: create a new schema version alongside the old one, run both consumers in parallel, migrate consumers, then retire the old schema.",
    key_points: [
      "Schema registry enforces compatibility rules before a producer can publish — prevents surprise breaks",
      "Backward compatible = add optional fields only — consumers upgrade first safely",
      "Forward compatible = producers upgrade first — old consumers still read new messages",
      "Breaking changes require coordinated migration: new topic/stream + parallel consumer cutover",
      "Avro and Parquet tolerate column additions natively; column renames/removals are always breaking",
      "dbt schema tests + version-controlled migrations make warehouse schema evolution auditable"
    ],
    hint: "If a producer renames a field that 15 downstream jobs depend on, what does a safe migration look like — what's the order of operations?",
    common_trap: "Assuming JSON without a schema registry is flexible — it is, but it's flexibility through chaos. Consumer jobs discover schema changes at runtime, by breaking in production.",
    follow_up_questions: [
      { text: "How does Avro enforce schema compatibility in Kafka?", type: "inline", mini_answer: "Avro schemas are registered in Confluent Schema Registry. Producers serialise with the writer schema; consumers deserialise with the reader schema. The Avro library handles field resolution (add fields with defaults, ignore unknown fields), enforcing compatibility rules without breaking old consumers." },
      { text: "How do you handle schema evolution in a data lake (Parquet files)?", type: "inline", mini_answer: "Apache Iceberg and Delta Lake track schema versions as table metadata. Iceberg supports safe column adds/renames/drops with metadata-only operations. Parquet files store column names; readers use schema projection to ignore unknown columns and fill missing columns with nulls (for backwards compat)." }
    ],
    related: ["8.1.01", "8.3.02", "4.3.03"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["schema-evolution", "schema-registry", "avro", "parquet", "backward-compatibility", "data-pipeline"]
  },

  // ─────────────────────────────────────────────────
  // 8.2 Stream Processing (5q)
  // ─────────────────────────────────────────────────

  {
    id: "8.2.01",
    section: 8,
    subsection: "8.2",
    level: "basic",
    question: "What is stream processing and how does it differ from batch processing architecturally?",
    quick_answer: "→ Stream processing: continuous, event-by-event (or micro-batch) computation as data arrives\n→ Batch: processes a bounded dataset on a schedule; simpler but higher latency\n→ Stream processing maintains state across events (e.g. running counts, joins over time windows)\n→ Core challenges: out-of-order events, exactly-once semantics, state management\n→ Use streaming when latency < minutes; use batch when throughput matters more than freshness",
    detailed_answer: "Stream processing treats data as an unbounded, continuous flow of events and processes each event (or small micro-batch) as it arrives. Batch processing treats data as a bounded, fixed dataset and processes it in bulk on a schedule.\n\nArchitectural differences:\n\n**Latency**: Streaming delivers results in seconds to milliseconds. Batch delivers results hours after the events occurred.\n\n**State management**: Streaming jobs must maintain state across events (e.g., counting unique users in the last 5 minutes). This state lives in-memory or in a distributed state backend (RocksDB in Flink, checkpointed to S3). Batch has no state problem — it reads everything from storage.\n\n**Fault tolerance**: Batch jobs restart from the beginning (or a checkpoint). Streaming jobs must resume from the exact offset they were processing when they crashed — this requires distributed checkpointing and offset management (Kafka consumer group offsets, Flink savepoints).\n\n**Exactly-once semantics**: Batch retries are safe if idempotent. Streaming exactly-once is expensive — it requires distributed transactions or idempotent writes coordinated with offset commits.\n\n**Operational complexity**: Streaming is significantly harder to operate. You need to manage backpressure, state store health, out-of-order event handling, and consumer group lag monitoring.\n\nKey streaming frameworks: Apache Flink (stateful, exactly-once, low latency), Spark Structured Streaming (higher latency, easier ops), Kafka Streams (embedded in JVM apps), Google Dataflow/Apache Beam (portable API).",
    key_points: [
      "Stream processing = continuous computation on unbounded data; batch = scheduled computation on bounded data",
      "Streaming requires stateful computation: windows, joins, aggregations across time",
      "Fault tolerance: streaming needs checkpointed state + offset management to resume mid-stream",
      "Exactly-once in streaming is expensive — requires idempotent sinks or distributed transactions",
      "Backpressure management: slow consumers signal slow producers rather than buffering infinitely",
      "Flink for exactly-once stateful processing; Spark Structured Streaming for simpler ops at higher latency"
    ],
    hint: "What happens to your stream processing job's state when the job crashes and restarts? And how does the job know which events it already processed?",
    common_trap: "Treating stream processing as 'just fast batch' — stream processing requires fundamentally different state management, fault tolerance, and exactly-once semantics that don't exist in batch.",
    follow_up_questions: [
      { text: "How does Apache Kafka enable stream processing at scale?", type: "linked", links_to: "4.3.03" },
      { text: "What are time windows in stream processing?", type: "linked", links_to: "8.2.04" },
      { text: "How do you handle late-arriving events in a stream?", type: "linked", links_to: "8.2.05" }
    ],
    related: ["8.2.02", "8.2.04", "8.1.01", "4.3.03", "1.3.01"],
    has_diagram: true,
    diagram: `BATCH:
Source → [read all data] → [process] → [write results] → Done
                              ↑ one pass, high throughput

STREAM:
Source → Kafka → [Flink job] → [Sink] → Continuous output
                    ↑ maintains state (RocksDB)
                    ↑ checkpoints to S3 every N seconds`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["stream-processing", "batch-processing", "flink", "kafka", "exactly-once", "stateful"]
  },

  {
    id: "8.2.02",
    section: 8,
    subsection: "8.2",
    level: "intermediate",
    question: "What are exactly-once semantics in stream processing and how are they achieved?",
    quick_answer: "→ Exactly-once: each event is processed and its effect appears in the sink exactly once, even on failure\n→ At-least-once (simpler): events may be reprocessed; requires idempotent sink\n→ At-most-once (lossy): events may be dropped; unacceptable for financial data\n→ Flink achieves EOS via distributed snapshots (Chandy-Lamport) + transactional sink writes\n→ Kafka achieves EOS via idempotent producer + transactional API across input + output topics",
    detailed_answer: "Exactly-once semantics (EOS) means every input event contributes to the output exactly once, even in the presence of failures and retries. This is the hardest guarantee to provide in a distributed streaming system.\n\nThe three delivery guarantees:\n- At-most-once: fire and forget. If the job crashes, some events are lost. Simplest, but unacceptable for business-critical data.\n- At-least-once: events are replayed on failure. Duplicates are possible. Acceptable if the sink is idempotent (writing the same record twice has the same effect as writing once).\n- Exactly-once: no duplicates, no losses. Hardest and most expensive.\n\nFlink's approach: distributed snapshots using the Chandy-Lamport algorithm. Flink periodically injects barrier markers into the data stream. When a barrier passes through all operators, their state is snapshotted to durable storage (S3). On failure, the job resets to the last complete snapshot, re-reads events from that point in Kafka, and replays. For EOS end-to-end, Flink uses a two-phase commit with the sink: the sink writes in a pre-commit state, and only commits when the snapshot completes successfully.\n\nKafka's approach (producer side): idempotent producer assigns sequence numbers; the broker deduplicates retries. The transactional API allows atomically writing to multiple partitions/topics — all writes commit or all roll back.\n\nPractical note: EOS has a throughput penalty (typically 10-30%). For many use cases, at-least-once with idempotent sinks gives the same business outcome at lower cost.",
    key_points: [
      "Three guarantees: at-most-once (lossy), at-least-once (duplicates), exactly-once (neither)",
      "Flink EOS: distributed snapshots (Chandy-Lamport) + two-phase commit with the sink",
      "Kafka EOS: idempotent producer (sequence numbers) + transactional API (atomic multi-partition writes)",
      "EOS has throughput cost (~10-30%) — evaluate whether at-least-once + idempotent sink is sufficient",
      "Idempotent sink: writing the same record twice produces the same result (upsert by primary key)",
      "End-to-end EOS requires: idempotent source reads, EOS processing, transactional sink writes"
    ],
    hint: "If your stream processing job crashes and replays the last 10 minutes of events, what prevents your aggregation counts from being doubled in the output database?",
    common_trap: "Configuring Flink or Kafka for EOS but writing to a sink that doesn't support transactions (e.g. plain HTTP API) — you get EOS internally but at-least-once externally.",
    follow_up_questions: [
      { text: "How does Kafka's transactional API achieve exactly-once across topics?", type: "linked", links_to: "4.3.05" },
      { text: "When is at-least-once with idempotent writes sufficient vs needing true EOS?", type: "inline", mini_answer: "At-least-once + idempotent sink is sufficient when the sink supports upsert by natural key (e.g. database with primary key, DynamoDB conditional write). True EOS is needed when the sink has no deduplication capability (append-only logs, financial ledgers where duplicates cause incorrect balances)." }
    ],
    related: ["8.2.01", "4.3.05", "1.3.02"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["exactly-once", "stream-processing", "flink", "kafka", "fault-tolerance", "idempotency"]
  },

  {
    id: "8.2.03",
    section: 8,
    subsection: "8.2",
    level: "intermediate",
    question: "How do you architect a real-time fraud detection pipeline using stream processing?",
    quick_answer: "→ Ingest transaction events via Kafka (low latency, ordered per user)\n→ Flink stateful job: per-user feature computation (velocity, amount deviation, geo anomaly)\n→ Score against ML model (embedded or via feature store lookup)\n→ High-risk transactions → block + alert; medium risk → step-up auth\n→ Latency budget: p99 < 200ms from transaction to decision",
    detailed_answer: "A real-time fraud detection pipeline illustrates the full power of stream processing. The latency requirement is typically under 200ms from transaction event to block/allow decision — too tight for any batch approach.\n\nArchitecture:\n\n1. Ingest: Transaction events published to Kafka, partitioned by user ID (ensures all events for a user go to the same partition/consumer, enabling stateful per-user computation without cross-partition coordination).\n\n2. Stateful feature computation (Flink): For each transaction event, the Flink job looks up and updates per-user state: transactions in last 10 minutes (velocity), running average transaction amount, last known country, device fingerprint. State is stored in RocksDB, checkpointed to S3.\n\n3. ML scoring: the feature vector is passed to a fraud model. The model can be embedded in the Flink job (low latency, no network hop) or served via a feature store + model serving endpoint (more operationally complex but easier to update models without redeploying the job).\n\n4. Decision routing: score > threshold → immediate block + event published to notification topic. Medium score → route to step-up authentication service. Low score → passthrough.\n\n5. Feedback loop: confirmed fraud labels are written back to a training store (Delta Lake) for model retraining.\n\nKey design decisions: partition Kafka by user ID (stateful locality), use RocksDB state backend (spills to disk for large state), embed lightweight models (random forest, gradient boosting) rather than deep learning for latency.\n\nMonitoring: consumer group lag (are we keeping up?), p99 scoring latency, false positive rate (too many blocks = customer friction).",
    key_points: [
      "Partition Kafka by user ID: all events for a user land on the same partition, enabling stateful per-user features",
      "Flink RocksDB state backend: persists per-user state on disk, handles state larger than memory",
      "Embed model in Flink job for lowest latency; model serving endpoint for easier model updates",
      "Latency budget: p99 < 200ms end-to-end — every component must be profiled against this",
      "Feedback loop: confirmed fraud labels flow back to training pipeline for continuous model improvement",
      "Monitor consumer group lag: if lag grows, the pipeline can't keep up with transaction volume"
    ],
    hint: "If you partition Kafka by transaction ID instead of user ID, what stateful computation becomes impossible or very expensive?",
    common_trap: "Calling an external ML serving endpoint for every transaction — a single 50ms model call at 10K TPS requires 500 parallel connections and adds latency spikes under load. Embed the model or use async batched scoring.",
    follow_up_questions: [
      { text: "How does Kafka partitioning enable stateful per-user computation?", type: "linked", links_to: "4.3.06" },
      { text: "How does a feature store support real-time ML scoring?", type: "linked", links_to: "8.4.02" }
    ],
    related: ["8.2.01", "8.4.01", "8.4.02", "4.3.03", "4.3.06"],
    has_diagram: true,
    diagram: `Transactions → Kafka (partitioned by userID)
                    ↓
              Flink Job (stateful)
              ├── per-user velocity features (RocksDB)
              ├── ML model scoring (embedded)
              └── decision: block / step-up / allow
                    ↓              ↓
              Block topic    Notification service`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["fraud-detection", "stream-processing", "flink", "kafka", "ml", "real-time"]
  },

  {
    id: "8.2.04",
    section: 8,
    subsection: "8.2",
    level: "intermediate",
    question: "What are time windows in stream processing and when do you use each type?",
    quick_answer: "→ Tumbling: fixed, non-overlapping intervals (e.g. hourly report) — simplest\n→ Sliding: overlapping windows (e.g. 1-hour window every 15 minutes) — smooth metrics\n→ Session: gap-based grouping (e.g. user activity session, ends after 30 min inactivity)\n→ Global: unbounded window, accumulates until trigger — rare, usually wrong choice\n→ Use event time (not processing time) to handle late arrivals correctly",
    detailed_answer: "Windowing is how stream processing handles bounded aggregations on an unbounded stream. Instead of aggregating all events forever, you group events into windows and produce results per window.\n\nWindow types:\n\n**Tumbling windows**: Fixed-size, non-overlapping intervals. Every event belongs to exactly one window. Example: total sales per hour. Simple to implement and reason about. Produces exactly one result per interval.\n\n**Sliding windows**: Fixed-size windows that advance by a smaller step. Example: 1-hour window every 15 minutes. Produces smoother metrics but each event appears in multiple windows (overlap factor = window size / slide size). Higher compute cost.\n\n**Session windows**: Dynamic size based on activity gaps. A new session starts when an event arrives after a gap > threshold. Example: user web session — events grouped until 30 minutes of inactivity. Useful for user behaviour analytics. Window size varies per user.\n\n**Global windows**: One window for all time. Only useful with custom triggers (e.g. trigger on count reaching 1000). Rarely the right choice — accumulates state indefinitely.\n\nEvent time vs processing time: always prefer event time (timestamp embedded in the event itself). Processing time is when the event arrives at the processor — it can vary wildly with network delays or consumer lag. Aggregating by processing time produces wrong results for late events.\n\nWatermarks: Flink and Spark use watermarks to track event time progress. A watermark of T means 'all events with timestamp ≤ T have been observed.' Events arriving after the watermark are late events, handled by allowed lateness settings.\n\nAllowed lateness: how long to wait for late events before closing a window and emitting results. Longer lateness = more accurate but higher latency.",
    key_points: [
      "Tumbling: non-overlapping, fixed-size — one result per window, simplest semantics",
      "Sliding: overlapping, fixed-size — smooth metrics but higher compute (each event in multiple windows)",
      "Session: gap-based grouping — ideal for user activity, window size varies dynamically",
      "Always use event time, not processing time — network delays corrupt processing-time aggregations",
      "Watermarks track event time progress — the system's best estimate of 'all events up to T have arrived'",
      "Allowed lateness: window stays open N seconds past watermark to accommodate stragglers"
    ],
    hint: "If you aggregate 'clicks per minute' using processing time and Kafka consumer lag suddenly jumps from 0 to 5 minutes, what happens to your windowed counts?",
    common_trap: "Using processing time for windowed aggregations — any consumer lag, network blip, or deployment restart skews the window boundaries, producing results that don't reflect actual business time.",
    follow_up_questions: [
      { text: "How do you handle late-arriving events in a stream?", type: "linked", links_to: "8.2.05" },
      { text: "What is backpressure and how does a stream processor handle it?", type: "linked", links_to: "4.3.10" }
    ],
    related: ["8.2.01", "8.2.05", "4.3.10"],
    has_diagram: true,
    diagram: `TUMBLING (1hr):    |--W1--|--W2--|--W3--|
SLIDING (1hr/15m): |--W1--|
                       |--W2--|
                           |--W3--|
SESSION (30m gap): |--sess1--|   |--s2--|  |--s3--|
                   ^^^^^^^^^ user A      user A`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["windowing", "stream-processing", "flink", "event-time", "tumbling", "sliding", "session"]
  },

  {
    id: "8.2.05",
    section: 8,
    subsection: "8.2",
    level: "advanced",
    question: "How do you handle late-arriving data in a stream processing pipeline?",
    quick_answer: "→ Use event time + watermarks — watermark tracks expected completeness horizon\n→ Allowed lateness: window stays open N seconds past watermark to accommodate stragglers\n→ Side output / late data channel: events arriving after close go to a separate stream for correction\n→ Retractions: emit correction record when late event changes a committed result\n→ Trade-off: longer allowed lateness = more accuracy but higher result latency",
    detailed_answer: "Late-arriving data is the norm in distributed systems, not the exception. Network delays, consumer lag, mobile clients batching events offline, and clock skew all cause events to arrive out of order.\n\nWatermarks: a watermark is the stream processor's assertion that 'I've seen all events with timestamp ≤ T.' Events arriving after the watermark for their window are 'late.' Watermarks advance heuristically — typically set as max_seen_event_time minus a configured lag budget.\n\nAllowed lateness: rather than closing windows the moment the watermark passes, a streaming framework can keep windows open for an additional allowed lateness duration. During this period, late events update the window result and a new (updated) result is emitted. After allowed lateness expires, the window is purged.\n\nSide outputs (Flink) / late data channels: events arriving after allowed lateness expires are routed to a side output stream. These can be:\n- Logged and monitored (are late arrivals increasing? upstream issue?)\n- Routed to a correction pipeline that applies updates to the already-committed results\n- Counted as a data quality metric\n\nRetractions: some streaming systems (Flink SQL, Apache Beam) support retraction streams. When a late event changes a previously committed result, a retraction message is emitted (delete the old result) followed by an update (insert the new result). Sinks must support retractions.\n\nDesign trade-offs: very short allowed lateness = fast results but more inaccuracy. Very long allowed lateness = accurate results but delayed outputs and large state. Choose based on how late events affect downstream SLAs and whether small inaccuracies are acceptable.",
    key_points: [
      "Watermarks advance heuristically: max(event_time) − lag_budget — balance completeness vs latency",
      "Allowed lateness: window open N seconds past watermark — late events update result, new emission triggered",
      "Side output: events past allowed lateness → separate stream for monitoring, correction, or discard",
      "Retractions: late event changes committed result → emit delete + updated insert to downstream",
      "Monitor late event rate as a data quality metric — increasing late rate signals upstream or network issues",
      "Long watermark lag = accurate results at higher latency and larger state; tune per business SLA"
    ],
    hint: "A mobile app batches events locally and uploads them when connectivity is restored — events can be up to 4 hours late. How do you set watermarks and allowed lateness for a 5-minute windowed report?",
    common_trap: "Setting allowed lateness to zero for simplicity — even 1-second network jitter causes events to be treated as late, producing incorrect window results for a fraction of events that silently distort aggregations.",
    follow_up_questions: [
      { text: "What are time windows in stream processing?", type: "linked", links_to: "8.2.04" },
      { text: "How does Flink's checkpointing relate to late data handling?", type: "inline", mini_answer: "Flink checkpoints save window state (including the accumulated values and which events have been processed) to durable storage. On restart, the job resets to the last checkpoint and re-reads events from the saved Kafka offset, so late events that arrived before the crash are not lost — the window state will be correctly updated when the job replays them." }
    ],
    related: ["8.2.01", "8.2.04", "8.2.02"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["late-data", "watermarks", "stream-processing", "flink", "allowed-lateness", "retractions"]
  },

  // ─────────────────────────────────────────────────
  // 8.3 Data Lake & Warehouse (5q)
  // ─────────────────────────────────────────────────

  {
    id: "8.3.01",
    section: 8,
    subsection: "8.3",
    level: "basic",
    question: "What is a data lake and how do you design its zone architecture?",
    quick_answer: "→ Data lake: centralised repository storing raw data at any scale in native format\n→ Zone architecture: Raw → Curated (cleaned) → Consumption (modelled for analytics)\n→ Raw zone: immutable, as-ingested — never delete, enables replay\n→ Curated zone: validated, deduplicated, standardised schema\n→ Consumption zone: star/snowflake schema, aggregations, BI-ready",
    detailed_answer: "A data lake is a centralised storage repository that holds raw data in its native format — structured (CSV, Parquet), semi-structured (JSON, XML), or unstructured (images, logs) — at petabyte scale and low cost (S3, ADLS, GCS).\n\nThe zone architecture (also called the medallion architecture in Databricks terminology) organises data by quality and purpose:\n\n**Raw zone (Bronze)**: Data is ingested exactly as received from the source. Immutable — no transformation, no deletion. This is your safety net: if a transformation bug corrupts curated data, you replay from raw. Partitioned by ingestion date, not business date.\n\n**Curated zone (Silver)**: Cleaned, validated, and standardised data. Transformations applied: deduplication, null handling, type casting, schema normalisation. Still relatively close to source structure. Data quality checks run at this layer.\n\n**Consumption zone (Gold)**: Business-oriented, analytics-ready data. Star schema dimension/fact tables, aggregations, business metrics. Optimised for query performance — heavily partitioned by business date, clustered, Z-ordered or sorted. This layer feeds BI tools, ML feature extraction, and reports.\n\nGovernance across zones: access control is zone-based (raw zone typically locked to engineering, consumption zone open to analysts). Retention policies differ — raw may be retained 7 years for compliance; consumption is rebuilt on demand from raw.\n\nStorage format choice: Parquet or ORC for curated/consumption (columnar, compressed, fast analytics). Raw can be in original format or converted to Parquet immediately on ingest for uniformity.",
    key_points: [
      "Raw zone: immutable as-ingested data — the source of truth for all reprocessing scenarios",
      "Curated zone: cleaned, validated, standardised — quality checks run here",
      "Consumption zone: star schema, aggregations, BI-optimised — rebuilt from curated on logic changes",
      "Access control by zone: raw locked to engineering, consumption open to analysts/data scientists",
      "Parquet/ORC for curated and consumption zones: columnar, compressed, predicate pushdown",
      "Medallion (Bronze/Silver/Gold) is Databricks' naming for the same Raw/Curated/Consumption pattern"
    ],
    hint: "A bug in your curated-zone transformation script corrupted three months of data. How does the zone architecture help you recover — and what's the recovery procedure?",
    common_trap: "Deleting or mutating raw zone data for 'space savings' — you lose the ability to replay and recover from transformation bugs, turning the data lake into an unrecoverable data swamp.",
    follow_up_questions: [
      { text: "What is Apache Iceberg and why does it power modern data lakes?", type: "linked", links_to: "8.3.02" },
      { text: "How do you implement data quality checks in the curated zone?", type: "linked", links_to: "8.5.02" },
      { text: "How do you design storage in a cloud environment to support this?", type: "linked", links_to: "5.4.01" }
    ],
    related: ["8.3.02", "8.3.03", "8.1.01", "5.4.01"],
    has_diagram: true,
    diagram: `Sources → [Raw / Bronze]     → [Curated / Silver] → [Consumption / Gold]
             (as-is, immutable)   (cleaned, typed)     (star schema, BI)
                  ↓                    ↓                     ↓
             All formats           Parquet/ORC            Parquet/ORC
             7yr retention         Quality checks         Query-optimised
             Engineering only      Engineering+DS         All analysts`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["data-lake", "zone-architecture", "medallion", "bronze-silver-gold", "raw-zone", "data-engineering"]
  },

  {
    id: "8.3.02",
    section: 8,
    subsection: "8.3",
    level: "intermediate",
    question: "What is Apache Iceberg and why has it become the standard for data lake table formats?",
    quick_answer: "→ Iceberg is an open table format providing ACID transactions, schema evolution, and time travel on object storage\n→ Solves the 'small files' and 'listing overhead' problems of raw Hive/S3 architectures\n→ ACID: multiple writers can commit without corrupting reads (snapshot isolation)\n→ Time travel: query data as it was at any past snapshot\n→ Hidden partitioning: queries don't need to know partition layout; Iceberg optimises at plan time",
    detailed_answer: "Apache Iceberg is an open table format for large analytic datasets stored on object storage (S3, ADLS, GCS). It sits above the file format (Parquet, ORC) and below the query engine (Spark, Trino, Flink, Athena), providing capabilities that previously required a database.\n\nKey capabilities:\n\n**ACID transactions**: Iceberg uses optimistic concurrency with a metadata log. Each write creates a new snapshot. Multiple concurrent writers resolve conflicts at commit time — readers always see a consistent snapshot, never partial writes.\n\n**Schema evolution**: Add, rename, reorder, or drop columns as metadata-only operations. Existing Parquet files aren't rewritten. This is the critical capability missing from plain Hive + Parquet.\n\n**Time travel**: query historical data: `SELECT * FROM orders FOR SYSTEM_TIME AS OF '2024-01-15'`. Useful for auditing, debugging data quality issues, and reproducing ML training datasets.\n\n**Hidden partitioning**: Instead of requiring queries to filter on `dt=2024-01-15`, Iceberg tracks which files contain which date ranges in the metadata. The query planner automatically prunes unnecessary files. Partition schemes can be evolved without rewriting data.\n\n**Small file compaction**: Iceberg tracks file metadata, enabling compaction (merging small files into large Parquet files) and snapshot expiry (removing old snapshots) as maintenance operations without downtime.\n\n**Competing formats**: Delta Lake (Databricks, tight Spark integration), Apache Hudi (upsert/streaming-optimised). Iceberg is the most engine-agnostic — works with Spark, Trino, Flink, Athena, BigQuery, Snowflake.",
    key_points: [
      "Iceberg = open table format: ACID + schema evolution + time travel on object storage (S3/GCS/ADLS)",
      "Snapshot-based ACID: each write creates a new snapshot, readers see consistent view, writers resolve conflicts at commit",
      "Schema evolution as metadata operation: add/rename/drop columns without rewriting Parquet files",
      "Time travel: query as-of any historical snapshot — critical for ML reproducibility and debugging",
      "Hidden partitioning: engine prunes files via metadata, queries don't hard-code partition columns",
      "Engine-agnostic: Spark, Trino, Flink, Athena, Snowflake all read/write Iceberg — avoids vendor lock-in"
    ],
    hint: "If you change a partition column from `day` to `month` on a plain Hive/S3 table, what happens to existing data and existing queries? How does Iceberg solve this?",
    common_trap: "Assuming Delta Lake and Iceberg are interchangeable — Delta Lake is tightly coupled to Spark/Databricks, while Iceberg is engine-agnostic. For multi-engine environments (Spark + Trino + Athena), Iceberg is the safer choice.",
    follow_up_questions: [
      { text: "What is the difference between Iceberg, Delta Lake, and Hudi?", type: "inline", mini_answer: "All three are open table formats adding ACID to object storage. Delta Lake: tightest Spark/Databricks integration, log-based, mature ecosystem. Hudi: optimised for upserts and streaming ingestion (record-level merge), strong Kafka integration. Iceberg: most engine-agnostic, best for multi-engine environments (Spark+Trino+Flink+Athena), richest schema evolution, native time travel API." },
      { text: "What is the data lake zone architecture?", type: "linked", links_to: "8.3.01" }
    ],
    related: ["8.3.01", "8.3.03", "8.1.05", "5.4.03"],
    has_diagram: false,
    diagram: "",
    has_code: true,
    code_language: "python",
    code_snippet: `# Time travel and schema evolution with Apache Iceberg (PySpark)
from pyspark.sql import SparkSession

spark = SparkSession.builder \\
    .config("spark.sql.extensions",
            "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions") \\
    .config("spark.sql.catalog.glue", "org.apache.iceberg.spark.SparkCatalog") \\
    .getOrCreate()

# --- Time travel: query historical snapshot ---
df = spark.read \\
    .option("as-of-timestamp", "2024-01-15 00:00:00") \\
    .table("glue.sales.orders")

# --- Schema evolution: add column (metadata-only, no file rewrite) ---
spark.sql("ALTER TABLE glue.sales.orders ADD COLUMN discount_pct DOUBLE")

# --- Snapshot expiry: remove snapshots older than 7 days ---
spark.sql("""
    CALL glue.system.expire_snapshots(
        table => 'sales.orders',
        older_than => TIMESTAMP '2024-01-08 00:00:00'
    )
""")`,
    tags: ["iceberg", "data-lake", "acid", "time-travel", "schema-evolution", "table-format"]
  },

  {
    id: "8.3.03",
    section: 8,
    subsection: "8.3",
    level: "intermediate",
    question: "Data Lake vs Data Warehouse vs Lakehouse — what are the trade-offs and when do you choose each?",
    quick_answer: "→ Data warehouse: structured, SQL-first, strong governance — Redshift, BigQuery, Snowflake\n→ Data lake: any format, cheap storage, flexible schema — S3 + Parquet\n→ Lakehouse: open table formats (Iceberg/Delta) add ACID + SQL to data lake storage\n→ Choose warehouse: BI-dominated, SQL-first teams, strong SLA on query performance\n→ Choose lakehouse: mixed workloads (SQL + ML + streaming), cost-sensitive at petabyte scale",
    detailed_answer: "Data Warehouse: a structured, optimised system for analytical queries. Data is loaded via ETL pipelines, stored in columnar format with rich metadata, and queried via SQL. Strong schema enforcement, excellent query performance (Redshift, BigQuery, Snowflake each hit sub-second queries at petabyte scale), and mature governance. Limitations: expensive at very large scale (storage + compute coupled or semi-coupled), doesn't support unstructured data, ML workloads require exporting data out.\n\nData Lake: raw data in native format on cheap object storage. Supports any data type, scale unlimited, flexible schema (schema-on-read). Cheap storage. Limitations: no ACID, no schema enforcement, query performance poor without careful partitioning, governance hard.\n\nLakehouse: the converging architecture. Open table formats (Iceberg, Delta Lake, Hudi) add ACID transactions, schema enforcement, query optimisation (metadata-based file pruning), and SQL access to data lake storage. Compute is provided by Spark, Trino, Athena, Databricks. The lakehouse aims to give warehouse-quality SQL performance at lake-scale cost, while also supporting ML and streaming workloads on the same data.\n\nChoice framework:\n- BI-first, SQL-only, smaller scale (< 100TB): managed data warehouse (Snowflake, BigQuery) — simplicity wins\n- Petabyte scale, cost-sensitive, ML + SQL + streaming: lakehouse (Databricks, AWS Lake Formation + Iceberg, or open-source Spark + Trino + Iceberg)\n- Legacy, compliance-driven, strong DBA team: traditional warehouse + data lake as staging\n- Startup with unknown workloads: lakehouse from the start — more flexible, avoids expensive re-architecture later",
    key_points: [
      "Warehouse: structured, SQL-first, excellent BI performance, expensive storage at petabyte scale",
      "Data lake: cheap, flexible, any format — but no ACID, poor governance, inconsistent query performance",
      "Lakehouse: open table formats (Iceberg/Delta) add ACID + schema + SQL optimisation to lake storage",
      "Lakehouse supports mixed workloads: SQL analytics + ML training + streaming on the same dataset",
      "For pure BI/SQL workloads under 100TB: managed warehouse wins on simplicity and ops burden",
      "Lakehouse is the converging industry direction — most new architectures are built on it"
    ],
    hint: "Your team has 200TB of data in S3 (Parquet), a BI team doing Tableau dashboards, and a data science team training ML models on the same data. Which architecture minimises data movement and duplication?",
    common_trap: "Building both a data lake AND a data warehouse and syncing data between them — you end up with data consistency problems, double storage costs, and two ETL pipelines to maintain. The lakehouse pattern eliminates this duplication.",
    follow_up_questions: [
      { text: "What is Apache Iceberg and what capabilities does it add?", type: "linked", links_to: "8.3.02" },
      { text: "What is the Lambda vs Kappa architecture debate?", type: "linked", links_to: "8.1.02" }
    ],
    related: ["8.3.01", "8.3.02", "8.4.01", "2.1.01"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["data-lake", "data-warehouse", "lakehouse", "snowflake", "bigquery", "iceberg", "delta-lake"]
  },

  {
    id: "8.3.04",
    section: 8,
    subsection: "8.3",
    level: "intermediate",
    question: "How do you design a dimensional model (star schema) for an analytics data warehouse?",
    quick_answer: "→ Star schema: central fact table (events/transactions) surrounded by dimension tables\n→ Fact table: quantitative measures (revenue, quantity) + foreign keys to dimensions\n→ Dimensions: descriptive attributes (customer, product, date, geography) — denormalised\n→ Grain: the most atomic level the fact table represents (one row = one transaction)\n→ Slowly changing dimensions (SCD Type 2): track historical attribute changes with effective dates",
    detailed_answer: "Dimensional modelling (Ralph Kimball) is the standard technique for designing analytics data warehouses. It optimises for query performance and business usability over storage efficiency.\n\nCore components:\n\n**Fact table**: records business events or measurements. Each row represents one occurrence at the declared grain (e.g. one order line item). Contains: foreign keys to all dimensions, measures (numeric, additive — revenue, quantity), and degenerate dimensions (order number — part of fact, no separate dimension needed).\n\n**Dimension tables**: describe the 'who, what, where, when, why' of the fact. Denormalised (attributes repeated rather than normalised into sub-tables) for query simplicity. Key dimensions: Date (every warehouse needs a date dimension), Customer, Product, Geography.\n\n**Declaring the grain**: the most important design decision. 'One row per transaction line item' is a valid grain. 'One row per order' is a different grain. Mixing grains in a fact table is a common mistake.\n\n**Slowly Changing Dimensions (SCD)**:\n- Type 1: overwrite — no history preserved (acceptable for corrections)\n- Type 2: add a new row with effective_date and end_date — preserves full history (e.g. customer moved to new city — both the old and new address are queryable for historical orders)\n- Type 3: add a 'previous value' column — limited history, rarely used\n\n**Snowflake schema**: dimensions are normalised (Customer → City → Country). Saves storage but joins become complex. Generally avoid — storage is cheap, query simplicity matters more.\n\nStar schema queries join the fact table to one or more dimensions on surrogate keys, filter on dimension attributes, and aggregate measures. Columnar engines (Redshift, BigQuery, Snowflake, ClickHouse) are highly optimised for this pattern.",
    key_points: [
      "Fact table: measures + foreign keys to dimensions; declare grain before anything else",
      "Dimensions: denormalised descriptive attributes — optimise for query usability not storage",
      "Date dimension is always required: preload years of dates with attributes (weekday, quarter, holiday flag)",
      "SCD Type 2: new row per attribute change with effective/end date — enables historical 'as-of' queries",
      "Surrogate keys on dimension tables — natural keys change, surrogate keys never change",
      "Avoid snowflake schema unless storage is genuinely constrained — join complexity kills productivity"
    ],
    hint: "A customer changes their address. Your fact table has 2 years of orders linked to that customer. Which dimension design lets you correctly report 'revenue per city' both as it happened and as-of today?",
    common_trap: "Using natural keys (customer email, product SKU) as dimension keys — when these change (email update, SKU reformat), historical fact rows become orphans. Always use surrogate integer keys.",
    follow_up_questions: [
      { text: "What is data partitioning strategy in a warehouse?", type: "linked", links_to: "8.3.05" },
      { text: "How does data modelling differ in NoSQL systems?", type: "linked", links_to: "2.5.01" }
    ],
    related: ["8.3.01", "8.3.05", "2.5.01"],
    has_diagram: true,
    diagram: `        dim_date ──────┐
        dim_customer ────┤
                         ↓
        dim_product ──→ fact_orders ←── dim_geography
                         ↑
                    dim_promotion

fact_orders columns:
  order_sk (PK surrogate)
  date_sk, customer_sk, product_sk (FKs)
  quantity, revenue, discount (measures)`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["star-schema", "dimensional-model", "data-warehouse", "SCD", "kimball", "fact-table"]
  },

  {
    id: "8.3.05",
    section: 8,
    subsection: "8.3",
    level: "advanced",
    question: "What is your partitioning and clustering strategy for a large analytics table in a cloud data warehouse or lakehouse?",
    quick_answer: "→ Partition by the most common filter column — almost always date (ingestion or business date)\n→ Partitioning prunes files at the storage layer — queries scan zero bytes for non-matching partitions\n→ Clustering / Z-ordering: within a partition, co-locate related rows (by customer_id, region)\n→ Avoid over-partitioning: thousands of tiny partitions hurt metadata query performance\n→ Benchmark: scan cost (bytes) is the primary metric — not query elapsed time alone",
    detailed_answer: "Partitioning and clustering are the primary levers for query performance and cost optimisation in analytics tables at scale.\n\n**Partitioning**: splits the table into physically separate file groups by a column's values. Queries filtering on the partition column skip non-matching partitions entirely at the storage layer — no bytes read, no cost. Classic choice: `event_date` (business date) or `ingestion_date`. In Snowflake: micro-partitions with automatic clustering. In BigQuery: partitioned tables with PARTITION BY. In Iceberg: hidden partitioning by transforms (day, month, year, bucket).\n\nRules:\n- Choose the column most frequently in WHERE clauses\n- Partition granularity: too fine (hourly on a small table) creates thousands of tiny files (metadata overhead); too coarse (yearly) defeats pruning. Daily is the safe default for most event tables.\n- Avoid high-cardinality partitioning (by user_id on a billion-user table) — creates millions of partitions\n\n**Clustering (Iceberg Z-ordering / BigQuery clustering / Redshift sort keys / Snowflake CLUSTER BY)**: within a partition (or across the table for some systems), physically sorts rows so related data is co-located in the same files. A query filtering `WHERE region = 'EMEA' AND customer_tier = 'Gold'` reads far fewer files if rows are Z-ordered by those columns.\n\nZ-ordering (Iceberg, Delta Lake): multi-dimensional sort that co-locates by multiple columns simultaneously — more effective than a single-column sort.\n\n**The over-partitioning trap**: if you partition by `user_id` (10M users × 365 days = 3.65 billion partitions), the metadata catalog becomes the bottleneck — planning takes longer than execution.\n\n**Compaction**: streaming ingestion creates many small files. Periodic compaction merges small files into large ones (128MB–1GB target per file). Iceberg's `OPTIMIZE` command, Delta Lake's `OPTIMIZE`, and BigQuery's automatic clustering handle this.",
    key_points: [
      "Partition by most-filtered column: date wins for most event tables — zero-byte partition pruning",
      "Daily partitioning is safe default: hourly over-partitions, monthly under-prunes",
      "Clustering/Z-ordering: within partitions, co-locate by secondary filter columns (region, customer_tier)",
      "Over-partitioning creates metadata overhead worse than no partitioning — millions of tiny files",
      "Compaction is mandatory for streaming-ingested tables: merge small files periodically",
      "Benchmark by bytes scanned, not elapsed time — cloud warehouses charge per byte scanned"
    ],
    hint: "Your table is partitioned by day (365 partitions/year). A common query filters by `region` and `customer_tier` within the current month. What additional technique reduces bytes scanned within those 30 daily partitions?",
    common_trap: "Partitioning by both date AND region creates a cartesian explosion of partition directories (365 × 50 regions = 18,250 partitions/year). Use date as the partition key and Z-order/cluster by region within partitions instead.",
    follow_up_questions: [
      { text: "How does data partitioning in a warehouse differ from database sharding?", type: "linked", links_to: "2.8.01" },
      { text: "How does Iceberg's hidden partitioning work?", type: "inline", mini_answer: "Iceberg stores partition metadata in the table's manifest files rather than in directory structure. The query planner reads manifests to identify which files contain data for the requested time range, without requiring the query to explicitly reference partition columns. Partition schemes can be evolved (day → month → year) without rewriting data files — Iceberg tracks multiple partition specs in the metadata." }
    ],
    related: ["8.3.01", "8.3.02", "2.8.01"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["partitioning", "clustering", "z-ordering", "data-warehouse", "iceberg", "query-optimisation"]
  },

  // ─────────────────────────────────────────────────
  // 8.4 ML Platform Design (5q)
  // ─────────────────────────────────────────────────

  {
    id: "8.4.01",
    section: 8,
    subsection: "8.4",
    level: "basic",
    question: "What is an ML platform and what are its core architectural components?",
    quick_answer: "→ ML platform: shared infrastructure enabling teams to train, evaluate, deploy, and monitor ML models\n→ Core components: feature store, experiment tracker, model registry, training infrastructure, serving layer, monitoring\n→ Goal: reduce the 90% time ML teams spend on infrastructure vs the 10% on modelling\n→ MLflow is the open-source standard for tracking + registry; Kubeflow for training orchestration\n→ Separate training infrastructure from serving infrastructure — different scaling needs",
    detailed_answer: "An ML platform is the shared infrastructure and tooling that enables data scientists and ML engineers to efficiently develop, train, evaluate, deploy, and monitor machine learning models. Without an ML platform, every team reinvents the same infrastructure, experiments are unreproducible, and model deployment is a months-long engineering project.\n\nCore components:\n\n1. **Feature Store**: centralised repository for features (inputs to ML models). Provides: feature computation and materialisation, offline store (Parquet/Delta for training) and online store (Redis/DynamoDB for low-latency serving), point-in-time correct feature retrieval (critical for training/serving consistency). Examples: Feast, Tecton, Vertex AI Feature Store.\n\n2. **Experiment Tracker**: logs hyperparameters, metrics (loss, accuracy, AUC), artifacts (model checkpoints, plots) for each training run. Enables comparison across runs, team collaboration, and auditability. MLflow Tracking is the standard.\n\n3. **Model Registry**: version-controlled store of trained models with lifecycle stages (staging → production → archived). Stores model artifacts, metadata, lineage (which training data was used, which code version). MLflow Model Registry, Hugging Face Hub, SageMaker Model Registry.\n\n4. **Training Infrastructure**: managed compute for training jobs (GPU clusters, distributed training). Kubernetes-based (Kubeflow, AWS SageMaker Training, Vertex AI Training). Job scheduling, spot instance management, distributed training coordination (Horovod, PyTorch DDP).\n\n5. **Serving Layer**: deploys models as REST/gRPC endpoints. Requirements vary: batch scoring (Spark UDF), near-real-time (<100ms), real-time (<10ms). Separate infrastructure from training — serving needs stable, low-latency, autoscaled compute.\n\n6. **Monitoring**: data drift, prediction drift, model performance degradation. Alerts when live distribution diverges from training distribution.",
    key_points: [
      "Feature store: offline (training) + online (serving) stores with point-in-time correctness",
      "Experiment tracker: logs parameters + metrics + artifacts for reproducibility and team collaboration",
      "Model registry: versioned model store with lifecycle staging (staging → production → archived)",
      "Training infrastructure: separate from serving — different scaling, cost, and latency requirements",
      "Serving layer: batch scoring vs near-real-time vs real-time — each needs different architecture",
      "Monitoring: data drift + prediction drift + business metric degradation — all three must be tracked"
    ],
    hint: "What happens when a model is trained on features computed with one logic, but the serving layer computes those same features with slightly different logic? What architectural component prevents this?",
    common_trap: "Training and serving using different feature computation code ('training-serving skew') — the most common ML production failure. The feature store solves this by ensuring the same feature logic is used offline (training) and online (serving).",
    follow_up_questions: [
      { text: "What is a feature store and how does it prevent training-serving skew?", type: "linked", links_to: "8.4.02" },
      { text: "What is MLOps and how does it differ from DevOps?", type: "linked", links_to: "8.4.04" }
    ],
    related: ["8.4.02", "8.4.03", "8.4.04", "8.5.01"],
    has_diagram: true,
    diagram: `Raw Data → Feature Store → [Offline Store] → Training Job → Model Registry
                          ↓                      ↑                ↓
                    [Online Store]          Experiment       Serving Layer
                          ↓                  Tracker              ↓
                  Model Inference ←──────────────────────── Monitoring`,
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["ml-platform", "mlops", "feature-store", "model-registry", "experiment-tracking", "ml-serving"]
  },

  {
    id: "8.4.02",
    section: 8,
    subsection: "8.4",
    level: "intermediate",
    question: "What is a feature store and how does it solve training-serving skew?",
    quick_answer: "→ Feature store: centralised system for computing, storing, and serving ML features\n→ Offline store: historical features for training (Parquet/Delta Lake, point-in-time correct)\n→ Online store: low-latency feature retrieval for real-time scoring (Redis, DynamoDB, < 5ms)\n→ Training-serving skew: same feature, different computation code → model performs worse in production\n→ Feature store solves skew by sharing one feature definition served to both offline and online stores",
    detailed_answer: "Training-serving skew is the #1 cause of ML model performance degradation in production. It occurs when the feature computation used during training differs — even slightly — from the computation used during serving. Examples: different null handling, different aggregation windows, different data sources used in the pipeline.\n\nA feature store eliminates skew by making feature definitions the single source of truth, materialised to both offline and online stores using identical computation logic.\n\nArchitecture:\n\n**Feature definitions**: declared in code (Python SDK — Feast, Tecton), specify the transformation logic, data source, and materialisation schedule. Version-controlled like software.\n\n**Offline store**: features materialised as Parquet/Delta Lake partitions, indexed by entity (customer_id, product_id) and timestamp. Used for training: 'give me all features for user X as of 2024-01-15 12:00:00'. Point-in-time correctness is critical — the offline store must return features that were available at prediction time, not features computed using future data (data leakage).\n\n**Online store**: low-latency read store (Redis, DynamoDB, Bigtable). Contains the latest feature value per entity. Serving path: request arrives → look up entity features from online store → assemble feature vector → score model → return prediction. Target latency: < 5ms for feature retrieval.\n\n**Materialisation pipeline**: a streaming or batch job computes features from raw data and writes to both stores. The same logic, the same results. No divergence possible.\n\n**Point-in-time correctness**: training uses `as-of` queries — for each training example with a label at time T, retrieve features available at T (not T+1 or T+5minutes). Without this, training data includes future information, producing models that appear excellent in training but fail in production.",
    key_points: [
      "Feature store: single source of truth for feature logic, materialised to offline (training) and online (serving)",
      "Training-serving skew eliminated: same computation code populates both stores",
      "Offline store: point-in-time correct retrieval — features as they existed at prediction time, no data leakage",
      "Online store: Redis/DynamoDB — sub-5ms latency for real-time feature lookup at serving time",
      "Point-in-time correctness critical: using future features in training = data leakage = inflated offline metrics",
      "Feature reuse: once computed, features are available to all models — reduces duplication across teams"
    ],
    hint: "Your user's 'last 30-day purchase count' is computed in batch Python for training and re-computed in Java for the serving API. What could go wrong — and what does wrong actually look like in production?",
    common_trap: "Building a feature store without point-in-time correct training data retrieval — models look great offline (you used features from after the label event), then underperform in production. This is the most subtle and damaging form of data leakage.",
    follow_up_questions: [
      { text: "How does a feature store support real-time fraud detection?", type: "linked", links_to: "8.2.03" },
      { text: "What is model drift and how do you detect it?", type: "linked", links_to: "8.4.05" }
    ],
    related: ["8.4.01", "8.4.05", "8.2.03"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["feature-store", "training-serving-skew", "mlops", "point-in-time", "online-store", "offline-store"]
  },

  {
    id: "8.4.03",
    section: 8,
    subsection: "8.4",
    level: "intermediate",
    question: "How do you design a model training pipeline for production ML?",
    quick_answer: "→ Reproducible: same code + data + config → same model (pinned library versions, data versioning)\n→ Orchestrated: Airflow/Kubeflow triggers training on schedule or data arrival\n→ Parameterised: hyperparameters and data configs externalised, not hardcoded\n→ Tracked: every run logged to experiment tracker (MLflow) with metrics, params, artifacts\n→ Validated before promotion: model passes quality gates (accuracy threshold, data drift check) before registry promotion",
    detailed_answer: "A production model training pipeline is not a Jupyter notebook run by a data scientist — it is a version-controlled, orchestrated, reproducible pipeline that runs on a schedule or trigger and produces a deployable model artifact.\n\nDesign principles:\n\n**Reproducibility**: given the same input data, code version, and configuration, the pipeline must produce the same model. This requires: pinned library versions (requirements.txt with hashes), deterministic data splits (fixed random seed), data version control (DVC, Iceberg snapshot ID, Delta Lake version), and reproducible compute (same Docker image).\n\n**Orchestration**: the pipeline is triggered by a scheduler (Airflow/Prefect) on a defined cadence or by a data quality event (new training data available, drift threshold exceeded). Each step is a discrete DAG task: data extraction → feature engineering → train/val split → training → evaluation → model registration.\n\n**Parameterisation**: hyperparameters, data date ranges, model type, and feature lists are externalised to config files (YAML, Hydra, MLflow Runs API) — not hardcoded. This enables hyperparameter search and model comparison without code changes.\n\n**Experiment tracking**: every run logs to MLflow Tracking: parameters, metrics (train/val AUC, precision, recall), artifacts (model checkpoint, confusion matrix, feature importance plot), and data version used. Enables comparison and audit.\n\n**Quality gates before promotion**: the pipeline must not automatically promote any model to production. Evaluation step checks: metric threshold (AUC > 0.85), comparison to current production model (challenger beats champion), data freshness check, bias/fairness evaluation. Only passing models are registered with 'staging' tag in the model registry — human approval or automated CI promotes to production.\n\n**Distributed training**: for large models, training uses distributed compute (PyTorch DDP across multiple GPUs, Horovod on Spark). Managed by Kubeflow Training Operator or SageMaker Training.",
    key_points: [
      "Reproducibility: pinned libraries + versioned data + fixed seeds = same model every run",
      "Orchestrated DAG: extraction → features → train → evaluate → register — each step retryable",
      "Parameterised: YAML/config-driven hyperparameters, not hardcoded — enables automated HPO",
      "Experiment tracker: every run logged with params + metrics + artifacts for comparison and audit",
      "Quality gates: model must beat champion on held-out eval set before staging promotion",
      "Human approval (or automated policy) required before production promotion — not automatic"
    ],
    hint: "A training pipeline ran successfully and produced a model with 0.92 AUC — but the training data was accidentally filtered to a biased subset. What quality gate would catch this before the model hits production?",
    common_trap: "Auto-promoting any successfully trained model to production — a model can train successfully and still be worse than the current production model, biased, or trained on stale/wrong data. Always evaluate against a champion model on held-out data.",
    follow_up_questions: [
      { text: "What is MLOps and how does it differ from DevOps?", type: "linked", links_to: "8.4.04" },
      { text: "How do you handle model drift and trigger retraining?", type: "linked", links_to: "8.4.05" }
    ],
    related: ["8.4.01", "8.4.04", "8.4.05", "8.1.04"],
    has_diagram: false,
    diagram: "",
    has_code: true,
    code_language: "yaml",
    code_snippet: `# Kubeflow Pipeline — model training DAG (simplified)
apiVersion: argoproj.io/v1alpha1
kind: Workflow
spec:
  entrypoint: training-pipeline
  templates:
    - name: training-pipeline
      dag:
        tasks:
          - name: extract-features
            template: extract-features-step
          - name: train-model
            dependencies: [extract-features]
            template: train-step
            arguments:
              parameters:
                - name: learning-rate
                  value: "{{workflow.parameters.learning_rate}}"
                - name: max-depth
                  value: "{{workflow.parameters.max_depth}}"
          - name: evaluate
            dependencies: [train-model]
            template: evaluate-step
          - name: register-if-passes
            dependencies: [evaluate]
            template: conditional-register
            when: "{{tasks.evaluate.outputs.parameters.auc}} > 0.85"`,
    tags: ["model-training", "mlops", "kubeflow", "experiment-tracking", "reproducibility", "quality-gates"]
  },

  {
    id: "8.4.04",
    section: 8,
    subsection: "8.4",
    level: "intermediate",
    question: "What is MLOps and how does it differ from DevOps?",
    quick_answer: "→ MLOps applies DevOps principles (CI/CD, monitoring, automation) to ML systems\n→ Key difference: ML has a third artefact to version — data — alongside code and models\n→ CI in MLOps: validate data, retrain model, run evaluation — not just unit tests\n→ CD in MLOps: model deployment gate requires evaluation metrics, not just passing tests\n→ Continuous training (CT): automatic retraining triggered by data drift or scheduled cadence",
    detailed_answer: "MLOps (Machine Learning Operations) applies the principles of DevOps — automation, reproducibility, continuous delivery, monitoring — to the full ML lifecycle. But ML introduces unique challenges DevOps doesn't face.\n\nWhat makes ML different from regular software:\n\n1. **Three artefacts to version**: software has code. ML has code + data + model. All three must be versioned, and changes in any one can change behaviour. A model retrained on new data without any code change is a deployment event.\n\n2. **Validation is statistical, not binary**: in DevOps, tests pass or fail. In MLOps, model quality is measured as a distribution (AUC, precision, recall). There's no absolute 'correct' — you evaluate against a champion model and business thresholds.\n\n3. **Continuous Training (CT)**: in addition to CI/CD, MLOps has a third loop. When data distribution drifts or scheduled retraining triggers, the system automatically retrains and promotes a new model. This loop has no equivalent in standard DevOps.\n\n4. **Monitoring is two-dimensional**: application monitoring (latency, errors) exists in DevOps. MLOps adds model monitoring: data drift (input distribution changed), prediction drift (output distribution changed), and concept drift (the relationship between features and labels changed).\n\n5. **Experiment tracking is first-class**: iterative experimentation and comparison across runs is central to ML development. DevOps has no equivalent.\n\nMLOps maturity levels (Google's framing): Level 0 (manual, notebook-based), Level 1 (automated training pipeline), Level 2 (full CI/CD/CT — training, validation, and deployment are all automated with human approval gates).",
    key_points: [
      "MLOps = DevOps + data versioning + model versioning + statistical validation + continuous training",
      "CI in MLOps validates data quality and model metrics, not just code correctness",
      "Continuous Training (CT): automatic retraining triggered by drift or schedule — no DevOps equivalent",
      "Model monitoring: data drift + prediction drift + concept drift — beyond standard app monitoring",
      "Experiment tracking enables reproducibility and comparison — no DevOps equivalent",
      "MLOps Level 2: fully automated train-evaluate-deploy pipeline with human approval gates"
    ],
    hint: "Your DevOps CI pipeline runs in 5 minutes. Your MLOps CI pipeline takes 4 hours (training + evaluation). How does this difference affect your branching strategy, PR review process, and team velocity?",
    common_trap: "Applying DevOps CI/CD directly to ML without accounting for training time and statistical validation — teams end up with blocked PRs, stale model evaluations, and no confidence in automated promotions.",
    follow_up_questions: [
      { text: "How do you design a CI/CD pipeline for model training?", type: "linked", links_to: "8.4.03" },
      { text: "What is model drift and how do you detect and respond to it?", type: "linked", links_to: "8.4.05" }
    ],
    related: ["8.4.01", "8.4.03", "8.4.05", "6.1.01"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["mlops", "devops", "continuous-training", "model-monitoring", "data-drift", "ci-cd"]
  },

  {
    id: "8.4.05",
    section: 8,
    subsection: "8.4",
    level: "advanced",
    question: "How do you detect and respond to model drift in production?",
    quick_answer: "→ Data drift: input feature distribution shifts from training distribution — model inputs are out-of-distribution\n→ Concept drift: the relationship between features and labels changes (world changed)\n→ Prediction drift: model output distribution shifts — may indicate either type of drift\n→ Detect: statistical tests (PSI, KS test, chi-squared) on feature distributions vs training baseline\n→ Respond: alert → investigate → retrain + evaluate → promote if challenger wins",
    detailed_answer: "Model drift is the degradation of a deployed model's performance over time due to changes in the world it was trained on. Unlike software bugs, drift is gradual and statistical — there's no obvious error, just slowly declining business value.\n\nTypes of drift:\n\n**Data drift (covariate shift)**: the distribution of input features X changes. Example: a fraud model was trained when most users were desktop users. Mobile usage grows, changing the device feature distribution. The model has never seen this pattern at scale.\n\n**Concept drift**: the relationship between X and Y changes. Example: a credit risk model trained pre-recession — the same features (income, employment) now have a different relationship to default probability. The world changed.\n\n**Prediction drift**: the distribution of model outputs P(Y|X) shifts. This is detectable without ground truth labels and serves as an early warning for both types of drift.\n\n**Label drift**: the distribution of actual labels shifts — e.g. fraud rate went from 0.1% to 1%. May require threshold recalibration.\n\nDetection methods:\n- Population Stability Index (PSI): compares expected vs actual distribution bucket by bucket. PSI > 0.2 = significant drift\n- Kolmogorov-Smirnov test: statistical test of distribution equality for continuous features\n- Chi-squared test: for categorical features\n- Performance monitoring: when ground truth labels arrive (usually delayed), compute actual AUC/precision against predictions\n\nResponse workflow:\n1. Alert triggers when PSI or prediction drift exceeds threshold\n2. Investigation: is drift in a critical feature? Is business metric degrading?\n3. Automatic retraining with fresh data\n4. Champion-challenger evaluation: retrained model must beat production model on hold-out set\n5. Promote if challenger wins; otherwise alert ML team for manual investigation\n\nTooling: Evidently AI (open-source drift monitoring), WhyLogs, SageMaker Model Monitor, Vertex AI Model Monitoring.",
    key_points: [
      "Data drift: input distribution changed — model sees out-of-distribution patterns not present in training",
      "Concept drift: X→Y relationship changed — world evolved, model's learned patterns are stale",
      "Prediction drift: detectable without ground truth labels — serves as early warning signal",
      "PSI > 0.2 signals significant drift; KS test and chi-squared for statistical significance testing",
      "Automated retraining response: drift → retrain → challenger evaluation → promote if wins",
      "Ground-truth labels are delayed — prediction drift is the practical real-time signal; accuracy is the lagging indicator"
    ],
    hint: "A credit scoring model was trained in 2022 during a low-interest-rate environment. Interest rates doubled in 2023. What type of drift is this — and does the model's training data distribution necessarily change? What changes instead?",
    common_trap: "Monitoring only model accuracy (which requires delayed ground truth) and missing real-time prediction drift — by the time you detect accuracy degradation, the model has been making poor decisions for weeks or months.",
    follow_up_questions: [
      { text: "How do you design an automated retraining trigger?", type: "inline", mini_answer: "Set threshold alerts on PSI or prediction drift metric. On alert: 1) trigger retraining pipeline via Airflow/Kubeflow with last N weeks of fresh data; 2) evaluate challenger vs champion on held-out set; 3) auto-promote if challenger wins by statistical margin; 4) alert ML team if challenger loses (manual investigation required). Use shadow mode (log challenger predictions alongside champion) before promoting." },
      { text: "How does the feature store support drift detection?", type: "inline", mini_answer: "The feature store's offline store contains historical feature values. Drift detection tools (Evidently AI, WhyLogs) compare the training data's feature distribution (stored as a baseline dataset in the offline store) against the live serving distribution computed from online store statistics or recent prediction logs." }
    ],
    related: ["8.4.01", "8.4.03", "8.4.04", "8.5.03"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["model-drift", "data-drift", "concept-drift", "model-monitoring", "mlops", "psi"]
  },

  // ─────────────────────────────────────────────────
  // 8.5 Data Quality & Observability (4q)
  // ─────────────────────────────────────────────────

  {
    id: "8.5.01",
    section: 8,
    subsection: "8.5",
    level: "basic",
    question: "What are the dimensions of data quality and how do you operationalise them?",
    quick_answer: "→ Six dimensions: completeness, accuracy, consistency, timeliness, uniqueness, validity\n→ Completeness: no unexpected nulls or missing records\n→ Accuracy: values match source of truth (hard to automate — often sampling + spot checks)\n→ Timeliness: data arrives within SLA (alert if daily batch hasn't landed by 08:00)\n→ Uniqueness: no duplicate records (deduplication at ingestion)\n→ Validity: values conform to schema/format (email regex, date range, enum membership)",
    detailed_answer: "Data quality is the degree to which data is fit for its intended use. In a data platform, poor quality data that flows unchecked corrupts downstream analytics, ML models, and business decisions. 'Garbage in, garbage out' at scale means garbage in all dashboards and models simultaneously.\n\nThe six DAMA dimensions:\n\n**Completeness**: are all expected records present, and are required fields populated? Check: record count vs expected range, null rate per column vs historical baseline. Alert if today's user_events count is < 80% of yesterday's (upstream outage).\n\n**Accuracy**: do values reflect the real world? This is the hardest to automate. Requires sampling and reconciliation against the source system — e.g. compare revenue aggregates in the warehouse against the source OLTP system daily.\n\n**Consistency**: does data agree across systems? Same customer appears in CRM and billing DB with the same attributes. Cross-system reconciliation checks.\n\n**Timeliness**: does data arrive when expected? Pipeline SLA monitoring: 'daily sales data must be in the warehouse by 06:00.' Alert before the deadline (05:45 early warning).\n\n**Uniqueness**: no duplicate records for the same entity. Check: count DISTINCT id vs count(*). Deduplication via deterministic ID assignment at ingestion.\n\n**Validity**: values conform to defined rules. Type validation, range checks (age between 0 and 150), format checks (email regex, phone number format), referential integrity (order.customer_id must exist in customers table).\n\nOperationalising: embed quality checks as pipeline steps using dbt tests, Great Expectations, or Soda Core. Check at the curated zone boundary. Block promotion to consumption zone on quality failures, route bad records to quarantine.",
    key_points: [
      "Six dimensions: completeness, accuracy, consistency, timeliness, uniqueness, validity",
      "Completeness + timeliness + uniqueness + validity: automatable with pipeline checks",
      "Accuracy: hardest to automate — requires reconciliation against source of truth",
      "Quality gates at curated zone boundary: fail → quarantine (don't block production), not → delete",
      "dbt tests / Great Expectations / Soda Core: standard tooling for pipeline-embedded quality checks",
      "Data quality SLAs: define expected null rates, record count ranges, freshness SLAs upfront"
    ],
    hint: "Your dashboard shows revenue dropped 40% overnight. How do you quickly distinguish 'real business drop' from 'data quality failure' — what checks would you run first?",
    common_trap: "Treating data quality as a one-off audit rather than a continuous pipeline check — data quality degrades silently over time. Every pipeline must have automated quality assertions that run on every batch.",
    follow_up_questions: [
      { text: "How do you implement data quality checks in a pipeline?", type: "linked", links_to: "8.5.02" },
      { text: "What is data observability and how does it extend data quality?", type: "linked", links_to: "8.5.04" }
    ],
    related: ["8.5.02", "8.5.03", "8.1.01"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["data-quality", "completeness", "validity", "timeliness", "great-expectations", "dbt-tests"]
  },

  {
    id: "8.5.02",
    section: 8,
    subsection: "8.5",
    level: "intermediate",
    question: "How do you implement data quality checks in a data pipeline?",
    quick_answer: "→ dbt tests: schema (not-null, unique, accepted-values, relationships) + custom SQL assertions\n→ Great Expectations / Soda Core: expectation suites run at pipeline steps, results published to data docs\n→ Three check layers: schema checks (types), row-level checks (nulls, ranges), aggregate checks (volume, totals)\n→ On failure: quarantine records (don't delete), alert on-call, block promotion to next zone\n→ Track quality metrics over time — deteriorating null rate is a signal before total failure",
    detailed_answer: "Data quality checks must be embedded in the pipeline, not applied after the fact. The standard approach is to run assertions at zone boundaries: after ingestion into raw, before promotion to curated, before promotion to consumption.\n\nCheck categories:\n\n**Schema checks**: does the data match the expected schema? Correct column types, no unexpected columns, all required columns present. These fail fast at parse time.\n\n**Row-level checks**: per-record assertions. Null checks on required fields, range checks (amount > 0), format checks (email regex, date format), referential integrity (foreign key exists in dimension table).\n\n**Aggregate checks**: dataset-level assertions. Total record count within expected bounds (today's record count is within 20% of 7-day average). Sum of revenue today reconciles to source system total. No duplicate IDs (count(*) == count(DISTINCT id)).\n\nTooling:\n\n**dbt tests**: inline with transformation code. `not_null`, `unique`, `accepted_values`, `relationships` are built-in. Custom SQL assertions for business logic. Runs on every dbt build — failures block the downstream model from running.\n\n**Great Expectations**: define 'expectations' as code (Python). Expectation suites run at pipeline steps and produce data docs (HTML quality reports). Integrates with Airflow, Spark, Pandas.\n\n**Soda Core**: YAML-based quality checks, Soda Cloud for result monitoring and alerting. Closer to SQL assertions, easier for data analysts.\n\nOn failure response: quarantine bad records to a separate location (preserve them, don't delete), log the failure with record samples, alert the responsible team (not the on-call — data quality is a data team issue), and block promotion to the next zone until the issue is resolved or the records are manually reviewed and either corrected or excluded.",
    key_points: [
      "Three check layers: schema (types) → row-level (nulls, ranges) → aggregate (volume, totals reconciliation)",
      "dbt tests run inline with transformations — failures block downstream models from executing",
      "Great Expectations: expectation suites produce data docs, integrate with Airflow/Spark",
      "Quarantine bad records: preserve + alert, never silently drop — quarantine is investigable",
      "Block zone promotion on quality failure: curated zone must only contain quality-checked data",
      "Track quality metrics over time in a quality DB — deteriorating trends are early warnings"
    ],
    hint: "Your curated zone pipeline passes its quality checks, but the consumption zone BI report is wrong. At what point did the quality checks miss the issue, and how would you catch it next time?",
    common_trap: "Running quality checks only at the raw zone and assuming curated/consumption transformations don't introduce errors — every transformation step can introduce bugs. Run assertions at each zone boundary.",
    follow_up_questions: [
      { text: "What are the six dimensions of data quality?", type: "linked", links_to: "8.5.01" },
      { text: "How does dbt fit into the transformation pipeline?", type: "inline", mini_answer: "dbt (data build tool) manages SQL-based transformations as version-controlled models (SELECT statements). Built-in tests (not_null, unique, relationships) run on every `dbt test` invocation. dbt generates lineage documentation automatically. Airflow or Prefect schedules `dbt run && dbt test` — if tests fail, downstream models don't run. dbt handles only transformation (T in ELT), not extraction or loading." }
    ],
    related: ["8.5.01", "8.5.03", "8.1.03", "8.3.01"],
    has_diagram: false,
    diagram: "",
    has_code: true,
    code_language: "yaml",
    code_snippet: `# dbt schema tests — quality checks as code
# models/schema.yml
models:
  - name: orders_curated
    columns:
      - name: order_id
        tests:
          - not_null
          - unique
      - name: customer_id
        tests:
          - not_null
          - relationships:
              to: ref('customers')
              field: customer_id
      - name: order_status
        tests:
          - accepted_values:
              values: ['pending', 'confirmed', 'shipped', 'cancelled']
      - name: total_amount
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: ">= 0"

  - name: daily_orders_volume
    tests:
      - dbt_utils.expression_is_true:
          # Alert if today's count deviates > 30% from 7-day average
          expression: "count > (SELECT AVG(cnt) * 0.7 FROM {{ this }} WHERE date >= CURRENT_DATE - 7)"`,
    tags: ["data-quality", "dbt", "great-expectations", "pipeline-testing", "quarantine", "schema-tests"]
  },

  {
    id: "8.5.03",
    section: 8,
    subsection: "8.5",
    level: "intermediate",
    question: "What is data lineage and why is it critical for a data platform?",
    quick_answer: "→ Data lineage: tracks the complete origin and transformation history of every dataset\n→ Column-level lineage: which source columns feed a given output column\n→ Enables: root cause analysis (this dashboard broke because this upstream table changed)\n→ Supports: GDPR right-to-erasure (find all datasets containing this user's data)\n→ Tools: dbt (model-level lineage auto-generated), OpenLineage/Marquez (runtime lineage), Apache Atlas",
    detailed_answer: "Data lineage is a record of data's origin, movement, transformation, and destination across the platform. Without lineage, debugging data issues is archaeology — you trace backwards through pipelines manually, team by team, searching for where a value came from.\n\nWhy lineage matters:\n\n**Root cause analysis**: a BI dashboard shows wrong revenue. Lineage tells you: this fact_revenue table was produced by this dbt model, which depends on orders_curated, which was ingested from this Kafka topic, which sourced from this microservice event. You can pinpoint which stage introduced the error.\n\n**Impact analysis**: before changing a source table schema, lineage tells you every downstream dataset, model, and dashboard that depends on it. Without lineage, breaking changes are discovered by downstream consumers when their jobs fail.\n\n**GDPR/compliance**: right-to-erasure requires finding and deleting every record containing a specific user's data. Column-level lineage identifies every table and column that was derived from the source customer table, ensuring complete erasure.\n\n**Audit trail**: regulated industries require demonstrating where data came from and what transformations were applied. Lineage is the evidence.\n\nLineage granularity:\n- Dataset-level: this table was produced from these tables. Sufficient for most debugging.\n- Column-level: this output column was derived from these source columns via this transformation. Required for GDPR and precise impact analysis.\n- Row-level: this output record was derived from this specific source record. Very expensive, rarely implemented.\n\nTooling:\n- dbt: auto-generates model-level lineage graph from SQL model dependencies. Rendered as interactive DAG in dbt docs.\n- OpenLineage / Marquez (open-source): runtime lineage collection from Spark, dbt, Airflow jobs. Emits lineage events at job completion.\n- Apache Atlas: enterprise metadata + lineage management. Heavy, complex.\n- Cloud: AWS Glue Data Catalog, Azure Purview, Google Dataplex.",
    key_points: [
      "Lineage = origin + transformation history — enables root cause analysis and impact assessment",
      "Column-level lineage required for GDPR right-to-erasure: find every derived dataset containing PII",
      "Impact analysis: before schema change, lineage shows all downstream dependents that will break",
      "dbt auto-generates model-level lineage from SQL — no manual annotation required",
      "OpenLineage: open standard for runtime lineage events across Spark, dbt, Airflow",
      "Lineage pays for itself on the first major incident — without it, debugging takes days"
    ],
    hint: "A GDPR deletion request arrives: delete all data for user ID 12345. You have 47 datasets in your lakehouse. How does column-level lineage help you respond within the 30-day compliance window?",
    common_trap: "Building dataset-level lineage only and discovering it's insufficient for GDPR compliance — 'user_id is in this table' doesn't tell you whether the user's email appears in a derived aggregation or an ML feature.",
    follow_up_questions: [
      { text: "What is data observability and how does it extend lineage?", type: "linked", links_to: "8.5.04" },
      { text: "How does dbt integrate into data pipeline orchestration?", type: "linked", links_to: "8.1.04" }
    ],
    related: ["8.5.01", "8.5.04", "8.1.04"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["data-lineage", "column-lineage", "gdpr", "impact-analysis", "dbt", "openlineage", "data-governance"]
  },

  {
    id: "8.5.04",
    section: 8,
    subsection: "8.5",
    level: "advanced",
    question: "What is data observability and what does a mature data observability platform look like?",
    quick_answer: "→ Data observability: the ability to understand the health and state of data across the platform in real time\n→ Five pillars: freshness, distribution, volume, schema, lineage\n→ Extends data quality checks: anomaly detection on historical baselines, not just threshold checks\n→ Tools: Monte Carlo, Bigeye, Acceldata (commercial); OpenLineage + dbt + custom dashboards (open)\n→ Goal: detect and alert on data incidents before downstream consumers are impacted",
    detailed_answer: "Data observability extends data quality monitoring from point-in-time checks to continuous, holistic visibility into the health of your entire data platform — analogous to how application observability (metrics, logs, traces) extends beyond 'is the server up?' to 'how is the system behaving?'\n\nThe five pillars of data observability (Monte Carlo's framework):\n\n**Freshness**: is data up-to-date? How long since this table was last updated? Alert if the daily refresh is overdue by more than 30 minutes.\n\n**Distribution**: have the statistical properties of a column changed? Min, max, mean, median, standard deviation, null rate, unique value count — all tracked historically. Anomaly detection flags a column whose null rate jumps from 2% to 40% overnight.\n\n**Volume**: is the number of rows within expected bounds? Auto-learned baseline from historical data. Alert if today's record count is 3 standard deviations from the 28-day rolling average.\n\n**Schema**: has the table schema changed without a declared migration? New column appeared, column dropped, type changed. Auto-detect and alert downstream owners.\n\n**Lineage**: which upstream datasets did this table depend on, and which downstream consumers depend on this table? Used for impact radius assessment when an incident is detected.\n\nMature data observability:\n- Automated baseline learning from historical metrics (not static thresholds)\n- End-to-end lineage from source to dashboard\n- Incident management workflow: alert → assign → root cause → remediate → close\n- SLA tracking per table: 'this table feeds the executive dashboard at 08:00 — alert if not fresh by 07:45'\n- Quality score per table/domain: aggregate health metric for data governance reporting\n\nThe data observability gap: traditional monitoring (Airflow DAG success, pipeline logs) tells you the pipeline ran. Data observability tells you whether the data the pipeline produced is correct and fresh.",
    key_points: [
      "Five pillars: freshness, distribution, volume, schema, lineage — all must be monitored continuously",
      "Anomaly detection on historical baselines — smarter than static thresholds that miss gradual drift",
      "Lineage enables immediate impact radius: which dashboards/models are affected by this data incident?",
      "Pipeline success ≠ data correctness: pipeline ran fine but the data it produced can still be wrong",
      "SLA tracking per table: alerts before downstream consumers discover the problem themselves",
      "Mature platform has incident workflow: detect → alert → assign → root cause → remediate → close"
    ],
    hint: "A Kafka pipeline runs successfully (zero errors in Airflow), but the revenue dashboard shows a 15% drop for last night. What data observability checks would have caught this before the business team noticed?",
    common_trap: "Equating pipeline success (Airflow DAG green) with data correctness — a pipeline can run successfully while producing wrong data (upstream schema change caused a join to return zero rows, summing to zero revenue).",
    follow_up_questions: [
      { text: "What are the six dimensions of data quality?", type: "linked", links_to: "8.5.01" },
      { text: "What observability looks like at the application layer?", type: "linked", links_to: "3.6.01" }
    ],
    related: ["8.5.01", "8.5.02", "8.5.03", "3.6.01"],
    has_diagram: false,
    diagram: "",
    has_code: false,
    code_language: "",
    code_snippet: "",
    tags: ["data-observability", "freshness", "distribution", "volume", "schema", "anomaly-detection", "monte-carlo"]
  }

];
