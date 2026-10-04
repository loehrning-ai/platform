import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(),
}));

import { getRequestLocale } from "@/lib/i18n/request-locale";
import CourseHubPage from "./kurs/page";
import { KursContent } from "./kurs/kurs-content";
import BlockPage, {
  generateMetadata as generateBlockMetadata,
} from "./kurs/[blockId]/page";
import QuizPage from "./kurs/quiz/page";
import CertificateRoute from "./kurs/zertifikat/page";
import VerificationRoute from "./verifizierung/page";
import { generateMetadata as generateCourseMetadata } from "./kurs/layout";
import { generateMetadata as generateQuizMetadata } from "./kurs/quiz/layout";
import { generateMetadata as generateCertificateMetadata } from "./kurs/zertifikat/layout";
import { generateMetadata as generateVerificationMetadata } from "./verifizierung/layout";

afterEach(cleanup);

describe("KI und Gesellschaft locale propagation across the course lifecycle", () => {
  beforeEach(() => {
    vi.mocked(getRequestLocale).mockResolvedValue("en");
  });

  it("passes the audited English locale and content through every route wrapper", async () => {
    const hub = await CourseHubPage();
    expect(hub.props).toMatchObject({ locale: "en" });
    expect(hub.props.modules).toHaveLength(3);
    expect(hub.props.modules[0]).toMatchObject({
      id: "block_1",
      title: "Reading jobs figures",
      durationMinutes: 10,
    });
    expect(
      hub.props.modules.flatMap(
        (module: { lessons: readonly { id: string }[] }) =>
          module.lessons.map((lesson) => lesson.id),
      ),
    ).toHaveLength(8);

    const block = await BlockPage({
      params: Promise.resolve({ blockId: "block_1" }),
    });
    expect(block.props).toMatchObject({
      courseSlug: "ki-und-gesellschaft",
      blockId: "block_1",
      locale: "en",
    });
    expect((await QuizPage()).props).toMatchObject({
      courseSlug: "ki-und-gesellschaft",
      locale: "en",
    });
    expect((await CertificateRoute()).props).toMatchObject({
      courseSlug: "ki-und-gesellschaft",
      locale: "en",
    });
    expect((await VerificationRoute()).props).toMatchObject({
      courseSlug: "ki-und-gesellschaft",
      locale: "en",
    });
  });

  it("renders localized course-hub chrome and destinations", () => {
    render(
      <KursContent
        locale="en"
        modules={[
          {
            id: "block_1",
            title: "Reading jobs figures",
            description: "Separate exposure from forecasts.",
            durationMinutes: 10,
            orderIndex: 0,
            lessons: [
              { id: "zahlen-1-1", title: "Decode jobs headlines", durationMinutes: 5 },
              { id: "zahlen-1-2", title: "Your task profile", durationMinutes: 5 },
            ],
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Back to the course page" }),
    ).toHaveAttribute("href", "/en/ki-und-gesellschaft");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "AI and Society",
    );
    expect(screen.getByText(/Every lesson has an exercise/)).toBeInTheDocument();
    expect(
      screen.getByText(/not legal advice and does not assess a specific/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Decode jobs headlines/ }),
    ).toHaveAttribute(
      "href",
      "/en/ki-und-gesellschaft/kurs/block_1#lesson=zahlen-1-1",
    );
  });

  it("localizes protected reader and block metadata while keeping them noindex", async () => {
    expect(await generateCourseMetadata()).toMatchObject({
      title: "AI and Society: check jobs figures, fakes, and fairness",
      robots: { index: false, follow: true },
      alternates: { canonical: "/en/ki-und-gesellschaft/kurs" },
      openGraph: {
        url: "https://loehrning.ai/en/ki-und-gesellschaft/kurs",
        locale: "en_GB",
      },
    });

    const block = await generateBlockMetadata({
      params: Promise.resolve({ blockId: "block_1" }),
    });
    expect(block.title).toContain("Reading jobs figures");
    expect(block).toMatchObject({
      robots: { index: false, follow: true },
      openGraph: {
        url: "https://loehrning.ai/en/ki-und-gesellschaft/kurs/block_1",
      },
    });
  });

  it("localizes quiz, completion-record, and public record-reader metadata", async () => {
    expect(await generateQuizMetadata()).toMatchObject({
      title: "Final quiz: AI and Society",
      robots: { index: false, follow: false },
      alternates: { canonical: null },
    });
    expect(await generateCertificateMetadata()).toMatchObject({
      // Copy lock updated: the English completion document is named a "certificate of participation" platform-wide.
      title: "Certificate of participation: AI and Society",
      robots: { index: false, follow: false },
      alternates: { canonical: null },
    });
    expect(await generateVerificationMetadata()).toMatchObject({
      title: "Read course-record data: AI and Society",
      robots: { index: false, follow: false },
      alternates: { canonical: null },
    });
  });
});
