import type { WebviewApi } from "vscode-webview";
import type {
  SearchLanguage,
  extensionToWebviewCommand,
  webviewToExtensionCommand,
} from "../interface";
import type { ViewResults } from "../types/results";
import type { State } from "../types/state";

/**
 * A utility wrapper around the acquireVsCodeApi() function, which enables
 * message passing and state management between the webview and extension
 * contexts.
 *
 * This utility also enables webview code to be run in a web browser-based
 * dev server by using native web browser features that mock the functionality
 * enabled by acquireVsCodeApi.
 */
class VSCodeAPIWrapper {
  private readonly vsCodeApi: WebviewApi<State> | undefined;
  // This is set by the webview App.tsx!
  public onUpdate: ((results: ViewResults) => void) | null = null;
  public onUpdateActiveLang:
    | ((activeLang: SearchLanguage | null) => void)
    | null = null;
  public onClear: (() => void) | null = null;
  public onExportRule: (() => void) | null = null;

  constructor() {
    // Check if the acquireVsCodeApi function exists in the current development
    // context (i.e. VS Code development window or web browser)
    if (typeof acquireVsCodeApi === "function") {
      this.vsCodeApi = acquireVsCodeApi();

      // Handle messages sent from the extension to the webview
      window.addEventListener("message", (event) => {
        const message = event.data; // The json data that the extension sent
        this.handleMessageFromExtension(message);
      });

      // We send `getActiveLang` here, because now we are ready to accept messages.
      // Note that since this is run only when the webview is loaded, we will not send
      // this more than once per session.
      this.sendMessageToExtension({
        command: "webview/semgrep/getActiveLang",
      });
    }
  }

  /**
   * Post a message (i.e. send arbitrary data) to the owner of the webview.
   *
   * @remarks When running webview code inside a web browser, postMessage will instead
   * log the given message to the console.
   *
   * @param message Abitrary data (must be JSON serializable) to send to the extension context.
   */
  public sendMessageToExtension(message: webviewToExtensionCommand) {
    if (this.vsCodeApi) {
      this.vsCodeApi.postMessage(message);
    } else {
      console.debug(message);
    }
  }

  handleMessageFromExtension(data: extensionToWebviewCommand) {
    switch (data.command) {
      case "extension/semgrep/results":
        {
          // this.sendMessageToExtension({
          //   command: "webview/semgrep/print",
          //   message: "Received results from extension",
          // });
          // update the state of the webview component!
          if (this.onUpdate) {
            this.onUpdate(data.results);
          }
        }
        break;
      case "extension/semgrep/activeLang": {
        this.sendMessageToExtension({
          command: "webview/semgrep/print",
          message: `Received language! ${data.lang}`,
        });
        if (this.onUpdateActiveLang) {
          this.onUpdateActiveLang(data.lang);
        }
        break;
      }
      case "extension/semgrep/clear": {
        if (this.onClear) {
          this.onClear();
        }
        break;
      }
      case "extension/semgrep/exportRuleRequest": {
        if (this.onExportRule) {
          this.onExportRule();
        }
      }
    }
  }
}

// Exports class singleton to prevent multiple invocations of acquireVsCodeApi.
export const vscode = new VSCodeAPIWrapper();
