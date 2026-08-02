import {
  act,
  cleanup,
  render,
  screen,
} from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { CourseSlug } from "@/lib/course/types";

type Owner = {
  readonly kind: "unknown" | "anonymous";
  readonly generation: number;
};

const harness = vi.hoisted(() => ({
  owner: { kind: "unknown", generation: 0 } as Owner,
  ownerListener: null as ((owner: Owner) => void) | null,
  progressListener: null as (() => void) | null,
  eligible: false,
}));

vi.mock("@/lib/progress/browser-learning-storage", () => ({
  getLearningOwnerContext: () => harness.owner,
  subscribeLearningOwner: (listener: (owner: Owner) => void) => {
    harness.ownerListener = listener;
    return () => {
      harness.ownerListener = null;
    };
  },
}));

vi.mock("@/lib/progress/store", () => ({
  subscribe: (listener: () => void) => {
    harness.progressListener = listener;
    listener();
    return () => {
      harness.progressListener = null;
    };
  },
}));

vi.mock("@/lib/course/progress", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/course/progress")>();
  return {
    ...original,
    isCertificateEligible: (_courseSlug: CourseSlug) => harness.eligible,
  };
});

import { CompletionCertificateCta } from "./completion-certificate-cta";

function resolveOwner(eligible: boolean): void {
  act(() => {
    harness.owner = {
      kind: "anonymous",
      generation: harness.owner.generation + 1,
    };
    harness.eligible = eligible;
    harness.ownerListener?.(harness.owner);
    harness.progressListener?.();
  });
}

beforeEach(() => {
  harness.owner = { kind: "unknown", generation: 0 };
  harness.ownerListener = null;
  harness.progressListener = null;
  harness.eligible = false;
});

afterEach(cleanup);

describe("<CompletionCertificateCta>", () => {
  it("exposes no certificate route while the learning owner is unresolved", () => {
    harness.eligible = true;
    render(<CompletionCertificateCta courseSlug="codex" />);

    expect(
      document.querySelector(
        'a[href="/kurse/open-source/codex/kurs/zertifikat"]',
      ),
    ).toBeNull();
  });

  it("stays absent for an identified but ineligible learner", () => {
    render(<CompletionCertificateCta courseSlug="codex" />);
    resolveOwner(false);

    expect(
      screen.queryByRole("heading", {
        name: "Your certificate of completion is ready.",
      }),
    ).not.toBeInTheDocument();
  });

  it.each([
    [
      "codex",
      "/kurse/open-source/codex/kurs/zertifikat",
    ],
    [
      "data-infrastructure",
      "/kurse/open-source/data-infrastructure/kurs/zertifikat",
    ],
  ] as const)(
    "links eligible %s progress to its guarded certificate route",
    (courseSlug, certificateHref) => {
      render(<CompletionCertificateCta courseSlug={courseSlug} />);
      resolveOwner(true);

      expect(
        screen.getByRole("heading", {
          name: "Your certificate of completion is ready.",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", {
          name: "Open Certificate of Completion",
        }),
      ).toHaveAttribute("href", certificateHref);
    },
  );

  it("removes a visible CTA immediately when the learning owner changes", () => {
    render(<CompletionCertificateCta courseSlug="codex" />);
    resolveOwner(true);
    expect(
      screen.getByRole("link", {
        name: "Open Certificate of Completion",
      }),
    ).toBeInTheDocument();

    act(() => {
      harness.owner = {
        kind: "unknown",
        generation: harness.owner.generation + 1,
      };
      harness.ownerListener?.(harness.owner);
    });

    expect(
      screen.queryByRole("link", {
        name: "Open Certificate of Completion",
      }),
    ).not.toBeInTheDocument();
  });
});
