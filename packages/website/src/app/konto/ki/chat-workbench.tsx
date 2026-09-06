"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { ChatPanel, type ChatLessonContext } from "./chat-panel";
import { KeyForm, type StoredKeyState } from "./key-form";

/**
 * Holds the one piece of state the key form and the chat share: whether a key
 * is stored right now. Storing or deleting a key has to change what the chat
 * says without a reload, and a second server round trip to learn something
 * the previous response already returned would be a worse answer, not a safer
 * one. The hint is the only clear fragment involved; the key itself never
 * reaches this component.
 */
export function ChatWorkbench({
  locale,
  ownerId,
  models,
  initialKey,
  lesson,
}: {
  readonly locale: Locale;
  readonly ownerId: string;
  readonly models: readonly string[];
  readonly initialKey: StoredKeyState;
  readonly lesson: ChatLessonContext | null;
}) {
  const [stored, setStored] = useState<StoredKeyState>(initialKey);

  return (
    <>
      <KeyForm
        locale={locale}
        ownerId={ownerId}
        stored={stored}
        onStoredChange={setStored}
      />
      <ChatPanel
        locale={locale}
        ownerId={ownerId}
        models={models}
        hasKey={stored.hint !== null}
        lesson={lesson}
      />
    </>
  );
}
