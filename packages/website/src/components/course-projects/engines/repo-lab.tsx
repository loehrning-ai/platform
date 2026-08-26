"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { VerifiedRepositoryTerminalResponse } from "@/app/api/course-workspace/terminal/types";
import {
  isVerifiedSyntheticTerminalResponse,
  REPOSITORY_TERMINAL_COMMANDS,
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
  LAB_INPUT,
  VerifyPanel,
} from "./engine-ui";

const ALLOWED_COMMANDS = [
  "help",
  "ls",
  "cat AGENTS.md",
  "cat src/retry.ts",
  "git status",
  "codex run",
  "git diff",
  "bun test",
  "bun run typecheck",
  "bun run lint",
  "reset",
] as const;

type AllowedCommand = (typeof ALLOWED_COMMANDS)[number];
type ExecutionMode = "browser" | "sandbox";
type SandboxRunState = "idle" | "loading" | "success" | "error";

interface TerminalEntry {
  id: number;
  command?: string;
  output: string;
  tone?: "normal" | "success" | "warning";
}

type ActiveSandboxRequest = {
  epoch: number;
  fingerprint: string;
  controller: AbortController;
};

function isAllowedCommand(command: string): command is AllowedCommand {
  return (ALLOWED_COMMANDS as readonly string[]).includes(command);
}

