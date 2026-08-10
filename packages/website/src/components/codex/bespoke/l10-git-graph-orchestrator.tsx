"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";

/**
 * L10 bespoke interactive — "Git graph orchestrator".
 * Ported from `codex/js/lessons/L10.js` (functional parity; the source's
 * animated SVG commit graph is simplified to a status list — the graded
 * interaction is launching all three tasks and resolving the T2/T3 merge
 * conflict, not the graph drawing).
 *
 * Three tasks launch independently, each incrementing a commit counter on
 * an interval (cleared on unmount, mirroring the source's own
 * `clearInterval`). Once T2 and T3 both finish, a merge-conflict panel
 * appears; resolving it (either path) unblocks completion. The checkpoint
 * awards once all three tasks are done and the conflict is resolved.
 */

interface TaskDef {
  readonly id: "t1" | "t2" | "t3";
  readonly label: Readonly<Record<Locale, string>>;
  readonly note: Readonly<Record<Locale, string>>;
  readonly commits: number;
  readonly durationMs: number;
}

const TASKS: readonly TaskDef[] = [
  {
    id: "t1",
    label: {
      en: "T1: add health endpoint",
      de: "T1: Status-Endpunkt ergänzen",
    },
    note: { en: "independent endpoint", de: "unabhängiger Endpunkt" },
    commits: 3,
    durationMs: 600,
  },
  {
    id: "t2",
    label: { en: "T2: refactor logger", de: "T2: Logger refaktorieren" },
    note: { en: "owns shared logger", de: "ändert gemeinsamen Logger" },
    commits: 8,
    durationMs: 1600,
  },
  {
    id: "t3",
    label: {
      en: "T3: typed config loader",
      de: "T3: typisierter Konfigurationslader",
    },
    note: { en: "also imports logger", de: "importiert ebenfalls Logger" },
    commits: 6,
    durationMs: 1500,
  },
];

type TaskStatus = "queued" | "inprogress" | "done";

interface L10GitGraphOrchestratorProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly locale?: Locale;
}

const COPY: Record<
  Locale,
  {
    readonly eyebrow: string;
    readonly ready: string;
    readonly inProgress: string;
    readonly commits: string;
    readonly completed: string;
    readonly allCompleted: string;
    readonly mergeConflict: string;
    readonly rebase: string;
    readonly keep: string;
    readonly conflictRebased: string;
    readonly conflictKept: string;
    readonly done: string;
    readonly launch: string;
  }
> = {
  en: {
    eyebrow: "◆ Exercise · Concurrent task integration",
    ready: "Ready",
    inProgress: "in-progress",
    commits: "progress steps",
    completed: "completed.",
    allCompleted:
      "Task simulations complete; the shared-file conflict was resolved explicitly.",
    mergeConflict: "Merge Conflict",
    rebase: "Rebase T3 on T2",
    keep: "Keep T3",
    conflictRebased: "Conflict resolved: T3 rebased on T2.",
    conflictKept: "Conflict resolved: kept T3 (logger.info).",
    done: "Done",
    launch: "Launch",
  },
  de: {
    eyebrow: "◆ Interaktiv · Git-Graph-Koordination",
    ready: "Bereit",
    inProgress: "läuft",
    commits: "Fortschrittsschritte",
    completed: "abgeschlossen.",
    allCompleted:
      "Aufgabensimulationen abgeschlossen; der Konflikt an der gemeinsamen Datei wurde ausdrücklich gelöst.",
    mergeConflict: "Merge-Konflikt",
    rebase: "T3 auf T2 rebasen",
    keep: "T3 behalten",
    conflictRebased: "Konflikt gelöst: T3 wurde auf T2 rebased.",
    conflictKept: "Konflikt gelöst: T3 wurde beibehalten (logger.info).",
    done: "Fertig",
    launch: "Starten",
  },
};

