---
name: adbx
description: Use adbx for Android device automation instead of raw adb commands. Invoke when interacting with Android devices or emulators - tapping UI elements, taking screenshots, typing text, navigating apps, or automating mobile workflows.
---

# adbx

A semantic CLI for Android automation. Use this instead of raw `adb` commands.

## Installation

```bash
npm install -g adbx
```

## Commands

### Device & Screenshots
```bash
adbx devices                    # List connected devices
adbx screenshot                 # Save to ./screenshot.png
adbx screenshot ./path/to.png   # Save to specific path
```

### Tapping
```bash
adbx tap "Sign In"              # Tap element by text
adbx tap 540 1200               # Tap coordinates
adbx tap "Menu" --long          # Long press
adbx tap "Item" --index 2       # Tap 3rd match (0-indexed)
```

Tap finds elements by matching their `text` or `content-desc` attribute (case-insensitive substring match).

### Text Input
```bash
adbx type "hello@example.com"   # Type into focused field
adbx clear                      # Clear focused field
adbx enter                      # Press enter key
```

For React Native apps or Unicode/emoji, install [ADBKeyboard](https://github.com/senzhk/ADBKeyBoard) on the device. adbx auto-detects and uses it when available.

### Scrolling & Swiping
```bash
adbx scroll down                # Scroll down (vertical)
adbx scroll up                  # Scroll up
adbx swipe left                 # Swipe left (horizontal)
adbx swipe right                # Swipe right
```

### Navigation
```bash
adbx back                       # Press back button
adbx home                       # Press home button
```

### Waiting
```bash
adbx wait "Welcome"             # Wait for element to appear
adbx wait-gone "Loading..."     # Wait for element to disappear
adbx wait "Done" --timeout 30000  # Custom timeout (default: 10000ms)
```

### Discovery
```bash
adbx list                       # List all visible UI elements with coordinates
```

Output example:
```
Found 3 elements:
  "Sign In" at (540, 1200) [clickable]
  "Email" at (540, 800) [clickable]
  "Welcome" at (540, 400)
```

### App Control
```bash
adbx launch com.example.app     # Launch app
adbx stop com.example.app       # Force stop app
```

## Options

| Option | Description |
|--------|-------------|
| `--device <serial>` | Target specific device (required if multiple connected) |
| `--timeout <ms>` | Timeout for wait commands (default: 10000) |
| `--long` | Long press (tap only) |
| `--index <n>` | Select nth match when multiple found (tap only) |

## Error Handling

### Element not found
```
$ adbx tap "Nonexistent"
✗ Element "Nonexistent" not found

Visible elements:
  "Sign In"
  "Create Account"
```
Use `adbx list` to see available elements, or check if screen is in expected state.

### Multiple elements match
```
$ adbx tap "Button"
✗ Found 3 elements matching "Button". Use --index to specify which one (0-2).
```
Use `--index 0`, `--index 1`, etc. to select specific element.

### Multiple devices connected
```
$ adbx tap "Submit"
✗ Multiple devices connected. Use --device to specify:
  emulator-5554 (device)
  192.168.1.100:5555 (device)
```
Add `--device emulator-5554` to commands.

### Wait timeout
```
$ adbx wait "Dashboard"
✗ Timeout waiting for "Dashboard" (10000ms)
Visible elements: ["Loading...", "Please wait"]
```
Increase timeout or verify element text is correct.

## Typical Workflows

### Login Flow
```bash
adbx launch com.example.app
adbx wait "Login"
adbx tap "Email"
adbx type "user@example.com"
adbx tap "Password"
adbx type "secret123"
adbx tap "Sign In"
adbx wait "Dashboard"
adbx screenshot ./logged-in.png
```

### Navigate and Interact
```bash
adbx wait "Home"
adbx scroll down
adbx scroll down
adbx tap "Settings"
adbx wait "Settings"
adbx tap "Account"
```

### Handle Dialogs
```bash
adbx tap "Delete"
adbx wait "Are you sure?"
adbx tap "Confirm"
adbx wait-gone "Are you sure?"
```

### Debug Current State
```bash
adbx screenshot ./current.png
adbx list
```

### Multiple Devices
```bash
adbx devices
adbx tap "Submit" --device emulator-5554
```

## Best Practices

1. **Always `wait` after navigation** - screens take time to load
2. **Use `list` to discover elements** - don't guess element text
3. **Take screenshots for debugging** - see what's actually on screen
4. **Use `--index` for lists** - when multiple elements have similar text
5. **Use `wait-gone` for loading states** - wait for spinners to disappear before interacting
