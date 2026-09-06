"use client";

import { useLocale } from "@/components/i18n/locale-context";
import { useNavModalOpen } from "@/lib/a11y/nav-modal-state";

interface LearningOwnerPanelProps {
  /** The server renders the choice disabled; it acts once a handler is live. */
  readonly ready: boolean;
  readonly onContinue: () => void;
}

/**
 * The in-flow ownership choice. It stays in document flow so it cannot cover
 * the first learning action or an active simulator, and it reserves the same
 * height whether the route gate's placeholder or the deferred runtime renders
 * it, so the runtime arriving one chunk after hydration shifts nothing.
 *
 * Keep this free of the progress store and browser learning storage: the
 * root-layout gate renders it on every learning-owner route before the
 * learning-only async chunk has loaded.
 */
export function LearningOwnerPanel({
  ready,
  onContinue,
}: LearningOwnerPanelProps) {
  const locale = useLocale();
  const navModalOpen = useNavModalOpen();

  return (
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
          onClick={() => onContinue()}
          disabled={!ready}
          className="min-h-11 shrink-0 border border-brand-orange bg-background px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-brand-orange hover:text-white focus-visible:bg-brand-orange focus-visible:text-white disabled:cursor-wait disabled:border-border disabled:text-muted-foreground"
        >
          {locale === "de" ? "Lokal weiterlernen" : "Continue locally"}
        </button>
      </div>
    </section>
  );
}
