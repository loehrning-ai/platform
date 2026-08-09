"use client";

import { AiNativeOperatorCourseErrorState } from "@/components/ai-native-operator/course-error-state";

export default function AiNativeOperatorLessonError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <AiNativeOperatorCourseErrorState
      error={error}
      reset={reset}
      kind="lesson"
      boundary="ai-native-operator-lesson"
    />
  );
}