export function L10GitGraphOrchestrator({
  lessonId,
  cpId,
  locale = "en",
}: L10GitGraphOrchestratorProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const copy = COPY[locale];
  const [status, setStatus] = useState<Record<TaskDef["id"], TaskStatus>>({
    t1: "queued",
    t2: "queued",
    t3: "queued",
  });
  const [commitCounts, setCommitCounts] = useState<
    Record<TaskDef["id"], number>
  >({
    t1: 0,
    t2: 0,
    t3: 0,
  });
  const [conflictVisible, setConflictVisible] = useState(false);
  const [conflictResolved, setConflictResolved] = useState(false);
  const [statusLine, setStatusLine] = useState(copy.ready);
  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(
    new Map(),
  );

  useEffect(() => {
    const intervals = intervalsRef.current;
    return () => {
      for (const id of intervals.values()) clearInterval(id);
      intervals.clear();
    };
  }, []);

  const allDone = TASKS.every((task) => status[task.id] === "done");

  useEffect(() => {
    if (status.t2 === "done" && status.t3 === "done" && !conflictResolved) {
      setConflictVisible(true);
    }
  }, [conflictResolved, status.t2, status.t3]);

  useEffect(() => {
    if (allDone && conflictResolved) {
      setStatusLine(copy.allCompleted);
      if (!done) complete();
    }
  }, [allDone, complete, conflictResolved, copy.allCompleted, done]);

  const launch = (task: TaskDef) => {
    setStatus((prev) => ({ ...prev, [task.id]: "inprogress" }));
    setStatusLine(
      `${task.id.toUpperCase()}: ${copy.inProgress}… 0 ${copy.commits}`,
    );
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setCommitCounts((prev) => ({ ...prev, [task.id]: count }));
      setStatusLine(
        `${task.id.toUpperCase()}: ${copy.inProgress}… ${count} ${copy.commits}`,
      );
      if (count >= task.commits) {
        clearInterval(interval);
        intervalsRef.current.delete(task.id);
        setStatusLine(`${task.id.toUpperCase()}: ${copy.completed}`);
        setStatus((prev) => ({ ...prev, [task.id]: "done" as TaskStatus }));
      }
    }, task.durationMs / task.commits);
    intervalsRef.current.set(task.id, interval);
  };

  const resolveConflict = (message: string) => {
    setConflictResolved(true);
    setConflictVisible(false);
    setStatusLine(message);
  };

  return (
    <div className="min-w-0 max-w-full border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        {copy.eyebrow}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {TASKS.map((task) => (
          <div
            key={task.id}
            className="min-w-0 border-2 border-border bg-background p-3 text-center"
          >
            <p className="break-words font-mono text-[12px] font-bold text-foreground">
              {task.label[locale]}
            </p>
            <p className="font-mono text-[10.5px] text-muted-foreground">
              {task.note[locale]}
            </p>
            <button
              type="button"
              onClick={() => launch(task)}
              disabled={status[task.id] !== "queued"}
              className="mt-2 border-2 border-foreground bg-brand-orange px-3 py-1 font-mono text-[11px] font-bold uppercase text-white transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status[task.id] === "done"
                ? copy.done
                : status[task.id] === "inprogress"
                  ? `${commitCounts[task.id]}/${task.commits}`
                  : copy.launch}
            </button>
          </div>
        ))}
      </div>

      {conflictVisible && (
        <div className="mt-4 border-2 border-brand-amber bg-brand-amber/10 p-4">
          <h3 className="font-mono text-[13px] font-bold text-foreground">
            {copy.mergeConflict}
          </h3>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-[11.5px] text-foreground">
            {"<<<<<<< T2\nlog.info\n=======\nlogger.info\n>>>>>>> T3"}
          </pre>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => resolveConflict(copy.conflictRebased)}
              className="min-w-0 break-words border-2 border-foreground bg-background px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-foreground hover:border-brand-orange"
            >
              {copy.rebase}
            </button>
            <button
              type="button"
              onClick={() => resolveConflict(copy.conflictKept)}
              className="min-w-0 break-words border-2 border-foreground bg-background px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-foreground hover:border-brand-orange"
            >
              {copy.keep}
            </button>
          </div>
        </div>
      )}

      <p
        className={cn(
          "mt-4 border-t border-border pt-3 text-center font-mono text-[12px]",
          allDone && conflictResolved
            ? "font-bold text-risk-green"
            : "text-muted-foreground",
        )}
      >
        {statusLine} {allDone && conflictResolved && done ? "✓" : ""}
      </p>
    </div>
  );
}

export default L10GitGraphOrchestrator;
