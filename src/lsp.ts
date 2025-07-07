import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as semver from "semver";
import * as vscode from "vscode";
import {
  type Executable,
  LanguageClient,
  type LanguageClientOptions,
  MessageType,
  type NotificationHandler,
  NotificationHandler0,
  type ServerOptions,
  ShowMessageNotification,
  ShowMessageParams,
  TransportKind,
} from "vscode-languageclient/node";
import which from "which";
import {
  CLIENT_ID,
  CLIENT_NAME,
  DIAGNOSTIC_COLLECTION_NAME,
  DIST_BINARY_PATH,
  VERSION_PATH,
} from "./constants";
import type { Environment } from "./env";
import { type LspErrorParams, rulesRefreshed } from "./lspExtensions";
import { setupLanguageClientTracing } from "./utilities/tracing";

const execShell = (cmd: string, args: string[]) =>
  new Promise<string>((resolve, reject) => {
    cp.execFile(cmd, args, (err, out) => {
      if (err) {
        return reject(err);
      }
      return resolve(out);
    });
  });

async function findSemgrep(env: Environment): Promise<Executable | null> {
  let serverPath;
  // First, check if the user has set the path to the Semgrep binary, use that always
  if (env.config.path.length > 0) {
    serverPath = env.config.path;
  }

  // check if the path exists
  if (!serverPath || !fs.existsSync(serverPath)) {
    // try checking if its a binary in the PATH
    serverPath = which.sync("semgrep", { nothrow: true });
  }
  // Only check the version if we're not using the packaged version
  // This is to avoid us releasing a new version of the extension late and then people get annoying popups
  if (!env.config.cfg.get("ignoreCliVersion") && serverPath) {
    // 'osemgrep --version' fails; not sure how intentional that is.
    const version = await execShell(serverPath, ["show", "version"]);
    const semVersion = new semver.SemVer(version);
    env.semgrepVersion = version;
    await env.reloadConfig();
  }

  if (!serverPath) {
    serverPath = DIST_BINARY_PATH;
    // Read version from extension's shipped version file
    // This is hacky, we should instead exec the binary with --version like we did previously, but that is currently off by one release always
    const version = fs
      .readFileSync(VERSION_PATH)
      .toString()
      .trim()
      .replace("release-", "");
    env.semgrepVersion = version;
    await env.reloadConfig();
  }

  // one last check to see if the binary exists
  if (fs.existsSync(serverPath)) {
    return {
      command: serverPath,
    };
  } else {
    return null;
  }
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

  if (env.config.cfg.get("useExperimentalLS")) {
    cmdlineOpts.push(...["--x-eio-ls"]);
  }

  return cmdlineOpts;
}

async function serverOptionsCli(
  env: Environment,
): Promise<ServerOptions | null> {
  const server = await findSemgrep(env);
  if (!server) {
    return null;
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

  const serverOptions: ServerOptions = server;
  env.logger.log(
    `Semgrep LSP server configuration := ${JSON.stringify(server, null, 2)}`,
  );
  if (process.platform === "win32") {
    vscode.window.showWarningMessage(
      "The Semgrep Extension on Windows is experimental. Please report any issues here: https://github.com/semgrep/semgrep-vscode/issues",
    );
  }
  return serverOptions;
}

async function lspOptions(
  env: Environment,
): Promise<[ServerOptions, LanguageClientOptions] | [null, null]> {
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
      2,
    )}`,
  );
  const clientOptions: LanguageClientOptions = {
    diagnosticCollectionName: DIAGNOSTIC_COLLECTION_NAME,
    // TODO: should we limit to support languages and keep the list manually updated?
    documentSelector: [{ language: "*", scheme: "file" }],
    traceOutputChannel: env.channel,
    initializationOptions: initializationOptions,
    // OLD: This used to be a Sentry error handler.
    // THINK: Can we add OpenTelemetry errors that are not part of a span?
    // errorHandler,
    markdown: {
      isTrusted: true,
      supportHtml: false,
    },
  };

  // try to use the native binary
  const serverOptions = await serverOptionsCli(env);

  if (!serverOptions) {
    // If we cannot find the Semgrep binary, we cannot proceed
    vscode.window.showErrorMessage(
      "Failed to start server, likely Semgrep binary not found.",
    );
    return [null, null];
  }

  return [serverOptions, clientOptions];
}

async function start(env: Environment): Promise<void> {
  // TODO: Remove when semgrep is no longer experimental on Windows.
  if (process.platform === "win32") process.env.SEMGREP_FORCE_INSTALL = "1";

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
    clientOptions,
  );
  // Start the client. This will also launch the server
  env.logger.log("Starting language client...");

  if (env.config.get("metrics")) {
    // We instrument the language client with tracing so we can get
    // spans for the requests that it is making.
    // Because we monkeypatch several methods that it contains, we
    // must do this as soon as possible after it is created.
    await setupLanguageClientTracing(env, c);
  } else {
    env.logger.log("Metrics are disabled, not setting up tracing...");
  }

  const notificationHandler: NotificationHandler0 = () => {
    env.logger.log("Rules loaded");
    env.emitRulesRefreshedEvent();
  };
  // Register handlers here
  c.onNotification(rulesRefreshed, notificationHandler);
  // TODO: Add OpenTelemetry telemetry handler here
  // c.onTelemetry((e) => { })

  env.client = c;
  await c.start();
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
