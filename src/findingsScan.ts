import * as cp from "node:child_process";
import * as path from "node:path";
import * as vscode from "vscode";
import type { Environment } from "./env";
import { semgrepBinaryPath } from "./semgrepBinary";

/*****************************************************************************/
/* Prelude */
/*****************************************************************************/

/* Running `semgrep scan --json` for the findings tree.

   The language server publishes findings as LSP diagnostics, but a diagnostic
   only carries range/severity/source/message/code — there is no `data`
   payload, so a rule's metadata never reaches us that way. The CLI's JSON
   output carries the whole rule:

     extra.metadata.vulnerability_class   "Cross-Site-Scripting (XSS)"
     extra.metadata.cwe / .owasp          classification
     extra.metadata.shortlink             https://sg.run/...
     extra.severity                       INFO | WARNING | ERROR | CRITICAL
     extra.fingerprint                    stable id across runs

   Note that `extra.severity` has four levels where LSP diagnostics only have
   three — CRITICAL is flattened into Error over the wire, so the CLI actually
   tells us more than the server does.

   This is a second scan, separate from the one the language server runs. It
   only happens when the user asks for it.
 */

/*****************************************************************************/
/* Types */
/*****************************************************************************/

export type ScanSeverity = "critical" | "error" | "warning" | "info";

export type ScanFinding = {
  uri: vscode.Uri;
  range: vscode.Range;
  severity: ScanSeverity;
  message: string;
  ruleId: string;
  vulnerabilityClass: string | undefined;
  cwe: string | undefined;
  docsUrl: vscode.Uri | undefined;
  fingerprint: string | undefined;
};

/* Only the parts of the CLI's output we actually read. */
type RawResult = {
  check_id?: string;
  path?: string;
  start?: { line?: number; col?: number };
  end?: { line?: number; col?: number };
  extra?: {
    message?: string;
    severity?: string;
    fingerprint?: string;
    is_ignored?: boolean;
    metadata?: {
      vulnerability_class?: string[] | string;
      cwe?: string[] | string;
      shortlink?: string;
    };
  };
};

type RawError = { message?: string };

export class ScanError extends Error {}

/* `auto` cannot be resolved with metrics turned off — Semgrep reports this as a
   scan error rather than a crash, so it has to be read out of the payload. */
function rejectedAutoConfig(parsed: {
  results?: RawResult[];
  errors?: RawError[];
}): boolean {
  if ((parsed.results ?? []).length > 0) {
    return false;
  }
  return (parsed.errors ?? []).some((error) =>
    /auto config|invalid configuration/i.test(error.message ?? ""),
  );
}

/*****************************************************************************/
/* Helpers */
/*****************************************************************************/

/* Rules are written against two severity vocabularies — the original
   ERROR/WARNING/INFO and the newer CRITICAL/HIGH/MEDIUM/LOW — and both reach
   the scan output. Missing the second set silently demotes a HIGH finding to
   the bottom of the tree wearing an info icon. */
function severityOf(raw: string | undefined): ScanSeverity {
  switch ((raw ?? "").toUpperCase()) {
    case "CRITICAL":
      return "critical";
    case "ERROR":
    case "HIGH":
      return "error";
    case "WARNING":
    case "MEDIUM":
      return "warning";
    default:
      return "info";
  }
}

/* Rule metadata is hand-written, so values arrive with stray whitespace
   ("Insecure Deserialization ") often enough to be worth trimming here. */
