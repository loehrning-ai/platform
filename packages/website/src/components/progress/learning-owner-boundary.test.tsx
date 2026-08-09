import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
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
        <main id="main-content">{content}</main>
        <LearningOwnerBoundaryRuntime />
      </LocaleProvider>
    );
  }

  function renderBoundary(content: ReactNode, locale: "de" | "en" = "de") {
    return render(boundaryTree(content, locale));
  }

  it("makes progress content inert while ownership is unresolved", () => {
    renderBoundary(<button type="button">Complete lesson</button>);

    const content = screen.getByRole("main", {
      hidden: true,
    });
    expect(
      screen.getByRole("button", {
        name: "Complete lesson",
        hidden: true,
      }),
    ).toBeInTheDocument();
    expect(content).toHaveAttribute("inert");
    expect(content).toHaveAttribute("aria-busy", "true");
    expect(content).toHaveAttribute("data-learning-owner-unresolved", "true");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Lernkonto wird sicher zugeordnet",
    );
  });

  it("enables an explicit isolated local continuation", () => {
    renderBoundary(<button type="button">Complete lesson</button>);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Lokal ohne Kontosynchronisierung fortfahren",
      }),
    );

    expect(getLearningOwnerContext().kind).toBe("anonymous");
    expect(screen.getByRole("main")).not.toHaveAttribute("inert");
    expect(screen.getByRole("main")).not.toHaveAttribute("aria-busy");
    expect(screen.getByRole("main")).not.toHaveAttribute(
      "data-learning-owner-unresolved",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders the ownership gate in the requested English locale", () => {
    renderBoundary(<button type="button">Complete lesson</button>, "en");

    expect(screen.getByRole("status")).toHaveTextContent(
      "Learning account ownership is being resolved.",
    );
    expect(
      screen.getByRole("button", {
        name: "Continue locally without account sync",
      }),
    ).toBeVisible();
  });

  it("unlocks automatically after a verified account owner arrives", () => {
    renderBoundary(<button type="button">Complete lesson</button>);

    act(() => {
      activateAccountProgress("account-a");
    });

    expect(getLearningOwnerContext()).toMatchObject({
      kind: "account",
      accountId: "account-a",
    });
    expect(screen.getByRole("main")).not.toHaveAttribute("inert");
  });

  it("never makes an ordinary public page inert while learning ownership resolves", () => {
    navigation.pathname = "/blog";

    renderBoundary(<button type="button">Read article</button>);

    expect(screen.getByRole("main")).not.toHaveAttribute("inert");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("applies the same owner gate to a visible English course URL", () => {
    navigation.pathname = "/en/kurse/open-source/codex/kurs/L01";

    renderBoundary(<button type="button">Complete lesson</button>, "en");

    expect(screen.getByRole("main", { hidden: true })).toHaveAttribute("inert");
  });

  it.each([
    "/ai-native/glossar",
    "/ai-native/demos",
    "/buecher/ki-landschaft/03_reifegrad_ueberblick",
    "/kurse/open-source/codex/verifizierung",
  ])(
    "keeps the read-only public surface %s interactive while ownership resolves",
    (pathname) => {
      navigation.pathname = pathname;

      renderBoundary(<input aria-label="Search" />);

      expect(screen.getByRole("main")).not.toHaveAttribute("inert");
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    },
  );

  it("keeps the main inert until both the owner gate and mobile navigation release it", () => {
    renderBoundary(<button type="button">Complete lesson</button>);

    const main = screen.getByRole("main", { hidden: true });
    main.setAttribute("data-nav-menu-inert", "true");

    act(() => {
      activateAccountProgress("account-a");
    });

    expect(main).toHaveAttribute("inert");
    expect(main).not.toHaveAttribute("data-learning-owner-unresolved");
    expect(main).not.toHaveAttribute("aria-busy");
  });

  it("reconciles protected and public route changes while the owner stays unknown", () => {
    const rendered = renderBoundary(<button type="button">Content</button>);
    const main = screen.getByRole("main", { hidden: true });
    expect(main).toHaveAttribute("inert");

    navigation.pathname = "/blog";
    rendered.rerender(boundaryTree(<button type="button">Content</button>));
    expect(main).not.toHaveAttribute("inert");
    expect(main).not.toHaveAttribute("aria-busy");

    navigation.pathname = "/en/kurse/open-source/codex/kurs/L01";
    rendered.rerender(boundaryTree(<button type="button">Content</button>));
    expect(main).toHaveAttribute("inert");
    expect(main).toHaveAttribute("aria-busy", "true");
  });

  it("keeps a late ownership panel inert while mobile navigation is open", () => {
    setNavModalOpen(true);
    renderBoundary(<button type="button">Complete lesson</button>);

    const panel = screen.getByRole("status", { hidden: true });
    expect(panel).toHaveAttribute("inert");
    expect(panel).toHaveAttribute("aria-hidden", "true");
    expect(panel).toHaveAttribute("data-nav-menu-inert", "true");
    expect(panel).toHaveClass("invisible");

    act(() => setNavModalOpen(false));
    expect(screen.getByRole("status")).not.toHaveAttribute("inert");
    expect(screen.getByRole("status")).not.toHaveClass("invisible");
  });

  it("moves focus from newly inert course content to the continuation control", () => {
    navigation.pathname = "/blog";
    const rendered = renderBoundary(
      <button type="button">Course action</button>,
    );
    screen.getByRole("button", { name: "Course action" }).focus();

    navigation.pathname = "/ai-native/kurs/modul-1/lektion-1";
    rendered.rerender(
      boundaryTree(<button type="button">Course action</button>),
    );

    expect(
      screen.getByRole("button", {
        name: "Lokal ohne Kontosynchronisierung fortfahren",
      }),
    ).toHaveFocus();
  });

  it("cleans only its own lock through a StrictMode mount cycle", () => {
    const rendered = render(
      <>
        <main id="main-content" inert data-nav-menu-inert="true">
          Course
        </main>
        <LocaleProvider locale="de">
          <StrictMode>
            <LearningOwnerBoundaryRuntime />
          </StrictMode>
        </LocaleProvider>
      </>,
    );
    const main = screen.getByRole("main", { hidden: true });
    expect(main).toHaveAttribute("data-learning-owner-unresolved");

    rendered.unmount();
    expect(main).not.toHaveAttribute("data-learning-owner-unresolved");
    expect(main).not.toHaveAttribute("aria-busy");
    expect(main).toHaveAttribute("data-nav-menu-inert", "true");
    expect(main).toHaveAttribute("inert");
  });
});
