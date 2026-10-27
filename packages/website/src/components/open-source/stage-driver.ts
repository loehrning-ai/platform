/** How a stage is moved. Every stage is a pure function of the second `s`. */
export interface StageDriver {
  seek(s: number, fast?: boolean): void;
  prepare?(): void;
  play?(fromS: number): void;
  pause?(): void;
  /** Media time while playing; drawn stages run on the wall clock. */
  time?(): number;
}

const slots = new Map<string, { current: StageDriver | null }>();

/**
 * The stable slot through which a plate reaches its stage. The stage is
 * rendered on the server and handed to the plate as markup, so a ref cannot
 * cross; the stage fills the slot of its plate id once it mounts.
 */
export function driverSlot(id: string): { current: StageDriver | null } {
  let slot = slots.get(id);
  if (!slot) {
    slot = { current: null };
    slots.set(id, slot);
  }
  return slot;
}
