import * as vscode from "vscode";
import activateDiagnostics from "./diagnostics";
import activateSuggestions from "./suggestions";

export const activate = async (context: vscode.ExtensionContext) => {
  activateSuggestions(context);
  activateDiagnostics(context);
};

export const deactivate = () => {
  console.log("semgrep deactivating...");
};
