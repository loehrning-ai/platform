import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { inspectZipArchive } from "../zip-inspection.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(here, "../../../../..");
const kitPath = join(
  repositoryRoot,
  "packages/website/public/workshops/geschaeftsberichte-mit-ki-lesen/norda-analyst-kit.zip",
);
const dashboardPath = "norda-analyst-kit/dashboard/index.html";

async function readDashboard() {
  const archive = await readFile(kitPath);
  const entries = inspectZipArchive(archive, {
    label: "norda-analyst-kit.zip",
  });
  const dashboard = entries.find((entry) => entry.path === dashboardPath);
  assert.ok(dashboard?.text, `${dashboardPath} must be inspectable UTF-8 text`);
  return dashboard.text;
}

function extractInlineScripts(html) {
  const dom = new JSDOM(html);
  try {
    return Array.from(dom.window.document.scripts)
      .filter((script) => !script.hasAttribute("src"))
      .map((script) => script.textContent ?? "")
      .filter((script) => script.trim().length > 0);
  } finally {
    dom.window.close();
  }
}

test("the dashboard contains no HTML execution sink for generated data", async () => {
  const html = await readDashboard();
  assert.doesNotMatch(
    html,
    /(?:inner|outer)HTML\s*=|insertAdjacentHTML|document\.write|eval\s*\(|new\s+Function/i,
  );
});

test("inline script extraction follows HTML parser end-tag semantics", () => {
  const scripts = extractInlineScripts(`<!doctype html>
    <script data-label="comparison > threshold">
      globalThis.firstRenderer = true;
    </script >
    <script src="/external-renderer.js">globalThis.external = true;</script>
    <script>globalThis.secondRenderer = true;</script>`);

  assert.deepEqual(
    scripts.map((script) => script.trim()),
    ["globalThis.firstRenderer = true;", "globalThis.secondRenderer = true;"],
  );
});

test("attacker-shaped generated metrics render only as text", async () => {
  const html = await readDashboard();
  const inlineScripts = extractInlineScripts(html);
  assert.equal(
    inlineScripts.length,
    1,
    "expected one inline dashboard renderer",
  );

  const payload =
    '</span><img src=x onerror="globalThis.__nordaXssExecuted=true">';
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="app"></div></body></html>',
    {
      runScripts: "outside-only",
      url: "https://local.invalid/dashboard/index.html",
    },
  );
  dom.window.NORDA_DATA = {
    month: payload,
    prior_month: payload,
    totals: { revenue_eur: 100, units: 1 },
    revenue_by_line: [
      {
        line: payload,
        revenue_eur: 100,
        units_mom_pct: 1,
      },
    ],
    quality_by_line: [{ line: payload, ncr_count: 1 }],
    marketing: {
      by_channel: [{ channel: payload, spend_eur: 1 }],
    },
    escalations: {
      open_p1_p2: [
        {
          severity: "P1",
          title: payload,
          owner_team: payload,
        },
      ],
    },
    craft_flag: {
      revenue_eur: 100,
      units: 1,
      ncr_count: 1,
      price_range_eur: [1, 2],
    },
    caveats: [payload],
  };

  dom.window.eval(inlineScripts[0]);

  const app = dom.window.document.getElementById("app");
  assert.ok(app);
  assert.ok(app.textContent?.includes(payload));
  assert.equal(app.querySelector("img,script,iframe,object,embed"), null);
  assert.equal(dom.window.__nordaXssExecuted, undefined);
  dom.window.close();
});
