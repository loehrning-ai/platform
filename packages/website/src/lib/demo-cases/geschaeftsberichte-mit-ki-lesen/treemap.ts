/**
 * A squarified treemap (Bruls, Huizing, van Wijk 2000): every value gets a
 * rectangle of exactly its share of the area, with aspect ratios kept near 1.
 * Pure; the trays lay their pebbles out with it.
 */

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

function worst(row: readonly number[], side: number): number {
  const sum = row.reduce((total, value) => total + value, 0);
  if (sum === 0 || side === 0) return Infinity;
  const max = Math.max(...row);
  const min = Math.min(...row);
  return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
}

/**
 * Lays `values` (non-negative, any order) into `bounds`; the result is in the
 * input order. Values are scaled so that their sum fills the bounds exactly.
 */
export function squarify(values: readonly number[], bounds: Rect): readonly Rect[] {
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  const out: Rect[] = values.map(() => ({
    x: bounds.x,
    y: bounds.y,
    w: 0,
    h: 0,
  }));
  if (total <= 0 || bounds.w <= 0 || bounds.h <= 0) return out;
  const scale = (bounds.w * bounds.h) / total;
  const order = values
    .map((value, index) => ({ index, area: Math.max(0, value) * scale }))
    .filter((item) => item.area > 0)
    .sort((a, b) => b.area - a.area || a.index - b.index);

  let free: Rect = bounds;
  let row: { index: number; area: number }[] = [];

  const layRow = (items: readonly { index: number; area: number }[], space: Rect): Rect => {
    const sum = items.reduce((total2, item) => total2 + item.area, 0);
    if (space.w >= space.h) {
      // a column on the left
      const width = sum / space.h;
      let y = space.y;
      for (const item of items) {
        const height = item.area / width;
        out[item.index] = { x: space.x, y, w: width, h: height };
        y += height;
      }
      return { x: space.x + width, y: space.y, w: space.w - width, h: space.h };
    }
    const height = sum / space.w;
    let x = space.x;
    for (const item of items) {
      const width = item.area / height;
      out[item.index] = { x, y: space.y, w: width, h: height };
      x += width;
    }
    return { x: space.x, y: space.y + height, w: space.w, h: space.h - height };
  };

  for (const item of order) {
    const side = Math.min(free.w, free.h);
    const areas = row.map((entry) => entry.area);
    if (row.length === 0 || worst([...areas, item.area], side) <= worst(areas, side)) {
      row.push(item);
    } else {
      free = layRow(row, free);
      row = [item];
    }
  }
  if (row.length > 0) layRow(row, free);
  return out;
}

/** Grows a rectangle around its centre so that both sides are at least `min` (tiny pebbles stay tappable). */
export function atLeast(rect: Rect, min: number): Rect {
  const w = Math.max(rect.w, min);
  const h = Math.max(rect.h, min);
  return { x: rect.x - (w - rect.w) / 2, y: rect.y - (h - rect.h) / 2, w, h };
}

/** Linear blend of two rectangles (the morph between two layouts). */
export function lerpRect(a: Rect, b: Rect, t: number): Rect {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    w: a.w + (b.w - a.w) * t,
    h: a.h + (b.h - a.h) * t,
  };
}
