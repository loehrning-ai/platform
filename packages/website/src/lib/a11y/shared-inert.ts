export const LEARNING_OWNER_INERT_ATTRIBUTE = "data-learning-owner-unresolved";
export const NAV_MENU_INERT_ATTRIBUTE = "data-nav-menu-inert";
export const LESSON_DRAWER_INERT_ATTRIBUTE = "data-lesson-drawer-inert";

const SHARED_INERT_OWNERS = [
  LEARNING_OWNER_INERT_ATTRIBUTE,
  NAV_MENU_INERT_ATTRIBUTE,
  LESSON_DRAWER_INERT_ATTRIBUTE,
] as const;

export type SharedInertOwner = (typeof SHARED_INERT_OWNERS)[number];

export function hasSharedInertOwner(element: HTMLElement): boolean {
  return SHARED_INERT_OWNERS.some((attribute) =>
    element.hasAttribute(attribute),
  );
}

/**
 * Reconcile one region from explicit lock owners. Each controller removes
 * only its own marker; the region remains inert until every owner releases it.
 */
export function setSharedInertOwner(
  element: HTMLElement,
  owner: SharedInertOwner,
  active: boolean,
): void {
  if (active) {
    element.setAttribute(owner, "true");
  } else {
    element.removeAttribute(owner);
  }
  const mustRemainInert = hasSharedInertOwner(element);
  element.toggleAttribute("inert", mustRemainInert);
}
