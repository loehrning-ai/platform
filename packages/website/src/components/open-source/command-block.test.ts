import { describe, expect, it } from "vitest";
import { commandGroups, commandLines } from "./command-block";

describe("commandLines", () => {
  it("puts each top-level step on its own line and keeps the exact command", () => {
    const command = "git clone https://x.test/a.git && cd a && npm install";
    const lines = commandLines(command);
    expect(lines).toEqual(["git clone https://x.test/a.git &&", "cd a &&", "npm install"]);
    expect(lines.join(" ")).toBe(command);
  });

  it("keeps a subshell together as one step", () => {
    expect(commandLines("(cd a && python3 -m venv .venv)")).toEqual([
      "(cd a && python3 -m venv .venv)",
    ]);
  });

  it("keeps a flag with its value and && with the token before it", () => {
    expect(
      commandGroups(".venv/bin/python -m pip install --require-hashes -r requirements.lock &&"),
    ).toEqual([
      [".venv/bin/python"],
      ["-m", "pip"],
      ["install"],
      ["--require-hashes"],
      ["-r", "requirements.lock", "&&"],
    ]);
  });
});
