import type { AgentHelpCopy } from "./eigene-ki-copy";

/** English version of /hilfe/eigene-ki. */
export const AGENT_HELP_COPY_EN: AgentHelpCopy = {
  metadata: {
    title: "Connect your own AI | Free learning platform",
    description:
      "Connect Claude Desktop, Claude Code and Codex to the learning platform, create an access token, and chat in your account with your own Anthropic key.",
  },
  eyebrow: "Free learning platform · Help",
  title: "Connect your own AI.",
  intro:
    "Through an MCP server, your AI program reads the courses, lessons, workshops, book chapters and open-source tools in the same wording you see in the browser.",
  indexLabel: "On this page",
  endpointLabel: "Address for your program",
  statusReady: {
    title: "Access is live.",
    body: "The public content needs no account and no token.",
  },
  statusOff: {
    title: "Access is off in this environment.",
    body: "Until the operator switches it on, the address returns an error.",
  },
  sectionTitles: {
    overview: "What this is",
    desktop: "Claude Desktop",
    code: "Claude Code",
    codex: "Codex",
    tokens: "Access tokens",
    chat: "Chat in your account",
    addresses: "Stable addresses",
    limits: "Limits",
    privacy: "What is recorded",
  },
  overview: {
    intro:
      "MCP is an open protocol that lets your AI program fetch a lesson itself, so you paste nothing into a chat.",
    facts: (toolCount) => [
      "Opened in a browser, the address shows a short explainer page.",
      `${toolCount} public tools: list courses, fetch a course or lesson, workshops with materials, book chapters, open-source tools, search, and the learning path as a graph.`,
      "Every tool takes the language de or en. Without it you get the German text.",
    ],
    readOnlyTitle: "Read only.",
    readOnlyBody:
      "No tool records progress, ticks a box, signs you up, or issues a certificate of participation.",
  },
  desktop: {
    title: "Claude Desktop",
    intro: "Claude Desktop calls this a custom connector. No terminal needed.",
    steps: [
      "Open the settings and go to Connectors.",
      "Choose Add custom connector.",
      "Enter a name, for example loehrning, and the address from above.",
      "Save and start a new chat. The tools then appear in the tool list.",
    ],
    snippetLabel: "Or straight into the configuration file",
    snippet: (serverUrl) => `{
  "mcpServers": {
    "loehrning": {
      "type": "http",
      "url": "${serverUrl}"
    }
  }
}`,
    note: "To check, ask: which courses are on loehrning.ai? If a course list comes back, the connection works.",
  },
  code: {
    title: "Claude Code",
    intro: "Add it once in the terminal and every session knows the server.",
    steps: [
      "Run the command below in a terminal.",
      "Check with claude mcp list that loehrning is there.",
      "Ask Claude Code for a lesson. The program fetches it itself.",
    ],
    snippetLabel: "Command",
    snippet: (serverUrl) =>
      `claude mcp add --transport http loehrning ${serverUrl}`,
    note: "The server runs over HTTP, so the command needs --transport http instead of a local program path.",
  },
  codex: {
    title: "Codex",
    intro: "Codex also needs one terminal command.",
    steps: [
      "Run the command below.",
      "Check with codex mcp list that the server is registered.",
      "Ask for a workshop in a session. Codex reads the steps and the material list.",
    ],
    snippetLabel: "Command",
    snippet: (serverUrl) => `codex mcp add loehrning --url ${serverUrl}`,
    note: "Older versions only know local servers. If the command refuses the address, update Codex.",
  },
  tokens: {
    intro:
      "Public content needs no token. For your own progress, create an access token in your account and store it in your program.",
    steps: [
      "Sign in and open Account, Your AI.",
      "Create a token and name it after the device that uses it.",
      "Copy it right away. It is shown in full only once, then only as a short prefix.",
      "Store it in your program as an Authorization header with the word Bearer in front.",
    ],
    snippetLabel: "Claude Code with a token",
    snippet: (serverUrl) =>
      `claude mcp add --transport http loehrning ${serverUrl} \\
  --header "Authorization: Bearer lat_..."`,
    format:
      "A token starts with lat_. Only a verifier is stored, so not even the operator can show it again. If you lose it, revoke it and create a new one.",
    limit: (maxActive) =>
      `Up to ${maxActive} tokens can be active at once.`,
    bearerActive:
      "With a token, two more read-only tools appear: your progress and your next step. From the next request on, the server refuses a revoked token, even for the public tools.",
    bearerPending: "",
    oauthPending:
      "Granting access through a sign-in page is not set up yet. Until then, use the access token.",
    accountLink: "Go to Account, Your AI",
  },
  chat: {
    intro:
      "Without a program of your own, use the chat in your account. It runs on your Anthropic key and reads the same content.",
    steps: [
      "Sign in and open Account, Your AI.",
      "Store your Anthropic key. Only its last characters stay visible.",
      "Pick a model and start writing.",
    ],
    cost: "Your messages go to Anthropic with your key, under your own terms and at your own cost.",
    transcript:
      "The transcript stays in your browser only. Clear the site data and it is gone.",
    limits: (messagesPerHour, toolCalls) =>
      `${messagesPerHour} messages per hour, up to ${toolCalls} tool calls per message. Then the chat stops.`,
    offTitle: "The chat is not set up in this environment.",
    offBody:
      "Until the operator switches it on, no key is stored and no request is made.",
    accountLink: "Go to the chat in your account",
  },
  addresses: {
    intro:
      "Lessons, workshops and book chapters have stable addresses your program can store and open again later.",
    examples: [
      { uri: "lesson://ki-fuehrerschein/block_1_lesson_1", label: "A lesson" },
      { uri: "workshop://ki-prognosen-einschaetzen", label: "A workshop" },
      { uri: "book://ki-landschaft/01_eisberg", label: "A book chapter" },
    ],
    localeNote: "Append ?locale=en for English; otherwise you get German.",
    islandNote:
      "On lesson, chapter and workshop pages, the Open with your AI button copies a ready prompt with the server address and the page's addresses.",
  },
  limits: {
    intro: "These limits are the same for everyone.",
    requests: (maxPerHour) =>
      `${maxPerHour} requests per hour per IP address. After that the server refuses until the hour is over.`,
    output: (maxKilobytes) =>
      `Every answer is capped at ${maxKilobytes} KB. Longer texts are cut and name the address of the original page.`,
    search: (maxResults, maxQueryChars) =>
      `Search returns at most ${maxResults} hits, for queries of up to ${maxQueryChars} characters.`,
    chat: (messagesPerHour, messageKibibytes) =>
      `Chat in your account: ${messagesPerHour} messages per hour, ${messageKibibytes} KiB per message.`,
    tokens: (maxActive, nameChars) =>
      `${maxActive} active access tokens per account, names up to ${nameChars} characters.`,
    unavailable:
      "If the server cannot count requests right now, it refuses them.",
  },
  privacy: {
    intro:
      "Public requests run without an account or identifier. When a program works for you, your account logs its calls.",
    logged: [
      "Logged: program, tool, success and duration of each call.",
      "The last 50 entries are in your account and are deleted after 30 days.",
    ],
    notLogged: [
      "Not logged: search queries, answer texts, chat messages and keys.",
      "Error reports also show no access token or Anthropic key in clear text.",
    ],
    revoke:
      "You can revoke any token or grant in your account immediately. Deleting your account removes them and the log.",
    accountLink: "View the log",
  },
  backToHelp: "Back to help",
};
