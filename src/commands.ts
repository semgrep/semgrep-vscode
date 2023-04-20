import * as vscode from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import { Environment } from "./env";
import {
  login,
  loginFinish,
  LoginParams,
  logout,
  refreshRules,
  scanWorkspace,
  ScanWorkspaceParams,
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

  vscode.commands.registerCommand("semgrep.scanWorkspace", async () => {
    await client.sendNotification(scanWorkspace, { full: false });
  });

  vscode.commands.registerCommand("semgrep.scanWorkspaceFull", async () => {
    await client.sendNotification(scanWorkspace, { full: true });
  });

  vscode.commands.registerCommand("semgrep.logout", async () => {
    await client.sendNotification(logout);
  });

  vscode.commands.registerCommand("semgrep.refreshRules", async () => {
    await client.sendNotification(refreshRules);
  });
}
