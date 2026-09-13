import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { trackProgressSyncFailure } from "@/lib/analytics/events";
import {
  __resetProgressSyncFailureForTests,
  setProgressSyncFailure,
} from "@/lib/progress/sync-status";
import { ProgressSyncNotice } from "./progress-sync-notice";

vi.mock("@/lib/analytics/events", () => ({
  trackProgressSyncFailure: vi.fn(),
}));

const trackMock = vi.mocked(trackProgressSyncFailure);

describe("progress sync notice failure reporting", () => {
  beforeEach(() => {
    __resetProgressSyncFailureForTests();
    trackMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    __resetProgressSyncFailureForTests();
  });

  it("renders nothing and reports nothing while sync is healthy", () => {
    const { container, rerender } = render(<ProgressSyncNotice locale="de" />);
    rerender(<ProgressSyncNotice locale="en" />);

    expect(container).toBeEmptyDOMElement();
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("reports each failure kind once across repeated store notifications", () => {
    const { rerender } = render(<ProgressSyncNotice locale="de" />);

    act(() => setProgressSyncFailure("permanent"));
    expect(screen.getByRole("status")).toHaveAttribute(
      "data-progress-sync-notice",
      "permanent",
    );
    act(() => setProgressSyncFailure("startup"));
    act(() => setProgressSyncFailure("permanent"));
    act(() => setProgressSyncFailure(null));
    act(() => setProgressSyncFailure("permanent"));
    act(() => setProgressSyncFailure("startup"));
    rerender(<ProgressSyncNotice locale="en" />);

    expect(trackMock).toHaveBeenCalledTimes(2);
    expect(trackMock.mock.calls).toEqual([["permanent"], ["startup"]]);
  });

  it("reports a failure that is already present when the notice mounts", () => {
    setProgressSyncFailure("retry_exhausted");

    render(<ProgressSyncNotice locale="en" />);

    expect(trackMock.mock.calls).toEqual([["retry_exhausted"]]);
  });
});
