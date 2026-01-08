/**
 * Observe the current screen state.
 *
 * Primary command for LLMs to understand what's on screen.
 * Always returns UI element list; optionally captures screenshot.
 */

import { getAllElements, boundsCenter, type UiElement } from "../ui.ts";
import { info, warn } from "../utils/output.ts";
import type { AdbOptions } from "../adb.ts";
import { captureScreenshot } from "./screenshot.ts";
import { sleep } from "./wait.ts";

// ============================================================================
// Element Formatting
// ============================================================================

/**
 * Format a single element for display.
 * Shows [icon] for content-desc elements, [id] for resource-id only elements.
 */
function formatElement(el: UiElement): string {
  // Determine label and source type
  let label: string;
  let labelType: "text" | "icon" | "id" = "text";

  if (el.text) {
    label = el.text;
    labelType = "text";
  } else if (el.contentDesc) {
    label = el.contentDesc;
    labelType = "icon";
  } else {
    label = el.resourceId || el.className;
    labelType = "id";
  }

  const { x, y } = boundsCenter(el.bounds);

  // Build tags array
  const tags: string[] = [];
  if (labelType === "icon") {
    tags.push("icon");
  } else if (labelType === "id") {
    tags.push("id");
  }
  if (el.clickable) {
    tags.push(el.enabled ? "enabled" : "disabled");
  }

  const tagStr = tags.length > 0 ? ` [${tags.join(", ")}]` : "";

  return `  "${label}" at (${x}, ${y})${tagStr}`;
}

/**
 * Filter elements that have meaningful identifiers.
 */
function filterDisplayableElements(elements: UiElement[]): UiElement[] {
  return elements.filter((el) => {
    // Must have some identifying label (text, content-desc, or resource-id)
    const hasLabel = el.text || el.contentDesc || el.resourceId;
    // Skip tiny elements (likely not interactive)
    const hasSize =
      el.bounds.x2 - el.bounds.x1 > 10 && el.bounds.y2 - el.bounds.y1 > 10;

    return hasLabel && hasSize;
  });
}

// ============================================================================
// Command
// ============================================================================

export interface ObserveOptions extends AdbOptions {
  /** Include a screenshot capture */
  visual?: boolean;
  /** Custom path for screenshot (only used with --visual) */
  path?: string;
  /** Wait (ms) before observing */
  wait?: number;
}

export interface ObserveResult {
  elements: UiElement[];
  screenshotPath?: string;
}

export async function observeCommand(
  options: ObserveOptions = {}
): Promise<ObserveResult> {
  // Optional wait before observing
  if (options.wait && options.wait > 0) {
    await sleep(options.wait);
  }

  // Get UI elements
  const allElements = await getAllElements(options);
  const elements = filterDisplayableElements(allElements);

  // Print header
  info("=== SCREEN STATE ===");
  info(`Elements: ${elements.length}`);
  info("");

  // Print elements
  if (elements.length === 0) {
    info("No visible elements found.");
  } else {
    for (const el of elements) {
      info(formatElement(el));
    }
  }

  // Handle optional screenshot
  let screenshotPath: string | undefined;
  if (options.visual) {
    info("");
    try {
      screenshotPath = await captureScreenshot({
        device: options.device,
        timeout: options.timeout,
        path: options.path,
      });
      info(`Screenshot: ${screenshotPath}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      warn(`Screenshot failed: ${message}`);
    }
  }

  return { elements, screenshotPath };
}
