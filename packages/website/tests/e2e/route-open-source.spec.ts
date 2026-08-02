import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import {
  OPEN_SOURCE_PROJECT_ARTIFACTS,
  OPEN_SOURCE_TOOL_ARTIFACTS,
  OPEN_SOURCE_VIDEO_ARTIFACTS,
  type ProjectArtifact,
  type ToolArtifact,
  type VideoArtifact,
} from "../../src/lib/open-source/artifacts";

/**
 * /open-source smoke and interaction coverage. Assertions target roles and
 * stable structure so copy changes do not hide real regressions.
 */

const ROUTE = "/open-source";

// Hub constants discovered from src/lib/seo/entity.ts (GITHUB_ORG) remain
// explicit independent assertions. Future tool/project/video cases
// deliberately import the canonical registry so publication cannot omit its
// own browser case. Imported courses are /kurse catalog content and are
// covered by the route matrix, not by this spec.
const ORG_SLUG = "loehrning-ai";
const ORG_URL = `https://github.com/${ORG_SLUG}`;
const SITE_ORIGIN = "https://loehrning.ai";

const DETAIL_ARTIFACTS = [
  ...OPEN_SOURCE_TOOL_ARTIFACTS,
  ...OPEN_SOURCE_PROJECT_ARTIFACTS,
  ...OPEN_SOURCE_VIDEO_ARTIFACTS,
] as const;

// The hub's "Stand" line is derived from the same three published arrays the
// page composes into OPEN_SOURCE_ARTIFACTS, so this expectation tracks
// publication instead of pinning copy. Mirrors publishedArtifactsStatus() in
// src/app/open-source/page.tsx, including the German singular adjective ending.
const PUBLISHED_ARTIFACTS_STATUS =
  DETAIL_ARTIFACTS.length === 0
    ? "Noch kein Eintrag veröffentlicht"
    : DETAIL_ARTIFACTS.length === 1
      ? "1 veröffentlichter Eintrag"
      : `${DETAIL_ARTIFACTS.length} veröffentlichte Einträge`;

const STATUS_LABELS = {
  experimental: "Experimentell",
  stable: "Stabil",
  maintenance: "Wartungsmodus",
  archived: "Archiviert",
} as const;

// Production smoke tests treat every browser error as a defect. Do not hide
// missing assets, hydration failures, or provider requests behind allowlists.
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

function meaningfulErrors(errors: string[]): string[] {
  return errors;
}

async function expectStoredAsset(
  request: APIRequestContext,
  href: string,
  expectedMimeType?: string,
) {
  const response = await request.get(href);
  expect(response.status(), `stored asset ${href}`).toBe(200);
  if (expectedMimeType) {
    expect(
      response.headers()["content-type"],
      `content type for ${href}`,
    ).toContain(expectedMimeType);
  }
  return response;
}

async function expectResolvableInternalHref(
  request: APIRequestContext,
  href: string | undefined,
  label: string,
) {
  if (!href?.startsWith("/")) return;
  const response = await request.get(href);
  expect(response.status(), `${label} ${href}`).toBeGreaterThanOrEqual(200);
  expect(response.status(), `${label} ${href}`).toBeLessThan(400);
}

