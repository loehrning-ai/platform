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
          title: "Work. Deepfakes. Bias.",
          subtitle: "3 blocks, 9 lessons, 46 minutes.",
          trailing: "/en/ki-und-gesellschaft",
        }
      : {
          caps: "KI und Gesellschaft · Grundlagenkurs",
          title: "Arbeit. Deepfakes. Bias.",
          subtitle: "3 Blöcke, 9 Lektionen, 46 Minuten.",
          trailing: "/ki-und-gesellschaft",
        };

  return new ImageResponse(
    <CourseOgCard scene={COURSE_PLAKAT["ki-und-gesellschaft"]} {...copy} />,
    { ...size, fonts: await courseOgFonts() },
  );
}
