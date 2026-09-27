// Ported from data-infrastructure/lessons/04-storage-formats.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import {
  DATA_INFRA_QUIZ_COPY,
  DATA_INFRA_FLASHCARDS_COPY,
} from "../widget-copy";

const LID = checkpointLessonId("storage-formats");

const lesson: DataInfraLesson = {
  id: "storage-formats",
  number: 4,
  title: "Row vs Column: Inside Parquet",
  subtitle: "Encodings · row groups · pushdown",
  durationMinutes: 13,
  trackId: "storage",
  hook: "Relate physical layout and metadata to the bytes an analytical query must read.",
  keyConcepts: [
    "Columnar storage",
    "Row group",
    "Predicate pushdown",
    "Dictionary encoding",
    "Bloom filter",
  ],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "Why columnar wins",
      readTimeMinutes: 2,
      content:
        "Analytical queries often read a few columns, filter rows and aggregate, so physical layout decides how much data the engine fetches and decodes.\n\nA row layout keeps a record's fields together and suits keyed operations that need most of a record. A columnar layout groups values by column inside row groups, so the engine skips unselected columns and similar values encode well. The saving depends on projection width, predicate selectivity, file statistics, compression, storage latency, cache state and the engine.",
    },
    {
      id: "s2",
      title: "Same query, two layouts",
      readTimeMinutes: 2,
      content:
        "The interactive model runs `SELECT SUM(amount) WHERE country='US'` on two small fixed layouts and counts the cells its simplified rules select. It explains projection and pruning and does not reproduce Postgres, Parquet, storage, cache or engine behavior.",
    },
    {
      id: "s3",
      title: "Anatomy of Parquet",
      readTimeMinutes: 4,
      content:
        "Parquet is a columnar file format most analytical engines read. A file starts and ends with the magic bytes `PAR1`, with one or more **row groups** between them. Each row group holds one **column chunk** per column, and chunks hold encoded **pages**.\n\nThe footer records the schema, chunk locations and optional statistics and indexes. Writers choose row-group and page sizes; rows per group depend on row width and encoding. Readers read the footer first and then cut the bytes they fetch in three ways.\n\n1. **Column projection.** A query for `SUM(amount)` omits unrelated column chunks.\n2. **Encoding and compression.** Dictionary, run-length, delta, bit-packed and plain encodings suit different value distributions; measure compression on representative data.\n3. **Statistics and indexes.** If trustworthy metadata proves a row group cannot satisfy `amount > 1000`, the engine skips its data pages. Missing, truncated or unusable statistics reduce pruning.\n\nChoose between Parquet, ORC and Avro by consumers, schema evolution, interoperability and measured read and write behavior.",
    },
    {
      id: "s4",
      title: "Encodings",
      readTimeMinutes: 2,
      content:
        "| Encoding | Often useful for | Example |\n|---|---|---|\n| Plain | Values no specialized encoding helps. | Store the plain representation. |\n| Dictionary | Repeated values within the dictionary limit. | `\"US\"→0`, `\"UK\"→1` plus indices. |\n| RLE | Repeated values or definition/repetition levels. | `[0,0,0,0,1,1] → [(0,4),(1,2)]`. |\n| Bit-packing | Integers with a small bit width. | Pack values into the needed bits. |\n| Delta encoding | Small deltas, such as sorted integers. | Store differences to the previous value. |\n\nCompare logical, encoded and compressed bytes on representative files. Cardinality, ordering, nulls, codec and writer settings change the result.",
    },
    {
      id: "s5",
      title: "Iceberg vs Delta",
      readTimeMinutes: 3,
      content:
        "Parquet and lakehouse table formats work at different layers.\n\n- **Parquet** defines the bytes within a file: row groups, column chunks, pages, encodings and metadata. It does not define which files form the current table version.\n- **Apache Iceberg, Delta Lake, and Apache Hudi** manage sets of data and delete files as table versions. They define commit, snapshot, schema, partition and maintenance behavior, which varies by spec version and engine integration.\n\nIceberg snapshots reference manifest lists and manifests, Delta records table actions in `_delta_log/` and checkpoints, and Hudi keeps a timeline and file groups. These structures shape planning, concurrency, incremental reads and maintenance.\n\nTo choose, list the operations, isolation, delete semantics, partition evolution, engines, catalog, governance and upgrade path you need, and verify each against the current spec and your engine versions.",
    },
    {
      id: "s6",
      title: "Bloom filters",
      readTimeMinutes: 2,
      content:
        "Min/max statistics help little for unsorted high-cardinality point predicates such as `WHERE user_id = 'abc-123'`. A **Bloom filter** answers \"definitely absent\" or \"possibly present\". Built correctly, it has no false negatives for inserted values, and its false-positive rate follows from bit count, hash count and inserted items. The interactive model uses a tiny 32-bit filter so that collisions show; it is no guide to production sizing.",
    },
    {
      id: "s7",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Two questions on pruning.",
    },
    {
      id: "s8",
      title: "Vocab",
      readTimeMinutes: 1,
      content:
        "- **Row group**, rows stored together, one column chunk per column.\n- **Page**, an encoded block inside a column chunk.\n- **Footer-first**, reading file metadata at the end before any data.\n- **ORC**, a columnar format with stripes, indexes and encodings.\n- **Avro**, a row-oriented, schema-aware exchange format.\n- **Z-ordering**, multidimensional clustering for data skipping.",
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
          "Your table has 1,000 row groups, sorted by order_date. The query is WHERE order_date = '2026-04-15'. Roughly how many row groups does the engine open?",
        options: [
          "All 1,000; it has to check each.",
          "Only those whose date statistics overlap April 15.",
          "About 100; there is no way to skip.",
          "It depends on the encoding.",
        ],
        correct: 1,
        explanation:
          "Sorted data gives tight min/max ranges, so the engine drops groups whose statistics cannot match and reads the rest. The exact count depends on the real files, metadata and engine.",
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
          "A query asks WHERE user_id = 'abc-123'. The Bloom filter for user_id says \"definitely not in this row group.\" What does the engine do?",
        options: [
          "Open the row group anyway, just to be safe.",
          "Skip the row group entirely without reading any data pages.",
          "Re-check using the min/max statistics.",
          "Probabilistically open ~50% of the row groups.",
        ],
        correct: 1,
        explanation:
          'A correct Bloom filter has no false negatives for inserted values, so "definitely absent" lets the engine skip the covered data. Only "possibly present" needs another check.',
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
            a: "Pick from measured scan size, metadata overhead, compression, memory and parallelism. Small groups add metadata; large ones cost pruning granularity and parallelism.",
          },
          {
            term: "Page",
            q: "Why are pages a thing?",
            a: "An encoded block inside a column chunk. Readers skip pages when indexes and predicates permit; writers choose the size.",
          },
          {
            term: "Footer-first",
            q: "Why is the footer at the end?",
            a: "It records the schema and the locations of row groups and column chunks. Readers fetch it first, then issue only the range reads their plan needs.",
          },
          {
            term: "ORC",
            q: "How is ORC different?",
            a: "A columnar format organized into stripes with indexes and encodings. Compare support and measured behavior in the engines you use.",
          },
          {
            term: "Avro",
            q: "When do you use Avro?",
            a: "A row-oriented, schema-aware format for record exchange or archival. Analytical scans over a few columns usually favor a columnar format.",
          },
          {
            term: "Z-ordering",
            q: "What does it do?",
            a: "Multidimensional clustering meant to improve data skipping for selected columns. Validate it against your real predicates and data distribution.",
          },
        ],
      },
    },
  ],
};

export default lesson;
