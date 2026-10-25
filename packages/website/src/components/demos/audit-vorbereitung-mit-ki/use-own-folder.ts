"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GENERIC_ITEM_IDS, type ItemId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/classify";
import { isValidDate, windowStart } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/dates";
import { MAX_READ, MAX_TEXT_BYTES, TEXT_EXTENSIONS, assessFolder, type OwnEntry, type OwnResult } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/own-folder";
import { parseList } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/parse-list";
import { decodeText } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/text-decode";

/** Only the audit date and the window are remembered, never a file. */
const SETTINGS_KEY = "w05-audit-settings";

export const WINDOWS = [6, 12, 24] as const;
export type WindowMonths = (typeof WINDOWS)[number];

function readSettings(): { readonly audit: string; readonly months: WindowMonths } | null {
  try {
    const raw = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "null") as { audit?: unknown; months?: unknown } | null;
    if (!raw || typeof raw.audit !== "string" || !validIso(raw.audit)) return null;
    const months = WINDOWS.find((value) => value === raw.months) ?? 12;
    return { audit: raw.audit, months };
  } catch {
    return null;
  }
}

function writeSettings(audit: string, months: WindowMonths): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ audit, months }));
  } catch {
    // private mode or blocked storage: the setting simply is not remembered
  }
}

export function validIso(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  return year >= 2000 && year <= 2100 && isValidDate(year, Number(match[2]), Number(match[3]));
}

async function entryOf(file: File, readContent: boolean): Promise<OwnEntry> {
  const name = file.name;
  const base = { name, size: file.size, lastModified: file.lastModified, listedDate: null, yearMissing: false };
  if (!readContent || file.size > MAX_TEXT_BYTES) return { ...base, text: null };
  try {
    return { ...base, text: TEXT_EXTENSIONS.test(name) ? decodeText(new Uint8Array(await file.arrayBuffer())) : null };
  } catch {
    return { ...base, text: null };
  }
}

const readable = (name: string) => TEXT_EXTENSIONS.test(name);

export interface OwnFolder {
  readonly entries: readonly OwnEntry[];
  readonly unread: readonly number[];
  readonly audit: string;
  readonly months: WindowMonths;
  readonly dateError: boolean;
  readonly enabled: ReadonlySet<ItemId>;
  readonly windowFrom: string | null;
  readonly result: OwnResult | null;
  readonly addFiles: (files: readonly File[]) => Promise<void>;
  readonly addList: (text: string) => void;
  readonly setAudit: (value: string) => void;
  readonly setMonths: (value: WindowMonths) => void;
  readonly toggle: (id: ItemId) => void;
  readonly clear: () => void;
}

/** The visitor's own folder, in memory only: files, a pasted list, the audit date and the items that apply. */
export function useOwnFolder(): OwnFolder {
  const [entries, setEntries] = useState<readonly OwnEntry[]>([]);
  const [unread, setUnread] = useState<readonly number[]>([]);
  const [audit, setAuditValue] = useState("");
  const [months, setMonthsValue] = useState<WindowMonths>(12);
  const [dateError, setDateError] = useState(false);
  const [enabled, setEnabled] = useState<ReadonlySet<ItemId>>(() => new Set(GENERIC_ITEM_IDS));

  useEffect(() => {
    const stored = readSettings();
    if (!stored) return;
    setAuditValue(stored.audit);
    setMonthsValue(stored.months);
  }, []);

  const addFiles = useCallback(async (files: readonly File[]) => {
    if (files.length === 0) return;
    let budget = MAX_READ;
    const read: OwnEntry[] = [];
    for (const file of files) {
      const content = readable(file.name) && budget > 0;
      if (content) budget -= 1;
      read.push(await entryOf(file, content));
    }
    setEntries((current) => [...current, ...read]);
  }, []);

  const addList = useCallback((text: string) => {
    const parsed = parseList(text);
    setUnread(parsed.unread);
    if (parsed.files.length === 0) return;
    setEntries((current) => [
      ...current,
      ...parsed.files.map((file) => ({
        name: file.name,
        size: null,
        lastModified: null,
        listedDate: file.date?.iso ?? null,
        listedLatest: file.date?.latest ?? null,
        listedInvalid: file.dateInvalid,
        listedAmbiguous: file.dateAmbiguous,
        yearMissing: file.yearMissing,
        text: null,
      })),
    ]);
  }, []);

  const setAudit = useCallback(
    (value: string) => {
      if (value === "") {
        setAuditValue("");
        setDateError(false);
        return;
      }
      if (!validIso(value)) {
        setDateError(true);
        return;
      }
      setDateError(false);
      setAuditValue(value);
      writeSettings(value, months);
    },
    [months],
  );

  const setMonths = useCallback(
    (value: WindowMonths) => {
      setMonthsValue(value);
      if (audit) writeSettings(audit, value);
    },
    [audit],
  );

  const toggle = useCallback((id: ItemId) => {
    setEnabled((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
    setUnread([]);
  }, []);

  const windowFrom = audit ? windowStart(audit, months) : null;
  const result = useMemo(
    () => (entries.length > 0 ? assessFolder(entries, windowFrom, enabled) : null),
    [entries, windowFrom, enabled],
  );

  return { entries, unread, audit, months, dateError, enabled, windowFrom, result, addFiles, addList, setAudit, setMonths, toggle, clear };
}
