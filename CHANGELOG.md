# Change Log

All notable changes to the "semgrep-vscode" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- New sidebar section with support information (email and slack contact; documentation)

### Changed

## v1.9.0 - 2024-08-28

### Added

- Semgrep binaries are now included in the extension, so Semgrep does not need to be installed to use the extension

### Changed

- Updated README
- Semgrep JS version bumped

## v1.8.2 - 2024-06-17

### Added

### Changed

- Updated README
- Extension will now log to a temporary file, and will properly handle LS telemetry events

## v1.8.1 - 2024-06-06

### Added

### Changed

- Extension no longer errors out if a log can't be written

## v1.8.0 - 2024-06-05

### Added

- If telemetry is enabled, the extension will now send crash reports of the Semgrep process, along with errors in the extension

### Changed

- The extension now pings semgrep.dev to check the latest CLI version

## v1.7.1 - 2024-05-03

### Added

- Bumped LSP.js to 1.71.0

### Changed

## v1.7.0 - 2024-04-24

### Added

- Reworked the Semgrep Search UI to be more modern, performant, and expressive!
  Features include:
  - ability to specify multiple patterns to match / not match
  - file-path includes/excluding
  - semantic autofix (individual and mass)
  - match previews
  - language-specific and language-agnostic search
  - streaming search

### Changed

- Scan workspace commands will now toggle "Only Git Dirty" before scanning

## v1.6.3 - 2024-02-02

### Added

### Changed

- Updated README
- Bumped LSP.js version

## v1.6.2 - 2024-01-05

### Added

### Changed

- Fixed LSP.js versioning

## v1.6.1 - 2024-01-05

### Added

- Heap size setting for LSP.js

### Changed

## v1.6.0 - 2023-12-19

### Added

- Added LSP.js support, so Semgrep VSCode supports Windows without WSL

### Changed

## v1.5.0 - 2023-07-27

### Added

- Added `Semgrep: Restart Language Server` command, to restart language server
- Users can now enable AST Hover, which allows showing AST nodes when hovering parts of code

### Changed

- Diagnostic information should now be properly rendered in markdown
- Semgrep Language Server will now respect environment variables
- Fixed some typos and stuff

## v1.4.1 - 2023-06-23

### Added

- Added extension walkthrough

### Changed

- Updated README

## v1.4.0 - 2023-06-21

### Added

- Users will now be prompted to scan full workspace on new installs

### Changed

- Extension is now bundled through esbuild

## 1.3.0 - 2023-06-1

### Added

- Users can now search by Semgrep patterns

## 1.2.0 - 2023-05-28

### Changed

- Language Server rewritten in OCaml, deprecating some previous settings and commands
- Changelog past this point is for the previous beta version, much of which has changed

## 0.3.1 - 2021-08-11

### Changed

- Updated Semgrep logo

## 0.3.0 - 2021-08-06

### Added

- You can now set multiple config values separated by commas. Thank you Ryan Scott Brown!

## 0.2.1 - 2021-03-25

### Changes

- Clarified installation instructions
- Removed unimplemented autofix command from command palette

## 0.2.0 - 2020-10-18

### Changes

- Enable scanning on TypeScript React (.tsx), TypeScript (.ts), and PHP files by default.

## 0.1.2 - 2020-08-19

### Changes

- Enable scanning on JavaScript React (.jsx) files by default.
  [Semgrep 0.20.0](https://github.com/semgrep/semgrep/releases/tag/v0.20.0) had just been released
  with support for JSX tag metavariables.

## 0.1.1 - 2020-08-11

### Changes

- Stop requiring the latest version of VS Code.
  Support is now for 1.31.0 and above.

## 0.1.0 - 2020-08-10

Initial release
