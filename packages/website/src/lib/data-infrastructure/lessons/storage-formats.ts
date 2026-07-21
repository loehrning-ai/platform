// Ported from data-infrastructure/lessons/04-storage-formats.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import { DATA_INFRA_QUIZ_COPY, DATA_INFRA_FLASHCARDS_COPY } from "../widget-copy";

const LID = checkpointLessonId("storage-formats");

const lesson: DataInfraLesson = {
  id: "storage-formats",
  number: 4,
  title: "Row vs Column: Inside Parquet",
  subtitle: "Encodings · row groups · pushdown",
  durationMinutes: 13,
  trackId: "storage",
  hook: "Why columnar wins for analytics. A Parquet file, dissected byte-by-byte.",
  keyConcepts: ["Columnar storage", "Row group", "Predicate pushdown", "Dictionary encoding", "Bloom filter"],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "Why columnar wins",
      readTimeMinutes: 2,
      content:
        'Almost every analytical query is shaped like: *"give me a few columns, filtered, aggregated, over many rows."* The query engine has to read bytes from disk to answer it. The crucial question, and almost the entire reason columnar storage exists, is: **how many of those bytes are useful?**\n\nIn a row-oriented store, all of a row\'s columns are physically next to each other. To get one column from a billion rows, you read all the other columns too. The disk doesn\'t know which bytes you wanted; the OS just hands them over.\n\nIn a column-oriented store, all values of one column are physically next to each other. You read only the columns you asked for. For a typical analytical query that touches 4 of 200 columns, that\'s a 50x IO reduction. And once values are co-located by column, they compress vastly better, because they\'re all the same type, usually with very low cardinality.',
    },
    {
      id: "s2",
      title: "Same query, two layouts",
      readTimeMinutes: 2,
      content:
        "The simulator runs `SELECT SUM(amount) WHERE country='US'` against a row store (Postgres) and a column store (Parquet) side by side, sweeping through both layouts and showing exactly how many bytes each has to read to answer the same query.",
    },
    {
      id: "s3",
      title: "Anatomy of Parquet",
      readTimeMinutes: 4,
      content:
        "Parquet is the de-facto columnar format for analytics on object storage. It's a binary file, but its structure is the most useful thing in this entire course. Memorize this layout.\n\nBytes from top to bottom: `PAR1` (magic header), then one or more **row groups** (each ~128MB / ~1M rows, made of **column chunks**, all values of one column, contiguous, each split into ~1MB **pages**, the smallest unit of decompression), then a **footer** that indexes everything (schema, row-group metadata with byte offsets and sizes, column-chunk metadata with min/max and null counts and encodings, key/value user metadata), then `PAR1` again.\n\nReaders *seek to the end first*, parse the footer to learn schema and per-column-chunk min/max, then jump to just the pages they need. Three columns ignored, one column read, one row group skipped, that's a 50x IO reduction without ever touching the bulk of the file.\n\nThree things make this format fast:\n\n1. **Columnar layout.** A query for `SUM(amount)` reads the *amount* column chunk in each row group, and nothing else.\n2. **Per-column encoding.** Run-length encoding for repeated values, dictionary encoding for low-cardinality strings (`country` = US, US, US, UK becomes ints 0, 0, 0, 1 + a tiny dict). Often 5-10x compression on top of GZIP/Snappy.\n3. **Min/max statistics per row group, per column.** If a query says `WHERE amount > 1000` and a row group's max `amount` is 50, the engine skips the entire row group *without reading a single byte from it*. This is **predicate pushdown**, and it's the main reason analytical queries can hit a petabyte and return in 200ms.\n\nORC (Optimized Row Columnar) is Parquet's closest sibling, also columnar, born in Hive, sharing the same core ideas: column chunks, per-chunk statistics, footer-first reading. Avro is the row-oriented complement: schema-embedded, great for streaming and Kafka payloads, bad for analytics. The pattern is almost always *Avro on the wire, Parquet at rest.*",
      keyTakeaway:
        "A Parquet reader seeks to the footer first, then jumps only to the row groups and pages a query's predicates actually need.",
    },
    {
      id: "s4",
      title: "Encodings",
      readTimeMinutes: 2,
      content:
        "| Encoding | Best for | Example |\n|---|---|---|\n| Plain | High-entropy data; floats, hashes. | Just the raw bytes. |\n| Dictionary | Low-cardinality strings. | \"US\"→0, \"UK\"→1 + index list. |\n| RLE | Long runs of repeats. | [0,0,0,0,1,1] → [(0,4),(1,2)]. |\n| Bit-packing | Small integers. | Pack 8 booleans into a byte. |\n| Delta encoding | Sorted columns (timestamps, auto-increment IDs). | Store diffs from prev value, not absolute values. Unrelated to Delta Lake. |\n\n**The interview move.** When asked to compute storage cost or query latency, separate *logical row count × bytes-per-row* from *physical bytes after encoding + compression*. They differ by 5-20x for typical analytical data. A 1TB CSV is usually 50-200GB as Parquet.",
    },
    {
      id: "s5",
      title: "Iceberg vs Delta",
      readTimeMinutes: 3,
      content:
        "A common confusion: Parquet, Iceberg, and Delta Lake are not competing formats. They operate at different levels.\n\n- **Parquet** is a *file format*. It defines how bytes are laid out within a single file: row groups, column chunks, encodings, footer stats. It knows nothing about transactions, schema evolution across files, or which files make up a \"table.\"\n- **Apache Iceberg** and **Delta Lake** are *open table formats* (also called lakehouse table formats). They sit one layer above Parquet: they manage a *collection* of Parquet (or ORC) files as a logical table and add the things Parquet lacks, ACID transactions, snapshot isolation, time-travel queries, schema and partition evolution, and file-level manifests that enable efficient planning.\n\nThe key architectural differences between Iceberg and Delta Lake:\n\n- **Metadata model.** Iceberg uses a tree of JSON manifest files, a snapshot points to one or more manifest lists, each pointing to individual Parquet files. Delta uses a transaction log (`_delta_log/`) of JSON commit files with sequential numbering. Both support time travel; Iceberg's tree is better for large-scale concurrent writes; Delta's linear log is simpler to reason about for single-writer workloads.\n- **Partition evolution.** Iceberg supports partition spec changes without rewriting data, old partitions stay on the old spec, new writes use the new spec, and the engine handles both transparently. Delta Lake requires a full rewrite to change partition layout.\n- **Hidden partitioning.** Iceberg can partition by a transform of a column (e.g. `months(order_date)`) and hide that from the query writer, queries filter by `order_date` and the engine maps to partition files automatically. Delta Lake uses physical partition directories (Hive-style), so the partition column must appear in the query.\n- **Ecosystem.** Delta Lake is tightly integrated with Databricks and Spark; Iceberg has broader engine support (Flink, Trino, Snowflake, Athena, Spark) and is the preferred default for multi-engine architectures.\n\n**The interview move.** If asked \"should we use Iceberg or Delta?\", the honest answer is: Delta wins if you're a Databricks shop (better tooling, Liquid Clustering, DML optimisations). Iceberg wins if you need engine portability or partition evolution. Both are vastly better than bare Parquet files with Hive-style directories.",
    },
    {
      id: "s6",
      title: "Bloom filters",
      readTimeMinutes: 2,
      content:
        'Min/max stats only help with range predicates. For *point lookups*, `WHERE user_id = \'abc-123\'`, min/max is useless because almost every row group will contain that range. The fix: a **Bloom filter** per column chunk, a small probabilistic data structure that can answer "is X definitely not here?" with zero false negatives. False positives are tunable, usually 1%. The simulator below lets you add keys and check membership against a live 32-bit filter.',
    },
    {
      id: "s7",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on what you just read.",
    },
    {
      id: "s8",
      title: "Vocab",
      readTimeMinutes: 1,
      content:
        "- **Row group**, the right size is 128MB-512MB. Too small → metadata dominates, too many tiny IO ops. Too large → can't parallelize work, can't skip cleanly.\n- **Page**, the smallest unit of decompression, ~1MB by default. Lets the engine load just the part of a column chunk it needs, without inflating the whole thing.\n- **Footer-first**, streaming writers don't know the schema/stats until they've seen all the data. Readers seek to the end first, parse the footer, then jump to the relevant pages. Two seeks, no full scan.\n- **ORC**, Parquet's sibling: columnar, similar layout, born in Hive. Slightly better compression on some workloads, slightly worse ecosystem support outside Hadoop. Most modern stacks pick Parquet.\n- **Avro**, row-oriented, schema-embedded, great for streaming and Kafka payloads, bad for analytics. Often: Avro on the wire, Parquet at rest.\n- **Z-ordering**, a space-filling curve that lets you sort by multiple columns at once, so min/max stats prune well across *any* of those columns. Delta's killer feature for multi-dimensional queries.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q1",
        title: "Predicate pushdown",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "Your table has 1,000 row groups. The query is WHERE order_date = '2026-04-15'. The data is sorted by order_date. Roughly how many row groups does the engine actually open?",
        options: [
          "All 1,000, it has to check.",
          "About 1, sorted data + min/max stats means most row groups have order_date ranges that don't include April 15, so they're skipped without being read.",
          "About 100, there's no way to skip.",
          "It depends on the encoding.",
        ],
        correct: 1,
        explanation:
          "When data is sorted by the predicate column, min/max stats are tight per row group, typically only one or two row groups will have an overlapping range. Predicate pushdown skips the rest entirely. This is why data layout matters as much as the format: Parquet on unsorted data is barely faster than CSV; Parquet on sorted-by-the-right-column data is 100x faster.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q2",
        title: "Bloom verdict",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          'A query asks WHERE user_id = \'abc-123\'. The Bloom filter for the user_id column says: "definitely not in this row group." What does the engine do?',
        options: [
          "Open the row group anyway, just to be safe.",
          "Skip the row group entirely without reading any data pages.",
          "Re-check using the min/max statistics.",
          "Probabilistically open ~50% of the row groups.",
        ],
        correct: 1,
        explanation:
          'Bloom filters have zero false negatives. A "definitely not" answer is final, the engine skips the entire row group, saving the IO. The flip side: a "maybe" is just that, the value might be in there, or might not, and you have to actually open the row group to know. Tuning the false-positive rate (typically 1%) is a knob in Iceberg/Delta.',
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
            term: "Row group",
            q: "What is the right size?",
            a: "128MB-512MB is the sweet spot. Too small → metadata dominates, too many tiny IO ops. Too large → can't parallelize work, can't skip cleanly.",
          },
          {
            term: "Page",
            q: "Why are pages a thing?",
            a: "A page is the smallest unit of decompression. ~1MB by default. Lets the engine load just the part of a column chunk it needs, without inflating the whole thing.",
          },
          {
            term: "Footer-first",
            q: "Why is the footer at the end?",
            a: "Streaming writers don't know the schema/stats until they've seen all the data. Readers seek to the end first, parse the footer, then jump to the relevant pages. Two seeks, no full scan.",
          },
          {
            term: "ORC",
            q: "How is ORC different?",
            a: "ORC is Parquet's sibling, columnar, similar layout, born in Hive. Slightly better compression on some workloads, slightly worse ecosystem support outside Hadoop. Most modern stacks pick Parquet.",
          },
          {
            term: "Avro",
            q: "When do you use Avro?",
            a: "Row-oriented, schema-embedded, great for streaming and Kafka payloads. Bad for analytics. Often: Avro on the wire, Parquet at rest.",
          },
          {
            term: "Z-ordering",
            q: "What does it do?",
            a: "A space-filling curve that lets you sort by multiple columns at once, so min/max stats prune well across any of those columns. Delta's killer feature for multi-dim queries.",
          },
        ],
      },
    },
  ],
};

export default lesson;
