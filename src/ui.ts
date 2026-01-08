/**
 * UI hierarchy parsing for element discovery.
 *
 * Parses the XML output from `adb shell uiautomator dump` to find
 * elements by text, content-description, or other attributes.
 */

import { execShell, AdbError, type AdbOptions } from "./adb.ts";

// ============================================================================
// Types
// ============================================================================

export interface Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface UiElement {
  text: string;
  contentDesc: string;
  resourceId: string;
  className: string;
  bounds: Bounds;
  clickable: boolean;
  enabled: boolean;
}

export class ElementNotFoundError extends Error {
  constructor(
    public readonly query: string,
    public readonly visibleElements: string[]
  ) {
    const suggestions =
      visibleElements.length > 0
        ? `\nVisible elements: ${JSON.stringify(visibleElements.slice(0, 10))}`
        : "\nNo visible elements found.";
    super(`Element "${query}" not found.${suggestions}`);
    this.name = "ElementNotFoundError";
  }
}

export class MultipleElementsError extends Error {
  constructor(
    public readonly query: string,
    public readonly count: number
  ) {
    super(
      `Found ${count} elements matching "${query}". Use --index to specify which one (0-${count - 1}).`
    );
    this.name = "MultipleElementsError";
  }
}

// ============================================================================
// UI Dump
// ============================================================================

/**
 * Dump the current UI hierarchy as XML.
 */
export async function dumpUiHierarchy(options: AdbOptions = {}): Promise<string> {
  const remotePath = "/sdcard/window_dump.xml";

  // Dump UI hierarchy to a file on the device
  await execShell(`uiautomator dump ${remotePath}`, options);

  // Read the file contents
  const xml = await execShell(`cat ${remotePath}`, options);

  // Clean up
  await execShell(`rm ${remotePath}`, options);

  if (!xml.includes("</hierarchy>")) {
    throw new AdbError(
      "Failed to dump UI hierarchy",
      "uiautomator dump",
      0,
      xml
    );
  }

  return xml;
}

// ============================================================================
// XML Parsing
// ============================================================================

/**
 * Parse bounds string "[x1,y1][x2,y2]" into Bounds object.
 */
function parseBounds(boundsStr: string): Bounds {
  const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!match) {
    return { x1: 0, y1: 0, x2: 0, y2: 0 };
  }
  return {
    x1: parseInt(match[1]!, 10),
    y1: parseInt(match[2]!, 10),
    x2: parseInt(match[3]!, 10),
    y2: parseInt(match[4]!, 10),
  };
}

/**
 * Calculate center point of bounds.
 */
export function boundsCenter(bounds: Bounds): { x: number; y: number } {
  return {
    x: Math.floor((bounds.x1 + bounds.x2) / 2),
    y: Math.floor((bounds.y1 + bounds.y2) / 2),
  };
}

/**
 * Extract attribute value from XML node string.
 */
function extractAttribute(node: string, attr: string): string {
  const regex = new RegExp(`${attr}="([^"]*)"`);
  const match = node.match(regex);
  return match?.[1] ?? "";
}

/**
 * Parse all UI elements from XML hierarchy.
 */
export function parseElements(xml: string): UiElement[] {
  const elements: UiElement[] = [];

  // Match all <node .../> elements (self-closing and regular)
  const nodeRegex = /<node\s+[^>]*>/g;
  let match;

  while ((match = nodeRegex.exec(xml)) !== null) {
    const nodeStr = match[0];

    const element: UiElement = {
      text: extractAttribute(nodeStr, "text"),
      contentDesc: extractAttribute(nodeStr, "content-desc"),
      resourceId: extractAttribute(nodeStr, "resource-id"),
      className: extractAttribute(nodeStr, "class"),
      bounds: parseBounds(extractAttribute(nodeStr, "bounds")),
      clickable: extractAttribute(nodeStr, "clickable") === "true",
      enabled: extractAttribute(nodeStr, "enabled") === "true",
    };

    elements.push(element);
  }

  return elements;
}

// ============================================================================
// Element Finding
// ============================================================================

/**
 * Find elements matching a text query.
 * Matches against both `text` and `content-desc` attributes (case-insensitive exact match).
 */
export function findElementsByText(
  elements: UiElement[],
  query: string
): UiElement[] {
  const lowerQuery = query.toLowerCase();

  return elements.filter((el) => {
    const textMatch = el.text.toLowerCase() === lowerQuery;
    const descMatch = el.contentDesc.toLowerCase() === lowerQuery;
    return textMatch || descMatch;
  });
}

/**
 * Find elements matching a resource-id.
 * Matches if resource-id contains the query (case-insensitive).
 */
export function findElementsById(
  elements: UiElement[],
  query: string
): UiElement[] {
  const lowerQuery = query.toLowerCase();

  return elements.filter((el) => {
    return el.resourceId.toLowerCase().includes(lowerQuery);
  });
}

/**
 * Get all visible text labels from elements (for error messages).
 */
export function getVisibleTexts(elements: UiElement[]): string[] {
  const texts = new Set<string>();

  for (const el of elements) {
    if (el.text.trim()) {
      texts.add(el.text.trim());
    }
    if (el.contentDesc.trim()) {
      texts.add(el.contentDesc.trim());
    }
  }

  return Array.from(texts);
}

// ============================================================================
// High-Level API
// ============================================================================

export interface FindElementOptions extends AdbOptions {
  /** Which match to return when multiple elements found (0-indexed). */
  index?: number;
  /** Search by resource-id instead of text/content-desc. */
  id?: boolean;
}

/**
 * Find an element by text (or resource-id if `id` option set) and return its center coordinates.
 * Throws if element not found or multiple matches without index.
 */
export async function findElement(
  query: string,
  options: FindElementOptions = {}
): Promise<{ x: number; y: number; element: UiElement }> {
  const xml = await dumpUiHierarchy(options);
  const elements = parseElements(xml);
  const matches = options.id
    ? findElementsById(elements, query)
    : findElementsByText(elements, query);

  if (matches.length === 0) {
    throw new ElementNotFoundError(query, getVisibleTexts(elements));
  }

  let element: UiElement;

  if (options.index !== undefined) {
    // Explicit index requested
    const indexed = matches[options.index];
    if (!indexed) {
      throw new ElementNotFoundError(
        `${query} at index ${options.index}`,
        getVisibleTexts(elements)
      );
    }
    element = indexed;
  } else if (matches.length === 1) {
    // Single match
    element = matches[0]!;
  } else {
    // Multiple matches - prefer interactive elements (clickable + enabled)
    const interactive = matches.filter((el) => el.clickable && el.enabled);

    if (interactive.length === 1) {
      // Only one interactive element - use it
      element = interactive[0]!;
    } else if (interactive.length > 1) {
      // Multiple interactive elements - require index
      throw new MultipleElementsError(query, interactive.length);
    } else {
      // No interactive elements
      throw new Error(
        `Found ${matches.length} elements matching "${query}" but none are tappable (clickable + enabled).`
      );
    }
  }

  const center = boundsCenter(element.bounds);
  return { x: center.x, y: center.y, element };
}

/**
 * Get all visible elements from the current screen.
 */
export async function getAllElements(
  options: AdbOptions = {}
): Promise<UiElement[]> {
  const xml = await dumpUiHierarchy(options);
  return parseElements(xml);
}
