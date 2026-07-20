# Media Publication Policy

No hosted video collection is part of the repository yet. This policy is the admission contract for future video and audio material. A media item must not enter a public registry, route, release, or remote storage location until every requirement below has evidence.

## Required publication record

Record all of the following in the typed video publication metadata in the same
change as the media item. The registry validator rejects an omitted or blank
field:

- a stable repository-relative identifier and the route or lesson that owns it;
- title, language, duration, exact per-file MIME type, and exact byte size;
- named owner and maintainer;
- original source, source version or commit, creation method, and modification history;
- license identifier, attribution text, and explicit redistribution terms;
- lowercase SHA-256 hashes and exact `sizeBytes` values for the media file, caption file, transcript source, and poster image;
- storage location, retention owner, replacement procedure, and availability expectations;
- caption language, transcript language, poster alternative text, and the date of the accessibility review.

Do not infer ownership, provenance, licensing, or redistribution rights from a filename, repository location, or public URL. Do not publish an item while any field is unknown.

## Required files

Every video must have:

- a self-hosted browser-delivery file in MP4 (`video/mp4`), WebM (`video/webm`), or Ogg (`video/ogg`) format; MOV, M4V, and other containers are rejected by the registry;
- reviewed, synchronized WebVTT captions in the spoken language;
- a complete readable transcript in inert Markdown (`.md`, `text/markdown`) or plain text (`.txt`, `text/plain`) with speaker identification and meaningful non-speech information; HTML transcripts are rejected;
- a dedicated JPEG, PNG, or WebP poster image with useful alternative text;
- a source and license record that covers the video, audio, music, fonts, images, code, and other incorporated material;
- a SHA-256 and byte-size record for every stored file.

Machine-generated captions or transcripts are drafts. A human must review names, technical terms, timing, reading order, and non-speech cues before publication. Captions and transcripts must be updated in the same change when media content changes.

## Storage and privacy

The current implementation admits only repository-local first-party media below `packages/website/public/media/`. Its typed registry requires local public URLs, its asset verifier reads stored repository bytes, and its player assumes direct same-origin files. This is the only supported media-delivery choice today. Large files still require an explicit storage review before they are committed because repository history is not a media distribution system.

Remote media is a future architecture change, not a registry option. It requires a deliberate schema change, explicit remote-asset integrity and availability verification, exact Content Security Policy changes, privacy and transfer review, consent behavior where applicable, player failure handling, and new automated plus manual browser coverage. Do not place a remote URL into the current local-file fields or bypass the asset verifier.

A remote media origin requires documented review of ownership, redistribution, retention, caching, privacy, cookies, request metadata, regional transfer behavior, and failure behavior. Do not place credentials, signed private URLs, access tokens, personal data, or provider project identifiers in source files, registries, transcripts, captions, posters, or public URLs.

No player may contact a third party before the required privacy or consent decision. A remote provider must not be treated as essential for reading the associated lesson: the transcript remains usable when media loading fails.

## Browser security

Do not add a remote origin or weaken Content Security Policy without human security review. Any approved change must:

- name the exact HTTPS origin and the exact directives it requires;
- keep `default-src` restrictive and avoid wildcard origins;
- limit changes to the minimum of `media-src`, `img-src`, `connect-src`, `frame-src`, or `script-src` actually required;
- document redirects, embedded frames, scripts, telemetry, cookies, and fallback behavior;
- add automated header coverage and browser proof for the affected routes.

Do not use `unsafe-inline`, `unsafe-eval`, `data:`, or `blob:` as a convenience exception. Each scheme or execution exception requires separate, documented review. Never render caption or transcript text as untrusted HTML.

## Accessibility gate

Verify the real player at desktop and mobile widths with keyboard-only input and at least one screen reader. Confirm:

- every control has an accessible name and visible focus state;
- play, pause, seek, volume, mute, captions, playback speed, and fullscreen work without a pointer;
- captions can be enabled and remain legible over all frames;
- the transcript is reachable, structured, selectable, and usable without loading the player;
- focus order is stable and dialogs or fullscreen controls return focus correctly;
- autoplay with sound is disabled, motion can be paused, and reduced-motion preferences are respected;
- poster text, controls, captions, and focus indicators meet the platform contrast contract;
- loading failure produces a readable fallback instead of an empty region.

## Admission workflow

1. Place only reviewed source files in an approved repository path or document the reviewed immutable remote location.
2. Generate a candidate manifest entry with `bun run asset:record -- <path> --owner <value> --source <value> --license <value> --redistribution <value>` for every stored file.
3. Review the printed JSON and add it to `ASSET_MANIFEST.json` manually. Keep its `sha256` and `sizeBytes` unchanged; the typed video registry must repeat both values. The helper is read-only and never writes the manifest.
4. Register the media item through the platform's typed public-content registry. Do not create a second ad hoc catalog.
5. Run `bun run verify`, the affected browser suites, and the manual accessibility gate above.
6. Re-run the same process whenever a byte, caption, transcript, poster, origin, player dependency, or security header changes.
