import type { CourseSlug } from "@/lib/course/types";
import type { LocalizedProjectText } from "./types";

export interface LessonMissionChoice {
  readonly id: string;
  readonly label: LocalizedProjectText;
}

export type LessonMissionChoices = readonly [
  LessonMissionChoice,
  LessonMissionChoice,
  LessonMissionChoice,
];

export interface LessonMissionProbe {
  readonly prompt: LocalizedProjectText;
  readonly choices: LessonMissionChoices;
  readonly correctId: string;
  readonly rationale: LocalizedProjectText;
  readonly repairByChoiceId?: Readonly<Record<string, LocalizedProjectText>>;
}

export interface LessonMissionProfile {
  readonly courseSlug: CourseSlug;
  readonly instrument: LocalizedProjectText;
  readonly predictionPrompt: LocalizedProjectText;
  readonly predictionChoices: LessonMissionChoices;
  readonly revealedSignal: LocalizedProjectText;
  readonly manipulation: LocalizedProjectText;
  readonly evidence: LessonMissionProbe;
  readonly retrieval: LessonMissionProbe;
  readonly revision: LessonMissionProbe;
  readonly transferScenario: LocalizedProjectText;
  readonly transfer: LessonMissionProbe;
}

const text = (de: string, en: string): LocalizedProjectText => ({ de, en });

const choice = (id: string, de: string, en: string): LessonMissionChoice => ({
  id,
  label: text(de, en),
});

const choices = (
  first: LessonMissionChoice,
  second: LessonMissionChoice,
  third: LessonMissionChoice,
): LessonMissionChoices => [first, second, third];

const probe = (
  prompt: LocalizedProjectText,
  options: LessonMissionChoices,
  correctId: string,
  rationale: LocalizedProjectText,
  repairByChoiceId?: Readonly<Record<string, LocalizedProjectText>>,
): LessonMissionProbe => ({
  prompt,
  choices: options,
  correctId,
  rationale,
  ...(repairByChoiceId ? { repairByChoiceId } : {}),
});

/**
 * Course-specific cognitive instruments for the lesson loop. The profiles use
 * only synthetic situations and bounded choice IDs; no learner-entered text is
 * part of this data or the persisted mission state.
 */
