import {
  Range,
  Position,
  Diagnostic,
  DiagnosticSeverity,
} from "vscode-languageserver";
import { spawn, ChildProcess } from "child_process";
import { SOURCE_NAME } from "./constant";
import { URL } from "url";

const getSeverity = (result: any): DiagnosticSeverity => {
  switch (result.extra.severity) {
    case "ERROR":
      return DiagnosticSeverity.Error;
    case "WARNING":
      return DiagnosticSeverity.Warning;
    default:
      return DiagnosticSeverity.Information;
  }
};

const onExit = (child: ChildProcess): Promise<void> => {
  return new Promise((resolve, reject) => {
    child.on("exit", resolve);
    child.on('error', reject);
  });
};

export const getSuggestions = () => {};

export const getDiagnostics = async (
  uri: string,
  rules: string
): Promise<Diagnostic[] | null> => {
  const url = new URL(uri);
  const child = spawn("semgrep", ["--disable-version-check", "--json", "--config", rules, url.pathname], {
    timeout: 30 * 1000,
  });

  if (child === null) {
    return null;
  }

  let output = [];
  for await (const chunk of child.stdout) {
    output.push(chunk);
  }

  await onExit(child);

  if (child.exitCode !== 0) {
    return null;
  }

  const results = JSON.parse(output.join("")).results;
  return results.map((result: any) => {
    const range = Range.create(
      Position.create(result.start.line - 1, result.start.col - 1),
      Position.create(result.end.line - 1, result.end.col - 1)
    );
    const diagnostic: Diagnostic = {
      range,
      message: result.extra.message,
      severity: getSeverity(result),
      source: SOURCE_NAME,
      code: result.check_id,
    };

    return diagnostic;
  });
};

export const getVersion = async (): Promise<string | null> => {
  let child;

  child = spawn("semgrep", ["--version"], {
    timeout: 3 * 1000,
  });

  let output = [];
  for await (const chunk of child.stdout) {
    output.push(chunk);
  }

  try {
    await onExit(child);
  } catch(e) {
    return null;
  }

  return output.join('').trim();
};
