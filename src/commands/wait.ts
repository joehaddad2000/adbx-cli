/**
 * Wait for elements to appear or disappear.
 */

import { elementExists, getVisibleTexts, getAllElements } from "../ui.ts";
import { success, error } from "../utils/output.ts";
import type { AdbOptions } from "../adb.ts";

// ============================================================================
// Types
// ============================================================================

export interface WaitOptions extends AdbOptions {
  /** Timeout in milliseconds. Default: 10000 */
  timeout?: number;
}

// ============================================================================
// Constants
// ============================================================================

/** How often to poll for element presence (in ms) */
const POLL_INTERVAL = 500;

/** Default timeout (in ms) */
const DEFAULT_TIMEOUT = 10000;

// ============================================================================
// Wait Implementation
// ============================================================================

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait until an element with the given text appears.
 */
export async function waitCommand(
  query: string,
  options: WaitOptions = {}
): Promise<void> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const exists = await elementExists(query, options);

    if (exists) {
      success(`Element "${query}" appeared`);
      return;
    }

    await sleep(POLL_INTERVAL);
  }

  // Timeout - get current visible elements for error message
  const elements = await getAllElements(options);
  const visible = getVisibleTexts(elements);

  error(
    `Timeout waiting for "${query}" (${timeout}ms)`,
    `Visible elements: ${JSON.stringify(visible.slice(0, 10))}`
  );

  throw new Error(`Timeout waiting for element "${query}"`);
}

/**
 * Wait until an element with the given text disappears.
 */
export async function waitGoneCommand(
  query: string,
  options: WaitOptions = {}
): Promise<void> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const exists = await elementExists(query, options);

    if (!exists) {
      success(`Element "${query}" disappeared`);
      return;
    }

    await sleep(POLL_INTERVAL);
  }

  error(`Timeout waiting for "${query}" to disappear (${timeout}ms)`);
  throw new Error(`Timeout waiting for element "${query}" to disappear`);
}
