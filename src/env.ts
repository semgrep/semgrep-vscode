import fs from "node:fs";
import { EventEmitter } from "node:stream";
import * as vscode from "vscode";
import {
  type ExtensionContext,
  type OutputChannel,
  type WorkspaceConfiguration,
  window,
  workspace,
} from "vscode";
import type { LanguageClient } from "vscode-languageclient/node";
import { VSCODE_CONFIG_KEY, VSCODE_EXT_NAME } from "./constants";
import { SemgrepDocumentProvider } from "./showAstDocument";
import { setSentryContext } from "./telemetry/sentry";
import { Logger } from "./utils";
import type { SemgrepSearchWebviewProvider } from "./views/webview";

export class Config {
  get cfg(): WorkspaceConfiguration {
    return workspace.getConfiguration(VSCODE_CONFIG_KEY);
  }
  get<T>(path: string): T | undefined {
    return this.cfg.get<T>(path);
  }

  get trace(): boolean {
    return this.cfg.get<string>("trace.server") == "verbose";
  }

  get lspjsBreakBeforeStart(): boolean {
    return this.cfg.get<boolean>("trace.lspjsBreakBeforeStart") ?? false;
  }
  get path(): string {
    return this.cfg.get<string>("path") ?? "semgrep";
  }

  get onlyGitDirty(): boolean {
    return this.cfg.get<boolean>("scan.onlyGitDirty") ?? false;
  }
  set onlyGitDirty(val: boolean) {
    this.cfg.update("scan.onlyGitDirty", val);
  }
}

export class Environment {
  public semgrepVersion: string | undefined;

  /* The scan ID is the (hopefully) unique identifier associated to each
     /semgrep/search request.
     The reason why we need it is for synchronization, in the event that
     a user issues a scan while another one is still completing. We don't
     have a good way of reaching out to each individual searchLoop()
     (which is asynchronous) and telling it to stop, so we change this
     mutable variable so that it knows to stop on its own.
   */
  public scanID: string | null = null;

  private _client: LanguageClient | null = null;
  private _provider: SemgrepSearchWebviewProvider | null = null;
  private constructor(
    readonly context: ExtensionContext,
    readonly documentView: SemgrepDocumentProvider,
    readonly channel: OutputChannel,
    readonly logger: Logger,
    public config: Config,
    // rulesRefreshedEmitter is used to notify if rules are refreshed, i.e. after startup, a login, or a manual refresh
    private rulesRefreshedEmitter: EventEmitter = new EventEmitter(),
  ) {
    setSentryContext(this);
  }

  get loggedIn(): boolean {
    return this.context.globalState.get("loggedIn", false);
  }

  set loggedIn(val: boolean) {
    vscode.commands.executeCommand("setContext", "semgrep.loggedIn", val);
    this.context.globalState.update("loggedIn", val);
  }

  get showNudges(): boolean {
    return this.context.globalState.get("showNudges", true);
  }

  set showNudges(val: boolean) {
    this.context.globalState.update("showNudges", val);
  }

  get newInstall(): boolean {
    return this.context.globalState.get("newInstall", true);
  }
  set newInstall(val: boolean) {
    this.context.globalState.update("newInstall", val);
  }

  set client(client: LanguageClient | null) {
    this._client = client;
  }

  get client(): LanguageClient | null {
    if (!this._client) {
      window.showWarningMessage("Semgrep Language Server not active");
    }
    return this._client;
  }

  get globalStoragePath(): string {
    const path = this.context.globalStorageUri.fsPath;
    // check if path exists, if not create it
    fs.mkdir(path, () => undefined);
    return path;
  }

  emitRulesRefreshedEvent(): void {
    this.rulesRefreshedEmitter.emit("refresh");
  }

  onRulesRefreshed(cb: () => void, once = false): void {
    if (once) {
      this.rulesRefreshedEmitter.once("refresh", cb);
    } else {
      this.rulesRefreshedEmitter.on("refresh", cb);
    }
  }

  set provider(provider: SemgrepSearchWebviewProvider | null) {
    if (provider) {
      this._provider = provider;
    }
  }

  get provider(): SemgrepSearchWebviewProvider | null {
    if (!this._provider) {
      window.showWarningMessage("Semgrep Search Webview not active");
    }
    return this._provider;
  }

  static async create(context: ExtensionContext): Promise<Environment> {
    const config = await Environment.loadConfig(context);
    const channel = window.createOutputChannel(VSCODE_EXT_NAME);
    const logger = new Logger(config.trace, channel);
    const documentView = new SemgrepDocumentProvider();
    return new Environment(context, documentView, channel, logger, config);
  }

  static async loadConfig(context: ExtensionContext): Promise<Config> {
    const config = new Config();
    if (config.trace) {
      await Environment.initLogDir(context);
    }

    return config;
  }

  static async initLogDir(context: ExtensionContext): Promise<void> {
    return workspace.fs.createDirectory(context.logUri);
  }

  async reloadConfig(): Promise<Environment> {
    // Reload configuration
    this.config = await Environment.loadConfig(this.context);
    this.logger.enableLogger(this.config.trace);
    setSentryContext(this);
    return this;
  }

  dispose(): void {
    this.channel.dispose();
    this.client?.dispose();
  }
}
