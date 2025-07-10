import * as vscode from "vscode";
import type { Environment } from "../env";
import { startTracing, stopTracing } from "../utilities/tracing";

export function initTelemetry(
  env: Environment,
): void {
  if (env.hasTracingEnabled) {
    startTracing(env);
  }
}

export async function stopTelemetry(env: Environment): Promise<void> {
  if (env?.sdk) {
    await stopTracing(env.sdk);
  }
}
