"use client";

import {
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  getLearningOwnerContext,
  subscribeLearningOwner,
  type LearningOwnerContext,
} from "@/lib/progress/browser-learning-storage";
import { continueWithAnonymousProgress } from "@/lib/progress/store";
import { isLearningOwnerRoute } from "@/lib/progress/learning-route-policy";

/**
 * Prevent progress controls from accepting interactions before Auth has
 * selected an isolated account or anonymous namespace.
 */
export function LearningOwnerBoundaryRuntime({
  children,
}: {
  readonly children: ReactNode;
}) {
  const pathname = usePathname();
  // `null` keeps server/no-JS content fully navigable. The layout effect runs
  // before the first interactive paint and applies `inert` when ownership is
  // unresolved.
  const [owner, setOwner] = useState<LearningOwnerContext | null>(null);

  useLayoutEffect(() => {
    setOwner(getLearningOwnerContext());
    return subscribeLearningOwner(setOwner);
  }, []);

  const unresolved =
    owner?.kind === "unknown" && isLearningOwnerRoute(pathname);

  return (
    <>
      <div
        className="contents"
        inert={unresolved || undefined}
        aria-busy={unresolved || undefined}
      >
        {children}
      </div>
      {unresolved && (
        <aside
          className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-xl border-2 border-foreground bg-card p-4 shadow-[4px_4px_0_0_var(--color-foreground)]"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="text-sm font-semibold">
            Lernkonto wird sicher zugeordnet.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Fortschrittsaktionen bleiben gesperrt, bis das Konto geprüft ist.
            Ohne Verbindung kannst du für diesen Seitenaufruf getrennt lokal
            weiterlernen.
          </p>
          <button
            type="button"
            onClick={() => continueWithAnonymousProgress()}
            className="mt-3 min-h-11 border-2 border-foreground bg-background px-4 py-2 text-xs font-bold uppercase tracking-wide text-foreground"
          >
            Lokal ohne Kontosynchronisierung fortfahren
          </button>
        </aside>
      )}
    </>
  );
}
