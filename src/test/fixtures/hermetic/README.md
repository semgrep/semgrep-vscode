# Hermetic findings fixtures

Small, deterministic fixtures for exercising the Semgrep language server with
**local rules** (no network, no `--config=auto`, no login). Intended as the
basis for future tests of the findings view (see the "Dedicated Findings panel"
plan).

- `ws/` — a tiny fixture workspace (`login.py`, `config.py`).
- `rules/rules.yaml` — local rules that fire at known lines/severities.

Verified with the CLI as an oracle:

```
semgrep --config rules/rules.yaml --json ws
```

produces exactly three findings:

| file        | rule                        | line (1-based) | severity |
| ----------- | --------------------------- | -------------- | -------- |
| `login.py`  | `tainted-sql-string`        | 7              | ERROR    |
| `config.py` | `hardcoded-aws-key`         | 2              | WARNING  |
| `config.py` | `placeholder-password-note` | 3              | INFO     |

> `config.py` contains an AWS **documentation example** key
> (`AKIAIOSFODNN7EXAMPLE`) — not a real credential.

## Diagnostic contract (what a findings view can rely on)

Established by driving `semgrep lsp` directly and observing
`textDocument/publishDiagnostics`. Each diagnostic contains **only**:

```
code, message, range, severity, source(, codeDescription)
```

Notable facts for anyone building on the diagnostics:

- **`source` is `"Semgrep"`** — a stable filter key.
- **`code` is the rule id, prefixed by the config source.** File-loaded rules
  are namespaced by the rules-file stem (e.g. `rules.tainted-sql-string`), and
  an absolute config path namespaces by the whole path. A short label must
  strip that prefix. Registry/policy rules use the full dotted id.
- **`range.start.line` is 0-based** (LSP), i.e. one less than the editor line.
- **Severity is Error/Warning/Info only (LSP 1/2/3).** There is **no** 4th
  ("Critical") level, and **no `data` payload / product field** — verified on
  both the OSS engine and the bundled Pro engine while logged in to a
  deployment. So a Snyk-style 4-level severity or per-product (Code / Supply
  Chain / Secrets) grouping is **not derivable from the LSP diagnostic today**
  and would require a language-server change to expose that metadata.

## Notes for testing against the LS

- The LS only scans **untracked/changed** files. A committed-clean or non-git
  workspace yields zero diagnostics; the heavy suite handles this via
  `git rm --cached`.
- The LS publishes diagnostics on `textDocument/didOpen`; opening the fixture
  documents is the reliable trigger.
- An ambient `SEMGREP_APP_TOKEN` (e.g. exported from a shell profile) logs the
  LS in and makes it run **deployment-policy** rules instead of these local
  ones — anything hermetic must run logged out.
