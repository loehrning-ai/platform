// Ported from data-infrastructure/lessons/05-lakehouse.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import {
  DATA_INFRA_QUIZ_COPY,
  DATA_INFRA_FLASHCARDS_COPY,
} from "../widget-copy";

const LID = checkpointLessonId("lakehouse");

const lesson: DataInfraLesson = {
  id: "lakehouse",
  number: 5,
  title: "The Lakehouse: Iceberg, Delta, Hudi",
  subtitle: "ACID on object storage",
  durationMinutes: 15,
  trackId: "storage",
  hook: "Inspect snapshots, commit validation, delete handling, and maintenance before choosing a table format.",
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
        "A directory of data files has no atomic table versions, concurrent-write validation, schema evolution or snapshot retention. Metastore conventions patched some of this, but a file listing stays an incomplete table contract.\n\nA lakehouse table format adds metadata that ties files and delete information to a committed table state. **Apache Iceberg, Delta Lake and Apache Hudi** each do this with their own metadata, commit, maintenance and interoperability model.\n\nChoose by comparing the current specification and exact catalog and engine versions against your operations, isolation, deletes, retention, governance and recovery needs.",
    },
    {
      id: "s2",
      title: "The metadata layer",
      readTimeMinutes: 3,
      content:
        "Iceberg keeps five layers of pointers between a table name and its rows. Reads walk down, writes walk up:\n\n1. **Catalog** (Glue, Hive Metastore, Nessie, REST), maps each table name to its current `metadata.json` path.\n2. **`metadata.json`**, snapshot history, schemas, partition specs. `current_snapshot` points to a manifest list.\n3. **Manifest list** (Avro), one row per manifest with partition range stats, so a query can skip whole manifests.\n4. **Manifest** (Avro), one row per data file with column stats, so a query can skip files.\n5. **Data files** (Parquet), the rows.\n\nA read resolves `orders` → `v18.json` via the catalog, takes the current snapshot, prunes manifests and files by their stats and opens only the remaining Parquet files.\n\nA write goes the other way: data files, manifest, manifest list, metadata file. Then one atomic compare-and-swap moves the catalog pointer from `v17.json` to `v18.json`, and that CAS *is* the commit. If it fails, the draft files stay orphaned until orphan-file cleanup removes them.",
    },
    {
      id: "s3",
      title: "ACID & catalogs",
      readTimeMinutes: 3,
      content:
        "A commit protocol publishes a new table state without exposing a partial update.\n\n1. Writer A and Writer B read `v18.json`.\n2. Each writes candidate data and metadata files.\n3. Writer A atomically commits a new metadata location.\n4. Writer B's stale-base commit fails. It revalidates against the new state before retrying, or returns a conflict.\n\nConflicts and cost still depend on operation type, engine options, catalog guarantees and format rules, and failed attempts leave files that maintenance must clean up safely.\n\nThe catalog is part of correctness: it resolves a table to its metadata and must provide the atomic operations the format needs. Hive Metastore, managed, REST and governance catalogs differ in protocol support, authorization, availability and ownership, so verify these for yours.",
    },
    {
      id: "s4",
      title: "Time travel cost",
      readTimeMinutes: 2,
      content:
        "The snapshot model above is a fixed example sequence of snapshots; pick an earlier one to see metadata resolve a prior state. Query and rollback cost depend on metadata size, catalog and storage latency, planning and retained files. Time travel holds storage until retention and garbage collection remove unreachable data.",
    },
    {
      id: "s5",
      title: "CoW vs MoR",
      readTimeMinutes: 3,
      content:
        "On object storage, an update publishes new files or delete metadata; bytes are never edited in place. So `UPDATE orders SET status='shipped' WHERE id=42` forces a trade-off:\n\n- **Copy-on-Write (CoW).** Rewrite the affected files and publish a snapshot with the replacements. Reads stay simple; updates amplify writes.\n- **Merge-on-Read (MoR).** Write new records or delete information separately and merge them at read time or during compaction. Updates write less; reads and maintenance do more.\n\nDelete-file types, defaults and engine support differ by version. Decide from measured update rate, read pattern, file size, maintenance capacity and delete semantics.",
    },
    {
      id: "s6",
      title: "Format comparison",
      readTimeMinutes: 3,
      content:
        "Check each cell of this matrix against current docs and a small compatibility test:\n\n| Decision | Evidence to collect |\n|---|---|\n| Engine interoperability | Read and write operations per exact engine version |\n| Commit and isolation | Catalog atomicity, write validation, retries, unknown-commit recovery |\n| Updates and deletes | CoW/MoR support, delete representation, merge cost, privacy deletion |\n| Schema and partition evolution | Supported changes, reader compatibility, old-file rewrites (after partition evolution, old files keep their spec) |\n| Incremental processing | Change-feed semantics, ordering, retention, checkpoint identity |\n| Operations | Compaction, snapshot expiration, orphan cleanup, observability, disaster recovery |\n| Governance | Authorization, audit events, encryption, catalog availability, ownership |\n\nEngine integrations can lag the specification or support only some operations.",
    },
    {
      id: "s7",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on commits and deletes.",
    },
    {
      id: "s8",
      title: "Key takeaways",
      readTimeMinutes: 2,
      content:
        "- Rare updates and heavy reads suggest CoW; frequent CDC-style updates suggest MoR.",
    },
    {
      id: "s9",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "- **Snapshot**, metadata for one committed table state.\n- **Snapshot expiration / VACUUM**, removes history and, under product rules, eventually unreferenced files.\n- **Hidden partitioning**, derives partition values from source columns, so queries filter on those columns.\n- **Compaction**, rewrites small files into a new layout.\n- **Z-order**, multidimensional clustering that improves data skipping for chosen predicates.",
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
          "Your Iceberg table uses CoW. A user asks you to delete their ~50 rows, spread over 30 of 4800 data files. What happens on DELETE?",
        options: [
          "The 50 rows are rewritten in place.",
          "A delete marker file is written; nothing else changes.",
          "Affected files get rewritten; old snapshots keep prior files until retention ends.",
          "The whole table is rewritten from scratch.",
        ],
        correct: 2,
        explanation:
          "CoW replaces the affected files, and the new snapshot omits the rows. Old snapshots, branches, tags, object versions, replicas and backups can still hold the bytes, so a privacy deletion checks every layer.",
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
          "A CDC mirror sends frequent small keyed updates. Reads can absorb merge work and the team runs regular compaction. Which strategy do you benchmark first?",
        options: [
          "CoW. Always.",
          "MoR, trading fewer rewrites for read and compaction work.",
          "Doesn't matter; the engine handles it.",
          "Use CSV.",
        ],
        correct: 1,
        explanation:
          "This workload accepts read-side merging and compaction in exchange for fewer file rewrites. Benchmark file sizes, update distribution, engine support, read latency and compaction capacity; CoW can still win for clustered updates or read-heavy loads.",
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
            a: "A committed table version that references the metadata and files for one point in history. Retention decides when older snapshots and their files can go.",
          },
          {
            term: "Time travel",
            q: "How does it work?",
            a: "The engine resolves a retained snapshot and plans its files. Syntax, cost and retention depend on engine and catalog.",
          },
          {
            term: "VACUUM",
            q: "Why do you run it?",
            a: "To expire history and remove unreferenced files under the configured policy. Privacy deletion must also cover branches, tags, object versions, replicas and backups.",
          },
          {
            term: "Hidden partitioning",
            q: "How does it differ from path-based partitioning?",
            a: "A transform such as days(order_ts) lives in table metadata, and writers derive the value. With partition evolution, new files use a new spec and old files keep theirs until rewritten.",
          },
          {
            term: "OCC",
            q: "Optimistic concurrency control",
            a: "Writers prepare changes, then validate and commit atomically against current metadata. A stale writer retries only after revalidating its assumptions.",
          },
          {
            term: "Compaction",
            q: "Why is it needed?",
            a: "Small files raise planning and request overhead. Compaction costs compute and I/O and can conflict with concurrent writes, so schedule and verify it like any data job.",
          },
          {
            term: "Z-order",
            q: "When does it help?",
            a: "For data skipping on selected columns. The gain depends on engine, data distribution, predicates and statistics, so verify it with representative queries.",
          },
        ],
      },
    },
  ],
};

export default lesson;
