import * as vscode from "vscode";
import { SearchParams } from "./lspExtensions";
import { applyFixAndSave } from "./utils";

// Thanks to vscode references-view for this
export function getPreviewChunks(
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
    super(uri, vscode.TreeItemCollapsibleState.Expanded);
    this.iconPath = vscode.ThemeIcon.File;
    this.description = true;
  }
}

export class MatchItem extends vscode.TreeItem {
  constructor(
    readonly range: vscode.Range,
    readonly file: FileItem,
    readonly fix: string | null
  ) {
    super("child", vscode.TreeItemCollapsibleState.None);
    this.contextValue = "match-item";
    this.fix = fix;
  }
}

export class TextItem extends vscode.TreeItem {
  constructor(text: string) {
    super(text, vscode.TreeItemCollapsibleState.None);
  }
}

export type SearchMatch = {
  range: vscode.Range;
  fix: string | null;
};

export class SearchResult {
  constructor(readonly uri: string, readonly matches: SearchMatch[]) {}
}

export class SemgrepSearchProvider
  implements vscode.TreeDataProvider<FileItem | MatchItem | TextItem>
{
  private readonly _onDidChange = new vscode.EventEmitter<
    FileItem | MatchItem | undefined
  >();

  readonly onDidChangeTreeData = this._onDidChange.event;

  private items: (FileItem | TextItem)[] = [];
  private fix_text: string | null = null;

  public lastSearch: SearchParams | null = null;

  getFilesWithFixes(): FileItem[] {
    return this.items.flatMap((i) => {
      if (i instanceof FileItem && i.matches.some((m) => m.fix != null)) {
        return [i];
      }
      return [];
    });
  }

  async replaceItem(node: FileItem | MatchItem): Promise<void> {
    if (node instanceof MatchItem && node.fix) {
      const edit = new vscode.WorkspaceEdit();
      edit.replace(node.file.uri, node.range, node.fix);
      await applyFixAndSave(edit);

      // TODO: the match view for the fixed file should be updated
    }
  }

  clearSearch(): void {
    this.lastSearch = null;
    this.fix_text = null;
    this.items = [];

    this._onDidChange.fire(undefined);
  }

  // setSearchItems(results: SearchResult[], params: SearchParams): void {
  //   this.lastSearch = params;
  //   this.fix_text = params.fix;

  //   this.items = results.map((r) => {
  //     const uri = vscode.Uri.parse(r.uri);
  //     const fi = new FileItem(uri, []);
  //     const matches = r.matches.map(
  //       (m) =>
  //         new MatchItem(new vscode.Range(m.range.start, m.range.end), fi, m.fix)
  //     );
  //     fi.matches = matches;
  //     return fi;
  //   });
  //   if (this.items.length == 0) {
  //     this.items.push(new TextItem("No results found :("));
  //   }

  //   this._onDidChange.fire(undefined);
  // }

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
    element?: FileItem | MatchItem | TextItem | undefined
  ): vscode.ProviderResult<(FileItem | MatchItem | TextItem)[]> {
    if (!element) {
      return this.items;
    }
    if (element instanceof FileItem) {
      return element.matches;
    }
    return undefined;
  }
  getParent(
    element: FileItem | MatchItem | TextItem
  ): vscode.ProviderResult<FileItem | MatchItem> {
    return element instanceof MatchItem ? element.file : undefined;
  }
}
