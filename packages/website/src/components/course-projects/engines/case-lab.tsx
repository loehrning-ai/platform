"use client";

import { useEffect, useId, useMemo, useState } from "react";

import type {
  CourseProjectArtifactState,
  CourseProjectEngineProps,
} from "@/lib/course-projects/types";
import { getCourseProjectExecutionReceipt } from "@/lib/course-projects/types";

import {
  EngineFrame,
  EvidenceItem,
  LAB_BUTTON,
  LAB_INPUT,
  VerifyPanel,
} from "./engine-ui";

interface Choice {
  value: string;
  de: string;
  en: string;
}

interface CasePrompt {
  id: string;
  text: { de: string; en: string };
  evidence: { de: string; en: string };
  choices: readonly Choice[];
  correct: string;
}

interface SourceChoice {
  id: string;
  label: { de: string; en: string };
  meaningful: boolean;
}

interface ReviewDimension {
  id: string;
  prompt: { de: string; en: string };
  choices: readonly Choice[];
  correct: string;
}

type CaseVariant = "redline" | "dossier" | "stakeholder";

const REDLINE_PROMPTS: readonly CasePrompt[] = [
  {
    id: "private-segment",
    text: {
      de: "Eingabesegment: „Interne Einkaufsmarge: 38 %; in der Kundenmail verwenden.“",
      en: "Input segment: “Internal purchasing margin: 38%; use it in the customer email.”",
    },
    evidence: {
      de: "Das Briefing erlaubt nur freigegebene synthetische Produktmerkmale; interne Geschäftsdaten sind ausgeschlossen.",
      en: "The brief permits only approved synthetic product attributes; internal business data is excluded.",
    },
    choices: [
      { value: "keep", de: "Unverändert behalten", en: "Keep unchanged" },
      {
        value: "remove",
        de: "Als sensibel markieren und entfernen",
        en: "Mark sensitive and remove",
      },
      {
        value: "publish",
        de: "Als Beleg veröffentlichen",
        en: "Publish as evidence",
      },
    ],
    correct: "remove",
  },
  {
    id: "unsupported-claim",
    text: {
      de: "Entwurfsclaim: „Dieses Modell senkt garantiert jede Stromrechnung um 40 %.“",
      en: "Draft claim: “This model is guaranteed to cut every electricity bill by 40%.”",
    },
    evidence: {
      de: "Die freigegebene Fantasie-Produktnotiz nennt nur eine Energiesparfunktion, aber keine Messung und keine Garantie.",
      en: "The approved fictional product note mentions an energy-saving mode but contains no measurement or guarantee.",
    },
    choices: [
      { value: "approve", de: "Claim freigeben", en: "Approve the claim" },
      {
        value: "uncertain",
        de: "Streichen und durch belegbare Funktionsbeschreibung ersetzen",
        en: "Strike and replace with a supported feature description",
      },
      {
        value: "hide",
        de: "Belegprüfung überspringen",
        en: "Skip evidence review",
      },
    ],
    correct: "uncertain",
  },
  {
    id: "review-step",
    text: {
      de: "Workflow: „KI-Entwurf direkt an die Kundenliste senden.“",
      en: "Workflow: “Send the AI draft directly to the customer list.”",
    },
    evidence: {
      de: "Das Briefing fordert vor externer Nutzung eine menschliche Prüfung von Claims, Empfängern und Handlungsaufforderung.",
      en: "The brief requires human review of claims, recipients, and calls to action before external use.",
    },
    choices: [
      {
        value: "auto",
        de: "Automatischen Versand behalten",
        en: "Keep automatic delivery",
      },
      {
        value: "review",
        de: "Menschliche Freigabe einfügen",
        en: "Insert human approval",
      },
      {
        value: "delete",
        de: "Gesamten Workflow löschen",
        en: "Delete the entire workflow",
      },
    ],
    correct: "review",
  },
] as const;

