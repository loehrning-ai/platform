import { describe, it, expect } from "vitest";
import { certificateFormSchema } from "./validation";

// certificateFormSchema is a Zod object with a single `name` field that is
// trimmed, then required to be 2-100 chars. These tests assert the schema's
// real parse behavior (transformed output + the exact German error messages).

describe("certificateFormSchema", () => {
  it("accepts a valid name and returns the parsed object", () => {
    const result = certificateFormSchema.safeParse({ name: "Anna Loehr" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Anna Loehr");
    }
  });

  it("trims surrounding whitespace before validating", () => {
    const result = certificateFormSchema.safeParse({ name: "  Tim Löhr  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Tim Löhr");
    }
  });

  it("accepts a name of exactly the 2-char minimum", () => {
    const result = certificateFormSchema.safeParse({ name: "Ed" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ed");
    }
  });

  it("rejects a name that trims down to fewer than 2 chars (trim runs before min)", () => {
    const result = certificateFormSchema.safeParse({ name: "  a  " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Bitte geben Sie Ihren vollständigen Namen ein.",
      );
    }
  });

  it("rejects an empty string with the min-length message", () => {
    const result = certificateFormSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Bitte geben Sie Ihren vollständigen Namen ein.",
      );
    }
  });

  it("rejects a name longer than 100 chars with the max-length message", () => {
    const result = certificateFormSchema.safeParse({ name: "x".repeat(101) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Name darf maximal 100 Zeichen lang sein.",
      );
    }
  });

  it("accepts a name of exactly the 100-char maximum", () => {
    const result = certificateFormSchema.safeParse({ name: "y".repeat(100) });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name field as an invalid type", () => {
    const result = certificateFormSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.code).toBe("invalid_type");
    }
  });

  it("rejects a non-string name as an invalid type", () => {
    const result = certificateFormSchema.safeParse({ name: 42 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.code).toBe("invalid_type");
    }
  });
});
