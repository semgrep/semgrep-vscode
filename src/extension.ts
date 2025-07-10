import * as vscode from "vscode";

import { type ConfigurationChangeEvent, type ExtensionContext } from "vscode";
import { registerCommands } from "./commands";
import { VSCODE_CONFIG_KEY } from "./constants";
import { Environment } from "./env";
import { activateLsp, deactivateLsp, restartLsp } from "./lsp";
import { SemgrepDocumentProvider } from "./showAstDocument";
import { createStatusBar } from "./statusBar";
import { initTelemetry, stopTelemetry } from "./telemetry/telemetry";
import { ExtensionEnvironment, topLevelSpan, withSpan } from "./utilities/tracing";
import { SemgrepPolicyViewProvider } from "./views/policy";
import { SemgrepHelpProvider } from "./views/support";
import { SemgrepSearchWebviewProvider } from "./views/webview";
import { trace, context as otelContext } from "@opentelemetry/api";
import * as api from "@opentelemetry/api";

export let global_env: Environment | null = null;

// Step 2: Create a top-level span when your client starts
const tracer = trace.getTracer('semgrep-vscode');

async function initEnvironment(
  context: ExtensionContext,
): Promise<Environment> {
  global_env = await Environment.create(context);
  return global_env;
}

async function createOrUpdateEnvironment(
  context: ExtensionContext,
): Promise<Environment> {
  return global_env ? global_env.reloadConfig() : initEnvironment(context);
}

async function afterClientStart(context: ExtensionContext, env: Environment) {
  context.subscriptions.push(env);

  if (!env.client) {
    vscode.window.showErrorMessage(
      "Semgrep Extension failed to activate, please check output",
    );
    return;
  }
  const statusBar = createStatusBar();
  context.subscriptions.push(statusBar, ...registerCommands(env));
  statusBar.show();

  // register stuff for search webview
  const provider = new SemgrepSearchWebviewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SemgrepSearchWebviewProvider.viewType,
      provider,
      // This makes it so that we don't lose matches hwen we close the sidebar!
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );
  env.provider = provider;

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      SemgrepHelpProvider.viewType,
      new SemgrepHelpProvider(
        context.extensionUri,
        context.extension.packageJSON.version,
      ),
    ),
  );
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      SemgrepPolicyViewProvider.viewType,
      new SemgrepPolicyViewProvider(context.extensionUri, env),
    ),
  );

  // register content provider for the AST showing document
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      SemgrepDocumentProvider.scheme,
      env.documentView,
    ),
  );
  // Handle configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(
      async (event: ConfigurationChangeEvent) => {
        if (event.affectsConfiguration(VSCODE_CONFIG_KEY)) {
          await env.reloadConfig();
          restartLsp(env);
        }
      },
    ),
  );
  vscode.commands.executeCommand("semgrep.loginStatus").then(async () => {
    vscode.commands.executeCommand("semgrep.loginNudge");
    if (env.newInstall) {
      env.newInstall = false;

      await vscode.window.showInformationMessage(
        `VS Code collects usage data and sends it to Semgrep to help improve our products and services. Telemetry data includes extension runtime version details, and other metrics normally collected by Semgrep, [as described here](https://semgrep.dev/docs/metrics#data-collected-as-metrics).
        If you don't wish to send usage data to Semgrep, you can unset the \`Semgrep: Metrics\` setting.`,
      );

      const selection = await vscode.window.showInformationMessage(
        "Semgrep Extension successfully installed. Would you like to try performing a full workspace scan (may take longer on bigger workspaces)?",
        "Scan Full Workspace",
        "Dismiss",
      );
      if (selection == "Scan Full Workspace") {
        vscode.commands.executeCommand("semgrep.scanWorkspaceFull");
      }
    }
  });
}

function getExtensionMode(context: ExtensionContext): ExtensionEnvironment {
  if (process.env.SEMGREP_DEV_ENVIRONMENT) {
    return process.env.SEMGREP_DEV_ENVIRONMENT as ExtensionEnvironment;
  } else {
    if (context.extensionMode === ExtensionMode.Production) {
      return ExtensionEnvironment.Release;
    } else if (context.extensionMode === ExtensionMode.Development) {
      return ExtensionEnvironment.Development;
    } else {
      return ExtensionEnvironment.Test;
    }
  }
}

export async function activate(
  context: ExtensionContext,
): Promise<Environment | undefined> {
  const env: Environment = await createOrUpdateEnvironment(context);
  const extensionEnvironment: ExtensionEnvironment = getExtensionMode(context);
  initTelemetry(extensionEnvironment, env);


  // I can only link the spans properly if I say to run the context with the new span.
  await
    withSpan("activateLsp", {}, async () => activateLsp(env));
  await afterClientStart(context, env);

  console.log("activate");

  env.client?.clientOptions

  return env;
}

export async function deactivate(): Promise<void> {
  console.log("deactivate");
  if (global_env) {
    await stopTelemetry(global_env);

    if (global_env.client) {
      await deactivateLsp(global_env);
    }
  }
  global_env?.dispose();
  global_env = null;
}
