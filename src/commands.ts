import * as vscode from "vscode";
import type { Disposable } from "vscode-languageclient";
import type { Environment } from "./env";
import { restartLsp } from "./lsp";
import {
  type SearchParams,
  login,
  loginFinish,
  loginStatus,
  logout,
  refreshRules,
  scanWorkspace,
  showAst,
} from "./lspExtensions";
import { handleSearch } from "./search";
import { encodeUri } from "./showAstDocument";
import { applyFixAndSave, replaceAll } from "./utils";
import type { ViewResults } from "./webviews/types/results";

/*****************************************************************************/
/* Prelude */
/*****************************************************************************/

/* Commands which are known to the Semgrep VS Code Extension.

   These are essentially "pointers" which are referenced in various places,
   such as semgrep.search, semgrep.login, etc.
   They are use by separate parts of the extension to talk to each other.

   See `package.json` which also defines where some of these commands are used.
 */

/*****************************************************************************/
/* Helpers */
/*****************************************************************************/

// We need to do this, or openTextDocument will open the same text document, if previously
// opened. This means that running showAst twice will always show the same thing.
async function replaceAndOpenUriContent(
  uri: vscode.Uri,
  content: string,
  active_editor: vscode.TextEditor,
): Promise<void> {
  const doc = await vscode.workspace.openTextDocument(uri);
  const edit = new vscode.WorkspaceEdit();
  edit.replace(uri, new vscode.Range(0, 0, doc.lineCount, 0), content);
  vscode.workspace.applyEdit(edit);
  if (active_editor.viewColumn) {
    vscode.window.showTextDocument(doc, active_editor.viewColumn + 1 || 0);
  }
}

/*****************************************************************************/
/* Commands */
/*****************************************************************************/

export function registerCommands(env: Environment): Disposable[] {
  return [
    /************/
    /* LOGIN */
    /************/

    vscode.commands.registerCommand("semgrep.login", async () => {
      const result = await env.client?.sendRequest(login);
      if (result) {
        vscode.env.openExternal(vscode.Uri.parse(result.url));
        env.client?.sendNotification(loginFinish, result);
      }
    }),

    vscode.commands.registerCommand("semgrep.logout", async () => {
      await env.client?.sendNotification(logout);
      env.loggedIn = false;
    }),

    vscode.commands.registerCommand("semgrep.loginStatus", async () => {
      const result = await env.client?.sendRequest(loginStatus);
      if (result) {
        env.loggedIn = result.loggedIn;
      }
    }),

    vscode.commands.registerCommand("semgrep.loginNudge", async () => {
      if (!env.loggedIn && env.showNudges) {
        const resp = await vscode.window.showInformationMessage(
          "Sign in to use your team's shared Semgrep rule configuration",
          "Sign in",
          "Do not show again",
        );
        if (resp == "Sign in") {
          vscode.commands.executeCommand("semgrep.login");
        } else if (resp == "Do not show again") {
          env.showNudges = false;
        }
      }
    }),

    /************/
    /* SCANNING */
    /************/

    vscode.commands.registerCommand("semgrep.scanWorkspace", async () => {
      const onlyGitDirty = env.config.onlyGitDirty;
      if (!onlyGitDirty) {
        vscode.window.showInformationMessage(
          'Semgrep is now only scanning files and lines that have been changed since the last commit. You can disable this in settings by unchecking "Only Git Dirty", or by running "Scan all files in workspace"',
        );
        // This will always restart the LS, since the LS restarts on config change
        // And on startup we always refresh rules
        env.config.onlyGitDirty = true;
        env.onRulesRefreshed(
          () => env.client?.sendNotification(scanWorkspace, { full: false }),
          true,
        );
      } else {
        env.client?.sendNotification(scanWorkspace, { full: false });
      }
    }),

    vscode.commands.registerCommand("semgrep.scanWorkspaceFull", async () => {
      const onlyGitDirty = env.config.onlyGitDirty;
      if (onlyGitDirty) {
        vscode.window.showInformationMessage(
          'Semgrep is now always scanning all files and lines regardless of if they have been changed since the last commit. You can disable this in settings by checking "Only Git Dirty", or by running "Scan changed files in workspace"',
        );
        // This will always restart the LS, since the LS restarts on config change
        // And on startup we always refresh rules
        env.config.onlyGitDirty = false;
        env.onRulesRefreshed(
          () => env.client?.sendNotification(scanWorkspace, { full: true }),
          true,
        );
      } else {
        env.client?.sendNotification(scanWorkspace, { full: true });
      }
    }),

    vscode.commands.registerCommand("semgrep.refreshRules", async () => {
      await env.client?.sendNotification(refreshRules);
      return "Refreshed rules";
    }),

    /************/
    /* SHOW AST */
    /************/

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
    }),
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
    }),

    /**********/
    /* SEARCH */
    /**********/

    vscode.commands.registerCommand(
      "semgrep.search",
      async (searchParams: SearchParams) => {
        await handleSearch(env, searchParams);
      },
    ),

    vscode.commands.registerCommand("semgrep.search.clear", () => {
      env.provider?.sendMessageToWebview({
        command: "extension/semgrep/clear",
      });
    }),

    vscode.commands.registerCommand(
      "semgrep.search.replaceAll",
      async (matches: ViewResults) => {
        const selection = await vscode.window.showWarningMessage(
          `Really apply fix to ${matches.locations.length} files?`,
          "Yes",
          "No",
        );
        if (selection === "Yes") {
          replaceAll(matches);
        }
      },
    ),

    vscode.commands.registerCommand(
      "semgrep.search.replace",
      async ({
        uri,
        fix,
        range,
      }: {
        uri: string;
        fix: string;
        range: vscode.Range;
      }) => {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(vscode.Uri.parse(uri), range, fix);
        await applyFixAndSave(edit);
      },
    ),

    /********/
    /* MISC */
    /********/

    vscode.commands.registerCommand("semgrep.search.exportRule", () => {
      env.provider?.sendMessageToWebview({
        command: "extension/semgrep/exportRuleRequest",
      });
    }),

    vscode.commands.registerCommand("semgrep.restartLanguageServer", () => {
      vscode.window.showInformationMessage(
        "Restarting Semgrep Language Server",
      );
      restartLsp(env);
      vscode.window.showInformationMessage(
        "Semgrep Language Server has finished restarting",
      );
    }),

    vscode.commands.registerCommand("semgrep.showDemoFile", async () => {
      const path = env.context.asAbsolutePath(
        "walkthrough/semgrep-extension.demo.py",
      );
      const content = await vscode.workspace.fs.readFile(
        vscode.Uri.parse(path),
      );
      let dir = vscode.Uri.joinPath(
        env.context.globalStorageUri,
        "demo-workspace",
      );
      dir = vscode.Uri.parse(dir.fsPath); // So dumb
      await vscode.workspace.fs.createDirectory(dir);
      const file = vscode.Uri.joinPath(dir, "demo.py");
      await vscode.workspace.fs.writeFile(file, content);
      const demoDoc = await vscode.workspace.openTextDocument(file);
      vscode.workspace.updateWorkspaceFolders(0, 0, { uri: dir });
      await vscode.window.showTextDocument(demoDoc);
    }),
  ];
}
