/**
 * Wait (sleep) for a specified duration.
 */

import { success } from "../utils/output.ts";

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait command - simple delay.
 */
export async function waitCommand(ms: number): Promise<void> {
  if (ms > 0) {
    await sleep(ms);
  }
  success(`Waited ${ms}ms`);
}
