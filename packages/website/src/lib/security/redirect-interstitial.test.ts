import { describe, expect, it } from "vitest";
import {
  attributeNames,
  parseDeclarativeRefresh,
  readInterstitialHtml,
} from "@/test/redirect-interstitial";
import {
  continuationUrl,
  escapeHtml,
  REDIRECT_INTERSTITIAL_HEADERS,
  redirectInterstitialResponse,
  renderRedirectInterstitial,
} from "./redirect-interstitial";

const CODE = "fixture-authorization-code";
const CLIENT_REDIRECT = `https://client.example/callback?code=${CODE}&state=xyz`;
const HANDOFF = "https://cv.loehrning.ai/auth/handoff#token_hash=abc123&type=magiclink";

function render(destination: string, locale: "de" | "en" = "de") {
  const url = continuationUrl(destination);
  if (!url) throw new Error(`fixture destination rejected: ${destination}`);
  return renderRedirectInterstitial(url, locale);
}

describe("redirect interstitial destination", () => {
  it.each([
    ["an https redirect with a code", CLIENT_REDIRECT],
    ["a loopback redirect of a desktop client", "http://127.0.0.1:33418/callback?code=x"],
    ["a localhost redirect", "http://localhost:6274/oauth/callback?code=x&state=y"],
    ["a fragment-carried handoff token", HANDOFF],
  ])("accepts %s unchanged", (_label, destination) => {
    expect(continuationUrl(destination)?.href).toBe(destination);
  });

  it.each([
    ["javascript:", "javascript:alert(document.cookie)"],
    ["an upper-case javascript:", "JAVASCRIPT:alert(1)"],
    ["data:", "data:text/html,<script>alert(1)</script>"],
    ["vbscript:", "vbscript:msgbox(1)"],
    ["ftp:", "ftp://files.example/"],
    ["a relative path", "/konto"],
    ["a protocol-relative URL", "//attacker.example/callback"],
    ["embedded credentials", "https://user:secret@client.example/callback"],
    ["a username only", "https://user@client.example/callback"],
    ["an empty string", ""],
    ["an over-long URL", `https://client.example/${"a".repeat(2_048)}`],
  ])("refuses %s", (_label, destination) => {
    expect(continuationUrl(destination)).toBeNull();
    expect(() => redirectInterstitialResponse(destination, "de")).toThrow(
      TypeError,
    );
  });

  it.each([undefined, null, 42, {}, new URL(CLIENT_REDIRECT)])(
    "refuses a non-string value %#",
    (value) => {
      expect(continuationUrl(value)).toBeNull();
    },
  );
});

