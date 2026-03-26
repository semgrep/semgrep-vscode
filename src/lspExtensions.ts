import * as lc from "vscode-languageclient";
import type { SearchResult } from "./search";
import { DeploymentInfo } from "./env";

// https://github.com/rust-lang/rust-analyzer/blob/master/editors/code/src/lsp_ext.ts

export interface ScanParams {
  uri: string;
}

export interface ScanWorkspaceParams {
  full?: boolean;
}

export const scanWorkspace = new lc.NotificationType<ScanWorkspaceParams>(
  "semgrep/scanWorkspace",
);

export interface LoginStartResponse {
  url: string;
  sessionId: string;
}

// These are the parameters sent from the webview to the extnesion, which
// is a superset of the parameters sent to the LSP.
// Hence, the two different types `SearchParams` and `LspSearchParams` here.
export interface SearchParams {
  scanID: string;
  lspParams: LspSearchParams;
}

export interface LspSearchParams {
  patterns: { positive: boolean; pattern: string }[];
  language: string | null;
  fix: string | null;
  includes: string[];
  excludes: string[];
}

export interface SearchResults {
  locations: SearchResult[];
}

export interface LspErrorParams {
  message: string;
  name: string;
  stack: string;
}

export const loginStart = new lc.RequestType0<LoginStartResponse, void>(
  "semgrep/loginStart",
);

export const loginFinish = new lc.RequestType<
  LoginStartResponse,
  DeploymentInfo | null,
  void
>("semgrep/loginFinish");

export const logout = new lc.NotificationType("semgrep/logout");

export const refreshRules = new lc.NotificationType("semgrep/refreshRules");

export const rulesRefreshed = new lc.NotificationType0(
  "semgrep/rulesRefreshed",
);

export const transientLoginError = new lc.NotificationType0(
  "semgrep/transientLoginError",
);

export const workspaceRules = new lc.RequestType0<any[], void>(
  "semgrep/workspaceRules",
);

export const loginStatus = new lc.RequestType0<DeploymentInfo | null, void>(
  "semgrep/loginStatus",
);

export const search = new lc.RequestType<LspSearchParams, SearchResults, void>(
  "semgrep/search",
);

export const searchOngoing = new lc.RequestType0<SearchResults, void>(
  "semgrep/searchOngoing",
);
