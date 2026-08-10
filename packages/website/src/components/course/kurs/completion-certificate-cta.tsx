"use client";

import { useEffect, useState, type JSX } from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { getCourseConfig } from "@/lib/course/config";
import { isCertificateEligible } from "@/lib/course/progress";
import type { CourseSlug } from "@/lib/course/types";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import {
  getLearningOwnerContext,
  subscribeLearningOwner,
} from "@/lib/progress/browser-learning-storage";
import { subscribe } from "@/lib/progress/store";
import { cn } from "@/lib/utils";

interface CompletionCertificateCtaProps {
  readonly courseSlug: CourseSlug;
  readonly className?: string;
  readonly locale?: Locale;
}

/**
 * Completion-only certificate pathway for courses without a final quiz.
 *
 * The CTA is deliberately absent until the browser learning owner is known
 * and the canonical progress helper confirms eligibility. This is navigation,
 * not authorization: CertificatePage independently repeats the eligibility
 * check before it renders or generates a PDF.
 */
export function CompletionCertificateCta({
  courseSlug,
  className,
  locale,
}: CompletionCertificateCtaProps): JSX.Element | null {
  const config = getCourseConfig(courseSlug, locale);
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    const unsubscribeOwner = subscribeLearningOwner(() => {
      // Drop the previous owner's result before the store changes namespace.
      // The matching progress emission evaluates the new owner.
      setEligible(false);
    });
    const unsubscribeProgress = subscribe(() => {
      setEligible(
        getLearningOwnerContext().kind !== "unknown" &&
          isCertificateEligible(courseSlug),
      );
    });
    return () => {
      unsubscribeOwner();
      unsubscribeProgress();
    };
  }, [courseSlug]);

  if (!eligible) return null;

  const isGerman = config.language === "de";

  const certificateHref = locale
    ? localizeHref(`${config.coursePath}/zertifikat`, locale)
    : `${config.coursePath}/zertifikat`;
  const headingId = `completion-certificate-${courseSlug}-heading`;

  return (
    <section
      className={cn(
        "border-2 border-foreground bg-card p-5 shadow-[4px_4px_0_0_var(--color-foreground)]",
        className,
      )}
      aria-labelledby={headingId}
      data-certificate-cta={courseSlug}
    >
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
        <GraduationCap className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
        {isGerman ? "Kurs abgeschlossen" : "Course complete"}
      </p>
      <h2
        id={headingId}
        className="mt-2 text-[20px] font-bold tracking-[-0.02em] text-foreground"
      >
        {isGerman
          ? `${config.recordNoun.possessive} ist bereit.`
          : `Your ${config.recordNoun.label.toLowerCase()} is ready.`}
      </h2>
      <p className="mt-2 max-w-[620px] text-[13.5px] leading-relaxed text-muted-foreground">
        {isGerman
          ? "Alle erforderlichen Lektionen sind abgeschlossen. Die Download-Seite prüft deinen Lernstand erneut, bevor sie die lokale PDF vorbereitet."
          : "Every required lesson is complete. The download page checks your progress again before preparing the local PDF."}
      </p>
      <Link
        href={certificateHref}
        className="mt-4 inline-flex min-h-11 max-w-full items-center gap-2 break-words border-2 border-foreground bg-brand-orange px-5 py-3 text-left text-[12px] font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
      >
        {isGerman
          ? `${config.recordNoun.label} öffnen`
          : `Open ${config.recordNoun.label}`}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

export default CompletionCertificateCta;
