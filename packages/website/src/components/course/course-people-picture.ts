import { COURSE_CATALOG } from "@/lib/courses/catalog";

/**
 * The Grundlagenpfad courses' editorial illustrations (people, desks and
 * documents in Ultramarin, Butter and Mennige; public/course-covers, 1440 x
 * 630). Home cards, the /kurse ledger and the course landing bands show them;
 * the Technikkurse keep their poster art, and their catalog screenshots are
 * never used as pictures.
 */
export interface CoursePeoplePicture {
  readonly src: string;
  /**
   * Where a crop narrower than 16:7 keeps its subject (the /kurse 4:5
   * thumbnail, the phone rows and the landing band's 4:3 and 16:9 frames).
   * A static Tailwind class, so the utility is generated.
   */
  readonly focus: string;
}

/** The intrinsic size of every cover in public/course-covers. */
export const COURSE_PICTURE_WIDTH = 1440;
export const COURSE_PICTURE_HEIGHT = 630;

const FOCUS: Readonly<Record<string, string>> = {
  // The magnifier on the document stack and the first checkpoint note.
  "ki-fuehrerschein": "object-[20%_50%]",
  // The woman at the centre of the crowd.
  "ki-und-gesellschaft": "object-[35%_40%]",
  // The three people and the picture card they hand into the pipeline.
  "eu-ai-act-kurs": "object-[0%_50%]",
  // The woman at her desk.
  "ai-native": "object-[4%_50%]",
};

/** The course's people picture, or undefined for a course without one. */
export function coursePeoplePicture(
  slug: string,
): CoursePeoplePicture | undefined {
  const src = COURSE_CATALOG.find((course) => course.slug === slug)?.coverImage;
  if (!src?.startsWith("/course-covers/")) return undefined;
  return { src, focus: FOCUS[slug] ?? "object-center" };
}
