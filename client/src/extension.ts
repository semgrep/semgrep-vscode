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
import { window, OutputChannel } from "vscode";

import * as which from "which";
import { searchPatternWorkspace } from "./search";

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  // // The server is implemented in node
  // let serverModule = context.asAbsolutePath(
  //   path.join("server", "out", "server.js")
  // );
  
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  // let serverOptions: ServerOptions = {
  //   run: { module: serverModule, transport: TransportKind.ipc },
  //   debug: {
  //     module: serverModule,
  //     transport: TransportKind.ipc,
  //     options: debugOptions,
  //   },
  // };
  
  // Look up the binary path for the language server
  const serverName = "semgrep-rpc.sh";
  const server = which.sync(serverName, {nothrow: true});
  console.log("Found server binary at:", server);

  let cwd = ".";
  if (server) {
    cwd = path.dirname(server);
  }
  let cmdlineOpts = [];
  // TODO: Add a --config flag to pass ruleset
  cmdlineOpts.push(...["--lsp"]);

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
  client.start();
  activateSearch(context);
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }

  return client.stop();
}