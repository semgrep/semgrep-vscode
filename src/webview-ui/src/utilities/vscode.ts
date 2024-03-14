import type { WebviewApi } from "vscode-webview";
import {
  extensionToWebviewCommand,
  webviewToExtensionCommand,
} from "../../../interface/interface";
import { State } from "../types/state";
import { ViewResults } from "../types/results";

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
      console.log(message);
    }
  }

  handleMessageFromExtension(data: extensionToWebviewCommand) {
    switch (data.command) {
      case "extension/semgrep/results": {
        // this.sendMessageToExtension({
        //   command: "webview/semgrep/print",
        //   message: "Received results from extension",
        // });
        // update the state of the webview component!
        if (this.onUpdate) {
          this.onUpdate(data.results);
        }
      }
    }
  }

  /* We shouldn't actually need this code for now, because we are storing the
     webview state inside of the component itself.
   */

  /**
   * Get the persistent state stored for this webview.
   *
   * @remarks When running webview source code inside a web browser, getState will retrieve state
   * from local storage (https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
   *
   * @return The current state or `undefined` if no state has been set.
   */
  public getState(): State | undefined {
    if (this.vsCodeApi) {
      return this.vsCodeApi.getState();
    } else {
      const state = localStorage.getItem("vscodeState");
      return state ? JSON.parse(state) : undefined;
    }
  }

  /**
   * Set the persistent state stored for this webview.
   *
   * @remarks When running webview source code inside a web browser, setState will set the given
   * state using local storage (https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
   *
   * @param newState New persisted state. This must be a JSON serializable object. Can be retrieved
   * using {@link getState}.
   *
   * @return The new state.
   */
  public setState<T extends State | undefined>(newState: T): T {
    if (this.vsCodeApi) {
      return this.vsCodeApi.setState(newState);
    } else {
      localStorage.setItem("vscodeState", JSON.stringify(newState));
      return newState;
    }
  }
}

// Exports class singleton to prevent multiple invocations of acquireVsCodeApi.
export const vscode = new VSCodeAPIWrapper();
