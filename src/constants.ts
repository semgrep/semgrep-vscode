import path from "node:path";
import { SemVer } from "semver";

export const SEMGREP_BINARY = "semgrep";
export const DIAGNOSTIC_COLLECTION_NAME = "semgrep-findings";
export const CLIENT_ID = "semgrep";
export const CLIENT_NAME = "Semgrep";
export const DEFAULT_RULESET = "p/r2c";
export const VSCODE_CONFIG_KEY = "semgrep";
export const VSCODE_EXT_NAME = CLIENT_NAME;
export const DIST_PATH = path.join(__dirname, "../dist");
export const LSPJS_PATH = path.join(DIST_PATH, "lspjs/semgrep-lsp.js");
export const DIST_BINARY_PATH = path.join(DIST_PATH, "osemgrep-pro");
export const VERSION_PATH = path.join(__dirname, "../semgrep-version");

export type VersionInfo = {
  latest: SemVer;
  min: SemVer;
};

export async function getVersionInfo(): Promise<VersionInfo | undefined> {
  const url = "https://semgrep.dev/api/check-version";
  try {
    const response = await fetch(url).then((response) => response.json());
    return {
      latest: new SemVer(response.latest),
      min: new SemVer(response.versions.minimum),
    };
  } catch (e) {
    return undefined;
  }
}
