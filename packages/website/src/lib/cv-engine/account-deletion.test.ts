import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  CV_ENGINE_DETACH_RPC,
  CV_ENGINE_SCHEMA_CONTRACT_RPC,
  detachCvEngineAccountArtifacts,
  probeCvEngineSchema,
} from "./account-deletion";

type RpcResult = { data: unknown; error: unknown };

function rpcClient(
  handler: (name: string, args?: unknown) => RpcResult | Promise<RpcResult>,
) {
  const rpc = vi.fn(async (name: string, args?: unknown) =>
    handler(name, args),
  );
  return {
    client: { rpc } as unknown as SupabaseClient,
    rpc,
  };
}

/** The probe answers `returns table`, so PostgREST hands back an array. */
function contractRow(executeOk: unknown): RpcResult {
  return {
    data: [
      {
        contract_id: "onepager-20260801170000-v1",
        contract_version: 1,
        worker_contract_version: 2,
        worker_contract_ok: true,
        authenticated_rpc_execute_ok: executeOk,
        evidence_backed_job_status_ok: true,
        compatible: true,
      },
    ],
    error: null,
  };
}

const ABSENT_FUNCTION = {
  code: "PGRST202",
  message: "Could not find the function in the schema cache",
};

function detachEvidence(status: string, artifacts: readonly unknown[] = []) {
  return {
    data: {
      status,
      requested_at: "2026-09-05T10:00:00.000Z",
      artifacts,
      invalid_artifact_count: 0,
    },
    error: null,
  };
}

describe("probeCvEngineSchema", () => {
  it("reports absence when the compatibility probe does not exist", async () => {
    const { client, rpc } = rpcClient(() => ({
      data: null,
      error: ABSENT_FUNCTION,
    }));

    await expect(probeCvEngineSchema(client)).resolves.toEqual({
      status: "absent",
    });
    expect(rpc).toHaveBeenCalledWith(CV_ENGINE_SCHEMA_CONTRACT_RPC);
  });

  it("reports availability when the transition is callable by the learner", async () => {
    const { client } = rpcClient(() => contractRow(true));

    await expect(probeCvEngineSchema(client)).resolves.toEqual({
      status: "available",
    });
  });

  it("fails, rather than skipping, when the schema is present without the transition", async () => {
    const { client } = rpcClient(() => contractRow(false));
    const result = await probeCvEngineSchema(client);

    expect(result.status).toBe("failed");
    if (result.status !== "failed") return;
    expect(result.error.name).toBe("CvEngineDetachUnavailableError");
  });

  it.each([
    ["an empty result", { data: [], error: null }],
    ["a scalar result", { data: "compatible", error: null }],
    ["a missing contract field", { data: [{ compatible: true }], error: null }],
  ])("fails on %s", async (_label, response) => {
    const { client } = rpcClient(() => response);
    const result = await probeCvEngineSchema(client);

    expect(result.status).toBe("failed");
    if (result.status !== "failed") return;
    expect(result.error.name).toBe("CvEngineSchemaProbeError");
  });

  it("keeps a PostgREST code for observability and rejects other codes", async () => {
    const denied = await probeCvEngineSchema(
      rpcClient(() => ({
        data: null,
        error: { code: "PGRST301", message: "JWT expired" },
      })).client,
    );
    expect(denied).toMatchObject({
      status: "failed",
      providerCode: "PGRST301",
    });

    const databaseCode = await probeCvEngineSchema(
      rpcClient(() => ({
        data: null,
        error: { code: "42501", message: "permission denied" },
      })).client,
    );
    expect(databaseCode.status).toBe("failed");
    expect(databaseCode).not.toHaveProperty("providerCode");
  });

  it("fails when the probe call rejects outright", async () => {
    const { client } = rpcClient(() => {
      throw new Error("connection reset");
    });
    const result = await probeCvEngineSchema(client);

    expect(result.status).toBe("failed");
    if (result.status !== "failed") return;
    expect(result.error.name).toBe("CvEngineSchemaProbeError");
    expect(result.error.cause).toBeInstanceOf(Error);
  });
});

