# Semgrep Visual Studio Code extension

[Semgrep](https://semgrep.dev/) is a fast, static analysis tool powered by an open-source engine for finding bugs, detecting vulnerabilities, and enforcing code standards. Semgrep Visual Studio Code extension scans lines when you change or open files or all files in your workspace. It offers:

- Automatic scans whenever you open a file
- Inline results and problem highlighting, as well as quick links to the definitions of the rules underlying the findings
- Autofix, which allows you to apply Semgrep's suggested resolution for the findings

<video src="https://github.com/semgrep/semgrep-vscode/assets/626337/b08d17b6-3fb7-46fe-93ec-09f9257d58a3" controls="controls">
</video>

## Prerequisites

- Windows users must use Semgrep VS Code extension v1.6.2 or later.

## Quickstart

1. [Install the Semgrep extension](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-an-extension) in Visual Studio Code.
2. Use <kbd>Ctrl+⇧Shift+P</kbd> or <kbd>⌘Command+⇧Shift+P</kbd> (macOS) to launch the Command Palette, and run the following to sign in to Semgrep Cloud Platform:
   ```console
   Semgrep: Sign in
   ```
   You can use the extension without signing in, but doing so enables better results since you benefit from [Semgrep Code](https://semgrep.dev/products/semgrep-code/) and its [Pro rules](https://semgrep.dev/docs/semgrep-code/pro-rules/).
3. Launch the Command Palette using <kbd>Ctrl+⇧Shift+P</kbd> or <kbd>⌘Command+⇧Shift+P</kbd> (macOS), and scan your files by running:
   ```console
   Semgrep: Scan all files in workspace
   ```
4. To see detailed vulnerability information, hover over the code that's underlined in yellow. You can also see the findings identified by Semgrep using <kbd>⇧Shift+Ctrl+M</kbd> or <kbd>⌘Command+⇧Shift+M</kbd> (macOS) and opening the **Problems** tab.

   <video src="https://github.com/semgrep/semgrep-vscode/assets/626337/49033d56-f4f4-4b70-8318-1b0ea8e991b5" controls="controls">
   </video>

## Use the full potential of Semgrep

Try Autofix.

https://github.com/semgrep/semgrep-vscode/assets/626337/3b6a730d-57e9-48a4-8065-9fa52388d77a

Add and update new rules to expand Semgrep extension capabilities.

https://github.com/semgrep/semgrep-vscode/assets/626337/fed6b6ec-e0b5-495b-a488-4f3c805dd58b

Fine-tune and customize the rules Semgrep uses to improve your scan results:

1. Go to [Semgrep Registry](https://semgrep.dev/explore). Ensure that you are signed in.
2. Explore the Semgrep Registry. When you find a rule you want to add, click the **plus sign** to expand the rule. Click **Add to Policy**, and [select your mode](https://semgrep.dev/docs/semgrep-code/policies#blocking-a-pr-or-mr-through-rule-modes). You can view and manage all of your rules in [Policies](https://semgrep.dev/orgs/-/policies).
3. Rescan your code. Use <kbd>Ctrl+⇧Shift+P</kbd> or <kbd>⌘Command+⇧Shift+P</kbd> (macOS) to launch the Command Palette, then run `Semgrep: Update rules`.

### Language support

Semgrep supports 30+ languages, including:

Apex · Bash · C · C++ · C# · Clojure · Dart · Dockerfile · Elixir · HTML · Go · Java · JavaScript · JSX · JSON · Julia · Jsonnet · Kotlin · Lisp · Lua · OCaml · PHP · Python · R · Ruby · Rust · Scala · Scheme · Solidity · Swift · Terraform · TypeScript · TSX · YAML · XML · Generic (ERB, Jinja, etc.)

## Configure the extension

To configure the Semgrep extension, open its **Extension Settings** page:

1. Use <kbd>⇧Shift+Ctrl+X</kbd> or <kbd>⇧Shift+⌘Command+X</kbd> (macOS) to open the **Extensions** view.
2. Select **Semgrep**.
3. Click the **gear** and select **Extension Settings**.

### Configuration options

- **Semgrep › Do Hover**: Enable AST node views when hovering over a finding.
- **Semgrep › Path**: Set the path to the Semgrep executable.
- **Semgrep › Scan: Configuration**: Specify rules or rulesets you want Semgrep to use to scan your code. Each item can be a YAML configuration file, a URL of a configuration file, or a directory of YAML files. Use `auto` to automatically obtain rules tailored to your project. Semgrep uses your project URL to log into the Semgrep Registry. See [Running rules](https://semgrep.dev/docs/running-rules/) for more information. Run `Semgrep: Update rules` using the Visual Studio Code Command Palette to update the rules configuration for your next scan whenever you change the rule configuration.
- **Semgrep › Scan: Exclude**: List files and directories that Semgrep should ignore when scanning.
- **Semgrep › Scan: Include**: List files and directories scanned by Semgrep. This option globally overrides the workspace setting. As a result, Semgrep scans all included paths.
- **Semgrep › Scan: Jobs**: Specify how many parallel jobs can run simultaneously. The default number of parallel jobs is one.
- **Semgrep › Scan: Max Memory**: Sets the maximum memory in MB to use.
- **Semgrep › Scan: Max Target Bytes**: Sets the maximum size of the target in bytes to scan.
- **Semgrep › Scan: Only Git Dirty**: Allow Semgrep to scan your code whenever you open a new file and display the findings for lines that have changed since the last commit. On by default.
- **Semgrep › Scan: Pro_intrafile**: Enable intrafile scanning using the Pro Engine.
- **Semgrep › Scan: Timeout**: Set the maximum run time in seconds before Semgrep times out and stops scanning your code. The default value is 30.
- **Semgrep › Scan: Timeout Threshold**: Set the maximum number of rules that can timeout on a file before the file is skipped. If set to 0, there will be no limit. Defaults to 3.
- **Semgrep > Trace: Server**: This option is useful for debugging. The **messages** option displays communication of the Semgrep Visual Studio Code extension with the LSP server. The default option is **verbose**.

### Experimental configuration options:

The following experimental features should only be used upon recommendation by Semgrep:

- **Semgrep > Use JS**: Use the JavaScript version of the extension. Enabled by default for Windows users.
- **Semgrep > Heap Size JS**: Set the maximum heap size in MB for the JavaScript version of the extension. Increase if the extension crashes while downloading rules.
- **Semgrep > Ignore Cli Version**: Ignore the CLI Version and enable all extension features.
- **Semgrep > Stack Size JS**: Set the maximum stack size in KB for the JavaScript version of the extension.

## Commands

Run Semgrep extension commands through the [Visual Studio Code Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette). You can access the Command Palette using <kbd>Ctrl+⇧Shift+P</kbd> or <kbd>⌘Command+⇧Shift+P</kbd> (macOS). The following list includes all available Semgrep extension commands:

- `Semgrep: Scan all files in a workspace`: Scan all files in the current workspace.
- `Semgrep Search: Clear`: Clear pattern searches from the Primary Side Bar's Semgrep Search view.
- `Semgrep Search: Focus on Search Results View`: Bring the Primary Side Bar's Semgrep Search view into focus
- `Semgrep Restart Language Server`: Restart the language server
- `Semgrep: Scan changed files in a workspace`: Scan files that have been changed since the last commit in your current workspace.
- `Semgrep: Search by pattern`: Search for patterns in code using Semgrep pattern syntax. For more information, see [Pattern syntax](https://semgrep.dev/docs/writing-rules/pattern-syntax/) documentation.
- `Semgrep: Show Generic AST`: Show generic AST in a new window
- `Semgrep: Show named Generic AST`: Show named AST in a new window
- `Semgrep: Sign in`: Sign in or log in to the Semgrep Cloud Platform (this command opens a new window in your browser). When you sign in, you can automatically scan with Semgrep [Pro rules](https://semgrep.dev/docs/semgrep-code/pro-rules/) and add additional rules to the [Policies](https://semgrep.dev/orgs/-/policies) in Semgrep Code. If you are logged in with the command-line interface using <code>semgrep&nbsp;login</code>, you are already signed in with the Visual Studio Code Semgrep extension also. Alternatively, you can log in through your command-line interface by running `semgrep login`.
- `Semgrep: Sign out`: Log out from Semgrep Cloud Platform. Alternatively, you can sign out through your command-line interface by running `semgrep logout`.
- `Semgrep: Update rules`: For logged-in users. If the rules in the [Policies](https://semgrep.dev/orgs/-/policies) or rules included through the **Semgrep › Scan: Configuration** configuration option have been changed, this command loads the new configuration of your rules for your next scan.

**Tip**: You can click the Semgrep icon in the Visual Studio Code to access all available commands quickly.

## Support

If you need our support, join the [Semgrep community Slack workspace](http://go.semgrep.dev/slack) and tell us about any problems you encounter.
