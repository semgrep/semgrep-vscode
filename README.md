# Semgrep Visual Studio Code extension

[Semgrep](https://semgrep.dev/) is a fast, open-source, static analysis engine for finding bugs, detecting vulnerabilities in third-party dependencies, and enforcing code standards. Semgrep analyzes code locally on your computer or in your build environment: code is never uploaded.

Note: Semgrep VS Code plugin talks to Semgrep CLI to run scans, update rules and so on. So you need to install Semgrep CLI before you can use the VS Code plugin.

<video src="https://github.com/returntocorp/semgrep-vscode/blob/readme-changes/images/main-vs-code-video.mp4" controls="controls" style="max-width: 730px;">
</video>

## Quick start
0. Install this Semgrep VS Code plugin

1. Install Semgrep CLI

```
# For macOS
$ brew install semgrep

# For Ubuntu/WSL/Linux/macOS
$ python3 -m pip install semgrep

# To try Semgrep without installation run via Docker
$ docker run --rm -v "${PWD}:/src" returntocorp/semgrep semgrep
```

2. Sign into the CLI

```
$ semgrep login
```
You can also sign up through VS Code: <kbd>Ctrl+⇧Shift+P</kbd> (windows) or <kbd>⌘Command+⇧Shift+P</kbd> (macOS)  > 
Semgrep: Sign in".

3. <kbd>Ctrl+⇧Shift+P</kbd> or <kbd>⌘Command+⇧Shift+P</kbd> (macOS) > `Semgrep: Scan all files in workspace`



4. Look for vulnerability details

https://github.com/returntocorp/semgrep-vscode/blob/readme-changes/images/seeing-vuln-details.mp4

5. Try Auto-fix
https://github.com/returntocorp/semgrep-vscode/blob/readme-changes/images/auto-fix-video.mp4

6. Add and update rules
You can fine tune and customize rules to scan against. To do that go to [Semgrep registry](https://semgrep.dev/r) (make sure you are logged in, if not login to the registry), then add a rule. You can manage rules via our Rule board. 
After customizing rules, you can update rules in VS code and run the scan again with new rules. 
<video src="https://github.com/returntocorp/semgrep-vscode/blob/readme-changes/images/updating-rules-video.mp4" controls="controls" style="max-width: 730px;">
</video>

### Language support

Semgrep supports 30+ languages.

| Category     | Languages                                                                                                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GA           | C# · Go · Java · JavaScript · JSX · Kotlin · JSON · PHP · Python · Ruby · Scala · Terraform · TypeScript · TSX                                                                         |
| Beta         | Rust                                                                                                                                                                 |
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
