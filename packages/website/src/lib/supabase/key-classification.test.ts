import { describe, expect, it } from "vitest";

import {
  classifySupabaseKey,
  isSafePublicSupabaseKey,
  isServiceSupabaseKey,
  SUPABASE_KEY_KIND,
} from "./key-classification.mjs";

const PUBLISHABLE_KEY =
  "sb_publishable_abcdefghijklmnopqrstuv_12345678";
const PRIVILEGED_FIXTURE = [
  "sb",
  "secret",
  "abcdefghijklmnopqrstuv",
  "12345678",
].join("_");

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function legacyJwt(
  role: string,
  overrides: {
    readonly header?: Record<string, unknown>;
    readonly signature?: string;
  } = {},
): string {
  const header = overrides.header ?? { alg: "HS256", typ: "JWT" };
  const signature =
    overrides.signature ??
    Buffer.alloc(32, 0xa5).toString("base64url");
  return `${base64UrlJson(header)}.${base64UrlJson({ role })}.${signature}`;
}

describe("Supabase key classification", () => {
  it("accepts only the documented bounded modern key shapes", () => {
    expect(classifySupabaseKey(PUBLISHABLE_KEY)).toBe(
      SUPABASE_KEY_KIND.PUBLISHABLE,
    );
    expect(classifySupabaseKey(PRIVILEGED_FIXTURE)).toBe(
      SUPABASE_KEY_KIND.SECRET,
    );

    for (const malformed of [
      "sb_publishable_fake",
      "sb_publishable_abcdefghijklmnopqrstu_12345678",
      "sb_publishable_abcdefghijklmnopqrstuvw_12345678",
      "sb_publishable_abcdefghijklmnopqrstuv_1234567",
      "sb_publishable_abcdefghijklmnopqrstuv_123456789",
      "sb_publishable_abcdefghijklmnopqrstuv!12345678",
      "sb_secret_fake",
      "opaque-browser-key",
    ]) {
      expect(classifySupabaseKey(malformed), malformed).toBe(
        SUPABASE_KEY_KIND.INVALID,
      );
    }
  });

  it("classifies only canonical HS256 legacy API-key JWT roles", () => {
    expect(classifySupabaseKey(legacyJwt("anon"))).toBe(
      SUPABASE_KEY_KIND.LEGACY_ANON,
    );
    expect(classifySupabaseKey(legacyJwt("service_role"))).toBe(
      SUPABASE_KEY_KIND.LEGACY_SERVICE_ROLE,
    );

    for (const malformed of [
      legacyJwt("authenticated"),
      legacyJwt("anon", { header: { alg: "none", typ: "JWT" } }),
      legacyJwt("anon", { header: { alg: "HS256", typ: "jwt" } }),
      legacyJwt("anon", { signature: "fixture-signature" }),
      `${base64UrlJson({ alg: "HS256", typ: "JWT" })}=.${base64UrlJson({ role: "anon" })}.${Buffer.alloc(32).toString("base64url")}`,
      "header.payload.signature",
      "opaque",
    ]) {
      expect(classifySupabaseKey(malformed), malformed).toBe(
        SUPABASE_KEY_KIND.INVALID,
      );
    }
  });

  it("rejects surrounding whitespace before any prefix or role check", () => {
    for (const key of [
      ` ${PUBLISHABLE_KEY}`,
      `${PUBLISHABLE_KEY}\n`,
      `\t${PRIVILEGED_FIXTURE}`,
      `${legacyJwt("anon")} `,
    ]) {
      expect(classifySupabaseKey(key)).toBe(SUPABASE_KEY_KIND.INVALID);
    }
  });

  it("keeps public and privileged classes disjoint", () => {
    expect(isSafePublicSupabaseKey(PUBLISHABLE_KEY)).toBe(true);
    expect(isSafePublicSupabaseKey(legacyJwt("anon"))).toBe(true);
    expect(isSafePublicSupabaseKey(PRIVILEGED_FIXTURE)).toBe(false);
    expect(isSafePublicSupabaseKey(legacyJwt("service_role"))).toBe(false);

    expect(isServiceSupabaseKey(PRIVILEGED_FIXTURE)).toBe(true);
    expect(isServiceSupabaseKey(legacyJwt("service_role"))).toBe(true);
    expect(isServiceSupabaseKey(PUBLISHABLE_KEY)).toBe(false);
    expect(isServiceSupabaseKey(legacyJwt("anon"))).toBe(false);
  });
});
