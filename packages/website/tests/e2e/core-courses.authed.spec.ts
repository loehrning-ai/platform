import { expect, test, type Page } from "@playwright/test";

/**
 * Projects where the SERVER resolves a real session, so the signed-in DOM is
 * expected to render: the credentialed live tier, and the mocked-session tier
 * whose Supabase endpoints are served in-process. The provider-free
 * `auth-scaffold` project is deliberately absent - it is always signed out.
 */
const SERVER_SESSION_PROJECTS = new Set([
  "authenticated-live",
  "konto-dom-mocked",
]);


const CORE_ROUTES = [
  {
    hub: "/ki-fuehrerschein/kurs",
    hubHeading: "KI-Führerschein",
    lesson: "/ki-fuehrerschein/kurs/block_1",
    lessonHeading: "KI ist schon da",
  },
  {
    hub: "/eu-ai-act-kurs/kurs",
    hubHeading: "EU AI Act Kurs",
    lesson: "/eu-ai-act-kurs/kurs/block_1",
    lessonHeading: "Warum & Für wen",
  },
  {
    hub: "/ki-und-gesellschaft/kurs",
    hubHeading: "KI und Gesellschaft",
    lesson: "/ki-und-gesellschaft/kurs/block_1",
    lessonHeading: "KI und Arbeit",
  },
  {
    hub: "/ai-native/kurs",
    hubHeading: "AI-Native Arbeitskurs: Kurs",
    lesson: "/ai-native/kurs/modul_1/modul_1_lesson_1",
    lessonHeading: "Der Moment, in dem du aufhörst, selbst zu schreiben.",
  },
] as const;

function collectBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test.describe("authenticated German core-course journey", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      !SERVER_SESSION_PROJECTS.has(testInfo.project.name),
      "Protected course content requires the explicit live-auth project.",
    );
  });

  test("a verified session follows the sanitized login return target into a protected lesson", async ({
    page,
  }) => {
    const target = CORE_ROUTES[0].lesson;
    const response = await page.goto(
      `/login?next=${encodeURIComponent(target)}`,
      { waitUntil: "domcontentloaded" },
    );

    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(new RegExp(`${target.replaceAll("/", "\\/")}$`));
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: CORE_ROUTES[0].lessonHeading,
      }),
    ).toBeVisible();
  });

  for (const route of CORE_ROUTES) {
    test(`${route.hub} and its first lesson render for a server-validated session`, async ({
      page,
    }) => {
      const errors = collectBrowserErrors(page);

      const hubResponse = await page.goto(route.hub, {
        waitUntil: "domcontentloaded",
      });
      expect(hubResponse?.status(), route.hub).toBe(200);
      await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
      await expect(
        page.getByRole("heading", { level: 1, name: route.hubHeading }),
      ).toBeVisible();

      const lessonResponse = await page.goto(route.lesson, {
        waitUntil: "domcontentloaded",
      });
      expect(lessonResponse?.status(), route.lesson).toBe(200);
      await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
      await expect(
        page.getByRole("heading", { level: 1, name: route.lessonHeading }),
      ).toBeVisible();
      expect(errors, errors.join("\n")).toEqual([]);
    });
  }

  test("the authenticated shell resolves an account owner and reads synchronized progress", async ({
    page,
  }) => {
    const progressResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/progress" &&
        response.request().method() === "GET",
    );

    await page.goto(CORE_ROUTES[0].hub, { waitUntil: "domcontentloaded" });
    const response = await progressResponse;
    expect(response.status()).toBe(200);
    const body = (await response.json()) as {
      ownerId?: unknown;
      progress?: unknown;
    };
    expect(typeof body.ownerId).toBe("string");
    expect(body.ownerId).not.toBe("");

    await expect
      .poll(() =>
        page.evaluate(() =>
          Object.keys(localStorage).some((key) =>
            key.startsWith("loehrning-learning-account-v1:"),
          ),
        ),
      )
      .toBe(true);
  });
});
