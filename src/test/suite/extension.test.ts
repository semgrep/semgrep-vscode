import * as assert from "assert";
import * as path from "path";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { VSCODE_CONFIG_KEY } from "../../constants";

const testFolder = vscode.Uri.parse(`../../../../src/test/`);
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function openDocument(location: string): Promise<vscode.TextDocument> {
  const uri = vscode.Uri.file(path.join(__dirname + testFolder + location));
  const document = await vscode.workspace.openTextDocument(uri);
  return document;
}

function toRange(sLine: number, sChar: number, eLine: number, eChar: number) {
  const start = new vscode.Position(sLine, sChar);
  const end = new vscode.Position(eLine, eChar);
  return new vscode.Range(start, end);
}

async function testDiagnostics(
  docUri: vscode.Uri,
  expectedDiagnostics: vscode.Diagnostic[]
) {
  const actualDiagnostics = vscode.languages.getDiagnostics(docUri);

  assert.strictEqual(actualDiagnostics.length, expectedDiagnostics.length);

  expectedDiagnostics.forEach((expectedDiagnostic, i) => {
    const actualDiagnostic = actualDiagnostics[i];
    assert.strictEqual(actualDiagnostic.message, expectedDiagnostic.message);
    assert.deepStrictEqual(actualDiagnostic.range, expectedDiagnostic.range);
    assert.strictEqual(actualDiagnostic.severity, expectedDiagnostic.severity);
  });
}
suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");
  // Don't test CI until we explicitly want to
  vscode.workspace
    .getConfiguration(VSCODE_CONFIG_KEY)
    .update("lsp.ciEnabled", false, vscode.ConfigurationTarget.Global);
  test("Should start extension @semgrep", async () => {
    const started = vscode.extensions.getExtension("Semgrep.semgrep");
    await started?.activate();
    assert.notStrictEqual(started, undefined);
    assert.strictEqual(started?.isActive, true);
    assert.notStrictEqual(started.exports, null);
  });
  test("LSP Scan File Diagnostics", async () => {
    const config = openDocument("rules/eqeq-python.yaml");

    await vscode.workspace
      .getConfiguration(VSCODE_CONFIG_KEY)
      .update(
        "scan.configuration",
        [(await config).uri.fsPath],
        vscode.ConfigurationTarget.Global
      );
    const doc = await openDocument("targets/eqeq.py");
    await vscode.commands.executeCommand("semgrep.scan", doc.uri);
    await sleep(1000);
    await testDiagnostics(doc.uri, [
      {
        message:
          "useless comparison operation `a == a` or `a != a`; possible bug?\n",
        range: toRange(1, 4, 1, 10),
        severity: vscode.DiagnosticSeverity.Error,
        source: "",
      },
      {
        message:
          "useless comparison operation `a == a` or `a != a`; possible bug?\n",
        range: toRange(2, 4, 2, 10),
        severity: vscode.DiagnosticSeverity.Error,
        source: "",
      },
      {
        message:
          "useless comparison operation `a == a` or `a != a`; possible bug?\n",
        range: toRange(4, 4, 4, 10),
        severity: vscode.DiagnosticSeverity.Error,
        source: "",
      },
      {
        message:
          "useless comparison operation `y == y` or `y != y`; possible bug?\n",
        range: toRange(8, 4, 8, 10),
        severity: vscode.DiagnosticSeverity.Error,
        source: "",
      },
    ]);
  });
});
