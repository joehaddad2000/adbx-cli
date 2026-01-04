/**
 * Hardware key commands (back, home, enter).
 */

import { execShell, type AdbOptions } from "../adb.ts";
import { success } from "../utils/output.ts";

// ============================================================================
// Key Codes
// ============================================================================

/** Android keyevent codes for common keys */
const KeyCodes = {
  BACK: 4,
  HOME: 3,
  ENTER: 66,
  ESCAPE: 111,
  DELETE: 67,
} as const;

// ============================================================================
// Key Commands
// ============================================================================

/**
 * Send a keyevent to the device.
 */
async function sendKey(
  keyCode: number,
  options: AdbOptions = {}
): Promise<void> {
  await execShell(`input keyevent ${keyCode}`, options);
}

/**
 * Press the back button.
 */
export async function backCommand(options: AdbOptions = {}): Promise<void> {
  await sendKey(KeyCodes.BACK, options);
  success("Pressed back");
}

/**
 * Press the home button.
 */
export async function homeCommand(options: AdbOptions = {}): Promise<void> {
  await sendKey(KeyCodes.HOME, options);
  success("Pressed home");
}

/**
 * Press the enter key.
 */
export async function enterCommand(options: AdbOptions = {}): Promise<void> {
  await sendKey(KeyCodes.ENTER, options);
  success("Pressed enter");
}
