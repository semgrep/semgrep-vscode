import * as vscode from "vscode";

export class SemgrepPolicyViewProvider
  implements vscode.TreeDataProvider<PolicyItem>
{
  public static readonly viewType = "semgrep.view.policy";

  constructor(private readonly extensionUri: vscode.Uri) {}

  getTreeItem(element: PolicyItem): PolicyItem {
    return element;
  }

  getChildren(
    element?: PolicyItem | undefined,
  ): vscode.ProviderResult<PolicyItem[]> {
    return [];
  }
}

class PolicyItem extends vscode.TreeItem {}
