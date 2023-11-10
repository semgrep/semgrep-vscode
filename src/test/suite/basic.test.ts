import * as assert from "assert";
import * as cp from "child_process";
import { after } from "mocha";
import * as path from "path";
const testFolderLocation = "/../../../../src/test/fixtures/";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as semgrep from "../../extension";
suite("Extension Test Suite", () => {
  after(() => {
    vscode.window.showInformationMessage("All tests done!");
  });

  test("Sample test", async () => {
    const testPy = vscode.Uri.file(
      path.join(__dirname + testFolderLocation + "test.py")
    );

    const doc = await vscode.workspace.openTextDocument(testPy);
    const editor = await vscode.window.showTextDocument(doc);
    const extensions = vscode.extensions.all.map((e) => e.id).join("\n");
    await editor.insertSnippet(new vscode.SnippetString(extensions));
    const semgrep = vscode.extensions.getExtension("Semgrep.semgrep");

    assert.notStrictEqual(semgrep, undefined);
    assert.strictEqual(semgrep?.isActive, false, "Extension is already active");
    await semgrep.activate();
    const result = await vscode.commands.executeCommand("semgrep.refreshRules");
    assert.strictEqual(result, "Refreshed rules");
  }).timeout(10000);
});
