import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SURFACES = [
  "konto/page.tsx",
  "login/page.tsx",
  "login/login-form.tsx",
  "feedback/page.tsx",
  "feedback/feedback-form.tsx",
] as const;

function source(path: (typeof SURFACES)[number]): string {
  return readFileSync(join(__dirname, path), "utf8");
}

describe("account, login, and feedback visual contract", () => {
  it.each(SURFACES)("keeps %s labels at 12px or larger", (path) => {
    expect(source(path)).not.toMatch(/\btext-\[(?:9|10|10\.5|11)px\]\b/);
  });

  it.each(SURFACES)("keeps %s flat and free of decorative lift", (path) => {
    expect(source(path)).not.toMatch(
      /(?:shadow-(?:card|card-hover|tile)|shadow-\[|hover:-translate|active:translate|transition-all|rounded-full)/,
    );
  });

  it("uses compact page shells and 44px-or-larger controls", () => {
    expect(source("konto/page.tsx")).toContain('className="py-8 sm:py-12"');
    expect(source("login/page.tsx")).toContain("py-8 sm:py-10");
    expect(source("feedback/page.tsx")).toContain("pb-12 pt-8");
    expect(source("konto/page.tsx")).toContain("min-h-11");
    expect(source("login/login-form.tsx")).toMatch(/(?:min-h-11|h-12)/);
    expect(source("feedback/feedback-form.tsx")).toContain("min-h-12");
  });

  it("puts the sign-in card before its explanation below lg only", () => {
    const login = source("login/page.tsx");

    // The card leads on phones through visual order alone: the DOM keeps the
    // heading first for readers, and the desktop grid template is untouched.
    expect(login).toContain(
      '<div className="order-first min-w-0 lg:order-none">{loginForm}</div>',
    );
    expect(login).toContain(
      "lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]",
    );
  });

  it("turns the account section navigation into a swipeable tab strip below lg", () => {
    const konto = source("konto/page.tsx");
    const strip =
      konto.match(/data-konto-tabs\s+className="([^"]+)"/)?.[1] ?? "";

    // Proximity, not mandatory: measured at 390px the five tabs are 109 to
    // 233px wide, so several share the viewport and there is no page for a
    // mandatory strip to enforce - it would only jerk to a tab edge on every
    // small drag. Measured: the strip is 52px tall and reaches its own scroll
    // end at 320 and 390px, and from lg it wraps with no scroll container.
    expect(strip).toContain("snap-x snap-proximity");
    expect(strip).toContain("overflow-x-auto");
    expect(strip).toContain("[scrollbar-width:none]");
    expect(strip).toContain("lg:flex-wrap");
    expect(strip).toContain("lg:overflow-visible");
    expect(konto).toContain("data-konto-tab={item.key}");
    // The strip stays in flow. The site header is already fixed, so a second
    // pinned bar would stack under it; only the strip's own classes are
    // checked, because the comment above the nav says the word itself.
    expect(strip).not.toContain("sticky");
    // Desktop wrapping is handed back intact: the tabs only refuse to wrap
    // while they are one scrolling row.
    const tab =
      konto.match(/data-konto-tab=\{item\.key\}\s+className="([^"]+)"/)?.[1] ??
      "";
    expect(tab).toContain("whitespace-nowrap");
    expect(tab).toContain("lg:whitespace-normal");
    expect(tab).toContain("min-h-11");
  });

  it("keeps legacy export truth while removing XP presentation", () => {
    const loginCopy = readFileSync(
      join(__dirname, "login/login-copy.ts"),
      "utf8",
    );
    const accountCopy = readFileSync(
      join(__dirname, "konto/account-copy.ts"),
      "utf8",
    );

    expect(loginCopy).not.toMatch(/\bXP\b/);
    expect(accountCopy).toMatch(/Historische Aktivitätsdaten.*Export/);
    expect(accountCopy).toMatch(/Historical activity data remains in exports/);
  });
});
