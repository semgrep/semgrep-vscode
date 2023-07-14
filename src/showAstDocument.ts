import * as vscode from "vscode";

export class SemgrepDocumentProvider
  implements vscode.TextDocumentContentProvider
{
  static scheme = "showAst";

  private text = "";

  provideTextDocumentContent(_: vscode.Uri): string {
    return this.text;
  }
}

export function encodeUri(uri: vscode.Uri): vscode.Uri {
  return uri.with({ scheme: SemgrepDocumentProvider.scheme });
}
