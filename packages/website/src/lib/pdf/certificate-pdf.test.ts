import { describe, expect, it } from "vitest";
import { jsPDF } from "jspdf";
import {
  certificateModulePositions,
  fitTextLayout,
  splitCertificateName,
} from "./certificate-pdf";
import { COURSE_SLUGS } from "@/lib/course/types";
import { getCourseConfig } from "@/lib/course/config";

describe("certificate PDF variable-text layout", () => {
  it("fits every configured title and subtitle inside the print bounds", () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    for (const slug of COURSE_SLUGS) {
      const course = getCourseConfig(slug);

      doc.setFont("helvetica", "bold");
      const title = fitTextLayout(
        doc,
        course.certificateTitle.toUpperCase(),
        225,
        32,
        18,
        1,
      );
      expect(title.lines, `${slug} title line count`).toHaveLength(1);

      doc.setFont("helvetica", "normal");
      const subtitle = fitTextLayout(
        doc,
        course.certificateSubtitle,
        225,
        14,
        8.5,
        3,
      );
      expect(subtitle.lines.length, `${slug} subtitle line count`).toBeLessThanOrEqual(3);
      doc.setFontSize(subtitle.fontSize);
      for (const line of subtitle.lines) {
        expect(doc.getTextWidth(line), `${slug} subtitle width`).toBeLessThanOrEqual(225);
      }
    }
  });

  it("preserves multilingual names instead of transliterating them", () => {
    const name = "Łukasz 李 Мария";
    expect(splitCertificateName(name).join(" ")).toBe(name);
  });

  it("fails explicitly instead of silently deleting overflow text", () => {
    const measurer = {
      setFontSize() {},
      splitTextToSize() {
        return ["one", "two", "three"];
      },
    };
    expect(() => fitTextLayout(measurer, "complete source", 20, 12, 10, 2))
      .toThrow(/exceeds 2 lines/);
  });

  it("bounds a 100-character unbroken name to two lines without data loss", () => {
    const name = "李".repeat(100);
    const lines = splitCertificateName(name);
    expect(lines).toHaveLength(2);
    expect(lines.join("")).toBe(name);
  });

  it("splits names only at grapheme boundaries", () => {
    const grapheme = "e\u0301";
    const name = grapheme.repeat(60);
    const lines = splitCertificateName(name);
    expect(lines).toHaveLength(2);
    expect(lines.join("")).toBe(name);
    expect(lines.every((line) => !line.startsWith("\u0301"))).toBe(true);
  });

  it("keeps the largest module list above the certificate footer", () => {
    for (const slug of COURSE_SLUGS) {
      const positions = certificateModulePositions(
        getCourseConfig(slug).certificateModules.length,
      );
      expect(
        Math.max(...positions.map((position) => position.y)),
        `${slug} module baseline`,
      ).toBeLessThan(170);
    }
  });
});
