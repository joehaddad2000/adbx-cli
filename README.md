# adbx

[![npm version](https://img.shields.io/npm/v/adbx.svg)](https://www.npmjs.com/package/adbx)
[![npm downloads](https://img.shields.io/npm/dm/adbx.svg)](https://www.npmjs.com/package/adbx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A semantic CLI wrapper around ADB designed for LLMs to interact with Android devices.

## Why

Standard ADB commands require coordinate calculations, XML parsing, and arcane syntax. adbx provides semantic commands that work with element text instead of coordinates.

### Before vs After

| Task | Raw ADB | adbx |
|------|---------|------|
| Tap a button | `adb shell uiautomator dump ...` → parse XML → find bounds → calculate center → `adb shell input tap 580 1240` | `adbx tap "Submit"` |
| See what's on screen | Dump XML, pull file, read manually | `adbx observe` |
| Type text with spaces | Escape manually: `adb shell input text "hello%sworld"` | `adbx type "hello world"` |
| Find why a tap failed | Re-dump XML, search through it | Error shows visible elements |

### Key Benefits

**Smart element selection** — When multiple elements match (e.g., a text label and its clickable parent), adbx automatically selects the interactive one. No manual XML inspection needed.

**Actionable errors** — When an element isn't found, adbx shows what *is* on screen:
```
✗ Element "Submit" not found

Visible elements:
  "Sign In"
  "Create Account"
```

**Structured output** — `observe` returns a consistent format that's easy to parse and reason about, with coordinates ready for tapping.

**Text input that works** — Handles spaces, special characters, and Unicode. Auto-detects ADBKeyboard for React Native apps.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- Android SDK Platform Tools (`adb` in PATH)
- A connected Android device or running emulator

### Install globally

```bash
npm install -g adbx
# or: pnpm add -g adbx
# or: yarn global add adbx
# or: bun add -g adbx
```

### Run without installing

```bash
npx adbx <command>
```

### Claude Code Integration

Add the adbx skill to Claude Code so it automatically uses adbx for Android automation:

```bash
# Install
claude plugin marketplace add joehaddad2000/adbx-cli
claude plugin install adbx

# Update (when new versions are available)
claude plugin update adbx
```

## Usage

### Observe Screen State

The primary command for understanding what's on screen:

```bash
adbx observe                    # Get element list
adbx observe --visual           # Include screenshot
adbx observe --visual ./s.png   # Screenshot at specific path
adbx observe --wait 2000        # Wait 2s before observing
```

Output:
```
=== SCREEN STATE ===
Elements: 5

  "Sign In" at (540, 1200) [enabled]
  "Email" at (540, 800) [enabled]
  "Next month" at (819, 921) [icon, enabled]
  "com.app:id/btn_submit" at (540, 1400) [id, enabled]
  "Welcome" at (540, 400)

Screenshot: /path/to/screenshot.png
```

### Basic Commands

```bash
adbx devices                    # List connected devices

adbx tap "Sign In"              # Tap element containing text
adbx tap 540 1200               # Tap at coordinates
adbx tap "Menu" --long          # Long press
adbx tap "Item" --index 2       # Tap the 3rd match (0-indexed)
adbx tap "android:id/next" --id # Tap by resource-id

adbx type "hello@example.com"   # Type into focused field
adbx clear                      # Clear focused field
adbx enter                      # Press enter key

adbx scroll down                # Scroll down (vertical)
adbx scroll up                  # Scroll up
adbx swipe left                 # Swipe left (horizontal)
adbx swipe right                # Swipe right

adbx back                       # Press back button
adbx home                       # Press home button

adbx wait 2000                  # Wait (sleep) for 2 seconds

adbx packages                   # List user-installed apps
adbx packages goal              # Search by name
adbx packages --all             # Include system packages
adbx launch com.example.app     # Launch app
adbx stop com.example.app       # Force stop app
adbx clear-data com.example.app # Clear app data
```

### Options

```bash
--device <serial>    # Target specific device (required if multiple connected)
--timeout <ms>       # Override command timeout (default: 10000)
--long               # Long press (tap only)
--index <n>          # Select nth match when multiple elements found (tap only)
--id                 # Search by resource-id instead of text (tap only)
--visual, -v         # Include screenshot (observe only)
--wait <ms>, -w      # Wait before observing (observe only)
--all, -a            # Include system packages (packages only)
```

### Example Workflow

```bash
# Launch app and navigate
adbx observe                          # Check initial state
adbx launch com.example.myapp
adbx observe --wait 2000              # Wait for app to load, then observe
adbx tap "Email"
adbx type "user@example.com"
adbx tap "Password"
adbx type "secretpassword"
adbx tap "Sign In"
adbx wait 3000                        # Wait for login to complete
adbx observe --visual ./logged-in.png # Verify and capture
```

## How It Works

### Element Finding

When you run `adbx tap "Submit"`, the CLI:

1. Dumps the UI hierarchy via `adb shell uiautomator dump`
2. Parses the XML to find elements where `text` or `content-desc` matches "Submit"
3. Extracts the element's bounds (e.g., `[100,200][300,250]`)
4. Calculates the center point (200, 225)
5. Executes `adb shell input tap 200 225`

### Text Input

For text input, adbx uses standard `adb shell input text` which works for most native Android apps.

For React Native apps or Unicode input, install [ADBKeyboard](https://github.com/senzhk/ADBKeyBoard) on the device. adbx automatically detects and uses it when available.

### Multiple Devices

When multiple devices are connected, adbx requires explicit device selection:

```bash
adbx devices                          # List devices
adbx tap "Submit" --device emulator-5554
```

If only one device is connected, it's selected automatically.

## Command Reference

| Command | Description |
|---------|-------------|
| `devices` | List connected devices and emulators |
| `observe [path]` | Get screen state (elements + optional screenshot) |
| `tap <text>` | Tap element by text or content-desc |
| `tap <x> <y>` | Tap at exact coordinates |
| `type <text>` | Type text into focused input field |
| `clear` | Clear text in focused input field |
| `scroll up\|down` | Scroll vertically |
| `swipe left\|right` | Swipe horizontally |
| `wait <ms>` | Wait (sleep) for specified milliseconds |
| `back` | Press back button |
| `home` | Press home button |
| `enter` | Press enter/return key |
| `packages [query]` | List/search installed packages |
| `launch <package>` | Launch app by package name |
| `stop <package>` | Force stop app |
| `clear-data <package>` | Clear app data (cache, settings, databases) |

## Error Handling

adbx provides clear error messages with context:

```
$ adbx tap "Nonexistent"
✗ Element "Nonexistent" not found

Visible elements:
  "Sign In"
  "Create Account"
  "Forgot Password"
```

```
$ adbx scroll left
✗ scroll requires direction: up or down
```

## License

MIT
