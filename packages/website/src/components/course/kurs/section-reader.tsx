"use client";

import { m } from "framer-motion";
import { CheckCircle2, Circle, Lightbulb } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import { LegalClaimBadge } from "@/components/legal-claim-badge";
import type { LessonSection } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";
import { getCourseReaderCopy } from "./course-ui-copy";

const checkSpring = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 400, damping: 15 },
  },
};

interface SectionReaderProps {
  readonly section: LessonSection;
  readonly isRead: boolean;
  readonly interactionReady?: boolean;
  readonly onMarkRead: (sectionId: string) => void;
  readonly locale?: Locale;
}

export function SectionReader({
  section,
  isRead,
  interactionReady = true,
  onMarkRead,
  locale = "de",
}: SectionReaderProps) {
  const copy = getCourseReaderCopy(locale).section;
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 sm:items-center sm:gap-4">
        <h3 className="min-w-0 break-words text-lg font-semibold text-foreground">
          {section.title}
        </h3>
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
          {copy.minutes(section.readTimeMinutes)}
        </span>
      </div>

      <MarkdownRenderer content={section.content} />

      {/* Legal claim badge: rendered for the first source entry with a claimId (legal-source governance) */}
      {section.sources?.find((s) => s.claimId) && (
        <LegalClaimBadge
          claimId={section.sources.find((s) => s.claimId)!.claimId!}
          locale={locale}
        />
      )}

      {section.keyTakeaway && (
        <div className="border-l-2 border-brand-orange bg-brand-orange/5 px-5 py-4">
          <div className="flex items-start gap-2.5">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-orange">
                {copy.takeaway}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                {section.keyTakeaway}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7f (accessibility and quality hardening): aria-live region announces state transition to screen readers.
          Must be present in DOM from the initial render (not injected on click). */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isRead ? copy.readAnnouncement : ""}
      </div>

      <button
        type="button"
        onClick={() => onMarkRead(section.id)}
        disabled={!interactionReady || isRead}
        className="inline-flex items-center gap-2 text-sm font-medium transition-colors disabled:cursor-default"
      >
        {isRead ? (
          <m.span
            initial="hidden"
            animate="visible"
            variants={checkSpring}
            className="inline-flex items-center gap-2 text-brand-sand"
          >
            <CheckCircle2 className="h-4 w-4" />
            {copy.read}
          </m.span>
        ) : (
          <span className="inline-flex items-center gap-2 text-muted-foreground hover:text-brand-orange">
            <Circle className="h-4 w-4" />
            {copy.markRead}
          </span>
        )}
      </button>
    </div>
  );
}
