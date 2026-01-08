/**
 * adbx — A semantic CLI wrapper around ADB for LLMs.
 *
 * Usage:
 *   adbx <command> [options]
 *
 * Commands:
 *   devices              List connected devices
 *   observe [path]       Get screen state (elements + optional screenshot)
 *   tap <target>         Tap element by text or coordinates
 *   type <text>          Type text into focused field
 *   clear                Clear focused text field
 *   scroll <direction>   Scroll up/down
 *   swipe <direction>    Swipe left/right
 *   wait <ms>            Wait (sleep) for specified milliseconds
 *   back                 Press back button
 *   home                 Press home button
 *   enter                Press enter key
 *   packages [query]     List/search installed packages
 *   launch <package>     Launch app
 *   stop <package>       Force stop app
 *   clear-data <package> Clear app data
 *
 * Global Options:
 *   --device <serial>    Target specific device
 *   --timeout <ms>       Override timeout (default: 10000)
 *   --long               For tap: perform long press
 *   --index <n>          For tap: select nth match
 *   --id                 For tap: search by resource-id
 *   --visual, -v         Include screenshot (observe only)
 *   --wait <ms>          Wait before observing (observe only)
 */

import { parseArgs } from "util";
import { createRequire } from "module";
import updateNotifier from "update-notifier";
import { getDevice, AdbError, AdbNotFoundError, NoDevicesError, MultipleDevicesError, DeviceNotFoundError } from "./adb.ts";
import { ElementNotFoundError, MultipleElementsError } from "./ui.ts";
import { error, info } from "./utils/output.ts";

// Check for updates (runs in background, notifies on next run)
const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { name: string; version: string };
updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 }).notify();

// Commands
import { devicesCommand } from "./commands/devices.ts";
import { tapCommand } from "./commands/tap.ts";
import { typeCommand, clearCommand } from "./commands/type.ts";
import { scrollCommand, swipeCommand, isValidScrollDirection, isValidSwipeDirection } from "./commands/swipe.ts";
import { waitCommand } from "./commands/wait.ts";
import { backCommand, homeCommand, enterCommand } from "./commands/keys.ts";
import { observeCommand } from "./commands/observe.ts";
import { launchCommand, stopCommand, clearDataCommand } from "./commands/app.ts";
import { packagesCommand } from "./commands/packages.ts";

// ============================================================================
// Argument Parsing
// ============================================================================

function printHelp(): void {
  info(`adbx — A semantic CLI wrapper around ADB for LLMs

Usage:
  adbx <command> [arguments] [options]

Commands:
  devices              List connected devices
  observe [path]       Get screen state (elements + optional screenshot)
  tap <text>           Tap element by text
  tap <x> <y>          Tap at coordinates
  type <text>          Type text into focused field
  clear                Clear focused text field
  scroll <direction>   Scroll up/down (vertical)
  swipe <direction>    Swipe left/right (horizontal)
  wait <ms>            Wait (sleep) for specified milliseconds
  back                 Press back button
  home                 Press home button
  enter                Press enter key
  packages [query]     List/search installed packages
  launch <package>     Launch app by package name
  stop <package>       Force stop app
  clear-data <package> Clear app data (cache, settings, databases)

Options:
  --device <serial>    Target specific device
  --timeout <ms>       Override timeout (default: 10000)
  --long               Perform long press (tap only)
  --index <n>          Select nth match (tap only)
  --id                 Search by resource-id (tap only)
  --all, -a            Include system packages (packages only)
  --visual, -v         Include screenshot (observe only)
  --wait <ms>          Wait before observing (observe only)
  --help, -h           Show this help message`);
}

interface ParsedArgs {
  command: string;
  positionals: string[];
  device?: string;
  timeout?: number;
  long?: boolean;
  index?: number;
  id?: boolean;
  all?: boolean;
  visual?: boolean;
  wait?: number;
  help?: boolean;
}

