import { describe, expect, it } from "vitest";
import { sanitizeTelemetryUrl } from "./url-policy";

const SITE = "https://loehrning.ai";

describe("sanitizeTelemetryUrl", () => {
  it("returns null for a malformed URL", () => {
    expect(sanitizeTelemetryUrl("not a url")).toBeNull();
    expect(sanitizeTelemetryUrl("")).toBeNull();
  });

  it("returns null for a non-web protocol", () => {
    expect(sanitizeTelemetryUrl("about:blank")).toBeNull();
    expect(sanitizeTelemetryUrl("javascript:void(0)")).toBeNull();
  });

  it("returns null for a non-string input", () => {
    expect(sanitizeTelemetryUrl(undefined as unknown as string)).toBeNull();
  });

  it("keeps a plain URL unchanged", () => {
    expect(sanitizeTelemetryUrl(`${SITE}/kurse`)).toBe(`${SITE}/kurse`);
  });

  it("always removes the fragment", () => {
    expect(sanitizeTelemetryUrl(`${SITE}/ki-fuehrerschein/kurs/block_1#lesson=x`)).toBe(
      `${SITE}/ki-fuehrerschein/kurs/block_1`,
    );
    expect(sanitizeTelemetryUrl(`${SITE}/demos?cat=agenten#top`)).toBe(
      `${SITE}/demos?cat=agenten`,
    );
  });

  it("removes every query parameter outside the demo gallery", () => {
    expect(
      sanitizeTelemetryUrl(`${SITE}/login?next=%2Fkonto&reason=abgelaufen&code=abc`),
    ).toBe(`${SITE}/login`);
    expect(sanitizeTelemetryUrl(`${SITE}/kurse?cat=agenten`)).toBe(`${SITE}/kurse`);
  });

  it("removes credentials from the URL", () => {
    expect(sanitizeTelemetryUrl("https://someone:secret@loehrning.ai/konto?x=1")).toBe(
      `${SITE}/konto`,
    );
  });

  it.each(["/demos", "/en/demos"])(
    "keeps slug-shaped demo filters on %s",
    (pathname) => {
      expect(
        sanitizeTelemetryUrl(
          `${SITE}${pathname}?cat=agenten&level=mittel&industry=handel&sort=neu`,
        ),
      ).toBe(`${SITE}${pathname}?cat=agenten&level=mittel&industry=handel&sort=neu`);
    },
  );

  it("drops demo filter values that are not lowercase slugs", () => {
    expect(
      sanitizeTelemetryUrl(
        `${SITE}/demos?cat=Automatisierung&level=a%40b.example&industry=${"a".repeat(49)}&sort=_x`,
      ),
    ).toBe(`${SITE}/demos`);
  });

  it("drops non-filter keys on the demo gallery", () => {
    expect(sanitizeTelemetryUrl(`${SITE}/demos?cat=agenten&utm_source=x&q=hello`)).toBe(
      `${SITE}/demos?cat=agenten`,
    );
  });

  it("keeps only the first value of a repeated filter key", () => {
    expect(sanitizeTelemetryUrl(`${SITE}/demos?cat=agenten&cat=daten`)).toBe(
      `${SITE}/demos?cat=agenten`,
    );
  });

  it.each(["/demos/excel", "/demos/", "/en/demos/word", "/de/demos"])(
    "removes every query parameter on %s, which is not exactly the gallery",
    (pathname) => {
      expect(sanitizeTelemetryUrl(`${SITE}${pathname}?cat=agenten`)).toBe(
        `${SITE}${pathname}`,
      );
    },
  );

  it("accepts a 48-character filter value", () => {
    const value = "a".repeat(48);
    expect(sanitizeTelemetryUrl(`${SITE}/demos?sort=${value}`)).toBe(
      `${SITE}/demos?sort=${value}`,
    );
  });
});
