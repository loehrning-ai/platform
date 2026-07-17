import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";

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

const { mockCreateBrowserSupabaseClient } = vi.hoisted(() => ({
  mockCreateBrowserSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: mockCreateBrowserSupabaseClient,
}));

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: ({ href, children, className }: any) =>
      React.createElement(
        "a",
        { href: typeof href === "string" ? href : "#", className },
        children,
      ),
  };
});

import { AuthStatus } from "./auth-status";

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
});

afterEach(() => {
  cleanup();
});

describe("<AuthStatus>", () => {
  it("renders the signed-out Login link when no Supabase client is configured", () => {
    mockCreateBrowserSupabaseClient.mockReturnValue(null);
    render(<AuthStatus />);

    const link = screen.getByRole("link", { name: /login/i });
    expect(link).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: /konto/i })).toBeNull();
  });

  it("stays on the Login link when getUser resolves without a user", async () => {
    const sb = makeSupabase(null);
    mockCreateBrowserSupabaseClient.mockReturnValue(sb.client);

    render(<AuthStatus />);

    const link = await screen.findByRole("link", { name: /login/i });
    expect(link).toHaveAttribute("href", "/login");
    expect(sb.getUser).toHaveBeenCalledTimes(1);
  });

  it("switches to the Konto link (href=/konto) once getUser resolves with a user", async () => {
    const sb = makeSupabase({ id: "user-1" });
    mockCreateBrowserSupabaseClient.mockReturnValue(sb.client);

    render(<AuthStatus />);

    const link = await screen.findByRole("link", { name: /konto/i });
    expect(link).toHaveAttribute("href", "/konto");
    expect(screen.queryByRole("link", { name: /login/i })).toBeNull();
  });

  it("reacts to onAuthStateChange, flipping to Konto on sign-in and back on sign-out", async () => {
    const sb = makeSupabase(null);
    mockCreateBrowserSupabaseClient.mockReturnValue(sb.client);

    render(<AuthStatus />);
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

  it("adds the 44px mobile touch-target classes only when mobile is set", () => {
    mockCreateBrowserSupabaseClient.mockReturnValue(null);

    const { rerender } = render(<AuthStatus mobile />);
    const mobileLink = screen.getByRole("link");
    expect(mobileLink.className).toContain("min-h-[44px]");
    expect(mobileLink.className).toContain("border-border");

    rerender(<AuthStatus />);
    expect(screen.getByRole("link").className).not.toContain("min-h-[44px]");
  });

  it("unsubscribes from the auth channel on unmount", async () => {
    const sb = makeSupabase(null);
    mockCreateBrowserSupabaseClient.mockReturnValue(sb.client);

    const { unmount } = render(<AuthStatus />);
    await screen.findByRole("link", { name: /login/i });
    expect(sb.client.auth.onAuthStateChange).toHaveBeenCalledTimes(1);

    unmount();
    expect(sb.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
