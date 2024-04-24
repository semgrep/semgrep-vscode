import * as vscode from "vscode";

export function createStatusBar(): vscode.StatusBarItem {
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
  );
  const statusBarCommand: vscode.Command = {
    title: "",
    command: "workbench.action.quickOpen",
    arguments: [">Semgrep:"],
  };
  statusBar.command = statusBarCommand;
  statusBar.text = "$(semgrep-icon)";
  statusBar.tooltip = "Show Semgrep Commands";
  return statusBar;
}
