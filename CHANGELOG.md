# Changelog

## 0.3.0

### Breaking Changes

- **Removed `list` command** — Use `observe` instead
- **Removed `screenshot` command** — Use `observe --visual` instead
- **Removed `wait <text>` and `wait-gone`** — Element-based waiting removed; use `observe --wait <ms>` instead

### New Features

- **`observe` command** — Unified way to see screen state
  - Always returns element list with coordinates
  - `--visual` flag to include screenshot
  - `--wait <ms>` flag to let screen settle before observing
- **Smart element selection** — When multiple elements match but only one is interactive (clickable + enabled), it's auto-selected. No more unnecessary `--index` flags.
- **Update notifications** — CLI checks for updates daily and notifies when a new version is available

### Improvements

- Better error messages when no tappable elements match
- Simplified `wait` command — Now just `wait <ms>` for simple delays
- Cleaner README with before/after comparison table

## 0.2.x

Initial development releases.
