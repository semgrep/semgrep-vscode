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
  LATEST_VERSION,
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
      ...process.env,
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

  if (env.config.cfg.get("scan.pro_intrafile")) {
    // This might cause an error if the user has not installed Semgrep Pro Engine
    // yet on their machine.
    // Perhaps we should install it automatically for them?
    cmdlineOpts.push(...["--pro"]);
  }

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
  if (!env.config.cfg.get("ignoreCliVersion")) {
    const cmd = `"${server.command}" --version`;
    const version = await execShell(cmd, server.options?.env);
    const minor = semver.minor(version);
    const major = semver.major(version);
    vscode.commands.executeCommand("setContext", "semgrep.cli.minor", minor);
    vscode.commands.executeCommand("setContext", "semgrep.cli.major", major);
    if (!semver.satisfies(version, MIN_VERSION)) {
      vscode.window.showErrorMessage(
        `The Semgrep Extension requires a Semgrep CLI version ${MIN_VERSION}, the current installed version is ${version}, please upgrade.`
      );
      return [null, null];
    }
    if (!semver.satisfies(version, LATEST_VERSION)) {
      vscode.window.showWarningMessage(
        `Some features of the Semgrep Extension require a Semgrep CLI version ${LATEST_VERSION}, but the current installed version is ${version}, some features may be disabled, please upgrade.`
      );
    }
  }

  const serverOptions: ServerOptions = server;
  env.logger.log(
    `Semgrep LSP server configuration := ${JSON.stringify(server, null, 2)}`
  );

  const metrics = {
    machineId: vscode.env.machineId,
    isNewAppInstall: env.newInstall,
    sessionId: vscode.env.sessionId,
    extensionVersion: env.context.extension.packageJSON.version,
    extensionType: "vscode",
    enabled: vscode.env.isTelemetryEnabled,
  };
  const initializationOptions = {
    ...env.config.cfg,
  };
  initializationOptions.metrics = metrics;

  env.logger.log(
    `Semgrep Initialization Options := ${JSON.stringify(
      initializationOptions,
      null,
      2
    )}`
  );
  const clientOptions: LanguageClientOptions = {
    diagnosticCollectionName: DIAGNOSTIC_COLLECTION_NAME,
    // TODO: should we limit to support languages and keep the list manually updated?
    documentSelector: [{ language: "*", scheme: "file" }],
    outputChannel: env.channel,
    initializationOptions: initializationOptions,
    markdown: {
      isTrusted: true,
      supportHtml: false,
    },
  };

  return [serverOptions, clientOptions];
}

async function start(env: Environment): Promise<void> {
  // Compute LSP server and client options
  const [serverOptions, clientOptions] = await lspOptions(env);

  // If we cannot find Semgrep, there's no point
  // in proceeding with the activation.
  if (!serverOptions) return;

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
  env.client = c;
}

async function stop(env: Environment | null): Promise<void> {
  env?.logger.log("Stopping language client...");
  const client = env?.client;
  if (!client) {
    return;
  }
  client.sendRequest("shutdown").then(async () => {
    env?.logger.log("Exiting");
    await client.sendRequest("exit");
  });
  client.stop();
  env?.logger.log("Language client stopped...");
}

export async function activateLsp(env: Environment): Promise<void> {
  return start(env);
}

export async function deactivateLsp(env: Environment | null): Promise<void> {
  return stop(env);
}

export async function restartLsp(env: Environment | null): Promise<void> {
  await stop(env);
  if (env) {
    return start(env);
  }
}
