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

Find results of your scans in Visual Studio Code output. To display the output, press <kbd>⇧Shift+Ctrl+U</kbd> or <kbd>⌘+⇧Shift+U</kbd> (MacOS).

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

- **Semgrep › Scan: Timeout** - After the specified maximum time runs out Semgrep scan times out (stops) in seconds. The default value is 30.
- **Semgre > Trace: Server** - This option is useful for debugging. The messages option displays communication of the Semgrep Visual Studio Code extension with the LSP server. The default option is verbose.

## Commands

Run Semgrep extension commands through the Visual Studio Code Command Palette. You can access the Command Palette by pressing <kbd>Ctrl+⇧Shift+P</kbd> or <kbd>⌘+⇧Shift+P</kbd> (MacOS) on your keyboard. See [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) documentation. The following list includes all available Semgrep extension commands:

- `Semgrep: Sign in`: Sign in or log in to the Semgrep Cloud Platform (this command opens a new window in your browser). When you sign in, you can automatically scan with Semgrep [Pro rules](https://semgrep.dev/docs/semgrep-code/pro-rules/) and add additional rules to the [Rule board](https://semgrep.dev/orgs/-/board) in Semgrep Code. If you are logged in in the command-line interface using `semgrep login` you are already signed in with the Visual Studio Code Semgrep extension also.
- `Semgrep: Sign out`: Log out from Semgrep Cloud Platform.
- `Semgrep: Scan changed files in a workspace`: Scan files that have been changed since the last commit in your current workspace.
- `Semgrep: Scan all files in a workspace`: Scan all files in the current workspace.
- `Semgrep: Update rues`: For logged-in users. If the rules in the [Rule board](https://semgrep.dev/orgs/-/board) have been changed, this command loads the new configuration of your rules for your next scan.

## Features

### Scanning

Scan your code using Semgrep and get inline results and problem highlighting! Nifty!

### Automatic Config Detection

This extension will detect any `semgrep.yaml` files in an open workspace and scan automatically

### Hot Reloading

Made an edit to your Semgrep configuration file? Semgrep will automatically rescan your workspace for you!

### Automatic Scanning

Opened a file? Semgrep will scan it right away!

### Semgrep App Rules

Have rules configured for your code on [the Semgrep App](https://semgrep.dev/products/semgrep-app)? Login to scan for them!

### Metavariable Labelling

Want to understand why a rule has matched? Now there are handy labels of what each metavariable is!

### Autofix

Have an autofix rule? Hit a button and fix it instantly in the editor.

### Rule Quick Links

Want to go to the definition of a local or app rule? Hover over a match and click the link!

## Configuration

You can set the following options by going to Preferences > Settings:
**_Properties_**

- <b id="#/properties/semgrep.path">semgrep.path</b>
  - Type: `string`
  - <i id="/properties/semgrep.path">path: #/properties/semgrep.path</i>
  - Default: _"semgrep"_
- <b id="#/properties/semgrep.logging">semgrep.logging</b>
  - _Enable logging for the extension and the LSP server._
  - Type: `boolean`
  - <i id="/properties/semgrep.logging">path: #/properties/semgrep.logging</i>
  - Default: _false_
- <b id="#/properties/semgrep.scan.configuration">semgrep.scan.configuration</b>
  - _Specify rules or rulesets you want Semgrep to use to scan your code. Each item can be a YAML configuration file, URL of a configuration file, or directory of YAML files. Use "auto" to automatically obtain rules tailored for your project. Your project URL will be used to log in to the Semgrep Registry._
  - Type: `array`
  - <i id="/properties/semgrep.scan.configuration">path: #/properties/semgrep.scan.configuration</i>
  - Default: ``
    - **_Items_**
    - Type: `string`
    - <i id="/properties/semgrep.scan.configuration/items">path: #/properties/semgrep.scan.configuration/items</i>
- <b id="#/properties/semgrep.scan.exclude">semgrep.scan.exclude</b>
  - _List of files or directories to exclude._
  - Type: `array`
  - <i id="/properties/semgrep.scan.exclude">path: #/properties/semgrep.scan.exclude</i>
  - Default: ``
    - **_Items_**
    - Type: `string`
    - <i id="/properties/semgrep.scan.exclude/items">path: #/properties/semgrep.scan.exclude/items</i>
- <b id="#/properties/semgrep.scan.include">semgrep.scan.include</b>
  - _List of files or directories to include._
  - Type: `array`
  - <i id="/properties/semgrep.scan.include">path: #/properties/semgrep.scan.include</i>
  - Default: ``
    - **_Items_**
    - Type: `string`
    - <i id="/properties/semgrep.scan.include/items">path: #/properties/semgrep.scan.include/items</i>
- <b id="#/properties/semgrep.scan.jobs">semgrep.scan.jobs</b>
  - _Number of parallel jobs to run._
  - Type: `integer`
  - <i id="/properties/semgrep.scan.jobs">path: #/properties/semgrep.scan.jobs</i>
  - Default: `1`
- <b id="#/properties/semgrep.scan.disableNoSem">semgrep.scan.disableNoSem</b>
  - _Disable no-semgrep comments._
  - Type: `boolean`
  - <i id="/properties/semgrep.scan.disableNoSem">path: #/properties/semgrep.scan.disableNoSem</i>
  - Default: _false_
- <b id="#/properties/semgrep.scan.baselineCommit">semgrep.scan.baselineCommit</b>
  - _Baseline commit to scan from_
  - Type: `string`
  - <i id="/properties/semgrep.scan.baselineCommit">path: #/properties/semgrep.scan.baselineCommit</i>
- <b id="#/properties/semgrep.scan.severity">semgrep.scan.severity</b>
  - _Severity of rules to scan for._
  - Type: `array`
  - <i id="/properties/semgrep.scan.severity">path: #/properties/semgrep.scan.severity</i>
  - Default: `INFO,WARNING,ERROR`
    - **_Items_**
    - Type: `string`
    - <i id="/properties/semgrep.scan.severity/items">path: #/properties/semgrep.scan.severity/items</i>
    - The value is restricted to the following:
      1. _"INFO"_
      2. _"WARNING"_
      3. _"ERROR"_
- <b id="#/properties/semgrep.scan.maxMemory">semgrep.scan.maxMemory</b>
  - _Maximum memory to use in megabytes._
  - Type: `integer`
  - <i id="/properties/semgrep.scan.maxMemory">path: #/properties/semgrep.scan.maxMemory</i>
  - Default: `0`
- <b id="#/properties/semgrep.scan.maxTargetBytes">semgrep.scan.maxTargetBytes</b>
  - _Maximum size of target in bytes to scan._
  - Type: `integer`
  - <i id="/properties/semgrep.scan.maxTargetBytes">path: #/properties/semgrep.scan.maxTargetBytes</i>
  - Default: `0`
- <b id="#/properties/semgrep.scan.timeoutThreshold">semgrep.scan.timeoutThreshold</b>
  - _Maximum time to scan in seconds._
  - Type: `integer`
  - <i id="/properties/semgrep.scan.timeoutThreshold">path: #/properties/semgrep.scan.timeoutThreshold</i>
  - Default: `0`
- <b id="#/properties/semgrep.scan.useGitIgnore">semgrep.scan.useGitIgnore</b>
  - _Skip files ignored by git_
  - Type: `boolean`
  - <i id="/properties/semgrep.scan.useGitIgnore">path: #/properties/semgrep.scan.useGitIgnore</i>
  - Default: _true_
- <b id="#/properties/semgrep.lsp.watchOpenFiles">semgrep.lsp.watchOpenFiles</b>
  - _Scan all opened files automatically on open and save._
  - Type: `boolean`
  - <i id="/properties/semgrep.lsp.watchOpenFiles">path: #/properties/semgrep.lsp.watchOpenFiles</i>
  - Default: _true_
- <b id="#/properties/semgrep.lsp.watchWorkspace">semgrep.lsp.watchWorkspace</b>
  - _Scan all workspace folders automatically on open and when folders are added or removed._
  - Type: `boolean`
  - <i id="/properties/semgrep.lsp.watchWorkspace">path: #/properties/semgrep.lsp.watchWorkspace</i>
  - Default: _true_
- <b id="#/properties/semgrep.lsp.watchConfigs">semgrep.lsp.watchConfigs</b>
  - _Watch all semgrep config files for changes and rescan when they are saved._
  - Type: `boolean`
  - <i id="/properties/semgrep.lsp.watchConfigs">path: #/properties/semgrep.lsp.watchConfigs</i>
  - Default: _true_
- <b id="#/properties/semgrep.lsp.autodetectConfigs">semgrep.lsp.autodetectConfigs</b>
  - _Automatically detect configuration files in workspace folders according to the glob pattern \*\*/{semgrep,.semgrep}.{yml,yaml}_
  - Type: `boolean`
  - <i id="/properties/semgrep.lsp.autodetectConfigs">path: #/properties/semgrep.lsp.autodetectConfigs</i>
  - Default: _true_
- <b id="#/properties/semgrep.lsp.ciEnabled">semgrep.lsp.ciEnabled</b>
  - _When logged in, the LSP will runs rules configured on Semgrep App_
  - Type: `boolean`
  - <i id="/properties/semgrep.lsp.ciEnabled">path: #/properties/semgrep.lsp.ciEnabled</i>
  - Default: _true_
- <b id="#/properties/semgrep.metrics">semgrep.metrics</b>
  - _Enable or disable metrics collection. Auto will only report metrics when rules are pulled from the registry_
  - Type: `string`
  - <i id="/properties/semgrep.metrics">path: #/properties/semgrep.metrics</i>
  - Default: _"on"_

## Support

Please join the [Semgrep community Slack workspace](https://r2c.dev/slack)
for support if you run into problems.
