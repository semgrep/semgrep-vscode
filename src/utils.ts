import { tmpdir } from "os";
import { OutputChannel, Uri } from "vscode";
import * as vscode from "vscode";

import { LSP_LOG_FILE } from "./constants";
import { ViewResults } from "./webview-ui/src/types/results";

export const DEFAULT_LSP_LOG_URI = Uri.joinPath(
  Uri.file(tmpdir()),
  LSP_LOG_FILE
);

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

export async function applyFixAndSave(
  edit: vscode.WorkspaceEdit
): Promise<void> {
  const uris = edit.entries().map(([uri]) => uri);
  // According to https://github.com/microsoft/vscode/issues/112109,
  // adding { isRefactoring: true} should make the fix auto-save.
  // I couldn't get it to work, though, so let's just save the file manually.
  await vscode.workspace.applyEdit(edit);
  await Promise.all(
    uris.map((uri) =>
      vscode.workspace.openTextDocument(uri).then((doc) => doc.save())
    )
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
          match.searchMatch.fix
        );
      }
    })
  );
  await applyFixAndSave(edit);
}
