import * as vscode from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import { Environment } from "./env";
import {
  login,
  loginFinish,
  LoginParams,
  scan,
  scanWorkspace,
} from "./lsp_ext";

export function registerCommands(
  env: Environment,
  client: LanguageClient
): void {
  vscode.commands.registerCommand("semgrep.login", async () => {
    const result: LoginParams | null = await client.sendRequest(login);
    if (result) {
      vscode.env.openExternal(vscode.Uri.parse(result.url));
      client?.sendNotification(loginFinish, result);
    }
  });

  vscode.commands.registerCommand("semgrep.scan", async (file?: string) => {
    let uri = null;
    if (!file) {
      // Get active file if no path provided
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor) {
        uri = activeEditor.document.uri;
      }
    } else {
      const files = await vscode.workspace.findFiles(file);
      if (file.length < 1) {
        vscode.window.showWarningMessage(
          "File " + file + " not found in current workspace"
        );
      } else {
        uri = files[0];
      }
    }
    if (uri) {
      await client.sendNotification(scan, { uri: uri.toString() });
    } else {
      vscode.window.showWarningMessage(
        "No file provided to scan, please open a file or provide a file name"
      );
    }
  });

  vscode.commands.registerCommand("semgrep.scanWorkspace", async () => {
    await client.sendNotification(scanWorkspace);
  });
}
