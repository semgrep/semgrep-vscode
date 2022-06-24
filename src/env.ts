import { ExtensionContext, OutputChannel, Uri } from "vscode";
import { window, workspace } from "vscode";

import { LSP_LOG_FILE, VSCODE_CONFIG_KEY, VSCODE_EXT_NAME } from "./constants";
import { DEFAULT_LSP_LOG_URI, Logger } from "./utils";

export class Config {
  logging: boolean = false;
  rules: string = "";
  semgrep_log: Uri = DEFAULT_LSP_LOG_URI;
}

export class Environment {
  _config: Config = new Config();

  private constructor(
    readonly context: ExtensionContext,
    config: Config,
    readonly channel: OutputChannel,
    readonly logger: Logger
  ) {
    this._config = config;
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
    let config = new Config();
    let workspace_config = workspace.getConfiguration(VSCODE_CONFIG_KEY);
    config.rules = workspace_config.get("rules", "");
    config.logging = workspace_config.get("logging", false);
    config.semgrep_log = Uri.joinPath(context.logUri, LSP_LOG_FILE);

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

  dispose() {
    this.channel.dispose();
  }
}
