/**
 * List connected Android devices and emulators.
 */

import { listDevices } from "../adb.ts";
import { info } from "../utils/output.ts";

export async function devicesCommand(): Promise<void> {
  const devices = await listDevices();

  if (devices.length === 0) {
    info("No devices connected.");
    return;
  }

  info("Connected devices:");
  for (const device of devices) {
    const status = device.state === "device" ? "" : ` (${device.state})`;
    info(`  ${device.serial}${status}`);
  }
}
