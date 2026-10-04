import { ImageResponse } from "next/og";
import { getCourseMeta } from "@/lib/ai-native/data";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";
import { COURSE_PLAKAT } from "@/lib/plakat/palettes";
import { CourseOgCard, courseOgFonts } from "../kurse/course-og-card";

export const alt = "Mit KI arbeiten / Working with AI on loehrning.ai";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Grundlagenpfad 04 in the Lemons scene (SPEC §2.2, §3.15). */
export default async function Image() {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  const { totalModules, totalLessons } = getCourseMeta(locale);
  const copy =
    locale === "en"
      ? {
          caps: "Working with AI",
          title: "Measure first. Then automate.",
          subtitle: `${totalModules} modules, ${totalLessons} lessons, any tool.`,
          trailing: "/en/ai-native",
          titleSize: 68,
        }
      : {
          caps: "Mit KI arbeiten · Grundlagenkurs",
          title: "Erst messen. Dann automatisieren.",
          subtitle: `${totalModules} Module, ${totalLessons} Lektionen, jedes Werkzeug.`,
          trailing: "/ai-native",
          titleSize: 68,
        };

  return new ImageResponse(
    <CourseOgCard scene={COURSE_PLAKAT["ai-native"]} {...copy} />,
    { ...size, fonts: await courseOgFonts() },
  );
}
