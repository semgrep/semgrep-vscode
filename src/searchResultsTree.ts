import * as vscode from "vscode";
import { SearchParams } from "./lspExtensions";

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
    super(uri, vscode.TreeItemCollapsibleState.Expanded);
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

export class TextItem extends vscode.TreeItem {
  constructor(text: string) {
    super(text, vscode.TreeItemCollapsibleState.None);
  }
}

export class SearchResult {
  constructor(readonly uri: string, readonly ranges: vscode.Range[]) {}
}

export class SemgrepSearchProvider
  implements vscode.TreeDataProvider<FileItem | MatchItem | TextItem>
{
  private readonly _onDidChange = new vscode.EventEmitter<
    FileItem | MatchItem | undefined
  >();

  readonly onDidChangeTreeData = this._onDidChange.event;

  private items: (FileItem | TextItem)[] = [];
  public replace: string | null = null;

  public lastSearch: SearchParams | null = null;

  replaceAll(): void {
    const edits = this.items
      .filter((i) => i instanceof FileItem)
      .flatMap((item) => {
        const edit = new vscode.WorkspaceEdit();
        if (item instanceof FileItem) {
          item.matches.forEach((match) => {
            if (item.resourceUri && this.replace) {
              edit.replace(item.resourceUri, match.range, this.replace);
            }
          });
        }
        return edit;
      });
    edits.forEach((e) => vscode.workspace.applyEdit(e));
  }

  clearSearch(): void {
    this.lastSearch = null;
    this.replace = null;
    this.items = [];

    this._onDidChange.fire(undefined);
  }

  setSearchItems(
    results: SearchResult[],
    params: SearchParams,
    replace: string | null
  ): void {
    this.lastSearch = params;
    this.replace = replace;

    this.items = results.map((r) => {
      const uri = vscode.Uri.parse(r.uri);
      const fi = new FileItem(uri, []);
      const matches = r.ranges.map(
        (m) => new MatchItem(new vscode.Range(m.start, m.end), fi)
      );
      fi.matches = matches;
      return fi;
    });
    if (this.items.length == 0) {
      this.items.push(new TextItem("No results found :("));
    }

    const searchInfo: TextItem[] = [];

    const paramsInfo = new TextItem("Search Parameters:");
    searchInfo.push(paramsInfo);

    const searchPattern = new TextItem(`Pattern:`);
    searchPattern.description = params.pattern;
    searchPattern.iconPath = new vscode.ThemeIcon("microscope");
    searchInfo.push(searchPattern);

    const searchLanguage = new TextItem(`Language:`);
    searchLanguage.description = params.language ? params.language : "All";
    searchLanguage.iconPath = new vscode.ThemeIcon("symbol-object");
    searchInfo.push(searchLanguage);

    if (replace) {
      const searchReplace = new TextItem(`Replace with:`);
      searchReplace.description = replace;
      searchReplace.iconPath = new vscode.ThemeIcon("search-replace");
      searchInfo.push(searchReplace);
    }
    const actions = new TextItem("Actions:");
    searchInfo.push(actions);

    if (replace) {
      const replaceAction = new TextItem("Replace All");
      replaceAction.iconPath = new vscode.ThemeIcon("search-replace-all");
      replaceAction.command = {
        title: "Replace All",
        command: "semgrep.search.replace",
      };
      searchInfo.push(replaceAction);
    }

    const editSearch = new TextItem("Edit Search");
    editSearch.iconPath = new vscode.ThemeIcon("pencil");
    editSearch.command = { title: "Edit Search", command: "semgrep.search" };
    searchInfo.push(editSearch);

    this.items = [...searchInfo, ...this.items];
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
