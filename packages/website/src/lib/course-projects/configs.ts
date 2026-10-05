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
      "Mach aus einem unsicheren Arbeitsauftrag ein begrenztes, prüfbares KI-Briefing und redliniere den Entwurf.",
      "Turn an unsafe work request into a bounded, testable AI brief and redline the draft.",
    ),
    artifact: text(
      "Prompt-Briefing mit Datenklassen, Quellenplan und Output-Redline",
      "Prompt brief with data classes, source plan and output redline",
    ),
    scenario: text(
      "Ein fiktiver Büroausstatter macht aus Produktnotizen eine Kundenmail. Der Entwurf mischt interne Hinweise mit unbelegten Behauptungen.",
      "A fictional office-supply company turns product notes into a customer email. The draft mixes internal notes with unsupported claims.",
    ),
    safety: text(
      "Nur die mitgelieferten Fantasiedaten verwenden, keine Namen, Kontaktdaten, vertraulichen Dokumente oder echten Geschäftsvorgänge.",
      "Use only the supplied fictional data: no names, contact details, confidential documents or real business matters.",
    ),
    completionCriteria: [
      text(
        "Jede Eingabe hat eine Datenklasse, unzulässiger Kontext ist entfernt.",
        "Every input has a data class; disallowed context is removed.",
      ),
      text(
        "Das Briefing nennt Ziel, Kontext, Grenzen, Ausgabeformat und menschliche Prüfung.",
        "The brief states goal, context, boundaries, output format and human review.",
      ),
      text(
        "Die Redline ersetzt unbelegte Aussagen durch belegte oder als unsicher markierte.",
        "The redline replaces unsupported claims with supported or clearly uncertain wording.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Ordne Aufgabe, Datenklassen und mögliche Schäden ein, bevor du ein Modell wählst.",
          "Classify task, data classes and possible harm before choosing a model.",
        ),
        text(
          "Auftragsgrenze und Datenfreigabe",
          "Task boundary and data clearance",
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
          "Führe das Briefing am Übungsfall aus und notiere Annahmen.",
          "Run the brief on the practice case and note assumptions.",
        ),
        text("Entwurf mit Annahmenprotokoll", "Draft with assumption log"),
      ],
      verify: [
        text(
          "Prüfe jede Tatsachenbehauptung, Datenstelle und Handlungsaufforderung.",
          "Check every factual claim, data reference, and call to action.",
        ),
        text(
          "Claim- und Datenschutz-Redline",
          "Claim and privacy redline",
        ),
      ],
      transfer: [
        text(
          "Schreib eine Checkliste für einen eigenen, freigegebenen Arbeitsablauf.",
          "Write a checklist for one approved workflow of your own.",
        ),
        text(
          "Fünf-Punkte-Checkliste",
          "Five-point checklist",
        ),
      ],
    }),
  },
  "eu-ai-act-kurs": {
    ...COURSE_PROJECT_IDENTITIES["eu-ai-act-kurs"],
    courseSlug: "eu-ai-act-kurs",
    title: text("Das AI-Act-Fallarchiv", "The AI Act Case File"),
    mission: text(
      "Ordne einen fiktiven KI-Einsatz ein, trenne Rollen und Pflichten und leg eine datierte Evidenzakte an.",
      "Classify a fictional AI use, separate roles and duties, and build a dated evidence file.",
    ),
    artifact: text(
      "Datierte Fallakte: Systemgrenze, Rollen, Risikopfad, Pflichten, offene Rechtsfragen",
      "Dated case file: system boundary, roles, risk path, duties, open legal questions",
    ),
    scenario: text(
      "Die fiktive Stadt Nordhafen prüft ein System, das synthetische Ausbildungsbewerbungen vorsortiert. Anbieter, Betreiber, Zweck und menschliche Entscheidung sind lückenhaft beschrieben.",
      "The fictional city of Northhaven assesses a system that pre-sorts synthetic apprenticeship applications. Provider, deployer, purpose and human decision are incompletely described.",
    ),
    safety: text(
      "Keine echten Personen, keine Rechtsberatung. Ergebnisse sind Lernhypothesen, die an datierten Primärquellen zu prüfen sind.",
      "No real people, not legal advice. Results are learning hypotheses to check against dated primary sources.",
    ),
    completionCriteria: [
      text(
        "Zweck, betroffene Entscheidung und Rollen sind getrennt dokumentiert.",
        "Purpose, affected decision and roles are documented separately.",
      ),
      text(
        "Der Risikopfad nennt entscheidende Tatsachen, Gegenargumente und Lücken.",
        "The risk path states decisive facts, counterarguments and gaps.",
      ),
      text(
        "Jede Pflicht hat Rolle, Zeitpunkt und datierte Quelle.",
        "Every duty has a role, a date and a dated source.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Zieh die Systemgrenze und benenne Zweck, Betroffene und Entscheidung.",
          "Draw the system boundary; name purpose, affected people and decision.",
        ),
        text("System- und Entscheidungskarte", "System and decision map"),
      ],
      build: [
        text(
          "Ordne Anbieter, Betreiber und weitere Rollen begründet zu.",
          "Assign provider, deployer and other roles with reasons.",
        ),
        text("Begründete Rollenmatrix", "Reasoned role matrix"),
      ],
      run: [
        text(
          "Prüfe Verbot, Hochrisiko, Transparenz und sonstige Pfade, ohne einen auszulassen.",
          "Check prohibited, high-risk, transparency and other paths without skipping one.",
        ),
        text(
          "Klassifikationspfad",
          "Classification path",
        ),
      ],
      verify: [
        text(
          "Hol Gegenbelege ein und verknüpfe Aussagen mit Rechtsstand und Primärquelle.",
          "Seek counter-evidence and link claims to legal date and primary source.",
        ),
        text(
          "Quellen- und Unsicherheitsprotokoll",
          "Source and uncertainty log",
        ),
      ],
      transfer: [
        text(
          "Erstelle eine Aufnahmeliste für neue KI-Anwendungsfälle.",
          "Create an intake list for new AI use cases.",
        ),
        text(
          "Aufnahmevorlage mit Eskalationspunkten",
          "Intake template with escalation points",
        ),
      ],
    }),
  },
  "ai-native": {
    ...COURSE_PROJECT_IDENTITIES["ai-native"],
    courseSlug: "ai-native",
    title: text("Die kontrollierte Arbeitsstrecke", "The Controlled Work Run"),
    mission: text(
      "Mach aus einem unscharfen Auftrag einen begrenzten Prompt, hol genau eine Modellantwort ein und bewerte sie mit Freigabe-, Abbruch- und Übergabekontrollen. Werkzeuge laufen nicht.",
      "Turn a vague request into a bounded prompt, request exactly one model completion and assess it with approval, stop and handoff controls. No tools are executed.",
    ),
    artifact: text(
      "Lokal validierter Projektnachweis: eine Provider-Antwort mit Kontroll- und Übergabeplan",
      "Locally validated project evidence: one provider completion with a control and handoff plan",
    ),
    scenario: text(
      "Eine fiktive Energiegenossenschaft braucht aus synthetischen Projektmeldungen einen Wochenüberblick. Die Meldungen widersprechen sich, manche Schritte brauchen menschliche Freigabe.",
      "A fictional energy cooperative needs a weekly overview from synthetic project updates. The updates conflict; some steps need human approval.",
    ),
    safety: text(
      "Nur die mitgelieferten Projektdaten, keine echten Kunden-, Beschäftigten-, Finanz- oder Zugangsdaten.",
      "Only the supplied project data: no real customer, employee, financial or credential data.",
    ),
    completionCriteria: [
      text(
        "Der Prompt nennt Ziel, Kontext, Ausgabeformat und harte Grenzen.",
        "The prompt states goal, context, output format and hard limits.",
      ),
      text(
        "Eine echte Provider-Antwort liegt vor; Freigabe, Abbruch und Übergabe sind als lokale Plankontrollen gesetzt.",
        "A real provider completion exists; approval, stop and handoff are set as local plan controls.",
      ),
      text(
        "Die Übergabe nennt Verantwortliche, Fallback, Messgröße und Wiederanlauf.",
        "The handoff names owner, fallback, measure and restart.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Lege Ergebnis, Nicht-Ziele, Datenfreigabe und Erfolgssignal fest.",
          "Define outcome, non-goals, data clearance and success signal.",
        ),
        text("Abgegrenzter Arbeitsauftrag", "Bounded work order"),
      ],
      build: [
        text(
          "Schreib Kontext und Prompt und setze Freigabe, Abbruch, Übergabe und Fallback.",
          "Write context and prompt; set approval, stop, handoff and fallback.",
        ),
        text("Prompt- und Kontrollplan", "Prompt and control plan"),
      ],
      run: [
        text(
          "Hol genau eine Antwort vom freigegebenen Provider ein.",
          "Request exactly one completion from the allowed provider.",
        ),
        text(
          "Provider-Antwort in diesem Browserlauf",
          "Provider completion in this browser session",
        ),
      ],
      verify: [
        text(
          "Bewerte die Antwort gegen Auftrag, Freigabe, Abbruchregel, Verantwortung und Fallback.",
          "Assess the completion against task, approval, stop rule, ownership and fallback.",
        ),
        text(
          "Output- und Kontrollbewertung",
          "Output and control assessment",
        ),
      ],
      transfer: [
        text(
          "Plane Verantwortung, Ausnahmeweg, Fallback und Wiederanlauf für einen echten Arbeitsprozess.",
          "Plan ownership, exception path, fallback and restart for a real work process.",
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
      "Untersuche einen Medienfund, trenne Beobachtung von Behauptung und entscheide nachvollziehbar über Veröffentlichung und Korrektur.",
      "Investigate a media item, separate observation from claim, and decide traceably on publication and correction.",
    ),
    artifact: text(
      "Verifikationsdossier: Herkunft, Quellenvergleich, Betroffene, Publikationsentscheidung",
      "Verification dossier: provenance, source comparison, stakeholders, publication decision",
    ),
    scenario: text(
      "Im fiktiven Sonnenbrück kursiert ein synthetisches Video über die Schließung eines erfundenen Werks. Mehrere Accounts verbreiten widersprüchliche Ausschnitte.",
      "In the fictional town of Sunbridge, a synthetic video claims an invented factory will close. Several accounts spread conflicting clips.",
    ),
    safety: text(
      "Keine echten Medien, Personen oder Accounts hochladen. Werkzeuge liefern Indizien, keinen Echtheitsbeweis; halte Unsicherheit sichtbar.",
      "Do not upload real media, people or accounts. Tools give signals, not proof of authenticity; keep uncertainty visible.",
    ),
    completionCriteria: [
      text(
        "Behauptung, beobachtbare Merkmale und Deutung sind getrennt.",
        "Claim, observable signals and interpretation are kept apart.",
      ),
      text(
        "Mindestens zwei unabhängige Quellenpfade und die Restunsicherheit sind dokumentiert.",
        "At least two independent source paths and the remaining uncertainty are documented.",
      ),
      text(
        "Die Publikationsentscheidung wägt Schaden, Betroffene, Korrektur und Eskalation ab.",
        "The publication decision addresses harm, affected parties, correction, and escalation.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Halte Behauptung, Zeitpunkt, Quelle und Betroffene getrennt fest.",
          "Record claim, time, source and affected parties separately.",
        ),
        text("Versiegelte Ausgangsnotiz", "Sealed intake note"),
      ],
      build: [
        text(
          "Rekonstruiere die Herkunft und plane unabhängige Gegenprüfungen.",
          "Trace the provenance and plan independent cross-checks.",
        ),
        text("Quellen- und Prüfplan", "Source and verification plan"),
      ],
      run: [
        text(
          "Vergleiche Ausschnitte, Metadaten und Aussagen.",
          "Compare clips, metadata and statements.",
        ),
        text(
          "Beobachtungsmatrix ohne Urteil",
          "Observation matrix without verdict",
        ),
      ],
      verify: [
        text(
          "Prüfe andere Erklärungen und bewerte Sicherheit und Schadensrisiko.",
          "Test other explanations; rate confidence and harm risk.",
        ),
        text(
          "Konfidenz- und Schadensbewertung",
          "Confidence and harm assessment",
        ),
      ],
      transfer: [
        text(
          "Schreib Regeln für Veröffentlichung, Korrektur und Eskalation im nächsten Fall.",
          "Write publication, correction and escalation rules for the next case.",
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
      "Leg vorab einen begrenzten Pipelineplan fest, aktiviere die feste Fehlerfixture und führe das vorgegebene Node-Programm mit Invariantentests auf dem Server aus.",
      "Preregister a bounded pipeline plan, enable the fixed failure fixture and run the server-supplied Node program with invariant tests.",
    ),
    artifact: text(
      "Lokal validierter Projektnachweis: fester Node-Lauf mit Mengenabgleich, 102→102-Replay und Backfill-Entscheidung",
      "Locally validated project evidence: fixed Node run with reconciliation, 102→102 replay and a backfill decision",
    ),
    scenario: text(
      "Ein fiktiver Paketdienst liefert synthetische Scan-Ereignisse aus drei Depots, manche verspätet, doppelt oder mit ungültigem Status.",
      "A fictional parcel service supplies synthetic scan events from three depots, some late, duplicated or with an invalid status.",
    ),
    safety: text(
      "Alle IDs, Zeiten und Orte sind generiert. Keine externen Tabellen, Zugangsdaten oder Produktionsendpunkte anbinden.",
      "All IDs, times and locations are generated. Do not connect external tables, credentials or production endpoints.",
    ),
    completionCriteria: [
      text(
        "Der Browserplan nennt Schlüssel und Zeitsemantik; er ist kein ausführbares SQL.",
        "The browser plan states keys and time semantics; it is not executable SQL.",
      ),
      text(
        "Der Backfill verarbeitet acht Late Events; ein Replay endet wieder bei genau 102 fachlichen Ergebnissen.",
        "The backfill processes eight late events; a replay again ends at exactly 102 business results.",
      ),
      text(
        "Backfill und Late Events bestehen die vorgegebenen Qualitätsprüfungen.",
        "Backfill and late events pass the supplied quality checks.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Plane Ereignisfelder, Schlüssel, Zeitsemantik und Qualitätsrisiken.",
          "Plan event fields, keys, time semantics and quality risks.",
        ),
        text(
          "Quellprofil und Datenvertrag",
          "Source profile and data contract",
        ),
      ],
      build: [
        text(
          "Lege Deduplizierung und Event-Time-Regeln im Browserplan fest; der Plan wird weder ausgeführt noch an die Sandbox gesendet.",
          "Specify deduplication and event-time rules in the browser plan; the plan is neither executed nor sent to Sandbox.",
        ),
        text(
          "Vorab festgelegter Pipelinevertrag",
          "Preregistered pipeline contract",
        ),
      ],
      run: [
        text(
          "Starte das feste Serverprogramm für 117 generierte Events mit Duplikaten, Verspätung und Statusfehlern.",
          "Start the fixed server program for 117 generated events with duplicates, lateness and a status error.",
        ),
        text(
          "Laufprotokoll mit Exit-Codes",
          "Run transcript with exit codes",
        ),
      ],
      verify: [
        text(
          "Prüfe Idempotenz, Mengenabgleich, Wasserzeichen und Wiederanlauf.",
          "Verify idempotency, reconciliation, watermarks and restart.",
        ),
        text(
          "Grüner Qualitäts- und Wiederanlauftest",
          "Passing quality and restart test",
        ),
      ],
      transfer: [
        text(
          "Dokumentiere Backfill-Fenster, Eigentum, Alarm und Rückbau.",
          "Document backfill window, ownership, alert and rollback.",
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
      "Leg vorab einen begrenzten Analyseplan fest, aktiviere die feste Leakage-Fixture und führe das vorgegebene Experimentprogramm mit Invariantentests auf dem Server aus.",
      "Preregister a bounded analysis plan, enable the fixed leakage fixture and run the server-supplied experiment program with invariant tests.",
    ),
    artifact: text(
      "Lokal validierter Projektnachweis: fester Experimentlauf mit sicherem/geleaktem Metrikvergleich und Model-Card-Entscheidung",
      "Locally validated project evidence: fixed experiment run with safe/leaked metric comparison and a model-card decision",
    ),
    scenario: text(
      "Eine fiktive Lern-App testet zwei synthetische Onboarding-Varianten. Der Datensatz enthält fehlende Werte, eine nachgelagerte Leakage-Spalte und wiederholte Zwischenanalysen.",
      "A fictional learning app tests two synthetic onboarding variants. The dataset holds missing values, a downstream leakage column and repeated interim analyses.",
    ),
    safety: text(
      "Der Datensatz ist generiert und beschreibt keine Personen. Lade keine eigenen Personen-, Gesundheits-, Finanz- oder Beschäftigtendaten.",
      "The dataset is generated and describes no people. Do not load personal, health, financial or employment data.",
    ),
    completionCriteria: [
      text(
        "Hypothese, primäre Metrik und Leakage-Ausschluss stehen im Browserplan; der Text ist kein ausführbares SQL.",
        "Hypothesis, primary metric and leakage exclusion are fixed in the browser plan; the text is not executable SQL.",
      ),
      text(
        "Der Vergleich trennt den sicheren +5-pp-Effekt vom geleakten +22-pp-Effekt und erkennt fünf Zwischenanalysen.",
        "The comparison separates the safe +5 pp effect from the leaked +22 pp effect and finds five interim looks.",
      ),
      text(
        "Ergebnis, Unsicherheit, Grenzen und Reproduktionsschritte sind dokumentiert.",
        "Result, uncertainty, limits and reproduction steps are documented.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Fixiere Frage, Schätzwert, Metrik, Segment und Stoppregel.",
          "Lock question, estimand, metric, segment and stopping rule.",
        ),
        text("Vorab festgelegter Analyseplan", "Pre-specified analysis plan"),
      ],
      build: [
        text(
          "Lege Metrik und Leakage-Ausschluss im Browserplan fest; der Plan wird weder ausgeführt noch an die Sandbox gesendet.",
          "Specify metric and leakage exclusion in the browser plan; the plan is neither executed nor sent to Sandbox.",
        ),
        text(
          "Vorab festgelegter Analysevertrag",
          "Preregistered analysis contract",
        ),
      ],
      run: [
        text(
          "Starte das feste Serverprogramm für 249 generierte Zeilen mit den vorgegebenen Leakage-, Missingness- und Stoppregeltests.",
          "Start the fixed server program for 249 generated rows with the supplied leakage, missingness and stop-rule tests.",
        ),
        text(
          "Laufprotokoll mit zwei grünen Invariantentests",
          "Run transcript with two passing invariant tests",
        ),
      ],
      verify: [
        text(
          "Suche nach Leakage, Peeking, Confounding und instabilen Segmenten.",
          "Test for leakage, peeking, confounding and unstable segments.",
        ),
        text(
          "Diagnostik- und Unsicherheitsbericht",
          "Diagnostics and uncertainty report",
        ),
      ],
      transfer: [
        text(
          "Halte Entscheidung, Grenzen, Monitoring und Reproduktionsweg fest.",
          "State decision, limits, monitoring and reproduction path.",
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
      "Leg vorab einen begrenzten Telemetrieplan fest, aktiviere die feste Partitionsfixture und führe das vorgegebene Recovery-Programm mit Invariantentests auf dem Server aus.",
      "Preregister a bounded telemetry plan, enable the fixed partition fixture and run the server-supplied recovery program with invariant tests.",
    ),
    artifact: text(
      "Lokal validierter Projektnachweis: fester Incidentlauf mit 684-ms-Bruch, 210-ms-Recovery ohne Verlust und Wiederherstellungsentscheidung",
      "Locally validated project evidence: fixed incident run with a 684 ms breach, 210 ms zero-loss recovery and a recovery decision",
    ),
    scenario: text(
      "Die fiktive Orbit-Werkstatt streamt synthetische Sensormeldungen. Ein Netzschnitt trennt Replikate; es folgen Rückstau, Rebalance und verspätete Ereignisse.",
      "The fictional Orbit Works streams synthetic sensor events. A network cut separates replicas, followed by backlog, rebalance, and late events.",
    ),
    safety: text(
      "Infrastruktur und Telemetrie sind generiert. Der Code läuft isoliert, ohne Netz und ohne Verbindung zu Cloud-Konten, Clustern oder Nachrichtensystemen.",
      "Infrastructure and telemetry are generated. Code runs isolated, without network or links to cloud accounts, clusters or message systems.",
    ),
    completionCriteria: [
      text(
        "Partitionierung, Konsistenz, Wasserzeichen und Replay sind als Designentscheidungen begründet.",
        "Partitioning, consistency, watermarks and replay are justified as design decisions.",
      ),
      text(
        "Der Recovery-Lauf bleibt ohne Datenverlust unter dem 250-ms-SLO und weist Kosten und Duplikatrate aus.",
        "The recovery run gets below the 250 ms SLO with zero data loss and reports cost and duplicate rate.",
      ),
      text(
        "Die Wiederherstellung nennt Reihenfolge, Validierung, Rückfall und verantwortliche Rolle.",
        "Recovery names order, validation, rollback and an accountable role.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Lege Datenfluss, Zuständigkeiten, Korrektheitsinvariante und SLO fest.",
          "Define data flow, ownership, correctness invariant and SLO.",
        ),
        text("Systemkarte mit Invarianten", "System map with invariants"),
      ],
      build: [
        text(
          "Lege Backlog-, Latenz- und Kostenfelder im Browserplan fest; der Plan wird weder ausgeführt noch an die Sandbox gesendet.",
          "Specify backlog, latency and cost fields in the browser plan; the plan is neither executed nor sent to Sandbox.",
        ),
        text(
          "Vorab festgelegter Telemetrievertrag",
          "Preregistered telemetry contract",
        ),
      ],
      run: [
        text(
          "Starte das feste Serverprogramm für Partitionsbruch, Rückstau und kontrollierten Replay.",
          "Start the fixed server program for partition failure, backlog and controlled replay.",
        ),
        text(
          "Timeline für Incident und Recovery",
          "Incident and recovery timeline",
        ),
      ],
      verify: [
        text(
          "Prüfe Verlust, Duplikate, Latenz, Kosten und Wiederholbarkeit.",
          "Check loss, duplicates, latency, cost and replayability.",
        ),
        text(
          "SLO- und Korrektheitsbewertung",
          "SLO and correctness assessment",
        ),
      ],
      transfer: [
        text(
          "Schreibe Wiederherstellungsfolge, Alarmgrenzen und Postmortem-Aktion.",
          "Write recovery sequence, alert thresholds and postmortem action.",
        ),
        text(
          "Incident-Runbook und Designentscheidung",
          "Incident runbook and design decision",
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
      "Schreib einen begrenzten Delegationsprompt, hol genau eine Modellantwort ein und bewerte sie mit Budget-, Freigabe-, Abbruch- und Übergabekontrollen. Agenten laufen nicht.",
      "Write a bounded delegation prompt, request exactly one model completion and assess it with budget, approval, stop and handoff controls. No agents or tools are executed.",
    ),
    artifact: text(
      "Lokal validierter Projektnachweis: eine Provider-Antwort mit Delegations-, Kontroll- und Eingriffsplan",
      "Locally validated project evidence: one provider completion with a delegation, control and intervention plan",
    ),
    scenario: text(
      "Die fiktive Firma Lumen Tools plant aus synthetischen Support-Tickets einen Verbesserungsbericht. Scout, Analyst, Kritiker und Redakteur sind nur Rollen im Plan.",
      "The fictional company Lumen Tools plans an improvement report from synthetic support tickets. Scout, analyst, critic and editor are only roles in the plan.",
    ),
    safety: text(
      "Alle Tickets und Firmen sind erfunden. Kein autonomer Versand, keine externen Tools, keine echten Kunden-, Team- oder Betriebsdaten.",
      "All tickets and companies are fictional. No autonomous sending, no external tools, no real customer, team or operational data.",
    ),
    completionCriteria: [
      text(
        "Der Prompt begrenzt Auftrag, zulässigen Kontext, Ausgabeformat und verbotene Aktionen.",
        "The prompt bounds task, allowed context, output format and prohibited actions.",
      ),
      text(
        "Eine echte Provider-Antwort liegt vor; Budget, Freigabe, Abbruch und Übergabe sind als lokale Plankontrollen gesetzt.",
        "A real provider completion exists; budget, approval, stop and handoff are set as local plan controls.",
      ),
      text(
        "Die Auswertung wählt einen Eingriff und trennt Ergebnisqualität, Fehler, Reviewaufwand und geschätzten Aufwand.",
        "The assessment picks an intervention and separates output quality, errors, review effort and estimated effort.",
      ),
    ],
    stages: stages({
      ground: [
        text(
          "Lege Ziel, Rollen, Nicht-Ziele, Budgetgrenze und menschliche Verantwortung fest.",
          "Define goal, roles, non-goals, budget limit and human accountability.",
        ),
        text("Begrenzter Delegationsauftrag", "Bounded delegation brief"),
      ],
      build: [
        text(
          "Schreib Kontext und Prompt und setze Budget, Freigabe, Abbruch und Übergabe.",
          "Write context and prompt; set budget, approval, stop and handoff.",
        ),
        text(
          "Delegationsprompt und Kontrollplan",
          "Delegation prompt and control plan",
        ),
      ],
      run: [
        text(
          "Hol genau eine Antwort vom freigegebenen Provider ein.",
          "Request exactly one completion from the allowed provider.",
        ),
        text(
          "Provider-Antwort in diesem Browserlauf",
          "Provider completion in this browser session",
        ),
      ],
      verify: [
        text(
          "Bewerte die Antwort gegen Evidenz, Budgetgrenze, Freigaberegel und Reviewaufwand.",
          "Assess the completion against evidence, budget limit, approval rule and review effort.",
        ),
        text(
          "Output- und Eingriffsbewertung",
          "Output and intervention assessment",
        ),
      ],
      transfer: [
        text(
          "Plane Verantwortung, Monitoring, Incident-Weg, Abschaltung und nächste Iteration für einen echten Prozess.",
          "Plan ownership, monitoring, incident path, shutdown and next iteration for a real process.",
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
