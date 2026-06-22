// ─────────────────────────────────────────────────
// SECTION 6 — DevOps & Platform Engineering (~24q)
// ─────────────────────────────────────────────────
const SECTION_6_QUESTIONS = [

  // ── 6.1 CI/CD Pipeline Design ────────────────────

  {
    id: "6.1.01",
    section: 6,
    subsection: "6.1",
    level: "intermediate",
    question: "What is the difference between Continuous Integration, Continuous Delivery, and Continuous Deployment?",
    quick_answer: "→ CI: every commit triggers automated build + test — fast feedback, broken builds block merging\n→ Continuous Delivery: CI + automated release packaging — every green build is releasable, deploy is a manual decision\n→ Continuous Deployment: every green build deploys to production automatically — no human gate\n→ Most orgs: CI + Continuous Delivery with manual prod approval\n→ Continuous Deployment suits teams with high test coverage, feature flags, and quick rollback",
    detailed_answer: "Continuous Integration (CI) is the practice of merging all developer code to a shared main branch frequently (multiple times per day) and running automated builds and tests on every commit. The goal is early detection of integration failures. CI requires: a shared repository, automated build, a fast test suite, and a culture of not committing broken code to main.\n\nContinuous Delivery extends CI by ensuring the software is always in a releasable state. Every green CI build produces a deployable artefact (Docker image, JAR, binary) and runs further automated validation (integration tests, contract tests, security scans). Deployment to production is a conscious business decision triggered manually, but the mechanics of that deployment are fully automated. Most organisations practise Continuous Delivery — they deploy frequently but retain a human gate before production.\n\nContinuous Deployment removes the human gate entirely: every commit that passes all automated checks is deployed to production automatically. This requires very high confidence in the test suite, feature flag capability (to decouple deployment from feature release), real-time monitoring with automated rollback, and a culture comfortable with fast iteration. Companies like Netflix, Amazon, and Facebook deploy thousands of times per day using Continuous Deployment.\n\nArchitects designing a CI/CD system must answer: what gates exist before production? What is the rollback strategy? How are database migrations handled? How are secrets injected? The pipeline design answers all of these before a single line of application code is written.",
    key_points: [
      "CI: integrate and test on every commit — fast feedback loop",
      "Continuous Delivery: every green build is releasable; deploy is a manual decision",
      "Continuous Deployment: every green build deploys automatically — no human gate",
      "Continuous Deployment requires: high test coverage, feature flags, fast rollback",
      "Most orgs: CI + Continuous Delivery with a manual prod approval step",
      "The pipeline is a product — design it with the same care as the application"
    ],
    hint: "Your team can deploy to production in 5 minutes but chooses not to deploy every commit. Is that Continuous Delivery or Continuous Deployment?",
    common_trap: "Conflating Continuous Delivery with Continuous Deployment — delivery means you can deploy on demand; deployment means you always do. The distinction matters for compliance and release management.",
    follow_up_questions: [
      { text: "What automated test types should run at each stage of a CI/CD pipeline?", type: "inline", mini_answer: "Fast gates (run on every commit, <5 min): unit tests, linting, static analysis, security SAST. Medium gates (per PR merge, <15 min): integration tests, contract tests, Docker image scan. Slow gates (pre-prod, <30 min): end-to-end tests, performance regression, DAST scan. Never block fast gates with slow tests — developers stop running them." },
      { text: "How do feature flags decouple deployment from feature release?", type: "inline", mini_answer: "Feature flags wrap new code in a conditional (if flag.enabled('new-checkout')). Deploy the code with the flag off — no user impact. Enable the flag for internal users → beta → gradual rollout. Roll back by flipping the flag off, not reverting code. LaunchDarkly, Unleash, and Split.io manage flags at runtime without redeployment." }
    ],
    related: ["6.1.02", "6.4.01", "5.8.01"],
    has_diagram: false,
    has_code: false,
    tags: ["CI", "CD", "continuous-integration", "continuous-delivery", "pipeline", "devops"]
  },

  {
    id: "6.1.02",
    section: 6,
    subsection: "6.1",
    level: "intermediate",
    question: "How do you design a CI/CD pipeline for a microservices system with 20+ services?",
    quick_answer: "→ Independent pipelines per service — no monorepo mega-build\n→ Service-level versioning: each service has its own Docker image tag (Git SHA or semver)\n→ Shared pipeline templates: reusable pipeline definitions (GitHub Actions reusable workflows, GitLab CI includes)\n→ Contract tests between services: prevent integration breakage without full end-to-end dependency\n→ Deployment orchestration: deploy services in dependency order; use ArgoCD/Flux for GitOps state",
    detailed_answer: "A monorepo pipeline that builds and deploys all 20 services on every commit is slow, expensive, and creates false coupling. The correct design is a pipeline per service that runs only when that service changes.\n\nChange detection: in a monorepo, detect which services changed (git diff against main, path-based triggers in GitHub Actions or GitLab CI). Only the changed service and its dependents rebuild. In a polyrepo, each service repo has its own pipeline — simpler but requires tooling to manage dependency updates.\n\nShared pipeline templates: define a canonical CI/CD pipeline as a reusable workflow (GitHub Actions: workflow_call; GitLab CI: include + extends). Each service's pipeline calls the template with service-specific parameters. This enforces consistent stages (lint → test → build → scan → deploy) without copy-paste maintenance across 20 repos.\n\nContract testing: when Service A calls Service B's API, an integration test that spins up Service B is slow and fragile. Consumer-driven contract tests (Pact) let Service A define its expectations of Service B; Service B's pipeline verifies it still satisfies those contracts. This catches API breaking changes without end-to-end test dependencies.\n\nDeployment strategy: each service pipeline produces a Docker image tagged with the Git SHA. The pipeline updates the Kubernetes manifest (or Helm values) in the GitOps repo with the new image tag. ArgoCD detects the Git change and applies it to the target environment. This decouples the application pipeline from the deployment mechanism and gives full audit trail via Git.",
    key_points: [
      "Per-service pipelines, not monolithic build — only build what changed",
      "Shared pipeline templates: consistent stages, no copy-paste maintenance",
      "Contract tests (Pact): verify API compatibility without full integration dependency",
      "Git SHA-tagged images: immutable, traceable artefacts per commit",
      "GitOps for deployment: pipeline writes image tag to Git; ArgoCD applies",
      "Canary/blue-green per service — independent deployment risk management"
    ],
    hint: "Service A's pipeline is blocked because Service C's integration test is flaky. What does that tell you about the pipeline design?",
    common_trap: "Running end-to-end tests against live dependent services in CI — flaky downstream services make the entire CI pipeline unreliable. Use mocks or contract tests for dependencies in unit/integration stages.",
    follow_up_questions: [
      { text: "What is Pact contract testing and how does it work?", type: "inline", mini_answer: "Pact: consumer defines its expectations (request + expected response) as a contract file. Provider runs the contract against its real implementation in its own pipeline. If the provider breaks a contract, its pipeline fails before deployment. Contracts are stored in a Pact Broker (central server). Consumer-driven: the provider knows what all consumers expect, preventing silent breaking changes." },
      { text: "How do you manage database migrations in a CI/CD pipeline for microservices?", type: "inline", mini_answer: "Each service owns its schema — no shared database. Migrations run during deployment (Flyway, Liquibase, or custom scripts) before the new application version starts. Use the expand-contract pattern: additive changes first (add column, add nullable), deploy app that works with both old and new schema, then run the contract phase (remove old column). Never run breaking schema changes before the app is updated." }
    ],
    related: ["6.1.01", "5.8.02", "4.1.01"],
    has_diagram: false,
    has_code: false,
    tags: ["CI-CD", "microservices", "contract-testing", "pipeline", "devops"]
  },

  {
    id: "6.1.03",
    section: 6,
    subsection: "6.1",
    level: "advanced",
    question: "How do you handle secrets in a CI/CD pipeline securely?",
    quick_answer: "→ Never put secrets in code or pipeline YAML — they end up in Git history and CI logs\n→ CI-native secrets: GitHub Actions Secrets, GitLab CI Variables (masked) — encrypted at rest, injected as env vars\n→ Secrets manager integration: pipeline fetches secrets from Vault/AWS Secrets Manager at runtime\n→ Short-lived credentials: OIDC federation — CI gets a token, exchanges for short-lived cloud credential (no stored keys)\n→ Audit: every secret access logged; rotate regularly; least-privilege per pipeline stage",
    detailed_answer: "Secrets in CI/CD pipelines are a major attack surface: compromised CI credentials can give an attacker access to production systems, cloud accounts, and every environment the pipeline touches. The secure design uses three principles: no long-lived credentials, no secrets in code or config, and least-privilege per stage.\n\nCI-native secret stores (GitHub Actions Encrypted Secrets, GitLab CI masked variables) encrypt secrets at rest and inject them as environment variables at runtime. They are masked in logs (the value is replaced with ***). They are suitable for low-to-medium sensitivity secrets (API keys, registry credentials) where the CI platform is trusted. The limitation: secrets are scoped to the repository or organisation, and rotation is manual.\n\nSecrets manager integration: the pipeline fetches secrets from HashiCorp Vault or AWS Secrets Manager at runtime. The pipeline only needs a Vault token or an AWS role — and only at the stage that needs the secret. This centralises rotation (one place to update), audit logging (every access logged), and versioning. The pattern: pipeline authenticates to Vault with a short-lived token, fetches the secret, uses it, discards it.\n\nOIDC federation is the gold standard for cloud credentials in CI. GitHub Actions, GitLab, and CircleCI support OIDC: the CI job gets a signed JWT from the CI provider, presents it to AWS/GCP/Azure, and receives a short-lived IAM credential (15-minute session token). No long-lived access keys are stored anywhere. AWS IAM supports this via web identity federation; GCP uses Workload Identity Federation. The result: a compromised CI pipeline cannot exfiltrate long-lived credentials because none exist.",
    key_points: [
      "Never store secrets in Git, pipeline YAML, or Docker images — they persist forever",
      "CI-native secrets: encrypted, masked in logs — sufficient for low-sensitivity secrets",
      "Vault/Secrets Manager: centralised rotation, audit log, version history",
      "OIDC federation: no stored cloud credentials — CI gets short-lived token on demand",
      "Least-privilege: each pipeline stage gets only the secrets it needs",
      "Rotate all secrets after any pipeline compromise — revoke, don't just rotate"
    ],
    hint: "A developer accidentally commits an AWS access key to a public GitHub repo. Even if you delete the commit, what must you do immediately — and why?",
    common_trap: "Treating CI-native secrets as equivalent to a secrets manager — GitHub Actions Secrets have no rotation mechanism, no audit log of access, and no versioning. For production credentials, use a secrets manager with OIDC.",
    follow_up_questions: [
      { text: "How does OIDC federation work between GitHub Actions and AWS?", type: "inline", mini_answer: "GitHub generates a signed OIDC JWT for each workflow run (claim: repository, branch, workflow). The AWS IAM trust policy allows the specific GitHub repo to assume an IAM role. The action uses aws-actions/configure-aws-credentials, which presents the JWT to AWS STS and receives a 15-minute session token. No access key is stored anywhere — the credential is ephemeral and scoped to the specific repo and branch." },
      { text: "What is secret sprawl and how do you prevent it?", type: "inline", mini_answer: "Secret sprawl: the same secret exists in multiple places (CI config, .env files, Kubernetes Secrets, developer machines) — rotation requires finding and updating all copies. Prevention: one canonical source (Vault or Secrets Manager), all consumers fetch from there at runtime. Use External Secrets Operator or Vault Agent to sync into Kubernetes Secrets automatically." }
    ],
    related: ["7.5.01", "6.7.01", "5.8.02"],
    has_diagram: false,
    has_code: false,
    tags: ["secrets", "CI-CD", "OIDC", "Vault", "security", "devops"]
  },

  {
    id: "6.1.04",
    section: 6,
    subsection: "6.1",
    level: "advanced",
    question: "How do you measure and improve the performance of a CI/CD pipeline that takes 45 minutes?",
    quick_answer: "→ Profile first: which stage takes longest? (lint, test, build, scan, deploy)\n→ Parallelise: run independent stages concurrently (unit tests + lint + security scan simultaneously)\n→ Cache aggressively: dependency cache (node_modules, Maven .m2), Docker layer cache\n→ Test optimisation: run only tests affected by changed files; split test suite across parallel runners\n→ Target: <10 min to feedback on a PR, <20 min to deploy to staging",
    detailed_answer: "A 45-minute CI/CD pipeline has real business cost: developer context-switching, slower iteration, and reduced deployment frequency. Profiling is the first step — measure each stage's duration with pipeline analytics (GitHub Actions usage reports, GitLab CI pipeline charts). The longest stage is the target.\n\nParallelisation: most pipelines run stages serially by default. Lint, unit tests, security SAST scan, and Docker build are often independent and can run simultaneously. GitHub Actions (jobs with needs), GitLab CI (parallel jobs in a stage), and Buildkite (parallel steps) all support parallel execution. This can reduce a 30-minute serial pipeline to 10 minutes with no other change.\n\nCaching: dependencies are the most common cache target. Node.js: cache node_modules keyed to package-lock.json hash. Maven/Gradle: cache ~/.m2 or ~/.gradle. Docker: use BuildKit with inline cache (--cache-from) or a registry-based cache to reuse unchanged layers. A cold Docker build of a Java service can take 8 minutes; a warm layer-cached build takes 90 seconds.\n\nTest optimisation: for large test suites, split tests across parallel runners. Jest supports --shard (--shard=1/4 runs the first quarter of tests); pytest-split does the same for Python. Alternatively, use test impact analysis (Launchable, BuildSense) to run only tests likely affected by the changed files — can reduce test execution by 70-90% with acceptable risk.\n\nTarget metrics: CI should give feedback to the developer in <10 minutes. Staging deployment should complete in <20 minutes. Production deployment (including safety checks) in <30 minutes. Anything beyond these targets erodes developer trust in the pipeline.",
    key_points: [
      "Profile first: measure each stage — don't optimise blindly",
      "Parallelise independent stages: lint + test + scan can run simultaneously",
      "Cache dependencies and Docker layers: biggest single speedup, often 3-5×",
      "Split test suite across parallel runners for large test suites",
      "Test impact analysis: run only tests affected by changed code",
      "Target: <10 min to PR feedback, <20 min to staging deploy"
    ],
    hint: "Your Docker build takes 12 minutes. The base image downloads every time. What is the single most impactful change you could make?",
    common_trap: "Optimising test count rather than parallelism — removing tests to speed up CI is a reliability trap. Add runners and parallelise; don't delete coverage.",
    follow_up_questions: [
      { text: "What is Docker BuildKit and how does it improve build performance?", type: "inline", mini_answer: "BuildKit is the next-generation Docker build engine. Key improvements: parallel execution of independent Dockerfile stages (multi-stage builds run in parallel where possible), inline cache (embed cache metadata in image layers, push to registry, reuse on next build), secret mounting (--secret flag: secrets available during build, not in image history), and SSH forwarding. Enable with DOCKER_BUILDKIT=1 or in daemon.json." },
      { text: "How do you prevent flaky tests from breaking the CI pipeline?", type: "inline", mini_answer: "Quarantine flaky tests: tag them and run separately from the main suite (don't block merges). Auto-retry: run the test 3 times; only fail if all 3 fail — filters transient flakiness. Track flake rate per test (Datadog CI Visibility, BuildPulse): tests above a flake threshold are automatically quarantined. Fix or delete chronically flaky tests — they erode trust in CI signal." }
    ],
    related: ["6.1.01", "6.1.02", "6.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["CI-CD", "pipeline-performance", "caching", "parallelism", "devops"]
  },

  // ── 6.2 Containerisation ──────────────────────────

  {
    id: "6.2.01",
    section: 6,
    subsection: "6.2",
    level: "intermediate",
    question: "What is a Docker image layer cache and how do you write a Dockerfile to maximise cache efficiency?",
    quick_answer: "→ Each Dockerfile instruction creates an immutable layer; layers are cached by instruction hash\n→ A changed layer invalidates all subsequent layers — order matters\n→ Put infrequently changing layers first (base image, OS deps, runtime)\n→ Put frequently changing layers last (application code)\n→ Combine RUN commands that belong together to reduce layer count",
    detailed_answer: "Docker images are built as a stack of immutable layers, one per Dockerfile instruction (FROM, RUN, COPY, etc.). Each layer is hashed based on the instruction and its inputs. When an instruction's hash matches a previously built layer, Docker reuses the cached layer without re-executing the instruction. When a layer's hash changes, Docker invalidates that layer and all subsequent layers — they must be rebuilt.\n\nLayer ordering is the primary optimisation lever. Instructions that change rarely should appear early in the Dockerfile; instructions that change on every commit should appear last. The canonical pattern for a Node.js application:\n\n1. FROM node:20-alpine (changes only when you upgrade Node)\n2. WORKDIR /app\n3. COPY package*.json ./ (changes only when dependencies change)\n4. RUN npm ci (reuses cache when package.json is unchanged)\n5. COPY . . (changes on every commit — copy source code last)\n6. RUN npm run build\n\nBy copying package.json before the source code, the expensive npm ci step is cached across all commits that don't change dependencies. Without this ordering, every commit reinstalls all dependencies.\n\nAdditional optimisations: use multi-stage builds to separate the build environment from the runtime image — the runtime image contains only the compiled output, not the compiler toolchain, resulting in smaller and more secure images. Use .dockerignore to exclude node_modules, test files, and .git from the build context — COPY . . with a large context is slow even with cache.",
    key_points: [
      "Each Dockerfile instruction = one layer; layers cached by instruction hash",
      "Changed layer invalidates all subsequent layers — order determines cache efficiency",
      "Dependencies before source code: COPY package.json → npm install → COPY source",
      "Multi-stage builds: separate build image from runtime image — smaller, more secure",
      ".dockerignore: exclude node_modules, .git, test files from build context",
      "Combine related RUN commands (apt-get update && install) to reduce layer count and size"
    ],
    hint: "Your Dockerfile runs npm install before copying the application source code. Why does this matter for build time on every commit?",
    common_trap: "Copying all source files before running package install — every commit invalidates the dependency cache, forcing a full npm install or pip install on every build regardless of whether dependencies changed.",
    follow_up_questions: [
      { text: "What is a multi-stage Docker build and when would you use it?", type: "inline", mini_answer: "Multi-stage: multiple FROM instructions in one Dockerfile. Stage 1 (builder): install compilers, run tests, compile code. Stage 2 (runtime): copy only compiled output from stage 1, no compiler toolchain. Result: runtime image is smaller (Java: 800MB build → 180MB runtime), has fewer attack surface packages, and faster to pull and start. Use for any compiled language (Java, Go, Rust, TypeScript)." },
      { text: "How do you scan Docker images for vulnerabilities in a CI pipeline?", type: "linked", links_to: "6.7.01" }
    ],
    related: ["6.2.02", "6.1.04", "5.2.01"],
    has_diagram: false,
    has_code: true,
    code_language: "bash",
    code_snippet: `# Layer-efficient Dockerfile for Node.js
FROM node:20-alpine AS builder
WORKDIR /app
# Dependencies first — cached unless package.json changes
COPY package*.json ./
RUN npm ci --only=production
# Source code last — cache busted on every commit
COPY src/ ./src/
RUN npm run build

# Runtime stage — only production artefacts
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]`,
    tags: ["Docker", "containers", "layer-cache", "multi-stage", "devops"]
  },

  {
    id: "6.2.02",
    section: 6,
    subsection: "6.2",
    level: "intermediate",
    question: "What are the security best practices for building and running containers in production?",
    quick_answer: "→ Non-root user: run container process as a non-root user (UID > 0)\n→ Read-only filesystem: mount root as read-only, only writable volumes where needed\n→ Minimal base image: distroless or alpine — fewer packages = smaller attack surface\n→ No secrets in image: never ENV or ARG a secret — use runtime secret injection\n→ Image scanning: scan for CVEs in CI (Trivy, Snyk, Grype) and block on critical findings",
    detailed_answer: "Containers provide process isolation, not security isolation by default. A misconfigured container running as root with excessive capabilities can escape the container or access host resources. Hardening requires deliberate choices at image build time and at runtime.\n\nNon-root user: by default, Docker containers run as root (UID 0). A vulnerability in the application with root access can escape the container or write to the host filesystem via volume mounts. Add a non-root user in the Dockerfile (RUN addgroup -S app && adduser -S app -G app; USER app) and ensure the application does not require root for any operation.\n\nMinimal base images: every package in a base image is a potential vulnerability. Alpine Linux images are ~5MB vs. ~70MB for Debian. Distroless images (Google) contain only the language runtime — no shell, no package manager, no curl — reducing attack surface to the minimum. For production Java: use gcr.io/distroless/java17. For Go: use gcr.io/distroless/static (no runtime needed for statically compiled binaries).\n\nRead-only root filesystem: run containers with --read-only (Kubernetes: readOnlyRootFilesystem: true in securityContext). Mount specific writable volumes only where the application needs to write (temp files, logs). This prevents a compromised process from writing malicious files to the container filesystem.\n\nImage scanning: integrate CVE scanning into the CI pipeline (Trivy, Snyk, Grype). Block deployment if CRITICAL or HIGH CVEs are found in the base OS or application dependencies. Enable automated base image updates (Dependabot, Renovate) so old base images with accumulated CVEs are refreshed regularly.",
    key_points: [
      "Non-root user: USER directive in Dockerfile — never run as UID 0",
      "Minimal base: Alpine or Distroless — fewer packages, smaller attack surface",
      "Read-only filesystem: readOnlyRootFilesystem: true — writable volumes only where needed",
      "No secrets in image: no ENV/ARG for secrets — use runtime injection (Vault, OIDC)",
      "CVE scanning in CI: Trivy/Snyk — block on CRITICAL findings before deployment",
      "Drop capabilities: drop ALL Linux capabilities, add back only what's needed"
    ],
    hint: "Your container runs as root because the app writes to /var/log. What is the least-invasive fix that improves security?",
    common_trap: "Treating container isolation as equivalent to VM isolation — a root process in a container with CAP_SYS_ADMIN or a hostPath volume mount can access the host. Defence in depth requires non-root, minimal capabilities, and no privileged containers.",
    follow_up_questions: [
      { text: "What are Linux capabilities and how do they apply to containers?", type: "inline", mini_answer: "Linux capabilities split root privilege into granular permissions (CAP_NET_BIND_SERVICE to bind ports <1024, CAP_SYS_PTRACE to trace processes, etc.). Docker adds a default set of ~14 capabilities. In Kubernetes: securityContext.capabilities.drop: [ALL], then add back only what is needed. This limits what a compromised process can do even if it runs as root." },
      { text: "What is a container runtime and how does containerd differ from Docker?", type: "inline", mini_answer: "Container runtime: the component that actually runs containers (creates namespaces, cgroups, starts process). Docker uses containerd as its runtime under the hood. Kubernetes deprecated the Docker shim in 1.24 — it now uses containerd or CRI-O directly (both implement CRI: Container Runtime Interface). Images built with Docker are fully compatible — OCI image format is the standard." }
    ],
    related: ["6.2.01", "6.7.01", "7.4.01"],
    has_diagram: false,
    has_code: false,
    tags: ["containers", "security", "Docker", "distroless", "CVE-scanning", "devops"]
  },

  {
    id: "6.2.03",
    section: 6,
    subsection: "6.2",
    level: "advanced",
    question: "How do you manage container image versions and promotion across environments?",
    quick_answer: "→ Tag images with Git SHA — immutable, traceable, no 'latest' in production\n→ One image, multiple environments: promote the same image (don't rebuild per env)\n→ Image registry: ECR/GCR per environment account, or shared registry with access control\n→ Promotion workflow: CI builds + tags image → deploy to dev → pass tests → promote tag to staging → approve → promote to prod\n→ Signed images: cosign (Sigstore) signs images in CI; admission controller verifies signature before running",
    detailed_answer: "Image version management is a critical but often overlooked part of the delivery pipeline. The core principle: build the image once, promote the exact same image through environments. Rebuilding per environment introduces variance — the image deployed to staging is not the same binary tested in dev, which defeats the purpose of staging.\n\nTagging strategy: tag every image with the Git SHA that produced it (e.g. myapp:a3f2b91). This is immutable and traceable — you can always find exactly which commit is running in production. The latest tag is dangerous in production: it is mutable (a new push to latest changes what gets deployed) and non-traceable (you can't tell which commit latest refers to without checking the registry). Environment tags (dev, staging, prod) can be aliases pointing to a specific SHA — they indicate where the image is deployed, not which version it is.\n\nPromotion workflow: CI builds the image from the PR commit, tags it with the SHA, and pushes to the registry. The CD system deploys this SHA to dev. After automated testing passes, the same SHA is deployed to staging. After manual approval or automated gate, the same SHA is deployed to production. No rebuild at any stage.\n\nImage signing with cosign (Sigstore) provides supply chain security: CI signs the image with a private key after building and scanning. A Kubernetes admission controller (Connaisseur, Kyverno with cosign) verifies the signature before allowing the pod to run. Unsigned images or images signed by an unknown key are rejected. This prevents an attacker who has push access to the registry from running arbitrary images in the cluster.",
    key_points: [
      "Tag with Git SHA — immutable and traceable; never use 'latest' in production",
      "One build, one image — promote the same SHA across all environments",
      "Promotion workflow: build → dev → test → staging → approve → prod",
      "Image signing (cosign/Sigstore): CI signs, admission controller verifies before running",
      "Registry access control: pull from any env, push only from CI pipeline",
      "Vulnerability re-scan before prod promotion — CVEs may have been published since CI build"
    ],
    hint: "Your staging environment passed all tests with image sha:abc123. You want to deploy to production. Should you rebuild from the same commit, or deploy sha:abc123 directly?",
    common_trap: "Using environment-specific tags (dev:latest, staging:latest, prod:latest) — these are mutable references that hide which commit is actually running and make rollback ambiguous.",
    follow_up_questions: [
      { text: "What is the SLSA framework and how does it apply to container build pipelines?", type: "inline", mini_answer: "SLSA (Supply chain Levels for Software Artifacts) is a security framework defining levels of build integrity. SLSA Level 1: build is automated (no manual commands). Level 2: builds are from version-controlled source. Level 3: builds run in an isolated, ephemeral environment with signed provenance. Level 4: hermetic builds (no network access, fully reproducible). Container pipelines target L2-L3; critical infrastructure targets L4." },
      { text: "How do you implement a rollback in a GitOps image promotion workflow?", type: "inline", mini_answer: "In a GitOps workflow, the deployment state is in Git (image tag in Kubernetes manifest or Helm values). Rollback = git revert of the commit that changed the image tag. ArgoCD/Flux detects the revert and applies the previous image tag to the cluster. This is fast, auditable, and requires no special tooling — it is just a git revert + merge." }
    ],
    related: ["6.2.01", "5.8.03", "6.7.01"],
    has_diagram: false,
    has_code: false,
    tags: ["containers", "image-promotion", "versioning", "supply-chain", "cosign", "devops"]
  },

  // ── 6.3 Container Orchestration ──────────────────

  {
    id: "6.3.01",
    section: 6,
    subsection: "6.3",
    level: "intermediate",
    question: "What does Kubernetes actually solve, and what problems does it introduce?",
    quick_answer: "→ Solves: scheduling containers across nodes, self-healing (restart failed pods), rolling deployments, service discovery, config/secret management\n→ Also solves: horizontal scaling (HPA), resource quotas, network policies, storage provisioning\n→ Introduces: significant operational complexity (etcd, API server, kubelet, CNI, CSI)\n→ Not for: simple single-service apps, teams without K8s expertise, low-traffic workloads\n→ Managed K8s (EKS, GKE, AKS) removes control plane ops but not everything",
    detailed_answer: "Kubernetes solves the container orchestration problem: given N containers that need to run, and M machines with varying available resources, schedule containers onto machines efficiently, restart them if they fail, and route traffic to healthy instances.\n\nConcrete problems Kubernetes solves: (1) Scheduling — bin-pack containers onto nodes respecting CPU/memory requests and limits, node affinity rules, and pod anti-affinity (spread replicas across AZs). (2) Self-healing — restart crashed containers, replace failed nodes, kill unresponsive containers and replace them. (3) Rolling deployments — update pods one by one (or in batches) so the service remains available during deployment. (4) Service discovery — Kubernetes Services provide a stable DNS name and virtual IP for a set of pods, even as pods are replaced. (5) Configuration management — ConfigMaps and Secrets inject configuration without baking it into the image. (6) Horizontal Pod Autoscaler — scale replica count based on CPU, memory, or custom metrics.\n\nProblems Kubernetes introduces: the control plane (etcd cluster, API server, controller manager, scheduler) must be highly available and managed. The network layer requires a CNI plugin (Calico, Cilium, WeaveNet) with its own operational surface. Storage requires CSI drivers. RBAC configuration is complex and error-prone. A typical production Kubernetes cluster has 50+ configuration surfaces that must be correctly tuned.\n\nThe sidecar pattern (referenced from 4.1.06) is a Kubernetes-native pattern: a sidecar container in the same pod handles cross-cutting concerns (logging, metrics, mTLS via Envoy) without changing the application container. Kubernetes makes sidecar injection (via admission webhooks) operational at scale — a service mesh like Istio injects Envoy sidecars into every pod automatically.",
    key_points: [
      "Solves: scheduling, self-healing, rolling deployments, service discovery, autoscaling",
      "Sidecar pattern is Kubernetes-native — injected via admission webhooks at scale",
      "Introduces: control plane complexity, CNI/CSI operational overhead, RBAC complexity",
      "Managed K8s (EKS/GKE/AKS): removes control plane ops, not everything",
      "Not the right choice for: simple apps, small teams without K8s expertise",
      "Namespaces + RBAC + NetworkPolicy: multi-tenant isolation within a cluster"
    ],
    hint: "Your team has one service with 3 replicas. A colleague suggests Kubernetes. What questions would you ask to decide if it's the right choice?",
    common_trap: "Adopting Kubernetes for the technology rather than for the problem it solves — a team with one service and low operational maturity will spend more time managing Kubernetes than it saves.",
    follow_up_questions: [
      { text: "What is the sidecar pattern in Kubernetes and how is it implemented at scale?", type: "linked", links_to: "4.1.06" },
      { text: "What is a Kubernetes operator and when would you build one?", type: "inline", mini_answer: "A Kubernetes operator extends the API with custom resources (CRDs) and a controller that implements the operational knowledge of a specific application (e.g. a PostgreSQL operator knows how to provision, failover, backup, and upgrade a Postgres cluster). Build an operator when you need to automate a complex, stateful lifecycle that the Kubernetes primitives (Deployment, StatefulSet) do not handle — e.g. database clusters, ML training jobs, distributed databases." }
    ],
    related: ["4.1.06", "6.3.02", "5.2.01"],
    has_diagram: false,
    has_code: false,
    tags: ["Kubernetes", "container-orchestration", "K8s", "sidecar", "devops"]
  },

  {
    id: "6.3.02",
    section: 6,
    subsection: "6.3",
    level: "intermediate",
    question: "How do you design Kubernetes resource requests and limits — and what happens when you get them wrong?",
    quick_answer: "→ Requests: what the scheduler uses to place the pod — guaranteed resources\n→ Limits: hard ceiling — CPU is throttled at limit; memory OOMKilled at limit\n→ Set requests = typical steady-state usage; limits = 2-3× requests for burst headroom\n→ Under-requesting: pods compete for resources, latency spikes, node overcommit\n→ Over-limiting memory: OOMKill on any spike; CPU throttling degrades p99 latency",
    detailed_answer: "Kubernetes resource requests and limits are the primary mechanism for resource management and pod scheduling. Getting them right requires understanding how each is used.\n\nRequests are guaranteed resource allocations. The scheduler uses requests to find a node with sufficient free capacity. If a node has 4 CPU cores and running pods have 3.5 CPU requested, a new pod requesting 0.6 CPU will not be scheduled on that node (even if actual usage is only 0.2 CPU). Requests are a scheduling promise, not a runtime limit.\n\nLimits are runtime ceilings. CPU limits are enforced by the Linux cgroup CPU quota — a container using more CPU than its limit gets throttled (it continues running but at reduced speed). This causes CPU throttling, which manifests as increased p99 latency. Memory limits are enforced strictly — if a container exceeds its memory limit, the kernel OOMKills the process, and Kubernetes restarts the container. An OOMKill is a hard crash.\n\nSetting values: set CPU request = steady-state usage (from metrics, not guesswork). Set CPU limit conservatively higher (2-3×) to allow burst without throttling — or omit the CPU limit entirely in performance-sensitive applications (controversial but common for latency-sensitive services). Set memory request = steady-state; memory limit = 20-30% above typical peak, accounting for spikes. Never set memory limit at exact steady-state — any GC pause or traffic spike OOMKills the pod.\n\nLimitRange and ResourceQuota: LimitRange sets default requests/limits for a namespace (prevents pods with no resource spec from running unconstrained). ResourceQuota caps total resource consumption per namespace (prevents one team from claiming all cluster capacity).",
    key_points: [
      "Requests: scheduling guarantee — node must have capacity to place the pod",
      "Limits: runtime ceiling — CPU throttled, memory OOMKilled at limit",
      "Set request = steady-state; limit = 2-3× request for burst headroom",
      "CPU throttling: container slowed but running — degrades p99 latency silently",
      "OOMKill: hard crash — set memory limit above realistic peak, not typical average",
      "LimitRange + ResourceQuota: namespace-level defaults and caps"
    ],
    hint: "Your service has CPU limit = CPU request = 1 core. During a traffic spike, CPU usage hits 1.5 cores needed. What happens to your response latency?",
    common_trap: "Setting CPU limit equal to CPU request — any traffic spike above steady-state causes CPU throttling, which increases p99 latency without any visible crash or error. It is one of the most common silent performance degradation patterns in Kubernetes.",
    follow_up_questions: [
      { text: "What is Vertical Pod Autoscaler (VPA) and how does it help with request sizing?", type: "inline", mini_answer: "VPA observes actual resource usage over time and recommends (or automatically applies) adjusted resource requests. In recommendation mode: it shows what requests should be without changing pods. In auto mode: it evicts and restarts pods with updated requests when usage drifts significantly. Useful for sizing new services where initial requests are guesses. Do not use VPA with HPA on the same metric — they conflict." },
      { text: "What is cluster overcommit and when is it acceptable?", type: "inline", mini_answer: "Overcommit: sum of all pod requests exceeds actual node capacity. Kubernetes allows this for CPU (not memory, which risks OOMKill). Acceptable if pods don't all burst simultaneously (batch workloads have staggered peaks). Risky for latency-sensitive services — pods can be throttled during a traffic spike if the node is overloaded. Use Guaranteed QoS class (request = limit) for latency-sensitive pods to prevent throttling." }
    ],
    related: ["6.3.01", "6.3.03", "3.1.04"],
    has_diagram: false,
    has_code: false,
    tags: ["Kubernetes", "resources", "requests-limits", "OOMKill", "scheduling", "devops"]
  },

  {
    id: "6.3.03",
    section: 6,
    subsection: "6.3",
    level: "advanced",
    question: "How do you implement multi-tenancy in a Kubernetes cluster — namespaces, network policies, and RBAC?",
    quick_answer: "→ Namespace per team or environment — logical isolation boundary\n→ RBAC: ClusterRoles for cluster-wide; Roles + RoleBindings for namespace-scoped\n→ NetworkPolicy: default deny all, then allow explicit ingress/egress — namespaces are NOT network-isolated by default\n→ ResourceQuota per namespace — prevent one team consuming all cluster resources\n→ LimitRange per namespace — default requests/limits for pods without explicit specs",
    detailed_answer: "Kubernetes namespaces are the primary multi-tenancy boundary, but they are a soft boundary — without additional controls, pods in different namespaces can communicate freely and compete for resources. True multi-tenancy requires layered controls.\n\nRBAC: Role and RoleBinding are namespace-scoped; ClusterRole and ClusterRoleBinding are cluster-wide. For team isolation: each team gets a namespace with a RoleBinding granting the team's group the edit role (create/delete pods, deployments, services) but not cluster-admin. The platform team holds ClusterRole access. Avoid granting cluster-wide roles to application teams — they can modify resources in other namespaces.\n\nNetwork isolation: by default, all pods in a Kubernetes cluster can reach all other pods across namespaces. NetworkPolicy is an optional, CNI-implemented firewall. The correct pattern is default-deny: apply a NetworkPolicy that denies all ingress and egress to every pod in a namespace, then add explicit allow rules for the required communication paths (this pod can talk to the database, that pod can receive traffic from the ingress controller). Without NetworkPolicy, a compromised pod in namespace A can freely reach pods in namespace B.\n\nResourceQuota: limits the total resource consumption per namespace (total CPU requested, total memory, number of pods, PersistentVolumeClaims). Without quotas, a single team's runaway deployment can exhaust cluster capacity.\n\nFor stronger isolation (different compliance zones, untrusted tenants), use separate clusters rather than namespaces. Namespace isolation is suitable for internal teams within the same organisation. Separate clusters are required when tenants have different compliance requirements (PCI-scoped workloads should not share nodes with general workloads).",
    key_points: [
      "Namespaces: soft isolation — RBAC, NetworkPolicy, and Quotas add real boundaries",
      "RBAC: namespace-scoped Roles for team access; no cluster-admin for application teams",
      "NetworkPolicy default-deny: pods are NOT network-isolated without explicit policy",
      "ResourceQuota: per-namespace resource caps — prevents noisy-neighbour capacity exhaustion",
      "LimitRange: namespace defaults for pods without resource specs",
      "Separate clusters for compliance-different tenants — namespaces are not strong enough"
    ],
    hint: "You have a PCI-compliant payment service and a general marketing service in the same Kubernetes cluster. Is namespace isolation sufficient?",
    common_trap: "Assuming namespace isolation provides network isolation — it does not without NetworkPolicy. A pod in the marketing namespace can send HTTP requests to the payment service pod by default.",
    follow_up_questions: [
      { text: "What is a service mesh and when does it replace NetworkPolicy?", type: "inline", mini_answer: "Service mesh (Istio, Linkerd, Cilium): handles mTLS between pods, traffic management (retry, circuit breaking, load balancing), and observability (per-service request metrics). AuthorizationPolicy in Istio replaces NetworkPolicy for L7 access control (allow only GET /health from pod X). Use a service mesh when you need L7 policies, mTLS, or per-request telemetry. NetworkPolicy is L3/L4 only — IP and port, not URL paths or HTTP methods." },
      { text: "How does pod security admission (formerly PodSecurityPolicy) work in modern Kubernetes?", type: "inline", mini_answer: "PodSecurityPolicy was deprecated in 1.21 and removed in 1.25. Its replacement is Pod Security Admission (PSA) — built-in, label-based enforcement. Three profiles: Privileged (no restrictions), Baseline (prevents privileged escalation), Restricted (no root, read-only fs, drop all caps). Apply per namespace with a label: pod-security.kubernetes.io/enforce: restricted. Kyverno and OPA Gatekeeper provide more granular custom policy enforcement." }
    ],
    related: ["6.3.01", "7.4.01", "7.6.01"],
    has_diagram: false,
    has_code: false,
    tags: ["Kubernetes", "multi-tenancy", "RBAC", "NetworkPolicy", "namespaces", "devops"]
  },

  {
    id: "6.3.04",
    section: 6,
    subsection: "6.3",
    level: "advanced",
    question: "How do you handle stateful workloads in Kubernetes — StatefulSets, persistent storage, and graceful shutdown?",
    quick_answer: "→ StatefulSet: stable network identity (pod-0, pod-1), ordered start/stop, PVC per pod\n→ Use for: databases, Kafka, ZooKeeper — anything with stable identity or per-instance storage\n→ PersistentVolumeClaim per pod: each replica gets its own disk, not a shared volume\n→ Graceful shutdown: SIGTERM → drain connections → SIGKILL after terminationGracePeriodSeconds\n→ Prefer managed services over self-managed stateful workloads in Kubernetes for most cases",
    detailed_answer: "Kubernetes Deployments are designed for stateless pods — any pod is interchangeable. StatefulSets add three guarantees needed for stateful workloads: stable, unique network identity (pod names are predictable: app-0, app-1, app-2), ordered deployment and scaling (app-0 must be Running before app-1 starts), and per-pod PersistentVolumeClaims (each pod gets its own named PVC that persists across pod restarts and rescheduling).\n\nPersistent storage: StatefulSet pods request storage via volumeClaimTemplates. Each pod gets a separate PVC provisioned by the StorageClass (AWS: gp3 EBS, GCP: pd-ssd). When a pod is rescheduled to a new node, Kubernetes re-attaches its PVC to the new node. PVCs survive pod deletion by default — storage is not lost when a pod crashes. EBS volumes are AZ-scoped: a rescheduled pod must land in the same AZ as its PVC (or fail). This is a subtle failure mode.\n\nGraceful shutdown is critical for databases and queues. When Kubernetes terminates a pod (rolling update, scale-in), it sends SIGTERM then waits terminationGracePeriodSeconds (default 30s) before sending SIGKILL. The application must handle SIGTERM: stop accepting new connections, drain in-flight requests, flush state, and exit cleanly. Setting terminationGracePeriodSeconds to match the application's drain time (60–300s for a database) prevents data loss.\n\nThe practical advice: running stateful workloads in Kubernetes is possible but complex. Managed services (RDS, CloudSQL, ElastiCache) are operationally simpler for databases. Use StatefulSets for workloads where a managed service is unavailable or where the team has deep expertise (e.g. self-managed Kafka when MSK limitations are blocking).",
    key_points: [
      "StatefulSet: stable pod names, ordered lifecycle, per-pod PVCs — for stateful workloads",
      "PVC per pod: each replica has its own persistent disk, survives pod restart",
      "EBS/pd-ssd is AZ-scoped: rescheduled pods must land in same AZ as their PVC",
      "SIGTERM → graceful drain → SIGKILL: set terminationGracePeriodSeconds appropriately",
      "Ordered shutdown: StatefulSet scales in from highest index — reverse of scale-out",
      "Prefer managed services — StatefulSet ops is complex; only use where managed isn't available"
    ],
    hint: "Your StatefulSet pod-0 (the Kafka controller) is on node A in AZ-1. The node fails. Kubernetes reschedules pod-0 to node B in AZ-2. What happens to the PVC?",
    common_trap: "Assuming Kubernetes will reschedule a StatefulSet pod to any node — EBS and PD volumes are AZ-scoped. The pod will remain Pending until a node becomes available in the correct AZ, which may never happen if the AZ is down.",
    follow_up_questions: [
      { text: "What is a headless service and why do StatefulSets use one?", type: "inline", mini_answer: "A headless service (clusterIP: None) does not create a virtual IP. Instead, DNS returns the individual pod IPs. StatefulSets use headless services to give each pod a stable DNS name: pod-0.my-service.namespace.svc.cluster.local. This lets Kafka brokers, Cassandra nodes, or ZooKeeper ensemble members address each other by stable name rather than by IP." },
      { text: "What is a PodDisruptionBudget and why is it required for stateful workloads?", type: "inline", mini_answer: "PodDisruptionBudget (PDB) limits how many pods of a StatefulSet can be unavailable simultaneously during voluntary disruptions (node drain, rolling update, cluster upgrade). minAvailable: 2 on a 3-replica StatefulSet ensures at least 2 replicas are always running. Without a PDB, a node drain could remove 2 Kafka broker pods simultaneously, causing partition leader elections and consumer lag." }
    ],
    related: ["6.3.01", "6.3.02", "5.5.01"],
    has_diagram: false,
    has_code: false,
    tags: ["Kubernetes", "StatefulSet", "persistent-storage", "graceful-shutdown", "devops"]
  },

  // ── 6.4 Deployment Strategies ────────────────────

  {
    id: "6.4.01",
    section: 6,
    subsection: "6.4",
    level: "intermediate",
    question: "What are the main deployment strategies (rolling, blue-green, canary) and when do you choose each?",
    quick_answer: "→ Rolling: replace pods one-by-one — zero downtime, gradual, resource-efficient\n→ Blue-Green: run two full environments, switch traffic — instant rollback, doubles resource cost\n→ Canary: send N% of traffic to new version — validate with real users before full rollout\n→ Rolling: standard for most deployments; Blue-Green: high-stakes releases; Canary: risk-sensitive features\n→ All three need feature flags for schema-breaking changes — deployment ≠ schema migration",
    detailed_answer: "Deployment strategy selection depends on risk tolerance, rollback speed requirements, and resource budget.\n\nRolling deployment (Kubernetes default): replace pods one by one (or in batches defined by maxSurge and maxUnavailable). During rollout, old and new versions coexist — both must handle the same traffic simultaneously. Zero downtime if health checks are configured correctly. Rollback is slow (roll forward then roll back). Appropriate for most deployments where old and new versions are backward-compatible.\n\nBlue-green deployment: maintain two identical environments (blue = current, green = new). Deploy new version to green, validate it, then switch the load balancer to green (or update DNS). Blue becomes the rollback target — instant rollback is a load balancer flip. Downside: doubles the resource cost during the transition. Appropriate for high-stakes releases where instant rollback capability justifies the cost, or when old and new versions cannot coexist (API version incompatibility).\n\nCanary deployment: route a small percentage of traffic (1%, 5%, 10%) to the new version while the majority continues on the old version. Monitor error rate, latency, and business metrics for the canary population. Gradually increase the percentage if metrics look healthy. Roll back by routing the canary percentage back to the old version. Appropriate for risk-sensitive features, where you want real user validation before full rollout. Requires a traffic-splitting mechanism (Istio, Argo Rollouts, AWS ALB weighted target groups).\n\nThe strangler fig integration pattern (4.4.04) often uses blue-green or canary to validate the new service before retiring the legacy component — route a small percentage to the new strangler fig service and compare results.",
    key_points: [
      "Rolling: default, zero-downtime, backward-compatible changes, slow rollback",
      "Blue-green: instant rollback, doubles resource cost — for high-stakes releases",
      "Canary: real user validation at low %, gradual rollout — for risk-sensitive features",
      "Old and new versions coexist in rolling/canary — both must be backward-compatible",
      "Schema migrations: always run separately from deployment, using expand-contract",
      "Argo Rollouts automates canary analysis — roll back automatically if error rate spikes"
    ],
    hint: "You're deploying a breaking API change. Both old and new clients exist. Which deployment strategy makes this safest, and what else do you need besides the strategy itself?",
    common_trap: "Using rolling deployment for a breaking change — during the rollout, old pods serve API v1 and new pods serve API v2. Clients routed to different pod versions get inconsistent behaviour, causing silent failures.",
    follow_up_questions: [
      { text: "How does Argo Rollouts automate canary analysis?", type: "inline", mini_answer: "Argo Rollouts is a Kubernetes controller that implements advanced deployment strategies. For canary: define the initial weight (5%), analysis template (Prometheus query: error rate < 1%, p99 latency < 200ms), and step progression (5% → 25% → 50% → 100% every 10 minutes if analysis passes). If the analysis fails at any step, Argo automatically rolls back to the previous stable version." },
      { text: "How does the strangler fig pattern use deployment strategies during migration?", type: "linked", links_to: "4.4.04" }
    ],
    related: ["4.4.04", "6.4.02", "6.1.01"],
    has_diagram: false,
    has_code: false,
    tags: ["deployment", "rolling", "blue-green", "canary", "devops"]
  },

  {
    id: "6.4.02",
    section: 6,
    subsection: "6.4",
    level: "intermediate",
    question: "How do you achieve zero-downtime deployments in Kubernetes?",
    quick_answer: "→ Readiness probe: pod only receives traffic when ready — prevents requests hitting starting pods\n→ maxSurge + maxUnavailable: control how many pods are added/removed during rollout\n→ terminationGracePeriodSeconds: allow in-flight requests to drain before pod dies\n→ PodDisruptionBudget: prevent too many pods removed simultaneously\n→ Connection draining at the load balancer: wait for active connections to close before deregistering",
    detailed_answer: "Zero-downtime deployment in Kubernetes requires coordinating four mechanisms that protect against different failure modes.\n\nReadiness probe: a Kubernetes probe that returns success only when the pod is ready to serve traffic. During startup, a pod is initialised but the application may need 10–30 seconds to warm up (load caches, establish connections). Without a readiness probe, Kubernetes adds the pod to the Service endpoints immediately, and requests arrive before the application is ready — returning errors. With a readiness probe, the pod is not added to endpoints until the probe passes. During shutdown, the pod's readiness probe fails first, removing it from endpoints before SIGTERM is sent — no new requests arrive on a terminating pod.\n\nmaxSurge and maxUnavailable (Deployment rolling update strategy): maxSurge defines how many extra pods can exist above the desired count during rollout. maxUnavailable defines how many pods can be unavailable. Setting maxSurge=1, maxUnavailable=0 means: add one new pod, wait for it to pass readiness, then remove one old pod — no reduction in serving capacity at any point.\n\nterminationGracePeriodSeconds: when a pod is being terminated, Kubernetes waits this long after SIGTERM before sending SIGKILL. Set to the maximum expected in-flight request duration (e.g. 60s for a service with 30s max-response timeout). The application must handle SIGTERM by draining: stop accepting new connections, process in-flight requests, then exit.\n\nPodDisruptionBudget prevents simultaneous removal of too many pods during voluntary disruptions (node drains, cluster upgrades).",
    key_points: [
      "Readiness probe: pod not added to Service endpoints until ready — critical for startup",
      "maxSurge=1, maxUnavailable=0: add new before removing old — no capacity reduction",
      "SIGTERM → drain in-flight requests → exit: terminationGracePeriodSeconds must match",
      "PodDisruptionBudget: prevents voluntary disruptions from removing too many pods",
      "Readiness probe must also fail on shutdown — remove pod from endpoints before SIGTERM",
      "Load balancer connection draining: deregister endpoint only after active connections close"
    ],
    hint: "Your pod receives SIGTERM and immediately exits. A request that arrived 2 seconds ago is still being processed. What happens to that request?",
    common_trap: "Setting terminationGracePeriodSeconds to the default (30s) without checking if the application actually drains in that time — a service with 45-second queries will have requests killed mid-flight on every deployment.",
    follow_up_questions: [
      { text: "What is the difference between liveness and readiness probes?", type: "inline", mini_answer: "Readiness: is this pod ready to receive traffic? Fail → removed from Service endpoints. Liveness: is this pod alive and not deadlocked? Fail → pod restarted (SIGTERM + SIGKILL). A deadlocked pod may pass readiness (port is open) but fail liveness (no response within timeout). Use liveness only for true deadlock detection — too-sensitive liveness probes cause restart loops during CPU spikes." },
      { text: "How do you handle long-running WebSocket or gRPC streaming connections during a rolling deployment?", type: "inline", mini_answer: "Long-lived connections must be drained gracefully on SIGTERM. For WebSocket: send a close frame with code 1001 (Going Away) so clients reconnect. For gRPC: send GOAWAY frame to signal the server is shutting down — clients stop sending new streams and reconnect. The terminationGracePeriodSeconds must be long enough for all active streams to complete or reconnect." }
    ],
    related: ["6.4.01", "6.3.02", "3.3.01"],
    has_diagram: false,
    has_code: false,
    tags: ["zero-downtime", "deployment", "readiness-probe", "Kubernetes", "rolling-update", "devops"]
  },

  // ── 6.5 SRE ──────────────────────────────────────

  {
    id: "6.5.01",
    section: 6,
    subsection: "6.5",
    level: "intermediate",
    question: "What is Site Reliability Engineering (SRE) and how does it differ from traditional operations?",
    quick_answer: "→ SRE: software engineers applying engineering to operations — toil elimination, automation, reliability measurement\n→ Traditional ops: manual, reactive, 'keep the lights on' — changes are risky\n→ SRE key concepts: SLOs, error budgets, toil measurement, blameless post-mortems\n→ Error budget: the mechanism that balances reliability vs. feature velocity\n→ SRE embeds with dev teams — shared ownership of production",
    detailed_answer: "SRE was invented at Google and described in the SRE Book (2016). The core idea: hire software engineers to run operations, and give them the mandate to automate their way out of operational work. Traditional ops teams resist change (every change is a risk to stability). SRE teams embrace change as long as it stays within the error budget.\n\nSLOs and error budgets are the central mechanism. The team defines Service Level Objectives (e.g. 99.9% request success rate). The error budget is 0.1% — the team can 'spend' this on incidents, risky deployments, and experiments. When the error budget is healthy, the team deploys aggressively. When the budget is nearly exhausted, deployments freeze until it replenishes. This creates a shared incentive: development wants to deploy, SRE wants to protect reliability — the error budget makes the trade-off explicit and quantified.\n\nToil is any manual, repetitive operational work that scales with service size — on-call alerts, manual rollbacks, manual scaling. SRE teams measure toil and commit to reducing it below 50% of working time through automation. Toil that can't be eliminated is tracked as technical debt.\n\nBlameless post-mortems: when an incident occurs, the SRE discipline analyses the systemic causes without attributing blame to individuals. The output is a set of action items that reduce the probability or impact of recurrence. This creates a learning culture rather than a blame culture.\n\nSRE embeds with product teams (typically 1 SRE to 6 developers) and participates in design reviews, capacity planning, and production readiness reviews.",
    key_points: [
      "SRE = software engineers running operations with an automation mandate",
      "Error budget: quantifies the acceptable reliability spend — balances reliability vs. velocity",
      "Toil: manual, repetitive ops work — SREs commit to keeping it below 50%",
      "Blameless post-mortems: systemic analysis, not individual blame",
      "SREs embed with dev teams — shared production ownership",
      "SRE works at Google scale; adapt the practices, not the headcount ratio, at smaller scale"
    ],
    hint: "Your error budget is 90% consumed with 2 weeks left in the month. A developer wants to deploy a risky change. What does SRE practice say to do?",
    common_trap: "Treating SRE as a renamed ops team without changing the culture — SRE without blameless post-mortems, error budgets, and toil reduction is just traditional ops with different job titles.",
    follow_up_questions: [
      { text: "What is a production readiness review (PRR) and what does it check?", type: "inline", mini_answer: "PRR: structured review before a new service goes to production, run by SRE with the development team. Checks: SLOs defined and instrumented, runbooks written, on-call escalation path defined, load testing done, capacity plan in place, secrets management correct, graceful shutdown implemented, dependencies documented. Passing the PRR gates production launch — it is not bureaucracy, it is a checklist of learnable failure modes." },
      { text: "How do you measure and reduce toil in an SRE team?", type: "inline", mini_answer: "Track toil by time-boxing: weekly survey asking engineers to categorise their work (toil vs. project vs. overhead). Toil > 50% is the threshold requiring action. Prioritise toil reduction as project work: auto-remediation scripts (runbook → code), self-service tooling (developers restart their own pods via a UI), and alert tuning (noisy alerts contribute to toil even when they don't require action)." }
    ],
    related: ["3.2.02", "3.6.03", "6.5.02"],
    has_diagram: false,
    has_code: false,
    tags: ["SRE", "error-budget", "toil", "post-mortem", "SLO", "devops"]
  },

  {
    id: "6.5.02",
    section: 6,
    subsection: "6.5",
    level: "intermediate",
    question: "How do you run an effective on-call rotation and incident response process?",
    quick_answer: "→ On-call: rotation with backup, clear escalation path, off-hours alerts only for P1\n→ Incident severity: P1 (service down) → P2 (degraded) → P3 (elevated error, no impact) → P4 (cosmetic)\n→ Incident response: declare → page → triage → mitigate (restore service) → fix root cause → post-mortem\n→ Runbooks: pre-written, executable, linked from every alert\n→ Mitigate first, investigate later — restore service before finding root cause",
    detailed_answer: "Effective on-call begins with design decisions: if the system requires human intervention multiple times per night, the system needs to be improved, not the on-call engineer's resilience. The goal is to make on-call boring.\n\nSeverity classification: every incident must be classified at declaration. P1 (critical: complete service outage, data loss, security breach) triggers immediate all-hands response. P2 (significant: major feature unavailable, significant error rate increase) triggers on-call team response. P3 (minor: elevated error rate below SLO impact, latency degradation not breaching SLO) is handled during business hours. P4 is a ticket. Only P1 and P2 justify waking someone up.\n\nIncident response phases: (1) Declare: someone declares an incident, opens a war room (Zoom/Slack incident channel), and assigns roles. (2) Incident commander: one person coordinates communication, not debugging. They ensure tasks are delegated, stakeholders are updated, and the team doesn't go down rabbit holes. (3) Triage: identify the impact and the probable cause. (4) Mitigate: restore service first — roll back, redirect traffic, increase capacity, disable a feature. Mitigation ends the customer impact. (5) Investigate: root cause analysis after service is restored. (6) Post-mortem: within 48 hours, document the timeline, contributing factors, and action items.\n\nRunbooks must be executable, not philosophical. A runbook that says 'check the logs' is not useful at 3 AM. A runbook that says 'run: kubectl logs -n payments -l app=payment-service | grep ERROR | tail -50' and documents what each error pattern means is actionable.",
    key_points: [
      "On-call should be boring — multiple overnight pages means the system needs improvement",
      "Severity levels: P1 (all-hands, now) through P4 (ticket, business hours)",
      "Incident commander: coordinates, doesn't debug — separation of roles is critical at P1",
      "Mitigate first (restore service), investigate after — don't debug a burning building",
      "Runbooks: executable commands, not vague instructions — tested quarterly",
      "Post-mortem within 48 hours: timeline, contributing factors, action items with owners"
    ],
    hint: "During a P1 incident, both engineers on the call are debugging the database. Nobody is communicating to stakeholders or checking if the issue has spread. What role is missing?",
    common_trap: "Starting root cause analysis before service is restored — the customer impact continues while the team investigates. Roll back, redirect, or degrade first; investigate on a stable system.",
    follow_up_questions: [
      { text: "What makes a good post-mortem action item?", type: "inline", mini_answer: "Good action item: specific, assigned to a named owner, has a due date, and is tracked in a project management tool. 'Improve monitoring' is a bad action item. 'Add a Prometheus alert for payment service error rate > 1% for 5 minutes, owned by @alice, due next sprint' is a good action item. Close the loop: review action item completion at the next on-call review." },
      { text: "How do you prevent on-call burnout?", type: "inline", mini_answer: "Measure: track pages per on-call shift (target < 5 per week that require action). Automate: convert manual on-call responses into auto-remediation. Alert quality: audit and remove alerts that consistently don't require action. Compensation: on-call pay or time off in lieu. Rotation size: minimum 5 people in rotation — 1 in 5 weeks on-call, not 1 in 3." }
    ],
    related: ["6.5.01", "3.6.03", "3.3.04"],
    has_diagram: false,
    has_code: false,
    tags: ["on-call", "incident-response", "SRE", "post-mortem", "runbooks", "devops"]
  },

  // ── 6.6 Platform Engineering ──────────────────────

  {
    id: "6.6.01",
    section: 6,
    subsection: "6.6",
    level: "intermediate",
    question: "What is Platform Engineering and how does it differ from traditional DevOps?",
    quick_answer: "→ DevOps: developers own operations — 'you build it, you run it'\n→ Platform Engineering: build an Internal Developer Platform (IDP) — golden paths for deploying, monitoring, and securing services\n→ IDP abstracts K8s, Terraform, and cloud complexity behind a developer-friendly interface\n→ Platform team is a product team — the developer is the customer\n→ Goal: reduce cognitive load on developers while maintaining operability standards",
    detailed_answer: "DevOps (popularised by Atlassian and Google) pushes operational responsibility to development teams: you build it, you run it. This reduced handoff time and improved accountability, but created a new problem at scale: developers in 50-team organisations spend 20-40% of their time on infrastructure configuration, security compliance, and platform tooling rather than product development.\n\nPlatform Engineering responds by creating an Internal Developer Platform (IDP): a curated set of capabilities and golden paths that abstract infrastructure complexity. Instead of every team writing Terraform for a new service (and getting it subtly wrong each time), the platform team provides a self-service template: 'create a new service' triggers a pipeline that provisions EKS namespace, Helm chart, IAM roles, database, monitoring dashboards, and on-call rotation — all compliant by default.\n\nThe platform team operates like a product team: they interview internal developer customers, measure developer experience metrics (DORA metrics: deployment frequency, lead time for changes, change failure rate, MTTR), and iterate on the platform. The platform is a product — if developers don't use it voluntarily, it has failed.\n\nKey components of an IDP: service catalogue (Backstage by Spotify — component registry with ownership, documentation, and runbook links), self-service provisioning (Crossplane, Backstage scaffolder — create new services from templates), standardised CI/CD (shared pipeline templates), observability defaults (OpenTelemetry auto-instrumentation, default dashboards), and security guardrails (OPA policies, image signing enforcement).",
    key_points: [
      "Platform Engineering = build an IDP that reduces developer cognitive load",
      "Golden paths: opinionated, pre-approved ways to deploy, observe, and secure services",
      "Platform team is a product team — developer is the customer; adoption is voluntary",
      "IDP components: service catalogue (Backstage), self-service provisioning, shared pipelines",
      "DORA metrics measure platform impact: deployment frequency, lead time, MTTR",
      "Guardrails by default: compliance built in, not bolted on"
    ],
    hint: "Your platform team built a Kubernetes deployment template. Two teams use it, fifteen write their own. What does that adoption rate tell you about the template?",
    common_trap: "Building a platform and mandating its use without making it better than alternatives — platforms succeed through superior developer experience, not through mandate. If the golden path is slower than doing it manually, developers will go around it.",
    follow_up_questions: [
      { text: "What is Backstage and what problem does it solve?", type: "inline", mini_answer: "Backstage (Spotify, now CNCF) is an open-source Internal Developer Portal. It provides: a service catalogue (every service registered with owner, runbook, CI status, SLO), software templates (scaffolding new services from templates), and tech documentation (TechDocs — Markdown in the repo, rendered in Backstage). It solves 'where is the thing I need?' across large engineering organisations." },
      { text: "What are DORA metrics and how do they measure DevOps/Platform maturity?", type: "inline", mini_answer: "DORA (DevOps Research and Assessment) four key metrics: Deployment Frequency (how often you deploy to prod — elite: multiple/day), Lead Time for Changes (commit to prod — elite: <1hr), Change Failure Rate (% of deploys causing incidents — elite: <5%), MTTR (time to restore service — elite: <1hr). High performers on all four have 127× more frequent deployments and 2,604× faster MTTR than low performers." }
    ],
    related: ["6.1.01", "5.8.03", "6.6.02"],
    has_diagram: false,
    has_code: false,
    tags: ["platform-engineering", "IDP", "DevOps", "Backstage", "DORA", "devops"]
  },

  {
    id: "6.6.02",
    section: 6,
    subsection: "6.6",
    level: "advanced",
    question: "How do you design self-service infrastructure provisioning for developers without sacrificing security or compliance?",
    quick_answer: "→ Templates with guardrails: pre-approved infrastructure patterns (VPC, EKS namespace, RDS) — developers choose options, platform enforces constraints\n→ Policy-as-code gates: OPA/Checkov validates every Terraform plan before apply\n→ Separate accounts per team: hard blast radius boundary, costs isolated\n→ Least-privilege by default: IAM roles scoped to the service's namespace and resources\n→ Audit trail: all provisioning through CI (not console) — Git is the audit log",
    detailed_answer: "Self-service provisioning lets developers create infrastructure without filing tickets, but naively granting broad cloud access creates security and compliance risks. The solution is paved-road provisioning: developers choose from a curated menu of pre-approved options; the platform enforces mandatory constraints.\n\nTemplate approach: the platform team maintains a library of Terraform modules or Backstage templates for common patterns — a 'new web service' template provisions: EKS namespace with RBAC, Helm chart scaffold, RDS PostgreSQL with encryption and automated backups, IAM role with least-privilege (only access to its own database and S3 prefix), Prometheus ServiceMonitor for observability, and a GitHub Actions pipeline. The developer provides: service name, team name, database size, and replica count. Everything else is decided by the template — encryptions, backup retention, network policy, VPC placement.\n\nPolicy-as-code gates: every Terraform plan (generated by the platform template) runs through Checkov and OPA/Conftest validation before apply. Policies enforce: 'all RDS instances must have backup retention >= 7 days,' 'no security groups with 0.0.0.0/0 inbound,' 'all resources must have team and service tags.' Violations block the provisioning pipeline.\n\nAccount separation: the platform team manages AWS accounts via AWS Control Tower or Terraform. Each team gets a dedicated AWS account with a spending limit and Service Control Policies pre-applied. Developers have permissions to create resources in their account but not to modify the SCPs or escape the guardrails.\n\nThis model achieves: developer autonomy (self-service, no ticket queue), security compliance (guardrails enforced at plan time, not after the fact), and operational consistency (all services look the same, have the same defaults).",
    key_points: [
      "Templates: curated options + enforced constraints — paved road, not open field",
      "Policy-as-code (OPA/Checkov): validate every Terraform plan before apply",
      "Account isolation: separate AWS account per team — hard blast radius and cost boundary",
      "Least-privilege IAM: generated automatically by template, scoped to service's resources",
      "All provisioning via CI: console changes blocked by SCP — Git is the audit trail",
      "Platform as guardrails: make compliant the path of least resistance"
    ],
    hint: "A developer wants to open a security group to 0.0.0.0/0 for debugging. Should the platform block this immediately, or allow it with an audit trail?",
    common_trap: "Giving developers AdministratorAccess in their account to 'move fast' — they will create insecure resources, and cleaning up is much harder than preventing. Guardrails at provisioning time are far cheaper than remediation.",
    follow_up_questions: [
      { text: "What is Crossplane and how does it enable self-service provisioning from within Kubernetes?", type: "inline", mini_answer: "Crossplane extends Kubernetes with Composite Resource Definitions (XRDs) and providers. A developer creates a Kubernetes YAML resource (e.g. kind: PostgreSQLInstance) and Crossplane's provider translates it into an actual AWS RDS instance via the AWS API. The developer interacts only with Kubernetes — no Terraform, no AWS console. The platform team defines the XRD with guardrails (min 7-day backup, encryption mandatory)." },
      { text: "How do you prevent configuration drift after self-service provisioning?", type: "linked", links_to: "5.8.04" }
    ],
    related: ["5.8.01", "6.1.03", "7.4.01"],
    has_diagram: false,
    has_code: false,
    tags: ["platform-engineering", "self-service", "policy-as-code", "IaC", "security", "devops"]
  },

  // ── 6.7 DevSecOps ────────────────────────────────

  {
    id: "6.7.01",
    section: 6,
    subsection: "6.7",
    level: "intermediate",
    question: "What is DevSecOps and how do you shift security left in a CI/CD pipeline?",
    quick_answer: "→ DevSecOps: security integrated into every stage of the pipeline, not a separate review at the end\n→ SAST: static analysis of code (Semgrep, CodeQL) — runs in CI on every commit\n→ SCA: software composition analysis (Dependabot, Snyk) — audit open-source dependency CVEs\n→ Container scan: Trivy/Grype on every built image — block on CRITICAL CVEs before push\n→ DAST: dynamic testing against running app (OWASP ZAP) — pre-prod gate\n→ IaC scan: Checkov/tfsec on every Terraform plan — catch misconfigurations before apply",
    detailed_answer: "Traditional security reviews happen at the end of the development cycle — a security team audits the finished application before release. This is expensive: vulnerabilities discovered late require rework, and the review is a bottleneck. DevSecOps integrates security at every pipeline stage so vulnerabilities are caught where they are cheapest to fix: in development.\n\nStage 1 — Development (IDE): IDE plugins (Snyk, SonarLint) provide real-time feedback on security issues as code is written. Pre-commit hooks run fast security checks (secrets detection with git-secrets or detect-secrets) before code reaches the repository.\n\nStage 2 — Commit / PR: SAST (Static Application Security Testing) analyses source code for vulnerabilities without executing it. Semgrep and CodeQL run in minutes and detect patterns like SQL injection, XSS, insecure deserialization, and hardcoded credentials. SCA (Software Composition Analysis) audits open-source dependencies for known CVEs — Dependabot automatically opens PRs to update vulnerable packages.\n\nStage 3 — Build: container image scanning (Trivy, Grype, Snyk Container) scans the built image for OS-level CVEs and application dependency vulnerabilities. Block the pipeline if CRITICAL or HIGH CVEs are found in the final image. IaC scanning (Checkov, tfsec) validates Terraform and CloudFormation for misconfigurations before infrastructure is provisioned.\n\nStage 4 — Pre-prod: DAST (Dynamic Application Security Testing) runs automated attack tools (OWASP ZAP) against a running instance of the application, finding vulnerabilities that only manifest at runtime (authentication bypass, session management issues).\n\nDevSecOps is in Section 6.7 because it is about security in the pipeline and operational controls — the security architecture (OAuth, mTLS, zero trust) lives in Section 7.",
    key_points: [
      "Shift left: find vulnerabilities where they are cheapest to fix — in development",
      "SAST: static code analysis (no execution) — Semgrep, CodeQL — fast, runs on every PR",
      "SCA: dependency CVE audit — Dependabot, Snyk — automated PR updates",
      "Container scan: Trivy/Grype on built image — block on CRITICAL before push",
      "IaC scan: Checkov/tfsec on Terraform plans — catch misconfigurations before apply",
      "DAST: runtime attack testing — OWASP ZAP — pre-prod gate, slower"
    ],
    hint: "A developer commits a file containing a database password. At what pipeline stage would each of the following catch it: SAST, SCA, container scan, DAST?",
    common_trap: "Adding security tools to the pipeline but not acting on their findings — tools that always report issues developers learn to ignore. Triage findings, set a baseline, and only enforce findings above the severity threshold you commit to fixing.",
    follow_up_questions: [
      { text: "What is secrets detection in CI and what tools implement it?", type: "inline", mini_answer: "Secrets detection scans git commits or staged files for patterns matching secrets (API keys, database passwords, private keys). Tools: detect-secrets (Yelp), git-secrets (AWS), truffleHog, Gitleaks. Run as a pre-commit hook (developer-side) and as a CI job (pipeline-side). GitHub Advanced Security includes secret scanning with push protection — blocks pushes containing known secret patterns." },
      { text: "How do you handle false positives from SAST tools without eroding security discipline?", type: "inline", mini_answer: "Create a triage process: each finding is reviewed and marked as true positive (fix), false positive (suppress with comment explaining why), or accepted risk (document and track). Use suppression comments in code (# nosec, // noqa) with mandatory explanations. Review accepted risks quarterly. Never suppress all findings from a file — it defeats the tool. Track suppression rate; a high rate means the tool is misconfigured." }
    ],
    related: ["6.1.03", "7.3.01", "7.7.01"],
    has_diagram: false,
    has_code: false,
    tags: ["DevSecOps", "SAST", "SCA", "container-scanning", "shift-left", "security", "devops"]
  },

  // ── 6.8 Observability Implementation ─────────────

  {
    id: "6.8.01",
    section: 6,
    subsection: "6.8",
    level: "intermediate",
    question: "How do you implement the OpenTelemetry observability stack in a Kubernetes environment?",
    quick_answer: "→ Instrument: OpenTelemetry SDK in each service → emit traces, metrics, logs\n→ Collect: OpenTelemetry Collector (DaemonSet or Deployment) receives signals, batches, exports\n→ Backends: Tempo (traces), Prometheus (metrics), Loki (logs) — all integrated in Grafana\n→ Auto-instrumentation: OTel operator injects agent without code changes (Java, Python, Node)\n→ Correlation: trace ID propagated via HTTP headers ties metrics → logs → traces together",
    detailed_answer: "The OpenTelemetry observability stack has a standard Kubernetes deployment pattern. The components are: SDK (in each service), Collector (infrastructure layer), and backends (storage and query).\n\nSDK instrumentation: each service uses the OTel SDK for its language (Java, Python, Go, Node.js). The SDK captures: traces (spans per request, including HTTP calls to dependencies), metrics (request count, error rate, latency histograms in OTLP format), and structured logs with trace context (trace ID, span ID injected into each log line for correlation). For services where adding the SDK is not feasible, the OTel Operator for Kubernetes can inject auto-instrumentation as a sidecar without code changes.\n\nOpenTelemetry Collector: a vendor-neutral agent deployed as a DaemonSet (one per node) or a central Deployment. It receives OTLP signals from application pods, applies transformations (attribute enrichment, sampling), batches for efficiency, and exports to backends. The Collector decouples the application from the backend — change backends without changing application code.\n\nBackends (the Grafana LGTM stack is now common): Loki for logs (label-based, cost-efficient), Grafana Tempo for traces (cost-efficient, integrates with Prometheus metrics and Loki logs via exemplars), and Prometheus/Mimir for metrics (time-series). Grafana provides a unified query interface across all three signals with correlation via trace ID.\n\nTrace correlation is the key value: when an alert fires for high error rate (Prometheus metric), click through to a sample trace (Tempo), click through to the log lines from that trace (Loki via trace ID). This reduces mean time to diagnosis from hours to minutes.",
    key_points: [
      "OTel SDK: instrument once, export to any backend — vendor-neutral standard",
      "OTel Operator: auto-instrument Java/Python/Node pods without code changes",
      "Collector: DaemonSet, receives OTLP, transforms, batches, exports — decouples app from backend",
      "Grafana LGTM: Loki + Grafana + Tempo + Mimir — full open-source stack",
      "Trace ID in logs: correlate metric alert → trace → log line automatically",
      "Sampling: head-based (sample at trace start) vs. tail-based (sample after seeing outcome)"
    ],
    hint: "Your service emits OpenTelemetry traces directly to Jaeger. You want to switch to Tempo without changing application code. What needs to change?",
    common_trap: "Instrumenting services to export directly to a backend (Jaeger endpoint, Datadog agent) — when you change backends, you change every service. Always route through the OTel Collector, which handles backend switching in one configuration change.",
    follow_up_questions: [
      { text: "What is tail-based sampling and when would you use it over head-based sampling?", type: "inline", mini_answer: "Head-based sampling: the decision to trace is made at the start of the request — fast, low overhead, but you sample good and bad requests equally, missing rare errors. Tail-based sampling: the Collector buffers complete traces, then decides to keep based on the outcome (errors, high latency, business rules). Keeps 100% of error traces, samples normal traces aggressively. Use tail-based for SLO-critical services where every error trace is valuable." },
      { text: "How do you implement distributed tracing across synchronous and asynchronous service calls?", type: "inline", mini_answer: "Synchronous (HTTP/gRPC): OTel propagates trace context via W3C TraceContext headers (traceparent, tracestate) automatically when using the SDK. Asynchronous (Kafka, SQS): inject trace context into message headers when producing; extract and link when consuming. The consumer creates a new span linked to the producer span — the trace spans the async boundary. OTel messaging conventions define standard header names." }
    ],
    related: ["3.6.01", "3.6.02", "6.8.02"],
    has_diagram: false,
    has_code: false,
    tags: ["observability", "OpenTelemetry", "Kubernetes", "Grafana", "traces", "devops"]
  },

  {
    id: "6.8.02",
    section: 6,
    subsection: "6.8",
    level: "advanced",
    question: "How do you design a cost-efficient logging strategy at scale — avoiding the log-everything anti-pattern?",
    quick_answer: "→ Log at the right level: INFO for business events, WARN for recoverable issues, ERROR for failures — not DEBUG in production\n→ Structured logs (JSON): filterable, indexable — plain text is unsearchable at scale\n→ Tiered storage: hot (7-30 days, fast search) → cold (90-365 days, compressed, slow retrieval)\n→ Sample DEBUG logs: 1% sampling in production for verbose paths\n→ Log aggregation cost: Datadog charges by ingested GB — selective logging is cost engineering",
    detailed_answer: "Logging at scale has a significant cost dimension: Datadog logs, Splunk, and Elastic all charge by volume ingested. A service logging 1MB/s generates 86GB/day — at $0.10/GB ingested, that is $8,600/month for one service. Naive 'log everything' patterns are the most common source of surprise observability bills.\n\nLog level discipline: production services should log at INFO or above. DEBUG logs are invaluable during development but generate enormous volume in production. The pattern: default to INFO in production, allow DEBUG to be enabled dynamically (via a feature flag or log level API endpoint) for specific services when debugging an incident, then reset to INFO. Never deploy with DEBUG enabled indefinitely.\n\nStructured logging: every log line should be JSON (or equivalent structured format) with consistent fields: timestamp, log_level, service, trace_id, span_id, and a message. The trace_id field enables correlation between log lines and distributed traces. Unstructured text logs require expensive regex parsing in the log aggregation layer.\n\nTiered storage: Loki (Grafana) and Splunk support tiered retention: recent logs (7-30 days) in hot storage (SSD-backed, fast query); older logs in cold storage (S3/GCS, compressed, slower retrieval). For compliance, retain raw logs for 1-7 years in cold storage at a fraction of hot storage cost.\n\nSelective logging: not every request needs a full log entry. For high-volume, low-risk operations (health check endpoints, CDN cache hits), log only errors. Use sampling for verbose paths (1-5% of DEBUG logs). Log aggregation at the Collector (OTel Collector or Fluent Bit) can apply filter and sampling rules before logs reach the expensive backend.",
    key_points: [
      "Production: INFO and above — DEBUG generates enormous volume at high RPS",
      "Dynamic log level: change to DEBUG at runtime for incident investigation, reset after",
      "Structured JSON logs: consistent fields (trace_id, service) enable efficient querying",
      "Tiered retention: hot (fast, expensive, short) → cold (slow, cheap, long)",
      "Sample verbose paths: 1-5% sampling for high-volume, low-signal log lines",
      "Log cost = ingested volume — filter and sample at the Collector, before the backend"
    ],
    hint: "Your service processes 50,000 requests per second. If each request logs 5 lines at DEBUG level (200 bytes each), how much data per day? What does that cost in Datadog?",
    common_trap: "Logging request and response bodies for every API call — at any significant scale, this logs PII (GDPR violation), generates enormous volume, and the data is rarely queried. Log headers and status codes; log bodies only for errors, with PII fields masked.",
    follow_up_questions: [
      { text: "How does Fluent Bit differ from the OpenTelemetry Collector for log collection?", type: "inline", mini_answer: "Fluent Bit (CNCF): lightweight, purpose-built for log collection and forwarding. Low memory (<50MB), plugin-based, excellent for K8s pod log scraping (reads /var/log/containers). OTel Collector: multi-signal (logs, metrics, traces), heavier but unified. For logs-only workloads, Fluent Bit is more resource-efficient. For unified OTel pipelines, the Collector handles all signals. Many orgs run both: Fluent Bit for logs, OTel Collector for traces and metrics." },
      { text: "How do you handle logging for a multi-tenant SaaS without mixing tenant data?", type: "inline", mini_answer: "Add a tenant_id field to every log line (from the auth context). At the log aggregation layer, apply tenant-based access control (Grafana Loki's label-based multi-tenancy, Datadog Sensitive Data Scanner). Never log sensitive tenant data (PII, API keys, payment details) — log identifiers (tenant_id, user_id) not values. For compliance, ensure tenant A cannot query tenant B's logs even if they share the same Loki instance." }
    ],
    related: ["3.6.01", "6.8.01", "5.7.01"],
    has_diagram: false,
    has_code: false,
    tags: ["logging", "observability", "structured-logs", "cost", "Loki", "devops"]
  }

];
