"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locale";
import {
  decodeAccountChatEvent,
  type AccountChatStreamEvent,
} from "@/lib/anthropic-chat/protocol";
import {
  getLearningOwnerContext,
  getOwnedLocalLearningItem,
  setOwnedLocalLearningItem,
} from "@/lib/progress/browser-learning-storage";
import { useLearningOwnerGeneration } from "@/lib/progress/use-learning-owner-generation";
import { ACCOUNT_CHAT_ENDPOINT } from "./agent-account-contract";
import { ndjsonLines, nextTurnId } from "./chat-stream";
import {
  appendTurn,
  CHAT_TRANSCRIPT_STORAGE_KEY,
  parseStoredTranscript,
  replaceTurn,
  serializeTranscript,
  toRequestMessages,
  type ChatTurn,
} from "./chat-transcript";
import { agentErrorMessage } from "./error-messages";
import { AGENT_ACCOUNT_COPY } from "./ki-copy";

/**
 * The account chat, with no provider SDK in the bundle.
 *
 * The route answers newline-delimited JSON, so reading it needs a fetch, a
 * reader, and a decoder. Everything an agent SDK would add here is server
 * work that has already happened by the time the first line arrives.
 *
 * The transcript lives in this browser under the account namespace of the
 * learning storage, so two accounts on one machine never see each other's
 * conversation, and a sign-out that changes the owner drops the panel back to
 * an empty transcript instead of showing the previous account's messages.
 */

export interface ChatLessonContext {
  /** Canonical lesson:// address the route accepts as reading context. */
  readonly uri: string;
  /** Short human label for the chip. */
  readonly label: string;
}

const INPUT_CLASS =
  "min-h-11 w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange";
const BUTTON_CLASS =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground hover:border-brand-orange hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange disabled:opacity-50";

