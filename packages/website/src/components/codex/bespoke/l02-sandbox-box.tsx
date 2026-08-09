"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/**
 * L02 bespoke interactive — "The sandbox box".
 * Ported from `codex/js/lessons/L02.js` (functional parity; the source's
 * 3D-rotated CSS box + SVG wire pulses is simplified to a capability
 * checklist with the same live status readout — the graded interaction is
 * toggling all 5 capabilities, not the 3D chrome).
 *
 * Five illustrative capability toggles. Their initial values belong to this
 * exercise and do not assert the active Codex configuration. Toggling network or
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
  readonly locale?: Locale;
}

const COPY = {
  en: {
    heading: "◆ Exercise · Environment controls",
    capabilityLabels: {
      fs: "filesystem",
      tests: "tests",
      net: "network",
      env: "env vars",
      secrets: "secrets",
    },
    networkWarning:
      "NETWORK ENABLED: restrict destinations and verify fetched inputs",
    secretsWarning:
      "CREDENTIALS AVAILABLE: limit scope, lifetime, and log exposure",
    canVerify: "configured checks are marked available; inspect their output",
    cannotVerify: "configured checks are unavailable in this scenario",
    explored: "all five controls inspected",
  },
  de: {
    heading: "◆ Praxis · Umgebungskontrollen",
    capabilityLabels: {
      fs: "Dateisystem",
      tests: "Tests",
      net: "Netzwerk",
      env: "Umgebungsvariablen",
      secrets: "Zugangsdaten",
    },
    networkWarning:
      "NETZWERK AKTIV: Ziele begrenzen und geladene Eingaben prüfen",
    secretsWarning:
      "ZUGANGSDATEN VERFÜGBAR: Umfang, Gültigkeit und Protokollierung begrenzen",
    canVerify: "konfigurierte Prüfungen sind verfügbar; Ausgabe kontrollieren",
    cannotVerify:
      "konfigurierte Prüfungen sind in diesem Szenario nicht verfügbar",
    explored: "alle fünf Kontrollen geprüft",
  },
} as const satisfies Record<
  Locale,
  {
    readonly heading: string;
    readonly capabilityLabels: Record<Capability["id"], string>;
    readonly networkWarning: string;
    readonly secretsWarning: string;
    readonly canVerify: string;
    readonly cannotVerify: string;
    readonly explored: string;
  }
>;

export function L02SandboxBox({
  lessonId,
  cpId,
  locale = "en",
}: L02SandboxBoxProps): JSX.Element {
  const copy = COPY[locale];
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [state, setState] = useState<Record<Capability["id"], boolean>>(
    () =>
      Object.fromEntries(
        CAPABILITIES.map((c) => [c.id, c.defaultOn]),
      ) as Record<Capability["id"], boolean>,
  );
  const [toggledOnce, setToggledOnce] = useState<ReadonlySet<Capability["id"]>>(
    () => new Set(),
  );
  const [warning, setWarning] = useState<string | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (toggledOnce.size === CAPABILITIES.length && !done) complete();
  }, [complete, done, toggledOnce]);

  const toggle = (id: Capability["id"]) => {
    const next = !state[id];
    setState((prev) => ({ ...prev, [id]: next }));
    setToggledOnce((prev) => {
      if (prev.has(id)) return prev;
      const nextSet = new Set(prev);
      nextSet.add(id);
      return nextSet;
    });

    if (next && (id === "net" || id === "secrets")) {
      setWarning(id === "net" ? copy.networkWarning : copy.secretsWarning);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = setTimeout(() => {
        setWarning(null);
        warningTimeoutRef.current = null;
      }, 1000);
    }
  };

  const testsOn = state.tests;

  return (
    <div className="min-w-0 max-w-full border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        {copy.heading}
      </p>
      <div className="flex flex-col gap-2">
        {CAPABILITIES.map((cap) => (
          <label
            key={cap.id}
            className="flex cursor-pointer items-center justify-between gap-3 border-2 border-border bg-background px-3 py-2 transition-colors hover:border-brand-orange/60"
          >
            <span className="font-mono text-[13px] text-foreground">
              {copy.capabilityLabels[cap.id]}
            </span>
            <input
              type="checkbox"
              checked={state[cap.id]}
              onChange={() => toggle(cap.id)}
              aria-label={copy.capabilityLabels[cap.id]}
              className="h-4 w-4 accent-[var(--brand-orange)]"
            />
          </label>
        ))}
      </div>

      <p
        className={cn(
          "mt-4 font-mono text-[12px]",
          testsOn ? "text-risk-green" : "text-brand-amber",
        )}
      >
        {testsOn ? copy.canVerify : copy.cannotVerify}
      </p>

      {warning && (
        <p
          role="alert"
          className="mt-2 font-mono text-[11px] font-bold text-destructive"
        >
          {warning}
        </p>
      )}

      <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
        {CAPABILITIES.map((c) => `${c.id} ${state[c.id] ? "y" : "n"}`).join(
          " ",
        )}
      </p>

      {toggledOnce.size === CAPABILITIES.length && (
        <p className="mt-3 font-mono text-[11px] text-risk-green">
          {copy.explored} {done ? "✓" : ""}
        </p>
      )}
    </div>
  );
}

export default L02SandboxBox;
