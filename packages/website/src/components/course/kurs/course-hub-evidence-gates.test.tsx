import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { KursContent as KiFuehrerscheinHub } from "@/app/ki-fuehrerschein/kurs/kurs-content";
import type { ComponentType } from "react";
import type { BlockSummary } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";
import { KursContent as EuAiActHub } from "@/app/eu-ai-act-kurs/kurs/kurs-content";
import { KursContent as SocietyHub } from "@/app/ki-und-gesellschaft/kurs/kurs-content";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import type { CourseSlug } from "@/lib/course/types";
import {
  __resetCacheForTests,
  isEvidenceBackedCertificateEligible,
  markLessonCompleted,
  saveWorkshopQuizResult,
} from "@/lib/progress";
import { URL_STATE_CHANGE_EVENT } from "@/lib/navigation/url-state";

type LegacyHubProps = {
  readonly blocks: readonly BlockSummary[];
  readonly totalLessons: number;
  readonly locale?: Locale;
};

// KI-Führerschein's hub is the lesson-engine ModuleOverview, which takes
// module summaries; adapt it to the shared legacy-hub harness below.
function KiFuehrerscheinHubAdapter({ locale }: LegacyHubProps) {
  return (
    <KiFuehrerscheinHub
      locale={locale}
      modules={[
        {
          id: "block_1",
          title: "Modul",
          description: "",
          durationMinutes: 45,
          orderIndex: 0,
          lessons: CANONICAL_LESSON_IDS["ki-fuehrerschein"].map((id) => ({
            id,
            title: id,
            durationMinutes: 5,
          })),
        },
      ]}
    />
  );
}

const CASES: readonly (readonly [CourseSlug, ComponentType<LegacyHubProps>])[] = [
  ["ki-fuehrerschein", KiFuehrerscheinHubAdapter],
  ["eu-ai-act-kurs", EuAiActHub],
  ["ki-und-gesellschaft", SocietyHub],
];

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
  __resetCacheForTests();
});

afterEach(cleanup);

describe("foundation course hub evidence gates", () => {
  for (const [slug, Hub] of CASES) {
    it(`${slug} removes imported progress from locale-switch targets`, async () => {
      const urlStateListener = vi.fn();
      window.addEventListener(URL_STATE_CHANGE_EVENT, urlStateListener);
      window.history.replaceState(
        null,
        "",
        `/${slug}/kurs#progress=invalid-private-payload`,
      );

      render(
        <Hub
          blocks={[]}
          totalLessons={CANONICAL_LESSON_IDS[slug].length}
          locale="en"
        />,
      );

      await waitFor(() => {
        expect(window.location.hash).toBe("");
        expect(urlStateListener).toHaveBeenCalledOnce();
      });
      window.removeEventListener(URL_STATE_CHANGE_EVENT, urlStateListener);
    });

    it(`${slug} does not present a legacy raw pass as a completion record`, async () => {
      for (const lessonId of CANONICAL_LESSON_IDS[slug]) {
        markLessonCompleted(slug satisfies CourseSlug, lessonId);
      }
      saveWorkshopQuizResult(slug, 1, true);
      expect(isEvidenceBackedCertificateEligible(slug)).toBe(false);

      render(
        <Hub
          blocks={[]}
          totalLessons={CANONICAL_LESSON_IDS[slug].length}
          locale="en"
        />,
      );

      await waitFor(() => {
        expect(screen.queryByRole("link", { name: /Passed:/ })).toBeNull();
        expect(screen.queryByRole("link", { name: /Download/ })).toBeNull();
        if (slug === "ki-fuehrerschein") {
          // The module overview counts evidence-backed lessons only.
          const total = CANONICAL_LESSON_IDS[slug].length;
          expect(
            screen.getByRole("img", { name: `0 of ${total} lessons complete` }),
          ).toBeInTheDocument();
        } else {
          expect(screen.getByText("0/1")).toBeInTheDocument();
        }
      });
    });
  }
});
