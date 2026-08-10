import { DsCourseNotFoundState } from "@/components/data-science/ds-course-not-found-state";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function ChapterNotFound() {
  return <DsCourseNotFoundState locale={await getRequestLocale()} />;
}
