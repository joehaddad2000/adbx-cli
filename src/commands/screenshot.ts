/**
 * Capture a screenshot from the device.
 */

import { writeFile } from "fs/promises";
import { resolve } from "path";
import sharp from "sharp";
import { execAdbRaw, type AdbOptions } from "../adb.ts";
import { success } from "../utils/output.ts";

/** Max dimension (width or height) before resizing. Prevents Claude API errors. */
const MAX_DIMENSION = 1568;

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

  // Check dimensions and resize if needed
  const image = sharp(imageData);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  if (width && height && (width > MAX_DIMENSION || height > MAX_DIMENSION)) {
    // Resize proportionally so largest dimension is MAX_DIMENSION
    const resized = await image
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside" })
      .png()
      .toBuffer();
    await writeFile(outputPath, resized);
  } else {
    // Write original
    await writeFile(outputPath, imageData);
  }

  success(`Screenshot saved to ${outputPath}`);
  return outputPath;
}
