import * as vscode from "vscode";

export class SemgrepDocumentProvider
  implements vscode.TextDocumentContentProvider
{
  static scheme = "showAst";

  private text = "";

  // Provider method that takes an uri of the `references`-scheme and
  // resolves its content by (1) running the reference search command
  // and (2) formatting the results
  provideTextDocumentContent(_: vscode.Uri): string {
    return this.text;
  }
}

export function encodeUri(uri: vscode.Uri): vscode.Uri {
  return uri.with({ scheme: SemgrepDocumentProvider.scheme });
}
