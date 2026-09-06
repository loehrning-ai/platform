import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  CV_ENGINE_DOCUMENTS_TABLE,
  CV_ENGINE_DOCUMENT_PAGE_SIZE,
  readFirstCvEngineDocumentPage,
  streamCvEngineDocumentRows,
} from "./documents";

type RangeAnswer = {
  readonly data: unknown;
  readonly error?: unknown;
  readonly count?: unknown;
};

/**
 * Minimal stand-in for the PostgREST builder chain the reader uses. It records
 * the filters it was given so a test can prove the owner constraint is applied
 * in the query itself, not only by the row level security policy behind it.
 */
function documentsClient(
  answer: (from: number, to: number) => RangeAnswer | Promise<RangeAnswer>,
) {
  const calls = {
    tables: [] as string[],
    selects: [] as { columns: string; options: unknown }[],
    filters: [] as { column: string; value: unknown }[],
    orders: [] as { column: string; options: unknown }[],
    ranges: [] as { from: number; to: number }[],
  };
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn((columns: string, options: unknown) => {
    calls.selects.push({ columns, options });
    return builder;
  });
  builder.eq = vi.fn((column: string, value: unknown) => {
    calls.filters.push({ column, value });
    return builder;
  });
  builder.order = vi.fn((column: string, options: unknown) => {
    calls.orders.push({ column, options });
    return builder;
  });
  builder.range = vi.fn(async (from: number, to: number) => {
    calls.ranges.push({ from, to });
    const result = await answer(from, to);
    return { error: null, count: null, ...result };
  });
  const from = vi.fn((table: string) => {
    calls.tables.push(table);
    return builder;
  });
  return { client: { from } as unknown as SupabaseClient, calls };
}

function documentRow(index: number) {
  return {
    id: `00000000-0000-4000-8000-00000000000${index}`,
    owner_id: "user-1",
    type: "cv",
    name: `Lebenslauf ${index}`,
    yaml_blob: `name: Lernende Person ${index}\n`,
    deleted_at: null,
  };
}

async function collect(
  generator: AsyncGenerator<Record<string, unknown>, void, undefined>,
) {
  const rows: Record<string, unknown>[] = [];
  for await (const row of generator) rows.push(row);
  return rows;
}

describe("readFirstCvEngineDocumentPage", () => {
  it("reads the owner's documents from the resume tool's table", async () => {
    const rows = [documentRow(1), documentRow(2)];
    const { client, calls } = documentsClient(() => ({
      data: rows,
      count: rows.length,
    }));

    const head = await readFirstCvEngineDocumentPage(client, "user-1");

    expect(head).toEqual({
      status: "ready",
      firstPage: { rows, expectedCount: 2 },
    });
    expect(calls.tables).toEqual([CV_ENGINE_DOCUMENTS_TABLE]);
    expect(calls.selects).toEqual([
      { columns: "*", options: { count: "exact" } },
    ]);
    expect(calls.filters).toEqual([{ column: "owner_id", value: "user-1" }]);
    expect(calls.orders.map((order) => order.column)).toEqual([
      "created_at",
      "id",
    ]);
    expect(calls.ranges).toEqual([
      { from: 0, to: CV_ENGINE_DOCUMENT_PAGE_SIZE - 1 },
    ]);
  });

  it("reports an empty store as ready with no rows", async () => {
    const { client } = documentsClient(() => ({ data: [], count: 0 }));

    await expect(
      readFirstCvEngineDocumentPage(client, "user-1"),
    ).resolves.toEqual({
      status: "ready",
      firstPage: { rows: [], expectedCount: 0 },
    });
  });

  it.each([
    ["PostgREST relation cache miss", "PGRST205"],
    ["Postgres undefined_table", "42P01"],
  ])("reports %s as a store that is not provisioned", async (_label, code) => {
    const { client } = documentsClient(() => ({
      data: null,
      error: { code, message: "Could not find the table" },
    }));

    await expect(
      readFirstCvEngineDocumentPage(client, "user-1"),
    ).resolves.toEqual({ status: "not-provisioned" });
  });

  it("fails loudly when the store exists and the read is denied", async () => {
    const { client } = documentsClient(() => ({
      data: null,
      error: { code: "42501", message: "permission denied for table documents" },
    }));

    const head = await readFirstCvEngineDocumentPage(client, "user-1");

    expect(head.status).toBe("failed");
    if (head.status !== "failed") return;
    expect(head.error.name).toBe("CvEngineDocumentReadError");
  });

  it("keeps a PostgREST code for observability", async () => {
    const { client } = documentsClient(() => ({
      data: null,
      error: { code: "PGRST301", message: "JWT expired" },
    }));

    await expect(
      readFirstCvEngineDocumentPage(client, "user-1"),
    ).resolves.toMatchObject({ status: "failed", providerCode: "PGRST301" });
  });

  it.each([
    ["a missing count", { data: [], count: null }],
    ["a negative count", { data: [], count: -1 }],
    ["a page longer than its count", { data: [documentRow(1)], count: 0 }],
    ["a row that is not an object", { data: ["not a row"], count: 1 }],
    ["an empty page while rows remain", { data: [], count: 3 }],
  ])("fails on %s", async (_label, answer) => {
    const { client } = documentsClient(() => answer);

    const head = await readFirstCvEngineDocumentPage(client, "user-1");

    expect(head.status).toBe("failed");
    if (head.status !== "failed") return;
    expect(head.error.name).toBe("CvEngineDocumentReadError");
  });

  it("fails when the read rejects outright", async () => {
    const { client } = documentsClient(() => {
      throw new Error("socket hang up");
    });

    const head = await readFirstCvEngineDocumentPage(client, "user-1");

    expect(head.status).toBe("failed");
    if (head.status !== "failed") return;
    expect(head.error.cause).toBeInstanceOf(Error);
  });
});

describe("streamCvEngineDocumentRows", () => {
  it("yields the first page without asking for another when it is complete", async () => {
    const rows = [documentRow(1)];
    const { client, calls } = documentsClient(() => ({
      data: rows,
      count: rows.length,
    }));

    const yielded = await collect(
      streamCvEngineDocumentRows(client, "user-1", {
        rows,
        expectedCount: rows.length,
      }),
    );

    expect(yielded).toEqual(rows);
    expect(calls.ranges).toEqual([]);
  });

  it("continues paging until every document is yielded", async () => {
    const all = Array.from({ length: 5 }, (_unused, index) =>
      documentRow(index),
    );
    const pageSize = 2;
    const { client, calls } = documentsClient((from) => ({
      data: all.slice(from, from + pageSize),
      count: all.length,
    }));

    const yielded = await collect(
      streamCvEngineDocumentRows(client, "user-1", {
        rows: all.slice(0, pageSize),
        expectedCount: all.length,
      }),
    );

    expect(yielded).toEqual(all);
    expect(calls.ranges.map((range) => range.from)).toEqual([2, 4]);
  });

  it("throws instead of truncating when the row count moves mid-export", async () => {
    const all = [documentRow(1), documentRow(2), documentRow(3)];
    const { client } = documentsClient((from) => ({
      data: all.slice(from, from + 1),
      count: all.length + 1,
    }));

    await expect(
      collect(
        streamCvEngineDocumentRows(client, "user-1", {
          rows: all.slice(0, 1),
          expectedCount: all.length,
        }),
      ),
    ).rejects.toThrow(/row count changed/);
  });
});
