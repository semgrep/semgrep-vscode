
import * as vscode from "vscode";
import { searchPatternWorkspace } from "./cli";


const activateSearch = async (context: vscode.ExtensionContext) => {
    const semgrepSearchProvider = new SemgrepSearchProvider();
    const customView = vscode.window.createTreeView("semgrepTreeView", {treeDataProvider:semgrepSearchProvider});
    
    const subs = context.subscriptions;
    subs.push(
      vscode.commands.registerCommand(
        "semgrep.searchPattern",
        async (context: vscode.ExtensionContext) => await semgrepSearchProvider.search()
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

    /*I thought about this for a long time.
      I know this is not the most effective way of doing this
      but it is the easiest. Computers are fast tell this becomes
      a problem i'm just going to leave it like this
    */
    this.results.forEach(e => {
      e.fingings.forEach(f => {
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
        e.fingings = e.fingings.filter((f) => {
          if (f !== element) { return true }

          //We are going to remove this element so we need to subtract one
          e.description = String(e.fingings.length-1)
          
        })
      })
    }

    this._onDidChangeTreeData.fire();
  }

  getChildren(element?: SearchResult): Thenable<SearchResult[]> | Thenable<Finding[]> {

    if (element == undefined) {
      return Promise.resolve(this.results)
    }

    return Promise.resolve(element.fingings)

    
  }

  goToFile = async (filePath: string, lineNumber: number) => {
    const  openPath = vscode.Uri.parse( "file://" + filePath);
    const document = await vscode.workspace.openTextDocument(openPath)

    const editor = await vscode.window.showTextDocument(document)

    editor.revealRange(new vscode.Range(lineNumber,0,lineNumber,0))//TODO: we should most likely add the end as well since it provided
    editor.selection = new vscode.Selection(lineNumber,0,lineNumber,0)
  }

  search = async () => {
    const inputResult = await vscode.window.showInputBox({
		value: '',
		placeHolder: 'Enter Search Pattern',
    });
    
    //User has canceled the request
    if (inputResult == undefined) {
        return
    }

    const quickPickResult = await vscode.window.showQuickPick(["c",
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
    "typescriptreact"], {
    placeHolder: 'select target language',});


    //User has canceled the request
    if (quickPickResult == undefined) {
      return
    }


    const path = vscode.workspace.workspaceFolders;

    if (path == undefined) {
      return
    }
 
    
    const output = await searchPatternWorkspace(path[0].uri.fsPath, inputResult, quickPickResult)

    this.results = output;//TODO: should a pass this into the fire function instead of using the global scope?
    this._onDidChangeTreeData.fire();
}




}

export class SearchResult extends vscode.TreeItem {


  constructor(public readonly label: string, 
    public fingings: Finding[],
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