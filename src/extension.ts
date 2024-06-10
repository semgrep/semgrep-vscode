import * as vscode from "vscode";

import { VSCODE_CONFIG_KEY } from "./constants";
import { activateLsp, deactivateLsp, restartLsp } from "./lsp";
import { Environment } from "./env";
import { registerCommands } from "./commands";
import { createStatusBar } from "./statusBar";
import * as fs from "fs";
import { SemgrepDocumentProvider } from "./showAstDocument";
import { ConfigurationChangeEvent, ExtensionContext } from "vscode";
import { SemgrepSearchWebviewProvider } from "./views/webview";
import { initTelemetry, stopTelemetry } from "./telemetry/telemetry";

export let global_env: Environment | null = null;

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

async function afterClientStart(context: ExtensionContext, env: Environment) {
  if (!env.client) {
    vscode.window.showErrorMessage(
      "Semgrep Extension failed to activate, please check output"
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
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
  env.provider = provider;

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
          restartLsp(env);
        }
      }
    )
  );
  vscode.commands.executeCommand("semgrep.loginStatus").then(async () => {
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
  });
}

export async function activate(
  context: ExtensionContext
): Promise<Environment | undefined> {
  initTelemetry(context.extensionMode);
  const env: Environment = await createOrUpdateEnvironment(context);
  await activateLsp(env);
  await afterClientStart(context, env);
  const semgrepChatViewProvider = new SemgrepChatViewProvider(
    context.extensionUri,
    context
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "semgrepChatView",
      semgrepChatViewProvider
    )
  );
  // Register the command to open the chat
  const disposable = vscode.commands.registerCommand("semgrep.openChat", () => {
    // Reveal the sidebar view programmatically
    vscode.commands.executeCommand("workbench.view.extension.semgrepChat");
  });

  context.subscriptions.push(disposable);

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
class SemgrepChatViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  // Constructor now takes the extension context
  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Correctly manage the subscription
    const messageHandler = webviewView.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;
        }
      },
      null, // Optional: context.subscriptions can be used here if needed for other disposables
      this._context.subscriptions // Correctly add to the extension's subscriptions
    );

    // If you need to directly add the subscription
    this._context.subscriptions.push(messageHandler);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const uri = vscode.Uri.joinPath(this._extensionUri, "src", "chat.html");

    return fs.readFileSync(uri.fsPath, "utf8");
  }
}
