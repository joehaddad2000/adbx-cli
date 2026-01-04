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
adbx tap "Sign In"              # Tap element by text or content-desc
adbx tap 540 1200               # Tap coordinates
adbx tap "Menu" --long          # Long press
adbx tap "Item" --index 2       # Tap 3rd match (0-indexed)
adbx tap "android:id/next" --id # Tap by resource-id
```

Tap finds elements by matching their `text` or `content-desc` attribute (case-insensitive substring match). Use `--id` to search by `resource-id` instead.

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
Found 5 elements:
  "Sign In" at (540, 1200) [clickable]
  "Email" at (540, 800) [clickable]
  "Next month" at (819, 921) [icon, clickable]
  "com.app:id/btn_submit" at (540, 1400) [id, clickable]
  "Welcome" at (540, 400)
```

Tags indicate how to tap each element:
- No tag = has `text` attribute, tap with `adbx tap "Sign In"`
- `[icon]` = has `content-desc`, tap with `adbx tap "Next month"`
- `[id]` = only has `resource-id`, tap with `adbx tap "com.app:id/btn_submit" --id`

### App Control
```bash
adbx launch com.example.app     # Launch app
adbx stop com.example.app       # Force stop app
```

## Element Types

Android UI elements can be identified by different attributes:

| Attribute | What it is | Example |
|-----------|-----------|---------|
| `text` | Visible text on buttons, labels | "Sign In", "Submit" |
| `content-desc` | Accessibility label for icons/images | "Next month", "Close" |
| `resource-id` | Developer-assigned ID | `android:id/next` |

**How adbx finds elements:**
- `adbx tap "Sign In"` → searches `text` and `content-desc`
- `adbx tap "android:id/next" --id` → searches `resource-id`

**Common patterns:**
| You see | What to tap | Why |
|---------|-------------|-----|
| "Sign In" button | `adbx tap "Sign In"` | Has `text="Sign In"` |
| ">" arrow icon | `adbx tap "Next month"` | Has `content-desc="Next month"` |
| "×" close icon | `adbx tap "Close"` | Has `content-desc="Close"` |
| Unlabeled button | `adbx tap "btn_submit" --id` | Has `resource-id` only |

**Tip:** Icons and images don't have text—they have accessibility labels (`content-desc`). Use `adbx list` to discover what's available. Elements marked `[icon]` in the output are `content-desc` values.

## Options

| Option | Description |
|--------|-------------|
| `--device <serial>` | Target specific device (required if multiple connected) |
| `--timeout <ms>` | Timeout for wait commands (default: 10000) |
| `--long` | Long press (tap only) |
| `--index <n>` | Select nth match when multiple found (tap only) |
| `--id` | Search by resource-id instead of text/content-desc (tap only) |

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
