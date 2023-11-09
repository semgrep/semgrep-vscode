import * as assert from "assert";
import { after } from "mocha";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../extension';

suite("Extension Test Suite", () => {
  after(() => {
    vscode.window.showInformationMessage("All tests done!");
  });

  test("Sample test", async () => {
    await vscode.workspace.openTextDocument({
      language: "python",
      content: "print('Hello, world!')",
    });
    await vscode.commands.executeCommand("semgrep.refreshRules");
  });
});
