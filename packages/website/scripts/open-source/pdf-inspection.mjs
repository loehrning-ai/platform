import { inflateSync } from "node:zlib";

/**
 * The publication validator for PDFs in the platform profile.
 *
 * A PDF is an active container: it can run JavaScript, launch files, carry
 * attachments, forms and hidden XMP metadata. The scanner therefore refuses
 * every PDF except under a reviewed directory, and there only a narrow
 * shape passes: one revision, unencrypted, FlateDecode streams with direct
 * lengths, link annotations whose only action is a URI to https or mailto,
 * and a document information dictionary with nothing but a producer and a
 * title. Object streams are inflated and checked like the rest of the file,
 * because that is where WeasyPrint writes the dictionaries. Anything the
 * validator does not understand fails closed.
 */

export const MAX_PDF_BYTES = 2 * 1024 * 1024;
const MAX_PDF_STREAMS = 256;
const MAX_INFLATED_STREAM_BYTES = 8 * 1024 * 1024;

/** Directories whose PDFs are reviewed output (CV Engine pages of an invented person). */
export const PDF_PUBLICATION_DIRECTORIES = Object.freeze([
  "packages/website/public/artifacts/tools/cv-engine/live/pdf/",
]);

/** Names that make a PDF active, carry files or hide metadata. */
const FORBIDDEN_NAMES = new Set([
  "3D",
  "AA",
  "AcroForm",
  "EmbeddedFile",
  "EmbeddedFiles",
  "Encrypt",
  "FileAttachment",
  "GoToE",
  "GoToR",
  "ImportData",
  "JS",
  "JavaScript",
  "Launch",
  "Metadata",
  "Movie",
  "OpenAction",
  "RichMedia",
  "Rendition",
  "ResetForm",
  "Sound",
  "SubmitForm",
  "XFA",
]);

/** Every action type of ISO 32000-1 and -2; only URI may appear. */
const ACTION_TYPES = new Set([
  "GoTo",
  "GoTo3DView",
  "GoToDp",
  "GoToE",
  "GoToR",
  "Hide",
  "ImportData",
  "JavaScript",
  "Launch",
  "Movie",
  "Named",
  "RichMediaExecute",
  "Rendition",
  "ResetForm",
  "SetOCGState",
  "Sound",
  "SubmitForm",
  "Thread",
  "Trans",
  "URI",
]);

const ALLOWED_INFO_KEYS = new Set(["Producer", "Title"]);
const ALLOWED_URI_RE = /^(?:https:\/\/|mailto:)[\x21-\x7e]*$/;
const NAME_RE = /\/([^\s()<>[\]{}/%]*)/g;

export function isPdfPublicationPath(relativePath) {
  return PDF_PUBLICATION_DIRECTORIES.some(
    (directory) =>
      relativePath.startsWith(directory) &&
      /^[a-z0-9-]+\.pdf$/.test(relativePath.slice(directory.length)),
  );
}

function fail(label, reason) {
  throw new Error(`${label}: ${reason}`);
}

/**
 * Splits the file into the text a reader parses as objects (everything
 * outside streams, plus the inflated object streams) and checks each stream.
 */
function objectText(bytes, label) {
  const source = bytes.toString("latin1");
  const streamHead = /stream\r?\n/g;
  let text = "";
  let cursor = 0;
  let streams = 0;
  for (;;) {
    streamHead.lastIndex = cursor;
    const match = streamHead.exec(source);
    if (!match) break;
    const before = source.slice(cursor, match.index);
    const dictionaryStart = before.lastIndexOf("obj");
    if (dictionaryStart === -1) fail(label, "stream without an object header");
    const dictionary = before.slice(dictionaryStart + 3);
    streams += 1;
    if (streams > MAX_PDF_STREAMS) fail(label, "too many streams");
    const length = /\/Length\s+(\d+)(\s+\d+\s+R)?/.exec(dictionary);
    if (!length || length[2]) fail(label, "stream length is not a direct integer");
    const filters = dictionary.match(/\/Filter\s*(\[[^\]]*\]|\/[A-Za-z0-9]+)/);
    if (filters && filters[1] !== "/FlateDecode") {
      fail(label, `stream filter ${filters[1]} is not allowed`);
    }
    if (/\/DecodeParms/.test(dictionary) && !/\/Type\s*\/XRef/.test(dictionary)) {
      fail(label, "stream decode parameters are not allowed");
    }
    const start = match.index + match[0].length;
    const end = start + Number(length[1]);
    if (end > bytes.length) fail(label, "stream runs past the end of the file");
    const tail = source.slice(end, end + 12);
    if (!/^\r?\n?endstream/.test(tail)) fail(label, "stream length does not reach endstream");
    text += before;
    if (/\/Type\s*\/ObjStm/.test(dictionary)) {
      if (!filters) fail(label, "object stream is not compressed as expected");
      let inflated;
      try {
        inflated = inflateSync(bytes.subarray(start, end), {
          maxOutputLength: MAX_INFLATED_STREAM_BYTES,
        });
      } catch {
        fail(label, "object stream does not inflate");
      }
      text += `\n${inflated.toString("latin1")}\n`;
    } else if (filters) {
      try {
        inflateSync(bytes.subarray(start, end), {
          maxOutputLength: MAX_INFLATED_STREAM_BYTES,
        });
      } catch {
        fail(label, "stream does not inflate");
      }
    }
    cursor = source.indexOf("endstream", end) + "endstream".length;
  }
  return text + source.slice(cursor);
}

