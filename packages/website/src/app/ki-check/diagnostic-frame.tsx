import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Bounded page frame for both KI-Check states. The outer gutter owns viewport
 * containment; the inner four-sided rule makes the instrument read as one
 * deliberate object instead of a stack of open-ended horizontal dividers.
 */
export function DiagnosticFrame({
  children,
  state,
  wide = false,
}: {
  readonly children: ReactNode;
  readonly state: "question" | "result";
  readonly wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 px-4 pb-12 pt-4 sm:px-6 sm:pt-6",
        wide ? "max-w-[1120px]" : "max-w-[920px]",
      )}
      data-diagnostic-state={state}
    >
      <div
        className="relative min-w-0 overflow-hidden border border-foreground bg-background"
        data-diagnostic-frame
      >
        <span
          className="pointer-events-none absolute left-0 top-0 z-10 h-1 w-16 bg-brand-orange"
          aria-hidden="true"
        />
        {children}
      </div>
    </div>
  );
}
