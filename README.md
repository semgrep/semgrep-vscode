# Semgrep Visual Studio Code extension

[Semgrep](https://semgrep.dev/) is a fast, static analysis tool for finding bugs, detecting vulnerabilities, and enforcing code standards powered by an open-source engine. Semgrep Visual Studio Code extension scans lines when you change or open files, or scans all files in your workspace.

## Supported languages

See the list of [languages supported by Semgrep OSS Engine](https://semgrep.dev/docs/supported-languages/#semgrep-oss-engine) in Semgrep documentation.

## Prerequisites

To use Semgrep Visual Studio Code extension, install either pip or Homebrew.

## Installing Semgrep extension

To successfully install and run the Semgrep Visual Studio Code (VS Code) extension:

1. Install Semgrep locally. See [Installing and running Semgrep locally](https://semgrep.dev/docs/getting-started/#installing-and-running-semgrep-locally) in Semgrep documentation. 
    
    Note: If you install Semgrep through Homebrew, make sure you added Homebrew to your PATH. See [My Mac .apps don’t find Homebrew utilities!](https://docs.brew.sh/FAQ#my-mac-apps-dont-find-homebrew-utilities) in Homebrew documentation.
    
2. Optional: Log in to Semgrep Cloud Platform by running the following command, and then follow the instructions in your command-line interface:

    ```bash
    semgrep login
    ```
    
    Note: Log in or sign in to improve the performance of Semgrep extension. After log in, you can automatically scan with Semgrep [Pro rules](https://semgrep.dev/docs/semgrep-code/pro-rules/) and add additional rules to the [Rule board](https://semgrep.dev/orgs/-/board) in Semgrep Code.
    
3. Install Semgrep extension in Visual Studio Code. For more information, see [Install an extension](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-an-extension) in Visual Studio Code documentation if necessary.
4. In Visual Studio Code, test the extension by hitting <kbd>Ctrl+⇧Shift+P</kbd> or <kbd>⌘+⇧Shift+P</kbd> (MacOS) and run the following command:
    
    ```
    Semgrep: Scan all files in workspace
    ```

Find results of your scans in Visual Studio Code Problems tab. To display the output, press <kbd>⇧Shift+Ctrl+M</kbd> or <kbd>⌘+⇧Shift+M</kbd> (MacOS).

## Configuring Semgrep extension scans

Configure Semgrep VS Code extension in extension settings. To access the extension settings:

1. Go to **Extensions view** by pressing <kbd>⇧Shift+Ctrl+X</kbd> or <kbd>⇧Shift+⌘+X</kbd> (MacOS) on your keyboard.
2. Select Semgrep extension.
3. Click the gear icon, and then select **Extension Settings**.

The most important configuration options are:

- **Semgrep › Metrics: Enabled**: Semgrep extension gathers metrics for Semgrep, Inc by default. See **[Semgrep Privacy Policy](https://semgrep.dev/docs/metrics/)** for details. To disable this option, clear the **Semgrep › Metrics: Enabled** checkbox.
- **Semgrep › Scan: Only Git Dirty**: On by default. Semgrep checks when you open a new file, scans, and then displays findings for lines changed since the last commit.
- **Semgrep › Scan: Configuration**: Specify rules or rulesets you want Semgrep to use to scan your code. Each item can be a YAML configuration file, a URL of a configuration file, or a directory of YAML files. Use "auto" to automatically obtain rules tailored to your project. Your project URL will be used to log in to the Semgrep Registry. See [Running rules](https://semgrep.dev/docs/running-rules/) in Semgrep documentation for more information.
- **Semgrep › Scan: Include** - List files and directories scanned by Semgrep. This option globally overrides the workspace setting. As a result, Semgrep scans all included paths.
- **Semgrep › Scan: Jobs** - Specify how many parallel jobs of Semgrep extension can run at the same time. The default number of parallel jobs is 1. 

Advanced configuration options: 

- **Semgrep › Scan: Timeout** - After the specified maximum time runs out Semgrep scan times out (stops). Numbers are indicated in seconds. The default value is 30.
- **Semgre > Trace: Server** - This option is useful for debugging. The messages option displays communication of the Semgrep Visual Studio Code extension with the LSP server. The default option is verbose.

## Commands

Run Semgrep extension commands through the Visual Studio Code Command Palette. You can access the Command Palette by pressing <kbd>Ctrl+⇧Shift+P</kbd> or <kbd>⌘+⇧Shift+P</kbd> (MacOS) on your keyboard. See [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) documentation. The following list includes all available Semgrep extension commands:

- `Semgrep: Sign in`: Sign in or log in to the Semgrep Cloud Platform (this command opens a new window in your browser). When you sign in, you can automatically scan with Semgrep [Pro rules](https://semgrep.dev/docs/semgrep-code/pro-rules/) and add additional rules to the [Rule board](https://semgrep.dev/orgs/-/board) in Semgrep Code. If you are logged in with the command-line interface using `semgrep login` you are already signed in with the Visual Studio Code Semgrep extension also.
- `Semgrep: Sign out`: Log out from Semgrep Cloud Platform.
- `Semgrep: Scan changed files in a workspace`: Scan files that have been changed since the last commit in your current workspace.
- `Semgrep: Scan all files in a workspace`: Scan all files in the current workspace.
- `Semgrep: Update rules`: For logged-in users. If the rules in the [Rule board](https://semgrep.dev/orgs/-/board) have been changed, this command loads the new configuration of your rules for your next scan.

Tip: You can also click the Semgrep icon in the Visual Studio Code to quickly access all available commands.

## Features

### Scanning

Scan your code using Semgrep and get inline results and problem highlighting!

### Automatic Scanning

Opened a file? Semgrep scans it right away!

### Semgrep App Rules

Obtain rules configured for your code [Semgrep Code](https://semgrep.dev/products/semgrep-code/)? Login to scan for them!

### Autofix

Have an autofix rule? Hit a button and fix it instantly in the Editor.

### Rule Quick Links

Want to go to the definition of a local or Semgrep Code rule? Hover over a match and click the link!

## Support

Please, if you need our support, join the [Semgrep community Slack workspace](https://r2c.dev/slack) and tell us about any problems you encountered.
