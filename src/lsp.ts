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
  TransportKind,
  NotificationHandler,
} from "vscode-languageclient/node";

import * as which from "which";

import * as vscode from "vscode";

import {
  SEMGREP_BINARY,
  CLIENT_ID,
  CLIENT_NAME,
  DIAGNOSTIC_COLLECTION_NAME,
} from "./constants";
import { Environment } from "./env";
import {
  aiChatMessage,
  AiChatPublishParams,
  rulesRefreshed,
} from "./lspExtensions";
import {
  SentryErrorHandler,
  ProxyOutputChannel,
  withSentryAsync,
} from "./telemetry/sentry";
import { checkCliVersion } from "./utils";

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
        "Python 3.7+ required for the Semgrep Extension",
      );
      return null;
    }
    const globalStoragePath = env.globalStoragePath;
    const cmd = `PYTHONUSERBASE="${globalStoragePath}" pip install --user --upgrade --ignore-installed semgrep`;
    try {
      await execShell(cmd);
    } catch {
      vscode.window.showErrorMessage(
        "Semgrep binary could not be installed, please see https://semgrep.dev/docs/getting-started/ for instructions",
      );
      return null;
    }
    server_path = `${globalStoragePath}/bin/semgrep`;
    env_vars = {
      ...process.env,
      PYTHONUSERBASE: globalStoragePath,
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
  if (!env.config.cfg.get("ignoreCliVersion")) {
    const cmd = `"${server.command}" --version`;
    const version = await execShell(cmd, server.options?.env);
    const semVersion = new semver.SemVer(version);
    checkCliVersion(semVersion);
    env.semgrepVersion = version;
    await env.reloadConfig();
  }

  const serverOptions: ServerOptions = server;
  env.logger.log(
    `Semgrep LSP server configuration := ${JSON.stringify(server, null, 2)}`,
  );
  return serverOptions;
}

function serverOptionsJs(env: Environment): ServerOptions {
  const serverModule = path.join(__dirname, "../lspjs/dist/semgrep-lsp.js");
  const stackSize = env.config.get("stackSizeJS");
  const heapSize = env.config.get("heapSizeJS");
  const serverOptionsJs = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: {
        execArgv: [
          `--stack-size=${stackSize}`,
          `--max-old-space-size=${heapSize}`,
        ],
      },
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: {
        execArgv: [
          "--nolazy",
          "--inspect=6009",
          `--stack-size=${stackSize}`,
          `--max-old-space-size=${heapSize}`,
        ],
      },
    },
  };
  vscode.window.showWarningMessage(
    "Semgrep Extension is using the experimental JS LSP server, this is due to the current platform being Windows, or the setting 'semgrep.useJS' being set to true. There may be bugs or performance issues!",
  );
  return serverOptionsJs;
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
  const outputChannel = new ProxyOutputChannel(
    env.channel,
    env.globalStoragePath,
  );
  const errorHandler = new SentryErrorHandler(5, () => {
    const attachment = outputChannel.logAsAttachment();

    return attachment ? [attachment] : [];
  });
  const clientOptions: LanguageClientOptions = {
    diagnosticCollectionName: DIAGNOSTIC_COLLECTION_NAME,
    // TODO: should we limit to support languages and keep the list manually updated?
    documentSelector: [{ language: "*", scheme: "file" }],
    outputChannel,
    traceOutputChannel: env.channel,
    initializationOptions: initializationOptions,
    errorHandler,
    markdown: {
      isTrusted: true,
      supportHtml: false,
    },
  };

  let serverOptions;
  if (process.platform === "win32" || env.config.get("useJS")) {
    serverOptions = serverOptionsJs(env);
  } else {
    // Don't call this before as it can crash the extension on windows
    serverOptions = await serverOptionsCli(env);
    if (!serverOptions) {
      vscode.window.showErrorMessage(
        "Semgrep Extension failed to activate, please check output",
      );
      return [null, null];
    }
  }

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
    clientOptions,
  );
  // register commands
  // Start the client. This will also launch the server
  env.logger.log("Starting language client...");

  const rulesRefreshHandler: NotificationHandler<void> = () => {
    env.logger.log("Rules loaded");
    env.emitRulesRefreshedEvent();
  };
  const aiChatHandler: NotificationHandler<AiChatPublishParams> = ({
    message,
  }: AiChatPublishParams) => {
    env.logger.log(`AI Chat: ${message}`);
    env.chatProvider?.addMessage(message);
  };
  c.onNotification(rulesRefreshed, rulesRefreshHandler);
  c.onNotification(aiChatMessage, aiChatHandler);
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
  return withSentryAsync(() => start(env));
}

export async function deactivateLsp(env: Environment | null): Promise<void> {
  return stop(env);
}

export async function restartLsp(env: Environment | null): Promise<void> {
  await stop(env);
  if (env) {
    return withSentryAsync(() => start(env));
  }
}
