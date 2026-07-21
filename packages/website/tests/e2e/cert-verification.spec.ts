import { test, expect } from "@playwright/test";

/**
 * Certificate verification pages for the three free courses (performance hardening).
 *
 * Contract (src/components/course/kurs/verification-page.tsx): the page is
 * hash-driven, not form-driven. The URL fragment carries a base64url-encoded
 * JSON payload {n: name, s: score, m: completionMode, d: completedAt,
 * c: courseSlug, v: version}.
 *   - missing or undecodable hash → "Zertifikatcode nicht lesbar" rejection card
 *   - valid hash → "QR-Daten gelesen" card with name, score and date
 * Every render state keeps exactly one (sr-only) h1.
 */

const COURSES = [
  {
    route: "/ki-fuehrerschein/verifizierung",
    slug: "ki-fuehrerschein",
    title: /KI-Führerschein/,
  },
  {
    route: "/eu-ai-act-kurs/verifizierung",
    slug: "eu-ai-act-kurs",
    title: /EU AI Act/,
  },
  {
    route: "/ai-native/verifizierung",
    slug: "ai-native",
    title: /AI-Native/,
  },
  // plan 008 stage 13: claude's basePath is nested under /kurse/open-source/
  // (unlike the other three courses' top-level paths), exercising the same
  // shared VerificationPage/decodeHash logic on a differently-shaped URL.
  {
    route: "/kurse/open-source/claude/verifizierung",
    slug: "claude",
    title: /Claude Course/,
  },
  // plan 009 stage 8: codex, same nested-path shape as claude and the same
  // "completion" (all-lessons-done) eligibility path rather than a quiz —
  // still exercises the identical hash-decode/course-match logic.
  {
    route: "/kurse/open-source/codex/verifizierung",
    slug: "codex",
    title: /Codex Course/,
  },
  // plan 010 stage 14: data-infrastructure, same nested-path shape and
  // "completion" eligibility path as codex. The m: "quiz" payload below is
  // shared test-mechanism scaffolding, not a claim this course actually
  // issues quiz-mode certificates — it only exercises decodeHash/course-
  // match/bit-flip-rejection generically, identically to every other row.
  {
    route: "/kurse/open-source/data-infrastructure/verifizierung",
    slug: "data-infrastructure",
    title: /Data Infrastructure/,
  },
  // plan 011 stage 14: data-engineering-fundamentals, same nested-path shape
  // and "completion" (all-12-chapters-visited) eligibility path as codex and
  // data-infrastructure — no quiz/capstone mechanism exists in source. The
  // m: "quiz" payload below is shared test-mechanism scaffolding only; it
  // exercises decodeHash/course-match/bit-flip-rejection generically, same
  // as every other row.
  {
    route: "/kurse/open-source/data-engineering-fundamentals/verifizierung",
    slug: "data-engineering-fundamentals",
    title: /Data Engineering Fundamentals/,
  },
  // plan 012 stage 14: data-science, same nested-path shape and
  // "completion" (all-12-numbered-chapters-visited) eligibility path as
  // codex/data-infrastructure/data-engineering-fundamentals — no
  // quiz/capstone mechanism exists in source. The m: "quiz" payload below
  // is shared test-mechanism scaffolding only; it exercises decodeHash/
  // course-match/bit-flip-rejection generically, same as every other row.
  {
    route: "/kurse/open-source/data-science/verifizierung",
    slug: "data-science",
    title: /Data Science Fundamentals/,
  },
  // plan 013 stage 13: ai-native-operator, sixth and last imported course to
  // flip. Same nested-path shape as claude/codex/data-*, but unlike the four
  // "completion"-eligibility siblings, this course genuinely has a
  // quiz-gated cert path (9 module knowledge-checks pooled into one
  // workshop quiz), so m: "quiz" here is a real payload shape, not
  // test-mechanism scaffolding.
  {
    route: "/kurse/open-source/ai-native-operator/verifizierung",
    slug: "ai-native-operator",
    title: /The AI-Native Operator/,
  },
] as const;

