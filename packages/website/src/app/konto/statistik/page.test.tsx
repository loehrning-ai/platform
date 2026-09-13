import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { AdminAggregates } from "@/lib/admin/analytics-aggregates";
import type { VercelAnalytics } from "@/lib/admin/vercel-analytics";
import { STATISTIK_COPY } from "./statistik-copy";

const mocks = vi.hoisted(() => ({
  requireAdminUser: vi.fn(),
  readAdminAggregates: vi.fn(),
  readVercelAnalytics: vi.fn(),
  getRequestLocale: vi.fn(),
  reportApiError: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));
vi.mock("@/lib/auth/admin-identity", () => ({
  requireAdminUser: mocks.requireAdminUser,
}));
vi.mock("@/lib/admin/analytics-aggregates", () => ({
  GLOBAL_ACTIVITY_FLOOR: 20,
  MIN_REPORTABLE_COUNT: 5,
  readAdminAggregates: mocks.readAdminAggregates,
}));
vi.mock("@/lib/admin/vercel-analytics", () => ({
  readVercelAnalytics: mocks.readVercelAnalytics,
}));
vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: mocks.getRequestLocale,
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: mocks.reportApiError,
}));

import KontoStatistikPage, { dynamic, generateMetadata } from "./page";

const NOT_FOUND = new Error("NEXT_NOT_FOUND");
const REDIRECT = new Error("NEXT_REDIRECT");
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const READY_AGGREGATES: AdminAggregates = {
  state: "ready",
  totals: {
    courseProgress: 812,
    assessmentRuns: 347,
    assessmentAnswers: "suppressed",
    betaFeedback: 26,
  },
  unavailableTotals: ["agentAccessEvents", "agentAccessTokens", "accountLlmKeys"],
  courses: [{ slug: "ki-fuehrerschein", count: 431 }],
  coursesIncomplete: true,
};

const READY_ANALYTICS: VercelAnalytics = {
  state: "ready",
  windowDays: 30,
  totals: { state: "ready", data: { pageviews: 9876, visitors: 543 } },
  routes: { state: "ready", data: [{ value: "/kurse/[slug]", count: 219 }] },
  events: { state: "ready", data: [{ value: "course_started", count: 88 }] },
  courseStarts: {
    state: "ready",
    data: [{ value: "eu-ai-act-kurs", count: 61 }],
  },
  lessonCompletions: { state: "ready", data: [] },
  courseCompletionSteps: { state: "unavailable" },
};

async function renderPage() {
  const element = await KontoStatistikPage();
  return render(element);
}

function assertNoPersonalData(container: HTMLElement) {
  const text = container.textContent ?? "";
  expect(text).not.toMatch(EMAIL_PATTERN);
  expect(text).not.toMatch(UUID_PATTERN);
  for (const anchor of Array.from(container.querySelectorAll("a"))) {
    expect(anchor.getAttribute("href") ?? "").not.toMatch(UUID_PATTERN);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getRequestLocale.mockResolvedValue("de");
  mocks.readAdminAggregates.mockResolvedValue(READY_AGGREGATES);
  mocks.readVercelAnalytics.mockResolvedValue(READY_ANALYTICS);
  mocks.notFound.mockImplementation(() => {
    throw NOT_FOUND;
  });
  mocks.redirect.mockImplementation(() => {
    throw REDIRECT;
  });
});

afterEach(() => {
  cleanup();
});

