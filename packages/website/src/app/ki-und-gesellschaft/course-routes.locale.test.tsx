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
    expect(hub.props).toMatchObject({ locale: "en", totalLessons: 9 });
    expect(hub.props.blocks).toHaveLength(3);
    expect(hub.props.blocks[0]).toMatchObject({
      id: "block_1",
      title: "AI and work",
    });

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
    render(<KursContent blocks={[]} totalLessons={9} locale="en" />);

    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/en",
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "AI and Society",
    );
    expect(screen.getByText("Sources and limits")).toBeInTheDocument();
    expect(
      screen.getByText(/not legal, career, or case-specific advice/),
    ).toBeInTheDocument();
    expect(screen.getByText("Workshop quiz")).toBeInTheDocument();
    expect(screen.getByText(/15 practical questions/)).toBeInTheDocument();
  });

  it("localizes protected reader and block metadata while keeping them noindex", async () => {
    expect(await generateCourseMetadata()).toMatchObject({
      title: "AI and Society: work, deepfakes, and bias",
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
    expect(block.title).toContain("AI and work");
    expect(block).toMatchObject({
      robots: { index: false, follow: true },
      openGraph: {
        url: "https://loehrning.ai/en/ki-und-gesellschaft/kurs/block_1",
      },
    });
  });

  it("localizes quiz, completion-record, and public record-reader metadata", async () => {
    expect(await generateQuizMetadata()).toMatchObject({
      title: "Workshop quiz: AI and Society",
      robots: { index: false, follow: false },
      alternates: { canonical: null },
    });
    expect(await generateCertificateMetadata()).toMatchObject({
      title: "Course completion record: AI and Society",
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
