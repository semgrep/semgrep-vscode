import * as vscode from "vscode";
import { promisify } from "util";
import { execFile } from "child_process";

const execFileAsync = promisify(execFile);

export const synthesizePatterns = async (
  path: string,
  ranges: string[]
): Promise<vscode.QuickPickItem[]> => {
  let results: any[] | null = null;
  for (const range of ranges) {
    const args = ["-m", "semgrep", "--quiet", "--synthesize-patterns", range, path];
    try {
      var { stdout, stderr } = await execFileAsync("python3", args, {
        timeout: 30 * 1000,
        encoding: "utf-8",
        shell: true,
      });
    } catch (error) {
      if (error.code === 127 && error.message.includes("command not found")) {
        await vscode.window.showInformationMessage(
          "Semgrep is not installed, try running `pip install semgrep`"
        );
        return [];
      } else {
        console.error(
          `Failed to invoke semgrep CLI with args ${args}:\n  ${error}\n\n[STDERR]\n\n${stderr}`
        );
        continue;
      }
    }

    if (stdout[0] !== "{") {
      console.warn(
        `Didn't get JSON from semgrep CLI with args ${args}:\n\n[STDOUT]\n\n${stdout}`
      );
      continue;
    }

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
  const { stdout, stderr } = await execFileAsync(
    "semgrep",
    ["--json", "--config", rules, path],
    { timeout: 30 * 1000 }
  );

  const results = JSON.parse(stdout).results;
  return results.map((result: any) => {
    const start = new vscode.Position(
      result.start.line - 1,
      result.start.col - 1
    );
    const end = new vscode.Position(result.end.line - 1, result.end.col - 1);
    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(start, end),
      result.extra.message,
      getSeverity(result)
    );
    diagnostic.source = "Semgrep";
    diagnostic.code = result.check_id;
    return diagnostic;
  });
};

export const getVersion = async (): Promise<string | undefined> => {
  try {
    var { stdout, stderr } = await execFileAsync("semgrep", ["--version"], {
      timeout: 3 * 1000,
    });
  } catch (error) {
    console.error(
      `Failed to invoke semgrep --version:\n  ${error}\n\n[STDERR]\n\n${stderr}`
    );
    return;
  }

  return stdout.trim();
};
