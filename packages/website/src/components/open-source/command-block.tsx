import type { Locale } from "@/lib/i18n/locale";
import { CommandCopyButton } from "./command-copy-button";

const SHA = /^[a-f0-9]{40}$/;

const depth = (text: string) =>
  (text.match(/\(/g)?.length ?? 0) - (text.match(/\)/g)?.length ?? 0);

/**
 * A shell command as display lines: one top-level `&&` step per line, the
 * operator kept at the end of its line. A subshell `(cd x && y)` stays one
 * step. Display only; copying always uses the exact string.
 */
export function commandLines(command: string): readonly string[] {
  const steps: string[] = [];
  let open = "";
  for (const part of command.split(" && ")) {
    open = open ? `${open} && ${part}` : part;
    if (depth(open) <= 0) {
      steps.push(open);
      open = "";
    }
  }
  if (open) steps.push(open);
  return steps.map((step, index) =>
    index < steps.length - 1 ? `${step} &&` : step,
  );
}

const isFlag = (token: string) => /^-{1,2}[a-z]/i.test(token);

/**
 * The unbreakable groups of one display line: a flag keeps its value
 * (`-r requirements.lock`), and `&&` stays on the line of the token before
 * it. Display only.
 */
export function commandGroups(line: string): readonly (readonly string[])[] {
  const groups: string[][] = [];
  let bindNext = false;
  for (const token of line.split(" ")) {
    const last = groups[groups.length - 1];
    if (last && (token === "&&" || (bindNext && !isFlag(token)))) {
      last.push(token);
      bindNext = false;
      continue;
    }
    groups.push([token]);
    bindNext = isFlag(token);
  }
  return groups;
}

/**
 * One token. A URL may break only after a slash, the 40 character pin
 * anywhere; every other token stays whole.
 */
function Token({ token }: { readonly token: string }) {
  if (SHA.test(token)) {
    return <span className="whitespace-normal break-all">{token}</span>;
  }
  if (token.includes("://")) {
    const parts = token.split(/(?<=\/)(?!\/)/);
    return (
      <span className="whitespace-normal">
        {parts.map((part, index) => (
          <span key={index}>
            {index > 0 ? <wbr /> : null}
            <span className="whitespace-nowrap">{part}</span>
          </span>
        ))}
      </span>
    );
  }
  return <>{token}</>;
}

/**
 * A command with its copy button floated into the top right corner, so the
 * first lines run beside it and no empty row is spent on the button.
 */
export function CommandBlock({
  command,
  label,
  locale,
  quickstart = false,
}: {
  readonly command: string;
  readonly label: string;
  readonly locale: Locale;
  /** Marks the hub-level one-liner for the end-to-end test. */
  readonly quickstart?: boolean;
}) {
  const lines = commandLines(command);
  return (
    <div className="flow-root border border-foreground bg-background p-1.5">
      <CommandCopyButton
        command={command}
        label={label}
        locale={locale}
        className="float-right ml-2"
      />
      <pre
        className="whitespace-pre-wrap px-1.5 py-2 font-mono text-[0.8125rem] leading-relaxed sm:text-sm"
      >
        <code data-quickstart={quickstart ? "" : undefined}>
          {lines.map((line, index) => (
            <span key={index}>
              {commandGroups(line).map((group, at) => (
                <span key={at}>
                  {at > 0 ? " " : null}
                  {/* Plain spaces inside a group, so a hand-copied
                      command still runs; the group itself never wraps. */}
                  <span className="whitespace-nowrap">
                    {group.map((token, k) => (
                      <span key={k}>
                        {k > 0 ? " " : null}
                        <Token token={token} />
                      </span>
                    ))}
                  </span>
                </span>
              ))}
              {index < lines.length - 1 ? "\n" : null}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
