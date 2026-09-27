import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  GENERATED_MARKER,
  expectedFiles,
  syncEnglishMirror,
} from "../generate-english-route-mirror.mjs";

function fixture(t, files) {
  const root = mkdtempSync(path.join(os.tmpdir(), "loehrning-en-mirror-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const appRoot = path.join(root, "src", "app");
  for (const [relativePath, content] of Object.entries(files)) {
    const absolute = path.join(appRoot, relativePath);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, "utf8");
  }
  return appRoot;
}

const OG_MODULE = `export const alt = "x";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";
export default function Image() { return null; }
`;

test("mirrors a route file as a re-export of the German module", (t) => {
  const appRoot = fixture(t, {
    "blog/post/page.tsx":
      "export async function generateMetadata() { return {}; }\nexport default function Page() { return null; }\n",
    "blog/post/opengraph-image.tsx": OG_MODULE,
  });
  const expected = expectedFiles(appRoot);
  assert.equal(
    expected.get(path.join(appRoot, "en", "blog", "post", "page.tsx")),
    `${GENERATED_MARKER}export { default, generateMetadata } from "../../../blog/post/page";\n`,
  );
  assert.equal(
    expected.get(path.join(appRoot, "en", "blog", "post", "opengraph-image.tsx")),
    `${GENERATED_MARKER}export { default, alt, contentType, size } from "../../../blog/post/opengraph-image";\nexport const runtime = "nodejs";\n`,
  );
});

test("re-exports an English sibling (name.en.tsx) when one sits beside the German file", (t) => {
  const appRoot = fixture(t, {
    "blog/post/opengraph-image.tsx": OG_MODULE,
    "blog/post/opengraph-image.en.tsx": OG_MODULE.replace('"nodejs"', '"edge"'),
  });
  const expected = expectedFiles(appRoot);
  assert.equal(expected.size, 1, "the sibling is not mirrored as a route of its own");
  assert.equal(
    expected.get(path.join(appRoot, "en", "blog", "post", "opengraph-image.tsx")),
    `${GENERATED_MARKER}export { default, alt, contentType, size } from "../../../blog/post/opengraph-image.en";\nexport const runtime = "edge";\n`,
  );
});

test("rejects an English sibling without a German route file beside it", (t) => {
  const appRoot = fixture(t, {
    "blog/post/opengraph-image.en.tsx": OG_MODULE,
  });
  assert.throws(() => expectedFiles(appRoot), /no German route file beside it/);
});

test("rejects an English sibling of a file the mirror does not own", (t) => {
  const appRoot = fixture(t, {
    "blog/post/post-copy.tsx": OG_MODULE,
    "blog/post/post-copy.en.tsx": OG_MODULE,
  });
  assert.throws(() => expectedFiles(appRoot), /no mirrored route file name/);
});

test("rejects an English sibling without a default export", (t) => {
  const appRoot = fixture(t, {
    "blog/post/opengraph-image.tsx": OG_MODULE,
    "blog/post/opengraph-image.en.tsx": 'export const alt = "x";\n',
  });
  assert.throws(() => expectedFiles(appRoot), /no default export: blog\/post\/opengraph-image\.en\.tsx/);
});

test("generate writes the mirror and check then passes", (t) => {
  const appRoot = fixture(t, {
    "blog/post/opengraph-image.tsx": OG_MODULE,
    "blog/post/opengraph-image.en.tsx": OG_MODULE,
  });
  assert.throws(() => syncEnglishMirror({ appRoot, check: true }), /is stale|opengraph-image/);
  assert.equal(syncEnglishMirror({ appRoot }), 1);
  assert.equal(syncEnglishMirror({ appRoot, check: true }), 1);
  assert.match(
    readFileSync(path.join(appRoot, "en", "blog", "post", "opengraph-image.tsx"), "utf8"),
    /opengraph-image\.en"/,
  );
});

test("check fails on a hand-written file under src/app/en", (t) => {
  const appRoot = fixture(t, {
    "blog/post/opengraph-image.tsx": OG_MODULE,
    "en/blog/post/extra.tsx": "export default function X() { return null; }\n",
  });
  for (const check of [false, true]) {
    assert.throws(
      () => syncEnglishMirror({ appRoot, check }),
      /extra\.tsx is not generator-owned/,
    );
  }
});

test("check fails on a stale generated file and generate removes it", (t) => {
  const appRoot = fixture(t, {
    "blog/post/opengraph-image.tsx": OG_MODULE,
    "en/blog/gone/page.tsx": `${GENERATED_MARKER}export { default } from "../../../blog/gone/page";\n`,
  });
  assert.throws(() => syncEnglishMirror({ appRoot, check: true }), /gone\/page\.tsx is stale/);
  syncEnglishMirror({ appRoot });
  assert.equal(syncEnglishMirror({ appRoot, check: true }), 1);
});
