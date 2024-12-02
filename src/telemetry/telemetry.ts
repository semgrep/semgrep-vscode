import * as vscode from "vscode";
import type { Environment } from "../env";
import { initSentry, stopSentry } from "./sentry";

enum ExtensionEnvironment {
  Release = "release",
  Development = "development",
  Test = "test",
}
export function initTelemetry(
  extensionMode: vscode.ExtensionMode,
  env: Environment,
): void {
  if (!vscode.env.isTelemetryEnabled) {
    return;
  }
  let extensionEnvironment = ExtensionEnvironment.Release;
  switch (extensionMode) {
    case vscode.ExtensionMode.Development:
      extensionEnvironment = ExtensionEnvironment.Development;
      break;
    case vscode.ExtensionMode.Test:
      extensionEnvironment = ExtensionEnvironment.Test;
      break;
  }
  initSentry(extensionEnvironment, env);
}

export async function stopTelemetry(): Promise<void> {
  await stopSentry();
}
