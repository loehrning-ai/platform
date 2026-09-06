import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import {
  createElement,
  useEffect,
  useState,
  type ComponentType,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClientMock, hasSupabasePublicConfigMock } = vi.hoisted(
  () => ({
    createBrowserClientMock: vi.fn(),
    hasSupabasePublicConfigMock: vi.fn(),
  }),
);

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: createBrowserClientMock,
}));

vi.mock("@/lib/supabase/config", () => ({
  hasSupabasePublicConfig: hasSupabasePublicConfigMock,
}));

const navigation = vi.hoisted(() => ({ pathname: "/ai-native" }));

// `requests` counts renders of the dynamic host, which is when next/dynamic
// fetches the chunk. `arrived` false holds it in its loading state, as in the
// window between hydration and the chunk landing.
const chunk = vi.hoisted(() => ({
  arrived: true,
  requests: 0,
  options: null as { readonly ssr?: boolean } | null,
  loader: null as (() => Promise<unknown>) | null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

vi.mock("next/dynamic", () => ({
  default: (
    loader: () => Promise<ComponentType>,
    options: { readonly ssr?: boolean },
  ) => {
    chunk.options = options;
    chunk.loader = loader;
    return function UserProgressSyncRuntimeHost() {
      chunk.requests += 1;
      const [Loaded, setLoaded] = useState<ComponentType | null>(null);

      useEffect(() => {
        if (!chunk.arrived) return;
        let cancelled = false;
        void loader().then((component) => {
          if (!cancelled) setLoaded(() => component);
        });
        return () => {
          cancelled = true;
        };
      }, []);

      return Loaded ? createElement(Loaded) : null;
    };
  },
}));

import {
  getLearningOwnerContext,
  prepareAccountLearningStorage,
  setUnknownLearningOwner,
} from "@/lib/progress/browser-learning-storage";
import { __resetCacheForTests } from "@/lib/progress/store";
import { __resetAccountDeletionControlForTests } from "@/lib/progress/account-deletion-control";
import { __resetProgressSyncFailureForTests } from "@/lib/progress/sync-status";
import { UserProgressSync } from "./user-progress-sync";

const ACCOUNT_ID = "learner-gate-1";

// Nothing on these routes imports the progress store or the sync notice, so
// none of them can hold progress to flush or learning data to scrub.
const PUBLIC_ROUTES = [
  "/",
  "/ki-check",
  "/impressum",
  "/datenschutz",
  "/blog/eu-ai-act-grundlagen",
  "/login",
  "/workshops",
  "/en/impressum",
] as const;

// Every surface that reads or mutates the learning ledger, plus the account
// pages that render the sync notice and drive account deletion.
const PROGRESS_ROUTES = [
  "/ai-native",
  "/ai-native/kurs/modul-1/lektion-1",
  "/buecher",
  "/kurse",
  "/kurse/open-source/codex/verifizierung",
  "/konto",
  "/konto/datenschutz",
  "/en/kurse/open-source/codex/kurs/L01",
] as const;

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function staticImports(text: string): readonly string[] {
  return [...text.matchAll(/^import\s[^"']*?from\s+"([^"]+)"/gm)].map(
    (match) => match[1],
  );
}

function signedInClient(): void {
  hasSupabasePublicConfigMock.mockReturnValue(true);
  createBrowserClientMock.mockReturnValue({
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: ACCOUNT_ID } }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  });
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ ownerId: ACCOUNT_ID, progress: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

beforeEach(async () => {
  navigation.pathname = "/ai-native";
  chunk.arrived = true;
  chunk.requests = 0;
  createBrowserClientMock.mockReset();
  hasSupabasePublicConfigMock.mockReset();
  hasSupabasePublicConfigMock.mockReturnValue(false);
  window.localStorage.clear();
  window.sessionStorage.clear();
  Object.defineProperty(window.navigator, "locks", {
    configurable: true,
    value: {
      request: vi.fn(
        async (
          name: string,
          _options: LockOptions,
          callback: (lock: Lock | null) => unknown,
        ) => callback({ name, mode: "exclusive" } as Lock),
      ),
    },
  });
  __resetCacheForTests();
  __resetAccountDeletionControlForTests();
  __resetProgressSyncFailureForTests();
  expect(await prepareAccountLearningStorage()).toBe(true);
  setUnknownLearningOwner();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("UserProgressSync route gate", () => {
  it("keeps the runtime, the store and the deletion control out of the root-layout graph", () => {
    const gate = source("src/components/auth/user-progress-sync.tsx");
    const policy = source("src/lib/progress/learning-route-policy.ts");

    expect(gate).toContain('from "next/dynamic"');
    expect(gate).toContain("ssr: false");
    expect(gate).toContain(
      'import("@/components/auth/user-progress-sync-runtime")',
    );
    for (const specifier of [
      "@/lib/progress/store",
      "@/lib/progress/browser-learning-storage",
      "@/lib/progress/account-deletion-control",
      "@/lib/progress/server-sync",
      "@/lib/supabase/config",
      "@/components/auth/user-progress-sync-runtime",
    ]) {
      expect(staticImports(gate)).not.toContain(specifier);
    }
    // The gate the root layout imports on every route must stay this cheap.
    expect(staticImports(policy)).toEqual(["@/lib/i18n/locale"]);
    expect(chunk.options).toMatchObject({ ssr: false });
  });

  it("renders no server markup on a progress route", () => {
    expect(renderToStaticMarkup(createElement(UserProgressSync))).toBe("");
    expect(chunk.requests).toBe(0);
  });

  it.each(PUBLIC_ROUTES)(
    "requests no runtime and no store on %s",
    async (pathname) => {
      navigation.pathname = pathname;
      signedInClient();

      expect(
        renderToStaticMarkup(createElement(UserProgressSync)),
      ).toBe("");

      const rendered = render(createElement(UserProgressSync));
      await act(async () => {});

      expect(rendered.container).toBeEmptyDOMElement();
      expect(chunk.requests).toBe(0);
      expect(createBrowserClientMock).not.toHaveBeenCalled();
      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(getLearningOwnerContext().kind).toBe("unknown");
    },
  );

  it.each(PROGRESS_ROUTES)(
    "requests the runtime after mount on %s",
    async (pathname) => {
      navigation.pathname = pathname;
      chunk.arrived = false;

      render(createElement(UserProgressSync));
      await act(async () => {});

      expect(chunk.requests).toBeGreaterThan(0);
    },
  );

  it("activates anonymous progress on a progress route without provider config", async () => {
    hasSupabasePublicConfigMock.mockReturnValue(false);

    render(createElement(UserProgressSync));

    await waitFor(() => {
      expect(getLearningOwnerContext().kind).toBe("anonymous");
    });
    expect(createBrowserClientMock).not.toHaveBeenCalled();
  });

  it("verifies the signed-in owner and selects the account namespace on a progress route", async () => {
    signedInClient();

    render(createElement(UserProgressSync));

    await waitFor(() => {
      expect(getLearningOwnerContext()).toMatchObject({
        kind: "account",
        accountId: ACCOUNT_ID,
      });
    });
    expect(createBrowserClientMock).toHaveBeenCalled();
  });

  it("never verifies the signed-in owner on a public route", async () => {
    navigation.pathname = "/impressum";
    signedInClient();

    render(createElement(UserProgressSync));
    await act(async () => {});

    expect(chunk.requests).toBe(0);
    expect(createBrowserClientMock).not.toHaveBeenCalled();
    expect(getLearningOwnerContext().kind).toBe("unknown");
  });

  it("keeps the mounted runtime after a navigation to a public route", async () => {
    signedInClient();
    const rendered = render(createElement(UserProgressSync));

    await waitFor(() => {
      expect(getLearningOwnerContext()).toMatchObject({ kind: "account" });
    });
    const requestsOnLearningRoute = chunk.requests;

    navigation.pathname = "/impressum";
    await act(async () => {
      rendered.rerender(createElement(UserProgressSync));
    });

    expect(chunk.requests).toBeGreaterThanOrEqual(requestsOnLearningRoute);
    expect(getLearningOwnerContext()).toMatchObject({ kind: "account" });
  });

  it("requests the runtime after a navigation from a public route into a progress route", async () => {
    navigation.pathname = "/impressum";
    chunk.arrived = false;
    const rendered = render(createElement(UserProgressSync));
    await act(async () => {});
    expect(chunk.requests).toBe(0);

    navigation.pathname = "/kurse";
    await act(async () => {
      rendered.rerender(createElement(UserProgressSync));
    });

    expect(chunk.requests).toBeGreaterThan(0);
  });

  it("loads the real runtime component through the dynamic loader", async () => {
    expect(chunk.loader).not.toBeNull();

    const loaded = await chunk.loader!();

    expect(typeof loaded).toBe("function");
    expect((loaded as { name: string }).name).toBe("UserProgressSyncRuntime");
  });

  it("adds no markup on a progress route either", async () => {
    signedInClient();
    const rendered = render(createElement(UserProgressSync));

    await waitFor(() => {
      expect(getLearningOwnerContext()).toMatchObject({ kind: "account" });
    });

    expect(rendered.container).toBeEmptyDOMElement();
  });
});
