import path = require("path");
import * as vscode from "vscode";
import {promisify} from 'util';
import {execFile} from "child_process";

import {
  SEMGREP_BINARY
} from "./constants";

const execFileAsync = promisify(execFile);

const activateSearch = async (context: vscode.ExtensionContext) => {
    const semgrepSearchProvider = new SemgrepSearchProvider();
    const customView = vscode.window.createTreeView("semgrepTreeView", {treeDataProvider:semgrepSearchProvider});
    
    const subs = context.subscriptions;
    subs.push(
      vscode.commands.registerCommand(
        "semgrep.searchPattern",
        async (context: vscode.ExtensionContext) => await semgrepSearchProvider.search(customView)
      )
    );
    
    subs.push(
      vscode.commands.registerCommand(
        "semgrep.goToFile",
        async (filePath: string, lineNumber: number) => await semgrepSearchProvider.goToFile(filePath, lineNumber)
      )
    );

    subs.push(
      vscode.commands.registerCommand(
        "semgrep.deleteEntry",
        async (element: Finding | SearchResult) => await semgrepSearchProvider.deleteElement(element)
      )
    );
}

export class SemgrepSearchProvider implements vscode.TreeDataProvider<SearchResult | Finding> {

  private _onDidChangeTreeData: vscode.EventEmitter<
  SearchResult | null
> = new vscode.EventEmitter<SearchResult | null>();
readonly onDidChangeTreeData: vscode.Event<SearchResult | null> = this
  ._onDidChangeTreeData.event;


  private results: SearchResult[] = [];

  getTreeItem(element: SearchResult): vscode.TreeItem {
    return element;
  }

  getParent(element: SearchResult | Finding): SearchResult | Finding | undefined {
    /*
      I thought about this for a long time.
      I know this is not the most effective way of doing this
      but it is the easiest. Computers are fast tell this becomes
      a problem i'm just going to leave it like this
    */
    this.results.forEach(e => {
      e.findings.forEach(f => {
        if(f === element){
          return e;
        }
      });
    });

    return undefined
  }

  deleteElement(element: SearchResult | Finding) {

    if (element instanceof SearchResult) {
      this.results = this.results.filter((e) => {
        return e !== element
      })
    } else {
      this.results.forEach((e) => {
        e.findings = e.findings.filter((f) => {
          if (f !== element) { return true }

          // We are going to remove this element so we need to subtract one
          e.description = String(e.findings.length-1)
          
        })
      })
    }

    this._onDidChangeTreeData.fire(null);
  }

  getChildren(element?: SearchResult): Thenable<SearchResult[]> | Thenable<Finding[]> {

    if (element == undefined) {
      return Promise.resolve(this.results)
    }

    return Promise.resolve(element.findings)

    
  }

  goToFile = async (filePath: string, lineNumber: number) => {
    const  openPath = vscode.Uri.parse( "file://" + filePath);
    const document = await vscode.workspace.openTextDocument(openPath)

    const editor = await vscode.window.showTextDocument(document)

    editor.revealRange(new vscode.Range(lineNumber,0,lineNumber,0))//TODO: we should most likely add the end as well since it provided
    editor.selection = new vscode.Selection(lineNumber,0,lineNumber,0)
  }

  search = async (customView: vscode.TreeView<SearchResult | Finding>) => {
    const inputResult = await vscode.window.showInputBox({
		value: '',
		placeHolder: 'Enter Search Pattern',
    });
    
    // User has canceled the request
    if (inputResult == undefined) {
        return
    }

    let languageOptions = [
      "c",
      "go",
      "java",
      "javascript",
      "javascriptreact",
      "json",
      "ocaml",
      "php",
      "python",
      "ruby",
      "typescript",
      "typescriptreact",
    ];

    const lang = vscode.window.activeTextEditor?.document.languageId;

    if (lang != null) {
      // Conveniently, Semgrep's language IDs seem to match up fairly well with
      // VS Code's. At some point we might need to define a mapping here.
      const i = languageOptions.indexOf(lang);
      if (i !== -1) {
        languageOptions.splice(i, 1);
        languageOptions.splice(0, 0, lang);
      }
    }

    const quickPickResult = await vscode.window.showQuickPick(languageOptions, {placeHolder: 'select target language',});


    // User has canceled the request
    if (quickPickResult == undefined) {
      return
    }


    const path = vscode.workspace.workspaceFolders;

    if (path == undefined) {
      return
    }
 
    
    vscode.commands.executeCommand('semgrepTreeView.focus')
    const output = await searchPatternWorkspace(path[0].uri.fsPath, inputResult, quickPickResult)

    customView.message = `Results for pattern: "${inputResult}"`

    //TODO: should a pass this into the fire function instead of using the global scope?
    this.results = output;
    this._onDidChangeTreeData.fire(null);
  }
}

export class SearchResult extends vscode.TreeItem {


  constructor(public readonly label: string, 
    public findings: Finding[],
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly resourceUri: vscode.Uri
    ) {
      super(label, collapsibleState)
      this.iconPath = vscode.ThemeIcon.File
    }
}

export class Finding extends vscode.TreeItem {
  constructor(public readonly label: string, 
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
    ) {
    super(label, collapsibleState)
    this.contextValue = "finding"
  }
}

export default activateSearch;

// Checks a pattern based on path.
export const searchPatternWorkspace = async (
  filePath: string,
  pattern: string,
  lang: string
): Promise<SearchResult[]> => {
  const { stdout, stderr } = await execFileAsync(
    SEMGREP_BINARY,
    ["--json", "-e", pattern, "-l", lang, filePath],
    { timeout: 30 * 1000 }
  );

  let results = new Map<string, SearchResult>();

  JSON.parse(stdout).results.forEach((result: any) => {
    if (results.has(path.basename(result.path))) {
      results
        .get(path.basename(result.path))
        ?.findings.push(
          new Finding(
            result.extra.lines,
            vscode.TreeItemCollapsibleState.None,
            {
              command: "semgrep.goToFile",
              arguments: [result.path, result.start.line - 1],
              title: "Go to file",
            }
          )
        );
    } else {
      results.set(
        path.basename(result.path),
        new SearchResult(
          path.basename(result.path),
          [
            new Finding(
              result.extra.lines,
              vscode.TreeItemCollapsibleState.None,
              {
                command: "semgrep.goToFile",
                arguments: [result.path, result.start.line - 1],
                title: "Go to file",
              }
            ),
          ],
          vscode.TreeItemCollapsibleState.Expanded,
          vscode.Uri.parse( "file://" + result.path)
        )
      );
    }
  });

  if(results.size == 0){
    await vscode.window.showInformationMessage(
      "No Results returned for that pattern"
    );
  }

  return Array.from(results).map(([key, value]) => {
    value.description = String(value.findings.length);
    return value;
  });
};

