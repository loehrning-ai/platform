import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(),
}));

import { getRequestLocale } from "@/lib/i18n/request-locale";
import CourseHubPage from "./kurs/page";
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

describe("EU AI Act locale propagation across the course lifecycle", () => {
  beforeEach(() => {
    vi.mocked(getRequestLocale).mockResolvedValue("en");
  });

  it("passes the audited English locale and content through every route wrapper", async () => {
    const hub = await CourseHubPage();
    expect(hub.props).toMatchObject({ locale: "en" });
    expect(hub.props.modules).toHaveLength(5);
    expect(hub.props.modules[0]).toMatchObject({
      id: "block_1",
      title: "Does it apply to me?",
      lessons: [
        expect.objectContaining({ id: "rolle-1-1" }),
        expect.objectContaining({ id: "zeitplan-1-2" }),
      ],
    });
    expect(
      hub.props.modules.reduce(
        (sum: number, module: { lessons: unknown[] }) => sum + module.lessons.length,
        0,
      ),
    ).toBe(10);

    const block = await BlockPage({
      params: Promise.resolve({ blockId: "block_1" }),
    });
    expect(block.props).toMatchObject({
      courseSlug: "eu-ai-act-kurs",
      blockId: "block_1",
      locale: "en",
    });

    expect((await QuizPage()).props).toMatchObject({
      courseSlug: "eu-ai-act-kurs",
      locale: "en",
    });
    expect((await CertificateRoute()).props).toMatchObject({
      courseSlug: "eu-ai-act-kurs",
      locale: "en",
    });
    expect((await VerificationRoute()).props).toMatchObject({
      courseSlug: "eu-ai-act-kurs",
      locale: "en",
    });
  });

  it("localizes protected reader and block metadata while keeping them noindex", async () => {
    const course = await generateCourseMetadata();
    expect(course).toMatchObject({
      title: "EU AI Act Course: roles, risks, and duties",
      robots: { index: false, follow: true },
      alternates: { canonical: "/en/eu-ai-act-kurs/kurs" },
      openGraph: {
        url: "https://loehrning.ai/en/eu-ai-act-kurs/kurs",
        locale: "en_GB",
      },
    });

    const block = await generateBlockMetadata({
      params: Promise.resolve({ blockId: "block_1" }),
    });
    expect(block.title).toContain("Does it apply to me?");
    expect(block).toMatchObject({
      robots: { index: false, follow: true },
      openGraph: {
        url: "https://loehrning.ai/en/eu-ai-act-kurs/kurs/block_1",
      },
    });
  });

  it("localizes quiz, completion-record, and public record-reader metadata", async () => {
    expect(await generateQuizMetadata()).toMatchObject({
      title: "Final quiz: EU AI Act Course",
      robots: { index: false, follow: false },
      alternates: { canonical: null },
    });
    expect(await generateCertificateMetadata()).toMatchObject({
      // Copy lock updated: the English completion document is named a "certificate of participation" platform-wide.
      title: "Certificate of participation: EU AI Act Course",
      robots: { index: false, follow: false },
      alternates: { canonical: null },
    });
    expect(await generateVerificationMetadata()).toMatchObject({
      title: "Read course-record data: EU AI Act Course",
      robots: { index: false, follow: false },
      alternates: { canonical: null },
    });
  });
});
