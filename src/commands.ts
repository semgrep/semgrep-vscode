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
  search,
  SearchParams,
} from "./lspExtensions";
import { searchQuickPick } from "./searchQuickPick";

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
      env.loggedIn = result.loggedIn;
    }
  });

  vscode.commands.registerCommand("semgrep.loginNudge", async () => {
    if (!env.loggedIn && env.showNudges) {
      const resp = await vscode.window.showInformationMessage(
        "Sign in to use your team's shared Semgrep rule configuration",
        "Sign in",
        "Do not show again"
      );
      if (resp == "Sign in") {
        vscode.commands.executeCommand("semgrep.login");
      } else if (resp == "Do not show again") {
        env.showNudges = false;
      }
    }
  });

  vscode.commands.registerCommand(
    "semgrep.search",
    async (searchParams: SearchParams | null, replace: string | null) => {
      if (searchParams != null) {
        const result = await client.sendRequest(search, searchParams);
        env.searchView.setSearchItems(result.locations, searchParams, replace);
        vscode.commands.executeCommand("semgrep-search-results.focus");
      } else {
        searchQuickPick(env);
      }
    }
  );

  vscode.commands.registerCommand("semgrep.search.refresh", async () => {
    if (env.searchView.lastSearch) {
      vscode.commands.executeCommand(
        "semgrep.search",
        env.searchView.lastSearch,
        env.searchView.replace
      );
    }
  });

  vscode.commands.registerCommand("semgrep.search.clear", () => {
    env.searchView.clearSearch();
  });

  vscode.commands.registerCommand("semgrep.search.replace", () => {
    env.searchView.replaceAll();
  });
}
