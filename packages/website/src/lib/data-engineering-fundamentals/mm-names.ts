// ─── Term-name resolver (plan 011 stage 2) ───────────────────────────
//
// Ported from `src/chapters/shared.js`'s `MM_MAP`/`MMNames` — a cosmetic
// internal-mode name-swap easter egg: index 0 is the real/vendor term
// (e.g. "Kafka"), index 1 is a generic anonymized term (e.g. "Event Bus").
// Source gates the swap behind `internalMode`, itself only ever set from
// `localStorage`, with zero UI in the shipped app that can flip it (the
// stripped `TweaksPanel` never exposed a toggle for it either — confirmed
// by reading `App.js`/`TweaksPanel` in full). Real users only ever see
// index 0. `mmNames()` therefore always resolves the real term; the
// `internalMode` parameter is kept only so this module stays a faithful,
// drop-in port of the source function's shape.

export const MM_MAP = {
  flink: ["Flink", "Stream Processor"],
  kafkastreams: ["Kafka Streams", "Stream Processor"],
  kafka: ["Kafka", "Event Bus"],
  palette: ["palette", "Command Palette"],
  open_lineage: ["OpenLineage", "Lineage Service"],
  datahub: ["DataHub", "Lineage Service"],
  access_gateway: ["Access Gateway", "Access Gateway"],
  dataProjectAcl: ["dataset_acl", "dataset_acl"],
  canonicalEmployee: ["PII_Person", "PII_Person"],
  canonicalApp: ["Service_Identity", "Service_Identity"],
  canonicalCW: ["PII_Contractor", "PII_Contractor"],
  dqOperator: ["ExpectationSuite", "QualityCheck"],
  waitForSignal: ["ExternalTaskSensor", "WaitForSignal"],
  datasetspec: ["DatasetSpec", "DatasetSpec"],
  cube: ["Cube", "MetricsLayer"],
  airflow: ["Airflow", "Scheduler"],
  clickhouse: ["ClickHouse", "RealtimeStore"],
  snowflake: ["Snowflake", "Warehouse"],
} as const;

export type MmTermKey = keyof typeof MM_MAP;
export type MmNames = Readonly<Record<MmTermKey, string>>;

export function mmNames(internalMode = false): MmNames {
  const out = {} as Record<MmTermKey, string>;
  for (const key of Object.keys(MM_MAP) as MmTermKey[]) {
    out[key] = internalMode ? MM_MAP[key][1] : MM_MAP[key][0];
  }
  return out;
}
