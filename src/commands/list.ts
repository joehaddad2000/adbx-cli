/**
 * List visible UI elements.
 */

import { getAllElements, boundsCenter, type UiElement } from "../ui.ts";
import { info } from "../utils/output.ts";
import type { AdbOptions } from "../adb.ts";

// ============================================================================
// Formatting
// ============================================================================

/**
 * Format a single element for display.
 */
function formatElement(el: UiElement): string {
  const label = el.text || el.contentDesc || el.resourceId || el.className;
  const { x, y } = boundsCenter(el.bounds);
  const clickable = el.clickable ? " [clickable]" : "";

  return `  "${label}" at (${x}, ${y})${clickable}`;
}

/**
 * Filter elements that have meaningful display text.
 */
function filterDisplayableElements(elements: UiElement[]): UiElement[] {
  return elements.filter((el) => {
    // Must have some identifying text
    const hasLabel = el.text || el.contentDesc;
    // Skip tiny elements (likely not interactive)
    const hasSize =
      el.bounds.x2 - el.bounds.x1 > 10 && el.bounds.y2 - el.bounds.y1 > 10;

    return hasLabel && hasSize;
  });
}

// ============================================================================
// Command
// ============================================================================

/**
 * List all visible UI elements.
 */
export async function listCommand(options: AdbOptions = {}): Promise<void> {
  const allElements = await getAllElements(options);
  const elements = filterDisplayableElements(allElements);

  if (elements.length === 0) {
    info("No visible elements with text found.");
    return;
  }

  info(`Found ${elements.length} elements:`);

  for (const el of elements) {
    info(formatElement(el));
  }
}
