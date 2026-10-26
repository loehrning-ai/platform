import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { deflateSync } from "node:zlib";
import {
  PDF_PUBLICATION_DIRECTORIES,
  inspectPdf,
  isPdfPublicationPath,
} from "../pdf-inspection.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(here, "../../../../..");
const LIVE_PDF_DIRECTORY = PDF_PUBLICATION_DIRECTORIES[0];

const INFO = "<</Producer (WeasyPrint 69.0)/Title (Lebenslauf Mira Kessler)>>";
const CATALOG = "<</Type /Catalog/Pages 2 0 R>>";
const LINK =
  "<</Type /Annot/Subtype /Link/Rect [0 0 1 1]/A <</Type /Action/S /URI/URI (https://example.com)>>>>";

/**
 * A small PDF in WeasyPrint's shape: the dictionaries sit in one compressed
 * object stream, the content stream is compressed too.
 */
function pdf({
  objects = [CATALOG, "<</Type /Pages/Kids []/Count 0>>", LINK, INFO],
  plain = "",
  filter = "/FlateDecode",
  length = null,
  tail = "",
} = {}) {
  const header = objects.map((_, index) => `${index + 1} 0`).join(" ");
  const body = `${header}\n${objects.join("\n")}`;
  const objStm = deflateSync(Buffer.from(body, "latin1"));
  const content = filter === "/FlateDecode" ? deflateSync(Buffer.from("BT ET")) : Buffer.from("BT ET");
  const info = objects.indexOf(INFO) + 1 || objects.length;
  const parts = [
    Buffer.from("%PDF-1.7\n", "latin1"),
    Buffer.from(
      `9 0 obj\n<</Filter ${filter}/Length ${length ?? content.length}>>\nstream\n`,
      "latin1",
    ),
    content,
    Buffer.from("\nendstream\nendobj\n", "latin1"),
    Buffer.from(
      `10 0 obj\n<</Type /ObjStm/N ${objects.length}/First ${header.length + 1}/Filter /FlateDecode/Length ${objStm.length}>>\nstream\n`,
      "latin1",
    ),
    objStm,
    Buffer.from(`\nendstream\nendobj\n${plain}`, "latin1"),
    Buffer.from(
      `11 0 obj\n<</Type /XRef/Size 12/Root 1 0 R/Info ${info} 0 R/Length 0>>\nstream\n\nendstream\nendobj\nstartxref\n0\n%%EOF${tail}`,
      "latin1",
    ),
  ];
  return Buffer.concat(parts);
}

test("every published CV Engine PDF passes", async () => {
  const directory = join(repositoryRoot, LIVE_PDF_DIRECTORY);
  const files = (await readdir(directory)).filter((name) => name.endsWith(".pdf"));
  assert.ok(files.length > 0, "the live example ships PDFs");
  for (const name of files) {
    const result = inspectPdf(await readFile(join(directory, name)), { label: name });
    assert.match(result.producer, /^WeasyPrint /);
    for (const uri of result.uris) assert.match(uri, /^(https:\/\/|mailto:)/);
  }
});

test("a clean WeasyPrint-shaped PDF passes", () => {
  assert.deepEqual(inspectPdf(pdf()).uris, ["https://example.com"]);
});

test("active content fails, also inside a compressed object stream", () => {
  const cases = {
    "/OpenAction": [CATALOG.replace(">>", "/OpenAction 3 0 R>>")],
    "/JavaScript": ["<</S /JavaScript/JS (app.alert(1))>>"],
    "/Launch": ["<</Type /Action/S /Launch/F (calc.exe)>>"],
    "/EmbeddedFiles": ["<</Names <</EmbeddedFiles 5 0 R>>>>"],
    "/AcroForm": [CATALOG.replace(">>", "/AcroForm 5 0 R>>")],
    "/Metadata": [CATALOG.replace(">>", "/Metadata 5 0 R>>")],
    "/AA": ["<</Type /Page/AA <</O 5 0 R>>>>"],
    "/Encrypt": ["<</Encrypt 5 0 R>>"],
  };
  for (const [name, extra] of Object.entries(cases)) {
    assert.throws(
      () => inspectPdf(pdf({ objects: [CATALOG, ...extra, INFO] })),
      new RegExp(name.replace("/", "\\/")),
      name,
    );
  }
});

