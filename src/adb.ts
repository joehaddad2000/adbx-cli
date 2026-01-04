/**
 * Core ADB command execution layer.
 *
 * This module provides a typed interface for executing ADB commands
 * with proper error handling and device targeting.
 */

import { execa, ExecaError } from "execa";

// ============================================================================
// Error Types
// ============================================================================

export class AdbError extends Error {
  constructor(
    message: string,
    public readonly command: string,
    public readonly exitCode: number,
    public readonly stderr: string
  ) {
    super(message);
    this.name = "AdbError";
  }
}

export class AdbNotFoundError extends Error {
  constructor() {
    super(
      "adb not found. Please install Android SDK Platform Tools and ensure adb is in your PATH."
    );
    this.name = "AdbNotFoundError";
  }
}

export class NoDevicesError extends Error {
  constructor() {
    super(
      `No devices connected.
  Start an emulator from Android Studio, or run:
    emulator -avd <name> &
  Then retry.`
    );
    this.name = "NoDevicesError";
  }
}

export class MultipleDevicesError extends Error {
  constructor(public readonly devices: DeviceInfo[]) {
    const deviceList = devices
      .map((d) => `  ${d.serial} (${d.state})`)
      .join("\n");
    super(
      `Multiple devices connected. Use --device to specify:\n${deviceList}`
    );
    this.name = "MultipleDevicesError";
  }
}

export class DeviceNotFoundError extends Error {
  constructor(serial: string, availableDevices: DeviceInfo[]) {
    const available =
      availableDevices.length > 0
        ? `\nAvailable devices:\n${availableDevices.map((d) => `  ${d.serial}`).join("\n")}`
        : "\nNo devices connected.";
    super(`Device "${serial}" not found.${available}`);
    this.name = "DeviceNotFoundError";
  }
}

// ============================================================================
// Types
// ============================================================================

export interface DeviceInfo {
  serial: string;
  state: "device" | "offline" | "unauthorized" | "unknown";
}

export interface AdbResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface AdbOptions {
  /** Target device serial. If not provided, auto-selects when only one device is connected. */
  device?: string;
  /** Timeout in milliseconds. Default: 30000 */
  timeout?: number;
}

// ============================================================================
// Core Execution
// ============================================================================

/**
 * Execute a promise with a timeout.
 * Properly cleans up the timer to avoid keeping the process alive.
 */
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  command: string
): Promise<T> {
  let timeoutId: Timer | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new AdbError(`Command timed out after ${ms}ms`, command, -1, ""));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Execute a raw ADB command and return the result.
 * This is the lowest-level function — prefer higher-level wrappers when possible.
 */
export async function execAdb(
  args: string[],
  options: AdbOptions = {}
): Promise<AdbResult> {
  const { device, timeout = 30000 } = options;

  const fullArgs = device ? ["-s", device, ...args] : args;
  const command = `adb ${fullArgs.join(" ")}`;

  try {
    const result = await withTimeout(
      execa("adb", fullArgs, { reject: false }),
      timeout,
      command
    );

    const exitCode = result.exitCode ?? 0;
    if (exitCode !== 0) {
      throw new AdbError(
        `ADB command failed: ${command}`,
        command,
        exitCode,
        result.stderr
      );
    }

    return {
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
      exitCode,
    };
  } catch (error) {
    // Handle command not found
    if (error instanceof Error && error.message.includes("ENOENT")) {
      throw new AdbNotFoundError();
    }

    // Re-throw our own errors
    if (error instanceof AdbError) {
      throw error;
    }

    // Handle execa errors
    if (error instanceof ExecaError) {
      throw new AdbError(
        `ADB command failed: ${command}`,
        command,
        error.exitCode ?? 1,
        error.stderr ?? ""
      );
    }

    throw error;
  }
}

/**
 * Execute an ADB shell command on the device.
 */
export async function execShell(
  shellCommand: string,
  options: AdbOptions = {}
): Promise<string> {
  const result = await execAdb(["shell", shellCommand], options);
  return result.stdout;
}

/**
 * Execute an ADB command and stream output directly (for binary data like screenshots).
 */
export async function execAdbRaw(
  args: string[],
  options: AdbOptions = {}
): Promise<Uint8Array> {
  const { device, timeout = 30000 } = options;

  const fullArgs = device ? ["-s", device, ...args] : args;
  const command = `adb ${fullArgs.join(" ")}`;

  try {
    const result = await withTimeout(
      execa({ reject: false, encoding: "buffer" })`adb ${fullArgs}`,
      timeout,
      command
    );

    return result.stdout;
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENOENT")) {
      throw new AdbNotFoundError();
    }
    if (error instanceof AdbError) {
      throw error;
    }
    throw error;
  }
}

// ============================================================================
// Device Management
// ============================================================================

/**
 * List all connected devices.
 */
export async function listDevices(): Promise<DeviceInfo[]> {
  const result = await execAdb(["devices"]);
  const lines = result.stdout.split("\n").slice(1); // Skip header "List of devices attached"

  const devices: DeviceInfo[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const [serial, stateStr] = trimmed.split(/\s+/);
    if (!serial || !stateStr) continue;

    const state =
      stateStr === "device" ||
      stateStr === "offline" ||
      stateStr === "unauthorized"
        ? stateStr
        : "unknown";

    devices.push({ serial, state });
  }

  return devices;
}

/**
 * Get the device to use for commands.
 *
 * - If `explicitDevice` is provided, validates it exists
 * - If only one device is connected, returns it
 * - If multiple devices, throws MultipleDevicesError
 * - If no devices, throws NoDevicesError
 */
export async function getDevice(explicitDevice?: string): Promise<string> {
  const devices = await listDevices();

  // Filter to only online devices
  const onlineDevices = devices.filter((d) => d.state === "device");

  if (explicitDevice) {
    const found = devices.find((d) => d.serial === explicitDevice);
    if (!found) {
      throw new DeviceNotFoundError(explicitDevice, devices);
    }
    if (found.state !== "device") {
      throw new AdbError(
        `Device "${explicitDevice}" is ${found.state}, not ready`,
        "adb devices",
        1,
        ""
      );
    }
    return explicitDevice;
  }

  if (onlineDevices.length === 0) {
    throw new NoDevicesError();
  }

  if (onlineDevices.length > 1) {
    throw new MultipleDevicesError(onlineDevices);
  }

  // We know there's exactly one device at this point
  const device = onlineDevices[0];
  if (!device) {
    throw new NoDevicesError();
  }

  return device.serial;
}

/**
 * Get screen dimensions of the device.
 */
export async function getScreenSize(
  options: AdbOptions = {}
): Promise<{ width: number; height: number }> {
  const output = await execShell("wm size", options);
  // Output format: "Physical size: 1080x2400"
  const match = output.match(/(\d+)x(\d+)/);
  if (!match || !match[1] || !match[2]) {
    throw new AdbError(
      "Could not parse screen size",
      "adb shell wm size",
      0,
      output
    );
  }
  return {
    width: parseInt(match[1], 10),
    height: parseInt(match[2], 10),
  };
}
