// ─────────────────────────────────────────────────
// SECTION 5 — Cloud & Infrastructure (~29q)
// ─────────────────────────────────────────────────
const SECTION_5_QUESTIONS = [

  // ── 5.1 Cloud Provider Concepts ──────────────────

  {
    id: "5.1.01",
    section: 5,
    subsection: "5.1",
    level: "basic",
    question: "What is the shared responsibility model in cloud computing, and why does it matter for architects?",
    quick_answer: "→ Cloud provider owns: physical hardware, hypervisor, global network, managed service internals\n→ Customer owns: OS hardening, application security, data encryption, IAM configuration, network rules\n→ Boundary shifts by service type: IaaS (you own OS+), PaaS (you own app+), SaaS (you own data+config)\n→ Most cloud breaches are customer-side failures — misconfigured S3, open security groups\n→ Architects must explicitly map each control to an owner during design",
    detailed_answer: "The shared responsibility model divides security and operational obligations between the cloud provider and the customer. The split is not static — it shifts depending on the service abstraction level.\n\nFor IaaS (EC2, GCE), the provider secures the physical host, hypervisor, and network fabric. The customer is responsible for the guest OS (patching, hardening), application runtime, application security, data encryption, and IAM policies. For PaaS (RDS, Cloud SQL, Elastic Beanstalk), the provider also manages the OS and database engine patching. The customer owns the application, database configuration, access controls, and data. For SaaS, the provider owns almost everything; the customer owns data and access configuration.\n\nWhy it matters for architects: the most common cloud breaches (Capital One, Twitch, Toyota) resulted from customer-side misconfigurations — open S3 buckets, overly permissive IAM roles, public security groups on databases. These are in the customer's half of the model. Architects must produce an explicit control matrix: for each component, who is responsible for patching, encryption, access control, and monitoring. Gaps in the matrix become security vulnerabilities.\n\nThe model also drives architecture decisions: using a managed service (RDS) transfers OS patching responsibility to AWS, reducing the customer's operational burden. Choosing self-managed software on EC2 retains full control but also full responsibility.",
    key_points: [
      "Provider owns: hardware, hypervisor, network fabric, managed service internals",
      "Customer owns: OS, application, data, IAM, network config (always)",
      "Boundary shifts: IaaS > PaaS > SaaS — more managed = less customer responsibility",
      "Most breaches are customer-side: misconfigured storage, open groups, over-permissive IAM",
      "Architects must produce explicit control matrix — who owns each security control",
      "Managed services trade control for reduced operational burden"
    ],
    hint: "If AWS has a vulnerability in their hypervisor and your instance is compromised — whose responsibility is it to detect and respond? What about if your S3 bucket is public?",
    common_trap: "Assuming 'we're on AWS so security is handled' — the provider secures the platform; the customer is fully responsible for their application, data, and access configuration.",
    follow_up_questions: [
      { text: "How does the shared responsibility model change when you use a managed Kubernetes service like EKS vs. self-managed Kubernetes on EC2?", type: "inline", mini_answer: "With EKS, AWS manages the control plane (API server, etcd, scheduler) — patching, HA, certificates. The customer manages: worker node OS patching, pod security policies, network policies, RBAC, and the cluster add-ons. With self-managed K8s on EC2, the customer owns everything including control plane HA and etcd backups." },
      { text: "What is a cloud security posture management (CSPM) tool and what does it check?", type: "inline", mini_answer: "CSPM tools (AWS Security Hub, Prisma Cloud, Wiz) continuously scan cloud configuration against security baselines (CIS benchmarks, SOC2 controls). They detect: public S3 buckets, unencrypted EBS volumes, over-permissive IAM policies, open security groups. They automate the control matrix audit that architects define manually." }
    ],
    related: ["7.4.01", "3.5.01", "5.1.02"],
    has_diagram: false,
    has_code: false,
    tags: ["shared-responsibility", "cloud-security", "IaaS", "PaaS", "SaaS", "cloud"]
  },

  {
    id: "5.1.02",
    section: 5,
    subsection: "5.1",
    level: "intermediate",
    question: "What is cloud-native architecture and how does it differ from lifting-and-shifting existing applications?",
    quick_answer: "→ Lift-and-shift: move existing app to cloud VMs with minimal change — pays for cloud without most benefits\n→ Cloud-native: design for elasticity, managed services, immutable infrastructure, and failure tolerance\n→ Cloud-native uses: auto-scaling, managed DBs, object storage, serverless, container orchestration\n→ Key principles: stateless services, externalised config, disposable instances, horizontal scale\n→ The 12-Factor App methodology formalises cloud-native application design",
    detailed_answer: "Lift-and-shift migration moves existing applications to cloud VMs with the same architecture as on-premises. The result is cloud infrastructure bills without cloud benefits: the application still relies on persistent local state, manual scaling, and infrastructure conventions that predate cloud economics. It is a fast migration path but rarely the end goal.\n\nCloud-native architecture redesigns applications to exploit cloud capabilities. The defining characteristics are: stateless compute (instances can be killed and replaced at any time), externalised configuration (environment-specific config comes from the environment, not hardcoded), elastic scaling (the platform adds and removes instances based on load), managed services (databases, queues, caches are operated by the cloud provider, not the team), immutable infrastructure (servers are replaced rather than patched), and built-in failure tolerance (the application assumes instances will die and handles it).\n\nThe 12-Factor App methodology (Heroku, 2011) codifies cloud-native application design: one codebase, explicit dependency declaration, config from environment, backing services as attached resources, stateless processes, and more. These factors are prerequisites for cloud-native deployment.\n\nThe migration path from lift-and-shift to cloud-native is incremental. Common steps: externalise state to managed services (RDS instead of self-managed MySQL), containerise workloads (Docker → Kubernetes), replace cron jobs with serverless functions, replace message broker VMs with managed queues (SQS, Pub/Sub). Each step increases cloud benefit while reducing operational toil.",
    key_points: [
      "Lift-and-shift: fast, cheap migration — cloud bill without cloud benefits",
      "Cloud-native: stateless, elastic, managed services, immutable, failure-tolerant",
      "12-Factor App: the canonical cloud-native application design guide",
      "Externalise all state: sessions in Redis, data in managed DB, files in object storage",
      "Immutable infrastructure: replace instances rather than patching in place",
      "Migration is incremental: extract state first, then containerise, then scale"
    ],
    hint: "If your application stores user sessions in memory on each instance, what happens when auto-scaling adds a new instance? Is that cloud-native?",
    common_trap: "Treating containerisation as equivalent to cloud-native — a stateful, single-instance application in a Docker container is still not cloud-native; the design principles matter more than the packaging.",
    follow_up_questions: [
      { text: "What is immutable infrastructure and how does it reduce operational risk?", type: "inline", mini_answer: "Immutable infrastructure: servers are never modified after deployment. To change configuration, build a new image and replace instances. Benefits: eliminates configuration drift, enables consistent rollback (redeploy previous image), and makes infrastructure fully reproducible. Implemented via AMI baking (Packer) or container images." },
      { text: "How does the strangler fig pattern apply to cloud-native migration?", type: "linked", links_to: "4.4.04" }
    ],
    related: ["5.1.01", "5.8.01", "4.1.01"],
    has_diagram: false,
    has_code: false,
    tags: ["cloud-native", "12-factor", "lift-and-shift", "immutable-infrastructure", "cloud"]
  },

  {
    id: "5.1.03",
    section: 5,
    subsection: "5.1",
    level: "intermediate",
    question: "What are availability zones and regions, and how do they map to your resilience architecture?",
    quick_answer: "→ Region: geographic cluster of data centres (e.g. us-east-1, europe-west2)\n→ Availability Zone: isolated data centre(s) within a region — separate power, cooling, networking\n→ Multi-AZ: protects against data centre failure — same city, <2ms latency\n→ Multi-region: protects against regional failure — different cities, 50-100ms latency\n→ Most systems: multi-AZ for HA; multi-region only when RPO/RTO or regulatory rules require it",
    detailed_answer: "A cloud region is a geographic cluster of data centres (AWS has 33 regions, GCP has 40+). Regions are chosen based on latency to users, data sovereignty requirements (GDPR mandates EU data stays in EU), disaster recovery geography, and available services (not all services are available in all regions).\n\nWithin a region, availability zones (AZs) are physically isolated data centres with independent power, cooling, and networking. AWS regions have 3–6 AZs. AZs within a region are connected by low-latency (<2ms) private fibre links, making synchronous replication practical. Most managed services (RDS Multi-AZ, EKS, ElastiCache) automatically replicate across AZs.\n\nFor resilience architecture: multi-AZ deployment protects against a single data centre failure. Deploy application instances across at least two AZs with a load balancer distributing traffic. If one AZ fails, the other continues. The failure mode is localised (power outage, cooling failure) and AWS will failover RDS automatically in 60–120 seconds.\n\nMulti-region protects against regional failure (natural disaster, major AWS incident) or satisfies data sovereignty requirements. It requires synchronous or near-synchronous data replication (with associated write latency) and a failover mechanism (Route 53 health checks, Global Load Balancer). Most systems use multi-AZ for primary HA and multi-region for disaster recovery only. Only mission-critical, globally distributed services run active-active multi-region.",
    key_points: [
      "Region: geographic cluster; AZ: isolated data centre within a region",
      "Multi-AZ: protects AZ failure, <2ms latency — standard for production HA",
      "Multi-region: protects regional failure, 50-100ms latency — DR or global scale",
      "AZ failure: local hardware issue; regional failure: rare, catastrophic",
      "Managed services (RDS Multi-AZ) handle AZ failover automatically",
      "Data sovereignty (GDPR) may mandate region selection before resilience concerns"
    ],
    hint: "If your primary RDS instance is in AZ-A and your app servers are in AZ-B and AZ-C — what is the network path when AZ-A fails? What needs to happen for your app to keep serving requests?",
    common_trap: "Deploying all instances in the same AZ for cost savings — AZ-to-AZ data transfer is cheap (fractions of a cent/GB within a region), not worth the SPOF it creates.",
    follow_up_questions: [
      { text: "What is a local zone and when would you use one?", type: "inline", mini_answer: "Local zones are extensions of a region placed in metro areas (e.g. AWS Local Zone in Los Angeles, Sydney). They provide <5ms latency to end users in that city, without a full regional deployment. Used for latency-sensitive workloads (gaming, media, financial trading) serving a specific metro population." },
      { text: "How do you architect for multi-region active-active?", type: "linked", links_to: "2.6.05" }
    ],
    related: ["3.2.03", "3.7.01", "2.6.05"],
    has_diagram: false,
    has_code: false,
    tags: ["availability-zones", "regions", "multi-AZ", "multi-region", "resilience", "cloud"]
  },

  {
    id: "5.1.04",
    section: 5,
    subsection: "5.1",
    level: "advanced",
    question: "How do you choose between AWS, GCP, and Azure for a new workload — what criteria drive the decision?",
    quick_answer: "→ Existing ecosystem: where does the org already have skills, contracts, and tooling?\n→ Workload fit: GCP for data/ML, Azure for Microsoft-stack enterprises, AWS for broadest service depth\n→ Pricing model: reserved instances, committed use discounts, egress costs — model actual spend\n→ Compliance: which providers have the certifications your industry requires (FedRAMP, NHS DSP)\n→ Avoid pure provider-claim comparisons — run a PoC on your actual workload",
    detailed_answer: "Cloud provider selection is a strategic decision that outlasts any individual workload. The decision criteria stack in priority.\n\nExisting ecosystem lock-in is often decisive: if the organisation has AWS Enterprise Support, existing Reserved Instances, and teams trained on AWS tooling, switching has a high switching cost that rarely pays off for a single new workload. The decision becomes multi-cloud only when a specific workload has a strong workload-fit argument.\n\nWorkload fit: GCP has superior managed data and ML services (BigQuery, Dataflow, Vertex AI, TPUs) — organisations with heavy analytics and ML workloads favour GCP. Azure has the deepest Microsoft ecosystem integration (Azure AD = Entra, Office 365, Teams, GitHub Actions) and dominates in enterprises already standardised on Microsoft. AWS has the broadest service catalogue and the largest partner ecosystem — still the default for net-new, general-purpose workloads.\n\nPricing: the published list price is rarely what you pay. Model actual spend using Reserved Instances (AWS), Committed Use Discounts (GCP), or Reserved Capacity (Azure). Factor in egress costs — data transfer out of a region is expensive on all providers (~$0.08/GB) and is a common cost surprise. Managed service pricing (RDS vs Cloud SQL vs Azure SQL) varies significantly.\n\nCompliance: regulated industries need specific certifications. FedRAMP-High for US government, NHS DSP Toolkit for UK healthcare, ISO 27001, SOC 2 Type II. Verify the specific service you plan to use (not just the provider) has the required certification in your target region.",
    key_points: [
      "Existing contracts, skills, and tooling often outweigh workload-fit arguments",
      "GCP: data/ML; Azure: Microsoft-enterprise; AWS: broadest catalogue, default choice",
      "Model actual spend with committed discounts and egress — list price is misleading",
      "Compliance certs apply per service per region — verify the specific service",
      "Run a PoC on your actual workload — provider benchmarks don't predict your performance",
      "Avoid multi-cloud by default — it adds operational complexity without proportional benefit"
    ],
    hint: "A CTO says 'we should go multi-cloud to avoid vendor lock-in.' What is the actual cost of multi-cloud, and when is it genuinely justified?",
    common_trap: "Choosing a cloud provider based on marketing benchmarks or a single strong service — the operational ecosystem (support, tooling, training, partner network) often matters more than individual service performance.",
    follow_up_questions: [
      { text: "What is vendor lock-in at the cloud level, and how do you mitigate it without going multi-cloud?", type: "inline", mini_answer: "Vendor lock-in: proprietary services that have no portable equivalent (DynamoDB API, Lambda triggers, BigQuery SQL dialect). Mitigation without multi-cloud: use open standards where they exist (Kubernetes instead of ECS, OpenTelemetry instead of CloudWatch SDK, Postgres-compatible managed DB). Abstract vendor-specific SDKs behind interfaces. Full portability is a myth — aim for 'replaceable with effort' not 'zero lock-in.'" },
      { text: "How do you evaluate cloud cost for a workload before committing?", type: "linked", links_to: "5.7.01" }
    ],
    related: ["5.6.01", "5.7.01", "5.1.01"],
    has_diagram: false,
    has_code: false,
    tags: ["cloud-strategy", "AWS", "GCP", "Azure", "multi-cloud", "vendor-lock-in", "cloud"]
  },

  // ── 5.2 Compute ───────────────────────────────────

  {
    id: "5.2.01",
    section: 5,
    subsection: "5.2",
    level: "intermediate",
    question: "How do you choose between VMs, containers, and serverless for a given workload?",
    quick_answer: "→ VMs: long-running, stateful, needs full OS access or specific kernel — databases, legacy apps\n→ Containers: stateless services, microservices, consistent dev-to-prod packaging — standard choice for most new services\n→ Serverless: event-driven, infrequent, short-duration — APIs, scheduled jobs, background tasks\n→ Match workload characteristics to compute model: duration, state, invocation frequency, cold start tolerance\n→ Cost model differs: VMs → reserved/on-demand hourly; containers → resource reservation; serverless → per-invocation",
    detailed_answer: "The right compute model depends on four workload characteristics: duration, state, invocation frequency, and latency tolerance.\n\nVMs (EC2, GCE, Azure VMs) are appropriate for: long-running processes, workloads requiring specific OS configurations or kernel access, stateful applications (where data lives on the host), and licensed software that cannot be containerised. VMs have the highest operational overhead (OS patching, agent management) and the highest infrastructure cost per unit of compute.\n\nContainers (ECS, GKE, AKS, or self-managed Kubernetes) are the standard choice for stateless microservices, web APIs, and batch workers. They provide consistent packaging from development to production, dense packing (multiple containers per VM), and fast startup (seconds vs. minutes for VMs). Containers require an orchestration layer (Kubernetes or ECS) and a container registry. They are stateless by design — state is externalised.\n\nServerless (Lambda, Cloud Run, Cloud Functions, Azure Functions) is optimal for: event-driven workloads (S3 trigger, API Gateway event), infrequent invocations, short-duration operations (under 15 minutes for Lambda), and maximum operational simplicity. Cost is per-invocation with no idle cost. Cold starts (50ms–2s depending on runtime and memory) are the primary latency concern — mitigated by provisioned concurrency or keeping functions warm.\n\nService Discovery (from 4.1.11) matters most in container and VM deployments — services need to locate each other dynamically. Competing Consumers (from 4.3.04) maps directly to containerised workers pulling from queues, scaled horizontally via Kubernetes HPA or ECS service auto-scaling.",
    key_points: [
      "VMs: full OS control, stateful, licensed software, long-running — highest overhead",
      "Containers: stateless microservices, consistent packaging, dense packing — standard choice",
      "Serverless: event-driven, infrequent, short-duration, zero idle cost — simplest ops",
      "Cold starts are the main serverless concern — provisioned concurrency solves it at extra cost",
      "Containers need orchestration (Kubernetes/ECS); serverless abstracts it away",
      "Cost model: VMs hourly, containers resource-reserved, serverless per-invocation"
    ],
    hint: "A service runs 200 requests/day averaging 500ms each. Is serverless or a container cheaper, and why?",
    common_trap: "Defaulting to VMs for everything because they are familiar — containers and serverless reduce operational burden significantly for stateless workloads, and often cost less at typical service scales.",
    follow_up_questions: [
      { text: "What is a cold start in serverless and how do you mitigate it?", type: "inline", mini_answer: "A cold start occurs when a new Lambda/Cloud Run instance is initialised: download container image, start runtime, run init code. Duration: 50ms (Go/Rust) to 2s (Java with large JARs). Mitigations: provisioned concurrency (keep N instances warm at fixed cost), smaller packages (reduce image pull time), faster runtimes (Go over Java), lazy initialisation of heavy objects." },
      { text: "How does service discovery work in a container-based system?", type: "linked", links_to: "4.1.11" }
    ],
    related: ["4.1.11", "4.3.04", "5.2.02", "6.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["compute", "VMs", "containers", "serverless", "Lambda", "Kubernetes", "cloud"]
  },

  {
    id: "5.2.02",
    section: 5,
    subsection: "5.2",
    level: "intermediate",
    question: "What are the different EC2 (or equivalent) purchasing models and when do you use each?",
    quick_answer: "→ On-Demand: full price, no commitment — dev/test, unpredictable spikes\n→ Reserved Instances (1 or 3 year): up to 72% discount — stable baseline load\n→ Savings Plans: flexible commitment by spend, not instance type — easier than RIs\n→ Spot/Preemptible: up to 90% discount, but can be terminated with 2-min notice — fault-tolerant batch, CI workers\n→ Mix: reserve baseline, spot the burst, on-demand for critical path",
    detailed_answer: "Cloud compute pricing has multiple purchasing tiers designed to balance flexibility against commitment.\n\nOn-Demand instances are billed by the second (AWS) or minute (GCP) with no commitment. They are the most expensive but require no upfront planning. Appropriate for: development and test workloads, unpredictable traffic spikes, short-lived jobs, and any workload where usage cannot be predicted 12 months ahead.\n\nReserved Instances (AWS) or Committed Use Discounts (GCP) require committing to a 1-year or 3-year term in exchange for up to 72% discount. Standard RIs are tied to a specific instance type and region; Convertible RIs allow changing instance family. Savings Plans (AWS, 2019) are more flexible: you commit to a dollar amount per hour rather than specific instance types, applying the discount across any eligible compute. Appropriate for: predictable baseline load that runs 24/7.\n\nSpot Instances (AWS) or Preemptible VMs (GCP) use spare cloud capacity at up to 90% discount. The trade-off: the provider can reclaim the instance with 2 minutes warning. Applications must checkpoint frequently, handle interruption gracefully (SIGTERM → save state → exit), and be designed to resume. Appropriate for: batch processing, CI/CD workers, ML training jobs, rendering workloads — any fault-tolerant, stateless, or restartable workload.\n\nThe cost-optimal architecture mixes tiers: reserve the predictable baseline (committed 70% of peak load), on-demand for standard burst, and spot for batch and non-critical burst. This can reduce compute bills by 50–70% versus pure on-demand.",
    key_points: [
      "On-Demand: full price, no commitment — flexibility at highest cost",
      "Reserved/Committed: 1-3yr term, up to 72% off — stable, predictable baseline",
      "Savings Plans: commit by spend not instance type — more flexible than RIs",
      "Spot/Preemptible: 90% off, interruptible — batch, CI, fault-tolerant workloads only",
      "Optimal mix: reserve baseline, on-demand burst, spot for batch",
      "Spot requires: checkpoint state, graceful SIGTERM handling, idempotent retry"
    ],
    hint: "Your service runs at 60% CPU utilisation 24/7 with occasional spikes to 120%. How would you structure purchasing across Reserved, On-Demand, and Spot?",
    common_trap: "Running everything on-demand 'because it's simpler' — for a production service with predictable baseline, this can cost 3× more than Reserved + Savings Plans for the same compute.",
    follow_up_questions: [
      { text: "How does AWS Spot Instance interruption handling work in practice?", type: "inline", mini_answer: "AWS sends a SIGTERM to the instance 2 minutes before reclaiming it. The application must handle SIGTERM: checkpoint progress to S3/DynamoDB, drain connections, and exit cleanly. For Kubernetes, use Spot interruption handlers (AWS Node Termination Handler) which cordon and drain the node when the 2-min warning arrives." },
      { text: "What is the cost impact of data transfer (egress) on cloud bills?", type: "linked", links_to: "5.7.02" }
    ],
    related: ["5.7.01", "5.7.02", "5.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["compute", "reserved-instances", "spot-instances", "savings-plans", "cost", "cloud"]
  },

  {
    id: "5.2.03",
    section: 5,
    subsection: "5.2",
    level: "advanced",
    question: "How does auto-scaling work in cloud environments, and what are the failure modes of naive auto-scaling configurations?",
    quick_answer: "→ Auto-scaling monitors metrics (CPU, RPS, queue depth) and adjusts instance count\n→ Scale-out: add instances when metric > threshold for N minutes; scale-in: remove when below\n→ Cooldown periods prevent thrashing — wait before evaluating again after a scaling event\n→ Failure modes: scaling too slow (provisioning lag), scaling on wrong metric, scale-in during spike recovery\n→ Target tracking policies outperform step scaling — react proportionally to deviation",
    detailed_answer: "Auto-scaling groups (AWS ASG, GCP MIG, Azure VMSS) monitor one or more metrics and adjust capacity to match demand. The configuration requires: minimum instances (availability floor), maximum instances (cost ceiling), desired capacity (starting point), and scaling policies.\n\nScaling policies come in three types. Simple/step scaling: add N instances when CPU > 70%, remove M when CPU < 30%. Target tracking: maintain a target metric value (keep average CPU at 60%) — the system computes the right instance count automatically. Scheduled scaling: pre-scale for known traffic patterns (add instances at 08:00, remove at 20:00). Target tracking is the recommended approach — it is self-tuning and avoids the over/under-shoot of step scaling.\n\nFailure modes of naive configurations: (1) Scaling on CPU during a transient spike — CPU spikes briefly during a deployment or batch job, triggering unnecessary scale-out that costs money and takes time to reverse. Solution: evaluate over a longer window (5 minutes), not a single data point. (2) Provisioning lag: an EC2 instance takes 2–5 minutes to launch, pass health checks, and register. If traffic ramps faster than this, requests fail before new capacity arrives. Solution: predictive scaling + scheduled pre-scaling. (3) Scale-in during recovery: after an incident, traffic returns and auto-scaling starts removing instances that were added — just as the recovering service needs headroom. Solution: set a longer scale-in cooldown (15–30 minutes). (4) Scaling on the wrong metric: CPU is a poor metric for I/O-bound workloads; queue depth or request count is more accurate for most application workloads.",
    key_points: [
      "Three policy types: step scaling, target tracking (recommended), scheduled",
      "Target tracking self-tunes — maintain a target metric, not a threshold",
      "Provisioning lag: 2-5 minutes for new instances — predictive scaling bridges the gap",
      "Cooldown prevents thrashing — evaluate over a window, not a single point",
      "Scale on the right metric: queue depth for consumers, RPS for APIs, not CPU for I/O-bound",
      "Scale-in cooldown should be longer than scale-out — protect recovering systems"
    ],
    hint: "Your service is CPU-bound during large file uploads, so you auto-scale on CPU. But most of your traffic is small API calls. What problem will you see?",
    common_trap: "Scaling on CPU as a universal metric — CPU is misleading for I/O-bound, memory-bound, or connection-limited workloads. Always choose the metric that most directly reflects the resource being exhausted.",
    follow_up_questions: [
      { text: "What is predictive auto-scaling and when does it outperform reactive scaling?", type: "inline", mini_answer: "Predictive scaling (AWS Compute Optimizer) uses ML to forecast load based on historical patterns and pre-provisions capacity before it is needed. It outperforms reactive scaling when load follows a predictable daily pattern (e.g. business-hours peak) — reactive scaling always lags the spike, predictive scaling pre-empts it." },
      { text: "How does Kubernetes HPA differ from cloud auto-scaling groups?", type: "inline", mini_answer: "ASG scales the number of VMs (nodes); HPA scales the number of pods within existing nodes. They work together: HPA adjusts pod count (fast, seconds), Cluster Autoscaler adds nodes when pods can't be scheduled (slower, minutes). KEDA extends HPA to scale on external event sources (queue depth, Kafka lag)." }
    ],
    related: ["3.1.02", "5.2.01", "3.1.04"],
    has_diagram: false,
    has_code: false,
    tags: ["auto-scaling", "compute", "target-tracking", "cooldown", "cloud"]
  },

  {
    id: "5.2.04",
    section: 5,
    subsection: "5.2",
    level: "advanced",
    question: "How do you architect a cost-efficient GPU workload for ML training in the cloud?",
    quick_answer: "→ Use Spot/Preemptible GPU instances — 60-90% cheaper, workload must checkpoint\n→ Checkpoint training state to object storage (S3/GCS) every N steps\n→ Resumable training: detect interruption via SIGTERM, save checkpoint, resubmit job\n→ Right-size GPU type: A100 for transformer training, T4/L4 for inference, V100 for smaller models\n→ Use managed training (SageMaker, Vertex AI, AzureML) to automate spot retry and orchestration",
    detailed_answer: "GPU instances are the most expensive compute in the cloud (A100 80GB: ~$32/hr on-demand on AWS). Cost-efficient ML training requires a combination of purchasing strategy and fault-tolerant job design.\n\nSpot GPU instances are the single most impactful cost reduction: p3.16xlarge (8× V100) drops from ~$24/hr on-demand to ~$7/hr on Spot — a 70% saving. Preemptible TPUs on GCP offer similar economics. The prerequisite is checkpointing: the training loop must save model weights, optimiser state, and epoch/step number to durable object storage every N steps (typically every 15–30 minutes). When a Spot instance is reclaimed, the job resumes from the last checkpoint on a new instance.\n\nGPU type selection: A100 (80GB) for large transformer training (LLMs); H100 for frontier model training; V100 for mid-size models; T4 and L4 for inference serving (cost-efficient, good INT8/FP16 support). Matching GPU memory to model size is critical — a model that doesn't fit in GPU VRAM requires gradient checkpointing or model parallelism, which reduce throughput.\n\nManaged training services (SageMaker Training Jobs, Vertex AI Training, AzureML) abstract spot instance management: they automatically retry on interruption, manage job queuing, and provide built-in checkpointing integrations. For one-off training jobs, they are operationally simpler than managing Spot fleets directly.",
    key_points: [
      "Spot GPU instances: 60-90% savings — checkpoint every 15-30 min to enable resumption",
      "Checkpoint: model weights + optimiser state + step number → S3/GCS",
      "A100 for large training, T4/L4 for inference — match GPU memory to model size",
      "Model larger than GPU VRAM → gradient checkpointing or model parallelism",
      "Managed training services automate spot retry — reduce operational complexity",
      "Reserved GPU instances for production inference serving (predictable baseline)"
    ],
    hint: "Your 12-hour training job runs on Spot instances and gets interrupted after 10 hours. What determines whether you lose 10 hours of work or 15 minutes?",
    common_trap: "Running GPU training on On-Demand instances because 'spot interruption is too complex' — the engineering cost of implementing checkpointing pays for itself within a handful of training runs.",
    follow_up_questions: [
      { text: "What is gradient checkpointing and how does it trade compute for memory?", type: "inline", mini_answer: "Gradient checkpointing (activation checkpointing) saves only a subset of activations during the forward pass instead of all of them. During backprop, missing activations are recomputed from the nearest checkpoint. Reduces GPU memory by 60-80% at the cost of 20-30% more compute. Enables training larger models on smaller GPUs." },
      { text: "How does distributed training across multiple GPUs work?", type: "inline", mini_answer: "Data parallelism: each GPU has a full model copy, processes a different batch shard, and gradients are averaged across GPUs (AllReduce). Model parallelism: model layers split across GPUs (for models too large for one GPU). Pipeline parallelism: layers split into stages across GPUs. Most LLM training uses a combination (3D parallelism: data + tensor + pipeline)." }
    ],
    related: ["5.2.01", "5.2.02", "8.4.01"],
    has_diagram: false,
    has_code: false,
    tags: ["GPU", "ML-training", "spot-instances", "checkpointing", "compute", "cloud"]
  },

  // ── 5.3 Networking ────────────────────────────────

  {
    id: "5.3.01",
    section: 5,
    subsection: "5.3",
    level: "intermediate",
    question: "What is a VPC (Virtual Private Cloud) and how do you design its CIDR and subnet structure?",
    quick_answer: "→ VPC: logically isolated network within a cloud region — your private network address space\n→ CIDR block: choose a range large enough for all future subnets (e.g. 10.0.0.0/16 = 65,536 IPs)\n→ Subnets: divide VPC CIDR into public (internet-routable), private (internal), and isolated (data tier)\n→ One subnet per AZ per tier — spread across 3 AZs for HA\n→ Avoid small CIDRs — VPC CIDR cannot be resized after creation",
    detailed_answer: "A VPC is a logically isolated virtual network within a cloud region. You own the IP address space, control routing, and determine what has internet access. Every cloud account starts with a default VPC — production systems should use purpose-built VPCs with deliberate address planning.\n\nCIDR design: choose a large enough private address space. RFC 1918 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) are conventional. AWS limits VPC CIDRs to /16–/28. A /16 gives 65,536 addresses — typically the right floor for a production VPC. VPC CIDR cannot be changed after creation; you can add secondary CIDRs, but this adds complexity. Avoid CIDR ranges that overlap with on-premises networks (for future VPN or Direct Connect) or peer VPCs.\n\nSubnet tiers: divide the VPC CIDR into public subnets (with a route to an Internet Gateway — for load balancers and NAT gateways), private subnets (route through NAT gateway — for application servers and containers), and isolated/data subnets (no internet route — for databases and caches). Create one subnet per tier per AZ: 3 public, 3 private, 3 isolated = 9 subnets in a /16, each a /20 or /22. This gives hundreds of IPs per subnet per AZ — more than enough for most workloads.\n\nSecurity controls: Security Groups are stateful instance-level firewalls (allow/deny by port and source SG); Network ACLs are stateless subnet-level firewalls (allow/deny by CIDR and port). Security Groups are sufficient for most use cases; NACLs add defence-in-depth for regulated environments.",
    key_points: [
      "VPC = isolated network; CIDR block = your IP address space within the region",
      "Use /16 CIDR — cannot resize after creation, and subnets need room to grow",
      "Three subnet tiers: public (LB), private (app), isolated (data) — one per AZ per tier",
      "Avoid CIDR overlap with on-premises networks and peer VPCs",
      "Security Groups (stateful, instance-level) + NACLs (stateless, subnet-level)",
      "NAT Gateway in each AZ for private subnet outbound — avoid cross-AZ NAT (adds cost and SPOF)"
    ],
    hint: "You create a VPC with a /24 CIDR block (256 IPs). Six months later you need to add a new service tier. What problem do you face?",
    common_trap: "Using a small CIDR block (e.g. /24) to 'save IP space' — private IP addresses are free and abundant; running out of VPC address space is a painful, disruptive problem that requires a VPC redesign.",
    follow_up_questions: [
      { text: "What is VPC peering and when would you use Transit Gateway instead?", type: "inline", mini_answer: "VPC peering: direct, low-latency connection between two VPCs (same or different accounts/regions). Limitation: peering is non-transitive — if A peers B and B peers C, A cannot reach C. Transit Gateway (AWS) acts as a hub connecting many VPCs and on-premises networks in a hub-and-spoke model. Use Transit Gateway when you have more than a handful of VPCs to connect." },
      { text: "How do you control outbound internet access for private subnet instances?", type: "inline", mini_answer: "NAT Gateway (managed, highly available within an AZ) translates private IPs to a public Elastic IP for outbound traffic. One NAT Gateway per AZ — don't route all AZs through a single NAT (cross-AZ cost + SPOF). NAT Gateway costs ~$0.045/hr + $0.045/GB processed. For cost-sensitive environments, use NAT Instance (cheaper but you manage it) or VPC endpoints for AWS service access." }
    ],
    related: ["5.3.02", "7.6.01", "5.1.03"],
    has_diagram: false,
    has_code: false,
    tags: ["VPC", "networking", "CIDR", "subnets", "security-groups", "cloud"]
  },

  {
    id: "5.3.02",
    section: 5,
    subsection: "5.3",
    level: "intermediate",
    question: "What is a load balancer, and how do you choose between Layer 4 and Layer 7?",
    quick_answer: "→ Load balancer distributes traffic across backend instances for scalability and HA\n→ Layer 4 (NLB/TCP): ultra-low latency, TCP/UDP passthrough, no HTTP awareness — gaming, VoIP, non-HTTP protocols\n→ Layer 7 (ALB/HTTP): reads HTTP headers, routes by path/host/header, TLS termination, sticky sessions\n→ ALB/Layer 7 is right for most web services — path routing, health checks, header manipulation\n→ NLB/Layer 4 when: static IP required, extreme throughput (millions RPS), protocol is not HTTP",
    detailed_answer: "A load balancer distributes incoming traffic across a pool of backend instances, preventing any single instance from being overwhelmed. It also performs health checks — removing unhealthy instances from the pool — enabling zero-downtime rolling deployments.\n\nLayer 4 load balancers (AWS NLB, GCP Network Load Balancer) operate at the TCP/UDP level. They route packets based on IP and port, with no understanding of HTTP. Traffic is passed through with minimal processing — latency overhead is microseconds. They preserve client IP addresses (useful for logging and geo-based access control) and support any TCP/UDP protocol. Use cases: non-HTTP protocols (MQTT, gaming, VoIP), extremely high throughput (millions RPS), workloads requiring static IPs for whitelisting.\n\nLayer 7 load balancers (AWS ALB, GCP HTTPS Load Balancer, Azure Application Gateway) understand HTTP. They can route by URL path (/api → service A, /static → CDN), by Host header (a.example.com → cluster A, b.example.com → cluster B), or by any HTTP header or query parameter. They terminate TLS (offloading certificate management from backend services), support WebSockets and HTTP/2, perform health checks at the HTTP level (a 200 response, not just a TCP connection), and provide request-level metrics. Use cases: any web application or API.\n\nFor most architects: default to Layer 7 (ALB/HTTPS LB). Layer 4 is a deliberate choice for specific requirements.",
    key_points: [
      "Layer 4: TCP/UDP passthrough, lowest latency, protocol-agnostic, preserves client IP",
      "Layer 7: HTTP-aware, path/host routing, TLS termination, request-level metrics",
      "ALB/Layer 7 is the default for web APIs and services",
      "NLB/Layer 4: static IP, extreme throughput, non-HTTP protocols, client IP preservation",
      "Layer 7 health checks verify HTTP 200 response — more accurate than TCP ping",
      "TLS termination at Layer 7 simplifies certificate management — backend uses plain HTTP"
    ],
    hint: "A financial trading platform needs a load balancer with a static IP for client whitelist rules and handles FIX protocol messages. Which layer?",
    common_trap: "Using Layer 4 because 'it's faster' for a standard web API — the performance difference is negligible for most workloads, while you lose path routing, HTTP health checks, and TLS termination.",
    follow_up_questions: [
      { text: "How do sticky sessions work on a Layer 7 load balancer and what are their drawbacks?", type: "inline", mini_answer: "Sticky sessions (session affinity): the load balancer routes requests from the same client to the same backend instance using a cookie. Drawback: uneven load distribution (one instance handles all sessions of a heavy user), no graceful drain on instance removal, breaks if the instance dies. Better solution: externalise session state to Redis so any instance can serve any session." },
      { text: "How does a global load balancer differ from a regional one?", type: "inline", mini_answer: "Global load balancers (AWS Global Accelerator, GCP Global LB, CloudFront) route traffic to the nearest healthy region using Anycast routing or GeoDNS. They provide cross-region failover and lower latency for globally distributed users. Regional load balancers route within a single region across AZs. Use global for multi-region deployments; regional for single-region HA." }
    ],
    related: ["5.3.01", "3.2.03", "7.3.01"],
    has_diagram: false,
    has_code: false,
    tags: ["load-balancer", "Layer-4", "Layer-7", "ALB", "NLB", "networking", "cloud"]
  },

  {
    id: "5.3.03",
    section: 5,
    subsection: "5.3",
    level: "intermediate",
    question: "What is a CDN and when should you use one?",
    quick_answer: "→ CDN: globally distributed edge network that caches content close to users\n→ Use for: static assets (JS, CSS, images), large file downloads, video streaming\n→ Benefits: reduced origin load, lower latency (edge vs. origin round-trip), DDoS absorption\n→ Cache-Control headers determine what gets cached and for how long\n→ Invalidation: purge by URL, by tag (surrogate keys), or by path prefix",
    detailed_answer: "A Content Delivery Network (CDN) is a globally distributed network of edge servers (Points of Presence — PoPs) that cache content close to end users. When a user requests a resource, the CDN serves it from the nearest PoP if cached, otherwise fetches from origin and caches the response for future requests.\n\nCDNs are appropriate for: static assets (JavaScript, CSS, images, fonts — anything that doesn't change per-request), large file downloads (software packages, game patches), video streaming (HLS/DASH segments), and public API responses that can be cached (product catalogue, documentation). They are not appropriate for: user-specific responses, session-dependent data, or real-time data streams.\n\nCache behaviour is controlled by HTTP response headers. Cache-Control: max-age=86400 caches the resource for 24 hours at the edge. Cache-Control: no-store prevents caching entirely. The Vary header tells the CDN to cache separate copies by request header (Vary: Accept-Encoding caches separate gzip and brotli versions). CDN providers extend standard headers with surrogate keys (Fastly, Cloudflare Cache-Tag) — tag multiple URLs with a key and purge them atomically when content changes.\n\nBeyond caching, modern CDNs provide: DDoS protection (absorb volumetric attacks at the edge before they reach the origin), WAF (Web Application Firewall — filter OWASP threats at the edge), edge computing (Cloudflare Workers, Lambda@Edge — run code at the PoP for personalisation without origin round-trips), and TLS termination at the edge.",
    key_points: [
      "CDN caches content at globally distributed edge PoPs — serves from closest PoP",
      "Use for: static assets, large downloads, public API responses, video streaming",
      "Cache-Control headers control cache duration; Vary controls cache key dimensions",
      "Surrogate keys enable atomic bulk invalidation without URL enumeration",
      "Modern CDNs also provide: DDoS protection, WAF, edge compute, TLS termination",
      "Cache-Control: no-store for user-specific or real-time data — never cache these"
    ],
    hint: "Your product image CDN cache is stale — users see old images. How do you invalidate without knowing every image URL?",
    common_trap: "Setting very long TTLs without a cache invalidation strategy — long TTLs reduce origin load but mean stale content persists after a change. Design cache-busting (content-hash filenames) or surrogate key invalidation before setting long TTLs.",
    follow_up_questions: [
      { text: "What is a cache stampede in a CDN context and how do you prevent it?", type: "linked", links_to: "2.4.05" },
      { text: "How does edge computing (Cloudflare Workers, Lambda@Edge) change what you can cache?", type: "inline", mini_answer: "Edge compute runs JavaScript/Wasm at the CDN PoP. It can personalise responses without an origin round-trip (e.g. inject user-specific content into a cached HTML shell), perform A/B testing at the edge, validate JWT tokens, and rewrite URLs. It enables 'dynamic caching' — cache the shell, personalise at the edge — combining caching efficiency with dynamic content." }
    ],
    related: ["2.4.01", "2.4.05", "7.3.01"],
    has_diagram: false,
    has_code: false,
    tags: ["CDN", "caching", "edge", "networking", "Cache-Control", "cloud"]
  },

  {
    id: "5.3.04",
    section: 5,
    subsection: "5.3",
    level: "advanced",
    question: "How does DNS work in a cloud architecture and what are the failure modes of DNS-based routing?",
    quick_answer: "→ DNS resolves hostnames to IPs — TTL controls how long resolvers cache the answer\n→ Cloud DNS (Route 53, Cloud DNS) supports: weighted, latency-based, geolocation, failover routing policies\n→ Low TTL enables fast failover but increases DNS query volume and cost\n→ DNS-based failover latency = TTL + resolver propagation (up to TTL × resolver count)\n→ DNS is not instantaneous — always pair with application-level health checks",
    detailed_answer: "In cloud architectures, DNS serves multiple roles beyond simple name resolution: traffic routing (Route 53 routing policies), service discovery (AWS Cloud Map, Consul), and disaster recovery failover (Route 53 health check + failover records).\n\nRoute 53 routing policies allow sophisticated traffic distribution: weighted (send 10% to new deployment, 90% to stable — blue-green or canary), latency-based (route to the lowest-latency region for each user), geolocation (route EU users to EU region for GDPR compliance), failover (route to primary, switch to secondary if health check fails), and multivalue answer (return multiple IPs, let resolver pick — simple load balancing).\n\nDNS failure modes: (1) TTL trap: a long TTL (e.g. 300s) means some resolvers serve the old IP for up to 5 minutes after a change. In a failover scenario, some users hit the dead primary during the propagation window. (2) Resolver caching: client-side resolvers (ISPs, corporate DNS) may ignore TTL and cache longer. The actual propagation time can exceed the TTL by 2–5×. (3) DNS not responding: a misconfigured DNS change can make the service unreachable entirely — DNS changes should be tested in staging with a short TTL window. (4) Negative caching: a NXDOMAIN (domain not found) response is also cached — a typo in a new DNS record can cause prolonged outages.\n\nFor production systems: set TTL to 60–300s for records that might need fast failover. Pre-lower TTL before planned changes (change from 3600 to 60, wait 3600s for propagation, then make the change). Pair DNS failover with application-level health checks — DNS alone is too slow for sub-minute RTO requirements.",
    key_points: [
      "Route 53 policies: weighted, latency, geolocation, failover, multivalue",
      "TTL = cache duration at resolvers; actual propagation can be TTL × 2-5×",
      "Pre-lower TTL before planned changes — wait for old TTL to expire first",
      "DNS failover is not instantaneous — minimum RTO is TTL + propagation delay",
      "Negative caching: NXDOMAIN from a DNS typo can cause prolonged outages",
      "For sub-minute RTO, use application-level failover (load balancer) not DNS alone"
    ],
    hint: "You change a Route 53 record with TTL=3600 during an incident. When can you be certain all users are hitting the new endpoint?",
    common_trap: "Assuming DNS changes take effect immediately — a 3600s TTL means some resolvers serve the old IP for up to an hour after you change the record.",
    follow_up_questions: [
      { text: "What is Anycast routing and how does it differ from DNS-based geo-routing?", type: "inline", mini_answer: "Anycast: multiple servers advertise the same IP via BGP. Routers direct traffic to the topologically nearest server — no DNS involvement. Failover is near-instantaneous (BGP reconvergence: seconds). Used by CDNs (Cloudflare, Fastly) and AWS Global Accelerator. DNS geo-routing: different IPs returned based on resolver location — requires DNS propagation for changes (minutes to hours)." },
      { text: "How does service discovery differ from DNS-based routing?", type: "linked", links_to: "4.1.11" }
    ],
    related: ["5.3.02", "3.7.01", "4.1.11"],
    has_diagram: false,
    has_code: false,
    tags: ["DNS", "Route53", "failover", "routing-policies", "networking", "cloud"]
  },

  // ── 5.4 Storage ───────────────────────────────────

  {
    id: "5.4.01",
    section: 5,
    subsection: "5.4",
    level: "intermediate",
    question: "What are the three main cloud storage types (object, block, file) and when do you use each?",
    quick_answer: "→ Object storage (S3, GCS): flat namespace, HTTP API, unlimited scale — static assets, backups, data lake, ML datasets\n→ Block storage (EBS, Persistent Disk): raw disk attached to a VM — databases, OS volumes, anything needing a filesystem\n→ File storage (EFS, Filestore): shared filesystem — multiple instances read/write same data, lift-and-shift NAS use cases\n→ Object: cheapest at scale, most durable; Block: lowest latency; File: shared access at extra cost",
    detailed_answer: "Cloud storage comes in three distinct models, each optimised for different access patterns.\n\nObject storage (S3, GCS, Azure Blob) stores data as discrete objects in a flat namespace with a unique key. Access is via HTTP API (GET/PUT/DELETE). There is no filesystem — no directories, no file locking, no POSIX semantics. Strengths: unlimited scale (no capacity planning), 11 nines durability (S3 SLA), very low cost at scale (~$0.023/GB/month for S3 Standard), and global accessibility via presigned URLs. Use cases: static web assets, user-uploaded files, database backups, data lake raw zone, ML training datasets, log archiving. Not appropriate for: workloads requiring file locking, low-latency random I/O, or POSIX filesystem semantics.\n\nBlock storage (EBS, GCP Persistent Disk, Azure Managed Disk) provides raw storage blocks attached to a single VM as a virtual disk. It supports any filesystem (ext4, XFS, NTFS) and enables direct I/O with consistent low latency (gp3 EBS: 1ms, io2: <0.5ms). Use cases: OS volumes, database data files (PostgreSQL, MySQL, MongoDB), applications requiring a filesystem. Not shareable between instances except with specific multi-attach products (EBS Multi-Attach — limited use cases).\n\nFile storage (EFS, GCP Filestore, Azure Files) provides a managed NFS or SMB shared filesystem. Multiple instances can mount and read/write concurrently. Use cases: applications that require shared filesystem access (content management systems, rendering farms, lift-and-shift applications expecting NAS), home directories for compute clusters. Higher cost than block or object (~$0.30/GB/month for EFS vs. $0.10/GB for EBS gp3).",
    key_points: [
      "Object: flat namespace, HTTP API, unlimited scale, cheapest — static assets, backups, data lakes",
      "Block: raw disk, filesystem, low-latency random I/O — databases, OS volumes",
      "File: shared POSIX filesystem, multi-instance concurrent access — NAS lift-and-shift",
      "Object is most durable (11 nines); block is fastest; file is most expensive per GB",
      "Object storage cannot be used as a database data directory — no POSIX semantics",
      "Block storage is attached to one VM (except multi-attach); object and file are shareable"
    ],
    hint: "A customer wants to store 500TB of machine learning training data and access it from 200 GPU instances simultaneously. Which storage type fits best?",
    common_trap: "Mounting object storage as a filesystem (S3FUSE, gcsfuse) for database workloads — POSIX-over-object-storage is very slow for random I/O and breaks filesystem semantics in subtle ways. Use block storage for databases.",
    follow_up_questions: [
      { text: "What are S3 storage classes and how do they optimise cost for different access patterns?", type: "inline", mini_answer: "S3 Standard (~$0.023/GB): frequent access. S3-IA (Infrequent Access, ~$0.0125/GB + retrieval fee): monthly access. S3 Glacier Instant (~$0.004/GB): quarterly access, millisecond retrieval. S3 Glacier Deep Archive (~$0.00099/GB): annual access, 12h retrieval. S3 Intelligent-Tiering automates tier selection based on access frequency — good for unpredictable patterns." },
      { text: "How do you design a data lake storage layer on object storage?", type: "inline", mini_answer: "Zone the lake: raw (landed as-is, immutable), curated (cleaned, Parquet, partitioned), and serving (aggregated, query-optimised). Use S3 prefixes or GCS buckets per zone with IAM boundaries. Separate write roles (pipeline) from read roles (analysts). Govern the schema registry with Glue Data Catalog or Hive Metastore. Automate compaction of small files in the curated zone." }
    ],
    related: ["5.4.02", "8.3.01", "5.1.02"],
    has_diagram: false,
    has_code: false,
    tags: ["storage", "object-storage", "block-storage", "file-storage", "S3", "EBS", "EFS", "cloud"]
  },

  {
    id: "5.4.02",
    section: 5,
    subsection: "5.4",
    level: "intermediate",
    question: "How do you design an S3-based storage architecture for security and cost efficiency?",
    quick_answer: "→ Security: block all public access, enforce bucket policies + SCP, enable versioning and MFA delete, server-side encryption (SSE-S3 or SSE-KMS)\n→ Cost: lifecycle rules to move objects to cheaper tiers (IA → Glacier) after N days\n→ Structure: prefix-based partitioning for performance at high object count\n→ Access pattern: presigned URLs for time-limited client access (not public bucket)\n→ Replication: cross-region replication for DR; same-region replication for compliance copies",
    detailed_answer: "S3 is often the highest-volume, lowest-cost storage tier, but naive configurations are the source of many cloud security incidents and surprise bills.\n\nSecurity configuration: (1) Block all public access at the account level — an SCP (Service Control Policy) that denies s3:PutBucketPublicAccessBlock can prevent individual teams from accidentally making buckets public. (2) Enforce encryption: SSE-S3 (provider-managed) for most data, SSE-KMS for regulated data requiring key management and audit logging. (3) Enable versioning for critical buckets so objects can be recovered after accidental deletion or ransomware. (4) Enable MFA Delete on versioned buckets to require a second factor for permanent deletion. (5) Use bucket policies to restrict access by principal (specific IAM roles only) and source VPC (VPC endpoint — prevent access outside the VPC).\n\nCost optimisation: (1) Lifecycle rules: transition objects to S3-IA after 30 days, Glacier Instant after 90 days, Glacier Deep Archive after 180 days — can reduce storage cost 95%. (2) Intelligent-Tiering for unpredictable access patterns. (3) Delete incomplete multipart uploads: failed large uploads leave byte fragments that accrue cost — a lifecycle rule to abort incomplete multipart after 7 days prevents this. (4) Monitor S3 request cost with S3 Storage Lens — GET and PUT requests have per-request costs that add up for high-frequency access.\n\nPerformance: S3 prefix partitioning matters above ~3,500 PUT/s or 5,500 GET/s per prefix. Distribute objects across multiple prefixes (use hash prefixes, not date prefixes) to avoid prefix-level throttling.",
    key_points: [
      "Block all public access at account level via SCP — prevent accidental exposure",
      "SSE-KMS for regulated data; versioning + MFA Delete for critical buckets",
      "Lifecycle rules: IA → Glacier → Deep Archive — reduce cost 80-95% for cold data",
      "Clean up incomplete multipart uploads — they incur storage cost silently",
      "Presigned URLs for time-limited client access, not public buckets",
      "Prefix partitioning for high-throughput: avoid hot prefixes (date prefix at scale)"
    ],
    hint: "Your S3 bucket has 10 million objects uploaded 2 years ago and never accessed. What is the cost impact of moving them to Glacier Deep Archive?",
    common_trap: "Using public S3 buckets for 'convenience' to share files with partners — presigned URLs provide time-limited, audited access to private buckets without public exposure.",
    follow_up_questions: [
      { text: "What is an S3 VPC endpoint and why would you use it?", type: "inline", mini_answer: "A VPC endpoint (Gateway type for S3) routes S3 traffic through the AWS private network rather than the public internet. Benefits: no egress cost for S3 access from within the VPC, and you can write bucket policies that deny access except from within the VPC (preventing exfiltration via internet). Required for high-throughput data processing (no per-GB egress cost)." },
      { text: "How do you audit who accessed an S3 bucket and when?", type: "inline", mini_answer: "Enable S3 Server Access Logging (per-request log to another bucket) or CloudTrail data events (S3 object-level actions to CloudTrail). CloudTrail is better for compliance: it captures identity, time, action, and object key with tamper-evident audit trail. Server Access Logging is cheaper for high-volume access patterns." }
    ],
    related: ["5.4.01", "7.8.01", "7.5.01"],
    has_diagram: false,
    has_code: false,
    tags: ["S3", "storage", "security", "lifecycle", "cost", "encryption", "cloud"]
  },

  {
    id: "5.4.03",
    section: 5,
    subsection: "5.4",
    level: "advanced",
    question: "How do you design storage for a high-throughput data ingestion pipeline handling 1TB/day?",
    quick_answer: "→ Landing zone: S3/GCS raw prefix — append-only, partitioned by date/hour\n→ Avoid small files: batch micro-writes before landing (S3 hates millions of tiny files)\n→ Format: Parquet or ORC for analytical querying — columnar, compressed, splittable\n→ Partitioning strategy: partition by query patterns (year/month/day for time-series queries)\n→ Compaction: periodically merge small files into larger ones (Spark/Glue job)\n→ Lifecycle: raw zone (30d) → curated zone (1yr) → archive (7yr for compliance)",
    detailed_answer: "A 1TB/day ingestion pipeline creates ~730TB/year in raw storage. The design must balance write throughput, query performance, and cost.\n\nLanding zone design: write raw events to object storage (S3 prefix or GCS bucket) in an append-only pattern. Partition by ingestion time (year/month/day/hour) to enable partition pruning in queries. The key anti-pattern is small files: if each event is written as a separate object, you accumulate millions of tiny files that are expensive to list, read, and process. Instead, buffer events in Kinesis/Kafka and flush batches every 5–15 minutes as 10–100MB files.\n\nFile format: for analytical querying, Parquet or ORC (columnar, compressed) reduces storage by 70–80% compared to JSON/CSV and enables predicate pushdown in query engines (Athena, BigQuery, Spark, Trino). Splittable formats (Parquet blocks) allow parallel processing without full-file reads.\n\nPartitioning strategy: partition by the fields most commonly used in WHERE clauses. For event data, year/month/day is standard. For multi-tenant data, add a tenant_id partition. Avoid high-cardinality partitions (user_id = 10M partitions) — query planners can't enumerate them efficiently.\n\nCompaction: ingest creates small files even with batching; a periodic compaction job (AWS Glue, Apache Spark on EMR) merges small files into larger ones (256MB–1GB target). This dramatically improves query scan performance. Delta Lake, Apache Iceberg, and Apache Hudi provide transactional table formats that automate compaction and small-file management.",
    key_points: [
      "Buffer events before landing — avoid millions of tiny files in object storage",
      "Parquet/ORC: columnar, compressed, splittable — 70-80% smaller than JSON, faster queries",
      "Partition by query patterns: date for time-series, tenant_id for multi-tenant",
      "Compaction: merge small files periodically — target 256MB-1GB per file",
      "Delta Lake/Iceberg: transactional table format with automatic compaction",
      "Lifecycle: raw (short retention) → curated (medium) → archive (compliance minimum)"
    ],
    hint: "If each API request writes its own JSON file to S3 at 10,000 RPS, how many files will you have after 1 day? What does that mean for query performance?",
    common_trap: "Writing every event as a separate S3 object — at 10,000 events/second, that's 864 million objects per day. Listing, reading, and processing them becomes prohibitively expensive. Always batch before landing.",
    follow_up_questions: [
      { text: "What is Apache Iceberg and how does it improve on Hive partitioning?", type: "inline", mini_answer: "Iceberg is an open table format that adds ACID transactions, schema evolution, hidden partitioning, and time-travel to object storage. Unlike Hive, partition changes don't require data migration — you add a new partition spec and Iceberg handles the rest. Atomic commits prevent readers from seeing partial writes. Supported by Spark, Trino, Flink, and AWS Athena natively." },
      { text: "How do you handle late-arriving data in a time-partitioned storage layout?", type: "inline", mini_answer: "Late data (arriving after its event-time partition was closed) is a common problem. Options: (1) Reprocess the affected partition when late data arrives; (2) Use a dedicated 'late' partition and merge on query; (3) Use Iceberg/Delta time-travel to append to a past partition transactionally. The right choice depends on query freshness requirements and reprocessing cost." }
    ],
    related: ["5.4.01", "8.3.01", "8.1.01"],
    has_diagram: false,
    has_code: false,
    tags: ["storage", "data-ingestion", "Parquet", "S3", "compaction", "partitioning", "cloud"]
  },

  // ── 5.5 Managed Services ──────────────────────────

  {
    id: "5.5.01",
    section: 5,
    subsection: "5.5",
    level: "intermediate",
    question: "When should you use a managed cloud service versus self-managed open-source software?",
    quick_answer: "→ Managed: no operational overhead (patching, HA, backups) — team focuses on product\n→ Self-managed: more control, cheaper at very high scale, avoids vendor lock-in\n→ Managed wins when: team is small, HA matters, you don't have the ops expertise\n→ Self-managed wins when: cost is the primary driver at extreme scale, or the managed service lacks required features\n→ Start managed; migrate to self-managed only when you can quantify the saving",
    detailed_answer: "The managed vs. self-managed decision is fundamentally about the cost of operations vs. the cost of the managed service premium.\n\nManaged services (RDS instead of self-managed PostgreSQL, ElastiCache instead of Redis on EC2, MSK instead of self-managed Kafka) take ownership of: OS patching, database engine upgrades (configurable), automated backups, multi-AZ failover, read replica creation, and monitoring integration. The team is shielded from operational complexity and can focus on application development. For teams without dedicated DBAs or SREs, managed services prevent costly operational mistakes.\n\nThe price premium varies. RDS PostgreSQL costs approximately 2× equivalent EC2 + EBS for the same compute and storage. For small to medium workloads, this premium is worth the operational offload. At very large scale (thousands of database instances, petabytes of Kafka), the premium becomes substantial and self-managed can justify dedicated operations teams.\n\nManaged services have limitations: less configuration flexibility (cannot tune kernel parameters), upgrade timing not always in your control, and features that exist in the open-source version may not be available (RDS doesn't support all PostgreSQL extensions). When a required feature is missing from the managed service, the choice is to either use the open-source workaround or accept the self-managed operational burden.\n\nDecision framework: start managed. Migrate to self-managed only when you have a quantified cost saving (the managed premium exceeds the cost of operating it yourself, including incidents, patching toil, and on-call burden) or a specific feature requirement the managed service cannot meet.",
    key_points: [
      "Managed: no OS/engine ops, automatic HA, backups — team focuses on product",
      "Self-managed: cheaper at extreme scale, more config control, avoids lock-in",
      "For most teams: managed wins — ops complexity is underestimated, incidents are costly",
      "Price premium: ~2× for managed compute — justified at moderate scale",
      "Missing features (kernel params, specific extensions) may force self-managed",
      "Default to managed; migrate self-managed only with quantified business case"
    ],
    hint: "Your team of 3 engineers is considering running self-managed Kafka on EC2 to save $2,000/month vs. MSK. What hidden costs should you quantify first?",
    common_trap: "Underestimating the operational cost of self-managed — patching, monitoring, capacity planning, incident response, and Kafka broker tuning represent significant ongoing engineering time. The managed premium is rarely as expensive as it looks versus total cost of ownership.",
    follow_up_questions: [
      { text: "What features does Amazon RDS not support that self-managed PostgreSQL does?", type: "inline", mini_answer: "RDS PostgreSQL restrictions: no superuser access, limited extension support (no PostGIS on some instance types, no pg_prewarm), no custom OS-level tuning (huge pages, shared_buffers beyond RDS limits), some replication modes (logical replication limitations), and specific PostgreSQL versions on a delay from upstream. Aurora PostgreSQL has different restrictions again." },
      { text: "How do you evaluate whether a managed Kafka service (MSK) meets your latency requirements?", type: "inline", mini_answer: "Run a benchmark with your actual message sizes and throughput against MSK configuration (broker count, replication factor, retention size). Key metrics: p99 produce latency and consumer lag under sustained load. MSK uses standard Kafka — performance is similar to self-managed at the same instance types. The main latency difference is MSK's managed networking vs. tuned self-managed networking." }
    ],
    related: ["5.5.02", "5.1.01", "4.3.01"],
    has_diagram: false,
    has_code: false,
    tags: ["managed-services", "build-vs-buy", "operational-overhead", "cloud"]
  },

  {
    id: "5.5.02",
    section: 5,
    subsection: "5.5",
    level: "intermediate",
    question: "How do you evaluate and select a managed database service for a new project?",
    quick_answer: "→ Data model: relational (Aurora/RDS), document (DocumentDB/Firestore), key-value (DynamoDB/Bigtable), time-series (Timestream)\n→ Scale requirement: DynamoDB for unlimited horizontal scale; Aurora for relational with read replicas\n→ Consistency: Aurora = strong; DynamoDB = eventual by default, strong per-item available\n→ Cost model: RDS = instance-based; DynamoDB = request + storage (good for spiky or low traffic)\n→ Verify: required extensions, backup/restore SLA, replication lag, max connections",
    detailed_answer: "Managed database selection starts with the data model requirement. If the application requires relational semantics (joins, foreign keys, ACID transactions across tables), the choice is Aurora (PostgreSQL or MySQL compatible), Cloud Spanner (global, strongly consistent relational), or RDS. If the workload is document-centric, managed options include DocumentDB (MongoDB-compatible on AWS), Firestore (GCP), or Cosmos DB (Azure). For key-value and wide-column at massive scale, DynamoDB (AWS) or Bigtable (GCP).\n\nScale requirements are the second filter. RDS single-instance scales vertically to ~96 vCPUs; Aurora adds read replicas (up to 15) and aurora serverless for variable load. DynamoDB is serverless and scales to any throughput — appropriate for truly unpredictable or very high write loads. Cloud Spanner scales horizontally for relational workloads globally.\n\nCost model matters: RDS and Aurora charge by instance-hour regardless of utilisation — best for consistent load. DynamoDB charges by request (on-demand mode) or provisioned capacity (reserved mode) — best for spiky or unpredictable traffic. Aurora Serverless v2 bridges this gap with per-ACU-second billing.\n\nVerification checklist: (1) Required PostgreSQL/MySQL extensions (RDS does not support all); (2) Backup/restore SLA (automated backups, point-in-time recovery window); (3) Replication lag for read replicas (relevant for read consistency requirements); (4) Maximum connection limits (RDS has a hard connection limit per instance class — connection pooling via PgBouncer is often required); (5) Encryption and audit logging support for compliance.",
    key_points: [
      "Match data model first: relational, document, key-value, time-series",
      "Aurora for relational scale; DynamoDB for unlimited horizontal key-value scale",
      "Cost model: instance-based (RDS/Aurora) vs. request-based (DynamoDB) — match workload pattern",
      "RDS has connection limits — require PgBouncer at scale",
      "Verify extensions, backup SLA, replication lag, encryption for compliance",
      "Aurora Serverless v2: relational with auto-scaling — bridges instance vs. serverless"
    ],
    hint: "A new service needs a relational database but will have 0 traffic overnight and 10,000 RPS during business hours. What is the cost implication of Aurora vs. DynamoDB for this pattern?",
    common_trap: "Choosing a managed database based on familiarity rather than workload fit — using RDS for a workload that needs DynamoDB-level horizontal scale means you will hit scaling limits mid-growth and face a painful migration.",
    follow_up_questions: [
      { text: "What is connection pooling and why is it required for RDS at scale?", type: "inline", mini_answer: "RDS has a hard maximum connection limit (e.g. db.r5.large PostgreSQL: ~500 connections). At 100 application instances × 10 connections each = 1,000 connections — exceeds the limit. PgBouncer (connection pooler) sits in front of RDS, multiplexing many application connections over a smaller pool. PgBouncer on the application server or as a sidecar reduces connection count by 5-20× with minimal latency overhead." },
      { text: "How does Amazon Aurora differ from standard RDS under the hood?", type: "inline", mini_answer: "Aurora separates compute from storage. Six copies of data are stored across 3 AZs in a shared distributed storage layer. Failover is faster (<30s vs. 60-120s for RDS Multi-AZ) because no storage failover is needed — a new compute instance attaches to the same storage. Write latency is lower because only 4-of-6 storage write acknowledgements are needed. Aurora also supports up to 15 read replicas sharing the same storage (no replication lag for replicas — they read from the same shared storage)." }
    ],
    related: ["2.1.01", "2.2.01", "5.5.01"],
    has_diagram: false,
    has_code: false,
    tags: ["managed-database", "Aurora", "DynamoDB", "RDS", "database-selection", "cloud"]
  },

  {
    id: "5.5.03",
    section: 5,
    subsection: "5.5",
    level: "advanced",
    question: "How do you architect with managed message queues (SQS, Pub/Sub) versus managed streaming platforms (Kinesis, Kafka)?",
    quick_answer: "→ Queues (SQS, Pub/Sub): task distribution, guaranteed single delivery, no replay — email send, order processing\n→ Streaming (Kinesis, Kafka): ordered, replayable, multi-consumer — event log, analytics, audit trail\n→ Queue: scales to any throughput, consumer pulls messages, message deleted after ack\n→ Stream: partitioned log, consumer tracks offset, messages retained for hours/days\n→ Choose stream when you need replay or multiple independent consumers on the same events",
    detailed_answer: "Managed queues and managed streaming platforms are often conflated but serve different purposes.\n\nManaged queues (SQS, GCP Pub/Sub in pull mode, Azure Service Bus) implement the work queue pattern: a producer publishes a task, exactly one consumer processes it, the message is deleted after acknowledgement. Use cases: task distribution (video encoding jobs, email sends, order processing), fan-out with SNS→SQS (one message published to multiple queues, each processed independently). SQS scales to virtually unlimited throughput with no provisioning. Messages are retained for up to 14 days by default; dead-letter queues capture failed messages.\n\nManaged streaming platforms (Kinesis Data Streams, Amazon MSK/Kafka, GCP Dataflow/Pub/Sub in streaming mode) implement the event log pattern: an ordered, persistent, replayable log of events. Multiple independent consumers can read the same stream at different offpoints. Retention is hours to days (Kinesis: 24h–365d; Kafka: configurable). Use cases: event sourcing, CDC (Change Data Capture), analytics pipelines, audit trails, multi-consumer fan-out where each consumer is at a different position.\n\nThe decision matrix: If you need replay (re-process historical events), use a stream. If you need multiple independent consumers at different offsets, use a stream. If you need exactly-once delivery for tasks with no replay requirement, use a queue. If you need strict ordering per key (e.g. all events for user 123 in order), use a stream with key-based partitioning. If you need dead-lettering and retry for failed tasks, a queue with DLQ is simpler to configure.",
    key_points: [
      "Queue: task distribution, single consumer per message, deleted after ack, no replay",
      "Stream: ordered log, multi-consumer, replayable, messages retained by time",
      "SQS scales elastically with no provisioning; Kinesis/Kafka requires shard/partition planning",
      "Use stream for: event sourcing, CDC, audit trail, multi-consumer, replay",
      "Use queue for: task work queue, exactly-once processing, dead-letter retry",
      "Kinesis: 1MB/s per shard; SQS: unlimited throughput — different cost models"
    ],
    hint: "You need to send a welcome email when a user registers, and also update your analytics system with the registration event. Is a queue or a stream a better fit — and why?",
    common_trap: "Using a queue for an event log use case — you can't replay SQS messages after they are consumed, and you can't have two independent consumers reading the same SQS queue at different positions.",
    follow_up_questions: [
      { text: "How does exactly-once delivery work in SQS?", type: "inline", mini_answer: "SQS offers at-least-once delivery (standard queue) or exactly-once FIFO with deduplication (FIFO queue). FIFO deduplication uses a deduplication ID: if the same ID is sent within 5 minutes, SQS discards the duplicate. Consumers still need idempotent processing — FIFO prevents duplicate delivery at the queue, but processing failure + retry can still cause double processing." },
      { text: "What is Kinesis Data Firehose and when would you use it instead of Kinesis Data Streams?", type: "inline", mini_answer: "Kinesis Data Firehose is a fully managed delivery service: buffer records, batch them, and deliver to S3, Redshift, or Elasticsearch with built-in transformation. No consumer code required. Use Firehose when the destination is a storage or analytics sink (S3 data lake, Redshift). Use Kinesis Data Streams when you need custom consumer code (Lambda, KCL application) to process events in real time." }
    ],
    related: ["4.3.01", "4.3.02", "5.5.01"],
    has_diagram: false,
    has_code: false,
    tags: ["SQS", "Kinesis", "messaging", "streaming", "managed-services", "cloud"]
  },

  // ── 5.6 Multi-Cloud & Hybrid ──────────────────────

  {
    id: "5.6.01",
    section: 5,
    subsection: "5.6",
    level: "intermediate",
    question: "What are the genuine use cases for multi-cloud strategy, and what are the hidden costs?",
    quick_answer: "→ Genuine cases: regulatory (data in specific jurisdiction, one provider not available), best-of-breed (GCP ML + AWS compute), negotiating leverage, M&A integration\n→ Hidden costs: doubled operational tooling, twice the training and certifications, cross-cloud networking egress, inconsistent IAM models, harder observability\n→ Most 'avoid vendor lock-in' arguments don't justify the cost — portability is achievable within one cloud\n→ Default to single-cloud; go multi-cloud only when the use case is explicit and quantified",
    detailed_answer: "Multi-cloud is often proposed as a strategy to 'avoid vendor lock-in' or 'increase resilience.' In most cases, these are not strong enough justifications for the operational complexity introduced.\n\nGenuine multi-cloud use cases: (1) Regulatory or data sovereignty requirements where one provider does not have a presence in the required jurisdiction. (2) Best-of-breed service selection — running ML workloads on GCP (Vertex AI, TPUs) while the application runs on AWS — justified when the service difference is substantial and the integration cost is acceptable. (3) Corporate negotiating leverage — using two providers gives procurement leverage at contract renewal. (4) M&A integration — a merged organisation has systems on two clouds that need to interoperate before consolidation. (5) Specific SLA requirements that a single provider cannot meet (true for only the most critical global systems).\n\nHidden costs: (1) Data egress between clouds: AWS and GCP both charge ~$0.08/GB for outbound traffic. Heavy cross-cloud data movement can cost more than the managed service premium you are trying to avoid. (2) Doubled tooling: separate CI/CD configurations, separate Terraform providers, separate monitoring dashboards, separate IAM models (AWS IAM is not compatible with GCP IAM). (3) Doubled training: engineers must be proficient on two provider consoles, CLIs, and networking models. (4) Cross-cloud latency: 15–50ms cross-region between clouds vs. <2ms within an AZ — requires careful design for synchronous dependencies.\n\nVendor lock-in is mitigable within a single cloud without going multi-cloud: use open standards (Kubernetes, OpenTelemetry, Postgres-compatible DBs, Terraform) for portability, and abstract provider-specific services behind interfaces.",
    key_points: [
      "Genuine cases: regulatory jurisdiction, best-of-breed services, M&A, negotiating leverage",
      "Not genuine: 'avoid vendor lock-in' — achievable within one cloud via open standards",
      "Cross-cloud egress cost: $0.08/GB — can exceed managed service premium",
      "Doubled tooling, training, IAM complexity — significant ongoing operational cost",
      "Cross-cloud latency: 15-50ms vs. <2ms intra-AZ — synchronous dependencies are painful",
      "Default single-cloud; multi-cloud requires explicit, quantified business case"
    ],
    hint: "A CTO says 'we should use AWS and GCP to avoid being locked in to one provider.' What is the egress cost if you move 10TB/month of data between them?",
    common_trap: "Treating multi-cloud as a default resilience strategy — a primary-region failure on AWS is far rarer than a team misconfiguration. Multi-AZ within one cloud usually provides better reliability per dollar than multi-cloud active-active.",
    follow_up_questions: [
      { text: "How do you architect a hybrid cloud connecting on-premises to AWS?", type: "inline", mini_answer: "Two options: (1) AWS VPN over public internet — IPSec tunnel, ~1.25 Gbps max, variable latency, no SLA — dev/test or backup connectivity. (2) AWS Direct Connect — dedicated physical connection, 1-100 Gbps, consistent latency, monthly port fee (~$0.03-$0.30/hr) plus data transfer. Use Direct Connect for production workloads with latency or throughput requirements. Add a VPN as backup path." },
      { text: "What is Google Distributed Cloud and how does it change the hybrid cloud model?", type: "inline", mini_answer: "Google Distributed Cloud (formerly Anthos on-prem) runs GCP services on customer-owned hardware in their data centre or edge locations. The customer owns the hardware; Google manages the software layer (GKE, Cloud SQL). It enables regulatory-compliant workloads to use GCP services without data leaving the premises. Similar to AWS Outposts and Azure Stack." }
    ],
    related: ["5.1.04", "3.7.02", "5.3.04"],
    has_diagram: false,
    has_code: false,
    tags: ["multi-cloud", "hybrid-cloud", "vendor-lock-in", "cloud-strategy"]
  },

  {
    id: "5.6.02",
    section: 5,
    subsection: "5.6",
    level: "advanced",
    question: "How do you design network connectivity between cloud and on-premises for a hybrid workload?",
    quick_answer: "→ VPN: IPSec over public internet — encrypted, 1.25Gbps max, variable latency — dev/test, failback path\n→ Direct Connect (AWS) / Cloud Interconnect (GCP): dedicated fibre — consistent low latency, 1-100Gbps, monthly commitment\n→ Transit architecture: on-prem → Direct Connect → Transit Gateway → multiple VPCs\n→ BGP route exchange: on-prem advertises its CIDRs, AWS advertises VPC CIDRs — dynamic routing\n→ Always have a VPN as backup path when Direct Connect fails",
    detailed_answer: "Hybrid connectivity design starts with the throughput, latency, and reliability requirements of the workload crossing the boundary.\n\nVPN (AWS Site-to-Site VPN, GCP VPN): establishes an IPSec tunnel over the public internet between the on-premises router and the cloud VPN gateway. Each VPN connection supports up to 1.25 Gbps. Latency is variable (depends on internet path). Availability is limited by internet quality. Cost is low ($0.05/hr per VPN connection plus data transfer). Appropriate for: dev/test connectivity, non-latency-sensitive data transfers, backup path when Direct Connect is the primary.\n\nDirect Connect (AWS) / Cloud Interconnect (GCP): a dedicated physical connection between the on-premises data centre and the cloud provider's colocation facility. Connections are 1, 10, or 100 Gbps. Latency is consistent and low. Available as hosted connections (via a network partner) or dedicated connections (direct with AWS). Cost: port fee ($0.03–$0.30/hr) plus data transfer rate. Required for: production workloads with latency SLAs, high-throughput data transfer (>1 Gbps sustained), or workloads where variable internet latency is unacceptable.\n\nTransit architecture: for enterprises with many VPCs and on-premises sites, Direct Connect to a Transit Gateway provides a hub-and-spoke model. On-premises connects once via Direct Connect; Transit Gateway distributes connectivity to all VPCs. BGP (Border Gateway Protocol) is used to exchange route tables dynamically — on-premises advertises its subnets, AWS VPCs advertise their CIDRs, and routing is automatically updated when topology changes.\n\nResilience: always deploy Direct Connect in two geographically separate facilities (diverse paths) with a VPN as a final backup. A single Direct Connect link is a physical SPOF.",
    key_points: [
      "VPN: encrypted internet tunnel, 1.25Gbps, variable latency — dev/test or backup",
      "Direct Connect: dedicated fibre, consistent latency, 1-100Gbps — production requirement",
      "Transit Gateway: hub for many VPCs + on-premises — one Direct Connect connection serves all",
      "BGP: dynamic route exchange between on-premises and cloud — routes update automatically",
      "Resilience: two Direct Connect paths + VPN backup — single DX is a physical SPOF",
      "Cost model: DX port fee + data transfer; VPN: $0.05/hr per connection + transfer"
    ],
    hint: "Your Direct Connect connection goes down. If you have no VPN backup, what happens to your hybrid application's database traffic?",
    common_trap: "Deploying a single Direct Connect connection without a VPN backup — Direct Connect is a physical link with a monthly MTTR measured in hours (fibre repair). VPN as backup keeps hybrid connectivity during an outage.",
    follow_up_questions: [
      { text: "What is AWS PrivateLink and when would you use it for hybrid connectivity?", type: "inline", mini_answer: "AWS PrivateLink exposes a service in one VPC to consumers in another VPC (or on-premises via Direct Connect) via a private endpoint — without VPC peering or internet exposure. Use it when you want to share a specific service (not the full VPC) with another team's VPC or an on-premises consumer. Traffic stays on the AWS private network." },
      { text: "How do you handle DNS resolution across a hybrid boundary?", type: "inline", mini_answer: "On-premises DNS cannot resolve AWS VPC private hostnames (like rds.us-east-1.amazonaws.com private endpoint) by default. Solution: Route 53 Resolver with inbound endpoints (on-prem DNS forwards cloud queries to Route 53 via Direct Connect) and outbound endpoints (Route 53 forwards on-prem domain queries to on-prem DNS). This creates bidirectional private DNS resolution across the boundary." }
    ],
    related: ["5.6.01", "5.3.01", "7.6.01"],
    has_diagram: false,
    has_code: false,
    tags: ["hybrid-cloud", "Direct-Connect", "VPN", "networking", "BGP", "cloud"]
  },

  // ── 5.7 Cost Optimisation ─────────────────────────

  {
    id: "5.7.01",
    section: 5,
    subsection: "5.7",
    level: "intermediate",
    question: "What are the main levers for reducing cloud infrastructure cost without sacrificing reliability?",
    quick_answer: "→ Right-sizing: identify over-provisioned instances (CPU < 20% average) and downsize\n→ Reserved Instances / Savings Plans: commit to 1-3yr for stable baseline — 40-72% saving\n→ Spot for batch: CI/CD workers, ML training — 60-90% saving\n→ Lifecycle policies: move data to cheaper storage tiers automatically\n→ Eliminate waste: delete unused EIPs, snapshots, idle load balancers, orphaned volumes\n→ Architecture changes: caching, async offload — reduce compute and DB load",
    detailed_answer: "Cloud cost optimisation works across five categories.\n\nRight-sizing: most organisations run instances at 20–40% average CPU utilisation. A db.r5.4xlarge (16 vCPU, 128GB RAM) running at 15% CPU can often be replaced with a db.r5.2xlarge at the same utilisation. AWS Cost Explorer, GCP Recommender, and Datadog Cost Optimizer identify specific under-utilised resources. Right-sizing is the fastest win — it reduces cost immediately with no architectural change. The risk is headroom: don't right-size to peak, right-size to the 95th percentile with 30% headroom.\n\nCommitment discounts: Reserved Instances and Savings Plans reduce on-demand rates by 40–72% for stable, predictable workloads. The 1-year term is usually the right balance — 3-year commits lock you to specific instance generations that may be superseded. AWS Savings Plans apply discount to any compute (EC2, Lambda, Fargate) matching the committed spend — more flexible than RIs.\n\nEliminate waste: every cloud account accumulates zombie resources — unused Elastic IPs ($0.005/hr), unattached EBS volumes (~$0.10/GB/month), orphaned snapshots, idle NAT Gateways ($0.045/hr), and stopped instances still incurring storage cost. A monthly waste audit using AWS Cost Explorer or cloud provider tagging finds these. Enforce tagging: every resource must have an owner and cost-centre tag to enable accountability.\n\nArchitecture changes: a CDN reduces origin compute and bandwidth cost; a cache reduces database query volume; async processing shifts peak load to off-peak. These changes reduce cost multiplicatively — a cache hit costs $0.00001 vs. $0.001 for a database query — and often have reliability benefits as well.",
    key_points: [
      "Right-sizing: find instances at <20% CPU and downsize — fastest, safest win",
      "Savings Plans: 40-72% off for 1-3yr commit on predictable baseline",
      "Spot for batch workloads: 60-90% saving with checkpointing",
      "Waste audit: orphaned volumes, unused IPs, idle LBs — monthly discipline",
      "Tagging + cost allocation: accountability without tagging is impossible",
      "Architecture changes (caching, CDN, async) reduce cost and improve reliability simultaneously"
    ],
    hint: "Your cloud bill is $50,000/month and the team says 'it's all necessary.' How would you investigate whether that's true?",
    common_trap: "Right-sizing to average utilisation without headroom — average CPU 20% means spikes to 80-90% during peak. Right-size to the 95th percentile of utilisation, not the average.",
    follow_up_questions: [
      { text: "What is a FinOps practice and how does it change cloud cost culture?", type: "inline", mini_answer: "FinOps (Financial Operations) applies financial accountability to cloud spend. Teams own their cloud budget, receive real-time spend visibility, and are measured on cost efficiency alongside feature velocity. FinOps introduces shared savings (teams that reduce cost keep a portion), cost anomaly alerts, and regular engineering reviews of cloud spend. It shifts cost from a finance concern to an engineering responsibility." },
      { text: "How do you evaluate cloud cost before committing to an architecture?", type: "inline", mini_answer: "Use the cloud provider's pricing calculator (AWS Pricing Calculator, GCP Pricing Calculator) with realistic numbers: expected RPS, average object size, storage growth rate, data transfer volume. Model three scenarios: base case, 2× traffic, 10× traffic. The 10× scenario reveals which cost components scale linearly vs. which blow up. Factor in Reserved Instance discounts for stable components." }
    ],
    related: ["5.2.02", "5.4.02", "5.7.02"],
    has_diagram: false,
    has_code: false,
    tags: ["cost-optimisation", "right-sizing", "reserved-instances", "FinOps", "cloud"]
  },

  {
    id: "5.7.02",
    section: 5,
    subsection: "5.7",
    level: "intermediate",
    question: "What is data egress cost and how do you architect to minimise it?",
    quick_answer: "→ Egress: data leaving a cloud region to the internet or another cloud — ~$0.08/GB on all major providers\n→ Largest sources: CDN bypass (serving assets directly from S3/origin), cross-region replication, inter-cloud transfer\n→ Fix CDN bypass: put CloudFront/CDN in front of all outbound content\n→ Use VPC endpoints for internal AWS services — S3 and DynamoDB via gateway endpoint = free\n→ Design data to stay in the region where it is processed",
    detailed_answer: "Data egress is one of the most common cloud cost surprises. All major providers charge ~$0.08–$0.09/GB for data leaving the region to the internet (after the first 10TB/month free tier on AWS). Data transfer between regions within the same provider is ~$0.02/GB. Cross-cloud transfer costs egress on one cloud and may incur ingress on the other.\n\nThe largest egress cost sources: (1) Serving large files (images, videos, downloads) directly from S3 to end users — a CDN (CloudFront) reduces origin egress significantly. CloudFront's origin-to-edge transfer is ~$0.01/GB (80% cheaper than S3 origin to internet); edge-to-user pricing then applies on top, but is similar per-GB. (2) Cross-region replication for disaster recovery — 10TB/month replication costs ~$200/month in transfer. (3) Database dumps transferred to another cloud for analytics.\n\nArchitecture patterns to reduce egress: (1) CDN for all public content — CloudFront in front of S3 reduces the amount of data served directly from S3. (2) VPC endpoints — AWS Gateway Endpoints for S3 and DynamoDB route traffic through the AWS private network; no egress charge. Interface Endpoints for other AWS services route privately but charge per-hour. (3) Process data in the region where it lives — move compute to the data, not data to the compute. (4) Compress before transfer — gzip/brotli reduces payload 60–80%, cutting transfer cost proportionally. (5) Design for data locality in multi-region — a user's data and the compute serving them should be in the same region.",
    key_points: [
      "Egress: ~$0.08/GB to internet, ~$0.02/GB cross-region — accounts for 20-40% of many cloud bills",
      "CDN dramatically reduces egress: $0.01/GB origin-to-edge vs. $0.08/GB origin-to-internet",
      "VPC endpoints for S3/DynamoDB: free, routes on private network",
      "Move compute to data — don't transfer raw data cross-region for processing",
      "Compress before transfer: gzip reduces payload 60-80%",
      "Monitor egress with Cost Explorer: filter by 'Data Transfer' to find top consumers"
    ],
    hint: "Your S3 bucket serves 100TB/month of images to end users. The CDN is configured but bypassed by a direct S3 URL in your mobile app. What is the monthly cost of that one configuration mistake?",
    common_trap: "Ignoring egress during architecture design — a single endpoint serving large files without a CDN can generate thousands of dollars per month in egress charges that look like 'data transfer' cost.",
    follow_up_questions: [
      { text: "How does CloudFront reduce origin load and cost compared to S3 direct access?", type: "inline", mini_answer: "CloudFront caches responses at edge PoPs. A cacheable image requested by 10,000 users fetches from S3 once (origin charge) and serves from the edge 9,999 times (edge serving charge, no additional S3 origin charge). Cache-Control: max-age determines the cache duration. At a 95% cache hit rate, 95% of requests never reach S3 — reducing both S3 request cost and egress cost." },
      { text: "What is AWS PrivateLink and how does it eliminate egress cost for internal services?", type: "inline", mini_answer: "PrivateLink creates a private endpoint within your VPC that routes to another VPC service or AWS service via the AWS backbone. Traffic stays inside AWS — no internet, no egress charge. Interface Endpoints use PrivateLink technology and charge per-hour ($0.01/hr) plus data processing ($0.01/GB) — still far cheaper than internet egress for internal traffic." }
    ],
    related: ["5.7.01", "5.3.03", "5.4.02"],
    has_diagram: false,
    has_code: false,
    tags: ["egress", "cost-optimisation", "CDN", "VPC-endpoints", "data-transfer", "cloud"]
  },

  {
    id: "5.7.03",
    section: 5,
    subsection: "5.7",
    level: "advanced",
    question: "How do you implement cost allocation and showback/chargeback in a large multi-team cloud environment?",
    quick_answer: "→ Tagging: enforce mandatory tags (team, service, environment, cost-centre) via SCP/policy\n→ Accounts/projects: separate accounts per team or environment for clean boundaries\n→ Cost allocation: AWS Cost Explorer tag-based cost groups; GCP billing labels\n→ Showback: share cost reports with teams — visibility without financial penalty\n→ Chargeback: bill teams for their actual cloud spend via internal accounting",
    detailed_answer: "In organisations with dozens of teams sharing cloud infrastructure, cost accountability requires both technical infrastructure (tagging, account separation) and organisational processes (review cadence, ownership).\n\nTagging strategy: define mandatory tags applied to every resource: team (which team owns it), service (which product component), environment (production/staging/development), and cost-centre (finance codes for internal billing). Enforce via SCPs (Service Control Policies) that deny resource creation without required tags. Without enforcement, tagging compliance degrades quickly. AWS Tag Policies and GCP Label Policies enable consistent tag/label structures across an organisation.\n\nAccount/project separation: in AWS, separate accounts per team or environment (the Landing Zone pattern, implemented via AWS Control Tower or Terraform) provide hard cost boundaries. Cross-account consolidated billing still allows organisation-level cost views. Accounts are more reliable than tags for cost isolation — a resource cannot accidentally be tagged for the wrong team if it is in the right account.\n\nShowback vs. chargeback: showback means sharing cost reports with teams for visibility without consequence — teams see what they are spending but there is no financial penalty. Chargeback means actual internal accounting — teams are billed for their cloud spend via internal chargebacks, and it comes out of their departmental budget. Chargeback creates stronger incentives for efficiency but can also create dysfunctional behaviour (teams under-provision to avoid the bill). A hybrid approach: showback with quarterly targets and public league tables of cost efficiency is often more productive.",
    key_points: [
      "Mandatory tagging: team, service, environment, cost-centre — enforced via SCP",
      "Account separation: harder boundary than tags — prefer for team or environment isolation",
      "Cost Explorer + tag groups: slice cloud spend by any tag dimension",
      "Showback: visibility — teams see spend, no financial penalty",
      "Chargeback: teams pay from their budget — stronger incentive but can cause under-provisioning",
      "FinOps reviews: monthly engineering review of top spenders drives accountability"
    ],
    hint: "Three teams share the same AWS account with no tagging. The monthly bill is $200,000. How do you figure out which team is responsible for which costs?",
    common_trap: "Implementing tagging retroactively on existing resources — existing resources without tags represent a billing black hole. Enforce tags at creation time via SCP; retroactive tagging is a multi-month, error-prone project.",
    follow_up_questions: [
      { text: "How does AWS Control Tower simplify multi-account governance?", type: "inline", mini_answer: "Control Tower provides an opinionated multi-account setup: landing zone with management account, security account (audit logs, GuardDuty), log archive account, and guardrails (SCPs) enforced across the organisation. New accounts are provisioned via Account Factory with the guardrails pre-applied. It reduces the bootstrapping cost of setting up safe, governed AWS accounts from weeks to hours." },
      { text: "What is a cost anomaly and how do you detect it automatically?", type: "inline", mini_answer: "AWS Cost Anomaly Detection uses ML to learn normal spend patterns per service and alerts when actual spend deviates significantly (e.g. EC2 spend 300% above normal). GCP Budget Alerts send notifications when actual spend exceeds a threshold. Set anomaly alerts to notify the service owner within hours — a runaway Lambda or an undeleted EMR cluster can cost thousands per day undetected." }
    ],
    related: ["5.7.01", "5.1.01"],
    has_diagram: false,
    has_code: false,
    tags: ["cost-allocation", "tagging", "chargeback", "FinOps", "multi-account", "cloud"]
  },

  // ── 5.8 Infrastructure as Code ────────────────────

  {
    id: "5.8.01",
    section: 5,
    subsection: "5.8",
    level: "intermediate",
    question: "What is Infrastructure as Code (IaC), and why is it considered essential for cloud-native operations?",
    quick_answer: "→ IaC: infrastructure defined in code files, version-controlled, reviewed, and applied automatically\n→ Benefits: reproducibility (same code = same infra), auditability (git history = change log), consistency (no manual drift)\n→ Enables: ephemeral environments (spin up and tear down for testing), disaster recovery (re-apply to restore), peer review of infra changes\n→ Tools: Terraform (cloud-agnostic), AWS CloudFormation, Pulumi (general-purpose languages), CDK\n→ Anti-pattern: ClickOps — manual console changes cause drift and are unreproducible",
    detailed_answer: "Infrastructure as Code is the practice of defining cloud resources (VMs, networks, databases, IAM roles) in declarative or imperative configuration files that are version-controlled and applied automatically. The cloud console (ClickOps) is the alternative — and the source of most cloud operational debt.\n\nReproducibility: when infrastructure is code, any environment can be recreated from scratch by applying the code. This enables: ephemeral development environments (a developer spins up a full application stack for a feature branch and destroys it when done), disaster recovery (reapply the code in a new region after a catastrophic failure), and consistent environment parity between staging and production.\n\nAuditability: every infrastructure change goes through a pull request with a human review, a CI validation (terraform plan), and a git commit that records who changed what and why. Without IaC, answering 'who opened this security group rule last Tuesday?' requires CloudTrail archaeology.\n\nConsistency: manual console changes accumulate drift. Within weeks, staging no longer matches production. IaC + drift detection (terraform plan shows drift) enforces configuration consistency. Most mature organisations configure SCPs or GCP constraints that prevent direct console changes to production resources — all changes must go through the IaC pipeline.\n\nTool selection: Terraform (HashiCorp) is the most widely used, cloud-agnostic, declarative HCL — supports all major providers. AWS CDK (Cloud Development Kit) expresses CloudFormation in TypeScript, Python, or Java — better for teams that prefer general-purpose languages. Pulumi is CDK-like but fully cloud-agnostic. AWS CloudFormation and GCP Deployment Manager are native but provider-locked.",
    key_points: [
      "IaC = infrastructure in version-controlled code — reproducible, auditable, reviewable",
      "Enables: ephemeral environments, DR recovery, environment parity",
      "ClickOps creates drift, is unreproducible, and has no audit trail",
      "Terraform: cloud-agnostic, declarative, most widely adopted",
      "CDK/Pulumi: IaC in general-purpose languages — higher abstraction, less HCL",
      "Mature orgs prevent console changes to prod — all changes go through IaC pipeline"
    ],
    hint: "Your production database was accidentally deleted by a console click last Friday. How would IaC have helped — both to prevent it and to recover?",
    common_trap: "Writing IaC but still allowing console changes — drift accumulates, and the next terraform apply fails because the actual state doesn't match the code state. Enforce IaC-only changes via SCP or policy.",
    follow_up_questions: [
      { text: "What is Terraform state and what happens if it gets corrupted?", type: "inline", mini_answer: "Terraform state is a JSON file tracking what resources Terraform manages and their current configuration. It maps code declarations to real cloud resources. Corruption (or loss) means Terraform cannot reconcile code with reality — it may try to recreate existing resources or miss deletions. Store state in S3 with versioning (S3 backend) + DynamoDB locking to prevent concurrent applies and enable state recovery." },
      { text: "How do you test IaC before applying to production?", type: "inline", mini_answer: "Terraform: terraform validate (syntax), terraform plan (preview changes), terraform apply to a staging account first. Automated: Terratest (Go-based) applies to a temp account, runs assertions, and destroys. Policy-as-code: Checkov, OPA/Conftest, or Terraform Sentinel enforce security and compliance rules on plans before apply (e.g. 'all S3 buckets must have public access blocked')." }
    ],
    related: ["5.8.02", "6.1.01", "5.1.02"],
    has_diagram: false,
    has_code: false,
    tags: ["IaC", "Terraform", "Infrastructure-as-Code", "CloudFormation", "CDK", "cloud"]
  },

  {
    id: "5.8.02",
    section: 5,
    subsection: "5.8",
    level: "intermediate",
    question: "How do you structure a Terraform codebase for a large organisation with multiple teams and environments?",
    quick_answer: "→ Separate state per environment (dev/staging/prod) and per component (network, compute, data)\n→ Module library: reusable modules for common patterns (VPC, EKS cluster, RDS) — teams compose them\n→ Remote state: S3 + DynamoDB locking — never local state in production\n→ Workspaces vs. separate directories: prefer separate directories for different environments (clearer, safer)\n→ CI/CD pipeline: plan on PR, apply on merge — no manual terraform apply in production",
    detailed_answer: "A poorly structured Terraform codebase becomes a liability: a single state file covering all environments means a mistake can destroy production alongside staging. Structuring Terraform for multiple teams and environments requires careful state isolation, module reuse, and CI/CD integration.\n\nState isolation: each environment (dev, staging, prod) and each logical component (networking, EKS cluster, databases, application) should have separate state files stored in separate S3 prefixes. This limits the blast radius of a failed apply — a broken database module change only affects the database state, not the network or application. Cross-component references use terraform_remote_state data sources to read outputs from one state into another.\n\nModule library: reusable modules encapsulate common patterns — a VPC module creates the VPC, subnets, NAT gateways, and route tables with sensible defaults and configurable inputs. Teams compose modules rather than writing raw resources. The module library is version-tagged (Git tags), and consuming modules pin to specific versions to avoid unintended upgrades. This enforces organisational conventions (e.g. 'all VPCs must have 3 AZs and VPC Flow Logs enabled') without enforcement by code review.\n\nWorkspaces vs. directories: Terraform workspaces share the same code with different variable files and separate state — easier to maintain, but a mistake can switch workspace accidentally. Separate directories per environment (environments/dev/, environments/staging/, environments/prod/) are safer and more explicit — the environment is determined by the directory, not a flag. Most mature organisations prefer separate directories.\n\nCI/CD: no human should run terraform apply manually in production. A PR triggers terraform plan (output reviewed in the PR); merging to main triggers terraform apply in a separate, privileged CI environment. State locking (DynamoDB) prevents concurrent applies.",
    key_points: [
      "Separate state per environment AND per component — limit blast radius",
      "Module library: reusable, versioned modules for common patterns",
      "Remote state: S3 + DynamoDB locking — never local state for shared infra",
      "Separate directories per environment: safer than workspaces for production",
      "CI/CD: plan on PR (visible in review), apply on merge — no manual apply in prod",
      "terraform_remote_state: cross-component references without coupling state files"
    ],
    hint: "Two engineers run terraform apply simultaneously on the same state file. What can happen without DynamoDB state locking?",
    common_trap: "Using a single Terraform workspace for all environments — a workspace switch mistake or a terraform apply in the wrong context can modify or destroy production resources.",
    follow_up_questions: [
      { text: "What is Terragrunt and when would you use it over vanilla Terraform?", type: "inline", mini_answer: "Terragrunt is a thin wrapper around Terraform that adds: DRY configuration (define backend S3 bucket once, reference it everywhere), dependency management (apply modules in order based on dependency graph), and multi-module orchestration (apply all modules in an environment with one command). Use it when your Terraform codebase has significant duplication across environments and you want to manage dozens of modules." },
      { text: "How does policy-as-code (Open Policy Agent) integrate with Terraform?", type: "inline", mini_answer: "OPA/Conftest can validate Terraform plans (converted to JSON) against Rego policies before apply. Example policies: 'all S3 buckets must have server-side encryption enabled,' 'EC2 instances must have tags: team and environment,' 'no security group allows 0.0.0.0/0 on port 22.' These run in CI as a gate — the apply is blocked if policies fail." }
    ],
    related: ["5.8.01", "6.1.01", "6.7.01"],
    has_diagram: false,
    has_code: false,
    tags: ["Terraform", "IaC", "state-management", "modules", "CI-CD", "cloud"]
  },

  {
    id: "5.8.03",
    section: 5,
    subsection: "5.8",
    level: "advanced",
    question: "What is GitOps and how does it differ from traditional IaC CI/CD pipelines?",
    quick_answer: "→ GitOps: Git is the single source of truth — desired state declared in Git, operator reconciles actual state automatically\n→ Traditional IaC CI/CD: push model — pipeline runs terraform apply on merge\n→ GitOps: pull model — operator in-cluster continuously compares Git state vs. actual and applies diffs\n→ ArgoCD and Flux are the dominant GitOps operators for Kubernetes\n→ GitOps gives: continuous reconciliation (drift auto-corrected), audit trail (git = change log), rollback = git revert",
    detailed_answer: "Traditional IaC CI/CD is a push model: a human merges a PR, the CI pipeline runs terraform apply or kubectl apply, and the infrastructure is updated. If someone makes a manual change to production afterward, there is no automatic correction — the drift accumulates until the next apply.\n\nGitOps is a pull model: a Git repository contains the desired state of the system (Kubernetes manifests, Helm chart values, Terraform state intentions). An operator running in or alongside the cluster continuously watches the Git repository. When it detects a difference between what is in Git and what is running in the cluster, it automatically applies the Git state to restore convergence. Manual changes to production are detected and overwritten by the next reconciliation cycle.\n\nArgoCD and Flux are the dominant GitOps operators for Kubernetes. ArgoCD provides a UI showing current sync status (in-sync, out-of-sync, degraded) and a diff view between Git and actual state. Flux is more CLI-oriented and integrates tightly with Helm and Kustomize. Both support progressive delivery (sync in dev → manual approval → sync in prod).\n\nBenefits of GitOps: drift detection and automatic correction (a manual kubectl edit is overwritten within minutes), full audit trail (every cluster change corresponds to a Git commit with author and message), rapid rollback (git revert the commit, the operator applies the previous state), and environment promotion (promoting to production = opening a PR that updates the prod env values file).\n\nFor infrastructure (Terraform, not just Kubernetes), Atlantis provides a similar pull-request-driven workflow: terraform plan output is posted as a PR comment, and terraform apply runs from within Atlantis rather than from a CI agent — reducing credentials exposure.",
    key_points: [
      "GitOps: pull model — operator reconciles Git desired state to actual state continuously",
      "Traditional CI/CD: push model — pipeline applies on merge, then no ongoing enforcement",
      "GitOps auto-corrects drift — manual changes to production are reverted",
      "ArgoCD/Flux: dominant K8s GitOps operators; Atlantis for Terraform PR workflow",
      "Audit trail: every production change corresponds to a Git commit",
      "Rollback: git revert triggers automatic operator reconciliation to previous state"
    ],
    hint: "An engineer kubectl exec into the production cluster and manually changes a deployment config. In a GitOps setup, what happens in the next 60 seconds?",
    common_trap: "Treating GitOps as just 'CI/CD from Git' — the key distinguishing feature is the continuous reconciliation loop that corrects drift automatically, not just applying on push.",
    follow_up_questions: [
      { text: "How do you handle secrets in a GitOps workflow without storing them in Git?", type: "inline", mini_answer: "Never store plaintext secrets in Git. Options: (1) Sealed Secrets (Bitnami): encrypt secrets with a cluster public key; only the controller can decrypt — encrypted ciphertext is safe in Git. (2) External Secrets Operator: sync secrets from Vault or AWS Secrets Manager into K8s Secrets at runtime — the source of truth is the secrets manager, not Git. (3) CSI Secrets Store Driver: mount secrets directly from Vault as volume." },
      { text: "How does ArgoCD support multi-environment promotion?", type: "inline", mini_answer: "ArgoCD Application objects point to a specific Git path and a target cluster/namespace. Each environment (dev/staging/prod) has its own Application pointing to its own Git path or Helm values file. Promotion = PR to update the prod values file (image tag, replica count). A required approver merges the PR; ArgoCD detects the change and syncs prod. No credentials leave Git — ArgoCD pulls from Git, not a pipeline." }
    ],
    related: ["5.8.01", "5.8.02", "6.1.01"],
    has_diagram: false,
    has_code: false,
    tags: ["GitOps", "ArgoCD", "Flux", "IaC", "Kubernetes", "cloud"]
  },

  {
    id: "5.8.04",
    section: 5,
    subsection: "5.8",
    level: "advanced",
    question: "How do you manage drift between IaC code and actual cloud state — and what causes it?",
    quick_answer: "→ Drift: actual cloud state differs from what IaC code declares\n→ Causes: manual console changes, out-of-band automation, partial applies, manual rollbacks\n→ Detection: terraform plan shows drift (resource changes not in code); AWS Config for continuous detection\n→ Prevention: SCP/policy to block console changes to managed resources; require all changes via IaC pipeline\n→ Resolution: import actual state into Terraform (terraform import), or apply to reset to code",
    detailed_answer: "Drift is the divergence between what the IaC code declares and what is actually running in the cloud. It is one of the primary operational hazards of cloud infrastructure management.\n\nCommon causes: (1) Manual console changes — an engineer makes a quick fix via the AWS console without updating the Terraform code. (2) Out-of-band automation — a Lambda function or a third-party service modifies infrastructure directly via API. (3) Partial applies — a terraform apply partially succeeded before failing; some resources are in the new state, some remain in the old state. (4) Resource changes made by the cloud provider itself (rare but possible — provider auto-upgrades, AZ maintenance events).\n\nDetection: terraform plan compares the Terraform state file against the actual cloud API and shows differences. Running terraform plan periodically in CI (even without applying) detects drift. AWS Config with conformance packs provides continuous compliance monitoring — it detects configuration changes and flags non-compliant resources. AWS Config also integrates with CloudTrail to identify who made the change.\n\nPrevention: the only reliable prevention is blocking console changes. AWS SCPs can deny specific actions (e.g. ec2:ModifyInstanceAttribute) except when performed by the Terraform IAM role. This forces all changes through the IaC pipeline. For resources not managed by Terraform (some auto-managed resources), document them explicitly and exclude from drift monitoring.\n\nResolution: when drift is detected, two options: terraform apply to reset the resource to code state (overwriting the manual change), or terraform import to bring the actual resource configuration into the Terraform state (accepting the manual change and updating the code to match). The correct choice depends on whether the manual change was intentional.",
    key_points: [
      "Drift: actual state ≠ IaC declared state — accumulates from console changes and partial applies",
      "Detection: terraform plan (on-demand), AWS Config (continuous), drift reports in CD pipeline",
      "Prevention: SCP to block console changes on managed resources — all changes via IaC",
      "Resolution: apply (revert manual change) or import (accept and codify manual change)",
      "Terraform state is not the ground truth — the cloud API is. terraform plan refreshes state",
      "Document unmanaged resources explicitly — don't confuse them with drift"
    ],
    hint: "A security engineer opens port 443 on a security group via the console during an incident. terraform apply runs the next morning. What happens to that change?",
    common_trap: "Treating Terraform state as authoritative — state can be stale. Always run terraform plan (which refreshes state from the cloud API) before assuming the state file is accurate.",
    follow_up_questions: [
      { text: "What is terraform import and when would you use it?", type: "inline", mini_answer: "terraform import reads an existing cloud resource and adds it to Terraform state so Terraform can manage it going forward. Use when: onboarding existing infrastructure into IaC, or accepting a manual change as intentional. After import, you must write the matching HCL resource block — import only updates state, not code. terraform import is for one-time onboarding; don't rely on it regularly." },
      { text: "How does AWS Config detect and alert on configuration drift?", type: "inline", mini_answer: "AWS Config continuously records configuration snapshots of every supported resource. Conformance packs compare current config against rules (e.g. 'S3 buckets must have public access blocked'). Non-compliant changes trigger SNS notifications, EventBridge events, or SSM automation to remediate automatically. Config integrates with CloudTrail to show who made the non-compliant change." }
    ],
    related: ["5.8.01", "5.8.02", "6.7.01"],
    has_diagram: false,
    has_code: false,
    tags: ["drift", "Terraform", "IaC", "AWS-Config", "GitOps", "cloud"]
  }

];
