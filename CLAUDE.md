# adbx Development Guide

A semantic CLI wrapper around ADB for LLMs to interact with Android devices.

## Quick Reference

```bash
npm run build                      # Build to dist/
node dist/index.js <command>       # Run built CLI
npm run typecheck                  # Type check
```

## Architecture

```
src/
├── index.ts          # CLI entry point, argument parsing, command routing
├── adb.ts            # Low-level ADB execution, device management, error types
├── ui.ts             # UI hierarchy parsing (uiautomator XML)
├── input.ts          # Text input (ADBKeyboard detection + fallback)
├── commands/
│   ├── devices.ts    # List connected devices
│   ├── observe.ts    # Get screen state (elements + optional screenshot)
│   ├── screenshot.ts # Screenshot capture utility (used by observe)
│   ├── tap.ts        # Tap by text or coordinates
│   ├── type.ts       # Type text, clear field
│   ├── swipe.ts      # Scroll (up/down) and swipe (left/right)
│   ├── wait.ts       # Simple delay/sleep utility
│   ├── keys.ts       # Hardware keys (back, home, enter)
│   ├── packages.ts   # Package discovery
│   └── app.ts        # Launch, stop, and clear app data
└── utils/
    └── output.ts     # Consistent success/error output formatting
```

## Key Patterns

### Error Handling

Custom error classes in `adb.ts` provide structured errors:
- `AdbError` - General ADB command failure
- `AdbNotFoundError` - adb not in PATH
- `NoDevicesError` - No devices connected
- `MultipleDevicesError` - Multiple devices, need --device flag
- `DeviceNotFoundError` - Specified device doesn't exist

UI-specific errors in `ui.ts`:
- `ElementNotFoundError` - Element not found (includes visible elements for debugging)
- `MultipleElementsError` - Multiple matches, need --index flag

### Device Selection

All commands that interact with devices go through `getDevice()` in `adb.ts`:
- If `--device` provided, validate and use it
- If one device connected, use it automatically
- If multiple devices, throw `MultipleDevicesError`
- If no devices, throw `NoDevicesError`

### UI Element Finding

`findElement()` in `ui.ts`:
1. Dumps UI via `adb shell uiautomator dump /sdcard/window_dump.xml`
2. Reads and parses the XML
3. Matches elements by `text` or `content-desc` attributes
4. Returns center coordinates of matching element's bounds

### Text Input

`typeText()` in `input.ts` handles two modes:
- **ADBKeyboard** (preferred): Uses broadcast intents, works with React Native and Unicode
- **Standard input**: Falls back to `adb shell input text`, ASCII only

## Testing Commands

Requires a running Android emulator or connected device:

```bash
# Build first
bun run build

# Start emulator (if needed)
emulator -avd Pixel_7 &

# Test basic commands
node dist/index.js devices
node dist/index.js observe
node dist/index.js observe --visual /tmp/test.png
node dist/index.js observe --wait 1000           # Wait 1s then observe
node dist/index.js tap "Chrome"
node dist/index.js wait 2000                      # Sleep for 2s
node dist/index.js back
node dist/index.js scroll down
node dist/index.js swipe left
```

## ADB Commands Reference

The CLI wraps these underlying ADB commands:

```bash
adb devices                                    # List devices
adb exec-out screencap -p > screenshot.png     # Screenshot
adb shell uiautomator dump /sdcard/ui.xml      # UI hierarchy
adb shell input tap <x> <y>                    # Tap
adb shell input swipe <x1> <y1> <x2> <y2> <ms> # Swipe/scroll
adb shell input text "hello"                   # Type (basic)
adb shell am broadcast -a ADB_INPUT_TEXT --es msg 'text'  # Type (ADBKeyboard)
adb shell input keyevent <code>                # Key events (4=back, 3=home, 66=enter)
adb shell am start -n <package>/<activity>     # Launch app
adb shell am force-stop <package>              # Stop app
```

## Adding New Commands

1. Create command file in `src/commands/`
2. Export async function that takes `options: AdbOptions`
3. Use `success()`, `error()`, `info()` from `utils/output.ts` for output
4. Import and wire up in `src/index.ts`:
   - Add to imports
   - Add case in switch statement
   - Add to help text

## Code Style

- Strict TypeScript (no `any`, `noUncheckedIndexedAccess` enabled)
- Custom error classes over generic errors
- Explicit over implicit
- Functions do one thing
- All user output goes through `utils/output.ts`
