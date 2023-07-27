import * as vscode from "vscode";
import { Environment } from "./env";
import {
  login,
  loginFinish,
  loginStatus,
  logout,
  refreshRules,
  scanWorkspace,
  search,
  SearchParams,
} from "./lspExtensions";
import { searchQuickPick } from "./searchQuickPick";
import { restartLsp } from "./lsp";
export function registerCommands(env: Environment): void {
  vscode.commands.registerCommand("semgrep.login", async () => {
    const result = await env.client?.sendRequest(login);
    if (result) {
      vscode.env.openExternal(vscode.Uri.parse(result.url));
      env.client?.sendNotification(loginFinish, result);
    }
  });

  vscode.commands.registerCommand("semgrep.scanWorkspace", async () => {
    await env.client?.sendNotification(scanWorkspace, { full: false });
  });

  vscode.commands.registerCommand("semgrep.scanWorkspaceFull", async () => {
    await env.client?.sendNotification(scanWorkspace, { full: true });
  });

  vscode.commands.registerCommand("semgrep.logout", async () => {
    await env.client?.sendNotification(logout);
    env.loggedIn = false;
  });

  vscode.commands.registerCommand("semgrep.refreshRules", async () => {
    await env.client?.sendNotification(refreshRules);
  });

  vscode.commands.registerCommand("semgrep.loginStatus", async () => {
    const result = await env.client?.sendRequest(loginStatus);
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
        const result = await env.client?.sendRequest(search, searchParams);
        vscode.commands.executeCommand(
          "setContext",
          "semgrep.searchHasResults",
          true
        );
        vscode.commands.executeCommand(
          "setContext",
          "semgrep.searchIsReplace",
          replace != null
        );
        if (!result) {
          return;
        }
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
    vscode.commands.executeCommand(
      "setContext",
      "semgrep.searchHasResults",
      false
    );
    vscode.commands.executeCommand(
      "setContext",
      "semgrep.searchIsReplace",
      false
    );
    env.searchView.clearSearch();
  });

  vscode.commands.registerCommand("semgrep.search.replace", () => {
    env.searchView.replaceAll();
    vscode.commands.executeCommand("semgrep.search.refresh");
  });

  vscode.commands.registerCommand("semgrep.restartLanguageServer", () => {
    vscode.window.showInformationMessage("Restarting Semgrep Language Server");
    restartLsp(env);
  });

  vscode.commands.registerCommand("semgrep.showDemoFile", async () => {
    const path = env.context.asAbsolutePath(
      "walkthrough/semgrep-extension.demo.py"
    );
    const content = await vscode.workspace.fs.readFile(vscode.Uri.parse(path));
    let dir = vscode.Uri.joinPath(
      env.context.globalStorageUri,
      "demo-workspace"
    );
    dir = vscode.Uri.parse(dir.fsPath); // So dumb
    await vscode.workspace.fs.createDirectory(dir);
    const file = vscode.Uri.joinPath(dir, "demo.py");
    await vscode.workspace.fs.writeFile(file, content);
    const demoDoc = await vscode.workspace.openTextDocument(file);
    vscode.workspace.updateWorkspaceFolders(0, 0, { uri: dir });
    await vscode.window.showTextDocument(demoDoc);
  });
}
