import * as lc from "vscode-languageclient";

// https://github.com/rust-lang/rust-analyzer/blob/master/editors/code/src/lsp_ext.ts

export interface ScanParams {
  uri: string;
}

export interface ScanWorkspaceParams {
  full?: boolean;
}

export const scanWorkspace = new lc.NotificationType<ScanWorkspaceParams>(
  "semgrep/scanWorkspace"
);

export interface LoginParams {
  url: string;
  sessionId: string;
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
