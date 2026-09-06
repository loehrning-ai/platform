import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The account page is a shell around its regions now, so the flat-density,
// no-decorative-lift and 12px-minimum rules have to see the region components
// and the one client island too. Watching only the shell would leave almost
// all of the account markup uncovered.
const SURFACES = [
  "konto/page.tsx",
  "konto/import-progress-island.tsx",
  "konto/sections/weiterlernen.tsx",
  "konto/sections/meine-kurse.tsx",
  "konto/sections/course-card.tsx",
  "konto/sections/werkzeuge.tsx",
  "konto/sections/deine-ki.tsx",
  "konto/sections/teilnahmebestaetigungen.tsx",
  "konto/sections/verwalten.tsx",
  "konto/sections/copy-value-button.tsx",
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
