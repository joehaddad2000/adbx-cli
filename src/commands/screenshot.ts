/**
 * Capture a screenshot from the device.
 */

import { writeFile } from "fs/promises";
import { resolve } from "path";
import { execAdbRaw, type AdbOptions } from "../adb.ts";
import { success } from "../utils/output.ts";

export interface ScreenshotOptions extends AdbOptions {
  /** Output path for the screenshot. Defaults to ./screenshot.png */
  path?: string;
}

export async function screenshotCommand(
  options: ScreenshotOptions = {}
): Promise<string> {
  const outputPath = resolve(options.path ?? "screenshot.png");

  // Capture screenshot directly to stdout as PNG
  const imageData = await execAdbRaw(["exec-out", "screencap", "-p"], options);

  // Write to file
  await writeFile(outputPath, imageData);

  success(`Screenshot saved to ${outputPath}`);
  return outputPath;
}