export const LESSON_MISSION_PROFILES = {
  "ki-fuehrerschein": {
    courseSlug: "ki-fuehrerschein",
    instrument: text("Prompt-Redline-Pult", "Prompt Redline Desk"),
    predictionPrompt: text(
      "Welche Schwachstelle macht den Mail-Entwurf zuerst unzuverlässig?",
      "Which weakness makes the email draft unreliable first?",
    ),
    predictionChoices: choices(
      choice("vague-goal", "Ein unscharfes Ziel", "An ambiguous goal"),
      choice(
        "private-context",
        "Nicht freigegebener Kontext",
        "Uncleared context",
      ),
      choice(
        "unsupported-claim",
        "Eine unbelegte Aussage",
        "An unsupported claim",
      ),
    ),
    revealedSignal: text(
      "Der Entwurf behauptet eine nachgewiesene Energieersparnis. Die Quellen enthalten nur eine Herstellerschätzung ohne Messmethode.",
      "The draft claims proven energy savings. The sources hold only a manufacturer estimate with no measurement method.",
    ),
    manipulation: text(
      "Ändere Datenklasse oder Quellenregel und sieh, welche Claims die Prüfung passieren.",
      "Change a data class or grounding rule and see which claims pass review.",
    ),
    evidence: probe(
      text(
        "Was ist die Herstellerschätzung?",
        "What is the manufacturer estimate?",
      ),
      choices(
        choice(
          "direct-proof",
          "Direkter Wirkungsnachweis",
          "Direct outcome evidence",
        ),
        choice(
          "bounded-source",
          "Begrenzte Quelle mit offener Unsicherheit",
          "Bounded source with unresolved uncertainty",
        ),
        choice(
          "irrelevant",
          "Für den Claim irrelevant",
          "Irrelevant to the claim",
        ),
      ),
      "bounded-source",
      text(
        "Sie ist relevant, belegt aber weder Messung noch Kausalität. Markiere den Claim als Schätzung oder streiche ihn.",
        "It is relevant but proves neither measurement nor causality. Label the claim as an estimate or remove it.",
      ),
    ),
    retrieval: probe(
      text(
        "Welche Prompt-Regel verhindert, dass glatte Sprache fehlende Belege versteckt?",
        "Which prompt rule stops fluent wording from hiding missing evidence?",
      ),
      choices(
        choice("more-tone", "Mehr Tonalitätsbeispiele", "More tone examples"),
        choice("longer-output", "Eine längere Ausgabe", "A longer output"),
        choice(
          "claim-rule",
          "Claim-Quelle-Zuordnung plus Unsicherheitsformat",
          "Claim-to-source mapping plus an uncertainty format",
        ),
      ),
      "claim-rule",
      text(
        "Eine prüfbare Claim-Regel macht Evidenzlücken sichtbar, Stil- und Längenvorgaben leisten das nicht.",
        "A testable claim rule exposes evidence gaps; style and length rules do not.",
      ),
      {
        "more-tone": text(
          "Tonalitätsbeispiele steuern nur die Form. Auch ein markengerechter Satz kann eine erfundene Wirkungszahl enthalten, also braucht jeder Claim eine Quelle oder sichtbare Unsicherheit.",
          "Tone examples shape only form. An on-brand sentence can still contain an invented impact figure, so each claim needs a source or visible uncertainty.",
        ),
        "longer-output": text(
          "Länge erzeugt keine Evidenz, nur mehr Claims. Ein langer Entwurf kann denselben unbelegten Nutzen mehrfach wiederholen; binde jeden Claim an eine Quelle.",
          "Length creates no evidence, only more claims. A long draft can repeat the same unsupported benefit several times; bind each claim to a source.",
        ),
      },
    ),
    revision: probe(
      text(
        "Wie revidierst du den Auftrag nach dem Signal?",
        "How do you revise the task after the signal?",
      ),
      choices(
        choice(
          "delete-all",
          "Alle Produktclaims löschen",
          "Delete every product claim",
        ),
        choice(
          "qualify-review",
          "Schätzung markieren, Quelle nennen, Mensch prüft",
          "Label estimate, cite source, add human review",
        ),
        choice(
          "stronger-tone",
          "Den Claim selbstbewusster formulieren",
          "Make the claim sound more confident",
        ),
      ),
      "qualify-review",
      text(
        "So bleibt die Information nutzbar, ohne dass die Schätzung zum Beweis wird.",
        "The information stays usable without turning an estimate into proof.",
      ),
    ),
    transferScenario: text(
      "Ein freigegebener interner Entwurf fasst eine Lieferantenstudie ohne Stichprobenumfang zusammen.",
      "An approved internal draft summarizes a supplier study with no sample size.",
    ),
    transfer: probe(
      text("Welche Regel muss mitwandern?", "Which rule must transfer?"),
      choices(
        choice(
          "same-words",
          "Denselben Prompt wortgleich kopieren",
          "Copy the exact same prompt",
        ),
        choice(
          "source-boundary",
          "Evidenzgrenze, Unsicherheitslabel und Freigabe anpassen",
          "Adapt evidence boundary, uncertainty label and approval",
        ),
        choice(
          "remove-review",
          "Die Prüfung bei internen Texten entfernen",
          "Remove review for internal text",
        ),
      ),
      "source-boundary",
      text(
        "Die Kontrolllogik wandert mit; den Wortlaut passt du an den neuen Claim an.",
        "The control logic transfers; you adapt the wording to the new claim.",
      ),
    ),
  },
  "eu-ai-act-kurs": {
    courseSlug: "eu-ai-act-kurs",
    instrument: text("Pflichten-Fallarchiv", "Obligation Case File"),
    predictionPrompt: text(
      "Welche fehlende Tatsache kippt die erste Einordnung des Vorsortiersystems am ehesten?",
      "Which missing fact is most likely to change the first classification of the screening system?",
    ),
    predictionChoices: choices(
      choice("logo", "Die Farbe des Anbieterlogos", "The provider logo color"),
      choice(
        "decision-role",
        "Wer entscheidet und wofür",
        "Who decides, and for what",
      ),
      choice(
        "model-size",
        "Die Parameterzahl des Modells",
        "The model parameter count",
      ),
    ),
    revealedSignal: text(
      "Die Rangliste lehnt niemanden automatisch ab, bestimmt aber, welche Profile Menschen überhaupt sehen. Anbieter- und Betreiberrolle sind ungeklärt.",
      "The ranking rejects no one automatically but decides which profiles humans ever see. Provider and deployer roles are unresolved.",
    ),
    manipulation: text(
      "Ändere Zweck, Entscheidungseinfluss oder Rolle und verfolge den Pflichtenpfad.",
      "Change purpose, decision influence or role and trace the obligation path.",
    ),
    evidence: probe(
      text(
        "Welche Evidenz ist für die Einordnung am stärksten?",
        "Which evidence is strongest for the classification?",
      ),
      choices(
        choice(
          "vendor-label",
          "Das Marketingetikett des Anbieters",
          "The provider's marketing label",
        ),
        choice(
          "generic-policy",
          "Eine allgemeine KI-Richtlinie",
          "A generic AI policy",
        ),
        choice(
          "workflow-facts",
          "Datierter Ablauf mit Zweck, Einfluss, Rollen",
          "Dated workflow with purpose, influence, roles",
        ),
      ),
      "workflow-facts",
      text(
        "Pflichten hängen an Tatsachen, Rollen und Rechtsstand. Ein Produktname ersetzt diese Prüfung nicht.",
        "Obligations attach to facts, roles and the applicable legal date. A product label does not replace that check.",
      ),
    ),
    retrieval: probe(
      text(
        "Welche Reihenfolge verhindert eine vorschnelle Risikokategorie?",
        "Which sequence prevents a premature risk label?",
      ),
      choices(
        choice(
          "label-first",
          "Kategorie wählen, dann passende Tatsachen suchen",
          "Pick a category, then find facts",
        ),
        choice(
          "boundary-roles-path",
          "Systemgrenze, Rollen, Risikopfad, datierte Quelle",
          "System boundary, roles, risk path, dated source",
        ),
        choice(
          "model-first",
          "Zuerst das Modell bewerten",
          "Evaluate the model first",
        ),
      ),
      "boundary-roles-path",
      text(
        "Erst System und Rollen klären, dann die Pflichten.",
        "Clarify system and roles before the obligations.",
      ),
      {
        "label-first": text(
          "Wer zuerst die Kategorie wählt, sucht danach bestätigende Tatsachen und übersieht leicht Systemgrenzen oder Rollen. Eine menschliche Freigabe macht einen entscheidungsbeeinflussenden Einsatz nicht automatisch risikoarm.",
          "Picking the category first invites confirming facts and can hide system boundaries or roles. Human approval does not automatically make a decision-influencing use low risk.",
        ),
        "model-first": text(
          "Das Modell allein bestimmt keine Pflicht. Derselbe Modelltyp hat in Rechtschreibprüfung und Bewerberauswahl andere Rollen und Risikopfade; prüfe zuerst den Einsatz.",
          "The model alone sets no obligation. The same model type has different roles and risk paths in spell-checking and applicant selection; check the use first.",
        ),
      },
    ),
    revision: probe(
      text(
        "Wie wird die Fallakte nach dem Signal revidiert?",
        "How do you revise the case file after the signal?",
      ),
      choices(
        choice(
          "declare-safe",
          "Als sicher einstufen, weil ein Mensch beteiligt ist",
          "Declare it safe because a human is involved",
        ),
        choice(
          "declare-high",
          "Ohne weitere Fakten endgültig als hochriskant markieren",
          "Mark it definitively high-risk without more facts",
        ),
        choice(
          "map-influence",
          "Einfluss und Rollen belegen, beide Pfade testen",
          "Evidence influence and roles, test both paths",
        ),
      ),
      "map-influence",
      text(
        "Ein beteiligter Mensch befreit nicht pauschal. Einfluss und Rollen müssen belegt sein.",
        "A human in the loop is no blanket exemption. Influence and roles must be evidenced.",
      ),
    ),
    transferScenario: text(
      "Dasselbe Modell empfiehlt später Schulungen, ohne Personen zu ranken.",
      "The same model later recommends training without ranking people.",
    ),
    transfer: probe(
      text(
        "Was darf nicht ungeprüft übertragen werden?",
        "What must not be transferred without re-analysis?",
      ),
      choices(
        choice(
          "old-classification",
          "Die alte Risikoeinstufung, weil das Modell gleich ist",
          "The old risk class, because the model is the same",
        ),
        choice(
          "dated-sources",
          "Die Pflicht, Quellen zu datieren",
          "The requirement to date sources",
        ),
        choice(
          "role-map",
          "Die Pflicht, Rollen zu klären",
          "The requirement to clarify roles",
        ),
      ),
      "old-classification",
      text(
        "Zweck und Einsatzkontext werden neu bewertet. Der Modellname allein bestimmt keine Kategorie.",
        "Purpose and deployment context are reassessed. The model name alone sets no category.",
      ),
    ),
  },
  "ai-native": {
    courseSlug: "ai-native",
    instrument: text("Workflow-Konsole", "Workflow Console"),
    predictionPrompt: text(
      "Wo entgleist der Wochenbericht ohne weitere Kontrolle zuerst?",
      "Where does the weekly-report workflow fail first without another control?",
    ),
    predictionChoices: choices(
      choice("context", "Im Kontextbudget", "At the context budget"),
      choice(
        "write-boundary",
        "An der Schreib- und Freigabegrenze",
        "At the write and approval boundary",
      ),
      choice("format", "Beim Ausgabeformat", "At the output format"),
    ),
    revealedSignal: text(
      "Zwei Projektmeldungen widersprechen sich. Der Agent kann den Bericht veröffentlichen, ohne den Konflikt zu eskalieren oder die Quellenlücke zu markieren.",
      "Two project updates conflict. The agent can publish the report without escalating the conflict or marking an evidence gap.",
    ),
    manipulation: text(
      "Verschiebe Freigabegate oder Abbruchregel und sieh dir den Laufpfad an.",
      "Move an approval gate or stop rule and watch the run path.",
    ),
    evidence: probe(
      text(
        "Welches Signal belegt eine wirksame Kontrolle?",
        "Which signal demonstrates an effective control?",
      ),
      choices(
        choice(
          "fluent-output",
          "Ein flüssig formulierter Bericht",
          "A fluently written report",
        ),
        choice("fast-run", "Eine kürzere Laufzeit", "A shorter runtime"),
        choice(
          "blocked-conflict",
          "Ein protokollierter Stopp am Quellenkonflikt",
          "A logged stop at the source conflict",
        ),
      ),
      "blocked-conflict",
      text(
        "Ob die Kontrolle wirkt, zeigt der beobachtete Stopp. Stil und Tempo sagen darüber nichts.",
        "The observed stop shows the control works. Style and speed say nothing about it.",
      ),
    ),
    retrieval: probe(
      text(
        "Was muss in einen kontrollierten KI-Arbeitsauftrag?",
        "What must a controlled AI work order contain?",
      ),
      choices(
        choice(
          "goal-only",
          "Nur ein möglichst genaues Ziel",
          "Only a precise goal",
        ),
        choice(
          "boundary-gates",
          "Ziel, Nicht-Ziele, Werkzeuggrenzen, Freigaben, Abbruch",
          "Goal, non-goals, tool limits, approvals, stop rules",
        ),
        choice(
          "persona",
          "Eine ausführliche Rollenpersona",
          "A detailed role persona",
        ),
      ),
      "boundary-gates",
      text(
        "Ein gutes Ziel ersetzt keine Berechtigungs-, Freigabe- oder Abbruchgrenze.",
        "A good goal does not replace permission, approval, or stop boundaries.",
      ),
      {
        "goal-only": text(
          "Ein präzises Ziel begrenzt weder Mittel noch Freigaben. „Veröffentliche die Zusammenfassung“ ist eindeutig, erlaubt ohne Stoppgrenze aber das Veröffentlichen trotz Quellenkonflikt.",
          "A precise goal bounds neither means nor approvals. “Publish the summary” is clear, yet without a stop limit it allows publishing through a source conflict.",
        ),
        persona: text(
          "Eine Persona beschreibt Verhalten, gibt aber keine Berechtigung und erzwingt keinen Stopp. Auch ein „Compliance-Prüfer“ kann ohne Gate einen widersprüchlichen Entwurf veröffentlichen.",
          "A persona describes behavior but grants no authority and enforces no stop. Even a “compliance reviewer” agent can publish a conflicting draft when no gate blocks it.",
        ),
      },
    ),
    revision: probe(
      text(
        "Welche Revision reagiert direkt auf das Signal?",
        "Which revision directly addresses the signal?",
      ),
      choices(
        choice(
          "conflict-gate",
          "Konflikt vor Veröffentlichung einem Menschen vorlegen",
          "Route conflicts to a human before publishing",
        ),
        choice(
          "more-context",
          "Alle Eingaben ungefiltert in den Kontext laden",
          "Load every input into context without filtering",
        ),
        choice(
          "auto-retry",
          "Den Lauf bei Konflikten automatisch wiederholen",
          "Automatically retry the run on conflicts",
        ),
      ),
      "conflict-gate",
      text(
        "Der Konflikt braucht eine sichtbare Entscheidungsgrenze. Mehr Kontext oder ein blinder Retry lösen ihn nicht.",
        "The conflict needs a visible decision point. More context or a blind retry does not resolve it.",
      ),
    ),
    transferScenario: text(
      "Derselbe Ablauf meldet nun einen Lieferstatus, der externe Benachrichtigungen auslösen kann.",
      "The same workflow now reports a delivery status that can trigger external notifications.",
    ),
    transfer: probe(
      text(
        "Welche zusätzliche Grenze ist erforderlich?",
        "Which additional boundary is required?",
      ),
      choices(
        choice(
          "same-gates",
          "Keine; derselbe Ablauf reicht",
          "None; the same workflow suffices",
        ),
        choice(
          "longer-prompt",
          "Nur ein längerer Systemprompt",
          "Only a longer system prompt",
        ),
        choice(
          "external-action",
          "Eigenes Freigabegate und Rückfallweg für die Außenaktion",
          "Own approval gate and fallback for the external action",
        ),
      ),
      "external-action",
      text(
        "Eine neue Außenwirkung braucht eine eigene Freigabe und einen Rückfallweg.",
        "A new external effect needs its own authorization and fallback.",
      ),
    ),
  },
  "ki-und-gesellschaft": {
    courseSlug: "ki-und-gesellschaft",
    instrument: text("Provenienz-Redaktion", "Provenance Newsroom"),
    predictionPrompt: text(
      "Welches Indiz im Video hält man am leichtesten für einen Echtheitsbeweis?",
      "Which signal in the video is easiest to mistake for proof of authenticity?",
    ),
    predictionChoices: choices(
      choice(
        "visual-artifact",
        "Ein sichtbares Kompressionsartefakt",
        "A visible compression artifact",
      ),
      choice(
        "account-volume",
        "Viele wiederholende Accounts",
        "Many repeating accounts",
      ),
      choice(
        "metadata",
        "Ein plausibler Metadaten-Zeitstempel",
        "A plausible metadata timestamp",
      ),
    ),
    revealedSignal: text(
      "Der Zeitstempel passt zur Behauptung, stammt aber aus einer neu exportierten Kopie. Zwei Accounts teilen denselben Ausschnitt und zitieren sich gegenseitig.",
      "The timestamp matches the claim but comes from a newly exported copy. Two accounts share the same clip and cite each other.",
    ),
    manipulation: text(
      "Ändere Quellenunabhängigkeit oder Signalgewicht und verfolge die Publikationsentscheidung.",
      "Change source independence or signal weight and trace the publication decision.",
    ),
    evidence: probe(
      text(
        "Was ist der Zeitstempel?",
        "What is the timestamp?",
      ),
      choices(
        choice("proof", "Echtheitsbeweis", "Proof of authenticity"),
        choice(
          "signal",
          "Schwaches Signal, Ursprung offen",
          "Weak signal, origin unresolved",
        ),
        choice("fabrication", "Beweis für Fälschung", "Proof of fabrication"),
      ),
      "signal",
      text(
        "Metadaten einer Kopie lassen sich prüfen, beweisen aber weder Aufnahmezeit noch Echtheit.",
        "Metadata from a copy can be checked but proves neither capture time nor authenticity.",
      ),
    ),
    retrieval: probe(
      text(
        "Welche Trennung schützt vor überzogenen Schlüssen?",
        "Which separation prevents overclaiming?",
      ),
      choices(
        choice(
          "observe-infer",
          "Beobachtung, Deutung, offene Unsicherheit",
          "Observation, interpretation, open uncertainty",
        ),
        choice("true-false", "Nur wahr oder falsch", "Only true or false"),
        choice(
          "popular-unpopular",
          "Populär oder unpopulär",
          "Popular or unpopular",
        ),
      ),
      "observe-infer",
      text(
        "Befund, Deutung und Restunsicherheit bleiben sichtbar getrennt.",
        "Observation, interpretation and residual uncertainty stay visibly apart.",
      ),
      {
        "true-false": text(
          "Wahr oder falsch erzwingt Gewissheit, wo das Signal mehrere Ursachen zulässt. Der Zeitstempel einer Kopie beweist weder Aufnahmezeit noch Fälschung.",
          "A binary verdict forces certainty where the signal allows several causes. A copy's timestamp proves neither capture time nor fabrication.",
        ),
        "popular-unpopular": text(
          "Popularität misst Verbreitung. Eine aus dem Kontext gerissene Kopie kann viral gehen, obwohl ihre Herkunft ungeklärt ist.",
          "Popularity measures spread. A copy stripped of context can go viral while its origin stays unresolved.",
        ),
      },
    ),
    revision: probe(
      text(
        "Welche Redaktionsentscheidung folgt aus dem Signal?",
        "Which editorial decision follows from the signal?",
      ),
      choices(
        choice(
          "publish-true",
          "Als bestätigt veröffentlichen",
          "Publish as confirmed",
        ),
        choice(
          "publish-fake",
          "Als Fälschung bezeichnen",
          "Label it fabricated",
        ),
        choice(
          "hold-verify",
          "Zurückhalten, Ursprung suchen, Unsicherheit notieren",
          "Hold, trace the origin, log uncertainty",
        ),
      ),
      "hold-verify",
      text(
        "Weder Echtheit noch Fälschung ist belegt, also wird weiter geprüft.",
        "Neither authenticity nor fabrication is established, so verification continues.",
      ),
    ),
    transferScenario: text(
      "Ein Audiozitat liegt als Originaldatei vor; wer spricht, behauptet nur ein anonymer Post.",
      "An audio quote exists as an original file; only an anonymous post names the speaker.",
    ),
    transfer: probe(
      text("Was wird neu bewertet?", "What must be reassessed?"),
      choices(
        choice(
          "visual-only",
          "Nur visuelle Artefakte",
          "Only visual artifacts",
        ),
        choice(
          "provenance-chain",
          "Provenienzkette und unabhängige Sprecherzuordnung",
          "Provenance chain and independent speaker check",
        ),
        choice("file-size", "Nur die Dateigröße", "Only the file size"),
      ),
      "provenance-chain",
      text(
        "Das Medium wechselt, die unabhängige Prüfung von Herkunft und Claim bleibt.",
        "The medium changes; independent checks of origin and claim remain.",
      ),
    ),
  },
  "data-engineering-fundamentals": {
    courseSlug: "data-engineering-fundamentals",
    instrument: text("Pipeline-Störstand", "Pipeline Failure Bench"),
    predictionPrompt: text(
      "Welche Invariante bricht beim ersten Replay am ehesten?",
      "Which invariant is most likely to break on the first replay?",
    ),
    predictionChoices: choices(
      choice("schema", "Schema-Vertrag", "Schema contract"),
      choice("idempotency", "Idempotenz", "Idempotency"),
      choice("freshness", "Aktualitäts-SLO", "Freshness SLO"),
    ),
    revealedSignal: text(
      "Nach einem Timeout wird Batch 42 erneut zugestellt. Drei Ereignisse haben dieselbe Ereignis-ID, aber einen späteren Ingest-Zeitpunkt.",
      "After a timeout, batch 42 is delivered again. Three events have the same event ID but a later ingestion timestamp.",
    ),
    manipulation: text(
      "Aktiviere Replay, ändere Deduplikations- oder Late-Data-Regeln und vergleiche Zeilenzahl und Reconciliation.",
      "Trigger replay, change deduplication or late-data rules and compare row counts and reconciliation.",
    ),
    evidence: probe(
      text(
        "Was belegt ein korrektes Replay?",
        "What shows a correct replay?",
      ),
      choices(
        choice(
          "green-job",
          "Der Jobstatus ist grün",
          "The job status is green",
        ),
        choice(
          "same-count",
          "Die Ausgabetabelle ist größer",
          "The output table is larger",
        ),
        choice(
          "reconciled-keys",
          "Eindeutige Schlüssel, ausgeglichene Reconciliation",
          "Unique keys, balanced reconciliation",
        ),
      ),
      "reconciled-keys",
      text(
        "Ein grüner Status beweist keine korrekten Daten. Das leisten Schlüssel- und Mengenabgleich.",
        "A green status does not prove correct data. Key and count reconciliation do.",
      ),
    ),
    retrieval: probe(
      text(
        "Welche Zeiten trennst du bei verspäteten Ereignissen?",
        "Which times do you separate for late events?",
      ),
      choices(
        choice("clock-only", "Nur aktuelle Uhrzeit", "Current clock time only"),
        choice(
          "event-ingest",
          "Ereigniszeit und Verarbeitungszeit",
          "Event time and processing time",
        ),
        choice("deploy-time", "Nur Deployment-Zeit", "Deployment time only"),
      ),
      "event-ingest",
      text(
        "Late-Data-Logik trennt, wann ein Ereignis geschah und wann es verarbeitet wurde.",
        "Late-data logic separates when an event occurred from when it was processed.",
      ),
      {
        "clock-only": text(
          "Die Uhrzeit zeigt nur, wann verarbeitet wird. Ein heute eingespieltes Ereignis von gestern sähe ohne Ereigniszeit pünktlich aus.",
          "The clock shows only when processing happens. Yesterday's event replayed today would look on time without event time.",
        ),
        "deploy-time": text(
          "Deployment-Zeit datiert Code. Ein Ereignis kann vor dem Release entstehen und danach eintreffen; nur Ereignis- und Verarbeitungszeit zeigen diese Verspätung.",
          "Deployment time dates code. An event can occur before a release and arrive after it; only event and processing time expose that delay.",
        ),
      },
    ),
    revision: probe(
      text(
        "Welche Änderung behebt den Fehlerpfad?",
        "Which change fixes the failure path?",
      ),
      choices(
        choice(
          "more-retries",
          "Mehr unbedingte Retries",
          "More unconditional retries",
        ),
        choice("bigger-batch", "Größere Batches", "Larger batches"),
        choice(
          "stable-key-upsert",
          "Stabiler Schlüssel, idempotenter Upsert, Abgleich",
          "Stable key, idempotent upsert, reconciliation",
        ),
      ),
      "stable-key-upsert",
      text(
        "Replay-Sicherheit entsteht durch feste Identität und Prüfung. Die Zahl der Retries ändert daran nichts.",
        "Replay safety comes from fixed identity and checks. The number of retries does not change that.",
      ),
    ),
    transferScenario: text(
      "Die Pipeline verarbeitet nun Korrekturereignisse, die bestehende Werte rückwirkend ändern.",
      "The pipeline now handles correction events that change existing values retroactively.",
    ),
    transfer: probe(
      text(
        "Welche Annahme muss angepasst werden?",
        "Which assumption must be adapted?",
      ),
      choices(
        choice(
          "append-only",
          "Dass alle Ereignisse nur angehängt werden",
          "That all events are append-only",
        ),
        choice(
          "stable-id",
          "Dass Ereignisse eine stabile Identität brauchen",
          "That events need stable identity",
        ),
        choice(
          "reconcile",
          "Dass Reconciliation nötig ist",
          "That reconciliation is required",
        ),
      ),
      "append-only",
      text(
        "Korrekturen brechen die Append-only-Annahme; Identität und Reconciliation gelten weiter.",
        "Corrections break the append-only assumption; identity and reconciliation still apply.",
      ),
    ),
  },
  "data-science": {
    courseSlug: "data-science",
    instrument: text("Experiment-Prüffeld", "Experiment Test Rig"),
    predictionPrompt: text(
      "Welcher Fehler lässt den Modelleffekt am ehesten besser aussehen, als er ist?",
      "Which defect most likely makes the model effect look better than it is?",
    ),
    predictionChoices: choices(
      choice("small-sample", "Kleine Stichprobe", "Small sample"),
      choice("leakage", "Ziel-Leakage", "Target leakage"),
      choice("rounding", "Gerundete Anzeige", "Rounded display"),
    ),
    revealedSignal: text(
      "Die Variable `resolved_at` wird vor dem Split berechnet. Sie steckt in Training und Auswertung, ist bei einer echten Vorhersage aber noch unbekannt.",
      "The `resolved_at` feature is computed before the split. It is in training and evaluation but unknown at real prediction time.",
    ),
    manipulation: text(
      "Schalte Leakage und Zwischenanalysen um und vergleiche Effekt, Unsicherheit und Holdout-Verhalten.",
      "Toggle leakage and interim looks and compare effect, uncertainty and holdout behavior.",
    ),
    evidence: probe(
      text(
        "Was zeigt Leakage am direktesten?",
        "What shows leakage most directly?",
      ),
      choices(
        choice("high-score", "Ein hoher Gesamtscore", "A high aggregate score"),
        choice(
          "time-audit",
          "Ein Verfügbarkeitsaudit zum Vorhersagezeitpunkt",
          "An availability audit at prediction time",
        ),
        choice(
          "pretty-chart",
          "Eine glatte Lernkurve",
          "A smooth learning curve",
        ),
      ),
      "time-audit",
      text(
        "Entscheidend ist, ob die Information zum Einsatzzeitpunkt existiert. Wie gut die Metrik aussieht, zählt nicht.",
        "What matters is whether the information exists at serving time. How good the metric looks does not.",
      ),
    ),
    retrieval: probe(
      text(
        "Welcher Datensatz darf die Modellauswahl nicht wiederholt steuern?",
        "Which dataset must not repeatedly steer model selection?",
      ),
      choices(
        choice("training", "Trainingsdaten", "Training data"),
        choice("validation", "Validierungsdaten", "Validation data"),
        choice("final-holdout", "Der finale Holdout", "The final holdout"),
      ),
      "final-holdout",
      text(
        "Der finale Holdout bleibt bis zur geplanten Endbewertung unberührt. Wer mehrfach daran nachsteuert, macht ihn zu Validierungsdaten.",
        "The final holdout stays untouched until the planned final evaluation. Repeated tuning on it turns it into validation data.",
      ),
      {
        training: text(
          "Trainingsdaten müssen das Fitten steuern, sonst lernt das Modell keine Parameter. Das verbraucht den versiegelten Holdout nicht.",
          "Training data must steer fitting or the model learns no parameters. That does not consume the sealed holdout.",
        ),
        validation: text(
          "Validierungsdaten sind für Modell- und Hyperparameterentscheidungen da, ohne sie zu übernutzen. Die Lernrate wählst du dort; den finalen Holdout öffnest du danach einmal.",
          "Validation data is for model and hyperparameter decisions, without overuse. You pick the learning rate there and open the final holdout once afterward.",
        ),
      },
    ),
    revision: probe(
      text("Wie revidierst du die Analyse?", "How do you revise the analysis?"),
      choices(
        choice(
          "drop-audit-resplit",
          "Leck-Feature entfernen, zeitlich neu splitten, Unsicherheit neu rechnen",
          "Drop the leaking feature, re-split by time, recompute uncertainty",
        ),
        choice(
          "hide-feature",
          "Den Variablennamen im Bericht ausblenden",
          "Hide the feature name in the report",
        ),
        choice(
          "more-models",
          "Mehr Modelle auf demselben Split testen",
          "Test more models on the same split",
        ),
      ),
      "drop-audit-resplit",
      text(
        "Datenentstehung und Auswertung müssen repariert werden. Ein geänderter Bericht reicht nicht.",
        "Data generation and evaluation must be repaired. Changing the report is not enough.",
      ),
    ),
    transferScenario: text(
      "Ein neues Prognoseprojekt nutzt ein Merkmal, das erst zwei Stunden nach dem Zielereignis aktualisiert wird.",
      "A new forecasting project uses a feature updated two hours after the target event.",
    ),
    transfer: probe(
      text("Welche Prüfung wird übertragen?", "Which check transfers?"),
      choices(
        choice(
          "feature-timeline",
          "Feature-Zeitlinie zum Vorhersagezeitpunkt",
          "Feature timeline against prediction time",
        ),
        choice(
          "same-threshold",
          "Derselbe Entscheidungsgrenzwert",
          "The same decision threshold",
        ),
        choice("same-model", "Dasselbe Modell", "The same model"),
      ),
      "feature-timeline",
      text(
        "Das Verfügbarkeitsaudit wandert mit; Modell und Grenzwert hängen vom neuen Problem ab.",
        "The availability audit transfers; the model and threshold depend on the new problem.",
      ),
    ),
  },
  "data-infrastructure": {
    courseSlug: "data-infrastructure",
    instrument: text("Streaming-Kontrollraum", "Streaming Control Room"),
    predictionPrompt: text(
      "Welches SLO-Signal leidet beim Netzschnitt zuerst?",
      "Which SLO signal degrades first during the network partition?",
    ),
    predictionChoices: choices(
      choice("latency", "Ende-zu-Ende-Latenz", "End-to-end latency"),
      choice("duplicates", "Duplikatrate", "Duplicate rate"),
      choice("cost", "Speicherkosten", "Storage cost"),
    ),
    revealedSignal: text(
      "Der Consumer-Rückstand wächst. Nach der Rebalance sinkt die Latenz, gleichzeitig werden einige Sequenzen doppelt verarbeitet.",
      "Consumer lag rises. After rebalancing, latency recovers while some sequences are processed twice.",
    ),
    manipulation: text(
      "Erzeuge Partition oder Rückstau und ändere Replikation, Wasserzeichen oder Replay-Strategie.",
      "Inject a partition or backlog and change replication, watermark or replay strategy.",
    ),
    evidence: probe(
      text(
        "Was unterscheidet Erholung von bloßem Aufholen?",
        "What separates recovery from merely catching up?",
      ),
      choices(
        choice(
          "lag-zero",
          "Consumer-Lag erreicht null",
          "Consumer lag reaches zero",
        ),
        choice(
          "invariant-slo",
          "Lag, Duplikate, Verlust, Reihenfolge gegen Grenzwerte",
          "Lag, duplicates, loss, ordering against limits",
        ),
        choice("cpu-low", "CPU-Auslastung sinkt", "CPU utilization falls"),
      ),
      "invariant-slo",
      text(
        "Ein leerer Rückstand kann mit Duplikaten oder Verlust erkauft sein. Erholung prüft Korrektheit und SLO zusammen.",
        "An empty backlog can be bought with duplicates or loss. Recovery checks correctness and SLOs together.",
      ),
    ),
    retrieval: probe(
      text(
        "Was steuert, wann verspätete Ereignisse als vollständig gelten?",
        "What controls when late events count as complete?",
      ),
      choices(
        choice("watermark", "Wasserzeichen", "Watermark"),
        choice("partition-count", "Partitionsanzahl", "Partition count"),
        choice("replica-count", "Replikazahl", "Replica count"),
      ),
      "watermark",
      text(
        "Wasserzeichen bilden den Fortschritt der Ereigniszeit und die tolerierte Verspätung ab.",
        "Watermarks model event-time progress and tolerated lateness.",
      ),
      {
        "partition-count": text(
          "Die Partitionszahl steuert Parallelität und Datenverteilung. Auch bei zehn Partitionen kann in einer davon noch ein älteres Ereignis eintreffen.",
          "Partition count controls parallelism and data distribution. Even with ten partitions, an older event can still arrive in one of them.",
        ),
        "replica-count": text(
          "Replikas erhöhen die Verfügbarkeit, kopieren aber denselben Stand. Drei Replikas können dasselbe unvollständige Ereignisfenster enthalten.",
          "Replicas raise availability but copy the same state. Three replicas can hold the same incomplete event window.",
        ),
      },
    ),
    revision: probe(
      text(
        "Welche Reaktion behebt beide Signale?",
        "Which response fixes both signals?",
      ),
      choices(
        choice(
          "scale-only",
          "Nur mehr Consumer starten",
          "Only add more consumers",
        ),
        choice(
          "drop-late",
          "Alle verspäteten Ereignisse verwerfen",
          "Drop all late events",
        ),
        choice(
          "controlled-replay",
          "Kontrolliert skalieren, idempotent replayen, abgleichen",
          "Scale deliberately, replay idempotently, reconcile",
        ),
      ),
      "controlled-replay",
      text(
        "Durchsatz und Korrektheit werden zusammen wiederhergestellt. Skalieren allein beseitigt keine Duplikate.",
        "Throughput and correctness recover together. Scaling alone removes no duplicates.",
      ),
    ),
    transferScenario: text(
      "Der Stream trägt nun Alarme; ein spätes Ereignis kann eine menschliche Eskalation auslösen.",
      "The stream now carries alerts; a late event can trigger human escalation.",
    ),
    transfer: probe(
      text(
        "Welche Grenze muss neu festgelegt werden?",
        "Which boundary must be redefined?",
      ),
      choices(
        choice(
          "lateness-action",
          "Tolerierte Verspätung und Verhalten danach",
          "Tolerated lateness and what happens after",
        ),
        choice(
          "same-watermark",
          "Unverändert dasselbe Wasserzeichen",
          "The exact same watermark",
        ),
        choice(
          "ignore-late",
          "Verspätete Alarme ignorieren",
          "Ignore late alerts",
        ),
      ),
      "lateness-action",
      text(
        "Die Außenwirkung macht Verspätung teurer. Zeitgrenze und Ausgleichsweg werden neu bestimmt.",
        "The external effect makes lateness costlier. Time limit and compensation path are set anew.",
      ),
    ),
  },
  codex: {
    courseSlug: "codex",
    instrument: text("Repository-Werkbank", "Repository Workbench"),
    predictionPrompt: text(
      "Welcher Beleg grenzt die Ursache des Retry-Fehlers am schnellsten ein?",
      "Which evidence narrows the cause of the retry defect fastest?",
    ),
    predictionChoices: choices(
      choice(
        "readme",
        "Die README vollständig umschreiben",
        "Rewrite the README",
      ),
      choice(
        "failing-test",
        "Kleinster reproduzierender Test mit Exit-Code",
        "Smallest reproducing test with an exit code",
      ),
      choice(
        "dependency-update",
        "Alle Abhängigkeiten aktualisieren",
        "Update every dependency",
      ),
    ),
    revealedSignal: text(
      "Der Test erwartet drei Versuche und sieht vier. Laut Diff steigt der Zähler vor statt nach der Abbruchprüfung.",
      "The test expects three attempts and sees four. The diff shows the counter rising before the stop check instead of after.",
    ),
    manipulation: text(
      "Sieh dir die Dateien an, wende den begrenzten Patch an und führe die erlaubten Checks aus.",
      "Inspect the files, apply the bounded patch and run the allowed checks.",
    ),
    evidence: probe(
      text(
        "Was belegt die Reparatur am stärksten?",
        "What proves the repair best?",
      ),
      choices(
        choice(
          "looks-clean",
          "Der Code sieht sauberer aus",
          "The code looks cleaner",
        ),
        choice(
          "focused-plus-suite",
          "Reproduktion, grüner Fokuscheck, grüne Prüfkette",
          "Reproducer, green focused check, green full chain",
        ),
        choice("large-diff", "Ein umfangreicher Diff", "A large diff"),
      ),
      "focused-plus-suite",
      text(
        "Reproduktion, Fokuscheck und volle Regression verbinden Ursache, Fix und Prüfung auf Nebenwirkungen.",
        "Reproducer, focused check and full regression connect cause, fix and side-effect coverage.",
      ),
    ),
    retrieval: probe(
      text(
        "Was begrenzt einen Agenten-Codeauftrag vor der ersten Änderung?",
        "What bounds an agentic coding task before edits begin?",
      ),
      choices(
        choice(
          "task-contract",
          "Scope, Nicht-Ziele, Akzeptanzkriterien, erlaubte Checks",
          "Scope, non-goals, acceptance criteria, allowed checks",
        ),
        choice("branch-name", "Nur der Branchname", "Only the branch name"),
        choice(
          "more-tools",
          "Möglichst viele Werkzeuge",
          "As many tools as possible",
        ),
      ),
      "task-contract",
      text(
        "Der Task-Vertrag verhindert Nebenänderungen und macht die Abnahme prüfbar.",
        "The task contract prevents unrelated changes and makes acceptance testable.",
      ),
      {
        "branch-name": text(
          "Ein Branchname nennt die Absicht, aber weder erlaubte Dateien noch Abnahmekriterien. „fix-retry“ hindert keinen Agenten daran, auch Datenbankcode zu ändern.",
          "A branch name states intent but defines neither allowed files nor acceptance criteria. “fix-retry” does not stop an agent from also changing database code.",
        ),
        "more-tools": text(
          "Mehr Werkzeuge erweitern Fähigkeit und Schadensradius, setzen aber keine Grenze. Ohne Task-Vertrag weiß ein Agent mit Datenbankzugriff nicht, ob er das Schema ändern darf.",
          "More tools expand capability and blast radius but set no boundary. Without a task contract, an agent with database access cannot know if schema changes are allowed.",
        ),
      },
    ),
    revision: probe(
      text(
        "Welche Änderung ist nach dem Signal angemessen?",
        "Which change is appropriate after the signal?",
      ),
      choices(
        choice(
          "bounded-order-fix",
          "Prüfreihenfolge korrigieren, Grenzfall testen",
          "Fix the check order, test the edge case",
        ),
        choice(
          "rewrite-module",
          "Das gesamte Modul neu schreiben",
          "Rewrite the entire module",
        ),
        choice(
          "raise-limit",
          "Das Retry-Limit auf vier erhöhen",
          "Raise the retry limit to four",
        ),
      ),
      "bounded-order-fix",
      text(
        "Der kleinste Fix behebt die belegte Off-by-one-Ursache und sichert den Grenzfall ab.",
        "The smallest fix removes the evidenced off-by-one cause and guards the edge case.",
      ),
    ),
    transferScenario: text(
      "Ein anderer Worker zählt Timeouts statt Versuche und hat eine Backoff-Grenze.",
      "Another worker counts timeouts instead of attempts and has a backoff limit.",
    ),
    transfer: probe(
      text("Was wird übertragen?", "What transfers?"),
      choices(
        choice(
          "copy-patch",
          "Den Patch wortgleich kopieren",
          "Copy the patch verbatim",
        ),
        choice(
          "same-limit",
          "Immer das Limit drei verwenden",
          "Always use a limit of three",
        ),
        choice(
          "contract-reproducer",
          "Anleitung lesen, Grenze reproduzieren, minimal ändern",
          "Read instructions, reproduce the limit, change minimally",
        ),
      ),
      "contract-reproducer",
      text(
        "Die Methode wandert mit; Zählerlogik und Patch werden neu geprüft.",
        "The method transfers; counter logic and patch are checked anew.",
      ),
    ),
  },
  claude: {
    courseSlug: "claude",
    instrument: text("Grounding-Komparator", "Grounding Comparator"),
    predictionPrompt: text(
      "Welche Promptvariante erzeugt im Museumsfall weniger unbelegte Claims?",
      "Which prompt variant produces fewer unsupported claims in the museum case?",
    ),
    predictionChoices: choices(
      choice(
        "confident",
        "Eine selbstbewusste Expertenpersona",
        "A confident expert persona",
      ),
      choice("long", "Eine maximal lange Antwort", "A maximally long answer"),
      choice(
        "grounded",
        "Quelle je Claim, sonst verweigern",
        "Source per claim, else refuse",
      ),
    ),
    revealedSignal: text(
      "Quelle B widerspricht Quelle C beim Ausstellungsjahr. Eine attraktive Besucherzahl steht in keiner Quelle, aber in der Basisantwort.",
      "Source B conflicts with Source C on the exhibition year. An attractive visitor count is in no source but in the baseline answer.",
    ),
    manipulation: text(
      "Ändere Grounding- und Verweigerungsregeln und führe beide Varianten mit demselben Quellenpaket aus.",
      "Change grounding and refusal rules and run both variants on the same source packet.",
    ),
    evidence: probe(
      text(
        "Was ist die Besucherzahl?",
        "What is the visitor count?",
      ),
      choices(
        choice("supported", "Direkt belegt", "Directly supported"),
        choice("unsupported", "Unbelegter Claim", "Unsupported claim"),
        choice("conflict", "Quellenkonflikt", "Source conflict"),
      ),
      "unsupported",
      text(
        "Ein Konflikt braucht mindestens zwei widersprechende Belege. Hier fehlt jede Quelle.",
        "A conflict needs at least two contradicting sources. Here there is none.",
      ),
    ),
    retrieval: probe(
      text(
        "Welche Eval-Dimension prüft sichtbare Unsicherheit bei Quellenkonflikten?",
        "Which eval dimension checks visible uncertainty under source conflict?",
      ),
      choices(
        choice("format", "Format", "Format"),
        choice("calibration", "Kalibrierung", "Calibration"),
        choice("length", "Länge", "Length"),
      ),
      "calibration",
      text(
        "Kalibrierung prüft, ob die geäußerte Sicherheit zur Evidenz passt.",
        "Calibration checks whether stated confidence matches the evidence.",
      ),
      {
        format: text(
          "Format prüft nur die Struktur. Eine sauber formatierte Tabelle kann eine umstrittene Zahl trotzdem als sicher ausgeben.",
          "Format tests only structure. A neatly formatted table can still present a disputed figure as certain.",
        ),
        length: text(
          "Länge misst nur den Umfang. Schon „42 ist bestätigt“ ist trotz Quellenkonflikt zu sicher; mehr Wörter schließen die Lücke nicht.",
          "Length measures only volume. Even “42 is confirmed” is overconfident despite a source conflict; more words would not close the gap.",
        ),
      },
    ),
    revision: probe(
      text(
        "Wie wird der Grounding-Prompt revidiert?",
        "How do you revise the grounding prompt?",
      ),
      choices(
        choice(
          "force-answer",
          "Bei Lücken die wahrscheinlichste Zahl ergänzen",
          "Fill gaps with the most likely number",
        ),
        choice(
          "cite-refuse-conflict",
          "Claims belegen, Lücken verweigern, Konflikte ausweisen",
          "Ground claims, refuse gaps, flag conflicts",
        ),
        choice(
          "remove-sources",
          "Quellenhinweise aus der Ausgabe entfernen",
          "Remove source references from the output",
        ),
      ),
      "cite-refuse-conflict",
      text(
        "So bleiben unbelegte und widersprüchliche Angaben unterscheidbar und beide sichtbar.",
        "This keeps unsupported and conflicting information apart and shows both.",
      ),
    ),
    transferScenario: text(
      "Ein Policy-Paket enthält eine veraltete Richtlinie und eine neuere Änderung mit engerem Geltungsbereich.",
      "A policy packet holds an old policy and a newer amendment with narrower scope.",
    ),
    transfer: probe(
      text(
        "Welche neue Grounding-Dimension wird benötigt?",
        "Which new grounding dimension is required?",
      ),
      choices(
        choice(
          "date-scope",
          "Datum und Geltungsbereich pro Claim",
          "Date and scope for each claim",
        ),
        choice(
          "more-confident",
          "Selbstbewusstere Sprache",
          "More confident wording",
        ),
        choice(
          "one-source",
          "Nur die längste Quelle verwenden",
          "Use only the longest source",
        ),
      ),
      "date-scope",
      text(
        "Bei Regelwerken prüfst du neben der Fundstelle auch Datum und Geltungsbereich.",
        "For rule sets, check date and scope as well as the citation.",
      ),
    ),
  },
  "ai-native-operator": {
    courseSlug: "ai-native-operator",
    instrument: text("Agenten-Kontrollstand", "Agent Control Plane"),
    predictionPrompt: text(
      "Wo wird der Agentenlauf ohne Eingriff am ehesten teuer oder falsch?",
      "Where does the agent run most likely turn costly or wrong without intervention?",
    ),
    predictionChoices: choices(
      choice(
        "handoff",
        "Beim Analyst-Kritiker-Handoff",
        "At the analyst-to-critic handoff",
      ),
      choice(
        "publish-gate",
        "Am Freigabegate vor Veröffentlichung",
        "At the approval gate before publishing",
      ),
      choice("format", "Beim Berichtslayout", "At the report layout"),
    ),
    revealedSignal: text(
      "Der Scout liefert doppelte Tickets. Der Analyst überzieht sein Budget, der Kritiker erkennt die Dubletten, darf den Lauf aber nicht stoppen.",
      "The scout returns duplicate tickets. The analyst exceeds its budget, the critic detects duplicates but cannot stop the run.",
    ),
    manipulation: text(
      "Ändere Budget, Freigabegate oder Eingriffspunkt und beobachte Trace, Kosten und Ergebnisqualität.",
      "Change budget, approval gate or intervention point and watch trace, cost and output quality.",
    ),
    evidence: probe(
      text(
        "Was belegt, dass das Gate wirkt?",
        "What shows the gate works?",
      ),
      choices(
        choice(
          "agent-finished",
          "Alle Agenten haben beendet",
          "Every agent finished",
        ),
        choice(
          "trace-stop",
          "Trace stoppt vor Veröffentlichung, mit Grund",
          "Trace stops before publishing, with a reason",
        ),
        choice(
          "more-tokens",
          "Der Lauf nutzt mehr Tokens",
          "The run uses more tokens",
        ),
      ),
      "trace-stop",
      text(
        "Ein Gate wirkt nachweislich nur, wenn es die verbotene Aktion stoppt und den Grund protokolliert.",
        "A gate provably works only when it stops the prohibited action and logs why.",
      ),
    ),
    retrieval: probe(
      text(
        "Was muss jede Agentenübergabe enthalten?",
        "What must every agent handoff contain?",
      ),
      choices(
        choice(
          "full-history",
          "Die vollständige Chat-Historie",
          "The full chat history",
        ),
        choice(
          "role-only",
          "Nur den Namen des nächsten Agenten",
          "Only the next agent's name",
        ),
        choice(
          "bounded-contract",
          "Ergebnis, Evidenz, Unsicherheit, erlaubter nächster Schritt",
          "Result, evidence, uncertainty, allowed next step",
        ),
      ),
      "bounded-contract",
      text(
        "Eine begrenzte Übergabe gibt weiter, was für die Entscheidung zählt, ohne Kontext und Rechte auszuweiten.",
        "A bounded handoff passes on what the decision needs without widening context and authority.",
      ),
      {
        "full-history": text(
          "Die ganze Historie mischt veraltete, abgelehnte und womöglich sensible Anweisungen. Eine früh verworfene Aktion wirkt dann wie ein erlaubter nächster Schritt.",
          "Full history mixes stale, rejected and possibly sensitive instructions. An action rejected earlier can then look authorized.",
        ),
        "role-only": text(
          "Ein Rollenname klärt weder Ergebnis noch Spielraum. „Nächster Agent: Prüfer“ sagt nicht, welcher Claim offen ist oder ob veröffentlicht werden darf.",
          "A role name states neither result nor scope. “Next agent: reviewer” says neither which claim is open nor whether publishing is allowed.",
        ),
      },
    ),
    revision: probe(
      text(
        "Welche Intervention reagiert auf den Trace?",
        "Which intervention responds to the trace?",
      ),
      choices(
        choice(
          "critic-stop-dedupe",
          "Deduplizieren, Kritiker darf stoppen, Budget vorab prüfen",
          "Deduplicate, let the critic stop, check budget first",
        ),
        choice(
          "add-agent",
          "Einen weiteren Agenten ohne neue Grenze hinzufügen",
          "Add another agent without a new boundary",
        ),
        choice(
          "raise-budget",
          "Das Budget unbegrenzt erhöhen",
          "Raise the budget without a limit",
        ),
      ),
      "critic-stop-dedupe",
      text(
        "Der Eingriff behebt Datenqualität, Budget und fehlendes Stopprecht jeweils an ihrer Stelle.",
        "The intervention fixes data quality, budget and missing stop authority each where it occurs.",
      ),
    ),
    transferScenario: text(
      "Der Agentengraph bereitet nun einen Bericht vor, den nur ein Mensch versenden darf.",
      "The agent graph now prepares a report that only a human may send.",
    ),
    transfer: probe(
      text(
        "Welche Architekturgrenze muss erhalten bleiben?",
        "Which architecture boundary must remain?",
      ),
      choices(
        choice(
          "human-send",
          "Nur ein Mensch außerhalb des Graphen darf senden",
          "Only a human outside the graph can send",
        ),
        choice(
          "agent-send",
          "Der Redakteur darf nach guter Bewertung senden",
          "The editor may send after a good score",
        ),
        choice(
          "shared-token",
          "Alle Agenten teilen einen Sendetoken",
          "All agents share a send token",
        ),
      ),
      "human-send",
      text(
        "Eine menschliche Freigabe zählt nur, wenn der Agentenlauf die geschützte Aktion technisch nicht selbst auslösen kann.",
        "Human approval counts only if the agent run cannot technically trigger the protected action itself.",
      ),
    ),
  },
} as const satisfies Readonly<Record<CourseSlug, LessonMissionProfile>>;

export function getLessonMissionProfile(
  courseSlug: CourseSlug,
): LessonMissionProfile {
  return LESSON_MISSION_PROFILES[courseSlug];
}

export interface LessonMissionMisconception {
  readonly id: string;
  readonly label: LocalizedProjectText;
  readonly repair: LocalizedProjectText;
}

/**
 * Converts a bounded incorrect retrieval choice into equally bounded,
 * bilingual repair feedback. The fixed choice ID is safe to persist; no
 * learner-authored recall text enters this value.
 */
export function getLessonMissionMisconception(
  probe: LessonMissionProbe,
  choiceId: string | null,
): LessonMissionMisconception | null {
  if (choiceId === null || choiceId === probe.correctId) return null;
  const selected = probe.choices.find((entry) => entry.id === choiceId);
  if (!selected) return null;
  const repair = probe.repairByChoiceId?.[choiceId];
  if (!repair) return null;

  return {
    id: selected.id,
    label: selected.label,
    repair,
  };
}