/**
 * Tokenizes strings and comments the way a reader does: literal strings nest
 * balanced parentheses and honour backslash escapes, hex strings are `<...>`
 * (not `<<`), and a comment runs from `%` outside a string to the line end.
 * Returns the text with every string replaced by a placeholder `\u0000n\u0000`
 * (so names inside strings are not mistaken for keys) and every comment
 * blanked, plus the raw strings by index.
 */
function maskStrings(text, label) {
  const strings = [];
  let masked = "";
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    if (char === "%") {
      const end = text.slice(index).search(/[\r\n]/);
      index = end === -1 ? text.length : index + end;
      masked += " ";
    } else if (char === "(") {
      let depth = 0;
      let cursor = index;
      for (; cursor < text.length; cursor += 1) {
        const current = text[cursor];
        if (current === "\\") {
          cursor += 1;
        } else if (current === "(") {
          depth += 1;
        } else if (current === ")") {
          depth -= 1;
          if (depth === 0) break;
        }
      }
      if (depth !== 0) fail(label, "unterminated literal string");
      strings.push(text.slice(index, cursor + 1));
      masked += `\u0000${strings.length - 1}\u0000`;
      index = cursor + 1;
    } else if (char === "<" && text[index + 1] !== "<") {
      const end = text.indexOf(">", index);
      if (end === -1) fail(label, "unterminated hex string");
      const raw = text.slice(index, end + 1);
      if (!/^<[0-9a-fA-F\s]*>$/.test(raw)) fail(label, "malformed hex string");
      strings.push(raw);
      masked += `\u0000${strings.length - 1}\u0000`;
      index = end + 1;
    } else if (char === "<") {
      masked += "<<";
      index += 2;
    } else {
      masked += char;
      index += 1;
    }
  }
  return { masked, strings };
}

/** A literal string's value, or null for a hex string or one with escapes. */
function plainLiteral(raw) {
  if (!raw.startsWith("(") || raw.includes("\\")) return null;
  return raw.slice(1, -1);
}

/**
 * Throws when the PDF is outside the publishable shape; returns a summary
 * otherwise.
 */
export function inspectPdf(bytes, { label = "PDF" } = {}) {
  if (!Buffer.isBuffer(bytes)) fail(label, "contents were not read");
  if (bytes.length > MAX_PDF_BYTES) fail(label, "file is larger than the PDF ceiling");
  const source = bytes.toString("latin1");
  if (!/^%PDF-1\.[0-7]\r?\n/.test(source)) fail(label, "header is not %PDF-1.x");
  if ((source.match(/%%EOF/g) ?? []).length !== 1 || !/%%EOF\s*$/.test(source)) {
    fail(label, "file has more than one revision or trailing bytes");
  }
  if ((source.match(/startxref/g) ?? []).length !== 1) {
    fail(label, "file has more than one cross-reference section");
  }

  // Strings are data; names inside them are not keys, so a title can neither
  // trip nor hide a forbidden key.
  const { masked, strings } = maskStrings(objectText(bytes, label), label);
  for (const [, name] of masked.matchAll(NAME_RE)) {
    if (name.includes("#")) fail(label, `escaped name /${name} is not allowed`);
    if (FORBIDDEN_NAMES.has(name)) fail(label, `/${name} is not allowed`);
  }

  // `/S` also names a transparency group's subtype; only action types count.
  const actions = [...masked.matchAll(/\/S\s*\/([A-Za-z0-9]+)/g)]
    .map((match) => match[1])
    .filter((subtype) => ACTION_TYPES.has(subtype));
  for (const action of actions) {
    if (action !== "URI") fail(label, `action /${action} is not allowed`);
  }

  // `/URI` is either the action subtype (`/S /URI`) or the key, whose value
  // must be a plain literal string to https or mailto.
  const uris = [];
  for (const match of masked.matchAll(/\/URI(?![A-Za-z0-9])/g)) {
    if (/\/S\s*$/.test(masked.slice(Math.max(0, match.index - 8), match.index))) continue;
    const value = /^\s*\u0000(\d+)\u0000/.exec(masked.slice(match.index + 4));
    const uri = value ? plainLiteral(strings[Number(value[1])]) : null;
    if (uri === null) fail(label, "URI is not a plain literal string");
    if (!ALLOWED_URI_RE.test(uri)) fail(label, `URI ${JSON.stringify(uri)} is not allowed`);
    uris.push(uri);
  }

  if (!/\/Info\s+\d+\s+0\s+R/.test(masked)) {
    fail(label, "document information dictionary is missing");
  }
  const infoDictionaries = masked.match(/<<\s*\/Producer[^<>]*>>/g) ?? [];
  if (infoDictionaries.length !== 1) fail(label, "document information dictionary is not unique");
  const info = infoDictionaries[0];
  for (const [, key] of info.matchAll(/\/([^\s()<>[\]{}/%\u0000]+)/g)) {
    if (!ALLOWED_INFO_KEYS.has(key)) fail(label, `information key /${key} is not allowed`);
  }
  const producerRef = /\/Producer\s*\u0000(\d+)\u0000/.exec(info);
  const producer = producerRef ? plainLiteral(strings[Number(producerRef[1])]) : null;
  if (producer === null || !/^WeasyPrint \d+(?:\.\d+)*$/.test(producer)) {
    fail(label, "producer is not WeasyPrint");
  }

  return { uris: [...new Set(uris)], producer };
}
