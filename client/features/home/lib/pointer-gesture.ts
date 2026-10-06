export type PointerPoint = { x: number; y: number };

/** Pixels the pointer may travel between press and release and still count as a click. */
export const CLICK_TOLERANCE = 6;

/** A press and release close together; anything farther was a drag to rotate the scene. */
export function isClick(
  down: PointerPoint | null,
  up: PointerPoint,
  tolerance = CLICK_TOLERANCE,
): boolean {
  if (!down) return false;
  return Math.hypot(up.x - down.x, up.y - down.y) <= tolerance;
}
