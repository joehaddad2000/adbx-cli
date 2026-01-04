/**
 * Consistent output formatting for CLI commands.
 *
 * All user-facing output should go through these functions
 * to ensure consistent styling and formatting.
 */

// ============================================================================
// Output Functions
// ============================================================================

/**
 * Print a success message.
 */
export function success(message: string): void {
  console.log(`✓ ${message}`);
}

/**
 * Print an error message.
 */
export function error(message: string, details?: string): void {
  console.error(`✗ ${message}`);
  if (details) {
    // Indent each line of details
    const indented = details
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");
    console.error(indented);
  }
}

/**
 * Print an info/neutral message.
 */
export function info(message: string): void {
  console.log(message);
}

/**
 * Print a warning message.
 */
export function warn(message: string): void {
  console.log(`⚠ ${message}`);
}

// ============================================================================
// Formatting Helpers
// ============================================================================

/**
 * Format coordinates for display.
 */
export function formatCoords(x: number, y: number): string {
  return `(${x}, ${y})`;
}

/**
 * Format a list of items for display.
 */
export function formatList(items: string[], prefix = "  "): string {
  return items.map((item) => `${prefix}${item}`).join("\n");
}

/**
 * Truncate a string if it exceeds max length.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}
