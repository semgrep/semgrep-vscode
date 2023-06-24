import * as vscode from "vscode";

import { VSCODE_CONFIG_KEY } from "./constants";
import { activateLsp, deactivateLsp, restartLsp } from "./lsp";
import { Environment } from "./env";
import { registerCommands } from "./commands";
import { LanguageClient } from "vscode-languageclient/node";
import { createStatusBar } from "./statusBar";
import { SemgrepDocumentProvider } from "./showAstDocument";
import { ConfigurationChangeEvent, ExtensionContext } from "vscode";

let global_env: Environment | null = null;
// needed for deactivate
let global_client: LanguageClient | null = null;
async function initEnvironment(
  context: ExtensionContext
): Promise<Environment> {
  global_env = await Environment.create(context);
  return global_env;
}

async function createOrUpdateEnvironment(
  context: ExtensionContext
): Promise<Environment> {
  return global_env ? global_env.reloadConfig() : initEnvironment(context);
}

export async function activate(
  context: ExtensionContext
): Promise<LanguageClient | null> {
  const env: Environment = await createOrUpdateEnvironment(context);

  const client = await activateLsp(env);
  global_client = client;
  const statusBar = createStatusBar();
  if (client) {
    registerCommands(env, client);
    statusBar.show();
    vscode.window.registerTreeDataProvider(
      "semgrep-search-results",
      env.searchView
    );

    // register content provider for the AST showing document
    vscode.workspace.registerTextDocumentContentProvider(
      SemgrepDocumentProvider.scheme,
      env.documentView
    );

    // Handle configuration changes
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(
        async (event: ConfigurationChangeEvent) => {
          if (event.affectsConfiguration(VSCODE_CONFIG_KEY)) {
            await env.reloadConfig();
            client.sendNotification("workspace/didChangeConfiguration", {
              settings: env.config.cfg,
            });
          }
        }
      )
    );
    await vscode.commands.executeCommand("semgrep.loginStatus");
    vscode.commands.executeCommand("semgrep.loginNudge");
    if (env.newInstall) {
      env.newInstall = false;
      const selection = await vscode.window.showInformationMessage(
        "Semgrep Extension succesfully installed. Would you like to try performing a full workspace scan (may take longer on bigger workspaces)?",
        "Scan Full Workspace",
        "Dismiss"
      );
      if (selection == "Scan Full Workspace") {
        vscode.commands.executeCommand("semgrep.scanWorkspaceFull");
      }
    }
  } else {
    vscode.window.showErrorMessage("Failed to load Semgrep Extension");
  }
  vscode.window.activeTextEditor;
  return client;
}

export async function deactivate(): Promise<void> {
  if (global_client) {
    await deactivateLsp(global_env, global_client);
  }
  global_env?.dispose();
  global_env = null;
}

export async function restart(
  context: ExtensionContext,
  client: LanguageClient
): Promise<void> {
  const env: Environment = await createOrUpdateEnvironment(context);

  env.logger.log("Restarting language client...");
  await restartLsp(env, client);
  env.logger.log("Restarted language client...");
}