const DOSSIER_PROMPTS: readonly CasePrompt[] = [
  {
    id: "system-boundary",
    text: {
      de: "Das System sortiert synthetische Bewerbungsprofile vor, bevor Menschen Ausbildungsangebote vergeben.",
      en: "The system pre-sorts synthetic applicant profiles before people allocate apprenticeship opportunities.",
    },
    evidence: {
      de: "Die Vorsortierung beeinflusst den Zugang zu einem Ausbildungsangebot; die genaue menschliche Kontrolle ist unbekannt.",
      en: "Pre-sorting influences access to an apprenticeship opportunity; the exact human control is unknown.",
    },
    choices: [
      {
        value: "trivial",
        de: "Reine Komfortfunktion",
        en: "Convenience feature only",
      },
      {
        value: "impact",
        de: "Beschäftigungsnahen Risikopfad prüfen",
        en: "Assess the employment-related risk path",
      },
      {
        value: "verdict",
        de: "Sofort endgültig rechtswidrig",
        en: "Immediately and definitively unlawful",
      },
    ],
    correct: "impact",
  },
  {
    id: "roles",
    text: {
      de: "Ein Anbieter entwickelt das Modell; die Stadt legt Zweck, Datenfelder und Einsatz im Auswahlprozess fest.",
      en: "A vendor develops the model; the city sets the purpose, data fields, and use in the selection process.",
    },
    evidence: {
      de: "Mehrere Akteure können unterschiedliche Rollen und zeitgebundene Pflichten haben.",
      en: "Several actors can hold distinct roles and time-bound duties.",
    },
    choices: [
      {
        value: "vendor-only",
        de: "Nur den Anbieter dokumentieren",
        en: "Document only the vendor",
      },
      {
        value: "map",
        de: "Anbieter und Betreiber getrennt zuordnen",
        en: "Map provider and deployer separately",
      },
      { value: "none", de: "Keine Rolle festhalten", en: "Record no role" },
    ],
    correct: "map",
  },
  {
    id: "legal-evidence",
    text: {
      de: "Unbekannt sind Vertragsfassung, Modellversion, Kontrollbefugnis und Rechtsstand der Quelle.",
      en: "The contract version, model version, control authority, and legal-source date are unknown.",
    },
    evidence: {
      de: "Eine belastbare Fallakte muss fehlende Tatsachen und datierte Primärquellen sichtbar lassen.",
      en: "A defensible case file must keep missing facts and dated primary sources visible.",
    },
    choices: [
      {
        value: "assume",
        de: "Lücken durch Annahmen schließen",
        en: "Fill gaps with assumptions",
      },
      {
        value: "open",
        de: "Als offene Rechts- und Tatsachenfragen führen",
        en: "Record as open legal and factual questions",
      },
      {
        value: "ignore",
        de: "Aus der Akte entfernen",
        en: "Remove from the file",
      },
    ],
    correct: "open",
  },
] as const;

const STAKEHOLDER_PROMPTS: readonly CasePrompt[] = [
  {
    id: "claim",
    text: {
      de: "Cliptext: „Das Werk schließt am Freitag.“",
      en: "Clip caption: “The factory closes on Friday.”",
    },
    evidence: {
      de: "Der Text ist eine Behauptung eines fiktiven Accounts, keine direkt beobachtbare Tatsache.",
      en: "The caption is a claim from a fictional account, not a directly observable fact.",
    },
    choices: [
      { value: "fact", de: "Bestätigte Tatsache", en: "Confirmed fact" },
      { value: "claim", de: "Unbestätigte Behauptung", en: "Unverified claim" },
      {
        value: "proof",
        de: "Authentizitätsbeweis",
        en: "Proof of authenticity",
      },
    ],
    correct: "claim",
  },
  {
    id: "observation",
    text: {
      de: "Beobachtung: Im Video springt die Uhranzeige zwischen zwei Frames um neun Minuten.",
      en: "Observation: the clock display jumps nine minutes between two video frames.",
    },
    evidence: {
      de: "Der Sprung ist beobachtbar; Ursache und Absicht lassen sich daraus nicht ableiten.",
      en: "The jump is observable; its cause and intent cannot be inferred from it.",
    },
    choices: [
      {
        value: "signal",
        de: "Prüfsignal, kein Echtheitsurteil",
        en: "Review signal, not an authenticity verdict",
      },
      { value: "fake", de: "Beweis für Fälschung", en: "Proof of fabrication" },
      { value: "irrelevant", de: "Immer irrelevant", en: "Always irrelevant" },
    ],
    correct: "signal",
  },
  {
    id: "stakeholders",
    text: {
      de: "Eine vorschnelle Meldung könnte Beschäftigte, Familien, Lieferanten und den fiktiven Ort betreffen.",
      en: "A premature report could affect workers, families, suppliers, and the fictional town.",
    },
    evidence: {
      de: "Schadens- und Korrekturplanung gehören in die Publikationsentscheidung.",
      en: "Harm and correction planning belong in the publication decision.",
    },
    choices: [
      {
        value: "publish",
        de: "Sofort als Fakt veröffentlichen",
        en: "Publish immediately as fact",
      },
      {
        value: "hold",
        de: "Zurückhalten, gegenprüfen und Korrekturweg planen",
        en: "Hold, cross-check, and plan correction",
      },
      { value: "erase", de: "Alle Hinweise löschen", en: "Delete all signals" },
    ],
    correct: "hold",
  },
] as const;

