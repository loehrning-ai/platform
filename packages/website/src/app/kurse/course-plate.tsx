import type { RecordKind } from "@/lib/courses/tracks";
import { cn } from "@/lib/utils";

/**
 * Typenschild for the four Lernpfad courses: a machine data plate derived
 * entirely from catalog data, replacing the four near-identical PNG covers.
 * Every course is distinct BY CONSTRUCTION: the oversized step numeral, the
 * fact rows (Umfang, Dauer, Nachweis, Preis), and a geometric watermark form
 * whose family is `(step - 1) % 4` (the four spine plates can never share a
 * form) with FNV-1a-seeded rotation, so a future course five needs zero new
 * assets, zero manifest rows, zero design work.
 *
 * Server-safe on purpose: no hooks, no framer. The assembly animation is CSS
 * keyframes gated by a `data-assembled` attribute that `PlateReveal` sets in
 * view; without JS the plate itself renders settled, and the framer card
 * wrapper around it is covered by the layout's `.js-reveal` noscript rule.
 */

const RECORD_PLATE_LABEL: Record<RecordKind, string | null> = {
  teilnahmebestaetigung: "Teilnahmebestätigung",
  lernnachweis: "Lernnachweis",
  certificate: "Certificate",
  none: null,
};

/** FNV-1a 32-bit; deterministic per slug, stable across deploys. */
function fnv1a(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * One flat Bauhaus form per family, drawn in a 96x96 viewBox. Rendered as a
 * ghost watermark behind the numeral (currentColor at low opacity), rotated
 * in 90-degree steps from the slug hash.
 */
function PlateForm({ family, rotation }: { family: number; rotation: number }) {
  const shape =
    family === 0 ? (
      <circle cx="48" cy="48" r="44" />
    ) : family === 1 ? (
      <rect x="8" y="8" width="80" height="80" />
    ) : family === 2 ? (
      <path d="M48 6 L92 90 L4 90 Z" />
    ) : (
      <path d="M4 92 A44 44 0 0 1 92 92 Z" />
    );

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 96 96"
      className="absolute -right-1 top-0 h-20 w-20 text-foreground/[0.07] sm:h-24 sm:w-24"
      style={{ transform: `rotate(${rotation}deg)` }}
      fill="currentColor"
    >
      {shape}
    </svg>
  );
}

function Rivets() {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute left-2 top-2 h-1 w-1 bg-foreground/25"
      />
      <span
        aria-hidden="true"
        className="absolute right-2 top-2 h-1 w-1 bg-foreground/25"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-2 left-2 h-1 w-1 bg-foreground/25"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-2 right-2 h-1 w-1 bg-foreground/25"
      />
    </>
  );
}

interface PlateRow {
  readonly label: string;
  readonly value: string;
  readonly accent?: boolean;
}

export interface CoursePlateProps {
  readonly slug: string;
  readonly step: number;
  readonly stepCount: number;
  readonly unitCount: number;
  readonly unitLabel: string;
  readonly totalLessons: number;
  readonly duration: string;
  readonly record: RecordKind;
  readonly certified?: boolean;
  readonly certifiedTestId?: string;
}

const pad = (value: number) => String(value).padStart(2, "0");

export function CoursePlate({
  slug,
  step,
  stepCount,
  unitCount,
  unitLabel,
  totalLessons,
  duration,
  record,
  certified,
  certifiedTestId,
}: CoursePlateProps) {
  const hash = fnv1a(slug);
  const family = (step - 1) % 4;
  const rotation = (hash % 4) * 90;
  const recordLabel = RECORD_PLATE_LABEL[record];

  const rows: readonly PlateRow[] = [
    {
      label: "Umfang",
      value: `${pad(unitCount)} ${unitLabel} · ${totalLessons} Lektionen`,
    },
    { label: "Dauer", value: duration },
    ...(recordLabel ? [{ label: "Nachweis", value: recordLabel }] : []),
    // Ink on purpose: the plate carries no Kupfer accent of its own, so the
    // page's accent budget stays with the CTA and the "erreicht" stamp.
    { label: "Preis", value: "Kostenlos" },
  ];

  return (
    // rounded-t-xl is inherited geometry, not plate grammar: the plate bleeds
    // to the edges of the rounded Card shell, so its top corners must follow
    // the shell. Everything belonging to the plate itself stays square.
    <div className="relative -mx-6 -mt-6 mb-5 overflow-hidden rounded-t-xl border-b border-border bg-background bg-dot-pattern">
      <Rivets />
      <div className="grid grid-cols-[1fr_auto] gap-x-5 p-5 sm:p-6">
        <div className="min-w-0">
          <div
            aria-hidden="true"
            className="flex items-baseline justify-between gap-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground"
          >
            <span>Lernpfad</span>
            <span>
              Schritt {pad(step)}/{pad(stepCount)}
            </span>
          </div>
          <span
            aria-hidden="true"
            className="plate-rule mt-2 block h-px w-full origin-left bg-border"
          />
          <dl aria-hidden="true" className="mt-2">
            {rows.map((row, i) => (
              <div
                key={row.label}
                className="plate-row flex items-baseline justify-between gap-4 border-b border-border/60 py-[7px] font-mono text-xs uppercase tracking-[0.08em]"
                style={{ "--row-i": i } as React.CSSProperties}
              >
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd
                  className={cn(
                    "min-w-0 text-right font-bold",
                    row.accent ? "text-brand-orange" : "text-foreground",
                  )}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative w-[84px] sm:w-[104px]">
          <PlateForm family={family} rotation={rotation} />
          <span
            aria-hidden="true"
            className="plate-numeral relative font-mono text-[56px] font-bold leading-none tracking-[-0.04em] text-brand-orange/20 sm:text-[72px]"
          >
            {pad(step)}
          </span>
        </div>
      </div>
      {certified && (
        <span
          data-testid={certifiedTestId}
          className="stamp-in absolute bottom-3 right-5 border border-brand-orange bg-background/90 px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange"
        >
          erreicht
        </span>
      )}
    </div>
  );
}
