import assert from "node:assert";
import cp from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import * as vscode from "vscode";
import {
  type LanguageClient,
  type ProtocolNotificationType,
  PublishDiagnosticsNotification,
  type PublishDiagnosticsParams,
} from "vscode-languageclient/node";

const SCAN_TIMEOUT = 180000;
const USE_JS = process.env["USE_JS"];
let SKIPPED_FILES: string[] = [
  "l5000.java", // Causes stack overflow
  // Currently an issue with ocaml we need to fix
  "UCommon.ml",
  "common2.ml",
  "graphe.ml",
  "Parsing_stat.ml",
  "Interactive_subcommand.ml",
  "semgrep-extension.demo.py", // doesn't work for some reason
];
if (USE_JS || process.platform === "win32") {
  const additional_skipped_files = [
    "long.py", // This one times out lspjs
    "test.ts", // Another timeout for lspjs
    "Dockerfile", // Timeout related
    "cli/bin/semgrep", // No file extension == bad on windows. This is a bug in Guess_lang on how we determine executables
    "ograph_extended", // Fails because its an ocaml file in CLRF. I don't think anyone will care about CLRF ocaml files on windows :D
    "tree_sitter.ml", // Not sure why this fails, but it does
    "Alcotest_ext.ml",
    "Assoc.ml",
    "Eval_jsonnet_envir.ml",
    "Eval_jsonnet_subst.ml",
    "Core_scan.ml",
    "Check_rule.ml",
    "Scan_subcommand.ml",
    "Matches_report.ml",
    "Parse_rule_helpers.ml",
    "Parsing_plugin.ml",
    "autofix-printing-stats/run",
    "datacreator.ts", // This one times out lspjs
    "lib/insecurity.ts",
    "server.ts",
    "routes/logfileServer.ts",
    "routes/order.ts",
    "routes/profileImageUrlUpload.ts",
    "routes/userProfile.ts",
    "routes/videoHandler.ts",
    "views/promotionVideo.pug",
    "routes/login.ts",
    "lib/startup/validatePreconditions.ts",
    "routes/redirect.ts",
    "routes/search.ts",
  ];
  SKIPPED_FILES = SKIPPED_FILES.concat(additional_skipped_files);
}
function clientNotification(
  client: LanguageClient,
  type: ProtocolNotificationType<any, any>,
  checkParams: (params: any) => boolean = () => true,
) {
  return new Promise((resolve) => {
    client.onNotification(type, (params) => {
      if (checkParams(params)) {
        resolve(params);
      }
    });
  });
}

function makeFileUntracked(cwd: string, path: string) {
  cp.execSync(`git -C ${cwd} rm --cached --ignore-unmatch ${path}`);
}

async function getEnv() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const extension = vscode.extensions.getExtension("Semgrep.semgrep")!;
  // set semgrep to use javascript
  if (USE_JS) {
    vscode.workspace
      .getConfiguration("semgrep")
      .update("useJS", true, vscode.ConfigurationTarget.Global);
  } else {
    console.log(`Using JS: false`);
  }
  // set semgrep path to development
  /*vscode.workspace
    .getConfiguration("semgrep")
    .update(
      "path",
      "<path-to-semgrep>/semgrep",
      vscode.ConfigurationTarget.Global
    );*/
  // set verbose trace
  /*vscode.workspace
    .getConfiguration("semgrep")
    .update("trace.server", "verbose", vscode.ConfigurationTarget.Global);*/

  if (!extension.isActive) {
    await extension.activate();
  }
  return extension.exports;
}