const REVIEW_DIMENSIONS: Readonly<
  Record<CaseVariant, readonly ReviewDimension[]>
> = {
  redline: [
    {
      id: "boundary",
      prompt: {
        de: "Welche Grenze gilt für die externe Aussage?",
        en: "Which boundary governs the external claim?",
      },
      choices: [
        {
          value: "supported-only",
          de: "Nur belegte Produktmerkmale nennen",
          en: "State supported product attributes only",
        },
        {
          value: "persuasive-first",
          de: "Überzeugung vor Beleg stellen",
          en: "Put persuasion ahead of evidence",
        },
      ],
      correct: "supported-only",
    },
    {
      id: "uncertainty",
      prompt: {
        de: "Wie wird die fehlende Messung behandelt?",
        en: "How is the missing measurement handled?",
      },
      choices: [
        {
          value: "no-measurement",
          de: "Messwert und Garantie ausdrücklich nicht behaupten",
          en: "Explicitly decline to claim a metric or guarantee",
        },
        {
          value: "estimate",
          de: "Einen plausiblen Wert schätzen",
          en: "Estimate a plausible value",
        },
      ],
      correct: "no-measurement",
    },
    {
      id: "escalation",
      prompt: {
        de: "Welche Freigabe stoppt den automatischen Versand?",
        en: "Which gate stops automatic delivery?",
      },
      choices: [
        {
          value: "human-approval",
          de: "Menschliche Claim- und Empfängerprüfung",
          en: "Human claim and recipient review",
        },
        {
          value: "model-confidence",
          de: "Modellkonfidenz allein",
          en: "Model confidence alone",
        },
      ],
      correct: "human-approval",
    },
    {
      id: "next-evidence",
      prompt: {
        de: "Welcher Beleg wäre der nächste zulässige Schritt?",
        en: "What evidence is the next admissible step?",
      },
      choices: [
        {
          value: "approved-measurement",
          de: "Freigegebene Messung mit Methodik",
          en: "Approved measurement with methodology",
        },
        {
          value: "internal-margin",
          de: "Interne Marge als Ersatzbeleg",
          en: "Internal margin as substitute evidence",
        },
      ],
      correct: "approved-measurement",
    },
  ],
  dossier: [
    {
      id: "boundary",
      prompt: {
        de: "Welche Schlussfolgerung trägt die aktuelle Akte?",
        en: "Which conclusion does the current file support?",
      },
      choices: [
        {
          value: "provisional-role-risk",
          de: "Vorläufige Rollen- und Risikoprüfung",
          en: "Provisional role and risk assessment",
        },
        {
          value: "final-illegal",
          de: "Endgültiges Rechtswidrigkeitsurteil",
          en: "Final illegality verdict",
        },
      ],
      correct: "provisional-role-risk",
    },
    {
      id: "uncertainty",
      prompt: {
        de: "Wie bleiben fehlende Tatsachen und Rechtsstand sichtbar?",
        en: "How do missing facts and legal status remain visible?",
      },
      choices: [
        {
          value: "open-facts-law",
          de: "Als offene Tatsachen- und Rechtsfragen",
          en: "As open factual and legal questions",
        },
        {
          value: "assumed-complete",
          de: "Als stillschweigend geklärt",
          en: "As implicitly resolved",
        },
      ],
      correct: "open-facts-law",
    },
    {
      id: "escalation",
      prompt: {
        de: "Wer muss die offene Einordnung übernehmen?",
        en: "Who must own the unresolved classification?",
      },
      choices: [
        {
          value: "legal-owner-review",
          de: "Benannte Fach- und Rechtsprüfung",
          en: "Named domain and legal review",
        },
        {
          value: "vendor-slogan",
          de: "Anbieterwerbung entscheidet",
          en: "Vendor marketing decides",
        },
      ],
      correct: "legal-owner-review",
    },
    {
      id: "next-evidence",
      prompt: {
        de: "Welcher Beleg schließt die wichtigste Lücke?",
        en: "Which evidence closes the main gap?",
      },
      choices: [
        {
          value: "dated-primary-source",
          de: "Datierte Primärquelle und Systemversion",
          en: "Dated primary source and system version",
        },
        {
          value: "undated-summary",
          de: "Undatierte Zusammenfassung",
          en: "Undated summary",
        },
      ],
      correct: "dated-primary-source",
    },
  ],
  stakeholder: [
    {
      id: "boundary",
      prompt: {
        de: "Wie darf der Clip aktuell beschrieben werden?",
        en: "How may the clip currently be described?",
      },
      choices: [
        {
          value: "claim-not-fact",
          de: "Behauptung, nicht bestätigte Tatsache",
          en: "A claim, not a confirmed fact",
        },
        {
          value: "verified-closure",
          de: "Bestätigte Werksschließung",
          en: "Confirmed factory closure",
        },
      ],
      correct: "claim-not-fact",
    },
    {
      id: "uncertainty",
      prompt: {
        de: "Was beweist der Zeitsprung nicht?",
        en: "What does the time jump not establish?",
      },
      choices: [
        {
          value: "cause-unknown",
          de: "Ursache und Absicht bleiben unbekannt",
          en: "Cause and intent remain unknown",
        },
        {
          value: "fabrication-proven",
          de: "Fälschung ist bewiesen",
          en: "Fabrication is proven",
        },
      ],
      correct: "cause-unknown",
    },
    {
      id: "escalation",
      prompt: {
        de: "Welche Publikationskontrolle begrenzt Schaden?",
        en: "Which publication control limits harm?",
      },
      choices: [
        {
          value: "hold-correct",
          de: "Zurückhalten, gegenprüfen, Korrekturweg planen",
          en: "Hold, cross-check, and plan correction",
        },
        {
          value: "publish-delete",
          de: "Sofort publizieren und später löschen",
          en: "Publish now and delete later",
        },
      ],
      correct: "hold-correct",
    },
    {
      id: "next-evidence",
      prompt: {
        de: "Welcher nächste Pfad ist unabhängig?",
        en: "Which next path is independent?",
      },
      choices: [
        {
          value: "independent-source",
          de: "Originalquelle plus unabhängige Stellungnahme",
          en: "Original source plus independent statement",
        },
        {
          value: "same-account-repost",
          de: "Repost desselben Accounts",
          en: "Repost from the same account",
        },
      ],
      correct: "independent-source",
    },
  ],
};

