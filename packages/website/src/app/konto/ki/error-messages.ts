import type { Locale } from "@/lib/i18n/locale";

/**
 * One sentence per named API failure, in both languages.
 *
 * The four routes this page talks to answer with a stable machine code and
 * never with prose, so every sentence a learner reads is written here. A code
 * this table does not know falls back to the caller's own generic line rather
 * than to the raw code, because a raw code is not an explanation.
 *
 * Wording rules that hold throughout: say what happened, say whether anything
 * changed, and say what to do next. An outage never reads as the learner's
 * mistake, and a rejected credential never reads as an outage.
 */

interface Message {
  readonly de: string;
  readonly en: string;
}

/** Failures every one of the four routes can answer with. */
const SHARED: Readonly<Record<string, Message>> = {
  unsupported_media_type: {
    de: "Die Anfrage hatte das falsche Format. Lade die Seite neu und versuche es erneut.",
    en: "The request had the wrong format. Reload the page and try again.",
  },
  unauthorized: {
    de: "Deine Anmeldung ist nicht mehr gültig. Melde dich erneut an.",
    en: "Your sign-in is no longer valid. Sign in again.",
  },
  auth_unavailable: {
    de: "Die Anmeldung lässt sich gerade nicht prüfen. Es wurde nichts geändert.",
    en: "Your sign-in cannot be checked right now. Nothing was changed.",
  },
  auth_not_configured: {
    de: "Die Anmeldung ist in dieser Umgebung nicht eingerichtet.",
    en: "Sign-in is not configured in this environment.",
  },
  account_owner_mismatch: {
    de: "Die Kontozuordnung hat sich geändert. Lade die Seite neu, bevor du es erneut versuchst.",
    en: "The account assignment changed. Reload the page before trying again.",
  },
  invalid_owner_binding: {
    de: "Die Kontozuordnung fehlte. Lade die Seite neu und versuche es erneut.",
    en: "The account binding was missing. Reload the page and try again.",
  },
  payload_too_large: {
    de: "Die Anfrage war zu groß. Kürze deine Eingabe.",
    en: "The request was too large. Shorten your input.",
  },
  rate_limit_exceeded: {
    de: "Du hast das Stundenlimit erreicht. Versuche es später noch einmal.",
    en: "You have reached the hourly limit. Try again later.",
  },
  rate_limit_unavailable: {
    de: "Das Limit lässt sich gerade nicht prüfen. Es wurde nichts geändert.",
    en: "The limit cannot be checked right now. Nothing was changed.",
  },
};

const KEY_MESSAGES: Readonly<Record<string, Message>> = {
  byo_chat_not_ready: {
    de: "Der Chat ist in dieser Umgebung nicht eingerichtet. Es wurde kein Schlüssel gespeichert.",
    en: "The chat is not configured in this environment. No key was stored.",
  },
  invalid_llm_key_request: {
    de: "Die Anfrage war unvollständig. Lade die Seite neu und versuche es erneut.",
    en: "The request was incomplete. Reload the page and try again.",
  },
  invalid_llm_key: {
    de: "Das sieht nicht nach einem Anthropic-Schlüssel aus. Er beginnt mit sk-ant-.",
    en: "That does not look like an Anthropic key. It starts with sk-ant-.",
  },
  llm_key_rejected: {
    de: "Anthropic hat diesen Schlüssel abgelehnt. Prüfe ihn in deinem Anthropic-Konto und füge ihn erneut ein.",
    en: "Anthropic rejected this key. Check it in your Anthropic account and paste it again.",
  },
  provider_timeout: {
    de: "Anthropic hat nicht rechtzeitig geantwortet. Der Schlüssel wurde nicht gespeichert.",
    en: "Anthropic did not answer in time. The key was not stored.",
  },
  llm_key_validation_failed: {
    de: "Anthropic war nicht erreichbar, deshalb wurde der Schlüssel nicht gespeichert. Das sagt nichts über den Schlüssel selbst aus.",
    en: "Anthropic was unreachable, so the key was not stored. That says nothing about the key itself.",
  },
  llm_key_store_unavailable: {
    de: "Der Speicher für Schlüssel ist gerade nicht verfügbar. Es wurde nichts geändert.",
    en: "The key store is unavailable right now. Nothing was changed.",
  },
  llm_key_write_failed: {
    de: "Der Schlüssel konnte nicht gespeichert werden. Es wurde nichts geändert.",
    en: "The key could not be stored. Nothing was changed.",
  },
  llm_key_delete_failed: {
    de: "Der Schlüssel konnte nicht gelöscht werden. Er ist weiterhin gespeichert.",
    en: "The key could not be deleted. It is still stored.",
  },
};

const TOKEN_MESSAGES: Readonly<Record<string, Message>> = {
  agent_access_disabled: {
    de: "Der Zugang für Programme ist in dieser Umgebung nicht aktiv, deshalb wird kein Schlüssel erzeugt.",
    en: "Program access is not active in this environment, so no key is created.",
  },
  invalid_token_name: {
    de: "Der Name ist nicht zulässig. Wähle einen kurzen Namen ohne Sonderzeichen.",
    en: "That name is not allowed. Choose a short name without control characters.",
  },
  invalid_token_id: {
    de: "Der Schlüssel wurde nicht erkannt. Lade die Seite neu.",
    en: "The key was not recognised. Reload the page.",
  },
  token_limit: {
    de: "Du hast die Höchstzahl aktiver Schlüssel erreicht. Ziehe einen zurück, bevor du einen neuen erzeugst.",
    en: "You have reached the maximum number of active keys. Revoke one before creating another.",
  },
  token_store_unavailable: {
    de: "Der Speicher für Zugriffsschlüssel ist gerade nicht verfügbar. Es wurde nichts geändert.",
    en: "The access key store is unavailable right now. Nothing was changed.",
  },
  token_mint_failed: {
    de: "Der Schlüssel konnte nicht erzeugt werden. Es wurde keiner ausgegeben.",
    en: "The key could not be created. None was issued.",
  },
  token_revoke_failed: {
    de: "Der Schlüssel konnte nicht zurückgezogen werden. Er ist weiterhin gültig.",
    en: "The key could not be revoked. It is still valid.",
  },
  token_not_found: {
    de: "Dieser Schlüssel ist bereits zurückgezogen oder existiert nicht mehr.",
    en: "That key is already revoked or no longer exists.",
  },
};

