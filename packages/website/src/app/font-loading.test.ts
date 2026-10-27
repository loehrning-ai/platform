import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("font licence", () => {
  it("ships the Figtree licence next to the runtime faces", () => {
    const licence = readFileSync(
      resolve(process.cwd(), "public/fonts/figtree-OFL.txt"),
      "utf8",
    );

    expect(licence).toContain("The Figtree Project Authors");
    expect(licence).toContain("SIL OPEN FONT LICENSE Version 1.1");
  });
});
