/**
 * Cross-origin continuation after a same-origin form POST, in a real browser.
 *
 * Two platform forms POST to our own origin and must then send the browser to
 * another one: the OAuth consent decision (to the client's redirect_uri, with
 * the authorization code) and the cv-engine "open" button (to the hosted
 * tool's handoff bridge, with a one-time token in the fragment). The enforced
 * policy carries `form-action 'self'`, which Chromium also applies to every
 * redirect the form submission follows, so answering those POSTs with a 303
 * strands the learner on our origin. Both routes answer with the shared
 * interstitial from src/lib/security/redirect-interstitial.ts instead; the
 * route unit tests prove each route returns it for every cross-origin answer.
 *
 * This spec proves the browser half, independent of the app server: a local
 * "platform" origin serves the same form shape under the exact policy
 * next.config.ts ships (built by the same function), answers the POST with
 * the real interstitial response, and a second loopback origin stands in for
 * the OAuth client and the hosted tool. It asserts the final URL, that the
 * code and the fragment arrive intact, that no Referer leaves, and that Back
 * does not return to the POST result.
 *
 * The control case keeps the reason on record: under the same policy a 303
 * from the same POST is refused. If it ever stops being refused, someone has
 * widened `form-action`, which is exactly the regression to catch.
 */
import { once } from "node:events";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test, type ConsoleMessage } from "@playwright/test";
import {
  buildContentSecurityPolicy,
  buildSecurityHeaders,
  createCspNonce,
  type SecurityHeaderEnvironment,
} from "../../security-headers";
import { redirectInterstitialResponse } from "../../src/lib/security/redirect-interstitial";

const CODE = "fixture-browser-authorization-code";
const TOKEN = "aaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666aaaa7777bbbb8888";

const FLOWS = ["consent", "handoff"] as const;
const ANSWERS = ["interstitial", "redirect"] as const;
const POLICIES = ["baseline", "nonce"] as const;

type Flow = (typeof FLOWS)[number];
type Answer = (typeof ANSWERS)[number];
type Policy = (typeof POLICIES)[number];

interface Scenario {
  readonly flow: Flow;
  readonly answer: Answer;
  readonly policy: Policy;
}

interface ClientRequest {
  readonly url: string;
  readonly referer: string | undefined;
}

let appOrigin = "";
let clientOrigin = "";
const clientRequests: ClientRequest[] = [];
const servers: http.Server[] = [];

function destinationFor(flow: Flow): string {
  return flow === "consent"
    ? `${clientOrigin}/callback?code=${CODE}&state=xyz`
    : `${clientOrigin}/auth/handoff#token_hash=${TOKEN}&type=magiclink`;
}

/**
 * The site-wide header set next.config.ts ships, built by the same function.
 * The only environment difference from production is the exact loopback
 * verification origin, which drops `upgrade-insecure-requests` so plain-HTTP
 * loopback can be exercised at all. `nonce` swaps in the enforced nonce
 * policy F4 will switch to, to prove the interstitial survives that flip.
 */
function siteHeaders(policy: Policy): Record<string, string> {
  const environment: SecurityHeaderEnvironment = {
    NODE_ENV: "production",
    LOEHRNING_LOCAL_VERIFICATION_ORIGIN: appOrigin,
  };
  const headers = Object.fromEntries(
    buildSecurityHeaders(environment, null).map(({ key, value }) => [key, value]),
  );
  if (policy === "nonce") {
    const nonce = createCspNonce();
    if (!nonce) throw new Error("no random source for a CSP nonce");
    headers["Content-Security-Policy"] = buildContentSecurityPolicy(
      environment,
      null,
      nonce,
      "enforce",
    );
  }
  return headers;
}

/**
 * The member of `allowed` equal to `value`, or null. What comes back is always
 * one of the fixture's own constants, never the request's string.
 */
function pick<T extends string>(
  allowed: readonly T[],
  value: string | null,
): T | null {
  return allowed.find((candidate) => candidate === value) ?? null;
}

/**
 * The scenario a fixture request names, rebuilt from the fixture's own
 * constants. Nothing from the request URL is ever written into a page, so the
 * form page cannot reflect a caller's input even though it only ever serves
 * this spec on loopback.
 */
function scenarioFrom(url: URL): Scenario | null {
  const flow = pick(FLOWS, url.searchParams.get("flow"));
  const answer = pick(ANSWERS, url.searchParams.get("answer"));
  const policy = pick(POLICIES, url.searchParams.get("policy"));
  return flow && answer && policy ? { flow, answer, policy } : null;
}

function scenarioQuery({ flow, answer, policy }: Scenario): string {
  return new URLSearchParams({ flow, answer, policy }).toString();
}

function formPage(scenario: Scenario): string {
  // The same shape the real forms have: a same-origin POST, no script. The
  // consent form carries its fields; the cv-engine form has none.
  const fields =
    scenario.flow === "consent"
      ? '<input type="hidden" name="authorization_id" value="1f4d2a4e-5b6c-4d7e-8f90-a1b2c3d4e5f6"><input type="hidden" name="sprache" value="de"><button type="submit" name="entscheidung" value="zustimmen">Zustimmen</button>'
      : '<button type="submit">Öffnen</button>';
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Formular</title></head><body><form method="post" action="/submit?${scenarioQuery(scenario)}">${fields}</form></body></html>`;
}

async function listen(server: http.Server, host: string): Promise<string> {
  servers.push(server);
  server.listen(0, host);
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;
  return `http://${host}:${port}`;
}

