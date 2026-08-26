import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  act,
  fireEvent,
} from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

/**
 * auth-status.test.tsx (regression coverage)
 *
 * <AuthStatus> is the nav login/konto pill. Its real logic is the `signedIn`
 * flag that flips href (`/login` <-> `/konto`), the visible label
 * (`Login` <-> `Konto`) and the icon, driven entirely by the browser Supabase
 * client:
 *   - no client configured        -> stays signed-out (default paint),
 *   - `auth.getUser()` resolves a user -> flips to the Konto link,
 *   - `auth.onAuthStateChange` fires    -> flips live on sign-in / sign-out,
 *   - unmount                          -> unsubscribes from the auth channel.
 *
 * We mock only the two boundaries: `@/lib/supabase/browser` (so no real network
 * client is built) and `next/link` (rendered as a bare <a> so href + text are
 * queryable). lucide icons render as aria-hidden <svg>, so the link's
 * accessible name is the label text - exactly what the nav exposes.
 */

const { mockCreateBrowserSupabaseClient, mockHasSupabasePublicConfig } =
  vi.hoisted(() => ({
    mockCreateBrowserSupabaseClient: vi.fn(),
    mockHasSupabasePublicConfig: vi.fn(),
  }));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: mockCreateBrowserSupabaseClient,
}));

vi.mock("@/lib/supabase/config", () => ({
  hasSupabasePublicConfig: mockHasSupabasePublicConfig,
}));

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: ({ href, children, className, onClick }: any) =>
      React.createElement(
        "a",
        {
          href: typeof href === "string" ? href : "#",
          className,
          onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
            event.preventDefault();
            onClick?.(event);
          },
        },
        children,
      ),
  };
});

import { AuthStatus } from "./auth-status";
import { LocaleProvider } from "@/components/i18n/locale-context";

function GermanLocaleProvider({ children }: { readonly children: ReactNode }) {
  return <LocaleProvider locale="de">{children}</LocaleProvider>;
}

function renderGerman(ui: ReactElement) {
  return render(ui, { wrapper: GermanLocaleProvider });
}

type AuthSession = { user: unknown } | null;
type AuthChangeHandler = (event: string, session: AuthSession) => void;

/**
 * Build a minimal fake of the Supabase client surface AuthStatus touches:
 * `auth.getUser()` (a promise) and `auth.onAuthStateChange(cb)` (returns the
 * nested `{ data: { subscription: { unsubscribe } } }` shape the component
 * tears down on unmount). `emit` lets a test push a live auth change.
 */
function makeSupabase(user: unknown) {
  const unsubscribe = vi.fn();
  const handlers: AuthChangeHandler[] = [];
  const getUser = vi.fn().mockResolvedValue({ data: { user } });
  const client = {
    auth: {
      getUser,
      onAuthStateChange: vi.fn((cb: AuthChangeHandler) => {
        handlers.push(cb);
        return { data: { subscription: { unsubscribe } } };
      }),
    },
  };
  return {
    client,
    getUser,
    unsubscribe,
    emit: (session: AuthSession) =>
      handlers.forEach((h) => h(session ? "SIGNED_IN" : "SIGNED_OUT", session)),
  };
}

