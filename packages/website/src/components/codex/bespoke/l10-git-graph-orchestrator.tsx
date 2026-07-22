"use client";

import { useEffect, useRef, useState, type JSX } from "react";
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
  readonly label: string;
  readonly note: string;
  readonly commits: number;
  readonly durationMs: number;
}

const TASKS: readonly TaskDef[] = [
  { id: "t1", label: "T1: add health endpoint", note: "(tiny, 2 min)", commits: 3, durationMs: 600 },
  { id: "t2", label: "T2: refactor logger", note: "(medium, 6 min)", commits: 8, durationMs: 1600 },
  { id: "t3", label: "T3: typed config loader", note: "(medium, 5 min)", commits: 6, durationMs: 1500 },
];

type TaskStatus = "queued" | "inprogress" | "done";

interface L10GitGraphOrchestratorProps {
  readonly lessonId: string;
  readonly cpId: string;
}

export function L10GitGraphOrchestrator({
  lessonId,
  cpId,
}: L10GitGraphOrchestratorProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [status, setStatus] = useState<Record<TaskDef["id"], TaskStatus>>({
    t1: "queued",
    t2: "queued",
    t3: "queued",
  });
  const [commitCounts, setCommitCounts] = useState<Record<TaskDef["id"], number>>({
    t1: 0,
    t2: 0,
    t3: 0,
  });
  const [conflictVisible, setConflictVisible] = useState(false);
  const [conflictResolved, setConflictResolved] = useState(false);
  const [statusLine, setStatusLine] = useState("Ready");
  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  useEffect(() => {
    const intervals = intervalsRef.current;
    return () => {
      for (const id of intervals.values()) clearInterval(id);
      intervals.clear();
    };
  }, []);

  const checkAllDone = (nextStatus: Record<TaskDef["id"], TaskStatus>, resolved: boolean) => {
    const allDone = TASKS.every((t) => nextStatus[t.id] === "done");
    if (allDone && resolved) {
      setStatusLine("All tasks completed! 3 agents, 17 commits, 1 conflict resolved.");
      complete();
    }
  };

  const launch = (task: TaskDef) => {
    setStatus((prev) => ({ ...prev, [task.id]: "inprogress" }));
    setStatusLine(`${task.id.toUpperCase()}: in-progress… 0 commits`);
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setCommitCounts((prev) => ({ ...prev, [task.id]: count }));
      setStatusLine(`${task.id.toUpperCase()}: in-progress… ${count} commits`);
      if (count >= task.commits) {
        clearInterval(interval);
        intervalsRef.current.delete(task.id);
        setStatus((prev) => {
          const next = { ...prev, [task.id]: "done" as TaskStatus };
          setStatusLine(`${task.id.toUpperCase()}: completed.`);
          if (next.t2 === "done" && next.t3 === "done" && !conflictResolved) {
            setConflictVisible(true);
          }
          checkAllDone(next, conflictResolved);
          return next;
        });
      }
    }, task.durationMs / task.commits);
    intervalsRef.current.set(task.id, interval);
  };

  const resolveConflict = (message: string) => {
    setConflictResolved(true);
    setConflictVisible(false);
    setStatusLine(message);
    setStatus((prev) => {
      checkAllDone(prev, true);
      return prev;
    });
  };

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        ◆ Bespoke · Git graph orchestrator
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {TASKS.map((task) => (
          <div key={task.id} className="border-2 border-border bg-background p-3 text-center">
            <p className="font-mono text-[12px] font-bold text-foreground">{task.label}</p>
            <p className="font-mono text-[10.5px] text-muted-foreground">{task.note}</p>
            <button
              type="button"
              onClick={() => launch(task)}
              disabled={status[task.id] !== "queued"}
              className="mt-2 border-2 border-foreground bg-brand-orange px-3 py-1 font-mono text-[11px] font-bold uppercase text-white transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status[task.id] === "done"
                ? "Done"
                : status[task.id] === "inprogress"
                  ? `${commitCounts[task.id]}/${task.commits}`
                  : "Launch"}
            </button>
          </div>
        ))}
      </div>

      {conflictVisible && (
        <div className="mt-4 border-2 border-brand-amber bg-brand-amber/10 p-4">
          <h3 className="font-mono text-[13px] font-bold text-foreground">Merge Conflict</h3>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-[11.5px] text-foreground">
            {"<<<<<<< T2\nlog.info\n=======\nlogger.info\n>>>>>>> T3"}
          </pre>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => resolveConflict("Conflict resolved: T3 rebased on T2.")}
              className="border-2 border-foreground bg-background px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-foreground hover:border-brand-orange"
            >
              Rebase T3 on T2
            </button>
            <button
              type="button"
              onClick={() => resolveConflict("Conflict resolved: kept T3 (logger.info).")}
              className="border-2 border-foreground bg-background px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-foreground hover:border-brand-orange"
            >
              Keep T3
            </button>
          </div>
        </div>
      )}

      <p
        className={cn(
          "mt-4 border-t border-border pt-3 text-center font-mono text-[12px]",
          statusLine.startsWith("All tasks completed") ? "font-bold text-[#22c55e]" : "text-muted-foreground",
        )}
      >
        {statusLine} {statusLine.startsWith("All tasks completed") && done ? "✓" : ""}
      </p>
    </div>
  );
}

export default L10GitGraphOrchestrator;
