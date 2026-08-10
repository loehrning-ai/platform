"use client";

import { DsCourseErrorState } from "@/components/data-science/ds-course-error-state";

export default function ChapterError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <DsCourseErrorState
      error={error}
      reset={reset}
      boundary="data-science-chapter"
    />
  );
}
