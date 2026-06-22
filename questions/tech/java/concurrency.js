// questions/tech/java/concurrency.js
// Java bank → Concurrency section (pilot). Slim tech schema:
//   required: id, section, subsection, level, question, quick_answer
//   optional: detailed_answer, key_points, common_trap, tags,
//             has_code + code_language + code_snippet
// Slug ids (java.concurrency.NN); banks never cross-link to architect.

const JAVA_CONCURRENCY = {
  section: { id: "java.concurrency", title: "Concurrency", icon: "🧵", color: "#7C6FFF" },

  subsections: [
    { id: "java.concurrency.threads",     section: "java.concurrency", title: "Threads & Lifecycle" },
    { id: "java.concurrency.sync",        section: "java.concurrency", title: "Synchronization & Locks" },
    { id: "java.concurrency.executors",   section: "java.concurrency", title: "Executors & Thread Pools" },
    { id: "java.concurrency.collections", section: "java.concurrency", title: "Concurrent Collections & Atomics" },
    { id: "java.concurrency.memory",      section: "java.concurrency", title: "Memory Model & Visibility" }
  ],

  questions: [
    // ── Threads & Lifecycle ──────────────────────────────
    {
      id: "java.concurrency.01",
      section: "java.concurrency",
      subsection: "java.concurrency.threads",
      level: "basic",
      question: "What's the difference between Runnable, Callable, and extending Thread?",
      quick_answer:
        "→ Runnable: run(), returns nothing, can't throw checked exceptions\n" +
        "→ Callable<V>: call(), returns a value + can throw checked\n" +
        "→ Extending Thread: ties your logic to the thread itself — avoid\n" +
        "→ Prefer Runnable/Callable submitted to an executor",
      key_points: [
        "Runnable.run() has no return value and no checked exceptions",
        "Callable<V>.call() returns V and may throw — pairs with Future",
        "Implementing an interface leaves your class free to extend something else",
        "Extending Thread couples task and worker; you lose pooling/reuse",
        "Both Runnable and Callable can be handed to an ExecutorService"
      ],
      common_trap: "Saying 'extend Thread' as the default — it wastes the single inheritance slot and prevents the task from being reused by a pool.",
      tags: ["threads", "runnable", "callable"]
    },
    {
      id: "java.concurrency.02",
      section: "java.concurrency",
      subsection: "java.concurrency.threads",
      level: "basic",
      question: "Name the states in the Java thread lifecycle.",
      quick_answer:
        "→ NEW → RUNNABLE → (BLOCKED / WAITING / TIMED_WAITING) → TERMINATED\n" +
        "→ RUNNABLE covers both 'ready' and 'running' (OS decides)\n" +
        "→ BLOCKED = waiting on a monitor lock; WAITING = wait()/join() with no timeout",
      tags: ["threads", "lifecycle"]
    },

    // ── Synchronization & Locks ──────────────────────────
    {
      id: "java.concurrency.03",
      section: "java.concurrency",
      subsection: "java.concurrency.sync",
      level: "intermediate",
      question: "What does the synchronized keyword actually guarantee?",
      quick_answer:
        "→ Mutual exclusion: one thread in the block per monitor at a time\n" +
        "→ Visibility: changes made under the lock are visible to the next holder\n" +
        "→ Reentrant: a thread can re-acquire a lock it already holds\n" +
        "→ Lock is an object's intrinsic monitor (this, or a class for static)",
      key_points: [
        "Provides both mutual exclusion AND a happens-before edge (visibility)",
        "synchronized method locks 'this' (instance) or the Class (static)",
        "Intrinsic locks are reentrant — same thread won't deadlock itself",
        "Lock is released on normal exit and on exception",
        "Block form synchronized(obj) lets you narrow the critical section"
      ],
      common_trap: "Thinking synchronized is only about mutual exclusion — its visibility guarantee (flushing/refreshing memory) is just as important.",
      tags: ["synchronized", "locks", "visibility"]
    },
    {
      id: "java.concurrency.04",
      section: "java.concurrency",
      subsection: "java.concurrency.sync",
      level: "intermediate",
      question: "When would you reach for ReentrantLock over synchronized?",
      quick_answer:
        "→ Need tryLock() / timed / interruptible acquisition\n" +
        "→ Need fairness, or multiple condition variables\n" +
        "→ Want to lock/unlock across method boundaries\n" +
        "→ Otherwise synchronized is simpler and just as fast",
      detailed_answer:
        "synchronized is a language construct: the JVM acquires and releases the monitor for you, so the lock is always released even on exception. It's concise and the JIT optimises it well (biased/lightweight locking historically). What it can't do is wait politely.\n\n" +
        "ReentrantLock is a library lock (java.util.concurrent.locks) that adds capabilities synchronized lacks: tryLock() returns immediately or after a timeout instead of blocking forever, lockInterruptibly() lets a waiting thread be cancelled, and you can create a fair lock that hands ownership in FIFO order. It also supports multiple Condition objects so you can have separate wait-sets (e.g. notFull / notEmpty in a bounded buffer).\n\n" +
        "The cost is discipline: you MUST unlock in a finally block, or a thrown exception leaks the lock forever. Reach for ReentrantLock only when you need one of its extra features; otherwise prefer synchronized.",
      key_points: [
        "tryLock() and tryLock(timeout) avoid unbounded blocking",
        "lockInterruptibly() makes lock waits cancellable",
        "Fairness mode trades throughput for FIFO ordering",
        "Multiple Condition objects = multiple wait-sets on one lock",
        "Always unlock() in finally — no automatic release"
      ],
      common_trap: "Forgetting the finally { lock.unlock() } — an exception inside the critical section then leaks the lock and hangs every other thread.",
      has_code: true,
      code_language: "java",
      code_snippet:
        "private final ReentrantLock lock = new ReentrantLock();\n\n" +
        "public boolean process(Task t) {\n" +
        "    if (!lock.tryLock()) return false;   // don't block — bail out\n" +
        "    try {\n" +
        "        // critical section\n" +
        "        return handle(t);\n" +
        "    } finally {\n" +
        "        lock.unlock();                    // MUST release here\n" +
        "    }\n" +
        "}",
      tags: ["reentrantlock", "synchronized", "locks"]
    },
    {
      id: "java.concurrency.05",
      section: "java.concurrency",
      subsection: "java.concurrency.sync",
      level: "advanced",
      question: "What causes a deadlock and how do you prevent it?",
      quick_answer:
        "→ Two+ threads each holding a lock the other needs (circular wait)\n" +
        "→ Prevent: acquire locks in a consistent global order\n" +
        "→ Use tryLock with timeout to break the wait\n" +
        "→ Shrink/avoid holding multiple locks at once",
      key_points: [
        "Needs all four Coffman conditions; breaking any one prevents deadlock",
        "Global lock ordering is the most practical fix",
        "tryLock(timeout) lets a thread back off and retry",
        "Open calls — don't call foreign code while holding a lock",
        "Detect in prod with thread dumps (jstack shows 'found 1 deadlock')"
      ],
      common_trap: "Only inverting the lock order in one place — if any code path still acquires A→B while another does B→A, the deadlock remains.",
      tags: ["deadlock", "locks"]
    },

    // ── Executors & Thread Pools ─────────────────────────
    {
      id: "java.concurrency.06",
      section: "java.concurrency",
      subsection: "java.concurrency.executors",
      level: "intermediate",
      question: "Why use an ExecutorService instead of new Thread() per task?",
      quick_answer:
        "→ Reuses a bounded pool of threads — no unbounded thread creation\n" +
        "→ Decouples task submission from execution policy\n" +
        "→ Gives back Futures, lifecycle (shutdown), and queueing\n" +
        "→ Thread creation is expensive; pools amortise it",
      key_points: [
        "Caps concurrency so you don't exhaust memory/CPU under load",
        "Separates 'what to run' from 'how/when it runs'",
        "submit() returns a Future for results and exceptions",
        "Managed lifecycle: shutdown() / awaitTermination()",
        "Reuses threads — avoids per-task stack allocation cost"
      ],
      common_trap: "Calling Executors.newCachedThreadPool() for untrusted load — it has an unbounded thread count and can melt the box. Prefer a bounded ThreadPoolExecutor.",
      tags: ["executors", "thread-pool"]
    },
    {
      id: "java.concurrency.07",
      section: "java.concurrency",
      subsection: "java.concurrency.executors",
      level: "advanced",
      question: "Walk through the core ThreadPoolExecutor parameters and how a task flows through them.",
      quick_answer:
        "→ corePoolSize → up to this many threads kept alive\n" +
        "→ then the work queue fills\n" +
        "→ then new threads up to maximumPoolSize\n" +
        "→ then the RejectedExecutionHandler fires",
      detailed_answer:
        "A ThreadPoolExecutor decides what to do with each submitted task using its parameters in a specific order. First, if fewer than corePoolSize threads exist, it starts a new core thread for the task — even if other threads are idle. Once core threads are all busy, the task goes onto the workQueue. Only when the queue is FULL does the pool create extra threads, up to maximumPoolSize. If the queue is full AND max threads are running, the task is handed to the rejection handler.\n\n" +
        "This is why an unbounded queue (e.g. LinkedBlockingQueue with no capacity) effectively pins you at corePoolSize — the queue never fills, so maximumPoolSize is never reached. keepAliveTime controls how long non-core threads sit idle before being reaped.\n\n" +
        "Sizing rule of thumb: CPU-bound work ≈ number of cores; IO-bound work can go higher (cores × (1 + wait/compute)). Always bound the queue and pick a deliberate rejection policy (AbortPolicy, CallerRunsPolicy for back-pressure, etc.).",
      key_points: [
        "Order: core threads → queue → extra threads to max → reject",
        "Unbounded queue ⇒ maximumPoolSize is never used",
        "keepAliveTime reaps idle non-core threads",
        "CallerRunsPolicy gives natural back-pressure to producers",
        "Size from workload: CPU-bound ≈ cores; IO-bound scales with wait time"
      ],
      common_trap: "Setting a large maximumPoolSize with an unbounded queue and expecting it to scale — the extra threads never spawn because the queue never fills.",
      tags: ["executors", "thread-pool", "tuning"]
    },
    {
      id: "java.concurrency.08",
      section: "java.concurrency",
      subsection: "java.concurrency.executors",
      level: "intermediate",
      question: "Future vs CompletableFuture — what does CompletableFuture add?",
      quick_answer:
        "→ Future: blocking get(), no composition, no completion callback\n" +
        "→ CompletableFuture: chain with thenApply/thenCompose, combine, handle errors\n" +
        "→ Can be completed manually and composed without blocking a thread\n" +
        "→ Non-blocking pipelines vs a one-shot result handle",
      key_points: [
        "Future only lets you poll or block on get()",
        "CompletableFuture composes: thenApply, thenCompose, thenCombine",
        "Async variants run callbacks on a chosen executor",
        "exceptionally()/handle() for error recovery in the chain",
        "allOf()/anyOf() fan-in multiple futures"
      ],
      common_trap: "Chaining lots of CompletableFutures on the common ForkJoinPool while doing blocking IO — you starve the shared pool. Pass your own executor to the *Async methods.",
      tags: ["future", "completablefuture", "async"]
    },

    // ── Concurrent Collections & Atomics ─────────────────
    {
      id: "java.concurrency.09",
      section: "java.concurrency",
      subsection: "java.concurrency.collections",
      level: "intermediate",
      question: "ConcurrentHashMap vs Collections.synchronizedMap — why prefer the former?",
      quick_answer:
        "→ synchronizedMap: one lock for the whole map — serialises all access\n" +
        "→ ConcurrentHashMap: fine-grained locking/CAS — high read+write concurrency\n" +
        "→ CHM iterators are weakly consistent (no ConcurrentModificationException)\n" +
        "→ CHM has atomic compute/merge/putIfAbsent",
      key_points: [
        "synchronizedMap funnels every operation through a single monitor",
        "ConcurrentHashMap shards contention — reads rarely block",
        "Weakly-consistent iterators don't throw CME and need no external lock",
        "Atomic compute/computeIfAbsent/merge avoid check-then-act races",
        "Neither allows null keys/values in ConcurrentHashMap"
      ],
      common_trap: "Doing if (!map.containsKey(k)) map.put(k,v) on a ConcurrentHashMap — that's a race. Use putIfAbsent/computeIfAbsent for atomicity.",
      tags: ["concurrenthashmap", "collections"]
    },
    {
      id: "java.concurrency.10",
      section: "java.concurrency",
      subsection: "java.concurrency.collections",
      level: "intermediate",
      question: "How do Atomic classes work, and what is CAS?",
      quick_answer:
        "→ AtomicInteger/Long/Reference wrap lock-free atomic updates\n" +
        "→ CAS = compare-and-swap: update only if current == expected\n" +
        "→ Backed by a CPU instruction; retries in a loop on contention\n" +
        "→ Great for counters; watch the ABA problem",
      key_points: [
        "CAS is optimistic: read, compute, swap-if-unchanged, else retry",
        "Lock-free — no blocking, no deadlock, but can spin under contention",
        "incrementAndGet, getAndAdd, compareAndSet are the core ops",
        "LongAdder scales better than AtomicLong under heavy write contention",
        "ABA: value returns to expected after changing — AtomicStampedReference guards it"
      ],
      common_trap: "Assuming CAS is free — under very high contention threads spin and waste CPU; LongAdder or a different design may beat AtomicLong.",
      tags: ["atomic", "cas", "lock-free"]
    },

    // ── Memory Model & Visibility ────────────────────────
    {
      id: "java.concurrency.11",
      section: "java.concurrency",
      subsection: "java.concurrency.memory",
      level: "intermediate",
      question: "What does volatile guarantee — and what does it NOT?",
      quick_answer:
        "→ Guarantees visibility: reads/writes go to main memory, not a cache\n" +
        "→ Establishes happens-before across the volatile field\n" +
        "→ Does NOT give atomicity for compound ops (count++)\n" +
        "→ Use it for flags; use Atomic/locks for read-modify-write",
      key_points: [
        "Every read sees the most recent write — no stale cached value",
        "A write happens-before subsequent reads of the same field",
        "count++ is read-modify-write — volatile does not make it atomic",
        "Classic use: a volatile boolean 'running' stop flag",
        "Also prevents certain reorderings around the access"
      ],
      common_trap: "Using a volatile counter and doing v++ from multiple threads — updates are still lost because increment isn't atomic.",
      has_code: true,
      code_language: "java",
      code_snippet:
        "private volatile boolean running = true;   // visibility for the flag\n\n" +
        "public void run() {\n" +
        "    while (running) { doWork(); }           // sees stop() promptly\n" +
        "}\n" +
        "public void stop() { running = false; }",
      tags: ["volatile", "visibility", "memory-model"]
    },
    {
      id: "java.concurrency.12",
      section: "java.concurrency",
      subsection: "java.concurrency.memory",
      level: "advanced",
      question: "Explain the happens-before relationship in the Java Memory Model.",
      quick_answer:
        "→ A rule that orders memory ops: if A happens-before B, A's effects are visible to B\n" +
        "→ Program order within a thread; monitor unlock → later lock\n" +
        "→ volatile write → later read; Thread.start/join edges\n" +
        "→ Without it, the JMM permits reordering and stale reads",
      detailed_answer:
        "The Java Memory Model doesn't promise that one thread's writes are instantly visible to another — caches and compiler/CPU reordering are allowed for speed. What it gives you instead is the happens-before relation: a partial ordering such that if action A happens-before action B, then A's memory effects are guaranteed visible to B and A is ordered before B.\n\n" +
        "The edges you can rely on include: actions in a single thread happen-before later actions in that same thread (program order); an unlock of a monitor happens-before every later lock of it; a write to a volatile field happens-before every later read of it; Thread.start() happens-before the started thread's actions; and a thread's actions happen-before another thread returning from join() on it.\n\n" +
        "Correct concurrent code is really about establishing enough happens-before edges (via synchronized, volatile, locks, or higher-level j.u.c tools) so that no thread can observe a half-built or stale state. If two accesses to shared data aren't ordered by happens-before and at least one is a write, you have a data race and the result is undefined.",
      key_points: [
        "happens-before = guaranteed visibility + ordering, not real-time",
        "Single-thread program order is the baseline edge",
        "monitor unlock → subsequent lock of the same monitor",
        "volatile write → subsequent read of the same field",
        "Thread.start() and Thread.join() create edges across threads",
        "No happens-before + a write = data race = undefined behaviour"
      ],
      common_trap: "Believing synchronized/volatile 'flush everything' globally — they only create ordering relative to the SAME lock/field, not across unrelated variables.",
      tags: ["jmm", "happens-before", "memory-model"]
    }
  ]
};
