import * as vscode from "vscode";
import { getVersion, checkFile, fixFile } from "./cli";

let collection: vscode.DiagnosticCollection;

const provideAutofixes: vscode.CodeActionProvider["provideCodeActions"] = (
  document,
  range,
  context
) => {
  const semgrepDiagnostics = context.diagnostics.filter(
    (diagnostic) => diagnostic.source === "Semgrep"
  );

  if (semgrepDiagnostics.length === 0) {
    return [];
  }

  const results: vscode.CodeAction[] = [];
  const rules: string =
    vscode.workspace.getConfiguration("semgrep").get("rules") ??
    "https://semgrep.dev/p/r2c";
  results.push({
    title: "Autofix whole file with Semgrep",
    diagnostics: semgrepDiagnostics,
    command: {
      title: "Autofix whole file with Semgrep",
      command: "semgrep.autofixFile",
      arguments: [document.fileName, rules],
    },
    kind: vscode.CodeActionKind.QuickFix,
  });
  const addCommentEdit = new vscode.WorkspaceEdit();
  addCommentEdit.insert(
    document.uri,
    new vscode.Position(
      range.start.line,
      document.lineAt(range.start.line).range.end.character
    ),
    `  # nosem` // TODO: use language's comment char
  );
  results.push({
    title: "Ignore line in Semgrep scans",
    diagnostics: semgrepDiagnostics,
    edit: addCommentEdit,
    kind: vscode.CodeActionKind.QuickFix,
  });
  return results;
};

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

  subs.push(vscode.commands.registerCommand("semgrep.autofixFile", fixFile));

  subs.push(
    vscode.languages.registerCodeActionsProvider(
      { scheme: "file" },
      { provideCodeActions: provideAutofixes },
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
    )
  );
};

export default activateDiagnostics;
