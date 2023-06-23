# Change Log

All notable changes to the "semgrep-vscode" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
  [Semgrep 0.20.0](https://github.com/returntocorp/semgrep/releases/tag/v0.20.0) had just been released
  with support for JSX tag metavariables.

## 0.1.1 - 2020-08-11

### Changes

- Stop requiring the latest version of VS Code.
  Support is now for 1.31.0 and above.

## 0.1.0 - 2020-08-10

Initial release
