import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Paginated reads of one account-owned table for the DSGVO data export.
 *
 * Every table in the export is read the same way: filtered to the verified
 * owner, ordered by a deterministic total order so pages cannot overlap or
 * skip rows, and checked against the exact row count the server reports. The
 * checks below exist so a partial read can never be presented as "you have no
 * data here" - the caller either receives every row or an error it must mark
 * in the exported document.
 */

export const EXPORT_PAGE_SIZE = 1_000;

/** One exported table plus the ordering and reporting metadata it needs. */
export interface OwnedRowsSource {
  /** PostgREST table name. */
  readonly table: string;
  /**
   * Deterministic total order, most significant column first. The final
   * column must be unique per row (the primary key), otherwise equal-valued
   * rows can move between pages while the export streams.
   */
  readonly orderColumns: readonly string[];
  /** Stable `reportApiError` step name for failures on this table. */
  readonly reportStep: string;
}

export interface OwnedRowsPage {
  readonly rows: readonly Record<string, unknown>[];
  readonly expectedCount: number;
}

export async function fetchOwnedRowsPage(
  client: SupabaseClient,
  source: OwnedRowsSource,
  userId: string,
  from: number,
  expectedCount: number | null,
): Promise<OwnedRowsPage> {
  let query = client
    .from(source.table)
    .select("*", { count: "exact" })
    .eq("user_id", userId);
  for (const column of source.orderColumns) {
    query = query.order(column, { ascending: true });
  }
  const { data, error, count } = await query.range(
    from,
    from + EXPORT_PAGE_SIZE - 1,
  );

  if (error) throw error;
  if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) {
    throw new Error(`Invalid ${source.table} export count`);
  }
  if (expectedCount !== null && count !== expectedCount) {
    throw new Error(`Changed ${source.table} export count`);
  }

  const rows = data ?? [];
  if (
    !Array.isArray(rows) ||
    rows.some((row) => typeof row !== "object" || row === null)
  ) {
    throw new Error(`Invalid ${source.table} export page`);
  }
  if (rows.length > EXPORT_PAGE_SIZE || from + rows.length > count) {
    throw new Error(`Oversized ${source.table} export page`);
  }
  if (rows.length === 0 && from < count) {
    throw new Error(`Incomplete ${source.table} export`);
  }

  return {
    rows: rows as Record<string, unknown>[],
    expectedCount: count,
  };
}

/**
 * Serialized JSON array members for one owned table, one row at a time.
 *
 * The generator never buffers the whole table: Vercel caps a buffered
 * response at 4.5 MB, and a learner with a long history exceeds that. A
 * failure part-way through throws, and the caller closes the array and marks
 * the section rather than pretending the rows it did not reach do not exist.
 */
export async function* streamOwnedRowFragments(
  client: SupabaseClient,
  source: OwnedRowsSource,
  userId: string,
  firstPage: OwnedRowsPage,
): AsyncGenerator<string, void, undefined> {
  let offset = 0;
  let page = firstPage;
  let wroteRow = false;

  while (offset < page.expectedCount) {
    for (const row of page.rows) {
      const serialized = JSON.stringify(row);
      if (serialized === undefined) {
        throw new Error(`Invalid ${source.table} export row`);
      }
      yield `${wroteRow ? "," : ""}\n    ${serialized}`;
      wroteRow = true;
    }

    offset += page.rows.length;
    if (offset < page.expectedCount) {
      page = await fetchOwnedRowsPage(
        client,
        source,
        userId,
        offset,
        page.expectedCount,
      );
    }
  }
}
