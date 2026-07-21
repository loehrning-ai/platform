import type { ComponentType, JSX } from "react";
import { checkpointLessonId, type DataInfraLessonId } from "@/lib/data-infrastructure/types";
import { StackFlow } from "./widgets/stack-flow";
import { CapTriangle } from "./widgets/cap-triangle";
import { RowColumn } from "./widgets/row-column";
import { PartitionSim } from "./widgets/partition-sim";
import { KafkaTopic } from "./widgets/kafka-topic";
import { Watermark } from "./widgets/watermark";
import { SnapshotTimeline } from "./widgets/snapshot-timeline";
import { BloomFilter } from "./widgets/bloom-filter";
import { CdcFlow } from "./widgets/cdc-flow";
import { BackfillDag } from "./widgets/backfill-dag";
import { SLAdash } from "./widgets/sla-dash";
import { InterviewMove } from "./widgets/interview-move";

/**
 * One-off bespoke simulators, keyed by lesson id — outside the shared
 * `WidgetKind` registry by design (none of these 12 names are reused by any
 * other course). Mirrors `codex`'s `BESPOKE_REGISTRY` precedent, generalized
 * to an array per lesson: two lessons (storage-formats, streaming) mount two
 * simulators each, and two widgets (RowColumn, BackfillDag) are reused
 * verbatim across two lessons each, matching the source's own mount points.
 */
interface BespokeComponentProps {
  readonly lessonId: string;
  readonly cpId: string;
}

interface BespokeSlot {
  readonly Component: ComponentType<BespokeComponentProps>;
  readonly cpId: string;
}

const BESPOKE_REGISTRY: Record<DataInfraLessonId, readonly BespokeSlot[]> = {
  "mental-model": [{ Component: StackFlow, cpId: "flow" }],
  "cap-pacelc": [{ Component: CapTriangle, cpId: "cap" }],
  modeling: [{ Component: RowColumn, cpId: "rc" }],
  "storage-formats": [
    { Component: RowColumn, cpId: "rc" },
    { Component: BloomFilter, cpId: "bf" },
  ],
  lakehouse: [{ Component: SnapshotTimeline, cpId: "snap" }],
  partitioning: [{ Component: PartitionSim, cpId: "part" }],
  "batch-elt": [{ Component: BackfillDag, cpId: "dag" }],
  streaming: [
    { Component: KafkaTopic, cpId: "kafka" },
    { Component: Watermark, cpId: "wm" },
  ],
  "cdc-lambda-kappa": [{ Component: CdcFlow, cpId: "cdc" }],
  idempotency: [{ Component: BackfillDag, cpId: "bdag" }],
  "sla-quality": [{ Component: SLAdash, cpId: "sla" }],
  "interview-playbook": [{ Component: InterviewMove, cpId: "iv" }],
};

export function DataInfraBespokeInteractives({
  lessonId,
}: {
  readonly lessonId: DataInfraLessonId;
}): JSX.Element {
  const slots = BESPOKE_REGISTRY[lessonId];
  const namespacedLessonId = checkpointLessonId(lessonId);
  return (
    <div className="flex flex-col gap-6">
      {slots.map(({ Component, cpId }) => (
        <Component key={cpId} lessonId={namespacedLessonId} cpId={cpId} />
      ))}
    </div>
  );
}

export default DataInfraBespokeInteractives;
