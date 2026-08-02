"use client";

import type { ReactNode, JSX } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared sub-components used across multiple demo ports (AI-native demo gallery implementation).
 * Kept brand-token-only — no raw hex, no foreign palettes.
 */

/* ─── Window chrome (traffic lights + URL bar) ─────────────── */

export function WindowBar({
  title,
  variant = "light",
}: {
  readonly title: string;
  readonly variant?: "light" | "dark";
}): JSX.Element {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b px-4 py-2.5",
        variant === "dark"
          ? "border-[var(--color-dark-border)] bg-[#161310]"
          : "border-border bg-card/60",
      )}
    >
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-risk-green" />
      <span
        className={cn(
          "ml-4 font-mono text-[11px] uppercase tracking-[0.14em]",
          variant === "dark" ? "text-[var(--color-dark-muted)]" : "text-muted-foreground",
        )}
      >
        {title}
      </span>
    </div>
  );
}

/* ─── Chat bubble ─────────────────────────────────────────── */

export function ChatBubble({
  role,
  children,
  withCursor,
}: {
  readonly role: "user" | "claude";
  readonly children: ReactNode;
  readonly withCursor?: boolean;
}): JSX.Element {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] bg-foreground px-3.5 py-2.5 text-[14px] leading-[1.5] text-background">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-[92%] border-l-[3px] border-brand-orange bg-card/60 px-3.5 py-3 text-[14px] leading-[1.55] text-foreground">
      {children}
      {withCursor && <span className="ai-cursor ml-0.5" aria-hidden="true" />}
    </div>
  );
}

/* ─── Source citation row ──────────────────────────────────── */

export function SourceCitation({
  index,
  title,
  section,
  confidence,
}: {
  readonly index: number;
  readonly title: string;
  readonly section: string;
  readonly confidence: number;
}): JSX.Element {
  return (
    <div className="flex items-center gap-3 border border-border bg-background px-3 py-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-[var(--color-kupfer-mist)] font-mono text-[11px] font-bold text-brand-orange">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-semibold text-foreground">
          {title}
        </div>
        <div className="truncate font-mono text-[10px] text-muted-foreground">
          {section}
        </div>
      </div>
      <div className="font-mono text-[11px] font-bold text-muted-foreground">
        {Math.round(confidence * 100)}%
      </div>
    </div>
  );
}

/* ─── Overline (small mono label) ─────────────────────────── */

export function DemoOverline({ children }: { readonly children: ReactNode }): JSX.Element {
  return (
    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
      {children}
    </div>
  );
}

/* ─── Utility: render markdown-lite **bold** in claude responses ── */

export function renderBoldInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
    chunk.startsWith("**") && chunk.endsWith("**") ? (
      <strong key={i} className="text-brand-orange">
        {chunk.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{chunk}</span>
    ),
  );
}
