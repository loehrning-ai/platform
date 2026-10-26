import "server-only";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { GlasStage } from "@/components/demos/glas/feld";
import { feldFor } from "@/components/demos/glas/feld-math";
import { GlasRoot } from "@/components/demos/glas/glas-root";
import type { ClaudeSceneData } from "@/lib/claude-runs";
import { CLAUDE_SCENES } from "@/lib/claude-scenes";
import { getDemoBySlug, type DemoSlug } from "@/lib/demos";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { glasToneFor } from "@/lib/glas";
import type { Locale } from "@/lib/i18n/locale";
import { readZipEntry } from "@/lib/zip/read";
import { ClaudeDesktopScene } from "./claude-desktop-scene";
import type { SceneKitFile } from "./scene-types";

const TEXT_LIMIT = 256 * 1024;

/**
 * Every kit file the scene's takes attached, read from the shipped kit zip at
 * build time. Throws when a file is missing or its bytes differ from the
 * recording: then the take no longer matches the kit and must be re-recorded.
 */
export function sceneKitFiles(scene: ClaudeSceneData, root = process.cwd()): Readonly<Record<string, SceneKitFile>> {
  const files: Record<string, SceneKitFile> = {};
  const zips = new Map<string, Uint8Array>();
  for (const recording of scene.recordings) {
    if (!recording.kit_zip.startsWith("public/") || recording.kit_zip.split("/").includes("..")) throw new Error(`${recording.id}: kit_zip ${recording.kit_zip}`);
    let zip = zips.get(recording.kit_zip);
    if (!zip) {
      zip = new Uint8Array(readFileSync(path.join(root, recording.kit_zip)));
      zips.set(recording.kit_zip, zip);
    }
    for (const ref of recording.kit_files) {
      if (files[ref.name]) continue;
      const bytes = readZipEntry(zip, ref.path);
      if (!bytes) throw new Error(`${recording.id}: ${ref.path} is not in ${recording.kit_zip}`);
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      if (sha256 !== ref.sha256) throw new Error(`${recording.id}: ${ref.name} changed since the recording; record a new take`);
      let text: string | null = null;
      if (bytes.length <= TEXT_LIMIT) {
        try {
          text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        } catch {
          text = null;
        }
      }
      files[ref.name] = { name: ref.name, path: ref.path, bytes: bytes.length, text, sha256 };
    }
  }
  return files;
}

/**
 * "So sieht es in deinem Claude aus": the heading, one sentence, and the
 * Claude scene on the workshop's field. Renders nothing while the demo has no
 * recording. `standalone` gives it its own GlasRoot (for the v3 page).
 */
export function ClaudeSceneSection({ slug, locale, standalone = false }: { readonly slug: DemoSlug; readonly locale: Locale; readonly standalone?: boolean }) {
  const scene = CLAUDE_SCENES[slug];
  const demo = getDemoBySlug(slug);
  if (!scene || !demo || scene.recordings.length === 0) return null;
  const copy = DEMOS_PAGE_COPY[locale].claudeScene;
  const skillName = scene.recordings[0]?.skill_name ?? "";
  const body = (
    <section className="cds-section" aria-labelledby={`claude-scene-${slug}`} data-claude-scene-section="">
      <GlasStage feld={feldFor(demo.plakat, [{ x: 0.08, y: 0.1 }, { x: 0.95, y: 0.35 }, { x: 0.5, y: 1.02 }], 0.85)} tone={glasToneFor(demo.plakat)} className="cds-stage">
        <div className="cds-section-head">
          <h2 id={`claude-scene-${slug}`} className="cds-section-title">
            {copy.heading}
          </h2>
          <p className="cds-section-lead">{scene.prompts.some((prompt) => prompt.withoutSkill.length > 0) ? copy.lead : copy.leadSingle}</p>
        </div>
        <ClaudeDesktopScene scene={scene} locale={locale} skillName={skillName} kitFiles={sceneKitFiles(scene)} />
      </GlasStage>
    </section>
  );
  if (!standalone) return body;
  return (
    <GlasRoot tone={glasToneFor(demo.plakat)} className="cds-root" data-claude-scene-root="">
      {body}
    </GlasRoot>
  );
}
