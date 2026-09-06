import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { UNIFIED_STORAGE_KEY } from "@/lib/progress/types";
import { ImportProgressIsland } from "./import-progress-island";
import {
  coerceProgressView,
  readAnonymousSnapshot,
} from "./local-progress-snapshot";
import { countLabel, importErrorMessage } from "./import-progress-copy";

const OWNER = "learner-1";

/** A v3 snapshot with one started course and one completed lesson. */
function snapshot(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 3,
    courses: {
      "ki-fuehrerschein": {
        lessons: {
          "block-1-lektion-1": {
            sectionsRead: ["intro"],
            quizScore: 1,
            quizTotal: 1,
            completed: true,
            exercisesCompleted: {},
          },
        },
        workshopQuiz: { passed: false, score: 0, completedAt: null },
        capstoneSubmitted: false,
        startedAt: "2026-08-01T10:00:00.000Z",
        lastActivity: "2026-08-02T10:00:00.000Z",
      },
    },
    xp: 25,
    checkpoints: { "block-1-lektion-1::cp-1": true },
    badges: { "first-lesson": "2026-08-02T10:00:00.000Z" },
    streak: { days: 2, last: "2026-08-02" },
    lastActivity: "2026-08-02T10:00:00.000Z",
    ...overrides,
  };
}

function seedLocal(value: unknown): void {
  window.localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(value));
}

interface StubbedCall {
  readonly url: string;
  readonly init: RequestInit | undefined;
}

function stubFetch(
  handlers: Record<string, () => Response | Promise<Response>>,
): { readonly calls: StubbedCall[] } {
  const calls: StubbedCall[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      const handler = handlers[url];
      if (!handler) throw new Error(`unexpected fetch: ${url}`);
      return handler();
    }),
  );
  return { calls };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** The account read the island performs before it offers anything. */
function accountResponse(progress: unknown = null) {
  return json({ ownerId: OWNER, progress, updatedAt: null });
}

