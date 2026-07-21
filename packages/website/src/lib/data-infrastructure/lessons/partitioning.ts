// Ported from data-infrastructure/lessons/06-partitioning.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import { DATA_INFRA_QUIZ_COPY, DATA_INFRA_FLASHCARDS_COPY } from "../widget-copy";

const LID = checkpointLessonId("partitioning");

const lesson: DataInfraLesson = {
  id: "partitioning",
  number: 6,
  title: "Partitioning, Clustering, Small Files",
  subtitle: "Lay out a petabyte to query a megabyte",
  durationMinutes: 12,
  trackId: "storage",
  hook: "How partition keys, clustering, and Z-ordering turn full scans into tiny ones.",
  keyConcepts: [
    "Partition pruning",
    "Range/hash/list partitioning",
    "Hidden partitioning",
    "Small-file problem",
    "Compaction",
    "Z-ordering",
  ],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "Why partition",
      readTimeMinutes: 2,
      content:
        "Partitioning is how you tell a query engine: *don't even open these files.* A partition is a physical sub-directory (or a metadata-tagged group of files) keyed by some column — typically a date, region, or tenant. When a query filters on the partition key, the engine prunes whole partitions before reading any data. The math is simple and brutal: **your query latency is roughly proportional to the fraction of partitions that survive pruning.**\n\nThe interview-relevant rules are equally simple, but everyone gets them wrong:\n\n1. **Partition by the column your queries filter on.** Not the column that \"feels\" like an organizing principle. Look at the actual `WHERE` clauses.\n2. **Partitions should be big enough to be worth a file.** 1MB partitions are worse than no partitions. Aim for ≥ 128MB per partition file.\n3. **Cardinality matters.** Partition by `order_date` (low cardinality) → 365 partitions/year, fine. Partition by `order_id` (high cardinality) → millions of tiny partitions → metadata catastrophe.",
    },
    {
      id: "s1b",
      title: "Range / hash / list",
      readTimeMinutes: 3,
      content:
        "Three fundamental strategies, each with a distinct trade-off:\n\n- **Range partitioning.** Rows are assigned to partitions based on value ranges — e.g. `order_date BETWEEN '2026-01-01' AND '2026-01-31'` → January partition. Excellent for time-series data and range scans. Danger: hot partitions — the current day/month takes all writes while old partitions are cold. Mitigate by keeping recent data in a smaller rolling window and archiving historical ranges.\n- **Hash partitioning.** A hash function maps each row's key to one of N buckets — e.g. `hash(user_id) % 16` → partition 0-15. Excellent distribution; writes spread evenly. Danger: destroys range locality — a scan for users created this week must hit all 16 partitions. Common in OLTP sharding; less common in analytical lakehouses (use clustering instead).\n- **List partitioning.** Partition values are an explicit enumeration — e.g. `region IN ('EU', 'US', 'APAC')`. Excellent for known, stable categorical dimensions. Danger: a new value (e.g. 'LATAM') silently lands in no partition or an overflow partition if not explicitly handled. Plan for an `OTHER` catch-all bucket.\n\nIn practice, analytical workloads almost always use **range on a time column** as the top-level partition, then optionally a secondary strategy (list on region, hash on tenant) within each time partition — but always check that the secondary cardinality stays manageable.",
    },
    {
      id: "s1c",
      title: "Hive-style vs hidden",
      readTimeMinutes: 3,
      content:
        "There are two ways to implement partitioning in the lakehouse ecosystem, and they look the same from a query perspective but are very different to maintain.\n\n**Hive-style partitioning** (used by plain Hive, Delta Lake, and early Iceberg tables) stores the partition value as a physical column in the file path: `s3://lake/orders/order_date=2026-05-01/part-001.parquet`. The writer must explicitly compute and set this column. Problems:\n\n- The column is often duplicated in the file (path *and* Parquet column), wasting space.\n- Changing partition granularity (e.g. daily → hourly) requires a full table rewrite because the physical layout changes.\n- If a writer populates `order_date` from a different timezone or format, partition pruning silently fails.\n\n**Hidden partitioning** (Iceberg's default, introduced in Iceberg spec v1) declares partitioning as a transform on an existing column: `PARTITIONED BY (days(order_ts))`. The partition value is derived at write time and stored in the metadata, not in the data file. Benefits:\n\n- No extra column in the schema — queries filter on `order_ts` naturally and the engine prunes without the user knowing the partition granularity.\n- Changing from `days(order_ts)` to `hours(order_ts)` is a partition evolution — a metadata-only operation; existing files keep their old layout, new files use the new one. No full rewrite.\n- The engine guarantees correct pruning because it controls the transform.\n\nThe reason Iceberg's hidden partitioning is architecturally superior isn't performance — it's correctness and evolvability. Hive-style partitioning creates a coupling between the storage layout and the application schema; hidden partitioning breaks that coupling.",
      keyTakeaway:
        "Hive-style couples storage layout to the application schema; hidden partitioning breaks that coupling, so a granularity change is metadata-only, never a full rewrite.",
    },
    {
      id: "s2",
      title: "Pick a key",
      readTimeMinutes: 2,
      content:
        "Same query. Same data. Try each partition strategy below and watch the file count and bytes scanned change.\n\n\"Partition by hour\" looks reasonable until you realise you have 720 files for one day's data — most of them under 200MB, the metadata cost dominates. \"Partition by user\" is even worse: hot users (Walmart, Amazon) get partitions thousands of times bigger than cold users. Skew is the silent killer of partitioning.",
    },
    {
      id: "s3",
      title: "Small files",
      readTimeMinutes: 2,
      content:
        "Every streaming pipeline produces small files. Every micro-batch commit creates new ones. Every CDC delta pushes more. After a week of unchecked streaming you'll have 100,000 files where you should have 10,000. Each one demands a separate IO operation, a separate metadata lookup, a separate decompression context. Query latency degrades smoothly until one day a dashboard times out.\n\nThe fix is **compaction**: a periodic job that reads many small files and writes back a few large ones. All major lakehouse formats provide a compaction operation as a first-class concept. Run it nightly, or trigger by file-count thresholds.\n\n```\n-- Iceberg\nCALL system.rewrite_data_files(\n  table => 'analytics.orders',\n  options => map('target-file-size-bytes', '536870912')\n);\n\n-- Delta\nOPTIMIZE analytics.orders WHERE order_date >= '2026-04-01';\n\n-- Hudi\nhoodie.compact.inline = true\n```",
    },
    {
      id: "s4",
      title: "Clustering / Z-order",
      readTimeMinutes: 3,
      content:
        "Sometimes your queries filter on different columns at different times. Marketing filters by `country`; the fraud team filters by `payment_method`; finance filters by `order_date`. You can only pick one column to physically partition by — typically the lowest-cardinality, most-universal one (`order_date`). For the others, you use **clustering** within each partition.\n\nPlain clustering: sort the data by a second column inside each partition file. Min/max stats then prune well on that column too. **Z-ordering** goes further — it interleaves bits of multiple columns to produce a sort order that's \"balanced\" across all of them. A query on any of the Z-order columns gets meaningful pruning.\n\nMental model: partition once on the dominant filter, Z-order on 2-4 secondary filters. Beyond 4 columns Z-ordering gets diluted; switch to feature-store-style materialized views.",
    },
    {
      id: "s5",
      title: "Sharding ≠ partitioning",
      readTimeMinutes: 2,
      content:
        "One word for two ideas. Use precisely:\n\n- **Partitioning** is a logical layout choice *within* a single storage system, used to prune scans. Files in folders. No coordination needed.\n- **Sharding** is splitting data *across* multiple storage instances for horizontal scale, with a routing function picking which shard a key lives on. Used in OLTP systems (Postgres, Mongo, DynamoDB) where one node can't hold the whole dataset.\n\nYou partition tables. You shard databases. The interviewer notices when you mix them up.\n\nHash sharding distributes evenly but kills range queries. Range sharding preserves locality but creates hot shards (the latest week's shard takes 80% of writes). Real systems use a hash of `(key + time bucket)` or move hot ranges live — the same trade as partition skew, a level up the stack.",
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on what you just read.",
    },
    {
      id: "s7",
      title: "Key takeaways",
      readTimeMinutes: 2,
      content:
        "- **Match the partition key to your query patterns.** The right key is determined by your `WHERE` clauses, not by what \"makes sense\" semantically. A great partition key cuts >95% of files for your most common queries.\n- **Range, hash, list — each has a failure mode.** Range → hot partitions on recent data. Hash → destroys range locality. List → silently misroutes new enum values. Know the failure mode before you pick.\n- **Over-partitioning is a real anti-pattern.** Millions of tiny partitions kill metadata performance, slow down partition listing, and waste object-storage request budget. Target ≥128MB per partition file. If you can't hit that with hourly partitions, go daily.\n- **Iceberg hidden partitioning decouples layout from schema.** Hive-style forces writers to maintain a physical partition column; changing granularity requires a full rewrite. Hidden partitioning stores the derived value in metadata only; evolution is free.\n- **Partition for the dominant filter; Z-order for secondary filters.** You get one physical partition key. Use Z-ordering (or sort-within-partition) to make secondary columns prunable without exploding the partition count.",
    },
    {
      id: "s8",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "- **Partition pruning** — the engine reads the manifest, finds which partition values exist, intersects with the query predicate, and only opens files for surviving partitions.\n- **Range partition** — best for time-series range scans; failure mode is a hot partition on the current period.\n- **Hash partition** — best for even write distribution; failure mode is destroyed range locality.\n- **List partition** — best for stable categorical dimensions; failure mode is silent misrouting of a new enum value without an `OTHER` catch-all.\n- **Hidden partitioning** — Iceberg's transform-declared partitioning; evolution is metadata-only, unlike Hive-style's physical column.\n- **Over-partitioning** — too many tiny partitions, usually from a high-cardinality key or too-fine time granularity.\n- **Liquid clustering** — Delta's 2024 feature replacing static partition columns with an adaptive clustering hint.\n- **Salt** — prepending a small random prefix to a hot key to spread writes across partitions.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q1",
        title: "The skew trap",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "You partition `events` by `user_id`. The dataset has 10M users. Production observes: 90% of partitions are <100MB, but 5 partitions are >500GB each. Which user IDs are those?",
        options: [
          "Random — that's just how distributions work.",
          "High-volume internal accounts: bots, test accounts, \"guest\" or unauthenticated users that share an ID, and a few real whales (e.g. enterprise tenants).",
          "The newest users.",
          "It must be a bug.",
        ],
        correct: 1,
        explanation:
          "Real-world keys are massively skewed. Test accounts, anonymous-user buckets, internal services that all log under one fake user, and a handful of enterprise customers will dominate. Hash-partitioning a skewed key just moves the problem to a different partition. Real fixes: split hot keys with a salt (`user_id + (event_id % 16)`); special-case bot/test traffic into separate partitions; or partition by something more uniform (e.g. `event_date`) and cluster by `user_id` within.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q2",
        title: "Z-order vs partition",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "Your table is partitioned by `order_date`. Half your queries also filter by `country`. You want fast queries on both. What's the IC5 move?",
        options: [
          "Partition by `(order_date, country)` — nested partitions.",
          "Repartition by `country` instead.",
          "Keep `order_date` as the partition; Z-order (or simply sort) by `country` within each partition.",
          "Build a separate copy of the table partitioned by `country`.",
        ],
        correct: 2,
        explanation:
          "Nested partitioning — `(order_date, country)` — explodes file counts: 365 days × 200 countries = 73,000 partitions, most of them tiny. Z-ordering (or sort-within-partition) keeps the file count sane while still letting min/max stats prune the `country` column inside each partition. The general rule: partition for the dominant filter; cluster/Z-order for the secondary filters.",
      },
    },
    {
      kind: "flashcards",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "flash",
        title: "Flashcards",
        copy: DATA_INFRA_FLASHCARDS_COPY,
        cards: [
          {
            term: "Partition pruning",
            q: "How does the engine \"prune\"?",
            a: "It reads the table's manifest, finds which partition values exist, intersects with the query predicate, and only opens files for surviving partitions. Zero data IO for pruned partitions.",
          },
          {
            term: "Range partition",
            q: "Best for? Failure mode?",
            a: "Best for time-series data where queries filter on recent ranges. Failure mode: hot partition — the current-period partition takes all writes; historical partitions are read-only. Fix with rolling windows or write spreading.",
          },
          {
            term: "Hash partition",
            q: "Best for? Failure mode?",
            a: "Best for even write distribution across N buckets. Failure mode: destroys range locality — a query for a date range must scan all N buckets. Avoid for range-query-heavy analytical workloads; prefer range or list.",
          },
          {
            term: "List partition",
            q: "Best for? Failure mode?",
            a: "Best for known stable categorical dimensions (region, status, tenant tier). Failure mode: a new enum value silently misroutes if not declared; always maintain an OTHER catch-all partition.",
          },
          {
            term: "Hidden partitioning",
            q: "Iceberg vs Hive-style",
            a: "Hive-style: physical column in the file path, writer-maintained, changing granularity = full rewrite. Iceberg hidden: transform declared in metadata (days(order_ts)), no extra column, evolution is metadata-only.",
          },
          {
            term: "Over-partitioning",
            q: "The anti-pattern",
            a: "Too many tiny partitions. Symptoms: slow partition listing, high metadata-listing costs, files <10MB each. Cause: partitioning on a high-cardinality column (user_id, event_id) or too-fine time granularity (minutes). Fix: coarsen the granularity or use clustering instead.",
          },
          {
            term: "Liquid clustering",
            q: "Delta's 2024 feature",
            a: "Replaces partition columns with a clustering hint; the engine adapts file layout dynamically. No more \"stuck with the partition key you picked at table-create time.\"",
          },
          {
            term: "Salt",
            q: "When to salt a key",
            a: "When a key is hot, prepend a small random prefix (e.g. 0..15). Spreads writes across partitions. Reads have to fan out, but distribute load. Standard fix for hot-shard / hot-partition.",
          },
        ],
      },
    },
  ],
};

export default lesson;
