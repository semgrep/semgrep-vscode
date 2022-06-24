import * as fs from "fs";
import * as path from "path";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  Executable,
} from "vscode-languageclient/node";
import { window } from "vscode";

import * as which from "which";

import {
  SEMGREP_BINARY,
  CLIENT_ID,
  CLIENT_NAME,
  DEFAULT_RULESET,
  DIAGNOSTIC_COLLECTION_NAME,
} from "./constants";
import { Environment } from "./env";
import { DEFAULT_LSP_LOG_URI } from "./utils";

let global_client: LanguageClient | null;

function findSemgrep(): string | null {
  const server = which.sync(SEMGREP_BINARY, { nothrow: true });
  if (!server) {
    window.showErrorMessage('Cannot find Semgrep!');
  }
  return server;
}

function semgrepCmdLineOpts(env: Environment): string[] {
  let cmdlineOpts = [];

  // Subcommand
  cmdlineOpts.push(...["lsp"]);

  // Logging
  if (env.config.logging) {
    cmdlineOpts.push(
      ...[
        "--debug",
        "--logfile",
        env.config.semgrep_log.scheme === "file"
          ? env.config.semgrep_log.fsPath
          : DEFAULT_LSP_LOG_URI.fsPath,
      ]
    );
  }

  // Scan config
  cmdlineOpts.push(
    ...[
      "--config",
      env.config.rules !== "" ? env.config.rules : DEFAULT_RULESET,
    ]
  );

  return cmdlineOpts;
}

function lspOptions(env: Environment): [ServerOptions | null, LanguageClientOptions] {
  const server = findSemgrep();
  
  if (!server) return [null, {}];

  env.logger.log(`Found server binary at: ${server}`);
  const cwd = path.dirname(fs.realpathSync(server));
  env.logger.log(`  ... cwd := ${cwd}`);
 
  const cmdlineOpts = semgrepCmdLineOpts(env);

  const run: Executable = {
    command: SEMGREP_BINARY,
    args: cmdlineOpts,
    options: { cwd: cwd },
  };

  const serverOptions: ServerOptions = {
    run,
    debug: run,
  };
  env.logger.log(`Semgrep LSP server configuration := ${JSON.stringify(run)}`);

  let clientOptions: LanguageClientOptions = {
    diagnosticCollectionName: DIAGNOSTIC_COLLECTION_NAME,
    // TODO: should we limit to support languages and keep the list manually updated?
    documentSelector: [{ language: "*" }],
    outputChannel: env.channel,
  };

  return [serverOptions, clientOptions];

}

function start(env: Environment): LanguageClient | null {
  // Compute LSP server and client options
  const [serverOptions, clientOptions] = lspOptions(env);
  
  // If we cannot find Semgrep, there's no point
  // in proceeding with the activation.
  if (!serverOptions) return global_client;

  // Create the language client.
  let c = global_client ||
    new LanguageClient(CLIENT_ID,
      CLIENT_NAME,
      serverOptions,
      clientOptions);

  // Start the client. This will also launch the server
  env.logger.log("Starting language client...");
  c.start();

  return c;
}

async function stop(env: Environment | null): Promise<void> {
  env?.logger.log("Stopping language client...");
  await global_client?.stop();
  env?.logger.log("Language client stopped...");
}

export function activateLsp(env: Environment) {
  global_client = start(env);
}

export async function deactivateLsp(env: Environment | null): Promise<void> {
  await stop(env);
  global_client = null;
}

export async function restartLsp(env: Environment | null): Promise<void> {
  await stop(env);
  if (env) {
    global_client = start(env);
  }
}
