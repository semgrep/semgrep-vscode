import type { WebviewApi } from "vscode-webview";
import {
  extensionToWebviewCommand,
  postChat,
  webviewToExtensionCommand,
} from "../../interface/interface";
import { AiChatMessage } from "../../lspExtensions";
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
  private readonly vsCodeApi: WebviewApi<void> | undefined;
  public onMessage?: (message: AiChatMessage) => void;
  public onSetExample?: (example: string, language: string) => void;
  public onSetGoodExample?: (example: string, language: string) => void;
  public onSetBadExample?: (example: string, language: string) => void;
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
      case postChat:
        this.onMessage?.(data.message);
        break;
      case setExample:
        this.onSetExample?.(data.example, data.language);
        break;
      case onSetBadExample:
        this.onSetBadExample?.(data.example, data.language);
        break;
    }
  }
}

// Exports class singleton to prevent multiple invocations of acquireVsCodeApi.
export const vscode = new VSCodeAPIWrapper();
