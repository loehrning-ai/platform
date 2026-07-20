export type LegalInstrument =
  | "AI Act"
  | "GDPR"
  | "DDG"
  | "TDDDG"
  | "BFSG"
  | "BA funding"
  | "other";

export type LegalClaimStatus =
  | "binding"
  | "adopted-pending-publication"
  | "political-agreement"
  | "draft"
  | "guidance"
  | "secondary";

export interface LegalClaim {
  readonly claimId: string;
  readonly instrument: LegalInstrument;
  readonly article?: string;
  readonly jurisdiction: "EU" | "DE" | "DE-state" | "other";
  readonly status: LegalClaimStatus;
  readonly effectiveDate?: string;
  readonly enforcementDate?: string;
  readonly displayDateDE?: string;
  readonly sourceUrl: string;
  readonly sourceKind: "primary" | "official-guidance" | "secondary";
  readonly lastVerified: string;
  readonly summary: string;
  readonly supersedes?: readonly string[];
}

export const LEGAL_CLAIMS: readonly LegalClaim[] = [
  {
    claimId: "ai-act-entry-into-force-2024-08-01",
    instrument: "AI Act",
    jurisdiction: "EU",
    status: "binding",
    effectiveDate: "2024-08-01",
    displayDateDE: "1. August 2024",
    sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    sourceKind: "official-guidance",
    lastVerified: "2026-06-19",
    summary: "The AI Act entered into force on 1 August 2024.",
  },
  {
    claimId: "ai-act-general-application-2026-08-02",
    instrument: "AI Act",
    jurisdiction: "EU",
    status: "binding",
    effectiveDate: "2026-08-02",
    displayDateDE: "2. August 2026",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    sourceKind: "primary",
    lastVerified: "2026-07-14",
    summary:
      "Article 113 of the original Regulation makes the AI Act generally applicable from 2 August 2026, subject to its express exceptions and later amendments.",
  },
  {
    claimId: "ai-act-article-4-literacy-2025-02-02",
    instrument: "AI Act",
    article: "Article 4",
    jurisdiction: "EU",
    status: "binding",
    effectiveDate: "2025-02-02",
    displayDateDE: "2. Februar 2025",
    sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    sourceKind: "official-guidance",
    lastVerified: "2026-06-19",
    summary:
      "AI literacy obligations under Article 4 entered into application on 2 February 2025.",
  },
  {
    claimId: "ai-literacy-no-required-certificate",
    instrument: "AI Act",
    article: "Article 4",
    jurisdiction: "EU",
    status: "guidance",
    sourceUrl: "https://digital-strategy.ec.europa.eu/en/faqs/ai-literacy-questions-answers",
    sourceKind: "official-guidance",
    lastVerified: "2026-06-19",
    summary:
      "Article 4 is context-specific; the Commission Q&A does not require a specific certificate.",
  },
  {
    claimId: "ai-literacy-supervision-2026-08-02",
    instrument: "AI Act",
    article: "Article 4",
    jurisdiction: "EU",
    status: "guidance",
    enforcementDate: "2026-08-02",
    displayDateDE: "2. August 2026",
    sourceUrl: "https://digital-strategy.ec.europa.eu/en/faqs/ai-literacy-questions-answers",
    sourceKind: "official-guidance",
    lastVerified: "2026-06-19",
    summary:
      "Article 4 supervision and enforcement are tied to the wider AI Act governance timeline, not a standalone February 2025 fine trigger.",
  },
  {
    claimId: "ai-act-gpai-application-2025-08-02",
    instrument: "AI Act",
    jurisdiction: "EU",
    status: "binding",
    effectiveDate: "2025-08-02",
    displayDateDE: "2. August 2025",
    sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    sourceKind: "official-guidance",
    lastVerified: "2026-06-19",
    summary: "Governance rules and obligations for GPAI models became applicable on 2 August 2025.",
  },
  {
    claimId: "ai-act-transparency-application-2026-08-02",
    instrument: "AI Act",
    article: "Article 50",
    jurisdiction: "EU",
    status: "binding",
    effectiveDate: "2026-08-02",
    displayDateDE: "2. August 2026",
    sourceUrl:
      "https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content",
    sourceKind: "official-guidance",
    lastVerified: "2026-07-14",
    summary: "Article 50 transparency obligations become applicable on 2 August 2026.",
  },
  {
    claimId: "ai-act-high-risk-areas-adopted-2027-12-02",
    instrument: "AI Act",
    jurisdiction: "EU",
    status: "adopted-pending-publication",
    effectiveDate: "2027-12-02",
    displayDateDE: "2. Dezember 2027",
    sourceUrl: "https://data.consilium.europa.eu/doc/document/PE-30-2026-INIT/en/pdf",
    sourceKind: "primary",
    lastVerified: "2026-07-16",
    summary:
      "Parliament and Council adopted the AI Omnibus timetable for stand-alone high-risk systems to apply from 2 December 2027; the act was signed on 8 July 2026 and was still awaiting Official Journal publication on 16 July 2026.",
  },
  {
    claimId: "ai-act-product-embedded-high-risk-2028-08-02",
    instrument: "AI Act",
    jurisdiction: "EU",
    status: "adopted-pending-publication",
    effectiveDate: "2028-08-02",
    displayDateDE: "2. August 2028",
    sourceUrl: "https://data.consilium.europa.eu/doc/document/PE-30-2026-INIT/en/pdf",
    sourceKind: "primary",
    lastVerified: "2026-07-16",
    summary:
      "Parliament and Council adopted the AI Omnibus timetable for product-embedded high-risk systems to apply from 2 August 2028; the act was signed on 8 July 2026 and was still awaiting Official Journal publication on 16 July 2026.",
  },
  {
    claimId: "ai-act-regulatory-sandbox-adopted-2027-08-02",
    instrument: "AI Act",
    article: "Article 57",
    jurisdiction: "EU",
    status: "adopted-pending-publication",
    effectiveDate: "2027-08-02",
    displayDateDE: "2. August 2027",
    sourceUrl: "https://data.consilium.europa.eu/doc/document/PE-30-2026-INIT/en/pdf",
    sourceKind: "primary",
    lastVerified: "2026-07-16",
    summary:
      "The adopted AI Omnibus text sets 2 August 2027 as the deadline for Member States to make at least one national AI regulatory sandbox operational; the amending act had not yet entered into force on 16 July 2026.",
  },
  {
    claimId: "ai-act-article-5-prohibited-2025-02-02",
    instrument: "AI Act",
    article: "Article 5",
    jurisdiction: "EU",
    status: "binding",
    effectiveDate: "2025-02-02",
    displayDateDE: "2. Februar 2025",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689",
    sourceKind: "primary",
    lastVerified: "2026-06-20",
    summary:
      "Prohibited AI practices under Article 5 have applied since 2 February 2025, including emotion recognition in workplaces/schools, social scoring, and real-time biometric ID.",
  },
  {
    claimId: "ai-act-watermarking-grace-2026-12-02",
    instrument: "AI Act",
    article: "Article 50",
    jurisdiction: "EU",
    status: "adopted-pending-publication",
    effectiveDate: "2026-12-02",
    displayDateDE: "2. Dezember 2026",
    sourceUrl: "https://data.consilium.europa.eu/doc/document/PE-30-2026-INIT/en/pdf",
    sourceKind: "primary",
    lastVerified: "2026-07-16",
    summary:
      "The adopted AI Omnibus sets 2 December 2026 as the transition deadline for providers of certain existing systems to implement Article 50 marking solutions; the amending act was not yet published on 16 July 2026.",
  },
  {
    claimId: "ai-literacy-no-specific-format",
    instrument: "AI Act",
    article: "Article 4",
    jurisdiction: "EU",
    status: "guidance",
    sourceUrl: "https://digital-strategy.ec.europa.eu/en/faqs/ai-literacy-questions-answers",
    sourceKind: "official-guidance",
    lastVerified: "2026-06-20",
    summary:
      "The Commission Q&A (May 2025) explicitly states that Article 4 does not require measuring employee AI knowledge, does not mandate a specific training format, and imposes no one-size-fits-all approach.",
  },
  {
    claimId: "gpai-code-compliance-demonstration-only",
    instrument: "AI Act",
    article: "Arts. 51-56",
    jurisdiction: "EU",
    status: "guidance",
    effectiveDate: "2025-07-10",
    displayDateDE: "10. Juli 2025",
    sourceUrl:
      "https://digital-strategy.ec.europa.eu/en/library/general-purpose-ai-code-of-practice",
    sourceKind: "official-guidance",
    lastVerified: "2026-06-20",
    summary:
      "The GPAI Code of Practice (10 July 2025) enables providers to demonstrate compliance but does not create a legal presumption of conformity (keine Konformitätsvermutung). Non-signatories must independently demonstrate compliance to the AI Office.",
  },
  {
    claimId: "transparency-code-2026-06-10",
    instrument: "AI Act",
    jurisdiction: "EU",
    status: "guidance",
    effectiveDate: "2026-06-10",
    displayDateDE: "10. Juni 2026",
    sourceUrl:
      "https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content",
    sourceKind: "official-guidance",
    lastVerified: "2026-07-16",
    summary:
      "The voluntary Code of Practice on Transparency of AI-generated content was published on 10 June 2026 as a compliance aid for Article 50(2), (4) and (5). The Commission and the AI Board assessed it as adequate on 8 and 9 July 2026.",
  },
  {
    claimId: "ai-act-regulation-date-2024-06-13",
    instrument: "AI Act",
    jurisdiction: "EU",
    status: "binding",
    displayDateDE: "13. Juni 2024",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    sourceKind: "primary",
    lastVerified: "2026-07-14",
    summary: "Regulation (EU) 2024/1689 is dated 13 June 2024 in the official legal text.",
  },
  {
    claimId: "ai-act-official-journal-publication-2024-07-12",
    instrument: "AI Act",
    jurisdiction: "EU",
    status: "binding",
    displayDateDE: "12. Juli 2024",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    sourceKind: "primary",
    lastVerified: "2026-07-14",
    summary: "Regulation (EU) 2024/1689 was published in the Official Journal on 12 July 2024.",
  },
  {
    claimId: "ai-act-prohibited-practices-guidelines-2025-02-04",
    instrument: "AI Act",
    article: "Article 5",
    jurisdiction: "EU",
    status: "guidance",
    displayDateDE: "4. Februar 2025",
    sourceUrl:
      "https://digital-strategy.ec.europa.eu/en/library/commission-publishes-guidelines-prohibited-artificial-intelligence-ai-practices-defined-ai-act",
    sourceKind: "official-guidance",
    lastVerified: "2026-07-14",
    summary: "The Commission published its guidelines on prohibited AI practices on 4 February 2025.",
  },
  {
    claimId: "ai-act-service-desk-launch-2025-10-08",
    instrument: "AI Act",
    jurisdiction: "EU",
    status: "guidance",
    displayDateDE: "8. Oktober 2025",
    sourceUrl:
      "https://digital-strategy.ec.europa.eu/en/news/commission-launches-ai-act-service-desk-and-single-information-platform-support-ai-act",
    sourceKind: "official-guidance",
    lastVerified: "2026-07-14",
    summary: "The Commission launched the AI Act Service Desk on 8 October 2025.",
  },
  {
    claimId: "ai-act-post-market-template-deadline-2026-02-02",
    instrument: "AI Act",
    article: "Article 72(3)",
    jurisdiction: "EU",
    status: "binding",
    displayDateDE: "2. Februar 2026",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    sourceKind: "primary",
    lastVerified: "2026-07-14",
    summary: "Article 72(3) sets 2 February 2026 as the deadline for the post-market monitoring plan template.",
  },
  {
    claimId: "ai-omnibus-council-adoption-2026-06-29",
    instrument: "AI Act",
    jurisdiction: "EU",
    status: "adopted-pending-publication",
    effectiveDate: "2026-06-29",
    displayDateDE: "29. Juni 2026",
    sourceUrl:
      "https://www.consilium.europa.eu/en/policies/artificial-intelligence-act/timeline-artificial-intelligence/",
    sourceKind: "primary",
    lastVerified: "2026-07-14",
    summary:
      "The Council gave its final approval to the AI Omnibus amending regulation on 29 June 2026.",
  },
  {
    claimId: "ai-omnibus-awaiting-publication-2026-07-14",
    instrument: "AI Act",
    jurisdiction: "EU",
    status: "adopted-pending-publication",
    displayDateDE: "14. Juli 2026",
    sourceUrl:
      "https://oeil.europarl.europa.eu/oeil/en/procedure-file/pdf?reference=2025%2F0359%28COD%29",
    sourceKind: "primary",
    lastVerified: "2026-07-16",
    summary:
      "The adopted AI Omnibus act had not been published in the Official Journal by 14 July 2026 and was therefore not yet in force; re-verification on 16 July 2026 confirmed publication was still pending.",
  },
  {
    claimId: "ai-omnibus-proposal-2025-11-19",
    instrument: "AI Act",
    jurisdiction: "EU",
    status: "draft",
    displayDateDE: "19. November 2025",
    sourceUrl:
      "https://oeil.europarl.europa.eu/oeil/en/procedure-file?reference=2025/0359(COD)",
    sourceKind: "primary",
    lastVerified: "2026-07-16",
    summary:
      "The Commission tabled the Digital Omnibus on AI proposal COM(2025) 836 on 19 November 2025, proposing to postpone the high-risk application dates of Regulation (EU) 2024/1689; superseded by the adopted act.",
  },
  {
    claimId: "ai-omnibus-ep-position-2026-06-16",
    instrument: "AI Act",
    jurisdiction: "EU",
    status: "adopted-pending-publication",
    displayDateDE: "16. Juni 2026",
    sourceUrl:
      "https://oeil.europarl.europa.eu/oeil/en/procedure-file?reference=2025/0359(COD)",
    sourceKind: "primary",
    lastVerified: "2026-07-16",
    summary:
      "The European Parliament adopted its first-reading position on the AI Omnibus amending regulation on 16 June 2026.",
  },
  {
    claimId: "ai-omnibus-signature-2026-07-08",
    instrument: "AI Act",
    jurisdiction: "EU",
    status: "adopted-pending-publication",
    displayDateDE: "8. Juli 2026",
    sourceUrl:
      "https://oeil.europarl.europa.eu/oeil/en/procedure-file?reference=2025/0359(COD)",
    sourceKind: "primary",
    lastVerified: "2026-07-16",
    summary:
      "The final AI Omnibus act was signed on 8 July 2026; it enters into force on the third day following its publication in the Official Journal, which had not occurred by 16 July 2026.",
  },
  {
    claimId: "ai-omnibus-intimate-image-prohibition-2026-12-02",
    instrument: "AI Act",
    article: "Article 5",
    jurisdiction: "EU",
    status: "adopted-pending-publication",
    effectiveDate: "2026-12-02",
    displayDateDE: "2. Dezember 2026",
    sourceUrl: "https://data.consilium.europa.eu/doc/document/PE-30-2026-INIT/en/pdf",
    sourceKind: "primary",
    lastVerified: "2026-07-16",
    summary:
      "The adopted AI Omnibus adds a new Article 5 prohibition on AI systems for generating non-consensual intimate material and child sexual abuse material, applying from 2 December 2026; not yet in force on 16 July 2026.",
  },
  {
    claimId: "ai-act-penalties-art-99-tiers-2025-08-02",
    instrument: "AI Act",
    article: "Article 99",
    jurisdiction: "EU",
    status: "binding",
    effectiveDate: "2025-08-02",
    displayDateDE: "2. August 2025",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689",
    sourceKind: "primary",
    lastVerified: "2026-07-16",
    summary:
      "Article 99 sets fines of up to EUR 35 million or 7% of worldwide annual turnover for prohibited practices, up to EUR 15 million or 3% for most other obligations, and up to EUR 7.5 million or 1% for incorrect information; for SMEs the lower of the two amounts applies.",
  },
  {
    claimId: "ai-act-article-85-complaint-2026-08-02",
    instrument: "AI Act",
    article: "Article 85",
    jurisdiction: "EU",
    status: "binding",
    effectiveDate: "2026-08-02",
    displayDateDE: "2. August 2026",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689",
    sourceKind: "primary",
    lastVerified: "2026-07-16",
    summary:
      "Article 85 gives any natural or legal person the right to lodge a complaint with the relevant market surveillance authority, without prejudice to other remedies; applicable from 2 August 2026 under Article 113.",
  },
  {
    claimId: "ai-act-article-86-explanation-2026-08-02",
    instrument: "AI Act",
    article: "Article 86",
    jurisdiction: "EU",
    status: "binding",
    effectiveDate: "2026-08-02",
    displayDateDE: "2. August 2026",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689",
    sourceKind: "primary",
    lastVerified: "2026-07-16",
    summary:
      "Article 86 grants affected persons the right to a clear and meaningful explanation from the deployer when a decision based on the output of an Annex III high-risk system (except point 2) produces legal or similarly significant adverse effects; applicable from 2 August 2026.",
  },
  {
    claimId: "gpai-commission-enforcement-2026-08-02",
    instrument: "AI Act",
    article: "Article 101",
    jurisdiction: "EU",
    status: "binding",
    effectiveDate: "2026-08-02",
    displayDateDE: "2. August 2026",
    sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    sourceKind: "official-guidance",
    lastVerified: "2026-07-16",
    summary:
      "GPAI provider obligations apply since 2 August 2025, but the Commission's enforcement powers including fines under Article 101 apply from 2 August 2026 (Article 113(b) excepts Article 101 from the 2025 date).",
  },
  {
    claimId: "ai-act-harmonised-standards-pending-2026-07",
    instrument: "AI Act",
    jurisdiction: "EU",
    status: "guidance",
    sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/ai-act-standardisation",
    sourceKind: "official-guidance",
    lastVerified: "2026-07-16",
    summary:
      "Harmonised standards for high-risk AI systems are still being developed by CEN and CENELEC; none had been cited in the Official Journal by mid-July 2026, a key motivation for the AI Omnibus postponement.",
  },
  {
    claimId: "gdpr-art-22-automated-decisions",
    instrument: "GDPR",
    article: "Article 22",
    jurisdiction: "EU",
    status: "binding",
    effectiveDate: "2018-05-25",
    displayDateDE: "25. Mai 2018",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    sourceKind: "primary",
    lastVerified: "2026-07-16",
    summary:
      "Article 22 GDPR grants the right not to be subject to solely automated decisions with legal or similarly significant effects, including the right to human intervention; it is distinct from the AI Act Article 86 explanation right.",
  },
  {
    claimId: "de-ki-mig-bundestag-2026-06-11",
    instrument: "other",
    jurisdiction: "DE",
    status: "draft",
    displayDateDE: "11. Juni 2026",
    sourceUrl: "https://www.bundestag.de/dokumente/textarchiv/2026/kw24-de-ki-1183820",
    sourceKind: "primary",
    lastVerified: "2026-07-14",
    summary: "The Bundestag adopted the amended KI-MIG bill on 11 June 2026.",
  },
  {
    claimId: "de-ki-mig-bundesrat-2026-07-10",
    instrument: "other",
    jurisdiction: "DE",
    status: "draft",
    displayDateDE: "10. Juli 2026",
    sourceUrl: "https://www.bundesrat.de/DE/plenum/bundesrat-kompakt/26/1067/1067-pk.html#top-1",
    sourceKind: "primary",
    lastVerified: "2026-07-14",
    summary: "The KI-MIG bill passed the Bundesrat on 10 July 2026 and can proceed to promulgation.",
  },
  {
    claimId: "openai-gpt-5-5-release-2026-04-23",
    instrument: "other",
    jurisdiction: "other",
    status: "secondary",
    displayDateDE: "23. April 2026",
    sourceUrl: "https://openai.com/index/introducing-gpt-5-5/",
    sourceKind: "primary",
    lastVerified: "2026-07-14",
    summary: "OpenAI published its GPT-5.5 release announcement on 23 April 2026.",
  },
  {
    claimId: "de-e-invoice-receipt-2025-01-01",
    instrument: "other",
    jurisdiction: "DE",
    status: "binding",
    effectiveDate: "2025-01-01",
    displayDateDE: "1. Januar 2025",
    sourceUrl: "https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html",
    sourceKind: "official-guidance",
    lastVerified: "2026-07-14",
    summary: "German businesses have had to support receipt of structured e-invoices since 1 January 2025.",
  },
  {
    claimId: "eu-us-dpf-adequacy-decision-2023-07-10",
    instrument: "GDPR",
    jurisdiction: "EU",
    status: "binding",
    effectiveDate: "2023-07-10",
    displayDateDE: "10. Juli 2023",
    sourceUrl: "https://eur-lex.europa.eu/eli/dec_impl/2023/1795/oj",
    sourceKind: "primary",
    lastVerified: "2026-07-14",
    summary: "The Commission adopted the EU-US Data Privacy Framework adequacy decision on 10 July 2023.",
  },
];

const CLAIMS_BY_ID = new Map(LEGAL_CLAIMS.map((claim) => [claim.claimId, claim]));

export function getLegalClaim(claimId: string): LegalClaim | undefined {
  return CLAIMS_BY_ID.get(claimId);
}

export function requireLegalClaim(claimId: string): LegalClaim {
  const claim = getLegalClaim(claimId);
  if (!claim) throw new Error(`Unknown legal claim: ${claimId}`);
  return claim;
}

export function getClaimsForInstrument(instrument: LegalInstrument): readonly LegalClaim[] {
  return LEGAL_CLAIMS.filter((claim) => claim.instrument === instrument);
}

/**
 * Returns the German-locale display date for a claim.
 * Uses `displayDateDE` if present, otherwise formats `effectiveDate` in German locale.
 * Falls back to `enforcementDate` if `effectiveDate` is absent.
 */
export function getDisplayDate(claimId: string): string | undefined {
  const claim = getLegalClaim(claimId);
  if (!claim) return undefined;

  if (claim.displayDateDE) return claim.displayDateDE;

  const dateStr = claim.effectiveDate ?? claim.enforcementDate;
  if (!dateStr) return undefined;

  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
