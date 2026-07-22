"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";

/**
 * L02 bespoke interactive — "The sandbox box".
 * Ported from `codex/js/lessons/L02.js` (functional parity; the source's
 * 3D-rotated CSS box + SVG wire pulses is simplified to a capability
 * checklist with the same live status readout — the graded interaction is
 * toggling all 5 capabilities, not the 3D chrome).
 *
 * Five capability toggles (filesystem/tests on by default; network/env
 * vars/secrets off by default, matching the source). Toggling network or
 * secrets ON shows a transient risk warning (auto-clears, mirroring the
 * source's 1s `setTimeout`, cleaned up on unmount). The checkpoint awards
 * once every toggle has been flipped at least once.
 */

interface Capability {
  readonly id: "fs" | "tests" | "net" | "env" | "secrets";
  readonly label: string;
  readonly defaultOn: boolean;
}

const CAPABILITIES: readonly Capability[] = [
  { id: "fs", label: "filesystem", defaultOn: true },
  { id: "tests", label: "tests", defaultOn: true },
  { id: "net", label: "network", defaultOn: false },
  { id: "env", label: "env vars", defaultOn: false },
  { id: "secrets", label: "secrets", defaultOn: false },
];

interface L02SandboxBoxProps {
  readonly lessonId: string;
  readonly cpId: string;
}

export function L02SandboxBox({ lessonId, cpId }: L02SandboxBoxProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [state, setState] = useState<Record<Capability["id"], boolean>>(() =>
    Object.fromEntries(CAPABILITIES.map((c) => [c.id, c.defaultOn])) as Record<
      Capability["id"],
      boolean
    >,
  );
  const [toggledOnce, setToggledOnce] = useState<ReadonlySet<Capability["id"]>>(() => new Set());
  const [warning, setWarning] = useState<string | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, []);

  const toggle = (id: Capability["id"]) => {
    const next = !state[id];
    setState((prev) => ({ ...prev, [id]: next }));
    setToggledOnce((prev) => {
      if (prev.has(id)) return prev;
      const nextSet = new Set(prev);
      nextSet.add(id);
      if (nextSet.size === CAPABILITIES.length) complete();
      return nextSet;
    });

    if (next && (id === "net" || id === "secrets")) {
      setWarning(
        id === "net" ? "NET ON, supply-chain risk" : "SECRETS EXPOSED, rotate after run",
      );
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = setTimeout(() => {
        setWarning(null);
        warningTimeoutRef.current = null;
      }, 1000);
    }
  };

  const testsOn = state.tests;

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        ◆ Bespoke · The sandbox box
      </p>
      <div className="flex flex-col gap-2">
        {CAPABILITIES.map((cap) => (
          <label
            key={cap.id}
            className="flex cursor-pointer items-center justify-between gap-3 border-2 border-border bg-background px-3 py-2 transition-colors hover:border-brand-orange/60"
          >
            <span className="font-mono text-[13px] text-foreground">{cap.label}</span>
            <input
              type="checkbox"
              checked={state[cap.id]}
              onChange={() => toggle(cap.id)}
              aria-label={cap.label}
              className="h-4 w-4 accent-[var(--brand-orange)]"
            />
          </label>
        ))}
      </div>

      <p
        className={cn(
          "mt-4 font-mono text-[12px]",
          testsOn ? "text-[#22c55e]" : "text-brand-amber",
        )}
      >
        {testsOn ? "codex can verify work" : "codex cannot verify work, flying blind"}
      </p>

      {warning && (
        <p role="alert" className="mt-2 font-mono text-[11px] font-bold text-destructive">
          {warning}
        </p>
      )}

      <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
        {CAPABILITIES.map((c) => `${c.id} ${state[c.id] ? "y" : "n"}`).join(" ")}
      </p>

      {toggledOnce.size === CAPABILITIES.length && (
        <p className="mt-3 font-mono text-[11px] text-[#22c55e]">
          all five capabilities explored {done ? "✓" : ""}
        </p>
      )}
    </div>
  );
}

export default L02SandboxBox;
