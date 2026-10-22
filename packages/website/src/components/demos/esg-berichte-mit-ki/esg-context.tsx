"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { EsgPack } from "@/lib/demo-cases/esg-berichte-mit-ki/pack";
import { createLogic, type EsgLogic } from "@/lib/demo-cases/esg-berichte-mit-ki/core";
import type { AnswerRow, RowId } from "@/lib/demo-cases/esg-berichte-mit-ki/types";

/**
 * The page's data on the client: the locale pack the server built (one
 * locale only) and the logic bound to it. Client modules read facts, rows
 * and texts from here, never from the bilingual data modules.
 */
export interface EsgData {
  readonly pack: EsgPack;
  readonly logic: EsgLogic;
  readonly rowById: (id: RowId) => AnswerRow;
}

const EsgContext = createContext<EsgData | null>(null);

export function EsgProvider({ pack, children }: { readonly pack: EsgPack; readonly children: ReactNode }) {
  const value = useMemo<EsgData>(() => {
    const rows = new Map(pack.rows.map((row) => [row.id, row]));
    return {
      pack,
      logic: createLogic(pack.world),
      rowById: (id) => {
        const row = rows.get(id);
        if (!row) throw new Error(`Unknown row ${id}`);
        return row;
      },
    };
  }, [pack]);
  return <EsgContext.Provider value={value}>{children}</EsgContext.Provider>;
}

export function useEsg(): EsgData {
  const data = useContext(EsgContext);
  if (!data) throw new Error("useEsg outside EsgProvider");
  return data;
}
