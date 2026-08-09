// ─── Shared VerificationPage a11y + decode tests (shared course architecture) ──
//
// The certificate-verification screen decodes its payload from the URL hash on
// the client. The a11y sweep added a stable, always-present <h1>
// ("Zertifikatdaten prüfen") so the route never renders zero or two h1s,
// regardless of the checking / valid / invalid state. These tests lock that
// in plus the base64url decode happy + error paths.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import {
  MAX_CERTIFICATE_HASH_CHARS,
  VerificationPage,
} from "./verification-page";

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
      expect(
        screen.getByText("Zertifikatcode nicht lesbar"),
      ).toBeInTheDocument(),
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
    expect(
      screen.getByText(/nicht kryptografisch signiert/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/keine behördliche oder rechtliche Bescheinigung/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Zertifikat gültig/i)).toBeNull();
    expect(screen.queryByText(/serverseitig bestätigt/i)).toBeNull();
    expect(screen.queryByText(/ist kryptografisch signiert/i)).toBeNull();
    // The certificate title is an h2; the page h1 stays unique.
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("wraps the maximum accepted learner name instead of clipping it", async () => {
    const name = "W".repeat(120);
    setHash(
      "#" +
        encodeHash({
          n: name,
          s: 100,
          m: "quiz",
          d: "2026-08-08T10:00:00.000Z",
          c: "ai-native",
          v: 1,
        }),
    );
    render(<VerificationPage courseSlug="ai-native" />);

    const learnerName = await screen.findByText(name);
    expect(learnerName).toHaveClass("break-words", "[overflow-wrap:anywhere]");
  });

  it("rejects the historical 9000% payload produced from an unnormalized score", async () => {
    setHash(
      "#" +
        encodeHash({
          n: "Tim Löhr",
          s: 9000,
          m: "quiz",
          d: "2026-06-03T10:00:00.000Z",
          c: "ai-native",
          v: 1,
        }),
    );
    render(<VerificationPage courseSlug="ai-native" />);

    await waitFor(() =>
      expect(
        screen.getByText("Zertifikatcode nicht lesbar"),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("QR-Daten gelesen")).toBeNull();
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
    expect(
      screen.getByText("Abschlussweg: Capstone-Rubrik"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Ergebnis: 0%/)).toBeNull();
  });

  it("renders all-lessons-done completion without a fake quiz score ", async () => {
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

  //: isCourseSlug() used to hardcode the original 4 slugs,
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

  //: claude is now a fully registered course (unlike
  // "codex" above, which is still unregistered), so this exercises the real
  // happy path end to end for the course this plan ported. claude is an
  // English-language course (CourseConfig.language: "en"), so this page
  // correctly renders its English copy branch, not the German one every
  // other test case here exercises via the native German courses.
  it("round-trips a real claude certificate QR payload successfully", async () => {
    const payload = {
      n: "Ada Lovelace",
      s: 92,
      m: "quiz",
      d: "2026-07-01T10:00:00.000Z",
      c: "claude",
      v: 1,
    };
    setHash("#" + encodeHash(payload));
    render(<VerificationPage courseSlug="claude" locale="en" />);

    await waitFor(() =>
      expect(screen.getByText("QR data read")).toBeInTheDocument(),
    );
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Claude Course")).toBeInTheDocument();
    expect(screen.queryByText("Certificate code unreadable")).toBeNull();
  });

  it("uses the KI-Führerschein English config and preserves the /en return path", async () => {
    const payload = {
      n: "Ada Lovelace",
      s: 95,
      m: "quiz",
      d: "2026-08-08T10:00:00.000Z",
      c: "ki-fuehrerschein",
      v: 1,
    };
    setHash("#" + encodeHash(payload));
    render(<VerificationPage courseSlug="ki-fuehrerschein" locale="en" />);

    await waitFor(() =>
      expect(screen.getByText("QR data read")).toBeInTheDocument(),
    );
    expect(
      screen.getByText("Course Completion Record: Everyday AI Literacy"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to Everyday AI Literacy" }),
    ).toHaveAttribute("href", "/en/ki-fuehrerschein");
    expect(screen.getByText(/not server-verified/)).toBeInTheDocument();
    expect(screen.queryByText("QR-Daten gelesen")).toBeNull();
  });

  it("falls back to the invalid state for a malformed hash", async () => {
    setHash("#not-valid-base64url!!!");
    render(<VerificationPage courseSlug="ki-fuehrerschein" />);

    await waitFor(() =>
      expect(
        screen.getByText("Zertifikatcode nicht lesbar"),
      ).toBeInTheDocument(),
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("re-reads a same-document fragment change without retaining stale data", async () => {
    setHash(
      "#" +
        encodeHash({
          n: "Ada Lovelace",
          s: 92,
          m: "quiz",
          d: "2026-07-01T10:00:00.000Z",
          c: "claude",
          v: 1,
        }),
    );
    render(<VerificationPage courseSlug="claude" locale="de" />);
    await waitFor(() =>
      expect(screen.getByText("QR-Daten gelesen")).toBeInTheDocument(),
    );

    setHash("#not-valid-base64url!!!");
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() =>
      expect(
        screen.getByText("Zertifikatcode nicht lesbar"),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("Ada Lovelace")).toBeNull();
    expect(screen.queryByText("QR-Daten gelesen")).toBeNull();
  });

  it("rejects oversized fragments before base64 decoding", async () => {
    const atobSpy = vi.spyOn(globalThis, "atob");
    setHash("#" + "A".repeat(MAX_CERTIFICATE_HASH_CHARS + 1));

    render(<VerificationPage courseSlug="ki-fuehrerschein" />);

    await waitFor(() =>
      expect(
        screen.getByText("Zertifikatcode nicht lesbar"),
      ).toBeInTheDocument(),
    );
    expect(atobSpy).not.toHaveBeenCalled();
    atobSpy.mockRestore();
  });
});
