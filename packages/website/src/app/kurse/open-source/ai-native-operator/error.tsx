"use client";

import { AiNativeOperatorCourseErrorState } from "@/components/ai-native-operator/course-error-state";

export default function AiNativeOperatorCourseError({
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
      kind="course"
      boundary="ai-native-operator-course"
    />
  );
}
