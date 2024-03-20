import * as vscode from "vscode";
import { SearchParams } from "../lspExtensions";
import { webkitCommand } from "../interface/commands";
import { randomUUID } from "crypto";

export class SemgrepSearchWebviewProvider
  implements vscode.WebviewViewProvider
{
  public static readonly viewType = "semgrep.searchView";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  handleMessage(data: webkitCommand): void {
    switch (data.command) {
      case "webkit/semgrep/search": {
        // vscode.window.showInformationMessage(
        //   `Starting search for pattern ${data.command}`
        // );
        const searchParams: SearchParams = {
          pattern: data.pattern,
          language: null,
        };
        vscode.commands.executeCommand("semgrep.search", searchParams, null);
      }
    }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      this.handleMessage(data);
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const assetsPath = vscode.Uri.joinPath(this._extensionUri, "out");

    // The CSS file from the React build output
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(assetsPath, "webview.css")
    );
    // The JS file from the React build output
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(assetsPath, "webview.js")
    );

    const nonce = randomUUID();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Hello World</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  // private _setWebviewMessageListener(webview: vscode.Webview) {
  //   webview.onDidReceiveMessage(
  //     (message: any) => {
  //       const command = message.command;
  //       const text = message.text;

  //       switch (command) {
  //         case "hello":
  //           vscode.window.showInformationMessage(text);
  //           return;
  //       }
  //     },
  //     undefined,
  //     this._disposables
  //   );
  // }
}
