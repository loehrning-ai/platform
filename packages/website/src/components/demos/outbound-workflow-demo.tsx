"use client";

import { useState } from "react";
import { DEMO } from "@/lib/demo-tokens";
import { DEMO_HEIGHT } from "./demo-utils";
import { useDemoLocale } from "./demo-locale";

interface Lead {
  readonly name: string;
  readonly role: string;
  readonly company: string;
  readonly last: string;
  readonly signal: string;
  readonly score: number;
  readonly subject: string;
  readonly email: string;
  readonly address: string;
}

interface OutboundCopy {
  readonly region: string;
  readonly heading: string;
  readonly note: string;
  readonly stagesLabel: string;
  readonly stages: readonly (readonly [string, string, string])[];
  readonly contactsLabel: string;
  readonly lastContact: string;
  readonly sampleScore: string;
  readonly threshold: string;
  readonly thresholdLabel: string;
  readonly draftLabel: string;
  readonly draft: string;
  readonly to: string;
  readonly hold: string;
  readonly qualified: string;
  readonly subject: string;
  readonly footer: string;
  readonly showControls: string;
  readonly hideControls: string;
  readonly controls: readonly string[];
  readonly leads: readonly Lead[];
}

/*
 * One layout in both languages: the four review steps (sample contact,
 * evidence check, draft, human review), the contact picker with a score
 * gate, the draft and the pre-send controls. The German page used to run a
 * different, heavier pipeline with invented send times, DKIM and a
 * "source verified" claim; both now say the same, true things: the source
 * is an unverified sample and this page sends nothing.
 */

const LEADS_DE: readonly Lead[] = [
  {
    name: "Fiktivkontakt Alpha",
    role: "Head of Ops",
    company: "Fiktivwerk Alpha (rein fiktiv)",
    last: "412 Tage",
    signal: "Fiktives Einstellungssignal · 42 Mitarbeitende",
    score: 87,
    subject: "Auftragsabwicklung: eine konkrete Rückfrage",
    email:
      "Hallo,\n\nzuletzt sprachen wir vor 14 Monaten über eure Auftragsabwicklung. Das fiktive öffentliche Beispiel zeigt jetzt ein größeres Operations-Team.\n\nEin sinnvoller erster Check wären Statusmeldungen und Bestandsabfragen. Das ist ein Entwurf zur Prüfung durch einen Menschen, kein Angebot und keine versendete E-Mail.\n\nBitte nur antworten, wenn das Thema passt.",
    address: "kontakt-alpha@fiktivwerk.example",
  },
  {
    name: "Fiktivkontakt Beta",
    role: "Geschäftsführung",
    company: "Fiktivwerk Beta (rein fiktiv)",
    last: "228 Tage",
    signal: "Fiktives Update des Support-Systems",
    score: 74,
    subject: "Kundendienst-Entlastung: Kurze Rückfrage",
    email:
      "Guten Tag,\n\nim letzten fiktiven Austausch war die Automatisierung im Kundendienst noch verfrüht. Eine begrenzte Prüfung könnte jetzt Ticket-Gruppierung und Antwortvorschläge ansehen, mit manueller Freigabe vor dem Versand.\n\nDieses Beispiel erzeugt nur einen Prüfentwurf.",
    address: "kontakt-beta@fiktivwerk.example",
  },
  {
    name: "Fiktivkontakt Gamma",
    role: "CTO",
    company: "Fiktivwerk Gamma (rein fiktiv)",
    last: "591 Tage",
    signal: "Fiktive Maschinenmodernisierung 2024",
    score: 91,
    subject: "Wartungsdaten nach dem Maschinen-Update",
    email:
      "Guten Tag,\n\nunser früheres fiktives Gespräch endete, weil die Daten unvollständig waren. Nach einem Maschinen-Update bleibt der nächste Check derselbe: Ausfallhistorie, Zuständigkeit und ein Schwellenwert für die Eskalation.\n\nHat sich der Datenstand im Beispiel geändert? Von dieser Seite wird keine Nachricht gesendet.",
    address: "kontakt-gamma@fiktivwerk.example",
  },
];

