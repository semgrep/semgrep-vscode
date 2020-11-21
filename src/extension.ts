import * as vscode from "vscode";
import activateDiagnostics from "./diagnostics";
import activateSuggestions from "./suggestions";
import activateSearch from "./search";

export const activate = async (context: vscode.ExtensionContext) => {
  activateSuggestions(context);
  activateDiagnostics(context);
  activateSearch(context);
};

export const deactivate = () => {
  console.log("semgrep deactivating...");
};
