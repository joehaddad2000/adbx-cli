/**
 * Type text into the focused input field.
 */

import { typeText, clearText, type TypeTextOptions } from "../input.ts";
import { success } from "../utils/output.ts";
import type { AdbOptions } from "../adb.ts";

/**
 * Type text command.
 */
export async function typeCommand(
  text: string,
  options: TypeTextOptions = {}
): Promise<void> {
  await typeText(text, options);
  success(`Typed "${text}"`);
}

/**
 * Clear text command.
 */
export async function clearCommand(options: AdbOptions = {}): Promise<void> {
  await clearText(options);
  success("Cleared text field");
}
