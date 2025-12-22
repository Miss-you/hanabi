import { TUNING } from "@/config/tuning";

const diagnosticsEnabled = TUNING.diagnostics.enabled;

export const logDebug = (...args: unknown[]): void => {
  if (!diagnosticsEnabled) return;
  console.log(...args);
};

export const logInfo = (...args: unknown[]): void => {
  if (!diagnosticsEnabled) return;
  console.info(...args);
};