describe("/konto/statistik gate", () => {
  it("is a dynamic, noindex page", async () => {
    expect(dynamic).toBe("force-dynamic");
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(STATISTIK_COPY.de.metadata.title);
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it.each(["denied", "disabled"] as const)(
    "answers %s with the ordinary 404 and never reads a figure",
    async (state) => {
      mocks.requireAdminUser.mockResolvedValue(state);
      await expect(KontoStatistikPage()).rejects.toBe(NOT_FOUND);
      expect(mocks.notFound).toHaveBeenCalledTimes(1);
      expect(mocks.redirect).not.toHaveBeenCalled();
      expect(mocks.readAdminAggregates).not.toHaveBeenCalled();
      expect(mocks.readVercelAnalytics).not.toHaveBeenCalled();
      expect(mocks.reportApiError).not.toHaveBeenCalled();
    },
  );

  it("runs the gate before resolving anything else", async () => {
    const order: string[] = [];
    mocks.requireAdminUser.mockImplementation(async () => {
      order.push("gate");
      return "denied";
    });
    mocks.getRequestLocale.mockImplementation(async () => {
      order.push("locale");
      return "de";
    });
    await expect(KontoStatistikPage()).rejects.toBe(NOT_FOUND);
    expect(order[0]).toBe("gate");
  });

  it("sends a signed-out visitor to the login page with the statistics as next", async () => {
    mocks.requireAdminUser.mockResolvedValue("signed-out");
    await expect(KontoStatistikPage()).rejects.toBe(REDIRECT);
    expect(mocks.redirect).toHaveBeenCalledWith("/login?next=/konto/statistik");
    expect(mocks.readAdminAggregates).not.toHaveBeenCalled();
    expect(mocks.readVercelAnalytics).not.toHaveBeenCalled();
  });

  it("localizes the login redirect for the English mirror", async () => {
    mocks.requireAdminUser.mockResolvedValue("signed-out");
    mocks.getRequestLocale.mockResolvedValue("en");
    await expect(KontoStatistikPage()).rejects.toBe(REDIRECT);
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/en/login?next=/en/konto/statistik",
    );
  });

  it("renders a degraded alert with no figures when the gate is unavailable", async () => {
    mocks.requireAdminUser.mockResolvedValue("unavailable");
    const { container } = await renderPage();
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain(STATISTIK_COPY.de.unavailableTitle);
    expect(container.textContent ?? "").not.toMatch(/\d/);
    expect(mocks.reportApiError).toHaveBeenCalledTimes(1);
    expect(mocks.reportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ route: "/konto/statistik" }),
    );
    expect(mocks.readAdminAggregates).not.toHaveBeenCalled();
    expect(mocks.readVercelAnalytics).not.toHaveBeenCalled();
    expect(mocks.notFound).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("explains the 24-hour rule for a stale sign-in and offers sign-out then sign-in, without redirecting", async () => {
    mocks.requireAdminUser.mockResolvedValue("reauth");
    const { container } = await renderPage();
    const panel = screen.getByTestId("statistik-reauth");
    expect(panel.textContent).toContain(STATISTIK_COPY.de.reauthBody);
    expect(STATISTIK_COPY.de.reauthBody).toContain("24 Stunden");
    expect(STATISTIK_COPY.en.reauthBody).toContain("24 hours");

    const form = container.querySelector("form");
    expect(form?.getAttribute("action")).toBe("/auth/logout");
    expect(form?.getAttribute("method")).toBe("post");
    const signIn = screen.getByRole("link", {
      name: STATISTIK_COPY.de.reauthSignIn,
    });
    expect(signIn.getAttribute("href")).toBe("/login?next=/konto/statistik");
    // Sign-out comes before the sign-in link in document order.
    expect(
      form!.compareDocumentPosition(signIn) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.notFound).not.toHaveBeenCalled();
    expect(mocks.readAdminAggregates).not.toHaveBeenCalled();
    expect(mocks.readVercelAnalytics).not.toHaveBeenCalled();
    expect(container.textContent ?? "").not.toMatch(/\d{3,}/);
  });

  it("fails closed when a reader's own gate check disagrees", async () => {
    mocks.requireAdminUser.mockResolvedValue("admin");
    mocks.readVercelAnalytics.mockResolvedValue(null);
    await expect(KontoStatistikPage()).rejects.toBe(NOT_FOUND);
  });
});

describe("/konto/statistik figures", () => {
  beforeEach(() => {
    mocks.requireAdminUser.mockResolvedValue("admin");
  });

  it("shows only the insufficient-data state below the activity floor", async () => {
    mocks.readAdminAggregates.mockResolvedValue({ state: "insufficient-data" });
    mocks.readVercelAnalytics.mockResolvedValue({ state: "disabled" });
    const { container } = await renderPage();
    expect(screen.getByTestId("statistik-insufficient").textContent).toBe(
      STATISTIK_COPY.de.insufficientData,
    );
    expect(screen.queryByRole("table")).toBeNull();
    expect(
      screen.queryByLabelText(STATISTIK_COPY.de.totalsLabel),
    ).toBeNull();
    // The only digits left are the threshold constants in the footnote.
    const digits = (container.textContent ?? "").match(/\d+/g) ?? [];
    expect(new Set(digits)).toEqual(new Set(["20", "5"]));
    assertNoPersonalData(container);
  });

  it("renders platform head-counts, suppressed and unavailable markers", async () => {
    const { container } = await renderPage();
    const copy = STATISTIK_COPY.de;
    const totals = screen.getByLabelText(copy.totalsLabel);
    expect(totals.textContent).toContain("812");
    expect(totals.textContent).toContain("347");
    expect(totals.textContent).toContain(copy.suppressed);
    expect(totals.textContent).toContain(copy.metricUnavailable);
    expect(container.textContent).toContain("KI-Führerschein");
    expect(container.textContent).toContain("431");
    expect(container.textContent).toContain(copy.coursesIncomplete);
    expect(container.textContent).toContain(copy.accountTotalsNote);
    expect(container.textContent).toContain(copy.ownerRowsNote);
    expect(container.textContent).toContain(copy.thresholdNote(20, 5));
    expect(mocks.readVercelAnalytics).toHaveBeenCalledWith({
      now: expect.any(Date),
    });
    assertNoPersonalData(container);
  });

  it("renders a platform read failure as an alert and never as zero", async () => {
    mocks.readAdminAggregates.mockResolvedValue({ state: "unavailable" });
    mocks.readVercelAnalytics.mockResolvedValue({ state: "not-enabled" });
    const { container } = await renderPage();
    expect(screen.getByRole("alert").textContent).toBe(
      STATISTIK_COPY.de.platformUnavailable,
    );
    expect(container.textContent).toContain(STATISTIK_COPY.de.reachNotEnabled);
    expect(screen.queryByRole("table")).toBeNull();
    expect(container.textContent ?? "").not.toMatch(/\b0\b/);
  });

  it("renders Vercel totals, breakdowns and each section's own empty or unavailable state", async () => {
    const { container } = await renderPage();
    const copy = STATISTIK_COPY.de;
    const reach = screen.getByLabelText(copy.reachTotalsLabel);
    expect(reach.textContent).toContain("9.876");
    expect(reach.textContent).toContain("543");
    expect(container.textContent).toContain(copy.reachIntro(30));
    expect(container.textContent).toContain("/kurse/[slug]");
    expect(container.textContent).toContain("course_started");
    expect(container.textContent).toContain("EU AI Act Kurs");
    expect(container.textContent).toContain(copy.sectionEmpty);
    expect(container.textContent).toContain(copy.sectionUnavailable);
    expect(screen.getAllByRole("table")).toHaveLength(4);
    assertNoPersonalData(container);
  });

  it("renders the disabled Vercel state without numbers", async () => {
    mocks.readVercelAnalytics.mockResolvedValue({ state: "disabled" });
    const { container } = await renderPage();
    expect(container.textContent).toContain(STATISTIK_COPY.de.reachDisabled);
    expect(
      screen.queryByLabelText(STATISTIK_COPY.de.reachTotalsLabel),
    ).toBeNull();
  });

  it("renders English copy and number formatting on the mirror", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");
    const { container } = await renderPage();
    expect(container.textContent).toContain(STATISTIK_COPY.en.platformHeading);
    expect(container.textContent).toContain("9,876");
    assertNoPersonalData(container);
  });
});

describe("/konto/statistik directory", () => {
  const directory = __dirname;
  const sources = readdirSync(directory).filter((name) =>
    /\.(ts|tsx)$/.test(name),
  );

  it("contains no client component", () => {
    expect(sources.length).toBeGreaterThan(0);
    for (const name of sources) {
      const source = readFileSync(join(directory, name), "utf8");
      expect(source, name).not.toMatch(/^\s*["']use client["']/m);
    }
  });

  it("uses no prefetching link and derives no request host", () => {
    const page = readFileSync(join(directory, "page.tsx"), "utf8");
    expect(page).not.toMatch(/from "next\/link"/);
    expect(page).not.toMatch(/next\/headers/);
    expect(page).not.toMatch(/\bheaders\(\)/);
    expect(page).not.toMatch(/x-forwarded-host|\.host\b|nextUrl|\borigin:/i);
  });
});
