import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
// The recorder's own digest, so the test and the script can never disagree.
import { skillDigest } from "../../../../scripts/demos/record-claude-run.mjs";
import { CLAUDE_SCENES } from "./claude-scenes";
import { modelName, modelShortName, promptsFor, recordedOn, RECORDING_FORBIDDEN, takesFor, validateRecording, type ClaudeRecording } from "./claude-runs";
import { DEMO_SLUGS } from "./demos";
import { readZipEntry } from "./zip/read";

const WEBSITE = join(__dirname, "../..");
const sha = (bytes: Uint8Array | Buffer) => createHash("sha256").update(bytes).digest("hex");

function runsDir(slug: string) {
  return join(WEBSITE, "src/lib/demo-cases", slug, "claude-runs");
}

describe("recorded Claude runs (claude-desktop-spec 12: real runs only)", () => {
  it("gives every demo a SCENE export, null until a run is recorded", () => {
    expect(Object.keys(CLAUDE_SCENES).sort()).toEqual([...DEMO_SLUGS].sort());
    expect(CLAUDE_SCENES["ki-prognosen-einschaetzen"]?.recordings.length).toBeGreaterThan(0);
  });

  for (const slug of DEMO_SLUGS) {
    const scene = CLAUDE_SCENES[slug];
    if (!scene) continue;

    describe(slug, () => {
      it("lists every stored take and only stored takes", () => {
        const stored = readdirSync(runsDir(slug)).filter((name) => name.endsWith(".json")).map((name) => name.replace(/\.json$/, ""));
        expect(scene.recordings.map((recording) => recording.id).sort()).toEqual(stored.sort());
        for (const prompt of scene.prompts) {
          for (const id of [...prompt.withSkill, ...prompt.withoutSkill]) expect(stored, `${prompt.id}: ${id}`).toContain(id);
          const rejected = existsSync(join(runsDir(slug), "rejected"))
            ? readdirSync(join(runsDir(slug), "rejected")).filter((name) => name.startsWith(`${prompt.locale}-${prompt.id}-`) && name.endsWith(".json")).length
            : 0;
          expect(prompt.rejected ?? 0, `${prompt.id}: takes set aside`).toBe(rejected);
        }
      });

      for (const recording of scene.recordings) {
        it(`${recording.id}: is a clean, unedited run with the shipped kit and skill`, () => {
          expect(validateRecording(recording)).toEqual([]);
          expect(recording.slug).toBe(slug);
          // The kit files are byte for byte the ones in the shipped zip.
          const zip = new Uint8Array(readFileSync(join(WEBSITE, recording.kit_zip)));
          for (const file of recording.kit_files) {
            const bytes = readZipEntry(zip, file.path);
            expect(bytes, file.path).not.toBeNull();
            expect(sha(bytes as Uint8Array), `${file.name} changed since the recording: record a new take`).toBe(file.sha256);
          }
          // The skill is the one visitors download.
          if (recording.skill) {
            expect(skillDigest(join(WEBSITE, "content/skills", recording.skill.name)), "the skill changed since the recording: record a new take").toBe(recording.skill.sha256);
          }
          // Produced files are stored next to the take, with the same bytes and text.
          for (const file of recording.produced_files) {
            const stored = readFileSync(join(runsDir(slug), file.stored_as));
            expect(sha(stored)).toBe(file.sha256);
            if (file.text !== undefined) expect(file.text).toBe(stored.toString("utf8"));
          }
        });
      }
    });
  }

  it("counts only failed takes as set aside: each names its failure, a replaced take names why it was replaced", () => {
    for (const slug of DEMO_SLUGS) {
      const rejected = join(runsDir(slug), "rejected");
      if (existsSync(rejected)) {
        for (const name of readdirSync(rejected).filter((entry) => entry.endsWith(".json"))) {
          const take = JSON.parse(readFileSync(join(rejected, name), "utf8")) as { rejected?: readonly string[] | null };
          expect(take.rejected?.length ?? 0, `${slug}/rejected/${name} names its failure`).toBeGreaterThan(0);
        }
      }
      const replaced = join(runsDir(slug), "replaced");
      if (existsSync(replaced)) {
        const reasons = JSON.parse(readFileSync(join(replaced, "reasons.json"), "utf8")) as Record<string, string>;
        const takes = readdirSync(replaced).filter((entry) => entry.endsWith(".json") && entry !== "reasons.json");
        expect(Object.keys(reasons).sort()).toEqual(takes.map((entry) => entry.replace(/\.json$/, "")).sort());
        for (const name of takes) {
          const take = JSON.parse(readFileSync(join(replaced, name), "utf8")) as { rejected?: readonly string[] | null };
          expect(take.rejected ?? [], `${slug}/replaced/${name} did not fail`).toEqual([]);
          expect(reasons[name.replace(/\.json$/, "")]?.length ?? 0).toBeGreaterThan(20);
        }
      }
    }
  });

  it("keeps machine paths and session secrets out of every take, rejected ones included", () => {
    for (const slug of DEMO_SLUGS) {
      for (const folder of [runsDir(slug), join(runsDir(slug), "rejected"), join(runsDir(slug), "replaced")]) {
        if (!existsSync(folder)) continue;
        for (const name of readdirSync(folder).filter((entry) => !entry.endsWith(".ts") && entry !== "rejected" && entry !== "replaced")) {
          expect(RECORDING_FORBIDDEN.test(readFileSync(join(folder, name), "utf8")), `${slug}/${name}`).toBe(false);
        }
      }
    }
  });
});

describe("recording labels", () => {
  it("names the model from its id and prints the recording date in UTC", () => {
    expect(modelName("claude-opus-5-5")).toBe("Claude Opus 5.5");
    expect(modelShortName("claude-opus-5-5")).toBe("Opus 5.5");
    expect(modelName("something-else")).toBe("something-else");
    expect(recordedOn("2026-10-26T23:45:53Z", "de")).toBe("26.10.2026");
    expect(recordedOn("2026-10-26T13:45:53Z", "en")).toBe("26 October 2026");
  });

  it("shows the other language's takes with a note, never a translation", () => {
    const scene = CLAUDE_SCENES["ki-prognosen-einschaetzen"];
    if (!scene) throw new Error("W01 has a scene");
    expect(promptsFor(scene, "de").foreign).toBe(false);
    expect(promptsFor(scene, "en").foreign).toBe(false);
    const germanOnly = { ...scene, prompts: scene.prompts.filter((item) => item.locale === "de") };
    expect(promptsFor(germanOnly, "en")).toMatchObject({ foreign: true, prompts: germanOnly.prompts });
    const prompt = scene.prompts[0];
    if (!prompt) throw new Error("W01 has a prompt");
    expect(takesFor(scene, prompt, true).map((take: ClaudeRecording) => take.id)).toEqual(prompt.withSkill);
  });
});
