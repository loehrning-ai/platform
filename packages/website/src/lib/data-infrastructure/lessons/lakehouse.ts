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
        "A directory of data files is not a table. Atomic table versions, concurrent-write validation, schema evolution, and snapshot retention are all absent from a bare file listing. Implementations historically added metastore conventions and engine-specific procedures, but listing files stays an incomplete table contract.\n\nA lakehouse table format adds metadata that identifies the files and delete information belonging to a committed table state. **Apache Iceberg, Delta Lake, and Apache Hudi** all address this layer with different metadata, commit, maintenance, and interoperability models.\n\nOrigin stories and popularity are context, not selection criteria. Compare the current specification and the exact catalog and engine versions against required operations, isolation, deletes, retention, governance, and recovery.",
    },
    {
      id: "s2",
      title: "The metadata layer",
      readTimeMinutes: 3,
      content:
        "Iceberg's metadata stack is five layers of pointers between a table name and its rows. Reads walk down, writes walk up:\n\n1. **Catalog** (Glue, Hive Metastore, Nessie, REST), one row per table, mapping a table name to its current `metadata.json` path.\n2. **`metadata.json`**, snapshot history, schemas, partition specs. `current_snapshot` points to a manifest list.\n3. **Manifest list** (Avro), one row per manifest, with partition-level range stats so a query can skip whole manifests.\n4. **Manifest** (Avro), one row per data file, with per-file column stats so a query can skip individual files.\n5. **Data files** (Parquet), the actual rows.\n\nA read resolves `orders` → `v18.json` via the catalog, picks the current snapshot, prunes manifests by partition stats, prunes files by column stats, then opens just those Parquet files.\n\nA write runs the reverse: write new data files, write a new manifest pointing to them, write a new manifest list, write a new metadata file. Then the step that matters, a single atomic compare-and-swap on the catalog pointer, from `v17.json` to `v18.json`. That CAS *is* the commit. Either it succeeds and the new snapshot is live, or it fails and the draft files are orphaned (cleaned up by VACUUM later).",
      keyTakeaway:
        "A commit is one atomic compare-and-swap on the catalog's metadata pointer, everything below it is written first, in isolation.",
    },
    {
      id: "s3",
      title: "ACID & catalogs",
      readTimeMinutes: 3,
      content:
        "Table formats use a commit protocol to publish a new table state without ever exposing a partial update. In Iceberg's optimistic model, two writers prepare changes concurrently, then validate and atomically replace the current table-metadata pointer.\n\n1. Writer A and Writer B read `v18.json`.\n2. Each writes candidate data and metadata files.\n3. Writer A atomically commits a new metadata location.\n4. Writer B's stale-base commit fails. It must validate against the new state before retrying, or return a conflict.\n\nAtomic publication does not make every concurrent operation conflict-free or cheap. Isolation and validation depend on operation type, engine options, catalog guarantees, and table-format rules. Failed attempts also leave files that maintenance must identify safely.\n\nThe catalog sits inside the correctness boundary: it resolves a table identifier to metadata and must provide the atomic operations the format requires. Hive Metastore, managed catalogs, REST catalogs, and governance catalogs differ in protocol support, authorization, availability, and operational ownership. Verify those properties. Catalog names are not interchangeable.",
    },
    {
      id: "s4",
      title: "Snapshot timeline",
      readTimeMinutes: 2,
      content:
        "The timeline is a fixed illustrative sequence of table snapshots. Selecting an earlier snapshot shows how metadata resolves a prior table state. Query and rollback cost depend on metadata size, catalog and storage latency, engine planning, retained files, and the operation used. Time travel also consumes storage until retention and garbage-collection policies remove unreachable data.",
    },
    {
      id: "s5",
      title: "CoW vs MoR",
      readTimeMinutes: 3,
      content:
        "Object-store table updates publish new files or delete metadata instead of editing bytes in place. An `UPDATE orders SET status='shipped' WHERE id=42` therefore forces a read/write trade-off:\n\n- **Copy-on-Write (CoW).** Rewrite affected data files and publish a snapshot referencing the replacements. Reads see consolidated files; updates amplify writes.\n- **Merge-on-Read (MoR).** Publish new records or delete information separately and reconcile them during reads or compaction. Updates write less immediately; reads and maintenance merge more state.\n\nThe exact delete-file types, indexes, defaults, compaction rules, and supported engines differ across table-format and engine versions. Choose from measured update rate, read pattern, file size, maintenance capacity, and delete semantics.",
      keyTakeaway:
        "Rule of thumb: infrequent updates + read-heavy → CoW; frequent CDC-style updates → MoR.",
    },
    {
      id: "s6",
      title: "Format comparison",
      readTimeMinutes: 3,
      content:
        "Use a requirements matrix whose cells can be verified against current documentation and a small compatibility test:\n\n| Decision | Evidence to collect |\n|---|---|\n| Engine interoperability | Required read and write operations for every exact engine/version combination |\n| Commit and isolation | Catalog atomicity, concurrent-write validation, retry behavior, and unknown-commit recovery |\n| Updates and deletes | CoW/MoR support, delete representation, merge cost, and privacy-deletion lifecycle |\n| Schema and partition evolution | Supported changes, reader compatibility, and whether old files need rewriting |\n| Incremental processing | Change-feed semantics, ordering, retention, and checkpoint identity |\n| Operations | Compaction, snapshot expiration, orphan cleanup, observability, and disaster recovery |\n| Governance | Authorization boundary, audit events, encryption, catalog availability, and ownership |\n\nA format name proves no row in this matrix. Engine integrations lag specifications or expose only a subset of operations.",
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
        "- **Metadata defines table state.** Data files alone identify no committed table version. Format and catalog jointly define publication and recovery.\n- **Optimistic commits require validation.** A stale writer must validate against the new state before retrying. Conflict behavior follows from the operation and the isolation configuration.\n- **CoW and MoR trade write amplification against read and maintenance work.** Measure both paths for the intended workload.\n- **Partition evolution separates logical predicates from changing physical layouts.** Existing files keep old specs while new files use a new spec; engines still need compatible readers and planning.\n- **Interoperability is an operation matrix.** Prove reads, writes, deletes, evolution, and recovery on the exact engine versions instead of trusting a format-level claim.",
    },
    {
      id: "s9",
      title: "Vocab",
      readTimeMinutes: 2,
      content:
        "- **Snapshot**, metadata identifying a committed table state. The table format and catalog define immutability and retention.\n- **Time travel**, resolving and reading a retained prior snapshot. It costs planning, I/O, and storage retention.\n- **Snapshot expiration / VACUUM**, removes retained history and eventually makes unreferenced files eligible for deletion under product-specific rules.\n- **Hidden partitioning**, derives partition values from source columns and lets queries use source-column predicates.\n- **OCC**, optimistic concurrency control: writers prepare independently, then validate and commit against current metadata.\n- **Compaction**, rewrites selected files into a new layout; scheduling and conflict handling are operational work.\n- **Z-order**, a multidimensional clustering technique some engines use to improve data skipping for selected predicates.",
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
          "The affected files are rewritten without those rows; a new snapshot references replacements; older snapshots may still reference the prior files until their retention expires.",
          "The whole table is rewritten.",
        ],
        correct: 2,
        explanation:
          "Under the stated CoW model, affected files are replaced and the new snapshot omits the deleted rows. Prior snapshots, branches, tags, object versions, replicas, and backups can still hold the bytes. A privacy deletion procedure has to trace every retention layer and verify removal against the organization's legal and recovery requirements. One cleanup command is not proof.",
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
          "A CDC mirror produces frequent small keyed updates. Reads can tolerate merge work and the team operates regular compaction. Which strategy is the better initial hypothesis to benchmark?",
        options: [
          "CoW. Always.",
          "MoR. It can reduce immediate rewrite amplification, while shifting work to reads and compaction.",
          "Doesn't matter; the engine handles it.",
          "Use CSV.",
        ],
        correct: 1,
        explanation:
          "MoR is a reasonable hypothesis because the stated workload accepts read-side merge and maintenance in exchange for less immediate file rewriting. Validate it against actual file sizes, update distribution, engine support, read latency, and compaction capacity. CoW still wins for clustered updates or read-heavy workloads.",
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
            a: "A committed table version referencing the metadata and files for a logical point in the table history. Retention operations decide when older snapshots and eligible files can go.",
          },
          {
            term: "Time travel",
            q: "How does it work?",
            a: "The engine resolves a retained snapshot and plans its files. SQL syntax, planning cost, storage requests, and retention behavior depend on the engine and catalog.",
          },
          {
            term: "VACUUM",
            q: "Why do you run it?",
            a: "To expire eligible history and remove files no longer referenced under the configured policy. Privacy deletion must also account for branches, tags, object versions, replicas, and backups.",
          },
          {
            term: "Hidden partitioning",
            q: "How does it differ from path-based partitioning?",
            a: "A transform such as days(order_ts) is declared in table metadata and derived by compatible writers. Partition evolution lets new files use a new spec while old files keep their layout; old data is not rewritten automatically.",
          },
          {
            term: "OCC",
            q: "Optimistic concurrency control",
            a: "Writers prepare candidate changes, then validate and atomically commit against current metadata. A stale writer may retry safely only after its operation-specific assumptions are revalidated.",
          },
          {
            term: "Compaction",
            q: "Why is it needed?",
            a: "Small files raise planning and storage-request overhead. Compaction publishes a rewritten layout, burns compute and I/O, and can conflict with concurrent changes; schedule and verify it like any other data job.",
          },
          {
            term: "Z-order",
            q: "When does it help?",
            a: "It improves locality and data skipping for selected columns. The benefit depends on the engine, data distribution, predicate mix, rewrite policy, and available statistics, so verify it with representative plans and reads.",
          },
        ],
      },
    },
  ],
};

export default lesson;
