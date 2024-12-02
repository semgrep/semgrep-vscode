import { randomUUID } from "node:crypto";
import * as vscode from "vscode";
import type { SearchParams } from "../lspExtensions";
import type {
  SearchLanguage,
  extensionToWebviewCommand,
  webviewToExtensionCommand,
} from "../webviews/interface";
import { SUPPORTED_LANGS } from "../webviews/interface";

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
          // nosem:
          console.log("webview print", data.message);
        }
        break;
      case "webview/semgrep/search": {
        const searchParams: SearchParams = {
          lspParams: {
            patterns: data.patterns,
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
          data.matches,
        );
        break;
      }
      case "webview/semgrep/select": {
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
            lang: activeLang as SearchLanguage,
          });
        } else {
          this.sendMessageToWebview({
            command: "extension/semgrep/activeLang",
            lang: null,
          });
        }
        break;
      }
      case "webview/semgrep/exportRule": {
        const lines = data.patterns
          .map((pat) =>
            pat.positive
              ? `    - pattern: '${pat.pattern}'`
              : `    - pattern-not: '${pat.pattern}'`,
          )
          .join("\n");
        vscode.workspace
          .openTextDocument({
            content: [
              `rules:\n`,
              `  - id: search-rule\n`,
              `    language: ${
                data.language === "all" ? [] : `[${data.language}]`
              }\n`,
              `    message: |\n`,
              `      You can run this rule with Semgrep CLI to search your code and\n`,
              `      enforce certain practices!\n`,
              `    severity: ERROR\n`,
              `    patterns:\n`,
              `${lines}\n`,
            ].join(""),
            language: "yaml",
          })
          .then((doc) => vscode.window.showTextDocument(doc));
      }
    }
  }

  // Send messages from extension -> webview
  sendMessageToWebview(data: extensionToWebviewCommand): void {
    this._view?.webview.postMessage(data);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      // Without this, the search bar won't show up!
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      this.handleMessageFromWebview(data);
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const assetsPath = vscode.Uri.joinPath(this._extensionUri, "out");

    // The CSS file from the React build output
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(assetsPath, "webview.css"),
    );
    // The JS file from the React build output
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(assetsPath, "webview.js"),
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
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}' 'unsafe-inline';">
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
}
