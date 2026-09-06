/**
 * The learner's cv-engine documents, for the platform data export.
 *
 * A CV and a cover letter written in the resume tool are personal data held in
 * this project, so an Article 20 export that leaves them out is incomplete. The
 * rows are read with the learner's own session rather than the service role:
 * cv-engine's `documents_select_own` policy then decides what comes back, and a
 * mistake in this file cannot widen that to another account. `owner_id` is
 * still constrained explicitly, so the query is correct on its own terms and
 * not only because a policy happens to be enabled.
 *
 * Soft-deleted rows are included on purpose. cv-engine hides a document by
 * stamping `deleted_at` and keeps the content for the grace period, so it is
 * still the learner's data and still has to be handed over.
 *
 * Absence of the table means cv-engine's migrations were never replayed into
 * this project. That is reported as its own state rather than as an empty
 * result, because an empty array in an export file reads as "you had no
 * documents", which would be a false statement about a store that is not there.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { CvEngineDocumentReadError, postgrestErrorCode } from "./errors";
import { isMissingRelationError } from "./schema-presence";

export const CV_ENGINE_DOCUMENTS_TABLE = "documents";

/**
 * Documents carry a YAML body, so pages are kept smaller than the assessment
 * export's thousand-row pages. A learner has a handful of documents; the paging
 * exists for correctness under concurrent writes, not for volume.
 */
export const CV_ENGINE_DOCUMENT_PAGE_SIZE = 200;

export interface CvEngineDocumentPage {
  readonly rows: readonly Record<string, unknown>[];
  readonly expectedCount: number;
}

export type CvEngineDocumentsHead =
  | { readonly status: "not-provisioned" }
  | { readonly status: "ready"; readonly firstPage: CvEngineDocumentPage }
  | {
      readonly status: "failed";
      readonly error: Error;
      readonly providerCode?: string;
    };

/**
 * One page, with the same consistency guarantees the assessment export uses: an
 * exact count that may not move between pages, a bounded page that may not run
 * past that count, and a refusal to treat an unexpectedly empty page as the end
 * of the data.
 */
async function fetchCvEngineDocumentPage(
  client: SupabaseClient,
  ownerId: string,
  from: number,
  expectedCount: number | null,
): Promise<CvEngineDocumentPage> {
  const { data, error, count } = await client
    .from(CV_ENGINE_DOCUMENTS_TABLE)
    .select("*", { count: "exact" })
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .range(from, from + CV_ENGINE_DOCUMENT_PAGE_SIZE - 1);

  if (error) throw error;
  if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) {
    throw new CvEngineDocumentReadError("invalid row count");
  }
  if (expectedCount !== null && count !== expectedCount) {
    throw new CvEngineDocumentReadError("row count changed between pages");
  }

  const rows = data ?? [];
  if (
    !Array.isArray(rows) ||
    rows.some((row) => typeof row !== "object" || row === null)
  ) {
    throw new CvEngineDocumentReadError("invalid page");
  }
  if (rows.length > CV_ENGINE_DOCUMENT_PAGE_SIZE || from + rows.length > count) {
    throw new CvEngineDocumentReadError("oversized page");
  }
  if (rows.length === 0 && from < count) {
    throw new CvEngineDocumentReadError("incomplete page");
  }

  return {
    rows: rows as Record<string, unknown>[],
    expectedCount: count,
  };
}

/**
 * Reads the first page before the export response starts streaming, so that a
 * missing store, a denied read or an unreachable database is still an ordinary
 * status code rather than a truncated download.
 */
export async function readFirstCvEngineDocumentPage(
  client: SupabaseClient,
  ownerId: string,
): Promise<CvEngineDocumentsHead> {
  try {
    const firstPage = await fetchCvEngineDocumentPage(client, ownerId, 0, null);
    return { status: "ready", firstPage };
  } catch (error) {
    if (isMissingRelationError(error)) return { status: "not-provisioned" };
    const providerCode = postgrestErrorCode(error);
    return {
      status: "failed",
      error:
        error instanceof CvEngineDocumentReadError
          ? error
          : new CvEngineDocumentReadError("read rejected", error),
      ...(providerCode ? { providerCode } : {}),
    };
  }
}

/**
 * Yields every document row, continuing from the page already read. Throws on
 * any later failure; the export stream turns that into an explicit
 * `export_complete: false` document rather than a silently short file.
 */
export async function* streamCvEngineDocumentRows(
  client: SupabaseClient,
  ownerId: string,
  firstPage: CvEngineDocumentPage,
): AsyncGenerator<Record<string, unknown>, void, undefined> {
  let offset = 0;
  let page = firstPage;

  while (offset < page.expectedCount) {
    for (const row of page.rows) yield row;

    offset += page.rows.length;
    if (offset < page.expectedCount) {
      page = await fetchCvEngineDocumentPage(
        client,
        ownerId,
        offset,
        page.expectedCount,
      );
    }
  }
}
