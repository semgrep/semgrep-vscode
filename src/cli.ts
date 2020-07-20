import * as vscode from "vscode";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

export const synthesizePatterns = async (
  path: string,
  ranges: string[]
): Promise<vscode.QuickPickItem[]> => {
  let results: any[] | null = null;
  for (const range of ranges) {
    const { stdout } = await execAsync(
      `semgrep --synthesize-patterns=${range} ${path}`
    );
    results = Object.entries(JSON.parse(stdout)).filter(
      (entry: any) =>
        results === null ||
        new Set(results.map((result) => result[1])).has(entry[1])
    );
  }

  if (results === null) {
    return [];
  }

  return results.map((entry) => ({
    label: entry[0] as string,
    detail: entry[1] as string,
  }));
};

const getSeverity = (result: any): vscode.DiagnosticSeverity => {
  switch (result.extra.severity) {
    case "ERROR":
      return vscode.DiagnosticSeverity.Error;
    case "WARNING":
      return vscode.DiagnosticSeverity.Warning;
    default:
      return vscode.DiagnosticSeverity.Information;
  }
};

export const checkFile = async (
  path: string,
  rules: string
): Promise<vscode.Diagnostic[]> => {
  const { stdout, stderr } = await execAsync(
    `semgrep --json --config=${rules} ${path}`
  );

  const results = JSON.parse(stdout).results;
  return results.map((result: any) => {
    const start = new vscode.Position(
      result.start.line - 1,
      result.start.col - 1
    );
    const end = new vscode.Position(result.end.line - 1, result.end.col - 1);
    return new vscode.Diagnostic(
      new vscode.Range(start, end),
      result.extra.message,
      getSeverity(result)
    );
  });
};
