// Ported from data-infrastructure/lessons/05-lakehouse.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import { DATA_INFRA_QUIZ_COPY, DATA_INFRA_FLASHCARDS_COPY } from "../widget-copy";

const LID = checkpointLessonId("lakehouse");

const lesson: DataInfraLesson = {
  id: "lakehouse",
  number: 5,
  title: "The Lakehouse: Iceberg, Delta, Hudi",
  subtitle: "ACID on object storage",
  durationMinutes: 15,
  trackId: "storage",
  hook: "Snapshots, manifests, copy-on-write vs merge-on-read. The format war, ranked.",
  keyConcepts: [
    "Metadata layer",
    "Catalog",
    "Optimistic concurrency control",
    "Copy-on-Write",
    "Merge-on-Read",
    "Time travel",
  ],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "Why a lakehouse",
      readTimeMinutes: 2,
      content:
        "For a decade, the data lake was a directory of Parquet files on S3, and that was it. It was wonderful, cheap, durable, scalable, and it was missing everything: no atomic writes, no schema evolution, no time travel, no concurrent updates without corruption, no idea which files belonged to which version of the table. To delete one user's data for GDPR, you rewrote the entire dataset.\n\nThe lakehouse fixes this with one architectural move: **add a metadata layer on top of the file layout that tracks which files belong to which version of the table.** Three formats compete to be that layer:\n\n- **Apache Iceberg**, born at Netflix, donated to Apache, the reference implementation people pick for openness. Engine-agnostic.\n- **Delta Lake**, born at Databricks, open-sourced under Linux Foundation, deeply integrated with Spark. Now interoperates with Iceberg via UniForm.\n- **Apache Hudi**, born at Uber, optimized for streaming upserts and CDC. Niche but excellent at its niche.",
    },
    {
      id: "s2",
      title: "The metadata layer",
      readTimeMinutes: 3,
      content:
        "Iceberg's metadata stack is five layers of pointers between a table name and its rows. Reads walk down, writes walk up:\n\n1. **Catalog** (Glue, Hive Metastore, Nessie, REST), one row per table, mapping a table name to its current `metadata.json` path.\n2. **`metadata.json`**, snapshot history, schemas, partition specs. `current_snapshot` points to a manifest list.\n3. **Manifest list** (Avro), one row per manifest, with partition-level range stats so a query can skip whole manifests.\n4. **Manifest** (Avro), one row per data file, with per-file column stats so a query can skip individual files.\n5. **Data files** (Parquet), the actual rows.\n\nA read resolves `orders` → `v18.json` via the catalog, picks the current snapshot, prunes manifests by partition stats, prunes files by column stats, then opens just those Parquet files.\n\nA write is the reverse: write new data files, write a new manifest pointing to them, write a new manifest list, write a new metadata file. Then, the key step, do a single atomic compare-and-swap on the catalog pointer, from `v17.json` to `v18.json`. That CAS *is* the commit. Either it succeeds and the new snapshot is live, or it fails and the draft files are orphaned (cleaned up by VACUUM later).",
      keyTakeaway:
        "A commit is one atomic compare-and-swap on the catalog's metadata pointer, everything below it is written first, in isolation.",
    },
    {
      id: "s3",
      title: "ACID & catalogs",
      readTimeMinutes: 3,
      content:
        "Object storage has no lock server. How can two concurrent writers avoid corrupting the table? The answer is **optimistic concurrency control (OCC)**: both writers proceed in parallel, and only the *last step*, swapping the catalog pointer, is serialized.\n\n1. Writer A and Writer B both read the current metadata pointer: `v18.json`.\n2. Both write their new data, manifests, and metadata files in isolation.\n3. Writer A commits first: the catalog atomically swaps from `v18.json` → `v19a.json`. Succeeds.\n4. Writer B tries to swap `v18.json` → `v19b.json`. The CAS fails, `v18.json` is no longer current. Writer B either retries (reading the new base) or raises a conflict error.\n\nThis gives **serializable isolation for non-conflicting writes** at essentially zero cost, most concurrent writers don't touch the same rows. Row-level conflict detection is format-specific: Delta uses transaction logs with conflict predicates; Iceberg uses manifest-level conflict detection.\n\nThe catalog is whatever service holds the `table name → current metadata file` mapping:\n\n- **Hive Metastore (HMS)**, the classic, a relational DB fronted by a Thrift service. Works everywhere; operationally heavy.\n- **AWS Glue Data Catalog**, managed HMS-compatible service in AWS. Zero-ops for AWS shops.\n- **Project Nessie / REST catalog**, git-for-data semantics (branches, tags, merges). Nessie is the reference implementation; the Iceberg REST catalog spec lets any HTTP server act as a catalog.\n- **Unity Catalog (Databricks)**, governance-first, fine-grained access control, multi-cloud.",
    },
    {
      id: "s4",
      title: "Snapshot timeline",
      readTimeMinutes: 2,
      content:
        "Click through the snapshot timeline below. Each snapshot is a complete view of the table, by jumping back to an earlier one you get true **time travel** for free. A bad write at 13:01? Roll back to 12:33's snapshot in milliseconds.",
    },
    {
      id: "s5",
      title: "CoW vs MoR",
      readTimeMinutes: 3,
      content:
        "The deepest architectural decision in any lakehouse is how it handles updates and deletes. Object storage doesn't support in-place edits, so an `UPDATE orders SET status='shipped' WHERE id=42` forces the engine to pick a strategy:\n\n- **Copy-on-Write (CoW).** Find the data file containing row 42. Rewrite it without that row. Add a new file with the updated row. Atomically swap. Fast reads (each row exists in exactly one file), slow writes (rewrites whole files for one-row changes), write amplification.\n- **Merge-on-Read (MoR).** Don't touch the data file. Write a small \"delete marker\" file recording *\"row 42 in file abc.parquet is dead\"*. At read time, the engine reads the data file **and** the delete files, merges them on the fly. Fast writes, slower reads, compaction needed to keep read latency reasonable.\n\nIceberg supports both, picked per-table. Delta is CoW by default with deletion vectors as an MoR-flavored optimization. Hudi pioneered MoR and it's their default.",
      keyTakeaway:
        "Rule of thumb: infrequent updates + read-heavy → CoW; frequent CDC-style updates → MoR.",
    },
    {
      id: "s6",
      title: "Format comparison",
      readTimeMinutes: 3,
      content:
        "| | Iceberg | Delta | Hudi |\n|---|---|---|---|\n| Origin | Netflix → Apache | Databricks → Linux Foundation | Uber → Apache |\n| Engine support | Broadest (Spark, Trino, Flink, Snowflake, BigQuery, Athena) | Best on Databricks; broadening | Spark, Flink, Presto |\n| Default updates | CoW (configurable MoR) | CoW + deletion vectors | MoR (CoW available) |\n| Partitioning | Hidden (transform-based, no stored column) | Hive-style + generated columns | Hive-style + custom keygens |\n| Schema evolution | Full (add/drop/rename/reorder, type promotion) | Add/drop/reorder; rename via column-mapping | Add/drop |\n| Catalog | HMS, Glue, Nessie, REST (any) | HMS, Unity Catalog (native) | HMS, custom |\n| Sweet spot | Multi-engine OSS warehouse | Spark / Databricks shop | Streaming CDC ingest |\n\n**The 2026 reality.** Iceberg has won the multi-engine open standard. Snowflake, BigQuery, Athena, and Databricks all read it natively. Pick Iceberg unless you have a specific reason, and \"I'm a heavy Databricks shop\" is one of the few good ones.",
    },
    {
      id: "s7",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on what you just read.",
    },
    {
      id: "s8",
      title: "Key takeaways",
      readTimeMinutes: 2,
      content:
        "- **The metadata layer is the product.** Iceberg/Delta/Hudi are not storage systems, they are metadata management layers on top of Parquet on object storage. ACID comes from atomic CAS on the catalog pointer, not from the storage layer itself.\n- **OCC, not locking.** Concurrent writers use optimistic concurrency control: both write in parallel; only the final catalog pointer swap is serialized. Conflict = retry, not deadlock.\n- **CoW vs MoR is a read/write trade-off.** Read-heavy, infrequent updates → CoW. CDC-style high-frequency upserts → MoR. Most formats support both; choose per table.\n- **Iceberg hidden partitioning removes a class of bugs.** Hive-style partitions require writers to maintain a separate physical column; hidden partitioning derives it from the source column, so changing partition granularity is a metadata-only migration.\n- **Pick Iceberg for multi-engine.** If queries come from more than one engine (Spark writes, Trino reads, Athena ad-hoc), Iceberg's engine-agnostic spec is the safest long-term bet.",
    },
    {
      id: "s9",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "- **Snapshot**, a complete, immutable view of a table at a point in time.\n- **Time travel**, reading a table as of a past snapshot; free and fast since every snapshot is fully described by metadata.\n- **VACUUM**, garbage-collects data files no longer referenced by any retained snapshot.\n- **Hidden partitioning**, Iceberg deriving the partition value from a transform on an existing column, instead of storing a separate physical partition column.\n- **OCC**, optimistic concurrency control: both writers proceed, conflict is detected at commit time via compare-and-swap.\n- **Compaction**, periodically rewriting many small files into fewer, larger ones.\n- **Z-order**, interleaving bits of multiple column values so files cluster well for multi-column filter queries.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q1",
        title: "GDPR delete",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "You're running an Iceberg table with CoW updates. A user requests deletion of all their rows, there are ~50 of them, scattered across 30 of your 4,800 data files. What happens during the DELETE?",
        options: [
          "The 50 rows are rewritten in place.",
          "A delete marker file is written; nothing else changes.",
          "The 30 affected data files are rewritten without those rows; a new snapshot points to the new files; the old files become orphaned and are cleaned up by VACUUM.",
          "The whole table is rewritten.",
        ],
        correct: 2,
        explanation:
          "Under CoW, only the files containing the deleted rows get rewritten, not the whole table. The new snapshot atomically points to the new files. Crucially, the old files survive until VACUUM runs (typically a 7-day retention), which is what enables time travel back to before the delete. For GDPR you usually run an immediate VACUUM after to actually purge the bytes.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q2",
        title: "CoW vs MoR for CDC",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "You're building a pipeline that mirrors a Postgres source via CDC, typically 2 million row updates per minute. Which format strategy fits?",
        options: [
          "CoW. Always.",
          "MoR. CDC produces many small upserts; CoW would rewrite huge files for tiny changes, write amplification kills you. MoR appends delete-then-insert markers; periodic compaction merges them.",
          "Doesn't matter; the engine handles it.",
          "Use CSV.",
        ],
        correct: 1,
        explanation:
          "High-frequency upserts are the textbook case for MoR. CoW's write amplification, rewriting a 256MB file to change one row, would destroy your throughput and IO budget. MoR writes small delta files quickly; reads merge on the fly; a background compaction job rewrites things in larger chunks during quieter windows. This is exactly why Hudi was built.",
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
            term: "Snapshot",
            q: "What is in a snapshot?",
            a: "A complete, immutable view of a table at a point in time. Just a manifest list pointing to manifests pointing to data files. Snapshots accumulate; old ones are pruned by retention policy.",
          },
          {
            term: "Time travel",
            q: "How does it work?",
            a: "Every snapshot is fully described by metadata. Reading `SELECT … AS OF TIMESTAMP '2026-04-15'` just resolves the snapshot active at that timestamp and reads its manifests. Free, fast, no special storage.",
          },
          {
            term: "VACUUM",
            q: "Why do you run it?",
            a: "To garbage-collect data files no longer referenced by any retained snapshot. Without VACUUM, deleted/updated data accumulates forever. Default retention: 7 days. Set short for GDPR; long for safety.",
          },
          {
            term: "Hidden partitioning",
            q: "Iceberg's killer feature vs Hive-style",
            a: "Hive-style partitioning stores a separate physical column (e.g. order_date) that writers must populate. Iceberg hidden partitioning derives the partition value from a transform on an existing column (e.g. days(order_ts)). No extra column, no partition column in the schema, no rewrites when you change granularity.",
          },
          {
            term: "OCC",
            q: "Optimistic concurrency control",
            a: "Both writers proceed; conflict is detected at commit time via a compare-and-swap on the metadata pointer. The losing writer retries. No locks, no deadlocks, no coordination service needed.",
          },
          {
            term: "Compaction",
            q: "Why is it needed?",
            a: "Streaming writes produce many small files. Many small files = bad query performance + bad object-storage cost. Compaction periodically rewrites them into fewer, larger files. Background, non-blocking.",
          },
          {
            term: "Z-order",
            q: "When does it help?",
            a: "When queries filter on multiple columns equally (not one-and-done). Z-ordering interleaves bits of the column values so files are clustered in multi-dimensional space. Both WHERE country=X and WHERE category=Y prune well.",
          },
        ],
      },
    },
  ],
};

export default lesson;
