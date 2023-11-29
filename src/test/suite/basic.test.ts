import * as assert from "assert";
import * as vscode from "vscode";
import * as cp from "child_process";
import {
  LanguageClient,
  ProgressType,
  ProtocolNotificationType,
  ProtocolRequestType,
  PublishDiagnosticsNotification,
  PublishDiagnosticsParams,
  WorkDoneProgressBegin,
  WorkDoneProgressCreateParams,
  WorkDoneProgressCreateRequest,
  WorkDoneProgressEnd,
  WorkDoneProgressReport,
} from "vscode-languageclient/node";
import { ProgressToken } from "vscode-jsonrpc";

const SCAN_TIMEOUT = 10000;
const SKIPPED_FILES = [
  // This file causes a stack overflow in the language server :/
  "l5000.java",
  // and so does this one
  "three.js",
];
function clientNotification(
  client: LanguageClient,
  type: ProtocolNotificationType<any, any>,
  checkParams: (params: any) => boolean = () => true
) {
  return new Promise((resolve) => {
    client.onNotification(type, (params) => {
      if (checkParams(params)) {
        resolve(params);
      }
    });
  });
}
function clientProgress(
  client: LanguageClient,
  type: ProgressType<
    WorkDoneProgressBegin | WorkDoneProgressEnd | WorkDoneProgressReport
  >,
  token: ProgressToken,
  checkParams: (params: any) => boolean = () => true
) {
  return new Promise((resolve) => {
    client.onProgress(type, token, (params) => {
      if (checkParams(params)) {
        resolve(params);
      }
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

function makeFileUntracked(cwd: string, path: string) {
  cp.execSync(`git -C ${cwd} rm --cached --ignore-unmatch ${path}`);
}

async function getClient() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const extension = vscode.extensions.getExtension("Semgrep.semgrep")!;
  if (!extension.isActive) {
    await extension.activate();
  }
  // set semgrep path to development
  /*
  vscode.workspace
    .getConfiguration("semgrep")
    .update(
      "path",
      "<path-to-semgrep>/semgrep",
      vscode.ConfigurationTarget.Global
    );
  // set verbose trace
  vscode.workspace
    .getConfiguration("semgrep")
    .update("trace.server", "verbose", vscode.ConfigurationTarget.Global);
    */
  return extension.exports;
}

suite("Extension Features", function () {
  let client: LanguageClient;
  const workfolders = vscode.workspace.workspaceFolders;
  this.timeout(100000);
  if (!workfolders) {
    assert.fail("No workspace folders");
  }
  assert.strictEqual(workfolders.length, 1, "Workspace folder exists");
  const workfolderPath = workfolders[0].uri.fsPath;
  console.log(`Running semgrep CLI in ${workfolderPath}`);
  // get semgrep results to compare against
  const semgrepResults = JSON.parse(
    cp
      .execSync(`semgrep --json --config=auto `, {
        // needed as some repos have large outputs
        maxBuffer: 1024 * 1024 * 100,
        cwd: workfolderPath,
      })
      .toString()
  );
  const resultsHashMap: Map<string, any> = new Map();
  // group by file
  semgrepResults.results.forEach((result: any) => {
    const previousResult = resultsHashMap.get(result.path);
    resultsHashMap.set(
      result.path,
      previousResult ? previousResult.concat(result) : [result]
    );
  });

  suiteSetup(async () => {
    const filesToUnstage = semgrepResults.results
      .map((result: any) => result.path)
      .join(" ");
    // unstage files so the extension picks them up
    makeFileUntracked(workfolderPath, filesToUnstage);
    client = await getClient();
    const progressBeginParams: WorkDoneProgressCreateParams =
      (await clientRequest(
        client,
        WorkDoneProgressCreateRequest.type
      )) as WorkDoneProgressCreateParams;
    const token = progressBeginParams.token;
    const rulesRefreshFinished = clientProgress(
      client,
      new ProgressType(),
      token,
      (
        params:
          | WorkDoneProgressBegin
          | WorkDoneProgressEnd
          | WorkDoneProgressReport
      ) => params.kind === "end"
    );
    // wait for rules refresh to finish before running tests
    await rulesRefreshFinished;
  });
  resultsHashMap.forEach((result, path) => {
    for (const skippedFile of SKIPPED_FILES) {
      if (path.includes(skippedFile)) {
        console.log(`Skipping ${skippedFile} test`);
        return;
      }
    }
    const uri = vscode.Uri.file(`${workfolderPath}/${path}`);
    let doc: vscode.TextDocument;
    // Test that extension picks up the same diagnostics as semgrep CLI
    test(`Basic diagnostics test (${path})`, async () => {
      const diagnosticsPromise = clientNotification(
        client,
        PublishDiagnosticsNotification.type,
        (params: PublishDiagnosticsParams) => params.uri === uri.toString()
      );
      doc = await vscode.workspace.openTextDocument(uri);
      const diagnostics =
        (await diagnosticsPromise) as PublishDiagnosticsParams;
      assert.strictEqual(
        diagnostics.diagnostics.length,
        result.length,
        "No diagnostics on open"
      );
    }).timeout(SCAN_TIMEOUT);
    // Test that we can edit the file and the diagnostics update
    // and then restore + save the file and the diagnostics update
    test(`Save diagnostics test (${path})`, async () => {
      const editor = await vscode.window.showTextDocument(doc);
      const content = doc.getText();
      const diagnosticsPromise = clientNotification(
        client,
        PublishDiagnosticsNotification.type,
        (params: PublishDiagnosticsParams) => params.uri === uri.toString()
      );
      // delete all content
      await editor.edit((editBuilder) =>
        editBuilder.delete(new vscode.Range(0, 0, doc.lineCount, 0))
      );
      await doc.save();
      const diagnostics =
        (await diagnosticsPromise) as PublishDiagnosticsParams;
      assert.strictEqual(
        diagnostics.diagnostics.length,
        0,
        "Diagnostics after delete"
      );

      // restore content
      const restoreDiagnosticsPromise = clientNotification(
        client,
        PublishDiagnosticsNotification.type,
        (params: PublishDiagnosticsParams) => params.uri === uri.toString()
      );
      await editor.edit((editBuilder) =>
        editBuilder.insert(new vscode.Position(0, 0), content)
      );
      await doc.save();
      const restoreDiagnostics =
        (await restoreDiagnosticsPromise) as PublishDiagnosticsParams;
      assert.strictEqual(
        restoreDiagnostics.diagnostics.length,
        result.length,
        "No diagnostics after change"
      );
    }).timeout(SCAN_TIMEOUT);
  });
});
