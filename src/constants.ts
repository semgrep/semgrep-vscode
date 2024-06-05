import { SemVer } from "semver";

export const SEMGREP_BINARY = "semgrep";
export const DIAGNOSTIC_COLLECTION_NAME = "semgrep-findings";
export const CLIENT_ID = "semgrep";
export const CLIENT_NAME = "Semgrep";
export const DEFAULT_RULESET = "p/r2c";
export const VSCODE_CONFIG_KEY = "semgrep";
export const VSCODE_EXT_NAME = CLIENT_NAME;

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
export const SUPPORTED_LANGS = [
  "bash",
  "sh",
  "c",
  "clojure",
  "c++",
  "c#",
  "dart",
  "dockerfile",
  "elixir",
  "go",
  "hack",
  "html",
  "java",
  "javascript",
  "json",
  "jsonnet",
  "julia",
  "kotlin",
  "lisp",
  "lua",
  "ocaml",
  "php",
  "python",
  "r",
  "ruby",
  "rust",
  "scala",
  "scheme",
  "solidity",
  "sol",
  "swift",
  "terraform",
  "typescript",
  "vue",
  "xml",
  "yaml",
];
