import { tmpdir } from "os";
import { OutputChannel, Uri } from "vscode";

import { LSP_LOG_FILE } from "./constants";

export const DEFAULT_LSP_LOG_URI = Uri.joinPath(
  Uri.file(tmpdir()),
  LSP_LOG_FILE
);

export class Logger {
  enabled: boolean;
  channel: OutputChannel;

  constructor(enabled: boolean, channel: OutputChannel) {
    this.enabled = enabled;
    this.channel = channel;
  }

  enableLogger(enabled: boolean) {
    this.enabled = enabled;
  }

  log(message: string) {
    if (this.enabled) {
      this.channel.appendLine(message);
    }
  }
}
