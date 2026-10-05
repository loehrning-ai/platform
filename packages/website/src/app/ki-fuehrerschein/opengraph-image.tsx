import { ImageResponse } from "next/og";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";
import { COURSE_PLAKAT } from "@/lib/plakat/palettes";
import { CourseOgCard, courseOgFonts } from "../kurse/course-og-card";

export const alt = "KI-Führerschein / Everyday AI Literacy course on loehrning.ai";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Grundlagenpfad 01 in the Lemons scene (SPEC §2.2, §3.15). */
export default async function Image() {
  const locale = resolveFoundationCourseContentLocale(
    "ki-fuehrerschein",
    await getRequestLocale(),
  );
  const copy =
    locale === "en"
      ? {
          caps: "Everyday AI Literacy · Foundation course",
          title: "AI at work.",
          subtitle: "4 modules, 8 hands-on lessons, about 45 min.",
          trailing: "/en/ki-fuehrerschein",
        }
      : {
          caps: "KI-Führerschein · Grundlagenkurs",
          title: "KI im Alltag.",
          subtitle: "4 Module, 8 Lektionen mit Übung, ca. 45 Min.",
          trailing: "/ki-fuehrerschein",
        };

  return new ImageResponse(
    <CourseOgCard scene={COURSE_PLAKAT["ki-fuehrerschein"]} {...copy} />,
    { ...size, fonts: await courseOgFonts() },
  );
}
