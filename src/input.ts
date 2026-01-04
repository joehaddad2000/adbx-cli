/**
 * Text input handling with ADBKeyboard support.
 *
 * ADBKeyboard is required for:
 * - React Native apps (standard input doesn't trigger JS state)
 * - Unicode/emoji input
 *
 * Falls back to standard `adb shell input text` for ASCII when ADBKeyboard
 * is not installed.
 */

import { execShell, type AdbOptions } from "./adb.ts";
import { warn } from "./utils/output.ts";

// ============================================================================
// ADBKeyboard Detection
// ============================================================================

const ADB_KEYBOARD_PACKAGE = "com.android.adbkeyboard";
const ADB_KEYBOARD_IME = `${ADB_KEYBOARD_PACKAGE}/.AdbIME`;

/**
 * Check if ADBKeyboard is installed and enabled.
 */
export async function isAdbKeyboardInstalled(
  options: AdbOptions = {}
): Promise<boolean> {
  const imes = await execShell("ime list -s", options);
  return imes.includes(ADB_KEYBOARD_PACKAGE);
}

/**
 * Check if ADBKeyboard is currently the active IME.
 */
export async function isAdbKeyboardActive(
  options: AdbOptions = {}
): Promise<boolean> {
  const settings = await execShell(
    "settings get secure default_input_method",
    options
  );
  return settings.includes(ADB_KEYBOARD_PACKAGE);
}

/**
 * Set ADBKeyboard as the active IME.
 */
export async function activateAdbKeyboard(
  options: AdbOptions = {}
): Promise<void> {
  await execShell(`ime set ${ADB_KEYBOARD_IME}`, options);
}

// ============================================================================
// Text Input
// ============================================================================

/**
 * Check if a string contains only ASCII characters.
 */
function isAscii(str: string): boolean {
  return /^[\x00-\x7F]*$/.test(str);
}

/**
 * Escape text for standard adb shell input text.
 * Spaces become %s, other special chars need escaping.
 */
function escapeForInputText(text: string): string {
  return text
    .replace(/ /g, "%s") // Space -> %s
    .replace(/'/g, "\\'") // Escape single quotes
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\\/g, "\\\\") // Escape backslashes
    .replace(/\(/g, "\\(") // Escape parentheses
    .replace(/\)/g, "\\)")
    .replace(/</g, "\\<") // Escape angle brackets
    .replace(/>/g, "\\>")
    .replace(/\|/g, "\\|") // Escape pipe
    .replace(/;/g, "\\;") // Escape semicolon
    .replace(/&/g, "\\&") // Escape ampersand
    .replace(/\$/g, "\\$"); // Escape dollar sign
}

/**
 * Type text using ADBKeyboard broadcast.
 */
async function typeWithAdbKeyboard(
  text: string,
  options: AdbOptions = {}
): Promise<void> {
  // Use base64 encoding for reliability (handles unicode, special chars)
  const base64 = Buffer.from(text, "utf-8").toString("base64");
  await execShell(
    `am broadcast -a ADB_INPUT_B64 --es msg '${base64}'`,
    options
  );
}

/**
 * Type text using standard adb shell input text.
 */
async function typeWithStandardInput(
  text: string,
  options: AdbOptions = {}
): Promise<void> {
  const escaped = escapeForInputText(text);
  await execShell(`input text '${escaped}'`, options);
}

export interface TypeTextOptions extends AdbOptions {
  /**
   * Force using standard input even if ADBKeyboard is available.
   * Not recommended for React Native apps.
   */
  forceStandard?: boolean;
}

/**
 * Type text into the currently focused input field.
 *
 * Automatically uses ADBKeyboard if available, falls back to standard input.
 * Warns if typing non-ASCII without ADBKeyboard.
 */
export async function typeText(
  text: string,
  options: TypeTextOptions = {}
): Promise<void> {
  const { forceStandard = false, ...adbOptions } = options;

  // Check for ADBKeyboard
  const hasAdbKeyboard =
    !forceStandard && (await isAdbKeyboardInstalled(adbOptions));

  if (hasAdbKeyboard) {
    // Ensure it's active
    const isActive = await isAdbKeyboardActive(adbOptions);
    if (!isActive) {
      await activateAdbKeyboard(adbOptions);
    }

    await typeWithAdbKeyboard(text, adbOptions);
  } else {
    // Fall back to standard input
    if (!isAscii(text)) {
      warn(
        "ADBKeyboard not installed. Unicode characters may not work correctly."
      );
      warn("Install ADBKeyboard for full unicode support.");
    }

    await typeWithStandardInput(text, adbOptions);
  }
}

/**
 * Clear all text in the currently focused input field.
 * Requires ADBKeyboard for reliable operation.
 */
export async function clearText(options: AdbOptions = {}): Promise<void> {
  const hasAdbKeyboard = await isAdbKeyboardInstalled(options);

  if (hasAdbKeyboard) {
    await execShell("am broadcast -a ADB_CLEAR_TEXT", options);
  } else {
    // Fallback: select all and delete
    // This is less reliable but works in many cases
    warn("ADBKeyboard not installed. Using fallback clear method.");

    // Triple-tap to select all (works in some apps)
    // Then send delete key
    await execShell("input keyevent 67", options); // KEYCODE_DEL
    // Repeat a few times to clear more text
    for (let i = 0; i < 50; i++) {
      await execShell("input keyevent 67", options);
    }
  }
}
