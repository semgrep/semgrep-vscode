import {
  ExtensionContext,
  OutputChannel,
  Uri,
  WorkspaceConfiguration,
} from "vscode";
import { window, workspace } from "vscode";

import { LSP_LOG_FILE, VSCODE_CONFIG_KEY, VSCODE_EXT_NAME } from "./constants";
import { DEFAULT_LSP_LOG_URI, Logger } from "./utils";

export class Config {
  get cfg(): WorkspaceConfiguration {
    return workspace.getConfiguration(VSCODE_CONFIG_KEY);
  }
  get<T>(path: string): T | undefined {
    return this.cfg.get<T>(path);
  }

  get logging(): boolean {
    return this.cfg.get<boolean>("logging") ?? false;
  }

  get path(): string {
    return this.cfg.get<string>("path") ?? "semgrep";
  }
}

export class Environment {
  _config: Config = new Config();
  semgrep_log: Uri = DEFAULT_LSP_LOG_URI;

  private constructor(
    readonly context: ExtensionContext,
    config: Config,
    readonly channel: OutputChannel,
    readonly logger: Logger
  ) {
    this._config = config;
    this.semgrep_log = Uri.joinPath(context.logUri, LSP_LOG_FILE);
  }

  get config(): Config {
    return this._config;
  }

  set config(config: Config) {
    this._config = config;
  }

  static async create(context: ExtensionContext): Promise<Environment> {
    const config = await Environment.loadConfig(context);
    const channel = window.createOutputChannel(VSCODE_EXT_NAME);
    const logger = new Logger(config.logging, channel);
    return new Environment(context, config, channel, logger);
  }

  static async loadConfig(context: ExtensionContext): Promise<Config> {
    const config = new Config();
    if (config.logging) {
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
    this.logger.enableLogger(this.config.logging);
    return this;
  }

  dispose(): void {
    this.channel.dispose();
  }
}
