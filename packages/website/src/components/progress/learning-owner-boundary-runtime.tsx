"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-context";
import {
  getLearningOwnerContext,
  subscribeLearningOwner,
  type LearningOwnerContext,
} from "@/lib/progress/browser-learning-storage";
import { continueWithAnonymousProgress } from "@/lib/progress/store";
import { isLearningOwnerRoute } from "@/lib/progress/learning-route-policy";
import {
  LEARNING_OWNER_INERT_ATTRIBUTE,
  setSharedInertOwner,
} from "@/lib/a11y/shared-inert";
import { useNavModalOpen } from "@/lib/a11y/nav-modal-state";

/**
 * Prevent progress controls from accepting interactions before Auth has
 * selected an isolated account or anonymous namespace. The root `main`
 * remains server-owned; this component only owns the gate attributes and the
 * separate continuation panel.
 */
export function LearningOwnerBoundaryRuntime() {
  const pathname = usePathname();
  const locale = useLocale();
  const navModalOpen = useNavModalOpen();
  const continuationRef = useRef<HTMLButtonElement>(null);
  // `null` keeps server/no-JS content fully navigable. The layout effect runs
  // before the first interactive paint and applies `inert` when ownership is
  // unresolved. The progress store itself remains fail-closed while the owner
  // is unknown.
  const [owner, setOwner] = useState<LearningOwnerContext | null>(null);

  useLayoutEffect(() => {
    setOwner(getLearningOwnerContext());
    return subscribeLearningOwner(setOwner);
  }, []);

  const unresolved =
    owner?.kind === "unknown" && isLearningOwnerRoute(pathname);

  useLayoutEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return;

    setSharedInertOwner(main, LEARNING_OWNER_INERT_ATTRIBUTE, unresolved);
    if (unresolved) {
      main.setAttribute("aria-busy", "true");
    } else {
      main.removeAttribute("aria-busy");
    }

    return () => {
      setSharedInertOwner(main, LEARNING_OWNER_INERT_ATTRIBUTE, false);
      main.removeAttribute("aria-busy");
    };
  }, [unresolved]);

  useLayoutEffect(() => {
    if (!unresolved || navModalOpen) return;
    const main = document.getElementById("main-content");
    const activeElement = document.activeElement;
    if (
      main &&
      activeElement instanceof HTMLElement &&
      main.contains(activeElement)
    ) {
      continuationRef.current?.focus();
    }
  }, [navModalOpen, unresolved]);

  return (
    <>
      {unresolved && (
        <aside
          data-learning-owner-panel
          className={`fixed inset-x-4 bottom-4 z-40 mx-auto max-w-xl border-2 border-foreground bg-card p-4 shadow-[4px_4px_0_0_var(--color-foreground)] ${navModalOpen ? "invisible pointer-events-none" : ""}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-hidden={navModalOpen || undefined}
          inert={navModalOpen || undefined}
          data-nav-menu-inert={navModalOpen ? "true" : undefined}
        >
          <p className="text-sm font-semibold">
            {locale === "de"
              ? "Lernkonto wird sicher zugeordnet."
              : "Learning account ownership is being resolved."}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {locale === "de"
              ? "Fortschrittsaktionen bleiben gesperrt, bis das Konto geprüft ist. Ohne Verbindung kannst du für diesen Seitenaufruf getrennt lokal weiterlernen."
              : "Progress actions stay locked until the account is verified. Without a connection, continue in the separate local learning space for this page load."}
          </p>
          <button
            ref={continuationRef}
            type="button"
            onClick={() => continueWithAnonymousProgress()}
            className="mt-3 min-h-11 border-2 border-foreground bg-background px-4 py-2 text-xs font-bold uppercase tracking-wide text-foreground"
          >
            {locale === "de"
              ? "Lokal ohne Kontosynchronisierung fortfahren"
              : "Continue locally without account sync"}
          </button>
        </aside>
      )}
    </>
  );
}
