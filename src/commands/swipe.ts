/**
 * Scroll and swipe gestures.
 *
 * - scroll: vertical (up/down) - for scrolling through lists
 * - swipe: horizontal (left/right) - for navigating pages/tabs
 */

import { execShell, getScreenSize, type AdbOptions } from "../adb.ts";
import { success } from "../utils/output.ts";

// ============================================================================
// Types
// ============================================================================

export type ScrollDirection = "up" | "down";
export type SwipeDirection = "left" | "right";

// ============================================================================
// Constants
// ============================================================================

/** How much of the screen to move (as a fraction) */
const GESTURE_DISTANCE = 0.4;

/** Animation duration in milliseconds */
const GESTURE_DURATION = 300;

// ============================================================================
// Implementation
// ============================================================================

/**
 * Perform a swipe gesture from one point to another.
 */
async function performSwipe(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: AdbOptions = {}
): Promise<void> {
  await execShell(
    `input swipe ${x1} ${y1} ${x2} ${y2} ${GESTURE_DURATION}`,
    options
  );
}

/**
 * Scroll the screen vertically.
 */
export async function scrollCommand(
  direction: ScrollDirection,
  options: AdbOptions = {}
): Promise<void> {
  const { width, height } = await getScreenSize(options);
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const distance = Math.floor(height * GESTURE_DISTANCE);

  if (direction === "up") {
    // Swipe down to scroll up (reveal content above)
    await performSwipe(
      centerX,
      centerY - distance / 2,
      centerX,
      centerY + distance / 2,
      options
    );
  } else {
    // Swipe up to scroll down (reveal content below)
    await performSwipe(
      centerX,
      centerY + distance / 2,
      centerX,
      centerY - distance / 2,
      options
    );
  }

  success(`Scrolled ${direction}`);
}

/**
 * Swipe the screen horizontally.
 */
export async function swipeCommand(
  direction: SwipeDirection,
  options: AdbOptions = {}
): Promise<void> {
  const { width, height } = await getScreenSize(options);
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const distance = Math.floor(width * GESTURE_DISTANCE);

  if (direction === "left") {
    // Swipe left (finger moves left)
    await performSwipe(
      centerX + distance / 2,
      centerY,
      centerX - distance / 2,
      centerY,
      options
    );
  } else {
    // Swipe right (finger moves right)
    await performSwipe(
      centerX - distance / 2,
      centerY,
      centerX + distance / 2,
      centerY,
      options
    );
  }

  success(`Swiped ${direction}`);
}

/**
 * Validate scroll direction argument.
 */
export function isValidScrollDirection(dir: string): dir is ScrollDirection {
  return dir === "up" || dir === "down";
}

/**
 * Validate swipe direction argument.
 */
export function isValidSwipeDirection(dir: string): dir is SwipeDirection {
  return dir === "left" || dir === "right";
}
