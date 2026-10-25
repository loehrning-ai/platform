"use client";

/**
 * Hands the visitor a file built in this tab: a Blob, an object URL, one
 * click, and the URL revoked right after. Nothing is uploaded.
 */
export function downloadText(name: string, text: string, type: string): void {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
