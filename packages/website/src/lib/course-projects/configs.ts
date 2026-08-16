import type { CourseSlug } from "@/lib/course/types";
import type {
  CourseProjectConfig,
  CourseProjectStageId,
  CourseProjectStages,
  LocalizedProjectText,
} from "./types";
import { COURSE_PROJECT_IDENTITIES } from "./identity";

const text = (de: string, en: string): LocalizedProjectText => ({ de, en });

type StageInput = Readonly<
  Record<
    CourseProjectStageId,
    readonly [objective: LocalizedProjectText, evidence: LocalizedProjectText]
  >
>;

function stages(input: StageInput): CourseProjectStages {
  return [
    {
      id: "ground",
      objective: input.ground[0],
      evidence: input.ground[1],
    },
    {
      id: "build",
      objective: input.build[0],
      evidence: input.build[1],
    },
    {
      id: "run",
      objective: input.run[0],
      evidence: input.run[1],
    },
    {
      id: "verify",
      objective: input.verify[0],
      evidence: input.verify[1],
    },
    {
      id: "transfer",
      objective: input.transfer[0],
      evidence: input.transfer[1],
    },
  ];
}

/**
 * One bounded, artifact-producing studio for every registered course.
 * Scenarios are deliberately synthetic so the default course remains safe,
 * provider-independent, and useful without private learner data.
 */
