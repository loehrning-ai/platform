import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  getLessonMissionProfile,
  type LessonMissionProbe,
} from "../../src/lib/course-projects/lesson-missions";
import { getCourseProjectLocalLearningReceipt } from "../../src/lib/course-projects/types";
import {
  collectBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";

const profile = getLessonMissionProfile("claude");

/** Focus alone passes even when the fixed shell obscures the result. */
async function expectUnobscuredFocus(target: Locator): Promise<void> {
  await expect(target).toBeFocused();
  const geometry = await target.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const headerBottom = Math.max(
      0,
      ...Array.from(
        document.querySelectorAll(
          "[data-nav-header-row], [data-lesson-shell-mobile-toolbar]",
        ),
        (node) => {
          const bounds = node.getBoundingClientRect();
          return bounds.height > 0 ? bounds.bottom : 0;
        },
      ),
    );
    const bar = document
      .querySelector("[data-reader-focus-bar]")
      ?.getBoundingClientRect();
    const bottom = bar && bar.height > 0 ? bar.top : window.innerHeight;
    const point = document.elementFromPoint(
      box.left + box.width / 2,
      box.top + 4,
    );
    return {
      top: box.top,
      bottom: box.bottom,
      headerBottom,
      visibleBottom: bottom,
      unobscured: point === element || element.contains(point),
    };
  });
  expect(geometry.top).toBeGreaterThanOrEqual(geometry.headerBottom);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.visibleBottom);
  expect(geometry.unobscured).toBe(true);
}

