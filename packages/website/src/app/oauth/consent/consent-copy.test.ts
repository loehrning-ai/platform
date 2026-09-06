import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locale";
import {
  CONSENT_COPY,
  CONSENT_ERROR_KINDS,
  isConsentErrorKind,
  isKnownOAuthScope,
  KNOWN_OAUTH_SCOPES,
  scopeLine,
  type ConsentPageCopy,
} from "./consent-copy";

function strings(copy: ConsentPageCopy): string[] {
  return [
    copy.metadata.title,
    copy.metadata.description,
    copy.eyebrow,
    copy.title,
    copy.introduction("Beispiel-App"),
    copy.signedInAs("lernende@example.com"),
    copy.requestHeading,
    copy.clientNameLabel,
    copy.clientNameUnknown,
    copy.clientIdLabel,
    copy.clientSiteLabel,
    copy.clientSiteUnknown,
    copy.redirectHostLabel,
    copy.redirectHostUnknown,
    copy.redirectHostNote,
    copy.scopesHeading,
    ...Object.values(copy.scopeLines),
    copy.unknownScope("mcp:read"),
    copy.noScopes,
    copy.platformAccess,
    copy.tokenPower,
    copy.approve,
    copy.deny,
    copy.denyNote,
    copy.errorEyebrow,
    copy.errorHeading,
    ...Object.values(copy.errorBodies),
    copy.errorNextStep,
    copy.accountLink,
  ];
}

describe("consent copy", () => {
  it.each(SUPPORTED_LOCALES)("covers every string in %s", (locale) => {
    for (const value of strings(CONSENT_COPY[locale])) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  it.each(SUPPORTED_LOCALES)("uses no em dash or en dash in %s", (locale) => {
    for (const value of strings(CONSENT_COPY[locale])) {
      expect(value).not.toMatch(/[–—]/);
    }
  });

  it("addresses German learners with Du and keeps real umlauts", () => {
    const german = strings(CONSENT_COPY.de).join(" ");
    expect(german).toMatch(/\bdu\b|\bdein/i);
    expect(german).not.toMatch(/\bSie\b|\bIhre[nmrs]?\b/);
    // Transliterations, not a blanket bigram ban: the brand name is spelled
    // "loehrning" on purpose and must not be read as a missing umlaut.
    expect(german).not.toMatch(
      /\b(?:fuer|ueber|moechte|koennen|muessen|loeschen|zurueck|waehle|naechste[nrs]?|grosse[nrs]?)\b/i,
    );
    expect(german).toMatch(/[äöüß]/);
  });

  it("gives every scope the server issues a sentence, never a bare token", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const copy = CONSENT_COPY[locale];
      for (const scope of KNOWN_OAUTH_SCOPES) {
        const line = scopeLine(scope, copy);
        expect(line.split(" ").length).toBeGreaterThan(4);
        expect(line).not.toBe(scope);
        expect(line.trimEnd().endsWith(".")).toBe(true);
      }
    }
  });

  it("explains an undocumented scope instead of showing only its name", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const line = scopeLine("mcp:write", CONSENT_COPY[locale]);
      expect(line).toContain("mcp:write");
      expect(line.split(" ").length).toBeGreaterThan(4);
    }
  });

  it("states the read-only platform boundary in both locales", () => {
    expect(CONSENT_COPY.de.platformAccess).toMatch(/Schreiben oder löschen/);
    expect(CONSENT_COPY.en.platformAccess).toMatch(/never write or delete/);
  });

  it("has a body for every error the consent flow can end with", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const kind of CONSENT_ERROR_KINDS) {
        expect(CONSENT_COPY[locale].errorBodies[kind].length).toBeGreaterThan(20);
      }
    }
  });
});

describe("consent copy guards", () => {
  it("recognizes exactly the scopes the authorization server supports", () => {
    expect([...KNOWN_OAUTH_SCOPES]).toEqual([
      "openid",
      "email",
      "profile",
      "phone",
    ]);
    expect(isKnownOAuthScope("email")).toBe(true);
    expect(isKnownOAuthScope("mcp:read")).toBe(false);
  });

  it("accepts only the error kinds the page can render", () => {
    for (const kind of CONSENT_ERROR_KINDS) {
      expect(isConsentErrorKind(kind)).toBe(true);
    }
    expect(isConsentErrorKind("constructor")).toBe(false);
    expect(isConsentErrorKind(["missing-request"])).toBe(false);
    expect(isConsentErrorKind(undefined)).toBe(false);
  });
});
