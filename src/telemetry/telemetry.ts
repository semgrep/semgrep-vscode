import * as vscode from "vscode";
import type { Environment } from "../env";
import {
  ExtensionEnvironment,
  startTracing,
  stopTracing,
} from "../utilities/tracing";

export function initTelemetry(
  extensionEnvironment: ExtensionEnvironment,
  env: Environment,
): void {
  if (!vscode.env.isTelemetryEnabled) {
    return;
  }
  startTracing(env, extensionEnvironment);
}

export async function stopTelemetry(env: Environment): Promise<void> {
  if (env?.sdk) {
    await stopTracing(env.sdk);
  }
}
