"use client";

import { Lightbulb } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import { LegalClaimBadge } from "@/components/legal-claim-badge";
import { LessonSectionCheckpoint } from "@/components/course/lesson-proof-checkpoint";
import type { LessonSection } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";
import { getCourseReaderCopy } from "./course-ui-copy";

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
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
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

      <LessonSectionCheckpoint
        locale={locale}
        checked={isRead}
        progressReady={interactionReady}
        onCheck={() => onMarkRead(section.id)}
      />
    </div>
  );
}