const LEADS_EN: readonly Lead[] = [
  {
    name: "Sample Contact Alpha",
    role: "Head of Operations",
    company: "Fictional Works Alpha (sample only)",
    last: "412 days",
    signal: "Fictional hiring signal · 42 employees",
    score: 87,
    subject: "Order handling: a specific follow-up",
    email:
      "Hello,\n\nwe last discussed order handling 14 months ago. The fictional public sample now shows a larger operations team.\n\nA useful first check would cover status updates and inventory requests. This is a draft for human review, not an offer and not a sent email.\n\nReply only if the topic is relevant.",
    address: "contact-alpha@fictional.example",
  },
  {
    name: "Sample Contact Beta",
    role: "Managing director",
    company: "Fictional Works Beta (sample only)",
    last: "228 days",
    signal: "Fictional support-system update",
    score: 74,
    subject: "Support workload: one follow-up question",
    email:
      "Hello,\n\nour last fictional exchange marked support automation as premature. A bounded review could now examine ticket grouping and suggested replies, with manual approval before delivery.\n\nThis sample creates a review draft only.",
    address: "contact-beta@fictional.example",
  },
  {
    name: "Sample Contact Gamma",
    role: "CTO",
    company: "Fictional Works Gamma (sample only)",
    last: "591 days",
    signal: "Fictional machinery upgrade in 2024",
    score: 91,
    subject: "Maintenance data after the equipment update",
    email:
      "Hello,\n\nour earlier fictional discussion stopped because the data was incomplete. After an equipment update, the next valid check is still the same: failure history, ownership, and an escalation threshold.\n\nHas the sample data position changed? No message is sent from this page.",
    address: "contact-gamma@fictional.example",
  },
];

const COPY: Readonly<Record<"de" | "en", OutboundCopy>> = {
  de: {
    region: "Beispiel eines Outbound-Prüfablaufs",
    heading: "Nachricht aus öffentlichen Signalen",
    note: "Entwürfe bleiben im Browser; diese Seite kann keine E-Mail senden.",
    stagesLabel: "Ablaufschritte",
    stages: [
      ["01", "Beispielkontakt", "fiktive CRM-Zeile"],
      ["02", "Quellenprüfung", "Feld für öffentliche Quelle"],
      ["03", "Entwurf", "feste Browser-Kopie"],
      ["04", "Menschliche Prüfung", "keine Versandaktion"],
    ],
    contactsLabel: "Fiktive Kontakte",
    lastContact: "Letzter Kontakt",
    sampleScore: "Beispiel-Score",
    threshold: "Score-Schwelle",
    thresholdLabel: "Minimale Score-Schwelle für den Versand",
    draftLabel: "E-Mail-Entwurf",
    draft: "Prüfentwurf",
    to: "an",
    hold: "Angehalten: unter der Schwelle",
    qualified: "Qualifiziert, nicht gesendet",
    subject: "Betreff",
    footer: "247 Beispiel-Tokens · Label Sonnet 4.6 · Quelle: ungeprüftes Beispiel",
    showControls: "Was fehlt vor einem echten Versand?",
    hideControls: "Verbergen",
    controls: [
      "Rechtliche Grundlage: Einwilligung oder berechtigtes Interesse nachweisen (DSGVO Art. 6)",
      "Quellenprüfung: Woher stammt die Kontaktadresse, und ist sie aktuell?",
      "Opt-out-Mechanismus: Abmeldelink vor jedem echten Versand",
      "Menschliche Freigabe: eine benannte Person bestätigt den Text",
    ],
    leads: LEADS_DE,
  },
  en: {
    region: "Outbound review workflow example",
    heading: "Message from public signals",
    note: "Drafts stay in the browser; this page cannot send email.",
    stagesLabel: "Workflow stages",
    stages: [
      ["01", "Sample contact", "fictional CRM row"],
      ["02", "Evidence check", "public-source field"],
      ["03", "Draft", "fixed browser copy"],
      ["04", "Human review", "no delivery action"],
    ],
    contactsLabel: "Fictional contacts",
    lastContact: "Last contact",
    sampleScore: "Sample score",
    threshold: "Score threshold",
    thresholdLabel: "Minimum score threshold for outreach",
    draftLabel: "Draft email",
    draft: "Review draft",
    to: "to",
    hold: "Hold: below threshold",
    qualified: "Qualified, not sent",
    subject: "Subject",
    footer: "247 sample tokens · Sonnet 4.6 label · source status: unverified sample",
    showControls: "Show pre-send controls",
    hideControls: "Hide pre-send controls",
    controls: [
      "Document the lawful basis and purpose limitation.",
      "Verify the contact source, address, and current relevance.",
      "Provide a working opt-out path before any real delivery.",
      "Require a named human reviewer to approve the final text.",
    ],
    leads: LEADS_EN,
  },
};

