import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, within } from "@testing-library/react";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { localizeCatalog } from "@/lib/courses/catalog-copy";
import type { Locale } from "@/lib/i18n/locale";
import { ACCOUNT_COPY } from "../account-copy";
import type { AccountCourseEntry } from "./account-data";
import { TeilnahmebestaetigungenSection } from "./teilnahmebestaetigungen";

function earnedCodexRecord(locale: Locale): AccountCourseEntry {
  const course = localizeCatalog(COURSE_CATALOG, locale).find(
    (entry) => entry.slug === "codex",
  );
  if (!course) throw new Error("codex is missing from the course catalog");
  return {
    course,
    done: course.totalLessons,
    pct: 100,
    recordEarned: true,
    started: true,
    resumeHref: "/kurse/open-source/codex/kurs/zertifikat",
    lastActivity: "2026-07-29T11:00:00.000Z",
  };
}

function renderRecords(
  locale: Locale,
  earnedRecords: readonly AccountCourseEntry[],
) {
  return render(
    <TeilnahmebestaetigungenSection
      copy={ACCOUNT_COPY[locale]}
      locale={locale}
      earnedRecords={earnedRecords}
      coveredCount={0}
      totalOutcomes={12}
      coveredByCourse={[]}
    />,
  );
}

beforeEach(() => {
  cleanup();
});

describe("Teilnahmebestätigungen region", () => {
  it("pairs each earned record with the route that verifies it", () => {
    const record = earnedCodexRecord("de");

    const { container } = renderRecords("de", [record]);

    const region = container.querySelector("#konto-nachweise") as HTMLElement;
    expect(
      within(region).getByRole("link", {
        name: `${record.course.title} Teilnahmebestätigung öffnen`,
      }),
    ).toHaveAttribute("href", "/kurse/open-source/codex/kurs/zertifikat");
    // The verification route is public and hash driven: it is where a third
    // party checks the code the certificate carries, so it belongs on the
    // record rather than only on the printed document.
    expect(
      within(region).getByRole("link", { name: "Prüfseite" }),
    ).toHaveAttribute("href", "/kurse/open-source/codex/verifizierung");
    expect(region).toHaveTextContent(
      "Dort wird der Code aus deiner Bestätigung geprüft, ohne Anmeldung.",
    );
  });

  it("localizes both halves of the record for the English mirror", () => {
    const record = earnedCodexRecord("en");

    const { container } = renderRecords("en", [record]);

    const region = container.querySelector("#konto-nachweise") as HTMLElement;
    expect(
      within(region).getByRole("link", {
        name: `${record.course.title} Open certificate of participation`,
      }),
    ).toHaveAttribute("href", "/en/kurse/open-source/codex/kurs/zertifikat");
    expect(
      within(region).getByRole("link", { name: "Verification page" }),
    ).toHaveAttribute("href", "/en/kurse/open-source/codex/verifizierung");
  });

  it("offers no link at all before a record has been earned", () => {
    const { container } = renderRecords("de", []);

    const region = container.querySelector("#konto-nachweise") as HTMLElement;
    expect(within(region).queryAllByRole("link")).toHaveLength(0);
    expect(region).toHaveTextContent("Noch kein Kurs abgeschlossen.");
  });

  it("keeps every record target at the 44px floor and adds no second heading level", () => {
    const { container } = renderRecords("de", [earnedCodexRecord("de")]);

    const region = container.querySelector("#konto-nachweise") as HTMLElement;
    for (const link of within(region).getAllByRole("link")) {
      expect(link.className).toContain("min-h-11");
    }
    // The account page asserts the exact list of level-2 headings, so this
    // region contributes exactly one.
    expect(within(region).getAllByRole("heading", { level: 2 })).toHaveLength(
      1,
    );
  });
});
