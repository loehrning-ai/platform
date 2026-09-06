"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { ContinueCourse } from "@/components/home/continue-courses";
import type { Locale } from "@/lib/i18n/locale";

const ContinueCard = dynamic(
  () =>
    import("@/components/home/continue-card").then(
      (module) => module.ContinueCard,
    ),
  { ssr: false },
);

/**
 * Reserved seat for the companion home's first decision, below `lg` only.
 *
 * Three properties this shell exists to guarantee:
 *
 *  - Nothing about the learner renders on the server. The card's answer
 *    depends on the active learning namespace, which only the browser can
 *    resolve; a server guess would be wrong for every returning learner.
 *  - The seat is exactly as tall as the card, in the server HTML. The card is
 *    `h-full` inside a fixed-height box, so the page geometry below it is
 *    final at first paint and resolving progress shifts nothing.
 *  - The card stays out of the hydration critical path: this shell is the only
 *    part of the island in the initial client graph, and it defers the card to
 *    a chunk fetched after mount, the way UserProgressSync defers its storage
 *    and network machinery.
 *
 * Course facts come in as props so the catalog stays server-side; see
 * continue-courses.ts.
 */
export function ContinueSlot({
  locale = "de",
  courses,
}: {
  readonly locale?: Locale;
  readonly courses: readonly ContinueCourse[];
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      data-home-continue-slot
      className="mx-auto w-full max-w-6xl px-6 pt-3 lg:hidden"
    >
      <div className="h-[4.75rem]">
        {mounted ? <ContinueCard locale={locale} courses={courses} /> : null}
      </div>
    </div>
  );
}
