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
  title: "Partitioning, clustering, small files",
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
        "Partition metadata lets the planner skip groups of files whose partition values cannot satisfy a predicate, which cuts planning and data I/O. Elapsed time also depends on file statistics, storage requests, cache, parallelism, engine planning and the data that survives pruning.\n\n1. **Predicate match.** Derive candidate keys from actual filters and joins.\n2. **File distribution.** Estimate bytes and files per partition for typical and skewed values. No target size fits every engine and workload.\n3. **Cardinality and evolution.** A high-cardinality key creates many small partitions, a coarse key forces broad scans. Model new values, late data and future granularity changes.",
    },
    {
      id: "s1b",
      title: "Range / hash / list",
      readTimeMinutes: 3,
      content:
        "- **Range partitioning.** Assigns rows by value range, for example one month of `order_date`. It keeps range locality and concentrates current-period writes.\n- **Hash partitioning.** Maps a key to one of N buckets, for example `hash(user_id) % 16`. It spreads a suitable key, but range queries usually touch every bucket and skewed keys stay hot.\n- **List partitioning.** Maps declared values such as regions to partitions. New or null values need explicit validation and a fallback.\n\nTime is a common top-level key because many analytical queries filter on time and retention works by time. Tenant isolation, legal location, event distribution and query patterns can justify another key or no explicit partitioning.",
    },
    {
      id: "s1c",
      title: "Hive-style vs hidden",
      readTimeMinutes: 3,
      content:
        "**Hive-style partitioning** stores the partition value in a path such as `s3://lake/orders/order_date=2026-05-01/part-001.parquet`. Writers must compute it consistently, a granularity change can force moving or rewriting files, and writers that derive `order_date` differently produce a wrong layout.\n\n**Hidden partitioning**, supported by Iceberg since spec v1, declares a transform such as `PARTITIONED BY (days(order_ts))` in table metadata. Compatible writers derive the value, and queries keep filtering on `order_ts`. Partition evolution can switch `days(order_ts)` to `hours(order_ts)` for new files while old files keep their spec, and readers plan across both.\n\nStill check engine support, transform semantics, metadata integrity, time zones and pruning on your deployed versions.",
    },
    {
      id: "s2",
      title: "Pick a key",
      readTimeMinutes: 2,
      content:
        "The model above runs one fixed query on five synthetic layouts.\n\nCompare the relative behavior, then repeat with production distributions. Hourly partitions create small files at low volume, user partitions expose skew, and no partitioning forces broad scans.",
    },
    {
      id: "s3",
      title: "Small files",
      readTimeMinutes: 2,
      content:
        "Frequent commits produce files smaller than the engine's efficient scan unit, especially when each partition gets little data per commit. Many files add metadata, planning, open-request and scheduling work.\n\n**Compaction** rewrites selected files into a new layout. It costs compute and I/O, publishes another table version and can conflict with concurrent updates, so trigger it from measured file counts, size distribution and query signals instead of a fixed nightly job. Commands are vendor- and version-specific, so check syntax, isolation, target-size semantics and rollback in your engine first.",
    },
    {
      id: "s4",
      title: "Clustering / Z-order",
      readTimeMinutes: 3,
      content:
        "A table may partition by one transform or a compound spec, then cluster or sort records within the resulting file groups for other filters.\n\nSorting tightens min/max ranges for the sort columns. **Z-ordering** and related multidimensional clustering try to keep locality across several columns. The benefit depends on data distribution and predicate mix, and each extra column dilutes it and adds maintenance.\n\nPick partition and clustering columns from query telemetry, estimate write amplification and verify pruning in file-level plans. When two access patterns need incompatible layouts, build a separate materialized projection.",
    },
    {
      id: "s5",
      title: "Sharding ≠ partitioning",
      readTimeMinutes: 2,
      content:
        "Products use both words loosely; here they mean:\n\n- **Analytical partitioning** groups table data for pruning, retention and maintenance.\n- **Database sharding** routes records across independently scalable database partitions or instances, which brings routing, rebalancing, cross-shard query and transaction concerns.\n\nHash routing spreads keys but loses range locality; range routing keeps locality but creates hot ranges. Composite keys, virtual shards and online rebalancing each ease part of it, and you still measure skew.",
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on skew and layout, below the vocab.",
    },
    {
      id: "s7",
      title: "Key takeaways",
      readTimeMinutes: 2,
      content:
        "- Check bytes read in the file-level plan, not only the SQL text.",
    },
    {
      id: "s8",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "The flashcards below the questions cover partition pruning, range, hash and list partitions, hidden partitioning, over-partitioning, liquid clustering and salting.",
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
          "You partition `events` by `user_id` across 10M users. In production, 90% of partitions are <100MB, but 5 partitions are >500GB each. Which user IDs are those?",
        options: [
          "Random ones; that is how distributions work.",
          'Bots, test accounts, a shared "guest" ID and enterprise tenants.',
          "The newest users.",
          "It must be a bug.",
        ],
        correct: 1,
        explanation:
          "Shared anonymous IDs, internal traffic, automation and large tenants cause most skew; hashing the same key only moves it. Salt deterministically (`user_id + (event_id % 16)`), isolate known traffic, or partition by time and cluster by user, then check ordering needs.",
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
          "Your table is partitioned by `order_date`, and half your queries also filter by `country`. What is the strongest first design hypothesis?",
        options: [
          "Nested partitions by `(order_date, country)`.",
          "Repartition by `country` instead.",
          "Keep `order_date`; Z-order or sort by `country` inside.",
          "A separate table copy partitioned by `country`.",
        ],
        correct: 2,
        explanation:
          "365 dates × about 200 countries give up to 73000 partitions a year. Sorting or clustering by `country` inside date partitions avoids a directory per combination; confirm it with file statistics and query plans.",
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
            a: "The planner applies predicates to partition metadata and drops file groups that cannot match. Planning still costs time; pruned files are never opened.",
          },
          {
            term: "Range partition",
            q: "Best for? Failure mode?",
            a: "Time series queried by recent ranges. Failure mode: the current partition takes all writes while older ones sit read-only. Rolling windows or write spreading help.",
          },
          {
            term: "Hash partition",
            q: "Best for? Failure mode?",
            a: "Even writes across N buckets. Failure mode: no range locality, so a date-range query scans all N buckets. Prefer range or list for range-heavy analytics.",
          },
          {
            term: "List partition",
            q: "Best for? Failure mode?",
            a: "Declared categorical routing. New and null values need validation; rejecting, quarantining or a controlled fallback beats an automatic catch-all.",
          },
          {
            term: "Hidden partitioning",
            q: "Iceberg vs Hive-style",
            a: "Hive-style paths expose partition values to writers. Hidden partitioning declares days(order_ts) in metadata, and evolution lets new files use a new spec while old files keep theirs.",
          },
          {
            term: "Over-partitioning",
            q: "The anti-pattern",
            a: "Too many tiny partitions, with slow listing, high metadata cost and files <10MB. It comes from high-cardinality keys (user_id, event_id) or minute granularity; coarsen or cluster instead.",
          },
          {
            term: "Liquid clustering",
            q: "What must be verified?",
            a: "Delta Lake clustering on declared keys that replaces fixed partitions and Z-order. Verify runtimes, protocol requirements, maintenance and interoperability for your version.",
          },
          {
            term: "Salt",
            q: "When to salt a key",
            a: "When a key is hot, spread it over a bounded subkey such as 0..15 by a deterministic rule. Reads and aggregates must recombine the subkeys, and the gain must outweigh read amplification without breaking required ordering.",
          },
        ],
      },
    },
  ],
};

export default lesson;
