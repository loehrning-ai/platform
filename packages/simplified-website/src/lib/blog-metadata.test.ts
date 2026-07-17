import { describe, it, expect } from "vitest";
import {
  BLOG_POSTS,
  BLOG_LAST_MODIFIED,
  getPostNumberLabel,
} from "./blog-metadata";

const BANNED_PHRASES = [
  "Mittelstand",
  "KI-Transformation",
  "Wettbewerbsvorteil",
  "Mehrwert",
  "disruptiv",
  "zukunftssicher",
  "Jetzt loslegen",
  "Hier klicken",
  "Paradigmenwechsel",
];

describe("BLOG_POSTS manifest", () => {
  it("has at least one post", () => {
    expect(BLOG_POSTS.length).toBeGreaterThan(0);
  });

  it("each post has non-empty required fields", () => {
    for (const post of BLOG_POSTS) {
      expect(post.slug, `slug empty on post ${post.postNumber}`).toBeTruthy();
      expect(post.titleDe, `titleDe empty on ${post.slug}`).toBeTruthy();
      expect(post.summary, `summary empty on ${post.slug}`).toBeTruthy();
      expect(post.datePublished, `datePublished empty on ${post.slug}`).toBeTruthy();
      expect(post.dateModified, `dateModified empty on ${post.slug}`).toBeTruthy();
      expect(post.tags.length, `no tags on ${post.slug}`).toBeGreaterThan(0);
      expect(post.readingTimeMin, `readingTimeMin zero on ${post.slug}`).toBeGreaterThan(0);
      expect(post.postNumber, `postNumber zero on ${post.slug}`).toBeGreaterThan(0);
    }
  });

  it("dateModified >= datePublished for each post", () => {
    for (const post of BLOG_POSTS) {
      expect(
        post.dateModified >= post.datePublished,
        `${post.slug}: dateModified ${post.dateModified} < datePublished ${post.datePublished}`,
      ).toBe(true);
    }
  });

  it("no slug starts with underscore, bracket, or dot", () => {
    for (const post of BLOG_POSTS) {
      expect(post.slug).not.toMatch(/^[_\[\].]/);
    }
  });

  it("no duplicate slugs", () => {
    const slugs = BLOG_POSTS.map((p) => p.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("no duplicate postNumbers", () => {
    const nums = BLOG_POSTS.map((p) => p.postNumber);
    const unique = new Set(nums);
    expect(unique.size).toBe(nums.length);
  });

  it("uses contiguous post numbers starting at one", () => {
    expect(BLOG_POSTS.map((post) => post.postNumber).sort((a, b) => a - b)).toEqual(
      Array.from({ length: BLOG_POSTS.length }, (_, index) => index + 1),
    );
  });

  it("does not include retired slugs", () => {
    const slugs = BLOG_POSTS.map((p) => p.slug);
    expect(slugs).not.toContain("digify");
    expect(slugs).not.toContain("ki-beratungsluecke");
    expect(slugs).not.toContain("ki-und-arbeit");
    expect(slugs).not.toContain("deepfake-erkennen");
    expect(slugs).not.toContain("eu-ai-act-update-2026-06");
  });

  it("contains exactly the single definitive EU AI Act post", () => {
    const slugs = BLOG_POSTS.map((p) => p.slug);
    expect(slugs).toEqual(["eu-ai-act-grundlagen"]);
    expect(BLOG_POSTS[0].postNumber).toBe(1);
  });

  it("dates are valid ISO 8601 YYYY-MM-DD format", () => {
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    for (const post of BLOG_POSTS) {
      expect(post.datePublished, `${post.slug} datePublished not ISO`).toMatch(iso);
      expect(post.dateModified, `${post.slug} dateModified not ISO`).toMatch(iso);
    }
  });

  it("no banned commercial phrases in titleDe or summary", () => {
    for (const post of BLOG_POSTS) {
      for (const phrase of BANNED_PHRASES) {
        expect(post.titleDe, `"${phrase}" in titleDe of ${post.slug}`).not.toContain(phrase);
        expect(post.summary, `"${phrase}" in summary of ${post.slug}`).not.toContain(phrase);
      }
    }
  });
});

describe("getPostNumberLabel", () => {
  it("returns the zero-padded manifest postNumber for every slug", () => {
    for (const post of BLOG_POSTS) {
      expect(getPostNumberLabel(post.slug)).toBe(
        String(post.postNumber).padStart(2, "0"),
      );
    }
  });

  it("throws on an unknown slug", () => {
    expect(() => getPostNumberLabel("ki-und-arbeit")).toThrow(/unknown blog slug/);
  });
});

describe("BLOG_LAST_MODIFIED", () => {
  it("is a valid ISO date string", () => {
    expect(BLOG_LAST_MODIFIED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("equals the most recent dateModified in BLOG_POSTS", () => {
    const latest = BLOG_POSTS.reduce(
      (acc, p) => (p.dateModified > acc ? p.dateModified : acc),
      "2000-01-01",
    );
    expect(BLOG_LAST_MODIFIED).toBe(latest);
  });
});
