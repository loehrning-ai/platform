import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getCourseProjectConfig } from "@/lib/course-projects/configs";
import {
  hasValidCourseProjectArtifact,
  serializeCourseProjectProgress,
} from "@/lib/course-projects/persistence";
import {
  COURSE_PROJECT_STAGE_IDS,
  type CourseProjectArtifactState,
} from "@/lib/course-projects/types";
import type { CourseSlug } from "@/lib/course/types";

import CaseLab from "./case-lab";

function renderLab(courseSlug: CourseSlug) {
  const onVerified = vi.fn();
  render(
    <CaseLab
      config={getCourseProjectConfig(courseSlug)}
      lessonId="case"
      locale="en"
      initialArtifact={null}
      onArtifactChange={vi.fn()}
      onVerified={onVerified}
    />,
  );
  return onVerified;
}

describe("CaseLab", () => {
  it("requires the full claim/privacy redline, valid evidence, and replacement note", () => {
    const onVerified = renderLab("ki-fuehrerschein");
    const verify = screen.getByRole("button", { name: "Verify project" });
    expect(screen.getByText(/Claim and privacy redline/)).toBeInTheDocument();
    expect(verify).toBeDisabled();

    fireEvent.click(screen.getByLabelText("Mark sensitive and remove"));
    fireEvent.click(
      screen.getByLabelText(
        "Strike and replace with a supported feature description",
      ),
    );
    fireEvent.click(screen.getByLabelText("Insert human approval"));
    fireEvent.click(screen.getByLabelText("Approved fictional product note"));
    fireEvent.click(screen.getByLabelText("Exercise review policy"));
    fireEvent.change(
      screen.getByLabelText("Optional session note · not stored"),
      {
        target: {
          value:
            "This is deliberately long filler without structured review evidence and cannot verify anything.",
        },
      },
    );
    expect(verify).toBeDisabled();
    fireEvent.click(
      screen.getByLabelText("State supported product attributes only"),
    );
    fireEvent.click(
      screen.getByLabelText(
        "Explicitly decline to claim a metric or guarantee",
      ),
    );
    fireEvent.click(screen.getByLabelText("Human claim and recipient review"));
    fireEvent.click(
      screen.getByLabelText("Approved measurement with methodology"),
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Run structured evaluation/i }),
    );

    expect(verify).toBeEnabled();
    fireEvent.click(verify);
    expect(onVerified).toHaveBeenCalledWith(
      expect.stringContaining("Redline verified"),
      expect.objectContaining({ engineKind: "case" }),
    );
    expect(JSON.stringify(onVerified.mock.calls[0]?.[1])).not.toContain(
      "deliberately long filler",
    );
    const artifact = onVerified.mock
      .calls[0]?.[1] as CourseProjectArtifactState;
    expect(
      hasValidCourseProjectArtifact(
        serializeCourseProjectProgress(null, {
          ...artifact,
          fields: { ...artifact.fields, stages: COURSE_PROJECT_STAGE_IDS },
        }),
        "case",
        "ki-fuehrerschein",
      ),
    ).toBe(true);
  });

  it("keeps the EU branch a dated dossier rather than a legal verdict", () => {
    renderLab("eu-ai-act-kurs");
    expect(screen.getByText(/System and legal dossier/)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Synthetic learning case · not a legal verdict or legal advice",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Assess the employment-related risk path"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Dated primary source for the legal position"),
    ).toBeInTheDocument();
  });

  it("keeps the society branch focused on stakeholder and publication evidence", () => {
    renderLab("ki-und-gesellschaft");
    expect(screen.getByText(/Stakeholder evidence map/)).toBeInTheDocument();
    expect(screen.getByLabelText("Unverified claim")).toBeInTheDocument();
    expect(
      screen.getAllByLabelText("Hold, cross-check, and plan correction"),
    ).toHaveLength(2);
    expect(
      screen.getByLabelText("Independent statement from the fictional city"),
    ).toBeInTheDocument();
  });
});
