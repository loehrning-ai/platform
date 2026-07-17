import { getBlocks, getTotalLessonCount } from "@/lib/course/data";
import type { BlockSummary } from "@/lib/course/types";
import { KursContent } from "./kurs-content";

const COURSE_SLUG = "ki-und-gesellschaft" as const;

export default function KursPage() {
  const blocks: readonly BlockSummary[] = getBlocks(COURSE_SLUG).map(
    (block) => ({
      id: block.id,
      title: block.title,
      description: block.description,
      durationMinutes: block.durationMinutes,
      orderIndex: block.orderIndex,
      lessonIds: block.lessons.map((lesson) => lesson.id),
    }),
  );

  return (
    <KursContent
      blocks={blocks}
      totalLessons={getTotalLessonCount(COURSE_SLUG)}
    />
  );
}
