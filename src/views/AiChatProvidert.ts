import * as vscode from "vscode";
import * as fs from "fs";
import { AiChatMessage } from "../lspExtensions";
import { randomUUID } from "crypto";
import {
  init,
  postChat,
  setExample,
  webviewPostChat,
} from "../interface/interface";

export class SemgrepChatViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private example?: string;
  private language?: string;
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
          case init:
            vscode.commands.executeCommand("semgrep/postChat", {
              message: message.message,
              init_ai_params: {
                example: this.example!,
                language: this.language!,
              },
            });
            return;
          case webviewPostChat:
            vscode.commands.executeCommand("semgrep/postChat", {
              message: message.message,
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
      command: postChat,
      message: message,
    });
  }

  public setExample(example: string, language: string): void {
    this.example = example;
    this.language = language;
    this._view?.webview.postMessage({
      command: setExample,
      example: example,
      language: language,
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const assetsPath = vscode.Uri.joinPath(this._extensionUri, "out");

    // The CSS file from the React build output
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(assetsPath, "ai-chat-webview.css"),
    );
    // The JS file from the React build output
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(assetsPath, "ai-chat-webview.js"),
    );
    // The global CSS file
    const globalStylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "global.css"),
    );

    const nonce = randomUUID();

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <link rel="stylesheet" type="text/css" href="${globalStylesUri}">
          <title>Semgrep Chat</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
}