export default function RepoLab({
  config,
  locale,
  initialArtifact,
  verificationEnabled = true,
  onMeaningfulInteraction,
  onExecutionReceipt,
  onArtifactChange,
  onVerified,
}: CourseProjectEngineProps) {
  const specId = useId();
  const commandId = useId();
  const entryId = useRef(1);
  const requestEpoch = useRef(0);
  const activeRequest = useRef<ActiveSandboxRequest | null>(null);
  const initialFields =
    initialArtifact?.engineKind === "repo" ? initialArtifact.fields : {};
  const executionReceipt = getCourseProjectExecutionReceipt(config.courseSlug);
  const [spec, setSpec] = useState("");
  const [restoredSpecReady, setRestoredSpecReady] = useState(
    initialFields.specReady === true,
  );
  const [command, setCommand] = useState("");
  const [patched, setPatched] = useState(initialFields.patched === true);
  const [verified, setVerified] = useState(false);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("browser");
  const [sandboxRunState, setSandboxRunState] =
    useState<SandboxRunState>("idle");
  const [restoredSandboxVerified, setRestoredSandboxVerified] = useState(
    initialFields.executionReceipt === executionReceipt &&
      initialFields.sandboxAttested === true &&
      initialFields.attestationContract === "pipeline-quality-v1" &&
      initialFields.workspace === "pipeline-quality" &&
      initialFields.commandSequence === "canonical",
  );
  const [sandboxResult, setSandboxResult] =
    useState<VerifiedRepositoryTerminalResponse | null>(null);
  const [sandboxError, setSandboxError] = useState("");
  const [entries, setEntries] = useState<TerminalEntry[]>([
    {
      id: 0,
      output:
        locale === "de"
          ? "Synthetisches Repository bereit. `help` zeigt alle erlaubten Befehle."
          : "Synthetic repository ready. `help` lists every allowed command.",
    },
  ]);

  const sandboxInputFingerprint = JSON.stringify({
    workspace: "pipeline-quality",
    commands: REPOSITORY_TERMINAL_COMMANDS,
    spec,
    executionMode,
  });
  const sandboxInputFingerprintRef = useRef(sandboxInputFingerprint);
  sandboxInputFingerprintRef.current = sandboxInputFingerprint;

  const copy =
    locale === "de"
      ? {
          engine: "Repository-Labor",
          synthetic:
            "Browser-Simulation eines synthetischen Repositorys · keine Betriebssystem-Shell",
          mode: "Ausführungsmodus",
          browserMode: "Browser-Simulation",
          browserDetail:
            "Sofort verfügbar. Befehle verändern nur den lokalen Übungszustand im Browser.",
          sandboxMode: "Isolierter echter Lauf",
          sandboxDetail:
            "Startet bei Freigabe eine kurzlebige Node-24-microVM mit gesperrtem Netzwerk und ausschließlich synthetischen Dateien.",
          sandboxTitle: "Echte Sandbox-Ausführung",
          sandboxBoundary:
            "Feste Sequenz, keine freie Shell: Ausgangslauf → fehlschlagender Test → begrenzter Fix → grüner Test → echter Git-Diff.",
          sandboxRun: "Isolierten Lauf starten",
          sandboxRunning: "Isolierte microVM läuft …",
          sandboxUnavailable:
            "Echte Sandbox nicht verfügbar. Es wurde kein Befehl simuliert. Die Browser-Simulation bleibt separat verfügbar.",
          sandboxMalformed:
            "Die Sandbox-Antwort war ungültig. Es wird keine Ausgabe erfunden.",
          sandboxResult: "Echte Befehlsausgabe",
          sandboxDiff: "Echter Git-Diff",
          sandboxRuntime:
            "Node 24 · Netzwerk deny-all · nicht persistent · synthetischer Arbeitsbereich",
          spec: "Editierbarer AGENTS.md-Auftrag",
          specHelp:
            "Beschreibe gewünschtes Verhalten und ein prüfbares Akzeptanzkriterium.",
          specPlaceholder:
            "Scope: src/retry.ts. Nicht-Ziel: öffentliche API ändern. Akzeptanz: exponentieller Backoff, idempotenter Schlüssel, Test/Typecheck/Lint grün.",
          terminal: "Befehlsterminal",
          command: "Erlaubten Befehl eingeben",
          commandPlaceholder: "help",
          runCommand: "Befehl ausführen",
          allowlist: "Nur exakt diese Befehle werden interpretiert:",
          file: "Virtuelle Datei: src/retry.ts",
          unpatched:
            "export async function retry(job: Job) {\n  return send(job); // retries immediately; duplicate side effects\n}",
          patched:
            "export async function retry(job: Job, attempt: number) {\n  const key = `${job.id}:${attempt}`;\n  return sendOnce(key, job, 2 ** attempt * 100);\n}",
          specEvidence: "Spezifikation mit Verhalten und Akzeptanzkriterium",
          patchEvidence: "Deterministischer Patch mit `codex run` erzeugt",
          testEvidence: "Synthetische Tests nach dem Patch ausgeführt",
          typeEvidence: "Typecheck nach dem Patch ausgeführt",
          lintEvidence: "Lint nach dem Patch ausgeführt",
          diffEvidence: "Diff nach dem Patch inspiziert",
          pending:
            "Abnahme gesperrt: Task-Spec, alle fünf Projektphasen und eine vollständig attestierte echte Sandbox-Sequenz sind erforderlich. Browser-Simulation zählt nicht.",
          ready:
            "Task-Spec und vollständig attestierte echte Sandbox-Sequenz sind belegt.",
          browserNonVerifying:
            "Übungsmodus. Synthetische In-Browser-Ausgaben und grüne Statusmarken sind keine Abnahme-Evidenz.",
          sandboxEvidence:
            "Attestierte Sequenz: Baseline, erwarteter Fehlschlag, begrenzter Fix, grüner Wiederholungstest, Quellprüfung, Diff-Prüfung und begrenzter Git-Diff",
          stageEvidence: "Alle fünf Projektphasen abgeschlossen",
          summary:
            "Repository-Labor verifiziert: Task-Spec und vollständig attestierte isolierte Sandbox-Sequenz mit erwartetem roten/grünen Testlauf, Quellprüfung und begrenztem Diff.",
        }
      : {
          engine: "Repository lab",
          synthetic:
            "Browser simulation of a synthetic repository · no operating-system shell",
          mode: "Execution mode",
          browserMode: "Browser simulation",
          browserDetail:
            "Always available. Commands modify only the local exercise state in this browser.",
          sandboxMode: "Isolated real run",
          sandboxDetail:
            "When enabled, starts a short-lived Node 24 microVM with deny-all networking and synthetic files only.",
          sandboxTitle: "Real sandbox execution",
          sandboxBoundary:
            "Fixed sequence, no free shell: baseline → failing test → bounded fix → passing test → actual Git diff.",
          sandboxRun: "Start isolated run",
          sandboxRunning: "Isolated microVM running …",
          sandboxUnavailable:
            "Real sandbox unavailable. No command was simulated. The browser simulation remains a separate fallback.",
          sandboxMalformed:
            "The sandbox response was invalid. No output is being invented.",
          sandboxResult: "Actual command output",
          sandboxDiff: "Actual Git diff",
          sandboxRuntime:
            "Node 24 · network deny-all · non-persistent · synthetic workspace",
          spec: "Editable AGENTS.md task contract",
          specHelp:
            "Describe the intended behavior and a testable acceptance criterion.",
          specPlaceholder:
            "Scope: src/retry.ts. Non-goal: change the public API. Acceptance: exponential backoff, idempotency key, test/typecheck/lint pass.",
          terminal: "Command terminal",
          command: "Enter an allowed command",
          commandPlaceholder: "help",
          runCommand: "Run command",
          allowlist: "Only these exact commands are interpreted:",
          file: "Virtual file: src/retry.ts",
          unpatched:
            "export async function retry(job: Job) {\n  return send(job); // retries immediately; duplicate side effects\n}",
          patched:
            "export async function retry(job: Job, attempt: number) {\n  const key = `${job.id}:${attempt}`;\n  return sendOnce(key, job, 2 ** attempt * 100);\n}",
          specEvidence:
            "Specification includes behavior and an acceptance criterion",
          patchEvidence: "Deterministic patch created with `codex run`",
          testEvidence: "Synthetic tests run after the patch",
          typeEvidence: "Type check run after the patch",
          lintEvidence: "Lint run after the patch",
          diffEvidence: "Post-patch diff inspected",
          pending:
            "Acceptance locked: the task spec, all five project stages, and one fully attested real Sandbox sequence are required. Browser simulation does not count.",
          ready:
            "The task spec and fully attested real Sandbox sequence are evidenced.",
          browserNonVerifying:
            "Practice mode. Synthetic in-browser output and green status marks are not acceptance evidence.",
          sandboxEvidence:
            "Attested sequence: baseline, expected failure, bounded fix, passing rerun, source check, diff check, and scoped Git diff",
          stageEvidence: "All five project stages completed",
          summary:
            "Repository lab verified: task spec plus a fully attested isolated Sandbox sequence with expected red/green tests, source check, and scoped diff.",
        };

  const normalizedSpec = spec.trim().toLowerCase();
  const specReady =
    restoredSpecReady ||
    (spec.trim().length >= 40 &&
      /(akzeptanz|acceptance)/i.test(normalizedSpec) &&
      /(scope)/i.test(normalizedSpec) &&
      /(nicht-ziel|non-goal)/i.test(normalizedSpec));
  const sandboxVerified =
    restoredSandboxVerified ||
    (sandboxRunState === "success" && sandboxResult !== null);
  const ready = verificationEnabled && specReady && sandboxVerified;
  const artifact = useMemo<CourseProjectArtifactState>(
    () => ({
      version: 1,
      engineKind: "repo",
      fields: {
        specReady,
        executionReceipt: sandboxVerified ? executionReceipt : null,
        sandboxAttested: sandboxVerified,
        attestationContract: sandboxVerified
          ? (sandboxResult?.attestation.contract ?? "pipeline-quality-v1")
          : null,
        workspace: sandboxVerified
          ? (sandboxResult?.workspace ?? "pipeline-quality")
          : null,
        commandSequence: sandboxVerified ? "canonical" : null,
        baselineFailed: sandboxVerified,
        postfixPassed: sandboxVerified,
        checksPassed: sandboxVerified,
        diffScoped: sandboxVerified,
      },
    }),
    [executionReceipt, sandboxResult, sandboxVerified, specReady],
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

  function abortSandboxRequest() {
    requestEpoch.current += 1;
    activeRequest.current?.controller.abort();
    activeRequest.current = null;
  }

  function appendEntry(entry: Omit<TerminalEntry, "id">) {
    const next = { ...entry, id: entryId.current++ };
    setEntries((current) => [...current.slice(-11), next]);
  }

  function resetRepository() {
    abortSandboxRequest();
    setSpec("");
    setRestoredSpecReady(false);
    setPatched(false);
    setVerified(false);
    setSandboxResult(null);
    setRestoredSandboxVerified(false);
    setSandboxRunState("idle");
    setSandboxError("");
    setEntries([
      {
        id: entryId.current++,
        command: "reset",
        output:
          locale === "de"
            ? "Repository, Spezifikation und Evidenz wurden auf den Ausgangszustand gesetzt."
            : "Repository, specification, and evidence were restored to the initial state.",
      },
    ]);
  }

  async function runSandboxWorkflow() {
    if (activeRequest.current !== null) return;

    const controller = new AbortController();
    const epoch = requestEpoch.current + 1;
    const fingerprint = sandboxInputFingerprint;
    requestEpoch.current = epoch;
    activeRequest.current = { controller, epoch, fingerprint };
    const requestIsCurrent = () =>
      requestEpoch.current === epoch &&
      activeRequest.current?.epoch === epoch &&
      activeRequest.current.fingerprint === fingerprint &&
      sandboxInputFingerprintRef.current === fingerprint;
    setSandboxRunState("loading");
    setSandboxResult(null);
    setRestoredSandboxVerified(false);
    setSandboxError("");

    try {
      const response = await fetch("/api/course-workspace/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace: "pipeline-quality",
          commands: REPOSITORY_TERMINAL_COMMANDS,
        }),
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as unknown;
      if (!requestIsCurrent()) return;
      if (!response.ok) {
        setSandboxError(copy.sandboxUnavailable);
        setSandboxRunState("error");
        return;
      }
      if (!isVerifiedSyntheticTerminalResponse(payload)) {
        setSandboxError(copy.sandboxMalformed);
        setSandboxRunState("error");
        return;
      }
      setSandboxResult(payload);
      setSandboxRunState("success");
      setVerified(false);
      onExecutionReceipt?.(executionReceipt);
    } catch {
      if (!requestIsCurrent()) return;
      setSandboxError(copy.sandboxUnavailable);
      setSandboxRunState("error");
    } finally {
      if (activeRequest.current?.epoch === epoch) {
        activeRequest.current = null;
      }
    }
  }

  function executeCommand(rawCommand: string) {
    const normalizedInput = rawCommand
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
    const normalized =
      normalizedInput === "cat agents.md" ? "cat AGENTS.md" : normalizedInput;
    setCommand("");

    if (!isAllowedCommand(normalized)) {
      appendEntry({
        command: rawCommand.trim() || "-",
        output:
          locale === "de"
            ? "Abgelehnt: Der Befehl steht nicht auf der lokalen Allowlist."
            : "Rejected: command is not on the local allowlist.",
        tone: "warning",
      });
      return;
    }

    if (normalized === "reset") {
      onMeaningfulInteraction?.();
      resetRepository();
      return;
    }

    if (normalized === "help") {
      appendEntry({ command: normalized, output: ALLOWED_COMMANDS.join("\n") });
      return;
    }

    if (normalized === "ls") {
      appendEntry({
        command: normalized,
        output:
          "AGENTS.md\nREADME.md\nsrc/\n  retry.ts\ntests/\n  retry.test.ts",
      });
      return;
    }

    if (normalized === "cat AGENTS.md") {
      appendEntry({
        command: normalized,
        output:
          spec || "# queue-kit\nComplete the editable task contract first.",
      });
      return;
    }

    if (normalized === "cat src/retry.ts") {
      appendEntry({
        command: normalized,
        output: patched ? copy.patched : copy.unpatched,
      });
      return;
    }

    if (normalized === "git status") {
      appendEntry({
        command: normalized,
        output: patched
          ? "modified: src/retry.ts\nmodified: tests/retry.test.ts"
          : locale === "de"
            ? "Arbeitsverzeichnis unverändert"
            : "working tree clean",
      });
      return;
    }

    if (normalized === "codex run") {
      if (!specReady) {
        appendEntry({
          command: normalized,
          output:
            locale === "de"
              ? "Patch blockiert: Spezifikation und Akzeptanzkriterium vervollständigen."
              : "Patch blocked: complete the specification and acceptance criterion.",
          tone: "warning",
        });
        return;
      }
      onMeaningfulInteraction?.();
      setPatched(true);
      setVerified(false);
      appendEntry({
        command: normalized,
        output:
          locale === "de"
            ? "Deterministischer Übungspatch angewendet: 2 Dateien geändert."
            : "Deterministic exercise patch applied: 2 files changed.",
        tone: "success",
      });
      return;
    }

    if (normalized === "git diff") {
      if (!patched) {
        appendEntry({
          command: normalized,
          output:
            locale === "de" ? "Kein Diff vorhanden." : "No diff available.",
          tone: "warning",
        });
        return;
      }
      onMeaningfulInteraction?.();
      appendEntry({
        command: normalized,
        output:
          '- return send(job);\n+ const key = `${job.id}:${attempt}`;\n+ const delayMs = 2 ** attempt * 100;\n+ return sendOnce(key, job, delayMs);\n+ test("replay has one side effect", ...);',
        tone: "success",
      });
      return;
    }

    if (!patched) {
      appendEntry({
        command: normalized,
        output:
          locale === "de"
            ? "Tests nicht gewertet: Es wurde noch kein Übungspatch erzeugt."
            : "Tests not counted: no exercise patch has been created.",
        tone: "warning",
      });
      return;
    }

    onMeaningfulInteraction?.();
    appendEntry({
      command: normalized,
      output:
        locale === "de"
          ? `${normalized}: Exit 0 · synthetischer In-Browser-Check`
          : `${normalized}: exit 0 · synthetic in-browser check`,
      tone: "success",
    });
  }

  function verify() {
    if (!ready || verified) return;
    setVerified(true);
    onVerified(copy.summary, artifact);
  }

  return (
    <EngineFrame config={config} locale={locale} engineLabel={copy.engine}>
      <fieldset className="border-2 border-foreground/20 bg-background p-3">
        <legend className="px-2 font-mono text-xs font-black uppercase tracking-[0.14em]">
          {copy.mode}
        </legend>
        <div className="grid min-w-0 gap-2 md:grid-cols-2">
          {(
            [
              ["browser", copy.browserMode, copy.browserDetail],
              ["sandbox", copy.sandboxMode, copy.sandboxDetail],
            ] as const
          ).map(([mode, label, detail]) => (
            <label
              key={mode}
              className="flex min-w-0 cursor-pointer items-start gap-3 border-2 border-foreground/15 p-3"
            >
              <input
                type="radio"
                name={`${config.id}-execution-mode`}
                value={mode}
                checked={executionMode === mode}
                className="mt-1 size-4 shrink-0 accent-brand-orange"
                onChange={() => {
                  abortSandboxRequest();
                  setRestoredSandboxVerified(false);
                  setSandboxResult(null);
                  setSandboxRunState("idle");
                  setSandboxError("");
                  setVerified(false);
                  setExecutionMode(mode);
                }}
              />
              <span className="min-w-0">
                <span className="block text-sm font-black">{label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {detail}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {executionMode === "browser" ? (
        <>
          <p className="mt-4 border-l-4 border-brand-orange bg-brand-orange/[0.07] px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide">
            {copy.synthetic}
          </p>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-muted-foreground">
            {copy.browserNonVerifying}
          </p>

          <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(17rem,0.78fr)_minmax(0,1.22fr)]">
            <div className="min-w-0 space-y-5">
              <div>
                <label htmlFor={specId} className="text-sm font-black">
                  {copy.spec}
                </label>
                <p
                  id={`${specId}-help`}
                  className="mt-1 text-xs leading-relaxed text-muted-foreground"
                >
                  {copy.specHelp}
                </p>
                <textarea
                  id={specId}
                  aria-describedby={`${specId}-help`}
                  className={`${LAB_INPUT} mt-2 min-h-36 resize-y`}
                  value={spec}
                  maxLength={220}
                  placeholder={copy.specPlaceholder}
                  onChange={(event) => {
                    onMeaningfulInteraction?.();
                    abortSandboxRequest();
                    setSpec(event.target.value);
                    setRestoredSpecReady(false);
                    setPatched(false);
                    setVerified(false);
                    setSandboxResult(null);
                    setRestoredSandboxVerified(false);
                    setSandboxRunState("idle");
                    setSandboxError("");
                  }}
                />
              </div>

              <section className="min-w-0 border-2 border-foreground/20">
                <h3
                  id={`${config.id}-virtual-file`}
                  className="border-b border-foreground/20 bg-[#e6e0d6] px-3 py-2 font-mono text-xs font-black uppercase tracking-wide text-[#17130f]"
                >
                  {copy.file}
                </h3>
                <pre
                  tabIndex={0}
                  role="region"
                  aria-label={copy.file}
                  className="max-w-full overflow-x-auto whitespace-pre p-3 font-mono text-xs leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-inset"
                >
                  {patched ? copy.patched : copy.unpatched}
                </pre>
              </section>
            </div>

            <section
              aria-labelledby={`${config.id}-terminal`}
              className="min-w-0 border-2 border-foreground bg-[#11100f] text-[#f8f5ee]"
            >
              <header className="border-b border-[#f8f5ee]/25 px-4 py-3">
                <h3
                  id={`${config.id}-terminal`}
                  className="font-mono text-xs font-black uppercase tracking-[0.14em] text-[#ffb08a]"
                >
                  {copy.terminal}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#d7d0c4]">
                  {copy.allowlist} {ALLOWED_COMMANDS.join(" · ")}
                </p>
              </header>

              <div
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                className="h-80 min-w-0 space-y-4 overflow-auto p-4 font-mono text-xs leading-relaxed"
              >
                {entries.map((entry) => (
                  <div key={entry.id} className="min-w-0">
                    {entry.command ? (
                      <p className="break-all font-bold text-[#ffb08a]">
                        $ {entry.command}
                      </p>
                    ) : null}
                    <pre
                      className={`mt-1 whitespace-pre-wrap break-words font-mono ${
                        entry.tone === "success"
                          ? "text-emerald-300"
                          : entry.tone === "warning"
                            ? "text-amber-200"
                            : "text-[#f8f5ee]"
                      }`}
                    >
                      {entry.output}
                    </pre>
                  </div>
                ))}
              </div>

              <form
                className="min-w-0 border-t border-[#f8f5ee]/25 p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  executeCommand(command);
                }}
              >
                <label htmlFor={commandId} className="sr-only">
                  {copy.command}
                </label>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                  <input
                    id={commandId}
                    className={`${LAB_INPUT} border-[#f8f5ee]/40 bg-[#1c1a18] font-mono text-[#f8f5ee] placeholder:text-[#aaa195] focus:border-[#ffb08a] sm:flex-1`}
                    value={command}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={copy.commandPlaceholder}
                    onChange={(event) => setCommand(event.target.value)}
                  />
                  <button type="submit" className={`${LAB_BUTTON} shrink-0`}>
                    {copy.runCommand}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </>
      ) : (
        <section className="mt-5 min-w-0 border-2 border-foreground bg-[#11100f] p-4 text-[#f8f5ee]">
          <h3 className="font-mono text-xs font-black uppercase tracking-[0.14em] text-[#ffb08a]">
            {copy.sandboxTitle}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#d7d0c4]">
            {copy.sandboxBoundary}
          </p>
          <p className="mt-2 font-mono text-xs uppercase tracking-wide text-[#aaa195]">
            {copy.sandboxRuntime}
          </p>
          <button
            type="button"
            className={`${LAB_BUTTON} mt-4`}
            disabled={sandboxRunState === "loading"}
            onClick={() => void runSandboxWorkflow()}
          >
            {sandboxRunState === "loading"
              ? copy.sandboxRunning
              : copy.sandboxRun}
          </button>

          <div aria-live="polite" aria-busy={sandboxRunState === "loading"}>
            {sandboxRunState === "error" ? (
              <p
                role="alert"
                className="mt-4 border-l-2 border-destructive pl-3 text-sm text-destructive"
              >
                {sandboxError}
              </p>
            ) : null}
            {sandboxResult ? (
              <div className="mt-5 min-w-0 space-y-5">
                <div>
                  <h4 className="font-mono text-xs font-black uppercase tracking-wide text-[#ffb08a]">
                    {copy.sandboxResult}
                  </h4>
                  <div className="mt-2 max-h-[30rem] min-w-0 space-y-4 overflow-auto border border-[#f8f5ee]/25 p-3 font-mono text-xs">
                    {sandboxResult.commands.map((result, index) => (
                      <div
                        key={`${result.command}-${index}`}
                        className="min-w-0"
                      >
                        <p className="break-all font-bold text-[#ffb08a]">
                          $ {result.command} · exit {result.exitCode}
                        </p>
                        {result.stdout ? (
                          <pre className="mt-1 whitespace-pre-wrap break-words text-[#f8f5ee]">
                            {result.stdout}
                          </pre>
                        ) : null}
                        {result.stderr ? (
                          <pre className="mt-1 whitespace-pre-wrap break-words text-amber-200">
                            {result.stderr}
                          </pre>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-mono text-xs font-black uppercase tracking-wide text-[#ffb08a]">
                    {copy.sandboxDiff}
                  </h4>
                  <pre
                    tabIndex={0}
                    role="region"
                    aria-label={copy.sandboxDiff}
                    className="mt-2 max-h-80 max-w-full overflow-auto whitespace-pre-wrap break-words border-l-2 border-emerald-500 pl-3 font-mono text-xs text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb08a]"
                  >
                    {sandboxResult.diff}
                  </pre>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      <VerifyPanel
        locale={locale}
        ready={ready}
        verified={verified}
        onVerify={verify}
        statusDetail={ready ? copy.ready : copy.pending}
        criteria={
          <>
            <EvidenceItem complete={specReady}>
              {copy.specEvidence}
            </EvidenceItem>
            <EvidenceItem complete={sandboxVerified}>
              {copy.sandboxEvidence}
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
