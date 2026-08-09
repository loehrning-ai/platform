import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { COURSE_CATALOG, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import type { AccountDeletionControlState } from "@/lib/progress/account-deletion-control";
import type { ProgressSyncFailure } from "@/lib/progress/sync-status";
import { isDefiniteDeleteFailure } from "./deletion-response-policy";
import { DatenschutzClient as DatenschutzPage } from "./datenschutz-client";

const resetCourseMock = vi.hoisted(() => vi.fn());
const clearAccountLocalLearningDataMock = vi.hoisted(() => vi.fn());
const getActiveProgressAccountIdMock = vi.hoisted(() =>
  vi.fn((): string | null => "learner-1"),
);
const beginAccountDeletionMock = vi.hoisted(() =>
  vi.fn<(accountId: string) => string | null>(
    () => "11111111-1111-4111-8111-111111111111",
  ),
);
const cancelAccountDeletionMock = vi.hoisted(() => vi.fn(() => true));
const confirmAccountDeletionMock = vi.hoisted(() => vi.fn(() => true));
const getAccountDeletionControlStateMock = vi.hoisted(() =>
  vi.fn<() => AccountDeletionControlState>(() => ({
    phase: "idle",
    epoch: null,
    accountId: null,
  })),
);
const deletionLockRequestMock = vi.hoisted(() => vi.fn());
const getProgressSyncFailureMock = vi.hoisted(() =>
  vi.fn<() => ProgressSyncFailure | null>(() => null),
);

vi.mock("@/lib/progress/store", () => ({
  resetCourse: resetCourseMock,
  clearAccountLocalLearningData: clearAccountLocalLearningDataMock,
  getActiveProgressAccountId: getActiveProgressAccountIdMock,
}));
vi.mock("@/lib/progress/account-deletion-control", () => ({
  beginAccountDeletion: beginAccountDeletionMock,
  cancelAccountDeletion: cancelAccountDeletionMock,
  confirmAccountDeletion: confirmAccountDeletionMock,
  getAccountDeletionControlState: getAccountDeletionControlStateMock,
}));
vi.mock("@/lib/progress/sync-status", () => ({
  getProgressSyncFailure: getProgressSyncFailureMock,
  getServerProgressSyncFailure: () => null,
  subscribeProgressSyncFailure: () => () => {},
}));

/**
 * The course-reset list must never fall back to a raw slug string as a button
 * label on this compliance-sensitive page. It is scoped to COURSE_CATALOG,
 * the canonical list of live courses using the shared progress engine.
 */
describe("DatenschutzPage course-reset list", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetCourseMock.mockReset();
    clearAccountLocalLearningDataMock.mockReset();
    getActiveProgressAccountIdMock.mockReset();
    getActiveProgressAccountIdMock.mockReturnValue("learner-1");
    beginAccountDeletionMock.mockClear();
    cancelAccountDeletionMock.mockClear();
    confirmAccountDeletionMock.mockReset();
    confirmAccountDeletionMock.mockReturnValue(true);
    getAccountDeletionControlStateMock.mockReset();
    getAccountDeletionControlStateMock.mockReturnValue({
      phase: "idle",
      epoch: null,
      accountId: null,
    });
    deletionLockRequestMock.mockReset();
    deletionLockRequestMock.mockImplementation(
      async (
        name: string,
        _options: LockOptions,
        callback: (lock: Lock | null) => unknown,
      ) =>
        callback({
          name,
          mode: "exclusive",
        } as Lock),
    );
    Object.defineProperty(window.navigator, "locks", {
      configurable: true,
      value: { request: deletionLockRequestMock },
    });
    getProgressSyncFailureMock.mockReset();
    getProgressSyncFailureMock.mockReturnValue(null);
  });

  it.each([
    ["unsupported_media_type", 415],
    ["auth_unavailable", 503],
    ["auth_not_configured", 503],
    ["unauthorized", 401],
    ["payload_too_large", 413],
    ["invalid_owner_binding", 400],
    ["account_owner_mismatch", 409],
    ["reauthentication_required", 403],
    ["rate_limit_exceeded", 429],
    ["rate_limit_unavailable", 503],
    ["admin_client_unavailable", 503],
    ["delete_failed", 500],
  ] as const)(
    "classifies only the exact definite deletion failure contract for %s",
    (errorCode, status) => {
      expect(isDefiniteDeleteFailure(errorCode, status)).toBe(true);
      expect(isDefiniteDeleteFailure(errorCode, status + 1)).toBe(false);
      expect(isDefiniteDeleteFailure(`${errorCode}_unknown`, status)).toBe(
        false,
      );
    },
  );

  it("shows a real German label for every live course, never a raw slug", () => {
    render(<DatenschutzPage />);
    for (const course of COURSE_CATALOG) {
      expect(screen.getByText(course.title)).toBeInTheDocument();
    }
  });

  it("localizes the complete account privacy surface and course labels to English", () => {
    const { container } = render(<DatenschutzPage locale="en" />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Privacy and data management.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Export my data (Article 20 GDPR)",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Delete account (Article 17 GDPR)",
      }),
    ).toBeVisible();
    expect(screen.getByText("AI Fundamentals")).toBeVisible();
    expect(screen.getByRole("link", { name: "← Back to account" })).toHaveAttribute(
      "href",
      "/en/konto",
    );
    expect(container.textContent).not.toMatch(
      /Datenschutz & Datenverwaltung|Meine Daten exportieren|Konto löschen/,
    );
  });

  it("never renders a raw slug string, and never offers to reset an unregistered imported course", () => {
    render(<DatenschutzPage />);
    for (const course of IMPORTED_COURSE_CATALOG) {
      expect(screen.queryByText(course.slug)).toBeNull();
    }
  });

  it("requires explicit confirmation before resetting a course", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<DatenschutzPage />);

    const courseRow = screen.getByText(COURSE_CATALOG[0].title).closest("li");
    expect(courseRow).not.toBeNull();
    const reset = within(courseRow!).getByRole("button", {
      name: "Zurücksetzen",
    });
    expect(reset).not.toHaveAttribute("aria-controls");
    fireEvent.click(reset);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(reset).toHaveAttribute("aria-expanded", "true");
    expect(reset).toHaveAttribute(
      "aria-controls",
      `reset-confirmation-${COURSE_CATALOG[0].slug}`,
    );
    expect(
      within(courseRow!).getByRole("button", {
        name: "Ja, endgültig zurücksetzen",
      }),
    ).toBe(reset);
    expect(within(courseRow!).getByRole("alert")).toHaveTextContent(
      `Fortschritt für ${COURSE_CATALOG[0].title} wirklich zurücksetzen?`,
    );
    expect(
      within(courseRow!).getByRole("button", { name: "Abbrechen" }),
    ).toBeVisible();
  });

  it("cancels without a request and restores focus to the reset control", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<DatenschutzPage />);

    const courseRow = screen.getByText(COURSE_CATALOG[0].title).closest("li");
    expect(courseRow).not.toBeNull();
    const reset = within(courseRow!).getByRole("button", {
      name: "Zurücksetzen",
    });
    fireEvent.click(reset);
    fireEvent.click(
      within(courseRow!).getByRole("button", { name: "Abbrechen" }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(reset).toHaveFocus();
    expect(reset).toHaveAttribute("aria-expanded", "false");
    expect(reset).not.toHaveAttribute("aria-controls");
    expect(within(courseRow!).queryByRole("alert")).toBeNull();
  });

  it("cancels account deletion and restores focus to the persistent delete control", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<DatenschutzPage />);

    const deleteButton = screen.getByRole("button", { name: "Konto löschen" });
    expect(deleteButton).not.toHaveAttribute("aria-controls");
    fireEvent.click(deleteButton);

    expect(deleteButton).toHaveAttribute("aria-expanded", "true");
    expect(deleteButton).toHaveAttribute(
      "aria-controls",
      "delete-account-confirmation",
    );
    const cancel = screen.getByRole("button", { name: "Abbrechen" });
    cancel.focus();
    fireEvent.click(cancel);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(deleteButton).toHaveFocus();
    expect(deleteButton).toHaveAttribute("aria-expanded", "false");
    expect(deleteButton).not.toHaveAttribute("aria-controls");
    expect(
      screen.queryByText(/Bist du sicher\? Lernkonto/),
    ).not.toBeInTheDocument();
  });

  it("does not send DELETE when the browser cannot provide a cross-tab lock", async () => {
    Object.defineProperty(window.navigator, "locks", {
      configurable: true,
      value: undefined,
    });
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<DatenschutzPage />);

    fireEvent.click(screen.getByRole("button", { name: "Konto löschen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, Konto endgültig löschen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "sichere tabübergreifende Kontolöschung",
    );
    expect(beginAccountDeletionMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not join or cancel a deletion already locked by another tab", async () => {
    deletionLockRequestMock.mockImplementationOnce(
      async (
        _name: string,
        _options: LockOptions,
        callback: (lock: Lock | null) => unknown,
      ) => callback(null),
    );
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<DatenschutzPage />);

    fireEvent.click(screen.getByRole("button", { name: "Konto löschen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, Konto endgültig löschen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "In einem anderen Tab läuft bereits eine Kontolöschung.",
    );
    expect(deletionLockRequestMock).toHaveBeenCalledWith(
      "loehrning-account-deletion-request-v1",
      { mode: "exclusive", ifAvailable: true },
      expect.any(Function),
    );
    expect(beginAccountDeletionMock).not.toHaveBeenCalled();
    expect(cancelAccountDeletionMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Löschstatus unklar" }),
    ).toBeDisabled();
  });

  it("does not begin deletion when the cross-tab lock request rejects", async () => {
    deletionLockRequestMock.mockRejectedValueOnce(
      new DOMException("lock manager unavailable", "AbortError"),
    );
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<DatenschutzPage />);

    fireEvent.click(screen.getByRole("button", { name: "Konto löschen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, Konto endgültig löschen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Löschsperre konnte nicht sicher aktiviert werden",
    );
    expect(beginAccountDeletionMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("holds the origin-global lock until the DELETE outcome is handled", async () => {
    let resolveDelete!: (response: Response) => void;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveDelete = resolve;
      }),
    );
    let lockReleased = false;
    deletionLockRequestMock.mockImplementationOnce(
      async (
        name: string,
        _options: LockOptions,
        callback: (lock: Lock | null) => unknown,
      ) => {
        const result = await callback({
          name,
          mode: "exclusive",
        } as Lock);
        lockReleased = true;
        return result;
      },
    );
    render(<DatenschutzPage />);

    fireEvent.click(screen.getByRole("button", { name: "Konto löschen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, Konto endgültig löschen" }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(lockReleased).toBe(false);

    await act(async () => {
      resolveDelete(Response.json({ error: "delete_failed" }, { status: 500 }));
    });

    await waitFor(() => expect(lockReleased).toBe(true));
    expect(cancelAccountDeletionMock).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
    );
  });

  it("does not reuse an unresolved pending marker after acquiring the tab lock", async () => {
    beginAccountDeletionMock.mockReturnValueOnce(null);
    getAccountDeletionControlStateMock.mockReturnValueOnce({
      phase: "pending",
      epoch: "11111111-1111-4111-8111-111111111111",
      accountId: "learner-1",
    });
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<DatenschutzPage />);

    fireEvent.click(screen.getByRole("button", { name: "Konto löschen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, Konto endgültig löschen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "bereits eine Kontolöschung",
    );
    expect(beginAccountDeletionMock).toHaveBeenCalledTimes(1);
    expect(cancelAccountDeletionMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Löschstatus unklar" }),
    ).toBeDisabled();
  });

  it("surfaces an ambiguous deletion outcome and prevents a blind retry", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "delete_status_unknown" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<DatenschutzPage />);

    fireEvent.click(screen.getByRole("button", { name: "Konto löschen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, Konto endgültig löschen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Der Löschstatus konnte nicht sicher ermittelt werden.",
    );
    expect(
      screen.getByRole("button", { name: "Löschstatus unklar" }),
    ).toBeDisabled();
    expect(clearAccountLocalLearningDataMock).not.toHaveBeenCalled();
    expect(beginAccountDeletionMock).toHaveBeenCalledTimes(1);
    expect(beginAccountDeletionMock).toHaveBeenCalledWith("learner-1");
    expect(cancelAccountDeletionMock).not.toHaveBeenCalled();
    expect(confirmAccountDeletionMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      "an opaque proxy response",
      new Response("<html>Bad Gateway</html>", {
        status: 502,
        headers: { "Content-Type": "text/html" },
      }),
    ],
    [
      "an unknown JSON error",
      Response.json({ error: "upstream_gateway_failure" }, { status: 503 }),
    ],
    [
      "a known error code with an impossible status",
      Response.json({ error: "auth_unavailable" }, { status: 500 }),
    ],
    [
      "a legacy session-revocation response",
      Response.json({ error: "session_revocation_failed" }, { status: 503 }),
    ],
  ])("keeps sync paused when DELETE returns %s", async (_label, response) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response);
    render(<DatenschutzPage />);

    fireEvent.click(screen.getByRole("button", { name: "Konto löschen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, Konto endgültig löschen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Der Löschstatus konnte nicht sicher ermittelt werden.",
    );
    expect(
      screen.getByRole("button", { name: "Löschstatus unklar" }),
    ).toBeDisabled();
    expect(cancelAccountDeletionMock).not.toHaveBeenCalled();
    expect(confirmAccountDeletionMock).not.toHaveBeenCalled();
    expect(clearAccountLocalLearningDataMock).not.toHaveBeenCalled();
  });

  it("pauses sync before DELETE and resumes without clearing local data after a definite failure", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        Response.json({ error: "delete_failed" }, { status: 500 }),
      );
    render(<DatenschutzPage />);

    fireEvent.click(screen.getByRole("button", { name: "Konto löschen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, Konto endgültig löschen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Fehler 500");
    expect(beginAccountDeletionMock).toHaveBeenCalledTimes(1);
    expect(beginAccountDeletionMock.mock.invocationCallOrder[0]).toBeLessThan(
      fetchMock.mock.invocationCallOrder[0] ?? Infinity,
    );
    expect(cancelAccountDeletionMock).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
    );
    expect(confirmAccountDeletionMock).not.toHaveBeenCalled();
    expect(clearAccountLocalLearningDataMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Konto löschen" })).toBeEnabled();
  });

  it("uses provider-neutral reauthentication copy after a stale session", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        { error: "reauthentication_required" },
        { status: 403 },
      ),
    );
    render(<DatenschutzPage />);

    fireEvent.click(screen.getByRole("button", { name: "Konto löschen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, Konto endgültig löschen" }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("mit einer verfügbaren Anmeldemethode");
    expect(alert).not.toHaveTextContent("Login-Link");
  });

  it("keeps deletion locked when a definite server failure cannot release the local barrier", async () => {
    cancelAccountDeletionMock.mockReturnValueOnce(false);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ error: "delete_failed" }, { status: 500 }),
    );
    render(<DatenschutzPage />);

    fireEvent.click(screen.getByRole("button", { name: "Konto löschen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, Konto endgültig löschen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "die lokale Sperre konnte nicht sicher aufgehoben werden",
    );
    expect(cancelAccountDeletionMock).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
    );
    expect(
      screen.getByRole("button", { name: "Löschstatus unklar" }),
    ).toBeDisabled();
    expect(confirmAccountDeletionMock).not.toHaveBeenCalled();
    expect(clearAccountLocalLearningDataMock).not.toHaveBeenCalled();
  });

  it("does not send DELETE when the local pending marker cannot be stored durably", async () => {
    beginAccountDeletionMock.mockReturnValueOnce(null);
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<DatenschutzPage />);

    fireEvent.click(screen.getByRole("button", { name: "Konto löschen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, Konto endgültig löschen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Die Löschung konnte lokal nicht sicher vorbereitet werden.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Es wurde keine Löschanfrage gesendet.",
    );
    expect(beginAccountDeletionMock).toHaveBeenCalledWith("learner-1");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(confirmAccountDeletionMock).not.toHaveBeenCalled();
    expect(clearAccountLocalLearningDataMock).not.toHaveBeenCalled();
  });

  it("keeps sync paused and local data intact when the client loses the delete response", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("network failed"),
    );
    render(<DatenschutzPage />);

    fireEvent.click(screen.getByRole("button", { name: "Konto löschen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, Konto endgültig löschen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "wegen eines Verbindungsfehlers nicht sicher ermittelt",
    );
    expect(cancelAccountDeletionMock).not.toHaveBeenCalled();
    expect(confirmAccountDeletionMock).not.toHaveBeenCalled();
    expect(clearAccountLocalLearningDataMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Löschstatus unklar" }),
    ).toBeDisabled();
  });

  it("treats a deletion response for another owner as ambiguous", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ deleted: true, ownerId: "learner-2" }, { status: 200 }),
    );
    render(<DatenschutzPage />);

    fireEvent.click(screen.getByRole("button", { name: "Konto löschen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, Konto endgültig löschen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "nicht eindeutig bestätigt",
    );
    expect(confirmAccountDeletionMock).not.toHaveBeenCalled();
    expect(cancelAccountDeletionMock).not.toHaveBeenCalled();
    expect(clearAccountLocalLearningDataMock).not.toHaveBeenCalled();
  });

  it("confirms coordination and clears local data only after server-confirmed deletion", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        Response.json({ deleted: true, ownerId: "learner-1" }, { status: 200 }),
      );
    render(<DatenschutzPage />);

    fireEvent.click(screen.getByRole("button", { name: "Konto löschen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, Konto endgültig löschen" }),
    );

    await waitFor(() => {
      expect(confirmAccountDeletionMock).toHaveBeenCalledWith(
        "11111111-1111-4111-8111-111111111111",
        "learner-1",
        expect.any(Object),
      );
    });
    expect(clearAccountLocalLearningDataMock).toHaveBeenCalledTimes(1);
    expect(clearAccountLocalLearningDataMock).toHaveBeenCalledWith("learner-1");
    expect(cancelAccountDeletionMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/account/delete",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ expectedOwnerId: "learner-1" }),
      }),
    );
    expect(confirmAccountDeletionMock.mock.invocationCallOrder[0]).toBeLessThan(
      clearAccountLocalLearningDataMock.mock.invocationCallOrder[0] ?? Infinity,
    );
  });

  it("stays fail-closed when cross-tab cleanup cannot be fully coordinated", async () => {
    confirmAccountDeletionMock.mockReturnValue(false);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ deleted: true, ownerId: "learner-1" }, { status: 200 }),
    );
    render(<DatenschutzPage />);

    fireEvent.click(screen.getByRole("button", { name: "Konto löschen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, Konto endgültig löschen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "lokale Bereinigung konnte nicht vollständig koordiniert werden",
    );
    expect(confirmAccountDeletionMock).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
      "learner-1",
      expect.any(Object),
    );
    expect(clearAccountLocalLearningDataMock).not.toHaveBeenCalled();
  });

  it("does not start deletion without a verified active account owner", async () => {
    getActiveProgressAccountIdMock.mockReturnValue(null);
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<DatenschutzPage />);

    fireEvent.click(screen.getByRole("button", { name: "Konto löschen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, Konto endgültig löschen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Kontozuordnung ist noch nicht sicher bestätigt",
    );
    expect(beginAccountDeletionMock).not.toHaveBeenCalled();
    expect(clearAccountLocalLearningDataMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not export or reset progress without a verified active owner", async () => {
    getActiveProgressAccountIdMock.mockReturnValue(null);
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<DatenschutzPage />);

    fireEvent.click(
      screen.getByRole("button", { name: "Daten herunterladen" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Kontozuordnung ist noch nicht sicher bestätigt",
    );

    const reset = screen.getAllByRole("button", { name: "Zurücksetzen" })[0];
    fireEvent.click(reset);
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, endgültig zurücksetzen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Kontozuordnung ist noch nicht sicher bestätigt",
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(resetCourseMock).not.toHaveBeenCalled();
  });

  it("renders an accessible, honest status when progress sync has stopped", () => {
    getProgressSyncFailureMock.mockReturnValue("retry_exhausted");

    render(<DatenschutzPage />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Server-Synchronisierung ist nach mehreren Versuchen weiterhin fehlgeschlagen",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Fortschritt bleibt in diesem Browser gespeichert",
    );
  });

  it("clears the matching browser slice after the server reset succeeds", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          ownerId: "learner-1",
          resetAt: "2026-07-28T00:00:00.000Z",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    render(<DatenschutzPage />);

    const reset = screen.getAllByRole("button", { name: "Zurücksetzen" })[0];
    fireEvent.click(reset);
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, endgültig zurücksetzen" }),
    );

    await waitFor(() => {
      expect(resetCourseMock).toHaveBeenCalledWith(
        COURSE_CATALOG[0].slug,
        "2026-07-28T00:00:00.000Z",
      );
    });
    expect(
      screen.getByRole("button", { name: "Zurückgesetzt" }),
    ).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/account/reset-progress",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          courseSlug: COURSE_CATALOG[0].slug,
          expectedOwnerId: "learner-1",
        }),
      }),
    );
  });

  it("locks the confirmed control while the reset request is pending", async () => {
    let finishRequest!: (response: Response) => void;
    const response = new Promise<Response>((resolve) => {
      finishRequest = resolve;
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockReturnValue(response);
    render(<DatenschutzPage />);

    const reset = screen.getAllByRole("button", { name: "Zurücksetzen" })[0];
    fireEvent.click(reset);
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, endgültig zurücksetzen" }),
    );

    const pending = screen.getByRole("button", { name: "Zurücksetzen…" });
    expect(pending).toBeDisabled();
    expect(pending).toHaveAttribute("aria-busy", "true");
    fireEvent.click(pending);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      finishRequest(
        new Response(
          JSON.stringify({
            ownerId: "learner-1",
            resetAt: "2026-07-28T00:00:00.000Z",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
      await response;
    });
    expect(
      await screen.findByRole("button", { name: "Zurückgesetzt" }),
    ).toBeDisabled();
  });

  it("never applies a reset confirmation for a different account", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        {
          ownerId: "learner-2",
          resetAt: "2026-07-28T00:00:00.000Z",
        },
        { status: 200 },
      ),
    );
    render(<DatenschutzPage />);

    const reset = screen.getAllByRole("button", { name: "Zurücksetzen" })[0];
    fireEvent.click(reset);
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, endgültig zurücksetzen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ungültige Reset-Bestätigung",
    );
    expect(resetCourseMock).not.toHaveBeenCalled();
  });

  it("does not apply an account-bound reset after the active owner changes", async () => {
    getActiveProgressAccountIdMock
      .mockReturnValueOnce("learner-1")
      .mockReturnValue("learner-2");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        {
          ownerId: "learner-1",
          resetAt: "2026-07-28T00:00:00.000Z",
        },
        { status: 200 },
      ),
    );
    render(<DatenschutzPage />);

    const reset = screen.getAllByRole("button", { name: "Zurücksetzen" })[0];
    fireEvent.click(reset);
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, endgültig zurücksetzen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Kontozuordnung hat sich während des Zurücksetzens geändert",
    );
    expect(resetCourseMock).not.toHaveBeenCalled();
  });

  it("announces a failed reset and permits a fresh confirmed retry", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 503 }));
    render(<DatenschutzPage />);

    const reset = screen.getAllByRole("button", { name: "Zurücksetzen" })[0];
    fireEvent.click(reset);
    fireEvent.click(
      screen.getByRole("button", { name: "Ja, endgültig zurücksetzen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Fehler 503");
    expect(reset).toBeEnabled();
    expect(reset).toHaveTextContent("Zurücksetzen");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(reset);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Ja, endgültig zurücksetzen" }),
    ).toBeVisible();
  });

  it("streams an owner-bound export through a native form after preflight", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        {
          ready: true,
          ownerId: "learner-1",
        },
        { status: 200 },
      ),
    );
    let submittedForm: HTMLFormElement | null = null;
    const submit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(function (this: HTMLFormElement) {
        submittedForm = this.cloneNode(true) as HTMLFormElement;
      });
    const createObjectUrl = vi.spyOn(URL, "createObjectURL");
    render(<DatenschutzPage />);

    fireEvent.click(
      screen.getByRole("button", { name: "Daten herunterladen" }),
    );

    await waitFor(() => {
      expect(submit).toHaveBeenCalledTimes(1);
    });
    expect(createObjectUrl).not.toHaveBeenCalled();
    expect(submittedForm).not.toBeNull();
    expect(submittedForm!.method).toBe("post");
    expect(submittedForm!.getAttribute("action")).toBe("/api/account/export");
    expect(submittedForm!.hasAttribute("target")).toBe(false);
    expect(submittedForm!.acceptCharset).toBe("UTF-8");
    expect(
      submittedForm!.querySelector<HTMLInputElement>(
        'input[name="expectedOwnerId"]',
      )?.value,
    ).toBe("learner-1");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Download wurde angefordert",
    );
    expect(
      screen.getByRole("button", { name: "Erneut herunterladen" }),
    ).toHaveAttribute("aria-busy", "false");
    expect(
      document.querySelector('iframe[name^="loehrning-export-"]'),
    ).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith("/api/account/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expectedOwnerId: "learner-1",
        preflight: true,
      }),
    });
  });

  it("marks the export control busy while the bounded preflight is pending", async () => {
    let finishPreflight!: (response: Response) => void;
    const preflight = new Promise<Response>((resolve) => {
      finishPreflight = resolve;
    });
    vi.spyOn(globalThis, "fetch").mockReturnValue(preflight);
    vi.spyOn(HTMLFormElement.prototype, "requestSubmit").mockImplementation(
      () => {},
    );
    render(<DatenschutzPage />);

    fireEvent.click(
      screen.getByRole("button", { name: "Daten herunterladen" }),
    );

    const pending = screen.getByRole("button", { name: "Wird exportiert…" });
    expect(pending).toBeDisabled();
    expect(pending).toHaveAttribute("aria-busy", "true");

    await act(async () => {
      finishPreflight(
        Response.json(
          {
            ready: true,
            ownerId: "learner-1",
          },
          { status: 200 },
        ),
      );
      await preflight;
    });

    expect(
      await screen.findByRole("button", { name: "Erneut herunterladen" }),
    ).toHaveAttribute("aria-busy", "false");
  });

  it("removes transient export DOM when native form submission throws", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        {
          ready: true,
          ownerId: "learner-1",
        },
        { status: 200 },
      ),
    );
    vi.spyOn(HTMLFormElement.prototype, "requestSubmit").mockImplementation(
      () => {
        throw new Error("native submission unavailable");
      },
    );
    render(<DatenschutzPage />);

    fireEvent.click(
      screen.getByRole("button", { name: "Daten herunterladen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "native submission unavailable",
    );
    expect(
      document.querySelector('form[action="/api/account/export"]'),
    ).toBeNull();
  });

  it("rejects a preflight response for another owner", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        {
          ready: true,
          ownerId: "learner-2",
        },
        { status: 200 },
      ),
    );
    const submit = vi.spyOn(HTMLFormElement.prototype, "requestSubmit");
    render(<DatenschutzPage />);

    fireEvent.click(
      screen.getByRole("button", { name: "Daten herunterladen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Datenexport konnte nicht sicher vorbereitet werden",
    );
    expect(submit).not.toHaveBeenCalled();
  });

  it("does not download an account-bound export after the active owner changes", async () => {
    getActiveProgressAccountIdMock
      .mockReturnValueOnce("learner-1")
      .mockReturnValue("learner-2");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        {
          ready: true,
          ownerId: "learner-1",
        },
        { status: 200 },
      ),
    );
    const submit = vi.spyOn(HTMLFormElement.prototype, "requestSubmit");
    render(<DatenschutzPage />);

    fireEvent.click(
      screen.getByRole("button", { name: "Daten herunterladen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Kontozuordnung hat sich während des Exports geändert",
    );
    expect(submit).not.toHaveBeenCalled();
  });

  it("does not start a native download after a failed preflight", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ error: "export_failed" }, { status: 503 }),
    );
    const submit = vi.spyOn(HTMLFormElement.prototype, "requestSubmit");
    render(<DatenschutzPage />);

    fireEvent.click(
      screen.getByRole("button", { name: "Daten herunterladen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Der Datenexport konnte nicht vorbereitet werden (Fehler 503)",
    );
    expect(submit).not.toHaveBeenCalled();
  });

  it("explains a known preflight store failure without starting navigation", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ error: "export_store_unavailable" }, { status: 503 }),
    );
    const submit = vi.spyOn(HTMLFormElement.prototype, "requestSubmit");
    render(<DatenschutzPage />);

    fireEvent.click(
      screen.getByRole("button", { name: "Daten herunterladen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "geschützte Export-Datenspeicher ist vorübergehend nicht verfügbar",
    );
    expect(submit).not.toHaveBeenCalled();
  });
});
