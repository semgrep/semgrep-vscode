import * as vscode from "vscode";
import { initSentry, stopSentry } from "./sentry";

enum ExtensionEnvironment {
  Release = "release",
  Development = "development",
  Test = "test",
}
export function initTelemetry(extensionMode: vscode.ExtensionMode): void {
  if (!vscode.env.isTelemetryEnabled) {
    return;
  }
  let environment = ExtensionEnvironment.Release;
  switch (extensionMode) {
    case vscode.ExtensionMode.Development:
      environment = ExtensionEnvironment.Development;
      break;
    case vscode.ExtensionMode.Test:
      environment = ExtensionEnvironment.Test;
      break;
  }
  initSentry(environment);
}

export async function stopTelemetry(): Promise<void> {
  await stopSentry();
}
