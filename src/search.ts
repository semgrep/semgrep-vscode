import * as vscode from "vscode";
import { Environment } from "./env";

// Thanks to vscode references-view for this
function getPreviewChunks(
  doc: vscode.TextDocument,
  range: vscode.Range,
  beforeLen = 8,
  trim = false
) {
  const previewStart = range.start.with({
    character: Math.max(0, range.start.character - beforeLen),
  });
  const wordRange = doc.getWordRangeAtPosition(previewStart);
  let before = doc.getText(
    new vscode.Range(wordRange ? wordRange.start : previewStart, range.start)
  );
  const inside = doc.getText(range);
  const previewEnd = range.end.translate(0, 331);
  let after = doc.getText(new vscode.Range(range.end, previewEnd));
  if (trim) {
    before = before.replace(/^\s*/g, "");
    after = after.replace(/\s*$/g, "");
  }
  return { before, inside, after };
}

export class FileItem extends vscode.TreeItem {
  constructor(readonly uri: vscode.Uri, public matches: MatchItem[]) {
    super(uri, vscode.TreeItemCollapsibleState.Collapsed);
    this.iconPath = vscode.ThemeIcon.File;
    this.description = true;
  }
}

export class MatchItem extends vscode.TreeItem {
  constructor(readonly range: vscode.Range, readonly file: FileItem) {
    super("child", vscode.TreeItemCollapsibleState.None);
    this.contextValue = "match-item";
  }
}

export class SearchResult {
  constructor(readonly uri: string, readonly ranges: vscode.Range[]) {}
}

export class SemgrepSearchProvider
  implements vscode.TreeDataProvider<FileItem | MatchItem>
{
  private readonly _onDidChange = new vscode.EventEmitter<
    FileItem | MatchItem | undefined
  >();

  readonly onDidChangeTreeData = this._onDidChange.event;

  private items: FileItem[] = [];

  setSearchItems(results: SearchResult[]) {
    this.items = results.map((r) => {
      const uri = vscode.Uri.parse(r.uri);
      const fi = new FileItem(uri, []);
      const matches = r.ranges.map(
        (m) => new MatchItem(new vscode.Range(m.start, m.end), fi)
      );
      fi.matches = matches;
      return fi;
    });
    this._onDidChange.fire(undefined);
  }

  async getTreeItem(element: FileItem | MatchItem): Promise<vscode.TreeItem> {
    if (element instanceof MatchItem) {
      const doc = await vscode.workspace.openTextDocument(element.file.uri);
      const range = element.range;
      const { before, inside, after } = getPreviewChunks(doc, range);

      const label: vscode.TreeItemLabel = {
        label: before + inside + after,
        highlights: [[before.length, before.length + inside.length]],
      };
      element.label = label;
      element.command = {
        command: "vscode.open",
        title: "Open Reference",
        arguments: [
          element.file.uri,
          <vscode.TextDocumentShowOptions>{
            selection: range.with({ end: range.start }),
          },
        ],
      };
    }
    return element;
  }
  getChildren(
    element?: FileItem | MatchItem | undefined
  ): vscode.ProviderResult<(FileItem | MatchItem)[]> {
    if (!element) {
      return this.items;
    }
    if (element instanceof FileItem) {
      return element.matches;
    }
    return undefined;
  }
  getParent(
    element: FileItem | MatchItem
  ): vscode.ProviderResult<FileItem | MatchItem> {
    return element instanceof MatchItem ? element.file : undefined;
  }
}
