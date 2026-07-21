"use client";

import { useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "../tier-a/_frame";
import { Dots } from "./_run-console";
import { socraticReply, simulatedDelayMs } from "@/lib/claude-course/simulated-claude";

/**
 * SocraticTutor, a short back-and-forth chat that answers briefly then asks
 * a probing question back. Ported from `claude/js/widgets.js:464`
 * (SocraticTutor). `persona` is accepted for content-authoring parity with
 * the source (each lesson's instance documents its tutor persona) but has
 * no effect on the simulated replies, which are canned rather than
 * generated, see `lib/claude-course/simulated-claude.ts`.
 */
export interface SocraticTutorMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface SocraticTutorWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly topic: string;
  readonly persona?: string;
}

export function SocraticTutorWidget({
  lessonId,
  cpId,
  topic,
}: SocraticTutorWidgetProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [messages, setMessages] = useState<readonly SocraticTutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const turnCount = nextMessages.filter((m) => m.role === "user").length;
    await new Promise((resolve) => setTimeout(resolve, simulatedDelayMs(text)));
    const reply = socraticReply(text, turnCount);
    setMessages([...nextMessages, { role: "assistant", content: reply }]);
    setLoading(false);
    if (turnCount >= 3) complete();
  };

  return (
    <WidgetFrame kindLabel="Tutor mode" title="Chat with your topic tutor" done={done} xpLabel="+15 XP">
      <div
        role="log"
        aria-label="Conversation with the topic tutor"
        className="flex max-h-[320px] min-h-[160px] flex-col gap-3 overflow-y-auto border border-border bg-card/40 p-4"
      >
        {messages.length === 0 && (
          <p className="text-[13.5px] italic text-muted-foreground">
            Ask anything about <strong className="text-foreground">{topic}</strong>. I&apos;ll answer with a
            question back.
          </p>
        )}
        {messages.map((message, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[80%]",
              message.role === "user" ? "self-end text-right" : "self-start",
            )}
          >
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              {message.role === "user" ? "you" : "tutor"}
            </p>
            <p
              className={cn(
                "whitespace-pre-wrap px-3 py-2 text-[13.5px] leading-[1.5]",
                message.role === "user"
                  ? "bg-foreground text-background"
                  : "border border-border bg-background text-foreground",
              )}
            >
              {message.content}
            </p>
          </div>
        ))}
        {loading && (
          <p className="text-muted-foreground">
            <Dots />
          </p>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Type a question…"
          aria-label="Your question"
          className="flex-1 border-2 border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        />
        <button
          type="button"
          onClick={send}
          disabled={loading || !input.trim()}
          className={cn(
            "border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
          )}
        >
          Ask
        </button>
      </div>
    </WidgetFrame>
  );
}

export default SocraticTutorWidget;
