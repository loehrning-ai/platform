import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, within } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  getRequestLocale: vi.fn(),
  isCvEngineHostedReady: vi.fn(),
  cvEngineHostedOrigin: vi.fn(),
  createAuthServerClient: vi.fn(),
  reportApiError: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: mocks.getRequestLocale,
}));
vi.mock("@/lib/provider-readiness", () => ({
  isCvEngineHostedReady: mocks.isCvEngineHostedReady,
  cvEngineHostedOrigin: mocks.cvEngineHostedOrigin,
}));
vi.mock("@/lib/supabase/auth-server", () => ({
  createAuthServerClient: mocks.createAuthServerClient,
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: mocks.reportApiError,
}));

import {
  CV_ENGINE_HANDOFF_ACTION,
  WerkzeugeRegionView,
  WerkzeugeSection,
  __resetCvEngineHealthProbes,
  loadWerkzeugeRegion,
  probeCvEngineHealth,
  type WerkzeugeRegionState,
} from "./werkzeuge";
import { WERKZEUGE_SECTION_ID } from "./werkzeuge-copy";

const ORIGIN = "https://cv.loehrning.ai";
const REPOSITORY = "https://github.com/loehrning-ai/cv-engine";
const GUIDE = "/open-source/tools/cv-engine";
/** The signed-in learner the page verified before it rendered the region. */
const USER_ID = "learner-1";

/**
 * A postgrest builder whose terminal `limit()` resolves to one answer.
 *
 * ONE builder object is shared by every link in the chain, exactly as
 * postgrest-js hands back `this`. A fake that returned a fresh object per call
 * would record each call on a different spy, so a filter applied anywhere but
 * the first position would be invisible to an assertion on the client - and a
 * dropped filter equally invisible.
 *
 * `limit()` REFUSES a read that carries no `user_id` filter, because that is
 * the read this card must never issue against a table whose policies this
 * repository does not own. That makes the predicate load-bearing for every
 * hosted case below instead of only for the one test that names it: without
 * it, the document numbers those cases assert never arrive.
 */
function documentsClient(answer: unknown) {
  const filters: [string, unknown][] = [];
  const chain: string[] = [];
  const builder = {
    select: vi.fn(() => {
      chain.push("select");
      return builder;
    }),
    eq: vi.fn((column: string, value: unknown) => {
      chain.push("eq");
      filters.push([column, value]);
      return builder;
    }),
    order: vi.fn(() => {
      chain.push("order");
      return builder;
    }),
    limit: vi.fn(() => {
      chain.push("limit");
      return filters.some(([column]) => column === "user_id")
        ? Promise.resolve(answer)
        : Promise.reject(new Error("documents read without a user_id filter"));
    }),
  };
  return { from: vi.fn(() => builder), builder, filters, chain };
}

function renderRegion(state: WerkzeugeRegionState) {
  const { container } = render(<WerkzeugeRegionView {...state} />);
  const region = container.querySelector(
    `#${WERKZEUGE_SECTION_ID}`,
  ) as HTMLElement;
  expect(region).not.toBeNull();
  return region;
}

const TOOL = { sourceHref: REPOSITORY, guideHref: GUIDE };

