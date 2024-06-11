import * as vscode from "vscode";

import { VSCODE_CONFIG_KEY } from "./constants";
import { activateLsp, deactivateLsp, restartLsp } from "./lsp";
import { Environment } from "./env";
import { registerCommands } from "./commands";
import { createStatusBar } from "./statusBar";
import { SemgrepDocumentProvider } from "./showAstDocument";
import { ConfigurationChangeEvent, ExtensionContext } from "vscode";
import { SemgrepSearchWebviewProvider } from "./views/webview";
import { initTelemetry, stopTelemetry } from "./telemetry/telemetry";
import { SemgrepChatViewProvider } from "./ai-chat/AiChatProvidert";

export let global_env: Environment | null = null;

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
  if (!env.client) {
    vscode.window.showErrorMessage(
      "Semgrep Extension failed to activate, please check output",
    );
    return;
  }
  const statusBar = createStatusBar();
  registerCommands(env);
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
  env.searchProvider = provider;
  const semgrepChatViewProvider = new SemgrepChatViewProvider(
    context.extensionUri,
    context,
  );
  env.chatProvider = semgrepChatViewProvider;
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "semgrepChatView",
      semgrepChatViewProvider,
    ),
  );
  // register content provider for the AST showing document
  vscode.workspace.registerTextDocumentContentProvider(
    SemgrepDocumentProvider.scheme,
    env.documentView,
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
      const selection = await vscode.window.showInformationMessage(
        "Semgrep Extension succesfully installed. Would you like to try performing a full workspace scan (may take longer on bigger workspaces)?",
        "Scan Full Workspace",
        "Dismiss",
      );
      if (selection == "Scan Full Workspace") {
        vscode.commands.executeCommand("semgrep.scanWorkspaceFull");
      }
    }
  });
}

export async function activate(
  context: ExtensionContext,
): Promise<Environment | undefined> {
  initTelemetry(context.extensionMode);
  const env: Environment = await createOrUpdateEnvironment(context);
  await activateLsp(env);
  await afterClientStart(context, env);

  return env;
}

export async function deactivate(): Promise<void> {
  if (global_env?.client) {
    await deactivateLsp(global_env);
  }
  await stopTelemetry();
  global_env?.dispose();
  global_env = null;
}
