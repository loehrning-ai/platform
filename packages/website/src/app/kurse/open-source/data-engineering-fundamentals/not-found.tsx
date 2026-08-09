import { DefCourseNotFoundState } from "@/components/data-engineering-fundamentals/def-course-not-found-state";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function DataEngineeringFundamentalsNotFound() {
  return <DefCourseNotFoundState locale={await getRequestLocale()} />;
}
