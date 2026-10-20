import { describe, expect, it } from "vitest";
import {
  MINUS, NBSP, SUPPRESSED_LABEL, formatBare, formatDateDe, formatDecimal, formatInterval,
  formatN, formatValue,
} from "../format.ts";

describe("German formatting", () => {
  it("groups thousands with a dot and uses a decimal comma", () => {
    expect(formatDecimal(25581)).toBe("25.581");
    expect(formatDecimal(1234567.5, 1)).toBe("1.234.567,5");
    expect(formatDecimal(4.04, 1)).toBe("4,0");
    expect(formatDecimal(0, 1)).toBe("0,0");
  });

  it("rounds half away from zero", () => {
    expect(formatDecimal(4.05, 1)).toBe("4,1");
    expect(formatDecimal(1.005, 2)).toBe("1,01");
    expect(formatDecimal(-4.05, 1)).toBe(`${MINUS}4,1`);
  });

  it("writes a real minus sign and optional plus", () => {
    expect(formatDecimal(-3.9, 1)).toBe(`${MINUS}3,9`);
    expect(formatDecimal(0.3, 1, true)).toBe("+0,3");
    expect(formatDecimal(0, 1, true)).toBe("0,0");
  });

  it("never prints en or em dashes", () => {
    const all = [formatDecimal(-1.5, 1), formatInterval({ style: "percent" }, 1, 2), formatDateDe("2026-10-18")].join("");
    expect(all).not.toMatch(new RegExp("[\\u2013\\u2014]"));
  });

  it("puts a non-breaking space before the percent sign", () => {
    expect(formatValue({ style: "percent" }, 4)).toBe(`4,0${NBSP}%`);
    expect(formatValue({ style: "percent", digits: 0 }, 54.5)).toBe(`55${NBSP}%`);
  });

  it("formats numbers with units and without", () => {
    expect(formatValue({ style: "number" }, 422)).toBe("422");
    expect(formatValue({ style: "number", unit: "pro Mio." }, 9.5)).toBe(`10${NBSP}pro Mio.`);
    expect(formatValue({ style: "decimal", digits: 2 }, 0.81)).toBe("0,81");
    expect(formatBare({ style: "percent" }, 4)).toBe("4,0");
  });

  it("prints the suppression label for null", () => {
    expect(formatValue({ style: "percent" }, null)).toBe(SUPPRESSED_LABEL);
    expect(SUPPRESSED_LABEL).toBe("weniger als 5");
  });

  it("formats intervals, sample sizes and dates", () => {
    expect(formatInterval({ style: "percent" }, 3.7, 4.2)).toBe(`3,7 bis 4,2${NBSP}%`);
    expect(formatN(25581)).toBe(`n${NBSP}=${NBSP}25.581`);
    expect(formatDateDe("2026-10-18")).toBe("18.10.2026");
    expect(formatDateDe("heute")).toBe("heute");
  });
});
