import type { AgentHelpCopy } from "./eigene-ki-copy";

/** English version of /hilfe/eigene-ki. */
export const AGENT_HELP_COPY_EN: AgentHelpCopy = {
  metadata: {
    title: "Connect your own AI | Free learning platform",
    description:
      "How to connect Claude Desktop, Claude Code and Codex to the learning platform, create an access token, and chat inside your account with your own Anthropic key.",
  },
  eyebrow: "Free learning platform · Help",
  title: "Connect your own AI.",
  intro:
    "This platform has a second door: an MCP server. Your own AI program reads the courses, lessons, workshops, book chapters and open-source tools through it, in the same wording you see in the browser. This page walks through the setup step by step.",
  indexLabel: "On this page",
  endpointLabel: "Address for your program",
  statusReady: {
    title: "The access is live.",
    body: "The address answers. The public content needs no account and no token.",
  },
  statusOff: {
    title: "This access is not switched on in this environment.",
    body: "The address below answers with an error instead of content right now. The instructions still hold: they apply as soon as the operator switches the access on.",
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
      "MCP is an open protocol that lets an AI program read someone else's content. Instead of pasting a lesson into a chat, your program fetches it and works with the real text.",
    facts: (toolCount) => [
      "The address does not speak HTML. Open it in a browser and you get a short explainer page rather than an error.",
      `${toolCount} tools are public: list the courses, fetch a course or a lesson, workshops with their materials, book chapters, the open-source tools, a search across the content, and the learning path as a graph.`,
      "Every tool takes a language: de or en. Without it your program gets the German text.",
    ],
    readOnlyTitle: "Read only.",
    readOnlyBody:
      "No tool records your progress, ticks a box, signs you up for anything, or issues a certificate of participation. What you have learned stays yours to decide in the browser.",
  },
  desktop: {
    title: "Claude Desktop",
    intro:
      "Claude Desktop calls a connection like this a custom connector. No terminal needed.",
    steps: [
      "Open the settings and go to Connectors.",
      "Choose Add custom connector.",
      "Give the connection a name, for example loehrning, and enter the address from above.",
      "Save it and start a new chat. The platform's tools then appear in the tool list.",
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
    note: "To check it, ask: which courses are on loehrning.ai? If a list of courses comes back, the connection works.",
  },
  code: {
    title: "Claude Code",
    intro: "One command in the terminal. Every later session knows the server.",
    steps: [
      "Run the command below in a terminal.",
      "Check with claude mcp list that loehrning is there.",
      "Start Claude Code and ask for a lesson. The program fetches it itself.",
    ],
    snippetLabel: "Command",
    snippet: (serverUrl) =>
      `claude mcp add --transport http loehrning ${serverUrl}`,
    note: "The server runs over HTTP, not as a local process. That is why the command needs --transport http and no path to a program on your machine.",
  },
  codex: {
    title: "Codex",
    intro: "One command in the terminal here as well.",
    steps: [
      "Run the command below.",
      "Check with codex mcp list that the server is registered.",
      "Ask for a workshop in a session. Codex reads the steps and the material list.",
    ],
    snippetLabel: "Command",
    snippet: (serverUrl) => `codex mcp add loehrning --url ${serverUrl}`,
    note: "Older versions only know local servers. If the command refuses the address, update Codex first.",
  },
  tokens: {
    intro:
      "Public content needs nothing at all. For your own progress, your program has to show who it works for. That is what an access token is: a string you create in your account and store in your program.",
    steps: [
      "Sign in and open Account, Your AI.",
      "Create an access token and give it a name that tells you which device uses it.",
      "Copy the token right away. It is shown exactly once, and only as a short prefix afterwards.",
      "Store it in your program as an Authorization header with the word Bearer in front of it.",
    ],
    snippetLabel: "Claude Code with a token",
    snippet: (serverUrl) =>
      `claude mcp add --transport http loehrning ${serverUrl} \\
  --header "Authorization: Bearer lat_..."`,
    format:
      "A token always starts with lat_ and is random after that. Only a verifier is stored, never the token itself: not even the operator can show it to you again. If you lose it, revoke it and create a new one.",
    limit: (maxActive) =>
      `You can hold up to ${maxActive} active tokens and revoke each one on its own. A revoked token stops working with the next request.`,
    bearerActive:
      "When you send your token along, two more tools appear: your progress and your next step. Both only read, nothing is written. Without a token your account stays out of reach, and a revoked token is refused instead of quietly falling back to the public tools.",
    bearerPending: "",
    oauthPending:
      "The second route, granting a program access through a sign-in page, is not set up yet. Until then the access token is the documented way in.",
    accountLink: "Go to Account, Your AI",
  },
  chat: {
    intro:
      "If you would rather not set up a program of your own, there is the chat inside your account. It runs on your own Anthropic key and reads the same content an outside program does.",
    steps: [
      "Sign in and open Account, Your AI.",
      "Store your Anthropic key there. Only its last characters stay visible.",
      "Pick a model from the allowed list and start writing.",
    ],
    cost: "Your messages go to Anthropic with your key, so under your own terms and at your own cost. The operator uses no key of their own for this.",
    transcript:
      "The transcript stays in your browser and is never stored on the server. Clear the site data and it is gone.",
    limits: (messagesPerHour, toolCalls) =>
      `${messagesPerHour} messages per hour, and up to ${toolCalls} tool calls per message. After that the chat waits rather than asking again.`,
    offTitle: "The chat is not set up in this environment.",
    offBody:
      "No key is stored and no request is made until the operator switches it on.",
    accountLink: "Go to the chat in your account",
  },
  addresses: {
    intro:
      "Lessons, workshops and book chapters carry stable addresses. Your program can store one and come back to it weeks later without searching the platform again.",
    examples: [
      { uri: "lesson://ki-fuehrerschein/block_1_lesson_1", label: "A lesson" },
      { uri: "workshop://ki-prognosen-einschaetzen", label: "A workshop" },
      { uri: "book://ki-landschaft/01_eisberg", label: "A book chapter" },
    ],
    localeNote:
      "Append ?locale=en for the English text. Without it you get the German one.",
    islandNote:
      "Lesson, chapter and workshop pages carry a button for this: open with your AI. It copies a ready prompt with the server address and the addresses of the page you are on.",
  },
  limits: {
    intro:
      "The access is open, not unlimited. The ceilings are fixed and the same for everyone.",
    requests: (maxPerHour) =>
      `${maxPerHour} requests per hour and address. After that the server refuses until the hour is over.`,
    output: (maxKilobytes) =>
      `Every answer is capped at ${maxKilobytes} KB. A longer text is truncated and carries the address of the original page, so your program can read the rest there.`,
    search: (maxResults, maxQueryChars) =>
      `Search returns at most ${maxResults} hits, and a query may be up to ${maxQueryChars} characters long.`,
    chat: (messagesPerHour, messageKibibytes) =>
      `The chat in your account: ${messagesPerHour} messages per hour, ${messageKibibytes} KiB per message.`,
    tokens: (maxActive, nameChars) =>
      `${maxActive} active access tokens per account, with a name of up to ${nameChars} characters.`,
    unavailable:
      "If the server cannot reach its counters, it refuses the request rather than letting it through uncounted.",
  },
  privacy: {
    intro:
      "Public requests run without an account and without an identifier. Once a program works for you, your account keeps a record of it, so you can see what happened.",
    logged: [
      "Which program it was, which tool it used, whether the call succeeded, and how long it took.",
      "The last 50 entries are in your account. They are deleted automatically after 30 days.",
    ],
    notLogged: [
      "No search query, no text from an answer, no chat message, and no key.",
      "Neither an access token nor an Anthropic key ever appears in clear text in a log line or an error report.",
    ],
    revoke:
      "You can revoke every access token and every grant in your account immediately. Delete your account and tokens, grants and the record go with it.",
    accountLink: "See the record in your account",
  },
  backToHelp: "Back to help",
};
