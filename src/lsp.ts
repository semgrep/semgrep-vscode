import * as fs from "fs";
import * as path from "path";
import * as cp from "child_process";
import * as semver from "semver";
const execShell = (cmd: string, env?: any) =>
  new Promise<string>((resolve, reject) => {
    cp.exec(cmd, { env: env }, (err, out) => {
      if (err) {
        return reject(err);
      }
      return resolve(out);
    });
  });

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  Executable,
} from "vscode-languageclient/node";

import * as which from "which";

import * as vscode from "vscode";

import {
  SEMGREP_BINARY,
  CLIENT_ID,
  CLIENT_NAME,
  DIAGNOSTIC_COLLECTION_NAME,
  MIN_VERSION,
} from "./constants";
import { Environment } from "./env";

async function findSemgrep(env: Environment): Promise<Executable | null> {
  let server_path = which.sync(SEMGREP_BINARY, { nothrow: true });
  let env_vars = null;
  if (env.config.path !== "semgrep") {
    server_path = env.config.path;
  }
  if (!server_path) {
    let pip = which.sync("pip", { nothrow: true });
    if (!pip) {
      pip = which.sync("pip3", { nothrow: true });
    }
    if (!pip) {
      vscode.window.showErrorMessage(
        "Python 3.7+ required for the Semgrep Extension"
      );
      return null;
    }
    fs.mkdir(env.context.globalStorageUri.fsPath, () => undefined);
    const globalstorage_path = env.context.globalStorageUri.fsPath;
    const cmd = `PYTHONUSERBASE="${globalstorage_path}" pip install --user --upgrade --ignore-installed semgrep`;
    try {
      await execShell(cmd);
    } catch {
      vscode.window.showErrorMessage(
        "Semgrep binary could not be installed, please see https://semgrep.dev/docs/getting-started/ for instructions"
      );
      return null;
    }
    server_path = `${globalstorage_path}/bin/semgrep`;
    env_vars = {
      PYTHONUSERBASE: globalstorage_path,
    };
  }

  return {
    command: server_path,
    options: {
      env: env_vars,
    },
  };
}

function semgrepCmdLineOpts(env: Environment): string[] {
  const cmdlineOpts = [];

  // Subcommand
  cmdlineOpts.push(...["lsp"]);

  // Logging
  if (env.config.trace) {
    cmdlineOpts.push(...["--debug"]);
  }

  return cmdlineOpts;
}

async function lspOptions(
  env: Environment
): Promise<[ServerOptions, LanguageClientOptions] | [null, null]> {
  const server = await findSemgrep(env);
  if (!server) {
    return [null, null];
  }

  env.logger.log(`Found server binary at: ${server.command}`);
  let cwd = path.dirname(fs.realpathSync(server.command));
  if (vscode.workspace.workspaceFolders !== undefined) {
    cwd = vscode.workspace.workspaceFolders[0].uri.path;
  }
  env.logger.log(`  ... cwd := ${cwd}`);
  const cmdlineOpts = semgrepCmdLineOpts(env);
  server.args = cmdlineOpts;
  if (server.options) {
    server.options.cwd = cwd;
  }
  const cmd = `"${server.command}" --version`;
  const version = await execShell(cmd, server.options?.env);
  if (!semver.satisfies(version, MIN_VERSION)) {
    vscode.window.showErrorMessage(
      `The Semgrep Extension requires a Semgrep CLI version ${MIN_VERSION}, the current installed version is ${version}, please upgrade.`
    );
    return [null, null];
  }

  const serverOptions: ServerOptions = server;
  env.logger.log(
    `Semgrep LSP server configuration := ${JSON.stringify(server)}`
  );
  const config = { ...env.config.cfg };
  const metrics = {
    machineId: vscode.env.machineId,
    isNewAppInstall: vscode.env.isNewAppInstall,
    sessionId: vscode.env.sessionId,
    extensionVersion: env.context.extension.packageJSON.version,
    extensionType: "vscode",
    enabled: vscode.env.isTelemetryEnabled,
  };
  const initializationOptions = {
    metrics: metrics,
    ...config,
  };
  env.logger.log(`Semgrep Initialization Options := ${initializationOptions}`);
  const clientOptions: LanguageClientOptions = {
    diagnosticCollectionName: DIAGNOSTIC_COLLECTION_NAME,
    // TODO: should we limit to support languages and keep the list manually updated?
    documentSelector: [{ language: "*", scheme: "file" }],
    outputChannel: env.channel,
    initializationOptions: initializationOptions,
  };

  return [serverOptions, clientOptions];
}

async function start(env: Environment): Promise<LanguageClient | null> {
  // Compute LSP server and client options
  const [serverOptions, clientOptions] = await lspOptions(env);

  // If we cannot find Semgrep, there's no point
  // in proceeding with the activation.
  if (!serverOptions) return null;

  // Create the language client.
  const c = new LanguageClient(
    CLIENT_ID,
    CLIENT_NAME,
    serverOptions,
    clientOptions
  );

  // register commands
  // Start the client. This will also launch the server
  env.logger.log("Starting language client...");
  await c.start();
  return c;
}

async function stop(
  env: Environment | null,
  client: LanguageClient
): Promise<void> {
  env?.logger.log("Stopping language client...");
  await client.sendRequest("shutdown").then(async () => {
    env?.logger.log("Exiting");
    await client.sendRequest("exit");
  });
  await client.stop();
  env?.logger.log("Language client stopped...");
}

export async function activateLsp(
  env: Environment
): Promise<LanguageClient | null> {
  return start(env);
}

export async function deactivateLsp(
  env: Environment | null,
  client: LanguageClient
): Promise<void> {
  await stop(env, client);
}

export async function restartLsp(
  env: Environment | null,
  client: LanguageClient
): Promise<LanguageClient | null> {
  await stop(env, client);
  if (env) {
    return start(env);
  }
  return null;
}
