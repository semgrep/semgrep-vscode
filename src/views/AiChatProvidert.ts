import * as vscode from "vscode";
import * as fs from "fs";
import { AiChatMessage } from "../lspExtensions";
import { randomUUID } from "crypto";
import {
  RulePostParams,
  init,
  postChat,
  sendToApp,
  removeExample,
  setBadExample,
  setGoodExample,
  webviewPostChat,
} from "../interface/interface";

export class SemgrepChatViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private goodExamples?: string[] = [];
  private badExamples?: string[] = [];
  private language?: string = "python";
  // Constructor now takes the extension context
  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
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
                goodExamples: this.goodExamples,
                badExamples: this.badExamples,
                language: this.language,
              },
            });
            return;
          case sendToApp:
            this.sendToApp(message.message);
            return;
          case webviewPostChat:
            vscode.commands.executeCommand("semgrep/postChat", {
              message: message.message,
            });
            return;
          case removeExample:
            vscode.commands.executeCommand("semgrep/removeExample", {
              good: message.good,
              example: message.example,
            });
        }
      },
      null, // Optional: context.subscriptions can be used here if needed for other disposables
      this._context.subscriptions // Correctly add to the extension's subscriptions
    );

    // If you need to directly add the subscription
    this._context.subscriptions.push(messageHandler);
  }
  private sendToApp(message: RulePostParams): void {
    fetch("http://localhost:3000/api/registry/rule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        const link = data["meta"]["rule"]["url"];
        const parsedLink = link.replace("https", "http");
        vscode.env.openExternal(vscode.Uri.parse(parsedLink));
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    return;
  }
  public addMessage(message: AiChatMessage): void {
    this._view?.webview.postMessage({
      command: postChat,
      message: message,
    });
  }
  private addExample(
    example: string,
    language: string,
    file: string,
    start_line: number,
    end_line: number,
    isGoodExample: boolean
  ): void {
    const hasExamples =
      (this.goodExamples && this.goodExamples.length > 0) ||
      (this.badExamples && this.badExamples.length > 0);

    if (isGoodExample) {
      this.goodExamples?.push(example);
    } else {
      this.badExamples?.push(example);
    }

    const command = isGoodExample ? setGoodExample : setBadExample;
    const delay = hasExamples ? 0 : 1000;

    new Promise((resolve) => setTimeout(resolve, delay)).then(() => {
      this._view?.webview.postMessage({
        command: command,
        example: example,
        language: language,
        file: file,
        start_line: start_line,
        end_line: end_line,
      });
    });
  }

  public addGoodExample(
    example: string,
    language: string,
    file: string,
    start_line: number,
    end_line: number
  ): void {
    this.addExample(example, language, file, start_line, end_line, true);
  }

  public addBadExample(
    example: string,
    language: string,
    file: string,
    start_line: number,
    end_line: number
  ): void {
    this.addExample(example, language, file, start_line, end_line, false);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const assetsPath = vscode.Uri.joinPath(this._extensionUri, "out");

    // The CSS file from the React build output
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(assetsPath, "ai-chat-webview.css")
    );
    // The JS file from the React build output
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(assetsPath, "ai-chat-webview.js")
    );
    // The global CSS file
    const globalStylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "global.css")
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
