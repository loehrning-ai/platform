/**
 * The page a person sees when they open the MCP endpoint in a browser.
 *
 * `GET /api/mcp` is not part of the transport, so the endpoint answers it with
 * something useful instead of a protocol error: what this address is, and the
 * exact command or configuration block for the three clients it was verified
 * against. The document is self-contained; the route serves it as text/html
 * from the Node runtime, so it carries its own small stylesheet rather than
 * the application bundle.
 *
 * Serving constraints kept here on purpose: no script, no animation, no
 * network font, every link and copy target at least 44 pixels tall, no text
 * below 12 pixels, and both locales reachable from each other.
 */

import { SITE_ORIGIN } from "@/lib/seo/entity";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale";
import { MCP_ENDPOINT_PATH } from "./config";
import { MCP_TOOLS } from "./tools/registry";

export const MCP_ENDPOINT_URL = `${SITE_ORIGIN}${MCP_ENDPOINT_PATH}`;

interface ClientSnippet {
  readonly client: string;
  readonly hint: string;
  readonly language: string;
  readonly code: string;
}

const CLAUDE_DESKTOP_SNIPPET = `{
  "mcpServers": {
    "loehrning": {
      "type": "http",
      "url": "${MCP_ENDPOINT_URL}"
    }
  }
}`;

const CLAUDE_CODE_SNIPPET =
  `claude mcp add --transport http loehrning ${MCP_ENDPOINT_URL}`;

const CODEX_SNIPPET = `codex mcp add loehrning --url ${MCP_ENDPOINT_URL}`;

const COPY = {
  de: {
    lang: "de",
    documentTitle: "MCP-Server von loehrning.ai",
    heading: "Das hier ist ein MCP-Server",
    intro:
      "Diese Adresse spricht kein HTML, sondern das Model Context Protocol. Trage sie in deinem KI-Client ein, dann kann er die Kurse, Lektionen, Workshops, Buchkapitel und Open-Source-Werkzeuge dieser Plattform lesen.",
    endpointLabel: "Endpunkt",
    readOnlyTitle: "Nur lesend",
    readOnlyBody:
      "Alle Werkzeuge lesen. Keines schreibt Fortschritt, setzt einen Haken oder fasst ein Konto an. Du brauchst dafür keinen Zugang und keinen Schlüssel.",
    setupTitle: "Einrichten",
    toolsTitle: "Werkzeuge",
    toolsIntro: "Diese Werkzeuge stehen bereit:",
    resourcesTitle: "Adressierbare Inhalte",
    resourcesBody:
      "Lektionen, Workshops und Buchkapitel haben feste Adressen, die du speichern und wieder aufrufen kannst:",
    localeTitle: "Sprache",
    localeBody:
      "Jedes Werkzeug nimmt locale mit de oder en. Ohne Angabe bekommst du den deutschen Text.",
    switchLabel: "In English",
    switchHref: `${MCP_ENDPOINT_PATH}?locale=en`,
    backLabel: "Zur Plattform",
    clients: [
      {
        client: "Claude Desktop",
        hint: "Einstellungen, Connectors, eigener Connector. Oder direkt in die Konfigurationsdatei:",
        language: "json",
        code: CLAUDE_DESKTOP_SNIPPET,
      },
      {
        client: "Claude Code",
        hint: "Im Terminal, einmalig:",
        language: "bash",
        code: CLAUDE_CODE_SNIPPET,
      },
      {
        client: "Codex",
        hint: "Im Terminal, einmalig:",
        language: "bash",
        code: CODEX_SNIPPET,
      },
    ] as readonly ClientSnippet[],
  },
  en: {
    lang: "en",
    documentTitle: "loehrning.ai MCP server",
    heading: "This is an MCP server",
    intro:
      "This address does not speak HTML. It speaks the Model Context Protocol. Add it to your AI client and it can read the courses, lessons, workshops, book chapters and open-source tools of this platform.",
    endpointLabel: "Endpoint",
    readOnlyTitle: "Read only",
    readOnlyBody:
      "Every tool reads. None writes progress, records a checkpoint, or touches an account. No sign-in and no key are needed.",
    setupTitle: "Set it up",
    toolsTitle: "Tools",
    toolsIntro: "These tools are available:",
    resourcesTitle: "Addressable content",
    resourcesBody:
      "Lessons, workshops and book chapters carry stable addresses you can store and come back to:",
    localeTitle: "Language",
    localeBody:
      "Every tool takes locale with de or en. Without it you get the German text.",
    switchLabel: "Auf Deutsch",
    switchHref: MCP_ENDPOINT_PATH,
    backLabel: "Back to the platform",
    clients: [
      {
        client: "Claude Desktop",
        hint: "Settings, Connectors, add a custom connector. Or straight into the configuration file:",
        language: "json",
        code: CLAUDE_DESKTOP_SNIPPET,
      },
      {
        client: "Claude Code",
        hint: "In the terminal, once:",
        language: "bash",
        code: CLAUDE_CODE_SNIPPET,
      },
      {
        client: "Codex",
        hint: "In the terminal, once:",
        language: "bash",
        code: CODEX_SNIPPET,
      },
    ] as readonly ClientSnippet[],
  },
} as const;

