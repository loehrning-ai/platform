"use client";

import { useMemo, useState } from "react";
import { formatDecimal, SUPPRESSED_LABEL, type FigureSpecOf } from "@/lib/figures";
import { Controls, Segmented } from "./controls";
import { FigureCanvas } from "./figure-canvas";
import type { WaffleChip } from "./types";

const ALL = "alle";

/** Firms behind a chip: a number from 5 up, or the suppression label. */
function firms(hits: number): string {
  return hits >= 1 && hits <= 4 ? `${SUPPRESSED_LABEL} Firmen` : `${formatDecimal(hits, 0)} Firmen`;
}

/**
 * The spec for one chip. Evidence types overlap, so a chip is its own share
 * of the 100: its dots in the accent, the rest of the "shows something" dots
 * in ink, the "only says" dots as rings.
 */
export function chipSpec(
  base: FigureSpecOf<"waffle">,
  chip: WaffleChip,
): FigureSpecOf<"waffle"> {
  const shows = base.data.groups.find((g) => g.tone === "accent");
  const rest = base.data.groups.filter((g) => g.tone !== "accent");
  const showsDots = shows?.dots ?? 0;
  const own = Math.min(chip.dots, showsDots);
  return {
    ...base,
    alt: `100 Punkte stehen für 100 Firmen, die KI auf ihre Website schreiben. ${own} gefüllte Punkte zeigen: ${chip.label}. ${showsDots - own} dunkle Punkte zeigen einen anderen Beleg, die Ringe sagen es nur.`,
    data: {
      ...base.data,
      headline: `${own} von ${base.data.total}`,
      groups: [
        { id: chip.id, label: chip.label, dots: own, tone: "accent" },
        ...(showsDots - own > 0
          ? [{ id: "anderer-beleg", label: "anderer Beleg", dots: showsDots - own, tone: "ink" as const }]
          : []),
        ...rest,
      ],
    },
  };
}

/** C3: 100 dots; chips light the share that shows one kind of evidence. */
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
    ? `${chip.label}: ${Math.min(chip.dots, spec.data.groups.find((g) => g.tone === "accent")?.dots ?? 0)} von ${total} (${firms(chip.hits)}). Belege überlappen: Eine Firma kann mehrere zeigen.`
    : `${spec.data.headline ?? ""} zeigen mindestens einen konkreten Beleg. Wähle einen Belegtyp, um seinen Anteil zu sehen.`;
  const options = [
    { value: ALL, label: "Alle Belege" },
    ...chips.map((c) => ({ value: c.id, label: c.label })),
  ];
  return (
    <>
      <Controls>
        <Segmented label="Belegtyp" value={chipId} options={options} onChange={setChipId} />
      </Controls>
      <FigureCanvas spec={shown} summary={summary} layoutKey={chipId} />
    </>
  );
}
