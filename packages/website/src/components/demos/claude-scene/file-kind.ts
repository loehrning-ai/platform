/** The type label and size text of a file chip ("CSV · 2 KB"). */
export function fileKind(name: string): string {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  const kinds: Record<string, string> = { csv: "CSV", md: "Markdown", txt: "Text", py: "Python", json: "JSON", pdf: "PDF", xlsx: "Excel", zip: "ZIP" };
  return kinds[extension] ?? extension.toUpperCase();
}

export function fileSize(bytes: number, locale: "de" | "en"): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
  const mb = (kb / 1024).toFixed(1);
  return `${locale === "de" ? mb.replace(".", ",") : mb} MB`;
}
