"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-context";
import {
  getLearningOwnerContext,
  subscribeLearningOwner,
  type LearningOwnerContext,
} from "@/lib/progress/browser-learning-storage";
import { continueWithAnonymousProgress } from "@/lib/progress/store";
import { isLearningOwnerRoute } from "@/lib/progress/learning-route-policy";
import { useNavModalOpen } from "@/lib/a11y/nav-modal-state";

/**
 * Keep progress persistence fail-closed until Auth selects an isolated account
 * or anonymous namespace. Course content stays usable while the learner makes
 * that storage choice explicitly.
 */
export function LearningOwnerBoundaryRuntime() {
  const pathname = usePathname();
  const locale = useLocale();
  const navModalOpen = useNavModalOpen();
  // Unknown is the fail-closed server state. The prompt stays in document flow
  // so it cannot cover the first learning action or an active simulator.
  const [owner, setOwner] = useState<LearningOwnerContext>({
    kind: "unknown",
    generation: 0,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setOwner(getLearningOwnerContext());
    return subscribeLearningOwner(setOwner);
  }, []);

  const unresolved = owner.kind === "unknown" && isLearningOwnerRoute(pathname);

  return (
    <>
      {unresolved && (
        <section
          data-learning-owner-panel
          aria-labelledby="learning-owner-title"
          aria-live="polite"
          className={`relative z-20 border-b border-brand-orange bg-kupfer-mist px-4 py-2 sm:px-6 ${navModalOpen ? "invisible pointer-events-none" : ""}`}
          aria-hidden={navModalOpen || undefined}
          inert={navModalOpen || undefined}
          data-nav-menu-inert={navModalOpen ? "true" : undefined}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p
                id="learning-owner-title"
                className="text-xs font-semibold text-foreground"
              >
                {locale === "de"
                  ? "Fortschritt bleibt getrennt."
                  : "Progress stays isolated."}
              </p>
              <p className="mt-0.5 hidden text-xs leading-snug text-muted-foreground sm:block">
                {locale === "de"
                  ? "Speichern beginnt erst nach Kontoprüfung oder deiner lokalen Wahl."
                  : "Saving starts only after account verification or your local choice."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => continueWithAnonymousProgress()}
              disabled={!hydrated}
              className="min-h-11 shrink-0 border border-brand-orange bg-background px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-brand-orange hover:text-white focus-visible:bg-brand-orange focus-visible:text-white disabled:cursor-wait disabled:border-border disabled:text-muted-foreground"
            >
              {locale === "de" ? "Lokal weiterlernen" : "Continue locally"}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
