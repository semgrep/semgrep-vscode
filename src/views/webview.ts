import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { SearchParams } from "../lspExtensions";
import {
  SearchLanguage,
  extensionToWebviewCommand,
  webviewToExtensionCommand,
} from "../interface/interface";
import { SUPPORTED_LANGS } from "../constants";

export class SemgrepSearchWebviewProvider
  implements vscode.WebviewViewProvider
{
  public static readonly viewType = "semgrep.searchView";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  // Handle messages from webview -> extension
  handleMessageFromWebview(data: webviewToExtensionCommand): void {
    switch (data.command) {
      // This is needed because the webview cannot actually print to the
      // debug console, we need the extension to do that for us.
      case "webview/semgrep/print":
        {
          console.log("webview print", data.message);
        }
        break;
      case "webview/semgrep/search": {
        const searchParams: SearchParams = {
          lspParams: {
            pattern: data.pattern,
            language: data.lang,
            fix: data.fix,
            includes: data.includes,
            excludes: data.excludes,
          },
          scanID: data.scanID,
        };
        vscode.commands.executeCommand("semgrep.search", searchParams);
        break;
      }
      case "webview/semgrep/replace": {
        vscode.commands.executeCommand("semgrep.search.replace", data);
        break;
      }
      case "webview/semgrep/replaceAll": {
        vscode.commands.executeCommand(
          "semgrep.search.replaceAll",
          data.matches
        );
        break;
      }
      case "webview/semgrep/select": {
        console.log("opening uri", data.uri);
        const uri = vscode.Uri.parse(data.uri);
        // I'm not sure why, but this one doesn't work for some reason:
        // vscode.window.showTextDocument(data.uri, {selection: data.range});
        // It always opens as an "Untitled file".
        vscode.commands.executeCommand("vscode.open", uri, <
          vscode.TextDocumentShowOptions
        >{
          selection: data.range,
        });
        break;
      }
      case "webview/semgrep/getActiveLang": {
        const activeLang = vscode.window.activeTextEditor?.document.languageId;
        // we'll only send the language to the webview if we can determine it maps to a semgrep language
        if (
          activeLang &&
          SUPPORTED_LANGS.includes(activeLang as SearchLanguage)
        ) {
          this.sendMessageToWebview({
            command: "extension/semgrep/activeLang",
            lang: activeLang,
          });
        } else {
          this.sendMessageToWebview({
            command: "extension/semgrep/activeLang",
            lang: null,
          });
        }
      }
    }
  }

  // Send messages from extension -> webview
  sendMessageToWebview(data: extensionToWebviewCommand): void {
    console.log("Sending message to webview", data);
    this._view?.webview.postMessage(data);
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
      console.debug("Did receive message", data);
      this.handleMessageFromWebview(data);
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // The CSS file from the React build output
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "webview-ui",
        "build",
        "assets",
        "index.css"
      )
    );
    // The JS file from the React build output
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "webview-ui",
        "build",
        "assets",
        "index.js"
      )
    );
    // The global CSS file
    const globalStylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "global.css")
    );

    const nonce = getNonce();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <link rel="stylesheet" type="text/css" href="${globalStylesUri}">
          <title>Hello World</title>
          <style>
          </style>
        </head>
        <body style="padding: 0">
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