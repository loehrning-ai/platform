import { ImageResponse } from "next/og";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";
import { COURSE_PLAKAT } from "@/lib/plakat/palettes";
import { CourseOgCard, courseOgFonts } from "../kurse/course-og-card";

export const alt = "EU AI Act Kurs / EU AI Act course on loehrning.ai";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Grundlagenpfad 03 in the Lemons scene (SPEC §2.2, §3.15). */
export default async function Image() {
  const locale = resolveFoundationCourseContentLocale(
    "eu-ai-act-kurs",
    await getRequestLocale(),
  );
  const copy =
    locale === "en"
      ? {
          caps: "EU AI Act Course · Foundation course",
          title: "Map roles, risks, and duties.",
          subtitle: "5 modules, 10 hands-on lessons, about 1 hr.",
          trailing: "/en/eu-ai-act-kurs",
          titleSize: 68,
        }
      : {
          caps: "EU AI Act Kurs · Grundlagenkurs",
          title: "Rollen, Risiken und Pflichten einordnen.",
          subtitle: "5 Module, 10 Lektionen mit Übung, ca. 1 Std.",
          trailing: "/eu-ai-act-kurs",
          titleSize: 68,
        };

  return new ImageResponse(
    <CourseOgCard scene={COURSE_PLAKAT["eu-ai-act-kurs"]} {...copy} />,
    { ...size, fonts: await courseOgFonts() },
  );
}
