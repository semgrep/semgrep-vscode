"use strict";

import * as vscode from "vscode";
import { checkFile } from "./cli";
import suggestPatterns from "./suggestPatterns";

let diagnosticCollection: vscode.DiagnosticCollection;
let diagnosticMap: Map<string, vscode.Diagnostic[]>;

const shouldRunOnLanguage = (languageId: string): boolean => {
  const enabled = new Set(
    vscode.workspace.getConfiguration("semgrep").get("languages")
  );

  return enabled.has(languageId);
};

export function activate(context: vscode.ExtensionContext) {
  console.log("semgrep activating...");
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "semgrep.suggestSelectionPatterns",
      async (context: vscode.ExtensionContext) =>
        await suggestPatterns(context, "selection")
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "semgrep.suggestLinePatterns",
      async (context: vscode.ExtensionContext) =>
        await suggestPatterns(context, "line")
    )
  );
  diagnosticCollection = vscode.languages.createDiagnosticCollection(
    "Semgrep Findings"
  );
  diagnosticMap = new Map();

  if (context === null) {
    return;
  }

  // full lint when document is saved
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      shouldRunOnLanguage(document.languageId) && (await doLint(document));
    })
  );

  // full lint on a new document/opened document
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(async (event) => {
      shouldRunOnLanguage(event.languageId) && (await doLint(event));
    })
  );

  // clean up any lints when the document is closed
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((event) => {
      if (diagnosticMap.has(event.uri.toString())) {
        diagnosticMap.delete(event.uri.toString());
      }
      resetDiagnostics();
    })
  );
}

export function deactivate() {
  console.log("semgrep deactivating...");
}

function resetDiagnostics() {
  diagnosticCollection.clear();

  diagnosticMap.forEach((diags, file) => {
    diagnosticCollection.set(vscode.Uri.parse(file), diags);
  });
}

async function doLint(document: vscode.TextDocument) {
  const rules: string =
    vscode.workspace.getConfiguration("semgrep").get("rules") ??
    "https://semgrep.live/p/r2c";
  const diagnostics: vscode.Diagnostic[] = await checkFile(
    document.fileName,
    rules
  );
  diagnosticMap.set(document.uri.toString(), diagnostics);
  resetDiagnostics();
}