const RESOURCE_EXAMPLES = [
  "lesson://ki-fuehrerschein/block_1_lesson_1",
  "workshop://ki-prognosen-einschaetzen",
  "book://ki-landschaft/01_eisberg?locale=en",
] as const;

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const STYLES = `
:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 2.5rem 1.25rem 4rem;
  background: #f7f1e7;
  color: #19232d;
  font: 16px/1.65 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
}
main { max-width: 46rem; margin: 0 auto; }
h1 { font-size: 1.9rem; line-height: 1.2; margin: 0 0 0.75rem; }
h2 { font-size: 1.2rem; line-height: 1.3; margin: 2.25rem 0 0.5rem; }
h3 { font-size: 1rem; margin: 1.5rem 0 0.35rem; }
p { margin: 0 0 0.9rem; }
code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
pre {
  background: #fff9ed;
  border: 1px solid #827970;
  border-radius: 8px;
  padding: 0.9rem 1rem;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.55;
  margin: 0 0 1rem;
}
.endpoint {
  display: block;
  background: #fff9ed;
  border: 1px solid #a5370f;
  border-radius: 8px;
  padding: 0.85rem 1rem;
  font-size: 1rem;
  word-break: break-all;
}
.label { font-size: 0.8125rem; letter-spacing: 0.06em; text-transform: uppercase; color: #655c54; margin: 0 0 0.35rem; }
.note { background: #f5e8e2; border-left: 4px solid #a5370f; padding: 0.9rem 1rem; border-radius: 0 8px 8px 0; }
ul { margin: 0 0 1rem; padding-left: 1.25rem; }
li { margin: 0 0 0.35rem; }
.tool-name { font-weight: 600; }
nav { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 2.5rem 0 0; }
nav a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  min-width: 44px;
  padding: 0.5rem 1.1rem;
  border: 1px solid #a5370f;
  border-radius: 8px;
  color: #a5370f;
  text-decoration: none;
  font-size: 1rem;
}
nav a:hover, nav a:focus-visible { background: #f5e8e2; }
footer { margin-top: 2.5rem; font-size: 0.875rem; color: #655c54; }
@media (prefers-color-scheme: dark) {
  body { background: #242342; color: #f7f1e7; }
  pre, .endpoint { background: rgba(247, 241, 231, 0.06); border-color: rgba(247, 241, 231, 0.4); }
  .endpoint { border-color: #e07050; }
  .label, footer { color: #d7d0e4; }
  .note { background: rgba(224, 112, 80, 0.14); border-left-color: #e07050; }
  nav a { border-color: #e07050; color: #e07050; }
  nav a:hover, nav a:focus-visible { background: rgba(224, 112, 80, 0.14); }
}
`;

function clientSection(snippet: ClientSnippet): string {
  return [
    `<h3>${escapeHtml(snippet.client)}</h3>`,
    `<p>${escapeHtml(snippet.hint)}</p>`,
    `<pre><code>${escapeHtml(snippet.code)}</code></pre>`,
  ].join("\n");
}

/**
 * Render the explainer. Everything interpolated is a compiled-in constant or
 * a registry value, so the escaping below guards against a future content
 * change rather than against request input.
 */
export function renderMcpExplainer(locale: Locale = DEFAULT_LOCALE): string {
  const copy = COPY[locale];
  const tools = MCP_TOOLS.map(
    (tool) =>
      `<li><span class="tool-name">${escapeHtml(tool.name)}</span> ${escapeHtml(
        tool.description,
      )}</li>`,
  ).join("\n");
  const resources = RESOURCE_EXAMPLES.map(
    (uri) => `<li><code>${escapeHtml(uri)}</code></li>`,
  ).join("\n");

  return `<!doctype html>
<html lang="${copy.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, follow">
<title>${escapeHtml(copy.documentTitle)}</title>
<style>${STYLES}</style>
</head>
<body>
<main>
<h1>${escapeHtml(copy.heading)}</h1>
<p>${escapeHtml(copy.intro)}</p>
<p class="label">${escapeHtml(copy.endpointLabel)}</p>
<p><code class="endpoint">${escapeHtml(MCP_ENDPOINT_URL)}</code></p>
<div class="note">
<p><strong>${escapeHtml(copy.readOnlyTitle)}</strong> ${escapeHtml(copy.readOnlyBody)}</p>
</div>
<h2>${escapeHtml(copy.setupTitle)}</h2>
${copy.clients.map(clientSection).join("\n")}
<h2>${escapeHtml(copy.toolsTitle)}</h2>
<p>${escapeHtml(copy.toolsIntro)}</p>
<ul>
${tools}
</ul>
<h2>${escapeHtml(copy.resourcesTitle)}</h2>
<p>${escapeHtml(copy.resourcesBody)}</p>
<ul>
${resources}
</ul>
<h2>${escapeHtml(copy.localeTitle)}</h2>
<p>${escapeHtml(copy.localeBody)}</p>
<nav>
<a href="${escapeHtml(copy.switchHref)}">${escapeHtml(copy.switchLabel)}</a>
<a href="${escapeHtml(SITE_ORIGIN)}">${escapeHtml(copy.backLabel)}</a>
</nav>
<footer>
<p>${escapeHtml(SITE_ORIGIN)}</p>
</footer>
</main>
</body>
</html>
`;
}
