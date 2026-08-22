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
      "Welche Schwachstelle wird den synthetischen Mail-Entwurf wahrscheinlich zuerst unzuverlässig machen?",
      "Which weakness is most likely to make the synthetic email draft unreliable first?",
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
      "Der Entwurf behauptet eine nachgewiesene Energieersparnis. Im synthetischen Quellenpaket steht nur eine Herstellerschätzung ohne Messmethode.",
      "The draft claims proven energy savings. The synthetic source packet contains only a manufacturer estimate with no measurement method.",
    ),
    manipulation: text(
      "Öffne das Redline-Pult, ändere Datenklasse oder Quellenregel und beobachte, welche Claims die Prüfung passieren.",
      "Open the redline desk, change a data class or grounding rule, and observe which claims pass review.",
    ),
    evidence: probe(
      text(
        "Wie ist die Herstellerschätzung zu klassifizieren?",
        "How should the manufacturer estimate be classified?",
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
        "Die Quelle ist relevant, belegt aber weder Messung noch Kausalität. Der Claim muss als Schätzung markiert oder entfernt werden.",
        "The source is relevant but proves neither measurement nor causality. The claim must be labeled as an estimate or removed.",
      ),
    ),
    retrieval: probe(
      text(
        "Welche Prompt-Grenze verhindert, dass fehlende Belege sprachlich versteckt werden?",
        "Which prompt boundary prevents missing evidence from being hidden by fluent wording?",
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
        "Eine prüfbare Claim-Regel macht Evidenzlücken sichtbar; Stil- und Längenvorgaben tun das nicht.",
        "A testable claim rule exposes evidence gaps; style and length instructions do not.",
      ),
      {
        "more-tone": text(
          "Tonalitätsbeispiele steuern nur die Form, nicht die Beleglage. Ein perfekt markengerechter Satz kann weiterhin eine erfundene Wirkungszahl enthalten; jeder Claim braucht daher eine Quelle oder sichtbare Unsicherheit.",
          "Tone examples constrain form, not evidentiary support. A perfectly on-brand sentence can still contain an invented impact figure, so each claim needs a source or visible uncertainty.",
        ),
        "longer-output": text(
          "Länge erzeugt keine Evidenz und vergrößert die Angriffsfläche. Ein ausführlicher Entwurf kann denselben unbelegten Nutzen mehrfach wiederholen; binde Claims einzeln an Quellen.",
          "Length creates no evidence and increases the claim surface. A detailed draft can repeat the same unsupported benefit several times, so bind claims to sources individually.",
        ),
      },
    ),
    revision: probe(
      text(
        "Wie revidierst du den Auftrag nach dem Signal?",
        "How do you revise the task after seeing the signal?",
      ),
      choices(
        choice(
          "delete-all",
          "Alle Produktclaims löschen",
          "Delete every product claim",
        ),
        choice(
          "qualify-review",
          "Schätzung kennzeichnen, Quelle nennen und menschlich prüfen",
          "Label the estimate, cite the source, and require human review",
        ),
        choice(
          "stronger-tone",
          "Den Claim selbstbewusster formulieren",
          "Make the claim sound more confident",
        ),
      ),
      "qualify-review",
      text(
        "Die Revision erhält nutzbare Information, ohne eine Schätzung in einen Beweis umzudeuten.",
        "The revision preserves useful information without turning an estimate into proof.",
      ),
    ),
    transferScenario: text(
      "Ein freigegebener interner Entwurf fasst eine synthetische Lieferantenstudie mit fehlendem Stichprobenumfang zusammen.",
      "An approved internal draft summarizes a synthetic supplier study with no sample size.",
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
          "Evidenzgrenze, Unsicherheitslabel und Freigabe an den neuen Claim anpassen",
          "Adapt the evidence boundary, uncertainty label, and approval to the new claim",
        ),
        choice(
          "remove-review",
          "Die Prüfung bei internen Texten entfernen",
          "Remove review for internal text",
        ),
      ),
      "source-boundary",
      text(
        "Übertragbar ist die Kontrolllogik, nicht der Wortlaut eines Prompts.",
        "The control logic transfers, not the wording of a prompt.",
      ),
    ),
  },
  "eu-ai-act-kurs": {
    courseSlug: "eu-ai-act-kurs",
    instrument: text("Pflichten-Fallarchiv", "Obligation Case File"),
    predictionPrompt: text(
      "Welche fehlende Tatsache kippt die erste rechtliche Einordnung des synthetischen Vorsortiersystems am ehesten?",
      "Which missing fact is most likely to change the initial classification of the synthetic screening system?",
    ),
    predictionChoices: choices(
      choice("logo", "Die Farbe des Anbieterlogos", "The provider logo color"),
      choice(
        "decision-role",
        "Wer die relevante Entscheidung trifft und wofür",
        "Who makes the affected decision and for what purpose",
      ),
      choice(
        "model-size",
        "Die Parameterzahl des Modells",
        "The model parameter count",
      ),
    ),
    revealedSignal: text(
      "Die Rangliste löst keine automatische Ablehnung aus, bestimmt aber, welche Profile Menschen überhaupt sehen. Anbieter- und Betreiberrolle sind noch ungeklärt.",
      "The ranking triggers no automatic rejection, but determines which profiles humans ever see. Provider and deployer roles remain unresolved.",
    ),
    manipulation: text(
      "Öffne die Fallakte, ändere Zweck, Entscheidungseinfluss oder Akteursrolle und verfolge, wie der Pflichtenpfad reagiert.",
      "Open the case file, change purpose, decision influence, or actor role, and trace how the obligation path responds.",
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
          "Datierter Workflow mit Zweck, Einfluss und Rollen",
          "A dated workflow showing purpose, influence, and roles",
        ),
      ),
      "workflow-facts",
      text(
        "Pflichten hängen an Tatsachen, Rollen und Rechtsstand; Produktbezeichnungen ersetzen diese Prüfung nicht.",
        "Obligations attach to facts, roles, and the applicable legal date; product labels do not replace that analysis.",
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
          "Choose a category, then find matching facts",
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
        "Die System- und Rollenklärung muss vor der Pflichtenmatrix stehen.",
        "System and role clarification must precede the obligation matrix.",
      ),
      {
        "label-first": text(
          "Wer zuerst die Kategorie festlegt, sucht anschließend bestätigende Tatsachen und kann Systemgrenzen oder Rollen übersehen. Eine menschliche Freigabe macht etwa einen entscheidungsbeeinflussenden Einsatz nicht automatisch risikoarm.",
          "Choosing the category first invites confirmatory fact-finding and can hide system boundaries or roles. Human approval, for example, does not automatically make a decision-influencing use low risk.",
        ),
        "model-first": text(
          "Das Modell allein bestimmt die Pflicht nicht; derselbe Modelltyp kann in Rechtschreibprüfung und Bewerberauswahl unterschiedliche Rollen und Risikopfade haben. Prüfe zuerst den konkreten Einsatz.",
          "The model alone does not determine the obligation; the same model type can have different roles and risk paths in spell-checking and applicant selection. Examine the concrete use first.",
        ),
      },
    ),
    revision: probe(
      text(
        "Wie wird die Fallakte nach dem Signal revidiert?",
        "How should the case file be revised after the signal?",
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
          "Entscheidungseinfluss und Rollen belegen, dann beide Klassifikationspfade testen",
          "Evidence decision influence and roles, then test both classification paths",
        ),
      ),
      "map-influence",
      text(
        "Menschliche Beteiligung ist kein pauschaler Ausweg; der konkrete Einfluss und die Rollen müssen belegt werden.",
        "Human involvement is not a blanket exemption; the actual influence and roles must be evidenced.",
      ),
    ),
    transferScenario: text(
      "Dasselbe Modell wird später für eine synthetische Schulungs-Empfehlung ohne Rangfolge eingesetzt.",
      "The same model is later used for synthetic training recommendations without ranking people.",
    ),
    transfer: probe(
      text(
        "Was darf nicht ungeprüft übertragen werden?",
        "What must not be transferred without re-analysis?",
      ),
      choices(
        choice(
          "old-classification",
          "Die alte Risikoeinstufung allein aufgrund desselben Modells",
          "The old risk classification solely because the model is the same",
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
        "Der konkrete Zweck und Einsatzkontext werden neu bewertet; der Modellname entscheidet die Kategorie nicht allein.",
        "Purpose and deployment context must be reassessed; the model name alone does not determine the category.",
      ),
    ),
  },
  "ai-native": {
    courseSlug: "ai-native",
    instrument: text("Workflow-Konsole", "Workflow Console"),
    predictionPrompt: text(
      "Wo wird der synthetische Wochenbericht ohne zusätzliche Kontrolle zuerst entgleisen?",
      "Where will the synthetic weekly-report workflow fail first without another control?",
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
      "Zwei Projektmeldungen widersprechen sich. Der Agent kann den Bericht veröffentlichen, ohne den Konflikt zu eskalieren oder eine Quellenlücke zu markieren.",
      "Two project updates conflict. The agent can publish the report without escalating the conflict or marking an evidence gap.",
    ),
    manipulation: text(
      "Öffne die Workflow-Konsole, verschiebe Freigabegate oder Abbruchregel und beobachte den synthetischen Laufpfad.",
      "Open the workflow console, move an approval gate or stop rule, and observe the synthetic run path.",
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
        "Kontrollwirksamkeit zeigt sich am beobachteten Stopp, nicht an Stil oder Geschwindigkeit.",
        "Control effectiveness is demonstrated by the observed stop, not by style or speed.",
      ),
    ),
    retrieval: probe(
      text(
        "Was gehört zwingend in einen kontrollierten KI-Arbeitsauftrag?",
        "What is mandatory in a controlled AI work order?",
      ),
      choices(
        choice(
          "goal-only",
          "Nur ein möglichst genaues Ziel",
          "Only a precise goal",
        ),
        choice(
          "boundary-gates",
          "Ziel, Nicht-Ziele, Werkzeuggrenzen, Freigaben und Abbruch",
          "Goal, non-goals, tool boundaries, approvals, and stop conditions",
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
          "Ein präzises Ziel begrenzt weder Mittel noch Freigaben. Der Auftrag „Veröffentliche die Zusammenfassung“ ist eindeutig, erlaubt ohne Werkzeug- und Stoppgrenze aber weiterhin eine Veröffentlichung trotz Quellenkonflikt.",
          "A precise goal bounds neither means nor approvals. The task “Publish the summary” is unambiguous, yet without tool and stop boundaries it still permits publishing through a source conflict.",
        ),
        persona: text(
          "Eine Persona beschreibt Verhalten, verleiht aber keine Berechtigung und erzwingt keinen Stopp. Auch ein Agent mit der Persona „Compliance-Prüfer“ kann ohne Gate einen widersprüchlichen Entwurf veröffentlichen.",
          "A persona describes behavior but grants no authority and enforces no stop. Even an agent cast as a compliance reviewer can publish a conflicting draft when no gate blocks it.",
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
          "Konflikterkennung vor Veröffentlichung mit menschlicher Entscheidung",
          "Conflict detection before publishing with a human decision",
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
        "Der Konflikt braucht eine sichtbare Entscheidungsgrenze, keinen größeren Kontext oder blinden Retry.",
        "The conflict needs a visible decision boundary, not more context or a blind retry.",
      ),
    ),
    transferScenario: text(
      "Der Ablauf wird auf einen synthetischen Lieferstatus übertragen, der externe Benachrichtigungen auslösen könnte.",
      "The workflow is transferred to a synthetic delivery status that could trigger external notifications.",
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
          "None; the same workflow is sufficient",
        ),
        choice(
          "longer-prompt",
          "Nur ein längerer Systemprompt",
          "Only a longer system prompt",
        ),
        choice(
          "external-action",
          "Separates Freigabegate für die externe Aktion und ein Rückfallweg",
          "A separate approval gate for the external action and a fallback path",
        ),
      ),
      "external-action",
      text(
        "Eine neue Außenwirkung verlangt eine eigene Autorisierungs- und Rückfallgrenze.",
        "A new external effect requires its own authorization and fallback boundary.",
      ),
    ),
  },
  "ki-und-gesellschaft": {
    courseSlug: "ki-und-gesellschaft",
    instrument: text("Provenienz-Redaktion", "Provenance Newsroom"),
    predictionPrompt: text(
      "Welches Indiz wird bei dem synthetischen Video am leichtesten mit einem Echtheitsbeweis verwechselt?",
      "Which signal in the synthetic video is easiest to mistake for proof of authenticity?",
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
      "Der Zeitstempel passt zur Behauptung, stammt aber aus einer neu exportierten Kopie. Zwei Accounts teilen denselben Ausschnitt und verweisen aufeinander.",
      "The timestamp matches the claim but comes from a newly exported copy. Two accounts share the same clip and cite each other.",
    ),
    manipulation: text(
      "Öffne die Provenienz-Redaktion, ändere Quellenunabhängigkeit oder Signalgewicht und verfolge die Publikationsentscheidung.",
      "Open the provenance newsroom, change source independence or signal weight, and trace the publication decision.",
    ),
    evidence: probe(
      text(
        "Wie ist der Zeitstempel einzuordnen?",
        "How should the timestamp be classified?",
      ),
      choices(
        choice("proof", "Echtheitsbeweis", "Proof of authenticity"),
        choice(
          "signal",
          "Schwaches Provenienzsignal mit offenem Ursprung",
          "Weak provenance signal with unresolved origin",
        ),
        choice("fabrication", "Beweis für Fälschung", "Proof of fabrication"),
      ),
      "signal",
      text(
        "Metadaten einer Kopie sind ein prüfbares Signal, aber kein Beweis für Aufnahmezeit oder Echtheit.",
        "Metadata from a copy is a testable signal, not proof of capture time or authenticity.",
      ),
    ),
    retrieval: probe(
      text(
        "Welche Trennung schützt vor überzogenen Schlussfolgerungen?",
        "Which separation prevents overclaiming?",
      ),
      choices(
        choice(
          "observe-infer",
          "Beobachtung, abgeleitete Interpretation und offene Unsicherheit",
          "Observation, inferred interpretation, and unresolved uncertainty",
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
        "Der Befund muss sichtbar von seiner Interpretation und der verbleibenden Unsicherheit getrennt bleiben.",
        "The observation must remain visibly separate from its interpretation and residual uncertainty.",
      ),
      {
        "true-false": text(
          "Die Zweiteilung erzwingt Gewissheit, wo das Signal mehrere Ursachen zulässt. Ein Zeitstempel einer Kopie beweist weder den Aufnahmezeitpunkt noch eine Fälschung; Beobachtung und Restunsicherheit müssen getrennt bleiben.",
          "A binary verdict forces certainty where the signal permits several causes. A copied file's timestamp proves neither capture time nor fabrication, so observation and residual uncertainty must remain separate.",
        ),
        "popular-unpopular": text(
          "Popularität misst Verbreitung, nicht Herkunft oder Echtheit. Eine dekontextualisierte Kopie kann viral und weithin akzeptiert sein, obwohl ihre Provenienz ungeklärt bleibt.",
          "Popularity measures circulation, not origin or authenticity. A decontextualized copy can go viral and gain broad acceptance while its provenance remains unresolved.",
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
          "Veröffentlichung halten, Ursprung suchen und Unsicherheit dokumentieren",
          "Hold publication, seek the origin, and document uncertainty",
        ),
      ),
      "hold-verify",
      text(
        "Weder Echtheit noch Fälschung ist belegt; die verantwortbare Aktion ist weitere Verifikation.",
        "Neither authenticity nor fabrication is established; further verification is the defensible action.",
      ),
    ),
    transferScenario: text(
      "Ein synthetisches Audiozitat liegt als Originaldatei vor, aber die Sprecherzuordnung stammt nur aus einem anonymen Post.",
      "A synthetic audio quote is available as an original file, but speaker attribution comes only from an anonymous post.",
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
          "Die Provenienzkette und unabhängige Sprecherzuordnung",
          "The provenance chain and independent speaker attribution",
        ),
        choice("file-size", "Nur die Dateigröße", "Only the file size"),
      ),
      "provenance-chain",
      text(
        "Das Medium ändert sich, die Pflicht zu unabhängiger Provenienz- und Claimprüfung bleibt.",
        "The medium changes, but independent provenance and claim verification remain necessary.",
      ),
    ),
  },
  "data-engineering-fundamentals": {
    courseSlug: "data-engineering-fundamentals",
    instrument: text("Pipeline-Störstand", "Pipeline Failure Bench"),
    predictionPrompt: text(
      "Welche Invariante bricht beim ersten Replay des synthetischen Auftrags am ehesten?",
      "Which invariant is most likely to fail on the first replay of the synthetic job?",
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
      "Öffne den Störstand, aktiviere Replay und ändere Deduplikations- oder Late-Data-Regeln. Vergleiche Zeilenzahl und Reconciliation.",
      "Open the failure bench, trigger replay, and change deduplication or late-data rules. Compare row counts and reconciliation.",
    ),
    evidence: probe(
      text(
        "Welches Signal belegt korrekte Wiederholung?",
        "Which signal demonstrates a correct replay?",
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
          "Eindeutige Ereignisschlüssel und ausgeglichene Reconciliation",
          "Unique event keys and a balanced reconciliation",
        ),
      ),
      "reconciled-keys",
      text(
        "Ein erfolgreicher Prozessstatus beweist keine Datenkorrektheit; Schlüssel- und Mengenabgleich tun es.",
        "A successful process status does not prove data correctness; key and count reconciliation do.",
      ),
    ),
    retrieval: probe(
      text(
        "Welche Zeit muss für verspätete Ereignisse getrennt werden?",
        "Which notions of time must be separated for late events?",
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
        "Late-Data-Logik braucht die Trennung zwischen dem Zeitpunkt des Ereignisses und seiner Verarbeitung.",
        "Late-data logic requires separating when an event occurred from when it was processed.",
      ),
      {
        "clock-only": text(
          "Die aktuelle Uhrzeit zeigt nur, wann verarbeitet wird, nicht wann das Ereignis entstand. Ein heute erneut eingespieltes Ereignis kann von gestern stammen und wäre ohne Ereigniszeit fälschlich pünktlich.",
          "The current clock shows only when processing happens, not when the event occurred. An event replayed today may be from yesterday and would look falsely on time without event time.",
        ),
        "deploy-time": text(
          "Deployment-Zeit datiert Code, nicht Daten. Ein Ereignis kann vor dem Release auftreten und erst danach eintreffen; nur Ereignis- und Verarbeitungszeit machen diese Verspätung sichtbar.",
          "Deployment time dates code, not data. An event can occur before a release and arrive after it; only event and processing time expose that delay.",
        ),
      },
    ),
    revision: probe(
      text(
        "Welche Änderung behebt den beobachteten Fehlerpfad?",
        "Which change addresses the observed failure path?",
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
          "Stabiler Ereignisschlüssel, idempotenter Upsert und Reconciliation",
          "Stable event key, idempotent upsert, and reconciliation",
        ),
      ),
      "stable-key-upsert",
      text(
        "Replay-Sicherheit entsteht durch deterministische Identität und Prüfung, nicht durch weniger oder mehr Wiederholungen.",
        "Replay safety comes from deterministic identity and verification, not from fewer or more retries.",
      ),
    ),
    transferScenario: text(
      "Die Pipeline verarbeitet nun synthetische Korrekturereignisse, die bestehende Werte rückwirkend ändern.",
      "The pipeline now handles synthetic correction events that retroactively change existing values.",
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
        "Korrekturereignisse brechen die Append-only-Annahme; Identität und Reconciliation bleiben gültig.",
        "Correction events break the append-only assumption; identity and reconciliation still apply.",
      ),
    ),
  },
  "data-science": {
    courseSlug: "data-science",
    instrument: text("Experiment-Prüffeld", "Experiment Test Rig"),
    predictionPrompt: text(
      "Welcher Fehler lässt den synthetischen Modelleffekt am wahrscheinlichsten besser aussehen, als er ist?",
      "Which defect is most likely to make the synthetic model effect look better than it is?",
    ),
    predictionChoices: choices(
      choice("small-sample", "Kleine Stichprobe", "Small sample"),
      choice("leakage", "Ziel-Leakage", "Target leakage"),
      choice("rounding", "Gerundete Anzeige", "Rounded display"),
    ),
    revealedSignal: text(
      "Die Variable `resolved_at` wird vor dem Split berechnet. Sie ist im Training und in der Auswertung enthalten, steht bei einer realen Vorhersage aber noch nicht fest.",
      "The `resolved_at` feature is computed before the split. It is present in training and evaluation but unavailable at real prediction time.",
    ),
    manipulation: text(
      "Öffne das Prüffeld, schalte Leakage und Zwischenanalysen um und vergleiche Effekt, Unsicherheit und Holdout-Verhalten.",
      "Open the test rig, toggle leakage and interim looks, and compare effect, uncertainty, and holdout behavior.",
    ),
    evidence: probe(
      text(
        "Welche Evidenz zeigt Leakage am direktesten?",
        "Which evidence most directly demonstrates leakage?",
      ),
      choices(
        choice("high-score", "Ein hoher Gesamtscore", "A high aggregate score"),
        choice(
          "time-audit",
          "Ein Feature-Verfügbarkeitsaudit zum Vorhersagezeitpunkt",
          "A feature-availability audit at prediction time",
        ),
        choice(
          "pretty-chart",
          "Eine glatte Lernkurve",
          "A smooth learning curve",
        ),
      ),
      "time-audit",
      text(
        "Entscheidend ist, ob die Information zum Einsatzzeitpunkt existiert, nicht wie überzeugend die Metrik aussieht.",
        "The decisive question is whether the information exists at serving time, not how convincing the metric looks.",
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
        "Der finale Holdout bleibt bis zur festgelegten Endbewertung unangetastet; wiederholtes Nachsteuern macht ihn zur Validierung.",
        "The final holdout remains untouched until the predefined final evaluation; repeated tuning turns it into validation data.",
      ),
      {
        training: text(
          "Trainingsdaten dürfen das Fitten steuern; sonst kann das Modell keine Parameter lernen. Dass Koeffizienten aus Trainingsbeispielen gelernt werden, verbraucht nicht den versiegelten finalen Holdout.",
          "Training data must steer fitting or the model cannot learn parameters. Learning coefficients from training examples does not consume the sealed final holdout.",
        ),
        validation: text(
          "Validierungsdaten sind für Modell- und Hyperparameterentscheidungen vorgesehen, auch wenn ihr Übergebrauch kontrolliert werden muss. Eine Lernrate darf anhand der Validierung gewählt werden; der finale Holdout wird erst danach einmalig geöffnet.",
          "Validation data is intended for model and hyperparameter decisions, although overuse must be controlled. A learning rate may be chosen on validation; the final holdout is opened once afterward.",
        ),
      },
    ),
    revision: probe(
      text("Wie revidierst du die Analyse?", "How do you revise the analysis?"),
      choices(
        choice(
          "drop-audit-resplit",
          "Leakage-Feature entfernen, zeitgerecht neu splitten und Unsicherheit neu berechnen",
          "Remove the leaking feature, re-split by time, and recompute uncertainty",
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
        "Die Datenentstehung und Evaluation müssen repariert werden; kosmetische Berichtsänderungen reichen nicht.",
        "The data-generating and evaluation process must be repaired; cosmetic reporting changes are insufficient.",
      ),
    ),
    transferScenario: text(
      "Ein neues synthetisches Prognoseprojekt nutzt ein Merkmal, das erst zwei Stunden nach dem Zielereignis aktualisiert wird.",
      "A new synthetic forecasting project uses a feature updated two hours after the target event.",
    ),
    transfer: probe(
      text("Welche Prüfung wird übertragen?", "Which check transfers?"),
      choices(
        choice(
          "feature-timeline",
          "Eine Feature-Zeitlinie relativ zum Vorhersagezeitpunkt",
          "A feature timeline relative to prediction time",
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
        "Übertragbar ist das Verfügbarkeitsaudit; Modell und Grenzwert hängen vom neuen Problem ab.",
        "The availability audit transfers; the model and threshold depend on the new problem.",
      ),
    ),
  },
  "data-infrastructure": {
    courseSlug: "data-infrastructure",
    instrument: text("Streaming-Kontrollraum", "Streaming Control Room"),
    predictionPrompt: text(
      "Welches SLO-Signal verschlechtert sich beim synthetischen Netzschnitt zuerst?",
      "Which SLO signal degrades first during the synthetic network partition?",
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
      "Öffne den Kontrollraum, injiziere Partition oder Rückstau und verändere Replikation, Wasserzeichen oder Replay-Strategie.",
      "Open the control room, inject a partition or backlog, and change replication, watermark, or replay strategy.",
    ),
    evidence: probe(
      text(
        "Welche Evidenz trennt Erholung von bloßem Aufholen?",
        "Which evidence distinguishes recovery from merely catching up?",
      ),
      choices(
        choice(
          "lag-zero",
          "Consumer-Lag erreicht null",
          "Consumer lag reaches zero",
        ),
        choice(
          "invariant-slo",
          "Lag, Duplikate, Verlust und Reihenfolge gegen definierte Grenzen",
          "Lag, duplicates, loss, and ordering against defined limits",
        ),
        choice("cpu-low", "CPU-Auslastung sinkt", "CPU utilization falls"),
      ),
      "invariant-slo",
      text(
        "Ein leerer Rückstand kann mit Duplikaten oder Verlust erkauft sein; Erholung muss Korrektheit und SLO gemeinsam prüfen.",
        "An empty backlog can be bought with duplicates or loss; recovery must verify correctness and SLOs together.",
      ),
    ),
    retrieval: probe(
      text(
        "Welche Größe steuert, wann verspätete Ereignisse als vollständig gelten?",
        "Which mechanism controls when late events are considered complete?",
      ),
      choices(
        choice("watermark", "Wasserzeichen", "Watermark"),
        choice("partition-count", "Partitionsanzahl", "Partition count"),
        choice("replica-count", "Replikazahl", "Replica count"),
      ),
      "watermark",
      text(
        "Wasserzeichen modellieren den Fortschritt der Ereigniszeit und die tolerierte Verspätung.",
        "Watermarks model event-time progress and tolerated lateness.",
      ),
      {
        "partition-count": text(
          "Die Partitionszahl steuert Parallelität und Datenverteilung, nicht den Fortschritt der Ereigniszeit. Auch bei zehn Partitionen kann in einer davon noch ein älteres Ereignis eintreffen.",
          "Partition count controls parallelism and data distribution, not event-time progress. Even with ten partitions, an older event can still arrive in one of them.",
        ),
        "replica-count": text(
          "Replikas erhöhen Verfügbarkeit, kopieren aber denselben Vollständigkeitsstand. Drei Replikas können dasselbe unvollständige Ereignisfenster enthalten; nur ein Wasserzeichen modelliert tolerierte Verspätung.",
          "Replicas improve availability but copy the same completeness state. Three replicas can contain the same incomplete event window; only a watermark models tolerated lateness.",
        ),
      },
    ),
    revision: probe(
      text(
        "Welche Reaktion adressiert beide beobachteten Signale?",
        "Which response addresses both observed signals?",
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
          "Kontrolliert skalieren, idempotent replayen und Korrektheit reconciliieren",
          "Scale deliberately, replay idempotently, and reconcile correctness",
        ),
      ),
      "controlled-replay",
      text(
        "Durchsatz und Korrektheit brauchen eine gekoppelte Wiederherstellung; Skalierung allein löst Duplikate nicht.",
        "Throughput and correctness need a coupled recovery; scaling alone does not address duplicates.",
      ),
    ),
    transferScenario: text(
      "Der Stream trägt nun synthetische Alarmereignisse, bei denen ein spätes Ereignis eine menschliche Eskalation auslösen kann.",
      "The stream now carries synthetic alert events where a late event may trigger human escalation.",
    ),
    transfer: probe(
      text(
        "Welche Grenze muss neu festgelegt werden?",
        "Which boundary must be redefined?",
      ),
      choices(
        choice(
          "lateness-action",
          "Tolerierte Verspätung plus Verhalten nach dem Wasserzeichen",
          "Tolerated lateness plus behavior after the watermark",
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
        "Die neue Außenwirkung ändert die Kosten von Verspätung; Zeitgrenze und Kompensationsweg müssen neu bestimmt werden.",
        "The new external effect changes the cost of lateness; the time boundary and compensation path must be redefined.",
      ),
    ),
  },
  codex: {
    courseSlug: "codex",
    instrument: text("Repository-Werkbank", "Repository Workbench"),
    predictionPrompt: text(
      "Welcher Beleg wird die Ursache des synthetischen Retry-Fehlers am schnellsten eingrenzen?",
      "Which evidence will narrow the cause of the synthetic retry defect fastest?",
    ),
    predictionChoices: choices(
      choice(
        "readme",
        "Die README vollständig umschreiben",
        "Rewrite the README",
      ),
      choice(
        "failing-test",
        "Der kleinste reproduzierende Test mit konkretem Exit-Code",
        "The smallest reproducing test with a concrete exit code",
      ),
      choice(
        "dependency-update",
        "Alle Abhängigkeiten aktualisieren",
        "Update every dependency",
      ),
    ),
    revealedSignal: text(
      "Der fokussierte Test erwartet drei Versuche, beobachtet aber vier. Der Diff zeigt, dass der Zähler vor statt nach der Abbruchprüfung erhöht wird.",
      "The focused test expects three attempts but observes four. The diff shows the counter increments before rather than after the stop check.",
    ),
    manipulation: text(
      "Öffne die Repository-Werkbank, inspiziere die synthetischen Dateien, wende den begrenzten Patch an und führe die erlaubten Checks aus.",
      "Open the repository workbench, inspect the synthetic files, apply the bounded patch, and run the allowed checks.",
    ),
    evidence: probe(
      text(
        "Welche Evidenz ist für die Reparatur am stärksten?",
        "Which evidence is strongest for the repair?",
      ),
      choices(
        choice(
          "looks-clean",
          "Der Code sieht sauberer aus",
          "The code looks cleaner",
        ),
        choice(
          "focused-plus-suite",
          "Reproduzierender Test, grüner Fokuscheck und grüne vollständige Prüfkette",
          "Reproducing test, passing focused check, and passing full verification chain",
        ),
        choice("large-diff", "Ein umfangreicher Diff", "A large diff"),
      ),
      "focused-plus-suite",
      text(
        "Der reproduzierende Fehler und die fokussierte sowie breite Regression verbinden Ursache, Fix und Nebenwirkungsprüfung.",
        "The reproducer plus focused and broad regression checks connect cause, fix, and side-effect coverage.",
      ),
    ),
    retrieval: probe(
      text(
        "Was begrenzt einen agentischen Codeauftrag vor der Änderung?",
        "What bounds an agentic coding task before edits begin?",
      ),
      choices(
        choice(
          "task-contract",
          "Scope, Nicht-Ziele, Akzeptanzkriterien und erlaubte Checks",
          "Scope, non-goals, acceptance criteria, and allowed checks",
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
          "Ein Branchname benennt Absicht, aber weder erlaubte Dateien noch Abnahmekriterien. Der Branch „fix-retry“ verhindert nicht, dass ein Agent zusätzlich Datenbankcode ändert.",
          "A branch name states intent but defines neither allowed files nor acceptance criteria. A branch named “fix-retry” does not prevent an agent from also changing database code.",
        ),
        "more-tools": text(
          "Mehr Werkzeuge erweitern Fähigkeit und Schadensradius, setzen aber keine Grenze. Ein Agent mit Repository- und Datenbankzugriff weiß ohne Task-Vertrag nicht, ob Schemaänderungen erlaubt sind.",
          "More tools expand capability and blast radius but set no boundary. An agent with repository and database access cannot know whether schema changes are allowed without a task contract.",
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
          "Reihenfolge der Abbruchprüfung korrigieren und den Grenzfall testen",
          "Correct the stop-check order and test the boundary case",
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
        "Der kleinste kohärente Fix adressiert die belegte Off-by-one-Ursache und schützt den Grenzfall.",
        "The smallest coherent fix addresses the evidenced off-by-one cause and protects the boundary case.",
      ),
    ),
    transferScenario: text(
      "Ein anderer synthetischer Worker zählt Timeouts statt Versuche und besitzt eine Backoff-Grenze.",
      "Another synthetic worker counts timeouts rather than attempts and has a backoff boundary.",
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
          "Instruktionen lesen, Grenze reproduzieren und minimal gegen Kriterien ändern",
          "Read instructions, reproduce the boundary, and make the smallest criteria-based change",
        ),
      ),
      "contract-reproducer",
      text(
        "Die Methode überträgt sich; Zählersemantik und konkreter Patch müssen neu geprüft werden.",
        "The method transfers; counter semantics and the concrete patch must be reassessed.",
      ),
    ),
  },
  claude: {
    courseSlug: "claude",
    instrument: text("Grounding-Komparator", "Grounding Comparator"),
    predictionPrompt: text(
      "Welche Promptvariante wird im synthetischen Museumsfall wahrscheinlich weniger unbelegte Claims erzeugen?",
      "Which prompt variant is likely to produce fewer unsupported claims in the synthetic museum case?",
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
        "Claim-Quelle-Zuordnung mit Verweigerungsregel",
        "Claim-to-source mapping with a refusal rule",
      ),
    ),
    revealedSignal: text(
      "Quelle B widerspricht Quelle C beim Ausstellungsjahr. Eine attraktive Besucherzahl steht in keiner Quelle, erscheint aber in der Basisantwort.",
      "Source B conflicts with Source C on the exhibition year. An attractive visitor count appears in no source but is present in the baseline answer.",
    ),
    manipulation: text(
      "Öffne den Komparator, ändere Grounding- und Verweigerungsregeln und führe beide Promptvarianten gegen dasselbe Quellenpaket aus.",
      "Open the comparator, change grounding and refusal rules, and run both prompt variants against the same source packet.",
    ),
    evidence: probe(
      text(
        "Wie wird die Besucherzahl klassifiziert?",
        "How should the visitor count be classified?",
      ),
      choices(
        choice("supported", "Direkt belegt", "Directly supported"),
        choice("unsupported", "Unbelegter Claim", "Unsupported claim"),
        choice("conflict", "Quellenkonflikt", "Source conflict"),
      ),
      "unsupported",
      text(
        "Ein Konflikt setzt mindestens zwei widersprechende Belege voraus; hier fehlt jede Quelle.",
        "A conflict requires at least two contradictory sources; here there is no source at all.",
      ),
    ),
    retrieval: probe(
      text(
        "Welche Eval-Dimension prüft sichtbare Unsicherheit bei einem Quellenkonflikt?",
        "Which evaluation dimension checks visible uncertainty under source conflict?",
      ),
      choices(
        choice("format", "Format", "Format"),
        choice("calibration", "Kalibrierung", "Calibration"),
        choice("length", "Länge", "Length"),
      ),
      "calibration",
      text(
        "Kalibrierung prüft, ob sprachliche Sicherheit zur vorhandenen Evidenz passt.",
        "Calibration checks whether expressed confidence matches the available evidence.",
      ),
      {
        format: text(
          "Format prüft Struktur, nicht das Verhältnis von Sicherheit zu Evidenz. Eine sauber formatierte Tabelle kann eine widersprüchliche Zahl weiterhin als sicher ausgeben.",
          "Format tests structure, not whether confidence matches evidence. A neatly formatted table can still present a disputed figure as certain.",
        ),
        length: text(
          "Länge misst Umfang, nicht Kalibrierung. Der kurze Satz „42 ist bestätigt“ kann trotz Quellenkonflikt übermäßig sicher sein; mehr Wörter würden die Evidenzlücke ebenfalls nicht beheben.",
          "Length measures volume, not calibration. The short sentence “42 is confirmed” can be overconfident despite a source conflict, and more words would not repair the evidence gap.",
        ),
      },
    ),
    revision: probe(
      text(
        "Wie wird der Grounding-Prompt revidiert?",
        "How should the grounding prompt be revised?",
      ),
      choices(
        choice(
          "force-answer",
          "Bei Lücken die wahrscheinlichste Zahl ergänzen",
          "Fill gaps with the most likely number",
        ),
        choice(
          "cite-refuse-conflict",
          "Jeden Claim belegen, Lücken verweigern und Konflikte getrennt ausweisen",
          "Ground each claim, refuse gaps, and report conflicts separately",
        ),
        choice(
          "remove-sources",
          "Quellenhinweise aus der Ausgabe entfernen",
          "Remove source references from the output",
        ),
      ),
      "cite-refuse-conflict",
      text(
        "Die Revision unterscheidet unbelegte Information von widersprüchlicher Information und macht beides sichtbar.",
        "The revision distinguishes unsupported information from conflicting information and exposes both.",
      ),
    ),
    transferScenario: text(
      "Ein synthetisches Policy-Paket enthält eine veraltete Richtlinie und eine neuere Änderung mit engerem Geltungsbereich.",
      "A synthetic policy packet contains an old policy and a newer amendment with narrower scope.",
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
        "Bei normativen Quellen müssen Aktualität und Geltungsbereich zusätzlich zur reinen Fundstelle geprüft werden.",
        "Normative sources require checking applicability date and scope in addition to mere citation.",
      ),
    ),
  },
  "ai-native-operator": {
    courseSlug: "ai-native-operator",
    instrument: text("Agenten-Kontrollstand", "Agent Control Plane"),
    predictionPrompt: text(
      "An welcher Grenze wird der synthetische Agentenlauf ohne Intervention am ehesten teuer oder falsch?",
      "At which boundary is the synthetic agent run most likely to become costly or wrong without intervention?",
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
      "Der Scout liefert doppelte Tickets. Der Analyst überschreitet sein Budget, der Kritiker erkennt die Dubletten, darf den Lauf aber nicht stoppen.",
      "The scout returns duplicate tickets. The analyst exceeds its budget, the critic detects duplicates but cannot stop the run.",
    ),
    manipulation: text(
      "Öffne den Kontrollstand, verändere Budget, Freigabegate oder Interventionspunkt und beobachte Trace, Kosten und Ergebnisqualität.",
      "Open the control plane, change the budget, approval gate, or intervention point, and observe trace, cost, and output quality.",
    ),
    evidence: probe(
      text(
        "Welches Signal belegt, dass das Gate wirksam ist?",
        "Which signal demonstrates that the gate is effective?",
      ),
      choices(
        choice(
          "agent-finished",
          "Alle Agenten haben beendet",
          "Every agent finished",
        ),
        choice(
          "trace-stop",
          "Der Trace stoppt vor Veröffentlichung mit benanntem Grund",
          "The trace stops before publishing with a named reason",
        ),
        choice(
          "more-tokens",
          "Der Lauf nutzt mehr Tokens",
          "The run uses more tokens",
        ),
      ),
      "trace-stop",
      text(
        "Ein Gate ist nur beobachtbar wirksam, wenn es die verbotene Aktion tatsächlich stoppt und den Grund protokolliert.",
        "A gate is demonstrably effective only when it actually stops the prohibited action and records why.",
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
          "Ergebnis, Evidenz, offene Unsicherheit und erlaubter nächster Schritt",
          "Result, evidence, unresolved uncertainty, and allowed next action",
        ),
      ),
      "bounded-contract",
      text(
        "Eine begrenzte Übergabe erhält Entscheidungsrelevanz, ohne Kontext und Berechtigung unkontrolliert auszuweiten.",
        "A bounded handoff preserves decision-relevant context without expanding context and authority indiscriminately.",
      ),
      {
        "full-history": text(
          "Vollständige Historie maximiert Kontext, vermischt aber veraltete, abgelehnte und womöglich sensible Anweisungen. Eine früh verworfene Aktion kann dadurch wie ein noch erlaubter nächster Schritt erscheinen; übergib nur Ergebnis, Evidenz, Unsicherheit und Grenze.",
          "Full history maximizes context but mixes stale, rejected, and potentially sensitive instructions. An action rejected earlier can then appear to remain authorized, so hand off only result, evidence, uncertainty, and boundary.",
        ),
        "role-only": text(
          "Ein Rollenname klärt weder belegtes Ergebnis noch Handlungsspielraum. „Nächster Agent: Prüfer“ sagt nicht, welcher Claim offen ist oder ob eine Veröffentlichung erlaubt ist.",
          "A role name identifies neither the supported result nor the action boundary. “Next agent: reviewer” says neither which claim remains open nor whether publishing is allowed.",
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
          "Deduplizieren, Kritiker-Stopprecht setzen und Budget vor Analyse prüfen",
          "Deduplicate, give the critic stop authority, and check budget before analysis",
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
        "Die Intervention adressiert Datenqualität, Budget und fehlende Autorität an ihren jeweiligen Grenzen.",
        "The intervention addresses data quality, budget, and missing authority at their respective boundaries.",
      ),
    ),
    transferScenario: text(
      "Der Agentengraph soll nun einen synthetischen Bericht vorbereiten, dessen Versand weiterhin ausschließlich ein Mensch auslösen darf.",
      "The agent graph now prepares a synthetic report whose delivery must remain exclusively human-triggered.",
    ),
    transfer: probe(
      text(
        "Welche Architekturgrenze muss erhalten bleiben?",
        "Which architecture boundary must remain?",
      ),
      choices(
        choice(
          "human-send",
          "Die Sendeberechtigung liegt außerhalb des Agentengraphen beim Menschen",
          "Send authority remains outside the agent graph with a human",
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
        "Eine menschliche Freigabe ist nur real, wenn der Agentenlauf die geschützte Aktion technisch nicht selbst auslösen kann.",
        "Human approval is real only when the agent run cannot technically trigger the protected action itself.",
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
