/** UTF-8 text, or windows-1252 when more than 1 % of the characters came out as U+FFFD; BOM stripped. Pure. */
export function decodeText(bytes: Uint8Array): string {
  const utf8 = new TextDecoder("utf-8").decode(bytes);
  const bad = (utf8.match(/\uFFFD/g) ?? []).length;
  const text = utf8.length > 0 && bad / utf8.length > 0.01 ? new TextDecoder("windows-1252").decode(bytes) : utf8;
  return text.replace(/^\uFEFF/, "");
}
