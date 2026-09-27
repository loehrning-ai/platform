"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  DATA_WORKSPACE_COMMANDS,
  isVerifiedDataWorkspaceResponse,
  type DataWorkspaceAttestation,
  type SyntheticTerminalResponse,
  type SyntheticWorkspaceId,
} from "@/app/api/course-workspace/terminal/types";
import type {
  CourseProjectArtifactState,
  CourseProjectEngineProps,
} from "@/lib/course-projects/types";
import { getCourseProjectExecutionReceipt } from "@/lib/course-projects/types";

import {
  EngineFrame,
  EvidenceItem,
  LAB_BUTTON,
  LAB_BUTTON_SECONDARY,
  LAB_INPUT,
  VerifyPanel,
} from "./engine-ui";

type DataVariant = "experiment" | "pipeline" | "control-room";
type DataWorkspaceId = Exclude<SyntheticWorkspaceId, "pipeline-quality">;
type RunState = "idle" | "loading" | "success" | "error";

type ActiveWorkspaceRequest = {
  epoch: number;
  fingerprint: string;
  controller: AbortController;
};

const BLOCKED_QUERY_PATTERN =
  /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|call|execute|merge)\b/i;

const WORKSPACE_BY_VARIANT = {
  experiment: "data-science-experiment",
  pipeline: "data-engineering-pipeline",
  "control-room": "data-infrastructure-recovery",
} as const satisfies Readonly<Record<DataVariant, DataWorkspaceId>>;

const DECISION_BY_VARIANT = {
  experiment: "publish-safe-with-limits",
  pipeline: "isolate-backfill-reconcile",
  "control-room": "isolate-replay-verify-slo",
} as const satisfies Readonly<Record<DataVariant, string>>;

function variantForCourse(courseSlug: string): DataVariant {
  if (courseSlug === "data-science") return "experiment";
  if (courseSlug === "data-engineering-fundamentals") return "pipeline";
  return "control-room";
}