const GRANT_MESSAGES: Readonly<Record<string, Message>> = {
  invalid_grant_request: {
    de: "Die Freigabe wurde nicht erkannt. Lade die Seite neu.",
    en: "The grant was not recognised. Reload the page.",
  },
  oauth_server_unavailable: {
    de: "Freigaben sind in dieser Umgebung nicht eingerichtet. Es wurde nichts geändert.",
    en: "Grants are not set up in this environment. Nothing was changed.",
  },
  grant_revoke_failed: {
    de: "Die Freigabe konnte nicht zurückgezogen werden. Sie besteht weiter.",
    en: "The grant could not be revoked. It is still in place.",
  },
};

const CHAT_MESSAGES: Readonly<Record<string, Message>> = {
  chat_not_enabled: {
    de: "Der Chat ist in dieser Umgebung nicht eingerichtet.",
    en: "The chat is not configured in this environment.",
  },
  message_too_large: {
    de: "Deine Nachricht ist zu lang. Kürze sie und sende erneut.",
    en: "Your message is too long. Shorten it and send again.",
  },
  invalid_chat_request: {
    de: "Die Anfrage war unvollständig. Lade die Seite neu und schreibe die Nachricht erneut.",
    en: "The request was incomplete. Reload the page and write the message again.",
  },
  chat_owner_mismatch: {
    de: "Die Kontozuordnung hat sich geändert. Lade die Seite neu, bevor du weiterschreibst.",
    en: "The account assignment changed. Reload the page before continuing.",
  },
  model_not_allowed: {
    de: "Dieses Modell ist hier nicht freigegeben. Wähle eines aus der Liste.",
    en: "That model is not allowed here. Pick one from the list.",
  },
  llm_key_missing: {
    de: "Es ist noch kein Anthropic-Schlüssel gespeichert. Speichere ihn oben.",
    en: "No Anthropic key is stored yet. Store one above.",
  },
  llm_key_unavailable: {
    de: "Dein gespeicherter Schlüssel ist gerade nicht lesbar. Es wurde keine Anfrage gestellt.",
    en: "Your stored key cannot be read right now. No request was made.",
  },
  llm_key_rejected: {
    de: "Anthropic hat deinen gespeicherten Schlüssel abgelehnt. Ersetze ihn oben.",
    en: "Anthropic rejected your stored key. Replace it above.",
  },
  llm_credit_required: {
    de: "Dein Anthropic-Konto hat kein Guthaben mehr für diese Anfrage.",
    en: "Your Anthropic account has no remaining credit for this request.",
  },
  llm_request_rejected: {
    de: "Anthropic hat die Anfrage abgelehnt. Formuliere sie kürzer oder anders.",
    en: "Anthropic rejected the request. Try a shorter or different message.",
  },
  llm_busy: {
    de: "Anthropic ist gerade ausgelastet. Warte einen Moment und sende erneut.",
    en: "Anthropic is busy right now. Wait a moment and send again.",
  },
  llm_timeout: {
    de: "Anthropic hat nicht rechtzeitig geantwortet.",
    en: "Anthropic did not answer in time.",
  },
  llm_unavailable: {
    de: "Anthropic war nicht erreichbar. Versuche es später noch einmal.",
    en: "Anthropic was unreachable. Try again later.",
  },
  llm_empty_response: {
    de: "Es kam keine Antwort zurück. Sende deine Nachricht erneut.",
    en: "No answer came back. Send your message again.",
  },
  tool_budget_exhausted: {
    de: "Die Antwort hat zu viele Werkzeuge nacheinander benutzt und wurde beendet.",
    en: "The answer used too many tools in a row and was stopped.",
  },
  tool_input_invalid: {
    de: "Ein Werkzeug wurde falsch aufgerufen. Formuliere die Frage anders.",
    en: "A tool was called incorrectly. Try asking differently.",
  },
  tool_failed: {
    de: "Ein Werkzeug konnte die Inhalte nicht laden.",
    en: "A tool could not load the content.",
  },
};

export type ErrorRegion = "key" | "token" | "grant" | "chat";

const REGION_MESSAGES: Readonly<Record<ErrorRegion, Readonly<Record<string, Message>>>> =
  {
    key: KEY_MESSAGES,
    token: TOKEN_MESSAGES,
    grant: GRANT_MESSAGES,
    chat: CHAT_MESSAGES,
  };

/**
 * Resolve one named failure into a sentence. `fallback` is the region's own
 * generic line and is used for any code this table does not know, so a new
 * server-side code degrades to a plain, honest message instead of leaking an
 * identifier into the interface.
 */
export function agentErrorMessage(
  region: ErrorRegion,
  code: unknown,
  locale: Locale,
  fallback: string,
): string {
  if (typeof code !== "string" || code.length === 0) return fallback;
  const message = REGION_MESSAGES[region][code] ?? SHARED[code];
  if (!message) return fallback;
  return locale === "en" ? message.en : message.de;
}
