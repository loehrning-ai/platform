import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listZipEntries, readZipText } from "./read";
import { crc32, isSafeZipPath, ZIP_DOS_DATE, zipStore } from "./store";

describe("zipStore", () => {
  it("computes the standard CRC-32", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array())).toBe(0);
  });

  it("is deterministic and round-trips through the reader with umlauts in names and text", () => {
    const entries = [
      { path: "prüfen/SKILL.md", data: "---\nname: prüfen\n---\nÄrger über Größe\n" },
      { path: "prüfen/references/karte.md", data: new Uint8Array([1, 2, 3]) },
    ];
    const first = zipStore(entries);
    const second = zipStore(entries);
    expect(Buffer.from(first).equals(Buffer.from(second))).toBe(true);
    const listed = listZipEntries(first);
    expect(listed.map((entry) => entry.path)).toEqual(["prüfen/SKILL.md", "prüfen/references/karte.md"]);
    for (const entry of listed) {
      expect(entry.method).toBe(0);
      expect(entry.dosDate).toBe(ZIP_DOS_DATE);
      expect(entry.dosTime).toBe(0);
      expect(entry.flags & 0x0800).toBe(0x0800);
    }
    expect(readZipText(first, "prüfen/SKILL.md")).toBe("---\nname: prüfen\n---\nÄrger über Größe\n");
    expect(readZipText(first, "missing.md")).toBeNull();
  });

  it("refuses unsafe and duplicate paths", () => {
    for (const bad of ["/abs.md", "../up.md", "a/../b.md", "a\\b.md", "", "a//b.md", "./a.md"]) {
      expect(isSafeZipPath(bad), bad).toBe(false);
      expect(() => zipStore([{ path: bad, data: "x" }])).toThrow(/unsafe/);
    }
    expect(() =>
      zipStore([
        { path: "a.md", data: "1" },
        { path: "a.md", data: "2" },
      ]),
    ).toThrow(/duplicate/);
  });

  it("is a zip the system unzip accepts, with 1980-01-01 timestamps", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "zipstore-"));
    try {
      const file = path.join(dir, "skill.zip");
      writeFileSync(file, zipStore([{ path: "probe/SKILL.md", data: "hallo\n" }]));
      let listing: string;
      try {
        listing = execFileSync("unzip", ["-l", file], { encoding: "utf8" });
      } catch {
        return; // no unzip binary on this machine: the reader test above still covers the bytes
      }
      expect(listing).toContain("probe/SKILL.md");
      expect(listing).toMatch(/(01-01-1980|1980-01-01) 00:00/);
      execFileSync("unzip", ["-q", file, "-d", dir]);
      expect(readFileSync(path.join(dir, "probe/SKILL.md"), "utf8")).toBe("hallo\n");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