export default function DataLab({
  config,
  locale,
  initialArtifact,
  verificationEnabled = true,
  onMeaningfulInteraction,
  onExecutionReceipt,
  onArtifactChange,
  onVerified,
}: CourseProjectEngineProps) {
  const queryId = useId();
  const noteId = useId();
  const requestEpoch = useRef(0);
  const activeRequest = useRef<ActiveWorkspaceRequest | null>(null);
  const variant = variantForCourse(String(config.courseSlug));
  const workspace = WORKSPACE_BY_VARIANT[variant];
  const expectedReceipt = getCourseProjectExecutionReceipt(config.courseSlug);
  const expectedDecision = DECISION_BY_VARIANT[variant];
  const initialFields =
    initialArtifact?.engineKind === "data" ? initialArtifact.fields : {};
  const defaultPlan =
    variant === "experiment"
      ? "SELECT arm, completion_7d FROM synthetic_experiment EXCLUDE post_completion_score"
      : variant === "pipeline"
        ? "SELECT event_id, depot, event_time, status FROM synthetic_scans DEDUPLICATE event_id"
        : "SELECT partition, backlog, p95_latency, duplicates, hourly_cost FROM synthetic_stream";

  const [query, setQuery] = useState(defaultPlan);
  const [failureInjected, setFailureInjected] = useState(
    initialFields.failureInjected === true,
  );
  const [runState, setRunState] = useState<RunState>("idle");
  const [result, setResult] = useState<SyntheticTerminalResponse | null>(null);
  const [runError, setRunError] = useState("");
  const [restoredExecution, setRestoredExecution] = useState(
    initialFields.executionVerified === true &&
      initialFields.testsPassed === true &&
      initialFields.executionReceipt === expectedReceipt,
  );
  const [decision, setDecision] = useState(
    typeof initialFields.decision === "string" ? initialFields.decision : "",
  );
  const [note, setNote] = useState("");
  const [restoredNoteReady, setRestoredNoteReady] = useState(
    initialFields.noteReady === true,
  );
  const [verified, setVerified] = useState(false);

  const workspaceInputFingerprint = JSON.stringify({
    workspace,
    commands: DATA_WORKSPACE_COMMANDS[workspace],
    query,
    failureInjected,
  });
  const workspaceInputFingerprintRef = useRef(workspaceInputFingerprint);
  workspaceInputFingerprintRef.current = workspaceInputFingerprint;

  const copy =
    locale === "de"
      ? {
          honest:
            "Echter Node-24-Lauf · Sandbox ohne Netz",
          query:
            variant === "experiment"
              ? "Vorregistrierter Analyseplan"
              : variant === "pipeline"
                ? "Deduplizierungs- und Zeitplan"
                : "Telemetrie-Abfrageplan",
          queryHelp:
            "Der Plan bleibt im Browser und wird nur auf Struktur geprüft, nie als SQL ausgeführt. Nur der feste Kurscode und seine Tests laufen.",
          queryValid: "Analysevertrag vollständig",
          queryInvalid:
            "Dem Analysevertrag fehlen Felder oder Ausschlüsse.",
          inject:
            variant === "experiment"
              ? "Leakage und Peeking für den Lauf aktivieren"
              : variant === "pipeline"
                ? "Duplikate und Verspätung für den Lauf aktivieren"
                : "Partition und Rückstau für den Lauf aktivieren",
          injected: "Fehlerfall für den Lauf aktiv",
          execute: "In der Sandbox ausführen",
          executing: "Sandbox wird ausgeführt …",
          unavailable:
            "Keine Ausführung bestätigt. Die Sandbox ist nicht bereit, das Kontingent ist erschöpft oder der Lauf ist fehlgeschlagen.",
          malformed:
            "Keine Ausführung bestätigt. Die Antwort verletzt den Evidenzvertrag.",
          results: "Attestierte Ausführungsergebnisse",
          empty:
            "Noch kein realer Lauf.",
          restored:
            "Ein früherer Ausführungsbeleg ist gespeichert. Für stdout und Testprotokoll erneut ausführen.",
          terminal: "Reales Laufprotokoll",
          decision:
            variant === "experiment"
              ? "Model-Card-Entscheidung"
              : variant === "pipeline"
                ? "Backfill-Runbook"
                : "Recovery-Plan",
          continue:
            variant === "experiment"
              ? "Geleakten +22-pp-Wert veröffentlichen"
              : "Fehler ignorieren und unverändert fortsetzen",
          correct:
            variant === "experiment"
              ? "Sicheren +5-pp-Wert mit seinen Grenzen dokumentieren"
              : variant === "pipeline"
                ? "Isolieren, deduplizieren, backfillen, 102→102-Replay abgleichen"
                : "Isolieren, gezielt wiederholen, 210 ms ohne Verlust prüfen",
          discard:
            variant === "experiment"
              ? "Experiment ohne Begründung verwerfen"
              : "Alle Daten ohne Recovery-Beleg dauerhaft verwerfen",
          note:
            variant === "experiment"
              ? "Model-Card-Grenze mit Messwert und Reproduktionsschritt"
              : variant === "pipeline"
                ? "Backfill-Runbook mit Mengenabgleich"
                : "SLO-, Kosten- und Recovery-Begründung",
          noteHelp:
            "Wird nicht gespeichert und nicht an die Sandbox gesendet.",
          notePlaceholder:
            "Nenne mindestens einen attestierten Messwert und einen Reproduktions- oder Recovery-Schritt.",
          planEvidence: "Begrenzter Analysevertrag festgelegt",
          executionEvidence:
            "Node-Programm und zwei Invariantentests erfolgreich ausgeführt",
          failureEvidence:
            variant === "experiment"
              ? "Sichere und geleakte Metrik verglichen; Leakage und fünf Looks erkannt"
              : variant === "pipeline"
                ? "Duplikate, Late Events, Backfill, Abgleich und idempotenter Replay ausgeführt"
                : "SLO-Bruch und Zero-Loss-Recovery unter 250 ms ausgeführt",
          decisionEvidence: "Entscheidung gewählt",
          noteEvidence:
            "Entscheidung mit Messwert begründet",
          stageEvidence: "Alle fünf Projektphasen abgeschlossen",
          pending:
            "Arbeite die offenen Punkte oben ab.",
          stageLocked:
            "Ausführung belegt. Die finale Verifikation öffnet nach allen fünf Projektphasen.",
          ready: "Ausführung und Entscheidung sind prüfbar.",
          summary:
            variant === "experiment"
              ? "Experiment verifiziert: +5 pp sicher gegen +22 pp geleakt; Leakage und Peeking in der Model Card begrenzt."
              : variant === "pipeline"
                ? "Pipeline verifiziert: 117 Events, 14 Duplikate und 8 Late Events behandelt, Backfill und 102→102-Replay bestanden."
                : "Kontrollraum verifiziert: 684-ms-SLO-Bruch und 210-ms-Recovery ohne Verlust bei 2,4× Incident-Kosten belegt.",
        }
      : {
          honest:
            "Real Node 24 run · sandbox without network",
          query:
            variant === "experiment"
              ? "Pre-registered analysis plan"
              : variant === "pipeline"
                ? "Deduplication and event-time plan"
                : "Telemetry query plan",
          queryHelp:
            "The plan stays in the browser and is only checked for structure, never run as SQL. Only the fixed course code and its tests run.",
          queryValid: "Analysis contract complete",
          queryInvalid:
            "The analysis contract is missing fields or exclusions.",
          inject:
            variant === "experiment"
              ? "Enable leakage and peeking for the run"
              : variant === "pipeline"
                ? "Enable duplicates and lateness for the run"
                : "Enable partition and backlog for the run",
          injected: "Failure case active for the run",
          execute: "Run in sandbox",
          executing: "Running sandbox …",
          unavailable:
            "No execution was confirmed. The sandbox is not ready, its budget is exhausted, or the run failed.",
          malformed:
            "No execution was confirmed. The response broke the evidence contract.",
          results: "Attested execution results",
          empty:
            "No real run yet.",
          restored:
            "A prior execution receipt is stored. Rerun to see stdout and the test transcript.",
          terminal: "Actual run transcript",
          decision:
            variant === "experiment"
              ? "Model-card decision"
              : variant === "pipeline"
                ? "Backfill runbook"
                : "Recovery plan",
          continue:
            variant === "experiment"
              ? "Publish the leaked +22 pp estimate"
              : "Ignore the failure and continue unchanged",
          correct:
            variant === "experiment"
              ? "Document the safe +5 pp value with its limits"
              : variant === "pipeline"
                ? "Isolate, deduplicate, backfill, reconcile the 102→102 replay"
                : "Isolate, replay, verify 210 ms without loss",
          discard:
            variant === "experiment"
              ? "Discard the experiment without a reason"
              : "Permanently discard all data without recovery evidence",
          note:
            variant === "experiment"
              ? "Model-card limitation with metric and reproduction step"
              : variant === "pipeline"
                ? "Backfill runbook with reconciliation"
                : "SLO, cost, and recovery rationale",
          noteHelp:
            "Not saved and not sent to the sandbox.",
          notePlaceholder:
            "Cite at least one attested metric and one reproduction or recovery step.",
          planEvidence: "Bounded analysis contract specified",
          executionEvidence:
            "Node program and two invariant tests executed successfully",
          failureEvidence:
            variant === "experiment"
              ? "Safe and leaked metrics compared; leakage and five looks identified"
              : variant === "pipeline"
                ? "Duplicates, late events, backfill, reconciliation, and idempotent replay executed"
                : "SLO breach and zero-loss recovery below 250 ms executed",
          decisionEvidence: "Decision selected",
          noteEvidence: "Decision justified with a measured value",
          stageEvidence: "All five project stages completed",
          pending:
            "Complete the open items above.",
          stageLocked:
            "Execution evidenced. Final verification unlocks after all five project stages.",
          ready: "The execution and operating decision are auditable.",
          summary:
            variant === "experiment"
              ? "Experiment verified: safe +5 pp against leaked +22 pp; leakage and peeking bounded in the model card."
              : variant === "pipeline"
                ? "Pipeline verified: 117 events, 14 duplicates and 8 late events handled, backfill and 102→102 replay passed."
                : "Control room verified: 684 ms SLO breach and 210 ms zero-loss recovery at 2.4× incident cost evidenced.",
        };

  const queryValidation = useMemo(() => {
    const normalized = query.trim();
    const statementCount = normalized
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean).length;
    const missionTerms =
      variant === "experiment"
        ? /completion_7d/i.test(normalized) &&
          /exclude\s+post_completion_score/i.test(normalized)
        : variant === "pipeline"
          ? /event_id/i.test(normalized) &&
            /deduplicate\s+event_id/i.test(normalized)
          : /backlog/i.test(normalized) &&
            /p95_latency/i.test(normalized) &&
            /hourly_cost/i.test(normalized);
    return (
      normalized.length >= 20 &&
      normalized.length <= 180 &&
      /^select\b/i.test(normalized) &&
      statementCount === 1 &&
      !BLOCKED_QUERY_PATTERN.test(normalized) &&
      missionTerms
    );
  }, [query, variant]);

  const attestation = result?.attestation as
    DataWorkspaceAttestation | undefined;
  const executionVerified = Boolean(attestation) || restoredExecution;
  const testsPassed = Boolean(attestation?.testsPassed) || restoredExecution;
  const failureObserved =
    attestation !== undefined ||
    (restoredExecution && initialFields.failureObserved === true);
  const safeMetricCompared =
    (attestation?.workspace === "data-science-experiment" &&
      attestation.safeEffectPoints === 5 &&
      attestation.leakageInflationPoints === 17) ||
    (restoredExecution && initialFields.safeMetricCompared === true);
  const leakageDetected =
    (attestation?.workspace === "data-science-experiment" &&
      attestation.leakageDetected) ||
    (restoredExecution && initialFields.leakageDetected === true);
  const peekingDetected =
    (attestation?.workspace === "data-science-experiment" &&
      attestation.interimLooks === 5) ||
    (restoredExecution && initialFields.peekingDetected === true);
  const reconciled =
    (attestation?.workspace === "data-engineering-pipeline" &&
      attestation.reconciled) ||
    (restoredExecution && initialFields.reconciled === true);
  const idempotent =
    (attestation?.workspace === "data-engineering-pipeline" &&
      attestation.idempotent) ||
    (restoredExecution && initialFields.idempotent === true);
  const lateBackfilled =
    (attestation?.workspace === "data-engineering-pipeline" &&
      attestation.backfillOutput === 102) ||
    (restoredExecution && initialFields.lateBackfilled === true);
  const sloBreached =
    (attestation?.workspace === "data-infrastructure-recovery" &&
      attestation.sloBreached) ||
    (restoredExecution && initialFields.sloBreached === true);
  const recovered =
    (attestation?.workspace === "data-infrastructure-recovery" &&
      attestation.recovered) ||
    (restoredExecution && initialFields.recovered === true);
  const zeroLoss =
    (attestation?.workspace === "data-infrastructure-recovery" &&
      attestation.dataLoss === 0) ||
    (restoredExecution && initialFields.zeroLoss === true);
  const variantEvidence =
    variant === "experiment"
      ? safeMetricCompared && leakageDetected && peekingDetected
      : variant === "pipeline"
        ? reconciled && idempotent && lateBackfilled
        : sloBreached && recovered && zeroLoss;
  const decisionCorrect = decision === expectedDecision;
  const notePattern =
    variant === "experiment"
      ? /(?:\+?5|\+?22|leak|peek|stop|stopp|reproduc|reproduz)/i
      : variant === "pipeline"
        ? /(?:117|102|14|8|dedup|replay|backfill|reconcil|mengen)/i
        : /(?:684|210|2[,.]4|slo|zero|verlust|loss|replay|recovery|wiederher)/i;
  const noteReady =
    restoredNoteReady || (note.trim().length >= 28 && notePattern.test(note));
  const engineReady =
    queryValidation &&
    failureInjected &&
    executionVerified &&
    testsPassed &&
    failureObserved &&
    variantEvidence &&
    decisionCorrect &&
    noteReady;
  const ready = engineReady && verificationEnabled;

  const artifact = useMemo<CourseProjectArtifactState>(
    () => ({
      version: 1,
      engineKind: "data",
      fields: {
        variant,
        planValid: queryValidation,
        failureInjected,
        executionVerified,
        executionReceipt: executionVerified ? expectedReceipt : null,
        testsPassed,
        failureObserved,
        decision,
        noteReady,
        ...(variant === "experiment"
          ? { safeMetricCompared, leakageDetected, peekingDetected }
          : variant === "pipeline"
            ? { reconciled, idempotent, lateBackfilled }
            : { sloBreached, recovered, zeroLoss }),
      },
    }),
    [
      decision,
      executionVerified,
      expectedReceipt,
      failureInjected,
      failureObserved,
      idempotent,
      lateBackfilled,
      leakageDetected,
      noteReady,
      peekingDetected,
      queryValidation,
      reconciled,
      recovered,
      safeMetricCompared,
      sloBreached,
      testsPassed,
      variant,
      zeroLoss,
    ],
  );

  useEffect(() => {
    onArtifactChange(artifact);
  }, [artifact, onArtifactChange]);

  useEffect(
    () => () => {
      requestEpoch.current += 1;
      activeRequest.current?.controller.abort();
      activeRequest.current = null;
    },
    [],
  );

  function abortWorkspaceRequest() {
    requestEpoch.current += 1;
    activeRequest.current?.controller.abort();
    activeRequest.current = null;
  }

  function invalidateExecution() {
    abortWorkspaceRequest();
    setRunState("idle");
    setResult(null);
    setRunError("");
    setRestoredExecution(false);
    setDecision("");
    setNote("");
    setRestoredNoteReady(false);
    setVerified(false);
  }

  async function runWorkspace() {
    if (
      activeRequest.current !== null ||
      !queryValidation ||
      !failureInjected
    ) {
      return;
    }
    const controller = new AbortController();
    const epoch = requestEpoch.current + 1;
    const fingerprint = workspaceInputFingerprint;
    requestEpoch.current = epoch;
    activeRequest.current = { controller, epoch, fingerprint };
    const requestIsCurrent = () =>
      requestEpoch.current === epoch &&
      activeRequest.current?.epoch === epoch &&
      activeRequest.current.fingerprint === fingerprint &&
      workspaceInputFingerprintRef.current === fingerprint;
    setRunState("loading");
    setResult(null);
    setRunError("");
    setRestoredExecution(false);
    setDecision("");
    setNote("");
    setRestoredNoteReady(false);
    setVerified(false);

    try {
      const response = await fetch("/api/course-workspace/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace,
          commands: DATA_WORKSPACE_COMMANDS[workspace],
        }),
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as unknown;
      if (!requestIsCurrent()) return;
      if (!response.ok) {
        setRunError(copy.unavailable);
        setRunState("error");
        return;
      }
      if (!isVerifiedDataWorkspaceResponse(payload, workspace)) {
        setRunError(copy.malformed);
        setRunState("error");
        return;
      }
      setResult(payload);
      setRunState("success");
      onExecutionReceipt?.(expectedReceipt);
    } catch {
      if (!requestIsCurrent()) return;
      setRunError(copy.unavailable);
      setRunState("error");
    } finally {
      if (activeRequest.current?.epoch === epoch) {
        activeRequest.current = null;
      }
    }
  }

  function verify() {
    if (!ready || verified) return;
    setVerified(true);
    onVerified(copy.summary, artifact);
  }

  return (
    <EngineFrame config={config} locale={locale}>
      <p className="border-l-4 border-brand-orange bg-brand-orange/[0.07] px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide">
        {copy.honest}
      </p>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.28fr)]">
        <section
          aria-labelledby={`${config.id}-data-controls`}
          className="min-w-0 space-y-5"
        >
          <h3 id={`${config.id}-data-controls`} className="sr-only">
            {copy.query}
          </h3>
          <div>
            <label htmlFor={queryId} className="text-sm font-black">
              {copy.query}
            </label>
            <p
              id={`${queryId}-help`}
              className="mt-1 text-xs leading-relaxed text-muted-foreground"
            >
              {copy.queryHelp}
            </p>
            <textarea
              id={queryId}
              aria-describedby={`${queryId}-help ${queryId}-validation`}
              className={`${LAB_INPUT} mt-2 min-h-28 resize-y font-mono`}
              value={query}
              maxLength={180}
              onChange={(event) => {
                onMeaningfulInteraction?.();
                setQuery(event.target.value);
                invalidateExecution();
              }}
            />
            <p
              id={`${queryId}-validation`}
              role="status"
              className={`mt-2 text-xs font-semibold ${queryValidation ? "text-risk-green" : "text-destructive"}`}
            >
              {queryValidation ? copy.queryValid : copy.queryInvalid}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              className={LAB_BUTTON_SECONDARY}
              aria-pressed={failureInjected}
              onClick={() => {
                onMeaningfulInteraction?.();
                setFailureInjected((current) => !current);
                invalidateExecution();
              }}
            >
              {failureInjected ? copy.injected : copy.inject}
            </button>
            <button
              type="button"
              className={LAB_BUTTON}
              disabled={
                !queryValidation || !failureInjected || runState === "loading"
              }
              onClick={() => void runWorkspace()}
            >
              {runState === "loading" ? copy.executing : copy.execute}
            </button>
          </div>

          {runError ? (
            <p
              role="alert"
              className="border-2 border-destructive/50 bg-destructive/5 p-3 text-sm"
            >
              {runError}
            </p>
          ) : null}
        </section>

        <section
          aria-labelledby={`${config.id}-calculated-results`}
          className="min-w-0 border-2 border-foreground/20 bg-background"
        >
          <h3
            id={`${config.id}-calculated-results`}
            className="border-b border-foreground/20 bg-[#e6e0d6] px-4 py-3 font-mono text-xs font-black uppercase tracking-[0.14em] text-[#17130f]"
          >
            {copy.results}
          </h3>
          {!attestation ? (
            <p className="p-5 text-sm text-muted-foreground">
              {restoredExecution ? copy.restored : copy.empty}
            </p>
          ) : (
            <div aria-live="polite" className="min-w-0 p-4">
              {attestation.workspace === "data-science-experiment" ? (
                <>
                  <p className="mb-4 border-2 border-amber-700 bg-amber-50 p-3 text-sm leading-relaxed text-amber-950">
                    {locale === "de"
                      ? "Ausgeführt: Die vorregistrierte Metrik ergibt +5 pp; die Post-Outcome-Leakage bläht sie auf +22 pp auf. Fünf Zwischenanalysen verletzen die Stoppregel."
                      : "Executed: the pre-registered metric yields +5 pp; post-outcome leakage inflates it to +22 pp. Five interim looks violate the stop rule."}
                  </p>
                  <MetricGrid
                    values={[
                      [
                        locale === "de" ? "Kontrolle" : "Control",
                        `${attestation.controlN} · ${attestation.controlRatePct}%`,
                      ],
                      [
                        locale === "de" ? "Treatment sicher" : "Treatment safe",
                        `${attestation.treatmentN} · ${attestation.safeTreatmentRatePct}%`,
                      ],
                      [
                        locale === "de"
                          ? "Treatment geleakt"
                          : "Treatment leaked",
                        `${attestation.leakedTreatmentRatePct}%`,
                      ],
                      [
                        locale === "de" ? "Sicherer Effekt" : "Safe effect",
                        `+${attestation.safeEffectPoints} pp`,
                      ],
                      [
                        locale === "de"
                          ? "Leakage-Aufblähung"
                          : "Leakage inflation",
                        `+${attestation.leakageInflationPoints} pp`,
                      ],
                      [
                        locale === "de" ? "Fehlend / Looks" : "Missing / looks",
                        `${attestation.missingRows} / ${attestation.interimLooks}`,
                      ],
                    ]}
                  />
                </>
              ) : attestation.workspace === "data-engineering-pipeline" ? (
                <>
                  <p className="mb-4 border-2 border-amber-700 bg-amber-50 p-3 text-sm leading-relaxed text-amber-950">
                    {locale === "de"
                      ? "Ausgeführt: 117 Eingänge enthalten 14 Duplikate, 8 Late Events und 1 ungültigen Status. Backfill und Replay enden beide bei 102 eindeutigen Events."
                      : "Executed: 117 inputs contain 14 duplicates, 8 late events, and 1 invalid status. Backfill and replay both end at 102 unique events."}
                  </p>
                  <MetricGrid
                    values={[
                      [
                        locale === "de" ? "Eingang" : "Input",
                        attestation.inputEvents,
                      ],
                      [
                        locale === "de" ? "Akzeptiert" : "Accepted",
                        attestation.acceptedEvents,
                      ],
                      [
                        locale === "de" ? "Duplikate" : "Duplicates",
                        attestation.duplicateEvents,
                      ],
                      [
                        locale === "de" ? "Late Events" : "Late events",
                        attestation.lateEvents,
                      ],
                      [
                        "Run → Backfill",
                        `${attestation.firstOutput} → ${attestation.backfillOutput}`,
                      ],
                      ["Replay", `${attestation.replayOutput} · PASS`],
                    ]}
                  />
                </>
              ) : (
                <>
                  <p className="mb-4 border-2 border-amber-700 bg-amber-50 p-3 text-sm leading-relaxed text-amber-950">
                    {locale === "de"
                      ? "Ausgeführt: Die Partition verletzt mit 684 ms das 250-ms-SLO. Kontrollierter Replay erholt sich auf 210 ms, 0,8 % Duplikate und null Verlust."
                      : "Executed: the partition breaches the 250 ms SLO at 684 ms. Controlled replay recovers to 210 ms, 0.8% duplicates, and zero loss."}
                  </p>
                  <MetricGrid
                    values={[
                      [
                        locale === "de" ? "Spitzenrückstau" : "Peak backlog",
                        attestation.peakBacklog,
                      ],
                      [
                        locale === "de" ? "p95 Störung" : "Failure p95",
                        `${attestation.failureP95Ms} ms`,
                      ],
                      [
                        locale === "de" ? "p95 Recovery" : "Recovery p95",
                        `${attestation.recoveryP95Ms} ms`,
                      ],
                      [
                        locale === "de" ? "Duplikate" : "Duplicates",
                        `${attestation.failureDuplicateRatePct}% → ${attestation.recoveryDuplicateRatePct}%`,
                      ],
                      [
                        locale === "de" ? "Datenverlust" : "Data loss",
                        attestation.dataLoss,
                      ],
                      [
                        locale === "de" ? "Incident-Kosten" : "Incident cost",
                        `${attestation.costMultiple}×`,
                      ],
                    ]}
                  />
                </>
              )}

              <section className="mt-5 min-w-0 border-2 border-foreground bg-[#11100f] text-[#f8f5ee]">
                <h4 className="border-b border-[#f8f5ee]/25 px-4 py-3 font-mono text-xs font-black uppercase tracking-[0.14em] text-[#ffb08a]">
                  {copy.terminal}
                </h4>
                <div
                  role="log"
                  aria-live="polite"
                  className="max-h-72 space-y-4 overflow-auto p-4 font-mono text-xs leading-relaxed"
                >
                  {result?.commands.map((command) => (
                    <div key={command.commandId} className="min-w-0">
                      <p className="break-all font-bold text-[#ffb08a]">
                        $ {command.command} · exit {command.exitCode}
                      </p>
                      <pre className="mt-1 whitespace-pre-wrap break-words text-emerald-300">
                        {command.stdout || "[no stdout]"}
                      </pre>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </section>
      </div>

      <fieldset className="mt-5 min-w-0 border-2 border-foreground/20 p-4">
        <legend className="px-2 font-mono text-xs font-black uppercase tracking-[0.14em]">
          {copy.decision}
        </legend>
        <div className="grid min-w-0 gap-2 md:grid-cols-3">
          {[
            ["continue", copy.continue],
            [expectedDecision, copy.correct],
            ["discard", copy.discard],
          ].map(([value, label]) => (
            <label
              key={value}
              className={`flex min-w-0 cursor-pointer items-start gap-3 border-2 p-3 text-sm leading-relaxed ${
                decision === value
                  ? "border-brand-orange bg-brand-orange/[0.07]"
                  : "border-foreground/15 bg-background"
              }`}
            >
              <input
                type="radio"
                name={`${config.id}-decision`}
                value={value}
                checked={decision === value}
                disabled={!executionVerified}
                className="mt-1 size-4 shrink-0 accent-brand-orange"
                onChange={(event) => {
                  onMeaningfulInteraction?.();
                  setDecision(event.target.value);
                  setVerified(false);
                }}
              />
              <span className="min-w-0 break-words font-semibold">{label}</span>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <label htmlFor={noteId} className="text-sm font-black">
            {copy.note}
          </label>
          <p
            id={`${noteId}-help`}
            className="mt-1 text-xs text-muted-foreground"
          >
            {copy.noteHelp}
          </p>
          <textarea
            id={noteId}
            aria-describedby={`${noteId}-help`}
            className={`${LAB_INPUT} mt-2 min-h-24 resize-y`}
            value={note}
            maxLength={240}
            disabled={!executionVerified}
            placeholder={copy.notePlaceholder}
            onChange={(event) => {
              onMeaningfulInteraction?.();
              setNote(event.target.value);
              setRestoredNoteReady(false);
              setVerified(false);
            }}
          />
        </div>
      </fieldset>

      <VerifyPanel
        locale={locale}
        ready={ready}
        verified={verified}
        onVerify={verify}
        statusDetail={
          engineReady && !verificationEnabled
            ? copy.stageLocked
            : ready
              ? copy.ready
              : copy.pending
        }
        criteria={
          <>
            <EvidenceItem complete={queryValidation}>
              {copy.planEvidence}
            </EvidenceItem>
            <EvidenceItem complete={executionVerified && testsPassed}>
              {copy.executionEvidence}
            </EvidenceItem>
            <EvidenceItem complete={failureObserved && variantEvidence}>
              {copy.failureEvidence}
            </EvidenceItem>
            <EvidenceItem complete={decisionCorrect}>
              {copy.decisionEvidence}
            </EvidenceItem>
            <EvidenceItem complete={noteReady}>
              {copy.noteEvidence}
            </EvidenceItem>
            <EvidenceItem complete={verificationEnabled}>
              {copy.stageEvidence}
            </EvidenceItem>
          </>
        }
      />
    </EngineFrame>
  );
}

function MetricGrid({
  values,
}: {
  readonly values: readonly (readonly [string, string | number])[];
}) {
  return (
    <dl className="grid min-w-0 grid-cols-2 gap-2 lg:grid-cols-3">
      {values.map(([label, value]) => (
        <div key={label} className="border border-foreground/20 p-3">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-1 break-words font-mono text-lg font-black">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
