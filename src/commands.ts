import * as vscode from "vscode";
import { Environment } from "./env";
import {
  login,
  loginFinish,
  loginStatus,
  logout,
  refreshRules,
  scanWorkspace,
  showAst,
  search,
  SearchParams,
} from "./lspExtensions";
import { restartLsp } from "./lsp";
import { encodeUri } from "./showAstDocument";

// We need to do this, or openTextDocument will open the same text document, if previously
// opened. This means that running showAst twice will always show the same thing.
async function replaceAndOpenUriContent(
  uri: vscode.Uri,
  content: string,
  active_editor: vscode.TextEditor
): Promise<void> {
  const doc = await vscode.workspace.openTextDocument(uri);
  const edit = new vscode.WorkspaceEdit();
  edit.replace(uri, new vscode.Range(0, 0, doc.lineCount, 0), content);
  vscode.workspace.applyEdit(edit);
  if (active_editor.viewColumn) {
    vscode.window.showTextDocument(doc, active_editor.viewColumn + 1 || 0);
  }
}

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

  vscode.commands.registerCommand("semgrep.showAstNamed", async () => {
    if (vscode.window.activeTextEditor == null) {
      return;
    }
    if (env.client) {
      const ast_text = await env.client.sendRequest(showAst, {
        named: true,
        uri: vscode.window.activeTextEditor?.document.uri.fsPath,
      });
      const uri = encodeUri(vscode.window.activeTextEditor.document.uri);
      replaceAndOpenUriContent(uri, ast_text, vscode.window.activeTextEditor);
    }
  });

  vscode.commands.registerCommand("semgrep.showAst", async () => {
    if (vscode.window.activeTextEditor == null) {
      return;
    }
    if (env.client) {
      const ast_text = await env.client.sendRequest(showAst, {
        named: false,
        uri: vscode.window.activeTextEditor?.document.uri.fsPath,
      });
      const uri = encodeUri(vscode.window.activeTextEditor.document.uri);
      replaceAndOpenUriContent(uri, ast_text, vscode.window.activeTextEditor);
    }
  });

  vscode.commands.registerCommand("semgrep.logout", async () => {
    await env.client?.sendNotification(logout);
    env.loggedIn = false;
  });

  vscode.commands.registerCommand("semgrep.refreshRules", async () => {
    await env.client?.sendNotification(refreshRules);
    return "Refreshed rules";
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
    async (searchParams: SearchParams | null) => {
      if (searchParams != null) {
        const result = await env.client?.sendRequest(search, searchParams);
        vscode.commands.executeCommand(
          "setContext",
          "semgrep.searchHasResults",
          true
        );
        if (searchParams.fix) {
          vscode.commands.executeCommand(
            "setContext",
            "semgrep.searchHasFix",
            true
          );
        }
        if (!result) {
          return;
        }
        env.searchView.setSearchItems(result.locations, searchParams);
        vscode.commands.executeCommand("semgrep-search-results.focus");
      }
    }
  );

  vscode.commands.registerCommand("semgrep.search.refresh", async () => {
    if (env.searchView.lastSearch) {
      vscode.commands.executeCommand(
        "semgrep.search",
        env.searchView.lastSearch
      );
    }
  });

  vscode.commands.registerCommand("semgrep.search.clear", () => {
    vscode.commands.executeCommand(
      "setContext",
      "semgrep.searchHasResults",
      false
    );
    vscode.commands.executeCommand("setContext", "semgrep.searchHasFix", false);
    env.searchView.clearSearch();
  });

  vscode.commands.registerCommand("semgrep.search.replaceAll", () => {
    vscode.commands.executeCommand(
      "semgrep.search.reallyDoReplaceAllNotification"
    );
  });

  vscode.commands.registerCommand(
    "semgrep.search.reallyDoReplaceAllNotification",
    async () => {
      const selection = await vscode.window.showWarningMessage(
        `Really apply fix to ${
          env.searchView.getFilesWithFixes().length
        } files?`,
        "Yes",
        "No"
      );

      if (selection === "Yes") {
        env.searchView.replaceAll();
        vscode.commands.executeCommand("semgrep.search.refresh");
      }
    }
  );

  vscode.commands.registerCommand("semgrep.restartLanguageServer", () => {
    vscode.window.showInformationMessage("Restarting Semgrep Language Server");
    restartLsp(env);
    vscode.window.showInformationMessage(
      "Semgrep Language Server has finished restarting"
    );
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
