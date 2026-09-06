import { lessonUri, parseResourceUri } from "@/lib/mcp/uris";
import type { ChatLessonContext } from "./chat-panel";

/**
 * Reading context carried in from a lesson page.
 *
 * The `lektion` query parameter is caller-controlled, so it is accepted only
 * as a `lesson://` address that the shared resource parser validates and that
 * this function then rebuilds in canonical form: a scheme it does not know, an extra segment, an unsupported
 * locale, or a segment that is not a slug is refused here rather than sent to
 * the chat route to be refused there. A repeated parameter (Next hands the
 * page a string array) is refused as well, because silently taking one of the
 * values would attach a context the learner did not choose.
 *
 * A bad address is a bad link, never a page failure: the chat still renders,
 * just without a chip.
 */
export function readLessonContext(value: unknown): ChatLessonContext | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) {
    return null;
  }
  try {
    const parsed = parseResourceUri(value);
    if (parsed.kind !== "lesson") return null;
    // Rebuilt, not echoed: the chat route interpolates this address into the
    // system prompt, and the parser deliberately ignores anything the caller
    // wrote beyond the parts it validates.
    return {
      uri: lessonUri(parsed.course, parsed.lessonId, parsed.locale),
      label: `${parsed.course} · ${parsed.lessonId}`,
    };
  } catch {
    return null;
  }
}
