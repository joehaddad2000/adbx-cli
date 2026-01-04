# adbx

[![npm version](https://img.shields.io/npm/v/adbx.svg)](https://www.npmjs.com/package/adbx)
[![npm downloads](https://img.shields.io/npm/dm/adbx.svg)](https://www.npmjs.com/package/adbx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A semantic CLI wrapper around ADB designed for LLMs to interact with Android devices.

## Why

Standard ADB commands require coordinate calculations, XML parsing, and arcane syntax. This makes it difficult for LLMs to reliably automate Android devices.

adbx provides semantic commands:

```bash
# Instead of calculating coordinates and parsing UI dumps...
adb shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml
# ...then parsing XML to find bounds="[540,1200][620,1280]"
# ...then calculating center point (580, 1240)
adb shell input tap 580 1240

# Just do this:
adbx tap "Submit"
```

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

```
/plugin marketplace add joehaddad2000/adbx-cli
/plugin install adbx
```

## Usage

### Basic Commands

```bash
adbx devices                    # List connected devices
adbx screenshot                 # Save screenshot to ./screenshot.png
adbx screenshot ./path/to.png   # Save to specific path

adbx tap "Sign In"              # Tap element containing text
adbx tap 540 1200               # Tap at coordinates
adbx tap "Menu" --long          # Long press
adbx tap "Item" --index 2       # Tap the 3rd match (0-indexed)

adbx type "hello@example.com"   # Type into focused field
adbx clear                      # Clear focused field
adbx enter                      # Press enter key

adbx scroll down                # Scroll down (vertical)
adbx scroll up                  # Scroll up
adbx swipe left                 # Swipe left (horizontal)
adbx swipe right                # Swipe right

adbx back                       # Press back button
adbx home                       # Press home button

adbx wait "Welcome"             # Wait for element to appear
adbx wait-gone "Loading..."     # Wait for element to disappear

adbx list                       # List visible UI elements
adbx launch com.example.app     # Launch app
adbx stop com.example.app       # Force stop app
```

### Options

```bash
--device <serial>    # Target specific device (required if multiple connected)
--timeout <ms>       # Override timeout for wait commands (default: 10000)
--long               # Long press (tap only)
--index <n>          # Select nth match when multiple elements found (tap only)
```

### Example Workflow

```bash
# Launch app and navigate
adbx launch com.example.myapp
adbx wait "Login"
adbx tap "Email"
adbx type "user@example.com"
adbx tap "Password"
adbx type "secretpassword"
adbx tap "Sign In"
adbx wait "Dashboard"
adbx screenshot ./logged-in.png
```

## How It Works

### Element Finding

When you run `adbx tap "Submit"`, the CLI:

1. Dumps the UI hierarchy via `adb shell uiautomator dump`
2. Parses the XML to find elements where `text` or `content-desc` contains "Submit"
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
| `screenshot [path]` | Capture screenshot (default: ./screenshot.png) |
| `tap <text>` | Tap element by text or content-desc |
| `tap <x> <y>` | Tap at exact coordinates |
| `type <text>` | Type text into focused input field |
| `clear` | Clear text in focused input field |
| `scroll up\|down` | Scroll vertically |
| `swipe left\|right` | Swipe horizontally |
| `wait <text>` | Wait for element to appear (with timeout) |
| `wait-gone <text>` | Wait for element to disappear |
| `back` | Press back button |
| `home` | Press home button |
| `enter` | Press enter/return key |
| `list` | List all visible UI elements with coordinates |
| `launch <package>` | Launch app by package name |
| `stop <package>` | Force stop app |

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
