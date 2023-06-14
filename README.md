# Semgrep Visual Studio Code extension

[Semgrep](https://semgrep.dev/) is a fast, static analysis tool for finding bugs, detecting vulnerabilities, and enforcing code standards powered by an open-source engine. Semgrep Visual Studio Code extension scans lines when you change or open files, or scans all files in your workspace.

## Supported languages

See the list of [languages supported by Semgrep OSS Engine](https://semgrep.dev/docs/supported-languages/#semgrep-oss-engine) in Semgrep documentation.

## Prerequisites

Install Semgrep OSS Engine. See [Installing and running Semgrep locally](https://semgrep.dev/docs/getting-started/#installing-and-running-semgrep-locally) in Semgrep documentation. The minimal required version of Semgrep OSS Engine is 1.21.0.

## Installing the Semgrep extension

To successfully install and run the Semgrep Visual Studio Code (VS Code) extension:

1. Install the Semgrep extension in Visual Studio Code. For more information, see [Install an extension](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-an-extension) in Visual Studio Code documentation.
2. Optional: In Visual Studio Code, access the Command Palette by pressing <kbd>Ctrl+⇧Shift+P</kbd> or <kbd>⌘Command+⇧Shift+P</kbd> (macOS) and sign in to Semgrep Cloud Platform by running the following command:

   ```
   Semgrep: Sign in
   ```

   After you run the command, click **Open** to open a new tab in your browser, and then click **Activate**.

   Note: Sign in to improve the performance of Semgrep extension. After signing in, you can automatically scan with Semgrep [Pro rules](https://semgrep.dev/docs/semgrep-code/pro-rules/) and add additional rules from the [Rule board](https://semgrep.dev/orgs/-/board) in Semgrep Code.

3. In Visual Studio Code, test the extension by pressing <kbd>Ctrl+⇧Shift+P</kbd> or <kbd>⌘Command+⇧Shift+P</kbd> (macOS) and run the following command:

   ```
   Semgrep: Scan all files in workspace
   ```

Find results of your scans in Visual Studio Code Problems tab. To display the Problems tab, press <kbd>⇧Shift+Ctrl+M</kbd> or <kbd>⌘Command+⇧Shift+M</kbd> (macOS).

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
