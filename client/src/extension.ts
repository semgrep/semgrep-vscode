import * as fs from "fs";
import * as path from "path";
import { ExtensionContext } from "vscode";
import {
  CLIENT_ID,
  CLIENT_NAME,
  DIAGNOSTIC_COLLECTION_NAME,
} from "./constants";
import activateSearch from './search';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  ExecutableOptions,
  Executable
} from "vscode-languageclient/node";
import { window, workspace, OutputChannel } from "vscode";

import * as which from "which";
import { searchPatternWorkspace } from "./search";

let client: LanguageClient;

export async function activate(context: ExtensionContext) {
  void window.showInformationMessage('Starting Semgrep extension...');

  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

  // Look up the binary path for the language server
  const serverName = "semgrep-rpc.sh";
  const server = which.sync(serverName, {nothrow: true});
  console.log("Found server binary at:", server);

  let cwd = ".";
  if (server) {
    cwd = path.dirname(fs.realpathSync(server));
    console.log("  ... cwd := ", cwd);
  }
  let cmdlineOpts = [];
  cmdlineOpts.push(...["--lsp"]);

  let semgrep_config = workspace.getConfiguration("semgrep");
  let semgrep_rules = semgrep_config["rules"];
  if (semgrep_rules) {
    cmdlineOpts.push(...["--config", semgrep_rules]);
  }

  let runOptions: ExecutableOptions = {
    cwd: cwd,
    // cwd?: string;
    // env?: any;
    // detached?: boolean;
    // shell?: boolean;
  };
  const run: Executable = {
    command: serverName,
    args: cmdlineOpts,
    options: runOptions,
  };
  const serverOptions: ServerOptions = {
    run,
    debug: run,
  };
  console.log("Semgrep LSP server executable := ", run);

  let outputChannel: OutputChannel = window.createOutputChannel(CLIENT_NAME);

  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    diagnosticCollectionName: DIAGNOSTIC_COLLECTION_NAME,
    documentSelector: [{ language: "*" }],
    outputChannel,
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    CLIENT_ID,
    CLIENT_NAME,
    serverOptions,
    clientOptions
  );

  // Start the client. This will also launch the server
  console.log("Starting language client...");
  client.start();

  workspace.onDidChangeConfiguration(() =>
    {restart(context);}, null, context.subscriptions
  );
  activateSearch(context);
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  console.log("Stopping language client...");
  let ret = client.stop();
  console.log("Language client stopped... ret := ", ret);

  // TODO: This promise is not resolved, even though the server has quit. Why?
  // return ret;
  return undefined;
}

// Using the same approach as the rust-analyzer extension
// https://github.com/rust-lang/rust-analyzer/blob/master/editors/code/src/main.ts
export async function restart(context: ExtensionContext) {
  void window.showInformationMessage('Reloading Semgrep extension...');
  console.log("Reloading language client...");
  await deactivate();
  while (context.subscriptions.length > 0) {
    try {
      context.subscriptions.pop()!.dispose();
    } catch (err) {
      console.log("Dispose error:", err);
    }
  }
  await activate(context).catch(console.log);
}
