import {
  createConnection,
  ProposedFeatures,
  TextDocumentIdentifier,
  InitializeParams,
  DidChangeConfigurationNotification,
  TextDocumentSyncKind,
  InitializeResult,
  TextDocumentItem,
} from "vscode-languageserver/node";

import { getVersion, getDiagnostics, SemgrepRPC } from "./semgrep";
import { SETTINGS_KEY } from "./constant";
import { URL } from "url";

let connection = createConnection(ProposedFeatures.all);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;

async function registerCallbacks() {
  const version = await getVersion();
  if (version === null) {
    connection.window.showInformationMessage(
      "Semgrep is not installed, try running `pip install semgrep`. Linting will be disabled until restart."
    );
    return;
  }

  connection.console.log("Semgrep version " + version);

  // Only keep settings for open documents
  connection.onDidCloseTextDocument((params) =>
    removeTextDocument(params.textDocument)
  );

  // Listen to open/saves
  connection.onDidOpenTextDocument((params) => {
    addTextDocument(params.textDocument);
    validateTextDocument(params.textDocument);
    params.textDocument.languageId;
  });
  connection.onDidSaveTextDocument((params) =>
    validateTextDocument(params.textDocument)
  );
}
connection.onInitialize(async (params: InitializeParams) => {
  await registerCallbacks();

  let capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
    },
  };
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }
  return result;
});

let semgrepRPC: SemgrepRPC | null = null

connection.onInitialized(() => {
  semgrepRPC = new SemgrepRPC();
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event) => {
      connection.console.log("Workspace folder change event received.");
    });
  }
});

// Semgrep settings
interface SemgrepSettings {
  languages: Set<string>;
  rules: string;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
const defaultSettings: SemgrepSettings = {
  languages: new Set([
    "c",
    "go",
    "java",
    "javascript",
    "javascriptreact",
    "json",
    "ocaml",
    "php",
    "python",
    "ruby",
    "typescript",
    "typescriptreact"
  ]),
  rules: "p/r2c-ci",
};
let globalSettings: SemgrepSettings = defaultSettings;

let documents: Map<string, TextDocumentItem> = new Map();
// Cache of document settings
let documentSettings: Map<string, SemgrepSettings> = new Map();

connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = hydrateSettings(
      change.settings[SETTINGS_KEY] || defaultSettings
    );
  }

  // clear diagnostics for everything
  documents.forEach((document) =>
    connection.sendDiagnostics({ uri: document.uri, diagnostics: [] })
  );
  documents.forEach((document) => validateTextDocument(document));
});

function hydrateSettings(settings: any): SemgrepSettings {
  if (Array.isArray(settings.languages)) {
    settings.languages = new Set(settings.languages);
  }

  return settings;
}

async function getDocumentSettings(resource: string): Promise<SemgrepSettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }

  let result = documentSettings.get(resource);
  if (!result) {
    result = <SemgrepSettings>Object.assign(
      {},
      globalSettings,
      hydrateSettings(
        await connection.workspace.getConfiguration({
          scopeUri: resource,
          section: SETTINGS_KEY,
        })
      )
    );
    documentSettings.set(resource, result);
  }
  return result;
}

async function addTextDocument(textDocument: TextDocumentItem): Promise<void> {
  const url = new URL(textDocument.uri);
  if (url.protocol !== "file:") {
    return;
  }

  documents.set(textDocument.uri, textDocument);
}

async function validateTextDocument(
  textDocumentId: TextDocumentIdentifier
): Promise<void> {
  const textDocument = documents.get(textDocumentId.uri);
  if (!textDocument) {
    return;
  }

  let settings = await getDocumentSettings(textDocument.uri);
  if (!settings.languages.has(textDocument.languageId)) {
    return;
  }

  connection.console.log(
    "Scanning " + textDocument.uri + " with " + settings.rules
  );

  const diagnostics = await semgrepRPC?.getDiagnostics(textDocument.uri, settings.rules);
  // const diagnostics = await getDiagnostics(textDocument.uri, settings.rules);
  if (Array.isArray(diagnostics)) {
    // Send the computed diagnostics to VSCode.
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
  } else {
    connection.console.error("Unable to scan " + textDocument.uri);
  }
}

async function removeTextDocument(
  textDocument: TextDocumentIdentifier
): Promise<void> {
  const url = new URL(textDocument.uri);
  if (url.protocol !== "file:") {
    return;
  }

  documents.delete(textDocument.uri);
  documentSettings.delete(textDocument.uri);
}

// Listen on the connection
connection.listen();

