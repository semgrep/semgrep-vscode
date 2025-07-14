import * as vscode from "vscode";
import type { Environment } from "../env";

export class SemgrepPolicyViewProvider
  implements vscode.TreeDataProvider<PolicyItem>
{
  public static readonly viewType = "semgrep.view.policy";

  //  [ + add more? ]
  // root
  //  \ connect to org (log in)    OR     <ORG NAME>'s policy
  //  \ ...items from config
  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly env: Environment,
  ) {
    env.loginEvent = this._onDidChangeTreeData;
    // Also refresh when configuration changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("semgrep.scan.configuration")) {
        this._onDidChangeTreeData.fire();
      }
    });
  }

  getTreeItem(element: PolicyItem): PolicyItem {
    return element;
  }

  getChildren(
    element?: PolicyItem | undefined,
  ): vscode.ProviderResult<PolicyItem[]> {
    if (!element) {
      const items: PolicyItem[] = [];

      // Show org policy if logged in
      if (this.env.deploymentName) {
        const loginStatus = new PolicyItem(
          `Using ${this.env.deploymentName}'s policy`,
          vscode.TreeItemCollapsibleState.None,
        );
        loginStatus.iconPath = new vscode.ThemeIcon("cloud-download");
        items.push(loginStatus);
      }

      // Show local configurations if any exist
      const localConfigs =
        this.env.config.cfg.get<string[]>("scan.configuration") || [];
      for (const config of localConfigs) {
        const configItem = new PolicyItem(
          config,
          vscode.TreeItemCollapsibleState.None,
        );
        configItem.iconPath = new vscode.ThemeIcon("file-code");
        items.push(configItem);
      }

      return items;
    }
    return [];
  }

  private _onDidChangeTreeData: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> =
    this._onDidChangeTreeData.event;
}

class PolicyItem extends vscode.TreeItem {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState = vscode
      .TreeItemCollapsibleState.None,
  ) {
    super(label, collapsibleState);
  }
}
