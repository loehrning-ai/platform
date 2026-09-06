import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PRE_DELETE_STEPS,
  runPreDeleteSteps,
  type PreDeleteContext,
  type PreDeleteStep,
} from "./pre-delete";

/**
 * The pre-delete registry is the only safe window for work that must touch
 * account-owned data while the account still exists. These tests pin the two
 * properties the delete route depends on: registered steps run in order, and
 * the first failure stops the run so the route can refuse to delete anything.
 */

const context: PreDeleteContext = {
  adminClient: { id: "admin-client" } as unknown as SupabaseClient,
  userId: "user-1",
};

function step(
  name: string,
  run: (calls: string[]) => void | Promise<void>,
  calls: string[],
): PreDeleteStep {
  return {
    name,
    run: vi.fn(async () => {
      await run(calls);
    }),
  };
}

describe("runPreDeleteSteps", () => {
  it("runs registered steps in order and reports each completed name", async () => {
    const calls: string[] = [];
    const steps = [
      step("detach-first", (log) => void log.push("detach-first"), calls),
      step("detach-second", (log) => void log.push("detach-second"), calls),
    ];

    const result = await runPreDeleteSteps(context, steps);

    expect(result).toEqual({
      ok: true,
      completedSteps: ["detach-first", "detach-second"],
    });
    expect(calls).toEqual(["detach-first", "detach-second"]);
    expect(steps[0].run).toHaveBeenCalledWith(context);
    expect(steps[1].run).toHaveBeenCalledWith(context);
  });

  it("stops at the first failure and never runs a later step", async () => {
    const calls: string[] = [];
    const failure = new Error("artefact detach rejected");
    const steps = [
      step("detach-first", (log) => void log.push("detach-first"), calls),
      step(
        "detach-second",
        () => {
          throw failure;
        },
        calls,
      ),
      step("detach-third", (log) => void log.push("detach-third"), calls),
    ];

    const result = await runPreDeleteSteps(context, steps);

    expect(result).toEqual({
      ok: false,
      failedStep: "detach-second",
      completedSteps: ["detach-first"],
      error: failure,
    });
    expect(calls).toEqual(["detach-first"]);
    expect(steps[2].run).not.toHaveBeenCalled();
  });

  it("resolves instead of rejecting so the route can answer a named error", async () => {
    const rejection = { code: "PGRST202" };
    const steps: readonly PreDeleteStep[] = [
      { name: "detach", run: async () => Promise.reject(rejection) },
    ];

    await expect(runPreDeleteSteps(context, steps)).resolves.toEqual({
      ok: false,
      failedStep: "detach",
      completedSteps: [],
      error: rejection,
    });
  });

  it("succeeds with an empty registry without touching the admin client", async () => {
    const adminClient = new Proxy(
      {},
      {
        get() {
          throw new Error("empty registry must not touch the admin client");
        },
      },
    ) as unknown as SupabaseClient;

    await expect(
      runPreDeleteSteps({ adminClient, userId: "user-1" }, []),
    ).resolves.toEqual({ ok: true, completedSteps: [] });
  });

  it("keeps every registered step uniquely named so a failure is greppable", () => {
    const names = PRE_DELETE_STEPS.map((registered) => registered.name);

    expect(new Set(names).size).toBe(names.length);
    expect(names.every((name) => /^[a-z0-9-]{3,60}$/.test(name))).toBe(true);
  });
});
