import { AiNativeOperatorCourseNotFoundState } from "@/components/ai-native-operator/course-not-found-state";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function AiNativeOperatorModuleNotFound() {
  return (
    <AiNativeOperatorCourseNotFoundState
      locale={await getRequestLocale()}
      kind="module"
    />
  );
}
