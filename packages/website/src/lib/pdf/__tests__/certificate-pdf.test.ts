// ─── Certificate verification-URL encoding tests (performance hardening) ──
//
// The verification URL is embedded in the certificate's QR code and decoded
// client-side by `VerificationPage` (base64url of a UTF-8-safe btoa). jsPDF +
// qrcode are stubbed so `generateCertificatePdf` runs its real logic and we
// can capture the EXACT URL handed to the QR encoder — pinning that umlauts,
// spaces, and special characters survive the encode→decode round trip and
// that the fragment stays strictly URL-safe (base64url alphabet only).

import { describe, it, expect, vi, beforeEach } from "vitest";

import { AI_NATIVE_CONFIG, KI_FUEHRERSCHEIN_CONFIG } from "@/lib/course/config";
import { generateCertificatePdf, type CertificateData } from "../certificate-pdf";

const { qrToDataUrlMock } = vi.hoisted(() => ({
  qrToDataUrlMock: vi.fn(async () => "data:image/png;base64,QUFB"),
}));

vi.mock("jspdf", () => {
  class FakeJsPdf {
    setFillColor(): void {}
    rect(): void {}
    setFont(): void {}
    setFontSize(): void {}
    setTextColor(): void {}
    setDrawColor(): void {}
    setLineWidth(): void {}
    line(): void {}
    text(): void {}
    addImage(): void {}
    output(): Blob {
      return new Blob(["%PDF-fake"], { type: "application/pdf" });
    }
  }
  return { default: FakeJsPdf };
});

vi.mock("qrcode", () => ({ toDataURL: qrToDataUrlMock }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeData(overrides: Partial<CertificateData> = {}): CertificateData {
  return {
    name: "Tim Löhr",
    score: 0.9,
    completionMode: "quiz",
    completionDate: "3. Juni 2026",
    completedAt: "2026-06-03T10:00:00.000Z",
    ...overrides,
  };
}

/** URL handed to the QR encoder on the last generate call. */
function lastQrUrl(): string {
  const url = qrToDataUrlMock.mock.calls.at(-1)?.[0];
  expect(typeof url).toBe("string");
  return url as unknown as string;
}

/** Mirror of VerificationPage's decodeHash (base64url → UTF-8 JSON). */
function decodeFragment(url: string): {
  n: string;
  s: number | null;
  m: "quiz" | "capstone" | "completion";
  d: string;
  c: string;
  v: number;
} {
  const fragment = url.split("#")[1] ?? "";
  let base64 = fragment.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((ch) => "%" + ("00" + ch.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );
  return JSON.parse(json);
}

beforeEach(() => {
  qrToDataUrlMock.mockClear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("certificate verification-URL encoding", () => {
  it("targets the course's verifizierung route on loehrning.ai", async () => {
    await generateCertificatePdf(makeData(), AI_NATIVE_CONFIG);
    expect(lastQrUrl()).toMatch(
      /^https:\/\/loehrning\.ai\/ai-native\/verifizierung#./,
    );

    await generateCertificatePdf(makeData(), KI_FUEHRERSCHEIN_CONFIG);
    expect(lastQrUrl()).toMatch(
      /^https:\/\/loehrning\.ai\/ki-fuehrerschein\/verifizierung#./,
    );
  });

  it("emits a strictly base64url fragment (no '+', '/', '=', spaces, or raw umlauts)", async () => {
    await generateCertificatePdf(
      makeData({ name: "JürgenÖßterreicher von und zu Häußler" }),
      AI_NATIVE_CONFIG,
    );
    const fragment = lastQrUrl().split("#")[1];
    expect(fragment).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("round-trips an umlaut name through the VerificationPage decode", async () => {
    await generateCertificatePdf(makeData({ name: "Tim Löhr" }), AI_NATIVE_CONFIG);
    const payload = decodeFragment(lastQrUrl());
    expect(payload).toEqual({
      n: "Tim Löhr",
      s: 90,
      m: "quiz",
      d: "2026-06-03T10:00:00.000Z",
      c: "ai-native",
      v: 1,
    });
  });

  it("round-trips spaces + special characters exactly", async () => {
    const name = "Müller & Söhne (München) — ÄÖÜ ß € \"Test\"";
    await generateCertificatePdf(makeData({ name }), KI_FUEHRERSCHEIN_CONFIG);
    const payload = decodeFragment(lastQrUrl());
    expect(payload.n).toBe(name);
    expect(payload.c).toBe("ki-fuehrerschein");
  });

  it("rounds the normalized score to a whole percentage", async () => {
    await generateCertificatePdf(makeData({ score: 0.875 }), AI_NATIVE_CONFIG);
    expect(decodeFragment(lastQrUrl()).s).toBe(88);
  });

  it("encodes capstone completion without a fake quiz score", async () => {
    await generateCertificatePdf(
      makeData({ score: null, completionMode: "capstone" }),
      AI_NATIVE_CONFIG,
    );
    expect(decodeFragment(lastQrUrl())).toMatchObject({
      s: null,
      m: "capstone",
      c: "ai-native",
    });
  });

  // plan 007 stage 4: third completionMode for courses whose eligibility path
  // is "all lessons done" rather than a quiz or capstone.
  it("encodes all-lessons-done completion without a fake quiz score", async () => {
    await generateCertificatePdf(
      makeData({ score: null, completionMode: "completion" }),
      KI_FUEHRERSCHEIN_CONFIG,
    );
    expect(decodeFragment(lastQrUrl())).toMatchObject({
      s: null,
      m: "completion",
      c: "ki-fuehrerschein",
    });
  });

  it("returns the jsPDF blob and encodes the QR once per certificate", async () => {
    const blob = await generateCertificatePdf(makeData(), AI_NATIVE_CONFIG);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/pdf");
    expect(qrToDataUrlMock).toHaveBeenCalledTimes(1);
    expect(qrToDataUrlMock).toHaveBeenCalledWith(
      expect.stringContaining("/verifizierung#"),
      expect.objectContaining({ width: 200 }),
    );
  });
});
