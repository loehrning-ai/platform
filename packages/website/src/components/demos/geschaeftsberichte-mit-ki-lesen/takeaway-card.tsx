import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { fill } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/format";
import { buildPrompt, buildRules, buildSentence, type Facts } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/takeaway";

type Slot = "sentence" | "prompt" | "rules" | "file";
/** The last copy or download, shared by both parts so the page has one live region for it. */
export type TakeStatus = { readonly slot: Slot; readonly ok: boolean } | null;

/** Copy with the async clipboard, falling back to a hidden textarea and execCommand. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the textarea path */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface Props {
  readonly pack: DemoPack;
  readonly facts: Facts | null;
  readonly trigger: number;
  readonly withDefects: boolean;
  /** "text": the sentence and the prompt (first, so a short visit reaches Satz kopieren fast). "rules": the whole rules file, last. */
  readonly part: "text" | "rules";
  readonly status: TakeStatus;
  readonly onStatus: (status: TakeStatus) => void;
}

/** The three things to take away, shown in full before any button. */
export function TakeawayCard({ pack, facts, trigger, withDefects, part, status, onStatus: setStatus }: Props) {
  const t = pack.take;

  const text = part === "text";
  if (!facts) {
    // One neutral line, in Mitnehmen; the rules file waits for the numbers without repeating it.
    if (!text) return null;
    return (
      <section className="mg-card mg-take" aria-labelledby="mg-text-h">
        <h2 id="mg-text-h" className="mg-h">{t.h}</h2>
        <p className="mg-hint mg-empty">{t.empty}</p>
      </section>
    );
  }
  const sentence = buildSentence(pack, facts);
  const prompt = buildPrompt(pack, facts);
  const rules = buildRules(pack, facts, { trigger, withDefects });

  const copy = async (slot: Slot, text: string) => setStatus({ slot, ok: await copyText(text) });
  // The confirmation is drawn next to its button (aria-hidden) and spoken once by the single live region in Mitnehmen.
  const spoken = status ? (status.slot === "file" ? fill(t.downloaded, {}) : status.ok ? t.copied : t.copyFailed) : "";
  const note = (slot: Slot) => (
    <span className="mg-copied" aria-hidden="true" data-ok={status?.slot === slot && status.ok ? "" : undefined}>
      {status?.slot === slot ? (status.ok ? t.copied : t.copyFailed) : ""}
    </span>
  );

  const status_ = <p className="mg-sr" role="status">{spoken}</p>;
  if (!text) {
    return (
      <section className="mg-card mg-rules" aria-labelledby="mg-rules-h">
        <h2 id="mg-rules-h" className="mg-h">{t.rulesLabel}</h2>
        <p className="mg-lede mg-file">{t.fileName}</p>
        <div className="mg-actions mg-actions-top">
          <button
            type="button"
            className="mg-btn mg-btn-solid"
            onClick={() => {
              download(t.fileName, rules);
              setStatus({ slot: "file", ok: true });
            }}
          >
            {t.dlRules}
          </button>
          <button type="button" className="mg-btn" onClick={() => copy("rules", rules)}>{t.copyRules}</button>
          {status?.slot === "file" ? (
            <span className="mg-copied" aria-hidden="true" data-ok="">{fill(t.downloaded, {})}</span>
          ) : (
            note("rules")
          )}
        </div>
        <pre className="mg-text mg-pre" data-testid="take-rules">{rules}</pre>
      </section>
    );
  }

  return (
    <section className="mg-card mg-take" aria-labelledby="mg-text-h">
      <h2 id="mg-text-h" className="mg-h">{t.h}</h2>
      <p className="mg-lede">{t.intro}</p>
      {status_}
      <div className="mg-block">
        <h3 className="mg-h3">{t.sentenceLabel}</h3>
        <p className="mg-text" data-testid="take-sentence">{sentence}</p>
        <div className="mg-actions">
          <button type="button" className="mg-btn mg-btn-solid" onClick={() => copy("sentence", sentence)}>{t.copySentence}</button>
          {note("sentence")}
        </div>
      </div>

      <div className="mg-block">
        <h3 className="mg-h3">{t.promptLabel}</h3>
        <p className="mg-text" data-testid="take-prompt">{prompt}</p>
        <div className="mg-actions">
          <button type="button" className="mg-btn" onClick={() => copy("prompt", prompt)}>{t.copyPrompt}</button>
          {note("prompt")}
        </div>
      </div>
    </section>
  );
}
