/**
 * Externally-published, research-founded benchmarks cited on loehrning.ai.
 *
 * Rule: every citation on the homepage that is NOT our own measurement
 * must trace back to an entry here. Each entry carries a named publisher,
 * year, and (where available) sample size so readers can verify.
 */

export type BenchmarkTopic =
  | "adoption"
  | "compliance"
  | "failure"
  | "readiness"
  | "market"
  | "skills";

export interface ExternalBenchmark {
  /** Stable id for programmatic access (snake_case). */
  readonly id: string;
  /** Display value as a string, e.g. "41 %", "2,7 Mio.", "~4 %". */
  readonly value: string;
  /** One-sentence plain-German meaning. */
  readonly plain: string;
  /** Named publisher, e.g. "Bitkom Research". */
  readonly publisher: string;
  /** Year of publication, e.g. "2026". */
  readonly year: string;
  /** Optional sample size disclosure, e.g. "N = 604". */
  readonly sampleSize?: string;
  /** Optional external URL to the source. */
  readonly href?: string;
  /** Topic tag for filtering. */
  readonly topic: BenchmarkTopic;
}

export const externalBenchmarks: readonly ExternalBenchmark[] = [
  {
    id: "bitkom_2026_adoption",
    value: "41 %",
    plain: "der deutschen Unternehmen nutzen KI aktiv. Also 59 % noch nicht.",
    publisher: "Bitkom Research",
    year: "2026",
    sampleSize: "N = 604",
    topic: "adoption",
  },
  {
    id: "bitkom_2025_eu_ai_act_help",
    value: "69 %",
    plain: "der Unternehmen brauchen Hilfe bei der Umsetzung des EU AI Act.",
    publisher: "Bitkom",
    year: "2025",
    topic: "compliance",
  },
  {
    id: "gartner_2025_ai_fail",
    value: "60 %",
    plain: "der KI-Projekte scheitern an mangelhafter Datenqualität.",
    publisher: "Gartner",
    year: "2025",
    topic: "failure",
  },
  {
    id: "bcg_2025_no_value",
    value: "74 %",
    plain: "der Unternehmen sehen keinen echten Nutzen aus ersten KI-Investitionen.",
    publisher: "BCG",
    year: "2025",
    topic: "failure",
  },
  {
    id: "ifo_2024_handwerk",
    value: "~4 %",
    plain: "des deutschen Handwerks nutzt überhaupt KI.",
    publisher: "ifo Institut",
    year: "2024/25",
    topic: "adoption",
  },
  {
    id: "applied_ai_2025_competency",
    value: "82 %",
    plain: "der KMU fehlt KI-Kompetenz im Team.",
    publisher: "Applied AI / KMU-Studie",
    year: "2025",
    topic: "skills",
  },
  {
    id: "destatis_2024_smes",
    value: "2,7 Mio.",
    plain: "KMU in Deutschland (offizielle Marktgröße).",
    publisher: "Destatis",
    year: "2024",
    topic: "market",
  },
  {
    id: "cisco_2025_ready",
    value: "13 %",
    plain: "der Unternehmen weltweit sind wirklich KI-bereit.",
    publisher: "Cisco AI Readiness Index",
    year: "2025",
    topic: "readiness",
  },
  {
    id: "bitkom_2025_it_positions",
    value: "109.000",
    plain: "unbesetzte IT-Stellen in Deutschland.",
    publisher: "Bitkom",
    year: "2025",
    topic: "skills",
  },
];

export function benchmarkById(id: string): ExternalBenchmark | undefined {
  return externalBenchmarks.find((b) => b.id === id);
}

export function benchmarksByTopic(
  topic: BenchmarkTopic,
): readonly ExternalBenchmark[] {
  return externalBenchmarks.filter((b) => b.topic === topic);
}

export function benchmarksByIds(
  ids: readonly string[],
): readonly ExternalBenchmark[] {
  return ids
    .map((id) => benchmarkById(id))
    .filter((b): b is ExternalBenchmark => b !== undefined);
}