export function ChatPanel({
  locale,
  ownerId,
  models,
  hasKey,
  lesson,
}: {
  readonly locale: Locale;
  readonly ownerId: string;
  readonly models: readonly string[];
  readonly hasKey: boolean;
  readonly lesson: ChatLessonContext | null;
}) {
  const copy = AGENT_ACCOUNT_COPY[locale];
  const messageFieldId = useId();
  const modelFieldId = useId();
  const ownerGeneration = useLearningOwnerGeneration();
  const [loadedGeneration, setLoadedGeneration] = useState<number | null>(null);
  const [turns, setTurns] = useState<readonly ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [model, setModel] = useState(models[0] ?? "");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessonAttached, setLessonAttached] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  // Load once per owner. A changed generation means a different account (or an
  // unresolved one), so the previous transcript must not stay on screen.
  useEffect(() => {
    let restored: readonly ChatTurn[] = [];
    if (getLearningOwnerContext().kind !== "unknown") {
      try {
        restored = parseStoredTranscript(
          getOwnedLocalLearningItem(CHAT_TRANSCRIPT_STORAGE_KEY),
        );
      } catch {
        restored = [];
      }
    }
    setTurns(restored);
    setLoadedGeneration(ownerGeneration);
  }, [ownerGeneration]);

  // Persist only what was loaded for this exact owner, so an in-flight
  // account switch cannot write one account's messages into another's key.
  useEffect(() => {
    if (loadedGeneration !== ownerGeneration) return;
    const owner = getLearningOwnerContext();
    if (owner.kind === "unknown" || owner.generation !== ownerGeneration) return;
    try {
      setOwnedLocalLearningItem(
        CHAT_TRANSCRIPT_STORAGE_KEY,
        serializeTranscript(turns),
        ownerGeneration,
      );
    } catch {
      // Storage can be unavailable (private mode, blocked site data). The
      // conversation continues in memory.
    }
  }, [turns, loadedGeneration, ownerGeneration]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const ready = loadedGeneration === ownerGeneration;

  const applyEvent = useCallback(
    (event: AccountChatStreamEvent, answerId: string) => {
      if (event.type === "text") {
        // Appending inside the updater keeps the accumulated answer in state
        // rather than in a mutable box beside it, so a delta can never be
        // applied to a stale copy of the turn.
        setTurns((current) =>
          replaceTurn(current, answerId, (turn) => ({
            ...turn,
            content: turn.content + event.text,
          })),
        );
        return;
      }
      if (event.type === "tool") {
        setTurns((current) =>
          replaceTurn(current, answerId, (turn) =>
            turn.tools.includes(event.name)
              ? turn
              : { ...turn, tools: [...turn.tools, event.name] },
          ),
        );
        return;
      }
      if (event.type === "error") {
        setError(
          agentErrorMessage("chat", event.error, locale, copy.chatUnknownError),
        );
      }
    },
    [copy.chatUnknownError, locale],
  );

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = draft.trim();
    if (question.length === 0 || streaming || !hasKey || !ready) return;

    const askedTurn: ChatTurn = {
      id: nextTurnId("user"),
      role: "user",
      content: question,
      tools: [],
    };
    const answerId = nextTurnId("assistant");
    const withQuestion = appendTurn(turns, askedTurn);
    const messages = toRequestMessages(withQuestion);

    setTurns(
      appendTurn(withQuestion, {
        id: answerId,
        role: "assistant",
        content: "",
        tools: [],
      }),
    );
    setDraft("");
    setError(null);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch(ACCOUNT_CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          expectedOwnerId: ownerId,
          locale,
          ...(model ? { model } : {}),
          ...(lesson && lessonAttached ? { lessonUri: lesson.uri } : {}),
          messages,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          readonly error?: unknown;
        } | null;
        setError(
          agentErrorMessage(
            "chat",
            payload?.error,
            locale,
            copy.chatUnknownError,
          ),
        );
        return;
      }
      if (!response.body) {
        setError(copy.chatUnknownError);
        return;
      }
      for await (const line of ndjsonLines(response.body)) {
        const decoded = decodeAccountChatEvent(line);
        if (decoded) applyEvent(decoded, answerId);
      }
    } catch (streamError) {
      // A deliberate stop is not a failure; the partial answer stays.
      if (!(streamError instanceof Error && streamError.name === "AbortError")) {
        setError(copy.chatUnknownError);
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
      // An answer that produced no text at all would otherwise sit in the
      // transcript as an empty bubble and be replayed as an empty message.
      setTurns((current) =>
        current.filter(
          (turn) => turn.id !== answerId || turn.content.length > 0,
        ),
      );
    }
  }

  function handleClear() {
    abortRef.current?.abort();
    setTurns([]);
    setError(null);
  }

  return (
    <div className="mt-6">
      {models.length > 1 ? (
        <div className="max-w-sm">
          <label
            htmlFor={modelFieldId}
            className="block font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground"
          >
            {copy.modelLabel}
          </label>
          <select
            id={modelFieldId}
            value={model}
            onChange={(event) => setModel(event.target.value)}
            disabled={streaming}
            className={`mt-2 ${INPUT_CLASS}`}
          >
            {models.map((candidate) => (
              <option key={candidate} value={candidate}>
                {candidate}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {copy.modelHint}
          </p>
        </div>
      ) : (
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
          {copy.modelLabel}
          {": "}
          {model}
        </p>
      )}

      {lesson && lessonAttached ? (
        <p className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-11 items-center border-l-[3px] border-brand-orange bg-kupfer-mist px-3 text-xs font-semibold text-foreground">
            {copy.chatLessonChip(lesson.label)}
          </span>
          <button
            type="button"
            onClick={() => setLessonAttached(false)}
            className={BUTTON_CLASS}
          >
            {copy.chatLessonRemove}
          </button>
        </p>
      ) : null}

      <section
        aria-label={copy.chatLogLabel}
        className="mt-4 border border-border bg-background"
      >
        {turns.length === 0 ? (
          <p className="p-4 text-sm leading-relaxed text-muted-foreground">
            {copy.chatEmpty}
          </p>
        ) : (
          <ul className="grid gap-px bg-border">
            {turns.map((turn) => (
              <li key={turn.id} className="bg-background p-4">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange">
                  {turn.role === "user"
                    ? copy.chatRoleUser
                    : copy.chatRoleAssistant}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {turn.content}
                </p>
                {turn.tools.length > 0 ? (
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    {copy.chatToolUsed(turn.tools.join(", "))}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p role="status" className="mt-2 min-h-5 text-xs leading-relaxed text-muted-foreground">
        {streaming ? copy.chatSending : ""}
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-2 border-l-[3px] border-brand-orange pl-3 text-sm leading-relaxed text-foreground"
        >
          {error}
        </p>
      ) : null}
      {!hasKey ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {copy.chatNeedsKey}
        </p>
      ) : null}

      <form onSubmit={handleSend} className="mt-4">
        <label
          htmlFor={messageFieldId}
          className="block font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground"
        >
          {copy.chatLabel}
        </label>
        <textarea
          id={messageFieldId}
          name="message"
          rows={3}
          value={draft}
          placeholder={copy.chatPlaceholder}
          onChange={(event) => setDraft(event.target.value)}
          disabled={!hasKey || streaming}
          className={`mt-2 ${INPUT_CLASS}`}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={!hasKey || streaming || !ready || draft.trim().length === 0}
            className={BUTTON_CLASS}
          >
            {streaming ? copy.chatSending : copy.chatSend}
          </button>
          {streaming ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className={BUTTON_CLASS}
            >
              {copy.chatStop}
            </button>
          ) : null}
          {turns.length > 0 ? (
            <button type="button" onClick={handleClear} className={BUTTON_CLASS}>
              {copy.chatClear}
            </button>
          ) : null}
        </div>
      </form>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {copy.chatTranscriptNote}
      </p>
    </div>
  );
}
