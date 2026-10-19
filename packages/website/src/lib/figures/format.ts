/**
 * German number and date formatting. Hand-written so the server, the browser
 * and the PDF script print the same characters whatever ICU data they have.
 */

import type { NumFmt } from "./types.ts";

export const NBSP = " ";
export const MINUS = "−";
export const SUPPRESSED_LABEL = "weniger als 5";

function roundHalfAwayFromZero(v: number, digits: number): number {
  const f = 10 ** digits;
  const scaled = Math.abs(v) * f;
  return (Math.sign(v) * Math.round(scaled + 1e-9)) / f;
}

/** 25581 -> "25.581", 4.04 -> "4,0". Four-digit numbers get the separator too. */
export function formatDecimal(value: number, digits = 0, signed = false): string {
  if (!Number.isFinite(value)) return "";
  const rounded = roundHalfAwayFromZero(value, digits);
  const abs = Math.abs(rounded).toFixed(digits);
  const [intPart = "0", frac] = abs.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const body = frac === undefined ? grouped : `${grouped},${frac}`;
  if (rounded < 0) return `${MINUS}${body}`;
  if (signed && rounded > 0) return `+${body}`;
  return body;
}

function digitsOf(fmt: NumFmt): number {
  if (fmt.digits !== undefined) return fmt.digits;
  return fmt.style === "number" ? 0 : 1;
}

function unitSuffix(fmt: NumFmt): string {
  if (fmt.style === "percent") return `${NBSP}%`;
  return fmt.unit ? `${NBSP}${fmt.unit}` : "";
}

/** A value with its unit; null prints the suppression label. */
export function formatValue(
  fmt: NumFmt,
  value: number | null,
  signed = false,
): string {
  if (value === null) return SUPPRESSED_LABEL;
  return `${formatDecimal(value, digitsOf(fmt), signed)}${unitSuffix(fmt)}`;
}

/** Just the number, without unit. */
export function formatBare(fmt: NumFmt, value: number): string {
  return formatDecimal(value, digitsOf(fmt));
}

/** "3,7 bis 4,2 %" */
export function formatInterval(fmt: NumFmt, lo: number, hi: number): string {
  return `${formatBare(fmt, lo)} bis ${formatBare(fmt, hi)}${unitSuffix(fmt)}`;
}

/** "3,7 bis 4,2" without unit, for tight places. */
export function formatIntervalBare(fmt: NumFmt, lo: number, hi: number): string {
  return `${formatBare(fmt, lo)} bis ${formatBare(fmt, hi)}`;
}

/** "n = 25.581" */
export function formatN(n: number): string {
  return `n${NBSP}=${NBSP}${formatDecimal(n, 0)}`;
}

/** ISO date -> "18.10.2026". Returns the input when it is not an ISO date. */
export function formatDateDe(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}
