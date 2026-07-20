// ─── Shared VerificationPage a11y + decode tests (shared course architecture) ──
//
// The certificate-verification screen decodes its payload from the URL hash on
// the client. The a11y sweep added a stable, always-present <h1>
// ("Zertifikatdaten prüfen") so the route never renders zero or two h1s,
// regardless of the checking / valid / invalid state. These tests lock that
// in plus the base64url decode happy + error paths.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { VerificationPage } from "./verification-page";

/** Encode a verification payload the same way the certificate PDF QR does. */
function encodeHash(payload: object): string {
  const json = JSON.stringify(payload);
  const base64 = btoa(
    encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    ),
  );
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function setHash(hash: string): void {
  window.location.hash = hash;
}

beforeEach(() => {
  setHash("");
});

afterEach(() => {
  cleanup();
  setHash("");
});

describe("VerificationPage", () => {
  it("renders exactly one h1 in the invalid (no-hash) state", async () => {
    setHash("");
    render(<VerificationPage courseSlug="ai-native" />);

    // The persistent page heading is always present.
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Zertifikatdaten prüfen" }),
    ).toBeInTheDocument();

    // The invalid card appears after the client-side effect runs.
    await waitFor(() =>
      expect(screen.getByText("Zertifikatcode nicht lesbar")).toBeInTheDocument(),
    );
    // Still exactly one h1 once settled (the invalid headline is an h2).
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  }, 15_000);

  it("renders readable self-declared QR data without authenticity language", async () => {
    const payload = {
      n: "Tim Löhr",
      s: 90,
      m: "quiz",
      d: "2026-06-03T10:00:00.000Z",
      c: "ai-native",
      v: 1,
    };
    setHash("#" + encodeHash(payload));
    render(<VerificationPage courseSlug="ai-native" />);

    await waitFor(() =>
      expect(screen.getByText("QR-Daten gelesen")).toBeInTheDocument(),
    );
    expect(screen.getByText("Tim Löhr")).toBeInTheDocument();
    expect(screen.getByText(/90%/)).toBeInTheDocument();
    expect(screen.getByText(/nicht servergeprüft/)).toBeInTheDocument();
    expect(screen.getByText(/nicht kryptografisch signiert/)).toBeInTheDocument();
    expect(screen.getByText(/keine behördliche oder rechtliche Bescheinigung/)).toBeInTheDocument();
    expect(screen.queryByText(/Zertifikat gültig/i)).toBeNull();
    expect(screen.queryByText(/serverseitig bestätigt/i)).toBeNull();
    expect(screen.queryByText(/ist kryptografisch signiert/i)).toBeNull();
    // The certificate title is an h2; the page h1 stays unique.
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("rejects readable QR data for a different course route", async () => {
    const payload = {
      n: "Tim Löhr",
      s: 90,
      m: "quiz",
      d: "2026-06-03T10:00:00.000Z",
      c: "ki-fuehrerschein",
      v: 1,
    };
    setHash("#" + encodeHash(payload));
    render(<VerificationPage courseSlug="ai-native" />);

    await waitFor(() =>
      expect(
        screen.getByText("Zertifikatcode passt nicht zu diesem Kurs."),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("QR-Daten gelesen")).toBeNull();
  });

  it("renders capstone completion without a fake quiz score", async () => {
    const payload = {
      n: "Tim Löhr",
      s: null,
      m: "capstone",
      d: "2026-06-03T10:00:00.000Z",
      c: "ai-native",
      v: 1,
    };
    setHash("#" + encodeHash(payload));
    render(<VerificationPage courseSlug="ai-native" />);

    await waitFor(() =>
      expect(screen.getByText("QR-Daten gelesen")).toBeInTheDocument(),
    );
    expect(screen.getByText("Abschlussweg: Capstone-Rubrik")).toBeInTheDocument();
    expect(screen.queryByText(/Ergebnis: 0%/)).toBeNull();
  });

  it("renders all-lessons-done completion without a fake quiz score (plan 007 stage 4)", async () => {
    const payload = {
      n: "Tim Löhr",
      s: null,
      m: "completion",
      d: "2026-06-03T10:00:00.000Z",
      c: "ki-fuehrerschein",
      v: 1,
    };
    setHash("#" + encodeHash(payload));
    render(<VerificationPage courseSlug="ki-fuehrerschein" />);

    await waitFor(() =>
      expect(screen.getByText("QR-Daten gelesen")).toBeInTheDocument(),
    );
    expect(
      screen.getByText("Abschlussweg: Alle Lektionen abgeschlossen"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Ergebnis: 0%/)).toBeNull();
  });

  // plan 007 stage 8: isCourseSlug() used to hardcode the original 4 slugs,
  // so a well-formed QR payload for any other course decoded as "malformed"
  // rather than the more specific "course-mismatch". "codex" isn't
  // registered in the shared engine yet (that's each course plan's own
  // job), so it can't be passed as the courseSlug PROP here (getCourseConfig
  // would throw) — but it CAN appear as the QR payload's embedded course
  // slug, decoded against a real registered course. Before the fix, the
  // guard rejected "codex" outright as malformed; after the fix, it's
  // accepted as a real CourseSlug and correctly reported as a mismatch.
  it("round-trips a non-original-4 course slug in the QR payload as a mismatch, not malformed", async () => {
    const payload = {
      n: "Tim Löhr",
      s: null,
      m: "completion",
      d: "2026-06-03T10:00:00.000Z",
      c: "codex",
      v: 1,
    };
    setHash("#" + encodeHash(payload));
    render(<VerificationPage courseSlug="ki-fuehrerschein" />);

    await waitFor(() =>
      expect(
        screen.getByText("Zertifikatcode passt nicht zu diesem Kurs."),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("Zertifikatcode nicht lesbar")).toBeNull();
  });

  it("falls back to the invalid state for a malformed hash", async () => {
    setHash("#not-valid-base64url!!!");
    render(<VerificationPage courseSlug="ki-fuehrerschein" />);

    await waitFor(() =>
      expect(screen.getByText("Zertifikatcode nicht lesbar")).toBeInTheDocument(),
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
