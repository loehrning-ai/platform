import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * /api/vorlagen/[slug]/download.pdf negative-path tests (regression coverage).
 * Asserts public access, the unknown-slug 404, and graceful failure when the generator
 * throws (no unhandled rejection, no partial stream). The PDF engine and the
 * template lookup are mocked so this stays a fast unit test.
 */

const mockGetVorlage = vi.fn<(slug: string) => unknown>(() => ({
  slug: "eu-ai-act-check",
}));
const mockGeneratePdf = vi.fn<() => Promise<Uint8Array>>(
  async () => new Uint8Array([37, 80, 68, 70]),
);

vi.mock("@/lib/vorlagen", () => ({
  getVorlageBySlug: (slug: string) => mockGetVorlage(slug),
}));
vi.mock("@/lib/pdf/vorlage-pdf", () => ({
  generateVorlagePdf: () => mockGeneratePdf(),
}));
vi.mock("@/lib/observability/api-error", () => ({ reportApiError: vi.fn() }));

import { GET } from "./route";

function req(): Request {
  return new Request(
    "http://localhost/api/vorlagen/eu-ai-act-check/download.pdf",
  );
}
function ctx(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe("GET /api/vorlagen/[slug]/download.pdf", () => {
  beforeEach(() => {
    mockGetVorlage.mockReset();
    mockGetVorlage.mockReturnValue({ slug: "eu-ai-act-check" });
    mockGeneratePdf.mockReset();
    mockGeneratePdf.mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
  });

  it("404 for an unknown template slug", async () => {
    mockGetVorlage.mockReturnValueOnce(null);
    expect((await GET(req(), ctx("no-such-template"))).status).toBe(404);
    expect(mockGeneratePdf).not.toHaveBeenCalled();
  });

  it("500 (graceful) when PDF generation throws", async () => {
    mockGeneratePdf.mockRejectedValueOnce(new Error("pdf engine down"));
    const res = await GET(req(), ctx("eu-ai-act-check"));
    expect(res.status).toBe(500);
    expect(await res.text()).toMatch(/PDF generation failed/);
  });

  it("200 streams a public PDF with attachment and noindex headers", async () => {
    const res = await GET(req(), ctx("eu-ai-act-check"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toMatch(/attachment/);
    expect(res.headers.get("Cache-Control")).toMatch(/^public/);
    expect(res.headers.get("X-Robots-Tag")).toContain("noindex");
  });
});
