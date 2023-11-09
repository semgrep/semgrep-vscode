import * as assert from "assert";
import * as cp from "child_process";
import { after } from "mocha";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  after(() => {
    vscode.window.showInformationMessage("All tests done!");
  });

  test("Sample test", async () => {
    const semgrep = vscode.extensions.getExtension("Semgrep.semgrep");
    assert.notStrictEqual(semgrep, undefined);
    assert.strictEqual(semgrep?.isActive, false, "Extension is already active");
    await semgrep.activate();
    cp.exec("semgrep --version", (err, stdout, stderr) => {
      assert.strictEqual(err, null);
      assert.strictEqual(stderr, "");
      assert.strictEqual(stdout, "0.0.0\n");
    });
    const result = await vscode.commands.executeCommand("semgrep.refreshRules");
    assert.strictEqual(result, "Refreshed rules");
  });
});