/** Press the confirm control and let the resulting request settle. */
async function confirm(button: HTMLElement): Promise<void> {
  await act(async () => {
    fireEvent.click(button);
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("local progress snapshot reading", () => {
  it("reads nothing when the anonymous namespace is empty", () => {
    expect(readAnonymousSnapshot()).toBeNull();
  });

  it("reads nothing for unparseable or older-schema stored values", () => {
    window.localStorage.setItem(UNIFIED_STORAGE_KEY, "{not json");
    expect(readAnonymousSnapshot()).toBeNull();

    seedLocal(snapshot({ schemaVersion: 2 }));
    expect(readAnonymousSnapshot()).toBeNull();
  });

  it("keeps the raw stored value for the request and projects a counting view", () => {
    seedLocal(snapshot());
    const result = readAnonymousSnapshot();

    // The raw payload keeps checkpoints and badges, which the counting view
    // deliberately drops. Posting the projection would lose learner data.
    expect(result?.raw).toMatchObject({
      checkpoints: { "block-1-lektion-1::cp-1": true },
      badges: { "first-lesson": "2026-08-02T10:00:00.000Z" },
    });
    expect(result?.view.checkpoints).toEqual({});
    expect(
      result?.view.courses["ki-fuehrerschein"]?.lessons[
        "block-1-lektion-1"
      ]?.completed,
    ).toBe(true);
  });

  it("survives hostile field types instead of throwing", () => {
    const view = coerceProgressView({
      schemaVersion: 3,
      courses: {
        "ki-fuehrerschein": {
          lessons: { broken: null, ok: { completed: true } },
          workshopQuiz: "not an object",
          startedAt: 17,
        },
        "not-a-course": { lessons: {} },
      },
    });

    const slice = view?.courses["ki-fuehrerschein"];
    expect(Object.keys(slice?.lessons ?? {})).toEqual(["ok"]);
    expect(slice?.workshopQuiz).toEqual({
      passed: false,
      score: 0,
      completedAt: null,
    });
    expect(Object.keys(view?.courses ?? {})).toEqual(["ki-fuehrerschein"]);
  });
});

describe("named import errors", () => {
  it("has copy for every error name the import route can answer with", () => {
    const routeSource = readFileSync(
      join(__dirname, "../api/progress/import/route.ts"),
      "utf8",
    );
    const named = new Set(
      Array.from(routeSource.matchAll(/error:\s*"([a-z_]+)"/g), (m) => m[1]),
    );
    // Answered with its own timestamp, so it is formatted rather than looked up.
    named.delete("progress_already_imported");
    expect(named.size).toBeGreaterThan(5);

    for (const name of named) {
      for (const locale of ["de", "en"] as const) {
        expect(
          importErrorMessage(locale, { error: name }),
          `${locale}: ${name}`,
        ).not.toBe(importErrorMessage(locale, { error: "___unknown___" }));
      }
    }
  });

  it("names the date a previous import happened", () => {
    expect(
      importErrorMessage("de", {
        error: "progress_already_imported",
        importedAt: "2026-08-20T09:00:00.000Z",
      }),
    ).toContain("20.8.2026");
  });

  it("falls back without leaking a status code", () => {
    const message = importErrorMessage("en", { error: "surprise" });
    expect(message).toContain("connection to the server failed");
    expect(message).not.toMatch(/\d{3}/);
  });
});

describe("count labels", () => {
  it("uses singular and plural forms in both locales", () => {
    expect(countLabel("de", 1, "courses")).toBe("1 Kurs");
    expect(countLabel("de", 2, "lessons")).toBe("2 Lektionen");
    expect(countLabel("en", 1, "lessons")).toBe("1 lesson");
    expect(countLabel("en", 3, "courses")).toBe("3 courses");
  });
});

describe("ImportProgressIsland", () => {
  it("renders nothing and asks the server nothing without local data", async () => {
    const { calls } = stubFetch({});
    const { container } = render(<ImportProgressIsland locale="de" />);

    await Promise.resolve();
    expect(container).toBeEmptyDOMElement();
    expect(calls).toHaveLength(0);
  });

  it("renders nothing when the account already holds the snapshot", async () => {
    seedLocal(snapshot());
    stubFetch({
      "/api/progress": () => accountResponse(snapshot()),
    });
    const { container } = render(<ImportProgressIsland locale="de" />);

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders nothing when the account read fails", async () => {
    seedLocal(snapshot());
    stubFetch({
      "/api/progress": () => json({ error: "progress_read_failed" }, 500),
    });
    const { container } = render(<ImportProgressIsland locale="de" />);

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it("previews the courses and lessons that would merge", async () => {
    seedLocal(snapshot());
    stubFetch({ "/api/progress": () => accountResponse(null) });
    render(<ImportProgressIsland locale="de" />);

    const offer = await screen.findByText(/1 Kurs, 1 Lektion/);
    expect(offer).toBeVisible();
    expect(
      screen.getByRole("button", { name: /Lokalen Fortschritt übernehmen/ }),
    ).toBeVisible();
  });

  it("posts the raw snapshot with the server-derived owner and reports the result", async () => {
    seedLocal(snapshot());
    const { calls } = stubFetch({
      "/api/progress": () => accountResponse(null),
      "/api/progress/import": () =>
        json({
          ok: true,
          importedAt: "2026-09-05T09:00:00.000Z",
          merged: { courses: 1, lessons: 2 },
        }),
    });
    render(<ImportProgressIsland locale="de" />);

    await confirm(
      await screen.findByRole("button", {
        name: /Lokalen Fortschritt übernehmen/,
      }),
    );

    await screen.findByText(/1 Kurs und 2 Lektionen sind jetzt in deinem Konto/);
    const posted = calls.find((call) => call.url === "/api/progress/import");
    expect(posted?.init?.method).toBe("POST");
    // The route answers 415 to anything but this exact media type.
    expect(new Headers(posted?.init?.headers).get("content-type")).toBe(
      "application/json",
    );
    const body = JSON.parse(String(posted?.init?.body)) as {
      expectedOwnerId: string;
      progress: Record<string, unknown>;
    };
    expect(body.expectedOwnerId).toBe(OWNER);
    // The raw namespace, not the counting projection.
    expect(body.progress).toEqual(snapshot());
  });

  it("leaves the anonymous namespace untouched by a confirmed import", async () => {
    const stored = snapshot();
    seedLocal(stored);
    stubFetch({
      "/api/progress": () => accountResponse(null),
      "/api/progress/import": () =>
        json({ ok: true, merged: { courses: 1, lessons: 1 } }),
    });
    render(<ImportProgressIsland locale="de" />);

    await confirm(
      await screen.findByRole("button", {
        name: /Lokalen Fortschritt übernehmen/,
      }),
    );
    await screen.findByText(/sind jetzt in deinem Konto/);

    expect(
      JSON.parse(String(window.localStorage.getItem(UNIFIED_STORAGE_KEY))),
    ).toEqual(stored);
  });

  it("says nothing moved when the merge added nothing", async () => {
    seedLocal(snapshot());
    stubFetch({
      "/api/progress": () => accountResponse(null),
      "/api/progress/import": () =>
        json({ ok: true, merged: { courses: 0, lessons: 0 } }),
    });
    render(<ImportProgressIsland locale="de" />);

    await confirm(
      await screen.findByRole("button", {
        name: /Lokalen Fortschritt übernehmen/,
      }),
    );
    expect(
      await screen.findByText(/Dein Konto war bereits auf demselben Stand/),
    ).toBeVisible();
  });

  it("never puts a negative or fractional count into the sentence", async () => {
    seedLocal(snapshot());
    stubFetch({
      "/api/progress": () => accountResponse(null),
      "/api/progress/import": () =>
        json({ ok: true, merged: { courses: 1.7, lessons: -4 } }),
    });
    render(<ImportProgressIsland locale="de" />);

    await confirm(
      await screen.findByRole("button", {
        name: /Lokalen Fortschritt übernehmen/,
      }),
    );

    // Both numbers go straight into a sentence, so the response is narrowed
    // like any other untrusted boundary value rather than interpolated raw.
    const done = await screen.findByText(/sind jetzt in deinem Konto/);
    expect(done).toHaveTextContent("1 Kurs und 0 Lektionen");
    expect(done.textContent).not.toMatch(/\d[.,]\d|-\d/);
  });

  it("keeps the offer and names the reason when the route refuses", async () => {
    seedLocal(snapshot());
    stubFetch({
      "/api/progress": () => accountResponse(null),
      "/api/progress/import": () =>
        json({ error: "rate_limit_unavailable" }, 503),
    });
    render(<ImportProgressIsland locale="de" />);

    await confirm(
      await screen.findByRole("button", {
        name: /Lokalen Fortschritt übernehmen/,
      }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Schutz vor zu vielen Anfragen/);
    expect(alert).toHaveTextContent(/lokaler Lernstand ist unverändert/);
    // Retryable: the action stays, and the local data stays with it.
    expect(
      screen.getByRole("button", { name: /Lokalen Fortschritt übernehmen/ }),
    ).toBeEnabled();
    expect(window.localStorage.getItem(UNIFIED_STORAGE_KEY)).not.toBeNull();
  });

  it("reports a second import against the same account with its date", async () => {
    seedLocal(snapshot());
    stubFetch({
      "/api/progress": () => accountResponse(null),
      "/api/progress/import": () =>
        json(
          {
            error: "progress_already_imported",
            importedAt: "2026-08-20T09:00:00.000Z",
          },
          409,
        ),
    });
    render(<ImportProgressIsland locale="de" />);

    await confirm(
      await screen.findByRole("button", {
        name: /Lokalen Fortschritt übernehmen/,
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(/20\.8\.2026/);
  });

  it("survives a transport failure without touching local data", async () => {
    seedLocal(snapshot());
    stubFetch({
      "/api/progress": () => accountResponse(null),
      "/api/progress/import": () => {
        throw new TypeError("network down");
      },
    });
    render(<ImportProgressIsland locale="en" />);

    await confirm(
      await screen.findByRole("button", { name: /Transfer local progress/ }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /connection to the server failed/,
    );
    expect(window.localStorage.getItem(UNIFIED_STORAGE_KEY)).not.toBeNull();
  });
});

describe("island bundle boundary", () => {
  it("never reaches for the Supabase browser client", () => {
    for (const file of [
      "import-progress-island.tsx",
      "import-progress-copy.ts",
      "local-progress-snapshot.ts",
    ]) {
      const source = readFileSync(join(__dirname, file), "utf8");
      expect(source, file).not.toMatch(/@supabase|lib\/supabase/);
      // The account-storage module carries hashing and the deletion lock; the
      // island learns its owner from the server instead.
      expect(source, file).not.toMatch(/browser-learning-storage|progress\/store/);
    }
  });
});
