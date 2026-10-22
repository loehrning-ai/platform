/**
 * The copy is plain data, so the server can hand one locale to the client
 * tree as a prop. Where a text depends on a value it is a template with
 * {placeholders}, and where it depends on a count it has a singular and a
 * plural form. These helpers fill them; they hold no words of their own.
 */

export interface Plural {
  readonly one: string;
  readonly other: string;
}

/** Replace every {key} with its value; an unknown key stays as written. */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match,
  );
}

/** The singular form for exactly one, the plural form otherwise. */
export function pick(plural: Plural, count: number): string {
  return count === 1 ? plural.one : plural.other;
}

/** "1, 4 und 5" / "1, 4 and 5": the last two joined with the locale's word. */
export function joinList(values: readonly (string | number)[], and: string): string {
  if (values.length <= 1) return values.join("");
  return `${values.slice(0, -1).join(", ")} ${and} ${values[values.length - 1]}`;
}