function firstOf(value: string[] | string | undefined): string | undefined {
  const item = Array.isArray(value) ? value[0] : value;
  if (typeof item !== "string") {
    return undefined;
  }
  const trimmed = item.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/* Build the argument list from the same settings the language server is
   configured with, so the two scans agree on scope.

   When no configuration is set we deliberately pass no `--config` at all: that
   is what makes the CLI fall back to the logged-in deployment's policy, which
   is what most users are actually scanning with. */
function scanArgs(
  env: Environment,
  targets: string[],
  /* Whether to ask for the deployment/registry rules alongside any locally
     configured ones. See the note below. */
  includeAutoConfig: boolean,
): string[] {
  const cfg = env.config.cfg;
  const args = ["scan", "--json"];

  const configs = cfg.get<string[]>("scan.configuration") ?? [];

  /* The language server merges the deployment's policy with whatever
     `scan.configuration` lists, but the CLI replaces: passing `--config
     my-rules.yaml` runs *only* those rules and silently drops the policy. That
     divergence is very visible here, because local rules rarely carry
     `metadata.vulnerability_class` while registry rules almost always do — so
     a workspace with its own rule file would show a tree with no
     classifications at all.

     `auto` is what a bare `semgrep scan` resolves to, and it maps to the
     logged-in deployment's policy, so adding it back alongside the local
     configs reproduces what the language server reports. */
  if (includeAutoConfig && configs.length > 0) {
    args.push("--config", "auto");
  }
  for (const config of configs) {
    args.push("--config", config);
  }
  for (const include of cfg.get<string[]>("scan.include") ?? []) {
    args.push("--include", include);
  }
  for (const exclude of cfg.get<string[]>("scan.exclude") ?? []) {
    args.push("--exclude", exclude);
  }

  const jobs = cfg.get<number>("scan.jobs");
  if (jobs) {
    args.push("--jobs", String(jobs));
  }
  const maxMemory = cfg.get<number>("scan.maxMemory");
  if (maxMemory) {
    args.push("--max-memory", String(maxMemory));
  }
  const maxTargetBytes = cfg.get<number>("scan.maxTargetBytes");
  if (maxTargetBytes) {
    args.push("--max-target-bytes", String(maxTargetBytes));
  }
  const timeout = cfg.get<number>("scan.timeout");
  if (timeout) {
    args.push("--timeout", String(timeout));
  }
  const timeoutThreshold = cfg.get<number>("scan.timeoutThreshold");
  if (timeoutThreshold !== undefined) {
    args.push("--timeout-threshold", String(timeoutThreshold));
  }
  if (cfg.get<boolean>("scan.pro_intrafile")) {
    args.push("--pro");
  }

  /* Deliberately no `--metrics` flag. Semgrep reads the user's own metrics
     preference from its settings, and forcing it off here breaks the
     no-`--config` case outright: resolving the logged-in deployment's policy
     goes through the auto-config path, which refuses to run with metrics
     disabled. The language server is launched without a metrics flag for the
     same reason, so this keeps the two consistent. */

  args.push(...targets);
  return args;
}

/* `execFile` buffers to 1MB by default, which a real workspace scan blows
   through immediately, so collect the output ourselves. */
function execCollect(
  command: string,
  args: string[],
  cwd: string,
  token: vscode.CancellationToken,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = cp.spawn(command, args, { cwd });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    const cancel = token.onCancellationRequested(() => child.kill());

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", (err) => {
      cancel.dispose();
      reject(new ScanError(err.message));
    });
    child.on("close", (code) => {
      cancel.dispose();
      if (token.isCancellationRequested) {
        reject(new vscode.CancellationError());
        return;
      }
      const out = Buffer.concat(stdout).toString();
      /* Semgrep exits non-zero for findings-as-errors and for genuine
         failures alike, so trust the payload over the exit code: if we got
         parseable JSON back, the scan ran. */
      if (out.trim().length > 0) {
        resolve(out);
        return;
      }
      const err = Buffer.concat(stderr).toString().trim();
      reject(
        new ScanError(
          err.split("\n").slice(-5).join("\n") ||
            `Semgrep exited with code ${code} and produced no output.`,
        ),
      );
    });
  });
}

/*****************************************************************************/
/* Scanning */
/*****************************************************************************/

export async function runFindingsScan(
  env: Environment,
  token: vscode.CancellationToken,
): Promise<ScanFinding[]> {
  const folders = vscode.workspace.workspaceFolders ?? [];
  if (folders.length === 0) {
    throw new ScanError("Open a folder before scanning for findings.");
  }

  const binary = semgrepBinaryPath(env);
  if (!binary) {
    throw new ScanError("Could not find the Semgrep binary.");
  }

  const cwd = folders[0].uri.fsPath;
  const targets = folders.map((folder) => folder.uri.fsPath);

  const scan = async (includeAutoConfig: boolean) => {
    const raw = await execCollect(
      binary,
      scanArgs(env, targets, includeAutoConfig),
      cwd,
      token,
    );
    try {
      return JSON.parse(raw) as { results?: RawResult[]; errors?: RawError[] };
    } catch {
      throw new ScanError("Could not parse Semgrep's JSON output.");
    }
  };

  let parsed = await scan(true);
  /* Resolving `auto` needs Semgrep's metrics enabled, which is the user's
     choice to make. If that is why it failed, fall back to their local rules
     alone: fewer classifications beats no findings. */
  if (rejectedAutoConfig(parsed)) {
    parsed = await scan(false);
  }

  const findings: ScanFinding[] = [];
  for (const result of parsed.results ?? []) {
    if (result.extra?.is_ignored || !result.check_id || !result.path) {
      continue;
    }
    const start = result.start ?? {};
    const end = result.end ?? {};
    // Semgrep counts lines and columns from 1; VS Code counts from 0.
    const startLine = Math.max(0, (start.line ?? 1) - 1);
    const startCol = Math.max(0, (start.col ?? 1) - 1);
    const endLine = Math.max(0, (end.line ?? start.line ?? 1) - 1);
    const endCol = Math.max(0, (end.col ?? start.col ?? 1) - 1);

    const metadata = result.extra?.metadata ?? {};
    const shortlink = metadata.shortlink;

    findings.push({
      uri: vscode.Uri.file(path.resolve(cwd, result.path)),
      range: new vscode.Range(startLine, startCol, endLine, endCol),
      severity: severityOf(result.extra?.severity),
      message: result.extra?.message ?? "",
      ruleId: result.check_id,
      vulnerabilityClass: firstOf(metadata.vulnerability_class),
      cwe: firstOf(metadata.cwe),
      docsUrl: shortlink ? vscode.Uri.parse(shortlink) : undefined,
      fingerprint: result.extra?.fingerprint,
    });
  }
  return findings;
}
