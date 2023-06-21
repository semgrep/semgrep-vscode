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
  showAst,
  search,
  SearchParams,
} from "./lspExtensions";
import { searchQuickPick } from "./searchQuickPick";
import { encodeUri } from "./showAstDocument";

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

  vscode.commands.registerCommand("semgrep.showAst", async () => {
    // supposedly the right thing to do, according to
    // https://github.com/Microsoft/vscode/issues/36426
    await client.sendRequest(showAst, { 
      named: false, 
      uri: vscode.window.activeTextEditor.document.uri.fsPath 
    });
  });

  vscode.commands.registerCommand("semgrep.showAstNamed", async () => {
    const ast_text = await client.sendRequest(showAst, { 
      named: true, 
      uri: vscode.window.activeTextEditor.document.uri.fsPath 
    });
    env.documentView.setText(ast_text);
    const uri = encodeUri(vscode.editor.document.uri);
    return vscode.workspace.openTextDocument(uri).then(doc => vscode.window.showTextDocument(doc, vscode.editor.viewColumn! + 1));
  });

  vscode.commands.registerCommand("semgrep.showAst", async () => {
    const ast_text = await client.sendRequest(showAst, { 
      named: false, 
      uri: vscode.window.activeTextEditor.document.uri.fsPath 
    });
    env.documentView.setText(ast_text);
    const uri = encodeUri(vscode.editor.document.uri);
    return vscode.workspace.openTextDocument(uri).then(doc => vscode.window.showTextDocument(doc, vscode.editor.viewColumn! + 1));
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
}