/** Encode a certificate payload exactly like the app's serializer (base64url). */
function encodeCertHash(payload: {
  n: string;
  s: number;
  m: "quiz";
  d: string;
  c: (typeof COURSES)[number]["slug"];
  v: number;
}): string {
  return Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

for (const { route, title, slug } of COURSES) {
  const validHash = encodeCertHash({
    n: "Max Mustermann",
    s: 92,
    m: "quiz",
    d: "2026-06-01T10:00:00.000Z",
    c: slug,
    v: 1,
  });

  test.describe(`${route}`, () => {
    test("renders with one h1 and a back link; no hash is rejected", async ({
      page,
    }) => {
      const res = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(res?.status()).toBeLessThan(400);

      // Exactly one (sr-only) h1 in every render state.
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText("Zertifikatdaten prüfen");
      await expect(
        page.getByRole("link", { name: /Zurück zum/ }),
      ).toBeVisible();

      // Without a verification hash the page shows the rejection state.
      await expect(page.getByText("Zertifikatcode nicht lesbar")).toBeVisible();
    });

    test("an undecodable verification code shows the rejection state", async ({
      page,
    }) => {
      await page.goto(`${route}#not-a-valid-certificate-code!!`, {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByText("Zertifikatcode nicht lesbar")).toBeVisible();
      await expect(page.getByText("QR-Daten gelesen", { exact: true })).toHaveCount(0);
    });

    test("a valid verification code renders the verified certificate", async ({
      page,
    }) => {
      await page.goto(`${route}#${validHash}`, {
        waitUntil: "domcontentloaded",
      });

      await expect(page.getByText("QR-Daten gelesen", { exact: true })).toBeVisible();
      await expect(page.getByText("Max Mustermann")).toBeVisible();
      await expect(page.getByText("Ergebnis: 92%")).toBeVisible();
      // Course-specific certificate title comes from the course config.
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
      await expect(page.getByText("Zertifikatcode nicht lesbar")).toHaveCount(0);
    });

    // -----------------------------------------------------------------------
    // accessibility hardening: Forged-certificate-rejection tests
    //
    // Case C (expiry) is DEFERRED: verification-page.tsx stores d: completedAt
    // for display only — there is zero time-comparison logic in decodeHash().
    // A test for stale timestamps would always pass regardless of the value.
    // Case C must be added in a follow-on plan that adds expiry-check logic
    // to decodeHash() in verification-page.tsx.
    // -----------------------------------------------------------------------

    test("Case A: bit-flipped payload shows rejection state", async ({
      page,
    }) => {
      // Flip one character in the base64url-encoded payload to produce
      // an undecodable JSON string. The verification page must show
      // "Zertifikatcode nicht lesbar" and must NOT show "QR-Daten gelesen".
      const flipped = validHash.slice(0, -1) + (validHash.at(-1) === "A" ? "B" : "A");

      await page.goto(`${route}#${flipped}`, { waitUntil: "domcontentloaded" });

      await expect(
        page.getByText("Zertifikatcode nicht lesbar"),
        "Bit-flipped payload must trigger rejection",
      ).toBeVisible();
      await expect(
        page.getByText("QR-Daten gelesen", { exact: true }),
        "Bit-flipped payload must NOT show 'QR-Daten gelesen'",
      ).toHaveCount(0);

      // Must not render learner data or download controls
      await expect(page.getByText("Max Mustermann")).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: /Download/i }),
      ).toHaveCount(0);

      // Must not claim legal/governmental validity
      await expect(page.getByText(/Art\.\s*4/)).toHaveCount(0);
      await expect(page.getByText(/Konformität/)).toHaveCount(0);
      await expect(page.getByText(/rechtssicher/)).toHaveCount(0);
    });

    test("Case B: wrong-course replay shows course-mismatch rejection", async ({
      page,
    }) => {
      // Take a valid payload for this course, change the `c` field to a
      // different course slug, re-encode, and navigate to THIS course's
      // verification page. The page must show the course-mismatch message.
      const otherSlug =
        slug === "ki-fuehrerschein"
          ? "eu-ai-act-kurs"
          : slug === "eu-ai-act-kurs"
            ? "ai-native"
            : "ki-fuehrerschein";

      // Encode the payload with a DIFFERENT course slug (cross-course replay)
      // but keep `c` pointing to the wrong course by direct JSON manipulation.
      const replayedHash = Buffer.from(
        JSON.stringify({
          n: "Max Mustermann",
          s: 92,
          m: "quiz",
          d: "2026-06-01T10:00:00.000Z",
          c: otherSlug, // wrong course slug — does NOT match `slug`
          v: 1,
        }),
        "utf8",
      )
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      await page.goto(`${route}#${replayedHash}`, {
        waitUntil: "domcontentloaded",
      });

      await expect(
        page.getByText("Zertifikatcode passt nicht zu diesem Kurs."),
        `Cross-course replay on ${route} must show course-mismatch rejection`,
      ).toBeVisible();
      await expect(
        page.getByText("QR-Daten gelesen", { exact: true }),
        "Cross-course replay must NOT show 'QR-Daten gelesen'",
      ).toHaveCount(0);

      // Must not render learner data or download controls
      await expect(page.getByText("Max Mustermann")).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: /Download/i }),
      ).toHaveCount(0);

      // Must not claim legal/governmental validity
      await expect(page.getByText(/Art\.\s*4/)).toHaveCount(0);
      await expect(page.getByText(/Konformität/)).toHaveCount(0);
      await expect(page.getByText(/rechtssicher/)).toHaveCount(0);
    });
  });
}
