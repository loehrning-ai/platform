/** Hands the visitor a file made in this tab: a Blob, a temporary link, the link revoked right after. */
export function downloadText(name: string, text: string, type = "text/markdown;charset=utf-8"): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
