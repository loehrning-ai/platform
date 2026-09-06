import { describe, expect, it } from "vitest";
import { formatUtcDate, formatUtcMoment, utcMomentParts } from "./moment";

describe("UTC moment formatting", () => {
  it("reads an ISO instant into padded UTC parts", () => {
    expect(utcMomentParts("2026-09-05T07:04:09.123Z")).toEqual({
      year: "2026",
      month: "09",
      day: "05",
      hour: "07",
      minute: "04",
    });
  });

  it("normalises an offset instant to UTC rather than keeping local fields", () => {
    expect(utcMomentParts("2026-09-05T01:30:00+02:00")).toMatchObject({
      day: "04",
      hour: "23",
      minute: "30",
    });
  });

  it("refuses anything that is not an instant", () => {
    for (const value of [
      null,
      undefined,
      42,
      "",
      "2026-09-05",
      "yesterday",
      "2026-13-40T00:00:00Z",
    ]) {
      expect(utcMomentParts(value)).toBeNull();
    }
  });

  it("orders date fields per locale", () => {
    expect(formatUtcDate("2026-09-05T07:04:09Z", "de")).toBe("05.09.2026");
    expect(formatUtcDate("2026-09-05T07:04:09Z", "en")).toBe("2026-09-05");
  });

  it("always names the zone so nobody reads it as local time", () => {
    expect(formatUtcMoment("2026-09-05T07:04:09Z", "de")).toBe(
      "05.09.2026, 07:04 UTC",
    );
    expect(formatUtcMoment("2026-09-05T07:04:09Z", "en")).toBe(
      "2026-09-05, 07:04 UTC",
    );
  });

  it("returns null instead of an invalid date so callers can fall back", () => {
    expect(formatUtcMoment("not-a-date", "de")).toBeNull();
    expect(formatUtcDate(undefined, "en")).toBeNull();
  });

  it("does not depend on the host time zone", () => {
    // The formatter must produce the same string on a CI runner in UTC and on
    // a laptop in Europe/Berlin, or the server render and the island render
    // would disagree after hydration.
    const original = process.env.TZ;
    try {
      process.env.TZ = "Pacific/Kiritimati";
      expect(formatUtcMoment("2026-09-05T23:30:00Z", "de")).toBe(
        "05.09.2026, 23:30 UTC",
      );
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });
});
