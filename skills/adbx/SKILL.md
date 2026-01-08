---
name: adbx
description: Use adbx for Android device automation instead of raw adb commands. Invoke when interacting with Android devices or emulators - tapping UI elements, typing text, navigating apps, or automating mobile workflows.
---

# adbx

A semantic CLI for Android automation. Use this instead of raw `adb` commands.

## Installation

```bash
npm install -g adbx
```

## Commands

### Observe Screen State
```bash
adbx observe                    # Get screen state (element list)
adbx observe --visual           # Include screenshot
adbx observe --visual ./s.png   # Screenshot at specific path
adbx observe --wait 2000        # Wait 2s before observing
adbx observe --wait 1500 --visual  # Wait, then observe with screenshot
```

Output example:
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

**Always use `observe` to understand the current screen.**
- Provides element positions for precise tapping
- Add `--visual` when you need to see the actual screen (icons, layout, verify state)
- Add `--wait` to let the screen settle after navigation

Tags indicate how to tap each element:
- No tag = has `text` attribute, tap with `adbx tap "Sign In"`
- `[icon]` = has `content-desc`, tap with `adbx tap "Next month"`
- `[id]` = only has `resource-id`, tap with `adbx tap "com.app:id/btn_submit" --id`

### Devices
```bash
adbx devices                    # List connected devices
```

### Tapping
```bash
adbx tap "Sign In"              # Tap element by text or content-desc
adbx tap 540 1200               # Tap coordinates
adbx tap "Menu" --long          # Long press
adbx tap "Item" --index 2       # Tap 3rd match (0-indexed)
adbx tap "android:id/next" --id # Tap by resource-id
```

Tap finds elements by matching their `text` or `content-desc` attribute (case-insensitive exact match). Use `--id` to search by `resource-id` instead.

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
adbx wait 2000                  # Wait (sleep) for 2 seconds
adbx wait 500                   # Wait 500ms
```

Use `wait` for simple delays between actions. For waiting after navigation, prefer `observe --wait` to also see the screen state.

### Package Discovery
```bash
adbx packages                   # List user-installed apps
adbx packages goal              # Search apps containing "goal"
adbx packages --all             # Include system packages
adbx packages android --all     # Search all packages
```

**Important:** Always search for package names first—don't guess! Package names are often different from app names.

### App Control
```bash
adbx launch com.example.app     # Launch app
adbx stop com.example.app       # Force stop app
adbx clear-data com.example.app # Clear app data (reset to fresh install)
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

**Tip:** Icons and images don't have text—they have accessibility labels (`content-desc`). Use `adbx observe` to discover what's available. Elements marked `[icon]` in the output are `content-desc` values.

## Options

| Option | Description |
|--------|-------------|
| `--device <serial>` | Target specific device (required if multiple connected) |
| `--timeout <ms>` | Command timeout (default: 10000) |
| `--long` | Long press (tap only) |
| `--index <n>` | Select nth match when multiple found (tap only) |
| `--id` | Search by resource-id instead of text/content-desc (tap only) |
| `--visual, -v` | Include screenshot (observe only) |
| `--wait <ms>, -w` | Wait before observing (observe only) |
| `--all, -a` | Include system packages (packages only) |

## Error Handling

### Element not found
```
$ adbx tap "Nonexistent"
✗ Element "Nonexistent" not found

Visible elements:
  "Sign In"
  "Create Account"
```
Use `adbx observe` to see available elements, or check if screen is in expected state.

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

## Typical Workflows

### Login Flow
```bash
adbx observe                              # Check initial state
adbx launch com.example.app
adbx observe --wait 2000                  # Wait for app to load, see elements
adbx tap "Email"
adbx type "user@example.com"
adbx tap "Password"
adbx type "secret123"
adbx tap "Sign In"
adbx wait 3000                            # Wait for login
adbx observe --visual ./logged-in.png     # Verify + capture
```

### Navigate and Interact
```bash
adbx observe                              # See current screen
adbx scroll down
adbx scroll down
adbx tap "Settings"
adbx observe --wait 1000                  # Wait for screen, see options
adbx tap "Account"
```

### Handle Dialogs
```bash
adbx tap "Delete"
adbx observe --wait 500                   # Wait for dialog, verify it appeared
adbx tap "Confirm"
adbx wait 500                             # Wait for dialog to dismiss
adbx observe                              # Verify dialog is gone
```

### Debug Current State
```bash
adbx observe                              # Quick element list
adbx observe --visual                     # With screenshot for visual verification
```

### Multiple Devices
```bash
adbx devices
adbx tap "Submit" --device emulator-5554
```

### Reset App to Fresh State
```bash
adbx packages goal              # Find the package name first
adbx clear-data com.goals.app   # Clear all app data
adbx launch com.goals.app       # Relaunch (will show onboarding)
```

## Best Practices

1. **Use `observe` after every action** - understand what happened before continuing
2. **Use `observe --wait` after navigation** - let the screen settle before reading elements
3. **Use `packages` to find package names** - don't guess, search first
4. **Add `--visual` when uncertain** - see the actual screen when debugging
5. **Use `--index` for lists** - when multiple elements have similar text
6. **Use simple `wait` sparingly** - prefer `observe --wait` to also see what's on screen
