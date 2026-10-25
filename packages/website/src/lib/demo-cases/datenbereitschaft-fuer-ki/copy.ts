import "server-only";

import { DE } from "./copy-de";
import { EN } from "./copy-en";

/**
 * The words of "Die Fragekarte", both languages. Server only: index.tsx picks
 * one pack and hands it to the client demo as props, so the browser bundle
 * holds one language (demo-contract.test.ts). Plain data, no functions.
 */
export const COPY = { de: DE, en: EN } as const;
