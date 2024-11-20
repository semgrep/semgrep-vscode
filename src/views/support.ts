import * as vscode from "vscode";

export class SemgrepHelpProvider implements vscode.TreeDataProvider<HelpItem> {
  public static readonly viewType = "semgrep.view.help";
  private readonly rootChildren = [
    new HelpItem({
      label: "Join our Slack",
      iconPath: {
        light: vscode.Uri.joinPath(
          this.extensionUri,
          "media",
          "slack/light.svg",
        ),
        dark: vscode.Uri.joinPath(this.extensionUri, "media", "slack/dark.svg"),
      },
      command: {
        title: "Join Slack",
        command: "vscode.open",
        arguments: ["https://go.semgrep.dev/slack"],
      },
    }),
    new HelpItem({
      label: "Email Support",
      iconPath: new vscode.ThemeIcon("mail"),
      command: {
        title: "Draft Email",
        command: "vscode.open",
        arguments: [
          `mailto:support@semgrep.com?subject=VSCode%20Extension%20Bug%20Report&body=Extension%20Version%3A%20${this.extVersion}%0A`,
        ],
      },
    }),
    new HelpItem({
      label: "Documentation",
      iconPath: new vscode.ThemeIcon("book"),
      command: {
        title: "Open Documentation",
        command: "vscode.open",
        arguments: ["https://semgrep.dev/docs/extensions/semgrep-vs-code"],
      },
    }),
  ];

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly extVersion: string,
  ) {}

  getTreeItem(element: HelpItem): HelpItem {
    return element;
  }

  getChildren(
    element?: HelpItem | undefined,
  ): vscode.ProviderResult<HelpItem[]> {
    if (element === undefined) {
      return this.rootChildren;
    }
    return element.children;
  }
}

type HelpItemParams = {
  label: string;
  description?: string;
  resourceUri?: vscode.Uri;
  iconPath?: vscode.TreeItem["iconPath"];
  command?: vscode.Command;
  collapsibleState?: vscode.TreeItemCollapsibleState;
  children?: HelpItem[];
};

class HelpItem extends vscode.TreeItem {
  constructor(options: HelpItemParams) {
    const collapsibleState =
      options.collapsibleState ||
      (options.children && vscode.TreeItemCollapsibleState.Collapsed) ||
      vscode.TreeItemCollapsibleState.None;
    const children = options.children || [];
    super(options.label, collapsibleState);
    this.children = children;
    this.command = options.command;
    this.iconPath = options.iconPath;
    this.resourceUri = options.resourceUri;
  }

  readonly children: HelpItem[];
}
