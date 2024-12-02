import cp from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import * as semver from "semver";
import * as vscode from "vscode";
import {
  type Executable,
  LanguageClient,
  type LanguageClientOptions,
  type ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import type { NotificationHandler0 } from "vscode-languageserver";
import which from "which";
import {
  CLIENT_ID,
  CLIENT_NAME,
  DIAGNOSTIC_COLLECTION_NAME,
  DIST_BINARY_PATH,
  LSPJS_PATH,
  VERSION_PATH,
} from "./constants";
import type { Environment } from "./env";
import { type LspErrorParams, rulesRefreshed } from "./lspExtensions";
import {
  ProxyOutputChannel,
  SentryErrorHandler,
  captureLspError,
  withSentryAsync,
} from "./telemetry/sentry";
import { checkCliVersion } from "./utils";

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
    // check if the path exists
    if (!fs.existsSync(serverPath)) {
      // try checking if its a binary in the PATH
      serverPath = which.sync("semgrep", { nothrow: true });
    }
    // Only check the version if we're not using the packaged version
    // This is to avoid us releasing a new version of the extension late and then people get annoying popups
    if (!env.config.cfg.get("ignoreCliVersion") && serverPath) {
      const version = await execShell(serverPath, ["--version"]);
      const semVersion = new semver.SemVer(version);
      checkCliVersion(semVersion);
      env.semgrepVersion = version;
      await env.reloadConfig();
    }
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
  return serverOptions;
}

function serverOptionsJs(env: Environment): ServerOptions {
  const serverModule = LSPJS_PATH;
  const stackSize = env.config.get("stackSizeJS");
  const heapSize = env.config.get("heapSizeJS");
  const inspectMode = env.config.lspjsBreakBeforeStart
    ? "inspect-brk"
    : "inspect";
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
          `--${inspectMode}=9229`,
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
  const outputChannel = new ProxyOutputChannel(env.channel);
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
  // if we're not on windows or not using JS, we can use the CLI
  if (process.platform !== "win32") {
    serverOptions = await serverOptionsCli(env);
  }
  if (!serverOptions || env.config.get("useJS")) {
    serverOptions = serverOptionsJs(env);
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
  // Start the client. This will also launch the server
  env.logger.log("Starting language client...");

  const notificationHandler: NotificationHandler0 = () => {
    env.logger.log("Rules loaded");
    env.emitRulesRefreshedEvent();
  };

  // Register handlers here
  c.onNotification(rulesRefreshed, notificationHandler);
  c.onTelemetry((e) => {
    // We only send errors, so we can safely cast this
    // See RPC_server.ml for the definition of LspErrorParams
    const event = e as LspErrorParams;
    captureLspError(event);
  });

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
