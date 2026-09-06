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
        "Many analytical queries touch a subset of columns, filter rows, and aggregate the result. Physical layout decides how much data the engine must fetch and decode.\n\nA row-oriented layout keeps a record's fields together, which favors keyed operations that need much of a record. A columnar layout groups values by column inside larger row groups, so an engine can skip unselected columns. Similar values also encode well.\n\nThe reduction is workload-specific, never a fixed multiplier. Projection width, predicate selectivity, file statistics, compression, storage latency, cache state, and engine implementation all move the bytes read and the elapsed time.",
    },
    {
      id: "s2",
      title: "Same query, two layouts",
      readTimeMinutes: 2,
      content:
        "The interactive model applies `SELECT SUM(amount) WHERE country='US'` to two small fixed layouts and counts the cells its simplified rules select. It explains projection and pruning. It reproduces neither Postgres, nor Parquet, nor storage, cache, or query-engine behavior.",
    },
    {
      id: "s3",
      title: "Anatomy of Parquet",
      readTimeMinutes: 4,
      content:
        'Parquet is a columnar file format widely supported by analytical engines. A file begins and ends with the `PAR1` magic bytes. Between them sit one or more **row groups**. Each row group holds one **column chunk** per column, and chunks hold encoded **pages**. The footer records the schema and the metadata needed to locate chunks; optional statistics and indexes can support pruning.\n\nWriters choose row-group and page sizes. Common defaults are starting points, not requirements, and the number of rows per group depends on row width and encoding. Readers inspect footer metadata, select the required column chunks, and may skip row groups or pages whose available statistics cannot match a predicate.\n\nThree mechanisms matter:\n\n1. **Column projection.** A query for `SUM(amount)` can omit unrelated column chunks.\n2. **Encoding and compression.** Dictionary, run-length, delta, bit-packed, and plain encodings suit different value distributions. Measure compression results on representative data.\n3. **Statistics and indexes.** If trustworthy metadata proves a row group cannot satisfy `amount > 1000`, the engine skips its data pages. Missing, truncated, or unusable statistics reduce pruning.\n\nORC uses a related columnar design with its own metadata and indexing choices. Avro is row-oriented and schema-aware. Select a format from consumers, evolution requirements, interoperability, and measured read/write behavior rather than a fixed "wire versus rest" rule.',
      keyTakeaway:
        "A Parquet reader seeks to the footer first, then jumps only to the row groups and pages a query's predicates actually need.",
    },
    {
      id: "s4",
      title: "Encodings",
      readTimeMinutes: 2,
      content:
        '| Encoding | Often useful for | Example |\n|---|---|---|\n| Plain | Values that do not benefit from a specialized encoding. | Store the format\'s plain representation. |\n| Dictionary | Repeated values within the dictionary limit. | `"US"→0`, `"UK"→1` plus indices. |\n| RLE | Repeated values or definition/repetition levels. | `[0,0,0,0,1,1] → [(0,4),(1,2)]`. |\n| Bit-packing | Integers with a small required bit width. | Pack values into the required bits. |\n| Delta encoding | Values with small deltas, such as sorted integers. | Store differences from previous values. |\n\nEstimate logical input separately from encoded and compressed bytes. Then test representative files. Encoding effectiveness moves with cardinality, ordering, null distribution, codec, and writer settings.',
    },
    {
      id: "s5",
      title: "Iceberg vs Delta",
      readTimeMinutes: 3,
      content:
        "Parquet and lakehouse table formats work at different layers.\n\n- **Parquet** defines bytes within a file: row groups, column chunks, pages, encodings, and metadata. It never defines which files form the current version of a table.\n- **Apache Iceberg, Delta Lake, and Apache Hudi** manage sets of data and delete files as table versions. They define commit, snapshot, schema, partition, and maintenance behavior, with capabilities that vary by specification version and engine integration.\n\nTheir metadata designs differ. Iceberg snapshots reference manifest lists and manifests. Delta records table actions in `_delta_log/` and checkpoints. Hudi maintains a timeline and file groups. Those structures shape planning, concurrency validation, incremental reads, maintenance, and interoperability.\n\nDo not choose from a static feature matrix. Write down the required operations, isolation level, delete semantics, partition evolution, supported engines, catalog, governance boundary, and upgrade path. Then verify each requirement against the current specification and the exact engine versions in use.",
    },
    {
      id: "s6",
      title: "Bloom filters",
      readTimeMinutes: 2,
      content:
        'Min/max statistics are weak for unsorted high-cardinality point predicates such as `WHERE user_id = \'abc-123\'`. A **Bloom filter** answers one of two ways: "definitely absent" or "possibly present." A correctly constructed filter has no false negatives for inserted values, and its false-positive probability follows from bit count, hash count, and inserted items. The interactive model uses a deliberately tiny 32-bit filter to make collisions visible; it is not a production sizing example.',
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
        "- **Row group**, a horizontal set of rows holding one column chunk per column. Its size trades metadata and parallelism against scan and compression behavior; test it with the target engine.\n- **Page**, an encoded block inside a column chunk and a unit the reader may decode or skip when indexes permit. Writers choose page sizing.\n- **Footer-first**, a reader locates file metadata at the end, then plans the required chunks and pages. Remote-storage range requests and engine behavior decide the actual I/O pattern.\n- **ORC**, another columnar file format with stripes, indexes, and encodings. Support and performance depend on the selected engines.\n- **Avro**, a row-oriented, schema-aware format often used for record exchange and archival. Consumers and access patterns decide whether it fits.\n- **Z-ordering**, a multidimensional clustering technique that can improve data skipping for selected columns. The benefit fades when data distribution or query predicates stop matching the clustering choice.",
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
          "Sorted data tends to produce tighter min/max ranges. The engine eliminates groups whose trustworthy statistics cannot match, then reads the overlapping groups. The exact count and speedup need the actual files, metadata, engine, storage, and cache state.",
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
          'A correctly constructed Bloom filter has no false negatives for inserted values, so "definitely absent" lets the engine skip the covered data. "Possibly present" demands another check. The configured false-positive target and the storage integration are implementation choices.',
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
            a: "Choose from measured scan size, metadata overhead, compression, memory, and parallelism. Small groups add metadata; large groups can cost pruning granularity and parallelism.",
          },
          {
            term: "Page",
            q: "Why are pages a thing?",
            a: "A page is an encoded block inside a column chunk. Readers decode pages and may skip them when indexes and predicates permit; writers choose the size.",
          },
          {
            term: "Footer-first",
            q: "Why is the footer at the end?",
            a: "The footer records the schema and the locations of row groups and column chunks. Readers find it first, then issue the range reads their plan requires; the number of requests varies.",
          },
          {
            term: "ORC",
            q: "How is ORC different?",
            a: "ORC is a columnar format organized into stripes with indexes and encodings. Compare support and measured behavior in the engines that must read and write it.",
          },
          {
            term: "Avro",
            q: "When do you use Avro?",
            a: "A row-oriented, schema-aware format. It suits record exchange or archival; analytical scans over a subset of columns usually favor a columnar format.",
          },
          {
            term: "Z-ordering",
            q: "What does it do?",
            a: "A multidimensional clustering technique meant to improve data skipping for selected columns. Validate the benefit against the actual predicate mix and data distribution.",
          },
        ],
      },
    },
  ],
};

export default lesson;
