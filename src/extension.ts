import { ExtensionContext } from "vscode";

import {activateLsp, deactivateLsp} from './lsp';
import activateSearch from './search';

export async function activate(context: ExtensionContext) {
  activateLsp(context);
  activateSearch(context);
}

export async function deactivate() {
  deactivateLsp();
}
