import * as fs from "fs";
import * as path from "path";
import { ExtensionContext } from "vscode";
import {
  SEMGREP_BINARY,
  CLIENT_ID,
  CLIENT_NAME,
  DIAGNOSTIC_COLLECTION_NAME,
} from "./constants";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  ExecutableOptions,
  Executable
} from "vscode-languageclient/node";
import { window, workspace, OutputChannel } from "vscode";

import * as which from "which";

let client: LanguageClient | undefined;

export async function activateLsp(context: ExtensionContext) {
  // Look up the binary path for the language server
  const server = which.sync(SEMGREP_BINARY, {nothrow: true});
  
  let cwd = ".";
  if (server) {
    console.log("Found server binary at:", server);
    cwd = path.dirname(fs.realpathSync(server));
    console.log("  ... cwd := ", cwd);
  }
  let cmdlineOpts = [];
  cmdlineOpts.push(...["lsp"]);
  // TODO: make logging configurable
  // cmdlineOpts.push(...["--debug", "--logfile", "/tmp/semgrep-lsp.log"]);

  let semgrep_config = workspace.getConfiguration("semgrep");
  let semgrep_rules = semgrep_config["rules"];
  if (semgrep_rules) {
    cmdlineOpts.push(...["--config", semgrep_rules]);
  }

  let runOptions: ExecutableOptions = {
    cwd: cwd,
    // env?: any;
    // detached?: boolean;
    // shell?: boolean;
  };
  const run: Executable = {
    command: SEMGREP_BINARY,
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
    // TODO: should we limit to support languages and keep the list manually updated?
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
  
}

export async function deactivateLsp() {
  console.log("Stopping language client...");
  await client?.stop();
  client = undefined;
  console.log("Language client stopped...");
}

// Using the same approach as the rust-analyzer extension
// https://github.com/rust-lang/rust-analyzer/blob/master/editors/code/src/main.ts
export async function restart(context: ExtensionContext) {
  console.log("Reloading language client...");
  await deactivateLsp();
  while (context.subscriptions.length > 0) {
    try {
      context.subscriptions.pop()!.dispose();
    } catch (err) {
      console.log("Dispose error:", err);
    }
  }
  await activateLsp(context).catch(console.log);
}
