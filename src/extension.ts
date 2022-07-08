import { workspace, ConfigurationChangeEvent, ExtensionContext } from "vscode";

import { VSCODE_CONFIG_KEY } from "./constants";
import { activateLsp, deactivateLsp, restartLsp } from "./lsp";
import activateSearch from "./search";
import { Environment } from "./env";
import { registerCommands } from "./commands";
import { LanguageClient } from "vscode-languageclient/node";
import { activateRuleExplorer } from "./rule_explorer";

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

export async function activate(context: ExtensionContext): void {
  const env: Environment = await createOrUpdateEnvironment(context);

  const client = await activateLsp(env);
  // This will be moved to LSP
  //activateSearch(env);
  if (client) {
    //activateRuleExplorer(client,false);
    registerCommands(env, client);
    // Handle configuration changes
    context.subscriptions.push(
      workspace.onDidChangeConfiguration(
        async (event: ConfigurationChangeEvent) => {
          if (event.affectsConfiguration(VSCODE_CONFIG_KEY)) {
            await env.reloadConfig();
            client.sendNotification("workspace/didChangeConfiguration", {
              settings: env.config.cfg,
            });
          }
        }
      )
    );
  }
}

export async function deactivate(client: LanguageClient): void {
  await deactivateLsp(global_env, client);
  global_env?.dispose();
  global_env = null;
}

export async function restart(
  context: ExtensionContext,
  client: LanguageClient
): void {
  const env: Environment = await createOrUpdateEnvironment(context);

  env.logger.log("Restarting language client...");
  await restartLsp(env, client);
  env.logger.log("Restarted language client...");
}
