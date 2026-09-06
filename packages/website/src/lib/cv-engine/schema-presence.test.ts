import { describe, expect, it } from "vitest";

import {
  isMissingFunctionError,
  isMissingRelationError,
} from "./schema-presence";

describe("cv-engine schema presence detection", () => {
  it.each([
    ["PostgREST function cache miss", "PGRST202"],
    ["Postgres undefined_function", "42883"],
  ])("reads %s as an absent function", (_label, code) => {
    expect(isMissingFunctionError({ code })).toBe(true);
    expect(isMissingRelationError({ code })).toBe(false);
  });

  it.each([
    ["PostgREST relation cache miss", "PGRST205"],
    ["Postgres undefined_table", "42P01"],
  ])("reads %s as an absent relation", (_label, code) => {
    expect(isMissingRelationError({ code })).toBe(true);
    expect(isMissingFunctionError({ code })).toBe(false);
  });

  it.each([
    ["denied privilege", "42501"],
    ["unexposed schema", "PGRST106"],
    ["statement timeout", "57014"],
    ["connection failure", "08006"],
  ])("never reads %s as absence", (_label, code) => {
    expect(isMissingFunctionError({ code })).toBe(false);
    expect(isMissingRelationError({ code })).toBe(false);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a string", "PGRST202"],
    ["a number", 42883],
    ["an object without a code", { message: "boom" }],
    ["a non-string code", { code: 42883 }],
  ])("never reads %s as absence", (_label, value) => {
    expect(isMissingFunctionError(value)).toBe(false);
    expect(isMissingRelationError(value)).toBe(false);
  });

  it("survives an error object whose code getter throws", () => {
    const hostile = Object.defineProperty({}, "code", {
      get() {
        throw new Error("hostile getter");
      },
    });

    expect(isMissingFunctionError(hostile)).toBe(false);
    expect(isMissingRelationError(hostile)).toBe(false);
  });
});
