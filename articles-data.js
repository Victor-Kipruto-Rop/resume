// articles-data.js
// Single source of truth for all blog articles. Used by blog.html (grid) and article.html (reader view).

const ARTICLES = [
  {
    id: 1,
    title: "Why Every Data Engineer Should Learn Event-Driven Architecture",
    category: "Streaming",
    icon: "fa-network-wired",
    date: "June 2026",
    readTime: "10 min read",
    tags: ["Kafka", "Streaming", "Architecture"],
    excerpt: "Moving beyond request-response patterns into reactive event streaming across distributed systems.",
    featured: true,
    body: `
      <p>Most data engineers start their careers thinking in request-response terms: a job runs, it queries a source, it writes a destination, and it exits. That mental model works fine until the business needs data <em>now</em> instead of at the next scheduled run — and that's exactly the moment event-driven architecture stops being an academic topic and becomes a production requirement.</p>
      <h2>The problem with polling</h2>
      <p>A batch job that polls a source table every five minutes looks harmless in isolation. Multiply it across a dozen pipelines and you get a system that is constantly out of date, constantly hammering the same tables, and constantly racing its own schedule. Every poll interval is a promise you're making about staleness, and every one of those promises eventually gets broken during an incident.</p>
      <p>Event-driven systems flip the model: instead of asking "has anything changed?" on a timer, producers emit an event the moment something happens, and consumers react immediately. Apache Kafka is the backbone I reach for here — not because it's fashionable, but because its append-only log gives you replayability, ordering guarantees per partition, and a natural boundary between producers and consumers that decouples teams as much as it decouples services.</p>
      <h2>What actually changes in your design</h2>
      <ul>
        <li>Producers stop caring who consumes their events, which removes a whole class of tight coupling between services.</li>
        <li>Consumers can be added or removed without touching the producer at all — a new team can subscribe to a topic with zero coordination cost.</li>
        <li>Failures become local. A consumer group falling behind doesn't take down the producer; it just processes its backlog once it recovers.</li>
      </ul>
      <h2>Where it earns its complexity</h2>
      <p>Event-driven architecture is not free. You trade simple cron jobs for schema management, consumer group rebalancing, and the discipline of designing for exactly-once or at-least-once semantics up front. I only reach for it when one of these is true: the business genuinely needs sub-minute latency, multiple independent teams need the same data stream, or the volume makes batch windows physically impossible to hit.</p>
      <blockquote>The real signal that you need event streaming isn't "big data" — it's multiple consumers needing the same fact at different times, at different speeds, without waiting on each other.</blockquote>
      <p>For anyone building fintech infrastructure in particular, this pattern is close to unavoidable: transaction confirmations, fraud signals, and reconciliation all need to happen in parallel off the same underlying event, not in a chain of sequential batch jobs. Once you've built one properly instrumented Kafka pipeline, going back to pure polling feels like giving up information you already had.</p>
    `
  },
  {
    id: 2,
    title: "Building Reliable Data Pipelines: Lessons from Production",
    category: "Pipelines",
    icon: "fa-diagram-project",
    date: "May 2026",
    readTime: "8 min read",
    tags: ["Airflow", "Python", "ETL"],
    excerpt: "Idempotent transformations, automated Airflow DAG recovery, and rigorous Pytest validation gating.",
    body: `
      <p>Reliability in a data pipeline isn't a feature you add at the end — it's a property that has to be designed in from the first transformation. The pipelines that survive contact with production share three traits: they're idempotent, they recover from failure automatically, and they refuse to ship data that hasn't passed validation.</p>
      <h2>Idempotency first</h2>
      <p>If re-running a task twice with the same input produces a different result, you don't have a pipeline — you have a liability. I design every transformation so a re-run is safe: upserts instead of blind inserts, deterministic keys instead of auto-incrementing surrogate IDs generated mid-pipeline, and explicit watermarking so a task knows exactly which window of data it already processed.</p>
      <h2>Let Airflow do the recovering</h2>
      <p>Airflow's retry and backoff configuration is underused by teams that treat it as a scheduler rather than an orchestrator. Setting sane <code>retries</code>, exponential <code>retry_delay</code>, and task-level SLAs means transient failures — a flaky API, a momentary lock on Postgres — resolve themselves without a 2am page. Combine that with a dead-letter path for anything that fails all retries, so bad records get quarantined rather than silently dropped or, worse, silently corrupting a downstream table.</p>
      <h2>Validation as a gate, not an afterthought</h2>
      <p>Every pipeline I ship carries its own Pytest suite covering null injection, type coercion failures, and empty datasets — the three failure modes that account for the overwhelming majority of real incidents I've seen in ETL. These aren't run manually; they're wired into CI so a change that breaks a contract never reaches a scheduled DAG in the first place.</p>
      <ul>
        <li>Null and type coercion tests catch schema drift from upstream sources before it becomes a downstream mystery.</li>
        <li>Empty-dataset tests catch the silent failure mode where a job "succeeds" but processed zero rows.</li>
        <li>Row-count and checksum assertions between source and destination catch partial writes.</li>
      </ul>
      <p>None of this is exotic engineering. It's discipline, applied consistently, on every pipeline rather than just the ones that have already broken once.</p>
    `
  },
  {
    id: 3,
    title: "Batch Processing vs Real-Time Streaming",
    category: "Streaming",
    icon: "fa-bolt",
    date: "May 2026",
    readTime: "7 min read",
    tags: ["Spark", "Kafka", "Architecture"],
    excerpt: "When to choose scheduled batch ETL loads versus low-latency Kafka stream consumers.",
    body: `
      <p>The batch-versus-streaming debate is usually framed as a technology choice, but it's really a latency requirement wearing a technology costume. Before picking a stack, the only question that matters is: how stale can this data be before someone downstream makes a bad decision because of it?</p>
      <h2>When batch wins</h2>
      <p>Nightly financial close, weekly cohort reports, monthly regulatory filings — anything with a natural reporting cadence is a poor fit for streaming infrastructure. Batch ETL, scheduled and orchestrated through something like Airflow, is simpler to reason about, cheaper to run, and easier to backfill when a bug is discovered three days later. I default to batch unless there's a concrete reason not to.</p>
      <h2>When streaming earns its keep</h2>
      <p>Once a business process depends on reacting within seconds — fraud scoring on a mobile money transaction, live dashboards for an operations team, anomaly alerts for a payments platform — batch windows become the bottleneck, not the infrastructure. That's the domain where a Kafka consumer group processing events as they arrive, or a Spark Structured Streaming job doing continuous aggregation, actually changes the outcome rather than just the architecture diagram.</p>
      <h2>The hybrid reality</h2>
      <p>Most production systems I've built are not purely one or the other. A common pattern: stream the raw events into a durable log for real-time alerting, while a separate batch job replays that same log nightly to build the clean, deduplicated dimensional tables the finance team actually reports from. This "speed layer + batch layer" split lets you get the responsiveness of streaming without contorting every downstream consumer into handling out-of-order, late-arriving events.</p>
      <blockquote>Don't stream because it's impressive. Stream because someone downstream is waiting on the answer in real time.</blockquote>
    `
  },
  {
    id: 4,
    title: "The Modern Data Engineering Stack in 2026",
    category: "Architecture",
    icon: "fa-layer-group",
    date: "April 2026",
    readTime: "12 min read",
    tags: ["Lakehouse", "dbt", "Cloud"],
    excerpt: "An analysis of Python, dbt, Iceberg, Kubernetes, and cloud warehouse ecosystems.",
    body: `
      <p>The data stack has consolidated a lot since the "modern data stack" hype cycle of the early 2020s, and what's left standing in 2026 is a smaller, more opinionated set of tools that actually compose well together.</p>
      <h2>The core layers</h2>
      <p>Ingestion has largely settled around a mix of managed connectors for SaaS sources and hand-rolled Kafka producers for anything transactional or high-volume. Storage is converging on open table formats — Iceberg in particular — sitting on top of commodity object storage, which finally decouples "where the bytes live" from "which engine reads them." Transformation is dbt's territory almost by default now: version-controlled SQL, tested, documented, and orchestrated as a DAG rather than a folder of stored procedures nobody owns.</p>
      <h2>Compute and orchestration</h2>
      <p>Kubernetes has won the "how do we run this reliably" question for data workloads the same way it did for web services — not because every team needs its flexibility, but because the ecosystem around it (Helm charts, operators for Spark and Airflow, standard observability tooling) removes so much bespoke infrastructure work. Terraform sits underneath all of it, because a data platform you can't reproduce from source control is a data platform you don't actually control.</p>
      <h2>What I'd tell someone building this stack from scratch</h2>
      <ul>
        <li>Pick one open table format and standardize on it before you have five years of legacy Parquet-without-metadata to migrate.</li>
        <li>Push transformation logic into dbt as early as possible — it's far easier to add tests and docs from day one than retrofit them onto an existing warehouse.</li>
        <li>Containerize everything, even the "small" cron-like jobs, so environment drift stops being a category of bug you have to debug at all.</li>
      </ul>
      <p>The stack keeps changing at the edges — a new query engine here, a new catalog there — but the underlying principles (open formats, tested transformations, reproducible infrastructure) have stayed remarkably stable, and that's what I actually optimize for.</p>
    `
  },
  {
    id: 5,
    title: "Common Data Engineering Mistakes Beginners Make",
    category: "Pipelines",
    icon: "fa-triangle-exclamation",
    date: "April 2026",
    readTime: "9 min read",
    tags: ["Python", "SQL", "Best Practices"],
    excerpt: "Avoiding brittle schemas, missing idempotency constraints, and unmonitored dead-letter queues.",
    body: `
      <p>Every mistake in this list, I've made at least once. The point of writing them down isn't to sound superior about avoiding them now — it's that they're predictable enough to be worth naming explicitly for anyone earlier in the journey.</p>
      <h2>1. Designing schemas around today's data, not tomorrow's</h2>
      <p>A brittle schema is one built to fit the exact shape of the first sample dataset you were handed. The moment a new field appears, or a nullable column stops being nullable, everything downstream breaks. Building in a little slack — a JSON "extra fields" column, explicit nullability decisions, versioned schemas — costs almost nothing upfront and saves entire incident days later.</p>
      <h2>2. Treating idempotency as optional</h2>
      <p>It's tempting to ship a pipeline that "just inserts" because it's faster to write. It works right up until a DAG retries, or someone manually reruns a backfill, and now you have duplicate rows silently inflating every downstream aggregate. Idempotency constraints — unique keys, upserts, explicit dedup logic — aren't extra credit; they're the baseline for anything that touches production data more than once.</p>
      <h2>3. Building dead-letter queues nobody watches</h2>
      <p>A dead-letter queue that quietly catches bad records but has no alert attached to it is functionally identical to no dead-letter queue at all — except it gives you false confidence. If you're going to quarantine failed records, wire up a monitor that actually pages someone when that queue starts growing.</p>
      <h2>4. Skipping tests because "it's just a script"</h2>
      <p>Every pipeline is "just a script" until it's running in production against real customer data. Null handling, type coercion, and empty-dataset edge cases are cheap to test and expensive to debug after the fact in a live incident.</p>
      <h2>5. Optimizing compute before optimizing the query</h2>
      <p>A missing index or a full table scan hiding inside a join will make any amount of extra compute look slow. Profile the query first; scale the cluster second.</p>
      <p>None of these mistakes are exotic. They're the boring, repeatable ones — which is exactly why they're worth writing down and checking against on every new pipeline.</p>
    `
  },
  {
    id: 6,
    title: "How Fraud Detection Pipelines Work in Financial Systems",
    category: "FinTech",
    icon: "fa-shield-halved",
    date: "March 2026",
    readTime: "11 min read",
    tags: ["FinTech", "Kafka", "Security"],
    excerpt: "Sub-second transaction monitoring and automated reconciliation in mobile money platforms like M-Pesa.",
    body: `
      <p>Mobile money platforms like M-Pesa process an enormous volume of small, high-frequency transactions, which makes them both a huge convenience for users and an attractive target for fraud. Building a detection pipeline for this environment means designing for scale and for sub-second reaction time simultaneously.</p>
      <h2>Ingesting the event stream</h2>
      <p>Everything starts with the Safaricom Daraja API surfacing transaction callbacks — payment confirmations, STK push results, C2B and B2C notifications. Those webhooks land on an ingestion layer that immediately publishes them onto a Kafka topic, partitioned by account or merchant ID so related events stay ordered relative to each other while unrelated ones scale horizontally across partitions.</p>
      <h2>Detecting anomalies in real time</h2>
      <p>A consumer group processes that topic continuously, checking each transaction against a set of rules and statistical baselines: velocity checks (too many transactions from one account in too short a window), amount anomalies relative to an account's historical pattern, and duplicate or replayed webhook detection using idempotency keys. The goal isn't to catch everything with rules alone — it's to catch the obvious cases instantly and flag the ambiguous ones for a slower, more expensive downstream model.</p>
      <h2>Reconciliation as a safety net</h2>
      <p>Real-time detection only works if it's backed by reconciliation that catches what streaming missed. A separate process periodically compares the ledger of processed events against the source-of-truth transaction records, flagging mismatches — a webhook that arrived but wasn't recorded, a duplicate charge, a settlement gap. This is where an event-sourced design pays for itself: because every state change is a stored event rather than a mutation, you can always replay history to see exactly where reconciliation diverged.</p>
      <ul>
        <li>Idempotent webhook handling prevents the same callback from being processed twice.</li>
        <li>A traceable audit trail means every flagged anomaly can be walked back to the exact event that triggered it.</li>
        <li>Alerting has to be proven to actually fire — an anomaly detector nobody gets notified about is a detector that doesn't exist.</li>
      </ul>
      <p>This is precisely the architecture I've been building in <a href="projects.html" style="color: var(--primary-red-orange);">PesaGuard</a>, a reconciliation and anomaly detection layer for M-Pesa transaction flows, running as an MVP with a live pilot customer today.</p>
    `
  },
  {
    id: 7,
    title: "Data Lakes vs Data Warehouses vs Lakehouses",
    category: "Architecture",
    icon: "fa-database",
    date: "March 2026",
    readTime: "8 min read",
    tags: ["BigQuery", "Storage", "Lakehouse"],
    excerpt: "Evaluating storage paradigms for structured reporting versus unstructured machine learning workloads.",
    body: `
      <p>These three terms get used almost interchangeably in job descriptions, which is unfortunate because the distinctions between them drive real architectural decisions.</p>
      <h2>Data warehouses</h2>
      <p>A warehouse stores structured, schema-enforced data optimized for fast, predictable SQL reporting. Think BigQuery, Snowflake, Redshift. Fantastic for BI dashboards and finance reporting; painful for anything unstructured, semi-structured, or exploratory, because you pay a schema tax before the data is even usable.</p>
      <h2>Data lakes</h2>
      <p>A lake stores raw data in its native format — JSON, Parquet, images, logs — cheaply, on object storage, with no schema enforced at write time. Great for machine learning workloads and archival, but historically painful for BI because you lose transactional guarantees and consistent schema, leading to the infamous "data swamp" failure mode.</p>
      <h2>Lakehouses</h2>
      <p>A lakehouse tries to get both: the cheap, flexible storage of a lake with the ACID transactions, schema enforcement, and query performance of a warehouse, using open table formats like Iceberg or Delta Lake on top of object storage. In practice, this is where I default now for any new platform — it removes the false choice between "cheap and flexible" and "reliable and fast."</p>
      <h2>Choosing in practice</h2>
      <ul>
        <li>If the workload is exclusively BI reporting with a stable schema, a pure warehouse is still simpler to operate.</li>
        <li>If the workload is exclusively ML training on raw, unstructured data, a plain lake avoids paying for schema enforcement you don't need.</li>
        <li>If both workloads exist on the same underlying data — which is the common case — a lakehouse avoids duplicating storage and maintaining two divergent copies of the truth.</li>
      </ul>
      <p>The paradigm matters less than picking one deliberately and understanding the tradeoff you accepted, rather than inheriting whatever storage layer happened to be easiest to spin up first.</p>
    `
  },
  {
    id: 8,
    title: "Designing Scalable ETL Pipelines for Millions of Records",
    category: "Pipelines",
    icon: "fa-server",
    date: "February 2026",
    readTime: "10 min read",
    tags: ["AWS S3", "Docker", "PostgreSQL"],
    excerpt: "Chunked memory reads, connection pooling tuning, and microservice container isolation.",
    body: `
      <p>Scale problems in ETL rarely show up as "the pipeline is slow." They show up as "the pipeline works fine in staging and falls over in production" — because staging never had millions of rows to begin with.</p>
      <h2>Stop loading everything into memory</h2>
      <p>The single most common scaling mistake is reading an entire source file or query result into memory before processing it. Chunked reads — processing a source in bounded batches, whether via cursor-based pagination on Postgres or chunked reads from an S3-backed Parquet file — turn an O(n) memory problem into a constant-memory one, and let the same code run identically whether the input is ten thousand rows or ten million.</p>
      <h2>Connection pooling is not optional at scale</h2>
      <p>A pipeline that opens a new database connection per record, or even per micro-batch, will exhaust connection limits long before it exhausts CPU. Tuning a connection pool — sizing it against actual concurrent worker count rather than a default — is one of the highest-leverage changes I make when a pipeline that worked at small scale starts timing out at large scale.</p>
      <h2>Isolate with containers</h2>
      <p>Running each stage of the pipeline — extraction, transformation, load — as its own Docker container gives you two things simultaneously: reproducible environments regardless of where the job runs, and the ability to scale each stage independently. If extraction from S3 is I/O bound and transformation is CPU bound, you don't want them fighting over the same resource pool on the same box.</p>
      <ul>
        <li>Chunk memory reads to keep footprint constant regardless of input size.</li>
        <li>Size connection pools against real concurrency, not a copy-pasted default.</li>
        <li>Containerize each stage so scaling decisions can be made independently, and so "works on my machine" stops being a sentence anyone says.</li>
      </ul>
      <p>None of this is about premature optimization — it's about the pipeline behaving the same way at ten records as it does at ten million, which is the actual definition of "scalable."</p>
    `
  },
  {
    id: 9,
    title: "Observability for Data Engineers",
    category: "Observability",
    icon: "fa-chart-line",
    date: "February 2026",
    readTime: "9 min read",
    tags: ["Grafana", "Prometheus", "Monitoring"],
    excerpt: "Tracing data lineage, monitoring pipeline freshness, and setting up Grafana alerting metrics.",
    body: `
      <p>A pipeline that runs successfully but silently produces wrong or stale data is worse than a pipeline that fails loudly, because nobody knows to look until a downstream consumer notices something is off — often days later.</p>
      <h2>Three things worth measuring on every pipeline</h2>
      <p><strong>Freshness</strong> — how old is the newest data in the destination table, compared to how old it should be given the schedule? A dashboard that hasn't updated in six hours because a DAG silently stopped triggering is exactly the kind of failure that "the job succeeded" metrics miss entirely.</p>
      <p><strong>Volume</strong> — row counts compared against a rolling baseline. A pipeline that normally loads 50,000 rows a day loading 200 is very likely broken, even though it "completed successfully."</p>
      <p><strong>Lineage</strong> — the ability to trace any given row in a report back to the exact source record, transformation step, and pipeline run that produced it. This is the difference between debugging in minutes versus debugging in days when a number in a dashboard looks wrong.</p>
      <h2>The stack I reach for</h2>
      <p>Prometheus scrapes metrics — row counts, task durations, freshness deltas — emitted by the pipeline itself. Grafana turns those into dashboards and, more importantly, alerts: a freshness SLA breach or a volume anomaly pages someone rather than waiting to be noticed manually. Structured logging with consistent correlation IDs across every stage makes lineage tracing possible without needing a dedicated lineage tool for smaller platforms.</p>
      <blockquote>Monitoring tells you the job ran. Observability tells you whether the job did the right thing.</blockquote>
      <p>Building this in from the start costs a fraction of the effort of retrofitting it after the first "why is this number wrong" incident — and it's the difference between finding out about a broken pipeline from an alert versus finding out from a client.</p>
    `
  },
  {
    id: 10,
    title: "Building Enterprise-Grade Data Platforms",
    category: "Architecture",
    icon: "fa-building-shield",
    date: "January 2026",
    readTime: "14 min read",
    tags: ["Kubernetes", "Security", "Enterprise"],
    excerpt: "Securing role-based access, data governance, disaster recovery, and multi-region replication.",
    body: `
      <p>The gap between "a data pipeline that works" and "an enterprise-grade data platform" is almost entirely about what happens when things go wrong, who's allowed to see what, and whether the system can prove it did the right thing after the fact.</p>
      <h2>Role-based access as a first-class design concern</h2>
      <p>Access control can't be bolted on after a platform is built — it has to shape the data model itself. Row-level security in Postgres, column-level masking for sensitive fields, and service accounts scoped to exactly the permissions a given pipeline needs, no more, are the baseline. The goal is that a compromised credential from one service can't cascade into access over the entire platform.</p>
      <h2>Governance you can actually audit</h2>
      <p>Governance that lives in a wiki page nobody reads isn't governance. It has to be enforced in code: schema contracts that block a deploy if a producer changes a field type without a version bump, data classification tags attached at the column level, and retention policies that are executed automatically rather than remembered manually.</p>
      <h2>Disaster recovery you've actually tested</h2>
      <p>A backup strategy that has never been restored is a hypothesis, not a safety net. Enterprise-grade platforms treat "restore from backup" as a routine, scheduled drill — not a one-time task ticked off during initial setup — because the failure mode you're protecting against is exactly the one where the team is under the most pressure and least able to improvise.</p>
      <h2>Multi-region replication</h2>
      <p>Kubernetes makes multi-region deployment tractable in a way that used to require enormous bespoke infrastructure: the same manifests, the same containers, deployed across regions with replication handled at the data layer rather than the application layer. The hard part isn't the tooling anymore — it's designing for eventual consistency and conflict resolution honestly, rather than assuming replication will always be instantaneous.</p>
      <ul>
        <li>Access control shapes the data model, not the other way around.</li>
        <li>Governance rules are enforced in CI/CD, not documented and hoped for.</li>
        <li>Disaster recovery is a drill you run, not a document you write.</li>
        <li>Multi-region is a consistency design problem before it's an infrastructure problem.</li>
      </ul>
      <p>These are the properties that separate a platform a single team can operate confidently from one that quietly depends on nothing ever going wrong.</p>
    `
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ARTICLES;
}
