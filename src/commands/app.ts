/**
 * App management commands (launch, stop).
 */

import { execShell, type AdbOptions } from "../adb.ts";
import { success, error } from "../utils/output.ts";

// ============================================================================
// Launch
// ============================================================================

/**
 * Launch an app by package name.
 *
 * Uses monkey to launch the main activity without needing to know
 * the exact activity name.
 */
export async function launchCommand(
  packageName: string,
  options: AdbOptions = {}
): Promise<void> {
  // Use monkey to launch - it finds the main launcher activity automatically
  const result = await execShell(
    `monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`,
    options
  );

  // Check for errors in output
  if (result.includes("No activities found")) {
    error(`App "${packageName}" not found or has no launcher activity`);
    throw new Error(`App not found: ${packageName}`);
  }

  success(`Launched ${packageName}`);
}

// ============================================================================
// Stop
// ============================================================================

/**
 * Force stop an app by package name.
 */
export async function stopCommand(
  packageName: string,
  options: AdbOptions = {}
): Promise<void> {
  await execShell(`am force-stop ${packageName}`, options);
  success(`Stopped ${packageName}`);
}

// ============================================================================
// Clear Data
// ============================================================================

/**
 * Clear app data (cache, settings, databases) by package name.
 */
export async function clearDataCommand(
  packageName: string,
  options: AdbOptions = {}
): Promise<void> {
  await execShell(`pm clear ${packageName}`, options);
  success(`Cleared data for ${packageName}`);
}
