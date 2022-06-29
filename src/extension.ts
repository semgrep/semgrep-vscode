import { workspace, ConfigurationChangeEvent, ExtensionContext } from "vscode";

import { VSCODE_CONFIG_KEY } from './constants';
import { activateLsp, deactivateLsp, restartLsp, global_client } from "./lsp";
import activateSearch from "./search";
import { Environment } from "./env";

let global_env: Environment | null = null;

async function initEnvironment(
  context: ExtensionContext
): Promise<Environment> {
  global_env = await Environment.create(context);
  return global_env;
}

async function createOrUpdateEnvironment(
  context: ExtensionContext
): Promise<Environment> {
  return global_env ? global_env.reloadConfig() : initEnvironment(context);
}

export async function activate(context: ExtensionContext) {
  const env: Environment = await createOrUpdateEnvironment(context);

  activateLsp(env);
  activateSearch(env);

  // Handle configuration changes
  context.subscriptions.push(workspace.onDidChangeConfiguration(
    async (event: ConfigurationChangeEvent) => {
      if (event.affectsConfiguration(VSCODE_CONFIG_KEY)) {
        await env.reloadConfig()
        global_client?.sendNotification("workspace/didChangeConfiguration", { settings: env.config.cfg })
      }
    }
  ));

}

export async function deactivate() {
  await deactivateLsp(global_env);
  global_env?.dispose();
  global_env = null;
}

export async function restart(context: ExtensionContext) {
  const env: Environment = await createOrUpdateEnvironment(context);

  env.logger.log("Restarting language client...");
  await restartLsp(env);
  env.logger.log("Restarted language client...");
}
