/**
 * Reduction of a browser's Content-Security-Policy violation report to the
 * shape this platform is willing to log.
 *
 * A report is attacker-controlled input and, even when honest, carries the
 * document URL with its query string, the referrer, the user agent, a sample
 * of the violating script, and the original policy, which embeds the
 * per-request nonce. None of that is logged. Every field below is rebuilt
 * from an exact allowlist or reduced to a bounded projection (an origin, a
 * path); a value that fits neither becomes "unknown" rather than passing
 * through.
 *
 * Three wire shapes reach the endpoint, and all three are accepted whichever
 * media type delivered them, because engines disagree: Chromium's report-uri
 * channel sends the CSP2 `{"csp-report": {...}}` envelope with kebab-case
 * fields, WebKit's report-uri channel sends one Reporting API report object
 * with camelCase fields, and the Reporting API proper sends a batch of such
 * objects.
 */

export type CspReportedDisposition = "enforce" | "report" | "unknown";

export interface CspViolation {
  /** Directive name the browser actually applied, e.g. script-src-elem. */
  readonly effectiveDirective: string;
  /** Directive name the report cites as violated; the name only. */
  readonly violatedDirective: string;
  readonly disposition: CspReportedDisposition;
  /** Origin of the blocked resource, a CSP keyword such as "inline", or "unknown". */
  readonly blockedUri: string;
  /** Path of the document, never its query string or fragment. */
  readonly documentPath: string;
  readonly statusCode: number | null;
}

export type CspViolationLogLine = Readonly<{
  event: "csp-violation";
  effectiveDirective: string;
  violatedDirective: string;
  disposition: CspReportedDisposition;
  blockedUri: string;
  documentPath: string;
  statusCode: number | null;
  /** How many reports one logged line stands for. */
  sampleRate: number;
}>;

/**
 * One in fifty style reports is kept. The inline style blocks are a known
 * allowance tracked for the enforcement stage, so their reports carry no
 * news; script violations are the whole point of the canary and are never
 * sampled.
 */
export const STYLE_SAMPLE_RATE = 50;

/** Well above what an 8 KB body can carry; a longer batch is refused whole. */
export const MAX_BATCH_REPORTS = 100;

const UNKNOWN = "unknown";
const MAX_FIELD_LENGTH = 2_048;
const MAX_DOCUMENT_PATH_LENGTH = 512;

const CSP_REPORT_MEDIA_TYPES: ReadonlySet<string> = new Set([
  // The CSP2 report-uri channel.
  "application/csp-report",
  // The Reporting API channel report-to names.
  "application/reports+json",
]);

/** Every directive name a report may cite. Only the name is kept. */
const CSP_DIRECTIVE_NAMES: ReadonlySet<string> = new Set([
  "base-uri",
  "block-all-mixed-content",
  "child-src",
  "connect-src",
  "default-src",
  "font-src",
  "form-action",
  "frame-ancestors",
  "frame-src",
  "img-src",
  "manifest-src",
  "media-src",
  "navigate-to",
  "object-src",
  "prefetch-src",
  "report-to",
  "report-uri",
  "require-trusted-types-for",
  "sandbox",
  "script-src",
  "script-src-attr",
  "script-src-elem",
  "style-src",
  "style-src-attr",
  "style-src-elem",
  "trusted-types",
  "upgrade-insecure-requests",
  "worker-src",
]);

/**
 * The non-URL blocked-uri tokens the specification defines. Each names a kind
 * of source, never a resource, so it carries nothing worth withholding.
 */
const CSP_BLOCKED_KEYWORDS: ReadonlySet<string> = new Set([
  "inline",
  "eval",
  "wasm-eval",
  "data",
  "blob",
  "self",
  "trusted-types-policy",
  "trusted-types-sink",
]);

