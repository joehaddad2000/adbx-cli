/**
 * Package management commands (list, search).
 */

import { execShell, type AdbOptions } from "../adb.ts";
import { info } from "../utils/output.ts";

export interface PackagesOptions extends AdbOptions {
  /** Include system packages (default: only 3rd-party/user apps) */
  all?: boolean;
}

/**
 * List installed packages, optionally filtered by query.
 * By default shows only 3rd-party (user-installed) apps.
 */
export async function packagesCommand(
  query?: string,
  options: PackagesOptions = {}
): Promise<void> {
  // Use -3 flag to show only 3rd-party packages by default
  const pmCommand = options.all ? "pm list packages" : "pm list packages -3";
  const output = await execShell(pmCommand, options);

  // Parse package names from "package:com.example.app" format
  const packages = output
    .split("\n")
    .map((line) => line.replace("package:", "").trim())
    .filter((pkg) => pkg.length > 0);

  // Filter by query if provided
  const filtered = query
    ? packages.filter((pkg) => pkg.toLowerCase().includes(query.toLowerCase()))
    : packages;

  if (filtered.length === 0) {
    if (query) {
      info(`No packages found matching "${query}"${options.all ? "" : " (use --all to include system apps)"}`);
    } else {
      info(`No packages found${options.all ? "" : " (use --all to include system apps)"}`);
    }
    return;
  }

  const label = options.all ? "package" : "app";
  info(`Found ${filtered.length} ${label}${filtered.length === 1 ? "" : "s"}:`);
  for (const pkg of filtered) {
    info(`  ${pkg}`);
  }
}
