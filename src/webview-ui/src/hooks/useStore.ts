import { useEffect } from "react";
import { useLocalStorage } from "react-use";
import { vscode } from "../../utilities/vscode";

export interface Store {
  pattern: string;
  fix: string;
  includes: string;
  excludes: string;
}

const localStorageKeys: Record<keyof Store, string> = {
  pattern: "semgrep-search-pattern",
  fix: "semgrep-search-fix",
  includes: "semgrep-search-includes",
  excludes: "semgrep-search-excludes",
};

const store: Record<keyof Store, string> = {
  pattern: "",
  fix: "",
  includes: "",
  excludes: "",
};
export function generateUniqueID(): string {
  return Math.random().toString(36).substring(7);
}

export function useSearch(onNewSearch: (scanID: string) => void): void {
  function splitAndTrim(value: string): string[] {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");
  }
  const fixValue = store.fix === "" ? null : store.fix;
  const scanID = generateUniqueID();
  // do some naive parsing here
  const includes = splitAndTrim(store.includes);
  const excludes = splitAndTrim(store.excludes);
  onNewSearch(scanID);
  vscode.sendMessageToExtension({
    command: "webview/semgrep/search",
    pattern: store.pattern,
    fix: fixValue,
    includes: includes,
    excludes: excludes,
    scanID: scanID,
  });
}

export function useStore(key: keyof Store): [string, (value: string) => void] {
  const [field = "", setField] = useLocalStorage(localStorageKeys[key], "");
  useEffect(() => {
    store[key] = field;
  }, [field, key]);
  return [field, setField];
}
