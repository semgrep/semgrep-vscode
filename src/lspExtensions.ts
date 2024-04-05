import * as lc from "vscode-languageclient";
import { SearchResult } from "./searchResultsTree";

// https://github.com/rust-lang/rust-analyzer/blob/master/editors/code/src/lsp_ext.ts

export interface ScanParams {
  uri: string;
}

export interface ScanWorkspaceParams {
  full?: boolean;
}

export type ShowAstParams = {
  named: boolean;
  uri: string;
};

export const scanWorkspace = new lc.NotificationType<ScanWorkspaceParams>(
  "semgrep/scanWorkspace"
);

export interface LoginParams {
  url: string;
  sessionId: string;
}

export interface LoginStatusParams {
  loggedIn: boolean;
}

// These are the parameters sent from the webview to the extnesion, which
// is a superset of the parameters sent to the LSP.
// Hence, the two different types `SearchParams` and `LspSearchParams` here.
export interface SearchParams {
  scanID: string;
  lspParams: LspSearchParams;
}

export interface LspSearchParams extends lc.PartialResultParams {
  pattern: string;
  language: string | null;
  fix: string | null;
}

export const login = new lc.RequestType0<LoginParams | null, void>(
  "semgrep/login"
);

export const loginFinish = new lc.NotificationType<LoginParams>(
  "semgrep/loginFinish"
);

export const logout = new lc.NotificationType("semgrep/logout");

export const refreshRules = new lc.NotificationType("semgrep/refreshRules");

export const workspaceRules = new lc.RequestType0<any[], void>(
  "semgrep/workspaceRules"
);

export const loginStatus = new lc.RequestType0<LoginStatusParams | null, void>(
  "semgrep/loginStatus"
);

/* This means a request with parameters LspSearchParams, returning SearchResults, and with a `void`
   for the fourth and fifth parameters ("E" and "RO").
   The third parameter seems to be input to ProgressType, and decides the input type of the
   handler we pass to onProgress, to handle partial results.
 */
export const search = new lc.ProtocolRequestType<
  LspSearchParams,
  null,
  SearchResult | null,
  void,
  void
>("semgrep/search");

export const showAst = new lc.RequestType<ShowAstParams, string, void>(
  "semgrep/showAst"
);
