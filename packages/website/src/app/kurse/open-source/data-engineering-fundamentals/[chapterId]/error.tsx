"use client";

import { DefCourseErrorState } from "@/components/data-engineering-fundamentals/def-course-error-state";

export default function ChapterError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <DefCourseErrorState
      error={error}
      reset={reset}
      boundary="data-engineering-chapter"
    />
  );
}
