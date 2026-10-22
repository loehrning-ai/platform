/** Option order must not leak the answer (round-1 review). */
import { describe, expect, it } from "vitest";
import { DEFINITION_REQUESTS } from "./cases";
import type { Blank } from "./model";

const requests = Object.values(DEFINITION_REQUESTS);

function canonicalIndex(requestId: string, blank: Blank): number {
  const request = DEFINITION_REQUESTS[requestId as keyof typeof DEFINITION_REQUESTS];
  const options = (request.options[blank] ?? []) as readonly string[];
  return options.indexOf(request.canonical[blank] as string);
}

describe("option order", () => {
  const indices = requests.flatMap((request) =>
    request.blanks.map((blank) => ({ id: `${request.id}.${blank}`, index: canonicalIndex(request.id, blank) })),
  );

  it("offers every canonical value among the options", () => {
    for (const { id, index } of indices) expect(index, id).toBeGreaterThanOrEqual(0);
  });

  it("puts the canonical value first in at most half of the blanks", () => {
    const first = indices.filter(({ index }) => index === 0);
    expect(first.length).toBeLessThanOrEqual(Math.floor(indices.length / 2));
  });

  it("never solves a request by picking the same position in every blank", () => {
    for (const request of requests) {
      const positions = new Set(request.blanks.map((blank) => canonicalIndex(request.id, blank)));
      expect(positions.size, request.id).toBeGreaterThan(1);
    }
  });
});