/** A URL parser path: already percent-encoded, so the alphabet is small. */
const DOCUMENT_PATH_PATTERN = /^\/[A-Za-z0-9._~%!$&'()*+,;=:@/-]*$/;

type UnknownRecord = Readonly<Record<string, unknown>>;

interface ReportEnvelope {
  readonly type: string;
  readonly body: UnknownRecord;
}

/** Whether a Content-Type names one of the two CSP report media types. */
export function isCspReportMediaType(contentType: string | null): boolean {
  if (contentType === null || contentType.length > MAX_FIELD_LENGTH) {
    return false;
  }
  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  return CSP_REPORT_MEDIA_TYPES.has(mediaType);
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ownField(record: UnknownRecord, key: string): unknown {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}

function boundedString(value: unknown): string | null {
  return typeof value === "string" && value.length <= MAX_FIELD_LENGTH
    ? value
    : null;
}

function parseUrl(value: string): URL | null {
  return URL.canParse(value) ? new URL(value) : null;
}

/**
 * WebKit's CSP2 violated-directive is the whole directive, sources included,
 * which puts the nonce on the wire. Only the leading name survives, and only
 * when it is a directive this module knows.
 */
function directiveNameOf(value: unknown): string {
  const text = boundedString(value);
  if (text === null) return UNKNOWN;
  const name = text.trim().split(/\s+/, 1)[0]?.toLowerCase() ?? "";
  return CSP_DIRECTIVE_NAMES.has(name) ? name : UNKNOWN;
}

function dispositionOf(value: unknown): CspReportedDisposition {
  return value === "enforce" || value === "report" ? value : UNKNOWN;
}

/**
 * A blocked URL keeps its origin and nothing else. An opaque origin (data:,
 * about:, javascript:) keeps only its scheme, because the rest of such a URL
 * is the blocked content itself.
 */
function blockedOriginOf(value: unknown): string {
  const text = boundedString(value);
  if (text === null) return UNKNOWN;
  if (CSP_BLOCKED_KEYWORDS.has(text)) return text;
  const parsed = parseUrl(text);
  if (parsed === null) return UNKNOWN;
  if (parsed.origin !== "null") return parsed.origin;
  const scheme = parsed.protocol.slice(0, -1);
  return scheme.length > 0 ? scheme : UNKNOWN;
}

/** The document keeps its path: never the query string, never the fragment. */
function documentPathOf(value: unknown): string {
  const text = boundedString(value);
  if (text === null) return UNKNOWN;
  const parsed = parseUrl(text);
  if (parsed === null) return UNKNOWN;
  const path = parsed.pathname;
  return path.length <= MAX_DOCUMENT_PATH_LENGTH &&
    !path.startsWith("//") &&
    DOCUMENT_PATH_PATTERN.test(path)
    ? path
    : UNKNOWN;
}

function statusCodeOf(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    (value === 0 || (value >= 100 && value <= 599))
    ? value
    : null;
}

function fromReportingApiBody(body: UnknownRecord): CspViolation {
  const effectiveDirective = directiveNameOf(
    ownField(body, "effectiveDirective"),
  );
  return Object.freeze({
    effectiveDirective,
    // The Reporting API body names no violated directive: CSP3 defines it as
    // the effective one.
    violatedDirective: effectiveDirective,
    disposition: dispositionOf(ownField(body, "disposition")),
    blockedUri: blockedOriginOf(ownField(body, "blockedURL")),
    documentPath: documentPathOf(ownField(body, "documentURL")),
    statusCode: statusCodeOf(ownField(body, "statusCode")),
  });
}

function fromLegacyBody(body: UnknownRecord): CspViolation {
  const effective = ownField(body, "effective-directive");
  const violated = ownField(body, "violated-directive");
  return Object.freeze({
    effectiveDirective: directiveNameOf(effective ?? violated),
    violatedDirective: directiveNameOf(violated ?? effective),
    disposition: dispositionOf(ownField(body, "disposition")),
    blockedUri: blockedOriginOf(ownField(body, "blocked-uri")),
    documentPath: documentPathOf(ownField(body, "document-uri")),
    statusCode: statusCodeOf(ownField(body, "status-code")),
  });
}

function reportEnvelopeOf(value: unknown): ReportEnvelope | null {
  if (!isRecord(value)) return null;
  const type = ownField(value, "type");
  const body = ownField(value, "body");
  return typeof type === "string" && isRecord(body) ? { type, body } : null;
}

function violationsOf(envelope: ReportEnvelope): readonly CspViolation[] {
  // A Reporting API group can carry other report types; only ours are read.
  return envelope.type === "csp-violation"
    ? [fromReportingApiBody(envelope.body)]
    : [];
}

/**
 * The violations a decoded body carries: an empty list for a well-formed
 * Reporting API delivery that holds none of ours, or null for a body that is
 * not a CSP report in any accepted shape.
 */
export function parseCspViolations(
  payload: unknown,
): readonly CspViolation[] | null {
  if (Array.isArray(payload)) {
    if (payload.length > MAX_BATCH_REPORTS) return null;
    const envelopes = payload.map(reportEnvelopeOf);
    if (envelopes.some((envelope) => envelope === null)) return null;
    return Object.freeze(
      envelopes.flatMap((envelope) =>
        envelope === null ? [] : violationsOf(envelope),
      ),
    );
  }
  if (!isRecord(payload)) return null;
  if (Object.hasOwn(payload, "csp-report")) {
    const legacy = ownField(payload, "csp-report");
    return isRecord(legacy) ? Object.freeze([fromLegacyBody(legacy)]) : null;
  }
  const single = reportEnvelopeOf(payload);
  return single === null ? null : Object.freeze(violationsOf(single));
}

function isStyleViolation(violation: CspViolation): boolean {
  return (
    violation.effectiveDirective.startsWith("style-src") ||
    violation.violatedDirective.startsWith("style-src")
  );
}

/** How many reports one logged line for this violation stands for. */
export function cspViolationSampleRate(violation: CspViolation): number {
  return isStyleViolation(violation) ? STYLE_SAMPLE_RATE : 1;
}

/** 32-bit FNV-1a: cheap, stable across runtimes, and free of randomness. */
function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * Whether a violation is logged. Script reports always are. Style reports are
 * sampled one in fifty by a hash of the document path and the violated
 * directive rather than by chance, so the same page gives the same answer on
 * every run and a test can name a page that is kept and one that is dropped.
 */
export function isSampledCspViolation(violation: CspViolation): boolean {
  const rate = cspViolationSampleRate(violation);
  if (rate === 1) return true;
  const key = `${violation.documentPath}\n${violation.violatedDirective}`;
  return fnv1a32(key) % rate === 0;
}

/** The one structured line a kept report becomes. */
export function cspViolationLogLine(
  violation: CspViolation,
): CspViolationLogLine {
  return Object.freeze({
    event: "csp-violation" as const,
    effectiveDirective: violation.effectiveDirective,
    violatedDirective: violation.violatedDirective,
    disposition: violation.disposition,
    blockedUri: violation.blockedUri,
    documentPath: violation.documentPath,
    statusCode: violation.statusCode,
    sampleRate: cspViolationSampleRate(violation),
  });
}
