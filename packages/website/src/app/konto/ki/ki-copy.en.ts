import type { AgentAccountCopy } from "./ki-copy";

/** English copy for /konto/ki, rendered by the generated /en mirror. */
export const AGENT_ACCOUNT_COPY_EN: AgentAccountCopy = {
  metadata: {
    title: "Account · Your AI | Free learning platform",
    description:
      "Connect your own AI programs to your learning account: access keys, grants, activity and chat.",
  },
  eyebrow: "Free learning platform · Account",
  title: "Your AI.",
  intro:
    "Connect your own AI program to the platform and chat about the courses on your Anthropic key.",
  backToAccount: "Back to your record",
  sectionNavigationLabel: "Sections on this page",
  sections: {
    chat: "Chat",
    tokens: "Access keys",
    grants: "Granted clients",
    activity: "Activity",
  },

  accountUnavailableTitle: "Your sign-in status cannot be read right now.",
  accountUnavailableBody:
    "You were not signed out. Reload the page in a few minutes.",

  endpointHeading: "Connection",
  endpointBody:
    "Add this address in your program as an HTTP connection. Public content needs no sign-in; your record needs a granted client or an access key.",
  endpointLabel: "Address",
  endpointHelpLink: "Setup guide for your program",
  endpointOffTitle: "Program access is not configured here.",
  endpointOffBody:
    "The address appears here once it is enabled. Until then access keys and grants have no effect.",

  chatHeading: "Chat with your AI",
  chatIntro:
    "The chat reads the same course content as your program.",
  chatOffTitle: "The chat is not configured in this environment.",
  chatOffBody:
    "Until then no key is stored and no request is made.",

  keyHeading: "Your Anthropic key",
  keyDisclosure:
    "Your messages go to Anthropic with your key, under your contract terms and at your own cost.",
  keyStored: (hint) => `Stored. Your key ends in ${hint}.`,
  keyValidated: (moment) => `Last checked: ${moment}.`,
  keyMissing: "No key stored yet.",
  keyLabel: "Anthropic API key",
  keyPlaceholder: "sk-ant-...",
  keySave: "Store key",
  keyReplace: "Replace key",
  keySaving: "Checking",
  keyDelete: "Delete key",
  keyDeleting: "Deleting",
  keySavedNotice: "Key checked and stored.",
  keyDeletedNotice: "Key deleted.",
  keyShapeError: "That does not look like an Anthropic key. It starts with sk-ant-.",
  keyUnknownError: "The key could not be stored.",
  keyStateUnavailable:
    "Your key can't be loaded right now. Reload the page before replacing it.",

  modelLabel: "Model",
  modelHint: "Models this installation allows.",

  chatLabel: "Your message",
  chatPlaceholder: "Ask about the courses, workshop sheets, or books.",
  chatSend: "Send",
  chatSending: "Answering",
  chatStop: "Stop",
  chatClear: "Clear transcript",
  chatEmpty: "No messages yet.",
  chatNeedsKey: "Store your Anthropic key first.",
  chatRoleUser: "You",
  chatRoleAssistant: "AI",
  chatToolUsed: (tool) => `Tool used: ${tool}`,
  chatLessonChip: (lesson) => `Context: ${lesson}`,
  chatLessonRemove: "Remove context",
  chatTranscriptNote:
    "The transcript stays in this browser only, per account, never on the server.",
  chatUnknownError: "The answer could not be loaded.",
  chatLogLabel: "Transcript",

  tokensHeading: "Access keys",
  tokensIntro:
    "For programs that cannot complete a browser grant. A key is shown exactly once.",
  tokenNameLabel: "Name",
  tokenNamePlaceholder: "Claude Desktop on the laptop",
  tokenCreate: "Create key",
  tokenCreating: "Creating",
  tokenOnceTitle: "Your new access key",
  tokenOnceBody:
    "Copy it now. It is not stored and cannot be shown again.",
  tokenCopy: "Copy",
  tokenCopied: "Copied",
  tokenDismiss: "Hide",
  tokensEmpty: "No access key created yet.",
  tokenCreated: (moment) => `Created: ${moment}`,
  tokenLastUsed: (moment) => `Last used: ${moment}`,
  tokenNeverUsed: "Never used",
  tokenRevokedAt: (moment) => `Revoked: ${moment}`,
  tokenRevoke: "Revoke",
  tokenRevoking: "Revoking",
  tokenActiveCount: (active, limit) => `${active} of ${limit} active`,
  tokenLimitReached:
    "You have reached the maximum number of active keys. Revoke one before creating another.",
  tokenNameRequired: "Give the key a name.",
  tokenUnknownError: "The key could not be created.",
  tokensUnavailable:
    "Your access keys can't be loaded right now. Reload the page.",

  grantsHeading: "Granted clients",
  grantsIntro: "Programs you granted access to your account in the browser.",
  grantsEmpty: "No program has access to your account yet.",
  grantScopesLabel: "Scopes",
  grantNoScopes: "no scopes given",
  grantGranted: (moment) => `Granted: ${moment}`,
  grantRevoke: "Revoke access",
  grantRevoking: "Revoking",
  grantRevokedNotice:
    "Access revoked. An access token the program already holds keeps working until it expires, on the agent interface too.",
  grantUnknownError: "The grant could not be revoked.",
  grantsSetupTitle: "Grants are not set up yet.",
  grantsSetupBody:
    "Until then, connect your program with an access key below.",
  grantsUnavailable:
    "Your granted clients can't be loaded right now. Reload the page.",
  grantsListLabel: "Granted clients",

  activityHeading: "Activity",
  activityIntro:
    "The last 50 program accesses. Logged are client, tool, result and duration, never inputs or outputs.",
  activityEmpty: "No program has reached your account yet.",
  activityRetention: "Entries are deleted automatically after 30 days.",
  activityUnavailable:
    "The activity can't be loaded right now. Reload the page.",
  activityTableLabel: "Recent program accesses",
  activityColumnMoment: "When",
  activityColumnClient: "Client",
  activityColumnTool: "Tool",
  activityColumnResult: "Result",
  activityColumnDuration: "Duration",
  activityOk: "succeeded",
  activityFailed: "failed",
  activityDuration: (milliseconds) => `${milliseconds} ms`,
};