describe("detachCvEngineAccountArtifacts", () => {
  it("skips cleanly and never calls the transition when the schema is absent", async () => {
    const service = rpcClient(() => ({ data: null, error: ABSENT_FUNCTION }));
    const owner = rpcClient(() => detachEvidence("requested"));

    await expect(
      detachCvEngineAccountArtifacts({
        serviceClient: service.client,
        ownerClient: owner.client,
      }),
    ).resolves.toEqual({ status: "not-provisioned" });
    expect(owner.rpc).not.toHaveBeenCalled();
  });

  it("runs the transition with the learner's own client and reports the queued artefacts", async () => {
    const service = rpcClient(() => contractRow(true));
    const owner = rpcClient(() =>
      detachEvidence("requested", [{ cleanup_id: "a" }, { cleanup_id: "b" }]),
    );

    await expect(
      detachCvEngineAccountArtifacts({
        serviceClient: service.client,
        ownerClient: owner.client,
      }),
    ).resolves.toEqual({
      status: "detached",
      requestedAt: "2026-09-05T10:00:00.000Z",
      artifactCount: 2,
      alreadyRequested: false,
    });
    expect(owner.rpc).toHaveBeenCalledWith(CV_ENGINE_DETACH_RPC, {});
    // The transition derives its owner from auth.uid(): the privileged client
    // has no session and must never be the one that calls it.
    expect(service.rpc).not.toHaveBeenCalledWith(CV_ENGINE_DETACH_RPC, {});
  });

  it("accepts an account whose deletion was already requested", async () => {
    const service = rpcClient(() => contractRow(true));
    const owner = rpcClient(() => detachEvidence("already_requested"));

    await expect(
      detachCvEngineAccountArtifacts({
        serviceClient: service.client,
        ownerClient: owner.client,
      }),
    ).resolves.toEqual({
      status: "detached",
      requestedAt: "2026-09-05T10:00:00.000Z",
      artifactCount: 0,
      alreadyRequested: true,
    });
  });

  it("accepts a PostgREST array envelope around the evidence", async () => {
    const service = rpcClient(() => contractRow(true));
    const owner = rpcClient(() => {
      const single = detachEvidence("requested", [{ cleanup_id: "a" }]);
      return { data: [single.data], error: null };
    });

    const result = await detachCvEngineAccountArtifacts({
      serviceClient: service.client,
      ownerClient: owner.client,
    });

    expect(result).toMatchObject({ status: "detached", artifactCount: 1 });
  });

  it("fails when the present transition refuses", async () => {
    const service = rpcClient(() => contractRow(true));
    const owner = rpcClient(() => ({
      data: null,
      error: { code: "55000", message: "account deletion is already being processed" },
    }));

    const result = await detachCvEngineAccountArtifacts({
      serviceClient: service.client,
      ownerClient: owner.client,
    });

    expect(result.status).toBe("failed");
    if (result.status !== "failed") return;
    expect(result.error.name).toBe("CvEngineDetachFailedError");
  });

  it("fails when the transition call rejects", async () => {
    const service = rpcClient(() => contractRow(true));
    const owner = rpcClient(() => {
      throw new Error("socket hang up");
    });

    const result = await detachCvEngineAccountArtifacts({
      serviceClient: service.client,
      ownerClient: owner.client,
    });

    expect(result.status).toBe("failed");
    if (result.status !== "failed") return;
    expect(result.error.name).toBe("CvEngineDetachFailedError");
  });

  it.each([
    ["an unknown status", { status: "denied", artifacts: [] }],
    ["a missing status", { requested_at: "2026-09-05T10:00:00.000Z" }],
    ["artefacts that are not a list", { status: "requested", artifacts: 3 }],
    ["a scalar answer", "requested"],
    ["no answer at all", null],
  ])("fails on %s", async (_label, data) => {
    const service = rpcClient(() => contractRow(true));
    const owner = rpcClient(() => ({ data, error: null }));

    const result = await detachCvEngineAccountArtifacts({
      serviceClient: service.client,
      ownerClient: owner.client,
    });

    expect(result.status).toBe("failed");
    if (result.status !== "failed") return;
    expect(result.error.name).toBe("CvEngineDetachEvidenceError");
  });

  it("reports a missing timestamp as null rather than inventing one", async () => {
    const service = rpcClient(() => contractRow(true));
    const owner = rpcClient(() => ({
      data: { status: "requested", artifacts: [] },
      error: null,
    }));

    await expect(
      detachCvEngineAccountArtifacts({
        serviceClient: service.client,
        ownerClient: owner.client,
      }),
    ).resolves.toEqual({
      status: "detached",
      requestedAt: null,
      artifactCount: 0,
      alreadyRequested: false,
    });
  });
});
