import {
  Event,
  EventEmitter,
  languages,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  window,
} from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import { refreshRules, workspaceRules } from "./lsp_ext";

export function activateRuleExplorer(client: LanguageClient, ci: boolean) {
  const view_id = ci ? "ciExplorer" : "workspaceExplorer";
  window.registerTreeDataProvider(view_id, new RuleExplorer(client, ci));
}

export class Rule extends TreeItem {
  constructor(json: any) {
    super(json.id);
    this.description = json.message;
  }
}

class RuleExplorer implements TreeDataProvider<Rule> {
  private _onDidChangeTreeData: EventEmitter<
    void | Rule | Rule[] | null | undefined
  > = new EventEmitter();

  //private command;
  onDidChangeTreeData: Event<void | Rule | Rule[] | null | undefined> =
    this._onDidChangeTreeData.event;
  constructor(private client: LanguageClient, ci: boolean) {
    /*const command = ci ? ciRules : workspaceRules;
    this.command = command;
    client.onNotification(refreshRules, (params) => {
      if ((params == "ci") == ci) {
        this._onDidChangeTreeData.fire();
      }
    });*/
  }

  getTreeItem(element: Rule): TreeItem | Thenable<TreeItem> {
    return element;
  }
  getChildren(element?: Rule | undefined): ProviderResult<Rule[]> {
    if (element) {
      return [];
    } else {
      /*return this.client.sendRequest(this.command).then((rules) => {
        return rules.map((r) => new Rule(r));
      });*/
    }
  }
}
