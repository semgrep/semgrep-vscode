# Semgrep Visual Studio Code extension

[Semgrep](https://semgrep.dev/) is a fast, static analysis tool for finding bugs, detecting vulnerabilities, and enforcing code standards powered by an open-source engine. Semgrep Visual Studio Code extension scans lines when you change or open files, or scans all files in your workspace.

<video src="https://github.com/returntocorp/semgrep-vscode/assets/626337/b08d17b6-3fb7-46fe-93ec-09f9257d58a3" controls="controls">
</video>

## Prerequisites

Semgrep VS Code extension communicates with Semgrep command-line interface (CLI) to run scans. Install Semgrep CLI before you can use the VS Code extension. To install Semgrep CLI:

```sh
# For macOS
$ brew install semgrep

# For Ubuntu/WSL/Linux/macOS
$ python3 -m pip install semgrep

# To try Semgrep without installation run via Docker
$ docker run --rm -v "${PWD}:/src" returntocorp/semgrep semgrep
```

## Quick start

1. Install Semgrep extension in Visual Studio Code. For more information, see [Install an extension](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-an-extension) in Visual Studio Code documentation.
1. Sing in: Press <kbd>Ctrl+⇧Shift+P</kbd> or <kbd>⌘Command+⇧Shift+P</kbd> (macOS) and sign in to Semgrep Cloud Platform by running the following command:
   ```
   Semgrep: Sign in
   ```
1. Test the extension by pressing <kbd>Ctrl+⇧Shift+P</kbd> or <kbd>⌘Command+⇧Shift+P</kbd> (macOS) and run the following command:
   ```
   Semgrep: Scan all files in workspace
   ```
1. Find vulnerability details information, hold the pointer over the code that has the yellow underline. You can also find details in the Problems tab by pressing <kbd>⇧Shift+Ctrl+M</kbd> or <kbd>⌘Command+⇧Shift+M</kbd> (macOS).
   <video src="https://github.com/returntocorp/semgrep-vscode/assets/626337/49033d56-f4f4-4b70-8318-1b0ea8e991b5" controls="controls">
   </video>

## Use full potential of Semgrep

Try Autofix.
   <video src="https://github.com/returntocorp/semgrep-vscode/assets/626337/3b6a730d-57e9-48a4-8065-9fa52388d77a" controls="controls">
   </video>

Add and update new rules to expand Semgrep extension capabilities.
   <video src="https://github.com/returntocorp/semgrep-vscode/assets/626337/fed6b6ec-e0b5-495b-a488-4f3c805dd58b
" controls="controls">
   </video>

4. Look for vulnerability details



5. Try Auto-fix
https://github.com/returntocorp/semgrep-vscode/blob/readme-changes/images/auto-fix-video.mp4

6. Add and update rules
You can fine tune and customize rules to scan against. To do that go to [Semgrep registry](https://semgrep.dev/r) (make sure you are logged in, if not login to the registry), then add a rule. You can manage rules via our Rule board. 
After customizing rules, you can update rules in VS code and run the scan again with new rules. 
<video src="https://github.com/returntocorp/semgrep-vscode/blob/readme-changes/images/updating-rules-video.mp4" controls="controls" style="max-width: 730px;">
</video>

You can fine-tune and customize rules to improve your scan results:
1. Go to [Semgrep Registry](https://semgrep.dev/explore). Ensure that you are signed in.
1. Explore the Semgrep Registry, select a rule, and then click **Add to Rule Board**.
1. Manage rules in the [Policies](https://semgrep.dev/orgs/-/board) page. 
1. Each time you change rule configuration press <kbd>Ctrl+⇧Shift+P</kbd> or <kbd>⌘Command+⇧Shift+P</kbd> (macOS) in VS Code, and then run `Semgrep: Update rules`.

### Language support

Semgrep supports 30+ languages.

| Category     | Languages |
| ------------ | --------- |
| GA           | C# · Go · Java · JavaScript · JSX · Kotlin · JSON · PHP · Python · Ruby · Scala · Terraform · TypeScript |
| Beta         | Rust |
| Experimental | Bash · C · C++ · Clojure · Dart · Dockerfile · Elixir · HTML · Julia · Jsonnet · Lisp · Lua · OCaml · R · Scheme · Solidity · Swift · YAML · XML · Generic (ERB, Jinja, etc.) |

## Configuring Semgrep extension scans

Configure Semgrep VS Code extension in the extension settings. To access the extension settings:

1. Go to **Extensions view** by pressing <kbd>⇧Shift+Ctrl+X</kbd> or <kbd>⇧Shift+⌘Command+X</kbd> (macOS) on your keyboard.
2. Select Semgrep extension.
3. Click the gear icon, and then select **Extension Settings**.

The most important configuration options are:

- **Semgrep › Metrics: Enabled**: Semgrep extension gathers metrics for Semgrep, Inc by default. See **[Semgrep Privacy Policy](https://semgrep.dev/docs/metrics/)** for details. To disable this option, clear the **Semgrep › Metrics: Enabled** checkbox.
- **Semgrep › Scan: Only Git Dirty**: On by default. Semgrep checks when you open a new file, scans, and then displays findings for lines changed since the last commit.
- **Semgrep › Scan: Configuration**: Specify rules or rulesets you want Semgrep to use to scan your code. Each item can be a YAML configuration file, a URL of a configuration file, or a directory of YAML files. Use "auto" to automatically obtain rules tailored to your project. Your project URL will be used to log in to the Semgrep Registry. See [Running rules](https://semgrep.dev/docs/running-rules/) in Semgrep documentation for more information. When you change the rule configuration, run `Semgrep: Update rules` command in Visual Studio Code Command Palette to update the rules configuration for your next scan.
- **Semgrep › Scan: Include** - List files and directories scanned by Semgrep. This option globally overrides the workspace setting. As a result, Semgrep scans all included paths.
- **Semgrep › Scan: Jobs** - Specify how many parallel jobs of Semgrep extension can run at the same time. The default number of parallel jobs is 1.

Advanced configuration options:

- **Semgrep › Scan: Timeout** - After the specified maximum time runs out Semgrep scan times out (stops). Numbers are indicated in seconds. The default value is 30.
- **Semgrep > Trace: Server** - This option is useful for debugging. The messages option displays communication of the Semgrep Visual Studio Code extension with the LSP server. The default option is verbose.

## Commands

Run Semgrep extension commands through the Visual Studio Code Command Palette. You can access the Command Palette by pressing <kbd>Ctrl+⇧Shift+P</kbd> or <kbd>⌘Command+⇧Shift+P</kbd> (macOS) on your keyboard. See [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) documentation. The following list includes all available Semgrep extension commands:

- `Semgrep: Sign in`: Sign in or log in to the Semgrep Cloud Platform (this command opens a new window in your browser). When you sign in, you can automatically scan with Semgrep [Pro rules](https://semgrep.dev/docs/semgrep-code/pro-rules/) and add additional rules to the [Rule board](https://semgrep.dev/orgs/-/board) in Semgrep Code. If you are logged in with the command-line interface using <code>semgrep&nbsp;login</code> you are already signed in with the Visual Studio Code Semgrep extension also. Alternatively, you can log in through your command-line interface bu running `semgrep login`.
- `Semgrep: Sign out`: Log out from Semgrep Cloud Platform. Alternatively, you can sign out through your command-line interface by running `semgrep logout`.
- `Semgrep: Scan changed files in a workspace`: Scan files that have been changed since the last commit in your current workspace.
- `Semgrep: Scan all files in a workspace`: Scan all files in the current workspace.
- `Semgrep: Update rules`: For logged-in users. If the rules in the [Rule board](https://semgrep.dev/orgs/-/board) or rules included through the **Semgrep › Scan: Configuration** configuration option have been changed, this command loads the new configuration of your rules for your next scan.
- `Semgrep: Search by pattern`: Search for patterns in code using Semgrep pattern syntax. For more information, see [Pattern syntax](https://semgrep.dev/docs/writing-rules/pattern-syntax/) documentation.

Tip: You can also click the Semgrep icon in the Visual Studio Code to quickly access all available commands.

## Features

### Scanning

Scan your code using Semgrep to get inline results and problem highlighting.

### Automatic Scanning

When you open a file, Semgrep scans it right away.

### Semgrep Code and Pro rules

Sign in to receive better results, new true positive findings and fewer false positives. When you sign in, you can get all the benefits of [Semgrep Code](https://semgrep.dev/products/semgrep-code/) and [Pro rules](https://semgrep.dev/docs/semgrep-code/pro-rules/).

### Autofix

With Semgrep autofix rules, you can instantly apply their fix in Visual Studio Code.

### Rule Quick Links

Want to go to the definition of a local or Semgrep Code rule? Hover over a match and click the link!

## Support

If you need our support, join the [Semgrep community Slack workspace](http://go.semgrep.dev/slack) and tell us about any problems you encountered.
