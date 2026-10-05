import { ImageResponse } from "next/og";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";
import { COURSE_PLAKAT } from "@/lib/plakat/palettes";
import { CourseOgCard, courseOgFonts } from "../kurse/course-og-card";

export const alt =
  "KI und Gesellschaft / AI and Society course on loehrning.ai";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Grundlagenpfad 02 in the Lemons scene (SPEC §2.2, §3.15). */
export default async function Image() {
  const locale = resolveFoundationCourseContentLocale(
    "ki-und-gesellschaft",
    await getRequestLocale(),
  );
  const copy =
    locale === "en"
      ? {
          caps: "AI and Society · Foundation course",
          title: "Jobs figures. Fakes. Fairness.",
          subtitle: "3 modules, 8 hands-on lessons, 40 minutes.",
          trailing: "/en/ki-und-gesellschaft",
        }
      : {
          caps: "KI und Gesellschaft · Grundlagenkurs",
          title: "Jobzahlen. Fakes. Fairness.",
          subtitle: "3 Module, 8 Lektionen mit Übung, 40 Minuten.",
          trailing: "/ki-und-gesellschaft",
        };

  return new ImageResponse(
    <CourseOgCard scene={COURSE_PLAKAT["ki-und-gesellschaft"]} {...copy} />,
    { ...size, fonts: await courseOgFonts() },
  );
}
