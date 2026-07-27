import assert from "node:assert";
import * as vscode from "vscode";

import { codeToString, groupByFile } from "../../views/findings";

// Pure logic tests for the Findings view grouping. These construct fake
// diagnostics and exercise groupByFile/codeToString directly — no language
// server, no scan, no VS Code UI — so they are fast and deterministic. They run
// in the existing integration host only because `vscode` types resolve there.
//
// The fake diagnostics below mirror the real diagnostic contract documented in
// src/test/fixtures/hermetic/README.md (source "Semgrep", rule id in `code`
// possibly config-prefixed, 0-based line ranges) — that file also carries the
// deterministic fixtures used for manual F5 verification of the view.
suite("Findings view — grouping logic", () => {
  const uri = (p: string) => vscode.Uri.file(p);
  const diag = (
    line: number,
    opts: {
      source?: string;
      code?: vscode.Diagnostic["code"];
      message?: string;
    } = {},
  ): vscode.Diagnostic => {
    const d = new vscode.Diagnostic(
      new vscode.Range(line, 0, line, 1),
      opts.message ?? `finding at ${line}`,
      vscode.DiagnosticSeverity.Warning,
    );
    d.source = opts.source ?? "Semgrep";
    if (opts.code !== undefined) d.code = opts.code;
    return d;
  };

  test("keeps only Semgrep-sourced diagnostics", () => {
    const grouped = groupByFile([
      [uri("/a.py"), [diag(1), diag(2, { source: "eslint" })]],
    ]);
    assert.strictEqual(grouped.length, 1);
    assert.strictEqual(grouped[0].findings.length, 1);
  });

  test("drops files with no Semgrep findings", () => {
    const grouped = groupByFile([
      [uri("/a.py"), [diag(1, { source: "eslint" })]],
      [uri("/b.py"), [diag(1)]],
    ]);
    assert.deepStrictEqual(
      grouped.map((g) => g.uri.fsPath),
      ["/b.py"],
    );
  });

  test("sorts files by path and findings by line", () => {
    const grouped = groupByFile([
      [uri("/z.py"), [diag(9), diag(2)]],
      [uri("/a.py"), [diag(5)]],
    ]);
    assert.deepStrictEqual(
      grouped.map((g) => g.uri.fsPath),
      ["/a.py", "/z.py"],
    );
    assert.deepStrictEqual(
      grouped[1].findings.map((d) => d.range.start.line),
      [2, 9],
    );
  });

  test("codeToString handles string, number, and {value} codes", () => {
    assert.strictEqual(codeToString("rules.foo"), "rules.foo");
    assert.strictEqual(codeToString(42), "42");
    assert.strictEqual(
      codeToString({ value: "a.b.c", target: vscode.Uri.parse("https://x") }),
      "a.b.c",
    );
    assert.strictEqual(codeToString(undefined), "");
  });
});
