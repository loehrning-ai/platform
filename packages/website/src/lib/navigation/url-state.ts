export const URL_STATE_CHANGE_EVENT = "loehrning:url-state-change";

/** Notify shared chrome after code changes query or hash state without navigation. */
export function notifyUrlStateChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(URL_STATE_CHANGE_EVENT));
}
