import * as vscode from "vscode";

// Diagnostics published by the Semgrep language server set this `source`.
const SEMGREP_SOURCE = "Semgrep";

// A node in the Findings tree: either a file (grouping) or a finding (leaf).
type FindingNode =
  | { kind: "file"; uri: vscode.Uri; count: number }
  | { kind: "finding"; uri: vscode.Uri; diagnostic: vscode.Diagnostic };

/**
 * Tree of Semgrep findings, grouped file -> finding, backed by the same
 * diagnostics that populate the Problems tab (the "semgrep-findings"
 * collection, filtered by `source === "Semgrep"`).
 *
 * Findings show a severity icon (Error/Warning/Info) and sort most-severe
 * first. Product grouping and a 4th ("Critical") severity are not possible yet:
 * the LSP diagnostic carries no product field and no level beyond Info (see
 * fixtures/hermetic/README.md), so those await a language-server change.
 */
// Command that opens a finding and makes its location obvious: it selects the
// finding's line range and reveals it centered in the viewport. Registered once
// from extension activation.
export const OPEN_FINDING_COMMAND = "semgrep.findings.openFinding";

// A transient full-line highlight applied when a finding is opened, so the eye
// lands on the right line. It fades out shortly after.
const findingHighlight = vscode.window.createTextEditorDecorationType({
  isWholeLine: true,
  backgroundColor: new vscode.ThemeColor("editor.rangeHighlightBackground"),
});

export function registerOpenFindingCommand(): vscode.Disposable {
  return vscode.commands.registerCommand(
    OPEN_FINDING_COMMAND,
    async (uri: vscode.Uri, range: vscode.Range) => {
      const doc = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(doc, {
        preview: false,
      });
      // Clamp the range to the opened document. The diagnostic range was
      // captured when the tree item was built; if the file shrank before the
      // LS republished, range.{start,end}.line can be past doc.lineCount and
      // doc.lineAt() would throw, breaking navigation.
      const lastLine = Math.max(doc.lineCount - 1, 0);
      const startLine = Math.min(range.start.line, lastLine);
      const endLineNo = Math.min(range.end.line, lastLine);
      const endLine = doc.lineAt(endLineNo);

      // Select the full span of the finding's lines and center it.
      const selection = new vscode.Selection(
        new vscode.Position(startLine, 0),
        endLine.range.end,
      );
      editor.selection = selection;
      editor.revealRange(selection, vscode.TextEditorRevealType.InCenter);

      // Flash a whole-line highlight, then clear it after a moment. Clear on the
      // captured editor unconditionally — guarding on the active editor would
      // leave the highlight stuck if the user switched tabs during the timeout.
      editor.setDecorations(findingHighlight, [selection]);
      setTimeout(() => {
        editor.setDecorations(findingHighlight, []);
      }, 2500);
    },
  );
}

