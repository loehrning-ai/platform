"use client";

import { createContext, useContext, type ReactNode } from "react";

import type {
  CourseProjectConfig,
  LocalizedProjectText,
} from "@/lib/course-projects/types";

export function projectText(
  text: LocalizedProjectText,
  locale: "de" | "en",
): string {
  return text[locale];
}

export const LAB_INPUT =
  "w-full min-w-0 border-2 border-foreground/20 bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 disabled:cursor-not-allowed disabled:opacity-60";

export const LAB_BUTTON =
  "inline-flex min-h-11 items-center justify-center border-2 border-foreground bg-foreground px-4 py-2 text-sm font-bold text-background transition-colors hover:bg-brand-orange hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-foreground/20 disabled:bg-muted disabled:text-muted-foreground";

export const LAB_BUTTON_SECONDARY =
  "inline-flex min-h-11 items-center justify-center border-2 border-foreground/25 bg-card px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const EngineLocaleContext = createContext<"de" | "en">("en");

interface EngineFrameProps {
  config: CourseProjectConfig;
  locale: "de" | "en";
  engineLabel: string;
  children: ReactNode;
}

export function EngineFrame({
  config,
  locale,
  engineLabel,
  children,
}: EngineFrameProps) {
  const scenarioLabel = locale === "de" ? "Szenario" : "Scenario";
  const safetyLabel = locale === "de" ? "Sicherheitsgrenze" : "Safety boundary";

  return (
    <EngineLocaleContext.Provider value={locale}>
      <section
        aria-labelledby={`${config.id}-project-title`}
        className="min-w-0 border-2 border-foreground bg-card shadow-[5px_5px_0_0_rgba(11,9,8,0.16)]"
      >
        <header className="border-b-2 border-foreground bg-foreground px-4 py-4 text-background sm:px-6">
          <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#ffc6aa]">
            {engineLabel} · {config.id}
          </p>
          <h2
            id={`${config.id}-project-title`}
            className="mt-2 break-words text-xl font-black leading-tight sm:text-2xl"
          >
            {projectText(config.title, locale)}
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-background/85">
            {projectText(config.mission, locale)}
          </p>
        </header>

        <div className="grid min-w-0 border-b border-foreground/20 lg:grid-cols-2">
          <div className="min-w-0 border-b border-foreground/20 p-4 lg:border-b-0 lg:border-r sm:p-5">
            <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {scenarioLabel}
            </p>
            <p className="mt-2 break-words text-sm leading-relaxed">
              {projectText(config.scenario, locale)}
            </p>
          </div>
          <div className="min-w-0 bg-brand-orange/[0.06] p-4 sm:p-5">
            <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.15em] text-brand-orange-dark">
              {safetyLabel}
            </p>
            <p className="mt-2 break-words text-sm leading-relaxed">
              {projectText(config.safety, locale)}
            </p>
          </div>
        </div>

        <div className="min-w-0 p-4 sm:p-6">{children}</div>
      </section>
    </EngineLocaleContext.Provider>
  );
}

interface EvidenceItemProps {
  complete: boolean;
  children: ReactNode;
}

export function EvidenceItem({ complete, children }: EvidenceItemProps) {
  const locale = useContext(EngineLocaleContext);
  return (
    <li className="flex min-w-0 items-start gap-2 text-sm leading-relaxed">
      <span
        aria-hidden="true"
        className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center border font-mono text-[0.65rem] font-black ${
          complete
            ? "border-emerald-800 bg-emerald-100 text-emerald-950"
            : "border-foreground/25 bg-background text-muted-foreground"
        }`}
      >
        {complete ? "✓" : "·"}
      </span>
      <span className="min-w-0 break-words">
        <span className="sr-only">
          {complete
            ? locale === "de"
              ? "Abgeschlossen: "
              : "Complete: "
            : locale === "de"
              ? "Offen: "
              : "Incomplete: "}
        </span>
        {children}
      </span>
    </li>
  );
}

interface VerifyPanelProps {
  locale: "de" | "en";
  ready: boolean;
  verified: boolean;
  criteria: ReactNode;
  onVerify: () => void;
  statusDetail: string;
}

export function VerifyPanel({
  locale,
  ready,
  verified,
  criteria,
  onVerify,
  statusDetail,
}: VerifyPanelProps) {
  const title = locale === "de" ? "Evidenz-Gate" : "Evidence gate";
  const verify = locale === "de" ? "Projekt verifizieren" : "Verify project";
  const verifiedLabel = locale === "de" ? "Verifiziert" : "Verified";
  const pending = locale === "de" ? "Noch nicht bereit" : "Not ready yet";
  const readyLabel = locale === "de" ? "Bereit zur Prüfung" : "Ready to verify";

  return (
    <section
      aria-labelledby="project-evidence-gate"
      className="mt-6 border-2 border-foreground/25 bg-background p-4 sm:p-5"
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3
            id="project-evidence-gate"
            className="font-mono text-xs font-black uppercase tracking-[0.15em]"
          >
            {title}
          </h3>
          <ul className="mt-3 space-y-2">{criteria}</ul>
        </div>
        <span
          className={`w-fit shrink-0 border px-2 py-1 font-mono text-[0.68rem] font-bold uppercase tracking-wider ${
            verified
              ? "border-emerald-800 bg-emerald-100 text-emerald-950"
              : ready
                ? "border-brand-orange bg-brand-orange/10 text-brand-orange-dark"
                : "border-foreground/40 bg-[#e6e0d6] text-[#3f3932]"
          }`}
        >
          {verified ? verifiedLabel : ready ? readyLabel : pending}
        </span>
      </div>

      <div className="mt-4 flex min-w-0 flex-col gap-3 border-t border-foreground/15 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className="min-w-0 break-words text-sm text-muted-foreground"
        >
          {statusDetail}
        </p>
        <button
          type="button"
          className={LAB_BUTTON}
          disabled={!ready || verified}
          onClick={onVerify}
        >
          {verified ? verifiedLabel : verify}
        </button>
      </div>
    </section>
  );
}