test("active content outside the object stream fails too", () => {
  assert.throws(
    () => inspectPdf(pdf({ plain: "12 0 obj\n<</S /JavaScript/JS (x)>>\nendobj\n" })),
    /JavaScript/,
  );
});

test("a hex-escaped name cannot smuggle a forbidden key", () => {
  assert.throws(
    () => inspectPdf(pdf({ objects: [CATALOG, "<</S /J#61vaScript>>", INFO] })),
    /escaped name/,
  );
});

test("only https and mailto links pass", () => {
  for (const uri of ["http://example.com", "javascript:alert(1)", "file:///etc/passwd", ""]) {
    const link = LINK.replace("https://example.com", uri);
    assert.throws(() => inspectPdf(pdf({ objects: [CATALOG, link, INFO] })), /URI/, uri);
  }
  const mail = LINK.replace("https://example.com", "mailto:mira.kessler@example.com");
  assert.doesNotThrow(() => inspectPdf(pdf({ objects: [CATALOG, mail, INFO] })));
  assert.throws(
    () =>
      inspectPdf(
        pdf({ objects: [CATALOG, "<</A <</S /URI/URI <68747470733a2f2f>>>>>", INFO] }),
      ),
    /plain literal/,
  );
  // Balanced parentheses nest inside a literal string; the whole value counts.
  const nested = LINK.replace("https://example.com", "javascript:(https://example.com)");
  assert.throws(() => inspectPdf(pdf({ objects: [CATALOG, nested, INFO] })), /not allowed/);
});

test("a comment cannot open a string that hides a key", () => {
  assert.throws(
    () =>
      inspectPdf(
        pdf({ plain: "12 0 obj\n% (\n<</OpenAction 5 0 R>>\n% )\nendobj\n" }),
      ),
    /OpenAction/,
  );
  assert.throws(
    () => inspectPdf(pdf({ objects: [CATALOG, "<</Title (open (never closed)>>", INFO] })),
    /unterminated/,
  );
});

test("a transparency group is not an action; a GoTo or Named action is", () => {
  const group = "<</Type /Page/Group <</S /Transparency/CS /DeviceRGB>>>>";
  assert.doesNotThrow(() => inspectPdf(pdf({ objects: [CATALOG, group, INFO] })));
  for (const action of ["GoTo", "Named", "SubmitForm"]) {
    assert.throws(
      () => inspectPdf(pdf({ objects: [CATALOG, `<</A <</S /${action}>>>>`, INFO] })),
      /not allowed/,
      action,
    );
  }
});

test("names inside a string are data, not keys", () => {
  const info = "<</Producer (WeasyPrint 69.0)/Title (About /JavaScript and /Launch)>>";
  assert.doesNotThrow(() => inspectPdf(pdf({ objects: [CATALOG, info] })));
});

test("the information dictionary holds a producer and a title only", () => {
  const author = "<</Producer (WeasyPrint 69.0)/Title (CV)/Author (Someone)>>";
  assert.throws(() => inspectPdf(pdf({ objects: [CATALOG, author] })), /\/Author/);
  const other = "<</Producer (Other 1.0)/Title (CV)>>";
  assert.throws(() => inspectPdf(pdf({ objects: [CATALOG, other] })), /WeasyPrint/);
});

test("one revision, known filters and direct lengths only", () => {
  assert.throws(() => inspectPdf(pdf({ tail: "\n%%EOF" })), /revision/);
  assert.throws(() => inspectPdf(pdf({ filter: "/ASCIIHexDecode" })), /filter/);
  assert.throws(() => inspectPdf(pdf({ length: "7 0 R" })), /direct integer/);
  assert.throws(() => inspectPdf(pdf({ length: 2 })), /endstream/);
  assert.throws(() => inspectPdf(Buffer.from("%!PS-Adobe-3.0\n")), /header/);
});

test("only file names directly in a reviewed directory are eligible", () => {
  assert.equal(isPdfPublicationPath(`${LIVE_PDF_DIRECTORY}mira-kessler-de-classic-normal-0.pdf`), true);
  assert.equal(isPdfPublicationPath(`${LIVE_PDF_DIRECTORY}nested/a.pdf`), false);
  assert.equal(isPdfPublicationPath(`${LIVE_PDF_DIRECTORY}../a.pdf`), false);
  assert.equal(isPdfPublicationPath("packages/website/public/kit.pdf"), false);
});
