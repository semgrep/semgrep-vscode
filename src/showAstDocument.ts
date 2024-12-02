import type * as vscode from "vscode";

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
  // Needs to be a .ml here, regrettably, or you won't get OCaml syntax
  // highlighting for the tree.
  return uri.with({
    path: uri.path + ".semgrep_ast.ml",
    scheme: SemgrepDocumentProvider.scheme,
  });
}