async function expectSharedDetailContract(
  page: Page,
  request: APIRequestContext,
  artifact: ToolArtifact | ProjectArtifact | VideoArtifact,
) {
  if (artifact.kind === "video") {
    // A failed media request must not remove the independently readable
    // transcript fallback from the server-rendered page.
    await page.route(`**${artifact.watchHref}`, (route) =>
      route.abort("failed"),
    );
  }

  const response = await page.goto(artifact.href, {
    waitUntil: "domcontentloaded",
  });
  expect(response?.status(), `status for ${artifact.href}`).toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: artifact.title }),
  ).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    artifact.description,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${SITE_ORIGIN}${artifact.href}`,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /index.*follow/i,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    `${SITE_ORIGIN}${artifact.href}`,
  );

  // The page emits one @graph holding the breadcrumb trail plus exactly one
  // artifact node (see [kind]/[slug]/page.tsx and its unit spec, which pin
  // the same shape). The publication contract lives on that artifact node.
  const jsonLd = JSON.parse(
    (await page
      .locator(`#open-source-${artifact.kind}-${artifact.slug}-jsonld`)
      .textContent()) ?? "{}",
  ) as { "@graph"?: readonly Record<string, unknown>[] };
  const artifactNodes = (jsonLd["@graph"] ?? []).filter(
    (node) => node["@id"] === `${SITE_ORIGIN}${artifact.href}#artifact`,
  );
  expect(artifactNodes, "exactly one JSON-LD artifact node").toHaveLength(1);
  const [artifactNode] = artifactNodes;
  expect(artifactNode.name).toBe(artifact.title);
  expect(artifactNode.codeRepository).toBe(artifact.source.href);
  expect(artifactNode.version).toBe(artifact.source.revision);
  expect(artifactNode.license).toBe(`${SITE_ORIGIN}${artifact.license.href}`);

  await expect(
    page.getByText(artifact.source.revision.slice(0, 12), { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Quellstand" })).toHaveAttribute(
    "href",
    artifact.source.revisionHref,
  );
  await expect(page.getByRole("link", { name: "Lizenztext" })).toHaveAttribute(
    "href",
    artifact.license.href,
  );
  const license = await expectStoredAsset(request, artifact.license.href);
  expect(
    (await license.body()).byteLength,
    `license size for ${artifact.id}`,
  ).toBe(artifact.license.sizeBytes);

  const expectedLaunchHref =
    artifact.kind === "video" ? artifact.watchHref : artifact.launchHref;
  const launch = page.getByRole("link", { name: /^Öffnen/ });
  if (expectedLaunchHref) {
    await expect(launch).toHaveAttribute("href", expectedLaunchHref);
    await expectResolvableInternalHref(
      request,
      expectedLaunchHref,
      "internal launch target",
    );
  } else {
    await expect(launch).toHaveCount(0);
  }
}

async function expectSoftwareGuide(
  page: Page,
  request: APIRequestContext,
  artifact: ToolArtifact | ProjectArtifact,
) {
  const { guide } = artifact;
  await expect(
    page.getByText(STATUS_LABELS[guide.status], { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(guide.statusNote, { exact: true })).toBeVisible();
  // The guide gives the <img> an empty alt and carries the prose once, as
  // the visible <figcaption> that also labels the <figure> — so a screen
  // reader hears it exactly once. The unit spec pins the same contract
  // (software-artifact-guide.test.tsx); assert the figure's accessible
  // name, not an img role the empty alt intentionally removes.
  await expect(
    page.getByRole("figure", { name: guide.screenshot.alt }),
  ).toBeVisible();
  await expect(
    page.getByText(guide.screenshot.alt, { exact: true }),
  ).toBeVisible();
  await expectStoredAsset(request, guide.screenshot.src);

  for (const heading of [
    "Voraussetzungen",
    "Installation",
    "Verwendung",
    "Integration",
    "Dokumentation und Vertiefung",
  ]) {
    // Exact level-2 match: the guide renders every section as an <h2>, and a
    // record's own step titles may legitimately contain a section word (the
    // cv-engine step "Installation gegen die Testsuite prüfen" is an <h3>),
    // which a substring locator would collide with under strict mode.
    await expect(
      page.getByRole("heading", { level: 2, name: heading, exact: true }),
    ).toBeVisible();
  }
  for (const prerequisite of guide.prerequisites) {
    if (prerequisite.href?.startsWith("https://")) {
      // An external prerequisite renders its label as a link whose
      // accessible name deliberately appends the screen-reader-only
      // ", öffnet in neuem Tab" suffix, so the element's text is never
      // exactly the label. Assert the announced contract instead. The name
      // computation joins the label node and the suffix span with a space,
      // so match the boundary with flexible whitespace.
      const escapedLabel = prerequisite.label.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );
      await expect(
        page.getByRole("link", {
          name: new RegExp(`^${escapedLabel}\\s*, öffnet in neuem Tab$`),
        }),
      ).toBeVisible();
    } else if (prerequisite.href) {
      await expect(
        page.getByRole("link", { name: prerequisite.label, exact: true }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByText(prerequisite.label, { exact: true }).first(),
      ).toBeVisible();
    }
    await expect(
      page.getByText(prerequisite.detail, { exact: true }).first(),
    ).toBeVisible();
    await expectResolvableInternalHref(
      request,
      prerequisite.href,
      "internal prerequisite target",
    );
  }
  for (const procedure of [
    guide.installation,
    guide.usage,
    guide.integration,
  ]) {
    await expect(
      page.getByText(procedure.summary, { exact: true }).first(),
    ).toBeVisible();
    for (const step of procedure.steps) {
      // Step titles are level-3 headings. Integration prefixes them with a
      // visible ordinal ("1. …") while installation/usage render a styled
      // counter outside the heading text, so match the title as a suffix of
      // the heading's accessible name rather than as exact page text.
      const escapedTitle = step.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      await expect(
        page
          .getByRole("heading", {
            level: 3,
            name: new RegExp(`^(?:\\d+\\.\\s*)?${escapedTitle}$`),
          })
          .first(),
      ).toBeVisible();
      await expect(
        page.getByText(step.detail, { exact: true }).first(),
      ).toBeVisible();
      if (step.command) {
        await expect(
          page.getByText(step.command, { exact: true }).first(),
        ).toBeVisible();
        await expect(
          page.getByRole("button", {
            name: `Befehl für ${step.title} kopieren`,
          }),
        ).toBeVisible();
      }
    }
  }
  for (const target of guide.integration.targets) {
    await expect(page.getByText(target, { exact: true }).first()).toBeVisible();
  }
  await expect(
    page.getByRole("link", { name: guide.documentation.label }),
  ).toHaveAttribute("href", guide.documentation.href);
  await expectResolvableInternalHref(
    request,
    guide.documentation.href,
    "internal documentation target",
  );
  for (const related of guide.relatedLearning) {
    // Scoped to the main landmark: the global footer legitimately links the
    // same learning routes, which a page-wide locator collides with under
    // strict mode.
    await expect(
      page.getByRole("main").getByRole("link", { name: related.title }),
    ).toHaveAttribute("href", related.href);
    await expect(
      page.getByRole("main").getByText(related.description, { exact: true }),
    ).toBeVisible();
    await expectResolvableInternalHref(
      request,
      related.href,
      "internal related-learning target",
    );
  }
}

test.describe("/open-source hub", () => {
  test("loads, shows the h1, renders to the bottom, and logs no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(/Werkverzeichnis/i);

    // The shelf: one unified grid, the kind as a stamp on the card (never a
    // heading), and the GitHub action naming the repo path.
    await expect(
      page.getByRole("heading", { level: 2, name: "Alle Werke" }),
    ).toBeVisible();
    await expect(page.getByText("Werkzeug", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Werkzeuge", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /Quelle loehrning-ai\/cv-engine/ }),
    ).toHaveAttribute("href", "https://github.com/loehrning-ai/cv-engine");

    // Structural heading at the foot of the page proves it rendered fully.
    await expect(
      page.getByRole("heading", { name: "Code und redaktionelle Inhalte" }),
    ).toBeVisible();

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${ROUTE}\n${noise.join("\n")}`).toEqual(
      [],
    );
  });

  test("names the GitHub organization as the publication target and reports the registry-derived published count", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Quellenprinzip").first()).toBeVisible();
    await expect(
      page.getByText(PUBLISHED_ARTIFACTS_STATUS).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Veröffentlichungsstandard" }),
    ).toBeVisible();
    await expect(page.getByText("Quellplattform")).toBeVisible();
    await expect(
      page.getByRole("link", { name: new RegExp(ORG_SLUG) }).first(),
    ).toHaveAttribute("href", ORG_URL);
  });

  test("does not list imported courses and cross-links the technical courses to /kurse", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    // Imported courses stay under /kurse; the hub must not render lab cards.
    await expect(
      page.getByRole("heading", { name: "Data Engineering Fundamentals" }),
    ).toHaveCount(0);
    await expect(page.locator('a[href^="/kurse/open-source/"]')).toHaveCount(0);

    await expect(
      page.getByText(/Die technischen Lernkurse findest du unter/i),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "/kurse" })).toHaveAttribute(
      "href",
      "/kurse",
    );
  });

  test("distinguishes the code license from editorial-content rights", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Code und redaktionelle Inhalte" }),
    ).toBeVisible();
    await expect(
      page.getByText(/Plattform-Code auf GitHub.*steht unter MIT/i),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Plattform-Code auf GitHub/i }),
    ).toHaveAttribute("href", "https://github.com/loehrning-ai/platform");
    const policyLink = page
      .locator("#lizenzmodell")
      .getByRole("link", { name: "Lizenzrichtlinie" });
    await expect(policyLink).toHaveAttribute(
      "href",
      "/open-source/lizenzrichtlinie",
    );
    await policyLink.click();
    await expect(page).toHaveURL(/\/open-source\/lizenzrichtlinie$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Lizenzrichtlinie" }),
    ).toBeVisible();
    await expect(page.getByText(/# License Policy/)).toBeVisible();
    await expect(
      page.getByText(/Editorial content: source-visible/),
    ).toBeVisible();
  });

});

test.describe("/open-source mobile", () => {
  test("has no horizontal overflow at 390px and keeps content visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Veröffentlichungsstandard" }),
    ).toBeVisible();
    await expect(
      page.getByText(PUBLISHED_ARTIFACTS_STATUS).first(),
    ).toBeVisible();

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
      innerWidth: window.innerWidth,
    }));
    expect(
      scrollWidth,
      `horizontal overflow at 390px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
    ).toBeLessThanOrEqual(innerWidth + 1);
  });
});

// Registry-driven admission coverage. These loops intentionally register no
// current cases while the tool, project, and video arrays are empty. The same
// change that publishes the first entry automatically adds its real detail
// route to the public desktop and mobile browser gate.
for (const artifact of DETAIL_ARTIFACTS) {
  test.describe(`${artifact.kind}:${artifact.slug} public detail`, () => {
    test("renders its complete publication contract", async ({
      page,
      request,
    }) => {
      await expectSharedDetailContract(page, request, artifact);

      if (artifact.kind === "tool" || artifact.kind === "project") {
        await expectSoftwareGuide(page, request, artifact);
        return;
      }

      const player = page.locator("video");
      await expect(player).toHaveAttribute("poster", artifact.posterSrc);
      await expect(player.locator("source")).toHaveAttribute(
        "src",
        artifact.watchHref,
      );
      await expect(player.locator("source")).toHaveAttribute(
        "type",
        artifact.mediaFiles.video.mimeType,
      );
      await expect(player.locator('track[kind="captions"]')).toHaveAttribute(
        "src",
        artifact.captionsHref,
      );
      await expect(player.locator('track[kind="captions"]')).toHaveAttribute(
        "srclang",
        artifact.publication.captionLanguage,
      );
      await expect(player.locator('track[kind="captions"]')).toHaveAttribute(
        "default",
        "",
      );

      const videoResponse = await request.head(artifact.watchHref);
      expect(videoResponse.status(), `stored video ${artifact.watchHref}`).toBe(
        200,
      );
      expect(
        videoResponse.headers()["content-type"],
        `content type for ${artifact.watchHref}`,
      ).toContain(artifact.mediaFiles.video.mimeType);

      const transcriptLink = page.getByRole("link", {
        name: "Transkript lesen",
      });
      await expect(transcriptLink).toBeVisible();
      await expect(transcriptLink).toHaveAttribute(
        "href",
        artifact.transcriptHref,
      );
      await expectStoredAsset(
        request,
        artifact.captionsHref,
        artifact.mediaFiles.captions.mimeType,
      );
      await expectStoredAsset(
        request,
        artifact.transcriptHref,
        artifact.mediaFiles.transcript.mimeType,
      );
      await expectStoredAsset(
        request,
        artifact.posterSrc,
        artifact.mediaFiles.poster.mimeType,
      );
    });

    test("has no horizontal overflow at the mobile audit viewport", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(artifact.href, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { level: 1, name: artifact.title }),
      ).toBeVisible();

      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
        innerWidth: window.innerWidth,
      }));
      expect(
        scrollWidth,
        `${artifact.id}: horizontal overflow at 390px (${scrollWidth} > ${innerWidth})`,
      ).toBeLessThanOrEqual(innerWidth + 1);
    });
  });
}
