import { describe, expect, it } from "vitest";
import { getDataInfraCourseCopy } from "./course-copy";
import mentalModelEn from "./lessons/mental-model";
import mentalModelDe from "./lessons/de/mental-model";
import capPacelcEn from "./lessons/cap-pacelc";
import capPacelcDe from "./lessons/de/cap-pacelc";
import modelingEn from "./lessons/modeling";
import modelingDe from "./lessons/de/modeling";
import storageFormatsEn from "./lessons/storage-formats";
import storageFormatsDe from "./lessons/de/storage-formats";
import lakehouseEn from "./lessons/lakehouse";
import lakehouseDe from "./lessons/de/lakehouse";
import partitioningEn from "./lessons/partitioning";
import partitioningDe from "./lessons/de/partitioning";
import batchEltEn from "./lessons/batch-elt";
import batchEltDe from "./lessons/de/batch-elt";
import streamingEn from "./lessons/streaming";
import streamingDe from "./lessons/de/streaming";
import cdcEn from "./lessons/cdc-lambda-kappa";
import cdcDe from "./lessons/de/cdc-lambda-kappa";
import idempotencyEn from "./lessons/idempotency";
import idempotencyDe from "./lessons/de/idempotency";
import slaQualityEn from "./lessons/sla-quality";
import slaQualityDe from "./lessons/de/sla-quality";
import interviewEn, {
  INTERVIEW_MOVES as INTERVIEW_MOVES_EN,
} from "./lessons/interview-playbook";
import interviewDe, {
  INTERVIEW_MOVES as INTERVIEW_MOVES_DE,
} from "./lessons/de/interview-playbook";

const ENGLISH = [
  mentalModelEn,
  capPacelcEn,
  modelingEn,
  storageFormatsEn,
  lakehouseEn,
  partitioningEn,
  batchEltEn,
  streamingEn,
  cdcEn,
  idempotencyEn,
  slaQualityEn,
  interviewEn,
  INTERVIEW_MOVES_EN,
];

const GERMAN = [
  mentalModelDe,
  capPacelcDe,
  modelingDe,
  storageFormatsDe,
  lakehouseDe,
  partitioningDe,
  batchEltDe,
  streamingDe,
  cdcDe,
  idempotencyDe,
  slaQualityDe,
  interviewDe,
  INTERVIEW_MOVES_DE,
];

function visibleText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(visibleText).join("\n");
  if (value !== null && typeof value === "object") {
    return Object.values(value).map(visibleText).join("\n");
  }
  return "";
}

describe("Data Infrastructure content-quality guard", () => {
  it("keeps retired absolute and time-bound claims out of both lesson bundles", () => {
    expect(visibleText(ENGLISH)).not.toMatch(
      /Kappa (?:won|is winning)|two engines dominate|milliseconds are possible|typically 1-30s|essentially zero source load|captures every commit exactly once|LSN jump[^\n]*missing|Iceberg has won|pick Iceberg unless|re-running is free|time travel is free|always use event time|How to never debug at 2am|12KB\/sec|Live simulator|architecturally superior/iu,
    );
    expect(visibleText(GERMAN)).not.toMatch(
      /Kappa[^\n]*(?:Vorgabe|durchgesetzt)|Millisekunden sind möglich|typischerweise 1-30s|kaum zusätzliche Last|jeden Commit[^\n]*genau einmal|LSN[^\n]*Ereignisse fehlen|Iceberg[^\n]*Vorgabe|Ereigniszeit[^\n]*immer|12KB\/s|Live-Simulation|architektonisch überlegen/iu,
    );
  });

  it("discloses the limits of every course-owned interactive model", () => {
    expect(getDataInfraCourseCopy("en").reader.simulatorBody).toMatch(
      /fixed sample data.*do not benchmark/iu,
    );
    expect(getDataInfraCourseCopy("de").reader.simulatorBody).toMatch(
      /feste Beispieldaten.*weder Produktleistung noch reale Latenz oder Kapazität/iu,
    );
  });
});
