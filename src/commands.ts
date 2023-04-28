import * as vscode from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import { Environment } from "./env";
import {
  login,
  loginFinish,
  LoginParams,
  loginStatus,
  LoginStatusParams,
  logout,
  refreshRules,
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

  vscode.commands.registerCommand("semgrep.scanWorkspace", async () => {
    await client.sendNotification(scanWorkspace, { full: false });
  });

  vscode.commands.registerCommand("semgrep.scanWorkspaceFull", async () => {
    await client.sendNotification(scanWorkspace, { full: true });
  });

  vscode.commands.registerCommand("semgrep.logout", async () => {
    await client.sendNotification(logout);
    env.loggedIn = false;
  });

  vscode.commands.registerCommand("semgrep.refreshRules", async () => {
    await client.sendNotification(refreshRules);
  });

  vscode.commands.registerCommand("semgrep.loginStatus", async () => {
    const result: LoginStatusParams | null = await client.sendRequest(
      loginStatus
    );
    if (result) {
      env.logger.log("Status Result " + result.loggedIn);
      env.loggedIn = result.loggedIn;
    }
  });

  vscode.commands.registerCommand("semgrep.loginNudge", async () => {
    env.logger.log("logged in: " + env.loggedIn);
    if (!env.loggedIn && env.showNudges) {
      const resp = await vscode.window.showInformationMessage(
        "Sign in to use your team's shared Semgrep rule configuration",
        "Sign in",
        "Do not show again"
      );
      if (resp == "Login") {
        vscode.commands.executeCommand("semgrep.login");
      } else if (resp == "Do not show again") {
        env.showNudges = false;
      }
    }
  });
}