beforeEach(() => {
  vi.clearAllMocks();
  __resetCvEngineHealthProbes();
  mocks.getRequestLocale.mockResolvedValue("de");
  mocks.isCvEngineHostedReady.mockReturnValue(false);
  mocks.cvEngineHostedOrigin.mockReturnValue(null);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 200 })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("loadWerkzeugeRegion", () => {
  it("stays source-only, and reads nothing, while the hosted tool is off", async () => {
    const state = await loadWerkzeugeRegion(USER_ID);

    expect(state.cvEngine).toEqual({ kind: "source-only" });
    expect(state.tool).toEqual(TOOL);
    expect(state.locale).toBe("de");
    expect(mocks.getRequestLocale).toHaveBeenCalledTimes(1);
    expect(mocks.createAuthServerClient).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("takes a locale the caller already holds instead of reading the request", async () => {
    const state = await loadWerkzeugeRegion(USER_ID, "en");

    expect(state.locale).toBe("en");
    expect(mocks.getRequestLocale).not.toHaveBeenCalled();
  });

  it("falls back to the default locale when the request headers cannot be read", async () => {
    mocks.getRequestLocale.mockRejectedValue(
      new Error("headers() called outside a request scope"),
    );

    // The read runs inside the region's boundary, where a rejection would
    // become an error boundary over the whole account page.
    const state = await loadWerkzeugeRegion(USER_ID);

    expect(state.locale).toBe("de");
    expect(state.cvEngine).toEqual({ kind: "source-only" });
    expect(mocks.reportApiError).not.toHaveBeenCalled();
  });

  it("stays source-only when the origin does not validate", async () => {
    mocks.isCvEngineHostedReady.mockReturnValue(true);
    mocks.cvEngineHostedOrigin.mockReturnValue(null);

    expect((await loadWerkzeugeRegion(USER_ID)).cvEngine).toEqual({
      kind: "source-only",
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("takes the source and guide links from the published registry", async () => {
    const { tool } = await loadWerkzeugeRegion(USER_ID);

    expect(tool?.sourceHref).toBe(REPOSITORY);
    expect(tool?.guideHref).toBe(GUIDE);
  });

  describe("with the hosted tool configured", () => {
    beforeEach(() => {
      mocks.isCvEngineHostedReady.mockReturnValue(true);
      mocks.cvEngineHostedOrigin.mockReturnValue(ORIGIN);
    });

    it("filters the documents read to the signed-in learner", async () => {
      const client = documentsClient({
        data: [
          { title: "Lebenslauf 2026", updated_at: "2026-08-20T09:00:00.000Z" },
        ],
        error: null,
        count: 3,
      });
      mocks.createAuthServerClient.mockResolvedValue(client);

      const { cvEngine } = await loadWerkzeugeRegion(USER_ID);

      // `documents` belongs to the hosted cv-engine and no migration in this
      // repository defines its policies, so tenancy is asserted in
      // application code: exactly one owner filter, naming the column the
      // DSGVO export filters on and the id the page verified. A table
      // reachable with RLS off would otherwise print another learner's count.
      expect(client.from).toHaveBeenCalledWith("documents");
      expect(client.builder.eq).toHaveBeenCalledTimes(1);
      expect(client.builder.eq).toHaveBeenCalledWith("user_id", USER_ID);
      expect(client.filters).toEqual([["user_id", USER_ID]]);
      // The filter sits on the query that is actually sent, ahead of the
      // terminal call, not on a builder the read then discarded.
      expect(client.chain).toEqual(["select", "eq", "order", "limit"]);
      expect(cvEngine).toMatchObject({
        kind: "hosted",
        documents: { kind: "ready", count: 3 },
      });
    });

    it("reads nothing at all when no verified id reaches the region", async () => {
      // The count is a decoy: an unfiltered read would answer 7 here.
      const client = documentsClient({ data: [], error: null, count: 7 });
      mocks.createAuthServerClient.mockResolvedValue(client);

      const { cvEngine } = await loadWerkzeugeRegion(null);

      // An auth outage, or a deployment with no auth at all. With no owner to
      // filter by there is nothing safe to ask, so the card degrades to the
      // same shape an unreadable table produces. Not even the cookie-bound
      // client is created, and nothing is reported: nothing failed.
      expect(cvEngine).toMatchObject({
        kind: "hosted",
        documents: { kind: "unavailable" },
      });
      expect(mocks.createAuthServerClient).not.toHaveBeenCalled();
      expect(client.from).not.toHaveBeenCalled();
      expect(mocks.reportApiError).not.toHaveBeenCalled();
    });

    it("treats an empty id as no id rather than as a filter value", async () => {
      const client = documentsClient({ data: [], error: null, count: 7 });
      mocks.createAuthServerClient.mockResolvedValue(client);

      const { cvEngine } = await loadWerkzeugeRegion("");

      expect(cvEngine).toMatchObject({ documents: { kind: "unavailable" } });
      expect(client.from).not.toHaveBeenCalled();
    });

    it("counts documents and names the latest one", async () => {
      mocks.createAuthServerClient.mockResolvedValue(
        documentsClient({
          data: [
            { title: "Lebenslauf 2026", updated_at: "2026-08-20T09:00:00.000Z" },
          ],
          error: null,
          count: 3,
        }),
      );

      const { cvEngine } = await loadWerkzeugeRegion(USER_ID);

      expect(cvEngine).toEqual({
        kind: "hosted",
        origin: ORIGIN,
        documents: {
          kind: "ready",
          count: 3,
          latest: {
            title: "Lebenslauf 2026",
            updatedAt: "2026-08-20T09:00:00.000Z",
          },
        },
      });
    });

    it("bounds a learner-authored document title", async () => {
      mocks.createAuthServerClient.mockResolvedValue(
        documentsClient({
          data: [
            { title: "x".repeat(400), updated_at: "2026-08-20T09:00:00.000Z" },
          ],
          error: null,
          count: 1,
        }),
      );

      const { cvEngine } = await loadWerkzeugeRegion(USER_ID);

      const title =
        cvEngine.kind === "hosted" && cvEngine.documents.kind === "ready"
          ? cvEngine.documents.latest?.title
          : null;
      expect(title).toBe(`${"x".repeat(80)}...`);
    });

    it("degrades and reports when the documents query answers an error", async () => {
      mocks.createAuthServerClient.mockResolvedValue(
        documentsClient({
          data: null,
          error: { message: "relation does not exist", code: "PGRST205" },
          count: null,
        }),
      );

      const { cvEngine } = await loadWerkzeugeRegion(USER_ID);

      // A cv-engine schema that is not in this project is not a 500.
      expect(cvEngine).toMatchObject({
        kind: "hosted",
        documents: { kind: "unavailable" },
      });
      expect(mocks.reportApiError).toHaveBeenCalledWith(
        expect.objectContaining({ route: "/konto", step: "supabase-read" }),
      );
    });

    it("degrades and reports when the query throws", async () => {
      mocks.createAuthServerClient.mockResolvedValue({
        from: () => {
          throw new TypeError("connection closed");
        },
      });

      const { cvEngine } = await loadWerkzeugeRegion(USER_ID);

      expect(cvEngine).toMatchObject({ documents: { kind: "unavailable" } });
      expect(mocks.reportApiError).toHaveBeenCalledWith(
        expect.objectContaining({ route: "/konto", step: "supabase-read" }),
      );
    });

    it("degrades and reports when the cookie-bound client cannot be created", async () => {
      mocks.createAuthServerClient.mockRejectedValue(new Error("no cookies"));

      const { cvEngine } = await loadWerkzeugeRegion(USER_ID);

      expect(cvEngine).toMatchObject({ documents: { kind: "unavailable" } });
      expect(mocks.reportApiError).toHaveBeenCalledWith(
        expect.objectContaining({ route: "/konto", step: "auth-create-client" }),
      );
    });

    it("degrades without a report when the project has no auth configuration", async () => {
      mocks.createAuthServerClient.mockResolvedValue(null);

      const { cvEngine } = await loadWerkzeugeRegion(USER_ID);

      expect(cvEngine).toMatchObject({ documents: { kind: "unavailable" } });
      expect(mocks.reportApiError).not.toHaveBeenCalled();
    });

    it("probes a bounded health endpoint and accepts a healthy answer", async () => {
      mocks.createAuthServerClient.mockResolvedValue(
        documentsClient({ data: [], error: null, count: 0 }),
      );
      const probe = vi.fn<typeof fetch>(
        async () => new Response(null, { status: 200 }),
      );
      vi.stubGlobal("fetch", probe);

      const { cvEngine } = await loadWerkzeugeRegion(USER_ID);

      expect(cvEngine.kind).toBe("hosted");
      expect(probe).toHaveBeenCalledTimes(1);
      const [url, init] = probe.mock.calls[0] ?? [];
      expect(url).toBe(`${ORIGIN}/healthz`);
      expect(init?.redirect).toBe("error");
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    });

    it("switches to unreachable on a failing status", async () => {
      mocks.createAuthServerClient.mockResolvedValue(
        documentsClient({ data: [], error: null, count: 2 }),
      );
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(null, { status: 503 })),
      );

      expect((await loadWerkzeugeRegion(USER_ID)).cvEngine).toMatchObject({
        kind: "unreachable",
      });
    });

    it("switches to unreachable when the probe never connects", async () => {
      mocks.createAuthServerClient.mockResolvedValue(
        documentsClient({ data: [], error: null, count: 2 }),
      );
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          throw new TypeError("connect ECONNREFUSED");
        }),
      );

      const { cvEngine } = await loadWerkzeugeRegion(USER_ID);

      expect(cvEngine).toMatchObject({ kind: "unreachable" });
      // An outage of somebody else's deployment is a rendered state, not an
      // error report on every account render.
      expect(mocks.reportApiError).not.toHaveBeenCalled();
    });

    it("asks the health endpoint once per minute, not once per render", async () => {
      mocks.createAuthServerClient.mockResolvedValue(
        documentsClient({ data: [], error: null, count: 0 }),
      );
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-09-05T10:00:00.000Z"));

      await loadWerkzeugeRegion(USER_ID);
      await loadWerkzeugeRegion(USER_ID);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      vi.setSystemTime(new Date("2026-09-05T10:00:59.000Z"));
      await loadWerkzeugeRegion(USER_ID);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      vi.setSystemTime(new Date("2026-09-05T10:01:00.000Z"));
      await loadWerkzeugeRegion(USER_ID);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it("remembers an unreachable answer for the same minute", async () => {
      mocks.createAuthServerClient.mockResolvedValue(
        documentsClient({ data: [], error: null, count: 0 }),
      );
      const probe = vi.fn(async () => {
        throw new TypeError("connect ETIMEDOUT");
      });
      vi.stubGlobal("fetch", probe);

      const first = await loadWerkzeugeRegion(USER_ID);
      const second = await loadWerkzeugeRegion(USER_ID);

      // Remembering only the successes would make every render on a bad day
      // wait out the timeout again.
      expect(first.cvEngine.kind).toBe("unreachable");
      expect(second.cvEngine.kind).toBe("unreachable");
      expect(probe).toHaveBeenCalledTimes(1);
    });
  });
});

describe("probeCvEngineHealth", () => {
  it("shares one in-flight probe between concurrent renders", async () => {
    let settle: ((response: Response) => void) | undefined;
    const probe = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          settle = resolve;
        }),
    );
    vi.stubGlobal("fetch", probe);

    const pending = Promise.all([
      probeCvEngineHealth(ORIGIN, 1_000),
      probeCvEngineHealth(ORIGIN, 1_001),
    ]);
    expect(probe).toHaveBeenCalledTimes(1);
    settle?.(new Response(null, { status: 200 }));

    expect(await pending).toEqual([true, true]);
  });

  it("keeps separate memories per origin", async () => {
    await probeCvEngineHealth(ORIGIN, 1_000);
    await probeCvEngineHealth("https://cv2.loehrning.ai", 1_000);

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});

describe("WerkzeugeSection", () => {
  it("renders the source-only region in the same pass when given the locale", () => {
    const { container } = render(<WerkzeugeSection userId={USER_ID} locale="en" />);

    // No boundary, no await: the markup is there the moment the page is.
    const region = container.querySelector(`#${WERKZEUGE_SECTION_ID}`);
    expect(region).not.toBeNull();
    expect((region as HTMLElement).dataset.kontoWerkzeuge).toBe("source-only");
    expect(
      within(region as HTMLElement).getByRole("heading", {
        level: 2,
        name: "Tools",
      }),
    ).toBeVisible();
    expect(mocks.getRequestLocale).not.toHaveBeenCalled();
    expect(mocks.createAuthServerClient).not.toHaveBeenCalled();
  });

  it("shows only its fallback under react-dom, without looping, when it has to resolve the locale itself", async () => {
    // The shape konto/page.tsx renders today. Under react-dom the boundary
    // never settles and the server renderer is the one that resolves it (see
    // the module comment), so the point worth pinning is what react-dom does
    // NOT do: it must not re-enter the loader. A suspended component whose
    // promise were recreated per retry would spin here, and on the real page
    // that means a health probe per attempt against somebody else's host.
    const { container } = render(<WerkzeugeSection userId={USER_ID} />);
    expect(container).toBeEmptyDOMElement();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(container).toBeEmptyDOMElement();
    expect(mocks.getRequestLocale).toHaveBeenCalledTimes(1);
  });
});

describe("WerkzeugeRegionView", () => {
  it("offers source and self-host only, and claims no hosted instance", () => {
    const region = renderRegion({
      locale: "de",
      tool: TOOL,
      cvEngine: { kind: "source-only" },
    });

    expect(region.dataset.kontoWerkzeuge).toBe("source-only");
    expect(
      within(region).getByRole("heading", { level: 2, name: "Werkzeuge" }),
    ).toBeVisible();
    expect(
      within(region).getByRole("link", { name: /Quellcode/ }),
    ).toHaveAttribute("href", REPOSITORY);
    expect(
      within(region).getByRole("link", { name: "Selbst betreiben" }),
    ).toHaveAttribute("href", GUIDE);
    expect(within(region).queryByRole("button", { name: /Öffnen/ })).toBeNull();
    expect(region.querySelector("form")).toBeNull();
    expect(
      within(region).getByText(/läuft das Werkzeug nicht gehostet/),
    ).toBeVisible();
  });

  it("mirrors the region into English", () => {
    const region = renderRegion({
      locale: "en",
      tool: TOOL,
      cvEngine: { kind: "source-only" },
    });

    expect(
      within(region).getByRole("heading", { level: 2, name: "Tools" }),
    ).toBeVisible();
    expect(
      within(region).getByRole("link", { name: "Run it yourself" }),
    ).toHaveAttribute("href", `/en${GUIDE}`);
  });

  it("shows the count, the last edit and the open form when hosted", () => {
    const region = renderRegion({
      locale: "de",
      tool: TOOL,
      cvEngine: {
        kind: "hosted",
        origin: ORIGIN,
        documents: {
          kind: "ready",
          count: 3,
          latest: {
            title: "Lebenslauf 2026",
            updatedAt: "2026-08-20T09:00:00.000Z",
          },
        },
      },
    });

    expect(region.dataset.kontoWerkzeuge).toBe("hosted");
    expect(within(region).getByText(/3 Dokumente/)).toBeVisible();
    expect(within(region).getByText(/Lebenslauf 2026/)).toBeVisible();
    expect(within(region).getByText(/20\.8\.2026/)).toBeVisible();

    // Opening mints a one-time credential on the server, so it is a POST
    // form with no fields, never a link a prefetch could follow.
    const open = within(region).getByRole("button", { name: /Öffnen/ });
    expect(open).toHaveAttribute("type", "submit");
    const form = open.closest("form");
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", CV_ENGINE_HANDOFF_ACTION);
    expect(form?.querySelectorAll("input, select, textarea")).toHaveLength(0);
    expect(within(region).queryByRole("link", { name: /Öffnen/ })).toBeNull();
  });

  it("names an empty document store rather than showing a zero", () => {
    const region = renderRegion({
      locale: "de",
      tool: TOOL,
      cvEngine: {
        kind: "hosted",
        origin: ORIGIN,
        documents: { kind: "ready", count: 0, latest: null },
      },
    });

    expect(within(region).getByText("Noch kein Dokument angelegt.")).toBeVisible();
    expect(within(region).queryByText(/0 Dokumente/)).toBeNull();
  });

  it("says the documents are unreadable without hiding the tool", () => {
    const region = renderRegion({
      locale: "de",
      tool: TOOL,
      cvEngine: {
        kind: "hosted",
        origin: ORIGIN,
        documents: { kind: "unavailable" },
      },
    });

    expect(
      within(region).getByText(/Dokumente lassen sich gerade nicht lesen/),
    ).toBeVisible();
    expect(within(region).getByRole("button", { name: /Öffnen/ })).toBeVisible();
  });

  it("closes the door on an unreachable deployment and keeps both links", () => {
    const region = renderRegion({
      locale: "de",
      tool: TOOL,
      cvEngine: {
        kind: "unreachable",
        documents: { kind: "ready", count: 2, latest: null },
      },
    });

    expect(region.dataset.kontoWerkzeuge).toBe("unreachable");
    expect(within(region).getByRole("status")).toHaveTextContent(
      /vorübergehend nicht erreichbar/,
    );
    expect(within(region).queryByRole("button", { name: /Öffnen/ })).toBeNull();
    expect(region.querySelector("form")).toBeNull();
    expect(
      within(region).getByRole("link", { name: /Quellcode/ }),
    ).toHaveAttribute("href", REPOSITORY);
    expect(within(region).getByText(/2 Dokumente/)).toBeVisible();
  });

  it("renders the card without links when the registry has no such tool", () => {
    const region = renderRegion({
      locale: "de",
      tool: null,
      cvEngine: { kind: "source-only" },
    });

    expect(within(region).queryAllByRole("link")).toHaveLength(0);
    expect(
      within(region).getByRole("heading", { level: 3, name: "CV Engine" }),
    ).toBeVisible();
  });
});