beforeEach(() => {
  mockCreateBrowserSupabaseClient.mockReset();
  mockHasSupabasePublicConfig.mockReset();
  mockHasSupabasePublicConfig.mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("<AuthStatus>", () => {
  it("does not load the provider client when public Supabase config is absent", async () => {
    mockHasSupabasePublicConfig.mockReturnValue(false);

    renderGerman(<AuthStatus />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole("link", { name: /login/i })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(mockCreateBrowserSupabaseClient).not.toHaveBeenCalled();
  });

  it("renders the signed-out Login link when no Supabase client is configured", () => {
    mockCreateBrowserSupabaseClient.mockReturnValue(null);
    renderGerman(<AuthStatus />);

    const link = screen.getByRole("link", { name: /login/i });
    expect(link).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: /konto/i })).toBeNull();
  });

  it("stays on the Login link when getUser resolves without a user", async () => {
    const sb = makeSupabase(null);
    mockCreateBrowserSupabaseClient.mockReturnValue(sb.client);

    renderGerman(<AuthStatus />);

    const link = await screen.findByRole("link", { name: /login/i });
    expect(link).toHaveAttribute("href", "/login");
    expect(sb.getUser).toHaveBeenCalledTimes(1);
  });

  it("switches to the Konto link (href=/konto) once getUser resolves with a user", async () => {
    const sb = makeSupabase({ id: "user-1" });
    mockCreateBrowserSupabaseClient.mockReturnValue(sb.client);

    renderGerman(<AuthStatus />);

    const link = await screen.findByRole("link", { name: /konto/i });
    expect(link).toHaveAttribute("href", "/konto");
    expect(screen.queryByRole("link", { name: /login/i })).toBeNull();
  });

  it("reacts to onAuthStateChange, flipping to Konto on sign-in and back on sign-out", async () => {
    const sb = makeSupabase(null);
    mockCreateBrowserSupabaseClient.mockReturnValue(sb.client);

    renderGerman(<AuthStatus />);
    // Flush the initial getUser(null) resolution: still signed out.
    await screen.findByRole("link", { name: /login/i });

    act(() => sb.emit({ user: { id: "user-2" } }));
    expect(screen.getByRole("link", { name: /konto/i })).toHaveAttribute(
      "href",
      "/konto",
    );

    act(() => sb.emit(null));
    expect(screen.getByRole("link", { name: /login/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("keeps a 44px target at every breakpoint and softens the mobile border", () => {
    mockCreateBrowserSupabaseClient.mockReturnValue(null);

    const { rerender } = renderGerman(<AuthStatus mobile />);
    const mobileLink = screen.getByRole("link");
    expect(mobileLink.className).toContain("min-h-11");
    expect(mobileLink.className).toContain("border-border");

    rerender(<AuthStatus />);
    expect(screen.getByRole("link").className).toContain("min-h-11");
    expect(screen.getByRole("link").className).not.toContain("border-border");
  });

  it("notifies the mobile navigation shell before following its link", () => {
    mockCreateBrowserSupabaseClient.mockReturnValue(null);
    const onNavigate = vi.fn();

    renderGerman(<AuthStatus mobile onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("link", { name: /login/i }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes from the auth channel on unmount", async () => {
    const sb = makeSupabase(null);
    mockCreateBrowserSupabaseClient.mockReturnValue(sb.client);

    const { unmount } = renderGerman(<AuthStatus />);
    await screen.findByRole("link", { name: /login/i });
    expect(sb.client.auth.onAuthStateChange).toHaveBeenCalledTimes(1);

    unmount();
    expect(sb.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("fails closed without logging a rejected getUser error", async () => {
    const sb = makeSupabase(null);
    sb.getUser.mockRejectedValue(
      new Error("learner@example.com provider-secret"),
    );
    mockCreateBrowserSupabaseClient.mockReturnValue(sb.client);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    renderGerman(<AuthStatus />);

    expect(await screen.findByRole("link", { name: /login/i })).toHaveAttribute(
      "href",
      "/login",
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(sb.getUser).toHaveBeenCalledTimes(1);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("does not overwrite a newer sign-in event when the initial lookup later fails", async () => {
    let rejectLookup!: (error: Error) => void;
    const lookup = new Promise<never>((_resolve, reject) => {
      rejectLookup = reject;
    });
    const sb = makeSupabase(null);
    sb.getUser.mockReturnValue(lookup);
    mockCreateBrowserSupabaseClient.mockReturnValue(sb.client);

    renderGerman(<AuthStatus />);
    await act(async () => {
      await Promise.resolve();
    });
    act(() => sb.emit({ user: { id: "newer-session" } }));
    expect(screen.getByRole("link", { name: /konto/i })).toHaveAttribute(
      "href",
      "/konto",
    );

    await act(async () => {
      rejectLookup(new Error("stale initial lookup"));
      await lookup.catch(() => undefined);
    });
    expect(screen.getByRole("link", { name: /konto/i })).toHaveAttribute(
      "href",
      "/konto",
    );
  });

  it("does not overwrite a newer sign-in event when the initial lookup later resolves signed out", async () => {
    let resolveLookup!: (result: { data: { user: null } }) => void;
    const lookup = new Promise<{ data: { user: null } }>((resolve) => {
      resolveLookup = resolve;
    });
    const sb = makeSupabase(null);
    sb.getUser.mockReturnValue(lookup);
    mockCreateBrowserSupabaseClient.mockReturnValue(sb.client);

    renderGerman(<AuthStatus />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(sb.client.auth.onAuthStateChange).toHaveBeenCalledTimes(1);

    act(() => sb.emit({ user: { id: "newer-session" } }));
    expect(screen.getByRole("link", { name: /konto/i })).toHaveAttribute(
      "href",
      "/konto",
    );

    await act(async () => {
      resolveLookup({ data: { user: null } });
      await lookup;
    });
    expect(screen.getByRole("link", { name: /konto/i })).toHaveAttribute(
      "href",
      "/konto",
    );
  });

  it("fails closed without logging a client-creation error", async () => {
    mockCreateBrowserSupabaseClient.mockImplementation(() => {
      throw new Error("provider-url-with-secret");
    });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    renderGerman(<AuthStatus />);

    expect(await screen.findByRole("link", { name: /login/i })).toHaveAttribute(
      "href",
      "/login",
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockCreateBrowserSupabaseClient).toHaveBeenCalledTimes(1);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("keeps signed-out and signed-in account navigation in the English URL space", async () => {
    const sb = makeSupabase({ id: "user-en" });
    mockCreateBrowserSupabaseClient.mockReturnValue(sb.client);

    render(
      <LocaleProvider locale="en">
        <AuthStatus />
      </LocaleProvider>,
    );

    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/en/login",
    );
    expect(
      await screen.findByRole("link", { name: "Account" }),
    ).toHaveAttribute("href", "/en/konto");
  });
});