describe("redirect interstitial document", () => {
  it("navigates at once to exactly the destination, by refresh and by link", () => {
    const page = readInterstitialHtml(render(CLIENT_REDIRECT));

    expect(page.refreshes).toEqual([{ delay: 0, url: CLIENT_REDIRECT }]);
    expect(page.linkHrefs).toEqual([CLIENT_REDIRECT]);
  });

  it("keeps a fragment-carried token in the fragment of both navigations", () => {
    const page = readInterstitialHtml(render(HANDOFF));

    for (const target of [page.refreshes[0]?.url, page.linkHrefs[0]]) {
      const parsed = new URL(target ?? "");
      expect(parsed.origin).toBe("https://cv.loehrning.ai");
      expect(parsed.search).toBe("");
      expect(parsed.hash).toBe("#token_hash=abc123&type=magiclink");
    }
  });

  it("shows only the destination host, never the code or the token", () => {
    for (const destination of [CLIENT_REDIRECT, HANDOFF]) {
      const page = readInterstitialHtml(render(destination));
      const host = new URL(destination).host;

      expect(page.title).toBe(`Weiter zu ${host}`);
      expect(page.visibleText).toContain(host);
      expect(page.visibleText).not.toContain(CODE);
      expect(page.visibleText).not.toContain("abc123");
      expect(page.title).not.toContain("?");
      expect(page.title).not.toContain("#");
    }
  });

  it("shows a punycode host rather than a lookalike Unicode one", () => {
    const page = readInterstitialHtml(render("https://bücher.example/callback"));

    expect(page.title).toBe("Weiter zu xn--bcher-kva.example");
    expect(page.visibleText).not.toContain("bücher");
  });

  it("renders the English copy for an English submission", () => {
    const page = readInterstitialHtml(render(CLIENT_REDIRECT, "en"));

    expect(page.lang).toBe("en");
    expect(page.title).toBe("Continue to client.example");
    expect(page.visibleText).toContain("Continue to client.example");
  });

  it("renders the German copy by default locale", () => {
    const page = readInterstitialHtml(render(CLIENT_REDIRECT, "de"));

    expect(page.lang).toBe("de");
    expect(page.visibleText).toContain("Du wirst weitergeleitet.");
  });

  it("contains no script, no inline handler, no style, no form and no embed", () => {
    const page = readInterstitialHtml(render(CLIENT_REDIRECT));

    expect(
      page.document.querySelectorAll(
        "script, style, form, iframe, object, embed, img, base, link",
      ),
    ).toHaveLength(0);
    const names = attributeNames(page.document);
    expect(names.filter((name) => name.startsWith("on"))).toEqual([]);
    expect(names).not.toContain("style");
    expect(names).not.toContain("srcdoc");
  });

  it("carries exactly one refresh and tells the browser to send no referrer", () => {
    const page = readInterstitialHtml(render(CLIENT_REDIRECT));
    const metas = Array.from(page.document.querySelectorAll("meta"));

    expect(
      metas.filter((meta) => meta.getAttribute("http-equiv") !== null),
    ).toHaveLength(1);
    expect(
      page.document.querySelector('meta[name="referrer"]')?.getAttribute("content"),
    ).toBe("no-referrer");
    expect(
      page.document.querySelector('meta[name="robots"]')?.getAttribute("content"),
    ).toBe("noindex, nofollow, noarchive");
    expect(
      page.document.querySelector("a[href]")?.getAttribute("rel"),
    ).toBe("noreferrer");
  });

  it("keeps quote, ampersand and angle characters inside one inert attribute", () => {
    // The WHATWG serializer leaves ' and & literal in a path, query and
    // fragment, and a crafted redirect_uri may try to close the attribute.
    const hostile =
      "https://client.example/cb/it's?code=a&state=b'\"><script>alert(1)</script>#x'&y=\"<b>";
    const url = continuationUrl(hostile);
    expect(url).not.toBeNull();
    const html = render(hostile);
    const page = readInterstitialHtml(html);

    expect(page.refreshes).toEqual([{ delay: 0, url: url?.href }]);
    expect(page.linkHrefs).toEqual([url?.href]);
    expect(page.document.querySelectorAll("script, b")).toHaveLength(0);
    expect(html).not.toMatch(/<script/i);
    // The raw markup never carries an unescaped quote inside the URL.
    expect(html).not.toContain("it's");
    expect(html).toContain("it&#39;s");
  });

  it("cannot be steered into a second refresh target by whitespace or a semicolon", () => {
    const tricky = "https://client.example/cb?code=a b;url=https://attacker.example/\n";
    const url = continuationUrl(tricky);
    const page = readInterstitialHtml(render(tricky));

    expect(url?.href).toBe(
      "https://client.example/cb?code=a%20b;url=https://attacker.example/",
    );
    expect(page.refreshes).toEqual([{ delay: 0, url: url?.href }]);
    expect(new URL(page.refreshes[0]?.url ?? "").host).toBe("client.example");
  });
});

describe("redirect interstitial response", () => {
  it("answers 200 with private, uncacheable, unindexed, referrer-free HTML", async () => {
    const response = redirectInterstitialResponse(CLIENT_REDIRECT, "de");

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(Object.fromEntries(response.headers)).toEqual({
      "cache-control": "private, no-store",
      "content-type": "text/html; charset=utf-8",
      "referrer-policy": "no-referrer",
      "x-robots-tag": "noindex, nofollow, noarchive",
    });
    expect(await response.text()).toBe(render(CLIENT_REDIRECT));
  });

  it("gives every response its own mutable header set", () => {
    const first = redirectInterstitialResponse(CLIENT_REDIRECT, "de");
    first.headers.set("X-Test", "1");
    const second = redirectInterstitialResponse(CLIENT_REDIRECT, "de");

    expect(second.headers.get("x-test")).toBeNull();
    expect(REDIRECT_INTERSTITIAL_HEADERS).not.toHaveProperty("X-Test");
    expect(Object.isFrozen(REDIRECT_INTERSTITIAL_HEADERS)).toBe(true);
  });
});

describe("escapeHtml", () => {
  it("replaces every character that can end an attribute or open markup", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
    expect(escapeHtml("plain text")).toBe("plain text");
  });
});

describe("declarative refresh parser used by these tests", () => {
  it.each([
    ["0;url=https://a.example/", { delay: 0, url: "https://a.example/" }],
    ["0; URL = 'https://a.example/x'y", { delay: 0, url: "https://a.example/x" }],
    ["5", { delay: 5, url: null }],
    ["0,https://a.example/", { delay: 0, url: "https://a.example/" }],
    ["0;urx=https://a.example/", { delay: 0, url: "urx=https://a.example/" }],
  ])("parses %j like a browser", (input, expected) => {
    expect(parseDeclarativeRefresh(input)).toEqual(expected);
  });

  it("returns null where a browser would not refresh", () => {
    expect(parseDeclarativeRefresh("soon")).toBeNull();
    expect(parseDeclarativeRefresh("0x;url=https://a.example/")).toBeNull();
  });
});
