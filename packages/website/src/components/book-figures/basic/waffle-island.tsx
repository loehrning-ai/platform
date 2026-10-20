"use client";

import { useMemo, useState } from "react";
import type { FigureSpecOf } from "@/lib/figures";
import { Controls, Segmented } from "./controls";
import { FigureCanvas } from "./figure-canvas";
import type { WaffleChip } from "./types";

const ALL = "alle";

/**
 * The spec for one chip. A chip is one reading of the question: its dots in the
 * accent, every other dot as a ring. The readings are nested (the broad one
 * contains the narrow one), so a chip is simply its own share of the 100.
 */
export function chipSpec(
  base: FigureSpecOf<"waffle">,
  chip: WaffleChip,
): FigureSpecOf<"waffle"> {
  const total = base.data.total;
  const own = Math.min(chip.dots, total);
  const rest = base.data.groups.find((g) => g.tone === "ring");
  return {
    ...base,
    alt: `100 Punkte stehen für 100 Firmenseiten, die KI erwähnen. ${own} gefüllte Punkte zeigen etwas Konkretes (${chip.label.toLowerCase()}). Die übrigen ${total - own} Ringe zeigen in dieser Lesart nichts Konkretes.`,
    data: {
      ...base.data,
      headline: `${own} von ${total}`,
      groups: [
        { id: chip.id, label: `${chip.label}: zeigt etwas Konkretes`, dots: own, tone: "accent" },
        ...(total - own > 0
          ? [{ id: rest?.id ?? "rest", label: `${chip.label}: zeigt nichts Konkretes`, dots: total - own, tone: "ring" as const }]
          : []),
      ],
    },
  };
}

/** C3: 100 dots; the chips switch between the narrow and the broad reading of "konkret". */
export function WaffleIsland({
  spec,
  chips,
}: {
  readonly spec: FigureSpecOf<"waffle">;
  readonly chips: readonly WaffleChip[];
}) {
  const [chipId, setChipId] = useState<string>(ALL);
  const chip = chips.find((c) => c.id === chipId);
  const shown = useMemo(() => (chip ? chipSpec(spec, chip) : spec), [spec, chip]);
  const total = spec.data.total;
  const summary = chip
    ? `${chip.label}: ${Math.min(chip.dots, total)} von ${total}. Die Zahl hängt davon ab, was man konkret nennt.`
    : `${spec.data.headline ?? ""} zeigen etwas Konkretes, je nach Lesart. Wähle eine Lesart, um ihren Anteil zu sehen.`;
  const options = [
    { value: ALL, label: "Beide Lesarten" },
    ...chips.map((c) => ({ value: c.id, label: c.label })),
  ];
  return (
    <>
      <Controls>
        <Segmented label="Lesart" value={chipId} options={options} onChange={setChipId} />
      </Controls>
      <FigureCanvas spec={shown} summary={summary} layoutKey={chipId} />
    </>
  );
}