suite("Extension Features", function () {
  if (process.env["CWD"] && process.env["CWD"] !== process.cwd()) {
    console.log(`Changing CWD to ${process.env["CWD"]}`);
    process.chdir(process.env["CWD"] as string);
  }
  let client: LanguageClient;
  const workfolders = vscode.workspace.workspaceFolders;
  this.timeout(SCAN_TIMEOUT);
  if (!workfolders) {
    assert.fail("No workspace folders");
  }
  assert.strictEqual(workfolders.length, 1, "Workspace folder exists");
  const workfolderPath = workfolders[0].uri.fsPath;
  const cacheFile = `${path.basename(workfolderPath)}_results.json`;
  let semgrepResultsJson: string;
  console.log(`Using workfolder ${workfolderPath}`);
  // Check if we have cached results
  if (fs.existsSync(cacheFile)) {
    console.log(`Using cached results from ${cacheFile}`);
    semgrepResultsJson = fs.readFileSync(cacheFile).toString();
  } else {
    console.log(`Running semgrep CLI in ${workfolderPath}`);
    semgrepResultsJson = cp
      .execSync(`semgrep --json --config=auto `, {
        // needed as some repos have large outputs
        maxBuffer: 1024 * 1024 * 100,
        cwd: workfolderPath,
      })
      .toString();
    fs.writeFileSync(cacheFile, semgrepResultsJson);
  }
  // get semgrep results to compare against
  const semgrepResults = JSON.parse(semgrepResultsJson);
  const resultsHashMap: Map<string, any> = new Map();
  // group by file
  semgrepResults.results.forEach((result: any) => {
    const previousResult = resultsHashMap.get(result.path);
    resultsHashMap.set(
      result.path,
      previousResult ? previousResult.concat(result) : [result],
    );
  });

  suiteSetup(async () => {
    const filesToUnstage = Array.from(resultsHashMap.keys());
    // unstage files so the extension picks them up
    console.log(`Unstaging ${filesToUnstage.length} files`);
    for (const file of filesToUnstage) {
      makeFileUntracked(workfolderPath, file);
    }
    console.log("Starting extension");
    const env = await getEnv();
    console.log("Waiting for extension to start");
    const startupPromise = new Promise<void>((resolve) => {
      env.onRulesRefreshed(() => {
        resolve();
      });
    });
    await startupPromise;
    console.log("Extension started");
    client = env.client;
    console.log("Starting tests");
  });
  resultsHashMap.forEach((result, path) => {
    for (const skippedFile of SKIPPED_FILES) {
      // We skip tests/ here because semgrep's .semgrepignore
      // functionality is broken right now
      if (path.includes(skippedFile) || path.startsWith("tests/")) {
        console.log(`Skipping ${path} test`);
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
        (params: PublishDiagnosticsParams) => params.uri === uri.toString(),
      );
      doc = await vscode.workspace.openTextDocument(uri);
      const diagnostics =
        (await diagnosticsPromise) as PublishDiagnosticsParams;
      assert.strictEqual(
        diagnostics.diagnostics.length,
        result.length,
        "No diagnostics on open",
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
        (params: PublishDiagnosticsParams) => params.uri === uri.toString(),
      );
      // delete all content
      await editor.edit((editBuilder) =>
        editBuilder.delete(new vscode.Range(0, 0, doc.lineCount, 0)),
      );
      await doc.save();
      const diagnostics =
        (await diagnosticsPromise) as PublishDiagnosticsParams;
      assert.strictEqual(
        diagnostics.diagnostics.length,
        0,
        "Diagnostics after delete",
      );

      // restore content
      const restoreDiagnosticsPromise = clientNotification(
        client,
        PublishDiagnosticsNotification.type,
        (params: PublishDiagnosticsParams) => params.uri === uri.toString(),
      );
      await editor.edit((editBuilder) =>
        editBuilder.insert(new vscode.Position(0, 0), content),
      );
      await doc.save();
      const restoreDiagnostics =
        (await restoreDiagnosticsPromise) as PublishDiagnosticsParams;
      assert.strictEqual(
        restoreDiagnostics.diagnostics.length,
        result.length,
        "No diagnostics after change",
      );
    }).timeout(SCAN_TIMEOUT);
  });
});
