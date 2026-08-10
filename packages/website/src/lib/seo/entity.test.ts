/**
 * Cross-object invariants for canonical URLs, entity identifiers, verified
 * profiles, and the verified GitHub organization.
 */

import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  ENTITY_IDS,
  GITHUB_ORG,
  ORGANIZATION_SAME_AS_URLS,
  PERSON_SAME_AS_URLS,
  SITE_ENTITY,
  SITE_LANGUAGE,
  SITE_LANGUAGES,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_REGION,
  TIM_ENTITY,
} from "./entity";

describe("absoluteUrl", () => {
  it("returns the bare origin (no trailing slash) with no arguments", () => {
    expect(absoluteUrl()).toBe("https://loehrning.ai");
  });

  it("collapses an explicit root path to the bare origin", () => {
    expect(absoluteUrl("/")).toBe("https://loehrning.ai");
  });

  it("treats an empty string as root and returns the bare origin", () => {
    // "" does not start with "/", so it is normalised to "/" and hits the
    // root special-case that strips the trailing slash.
    expect(absoluteUrl("")).toBe("https://loehrning.ai");
  });

  it("keeps a leading-slash path verbatim after the origin", () => {
    expect(absoluteUrl("/ueber-mich")).toBe("https://loehrning.ai/ueber-mich");
  });

  it("prepends a slash to a path that lacks a leading slash", () => {
    expect(absoluteUrl("blog")).toBe("https://loehrning.ai/blog");
  });

  it("handles a nested relative path without a leading slash", () => {
    expect(absoluteUrl("blog/post-1")).toBe("https://loehrning.ai/blog/post-1");
  });

  it("preserves query string and hash on the path unchanged", () => {
    expect(absoluteUrl("/open-source?tab=labs#top")).toBe(
      "https://loehrning.ai/open-source?tab=labs#top",
    );
  });

  it("passes through an already-absolute https URL untouched", () => {
    expect(absoluteUrl("https://example.com/x")).toBe("https://example.com/x");
  });

  it("passes through an already-absolute http URL untouched", () => {
    expect(absoluteUrl("http://example.com/x")).toBe("http://example.com/x");
  });

  it("passes through an uppercase absolute scheme without prefixing it", () => {
    expect(absoluteUrl("HTTPS://example.com")).toBe("HTTPS://example.com");
  });

  it("does not collapse a leading double slash in the path", () => {
    expect(absoluteUrl("//double")).toBe("https://loehrning.ai//double");
  });
});

describe("anchor constants", () => {
  it("locks the canonical origin, name, language and region", () => {
    expect(SITE_ORIGIN).toBe("https://loehrning.ai");
    expect(SITE_NAME).toBe("loehrning.ai");
    expect(SITE_LANGUAGE).toBe("de-DE");
    expect(SITE_LANGUAGES).toEqual(["de-DE", "en-GB"]);
    expect(SITE_REGION).toBe("DE");
  });
});

describe("Tim entity", () => {
  it("uses the real umlaut spelling with an ascii fallback", () => {
    expect(TIM_ENTITY.displayName).toBe("Tim Löhr");
    expect(TIM_ENTITY.asciiName).toBe("Tim Loehr");
    expect(TIM_ENTITY.familyName).toBe("Löhr");
  });

  it("derives profileUrl from the origin and profilePath via absoluteUrl", () => {
    expect(TIM_ENTITY.profileUrl).toBe(absoluteUrl(TIM_ENTITY.profilePath));
    expect(TIM_ENTITY.profileUrl).toBe("https://loehrning.ai/ueber-mich");
  });
});

describe("SITE_ENTITY", () => {
  it("mirrors the shared origin and name anchors", () => {
    expect(SITE_ENTITY.origin).toBe(SITE_ORIGIN);
    expect(SITE_ENTITY.name).toBe(SITE_NAME);
  });

  it("keeps its profile pointer in sync with the Tim entity", () => {
    expect(SITE_ENTITY.profileUrl).toBe(TIM_ENTITY.profileUrl);
    expect(SITE_ENTITY.editorialOwner).toBe(TIM_ENTITY.displayName);
  });

  it("derives openSourceUrl from the origin and openSourcePath", () => {
    expect(SITE_ENTITY.openSourceUrl).toBe(absoluteUrl(SITE_ENTITY.openSourcePath));
    expect(SITE_ENTITY.openSourceUrl).toBe("https://loehrning.ai/open-source");
  });
});

describe("ENTITY_IDS", () => {
  it("builds every JSON-LD @id as an origin-anchored fragment", () => {
    expect(ENTITY_IDS.organization).toBe(`${SITE_ORIGIN}/#org`);
    expect(ENTITY_IDS.person).toBe(`${SITE_ORIGIN}/#tim`);
    expect(ENTITY_IDS.website).toBe(`${SITE_ORIGIN}/#website`);
  });
});

describe("entity-specific sameAs URLs", () => {
  it("keeps only verified personal profiles on the Person entity", () => {
    expect([...PERSON_SAME_AS_URLS]).toEqual([
      TIM_ENTITY.linkedInUrl,
      TIM_ENTITY.personalGithubUrl,
    ]);
    expect(PERSON_SAME_AS_URLS).not.toContain(GITHUB_ORG.url);
  });

  it("keeps only the live GitHub organization on the Organization entity", () => {
    expect([...ORGANIZATION_SAME_AS_URLS]).toEqual([GITHUB_ORG.url]);
    expect(ORGANIZATION_SAME_AS_URLS).not.toContain(
      TIM_ENTITY.personalGithubUrl,
    );
    expect(ORGANIZATION_SAME_AS_URLS).not.toContain(TIM_ENTITY.linkedInUrl);
  });
});

describe("GITHUB_ORG", () => {
  it("anchors the live org URL on the org slug", () => {
    expect(GITHUB_ORG.url).toBe("https://github.com/loehrning-ai");
    expect(GITHUB_ORG.url).toContain(GITHUB_ORG.slug);
  });
});