test.beforeAll(async () => {
  clientOrigin = await listen(
    http.createServer((request, response) => {
      clientRequests.push({
        url: request.url ?? "",
        referer: request.headers.referer,
      });
      response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("client reached");
    }),
    "127.0.0.1",
  );

  appOrigin = await listen(
    http.createServer(async (request, response) => {
      const url = new URL(request.url ?? "/", appOrigin);
      const scenario = scenarioFrom(url);
      const headers = siteHeaders(scenario?.policy ?? "baseline");
      const routed =
        (request.method === "GET" && url.pathname === "/form") ||
        (request.method === "POST" && url.pathname === "/submit");

      if (routed && scenario === null) {
        // Every request this spec makes names a known scenario. Anything else
        // is a fixture bug, answered without echoing what was sent.
        request.resume();
        response.writeHead(400, { ...headers, "Cache-Control": "private, no-store" });
        response.end();
        return;
      }

      if (scenario && request.method === "GET" && url.pathname === "/form") {
        response.writeHead(200, {
          ...headers,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "private, no-store",
        });
        response.end(formPage(scenario));
        return;
      }

      if (scenario && request.method === "POST" && url.pathname === "/submit") {
        request.resume();
        await once(request, "end");
        const destination = destinationFor(scenario.flow);
        if (scenario.answer === "redirect") {
          response.writeHead(303, {
            ...headers,
            Location: destination,
            "Cache-Control": "private, no-store",
          });
          response.end();
          return;
        }
        const interstitial = redirectInterstitialResponse(destination, "de");
        response.writeHead(interstitial.status, {
          ...headers,
          ...Object.fromEntries(interstitial.headers),
        });
        response.end(await interstitial.text());
        return;
      }

      response.writeHead(404, headers);
      response.end();
    }),
    "localhost",
  );
});

test.afterAll(async () => {
  await Promise.all(
    servers.map(
      (server) =>
        new Promise<void>((resolve) => {
          server.closeAllConnections();
          server.close(() => resolve());
        }),
    ),
  );
});

test.beforeEach(() => {
  clientRequests.length = 0;
});

function formUrl(flow: Flow, answer: Answer, policy: Policy): string {
  return `${appOrigin}/form?${scenarioQuery({ flow, answer, policy })}`;
}

function cspMessages(messages: readonly ConsoleMessage[]): string[] {
  return messages
    .map((message) => message.text())
    .filter((text) => /Content Security Policy|form-action/i.test(text));
}

test.describe("cross-origin continuation after a form POST", () => {
  // One test per flow keeps the shared WebKit shard inventory small; each
  // policy variant is its own step on a fresh navigation.
  for (const flow of ["consent", "handoff"] as const) {
    test(`${flow}: the interstitial reaches the other origin under the shipped and the nonce policy`, async ({
      page,
      browserName,
    }) => {
      const messages: ConsoleMessage[] = [];
      page.on("console", (message) => messages.push(message));
      const destination = destinationFor(flow);

      for (const policy of ["baseline", "nonce"] as const) {
        await test.step(`${policy} policy`, async () => {
          clientRequests.length = 0;
          messages.length = 0;
          const start = formUrl(flow, "interstitial", policy);

          await page.goto(start);
          await Promise.all([
            page.waitForURL(destination),
            page.getByRole("button").click(),
          ]);

          expect(page.url()).toBe(destination);
          await expect(page.locator("body")).toHaveText("client reached");
          // Exactly one request reached the other origin. The code arrives in
          // the query; the handoff token stays in the fragment and never
          // leaves the browser. No Referer names the platform page.
          expect(clientRequests).toEqual([
            {
              url:
                flow === "consent"
                  ? `/callback?code=${CODE}&state=xyz`
                  : "/auth/handoff",
              referer: undefined,
            },
          ]);
          expect(cspMessages(messages)).toEqual([]);

          // The zero-delay refresh replaced the POST result in history, so
          // Back lands on the form page instead of offering to resubmit it.
          // Verified for Chromium, the engine this regression is about.
          if (browserName === "chromium") {
            await page.goBack();
            await expect(page).toHaveURL(start);
            expect(clientRequests).toHaveLength(1);
          }
        });
      }
    });
  }

  test("control: the same POST answered with a cross-origin 303 is refused", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "The form-action redirect refusal this guards is Chromium behavior.",
    );
    const violation = page.waitForEvent("console", {
      predicate: (message) => /form-action/.test(message.text()),
    });

    await page.goto(formUrl("consent", "redirect", "baseline"));
    await page.getByRole("button").click();
    await violation;

    // Nothing reached the client, and the browser never left our origin.
    expect(clientRequests).toEqual([]);
    expect(new URL(page.url()).origin).toBe(appOrigin);
  });

  test("fixture: the form page is built from the spec's own constants, never from the request", async ({
    request,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "A fixture check needs no second engine.",
    );
    const probe = '"><b id="probe">reflected</b>';

    // A known scenario with an extra parameter: the page names the scenario
    // and nothing else from the query.
    const known = await request.get(
      `${formUrl("consent", "interstitial", "baseline")}&extra=${encodeURIComponent(probe)}`,
    );
    expect(known.status()).toBe(200);
    const html = await known.text();
    expect(html).toContain(
      'action="/submit?flow=consent&answer=interstitial&policy=baseline"',
    );
    expect(html).not.toContain("extra");
    expect(html).not.toContain("probe");

    // An unknown scenario is refused with an empty body, on both routes.
    for (const [method, path] of [
      ["GET", "/form"],
      ["POST", "/submit"],
    ] as const) {
      const unknown = await request.fetch(
        `${appOrigin}${path}?flow=${encodeURIComponent(probe)}&answer=interstitial&policy=baseline`,
        { method },
      );
      expect(unknown.status(), `${method} ${path}`).toBe(400);
      expect(await unknown.text()).toBe("");
    }
    expect(clientRequests).toEqual([]);
  });
});