export const COURSE_PROJECT_CONFIGS = {
  "ki-fuehrerschein": {
    ...COURSE_PROJECT_IDENTITIES["ki-fuehrerschein"],
    courseSlug: "ki-fuehrerschein",
    title: text("Die sichere Prompt-Redaktion", "The Safe Prompt Desk"),
    mission: text(
      "Verwandle einen unsicheren Arbeitsauftrag in ein begrenztes, prüfbares KI-Briefing und redliniere den erzeugten Entwurf.",
      "Turn an unsafe work request into a bounded, testable AI brief and redline the resulting draft.",
    ),
    artifact: text(
      "Freigegebenes Prompt-Briefing mit Datenklassifikation, Quellenplan und Output-Redline",
      "Approved prompt brief with data classification, source plan, and output redline",
    ),
    scenario: text(
      "Ein fiktiver Büroausstatter will aus synthetischen Produktnotizen eine Kundenmail erstellen. Die Rohfassung vermischt interne Hinweise, ungesicherte Behauptungen und fehlende Prüfschritte.",
      "A fictional office-supply company wants a customer email from synthetic product notes. The draft mixes internal guidance, unsupported claims, and missing review steps.",
    ),
    safety: text(
      "Nur die bereitgestellten Fantasiedaten verwenden. Keine Namen, Kontaktdaten, vertraulichen Dokumente oder realen Geschäftsvorgänge eingeben.",
      "Use only the supplied fictional data. Do not enter names, contact details, confidential documents, or real business matters.",
    ),
    completionCriteria: [
      text(
        "Jedes Eingabefeld ist einer Datenklasse zugeordnet und unzulässiger Kontext wurde entfernt.",
        "Every input is assigned a data class and disallowed context is removed.",
      ),
      text(
        "Das Briefing nennt Ziel, Kontext, Grenzen, Ausgabeformat und einen menschlichen Prüfschritt.",
        "The brief states the goal, context, boundaries, output format, and a human review step.",
      ),
      text(
        "Die Redline markiert unbelegte Aussagen und ersetzt sie durch belegte oder ausdrücklich unsichere Formulierungen.",
        "The redline flags unsupported claims and replaces them with supported or explicitly uncertain wording.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Ordne Aufgabe, Datenklassen und mögliche Schäden vor der Modellauswahl ein.",
          "Classify the task, data classes, and possible harm before choosing a model.",
        ),
        text(
          "Ausgefüllte Auftragsgrenze und Datenfreigabe",
          "Completed task boundary and data clearance",
        ),
      ],
      build: [
        text(
          "Baue das Briefing aus Ziel, Kontext, Regeln, Format und Prüfkriterien.",
          "Build the brief from goal, context, rules, format, and review criteria.",
        ),
        text("Strukturiertes Prompt-Briefing", "Structured prompt brief"),
      ],
      run: [
        text(
          "Führe das Briefing gegen den synthetischen Fall aus und protokolliere Annahmen.",
          "Run the brief against the synthetic case and record assumptions.",
        ),
        text("Entwurf mit Annahmenprotokoll", "Draft with assumption log"),
      ],
      verify: [
        text(
          "Prüfe jede Tatsachenbehauptung, Datenstelle und Handlungsaufforderung.",
          "Check every factual claim, data reference, and call to action.",
        ),
        text(
          "Abgeschlossene Claim- und Datenschutz-Redline",
          "Completed claim and privacy redline",
        ),
      ],
      transfer: [
        text(
          "Formuliere eine wiederverwendbare Checkliste für einen eigenen, freigegebenen Arbeitsablauf.",
          "Write a reusable checklist for one approved workflow of your own.",
        ),
        text(
          "Übertragbare Fünf-Punkte-Checkliste",
          "Transferable five-point checklist",
        ),
      ],
    }),
  },
  "eu-ai-act-kurs": {
    ...COURSE_PROJECT_IDENTITIES["eu-ai-act-kurs"],
    courseSlug: "eu-ai-act-kurs",
    title: text("Das AI-Act-Fallarchiv", "The AI Act Case File"),
    mission: text(
      "Klassifiziere einen fiktiven KI-Einsatz, trenne Rollen und Pflichten und baue eine datierte Evidenzakte statt eines pauschalen Rechtsurteils.",
      "Classify a fictional AI use, separate roles and duties, and build a dated evidence file instead of issuing a blanket legal verdict.",
    ),
    artifact: text(
      "Datierte Fallakte mit Systemgrenze, Rollenkarte, Risikopfad, Pflichten und offenen Rechtsfragen",
      "Dated case file with system boundary, role map, risk path, duties, and open legal questions",
    ),
    scenario: text(
      "Die fiktive Lernstadt Nordhafen prüft ein System, das synthetische Bewerbungsprofile für Ausbildungsangebote vorsortiert. Anbieter, Betreiber, Zweck und menschliche Entscheidung sind absichtlich unvollständig beschrieben.",
      "The fictional city of Northhaven is assessing a system that pre-sorts synthetic apprenticeship profiles. Provider, deployer, purpose, and human decision details are intentionally incomplete.",
    ),
    safety: text(
      "Der Fall enthält keine realen Personen oder Rechtsberatung. Ergebnisse bleiben Lernhypothesen und müssen an datierten Primärquellen geprüft werden.",
      "The case contains no real people and is not legal advice. Results remain learning hypotheses that must be checked against dated primary sources.",
    ),
    completionCriteria: [
      text(
        "Systemzweck, betroffene Entscheidung und Akteursrollen sind getrennt dokumentiert.",
        "System purpose, affected decision, and actor roles are documented separately.",
      ),
      text(
        "Der Risikopfad nennt die entscheidenden Tatsachen, Gegenargumente und fehlenden Informationen.",
        "The risk path states decisive facts, counterarguments, and missing information.",
      ),
      text(
        "Jede Pflicht ist einer Rolle, einem Zeitpunkt und einer datierten Quelle zugeordnet.",
        "Every duty is mapped to a role, date, and dated source.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Ziehe die Systemgrenze und identifiziere Zweck, Betroffene und Entscheidung.",
          "Draw the system boundary and identify purpose, affected people, and decision.",
        ),
        text("System- und Entscheidungskarte", "System and decision map"),
      ],
      build: [
        text(
          "Ordne Anbieter-, Betreiber- und weitere Rollen mit Begründung zu.",
          "Assign provider, deployer, and other roles with reasons.",
        ),
        text("Begründete Rollenmatrix", "Reasoned role matrix"),
      ],
      run: [
        text(
          "Durchlaufe Verbot, Hochrisiko, Transparenz und sonstige Pfade ohne Abkürzung.",
          "Walk through prohibited, high-risk, transparency, and other paths without shortcuts.",
        ),
        text(
          "Vollständiger Klassifikationspfad",
          "Complete classification path",
        ),
      ],
      verify: [
        text(
          "Fordere Gegenbelege an und verknüpfe Aussagen mit Rechtsstand und Primärquelle.",
          "Demand counter-evidence and link claims to legal date and primary source.",
        ),
        text(
          "Quellen- und Unsicherheitsprotokoll",
          "Source and uncertainty log",
        ),
      ],
      transfer: [
        text(
          "Erzeuge eine wiederverwendbare Intake-Liste für neue KI-Anwendungsfälle.",
          "Create a reusable intake list for new AI use cases.",
        ),
        text(
          "Fallaufnahme-Vorlage mit Eskalationspunkten",
          "Case-intake template with escalation points",
        ),
      ],
    }),
  },
  "ai-native": {
    ...COURSE_PROJECT_IDENTITIES["ai-native"],
    courseSlug: "ai-native",
    title: text("Die kontrollierte Arbeitsstrecke", "The Controlled Work Run"),
    mission: text(
      "Formuliere aus einem unscharfen Auftrag einen begrenzten Prompt, fordere genau eine Modellantwort an und bewerte sie mit lokal gesetzten Freigabe-, Abbruch- und Übergabekontrollen. Es werden keine Werkzeuge oder Workflows ausgeführt.",
      "Turn an ambiguous request into a bounded prompt, request exactly one model completion, and assess it with locally selected approval, stop, and handoff controls. No tools or workflows are executed.",
    ),
    artifact: text(
      "Lokal validierter Projektnachweis zu einer einzelnen Provider-Antwort mit Kontroll- und Übergabeplan",
      "Locally validated project evidence for one provider completion with a control and handoff plan",
    ),
    scenario: text(
      "Ein fiktives Energiegenossenschafts-Team muss aus synthetischen Projektmeldungen einen Wochenüberblick erstellen. Eingangsdaten sind widersprüchlich und manche Schritte benötigen menschliche Freigabe.",
      "A fictional energy cooperative must create a weekly overview from synthetic project updates. Inputs conflict and some steps require human approval.",
    ),
    safety: text(
      "Der Workspace akzeptiert nur die mitgelieferten Projektdaten. Keine realen Kunden-, Beschäftigten-, Finanz- oder Zugangsdaten verwenden.",
      "The workspace accepts only the supplied project data. Do not use real customer, employee, financial, or credential data.",
    ),
    completionCriteria: [
      text(
        "Ziel, Kontext, Ausgabeformat und harte Grenzen sind im Prompt explizit.",
        "The prompt explicitly states the goal, context, output format, and hard boundaries.",
      ),
      text(
        "Eine echte Provider-Antwort liegt vor; Freigabe, Abbruch und Übergabe sind als lokale Plankontrollen gesetzt.",
        "A real provider completion exists; approval, stop, and handoff are recorded as local planning controls.",
      ),
      text(
        "Die Übergabe nennt Eigentümer, Fallback, Messgröße und Wiederanlauf.",
        "The handoff names the owner, fallback, measure, and restart procedure.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Definiere Ergebnis, Nicht-Ziele, Datenfreigabe und Erfolgssignal.",
          "Define the outcome, non-goals, data clearance, and success signal.",
        ),
        text("Abgegrenzter Arbeitsauftrag", "Bounded work order"),
      ],
      build: [
        text(
          "Schreibe Kontext und Prompt und setze lokale Freigabe-, Abbruch-, Übergabe- und Fallback-Kontrollen.",
          "Write the context and prompt and select local approval, stop, handoff, and fallback controls.",
        ),
        text("Prompt- und Kontrollplan", "Prompt and control plan"),
      ],
      run: [
        text(
          "Fordere für den synthetischen Auftrag genau eine Antwort vom freigegebenen Provider an.",
          "Request exactly one completion from the allowed provider for the synthetic task.",
        ),
        text(
          "Provider-Antwort im aktuellen Browserlauf",
          "Provider completion in the current browser session",
        ),
      ],
      verify: [
        text(
          "Bewerte die einzelne Antwort gegen Auftrag, Freigabe, Abbruchregel, Eigentum und Fallback.",
          "Assess the single completion against the task, approval, stop rule, ownership, and fallback.",
        ),
        text(
          "Lokale Output- und Kontrollbewertung",
          "Local output and control assessment",
        ),
      ],
      transfer: [
        text(
          "Schreibe Eigentum, Ausnahmeweg, Fallback und Wiederanlauf für einen künftigen echten Arbeitsprozess.",
          "Document ownership, exception path, fallback, and restart for a future real work process.",
        ),
        text("Geplanter Übergabevertrag", "Planned handoff contract"),
      ],
    }),
  },
  "ki-und-gesellschaft": {
    ...COURSE_PROJECT_IDENTITIES["ki-und-gesellschaft"],
    courseSlug: "ki-und-gesellschaft",
    title: text("Die Evidenzredaktion", "The Evidence Newsroom"),
    mission: text(
      "Untersuche einen synthetischen Medienfund, trenne Beobachtung von Behauptung und entscheide nachvollziehbar über Veröffentlichung und Korrektur.",
      "Investigate a synthetic media item, separate observation from claim, and make an auditable publication and correction decision.",
    ),
    artifact: text(
      "Verifikationsdossier mit Provenienz, Quellenvergleich, Betroffenenkarte und Publikationsentscheidung",
      "Verification dossier with provenance, source comparison, stakeholder map, and publication decision",
    ),
    scenario: text(
      "Im fiktiven Ort Sonnenbrück kursiert ein vollständig synthetisches Video über die Schließung eines erfundenen Werks. Mehrere erfundene Accounts verbreiten widersprüchliche Ausschnitte.",
      "In the fictional town of Sunbridge, a fully synthetic video claims an invented factory will close. Several fictional accounts spread conflicting clips.",
    ),
    safety: text(
      "Keine realen Medien, Personen oder Accounts hochladen. Werkzeuge liefern Indizien, keinen Echtheitsbeweis; Unsicherheit muss sichtbar bleiben.",
      "Do not upload real media, people, or accounts. Tools provide signals, not proof of authenticity; uncertainty must remain visible.",
    ),
    completionCriteria: [
      text(
        "Originalbehauptung, beobachtbare Merkmale und abgeleitete Interpretation sind getrennt.",
        "Original claim, observable signals, and inferred interpretation are separated.",
      ),
      text(
        "Mindestens zwei unabhängige Quellenpfade und die verbleibende Unsicherheit sind dokumentiert.",
        "At least two independent source paths and remaining uncertainty are documented.",
      ),
      text(
        "Die Publikationsentscheidung berücksichtigt Schaden, Betroffene, Korrektur und Eskalation.",
        "The publication decision addresses harm, affected parties, correction, and escalation.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Sichere Behauptung, Zeitpunkt, Quelle und mögliche Betroffene getrennt.",
          "Capture the claim, time, source, and potentially affected parties separately.",
        ),
        text("Versiegelte Ausgangsnotiz", "Sealed intake note"),
      ],
      build: [
        text(
          "Baue eine Provenienzlinie und einen Plan für unabhängige Gegenprüfungen.",
          "Build a provenance chain and a plan for independent cross-checks.",
        ),
        text("Quellen- und Prüfplan", "Source and verification plan"),
      ],
      run: [
        text(
          "Vergleiche die synthetischen Ausschnitte, Metadaten und Aussagen.",
          "Compare the synthetic clips, metadata, and statements.",
        ),
        text(
          "Beobachtungsmatrix ohne vorzeitiges Urteil",
          "Observation matrix without premature verdict",
        ),
      ],
      verify: [
        text(
          "Teste alternative Erklärungen und bewerte Sicherheit sowie Schadensrisiko.",
          "Test alternative explanations and rate confidence and harm risk.",
        ),
        text(
          "Begründete Konfidenz- und Schadensbewertung",
          "Reasoned confidence and harm assessment",
        ),
      ],
      transfer: [
        text(
          "Verfasse Publikations-, Korrektur- und Eskalationsregeln für den nächsten Fall.",
          "Write publication, correction, and escalation rules for the next case.",
        ),
        text(
          "Redaktionelles Verifikationsprotokoll",
          "Editorial verification protocol",
        ),
      ],
    }),
  },
  "data-engineering-fundamentals": {
    ...COURSE_PROJECT_IDENTITIES["data-engineering-fundamentals"],
    courseSlug: "data-engineering-fundamentals",
    title: text(
      "Die fehlertolerante Paketpipeline",
      "The Fault-Tolerant Parcel Pipeline",
    ),
    mission: text(
      "Registriere einen begrenzten, browserseitigen Pipelineplan, aktiviere die feste Fehlerfixture und führe das serverseitig vorgegebene Node-Programm mit Invariantentests aus.",
      "Preregister a bounded browser-side pipeline plan, enable the fixed failure fixture, and run the server-supplied Node program with invariant tests.",
    ),
    artifact: text(
      "Lokal validierter Projektnachweis zum festen Node-Lauf mit Mengenabgleich, 102→102-Replay und Backfill-Entscheidung",
      "Locally validated project evidence for the fixed Node run with reconciliation, 102→102 replay, and a backfill decision",
    ),
    scenario: text(
      "Ein fiktiver Paketdienst liefert synthetische Scan-Ereignisse aus drei Depots. Einige Ereignisse kommen verspätet, doppelt oder mit ungültigem Status an.",
      "A fictional parcel service supplies synthetic scan events from three depots. Some arrive late, duplicated, or with an invalid status.",
    ),
    safety: text(
      "Alle IDs, Zeiten und Orte sind generierte Übungsdaten. Keine externen Tabellen, Zugangsdaten oder Produktionsendpunkte anbinden.",
      "All IDs, times, and locations are generated training data. Do not connect external tables, credentials, or production endpoints.",
    ),
    completionCriteria: [
      text(
        "Der browserseitige Plan nennt Schlüssel und Zeitsemantik; er ist keine ausführbare SQL-Anweisung.",
        "The browser-side plan states keys and time semantics; it is not an executable SQL statement.",
      ),
      text(
        "Der ausgeführte Backfill verarbeitet acht Late Events; Wiederholung endet erneut bei exakt 102 fachlichen Ergebnissen.",
        "The executed backfill processes eight late events; replay ends at exactly 102 business results again.",
      ),
      text(
        "Backfill und verspätete Ereignisse bestehen die vorgegebenen Qualitätsprüfungen.",
        "The backfill and late events pass the supplied quality checks.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Halte erwartete Ereignisfelder, Schlüssel, Zeitsemantik und Qualitätsrisiken als Plan fest.",
          "Record expected event fields, keys, time semantics, and quality risks as a plan.",
        ),
        text(
          "Geplantes Quellprofil und Datenvertrag",
          "Planned source profile and data contract",
        ),
      ],
      build: [
        text(
          "Spezifiziere Deduplizierung und Event-Time-Regeln im begrenzten Browserplan; der Plan wird nicht ausgeführt oder an die Sandbox gesendet.",
          "Specify deduplication and event-time rules in the bounded browser plan; the plan is neither executed nor sent to Sandbox.",
        ),
        text(
          "Vorregistrierter Pipelinevertrag",
          "Preregistered pipeline contract",
        ),
      ],
      run: [
        text(
          "Starte das feste serverseitige Programm für 117 generierte Events mit Duplikaten, Verspätung und Statusfehlern.",
          "Start the fixed server-side program for 117 generated events with duplicates, lateness, and a status error.",
        ),
        text(
          "Session-Laufprotokoll mit Exit-Codes",
          "Session run transcript with exit codes",
        ),
      ],
      verify: [
        text(
          "Prüfe Idempotenz, Mengenabgleich, Wasserzeichen und Wiederanlauf.",
          "Verify idempotency, reconciliation, watermarks, and restart behavior.",
        ),
        text(
          "Grüner Qualitäts- und Wiederanlauftest",
          "Passing quality and restart test",
        ),
      ],
      transfer: [
        text(
          "Dokumentiere Backfill-Fenster, Eigentum, Alarm und Rückbau.",
          "Document the backfill window, ownership, alert, and rollback.",
        ),
        text(
          "Backfill- und Betriebsrunbook",
          "Backfill and operations runbook",
        ),
      ],
    }),
  },
  "data-science": {
    ...COURSE_PROJECT_IDENTITIES["data-science"],
    courseSlug: "data-science",
    title: text("Das belastbare Experiment", "The Defensible Experiment"),
    mission: text(
      "Registriere einen begrenzten, browserseitigen Analyseplan, aktiviere die feste Leakage-Fixture und führe das serverseitig vorgegebene Experimentprogramm mit Invariantentests aus.",
      "Preregister a bounded browser-side analysis plan, enable the fixed leakage fixture, and run the server-supplied experiment program with invariant tests.",
    ),
    artifact: text(
      "Lokal validierter Projektnachweis zum festen Experimentlauf mit sicherem/geleaktem Metrikvergleich und Model-Card-Entscheidung",
      "Locally validated project evidence for the fixed experiment run with safe/leaked metric comparison and a model-card decision",
    ),
    scenario: text(
      "Eine fiktive Lern-App testet zwei synthetische Onboarding-Varianten. Der Datensatz enthält absichtlich fehlende Werte, eine nachgelagerte Leakage-Spalte und wiederholte Zwischenanalysen.",
      "A fictional learning app tests two synthetic onboarding variants. The dataset intentionally contains missing values, a downstream leakage column, and repeated interim analyses.",
    ),
    safety: text(
      "Der Datensatz ist vollständig generiert und beschreibt keine Personen. Keine eigenen Personen-, Gesundheits-, Finanz- oder Beschäftigtendaten laden.",
      "The dataset is entirely generated and describes no people. Do not load personal, health, financial, or employment data.",
    ),
    completionCriteria: [
      text(
        "Hypothese, primäre Metrik und Leakage-Ausschluss wurden im browserseitigen Plan festgelegt; der Text ist kein ausführbares SQL.",
        "The hypothesis, primary metric, and leakage exclusion are fixed in the browser-side plan; the text is not executable SQL.",
      ),
      text(
        "Der ausgeführte Vergleich trennt den sicheren +5-pp-Effekt vom geleakten +22-pp-Effekt und erkennt fünf Zwischenanalysen.",
        "The executed comparison separates the safe +5 pp effect from the leaked +22 pp effect and identifies five interim looks.",
      ),
      text(
        "Ergebnis, Unsicherheit, Grenzen und Reproduktionsschritte sind vollständig dokumentiert.",
        "Result, uncertainty, limitations, and reproduction steps are fully documented.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Fixiere Frage, Schätzwert, Metrik, Segment und Stoppregel.",
          "Lock the question, estimand, metric, segment, and stopping rule.",
        ),
        text("Vorab festgelegter Analyseplan", "Pre-specified analysis plan"),
      ],
      build: [
        text(
          "Spezifiziere Metrik und Leakage-Ausschluss im begrenzten Browserplan; der Plan wird nicht ausgeführt oder an die Sandbox gesendet.",
          "Specify the metric and leakage exclusion in the bounded browser plan; the plan is neither executed nor sent to Sandbox.",
        ),
        text(
          "Vorregistrierter Analysevertrag",
          "Preregistered analysis contract",
        ),
      ],
      run: [
        text(
          "Starte das feste serverseitige Programm für 249 generierte Zeilen sowie die vorgegebenen Leakage-, Missingness- und Stoppregeltests.",
          "Start the fixed server-side program for 249 generated rows and the supplied leakage, missingness, and stop-rule tests.",
        ),
        text(
          "Session-Laufprotokoll mit zwei grünen Invariantentests",
          "Session run transcript with two passing invariant tests",
        ),
      ],
      verify: [
        text(
          "Suche aktiv nach Leakage, Peeking, Confounding und instabilen Segmenten.",
          "Actively test for leakage, peeking, confounding, and unstable segments.",
        ),
        text(
          "Diagnostik- und Unsicherheitsbericht",
          "Diagnostics and uncertainty report",
        ),
      ],
      transfer: [
        text(
          "Formuliere Entscheidung, Grenzen, Monitoring und Reproduktionsweg.",
          "State the decision, limitations, monitoring, and reproduction path.",
        ),
        text(
          "Model Card und Experimentübergabe",
          "Model card and experiment handoff",
        ),
      ],
    }),
  },
  "data-infrastructure": {
    ...COURSE_PROJECT_IDENTITIES["data-infrastructure"],
    courseSlug: "data-infrastructure",
    title: text("Der Streaming-Kontrollraum", "The Streaming Control Room"),
    mission: text(
      "Registriere einen begrenzten, browserseitigen Telemetrieplan, aktiviere die feste Partitionsfixture und führe das serverseitig vorgegebene Recovery-Programm mit Invariantentests aus.",
      "Preregister a bounded browser-side telemetry plan, enable the fixed partition fixture, and run the server-supplied recovery program with invariant tests.",
    ),
    artifact: text(
      "Lokal validierter Projektnachweis zum festen Incidentlauf mit 684-ms-Bruch, 210-ms-Zero-Loss-Recovery und Wiederherstellungsentscheidung",
      "Locally validated project evidence for the fixed incident run with a 684 ms breach, 210 ms zero-loss recovery, and a recovery decision",
    ),
    scenario: text(
      "Die fiktive Orbit-Werkstatt streamt synthetische Sensormeldungen. Ein Netzschnitt trennt Replikate, danach entstehen Rückstau, Rebalance und verspätete Ereignisse.",
      "The fictional Orbit Works streams synthetic sensor events. A network cut separates replicas, followed by backlog, rebalance, and late events.",
    ),
    safety: text(
      "Infrastruktur und Telemetrie sind generierte Übungsfixtures. Der Code läuft isoliert ohne Netz; es bestehen keine Verbindungen zu Cloud-Konten, Clustern oder externen Nachrichtensystemen.",
      "Infrastructure and telemetry are generated exercise fixtures. Code runs in network-denied isolation with no cloud-account, cluster, or external-message-system connection.",
    ),
    completionCriteria: [
      text(
        "Partitionierung, Konsistenz, Wasserzeichen und Wiederholung sind als explizite Designentscheidungen begründet.",
        "Partitioning, consistency, watermarks, and replay are justified as explicit design decisions.",
      ),
      text(
        "Der ausgeführte Recovery-Lauf unterschreitet das 250-ms-SLO bei null Datenverlust und weist Kosten sowie Duplikatrate aus.",
        "The executed recovery run returns below the 250 ms SLO with zero data loss and reports cost and duplicate rate.",
      ),
      text(
        "Wiederherstellung enthält Reihenfolge, Validierung, Rückfall und verantwortliche Rolle.",
        "Recovery includes order, validation, rollback, and an accountable role.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Lege Datenfluss, Zuständigkeiten, Korrektheitsinvariante und SLO fest.",
          "Define data flow, ownership, correctness invariant, and SLO.",
        ),
        text("Systemkarte mit Invarianten", "System map with invariants"),
      ],
      build: [
        text(
          "Spezifiziere Backlog-, Latenz- und Kostenfelder im begrenzten Browserplan; der Plan wird nicht ausgeführt oder an die Sandbox gesendet.",
          "Specify backlog, latency, and cost fields in the bounded browser plan; the plan is neither executed nor sent to Sandbox.",
        ),
        text(
          "Vorregistrierter Telemetrievertrag",
          "Preregistered telemetry contract",
        ),
      ],
      run: [
        text(
          "Starte das feste serverseitige Programm für Partitionsbruch, Rückstau und kontrollierten Replay.",
          "Start the fixed server-side program for partition failure, backlog, and controlled replay.",
        ),
        text(
          "Session-Timeline für Incident und Recovery",
          "Session incident and recovery timeline",
        ),
      ],
      verify: [
        text(
          "Prüfe Verlust, Duplikate, Latenz, Kosten und Wiederholbarkeit.",
          "Check loss, duplicates, latency, cost, and replayability.",
        ),
        text(
          "SLO- und Korrektheitsbewertung",
          "SLO and correctness assessment",
        ),
      ],
      transfer: [
        text(
          "Schreibe Wiederherstellungsfolge, Alarmgrenzen und Postmortem-Aktion.",
          "Write the recovery sequence, alert thresholds, and postmortem action.",
        ),
        text(
          "Incident-Runbook und Designentscheidung",
          "Incident runbook and design decision",
        ),
      ],
    }),
  },
  codex: {
    ...COURSE_PROJECT_IDENTITIES.codex,
    courseSlug: "codex",
    title: text("Die Repository-Mission", "The Repository Mission"),
    mission: text(
      "Spezifiziere eine begrenzte Reparatur, erprobe `queue-kit` in der nicht verifizierenden Browser-Simulation und starte danach die feste serverseitige Sandbox-Prüfkette.",
      "Specify a bounded repair, rehearse `queue-kit` in the non-verifying browser simulation, then start the fixed server-side Sandbox verification pipeline.",
    ),
    artifact: text(
      "Lokal validierter Projektnachweis mit Task-Spec und Session-Beleg der festen Sandbox-Patch- und Prüfkette",
      "Locally validated project evidence with a task spec and session evidence from the fixed Sandbox patch-and-check pipeline",
    ),
    scenario: text(
      "Das fiktive Paket queue-kit enthält eine absichtlich fehlerhafte Retry-Funktion, lokale Tests und eine kleine AGENTS.md. Der Workspace enthält keine Netzwerke, Secrets oder fremden Repositories.",
      "The fictional queue-kit package contains an intentionally faulty retry function, local tests, and a small AGENTS.md. The workspace contains no network, secrets, or third-party repositories.",
    ),
    safety: text(
      "Die Browser-Konsole simuliert `queue-kit` lokal. Der echte Lauf verwendet nur serverseitig erzeugte Dateien und eine feste Zehn-Schritt-Sequenz; Lernenden-Code, freie Befehle und Repositories werden nicht angenommen.",
      "The browser console simulates `queue-kit` locally. The real run uses only server-generated files and a fixed ten-step sequence; learner code, free-form commands, and repositories are not accepted.",
    ),
    completionCriteria: [
      text(
        "Task-Spec nennt Scope, Nicht-Ziele, Akzeptanzkriterien und erlaubte Checks.",
        "The task spec states scope, non-goals, acceptance criteria, and allowed checks.",
      ),
      text(
        "Die feste serverseitige Sequenz zeigt den erwarteten roten Test, wendet den vorgegebenen begrenzten Fix an und besteht die nachfolgenden Checks.",
        "The fixed server-side sequence shows the expected failing test, applies the supplied bounded fix, and passes the subsequent checks.",
      ),
      text(
        "Der finale Diff enthält keine Nebenänderungen und wird gegen jedes Kriterium geprüft.",
        "The final diff contains no unrelated changes and is checked against every criterion.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Lies Instruktionen, kartiere den Fehler und begrenze den zulässigen Scope.",
          "Read the instructions, map the defect, and bound the permitted scope.",
        ),
        text(
          "Task-Spec mit Akzeptanzkriterien",
          "Task spec with acceptance criteria",
        ),
      ],
      build: [
        text(
          "Erprobe den vorgegebenen Fix in der Browser-Simulation; diese lokale Queue-Kit-Übung erzeugt keine Abnahme-Evidenz.",
          "Rehearse the supplied fix in the browser simulation; this local queue-kit exercise produces no acceptance evidence.",
        ),
        text(
          "Nicht verifizierende Patch-Probe",
          "Non-verifying patch rehearsal",
        ),
      ],
      run: [
        text(
          "Starte die feste Zehn-Schritt-Sequenz im frischen serverseitigen Sandbox-Repository.",
          "Start the fixed ten-step sequence in the fresh server-side Sandbox repository.",
        ),
        text(
          "Session-Befehlsprotokoll mit Exit-Codes",
          "Session command transcript with exit codes",
        ),
      ],
      verify: [
        text(
          "Prüfe Diff, Grenzfälle, Fehlermeldungen und Akzeptanzkriterien.",
          "Review the diff, edge cases, failure messages, and acceptance criteria.",
        ),
        text("Kriterienbasierter Diff-Review", "Criteria-based diff review"),
      ],
      transfer: [
        text(
          "Schreibe eine knappe Übergabe mit Änderung, Beleg, Risiko und offenem Punkt.",
          "Write a concise handoff covering change, evidence, risk, and open issue.",
        ),
        text("Reviewfähige Übergabenotiz", "Review-ready handoff note"),
      ],
    }),
  },
  claude: {
    ...COURSE_PROJECT_IDENTITIES.claude,
    courseSlug: "claude",
    title: text("Das Grounding-Labor", "The Grounding Lab"),
    mission: text(
      "Entwickle zwei Promptvarianten für ein synthetisches Quellenpaket, vergleiche die Antworten und redliniere jede unbelegte Aussage.",
      "Develop two prompt variants for a synthetic source packet, compare their answers, and redline every unsupported claim.",
    ),
    artifact: text(
      "Provider-gestütztes Prompt-Paket mit zwei echten Antworten, Claim-Evidenz-Redlining und vierdimensionaler Eval-Rubrik",
      "Provider-backed prompt package with two real responses, claim-evidence redlining, and a four-dimension evaluation rubric",
    ),
    scenario: text(
      "Ein fiktives Museum plant eine Ausstellung aus einem synthetischen Quellenpaket. Einige Notizen widersprechen sich; eine attraktive Behauptung wird von keiner Quelle getragen.",
      "A fictional museum is planning an exhibition from a synthetic source packet. Some notes conflict, and one attractive claim is unsupported by any source.",
    ),
    safety: text(
      "Nur das bereitgestellte Fantasiearchiv verwenden. Das Labor ist kein vertraulicher Dokumentenkanal und behauptet keine automatische Faktengarantie.",
      "Use only the supplied fictional archive. The lab is not a channel for confidential documents and makes no automatic factual-guarantee claim.",
    ),
    completionCriteria: [
      text(
        "Basis- und Grounding-Prompt laufen mit identischem Quellenpaket; nur der Grounding-Vertrag erzwingt Quellenbindung, Unsicherheitsformat und Verweigerung.",
        "Baseline and grounded prompts run against the same source packet; only the grounded contract enforces source binding, uncertainty format, and refusal behavior.",
      ),
      text(
        "Drei feste Claims sind einer Quelle, einem Konflikt oder einer Beleglücke zugeordnet und als beibehalten, eingeschränkt oder entfernt redigiert.",
        "Three fixed claims map to a source, conflict, or evidence gap and are redlined as retained, qualified, or removed.",
      ),
      text(
        "Die Eval-Rubrik bewertet Faktentreue, Vollständigkeit, Kalibrierung und Format mit getrennten verankerten Punktwerten von 1 bis 4.",
        "The evaluation rubric scores factuality, completeness, calibration, and format separately on anchored scales from 1 to 4.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Inventarisiere Quellen, Konflikte, fehlende Belege und zulässige Schlussfolgerungen.",
          "Inventory sources, conflicts, missing evidence, and permitted inferences.",
        ),
        text("Quellen- und Konfliktkarte", "Source and conflict map"),
      ],
      build: [
        text(
          "Baue Basis- und Grounding-Prompt mit identischem Auftrag.",
          "Build baseline and grounded prompts for the same task.",
        ),
        text(
          "Zwei versionierte Promptverträge",
          "Two versioned prompt contracts",
        ),
      ],
      run: [
        text(
          "Führe beide Varianten gegen dasselbe synthetische Quellenpaket aus.",
          "Run both variants against the same synthetic source packet.",
        ),
        text(
          "Paralleler Antwort- und Nutzungsvergleich",
          "Side-by-side response and usage comparison",
        ),
      ],
      verify: [
        text(
          "Ordne Claims, Zitate, Auslassungen und Unsicherheit mit einer Rubrik zu.",
          "Map claims, citations, omissions, and uncertainty with a rubric.",
        ),
        text(
          "Claim-Evidenz-Matrix und Eval",
          "Claim-evidence matrix and evaluation",
        ),
      ],
      transfer: [
        text(
          "Extrahiere ein wiederverwendbares Grounding-Muster samt Abbruchregel.",
          "Extract a reusable grounding pattern with a stop rule.",
        ),
        text(
          "Promptmuster und Team-Review-Checkliste",
          "Prompt pattern and team review checklist",
        ),
      ],
    }),
  },
  "ai-native-operator": {
    ...COURSE_PROJECT_IDENTITIES["ai-native-operator"],
    courseSlug: "ai-native-operator",
    title: text(
      "Das Delegations-Kontrollbriefing",
      "The Delegation Control Brief",
    ),
    mission: text(
      "Formuliere einen begrenzten Delegationsprompt, fordere genau eine Modellantwort an und bewerte sie mit lokal gesetzten Budget-, Freigabe-, Abbruch- und Übergabekontrollen. Es werden keine Agenten oder Werkzeuge ausgeführt.",
      "Write a bounded delegation prompt, request exactly one model completion, and assess it with locally selected budget, approval, stop, and handoff controls. No agents or tools are executed.",
    ),
    artifact: text(
      "Lokal validierter Projektnachweis zu einer einzelnen Provider-Antwort mit Delegations-, Kontroll- und Interventionsplan",
      "Locally validated project evidence for one provider completion with a delegation, control, and intervention plan",
    ),
    scenario: text(
      "Das fiktive Unternehmen Lumen Tools plant aus synthetischen Support-Tickets einen Verbesserungsbericht. Scout, Analyst, Kritiker und Redakteur sind Rollen im lokalen Delegationsplan, keine ausgeführten Agenten.",
      "The fictional company Lumen Tools plans an improvement report from synthetic support tickets. Scout, analyst, critic, and editor are roles in the local delegation plan, not executed agents.",
    ),
    safety: text(
      "Alle Tickets und Organisationen sind erfunden. Kein autonomer Versand, keine externen Tools und keine echten Kunden-, Team- oder Betriebsdaten.",
      "All tickets and organizations are fictional. No autonomous sending, external tools, or real customer, team, or operational data.",
    ),
    completionCriteria: [
      text(
        "Der Prompt begrenzt Auftrag, zulässigen Kontext, Ausgabeformat und verbotene Aktionen.",
        "The prompt bounds the task, allowed context, output format, and prohibited actions.",
      ),
      text(
        "Eine echte Provider-Antwort liegt vor; Budget, Freigabe, Abbruch und Übergabe sind als lokale Plankontrollen gesetzt.",
        "A real provider completion exists; budget, approval, stop, and handoff are recorded as local planning controls.",
      ),
      text(
        "Die lokale Auswertung wählt eine Intervention und trennt Ergebnisqualität, Fehler, Reviewaufwand und geschätzten Aufwand.",
        "The local assessment selects an intervention and separates output quality, errors, review effort, and estimated effort.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Definiere Ziel, geplante Rollen, Nicht-Ziele, Budgetgrenze und menschliche Verantwortung.",
          "Define the goal, planned roles, non-goals, budget limit, and human accountability.",
        ),
        text("Begrenzter Delegationsauftrag", "Bounded delegation brief"),
      ],
      build: [
        text(
          "Schreibe Kontext und Prompt und setze die lokalen Budget-, Freigabe-, Abbruch- und Übergabekontrollen.",
          "Write the context and prompt and select the local budget, approval, stop, and handoff controls.",
        ),
        text(
          "Delegationsprompt und lokaler Kontrollplan",
          "Delegation prompt and local control plan",
        ),
      ],
      run: [
        text(
          "Fordere für den synthetischen Auftrag genau eine Antwort vom freigegebenen Provider an.",
          "Request exactly one completion from the allowed provider for the synthetic task.",
        ),
        text(
          "Provider-Antwort im aktuellen Browserlauf",
          "Provider completion in the current browser session",
        ),
      ],
      verify: [
        text(
          "Bewerte die einzelne Antwort gegen Evidenz, Budgetgrenze, Freigaberegel und menschlichen Reviewaufwand.",
          "Assess the single completion against evidence, the budget limit, approval rule, and human review effort.",
        ),
        text(
          "Lokale Output- und Interventionsbewertung",
          "Local output and intervention assessment",
        ),
      ],
      transfer: [
        text(
          "Plane Eigentum, Monitoring, Incident-Weg, Abschaltung und nächste Iteration für einen künftigen echten Prozess.",
          "Plan ownership, monitoring, incident path, shutdown, and the next iteration for a future real process.",
        ),
        text("Geplantes Delegationsrunbook", "Planned delegation runbook"),
      ],
    }),
  },
} as const satisfies Readonly<Record<CourseSlug, CourseProjectConfig>>;

export function getCourseProjectConfig(
  courseSlug: CourseSlug,
): CourseProjectConfig {
  return COURSE_PROJECT_CONFIGS[courseSlug];
}
