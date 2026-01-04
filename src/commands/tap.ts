/**
 * Tap on an element by text or coordinates.
 */

import { execShell, type AdbOptions } from "../adb.ts";
import { findElement, type FindElementOptions } from "../ui.ts";
import { success, formatCoords } from "../utils/output.ts";

// ============================================================================
// Types
// ============================================================================

export interface TapOptions extends FindElementOptions {
  /** Perform a long press instead of a tap. */
  long?: boolean;
}

// ============================================================================
// Low-Level Tap
// ============================================================================

/**
 * Tap at specific coordinates.
 */
async function tapAtCoordinates(
  x: number,
  y: number,
  options: AdbOptions & { long?: boolean } = {}
): Promise<void> {
  if (options.long) {
    // Long press: swipe with same start/end coordinates, 1000ms duration
    await execShell(`input swipe ${x} ${y} ${x} ${y} 1000`, options);
  } else {
    await execShell(`input tap ${x} ${y}`, options);
  }
}

// ============================================================================
// Commands
// ============================================================================

/**
 * Tap on an element by text or resource-id.
 */
export async function tapByQuery(
  query: string,
  options: TapOptions = {}
): Promise<void> {
  const { x, y } = await findElement(query, options);

  await tapAtCoordinates(x, y, options);

  const action = options.long ? "Long pressed" : "Tapped";
  const queryDisplay = options.id ? `[${query}]` : `"${query}"`;
  success(`${action} ${queryDisplay} at ${formatCoords(x, y)}`);
}

/**
 * Tap at specific x, y coordinates.
 */
export async function tapByCoordinates(
  x: number,
  y: number,
  options: AdbOptions & { long?: boolean } = {}
): Promise<void> {
  await tapAtCoordinates(x, y, options);

  const action = options.long ? "Long pressed" : "Tapped";
  success(`${action} at ${formatCoords(x, y)}`);
}

/**
 * Main tap command entry point.
 * Determines whether to tap by text/id or coordinates based on arguments.
 */
export async function tapCommand(
  target: string | [number, number],
  options: TapOptions = {}
): Promise<void> {
  if (Array.isArray(target)) {
    const [x, y] = target;
    await tapByCoordinates(x, y, options);
  } else {
    await tapByQuery(target, options);
  }
}
