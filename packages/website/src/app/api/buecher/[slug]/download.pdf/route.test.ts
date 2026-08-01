import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  getBookById: vi.fn(),
  generateBookPdf: vi.fn(),
  reportApiError: vi.fn(),
  consumeRateLimit: vi.fn(),
  hashedAuthenticatedRateLimitKey: vi.fn(),
  hashedClientRateLimitKey: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));
vi.mock("@/lib/books", () => ({ getBookById: mocks.getBookById }));
vi.mock("@/lib/pdf/book-pdf", () => ({
  generateBookPdf: mocks.generateBookPdf,
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: mocks.reportApiError,
}));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  hashedAuthenticatedRateLimitKey: mocks.hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey: mocks.hashedClientRateLimitKey,
}));

import { GET } from "./route";

function call(
  slug: string,
  request = new Request(
    `https://loehrning.ai/api/buecher/${slug}/download.pdf`,
  ),
) {
  return GET(request, { params: Promise.resolve({ slug }) });
}

function expectPrivateResponse(response: Response): void {
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("x-robots-tag")).toBe(
    "noindex, nofollow, noarchive",
  );
  expect(
    (response.headers.get("vary") ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase()),
  ).toContain("cookie");
}

describe("book PDF download route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getBookById.mockImplementation((slug: string) => ({
      id: slug,
      pdfPath: `/api/buecher/${slug}/download.pdf`,
    }));
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: { id: "user-1" },
      error: null,
    });
    mocks.hashedAuthenticatedRateLimitKey.mockResolvedValue("user-key");
    mocks.hashedClientRateLimitKey.mockResolvedValue("ip-key");
    mocks.consumeRateLimit.mockResolvedValue(true);
    mocks.generateBookPdf.mockResolvedValue(Buffer.from("%PDF-test"));
  });

  it("fails closed before authentication for an unknown book", async () => {
    mocks.getBookById.mockReturnValue(undefined);
    const response = await call("missing");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found" });
    expectPrivateResponse(response);
    expect(mocks.getAuthenticatedUser).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: "a published book without a PDF",
      slug: "no-pdf",
      book: { id: "no-pdf", pdfPath: null },
    },
    {
      label: "a mismatched PDF path",
      slug: "wrong-pdf",
      book: {
        id: "wrong-pdf",
        pdfPath: "/api/buecher/another-book/download.pdf",
      },
    },
    {
      label: "a non-canonical book id",
      slug: "alias",
      book: {
        id: "canonical-id",
        pdfPath: "/api/buecher/canonical-id/download.pdf",
      },
    },
  ])("returns private 404 before auth for $label", async ({ book, slug }) => {
    mocks.getBookById.mockReturnValue(book);
    const response = await call(slug);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found" });
    expectPrivateResponse(response);
    expect(mocks.getAuthenticatedUser).not.toHaveBeenCalled();
    expect(mocks.generateBookPdf).not.toHaveBeenCalled();
  });

  it("distinguishes auth outage from an anonymous session", async () => {
    const authError = new Error("provider unavailable");
    mocks.getAuthenticatedUser.mockResolvedValueOnce({
      configured: true,
      user: null,
      error: authError,
    });
    const outage = await call("auth-outage");
    expect(outage.status).toBe(503);
    expect(await outage.json()).toEqual({ error: "auth_unavailable" });
    expectPrivateResponse(outage);
    expect(mocks.reportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "auth-get-user",
        error: authError,
      }),
    );

    mocks.getAuthenticatedUser.mockResolvedValueOnce({
      configured: true,
      user: null,
      error: null,
    });
    const anonymous = await call("anonymous");
    expect(anonymous.status).toBe(401);
    expect(await anonymous.json()).toEqual({ error: "unauthorized" });
    expectPrivateResponse(anonymous);
  });

  it("returns a private 503 when authentication is not configured", async () => {
    mocks.getAuthenticatedUser.mockResolvedValueOnce({
      configured: false,
      user: null,
      error: null,
    });

    const response = await call("not-configured");

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "auth_not_configured" });
    expectPrivateResponse(response);
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled();
  });

  it("reports a rejected auth lookup and returns a private 503", async () => {
    const authError = new Error("auth lookup rejected");
    mocks.getAuthenticatedUser.mockRejectedValueOnce(authError);

    const response = await call("auth-rejected");

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "auth_unavailable" });
    expectPrivateResponse(response);
    expect(mocks.reportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "auth-get-user",
        error: authError,
      }),
    );
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled();
  });

  it("checks the per-user budget before consuming the shared IP budget", async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce(false);
    const response = await call("user-limited");

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "rate_limit_exceeded" });
    expect(response.headers.get("retry-after")).toBe("3600");
    expectPrivateResponse(response);
    expect(mocks.consumeRateLimit).toHaveBeenCalledTimes(1);
    expect(mocks.hashedClientRateLimitKey).not.toHaveBeenCalled();
    expect(mocks.generateBookPdf).not.toHaveBeenCalled();
  });

  it("checks the shared IP budget after the per-user budget", async () => {
    mocks.consumeRateLimit
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const response = await call("ip-limited");

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "rate_limit_exceeded" });
    expect(response.headers.get("retry-after")).toBe("3600");
    expectPrivateResponse(response);
    expect(mocks.consumeRateLimit).toHaveBeenCalledTimes(2);
    expect(mocks.hashedClientRateLimitKey).toHaveBeenCalledTimes(1);
    expect(mocks.generateBookPdf).not.toHaveBeenCalled();
  });

  it("fails closed and reports any durable limiter error", async () => {
    const limiterError = new Error("durable limiter rejected");
    mocks.consumeRateLimit.mockRejectedValueOnce(limiterError);
    const response = await call("limiter-outage");

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "rate_limit_unavailable",
    });
    expectPrivateResponse(response);
    expect(mocks.reportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "rate-limit",
        error: limiterError,
      }),
    );
    expect(mocks.generateBookPdf).not.toHaveBeenCalled();
  });

  it("fails closed when the shared IP limiter errors", async () => {
    const limiterError = new Error("IP limiter rejected");
    mocks.consumeRateLimit
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(limiterError);

    const response = await call("ip-limiter-outage");

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "rate_limit_unavailable",
    });
    expectPrivateResponse(response);
    expect(mocks.consumeRateLimit).toHaveBeenCalledTimes(2);
    expect(mocks.reportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "rate-limit",
        error: limiterError,
      }),
    );
    expect(mocks.generateBookPdf).not.toHaveBeenCalled();
  });

  it("returns a private PDF and reuses the generated buffer for the same book", async () => {
    const first = await call("cached");
    const second = await call("cached");

    expect(first.status).toBe(200);
    expect(first.headers.get("content-type")).toContain("application/pdf");
    expect(first.headers.get("content-disposition")).toBe(
      'attachment; filename="cached.pdf"',
    );
    expectPrivateResponse(first);
    expect(second.status).toBe(200);
    expectPrivateResponse(second);
    expect(mocks.generateBookPdf).toHaveBeenCalledTimes(1);
  });

  it("evicts a failed generation so the next request can retry", async () => {
    const renderError = new Error("render failed");
    mocks.generateBookPdf
      .mockRejectedValueOnce(renderError)
      .mockResolvedValueOnce(Buffer.from("%PDF-retry"));

    const failed = await call("retry");
    expect(failed.status).toBe(500);
    expect(await failed.json()).toEqual({ error: "pdf_generation_failed" });
    expectPrivateResponse(failed);
    expect(mocks.reportApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "pdf-generate",
        error: renderError,
      }),
    );
    const retried = await call("retry");
    expect(retried.status).toBe(200);
    expectPrivateResponse(retried);
    expect(mocks.generateBookPdf).toHaveBeenCalledTimes(2);
  });
});
