"use client";

import { AiNativeOperatorCourseErrorState } from "@/components/ai-native-operator/course-error-state";

export default function AiNativeOperatorModuleError({
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
      kind="module"
      boundary="ai-native-operator-module"
    />
  );
}