export default function OutboundWorkflowDemo() {
  const { locale } = useDemoLocale();
  return <OutboundReview copy={COPY[locale === "en" ? "en" : "de"]} />;
}

function OutboundReview({ copy }: { readonly copy: OutboundCopy }) {
  const [leadIndex, setLeadIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [minScore, setMinScore] = useState(70);
  const lead = copy.leads[leadIndex] ?? copy.leads[0]!;
  // The sample score was previously display-only. A real gate compares it
  // against a learner-adjustable threshold: the failure beat is what
  // happens when the threshold is set above every lead's score.
  const gated = lead.score < minScore;

  return (
    <div
      data-demo-id="outbound-workflow"
      role="region"
      aria-label={copy.region}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        width: "100%",
        minHeight: DEMO_HEIGHT,
        minWidth: 0,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
      }}
    >
      <div>
        {/* The page H1 and lead name the demo; this heading only gives
          screen-reader users a landmark into the instrument. */}
        <h2 className="sr-only">{copy.heading}</h2>
        <p className="text-caption text-muted-foreground" style={{ margin: 0, maxWidth: 720 }}>
          {copy.note}
        </p>
      </div>

      <div
        aria-label={copy.stagesLabel}
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
          gap: 8,
        }}
      >
        {copy.stages.map(([number, title, detail]) => (
          <div
            key={number}
            style={{
              minWidth: 0,
              border: `1px solid ${DEMO.leinen}`,
              borderTop: `2px solid ${DEMO.ink}`,
              background: DEMO.birke,
              padding: "10px 12px",
            }}
          >
            <span
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: DEMO.schiefer,
              }}
            >
              {number}
            </span>
            <strong
              style={{
                display: "block",
                marginTop: 3,
                overflowWrap: "anywhere",
              }}
            >
              {title}
            </strong>
            <span
              style={{
                display: "block",
                marginTop: 2,
                fontSize: 12,
                color: DEMO.schiefer,
              }}
            >
              {detail}
            </span>
          </div>
        ))}
      </div>

      <div
        data-outbound-body
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
          gap: 14,
          minWidth: 0,
        }}
      >
        <section
          aria-label={copy.contactsLabel}
          style={{
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {copy.leads.map((item, index) => {
            const selected = index === leadIndex;
            return (
              <button
                key={item.address}
                type="button"
                aria-pressed={selected}
                onClick={() => setLeadIndex(index)}
                style={{
                  minWidth: 0,
                  minHeight: 68,
                  padding: "10px 12px",
                  textAlign: "left",
                  // The chosen contact takes the page's scene line (Kobalt
                  // on the IDEA demo pages; ink where no scene is set).
                  border: `1px solid ${selected ? "var(--color-scene-line, #121212)" : DEMO.ink}`,
                  background: selected ? "var(--color-scene-line, #121212)" : DEMO.kalk,
                  color: selected ? DEMO.kalk : DEMO.ink,
                  cursor: "pointer",
                }}
              >
                <strong style={{ display: "block", overflowWrap: "anywhere" }}>
                  {item.name}
                </strong>
                <span
                  style={{
                    display: "block",
                    marginTop: 3,
                    fontSize: 12,
                    opacity: 0.72,
                    overflowWrap: "anywhere",
                  }}
                >
                  {item.role} · {item.company}
                </span>
              </button>
            );
          })}
          <div
            style={{
              border: `1px solid ${DEMO.leinen}`,
              background: DEMO.birke,
              padding: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                fontFamily: DEMO.font.mono,
                fontSize: 12,
              }}
            >
              <span>{copy.lastContact}</span>
              <strong>{lead.last}</strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                marginTop: 6,
                fontFamily: DEMO.font.mono,
                fontSize: 12,
              }}
            >
              <span>{copy.sampleScore}</span>
              <strong style={{ color: DEMO.ink }}>
                {lead.score}/100
              </strong>
            </div>
            <div
              style={{
                marginTop: 10,
                borderTop: `1px solid ${DEMO.leinen}`,
                paddingTop: 8,
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              {lead.signal}
            </div>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginTop: 10,
                fontFamily: DEMO.font.mono,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    ...DEMO.label,
                    color: DEMO.schiefer,
                  }}
                >
                  {copy.threshold}
                </span>
                <span
                  style={{
                    color: gated ? "var(--color-destructive)" : DEMO.ink,
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {minScore}/100
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                aria-label={copy.thresholdLabel}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={minScore}
                style={{
                  minHeight: 44,
                  width: "100%",
                  accentColor: DEMO.ink,
                }}
              />
            </label>
          </div>
        </section>

        <section
          aria-label={copy.draftLabel}
          style={{
            minWidth: 0,
            border: `1px solid ${DEMO.ink}`,
            background: "white",
            color: "#222",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              padding: "8px 12px",
              background: DEMO.ink,
              color: DEMO.kalk,
              fontFamily: DEMO.font.mono,
              fontSize: 12,
            }}
          >
            <strong style={{ color: "var(--color-kupfer-light)" }}>
              {copy.draft}
            </strong>
            <span style={{ overflowWrap: "anywhere" }}>
              {copy.to}: {lead.address}
            </span>
            <span
              role={gated ? "alert" : undefined}
              style={{
                marginLeft: "auto",
                color: gated ? "#fca5a5" : "#fbbf24",
              }}
            >
              {gated ? copy.hold : copy.qualified}
            </span>
          </div>
          <div
            style={{
              padding: "10px 14px",
              borderBottom: `1px solid ${DEMO.leinen}`,
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: DEMO.schiefer }}>{copy.subject}: </span>
            <strong>{lead.subject}</strong>
          </div>
          <div
            style={{
              minHeight: 260,
              padding: "16px 18px",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              fontFamily: "Georgia, serif",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            {lead.email}
          </div>
          <div
            style={{
              padding: "8px 14px",
              borderTop: `1px dashed ${DEMO.leinen}`,
              background: DEMO.birke,
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              color: DEMO.schiefer,
            }}
          >
            {copy.footer}
          </div>
        </section>
      </div>

      <section
        style={{
          border: `1px dashed ${DEMO.ink}`,
          padding: "12px 14px",
        }}
      >
        <button
          type="button"
          aria-expanded={showControls}
          onClick={() => setShowControls((current) => !current)}
          style={{
            ...DEMO.label,
            minHeight: 44,
            border: `1px solid ${DEMO.ink}`,
            background: "transparent",
            color: DEMO.ink,
            padding: "7px 11px",
            cursor: "pointer",
          }}
        >
          {showControls ? copy.hideControls : copy.showControls}
        </button>
        {showControls && (
          <ul
            style={{
              margin: "10px 0 0",
              paddingLeft: 20,
              display: "grid",
              gap: 7,
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {copy.controls.map((control) => (
              <li key={control}>{control}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
