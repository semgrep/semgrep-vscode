import * as vscode from "vscode";

export class SemgrepDocumentProvider
  implements vscode.TextDocumentContentProvider
{
  static scheme = "showAst";

  private text = "";

  // Apparently, you can have this function have no arguments, and it's fine,
  // even though it's specifically supposed to take in two arguments.
  // I have no idea why this should work.
  provideTextDocumentContent(): string {
    return this.text;
  }
}

export function encodeUri(uri: vscode.Uri): vscode.Uri {
  return uri.with({ scheme: SemgrepDocumentProvider.scheme });
}
