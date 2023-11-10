import * as assert from "assert";
import { after } from "mocha";
import * as path from "path";
const testFolderLocation = "/../../../../src/test/fixtures/";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
suite("Extension Test Suite", () => {
  after(() => {
    vscode.window.showInformationMessage("All tests done!");
  });

  test("Sample test", async () => {
    const testPy = vscode.Uri.file(
      path.join(__dirname + testFolderLocation + "test.py")
    );

    await vscode.workspace.openTextDocument(testPy);
    const semgrep = vscode.extensions.getExtension("Semgrep.semgrep");

    assert.notStrictEqual(semgrep, undefined);
    const promise = new Promise((r, e) => {
      return;
    });
    await promise;
    const result = await vscode.commands.executeCommand(
      "semgrep.scanWorkspace"
    );
    assert.strictEqual(result, "Refreshed rules");
  }).timeout(100000);
});
