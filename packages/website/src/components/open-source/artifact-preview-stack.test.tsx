import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ArtifactPreviewStack,
  type ArtifactPreviewFrame,
} from "./artifact-preview-stack";

const FRAMES = [
  {
    src: "/artifacts/tools/cv-engine/screenshot.webp",
    width: 1696,
    height: 1060,
    label: "Editor",
    caption: "The editor and A4 preview.",
  },
  {
    src: "/artifacts/tools/cv-engine/demo-form.webp",
    width: 2880,
    height: 1800,
    label: "Form",
    caption: "Structured editing without YAML.",
  },
  {
    src: "/artifacts/tools/cv-engine/demo-pdf.webp",
    width: 1241,
    height: 1754,
    label: "PDF",
    caption: "The generated one-page PDF.",
  },
] as const satisfies readonly ArtifactPreviewFrame[];

function renderStack() {
  return render(
    <ArtifactPreviewStack
      frames={FRAMES}
      groupLabel="Choose a CV Engine view"
      counterLabels={["View 1/3", "View 2/3", "View 3/3"]}
      selectLabels={["Show Editor", "Show Form", "Show PDF"]}
    />,
  );
}

describe("<ArtifactPreviewStack>", () => {
  it("renders an explicitly sized lead view and switches by touch-safe controls", () => {
    const { container } = renderStack();
    const editor = screen.getByRole("button", { name: "Show Editor" });
    const form = screen.getByRole("button", { name: "Show Form" });

    expect(editor).toHaveAttribute("aria-pressed", "true");
    expect(editor).toHaveClass("min-h-11", "[touch-action:manipulation]");
    expect(
      container.querySelector('img[width="1696"][height="1060"]'),
    ).toBeTruthy();
    expect(container.querySelectorAll("img")).toHaveLength(1);
    const captionStack = container.querySelector(
      "[data-preview-caption-stack]",
    );
    const captions = container.querySelectorAll("[data-preview-caption]");
    expect(captionStack).toHaveClass("grid");
    expect(captions).toHaveLength(FRAMES.length);
    for (const caption of captions) {
      expect(caption).toHaveClass("col-start-1", "row-start-1");
    }
    expect(captions[0]).toHaveAttribute(
      "data-preview-caption-active",
      "true",
    );
    expect(captions[1]).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(form);
    expect(form).toHaveAttribute("aria-pressed", "true");
    expect(editor).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("View 2/3")).toBeVisible();
    expect(screen.getByText(FRAMES[1].caption)).toBeVisible();
    expect(
      container.querySelector(
        '[data-preview-frame="1"][data-preview-active="true"]',
      ),
    ).toBeTruthy();
    expect(
      container.querySelector('img[width="2880"][height="1800"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('img[width="1696"][height="1060"]'),
    ).toBeNull();
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(captions[0]).toHaveAttribute("aria-hidden", "true");
    expect(captions[1]).toHaveAttribute(
      "data-preview-caption-active",
      "true",
    );
    expect(captions[1]).not.toHaveAttribute("aria-hidden");
  });

  it("supports arrow, Home, and End navigation with visible focus", () => {
    renderStack();
    const editor = screen.getByRole("button", { name: "Show Editor" });
    const form = screen.getByRole("button", { name: "Show Form" });
    const pdf = screen.getByRole("button", { name: "Show PDF" });

    editor.focus();
    fireEvent.keyDown(editor, { key: "ArrowRight" });
    expect(form).toHaveFocus();
    expect(form).toHaveAttribute("aria-pressed", "true");

    fireEvent.keyDown(form, { key: "End" });
    expect(pdf).toHaveFocus();
    expect(pdf).toHaveAttribute("aria-pressed", "true");

    fireEvent.keyDown(pdf, { key: "Home" });
    expect(editor).toHaveFocus();
    expect(editor).toHaveAttribute("aria-pressed", "true");
    expect(editor).toHaveClass(
      "focus-visible:ring-2",
      "focus-visible:ring-white",
    );
    expect(form).toHaveClass("focus-visible:ring-foreground");
  });

  it("limits motion to stack state changes and disables it for reduced motion", () => {
    const { container } = renderStack();
    const frames = container.querySelectorAll("[data-preview-frame]");

    expect(frames).toHaveLength(1);
    for (const frame of frames) {
      expect(frame).toHaveClass(
        "transition-[transform,opacity]",
        "motion-reduce:transition-none",
      );
    }
    expect(container.innerHTML).not.toContain("transition-all");
  });
});
