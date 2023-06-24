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

export interface SearchParams {
  pattern: string;
  language: string | null;
}

export interface SearchResults {
  locations: SearchResult[];
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

export const search = new lc.RequestType<SearchParams, SearchResults, void>(
  "semgrep/search"
);

export const showAst = new lc.RequestType<ShowAstParams, string, void>("semgrep/showAst");