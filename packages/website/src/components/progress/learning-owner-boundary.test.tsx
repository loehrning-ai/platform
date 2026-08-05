import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
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

afterEach(cleanup);

describe("<LearningOwnerBoundary>", () => {
  it("makes progress content inert while ownership is unresolved", () => {
    render(
      <LearningOwnerBoundaryRuntime>
        <button type="button">Complete lesson</button>
      </LearningOwnerBoundaryRuntime>,
    );

    const content = screen.getByRole("button", {
      name: "Complete lesson",
      hidden: true,
    }).parentElement;
    expect(content).toHaveAttribute("inert");
    expect(content).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Lernkonto wird sicher zugeordnet",
    );
  });

  it("enables an explicit isolated local continuation", () => {
    render(
      <LearningOwnerBoundaryRuntime>
        <button type="button">Complete lesson</button>
      </LearningOwnerBoundaryRuntime>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Lokal ohne Kontosynchronisierung fortfahren",
      }),
    );

    expect(getLearningOwnerContext().kind).toBe("anonymous");
    expect(
      screen.getByRole("button", { name: "Complete lesson" }).parentElement,
    ).not.toHaveAttribute("inert");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("unlocks automatically after a verified account owner arrives", () => {
    render(
      <LearningOwnerBoundaryRuntime>
        <button type="button">Complete lesson</button>
      </LearningOwnerBoundaryRuntime>,
    );

    act(() => {
      activateAccountProgress("account-a");
    });

    expect(getLearningOwnerContext()).toMatchObject({
      kind: "account",
      accountId: "account-a",
    });
    expect(
      screen.getByRole("button", { name: "Complete lesson" }).parentElement,
    ).not.toHaveAttribute("inert");
  });

  it("never makes an ordinary public page inert while learning ownership resolves", () => {
    navigation.pathname = "/blog";

    render(
      <LearningOwnerBoundaryRuntime>
        <button type="button">Read article</button>
      </LearningOwnerBoundaryRuntime>,
    );

    expect(
      screen.getByRole("button", { name: "Read article" }).parentElement,
    ).not.toHaveAttribute("inert");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
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

      render(
        <LearningOwnerBoundaryRuntime>
          <input aria-label="Search" />
        </LearningOwnerBoundaryRuntime>,
      );

      expect(
        screen.getByRole("textbox", { name: "Search" }).parentElement,
      ).not.toHaveAttribute("inert");
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    },
  );
});
