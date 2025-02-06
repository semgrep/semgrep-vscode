import * as vscode from "vscode";
import type { Environment } from "../env";

export class SemgrepPolicyViewProvider
  implements vscode.TreeDataProvider<PolicyItem>
{
  public static readonly viewType = "semgrep.view.policy";

  //  [ + add more? ]
  // root
  //  \ connect to org (log in)    OR     <ORG NAME>'s policy
  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly env: Environment,
  ) {
    env.loginEvent = this._onDidChangeTreeData;
  }

  getTreeItem(element: PolicyItem): PolicyItem {
    return element;
  }

  getChildren(
    element?: PolicyItem | undefined,
  ): vscode.ProviderResult<PolicyItem[]> {
    if (!element) {
      if (this.env.loggedIn) {
        const login_status = new PolicyItem("Using your organization's policy");
        login_status.iconPath = new vscode.ThemeIcon("cloud-download");
        return [login_status];
      }
      return [];
    }
    return [];
  }

  private _onDidChangeTreeData: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> =
    this._onDidChangeTreeData.event;
}

class PolicyItem extends vscode.TreeItem {}
