# semgrep-vscode

A Visual Studio Code extension for [Semgrep](https://github.com/returntocorp/semgrep).

- See Semgrep scan results inline each time you save a file
- Choose which Semgrep rules you run by setting semgrep.rules in Visual Studio Code

## Prerequisites

Either pip or homebrew must be installed in order to use this extension.

If you choose to install via brew during setup, you need to take [one extra step](https://docs.brew.sh/FAQ#my-mac-apps-dont-find-homebrew-utilities) to let Visual Studio Code find where brew installed semgrep

For other installation instructions, see the [Semgrep README](https://github.com/returntocorp/semgrep#installation).

## Features

### Scanning

Scan your code using Semgrep and get inline results and problem highlighting! Nifty!

### Automatic Config Detection

This extension will detect any `semgrep.yaml` files in an open workspace and scan automatically

### Hot Reloading

Made an edit to your Semgrep configuration file? Semgrep will automatically rescan your workspace for you!

### Automatic Scanning

Opened a file? Semgrep will scan it right away!

### Semgrep Cloud Platform Rules

Have rules configured for your code on [Semgrep Cloud Platform](https://semgrep.dev/products/cloud-platform)? Sign in to use them!

### Metavariable Labelling

Want to understand why a rule has matched? Now there are handy labels of what each metavariable is!

### Autofix

Have an autofix rule? Hit a button and fix it instantly in the editor.

### Rule Quick Links

Want to go to the definition of a local or app rule? Hover over a match and click the link!

## Commands

All commands can be run through the VSCode command palette

### `Semgrep: Sign in`

Sign in to Semgrep Cloud Platform (this will open a new window in your browser) to enable scanning with rules from the App.

### `Semgrep: Scan`

Scan currently focused file according to configured rules.

### `Semgrep: Scan Workspace`

Scan all files in the currently open workspace.

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
  - _Each item can be a YAML configuration file, directory of YAML files ending in .yml | .yaml, URL of a configuration file, or Semgrep registry entry name. Use "auto" to automatically obtain rules tailored to this project; your project URL will be used to log in to the Semgrep registry._
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