for (const locale of ["de", "en"] as const) {
  async function activate(page: Page, target: Locator): Promise<void> {
    if (locale === "en") {
      await target.focus();
      await page.keyboard.press("Enter");
    } else if (await page.evaluate(() => navigator.maxTouchPoints > 0)) {
      await target.tap();
    } else {
      await target.click();
    }
  }

  test(`mission result stays visible and focused through revision and retry (${locale})`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({
      reducedMotion: locale === "en" ? "reduce" : "no-preference",
    });
    await page.addInitScript(() => localStorage.clear());
    const errors = collectBrowserErrors(page);
    let fixtureRequests = 0;
    // Deterministic provider-off fixture. No request reaches a provider, and
    // only the distinct local-learning receipt may enter the mission.
    await page.route("**/api/ai-native/practice", async (route) => {
      fixtureRequests += 1;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ code: "practice_disabled" }),
      });
    });
    const route = `${locale === "en" ? "/en" : ""}/kurse/open-source/claude/kurs/mental-model`;
    await page.goto(route, { waitUntil: "load" });
    await page
      .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
      .waitFor({ state: "attached" });
    const mission = page.locator('[data-lesson-mission="claude"]');
    const next = () =>
      mission.getByRole("button", {
        name: locale === "de" ? "Nächstes Signal" : "Next signal",
        exact: true,
      });
    const panelHeading = () =>
      mission
        .locator("[data-mission-current-panel]")
        .getByRole("heading")
        .first();
    const answer = (probe: LessonMissionProbe, correct: boolean) => {
      const choice = probe.choices.find(
        (entry) => (entry.id === probe.correctId) === correct,
      )!;
      return mission
        .getByRole("button")
        .filter({ hasText: choice.label[locale] });
    };
    const feedback = () => mission.locator("[data-mission-feedback]");
    const shot = async (state: string) => {
      const imagePath = testInfo.outputPath(`${locale}-${state}.png`);
      await page.screenshot({
        path: imagePath,
      });
      await testInfo.attach(`${locale}-${state}`, {
        path: imagePath,
        contentType: "image/png",
      });
    };

    await expect(mission.getByRole("radio").first()).toBeEnabled();
    await activate(
      page,
      mission.getByRole("button", {
        name:
          locale === "de"
            ? "Signalstrecke einklappen"
            : "Collapse signal circuit",
        exact: true,
      }),
    );
    await expect(mission).toHaveAttribute("data-mission-collapsed", "true");
    await activate(
      page,
      page.locator("[data-reader-focus-bar]").getByRole("button", {
        name: locale === "de" ? "Aufgabe öffnen" : "Open task",
        exact: true,
      }),
    );
    await expect(mission).toHaveAttribute("data-mission-collapsed", "false");
    await expectUnobscuredFocus(panelHeading());
    await expect(mission).toHaveAttribute("data-mission-complete", "false");
    await shot("reader-reopens-task");

    await expect(mission.getByRole("radio").first()).toBeEnabled();
    await mission.getByRole("radio").first().check();
    const reveal = mission.getByRole("button", {
      name:
        locale === "de"
          ? "Prognose festlegen und Signal aufdecken"
          : "Commit prediction and reveal signal",
    });
    const signalId = await reveal.getAttribute("aria-controls");
    await activate(page, reveal);
    await expectUnobscuredFocus(page.locator(`[id="${signalId}"]`));
    await activate(page, next());
    await expectUnobscuredFocus(panelHeading());
    await activate(
      page,
      mission.getByRole("button", {
        name: locale === "de" ? /^Instrument öffnen/ : /^Open instrument/,
      }),
    );

    const studio = page.locator(
      '[data-course-project][data-engine-kind="prompt"]',
    );
    await studio
      .getByRole("textbox", {
        name: locale === "de" ? "Arbeitskontext" : "Working context",
        exact: true,
      })
      .fill(
        "Synthetic museum sources A through C conflict on the exhibition date.",
      );
    await studio
      .getByRole("textbox", {
        name: locale === "de" ? "Prompt A · Baseline" : "Prompt A · baseline",
        exact: true,
      })
      .fill(
        "Create an exhibition outline. Output a table and do not invent claims.",
      );
    await studio
      .getByRole("textbox", {
        name:
          locale === "de"
            ? "Prompt B · quellengebunden"
            : "Prompt B · grounded",
        exact: true,
      })
      .fill(
        "Create the outline from source A-C, cite evidence, and refuse uncertain unsupported claims.",
      );
    const checks = studio.getByRole("checkbox");
    await expect(checks).toHaveCount(4);
    for (const checkbox of await checks.all()) await checkbox.check();
    await activate(
      page,
      studio.getByRole("button", {
        name: locale === "de" ? "Provider ausführen" : "Run provider",
        exact: true,
      }),
    );
    const localRun = studio.getByRole("button", {
      name:
        locale === "de"
          ? "Lokalen Lernlauf ausführen"
          : "Run local learning check",
      exact: true,
    });
    await expect(localRun).toBeEnabled();
    await activate(page, localRun);
    await expectUnobscuredFocus(
      studio.locator("[data-local-learning-feedback]"),
    );
    expect(fixtureRequests).toBe(1);
    await shot("local-learning-result");

    await activate(page, next());
    await activate(page, next());
    await activate(page, answer(profile.evidence, false));
    await expectUnobscuredFocus(feedback());
    await activate(page, answer(profile.evidence, true));
    await expectUnobscuredFocus(feedback());
    await shot("evidence-result");
    await activate(page, next());
    await activate(page, answer(profile.revision, true));
    await expectUnobscuredFocus(feedback());
    await shot("revision-result");
    await activate(page, next());

    const commitRecall = async () => {
      await mission
        .getByRole("textbox", {
          name:
            locale === "de" ? "Regel aus dem Gedächtnis" : "Rule from memory",
          exact: true,
        })
        .fill(
          "Confidence must match the available evidence; unsupported claims stay uncertain.",
        );
      await activate(
        page,
        mission.getByRole("button", {
          name:
            locale === "de"
              ? "Abruf festlegen und Optionen öffnen"
              : "Commit recall and open options",
          exact: true,
        }),
      );
      await expectUnobscuredFocus(panelHeading());
    };
    await commitRecall();
    await activate(page, answer(profile.retrieval, false));
    await expectUnobscuredFocus(feedback());
    await expect(answer(profile.retrieval, true)).toBeDisabled();
    await shot("retrieval-repair");
    await activate(
      page,
      mission.getByRole("button", {
        name:
          locale === "de"
            ? "Reparaturabruf beginnen"
            : "Begin repair retrieval",
        exact: true,
      }),
    );
    await expectUnobscuredFocus(panelHeading());
    await commitRecall();
    await activate(page, answer(profile.retrieval, true));
    await expectUnobscuredFocus(feedback());
    await activate(page, next());
    await activate(page, answer(profile.transfer, true));
    await expectUnobscuredFocus(feedback());
    await expect(mission).toHaveAttribute("data-mission-complete", "true");
    await expect(feedback()).toContainText(
      locale === "de" ? "Lektionsschleife geschlossen" : "Lesson loop closed",
    );
    await shot("transfer-complete");

    // Mission completion is not lesson navigation proof. The bar now opens
    // the actual reference/checkpoint without marking any section reviewed.
    const readerBar = page.locator("[data-reader-focus-bar]");
    await activate(
      page,
      readerBar.getByRole("button", {
        name: locale === "de" ? "Aufgabe öffnen" : "Open task",
        exact: true,
      }),
    );
    const reference = page.locator("details[data-lesson-reference]");
    await expect(reference).toHaveJSProperty("open", true);
    const checkpoint = reference.locator(
      '[data-lesson-proof-checkpoint="open"]',
    );
    await expect(checkpoint).toBeFocused();
    const decision = checkpoint.getByRole("textbox", {
      name:
        locale === "de" ? "Entscheidung oder Änderung" : "Decision or revision",
    });
    await expect(decision).toBeDisabled();
    const sections = reference.getByRole("button", {
      name:
        locale === "de"
          ? "Abschnitt als geprüft bestätigen"
          : "Confirm section reviewed",
      exact: true,
    });
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThan(0);
    for (let index = 0; index < sectionCount; index += 1) {
      await activate(page, sections.first());
    }
    await expect(decision).toBeEnabled();
    await decision.fill(
      "I will compare each synthetic claim with its cited source before accepting it.",
    );
    await activate(
      page,
      checkpoint.getByRole("button", {
        name: locale === "de" ? "Checkpoint speichern" : "Save checkpoint",
        exact: true,
      }),
    );
    await expect(
      reference.locator('[data-lesson-proof-checkpoint="complete"]'),
    ).toBeVisible();
    const onward = readerBar.getByRole("link", {
      name: locale === "de" ? "Weiter" : "Next",
      exact: true,
    });
    await expect(onward).toBeVisible();
    const onwardHref = await onward.getAttribute("href");
    expect(onwardHref).toMatch(/\/claude\/kurs\/anatomy$/);
    await shot("reader-next-after-checkpoint");

    const receipt = await page.evaluate(() => {
      const raw = localStorage.getItem(
        "loehrning:lesson-mission:v1:claude:mental-model",
      );
      return raw
        ? (JSON.parse(raw) as { executionReceipt: string }).executionReceipt
        : null;
    });
    expect(receipt).toBe(getCourseProjectLocalLearningReceipt("claude"));
    await activate(
      page,
      mission.getByRole("button", {
        name:
          locale === "de"
            ? "Lektionsmission zurücksetzen"
            : "Reset lesson mission",
        exact: true,
      }),
    );
    await expectUnobscuredFocus(panelHeading());
    await expect(mission).toHaveAttribute("data-mission-complete", "false");
    await activate(page, onward);
    await expect(page).toHaveURL((url) => url.pathname === onwardHref);
    const position = page.locator("[data-reader-focus-position]");
    await expect(position.locator('[aria-hidden="true"]')).toHaveText("2 / 12");
    await expect(position.locator(".sr-only")).toHaveText(
      locale === "de" ? "Lektion 2 von 12" : "Lesson 2 of 12",
    );

    // The only expected error is the exact intercepted policy-disabled API.
    const unexpected = meaningfulBrowserErrors(errors).filter(
      (error) =>
        !(
          error.source === "console" &&
          error.location?.url ===
            new URL("/api/ai-native/practice", page.url()).href &&
          /(?:503|Service Unavailable)/.test(error.text)
        ),
    );
    expect(unexpected).toEqual([]);
    await testInfo.attach("mission-fixture", {
      body: JSON.stringify({
        route,
        locale,
        viewport: "390x844",
        reducedMotion: locale === "en",
        activation: locale === "en" ? "keyboard-enter" : "pointer",
        fixture: "policy-disabled-local-learning",
        providerExecuted: false,
        receipt,
        fixtureRequests,
      }),
      contentType: "application/json",
    });
  });
}
