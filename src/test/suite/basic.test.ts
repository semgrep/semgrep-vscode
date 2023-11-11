import * as assert from "assert";
import { after } from "mocha";
import * as path from "path";
import * as vscode from "vscode";
import * as cp from "child_process";
import {
  LanguageClient,
  ProtocolNotificationType,
  ProtocolRequestType,
  PublishDiagnosticsNotification,
  PublishDiagnosticsParams,
} from "vscode-languageclient/node";

const testFolderLocation = path.join(__dirname, "/../fixtures/");
function clientNotification(
  client: LanguageClient,
  type: ProtocolNotificationType<any, any>
) {
  return new Promise((resolve) => {
    client.onNotification(type, (params) => {
      resolve(params);
    });
  });
}

function clientRequest(
  client: LanguageClient,
  type: ProtocolRequestType<any, any, any, any, any>
) {
  return new Promise((resolve) => {
    client.onRequest(type, (params) => {
      resolve(params);
    });
  });
}
clientRequest;

function getClient() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const extension = vscode.extensions.getExtension("Semgrep.semgrep")!;
  return extension.exports;
}

suite("Extension Features", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  after(() => {
    vscode.window.showInformationMessage("All tests done!");
  });
  test("Basic Diagnostic Test", async () => {
    const testPy = vscode.Uri.file(path.join(testFolderLocation + "test.py"));
    const doc = await vscode.workspace.openTextDocument(testPy);
    const editor = await vscode.window.showTextDocument(doc);
    await editor.edit((editBuilder) => {
      editBuilder.insert(new vscode.Position(1, 0), "hashes.SHA1()");
    });
    const client = getClient();
    const params: PublishDiagnosticsParams = (await clientNotification(
      client,
      PublishDiagnosticsNotification.type
    )) as PublishDiagnosticsParams;
    assert.strictEqual(params.diagnostics.length, 1);
  });
});
