// Ported from data-infrastructure/lessons/06-partitioning.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import {
  DATA_INFRA_QUIZ_COPY,
  DATA_INFRA_FLASHCARDS_COPY,
} from "../widget-copy";

const LID = checkpointLessonId("partitioning");

const lesson: DataInfraLesson = {
  id: "partitioning",
  number: 6,
  title: "Partitioning, Clustering, Small Files",
  subtitle: "Lay out a petabyte to query a megabyte",
  durationMinutes: 12,
  trackId: "storage",
  hook: "Design file layout from measured predicates, distribution, file size, and maintenance cost.",
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
        "Which files can the planner skip before it reads a byte? Partition metadata answers that question: it eliminates groups of files whose partition values cannot satisfy a predicate. Planning and data I/O drop. Elapsed time does not follow partition count alone, because file statistics, storage requests, cache, parallelism, engine planning, and surviving data volume all weigh in.\n\nUse three checks:\n\n1. **Predicate match.** Derive candidate keys from actual filters and joins, not from semantic preference.\n2. **Resulting file distribution.** Estimate bytes and files per partition across typical and skewed values. There is no universal target size; engines and workloads expose different trade-offs.\n3. **Cardinality and evolution.** A high-cardinality key creates many small partitions. A coarse key forces broad scans. Model new values, late data, and future granularity changes.",
    },
    {
      id: "s1b",
      title: "Range / hash / list",
      readTimeMinutes: 3,
      content:
        "Three common strategies, three different failure modes:\n\n- **Range partitioning.** Assign rows by value range, for example one month of `order_date`. Range locality survives; current-period writes concentrate.\n- **Hash partitioning.** Map a key to one of N buckets, for example `hash(user_id) % 16`. A suitable key spreads out, but a range query usually touches every bucket and skewed keys stay hot.\n- **List partitioning.** Map declared values such as regions to partitions. Categorical routing works; new or null values need explicit validation and fallback behavior.\n\nTime-based top-level partitions are common because many analytical queries carry time predicates and retention operates by time. They are not a default. Tenant isolation, legal location, event distribution, and query patterns can justify another key, or no explicit partitioning at all.",
    },
    {
      id: "s1c",
      title: "Hive-style vs hidden",
      readTimeMinutes: 3,
      content:
        "Path-derived and transform-derived partition values impose different writer contracts.\n\n**Hive-style partitioning** stores a partition value in a path such as `s3://lake/orders/order_date=2026-05-01/part-001.parquet`. Writers must compute that value consistently. The value may also live in the file, a granularity change can force moving or rewriting existing files, and any disagreement over how `order_date` is derived produces an incorrect layout.\n\n**Hidden partitioning**, supported by Iceberg since spec v1, declares a transform such as `PARTITIONED BY (days(order_ts))` in table metadata. Compatible writers derive the value and queries keep filtering on `order_ts`. Partition evolution can change `days(order_ts)` to `hours(order_ts)` for new files while old files keep their previous specification. Readers plan across both layouts.\n\nThat loosens the coupling between application code and the physical partition value. It removes no correctness requirement: engine support, transform semantics, metadata integrity, time-zone handling, and pruning behavior all need verification on the deployed versions.",
      keyTakeaway:
        "Partition evolution can let new files use a new transform while old files retain their layout; compatible readers must plan across both specifications.",
    },
    {
      id: "s2",
      title: "Pick a key",
      readTimeMinutes: 2,
      content:
        "The interactive model applies one fixed query to five synthetic layouts. Its file counts and scanned bytes are teaching inputs, not measurements or recommended thresholds.\n\nCompare the relative behavior, then repeat the exercise with production distributions. Hourly partitions create small files at low volume. User partitions expose key skew. No partition forces broad scans. The observed data and the engine decide.",
    },
    {
      id: "s3",
      title: "Small files",
      readTimeMinutes: 2,
      content:
        "Frequent commits produce files smaller than the engine's efficient scan unit, especially when each partition receives little data per commit. Many files raise metadata, planning, open-request, and scheduling work. Storage and engine behavior decide how much.\n\n**Compaction** rewrites selected files into a new layout. It burns compute and I/O, publishes another table version, and can conflict with concurrent updates. Trigger it from measured file-count, size-distribution, and query signals instead of a universal nightly schedule.\n\nCompaction commands and options are vendor- and version-specific. Confirm current syntax, isolation behavior, target-size semantics, and rollback procedure in the exact engine before you operate a table.",
    },
    {
      id: "s4",
      title: "Clustering / Z-order",
      readTimeMinutes: 3,
      content:
        "Queries filter different columns. A table may partition by one transform or a compound specification, then cluster or sort records within the resulting file groups.\n\nSorting tightens min/max ranges for the sort columns. **Z-ordering** and related multidimensional clustering techniques try to preserve locality across several columns, and the benefit depends on data distribution and predicate mix. More columns dilute locality and add maintenance work. No count is universally useful.\n\nSelect partition and clustering columns from query telemetry, estimate write amplification, and verify pruning with file-level plans. When two access patterns need incompatible layouts, a separate materialized projection is the clearer answer.",
    },
    {
      id: "s5",
      title: "Sharding ≠ partitioning",
      readTimeMinutes: 2,
      content:
        "The terms overlap across products, so define them in context:\n\n- **Analytical partitioning** groups table data for pruning, retention, and maintenance. It still needs metadata and can involve coordinated commits.\n- **Database sharding** routes records across independently scalable database partitions or instances. It brings routing, rebalancing, cross-shard query, and transaction concerns.\n\nHash routing spreads suitable keys and weakens range locality. Range routing preserves locality and creates hot ranges. Composite keys, virtual shards, and online rebalancing each address part of that trade-off. None removes the need to measure skew.",
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on skew and layout.",
    },
    {
      id: "s7",
      title: "Key takeaways",
      readTimeMinutes: 2,
      content:
        "- **Match layout to measured predicates and data distribution.** Inspect file-level plans and bytes read, not only SQL text.\n- **Range, hash, and list each expose a failure mode.** Model hot ranges, skewed keys, new values, nulls, and late data before choosing.\n- **Over-partitioning raises metadata and small-file work.** Pick a file-size distribution from engine guidance and workload measurements, not from a universal threshold.\n- **Hidden partitioning and partition evolution loosen writer/query coupling.** Old and new specifications coexist, so compatibility and maintenance still matter.\n- **Clustering supports secondary predicates only when the layout matches the workload.** Re-clustering cost and write amplification belong in the decision.",
    },
    {
      id: "s8",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "- **Partition pruning**, uses partition metadata and predicates to eliminate file groups before data reads.\n- **Range partition**, preserves range locality but concentrates writes in current or popular ranges.\n- **Hash partition**, distributes a suitable key, weakens range locality, and does not remove key skew.\n- **List partition**, maps categories explicitly and therefore needs validation for new, null, and fallback values.\n- **Hidden partitioning**, declares transforms in table metadata so compatible writers and readers derive partition values.\n- **Over-partitioning**, creates excessive metadata or small files through high cardinality or needlessly fine granularity.\n- **Liquid clustering**, a Delta Lake layout feature whose capabilities and constraints must be checked for the deployed version.\n- **Salt**, adds a deterministic or controlled sub-key to spread a hot key; downstream reads or aggregations must recombine the sub-keys correctly.",
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
          "Random, that's just how distributions work.",
          'High-volume internal accounts: bots, test accounts, "guest" or unauthenticated users that share an ID, and a few real whales (e.g. enterprise tenants).',
          "The newest users.",
          "It must be a bug.",
        ],
        correct: 1,
        explanation:
          "Shared anonymous IDs, internal traffic, automation, and large tenants are the usual sources of skew. Hashing the same skewed key only relocates the hotspot. Candidate mitigations: a deterministic salt such as `user_id + (event_id % 16)` with correct downstream recombination, separate treatment for known traffic classes, or time partitioning plus clustering by user. Measure each against ordering and query requirements.",
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
          "Your table is partitioned by `order_date`. Half your queries also filter by `country`. Which response is the strongest initial design hypothesis?",
        options: [
          "Partition by `(order_date, country)`, nested partitions.",
          "Repartition by `country` instead.",
          "Keep `order_date` as the partition; Z-order (or simply sort) by `country` within each partition.",
          "Build a separate copy of the table partitioned by `country`.",
        ],
        correct: 2,
        explanation:
          "A compound `(order_date, country)` layout reaches up to 73,000 value combinations per year before you account for missing combinations and multiple files. Sorting or clustering by `country` within date partitions is a reasonable hypothesis that avoids one partition directory per combination. Confirm file statistics and query plans on representative data.",
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
            q: 'How does the engine "prune"?',
            a: "The planner applies predicates to partition metadata and eliminates file groups that cannot match. Metadata still costs planning time; pruned data files never get opened.",
          },
          {
            term: "Range partition",
            q: "Best for? Failure mode?",
            a: "Best for time-series data where queries filter on recent ranges. Failure mode: hot partition, the current-period partition takes all writes; historical partitions are read-only. Fix with rolling windows or write spreading.",
          },
          {
            term: "Hash partition",
            q: "Best for? Failure mode?",
            a: "Best for even write distribution across N buckets. Failure mode: destroys range locality, a query for a date range must scan all N buckets. Avoid it for range-query-heavy analytical workloads; prefer range or list.",
          },
          {
            term: "List partition",
            q: "Best for? Failure mode?",
            a: "Useful for declared categorical routing. New and null values need explicit validation; a rejected write, quarantined value, or controlled fallback beats an automatic catch-all.",
          },
          {
            term: "Hidden partitioning",
            q: "Iceberg vs Hive-style",
            a: "Path-based layouts expose physical partition values to writers. Transform-based hidden partitioning declares days(order_ts) in metadata; partition evolution lets new files use a new spec while old files keep the previous layout.",
          },
          {
            term: "Over-partitioning",
            q: "The anti-pattern",
            a: "Too many tiny partitions. Symptoms: slow partition listing, high metadata-listing costs, files <10MB each. Cause: partitioning on a high-cardinality column (user_id, event_id) or too-fine time granularity (minutes). Fix: coarsen the granularity or cluster instead.",
          },
          {
            term: "Liquid clustering",
            q: "What must be verified?",
            a: "It is a Delta Lake layout feature. Verify supported runtimes, protocol requirements, clustering keys, maintenance behavior, and interoperability for the deployed version.",
          },
          {
            term: "Salt",
            q: "When to salt a key",
            a: "When a key is hot, spread records over a bounded subkey such as 0..15 using a deterministic or controlled rule. Downstream reads or aggregates must combine those subkeys. Verify that the distribution benefit outweighs read amplification and preserves required ordering.",
          },
        ],
      },
    },
  ],
};

export default lesson;