function parseArguments(): ParsedArgs {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      device: { type: "string", short: "d" },
      timeout: { type: "string", short: "t" },
      long: { type: "boolean", short: "l" },
      index: { type: "string", short: "i" },
      id: { type: "boolean" },
      all: { type: "boolean", short: "a" },
      visual: { type: "boolean", short: "v" },
      wait: { type: "string", short: "w" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  const command = positionals[0] ?? "";
  const args = positionals.slice(1);

  return {
    command,
    positionals: args,
    device: values.device,
    timeout: values.timeout ? parseInt(values.timeout, 10) : undefined,
    long: values.long,
    index: values.index ? parseInt(values.index, 10) : undefined,
    id: values.id,
    all: values.all,
    visual: values.visual,
    wait: values.wait ? parseInt(values.wait, 10) : undefined,
    help: values.help,
  };
}

// ============================================================================
// Command Routing
// ============================================================================

async function runCommand(args: ParsedArgs): Promise<void> {
  const { command, positionals, device: explicitDevice, timeout, long, index, id, all, visual, wait } = args;

  // For commands that need a device, resolve it once
  const needsDevice = !["devices", "help", "wait"].includes(command);
  const device = needsDevice ? await getDevice(explicitDevice) : undefined;

  const options = { device, timeout };

  switch (command) {
    case "devices":
      await devicesCommand();
      break;

    case "tap": {
      if (positionals.length === 0) {
        throw new Error("tap requires a target (text or coordinates)");
      }

      // Check if coordinates (two numbers) - only when not using --id
      if (!id && positionals.length >= 2) {
        const x = parseInt(positionals[0]!, 10);
        const y = parseInt(positionals[1]!, 10);
        if (!isNaN(x) && !isNaN(y)) {
          await tapCommand([x, y], { ...options, long });
          break;
        }
      }

      // Otherwise, treat as text/id query
      const target = positionals.join(" ");
      await tapCommand(target, { ...options, long, index, id });
      break;
    }

    case "type": {
      if (positionals.length === 0) {
        throw new Error("type requires text argument");
      }
      const text = positionals.join(" ");
      await typeCommand(text, options);
      break;
    }

    case "clear":
      await clearCommand(options);
      break;

    case "scroll": {
      const direction = positionals[0];
      if (!direction || !isValidScrollDirection(direction)) {
        throw new Error("scroll requires direction: up or down");
      }
      await scrollCommand(direction, options);
      break;
    }

    case "swipe": {
      const direction = positionals[0];
      if (!direction || !isValidSwipeDirection(direction)) {
        throw new Error("swipe requires direction: left or right");
      }
      await swipeCommand(direction, options);
      break;
    }

    case "wait": {
      const ms = positionals[0] ? parseInt(positionals[0], 10) : 0;
      if (isNaN(ms) || ms < 0) {
        throw new Error("wait requires a valid number of milliseconds");
      }
      await waitCommand(ms);
      break;
    }

    case "back":
      await backCommand(options);
      break;

    case "home":
      await homeCommand(options);
      break;

    case "enter":
      await enterCommand(options);
      break;

    case "observe": {
      const path = positionals[0];
      await observeCommand({ ...options, visual, wait, path });
      break;
    }

    case "packages": {
      const query = positionals[0];
      await packagesCommand(query, { ...options, all });
      break;
    }

    case "launch": {
      if (positionals.length === 0) {
        throw new Error("launch requires package name");
      }
      await launchCommand(positionals[0]!, options);
      break;
    }

    case "stop": {
      if (positionals.length === 0) {
        throw new Error("stop requires package name");
      }
      await stopCommand(positionals[0]!, options);
      break;
    }

    case "clear-data": {
      if (positionals.length === 0) {
        throw new Error("clear-data requires package name");
      }
      await clearDataCommand(positionals[0]!, options);
      break;
    }

    case "":
    case "help":
      printHelp();
      break;

    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

// ============================================================================
// Error Handling
// ============================================================================

function handleError(err: unknown): never {
  if (err instanceof AdbNotFoundError) {
    error("adb not found", "Install Android SDK Platform Tools and ensure adb is in your PATH.");
  } else if (err instanceof NoDevicesError) {
    error("No devices connected", "Connect a device or start an emulator.");
  } else if (err instanceof MultipleDevicesError) {
    error("Multiple devices connected", "Use --device <serial> to specify which one.");
    info("Available devices:");
    for (const d of err.devices) {
      info(`  ${d.serial}`);
    }
  } else if (err instanceof DeviceNotFoundError) {
    error(err.message);
  } else if (err instanceof ElementNotFoundError) {
    error(`Element "${err.query}" not found`);
    if (err.visibleElements.length > 0) {
      info("Visible elements:");
      for (const el of err.visibleElements.slice(0, 10)) {
        info(`  "${el}"`);
      }
    }
  } else if (err instanceof MultipleElementsError) {
    error(err.message);
  } else if (err instanceof AdbError) {
    error(err.message, err.stderr);
  } else if (err instanceof Error) {
    error(err.message);
  } else {
    error("Unknown error", String(err));
  }

  process.exit(1);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  try {
    const args = parseArguments();

    if (args.help) {
      printHelp();
      return;
    }

    await runCommand(args);
  } catch (err) {
    handleError(err);
  }
}

main();
