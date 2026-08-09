import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Owner = {
  readonly kind: "anonymous" | "account" | "unknown";
  readonly generation: number;
  readonly accountId?: string;
};

const harness = vi.hoisted(() => ({
  owner: {
    kind: "account",
    accountId: "account-a",
    generation: 1,
  } as Owner,
  ownerListener: null as ((owner: Owner) => void) | null,
  progressListener: null as (() => void) | null,
  router: { push: vi.fn() },
  generatePdf: vi.fn(),
  eligible: true,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => harness.router,
}));

vi.mock("@/lib/course/progress", () => ({
  getWorkshopQuizResult: () => ({
    passed: true,
    score: 0.9,
    completedAt: "2026-07-29T10:00:00.000Z",
  }),
  isCapstoneSubmitted: () => false,
  isCertificateEligible: () => harness.eligible,
}));

vi.mock("@/lib/progress/store", () => ({
  getCourseSlice: () => ({
    lastActivity: "2026-07-29T10:00:00.000Z",
  }),
  subscribe: (listener: () => void) => {
    harness.progressListener = listener;
    listener();
    return () => {
      harness.progressListener = null;
    };
  },
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

vi.mock("@/lib/pdf/certificate-pdf", () => ({
  generateCertificatePdf: harness.generatePdf,
}));

vi.mock("framer-motion", async () => {
  const { createElement, forwardRef, Fragment } = await import("react");
  const DROP = new Set(["initial", "animate", "transition"]);
  const MotionElement = forwardRef<HTMLElement, Record<string, unknown>>(
    (props, ref) => {
      const cleanProps: Record<string, unknown> = {};
      for (const key in props) {
        if (!DROP.has(key)) cleanProps[key] = props[key];
      }
      return createElement("div", { ...cleanProps, ref });
    },
  );
  const Provider = ({ children }: { children?: unknown }) =>
    createElement(Fragment, null, children as never);
  return {
    m: { div: MotionElement, p: MotionElement },
    MotionConfig: Provider,
    LazyMotion: Provider,
    domAnimation: {},
  };
});

import { CertificatePage } from "./certificate-page";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

beforeEach(() => {
  harness.owner = {
    kind: "account",
    accountId: "account-a",
    generation: 1,
  };
  harness.ownerListener = null;
  harness.progressListener = null;
  harness.router.push.mockReset();
  harness.generatePdf.mockReset();
  harness.eligible = true;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("<CertificatePage>", () => {
  it("cancels a prior owner's in-flight PDF before it can download", async () => {
    const pending = deferred<Blob>();
    harness.generatePdf.mockReturnValue(pending.promise);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    const createObjectUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:certificate");

    render(<CertificatePage courseSlug="claude" locale="en" />);

    fireEvent.change(screen.getByRole("textbox", { name: "Full name" }), {
      target: { value: "Account A Learner" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Download Certificate of Completion",
      }),
    );
    await waitFor(() => expect(harness.generatePdf).toHaveBeenCalledTimes(1));

    act(() => {
      harness.owner = { kind: "unknown", generation: 2 };
      harness.ownerListener?.(harness.owner);
    });
    await act(async () => {
      pending.resolve(new Blob(["certificate"], { type: "application/pdf" }));
      await pending.promise;
    });

    expect(createObjectUrl).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
    expect(
      screen.queryByText("Your certificate of completion has been downloaded."),
    ).not.toBeInTheDocument();
  });

  it("invalidates generation when progress becomes ineligible", async () => {
    const pending = deferred<Blob>();
    harness.generatePdf.mockReturnValue(pending.promise);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:certificate");

    render(<CertificatePage courseSlug="claude" locale="en" />);
    fireEvent.change(screen.getByRole("textbox", { name: "Full name" }), {
      target: { value: "Learner" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Download Certificate of Completion",
      }),
    );
    await waitFor(() => expect(harness.generatePdf).toHaveBeenCalledTimes(1));

    act(() => {
      harness.eligible = false;
      harness.progressListener?.();
    });
    await act(async () => {
      pending.resolve(new Blob(["certificate"], { type: "application/pdf" }));
      await pending.promise;
    });

    expect(click).not.toHaveBeenCalled();
    expect(harness.router.push).toHaveBeenCalledWith(
      "/en/kurse/open-source/claude/kurs",
    );
  });
});
