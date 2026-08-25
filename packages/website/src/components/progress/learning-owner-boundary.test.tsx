import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLearningOwnerContext,
  prepareAccountLearningStorage,
  setUnknownLearningOwner,
} from "@/lib/progress/browser-learning-storage";
import {
  __resetCacheForTests,
  activateAccountProgress,
} from "@/lib/progress/store";
import { LearningOwnerBoundaryRuntime } from "./learning-owner-boundary-runtime";
import { LocaleProvider } from "@/components/i18n/locale-context";
import { setNavModalOpen } from "@/lib/a11y/nav-modal-state";

const navigation = vi.hoisted(() => ({
  pathname: "/ai-native/kurs/modul-1/lektion-1",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

beforeEach(async () => {
  navigation.pathname = "/ai-native/kurs/modul-1/lektion-1";
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
  setNavModalOpen(false);
});

describe("<LearningOwnerBoundary>", () => {
  function boundaryTree(content: ReactNode, locale: "de" | "en" = "de") {
    return (
      <LocaleProvider locale={locale}>
        <main id="main-content">
          <LearningOwnerBoundaryRuntime />
          {content}
        </main>
      </LocaleProvider>
    );
  }

  function renderBoundary(content: ReactNode, locale: "de" | "en" = "de") {
    return render(boundaryTree(content, locale));
  }

  it("server-renders a fixed ownership choice without reserving course space", () => {
    const markup = renderToString(
      boundaryTree(<button type="button">Complete lesson</button>),
    );

    expect(markup).toContain("data-learning-owner-panel");
    expect(markup).toContain("fixed");
    expect(markup).toContain("disabled");
  });

  it("keeps course content interactive while ownership is unresolved", () => {
    renderBoundary(<button type="button">Complete lesson</button>);

    const main = screen.getByRole("main");
    expect(screen.getByRole("button", { name: "Complete lesson" })).toBeEnabled();
    expect(main).not.toHaveAttribute("inert");
    expect(main).not.toHaveAttribute("aria-busy");
    expect(main).not.toHaveAttribute("data-learning-owner-unresolved");
    expect(
      screen.getByRole("region", { name: "Fortschritt bleibt getrennt." }),
    ).toBeVisible();
    expect(main).toContainElement(screen.getByRole("region"));
    expect(screen.getByRole("region")).toHaveClass("fixed");
    expect(getLearningOwnerContext().kind).toBe("unknown");
  });

  it("enables an explicit isolated local continuation", () => {
    renderBoundary(<button type="button">Complete lesson</button>);

    fireEvent.click(screen.getByRole("button", { name: "Lokal weiterlernen" }));

    expect(getLearningOwnerContext().kind).toBe("anonymous");
    expect(screen.getByRole("main")).not.toHaveAttribute("inert");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("renders the compact ownership choice in English", () => {
    renderBoundary(<button type="button">Complete lesson</button>, "en");

    expect(
      screen.getByRole("region", { name: "Progress stays isolated." }),
    ).toHaveTextContent(
      "Saving starts only after account verification or your local choice.",
    );
    expect(
      screen.getByRole("button", { name: "Continue locally" }),
    ).toBeVisible();
  });

  it("removes the choice after a verified account owner arrives", () => {
    renderBoundary(<button type="button">Complete lesson</button>);

    act(() => {
      activateAccountProgress("account-a");
    });

    expect(getLearningOwnerContext()).toMatchObject({
      kind: "account",
      accountId: "account-a",
    });
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.getByRole("main")).not.toHaveAttribute("inert");
  });

  it("does not show an ownership choice on an ordinary public page", () => {
    navigation.pathname = "/blog";

    renderBoundary(<button type="button">Read article</button>);

    expect(screen.getByRole("button", { name: "Read article" })).toBeEnabled();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("shows the same non-blocking choice on a visible English course URL", () => {
    navigation.pathname = "/en/kurse/open-source/codex/kurs/L01";

    renderBoundary(<button type="button">Complete lesson</button>, "en");

    expect(screen.getByRole("main")).not.toHaveAttribute("inert");
    expect(
      screen.getByRole("region", { name: "Progress stays isolated." }),
    ).toBeVisible();
  });

  it.each([
    "/ai-native/glossar",
    "/ai-native/demos",
    "/buecher/ki-landschaft/03_reifegrad_ueberblick",
    "/kurse/open-source/codex/verifizierung",
  ])(
    "keeps the read-only public surface %s free of the ownership choice",
    (pathname) => {
      navigation.pathname = pathname;

      renderBoundary(<input aria-label="Search" />);

      expect(screen.getByRole("main")).not.toHaveAttribute("inert");
      expect(screen.queryByRole("region")).not.toBeInTheDocument();
    },
  );

  it("reconciles protected and public route changes without locking content", () => {
    const rendered = renderBoundary(<button type="button">Content</button>);
    const main = screen.getByRole("main");
    expect(screen.getByRole("region")).toBeVisible();
    expect(main).not.toHaveAttribute("inert");

    navigation.pathname = "/blog";
    rendered.rerender(boundaryTree(<button type="button">Content</button>));
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(main).not.toHaveAttribute("inert");

    navigation.pathname = "/en/kurse/open-source/codex/kurs/L01";
    rendered.rerender(boundaryTree(<button type="button">Content</button>));
    expect(screen.getByRole("region")).toBeVisible();
    expect(main).not.toHaveAttribute("inert");
  });

  it("keeps a late ownership choice inert while mobile navigation is open", () => {
    setNavModalOpen(true);
    renderBoundary(<button type="button">Complete lesson</button>);

    const panel = screen.getByRole("region", { hidden: true });
    expect(panel).toHaveAttribute("inert");
    expect(panel).toHaveAttribute("aria-hidden", "true");
    expect(panel).toHaveAttribute("data-nav-menu-inert", "true");
    expect(panel).toHaveClass("invisible");

    act(() => setNavModalOpen(false));
    expect(screen.getByRole("region")).not.toHaveAttribute("inert");
    expect(screen.getByRole("region")).not.toHaveClass("invisible");
  });
});
