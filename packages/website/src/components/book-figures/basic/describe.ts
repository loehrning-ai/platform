import {
  formatDecimal,
  formatInterval,
  formatValue,
  SUPPRESSED_LABEL,
  type NumFmt,
} from "@/lib/figures";

export interface Described {
  readonly label: string;
  readonly detail: string;
}

const N_PREFIX = "n";
const NBSP = "\u00a0";

function nText(n: number): string {
  return `${N_PREFIX}${NBSP}=${NBSP}${formatDecimal(n, 0)}`;
}

/**
 * Name and sentence for one value. A null value is a suppressed cell: the
 * sentence says "weniger als 5" and never a number.
 */
export function describeValue(
  fmt: NumFmt,
  name: string,
  value: number | null,
  extra: { lo?: number; hi?: number; n?: number; note?: string } = {},
): Described {
  const { lo, hi, n, note } = extra;
  if (value === null) {
    return {
      label: `${name}: ${SUPPRESSED_LABEL} Treffer`,
      detail: `${name}: ${SUPPRESSED_LABEL} Treffer, deshalb ohne Wert${n !== undefined ? ` (${nText(n)} Firmen)` : ""}.`,
    };
  }
  const parts = [formatValue(fmt, value)];
  if (n !== undefined) parts.push(`${nText(n)}`);
  if (lo !== undefined && hi !== undefined) {
    parts.push(`95-%-Intervall ${formatInterval(fmt, lo, hi)}`);
  }
  return {
    label: `${name}: ${formatValue(fmt, value)}`,
    detail: `${name}: ${parts.join(", ")}.${note ? ` ${note}` : ""}`,
  };
}
