import Image from "next/image";
import type { ComponentType } from "react";

/**
 * Per-course banner for the four Lernpfad cards: a real screenshot of that
 * course's own landing page, matching the screenshot treatment already used
 * for the GitHub-Labs cards below. A flat 44px icon tile read as identical
 * across all four cards before — same accent, same shape, only the glyph
 * changed — so cards were hard to tell apart at a glance.
 */

interface CourseMarkProps {
  readonly coverImage: string;
  readonly coverImageAlt: string;
  readonly step: number;
  readonly icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  readonly certified?: boolean;
  readonly certifiedTestId?: string;
}

export function CourseMark({
  coverImage,
  coverImageAlt,
  step,
  icon: Icon,
  certified,
  certifiedTestId,
}: CourseMarkProps) {
  return (
    <div className="relative -mx-6 -mt-6 mb-5 h-56 overflow-hidden rounded-t-xl border-b border-border bg-kupfer-mist sm:h-64">
      <Image
        src={coverImage}
        alt={coverImageAlt}
        width={1280}
        height={620}
        sizes="(min-width: 640px) 50vw, 100vw"
        className="h-full w-full object-cover object-top"
      />

      <span
        aria-hidden="true"
        className="absolute left-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-orange font-mono text-[13px] font-bold text-white shadow-tile sm:left-6 sm:top-6"
      >
        {step}
      </span>

      {certified && (
        <span
          data-testid={certifiedTestId}
          className="absolute right-5 top-5 rounded-full bg-background/90 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-brand-orange shadow-tile sm:right-6 sm:top-6"
        >
          erreicht
        </span>
      )}

      <span className="absolute bottom-5 left-5 flex h-11 w-11 items-center justify-center rounded-lg bg-background text-brand-orange shadow-tile sm:bottom-6 sm:left-6">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </span>
    </div>
  );
}
