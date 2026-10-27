/**
 * One Escape for the whole demo, in a fixed order (glass-spec 4.14): the top
 * sheet closes first, then an active drag is cancelled, then free play is
 * left (the clock's own Escape listener). Layers register while they are
 * open; the highest priority wins, the newest among equals. The listener
 * runs in the capture phase on the document, so a handled Escape never
 * reaches the clock's window listener.
 */

export const ESCAPE_PRIORITY = { sheet: 30, drag: 20, popover: 10 } as const;

interface Layer {
  readonly id: number;
  readonly priority: number;
  readonly onEscape: () => void;
}

let layers: Layer[] = [];
let nextId = 1;
let installed = false;

function onKeyDown(event: KeyboardEvent): void {
  if (event.key !== "Escape" || event.metaKey || event.ctrlKey || event.altKey) return;
  const top = topLayer();
  if (!top) return;
  event.preventDefault();
  event.stopPropagation();
  top.onEscape();
}

function topLayer(): Layer | undefined {
  let best: Layer | undefined;
  for (const layer of layers) {
    if (!best || layer.priority > best.priority || (layer.priority === best.priority && layer.id > best.id)) best = layer;
  }
  return best;
}

/** Registers an Escape layer; returns the function that removes it. */
export function pushEscapeLayer(priority: number, onEscape: () => void): () => void {
  const layer: Layer = { id: nextId++, priority, onEscape };
  layers = [...layers, layer];
  if (!installed && typeof document !== "undefined") {
    document.addEventListener("keydown", onKeyDown, true);
    installed = true;
  }
  return () => {
    layers = layers.filter((entry) => entry !== layer);
    if (layers.length === 0 && installed) {
      document.removeEventListener("keydown", onKeyDown, true);
      installed = false;
    }
  };
}

/** How many layers are open (for tests and for the clock: free play only leaves when none is). */
export function escapeLayerCount(): number {
  return layers.length;
}
