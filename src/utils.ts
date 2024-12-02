import { tmpdir } from "node:os";
import * as semver from "semver";
import { Uri } from "vscode";
import type { OutputChannel } from "vscode";
import * as vscode from "vscode";
import { getVersionInfo } from "./constants";
import type { ViewResults } from "./webviews/types/results";

// Can't put this in constants for some reason??
export const DEFAULT_LSP_LOG_FOLDER = Uri.file(tmpdir());

export class Logger {
  enabled: boolean;
  channel: OutputChannel;

  constructor(enabled: boolean, channel: OutputChannel) {
    this.enabled = enabled;
    this.channel = channel;
  }

  enableLogger(enabled: boolean): void {
    this.enabled = enabled;
  }

  log(message: string): void {
    if (this.enabled) {
      this.channel.appendLine(message);
    }
  }
}

export async function checkCliVersion(
  currentVersion: semver.SemVer,
): Promise<void> {
  const versionInfo = await getVersionInfo();
  if (!versionInfo) {
    return;
  }
  // Set context for the current version so we can gate vscode UI based on it
  vscode.commands.executeCommand(
    "setContext",
    "semgrep.cli.minor",
    currentVersion.minor,
  );
  vscode.commands.executeCommand(
    "setContext",
    "semgrep.cli.major",
    currentVersion.major,
  );
  if (semver.compare(currentVersion, versionInfo.min) === -1) {
    vscode.window.showErrorMessage(
      `The Semgrep Extension requires a Semgrep CLI version ${versionInfo.min}, the current installed version is ${currentVersion}, please upgrade.`,
    );
  }
  if (semver.compare(currentVersion, versionInfo.latest) === -1) {
    vscode.window.showWarningMessage(
      `Some features of the Semgrep Extension require a Semgrep CLI version ${versionInfo.latest}, but the current installed version is ${currentVersion}, some features may be disabled, please upgrade.`,
    );
  }
}

export async function applyFixAndSave(
  edit: vscode.WorkspaceEdit,
): Promise<void> {
  const uris = edit.entries().map(([uri]) => uri);
  // According to https://github.com/microsoft/vscode/issues/112109,
  // adding { isRefactoring: true} should make the fix auto-save.
  // I couldn't get it to work, though, so let's just save the file manually.
  await vscode.workspace.applyEdit(edit);
  await Promise.all(
    uris.map((uri) =>
      vscode.workspace.openTextDocument(uri).then((doc) => doc.save()),
    ),
  );
}

export async function replaceAll(matches: ViewResults): Promise<void> {
  const edit = new vscode.WorkspaceEdit();
  matches.locations.map((result) =>
    /* We don't want to fix anything which was already fixed. */
    result.matches.forEach((match) => {
      if (match.searchMatch.fix && !match.isFixed) {
        edit.replace(
          vscode.Uri.parse(result.uri),
          match.searchMatch.range,
          match.searchMatch.fix,
        );
      }
    }),
  );
  await applyFixAndSave(edit);
}
