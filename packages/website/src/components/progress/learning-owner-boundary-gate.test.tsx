import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { createElement, type ComponentType, type ReactNode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/i18n/locale-context";
import {
  getLearningOwnerContext,
  prepareAccountLearningStorage,
  setUnknownLearningOwner,
} from "@/lib/progress/browser-learning-storage";
import { __resetCacheForTests } from "@/lib/progress/store";
import { LearningOwnerBoundary } from "./learning-owner-boundary";

interface MockDynamicOptions {
  readonly ssr?: boolean;
  readonly loading?: ComponentType;
}

const navigation = vi.hoisted(() => ({ pathname: "/ai-native" }));

// The mocked chunk: `requests` counts renders of the dynamic component, which
// is when next/dynamic fetches the chunk; `arrived` false keeps it in its
// loading state, as in the window between hydration and the chunk landing.
const chunk = vi.hoisted(() => ({
  arrived: true,
  requests: 0,
  options: null as MockDynamicOptions | null,
  loader: null as (() => Promise<unknown>) | null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<unknown>, options: MockDynamicOptions) => {
    chunk.options = options;
    chunk.loader = loader;
    return function LearningOwnerBoundaryRuntimeMock() {
      chunk.requests += 1;
      if (!chunk.arrived) {
        return options.loading ? createElement(options.loading) : null;
      }
      return createElement("div", { "data-testid": "learning-owner-runtime" });
    };
  },
}));

const PUBLIC_ROUTES = [
  "/",
  "/impressum",
  "/datenschutz",
  "/buecher",
  "/kurse",
  "/blog/eu-ai-act-grundlagen",
  "/en/impressum",
  "/kurse/open-source/codex/verifizierung",
] as const;

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function staticImports(text: string): readonly string[] {
  return [...text.matchAll(/^import\s[^"']*?from\s+"([^"]+)"/gm)].map(
    (match) => match[1],
  );
}

function tree(content: ReactNode, locale: "de" | "en" = "de") {
  return (
    <LocaleProvider locale={locale}>
      <main id="main-content">
        <LearningOwnerBoundary />
        {content}
      </main>
    </LocaleProvider>
  );
}

beforeEach(async () => {
  navigation.pathname = "/ai-native";
  chunk.arrived = true;
  chunk.requests = 0;
  window.localStorage.clear();
  Object.defineProperty(window.navigator, "locks", {
    configurable: true,
    value: {
      request: vi.fn(
        async (
          name: string,
          _options: LockOptions,
          callback: (lock: Lock | null) => unknown,
        ) =>
          callback({
            name,
            mode: "exclusive",
          } as Lock),
      ),
    },
  });
  __resetCacheForTests();
  expect(await prepareAccountLearningStorage()).toBe(true);
  setUnknownLearningOwner();
});

afterEach(() => {
  cleanup();
});

describe("LearningOwnerBoundary route gate", () => {
  it("keeps the store, its storage and the runtime out of the root-layout graph", () => {
    const boundary = source(
      "src/components/progress/learning-owner-boundary.tsx",
    );
    const panel = source("src/components/progress/learning-owner-panel.tsx");
    const policy = source("src/lib/progress/learning-route-policy.ts");

    expect(boundary).toContain('from "next/dynamic"');
    expect(boundary).toContain("ssr: false");
    expect(boundary).toContain(
      'import("@/components/progress/learning-owner-boundary-runtime")',
    );
    for (const text of [boundary, panel]) {
      expect(staticImports(text)).not.toContain("@/lib/progress/store");
      expect(staticImports(text)).not.toContain(
        "@/lib/progress/browser-learning-storage",
      );
      expect(staticImports(text)).not.toContain(
        "@/components/progress/learning-owner-boundary-runtime",
      );
    }
    // The gate the root layout imports on every route must stay this cheap.
    expect(staticImports(policy)).toEqual(["@/lib/i18n/locale"]);
    expect(chunk.options).toMatchObject({ ssr: false });
  });

  it("server-renders the disabled in-flow choice on a learning route without requesting the runtime", () => {
    const markup = renderToString(
      tree(<button type="button">Complete lesson</button>),
    );

    expect(markup).toContain("<section data-learning-owner-panel");
    expect(markup).toContain("disabled");
    expect(markup).not.toContain("fixed bottom");
    expect(chunk.requests).toBe(0);
  });

  it.each(PUBLIC_ROUTES)(
    "renders nothing and never requests the runtime on %s",
    async (pathname) => {
      navigation.pathname = pathname;

      expect(
        renderToStaticMarkup(
          <LocaleProvider locale="de">
            <LearningOwnerBoundary />
          </LocaleProvider>,
        ),
      ).toBe("");

      render(tree(<button type="button">Read article</button>));
      await act(async () => {});

      expect(
        screen.getByRole("button", { name: "Read article" }),
      ).toBeEnabled();
      expect(screen.queryByRole("region")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("learning-owner-runtime"),
      ).not.toBeInTheDocument();
      expect(chunk.requests).toBe(0);
    },
  );

  it("hydrates the server choice unchanged and requests the runtime only after mount", async () => {
    const element = tree(<button type="button">Complete lesson</button>);
    const container = document.createElement("div");
    container.innerHTML = renderToString(element);
    document.body.append(container);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const root = hydrateRoot(container, element);

    try {
      expect(chunk.requests).toBe(0);
      await waitFor(() => {
        expect(
          within(container).getByTestId("learning-owner-runtime"),
        ).toBeInTheDocument();
      });
      expect(chunk.requests).toBeGreaterThan(0);
      expect(within(container).queryByRole("region")).not.toBeInTheDocument();
      expect(
        consoleError.mock.calls.filter(([message]) =>
          /hydrat|did not match/i.test(String(message)),
        ),
      ).toEqual([]);
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
      consoleError.mockRestore();
    }
  });

  it("resolves a local continuation chosen before the runtime chunk arrives", async () => {
    chunk.arrived = false;

    render(tree(<button type="button">Complete lesson</button>));

    const choice = screen.getByRole("button", { name: "Lokal weiterlernen" });
    expect(choice).toBeEnabled();
    expect(chunk.requests).toBeGreaterThan(0);
    expect(getLearningOwnerContext().kind).toBe("unknown");

    fireEvent.click(choice);

    await waitFor(() => {
      expect(getLearningOwnerContext().kind).toBe("anonymous");
    });
  });

  it("hands the choice over to the runtime once its chunk has arrived", () => {
    render(tree(<button type="button">Complete lesson</button>));

    expect(screen.getByTestId("learning-owner-runtime")).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Complete lesson" }),
    ).toBeEnabled();
  });

  it("drops the runtime on a public route and restores it on a learning route", () => {
    const rendered = render(tree(<button type="button">Content</button>));
    expect(screen.getByTestId("learning-owner-runtime")).toBeInTheDocument();

    navigation.pathname = "/impressum";
    rendered.rerender(tree(<button type="button">Content</button>));
    expect(
      screen.queryByTestId("learning-owner-runtime"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();

    navigation.pathname = "/en/kurse/open-source/codex/kurs/L01";
    rendered.rerender(tree(<button type="button">Content</button>, "en"));
    expect(screen.getByTestId("learning-owner-runtime")).toBeInTheDocument();
  });

  it("loads the real runtime component through the dynamic loader", async () => {
    expect(chunk.loader).not.toBeNull();

    const loaded = await chunk.loader!();

    expect(typeof loaded).toBe("function");
    expect((loaded as { name: string }).name).toBe(
      "LearningOwnerBoundaryRuntime",
    );
  });
});
