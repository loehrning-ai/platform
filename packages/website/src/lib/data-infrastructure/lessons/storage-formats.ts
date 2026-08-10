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
        "Many analytical queries select a subset of columns, filter rows, and aggregate the result. Physical layout affects how much data the engine must fetch and decode.\n\nA row-oriented layout keeps a record's fields together, which favors keyed operations that need much of a record. A columnar layout groups values by column within larger row groups, so an engine can avoid reading unselected columns. Similar values can also be encoded efficiently.\n\nThe reduction is workload-specific, not a fixed multiplier. Projection width, predicate selectivity, file statistics, compression, storage latency, cache state, and engine implementation all affect the bytes read and elapsed time.",
    },
    {
      id: "s2",
      title: "Same query, two layouts",
      readTimeMinutes: 2,
      content:
        "The interactive model applies `SELECT SUM(amount) WHERE country='US'` to two small fixed layouts and counts the cells selected by its simplified rules. It explains projection and pruning; it does not reproduce Postgres, Parquet, storage, cache, or query-engine behavior.",
    },
    {
      id: "s3",
      title: "Anatomy of Parquet",
      readTimeMinutes: 4,
      content:
        'Parquet is a columnar file format widely supported by analytical engines. A file begins and ends with the `PAR1` magic bytes. Between them are one or more **row groups**. Each row group contains one **column chunk** per column, and chunks contain encoded **pages**. The footer records schema and metadata needed to locate chunks; optional statistics and indexes can support pruning.\n\nWriters choose row-group and page sizes. Common defaults are useful starting points, not requirements, and the number of rows per group depends on row width and encoding. Readers inspect footer metadata, select required column chunks, and may skip row groups or pages whose available statistics cannot match a predicate.\n\nThree mechanisms matter:\n\n1. **Column projection.** A query for `SUM(amount)` can omit unrelated column chunks.\n2. **Encoding and compression.** Dictionary, run-length, delta, bit-packed, and plain encodings suit different value distributions. Compression results must be measured on representative data.\n3. **Statistics and indexes.** If trustworthy metadata proves a row group cannot satisfy `amount > 1000`, the engine can skip its data pages. Missing, truncated, or unusable statistics reduce pruning.\n\nORC uses a related columnar design with its own metadata and indexing choices. Avro is row-oriented and schema-aware. Select a format from consumers, evolution requirements, interoperability, and measured read/write behavior rather than a fixed "wire versus rest" rule.',
      keyTakeaway:
        "A Parquet reader seeks to the footer first, then jumps only to the row groups and pages a query's predicates actually need.",
    },
    {
      id: "s4",
      title: "Encodings",
      readTimeMinutes: 2,
      content:
        '| Encoding | Often useful for | Example |\n|---|---|---|\n| Plain | Values that do not benefit from a specialized encoding. | Store the format\'s plain representation. |\n| Dictionary | Repeated values within the dictionary limit. | `"US"→0`, `"UK"→1` plus indices. |\n| RLE | Repeated values or definition/repetition levels. | `[0,0,0,0,1,1] → [(0,4),(1,2)]`. |\n| Bit-packing | Integers with a small required bit width. | Pack values into the required bits. |\n| Delta encoding | Values with small deltas, such as sorted integers. | Store differences from previous values. |\n\nEstimate logical input separately from encoded and compressed bytes. Then test representative files: encoding effectiveness varies with cardinality, ordering, null distribution, codec, and writer settings.',
    },
    {
      id: "s5",
      title: "Iceberg vs Delta",
      readTimeMinutes: 3,
      content:
        "Parquet and lakehouse table formats operate at different layers.\n\n- **Parquet** defines bytes within a file: row groups, column chunks, pages, encodings, and metadata. It does not define which files form the current version of a table.\n- **Apache Iceberg, Delta Lake, and Apache Hudi** manage sets of data and delete files as table versions. They define commit, snapshot, schema, partition, and maintenance behavior, with capabilities that vary by specification version and engine integration.\n\nTheir metadata designs differ. Iceberg snapshots reference manifest lists and manifests. Delta records table actions in `_delta_log/` and checkpoints. Hudi maintains a timeline and file groups. Those structures affect planning, concurrency validation, incremental reads, maintenance, and interoperability.\n\nDo not choose from a static feature matrix. Record the required operations, isolation level, delete semantics, partition evolution, supported engines, catalog, governance boundary, and upgrade path. Verify each requirement against the current specification and the exact engine versions in use.",
    },
    {
      id: "s6",
      title: "Bloom filters",
      readTimeMinutes: 2,
      content:
        'Min/max statistics are often weak for unsorted high-cardinality point predicates such as `WHERE user_id = \'abc-123\'`. A **Bloom filter** can report either "definitely absent" or "possibly present." A correctly constructed filter has no false negatives for inserted values, while its false-positive probability depends on bit count, hash count, and inserted items. The interactive model uses a deliberately tiny 32-bit filter to make collisions visible; it is not a production sizing example.',
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
        "- **Row group**, a horizontal set of rows containing one column chunk per column. Size trades metadata and parallelism against scan and compression behavior; test it with the target engine.\n- **Page**, an encoded block inside a column chunk and a unit the reader may decode or skip when indexes permit. Writers choose page sizing.\n- **Footer-first**, a reader locates file metadata at the end, then plans the required chunks and pages. Remote-storage range requests and engine behavior determine the actual I/O pattern.\n- **ORC**, another columnar file format with stripes, indexes, and encodings. Support and performance depend on the selected engines.\n- **Avro**, a row-oriented, schema-aware format often used for record exchange and archival. Suitability depends on consumers and access patterns.\n- **Z-ordering**, a multidimensional clustering technique that can improve data skipping for selected columns. Benefit declines when data distribution or query predicates do not match the clustering choice.",
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
          "Only row groups whose available date statistics overlap April 15; the exact count depends on row-group boundaries and metadata.",
          "About 100, there's no way to skip.",
          "It depends on the encoding.",
        ],
        correct: 1,
        explanation:
          "Sorted data tends to produce tighter min/max ranges. The engine can eliminate groups whose trustworthy statistics cannot match, then read the overlapping groups. The exact count and speedup require the actual files, metadata, engine, storage, and cache state.",
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
          "A query asks WHERE user_id = 'abc-123'. The Bloom filter for the user_id column says: \"definitely not in this row group.\" What does the engine do?",
        options: [
          "Open the row group anyway, just to be safe.",
          "Skip the row group entirely without reading any data pages.",
          "Re-check using the min/max statistics.",
          "Probabilistically open ~50% of the row groups.",
        ],
        correct: 1,
        explanation:
          'A correctly constructed Bloom filter has no false negatives for inserted values, so "definitely absent" permits the engine to skip the covered data. "Possibly present" requires another check. The configured false-positive target and storage integration are implementation choices.',
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
            a: "Choose from measured scan size, metadata overhead, compression, memory, and parallelism. Small groups increase metadata; large groups can reduce pruning granularity and parallelism.",
          },
          {
            term: "Page",
            q: "Why are pages a thing?",
            a: "A page is an encoded block inside a column chunk. Readers decode pages and may skip them when indexes and predicates permit; writers choose the size.",
          },
          {
            term: "Footer-first",
            q: "Why is the footer at the end?",
            a: "The footer records schema and locations of row groups and column chunks. Readers locate it first, then issue the range reads required by their plan; the number of requests varies.",
          },
          {
            term: "ORC",
            q: "How is ORC different?",
            a: "ORC is a columnar format organized into stripes with indexes and encodings. Compare support and measured behavior in the engines that must read and write it.",
          },
          {
            term: "Avro",
            q: "When do you use Avro?",
            a: "A row-oriented, schema-aware format. It can suit record exchange or archival; analytical scans over a subset of columns often favor a columnar format.",
          },
          {
            term: "Z-ordering",
            q: "What does it do?",
            a: "A multidimensional clustering technique intended to improve data skipping for selected columns. Validate benefit against the actual predicate mix and data distribution.",
          },
        ],
      },
    },
  ],
};

export default lesson;
