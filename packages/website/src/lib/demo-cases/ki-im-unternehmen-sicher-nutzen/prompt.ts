import type { AccountId, HitKind, Redaction } from "./types";

/*
 * The takeaways as text. The prompt holds only the clean text, never an
 * original; the record counts what was replaced.
 */
export interface PromptWords {
  /** The rules line after the task. */
  readonly rules: string;
  /** First line when the visitor gave no task. */
  readonly fallbackTask: string;
}

export function buildPrompt(clean: string, task: string, words: PromptWords): string {
  const first = task.trim() === "" ? words.fallbackTask : task.trim();
  return `${first}\n${words.rules}\n\n${clean}`;
}

export interface DateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export interface NoteWords {
  /** "{date}", "{account}", "{replaced}" and "{rest}" are filled in. */
  readonly line: string;
  readonly nothing: string;
  readonly account: Readonly<Record<AccountId, string>>;
  readonly nouns: Readonly<Record<HitKind, readonly [one: string, many: string]>>;
  readonly dateFormat: "dmy" | "iso";
  /** Shown until the browser knows today's date (server render). */
  readonly datePending: string;
}

const KIND_ORDER: readonly HitKind[] = [
  "person", "order", "ref", "address", "email", "phone", "iban", "amount", "secret", "manual",
];

const two = (n: number) => String(n).padStart(2, "0");

export function formatDate({ year, month, day }: DateParts, format: NoteWords["dateFormat"]): string {
  return format === "dmy" ? `${two(day)}.${two(month)}.${year}` : `${year}-${two(month)}-${two(day)}`;
}

/** "1 Name, 1 Bestellnummer, 2 Beträge". Counts distinct originals, like the key table and the prompt do. */
export function replacedList(r: Redaction, words: NoteWords): string {
  const seen = new Map<HitKind, Set<string>>();
  for (const hit of r.hits) {
    if (r.kept.has(hit.id)) continue;
    const set = seen.get(hit.kind) ?? new Set<string>();
    set.add(hit.value);
    seen.set(hit.kind, set);
  }
  const counts = new Map<HitKind, number>([...seen].map(([kind, set]) => [kind, set.size]));
  const parts = KIND_ORDER.filter((kind) => counts.has(kind)).map((kind) => {
    const n = counts.get(kind) as number;
    const [one, many] = words.nouns[kind];
    return `${n} ${n === 1 ? one : many}`;
  });
  return parts.length > 0 ? parts.join(", ") : words.nothing;
}

export function buildNote(
  r: Redaction,
  account: AccountId,
  rest: number,
  date: DateParts | null,
  words: NoteWords,
): string {
  return words.line
    .replace("{date}", date ? formatDate(date, words.dateFormat) : words.datePending)
    .replace("{account}", words.account[account])
    .replace("{replaced}", replacedList(r, words))
    .replace("{rest}", String(rest));
}