export class SemgrepFindingsViewProvider
  implements vscode.TreeDataProvider<FindingNode>, vscode.Disposable
{
  public static readonly viewType = "semgrep.view.findings";

  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  // Own the TreeView (not just registerTreeDataProvider) so we can set a count
  // badge on the activity-bar icon.
  private readonly view: vscode.TreeView<FindingNode>;
  private readonly disposables: vscode.Disposable[] = [];

  constructor() {
    this.view = vscode.window.createTreeView(
      SemgrepFindingsViewProvider.viewType,
      { treeDataProvider: this },
    );
    this.disposables.push(this.view);
    this.updateBadge();

    // Refresh the tree and badge whenever diagnostics change (scan finishes,
    // file edited/closed).
    this.disposables.push(
      vscode.languages.onDidChangeDiagnostics(() => {
        this._onDidChangeTreeData.fire();
        this.updateBadge();
      }),
    );
  }

  private updateBadge(): void {
    const total = totalSemgrepFindings(vscode.languages.getDiagnostics());
    this.view.badge =
      total > 0
        ? {
            value: total,
            tooltip: `${total} Semgrep finding${total === 1 ? "" : "s"}`,
          }
        : undefined;
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
  }

  // All URIs that currently have at least one Semgrep finding, sorted by path.
  private semgrepFilesSorted(): { uri: vscode.Uri; count: number }[] {
    return vscode.languages
      .getDiagnostics()
      .map(([uri, diags]) => ({
        uri,
        count: diags.filter((d) => d.source === SEMGREP_SOURCE).length,
      }))
      .filter((f) => f.count > 0)
      .sort((a, b) => a.uri.fsPath.localeCompare(b.uri.fsPath));
  }

  private semgrepDiagnosticsFor(uri: vscode.Uri): vscode.Diagnostic[] {
    return vscode.languages
      .getDiagnostics(uri)
      .filter((d) => d.source === SEMGREP_SOURCE)
      .sort(compareBySeverityThenLine);
  }

  getChildren(element?: FindingNode): vscode.ProviderResult<FindingNode[]> {
    // Root: one node per file with findings.
    if (!element) {
      return this.semgrepFilesSorted().map((f) => ({
        kind: "file",
        uri: f.uri,
        count: f.count,
      }));
    }
    // A file node expands to its findings.
    if (element.kind === "file") {
      return this.semgrepDiagnosticsFor(element.uri).map((diagnostic) => ({
        kind: "finding",
        uri: element.uri,
        diagnostic,
      }));
    }
    // Findings are leaves.
    return [];
  }

  getTreeItem(element: FindingNode): vscode.TreeItem {
    if (element.kind === "file") {
      const item = new vscode.TreeItem(
        vscode.Uri.file(element.uri.fsPath),
        vscode.TreeItemCollapsibleState.Expanded,
      );
      item.label = vscode.workspace.asRelativePath(element.uri);
      item.description = `${element.count}`;
      item.iconPath = vscode.ThemeIcon.File;
      item.resourceUri = element.uri;
      return item;
    }

    // Finding leaf: label is the human message; the full rule id lives in the
    // tooltip (rule ids can be long, dotted, and prefixed by the config source).
    const d = element.diagnostic;
    const item = new vscode.TreeItem(
      d.message,
      vscode.TreeItemCollapsibleState.None,
    );
    const ruleId = codeToString(d.code);
    item.description = `:${d.range.start.line + 1}`; // 1-based for humans
    item.iconPath = severityIcon(d.severity);
    item.tooltip = new vscode.MarkdownString(`**${ruleId}**\n\n${d.message}`);
    // Click opens the file and selects/centers the finding's line so it is easy
    // to see (plain vscode.open with a narrow selection was hard to spot).
    item.command = {
      command: OPEN_FINDING_COMMAND,
      title: "Open finding",
      arguments: [element.uri, d.range],
    };
    return item;
  }
}

// Map a diagnostic severity to a themed codicon, matching how VS Code renders
// severities elsewhere (Problems tab, editor gutter). The extension only
// receives Error/Warning/Information today; Hint falls through to info.
export function severityIcon(
  severity: vscode.DiagnosticSeverity,
): vscode.ThemeIcon {
  switch (severity) {
    case vscode.DiagnosticSeverity.Error:
      return new vscode.ThemeIcon(
        "error",
        new vscode.ThemeColor("problemsErrorIcon.foreground"),
      );
    case vscode.DiagnosticSeverity.Warning:
      return new vscode.ThemeIcon(
        "warning",
        new vscode.ThemeColor("problemsWarningIcon.foreground"),
      );
    default:
      return new vscode.ThemeIcon(
        "info",
        new vscode.ThemeColor("problemsInfoIcon.foreground"),
      );
  }
}

// Order findings most-severe first (Error=0 < Warning=1 < Information=2), then
// by line. VS Code's DiagnosticSeverity enum is already ascending by severity.
export function compareBySeverityThenLine(
  a: vscode.Diagnostic,
  b: vscode.Diagnostic,
): number {
  return a.severity - b.severity || a.range.start.line - b.range.start.line;
}

// Total number of Semgrep findings across all files — the activity-bar badge.
export function totalSemgrepFindings(
  all: [vscode.Uri, readonly vscode.Diagnostic[]][],
): number {
  return all.reduce(
    (sum, [, diags]) =>
      sum + diags.filter((d) => d.source === SEMGREP_SOURCE).length,
    0,
  );
}

// A diagnostic `code` may be a string, number, or { value, target }.
export function codeToString(code: vscode.Diagnostic["code"]): string {
  if (code == null) return "";
  if (typeof code === "object") return String(code.value);
  return String(code);
}

// Exported for unit testing: group a flat diagnostics list (as returned by
// vscode.languages.getDiagnostics()) into the file -> finding tree shape.
export function groupByFile(
  all: [vscode.Uri, readonly vscode.Diagnostic[]][],
): { uri: vscode.Uri; findings: vscode.Diagnostic[] }[] {
  return all
    .map(([uri, diags]) => ({
      uri,
      findings: diags
        .filter((d) => d.source === SEMGREP_SOURCE)
        .sort(compareBySeverityThenLine),
    }))
    .filter((f) => f.findings.length > 0)
    .sort((a, b) => a.uri.fsPath.localeCompare(b.uri.fsPath));
}
