/** Fills "{name}" slots of a copy string; a slot without a value stays visible, so a test catches it. */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (slot, key: string) => (key in values ? String(values[key]) : slot));
}
