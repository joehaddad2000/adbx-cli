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
    tags.push("clickable");
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
