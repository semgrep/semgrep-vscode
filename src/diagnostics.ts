import * as vscode from "vscode";
import { getVersion, checkFile } from "./cli";

let collection: vscode.DiagnosticCollection;

const shouldRunOnLanguage = (languageId: string): boolean => {
  const enabled = new Set(
    vscode.workspace.getConfiguration("semgrep").get("languages")
  );

  return enabled.has(languageId);
};

const lint = async (document: vscode.TextDocument) => {
  if (!shouldRunOnLanguage(document.languageId)) {
    return;
  }
  const rules: string =
    vscode.workspace.getConfiguration("semgrep").get("rules") ??
    "https://semgrep.dev/p/r2c";
  const diagnostics: vscode.Diagnostic[] = await checkFile(
    document.fileName,
    rules
  );
  collection.set(document.uri, diagnostics);
};

const reset = async (document: vscode.TextDocument) => {
  collection.delete(document.uri);
};

const activateDiagnostics = async (context: vscode.ExtensionContext) => {
  if (context === null) {
    return;
  }
  const version = await getVersion();
  if (version === undefined) {
    await vscode.window.showInformationMessage(
      "Semgrep is not installed, try running `pip install semgrep`. Linting will be disabled until restart."
    );
    return;
  }

  collection = vscode.languages.createDiagnosticCollection("Semgrep Findings");

  const subs = context.subscriptions;

  console.log("Registering Semgrep diagnostics");
  subs.push(vscode.workspace.onDidSaveTextDocument(lint));
  subs.push(vscode.workspace.onDidOpenTextDocument(lint));
  subs.push(vscode.workspace.onDidCloseTextDocument(reset));
};

export default activateDiagnostics;
