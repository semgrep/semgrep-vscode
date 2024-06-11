import * as vscode from "vscode";
import * as fs from "fs";
import { AiChatMessage } from "../lspExtensions";

export class SemgrepChatViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  public example?: string;
  public language?: string;
  // Constructor now takes the extension context
  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext,
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Correctly manage the subscription
    const messageHandler = webviewView.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "semgrep/init":
            vscode.commands.executeCommand("semgrep/postChat", {
              message: {
                role: "user",
                content: message.message,
              },
              init_ai_params: {
                example: this.example!,
                language: this.language!,
              },
            });
            return;
          case "semgrep/postChat":
            vscode.commands.executeCommand("semgrep/postChat", {
              message: {
                role: "user",
                content: message.message,
              },
            });
            return;
        }
      },
      null, // Optional: context.subscriptions can be used here if needed for other disposables
      this._context.subscriptions, // Correctly add to the extension's subscriptions
    );

    // If you need to directly add the subscription
    this._context.subscriptions.push(messageHandler);
  }
  public addMessage(message: AiChatMessage): void {
    this._view?.webview.postMessage({
      command: "semgrep/postChat",
      message: message.content,
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const uri = vscode.Uri.joinPath(
      this._extensionUri,
      "src",
      "ai-chat",
      "chat.html",
    );

    return fs.readFileSync(uri.fsPath, "utf8");
  }
}
