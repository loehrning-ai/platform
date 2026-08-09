/**
 * Educational glossary for the loehrning.ai learning platform.
 *
 * Exports only the learner-facing glossary used by <Term> primitives
 * (eu-ai-act-inline.tsx and similar). All commercial stats and urgency
 * copy have been removed. Data-freshness constants live in content-meta.ts.
 */

/* -------------------------------------------------------------------------- */
/*  Inline glossary (used by <Term> primitive)                                */
/*                                                                            */
/*  Single source of truth for short plain-German definitions of every        */
/*  jargon term that appears on the homepage. Any new jargon must land here   */
/*  before it can be wrapped in <Term>. Short definitions fit in a tooltip;   */
/*  long definitions are for the methodology reveals.                         */
/* -------------------------------------------------------------------------- */

export interface GlossaryEntry {
  readonly label: string;
  readonly short: string;
  readonly long?: string;
}

export const glossary: Readonly<Record<string, GlossaryEntry>> = {
  eu_ai_act: {
    label: "EU AI Act",
    short:
      "EU-Verordnung 2024/1689. Art. 4 gilt seit 2. Februar 2025; seit 27. Juli 2026 verlangt er Maßnahmen zur Unterstützung von KI-Kompetenz. Die Risikoklassifizierung ordnet Art. 5, Art. 50, GPAI und Hochrisiko-Pflichten ein.",
    long: "Die EU-KI-Verordnung regelt Anbieter und Betreiber von KI-Systemen rollenbezogen. Art. 4 verlangt kontextbezogene Maßnahmen, die die Entwicklung von KI-Kompetenz unterstützen; er schreibt weder ein bestimmtes Format noch ein individuelles Kompetenzniveau vor. Risikoklassifizierung trennt verbotene Praktiken, Transparenzpflichten, GPAI-Anbieterpflichten und Hochrisiko-Konformitätspflichten. Sanktionen sind pflichtspezifisch: Art. 5 bis 35 Mio. Euro oder 7 %, die meisten anderen Pflichten bis 15 Mio. Euro oder 3 %, Falschangaben bis 7,5 Mio. Euro oder 1 %.",
  },
};