function branchFor(courseSlug: string): CaseVariant {
  if (courseSlug === "ki-fuehrerschein") return "redline";
  if (courseSlug === "ki-und-gesellschaft") return "stakeholder";
  return "dossier";
}

export default function CaseLab({
  config,
  locale,
  initialArtifact,
  verificationEnabled = true,
  onMeaningfulInteraction,
  onExecutionReceipt,
  onArtifactChange,
  onVerified,
}: CourseProjectEngineProps) {
  const noteId = useId();
  const variant = branchFor(String(config.courseSlug));
  const prompts =
    variant === "redline"
      ? REDLINE_PROMPTS
      : variant === "stakeholder"
        ? STAKEHOLDER_PROMPTS
        : DOSSIER_PROMPTS;
  const reviewDimensions = REVIEW_DIMENSIONS[variant];
  const sources: readonly SourceChoice[] =
    variant === "redline"
      ? [
          {
            id: "product-note",
            label: {
              de: "Freigegebene Fantasie-Produktnotiz",
              en: "Approved fictional product note",
            },
            meaningful: true,
          },
          {
            id: "review-policy",
            label: {
              de: "Interne Prüfregel des Übungsfalls",
              en: "Exercise review policy",
            },
            meaningful: true,
          },
          {
            id: "margin",
            label: {
              de: "Entfernte interne Margennotiz",
              en: "Removed internal margin note",
            },
            meaningful: false,
          },
        ]
      : variant === "stakeholder"
        ? [
            {
              id: "origin",
              label: {
                de: "Fiktiver Originalclip mit Zeitstempel",
                en: "Fictional original clip with timestamp",
              },
              meaningful: true,
            },
            {
              id: "city",
              label: {
                de: "Unabhängige Stellungnahme der Fantasie-Stadt",
                en: "Independent statement from the fictional city",
              },
              meaningful: true,
            },
            {
              id: "repost",
              label: {
                de: "Kopie desselben anonymen Accounts",
                en: "Copy from the same anonymous account",
              },
              meaningful: false,
            },
          ]
        : [
            {
              id: "system-card",
              label: {
                de: "Datierte System- und Versionskarte",
                en: "Dated system and version card",
              },
              meaningful: true,
            },
            {
              id: "primary-law",
              label: {
                de: "Datierte Primärquelle zum Rechtsstand",
                en: "Dated primary source for the legal position",
              },
              meaningful: true,
            },
            {
              id: "vendor-slogan",
              label: {
                de: "Undatierter Anbieter-Werbesatz",
                en: "Undated vendor marketing claim",
              },
              meaningful: false,
            },
          ];
  const initialFields =
    initialArtifact?.engineKind === "case" ? initialArtifact.fields : {};
  const expectedExecutionReceipt = getCourseProjectExecutionReceipt(
    config.courseSlug,
  );
  const initialResponses = Array.isArray(initialFields.responses)
    ? Object.fromEntries(
        initialFields.responses.flatMap((entry) => {
          const separator = entry.indexOf(":");
          return separator > 0
            ? [[entry.slice(0, separator), entry.slice(separator + 1)]]
            : [];
        }),
      )
    : {};
  const [responses, setResponses] =
    useState<Record<string, string>>(initialResponses);
  const [selectedSources, setSelectedSources] = useState<string[]>(
    Array.isArray(initialFields.sources) ? [...initialFields.sources] : [],
  );
  const initialReviewDecisions = Array.isArray(initialFields.review)
    ? Object.fromEntries(
        initialFields.review.flatMap((entry) => {
          const separator = entry.indexOf(":");
          return separator > 0
            ? [[entry.slice(0, separator), entry.slice(separator + 1)]]
            : [];
        }),
      )
    : {};
  const [reviewDecisions, setReviewDecisions] = useState<
    Record<string, string>
  >(initialReviewDecisions);
  const [note, setNote] = useState("");
  const [executionReceipt, setExecutionReceipt] = useState(
    initialFields.executionReceipt === expectedExecutionReceipt
      ? expectedExecutionReceipt
      : null,
  );
  const [verified, setVerified] = useState(false);

  const copy =
    locale === "de"
      ? {
          engine:
            variant === "redline"
              ? "Claim- und Datenschutz-Redline"
              : variant === "stakeholder"
                ? "Stakeholder-Evidenzkarte"
                : "System- und Rechtsdossier",
          honest:
            variant === "dossier"
              ? "Synthetischer Lernfall · kein Rechtsurteil oder Rechtsrat"
              : "Synthetischer Lernfall · keine realen Personen, Konten oder Geschäftsdaten",
          workTitle:
            variant === "redline"
              ? "Redline-Entscheidungen"
              : variant === "stakeholder"
                ? "Behauptung, Beobachtung und Wirkung trennen"
                : "Systemgrenze, Rollen und offene Fragen",
          evidenceLabel: "Fallbeleg",
          sourceTitle:
            variant === "stakeholder"
              ? "Unabhängige Quellenpfade auswählen"
              : "Belastbare Evidenz in die Akte aufnehmen",
          note:
            variant === "redline"
              ? "Freigabevermerk mit Ersatzformulierung"
              : variant === "stakeholder"
                ? "Publikations- und Korrekturvermerk"
                : "Offene Frage und Eskalationsvermerk",
          notePlaceholder:
            variant === "redline"
              ? "Die Garantie wird durch eine belegte Beschreibung der Energiesparfunktion ersetzt; Versand erst nach menschlicher Prüfung."
              : variant === "stakeholder"
                ? "Nicht als Fakt veröffentlichen; zuerst unabhängige Quelle prüfen und Betroffene bei einer Korrektur sichtbar informieren."
                : "Kontrollbefugnis und Modellversion mit datierter Primärquelle klären; bis dahin keine endgültige Klassifikation behaupten.",
          choicesEvidence: "Alle Fallstellen evidenzgerecht bearbeitet",
          sourcesEvidence: "Zwei voneinander belastbare Evidenzpfade gewählt",
          noteEvidence:
            "Grenze, Unsicherheit, Eskalation und nächster Beleg festgelegt",
          noteScratch: "Optionale Sitzungsnotiz · wird nicht gespeichert",
          localRunTitle: "Lokale synthetische Auswertung",
          localRunHelp:
            "Führt ausschließlich die feste Auswahlakte gegen die sichtbaren Kursregeln aus. Kein Modell, Provider oder externer Dienst wird aufgerufen.",
          localRun: "Strukturierte Auswertung ausführen",
          localRunComplete: "Feste Auswahlakte lokal erfolgreich ausgewertet.",
          localRunEvidence: "Lokale strukturierte Auswertung erfolgreich",
          pending:
            "Fallstellen, Evidenzpfade und vier Prüfdimensionen abschließen.",
          ready: "Fallakte und Unsicherheitsgrenzen sind prüfbar.",
          summary:
            variant === "redline"
              ? "Redline verifiziert: sensibles Segment entfernt, unbelegten Claim ersetzt und menschliche Freigabe ergänzt."
              : variant === "stakeholder"
                ? "Evidenzkarte verifiziert: Behauptung und Beobachtung getrennt, unabhängige Quellen gewählt und Publikationsrisiko dokumentiert."
                : "Falldossier verifiziert: Systemgrenze und Rollen getrennt, offene Rechtsfragen mit datierten Evidenzpfaden dokumentiert.",
        }
      : {
          engine:
            variant === "redline"
              ? "Claim and privacy redline"
              : variant === "stakeholder"
                ? "Stakeholder evidence map"
                : "System and legal dossier",
          honest:
            variant === "dossier"
              ? "Synthetic learning case · not a legal verdict or legal advice"
              : "Synthetic learning case · no real people, accounts, or business data",
          workTitle:
            variant === "redline"
              ? "Redline decisions"
              : variant === "stakeholder"
                ? "Separate claim, observation, and impact"
                : "System boundary, roles, and open questions",
          evidenceLabel: "Case evidence",
          sourceTitle:
            variant === "stakeholder"
              ? "Select independent source paths"
              : "Add defensible evidence to the file",
          note:
            variant === "redline"
              ? "Approval note with replacement wording"
              : variant === "stakeholder"
                ? "Publication and correction note"
                : "Open question and escalation note",
          notePlaceholder:
            variant === "redline"
              ? "Replace the guarantee with a supported description of the energy-saving feature; require human review before sending."
              : variant === "stakeholder"
                ? "Do not publish as fact; first check an independent source and visibly notify affected people of any correction."
                : "Confirm control authority and model version against a dated primary source; do not claim a final classification yet.",
          choicesEvidence: "Every case segment handled against evidence",
          sourcesEvidence:
            "Two independently defensible evidence paths selected",
          noteEvidence:
            "Boundary, uncertainty, escalation, and next evidence fixed",
          noteScratch: "Optional session note · not stored",
          localRunTitle: "Local synthetic evaluation",
          localRunHelp:
            "Runs only the fixed-choice record against the visible course rules. No model, provider, or external service is invoked.",
          localRun: "Run structured evaluation",
          localRunComplete:
            "Fixed-choice record evaluated locally with success.",
          localRunEvidence: "Local structured evaluation succeeded",
          pending:
            "Resolve the case segments, evidence paths, and four review dimensions.",
          ready: "The case file and uncertainty boundaries are auditable.",
          summary:
            variant === "redline"
              ? "Redline verified: sensitive segment removed, unsupported claim replaced, and human approval added."
              : variant === "stakeholder"
                ? "Evidence map verified: claim and observation separated, independent sources selected, and publication risk documented."
                : "Case dossier verified: system boundary and roles separated, open legal questions documented with dated evidence paths.",
        };

  const choicesCorrect = prompts.every(
    (prompt) => responses[prompt.id] === prompt.correct,
  );
  const meaningfulSources = sources
    .filter((source) => source.meaningful)
    .map((source) => source.id);
  const sourcesCorrect =
    meaningfulSources.every((id) => selectedSources.includes(id)) &&
    selectedSources.every((id) => meaningfulSources.includes(id));
  const reviewReady = reviewDimensions.every(
    (dimension) => reviewDecisions[dimension.id] === dimension.correct,
  );
  const evidenceReady = choicesCorrect && sourcesCorrect && reviewReady;
  const executionVerified = executionReceipt === expectedExecutionReceipt;
  const ready = evidenceReady && executionVerified && verificationEnabled;
  const artifact = useMemo<CourseProjectArtifactState>(
    () => ({
      version: 1,
      engineKind: "case",
      fields: {
        executionReceipt,
        responses: prompts
          .filter((prompt) => responses[prompt.id])
          .map((prompt) => `${prompt.id}:${responses[prompt.id]}`),
        sources: selectedSources,
        review: reviewDimensions
          .filter((dimension) => reviewDecisions[dimension.id])
          .map(
            (dimension) => `${dimension.id}:${reviewDecisions[dimension.id]}`,
          ),
      },
    }),
    [
      executionReceipt,
      prompts,
      responses,
      reviewDecisions,
      reviewDimensions,
      selectedSources,
    ],
  );

  useEffect(() => {
    onArtifactChange(artifact);
  }, [artifact, onArtifactChange]);

  function verify() {
    if (!ready || verified) return;
    setVerified(true);
    onVerified(copy.summary, artifact);
  }

  return (
    <EngineFrame config={config} locale={locale} engineLabel={copy.engine}>
      <p className="border-l-4 border-brand-orange bg-brand-orange/[0.07] px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide">
        {copy.honest}
      </p>

      <section
        aria-labelledby={`${config.id}-case-work`}
        className="mt-5 min-w-0"
      >
        <h3 id={`${config.id}-case-work`} className="text-lg font-black">
          {copy.workTitle}
        </h3>
        <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-3">
          {prompts.map((prompt, index) => (
            <fieldset
              key={prompt.id}
              className="min-w-0 border-2 border-foreground/20 bg-background p-4"
            >
              <legend className="px-2 font-mono text-xs font-black uppercase tracking-[0.13em]">
                {variant === "redline"
                  ? locale === "de"
                    ? `Redline ${index + 1}`
                    : `Redline ${index + 1}`
                  : locale === "de"
                    ? `Prüfpunkt ${index + 1}`
                    : `Checkpoint ${index + 1}`}
              </legend>
              <p className="break-words text-sm font-bold leading-relaxed">
                {prompt.text[locale]}
              </p>
              <div className="mt-3 border-l-2 border-brand-orange pl-3">
                <p className="font-mono text-[0.65rem] font-black uppercase tracking-wide text-brand-orange-dark">
                  {copy.evidenceLabel}
                </p>
                <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
                  {prompt.evidence[locale]}
                </p>
              </div>
              <div className="mt-4 space-y-2">
                {prompt.choices.map((choice) => (
                  <label
                    key={choice.value}
                    className={`flex min-w-0 cursor-pointer items-start gap-3 border p-3 text-xs font-semibold leading-relaxed ${
                      responses[prompt.id] === choice.value
                        ? "border-brand-orange bg-brand-orange/[0.07]"
                        : "border-foreground/15"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${config.id}-${prompt.id}`}
                      value={choice.value}
                      checked={responses[prompt.id] === choice.value}
                      className="mt-0.5 size-4 shrink-0 accent-brand-orange"
                      onChange={(event) => {
                        onMeaningfulInteraction?.();
                        setExecutionReceipt(null);
                        setResponses((current) => ({
                          ...current,
                          [prompt.id]: event.target.value,
                        }));
                        setVerified(false);
                      }}
                    />
                    <span className="min-w-0 break-words">
                      {choice[locale]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <fieldset className="mt-5 min-w-0 border-2 border-foreground/20 p-4">
        <legend className="px-2 font-mono text-xs font-black uppercase tracking-[0.14em]">
          {copy.sourceTitle}
        </legend>
        <div className="grid min-w-0 gap-2 md:grid-cols-3">
          {sources.map((source) => (
            <label
              key={source.id}
              className={`flex min-w-0 cursor-pointer items-start gap-3 border-2 p-3 text-sm leading-relaxed ${
                selectedSources.includes(source.id)
                  ? "border-brand-orange bg-brand-orange/[0.07]"
                  : "border-foreground/15 bg-background"
              }`}
            >
              <input
                type="checkbox"
                value={source.id}
                checked={selectedSources.includes(source.id)}
                className="mt-1 size-4 shrink-0 accent-brand-orange"
                onChange={(event) => {
                  onMeaningfulInteraction?.();
                  setExecutionReceipt(null);
                  setSelectedSources((current) =>
                    event.target.checked
                      ? [...current, source.id]
                      : current.filter((id) => id !== source.id),
                  );
                  setVerified(false);
                }}
              />
              <span className="min-w-0 break-words font-semibold">
                {source.label[locale]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <section
        aria-labelledby={`${config.id}-review-decisions`}
        className="mt-5 min-w-0 border-2 border-foreground/20 p-4"
      >
        <h3
          id={`${config.id}-review-decisions`}
          className="font-mono text-xs font-black uppercase tracking-[0.14em]"
        >
          {locale === "de"
            ? "Strukturierter Prüfvermerk"
            : "Structured review record"}
        </h3>
        <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
          {reviewDimensions.map((dimension) => (
            <fieldset
              key={dimension.id}
              className="min-w-0 border border-foreground/20 bg-background p-4"
            >
              <legend className="max-w-full break-words px-2 text-sm font-black leading-relaxed">
                {dimension.prompt[locale]}
              </legend>
              <div className="mt-2 space-y-2">
                {dimension.choices.map((choice) => (
                  <label
                    key={choice.value}
                    className={`flex min-w-0 cursor-pointer items-start gap-3 border p-3 text-xs font-semibold leading-relaxed ${
                      reviewDecisions[dimension.id] === choice.value
                        ? "border-brand-orange bg-brand-orange/[0.07]"
                        : "border-foreground/15"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${config.id}-review-${dimension.id}`}
                      value={choice.value}
                      checked={reviewDecisions[dimension.id] === choice.value}
                      className="mt-0.5 size-4 shrink-0 accent-brand-orange"
                      onChange={(event) => {
                        onMeaningfulInteraction?.();
                        setExecutionReceipt(null);
                        setReviewDecisions((current) => ({
                          ...current,
                          [dimension.id]: event.target.value,
                        }));
                        setVerified(false);
                      }}
                    />
                    <span className="min-w-0 break-words">
                      {choice[locale]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="mt-4 border-t border-foreground/20 pt-4">
          <label htmlFor={noteId} className="text-sm font-black">
            {copy.noteScratch}
          </label>
          <textarea
            id={noteId}
            className={`${LAB_INPUT} mt-2 min-h-28 resize-y`}
            value={note}
            maxLength={180}
            placeholder={copy.notePlaceholder}
            onChange={(event) => {
              setNote(event.target.value);
            }}
          />
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {locale === "de"
              ? "Freitext bleibt im Arbeitsspeicher dieser Seite und zählt nicht als Prüfnachweis."
              : "Free text remains in this page's memory and does not count as verification evidence."}
          </p>
        </div>
      </section>

      <section className="mt-5 border-2 border-foreground bg-card p-4">
        <h3 className="font-mono text-xs font-black uppercase tracking-[0.14em]">
          {copy.localRunTitle}
        </h3>
        <p className="mt-2 max-w-[72ch] text-sm leading-relaxed text-muted-foreground">
          {copy.localRunHelp}
        </p>
        {executionVerified ? (
          <p
            role="status"
            className="mt-4 border-l-4 border-risk-green bg-risk-green/10 p-4 text-sm font-semibold"
          >
            {copy.localRunComplete}
          </p>
        ) : (
          <button
            type="button"
            className={`${LAB_BUTTON} mt-4`}
            disabled={!evidenceReady}
            onClick={() => {
              if (!evidenceReady) return;
              setExecutionReceipt(expectedExecutionReceipt);
              setVerified(false);
              onExecutionReceipt?.(expectedExecutionReceipt);
            }}
          >
            {copy.localRun}
          </button>
        )}
      </section>

      <VerifyPanel
        locale={locale}
        ready={ready}
        verified={verified}
        onVerify={verify}
        statusDetail={
          ready
            ? copy.ready
            : evidenceReady && !verificationEnabled
              ? locale === "de"
                ? "Alle fünf Projektphasen müssen vor der Abnahme belegt sein."
                : "All five project stages need evidence before acceptance."
              : copy.pending
        }
        criteria={
          <>
            <EvidenceItem complete={choicesCorrect}>
              {copy.choicesEvidence}
            </EvidenceItem>
            <EvidenceItem complete={sourcesCorrect}>
              {copy.sourcesEvidence}
            </EvidenceItem>
            <EvidenceItem complete={reviewReady}>
              {copy.noteEvidence}
            </EvidenceItem>
            <EvidenceItem complete={executionVerified}>
              {copy.localRunEvidence}
            </EvidenceItem>
            <EvidenceItem complete={verificationEnabled}>
              {locale === "de"
                ? "Alle fünf Projektphasen belegt"
                : "All five project stages evidenced"}
            </EvidenceItem>
          </>
        }
      />
    </EngineFrame>
  );
}
